import { useRef } from 'react'
import { Stage, Layer, Rect, Line, Text, Group, Arrow, Circle } from 'react-konva'

// ─────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────
const CANVAS_W = 1000
const CANVAS_H = 700

// Room dimensions in real-world units (mm)
const ROOM_W_MM = 6000   // 6 m
const ROOM_H_MM = 4000   // 4 m

// Scale: pixels per millimetre
// Fit room into ~640×420 of the 1000×700 canvas (leaves margin for labels)
const SCALE = Math.min(
  (CANVAS_W - 260) / ROOM_W_MM,
  (CANVAS_H - 220) / ROOM_H_MM,
)

// Room pixel dimensions
const ROOM_PX_W = ROOM_W_MM * SCALE
const ROOM_PX_H = ROOM_H_MM * SCALE

// Room origin — centred on canvas, shifted slightly left for right-side panel space
const ROOM_X = Math.round((CANVAS_W - ROOM_PX_W) / 2) - 20
const ROOM_Y = Math.round((CANVAS_H - ROOM_PX_H) / 2) + 10

// Grid cell in mm (500 mm = 0.5 m squares)
const GRID_STEP_MM   = 500
const GRID_STEP_PX   = GRID_STEP_MM * SCALE

// ─────────────────────────────────────────────────────────────
// THEME COLOURS  (matches index.css tokens, duplicated here
// because Konva draws to Canvas API — CSS variables don't apply)
// ─────────────────────────────────────────────────────────────
const C = {
  bgVoid:        '#090c10',
  bgCanvas:      '#0d1117',
  gridMinor:     '#111923',
  gridMajor:     '#151f2c',
  roomFill:      '#0e1929',
  roomStroke:    '#2e7aad',
  roomGlow:      '#1a4060',
  cornerMark:    '#39c5cf',
  dimLine:       '#2d4f68',
  dimArrow:      '#3a6b8a',
  dimText:       '#5a8fad',
  dimTextBright: '#7db8d4',
  labelBg:       '#111d28',
  labelText:     '#cdd9e5',
  labelMuted:    '#4a7a96',
  axisText:      '#2a4a5e',
  tickMark:      '#1e3448',
  statusGreen:   '#3dba74',
  statusDot:     '#2a9457',
}

// ─────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────

/** Background grid — two passes: minor (500mm) and major (1000mm) */
function BackgroundGrid() {
  const minorLines = []
  const majorLines = []

  // Vertical lines across full canvas
  for (let x = 0; x <= CANVAS_W; x += GRID_STEP_PX / 2) {
    const isMajor = Math.abs(x % GRID_STEP_PX) < 0.5
    ;(isMajor ? majorLines : minorLines).push(
      <Line key={`v-${x}`} points={[x, 0, x, CANVAS_H]}
        stroke={isMajor ? C.gridMajor : C.gridMinor}
        strokeWidth={isMajor ? 0.75 : 0.4} />
    )
  }

  // Horizontal lines across full canvas
  for (let y = 0; y <= CANVAS_H; y += GRID_STEP_PX / 2) {
    const isMajor = Math.abs(y % GRID_STEP_PX) < 0.5
    ;(isMajor ? majorLines : minorLines).push(
      <Line key={`h-${y}`} points={[0, y, CANVAS_W, y]}
        stroke={isMajor ? C.gridMajor : C.gridMinor}
        strokeWidth={isMajor ? 0.75 : 0.4} />
    )
  }

  return <Group>{minorLines}{majorLines}</Group>
}

/** Ruler ticks along top and left edges */
function RulerTicks() {
  const ticks = []
  const TICK_H = 6
  const FONT   = { fontSize: 8, fontFamily: 'IBM Plex Mono', fill: C.axisText }

  // Top ruler — marks every 0.5 m starting from room origin
  for (let m = 0; m <= ROOM_W_MM; m += GRID_STEP_MM) {
    const px = ROOM_X + m * SCALE
    ticks.push(
      <Line key={`rt-${m}`}
        points={[px, ROOM_Y - 8, px, ROOM_Y - 8 + TICK_H]}
        stroke={C.tickMark} strokeWidth={1} />,
      <Text key={`rl-${m}`}
        x={px - 10} y={ROOM_Y - 24}
        text={`${(m / 1000).toFixed(1)}m`}
        width={20} align='center'
        {...FONT} />
    )
  }

  // Left ruler — marks every 0.5 m
  for (let m = 0; m <= ROOM_H_MM; m += GRID_STEP_MM) {
    const py = ROOM_Y + m * SCALE
    ticks.push(
      <Line key={`lt-${m}`}
        points={[ROOM_X - 8, py, ROOM_X - 8 + TICK_H, py]}
        stroke={C.tickMark} strokeWidth={1} />,
      <Text key={`ll-${m}`}
        x={ROOM_X - 38} y={py - 5}
        text={`${(m / 1000).toFixed(1)}m`}
        width={28} align='right'
        {...FONT} />
    )
  }

  return <Group>{ticks}</Group>
}

/** Corner accent marks — small L-shaped brackets at room corners */
function CornerMarks() {
  const SIZE = 14
  const STROKE = { stroke: C.cornerMark, strokeWidth: 1.5 }
  const corners = [
    // [cx, cy, hDir, vDir]  +1 = inward from that corner
    [ROOM_X,           ROOM_Y,            1,  1],
    [ROOM_X + ROOM_PX_W, ROOM_Y,          -1,  1],
    [ROOM_X,           ROOM_Y + ROOM_PX_H, 1, -1],
    [ROOM_X + ROOM_PX_W, ROOM_Y + ROOM_PX_H, -1, -1],
  ]

  return (
    <Group>
      {corners.map(([cx, cy, hd, vd], i) => (
        <Group key={i}>
          <Line points={[cx, cy, cx + hd * SIZE, cy]} {...STROKE} />
          <Line points={[cx, cy, cx, cy + vd * SIZE]} {...STROKE} />
        </Group>
      ))}
    </Group>
  )
}

/** Dimension arrows — width (top) and height (right) */
function DimensionLines() {
  const OFFSET    = 32   // px offset from room edge
  const FONT_DIM  = { fontSize: 11, fontFamily: 'IBM Plex Mono', fill: C.dimTextBright, fontStyle: '500' }
  const FONT_UNIT = { fontSize: 9,  fontFamily: 'IBM Plex Mono', fill: C.dimText }

  // Width arrow — above room
  const wY   = ROOM_Y - OFFSET
  const wMid = ROOM_X + ROOM_PX_W / 2

  // Height arrow — right of room
  const hX   = ROOM_X + ROOM_PX_W + OFFSET
  const hMid = ROOM_Y + ROOM_PX_H / 2

  const ARROW_PROPS = {
    fill: C.dimArrow,
    stroke: C.dimLine,
    strokeWidth: 1,
    pointerLength: 6,
    pointerWidth:  4,
  }

  return (
    <Group>
      {/* Dimension extension lines */}
      <Line points={[ROOM_X, ROOM_Y, ROOM_X, wY - 4]}
        stroke={C.dimLine} strokeWidth={0.75} dash={[3, 4]} />
      <Line points={[ROOM_X + ROOM_PX_W, ROOM_Y, ROOM_X + ROOM_PX_W, wY - 4]}
        stroke={C.dimLine} strokeWidth={0.75} dash={[3, 4]} />
      <Line points={[ROOM_X + ROOM_PX_W, ROOM_Y, hX + 4, ROOM_Y]}
        stroke={C.dimLine} strokeWidth={0.75} dash={[3, 4]} />
      <Line points={[ROOM_X + ROOM_PX_W, ROOM_Y + ROOM_PX_H, hX + 4, ROOM_Y + ROOM_PX_H]}
        stroke={C.dimLine} strokeWidth={0.75} dash={[3, 4]} />

      {/* Width dimension — bidirectional arrow above */}
      <Arrow points={[wMid, wY, ROOM_X + 2, wY]} {...ARROW_PROPS} />
      <Arrow points={[wMid, wY, ROOM_X + ROOM_PX_W - 2, wY]} {...ARROW_PROPS} />
      <Line points={[ROOM_X + 2, wY, ROOM_X + ROOM_PX_W - 2, wY]}
        stroke={C.dimLine} strokeWidth={1} />

      {/* Width label */}
      <Rect x={wMid - 26} y={wY - 18} width={52} height={16}
        fill={C.labelBg} cornerRadius={2} />
      <Text x={wMid - 24} y={wY - 15} text="6000" width={28} align='right'
        {...FONT_DIM} />
      <Text x={wMid + 6} y={wY - 14} text="mm" {...FONT_UNIT} />

      {/* Height dimension — bidirectional arrow right */}
      <Arrow points={[hX, hMid, hX, ROOM_Y + 2]} {...ARROW_PROPS} />
      <Arrow points={[hX, hMid, hX, ROOM_Y + ROOM_PX_H - 2]} {...ARROW_PROPS} />
      <Line points={[hX, ROOM_Y + 2, hX, ROOM_Y + ROOM_PX_H - 2]}
        stroke={C.dimLine} strokeWidth={1} />

      {/* Height label */}
      <Rect x={hX + 8} y={hMid - 8} width={52} height={16}
        fill={C.labelBg} cornerRadius={2} />
      <Text x={hX + 10} y={hMid - 5} text="4000" width={28} align='left'
        {...FONT_DIM} />
      <Text x={hX + 40} y={hMid - 4} text="mm" {...FONT_UNIT} />
    </Group>
  )
}

/** Room geometry — fill, glow shadow, stroke outline */
function RoomGeometry() {
  return (
    <Group>
      {/* Outer glow — soft shadow rect, slightly larger */}
      <Rect
        x={ROOM_X - 3} y={ROOM_Y - 3}
        width={ROOM_PX_W + 6} height={ROOM_PX_H + 6}
        fill='transparent'
        stroke={C.roomGlow}
        strokeWidth={6}
        cornerRadius={1}
        opacity={0.4}
      />
      {/* Room fill */}
      <Rect
        x={ROOM_X} y={ROOM_Y}
        width={ROOM_PX_W} height={ROOM_PX_H}
        fill={C.roomFill}
      />
      {/* Room boundary */}
      <Rect
        x={ROOM_X} y={ROOM_Y}
        width={ROOM_PX_W} height={ROOM_PX_H}
        fill='transparent'
        stroke={C.roomStroke}
        strokeWidth={1.5}
      />
    </Group>
  )
}

/** Internal grid lines within the room only */
function RoomGrid() {
  const lines = []

  // Vertical interior lines
  for (let m = GRID_STEP_MM; m < ROOM_W_MM; m += GRID_STEP_MM) {
    const x = ROOM_X + m * SCALE
    lines.push(
      <Line key={`rv-${m}`}
        points={[x, ROOM_Y + 1, x, ROOM_Y + ROOM_PX_H - 1]}
        stroke='#111e2c' strokeWidth={0.6} />
    )
  }

  // Horizontal interior lines
  for (let m = GRID_STEP_MM; m < ROOM_H_MM; m += GRID_STEP_MM) {
    const y = ROOM_Y + m * SCALE
    lines.push(
      <Line key={`rh-${m}`}
        points={[ROOM_X + 1, y, ROOM_X + ROOM_PX_W - 1, y]}
        stroke='#111e2c' strokeWidth={0.6} />
    )
  }

  return <Group>{lines}</Group>
}

/** Room label and metadata text */
function RoomLabel() {
  const cx = ROOM_X + ROOM_PX_W / 2
  const cy = ROOM_Y + ROOM_PX_H / 2

  return (
    <Group>
      {/* Room name */}
      <Text
        x={cx - 80} y={cy - 28}
        text='ROOM 01'
        width={160} align='center'
        fontSize={13} fontFamily='IBM Plex Mono'
        fill='#1e3d56' fontStyle='500'
        letterSpacing={3}
      />
      {/* Area */}
      <Text
        x={cx - 60} y={cy - 10}
        text='24.00 m²'
        width={120} align='center'
        fontSize={18} fontFamily='IBM Plex Mono'
        fill='#1e4868' fontStyle='400'
      />
      {/* Dimensions */}
      <Text
        x={cx - 60} y={cy + 14}
        text='6.0 × 4.0 m'
        width={120} align='center'
        fontSize={10} fontFamily='IBM Plex Mono'
        fill='#183548'
        letterSpacing={1}
      />
    </Group>
  )
}

// ─────────────────────────────────────────────────────────────
// LUX DISPLAY — top-right corner of canvas
// ─────────────────────────────────────────────────────────────
function LuxDisplay({ lux, count }) {
  const PAD_R  = 16
  const PAD_T  = 14
  const W      = 148
  const H      = 64
  const x      = CANVAS_W - W - PAD_R
  const y      = PAD_T

  // Colour band: uncalculated → dim | good range → cyan | overlit → amber
  const luxColor =
    count === 0   ? '#2d4f68'
    : lux < 150   ? '#d94f4f'   // underlit
    : lux < 500   ? '#39c5cf'   // good
    :               '#e8a830'   // overlit

  const luxLabel = count === 0 ? '—' : `${Math.round(lux)}`

  return (
    <Group listening={false}>
      {/* Panel background */}
      <Rect
        x={x} y={y} width={W} height={H}
        fill='#0a1018'
        stroke='#1a2b3c'
        strokeWidth={1}
        cornerRadius={3}
      />
      {/* Accent left border */}
      <Rect
        x={x} y={y} width={2} height={H}
        fill={luxColor}
        cornerRadius={[3, 0, 0, 3]}
        opacity={0.85}
      />
      {/* Label */}
      <Text
        x={x + 12} y={y + 10}
        text='CALCULATED LUX'
        fontSize={7.5}
        fontFamily='IBM Plex Mono'
        fill='#2d4f68'
        letterSpacing={1.8}
      />
      {/* Value */}
      <Text
        x={x + 10} y={y + 22}
        text={luxLabel}
        fontSize={22}
        fontFamily='IBM Plex Mono'
        fontStyle='500'
        fill={luxColor}
        width={80}
      />
      {/* Unit */}
      <Text
        x={x + 10} y={y + 47}
        text='lux  ·  lm / m²'
        fontSize={8}
        fontFamily='IBM Plex Mono'
        fill='#1e3448'
        letterSpacing={0.8}
      />
      {/* Fixture count sub-label */}
      <Text
        x={x + W - 48} y={y + 22}
        text={`${count}`}
        fontSize={18}
        fontFamily='IBM Plex Mono'
        fill='#1e3d56'
        width={36}
        align='right'
      />
      <Text
        x={x + W - 48} y={y + 42}
        text='lights'
        fontSize={8}
        fontFamily='IBM Plex Mono'
        fill='#1a3448'
        width={36}
        align='right'
      />
    </Group>
  )
}

// ─────────────────────────────────────────────────────────────
// LIGHT SYMBOL — draggable downlight on canvas
// Group is positioned at light.x/y; all children render at 0,0
// so e.target.x()/y() on dragEnd gives the new world position.
// ─────────────────────────────────────────────────────────────
function LightSymbol({ light, onMoveLight }) {
  function handleDragEnd(e) {
    // Clamp final position inside room bounds (fixture radius = 6px)
    const PAD = 6
    const newX = Math.min(Math.max(e.target.x(), ROOM_X + PAD), ROOM_X + ROOM_PX_W - PAD)
    const newY = Math.min(Math.max(e.target.y(), ROOM_Y + PAD), ROOM_Y + ROOM_PX_H - PAD)

    // Snap node back if clamping moved it
    e.target.x(newX)
    e.target.y(newY)

    onMoveLight?.(light.id, newX, newY)
  }

  return (
    <Group
      x={light.x}
      y={light.y}
      draggable
      onDragEnd={handleDragEnd}
    >
      {/* Soft glow halo */}
      <Circle radius={14} fill='rgba(255,179,0,0.06)' listening={false} />
      {/* Hit area — slightly larger than visible body, catches edge drags */}
      <Circle radius={10} fill='transparent' />
      {/* Body */}
      <Circle
        radius={6}
        fill='#ffe9b0'
        stroke='#ffb300'
        strokeWidth={1.5}
      />
      {/* Centre dot */}
      <Circle radius={1.5} fill='#ffb300' listening={false} />
    </Group>
  )
}

// ─────────────────────────────────────────────────────────────
// MAIN EXPORT
// ─────────────────────────────────────────────────────────────
export default function DesignCanvas({ lights = [], onAddLight, onMoveLight, lux = 0 }) {
  const stageRef = useRef(null)

  function handleStageClick(e) {
    // Ignore clicks that bubbled up from a draggable light symbol
    if (e.target !== e.target.getStage()) return

    const stage = e.target.getStage()
    const pos   = stage.getPointerPosition()
    if (!pos) return

    // Hit-test: is the click inside the room rectangle?
    const inside =
      pos.x >= ROOM_X &&
      pos.x <= ROOM_X + ROOM_PX_W &&
      pos.y >= ROOM_Y &&
      pos.y <= ROOM_Y + ROOM_PX_H

    if (inside) {
      onAddLight?.({ id: Date.now(), x: pos.x, y: pos.y, lumens: 900 })
    }
  }

  return (
    <div style={{
      display: 'inline-block',
      border: '1px solid #1a2b3c',
      borderRadius: 4,
      overflow: 'hidden',
      boxShadow: '0 0 0 1px #0e1a24, 0 20px 60px rgba(0,0,0,0.6)',
      cursor: 'crosshair',
    }}>
      <Stage
        ref={stageRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{ background: C.bgCanvas, display: 'block' }}
        onClick={handleStageClick}
      >
        {/* Layer 1 — background grid */}
        <Layer listening={false}>
          <BackgroundGrid />
        </Layer>

        {/* Layer 2 — room geometry */}
        <Layer listening={false}>
          <RoomGeometry />
          <RoomGrid />
          <RoomLabel />
          <CornerMarks />
        </Layer>

        {/* Layer 3 — annotations */}
        <Layer listening={false}>
          <RulerTicks />
          <DimensionLines />
        </Layer>

        {/* Layer 4 — placed lights (needs events for drag) */}
        <Layer>
          {lights.map(light => (
            <LightSymbol key={light.id} light={light} onMoveLight={onMoveLight} />
          ))}
        </Layer>

        {/* Layer 5 — HUD overlays (lux display) */}
        <Layer listening={false}>
          <LuxDisplay lux={lux} count={lights.length} />
        </Layer>
      </Stage>
    </div>
  )
}
    