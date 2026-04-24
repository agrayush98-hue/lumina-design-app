import React, { useRef } from "react"
import ExcelJS from "exceljs"
import { FIXTURE_MAP } from "../data/fixtureLibrary"
import { fromMM, getStoredUnit } from "../utils/units"

const MF = 0.8

// ── Per-room photometric calculation ────────────────────────────
// room here is a floors[].rooms[] entry: { id, name, room: {...}, lights, ... }
function calcRoom(roomObj) {
  const s    = roomObj.room ?? {}
  const W    = Number(s.roomWidth)  / 1000
  const H    = Number(s.roomHeight) / 1000
  const areaM2 = W * H
  const mh   = Number(s.ceilingHeight) - Number(s.falseCeiling) - Number(s.workingPlane)
  const rcr  = W > 0 && H > 0 ? (5 * mh * (W + H)) / (W * H) : 0
  const avgRef = (Number(s.ceilingReflectance ?? 0.7) + Number(s.wallReflectance ?? 0.5) + Number(s.floorReflectance ?? 0.2)) / 3
  const ufRaw  = avgRef >= 0.6 ? 1 - rcr * 0.04 : avgRef >= 0.4 ? 1 - rcr * 0.055 : 1 - rcr * 0.07
  const uf   = Math.min(0.95, Math.max(0.4, ufRaw))
  const lux  = areaM2 === 0 ? 0 : (roomObj.lights.reduce((sum, l) => sum + (l.lumens ?? 0), 0) * uf * MF) / areaM2
  return { areaM2, lux, rcr, uf }
}

function luxStatus(lux, target) {
  if (lux === 0 || target === 0) return { text: "—",        color: "#9ca3af" }
  if (lux < target * 0.8)        return { text: "UNDERLIT",  color: "#dc2626" }
  if (lux <= target * 1.2)       return { text: "GOOD",      color: "#16a34a" }
  return                                 { text: "OVERLIT",   color: "#d97706" }
}

const CCT_LABEL = {
  "single":     "Single CCT",
  "tunable":    "Tunable White",
  "rgbw":       "RGBW",
  "dali-dt8":   "DALI DT8",
  "zigbee-cct": "Zigbee CCT/RGB",
}

const PROTOCOL_LABEL = {
  "NON-DIM":   "Non-dim",
  "PHASE-CUT": "Triac/Phase-cut",
  "0-10V":     "0-10V Analog",
  "DALI":      "DALI",
  "ZIGBEE":    "Zigbee",
}

function fixtureGroups(roomObj) {
  const groups = {}
  const roomProtocol = roomObj.room?.roomProtocol ?? "NON-DIM"
  for (const l of roomObj.lights) {
    const fid = l.fixtureId ?? "unknown"
    const effectiveProtocol = (l.protocol && l.protocol !== "Room Default") ? l.protocol : roomProtocol
    if (!groups[fid]) {
      const f = FIXTURE_MAP[fid]
      groups[fid] = {
        label: f?.label ?? "Custom", lumens: l.lumens, beamAngle: f?.beamAngle ?? "—",
        watt: l.watt ?? 0, qty: 0, totalWatt: 0, protocol: effectiveProtocol,
        cctType: l.cctType ?? "single",
      }
    }
    groups[fid].qty++
    groups[fid].totalWatt += l.watt ?? 0
  }
  return Object.values(groups)
}

// ── Shared table styles ──────────────────────────────────────────
const TH = (w) => ({
  padding: "6px 10px",
  background: "#1e293b",
  color: "#e2e8f0",
  fontFamily: "IBM Plex Mono",
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textAlign: "left",
  borderBottom: "2px solid #334155",
  whiteSpace: "nowrap",
  width: w,
})

const TD = {
  padding: "5px 10px",
  fontFamily: "IBM Plex Mono",
  fontSize: 9,
  color: "#1e293b",
  borderBottom: "1px solid #e2e8f0",
  whiteSpace: "nowrap",
}

const TD_ALT = { ...TD, background: "#f8fafc" }

function SectionHeader({ title }) {
  return (
    <div style={{
      background: "#0f172a",
      color: "#7dd3fc",
      fontFamily: "IBM Plex Mono",
      fontSize: 10,
      fontWeight: 700,
      letterSpacing: "0.18em",
      padding: "8px 14px",
      marginTop: 24,
      borderLeft: "3px solid #38bdf8",
    }}>
      {title}
    </div>
  )
}

function Table({ head, rows }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 0 }}>
      <thead>
        <tr>{head.map(([label, w], i) => <th key={i} style={TH(w)}>{label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((cells, ri) => (
          <tr key={ri}>
            {cells.map((cell, ci) => (
              <td key={ci} style={ri % 2 === 0 ? TD : TD_ALT}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const MAX_SAFE = 60

export default function ReportPanel({ floors, projectName, onClose, daliEnabled, daliAddresses, busCableLengths, busTopologies }) {
  const printRef = useRef(null)
  // allRooms: each item is { id, name, room: {...settings}, lights, ..., floorName }
  const allRooms = floors.flatMap(f => f.rooms.map(r => ({ ...r, floorName: f.name })))
  const date     = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })

  const totalFixtures = allRooms.reduce((s, r) => s + r.lights.length, 0)
  const totalLoad     = allRooms.reduce((s, r) => s + r.lights.reduce((w, l) => w + (l.watt ?? 0), 0), 0)

  function handlePrint() {
    const content = printRef.current.innerHTML
    const win = window.open("", "_blank", "width=900,height=700")
    win.document.write(`
      <!DOCTYPE html><html><head>
        <title>${projectName} — Lighting Report</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;700&display=swap" rel="stylesheet">
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'IBM Plex Mono', monospace; background: #fff; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; }
          @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
        </style>
      </head><body>${content}</body></html>
    `)
    win.document.close()
    win.focus()
    setTimeout(() => { win.print(); win.close() }, 400)
  }

  // ── Section 2 rows ───────────────────────────────────────────
  const dimUnit = getStoredUnit()
  const luxRows = allRooms.map(r => {
    const { areaM2, lux } = calcRoom(r)
    const target = Number(r.room?.targetLux ?? 0)
    const { text: statusText, color: statusColor } = luxStatus(lux, target)
    const load = r.lights.reduce((s, l) => s + (l.watt ?? 0), 0)
    const wDisp = fromMM(Number(r.room?.roomWidth  ?? 0), dimUnit)
    const hDisp = fromMM(Number(r.room?.roomHeight ?? 0), dimUnit)
    return [
      r.floorName,
      r.name,
      `${wDisp} × ${hDisp}`,
      areaM2.toFixed(1),
      target,
      r.lights.length === 0 ? "—" : Math.round(lux),
      <span style={{ color: statusColor, fontWeight: 700 }}>{statusText}</span>,
      r.lights.length,
      load,
    ]
  })

  // ── Section 3 rows ───────────────────────────────────────────
  const scheduleRows = allRooms.flatMap(r =>
    r.lights.length === 0 ? [] :
    fixtureGroups(r).map(g => [
      r.floorName, r.name, g.label, g.qty,
      g.lumens + " lm", g.beamAngle + "°", g.watt + "W", g.totalWatt + "W",
      PROTOCOL_LABEL[g.protocol] ?? g.protocol ?? "Non-dim",
      CCT_LABEL[g.cctType] ?? "Single CCT",
    ])
  )

  // ── Section 6: Control System Summary ────────────────────────
  // CCT type breakdown
  const cctCounts = {}
  for (const r of allRooms) {
    for (const l of r.lights) {
      const ct = l.cctType ?? "single"
      cctCounts[ct] = (cctCounts[ct] ?? 0) + 1
    }
  }
  const cctSummaryRows = Object.entries(cctCounts).map(([ct, count]) => [
    CCT_LABEL[ct] ?? ct, count,
  ])

  const protocolCounts = {}
  const roomProtocolRows = allRooms.map(r => {
    const rp = r.room?.roomProtocol ?? "NON-DIM"
    let count = 0
    for (const l of r.lights) {
      const ep = (l.protocol && l.protocol !== "Room Default") ? l.protocol : rp
      protocolCounts[ep] = (protocolCounts[ep] ?? 0) + 1
      count++
    }
    return [r.floorName, r.name, PROTOCOL_LABEL[rp] ?? rp, count]
  })

  const PROTOCOL_NOTES = {
    "DALI":      "Requires DALI-2 driver per fixture + controller per bus",
    "ZIGBEE":    "Requires Zigbee gateway + compatible driver module per fixture",
    "0-10V":     "Requires 0-10V compatible driver; analog signal 0–10V for dimming",
    "PHASE-CUT": "Triac/leading-edge dimmer; check driver compatibility",
    "NON-DIM":   "Fixed output — no dimming control",
  }
  const protocolSummaryRows = Object.entries(protocolCounts).map(([proto, count]) => [
    PROTOCOL_LABEL[proto] ?? proto,
    count,
    PROTOCOL_NOTES[proto] ?? "—",
  ])

  // ── Section 4 rows ───────────────────────────────────────────
  const reflRows = allRooms.map(r => {
    const { rcr, uf } = calcRoom(r)
    const s = r.room ?? {}
    return [
      r.floorName, r.name,
      (Number(s.ceilingReflectance ?? 0.7) * 100).toFixed(0) + "%",
      (Number(s.wallReflectance    ?? 0.5) * 100).toFixed(0) + "%",
      (Number(s.floorReflectance   ?? 0.2) * 100).toFixed(0) + "%",
      rcr.toFixed(2), uf.toFixed(2), (MF * 100).toFixed(0) + "%",
    ]
  })

  // ── Section 5a: Bus Summary rows ────────────────────────────
  const busSummaryRows = daliEnabled && daliAddresses
    ? daliAddresses.buses.map(b => {
        const nodeCount = b.lights.length
        const spare    = MAX_SAFE - nodeCount
        const topology = busTopologies?.[b.id] ?? "daisy"
        const cable    = busCableLengths?.[b.id]
        const cableStr = cable?.noCtr ? "No CTR" : cable?.totalCableM != null ? cable.totalCableM.toFixed(1) + " m" : "—"
        const status   = nodeCount <= MAX_SAFE ? "SAFE" : nodeCount <= 62 ? "WARNING" : "OVER LIMIT"
        const statusColor = nodeCount <= MAX_SAFE ? "#16a34a" : nodeCount <= 62 ? "#d97706" : "#dc2626"
        return [
          b.id,
          b.rooms.join(", "),
          nodeCount,
          spare >= 0 ? spare : <span style={{ color: "#dc2626" }}>{Math.abs(spare)} over</span>,
          topology.charAt(0).toUpperCase() + topology.slice(1),
          cableStr,
          <span style={{ color: statusColor, fontWeight: 700 }}>{status}</span>,
        ]
      })
    : []

  // ── Section 5b: Address Schedule rows ───────────────────────
  const daliAddressRows = daliEnabled && daliAddresses
    ? allRooms.flatMap(r =>
        r.lights
          .map(l => {
            const da = daliAddresses.byId[l.id]
            if (!da) return null
            const fixLabel = FIXTURE_MAP[l.fixtureId]?.label ?? "Custom"
            return { busId: da.busId, address: da.address, floorName: r.floorName, roomName: r.name, fixLabel }
          })
          .filter(Boolean)
      )
      .sort((a, b) => a.busId.localeCompare(b.busId) || a.address - b.address)
      .map(row => [row.busId, row.address, row.floorName, row.roomName, row.fixLabel])
    : []

  // ── BOQ Excel export ─────────────────────────────────────────
  async function exportBOQ() {
    const wb = new ExcelJS.Workbook()

    // ── Sheet 1: Fixture BOQ ──────────────────────────────────
    const ws1 = wb.addWorksheet("Fixture BOQ")
    ws1.columns = [20, 22, 22, 32, 14, 12, 12, 10, 10, 24].map(w => ({ width: w }))

    ws1.addRow(["SR", "FLOOR", "ROOM", "FIXTURE TYPE", "LUMENS", "BEAM", "WATT", "QTY", "UNIT", "REMARKS"])
    let sr = 1, totalQty = 0, totalWatt = 0

    for (const r of allRooms) {
      for (const g of fixtureGroups(r)) {
        ws1.addRow([sr++, r.floorName, r.name, g.label, g.lumens, g.beamAngle + "°", g.watt, g.qty, "No.", ""])
        totalQty  += g.qty
        totalWatt += g.totalWatt
      }
    }
    ws1.addRow(["", "", "", "TOTAL", "", "", "", totalQty, "", totalWatt + " W"])

    // ── Sheet 2: Electrical BOQ ───────────────────────────────
    const ws2 = wb.addWorksheet("Electrical BOQ")
    ws2.columns = [8, 28, 28, 10, 10, 40].map(w => ({ width: w }))

    ws2.addRow(["SR", "ITEM", "SPECIFICATION", "QTY", "UNIT", "REMARKS"])
    let esr = 1

    const mcbCount  = {}
    const wireCount = {}
    const MAX_WATT  = 800

    for (const r of allRooms) {
      const s = r.room ?? {}
      const perimeter = 2 * ((Number(s.roomWidth ?? 0) / 1000) + (Number(s.roomHeight ?? 0) / 1000))
      const rCircuits = []
      let cur = null
      for (const l of r.lights) {
        const w = l.watt ?? 0
        if (!cur || cur.totalWatt + w > MAX_WATT) {
          cur = { totalWatt: 0, mcb: "6A", wireSize: "1.5mm²" }
          rCircuits.push(cur)
        }
        cur.totalWatt += w
        cur.mcb      = cur.totalWatt <= 1380 ? "6A" : cur.totalWatt <= 2300 ? "10A" : "16A"
        cur.wireSize = cur.totalWatt <= 2944 ? "1.5mm²" : "2.5mm²"
      }
      for (const c of rCircuits) {
        const mcbKey  = `MCB ${c.mcb} SP`
        const wireKey = `FR Wire ${c.wireSize}`
        mcbCount[mcbKey]   = (mcbCount[mcbKey]  ?? 0) + 1
        wireCount[wireKey] = (wireCount[wireKey] ?? 0) + Math.ceil(perimeter * 2)
      }
    }

    for (const [spec, qty] of Object.entries(mcbCount)) {
      ws2.addRow([esr++, "MCB Single Pole", spec, qty, "No.", ""])
    }
    for (const [spec, qty] of Object.entries(wireCount)) {
      ws2.addRow([esr++, "FR Cable", spec, qty, "m", "Estimated 2× room perimeter per circuit"])
    }
    ws2.addRow([esr++, "Distribution Board", "DB (surface/flush)", floors.length, "No.", "1 per floor"])

    // ── Sheet 3: DALI BOQ (only if enabled) ──────────────────
    if (daliEnabled && daliAddresses) {
      const ws3 = wb.addWorksheet("DALI BOQ")
      ws3.columns = [8, 28, 30, 10, 10, 30].map(w => ({ width: w }))

      ws3.addRow(["SR", "ITEM", "SPECIFICATION", "QTY", "UNIT", "REMARKS"])
      let dsr = 1

      const totalBuses  = daliAddresses.buses.length
      const totalCableM = Math.ceil(
        Object.values(busCableLengths ?? {}).reduce((s, b) => s + (b.totalCableM ?? 0), 0)
      )
      const roomsWithDali = allRooms.filter(r =>
        r.lights.some(l => daliAddresses.byId[l.id])
      ).length

      ws3.addRow([dsr++, "DALI Controller",        "DALI-2 DT8 Controller",          totalBuses,    "No.", "1 per DALI bus"])
      ws3.addRow([dsr++, "DALI Cable 2-core",      "DALI Bus Cable 2×1.5mm²",        totalCableM,   "m",   "Incl. 20% bends"])
      ws3.addRow([dsr++, "DALI Pushbutton/Sensor", "DALI-2 Multi-sensor/Pushbutton", roomsWithDali, "No.", "1 per room"])
    }

    const safeName = projectName.replace(/[^a-z0-9_\-]/gi, "_")
    const buffer = await wb.xlsx.writeBuffer()
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `${safeName}_BOQ.xlsx`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.75)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        width: "min(960px, 96vw)",
        maxHeight: "92vh",
        display: "flex", flexDirection: "column",
        background: "#0d1117",
        border: "1px solid #1a2b3c",
        borderRadius: 6,
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
      }}>

        {/* Modal header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 18px",
          borderBottom: "1px solid #1a2b3c",
          background: "#0a1018",
          flexShrink: 0,
        }}>
          <span style={{ fontFamily: "IBM Plex Mono", fontSize: 11, color: "#39c5cf", letterSpacing: "0.12em" }}>
            LIGHTING REPORT
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={handlePrint}
              style={{
                padding: "5px 14px", background: "#0e1d2e",
                border: "1px solid #1e4060", borderRadius: 3,
                color: "#39c5cf", fontFamily: "IBM Plex Mono", fontSize: 10,
                letterSpacing: "0.08em", cursor: "pointer",
              }}
            >Print / Export PDF</button>
            <button
              onClick={exportBOQ}
              style={{
                padding: "5px 14px", background: "#0e1a0e",
                border: "1px solid #1a4020", borderRadius: 3,
                color: "#3dba74", fontFamily: "IBM Plex Mono", fontSize: 10,
                letterSpacing: "0.08em", cursor: "pointer",
              }}
            >Export BOQ</button>
            <button
              onClick={onClose}
              style={{
                padding: "5px 12px", background: "transparent",
                border: "1px solid #1a2b3c", borderRadius: 3,
                color: "#4a7a96", fontFamily: "IBM Plex Mono", fontSize: 10,
                cursor: "pointer",
              }}
            >✕ Close</button>
          </div>
        </div>

        {/* Scrollable report content */}
        <div style={{ overflowY: "auto", flex: 1, padding: 20 }}>
          <div
            ref={printRef}
            style={{ background: "#fff", borderRadius: 4, padding: "28px 32px" }}
          >

            {/* Report title */}
            <div style={{ borderBottom: "3px solid #0f172a", paddingBottom: 14, marginBottom: 4 }}>
              <div style={{ fontFamily: "IBM Plex Mono", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>
                {projectName}
              </div>
              <div style={{ fontFamily: "IBM Plex Mono", fontSize: 10, color: "#64748b", marginTop: 4, letterSpacing: "0.05em" }}>
                LIGHTING DESIGN REPORT · GENERATED {date.toUpperCase()}
              </div>
            </div>

            {/* ── SECTION 1: Project Summary ── */}
            <SectionHeader title="01 · PROJECT SUMMARY" />
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
              gap: 1, background: "#e2e8f0", border: "1px solid #e2e8f0",
              marginTop: 0,
            }}>
              {[
                ["PROJECT NAME",    projectName],
                ["DATE",            date],
                ["FLOORS",          floors.length],
                ["ROOMS",           allRooms.length],
                ["TOTAL FIXTURES",  totalFixtures],
                ["TOTAL LOAD",      totalLoad + " W"],
              ].map(([label, value]) => (
                <div key={label} style={{ background: "#fff", padding: "10px 14px" }}>
                  <div style={{ fontFamily: "IBM Plex Mono", fontSize: 8, color: "#94a3b8", letterSpacing: "0.1em" }}>{label}</div>
                  <div style={{ fontFamily: "IBM Plex Mono", fontSize: 13, color: "#0f172a", fontWeight: 700, marginTop: 2 }}>{value}</div>
                </div>
              ))}
            </div>

            {/* ── SECTION 2: Lux Summary ── */}
            <SectionHeader title="02 · LUX SUMMARY" />
            <Table
              head={[
                ["FLOOR", 100], ["ROOM", 120], [`SIZE (${dimUnit})`, 110], ["AREA (m²)", 70],
                ["TARGET LUX", 90], ["ACTUAL LUX", 90], ["STATUS", 80],
                ["FIXTURES", 70], ["LOAD (W)", 70],
              ]}
              rows={luxRows}
            />

            {/* ── SECTION 3: Fixture Schedule ── */}
            <SectionHeader title="03 · FIXTURE SCHEDULE" />
            {scheduleRows.length === 0
              ? <div style={{ fontFamily: "IBM Plex Mono", fontSize: 10, color: "#94a3b8", padding: "12px 14px", background: "#f8fafc" }}>No fixtures placed.</div>
              : <Table
                  head={[
                    ["FLOOR", 70], ["ROOM", 90], ["FIXTURE TYPE", 120],
                    ["QTY", 35], ["LUMENS", 65], ["BEAM", 45], ["WATT", 45], ["TOTAL (W)", 65],
                    ["PROTOCOL", 100], ["CCT TYPE", 100],
                  ]}
                  rows={scheduleRows}
                />
            }

            {/* ── SECTION 4: Reflectance & Coefficients ── */}
            <SectionHeader title="04 · REFLECTANCE & COEFFICIENTS" />
            <Table
              head={[
                ["FLOOR", 90], ["ROOM", 110],
                ["CEILING", 70], ["WALLS", 70], ["FLOOR", 70],
                ["RCR", 60], ["UF", 55], ["MF", 55],
              ]}
              rows={reflRows}
            />

            {/* ── SECTION 5: DALI Schedule (only when DALI enabled) ── */}
            {daliEnabled && daliAddresses && (
              <>
                <SectionHeader title="05 · DALI SCHEDULE" />

                {/* 5a — Bus Summary */}
                <div style={{
                  fontFamily: "IBM Plex Mono", fontSize: 9, color: "#64748b",
                  letterSpacing: "0.1em", padding: "6px 14px 4px",
                  background: "#f1f5f9", borderBottom: "1px solid #e2e8f0",
                }}>
                  A · BUS SUMMARY
                </div>
                {daliAddresses.buses.length === 0
                  ? <div style={{ fontFamily: "IBM Plex Mono", fontSize: 10, color: "#94a3b8", padding: "12px 14px", background: "#f8fafc" }}>No DALI buses assigned.</div>
                  : <Table
                      head={[
                        ["BUS", 60], ["ROOMS", 180], ["NODES USED", 90],
                        ["SPARE", 65], ["TOPOLOGY", 80], ["CABLE (m)", 80], ["STATUS", 90],
                      ]}
                      rows={busSummaryRows}
                    />
                }

                {/* 5b — Address Schedule */}
                <div style={{
                  fontFamily: "IBM Plex Mono", fontSize: 9, color: "#64748b",
                  letterSpacing: "0.1em", padding: "6px 14px 4px",
                  background: "#f1f5f9", borderBottom: "1px solid #e2e8f0",
                  marginTop: 12,
                }}>
                  B · ADDRESS SCHEDULE
                </div>
                {daliAddressRows.length === 0
                  ? <div style={{ fontFamily: "IBM Plex Mono", fontSize: 10, color: "#94a3b8", padding: "12px 14px", background: "#f8fafc" }}>No DALI addresses assigned.</div>
                  : <Table
                      head={[
                        ["BUS", 60], ["ADDRESS", 70], ["FLOOR", 110],
                        ["ROOM", 130], ["FIXTURE TYPE", 180],
                      ]}
                      rows={daliAddressRows}
                    />
                }
              </>
            )}

            {/* ── SECTION 6: Control System Summary ── */}
            <SectionHeader title="06 · CONTROL SYSTEM SUMMARY" />

            <div style={{
              fontFamily: "IBM Plex Mono", fontSize: 9, color: "#64748b",
              letterSpacing: "0.1em", padding: "6px 14px 4px",
              background: "#f1f5f9", borderBottom: "1px solid #e2e8f0",
            }}>
              A · ROOM PROTOCOLS
            </div>
            <Table
              head={[["FLOOR", 100], ["ROOM", 130], ["PROTOCOL", 140], ["FIXTURES", 80]]}
              rows={roomProtocolRows}
            />

            {protocolSummaryRows.length > 0 && (
              <>
                <div style={{
                  fontFamily: "IBM Plex Mono", fontSize: 9, color: "#64748b",
                  letterSpacing: "0.1em", padding: "6px 14px 4px",
                  background: "#f1f5f9", borderBottom: "1px solid #e2e8f0",
                  marginTop: 12,
                }}>
                  B · PROTOCOL SUMMARY &amp; COMPATIBILITY
                </div>
                <Table
                  head={[["PROTOCOL", 130], ["FIXTURE COUNT", 110], ["NOTES", 450]]}
                  rows={protocolSummaryRows}
                />
              </>
            )}

            {cctSummaryRows.length > 0 && (
              <>
                <div style={{
                  fontFamily: "IBM Plex Mono", fontSize: 9, color: "#64748b",
                  letterSpacing: "0.1em", padding: "6px 14px 4px",
                  background: "#f1f5f9", borderBottom: "1px solid #e2e8f0",
                  marginTop: 12,
                }}>
                  C · CCT / COLOUR TYPE BREAKDOWN
                </div>
                <Table
                  head={[["CCT TYPE", 160], ["FIXTURE COUNT", 110]]}
                  rows={cctSummaryRows}
                />
              </>
            )}

            {/* Footer */}
            <div style={{
              marginTop: 28, paddingTop: 12, borderTop: "1px solid #e2e8f0",
              fontFamily: "IBM Plex Mono", fontSize: 8, color: "#94a3b8",
              display: "flex", justifyContent: "space-between",
            }}>
              <span>LUMINA DESIGN · LIGHTING CALCULATION REPORT</span>
              <span>{date}</span>
            </div>

          </div>
        </div>

      </div>
    </div>
  )
}
