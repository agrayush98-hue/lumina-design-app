import React, { useState, useEffect, useRef } from "react"
import { toMM, fromMM, getStoredUnit, UNIT_OPTIONS, UNIT_KEY } from "../utils/units"

const C = {
  panelBg:     "#0a1018",
  panelBorder: "#1a2b3c",
  accent:      "#39c5cf",
  label:       "#4a7a96",
  value:       "#cdd9e5",
  sub:         "#2d4f68",
}

const inputStyle = {
  width: "100%",
  background: "#111d28",
  border: `1px solid ${C.panelBorder}`,
  padding: "6px 8px",
  color: C.value,
  fontSize: 12,
  fontFamily: "IBM Plex Mono",
  outline: "none",
  boxSizing: "border-box",
}

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
}

const unitSelectStyle = {
  background: "#222",
  border: "1px solid #2e2e2e",
  color: "#f0f0f0",
  fontSize: 11,
  fontFamily: "IBM Plex Mono",
  padding: "2px 4px",
  cursor: "pointer",
  borderRadius: 2,
  flexShrink: 0,
  outline: "none",
}

const CEILING_REFLECTANCES = [
  { value: 0.8,  label: "80% — White / Light plaster" },
  { value: 0.7,  label: "70% — Off-white / Light paint" },
  { value: 0.5,  label: "50% — Medium / Light grey" },
  { value: 0.3,  label: "30% — Dark / Coloured surface" },
]

const WALL_REFLECTANCES = [
  { value: 0.7,  label: "70% — White / Very light walls" },
  { value: 0.5,  label: "50% — Light paint / Pastel" },
  { value: 0.3,  label: "30% — Medium tone" },
  { value: 0.1,  label: "10% — Dark / Feature walls" },
]

const FLOOR_REFLECTANCES = [
  { value: 0.3,  label: "30% — Light tile / Timber" },
  { value: 0.2,  label: "20% — Medium tone" },
  { value: 0.1,  label: "10% — Dark carpet / Stone" },
]

const ROOM_TYPES = [
  "Living Room", "Kitchen", "Bedroom", "Bathroom", "Office",
  "Corridor", "Dining Room", "Conference Room",
]

const PROTOCOLS = [
  { value: "NON-DIM",   label: "Non-dim (fixed output)" },
  { value: "PHASE-CUT", label: "Phase-cut (Triac)" },
  { value: "0-10V",     label: "0-10V Analog" },
  { value: "DALI",      label: "DALI" },
  { value: "ZIGBEE",    label: "Zigbee" },
]

export default function RoomSettingsPanel({ room, setRoom, calculations, style }) {
  const [unit, setUnit] = useState(getStoredUnit)

  const [wInput, setWInput] = useState(() => {
    const w = Number(room.roomWidth)
    return w > 0 ? String(fromMM(w, getStoredUnit())) : ''
  })
  const [hInput, setHInput] = useState(() => {
    const h = Number(room.roomHeight)
    return h > 0 ? String(fromMM(h, getStoredUnit())) : ''
  })

  // Sync display state when room props change externally (e.g. draw-room sets new dimensions)
  const prevW = useRef(Number(room.roomWidth))
  const prevH = useRef(Number(room.roomHeight))

  useEffect(() => {
    const w = Number(room.roomWidth)
    const h = Number(room.roomHeight)
    if (w !== prevW.current) {
      prevW.current = w
      setWInput(w > 0 ? String(fromMM(w, unit)) : '')
    }
    if (h !== prevH.current) {
      prevH.current = h
      setHInput(h > 0 ? String(fromMM(h, unit)) : '')
    }
  }, [room.roomWidth, room.roomHeight]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleUnitChange(newUnit) {
    setUnit(newUnit)
    try { localStorage.setItem(UNIT_KEY, newUnit) } catch {}
    const w = Number(room.roomWidth)
    const h = Number(room.roomHeight)
    setWInput(w > 0 ? String(fromMM(w, newUnit)) : '')
    setHInput(h > 0 ? String(fromMM(h, newUnit)) : '')
  }

  function commitWidth() {
    const mm = Math.round(toMM(parseFloat(wInput), unit))
    if (!isNaN(mm) && mm > 0) {
      prevW.current = mm
      updateField('roomWidth', mm)
    }
  }

  function commitHeight() {
    const mm = Math.round(toMM(parseFloat(hInput), unit))
    if (!isNaN(mm) && mm > 0) {
      prevH.current = mm
      updateField('roomHeight', mm)
    }
  }

  function updateField(key, value) {
    setRoom({ ...room, [key]: value })
  }

  return (
    <div style={{
      width: 280,
      background: C.panelBg,
      border: `1px solid ${C.panelBorder}`,
      borderRadius: 6,
      padding: 18,
      fontFamily: "IBM Plex Mono",
      color: C.value,
      ...style,
    }}>
      <div style={{ fontSize: 12, letterSpacing: 2, marginBottom: 16, color: C.accent }}>
        ROOM SETTINGS
      </div>

      {/* Room Type */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: C.label, marginBottom: 4 }}>Room Type</div>
        <select
          value={room.roomType ?? "Living Room"}
          onChange={e => updateField("roomType", e.target.value)}
          style={selectStyle}
        >
          {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Room Width with unit selector */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: C.label, marginBottom: 4, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>Room Width ({unit})</span>
          <select value={unit} onChange={e => handleUnitChange(e.target.value)} style={unitSelectStyle}>
            {UNIT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={wInput}
          onChange={e => setWInput(e.target.value)}
          onBlur={commitWidth}
          onKeyDown={e => { if (e.key === "Enter") commitWidth() }}
          style={inputStyle}
        />
      </div>

      {/* Room Height (same unit) */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 9, color: C.label, marginBottom: 4 }}>Room Height ({unit})</div>
        <input
          type="text"
          inputMode="decimal"
          value={hInput}
          onChange={e => setHInput(e.target.value)}
          onBlur={commitHeight}
          onKeyDown={e => { if (e.key === "Enter") commitHeight() }}
          style={inputStyle}
        />
      </div>

      {/* Other numeric inputs */}
      {[
        ["ceilingHeight", "Ceiling Height (m)"],
        ["falseCeiling",  "False Ceiling Drop (m)"],
        ["workingPlane",  "Working Plane Height (m)"],
        ["targetLux",     "Target Lux"],
        ["fixtureLumens", "Fixture Lumens"],
      ].map(([key, label]) => (
        <div key={key} style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: C.label, marginBottom: 4 }}>{label}</div>
          <input
            type="text"
            inputMode="decimal"
            value={room[key] ?? ""}
            onChange={e => updateField(key, e.target.value)}
            style={inputStyle}
          />
        </div>
      ))}

      {/* Reflectance dropdowns */}
      <div style={{ marginTop: 4, paddingTop: 12, borderTop: `1px solid ${C.panelBorder}` }}>
        <div style={{ fontSize: 9, letterSpacing: "0.12em", color: C.accent, marginBottom: 12 }}>
          REFLECTANCES
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: C.label, marginBottom: 4 }}>Ceiling Reflectance</div>
          <select
            value={room.ceilingReflectance ?? 0.7}
            onChange={e => updateField("ceilingReflectance", Number(e.target.value))}
            style={selectStyle}
          >
            {CEILING_REFLECTANCES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: C.label, marginBottom: 4 }}>Wall Reflectance</div>
          <select
            value={room.wallReflectance ?? 0.5}
            onChange={e => updateField("wallReflectance", Number(e.target.value))}
            style={selectStyle}
          >
            {WALL_REFLECTANCES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: C.label, marginBottom: 4 }}>Floor Reflectance</div>
          <select
            value={room.floorReflectance ?? 0.2}
            onChange={e => updateField("floorReflectance", Number(e.target.value))}
            style={selectStyle}
          >
            {FLOOR_REFLECTANCES.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Control Protocol */}
      <div style={{ marginTop: 4, paddingTop: 12, borderTop: `1px solid ${C.panelBorder}` }}>
        <div style={{ fontSize: 9, letterSpacing: "0.12em", color: C.accent, marginBottom: 12 }}>
          CONTROL PROTOCOL
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 9, color: C.label, marginBottom: 4 }}>Room Protocol</div>
          <select
            value={room.roomProtocol ?? "NON-DIM"}
            onChange={e => updateField("roomProtocol", e.target.value)}
            style={selectStyle}
          >
            {PROTOCOLS.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calculated values */}
      <div style={{ marginTop: 4, paddingTop: 12, borderTop: `1px solid ${C.panelBorder}` }}>
        <div style={{ fontSize: 10, color: C.sub }}>Mounting Height</div>
        <div style={{ fontSize: 14 }}>{Number(calculations.mountingHeight || 0).toFixed(2)} m</div>

        <div style={{ fontSize: 10, color: C.sub, marginTop: 10 }}>Required Lumens</div>
        <div style={{ fontSize: 14 }}>{Math.round(calculations.requiredLumens || 0)}</div>

        <div style={{ fontSize: 10, color: C.sub, marginTop: 10 }}>Suggested Fixtures</div>
        <div style={{ fontSize: 16, color: C.accent }}>{calculations.suggestedFixtures || 0}</div>
      </div>
    </div>
  )
}
