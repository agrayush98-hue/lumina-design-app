import { getNadirLux, getTotalLuxAtPoint, getBeamRadiusPx } from '../utils/luxCalculator'
import { beamDescription } from '../utils/luminousIntensityLookup'
import { SCALE } from '../utils/canvasConstants'
import { useConfirm } from './ConfirmModal'

export default function InspectorPanel({
  fixture,
  onUpdate,
  onDelete,
  selectedCount = 1,
  onDeleteSelected,
  allFixtures = [],
  ceilingHeight = 2700,
}) {
  const confirm = useConfirm()
  if (!fixture) return null

  const handleChange = (field, value) => {
    onUpdate(fixture.id, { [field]: value })
  }

  const handleDelete = async () => {
    const label = fixture.label ?? fixture.name ?? 'Fixture'
    const ok = await confirm(`Delete ${label}?`, { confirmLabel: "DELETE", danger: true })
    if (ok) onDelete(fixture.id)
  }

  const isDali = fixture.protocol?.startsWith('DALI')

  // ── Lux calculations ──
  const nadirLux = Math.round(getNadirLux(fixture, ceilingHeight))
  const totalLux = Math.round(getTotalLuxAtPoint(allFixtures, fixture.x, fixture.y, ceilingHeight))
  const beamR_px = getBeamRadiusPx(fixture, ceilingHeight)
  const beamR_m  = beamR_px !== null ? ((beamR_px / SCALE) / 1000).toFixed(2) : null
  const beamDesc = beamDescription(fixture.beamAngle || 60)

  const fieldStyle = { marginBottom: 12 }

  const labelStyle = {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 9,
    color: '#4a7a96',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    display: 'block',
  }

  const inputStyle = {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    background: '#0d1117',
    color: '#cdd9e5',
    border: '1px solid #1a2b3c',
    borderRadius: 3,
    padding: '6px 8px',
    width: '100%',
    boxSizing: 'border-box',
  }

  const readonlyStyle = {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 9,
    color: '#4a7a96',
    padding: '6px 8px',
    background: '#0a0f14',
    borderRadius: 3,
    border: '1px solid #1a2b3c',
  }

  return (
    <div style={{ padding: '12px' }}>
      {/* Multi-select banner */}
      {selectedCount > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '7px 10px',
            marginBottom: 10,
            background: '#071820',
            border: '1px solid #6ae5ff',
            borderRadius: 3,
          }}
        >
          <span
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 9,
              color: '#6ae5ff',
              letterSpacing: '0.08em',
            }}
          >
            {selectedCount} FIXTURES SELECTED
          </span>
          <button
            onClick={onDeleteSelected}
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 9,
              fontWeight: 600,
              padding: '3px 8px',
              background: '#2a1010',
              color: '#ff6b6b',
              border: '1px solid #4a2020',
              borderRadius: 2,
              cursor: 'pointer',
            }}
          >
            🗑 DELETE {selectedCount}
          </button>
        </div>
      )}

      {/* Header */}
      <div
        style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 10,
          color: '#d4a843',
          marginBottom: 12,
          fontWeight: 600,
          padding: '8px',
          border: '1px solid #d4a843',
          borderRadius: 3,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {fixture.shapeSymbol && (
          <span style={{ fontSize: 14, color: fixture.fill ?? '#d4a843' }}>
            {fixture.shapeSymbol}
          </span>
        )}
        FIXTURE INSPECTOR
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>ID</label>
        <div style={readonlyStyle}>{fixture.id}</div>
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>NAME</label>
        <input
          type="text"
          defaultValue={fixture.label ?? fixture.name ?? 'Fixture'}
          key={fixture.id + '_label'}
          onBlur={(e) => handleChange('label', e.target.value)}
          style={inputStyle}
        />
      </div>

      {/* Wattage */}
      <div style={fieldStyle}>
        <label style={labelStyle}>WATTAGE (W)</label>
        <input
          type="number"
          defaultValue={fixture.watt ?? 0}
          key={fixture.id + '_watt'}
          onBlur={(e) => handleChange('watt', parseInt(e.target.value) || 0)}
          style={inputStyle}
        />
      </div>

      <div style={fieldStyle}>
        <label style={labelStyle}>BEAM ANGLE (°)</label>
        <input
          type="number"
          defaultValue={fixture.beamAngle ?? 0}
          key={fixture.id + '_beam'}
          onBlur={(e) => handleChange('beamAngle', parseInt(e.target.value) || 0)}
          style={inputStyle}
        />
        <div style={{ ...readonlyStyle, marginTop: 3, fontSize: 8, color: '#2d4f68' }}>
          {beamDesc}
          {beamR_m !== null ? ` · ⌀ ${beamR_m}m at floor` : ' · omnidirectional'}
        </div>
      </div>

      {/* LUX AT FLOOR */}
      <div
        style={{
          marginBottom: 12,
          padding: '9px 10px',
          background: '#0a1410',
          border: '1px solid #1a3828',
          borderRadius: 3,
        }}
      >
        <div style={{ ...labelStyle, color: '#3dba74', marginBottom: 6 }}>
          LUX AT FLOOR  <span style={{ fontSize: 8, color: '#2d4f68' }}>H={ceilingHeight}mm</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{ ...labelStyle, fontSize: 8, marginBottom: 2 }}>THIS FIXTURE</div>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, color: '#3dba74', fontWeight: 600 }}>
              {nadirLux} <span style={{ fontSize: 9, fontWeight: 400 }}>lx</span>
            </div>
          </div>
          {allFixtures.length > 1 && (
            <div style={{ flex: 1 }}>
              <div style={{ ...labelStyle, fontSize: 8, marginBottom: 2 }}>ALL FIXTURES</div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 14, color: '#6ae5ff', fontWeight: 600 }}>
                {totalLux} <span style={{ fontSize: 9, fontWeight: 400 }}>lx</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lumens (read-only) */}
      {fixture.lumens != null && (
        <div style={fieldStyle}>
          <label style={labelStyle}>LUMENS (lm)</label>
          <div style={readonlyStyle}>{fixture.lumens} lm</div>
        </div>
      )}

      {/* CCT */}
      {fixture.cctType && (
        <div style={fieldStyle}>
          <label style={labelStyle}>CCT TYPE</label>
          <div style={readonlyStyle}>{fixture.cctType}</div>
        </div>
      )}

      {/* Protocol */}
      <div
        style={{
          marginBottom: 12,
          padding: '10px',
          background: '#0a111a',
          border: '1px solid #1a3040',
          borderRadius: 3,
        }}
      >
        <div
          style={{
            fontFamily: 'IBM Plex Mono, monospace',
            fontSize: 9,
            color: '#4a9fbf',
            marginBottom: 8,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          PROTOCOL
        </div>
        <div style={{ ...readonlyStyle, color: '#6ae5ff' }}>
          {fixture.protocol || 'Room Default'}
        </div>
      </div>

      {/* DALI address */}
      {isDali && (
        <div style={fieldStyle}>
          <label style={labelStyle}>DALI ADDRESS</label>
          <div
            style={{
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 10,
              color: fixture.daliAddress ? '#6ae5ff' : '#e8a245',
              padding: '6px 8px',
              background: '#0a0f14',
              borderRadius: 3,
              border: `1px solid ${fixture.daliAddress ? '#1a3a48' : '#3a2a1a'}`,
              fontWeight: 600,
            }}
          >
            {fixture.daliAddress || 'Not Assigned'}
          </div>
        </div>
      )}

      <div style={fieldStyle}>
        <label style={labelStyle}>POSITION</label>
        <div style={readonlyStyle}>
          X: {(fixture.x ?? 0).toFixed(0)} px | Y: {(fixture.y ?? 0).toFixed(0)} px
        </div>
      </div>

      <button
        onClick={handleDelete}
        style={{
          width: '100%',
          padding: '8px 12px',
          marginTop: 4,
          background: '#3a1a1a',
          color: '#ff6b6b',
          border: '1px solid #5a2a2a',
          borderRadius: 3,
          cursor: 'pointer',
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 10,
          fontWeight: 600,
        }}
        onMouseOver={(e) => { e.target.style.background = '#5a2a2a'; e.target.style.borderColor = '#7a3a3a' }}
        onMouseOut={(e)  => { e.target.style.background = '#3a1a1a'; e.target.style.borderColor = '#5a2a2a' }}
      >
        ✕ DELETE FIXTURE
      </button>
    </div>
  )
}
