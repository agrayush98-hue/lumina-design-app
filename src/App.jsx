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
import { FixtureLibraryPanel } from "./components/FixtureLibraryPanel"
import Navigation from "./components/Navigation"
import Sidebar from "./components/Sidebar"
import { FIXTURE_LIBRARY, FIXTURE_MAP, CATEGORY_META, CATEGORY_VISUAL } from "./data/fixtureLibrary"
import { saveProject, loadProject, shareProject as fbShareProject, checkAiLimit, incrementAiCall } from "./firebase"
import { fromMM, getStoredUnit } from "./utils/units"
import { SIDEBAR_LEGEND } from "./utils/heatmapColors"
import { getTemplate } from "./templates/projectTemplates"
import { useToast as useToastNotify } from "./components/Toast"
import { useConfirm }                 from "./components/ConfirmModal"
import { useSettings }               from "./contexts/SettingsContext"

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

function computeLuxBreakdown(lights, areaM2, uf = 0.75) {
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
    .map(g => ({ fixture: g.fixture, count: g.count, totalLumens: g.totalLumens,
      lux: (g.totalLumens * uf * MAINT_FACTOR) / areaM2 }))
    .sort((a, b) => b.lux - a.lux)
}

function calcRCR(widthMm, heightMm, mh) {
  const W = widthMm / 1000, L = heightMm / 1000
  if (!W || !L || mh <= 0) return 0
  return (5 * mh * (W + L)) / (W * L)
}

// Reflectance-aware UF — matches _calcRoomExport formula
// cR/wR/fR are decimal fractions (e.g. 0.7 for 70%)
function calcUF(rcr, cR = 0.7, wR = 0.5, fR = 0.2) {
  const avgRef = (cR + wR + fR) / 3
  const ufRaw  = avgRef >= 0.6 ? 1 - rcr * 0.04
               : avgRef >= 0.4 ? 1 - rcr * 0.055
               :                 1 - rcr * 0.07
  return Math.min(0.95, Math.max(0.4, ufRaw))
}

function makeLight(id, x, y, fixture, lumensOverride) {
  // Prefer per-fixture visual props; fall back to category defaults
  const vis = fixture?.category ? (CATEGORY_VISUAL[fixture.category] ?? {}) : {}
  return {
    id, x, y,
    fixtureId:    fixture?.id,
    category:     fixture?.category ?? null,
    name:         fixture?.name ?? fixture?.label ?? "Fixture",
    brand:        fixture?.brand ?? null,
    label:        fixture?.label ?? fixture?.name ?? "Fixture",
    watt:         fixture?.watt ?? 0,
    lumens:       lumensOverride ?? fixture?.lumens ?? 0,
    beamAngle:    fixture?.beamAngle ?? 36,
    cri:          fixture?.cri ?? 80,
    efficacy:     fixture?.efficacy ?? null,
    mounting:     fixture?.mounting ?? null,
    // Visual — fixture-level props take priority over category defaults
    fill:         fixture?.fill         ?? vis.fill         ?? "#ffe9b0",
    stroke:       fixture?.stroke       ?? vis.stroke       ?? "#ffb300",
    glowColor:    fixture?.glowColor    ?? vis.glowColor    ?? "rgba(255,179,0,0.08)",
    visualRadius: fixture?.visualRadius ?? vis.visualRadius ?? 6,
    fixtureShape: fixture?.fixtureShape ?? vis.fixtureShape ?? 'circle',
    fixtureColor: fixture?.fixtureColor ?? fixture?.fill   ?? vis.fill ?? "#ffe9b0",
    // Protocol
    protocol:     fixture?.protocol ?? null,
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
  const { settings } = useSettings()

  const [user,        setUser]        = useState(undefined)  // undefined = loading
  const [authLoading, setAuthLoading] = useState(true)
  const [gateModal,   setGateModal]   = useState(null)  // null | { feature: string }

  function isProActive() {
    const sub = userDoc?.subscription
    // Paid and active
    if (sub?.status === 'active' && (sub.plan === 'pro' || sub.plan === 'professional')) return true
    // Trial within 14-day window OR cancelled but still within access window
    const { status } = getTrialStatus()
    return status === 'trial' || status === 'cancelled'
  }

  function isProfessional() {
    const sub = userDoc?.subscription
    if (sub?.status === 'active' && sub?.plan === 'professional') return true
    // Cancelled professional who still has access
    if (sub?.status === 'cancelled' && sub?.plan === 'professional') {
      const { status } = getTrialStatus()
      return status === 'cancelled'
    }
    return false
  }

  function isPaidPlan() {
    const sub = userDoc?.subscription
    return sub?.status === 'active' && (sub?.plan === 'pro' || sub?.plan === 'professional')
  }

  function getRoomLimit() {
    const sub = userDoc?.subscription
    if (sub?.status === 'active' && sub?.plan === 'professional') return Infinity
    if (sub?.status === 'active' && sub?.plan === 'pro') return 5
    if (sub?.status === 'trial') return 5   // trial matches Pro limits
    // Cancelled but still within renewsAt window — keep plan's room limit
    if (sub?.status === 'cancelled') {
      const { status } = getTrialStatus()
      if (status === 'cancelled') {
        if (sub.plan === 'professional') return Infinity
        if (sub.plan === 'pro') return 5
      }
    }
    return 2                                 // free plan: 2 rooms per project
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
    // Prevent search engines from indexing auth-gated /app route
    let meta = document.querySelector("meta[name='robots']")
    if (!meta) {
      meta = document.createElement('meta')
      meta.name = 'robots'
      document.head.appendChild(meta)
    }
    meta.content = 'noindex, nofollow'
    return () => { meta.content = 'index, follow' }
  }, [])

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
  const [exportMeta,         setExportMeta]         = useState({ customerName: "", address: "", description: "", preparedBy: "", company: "" })
  const [exportCanvasOptions, setExportCanvasOptions] = useState({ placement: true, beam: false, heatmap: false })
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
  const [navTab,             setNavTab]             = useState('canvas')
  const [sidebarView,        setSidebarView]        = useState('luminaires')
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
  // Auto-adjust ceiling height based on fixture category
  const dominantCategory = lights.length > 0 ? lights[0].category : null
  const autoCeiling =
    dominantCategory === 'High_Bay'     ? 8.0 :
    dominantCategory === 'Street_Light' ? 10.0 :
    dominantCategory === 'Flood_Light'  ? 6.0 :
    dominantCategory === 'Outdoor'      ? 6.0 :
    Number(room.ceilingHeight) || 2.8
  const mh          = autoCeiling - Number(room.falseCeiling || 0) - Number(room.workingPlane || 0.8)
  const rcr         = calcRCR(roomWidth, roomHeight, mh)
  // Pass room reflectances to UF; stored as decimal fraction (0–1)
  const uf          = calcUF(
    rcr,
    Number(room.ceilingReflectance ?? 0.7),
    Number(room.wallReflectance    ?? 0.5),
    Number(room.floorReflectance   ?? 0.2)
  )
  const totalLumens = lights.reduce((s, l) => s + (l.lumens ?? 0), 0)
  const totalWatt   = lights.reduce((s, l) => s + (l.watt   ?? 0), 0)
  // Lumen method: E = (Φ × UF × MF) / A
  const totalLux    = areaM2 === 0 ? 0 : (totalLumens * uf * MAINT_FACTOR) / areaM2
  const luxBreakdown = computeLuxBreakdown(lights, areaM2, uf)

  // ── Global / project summary ──────────────────────────────────────────────

  const allRooms             = floors.flatMap(f => f.rooms)
  const projectTotalFixtures = allRooms.reduce((s, r) => s + r.lights.length, 0)
  const projectTotalWatt     = allRooms.reduce((s, r) => s + r.lights.reduce((a, l) => a + (l.watt ?? 0), 0), 0)
  const roomsWithLights      = allRooms.filter(r => r.lights.length > 0)
  const projectAvgLux = roomsWithLights.length === 0 ? 0 : Math.round(
    roomsWithLights.reduce((s, r) => {
      const a = (Number(r.room.roomWidth) / 1000) * (Number(r.room.roomHeight) / 1000)
      if (a <= 0) return s
      const rMh  = Number(r.room.ceilingHeight || 2.8) - Number(r.room.falseCeiling || 0) - Number(r.room.workingPlane || 0.8)
      const rRcr = calcRCR(Number(r.room.roomWidth), Number(r.room.roomHeight), rMh)
      const rUf  = calcUF(rRcr, Number(r.room.ceilingReflectance ?? 0.7), Number(r.room.wallReflectance ?? 0.5), Number(r.room.floorReflectance ?? 0.2))
      const rLux = (r.lights.reduce((x, l) => x + (l.lumens ?? 0), 0) * rUf * MAINT_FACTOR) / a
      return s + rLux
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
    const normCat = (c) => (c ?? "").toUpperCase().replace(/[\s-]/g, "_")
    const isPerMetre = (c) => ["LED_STRIP","LED_STRIP_LIGHT","COVE_LIGHT","COVE","LINEAR"].includes(normCat(c))
    if (isPerMetre(activeFixtureCategory)) {
      const cat = activeFixtureCategory
      const vis = CATEGORY_VISUAL[normCat(cat)] ?? CATEGORY_VISUAL.LED_STRIP ?? {}
      const len = lightData.lengthM ?? 1
      // Support both wattPerMtr (old FixturePanel) and wattPerMeter (FixtureLibraryPanel)
      const wPM = activeFixture.wattPerMtr ?? activeFixture.wattPerMeter ?? (activeFixture.watt / Math.max(1, activeFixture.length ?? 1))
      const lPM = activeFixture.lumensPerMtr ?? activeFixture.lumensPerMeter ?? (activeFixture.lumens / Math.max(1, activeFixture.length ?? 1))
      patchActiveRoom(r => ({
        lights: [...r.lights, {
          ...lightData,
          fixtureId: activeFixture.id,
          category:  cat,
          fill:      vis.fill,
          stroke:    vis.stroke,
          watt:      Math.round(wPM * len * 10) / 10,
          lumens:    Math.round(lPM * len),
        }],
      }))
    } else {
      patchActiveRoom(r => {
        const newLight = makeLight(lightData.id, lightData.x, lightData.y, activeFixture, activeFixture?.lumens ?? Number(room.fixtureLumens))
        const light = daliEnabled ? { ...newLight, protocol: 'DALI' } : newLight
        return { lights: [...r.lights, light] }
      })
    }
  }

  function moveLight(id, x, y) {
    patchActiveRoom(r => ({
      lights: r.lights.map(l => {
        if (l.id !== id) return l
        const _norm = (c) => (c ?? "").toUpperCase().replace(/[\s-]/g, "_")
        const _isStrip = (c) => ["LED_STRIP","LED_STRIP_LIGHT","COVE_LIGHT","COVE","LINEAR"].includes(_norm(c))
        if (_isStrip(l.category)) {
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

  async function updateRoom(newRoom) {
    const nW = Number(newRoom.roomWidth), nH = Number(newRoom.roomHeight)
    const oW = Number(room.roomWidth),    oH = Number(room.roomHeight)
    if (newRoom.roomProtocol === "DALI" && !daliEnabled) setDaliEnabled(true)

    const sizeChanged = nW !== oW || nH !== oH
    if (sizeChanged) {
      const activeRoomData = floors.find(f => f.id === activeFloorId)?.rooms?.find(r => r.id === activeRoomId)
      const hasLights = (activeRoomData?.lights?.length ?? 0) > 0
      if (hasLights) {
        const ok = await confirm(
          `Changing room dimensions will clear all ${activeRoomData.lights.length} placed fixture${activeRoomData.lights.length !== 1 ? 's' : ''}. Continue?`,
          { title: 'CLEAR FIXTURES?', confirmLabel: 'CLEAR & RESIZE', danger: true }
        )
        if (!ok) return // user cancelled — keep old dimensions
      }
    }

    patchActiveRoom(r => ({
      room:   newRoom,
      lights: sizeChanged ? [] : r.lights,
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

    // ── Lux-aware trim: remove outermost fixtures if over-lit ─────────────────
    const targetLuxVal = Number(room.targetLux) || 300
    const calcLuxForSet = (set) => {
      if (areaM2 === 0 || set.length === 0) return 0
      const lumens = set.reduce((s, l) => s + (l.lumens ?? 0), 0)
      return (lumens * uf * MAINT_FACTOR) / areaM2
    }

    // Keep at least 1 fixture; remove furthest-from-centre first
    const centerX = ROOM_X + ROOM_PX_W / 2
    const centerY = ROOM_Y + ROOM_PX_H / 2
    let trimmed = [...generated]
    while (trimmed.length > 1 && calcLuxForSet(trimmed) > targetLuxVal * 1.2) {
      let maxDist = -1, maxIdx = -1
      trimmed.forEach((f, i) => {
        const d = Math.hypot(f.x - centerX, f.y - centerY)
        if (d > maxDist) { maxDist = d; maxIdx = i }
      })
      trimmed.splice(maxIdx, 1)
    }

    const finalLux = Math.round(calcLuxForSet(trimmed))
    const removedCount = generated.length - trimmed.length
    const trimNote = removedCount > 0 ? ` (${removedCount} removed — over-lit)` : ""
    patchActiveRoom(() => ({ lights: trimmed }))
    showToast(`${trimmed.length} fixtures placed — ${finalLux} lux achieved${trimNote}`)
  }

  // ── Toast helper ──────────────────────────────────────────────────────────

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  // ── Firebase: Save / Load / Share ─────────────────────────────────────────

  // Auto-save ref pattern: always points to latest handleSave closure
  const handleSaveRef = useRef(null)

  async function handleSave() {
    setSaving(true)
    try {
      const allRoomsForSave = floors.flatMap(f => f.rooms)
      const id = await saveProject(projectId, {
        floors,
        name:        projectName,
        floorCount:  floors.length,
        roomCount:   allRoomsForSave.length,
        lightCount:  allRoomsForSave.reduce((s, r) => s + (r.lights?.length ?? 0), 0),
        totalWatts:  allRoomsForSave.reduce((s, r) => s + r.lights.reduce((w, l) => w + (l.watt ?? 0), 0), 0),
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

  // Keep ref in sync so auto-save always has latest closure
  useEffect(() => { handleSaveRef.current = handleSave })

  // Auto-save every 2 minutes for projects that have been saved at least once
  useEffect(() => {
    if (!projectId || !user) return
    const timer = setInterval(() => {
      if (!saving) handleSaveRef.current?.()
    }, 120_000)
    return () => clearInterval(timer)
  }, [projectId, user]) // eslint-disable-line react-hooks/exhaustive-deps

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
          // Ownership check — Firestore rules enforce this server-side too,
          // but double-check client-side to prevent loading another user's project
          if (data.userId && user?.uid && data.userId !== user.uid) {
            showToast("Access denied: this project belongs to another account.")
            return
          }
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
      const url = `${window.location.origin}/share/${projectId}`
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

    // ── Bug fix 3: LED_STRIP / COVE_LIGHT auto-expand quantity ───────────────
    // AI says "quantity: 1" meaning "one continuous strip around the room" but
    // we place individual points — expand to cover the perimeter properly.
    const isStripType = fixture.category === "LED_STRIP" || fixture.category === "COVE_LIGHT"
    let n = Math.max(1, quantity)
    let effectivePlacement = fixture.placement ?? "grid"
    if (isStripType) {
      effectivePlacement = "perimeter"  // always perimeter for strips
      const perimMm   = 2 * (RPX_W + RPX_H) / Math.max(pxPerMm, 0.001)
      const autoCount = Math.round(perimMm / 700)  // 1 point per ~700mm of perimeter
      n = Math.min(Math.max(n, autoCount, 8), 48)  // at least 8 points, cap at 48
    }

    let   id  = startId ?? Date.now()
    const out = []

    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
    const minX = RX + wallOff, maxX = RX + RPX_W - wallOff
    const minY = RY + wallOff, maxY = RY + RPX_H - wallOff

    // ── Bug fix 1 & 2: two separate thresholds ────────────────────────────────
    // existingLights (user lights + other AI zones): 50mm exact-overlap only.
    //   Previously used 500mm which silently dropped fixtures whenever a user
    //   light was anywhere near a calculated grid position, and caused Apply All
    //   to block later zones from placing near earlier zones.
    // out (same batch, same zone): 200mm to prevent actual visual stacking
    //   of fixtures within the same placement call.
    const exactPx2 = Math.max(1, (50  * pxPerMm) ** 2)
    const batchPx2 = Math.max(1, (200 * pxPerMm) ** 2)

    function tooClose(x, y) {
      for (const l of existingLights) {
        const dx = (l.x ?? 0) - x, dy = (l.y ?? 0) - y
        if (dx * dx + dy * dy < exactPx2) return true
      }
      for (const l of out) {
        const dx = (l.x ?? 0) - x, dy = (l.y ?? 0) - y
        if (dx * dx + dy * dy < batchPx2) return true
      }
      return false
    }

    function tryPush(x, y) {
      if (tooClose(x, y)) return false
      out.push(makeLight(id++, x, y, fixture, fixture.lumens))
      return true
    }

    const isPerimeter = fixture.category === "WALL_WASHER"
      || fixture.category === "LED_STRIP"
      || fixture.category === "COVE_LIGHT"
      || effectivePlacement === "perimeter"
      || effectivePlacement === "corners"

    const isSideWalls = effectivePlacement === "side-walls"
    const isCorners   = effectivePlacement === "corners"

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
      // Each zone is placed independently against only the user's pre-existing lights.
      // We deliberately do NOT pass allLights from previous zones here — different
      // fixture types (downlights, strips, spots) are at different ceiling heights in
      // 3D and don't collide. Passing allLights caused zone 2+ to share the same
      // computed grid positions as zone 1 (d=0), triggering the overlap check and
      // silently dropping most fixtures from later zones.
      allLights.push(...placeFixtureGroup(fixture, quantity, id, existing))
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

  async function handleExportPDF(exportMeta = {}, exportCanvasOptions = { placement: true, beam: false, heatmap: false }) {
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

    // ── PAGE 1: Cover ──────────────────────────────────────────
    // Full black background
    doc.setFillColor(10, 10, 10)
    doc.rect(0, 0, PW, PH, "F")

    // LUMINA DESIGN branding top right
    doc.setFont("helvetica", "bold"); doc.setFontSize(9)
    doc.setTextColor(212, 175, 55)
    doc.text("LUMINA DESIGN", PW - M, 16, { align: "right" })
    doc.setFont("helvetica", "normal"); doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    doc.text("PROFESSIONAL LIGHTING DESIGN SUITE", PW - M, 22, { align: "right" })

    // Gold top accent bar
    doc.setFillColor(212, 175, 55)
    doc.rect(0, 0, PW, 3, "F")

    // Left gold vertical stripe
    doc.setFillColor(212, 175, 55)
    doc.rect(0, 0, 6, PH, "F")

    // ── Cover page layout — vertically centred between branding and footer ──
    // Usable band: branding ends ~28mm, footer line at PH-12=285mm → 257mm tall
    const BRAND_BOTTOM = 28
    const FOOTER_TOP   = PH - 12
    const USABLE_H     = FOOTER_TOP - BRAND_BOTTOM   // 257mm

    // Content heights (mm)
    const TITLE_H      = 14   // 32pt project name (baseline + leading)
    const UNDERLINE_H  = 6    // gap to underline
    const SUBTITLE_H   = 10   // "LIGHTING DESIGN REPORT" line
    const DESC_H       = exportMeta.description ? 10 : 0
    const PRE_GRID_GAP = 14
    const ROW_H        = 20, ROW_GAP = 5
    const GRID_ROWS    = 5    // 10 items / 2 columns
    const GRID_H       = GRID_ROWS * (ROW_H + ROW_GAP)

    const CONTENT_H    = TITLE_H + UNDERLINE_H + SUBTITLE_H + DESC_H + PRE_GRID_GAP + GRID_H
    const coverStartY  = BRAND_BOTTOM + (USABLE_H - CONTENT_H) / 2

    // Compute y positions for each element
    const titleY     = coverStartY + TITLE_H          // project name baseline
    const underY     = titleY + UNDERLINE_H
    const subtitleY  = underY + SUBTITLE_H
    const descY      = subtitleY + (exportMeta.description ? 10 : 0)
    const gridStartY = (exportMeta.description ? descY : subtitleY) + PRE_GRID_GAP

    // Project name
    doc.setFont("helvetica", "bold"); doc.setFontSize(32)
    doc.setTextColor(255, 255, 255)
    doc.text(projectName.toUpperCase(), PW / 2, titleY, { align: "center" })

    // Gold underline — width matches text width
    const nameW = doc.getTextWidth(projectName.toUpperCase())
    doc.setDrawColor(212, 175, 55); doc.setLineWidth(1.5)
    doc.line(PW / 2 - nameW / 2, underY, PW / 2 + nameW / 2, underY)

    // Subtitle
    doc.setFont("helvetica", "normal"); doc.setFontSize(11)
    doc.setTextColor(180, 180, 180)
    doc.text("LIGHTING DESIGN REPORT", PW / 2, subtitleY, { align: "center" })

    if (exportMeta.description) {
      doc.setFont("helvetica", "italic"); doc.setFontSize(9)
      doc.setTextColor(140, 140, 140)
      doc.text(exportMeta.description, PW / 2, descY, { align: "center", maxWidth: PW - 60 })
    }

    // Summary grid — dark cards, consistent M margins on both sides
    const gridItems = [
      ["PROJECT",        projectName || "—"],
      ["CUSTOMER",       exportMeta.customerName || "—"],
      ["COMPANY",        exportMeta.company || "—"],
      ["ADDRESS",        exportMeta.address || "—"],
      ["PREPARED BY",    exportMeta.preparedBy || user?.email || "—"],
      ["DATE",           date],
      ["FLOORS",         String(floors.length)],
      ["ROOMS",          String(allR.length)],
      ["TOTAL FIXTURES", String(totalFix)],
      ["TOTAL LOAD",     totalLoad + " W"],
    ]
    const COL_GAP = 6
    const colW    = (PW - 2 * M - COL_GAP) / 2   // symmetric: M left, M right
    let gy        = gridStartY
    gridItems.forEach(([lbl, val], i) => {
      const bx = i % 2 === 0 ? M : M + colW + COL_GAP
      if (i > 0 && i % 2 === 0) gy += ROW_H + ROW_GAP
      doc.setFillColor(30, 30, 30)
      doc.setDrawColor(212, 175, 55); doc.setLineWidth(0.3)
      doc.roundedRect(bx, gy, colW, ROW_H, 2, 2, "FD")
      doc.setFont("helvetica", "normal"); doc.setFontSize(7)
      doc.setTextColor(212, 175, 55)
      doc.text(lbl, bx + 5, gy + 7)
      doc.setFont("helvetica", "bold"); doc.setFontSize(10)
      doc.setTextColor(255, 255, 255)
      doc.text(String(val), bx + 5, gy + 16)
    })

    // Bottom gold bar
    doc.setFillColor(212, 175, 55)
    doc.rect(0, PH - 3, PW, 3, "F")

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

      pageNum++
    }

    // ── Final page(s): Canvas Snapshots ──────────────────────────────────────
    const stage = canvasRef.current?.getStage()
    if (stage) {
      const wasBeam = showBeam
      const wasHeatmap = showHeatmap

      // Shared crop + image sizing (used by all three optional pages)
      const bounds = canvasRef.current?.getRoomBounds?.()
      const pad = 30
      const cropX = bounds ? Math.max(0, bounds.x - pad) : 0
      const cropY = bounds ? Math.max(0, bounds.y - pad) : 0
      const cropW = bounds ? bounds.width  + pad * 2 : stage.width()
      const cropH = bounds ? bounds.height + pad * 2 : stage.height()

      const availW    = PW - 2 * M - 8
      const aspectRatio = cropH / cropW
      const imgY      = 26
      const maxH      = PH - imgY - 16          // 255mm safe area before footer
      const scale     = Math.min(1, maxH / (availW * aspectRatio))
      const imgW      = availW * scale
      const imgH      = imgW * aspectRatio
      const imgX      = (PW - imgW) / 2

      // Placement page
      if (exportCanvasOptions.placement) {
        if (wasBeam) setShowBeam(false)
        if (wasHeatmap) setShowHeatmap(false)
        await new Promise(r => setTimeout(r, 300))
        const dataUrl = stage.toDataURL({ pixelRatio: 3, x: cropX, y: cropY, width: cropW, height: cropH })
        if (wasBeam) setShowBeam(true)
        if (wasHeatmap) setShowHeatmap(true)

        doc.addPage()
        doc.setFillColor(10, 10, 10)
        doc.rect(0, 0, PW, PH, "F")
        doc.setFillColor(212, 175, 55)
        doc.rect(0, 0, PW, 3, "F")
        doc.setFillColor(212, 175, 55)
        doc.rect(0, 0, 6, PH, "F")
        doc.setFillColor(212, 175, 55)
        doc.rect(0, PH - 3, PW, 3, "F")

        doc.setFont("helvetica", "bold"); doc.setFontSize(8)
        doc.setTextColor(212, 175, 55)
        doc.text("LAYOUT SNAPSHOT", M + 8, 14)
        doc.setFont("helvetica", "normal"); doc.setFontSize(7)
        doc.setTextColor(150, 150, 150)
        doc.text(activeRoomObj?.name ?? "Room Layout", M + 8, 21)
        doc.setFont("helvetica", "bold"); doc.setFontSize(8)
        doc.setTextColor(212, 175, 55)
        doc.text("LUMINA DESIGN", PW - M, 14, { align: "right" })

        doc.addImage(dataUrl, "PNG", imgX, imgY, imgW, imgH)

        // Distance annotations — derive scale
        const CANVAS_W = 1400
        const CANVAS_H = 750
        const SCALE_PDF = Math.min((CANVAS_W - 260) / roomWidth, (CANVAS_H - 220) / roomHeight)
        const ROOM_X_PDF = roomOffsetX != null ? roomOffsetX : 20
        const ROOM_Y_PDF = roomOffsetY != null ? roomOffsetY : 30
        const ROOM_PX_W_PDF = drawnWidthPx  != null ? drawnWidthPx  : roomWidth  * SCALE_PDF
        const ROOM_PX_H_PDF = drawnHeightPx != null ? drawnHeightPx : roomHeight * SCALE_PDF

        const toPdfX = wx => imgX + ((wx - cropX) / cropW) * imgW
        const toPdfY = wy => imgY + ((wy - cropY) / cropH) * imgH

        const threshold = ROOM_PX_H_PDF / (roomHeight * 2)
        const rows = []
        const cols = []
        ;[...lights].sort((a, b) => a.y - b.y).forEach(l => {
          const r = rows.find(r => Math.abs(r[0].y - l.y) < threshold)
          r ? r.push(l) : rows.push([l])
        })
        ;[...lights].sort((a, b) => a.x - b.x).forEach(l => {
          const c = cols.find(c => Math.abs(c[0].x - l.x) < threshold)
          c ? c.push(l) : cols.push([l])
        })

        doc.setLineDashPattern([1, 1], 0)
        doc.setLineWidth(0.3)
        doc.setFont("helvetica", "normal"); doc.setFontSize(6)

        rows.forEach(row => {
          const sorted = [...row].sort((a, b) => a.x - b.x)
          for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i], b = sorted[i + 1]
            const ax = toPdfX(a.x), ay = toPdfY(a.y)
            const bx = toPdfX(b.x)
            const lineY = ay - 6
            const dist = ((b.x - a.x) / SCALE_PDF / 1000).toFixed(2)
            doc.setDrawColor(212, 175, 55); doc.setTextColor(212, 175, 55)
            doc.line(ax, lineY, bx, lineY)
            doc.line(ax, lineY - 2, ax, lineY + 2)
            doc.line(bx, lineY - 2, bx, lineY + 2)
            doc.text(`${dist}m`, (ax + bx) / 2, lineY - 2, { align: "center" })
          }
        })

        cols.forEach(col => {
          const sorted = [...col].sort((a, b) => a.y - b.y)
          for (let i = 0; i < sorted.length - 1; i++) {
            const a = sorted[i], b = sorted[i + 1]
            const ax = toPdfX(a.x), ay = toPdfY(a.y)
            const by = toPdfY(b.y)
            const lineX = ax + 6
            const dist = ((b.y - a.y) / SCALE_PDF / 1000).toFixed(2)
            doc.setDrawColor(212, 175, 55); doc.setTextColor(212, 175, 55)
            doc.line(lineX, ay, lineX, by)
            doc.line(lineX - 2, ay, lineX + 2, ay)
            doc.line(lineX - 2, by, lineX + 2, by)
            doc.text(`${dist}m`, lineX + 2, (ay + by) / 2, { align: "left" })
          }
        })

        const topRow = [...rows].sort((a, b) => a[0].y - b[0].y)[0]
        if (topRow) {
          const sorted = [...topRow].sort((a, b) => a.x - b.x)
          const first = sorted[0], last = sorted[sorted.length - 1]
          const topY = toPdfY(first.y) - 12
          const wallL = toPdfX(ROOM_X_PDF)
          const wallR = toPdfX(ROOM_X_PDF + ROOM_PX_W_PDF)
          const firstX = toPdfX(first.x)
          const lastX  = toPdfX(last.x)
          const distL = ((first.x - ROOM_X_PDF) / SCALE_PDF / 1000).toFixed(2)
          const distR = ((ROOM_X_PDF + ROOM_PX_W_PDF - last.x) / SCALE_PDF / 1000).toFixed(2)
          doc.setDrawColor(100, 200, 255); doc.setTextColor(100, 200, 255)
          doc.line(wallL, topY, firstX, topY)
          doc.line(wallL, topY - 2, wallL, topY + 2)
          doc.line(firstX, topY - 2, firstX, topY + 2)
          doc.text(`${distL}m`, (wallL + firstX) / 2, topY - 2, { align: "center" })
          doc.line(lastX, topY, wallR, topY)
          doc.line(lastX, topY - 2, lastX, topY + 2)
          doc.line(wallR, topY - 2, wallR, topY + 2)
          doc.text(`${distR}m`, (lastX + wallR) / 2, topY - 2, { align: "center" })
        }

        const leftCol = [...cols].sort((a, b) => a[0].x - b[0].x)[0]
        if (leftCol) {
          const sorted = [...leftCol].sort((a, b) => a.y - b.y)
          const first = sorted[0], last = sorted[sorted.length - 1]
          const leftX = toPdfX(first.x) - 10
          const wallT = toPdfY(ROOM_Y_PDF)
          const wallB = toPdfY(ROOM_Y_PDF + ROOM_PX_H_PDF)
          const firstY = toPdfY(first.y)
          const lastY  = toPdfY(last.y)
          const distT = ((first.y - ROOM_Y_PDF) / SCALE_PDF / 1000).toFixed(2)
          const distB = ((ROOM_Y_PDF + ROOM_PX_H_PDF - last.y) / SCALE_PDF / 1000).toFixed(2)
          doc.setDrawColor(100, 200, 255); doc.setTextColor(100, 200, 255)
          doc.line(leftX, wallT, leftX, firstY)
          doc.line(leftX - 2, wallT, leftX + 2, wallT)
          doc.line(leftX - 2, firstY, leftX + 2, firstY)
          doc.text(`${distT}m`, leftX - 2, (wallT + firstY) / 2, { align: "right" })
          doc.line(leftX, lastY, leftX, wallB)
          doc.line(leftX - 2, lastY, leftX + 2, lastY)
          doc.line(leftX - 2, wallB, leftX + 2, wallB)
          doc.text(`${distB}m`, leftX - 2, (lastY + wallB) / 2, { align: "right" })
        }

        doc.setLineDashPattern([], 0)
      }

      // Beam page
      if (exportCanvasOptions.beam) {
        setShowBeam(true)
        setShowHeatmap(false)
        await new Promise(r => setTimeout(r, 300))
        const beamUrl = stage.toDataURL({ pixelRatio: 3, x: cropX, y: cropY, width: cropW, height: cropH })
        setShowBeam(wasBeam)
        doc.addPage()
        doc.setFillColor(10, 10, 10); doc.rect(0, 0, PW, PH, "F")
        doc.setFillColor(212, 175, 55); doc.rect(0, 0, PW, 3, "F")
        doc.setFillColor(212, 175, 55); doc.rect(0, 0, 6, PH, "F")
        doc.setFillColor(212, 175, 55); doc.rect(0, PH - 3, PW, 3, "F")
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(212, 175, 55)
        doc.text("BEAM ANGLE VIEW", M + 8, 14)
        doc.text("LUMINA DESIGN", PW - M, 14, { align: "right" })
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(150, 150, 150)
        doc.text(activeRoomObj?.name ?? "Room Layout", M + 8, 21)
        doc.addImage(beamUrl, "PNG", imgX, imgY, imgW, imgH)
        pageNum++
      }

      // Heatmap page
      if (exportCanvasOptions.heatmap) {
        setShowHeatmap(true)
        setShowBeam(false)
        await new Promise(r => setTimeout(r, 300))
        const heatUrl = stage.toDataURL({ pixelRatio: 3, x: cropX, y: cropY, width: cropW, height: cropH })
        setShowHeatmap(wasHeatmap)
        doc.addPage()
        doc.setFillColor(10, 10, 10); doc.rect(0, 0, PW, PH, "F")
        doc.setFillColor(212, 175, 55); doc.rect(0, 0, PW, 3, "F")
        doc.setFillColor(212, 175, 55); doc.rect(0, 0, 6, PH, "F")
        doc.setFillColor(212, 175, 55); doc.rect(0, PH - 3, PW, 3, "F")
        doc.setFont("helvetica", "bold"); doc.setFontSize(8); doc.setTextColor(212, 175, 55)
        doc.text("HEATMAP VIEW", M + 8, 14)
        doc.text("LUMINA DESIGN", PW - M, 14, { align: "right" })
        doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(150, 150, 150)
        doc.text(activeRoomObj?.name ?? "Room Layout", M + 8, 21)
        doc.addImage(heatUrl, "PNG", imgX, imgY, imgW, imgH)
        pageNum++
      }
    }

    // Add "Page X of N" footer to every page now that total is known
    const totalPages = doc.internal.getNumberOfPages()
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p)
      footer(p, totalPages)
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
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "#000000", fontFamily: "'Inter', sans-serif", fontSize: 17, color: "#555555" }}>
      Authenticating…
    </div>
  )

  if (!user) return <AuthPage />

  // ── Mobile guard — canvas tool requires desktop ───────────────────────────
  if (typeof window !== "undefined" && window.innerWidth < 768) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", background: "#000000", fontFamily: "'Inter', sans-serif", padding: 32, textAlign: "center", gap: 16 }}>
      <div style={{ fontSize: 40 }}>🖥️</div>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#d4a843", letterSpacing: "0.04em" }}>Desktop required</div>
      <div style={{ fontSize: 14, color: "#888888", maxWidth: 320, lineHeight: 1.7 }}>
        Lumina Design is a professional lighting layout tool that needs a large screen and mouse/trackpad to use properly.
      </div>
      <div style={{ fontSize: 13, color: "#555555", lineHeight: 1.6, maxWidth: 300 }}>
        Open this link on a laptop or desktop computer for the full experience.
      </div>
      <a href="/dashboard" style={{ marginTop: 8, padding: "10px 24px", background: "#d4a843", color: "#000000", borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: "none", letterSpacing: "0.06em" }}>
        Go to Dashboard
      </a>
    </div>
  )

  // ── Sidebar view → leftTab mapping ───────────────────────────────────────
  const SIDEBAR_TO_LEFTTAB = {
    'luminaires':  'fixture',
    'calculation': 'ai',
    'floor-plan':  'fixture',
    'heatmaps':    'fixture',
    'dali-bus':    'fixture',
    'reports':     'fixture',
  }
  function handleSidebarChange(view) {
    setSidebarView(view)
    if (SIDEBAR_TO_LEFTTAB[view]) setLeftTab(SIDEBAR_TO_LEFTTAB[view])
    if (view === 'heatmaps') setShowHeatmap(true)
    if (view === 'dali-bus' && !daliEnabled) setDaliEnabled(true)
    if (view === 'reports') setShowExportModal(true)
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0d0d0d", overflow: "hidden", fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ── Navigation ─────────────────────────────────────────────────────── */}
      <Navigation
        projectName={projectName}
        onProjectNameChange={setProjectName}
        saving={saving}
        onSave={handleSave}
        onExport={() => { setExportRoomIds(floors.flatMap(f => f.rooms.map(r => r.id))); setShowExportModal(true) }}
        onShare={handleShare}
        onSignOut={() => signOut(auth)}
        onShowShortcuts={() => setShowShortcuts(true)}
        onNavigateToDashboard={() => navigate("/dashboard")}
        activeTab={navTab}
        onTabChange={setNavTab}
        user={user}
      />
      {/* TrialBanner sits just below the fixed nav */}
      <div style={{ paddingTop: 56, flexShrink: 0 }}>
        <TrialBanner />
      </div>

      {/* ── Main layout ─────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* ── Left: Sidebar (Nav + content panels) ─────────────────────────── */}
        <Sidebar activeItem={sidebarView} onItemChange={handleSidebarChange}>
          {/* Fixture Library — shown when Luminaires or Floor Plan active */}
          {(sidebarView === 'luminaires' || sidebarView === 'floor-plan') && (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <FixtureLibraryPanel
                activeFixtureId={activeFixtureId}
                onSelect={handleLibrarySelect}
                userId={user?.uid ?? null}
                isProfessional={isProfessional()}
                onProfessionalGate={() => setGateModal({ feature: 'Professional Fixtures', professionalOnly: true })}
              />
            </div>
          )}

          {/* AI Recommender — shown when Calculation active */}
          <div style={{ flex: 1, overflow: "auto", display: sidebarView === 'calculation' ? "flex" : "none", flexDirection: "column" }}>
            <AIRecommender
              activeRoom={room}
              onApplyFixture={handleAIApply}
              onApplyAll={handleAIApplyAll}
              onClose={() => setSidebarView('luminaires')}
              panelMode
            />
          </div>

          {/* Heatmaps info */}
          <div style={{ flex: 1, overflow: "auto", display: sidebarView === 'heatmaps' ? "flex" : "none", flexDirection: "column", padding: 16 }}>
            <div style={{ fontSize: 13, color: "#888888", lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, color: "#cccccc", marginBottom: 8 }}>Lux Heatmap</div>
              <p style={{ marginBottom: 12 }}>Shows lux distribution across the floor. Colors represent % of your target lux level.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {SIDEBAR_LEGEND.map(({ rgb, label }) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: `rgb(${rgb[0]},${rgb[1]},${rgb[2]})`, flexShrink: 0 }} />
                    <span style={{ fontSize: 12 }}>{label}</span>
                  </div>
                ))}
              </div>
              <p style={{ marginTop: 10, fontSize: 11, color: "#555" }}>Yellow = on target. Blue = underlit. Red = overlit.</p>
            </div>
          </div>

          {/* DALI Bus info */}
          <div style={{ flex: 1, overflow: "auto", display: sidebarView === 'dali-bus' ? "flex" : "none", flexDirection: "column", padding: 16 }}>
            <div style={{ fontSize: 14, color: "#888888", lineHeight: 1.6 }}>
              <div style={{ fontWeight: 600, color: "#cccccc", marginBottom: 8 }}>DALI 2.0 Bus</div>
              <p>DALI addressing is auto-assigned to fixtures with DALI protocol. Each bus supports up to 64 devices.</p>
              <div style={{ marginTop: 12, padding: "10px 12px", background: "#1a1a1a", borderRadius: 6, border: "1px solid #2a2a2a" }}>
                <div style={{ fontSize: 17, color: "#555555", marginBottom: 4 }}>BUS CAPACITY</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#cccccc" }}>{daliAddresses?.buses?.length ?? 0} <span style={{ fontSize: 14, fontWeight: 400, color: "#666666" }}>buses</span></div>
              </div>
            </div>
          </div>
        </Sidebar>

        {/* ── Center: Canvas Area 1fr ──────────────────────────────────────── */}
        {/* navTab controls which main view shows: canvas / library */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#0d0d0d" }}>

          {/* ── Library tab ── */}
          {navTab === 'library' && (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <FixtureLibraryPanel
                activeFixtureId={activeFixtureId}
                onSelect={(f) => { handleLibrarySelect(f); setNavTab('canvas') }}
                userId={user?.uid ?? null}
                isProfessional={isProfessional()}
                onProfessionalGate={() => setGateModal({ feature: 'Professional Fixtures', professionalOnly: true })}
              />
            </div>
          )}

          {/* ── Canvas tab (default) ── */}
          {(navTab === 'canvas' || !navTab) && <>

          {/* Centered floating toolbar */}
          {/* ── Toolbar ──────────────────────────────────────────────────────── */}
          <div style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#111111",
            borderBottom: "1px solid #222222",
            height: 44,
            flexShrink: 0,
            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 12px" }}>

              {/* ── Group 1: Canvas Tools ─────────────────────────────────────── */}
              <button
                onClick={autoPlaceLights}
                title="Auto-place fixtures in room"
                style={{ background: "transparent", border: "1px solid #2a2a2a", color: "#888888", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "#1e1e1e"; e.currentTarget.style.borderColor = "#444444"; e.currentTarget.style.color = "#cccccc" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#888888" }}
              >Auto Place</button>

              <button
                onClick={() => setSnapToGrid(p => !p)}
                title="Toggle snap to grid"
                style={{ background: snapToGrid ? "rgba(212,168,67,0.12)" : "transparent", border: snapToGrid ? "1px solid #d4a843" : "1px solid #2a2a2a", color: snapToGrid ? "#d4a843" : "#888888", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
                onMouseEnter={(e) => { if (!snapToGrid) { e.currentTarget.style.background = "#1e1e1e"; e.currentTarget.style.borderColor = "#444444"; e.currentTarget.style.color = "#cccccc" } }}
                onMouseLeave={(e) => { if (!snapToGrid) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#888888" } }}
              >Snap {snapToGrid ? "On" : "Off"}</button>

              <button
                onClick={() => patchActiveRoom(() => ({ lights: [] }))}
                title="Clear all fixtures from room"
                style={{ background: "transparent", border: "1px solid rgba(239,68,68,0.3)", color: "#ef4444", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#ef4444"; e.currentTarget.style.background = "rgba(239,68,68,0.08)" }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; e.currentTarget.style.background = "transparent" }}
              >Clear</button>

              <div style={{ width: 1, height: 20, background: "#2a2a2a", margin: "0 8px" }} />

              {/* ── Group 2: Visualization ────────────────────────────────────── */}
              <button
                onClick={() => setShowBeam(p => !p)}
                title="Toggle beam angle visualization"
                style={{ background: showBeam ? "rgba(212,168,67,0.12)" : "transparent", border: showBeam ? "1px solid #d4a843" : "1px solid #2a2a2a", color: showBeam ? "#d4a843" : "#888888", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
                onMouseEnter={(e) => { if (!showBeam) { e.currentTarget.style.background = "#1e1e1e"; e.currentTarget.style.borderColor = "#444444"; e.currentTarget.style.color = "#cccccc" } }}
                onMouseLeave={(e) => { if (!showBeam) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#888888" } }}
              >Beam</button>

              <button
                onClick={() => setShowHeatmap(p => !p)}
                title="Toggle lux heatmap"
                style={{ background: showHeatmap ? "rgba(212,168,67,0.12)" : "transparent", border: showHeatmap ? "1px solid #d4a843" : "1px solid #2a2a2a", color: showHeatmap ? "#d4a843" : "#888888", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
                onMouseEnter={(e) => { if (!showHeatmap) { e.currentTarget.style.background = "#1e1e1e"; e.currentTarget.style.borderColor = "#444444"; e.currentTarget.style.color = "#cccccc" } }}
                onMouseLeave={(e) => { if (!showHeatmap) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "#2a2a2a"; e.currentTarget.style.color = "#888888" } }}
              >Heatmap</button>

              <div style={{ width: 1, height: 20, background: "#2a2a2a", margin: "0 8px" }} />

              {/* ── Group 3: Electrical / DALI ───────────────────────────────── */}
              <button
                onClick={() => requirePro('DALI', () => {
                  setDaliEnabled(prev => !prev)
                  if (!daliEnabled) {
                    setFloors(prevFloors => prevFloors.map(f => ({
                      ...f,
                      rooms: f.rooms.map(r => ({
                        ...r,
                        lights: r.lights.map(l =>
                          (!l.protocol || l.protocol === 'Room Default') ? { ...l, protocol: 'DALI' } : l
                        ),
                      })),
                    })))
                  }
                })}
                title="Toggle DALI protocol system"
                style={{ display: "flex", alignItems: "center", gap: 6, background: daliEnabled ? "rgba(74,222,128,0.08)" : "rgba(239,68,68,0.08)", border: daliEnabled ? "1px solid #4ade80" : "1px solid rgba(239,68,68,0.4)", color: daliEnabled ? "#4ade80" : "#ef4444", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 600, letterSpacing: "0.04em", fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
              >
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: daliEnabled ? "#4ade80" : "#ef4444", flexShrink: 0 }} />
                DALI {daliEnabled ? "ON" : "OFF"}
              </button>

              {daliActive && (
                <select
                  value={daliNodeLimit}
                  onChange={(e) => setDaliNodeLimit(Number(e.target.value))}
                  title="DALI node limit per bus"
                  style={{ background: "#111111", border: "1px solid #2a2a2a", color: "#888888", padding: "6px 10px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", outline: "none" }}
                >
                  <option value={64}>64 nodes</option>
                  <option value={128}>128 nodes</option>
                </select>
              )}

              <button
                onClick={() => setActiveTool(activeTool === "db"  ? "fixture" : "db")}
                title="Place Distribution Board marker"
                style={{ background: activeTool === "db"  ? "rgba(212,168,67,0.12)" : "transparent", border: activeTool === "db"  ? "1px solid #d4a843" : "1px solid #2a2a2a", color: activeTool === "db"  ? "#d4a843" : "#888888", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
              >DB</button>

              <button
                onClick={() => setActiveTool(activeTool === "ctr" ? "fixture" : "ctr")}
                title="Place Contactor / Controller marker"
                style={{ background: activeTool === "ctr" ? "rgba(212,168,67,0.12)" : "transparent", border: activeTool === "ctr" ? "1px solid #d4a843" : "1px solid #2a2a2a", color: activeTool === "ctr" ? "#d4a843" : "#888888", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
              >CTR</button>

              <button
                onClick={() => setActiveTool(activeTool === "jb"  ? "fixture" : "jb")}
                title="Place Junction Box marker"
                style={{ background: activeTool === "jb"  ? "rgba(212,168,67,0.12)" : "transparent", border: activeTool === "jb"  ? "1px solid #d4a843" : "1px solid #2a2a2a", color: activeTool === "jb"  ? "#d4a843" : "#888888", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
              >JB</button>

              <button
                onClick={() => { setShowEmergency(p => !p); setActiveTool(activeTool === "emergency" ? "fixture" : "emergency") }}
                title="Toggle emergency lighting mode"
                style={{ background: (showEmergency || activeTool === "emergency") ? "rgba(212,168,67,0.12)" : "transparent", border: (showEmergency || activeTool === "emergency") ? "1px solid #d4a843" : "1px solid #2a2a2a", color: (showEmergency || activeTool === "emergency") ? "#d4a843" : "#888888", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
              >Emergency</button>

              <div style={{ width: 1, height: 20, background: "#2a2a2a", margin: "0 8px" }} />

              {/* ── Group 4: Project Tools ────────────────────────────────────── */}
              {floorPlan && (
                <button
                  onClick={() => setActiveTool(activeTool === "draw-room" ? "fixture" : "draw-room")}
                  title="Draw room boundary on the floor plan"
                  style={{ background: activeTool === "draw-room" ? "rgba(212,168,67,0.12)" : "transparent", border: activeTool === "draw-room" ? "1px solid #d4a843" : "1px solid #2a2a2a", color: activeTool === "draw-room" ? "#d4a843" : "#888888", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
                >Draw Room</button>
              )}

              <button
                onClick={async () => {
                  if (sidebarView === 'calculation') {
                    setSidebarView('luminaires')
                  } else {
                    if (!isProActive()) { setGateModal({ feature: 'AI Recommend' }); return }
                    if (user) {
                      try {
                        const { allowed, used, limit } = await checkAiLimit(user.uid)
                        if (!allowed) { notify.warning(`AI call limit reached (${used}/${limit} this month). Resets on the 1st.`); return }
                      } catch (e) { /* non-fatal */ }
                    }
                    setSidebarView('calculation')
                  }
                }}
                title="AI Recommend — Get AI-powered fixture suggestions"
                style={{ background: sidebarView === "calculation" ? "rgba(212,168,67,0.12)" : "transparent", border: sidebarView === "calculation" ? "1px solid #d4a843" : "1px solid #2a2a2a", color: sidebarView === "calculation" ? "#d4a843" : "#888888", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
              >AI RECOMMEND</button>

              <button
                onClick={() => setShowSettings(p => !p)}
                title="Configure room dimensions, target lux, and mounting height"
                style={{ background: showSettings ? "rgba(212,168,67,0.12)" : "transparent", border: showSettings ? "1px solid #d4a843" : "1px solid #2a2a2a", color: showSettings ? "#d4a843" : "#888888", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
              >Settings</button>

              <button
                onClick={() => setShowVisualEditor(p => !p)}
                title="Edit fixture size, color, and shape"
                style={{ background: showVisualEditor ? "rgba(212,168,67,0.12)" : "transparent", border: showVisualEditor ? "1px solid #d4a843" : "1px solid #2a2a2a", color: showVisualEditor ? "#d4a843" : "#888888", padding: "6px 12px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", transition: "all 0.15s" }}
              >Visual Editor</button>

              {/* Protocol selector — only when fixtures selected */}
              {selectedLights.length > 0 && (
                <>
                  <div style={{ width: 1, height: 20, background: "#2a2a2a", margin: "0 8px" }} />
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) {
                        selectedLights.forEach(light => updateLight(light.id, { protocol: e.target.value }))
                        e.target.value = ""
                      }
                    }}
                    title={`${selectedLights.length} fixture${selectedLights.length > 1 ? "s" : ""} selected`}
                    style={{ background: "#111111", border: "1px solid #d4a843", color: "#d4a843", padding: "6px 10px", borderRadius: 5, cursor: "pointer", fontSize: 17, fontWeight: 500, fontFamily: "'Inter', sans-serif", outline: "none" }}
                  >
                    <option value="">Protocol ({selectedLights.length})</option>
                    <option value="NON-DIM">NON-DIM</option>
                    <option value="DALI">DALI</option>
                    <option value="ZIGBEE">ZIGBEE</option>
                    <option value="0-10V">0-10V</option>
                    <option value="PHASE-CUT">Phase-cut</option>
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
          <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6, position: "relative", background: "#0d0d0d" }}>

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
                  background: '#111111',
                  border: '1px solid #2a2a2a',
                  borderRadius: 6,
                  boxShadow: '0 8px 40px rgba(0,0,0,0.9)',
                  zIndex: 10000,
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: "'Inter', sans-serif"
                }}
              >
                <div
                  onMouseDown={startVisualEditorDrag}
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #1e1e1e',
                    cursor: 'grab',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    userSelect: 'none'
                  }}
                >
                  <span style={{ fontSize: 17, color: '#d4a843', fontWeight: 600, letterSpacing: '0.08em' }}>VISUAL EDITOR</span>
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
                    <label style={{ fontSize: 14, color: '#d4a843', display: 'block', marginBottom: 6 }}>
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
                    <label style={{ fontSize: 14, color: '#d4a843', display: 'block', marginBottom: 6 }}>COLOR</label>
                    <input
                      type="color"
                      value={commonColor ?? '#ffffff'}
                      onChange={(e) => selectedLights.forEach(l => updateLight(l.id, { fixtureColor: e.target.value }))}
                      style={{ width: '100%', height: 36, cursor: 'pointer', border: 'none', borderRadius: 3 }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 14, color: '#d4a843', display: 'block', marginBottom: 6 }}>SHAPE</label>
                    <select
                      value={commonShape ?? 'circle'}
                      onChange={(e) => selectedLights.forEach(l => updateLight(l.id, { fixtureShape: e.target.value }))}
                      style={{
                        width: '100%', padding: '8px 6px', background: '#1a1a1a',
                        color: '#cccccc', border: '1px solid #2a2a2a', borderRadius: 3,
                        fontSize: 14, fontFamily: "'Inter', sans-serif", cursor: 'pointer'
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
              activeFixture={activeFixture}
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
              heatmapCellSize={settings.performance.heatMapCellSize ?? 8}
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
            // Calculate phase loads and voltage drop
            const phaseLoads = [0, 0, 0]
            circuits.forEach((c, i) => { phaseLoads[i % 3] += c.totalWatt })

            const maxVDrop = voltageDropResults.length > 0
              ? Math.max(...voltageDropResults.map(r => r.vDropPercent))
              : null

            // Color coding for voltage drop status
            const vDropColor = maxVDrop == null ? "#666666"
              : maxVDrop <= 3 ? "#4ade80"  // Green - Good
              : maxVDrop <= 5 ? "#fb923c"  // Orange - Warning
              : "#ef4444"                  // Red - Critical

            // Reusable column component
            const StatCol = ({ label, children, last }) => (
              <div style={{
                flex: 1,
                borderRight: last ? "none" : "1px solid #1e1e1e",
                padding: "0 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 4
              }}>
                <div style={{
                  fontSize: 11,
                  color: "#999999",
                  letterSpacing: "0.1em",
                  fontWeight: 500,
                  textTransform: "uppercase"
                }}>
                  {label}
                </div>
                {children}
              </div>
            )

            return (
              <div style={{
                height: 68,
                background: "#111111",
                borderTop: "1px solid #1e1e1e",
                display: "flex",
                alignItems: "stretch",
                flexShrink: 0,
                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
              }}>
                {/* Circuits */}
                <StatCol label="CIRCUITS">
                  <span style={{ fontSize: 17, color: "#cccccc", fontWeight: 500 }}>
                    {circuits.length} circuit{circuits.length !== 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: 17, color: "#999999" }}>
                    {totalWatt}W total load
                  </span>
                </StatCol>

                {/* Voltage Drop */}
                <StatCol label="VOLTAGE DROP">
                  <span style={{ fontSize: 17, color: vDropColor, fontWeight: 600 }}>
                    {maxVDrop != null ? `${maxVDrop.toFixed(1)}%` : "—"}
                  </span>
                  <span style={{ fontSize: 17, color: "#999999" }}>
                    {maxVDrop != null
                      ? maxVDrop <= 3 ? "Excellent"
                      : maxVDrop <= 5 ? "Acceptable"
                      : "Critical"
                      : "Not calculated"
                    }
                  </span>
                </StatCol>

                {/* Driver Schedule */}
                <StatCol label="DRIVER SCHEDULE">
                  <span style={{ fontSize: 17, color: "#cccccc", fontWeight: 500 }}>
                    {driverSchedule.length} type{driverSchedule.length !== 1 ? "s" : ""}
                  </span>
                  <span style={{ fontSize: 17, color: "#999999" }}>
                    {lights.length} fixture{lights.length !== 1 ? "s" : ""}
                  </span>
                </StatCol>

                {/* Phase Balance */}
                <StatCol label="PHASE BALANCE" last>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    {["L1", "L2", "L3"].map((phase, i) => {
                      const colors = ["#22d3ee", "#4ade80", "#fbbf24"]  // Cyan, Green, Amber
                      const load = Math.round(phaseLoads[i])
                      return (
                        <span key={phase} style={{
                          fontSize: 14,
                          color: colors[i],
                          fontWeight: 600
                        }}>
                          {phase}: {load}W
                        </span>
                      )
                    })}
                  </div>
                  <span style={{ fontSize: 17, color: "#999999" }}>
                    3-phase distribution
                  </span>
                </StatCol>
              </div>
            )
          })()}

          </>}  {/* end canvas tab */}

        </div>

        {/* ── Right: Inspector Panel ───────────────────────────────────────── */}
        {(() => {
          const luxVal = lights.length ? Math.round(totalLux) : null
          const tgtLux = Number(room.targetLux)
          const luxStatus = luxVal == null ? null
            : luxVal > tgtLux * 1.25 ? "OVERLIT"
            : luxVal >= tgtLux * 0.9  ? "GOOD"
            : "DIM"

          // Enhanced color scheme
          const statusColors = {
            GOOD:    { text: "#4ade80", bg: "rgba(74,222,128,0.1)", label: "OPTIMAL" },
            OVERLIT: { text: "#fb923c", bg: "rgba(251,146,60,0.1)", label: "OVERLIT" },
            DIM:     { text: "#ef4444", bg: "rgba(239,68,68,0.1)",  label: "UNDERLIT" },
          }
          const luxColor = statusColors[luxStatus] || { text: "#555555", bg: "rgba(85,85,85,0.1)", label: "—" }

          // Phase loads for electrical section
          const phaseLoads = [0, 0, 0]
          circuits.forEach((c, i) => { phaseLoads[i % 3] += c.totalWatt })

          // Section component
          const Section = ({ title, children }) => (
            <div style={{ borderBottom: "1px solid #1a1a1a", padding: "14px 16px 16px" }}>
              <div style={{ fontSize: 11, color: "#555555", letterSpacing: "0.12em", fontWeight: 600, marginBottom: 10, textTransform: "uppercase" }}>
                {title}
              </div>
              {children}
            </div>
          )

          // Row component
          const MetricRow = ({ label, value, color, subtitle }) => (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 17, color: "#666666" }}>{label}</div>
              <div style={{ fontSize: 17, color: color || "#cccccc", fontWeight: 600, fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif" }}>
                {value}
                {subtitle && <span style={{ fontSize: 11, color: "#555555", marginLeft: 4 }}>{subtitle}</span>}
              </div>
            </div>
          )

          return (
            <div style={{
              width: 240,
              background: "#111111",
              borderLeft: "1px solid #1e1e1e",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
            }}>

              {/* LUX HERO */}
              <div style={{
                padding: "14px 16px",
                borderBottom: "1px solid #1e1e1e",
                background: "#0d0d0d",
              }}>
                <div style={{ fontSize: 14, color: "#888888", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8, textTransform: "uppercase" }}>
                  Average Lux
                </div>
                <div style={{
                  fontSize: 56,
                  color: luxColor.text,
                  fontWeight: 700,
                  lineHeight: 1,
                  marginBottom: 12,
                  fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                  
                }}>
                  {luxVal ?? "—"}
                </div>
                {luxStatus && (
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "4px 12px",
                    borderRadius: 6,
                    fontSize: 14,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    background: luxColor.bg,
                    color: luxColor.text,
                    border: `1px solid ${luxColor.text}40`,
                    marginBottom: 12,
                  }}>
                    <div style={{ width: 6, height: 6, borderRadius: "50%", background: luxColor.text }} />
                    {luxColor.label}
                  </div>
                )}
                <div style={{ fontSize: 17, color: "#555555", marginTop: 8 }}>
                  Target: <span style={{ color: "#888888", fontWeight: 600 }}>{tgtLux} lux</span>
                </div>
              </div>

              {/* FIXTURE INSPECTOR */}
              <Section title="Fixture">
                {selectedLights.length === 1 ? (
                  (() => {
                    const light = selectedLights[0]
                    return (
                      // key=light.id forces remount when selection changes,
                      // so defaultValue initialises correctly for each fixture.
                      <div key={light.id} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {/* Fixture name */}
                        <div style={{ fontSize: 17, color: "#cccccc", fontWeight: 600, marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {light.label ?? light.name ?? light.category ?? "Unknown"}
                        </div>
                        {/* Specs grid — uncontrolled inputs, commit on blur */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                          {/* WATT */}
                          <div>
                            <label style={{ fontSize: 11, color: "#999999", display: "block", marginBottom: 3, letterSpacing: "0.06em" }}>WATT</label>
                            <input
                              type="number" min="0" step="1"
                              defaultValue={light.watt ?? 0}
                              onBlur={(e) => {
                                const v = Math.max(0, Number(e.target.value) || 0)
                                e.target.value = v
                                updateLight(light.id, { watt: v })
                                e.target.style.borderColor = "#2a2a2a"
                              }}
                              style={{ width: "100%", boxSizing: "border-box", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 3, color: "#cccccc", fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif", padding: "5px 6px" }}
                              onFocus={(e) => { e.target.style.borderColor = "#d4a843" }}
                            />
                          </div>
                          {/* LUMENS */}
                          <div>
                            <label style={{ fontSize: 11, color: "#999999", display: "block", marginBottom: 3, letterSpacing: "0.06em" }}>LUMENS</label>
                            <input
                              type="number" min="0" step="1"
                              defaultValue={light.lumens ?? 0}
                              onBlur={(e) => {
                                const v = Math.max(0, Number(e.target.value) || 0)
                                e.target.value = v
                                updateLight(light.id, { lumens: v })
                                e.target.style.borderColor = "#2a2a2a"
                              }}
                              style={{ width: "100%", boxSizing: "border-box", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 3, color: "#cccccc", fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif", padding: "5px 6px" }}
                              onFocus={(e) => { e.target.style.borderColor = "#d4a843" }}
                            />
                          </div>
                          {/* BEAM */}
                          <div>
                            <label style={{ fontSize: 11, color: "#999999", display: "block", marginBottom: 3, letterSpacing: "0.06em" }}>BEAM (°)</label>
                            <input
                              type="number" min="1" max="180" step="1"
                              defaultValue={light.beamAngle ?? 36}
                              onBlur={(e) => {
                                const v = Math.min(180, Math.max(1, Number(e.target.value) || 36))
                                e.target.value = v
                                updateLight(light.id, { beamAngle: v })
                                e.target.style.borderColor = "#2a2a2a"
                              }}
                              style={{ width: "100%", boxSizing: "border-box", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 3, color: "#cccccc", fontSize: 14, fontWeight: 600, fontFamily: "'Inter', sans-serif", padding: "5px 6px" }}
                              onFocus={(e) => { e.target.style.borderColor = "#d4a843" }}
                            />
                          </div>
                          {/* CCT — read-only, fixture spec */}
                          <div>
                            <div style={{ fontSize: 11, color: "#555555", marginBottom: 3, letterSpacing: "0.06em" }}>CCT</div>
                            <div style={{ fontSize: 14, color: "#888888", fontWeight: 600, fontFamily: "'Inter', sans-serif", padding: "5px 6px", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 3 }}>
                              {light.cct ? `${light.cct}K` : "—"}
                            </div>
                          </div>
                        </div>
                        {/* Protocol badge */}
                        {light.protocol && light.protocol !== "NON-DIM" && light.protocol !== "Room Default" && (
                          <div style={{ padding: "6px 10px", borderRadius: 4, background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.3)", fontSize: 14, color: "#60a5fa", fontWeight: 600, textAlign: "center" }}>
                            {light.protocol === "DALI" ? `DALI • D:${light.daliAddress ?? "?"}` : light.protocol}
                          </div>
                        )}
                        {/* Visual options */}
                        <div style={{ paddingTop: 8, borderTop: "1px solid #1a1a1a" }}>
                          <div style={{ fontSize: 11, color: "#555555", marginBottom: 8, letterSpacing: "0.08em" }}>VISUAL OPTIONS</div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 14, color: "#d4a843", display: "block", marginBottom: 4 }}>Size: {light.fixtureSize ?? 8}</label>
                            <input type="range" min="5" max="20" value={light.fixtureSize ?? 8}
                              onChange={(e) => updateLight(light.id, { fixtureSize: Number(e.target.value) })}
                              style={{ width: "100%", cursor: "pointer" }} />
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 14, color: "#d4a843", display: "block", marginBottom: 4 }}>Color</label>
                            <input type="color" value={light.fixtureColor ?? "#ffffff"}
                              onChange={(e) => updateLight(light.id, { fixtureColor: e.target.value })}
                              style={{ width: "100%", height: 28, cursor: "pointer", border: "none", borderRadius: 3 }} />
                          </div>
                          <div>
                            <label style={{ fontSize: 14, color: "#d4a843", display: "block", marginBottom: 4 }}>Shape</label>
                            <select value={light.fixtureShape ?? "circle"}
                              onChange={(e) => updateLight(light.id, { fixtureShape: e.target.value })}
                              style={{ width: "100%", padding: "4px 6px", background: "#111111", color: "#e0e0e0", border: "1px solid #2a2a2a", borderRadius: 3, fontSize: 14, fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>
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
                        {/* Delete */}
                        <button
                          onClick={async () => {
                            const ok = await confirm("Delete fixture?", { confirmLabel: "DELETE", danger: true })
                            if (!ok) return
                            deleteLight(light.id)
                            setSelectedLights([])
                          }}
                          style={{ padding: "5px 8px", background: "#1a0000", color: "#ef4444", border: "1px solid #3a0000", borderRadius: 4, cursor: "pointer", fontSize: 14, fontFamily: "'Inter', sans-serif", width: "100%" }}
                        >DELETE</button>
                      </div>
                    )
                  })()
                ) : selectedLights.length > 1 ? (
                  (() => {
                    const sel = selectedLights
                    const batchUpdate = (updates) => sel.forEach(l => updateLight(l.id, updates))
                    const sizes  = sel.map(l => l.fixtureSize  ?? 8)
                    const colors = sel.map(l => l.fixtureColor ?? "#ffffff")
                    const shapes = sel.map(l => l.fixtureShape ?? "circle")
                    const allSameSize  = sizes.every(v => v === sizes[0])
                    const allSameColor = colors.every(v => v === colors[0])
                    const allSameShape = shapes.every(v => v === shapes[0])
                    return (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div style={{ padding: "8px 10px", borderRadius: 6, background: "#1a1a1a", border: "1px solid #2a2a2a", textAlign: "center" }}>
                          <div style={{ fontSize: 17, color: "#cccccc", fontWeight: 600, marginBottom: 4 }}>{sel.length} fixtures selected</div>
                          <div style={{ fontSize: 14, color: "#666666" }}>Edits apply to all</div>
                        </div>
                        <div style={{ paddingTop: 8, borderTop: "1px solid #1a1a1a" }}>
                          <div style={{ fontSize: 11, color: "#555555", marginBottom: 8, letterSpacing: "0.08em" }}>BATCH EDIT</div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 14, color: "#d4a843", display: "block", marginBottom: 4 }}>Size: {allSameSize ? sizes[0] : "Mixed"}</label>
                            <input type="range" min="5" max="20" value={allSameSize ? sizes[0] : 8}
                              onChange={(e) => batchUpdate({ fixtureSize: Number(e.target.value) })}
                              style={{ width: "100%", cursor: "pointer" }} />
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 14, color: "#d4a843", display: "block", marginBottom: 4 }}>Color{!allSameColor ? " (mixed)" : ""}</label>
                            <input type="color" value={allSameColor ? colors[0] : "#ffffff"}
                              onChange={(e) => batchUpdate({ fixtureColor: e.target.value })}
                              style={{ width: "100%", height: 28, cursor: "pointer", border: "none", borderRadius: 3 }} />
                          </div>
                          <div style={{ marginBottom: 8 }}>
                            <label style={{ fontSize: 14, color: "#d4a843", display: "block", marginBottom: 4 }}>Shape{!allSameShape ? " (mixed)" : ""}</label>
                            <select value={allSameShape ? shapes[0] : ""}
                              onChange={(e) => batchUpdate({ fixtureShape: e.target.value })}
                              style={{ width: "100%", padding: "4px 6px", background: "#111111", color: "#e0e0e0", border: "1px solid #2a2a2a", borderRadius: 3, fontSize: 14, fontFamily: "'Inter', sans-serif", cursor: "pointer" }}>
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
                          <button
                            onClick={async () => {
                              const ok = await confirm(`Delete ${sel.length} fixtures?`, { confirmLabel: "DELETE", danger: true })
                              if (!ok) return
                              sel.forEach(l => deleteLight(l.id))
                              setSelectedLights([])
                            }}
                            style={{ padding: "5px 8px", background: "#1a0000", color: "#ef4444", border: "1px solid #3a0000", borderRadius: 4, cursor: "pointer", fontSize: 14, fontFamily: "'Inter', sans-serif", width: "100%" }}
                          >DELETE ALL {sel.length}</button>
                        </div>
                      </div>
                    )
                  })()
                ) : (
                  <div style={{ fontSize: 17, color: "#555555", fontStyle: "italic" }}>
                    Click a fixture to inspect
                  </div>
                )}
              </Section>

              {/* ROOM METRICS */}
              <Section title="Room">
                <MetricRow label="Area"               value={`${areaM2.toFixed(1)}m²`} />
                <MetricRow label="Mounting Height"    value={`${mh.toFixed(2)}m`} />
                <MetricRow label="RCR"                value={rcr.toFixed(2)} />
                <MetricRow label="Utilization Factor" value={uf.toFixed(2)} />
                <MetricRow label="Maintenance Factor" value={MAINT_FACTOR} />
              </Section>

              {/* ELECTRICAL */}
              <Section title="Electrical">
                <MetricRow label="Circuits"   value={circuits.length} />
                <MetricRow label="Total Load" value={`${totalWatt}W`} />
                {voltageDropResults.length > 0 && (() => {
                  const maxVDrop  = Math.max(...voltageDropResults.map(r => r.vDropPercent))
                  const vDropColor = maxVDrop <= 3 ? "#4ade80" : maxVDrop <= 5 ? "#fb923c" : "#ef4444"
                  return <MetricRow label="Max V-Drop" value={`${maxVDrop.toFixed(1)}%`} color={vDropColor} />
                })()}
                {daliActive && <MetricRow label="DALI Buses"   value={totalBuses}                    color="#d4a843" />}
                {daliActive && <MetricRow label="Cable Length" value={`${totalCableM.toFixed(0)}m`}              />}
                <MetricRow
                  label="Phase Balance"
                  value={`L1:${Math.round(phaseLoads[0])} L2:${Math.round(phaseLoads[1])} L3:${Math.round(phaseLoads[2])}`}
                  subtitle="W"
                />
              </Section>

            </div>
          )
        })()}

      </main>

      {/* ── Settings slide-in panel ──────────────────────────────────────────── */}
      {showSettings && (
        <div style={{
          position: "fixed", top: 84, right: 0, bottom: 0, width: 320,
          background: "#f9f9f9", borderLeft: "1px solid #e5e5e5",
          display: "flex", flexDirection: "column",
          zIndex: 500, boxShadow: "-8px 0 32px rgba(0,0,0,0.6)",
          fontFamily: "'Inter', sans-serif",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid #222222", flexShrink: 0 }}>
            <span style={{ fontSize: 14, color: "#d4a843", letterSpacing: "0.12em", fontWeight: 600 }}>ROOM SETTINGS</span>
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
          borderRadius: 4, cursor: "pointer", fontFamily: "'Inter', sans-serif", textAlign: "left",
          transition: "border-color 0.12s",
        })
        return (
          <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ background: "#111111", border: "1px solid #222222", borderRadius: 10, width: 480, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 64px rgba(0,0,0,0.9)" }}>

              {/* Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 22px 14px", borderBottom: "1px solid #1e1e1e", flexShrink: 0 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, color: "#d4a843", letterSpacing: "0.08em" }}>EXPORT</span>
                <button onClick={() => setShowExportModal(false)} style={{ background: "transparent", border: "none", color: "#555555", fontFamily: "'Inter', sans-serif", fontSize: 17, cursor: "pointer" }}>✕</button>
              </div>

              {/* Scrollable body */}
              <div style={{ overflowY: "auto", flex: 1, padding: "18px 22px" }}>

                {/* Project Details Form */}
                <div style={{ marginBottom: 22 }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, color: "#888888", letterSpacing: "0.04em" }}>PROJECT DETAILS</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
                    {[
                      { key: "customerName", label: "Customer Name" },
                      { key: "company",      label: "Company / Firm" },
                      { key: "address",      label: "Project Address" },
                      { key: "description",  label: "Project Description" },
                      { key: "preparedBy",   label: "Prepared By" },
                    ].map(({ key, label }) => (
                      <div key={key} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#999999", letterSpacing: "0.04em" }}>{label.toUpperCase()}</span>
                        <input
                          type="text"
                          value={exportMeta[key]}
                          onChange={e => setExportMeta(prev => ({ ...prev, [key]: e.target.value }))}
                          placeholder={label}
                          style={{
                            background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 3,
                            padding: "8px 10px", fontFamily: "'Inter', sans-serif", fontSize: 14,
                            color: "#cccccc", outline: "none", width: "100%", boxSizing: "border-box"
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Canvas Page Options */}
                <div style={{ marginBottom: 22 }}>
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, color: "#888888", letterSpacing: "0.04em" }}>CANVAS PAGES TO EXPORT</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
                    {[
                      { key: "placement", label: "Fixture Placement + Distances", desc: "Shows fixture positions with spacing measurements" },
                      { key: "beam",      label: "Beam Angle View",               desc: "Shows beam spread overlays for each fixture" },
                      { key: "heatmap",   label: "Heatmap View",                  desc: "Shows lux distribution across the room" },
                    ].map(({ key, label, desc }) => {
                      const checked = exportCanvasOptions[key]
                      return (
                        <label key={key} style={{
                          display: "flex", alignItems: "flex-start", gap: 10,
                          padding: "10px 12px", background: "#f9f9f9",
                          border: `1px solid ${checked ? "#d4a843" : "#2e2e2e"}`,
                          borderRadius: 3, cursor: "pointer",
                        }}>
                          <div style={{
                            width: 14, height: 14, border: `1px solid ${checked ? "#d4a843" : "#444"}`,
                            borderRadius: 2, background: checked ? "#d4a843" : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, marginTop: 1,
                          }}>
                            {checked && <span style={{ fontSize: 11, color: "#000", fontWeight: 700 }}>✓</span>}
                          </div>
                          <input type="checkbox" checked={checked}
                            onChange={() => setExportCanvasOptions(prev => ({ ...prev, [key]: !prev[key] }))}
                            style={{ display: "none" }} />
                          <div>
                            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: checked ? "#1f1f1f" : "#666666" }}>{label}</div>
                            <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, color: "#888888", marginTop: 2 }}>{desc}</div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Room selector */}
                <div style={{ marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, color: "#888888", letterSpacing: "0.04em" }}>SELECT ROOMS TO EXPORT</span>
                    <button
                      onClick={() => setExportRoomIds(allSelected ? [] : allExportRooms.map(r => r.id))}
                      style={{ background: "transparent", border: "none", fontFamily: "'Inter', sans-serif", fontSize: 17, color: "#d4a843", cursor: "pointer", letterSpacing: "0.06em", padding: 0 }}
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
                            fontFamily: "'Inter', sans-serif", fontSize: 14,
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
                            {checked && <span style={{ fontSize: 11, color: "#000000", fontWeight: 700, lineHeight: 1 }}>✓</span>}
                          </div>
                          <input type="checkbox" checked={checked} onChange={() => toggleRoom(r.id)} style={{ display: "none" }} />
                          <span>{r.label}</span>
                        </label>
                      )
                    })}
                  </div>
                  {exportRoomIds.length === 0 && (
                    <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, color: "#dc2626", marginTop: 6 }}>
                      Select at least one room to include per-room pages
                    </div>
                  )}
                </div>

                {/* Export buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <button style={btnStyle("#d4a843", "#1a1400", "#2e2200")} onClick={() => { setShowExportModal(false); handleExportPDF(exportMeta, exportCanvasOptions) }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#d4a843", letterSpacing: "0.08em" }}>Export PDF Report</span>
                    <span style={{ fontSize: 11, color: "#888888", marginTop: 3 }}>
                      Summary + {exportRoomIds.length} room detail page{exportRoomIds.length !== 1 ? "s" : ""} + layout snapshot
                    </span>
                  </button>
                  <button style={btnStyle("#3dba74", "#0e1a0e", "#1a4020")} onClick={() => { setShowExportModal(false); handleExportBOQ() }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#3dba74", letterSpacing: "0.08em" }}>Export Excel BOQ</span>
                    <span style={{ fontSize: 11, color: "#888888", marginTop: 3 }}>3 sheets — Fixture BOQ, Electrical, Room Summary</span>
                  </button>
                  <button style={btnStyle("#39c5cf", "#0a1a1e", "#1a3a40")} onClick={() => { setShowExportModal(false); handleExportPNG() }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#39c5cf", letterSpacing: "0.08em" }}>Export Canvas PNG</span>
                    <span style={{ fontSize: 11, color: "#888888", marginTop: 3 }}>High-resolution layout snapshot at 2× pixel ratio</span>
                  </button>
                  <button style={btnStyle("#888", "#181818", "#222222")} onClick={() => { setShowExportModal(false); setShowReport(true) }}>
                    <span style={{ fontSize: 17, fontWeight: 700, color: "#aaa", letterSpacing: "0.08em" }}>View Full Report</span>
                    <span style={{ fontSize: 11, color: "#666", marginTop: 3 }}>Interactive report with print option</span>
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
            style={{ background: '#111111', border: '1px solid #222222', borderRadius: 10, padding: '28px 30px', width: 380, fontFamily: "'Inter', sans-serif" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontSize: 14, color: '#d4a843', letterSpacing: '0.14em', marginBottom: 14 }}>UPGRADE REQUIRED</div>
            <div style={{ fontSize: 14, color: '#f0f0f0', fontWeight: 600, marginBottom: 8 }}>{gateModal.feature}</div>
            {gateModal.professionalOnly ? (
              <div style={{ fontSize: 14, color: '#666666', lineHeight: 1.6, marginBottom: 24 }}>
                Chandeliers, Pendants, Track Lights, Cove Lights, Bollards, Flood Lights, and Surface Panels are exclusive to the Professional plan.
              </div>
            ) : (
              <div style={{ fontSize: 14, color: '#666666', lineHeight: 1.6, marginBottom: 24 }}>
                Your free trial has expired. Upgrade to PRO to unlock {gateModal.feature}, exports, DALI, floor plan upload, AI recommendations, and more.
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => { setGateModal(null); navigate('/dashboard', { state: { openTab: 'subscription' } }) }}
                style={{ flex: 1, background: '#d4a843', color: '#000000', border: 'none', borderRadius: 3, padding: '9px 0', fontSize: 17, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.06em' }}
              >{gateModal.professionalOnly ? 'UPGRADE TO PROFESSIONAL →' : 'UPGRADE TO PRO →'}</button>
              <button
                onClick={() => setGateModal(null)}
                style={{ background: 'transparent', color: '#888888', border: '1px solid #333333', borderRadius: 3, padding: '9px 16px', fontSize: 17, cursor: 'pointer' }}
              >✕</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast notification ──────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "#1a1a1a", border: "1px solid #2a2a2a",
          borderRadius: 6, padding: "10px 20px",
          fontFamily: "'Inter', sans-serif", fontSize: 14, color: "#cccccc",
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
            style={{ background: "#000000", border: "1px solid #2e2e2e", borderRadius: 10, padding: "24px 28px", width: 520, maxWidth: "calc(100vw - 32px)", fontFamily: "'Inter', sans-serif", boxShadow: "0 24px 80px rgba(0,0,0,0.9)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", letterSpacing: "0.1em" }}>KEYBOARD SHORTCUTS</span>
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
                <div style={{ fontSize: 14, color: "#999999", letterSpacing: "0.08em", marginBottom: 8 }}>{group}</div>
                <div style={{ display: "grid", gridTemplateColumns: "160px 1fr", gap: "6px 0" }}>
                  {rows.map(([key, desc]) => (
                    <>
                      <span key={key + "-k"} style={{ fontSize: 14, color: "#d4a843", letterSpacing: "0.04em", background: "rgba(212,168,67,0.08)", border: "1px solid rgba(212,168,67,0.3)", borderRadius: 3, padding: "2px 8px", display: "inline-block", width: "fit-content" }}>{key}</span>
                      <span key={key + "-d"} style={{ fontSize: 14, color: "#666666", letterSpacing: "0.02em", alignSelf: "center", paddingLeft: 12 }}>{desc}</span>
                    </>
                  ))}
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #e5e5e5", marginTop: 8, paddingTop: 12, fontSize: 11, color: "#444", letterSpacing: "0.06em" }}>
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
              <div style={{ fontSize: 22, fontWeight: 700, color: "#ffffff", letterSpacing: "0.04em", marginBottom: 6 }}>
                Welcome to Lumina Design
              </div>
              <div style={{ fontSize: 17, color: "#555555", letterSpacing: "0.05em" }}>
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
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#1a1500", border: "1px solid #d4a843", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17, fontWeight: 600, color: "#d4a843", flexShrink: 0 }}>{num}</div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: "#ffffff", letterSpacing: "0.02em" }}>{title}</span>
                  </div>
                  <div style={{ fontSize: 17, color: "#888888", lineHeight: 1.6, letterSpacing: "0.02em", paddingLeft: 32 }}>{desc}</div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 20, borderTop: "1px solid #2e2e2e" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 17, color: "#555555", cursor: "pointer", userSelect: "none" }}>
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
