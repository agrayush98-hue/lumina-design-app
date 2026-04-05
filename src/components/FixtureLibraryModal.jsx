import { useState } from 'react'
import { fixtureDatabase, getWattageColor } from '../fixtureDatabase'

const S = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    background: '#0d1117',
    color: '#cdd9e5',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 11,
    padding: '24px',
    border: '1px solid #1a2b3c',
    borderRadius: 4,
    width: 720,
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 12,
    color: '#d4a843',
    marginBottom: 16,
    fontWeight: 600,
    borderBottom: '1px solid #1a2b3c',
    paddingBottom: 12,
    flexShrink: 0,
    letterSpacing: '0.1em',
  },
  colLabel: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 9,
    color: '#4a7a96',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  col: {
    flex: 1,
    borderRight: '1px solid #1a2b3c',
    paddingRight: 10,
    marginRight: 10,
    overflowY: 'auto',
    minWidth: 0,
  },
  colLast: {
    flex: 1,
    overflowY: 'auto',
    minWidth: 0,
  },
  item: (active) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 10px',
    margin: '2px 0',
    background: active ? '#1a3a5a' : '#0a0f14',
    border: `1px solid ${active ? '#4a9fbf' : '#1a2b3c'}`,
    borderRadius: 3,
    color: active ? '#6ae5ff' : '#4a7a96',
    cursor: 'pointer',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    fontWeight: active ? 600 : 400,
    userSelect: 'none',
    transition: 'background 0.15s, border-color 0.15s',
  }),
  wattItem: (active, colorHex) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 10px',
    margin: '2px 0',
    background: active ? '#1a2a3a' : '#0a0f14',
    border: `1px solid ${active ? colorHex : '#1a2b3c'}`,
    borderRadius: 3,
    color: active ? colorHex : '#4a7a96',
    cursor: 'pointer',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    fontWeight: active ? 600 : 400,
    userSelect: 'none',
    transition: 'background 0.15s, border-color 0.15s',
  }),
  colorDot: (hex) => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: hex,
    flexShrink: 0,
    boxShadow: `0 0 4px ${hex}88`,
  }),
  placeholder: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 9,
    color: '#2d4f68',
    padding: '20px 8px',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  protocolRow: {
    marginTop: 14,
    paddingTop: 12,
    borderTop: '1px solid #1a2b3c',
    flexShrink: 0,
  },
  protocolLabel: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 9,
    color: '#4a7a96',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
  },
  select: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    background: '#0a0f14',
    color: '#cdd9e5',
    border: '1px solid #1a2b3c',
    borderRadius: 3,
    padding: '6px 8px',
    width: 220,
    cursor: 'pointer',
  },
  input: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    background: '#0a0f14',
    color: '#cdd9e5',
    border: '1px solid #1a2b3c',
    borderRadius: 3,
    padding: '6px 8px',
    width: 100,
    boxSizing: 'border-box',
  },
  btnRow: {
    display: 'flex',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTop: '1px solid #1a2b3c',
    flexShrink: 0,
  },
  btnClose: {
    flex: 1,
    padding: '8px 16px',
    background: '#1a2a3a',
    color: '#cdd9e5',
    border: '1px solid #2a3a4a',
    borderRadius: 3,
    cursor: 'pointer',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    fontWeight: 600,
  },
  btnAdd: (disabled) => ({
    flex: 2,
    padding: '8px 16px',
    background: disabled ? '#1a2a3a' : '#d4a843',
    color: disabled ? '#4a5a6a' : '#0f0f0f',
    border: `1px solid ${disabled ? '#2a3a4a' : '#d4a843'}`,
    borderRadius: 3,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    fontWeight: 600,
  }),
  fixtureInfo: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 9,
    color: '#3a5a6a',
    marginTop: 6,
    lineHeight: 1.6,
    borderTop: '1px solid #1a2b3c',
    paddingTop: 8,
    flexShrink: 0,
  },
}

export default function FixtureLibraryModal({ onClose, onAddFixture }) {
  const [selectedFixture, setSelectedFixture] = useState(null)
  const [selectedWattage, setSelectedWattage] = useState(null)
  const [customWattage, setCustomWattage]     = useState('')
  const [selectedBeam, setSelectedBeam]       = useState(null)
  const [selectedProtocol, setSelectedProtocol] = useState(null)

  const isLedStrip   = selectedFixture?.id === 'led-strip'
  const effectiveWatt = isLedStrip ? parseInt(customWattage) || null : selectedWattage
  const wattColor     = effectiveWatt ? getWattageColor(effectiveWatt) : null

  const canAdd = selectedFixture && selectedBeam !== null &&
    (isLedStrip ? (parseInt(customWattage) > 0) : selectedWattage !== null)

  const handleSelectFixture = (fix) => {
    setSelectedFixture(fix)
    setSelectedWattage(null)
    setCustomWattage('')
    setSelectedBeam(null)
    setSelectedProtocol(fix.defaultProtocol)
  }

  const handleAdd = () => {
    if (!canAdd) return
    const watt = isLedStrip ? parseInt(customWattage) : selectedWattage
    const wc   = getWattageColor(watt)
    onAddFixture({
      fixtureId:          selectedFixture.id,
      name:               selectedFixture.name,
      category:           selectedFixture.category,
      shape:              selectedFixture.shape,
      symbol:             selectedFixture.symbol,
      wattage:            watt,
      wattageColor:       wc,
      beamAngle:          selectedBeam,
      protocol:           selectedProtocol || selectedFixture.defaultProtocol,
      supportedProtocols: selectedFixture.supportedProtocols,
      lumensPerWatt:      selectedFixture.lumensPerWatt,
      cct:                selectedFixture.cct,
    })
  }

  return (
    <div style={S.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={S.modal}>
        <div style={S.header}>FIXTURE LIBRARY — SELECT TYPE · WATTAGE · BEAM ANGLE</div>

        {/* 3-column selector */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Col 1 — Fixture type */}
          <div style={S.col}>
            <div style={S.colLabel}>FIXTURE TYPE</div>
            {fixtureDatabase.map((fix) => (
              <div
                key={fix.id}
                style={S.item(selectedFixture?.id === fix.id)}
                onClick={() => handleSelectFixture(fix)}
              >
                <span style={{ fontSize: 13, lineHeight: 1 }}>{fix.symbol}</span>
                <span>{fix.name}</span>
              </div>
            ))}
          </div>

          {/* Col 2 — Wattage */}
          <div style={S.col}>
            <div style={S.colLabel}>WATTAGE</div>
            {!selectedFixture && (
              <div style={S.placeholder}>← Select a fixture type</div>
            )}
            {selectedFixture && !isLedStrip && selectedFixture.wattages.map((w) => {
              const wc = getWattageColor(w)
              return (
                <div
                  key={w}
                  style={S.wattItem(selectedWattage === w, wc.hex)}
                  onClick={() => setSelectedWattage(w)}
                >
                  <div style={S.colorDot(wc.hex)} />
                  <span>{w}W</span>
                  <span style={{ fontSize: 8, color: '#3a5a6a', marginLeft: 4 }}>
                    ({wc.name})
                  </span>
                </div>
              )
            })}
            {selectedFixture && isLedStrip && (
              <div style={{ padding: '6px 0' }}>
                <div style={{ fontSize: 9, color: '#4a7a96', marginBottom: 6 }}>
                  TOTAL WATTAGE (W)
                </div>
                <input
                  type="number"
                  min={1}
                  placeholder="e.g. 24"
                  value={customWattage}
                  onChange={(e) => setCustomWattage(e.target.value)}
                  style={S.input}
                />
                <div style={{ fontSize: 8, color: '#2d4f68', marginTop: 6, lineHeight: 1.6 }}>
                  Ref W/m: {selectedFixture.wattagePerMeter.join(', ')} W/m
                </div>
                {wattColor && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
                    <div style={S.colorDot(wattColor.hex)} />
                    <span style={{ fontSize: 9, color: wattColor.hex }}>{wattColor.name}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Col 3 — Beam angle */}
          <div style={S.colLast}>
            <div style={S.colLabel}>BEAM ANGLE</div>
            {!selectedFixture && (
              <div style={S.placeholder}>← Select a fixture type</div>
            )}
            {selectedFixture && selectedFixture.beamAngles.map((b) => (
              <div
                key={b}
                style={S.item(selectedBeam === b)}
                onClick={() => setSelectedBeam(b)}
              >
                {b}°
              </div>
            ))}
          </div>
        </div>

        {/* Protocol selector */}
        {selectedFixture && (
          <div style={S.protocolRow}>
            <div style={S.protocolLabel}>PROTOCOL</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <select
                value={selectedProtocol || selectedFixture.defaultProtocol}
                onChange={(e) => setSelectedProtocol(e.target.value)}
                style={S.select}
              >
                {selectedFixture.supportedProtocols.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <div style={{ fontSize: 9, color: '#2d4f68', lineHeight: 1.6 }}>
                Supported: {selectedFixture.supportedProtocols.join(' · ')}
              </div>
            </div>
          </div>
        )}

        {/* Info strip when fixture selected */}
        {selectedFixture && (
          <div style={S.fixtureInfo}>
            CCT: {selectedFixture.cct} &nbsp;·&nbsp;
            Efficacy: ~{selectedFixture.lumensPerWatt} lm/W &nbsp;·&nbsp;
            Shape: {selectedFixture.symbol}
            {effectiveWatt && wattColor && (
              <> &nbsp;·&nbsp; Color band: <span style={{ color: wattColor.hex }}>{wattColor.name} ({effectiveWatt}W)</span></>
            )}
          </div>
        )}

        {/* Selection checklist */}
        {selectedFixture && (
          <div
            style={{
              display: 'flex',
              gap: 16,
              padding: '8px 10px',
              background: '#080d12',
              border: '1px solid #1a2b3c',
              borderRadius: 3,
              marginTop: 10,
              flexShrink: 0,
            }}
          >
            {[
              {
                label: isLedStrip ? 'Wattage entered' : 'Wattage',
                ok: isLedStrip ? parseInt(customWattage) > 0 : selectedWattage !== null,
              },
              { label: 'Beam angle', ok: selectedBeam !== null },
            ].map(({ label, ok }) => (
              <span
                key={label}
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 9,
                  color: ok ? '#3dba74' : '#e8a245',
                  letterSpacing: '0.06em',
                }}
              >
                {ok ? '✓' : '✕'} {label}
              </span>
            ))}
          </div>
        )}

        {/* Action buttons */}
        <div style={S.btnRow}>
          <button onClick={onClose} style={S.btnClose}>CLOSE</button>
          <button
            onClick={handleAdd}
            style={{
              flex: 2,
              padding: '8px 16px',
              background: canAdd ? '#d4a843' : '#1a2a3a',
              color: canAdd ? '#0f0f0f' : '#4a5a6a',
              border: `1px solid ${canAdd ? '#d4a843' : '#2a3a4a'}`,
              borderRadius: 3,
              cursor: canAdd ? 'pointer' : 'not-allowed',
              fontFamily: 'IBM Plex Mono, monospace',
              fontSize: 10,
              fontWeight: 600,
            }}
          >
            {canAdd ? '✓ ADD TO DESIGN' : '⊘ SELECT ALL FIELDS'}
          </button>
        </div>
      </div>
    </div>
  )
}
