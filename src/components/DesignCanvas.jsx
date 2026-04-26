import { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react"
import { createPortal } from "react-dom"
import { Stage, Layer, Rect, Text, Circle, Group, Line, Arc, Image as KonvaImage, RegularPolygon, Star, Wedge } from "react-konva"
import { toMM, fromMM, getStoredUnit, UNIT_OPTIONS, UNIT_KEY } from "../utils/units"
import { useToast } from "./Toast"

const CANVAS_W = 1400
const CANVAS_H = 750
const GRID_MM  = 500

function polylineLengthPx(pts) {
  let total = 0
  for (let i = 0; i < pts.length - 2; i += 2) {
    const dx = pts[i + 2] - pts[i]
    const dy = pts[i + 3] - pts[i + 1]
    total += Math.sqrt(dx * dx + dy * dy)
  }
  return total
}

const PROTOCOL_OPTIONS_CTX = [
  { value: "NON-DIM",   label: "Non-dim" },
  { value: "PHASE-CUT", label: "Phase-cut (Triac)" },
  { value: "0-10V",     label: "0-10V Analog" },
  { value: "DALI",      label: "DALI" },
  { value: "ZIGBEE",    label: "Zigbee" },
]

const CCT_OPTIONS = [
  { value: "single",     label: "Single CCT (fixed)" },
  { value: "tunable",    label: "Tunable White (2700K–6500K)" },
  { value: "rgbw",       label: "RGBW" },
  { value: "dali-dt8",   label: "DALI DT8" },
  { value: "zigbee-cct", label: "Zigbee CCT/RGB" },
]

const CCT_BADGE_MAP = {
  "tunable":    { text: "TW",  color: "#39c5cf" },
  "rgbw":       { text: "RGB", color: "#e84080" },
  "dali-dt8":   { text: "DT8", color: "#e8a830" },
  "zigbee-cct": { text: "ZC",  color: "#4d9fff" },
}

const PROTO_BADGE_MAP = {
  "DALI":      { char: "D", color: "#e8a830" },
  "ZIGBEE":    { char: "Z", color: "#39c5cf" },
  "0-10V":     { char: "A", color: "#3dba74" },
  "PHASE-CUT": { char: "T", color: "#a78bfa" },
}

const zoomBtnStyle = {
  padding: "3px 8px",
  background: "rgba(10,16,24,0.9)",
  border: "1px solid #1a2b3c",
  borderRadius: 3,
  color: "#4a7a96",
  fontFamily: "IBM Plex Mono",
  fontSize: 10,
  cursor: "pointer",
  letterSpacing: "0.06em",
  userSelect: "none",
}

const DesignCanvas = forwardRef(function DesignCanvas({
  lights,
  onAddLight,
  onMoveLight,
  onDeleteLight,
  onSelectLight,
  lux,
  roomWidth,
  roomHeight,
  snapToGrid,
  rcr,
  uf,
  targetLux,
  activeTool,
  activeFixtureCategory,
  dbMarkers,
  ctrMarkers,
  jbMarkers,
  onAddMarker,
  onMoveMarker,
  onDeleteMarker,
  floorPlan,
  showBeam,
  mountingHeight,
  showHeatmap,
  showEmergency,
  emergencyLights,
  onAddEmergencyLight,
  onMoveEmergencyLight,
  onDeleteEmergencyLight,
  onUpdateLight,
  onUpdateLightsOfType,
  roomOffsetX,
  roomOffsetY,
  drawnWidthPx,
  drawnHeightPx,
  allRooms,
  activeRoomId,
  onSelectRoom,
  onRoomBoundSet,
  onHoverLight,
  daliAddresses,
  onSelectLights,
  selectedLightIds,
}, ref) {
  const toast = useToast()
  const stageRef = useRef(null)
  useImperativeHandle(ref, () => ({ getStage: () => stageRef.current }))
  const floorPlanDisplayRef = useRef({ imgX: 0, imgY: 0, displayW: 0, displayH: 0, scaleX: 1, scaleY: 1 })
  const hasFloorPlan = !!floorPlan?.url

  const [floorPlanImg, setFloorPlanImg] = useState(null)
  useEffect(() => {
    if (!floorPlan?.url) { setFloorPlanImg(null); return }
    const img = new window.Image()
    img.onload = () => setFloorPlanImg(img)
    img.src = floorPlan.url
  }, [floorPlan?.url])

  // Compute and cache floor plan display bounds whenever the loaded image changes.
  // Must be a useEffect (not inline in JSX) so it runs after commit, not during
  // React's render phase where side-effects on refs are unreliable.
  useEffect(() => {
    if (!floorPlanImg) { floorPlanDisplayRef.current = null; return }
    const naturalW = floorPlanImg.naturalWidth  || floorPlanImg.width  || CANVAS_W
    const naturalH = floorPlanImg.naturalHeight || floorPlanImg.height || CANVAS_H
    const scale    = Math.min(CANVAS_W / naturalW, CANVAS_H / naturalH)
    const displayW = naturalW * scale
    const displayH = naturalH * scale
    const imgX     = (CANVAS_W - displayW) / 2
    const imgY     = (CANVAS_H - displayH) / 2
    floorPlanDisplayRef.current = { imgX, imgY, displayW, displayH, scaleX: scale, scaleY: scale }
  }, [floorPlanImg])

  // ── Zoom / pan state ──────────────────────────────────────────
  // `transform` drives the Stage; refs hold animated + target values.
  const [transform, setTransform] = useState({ zoom: 1, x: 0, y: 0 })
  const animRef   = useRef({ zoom: 1, x: 0, y: 0 }) // current animated value
  const targetRef = useRef({ zoom: 1, x: 0, y: 0 }) // where we're heading
  const rafId     = useRef(null)

  const [panning,  setPanning]  = useState(false)
  const spaceDown  = useRef(false)
  const isPanning  = useRef(false)
  const panLast    = useRef({ x: 0, y: 0 })

  // Cleanup rAF on unmount
  useEffect(() => () => { if (rafId.current) cancelAnimationFrame(rafId.current) }, [])

  // rAF loop — lerps animRef toward targetRef and pushes React state
  function startAnim() {
    if (rafId.current) return // already ticking
    function tick() {
      const a = animRef.current
      const t = targetRef.current
      const EZ = 0.15  // zoom ease (slower = smoother feel)
      const EP = 0.20  // pan ease

      const nz = a.zoom + (t.zoom - a.zoom) * EZ
      const nx = a.x    + (t.x    - a.x)    * EP
      const ny = a.y    + (t.y    - a.y)    * EP

      const done =
        Math.abs(t.zoom - nz) < 0.0003 &&
        Math.abs(t.x    - nx) < 0.15   &&
        Math.abs(t.y    - ny) < 0.15

      const next = done ? t : { zoom: nz, x: nx, y: ny }
      animRef.current = next
      setTransform({ ...next })
      rafId.current = done ? null : requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.code === "Space" && e.target === document.body) {
        e.preventDefault()
        spaceDown.current = true
      }
    }
    function onKeyUp(e) {
      if (e.code === "Space") {
        spaceDown.current = false
        if (isPanning.current) { isPanning.current = false; setPanning(false) }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup",   onKeyUp)
    return () => { window.removeEventListener("keydown", onKeyDown); window.removeEventListener("keyup", onKeyUp) }
  }, [])

  // ── Context menu state ────────────────────────────────────────
  const [boxSelect, setBoxSelect] = useState({
    isDrawing: false,
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  const [contextMenu, setContextMenu] = useState({
    visible: false, x: 0, y: 0,
    lightId: null, lightLabel: "",
    protocol: "NON-DIM", cctType: "single",
  })
  const contextMenuRef = useRef(null)

  useEffect(() => {
    if (!contextMenu.visible) return
    function onMouseDownOut(e) {
      // Close only if the click landed outside the context menu element
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(m => ({ ...m, visible: false }))
      }
    }
    function onKey(e) { if (e.key === "Escape") setContextMenu(m => ({ ...m, visible: false })) }
    window.addEventListener("mousedown", onMouseDownOut)
    window.addEventListener("keydown",   onKey)
    return () => {
      window.removeEventListener("mousedown", onMouseDownOut)
      window.removeEventListener("keydown",   onKey)
    }
  }, [contextMenu.visible])

  // ── Room draw state ───────────────────────────────────────────
  const [roomDraw,       setRoomDraw]       = useState({ drawing: false, x1: 0, y1: 0, x2: 0, y2: 0 })
  const [roomSizePopup,  setRoomSizePopup]  = useState(null) // { x1, y1, x2, y2, wInput:"", hInput:"" }
  const [popupUnit,      setPopupUnit]      = useState(getStoredUnit)
  const [hoveredLightId, setHoveredLightId] = useState(null)

  useEffect(() => {
    if (activeTool !== "draw-room") setRoomDraw({ drawing: false, x1: 0, y1: 0, x2: 0, y2: 0 })
  }, [activeTool])

  // Convert stage-container screen pos → world canvas coords (uses live animRef)
  function toWorld(rawPos) {
    const { zoom, x, y } = animRef.current
    return {
      x: (rawPos.x - x) / zoom,
      y: (rawPos.y - y) / zoom,
    }
  }

  function handleWheel(e) {
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return

    const ev  = e.evt
    const cur = animRef.current

    // ── Detect gesture type ───────────────────────────────────
    // ctrlKey is set by Mac trackpad pinch (browser quirk)
    const isPinch       = ev.ctrlKey
    // Trackpad two-finger scroll: pixel mode + small per-event delta
    const isTrackpadPan = !isPinch && ev.deltaMode === 0 && Math.abs(ev.deltaY) < 50
    // Space held → always pan regardless of device
    const forceScroll   = spaceDown.current

    if (forceScroll || isTrackpadPan) {
      // ── Pan via scroll ──────────────────────────────────────
      targetRef.current = {
        zoom: targetRef.current.zoom,
        x:    targetRef.current.x - ev.deltaX,
        y:    targetRef.current.y - ev.deltaY,
      }
      // For pan, sync animRef immediately so it feels instant
      animRef.current = { ...animRef.current, ...targetRef.current }
      setTransform({ ...animRef.current })
      return
    }

    // ── Zoom (mouse wheel OR trackpad pinch) ──────────────────
    // Smooth per-event factor (0.95 / 1.05) instead of large jumps
    const factor  = ev.deltaY > 0 ? 0.95 : 1.05
    const newZoom = Math.min(5, Math.max(0.3, cur.zoom * factor))

    // Zoom toward the exact cursor position in world space
    const mousePointTo = {
      x: (pointer.x - cur.x) / cur.zoom,
      y: (pointer.y - cur.y) / cur.zoom,
    }
    const newPos = {
      x: pointer.x - mousePointTo.x * newZoom,
      y: pointer.y - mousePointTo.y * newZoom,
    }

    targetRef.current = { zoom: newZoom, x: newPos.x, y: newPos.y }
    startAnim()
  }

  // Button zoom helpers — zoom toward canvas center
  function _applyZoomStep(factor) {
    const cur     = animRef.current
    const newZoom = Math.min(5, Math.max(0.3, cur.zoom * factor))
    const cx = CANVAS_W / 2, cy = CANVAS_H / 2
    const mp = {
      x: (cx - cur.x) / cur.zoom,
      y: (cy - cur.y) / cur.zoom,
    }
    targetRef.current = {
      zoom: newZoom,
      x:    cx - mp.x * newZoom,
      y:    cy - mp.y * newZoom,
    }
    startAnim()
  }
  function zoomIn()    { _applyZoomStep(1.2) }
  function zoomOut()   { _applyZoomStep(1 / 1.2) }
  function zoomReset() { targetRef.current = { zoom: 1, x: 0, y: 0 }; startAnim() }

  // ── Strip drawing mode & per-mode state ───────────────────────
  const [stripDrawMode, setStripDrawMode]   = useState("line")
  const [stripDraw,     setStripDraw]       = useState({ drawing: false, x1: 0, y1: 0, x2: 0, y2: 0 })
  const [circleDraw,    setCircleDraw]      = useState({ phase: "idle",  cx: 0, cy: 0, mx: 0, my: 0 })
  const [freehandDraw,  setFreehandDraw]    = useState({ drawing: false, points: [], lastX: 0, lastY: 0 })

  const isStripMode = activeFixtureCategory === "LED_STRIP"

  const SCALE     = Math.min((CANVAS_W - 260) / roomWidth, (CANVAS_H - 220) / roomHeight)
  // When the room was drawn on the floor plan use the exact pixel box the user drew;
  // otherwise fall back to auto-scaling from the entered room dimensions.
  const ROOM_PX_W = (roomOffsetX != null && drawnWidthPx  != null) ? drawnWidthPx  : roomWidth  * SCALE
  const ROOM_PX_H = (roomOffsetX != null && drawnHeightPx != null) ? drawnHeightPx : roomHeight * SCALE
  const ROOM_X    = roomOffsetX != null ? roomOffsetX : 20
  const ROOM_Y    = roomOffsetY != null ? roomOffsetY : 30
  const GRID_PX   = GRID_MM * SCALE
  // px-per-mm: use drawn-room ratio when available, otherwise the auto scale
  const pxPerMm   = (roomOffsetX != null && drawnWidthPx != null && roomWidth > 0) ? drawnWidthPx / roomWidth : SCALE
  const dimUnit   = getStoredUnit()

  // ── Heatmap: colour scale & grid computation ──────────────────
  const HEATMAP_STOPS = [
    [0.00, [0,   0, 170]],
    [0.25, [0, 170, 255]],
    [0.50, [0, 204,  68]],
    [0.75, [255, 238,  0]],
    [1.00, [255, 136,  0]],
    [1.50, [255,   0,  0]],
  ]

  function luxToColor(lux) {
    if (targetLux <= 0) return "rgb(0,0,170)"
    const ratio = Math.min(1.5, lux / targetLux)
    for (let i = 0; i < HEATMAP_STOPS.length - 1; i++) {
      const [r0, c0] = HEATMAP_STOPS[i]
      const [r1, c1] = HEATMAP_STOPS[i + 1]
      if (ratio <= r1) {
        const t  = (ratio - r0) / (r1 - r0)
        const ri = Math.round(c0[0] + t * (c1[0] - c0[0]))
        const gi = Math.round(c0[1] + t * (c1[1] - c0[1]))
        const bi = Math.round(c0[2] + t * (c1[2] - c0[2]))
        return `rgb(${ri},${gi},${bi})`
      }
    }
    return "rgb(255,0,0)"
  }

  // Collect all point-like sources (fixtures + sampled strip segments)
  function buildSources(lightList) {
    const SAMPLE_M   = 0.2
    const SAMPLE_PX  = SAMPLE_M * SCALE * 1000
    const sources = []

    for (const light of lightList) {
      if (light.category !== "LED_STRIP") {
        if ((light.lumens ?? 0) > 0) {
          sources.push({
            x: light.x ?? 0,
            y: light.y ?? 0,
            lumens:    light.lumens,
            halfBeamR: ((light.beamAngle ?? 36) / 2) * (Math.PI / 180),
          })
        }
        continue
      }

      // LED strip — sample into point sources every SAMPLE_M metres
      const totalLumens = light.lumens ?? 0
      const totalLenM   = light.lengthM ?? 0
      if (totalLumens <= 0 || totalLenM <= 0) continue
      const lumPerSample = (totalLumens / totalLenM) * SAMPLE_M

      if (light.shape === "circle") {
        const { cx = 0, cy = 0, radiusPx = 0 } = light
        const circM = 2 * Math.PI * (radiusPx / (SCALE * 1000))
        const n     = Math.max(4, Math.round(circM / SAMPLE_M))
        for (let i = 0; i < n; i++) {
          const ang = (2 * Math.PI * i) / n
          sources.push({ x: cx + radiusPx * Math.cos(ang), y: cy + radiusPx * Math.sin(ang), lumens: lumPerSample, halfBeamR: Math.PI / 2 })
        }
      } else if (light.shape === "freehand") {
        const pts  = light.points ?? []
        const lenM = light.lengthM ?? 0
        const n    = Math.max(2, Math.round(lenM / SAMPLE_M))
        for (let i = 0; i <= n; i++) {
          const t   = i / n
          const idx = Math.min(Math.floor(t * (pts.length / 2 - 1)) * 2, pts.length - 2)
          sources.push({ x: pts[idx] ?? 0, y: pts[idx + 1] ?? 0, lumens: lumPerSample, halfBeamR: Math.PI / 2 })
        }
      } else {
        // line (default)
        const x1 = light.x1 ?? 0, y1 = light.y1 ?? 0
        const x2 = light.x2 ?? 0, y2 = light.y2 ?? 0
        const lenPx = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        const n     = Math.max(2, Math.round((lenPx / (SCALE * 1000)) / SAMPLE_M))
        for (let i = 0; i <= n; i++) {
          const t = i / n
          sources.push({ x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1), lumens: lumPerSample, halfBeamR: Math.PI / 2 })
        }
      }
    }
    return sources
  }

  const STEP_PX = Math.max(4, 0.5 * SCALE * 1000)  // 0.5 m in pixels

  const heatmapCells = useMemo(() => {
    if (!showHeatmap || !(mountingHeight > 0) || lights.length === 0) return []

    const sources = buildSources(lights)
    if (sources.length === 0) return []

    const mh2 = mountingHeight * mountingHeight
    const cells = []

    for (let py = ROOM_Y; py < ROOM_Y + ROOM_PX_H; py += STEP_PX) {
      for (let px = ROOM_X; px < ROOM_X + ROOM_PX_W; px += STEP_PX) {
        const cx = px + STEP_PX / 2
        const cy = py + STEP_PX / 2
        let totalLux = 0

        for (const src of sources) {
          // Convert pixel offsets to metres for physically correct distances
          const dxM       = (cx - src.x) / (SCALE * 1000)
          const dyM       = (cy - src.y) / (SCALE * 1000)
          const horzDistM = Math.sqrt(dxM * dxM + dyM * dyM)
          // Clamp to 0.1 m minimum to prevent near-zero divide when a cell
          // centre lands exactly on (or very close to) a fixture position
          const totalDistM = Math.max(0.1, Math.sqrt(horzDistM * horzDistM + mh2))
          const incAngle   = Math.atan2(horzDistM, mountingHeight)
          if (incAngle > src.halfBeamR) continue
          totalLux += (src.lumens * 0.8) / (Math.PI * totalDistM * totalDistM) * Math.cos(incAngle)
        }

        cells.push({ x: px, y: py, color: luxToColor(totalLux) })
      }
    }
    return cells
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHeatmap, lights, roomWidth, roomHeight, mountingHeight, targetLux, SCALE, STEP_PX])

  function snap(val, origin, roomPx) {
    if (!snapToGrid) return val
    const snapped = origin + Math.round((val - origin) / GRID_PX) * GRID_PX
    return Math.min(Math.max(snapped, origin), origin + roomPx)
  }
  function clampToRoom(x, y) {
    return [
      Math.min(Math.max(x, ROOM_X), ROOM_X + ROOM_PX_W),
      Math.min(Math.max(y, ROOM_Y), ROOM_Y + ROOM_PX_H),
    ]
  }
  function clampToFloorPlan(x, y) {
    const fp = floorPlanDisplayRef.current
    if (!fp || !fp.displayW) return [x, y]
    return [
      Math.max(fp.imgX, Math.min(fp.imgX + fp.displayW, x)),
      Math.max(fp.imgY, Math.min(fp.imgY + fp.displayH, y)),
    ]
  }
  function insideRoom(x, y) {
    return x >= ROOM_X && x <= ROOM_X + ROOM_PX_W && y >= ROOM_Y && y <= ROOM_Y + ROOM_PX_H
  }

  // ── Stage-level click — handles fixture/marker placement when floor plan is loaded
  //    (room-fill Rect is hidden when floorPlan is set, so we fall back to the Stage)
  function handleStageClick(e) {
    if (e.target !== e.currentTarget) return
    if (isPanning.current) return
    if (isStripMode) return
    if (activeTool === "draw-room") return
    // When no floor plan, the room-fill Rect handles clicks via its own onClick — don't double-fire
    if (!floorPlan) return
    handleRoomClick(e)
  }

  // ── Regular fixture / marker click ───────────────────────────
  function handleRoomClick(e) {
    if (isStripMode) return
    if (activeTool === "draw-room") return
    const stage = stageRef.current
    if (!stage) return
    const raw = stage.getPointerPosition()
    if (!raw) return
    const pos = toWorld(raw)
    const x = snap(pos.x, ROOM_X, ROOM_PX_W)
    const y = snap(pos.y, ROOM_Y, ROOM_PX_H)
    if (activeTool === "fixture") {
      onAddLight({ id: crypto.randomUUID(), x, y })
    } else if (activeTool === "emergency") {
      onAddEmergencyLight?.(x, y)
    } else {
      onAddMarker(activeTool, x, y)
    }
  }

  // ── Stage mouse events (strip drawing + pan) ──────────────────
  function handleStageMouseDown(e) {
    const isMiddle     = e.evt.button === 1
    const isSpaceLeft  = e.evt.button === 0 && spaceDown.current

    if (isMiddle || isSpaceLeft) {
      e.evt.preventDefault()
      isPanning.current = true
      setPanning(true)
      panLast.current = { x: e.evt.clientX, y: e.evt.clientY }
      return
    }

    // Box select: shift + left drag
    if (e.evt.shiftKey && e.evt.button === 0) {
      const pos = stageRef.current?.getPointerPosition()
      if (pos) {
        setBoxSelect({ isDrawing: true, startX: pos.x, startY: pos.y, endX: pos.x, endY: pos.y })
        return
      }
    }

    // Room boundary draw mode
    if (activeTool === "draw-room" && e.evt.button === 0) {
      const stage = stageRef.current
      if (!stage) return
      const raw = stage.getPointerPosition()
      if (!raw) return
      setRoomDraw({ drawing: true, x1: raw.x, y1: raw.y, x2: raw.x, y2: raw.y })
      return
    }

    if (!isStripMode || activeTool !== "fixture") return
    const stage = stageRef.current
    if (!stage) return
    const raw = stage.getPointerPosition()
    if (!raw) return
    const pos = toWorld(raw)

    if (stripDrawMode === "freehand") {
      if (!insideRoom(pos.x, pos.y)) return
      setFreehandDraw({ drawing: true, points: [pos.x, pos.y], lastX: pos.x, lastY: pos.y })
      return
    }

    if (!floorPlan && e.target.name() !== "room-fill") return
    if (!insideRoom(pos.x, pos.y)) return
    const x = snap(pos.x, ROOM_X, ROOM_PX_W)
    const y = snap(pos.y, ROOM_Y, ROOM_PX_H)

    if (stripDrawMode === "line") {
      setStripDraw({ drawing: true, x1: x, y1: y, x2: x, y2: y })
    } else if (stripDrawMode === "circle") {
      setCircleDraw({ phase: "dragging", cx: x, cy: y, mx: x, my: y })
    }
  }

  function handleStageMouseMove(e) {
    if (isPanning.current) {
      const dx = e.evt.clientX - panLast.current.x
      const dy = e.evt.clientY - panLast.current.y
      panLast.current = { x: e.evt.clientX, y: e.evt.clientY }
      // Drag pan is instant — bypass easing for direct-manipulation feel
      const newPos = { zoom: animRef.current.zoom, x: animRef.current.x + dx, y: animRef.current.y + dy }
      animRef.current   = newPos
      targetRef.current = newPos
      setTransform({ ...newPos })
      return
    }

    // Box select drag update
    if (boxSelect.isDrawing) {
      const pos = stageRef.current?.getPointerPosition()
      if (pos) setBoxSelect(prev => ({ ...prev, endX: pos.x, endY: pos.y }))
      return
    }

    // Room draw preview
    if (roomDraw.drawing) {
      const stage = stageRef.current
      if (!stage) return
      const raw = stage.getPointerPosition()
      if (!raw) return
      setRoomDraw(prev => ({ ...prev, x2: raw.x, y2: raw.y }))
      return
    }

    if (!isStripMode) return
    const stage = stageRef.current
    if (!stage) return
    const raw = stage.getPointerPosition()
    if (!raw) return
    const pos = toWorld(raw)

    if (stripDrawMode === "line" && stripDraw.drawing) {
      const [cx, cy] = clampToRoom(pos.x, pos.y)
      setStripDraw(prev => ({ ...prev, x2: snap(cx, ROOM_X, ROOM_PX_W), y2: snap(cy, ROOM_Y, ROOM_PX_H) }))
    } else if (stripDrawMode === "circle" && circleDraw.phase === "dragging") {
      const [cx, cy] = clampToRoom(pos.x, pos.y)
      setCircleDraw(prev => ({ ...prev, mx: cx, my: cy }))
    } else if (stripDrawMode === "freehand" && freehandDraw.drawing) {
      const [cx, cy] = clampToRoom(pos.x, pos.y)
      const dx = cx - freehandDraw.lastX
      const dy = cy - freehandDraw.lastY
      if (dx * dx + dy * dy >= 25) {
        setFreehandDraw(prev => ({
          ...prev, points: [...prev.points, cx, cy], lastX: cx, lastY: cy,
        }))
      }
    }
  }

  function handleStageMouseUp(e) {
    if (isPanning.current && (e.evt.button === 1 || (e.evt.button === 0 && spaceDown.current))) {
      isPanning.current = false
      setPanning(false)
      return
    }

    // Box select finish
    if (boxSelect.isDrawing) {
      const w1 = toWorld({ x: boxSelect.startX, y: boxSelect.startY })
      const w2 = toWorld({ x: boxSelect.endX,   y: boxSelect.endY })
      const minX = Math.min(w1.x, w2.x), maxX = Math.max(w1.x, w2.x)
      const minY = Math.min(w1.y, w2.y), maxY = Math.max(w1.y, w2.y)
      const inBox = (lights ?? []).filter(l => l.x >= minX && l.x <= maxX && l.y >= minY && l.y <= maxY)
      if (inBox.length > 0) onSelectLights?.(inBox)
      setBoxSelect({ isDrawing: false, startX: 0, startY: 0, endX: 0, endY: 0 })
      return
    }

    // Room boundary draw finish
    if (roomDraw.drawing) {
      // roomDraw stores screen coords — convert to world for dimension calculation
      const stage = stageRef.current
      const raw   = stage ? stage.getPointerPosition() : null
      const worldStart = toWorld({ x: roomDraw.x1, y: roomDraw.y1 })
      const worldEndRaw = raw ? toWorld(raw) : toWorld({ x: roomDraw.x2, y: roomDraw.y2 })
      const [x1, y1] = clampToFloorPlan(worldStart.x, worldStart.y)
      const [x2, y2] = clampToFloorPlan(worldEndRaw.x, worldEndRaw.y)
      const rectWidthPx  = Math.abs(x2 - x1)
      const rectHeightPx = Math.abs(y2 - y1)
      if (rectWidthPx > 10 && rectHeightPx > 10) {
        // Show popup — user enters real dimensions in metres
        setRoomSizePopup({ x1: Math.min(x1, x2), y1: Math.min(y1, y2), x2: Math.max(x1, x2), y2: Math.max(y1, y2), wInput: "", hInput: "" })
      }
      setRoomDraw({ drawing: false, x1: 0, y1: 0, x2: 0, y2: 0 })
      return
    }

    if (!isStripMode) return

    if (stripDrawMode === "line" && stripDraw.drawing) {
      const { x1, y1, x2, y2 } = stripDraw
      const dxPx = x2 - x1, dyPx = y2 - y1
      const lengthPx = Math.sqrt(dxPx * dxPx + dyPx * dyPx)
      if (lengthPx > 8) {
        onAddLight({
          id: crypto.randomUUID(), shape: "line",
          x1, y1, x2, y2,
          lengthM: lengthPx / (SCALE * 1000),
          angle: Math.atan2(dyPx, dxPx) * (180 / Math.PI),
        })
      }
      setStripDraw({ drawing: false, x1: 0, y1: 0, x2: 0, y2: 0 })

    } else if (stripDrawMode === "circle" && circleDraw.phase === "dragging") {
      const { cx, cy, mx, my } = circleDraw
      const dx = mx - cx, dy = my - cy
      const radiusPx = Math.sqrt(dx * dx + dy * dy)
      if (radiusPx > 8) {
        const radiusM = radiusPx / (SCALE * 1000)
        onAddLight({
          id: crypto.randomUUID(), shape: "circle",
          cx, cy, radiusPx,
          startAngleDeg: 0, endAngleDeg: 360,
          lengthM: 2 * Math.PI * radiusM,
        })
      }
      setCircleDraw({ phase: "idle", cx: 0, cy: 0, mx: 0, my: 0 })

    } else if (stripDrawMode === "freehand" && freehandDraw.drawing) {
      const { points } = freehandDraw
      if (points.length >= 6) {
        const lengthM = polylineLengthPx(points) / (SCALE * 1000)
        onAddLight({ id: crypto.randomUUID(), shape: "freehand", points, lengthM })
      }
      setFreehandDraw({ drawing: false, points: [], lastX: 0, lastY: 0 })
    }
  }

  // ── Heatmap rendering components ─────────────────────────────
  function HeatmapLayer() {
    if (!showHeatmap || heatmapCells.length === 0) return null
    const w = Math.ceil(STEP_PX)
    const h = Math.ceil(STEP_PX)
    return (
      <Group listening={false} clipX={ROOM_X} clipY={ROOM_Y} clipWidth={ROOM_PX_W} clipHeight={ROOM_PX_H}>
        {heatmapCells.map((cell, i) => (
          <Rect key={i} x={cell.x} y={cell.y} width={w} height={h} fill={cell.color} opacity={0.55} />
        ))}
      </Group>
    )
  }

  function HeatmapLegend() {
    if (!showHeatmap) return null
    const lx  = ROOM_X + ROOM_PX_W + 15
    const ly  = ROOM_Y + 50
    const W   = 18
    const H   = 150
    const MF  = 0.8
    // Gradient bar: top=hot (red), bottom=cold (blue)
    const gradStops = [
      0,    "#ff0000",
      1/6,  "#ff8800",
      2/6,  "#ffee00",
      3/6,  "#00cc44",
      4/6,  "#00aaff",
      1,    "#0000aa",
    ]
    const labels = [
      { frac: 0,    text: `${Math.round(targetLux * 1.5)} lx` },
      { frac: 1/3,  text: `${Math.round(targetLux)}     lx` },
      { frac: 2/3,  text: `${Math.round(targetLux * 0.5)} lx` },
      { frac: 1,    text: "0 lx" },
    ]
    return (
      <Group listening={false}>
        <Rect
          x={lx} y={ly} width={W} height={H}
          fillLinearGradientStartPoint={{ x: 0, y: 0 }}
          fillLinearGradientEndPoint={{ x: 0, y: H }}
          fillLinearGradientColorStops={gradStops}
          opacity={0.85}
        />
        <Rect x={lx} y={ly} width={W} height={H} stroke="#1a2b3c" strokeWidth={0.5} fill="transparent" />
        <Text x={lx} y={ly - 16} text="LUX" fontSize={8} fontFamily="IBM Plex Mono" fill="#4a7a96" letterSpacing={1} />
        {labels.map(({ frac, text }) => (
          <Text
            key={frac}
            x={lx + W + 4}
            y={ly + frac * H - 5}
            text={text}
            fontSize={8}
            fontFamily="IBM Plex Mono"
            fill="#4a7a96"
          />
        ))}
      </Group>
    )
  }

  // ── Beam spread visualization ────────────────────────────────
  const BEAM_COLORS = {
    COB_DOWNLIGHT: "#ffb347",
    SPOTLIGHT:     "#ffb347",
    PANEL:         "#e8f4ff",
    LINEAR:        "#e8f4ff",
    WALL_WASHER:   "#7ec8e3",
    // Professional types
    CHANDELIER:    "#d4a8f0",
    PENDANT:       "#f8a8d4",
    TRACK_LIGHT:   "#a8d4f8",
    COVE_LIGHT:    "#a8f0f8",
    BOLLARD:       "#a8f0a8",
    FLOOD_LIGHT:   "#f8a8a8",
    SURFACE_PANEL: "#f8d4a8",
  }

  function beamColor(light) {
    return BEAM_COLORS[light.category] ?? "#ffffff"
  }

  function BeamSpreads() {
    if (!showBeam || !(mountingHeight > 0)) return null
    return (
      <>
        {lights.map(light => {
          if (light.category === "LED_STRIP") return null
          const angleDeg = light.beamAngle ?? 36
          const spreadM  = mountingHeight * Math.tan((angleDeg / 2) * Math.PI / 180)
          const spreadPx = Math.max(1, spreadM * SCALE * 1000)
          const color    = beamColor(light)
          const cx = light.x ?? 0
          const cy = light.y ?? 0
          return (
            <Group key={light.id} listening={false}>
              {/* Filled spread area */}
              <Circle x={cx} y={cy} radius={spreadPx} fill={color} opacity={0.08} listening={false} />
              {/* Outer glow ring */}
              <Circle x={cx} y={cy} radius={spreadPx} fill="transparent" stroke={color} strokeWidth={1} opacity={0.15} listening={false} />
              {/* Inner bright core */}
              <Circle x={cx} y={cy} radius={Math.max(1, spreadPx * 0.15)} fill="#ffffff" opacity={0.20} listening={false} />
            </Group>
          )
        })}
      </>
    )
  }

  // ── Measurement overlay — wall + spacing lines on hover ───────
  const DRAWING_TOOLS = ["draw-room", "db", "ctr", "jb", "emergency"]
  function MeasurementLines() {
    if (!hoveredLightId || DRAWING_TOOLS.includes(activeTool)) return null
    const light = lights.find(l => l.id === hoveredLightId)
    if (!light || light.category === "LED_STRIP") return null
    const fx = light.x ?? 0
    const fy = light.y ?? 0
    const rL = ROOM_X, rR = ROOM_X + ROOM_PX_W
    const rT = ROOM_Y, rB = ROOM_Y + ROOM_PX_H

    function fmtDist(distPx) {
      const mm  = distPx / pxPerMm
      const val = fromMM(mm, dimUnit)
      return val !== '' ? `${val}${dimUnit}` : '—'
    }

    // Small label: dark bg rect + white text (both Konva)
    function MeasLabel({ x, y, text, color = "#ffffff" }) {
      const TW = Math.round(text.length * 6.0) + 10
      const TH = 14
      return (
        <Group listening={false}>
          <Rect x={x - TW / 2} y={y - TH / 2} width={TW} height={TH} fill="rgba(0,0,0,0.80)" cornerRadius={2} />
          <Text x={x - TW / 2 + 4} y={y - TH / 2 + 2} text={text} fontSize={10} fontFamily="IBM Plex Mono" fill={color} listening={false} />
        </Group>
      )
    }

    // Nearest point fixture
    let nearDist = Infinity, nearFx = null
    for (const other of lights) {
      if (other.id === light.id || other.category === "LED_STRIP") continue
      const dx = (other.x ?? 0) - fx
      const dy = (other.y ?? 0) - fy
      const d  = Math.sqrt(dx * dx + dy * dy)
      if (d < nearDist) { nearDist = d; nearFx = other }
    }

    return (
      <Group listening={false}>
        {/* Left wall */}
        <Line points={[fx, fy, rL, fy]} stroke="#00d4ff" strokeWidth={1} dash={[4, 4]} opacity={0.7} listening={false} />
        <MeasLabel x={rL + (fx - rL) / 2} y={fy - 9} text={fmtDist(fx - rL)} />
        {/* Right wall */}
        <Line points={[fx, fy, rR, fy]} stroke="#00d4ff" strokeWidth={1} dash={[4, 4]} opacity={0.7} listening={false} />
        <MeasLabel x={fx + (rR - fx) / 2} y={fy - 9} text={fmtDist(rR - fx)} />
        {/* Top wall */}
        <Line points={[fx, fy, fx, rT]} stroke="#00d4ff" strokeWidth={1} dash={[4, 4]} opacity={0.7} listening={false} />
        <MeasLabel x={fx + 24} y={rT + (fy - rT) / 2} text={fmtDist(fy - rT)} />
        {/* Bottom wall */}
        <Line points={[fx, fy, fx, rB]} stroke="#00d4ff" strokeWidth={1} dash={[4, 4]} opacity={0.7} listening={false} />
        <MeasLabel x={fx + 24} y={fy + (rB - fy) / 2} text={fmtDist(rB - fy)} />
        {/* Nearest fixture spacing */}
        {nearFx && nearDist < Infinity && (
          <>
            <Line
              points={[fx, fy, nearFx.x ?? 0, nearFx.y ?? 0]}
              stroke="#d4a843" strokeWidth={1} dash={[4, 4]} opacity={0.6} listening={false}
            />
            <MeasLabel
              x={(fx + (nearFx.x ?? 0)) / 2}
              y={(fy + (nearFx.y ?? 0)) / 2 - 9}
              text={fmtDist(nearDist)}
              color="#d4a843"
            />
          </>
        )}
      </Group>
    )
  }

  // ── Grid lines ───────────────────────────────────────────────
  function GridLines() {
    if (floorPlan) return null
    const lines = []
    for (let mm = GRID_MM; mm < roomWidth; mm += GRID_MM) {
      const x = ROOM_X + mm * SCALE
      lines.push(<Line key={`v-${mm}`} points={[x, ROOM_Y + 1, x, ROOM_Y + ROOM_PX_H - 1]} stroke="#1a1a1a" strokeWidth={0.8} dash={[3, 5]} listening={false} />)
    }
    for (let mm = GRID_MM; mm < roomHeight; mm += GRID_MM) {
      const y = ROOM_Y + mm * SCALE
      lines.push(<Line key={`h-${mm}`} points={[ROOM_X + 1, y, ROOM_X + ROOM_PX_W - 1, y]} stroke="#1a1a1a" strokeWidth={0.8} dash={[3, 5]} listening={false} />)
    }
    if (snapToGrid) {
      for (let mmX = 0; mmX <= roomWidth; mmX += GRID_MM) {
        for (let mmY = 0; mmY <= roomHeight; mmY += GRID_MM) {
          lines.push(<Circle key={`dot-${mmX}-${mmY}`} x={ROOM_X + mmX * SCALE} y={ROOM_Y + mmY * SCALE} radius={1.2} fill="#333333" listening={false} />)
        }
      }
    }
    return <>{lines}</>
  }

  // ── Point fixture symbol ──────────────────────────────────────
  function LightSymbol({ light }) {
    const r      = light.fixtureSize ?? (light.visualRadius ?? 6)
    const fill   = light.fill         ?? "#ffe9b0"
    const stroke = light.stroke       ?? "#ffb300"
    const glow   = light.glowColor    ?? "rgba(255,179,0,0.08)"

    function handleDragEnd(e) {
      const PAD  = r + 2
      const newX = Math.min(Math.max(snap(e.target.x(), ROOM_X, ROOM_PX_W), ROOM_X + PAD), ROOM_X + ROOM_PX_W - PAD)
      const newY = Math.min(Math.max(snap(e.target.y(), ROOM_Y, ROOM_PX_H), ROOM_Y + PAD), ROOM_Y + ROOM_PX_H - PAD)
      e.target.x(newX); e.target.y(newY)
      onMoveLight(light.id, newX, newY)
    }

    function handleContextMenu(e) {
      e.evt.preventDefault()
      e.cancelBubble = true
      const rect = e.target.getStage().container().getBoundingClientRect()
      const pos  = e.target.getStage().getPointerPosition()
      setContextMenu({
        visible:    true,
        x:          rect.left + pos.x,
        y:          rect.top  + pos.y,
        lightId:    light.id,
        lightLabel: light.label ?? light.type ?? "Fixture",
        protocol:   light.protocol  ?? "NON-DIM",
        cctType:    light.cctType   ?? "single",
      })
    }

    const protoBadge = light.protocol && light.protocol !== "NON-DIM" && light.protocol !== "Room Default"
      ? PROTO_BADGE_MAP[light.protocol] : null
    const cctBadge = light.cctType && light.cctType !== "single"
      ? CCT_BADGE_MAP[light.cctType] : null
    const daliEntry = daliAddresses?.byId?.[light.id]

    const hasBoth = protoBadge && cctBadge

    const isSelected = selectedLightIds?.includes(light.id) ?? false

    return (
      <Group x={light.x} y={light.y} draggable onDragEnd={handleDragEnd} onContextMenu={handleContextMenu}>
        <Circle radius={Math.max(1, Math.abs(r + 8))} fill={light.fixtureColor ? light.fixtureColor + '33' : glow} listening={false} />
        {/* Selection ring — rendered beneath the fixture shape */}
        {isSelected && (
          <Circle
            radius={Math.max(1, Math.abs(r + 6))}
            fill="transparent"
            stroke="#39c5cf"
            strokeWidth={2}
            opacity={0.9}
            shadowColor="#39c5cf"
            shadowBlur={8}
            shadowOpacity={0.6}
            listening={false}
          />
        )}
        <Circle
          radius={Math.max(1, Math.abs(r + 4))}
          fill="transparent"
          onMouseEnter={() => { setHoveredLightId(light.id); onHoverLight?.(light) }}
          onMouseLeave={() => { setHoveredLightId(null);     onHoverLight?.(null)  }}
          onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey); }}
          onContextMenu={handleContextMenu}
        />
        {(() => {
          const shape = light.fixtureShape ?? 'circle'
          const shapeColor = light.fixtureColor ?? fill
          const shapeRadius = Math.max(1, Math.abs(r))
          const shapeProps = {
            fill: shapeColor,
            stroke: isSelected ? "#39c5cf" : stroke,
            strokeWidth: isSelected ? 2.5 : 1.5,
            onClick: (e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey); },
            onDblClick: (e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id); }
          }

          if (shape === 'circle')    return <Circle radius={shapeRadius} {...shapeProps} />
          if (shape === 'square')    return <Rect x={-shapeRadius} y={-shapeRadius} width={shapeRadius*2} height={shapeRadius*2} {...shapeProps} />
          if (shape === 'diamond')   return <RegularPolygon sides={4} radius={shapeRadius} rotation={45} {...shapeProps} />
          if (shape === 'triangle')  return <RegularPolygon sides={3} radius={shapeRadius} {...shapeProps} />
          if (shape === 'hexagon')   return <RegularPolygon sides={6} radius={shapeRadius} {...shapeProps} />
          if (shape === 'star')      return <Star numPoints={5} innerRadius={shapeRadius*0.4} outerRadius={shapeRadius} {...shapeProps} />
          if (shape === 'rectangle') return <Rect x={-shapeRadius*1.6} y={-shapeRadius*0.6} width={shapeRadius*3.2} height={shapeRadius*1.2} {...shapeProps} />
          if (shape === 'cross') return (
            <>
              <Rect x={-shapeRadius} y={-shapeRadius} width={shapeRadius*2} height={shapeRadius*2} fill="transparent" listening={true} onClick={shapeProps.onClick} onDblClick={shapeProps.onDblClick} />
              <Line points={[-shapeRadius, 0, shapeRadius, 0]} stroke={stroke} strokeWidth={1.5} listening={false} />
              <Line points={[0, -shapeRadius, 0, shapeRadius]} stroke={stroke} strokeWidth={1.5} listening={false} />
            </>
          )
          // ── Professional fixture shapes ────────────────────────────────────
          if (shape === 'star6')  return <Star numPoints={6} innerRadius={shapeRadius*0.42} outerRadius={shapeRadius} {...shapeProps} />
          if (shape === 'flood')  return <Wedge radius={shapeRadius*1.3} angle={80} rotation={-40} {...shapeProps} />
          if (shape === 'cove')   return <Rect x={-shapeRadius*2.2} y={-shapeRadius*0.3} width={shapeRadius*4.4} height={shapeRadius*0.6} {...shapeProps} />
          if (shape === 'pendant') return (
            <>
              <Line points={[0, -shapeRadius*2.4, 0, -shapeRadius]} stroke={isSelected ? "#39c5cf" : stroke} strokeWidth={1.5} listening={false} />
              <Circle radius={shapeRadius} fill={shapeColor} stroke={isSelected ? "#39c5cf" : stroke} strokeWidth={isSelected ? 2.5 : 1.5} onClick={shapeProps.onClick} onDblClick={shapeProps.onDblClick} />
            </>
          )
          if (shape === 'track') return (
            <>
              <Rect x={-shapeRadius*2} y={-shapeRadius*0.45} width={shapeRadius*4} height={shapeRadius*0.9} fill={shapeColor} stroke={isSelected ? "#39c5cf" : stroke} strokeWidth={isSelected ? 2.5 : 1.5} onClick={shapeProps.onClick} onDblClick={shapeProps.onDblClick} />
              <Circle radius={shapeRadius*0.55} fill={stroke} stroke="transparent" strokeWidth={0} listening={false} />
            </>
          )
          return <Circle radius={shapeRadius} {...shapeProps} />
        })()}
        <Circle radius={1.5} fill={stroke} listening={false} />
        {protoBadge && (
          <Text text={protoBadge.char} fontSize={6} fontFamily="IBM Plex Mono" fontStyle="bold"
            fill={protoBadge.color} x={hasBoth ? -9 : -3} y={r + 3} listening={false} />
        )}
        {cctBadge && (
          <Text text={cctBadge.text} fontSize={6} fontFamily="IBM Plex Mono" fontStyle="bold"
            fill={cctBadge.color} x={hasBoth ? 1 : -7} y={r + 3} listening={false} />
        )}
        {daliEntry && (
          <>
            <Rect x={-12} y={r + 10} width={24} height={12}
              fill="#001a2e" stroke="#00d4ff" strokeWidth={0.5} cornerRadius={2} listening={false} />
            <Text x={-12} y={r + 11} width={24} text={`D:${daliEntry.address}`}
              fontSize={7} fontFamily="IBM Plex Mono" fill="#00d4ff" align="center" listening={false} />
          </>
        )}
      </Group>
    )
  }

  // ── LED Strip — LINE shape ────────────────────────────────────
  function LedStripSymbol({ light }) {
    const fill   = light.fill   ?? "#f0d0ff"
    const stroke = light.stroke ?? "#cc60ff"
    const x1 = light.x1 ?? light.x ?? 0
    const y1 = light.y1 ?? light.y ?? 0
    const x2 = light.x2 ?? ((light.x ?? 0) + (light.length ?? 1) * SCALE * 1000)
    const y2 = light.y2 ?? light.y ?? 0
    const lengthM = light.lengthM ?? (Math.sqrt((x2-x1)**2 + (y2-y1)**2) / (SCALE * 1000))
    const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2

    function handleDragEnd(e) {
      const dx = e.target.x(), dy = e.target.y()
      e.target.x(0); e.target.y(0)
      onMoveLight(light.id, dx, dy)
    }

    return (
      <Group x={0} y={0} draggable onDragEnd={handleDragEnd}>
        <Line points={[x1, y1, x2, y2]} stroke={fill} strokeWidth={8} opacity={0.3} listening={false} />
        <Line points={[x1, y1, x2, y2]} stroke={fill} strokeWidth={4} onDblClick={(e) => { e.evt.stopPropagation(); onDeleteLight?.(light.id); }} />
        <Circle x={x1} y={y1} radius={3} fill={stroke} listening={false} />
        <Circle x={x2} y={y2} radius={3} fill={stroke} listening={false} />
        <Text x={midX + 5} y={midY - 14} text={`${lengthM.toFixed(2)}m · ${light.watt ?? 0}W`} fontSize={8} fontFamily="IBM Plex Mono" fill={stroke} listening={false} />
      </Group>
    )
  }

  // ── LED Strip — CIRCLE / ARC shape ───────────────────────────
  function LedCircleStripSymbol({ light }) {
    const fill   = light.fill   ?? "#f0d0ff"
    const stroke = light.stroke ?? "#cc60ff"
    const { cx, cy, lengthM } = light
    const safeRadius = Math.max(0, light.radiusPx ?? 0)
    const startDeg   = light.startAngleDeg ?? 0
    const arcDeg     = (light.endAngleDeg ?? 360) - startDeg

    function handleDragEnd(e) {
      const dx = e.target.x(), dy = e.target.y()
      e.target.x(0); e.target.y(0)
      onMoveLight(light.id, dx, dy)
    }

    return (
      <Group x={0} y={0} draggable onDragEnd={handleDragEnd}>
        <Arc x={cx} y={cy} innerRadius={Math.max(1, Math.abs(safeRadius - 6))} outerRadius={Math.max(1, Math.abs(safeRadius + 6))} angle={arcDeg} rotation={startDeg} fill={fill} opacity={0.3} closed={false} listening={false} />
        <Arc x={cx} y={cy} innerRadius={Math.max(1, Math.abs(safeRadius - 3))} outerRadius={Math.max(1, Math.abs(safeRadius + 3))} angle={arcDeg} rotation={startDeg} fill={fill} closed={false} onDblClick={(e) => { e.evt.stopPropagation(); onDeleteLight?.(light.id); }} />
        <Circle x={cx} y={cy} radius={2} fill={stroke} opacity={0.5} listening={false} />
        <Text x={cx + 5} y={cy - safeRadius - 14} text={`${(lengthM ?? 0).toFixed(2)}m · ${light.watt ?? 0}W`} fontSize={8} fontFamily="IBM Plex Mono" fill={stroke} listening={false} />
      </Group>
    )
  }

  // ── LED Strip — FREEHAND shape ────────────────────────────────
  function LedFreehandStripSymbol({ light }) {
    const fill   = light.fill   ?? "#f0d0ff"
    const stroke = light.stroke ?? "#cc60ff"
    const points  = light.points ?? []
    const lengthM = light.lengthM ?? 0
    const mi = Math.floor(points.length / 4) * 2
    const lx = (points[mi] ?? 0) + 6
    const ly = (points[mi + 1] ?? 0) - 14

    function handleDragEnd(e) {
      const dx = e.target.x(), dy = e.target.y()
      e.target.x(0); e.target.y(0)
      onMoveLight(light.id, dx, dy)
    }

    return (
      <Group x={0} y={0} draggable onDragEnd={handleDragEnd}>
        <Line points={points} stroke={fill} strokeWidth={8} opacity={0.3} tension={0.5} lineCap="round" lineJoin="round" listening={false} />
        <Line points={points} stroke={fill} strokeWidth={4} tension={0.5} lineCap="round" lineJoin="round" onDblClick={(e) => { e.evt.stopPropagation(); onDeleteLight?.(light.id); }} />
        <Text x={lx} y={ly} text={`${lengthM.toFixed(2)}m · ${light.watt ?? 0}W`} fontSize={8} fontFamily="IBM Plex Mono" fill={stroke} listening={false} />
      </Group>
    )
  }

  // ── Electrical markers ────────────────────────────────────────
  function DBMarker({ marker }) {
    const S = 12
    function handleDragEnd(e) {
      const newX = Math.min(Math.max(e.target.x(), ROOM_X + S), ROOM_X + ROOM_PX_W - S)
      const newY = Math.min(Math.max(e.target.y(), ROOM_Y + S), ROOM_Y + ROOM_PX_H - S)
      e.target.x(newX); e.target.y(newY)
      onMoveMarker("db", marker.id, newX, newY)
    }
    return (
      <Group x={marker.x} y={marker.y} draggable onDragEnd={handleDragEnd}>
        <Rect x={-S} y={-S} width={S * 2} height={S * 2} fill="#2a1400" stroke="#e8a830" strokeWidth={1.5} onDblClick={() => onDeleteMarker("db", marker.id)} />
        <Text text="DB" fontSize={8} fontFamily="IBM Plex Mono" fill="#e8a830" offsetX={6} offsetY={4} listening={false} />
      </Group>
    )
  }

  function CTRMarker({ marker }) {
    const R = 10
    function handleDragEnd(e) {
      const newX = Math.min(Math.max(e.target.x(), ROOM_X + R), ROOM_X + ROOM_PX_W - R)
      const newY = Math.min(Math.max(e.target.y(), ROOM_Y + R), ROOM_Y + ROOM_PX_H - R)
      e.target.x(newX); e.target.y(newY)
      onMoveMarker("ctr", marker.id, newX, newY)
    }
    return (
      <Group x={marker.x} y={marker.y} draggable onDragEnd={handleDragEnd}>
        <Circle radius={R} fill="#071e1e" stroke="#39c5cf" strokeWidth={1.5} onDblClick={() => onDeleteMarker("ctr", marker.id)} />
        <Line points={[-R + 3, 0, R - 3, 0]} stroke="#39c5cf" strokeWidth={1} listening={false} />
        <Line points={[0, -R + 3, 0, R - 3]} stroke="#39c5cf" strokeWidth={1} listening={false} />
        <Text text="CTR" fontSize={6} fontFamily="IBM Plex Mono" fill="#39c5cf" offsetX={7} offsetY={3} listening={false} />
      </Group>
    )
  }

  function JBMarker({ marker }) {
    const S = 11
    function handleDragEnd(e) {
      const newX = Math.min(Math.max(e.target.x(), ROOM_X + S), ROOM_X + ROOM_PX_W - S)
      const newY = Math.min(Math.max(e.target.y(), ROOM_Y + S), ROOM_Y + ROOM_PX_H - S)
      e.target.x(newX); e.target.y(newY)
      onMoveMarker("jb", marker.id, newX, newY)
    }
    return (
      <Group x={marker.x} y={marker.y} draggable onDragEnd={handleDragEnd}>
        <Line points={[0, -S, S, 0, 0, S, -S, 0]} closed fill="#1a0e2a" stroke="#a78bfa" strokeWidth={1.5} onDblClick={() => onDeleteMarker("jb", marker.id)} />
        <Text text="JB" fontSize={7} fontFamily="IBM Plex Mono" fill="#a78bfa" offsetX={5} offsetY={3.5} listening={false} />
      </Group>
    )
  }

  // ── Emergency fixture symbol ──────────────────────────────────
  function EmergencyFixture({ ef }) {
    const R = 10
    function handleDragEnd(e) {
      const newX = Math.min(Math.max(e.target.x(), ROOM_X + R), ROOM_X + ROOM_PX_W - R)
      const newY = Math.min(Math.max(e.target.y(), ROOM_Y + R), ROOM_Y + ROOM_PX_H - R)
      e.target.x(newX); e.target.y(newY)
      onMoveEmergencyLight?.(ef.id, newX, newY)
    }
    return (
      <Group x={ef.x} y={ef.y} draggable onDragEnd={handleDragEnd}>
        <Circle radius={R + 4} fill="rgba(61,186,116,0.08)" listening={false} />
        <Circle radius={R} fill="#081a0e" stroke="#3dba74" strokeWidth={1.5} onDblClick={() => onDeleteEmergencyLight?.(ef.id)} />
        <Text text="E" fontSize={9} fontFamily="IBM Plex Mono" fill="#3dba74" fontStyle="bold" offsetX={3.5} offsetY={4.5} listening={false} />
      </Group>
    )
  }

  // ── Preview metrics ───────────────────────────────────────────
  const STRIP_FILL = "#cc60ff"

  const previewLineLen   = stripDraw.drawing
    ? Math.sqrt((stripDraw.x2-stripDraw.x1)**2 + (stripDraw.y2-stripDraw.y1)**2) / (SCALE * 1000)
    : 0
  const previewCircleR   = circleDraw.phase === "dragging"
    ? Math.sqrt((circleDraw.mx-circleDraw.cx)**2 + (circleDraw.my-circleDraw.cy)**2)
    : 0
  const previewCircleLen = 2 * Math.PI * previewCircleR / (SCALE * 1000)
  const previewFreeLen   = freehandDraw.drawing && freehandDraw.points.length >= 4
    ? polylineLengthPx(freehandDraw.points) / (SCALE * 1000)
    : 0

  let indicatorText = null
  if (isStripMode && activeTool === "fixture") {
    if      (stripDrawMode === "line"     && stripDraw.drawing)               indicatorText = `LINE: ${previewLineLen.toFixed(2)}m`
    else if (stripDrawMode === "circle"   && circleDraw.phase === "dragging") indicatorText = `CIRCLE: r=${(previewCircleR/(SCALE*1000)).toFixed(2)}m`
    else if (stripDrawMode === "freehand" && freehandDraw.drawing)            indicatorText = `FREEHAND: ${previewFreeLen.toFixed(2)}m`
    else indicatorText = `draw: ${stripDrawMode.toUpperCase()}`
  }

  const luxColor =
    lights.length === 0 ? "#2d4f68"
    : lux < 150         ? "#d94f4f"
    : lux < 500         ? "#39c5cf"
    :                     "#e8a830"

  const MODES = [
    { id: "line",     label: "— LINE"     },
    { id: "circle",   label: "○ CIRCLE"   },
    { id: "freehand", label: "~ FREEHAND" },
  ]

  const stageCursor = panning ? "grabbing" : (spaceDown.current ? "grab" : "crosshair")

  // ── Room size popup handlers ──────────────────────────────────
  function confirmRoomSize() {
    if (!roomSizePopup) return
    const wVal = parseFloat(roomSizePopup.wInput)
    const hVal = parseFloat(roomSizePopup.hInput)
    if (isNaN(wVal) || isNaN(hVal) || wVal <= 0 || hVal <= 0) {
      toast.error('Please enter valid width and height values')
      return
    }
    const widthM  = toMM(wVal, popupUnit) / 1000
    const heightM = toMM(hVal, popupUnit) / 1000
    if (isNaN(widthM) || isNaN(heightM) || widthM <= 0 || heightM <= 0) return
    const drawnWidthPx  = roomSizePopup.x2 - roomSizePopup.x1
    const drawnHeightPx = roomSizePopup.y2 - roomSizePopup.y1
    onRoomBoundSet?.({ x1: roomSizePopup.x1, y1: roomSizePopup.y1, widthM, heightM, drawnWidthPx, drawnHeightPx })
    setRoomSizePopup(null)
  }

  function cancelRoomSize() { setRoomSizePopup(null) }

  // ── Context menu apply handlers ───────────────────────────────
  function applyContextMenu() {
    const { lightId, protocol, cctType } = contextMenu
    if (lightId != null) {
      onUpdateLight?.(lightId, { protocol, cctType })
    }
    setContextMenu(m => ({ ...m, visible: false }))
  }

  function applyContextMenuAll() {
    const { lightId, protocol, cctType } = contextMenu
    const target = lights.find(l => l.id === lightId)
    if (target) onUpdateLightsOfType?.(target.fixtureId, { protocol, cctType })
    setContextMenu(m => ({ ...m, visible: false }))
  }

  function deleteFromContext() {
    onDeleteLight?.(contextMenu.lightId)
    setContextMenu(m => ({ ...m, visible: false }))
  }

  // ── Context menu style helpers ────────────────────────────────
  const CM = {
    bg:     "rgba(15,20,30,0.97)",
    border: "#00d4ff",
    dim:    "#2d4f68",
    label:  "#4a7a96",
    value:  "#cdd9e5",
    amber:  "#e8a830",
    red:    "#d94f4f",
    sel:    "#1a1200",
  }

  function CMOption({ value, current, label, onChange }) {
    const active = value === current
    return (
      <div
        onClick={e => { e.stopPropagation(); onChange(value) }}
        style={{
          padding: "4px 8px", borderRadius: 3, cursor: "pointer",
          fontSize: 9, fontFamily: "IBM Plex Mono", letterSpacing: "0.05em",
          color:      active ? CM.amber : CM.label,
          background: active ? CM.sel   : "transparent",
          border: `1px solid ${active ? "#e8a83044" : "transparent"}`,
          marginBottom: 2, userSelect: "none",
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0, display: "inline-block",
          background: active ? CM.amber : CM.dim }} />
        {label}
      </div>
    )
  }

  return (
    <>
    <div style={{ display: "flex", flexDirection: "column" }}>

      {/* Strip drawing mode toolbar */}
      {isStripMode && activeTool === "fixture" && (
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "5px 10px", background: "#090c10",
          borderBottom: "1px solid #1a0e30",
          width: CANVAS_W, boxSizing: "border-box",
        }}>
          <span style={{ fontFamily: "IBM Plex Mono", fontSize: 8, color: "#5a3080", letterSpacing: "0.16em", marginRight: 4, textTransform: "uppercase" }}>LED Strip Mode</span>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setStripDrawMode(m.id)}
              style={{
                padding: "4px 12px",
                background: stripDrawMode === m.id ? "#1a0e08" : "transparent",
                border:     `1px solid ${stripDrawMode === m.id ? "#e8a830" : "#2a1a3a"}`,
                borderRadius: 3,
                color:  stripDrawMode === m.id ? "#e8a830" : "#6040a0",
                fontFamily: "IBM Plex Mono", fontSize: 9, letterSpacing: "0.12em",
                cursor: "pointer", textTransform: "uppercase",
              }}
            >{m.label}</button>
          ))}
          <span style={{ marginLeft: "auto", fontFamily: "IBM Plex Mono", fontSize: 8, color: "#4a2060" }}>
            mousedown + drag to draw · dbl-click to delete
          </span>
        </div>
      )}

      {/* Canvas + zoom controls wrapper */}
      <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H, background: "#000000", backgroundImage: "radial-gradient(circle, #111111 1px, transparent 1px)", backgroundSize: "24px 24px", borderRadius: isStripMode ? "0 0 6px 6px" : 6 }}>
        <Stage
          ref={stageRef}
          width={CANVAS_W}
          height={CANVAS_H}
          scaleX={transform.zoom}
          scaleY={transform.zoom}
          x={transform.x}
          y={transform.y}
          style={{ background: "transparent", borderRadius: isStripMode ? "0 0 6px 6px" : 6, cursor: stageCursor, display: "block" }}
          onWheel={handleWheel}
          onClick={handleStageClick}
          onMouseDown={handleStageMouseDown}
          onMouseMove={handleStageMouseMove}
          onMouseUp={handleStageMouseUp}
        >
          <Layer>

            {/* Floor plan image — object-fit contain, clipped to canvas */}
            {floorPlanImg && (() => {
              const fp = floorPlanDisplayRef.current
              const imgX     = fp ? fp.imgX     : (CANVAS_W / 2)
              const imgY     = fp ? fp.imgY     : (CANVAS_H / 2)
              const displayW = fp ? fp.displayW : 0
              const displayH = fp ? fp.displayH : 0
              return (
                <Group clipX={0} clipY={0} clipWidth={CANVAS_W} clipHeight={CANVAS_H} listening={false}>
                  <KonvaImage x={imgX} y={imgY} width={displayW} height={displayH} image={floorPlanImg} opacity={0.6} listening={false} />
                </Group>
              )
            })()}

            {/* ALL room boundaries — inactive rooms faint, active room bright */}
            {(allRooms ?? []).map(r => {
              if (!r.room) return null
              const isActive = r.id === activeRoomId
              const rX = r.roomOffsetX ?? ROOM_X
              const rY = r.roomOffsetY ?? ROOM_Y
              const rW   = Number(r.room.roomWidth  ?? 0)
              const rH   = Number(r.room.roomHeight ?? 0)
              const rpxW = r.drawnWidthPx  != null ? r.drawnWidthPx  : rW * SCALE
              const rpxH = r.drawnHeightPx != null ? r.drawnHeightPx : rH * SCALE

              return (
                <Group key={r.id}>
                  {/* Room fill — only for active room */}
                  {isActive && (
                    <Rect
                      name="room-fill"
                      x={rX} y={rY} width={rpxW} height={rpxH}
                      fill="rgba(255,255,255,0.025)"
                      onClick={isStripMode || floorPlan ? undefined : handleRoomClick}
                      listening={true}
                    />
                  )}

                  {/* Room border — bright cyan for active, faint dashed gray for inactive */}
                  <Rect
                    x={rX} y={rY} width={rpxW} height={rpxH}
                    stroke={isActive ? "#39c5cf" : "#2e2e2e"}
                    strokeWidth={isActive ? 2 : 1}
                    dash={isActive ? undefined : [5, 5]}
                    fill="transparent"
                    opacity={isActive ? 1 : 0.15}
                    cornerRadius={3}
                    listening={!isActive}
                    onClick={() => {
                      if (!isActive && !isStripMode) {
                        onSelectRoom?.(r.id)
                      }
                    }}
                  />

                  {/* Inner border — only for active room */}
                  {isActive && (
                    <Rect
                      x={rX + 4} y={rY + 4}
                      width={Math.max(0, rpxW - 8)}
                      height={Math.max(0, rpxH - 8)}
                      stroke="#00d4ff"
                      strokeWidth={1}
                      opacity={0.3}
                      fill="transparent"
                      cornerRadius={3}
                      listening={false}
                    />
                  )}

                  {/* Room name label */}
                  <Text
                    x={rX + 8}
                    y={rY - 16}
                    text={r.name ?? `Room ${r.id}`}
                    fontSize={isActive ? 11 : 9}
                    fontFamily="IBM Plex Mono"
                    fill={isActive ? "#39c5cf" : "#555"}
                    opacity={isActive ? 1 : 0.6}
                    fontStyle={isActive ? "bold" : "normal"}
                    listening={false}
                  />
                </Group>
              )
            })}

            {/* Heatmap — above room fill, below grid lines */}
            <HeatmapLayer />

            <GridLines />

            {/* Heatmap legend */}
            <HeatmapLegend />

            {/* Room label */}
            <Text x={ROOM_X} y={ROOM_Y - 22} text={`${(roomWidth/1000).toFixed(2)}m × ${(roomHeight/1000).toFixed(2)}m`} fill="#2d4f68" fontSize={12} fontFamily="IBM Plex Mono" listening={false} />

            {/* Lux + stats */}
            <Text x={CANVAS_W - 160} y={18}  text={lights.length === 0 ? "Lux: —" : `Lux: ${Math.round(lux)}`} fill={luxColor} fontSize={18} fontFamily="IBM Plex Mono" listening={false} />
            <Text x={CANVAS_W - 160} y={40}  text={`${lights.length} fixture${lights.length !== 1 ? "s" : ""}  ·  ${snapToGrid ? "snap on" : "snap off"}`} fill="#2d4f68" fontSize={10} fontFamily="IBM Plex Mono" listening={false} />
            <Text x={CANVAS_W - 160} y={56}  text={`RCR ${(rcr ?? 0).toFixed(2)}`}  fill="#4a7a96" fontSize={10} fontFamily="IBM Plex Mono" listening={false} />
            <Text x={CANVAS_W - 160} y={70}  text={`UF  ${(uf  ?? 0).toFixed(2)}`}  fill="#4a7a96" fontSize={10} fontFamily="IBM Plex Mono" listening={false} />
            {lights.length > 0 && (() => {
              const s = lux < targetLux * 0.8 ? { text: "UNDERLIT", fill: "#d94f4f" } : lux <= targetLux * 1.2 ? { text: "GOOD", fill: "#3dba74" } : { text: "OVERLIT", fill: "#e8a830" }
              return <Text x={CANVAS_W - 160} y={86} text={s.text} fill={s.fill} fontSize={10} fontFamily="IBM Plex Mono" listening={false} />
            })()}

            {/* Active mode indicator */}
            {indicatorText && (
              <Text x={CANVAS_W - 160} y={104} text={indicatorText} fill={STRIP_FILL} fontSize={9} fontFamily="IBM Plex Mono" listening={false} />
            )}
            {!isStripMode && activeTool !== "fixture" && (
              <Text x={CANVAS_W - 160} y={104} text={`placing: ${activeTool?.toUpperCase()}`}
                fill={
                  activeTool === "db"        ? "#e8a830"
                  : activeTool === "ctr"     ? "#39c5cf"
                  : activeTool === "emergency" ? "#3dba74"
                  : "#a78bfa"
                }
                fontSize={9} fontFamily="IBM Plex Mono" listening={false}
              />
            )}

            {/* Beam spread visualization (rendered below fixtures) */}
            <BeamSpreads />

            {/* Measurement lines — wall distances + nearest fixture spacing */}
            <MeasurementLines />

            {/* Placed fixtures */}
            {lights.map(light => {
              if (light.category !== "LED_STRIP") return <LightSymbol    key={light.id} light={light} />
              if (light.shape === "circle")        return <LedCircleStripSymbol  key={light.id} light={light} />
              if (light.shape === "freehand")      return <LedFreehandStripSymbol key={light.id} light={light} />
              return <LedStripSymbol key={light.id} light={light} />
            })}

            {/* Electrical markers */}
            {(dbMarkers  ?? []).map(m => <DBMarker  key={m.id} marker={m} />)}
            {(ctrMarkers ?? []).map(m => <CTRMarker key={m.id} marker={m} />)}
            {(jbMarkers  ?? []).map(m => <JBMarker  key={m.id} marker={m} />)}

            {/* Emergency fixtures */}
            {showEmergency && (emergencyLights ?? []).map(ef => <EmergencyFixture key={ef.id} ef={ef} />)}

          </Layer>

          {/* ── Room boundary draw preview — topmost layer so it's above floor plan ── */}
          <Layer listening={false} opacity={1}>
            {/* roomDraw boundary preview rendered as HTML div overlay — see below Stage */}

            {/* Line strip preview */}
            {isStripMode && stripDrawMode === "line" && stripDraw.drawing && (
              <>
                <Line points={[stripDraw.x1, stripDraw.y1, stripDraw.x2, stripDraw.y2]} stroke="#f0d0ff" strokeWidth={8} opacity={0.2} dash={[10, 6]} listening={false} />
                <Line points={[stripDraw.x1, stripDraw.y1, stripDraw.x2, stripDraw.y2]} stroke="#00d4ff" strokeWidth={2} opacity={1} dash={[10, 6]} listening={false} />
                <Circle x={stripDraw.x1} y={stripDraw.y1} radius={3} fill="#00d4ff" listening={false} />
                <Text x={stripDraw.x2 + 10} y={stripDraw.y2 - 10} text={`${previewLineLen.toFixed(2)}m`} fontSize={9} fontFamily="IBM Plex Mono" fill="#00d4ff" listening={false} />
              </>
            )}

            {/* Circle strip preview */}
            {isStripMode && stripDrawMode === "circle" && circleDraw.phase === "dragging" && previewCircleR > 2 && (
              <>
                <Arc x={circleDraw.cx} y={circleDraw.cy} innerRadius={Math.max(1, Math.abs(previewCircleR - 6))} outerRadius={Math.max(1, Math.abs(previewCircleR + 6))} angle={360} fill="#f0d0ff" opacity={0.2} listening={false} />
                <Arc x={circleDraw.cx} y={circleDraw.cy} innerRadius={Math.max(1, Math.abs(previewCircleR - 2))} outerRadius={Math.max(1, Math.abs(previewCircleR + 2))} angle={360} fill={STRIP_FILL} opacity={0.8} listening={false} />
                <Line points={[circleDraw.cx, circleDraw.cy, circleDraw.mx, circleDraw.my]} stroke={STRIP_FILL} strokeWidth={1} dash={[4, 4]} opacity={0.5} listening={false} />
                <Circle x={circleDraw.cx} y={circleDraw.cy} radius={3} fill={STRIP_FILL} listening={false} />
                <Text x={circleDraw.mx + 10} y={circleDraw.my - 10} text={`r=${(previewCircleR/(SCALE*1000)).toFixed(2)}m  ${previewCircleLen.toFixed(2)}m`} fontSize={9} fontFamily="IBM Plex Mono" fill={STRIP_FILL} listening={false} />
              </>
            )}

            {/* Freehand strip preview */}
            {isStripMode && stripDrawMode === "freehand" && freehandDraw.drawing && freehandDraw.points.length >= 4 && (
              <>
                <Line points={freehandDraw.points} stroke="#f0d0ff" strokeWidth={8} opacity={0.2} tension={0.5} lineCap="round" lineJoin="round" listening={false} />
                <Line points={freehandDraw.points} stroke={STRIP_FILL} strokeWidth={3} opacity={0.85} tension={0.5} lineCap="round" lineJoin="round" listening={false} />
              </>
            )}
          </Layer>
        </Stage>

        {/* Box select overlay */}
        {boxSelect.isDrawing && (
          <div style={{
            position: "absolute",
            left:   Math.min(boxSelect.startX, boxSelect.endX),
            top:    Math.min(boxSelect.startY, boxSelect.endY),
            width:  Math.abs(boxSelect.endX - boxSelect.startX),
            height: Math.abs(boxSelect.endY - boxSelect.startY),
            border: "1px solid #4a9fff",
            background: "rgba(74,159,255,0.08)",
            pointerEvents: "none",
          }} />
        )}

        {/* Zoom controls — HTML overlay top-right */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          display: "flex", alignItems: "center", gap: 4,
          zIndex: 10, pointerEvents: "all",
        }}>
          <span style={{
            fontFamily: "IBM Plex Mono", fontSize: 9, color: "#4a7a96",
            background: "rgba(10,16,24,0.85)", border: "1px solid #1a2b3c",
            borderRadius: 3, padding: "3px 7px", letterSpacing: "0.06em",
            minWidth: 42, textAlign: "center",
          }}>
            {Math.round(transform.zoom * 100)}%
          </span>
          <button onClick={zoomOut}   style={zoomBtnStyle}>−</button>
          <button onClick={zoomIn}    style={zoomBtnStyle}>+</button>
          <button onClick={zoomReset} style={{ ...zoomBtnStyle, color: "#39c5cf", border: "1px solid #1e4060" }}>RESET</button>
        </div>

        {/* Pan hint */}
        <div style={{
          position: "absolute", bottom: 8, right: 10,
          fontFamily: "IBM Plex Mono", fontSize: 8, color: "#1e3448",
          pointerEvents: "none", letterSpacing: "0.06em",
        }}>
          scroll to zoom · space+drag or middle-drag to pan · right-click fixture to edit
        </div>

        {/* Room draw preview — HTML div so it's immune to Stage zoom/pan transform */}
        {roomDraw.drawing && (
          <div style={{
            position: "absolute",
            left: Math.min(roomDraw.x1, roomDraw.x2),
            top: Math.min(roomDraw.y1, roomDraw.y2),
            width: Math.abs(roomDraw.x2 - roomDraw.x1),
            height: Math.abs(roomDraw.y2 - roomDraw.y1),
            border: "3px dashed #00ffff",
            backgroundColor: "rgba(0,212,255,0.08)",
            pointerEvents: "none",
            zIndex: 10,
            boxSizing: "border-box",
          }} />
        )}

        {/* Draw room instruction overlay */}
        {activeTool === "draw-room" && !roomSizePopup && (
          <div style={{
            position: "absolute", bottom: 36, left: "50%", transform: "translateX(-50%)",
            fontFamily: "IBM Plex Mono", fontSize: 10, color: "#a78bfa",
            background: "rgba(15,20,30,0.88)", border: "1px solid #a78bfa44",
            borderRadius: 4, padding: "6px 14px", pointerEvents: "none",
            letterSpacing: "0.06em", whiteSpace: "nowrap",
          }}>
            DRAW ROOM — click and drag on the floor plan to outline the room
          </div>
        )}

        {/* Room size input popup — appears after drawing rectangle */}
        {roomSizePopup && (() => {
          const container = stageRef.current?.container()?.getBoundingClientRect()
          const midSX = ((roomSizePopup.x1 + roomSizePopup.x2) / 2) * transform.zoom + transform.x + (container?.left ?? 0)
          const midSY = ((roomSizePopup.y1 + roomSizePopup.y2) / 2) * transform.zoom + transform.y + (container?.top  ?? 0)
          const px = Math.min(Math.max(midSX - 130, 10), window.innerWidth  - 280)
          const py = Math.min(Math.max(midSY - 100, 10), window.innerHeight - 180)
          const inputStyle = {
            width: "100%", background: "#0a1018", border: "1px solid #2d4f68",
            color: "#cdd9e5", fontFamily: "IBM Plex Mono", fontSize: 12,
            padding: "5px 8px", borderRadius: 3, outline: "none", boxSizing: "border-box",
          }
          return (
            <div
              onClick={e => e.stopPropagation()}
              style={{
                position: "fixed", left: px, top: py, width: 260,
                background: "rgba(15,20,30,0.97)", border: "1px solid #a78bfa",
                borderRadius: 6, zIndex: 300, padding: "14px",
                fontFamily: "IBM Plex Mono", boxShadow: "0 8px 32px rgba(0,0,0,0.7)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ color: "#a78bfa", fontSize: 9, letterSpacing: "0.14em" }}>
                  ROOM DIMENSIONS
                </div>
                <select
                  value={popupUnit}
                  onChange={e => {
                    const nu = e.target.value
                    setPopupUnit(nu)
                    try { localStorage.setItem(UNIT_KEY, nu) } catch {}
                  }}
                  style={{
                    background: "#222", border: "1px solid #2e2e2e", color: "#f0f0f0",
                    fontSize: 11, fontFamily: "IBM Plex Mono", padding: "2px 4px",
                    cursor: "pointer", borderRadius: 2, outline: "none",
                  }}
                >
                  {UNIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div>
                  <div style={{ color: "#4a7a96", fontSize: 8, marginBottom: 4 }}>Width ({popupUnit})</div>
                  <input
                    autoFocus
                    type="number" step="0.1" min="0.1"
                    value={roomSizePopup.wInput}
                    onChange={e => setRoomSizePopup(p => ({ ...p, wInput: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") confirmRoomSize(); if (e.key === "Escape") cancelRoomSize() }}
                    style={inputStyle}
                  />
                </div>
                <div>
                  <div style={{ color: "#4a7a96", fontSize: 8, marginBottom: 4 }}>Height ({popupUnit})</div>
                  <input
                    type="number" step="0.1" min="0.1"
                    value={roomSizePopup.hInput}
                    onChange={e => setRoomSizePopup(p => ({ ...p, hInput: e.target.value }))}
                    onKeyDown={e => { if (e.key === "Enter") confirmRoomSize(); if (e.key === "Escape") cancelRoomSize() }}
                    style={inputStyle}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button
                  onClick={confirmRoomSize}
                  style={{
                    flex: 1, padding: "5px 0", background: "#1a0a30", border: "1px solid #a78bfa",
                    borderRadius: 3, color: "#a78bfa", fontFamily: "IBM Plex Mono",
                    fontSize: 9, letterSpacing: "0.1em", cursor: "pointer",
                  }}
                >SET ROOM</button>
                <button
                  onClick={cancelRoomSize}
                  style={{
                    padding: "5px 10px", background: "transparent", border: "1px solid #1a2b3c",
                    borderRadius: 3, color: "#4a7a96", fontFamily: "IBM Plex Mono",
                    fontSize: 9, cursor: "pointer",
                  }}
                >CANCEL</button>
              </div>
            </div>
          )
        })()}
      </div>

    </div>
    {contextMenu.visible && createPortal(
      (() => {
        const menuW = 240, menuH = 380
        const cx = contextMenu.x + menuW > window.innerWidth  ? contextMenu.x - menuW : contextMenu.x
        const cy = contextMenu.y + menuH > window.innerHeight ? contextMenu.y - menuH : contextMenu.y
        return (
          <div
            ref={contextMenuRef}
            onMouseDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            style={{
              position: "fixed", left: cx, top: cy, width: menuW,
              background: CM.bg, border: `1px solid ${CM.border}`,
              borderRadius: 6, zIndex: 300,
              boxShadow: "0 8px 32px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,212,255,0.06)",
              fontFamily: "IBM Plex Mono",
            }}
          >
            {/* Header */}
            <div style={{ padding: "7px 12px", borderBottom: `1px solid #1a2b3c`,
              display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00d4ff", opacity: 0.7 }} />
              <span style={{ fontSize: 10, color: CM.value, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {contextMenu.lightLabel}
              </span>
            </div>

            {/* Protocol section */}
            <div style={{ padding: "8px 10px 4px" }}>
              <div style={{ fontSize: 8, color: CM.dim, letterSpacing: "0.14em", marginBottom: 5 }}>DIMMING PROTOCOL</div>
              {PROTOCOL_OPTIONS_CTX.map(p => (
                <CMOption key={p.value} value={p.value} current={contextMenu.protocol}
                  label={p.label} onChange={v => setContextMenu(m => ({ ...m, protocol: v }))} />
              ))}
            </div>

            <div style={{ height: 1, background: "#1a2b3c", margin: "4px 10px" }} />

            {/* CCT section */}
            <div style={{ padding: "8px 10px 4px" }}>
              <div style={{ fontSize: 8, color: CM.dim, letterSpacing: "0.14em", marginBottom: 5 }}>CCT / COLOR</div>
              {CCT_OPTIONS.map(o => (
                <CMOption key={o.value} value={o.value} current={contextMenu.cctType}
                  label={o.label} onChange={v => setContextMenu(m => ({ ...m, cctType: v }))} />
              ))}
            </div>

            <div style={{ height: 1, background: "#1a2b3c", margin: "4px 10px" }} />

            {/* Action buttons */}
            <div style={{ padding: "8px 10px", display: "flex", gap: 6 }}>
              <button
                onMouseDown={e => {
                  e.stopPropagation()
                  e.preventDefault()
                  if (contextMenu.lightId != null) {
                    onUpdateLight?.(contextMenu.lightId, { protocol: contextMenu.protocol, cctType: contextMenu.cctType })
                  }
                  setContextMenu(m => ({ ...m, visible: false }))
                }}
                style={{
                  flex: 1, padding: "5px 0", background: "#0e2a1e", border: "1px solid #3dba74",
                  borderRadius: 3, color: "#3dba74", fontFamily: "IBM Plex Mono",
                  fontSize: 9, letterSpacing: "0.1em", cursor: "pointer",
                }}
              >APPLY</button>
              <button
                onMouseDown={e => {
                  e.stopPropagation()
                  e.preventDefault()
                  applyContextMenuAll()
                }}
                onClick={e => { e.stopPropagation(); e.preventDefault(); applyContextMenuAll() }}
                style={{
                  flex: 1, padding: "5px 0", background: "#0a1a28", border: "1px solid #39c5cf",
                  borderRadius: 3, color: "#39c5cf", fontFamily: "IBM Plex Mono",
                  fontSize: 8, letterSpacing: "0.06em", cursor: "pointer",
                }}
              >ALL SAME TYPE</button>
            </div>

            {/* Delete */}
            <div style={{ borderTop: `1px solid #1a2b3c`, padding: "6px 10px" }}>
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); e.preventDefault(); deleteFromContext() }}
                style={{
                  width: "100%", padding: "4px 0", background: "transparent",
                  border: `1px solid #3a1010`, borderRadius: 3,
                  color: CM.red, fontFamily: "IBM Plex Mono", fontSize: 9,
                  letterSpacing: "0.1em", cursor: "pointer",
                }}
              >DELETE FIXTURE</button>
            </div>
          </div>
        )
      })(),
      document.body
    )}
    </>
  )
})

export default DesignCanvas
