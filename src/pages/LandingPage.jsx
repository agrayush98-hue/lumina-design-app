import { useEffect } from 'react'
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
  accentDim: 'rgba(212,168,67,0.12)',
  green:     '#3dba74',
  greenDim:  'rgba(61,186,116,0.08)',
  border:    '#2e2e2e',
  borderAccent: '#d4a843',
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
    maxWidth: 820,
    margin: '0 auto',
    padding: '88px 32px 64px',
    textAlign: 'center',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    background: T.greenDim,
    border: `1px solid ${T.green}`,
    borderRadius: 2,
    color: T.green,
    fontSize: 9,
    letterSpacing: '0.14em',
    textTransform: 'uppercase',
    marginBottom: 28,
    fontWeight: 400,
  },
  h1: {
    fontSize: 46,
    fontWeight: 600,
    lineHeight: 1.12,
    color: T.text,
    marginBottom: 24,
    letterSpacing: '0.01em',
  },
  h1Accent: {
    color: T.accent,
  },
  sub: {
    fontSize: 14,
    color: T.textMuted,
    lineHeight: 1.8,
    maxWidth: 580,
    margin: '0 auto 40px',
    fontWeight: 400,
    letterSpacing: '0.02em',
  },
  heroCtas: {
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
    display: 'inline-flex',
    alignItems: 'center',
  },

  // ── Stats ──
  statRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 0,
    flexWrap: 'wrap',
    maxWidth: 860,
    margin: '0 auto 72px',
    borderTop: `1px solid ${T.border}`,
    borderBottom: `1px solid ${T.border}`,
  },
  stat: {
    textAlign: 'center',
    padding: '36px 48px',
    borderRight: `1px solid ${T.border}`,
    flex: '1 1 160px',
  },
  statNum: {
    fontSize: 28,
    fontWeight: 600,
    color: T.accent,
    display: 'block',
    lineHeight: 1.1,
    marginBottom: 6,
    letterSpacing: '0.04em',
  },
  statLabel: {
    fontSize: 9,
    color: T.textMuted,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    fontWeight: 400,
  },

  // ── Features grid ──
  section: {
    padding: '72px 32px',
  },
  sectionLabel: {
    textAlign: 'center',
    fontSize: 9,
    color: T.green,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    marginBottom: 14,
    fontWeight: 400,
  },
  sectionTitle: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 600,
    color: T.text,
    marginBottom: 48,
    letterSpacing: '0.01em',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 1,
    maxWidth: 1080,
    margin: '0 auto',
    border: `1px solid ${T.border}`,
  },
  featureCard: {
    padding: '28px 24px',
    background: T.bgRaised,
    borderRight: `1px solid ${T.border}`,
    borderBottom: `1px solid ${T.border}`,
  },
  featureIcon: {
    fontSize: 22,
    marginBottom: 14,
    display: 'block',
  },
  featureTitle: {
    fontSize: 11,
    fontWeight: 600,
    color: T.accent,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  featureDesc: {
    fontSize: 12,
    color: T.textMuted,
    lineHeight: 1.7,
    fontWeight: 400,
  },

  // ── CTA band ──
  ctaBand: {
    borderTop: `1px solid ${T.border}`,
    borderBottom: `1px solid ${T.border}`,
    padding: '64px 32px',
    textAlign: 'center',
    background: T.bgRaised,
  },
  ctaTitle: {
    fontSize: 26,
    fontWeight: 600,
    color: T.text,
    marginBottom: 14,
    letterSpacing: '0.01em',
  },
  ctaSub: {
    fontSize: 13,
    color: T.textMuted,
    marginBottom: 32,
    fontWeight: 400,
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
  footerLeft: {
    fontSize: 10,
    color: T.textDim,
    fontWeight: 400,
    letterSpacing: '0.04em',
  },
  footerLinks: {
    display: 'flex',
    gap: 28,
  },
  footerLink: {
    fontSize: 10,
    color: T.textDim,
    cursor: 'pointer',
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
    fontWeight: 400,
  },
}

const FEATURES = [
  {
    icon: '◈',
    title: 'Lux Engine',
    desc: 'Real-time zonal cavity calculations. Per-fixture nadir lux, beam overlap, and inter-reflected lux from ceiling, wall, and floor surfaces.',
  },
  {
    icon: '⬡',
    title: 'AI Recommender',
    desc: 'Describe your space in plain language. Get fixture type, wattage, quantity, and placement grid from an AI trained on lighting standards.',
  },
  {
    icon: '▦',
    title: 'Multi-room Plans',
    desc: 'Multiple floors and rooms per project. Upload a floor plan image as a trace layer. 500mm grid snap for precise placement.',
  },
  {
    icon: '⊡',
    title: 'DALI 2.0 Planning',
    desc: 'Per-fixture address assignment, bus capacity validation (64 device limit), zone groups, and driver schedule export.',
  },
  {
    icon: '▤',
    title: 'PDF Reports',
    desc: 'One-click A4 PDF with canvas snapshot, fixture schedule, lux summary, circuit allocation, and DALI driver schedule.',
  },
  {
    icon: '◧',
    title: 'Fixture Library',
    desc: 'Philips, Havells, Wipro, and generic fixtures. Filter by brand, category, wattage, beam angle, and protocol.',
  },
]

const STATS = [
  { num: '50+',    label: 'Fixture types' },
  { num: '2700K',  label: 'to 6500K CCT' },
  { num: 'DALI 2', label: 'Protocol' },
  { num: 'A4 PDF', label: 'Export' },
]

export default function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const link = document.querySelector("link[rel='canonical']") || document.createElement('link')
    link.rel  = 'canonical'
    link.href = 'https://lumina-design-rho.vercel.app/'
    if (!link.parentNode) document.head.appendChild(link)
  }, [])

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
        <div style={S.badge}>Lighting Design Software</div>
        <h1 style={S.h1}>
          Professional lighting layouts,<br />
          <span style={S.h1Accent}>calculated in real time.</span>
        </h1>
        <p style={S.sub}>
          Browser-based lighting design for electrical consultants and interior designers.
          Place fixtures, see lux levels instantly, plan DALI circuits, export PDF reports — no AutoCAD required.
        </p>
        <div style={S.heroCtas}>
          <button style={S.btnPrimary} onClick={() => navigate('/app')}>
            Start Designing Free
          </button>
          <span style={S.btnSecondary} onClick={() => navigate('/pricing')}>
            View Pricing →
          </span>
        </div>
      </header>

      {/* Stats */}
      <div style={S.statRow}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{ ...S.stat, borderRight: i < STATS.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <span style={S.statNum}>{s.num}</span>
            <span style={S.statLabel}>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Features */}
      <section style={S.section}>
        <div style={S.sectionLabel}>What's inside</div>
        <h2 style={S.sectionTitle}>Everything you need to deliver a lighting project</h2>
        <div style={S.featuresGrid}>
          {FEATURES.map(f => (
            <div key={f.title} style={S.featureCard}>
              <span style={S.featureIcon}>{f.icon}</span>
              <div style={S.featureTitle}>{f.title}</div>
              <div style={S.featureDesc}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div style={S.ctaBand}>
        <h2 style={S.ctaTitle}>Ready to start your first project?</h2>
        <p style={S.ctaSub}>Free tier includes 3 projects and full access to the design canvas.</p>
        <div style={S.heroCtas}>
          <button style={S.btnPrimary} onClick={() => navigate('/app')}>Start for Free</button>
          <span style={S.btnSecondary} onClick={() => navigate('/pricing')}>Compare Plans →</span>
        </div>
      </div>

      {/* Footer */}
      <footer style={S.footer}>
        <div style={S.footerLeft}>© 2026 Lumina Design · Built for lighting professionals.</div>
        <div style={S.footerLinks}>
          <span style={S.footerLink} onClick={() => navigate('/features')}>Features</span>
          <span style={S.footerLink} onClick={() => navigate('/pricing')}>Pricing</span>
          <span style={S.footerLink} onClick={() => navigate('/app')}>App</span>
        </div>
      </footer>

    </div>
  )
}
