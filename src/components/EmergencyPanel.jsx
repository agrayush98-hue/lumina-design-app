import React from "react"

const C = {
  bg:     "#0a1018",
  border: "#1a2b3c",
  green:  "#3dba74",
  label:  "#2d4f68",
  value:  "#4a7a96",
  accent: "#cdd9e5",
  red:    "#d94f4f",
}

export default function EmergencyPanel({ showEmergency, emergencyDuration, setEmergencyDuration, emergencyLuxResults }) {
  if (!showEmergency) return null
  const { compliant = false, worstPointLux = 0, fixtureCount = 0, totalWatt = 0 } = emergencyLuxResults ?? {}

  return (
    <div style={{
      width: 1400, background: C.bg, border: `1px solid ${C.border}`,
      borderRadius: 6, fontFamily: "IBM Plex Mono", fontSize: 10, flexShrink: 0,
    }}>
      {/* Header */}
      <div style={{ padding: "8px 14px", borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ color: C.green, letterSpacing: "0.14em", fontSize: 11, fontWeight: 600 }}>⚡ EMERGENCY LIGHTING</span>

        <div style={{ display: "flex", gap: 4, marginLeft: 12 }}>
          {["1hr", "3hr"].map(d => (
            <button
              key={d}
              onClick={() => setEmergencyDuration(d)}
              style={{
                padding: "2px 10px",
                background: emergencyDuration === d ? "#0a2010" : "transparent",
                border:     `1px solid ${emergencyDuration === d ? C.green : C.border}`,
                borderRadius: 3,
                color:   emergencyDuration === d ? C.green : C.label,
                fontFamily: "IBM Plex Mono", fontSize: 9, letterSpacing: "0.08em", cursor: "pointer",
              }}
            >{d === "1hr" ? "1 HOUR" : "3 HOUR"}</button>
          ))}
        </div>

        <div style={{
          marginLeft: "auto", padding: "3px 12px",
          background: compliant ? "#081a0e" : "#1a0808",
          border:     `1px solid ${compliant ? C.green : C.red}`,
          borderRadius: 3, color: compliant ? C.green : C.red,
          letterSpacing: "0.1em", fontSize: 10, fontWeight: 600,
        }}>
          {compliant ? "✓ COMPLIANT" : "✗ NON-COMPLIANT"}
        </div>
      </div>

      {/* Stats */}
      <div style={{
        display: "grid", gridTemplateColumns: "120px 120px 160px 1fr",
        padding: "10px 14px", borderBottom: `1px solid ${C.border}`, gap: 10,
      }}>
        <div>
          <div style={{ color: C.label, marginBottom: 3, fontSize: 9 }}>FIXTURES</div>
          <div style={{ color: C.accent, fontSize: 16 }}>{fixtureCount}</div>
        </div>
        <div>
          <div style={{ color: C.label, marginBottom: 3, fontSize: 9 }}>TOTAL LOAD</div>
          <div style={{ color: C.accent, fontSize: 16 }}>{totalWatt}W</div>
        </div>
        <div>
          <div style={{ color: C.label, marginBottom: 3, fontSize: 9 }}>WORST-POINT LUX</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: worstPointLux >= 1 ? C.green : C.red, fontSize: 16 }}>
              {worstPointLux.toFixed(2)} lx
            </span>
            <span style={{
              padding: "2px 7px", borderRadius: 3, fontSize: 9, fontWeight: 600, letterSpacing: "0.08em",
              background: worstPointLux >= 1 ? "#081a0e" : "#1a0808",
              border:     `1px solid ${worstPointLux >= 1 ? C.green : C.red}`,
              color:      worstPointLux >= 1 ? C.green : C.red,
            }}>
              {worstPointLux >= 1 ? "✓ COMPLIANT" : "✗ NON-COMPLIANT"}
            </span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", color: C.label, fontSize: 9, gap: 8 }}>
          <span>Min. 1 lux at floor level required · NBC / IS 3646</span>
          {fixtureCount === 0 && (
            <span style={{ color: "#e8a830", marginLeft: 6 }}>→ Click EMERGENCY in toolbar, then click canvas to place fixtures. Dbl-click to remove.</span>
          )}
        </div>
      </div>

      {/* Spec footer */}
      <div style={{ padding: "5px 14px", color: C.label, fontSize: 9, letterSpacing: "0.05em" }}>
        SPEC · Emergency Fitting: 8W · 800 lm · 120° beam · Battery-backed self-contained ·
        Duration: {emergencyDuration === "1hr" ? "1 hour (maintained)" : "3 hours (maintained)"}
      </div>
    </div>
  )
}
