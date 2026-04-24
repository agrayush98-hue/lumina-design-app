/**
 * Cloudflare Worker — Anthropic AI proxy for Lumina Design
 * Secret: ANTHROPIC_API_KEY  (set via: wrangler secret put ANTHROPIC_API_KEY)
 * ANTHROPIC_API_KEY never leaves this worker; it is NOT a VITE_ var.
 */

const APP_SECRET_TOKEN = "X-App-Token"

function isAuthorized(request, env) {
  const token = request.headers.get(APP_SECRET_TOKEN)
  return token === env.APP_SECRET_TOKEN
}

const ALLOWED_ORIGINS = [
  'https://app.lightillumina.com',
  'https://lumina-design-app.vercel.app',
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:4173",
]

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages"
const MODEL = "claude-haiku-4-5-20251001"

function corsHeaders(origin) {
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}

// EN 12464-1 maintained illuminance targets per room type (standard reference values)
const ROOM_LUX = {
  "Kitchen": 500, "Office": 500, "Conference Room": 500, "Retail": 500,
  "Bathroom": 400, "Dining Room": 300, "Living Room": 300, "Hotel Lobby": 200,
  "Bedroom": 200, "Restaurant": 150, "Corridor": 150, "Warehouse": 200,
}

// Pure math — no fixture type decisions
function calcConstraints(widthM, heightM, roomType) {
  const w = parseFloat(widthM), h = parseFloat(heightM)
  const areaM2  = w * h
  const baseLux = ROOM_LUX[roomType] ?? 300
  const reqLm   = Math.ceil(baseLux * areaM2 * 1.3)

  const assumedLmPerFixture =
    areaM2 > 150 ? 6000 :
    areaM2 > 80  ? 4000 :
    areaM2 > 30  ? 2000 : 1200

  const minByLumens = Math.ceil(reqLm / (assumedLmPerFixture * 0.8))
  const maxSpacing  = areaM2 > 100 ? 3.0 : areaM2 > 50 ? 2.5 : 2.0
  const minBySpace  = Math.ceil(areaM2 / (maxSpacing * maxSpacing))
  const minQty      = Math.max(minByLumens, minBySpace, 1)
  const lmPerUnit   = Math.ceil(reqLm / minQty)

  return { areaM2: areaM2.toFixed(1), baseLux, reqLm, minQty, lmPerUnit }
}

function buildPrompt({ roomType, widthM, heightM, ceilM, ambiance, requirements }) {
  const c = calcConstraints(widthM, heightM, roomType)

  return `You are an expert architectural lighting designer. Study the examples, follow the rules, then design the lighting scheme.

════════════════════════════════════════
EXAMPLES — learn the exact pattern from these
════════════════════════════════════════

[Request] "wall washer in corner, COB as main light"
{"zones":[{"name":"Corner Accent","type":"WALL_WASHER","quantity":4,"placement":"corners","wattage":12,"lumens":900,"beam":75,"cct":"3000K","protocol":"DALI","reason":"Wall washers at 4 corners for dramatic accent"},{"name":"General Downlights","type":"COB_DOWNLIGHT","quantity":8,"placement":"grid","wattage":12,"lumens":900,"beam":60,"cct":"4000K","protocol":"DALI","reason":"COB downlights for uniform general lighting"}],"totalLoad":240,"luxEstimate":320,"designTip":"Layer warm 3000K accent with cool 4000K general for depth and dimension"}

[Request] "strip lights along walls for ambient mood"
{"zones":[{"name":"Perimeter Ambient Strips","type":"LED_STRIP","quantity":4,"placement":"perimeter","wattage":15,"lumens":1200,"beam":120,"cct":"3000K","protocol":"DALI","reason":"LED strips along all 4 walls for warm ambient glow"}],"totalLoad":60,"luxEstimate":120,"designTip":"Use aluminium diffuser channels on strips to soften harsh hotspots"}

[Request] "bright kitchen lighting"
{"zones":[{"name":"Kitchen Task Panels","type":"PANEL","quantity":8,"placement":"grid","wattage":36,"lumens":3600,"beam":120,"cct":"4000K","protocol":"TRIAC","reason":"High-output panels for uniform bright task lighting at 500 lux"}],"totalLoad":288,"luxEstimate":480,"designTip":"Add under-cabinet LED strips for prep area task lighting"}

[Request] "dimmable warm bedroom lighting"
{"zones":[{"name":"Bedroom Downlights","type":"COB_DOWNLIGHT","quantity":6,"placement":"grid","wattage":9,"lumens":810,"beam":60,"cct":"2700K","protocol":"DALI","reason":"Warm dimmable downlights for relaxing bedroom atmosphere"}],"totalLoad":54,"luxEstimate":180,"designTip":"Add a DALI scene controller for morning-wake and evening-relax presets"}

[Request] "office panels with accent spotlights"
{"zones":[{"name":"General Office Panels","type":"PANEL","quantity":12,"placement":"grid","wattage":36,"lumens":3600,"beam":120,"cct":"4000K","protocol":"DALI","reason":"Flat panels for uniform glare-free task lighting at 500 lux"},{"name":"Accent Spotlights","type":"SPOTLIGHT","quantity":6,"placement":"grid","wattage":10,"lumens":900,"beam":36,"cct":"3000K","protocol":"DALI","reason":"Spots to highlight features and break visual uniformity"}],"totalLoad":492,"luxEstimate":500,"designTip":"Aim accent spots at artwork or presentation walls at 30° from vertical"}

[Request] "warm restaurant with wall wash"
{"zones":[{"name":"Dining Downlights","type":"COB_DOWNLIGHT","quantity":10,"placement":"grid","wattage":9,"lumens":810,"beam":60,"cct":"2700K","protocol":"DALI","reason":"Warm downlights for intimate dining atmosphere"},{"name":"Wall Wash Accent","type":"WALL_WASHER","quantity":8,"placement":"perimeter","wattage":15,"lumens":1200,"beam":75,"cct":"2700K","protocol":"DALI","reason":"Wall washers to add visual warmth and perceived spaciousness"}],"totalLoad":210,"luxEstimate":175,"designTip":"Dim to 40% during dinner service for intimate atmosphere"}

[Request] "strip lights on side walls only"
{"zones":[{"name":"Side Cove Lighting","type":"LED_STRIP","quantity":2,"placement":"side-walls","wattage":15,"lumens":1200,"beam":120,"cct":"3000K","protocol":"DALI","reason":"LED strips along left and right walls for cove lighting effect"}],"totalLoad":30,"luxEstimate":80,"designTip":"Recess strips 200mm from ceiling in a cove for best light spread"}

[Request] "corridor linear battens"
{"zones":[{"name":"Corridor Linear Fittings","type":"LINEAR","quantity":4,"placement":"rows","wattage":36,"lumens":3600,"beam":120,"cct":"4000K","protocol":"NON-DIM","reason":"Linear battens in rows for uniform corridor illumination at 150 lux"}],"totalLoad":144,"luxEstimate":200,"designTip":"Align linear fittings with corridor axis for best UGR performance"}

[Request] "retail spotlights with perimeter wall wash"
{"zones":[{"name":"Display Spotlights","type":"SPOTLIGHT","quantity":12,"placement":"grid","wattage":15,"lumens":1200,"beam":24,"cct":"3000K","protocol":"TRIAC","reason":"Narrow spots to highlight merchandise and create focal points"},{"name":"Perimeter Wall Wash","type":"WALL_WASHER","quantity":8,"placement":"perimeter","wattage":18,"lumens":1440,"beam":75,"cct":"3000K","protocol":"TRIAC","reason":"Wall washers to illuminate perimeter displays and add depth"}],"totalLoad":324,"luxEstimate":420,"designTip":"Aim spots at 30° from vertical to minimise reflections on products"}

[Request] "four panels in corners minimal design"
{"zones":[{"name":"Corner Panels","type":"PANEL","quantity":4,"placement":"corners","wattage":24,"lumens":2400,"beam":120,"cct":"4000K","protocol":"TRIAC","reason":"Four panels at room corners for clean minimal aesthetic"}],"totalLoad":96,"luxEstimate":220,"designTip":"Choose frameless flush-mount panels for maximum minimal effect"}

════════════════════════════════════════
YOUR ROOM
════════════════════════════════════════

- Type: ${roomType}
- Size: ${widthM}m × ${heightM}m (${c.areaM2}m²)
- Ceiling: ${ceilM}m
- Ambiance: ${ambiance}
- Requirements: "${requirements || "none — use professional judgment"}"

MATH CONSTRAINTS (EN 12464-1 — general zone must satisfy):
- Base illuminance: ${c.baseLux} lux
- Minimum total lumens: ${c.reqLm} lm
- Minimum fixture count (general zone): ${c.minQty}
- Minimum lumens per fixture: ${c.lmPerUnit} lm

════════════════════════════════════════
FIXTURE TYPES (exact strings only)
════════════════════════════════════════

COB_DOWNLIGHT  recessed round downlight · 36–60° beam · general/task
SPOTLIGHT      adjustable directional · 24–36° beam · accent/retail
PANEL          flat recessed panel · 120° beam · uniform general
LINEAR         batten/strip fitting · 120° beam · rows/coves
WALL_WASHER    wide-beam wall wash · 75° beam · accent/drama
LED_STRIP      flexible tape · 120° beam · perimeter/cove

Natural language → type:
"strip/cove/tape"           → LED_STRIP
"downlight/recessed/can"    → COB_DOWNLIGHT
"panel/troffer/flat"        → PANEL
"spot/accent/track"         → SPOTLIGHT
"wall wash/wash light"      → WALL_WASHER
"linear/batten/tube"        → LINEAR

════════════════════════════════════════
PLACEMENT STRATEGIES (exact strings only)
════════════════════════════════════════

"grid"       — evenly spaced throughout (downlights, panels, spots)
"perimeter"  — along all 4 walls (LED_STRIP default, WALL_WASHER default)
"corners"    — EXACTLY 4 fixtures, one at each corner
"side-walls" — left and right walls only
"rows"       — linear rows across room (LINEAR default)

Natural language → placement:
"corner/corners"                 → "corners"   quantity = 4
"along walls/perimeter/edge/cove" → "perimeter"
"side/left and right"            → "side-walls"
"in rows/run across"             → "rows"
"throughout/fill/spread"         → "grid"
"main/general" (no location)     → "grid"

════════════════════════════════════════
HARD RULES — ALL MUST BE FOLLOWED
════════════════════════════════════════

1.  CORNER RULE     If user says "corner" → placement="corners", quantity=4. No exceptions.
2.  STRIP RULE      LED_STRIP → NEVER "grid". Use "perimeter", "side-walls", or "rows" only.
3.  WASHER RULE     WALL_WASHER → always beam=75, default placement="perimeter".
4.  PANEL CCT       PANEL → always cct="4000K" unless user explicitly says warm.
5.  SINGLE TYPE     If user requests exactly ONE fixture type → return ONE zone only.
6.  MULTI TYPE      If user mentions TWO types (e.g. "X and Y" / "X in corner, Y as main") → return TWO zones, one per type.
7.  DIMMABLE        "dimmable" or "dimming" in requirements → all zones use protocol="DALI".
8.  GENERAL ZONE    Zone 0 (general) must have quantity ≥ ${c.minQty} AND lumens×quantity ≥ ${c.reqLm}.
9.  WATTAGE CALC    wattage = round(lumens ÷ 90) to nearest 5W.
10. NO DUPLICATE    Never return two zones with the same "type" value.

════════════════════════════════════════
PARSE STEPS — follow in order
════════════════════════════════════════

Step 1  Extract every fixture type the user mentioned:
        "wall washer in corner, COB as main" → [WALL_WASHER, COB_DOWNLIGHT]

Step 2  For each type, assign placement from keywords:
        "corner" → "corners" (qty=4) | "wall/perimeter" → "perimeter" | "main/general" → "grid"

Step 3  Build one zone per type.

Step 4  VALIDATE before writing JSON:
        □ Any zone with placement="corners"? → quantity MUST equal 4
        □ Any LED_STRIP zone? → placement must NOT be "grid"
        □ All zones have unique types?
        □ Zone 0 satisfies math constraints?
        □ All fields present: name, type, quantity, placement, wattage, lumens, beam, cct, protocol, reason

════════════════════════════════════════
CCT & PROTOCOL
════════════════════════════════════════

CCT:       2700K=bedroom/restaurant  3000K=living/hospitality  4000K=kitchen/office  6500K=warehouse
Protocol:  NON-DIM=fixed  TRIAC=phase-cut dimming  DALI=professional  ZIGBEE=wireless

Ambiance effect:
"Bright & Functional" → 4000K–6500K, full lux, prefer PANEL/COB
"Warm & Cozy"         → 2700K–3000K, reduce qty ~25%, prefer COB/LED_STRIP
"Cool & Modern"       → 4000K, clean grid, prefer PANEL
"Dramatic & Accent"   → 2700K, reduce qty ~35%, use SPOTLIGHT

════════════════════════════════════════
OUTPUT — return ONLY this JSON, no markdown, no explanation
════════════════════════════════════════

{"zones":[{"name":"Zone Name","type":"TYPE_STRING","quantity":number,"placement":"placement_string","wattage":number,"lumens":number,"beam":number,"cct":"VALUE","protocol":"VALUE","reason":"one sentence"}],"totalLoad":number,"luxEstimate":number,"designTip":"one professional tip"}`
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") ?? ""
    const headers = corsHeaders(origin)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers })
    }

    if (!isAuthorized(request, env)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...headers, "Content-Type": "application/json" }
      })
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405, headers: { ...headers, "Content-Type": "application/json" }
      })
    }

    let body
    try {
      body = await request.json()
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400, headers: { ...headers, "Content-Type": "application/json" }
      })
    }

    const { roomType, widthM, heightM, ceilM, ambiance = "Bright & Functional", requirements = "" } = body

    if (!roomType || !widthM || !heightM || !ceilM) {
      return new Response(JSON.stringify({ error: "Missing required fields: roomType, widthM, heightM, ceilM" }), {
        status: 400, headers: { ...headers, "Content-Type": "application/json" }
      })
    }

    const prompt = buildPrompt({ roomType, widthM, heightM, ceilM, ambiance, requirements })

    let anthropicRes
    try {
      anthropicRes = await fetch(ANTHROPIC_API, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2000,
          messages: [{ role: "user", content: prompt }],
        }),
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: "Upstream request failed", detail: err.message }), {
        status: 502, headers: { ...headers, "Content-Type": "application/json" }
      })
    }

    if (!anthropicRes.ok) {
      const errText = await anthropicRes.text()
      return new Response(JSON.stringify({ error: "Anthropic API error", detail: errText }), {
        status: anthropicRes.status, headers: { ...headers, "Content-Type": "application/json" }
      })
    }

    const data = await anthropicRes.json()
    const text = data.content?.[0]?.text ?? ""

    const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()

    let parsed
    try {
      parsed = JSON.parse(jsonText)
    } catch {
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: text }), {
        status: 500, headers: { ...headers, "Content-Type": "application/json" }
      })
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" }
    })
  }
}
