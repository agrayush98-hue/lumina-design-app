import { useEffect, useState } from 'react'
import { Image, Group, Rect, Text, Line } from 'react-konva'
import { getTotalLuxAtPoint } from '../utils/luxCalculator'

// Vibrant blue → cyan → green → yellow → orange → red scale
const STOPS = [
  { lux:    0, r:   0, g:   0, b: 139, a:   0 },  // dark blue  (#00008B)
  { lux:   50, r:   0, g:   0, b: 255, a: 140 },  // blue       (#0000FF)
  { lux:  150, r:   0, g: 255, b: 255, a: 170 },  // cyan       (#00FFFF)
  { lux:  300, r:   0, g: 255, b:   0, a: 190 },  // green      (#00FF00)
  { lux:  500, r: 255, g: 255, b:   0, a: 200 },  // yellow     (#FFFF00)
  { lux:  750, r: 255, g: 140, b:   0, a: 210 },  // orange     (#FF8C00)
  { lux: 1000, r: 255, g:   0, b:   0, a: 220 },  // red        (#FF0000)
  { lux: 1200, r: 139, g:   0, b:   0, a: 230 },  // deep red   (#8B0000)
]

function luxToRGBA(lux) {
  if (lux <= 0) return [0, 0, 139, 0]
  const last = STOPS[STOPS.length - 1]
  if (lux >= last.lux) return [last.r, last.g, last.b, last.a]
  let lo = STOPS[0], hi = STOPS[1]
  for (let i = 0; i < STOPS.length - 1; i++) {
    if (lux >= STOPS[i].lux && lux < STOPS[i + 1].lux) { lo = STOPS[i]; hi = STOPS[i + 1]; break }
  }
  const t = (lux - lo.lux) / (hi.lux - lo.lux)
  return [
    Math.round(lo.r + t * (hi.r - lo.r)),
    Math.round(lo.g + t * (hi.g - lo.g)),
    Math.round(lo.b + t * (hi.b - lo.b)),
    Math.round(lo.a + t * (hi.a - lo.a)),
  ]
}

// Legend tick labels — high to low (top → bottom of bar)
const LEGEND_TICKS = [1200, 1000, 750, 500, 300, 150, 50, 0]

function LuxLegend({ x, y, height }) {
  const BAR_W = 12
  const LABEL_X = x + BAR_W + 4
  const SEGMENTS = 60
  const segH = height / SEGMENTS

  const segments = []
  for (let i = 0; i < SEGMENTS; i++) {
    const t = 1 - i / SEGMENTS
    const lux = t * STOPS[STOPS.length - 1].lux
    const [r, g, b] = luxToRGBA(lux)
    segments.push(
      <Rect
        key={i}
        x={x} y={y + i * segH}
        width={BAR_W} height={segH + 0.5}
        fill={`rgb(${r},${g},${b})`}
      />
    )
  }

  const ticks = LEGEND_TICKS.map((lux) => {
    const fraction = lux / STOPS[STOPS.length - 1].lux
    const ty = y + (1 - fraction) * height
    const [r, g, b] = luxToRGBA(lux)
    return (
      <Group key={lux}>
        <Line points={[x + BAR_W, ty, x + BAR_W + 3, ty]} stroke={`rgb(${r},${g},${b})`} strokeWidth={1} />
        <Text
          x={LABEL_X + 1} y={ty - 4}
          text={`${lux}`}
          fontSize={7} fontFamily="IBM Plex Mono"
          fill={`rgb(${r},${g},${b})`}
        />
      </Group>
    )
  })

  return (
    <Group>
      <Rect x={x} y={y} width={BAR_W} height={height} stroke="#1a2b3c" strokeWidth={0.5} fill="transparent" />
      {segments}
      {ticks}
      <Text x={x} y={y - 14} text="lx" fontSize={7} fontFamily="IBM Plex Mono" fill="#4a7a96" />
    </Group>
  )
}

export default function LuxHeatMap({ fixtures = [], ceilingHeight = 2700, roomGeom = null, cellSize = 8, opacity = 0.68 }) {
  const [heatImage, setHeatImage] = useState(null)

  const roomX   = roomGeom ? roomGeom.roomX   : 120
  const roomY   = roomGeom ? roomGeom.roomY   : 120
  const roomPxW = roomGeom ? roomGeom.roomPxW : 720
  const roomPxH = roomGeom ? roomGeom.roomPxH : 480

  useEffect(() => {
    if (fixtures.length === 0) { setHeatImage(null); return }

    const fullW = Math.round(roomPxW)
    const fullH = Math.round(roomPxH)

    // Coarse sampling step — at least 4px, use the cellSize prop as a hint
    const CELL = Math.max(cellSize > 0 ? cellSize : 8, 4)

    // ── Step 1: Sample lux onto a SMALL canvas (1 pixel per sample) ──────────
    const sw = Math.ceil(fullW / CELL)   // e.g. 400px / 8 = 50 small pixels
    const sh = Math.ceil(fullH / CELL)

    const smallCanvas = document.createElement('canvas')
    smallCanvas.width  = sw
    smallCanvas.height = sh
    const smallCtx = smallCanvas.getContext('2d')
    const imgData = smallCtx.createImageData(sw, sh)
    const data = imgData.data

    for (let sy = 0; sy < sh; sy++) {
      for (let sx = 0; sx < sw; sx++) {
        // Map small pixel → centre of corresponding full-res region
        const samplePx = roomX + (sx + 0.5) * CELL
        const samplePy = roomY + (sy + 0.5) * CELL
        const lux = getTotalLuxAtPoint(fixtures, samplePx, samplePy, ceilingHeight, roomGeom)
        const [r, g, b, a] = luxToRGBA(lux)
        const idx = (sy * sw + sx) * 4
        data[idx] = r; data[idx + 1] = g; data[idx + 2] = b; data[idx + 3] = a
      }
    }
    smallCtx.putImageData(imgData, 0, 0)

    // ── Step 2: Scale up onto a FULL-RES canvas with bilinear smoothing ──────
    const largeCanvas = document.createElement('canvas')
    largeCanvas.width  = fullW
    largeCanvas.height = fullH
    const largeCtx = largeCanvas.getContext('2d')

    // Blur is applied as the small image is stretched — produces smooth gradients
    largeCtx.filter = 'blur(4px)'
    largeCtx.imageSmoothingEnabled = true
    largeCtx.imageSmoothingQuality = 'high'
    largeCtx.drawImage(smallCanvas, 0, 0, fullW, fullH)

    const img = new window.Image()
    img.src = largeCanvas.toDataURL('image/png')
    img.onload = () => setHeatImage(img)
  }, [fixtures, ceilingHeight, roomX, roomY, roomPxW, roomPxH, cellSize])

  if (!heatImage) return null

  const legendX = roomX + Math.round(roomPxW) + 10
  const legendH = Math.round(roomPxH)

  return (
    <Group>
      <Image
        image={heatImage} x={roomX} y={roomY}
        width={Math.round(roomPxW)} height={Math.round(roomPxH)}
        opacity={opacity}
      />
      <LuxLegend x={legendX} y={roomY} height={legendH} />
    </Group>
  )
}
