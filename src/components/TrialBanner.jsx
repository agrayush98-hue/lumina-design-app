import { useAuth } from '../contexts/AuthContext'

const mono = { fontFamily: 'IBM Plex Mono, monospace' }

export default function TrialBanner() {
  const { getTrialStatus, logout } = useAuth()
  const trial = getTrialStatus()

  if (trial.status === 'active' || trial.status === 'loading') return null

  const isExpired = trial.status === 'expired'
  const isWarning = trial.status === 'trial' && trial.daysLeft <= 3

  const bg     = isExpired ? '#1a0a0a' : isWarning ? '#1a1200' : '#0a1118'
  const border = isExpired ? '#4a1a1a' : isWarning ? '#4a3800' : '#1a2b3c'
  const color  = isExpired ? '#ff6b6b' : isWarning ? '#f59e0b' : '#4a7a96'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '6px 20px', background: bg,
      borderBottom: `1px solid ${border}`,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12 }}>{isExpired ? '🔒' : isWarning ? '⚠' : '⏱'}</span>
        <span style={{ ...mono, fontSize: 9, color, letterSpacing: '0.06em' }}>
          {isExpired
            ? 'YOUR FREE TRIAL HAS EXPIRED — upgrade to continue using Lumina'
            : `FREE TRIAL — ${trial.daysLeft} day${trial.daysLeft !== 1 ? 's' : ''} remaining`}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {isExpired && (
          <button style={{
            ...mono, fontSize: 9, fontWeight: 700, padding: '4px 14px',
            background: '#d4a843', color: '#0f0f0f',
            border: 'none', borderRadius: 3, cursor: 'pointer',
            letterSpacing: '0.06em',
          }}>
            UPGRADE TO PRO
          </button>
        )}
        {!isExpired && (
          <button style={{
            ...mono, fontSize: 8, padding: '3px 10px',
            background: 'transparent', color: '#4a7a96',
            border: '1px solid #1a2b3c', borderRadius: 3, cursor: 'pointer',
          }}>
            UPGRADE
          </button>
        )}
        <button
          onClick={logout}
          style={{
            ...mono, fontSize: 8, padding: '3px 10px',
            background: 'transparent', color: '#2d4f68',
            border: '1px solid #131d28', borderRadius: 3, cursor: 'pointer',
          }}
        >SIGN OUT</button>
      </div>
    </div>
  )
}
