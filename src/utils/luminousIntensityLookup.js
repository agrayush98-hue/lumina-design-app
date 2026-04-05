// ─────────────────────────────────────────────────────────────
// LUMINOUS INTENSITY DISTRIBUTION
// Models: I(θ) = I₀ × cos^n(θ)   (Lambertian generalisation)
// n is derived from the half-beam angle: 0.5 = cos^n(θ_half)
//   → n = ln(0.5) / ln(cos(θ_half))
// ─────────────────────────────────────────────────────────────

/**
 * Returns the cosine exponent n for a given full beam angle (degrees).
 * Large n → narrow, peaky beam. Small n → wide, diffuse beam.
 */
export function getCosineExponent(beamAngleDeg) {
  if (beamAngleDeg >= 360) return 0     // perfect spherical — flat
  if (beamAngleDeg >= 270) return 0.15  // near-omnidirectional (globe)
  if (beamAngleDeg >= 180) return 0.5   // hemisphere
  const halfRad = (beamAngleDeg / 2) * (Math.PI / 180)
  const cosHalf = Math.cos(halfRad)
  if (cosHalf <= 0) return 0
  return Math.log(0.5) / Math.log(cosHalf)
}

/**
 * Relative luminous intensity at angle θ (radians) from optical axis.
 * Returns value 0–1 (1 = peak on-axis, 0 = outside beam cutoff).
 *
 * @param {number} thetaRad   - angle from nadir/axis in radians
 * @param {number} beamAngleDeg - full beam angle in degrees
 */
export function getRelativeIntensity(thetaRad, beamAngleDeg) {
  // Omnidirectional — full sphere, no cutoff
  if (beamAngleDeg >= 270) return 1.0

  const halfRad = (beamAngleDeg / 2) * (Math.PI / 180)

  // Hard cutoff beyond half-angle
  if (thetaRad > halfRad) return 0

  const n = getCosineExponent(beamAngleDeg)
  if (n === 0) return 1.0
  return Math.pow(Math.cos(thetaRad), n)
}

/**
 * Prebuilt lookup: beam angle → readable description
 */
export function beamDescription(deg) {
  if (deg <= 15)  return 'Narrow spot'
  if (deg <= 25)  return 'Spot'
  if (deg <= 40)  return 'Medium flood'
  if (deg <= 60)  return 'Flood'
  if (deg <= 90)  return 'Wide flood'
  if (deg <= 130) return 'Very wide'
  if (deg < 270)  return 'Diffuser'
  return 'Omnidirectional'
}
