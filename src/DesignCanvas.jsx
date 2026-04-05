import { useRef, useMemo } from 'react'
import { Stage, Layer, Rect, Line, Text, Group, Arrow, Circle, RegularPolygon, Star } from 'react-konva'
import BeamVisualization from './components/BeamVisualization'
import LuxHeatMap from './components/LuxHeatMap'
import { computeRoomGeometry } from './utils/canvasConstants'

const CANVAS_W = 1000
const CANVAS_H = 700

const C = {
  bgVoid:        '#060a0e',
  bgCanvas:      '#0d1117',
  gridMinor:     '#111a25',
  gridMajor:     '#1a2b3c',
  roomFill:      '#0e1e30',
  roomStroke:    '#00e5ff',
  roomGlow:      '#003a4a',
  cornerMark:    '#00e5ff',
  dimLine:       '#1e3a4a',
  dimArrow:      '#2a5a6a',
  dimText:       '#2d4f68',
  dimTextBright: '#3a7a8e',
  labelBg:       '#0a1520',
  labelText:     '#cdd9e5',
  labelMuted:    '#4a7a96',
  axisText:      '#2d4f68',
  tickMark:      '#1a2b3c',
  statusGreen:   '#3dba74',
  statusDot:     '#2a9457',
}

// ── Sub-components — all receive geometry object `g` ─────────────────────────

function BackgroundGrid({ g, gridSize }) {
  const minorStep = (gridSize * g.scale) / 2
  const majorStep = gridSize * g.scale
  const minorLines = [], majorLines = []

  for (let x = 0; x <= CANVAS_W; x += minorStep) {
    const isMajor = majorStep > 0 && Math.abs(x % majorStep) < 0.5
    ;(isMajor ? majorLines : minorLines).push(
      <Line key={`v-${x}`} points={[x, 0, x, CANVAS_H]}
        stroke={isMajor ? C.gridMajor : C.gridMinor}
        strokeWidth={isMajor ? 0.75 : 0.4} />
    )
  }
  for (let y = 0; y <= CANVAS_H; y += minorStep) {
    const isMajor = majorStep > 0 && Math.abs(y % majorStep) < 0.5
    ;(isMajor ? majorLines : minorLines).push(
      <Line key={`h-${y}`} points={[0, y, CANVAS_W, y]}
        stroke={isMajor ? C.gridMajor : C.gridMinor}
        strokeWidth={isMajor ? 0.75 : 0.4} />
    )
  }
  return <Group>{minorLines}{majorLines}</Group>
}

function RulerTicks({ g, gridSize }) {
  const { roomX, roomY, scale, roomW_mm, roomH_mm } = g
  const ticks = []
  const TICK_H = 6
  const FONT = { fontSize: 8, fontFamily: 'IBM Plex Mono', fill: C.axisText }

  for (let m = 0; m <= roomW_mm; m += gridSize) {
    const px = roomX + m * scale
    ticks.push(
      <Line key={`rt-${m}`} points={[px, roomY - 8, px, roomY - 8 + TICK_H]} stroke={C.tickMark} strokeWidth={1} />,
      <Text key={`rl-${m}`} x={px - 10} y={roomY - 24} text={`${(m / 1000).toFixed(1)}m`}
        width={20} align='center' {...FONT} />
    )
  }
  for (let m = 0; m <= roomH_mm; m += gridSize) {
    const py = roomY + m * scale
    ticks.push(
      <Line key={`lt-${m}`} points={[roomX - 8, py, roomX - 8 + TICK_H, py]} stroke={C.tickMark} strokeWidth={1} />,
      <Text key={`ll-${m}`} x={roomX - 38} y={py - 5} text={`${(m / 1000).toFixed(1)}m`}
        width={28} align='right' {...FONT} />
    )
  }
  return <Group>{ticks}</Group>
}

function CornerMarks({ g }) {
  const { roomX, roomY, roomPxW, roomPxH } = g
  const SIZE = 14
  const STROKE = { stroke: C.cornerMark, strokeWidth: 1.5 }
  const corners = [
    [roomX,            roomY,             1,  1],
    [roomX + roomPxW,  roomY,            -1,  1],
    [roomX,            roomY + roomPxH,   1, -1],
    [roomX + roomPxW,  roomY + roomPxH,  -1, -1],
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

function DimensionLines({ g }) {
  const { roomX, roomY, roomPxW, roomPxH, roomW_mm, roomH_mm } = g
  const OFFSET    = 32
  const FONT_DIM  = { fontSize: 11, fontFamily: 'IBM Plex Mono', fill: C.dimTextBright, fontStyle: '500' }
  const FONT_UNIT = { fontSize: 9,  fontFamily: 'IBM Plex Mono', fill: C.dimText }

  const wY   = roomY - OFFSET
  const wMid = roomX + roomPxW / 2
  const hX   = roomX + roomPxW + OFFSET
  const hMid = roomY + roomPxH / 2

  const ARROW_PROPS = { fill: C.dimArrow, stroke: C.dimLine, strokeWidth: 1, pointerLength: 6, pointerWidth: 4 }

  const wLabel = Math.round(roomW_mm).toString()
  const hLabel = Math.round(roomH_mm).toString()

  return (
    <Group>
      <Line points={[roomX, roomY, roomX, wY - 4]} stroke={C.dimLine} strokeWidth={0.75} dash={[3, 4]} />
      <Line points={[roomX + roomPxW, roomY, roomX + roomPxW, wY - 4]} stroke={C.dimLine} strokeWidth={0.75} dash={[3, 4]} />
      <Line points={[roomX + roomPxW, roomY, hX + 4, roomY]} stroke={C.dimLine} strokeWidth={0.75} dash={[3, 4]} />
      <Line points={[roomX + roomPxW, roomY + roomPxH, hX + 4, roomY + roomPxH]} stroke={C.dimLine} strokeWidth={0.75} dash={[3, 4]} />

      <Arrow points={[wMid, wY, roomX + 2, wY]} {...ARROW_PROPS} />
      <Arrow points={[wMid, wY, roomX + roomPxW - 2, wY]} {...ARROW_PROPS} />
      <Line points={[roomX + 2, wY, roomX + roomPxW - 2, wY]} stroke={C.dimLine} strokeWidth={1} />
      <Rect x={wMid - 30} y={wY - 18} width={60} height={16} fill={C.labelBg} cornerRadius={2} />
      <Text x={wMid - 28} y={wY - 15} text={wLabel} width={34} align='right' {...FONT_DIM} />
      <Text x={wMid + 8}  y={wY - 14} text="mm" {...FONT_UNIT} />

      <Arrow points={[hX, hMid, hX, roomY + 2]} {...ARROW_PROPS} />
      <Arrow points={[hX, hMid, hX, roomY + roomPxH - 2]} {...ARROW_PROPS} />
      <Line points={[hX, roomY + 2, hX, roomY + roomPxH - 2]} stroke={C.dimLine} strokeWidth={1} />
      <Rect x={hX + 8} y={hMid - 8} width={60} height={16} fill={C.labelBg} cornerRadius={2} />
      <Text x={hX + 10} y={hMid - 5} text={hLabel} width={34} align='left' {...FONT_DIM} />
      <Text x={hX + 46} y={hMid - 4} text="mm" {...FONT_UNIT} />
    </Group>
  )
}

function RoomGeometry({ g }) {
  const { roomX, roomY, roomPxW, roomPxH } = g
  return (
    <Group>
      <Rect x={roomX - 3} y={roomY - 3} width={roomPxW + 6} height={roomPxH + 6}
        fill='transparent' stroke={C.roomGlow} strokeWidth={6} cornerRadius={1} opacity={0.4} />
      <Rect x={roomX} y={roomY} width={roomPxW} height={roomPxH} fill={C.roomFill} />
      <Rect x={roomX} y={roomY} width={roomPxW} height={roomPxH}
        fill='transparent' stroke={C.roomStroke} strokeWidth={1.5} />
    </Group>
  )
}

function RoomGrid({ g, gridSize }) {
  const { roomX, roomY, roomPxW, roomPxH, scale, roomW_mm, roomH_mm } = g
  const lines = []

  for (let m = gridSize; m < roomW_mm; m += gridSize) {
    const x = roomX + m * scale
    lines.push(<Line key={`rv-${m}`} points={[x, roomY + 1, x, roomY + roomPxH - 1]} stroke='#111e2c' strokeWidth={0.6} />)
  }
  for (let m = gridSize; m < roomH_mm; m += gridSize) {
    const y = roomY + m * scale
    lines.push(<Line key={`rh-${m}`} points={[roomX + 1, y, roomX + roomPxW - 1, y]} stroke='#111e2c' strokeWidth={0.6} />)
  }
  return <Group>{lines}</Group>
}

function RoomLabel({ g }) {
  const { roomX, roomY, roomPxW, roomPxH, roomW_mm, roomH_mm } = g
  const cx     = roomX + roomPxW / 2
  const cy     = roomY + roomPxH / 2
  const areaM2 = (roomW_mm / 1000 * roomH_mm / 1000).toFixed(2)
  const dimText = `${(roomW_mm / 1000).toFixed(1)} × ${(roomH_mm / 1000).toFixed(1)} m`

  return (
    <Group>
      <Text x={cx - 80} y={cy - 28} text='ROOM 01' width={160} align='center'
        fontSize={13} fontFamily='IBM Plex Mono' fill='#1e3d56' fontStyle='500' letterSpacing={3} />
      <Text x={cx - 60} y={cy - 10} text={`${areaM2} m²`} width={120} align='center'
        fontSize={18} fontFamily='IBM Plex Mono' fill='#1e4868' />
      <Text x={cx - 60} y={cy + 14} text={dimText} width={120} align='center'
        fontSize={10} fontFamily='IBM Plex Mono' fill='#183548' letterSpacing={1} />
    </Group>
  )
}

// ── FixtureShape — IDENTICAL to current version ───────────────────────────────

function FixtureShape({ fixture, isSelected, isMultiSelected, onFixtureDrag }) {
  const shape   = fixture.shape || 'circle'
  const fill    = fixture.wattageColor?.hex || (fixture.daliAddress ? '#6ae5ff' : '#e8a245')
  const stroke  = isMultiSelected ? '#6ae5ff' : isSelected ? '#d4a843' : 'rgba(255,255,255,0.55)'
  const sw      = (isSelected || isMultiSelected) ? 3 : 1.5

  const symbol    = fixture.shapeSymbol || ''
  const colorName = fixture.wattageColor?.name || ''
  const wattLabel = fixture.wattage ? `${fixture.wattage}W` : ''
  const catLabel  = fixture.category || fixture.type || ''
  const label     = [symbol, colorName ? `(${colorName})` : '', wattLabel, catLabel].filter(Boolean).join(' ')

  const common = { fill, stroke, strokeWidth: sw }

  const selRing = isMultiSelected
    ? <Circle x={0} y={0} radius={20} stroke='#6ae5ff' strokeWidth={1.5} fill='rgba(106,229,255,0.06)' />
    : isSelected
      ? <Circle x={0} y={0} radius={20} stroke='#d4a843' strokeWidth={1} fill='transparent' />
      : null

  let shapeEl
  switch (shape) {
    case 'star':         shapeEl = <Star x={0} y={0} numPoints={5} innerRadius={4} outerRadius={9} rotation={-18} {...common} />; break
    case 'diamond':      shapeEl = <Rect x={0} y={0} width={14} height={14} offsetX={7} offsetY={7} rotation={45} {...common} />; break
    case 'rectangle':    shapeEl = <Rect x={0} y={0} width={22} height={13} offsetX={11} offsetY={6.5} {...common} />; break
    case 'circle-dot':
      shapeEl = <Group><Circle x={0} y={0} radius={9} {...common} /><Circle x={0} y={0} radius={3} fill={stroke} stroke='transparent' strokeWidth={0} /></Group>
      break
    case 'line':         shapeEl = <Rect x={0} y={0} width={22} height={4} offsetX={11} offsetY={2} {...common} />; break
    case 'triangle-left': shapeEl = <RegularPolygon x={0} y={0} sides={3} radius={9} rotation={-90} {...common} />; break
    case 'double-arrow':
      shapeEl = <Group><RegularPolygon x={-7} y={0} sides={3} radius={8} rotation={-90} {...common} /><RegularPolygon x={7} y={0} sides={3} radius={8} rotation={90} {...common} /></Group>
      break
    case 'triangle-up':  shapeEl = <RegularPolygon x={0} y={0} sides={3} radius={9} rotation={0} {...common} />; break
    case 'triangle-down': shapeEl = <RegularPolygon x={0} y={0} sides={3} radius={9} rotation={180} {...common} />; break
    case 'small-square': shapeEl = <Rect x={0} y={0} width={10} height={10} offsetX={5} offsetY={5} {...common} />; break
    case 'big-circle':   shapeEl = <Circle x={0} y={0} radius={12} {...common} />; break
    case 'circle-cross':
      shapeEl = <Group><Circle x={0} y={0} radius={9} fill='transparent' stroke={fill} strokeWidth={sw} /><Line points={[-9, 0, 9, 0]} stroke={fill} strokeWidth={sw} /><Line points={[0, -9, 0, 9]} stroke={fill} strokeWidth={sw} /></Group>
      break
    case 'thick-line':   shapeEl = <Rect x={0} y={0} width={26} height={5} offsetX={13} offsetY={2.5} {...common} />; break
    case 'circle':
    default:             shapeEl = <Circle x={0} y={0} radius={8} {...common} />; break
  }

  return (
    <Group
      x={fixture.position.x}
      y={fixture.position.y}
      draggable={!!onFixtureDrag}
      onDragEnd={onFixtureDrag ? (e) => onFixtureDrag(fixture.id, { x: e.target.x(), y: e.target.y() }) : undefined}
    >
      {selRing}
      {shapeEl}
      {label && (
        <Text x={-50} y={18} width={100} align='center' text={label}
          fontSize={7} fontFamily='IBM Plex Mono' fill='#8abfd4' />
      )}
    </Group>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function DesignCanvas({
  onCanvasClick,
  onFixtureDrag,
  placementMode,
  fixtures = [],
  selectedFixtureId,
  multiSelectedIds = [],
  showBeams    = false,
  showHeatMap  = false,
  ceilingHeight = 2700,
  roomWidth    = 6000,
  roomLength   = 4000,
  gridSize     = 500,
  cellSize     = 8,
}) {
  const stageRef = useRef(null)

  // Compute room geometry whenever room dimensions change
  const g = useMemo(() => computeRoomGeometry(roomWidth, roomLength), [roomWidth, roomLength])

  const handleStageClick = (e) => {
    const stage = stageRef.current
    if (!stage) return
    const pos = stage.getPointerPosition()
    if (!pos) return
    const ctrlKey = e.evt.ctrlKey || e.evt.metaKey

    let clickedFixtureId = null
    for (const fixture of fixtures) {
      const dx = pos.x - fixture.position.x
      const dy = pos.y - fixture.position.y
      if (Math.sqrt(dx * dx + dy * dy) < 10) { clickedFixtureId = fixture.id; break }
    }
    if (onCanvasClick) onCanvasClick(pos.x, pos.y, clickedFixtureId, ctrlKey)
  }

  return (
    <div style={{
      display: 'inline-block', border: '1px solid #1a2b3c', borderRadius: 4, overflow: 'hidden',
      boxShadow: '0 0 0 1px #0e1a24, 0 20px 60px rgba(0,0,0,0.6)',
      cursor: placementMode ? 'crosshair' : 'default',
    }}>
      <Stage ref={stageRef} width={CANVAS_W} height={CANVAS_H}
        style={{ background: C.bgCanvas, display: 'block' }} onClick={handleStageClick}>

        {/* Layer 1 — background + room + heat map */}
        <Layer listening={false}>
          <Group name="grid"><BackgroundGrid g={g} gridSize={gridSize} /></Group>
          <Group name="room">
            <RoomGeometry g={g} />
            <RoomGrid g={g} gridSize={gridSize} />
            <RoomLabel g={g} />
            <CornerMarks g={g} />
          </Group>
          {showHeatMap && (
            <Group name="heatmap">
              <LuxHeatMap fixtures={fixtures} ceilingHeight={ceilingHeight} roomGeom={g} cellSize={cellSize} />
            </Group>
          )}
        </Layer>

        {/* Layer 2 — beams + fixtures */}
        <Layer listening={true}>
          {showBeams && (
            <Group name="beams" listening={false}>
              <BeamVisualization fixtures={fixtures} ceilingHeight={ceilingHeight} roomGeom={g} />
            </Group>
          )}
          <Group name="fixtures">
            {fixtures.map((fixture) => (
              <FixtureShape
                key={fixture.id}
                fixture={fixture}
                isSelected={selectedFixtureId === fixture.id}
                isMultiSelected={multiSelectedIds.includes(fixture.id)}
                onFixtureDrag={onFixtureDrag}
              />
            ))}
          </Group>
        </Layer>

        {/* Layer 3 — UI / annotations */}
        <Layer listening={false}>
          <Group name="annotations">
            <RulerTicks g={g} gridSize={gridSize} />
            <DimensionLines g={g} />
          </Group>
        </Layer>

      </Stage>
    </div>
  )
}
