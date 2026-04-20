import { useMemo } from 'react'
import { Image as KonvaImage } from 'react-konva'
import { getTotalLuxAtPoint } from '../utils/luxCalculator'

const CANVAS_W = 1000
const CANVAS_H = 700

// ── Lux → colour ──────────────────────────────────────────────────
const STOPS = [
  [0.00, [0,   0, 170]],
  [0.25, [0, 170, 255]],
  [0.50, [0, 204,  68]],
  [0.75, [255, 238,  0]],
  [1.00, [255, 136,  0]],
  [1.50, [255,   0,  0]],
]
function luxToColor(lux, targetLux) {
  if (targetLux <= 0) return null
  const ratio = Math.min(1.5, lux / targetLux)
  if (ratio < 0.05) return null
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [r0, c0] = STOPS[i], [r1, c1] = STOPS[i + 1]
    if (ratio <= r1) {
      const t = (ratio - r0) / (r1 - r0)
      return `rgb(${Math.round(c0[0]+t*(c1[0]-c0[0]))},${Math.round(c0[1]+t*(c1[1]-c0[1]))},${Math.round(c0[2]+t*(c1[2]-c0[2]))})`
    }
  }
  return 'rgb(255,0,0)'
}

// ── Per-room pxToMm converter ─────────────────────────────────────
function makeRoomGeom(polygon, realWidth_m, realLength_m) {
  const xs = polygon.map(p => p.x), ys = polygon.map(p => p.y)
  const minX = Math.min(...xs), maxX = Math.max(...xs)
  const minY = Math.min(...ys), maxY = Math.max(...ys)
  return {
    pxToMm: (px_x, px_y) => ({
      x: ((px_x - minX) / Math.max(maxX - minX, 1)) * realWidth_m  * 1000,
      y: ((px_y - minY) / Math.max(maxY - minY, 1)) * realLength_m * 1000,
    }),
    minX, maxX, minY, maxY,
    pxW: maxX - minX, pxH: maxY - minY,
  }
}

// ── Polygon mask (destination-in) ────────────────────────────────
function applyPolygonMask(ctx, polygon) {
  ctx.globalCompositeOperation = 'destination-in'
  ctx.beginPath()
  polygon.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y))
  ctx.closePath()
  ctx.fillStyle = 'rgba(0,0,0,1)'
  ctx.fill()
  ctx.globalCompositeOperation = 'source-over'
}

// ── HEATMAP ───────────────────────────────────────────────────────
function makeHeatmapCanvas(fixtures, ceilingHeight, polygon, realWidth, realLength, targetLux, cellSize) {
  const STEP = Math.max(4, cellSize)
  const geom = makeRoomGeom(polygon, realWidth, realLength)
  const { minX, maxX, minY, maxY } = geom

  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')

  ctx.filter = 'blur(10px)'
  for (let py = minY - STEP; py < maxY + STEP; py += STEP) {
    for (let px = minX - STEP; px < maxX + STEP; px += STEP) {
      const lux = getTotalLuxAtPoint(fixtures, px + STEP / 2, py + STEP / 2, ceilingHeight, geom)
      const color = luxToColor(lux, targetLux)
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(px, py, STEP, STEP)
    }
  }
  ctx.filter = 'none'
  applyPolygonMask(ctx, polygon)
  return canvas
}

// ── DYNAMIC WEDGE BEAM ────────────────────────────────────────────
// Step 1: identify mount wall (nearest polygon edge from fixture pos)
function nearestWallDir(fx, fy, polygon) {
  let minDist = Infinity, wallNx = 0, wallNy = 0

  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]

    const abx = b.x - a.x, aby = b.y - a.y
    const len2 = abx * abx + aby * aby
    if (len2 === 0) continue
    const t = Math.max(0, Math.min(1, ((fx - a.x) * abx + (fy - a.y) * aby) / len2))
    const closestX = a.x + t * abx
    const closestY = a.y + t * aby
    const dist = Math.hypot(fx - closestX, fy - closestY)

    if (dist < minDist) {
      minDist = dist
      // inward normal = away from wall = projection direction
      const edgeLen = Math.sqrt(len2)
      wallNx = -aby / edgeLen   // perpendicular to edge, pointing inward
      wallNy =  abx / edgeLen
      // Ensure normal points away from wall toward room interior
      const toCx = fx - closestX, toCy = fy - closestY
      if (wallNx * toCx + wallNy * toCy < 0) { wallNx = -wallNx; wallNy = -wallNy }
    }
  }
  return { dirX: wallNx, dirY: wallNy }
}

// Step 2: cast ray from point in direction, return distance to polygon boundary
function rayToPolygon(ox, oy, dx, dy, polygon) {
  let tMin = Infinity
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i]
    const b = polygon[(i + 1) % polygon.length]
    const ex = b.x - a.x, ey = b.y - a.y
    const denom = dx * ey - dy * ex
    if (Math.abs(denom) < 1e-10) continue
    const tx = (a.x - ox), ty = (a.y - oy)
    const t = (tx * ey - ty * ex) / denom
    const u = (tx * dy - ty * dx) / denom
    if (t > 0.001 && u >= 0 && u <= 1) tMin = Math.min(tMin, t)
  }
  return tMin === Infinity ? 0 : tMin
}

// Step 3: physics-based wedge beam
// Plan-view projection cone: apex = projector, base = screen wall
// diameter = 2 × tan(beamAngle/2) × throwDistance  [real photometric formula]
// Zones based on BEAM WIDTH (not throw distance):
//   Hotspot  = inner 25%  (near-white, brightest)
//   Optimal  = inner 55%  (yellow)
//   Good     = inner 80%  (orange)
//   Acceptable = 100%     (red/dim)
function makeBeamCanvas(fixtures, ceilingHeight, polygon) {
  const canvas = document.createElement('canvas')
  canvas.width = CANVAS_W
  canvas.height = CANVAS_H
  const ctx = canvas.getContext('2d')

  for (const fixture of fixtures) {
    const fx = fixture.position.x
    const fy = fixture.position.y
    const beamAngle_deg = Math.min(179, Math.max(1, fixture.beamAngle || 45))
    const halfAngle     = (beamAngle_deg / 2) * (Math.PI / 180)
    const fixColor      = fixture.wattageColor?.hex || '#ff8800'

    // ── 1. Mount wall detection → projection direction ───────────────
    const { dirX, dirY } = nearestWallDir(fx, fy, polygon)
    if (dirX === 0 && dirY === 0) continue

    const perpX = -dirY, perpY = dirX   // lateral axis

    // ── 2. Throw distance = ray from fixture to opposite wall ─────────
    const throwDist = rayToPolygon(fx, fy, dirX, dirY, polygon)
    if (throwDist < 10) continue

    const screenX = fx + dirX * throwDist
    const screenY = fy + dirY * throwDist

    // ── 3. Beam half-width at screen [physics: r = d × tan(θ/2)] ─────
    const halfWidth = throwDist * Math.tan(halfAngle)
    if (halfWidth < 1) continue

    // Screen edge and center points
    const eL  = { x: screenX + perpX * halfWidth,  y: screenY + perpY * halfWidth  }
    const eR  = { x: screenX - perpX * halfWidth,  y: screenY - perpY * halfWidth  }
    const eC  = { x: screenX,                       y: screenY                      }

    // ── 4. Draw beam zones — width-fraction based, back-to-front ─────
    // Drawing larger zone first, smaller on top:
    //   100% red   → then 80% orange covers center
    //   → then 55% yellow → then 25% near-white hotspot
    // Visual result: edges=red, mid=orange, inner=yellow, centre=bright
    const ZONES = [
      { hw: 1.00, r: 220,  g:  40,  b: 40,  a: 0.12 },  // acceptable (spill)
      { hw: 0.80, r: 255,  g: 120,  b:  0,  a: 0.16 },  // good (field)
      { hw: 0.55, r: 255,  g: 230,  b:  0,  a: 0.21 },  // optimal
      { hw: 0.25, r: 255,  g: 255,  b: 200, a: 0.28 },  // hotspot (centre)
    ]

    for (const z of ZONES) {
      const hw = halfWidth * z.hw
      const lx = screenX + perpX * hw, ly = screenY + perpY * hw
      const rx = screenX - perpX * hw, ry = screenY - perpY * hw

      // Gradient along beam axis: transparent at projector → solid at screen
      const grad = ctx.createLinearGradient(fx, fy, screenX, screenY)
      grad.addColorStop(0,    `rgba(${z.r},${z.g},${z.b},0)`)
      grad.addColorStop(0.15, `rgba(${z.r},${z.g},${z.b},${z.a * 0.25})`)
      grad.addColorStop(0.60, `rgba(${z.r},${z.g},${z.b},${z.a})`)
      grad.addColorStop(1,    `rgba(${z.r},${z.g},${z.b},${z.a * 1.5})`)

      ctx.beginPath()
      ctx.moveTo(fx, fy)   // apex = projector position
      ctx.lineTo(lx, ly)   // left screen edge
      ctx.lineTo(rx, ry)   // right screen edge
      ctx.closePath()
      ctx.fillStyle = grad
      ctx.fill()
    }

    // ── 5. Beam edge lines (dashed, projector → screen corners) ──────
    ctx.strokeStyle = fixColor
    ctx.lineWidth   = 1.5
    ctx.globalAlpha = 0.85
    ctx.setLineDash([7, 4])
    ctx.beginPath()
    ctx.moveTo(fx, fy); ctx.lineTo(eL.x, eL.y)
    ctx.moveTo(fx, fy); ctx.lineTo(eR.x, eR.y)
    ctx.stroke()
    ctx.setLineDash([])

    // ── 6. Centre axis (throw line) ───────────────────────────────────
    ctx.strokeStyle = fixColor
    ctx.lineWidth   = 0.75
    ctx.globalAlpha = 0.35
    ctx.setLineDash([3, 7])
    ctx.beginPath()
    ctx.moveTo(fx, fy); ctx.lineTo(eC.x, eC.y)
    ctx.stroke()
    ctx.setLineDash([])

    // ── 7. Screen illumination bar (bright white where beam hits wall) ─
    const sGrad = ctx.createLinearGradient(eL.x, eL.y, eR.x, eR.y)
    sGrad.addColorStop(0,    'rgba(255,255,200,0)')
    sGrad.addColorStop(0.15, 'rgba(255,255,220,0.75)')
    sGrad.addColorStop(0.5,  'rgba(255,255,255,1)')
    sGrad.addColorStop(0.85, 'rgba(255,255,220,0.75)')
    sGrad.addColorStop(1,    'rgba(255,255,200,0)')
    ctx.strokeStyle = sGrad
    ctx.lineWidth   = 5
    ctx.globalAlpha = 1
    ctx.beginPath()
    ctx.moveTo(eL.x, eL.y); ctx.lineTo(eR.x, eR.y)
    ctx.stroke()

    // ── 8. Zone separator arcs at field boundaries (55%, 80%) ─────────
    ctx.globalAlpha = 0.30
    ctx.setLineDash([4, 4])
    for (const frac of [0.55, 0.80]) {
      const hw  = halfWidth * frac
      const lx2 = screenX + perpX * hw, ly2 = screenY + perpY * hw
      const rx2 = screenX - perpX * hw, ry2 = screenY - perpY * hw
      ctx.strokeStyle = 'rgba(255,220,60,0.8)'
      ctx.lineWidth   = 0.75
      ctx.beginPath()
      ctx.moveTo(fx, fy); ctx.lineTo(lx2, ly2)
      ctx.moveTo(fx, fy); ctx.lineTo(rx2, ry2)
      ctx.stroke()
    }
    ctx.setLineDash([])

    // ── 9. Projector dot with glow ────────────────────────────────────
    ctx.globalAlpha  = 1
    ctx.fillStyle    = fixColor
    ctx.shadowColor  = fixColor
    ctx.shadowBlur   = 8
    ctx.beginPath()
    ctx.arc(fx, fy, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur   = 0
  }

  applyPolygonMask(ctx, polygon)
  return canvas
}

// ── Component ─────────────────────────────────────────────────────
export default function RoomOverlay({
  room, fixtures, ceilingHeight, targetLux, cellSize,
  showHeatMap, showBeams,
}) {
  const { polygon, realWidth, realLength } = room

  const heatCanvas = useMemo(() => {
    if (!showHeatMap || !polygon?.length || !fixtures.length) return null
    return makeHeatmapCanvas(fixtures, ceilingHeight, polygon, realWidth, realLength, targetLux, cellSize)
  }, [showHeatMap, fixtures, ceilingHeight, polygon, realWidth, realLength, targetLux, cellSize])

  const beamCanvas = useMemo(() => {
    if (!showBeams || !polygon?.length || !fixtures.length) return null
    return makeBeamCanvas(fixtures, ceilingHeight, polygon)
  }, [showBeams, fixtures, ceilingHeight, polygon])

  return (
    <>
      {heatCanvas && (
        <KonvaImage image={heatCanvas} x={0} y={0} width={CANVAS_W} height={CANVAS_H}
          opacity={0.75} listening={false} />
      )}
      {beamCanvas && (
        <KonvaImage image={beamCanvas} x={0} y={0} width={CANVAS_W} height={CANVAS_H}
          opacity={1} listening={false} />
      )}
    </>
  )
}
