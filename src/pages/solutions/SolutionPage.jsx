import { useParams, useNavigate } from 'react-router-dom'
import MarketingLayout, { T, FONT, MarketingCTA } from '../MarketingLayout.jsx'
import useSEO from '../../hooks/useSEO.js'
import { SOLUTION_DATA } from './solutionData.js'

function NotFound({ navigate }) {
  return (
    <div style={{ textAlign: 'center', padding: '120px 32px' }}>
      <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 16 }}>404</div>
      <p style={{ color: T.muted, marginBottom: 32 }}>Solution page not found.</p>
      <button onClick={() => navigate('/')} style={{ padding: '12px 28px', background: T.btnGray, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT, fontSize: 12 }}>
        ← Home
      </button>
    </div>
  )
}

export default function SolutionPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const d = SOLUTION_DATA[slug]

  useSEO({
    title:       d?.seoTitle   || 'Solution — Lumina Design',
    description: d?.seoDesc   || '',
    canonical:   d?.canonical || `https://app.lightillumina.com/solutions/${slug}`,
  })

  if (!d) return <MarketingLayout><NotFound navigate={navigate} /></MarketingLayout>

  return (
    <MarketingLayout>
      {/* Breadcrumb */}
      <div style={{ padding: '16px 48px', borderBottom: `1px solid ${T.border}` }}>
        <span onClick={() => navigate('/')} style={{ fontSize: 11, color: T.dim, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          onMouseEnter={e => e.currentTarget.style.color = T.muted}
          onMouseLeave={e => e.currentTarget.style.color = T.dim}
        >← Solutions</span>
      </div>

      {/* Hero */}
      <header style={{ maxWidth: 800, margin: '0 auto', padding: '72px 32px 64px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: T.dim, textTransform: 'uppercase', marginBottom: 18 }}>{d.tag}</div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20, lineHeight: 1.15 }}>{d.title}</h1>
        <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.75, marginBottom: 40 }}>{d.subtitle}</p>

        {/* Key specs row */}
        <div style={{ display: 'flex', gap: 0, border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden', justifyContent: 'center', maxWidth: 480, margin: '0 auto' }}>
          {[
            { label: 'Target Lux', value: `${d.luxTarget} lux` },
            { label: 'Standard', value: d.standard },
            { label: 'Key Spec', value: d.keySpec },
          ].map((s, i) => (
            <div key={i} style={{ flex: 1, padding: '20px 16px', borderRight: i < 2 ? `1px solid ${T.border}` : 'none', textAlign: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: T.dim, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </header>

      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 0' }}>

        {/* Intro */}
        <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.8, marginBottom: 56, paddingBottom: 56, borderBottom: `1px solid ${T.border}` }}>{d.intro}</p>

        {/* Lux requirements table */}
        <section style={{ marginBottom: 56, paddingBottom: 56, borderBottom: `1px solid ${T.border}` }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>Lux requirements by zone</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                {['Zone', 'Required lux', 'Reference'].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: '10px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: T.dim, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.requirements.map((r, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                  <td style={{ padding: '13px 16px', fontSize: 14, color: T.text }}>{r.zone}</td>
                  <td style={{ padding: '13px 16px', fontSize: 14, color: T.text, fontWeight: 600 }}>{r.lux}</td>
                  <td style={{ padding: '13px 16px', fontSize: 12, color: T.dim }}>{r.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Workflow */}
        <section style={{ marginBottom: 56, paddingBottom: 56, borderBottom: `1px solid ${T.border}` }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>How to design this in Lumina</h2>
          <ol style={{ listStyle: 'none', padding: 0, margin: 0, counterReset: 'steps' }}>
            {d.workflow.map((step, i) => (
              <li key={i} style={{ display: 'flex', gap: 16, marginBottom: 16, fontSize: 14, color: T.muted, lineHeight: 1.7, alignItems: 'flex-start' }}>
                <span style={{ flexShrink: 0, width: 24, height: 24, borderRadius: '50%', background: T.accent, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: T.text, marginTop: 2 }}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Typical fixtures */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 20 }}>Typical fixtures for this application</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {d.fixtures.map((f, i) => (
              <li key={i} style={{ display: 'flex', gap: 12, marginBottom: 11, fontSize: 14, color: T.muted, lineHeight: 1.7, alignItems: 'flex-start' }}>
                <span style={{ color: 'rgba(255,255,255,0.28)', flexShrink: 0, marginTop: 2 }}>—</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </section>

      </div>

      {/* Solutions nav */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px 80px' }}>
        <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: T.dim, textTransform: 'uppercase', marginBottom: 20 }}>Other Solutions</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {Object.values(SOLUTION_DATA).filter(s => s.slug !== slug).map(s => (
            <button key={s.slug} onClick={() => navigate(`/solutions/${s.slug}`)}
              style={{ padding: '9px 18px', fontSize: 12, background: T.accent, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
              onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border }}
            >{s.title.split(' ')[0]} {s.title.split(' ')[1]} →</button>
          ))}
        </div>
      </div>

      <MarketingCTA navigate={navigate}
        heading={`Start designing ${d.title.split(' ')[0].toLowerCase()} lighting today`}
        sub="Free 14-day trial · No credit card required"
      />
    </MarketingLayout>
  )
}
