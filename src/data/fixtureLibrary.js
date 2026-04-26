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
  // ── Standard ───────────────────────────────────────────────────────────────
  COB_DOWNLIGHT: { fill: '#ffe9b0', stroke: '#ffb300', glowColor: 'rgba(255,179,0,0.10)',  visualRadius: 7,  fixtureShape: 'circle'    },
  SPOTLIGHT:     { fill: '#ffd0a0', stroke: '#ff7c00', glowColor: 'rgba(255,124,0,0.10)',  visualRadius: 5,  fixtureShape: 'circle'    },
  PANEL:         { fill: '#d0eaff', stroke: '#4da6ff', glowColor: 'rgba(77,166,255,0.10)', visualRadius: 13, fixtureShape: 'square'    },
  LINEAR:        { fill: '#ffe0c0', stroke: '#ff9940', glowColor: 'rgba(255,153,64,0.10)', visualRadius: 10, fixtureShape: 'rectangle' },
  WALL_WASHER:   { fill: '#c8f0ff', stroke: '#20c0f0', glowColor: 'rgba(32,192,240,0.10)', visualRadius: 9,  fixtureShape: 'rectangle' },
  LED_STRIP:     { fill: '#f0d0ff', stroke: '#cc60ff', glowColor: 'rgba(200,96,255,0.10)', visualRadius: 10, fixtureShape: 'rectangle' },
  // ── Professional ───────────────────────────────────────────────────────────
  CHANDELIER:    { fill: '#d4a8f0', stroke: '#9b59b6', glowColor: 'rgba(155,89,182,0.14)',  visualRadius: 10, fixtureShape: 'star6'   },
  PENDANT:       { fill: '#f8a8d4', stroke: '#e91e8c', glowColor: 'rgba(233,30,140,0.12)',  visualRadius: 8,  fixtureShape: 'pendant' },
  TRACK_LIGHT:   { fill: '#a8d4f8', stroke: '#2196f3', glowColor: 'rgba(33,150,243,0.12)',  visualRadius: 9,  fixtureShape: 'track'   },
  COVE_LIGHT:    { fill: '#a8f0f8', stroke: '#00bcd4', glowColor: 'rgba(0,188,212,0.12)',   visualRadius: 11, fixtureShape: 'cove'    },
  BOLLARD:       { fill: '#a8f0a8', stroke: '#4caf50', glowColor: 'rgba(76,175,80,0.12)',   visualRadius: 8,  fixtureShape: 'hexagon' },
  FLOOD_LIGHT:   { fill: '#f8a8a8', stroke: '#f44336', glowColor: 'rgba(244,67,54,0.12)',   visualRadius: 12, fixtureShape: 'flood'   },
  SURFACE_PANEL: { fill: '#f8d4a8', stroke: '#ff9800', glowColor: 'rgba(255,152,0,0.12)',   visualRadius: 12, fixtureShape: 'square'  },
}

// ── Category metadata — drives modal UI ───────────────────────────────────────
export const CATEGORY_META = {
  // ── Standard ──────────────────────────────────────────────────────────────
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
    beamAngles: [120],
    cctOptions: ['3000K', '4000K', '6500K', 'Tunable'],
    voltageOptions: [12, 24, 48],
    variants: [],
  },

  // ── Professional-only ─────────────────────────────────────────────────────
  CHANDELIER: {
    label: 'Chandelier', professionalOnly: true,
    beamAngles: [120],
    cctOptions: ['2700K', '3000K'],
    variants: [
      { watt: 30,  lumens: 2700, beamAngle: 120, label: '6-arm'  },
      { watt: 45,  lumens: 4050, beamAngle: 120, label: '8-arm'  },
      { watt: 60,  lumens: 5400, beamAngle: 120, label: '12-arm' },
    ],
  },
  PENDANT: {
    label: 'Pendant', professionalOnly: true,
    beamAngles: [60],
    cctOptions: ['2700K', '3000K'],
    variants: [
      { watt: 12, lumens: 1080, beamAngle: 60, label: 'Small'  },
      { watt: 20, lumens: 1800, beamAngle: 60, label: 'Medium' },
      { watt: 30, lumens: 2700, beamAngle: 60, label: 'Large'  },
    ],
  },
  TRACK_LIGHT: {
    label: 'Track Light', professionalOnly: true,
    beamAngles: [36],
    cctOptions: ['3000K', '4000K'],
    variants: [
      { watt: 10, lumens: 850,  beamAngle: 36 },
      { watt: 20, lumens: 1700, beamAngle: 36 },
      { watt: 30, lumens: 2550, beamAngle: 36 },
    ],
  },
  COVE_LIGHT: {
    label: 'Cove Light', professionalOnly: true,
    beamAngles: [120],
    cctOptions: ['3000K', '4000K'],
    variants: [
      { watt: 10, lumens: 900,  beamAngle: 120, label: '10W/m' },
      { watt: 15, lumens: 1350, beamAngle: 120, label: '15W/m' },
    ],
  },
  BOLLARD: {
    label: 'Bollard', professionalOnly: true,
    beamAngles: [120],
    cctOptions: ['4000K'],
    variants: [
      { watt: 8,  lumens: 720,  beamAngle: 120 },
      { watt: 15, lumens: 1350, beamAngle: 120 },
      { watt: 25, lumens: 2250, beamAngle: 120 },
    ],
  },
  FLOOD_LIGHT: {
    label: 'Flood Light', professionalOnly: true,
    beamAngles: [120],
    cctOptions: ['6500K', '4000K'],
    variants: [
      { watt: 20,  lumens: 1800, beamAngle: 120 },
      { watt: 30,  lumens: 2700, beamAngle: 120 },
      { watt: 50,  lumens: 4500, beamAngle: 120 },
      { watt: 100, lumens: 9000, beamAngle: 120 },
    ],
  },
  SURFACE_PANEL: {
    label: 'Surface Panel', professionalOnly: true,
    beamAngles: [120],
    cctOptions: ['4000K', '3000K'],
    variants: [
      { watt: 12, lumens: 1080, beamAngle: 120, label: '12W Round'  },
      { watt: 18, lumens: 1620, beamAngle: 120, label: '18W Square' },
      { watt: 24, lumens: 2160, beamAngle: 120, label: '24W Square' },
    ],
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
