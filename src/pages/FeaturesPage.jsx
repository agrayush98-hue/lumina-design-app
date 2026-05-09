import { useNavigate } from 'react-router-dom'

// ── Design tokens ─────────────────────────────────────────────
const T = {
  bg:        '#0a0a0a',
  bgRaised:  '#111111',
  bgSunken:  '#080808',
  text:      '#f0f0f0',
  textMuted: '#888888',
  textDim:   '#555555',
  accent:    '#d4a843',
  accentDim: 'rgba(212,168,67,0.08)',
  green:     '#3dba74',
  border:    '#2e2e2e',
  font:      'IBM Plex Mono, monospace',
}

const S = {
  page: {
    minHeight: '100vh',
    background: T.bg,
    color: T.text,
    fontFamily: T.font,
    letterSpacing: '0.02em',
  },

  // ── Nav ──
  nav: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 48px',
    borderBottom: `1px solid ${T.border}`,
    position: 'sticky',
    top: 0,
    background: 'rgba(10,10,10,0.96)',
    backdropFilter: 'blur(12px)',
    zIndex: 100,
  },
  logo: {
    fontSize: 15,
    fontWeight: 600,
    color: T.accent,
    letterSpacing: '0.16em',
    cursor: 'pointer',
    userSelect: 'none',
  },
  navLinks: {
    display: 'flex',
    gap: 32,
    alignItems: 'center',
  },
  navLink: {
    color: T.textMuted,
    fontSize: 11,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    cursor: 'pointer',
    fontWeight: 400,
  },
  btnPrimary: {
    padding: '8px 18px',
    background: T.accent,
    color: '#0a0a0a',
    border: 'none',
    borderRadius: 2,
    fontFamily: T.font,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    cursor: 'pointer',
    textTransform: 'uppercase',
  },

  // ── Hero ──
  hero: {
    textAlign: 'center',
    padding: '72px 32px 64px',
    borderBottom: `1px solid ${T.border}`,
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    background: T.bgRaised,
    border: `1px solid ${T.border}`,
    borderRadius: 2,
    color: T.textMuted,
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    marginBottom: 24,
    fontWeight: 400,
  },
  h1: {
    fontSize: 38,
    fontWeight: 600,
    color: T.text,
    marginBottom: 16,
    lineHeight: 1.2,
    letterSpacing: '0.01em',
  },
  sub: {
    fontSize: 13,
    color: T.textMuted,
    lineHeight: 1.8,
    maxWidth: 540,
    margin: '0 auto',
    fontWeight: 400,
  },

  // ── Feature rows ──
  section: {
    maxWidth: 1080,
    margin: '0 auto',
  },
  featureRow: {
    display: 'flex',
    borderBottom: `1px solid ${T.border}`,
  },
  featureText: {
    flex: '1 1 0',
    padding: '56px 48px',
    borderRight: `1px solid ${T.border}`,
  },
  featureViz: {
    width: 360,
    flexShrink: 0,
    background: T.bgRaised,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    padding: '40px 32px',
  },
  featureVizReverse: {
    width: 360,
    flexShrink: 0,
    background: T.bgRaised,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    padding: '40px 32px',
    borderRight: `1px solid ${T.border}`,
  },
  featureTextRight: {
    flex: '1 1 0',
    padding: '56px 48px',
  },
  vizGlyph: {
    fontSize: 40,
    color: T.accent,
    opacity: 0.6,
    fontFamily: T.font,
    letterSpacing: '0.04em',
  },
  vizLabel: {
    fontSize: 9,
    color: T.textDim,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    fontWeight: 400,
    textAlign: 'center',
  },
  vizStat: {
    fontSize: 22,
    fontWeight: 600,
    color: T.accent,
    letterSpacing: '0.04em',
  },
  featureTag: {
    display: 'inline-block',
    padding: '2px 8px',
    background: 'transparent',
    border: `1px solid ${T.border}`,
    borderRadius: 2,
    color: T.textDim,
    fontSize: 8,
    letterSpacing: '0.16em',
    textTransform: 'uppercase',
    marginBottom: 14,
    fontWeight: 400,
  },
  featureTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: T.text,
    marginBottom: 14,
    lineHeight: 1.25,
    letterSpacing: '0.01em',
  },
  featureDesc: {
    fontSize: 13,
    color: T.textMuted,
    lineHeight: 1.75,
    marginBottom: 24,
    fontWeight: 400,
  },
  bulletList: {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  },
  bulletItem: {
    display: 'flex',
    gap: 10,
    marginBottom: 9,
    fontSize: 11,
    color: T.textMuted,
    lineHeight: 1.5,
    fontWeight: 400,
    letterSpacing: '0.02em',
  },
  bullet: {
    color: T.accent,
    fontFamily: T.font,
    fontSize: 10,
    flexShrink: 0,
    marginTop: 1,
    opacity: 0.7,
  },

  // ── CTA ──
  cta: {
    textAlign: 'center',
    padding: '64px 32px 72px',
    background: T.bgRaised,
    borderTop: `1px solid ${T.border}`,
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: 600,
    color: T.text,
    marginBottom: 12,
    letterSpacing: '0.01em',
  },
  ctaSub: {
    fontSize: 12,
    color: T.textMuted,
    marginBottom: 32,
    fontWeight: 400,
    letterSpacing: '0.04em',
  },
  ctaBtns: {
    display: 'flex',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  btnSecondary: {
    padding: '8px 18px',
    background: 'transparent',
    color: T.textMuted,
    border: `1px solid ${T.border}`,
    borderRadius: 2,
    fontFamily: T.font,
    fontSize: 11,
    fontWeight: 400,
    letterSpacing: '0.08em',
    cursor: 'pointer',
    textTransform: 'uppercase',
  },

  // ── Footer ──
  footer: {
    borderTop: `1px solid ${T.border}`,
    padding: '28px 48px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  footerLink: {
    fontSize: 10,
    color: T.textDim,
    cursor: 'pointer',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    marginLeft: 28,
    fontWeight: 400,
  },
}

const FEATURES = [
  {
    tag: 'Lux Engine',
    title: 'Real-time lux calculations',
    desc: 'Every fixture placement instantly updates the lux display. The engine uses the zonal cavity method (IS/IEC 60598) — accounting for ceiling height, beam angle, room reflectances, and inter-reflected lux from all surfaces.',
    bullets: [
      'Nadir lux per fixture (candela / distance²)',
      'Cumulative lux at every point from all fixtures',
      'Room-wide average lux vs. target',
      'Utilisation factor (UF) and room cavity ratio (RCR)',
    ],
    glyph: '◈',
    stat: '±2%',
    vizNote: 'Lux accuracy · live update',
  },
  {
    tag: 'AI Recommender',
    title: 'Describe your room, get a fixture plan',
    desc: 'Type a plain-language description of your space. The AI recommends fixture type, wattage, quantity, and placement grid, then auto-places on the canvas.',
    bullets: [
      'Natural language room input',
      'Fixture type + wattage recommendation',
      'Auto-placement with grid layout',
      '50–200 AI calls / month on paid plans',
    ],
    glyph: '⬡',
    stat: 'AI',
    vizNote: 'Fixture recommender',
  },
  {
    tag: 'DALI 2.0',
    title: 'Full DALI circuit planning',
    desc: 'Assign DALI addresses per fixture, validate bus capacity (max 64 devices per bus), define zone groups, and export a driver schedule. Supports DALI, DALI-2, and DALI DT8 tunable white.',
    bullets: [
      'Per-fixture DALI address assignment',
      'Bus capacity validation (64 device limit)',
      'Zone group editor',
      'Driver schedule in PDF + Excel export',
    ],
    glyph: '⊡',
    stat: '64',
    vizNote: 'Max devices / bus',
  },
  {
    tag: 'Reporting',
    title: 'Professional PDF reports in one click',
    desc: 'Export a complete lighting design report for your client — canvas snapshot, fixture schedule, circuit allocation, lux summary, DALI driver schedule, and project metadata. Formatted for A4 print.',
    bullets: [
      'Canvas snapshot with room layout',
      'Fixture schedule with quantities and wattages',
      'Circuit allocation table (800W max per circuit)',
      'DALI driver schedule',
      'Branded reports on Professional plan',
    ],
    glyph: '▤',
    stat: 'A4',
    vizNote: 'PDF export format',
  },
  {
    tag: 'Fixture Library',
    title: 'Curated fixture database',
    desc: 'Search and place from a built-in library of over 50 fixture types. Filter by brand, category, wattage, beam angle, and protocol.',
    bullets: [
      'Philips, Havells, Wipro branded fixtures',
      'Downlights, surface panels, LED strips, battens',
      'Emergency lighting (maintained / non-maintained)',
      'Custom wattage / lumen override per fixture',
    ],
    glyph: '◧',
    stat: '50+',
    vizNote: 'Fixture types',
  },
]

export default function FeaturesPage() {
  const navigate = useNavigate()

  return (
    <div style={S.page}>

      {/* Nav */}
      <nav style={S.nav}>
        <span style={S.logo} onClick={() => navigate('/')}>LUMINA</span>
        <div style={S.navLinks}>
          <span style={S.navLink} onClick={() => navigate('/features')}>Features</span>
          <span style={S.navLink} onClick={() => navigate('/pricing')}>Pricing</span>
          <button style={S.btnPrimary} onClick={() => navigate('/app')}>Open App</button>
        </div>
      </nav>

      {/* Hero */}
      <header style={S.hero}>
        <div style={S.badge}>Features</div>
        <h1 style={S.h1}>
          Every tool a lighting designer needs.<br />Nothing you don't.
        </h1>
        <p style={S.sub}>
          From real-time lux calculations to DALI 2.0 planning and client-ready PDF reports — Lumina handles the technical heavy lifting so you can focus on the design.
        </p>
      </header>

      {/* Feature rows — alternating text / viz */}
      <div style={{ borderBottom: `1px solid ${T.border}` }}>
        {FEATURES.map((f, i) => {
          const isReverse = i % 2 === 1
          const textBlock = (
            <div style={isReverse ? S.featureTextRight : S.featureText}>
              <div style={S.featureTag}>{f.tag}</div>
              <h2 style={S.featureTitle}>{f.title}</h2>
              <p style={S.featureDesc}>{f.desc}</p>
              <ul style={S.bulletList}>
                {f.bullets.map(b => (
                  <li key={b} style={S.bulletItem}>
                    <span style={S.bullet}>→</span>{b}
                  </li>
                ))}
              </ul>
            </div>
          )
          const vizBlock = (
            <div style={isReverse ? S.featureVizReverse : S.featureViz}>
              <div style={S.vizGlyph}>{f.glyph}</div>
              <div style={S.vizStat}>{f.stat}</div>
              <div style={S.vizLabel}>{f.vizNote}</div>
            </div>
          )
          return (
            <div key={f.tag} style={S.featureRow}>
              {isReverse ? <>{vizBlock}{textBlock}</> : <>{textBlock}{vizBlock}</>}
            </div>
          )
        })}
      </div>

      {/* CTA */}
      <div style={S.cta}>
        <h2 style={S.ctaTitle}>Start your first project today</h2>
        <p style={S.ctaSub}>Free forever · No credit card required</p>
        <div style={S.ctaBtns}>
          <button style={S.btnPrimary} onClick={() => navigate('/app')}>
            Open Lumina Free
          </button>
          <button style={S.btnSecondary} onClick={() => navigate('/pricing')}>
            View Pricing →
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer style={S.footer}>
        <div style={{ fontSize: 10, color: T.textDim }}>© 2026 Lumina Design</div>
        <div>
          <span style={S.footerLink} onClick={() => navigate('/')}>Home</span>
          <span style={S.footerLink} onClick={() => navigate('/pricing')}>Pricing</span>
          <span style={S.footerLink} onClick={() => navigate('/app')}>App</span>
        </div>
      </footer>

    </div>
  )
}
