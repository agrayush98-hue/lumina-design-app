import { useNavigate } from 'react-router-dom'
import MarketingLayout, { T, FONT, MarketingCTA } from '../MarketingLayout.jsx'
import useSEO from '../../hooks/useSEO.js'

const COMPARISON = [
  { feature: 'Platform',                lumina: 'Web browser (any device)', dialux: 'Windows desktop only' },
  { feature: 'Installation required',  lumina: 'None',                    dialux: '~2 GB download + install' },
  { feature: 'Calculation method',     lumina: 'IES Lumen Method (zonal cavity)', dialux: 'Point-by-point photometric' },
  { feature: 'IES/LDT files needed',   lumina: 'No — works without photometric files', dialux: 'Yes — required for accurate results' },
  { feature: 'Learning curve',         lumina: 'Low — first project in minutes', dialux: 'High — weeks to become proficient' },
  { feature: 'DALI 2.0 planning',      lumina: 'Built-in (Pro/Professional)', dialux: 'Not included' },
  { feature: 'BOQ / Excel export',     lumina: 'Yes (Pro/Professional)',    dialux: 'Limited' },
  { feature: 'Floor plan upload',      lumina: 'PNG, JPG, PDF',            dialux: 'DWG/DXF (AutoCAD required)' },
  { feature: 'AI fixture recommender', lumina: 'Yes',                      dialux: 'No' },
  { feature: 'Pricing (INR)',          lumina: 'Free / ₹999 / ₹1,499 per month', dialux: 'Free (but Windows-only)' },
  { feature: 'Mobile / tablet use',    lumina: 'Yes (responsive web)',     dialux: 'No' },
  { feature: 'Cloud project storage',  lumina: 'Yes — all projects synced', dialux: 'Local files only' },
  { feature: 'Collaboration',          lumina: 'Share project via URL',    dialux: 'Email files manually' },
  { feature: 'India-specific support', lumina: 'Yes — NBC India standards, INR pricing', dialux: 'No' },
]

const WHEN_LUMINA = [
  'You need a quick lux calculation without installing software',
  'You\'re designing on a Mac, tablet, or Chromebook',
  'You need DALI 2.0 addressing and driver schedules',
  'You want a BOQ in Excel ready for procurement',
  'Your client needs a professional PDF report in minutes',
  'You\'re a freelance lighting designer billing by project',
  'You work in India and need NBC-aligned lux targets and INR pricing',
]

const WHEN_DIALUX = [
  'You need precise photometric simulation with IES/LDT files',
  'Your project requires point-by-point lux grids (operating theatres, precision manufacturing)',
  'The project specification explicitly requires DIALux calculation reports',
  'You already have a library of manufacturer IES files and a DIALux workflow',
]

export default function DiaLuxAlternativePage() {
  const navigate = useNavigate()

  useSEO({
    title:       'DIALux Alternative — Web-Based Lighting Design Software | Lumina Design',
    description: 'Looking for a DIALux alternative? Lumina Design runs in the browser — no install, no Windows required. Real-time lux calculations, DALI planning, and PDF/Excel export. Free trial.',
    canonical:   'https://app.lightillumina.com/compare/dialux-alternative',
  })

  return (
    <MarketingLayout>
      {/* Breadcrumb */}
      <div style={{ padding: '16px 48px', borderBottom: `1px solid ${T.border}` }}>
        <span onClick={() => navigate('/')} style={{ fontSize: 11, color: T.dim, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          onMouseEnter={e => e.currentTarget.style.color = T.muted}
          onMouseLeave={e => e.currentTarget.style.color = T.dim}
        >← Compare</span>
      </div>

      {/* Hero */}
      <header style={{ maxWidth: 800, margin: '0 auto', padding: '72px 32px 64px', textAlign: 'center', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: T.dim, textTransform: 'uppercase', marginBottom: 18 }}>Comparison</div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 20, lineHeight: 1.15 }}>
          The best DIALux alternative<br />for web-based lighting design
        </h1>
        <p style={{ fontSize: 16, color: T.muted, lineHeight: 1.75, maxWidth: 580, margin: '0 auto 40px' }}>
          DIALux is the industry standard — but it's Windows-only, requires a large download, and has a steep learning curve. Lumina Design runs in any browser, needs no installation, and gets you to a professional PDF report in under 20 minutes.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => navigate('/app')}
            style={{ padding: '13px 30px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', background: '#ffffff', color: '#000000', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.88)'}
            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
          >TRY LUMINA FREE</button>
          <button onClick={() => navigate('/pricing')}
            style={{ padding: '13px 30px', fontSize: 12, fontWeight: 500, background: 'transparent', color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
            onMouseEnter={e => { e.currentTarget.style.background = T.btnGray }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >VIEW PRICING</button>
        </div>
      </header>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 0' }}>

        {/* Comparison table */}
        <section style={{ marginBottom: 64, paddingBottom: 64, borderBottom: `1px solid ${T.border}` }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32 }}>Lumina Design vs DIALux — feature comparison</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: T.dim, textTransform: 'uppercase', width: '34%' }}>Feature</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: T.text, textTransform: 'uppercase', width: '33%', background: 'rgba(255,255,255,0.03)' }}>Lumina Design</th>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: T.dim, textTransform: 'uppercase', width: '33%' }}>DIALux evo</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: T.dim, fontWeight: 500 }}>{row.feature}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: T.text, background: 'rgba(255,255,255,0.02)' }}>{row.lumina}</td>
                    <td style={{ padding: '13px 16px', fontSize: 13, color: T.muted }}>{row.dialux}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 11, color: T.dim, marginTop: 16, lineHeight: 1.6 }}>
            * DIALux evo is a product of DIAL GmbH. This comparison reflects publicly available information as of May 2026. Lumina Design is not affiliated with DIAL GmbH.
          </p>
        </section>

        {/* When to use each */}
        <section style={{ marginBottom: 64, paddingBottom: 64, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 40 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: T.text }}>Use Lumina Design when:</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {WHEN_LUMINA.map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 14, color: T.muted, lineHeight: 1.65, alignItems: 'flex-start' }}>
                    <span style={{ color: '#4ade80', flexShrink: 0, marginTop: 2 }}>✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20, color: T.text }}>Stick with DIALux when:</h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                {WHEN_DIALUX.map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, fontSize: 14, color: T.muted, lineHeight: 1.65, alignItems: 'flex-start' }}>
                    <span style={{ color: T.dim, flexShrink: 0, marginTop: 2 }}>→</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Key differences explained */}
        <section style={{ marginBottom: 64, paddingBottom: 64, borderBottom: `1px solid ${T.border}` }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32 }}>The key differences explained</h2>
          {[
            {
              q: 'Calculation method: Lumen Method vs Point-by-Point',
              a: 'DIALux uses point-by-point photometric simulation with IES/LDT files — highly accurate but requires manufacturer photometric data for every fixture. Lumina uses the IES Lumen Method (zonal cavity), which calculates average maintained illuminance from fixture lumens and room geometry. The lumen method is less precise for per-point values but requires no photometric files and is accurate enough for the majority of commercial design work.',
            },
            {
              q: 'No-install vs desktop software',
              a: 'DIALux evo is a ~2GB Windows application. Lumina runs entirely in the browser — Chrome, Safari, Firefox, Edge. No download, no admin rights, no compatibility issues. This matters if you work on a Mac, use a company-managed device that restricts software installation, or want to work from a tablet on-site.',
            },
            {
              q: 'DALI planning',
              a: 'DIALux evo does not include DALI circuit planning. You would typically use a separate spreadsheet or DALI configuration tool. Lumina includes DALI 2.0 addressing, bus capacity validation, zone groups, and driver schedule export on the Pro and Professional plans — all in the same tool you designed the layout in.',
            },
            {
              q: 'Learning curve',
              a: 'DIALux evo is powerful but complex. The interface has dozens of panels, a 3D room builder, and requires understanding of photometric concepts (luminous intensity distribution, isolux diagrams, false colour rendering). Lumina is designed to be usable in a single session without training — the workflow is: upload floor plan → draw room → place fixtures → check lux → export.',
            },
          ].map((item, i) => (
            <div key={i} style={{ padding: '24px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 10 }}>{item.q}</div>
              <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.8 }}>{item.a}</div>
            </div>
          ))}
        </section>

        {/* FAQ */}
        <section style={{ marginBottom: 64 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32 }}>Frequently asked questions</h2>
          {[
            { q: 'Is Lumina Design really free?', a: 'Yes. The Free plan is free forever — 3 projects and 5 AI calls per month at no cost. No credit card required to sign up. Paid plans start at ₹999/month.' },
            { q: 'Can I import DIALux projects into Lumina?', a: 'Not currently. DIALux uses a proprietary file format (.evo). If you have existing DIALux projects, you can recreate the room layout in Lumina using your floor plan drawing as the background image.' },
            { q: 'Does Lumina replace DIALux entirely?', a: 'For most commercial projects — offices, retail, warehouses, schools, hospitals — yes. For projects requiring precise point-by-point photometric simulation (operating theatres, manufacturing, compliance documentation requiring IES-file accuracy), DIALux remains the better choice.' },
            { q: 'What standards does Lumina support?', a: 'EN 12464-1 (European lighting standard), NBC India 2016, and CIBSE guidelines. Lux targets are set by room type following these standards. Custom targets can be set per project.' },
            { q: 'Is there a free trial?', a: 'Yes — 14 days of Pro-level access with no credit card required. At the end of the trial your account reverts to the Free plan automatically.' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '20px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>{item.q}</div>
              <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.75 }}>{item.a}</div>
            </div>
          ))}
        </section>

      </div>

      <MarketingCTA navigate={navigate}
        heading="Try the DIALux alternative — free"
        sub="14-day Pro trial · No credit card · Runs in your browser"
      />
    </MarketingLayout>
  )
}
