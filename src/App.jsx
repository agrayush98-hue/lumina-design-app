import { useState, useEffect, useMemo } from 'react'
import { getWattageColor } from './fixtureDatabase'
import { useSettings } from './contexts/SettingsContext'
import { computeRoomGeometry } from './utils/canvasConstants'
import { computeRoomLuxStats } from './utils/luxCalculator'
import SettingsModal from './components/SettingsModal'
import DesignCanvas from './DesignCanvas'
import Toolbar from './components/Toolbar'
import FloorPlanUpload from './components/FloorPlanUpload'
import FixturePanel from './components/FixturePanel'
import ElectricalPanel from './components/ElectricalPanel'
import SettingsPanel from './components/SettingsPanel'
import ReportPanel from './components/ReportPanel'
import LoadProjectModal from './components/LoadProjectModal'
import FixtureLibraryModal from './components/FixtureLibraryModal'
import RoomTabsBar from './components/RoomTabsBar'
import FloorTabsBar from './components/FloorTabsBar'
import AIRecommender from './components/AIRecommender'
import InspectorPanel from './components/InspectorPanel'
import FixtureLibrarySidebar from './components/FixtureLibrarySidebar'

const S = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: '#090c10',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 48,
    minHeight: 48,
    padding: '0 20px',
    background: '#0d1117',
    borderBottom: '1px solid #1a2b3c',
    flexShrink: 0,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 12,
    fontWeight: 500,
    color: '#cdd9e5',
    letterSpacing: '0.08em',
  },
  logoMark: {
    width: 22,
    height: 22,
    background: 'linear-gradient(135deg, #d4a843 0%, #f5e6c8 100%)',
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: '#0f0f0f',
    fontWeight: 600,
  },
  divider: {
    width: 1,
    height: 20,
    background: '#1e2a38',
    margin: '0 4px',
  },
  headerTag: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    color: '#2d4f68',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  headerCenter: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fixturePill: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '4px 14px',
    background: '#0e1d14',
    border: '1px solid #2a5a3a',
    borderRadius: 20,
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 9,
    color: '#3dba74',
    letterSpacing: '0.06em',
    whiteSpace: 'nowrap',
  },
  fixturePillDot: {
    width: 7,
    height: 7,
    borderRadius: '50%',
    background: '#3dba74',
    boxShadow: '0 0 6px #3dba74',
    flexShrink: 0,
  },
  headerBtn: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 9,
    letterSpacing: '0.08em',
    padding: '4px 10px',
    background: 'transparent',
    borderRadius: 3,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  statsBar: {
    height: 30,
    minHeight: 30,
    display: 'flex',
    alignItems: 'center',
    padding: 0,
    background: '#060a0e',
    borderBottom: '1px solid #131d28',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 9,
    color: '#2d4f68',
    letterSpacing: '0.1em',
    flexShrink: 0,
  },
  statItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '0 18px',
    borderRight: '1px solid #131d28',
    height: '100%',
  },
  statVal: {
    color: '#4a7a96',
    fontWeight: 600,
  },
  luxHero: {
    padding: '14px 12px 10px',
    borderBottom: '1px solid #131d28',
    flexShrink: 0,
    background: '#080c11',
  },
  luxHeroValue: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 34,
    fontWeight: 700,
    color: '#d4a843',
    letterSpacing: '-0.02em',
    lineHeight: 1,
  },
  luxHeroSub: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 8,
    color: '#2d4f68',
    marginTop: 5,
    letterSpacing: '0.08em',
  },
  luxHeroRow: {
    display: 'flex',
    gap: 14,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  luxHeroStat: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 9,
    color: '#4a7a96',
  },
  luxHeroStatVal: {
    color: '#6ae5ff',
    fontWeight: 600,
  },
  statusPill: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '3px 10px',
    background: '#0e1d14',
    border: '1px solid #1a3828',
    borderRadius: 20,
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    color: '#3dba74',
    letterSpacing: '0.06em',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#3dba74',
    boxShadow: '0 0 6px #3dba74',
  },
  unitTag: {
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    color: '#2d4f68',
    padding: '3px 8px',
    border: '1px solid #1a2b3c',
    borderRadius: 3,
    letterSpacing: '0.08em',
  },
  mainWrapper: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },
  sidebar: {
    width: 320,
    background: '#0d1117',
    borderRight: '1px solid #1a2b3c',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  sidebarTabs: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid #1a2b3c',
    background: '#0a0f14',
    flexShrink: 0,
  },
  sidebarTab: {
    flex: 1,
    padding: '10px 12px',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    textAlign: 'center',
    cursor: 'pointer',
    borderBottom: '2px solid #2d4f68',
    color: '#2d4f68',
    transition: 'all 0.2s',
    userSelect: 'none',
  },
  sidebarTabActive: {
    color: '#d4a843',
    borderBottom: '2px solid #d4a843',
  },
  sidebarContent: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
  },
  canvasArea: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  canvasToolbar: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '8px 12px',
    background: '#0a0f14',
    borderBottom: '1px solid #1a2b3c',
    flexShrink: 0,
  },
  canvasMain: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  canvasWrap: {
    position: 'relative',
  },
  rightSidebar: {
    width: 280,
    background: '#0d1117',
    borderLeft: '1px solid #1a2b3c',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  rightTabs: {
    display: 'flex',
    gap: 0,
    borderBottom: '1px solid #1a2b3c',
    background: '#0a0f14',
    flexShrink: 0,
  },
  rightTab: {
    flex: 1,
    padding: '10px 12px',
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    textAlign: 'center',
    cursor: 'pointer',
    borderBottom: '2px solid #2d4f68',
    color: '#2d4f68',
    transition: 'all 0.2s',
    userSelect: 'none',
  },
  rightTabActive: {
    color: '#d4a843',
    borderBottom: '2px solid #d4a843',
  },
  rightContent: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
  },
  statusBar: {
    height: 28,
    minHeight: 28,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 20px',
    background: '#0a0f14',
    borderTop: '1px solid #131d28',
    flexShrink: 0,
  },
  statusLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 20,
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    color: '#2d4f68',
  },
  statusItem: {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
  },
  statusVal: {
    color: '#4a7a96',
  },
}

export default function App() {
  const { settings, updateSetting } = useSettings()
  const ceilingHeight = settings.calculations.ceilingHeight

  const roomGeom = useMemo(
    () => computeRoomGeometry(settings.room.width, settings.room.length),
    [settings.room.width, settings.room.length]
  )
  const reflectances = settings.materials
  const targetLux   = settings.calculations.targetLux
  const gridSize    = settings.display.gridSize
  const cellSize    = settings.performance.heatMapCellSize

  const [leftTab, setLeftTab] = useState('library')
  const [rightTab, setRightTab] = useState('electrical')
  const [showSettings, setShowSettings] = useState(false)
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showLibraryModal, setShowLibraryModal] = useState(false)
  const [fixtures, setFixtures] = useState(() => {
    const saved = localStorage.getItem('lumina_fixtures')
    return saved ? JSON.parse(saved) : []
  })
  const [placementMode, setPlacementMode] = useState(false)
  const [nextFixtureId, setNextFixtureId] = useState(() => {
    // Start above the highest existing fixture ID so we never generate a duplicate
    const saved = localStorage.getItem('lumina_fixtures')
    if (!saved) return 1
    const parsed = JSON.parse(saved)
    if (!parsed.length) return 1
    const max = Math.max(...parsed.map((f) => {
      const n = parseInt(String(f.id).replace('fixture-', ''), 10)
      return isNaN(n) ? 0 : n
    }))
    return max + 1
  })
  const [selectedFixtureId, setSelectedFixtureId] = useState(null)
  const [activeFixture, setActiveFixture] = useState(null)
  const [selectedFixtures, setSelectedFixtures] = useState([]) // multi-select IDs
  const [showBeams,   setShowBeams]   = useState(false)
  const [showHeatMap, setShowHeatMap] = useState(false)

  // ── Derived stats (for header stats bar + right panel hero) ────────────────
  const luxStats = useMemo(
    () => fixtures.length > 0
      ? computeRoomLuxStats(fixtures, ceilingHeight, { reflectances, roomGeom })
      : null,
    [fixtures, ceilingHeight, reflectances, roomGeom]
  )
  const totalLoad = fixtures.reduce((s, f) => s + (f.wattage || f.power || 0), 0)

  const handleClearActiveFixture = () => {
    setActiveFixture(null)
    setPlacementMode(false)
  }

  // ── Multi-select delete functions ──────────────────────────
  const handleDeleteSelected = () => {
    if (selectedFixtures.length === 0) return
    const updated = fixtures.filter((f) => !selectedFixtures.includes(f.id))
    setFixtures(updated)
    localStorage.setItem('lumina_fixtures', JSON.stringify(updated))
    setSelectedFixtures([])
    setSelectedFixtureId(null)
  }

  const handleDeleteAll = () => {
    if (fixtures.length === 0) return
    if (!window.confirm(`Delete all ${fixtures.length} fixture${fixtures.length !== 1 ? 's' : ''}?`)) return
    setFixtures([])
    localStorage.setItem('lumina_fixtures', JSON.stringify([]))
    setSelectedFixtures([])
    setSelectedFixtureId(null)
  }

  // ── Keyboard shortcuts ─────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e) => {
      // Ignore when typing in an input/textarea/select
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return

      // Delete / Backspace → delete selected fixtures
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedFixtures.length > 0) {
        const updated = fixtures.filter((f) => !selectedFixtures.includes(f.id))
        setFixtures(updated)
        localStorage.setItem('lumina_fixtures', JSON.stringify(updated))
        setSelectedFixtures([])
        setSelectedFixtureId(null)
      }

      // Ctrl+A → select all
      if (e.key === 'a' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        setSelectedFixtures(fixtures.map((f) => f.id))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selectedFixtures, fixtures])

  const handleCanvasClick = (x, y, clickedFixtureId, ctrlKey) => {
    if (clickedFixtureId) {
      if (ctrlKey) {
        // Toggle this fixture in the multi-select set
        setSelectedFixtures((prev) =>
          prev.includes(clickedFixtureId)
            ? prev.filter((id) => id !== clickedFixtureId)
            : [...prev, clickedFixtureId]
        )
      } else {
        setSelectedFixtureId(clickedFixtureId)
        setSelectedFixtures([clickedFixtureId])
        setRightTab('electrical')
      }
      return
    }

    // Clicked empty canvas — clear both selection states
    setSelectedFixtureId(null)
    setSelectedFixtures([])

    if (!placementMode || !activeFixture) return

    // Place a copy of the active fixture template at the clicked position
    const wattColor = activeFixture.wattageColor || getWattageColor(activeFixture.wattage || 0)
    const newFixture = {
      id: `fixture-${nextFixtureId}`,
      name: activeFixture.name,
      type: activeFixture.fixtureId || 'unknown',
      shape: activeFixture.shape,
      shapeSymbol: activeFixture.symbol,
      category: activeFixture.category,
      position: { x, y },
      daliAddress: null,
      wattage: activeFixture.wattage,
      wattageColor: wattColor,
      power: activeFixture.wattage,
      beamAngle: activeFixture.beamAngle,
      protocol: activeFixture.protocol,
      supportedProtocols: activeFixture.supportedProtocols,
      lightType: 'LED',
      lumens: (activeFixture.wattage || 0) * (activeFixture.lumensPerWatt || 100),
      cct: activeFixture.cct,
    }

    const updatedFixtures = [...fixtures, newFixture]
    setFixtures(updatedFixtures)
    setNextFixtureId(nextFixtureId + 1)
    localStorage.setItem('lumina_fixtures', JSON.stringify(updatedFixtures))
    // Stay in placement mode — sticky until cleared
  }

  const handleAssignDALI = () => {
    let daliCounter = 1
    const updatedFixtures = fixtures.map((fixture) => {
      const usesDali = !fixture.protocol || fixture.protocol.startsWith('DALI')
      if (!usesDali) return fixture
      if (fixture.daliAddress) { daliCounter++; return fixture }
      return { ...fixture, daliAddress: `D:${daliCounter++}` }
    })
    setFixtures(updatedFixtures)
    localStorage.setItem('lumina_fixtures', JSON.stringify(updatedFixtures))
  }

  const handleUpdateFixture = (fixtureId, updates) => {
    const updatedFixtures = fixtures.map((f) =>
      f.id === fixtureId ? { ...f, ...updates } : f
    )
    setFixtures(updatedFixtures)
    localStorage.setItem('lumina_fixtures', JSON.stringify(updatedFixtures))
  }

  const handleDeleteFixture = (fixtureId) => {
    const updatedFixtures = fixtures.filter((f) => f.id !== fixtureId)
    setFixtures(updatedFixtures)
    localStorage.setItem('lumina_fixtures', JSON.stringify(updatedFixtures))
    setSelectedFixtureId(null)
    setSelectedFixtures((prev) => prev.filter((id) => id !== fixtureId))
  }

  const handleFixtureDrag = (fixtureId, newPosition) => {
    const updated = fixtures.map((f) =>
      f.id === fixtureId ? { ...f, position: newPosition } : f
    )
    setFixtures(updated)
    localStorage.setItem('lumina_fixtures', JSON.stringify(updated))
  }

  const handleAddFixtureFromLibrary = (templateData) => {
    // Store as active fixture — placement happens on canvas clicks
    setActiveFixture(templateData)
    setPlacementMode(true)
    setShowLibraryModal(false)
  }

  const selectedFixture = fixtures.find((f) => f.id === selectedFixtureId)

  return (
    <div style={S.root}>
      <header style={S.header}>
        {/* Left — logo */}
        <div style={S.headerLeft}>
          <div style={S.logo}>
            <div style={S.logoMark}>L</div>
            LUMINA DESIGN
          </div>
        </div>

        {/* Center — active fixture pill */}
        <div style={S.headerCenter}>
          {activeFixture ? (
            <div style={S.fixturePill}>
              <div style={S.fixturePillDot} />
              {activeFixture.wattage}W {activeFixture.name}
              {activeFixture.lumens ? ` · ${activeFixture.lumens} lm` : ''}
              {activeFixture.beamAngle != null ? ` · ${activeFixture.beamAngle}°` : ''}
            </div>
          ) : (
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#2d4f68', letterSpacing: '0.1em' }}>
              NO FIXTURE SELECTED
            </span>
          )}
        </div>

        {/* Right — action buttons */}
        <div style={S.headerRight}>
          <button
            style={{ ...S.headerBtn, color: '#4a7a96', border: '1px solid #1a2b3c' }}
            onClick={() => localStorage.setItem('lumina_fixtures', JSON.stringify(fixtures))}
          >
            💾 SAVE
          </button>
          <button
            style={{ ...S.headerBtn, color: '#4a7a96', border: '1px solid #1a2b3c' }}
            onClick={() => setShowLoadModal(true)}
          >
            📂 LOAD
          </button>
          <button style={{ ...S.headerBtn, color: '#6ae5ff', border: '1px solid #1a3a4a' }}>
            🔗 SHARE
          </button>
          <button
            style={{ ...S.headerBtn, color: '#d4a843', border: '1px solid #3a2a14' }}
            onClick={() => setRightTab('report')}
          >
            📄 REPORT
          </button>
        </div>
      </header>

      {/* ── Stats Bar ───────────────────────────────────────── */}
      <div style={S.statsBar}>
        <div style={S.statItem}>FLOORS <span style={S.statVal}>1</span></div>
        <div style={S.statItem}>ROOMS <span style={S.statVal}>1</span></div>
        <div style={S.statItem}>TOTAL FIXTURES <span style={S.statVal}>{fixtures.length}</span></div>
        <div style={S.statItem}>TOTAL LOAD <span style={S.statVal}>{totalLoad}W</span></div>
        <div style={S.statItem}>AVERAGE LUX <span style={S.statVal}>{luxStats ? `${luxStats.avg} lx` : '—'}</span></div>
      </div>

      <div style={S.mainWrapper}>
        <div style={S.sidebar}>
          {/* Secondary tab strip — Settings / Floor access */}
          <div style={S.sidebarTabs}>
            <div
              style={{ ...S.sidebarTab, ...(leftTab === 'library' ? S.sidebarTabActive : {}) }}
              onClick={() => setLeftTab('library')}
            >
              LIBRARY
            </div>
            <div
              style={{ ...S.sidebarTab, ...(leftTab === 'settings' ? S.sidebarTabActive : {}) }}
              onClick={() => setLeftTab('settings')}
            >
              SETTINGS
            </div>
            <div
              style={{ ...S.sidebarTab, ...(leftTab === 'floor' ? S.sidebarTabActive : {}) }}
              onClick={() => setLeftTab('floor')}
            >
              FLOORS
            </div>
          </div>

          {/* Primary content */}
          <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {leftTab === 'library' && (
              <FixtureLibrarySidebar
                activeFixture={activeFixture}
                onSelectFixture={(templateData) => {
                  setActiveFixture(templateData)
                  setPlacementMode(true)
                }}
                onOpenFullLibrary={() => setShowLibraryModal(true)}
              />
            )}
            {leftTab === 'settings' && (
              <div style={S.sidebarContent}><SettingsPanel /></div>
            )}
            {leftTab === 'floor' && (
              <div style={S.sidebarContent}><FloorPlanUpload /></div>
            )}
          </div>
        </div>

        <div style={S.canvasArea}>
          <div style={S.canvasToolbar}>
            <Toolbar
              onLoadProject={() => setShowLoadModal(true)}
              onOpenLibrary={() => setShowLibraryModal(true)}
              placementMode={placementMode}
              onTogglePlacement={() => setPlacementMode(!placementMode)}
              activeFixture={activeFixture}
              onClearActiveFixture={handleClearActiveFixture}
              onAssignDALI={handleAssignDALI}
              fixtureCount={fixtures.length}
              selectedCount={selectedFixtures.length}
              onDeleteSelected={handleDeleteSelected}
              onDeleteAll={handleDeleteAll}
              showBeams={showBeams}
              onToggleBeams={() => setShowBeams((v) => !v)}
              showHeatMap={showHeatMap}
              onToggleHeatMap={() => setShowHeatMap((v) => !v)}
              ceilingHeight={ceilingHeight}
              onChangeCeilingHeight={(v) => updateSetting('calculations', 'ceilingHeight', v)}
              onOpenSettings={() => setShowSettings(true)}
            />
          </div>
          <FloorTabsBar />
          <RoomTabsBar />
          <div style={S.canvasMain}>
            <div style={S.canvasWrap}>
              <DesignCanvas
                onCanvasClick={handleCanvasClick}
                onFixtureDrag={handleFixtureDrag}
                placementMode={placementMode}
                fixtures={fixtures}
                selectedFixtureId={selectedFixtureId}
                multiSelectedIds={selectedFixtures}
                showBeams={showBeams}
                showHeatMap={showHeatMap}
                ceilingHeight={ceilingHeight}
                roomWidth={settings.room.width}
                roomLength={settings.room.length}
                gridSize={gridSize}
                cellSize={cellSize}
              />
            </div>
          </div>
        </div>

        <div style={S.rightSidebar}>
          {/* ── Lux Hero ── */}
          {(() => {
            const roomW_m = settings.room.width  / 1000
            const roomL_m = settings.room.length / 1000
            const ceil_m  = ceilingHeight / 1000
            const rcr = roomW_m > 0 && roomL_m > 0
              ? ((5 * ceil_m * (roomW_m + roomL_m)) / (roomW_m * roomL_m)).toFixed(2)
              : '—'
            const ri  = roomW_m > 0 && roomL_m > 0
              ? (roomW_m * roomL_m) / (ceil_m * (roomW_m + roomL_m))
              : 0
            const uf  = Math.min(0.8, Math.max(0.2, 0.3 + 0.12 * ri)).toFixed(2)
            const avg = luxStats?.avg ?? 0
            const compliance = !luxStats ? null
              : avg >= targetLux * 1.1 ? { label: 'OVERLIT', color: '#f44336' }
              : avg >= targetLux       ? { label: 'GOOD',    color: '#3dba74' }
              :                          { label: 'BELOW TARGET', color: '#e8a245' }
            return (
              <div style={S.luxHero}>
                <div style={S.luxHeroValue}>
                  {luxStats ? `${avg}` : '—'}
                  <span style={{ fontSize: 14, color: '#b88a2e', fontWeight: 400, marginLeft: 4 }}>lx</span>
                </div>
                <div style={S.luxHeroSub}>
                  {fixtures.length} fixture{fixtures.length !== 1 ? 's' : ''} · snap on
                </div>
                <div style={S.luxHeroRow}>
                  <span style={S.luxHeroStat}>
                    RCR <span style={S.luxHeroStatVal}>{rcr}</span>
                  </span>
                  <span style={S.luxHeroStat}>
                    UF <span style={S.luxHeroStatVal}>{uf}</span>
                  </span>
                  {luxStats && (
                    <span style={S.luxHeroStat}>
                      U₀ <span style={S.luxHeroStatVal}>{luxStats.uniformity}</span>
                    </span>
                  )}
                </div>
                {compliance && (
                  <div style={{
                    marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '3px 10px',
                    background: `${compliance.color}18`,
                    border: `1px solid ${compliance.color}55`,
                    borderRadius: 12,
                    fontFamily: 'IBM Plex Mono, monospace',
                    fontSize: 9, fontWeight: 700, color: compliance.color,
                    letterSpacing: '0.1em',
                  }}>
                    {compliance.label === 'GOOD' ? '✓' : compliance.label === 'OVERLIT' ? '⚠' : '✗'}
                    {' '}{compliance.label}
                  </div>
                )}
              </div>
            )
          })()}

          <div style={S.rightTabs}>
            <div
              style={{
                ...S.rightTab,
                ...(rightTab === 'electrical' ? S.rightTabActive : {}),
              }}
              onClick={() => setRightTab('electrical')}
            >
              ELECTRICAL
            </div>
            <div
              style={{
                ...S.rightTab,
                ...(rightTab === 'report' ? S.rightTabActive : {}),
              }}
              onClick={() => setRightTab('report')}
            >
              REPORT
            </div>
            <div
              style={{
                ...S.rightTab,
                ...(rightTab === 'ai' ? S.rightTabActive : {}),
              }}
              onClick={() => setRightTab('ai')}
            >
              AI
            </div>
          </div>
          <div style={S.rightContent}>
            {selectedFixture && rightTab === 'electrical' ? (
              <InspectorPanel
                fixture={selectedFixture}
                onUpdate={handleUpdateFixture}
                onDelete={handleDeleteFixture}
                selectedCount={selectedFixtures.length}
                onDeleteSelected={handleDeleteSelected}
                allFixtures={fixtures}
                ceilingHeight={ceilingHeight}
              />
            ) : (
              <>
                {rightTab === 'electrical' && <ElectricalPanel fixtures={fixtures} ceilingHeight={ceilingHeight} targetLux={targetLux} reflectances={reflectances} roomGeom={roomGeom} />}
                {rightTab === 'report' && <ReportPanel fixtures={fixtures} />}
                {rightTab === 'ai' && <AIRecommender />}
              </>
            )}
          </div>
        </div>
      </div>

      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />
      {showLoadModal && <LoadProjectModal onClose={() => setShowLoadModal(false)} />}
      {showLibraryModal && (
        <FixtureLibraryModal
          onClose={() => setShowLibraryModal(false)}
          onAddFixture={handleAddFixtureFromLibrary}
        />
      )}

      <footer style={S.statusBar}>
        <div style={S.statusLeft}>
          <div style={S.statusItem}>
            CANVAS <span style={S.statusVal}>1000 × 700</span>
          </div>
          <div style={S.statusItem}>
            SCALE <span style={S.statusVal}>1:20</span>
          </div>
          <div style={S.statusItem}>
            ROOM <span style={S.statusVal}>{(settings.room.width/1000).toFixed(1)} × {(settings.room.length/1000).toFixed(1)} m</span>
          </div>
          <div style={S.statusItem}>
            AREA <span style={S.statusVal}>{((settings.room.width/1000)*(settings.room.length/1000)).toFixed(2)} m²</span>
          </div>
          <div style={S.statusItem}>
            FIXTURES <span style={S.statusVal}>{fixtures.length}</span>
          </div>
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#1e3448' }}>
          REACT · KONVA · VITE · FIREBASE
        </div>
      </footer>
    </div>
  )
}
