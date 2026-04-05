import { useState } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { mmToUnit, unitToMm, unitLabel } from '../utils/unitConverter'

// ── shared style tokens ──────────────────────────────────────────────────────
const mono = { fontFamily: 'IBM Plex Mono, monospace' }

const inputStyle = {
  ...mono, fontSize: 10,
  background: '#0a0f14', color: '#cdd9e5',
  border: '1px solid #1a2b3c', borderRadius: 3,
  padding: '5px 8px', width: '100%', boxSizing: 'border-box',
}

const selectStyle = {
  ...mono, fontSize: 10,
  background: '#0a0f14', color: '#cdd9e5',
  border: '1px solid #1a2b3c', borderRadius: 3,
  padding: '5px 8px', width: '100%', cursor: 'pointer',
}

const labelStyle = {
  ...mono, fontSize: 8, color: '#4a7a96',
  textTransform: 'uppercase', letterSpacing: '0.08em',
  display: 'block', marginBottom: 3,
}

// ── Field helpers ────────────────────────────────────────────────────────────

function Field({ label, suffix, children }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={labelStyle}>{label}</label>
      {suffix ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ flex: 1 }}>{children}</div>
          <span style={{ ...mono, fontSize: 9, color: '#2d4f68', flexShrink: 0 }}>{suffix}</span>
        </div>
      ) : children}
    </div>
  )
}

function NumInput({ value, onChange, min, max, step = 1 }) {
  return (
    <input
      type="number"
      value={value}
      min={min} max={max} step={step}
      onChange={(e) => onChange(Number(e.target.value) || 0)}
      style={inputStyle}
    />
  )
}

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      style={inputStyle}
    />
  )
}

function ReflectanceBar({ value, onChange }) {
  return (
    <div>
      <input
        type="range" min={0} max={100} step={5}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#d4a843', cursor: 'pointer' }}
      />
      <div style={{ ...mono, fontSize: 9, color: '#4a7a96', textAlign: 'right', marginTop: 1 }}>
        {value}%
      </div>
    </div>
  )
}

// ── Accordion section ────────────────────────────────────────────────────────

function Section({ title, icon, open, onToggle, children }) {
  return (
    <div style={{ marginBottom: 4, border: '1px solid #1a2b3c', borderRadius: 3, overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '9px 12px',
          background: open ? '#0e1d2a' : '#0a0f14',
          border: 'none', cursor: 'pointer',
          borderBottom: open ? '1px solid #1a2b3c' : 'none',
        }}
      >
        <span style={{ ...mono, fontSize: 10, color: open ? '#d4a843' : '#4a7a96', fontWeight: open ? 600 : 400, letterSpacing: '0.08em' }}>
          {icon} {title}
        </span>
        <span style={{ ...mono, fontSize: 10, color: '#2d4f68' }}>
          {open ? '▲' : '▼'}
        </span>
      </button>
      {open && (
        <div style={{ padding: '12px' }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Main export ──────────────────────────────────────────────────────────────

export default function SettingsPanel() {
  const { settings, updateSetting } = useSettings()
  const [open, setOpen] = useState({ room: true, lighting: false, materials: false, project: false })

  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))
  const upd = updateSetting

  const { room, calculations: calc, materials, project } = settings

  const lengthUnit = settings.units.length
  const uLabel = unitLabel(lengthUnit)

  return (
    <div style={{ padding: '8px 0' }}>

      {/* ── Room Settings ── */}
      <Section title="ROOM SETTINGS" icon="▣" open={open.room} onToggle={() => toggle('room')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 10px' }}>
          <Field label="Width" suffix={uLabel}>
            <NumInput value={mmToUnit(room.width, lengthUnit)} min={mmToUnit(1000, lengthUnit)} max={mmToUnit(50000, lengthUnit)} step={mmToUnit(100, lengthUnit)}
              onChange={(v) => upd('room', 'width', unitToMm(v, lengthUnit))} />
          </Field>
          <Field label="Length" suffix={uLabel}>
            <NumInput value={mmToUnit(room.length, lengthUnit)} min={mmToUnit(1000, lengthUnit)} max={mmToUnit(50000, lengthUnit)} step={mmToUnit(100, lengthUnit)}
              onChange={(v) => upd('room', 'length', unitToMm(v, lengthUnit))} />
          </Field>
        </div>
        <Field label="Ceiling / Mounting Height" suffix={uLabel}>
          <NumInput value={mmToUnit(calc.ceilingHeight, lengthUnit)} min={mmToUnit(500, lengthUnit)} max={mmToUnit(15000, lengthUnit)} step={mmToUnit(100, lengthUnit)}
            onChange={(v) => upd('calculations', 'ceilingHeight', unitToMm(v, lengthUnit))} />
        </Field>
        <Field label="Room Type">
          <select value={room.type} onChange={(e) => upd('room', 'type', e.target.value)} style={selectStyle}>
            {['Office', 'Retail', 'Warehouse', 'Corridor', 'Classroom', 'Laboratory', 'Hospital', 'Hotel', 'Residential', 'Car Park', 'Sports Hall'].map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </Field>
        <div style={{ ...mono, fontSize: 8, color: '#2d4f68', marginTop: 4, padding: '6px 8px', background: '#080d12', borderRadius: 2 }}>
          Area: {((room.width / 1000) * (room.length / 1000)).toFixed(2)} m² &nbsp;·&nbsp;
          Volume: {((room.width / 1000) * (room.length / 1000) * (calc.ceilingHeight / 1000)).toFixed(1)} m³
        </div>
      </Section>

      {/* ── Lighting Requirements ── */}
      <Section title="LIGHTING REQUIREMENTS" icon="☀" open={open.lighting} onToggle={() => toggle('lighting')}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0 8px' }}>
          <Field label="Min Lux" suffix="lx">
            <NumInput value={calc.minLux} min={0} max={10000} step={25}
              onChange={(v) => upd('calculations', 'minLux', v)} />
          </Field>
          <Field label="Target Lux" suffix="lx">
            <NumInput value={calc.targetLux} min={0} max={10000} step={25}
              onChange={(v) => upd('calculations', 'targetLux', v)} />
          </Field>
          <Field label="Max Lux" suffix="lx">
            <NumInput value={calc.maxLux} min={0} max={10000} step={25}
              onChange={(v) => upd('calculations', 'maxLux', v)} />
          </Field>
        </div>
        <Field label="Uniformity Target (Min/Avg)">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range" min={0.1} max={1.0} step={0.05}
              value={calc.uniformityTarget}
              onChange={(e) => upd('calculations', 'uniformityTarget', Number(e.target.value))}
              style={{ flex: 1, accentColor: '#d4a843', cursor: 'pointer' }}
            />
            <span style={{ ...mono, fontSize: 10, color: calc.uniformityTarget >= 0.6 ? '#3dba74' : calc.uniformityTarget >= 0.4 ? '#d4a843' : '#e8a245', minWidth: 32, textAlign: 'right' }}>
              {calc.uniformityTarget.toFixed(2)}
            </span>
          </div>
        </Field>
        <Field label="Maintenance Factor">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="range" min={0.5} max={1.0} step={0.05}
              value={calc.maintenanceFactor}
              onChange={(e) => upd('calculations', 'maintenanceFactor', Number(e.target.value))}
              style={{ flex: 1, accentColor: '#4a9fbf', cursor: 'pointer' }}
            />
            <span style={{ ...mono, fontSize: 10, color: '#6ae5ff', minWidth: 32, textAlign: 'right' }}>
              {calc.maintenanceFactor.toFixed(2)}
            </span>
          </div>
        </Field>
        {/* Lux category reference */}
        <div style={{ ...mono, fontSize: 8, color: '#2d4f68', marginTop: 6, lineHeight: 1.7 }}>
          Ref: Office 300–500 lx · Retail 500–750 lx · Corridor 100–200 lx · Warehouse 150–300 lx
        </div>
      </Section>

      {/* ── Surface Materials ── */}
      <Section title="SURFACE MATERIALS" icon="◫" open={open.materials} onToggle={() => toggle('materials')}>
        <Field label="Ceiling Reflectance">
          <ReflectanceBar value={materials.ceilingReflectance}
            onChange={(v) => upd('materials', 'ceilingReflectance', v)} />
        </Field>
        <Field label="Wall Reflectance">
          <ReflectanceBar value={materials.wallReflectance}
            onChange={(v) => upd('materials', 'wallReflectance', v)} />
        </Field>
        <Field label="Floor Reflectance">
          <ReflectanceBar value={materials.floorReflectance}
            onChange={(v) => upd('materials', 'floorReflectance', v)} />
        </Field>
        <div style={{ ...mono, fontSize: 8, color: '#2d4f68', marginTop: 4, lineHeight: 1.7 }}>
          Typical: White ceiling 70–80% · Light walls 50–60% · Carpet floor 10–20%
        </div>
      </Section>

      {/* ── Project Info ── */}
      <Section title="PROJECT INFO" icon="◉" open={open.project} onToggle={() => toggle('project')}>
        <Field label="Project Name">
          <TextInput value={project.name} placeholder="Untitled Project"
            onChange={(v) => upd('project', 'name', v)} />
        </Field>
        <Field label="Project Number">
          <TextInput value={project.number} placeholder="e.g. LT-2024-001"
            onChange={(v) => upd('project', 'number', v)} />
        </Field>
        <Field label="Location">
          <TextInput value={project.location} placeholder="Site address"
            onChange={(v) => upd('project', 'location', v)} />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 10px' }}>
          <Field label="Designer">
            <TextInput value={project.designer} placeholder="Your name"
              onChange={(v) => upd('project', 'designer', v)} />
          </Field>
          <Field label="Client">
            <TextInput value={project.client} placeholder="Client name"
              onChange={(v) => upd('project', 'client', v)} />
          </Field>
        </div>
      </Section>

    </div>
  )
}
