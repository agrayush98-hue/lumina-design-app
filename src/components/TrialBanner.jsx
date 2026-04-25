import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const mono = { fontFamily: 'IBM Plex Mono, monospace' }

export default function TrialBanner() {
  const { getTrialStatus, logout } = useAuth()
  const navigate = useNavigate()
  const trial = getTrialStatus()

  if (trial.status === 'active' || trial.status === 'loading') return null

  const isExpired = trial.status === 'expired'
  const isWarning = trial.status === 'trial' && trial.daysLeft <= 3

  const bg     = isExpired ? '#0f0000' : isWarning ? '#0f0a00' : '#0a0a0a'
  const border = isExpired ? '#3a1010' : isWarning ? '#3a2800' : '#222222'
  const color  = isExpired ? '#ef4444' : isWarning ? '#d4a843' : '#888888'

  function goUpgrade() {
    navigate('/dashboard', { state: { openTab: 'subscription' } })
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 20px', background: bg,
      borderBottom: `1px solid ${border}`,
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ ...mono, fontSize: 9, color, letterSpacing: '0.08em' }}>
          {isExpired
            ? '⚠  FREE TRIAL EXPIRED — upgrade to unlock DALI, exports, floor plan upload, and more'
            : `FREE TRIAL — ${trial.daysLeft} day${trial.daysLeft !== 1 ? 's' : ''} remaining`}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={goUpgrade}
          style={{
            ...mono, fontSize: 9, fontWeight: 700, padding: '3px 12px',
            background: '#d4a843', color: '#000000',
            border: 'none', borderRadius: 3, cursor: 'pointer',
            letterSpacing: '0.06em',
          }}
        >
          UPGRADE TO PRO →
        </button>
        <button
          onClick={logout}
          style={{
            ...mono, fontSize: 8, padding: '3px 10px',
            background: 'transparent', color: '#555555',
            border: '1px solid #2a2a2a', borderRadius: 3, cursor: 'pointer',
          }}
        >SIGN OUT</button>
      </div>
    </div>
  )
}
