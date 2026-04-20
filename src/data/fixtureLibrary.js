// ── Quick-access shortcuts (used by FixturePanel sidebar) ─────────────────────
export const FIXTURE_LIBRARY = [
  { id: 'dl-12w-36',  label: '12W Downlight',    subLabel: '36° · 950 lm',   type: 'downlight',  watt: 12, lumens: 950,  beamAngle: 36,  fill: '#ffe9b0', stroke: '#ffb300', glowColor: 'rgba(255,179,0,0.10)',  visualRadius: 7  },
  { id: 'sp-7w-26',   label: '7W Spotlight',      subLabel: '26° · 550 lm',   type: 'spotlight',  watt: 7,  lumens: 550,  beamAngle: 26,  fill: '#ffd0a0', stroke: '#ff7c00', glowColor: 'rgba(255,124,0,0.10)',  visualRadius: 5  },
  { id: 'pl-18w-120', label: '18W Panel',          subLabel: '120° · 1800 lm', type: 'panel',      watt: 18, lumens: 1800, beamAngle: 120, fill: '#d0eaff', stroke: '#4da6ff', glowColor: 'rgba(77,166,255,0.10)', visualRadius: 13 },
  { id: 'ln-10w-90',  label: '10W Linear',         subLabel: '90° · 900 lm/m', type: 'linear',     watt: 10, lumens: 900,  beamAngle: 90,  fill: '#ffe0c0', stroke: '#ff9940', glowColor: 'rgba(255,153,64,0.10)', visualRadius: 10 },
  { id: 'ww-15w-60',  label: '15W Wall Washer',    subLabel: '60° · 1200 lm',  type: 'wallwasher', watt: 15, lumens: 1200, beamAngle: 60,  fill: '#c8f0ff', stroke: '#20c0f0', glowColor: 'rgba(32,192,240,0.10)', visualRadius: 9  },
  { id: 'dl-7w-24',   label: '7W Mini Downlight',  subLabel: '24° · 500 lm',   type: 'downlight',  watt: 7,  lumens: 500,  beamAngle: 24,  fill: '#fff5c0', stroke: '#f0d000', glowColor: 'rgba(240,208,0,0.10)',  visualRadius: 5  },
]

// ── Category → canvas visual defaults ────────────────────────────────────────
export const CATEGORY_VISUAL = {
  COB_DOWNLIGHT: { fill: '#ffe9b0', stroke: '#ffb300', glowColor: 'rgba(255,179,0,0.10)',  visualRadius: 7  },
  SPOTLIGHT:     { fill: '#ffd0a0', stroke: '#ff7c00', glowColor: 'rgba(255,124,0,0.10)',  visualRadius: 5  },
  PANEL:         { fill: '#d0eaff', stroke: '#4da6ff', glowColor: 'rgba(77,166,255,0.10)', visualRadius: 13 },
  LINEAR:        { fill: '#ffe0c0', stroke: '#ff9940', glowColor: 'rgba(255,153,64,0.10)', visualRadius: 10 },
  WALL_WASHER:   { fill: '#c8f0ff', stroke: '#20c0f0', glowColor: 'rgba(32,192,240,0.10)', visualRadius: 9  },
  LED_STRIP:     { fill: '#f0d0ff', stroke: '#cc60ff', glowColor: 'rgba(200,96,255,0.10)', visualRadius: 10 },
}

// ── Category metadata — drives modal UI ───────────────────────────────────────
export const CATEGORY_META = {
  COB_DOWNLIGHT: {
    label: 'COB Downlight',
    beamAngles: [36, 24, 60],          // 36° standard COB default
    cctOptions: ['2700K', '3000K', '4000K', '6500K', 'Tunable'],
    variants: [
      { watt: 3,  lumens: 210,  beamAngle: 36 },
      { watt: 5,  lumens: 350,  beamAngle: 36 },
      { watt: 7,  lumens: 490,  beamAngle: 36 },
      { watt: 9,  lumens: 630,  beamAngle: 36 },
      { watt: 12, lumens: 900,  beamAngle: 36 },
      { watt: 15, lumens: 1200, beamAngle: 36 },
      { watt: 18, lumens: 1500, beamAngle: 36 },
      { watt: 24, lumens: 2000, beamAngle: 36 },
      { watt: 30, lumens: 2500, beamAngle: 36 },
      { watt: 36, lumens: 3000, beamAngle: 36 },
    ],
  },
  SPOTLIGHT: {
    label: 'Spotlight',
    beamAngles: [24, 36, 15, 10],      // 24° standard MR16/spotlight default
    cctOptions: ['2700K', '3000K', '4000K', '6500K', 'Tunable'],
    variants: [
      { watt: 7,  lumens: 490,  beamAngle: 24 },
      { watt: 12, lumens: 900,  beamAngle: 24 },
      { watt: 15, lumens: 1200, beamAngle: 24 },
      { watt: 18, lumens: 1500, beamAngle: 24 },
      { watt: 24, lumens: 2000, beamAngle: 24 },
      { watt: 30, lumens: 2500, beamAngle: 24 },
      { watt: 36, lumens: 3000, beamAngle: 24 },
    ],
  },
  PANEL: {
    label: 'Panel',
    beamAngles: [120],                  // 120° standard panel
    cctOptions: ['3000K', '4000K', '6500K', 'Tunable'],
    variants: [
      { watt: 6,  lumens: 450,  beamAngle: 120 },
      { watt: 9,  lumens: 700,  beamAngle: 120 },
      { watt: 12, lumens: 900,  beamAngle: 120 },
      { watt: 18, lumens: 1500, beamAngle: 120 },
      { watt: 24, lumens: 2000, beamAngle: 120 },
      { watt: 36, lumens: 3000, beamAngle: 120 },
    ],
  },
  LINEAR: {
    label: 'Linear',
    beamAngles: [120, 90],              // 120° standard linear default
    cctOptions: ['3000K', '4000K', '6500K', 'Tunable'],
    variants: [
      { watt: 10, lumens: 800,  beamAngle: 120 },
      { watt: 12, lumens: 1000, beamAngle: 120 },
      { watt: 15, lumens: 1300, beamAngle: 120 },
      { watt: 18, lumens: 1600, beamAngle: 120 },
      { watt: 24, lumens: 2100, beamAngle: 120 },
    ],
  },
  WALL_WASHER: {
    label: 'Wall Washer',
    beamAngles: [60, 90],               // 60° standard wall washer
    cctOptions: ['2700K', '3000K', '4000K', 'Tunable'],
    variants: [
      { watt: 12, lumens: 900,  beamAngle: 60 },
      { watt: 15, lumens: 1200, beamAngle: 60 },
    ],
  },
  LED_STRIP: {
    label: 'LED Strip',
    beamAngles: [120],                  // 120° standard LED strip
    cctOptions: ['3000K', '4000K', '6500K', 'Tunable'],
    voltageOptions: [12, 24, 48],
    variants: [], // watt/lm per metre are manual inputs
  },
}

// ── LED Strip placeholder entry ───────────────────────────────────────────────
export const LED_STRIP_PLACEHOLDER = {
  id: 'led-strip',
  category: 'LED_STRIP',
  name: 'LED Strip',
  watt: 0,
  lumens: 0,
  beamAngle: 120,
  cct: '3000K',
  tunable: false,
  voltage: 24,
  wattPerMtr: null,
  lumensPerMtr: null,
}

// ── Predefined fixture entries (one per watt variant per category) ─────────────
export const PREDEFINED_FIXTURES = [
  LED_STRIP_PLACEHOLDER,
  ...Object.entries(CATEGORY_META)
    .filter(([cat]) => cat !== 'LED_STRIP')
    .flatMap(([cat, meta]) =>
      meta.variants.map(v => ({
        id: `${cat.toLowerCase().replace(/_/g, '-')}-${v.watt}w`,
        category: cat,
        name: `${meta.label} ${v.watt}W`,
        watt: v.watt,
        lumens: v.lumens,
        beamAngle: v.beamAngle ?? meta.beamAngles[0],
        cct: meta.cctOptions[0],
        tunable: false,
        voltage: 230,
      }))
    ),
]

// ── Resolve a config into a full fixture object (with visual props) ────────────
export function resolveFixture(config) {
  const vis      = CATEGORY_VISUAL[config.category] ?? CATEGORY_VISUAL.COB_DOWNLIGHT
  const catMeta  = CATEGORY_META[config.category]
  const catLabel = catMeta?.label ?? config.category ?? 'Fixture'
  const isLinear = config.category === 'LINEAR'
  const isStrip  = config.category === 'LED_STRIP'
  const tunable  = config.cct === 'Tunable'
  const watt     = config.watt ?? 0
  const lumens   = config.lumens ?? 0

  return {
    ...config,
    ...vis,
    tunable,
    label:    config.name ?? `${catLabel} ${watt}W`,
    subLabel: (isLinear || isStrip)
      ? `${config.beamAngle ?? 120}° · ${lumens} lm/m`
      : `${config.beamAngle ?? 36}° · ${lumens} lm`,
    type: (config.category ?? 'COB_DOWNLIGHT').toLowerCase().replace(/_/g, ''),
  }
}

// ── Static map for the 6 quick-access fixtures ────────────────────────────────
export const FIXTURE_MAP = Object.fromEntries(
  FIXTURE_LIBRARY.map(f => [f.id, f])
)
