import DesignCanvas from './components/DesignCanvas'

// ─────────────────────────────────────────────────────────────
// STYLES  (scoped inline — no external CSS file needed for App)
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
    background: 'linear-gradient(135deg, #1e4a6e 0%, #39c5cf 100%)',
    borderRadius: 3,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 10,
    color: '#fff',
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

  // ── Main area ────────────────────────────────────────────────
  main: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },

  // ── Canvas wrapper ───────────────────────────────────────────
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
  canvasId: {
    position: 'absolute',
    top: -28,
    right: 0,
    fontFamily: 'IBM Plex Mono, monospace',
    fontSize: 10,
    color: '#1e3448',
    letterSpacing: '0.06em',
  },

  // ── Status bar ───────────────────────────────────────────────
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
// COMPONENT
// ─────────────────────────────────────────────────────────────
export default function App() {
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
          <span style={S.headerTag}>Canvas v0.1</span>
        </div>

        <div style={S.headerRight}>
          <span style={S.unitTag}>MM</span>
          <div style={S.statusPill}>
            <div style={S.statusDot} />
            READY
          </div>
        </div>
      </header>

      {/* ── Canvas area ─────────────────────────────────────── */}
      <main style={S.main}>
        <div style={S.canvasWrap}>
          <span style={S.canvasLabel}>floor plan — ground floor</span>
          <span style={S.canvasId}>#PROJ-001 · ROOM-01</span>
          <DesignCanvas />
        </div>
      </main>

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
            OBJECTS <span style={S.statusVal}>0</span>
          </div>
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#1e3448' }}>
          REACT · KONVA · VITE
        </div>
      </footer>

    </div>
  )
}
