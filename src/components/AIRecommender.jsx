import { useState } from "react"
import { resolveFixture, CATEGORY_VISUAL } from "../data/fixtureLibrary"

// ── Constants ─────────────────────────────────────────────────────────────────

const ROOM_TYPES = [
  "Living Room", "Bedroom", "Kitchen", "Bathroom", "Office",
  "Hotel Lobby", "Restaurant", "Retail", "Corridor", "Warehouse",
]

const AMBIANCE_OPTIONS = [
  "Bright & Functional",
  "Warm & Cozy",
  "Cool & Modern",
  "Dramatic & Accent",
]

const CCT_COLORS = {
  "2700K": "#ffaa44",
  "3000K": "#ffcc66",
  "4000K": "#ffe8b0",
  "6500K": "#e8f4ff",
}

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  overlay: {
    position: "fixed", inset: 0, zIndex: 9000,
    background: "rgba(0,0,0,0.85)",
    display: "flex", alignItems: "center", justifyContent: "center",
  },
  card: {
    width: 500, maxHeight: "90vh", overflowY: "auto",
    background: "#1a1a1a", border: "1px solid #2e2e2e",
    borderRadius: 8, fontFamily: "IBM Plex Mono",
    display: "flex", flexDirection: "column",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 18px 12px",
    borderBottom: "1px solid #2e2e2e",
  },
  title: {
    fontSize: 13, fontWeight: 600, letterSpacing: "0.1em",
    color: "#d4a843",
  },
  closeBtn: {
    background: "none", border: "none", color: "#555",
    fontSize: 18, cursor: "pointer", lineHeight: 1, padding: "0 2px",
  },
  body: { padding: "14px 18px 18px", display: "flex", flexDirection: "column", gap: 10 },
  label: { fontSize: 10, color: "#666", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 3 },
  select: {
    width: "100%", background: "#111", border: "1px solid #2e2e2e",
    color: "#d0d0d0", fontFamily: "IBM Plex Mono", fontSize: 12,
    padding: "6px 10px", borderRadius: 4, outline: "none",
  },
  input: {
    width: "100%", background: "#111", border: "1px solid #2e2e2e",
    color: "#d0d0d0", fontFamily: "IBM Plex Mono", fontSize: 12,
    padding: "6px 10px", borderRadius: 4, outline: "none", boxSizing: "border-box",
  },
  row2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
  infoBox: {
    background: "#111", border: "1px solid #222", borderRadius: 4,
    padding: "6px 10px", fontSize: 12, color: "#888",
  },
  getBtn: {
    marginTop: 4, padding: "9px 0", background: "#1a1500",
    border: "1px solid #d4a843", borderRadius: 4,
    color: "#d4a843", fontFamily: "IBM Plex Mono", fontSize: 12,
    letterSpacing: "0.08em", cursor: "pointer", fontWeight: 600,
    transition: "background 0.15s",
  },
  spinner: {
    display: "flex", alignItems: "center", justifyContent: "center",
    padding: "30px 0", color: "#555", fontSize: 12, gap: 10,
  },
  errorBox: {
    background: "#1a0a0a", border: "1px solid #5a2222", borderRadius: 4,
    padding: "10px 12px", color: "#e05252", fontSize: 11,
  },
  section: { marginTop: 4 },
  sectionTitle: {
    fontSize: 10, color: "#555", letterSpacing: "0.1em",
    textTransform: "uppercase", marginBottom: 6,
  },
  fixtureCard: {
    background: "#111", border: "1px solid #2a2a2a", borderRadius: 6,
    padding: "10px 12px", marginBottom: 8,
  },
  fixtureType: { fontSize: 13, color: "#d4a843", fontWeight: 600, marginBottom: 4 },
  fixtureRow: { display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 4 },
  fixtureVal: { fontSize: 11, color: "#888" },
  fixtureValBold: { fontSize: 11, color: "#c0c0c0", fontWeight: 600 },
  fixtureReason: { fontSize: 11, color: "#666", fontStyle: "italic", marginTop: 4 },
  metaGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 8,
  },
  metaItem: {
    background: "#111", border: "1px solid #222", borderRadius: 4,
    padding: "7px 10px",
  },
  metaLabel: { fontSize: 10, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase" },
  metaValue: { fontSize: 13, color: "#c0c0c0", fontWeight: 600, marginTop: 2 },
  designTip: {
    background: "#12100a", border: "1px solid #2a2200", borderRadius: 4,
    padding: "9px 12px", fontSize: 11, color: "#d4a843",
    fontStyle: "italic", lineHeight: 1.5,
  },
  applyBtn: {
    width: "100%", padding: "8px 0",
    background: "#1a1500", border: "1px solid #d4a843", borderRadius: 4,
    color: "#d4a843", fontFamily: "IBM Plex Mono", fontSize: 11,
    letterSpacing: "0.06em", cursor: "pointer", fontWeight: 600,
    marginTop: 4,
  },
  applyBtnSecondary: {
    width: "100%", padding: "8px 0",
    background: "transparent", border: "1px solid #2e2e2e", borderRadius: 4,
    color: "#888", fontFamily: "IBM Plex Mono", fontSize: 11,
    letterSpacing: "0.06em", cursor: "pointer",
    marginTop: 6,
  },
  divider: { borderTop: "1px solid #2e2e2e", margin: "10px 0" },
}

// ── Build a placeable fixture object from API result ──────────────────────────

function buildFixture(rec, cct) {
  // Normalize API type → our category key
  const categoryMap = {
    COB_DOWNLIGHT: "COB_DOWNLIGHT",
    SPOTLIGHT:     "SPOTLIGHT",
    PANEL:         "PANEL",
    LINEAR:        "LINEAR",
    WALL_WASHER:   "WALL_WASHER",
  }
  const category = categoryMap[rec.type] ?? "COB_DOWNLIGHT"
  const id = `ai-${category.toLowerCase()}-${rec.watt}w-${Date.now()}`
  return resolveFixture({
    id,
    category,
    name: `${rec.type.replace(/_/g, " ")} ${rec.watt}W (AI)`,
    watt:      rec.watt,
    lumens:    rec.lumens,
    beamAngle: rec.beam,
    cct:       cct ?? "3000K",
    tunable:   false,
    voltage:   230,
  })
}

// ── FixtureResultCard ─────────────────────────────────────────────────────────

function FixtureResultCard({ label, rec }) {
  return (
    <div style={S.fixtureCard}>
      <div style={S.fixtureType}>{label} · {rec.type.replace(/_/g, " ")}</div>
      <div style={S.fixtureRow}>
        <span style={S.fixtureVal}>Watt: <span style={S.fixtureValBold}>{rec.watt}W</span></span>
        <span style={S.fixtureVal}>Lumens: <span style={S.fixtureValBold}>{rec.lumens} lm</span></span>
        <span style={S.fixtureVal}>Beam: <span style={S.fixtureValBold}>{rec.beam}°</span></span>
        <span style={S.fixtureVal}>Qty: <span style={S.fixtureValBold}>{rec.quantity}</span></span>
      </div>
      {rec.reason && <div style={S.fixtureReason}>"{rec.reason}"</div>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function AIRecommender({ activeRoom, onApplyFixture, onClose }) {
  const widthM  = activeRoom ? (Number(activeRoom.roomWidth)  / 1000).toFixed(1) : "0"
  const heightM = activeRoom ? (Number(activeRoom.roomHeight) / 1000).toFixed(1) : "0"
  const ceilM   = activeRoom ? Number(activeRoom.ceilingHeight).toFixed(1) : "2.8"

  const [roomType,      setRoomType]      = useState(ROOM_TYPES[0])
  const [ambiance,      setAmbiance]      = useState(AMBIANCE_OPTIONS[0])
  const [requirements,  setRequirements]  = useState("")
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [result,        setResult]        = useState(null)

  async function handleGetRecommendations() {
    setLoading(true)
    setError(null)
    setResult(null)

    const area = (parseFloat(widthM) * parseFloat(heightM)).toFixed(1)

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1024,
          messages: [{
            role: "user",
            content: `You are an expert lighting designer. Recommend fixtures for:
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
}`,
          }],
        }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error?.message ?? `HTTP ${response.status}`)
      }

      const data = await response.json()
      const text = data.content?.[0]?.text ?? ""

      // Strip markdown code fences if present
      const jsonText = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
      const parsed = JSON.parse(jsonText)
      setResult(parsed)
    } catch (e) {
      setError(e.message ?? "API request failed")
    } finally {
      setLoading(false)
    }
  }

  function handleApply(rec) {
    const fixture = buildFixture(rec, result?.cct)
    onApplyFixture(fixture)
  }

  const hasAccent = result?.accent?.type && result.accent.type !== "null" && result.accent.type !== null

  return (
    <div style={S.overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={S.card}>

        {/* Header */}
        <div style={S.header}>
          <span style={S.title}>AI FIXTURE RECOMMENDER</span>
          <button style={S.closeBtn} onClick={onClose} title="Close">×</button>
        </div>

        <div style={S.body}>

          {/* Form */}
          <div>
            <div style={S.label}>Room Type</div>
            <select style={S.select} value={roomType} onChange={e => setRoomType(e.target.value)}>
              {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>

          <div style={S.row2}>
            <div>
              <div style={S.label}>Room Size</div>
              <div style={S.infoBox}>{widthM}m × {heightM}m</div>
            </div>
            <div>
              <div style={S.label}>Ceiling Height</div>
              <div style={S.infoBox}>{ceilM}m</div>
            </div>
          </div>

          <div>
            <div style={S.label}>Ambiance</div>
            <select style={S.select} value={ambiance} onChange={e => setAmbiance(e.target.value)}>
              {AMBIANCE_OPTIONS.map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          <div>
            <div style={S.label}>Special Requirements</div>
            <input
              style={S.input}
              type="text"
              placeholder="e.g. dimmable, energy efficient, DALI"
              value={requirements}
              onChange={e => setRequirements(e.target.value)}
            />
          </div>

          <button
            style={S.getBtn}
            onClick={handleGetRecommendations}
            disabled={loading}
            onMouseEnter={e => { e.currentTarget.style.background = "#2a2000" }}
            onMouseLeave={e => { e.currentTarget.style.background = "#1a1500" }}
          >
            {loading ? "ANALYSING…" : "GET RECOMMENDATIONS"}
          </button>

          {/* Loading */}
          {loading && (
            <div style={S.spinner}>
              <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>◌</span>
              Consulting AI lighting designer…
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={S.errorBox}>
              Error: {error}
            </div>
          )}

          {/* Results */}
          {result && !loading && (
            <>
              <div style={S.divider} />

              <div style={S.sectionTitle}>Recommended Fixtures</div>

              <FixtureResultCard label="Primary" rec={result.primary} />
              {hasAccent && <FixtureResultCard label="Accent" rec={result.accent} />}

              {/* Meta grid */}
              <div style={S.metaGrid}>
                <div style={S.metaItem}>
                  <div style={S.metaLabel}>CCT</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{
                      width: 10, height: 10, borderRadius: "50%",
                      background: CCT_COLORS[result.cct] ?? "#fff",
                      flexShrink: 0,
                    }} />
                    <span style={S.metaValue}>{result.cct}</span>
                  </div>
                </div>
                <div style={S.metaItem}>
                  <div style={S.metaLabel}>Protocol</div>
                  <div style={S.metaValue}>{result.protocol}</div>
                </div>
                <div style={S.metaItem}>
                  <div style={S.metaLabel}>Total Load</div>
                  <div style={S.metaValue}>{result.totalLoad}W</div>
                </div>
                <div style={S.metaItem}>
                  <div style={S.metaLabel}>Est. Lux</div>
                  <div style={S.metaValue}>{result.luxEstimate} lx</div>
                </div>
              </div>

              {/* Design tip */}
              {result.designTip && (
                <div style={S.designTip}>💡 {result.designTip}</div>
              )}

              {/* Apply buttons */}
              <button
                style={S.applyBtn}
                onClick={() => handleApply(result.primary)}
                onMouseEnter={e => { e.currentTarget.style.background = "#2a2000" }}
                onMouseLeave={e => { e.currentTarget.style.background = "#1a1500" }}
              >
                APPLY PRIMARY FIXTURE
              </button>
              {hasAccent && (
                <button
                  style={S.applyBtnSecondary}
                  onClick={() => handleApply(result.accent)}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "#555"; e.currentTarget.style.color = "#d0d0d0" }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "#2e2e2e"; e.currentTarget.style.color = "#888" }}
                >
                  APPLY ACCENT FIXTURE
                </button>
              )}
            </>
          )}

        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
