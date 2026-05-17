import { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from "react"
import { createPortal } from "react-dom"
import { Stage, Layer, Rect, Text, Circle, Group, Line, Arc, Image as KonvaImage, RegularPolygon, Star, Wedge } from "react-konva"
import { toMM, fromMM, getStoredUnit, UNIT_OPTIONS, UNIT_KEY } from "../utils/units"
import { useToast } from "./Toast"
import { getLuxAtPoint } from "../utils/luxCalculator"
import { HEATMAP_STOPS } from "../utils/heatmapColors"

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
  "tunable":    { text: "TW",  color: "#4a9eff" },
  "rgbw":       { text: "RGB", color: "#e84080" },
  "dali-dt8":   { text: "DT8", color: "#e8a830" },
  "zigbee-cct": { text: "ZC",  color: "#4d9fff" },
}

const PROTO_BADGE_MAP = {
  "DALI":      { char: "D", color: "#e8a830" },
  "ZIGBEE":    { char: "Z", color: "#4a9eff" },
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
  heatmapCellSize = 8,
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
  activeFixture,
}, ref) {
  const toast = useToast()
  const stageRef = useRef(null)
  useImperativeHandle(ref, () => ({
    getStage: () => stageRef.current,
    getRoomBounds: () => ({
      x: ROOM_X,
      y: ROOM_Y,
      width: ROOM_PX_W,
      height: ROOM_PX_H,
    }),
  }))
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
  // Categories that are sold / specified per running metre
  const PER_METRE_CATEGORIES = ["LED_STRIP", "COVE_LIGHT"]
  const isStripMode = PER_METRE_CATEGORIES.includes(activeFixtureCategory)

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

  // ── Physics-based heatmap: real lux → color → smooth blur ────
  // Step 1: sample actual lux on a coarse grid (getLuxAtPoint = full IES physics)
  // Step 2: bilinear interpolate → every pixel gets a smooth lux value
  // Step 3: map lux ratio → HEATMAP_STOPS color (blue=dark, green=ok, yellow=target, red=over)
  // Step 4: draw to ImageData, then blur 10px on a second canvas for smooth radial look
  const heatmapImage = useMemo(() => {
    if (!showHeatmap || !(mountingHeight > 0) || lights.length === 0) return null

    const W = Math.ceil(ROOM_PX_W)
    const H = Math.ceil(ROOM_PX_H)
    const tLux = targetLux || 300
    const ceilH_mm = mountingHeight * 1000

    // Local pxToMm using actual room geometry (not static canvasConstants defaults)
    const localPxToMm = (px_x, px_y) => ({
      x: (px_x - ROOM_X) / SCALE,
      y: (px_y - ROOM_Y) / SCALE,
    })
    const roomGeomLocal = { pxToMm: localPxToMm }

    // ── Step 1: coarse lux grid ───────────────────────────────
    const STEP = 10  // px between samples — fast enough, fine enough
    const cols = Math.ceil(W / STEP) + 1
    const rows = Math.ceil(H / STEP) + 1
    const grid = new Float32Array(cols * rows)
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const px = ROOM_X + col * STEP
        const py = ROOM_Y + row * STEP
        let lux = 0
        for (const light of lights) {
          lux += getLuxAtPoint(light, px, py, ceilH_mm, roomGeomLocal)
        }
        grid[row * cols + col] = lux
      }
    }

    // ── Step 2+3: bilinear interpolate + color map ─────────────
    const imageData = new ImageData(W, H)
    const d = imageData.data
    for (let py = 0; py < H; py++) {
      for (let px = 0; px < W; px++) {
        const gx = px / STEP
        const gy = py / STEP
        const gx0 = Math.floor(gx), gx1 = Math.min(gx0 + 1, cols - 1)
        const gy0 = Math.floor(gy), gy1 = Math.min(gy0 + 1, rows - 1)
        const tx = gx - gx0, ty = gy - gy0

        const lux = (
          grid[gy0 * cols + gx0] * (1 - tx) * (1 - ty) +
          grid[gy0 * cols + gx1] *      tx  * (1 - ty) +
          grid[gy1 * cols + gx0] * (1 - tx) *      ty  +
          grid[gy1 * cols + gx1] *      tx  *      ty
        )

        if (lux < 1) continue  // leave fully transparent for dark zones

        // Interpolate color from HEATMAP_STOPS
        const ratio = Math.min(1.5, lux / tLux)
        let r = HEATMAP_STOPS[0][1][0]
        let g = HEATMAP_STOPS[0][1][1]
        let b = HEATMAP_STOPS[0][1][2]
        for (let i = 0; i < HEATMAP_STOPS.length - 1; i++) {
          const [r0, c0] = HEATMAP_STOPS[i]
          const [r1, c1] = HEATMAP_STOPS[i + 1]
          if (ratio <= r1) {
            const t = (ratio - r0) / (r1 - r0)
            r = Math.round(c0[0] + t * (c1[0] - c0[0]))
            g = Math.round(c0[1] + t * (c1[1] - c0[1]))
            b = Math.round(c0[2] + t * (c1[2] - c0[2]))
            break
          }
          r = HEATMAP_STOPS[HEATMAP_STOPS.length - 1][1][0]
          g = HEATMAP_STOPS[HEATMAP_STOPS.length - 1][1][1]
          b = HEATMAP_STOPS[HEATMAP_STOPS.length - 1][1][2]
        }

        // Alpha: ramp up quickly from 0 → 210 so dark areas stay transparent
        const alpha = ratio < 0.05 ? 0 : Math.min(210, Math.round((ratio / 1.5) * 210 + 80))

        const idx = (py * W + px) * 4
        d[idx]     = r
        d[idx + 1] = g
        d[idx + 2] = b
        d[idx + 3] = alpha
      }
    }

    // ── Step 4: put ImageData → blur on second canvas ──────────
    const sharp = document.createElement('canvas')
    sharp.width = W; sharp.height = H
    sharp.getContext('2d').putImageData(imageData, 0, 0)

    const blurred = document.createElement('canvas')
    blurred.width = W; blurred.height = H
    const bctx = blurred.getContext('2d')
    bctx.filter = 'blur(10px)'
    bctx.drawImage(sharp, 0, 0)
    bctx.filter = 'none'

    return blurred
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showHeatmap, lights, mountingHeight, SCALE, ROOM_X, ROOM_Y, ROOM_PX_W, ROOM_PX_H, targetLux])

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
    e.cancelBubble = true
    handleRoomClick(e)
  }

  // ── Regular fixture / marker click ───────────────────────────
  function handleRoomClick(e) {
    e.cancelBubble = true
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
      const inBox = (lights ?? []).filter(l => {
        // Point fixtures
        if (l.x != null && l.y != null && l.category !== "LED_STRIP")
          return l.x >= minX && l.x <= maxX && l.y >= minY && l.y <= maxY
        // LED strip — line: either endpoint inside box
        if (l.shape === "line")
          return (l.x1 >= minX && l.x1 <= maxX && l.y1 >= minY && l.y1 <= maxY) ||
                 (l.x2 >= minX && l.x2 <= maxX && l.y2 >= minY && l.y2 <= maxY)
        // LED strip — circle: centre point inside box
        if (l.shape === "circle")
          return l.cx >= minX && l.cx <= maxX && l.cy >= minY && l.cy <= maxY
        // LED strip — freehand: any sampled point inside box
        if (l.shape === "freehand" && Array.isArray(l.points)) {
          for (let i = 0; i < l.points.length - 1; i += 2) {
            if (l.points[i] >= minX && l.points[i] <= maxX && l.points[i+1] >= minY && l.points[i+1] <= maxY)
              return true
          }
        }
        return false
      })
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
    if (!showHeatmap || !heatmapImage) return null
    return (
      <KonvaImage
        image={heatmapImage}
        x={ROOM_X}
        y={ROOM_Y}
        width={ROOM_PX_W}
        height={ROOM_PX_H}
        opacity={0.70}
        listening={false}
      />
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
    // Match HEATMAP_STOPS exactly (top = hot/overlit, bottom = dark/zero)
    const gradStops = [
      0,    "rgb(255,30,30)",   // red   — 150%+ (overlit)
      0.25, "rgb(255,140,0)",   // orange — 100% (at target)
      0.4,  "rgb(255,220,0)",   // yellow — 75%
      0.55, "rgb(0,230,90)",    // green  — 50%
      0.75, "rgb(0,190,255)",   // cyan   — 25%
      1,    "rgb(0,50,200)",    // blue   — 0%
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
        <Rect x={lx} y={ly} width={W} height={H} stroke="#cccccc" strokeWidth={0.5} fill="transparent" />
        <Text x={lx} y={ly - 16} text="LUX" fontSize={8} fontFamily="Inter, sans-serif" fill="#999999" letterSpacing={1} />
        {labels.map(({ frac, text }) => (
          <Text
            key={frac}
            x={lx + W + 4}
            y={ly + frac * H - 5}
            text={text}
            fontSize={8}
            fontFamily="Inter, sans-serif"
            fill="#999999"
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

  function BeamLayer() {
    if (!showBeam || !(mountingHeight > 0) || lights.length === 0) return null

    const beams = lights
      .filter(light => light.category !== "LED_STRIP")
      .map(light => {
        const beamAngle = light.beamAngle ?? 36
        const beamRad   = (beamAngle * Math.PI) / 180 / 2

        // Center beam radius (standard cone projection)
        const spreadM  = mountingHeight * Math.tan(beamRad)
        const spreadPx = Math.max(1, spreadM * SCALE * 1000)

        // Field angle radius (1.8× wider for spill light)
        const fieldPx = spreadPx * 1.8

        // Color based on category
        const cat = (light.category ?? "").toUpperCase().replace(/_/g, "")
        const color =
          cat === "DOWNLIGHT" || cat === "COBDOWNLIGHT" ? "#ffe9a0" :
          cat === "SPOTLIGHT" || cat === "TRACKLIGHT"   ? "#ffd4a3" :
          cat === "PANEL"     || cat === "SURFACEPANEL" ? "#e8f4ff" :
          cat === "LINEAR"                              ? "#fff5e1" :
          cat === "WALLWASHER"                          ? "#ffe4b5" :
          cat === "PENDANT"   || cat === "CHANDELIER"   ? "#f8a8d4" :
          cat === "COVELIGHT" || cat === "ARCHITECTURAL"? "#a8f0f8" :
          cat === "HIGHBAY"   || cat === "INDUSTRIAL"   ? "#ffe4b5" :
          beamColor(light)

        return { x: light.x ?? 0, y: light.y ?? 0, spreadPx, fieldPx, color, id: light.id }
      })

    return (
      <Group listening={false}>
        {beams.map((beam, i) => (
          <Group key={beam.id ?? i} x={beam.x} y={beam.y}>
            {/* ZONE 1: Field Angle - Outer spill light (very dim) */}
            <Circle
              radius={beam.fieldPx}
              fill={beam.color}
              opacity={0.04}
              listening={false}
            />
            <Circle
              radius={beam.fieldPx}
              fill="transparent"
              stroke={beam.color}
              strokeWidth={1}
              opacity={0.08}
              listening={false}
            />

            {/* ZONE 2: Beam Angle - Inner core beam (brighter) */}
            <Circle
              radius={beam.spreadPx}
              fill={beam.color}
              opacity={0.12}
              listening={false}
            />
            <Circle
              radius={beam.spreadPx}
              fill="transparent"
              stroke={beam.color}
              strokeWidth={1.5}
              opacity={0.20}
              listening={false}
            />

            {/* ZONE 3: Center Hot Spot - Brightest point */}
            <Circle
              radius={beam.spreadPx * 0.15}
              fill="#ffffff"
              opacity={0.25}
              listening={false}
            />
          </Group>
        ))}
      </Group>
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
        <Line points={[fx, fy, rL, fy]} stroke="#4a9eff" strokeWidth={1} dash={[4, 4]} opacity={0.7} listening={false} />
        <MeasLabel x={rL + (fx - rL) / 2} y={fy - 9} text={fmtDist(fx - rL)} />
        {/* Right wall */}
        <Line points={[fx, fy, rR, fy]} stroke="#4a9eff" strokeWidth={1} dash={[4, 4]} opacity={0.7} listening={false} />
        <MeasLabel x={fx + (rR - fx) / 2} y={fy - 9} text={fmtDist(rR - fx)} />
        {/* Top wall */}
        <Line points={[fx, fy, fx, rT]} stroke="#4a9eff" strokeWidth={1} dash={[4, 4]} opacity={0.7} listening={false} />
        <MeasLabel x={fx + 24} y={rT + (fy - rT) / 2} text={fmtDist(fy - rT)} />
        {/* Bottom wall */}
        <Line points={[fx, fy, fx, rB]} stroke="#4a9eff" strokeWidth={1} dash={[4, 4]} opacity={0.7} listening={false} />
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

    const isSelected      = selectedLightIds?.includes(light.id) ?? false
    const isMultiSelected = false
    const fixtureColor    = light.fixtureColor ?? fill

    // Enhanced glow layers - multiple circles for richer effect
    const glowLayers = [
      { radius: r + 20, opacity: 0.03, color: "#ffb300" },  // Outermost - very subtle
      { radius: r + 14, opacity: 0.06, color: "#ffb300" },  // Outer glow
      { radius: r + 10, opacity: 0.12, color: "#ffc845" },  // Mid glow - brighter
      { radius: r + 6,  opacity: 0.20, color: "#ffd166" },  // Inner glow - vibrant
    ]

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

    return (
      <Group
        x={light.x}
        y={light.y}
        draggable
        onDragEnd={handleDragEnd}
        onContextMenu={handleContextMenu}
      >
        {/* Multi-layer glow effect - renders bottom to top */}
        {glowLayers.map((layer, idx) => (
          <Circle
            key={`glow-${idx}`}
            radius={layer.radius}
            fill={layer.color}
            opacity={layer.opacity}
            listening={false}
          />
        ))}

        {/* Selection ring (cyan) */}
        {isSelected && (
          <Circle
            radius={r + 6}
            fill="transparent"
            stroke="#4a9eff"
            strokeWidth={2}
            shadowColor="#4a9eff"
            shadowBlur={8}
            shadowOpacity={0.6}
            listening={false}
          />
        )}

        {/* Multi-select ring (light cyan) */}
        {isMultiSelected && !isSelected && (
          <Circle
            radius={r + 6}
            fill="transparent"
            stroke="#6ae5ff"
            strokeWidth={2}
            shadowColor="#6ae5ff"
            shadowBlur={6}
            shadowOpacity={0.5}
            listening={false}
          />
        )}

        {/* Hit target (invisible, for interactions) */}
        <Circle
          radius={r + 4}
          fill="transparent"
          listening={true}
          onMouseEnter={() => { setHoveredLightId(light.id); onHoverLight?.(light); document.body.style.cursor = "pointer" }}
          onMouseLeave={() => { setHoveredLightId(null); onHoverLight?.(null); document.body.style.cursor = "default" }}
          onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }}
          onContextMenu={handleContextMenu}
        />

        {/* Main fixture body */}
        {(() => {
          const shape          = light.fixtureShape ?? "circle"
          const bodyFill       = light.fixtureColor ?? fill
          const bodyStroke     = isSelected ? "#4a9eff" : stroke
          const bodyStrokeWidth = isSelected ? 2 : 1.5

          switch (shape) {
            case "circle":
              return (
                <Circle
                  radius={r}
                  fill={bodyFill}
                  stroke={bodyStroke}
                  strokeWidth={bodyStrokeWidth}
                  shadowColor={bodyFill}
                  shadowBlur={4}
                  shadowOpacity={0.3}
                  onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }}
                  onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }}
                  listening={true}
                />
              )

            case "square":
              return (
                <Rect
                  x={-r} y={-r} width={r * 2} height={r * 2}
                  fill={bodyFill}
                  stroke={bodyStroke}
                  strokeWidth={bodyStrokeWidth}
                  shadowColor={bodyFill}
                  shadowBlur={4}
                  shadowOpacity={0.3}
                  onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }}
                  onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }}
                  listening={true}
                />
              )

            case "rectangle":
              return (
                <Rect
                  x={-r * 1.4} y={-r * 0.7} width={r * 2.8} height={r * 1.4}
                  fill={bodyFill}
                  stroke={bodyStroke}
                  strokeWidth={bodyStrokeWidth}
                  shadowColor={bodyFill}
                  shadowBlur={4}
                  shadowOpacity={0.3}
                  onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }}
                  onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }}
                  listening={true}
                />
              )

            case "diamond":
              return <RegularPolygon sides={4} radius={r} rotation={45} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />

            case "triangle":
              return <RegularPolygon sides={3} radius={r} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />

            case "hexagon":
              return <RegularPolygon sides={6} radius={r} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />

            case "star":
              return <Star numPoints={5} innerRadius={r*0.4} outerRadius={r} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />

            case "star6":
              return <Star numPoints={6} innerRadius={r*0.42} outerRadius={r} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />

            case "flood":
              return <Wedge radius={r*1.3} angle={80} rotation={-40} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />

            case "cove":
              return <Rect x={-r*2.2} y={-r*0.3} width={r*4.4} height={r*0.6} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />

            case "cross":
              return (
                <>
                  <Rect x={-r} y={-r} width={r*2} height={r*2} fill="transparent" listening={true} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} />
                  <Line points={[-r, 0, r, 0]} stroke={bodyStroke} strokeWidth={1.5} listening={false} />
                  <Line points={[0, -r, 0, r]} stroke={bodyStroke} strokeWidth={1.5} listening={false} />
                </>
              )

            case "pendant":
              return (
                <>
                  <Line points={[0, -r*2.4, 0, -r]} stroke={bodyStroke} strokeWidth={1.5} listening={false} />
                  <Circle radius={r} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />
                </>
              )

            case "track":
              return (
                <>
                  <Rect x={-r*2} y={-r*0.45} width={r*4} height={r*0.9} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />
                  <Circle radius={r*0.55} fill={stroke} stroke="transparent" strokeWidth={0} listening={false} />
                </>
              )

            // ── Octagon — UFO high bay, canopy lights ─────────────
            case "octagon":
              return <RegularPolygon sides={8} radius={r} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={5} shadowOpacity={0.35} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />

            // ── Ring — inground uplights (annular shape) ──────────
            case "ring":
              return (
                <>
                  {/* Outer disc */}
                  <Circle radius={r} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={5} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />
                  {/* Inner hole — canvas dark bg */}
                  <Circle radius={r * 0.42} fill="#1a1a1a" listening={false} />
                  {/* Inner ring edge */}
                  <Circle radius={r * 0.42} fill="transparent" stroke={bodyStroke} strokeWidth={1} opacity={0.5} listening={false} />
                </>
              )

            // ── Semicircle — wall sconce / bracket ───────────────
            case "semicircle":
              return (
                <>
                  {/* Hit target */}
                  <Rect x={-r} y={-r} width={r*2} height={r} fill="transparent" listening={true} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} />
                  {/* Flat base (wall) */}
                  <Line points={[-r, 0, r, 0]} stroke={bodyStroke} strokeWidth={2.5} listening={false} />
                  {/* Arc half-dome */}
                  <Arc innerRadius={0} outerRadius={r} angle={180} rotation={180} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={5} shadowOpacity={0.3} listening={false} />
                </>
              )

            // ── Pill / capsule — rigid LED bar ────────────────────
            case "pill":
              return (
                <>
                  <Rect x={-r*1.8} y={-r*0.38} width={r*3.6} height={r*0.76} cornerRadius={r*0.38} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />
                </>
              )

            // ── Cross-dot — emergency / exit fixtures ────────────
            case "cross-dot":
              return (
                <>
                  <Circle radius={r} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />
                  <Line points={[-r*0.55, 0, r*0.55, 0]} stroke={bodyStroke} strokeWidth={2} listening={false} />
                  <Line points={[0, -r*0.55, 0, r*0.55]} stroke={bodyStroke} strokeWidth={2} listening={false} />
                </>
              )

            // ── Spike — garden / spike light ─────────────────────
            case "spike":
              return (
                <>
                  {/* Ground plate */}
                  <Rect x={-r*0.7} y={r*0.2} width={r*1.4} height={r*0.35} cornerRadius={2} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={3} shadowOpacity={0.2} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />
                  {/* Lamp head */}
                  <RegularPolygon sides={3} radius={r * 0.7} rotation={0} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={5} shadowOpacity={0.4} listening={false} />
                  {/* Spike stem */}
                  <Line points={[0, r*0.55, 0, r*0.9]} stroke={bodyStroke} strokeWidth={2} listening={false} />
                </>
              )

            // ── Double-ring — floodlight / projector ─────────────
            case "floodlight":
              return (
                <>
                  {/* Outer body disc */}
                  <Circle radius={r} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={6} shadowOpacity={0.35} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />
                  {/* Inner ring */}
                  <Circle radius={r * 0.55} fill="transparent" stroke={bodyStroke} strokeWidth={1.5} opacity={0.6} listening={false} />
                  {/* Aim dot */}
                  <Circle radius={r * 0.18} fill={bodyStroke} opacity={0.8} listening={false} />
                </>
              )

            // ── Street-light head (cobra-arm silhouette) ─────────
            case "streetlight":
              return (
                <>
                  {/* Horizontal arm */}
                  <Rect x={-r*1.4} y={-r*0.18} width={r*2.8} height={r*0.36} cornerRadius={r*0.18} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.25} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />
                  {/* Lamp housing - wider flat disc on right */}
                  <Circle x={r*0.9} y={0} radius={r*0.45} fill={bodyStroke} opacity={0.55} listening={false} />
                </>
              )

            // ── Panel with grid detail ───────────────────────────
            case "panel-grid":
              return (
                <>
                  <Rect x={-r} y={-r} width={r*2} height={r*2} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />
                  {/* Inner grid lines */}
                  <Line points={[0, -r+2, 0, r-2]} stroke={bodyStroke} strokeWidth={0.8} opacity={0.5} listening={false} />
                  <Line points={[-r+2, 0, r-2, 0]} stroke={bodyStroke} strokeWidth={0.8} opacity={0.5} listening={false} />
                </>
              )

            // ── Gimbal ring — adjustable downlight ───────────────
            case "gimbal":
              return (
                <>
                  {/* Outer ring */}
                  <Circle radius={r} fill="transparent" stroke={bodyStroke} strokeWidth={2} shadowColor={bodyFill} shadowBlur={4} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />
                  {/* Filled inner lamp offset to show tilt */}
                  <Circle x={r*0.22} y={r*0.1} radius={r*0.58} fill={bodyFill} stroke={bodyStroke} strokeWidth={1} listening={false} />
                </>
              )

            // ── Chandelier — multi-arm ────────────────────────────
            case "chandelier":
              return (
                <>
                  {/* Suspension rod */}
                  <Line points={[0, -r*2, 0, -r*0.8]} stroke={bodyStroke} strokeWidth={1.5} listening={false} />
                  {/* Central body */}
                  <Circle radius={r*0.6} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={5} shadowOpacity={0.3} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />
                  {/* 6 arms */}
                  {[0,60,120,180,240,300].map(deg => {
                    const rad = deg * Math.PI / 180
                    return <Line key={deg} points={[Math.cos(rad)*r*0.6, Math.sin(rad)*r*0.6, Math.cos(rad)*r, Math.sin(rad)*r]} stroke={bodyStroke} strokeWidth={1.2} listening={false} />
                  })}
                  {/* 6 tip dots */}
                  {[0,60,120,180,240,300].map(deg => {
                    const rad = deg * Math.PI / 180
                    return <Circle key={`dot-${deg}`} x={Math.cos(rad)*r} y={Math.sin(rad)*r} radius={r*0.18} fill={bodyStroke} listening={false} />
                  })}
                </>
              )

            // ── Cove slot — very thin rect with end caps ──────────
            case "cove-slot":
              return (
                <>
                  <Rect x={-r*2.6} y={-r*0.22} width={r*5.2} height={r*0.44} cornerRadius={r*0.22} fill={bodyFill} stroke={bodyStroke} strokeWidth={bodyStrokeWidth} shadowColor={bodyFill} shadowBlur={5} shadowOpacity={0.35} onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }} onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }} listening={true} />
                </>
              )

            default:
              return (
                <Circle
                  radius={r}
                  fill={bodyFill}
                  stroke={bodyStroke}
                  strokeWidth={bodyStrokeWidth}
                  shadowColor={bodyFill}
                  shadowBlur={4}
                  shadowOpacity={0.3}
                  onClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onSelectLight?.(light, e.evt.ctrlKey) }}
                  onDblClick={(e) => { e.cancelBubble = true; e.evt.stopPropagation(); onDeleteLight?.(light.id) }}
                  listening={true}
                />
              )
          }
        })()}

        {/* Center dot */}
        <Circle radius={1.5} fill={stroke} listening={false} />

        {/* Protocol badge (DALI, 0-10V, etc.) */}
        {light.protocol && light.protocol !== "NON-DIM" && light.protocol !== "Room Default" && (() => {
          const badge = PROTO_BADGE_MAP[light.protocol]
          if (!badge) return null
          return (
            <Text text={badge.char} fontSize={6} fontFamily="IBM Plex Mono" fontStyle="bold"
              fill={badge.color} x={-3} y={r + 3} listening={false} />
          )
        })()}

        {/* CCT badge */}
        {light.cctType && light.cctType !== "single" && (() => {
          const badge = CCT_BADGE_MAP[light.cctType]
          if (!badge) return null
          return (
            <Text text={badge.text} fontSize={6} fontFamily="IBM Plex Mono" fontStyle="bold"
              fill={badge.color} x={-7} y={r + 3} listening={false} />
          )
        })()}

        {/* DALI address badge */}
        {daliAddresses?.byId?.[light.id] && (() => {
          const daliEntry = daliAddresses.byId[light.id]
          return (
            <>
              <Rect x={-12} y={r + 10} width={24} height={12}
                fill="#001a2e" stroke="#4a9eff" strokeWidth={0.5} cornerRadius={2} listening={false} />
              <Text x={-12} y={r + 11} width={24} text={`D:${daliEntry.address}`}
                fontSize={7} fontFamily="IBM Plex Mono" fill="#4a9eff" align="center" listening={false} />
            </>
          )
        })()}
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

    const isSelected = selectedLightIds?.includes(light.id)

    return (
      <Group x={0} y={0} draggable onDragEnd={handleDragEnd}>
        <Line points={[x1, y1, x2, y2]} stroke={fill} strokeWidth={8} opacity={0.3} listening={false} />
        <Line
          points={[x1, y1, x2, y2]}
          stroke={isSelected ? "#4a9eff" : fill}
          strokeWidth={isSelected ? 5 : 4}
          onClick={(e) => { e.cancelBubble = true; onSelectLight?.(light, e.evt.ctrlKey) }}
          onDblClick={(e) => { e.evt.stopPropagation(); onDeleteLight?.(light.id) }}
        />
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

    const isSelected = selectedLightIds?.includes(light.id)

    return (
      <Group x={0} y={0} draggable onDragEnd={handleDragEnd}>
        <Arc x={cx} y={cy} innerRadius={Math.max(1, Math.abs(safeRadius - 6))} outerRadius={Math.max(1, Math.abs(safeRadius + 6))} angle={arcDeg} rotation={startDeg} fill={fill} opacity={0.3} closed={false} listening={false} />
        <Arc
          x={cx} y={cy}
          innerRadius={Math.max(1, Math.abs(safeRadius - 3))}
          outerRadius={Math.max(1, Math.abs(safeRadius + 3))}
          angle={arcDeg} rotation={startDeg}
          fill={isSelected ? "#4a9eff" : fill}
          closed={false}
          onClick={(e) => { e.cancelBubble = true; onSelectLight?.(light, e.evt.ctrlKey) }}
          onDblClick={(e) => { e.evt.stopPropagation(); onDeleteLight?.(light.id) }}
        />
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

    const isSelected = selectedLightIds?.includes(light.id)

    return (
      <Group x={0} y={0} draggable onDragEnd={handleDragEnd}>
        <Line points={points} stroke={fill} strokeWidth={8} opacity={0.3} tension={0.5} lineCap="round" lineJoin="round" listening={false} />
        <Line
          points={points}
          stroke={isSelected ? "#4a9eff" : fill}
          strokeWidth={isSelected ? 5 : 4}
          tension={0.5} lineCap="round" lineJoin="round"
          onClick={(e) => { e.cancelBubble = true; onSelectLight?.(light, e.evt.ctrlKey) }}
          onDblClick={(e) => { e.evt.stopPropagation(); onDeleteLight?.(light.id) }}
        />
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
        <Rect x={-S} y={-S} width={S * 2} height={S * 2} fill="rgba(212,168,67,0.12)" stroke="#d4a843" strokeWidth={1.5} onDblClick={() => onDeleteMarker("db", marker.id)} />
        <Text text="DB" fontSize={8} fontFamily="Inter, sans-serif" fill="#d4a843" offsetX={6} offsetY={4} listening={false} />
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
        <Circle radius={R} fill="rgba(74,158,255,0.1)" stroke="#4a9eff" strokeWidth={1.5} onDblClick={() => onDeleteMarker("ctr", marker.id)} />
        <Line points={[-R + 3, 0, R - 3, 0]} stroke="#4a9eff" strokeWidth={1} listening={false} />
        <Line points={[0, -R + 3, 0, R - 3]} stroke="#4a9eff" strokeWidth={1} listening={false} />
        <Text text="CTR" fontSize={6} fontFamily="Inter, sans-serif" fill="#4a9eff" offsetX={7} offsetY={3} listening={false} />
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
        <Line points={[0, -S, S, 0, 0, S, -S, 0]} closed fill="rgba(167,139,250,0.1)" stroke="#a78bfa" strokeWidth={1.5} onDblClick={() => onDeleteMarker("jb", marker.id)} />
        <Text text="JB" fontSize={7} fontFamily="Inter, sans-serif" fill="#a78bfa" offsetX={5} offsetY={3.5} listening={false} />
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
    : lux < 500         ? "#4a9eff"
    :                     "#e8a830"

  const MODES = [
    { id: "line",     label: "— LINE"     },
    { id: "circle",   label: "○ CIRCLE"   },
    { id: "freehand", label: "~ FREEHAND" },
  ]

  const isPlacementTool = activeTool === "fixture" || activeTool === "draw-room" || activeTool === "emergency"
  const stageCursor = panning ? "grabbing" : (spaceDown.current ? "grab" : (isPlacementTool ? "crosshair" : "default"))

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
    border: "#4a9eff",
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
          display: "flex", alignItems: "center", gap: 8,
          padding: "8px 14px", background: "#0d0820",
          borderBottom: "2px solid #3a1a6a",
          width: CANVAS_W, boxSizing: "border-box",
        }}>
          <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: "#9060d0", letterSpacing: "0.1em", marginRight: 8, textTransform: "uppercase", fontWeight: 700 }}>
            {activeFixtureCategory === "COVE_LIGHT" ? "Cove Light" : "LED Strip"}
          </span>
          {MODES.map(m => (
            <button
              key={m.id}
              onClick={() => setStripDrawMode(m.id)}
              style={{
                padding: "5px 14px",
                background: stripDrawMode === m.id ? "#2a1060" : "transparent",
                border:     `1px solid ${stripDrawMode === m.id ? "#9060d0" : "#3a2a5a"}`,
                borderRadius: 4,
                color:  stripDrawMode === m.id ? "#c090ff" : "#6040a0",
                fontFamily: "IBM Plex Mono", fontSize: 10, letterSpacing: "0.1em",
                cursor: "pointer", textTransform: "uppercase",
              }}
            >{m.label}</button>
          ))}
          <span style={{ marginLeft: "auto", fontFamily: "IBM Plex Mono", fontSize: 10, color: "#6040a0" }}>
            drag to draw · length auto-calculated · W/m scales with drawn length
          </span>
        </div>
      )}

      {/* Canvas + zoom controls wrapper */}
      <div style={{ position: "relative", width: CANVAS_W, height: CANVAS_H, background: "#1a1a1a", backgroundImage: "radial-gradient(circle, #2a2a2a 1px, transparent 1px)", backgroundSize: "24px 24px", borderRadius: isStripMode ? "0 0 6px 6px" : 6 }}>
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
                      fill="rgba(212,168,67,0.03)"
                      onClick={isStripMode || floorPlan ? undefined : handleRoomClick}
                      listening={!floorPlan}
                    />
                  )}

                  {/* Room border — gold for active, faint dashed gray for inactive */}
                  <Rect
                    x={rX} y={rY} width={rpxW} height={rpxH}
                    stroke={isActive ? "#999999" : "#cccccc"}
                    strokeWidth={isActive ? 2 : 1}
                    dash={isActive ? undefined : [6, 4]}
                    fill="transparent"
                    opacity={isActive ? 1 : 0.5}
                    cornerRadius={3}
                    listening={!isActive}
                    onClick={() => {
                      if (!isActive && !isStripMode && activeTool === "select") {
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
                      stroke="#4a9eff"
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
                    fill={isActive ? "#4a9eff" : "#555"}
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
            <Text x={ROOM_X} y={ROOM_Y - 22} text={`${(roomWidth/1000).toFixed(2)}m × ${(roomHeight/1000).toFixed(2)}m`} fill="#999999" fontSize={12} fontFamily="Inter, sans-serif" listening={false} />

            {/* Lux + stats */}
            <Text x={CANVAS_W - 160} y={18}  text={lights.length === 0 ? "Lux: —" : `Lux: ${Math.round(lux)}`} fill={luxColor} fontSize={18} fontFamily="IBM Plex Mono" listening={false} />
            <Text x={CANVAS_W - 160} y={40}  text={`${lights.length} fixture${lights.length !== 1 ? "s" : ""}  ·  ${snapToGrid ? "snap on" : "snap off"}`} fill="#bbbbbb" fontSize={10} fontFamily="Inter, sans-serif" listening={false} />
            <Text x={CANVAS_W - 160} y={56}  text={`RCR ${(rcr ?? 0).toFixed(2)}`}  fill="#aaaaaa" fontSize={10} fontFamily="Inter, sans-serif" listening={false} />
            <Text x={CANVAS_W - 160} y={70}  text={`UF  ${(uf  ?? 0).toFixed(2)}`}  fill="#aaaaaa" fontSize={10} fontFamily="Inter, sans-serif" listening={false} />
            {lights.length > 0 && (() => {
              const s = lux < targetLux * 0.8 ? { text: "UNDERLIT", fill: "#d94f4f" } : lux <= targetLux * 1.2 ? { text: "GOOD", fill: "#3dba74" } : { text: "OVERLIT", fill: "#e8a830" }
              return <Text x={CANVAS_W - 160} y={86} text={s.text} fill={s.fill} fontSize={10} fontFamily="Inter, sans-serif" listening={false} />
            })()}

            {/* Active mode indicator */}
            {indicatorText && (
              <Text x={CANVAS_W - 160} y={104} text={indicatorText} fill={STRIP_FILL} fontSize={9} fontFamily="Inter, sans-serif" listening={false} />
            )}
            {!isStripMode && activeTool !== "fixture" && (
              <Text x={CANVAS_W - 160} y={104} text={`placing: ${activeTool?.toUpperCase()}`}
                fill={
                  activeTool === "db"        ? "#e8a830"
                  : activeTool === "ctr"     ? "#4a9eff"
                  : activeTool === "emergency" ? "#3dba74"
                  : "#a78bfa"
                }
                fontSize={9} fontFamily="Inter, sans-serif" listening={false}
              />
            )}

            {/* Beam spread visualization (rendered below fixtures) */}
            <BeamLayer />

            {/* Measurement lines — wall distances + nearest fixture spacing */}
            <MeasurementLines />

            {/* Placed fixtures */}
            {lights.map(light => {
              if (!PER_METRE_CATEGORIES.includes(light.category)) return <LightSymbol key={light.id} light={light} />
              if (light.shape === "circle")   return <LedCircleStripSymbol   key={light.id} light={light} />
              if (light.shape === "freehand") return <LedFreehandStripSymbol key={light.id} light={light} />
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
                <Line points={[stripDraw.x1, stripDraw.y1, stripDraw.x2, stripDraw.y2]} stroke="#4a9eff" strokeWidth={2} opacity={1} dash={[10, 6]} listening={false} />
                <Circle x={stripDraw.x1} y={stripDraw.y1} radius={3} fill="#4a9eff" listening={false} />
                <Text x={stripDraw.x2 + 10} y={stripDraw.y2 - 18} text={`${previewLineLen.toFixed(2)} m`} fontSize={14} fontFamily="IBM Plex Mono" fill="#ffffff" fontStyle="bold" listening={false} />
                <Text x={stripDraw.x2 + 10} y={stripDraw.y2 - 2} text={`${Math.round((activeFixture?.wattPerMtr ?? 0) * previewLineLen)}W · ${Math.round((activeFixture?.lumensPerMtr ?? 0) * previewLineLen)}lm`} fontSize={9} fontFamily="IBM Plex Mono" fill="#c090ff" listening={false} />
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
          <button onClick={zoomReset} style={{ ...zoomBtnStyle, color: "#4a9eff", border: "1px solid #1e4060" }}>RESET</button>
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
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4a9eff", opacity: 0.7 }} />
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
                  flex: 1, padding: "5px 0", background: "#0a1a28", border: "1px solid #4a9eff",
                  borderRadius: 3, color: "#4a9eff", fontFamily: "IBM Plex Mono",
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
