import { useState } from 'react'
import { CONFIGURABLE_FIXTURES } from '../data/configurable-fixtures'
import './FixtureConfigurator.css'

export default function FixtureConfigurator({ fixture = null, onAddFixture, onClose }) {
  // Default to COB_DOWNLIGHT if no fixture provided
  const activeFixture = fixture || CONFIGURABLE_FIXTURES.find(f => f.id === 'cob-downlight')

  // Default selections
  const [power, setPower] = useState(12)
  const [beamAngle, setBeamAngle] = useState(36)
  const [chip, setChip] = useState(activeFixture.chipOptions ? activeFixture.chipOptions[0] : null)
  const [cct, setCct] = useState(4000)

  const lumens = activeFixture.calculateLumens ? activeFixture.calculateLumens(power, chip) : power * 100

  function handleAddToCanvas() {
    const config = {
      id: `${activeFixture.id}-${Date.now()}`,
      fixtureId: activeFixture.id,
      category: activeFixture.category,
      name: `${activeFixture.name} ${power}W`,
      source: 'configurator',
      mounting: activeFixture.mounting || 'Recessed',
      power,
      beamAngle,
      chip: chip?.brand || chip?.label || 'Standard',
      cct,
      lumens,
    }
    onAddFixture?.(config)
    onClose?.()
  }

  return (
    <div className="configurator-modal">
      <div className="configurator-overlay" onClick={onClose} />
      <div className="configurator-panel">
        {/* Header */}
        <div className="configurator-header">
          <div className="configurator-title">{activeFixture.name} Configurator</div>
          <button className="configurator-close" onClick={onClose}>✕</button>
        </div>

        {/* Body */}
        <div className="configurator-body">

          {/* Power Section */}
          <div className="configurator-section">
            <div className="configurator-section-label">Power (Watts)</div>
            <div className="configurator-grid-16">
              {activeFixture.powerOptions.map(w => (
                <button
                  key={w}
                  className={`configurator-btn ${power === w ? 'active' : ''}`}
                  onClick={() => setPower(w)}
                >
                  {w}W
                </button>
              ))}
            </div>
          </div>

          {/* Beam Angle Section */}
          <div className="configurator-section">
            <div className="configurator-section-label">Beam Angle</div>
            <div className="configurator-grid-5">
              {activeFixture.beamOptions.map(b => (
                <button
                  key={b.angle}
                  className={`configurator-btn ${beamAngle === b.angle ? 'active' : ''}`}
                  onClick={() => setBeamAngle(b.angle)}
                >
                  <div className="btn-angle">{b.angle}°</div>
                  <div className="btn-label">{b.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* LED Chip Section */}
          {activeFixture.chipOptions && (
            <div className="configurator-section">
              <div className="configurator-section-label">LED Chip</div>
              <div className="configurator-grid-4">
                {activeFixture.chipOptions.map(c => (
                  <button
                    key={c.brand}
                    className={`configurator-chip-card ${chip && chip.brand === c.brand ? 'active' : ''}`}
                    onClick={() => setChip(c)}
                  >
                    <div className="chip-brand">{c.brand}</div>
                    <div className="chip-specs">
                      <span className="chip-efficacy">{c.efficacy} lm/W</span>
                      <span className="chip-cri">CRI {c.cri}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="configurator-section">
            {/* Color Temperature (CCT) Section */}
            <div className="configurator-section-label">Color Temperature</div>
            <div className="configurator-grid-3">
              {activeFixture.cctOptions.map(c => (
                <button
                  key={c}
                  className={`configurator-btn ${cct === c ? 'active' : ''}`}
                  onClick={() => setCct(c)}
                >
                  {c}K
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview */}
          <div className="configurator-preview">
            <div className="preview-row">
              <span className="preview-label">Configuration:</span>
              <span className="preview-value">
                {power}W · {beamAngle}° {chip && `· ${chip.brand}`} · {cct}K
              </span>
            </div>
            <div className="preview-row preview-lumens">
              <span className="preview-label">Output:</span>
              <span className="preview-value preview-lumens-value">{lumens} lumens</span>
            </div>
          </div>

        </div>

        {/* Actions */}
        <div className="configurator-actions">
          <button className="btn-secondary" onClick={onClose}>CANCEL</button>
          <button className="btn-primary" onClick={handleAddToCanvas}>
            + ADD TO CANVAS
          </button>
        </div>
      </div>
    </div>
  )
}
