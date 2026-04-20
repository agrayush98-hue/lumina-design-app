import React from "react"

const C = {
  bg:      "#0a1018",
  bgAlt:   "#0d1520",
  border:  "#1a2b3c",
  label:   "#2d4f68",
  value:   "#cdd9e5",
  dim:     "#4a7a96",
  accent:  "#39c5cf",
}

const COLS_FULL  = "1fr 70px 70px 70px 120px 90px 90px 80px"
const COLS_NODALI = "1fr 70px 70px 70px 120px"

export default function ElectricalSummary({ perRoomSummary, daliEnabled, totalBuses, totalCableM }) {
  const hasAnyFixtures = perRoomSummary.some(r => r.fixtures > 0)
  if (!hasAnyFixtures) return null

  const showDali = daliEnabled

  const cols = showDali ? COLS_FULL : COLS_NODALI

  const totalFixtures = perRoomSummary.reduce((s, r) => s + r.fixtures, 0)
  const totalLoad     = perRoomSummary.reduce((s, r) => s + r.load, 0)
  const totalCircuits = perRoomSummary.reduce((s, r) => s + r.circuitCount, 0)
  const allPhases     = [...new Set(perRoomSummary.flatMap(r => r.phasesUsed))]

  return (
    <div style={{
      width: 1000,
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: 6,
      fontFamily: "IBM Plex Mono",
      fontSize: 10,
      flexShrink: 0,
      marginTop: 8,
    }}>
      {/* Section header */}
      <div style={{
        padding: "7px 14px",
        borderBottom: `1px solid ${C.border}`,
        color: C.accent,
        letterSpacing: "0.12em",
        fontSize: 10,
      }}>
        ELECTRICAL SUMMARY
      </div>

      {/* Section 1 header */}
      <div style={{
        padding: "5px 14px 3px",
        color: C.label,
        letterSpacing: "0.1em",
        fontSize: 9,
      }}>
        PER ROOM
      </div>

      {/* Column headers */}
      <div style={{
        display: "grid",
        gridTemplateColumns: cols,
        padding: "4px 14px",
        borderBottom: `1px solid ${C.border}`,
        color: C.label,
        letterSpacing: "0.08em",
        gap: 8,
      }}>
        <span>ROOM</span>
        <span>FIXTURES</span>
        <span>LOAD (W)</span>
        <span>CIRCUITS</span>
        <span>PHASES USED</span>
        {showDali && <span>DALI BUS</span>}
        {showDali && <span>TOPOLOGY</span>}
        {showDali && <span>CABLE (m)</span>}
      </div>

      {/* Room rows */}
      {perRoomSummary.map((r, i) => (
        <div
          key={r.name}
          style={{
            display: "grid",
            gridTemplateColumns: cols,
            padding: "5px 14px",
            background: i % 2 === 0 ? C.bg : C.bgAlt,
            borderBottom: `1px solid #0b1420`,
            alignItems: "center",
            gap: 8,
          }}
        >
          <span style={{ color: C.value }}>{r.name}</span>
          <span style={{ color: r.fixtures > 0 ? C.value : C.dim }}>{r.fixtures}</span>
          <span style={{ color: C.dim }}>{r.load}</span>
          <span style={{ color: C.dim }}>{r.circuitCount}</span>
          <span style={{ color: C.dim }}>
            {r.phasesUsed.length > 0 ? r.phasesUsed.join("+") : "—"}
          </span>
          {showDali && (
            <span style={{ color: C.dim }}>
              {r.daliBusNums.length > 0 ? r.daliBusNums.join("+") : "—"}
            </span>
          )}
          {showDali && (
            <span style={{ color: C.dim, textTransform: "capitalize" }}>
              {r.topologies.length > 0 ? r.topologies.join("/") : "—"}
            </span>
          )}
          {showDali && (
            <span style={{
              color: r.noCtr ? C.label : r.cableM != null ? "#3dba74" : C.label,
              fontStyle: r.noCtr ? "italic" : "normal",
            }}>
              {r.noCtr ? "No CTR" : r.cableM != null ? r.cableM.toFixed(1) : "—"}
            </span>
          )}
        </div>
      ))}

      {/* Section 2 — Project Totals */}
      <div style={{
        padding: "5px 14px 3px",
        borderTop: `1px solid ${C.border}`,
        color: C.label,
        letterSpacing: "0.1em",
        fontSize: 9,
        marginTop: 2,
      }}>
        PROJECT TOTALS
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: cols,
        padding: "6px 14px",
        background: "#0b1824",
        borderTop: `1px solid #0f2030`,
        alignItems: "center",
        gap: 8,
      }}>
        <span style={{ color: C.accent, letterSpacing: "0.05em" }}>
          {perRoomSummary.length} room{perRoomSummary.length !== 1 ? "s" : ""}
        </span>
        <span style={{ color: C.value }}>{totalFixtures}</span>
        <span style={{ color: C.value }}>{totalLoad}</span>
        <span style={{ color: C.value }}>{totalCircuits}</span>
        <span style={{ color: C.value }}>
          {allPhases.length > 0 ? allPhases.join("+") : "—"}
        </span>
        {showDali && (
          <span style={{ color: C.value }}>
            {totalBuses > 0 ? `${totalBuses} bus${totalBuses !== 1 ? "es" : ""}` : "—"}
          </span>
        )}
        {showDali && <span style={{ color: C.dim }}>—</span>}
        {showDali && (
          <span style={{ color: totalCableM > 0 ? "#3dba74" : C.dim }}>
            {totalCableM > 0 ? totalCableM.toFixed(1) : "—"}
          </span>
        )}
      </div>
    </div>
  )
}
