import { useState, useRef, useMemo, useEffect, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "./firebase"
import styles from "./App.module.css"
import AuthPage from "./components/AuthPage"
import TrialBanner from "./components/TrialBanner"
import { useAuth } from "./contexts/AuthContext"
import RoomSettingsFloating from "./components/RoomSettingsFloating"
import DesignCanvas from "./components/DesignCanvas"
import FixturePanel from "./components/FixturePanel"
import FloorTabsBar from "./components/FloorTabsBar"
import RoomTabsBar from "./components/RoomTabsBar"
import ElectricalPanel from "./components/ElectricalPanel"
import ElectricalSummary from "./components/ElectricalSummary"
import EmergencyPanel from "./components/EmergencyPanel"
import ReportPanel from "./components/ReportPanel"
import LoadProjectModal from "./components/LoadProjectModal"
import AIRecommender from "./components/AIRecommender"
import ConnectionStatus from "./components/ConnectionStatus"
import { FIXTURE_LIBRARY, FIXTURE_MAP, CATEGORY_META, CATEGORY_VISUAL } from "./data/fixtureLibrary"
import { saveProject, loadProject, shareProject as fbShareProject, checkAiLimit, incrementAiCall } from "./firebase"
import { fromMM, getStoredUnit } from "./utils/units"
import { getTemplate } from "./templates/projectTemplates"
import { useToast as useToastNotify } from "./components/Toast"
import { useConfirm }                 from "./components/ConfirmModal"

const CANVAS_W        = 1400
const CANVAS_H        = 750
const MAX_CIRCUIT_WATT = 800
const DALI_BUS_MAX    = 60
const MAINT_FACTOR    = 0.8   // standard maintenance factor (MF) for lumen-method

// Shared grid formula — used by both autoPlaceLights and suggestedFixtures display
function calcGrid(targetLux, areaM2, uf, fixtureLumens, roomWidth, roomHeight) {
  const requiredLumens = (targetLux * areaM2) / (uf * MAINT_FACTOR)
  const numFixtures    = Math.max(1, Math.ceil(requiredLumens / fixtureLumens))
  const cols           = Math.max(1, Math.round(Math.sqrt(numFixtures * (roomWidth / roomHeight))))
  const rows           = Math.ceil(numFixtures / cols)
  return { requiredLumens, numFixtures, rows, cols, total: rows * cols }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function computeLuxBreakdown(lights, areaM2) {
  if (areaM2 === 0) return []
  const groups = {}
  for (const light of lights) {
    const fid = light.fixtureId ?? "unknown"
    if (!groups[fid]) groups[fid] = {
      fixture:     FIXTURE_MAP[fid] ?? { id: fid, label: "Custom", fill: "#ffe9b0", stroke: "#ffb300" },
      count:       0,
      totalLumens: 0,
    }
    groups[fid].count++
    groups[fid].totalLumens += (light.lumens ?? 0)
  }
  return Object.values(groups)
    .map(g => ({ fixture: g.fixture, count: g.count, totalLumens: g.totalLumens, lux: g.totalLumens / areaM2 }))
    .sort((a, b) => b.lux - a.lux)
}

function calcRCR(widthMm, heightMm, mh) {
  const W = widthMm / 1000, L = heightMm / 1000
  if (!W || !L || mh <= 0) return 0
  return (5 * mh * (W + L)) / (W * L)
}

function calcUF(rcr) {
  return Math.max(0.3, Math.min(0.85, 0.85 - 0.04 * rcr))
}

function makeLight(id, x, y, fixture, lumensOverride) {
  const vis = fixture?.category ? CATEGORY_VISUAL[fixture.category] ?? {} : {}
  return {
    id, x, y,
    fixtureId:    fixture?.id,
    category:     fixture?.category ?? null,
    lumens:       lumensOverride ?? fixture?.lumens ?? 0,
    watt:         fixture?.watt ?? 0,
    beamAngle:    fixture?.beamAngle ?? 36,
    fill:         fixture?.fill        ?? vis.fill        ?? "#ffe9b0",
    stroke:       fixture?.stroke      ?? vis.stroke      ?? "#ffb300",
    glowColor:    fixture?.glowColor   ?? vis.glowColor   ?? "rgba(255,179,0,0.08)",
    visualRadius: fixture?.visualRadius ?? vis.visualRadius ?? 6,
    fixtureShape: fixture?.fixtureShape ?? vis.fixtureShape ?? 'circle',
    protocol:     fixture?.protocol ?? null,
    brand:        fixture?.brand ?? null,
    label:        fixture?.label ?? fixture?.name ?? "Fixture",
  }
}

// ── Circuit computation (per room) ────────────────────────────────────────────

function computeCircuits(lights) {
  const PHASES = ["L1", "L2", "L3"]
  const result = []
  let cur = null, phaseIdx = 0, num = 0
  for (const light of lights) {
    const w = light.watt ?? 0
    if (!cur || cur.totalWatt + w > MAX_CIRCUIT_WATT) {
      num++
      cur = {
        circuitId: `C${num}`,
        phase:     PHASES[(phaseIdx++) % 3],
        fixtures:  [],
        totalWatt: 0,
        mcb:       "6A",
        wireSize:  "1.5mm²",
      }
      result.push(cur)
    }
    cur.fixtures.push(light)
    cur.totalWatt += w
    cur.mcb      = cur.totalWatt <= 1380 ? "6A" : cur.totalWatt <= 2300 ? "10A" : "16A"
    cur.wireSize = cur.totalWatt <= 2944 ? "1.5mm²" : "2.5mm²"
  }
  return result
}

// ── DALI address assignment (project-wide) ────────────────────────────────────

function computeDaliAddresses(floors) {
  const byId   = {}
  const busMap = {}
  let busNum = 1, addr = 0
  for (const floor of floors) {
    for (const roomObj of floor.rooms) {
      const roomProto = roomObj.room?.roomProtocol ?? "NON-DIM"
      for (const light of roomObj.lights) {
        const effectiveProto = (light.protocol && light.protocol !== "Room Default")
          ? light.protocol : roomProto
        if (effectiveProto !== 'DALI') continue
        addr++
        if (addr > DALI_BUS_MAX) { busNum++; addr = 1 }
        const busId = `Bus ${busNum}`
        byId[light.id] = { address: addr, busId }
        if (!busMap[busId]) busMap[busId] = { lights: [], rooms: [] }
        busMap[busId].lights.push({ lightId: light.id, address: addr })
        if (!busMap[busId].rooms.includes(roomObj.name)) busMap[busId].rooms.push(roomObj.name)
      }
    }
  }
  const buses = Object.entries(busMap).map(([id, d]) => ({
    id, lights: d.lights, rooms: d.rooms,
  }))
  return { byId, buses }
}

// ── DALI cable lengths (per bus) ──────────────────────────────────────────────

function computeBusCableLengths(floors, daliAddresses) {
  if (!daliAddresses || daliAddresses.buses.length === 0) return {}
  const result = {}
  for (const busData of daliAddresses.buses) {
    const busId = busData.id
    let totalCable = 0, noCtr = false
    outer: for (const floor of floors) {
      for (const room of floor.rooms) {
        const lightsOnBus = room.lights.filter(l => daliAddresses.byId[l.id]?.busId === busId)
        if (lightsOnBus.length === 0) continue
        const ctr = room.ctrMarkers?.[0]
        if (!ctr) { noCtr = true; break outer }
        const rW = Number(room.room.roomWidth), rH = Number(room.room.roomHeight)
        if (rW > 0 && rH > 0) {
          const SCALE = Math.min((CANVAS_W - 260) / rW, (CANVAS_H - 220) / rH)
          for (const light of lightsOnBus) {
            const dx = (light.x ?? 0) - ctr.x
            const dy = (light.y ?? 0) - ctr.y
            totalCable += Math.sqrt(dx * dx + dy * dy) / (SCALE * 1000)
          }
        }
      }
    }
    result[busId] = noCtr
      ? { noCtr: true,  totalCableM: 0 }
      : { noCtr: false, totalCableM: totalCable * 1.2 }
  }
  return result
}

// ── Per-room electrical summary ───────────────────────────────────────────────

function computePerRoomSummary(floors, daliAddresses, busTopologies, busCableLengths) {
  // busCableLengths is now an array of { busId, totalCableM }
  function getCableEntry(busId) {
    if (Array.isArray(busCableLengths)) return busCableLengths.find(b => b.busId === busId)
    return busCableLengths?.[busId]  // fallback for old object shape
  }
  return floors.flatMap(floor =>
    floor.rooms.map(room => {
      const circuits    = computeCircuits(room.lights)
      const phasesUsed  = [...new Set(circuits.map(c => c.phase))]
      const daliBusNums = [...new Set(room.lights.map(l => daliAddresses.byId[l.id]?.busId).filter(Boolean))]
      const topologies  = daliBusNums.map(b => busTopologies?.[b] ?? "daisy")
      const noCtr       = false  // new busCableLengths array never has noCtr
      const cableM      = daliBusNums.reduce((s, b) => s + (getCableEntry(b)?.totalCableM ?? 0), 0)
      return {
        name:         `${floor.name} · ${room.name}`,
        fixtures:     room.lights.length,
        load:         room.lights.reduce((s, l) => s + (l.watt ?? 0), 0),
        circuitCount: circuits.length,
        phasesUsed,
        daliBusNums,
        topologies,
        noCtr,
        cableM: noCtr ? null : cableM,
      }
    })
  )
}

// ── Default room settings ─────────────────────────────────────────────────────

const DEFAULT_ROOM = {
  roomWidth: 6000, roomHeight: 4000,
  ceilingHeight: 2.8, falseCeiling: 0.3, workingPlane: 0.8,
  targetLux: 300, fixtureLumens: 900,
  ceilingReflectance: 0.7, wallReflectance: 0.5, floorReflectance: 0.2,
  roomProtocol: "NON-DIM",
  roomType: "Living Room",
}

const PROTOCOL_DIMMING = {
  "NON-DIM":   "Non-dim",
  "PHASE-CUT": "Triac/Phase-cut",
  "0-10V":     "0-10V Analog",
  "DALI":      "DALI 2.0",
  "ZIGBEE":    "Zigbee",
}

// ── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const nextId        = useRef(10)
  const uid           = () => nextId.current++
  const navigate      = useNavigate()
  const [searchParams] = useSearchParams()
  const { getTrialStatus, userDoc } = useAuth()
  const notify  = useToastNotify()
  const confirm = useConfirm()

  const [user,        setUser]        = useState(undefined)  // undefined = loading
  const [authLoading, setAuthLoading] = useState(true)
  const [gateModal,   setGateModal]   = useState(null)  // null | { feature: string }

  function isProActive() {
    const sub = userDoc?.subscription
    // Paid: must have status=active AND a real plan
    if (sub?.status === 'active' && (sub.plan === 'pro' || sub.plan === 'professional')) return true
    // Trial: within 14-day window
    const { status } = getTrialStatus()
    return status === 'trial'
  }

  function isProfessional() {
    const sub = userDoc?.subscription
    return sub?.status === 'active' && sub?.plan === 'professional'
  }

  function isPaidPlan() {
    const sub = userDoc?.subscription
    return sub?.status === 'active' && (sub?.plan === 'pro' || sub?.plan === 'professional')
  }

  function getRoomLimit() {
    const sub = userDoc?.subscription
    if (sub?.status === 'active' && sub?.plan === 'professional') return Infinity
    if (sub?.status === 'active' && sub?.plan === 'pro') return 5
    return 3
  }

  function requirePro(feature, action) {
    if (isProActive()) {
      action()
    } else {
      setGateModal({ feature })
    }
  }

  // AI tab gate — checks subscription AND monthly call limit
  async function openAiTab() {
    if (!isProActive()) { setGateModal({ feature: 'AI Recommend' }); return }
    if (!user) return
    try {
      const { allowed, used, limit } = await checkAiLimit(user.uid)
      if (!allowed) {
        notify.warning(`AI call limit reached (${used}/${limit} this month). Resets on the 1st.`)
        return
      }
    } catch (e) { console.error('Failed to check AI limit:', e) /* non-fatal — allow through if check fails */ }
    setLeftSidebarCollapsed(false)
    setLeftTab('ai')
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u ?? null)
      setAuthLoading(false)
      // Redirect to dashboard if logged in and no project/new param in URL
      if (u) {
        const hasProjectId = searchParams.get("projectId")
        const hasNew       = searchParams.get("new")
        if (!hasProjectId && !hasNew) {
          navigate("/dashboard", { replace: true })
        }
      }
    })
    return unsub
  }, [])

  const [floors, setFloors] = useState(() => [{
    id: 1, name: "Floor 1", activeRoomId: 1, floorPlan: null,
    rooms: [{
      id: 1, name: "Room 1",
      room: { ...DEFAULT_ROOM },
      lights: [], dbMarkers: [], ctrMarkers: [], jbMarkers: [], emergencyLights: [],
    }],
  }])
  const [activeFloorId,      setActiveFloorId]      = useState(1)
  const [activeTool,         setActiveTool]         = useState("fixture")
  const [activeFixtureId,    setActiveFixtureId]    = useState(FIXTURE_LIBRARY[0].id)
  const [snapToGrid,         setSnapToGrid]         = useState(true)
  const [daliEnabled,        setDaliEnabled]        = useState(false)
  const [daliNodeLimit,      setDaliNodeLimit]      = useState(64)
  const [busTopologies,      setBusTopologies]      = useState({})
  const [showReport,         setShowReport]         = useState(false)
  const [showExportModal,    setShowExportModal]    = useState(false)
  const [exportRoomIds,      setExportRoomIds]      = useState([])
  const canvasRef = useRef(null)
  const lastAddLightTime = useRef(0)
  const [showLoadModal,      setShowLoadModal]      = useState(false)
  const [toast,              setToast]              = useState(null)   // string | null
  const [recentCustom,       setRecentCustom]       = useState([])
  const [projectId,          setProjectId]          = useState(null)
  const [projectName,        setProjectName]        = useState("Untitled Project")
  const [editingName,        setEditingName]        = useState(false)
  const [saving,             setSaving]             = useState(false)
  const [showSettings,       setShowSettings]       = useState(false)
  const [showAIRecommender,  setShowAIRecommender]  = useState(false)
  const [leftTab,            setLeftTab]            = useState('fixture')
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false)
  const [settingsPos,        setSettingsPos]        = useState({ x: 10, y: 50 })
  const [showVisualEditor,   setShowVisualEditor]   = useState(false)
  const [visualEditorPos,    setVisualEditorPos]    = useState({ x: 400, y: 50 })
  const [showBeam,           setShowBeam]           = useState(false)
  const [showHeatmap,        setShowHeatmap]        = useState(false)
  const [showEmergency,      setShowEmergency]      = useState(false)
  const [emergencyDuration,  setEmergencyDuration]  = useState("1hr")
  const [showWelcome,        setShowWelcome]        = useState(() => {
    try { return !localStorage.getItem("lumina_welcome_dismissed") } catch { return true }
  })
  const [showShortcuts,      setShowShortcuts]      = useState(false)
  const [hoveredLight,       setHoveredLight]       = useState(null)
  const [selectedLights,     setSelectedLights]     = useState([])

  // ── Derived active data ───────────────────────────────────────────────────

  const activeFloor   = floors.find(f => f.id === activeFloorId) ?? floors[0]
  const activeRoomId  = activeFloor.activeRoomId
  const activeRoomObj = activeFloor.rooms.find(r => r.id === activeRoomId) ?? activeFloor.rooms[0]
  const { room, lights, dbMarkers, ctrMarkers, jbMarkers, emergencyLights = [], roomOffsetX, roomOffsetY, drawnWidthPx, drawnHeightPx } = activeRoomObj
  const floorPlan = activeFloor.floorPlan ?? null

  const activeFixture         = recentCustom.find(f => f.id === activeFixtureId) ?? FIXTURE_MAP[activeFixtureId] ?? FIXTURE_LIBRARY[0]
  const activeFixtureCategory = activeFixture?.category ?? null
  const resolvedFixtures      = [...FIXTURE_LIBRARY, ...recentCustom]

  const roomWidth   = Number(room.roomWidth)
  const roomHeight  = Number(room.roomHeight)
  const areaM2      = (roomWidth / 1000) * (roomHeight / 1000)
  const mh          = Number(room.ceilingHeight) - Number(room.falseCeiling) - Number(room.workingPlane)
  const rcr         = calcRCR(roomWidth, roomHeight, mh)
  const uf          = calcUF(rcr)
  const totalLumens = lights.reduce((s, l) => s + (l.lumens ?? 0), 0)
  const totalWatt   = lights.reduce((s, l) => s + (l.watt   ?? 0), 0)
  const totalLux    = areaM2 === 0 ? 0 : totalLumens / areaM2
  const luxBreakdown = computeLuxBreakdown(lights, areaM2)

  // ── Global / project summary ──────────────────────────────────────────────

  const allRooms             = floors.flatMap(f => f.rooms)
  const projectTotalFixtures = allRooms.reduce((s, r) => s + r.lights.length, 0)
  const projectTotalWatt     = allRooms.reduce((s, r) => s + r.lights.reduce((a, l) => a + (l.watt ?? 0), 0), 0)
  const roomsWithLights      = allRooms.filter(r => r.lights.length > 0)
  const projectAvgLux = roomsWithLights.length === 0 ? 0 : Math.round(
    roomsWithLights.reduce((s, r) => {
      const a = (Number(r.room.roomWidth) / 1000) * (Number(r.room.roomHeight) / 1000)
      return s + (a > 0 ? r.lights.reduce((x, l) => x + (l.lumens ?? 0), 0) / a : 0)
    }, 0) / roomsWithLights.length
  )

  // ── Electrical derived values ─────────────────────────────────────────────

  const circuits        = computeCircuits(lights)
  const daliAddresses = useMemo(() => {
    const byId = {}
    const buses = []
    const safeLimit = daliNodeLimit - 4
    let currentBusLights = []
    let busIndex = 1

    floors.forEach(floor => {
      floor.rooms.forEach(room => {
        room.lights.forEach(light => {
          const effectiveProtocol = (light.protocol && light.protocol !== 'Room Default')
            ? light.protocol
            : room.room?.roomProtocol
          if (effectiveProtocol === 'DALI') {
            if (currentBusLights.length >= safeLimit) {
              buses.push({
                id: `Bus ${busIndex}`,
                lights: [...currentBusLights],
                nodeLimit: daliNodeLimit,
                safeLimit
              })
              busIndex++
              currentBusLights = []
            }
            const address = currentBusLights.length + 1
            currentBusLights.push({ lightId: light.id, address, roomName: room.name, floorName: floor.name })
            byId[light.id] = { address, busId: `Bus ${busIndex}`, busIndex }
          }
        })
      })
    })
    if (currentBusLights.length > 0) {
      buses.push({
        id: `Bus ${busIndex}`,
        lights: [...currentBusLights],
        nodeLimit: daliNodeLimit,
        safeLimit
      })
    }
    return { byId, buses, nodeLimit: daliNodeLimit }
  }, [floors, daliNodeLimit])
  const busCableLengths = useMemo(() => {
    return daliAddresses.buses.map(bus => {
      const total = bus.lights.length * 1.5 * 1.2
      return { busId: bus.id, totalCableM: Math.round(total * 10) / 10 }
    })
  }, [daliAddresses])
  const perRoomSummary  = useMemo(() => computePerRoomSummary(floors, daliAddresses, busTopologies, busCableLengths), [floors, daliAddresses, busTopologies, busCableLengths])
  const totalBuses      = daliAddresses.buses.length
  const totalCableM     = busCableLengths.reduce((s, b) => s + (b.totalCableM ?? 0), 0)
  // Auto-activate DALI panels when any fixture has DALI protocol (manual toggle is an override)
  const daliActive      = daliEnabled || daliAddresses.buses.length > 0

  // ── Voltage drop per circuit ──────────────────────────────────────────────

  const voltageDropResults = useMemo(() => {
    if (circuits.length === 0 || dbMarkers.length === 0 || roomWidth <= 0 || roomHeight <= 0) return []
    const SCALE = Math.min((CANVAS_W - 260) / roomWidth, (CANVAS_H - 220) / roomHeight)
    const RHO = 0.0175  // copper Ω·mm²/m

    return circuits.map(c => {
      const avgX = c.fixtures.reduce((s, f) => s + (f.x ?? 0), 0) / c.fixtures.length
      const avgY = c.fixtures.reduce((s, f) => s + (f.y ?? 0), 0) / c.fixtures.length

      let minDist = Infinity
      for (const db of dbMarkers) {
        const d = Math.sqrt((avgX - db.x) ** 2 + (avgY - db.y) ** 2)
        if (d < minDist) minDist = d
      }

      const distM        = minDist / (SCALE * 1000)
      const cableLengthM = distM * 1.2  // 20% conduit overhead
      const current      = c.totalWatt / 230

      let cableSize, area
      if (current <= 10)       { cableSize = "1.5mm²"; area = 1.5 }
      else if (current <= 16)  { cableSize = "2.5mm²"; area = 2.5 }
      else                     { cableSize = "4mm²";   area = 4   }

      const vDropPercent = (2 * cableLengthM * current * RHO / area) / 230 * 100
      const status = vDropPercent <= 3 ? "GOOD" : vDropPercent <= 5 ? "WARNING" : "CRITICAL"

      return { circuitId: c.circuitId, cableLengthM, current, vDropPercent, cableSize, status }
    })
  }, [circuits, dbMarkers, roomWidth, roomHeight])

  // ── Driver schedule ───────────────────────────────────────────────────────

  const driverSchedule = useMemo(() => {
    if (lights.length === 0) return []
    const groups = {}

    const roomProto = room.roomProtocol ?? "NON-DIM"
    const CCT_DRIVER_NOTE = {
      "tunable":    "2-channel driver required",
      "rgbw":       "4-channel RGBW driver required",
      "dali-dt8":   "DALI DT8 colour driver required",
      "zigbee-cct": "Zigbee CCT module required",
    }
    for (const light of lights) {
      if (light.category === "LED_STRIP") continue
      const proto  = (light.protocol && light.protocol !== "Room Default") ? light.protocol : roomProto
      const cctTyp = light.cctType ?? "single"
      const key = `${light.label ?? "Fixture"}_${light.watt ?? 0}_${proto}_${cctTyp}`
      if (!groups[key]) groups[key] = { type: light.label ?? "Fixture", watt: light.watt ?? 0, category: light.category ?? "", quantity: 0, protocol: proto, cctType: cctTyp }
      groups[key].quantity++
    }

    const strips = lights.filter(l => l.category === "LED_STRIP")
    if (strips.length > 0) {
      const avgW = Math.round(strips.reduce((s, l) => s + (l.watt ?? 0), 0) / strips.length)
      groups["__LED_STRIP"] = { type: "LED Strip (CV)", watt: avgW, category: "LED_STRIP", quantity: strips.length, protocol: roomProto }
    }

    return Object.values(groups).map(g => {
      const isCV = g.category === "LED_STRIP"
      const driverType = isCV ? "CV" : "CC"
      let currentMA = 350
      if (!isCV) {
        if (g.watt <= 7)       currentMA = 350
        else if (g.watt <= 14) currentMA = 500
        else if (g.watt <= 20) currentMA = 700
        else                   currentMA = 1050
      }
      const driverWatt = isCV ? Math.round(g.watt * g.quantity * 1.1) : g.watt
      const baseLabel  = PROTOCOL_DIMMING[g.protocol] ?? "Non-dim"
      const dimmable   = g.protocol === "ZIGBEE" ? `${baseLabel} + Module` : baseLabel
      const cctNote    = CCT_DRIVER_NOTE[g.cctType ?? "single"] ?? ""
      return {
        type: g.type, watt: g.watt, driverType, currentMA,
        dimmable, cctNote,
        quantity: isCV ? 1 : g.quantity, driverWatt,
      }
    })
  }, [lights, room.roomProtocol])

  // ── Emergency lux results ─────────────────────────────────────────────────

  const emergencyLuxResults = useMemo(() => {
    const fixtureCount = emergencyLights.length
    const totalWatt    = fixtureCount * 8
    if (fixtureCount === 0 || !(mh > 0) || roomWidth <= 0 || roomHeight <= 0) {
      return { compliant: false, worstPointLux: 0, fixtureCount, totalWatt }
    }
    const SCALE     = Math.min((CANVAS_W - 260) / roomWidth, (CANVAS_H - 220) / roomHeight)
    const ROOM_PX_W = roomWidth  * SCALE
    const ROOM_PX_H = roomHeight * SCALE
    const ROOM_X    = roomOffsetX != null ? roomOffsetX : 20
    const ROOM_Y    = roomOffsetY != null ? roomOffsetY : 30
    const STEP_PX   = Math.max(8, 1.0 * SCALE * 1000)  // ~1m steps
    const halfBeamR = (120 / 2) * (Math.PI / 180)
    const mh2       = mh * mh
    let worstPointLux = Infinity

    for (let py = ROOM_Y; py < ROOM_Y + ROOM_PX_H; py += STEP_PX) {
      for (let px = ROOM_X; px < ROOM_X + ROOM_PX_W; px += STEP_PX) {
        const cx = px + STEP_PX / 2, cy = py + STEP_PX / 2
        let totalLux = 0
        for (const ef of emergencyLights) {
          const dxPx = cx - ef.x, dyPx = cy - ef.y
          const distM      = Math.sqrt(dxPx * dxPx + dyPx * dyPx) / (SCALE * 1000)
          const totalDistM = Math.sqrt(distM * distM + mh2)
          const incAngle   = Math.atan2(distM, mh)
          if (incAngle > halfBeamR) continue
          totalLux += (800 * 0.8) / (Math.PI * totalDistM * totalDistM) * Math.cos(incAngle)
        }
        worstPointLux = Math.min(worstPointLux, totalLux)
      }
    }

    if (!isFinite(worstPointLux)) worstPointLux = 0
    return { compliant: worstPointLux >= 1, worstPointLux, fixtureCount, totalWatt }
  }, [emergencyLights, roomWidth, roomHeight, mh])

  // ── Mutation helpers ──────────────────────────────────────────────────────

  function patchActiveRoom(updater) {
    setFloors(prev => prev.map(f =>
      f.id !== activeFloorId ? f : {
        ...f,
        rooms: f.rooms.map(r => r.id !== activeRoomId ? r : { ...r, ...updater(r) }),
      }
    ))
  }

  // ── Light handlers ────────────────────────────────────────────────────────

  function addLight(lightData) {
    const now = Date.now()
    if (now - lastAddLightTime.current < 100) return
    lastAddLightTime.current = now
    if (activeFixtureCategory === "LED_STRIP") {
      const vis = CATEGORY_VISUAL.LED_STRIP
      const len = lightData.lengthM ?? 1
      const wPM = activeFixture.wattPerMtr   ?? (activeFixture.watt   / Math.max(1, activeFixture.length ?? 1))
      const lPM = activeFixture.lumensPerMtr ?? (activeFixture.lumens / Math.max(1, activeFixture.length ?? 1))
      patchActiveRoom(r => ({
        lights: [...r.lights, {
          ...lightData,
          fixtureId: activeFixture.id,
          category:  "LED_STRIP",
          fill:      vis.fill,
          stroke:    vis.stroke,
          watt:      Math.round(wPM * len * 10) / 10,
          lumens:    Math.round(lPM * len),
        }],
      }))
    } else {
      patchActiveRoom(r => {
        const newLight = makeLight(lightData.id, lightData.x, lightData.y, activeFixture, Number(room.fixtureLumens))
        const lightWithProtocol = daliEnabled ? { ...newLight, protocol: 'DALI' } : newLight
        const lightWithVisuals = {
          ...lightWithProtocol,
          fixtureSize: 8,
          fixtureColor: newLight.fill,
          fixtureShape: 'circle'
        }
        return {
          lights: [...r.lights, lightWithVisuals],
        }
      })
    }
  }

  function moveLight(id, x, y) {
    patchActiveRoom(r => ({
      lights: r.lights.map(l => {
        if (l.id !== id) return l
        if (l.category === "LED_STRIP") {
          if (l.shape === "line")     return { ...l, x1: (l.x1 ?? 0) + x, y1: (l.y1 ?? 0) + y, x2: (l.x2 ?? 0) + x, y2: (l.y2 ?? 0) + y }
          if (l.shape === "circle")   return { ...l, cx: (l.cx ?? 0) + x, cy: (l.cy ?? 0) + y }
          if (l.shape === "freehand") return { ...l, points: l.points.map((p, i) => p + (i % 2 === 0 ? x : y)) }
        }
        return { ...l, x, y }
      }),
    }))
  }

  function deleteLight(id) {
    patchActiveRoom(r => ({ lights: r.lights.filter(l => l.id !== id) }))
    setSelectedLights(prev => prev.filter(l => l.id !== id))
  }

  function handleSelectLight(light, ctrlKey) {
    if (ctrlKey) {
      setSelectedLights(prev =>
        prev.some(l => l.id === light.id)
          ? prev.filter(l => l.id !== light.id)
          : [...prev, light]
      )
    } else {
      setSelectedLights([light])
    }
  }

  const updateLight = useCallback((id, updates) => {
    setFloors(prev => prev.map(f => ({
      ...f,
      rooms: f.rooms.map(r => ({
        ...r,
        lights: r.lights.map(l => l.id === id ? { ...l, ...updates } : l),
      })),
    })))
    setSelectedLights(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }, [])

  function updateLightsOfType(fixtureId, updates) {
    setFloors(prev => prev.map(f => ({
      ...f,
      rooms: f.rooms.map(r => ({
        ...r,
        lights: r.lights.map(l => l.fixtureId === fixtureId ? { ...l, ...updates } : l),
      })),
    })))
  }

  // ── Marker handlers ───────────────────────────────────────────────────────

  function addMarker(type, x, y) {
    const key = `${type}Markers`
    patchActiveRoom(r => ({ [key]: [...(r[key] ?? []), { id: Date.now(), x, y }] }))
  }

  function moveMarker(type, id, x, y) {
    const key = `${type}Markers`
    patchActiveRoom(r => ({ [key]: (r[key] ?? []).map(m => m.id === id ? { ...m, x, y } : m) }))
  }

  function deleteMarker(type, id) {
    const key = `${type}Markers`
    patchActiveRoom(r => ({ [key]: (r[key] ?? []).filter(m => m.id !== id) }))
  }

  // ── Emergency light handlers ──────────────────────────────────────────────

  function addEmergencyLight(x, y) {
    patchActiveRoom(r => ({
      emergencyLights: [...(r.emergencyLights ?? []), { id: Date.now(), x, y }],
    }))
  }

  function moveEmergencyLight(id, x, y) {
    patchActiveRoom(r => ({
      emergencyLights: (r.emergencyLights ?? []).map(e => e.id === id ? { ...e, x, y } : e),
    }))
  }

  function deleteEmergencyLight(id) {
    patchActiveRoom(r => ({
      emergencyLights: (r.emergencyLights ?? []).filter(e => e.id !== id),
    }))
  }

  // ── Room settings & floor plan ────────────────────────────────────────────

  function updateRoom(newRoom) {
    const nW = Number(newRoom.roomWidth), nH = Number(newRoom.roomHeight)
    const oW = Number(room.roomWidth),    oH = Number(room.roomHeight)
    if (newRoom.roomProtocol === "DALI" && !daliEnabled) setDaliEnabled(true)
    patchActiveRoom(r => ({
      room:   newRoom,
      lights: (nW !== oW || nH !== oH) ? [] : r.lights,
    }))
  }

  function patchActiveFloor(updater) {
    setFloors(prev => prev.map(f => f.id !== activeFloorId ? f : { ...f, ...updater(f) }))
  }

  function updateFloorPlan(data) {
    patchActiveFloor(() => ({ floorPlan: data }))
  }

  function removeFloorPlan() {
    patchActiveFloor(() => ({ floorPlan: null }))
    patchActiveRoom(() => ({ roomOffsetX: undefined, roomOffsetY: undefined }))
  }

  function handleSetFloorPlanScale(scale) {
    patchActiveFloor(f => ({ floorPlan: { ...f.floorPlan, scale } }))
    setActiveTool("fixture")
    showToast(`Scale calibrated: 1px = ${(scale * 1000).toFixed(2)}mm`)
  }

  function handleRoomBoundSet({ x1, y1, widthM, heightM, drawnWidthPx, drawnHeightPx }) {
    if (!widthM || !heightM || isNaN(widthM) || isNaN(heightM)) return
    const roomWidthMM  = Math.round(widthM  * 1000)
    const roomHeightMM = Math.round(heightM * 1000)
    if (roomWidthMM < 100 || roomHeightMM < 100) return

    // Check if active room already has a drawn boundary
    const activeRoom = activeFloor.rooms.find(r => r.id === activeFloor.activeRoomId)
    const roomAlreadyDrawn = activeRoom && activeRoom.roomOffsetX != null

    if (roomAlreadyDrawn) {
      // Check room limit before adding a new room
      if ((activeFloor?.rooms?.length ?? 0) >= getRoomLimit()) {
        notify.warning("Room limit reached. Upgrade to add more rooms.")
        setActiveTool("fixture")
        return
      }
      // Create a new room inline with placement data already set — avoids async addRoom() race
      setFloors(prevFloors => prevFloors.map(f => {
        if (f.id !== activeFloorId) return f
        const newId = Math.max(...f.rooms.map(r => r.id), 0) + 1
        return {
          ...f,
          activeRoomId: newId,
          rooms: [...f.rooms, {
            id: newId,
            name: `Room ${f.rooms.length + 1}`,
            room: { ...DEFAULT_ROOM, roomWidth: roomWidthMM, roomHeight: roomHeightMM },
            roomOffsetX: Math.max(0, x1),
            roomOffsetY: Math.max(0, y1),
            drawnWidthPx,
            drawnHeightPx,
            floorPlan: f.floorPlan,
            lights: [], dbMarkers: [], ctrMarkers: [], jbMarkers: [], emergencyLights: [],
          }],
        }
      }))
    } else {
      patchActiveRoom(r => ({
        room: { ...r.room, roomWidth: roomWidthMM, roomHeight: roomHeightMM },
        roomOffsetX:    Math.max(0, x1),
        roomOffsetY:    Math.max(0, y1),
        drawnWidthPx,
        drawnHeightPx,
        lights: [], dbMarkers: [], ctrMarkers: [], jbMarkers: [], emergencyLights: [],
      }))
    }
    setActiveTool("fixture")
    showToast(`Room: ${widthM.toFixed(2)}m × ${heightM.toFixed(2)}m`)
  }

  // ── Room management ───────────────────────────────────────────────────────

  function setActiveRoom(roomId) {
    setFloors(prev => prev.map(f =>
      f.id !== activeFloorId ? f : { ...f, activeRoomId: roomId }
    ))
  }

  function addRoom() {
    if ((activeFloor?.rooms?.length ?? 0) >= getRoomLimit()) {
      notify.warning("Room limit reached. Upgrade to add more rooms.")
      return
    }
    const newId = uid()
    setFloors(prev => prev.map(f => {
      if (f.id !== activeFloorId) return f
      return {
        ...f,
        activeRoomId: newId,
        rooms: [...f.rooms, {
          id: newId, name: `Room ${f.rooms.length + 1}`,
          room: { ...DEFAULT_ROOM },
          lights: [], dbMarkers: [], ctrMarkers: [], jbMarkers: [], emergencyLights: [],
        }],
      }
    }))
  }

  function deleteRoom(roomId) {
    setFloors(prev => prev.map(f => {
      if (f.id !== activeFloorId) return f
      if (f.rooms.length <= 1) return f
      const newRooms = f.rooms.filter(r => r.id !== roomId)
      return {
        ...f,
        rooms: newRooms,
        activeRoomId: roomId === f.activeRoomId ? newRooms[0].id : f.activeRoomId,
      }
    }))
  }

  function renameRoom(roomId, newName) {
    setFloors(prev => prev.map(f =>
      f.id !== activeFloorId ? f : {
        ...f,
        rooms: f.rooms.map(r => r.id !== roomId ? r : { ...r, name: newName }),
      }
    ))
  }

  // ── Floor management ──────────────────────────────────────────────────────

  function addFloor() {
    const newRoomId  = uid()
    const newFloorId = uid()
    setFloors(prev => [...prev, {
      id: newFloorId, name: `Floor ${prev.length + 1}`,
      activeRoomId: newRoomId, floorPlan: null,
      rooms: [{
        id: newRoomId, name: "Room 1",
        room: { ...DEFAULT_ROOM },
        lights: [], dbMarkers: [], ctrMarkers: [], jbMarkers: [], emergencyLights: [],
      }],
    }])
    setActiveFloorId(newFloorId)
  }

  function deleteFloor(floorId) {
    if (floors.length <= 1) return
    const newFloors = floors.filter(f => f.id !== floorId)
    setFloors(newFloors)
    if (activeFloorId === floorId) setActiveFloorId(newFloors[0].id)
  }

  function renameFloor(floorId, newName) {
    setFloors(prev => prev.map(f => f.id !== floorId ? f : { ...f, name: newName }))
  }

  // ── DALI topology ─────────────────────────────────────────────────────────

  function setTopology(bus, topology) {
    setBusTopologies(prev => ({ ...prev, [bus]: topology }))
  }

  // ── Auto-place lights ─────────────────────────────────────────────────────

  function autoPlaceLights() {
    const SCALE     = Math.min((CANVAS_W - 260) / roomWidth, (CANVAS_H - 220) / roomHeight)
    // When the room was drawn on the floor plan, use the exact drawn pixel box.
    const useDrawn  = roomOffsetX != null && drawnWidthPx != null
    const ROOM_PX_W = useDrawn ? drawnWidthPx  : roomWidth  * SCALE
    const ROOM_PX_H = useDrawn ? drawnHeightPx : roomHeight * SCALE
    const ROOM_X    = roomOffsetX != null ? roomOffsetX : 20
    const ROOM_Y    = roomOffsetY != null ? roomOffsetY : 30
    // px-per-mm ratio: used to convert 600mm wall offset into pixels correctly.
    const pxPerMm   = useDrawn ? drawnWidthPx / roomWidth : SCALE
    const wallOff   = 600 * pxPerMm
    const fixLm     = Number(room.fixtureLumens)

    const { rows, cols } = calcGrid(
      Number(room.targetLux), areaM2, uf, fixLm, roomWidth, roomHeight,
    )

    const usableW = ROOM_PX_W - wallOff * 2
    const usableH = ROOM_PX_H - wallOff * 2
    const spX     = cols > 1 ? usableW / (cols - 1) : 0
    const spY     = rows > 1 ? usableH / (rows - 1) : 0

    const generated = []
    let ts = Date.now()
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        generated.push(makeLight(
          ts++,
          Math.round(ROOM_X + wallOff + c * spX),
          Math.round(ROOM_Y + wallOff + r * spY),
          activeFixture, fixLm,
        ))
      }
    }
    patchActiveRoom(() => ({ lights: generated }))
  }

  // ── Toast helper ──────────────────────────────────────────────────────────

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Firebase: Save / Load / Share ─────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    try {
      const id = await saveProject(projectId, {
        floors,
        name:       projectName,
        floorCount: floors.length,
        roomCount:  floors.reduce((s, f) => s + f.rooms.length, 0),
      }, user?.uid)
      setProjectId(id)
      showToast("Project saved ✓")
    } catch (e) {
      showToast(`Save failed: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  function handleLoadFromModal(id, data) {
    if (data.floors) {
      setFloors(data.floors)
      setActiveFloorId(data.floors[0]?.id ?? 1)
      setProjectId(id)
    }
    if (data.name) setProjectName(data.name)
    setShowLoadModal(false)
    showToast("Project loaded ✓")
  }

  // Auto-load project or set name from URL params (?projectId=xxx or ?new=Name)
  // Also checks sessionStorage for a pending template from NewProjectWizard
  useEffect(() => {
    if (!user) return
    const pid  = searchParams.get("projectId")
    const name = searchParams.get("new")
    if (pid) {
      ;(async () => {
        try {
          const data = await loadProject(pid)
          handleLoadFromModal(pid, data)
        } catch (e) {
          console.error('Failed to load project:', e)
          showToast(`Failed to load project: ${e.message}`)
        }
      })()
    } else if (name) {
      setProjectName(decodeURIComponent(name))
      // Check if a template was queued by NewProjectWizard
      try {
        const raw = sessionStorage.getItem("lumina_pending_template")
        if (raw) {
          sessionStorage.removeItem("lumina_pending_template")
          const tpl = JSON.parse(raw)
          if (tpl?.floors) {
            setFloors(tpl.floors)
            setActiveFloorId(tpl.floors[0]?.id ?? 1)
            showToast(`Template loaded: ${tpl.name}`)
          }
        }
      } catch {}
    }
  }, [user])

  async function handleShare() {
    if (!projectId) { showToast("Save the project first before sharing."); return }
    try {
      await fbShareProject(projectId)
      const url = `${window.location.origin}?share=${projectId}`
      navigator.clipboard?.writeText(url)
      showToast("Share link copied to clipboard ✓")
    } catch (e) {
      showToast(`Share failed: ${e.message}`)
    }
  }

  // ── Library selection ─────────────────────────────────────────────────────

  function handleLibrarySelect(fixture) {
    setRecentCustom(prev => [fixture, ...prev.filter(f => f.id !== fixture.id)].slice(0, 8))
    setActiveFixtureId(fixture.id)
    setActiveTool("fixture")
  }

  // ── Shared room geometry for AI placement ────────────────────────────────────

  function aiRoomGeom() {
    const SCALE    = Math.min((CANVAS_W - 260) / roomWidth, (CANVAS_H - 220) / roomHeight)
    const useDrawn = roomOffsetX != null && drawnWidthPx != null
    const pxPerMm  = useDrawn ? drawnWidthPx / roomWidth : SCALE
    return {
      RX:       roomOffsetX != null ? roomOffsetX : 20,
      RY:       roomOffsetY != null ? roomOffsetY : 30,
      RPX_W:    useDrawn ? drawnWidthPx  : roomWidth  * SCALE,
      RPX_H:    useDrawn ? drawnHeightPx : roomHeight * SCALE,
      wallOff:  600 * pxPerMm,
      pxPerMm,
    }
  }

  // ── Place a fixture group using strategy derived from fixture category ────────

  function placeFixtureGroup(fixture, quantity, startId, existingLights = []) {
    const { RX, RY, RPX_W, RPX_H, pxPerMm } = aiRoomGeom()
    // Cap wall offset to 20% of smaller room dimension
    const rawWallOff = aiRoomGeom().wallOff
    const wallOff    = Math.min(rawWallOff, RPX_W * 0.2, RPX_H * 0.2)
    const n   = Math.max(1, quantity)
    let   id  = startId ?? Date.now()
    const out = []

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
    const minX = RX + wallOff, maxX = RX + RPX_W - wallOff
    const minY = RY + wallOff, maxY = RY + RPX_H - wallOff

    // Overlap check: 0.5m minimum spacing between any two fixtures
    const minSpacingPx = 500 * pxPerMm  // 500mm = 0.5m
    const overlapR2    = minSpacingPx > 0 ? minSpacingPx ** 2 : -1  // -1 disables check if pxPerMm=0
    const allSoFar     = [...existingLights]  // reference; out grows as we place

    function tooClose(x, y) {
      let minDist2 = Infinity
      for (const l of [...allSoFar, ...out]) {
        const dx = (l.x ?? 0) - x, dy = (l.y ?? 0) - y
        const d2 = dx * dx + dy * dy
        if (d2 < minDist2) minDist2 = d2
        if (d2 < overlapR2) return true
      }
      if (process.env.NODE_ENV !== "production") {
        const minDist = minDist2 === Infinity ? Infinity : Math.sqrt(minDist2) / Math.max(pxPerMm, 0.001) / 1000
        console.log(`Checking (${Math.round(x)}, ${Math.round(y)}) — nearest ${minDist === Infinity ? "none" : minDist.toFixed(2) + "m"} against ${allSoFar.length + out.length} fixtures — ${minDist2 < overlapR2 ? "SKIP" : "PLACE"}`)
      }
      return false
    }

    function tryPush(x, y) {
      if (tooClose(x, y)) {
        console.log(`Skipped (${Math.round(x)}, ${Math.round(y)}) — too close to existing fixture`)
        return false
      }
      out.push(makeLight(id++, x, y, fixture, fixture.lumens))
      return true
    }

    const isPerimeter = fixture.category === "WALL_WASHER"
      || fixture.category === "LED_STRIP"
      || fixture.placement === "perimeter"
      || fixture.placement === "corners"

    const isSideWalls = fixture.placement === "side-walls"
    const isCorners   = fixture.placement === "corners"

    if (isCorners) {
      // Place one in each corner (at wallOff inset)
      const corners = [
        [minX, minY], [maxX, minY], [minX, maxY], [maxX, maxY],
      ]
      for (let i = 0; i < Math.min(n, corners.length); i++) {
        tryPush(Math.round(corners[i][0]), Math.round(corners[i][1]))
      }
    } else if (isPerimeter || isSideWalls) {
      // Distribute n fixtures along walls
      const walls = isSideWalls
        ? [
            { isH: false, fixed: minX, from: minY, to: maxY },
            { isH: false, fixed: maxX, from: minY, to: maxY },
          ]
        : [
            { isH: true,  fixed: minY, from: minX, to: maxX },
            { isH: true,  fixed: maxY, from: minX, to: maxX },
            { isH: false, fixed: minX, from: minY, to: maxY },
            { isH: false, fixed: maxX, from: minY, to: maxY },
          ]
      const wallCount = walls.length
      const perWall = Math.max(1, Math.round(n / wallCount))
      for (const w of walls) {
        if (out.length >= n) break
        const cnt = Math.min(perWall, n - out.length)
        for (let i = 0; i < cnt; i++) {
          const coord = cnt > 1 ? w.from + i * (w.to - w.from) / (cnt - 1) : (w.from + w.to) / 2
          const px = clamp(Math.round(w.isH ? coord    : w.fixed), minX, maxX)
          const py = clamp(Math.round(w.isH ? w.fixed  : coord),   minY, maxY)
          tryPush(px, py)
        }
      }
    } else if (fixture.category === "LINEAR") {
      // Horizontal rows distributed vertically
      const cx  = Math.round(RX + RPX_W / 2)
      const spY = n > 1 ? (maxY - minY) / (n - 1) : 0
      for (let i = 0; i < n; i++) {
        tryPush(cx, clamp(Math.round(minY + i * spY), minY, maxY))
      }
    } else {
      // Grid: aspect-correct cols/rows
      const cols = Math.max(1, Math.round(Math.sqrt(n * (RPX_W / Math.max(1, RPX_H)))))
      const rows = Math.ceil(n / cols)
      const spX  = cols > 1 ? (maxX - minX) / (cols - 1) : 0
      const spY  = rows > 1 ? (maxY - minY) / (rows - 1) : 0
      for (let r = 0; r < rows; r++) {
        const rowCount = r < rows - 1 ? cols : n - (rows - 1) * cols
        const rowOffX  = rowCount < cols && spX > 0 ? ((cols - rowCount) * spX) / 2 : 0
        for (let c = 0; c < rowCount; c++) {
          tryPush(
            clamp(Math.round(minX + rowOffX + c * spX), minX, maxX),
            clamp(Math.round(minY + r * spY), minY, maxY),
          )
        }
      }
    }
    return out
  }

  // ── Single-zone apply (PLACE button per zone) ─────────────────────────────────

  function handleAIApply(fixture, quantity = 1) {
    const existing  = lights ?? []
    const generated = placeFixtureGroup(fixture, quantity, undefined, existing)
    setRecentCustom(prev => [fixture, ...prev].slice(0, 8))
    setActiveFixtureId(fixture.id)
    setActiveTool("fixture")
    patchActiveRoom(r => ({ lights: [...r.lights, ...generated] }))
    if (user) incrementAiCall(user.uid).catch(() => {})
    return generated.length
  }

  // ── All-zones apply (APPLY ALL button) ────────────────────────────────────────

  function handleAIApplyAll(zones) {
    if (!zones?.length) return 0
    let id = Date.now()
    const allLights = []
    const newCustom  = []
    const existing   = lights ?? []
    for (const { fixture, quantity } of zones) {
      allLights.push(...placeFixtureGroup(fixture, quantity, id, [...existing, ...allLights]))
      id += quantity + 1
      newCustom.push(fixture)
    }
    setRecentCustom(prev => [...newCustom, ...prev].slice(0, 8))
    setActiveFixtureId(zones[0].fixture.id)
    setActiveTool("fixture")
    patchActiveRoom(r => ({ lights: [...r.lights, ...allLights] }))
    if (user) incrementAiCall(user.uid).catch(() => {})
    return allLights.length
  }

  // ── Floating settings drag ────────────────────────────────────

  function startSettingsDrag(e) {
    e.preventDefault()
    const startX = e.clientX - settingsPos.x
    const startY = e.clientY - settingsPos.y
    function onMove(ev) {
      setSettingsPos({ x: ev.clientX - startX, y: ev.clientY - startY })
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup",   onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup",   onUp)
  }

  function startVisualEditorDrag(e) {
    e.preventDefault()
    const startX = e.clientX - visualEditorPos.x
    const startY = e.clientY - visualEditorPos.y
    function onMove(ev) {
      setVisualEditorPos({ x: ev.clientX - startX, y: ev.clientY - startY })
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup",   onUp)
    }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup",   onUp)
  }

  // ── Style helpers ─────────────────────────────────────────────────────────

  // Active state for all toolbar toggles — warm gold on dark bg
  const tbActive = { background: "#1a1500", color: "#d4a843" }

  const activeLabel = activeFixture?.label ?? activeFixture?.name ?? "Fixture"

  // ── Export helpers ────────────────────────────────────────────────────────

  const _allRoomsForExport = floors.flatMap(f => f.rooms.map(r => ({ ...r, floorName: f.name })))

  function _calcRoomExport(roomObj) {
    const s = roomObj.room ?? {}
    const W = Number(s.roomWidth) / 1000, H = Number(s.roomHeight) / 1000
    const areaM2 = W * H
    const mh = Number(s.ceilingHeight) - Number(s.falseCeiling) - Number(s.workingPlane)
    const rcr = W > 0 && H > 0 ? (5 * mh * (W + H)) / (W * H) : 0
    const avgRef = (Number(s.ceilingReflectance ?? 0.7) + Number(s.wallReflectance ?? 0.5) + Number(s.floorReflectance ?? 0.2)) / 3
    const ufRaw = avgRef >= 0.6 ? 1 - rcr * 0.04 : avgRef >= 0.4 ? 1 - rcr * 0.055 : 1 - rcr * 0.07
    const uf = Math.min(0.95, Math.max(0.4, ufRaw))
    const lux = areaM2 === 0 ? 0 : (roomObj.lights.reduce((s, l) => s + (l.lumens ?? 0), 0) * uf * MAINT_FACTOR) / areaM2
    return { areaM2, lux, rcr, uf }
  }

  function _fixtureGroupsExport(roomObj) {
    const groups = {}
    const roomProtocol = roomObj.room?.roomProtocol ?? "NON-DIM"
    for (const l of roomObj.lights) {
      const fid = l.fixtureId ?? "unknown"
      const ep = (l.protocol && l.protocol !== "Room Default") ? l.protocol : roomProtocol
      if (!groups[fid]) {
        const f = FIXTURE_MAP[fid]
        groups[fid] = { label: f?.label ?? "Custom", lumens: l.lumens, beamAngle: f?.beamAngle ?? "—", watt: l.watt ?? 0, qty: 0, totalWatt: 0, protocol: ep }
      }
      groups[fid].qty++
      groups[fid].totalWatt += l.watt ?? 0
    }
    return Object.values(groups)
  }

  const PROTOCOL_LBL = { "NON-DIM": "Non-dim", "PHASE-CUT": "Triac/Phase-cut", "0-10V": "0-10V Analog", "DALI": "DALI", "ZIGBEE": "Zigbee" }

  async function handleExportPDF() {
    const { jsPDF }   = await import("jspdf")
    const autoTable   = (await import("jspdf-autotable")).default
    const doc         = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const PW = 210, PH = 297, M = 15
    const date        = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
    const allR        = _allRoomsForExport
    const totalFix    = allR.reduce((s, r) => s + r.lights.length, 0)
    const totalLoad   = allR.reduce((s, r) => s + r.lights.reduce((w, l) => w + (l.watt ?? 0), 0), 0)
    const CYAN        = [0, 212, 255]
    const DARK        = [17, 17, 17]
    const GRAY_HDR    = [240, 240, 240]
    const ROW_ALT     = [249, 249, 249]
    const safeName    = projectName.replace(/[^a-z0-9_\-]/gi, "_")

    const CCT_LBL = {
      "single": "Single CCT", "tunable": "Tunable White",
      "rgbw": "RGBW", "dali-dt8": "DALI DT8", "zigbee-cct": "Zigbee CCT",
    }

    // Resolve a human-readable fixture label — never falls back to "Custom"
    function resolveLabel(light) {
      if (FIXTURE_MAP[light.fixtureId]) return FIXTURE_MAP[light.fixtureId].label
      const catLabel = CATEGORY_META[light.category]?.label
      if (catLabel) return `${catLabel} ${light.watt ?? "?"}W`
      return light.label ?? light.type ?? `${light.watt ?? "?"}W Fixture`
    }

    // Footer on every page
    function footer(n, total) {
      doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(160, 160, 160)
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2)
      doc.line(M, PH - 12, PW - M, PH - 12)
      doc.text("LUMINA DESIGN · LIGHTING CALCULATION REPORT", M, PH - 8)
      doc.text(`Page ${n}${total ? ` of ${total}` : ""}`, PW - M, PH - 8, { align: "right" })
      doc.setTextColor(30, 30, 30)
    }

    // Section header with cyan top-line
    function sectionHeader(title, y) {
      doc.setDrawColor(...CYAN); doc.setLineWidth(0.6)
      doc.line(M, y - 1, PW - M, y - 1)
      doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.1)
      doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...DARK)
      doc.text(title, M, y + 7)
      return y + 12
    }

    // autoTable helper — consistent styles
    function makeTable(head, body, startY, opts = {}) {
      autoTable(doc, {
        startY,
        margin: { left: M, right: M },
        head: [head],
        body,
        styles: {
          font: "helvetica", fontSize: 8, cellPadding: 2.5,
          textColor: DARK, lineColor: [220, 220, 220], lineWidth: 0.1,
        },
        headStyles: {
          fillColor: GRAY_HDR, textColor: DARK, fontStyle: "bold", fontSize: 8,
        },
        alternateRowStyles: { fillColor: ROW_ALT },
        bodyStyles: { fillColor: [255, 255, 255] },
        ...opts,
      })
      return doc.lastAutoTable.finalY + 4
    }

    // ── PAGE 1: Cover ──────────────────────────────────────────────────────────
    // Cyan header bar
    doc.setFillColor(...CYAN)
    doc.rect(0, 0, PW, 22, "F")
    doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(255, 255, 255)
    doc.text("LUMINA DESIGN", M, 14)
    doc.setFont("helvetica", "normal"); doc.setFontSize(9)
    doc.text(date, PW - M, 14, { align: "right" })

    // Project name centered + underline
    doc.setFont("helvetica", "bold"); doc.setFontSize(28); doc.setTextColor(...DARK)
    doc.text(projectName, PW / 2, 48, { align: "center" })
    const nameW = doc.getTextWidth(projectName)
    doc.setDrawColor(...DARK); doc.setLineWidth(0.5)
    doc.line(PW / 2 - nameW / 2, 51, PW / 2 + nameW / 2, 51)

    // Subtitle
    doc.setFont("helvetica", "normal"); doc.setFontSize(12); doc.setTextColor(102, 102, 102)
    doc.text("LIGHTING DESIGN REPORT", PW / 2, 61, { align: "center" })

    // Summary grid — 2 cols × 3 rows
    const gridItems = [
      ["FLOORS",          String(floors.length)],
      ["ROOMS",           String(allR.length)],
      ["TOTAL FIXTURES",  String(totalFix)],
      ["TOTAL LOAD",      totalLoad + " W"],
      ["PREPARED BY",     user?.email ?? "—"],
      ["DATE",            date],
    ]
    const colW = (PW - 2 * M - 6) / 2
    const rowH = 22
    let gx = M, gy = 72
    gridItems.forEach(([lbl, val], i) => {
      if (i > 0 && i % 2 === 0) { gx = M; gy += rowH + 4 }
      const bx = i % 2 === 0 ? M : M + colW + 6
      doc.setFillColor(248, 248, 248); doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.2)
      doc.roundedRect(bx, gy, colW, rowH, 2, 2, "FD")
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(153, 153, 153)
      doc.text(lbl, bx + 5, gy + 8)
      doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(...DARK)
      doc.text(val, bx + 5, gy + 18)
    })

    // Bottom cyan accent
    const accentY = gy + rowH + 10
    doc.setDrawColor(...CYAN); doc.setLineWidth(1)
    doc.line(M, accentY, PW - M, accentY)

    footer(1)

    // ── PAGE 2: Lux Summary ────────────────────────────────────────────────────
    doc.addPage()
    let curY = sectionHeader("02 · LUX SUMMARY", 18)

    const luxHead = ["FLOOR", "ROOM", "AREA (m²)", "TARGET LX", "ACTUAL LX", "STATUS", "PROTOCOL", "FIX", "LOAD (W)"]
    const luxBody = allR.map(r => {
      const { areaM2, lux } = _calcRoomExport(r)
      const target  = Number(r.room?.targetLux ?? 0)
      const roomP   = r.room?.roomProtocol ?? "NON-DIM"
      const status  = lux === 0 || target === 0 ? "—"
        : lux < target * 0.8  ? "UNDERLIT"
        : lux <= target * 1.2 ? "GOOD"
        : "OVERLIT"
      const load = r.lights.reduce((s, l) => s + (l.watt ?? 0), 0)
      return [
        r.floorName, r.name, areaM2.toFixed(1),
        target || "—", r.lights.length === 0 ? "—" : Math.round(lux),
        status, PROTOCOL_LBL[roomP] ?? roomP, r.lights.length, load + " W",
      ]
    })

    autoTable(doc, {
      startY: curY,
      margin: { left: M, right: M },
      head: [luxHead],
      body: luxBody,
      styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5, textColor: DARK, lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: GRAY_HDR, textColor: DARK, fontStyle: "bold" },
      alternateRowStyles: { fillColor: ROW_ALT },
      bodyStyles: { fillColor: [255, 255, 255] },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 5) {
          const v = data.cell.raw
          if (v === "GOOD")     data.cell.styles.textColor = [76, 175, 125]
          else if (v === "UNDERLIT") data.cell.styles.textColor = [224, 123, 42]
          else if (v === "OVERLIT")  data.cell.styles.textColor = [224, 82, 82]
        }
      },
    })
    footer(2)

    // ── PAGE 3: Fixture Schedule ───────────────────────────────────────────────
    doc.addPage()
    curY = sectionHeader("03 · FIXTURE SCHEDULE", 18)

    const schHead = ["FLOOR", "ROOM", "FIXTURE TYPE", "QTY", "LUMENS", "BEAM", "WATT", "TOTAL W", "PROTOCOL", "CCT"]
    const schBody = allR.flatMap(r => {
      // Build groups using resolveLabel
      const groups = {}
      const roomProtocol = r.room?.roomProtocol ?? "NON-DIM"
      for (const l of r.lights) {
        const key = `${l.fixtureId ?? l.category ?? "?"}__${l.watt}__${l.cctType ?? "single"}`
        const ep  = (l.protocol && l.protocol !== "Room Default") ? l.protocol : roomProtocol
        if (!groups[key]) groups[key] = {
          label: resolveLabel(l), lumens: l.lumens ?? 0,
          beamAngle: l.beamAngle ?? (FIXTURE_MAP[l.fixtureId]?.beamAngle ?? "—"),
          watt: l.watt ?? 0, qty: 0, totalWatt: 0,
          protocol: ep, cctType: l.cctType ?? "single",
        }
        groups[key].qty++
        groups[key].totalWatt += l.watt ?? 0
      }
      return Object.values(groups).map(g => [
        r.floorName, r.name, g.label, g.qty,
        g.lumens + " lm", g.beamAngle + "°", g.watt + " W", g.totalWatt + " W",
        PROTOCOL_LBL[g.protocol] ?? g.protocol,
        CCT_LBL[g.cctType] ?? g.cctType,
      ])
    })

    makeTable(schHead, schBody, curY)
    footer(3)

    // ── PAGE 4: Electrical Summary ─────────────────────────────────────────────
    doc.addPage()
    curY = sectionHeader("04 · ELECTRICAL SUMMARY", 18)

    // Section A — Circuit summary
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...DARK)
    doc.text("A · CIRCUIT SUMMARY", M, curY + 5)
    curY += 9

    const circHead = ["CIRCUIT", "FLOOR", "ROOM", "FIXTURES", "LOAD (W)", "MCB", "WIRE", "V-DROP %", "STATUS"]
    const circBody = []
    for (const r of allR) {
      const cirs = computeCircuits(r.lights)
      for (const c of cirs) {
        const load = c.totalWatt
        // Simple v-drop estimate: assume 20m cable, 230V
        const current   = load / 230
        const cableLen  = 20
        const RHO       = 0.01724
        const area      = c.wireSize === "2.5mm²" ? 2.5 : 1.5
        const vDrop     = (2 * cableLen * current * RHO / area) / 230 * 100
        const vStatus   = vDrop <= 3 ? "GOOD" : vDrop <= 5 ? "WARNING" : "CRITICAL"
        circBody.push([
          c.circuitId, r.floorName, r.name,
          c.fixtures.length, load + " W", c.mcb, c.wireSize,
          vDrop.toFixed(1) + "%", vStatus,
        ])
      }
    }

    autoTable(doc, {
      startY: curY,
      margin: { left: M, right: M },
      head: [circHead],
      body: circBody,
      styles: { font: "helvetica", fontSize: 8, cellPadding: 2.5, textColor: DARK, lineColor: [220, 220, 220], lineWidth: 0.1 },
      headStyles: { fillColor: GRAY_HDR, textColor: DARK, fontStyle: "bold" },
      alternateRowStyles: { fillColor: ROW_ALT },
      bodyStyles: { fillColor: [255, 255, 255] },
      didParseCell(data) {
        if (data.section === "body" && data.column.index === 7) {
          const v = parseFloat(data.cell.raw)
          if (!isNaN(v)) {
            if (v <= 3)      data.cell.styles.textColor = [76, 175, 125]
            else if (v <= 5) data.cell.styles.textColor = [224, 123, 42]
            else             data.cell.styles.textColor = [224, 82, 82]
          }
        }
        if (data.section === "body" && data.column.index === 8) {
          const v = data.cell.raw
          if (v === "GOOD")     data.cell.styles.textColor = [76, 175, 125]
          else if (v === "WARNING")  data.cell.styles.textColor = [224, 123, 42]
          else if (v === "CRITICAL") data.cell.styles.textColor = [224, 82, 82]
        }
      },
    })
    curY = doc.lastAutoTable.finalY + 8

    // Section B — Driver schedule
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(...DARK)
    doc.text("B · DRIVER SCHEDULE", M, curY)
    curY += 5

    const CCT_DRIVER_NOTE = {
      "tunable": "2-ch driver req.", "rgbw": "4-ch RGBW driver req.",
      "dali-dt8": "DALI DT8 driver req.", "zigbee-cct": "Zigbee module req.",
    }
    const drvHead = ["FIXTURE TYPE", "DRIVER TYPE", "INPUT", "OUTPUT (mA)", "QTY", "DIMMING", "NOTES"]
    const drvBody = []
    for (const r of allR) {
      const roomProto = r.room?.roomProtocol ?? "NON-DIM"
      const groups = {}
      for (const l of r.lights) {
        if (l.category === "LED_STRIP") continue
        const proto  = (l.protocol && l.protocol !== "Room Default") ? l.protocol : roomProto
        const cctTyp = l.cctType ?? "single"
        const key    = `${resolveLabel(l)}_${l.watt ?? 0}_${proto}_${cctTyp}`
        if (!groups[key]) groups[key] = { label: resolveLabel(l), watt: l.watt ?? 0, qty: 0, protocol: proto, cctType: cctTyp }
        groups[key].qty++
      }
      for (const g of Object.values(groups)) {
        const mA = g.watt <= 7 ? 350 : g.watt <= 14 ? 500 : g.watt <= 20 ? 700 : 1050
        const dimming = PROTOCOL_LBL[g.protocol] ?? "Non-dim"
        const note    = CCT_DRIVER_NOTE[g.cctType] ?? ""
        drvBody.push([g.label, "CC", "220–240V AC", mA + " mA", g.qty, dimming, note])
      }
    }
    makeTable(drvHead, drvBody, curY)
    footer(4)

    // ── PAGES 5+: Per-room detail pages ───────────────────────────────────────
    const CANVAS_W_PDF = 1400, CANVAS_H_PDF = 750

    // Helper: convert canvas-px coords to room-relative mm
    function canvasToRoomMM(light, roomObj) {
      const rW = Number(roomObj.room?.roomWidth  ?? 0)
      const rH = Number(roomObj.room?.roomHeight ?? 0)
      if (rW === 0 || rH === 0) return null
      const useDrawn  = roomObj.roomOffsetX != null && roomObj.drawnWidthPx != null
      if (!useDrawn) return null
      const pxPerMm   = roomObj.drawnWidthPx / rW
      const ox        = roomObj.roomOffsetX != null ? roomObj.roomOffsetX : 20
      const oy        = roomObj.roomOffsetY != null ? roomObj.roomOffsetY : 30
      const mmX = ((light.x ?? 0) - ox) / pxPerMm
      const mmY = ((light.y ?? 0) - oy) / pxPerMm
      return { mmX, mmY }
    }

    const selectedRooms = allR.filter(r => exportRoomIds.includes(r.id))
    let pageNum = 5
    for (const r of selectedRooms) {
      doc.addPage()
      const rW = Number(r.room?.roomWidth  ?? 0)
      const rH = Number(r.room?.roomHeight ?? 0)
      const { areaM2, lux, rcr, uf } = _calcRoomExport(r)
      const target  = Number(r.room?.targetLux ?? 0)
      const load    = r.lights.reduce((s, l) => s + (l.watt ?? 0), 0)
      const status  = lux === 0 || target === 0 ? "—"
        : lux < target * 0.8  ? "UNDERLIT"
        : lux <= target * 1.2 ? "GOOD"
        : "OVERLIT"
      const statusColor = status === "GOOD" ? [76,175,125] : status === "UNDERLIT" ? [224,123,42] : status === "OVERLIT" ? [224,82,82] : DARK

      // Room header
      curY = sectionHeader(`${r.floorName} — ${r.name}`, 18)
      doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(120, 120, 120)
      const dimStr = rW > 0 && rH > 0 ? `${(rW/1000).toFixed(1)}m × ${(rH/1000).toFixed(1)}m` : "—"
      doc.text(`${dimStr}   Target: ${target || "—"} lux   Area: ${areaM2.toFixed(1)} m²`, M, curY)
      curY += 6


      // ── Room stats row ────────────────────────────────────────────────────────
      const statsItems = [
        ["FIXTURES", String(r.lights.length)],
        ["LOAD", load + " W"],
        ["AVG LUX", r.lights.length === 0 ? "—" : String(Math.round(lux))],
        ["TARGET", target ? target + " lx" : "—"],
        ["RCR", rcr.toFixed(2)],
        ["UF", uf.toFixed(2)],
        ["AREA", areaM2.toFixed(1) + " m²"],
      ]
      const boxW  = (PW - 2 * M - (statsItems.length - 1) * 3) / statsItems.length
      const boxH  = 14
      for (let i = 0; i < statsItems.length; i++) {
        const [lbl, val] = statsItems[i]
        const bx = M + i * (boxW + 3)
        doc.setFillColor(245, 245, 245); doc.setDrawColor(220, 220, 220); doc.setLineWidth(0.15)
        doc.roundedRect(bx, curY, boxW, boxH, 1, 1, "FD")
        doc.setFont("helvetica", "normal"); doc.setFontSize(6); doc.setTextColor(150, 150, 150)
        doc.text(lbl, bx + boxW / 2, curY + 4.5, { align: "center" })
        // Status value gets its own color
        if (lbl === "AVG LUX" && status !== "—") doc.setTextColor(...statusColor)
        else doc.setTextColor(...DARK)
        doc.setFont("helvetica", "bold"); doc.setFontSize(9)
        doc.text(val, bx + boxW / 2, curY + 11, { align: "center" })
      }
      curY += boxH + 6

      // Status badge
      doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(...statusColor)
      doc.text(`STATUS: ${status}`, M, curY); curY += 6

      // ── Fixture detail table ───────────────────────────────────────────────────
      const roomHead = ["FIXTURE", "QTY", "WATT", "LUMENS", "BEAM", "CCT", "PROTOCOL", "TOTAL LOAD"]
      const roomBody = []
      const roomGroups = {}
      const roomP = r.room?.roomProtocol ?? "NON-DIM"
      for (const l of r.lights) {
        const key = `${l.fixtureId ?? l.category ?? "?"}__${l.watt}__${l.cctType ?? "single"}`
        const ep  = (l.protocol && l.protocol !== "Room Default") ? l.protocol : roomP
        if (!roomGroups[key]) roomGroups[key] = {
          label: resolveLabel(l), lumens: l.lumens ?? 0,
          beamAngle: l.beamAngle ?? (FIXTURE_MAP[l.fixtureId]?.beamAngle ?? "—"),
          watt: l.watt ?? 0, qty: 0, totalWatt: 0, totalLengthM: 0,
          category: l.category, protocol: ep, cctType: l.cctType ?? "single",
        }
        roomGroups[key].qty++
        roomGroups[key].totalWatt += l.watt ?? 0
        roomGroups[key].totalLengthM += l.lengthM ?? 0
      }
      for (const g of Object.values(roomGroups)) {
        roomBody.push([
          g.label, g.qty, g.watt + " W", g.lumens + " lm",
          (g.category === "LED_STRIP" ? g.totalLengthM.toFixed(1) + " m" : g.beamAngle + "°"), CCT_LBL[g.cctType] ?? g.cctType,
          PROTOCOL_LBL[g.protocol] ?? g.protocol,
          g.totalWatt + " W",
        ])
      }
      if (roomBody.length > 0) makeTable(roomHead, roomBody, curY)

      footer(pageNum++)
    }

    // ── Final page: Layout Snapshot ────────────────────────────────────────────
    const stage = canvasRef.current?.getStage()
    if (stage) {
      const dataUrl = stage.toDataURL({ pixelRatio: 2 })
      doc.addPage()
      curY = sectionHeader(`${pageNum} · LAYOUT SNAPSHOT`, 18)

      const usableW = PW - 2 * M
      const usableH = PH - curY - 20
      const nativeRatio = 750 / 1400
      let imgW = usableW
      let imgH = imgW * nativeRatio
      if (imgH > usableH) { imgH = usableH; imgW = imgH / nativeRatio }
      const imgX = M + (usableW - imgW) / 2
      const imgY = curY + (usableH - imgH) / 2
      doc.addImage(dataUrl, "PNG", imgX, imgY, imgW, imgH)
      footer(pageNum)
    }

    // Watermark every page for non-paid users
    if (!isPaidPlan()) {
      const total = doc.internal.getNumberOfPages()
      for (let p = 1; p <= total; p++) {
        doc.setPage(p)
        doc.setFont("helvetica", "bold")
        doc.setFontSize(28)
        doc.setTextColor(210, 210, 210)
        doc.text("LUMINA DESIGN — FREE TRIAL", PW / 2, PH / 2, { align: "center", angle: 45 })
      }
    }

    doc.save(`${safeName}-report.pdf`)
  }

  function handleExportPNG() {
    const stage = canvasRef.current?.getStage()
    if (!stage) return
    const dataUrl = stage.toDataURL({ pixelRatio: 2 })
    const a = document.createElement("a")
    a.href = dataUrl
    a.download = `${projectName.replace(/[^a-z0-9_\-]/gi, "_")}-layout.png`
    a.click()
  }

  async function handleExportBOQ() {
    const ExcelJS = (await import("exceljs")).default
    const allR = _allRoomsForExport
    const wb = new ExcelJS.Workbook()

    // Sheet 1: Fixture BOQ
    const ws1 = wb.addWorksheet("Fixture BOQ")
    ws1.columns = [8, 22, 22, 32, 14, 12, 12, 10, 10, 24].map(w => ({ width: w }))
    ws1.addRow(["SR", "FLOOR", "ROOM", "FIXTURE TYPE", "LUMENS", "BEAM", "WATT", "QTY", "UNIT", "PROTOCOL"])
    let sr = 1, totalQty = 0, totalW = 0
    for (const r of allR) {
      for (const g of _fixtureGroupsExport(r)) {
        ws1.addRow([sr++, r.floorName, r.name, g.label, g.lumens, g.beamAngle + "°", g.watt, g.qty, "No.", PROTOCOL_LBL[g.protocol] ?? g.protocol])
        totalQty += g.qty; totalW += g.totalWatt
      }
    }
    ws1.addRow(["", "", "", "TOTAL", "", "", "", totalQty, "", totalW + " W"])

    // Sheet 2: Electrical
    const ws2 = wb.addWorksheet("Electrical")
    ws2.columns = [22, 22, 16, 14, 14, 18].map(w => ({ width: w }))
    ws2.addRow(["FLOOR", "ROOM", "LOAD (W)", "CIRCUITS", "MCB", "WIRE SIZE"])
    for (const r of allR) {
      const load = r.lights.reduce((s, l) => s + (l.watt ?? 0), 0)
      let circuits = 0, cur = 0, mcb = "6A", wire = "1.5mm²"
      for (const l of r.lights) {
        const w = l.watt ?? 0
        if (cur + w > MAX_CIRCUIT_WATT) { circuits++; cur = 0 }
        cur += w; circuits = Math.max(circuits, 1)
        mcb = cur <= 1380 ? "6A" : cur <= 2300 ? "10A" : "16A"
        wire = cur <= 2944 ? "1.5mm²" : "2.5mm²"
      }
      if (r.lights.length === 0) circuits = 0
      ws2.addRow([r.floorName, r.name, load + " W", circuits, mcb, wire + " FR"])
    }

    // Sheet 3: Room Summary
    const ws3 = wb.addWorksheet("Room Summary")
    ws3.columns = [22, 22, 14, 14, 14, 14, 12, 14].map(w => ({ width: w }))
    ws3.addRow(["FLOOR", "ROOM", "AREA (m²)", "TARGET LUX", "ACTUAL LUX", "STATUS", "FIXTURES", "LOAD (W)"])
    for (const r of allR) {
      const { areaM2, lux } = _calcRoomExport(r)
      const target = Number(r.room?.targetLux ?? 0)
      const status = lux === 0 || target === 0 ? "—" : lux < target * 0.8 ? "UNDERLIT" : lux <= target * 1.2 ? "GOOD" : "OVERLIT"
      const load = r.lights.reduce((s, l) => s + (l.watt ?? 0), 0)
      ws3.addRow([r.floorName, r.name, areaM2.toFixed(1), target || "—", r.lights.length === 0 ? "—" : Math.round(lux), status, r.lights.length, load + " W"])
    }

    // Watermark sheet for non-paid users
    if (!isPaidPlan()) {
      const wsWM = wb.addWorksheet("FREE TRIAL")
      wsWM.columns = [{ width: 50 }]
      const wmRow = wsWM.addRow(["LUMINA DESIGN — FREE TRIAL VERSION"])
      wmRow.font = { bold: true, size: 14, color: { argb: "FFD4A843" } }
      wsWM.addRow(["Upgrade to PRO or PROFESSIONAL to remove this watermark."])
      wsWM.orderNo = 0
    }

    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${projectName.replace(/[^a-z0-9_\-]/gi, "_")}-BOQ.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e) => {
      const inInput = e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable
      const ctrl    = e.ctrlKey || e.metaKey

      // ── Always-active (work even in inputs) ──
      if (e.key === 'Escape') {
        setSelectedLights([])
        setShowShortcuts(false)
        return
      }

      // ── Project ──
      if (ctrl && e.key === 's') { e.preventDefault(); handleSave(); return }
      if (ctrl && e.key === 'h') { e.preventDefault(); navigate('/dashboard'); return }

      if (inInput) return

      // ── Show shortcuts ──
      if (e.key === '?') { e.preventDefault(); setShowShortcuts(p => !p); return }

      // ── Selection / editing ──
      if (ctrl && e.key === 'a') {
        e.preventDefault()
        if (activeRoomObj?.lights) setSelectedLights(activeRoomObj.lights)
        return
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLights.length > 0) {
        e.preventDefault()
        patchActiveRoom(r => ({ lights: r.lights.filter(l => !selectedLights.some(s => s.id === l.id)) }))
        setSelectedLights([])
        return
      }
      if (ctrl && e.key === 'd' && selectedLights.length > 0) {
        e.preventDefault()
        const duplicated = selectedLights.map(f => ({ ...f, id: Math.random().toString(36).substr(2, 9), x: f.x + 50, y: f.y + 50 }))
        patchActiveRoom(r => ({ lights: [...r.lights, ...duplicated] }))
        setSelectedLights(duplicated)
        return
      }
      if (ctrl && e.key === 'c' && selectedLights.length > 0) {
        e.preventDefault()
        localStorage.setItem('copiedFixtures', JSON.stringify(selectedLights))
        return
      }
      if (ctrl && e.key === 'v') {
        e.preventDefault()
        const copied = JSON.parse(localStorage.getItem('copiedFixtures') || '[]')
        if (copied.length > 0) {
          const pasted = copied.map(f => ({ ...f, id: Math.random().toString(36).substr(2, 9), x: f.x + 30, y: f.y + 30 }))
          patchActiveRoom(r => ({ lights: [...r.lights, ...pasted] }))
          setSelectedLights(pasted)
        }
        return
      }

      // ── Tools ──
      if (e.key === 'd' || e.key === 'D') {
        e.preventDefault()
        setActiveTool(t => t === 'draw-room' ? 'fixture' : 'draw-room')
        return
      }
      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault()
        autoPlaceLights()
        return
      }
      if (ctrl && (e.key === 'i' || e.key === 'I')) {
        e.preventDefault()
        setLeftTab(t => t === 'ai' ? 'fixture' : 'ai')
        return
      }

      // ── Visualization ──
      if (e.key === 'b' || e.key === 'B') { e.preventDefault(); setShowBeam(p => !p); return }
      if (e.key === 'h' || e.key === 'H') { e.preventDefault(); setShowHeatmap(p => !p); return }
      if (e.key === 'g' || e.key === 'G') { e.preventDefault(); setSnapToGrid(p => !p); return }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [activeRoomObj, selectedLights])

  // ── Render ────────────────────────────────────────────────────────────────

  if (authLoading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#000000", fontFamily: "IBM Plex Mono", fontSize: 13, color: "#555555" }}>
      Authenticating…
    </div>
  )

  if (!user) return <AuthPage />

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#000000", overflow: "hidden", fontFamily: "IBM Plex Mono" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <header style={{ height: 48, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", background: "#000000", borderBottom: "1px solid #2e2e2e", flexShrink: 0, position: "relative", zIndex: 600 }}>
        {/* Left: logo + project name */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: "#ffffff", letterSpacing: "0.06em" }}>LUMINA</span>
            <span style={{ fontSize: 15, fontWeight: 400, color: "#555555", letterSpacing: "0.06em" }}>DESIGN</span>
          </div>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ background: "transparent", border: "1px solid #2e2e2e", borderRadius: 4, color: "#d4a843", fontFamily: "IBM Plex Mono", fontSize: 11, fontWeight: 500, padding: "3px 10px", cursor: "pointer", letterSpacing: "0.04em", transition: "border-color 0.1s, color 0.1s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#d4a843"; e.currentTarget.style.color = "#f0d080" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#222222"; e.currentTarget.style.color = "#d4a843" }}
          >← Projects</button>
          <div style={{ width: 1, height: 16, background: "#222222" }} />
          {editingName ? (
            <input
              autoFocus
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
              onBlur={() => setEditingName(false)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === "Escape") setEditingName(false) }}
              style={{ background: "transparent", border: "none", borderBottom: "1px solid #d4a843", outline: "none", color: "#ffffff", fontFamily: "IBM Plex Mono", fontSize: 16, fontWeight: 600, width: 200, padding: "1px 2px" }}
            />
          ) : (
            <span
              onClick={() => setEditingName(true)}
              title="Click to rename project"
              style={{ fontSize: 16, fontWeight: 600, color: "#ffffff", cursor: "text", letterSpacing: "0.01em", transition: "color 0.1s" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#d4a843" }}
              onMouseLeave={e => { e.currentTarget.style.color = "#f0f0f0" }}
            >{projectName}</span>
          )}
          <span style={{ fontSize: 11, color: "#555555" }}>{projectId ? `${projectId.slice(0, 8)}…` : "unsaved"}</span>
        </div>

        {/* Center: quick stat chips */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {[
            { label: "FIXTURES", value: projectTotalFixtures },
            { label: "LOAD",     value: `${projectTotalWatt}W` },
            { label: "LUX",      value: lights.length ? Math.round(totalLux) : "—" },
            { label: "SIZE",     value: (() => { const u = getStoredUnit(); const w = fromMM(roomWidth, u); const h = fromMM(roomHeight, u); return w && h ? `${w}×${h}${u}` : "—" })() },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 10px", height: 28, borderRadius: 4, background: "#0a0a0a", border: "1px solid #222222" }}>
              <span style={{ fontSize: 9, color: "#888888", letterSpacing: "0.08em" }}>{label}</span>
              <span style={{ fontSize: 12, color: "#ffffff", fontWeight: 500 }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Right: actions + user */}
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button className={`${styles.hdrBtn} ${styles.hdrBtnSave}`} onClick={handleSave}>{saving ? "Saving…" : "Save"}</button>
          <button className={styles.hdrBtn} onClick={() => setShowLoadModal(true)}>Load</button>
          <button className={styles.hdrBtn} onClick={handleShare}>Share</button>
          <button className={styles.hdrBtn} onClick={() => requirePro('Export', () => { setExportRoomIds(floors.flatMap(f => f.rooms.map(r => r.id))); setShowExportModal(true) })}>Export</button>
          <div style={{ width: 1, height: 16, background: "#222222", margin: "0 4px" }} />
          <button
            onClick={() => setShowShortcuts(true)}
            title="Keyboard shortcuts (?)"
            style={{ background: "transparent", border: "1px solid #2e2e2e", borderRadius: "50%", width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", color: "#555555", fontFamily: "IBM Plex Mono", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0, transition: "border-color 0.1s, color 0.1s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#d4a843"; e.currentTarget.style.color = "#d4a843" }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#222222"; e.currentTarget.style.color = "#555" }}
          >?</button>
          <span style={{ fontSize: 11, color: "#555555", maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</span>
          <button className={`${styles.hdrBtn} ${styles.hdrBtnDanger}`} onClick={() => signOut(auth)}>Sign Out</button>
        </div>
      </header>

      <TrialBanner />

      {/* ── Merged stats bar ────────────────────────────────────────────────── */}
      {(() => {
        const luxVal    = lights.length ? Math.round(totalLux) : null
        const tgtLux    = Number(room.targetLux)
        const luxStatus = luxVal == null ? null
          : luxVal > tgtLux * 1.25 ? "OVERLIT"
          : luxVal >= tgtLux * 0.9  ? "GOOD"
          : "DIM"
        const sc  = { GOOD: "#4caf7d", OVERLIT: "#e07b2a", DIM: "#888888" }[luxStatus] ?? "#888"
        const sb  = { GOOD: "#0a1a0f", OVERLIT: "#1a0f00", DIM: "#0a0a0a" }[luxStatus] ?? "#0a0a0a"
        const dimUnit = getStoredUnit()
        const wDisp   = fromMM(roomWidth,  dimUnit)
        const hDisp   = fromMM(roomHeight, dimUnit)
        const sizeStr = wDisp && hDisp ? `${wDisp}×${hDisp}${dimUnit}` : "—"
        const div = <div style={{ width: 1, height: 16, background: "#222222", flexShrink: 0 }} />
        const S = (label, val) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
            <span style={{ fontSize: 11, color: "#555555", letterSpacing: "0.05em" }}>{label}</span>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#ffffff" }}>{val}</span>
          </div>
        )
        return (
          <div style={{ height: 36, display: "flex", alignItems: "center", background: "#0a0a0a", borderBottom: "1px solid #2e2e2e", fontFamily: "IBM Plex Mono", flexShrink: 0, overflow: "hidden" }}>
            {S("FLOORS",   floors.length)}
            {div}
            {S("ROOMS",    allRooms.length)}
            {div}
            {S("FIXTURES", projectTotalFixtures)}
            {div}
            {S("LOAD",     `${projectTotalWatt}W`)}
            <div style={{ marginLeft: "auto", display: "flex", alignItems: "center" }}>
              {div}
              {S("SIZE", sizeStr)}
              {div}
              {S("MH",  `${mh.toFixed(2)}m`)}
              {div}
              {S("RCR", rcr.toFixed(2))}
              {div}
              {S("UF",  uf.toFixed(2))}
              {div}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 14px" }}>
                <span style={{ fontSize: 11, color: "#555555", letterSpacing: "0.05em" }}>LUX</span>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#ffffff" }}>{luxVal ?? "—"}</span>
                {luxStatus && (
                  <span style={{ padding: "1px 7px", borderRadius: 3, fontSize: 10, fontWeight: 500, background: sb, color: sc, letterSpacing: "0.04em" }}>{luxStatus}</span>
                )}
              </div>
            </div>
          </div>
        )
      })()}


      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", overflow: "hidden" }}>

        {/* ── Left: Fixture Library / AI Recommender tabs ─────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", width: leftSidebarCollapsed ? 40 : 260, minWidth: leftSidebarCollapsed ? 40 : 260, height: "100%", background: "#0a0a0a", borderRight: "1px solid #222222", overflow: "hidden", transition: "width 0.2s, min-width 0.2s", flexShrink: 0 }}>
          {leftSidebarCollapsed ? (
            /* Collapsed: icon-only mode */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, gap: 4 }}>
              <button
                onClick={() => setLeftSidebarCollapsed(false)}
                title="Expand sidebar"
                style={{ width: 32, height: 32, background: "transparent", border: "1px solid #222222", borderRadius: 4, color: "#888888", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >›</button>
              <button
                onClick={() => { setLeftSidebarCollapsed(false); setLeftTab('fixture') }}
                title="Fixtures"
                style={{ width: 32, height: 32, background: leftTab === 'fixture' ? "#1a1a1a" : "transparent", border: "1px solid #222222", borderRadius: 4, color: leftTab === 'fixture' ? "#d4a843" : "#888888", cursor: "pointer", fontSize: 12, fontFamily: "IBM Plex Mono", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >▤</button>
              <button
                onClick={() => openAiTab()}
                title="AI Suggest"
                style={{ width: 32, height: 32, background: leftTab === 'ai' ? "#1a1a1a" : "transparent", border: "1px solid #222222", borderRadius: 4, color: leftTab === 'ai' ? "#d4a843" : "#888888", cursor: "pointer", fontSize: 12, fontFamily: "IBM Plex Mono", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >✦</button>
            </div>
          ) : (
            <>
              {/* Tab bar with collapse toggle */}
              <div style={{ display: "flex", borderBottom: "1px solid #222222", flexShrink: 0 }}>
                {[{ id: 'fixture', label: 'FIXTURES' }, { id: 'ai', label: 'AI' }, { id: 'my-fixtures', label: 'MY FIX' }].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => tab.id === 'ai' ? openAiTab() : setLeftTab(tab.id)}
                    style={{
                      flex: 1, padding: "8px 0", background: leftTab === tab.id ? "#111111" : "transparent",
                      border: "none", borderBottom: leftTab === tab.id ? "2px solid #d4a843" : "2px solid transparent",
                      color: leftTab === tab.id ? "#d4a843" : "#888888", fontSize: 10, letterSpacing: "0.1em",
                      fontFamily: "IBM Plex Mono", cursor: "pointer",
                    }}
                  >{tab.label}</button>
                ))}
                <button
                  onClick={() => setLeftSidebarCollapsed(true)}
                  title="Collapse sidebar"
                  style={{ width: 30, background: "transparent", border: "none", borderBottom: "2px solid transparent", color: "#555555", cursor: "pointer", fontSize: 14, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}
                >‹</button>
              </div>
              {/* Tab content */}
              <div style={{ flex: 1, overflow: "hidden", display: leftTab === 'fixture' ? "flex" : "none", flexDirection: "column" }}>
                <FixturePanel
                  activeFixtureId={activeFixtureId}
                  onSelect={handleLibrarySelect}
                  userId={user?.uid ?? null}
                  isProfessional={isProfessional()}
                  onProfessionalGate={() => setGateModal({ feature: 'Professional Fixtures', professionalOnly: true })}
                />
              </div>
              <div style={{ flex: 1, overflow: "auto", display: leftTab === 'ai' ? "flex" : "none", flexDirection: "column" }}>
                <AIRecommender
                  activeRoom={room}
                  onApplyFixture={handleAIApply}
                  onApplyAll={handleAIApplyAll}
                  onClose={() => setLeftTab('fixture')}
                  panelMode
                />
              </div>
              <div style={{ flex: 1, overflow: "auto", display: leftTab === 'my-fixtures' ? "flex" : "none", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 20 }}>
                {isProfessional() ? (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 10, color: "#555", letterSpacing: "0.12em", marginBottom: 16 }}>NO CUSTOM FIXTURES YET</div>
                    <button
                      onClick={() => notify.warning("Custom fixture builder coming soon.")}
                      style={{ padding: "8px 14px", background: "#d4a843", color: "#000", border: "none", fontFamily: "IBM Plex Mono", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", cursor: "pointer", borderRadius: 2 }}
                    >+ ADD CUSTOM FIXTURE</button>
                  </div>
                ) : (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 9, color: "#d4a843", letterSpacing: "0.14em", fontWeight: 700, marginBottom: 8 }}>PROFESSIONAL ONLY</div>
                    <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.08em", lineHeight: 1.7 }}>
                      UPGRADE TO PROFESSIONAL<br/>TO SAVE CUSTOM FIXTURES
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* ── Center: Canvas Area 1fr ──────────────────────────────────────── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

          {/* Centered floating toolbar */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", background: "#000000", borderBottom: "1px solid #1e1e1e", height: 44, flexShrink: 0 }}>
            <div className={styles.toolbar} style={{ height: 44, padding: "0 4px" }}>
              <button className={styles.tbBtn} onClick={autoPlaceLights} title="Auto Place — Automatically distribute fixtures in an optimal grid based on target lux and room size">Auto Place</button>
              <button className={styles.tbBtn} onClick={() => setSnapToGrid(p => !p)} style={snapToGrid ? tbActive : {}} title={snapToGrid ? "Snap to grid: ON — fixtures align to grid points" : "Snap to grid: OFF — free placement"}>Snap {snapToGrid ? "On" : "Off"}</button>
              <button className={`${styles.tbBtn} ${styles.tbBtnDestructive}`} onClick={() => patchActiveRoom(() => ({ lights: [] }))} title="Clear all fixtures from this room">Clear</button>
              <div className={styles.tbSeparator} />
              <button className={styles.tbBtn} onClick={() => setShowBeam(p => !p)} style={showBeam ? tbActive : {}} title="Beam — Visualize beam spread cones for each fixture on the canvas">Beam</button>
              <button className={styles.tbBtn} onClick={() => setShowHeatmap(p => !p)} style={showHeatmap ? tbActive : {}} title="Heatmap — Show false-colour lux intensity map across the room floor">Heatmap</button>
              <div className={styles.tbSeparator} />
              <button
                title="DALI — Enable DALI 2.0 addressable lighting system. Each fixture gets a unique bus address for individual dimming control."
                onClick={() => requirePro('DALI', () => {
  setDaliEnabled(prev => !prev)
  if (!daliEnabled) {
    setFloors(prevFloors => prevFloors.map(f => ({
      ...f,
      rooms: f.rooms.map(r => ({
        ...r,
        lights: r.lights.map(l =>
          (!l.protocol || l.protocol === 'Room Default')
            ? { ...l, protocol: 'DALI' }
            : l
        )
      }))
    })))
  }
})}
                style={{
                  background: daliEnabled ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.12)',
                  color: daliEnabled ? '#22c55e' : '#ef4444',
                  border: `1px solid ${daliEnabled ? '#22c55e55' : '#ef444455'}`,
                  padding: '3px 10px',
                  borderRadius: 20,
                  cursor: 'pointer',
                  fontSize: 11,
                  fontFamily: 'IBM Plex Mono',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  transition: 'background 0.2s, color 0.2s, border-color 0.2s',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: daliEnabled ? '#22c55e' : '#ef4444', flexShrink: 0, transition: 'background 0.2s' }} />
                DALI {daliEnabled ? 'ON' : 'OFF'}
              </button>
              {daliActive && (
                <select
                  value={daliNodeLimit}
                  onChange={e => setDaliNodeLimit(Number(e.target.value))}
                  style={{ background: '#111111', border: '1px solid #2a2a2a', color: '#d4a843', fontSize: 11, padding: '3px 6px', borderRadius: 3 }}
                >
                  <option value={64}>64 nodes</option>
                  <option value={128}>128 nodes</option>
                </select>
              )}
              <button className={styles.tbBtn} onClick={() => setActiveTool(activeTool === "db"  ? "fixture" : "db")}  style={activeTool === "db"  ? tbActive : {}} title="Place Distribution Board marker">DB</button>
              <button className={styles.tbBtn} onClick={() => setActiveTool(activeTool === "ctr" ? "fixture" : "ctr")} style={activeTool === "ctr" ? tbActive : {}} title="Place Contactor / Controller marker">CTR</button>
              <button className={styles.tbBtn} onClick={() => setActiveTool(activeTool === "jb"  ? "fixture" : "jb")}  style={activeTool === "jb"  ? tbActive : {}} title="Place Junction Box marker">JB</button>
              <button className={styles.tbBtn} onClick={() => { setShowEmergency(p => !p); setActiveTool(activeTool === "emergency" ? "fixture" : "emergency") }} style={showEmergency || activeTool === "emergency" ? tbActive : {}} title="Toggle emergency lighting mode">Emergency</button>
              <button className={styles.tbBtn} onClick={() => leftTab === 'ai' ? setLeftTab('fixture') : openAiTab()} style={leftTab === 'ai' ? tbActive : {}} title="AI Recommend — Get AI-powered fixture suggestions optimised for your room type, size, and target lux level">AI RECOMMEND</button>
              <div className={styles.tbSeparator} />
              {floorPlan && (
                <button
                  className={styles.tbBtn}
                  onClick={() => {
                    console.log('[TOOLBAR DRAW ROOM CLICKED]')
                    setActiveTool(activeTool === 'draw-room' ? 'fixture' : 'draw-room')
                  }}
                  style={activeTool === 'draw-room' ? tbActive : {}}
                  title="Draw room boundary on the floor plan"
                >Draw Room</button>
              )}
              <button className={styles.tbBtn} onClick={() => setShowSettings(p => !p)} style={showSettings ? tbActive : {}} title="Configure room dimensions, target lux, and mounting height">Settings</button>
              <button className={styles.tbBtn} onClick={() => setShowVisualEditor(p => !p)} style={showVisualEditor ? tbActive : {}} title="Edit fixture size, color, and shape">Visual Editor</button>

              {/* Protocol dropdown - only show when fixtures selected */}
              {selectedLights.length > 0 && (
                <>
                  <div className={styles.tbSeparator} />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        selectedLights.forEach(light => updateLight(light.id, { protocol: e.target.value }))
                        e.target.value = ""
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      background: '#111111',
                      color: '#d4a843',
                      border: '1px solid #2a2a2a',
                      borderRadius: 3,
                      fontSize: 11,
                      fontFamily: 'IBM Plex Mono',
                      cursor: 'pointer'
                    }}
                    title={selectedLights.length + " fixture" + (selectedLights.length > 1 ? "s" : "") + " selected"}
                  >
                    <option value="">Protocol ({selectedLights.length})</option>
                    <option value="NON-DIM">NON-DIM</option>
                    <option value="DALI">DALI</option>
                    <option value="ZIGBEE">ZIGBEE</option>
                    <option value="0-10V">0-10V</option>
                    <option value="Phase-cut">Phase-cut</option>
                  </select>
                </>
              )}
            </div>
          </div>

          {/* Floor tabs */}
          <FloorTabsBar
            floors={floors}
            activeFloorId={activeFloorId}
            onSelectFloor={setActiveFloorId}
            onAddFloor={addFloor}
            onRenameFloor={renameFloor}
            onDeleteFloor={deleteFloor}
          />

          {/* Room tabs */}
          <RoomTabsBar
            rooms={activeFloor.rooms}
            activeRoomId={activeRoomId}
            onSelectRoom={setActiveRoom}
            onAddRoom={addRoom}
            onRenameRoom={renameRoom}
            onDeleteRoom={deleteRoom}
          />

          {/* Scrollable canvas + detail panels */}
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6, position: "relative", background: "#000000" }}>

            {/* Settings panel moved to fixed right slide-in below */}

            {/* ── Visual Editor Floating Panel ── */}
            {showVisualEditor && selectedLights.length > 0 && (
              <div
                style={{
                  position: 'fixed',
                  left: visualEditorPos.x,
                  top: visualEditorPos.y,
                  width: 280,
                  maxHeight: '90vh',
                  background: '#0f0f0f',
                  border: '1px solid #2a2a2a',
                  borderRadius: 6,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.8)',
                  zIndex: 10000,
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: 'IBM Plex Mono'
                }}
              >
                <div
                  onMouseDown={startVisualEditorDrag}
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #2a2a2a',
                    cursor: 'grab',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ fontSize: 11, color: '#d4a843', fontWeight: 'bold' }}>VISUAL EDITOR</span>
                  <button
                    onClick={() => setShowVisualEditor(false)}
                    style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: 14, padding: 0 }}
                  >✕</button>
                </div>
                <div style={{ padding: '12px', overflow: 'auto', flex: 1 }}>
                  {(() => {
                    const sizes = selectedLights.map(l => l.fixtureSize ?? 8)
                    const colors = selectedLights.map(l => l.fixtureColor ?? '#ffffff')
                    const shapes = selectedLights.map(l => l.fixtureShape ?? 'circle')
                    const commonSize = sizes.every(s => s === sizes[0]) ? sizes[0] : null
                    const commonColor = colors.every(c => c === colors[0]) ? colors[0] : null
                    const commonShape = shapes.every(s => s === shapes[0]) ? shapes[0] : null
                    return (<>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 10, color: '#d4a843', display: 'block', marginBottom: 6 }}>
                      SIZE: {commonSize ? commonSize + 'px' : 'Mixed'}
                    </label>
                    <input
                      type="range" min="5" max="20"
                      value={commonSize ?? 8}
                      onChange={(e) => selectedLights.forEach(l => updateLight(l.id, { fixtureSize: Number(e.target.value) }))}
                      style={{ width: '100%', cursor: 'pointer' }}
                    />
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 10, color: '#d4a843', display: 'block', marginBottom: 6 }}>COLOR</label>
                    <input
                      type="color"
                      value={commonColor ?? '#ffffff'}
                      onChange={(e) => selectedLights.forEach(l => updateLight(l.id, { fixtureColor: e.target.value }))}
                      style={{ width: '100%', height: 36, cursor: 'pointer', border: 'none', borderRadius: 3 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, color: '#d4a843', display: 'block', marginBottom: 6 }}>SHAPE</label>
                    <select
                      value={commonShape ?? 'circle'}
                      onChange={(e) => selectedLights.forEach(l => updateLight(l.id, { fixtureShape: e.target.value }))}
                      style={{
                        width: '100%', padding: '8px 6px', background: '#111111',
                        color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: 3,
                        fontSize: 10, fontFamily: 'IBM Plex Mono', cursor: 'pointer'
                      }}
                    >
                      <option value="circle">Circle</option>
                      <option value="square">Square</option>
                      <option value="diamond">Diamond</option>
                      <option value="triangle">Triangle</option>
                      <option value="hexagon">Hexagon</option>
                      <option value="star">Star</option>
                      <option value="rectangle">Rectangle</option>
                      <option value="cross">Cross</option>
                    </select>
                  </div>
                  </>)
                  })()}
                </div>
              </div>
            )}

            <DesignCanvas
              ref={canvasRef}
              lights={lights}
              onAddLight={addLight}
              onMoveLight={moveLight}
              onDeleteLight={deleteLight}
              onSelectLight={handleSelectLight}
              lux={totalLux}
              luxBreakdown={luxBreakdown}
              roomWidth={roomWidth}
              roomHeight={roomHeight}
              snapToGrid={snapToGrid}
              rcr={rcr}
              uf={uf}
              targetLux={Number(room.targetLux)}
              activeTool={activeTool}
              activeFixtureCategory={activeFixtureCategory}
              dbMarkers={dbMarkers}
              ctrMarkers={ctrMarkers}
              jbMarkers={jbMarkers}
              onAddMarker={addMarker}
              onMoveMarker={moveMarker}
              onDeleteMarker={deleteMarker}
              floorPlan={floorPlan}
              showBeam={showBeam}
              mountingHeight={mh}
              showHeatmap={showHeatmap}
              showEmergency={showEmergency}
              emergencyLights={emergencyLights}
              onAddEmergencyLight={addEmergencyLight}
              onMoveEmergencyLight={moveEmergencyLight}
              onDeleteEmergencyLight={deleteEmergencyLight}
              onUpdateLight={updateLight}
              onUpdateLightsOfType={updateLightsOfType}
              roomOffsetX={roomOffsetX}
              roomOffsetY={roomOffsetY}
              drawnWidthPx={drawnWidthPx}
              drawnHeightPx={drawnHeightPx}
              allRooms={activeFloor.rooms}
              activeRoomId={activeRoomId}
              onSelectRoom={setActiveRoom}
              onRoomBoundSet={handleRoomBoundSet}
              onHoverLight={setHoveredLight}
              daliAddresses={daliAddresses}
              onSelectLights={setSelectedLights}
              selectedLightIds={selectedLights.map(l => l.id)}
            />

            <ElectricalPanel
              circuits={circuits}
              daliEnabled={daliActive}
              daliActive={daliActive}
              daliAddresses={daliAddresses}
              busTopologies={busTopologies}
              setTopology={setTopology}
              busCableLengths={busCableLengths}
              daliNodeLimit={daliNodeLimit}
              voltageDropResults={voltageDropResults}
              driverSchedule={driverSchedule}
            />

            <EmergencyPanel
              showEmergency={showEmergency}
              emergencyDuration={emergencyDuration}
              setEmergencyDuration={setEmergencyDuration}
              emergencyLuxResults={emergencyLuxResults}
            />

            <ElectricalSummary
              perRoomSummary={perRoomSummary}
              daliEnabled={daliActive}
              totalBuses={totalBuses}
              totalCableM={totalCableM}
            />

          </div>

          {/* Bottom electrical bar — only when circuits exist */}
          {circuits.length > 0 && (() => {
            const phaseLoads = [0, 0, 0]
            circuits.forEach((c, i) => { phaseLoads[i % 3] += c.totalWatt })
            const maxVDrop = voltageDropResults.length > 0
              ? Math.max(...voltageDropResults.map(r => r.vDropPercent))
              : null
            const vDropCol = maxVDrop == null ? "#555"
              : maxVDrop <= 3 ? "#4caf7d"
              : maxVDrop <= 5 ? "#e07b2a"
              : "#e05252"
            const Col = ({ label, children, last }) => (
              <div style={{ flex: 1, borderRight: last ? "none" : "1px solid #222222", padding: "0 16px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ fontSize: 9, color: "#888888", letterSpacing: "0.08em", marginBottom: 3 }}>{label}</div>
                {children}
              </div>
            )
            return (
              <div style={{ height: 60, background: "#0a0a0a", borderTop: "1px solid #222222", display: "flex", alignItems: "stretch", flexShrink: 0, fontFamily: "IBM Plex Mono" }}>
                <Col label="CIRCUITS">
                  <span style={{ fontSize: 13, color: "#ffffff" }}>{circuits.length} circuit{circuits.length !== 1 ? "s" : ""}</span>
                  <span style={{ fontSize: 10, color: "#888888" }}>{totalWatt}W total</span>
                </Col>
                <Col label="VOLTAGE DROP">
                  <span style={{ fontSize: 13, color: vDropCol }}>{maxVDrop != null ? `${maxVDrop.toFixed(1)}%` : "—"}</span>
                  <span style={{ fontSize: 10, color: "#888888" }}>max across circuits</span>
                </Col>
                <Col label="DRIVER SCHEDULE">
                  <span style={{ fontSize: 13, color: "#ffffff" }}>{driverSchedule.length} type{driverSchedule.length !== 1 ? "s" : ""}</span>
                  <span style={{ fontSize: 10, color: "#888888" }}>{lights.length} fixture{lights.length !== 1 ? "s" : ""}</span>
                </Col>
                <Col label="PHASE BALANCE" last>
                  <div style={{ display: "flex", gap: 8 }}>
                    {["L1", "L2", "L3"].map((l, i) => (
                      <span key={l} style={{ fontSize: 11, color: ["#39c5cf", "#3dba74", "#e8a830"][i] }}>
                        {l}: {Math.round(phaseLoads[i])}W
                      </span>
                    ))}
                  </div>
                  <span style={{ fontSize: 10, color: "#888888" }}>3-phase distribution</span>
                </Col>
              </div>
            )
          })()}

        </div>

        {/* ── Right: Inspector Panel 200px ─────────────────────────────────── */}
        {(() => {
          const luxVal    = lights.length ? Math.round(totalLux) : null
          const tgtLux    = Number(room.targetLux)
          const luxStatus = luxVal == null ? null
            : luxVal > tgtLux * 1.25 ? "OVERLIT"
            : luxVal >= tgtLux * 0.9  ? "GOOD"
            : "DIM"
          const luxCol = { GOOD: "#4caf7d", OVERLIT: "#e07b2a", DIM: "#e05252" }[luxStatus] ?? "#e0e0e0"
          // Room geometry — used for hover-fixture position + distance stats
          const _hScale  = Math.min((CANVAS_W - 260) / (roomWidth || 1), (CANVAS_H - 220) / (roomHeight || 1))
          const hPxPerMm = (roomOffsetX != null && drawnWidthPx  != null && roomWidth > 0) ? drawnWidthPx / roomWidth : _hScale
          const hRoomX   = roomOffsetX != null ? roomOffsetX : 20
          const hRoomY   = roomOffsetY != null ? roomOffsetY : 30
          const hRoomPxW = (roomOffsetX != null && drawnWidthPx  != null) ? drawnWidthPx  : roomWidth  * _hScale
          const hRoomPxH = (roomOffsetX != null && drawnHeightPx != null) ? drawnHeightPx : roomHeight * _hScale
          const Sect = ({ title, children }) => (
            <div style={{ padding: "12px", borderBottom: "1px solid #141414" }}>
              <div style={{ fontSize: 9, letterSpacing: "0.12em", color: "#39c5cf", marginBottom: 8 }}>{title}</div>
              {children}
            </div>
          )
          const Row = ({ label, value, color }) => (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#444" }}>{label}</span>
              <span style={{ fontSize: 11, color: color ?? "#e0e0e0", fontWeight: 500 }}>{value}</span>
            </div>
          )
          return (
            <div style={{ width: 200, background: "#000000", borderLeft: "1px solid #1e1e1e", display: "flex", flexDirection: "column", flexShrink: 0, overflowY: "auto", fontFamily: "IBM Plex Mono" }}>

              {/* LUX HERO */}
              <div style={{ padding: "16px 12px", borderBottom: "1px solid #141414" }}>
                <div style={{ fontSize: 9, color: "#444", letterSpacing: "0.1em", marginBottom: 4 }}>AVG LUX</div>
                <div style={{ fontSize: 36, color: luxCol, fontWeight: 500, lineHeight: 1, marginBottom: 6 }}>{luxVal ?? "—"}</div>
                {luxStatus && (
                  <div style={{
                    display: "inline-block", padding: "2px 8px", borderRadius: 3,
                    fontSize: 10, fontWeight: 500, letterSpacing: "0.05em",
                    background: { GOOD: "#0a1a0f", OVERLIT: "#1a0f00", DIM: "#1a0808" }[luxStatus],
                    color: luxCol,
                  }}>{luxStatus}</div>
                )}
                <div style={{ fontSize: 10, color: "#444", marginTop: 6 }}>Target: {tgtLux} lux</div>
              </div>

              {/* FIXTURE INSPECTOR — shows selected fixture stats; batch-updates all selected */}
              <Sect title={selectedLights.length > 0 && selectedLights[0].category !== "LED_STRIP" ? `FIXTURE${selectedLights.length > 1 ? ` (${selectedLights.length})` : ''}` : "FIXTURE"}>
                {selectedLights.length > 0 && selectedLights[0].category !== "LED_STRIP" ? (() => {
                  const hl  = selectedLights[0]
                  const sel = selectedLights          // full selection for batch ops
                  const multi = sel.length > 1

                  // Batch updater — applies to all selected fixtures
                  const batchUpdate = (updates) => sel.forEach(l => updateLight(l.id, updates))

                  // Mixed-value helpers
                  const sizes   = sel.map(l => l.fixtureSize  ?? 8)
                  const colors  = sel.map(l => l.fixtureColor ?? '#ffffff')
                  const shapes  = sel.map(l => l.fixtureShape ?? 'circle')
                  const allSameSize  = sizes.every(v => v === sizes[0])
                  const allSameColor = colors.every(v => v === colors[0])
                  const allSameShape = shapes.every(v => v === shapes[0])

                  const hx = hl.x ?? 0, hy = hl.y ?? 0
                  const inspUnit  = getStoredUnit()
                  const xDisp     = fromMM((hx - hRoomX) / hPxPerMm, inspUnit)
                  const yDisp     = fromMM((hy - hRoomY) / hPxPerMm, inspUnit)
                  const nearWallPx = Math.min(
                    hx - hRoomX, hRoomX + hRoomPxW - hx,
                    hy - hRoomY, hRoomY + hRoomPxH - hy,
                  )
                  const wallDisp  = fromMM(Math.max(0, nearWallPx) / hPxPerMm, inspUnit)
                  let nearFixDist = Infinity
                  for (const l of lights) {
                    if (l.id === hl.id || l.category === "LED_STRIP") continue
                    const d = Math.sqrt(((l.x ?? 0) - hx) ** 2 + ((l.y ?? 0) - hy) ** 2)
                    if (d < nearFixDist) nearFixDist = d
                  }
                  const nearFixDisp = nearFixDist < Infinity ? fromMM(nearFixDist / hPxPerMm, inspUnit) : null
                  return (
                    <>
                      {/* Multi-select banner */}
                      {multi && (
                        <div style={{ fontSize: 9, color: "#d4a843", background: "#1a1500", border: "1px solid #3a2e00", borderRadius: 3, padding: "5px 8px", marginBottom: 8, letterSpacing: "0.08em" }}>
                          ✓ {sel.length} fixtures — edits apply to all
                        </div>
                      )}

                      {/* Name / label (first selected) */}
                      <div style={{ fontSize: 10, color: "#39c5cf", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {multi ? `${hl.label ?? "Fixture"} +${sel.length - 1} more` : (hl.label ?? hl.name ?? "Fixture")}
                      </div>

                      {/* Protocol selector — branded fixtures only */}
                      {hl.brand && (
                        <div style={{ marginBottom: 8 }}>
                          <div style={{ fontSize: 9, color: '#555', letterSpacing: '0.06em', marginBottom: 4 }}>PROTOCOL</div>
                          <select
                            value={hl.protocol ?? 'PHASE-CUT'}
                            onChange={e => batchUpdate({ protocol: e.target.value })}
                            style={{ width: '100%', padding: '4px 6px', background: '#111', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: 3, fontSize: 10, fontFamily: 'IBM Plex Mono', cursor: 'pointer' }}
                          >
                            <option value="NON-DIM">NON-DIM</option>
                            <option value="PHASE-CUT">TRIAC</option>
                            <option value="DALI">DALI</option>
                          </select>
                        </div>
                      )}

                      {/* Position (first selected only) */}
                      {!multi && <>
                        <Row label={`X (${inspUnit})`} value={xDisp !== '' ? String(xDisp) : '—'} />
                        <Row label={`Y (${inspUnit})`} value={yDisp !== '' ? String(yDisp) : '—'} />
                        <Row label="→ wall"     value={wallDisp !== '' ? `${wallDisp}${inspUnit}` : '—'} />
                        {nearFixDisp !== null && (
                          <Row label="↔ nearest" value={`${nearFixDisp}${inspUnit}`} color="#d4a843" />
                        )}
                      </>}
                      {multi && (
                        <Row label="Watt"  value={sel.map(l => l.watt ?? 0).every((v,_,a) => v === a[0]) ? `${sel[0].watt ?? 0}W` : "Mixed"} />
                      )}

                      {/* Delete — batch when multi */}
                      <button
                        onClick={async () => {
                          const msg = multi ? `Delete ${sel.length} fixtures?` : `Delete fixture?`
                          const ok  = await confirm(msg, { confirmLabel: "DELETE", danger: true })
                          if (!ok) return
                          sel.forEach(l => deleteLight(l.id))
                          setSelectedLights([])
                        }}
                        style={{ marginTop: 8, padding: '4px 8px', background: '#8b0000', color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer', fontSize: 10, fontFamily: 'IBM Plex Mono', width: '100%' }}
                      >
                        {multi ? `DELETE ALL ${sel.length}` : "DELETE"}
                      </button>

                      {/* Visual options — all controls batch-update */}
                      <div style={{ marginTop: 12, paddingTop: 8, borderTop: '1px solid #2a2a2a' }}>
                        <div style={{ fontSize: 9, color: '#888', marginBottom: 6 }}>VISUAL OPTIONS{multi ? ` · all ${sel.length}` : ''}</div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: 10, color: '#d4a843', display: 'block', marginBottom: 4 }}>
                            Size: {allSameSize ? sizes[0] : "Mixed"}
                          </label>
                          <input
                            type="range" min="5" max="20"
                            value={allSameSize ? sizes[0] : 8}
                            onChange={(e) => batchUpdate({ fixtureSize: Number(e.target.value) })}
                            style={{ width: '100%', cursor: 'pointer' }}
                          />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label style={{ fontSize: 10, color: '#d4a843', display: 'block', marginBottom: 4 }}>
                            Color{!allSameColor ? " (mixed)" : ""}
                          </label>
                          <input
                            type="color"
                            value={allSameColor ? colors[0] : '#ffffff'}
                            onChange={(e) => batchUpdate({ fixtureColor: e.target.value })}
                            style={{ width: '100%', height: 28, cursor: 'pointer', border: 'none', borderRadius: 3 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: 10, color: '#d4a843', display: 'block', marginBottom: 4 }}>
                            Shape{!allSameShape ? " (mixed)" : ""}
                          </label>
                          <select
                            value={allSameShape ? shapes[0] : ''}
                            onChange={(e) => batchUpdate({ fixtureShape: e.target.value })}
                            style={{ width: '100%', padding: '4px 6px', background: '#111111', color: '#e0e0e0', border: '1px solid #2a2a2a', borderRadius: 3, fontSize: 10, fontFamily: 'IBM Plex Mono', cursor: 'pointer' }}
                          >
                            {!allSameShape && <option value="">— Mixed —</option>}
                            <option value="circle">Circle</option>
                            <option value="square">Square</option>
                            <option value="diamond">Diamond</option>
                            <option value="triangle">Triangle</option>
                            <option value="hexagon">Hexagon</option>
                            <option value="star">Star</option>
                            <option value="rectangle">Rectangle</option>
                            <option value="cross">Cross</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )
                })() : (
                  <>
                    <div style={{ fontSize: 11, color: "#ffffff", marginBottom: 6, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {activeFixture.label ?? activeFixture.name ?? "—"}
                    </div>
                    <Row label="Watt"   value={`${activeFixture.watt ?? 0}W`} />
                    <Row label="Lumens" value={`${activeFixture.lumens ?? 0}lm`} />
                    <Row label="Beam"   value={`${activeFixture.beamAngle ?? 0}°`} />
                    {activeFixture.cct && <Row label="CCT" value={`${activeFixture.cct}K`} />}
                  </>
                )}
              </Sect>

              {/* ROOM METRICS + elevation diagram */}
              <Sect title="ROOM">
                <Row label="Area"  value={`${areaM2.toFixed(1)}m²`} />
                <Row label="MH"    value={`${mh.toFixed(2)}m`} />
                <Row label="RCR"   value={rcr.toFixed(2)} />
                <Row label="UF"    value={uf.toFixed(2)} />
                <Row label="MF"    value={MAINT_FACTOR} />
                {(() => {
                  const ceilH  = Number(room.ceilingHeight)
                  const falseC = Number(room.falseCeiling)
                  const workP  = Number(room.workingPlane)
                  if (!(ceilH > 0)) return null
                  const svgW = 154, interior = 60
                  const yTop = 6, yBot = yTop + interior
                  const s      = interior / ceilH
                  const yFix   = yTop + falseC * s
                  const yWork  = yTop + (ceilH - workP) * s
                  const mhPx   = Math.max(2, yWork - yFix)
                  const coneW  = Math.min(mhPx * 0.6, 38)
                  return (
                    <svg width={svgW} height={yBot + 14} style={{ display: "block", marginTop: 10, overflow: "visible" }}>
                      {/* Ceiling slab */}
                      <rect x={0} y={0} width={svgW} height={yTop} fill="#0a0a0a" />
                      <line x1={0} y1={yTop} x2={svgW} y2={yTop} stroke="#222222" strokeWidth={2} />
                      {/* False ceiling drop */}
                      {falseC > 0 && <line x1={0} y1={yFix} x2={svgW} y2={yFix} stroke="#222222" strokeWidth={1} strokeDasharray="4 3" />}
                      {/* Working plane */}
                      <line x1={0} y1={yWork} x2={svgW} y2={yWork} stroke="#1e3020" strokeWidth={1} strokeDasharray="4 3" />
                      {/* Floor slab */}
                      <rect x={0} y={yBot} width={svgW} height={14} fill="#0a0a0a" />
                      <line x1={0} y1={yBot} x2={svgW} y2={yBot} stroke="#0a0a0a" strokeWidth={2} />
                      {/* Light cone */}
                      <polygon points={`${svgW/2},${yFix} ${svgW/2-coneW},${yWork} ${svgW/2+coneW},${yWork}`} fill="#d4a84320" />
                      {/* Fixture dot */}
                      <circle cx={svgW/2} cy={yFix} r={3.5} fill="#d4a843" />
                      {/* MH annotation */}
                      <line x1={svgW-16} y1={yFix}  x2={svgW-16} y2={yWork} stroke="#333" strokeWidth={1} />
                      <line x1={svgW-19} y1={yFix}  x2={svgW-13} y2={yFix}  stroke="#333" strokeWidth={1} />
                      <line x1={svgW-19} y1={yWork}  x2={svgW-13} y2={yWork}  stroke="#333" strokeWidth={1} />
                      {/* Labels */}
                      <text x={3} y={yTop-1}              fontSize="7" fontFamily="IBM Plex Mono" fill="#333">{ceilH.toFixed(1)}m</text>
                      <text x={3} y={yWork+9}              fontSize="7" fontFamily="IBM Plex Mono" fill="#1e4030">WP</text>
                      <text x={svgW-12} y={(yFix+yWork)/2+3} fontSize="7" fontFamily="IBM Plex Mono" fill="#444" textAnchor="end">MH</text>
                    </svg>
                  )
                })()}
              </Sect>

              {/* ELECTRICAL */}
              <Sect title="ELECTRICAL">
                <Row label="Circuits" value={circuits.length} />
                <Row label="Load"     value={`${totalWatt}W`} />
                {voltageDropResults.length > 0 && (() => {
                  const mv = Math.max(...voltageDropResults.map(r => r.vDropPercent))
                  return <Row label="Max V-drop" value={`${mv.toFixed(1)}%`} color={mv <= 3 ? "#4caf7d" : "#e07b2a"} />
                })()}
                {daliActive && <Row label="DALI buses" value={totalBuses} color="#d4a843" />}
                {daliActive && <Row label="Cable" value={`${totalCableM.toFixed(0)}m`} />}
              </Sect>

            </div>
          )
        })()}

      </main>

      {/* ── Settings slide-in panel ──────────────────────────────────────────── */}
      {showSettings && (
        <div style={{
          position: "fixed", top: 84, right: 0, bottom: 0, width: 320,
          background: "#0a0a0a", borderLeft: "1px solid #222222",
          display: "flex", flexDirection: "column",
          zIndex: 500, boxShadow: "-8px 0 32px rgba(0,0,0,0.6)",
          fontFamily: "IBM Plex Mono",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #222222", flexShrink: 0 }}>
            <span style={{ fontSize: 10, color: "#d4a843", letterSpacing: "0.12em", fontWeight: 600 }}>ROOM SETTINGS</span>
            <button onClick={() => setShowSettings(false)} style={{ background: "transparent", border: "none", color: "#888888", cursor: "pointer", fontSize: 14, padding: 0 }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            <RoomSettingsFloating
              room={room}
              setRoom={updateRoom}
              calculations={(() => {
                const g = calcGrid(Number(room.targetLux), areaM2, uf, Number(room.fixtureLumens), roomWidth, roomHeight)
                return { mountingHeight: mh, requiredLumens: g.requiredLumens, suggestedFixtures: g.total }
              })()}
              pos={settingsPos}
              onStartDrag={startSettingsDrag}
              onClose={() => setShowSettings(false)}
              floorPlan={floorPlan}
              onUploadFloorPlan={updateFloorPlan}
              onRemoveFloorPlan={removeFloorPlan}
              canUploadFloorPlan={isProActive()}
              onUploadFloorPlanBlocked={() => setGateModal({ feature: 'Floor plan upload' })}
              activeTool={activeTool}
              onSetActiveTool={setActiveTool}
              embedded
            />
          </div>
        </div>
      )}

      {/* ── Export modal ─────────────────────────────────────────────────────── */}
      {showExportModal && (() => {
        const allExportRooms = floors.flatMap(f => f.rooms.map(r => ({ id: r.id, label: `${f.name} — ${r.name}` })))
        const allSelected    = allExportRooms.every(r => exportRoomIds.includes(r.id))
        const toggleRoom     = id => setExportRoomIds(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
        const btnStyle = (color, bg, border) => ({
          display: "flex", flexDirection: "column", alignItems: "flex-start",
          padding: "13px 16px", background: bg, border: `1px solid ${border}`,
          borderRadius: 4, cursor: "pointer", fontFamily: "IBM Plex Mono", textAlign: "left",
          transition: "border-color 0.12s",
        })
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#0a0a0a", border: "1px solid #2e2e2e", borderRadius: 6, width: 480, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 60px rgba(0,0,0,0.6)" }}>

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px 14px", borderBottom: "1px solid #222", flexShrink: 0 }}>
                <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: "#39c5cf", letterSpacing: "0.14em" }}>EXPORT</span>
                <button onClick={() => setShowExportModal(false)} style={{ background: "transparent", border: "none", color: "#555555", fontFamily: "IBM Plex Mono", fontSize: 13, cursor: "pointer" }}>✕</button>
              </div>

              {/* Scrollable body */}
              <div style={{ overflowY: "auto", flex: 1, padding: "18px 22px" }}>

                {/* Room selector */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontFamily: "IBM Plex Mono", fontSize: 10, color: "#888888", letterSpacing: "0.12em" }}>SELECT ROOMS TO EXPORT</span>
                    <button
                      onClick={() => setExportRoomIds(allSelected ? [] : allExportRooms.map(r => r.id))}
                      style={{ background: "transparent", border: "none", fontFamily: "IBM Plex Mono", fontSize: 9, color: "#39c5cf", cursor: "pointer", letterSpacing: "0.06em", padding: 0 }}
                    >
                      {allSelected ? "Deselect All" : "Select All"}
                    </button>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {allExportRooms.map(r => {
                      const checked = exportRoomIds.includes(r.id)
                      return (
                        <label
                          key={r.id}
                          style={{
                            display: "flex", alignItems: "center", gap: 10,
                            padding: "8px 12px", background: "#152030",
                            border: `1px solid ${checked ? "#2e2200" : "#252525"}`,
                            borderRadius: 3, cursor: "pointer",
                            fontFamily: "IBM Plex Mono", fontSize: 10,
                            color: checked ? "#f0f0f0" : "#666",
                            transition: "border-color 0.1s, color 0.1s",
                          }}
                        >
                          {/* Custom checkbox */}
                          <div style={{
                            width: 14, height: 14, border: `1px solid ${checked ? "#d4a843" : "#444"}`,
                            borderRadius: 2, background: checked ? "#d4a843" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, transition: "background 0.1s, border-color 0.1s",
                          }}>
                            {checked && <span style={{ fontSize: 9, color: "#000000", fontWeight: 700, lineHeight: 1 }}>✓</span>}
                          </div>
                          <input type="checkbox" checked={checked} onChange={() => toggleRoom(r.id)} style={{ display: "none" }} />
                          <span>{r.label}</span>
                        </label>
                      )
                    })}
                  </div>
                  {exportRoomIds.length === 0 && (
                    <div style={{ fontFamily: "IBM Plex Mono", fontSize: 9, color: "#e05252", marginTop: 6 }}>
                      Select at least one room to include per-room pages
                    </div>
                  )}
                </div>

                {/* Export buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button style={btnStyle("#d4a843", "#1a1400", "#2e2200")} onClick={() => { setShowExportModal(false); handleExportPDF() }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#d4a843", letterSpacing: "0.08em" }}>Export PDF Report</span>
                    <span style={{ fontSize: 9, color: "#888888", marginTop: 3 }}>
                      Summary + {exportRoomIds.length} room detail page{exportRoomIds.length !== 1 ? "s" : ""} + layout snapshot
                    </span>
                  </button>
                  <button style={btnStyle("#3dba74", "#0e1a0e", "#1a4020")} onClick={() => { setShowExportModal(false); handleExportBOQ() }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#3dba74", letterSpacing: "0.08em" }}>Export Excel BOQ</span>
                    <span style={{ fontSize: 9, color: "#888888", marginTop: 3 }}>3 sheets — Fixture BOQ, Electrical, Room Summary</span>
                  </button>
                  <button style={btnStyle("#39c5cf", "#0a1a1e", "#1a3a40")} onClick={() => { setShowExportModal(false); handleExportPNG() }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#39c5cf", letterSpacing: "0.08em" }}>Export Canvas PNG</span>
                    <span style={{ fontSize: 9, color: "#888888", marginTop: 3 }}>High-resolution layout snapshot at 2× pixel ratio</span>
                  </button>
                  <button style={btnStyle("#888", "#181818", "#222222")} onClick={() => { setShowExportModal(false); setShowReport(true) }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em" }}>View Full Report</span>
                    <span style={{ fontSize: 9, color: "#666", marginTop: 3 }}>Interactive report with print option</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        )
      })()}

      {/* ── Report modal ─────────────────────────────────────────────────────── */}
      {showReport && (
        <ReportPanel
          floors={floors}
          projectName={projectName}
          onClose={() => setShowReport(false)}
          daliEnabled={daliActive}
          daliAddresses={daliAddresses}
          busCableLengths={busCableLengths}
          busTopologies={busTopologies}
        />
      )}



      {/* ── Load Project modal ───────────────────────────────────────────────── */}
      {showLoadModal && (
        <LoadProjectModal
          userId={user.uid}
          onLoad={handleLoadFromModal}
          onClose={() => setShowLoadModal(false)}
        />
      )}

      {/* ── Upgrade gate modal ──────────────────────────────────────────────── */}
      {gateModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setGateModal(null)}
        >
          <div
            style={{ background: '#0a0a0a', border: '1px solid #222222', borderRadius: 6, padding: '28px 30px', width: 380, fontFamily: 'IBM Plex Mono' }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 10, color: '#d4a843', letterSpacing: '0.14em', marginBottom: 14 }}>UPGRADE REQUIRED</div>
            <div style={{ fontSize: 14, color: '#ffffff', fontWeight: 600, marginBottom: 8 }}>{gateModal.feature}</div>
            {gateModal.professionalOnly ? (
              <div style={{ fontSize: 10, color: '#666666', lineHeight: 1.6, marginBottom: 24 }}>
                Chandeliers, Pendants, Track Lights, Cove Lights, Bollards, Flood Lights, and Surface Panels are exclusive to the Professional plan.
              </div>
            ) : (
              <div style={{ fontSize: 10, color: '#666666', lineHeight: 1.6, marginBottom: 24 }}>
                Your free trial has expired. Upgrade to PRO to unlock {gateModal.feature}, exports, DALI, floor plan upload, AI recommendations, and more.
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setGateModal(null); navigate('/dashboard', { state: { openTab: 'subscription' } }) }}
                style={{ flex: 1, background: '#d4a843', color: '#000000', border: 'none', borderRadius: 3, padding: '9px 0', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em' }}
              >{gateModal.professionalOnly ? 'UPGRADE TO PROFESSIONAL →' : 'UPGRADE TO PRO →'}</button>
              <button
                onClick={() => setGateModal(null)}
                style={{ background: 'transparent', color: '#888888', border: '1px solid #333333', borderRadius: 3, padding: '9px 16px', fontSize: 11, cursor: 'pointer' }}
              >✕</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ──────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#0a0a0a", border: "1px solid #2e2e2e",
          borderRadius: 6, padding: "10px 20px",
          fontFamily: "IBM Plex Mono", fontSize: 12, color: "#ffffff",
          letterSpacing: "0.04em", zIndex: 600,
          boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
          pointerEvents: "none",
        }}>
          {toast}
        </div>
      )}

      {/* ── Keyboard shortcuts modal ─────────────────────────────────────────── */}
      {showShortcuts && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 900, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setShowShortcuts(false)}
        >
          <div
            style={{ background: "#000000", border: "1px solid #2e2e2e", borderRadius: 10, padding: "24px 28px", width: 520, maxWidth: "calc(100vw - 32px)", fontFamily: "IBM Plex Mono", boxShadow: "0 24px 80px rgba(0,0,0,0.9)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#ffffff", letterSpacing: "0.1em" }}>KEYBOARD SHORTCUTS</span>
              <button onClick={() => setShowShortcuts(false)} style={{ background: "none", border: "none", color: "#555555", fontSize: 16, cursor: "pointer", padding: 0, lineHeight: 1 }}>✕</button>
            </div>
            {[
              { group: "NAVIGATION", rows: [
                ["Ctrl + H",       "Dashboard"],
                ["Space + Drag",   "Pan canvas"],
                ["Ctrl + Scroll",  "Zoom in / out"],
              ]},
              { group: "EDITING", rows: [
                ["Delete",         "Delete selected"],
                ["Ctrl + A",       "Select all"],
                ["Ctrl + D",       "Duplicate selected"],
                ["Ctrl + C / V",   "Copy / Paste"],
                ["Escape",         "Cancel / Deselect"],
              ]},
              { group: "TOOLS", rows: [
                ["D",              "Draw Room (toggle)"],
                ["A",              "Auto Place fixtures"],
                ["Ctrl + I",       "AI Recommend (toggle)"],
              ]},
              { group: "VISUALIZATION", rows: [
                ["B",              "Toggle Beam overlay"],
                ["H",              "Toggle Heatmap overlay"],
                ["G",              "Toggle Snap / Grid"],
              ]},
              { group: "PROJECT", rows: [
                ["Ctrl + S",       "Save project"],
                ["?",              "Show this help"],
              ]},
            ].map(({ group, rows }) => (
              <div key={group} style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 8, color: "#555555", letterSpacing: "0.18em", marginBottom: 8 }}>{group}</div>
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "6px 0" }}>
                  {rows.map(([key, desc]) => (
                    <>
                      <span key={key + "-k"} style={{ fontSize: 10, color: "#d4a843", letterSpacing: "0.04em", background: "#1a1500", border: "1px solid #2a2000", borderRadius: 3, padding: "2px 8px", display: "inline-block", width: "fit-content" }}>{key}</span>
                      <span key={key + "-d"} style={{ fontSize: 10, color: "#888888", letterSpacing: "0.04em", alignSelf: "center", paddingLeft: 12 }}>{desc}</span>
                    </>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #1e1e1e", marginTop: 8, paddingTop: 12, fontSize: 9, color: "#444", letterSpacing: "0.06em" }}>
              Press <span style={{ color: "#d4a843" }}>?</span> or <span style={{ color: "#d4a843" }}>Escape</span> to dismiss
            </div>
          </div>
        </div>
      )}

      {/* ── Welcome modal ────────────────────────────────────────────────────── */}
      {showWelcome && (
        <div className={styles.welcomeOverlay}>
          <div className={styles.welcomeModal}>
            {/* Header */}
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#ffffff", letterSpacing: "0.04em", marginBottom: 6 }}>
                Welcome to Lumina Design
              </div>
              <div style={{ fontSize: 11, color: "#555555", letterSpacing: "0.05em" }}>
                Professional lighting design &amp; calculation tool
              </div>
            </div>

            {/* Step cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
              {[
                { num: "1", title: "Set Room Dimensions", desc: "Open Settings to configure room size, ceiling height, and target lux level." },
                { num: "2", title: "Choose a Fixture",    desc: "Select from the built-in library or add custom fixtures via the Library modal." },
                { num: "3", title: "Place Fixtures",      desc: "Click the canvas to place lights, or use Auto Place for an instant grid layout." },
                { num: "4", title: "Analyze & Export",    desc: "Check Beam and Heatmap overlays, then generate a full Report with electrical data." },
              ].map(({ num, title, desc }) => (
                <div key={num} className={styles.welcomeStepCard}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1a1500", border: "1px solid #d4a843", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: "#d4a843", flexShrink: 0 }}>{num}</div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#ffffff", letterSpacing: "0.02em" }}>{title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#888888", lineHeight: 1.6, letterSpacing: "0.02em", paddingLeft: 32 }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, borderTop: "1px solid #2e2e2e" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#555555", cursor: "pointer", userSelect: "none" }}>
                <input
                  type="checkbox"
                  onChange={e => { if (e.target.checked) { try { localStorage.setItem("lumina_welcome_dismissed", "1") } catch {} } }}
                  style={{ accentColor: "#d4a843", cursor: "pointer" }}
                />
                Don't show again
              </label>
              <button className={styles.welcomeGetStarted} onClick={() => setShowWelcome(false)}>
                Get Started
              </button>
            </div>
          </div>
        </div>
      )}

      <ConnectionStatus />
    </div>
  )
}
