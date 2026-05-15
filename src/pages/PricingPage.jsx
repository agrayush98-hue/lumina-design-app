import { useState } from 'react'
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
  cardBg:     'rgba(255,255,255,0.03)',
  cardHigh:   'rgba(255,255,255,0.06)',
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

const FREE_FEATURES    = ['3 projects', '2 rooms per project', '5 AI calls / month', 'PDF export', 'Standard fixture library']
const PRO_FEATURES     = ['10 projects', '5 rooms per project', '50 AI calls / month', 'PDF + Excel export', 'Floor plan image upload', 'DALI 2.0 planning', 'Heatmap + beam analysis', 'All standard fixtures', 'Email support']
const PRO_FEATURES_ALL = ['Unlimited projects & rooms', '200 AI calls / month', 'PDF + Excel export', 'Floor plan image upload', 'DALI 2.0 planning', 'Branded fixtures (Philips / Havells / Wipro)', 'Branded client reports', 'Project folders', 'Priority email support']

const FAQS = [
  { q: 'Can I cancel at any time?', a: 'Yes. Cancel from your dashboard. Your plan stays active until the billing period ends — no proration, no hidden fees.' },
  { q: 'What payment methods are accepted?', a: 'UPI, debit cards, credit cards, and net banking via Razorpay. Payments processed in INR.' },
  { q: 'Is there a free trial?', a: 'The Free tier is yours permanently — no credit card required. Upgrade any time from the dashboard.' },
  { q: 'Do my projects carry over when I upgrade?', a: 'Yes. All projects carry over. PDF export unlocks immediately on all paid plans.' },
  { q: 'What counts as an AI call?', a: 'Each room description submitted to the AI Recommender counts as one call.' },
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

function Check() {
  return <span style={{ color: T.text, fontSize: 13, flexShrink: 0, marginTop: 1 }}>✓</span>
}

export default function PricingPage() {
  const navigate = useNavigate()
  const [termsAgreed, setTermsAgreed] = useState(false)

  useSEO({
    title:       'Pricing — Lumina Design | Free, Pro & Professional Plans',
    description: 'Start free forever. Upgrade to Pro (₹999/mo) or Professional (₹1,499/mo) for more projects, AI calls, DALI planning, and branded exports. 14-day free trial.',
    canonical:   'https://app.lightillumina.com/pricing',
  })

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: FONT }}>
      <Nav navigate={navigate} />

      {/* Hero */}
      <header style={{ textAlign: 'center', padding: '80px 32px 64px' }}>
        <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20 }}>
          Simple, transparent pricing
        </h1>
        <p style={{ fontSize: 16, color: T.muted, maxWidth: 480, margin: '0 auto', lineHeight: 1.7 }}>
          Start free. Upgrade when your projects need more room, more AI, or client-ready branded reports.
        </p>
      </header>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 0, maxWidth: 1040, margin: '0 auto 80px', padding: '0 32px', flexWrap: 'wrap', border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>

        {/* Free */}
        <div style={{ flex: '1 1 280px', padding: '40px 32px', borderRight: `1px solid ${T.border}`, background: T.cardBg, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 20 }}>Free</div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>₹0</div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 32 }}>forever</div>
          <hr style={{ border: 'none', borderTop: `1px solid ${T.border}`, marginBottom: 28 }} />
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1 }}>
            {FREE_FEATURES.map(f => (
              <li key={f} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 14, color: T.muted, alignItems: 'flex-start' }}>
                <Check />{f}
              </li>
            ))}
          </ul>
          <button onClick={() => navigate('/app')}
            style={{ width: '100%', padding: '12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', background: 'transparent', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT, textTransform: 'uppercase' }}
            onMouseEnter={e => { e.currentTarget.style.background = T.btnGray; e.currentTarget.style.color = T.text }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.muted }}
          >Get Started Free</button>
        </div>

        {/* Pro — highlighted */}
        <div style={{ flex: '1 1 280px', padding: '40px 32px', borderRight: `1px solid ${T.border}`, background: T.cardHigh, display: 'flex', flexDirection: 'column', position: 'relative', borderTop: '2px solid #ffffff' }}>
          <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', background: '#ffffff', color: '#000000', fontSize: 10, fontWeight: 700, padding: '3px 16px', letterSpacing: '0.12em', textTransform: 'uppercase', borderRadius: '0 0 4px 4px', whiteSpace: 'nowrap' }}>
            Most Popular
          </div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 20 }}>Pro</div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>₹999</div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 32 }}>/month · billed monthly</div>
          <hr style={{ border: 'none', borderTop: `1px solid ${T.border}`, marginBottom: 28 }} />
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1 }}>
            {PRO_FEATURES.map(f => (
              <li key={f} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 14, color: T.muted, alignItems: 'flex-start' }}>
                <Check />{f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => termsAgreed && navigate('/app')}
            disabled={!termsAgreed}
            style={{ width: '100%', padding: '12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', background: termsAgreed ? '#ffffff' : 'rgba(255,255,255,0.15)', color: termsAgreed ? '#000000' : 'rgba(255,255,255,0.35)', border: 'none', borderRadius: 4, cursor: termsAgreed ? 'pointer' : 'not-allowed', fontFamily: FONT, textTransform: 'uppercase', transition: 'background 0.15s, color 0.15s' }}
            onMouseEnter={e => { if (termsAgreed) e.currentTarget.style.background = 'rgba(255,255,255,0.88)' }}
            onMouseLeave={e => { if (termsAgreed) e.currentTarget.style.background = '#ffffff' }}
          >Get Pro</button>
        </div>

        {/* Professional */}
        <div style={{ flex: '1 1 280px', padding: '40px 32px', background: T.cardBg, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.14em', color: T.muted, textTransform: 'uppercase', marginBottom: 20 }}>Professional</div>
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 4 }}>₹1,499</div>
          <div style={{ fontSize: 13, color: T.muted, marginBottom: 32 }}>/month · billed monthly</div>
          <hr style={{ border: 'none', borderTop: `1px solid ${T.border}`, marginBottom: 28 }} />
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 40px', flex: 1 }}>
            {PRO_FEATURES_ALL.map(f => (
              <li key={f} style={{ display: 'flex', gap: 10, marginBottom: 12, fontSize: 14, color: T.muted, alignItems: 'flex-start' }}>
                <Check />{f}
              </li>
            ))}
          </ul>
          <button
            onClick={() => termsAgreed && navigate('/app')}
            disabled={!termsAgreed}
            style={{ width: '100%', padding: '12px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', background: 'transparent', color: termsAgreed ? T.text : 'rgba(255,255,255,0.25)', border: `1px solid ${termsAgreed ? T.border : 'rgba(255,255,255,0.06)'}`, borderRadius: 4, cursor: termsAgreed ? 'pointer' : 'not-allowed', fontFamily: FONT, textTransform: 'uppercase', transition: 'color 0.15s, border-color 0.15s' }}
            onMouseEnter={e => { if (termsAgreed) { e.currentTarget.style.background = T.btnGray; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' } }}
            onMouseLeave={e => { if (termsAgreed) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = T.border } }}
          >Get Professional</button>
        </div>
      </div>

      {/* T&C checkbox */}
      <div style={{ maxWidth: 1040, margin: '-48px auto 64px', padding: '0 32px', display: 'flex', justifyContent: 'center' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={termsAgreed}
            onChange={e => setTermsAgreed(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: '#ffffff', cursor: 'pointer', flexShrink: 0 }}
          />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>
            I agree to the{' '}
            <span onClick={() => navigate('/terms')} style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'underline', cursor: 'pointer' }}>Terms &amp; Conditions</span>
            {' '}and{' '}
            <span onClick={() => navigate('/privacy')} style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>
          </span>
        </label>
      </div>

      {/* FAQ */}
      <section style={{ maxWidth: 680, margin: '0 auto', padding: '0 32px 100px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.01em', textAlign: 'center', marginBottom: 48 }}>
          Frequently asked questions
        </h2>
        {FAQS.map(item => (
          <div key={item.q} style={{ padding: '24px 0', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 10 }}>{item.q}</div>
            <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.7 }}>{item.a}</div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer style={{ borderTop: `1px solid ${T.border}`, padding: '28px 48px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ fontSize: 12, color: T.dim }}>© 2026 Lumina Design</div>
        <div style={{ display: 'flex', gap: 28 }}>
          {[['Home', '/'], ['Features', '/features'], ['App', '/app']].map(([label, path]) => (
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
