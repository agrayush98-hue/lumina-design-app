// ─────────────────────────────────────────────────────────────
// LUX CALCULATOR
// All positions in canvas pixels; heights/distances in mm internally,
// converted to metres for the inverse-square-law formula.
// ─────────────────────────────────────────────────────────────
import { getRelativeIntensity } from './luminousIntensityLookup'
import { SCALE, pxToMm, ROOM_X, ROOM_Y, ROOM_PX_W, ROOM_PX_H } from './canvasConstants'

// ── Luminous flux ─────────────────────────────────────────────

/** Total lumens emitted by a fixture */
export function getFixtureLumens(fixture) {
  return (fixture.wattage || 0) * (fixture.lumensPerWatt || 100)
}

// ── Peak centre-beam intensity (candela) ──────────────────────

export function getFixtureCandela(fixture) {
  const lumens = getFixtureLumens(fixture)
  if (!lumens) return 0
  const beamAngle = fixture.beamAngle || 60
  if (beamAngle >= 270) return lumens / (4 * Math.PI)
  const halfRad    = (beamAngle / 2) * (Math.PI / 180)
  const solidAngle = 2 * Math.PI * (1 - Math.cos(halfRad))
  return lumens / solidAngle
}

// ── Point illuminance from a single fixture ───────────────────

/**
 * Illuminance (lux) at a canvas-pixel point (tPx, tPy) on the floor.
 * @param {object|null} roomGeom - optional geometry from computeRoomGeometry(); uses static defaults if null
 */
export function getLuxAtPoint(fixture, tPx, tPy, ceilingHeight_mm = 2700, roomGeom = null) {
  const I0 = getFixtureCandela(fixture)
  if (!I0) return 0

  const toMm = roomGeom ? roomGeom.pxToMm : pxToMm
  const fMm  = toMm(fixture.position.x, fixture.position.y)
  const tMm  = toMm(tPx, tPy)

  const dx_mm = tMm.x - fMm.x
  const dy_mm = tMm.y - fMm.y
  const r_mm  = Math.sqrt(dx_mm * dx_mm + dy_mm * dy_mm)
  const d_mm  = Math.sqrt(r_mm * r_mm + ceilingHeight_mm * ceilingHeight_mm)
  const d_m   = d_mm / 1000

  if (d_m === 0) return 0

  const theta    = Math.atan2(r_mm, ceilingHeight_mm)
  const relI     = getRelativeIntensity(theta, fixture.beamAngle || 60)
  if (relI === 0) return 0

  const cosTheta = ceilingHeight_mm / d_mm
  return (I0 * relI * cosTheta) / (d_m * d_m)
}

// ── Nadir lux (directly below) ────────────────────────────────

export function getNadirLux(fixture, ceilingHeight_mm = 2700) {
  const I0  = getFixtureCandela(fixture)
  const d_m = ceilingHeight_mm / 1000
  return d_m > 0 ? I0 / (d_m * d_m) : 0
}

// ── Total lux from all fixtures at a point ────────────────────

export function getTotalLuxAtPoint(fixtures, tPx, tPy, ceilingHeight_mm = 2700, roomGeom = null) {
  let total = 0
  for (const f of fixtures) total += getLuxAtPoint(f, tPx, tPy, ceilingHeight_mm, roomGeom)
  return total
}

// ── Beam footprint radius on the floor ───────────────────────

export function getBeamRadiusPx(fixture, ceilingHeight_mm = 2700) {
  const beamAngle = fixture.beamAngle || 60
  if (beamAngle >= 270) return null
  const halfRad = (beamAngle / 2) * (Math.PI / 180)
  const r_mm    = ceilingHeight_mm * Math.tan(halfRad)
  return r_mm * SCALE
}

// ── Room-wide lux statistics ──────────────────────────────────

/**
 * @param {number} ceilingHeight_mm
 * @param {{ reflectances?: {ceilingReflectance,wallReflectance,floorReflectance}, roomGeom?: object }} options
 */
export function computeRoomLuxStats(fixtures, ceilingHeight_mm = 2700, options = {}) {
  if (!fixtures || fixtures.length === 0) return null

  const { reflectances = null, roomGeom = null } = options

  // Fall back to static constants when no geometry provided
  const RX  = roomGeom ? roomGeom.roomX   : ROOM_X
  const RY  = roomGeom ? roomGeom.roomY   : ROOM_Y
  const RPW = roomGeom ? roomGeom.roomPxW : ROOM_PX_W
  const RPH = roomGeom ? roomGeom.roomPxH : ROOM_PX_H

  // Simplified inter-reflection multiplier (Integrating-sphere approximation)
  // More reflective surfaces → higher effective illuminance from inter-reflections
  let interRefMult = 1.0
  if (reflectances) {
    const c = (reflectances.ceilingReflectance ?? 70) / 100
    const w = (reflectances.wallReflectance    ?? 50) / 100
    const f = (reflectances.floorReflectance   ?? 20) / 100
    const rhoAvg = c * 0.5 + w * 0.3 + f * 0.2   // area-weighted average
    interRefMult = 1 + 0.28 * rhoAvg               // empirical boost factor
  }

  const SX = 10, SY = 8
  let sum = 0, min = Infinity, max = 0

  for (let i = 0; i <= SX; i++) {
    for (let j = 0; j <= SY; j++) {
      const px  = RX + (RPW * i) / SX
      const py  = RY + (RPH * j) / SY
      const lux = getTotalLuxAtPoint(fixtures, px, py, ceilingHeight_mm, roomGeom) * interRefMult
      sum += lux
      if (lux < min) min = lux
      if (lux > max) max = lux
    }
  }

  const count = (SX + 1) * (SY + 1)
  const avg   = sum / count
  return {
    avg:        Math.round(avg),
    min:        Math.round(min),
    max:        Math.round(max),
    uniformity: avg > 0 ? (min / avg).toFixed(2) : '0.00',
  }
}
