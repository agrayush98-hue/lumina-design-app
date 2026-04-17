import { useMemo, useRef, useEffect } from 'react'
import Konva from 'konva'
import { Group, Rect, Text, Line, Image } from 'react-konva'
import { getTotalLuxAtPoint } from '../utils/luxCalculator'

const HEATMAP_STOPS = [
  [0.00, [0,   0, 170]],
  [0.25, [0, 170, 255]],
  [0.50, [0, 204,  68]],
  [0.75, [255, 238,  0]],
  [1.00, [255, 136,  0]],
  [1.50, [255,   0,  0]],
]

function luxToColor(lux, targetLux) {
  if (targetLux <= 0) return 'rgba(0,0,170,0)'
  const ratio = Math.min(1.5, lux / targetLux)
  for (let i = 0; i < HEATMAP_STOPS.length - 1; i++) {
    const [r0, c0] = HEATMAP_STOPS[i]
    const [r1, c1] = HEATMAP_STOPS[i + 1]
    if (ratio <= r1) {
      const t = (ratio - r0) / (r1 - r0)
      const r = Math.round(c0[0] + t * (c1[0] - c0[0]))
      const g = Math.round(c0[1] + t * (c1[1] - c0[1]))
      const b = Math.round(c0[2] + t * (c1[2] - c0[2]))
      const alpha = ratio < 0.05 ? 0 : 0.85
      return `rgba(${r},${g},${b},${alpha})`
    }
  }
  return 'rgba(255,0,0,0.85)'
}

function LuxLegend({ x, y, targetLux }) {
  const W = 18
  const H = 150
  const labels = ['150%', '100%', '75%', '50%', '25%', '0%']
  const ratios = [1.5, 1.0, 0.75, 0.5, 0.25, 0.0]
  const gradStops = []
  for (let i = 0; i <= 20; i++) {
    const t = i / 20
    const ratio = 1.5 * (1 - t)
    const color = luxToColor(ratio * targetLux, targetLux)
    gradStops.push(t, color)
  }
  return (
    <Group>
      <Text x={x} y={y - 18} text="LUX" fontSize={8} fontFamily="IBM Plex Mono" fill="#4a7a96" letterSpacing={1} />
      <Rect x={x} y={y} width={W} height={H}
        fillLinearGradientStartPoint={{ x: 0, y: 0 }}
        fillLinearGradientEndPoint={{ x: 0, y: H }}
        fillLinearGradientColorStops={gradStops}
        stroke="#1a2b3c" strokeWidth={0.5}
      />
      {labels.map((label, i) => {
        const ly = y + (i / (labels.length - 1)) * H
        const lux = Math.round(ratios[i] * targetLux)
        return (
          <Group key={i}>
            <Line points={[x + W, ly, x + W + 4, ly]} stroke="#4a7a96" strokeWidth={0.5} />
            <Text x={x + W + 6} y={ly - 4} text={`${lux}`} fontSize={7} fontFamily="IBM Plex Mono" fill="#4a7a96" />
          </Group>
        )
      })}
    </Group>
  )
}

function SmoothHeatmap({ cells, roomX, roomY, roomPxW, roomPxH, step, opacity }) {
  const imageRef = useRef(null)
  const heatImage = useMemo(() => {
    if (cells.length === 0) return null
    const cols = Math.ceil(roomPxW / step)
    const rows = Math.ceil(roomPxH / step)
    const canvas = document.createElement('canvas')
    canvas.width = cols
    canvas.height = rows
    const ctx = canvas.getContext('2d')
    for (let i = 0; i < cells.length; i++) {
      const col = Math.floor((cells[i].x - roomX) / step)
      const row = Math.floor((cells[i].y - roomY) / step)
      ctx.fillStyle = cells[i].color
      ctx.fillRect(col, row, 1, 1)
    }
    return canvas
  }, [cells, roomX, roomY, roomPxW, roomPxH, step])

  useEffect(() => {
    if (imageRef.current) {
      imageRef.current.cache()
    }
  }, [heatImage])

  if (!heatImage) return null
  return (
    <Image
      ref={imageRef}
      image={heatImage}
      x={roomX} y={roomY}
      width={Math.round(roomPxW)} height={Math.round(roomPxH)}
      opacity={opacity}
      listening={false}
      filters={[Konva.Filters.Blur]}
      blurRadius={15}
    />
  )
}

export default function LuxHeatMap({ fixtures = [], ceilingHeight = 2700, roomGeom = null, targetLux = 500, cellSize = 8, opacity = 0.4 }) {
  const roomX   = roomGeom ? roomGeom.roomX   : 120
  const roomY   = roomGeom ? roomGeom.roomY   : 120
  const roomPxW = roomGeom ? roomGeom.roomPxW : 720
  const roomPxH = roomGeom ? roomGeom.roomPxH : 480

  const STEP = Math.max(4, cellSize > 0 ? cellSize : 8)

  const cells = useMemo(() => {
    if (fixtures.length === 0) return []
    const result = []
    for (let py = roomY; py < roomY + roomPxH; py += STEP) {
      for (let px = roomX; px < roomX + roomPxW; px += STEP) {
        const cx = px + STEP / 2
        const cy = py + STEP / 2
        const lux = getTotalLuxAtPoint(fixtures, cx, cy, ceilingHeight, roomGeom)
        result.push({ x: px, y: py, color: luxToColor(lux, targetLux) })
      }
    }
    return result
  }, [fixtures, ceilingHeight, roomX, roomY, roomPxW, roomPxH, STEP, targetLux])

  if (cells.length === 0) return null

  const legendX = roomX + Math.round(roomPxW) + 10

  return (
    <Group>
      <SmoothHeatmap cells={cells} roomX={roomX} roomY={roomY} roomPxW={roomPxW} roomPxH={roomPxH} step={STEP} opacity={opacity} />
      <LuxLegend x={legendX} y={roomY + 50} targetLux={targetLux} />
    </Group>
  )
}
