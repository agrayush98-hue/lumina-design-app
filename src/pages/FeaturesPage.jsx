import { useNavigate } from 'react-router-dom'
import { LegalLinkRow } from './legal/LegalLayout.jsx'
import useSEO from '../hooks/useSEO.js'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, Arial, sans-serif"

const T = {
  bg:         '#000000',
  text:       '#ffffff',
  muted:      'rgba(255,255,255,0.55)',
  dim:        'rgba(255,255,255,0.30)',
  border:     'rgba(255,255,255,0.10)',
  rowAlt:     'rgba(255,255,255,0.02)',
  btnGray:    'rgba(255,255,255,0.10)',
  btnGrayHov: 'rgba(255,255,255,0.16)',
}

const NAV_LINKS = [
  { label: 'HOME',         path: '/' },
  { label: 'FEATURES',     path: '/features' },
  { label: 'HOW IT WORKS', path: '/features#how' },
  { label: 'PRICING',      path: '/pricing' },
  { label: 'CONTACT',      path: '/contact' },
]

const FEATURES = [
  {
    tag: 'LUX ENGINE',
    title: 'Real-time lux calculations',
    desc: 'Every fixture placement instantly updates the lux display. The engine uses the zonal cavity method — accounting for ceiling height, beam angle, room reflectances, and inter-reflected lux from all surfaces.',
    bullets: ['Nadir lux per fixture (candela / distance²)', 'Room-wide average lux vs. target', 'Utilisation factor (UF) and room cavity ratio (RCR)', 'Maintenance factor (MF 0.80) per CIBSE / EN 12464-1'],
    stat: '±2%', vizNote: 'Calculation accuracy',
  },
  {
    tag: 'AI RECOMMENDER',
    title: 'Describe your room, get a fixture plan',
    desc: 'Type a plain-language description of your space. The AI recommends fixture type, wattage, quantity, and placement grid, then auto-places on the canvas.',
    bullets: ['Natural language room input', 'Fixture type + wattage recommendation', 'Auto-placement with grid layout', '50–200 AI calls / month on paid plans'],
    stat: 'AI', vizNote: 'Fixture recommender',
  },
  {
    tag: 'DALI 2.0',
    title: 'Full DALI circuit planning',
    desc: 'Assign DALI addresses per fixture, validate bus capacity (max 64 devices per bus), define zone groups, and export a driver schedule.',
    bullets: ['Per-fixture DALI address assignment', 'Bus capacity validation (64 device limit)', 'Zone group editor', 'Driver schedule in PDF + Excel'],
    stat: '64', vizNote: 'Max devices / bus',
  },
  {
    tag: 'REPORTING',
    title: 'Professional PDF reports in one click',
    desc: 'Export a complete lighting design report — canvas snapshot, fixture schedule, circuit allocation, lux summary, DALI driver schedule. Formatted for A4 print.',
    bullets: ['Canvas snapshot with room layout', 'Fixture schedule with quantities', 'Circuit allocation table (800W max)', 'Branded reports on Professional plan'],
    stat: 'A4', vizNote: 'Export format',
  },
  {
    tag: 'FIXTURE LIBRARY',
    title: 'Curated fixture database',
    desc: 'Search and place from a built-in library of over 50 fixture types. Filter by brand, category, wattage, beam angle, and protocol.',
    bullets: ['Philips, Havells, Wipro branded fixtures', 'Downlights, panels, LED strips, battens', 'Emergency lighting (maintained / non-maintained)', 'Custom wattage / lumen override'],
    stat: '50+', vizNote: 'Fixture types',
  },
]

function Nav({ navigate }) {
  function go(path) {
    navigate(path)
  }
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
          <span key={l.label} onClick={() => go(l.path)}
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

export default function FeaturesPage() {
  const navigate = useNavigate()

  useSEO({
    title:       'Features — Lumina Design | Lux Calculations, DALI Planning & More',
    description: 'Real-time lux calculations (IES Lumen Method), DALI 2.0 automation, heat map visualisation, floor plan upload, and professional PDF/Excel exports. Built for lighting professionals.',
    canonical:   'https://app.lightillumina.com/features',
  })

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: FONT }}>
      <Nav navigate={navigate} />

      {/* Hero */}
      <header style={{ textAlign: 'center', padding: '80px 32px 72px', borderBottom: `1px solid ${T.border}` }}>
        <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20, lineHeight: 1.15 }}>
          Every tool a lighting designer needs.<br />Nothing you don't.
        </h1>
        <p style={{ fontSize: 16, color: T.muted, maxWidth: 560, margin: '0 auto', lineHeight: 1.75 }}>
          From real-time lux calculations to DALI 2.0 planning and client-ready PDF reports — Lumina handles the technical heavy lifting.
        </p>
      </header>

      {/* Feature rows */}
      <div id="how">
        {FEATURES.map((f, i) => {
          const isEven = i % 2 === 0
          const textBlock = (
            <div style={{ flex: '1 1 0', padding: '64px 56px', borderRight: isEven ? `1px solid ${T.border}` : 'none', borderLeft: isEven ? 'none' : `1px solid ${T.border}` }}>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: T.dim, textTransform: 'uppercase', marginBottom: 16 }}>{f.tag}</div>
              <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 16, lineHeight: 1.3 }}>{f.title}</h2>
              <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.75, marginBottom: 28 }}>{f.desc}</p>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {f.bullets.map(b => (
                  <li key={b} style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 14, color: T.muted, alignItems: 'flex-start' }}>
                    <span style={{ color: T.text, flexShrink: 0, marginTop: 1 }}>→</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          )
          const vizBlock = (
            <div style={{ width: 340, flexShrink: 0, background: T.rowAlt, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 12, padding: '48px 32px' }}>
              <div style={{ fontSize: 52, fontWeight: 700, letterSpacing: '-0.02em', color: T.text }}>{f.stat}</div>
              <div style={{ fontSize: 11, color: T.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{f.vizNote}</div>
            </div>
          )
          return (
            <div key={f.tag} style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, background: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : T.bg }}>
              {isEven ? <>{textBlock}{vizBlock}</> : <>{vizBlock}{textBlock}</>}
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div style={{ textAlign: 'center', padding: '100px 32px', borderTop: `1px solid ${T.border}` }}>
        <h2 style={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>Start your first project today</h2>
        <p style={{ fontSize: 15, color: T.muted, marginBottom: 40 }}>Free forever · No credit card required</p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/app')}
            style={{ padding: '14px 32px', fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', background: '#ffffff', color: '#000000', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.88)'}
            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
          >START FREE TRIAL</button>
          <button onClick={() => navigate('/pricing')}
            style={{ padding: '14px 32px', fontSize: 13, fontWeight: 500, letterSpacing: '0.08em', background: 'transparent', color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
            onMouseEnter={e => { e.currentTarget.style.background = T.btnGray; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = T.border }}
          >VIEW PRICING</button>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: '28px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontSize: 12, color: T.dim }}>© 2026 Lumina Design</div>
        <div style={{ display: 'flex', gap: 28 }}>
          {[['Home', '/'], ['Pricing', '/pricing'], ['App', '/app']].map(([label, path]) => (
            <span key={label} onClick={() => navigate(path)}
              style={{ fontSize: 11, color: T.dim, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
              onMouseEnter={e => e.currentTarget.style.color = T.muted}
              onMouseLeave={e => e.currentTarget.style.color = T.dim}
            >{label}</span>
          ))}
        </div>
        <LegalLinkRow navigate={navigate} />
      </footer>
    </div>
  )
}
