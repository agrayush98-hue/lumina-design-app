import { useState } from 'react'
import { useSettings, DEFAULT_SETTINGS } from '../contexts/SettingsContext'

// ── small reusable pieces ────────────────────────────────────────────────────

const mono = { fontFamily: 'IBM Plex Mono, monospace' }

function Toggle({ value, onChange }) {
  return (
    <div
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        width: 36, height: 20, borderRadius: 10, flexShrink: 0,
        background: value ? '#3dba74' : '#1a2b3c',
        border: `1px solid ${value ? '#2a9457' : '#2a3a4a'}`,
        cursor: 'pointer', position: 'relative', transition: 'background 0.18s',
      }}
    >
      <div style={{
        position: 'absolute', top: 3,
        left: value ? 18 : 3,
        width: 12, height: 12, borderRadius: '50%',
        background: value ? '#fff' : '#4a7a96',
        transition: 'left 0.18s',
      }} />
    </div>
  )
}

function Row({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #0e1520' }}>
      <div>
        <div style={{ ...mono, fontSize: 10, color: '#cdd9e5' }}>{label}</div>
        {hint && <div style={{ ...mono, fontSize: 8, color: '#2d4f68', marginTop: 2 }}>{hint}</div>}
      </div>
      <div style={{ flexShrink: 0, marginLeft: 16 }}>{children}</div>
    </div>
  )
}

function SectionHeader({ children }) {
  return (
    <div style={{ ...mono, fontSize: 9, color: '#d4a843', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4, marginTop: 4, paddingBottom: 6, borderBottom: '1px solid #1a2b3c' }}>
      {children}
    </div>
  )
}

const inputStyle = {
  ...mono, fontSize: 10,
  background: '#0a0f14', color: '#cdd9e5',
  border: '1px solid #1a2b3c', borderRadius: 3,
  padding: '5px 8px',
}

const selectStyle = {
  ...mono, fontSize: 10,
  background: '#0a0f14', color: '#cdd9e5',
  border: '1px solid #1a2b3c', borderRadius: 3,
  padding: '5px 8px', cursor: 'pointer',
}

// ── Section panels ────────────────────────────────────────────────────────────

function DisplaySection({ s, upd }) {
  return (
    <>
      <SectionHeader>Display</SectionHeader>
      <Row label="Show Grid" hint="Background grid lines">
        <Toggle value={s.showGrid} onChange={(v) => upd('display', 'showGrid', v)} />
      </Row>
      <Row label="Show Ruler" hint="Tick marks along room edges">
        <Toggle value={s.showRuler} onChange={(v) => upd('display', 'showRuler', v)} />
      </Row>
      <Row label="Show Dimension Lines" hint="Width / height arrows">
        <Toggle value={s.showDimensionLines} onChange={(v) => upd('display', 'showDimensionLines', v)} />
      </Row>
      <Row label="Show Fixture Labels" hint="Name label below each fixture">
        <Toggle value={s.showFixtureLabels} onChange={(v) => upd('display', 'showFixtureLabels', v)} />
      </Row>
      <Row label="Grid Opacity" hint={`${s.gridOpacity}%`}>
        <input
          type="range" min={10} max={100} step={5}
          value={s.gridOpacity}
          onChange={(e) => upd('display', 'gridOpacity', Number(e.target.value))}
          style={{ width: 100, accentColor: '#d4a843', cursor: 'pointer' }}
        />
      </Row>
    </>
  )
}

function CalcSection({ s, upd }) {
  return (
    <>
      <SectionHeader>Calculations</SectionHeader>
      <Row label="Ceiling / Mounting Height" hint="Used for all lux & beam calculations">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number" min={500} max={10000} step={100}
            value={s.ceilingHeight}
            onChange={(e) => upd('calculations', 'ceilingHeight', Number(e.target.value) || 2700)}
            style={{ ...inputStyle, width: 72, textAlign: 'right' }}
          />
          <span style={{ ...mono, fontSize: 9, color: '#4a7a96' }}>mm</span>
        </div>
      </Row>
      <Row label="Target Illuminance" hint="Design target for space">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <input
            type="number" min={50} max={5000} step={50}
            value={s.targetLux}
            onChange={(e) => upd('calculations', 'targetLux', Number(e.target.value) || 300)}
            style={{ ...inputStyle, width: 72, textAlign: 'right' }}
          />
          <span style={{ ...mono, fontSize: 9, color: '#4a7a96' }}>lx</span>
        </div>
      </Row>
      <Row label="Maintenance Factor" hint="Light loss factor (0.5 – 1.0)">
        <input
          type="number" min={0.5} max={1.0} step={0.05}
          value={s.maintenanceFactor}
          onChange={(e) => upd('calculations', 'maintenanceFactor', Number(e.target.value) || 0.8)}
          style={{ ...inputStyle, width: 72, textAlign: 'right' }}
        />
      </Row>
      <Row label="Uniformity Target" hint="Min/Avg ratio threshold (≥ 0.40 = good)">
        <input
          type="number" min={0.1} max={1.0} step={0.05}
          value={s.uniformityTarget}
          onChange={(e) => upd('calculations', 'uniformityTarget', Number(e.target.value) || 0.4)}
          style={{ ...inputStyle, width: 72, textAlign: 'right' }}
        />
      </Row>
    </>
  )
}

function UnitsSection({ s, upd }) {
  return (
    <>
      <SectionHeader>Units</SectionHeader>
      <Row label="Length Unit">
        <select value={s.length} onChange={(e) => upd('units', 'length', e.target.value)} style={selectStyle}>
          <option value="mm">mm</option>
          <option value="cm">cm</option>
          <option value="m">m</option>
          <option value="ft">ft</option>
        </select>
      </Row>
      <Row label="Illuminance Unit">
        <select value={s.illuminance} onChange={(e) => upd('units', 'illuminance', e.target.value)} style={selectStyle}>
          <option value="lux">lux (lx)</option>
          <option value="fc">foot-candle (fc)</option>
        </select>
      </Row>
    </>
  )
}

function ProjectSection({ s, upd }) {
  const field = (key, placeholder) => (
    <input
      type="text"
      value={s[key]}
      placeholder={placeholder}
      onChange={(e) => upd('project', key, e.target.value)}
      style={{ ...inputStyle, width: 180 }}
    />
  )
  return (
    <>
      <SectionHeader>Project</SectionHeader>
      <Row label="Project Name">{field('name', 'Untitled Project')}</Row>
      <Row label="Project Number">{field('number', 'e.g. LT-2024-001')}</Row>
      <Row label="Designer">{field('designer', 'Your name')}</Row>
      <Row label="Client">{field('client', 'Client name')}</Row>
    </>
  )
}

function ExportSection({ s, upd }) {
  return (
    <>
      <SectionHeader>Export</SectionHeader>
      <Row label="Export Format">
        <select value={s.format} onChange={(e) => upd('export', 'format', e.target.value)} style={selectStyle}>
          <option value="PDF">PDF</option>
          <option value="PNG">PNG</option>
          <option value="SVG">SVG</option>
          <option value="DWG">DWG</option>
        </select>
      </Row>
      <Row label="Paper Size">
        <select value={s.paperSize} onChange={(e) => upd('export', 'paperSize', e.target.value)} style={selectStyle}>
          <option value="A4">A4</option>
          <option value="A3">A3</option>
          <option value="A1">A1</option>
          <option value="Letter">Letter</option>
          <option value="Tabloid">Tabloid</option>
        </select>
      </Row>
      <Row label="Include Title Block">
        <Toggle value={s.includeTitleBlock} onChange={(v) => upd('export', 'includeTitleBlock', v)} />
      </Row>
      <Row label="Include Fixture Schedule">
        <Toggle value={s.includeFixtureSchedule} onChange={(v) => upd('export', 'includeFixtureSchedule', v)} />
      </Row>
      <Row label="Include Lux Report">
        <Toggle value={s.includeLuxReport} onChange={(v) => upd('export', 'includeLuxReport', v)} />
      </Row>
    </>
  )
}

function PerformanceSection({ s, upd }) {
  return (
    <>
      <SectionHeader>Performance</SectionHeader>
      <Row label="Heat Map Cell Size" hint="Smaller = more detail, slower render">
        <select
          value={s.heatMapCellSize}
          onChange={(e) => upd('performance', 'heatMapCellSize', Number(e.target.value))}
          style={selectStyle}
        >
          <option value={4}>4 px — high detail</option>
          <option value={8}>8 px — balanced</option>
          <option value={16}>16 px — fast</option>
          <option value={32}>32 px — draft</option>
        </select>
      </Row>
      <Row label="Auto-Update Heat Map" hint="Recompute on every fixture change">
        <Toggle value={s.autoUpdateHeatMap} onChange={(v) => upd('performance', 'autoUpdateHeatMap', v)} />
      </Row>
    </>
  )
}

// ── TABS ─────────────────────────────────────────────────────────────────────

const TABS = [
  { id: 'display',      label: 'Display' },
  { id: 'calculations', label: 'Calculations' },
  { id: 'units',        label: 'Units' },
  { id: 'project',      label: 'Project' },
  { id: 'export',       label: 'Export' },
  { id: 'performance',  label: 'Performance' },
]

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────

export default function SettingsModal({ isOpen, onClose }) {
  const { settings, updateSetting, resetSettings } = useSettings()
  const [activeTab, setActiveTab] = useState('display')

  if (!isOpen) return null

  const s   = settings[activeTab] ?? {}
  const upd = updateSetting

  const handleReset = () => {
    if (window.confirm('Reset all settings to defaults?')) resetSettings()
  }

  const sectionContent = () => {
    switch (activeTab) {
      case 'display':      return <DisplaySection     s={settings.display}      upd={upd} />
      case 'calculations': return <CalcSection        s={settings.calculations} upd={upd} />
      case 'units':        return <UnitsSection       s={settings.units}        upd={upd} />
      case 'project':      return <ProjectSection     s={settings.project}      upd={upd} />
      case 'export':       return <ExportSection      s={settings.export}       upd={upd} />
      case 'performance':  return <PerformanceSection s={settings.performance}  upd={upd} />
      default:             return null
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: '#0d1117', border: '1px solid #1a2b3c', borderRadius: 4, width: 680, maxHeight: '84vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #1a2b3c', flexShrink: 0 }}>
          <span style={{ ...mono, fontSize: 12, color: '#d4a843', fontWeight: 600, letterSpacing: '0.12em' }}>
            ⚙ SETTINGS
          </span>
          <button
            onClick={onClose}
            style={{ ...mono, background: 'transparent', border: 'none', color: '#4a7a96', fontSize: 16, cursor: 'pointer', lineHeight: 1, padding: '2px 6px' }}
          >
            ✕
          </button>
        </div>

        {/* Body — left tabs + right content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left tab nav */}
          <div style={{ width: 140, borderRight: '1px solid #1a2b3c', display: 'flex', flexDirection: 'column', padding: '8px 0', flexShrink: 0 }}>
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                style={{
                  ...mono, fontSize: 10, textAlign: 'left',
                  padding: '9px 16px', border: 'none', cursor: 'pointer',
                  background: activeTab === t.id ? '#0e1d2a' : 'transparent',
                  color: activeTab === t.id ? '#6ae5ff' : '#4a7a96',
                  borderLeft: `2px solid ${activeTab === t.id ? '#6ae5ff' : 'transparent'}`,
                  letterSpacing: '0.06em',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Right content */}
          <div style={{ flex: 1, padding: '16px 20px', overflowY: 'auto' }}>
            {sectionContent()}
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', gap: 10, padding: '12px 20px', borderTop: '1px solid #1a2b3c', flexShrink: 0 }}>
          <button
            onClick={handleReset}
            style={{ ...mono, fontSize: 10, padding: '7px 14px', background: '#1a0e0a', color: '#8b3a3a', border: '1px solid #3a1a1a', borderRadius: 3, cursor: 'pointer' }}
          >
            RESET TO DEFAULT
          </button>
          <div style={{ flex: 1 }} />
          <button
            onClick={onClose}
            style={{ ...mono, fontSize: 10, padding: '7px 14px', background: '#1a2a3a', color: '#cdd9e5', border: '1px solid #2a3a4a', borderRadius: 3, cursor: 'pointer' }}
          >
            CLOSE
          </button>
          <button
            onClick={onClose}
            style={{ ...mono, fontSize: 10, fontWeight: 600, padding: '7px 20px', background: '#d4a843', color: '#0f0f0f', border: '1px solid #d4a843', borderRadius: 3, cursor: 'pointer' }}
          >
            DONE
          </button>
        </div>
      </div>
    </div>
  )
}
