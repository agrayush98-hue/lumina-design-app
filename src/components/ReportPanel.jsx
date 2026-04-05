import { useState, useMemo } from 'react'
import { useSettings } from '../contexts/SettingsContext'
import { computeRoomLuxStats } from '../utils/luxCalculator'
import { computeRoomGeometry } from '../utils/canvasConstants'

const mono = { fontFamily: 'IBM Plex Mono, monospace' }

// ── small helpers ─────────────────────────────────────────────────────────────

function CheckRow({ label, checked, onChange }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', cursor: 'pointer', borderBottom: '1px solid #0e1520' }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        style={{ accentColor: '#d4a843', width: 13, height: 13, cursor: 'pointer' }}
      />
      <span style={{ ...mono, fontSize: 10, color: '#cdd9e5' }}>{label}</span>
    </label>
  )
}

function SectionHeader({ children }) {
  return (
    <div style={{ ...mono, fontSize: 9, color: '#4a7a96', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6, marginTop: 14, paddingBottom: 5, borderBottom: '1px solid #1a2b3c' }}>
      {children}
    </div>
  )
}

function StatCell({ label, value, color = '#cdd9e5' }) {
  return (
    <div style={{ padding: '6px 8px', background: '#080d12', borderRadius: 2, border: '1px solid #131d28' }}>
      <div style={{ ...mono, fontSize: 7, color: '#2d4f68', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ ...mono, fontSize: 12, color, fontWeight: 600 }}>{value}</div>
    </div>
  )
}

// ── main export ───────────────────────────────────────────────────────────────

export default function ReportPanel({ fixtures = [] }) {
  const { settings, updateSetting } = useSettings()
  const { project, room, calculations: calc, export: exp } = settings

  // local options that aren't persisted settings
  const [quality, setQuality]   = useState(exp.quality || 'Medium')

  const upd = updateSetting

  // ── derived stats ────────────────────────────────────────────────────────
  const totalPower   = fixtures.reduce((s, f) => s + (f.wattage || f.power || 0), 0)
  const daliCount    = fixtures.filter((f) => f.daliAddress).length
  const roomArea     = (room.width / 1000) * (room.length / 1000)
  const lpd          = roomArea > 0 ? (totalPower / roomArea).toFixed(1) : '—'

  const roomGeom = useMemo(
    () => computeRoomGeometry(room.width, room.length),
    [room.width, room.length]
  )

  const luxStats = fixtures.length > 0
    ? computeRoomLuxStats(fixtures, calc.ceilingHeight, { reflectances: settings.materials, roomGeom })
    : null

  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  // ── export handler ────────────────────────────────────────────────────────
  const handleExport = () => {
    window.print()
  }

  return (
    <div style={{ padding: '12px' }}>

      {/* ── Design Summary ─────────────────────────────────────────────── */}
      <div style={{ ...mono, fontSize: 9, color: '#d4a843', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>
        DESIGN SUMMARY
      </div>

      {/* Project identity card */}
      <div style={{ padding: '10px 12px', background: '#0a111a', border: '1px solid #1a2b3c', borderRadius: 3, marginBottom: 10 }}>
        <div style={{ ...mono, fontSize: 12, color: '#cdd9e5', fontWeight: 600, marginBottom: 2 }}>
          {project.name || 'Untitled Project'}
        </div>
        {project.number && (
          <div style={{ ...mono, fontSize: 9, color: '#4a7a96' }}>{project.number}</div>
        )}
        {project.location && (
          <div style={{ ...mono, fontSize: 9, color: '#2d4f68', marginTop: 2 }}>{project.location}</div>
        )}
        <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
          {project.designer && (
            <span style={{ ...mono, fontSize: 8, color: '#2d4f68' }}>
              Designer: <span style={{ color: '#4a7a96' }}>{project.designer}</span>
            </span>
          )}
          {project.client && (
            <span style={{ ...mono, fontSize: 8, color: '#2d4f68' }}>
              Client: <span style={{ color: '#4a7a96' }}>{project.client}</span>
            </span>
          )}
          <span style={{ ...mono, fontSize: 8, color: '#2d4f68' }}>
            Date: <span style={{ color: '#4a7a96' }}>{today}</span>
          </span>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 10 }}>
        <StatCell label="Fixtures"    value={fixtures.length}       color="#d4a843" />
        <StatCell label="Total Power" value={`${totalPower}W`}      color="#e8a245" />
        <StatCell label="Room Area"   value={`${roomArea.toFixed(0)} m²`} color="#6ae5ff" />
        <StatCell label="LPD"         value={`${lpd} W/m²`}         color="#a78bfa" />
        {luxStats && <>
          <StatCell label="Avg Lux"     value={`${luxStats.avg} lx`}   color="#3dba74" />
          <StatCell label="Uniformity"  value={luxStats.uniformity}
            color={parseFloat(luxStats.uniformity) >= 0.4 ? '#3dba74' : '#e8a245'} />
        </>}
        {luxStats && <>
          <StatCell label="Min Lux" value={`${luxStats.min} lx`} color="#4a7a96" />
          <StatCell label="Max Lux" value={`${luxStats.max} lx`} color="#d4a843" />
        </>}
        <StatCell label="DALI Assigned" value={`${daliCount} / ${fixtures.length}`} color="#6ae5ff" />
        <StatCell label="Ceiling H"     value={`${calc.ceilingHeight} mm`}          color="#cdd9e5" />
      </div>

      {/* Compliance check */}
      {luxStats && (
        <div style={{ padding: '8px 10px', background: '#0a111a', border: `1px solid ${luxStats.avg >= calc.targetLux ? '#1a3828' : '#3a2010'}`, borderRadius: 3, marginBottom: 10 }}>
          <div style={{ ...mono, fontSize: 8, color: '#2d4f68', marginBottom: 4 }}>COMPLIANCE CHECK</div>
          {[
            {
              label: `Avg lux ≥ target (${calc.targetLux} lx)`,
              pass: luxStats.avg >= calc.targetLux,
            },
            {
              label: `Uniformity ≥ ${calc.uniformityTarget.toFixed(2)}`,
              pass: parseFloat(luxStats.uniformity) >= calc.uniformityTarget,
            },
          ].map(({ label, pass }) => (
            <div key={label} style={{ ...mono, fontSize: 9, color: pass ? '#3dba74' : '#e8a245', marginBottom: 2 }}>
              {pass ? '✓' : '✗'} {label}
            </div>
          ))}
        </div>
      )}

      {/* ── Export Options ──────────────────────────────────────────────── */}
      <SectionHeader>INCLUDE IN REPORT</SectionHeader>

      <CheckRow
        label="Heat Map overlay"
        checked={exp.includeHeatMap}
        onChange={(v) => upd('export', 'includeHeatMap', v)}
      />
      <CheckRow
        label="Beam diagrams"
        checked={exp.includeBeamDiagram}
        onChange={(v) => upd('export', 'includeBeamDiagram', v)}
      />
      <CheckRow
        label="Fixture schedule"
        checked={exp.includeFixtureSchedule}
        onChange={(v) => upd('export', 'includeFixtureSchedule', v)}
      />
      <CheckRow
        label="Lux calculation table"
        checked={exp.includeLuxReport}
        onChange={(v) => upd('export', 'includeLuxReport', v)}
      />
      <CheckRow
        label="Title block"
        checked={exp.includeTitleBlock}
        onChange={(v) => upd('export', 'includeTitleBlock', v)}
      />

      <SectionHeader>EXPORT SETTINGS</SectionHeader>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div>
          <div style={{ ...mono, fontSize: 8, color: '#4a7a96', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Format</div>
          <select
            value={exp.format}
            onChange={(e) => upd('export', 'format', e.target.value)}
            style={{ ...mono, fontSize: 10, background: '#0a0f14', color: '#cdd9e5', border: '1px solid #1a2b3c', borderRadius: 3, padding: '5px 7px', width: '100%', cursor: 'pointer' }}
          >
            <option value="PDF">PDF</option>
            <option value="PNG">PNG</option>
            <option value="SVG">SVG</option>
            <option value="DWG">DWG</option>
          </select>
        </div>
        <div>
          <div style={{ ...mono, fontSize: 8, color: '#4a7a96', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Paper Size</div>
          <select
            value={exp.paperSize}
            onChange={(e) => upd('export', 'paperSize', e.target.value)}
            style={{ ...mono, fontSize: 10, background: '#0a0f14', color: '#cdd9e5', border: '1px solid #1a2b3c', borderRadius: 3, padding: '5px 7px', width: '100%', cursor: 'pointer' }}
          >
            {['A4', 'A3', 'A1', 'Letter', 'Tabloid'].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 14 }}>
        <div style={{ ...mono, fontSize: 8, color: '#4a7a96', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>PDF Quality</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['Low', 'Medium', 'High'].map((q) => (
            <button
              key={q}
              onClick={() => { setQuality(q); upd('export', 'quality', q) }}
              style={{
                ...mono, flex: 1, fontSize: 9, padding: '5px 8px',
                background: quality === q ? '#1a2a3a' : '#0a0f14',
                color: quality === q ? '#6ae5ff' : '#2d4f68',
                border: `1px solid ${quality === q ? '#6ae5ff' : '#1a2b3c'}`,
                borderRadius: 3, cursor: 'pointer',
              }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* ── Export button ─────────────────────────────────────────────────── */}
      {fixtures.length === 0 ? (
        <div style={{ ...mono, fontSize: 9, color: '#2d4f68', textAlign: 'center', padding: '16px 0' }}>
          No fixtures placed yet — add fixtures to generate a report.
        </div>
      ) : (
        <button
          onClick={handleExport}
          style={{
            ...mono, width: '100%', fontSize: 11, fontWeight: 600,
            padding: '10px 16px',
            background: 'linear-gradient(135deg, #d4a843 0%, #b88a2e 100%)',
            color: '#0f0f0f',
            border: '1px solid #d4a843',
            borderRadius: 3, cursor: 'pointer',
            letterSpacing: '0.06em',
            boxShadow: '0 2px 12px rgba(212,168,67,0.25)',
          }}
          onMouseOver={(e) => { e.currentTarget.style.opacity = '0.88' }}
          onMouseOut={(e)  => { e.currentTarget.style.opacity = '1' }}
        >
          📥 EXPORT TO PDF
        </button>
      )}

    </div>
  )
}
