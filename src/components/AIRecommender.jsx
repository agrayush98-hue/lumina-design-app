import { useState } from "react"
import { resolveFixture, CATEGORY_VISUAL } from "../data/fixtureLibrary"

// ── Constants ─────────────────────────────────────────────────────────────────

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

// ── Map AI type strings → fixture categories ──────────────────────────────────
// Handles both the exact types we teach Claude and any aliases it might use

const CATEGORY_MAP = {
  COB_DOWNLIGHT:    "COB_DOWNLIGHT",
  SPOTLIGHT:        "SPOTLIGHT",
  PANEL:            "PANEL",
  LINEAR:           "LINEAR",
  WALL_WASHER:      "WALL_WASHER",
  LED_STRIP:        "LED_STRIP",
  // Common aliases Claude may use
  DOWNLIGHT:        "COB_DOWNLIGHT",
  STRIP:            "LED_STRIP",
  WASHER:           "WALL_WASHER",
  TRACK:            "SPOTLIGHT",
  BATTEN:           "LINEAR",
  COVE:             "LED_STRIP",
}

// ── Per-type accent colours ───────────────────────────────────────────────────

const TYPE_COLOR = {
  COB_DOWNLIGHT: "#d4a843",
  SPOTLIGHT:     "#f09a3e",
  PANEL:         "#60b8f0",
  LINEAR:        "#3dba74",
  WALL_WASHER:   "#a78bfa",
  LED_STRIP:     "#e879f9",
}

// ── Build a placeable fixture object from an AI zone record ──────────────────

function buildFixture(zone) {
  const category  = CATEGORY_MAP[zone.type] ?? "COB_DOWNLIGHT"
  const watt      = zone.wattage ?? zone.watt ?? 10
  const id        = `ai-${category.toLowerCase()}-${watt}w-${Date.now()}-${Math.random().toString(36).slice(2,6)}`
  // Placement: use AI's decision, fall back to sensible defaults per category
  const placement = zone.placement
    ?? (category === "LED_STRIP" || category === "WALL_WASHER" ? "perimeter"
      : category === "LINEAR" ? "rows" : "grid")
  return resolveFixture({
    id,
    category,
    name:      zone.name ?? `${zone.type.replace(/_/g, " ")} ${watt}W (AI)`,
    watt,
    lumens:    zone.lumens   ?? Math.round(watt * 90),
    beamAngle: zone.beam     ?? 60,
    cct:       zone.cct      ?? "3000K",
    tunable:   false,
    voltage:   230,
    placement,
  })
}

// ── FixtureZoneCard ───────────────────────────────────────────────────────────

function FixtureZoneCard({ zone, onApply }) {
  const cat      = CATEGORY_MAP[zone.type] ?? zone.type
  const color    = TYPE_COLOR[cat] ?? "#888"
  const cctDot   = CCT_COLORS[zone.cct] ?? "#fff"
  const watt     = zone.wattage ?? zone.watt ?? "?"
  return (
    <div style={{ ...S.fixtureCard, borderColor: color + "44" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color, fontWeight: 600, marginBottom: 2 }}>
            {zone.name ?? zone.type.replace(/_/g, " ")}
          </div>
          <div style={{ fontSize: 9, color: "#555", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {zone.type.replace(/_/g, " ")} · {watt}W · {zone.placement ?? "grid"}
          </div>
        </div>
        <button
          style={{ ...S.applyBtnSecondary, width: "auto", padding: "3px 10px",
            marginTop: 0, fontSize: 10, flexShrink: 0, marginLeft: 8,
            borderColor: color + "66", color }}
          onClick={() => onApply(zone)}
          onMouseEnter={e => { e.currentTarget.style.background = color + "18" }}
          onMouseLeave={e => { e.currentTarget.style.background = "transparent" }}
        >
          PLACE
        </button>
      </div>
      <div style={S.fixtureRow}>
        <span style={S.fixtureVal}><span style={S.fixtureValBold}>{zone.quantity}</span> fix</span>
        <span style={S.fixtureVal}><span style={S.fixtureValBold}>{zone.lumens}</span> lm</span>
        {zone.beam && <span style={S.fixtureVal}><span style={S.fixtureValBold}>{zone.beam}°</span></span>}
        <span style={{ ...S.fixtureVal, display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: cctDot, flexShrink: 0 }} />
          {zone.cct}
        </span>
        {zone.protocol && zone.protocol !== "NON-DIM" && (
          <span style={{ ...S.fixtureVal, color: "#60b8f0" }}>{zone.protocol}</span>
        )}
      </div>
      {zone.reason && <div style={S.fixtureReason}>"{zone.reason}"</div>}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const ROOM_TYPES = [
  "Living Room", "Kitchen", "Bedroom", "Bathroom", "Office",
  "Corridor", "Dining Room", "Conference Room",
]

export default function AIRecommender({ activeRoom, onApplyFixture, onApplyAll, onClose, panelMode = false }) {
  const widthM  = activeRoom ? (Number(activeRoom.roomWidth)  / 1000).toFixed(1) : "0"
  const heightM = activeRoom ? (Number(activeRoom.roomHeight) / 1000).toFixed(1) : "0"
  const ceilM   = activeRoom ? Number(activeRoom.ceilingHeight).toFixed(1) : "2.8"

  const [roomType,      setRoomType]      = useState(activeRoom?.roomType ?? "Living Room")
  const [ambiance,      setAmbiance]      = useState(AMBIANCE_OPTIONS[0])
  const [requirements,  setRequirements]  = useState("")
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState(null)
  const [result,        setResult]        = useState(null)
  const [applied,       setApplied]       = useState(null)  // { count, zones }

  async function handleGetRecommendations() {
    setLoading(true)
    setError(null)
    setResult(null)
    setApplied(null)

    const workerUrl = import.meta.env.VITE_AI_WORKER_URL
    if (!workerUrl) {
      setError("AI worker not configured. Set VITE_AI_WORKER_URL in .env")
      setLoading(false)
      return
    }

    try {
      const response = await fetch(workerUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomType, widthM, heightM, ceilM, ambiance, requirements }),
      })

      if (!response.ok) {
        const err = await response.json().catch(() => ({}))
        throw new Error(err?.error ?? `HTTP ${response.status}`)
      }

      const parsed = await response.json()
      setResult(parsed)
    } catch (e) {
      setError(e.message ?? "API request failed")
    } finally {
      setLoading(false)
    }
  }

  function handleApplyZone(zone) {
    const fixture = buildFixture(zone)
    const watt    = zone.wattage ?? zone.watt ?? "?"
    const count   = onApplyFixture(fixture, zone.quantity ?? 1)
    setApplied({ count: count ?? zone.quantity, zones: 1, label: `${zone.quantity} × ${zone.type.replace(/_/g, " ")} ${watt}W` })
  }

  function handleApplyAll() {
    if (!result?.zones?.length) return
    const count = onApplyAll(result.zones.map(z => ({ fixture: buildFixture(z), quantity: z.quantity ?? 1 })))
    const total = result.zones.reduce((s, z) => s + (z.quantity ?? 0), 0)
    setApplied({ count: count ?? total, zones: result.zones.length, label: null })
  }

  const zones = result?.zones ?? []

  const cardStyle = panelMode
    ? { width: "100%", flex: 1, background: "transparent", border: "none",
        borderRadius: 0, fontFamily: "IBM Plex Mono",
        display: "flex", flexDirection: "column", overflowY: "auto" }
    : S.card

  return (
    <div
      style={panelMode ? { display: "flex", flexDirection: "column", flex: 1, minHeight: 0 } : S.overlay}
      onClick={panelMode ? undefined : e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={cardStyle}>

        {/* Header — hidden in panel mode (tab bar serves as header) */}
        {!panelMode && (
          <div style={S.header}>
            <span style={S.title}>AI FIXTURE RECOMMENDER</span>
            <button style={S.closeBtn} onClick={onClose} title="Close">×</button>
          </div>
        )}

        <div style={S.body}>

          {/* Form */}
          <div>
            <div style={{ ...S.label, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Room Type</span>
              <span style={{ color: "#444", fontSize: 9 }}>from settings</span>
            </div>
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
          {result && !loading && zones.length > 0 && (
            <>
              <div style={S.divider} />
              <div style={S.sectionTitle}>Lighting Zones ({zones.length})</div>

              {zones.map((zone, i) => (
                <FixtureZoneCard key={i} zone={zone} onApply={handleApplyZone} />
              ))}

              {/* Meta grid */}
              <div style={S.metaGrid}>
                <div style={S.metaItem}>
                  <div style={S.metaLabel}>Total Load</div>
                  <div style={S.metaValue}>{result.totalLoad}W</div>
                </div>
                <div style={S.metaItem}>
                  <div style={S.metaLabel}>Est. Lux</div>
                  <div style={S.metaValue}>{result.luxEstimate} lx</div>
                </div>
                <div style={S.metaItem}>
                  <div style={S.metaLabel}>Fixtures</div>
                  <div style={S.metaValue}>{zones.reduce((s, z) => s + (z.quantity ?? 0), 0)} total</div>
                </div>
                <div style={S.metaItem}>
                  <div style={S.metaLabel}>Zones</div>
                  <div style={S.metaValue}>{zones.length}</div>
                </div>
              </div>

              {/* Design tip */}
              {result.designTip && (
                <div style={S.designTip}>💡 {result.designTip}</div>
              )}

              {/* Applied confirmation */}
              {applied && (
                <div style={{
                  background: "#0a1f0a", border: "1px solid #2a5a2a", borderRadius: 4,
                  padding: "9px 12px", fontSize: 11, color: "#3dba74",
                  display: "flex", alignItems: "center", gap: 8,
                }}>
                  <span>✓</span>
                  <span>
                    {applied.label
                      ? `Applied ${applied.label} to canvas`
                      : `Applied ${applied.count} fixtures across ${applied.zones} zones to canvas`}
                  </span>
                </div>
              )}

              {/* Apply all */}
              <button
                style={S.applyBtn}
                onClick={handleApplyAll}
                onMouseEnter={e => { e.currentTarget.style.background = "#2a2000" }}
                onMouseLeave={e => { e.currentTarget.style.background = "#1a1500" }}
              >
                APPLY ALL ZONES ({zones.reduce((s, z) => s + (z.quantity ?? 0), 0)} fixtures)
              </button>
            </>
          )}

        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
