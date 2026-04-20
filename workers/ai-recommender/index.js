/**
 * Cloudflare Worker — Anthropic AI proxy for Lumina Design
 * Secret: ANTHROPIC_API_KEY  (set via: wrangler secret put ANTHROPIC_API_KEY)
 * ANTHROPIC_API_KEY never leaves this worker; it is NOT a VITE_ var.
 */

const ALLOWED_ORIGINS = [
  "https://lumina-design-rho.vercel.app",
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

function buildPrompt({ roomType, widthM, heightM, ceilM, ambiance, requirements }) {
  const area = (parseFloat(widthM) * parseFloat(heightM)).toFixed(1)
  return `You are an expert lighting designer. Recommend fixtures for:
Room Type: ${roomType}
Room Size: ${widthM}m x ${heightM}m (Area: ${area}m²)
Ceiling Height: ${ceilM}m
Ambiance: ${ambiance}
Special Requirements: ${requirements || "none"}

Respond in JSON only with this structure:
{
  "primary": {
    "type": "COB_DOWNLIGHT or SPOTLIGHT or PANEL or LINEAR or WALL_WASHER",
    "watt": number,
    "lumens": number,
    "beam": number,
    "quantity": number,
    "reason": "brief explanation"
  },
  "accent": {
    "type": "fixture type or null",
    "watt": number,
    "lumens": number,
    "beam": number,
    "quantity": number,
    "reason": "brief explanation"
  },
  "cct": "2700K or 3000K or 4000K or 6500K",
  "protocol": "NON-DIM or PHASE-CUT or DALI or ZIGBEE",
  "totalLoad": number,
  "luxEstimate": number,
  "designTip": "one sentence professional tip"
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
          max_tokens: 1024,
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
