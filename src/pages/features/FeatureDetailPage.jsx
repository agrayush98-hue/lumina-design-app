import { useParams, useNavigate } from 'react-router-dom'
import MarketingLayout, { T, FONT, MarketingCTA } from '../MarketingLayout.jsx'
import useSEO from '../../hooks/useSEO.js'
import { FEATURE_DATA } from './featureData.js'

function NotFound({ navigate }) {
  return (
    <div style={{ textAlign: 'center', padding: '120px 32px' }}>
      <div style={{ fontSize: 48, fontWeight: 700, marginBottom: 16 }}>404</div>
      <p style={{ color: T.muted, marginBottom: 32 }}>Feature page not found.</p>
      <button onClick={() => navigate('/features')}
        style={{ padding: '12px 28px', background: T.btnGray, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT, fontSize: 12 }}
      >← All Features</button>
    </div>
  )
}

export default function FeatureDetailPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const data = FEATURE_DATA[slug]

  useSEO({
    title:     data?.seoTitle     || 'Feature — Lumina Design',
    description: data?.seoDesc   || '',
    canonical: data?.canonical   || `https://app.lightillumina.com/features/${slug}`,
  })

  if (!data) return <MarketingLayout><NotFound navigate={navigate} /></MarketingLayout>

  return (
    <MarketingLayout>
      {/* Breadcrumb */}
      <div style={{ padding: '16px 48px', borderBottom: `1px solid ${T.border}` }}>
        <span onClick={() => navigate('/features')} style={{ fontSize: 11, color: T.dim, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          onMouseEnter={e => e.currentTarget.style.color = T.muted}
          onMouseLeave={e => e.currentTarget.style.color = T.dim}
        >← Features</span>
      </div>

      {/* Hero */}
      <header style={{ maxWidth: 760, margin: '0 auto', padding: '72px 32px 64px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: T.dim, textTransform: 'uppercase', marginBottom: 18 }}>{data.tag}</div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20, lineHeight: 1.15 }}>{data.title}</h1>
        <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.75, marginBottom: 40 }}>{data.subtitle}</p>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 6, background: T.accent, border: `1px solid ${T.border}`, borderRadius: 6, padding: '20px 40px' }}>
          <span style={{ fontSize: 40, fontWeight: 700, letterSpacing: '-0.02em' }}>{data.stat}</span>
          <span style={{ fontSize: 11, color: T.dim, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{data.statLabel}</span>
        </div>
      </header>

      {/* Content sections */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 32px 0' }}>
        {data.sections.map((s, i) => (
          <section key={i} style={{ marginBottom: 56, paddingBottom: 56, borderBottom: i < data.sections.length - 1 ? `1px solid ${T.border}` : 'none' }}>
            <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em', marginBottom: 16, color: T.text }}>{s.heading}</h2>
            <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.8, marginBottom: 24 }}>{s.body}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {s.bullets.map((b, j) => (
                <li key={j} style={{ display: 'flex', gap: 12, marginBottom: 11, fontSize: 14, color: T.muted, lineHeight: 1.7, alignItems: 'flex-start' }}>
                  <span style={{ color: 'rgba(255,255,255,0.30)', flexShrink: 0, marginTop: 2 }}>—</span>
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* FAQ */}
      {data.faq?.length > 0 && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px 64px' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 32, paddingTop: 8, borderTop: `1px solid ${T.border}`, paddingTop: 40 }}>Frequently asked questions</h2>
          {data.faq.map((item, i) => (
            <div key={i} style={{ padding: '20px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>{item.q}</div>
              <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.75 }}>{item.a}</div>
            </div>
          ))}
        </div>
      )}

      {/* Related features */}
      {data.relatedFeatures?.length > 0 && (
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 32px 80px' }}>
          <h3 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: T.dim, textTransform: 'uppercase', marginBottom: 20 }}>Related Features</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {data.relatedFeatures.map(f => (
              <button key={f.path} onClick={() => navigate(f.path)}
                style={{ padding: '9px 18px', fontSize: 12, background: T.accent, color: T.muted, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
                onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border }}
              >{f.label} →</button>
            ))}
          </div>
        </div>
      )}

      <MarketingCTA navigate={navigate} />
    </MarketingLayout>
  )
}
