/**
 * Shared Nav + Footer for all marketing sub-pages.
 * Keeps design consistent with FeaturesPage / LandingPage.
 */
import { useNavigate } from 'react-router-dom'

export const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, Arial, sans-serif"

export const T = {
  bg:         '#000000',
  text:       '#ffffff',
  muted:      'rgba(255,255,255,0.55)',
  dim:        'rgba(255,255,255,0.28)',
  border:     'rgba(255,255,255,0.10)',
  rowAlt:     'rgba(255,255,255,0.025)',
  btnGray:    'rgba(255,255,255,0.10)',
  btnGrayHov: 'rgba(255,255,255,0.16)',
  accent:     'rgba(255,255,255,0.08)',
}

const NAV_LINKS = [
  { label: 'HOME',     path: '/' },
  { label: 'FEATURES', path: '/features' },
  { label: 'PRICING',  path: '/pricing' },
  { label: 'BLOG',     path: '/blog' },
  { label: 'CONTACT',  path: '/contact' },
]

const FOOTER_LINKS = [
  ['Terms', '/terms'], ['Privacy', '/privacy'],
  ['Refund', '/refund'], ['Cancellation', '/cancellation'],
]

export function MarketingNav() {
  const navigate = useNavigate()
  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 48px', height: 60,
      borderBottom: `1px solid ${T.border}`,
      position: 'sticky', top: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(16px)',
    }}>
      <span onClick={() => navigate('/')} style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.18em', cursor: 'pointer', userSelect: 'none' }}>LUMINA</span>
      <div style={{ display: 'flex', gap: 36, alignItems: 'center' }}>
        {NAV_LINKS.map(l => (
          <span key={l.label} onClick={() => navigate(l.path)}
            style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.1em', color: T.muted, cursor: 'pointer', whiteSpace: 'nowrap' }}
            onMouseEnter={e => e.currentTarget.style.color = T.text}
            onMouseLeave={e => e.currentTarget.style.color = T.muted}
          >{l.label}</span>
        ))}
      </div>
      <button onClick={() => navigate('/app')}
        style={{ padding: '8px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', background: T.btnGray, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
        onMouseEnter={e => e.currentTarget.style.background = T.btnGrayHov}
        onMouseLeave={e => e.currentTarget.style.background = T.btnGray}
      >LAUNCH APP</button>
    </nav>
  )
}

export function MarketingFooter() {
  const navigate = useNavigate()
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, padding: '28px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
      <div style={{ fontSize: 12, color: T.dim }}>© 2026 Lumina Design</div>
      <div style={{ display: 'flex', gap: 28 }}>
        {[['Home', '/'], ['Features', '/features'], ['Pricing', '/pricing'], ['Blog', '/blog'], ['App', '/app']].map(([label, path]) => (
          <span key={label} onClick={() => navigate(path)}
            style={{ fontSize: 11, color: T.dim, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
            onMouseEnter={e => e.currentTarget.style.color = T.muted}
            onMouseLeave={e => e.currentTarget.style.color = T.dim}
          >{label}</span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 20 }}>
        {FOOTER_LINKS.map(([label, path]) => (
          <span key={label} onClick={() => navigate(path)}
            style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.40)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.18)'}
          >{label}</span>
        ))}
      </div>
    </footer>
  )
}

/** CTA banner — reused at bottom of every content page */
export function MarketingCTA({ navigate, heading = 'Start your free trial today', sub = 'Free forever · No credit card required' }) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 32px', borderTop: `1px solid ${T.border}` }}>
      <h2 style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 14 }}>{heading}</h2>
      <p style={{ fontSize: 14, color: T.muted, marginBottom: 36 }}>{sub}</p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <button onClick={() => navigate('/app')}
          style={{ padding: '13px 30px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', background: '#ffffff', color: '#000000', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.88)'}
          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
        >START FREE TRIAL</button>
        <button onClick={() => navigate('/pricing')}
          style={{ padding: '13px 30px', fontSize: 12, fontWeight: 500, letterSpacing: '0.08em', background: 'transparent', color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
          onMouseEnter={e => { e.currentTarget.style.background = T.btnGray; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = T.border }}
        >VIEW PRICING</button>
      </div>
    </div>
  )
}

/** Default export: full page wrapper */
export default function MarketingLayout({ children }) {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: FONT }}>
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  )
}
