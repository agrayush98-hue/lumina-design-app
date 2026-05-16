// ── Single source of truth for heatmap colour scale ───────────────────────
// All heatmap renderers and legends import from here so colours are
// guaranteed identical everywhere.
//
// Scale: ratio = lux / targetLux (clamped 0 → 1.5)
//
//  0.00 = 0%    dark blue   (very underlit)
//  0.25 = 25%   light blue  (underlit)
//  0.50 = 50%   green       (approaching target)
//  0.75 = 75%   yellow-green
//  1.00 = 100%  yellow      (at target ✓)
//  1.25 = 125%  orange      (slightly over)
//  1.50 = 150%+ red         (overlit)

export const HEATMAP_STOPS = [
  [0.00, [  0,   0, 180]],  // dark blue
  [0.25, [  0, 140, 255]],  // light blue
  [0.50, [  0, 200,  70]],  // green
  [0.75, [200, 230,   0]],  // yellow-green
  [1.00, [255, 200,   0]],  // yellow
  [1.25, [255, 110,   0]],  // orange
  [1.50, [255,  20,  20]],  // red
]

/**
 * Returns an "rgb(r,g,b)" string for the given lux value relative to target.
 * @param {number} lux       — computed lux at the point
 * @param {number} targetLux — room target lux setting
 * @param {boolean} alpha    — if true returns "rgba(r,g,b,0.85)" (transparent at lux≈0)
 */
export function luxToColor(lux, targetLux, alpha = false) {
  if (targetLux <= 0) return alpha ? 'rgba(0,0,180,0)' : 'rgb(0,0,180)'
  const ratio = Math.min(1.5, lux / targetLux)
  for (let i = 0; i < HEATMAP_STOPS.length - 1; i++) {
    const [r0, c0] = HEATMAP_STOPS[i]
    const [r1, c1] = HEATMAP_STOPS[i + 1]
    if (ratio <= r1) {
      const t  = (ratio - r0) / (r1 - r0)
      const ri = Math.round(c0[0] + t * (c1[0] - c0[0]))
      const gi = Math.round(c0[1] + t * (c1[1] - c0[1]))
      const bi = Math.round(c0[2] + t * (c1[2] - c0[2]))
      if (alpha) {
        const a = ratio < 0.05 ? 0 : 0.85
        return `rgba(${ri},${gi},${bi},${a})`
      }
      return `rgb(${ri},${gi},${bi})`
    }
  }
  return alpha ? 'rgba(255,20,20,0.85)' : 'rgb(255,20,20)'
}

// Pre-built sidebar legend entries — colours sampled at each stop breakpoint
// so the sidebar swatches are pixel-perfect matches to the canvas heatmap.
export const SIDEBAR_LEGEND = [
  { ratio: 0.00, label: '0% — No light',           rgb: HEATMAP_STOPS[0][1] },
  { ratio: 0.25, label: '25% — Very underlit',      rgb: HEATMAP_STOPS[1][1] },
  { ratio: 0.50, label: '50% — Below target',       rgb: HEATMAP_STOPS[2][1] },
  { ratio: 0.75, label: '75% — Approaching target', rgb: HEATMAP_STOPS[3][1] },
  { ratio: 1.00, label: '100% — At target ✓',       rgb: HEATMAP_STOPS[4][1] },
  { ratio: 1.25, label: '125% — Slightly over',     rgb: HEATMAP_STOPS[5][1] },
  { ratio: 1.50, label: '150%+ — Overlit',          rgb: HEATMAP_STOPS[6][1] },
]
