const T = {
  panel:   '#1c1c1c',
  panel3:  '#2c2c2c',
  border:  '#333333',
  text:    '#e8e8e8',
  textMid: '#a0a0a0',
  textDim: '#606060',
  accent:  '#d4a843',
  accentBg:'rgba(212,168,67,0.12)',
  blue:    '#4a9eff',
  blueBg:  'rgba(74,158,255,0.10)',
  green:   '#3dba74',
  red:     '#e05555',
  font:    "'Inter', system-ui, sans-serif",
}

const btn = (active, color = T.textMid) => ({
  height: 28,
  padding: '0 10px',
  background: active ? T.accentBg : 'transparent',
  color: active ? T.accent : color,
  border: active ? `1px solid rgba(212,168,67,0.25)` : '1px solid transparent',
  borderRadius: 3,
  fontFamily: T.font,
  fontSize: 12,
  fontWeight: active ? 500 : 400,
  letterSpacing: '0.01em',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  transition: 'background 0.1s, color 0.1s',
})

const sep = (
  <div style={{ width: 1, height: 16, background: T.border, margin: '0 4px', flexShrink: 0 }} />
)

export default function Toolbar({
  onOpenSettings,
  onLoadProject,
  onOpenLibrary,
  placementMode,
  onTogglePlacement,
  activeFixture,
  onClearActiveFixture,
  onAssignDALI,
  fixtureCount,
  selectedCount,
  onDeleteSelected,
  onDeleteAll,
  showBeams,
  onToggleBeams,
  showHeatMap,
  onToggleHeatMap,
  ceilingHeight,
  onChangeCeilingHeight,
}) {
  const handlePlacementBtn = () => {
    if (!activeFixture) {
      onOpenLibrary()
    } else {
      onTogglePlacement()
    }
  }

  const btnLabel = !activeFixture
    ? '+ Fixture'
    : placementMode
      ? '◆ Placing'
      : '◆ Paused'

  const btnActive = !!activeFixture && placementMode

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        padding: '4px 8px',
        background: T.panel,
        border: `1px solid ${T.border}`,
        borderRadius: 6,
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      {/* Settings */}
      <button
        onClick={onOpenSettings}
        title="Settings"
        style={btn(false)}
      >
        ⚙ Settings
      </button>

      {sep}

      {/* Placement */}
      <button
        onClick={handlePlacementBtn}
        style={{
          ...btn(btnActive),
          background: btnActive ? T.accentBg : activeFixture ? 'rgba(61,186,116,0.08)' : 'transparent',
          color: btnActive ? T.accent : activeFixture ? T.green : T.textMid,
          border: `1px solid ${btnActive ? 'rgba(212,168,67,0.3)' : activeFixture ? 'rgba(61,186,116,0.2)' : 'transparent'}`,
        }}
      >
        {btnLabel}
      </button>

      {/* Active fixture indicator + clear */}
      {activeFixture && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '3px 8px',
              background: 'rgba(61,186,116,0.06)',
              border: '1px solid rgba(61,186,116,0.15)',
              borderRadius: 3,
              whiteSpace: 'nowrap',
              maxWidth: 180,
              overflow: 'hidden',
            }}
          >
            <span style={{ fontSize: 13, lineHeight: 1, color: activeFixture.fill ?? T.accent }}>
              {activeFixture.symbol ?? '○'}
            </span>
            <span style={{ fontFamily: T.font, fontSize: 11, color: T.green, fontWeight: 500 }}>
              {activeFixture.watt ?? activeFixture.wattage}W
            </span>
            <span style={{ fontFamily: T.font, fontSize: 11, color: T.textDim }}>
              {activeFixture.label ?? activeFixture.name ?? activeFixture.category}
            </span>
          </div>

          <button
            onClick={onClearActiveFixture}
            title="Clear active fixture"
            style={{
              ...btn(false, T.red),
              padding: '0 8px',
              fontSize: 13,
              fontWeight: 400,
            }}
          >
            ✕
          </button>
        </>
      )}

      {/* Delete selected */}
      {selectedCount > 0 && (
        <>
          {sep}
          <button
            onClick={onDeleteSelected}
            title={`Delete ${selectedCount} selected`}
            style={{
              ...btn(false, T.red),
              background: 'rgba(224,85,85,0.06)',
              border: '1px solid rgba(224,85,85,0.2)',
            }}
          >
            Delete {selectedCount}
          </button>
        </>
      )}

      {/* Delete all */}
      {fixtureCount > 0 && !selectedCount && (
        <>
          {sep}
          <button
            onClick={onDeleteAll}
            title="Delete all fixtures"
            style={btn(false, T.textDim)}
          >
            Clear All
          </button>
        </>
      )}

      {/* DALI */}
      <button
        onClick={onAssignDALI}
        style={btn(false)}
        title="DALI circuit planning"
      >
        ⚡ DALI
      </button>

      {sep}

      {/* Load project */}
      <button onClick={onLoadProject} style={btn(false)} title="Load project">
        📂 Load
      </button>

      <div style={{ flex: 1 }} />

      {/* Beam toggle */}
      <button
        onClick={onToggleBeams}
        title="Toggle beam cones (B)"
        style={btn(showBeams, showBeams ? T.accent : T.textMid)}
      >
        🔆 Beam
      </button>

      {/* Heatmap toggle */}
      <button
        onClick={onToggleHeatMap}
        title="Toggle lux heatmap (H)"
        style={{
          ...btn(showHeatMap, showHeatMap ? '#a78bfa' : T.textMid),
          background: showHeatMap ? 'rgba(167,139,250,0.10)' : 'transparent',
          border: showHeatMap ? '1px solid rgba(167,139,250,0.25)' : '1px solid transparent',
          color: showHeatMap ? '#a78bfa' : T.textMid,
        }}
      >
        🌡 Heat
      </button>

      {/* Ceiling height — only when viz active */}
      {(showBeams || showHeatMap) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
          <span style={{ fontFamily: T.font, fontSize: 11, color: T.textDim }}>H:</span>
          <input
            type="number"
            min={1000}
            max={10000}
            step={100}
            value={ceilingHeight}
            onChange={(e) => onChangeCeilingHeight(parseInt(e.target.value) || 2700)}
            title="Ceiling height (mm)"
            style={{
              fontFamily: T.font,
              width: 52,
              fontSize: 11,
              background: T.panel3,
              color: T.text,
              border: `1px solid ${T.border}`,
              borderRadius: 3,
              padding: '3px 5px',
              textAlign: 'right',
              outline: 'none',
            }}
          />
          <span style={{ fontFamily: T.font, fontSize: 11, color: T.textDim }}>mm</span>
        </div>
      )}

      {sep}

      {/* Fixture count chip */}
      <div
        style={{
          fontFamily: T.font,
          fontSize: 11,
          color: T.textDim,
          padding: '3px 8px',
          background: T.panel3,
          borderRadius: 3,
          border: `1px solid ${T.border}`,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: T.accent, fontWeight: 600 }}>{fixtureCount}</span>
        <span style={{ marginLeft: 4 }}>fixtures</span>
      </div>
    </div>
  )
}
