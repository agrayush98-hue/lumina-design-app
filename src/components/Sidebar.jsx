import { useState } from 'react'

// ── Icons ─────────────────────────────────────────────────────────────────────
const ICONS = {
  'floor-plan':   ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="14" height="14" rx="1.5" stroke={color} strokeWidth="1.25" fill="none"/>
      <path d="M1 6h14M6 6v9" stroke={color} strokeWidth="1.25"/>
    </svg>
  ),
  'luminaires':   ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="3" stroke={color} strokeWidth="1.25"/>
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.22 3.22l1.41 1.41M11.37 11.37l1.41 1.41M3.22 12.78l1.41-1.41M11.37 4.63l1.41-1.41" stroke={color} strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  ),
  'calculation':  ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="2" width="12" height="12" rx="1.5" stroke={color} strokeWidth="1.25" fill="none"/>
      <path d="M5 5h2M9 5h2M5 8h2M9 8h2M5 11h2M9 11h2" stroke={color} strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  ),
  'heatmaps':     ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke={color} strokeWidth="1.25" fill="none"/>
      <circle cx="8" cy="8" r="3.5" stroke={color} strokeWidth="1.25" fill="none" opacity="0.6"/>
      <circle cx="8" cy="8" r="1" fill={color}/>
    </svg>
  ),
  'dali-bus':     ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M2 8h12M2 5h12M2 11h12" stroke={color} strokeWidth="1.25" strokeLinecap="round"/>
      <circle cx="4" cy="8" r="1" fill={color}/>
      <circle cx="8" cy="5" r="1" fill={color}/>
      <circle cx="12" cy="11" r="1" fill={color}/>
    </svg>
  ),
  'reports':      ({ size = 16, color = 'currentColor' }) => (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M4 2h5.17L12 4.83V14H4V2z" stroke={color} strokeWidth="1.25" fill="none"/>
      <path d="M9 2v3h3" stroke={color} strokeWidth="1.25"/>
      <path d="M6 8h4M6 10.5h4M6 6h2" stroke={color} strokeWidth="1.25" strokeLinecap="round"/>
    </svg>
  ),
}

const NAV_ITEMS = [
  { id: 'floor-plan',  label: 'Floor Plan' },
  { id: 'luminaires',  label: 'Luminaires' },
  { id: 'calculation', label: 'Calculation' },
  { id: 'heatmaps',    label: 'Heatmaps' },
  { id: 'dali-bus',    label: 'DALI Bus' },
  { id: 'reports',     label: 'Reports' },
]

function NavItem({ item, active, onClick }) {
  const [hovered, setHovered] = useState(false)
  const Icon = ICONS[item.id]
  const color = active ? '#d4a843' : hovered ? '#cccccc' : '#555555'

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        width: '100%',
        padding: '8px 10px',
        background: active ? 'rgba(212,168,67,0.08)' : hovered ? '#1a1a1a' : 'transparent',
        border: 'none',
        borderLeft: `2px solid ${active ? '#d4a843' : 'transparent'}`,
        borderRadius: active ? '0 4px 4px 0' : 4,
        cursor: 'pointer',
        color,
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        fontSize: 14,
        fontWeight: active ? 500 : 400,
        textAlign: 'left',
        letterSpacing: '0.01em',
        transition: 'background 0.1s, color 0.1s, border-color 0.1s',
      }}
    >
      <Icon size={14} color={color} />
      {item.label}
    </button>
  )
}

export default function Sidebar({ activeItem, onItemChange, children }) {
  return (
    <div style={{
      width: 260,
      minWidth: 260,
      background: '#111111',
      borderRight: '1px solid #1e1e1e',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      flexShrink: 0,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>

      {/* Navigation items */}
      <div style={{ padding: '10px 8px 8px', borderBottom: '1px solid #1a1a1a', flexShrink: 0 }}>
        {NAV_ITEMS.map(item => (
          <NavItem
            key={item.id}
            item={item}
            active={activeItem === item.id}
            onClick={() => onItemChange(item.id)}
          />
        ))}
      </div>

      {/* Panel content — scrollable */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  )
}
