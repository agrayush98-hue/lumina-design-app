import { computeRoomGeometry } from "../utils/canvasConstants"

function mkFixture(id, mmX, mmY, geo, props) {
  const { x, y } = geo.mmToPx(mmX, mmY)
  return { id, x: Math.round(x), y: Math.round(y), ...props }
}

const DL12 = { fixtureId: "dl-12w-36",  label: "12W Downlight",   type: "downlight",  watt: 12, lumens: 950,  beamAngle: 36,  fill: "#ffe9b0", stroke: "#ffb300", glowColor: "rgba(255,179,0,0.10)",  visualRadius: 7  }
const PL18 = { fixtureId: "pl-18w-120", label: "18W Panel",        type: "panel",      watt: 18, lumens: 1800, beamAngle: 120, fill: "#d0eaff", stroke: "#4da6ff", glowColor: "rgba(77,166,255,0.10)", visualRadius: 13 }
const SP7  = { fixtureId: "sp-7w-26",   label: "7W Spotlight",     type: "spotlight",  watt: 7,  lumens: 550,  beamAngle: 26,  fill: "#ffd0a0", stroke: "#ff7c00", glowColor: "rgba(255,124,0,0.10)",  visualRadius: 5  }
const WW15 = { fixtureId: "ww-15w-60",  label: "15W Wall Washer",  type: "wallwasher", watt: 15, lumens: 1200, beamAngle: 60,  fill: "#c8f0ff", stroke: "#20c0f0", glowColor: "rgba(32,192,240,0.10)", visualRadius: 9  }
const DL7  = { fixtureId: "dl-7w-24",   label: "7W Mini Downlight",type: "downlight",  watt: 7,  lumens: 500,  beamAngle: 24,  fill: "#fff5c0", stroke: "#f0d000", glowColor: "rgba(240,208,0,0.10)",  visualRadius: 5  }

// ── Template 1: Office Conference Room ────────────────────────────────────────
function buildOfficeConference() {
  const geo = computeRoomGeometry(8000, 5000)
  const lights = [
    mkFixture(101, 1000, 1250, geo, { ...PL18 }),
    mkFixture(102, 3000, 1250, geo, { ...PL18 }),
    mkFixture(103, 5000, 1250, geo, { ...PL18 }),
    mkFixture(104, 7000, 1250, geo, { ...PL18 }),
    mkFixture(105, 1000, 3750, geo, { ...PL18 }),
    mkFixture(106, 3000, 3750, geo, { ...PL18 }),
    mkFixture(107, 5000, 3750, geo, { ...PL18 }),
    mkFixture(108, 7000, 3750, geo, { ...PL18 }),
  ]
  return {
    id: "office-conference",
    name: "Office Conference Room",
    description: "8×5m conference room with 18W panels, 500 lux, DALI protocol",
    icon: "◫",
    category: "Commercial",
    accentColor: "#4da6ff",
    floors: [{
      id: 1, name: "Floor 1", activeRoomId: 1, floorPlan: null,
      rooms: [{
        id: 1, name: "Conference Room",
        room: {
          roomWidth: 8000, roomHeight: 5000,
          ceilingHeight: 3.0, falseCeiling: 0.2, workingPlane: 0.8,
          targetLux: 500, fixtureLumens: 1800,
          ceilingReflectance: 0.7, wallReflectance: 0.5, floorReflectance: 0.2,
          roomProtocol: "DALI", roomType: "Conference Room",
        },
        lights,
        dbMarkers: [], ctrMarkers: [], jbMarkers: [], emergencyLights: [],
      }],
    }],
  }
}

// ── Template 2: Hotel Bedroom ─────────────────────────────────────────────────
function buildHotelBedroom() {
  const geo = computeRoomGeometry(5000, 4000)
  const lights = [
    mkFixture(201, 1000, 1000, geo, { ...DL7  }),
    mkFixture(202, 4000, 1000, geo, { ...DL7  }),
    mkFixture(203, 2500, 2000, geo, { ...DL12 }),
    mkFixture(204, 1000, 3000, geo, { ...DL7  }),
    mkFixture(205, 4000, 3000, geo, { ...DL7  }),
    mkFixture(206, 500,  2000, geo, { ...WW15 }),
    mkFixture(207, 4500, 2000, geo, { ...WW15 }),
  ]
  return {
    id: "hotel-bedroom",
    name: "Hotel Bedroom",
    description: "5×4m bedroom with warm downlights and wall washers, 200 lux",
    icon: "⬡",
    category: "Hospitality",
    accentColor: "#d4a843",
    floors: [{
      id: 1, name: "Floor 1", activeRoomId: 1, floorPlan: null,
      rooms: [{
        id: 1, name: "Bedroom",
        room: {
          roomWidth: 5000, roomHeight: 4000,
          ceilingHeight: 2.8, falseCeiling: 0.3, workingPlane: 0.8,
          targetLux: 200, fixtureLumens: 500,
          ceilingReflectance: 0.8, wallReflectance: 0.6, floorReflectance: 0.2,
          roomProtocol: "0-10V", roomType: "Hotel Bedroom",
        },
        lights,
        dbMarkers: [], ctrMarkers: [], jbMarkers: [], emergencyLights: [],
      }],
    }],
  }
}

// ── Template 3: Restaurant Dining ─────────────────────────────────────────────
function buildRestaurantDining() {
  const geo = computeRoomGeometry(10000, 8000)
  const lights = [
    mkFixture(301, 1667, 1333, geo, { ...SP7 }),
    mkFixture(302, 5000, 1333, geo, { ...SP7 }),
    mkFixture(303, 8333, 1333, geo, { ...SP7 }),
    mkFixture(304, 1667, 4000, geo, { ...SP7 }),
    mkFixture(305, 5000, 4000, geo, { ...SP7 }),
    mkFixture(306, 8333, 4000, geo, { ...SP7 }),
    mkFixture(307, 1667, 6667, geo, { ...SP7 }),
    mkFixture(308, 5000, 6667, geo, { ...SP7 }),
    mkFixture(309, 8333, 6667, geo, { ...SP7 }),
    mkFixture(310, 1000, 4000, geo, { ...WW15 }),
    mkFixture(311, 9000, 4000, geo, { ...WW15 }),
  ]
  return {
    id: "restaurant-dining",
    name: "Restaurant Dining",
    description: "10×8m dining area with warm spotlights and wall accents, 150 lux",
    icon: "◈",
    category: "Hospitality",
    accentColor: "#ff7c00",
    floors: [{
      id: 1, name: "Floor 1", activeRoomId: 1, floorPlan: null,
      rooms: [{
        id: 1, name: "Dining Area",
        room: {
          roomWidth: 10000, roomHeight: 8000,
          ceilingHeight: 3.5, falseCeiling: 0.4, workingPlane: 0.8,
          targetLux: 150, fixtureLumens: 550,
          ceilingReflectance: 0.6, wallReflectance: 0.5, floorReflectance: 0.15,
          roomProtocol: "PHASE-CUT", roomType: "Restaurant",
        },
        lights,
        dbMarkers: [], ctrMarkers: [], jbMarkers: [], emergencyLights: [],
      }],
    }],
  }
}

// ── Template 4: Retail Store ──────────────────────────────────────────────────
function buildRetailStore() {
  const geo = computeRoomGeometry(12000, 8000)
  const lights = []
  let id = 401
  for (let col = 0; col < 4; col++) {
    for (let row = 0; row < 3; row++) {
      lights.push(mkFixture(id++, 1500 + col * 3000, 1333 + row * 2667, geo, { ...DL12 }))
    }
  }
  lights.push(mkFixture(id++,   500, 2000, geo, { ...WW15 }))
  lights.push(mkFixture(id++,   500, 6000, geo, { ...WW15 }))
  lights.push(mkFixture(id++, 11500, 2000, geo, { ...WW15 }))
  lights.push(mkFixture(id++, 11500, 6000, geo, { ...WW15 }))
  return {
    id: "retail-store",
    name: "Retail Store",
    description: "12×8m retail floor with high-output downlights, 750 lux",
    icon: "◉",
    category: "Retail",
    accentColor: "#39c5cf",
    floors: [{
      id: 1, name: "Floor 1", activeRoomId: 1, floorPlan: null,
      rooms: [{
        id: 1, name: "Sales Floor",
        room: {
          roomWidth: 12000, roomHeight: 8000,
          ceilingHeight: 3.5, falseCeiling: 0.0, workingPlane: 0.8,
          targetLux: 750, fixtureLumens: 950,
          ceilingReflectance: 0.8, wallReflectance: 0.7, floorReflectance: 0.3,
          roomProtocol: "NON-DIM", roomType: "Retail",
        },
        lights,
        dbMarkers: [], ctrMarkers: [], jbMarkers: [], emergencyLights: [],
      }],
    }],
  }
}

export const PROJECT_TEMPLATES = [
  buildOfficeConference(),
  buildHotelBedroom(),
  buildRestaurantDining(),
  buildRetailStore(),
]

export function getTemplate(id) {
  return PROJECT_TEMPLATES.find(t => t.id === id) ?? null
}
