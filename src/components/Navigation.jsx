import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const S = {
  nav: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: 56,
    background: '#111111',
    borderBottom: '1px solid #222222',
    display: 'flex',
    alignItems: 'center',
    padding: '0 16px',
    gap: 0,
    flexShrink: 0,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    userSelect: 'none',
  },
  logo: {
    fontSize: 15,
    fontWeight: 700,
    color: '#d4a843',
    letterSpacing: '0.12em',
    marginRight: 16,
    flexShrink: 0,
  },
  sep: {
    width: 1,
    height: 20,
    background: '#2a2a2a',
    margin: '0 14px',
    flexShrink: 0,
  },
  projectName: {
    fontSize: 14,
    fontWeight: 500,
    color: '#cccccc',
    background: 'transparent',
    border: 'none',
    outline: 'none',
    padding: '4px 8px',
    borderRadius: 4,
    minWidth: 120,
    maxWidth: 220,
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    cursor: 'text',
  },
  tabsWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 2,
    flex: 1,
    justifyContent: 'center',
  },
  tab: (active) => ({
    padding: '5px 16px',
    fontSize: 14,
    fontWeight: active ? 500 : 400,
    color: active ? '#f0f0f0' : '#666666',
    background: 'transparent',
    border: 'none',
    borderBottom: `2px solid ${active ? '#d4a843' : 'transparent'}`,
    borderRadius: 0,
    cursor: 'pointer',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    transition: 'color 0.12s, border-color 0.12s',
    whiteSpace: 'nowrap',
    height: 56,
    display: 'flex',
    alignItems: 'center',
  }),
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  btnGhost: {
    padding: '6px 13px',
    fontSize: 13,
    fontWeight: 400,
    color: '#888888',
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: 5,
    cursor: 'pointer',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    letterSpacing: '0.02em',
  },
  btnPrimary: {
    padding: '6px 15px',
    fontSize: 13,
    fontWeight: 600,
    color: '#000000',
    background: '#d4a843',
    border: 'none',
    borderRadius: 5,
    cursor: 'pointer',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    letterSpacing: '0.04em',
  },
  iconBtn: {
    width: 32,
    height: 32,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: '1px solid #2a2a2a',
    borderRadius: 5,
    cursor: 'pointer',
    color: '#666666',
    fontSize: 16,
  },
  savingDot: {
    width: 5,
    height: 5,
    borderRadius: '50%',
    background: '#22c55e',
    flexShrink: 0,
  },
}

const TABS = [
  { id: 'canvas',  label: 'Canvas' },
  { id: 'library', label: 'Library' },
]

export default function Navigation({
  projectName,
  onProjectNameChange,
  saving,
  onSave,
  onExport,
  onShare,
  onSignOut,
  onShowShortcuts,
  onNavigateToDashboard,
  activeTab,
  onTabChange,
  user,
}) {
  const [hoveredTab, setHoveredTab] = useState(null)

  return (
    <nav style={S.nav}>
      {/* Logo */}
      <div style={S.logo}>LUMINA</div>

      {/* Back to dashboard */}
      <button
        onClick={onNavigateToDashboard}
        style={{ ...S.btnGhost, gap: 4 }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#444444'; e.currentTarget.style.color = '#cccccc' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888888' }}
      >
        ← Projects
      </button>

      <div style={S.sep} />

      {/* Editable project name */}
      <input
        type="text"
        value={projectName}
        onChange={e => onProjectNameChange(e.target.value)}
        style={S.projectName}
        onFocus={e => { e.target.style.background = '#1a1a1a'; e.target.style.outline = '1px solid #333333' }}
        onBlur={e => { e.target.style.background = 'transparent'; e.target.style.outline = 'none' }}
        placeholder="Untitled Project"
      />

      {saving && <div style={S.savingDot} title="Saving…" />}

      {/* Center tabs */}
      <div style={S.tabsWrap}>
        {TABS.map(t => {
          const isActive = activeTab === t.id
          const isHovered = hoveredTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              onMouseEnter={() => setHoveredTab(t.id)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                ...S.tab(isActive),
                color: isActive ? '#f0f0f0' : isHovered ? '#cccccc' : '#666666',
              }}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Right actions */}
      <div style={S.right}>
        <button
          style={S.btnGhost}
          onClick={onSave}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#22c55e'; e.currentTarget.style.color = '#22c55e' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888888' }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        <button
          style={S.btnGhost}
          onClick={onShare}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#444444'; e.currentTarget.style.color = '#cccccc' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#888888' }}
        >
          Share
        </button>

        <button
          style={S.btnPrimary}
          onClick={onExport}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          Export BOQ
        </button>

        <div style={S.sep} />

        <button
          style={S.iconBtn}
          onClick={onShowShortcuts}
          title="Keyboard shortcuts"
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#444444'; e.currentTarget.style.color = '#cccccc' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.color = '#666666' }}
        >
          ?
        </button>

        {user?.email && (
          <div
            title={user.email}
            style={{
              width: 30,
              height: 30,
              borderRadius: '50%',
              background: '#d4a843',
              color: '#000000',
              fontSize: 12,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              flexShrink: 0,
              letterSpacing: '0.02em',
            }}
            onClick={onSignOut}
          >
            {user.email[0].toUpperCase()}
          </div>
        )}
      </div>
    </nav>
  )
}
