import { useState } from 'react'
import { fixtureDatabase, getWattageColor } from '../fixtureDatabase'

const mono = { fontFamily: 'IBM Plex Mono, monospace' }

// Group fixtures by category
const grouped = fixtureDatabase.reduce((acc, fix) => {
  const cat = fix.category || 'Other'
  if (!acc[cat]) acc[cat] = []
  acc[cat].push(fix)
  return acc
}, {})
const categories = Object.entries(grouped)

export default function FixtureLibrarySidebar({ activeFixture, onSelectFixture, onOpenFullLibrary }) {
  const [openCats, setOpenCats] = useState(() => {
    // Default: open first category
    const first = categories[0]?.[0]
    return first ? { [first]: true } : {}
  })
  const [hoveredId, setHoveredId] = useState(null)
  const [hoveredBeam, setHoveredBeam] = useState(null)
  const [selectedWatts, setSelectedWatts] = useState({}) // { [fixId]: watt }

  const toggleCat = (cat) =>
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }))

  const buildFixtureTemplate = (fix, watt, beamAngle) => {
    const wc = getWattageColor(watt)
    return {
      fixtureId:          fix.id,
      name:               fix.name,
      category:           fix.category,
      shape:              fix.shape,
      symbol:             fix.symbol,
      wattage:            watt,
      wattageColor:       wc,
      beamAngle,
      protocol:           fix.defaultProtocol,
      supportedProtocols: fix.supportedProtocols,
      lumensPerWatt:      fix.lumensPerWatt,
      cct:                fix.cct,
      lumens:             watt * (fix.lumensPerWatt || 100),
    }
  }

  const handleSelectWatt = (fix, watt) => {
    setSelectedWatts((prev) => ({ ...prev, [fix.id]: watt }))
    const defaultBeam = fix.beamAngles?.[1] ?? fix.beamAngles?.[0] ?? 36
    onSelectFixture(buildFixtureTemplate(fix, watt, defaultBeam))
  }

  const handleSelectBeam = (fix, deg) => {
    const watt = selectedWatts[fix.id] ?? activeFixture?.wattage ?? fix.wattages?.[0] ?? 0
    onSelectFixture(buildFixtureTemplate(fix, watt, deg))
  }

  const isActiveWatt = (fix, watt) =>
    activeFixture?.fixtureId === fix.id && activeFixture?.wattage === watt

  const isActiveBeam = (fix, deg) =>
    activeFixture?.fixtureId === fix.id && activeFixture?.beamAngle === deg

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Header */}
      <div style={{
        ...mono, fontSize: 8, color: '#2d4f68', letterSpacing: '0.14em',
        padding: '8px 12px 6px', borderBottom: '1px solid #131d28',
        flexShrink: 0, textTransform: 'uppercase',
      }}>
        FIXTURE LIBRARY
      </div>

      {/* Accordion list */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {categories.map(([cat, fixtures]) => (
          <div key={cat}>
            {/* Category header */}
            <button
              onClick={() => toggleCat(cat)}
              style={{
                ...mono, width: '100%', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', padding: '7px 12px',
                background: openCats[cat] ? '#0e1820' : '#090c10',
                border: 'none', borderBottom: '1px solid #131d28',
                cursor: 'pointer', fontSize: 9, color: openCats[cat] ? '#6ae5ff' : '#4a7a96',
                letterSpacing: '0.1em', textTransform: 'uppercase',
              }}
            >
              <span>{cat}</span>
              <span style={{ fontSize: 8, color: '#2d4f68' }}>
                {fixtures.length} · {openCats[cat] ? '▲' : '▼'}
              </span>
            </button>

            {/* Variants */}
            {openCats[cat] && fixtures.map((fix) => (
              <div key={fix.id} style={{ background: '#080c11', borderBottom: '1px solid #0e1520' }}>
                {/* Fixture name row */}
                <div style={{
                  ...mono, fontSize: 8, color: '#3a5a6a', padding: '5px 12px 3px',
                  letterSpacing: '0.08em', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                  <span style={{ fontSize: 10 }}>{fix.symbol}</span>
                  {fix.name}
                </div>

                {/* Wattage badges */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, padding: '2px 12px 4px' }}>
                  {(fix.wattages || fix.wattagePerMeter || []).map((w) => { 
                    const wc = getWattageColor(w)
                    const active = isActiveWatt(fix, w)
                    const hovered = hoveredId === `${fix.id}-${w}`
                    return (
                      <button
                        key={w}
                        onMouseEnter={() => setHoveredId(`${fix.id}-${w}`)}
                        onMouseLeave={() => setHoveredId(null)}
                        onClick={() => handleSelectWatt(fix, w)}
                        style={{
                          ...mono, fontSize: 8, padding: '2px 7px',
                          background: active ? wc.hex : hovered ? '#1a2b3c' : '#0d1117',
                          color: active ? '#0d0d0d' : wc.hex,
                          border: `1px solid ${active || hovered ? wc.hex : '#1a2b3c'}`,
                          borderRadius: 10, cursor: 'pointer',
                          fontWeight: active ? 700 : 400,
                          transition: 'all 0.12s',
                        }}
                      >
                        {w}W
                      </button>
                    )
                  })}
                </div>

                {/* Beam angle badges */}
                {fix.beamAngles && fix.beamAngles.length > 0 &&
                  (activeFixture?.fixtureId === fix.id || selectedWatts[fix.id] != null) && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, padding: '0 12px 7px' }}>
                    <span style={{ ...mono, fontSize: 7, color: '#2d4f68', letterSpacing: '0.1em', marginRight: 2 }}>BEAM</span>
                    {fix.beamAngles.map((deg) => {
                      const active = isActiveBeam(fix, deg)
                      const hovered = hoveredBeam === `${fix.id}-${deg}`
                      return (
                        <button
                          key={deg}
                          onMouseEnter={() => setHoveredBeam(`${fix.id}-${deg}`)}
                          onMouseLeave={() => setHoveredBeam(null)}
                          onClick={() => handleSelectBeam(fix, deg)}
                          style={{
                            ...mono, fontSize: 8, padding: '2px 7px',
                            background: active ? '#00b8d4' : hovered ? '#0e2030' : '#0d1117',
                            color: active ? '#0d0d0d' : hovered ? '#6ae5ff' : '#4a9fbf',
                            border: `1px solid ${active ? '#00b8d4' : hovered ? '#6ae5ff' : '#1a3040'}`,
                            borderRadius: 10, cursor: 'pointer',
                            fontWeight: active ? 700 : 400,
                            transition: 'all 0.12s',
                          }}
                        >
                          {deg}°
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Selected fixture footer */}
      <div style={{ flexShrink: 0, borderTop: '1px solid #131d28' }}>
        <div style={{
          ...mono, fontSize: 8, color: '#2d4f68', letterSpacing: '0.12em',
          padding: '6px 12px 4px', textTransform: 'uppercase',
        }}>
          SELECTED
        </div>
        {activeFixture ? (
          <div style={{ padding: '0 12px 8px' }}>
            <div style={{ ...mono, fontSize: 10, color: activeFixture.wattageColor?.hex || '#d4a843', fontWeight: 600 }}>
              {activeFixture.symbol} {activeFixture.wattage}W {activeFixture.name}
            </div>
            <div style={{ ...mono, fontSize: 8, color: '#4a7a96', marginTop: 3, lineHeight: 1.7 }}>
              {activeFixture.lumens ? `${activeFixture.lumens} lm` : ''}
              {activeFixture.beamAngle != null ? ` · ${activeFixture.beamAngle}°` : ''}
              {activeFixture.cct ? ` · ${activeFixture.cct}` : ''}
            </div>
          </div>
        ) : (
          <div style={{ ...mono, fontSize: 8, color: '#2d4f68', padding: '0 12px 8px' }}>
            Click a wattage to select
          </div>
        )}

        {/* Full library button */}
        <button
          onClick={onOpenFullLibrary}
          style={{
            ...mono, width: '100%', padding: '8px 12px',
            background: '#0d1117', color: '#4a7a96',
            border: 'none', borderTop: '1px solid #131d28',
            cursor: 'pointer', fontSize: 9, letterSpacing: '0.08em',
            textAlign: 'left',
          }}
        >
          MORE → FULL LIBRARY
        </button>
      </div>
    </div>
  )
}
