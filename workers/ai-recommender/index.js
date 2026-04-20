/**
 * Cloudflare Worker — Anthropic AI proxy for Lumina Design
 * Secret: ANTHROPIC_API_KEY  (set via: wrangler secret put ANTHROPIC_API_KEY)
 * ANTHROPIC_API_KEY never leaves this worker; it is NOT a VITE_ var.
 */

const ALLOWED_ORIGINS = [
  "https://lumina-design-rho.vercel.app",
  "http://localhost:5173",
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

function buildPrompt({ spaceType, roomW, roomL, ceilH, targetLux, existingCount }) {
  return `You are an expert lighting designer following EN 12464-1 standards.

Room details:
- Space type: ${spaceType}
- Dimensions: ${roomW}m × ${roomL}m (area: ${(roomW * roomL).toFixed(1)} m²)
- Ceiling height: ${ceilH}m
- Target illuminance: ${targetLux} lux
- Existing fixtures already placed: ${existingCount}

Respond with ONLY valid JSON (no markdown, no explanation):
{
  "recommendation": "<2 sentence expert recommendation>",
  "fixtureType": "<fixture category e.g. LED Panel, LED Downlight, Linear LED>",
  "wattage": <number>,
  "lumens": <number>,
  "beamAngle": <number in degrees>,
  "cct": <number e.g. 3000>,
  "cri": <number e.g. 80>,
  "suggestedCount": <number>,
  "estimatedLux": <number>,
  "spacing": <suggested spacing in meters>,
  "mountingHeight": <number in meters>,
  "notes": "<1 sentence installation tip>"
}`
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") ?? ""
    const headers = corsHeaders(origin)

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers })
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

    const { spaceType, roomW, roomL, ceilH, targetLux = 300, existingCount = 0 } = body

    if (!spaceType || !roomW || !roomL || !ceilH) {
      return new Response(JSON.stringify({ error: "Missing required fields: spaceType, roomW, roomL, ceilH" }), {
        status: 400, headers: { ...headers, "Content-Type": "application/json" }
      })
    }

    const prompt = buildPrompt({ spaceType, roomW, roomL, ceilH, targetLux, existingCount })

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
          max_tokens: 512,
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

    let parsed
    try {
      parsed = JSON.parse(text)
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
