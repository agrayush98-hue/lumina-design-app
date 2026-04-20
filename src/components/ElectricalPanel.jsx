import React from "react"

const PHASE_COLOR = { L1: "#39c5cf", L2: "#3dba74", L3: "#e8a830" }

const C = {
  bg:     "#0a1018",
  border: "#1a2b3c",
  label:  "#2d4f68",
  value:  "#4a7a96",
  accent: "#cdd9e5",
}

const MAX_SAFE = 60

const TOPOLOGIES = [
  { key: "daisy", label: "DAISY", color: "#e8a830", bg: "#2a1e0e",
    desc: "DB → CTR → F1 → F2 → ... → F60 → loop back" },
  { key: "star",  label: "STAR",  color: "#39c5cf", bg: "#0e2a2a",
    desc: "DB → CTR → JB → each fixture independently" },
  { key: "mixed", label: "MIXED", color: "#a78bfa", bg: "#1a0e2a",
    desc: "DB → CTR → direct fixtures + optional JB branches" },
]

function busStatus(nodeCount) {
  if (nodeCount <= MAX_SAFE) return { color: "#3dba74", text: "SAFE" }
  if (nodeCount <= 62)       return { color: "#e8a830", text: "WARNING — APPROACHING LIMIT" }
  return                            { color: "#d94f4f", text: "EXCEEDS SAFE LIMIT" }
}

function DaliTag({ label }) {
  return (
    <span style={{
      display: "inline-block", padding: "1px 5px",
      background: "#1a0e2a", border: "1px solid #7c3aed",
      borderRadius: 3, color: "#a78bfa",
      fontSize: 9, marginRight: 3, marginBottom: 2, whiteSpace: "nowrap",
    }}>
      {label}
    </span>
  )
}

const STATUS_COLOR = { GOOD: "#3dba74", WARNING: "#e8a830", CRITICAL: "#d94f4f" }

function SectionHeader({ children }) {
  return (
    <div style={{
      padding: "7px 14px", borderTop: `1px solid ${C.border}`,
      color: C.label, letterSpacing: "0.12em", fontSize: 9, fontWeight: 600,
      background: "#080e14",
    }}>
      {children}
    </div>
  )
}

export default function ElectricalPanel({
  circuits, daliEnabled, daliActive, daliAddresses, busTopologies, setTopology, busCableLengths,
  daliNodeLimit, voltageDropResults, driverSchedule,
}) {
  if (!circuits || circuits.length === 0) return null

  const circuitCols = daliEnabled
    ? "80px 60px 1fr 90px 60px 80px 180px"
    : "80px 60px 1fr 90px 60px 80px"

  const vdropCols   = "70px 100px 80px 80px 80px 80px"
  const driverCols  = "1fr 60px 80px 60px 90px 50px 80px 160px"

  return (
    <div style={{
      width: 1400,
      background: C.bg,
      border: `1px solid ${C.border}`,
      borderRadius: "0 0 6px 6px",
      fontFamily: "IBM Plex Mono",
      fontSize: 10,
      flexShrink: 0,
    }}>

      {/* ── Circuit table header ── */}
      <div style={{
        display: "grid", gridTemplateColumns: circuitCols,
        padding: "6px 14px", borderBottom: `1px solid ${C.border}`,
        color: C.label, letterSpacing: "0.1em",
      }}>
        <span>CIRCUIT</span><span>PHASE</span><span>FIXTURES</span>
        <span>LOAD</span><span>MCB</span><span>WIRE</span>
        {daliEnabled && <span>DALI</span>}
      </div>

      {/* ── Circuit rows ── */}
      {circuits.map(c => (
        <div key={c.circuitId} style={{
          display: "grid", gridTemplateColumns: circuitCols,
          padding: "5px 14px", borderBottom: "1px solid #0d1822", alignItems: "center",
        }}>
          <span style={{ color: C.accent }}>{c.circuitId}</span>
          <span style={{ color: PHASE_COLOR[c.phase] ?? C.value, fontWeight: 600 }}>{c.phase}</span>
          <span style={{ color: C.value }}>{c.fixtures.length} fixture{c.fixtures.length !== 1 ? "s" : ""}</span>
          <span style={{ color: C.value }}>{c.totalWatt}W</span>
          <span style={{ color: C.value }}>{c.mcb}</span>
          <span style={{ color: C.value }}>{c.wireSize}</span>
          {daliAddresses && Object.keys(daliAddresses.byId).length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap" }}>
              {c.fixtures.map(f => {
                const da = daliAddresses.byId[f.id]
                return da ? <DaliTag key={f.id} label={`${da.busId}·${da.address}`} /> : null
              })}
            </div>
          )}
        </div>
      ))}

      {/* ── DALI bus summary ── */}
      {daliAddresses && daliAddresses.buses.length > 0 && (
        <div style={{ borderTop: `1px solid ${C.border}`, padding: "10px 14px" }}>
          <div style={{ color: C.label, letterSpacing: "0.1em", marginBottom: 8, fontSize: 10 }}>
            DALI BUSES — {daliAddresses.buses.length} bus{daliAddresses.buses.length !== 1 ? "es" : ""} total (project-wide)
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {daliAddresses.buses.map(b => {
              const nodeCount  = b.lights.length
              const safeLimit  = b.safeLimit ?? (b.nodeLimit ? b.nodeLimit - 4 : 60)
              const nodeLimit  = b.nodeLimit ?? daliNodeLimit ?? 64
              const spare      = nodeLimit - nodeCount
              const usedColor  = nodeCount < safeLimit ? "#3dba74" : "#d4a843"
              const statusText = nodeCount >= nodeLimit ? "FULL" : nodeCount >= safeLimit ? "NEAR LIMIT" : "SAFE"
              const statusColor = nodeCount >= nodeLimit ? "#d94f4f" : nodeCount >= safeLimit ? "#d4a843" : "#3dba74"
              const topology   = busTopologies?.[b.id] ?? "daisy"
              const topoMeta   = TOPOLOGIES.find(t => t.key === topology)
              const roomNames  = [...new Set(b.lights.map(l => l.roomName).filter(Boolean))]
              const cableEntry = Array.isArray(busCableLengths)
                ? busCableLengths.find(entry => entry.busId === b.id)
                : null
              return (
                <div key={b.id} style={{ background: "#0d1620", border: `1px solid ${C.border}`, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "70px 1fr 110px 120px 90px 90px", alignItems: "center", padding: "5px 10px", gap: 8 }}>
                    <span style={{ color: "#a78bfa", fontWeight: 600 }}>{b.id}</span>
                    <span style={{ color: C.value, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={roomNames.join(", ")}>{roomNames.join(", ") || "—"}</span>
                    <span style={{ color: C.value }}>Addr 1–{nodeCount}</span>
                    <span style={{ color: usedColor }}>{nodeCount}/{nodeLimit} nodes</span>
                    <span style={{ color: spare >= 0 ? C.value : "#d94f4f" }}>{spare >= 0 ? `${spare} spare` : `${Math.abs(spare)} over`}</span>
                    <span style={{
                      display: "inline-block", padding: "1px 7px", borderRadius: 3,
                      background: nodeCount >= nodeLimit ? "#2a0a0a" : nodeCount >= safeLimit ? "#2a1e0e" : "#0a1e0a",
                      border: `1px solid ${statusColor}`,
                      color: statusColor, letterSpacing: "0.05em", fontSize: 9
                    }}>{statusText}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderTop: "1px solid #0a1520" }}>
                    <span style={{ color: C.label, marginRight: 4, letterSpacing: "0.08em" }}>TOPOLOGY</span>
                    {TOPOLOGIES.map(t => (
                      <button key={t.key} onClick={() => setTopology(b.id, t.key)}
                        style={{
                          padding: "2px 8px",
                          background: topology === t.key ? t.bg : "transparent",
                          border: `1px solid ${topology === t.key ? t.color : "#1a2b3c"}`,
                          borderRadius: 3, color: topology === t.key ? t.color : "#2d4f68",
                          fontFamily: "IBM Plex Mono", fontSize: 9, letterSpacing: "0.08em", cursor: "pointer",
                        }}>{t.label}</button>
                    ))}
                    <span style={{ color: C.label, marginLeft: 8, fontStyle: "italic" }}>{topoMeta?.desc}</span>
                  </div>
                  {cableEntry && (
                    <div style={{ padding: "4px 10px", borderTop: "1px solid #0a1520", color: "#3dba74" }}>
                      DALI CABLE: {(cableEntry.totalCableM ?? 0).toFixed(1)}m (incl. 20% bends)
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Voltage Drop section ── */}
      {voltageDropResults !== undefined && (
        <>
          <SectionHeader>VOLTAGE DROP ANALYSIS</SectionHeader>
          {voltageDropResults.length === 0 ? (
            <div style={{ padding: "8px 14px", color: C.label, fontStyle: "italic", fontSize: 9 }}>
              No DB marker placed — add a DB marker to calculate voltage drop.
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: vdropCols, padding: "5px 14px", borderBottom: `1px solid ${C.border}`, color: C.label, letterSpacing: "0.09em" }}>
                <span>CIRCUIT</span><span>CABLE LEN</span><span>CURRENT</span>
                <span>V-DROP%</span><span>CABLE SIZE</span><span>STATUS</span>
              </div>
              {voltageDropResults.map(r => (
                <div key={r.circuitId} style={{
                  display: "grid", gridTemplateColumns: vdropCols,
                  padding: "5px 14px", borderBottom: "1px solid #0d1822", alignItems: "center",
                }}>
                  <span style={{ color: C.accent }}>{r.circuitId}</span>
                  <span style={{ color: C.value }}>{r.cableLengthM.toFixed(1)}m</span>
                  <span style={{ color: C.value }}>{r.current.toFixed(2)}A</span>
                  <span style={{ color: STATUS_COLOR[r.status] ?? C.value, fontWeight: 600 }}>
                    {r.vDropPercent.toFixed(2)}%
                  </span>
                  <span style={{ color: C.value }}>{r.cableSize}</span>
                  <span style={{ color: STATUS_COLOR[r.status] ?? C.value, letterSpacing: "0.06em" }}>
                    {r.status}
                  </span>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* ── Driver Schedule section ── */}
      {driverSchedule && driverSchedule.length > 0 && (
        <>
          <SectionHeader>DRIVER SCHEDULE</SectionHeader>
          <div style={{ display: "grid", gridTemplateColumns: driverCols, padding: "5px 14px", borderBottom: `1px solid ${C.border}`, color: C.label, letterSpacing: "0.09em" }}>
            <span>FIXTURE TYPE</span><span>W</span><span>DRIVER</span>
            <span>mA</span><span>DIMMING</span><span>QTY</span><span>DRIVER W</span><span>NOTES</span>
          </div>
          {driverSchedule.map((d, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: driverCols,
              padding: "5px 14px", borderBottom: "1px solid #0d1822", alignItems: "center",
            }}>
              <span style={{ color: C.accent, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.type}</span>
              <span style={{ color: C.value }}>{d.watt}W</span>
              <span style={{ color: d.driverType === "CV" ? "#39c5cf" : "#e8a830" }}>{d.driverType}</span>
              <span style={{ color: C.value }}>{d.driverType === "CC" ? `${d.currentMA}mA` : "—"}</span>
              <span style={{ color: d.dimmable === "DALI 2.0" ? "#a78bfa" : C.label }}>{d.dimmable}</span>
              <span style={{ color: C.accent, fontWeight: 600 }}>{d.quantity}</span>
              <span style={{ color: C.value }}>{d.driverWatt}W</span>
              <span style={{ color: C.label, fontSize: 8, fontStyle: d.cctNote ? "normal" : "italic" }}>{d.cctNote || "—"}</span>
            </div>
          ))}
          {/* Summary row */}
          <div style={{ padding: "5px 14px", color: C.label, display: "flex", gap: 20, borderTop: `1px solid ${C.border}`, fontSize: 9 }}>
            <span>TOTAL DRIVERS: <span style={{ color: C.accent }}>{driverSchedule.reduce((s, d) => s + d.quantity, 0)}</span></span>
            <span>TOTAL DRIVER LOAD: <span style={{ color: C.accent }}>{driverSchedule.reduce((s, d) => s + d.driverWatt * d.quantity, 0).toFixed(1)}W</span></span>
          </div>
        </>
      )}

    </div>
  )
}
