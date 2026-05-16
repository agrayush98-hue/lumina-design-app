import { useMemo, useRef, useEffect } from 'react'
import Konva from 'konva'
import { Group, Rect, Text, Line, Image } from 'react-konva'
import { getTotalLuxAtPoint } from '../utils/luxCalculator'
import { HEATMAP_STOPS, luxToColor as _luxToColor } from '../utils/heatmapColors'

function luxToColor(lux, targetLux) { return _luxToColor(lux, targetLux, true) }

function LuxLegend({ x, y, targetLux }) {
  const W = 18
  const H = 150
  // Gradient from canonical stops (top = 150% hot, bottom = 0% cold)
  const gradStops = []
  for (const [ratio, [r, g, b]] of [...HEATMAP_STOPS].reverse()) {
    gradStops.push(1 - ratio / 1.5, `rgb(${r},${g},${b})`)
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
      {[...HEATMAP_STOPS].reverse().map(([ratio]) => {
        const ly = y + (1 - ratio / 1.5) * H
        return (
          <Group key={ratio}>
            <Line points={[x + W, ly, x + W + 4, ly]} stroke="#4a7a96" strokeWidth={0.5} />
            <Text x={x + W + 6} y={ly - 4} text={`${Math.round(ratio * targetLux)}`} fontSize={7} fontFamily="IBM Plex Mono" fill="#4a7a96" />
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
