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
  accentDim: 'rgba(212,168,67,0.10)',
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
    padding: '72px 32px 56px',
  },
  badge: {
    display: 'inline-block',
    padding: '3px 10px',
    background: 'rgba(212,168,67,0.08)',
    border: `1px solid ${T.accent}`,
    borderRadius: 2,
    color: T.accent,
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
    letterSpacing: '0.01em',
  },
  sub: {
    fontSize: 13,
    color: T.textMuted,
    lineHeight: 1.8,
    maxWidth: 520,
    margin: '0 auto',
    fontWeight: 400,
  },

  // ── Cards ──
  cardsRow: {
    display: 'flex',
    gap: 0,
    justifyContent: 'center',
    flexWrap: 'wrap',
    padding: '48px 32px 80px',
    maxWidth: 1060,
    margin: '0 auto',
    border: `1px solid ${T.border}`,
    borderRadius: 2,
    overflow: 'hidden',
  },
  card: {
    flex: '1 1 280px',
    maxWidth: 353,
    background: T.bgRaised,
    borderRight: `1px solid ${T.border}`,
    padding: '32px 28px',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHighlight: {
    flex: '1 1 280px',
    maxWidth: 353,
    background: '#0f0f0f',
    borderRight: `1px solid ${T.border}`,
    borderLeft: `1px solid ${T.border}`,
    borderTop: `2px solid ${T.accent}`,
    padding: '32px 28px',
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: -1,
    left: '50%',
    transform: 'translateX(-50%)',
    background: T.accent,
    color: '#0a0a0a',
    fontSize: 8,
    fontWeight: 600,
    padding: '3px 14px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    borderRadius: '0 0 2px 2px',
  },
  planName: {
    fontSize: 9,
    fontWeight: 400,
    letterSpacing: '0.2em',
    textTransform: 'uppercase',
    color: T.textMuted,
    marginBottom: 12,
  },
  planPrice: {
    fontSize: 34,
    fontWeight: 600,
    color: T.text,
    marginBottom: 2,
    letterSpacing: '0.01em',
  },
  planPeriod: {
    fontSize: 10,
    color: T.textMuted,
    marginBottom: 28,
    fontWeight: 400,
    letterSpacing: '0.04em',
  },
  divider: {
    border: 'none',
    borderTop: `1px solid ${T.border}`,
    margin: '0 0 24px',
  },
  featureList: {
    listStyle: 'none',
    padding: 0,
    margin: '0 0 32px',
    flex: 1,
  },
  featureItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
    fontSize: 12,
    color: T.textMuted,
    lineHeight: 1.5,
    fontWeight: 400,
    letterSpacing: '0.02em',
  },
  featureCheck: {
    color: T.green,
    fontFamily: T.font,
    fontSize: 10,
    flexShrink: 0,
    marginTop: 1,
  },
  cardBtn: {
    width: '100%',
    padding: '10px',
    background: 'transparent',
    color: T.accent,
    border: `1px solid ${T.accent}`,
    borderRadius: 2,
    fontFamily: T.font,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    cursor: 'pointer',
    textTransform: 'uppercase',
  },
  cardBtnHighlight: {
    width: '100%',
    padding: '10px',
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
  cardBtnMuted: {
    width: '100%',
    padding: '10px',
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

  // ── FAQ ──
  faq: {
    maxWidth: 700,
    margin: '0 auto',
    padding: '0 32px 80px',
  },
  faqTitle: {
    fontSize: 22,
    fontWeight: 600,
    color: T.text,
    textAlign: 'center',
    marginBottom: 40,
    letterSpacing: '0.01em',
  },
  faqItem: {
    marginBottom: 0,
    padding: '24px 0',
    borderBottom: `1px solid ${T.border}`,
  },
  faqQ: {
    fontSize: 12,
    fontWeight: 600,
    color: T.text,
    marginBottom: 10,
    letterSpacing: '0.04em',
  },
  faqA: {
    fontSize: 12,
    color: T.textMuted,
    lineHeight: 1.7,
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

const FREE_FEATURES = [
  '3 projects',
  '2 rooms per project',
  '5 AI calls / month',
  'PDF export',
  'Standard fixture library',
]

const PRO_FEATURES = [
  '10 projects',
  '5 rooms per project',
  '50 AI calls / month',
  'PDF + Excel export',
  'Floor plan image upload',
  'DALI 2.0 planning',
  'Heatmap + beam analysis',
  'All standard fixtures',
  'Email support',
]

const PROFESSIONAL_FEATURES = [
  'Unlimited projects & rooms',
  '200 AI calls / month',
  'PDF + Excel export',
  'Floor plan image upload',
  'DALI 2.0 planning',
  'Branded fixtures (Philips / Havells / Wipro)',
  'Branded client reports',
  'Project folders',
  'Priority email support',
]

const FAQS = [
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Yes. Cancel from your dashboard at any time. Your plan stays active until the end of the billing period — no proration, no hidden fees.',
  },
  {
    q: 'What payment methods are accepted?',
    a: 'All major UPI apps, debit cards, credit cards, and net banking via Razorpay. Payments are processed in INR.',
  },
  {
    q: 'Is there a free trial for paid plans?',
    a: 'The Free tier is yours permanently — no credit card required. Upgrade at any time from the dashboard.',
  },
  {
    q: 'Do my projects carry over when I upgrade?',
    a: 'Yes. All projects carry over. PDF export unlocks immediately on all paid plans.',
  },
  {
    q: 'What counts as an "AI call"?',
    a: 'Each room description submitted to the AI Recommender counts as one call. Browsing suggestions or editing placements does not count.',
  },
]

export default function PricingPage() {
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
        <div style={S.badge}>Pricing</div>
        <h1 style={S.h1}>Simple, transparent pricing</h1>
        <p style={S.sub}>
          Start free. Upgrade when your projects need more room, more AI, or client-ready branded reports.
        </p>
      </header>

      {/* Plan cards */}
      <div style={{ padding: '0 32px 80px', maxWidth: 1060, margin: '0 auto' }}>
        <div style={{
          display: 'flex',
          border: `1px solid ${T.border}`,
          borderRadius: 2,
          overflow: 'visible',
          flexWrap: 'wrap',
        }}>

          {/* Free */}
          <div style={{ ...S.card, borderRight: `1px solid ${T.border}` }}>
            <div style={S.planName}>Free</div>
            <div style={S.planPrice}>₹0</div>
            <div style={S.planPeriod}>forever</div>
            <hr style={S.divider} />
            <ul style={S.featureList}>
              {FREE_FEATURES.map(f => (
                <li key={f} style={S.featureItem}>
                  <span style={S.featureCheck}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button style={S.cardBtnMuted} onClick={() => navigate('/app')}>
              Start for Free
            </button>
          </div>

          {/* Pro — highlighted */}
          <div style={S.cardHighlight}>
            <div style={S.popularBadge}>Most Popular</div>
            <div style={S.planName}>Pro</div>
            <div style={S.planPrice}>₹1,179</div>
            <div style={S.planPeriod}>/month · billed monthly</div>
            <hr style={S.divider} />
            <ul style={S.featureList}>
              {PRO_FEATURES.map(f => (
                <li key={f} style={S.featureItem}>
                  <span style={S.featureCheck}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button style={S.cardBtnHighlight} onClick={() => navigate('/app')}>
              Get Pro
            </button>
          </div>

          {/* Professional */}
          <div style={{ ...S.card, borderRight: 'none' }}>
            <div style={S.planName}>Professional</div>
            <div style={S.planPrice}>₹2,949</div>
            <div style={S.planPeriod}>/month · billed monthly</div>
            <hr style={S.divider} />
            <ul style={S.featureList}>
              {PROFESSIONAL_FEATURES.map(f => (
                <li key={f} style={S.featureItem}>
                  <span style={S.featureCheck}>✓</span>{f}
                </li>
              ))}
            </ul>
            <button style={S.cardBtn} onClick={() => navigate('/app')}>
              Get Professional
            </button>
          </div>

        </div>
      </div>

      {/* FAQ */}
      <section style={S.faq}>
        <h2 style={S.faqTitle}>Frequently asked questions</h2>
        {FAQS.map(item => (
          <div key={item.q} style={S.faqItem}>
            <div style={S.faqQ}>{item.q}</div>
            <div style={S.faqA}>{item.a}</div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={S.footer}>
        <div style={{ fontSize: 10, color: T.textDim }}>© 2026 Lumina Design</div>
        <div>
          <span style={S.footerLink} onClick={() => navigate('/')}>Home</span>
          <span style={S.footerLink} onClick={() => navigate('/features')}>Features</span>
          <span style={S.footerLink} onClick={() => navigate('/app')}>App</span>
        </div>
      </footer>

    </div>
  )
}
