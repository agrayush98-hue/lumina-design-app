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
  const mono = { fontFamily: 'IBM Plex Mono, monospace' }

  // Placement button behaviour:
  //   no activeFixture → "+ SELECT FIXTURE" → opens library
  //   activeFixture + placing → "◆ PLACING" → toggle off
  //   activeFixture + paused → "◆ PAUSED" → toggle on
  const handlePlacementBtn = () => {
    if (!activeFixture) {
      onOpenLibrary()
    } else {
      onTogglePlacement()
    }
  }

  const btnLabel = !activeFixture
    ? '+ SELECT FIXTURE'
    : placementMode
      ? '◆ PLACING'
      : '◆ PAUSED'

  const btnActive = !!activeFixture && placementMode

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        background: '#0a0f14',
        borderRadius: 4,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Settings */}
      <button
        onClick={onOpenSettings}
        title="Open settings"
        style={{
          ...mono,
          padding: '6px 12px',
          background: '#1a2a3a',
          color: '#cdd9e5',
          border: '1px solid #2a3a4a',
          borderRadius: 3,
          cursor: 'pointer',
          fontSize: 10,
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}
      >
        ⚙ SETTINGS
      </button>

      <div style={{ width: 1, height: 20, background: '#1a2b3c', margin: '0 2px' }} />

      {/* Placement / Select fixture button */}
      <button
        onClick={handlePlacementBtn}
        style={{
          ...mono,
          padding: '6px 12px',
          background: btnActive ? '#d4a843' : activeFixture ? '#1a3a2a' : '#1a2a3a',
          color: btnActive ? '#0f0f0f' : activeFixture ? '#3dba74' : '#cdd9e5',
          border: `1px solid ${btnActive ? '#d4a843' : activeFixture ? '#2a5a3a' : '#2a3a4a'}`,
          borderRadius: 3,
          cursor: 'pointer',
          fontSize: 10,
          fontWeight: btnActive ? 600 : 400,
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}
      >
        {btnLabel}
      </button>

      {/* Active fixture indicator + CLEAR button */}
      {activeFixture && (
        <>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '5px 10px',
              background: '#0e1d14',
              border: `1px solid ${placementMode ? '#2a5a3a' : '#1a3828'}`,
              borderRadius: 3,
              whiteSpace: 'nowrap',
            }}
          >
            <span
              style={{
                fontSize: 13,
                lineHeight: 1,
                color: activeFixture.wattageColor?.hex || '#e8a245',
              }}
            >
              {activeFixture.symbol}
            </span>
            <span
              style={{
                ...mono,
                fontSize: 9,
                color: '#3dba74',
                letterSpacing: '0.06em',
              }}
            >
              ACTIVE: {activeFixture.wattage}W {activeFixture.category}
            </span>
            {activeFixture.beamAngle != null && (
              <span style={{ ...mono, fontSize: 8, color: '#2d4f68' }}>
                · {activeFixture.beamAngle}° · {activeFixture.protocol}
              </span>
            )}
          </div>

          {/* CLEAR button */}
          <button
            onClick={onClearActiveFixture}
            title="Clear active fixture"
            style={{
              ...mono,
              padding: '5px 8px',
              background: '#2a1010',
              color: '#ff6b6b',
              border: '1px solid #4a2020',
              borderRadius: 3,
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 600,
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </>
      )}

      {/* Delete selected — visible only when ≥1 fixture is multi-selected */}
      {selectedCount > 0 && (
        <button
          onClick={onDeleteSelected}
          title={`Delete ${selectedCount} selected fixture${selectedCount !== 1 ? 's' : ''} (Delete key)`}
          style={{
            ...mono,
            padding: '6px 12px',
            background: '#2a1010',
            color: '#ff6b6b',
            border: '1px solid #4a2020',
            borderRadius: 3,
            cursor: 'pointer',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
          }}
        >
          🗑 DEL {selectedCount}
        </button>
      )}

      {/* Delete all */}
      {fixtureCount > 0 && (
        <button
          onClick={onDeleteAll}
          title="Delete all fixtures"
          style={{
            ...mono,
            padding: '6px 12px',
            background: '#1a0a0a',
            color: '#8b3a3a',
            border: '1px solid #3a1a1a',
            borderRadius: 3,
            cursor: 'pointer',
            fontSize: 10,
            letterSpacing: '0.06em',
            whiteSpace: 'nowrap',
          }}
        >
          🗑 ALL
        </button>
      )}

      {/* DALI assign */}
      <button
        onClick={onAssignDALI}
        style={{
          ...mono,
          padding: '6px 12px',
          background: '#1a2a3a',
          color: '#cdd9e5',
          border: '1px solid #2a3a4a',
          borderRadius: 3,
          cursor: 'pointer',
          fontSize: 10,
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}
      >
        ⚡ DALI
      </button>

      <div style={{ width: 1, height: 20, background: '#1a2b3c', margin: '0 2px' }} />

      {/* Load project */}
      <button
        onClick={onLoadProject}
        style={{
          ...mono,
          padding: '6px 12px',
          background: '#1a2a3a',
          color: '#cdd9e5',
          border: '1px solid #2a3a4a',
          borderRadius: 3,
          cursor: 'pointer',
          fontSize: 10,
          letterSpacing: '0.06em',
          whiteSpace: 'nowrap',
        }}
      >
        📂 LOAD
      </button>

      <div style={{ marginLeft: 'auto' }} />

      {/* ── Visualisation toggles ── */}
      <button
        onClick={onToggleBeams}
        title="Toggle beam cone footprints"
        style={{
          ...mono,
          padding: '5px 10px',
          background: showBeams ? '#0e1d2a' : '#0a0f14',
          color: showBeams ? '#d4a843' : '#2d4f68',
          border: `1px solid ${showBeams ? '#d4a843' : '#1a2b3c'}`,
          borderRadius: 3,
          cursor: 'pointer',
          fontSize: 10,
          whiteSpace: 'nowrap',
        }}
      >
        🔆 BEAM
      </button>

      <button
        onClick={onToggleHeatMap}
        title="Toggle lux heat map"
        style={{
          ...mono,
          padding: '5px 10px',
          background: showHeatMap ? '#1a0e2a' : '#0a0f14',
          color: showHeatMap ? '#a78bfa' : '#2d4f68',
          border: `1px solid ${showHeatMap ? '#a78bfa' : '#1a2b3c'}`,
          borderRadius: 3,
          cursor: 'pointer',
          fontSize: 10,
          whiteSpace: 'nowrap',
        }}
      >
        🌡 HEAT
      </button>

      {/* Ceiling height input — shown when either visualisation is active */}
      {(showBeams || showHeatMap) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ ...mono, fontSize: 8, color: '#2d4f68', whiteSpace: 'nowrap' }}>H:</span>
          <input
            type="number"
            min={1000}
            max={10000}
            step={100}
            value={ceilingHeight}
            onChange={(e) => onChangeCeilingHeight(parseInt(e.target.value) || 2700)}
            title="Ceiling / mounting height (mm)"
            style={{
              ...mono,
              width: 56,
              fontSize: 9,
              background: '#0a0f14',
              color: '#cdd9e5',
              border: '1px solid #1a2b3c',
              borderRadius: 3,
              padding: '4px 5px',
              textAlign: 'right',
            }}
          />
          <span style={{ ...mono, fontSize: 8, color: '#2d4f68' }}>mm</span>
        </div>
      )}

      {/* Fixture count */}
      <div
        style={{
          ...mono,
          fontSize: 10,
          color: '#4a7a96',
          padding: '4px 8px',
          background: '#0d1117',
          borderRadius: 3,
          border: '1px solid #1a2b3c',
          whiteSpace: 'nowrap',
        }}
      >
        FIXTURES: <span style={{ color: '#d4a843', fontWeight: 600 }}>{fixtureCount}</span>
      </div>
    </div>
  )
}
