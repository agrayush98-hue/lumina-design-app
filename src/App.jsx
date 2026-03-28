import { useState } from 'react'
import DesignCanvas from './DesignCanvas'

// ── Import UI Components ─────────────────────────────────────
import Toolbar from './components/Toolbar'
import FloorPlanUpload from './components/FloorPlanUpload'
import FixturePanel from './components/FixturePanel'
import ElectricalPanel from './components/ElectricalPanel'
import RoomSettingsPanel from './components/RoomSettingsPanel'
import ReportPanel from './components/ReportPanel'
import LoadProjectModal from './components/LoadProjectModal'
import FixtureLibraryModal from './components/FixtureLibraryModal'
import RoomTabsBar from './components/RoomTabsBar'
import FloorTabsBar from './components/FloorTabsBar'
import SharedView from './components/SharedView'
import AIRecommender from './components/AIRecommender'

// ─────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────
const S = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
    width: '100vw',
    background: '#090c10',
    overflow: 'hidden',
  },

  // ── Header ──────────────────────────────────────────────────
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
    gap: 16,
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

  // ── Main layout: sidebar + canvas area ────────────────────
  mainWrapper: {
    flex: 1,
    display: 'flex',
    overflow: 'hidden',
  },

  // ── Left sidebar (panels) ────────────────────────────────
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
    borderBottom: '2px solid transparent',
    color: '#2d4f68',
    transition: 'all 0.2s',
    userSelect: 'none',
  },

  sidebarTabActive: {
    color: '#d4a843',
    borderBottomColor: '#d4a843',
  },

  sidebarContent: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
  },

  // ── Canvas area ──────────────────────────────────────────
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

  canvasLabel: {
    position: 'absolute',
    top: -28,
    left: 0,
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    color: '#2d4f68',
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
  },

  // ── Right sidebar (results) ──────────────────────────────
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
    borderBottom: '2px solid transparent',
    color: '#2d4f68',
    transition: 'all 0.2s',
    userSelect: 'none',
  },

  rightTabActive: {
    color: '#d4a843',
    borderBottomColor: '#d4a843',
  },

  rightContent: {
    flex: 1,
    overflow: 'auto',
    padding: '12px',
  },

  // ── Status bar ───────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────
export default function App() {
  const [leftTab, setLeftTab] = useState('settings') // 'settings', 'library', 'floor'
  const [rightTab, setRightTab] = useState('electrical') // 'electrical', 'report', 'ai'
  const [showLoadModal, setShowLoadModal] = useState(false)
  const [showLibraryModal, setShowLibraryModal] = useState(false)

  return (
    <div style={S.root}>

      {/* ── Header ──────────────────────────────────────────── */}
      <header style={S.header}>
        <div style={S.headerLeft}>
          <div style={S.logo}>
            <div style={S.logoMark}>L</div>
            LUMINA DESIGN
          </div>
          <div style={S.divider} />
          <span style={S.headerTag}>Engineering Platform</span>
        </div>

        <div style={S.headerRight}>
          <span style={S.unitTag}>MM</span>
          <div style={S.statusPill}>
            <div style={S.statusDot} />
            READY
          </div>
        </div>
      </header>

      {/* ── Main content area ──────────────────────────────── */}
      <div style={S.mainWrapper}>

        {/* ── LEFT SIDEBAR: Settings, Library, Floors ──────── */}
        <div style={S.sidebar}>
          <div style={S.sidebarTabs}>
            <div
              style={{
                ...S.sidebarTab,
                ...(leftTab === 'settings' ? S.sidebarTabActive : {}),
              }}
              onClick={() => setLeftTab('settings')}
            >
              SETTINGS
            </div>
            <div
              style={{
                ...S.sidebarTab,
                ...(leftTab === 'library' ? S.sidebarTabActive : {}),
              }}
              onClick={() => setLeftTab('library')}
            >
              LIBRARY
            </div>
            <div
              style={{
                ...S.sidebarTab,
                ...(leftTab === 'floor' ? S.sidebarTabActive : {}),
              }}
              onClick={() => setLeftTab('floor')}
            >
              FLOORS
            </div>
          </div>

          <div style={S.sidebarContent}>
            {leftTab === 'settings' && <RoomSettingsPanel />}
            {leftTab === 'library' && (
              <div style={{ padding: '12px', textAlign: 'center' }}>
                <button
                  onClick={() => setShowLibraryModal(true)}
                  style={{
                    padding: '8px 16px',
                    background: '#d4a843',
                    color: '#0f0f0f',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  Open Fixture Library
                </button>
              </div>
            )}
            {leftTab === 'floor' && <FloorPlanUpload />}
          </div>
        </div>

        {/* ── CENTER: Canvas ──────────────────────────────── */}
        <div style={S.canvasArea}>
          {/* Toolbar */}
          <div style={S.canvasToolbar}>
            <Toolbar onLoadProject={() => setShowLoadModal(true)} />
          </div>

          {/* Canvas + room/floor tabs */}
          <div style={S.canvasMain}>
            <div>
              <RoomTabsBar />
              <div style={S.canvasWrap}>
                <DesignCanvas />
              </div>
              <FloorTabsBar />
            </div>
          </div>
        </div>

        {/* ── RIGHT SIDEBAR: Electrical, Report, AI ──────── */}
        <div style={S.rightSidebar}>
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
            {rightTab === 'electrical' && <ElectricalPanel />}
            {rightTab === 'report' && <ReportPanel />}
            {rightTab === 'ai' && <AIRecommender />}
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────── */}
      {showLoadModal && <LoadProjectModal onClose={() => setShowLoadModal(false)} />}
      {showLibraryModal && <FixtureLibraryModal onClose={() => setShowLibraryModal(false)} />}

      {/* ── Status bar ──────────────────────────────────────── */}
      <footer style={S.statusBar}>
        <div style={S.statusLeft}>
          <div style={S.statusItem}>
            CANVAS <span style={S.statusVal}>1000 × 700</span>
          </div>
          <div style={S.statusItem}>
            SCALE <span style={S.statusVal}>1:20</span>
          </div>
          <div style={S.statusItem}>
            ROOM <span style={S.statusVal}>6.0 × 4.0 m</span>
          </div>
          <div style={S.statusItem}>
            AREA <span style={S.statusVal}>24.00 m²</span>
          </div>
          <div style={S.statusItem}>
            FIXTURES <span style={S.statusVal}>0</span>
          </div>
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#1e3448' }}>
          REACT · KONVA · VITE · FIREBASE
        </div>
      </footer>

    </div>
  )
}