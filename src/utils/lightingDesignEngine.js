import { fixtureDatabase } from '../fixtureDatabase'

// ── Space type catalogue ──────────────────────────────────────────────────────
// Each space has layers: ambient | accent | linear | cove | task
// share values must sum to 1.0 per space.
// wattIdx / beamIdx index into fixture.wattages / fixture.beamAngles arrays.
export const SPACE_TYPES = [
  {
    id: 'hotel',
    name: 'Hotel Room',
    icon: '🏨',
    category: 'Hospitality',
    targetLux: 150,
    cct: '2700K',
    cri: 90,
    standard: 'EN 12464-1',
    description: 'Warm layered scheme — dimmable downlights for base light, cove strip for atmosphere, accent spots at headboard / feature wall.',
    tags: ['DALI Dimmable', 'Warm White', 'CRI 90+'],
    layers: [
      { type: 'ambient', label: 'Ambient Downlights', fixtureId: 'cob-downlight',    wattIdx: 1, beamIdx: 2, share: 0.55 },
      { type: 'accent',  label: 'Accent Spotlights',  fixtureId: 'accent-spotlight', wattIdx: 0, beamIdx: 1, share: 0.15 },
      { type: 'cove',    label: 'Cove Strip',         wattPerMeter: 9,               share: 0.30 },
    ],
  },
  {
    id: 'apartment',
    name: 'Apartment',
    icon: '🏠',
    category: 'Residential',
    targetLux: 200,
    cct: '3000K',
    cri: 85,
    standard: 'EN 12464-1',
    description: 'Comfortable residential lighting — ambient downlights, track accent for art / feature walls, warm cove strip along ceiling perimeter.',
    tags: ['CCT Tunable', 'Dimmable', 'Layered'],
    layers: [
      { type: 'ambient', label: 'Ambient Downlights', fixtureId: 'cob-downlight', wattIdx: 2, beamIdx: 2, share: 0.60 },
      { type: 'accent',  label: 'Accent Track',       fixtureId: 'track-light',   wattIdx: 0, beamIdx: 2, share: 0.20 },
      { type: 'cove',    label: 'Cove Strip',         wattPerMeter: 9,             share: 0.20 },
    ],
  },
  {
    id: 'office',
    name: 'Office',
    icon: '💼',
    category: 'Commercial',
    targetLux: 400,
    cct: '4000K',
    cri: 80,
    standard: 'EN 12464-1 · UGR ≤ 19',
    description: 'Uniform, glare-free task lighting meeting EN 12464-1. Panel lights in a regular grid. Task strip at desk zones.',
    tags: ['UGR ≤ 19', 'Uniform', 'Task-Focused'],
    layers: [
      { type: 'ambient', label: 'Panel Lights',  fixtureId: 'panel-light', wattIdx: 2, beamIdx: 0, share: 0.85 },
      { type: 'task',    label: 'Task Strip',    wattPerMeter: 12,                                  share: 0.15 },
    ],
  },
  {
    id: 'restaurant',
    name: 'Restaurant',
    icon: '🍽',
    category: 'Hospitality',
    targetLux: 150,
    cct: '2700K',
    cri: 90,
    standard: 'EN 12464-1',
    description: 'Intimate dining atmosphere — pendant-style accent spots over tables, soft fill downlights, warm perimeter cove strip.',
    tags: ['CRI 90+', 'Warm White', 'Intimate'],
    layers: [
      { type: 'accent',  label: 'Pendant Accents', fixtureId: 'accent-spotlight', wattIdx: 1, beamIdx: 1, share: 0.45 },
      { type: 'ambient', label: 'Fill Downlights',  fixtureId: 'cob-downlight',   wattIdx: 0, beamIdx: 3, share: 0.25 },
      { type: 'cove',    label: 'Cove Strip',       wattPerMeter: 9,               share: 0.30 },
    ],
  },
  {
    id: 'retail',
    name: 'Retail',
    icon: '🛍',
    category: 'Commercial',
    targetLux: 500,
    cct: '4000K',
    cri: 90,
    standard: 'EN 12464-1',
    description: 'High-brightness merchandise lighting — panel base layer, track spotlights for product emphasis, ceiling strip for visual warmth.',
    tags: ['High Lux', 'CRI 90+', 'Track System'],
    layers: [
      { type: 'ambient', label: 'Panel Base',    fixtureId: 'panel-light', wattIdx: 3, beamIdx: 0, share: 0.55 },
      { type: 'accent',  label: 'Track Spots',   fixtureId: 'track-light', wattIdx: 2, beamIdx: 1, share: 0.35 },
      { type: 'cove',    label: 'Ceiling Strip',  wattPerMeter: 12,         share: 0.10 },
    ],
  },
  {
    id: 'bedroom',
    name: 'Bedroom',
    icon: '🛏',
    category: 'Residential',
    targetLux: 150,
    cct: '2700K',
    cri: 90,
    standard: 'EN 12464-1',
    description: 'Relaxed bedroom scheme — minimal ambient, generous cove strip for mood, low-angle accent spots at bedside / headboard zone.',
    tags: ['Dimmable', 'Warm', 'Tunable White'],
    layers: [
      { type: 'ambient', label: 'Ambient Downlights', fixtureId: 'cob-downlight',    wattIdx: 0, beamIdx: 2, share: 0.40 },
      { type: 'accent',  label: 'Bedside Accents',    fixtureId: 'accent-spotlight', wattIdx: 0, beamIdx: 0, share: 0.20 },
      { type: 'cove',    label: 'Cove Strip',         wattPerMeter: 7,               share: 0.40 },
    ],
  },
  {
    id: 'kitchen',
    name: 'Kitchen',
    icon: '🍳',
    category: 'Residential',
    targetLux: 400,
    cct: '4000K',
    cri: 90,
    standard: 'EN 12464-1',
    description: 'Task-focused kitchen — ceiling panels for general light, under-cabinet task strip for worktops, accent track over island.',
    tags: ['Task Lighting', 'CRI 90+', 'Under-Cabinet'],
    layers: [
      { type: 'ambient', label: 'Ceiling Panels',     fixtureId: 'panel-light',  wattIdx: 1, beamIdx: 0, share: 0.55 },
      { type: 'task',    label: 'Under-Cabinet Strip', wattPerMeter: 12,           share: 0.30 },
      { type: 'accent',  label: 'Island Track',       fixtureId: 'track-light',  wattIdx: 0, beamIdx: 2, share: 0.15 },
    ],
  },
  {
    id: 'bathroom',
    name: 'Bathroom',
    icon: '🚿',
    category: 'Residential',
    targetLux: 300,
    cct: '3000K',
    cri: 90,
    standard: 'EN 12464-1 · IP44+',
    description: 'IP44-rated downlights for general illumination. Dedicated mirror/vanity strip for task. Wet-zone rated throughout.',
    tags: ['IP44', 'CRI 90+', 'Mirror Strip'],
    layers: [
      { type: 'ambient', label: 'IP44 Downlights', fixtureId: 'cob-downlight', wattIdx: 1, beamIdx: 1, share: 0.70 },
      { type: 'task',    label: 'Mirror Strip',    wattPerMeter: 9,                                     share: 0.30 },
    ],
  },
  {
    id: 'corridor',
    name: 'Corridor',
    icon: '🚶',
    category: 'Commercial',
    targetLux: 100,
    cct: '4000K',
    cri: 80,
    standard: 'EN 12464-1',
    description: 'Single linear row of downlights centred on corridor axis — even distribution, minimal glare, emergency-ready.',
    tags: ['Linear Row', 'Emergency-Ready', 'Uniform'],
    layers: [
      { type: 'linear', label: 'Corridor Downlights', fixtureId: 'cob-downlight', wattIdx: 0, beamIdx: 2, share: 1.0 },
    ],
  },
  {
    id: 'lobby',
    name: 'Lobby',
    icon: '🏛',
    category: 'Hospitality',
    targetLux: 200,
    cct: '3000K',
    cri: 90,
    standard: 'EN 12464-1',
    description: 'Impressive entry scheme — ambient downlights for base, dramatic accent spots for feature elements, architectural cove strip.',
    tags: ['Feature Lighting', 'CRI 90+', 'DALI'],
    layers: [
      { type: 'ambient', label: 'Ambient Downlights',   fixtureId: 'cob-downlight',    wattIdx: 2, beamIdx: 2, share: 0.45 },
      { type: 'accent',  label: 'Feature Accents',      fixtureId: 'accent-spotlight', wattIdx: 2, beamIdx: 0, share: 0.30 },
      { type: 'cove',    label: 'Architectural Strip',  wattPerMeter: 12,               share: 0.25 },
    ],
  },
  {
    id: 'gym',
    name: 'Gym',
    icon: '💪',
    category: 'Commercial',
    targetLux: 300,
    cct: '5000K',
    cri: 80,
    standard: 'EN 12464-1',
    description: 'High-energy uniform illumination — cool white panels in a dense grid for shadow-free exercise spaces.',
    tags: ['5000K Daylight', 'High Uniformity', 'Energising'],
    layers: [
      { type: 'ambient', label: 'High-Power Panels', fixtureId: 'panel-light', wattIdx: 2, beamIdx: 0, share: 1.0 },
    ],
  },
  {
    id: 'meeting',
    name: 'Meeting Room',
    icon: '📊',
    category: 'Commercial',
    targetLux: 400,
    cct: '4000K',
    cri: 80,
    standard: 'EN 12464-1 · UGR ≤ 19',
    description: 'Glare-free, video-call-ready scheme — uniform panel grid meets UGR ≤ 19, accent track for whiteboard wall.',
    tags: ['UGR ≤ 19', 'Video-Ready', 'Uniform'],
    layers: [
      { type: 'ambient', label: 'Panel Grid',          fixtureId: 'panel-light', wattIdx: 2, beamIdx: 0, share: 0.85 },
      { type: 'accent',  label: 'Whiteboard Track',    fixtureId: 'track-light', wattIdx: 0, beamIdx: 1, share: 0.15 },
    ],
  },
]

// ── Layer type metadata (colours, icons) ──────────────────────────────────────
export const LAYER_META = {
  ambient: { color: '#d4a843', icon: '◎', label: 'Ambient' },
  accent:  { color: '#6ae5ff', icon: '★', label: 'Accent'  },
  linear:  { color: '#d4a843', icon: '━', label: 'Linear'  },
  cove:    { color: '#a78bfa', icon: '〰', label: 'Cove'    },
  task:    { color: '#3dba74', icon: '—', label: 'Task'    },
}

// ── Position helpers ──────────────────────────────────────────────────────────
function gridPositions(count, roomX, roomY, roomPxW, roomPxH) {
  const aspect = roomPxW / Math.max(roomPxH, 1)
  const cols = Math.max(1, Math.round(Math.sqrt(count * aspect)))
  const rows = Math.max(1, Math.ceil(count / cols))
  const pos = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols && pos.length < count; c++) {
      pos.push({
        x: roomX + ((c + 1) / (cols + 1)) * roomPxW,
        y: roomY + ((r + 1) / (rows + 1)) * roomPxH,
      })
    }
  }
  return pos
}

function linearPositions(count, roomX, roomY, roomPxW, roomPxH) {
  const pos = []
  const horizontal = roomPxW >= roomPxH
  for (let i = 0; i < count; i++) {
    pos.push(horizontal
      ? { x: roomX + ((i + 1) / (count + 1)) * roomPxW, y: roomY + roomPxH * 0.5 }
      : { x: roomX + roomPxW * 0.5,                     y: roomY + ((i + 1) / (count + 1)) * roomPxH }
    )
  }
  return pos
}

const ACCENT_PRESETS = {
  hotel:      (rx, ry, rw, rh) => [{ x: rx+rw*0.3, y: ry+Math.min(rh*0.12,28) }, { x: rx+rw*0.7, y: ry+Math.min(rh*0.12,28) }],
  bedroom:    (rx, ry, rw, rh) => [{ x: rx+rw*0.3, y: ry+Math.min(rh*0.12,28) }, { x: rx+rw*0.7, y: ry+Math.min(rh*0.12,28) }],
  restaurant: (rx, ry, rw, rh) => [
    { x: rx+rw*0.25, y: ry+rh*0.30 }, { x: rx+rw*0.75, y: ry+rh*0.30 },
    { x: rx+rw*0.25, y: ry+rh*0.70 }, { x: rx+rw*0.75, y: ry+rh*0.70 },
  ],
  lobby: (rx, ry, rw, rh) => [
    { x: rx+rw*0.20, y: ry+Math.min(rh*0.1,22) },
    { x: rx+rw*0.50, y: ry+Math.min(rh*0.1,22) },
    { x: rx+rw*0.80, y: ry+Math.min(rh*0.1,22) },
    { x: rx+rw*0.20, y: ry+rh-Math.min(rh*0.1,22) },
    { x: rx+rw*0.80, y: ry+rh-Math.min(rh*0.1,22) },
  ],
  retail:  (rx, ry, rw, rh) => [
    { x: rx+Math.min(rw*0.08,20), y: ry+rh*0.25 }, { x: rx+Math.min(rw*0.08,20), y: ry+rh*0.75 },
    { x: rx+rw-Math.min(rw*0.08,20), y: ry+rh*0.25 }, { x: rx+rw-Math.min(rw*0.08,20), y: ry+rh*0.75 },
  ],
  meeting: (rx, ry, rw, rh) => [{ x: rx+rw*0.5, y: ry+Math.min(rh*0.08,18) }],
  kitchen: (rx, ry, rw, rh) => [{ x: rx+rw*0.5, y: ry+rh*0.45 }],
  apartment:(rx, ry, rw, rh) => [{ x: rx+Math.min(rw*0.08,18), y: ry+rh*0.5 }, { x: rx+rw-Math.min(rw*0.08,18), y: ry+rh*0.5 }],
}

function accentPositions(spaceId, roomX, roomY, roomPxW, roomPxH) {
  const fn = ACCENT_PRESETS[spaceId]
  return fn
    ? fn(roomX, roomY, roomPxW, roomPxH)
    : [{ x: roomX+roomPxW*0.33, y: roomY+roomPxH*0.5 }, { x: roomX+roomPxW*0.67, y: roomY+roomPxH*0.5 }]
}

function coveStripPath(roomX, roomY, roomPxW, roomPxH) {
  const i = Math.min(18, roomPxW * 0.05, roomPxH * 0.05)
  return [
    { x: roomX+i,       y: roomY+i       },
    { x: roomX+roomPxW-i, y: roomY+i       },
    { x: roomX+roomPxW-i, y: roomY+roomPxH-i },
    { x: roomX+i,       y: roomY+roomPxH-i },
    { x: roomX+i,       y: roomY+i       },
  ]
}

function taskStripPath(spaceId, roomX, roomY, roomPxW, roomPxH) {
  if (spaceId === 'bathroom') {
    // Mirror strip — top wall, centred
    return [
      { x: roomX + roomPxW * 0.22, y: roomY + roomPxH * 0.10 },
      { x: roomX + roomPxW * 0.78, y: roomY + roomPxH * 0.10 },
    ]
  }
  // Under-cabinet / desk strip — along front of lower cabinets
  return [
    { x: roomX + roomPxW * 0.08, y: roomY + roomPxH * 0.82 },
    { x: roomX + roomPxW * 0.92, y: roomY + roomPxH * 0.82 },
  ]
}

function pickWattIdx(fixture, baseIdx, area_m2) {
  let idx = baseIdx
  if (area_m2 >= 30) idx = Math.min(idx + 1, fixture.wattages.length - 1)
  if (area_m2 < 12)  idx = Math.max(idx - 1, 0)
  return idx
}

// ── Main engine ───────────────────────────────────────────────────────────────
// Returns { layers, totalW, estimatedLux, compliance, area }
export function generateLightingDesign(
  space, roomW_m, roomL_m, ceilH_m,
  roomX, roomY, roomPxW, roomPxH, pxPerMeter
) {
  const area = roomW_m * roomL_m
  const UF   = 0.65   // utilisation factor
  const MF   = 0.80   // maintenance factor
  const totalRequiredLm = (space.targetLux * area) / (UF * MF)

  const computedLayers = []
  let totalW           = 0
  let totalEstimatedLm = 0

  for (const layerDef of space.layers) {
    const layerRequiredLm = totalRequiredLm * layerDef.share

    // ── Point-fixture layers (ambient / accent / linear) ─────────────────────
    if (['ambient', 'accent', 'linear'].includes(layerDef.type)) {
      const fixture = fixtureDatabase.find(f => f.id === layerDef.fixtureId) || fixtureDatabase[1]
      const wattIdx  = pickWattIdx(fixture, layerDef.wattIdx, area)
      const watt     = fixture.wattages[wattIdx]
      const beamIdx  = Math.min(layerDef.beamIdx, fixture.beamAngles.length - 1)
      const beamAngle = fixture.beamAngles[beamIdx]
      const lmPerFix  = watt * (fixture.lumensPerWatt || 100)

      let positions = []
      if (layerDef.type === 'ambient') {
        const count = Math.max(2, Math.ceil(layerRequiredLm / lmPerFix))
        positions   = gridPositions(count, roomX, roomY, roomPxW, roomPxH)
      } else if (layerDef.type === 'linear') {
        const count = Math.max(2, Math.ceil(layerRequiredLm / lmPerFix))
        positions   = linearPositions(count, roomX, roomY, roomPxW, roomPxH)
      } else {
        // accent — fixed preset positions
        positions = accentPositions(space.id, roomX, roomY, roomPxW, roomPxH)
      }

      const actualLm = positions.length * lmPerFix
      computedLayers.push({
        ...layerDef,
        fixture, watt, beamAngle,
        positions,
        count: positions.length,
        totalW: positions.length * watt,
        actualLm,
        lumensPerFixture: lmPerFix,
      })
      totalW           += positions.length * watt
      totalEstimatedLm += actualLm
    }

    // ── Cove / architectural strip ────────────────────────────────────────────
    if (layerDef.type === 'cove') {
      const path   = coveStripPath(roomX, roomY, roomPxW, roomPxH)
      const lenM   = 2 * (roomW_m + roomL_m) * 0.92
      const stripW = lenM * layerDef.wattPerMeter
      const lm     = stripW * 90   // ~90 lm/W for quality strip
      computedLayers.push({
        ...layerDef,
        stripPaths: [path],
        lenM,
        count: 1,
        totalW: stripW,
        actualLm: lm,
      })
      totalW           += stripW
      totalEstimatedLm += lm
    }

    // ── Task strip (under-cabinet / mirror) ───────────────────────────────────
    if (layerDef.type === 'task') {
      const path  = taskStripPath(space.id, roomX, roomY, roomPxW, roomPxH)
      const lenM  = space.id === 'bathroom' ? roomW_m * 0.55 : roomW_m * 0.84
      const stripW = lenM * layerDef.wattPerMeter
      const lm    = stripW * 90
      computedLayers.push({
        ...layerDef,
        stripPaths: [path],
        lenM,
        count: 1,
        totalW: stripW,
        actualLm: lm,
      })
      totalW           += stripW
      totalEstimatedLm += lm
    }
  }

  const estimatedLux = Math.round((totalEstimatedLm * UF * MF) / area)
  const compliance =
    estimatedLux >= space.targetLux * 1.10 ? 'OVERLIT'
    : estimatedLux >= space.targetLux * 0.95 ? 'COMPLIANT'
    : estimatedLux >= space.targetLux * 0.80 ? 'ACCEPTABLE'
    : 'BELOW TARGET'

  const complianceColor = {
    OVERLIT:      '#f59e0b',
    COMPLIANT:    '#3dba74',
    ACCEPTABLE:   '#6ae5ff',
    'BELOW TARGET':'#f44336',
  }[compliance]

  return {
    layers: computedLayers,
    totalW: Math.round(totalW),
    estimatedLux,
    compliance,
    complianceColor,
    area,
    UF, MF,
  }
}
