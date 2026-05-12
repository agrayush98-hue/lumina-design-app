/**
 * Shared layout for all legal/policy pages.
 * Provides nav, structured content wrapper, and footer with legal links.
 */
import { useNavigate } from 'react-router-dom'

export const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, Arial, sans-serif"

export const T = {
  bg:     '#000000',
  text:   '#ffffff',
  muted:  'rgba(255,255,255,0.55)',
  dim:    'rgba(255,255,255,0.30)',
  border: 'rgba(255,255,255,0.10)',
  btnGray:    'rgba(255,255,255,0.10)',
  btnGrayHov: 'rgba(255,255,255,0.16)',
}

const NAV_LINKS = [
  { label: 'HOME',     path: '/' },
  { label: 'FEATURES', path: '/features' },
  { label: 'PRICING',  path: '/pricing' },
  { label: 'CONTACT',  path: '/contact' },
]

const LEGAL_LINKS = [
  ['Terms',        '/terms'],
  ['Privacy',      '/privacy'],
  ['Refund',       '/refund'],
  ['Cancellation', '/cancellation'],
]

export function LegalNav() {
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

export function LegalFooter() {
  const navigate = useNavigate()
  return (
    <footer style={{ borderTop: `1px solid ${T.border}`, padding: '24px 48px', display: 'flex', flexDirection: 'column', gap: 14, alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: 28 }}>
        {LEGAL_LINKS.map(([label, path]) => (
          <span key={label} onClick={() => navigate(path)}
            style={{ fontSize: 11, color: T.dim, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
            onMouseEnter={e => e.currentTarget.style.color = T.muted}
            onMouseLeave={e => e.currentTarget.style.color = T.dim}
          >{label}</span>
        ))}
      </div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>© 2026 Lumina Design. All rights reserved.</div>
    </footer>
  )
}

/** Renders a legal page with hero, sections, nav and footer. */
export default function LegalLayout({ title, subtitle, updated, children }) {
  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: FONT }}>
      <LegalNav />
      <header style={{ textAlign: 'center', padding: '64px 32px 48px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: T.dim, textTransform: 'uppercase', marginBottom: 16 }}>Legal</div>
        <h1 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 12 }}>{title}</h1>
        {subtitle && <p style={{ fontSize: 14, color: T.muted, marginBottom: 12 }}>{subtitle}</p>}
        <p style={{ fontSize: 12, color: T.dim }}>Last updated: {updated}</p>
      </header>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '56px 32px 100px' }}>
        {children}
      </div>
      <LegalFooter />
    </div>
  )
}

// ── Shared prose helpers (used in each policy page) ────────────────────────────

export function Section({ title, children }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2 style={{ fontSize: 18, fontWeight: 700, color: T.text, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>{title}</h2>
      {children}
    </section>
  )
}

export function P({ children }) {
  return <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.8, marginBottom: 14 }}>{children}</p>
}

export function Ul({ items }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px' }}>
      {items.map((item, i) => (
        <li key={i} style={{ display: 'flex', gap: 10, marginBottom: 10, fontSize: 14, color: T.muted, lineHeight: 1.7, alignItems: 'flex-start' }}>
          <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: 2 }}>—</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  )
}

export function Highlight({ children }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${T.border}`, borderRadius: 6, padding: '16px 20px', marginBottom: 20 }}>
      <p style={{ fontSize: 14, color: T.muted, lineHeight: 1.8, margin: 0 }}>{children}</p>
    </div>
  )
}

/** Footer legal link row — inserted into existing page footers */
export function LegalLinkRow({ navigate }) {
  return (
    <div style={{ display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
      {LEGAL_LINKS.map(([label, path]) => (
        <span key={label} onClick={() => navigate(path)}
          style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.40)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.18)'}
        >{label}</span>
      ))}
    </div>
  )
}
