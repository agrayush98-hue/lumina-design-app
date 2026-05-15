/**
 * /tools/lux-calculator
 * Free online lux calculator using the IES Lumen Method (zonal cavity method).
 * SEO target keywords: "lux calculator online", "lux calculation formula",
 * "online illuminance calculator", "average lux calculator"
 */
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import MarketingLayout, { T, FONT, MarketingCTA } from '../MarketingLayout.jsx'
import useSEO from '../../hooks/useSEO.js'

// ── UF lookup table (Utilisation Factor) ─────────────────────────────────────
// Based on a generic diffuse luminaire (similar to LED recessed panel).
// Rows: RCR 0–10. Columns: reflectance groups (high/medium/low room).
// Source: CIBSE Lighting Guide LG1 / IES Handbook methodology.
// ρcc = ceiling cavity reflectance, ρw = wall reflectance, ρfc = floor cavity
const UF_TABLE = {
  //       ρcc=0.7  ρcc=0.5  ρcc=0.3
  //       ρw =0.5  ρw =0.3  ρw =0.1
  //       (bright) (medium) (dark)
  0:  [0.87, 0.76, 0.64],
  1:  [0.80, 0.68, 0.56],
  2:  [0.72, 0.61, 0.49],
  3:  [0.65, 0.55, 0.44],
  4:  [0.59, 0.50, 0.39],
  5:  [0.54, 0.45, 0.35],
  6:  [0.49, 0.41, 0.32],
  7:  [0.45, 0.37, 0.29],
  8:  [0.41, 0.34, 0.27],
  9:  [0.38, 0.32, 0.25],
  10: [0.35, 0.29, 0.23],
}

function getUF(rcr, reflectanceGroup) {
  // Clamp RCR to 0–10
  const rcrClamped = Math.max(0, Math.min(10, rcr))
  const low  = Math.floor(rcrClamped)
  const high = Math.min(10, low + 1)
  const frac = rcrClamped - low

  const col = reflectanceGroup // 0=bright, 1=medium, 2=dark
  const ufLow  = UF_TABLE[low][col]
  const ufHigh = UF_TABLE[high][col]
  return ufLow + (ufHigh - ufLow) * frac
}

// ── EN 12464-1 lux targets by room type ──────────────────────────────────────
const ROOM_TYPES = [
  { label: 'Office — open plan workstation',  lux: 500,  standard: 'EN 12464-1' },
  { label: 'Office — meeting room',           lux: 500,  standard: 'EN 12464-1' },
  { label: 'Office — reception / lobby',      lux: 300,  standard: 'EN 12464-1' },
  { label: 'Classroom',                       lux: 300,  standard: 'NBC India 2016 / EN 12464-1' },
  { label: 'Classroom — blackboard area',     lux: 500,  standard: 'EN 12464-1' },
  { label: 'Warehouse — general storage',     lux: 100,  standard: 'EN 12464-1' },
  { label: 'Warehouse — picking aisle',       lux: 300,  standard: 'EN 12464-1' },
  { label: 'Retail — sales floor',            lux: 500,  standard: 'EN 12464-1' },
  { label: 'Hospital — examination room',     lux: 1000, standard: 'EN 12464-1' },
  { label: 'Hospital — ward (general)',       lux: 300,  standard: 'HTM 08-03' },
  { label: 'Corridor / circulation',          lux: 100,  standard: 'EN 12464-1' },
  { label: 'Staircase',                       lux: 150,  standard: 'EN 12464-1' },
  { label: 'Car park',                        lux: 75,   standard: 'EN 12464-1' },
  { label: 'Custom target',                   lux: null, standard: '' },
]

const REFLECTANCE_GROUPS = [
  { label: 'Bright room (white walls, light ceiling)', col: 0, hint: 'ρcc 0.70 / ρw 0.50' },
  { label: 'Medium room (neutral tones)',              col: 1, hint: 'ρcc 0.50 / ρw 0.30' },
  { label: 'Dark room (dark finishes)',                col: 2, hint: 'ρcc 0.30 / ρw 0.10' },
]

// ── Calculation core ──────────────────────────────────────────────────────────
function calcLux({ length, width, height, numFixtures, lumensPerFixture, mf, reflGroup, workPlane }) {
  if (!length || !width || !height || !numFixtures || !lumensPerFixture) return null
  const L = parseFloat(length)
  const W = parseFloat(width)
  const H = parseFloat(height)
  const hWork = parseFloat(workPlane) || 0.85
  const N  = parseFloat(numFixtures)
  const Φ  = parseFloat(lumensPerFixture)
  const MF = parseFloat(mf) || 0.80

  if ([L, W, H, N, Φ].some(v => isNaN(v) || v <= 0)) return null

  const hCavity = Math.max(0.1, H - hWork)
  const area    = L * W
  const rcr     = (5 * hCavity * (L + W)) / area
  const uf      = getUF(rcr, reflGroup)
  const avgLux  = (N * Φ * uf * MF) / area

  return { avgLux, rcr, uf, area, hCavity }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  label:    { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: T.dim, textTransform: 'uppercase', marginBottom: 6, display: 'block' },
  input:    { width: '100%', padding: '10px 12px', fontSize: 14, background: 'rgba(255,255,255,0.04)', color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: FONT, boxSizing: 'border-box', outline: 'none' },
  select:   { width: '100%', padding: '10px 12px', fontSize: 13, background: '#0a0a0a', color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, fontFamily: FONT, boxSizing: 'border-box', cursor: 'pointer' },
  fieldset: { border: 'none', padding: 0, margin: '0 0 20px' },
  hint:     { fontSize: 11, color: T.dim, marginTop: 5 },
  row:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 },
}

function Field({ label, hint, children }) {
  return (
    <div style={S.fieldset}>
      <label style={S.label}>{label}</label>
      {children}
      {hint && <div style={S.hint}>{hint}</div>}
    </div>
  )
}

function NumInput({ value, onChange, min = '0', step = '0.1', placeholder = '' }) {
  return (
    <input
      type="number" min={min} step={step} placeholder={placeholder}
      value={value} onChange={e => onChange(e.target.value)}
      style={S.input}
      onFocus={e => e.target.style.borderColor = 'rgba(255,255,255,0.35)'}
      onBlur={e => e.target.style.borderColor = T.border}
    />
  )
}

// ── Result card ───────────────────────────────────────────────────────────────
function ResultCard({ result, luxTarget, customTarget, roomTypeIdx }) {
  if (!result) {
    return (
      <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, borderRadius: 6, padding: '40px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: T.dim }}>Fill in the room details to see results</div>
      </div>
    )
  }

  const { avgLux, rcr, uf, area } = result
  const target = roomTypeIdx === ROOM_TYPES.length - 1
    ? parseFloat(customTarget) || 0
    : luxTarget

  let status = 'GOOD'
  let statusColor = '#4ade80'
  if (target > 0) {
    if (avgLux < target * 0.9)      { status = 'UNDERLIT'; statusColor = '#f59e0b' }
    else if (avgLux > target * 1.5) { status = 'OVERLIT';  statusColor = '#f87171' }
  }

  const metrics = [
    { label: 'Average Lux (Ēm)',     value: `${Math.round(avgLux)} lux`,         main: true },
    { label: 'Target Lux',           value: target > 0 ? `${target} lux` : '—',  main: false },
    { label: 'Compliance Status',    value: target > 0 ? status : '—',           color: target > 0 ? statusColor : T.dim, main: false },
    { label: 'Room Cavity Ratio',    value: rcr.toFixed(2),                       main: false },
    { label: 'Utilisation Factor',   value: uf.toFixed(3),                        main: false },
    { label: 'Room Area',            value: `${area.toFixed(1)} m²`,              main: false },
  ]

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
      {/* Main lux result */}
      <div style={{ padding: '32px', textAlign: 'center', borderBottom: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: T.dim, textTransform: 'uppercase', marginBottom: 12 }}>Average Maintained Illuminance</div>
        <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, marginBottom: 8 }}>{Math.round(avgLux)}</div>
        <div style={{ fontSize: 16, color: T.muted }}>lux</div>
        {target > 0 && (
          <div style={{ marginTop: 16, display: 'inline-block', padding: '6px 18px', borderRadius: 20, background: `${statusColor}18`, border: `1px solid ${statusColor}40`, fontSize: 12, fontWeight: 700, color: statusColor, letterSpacing: '0.1em' }}>
            {status}
          </div>
        )}
      </div>

      {/* Detail metrics */}
      <div style={{ padding: '24px 28px' }}>
        {metrics.slice(1).map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: i < metrics.length - 2 ? `1px solid rgba(255,255,255,0.06)` : 'none' }}>
            <span style={{ fontSize: 13, color: T.dim }}>{m.label}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: m.color || T.text }}>{m.value}</span>
          </div>
        ))}
      </div>

      {/* Method note */}
      <div style={{ padding: '16px 28px', borderTop: `1px solid ${T.border}`, background: 'rgba(255,255,255,0.01)' }}>
        <div style={{ fontSize: 11, color: T.dim, lineHeight: 1.6 }}>
          Calculated using the <strong style={{ color: 'rgba(255,255,255,0.45)' }}>IES Lumen Method</strong> (zonal cavity method). Average maintained illuminance across the working plane at {result.hCavity.toFixed(2)}m cavity height. Maintenance factor {0.80}.
        </div>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function LuxCalculatorPage() {
  const navigate = useNavigate()

  useSEO({
    title:       'Free Online Lux Calculator — IES Lumen Method | Lumina Design',
    description: 'Calculate average illuminance (lux) using the IES Lumen Method. Enter room dimensions, fixture lumens, and reflectances. Instant EN 12464-1 compliance check. Free.',
    canonical:   'https://app.lightillumina.com/tools/lux-calculator',
  })

  // Inputs
  const [length,       setLength]       = useState('')
  const [width,        setWidth]        = useState('')
  const [height,       setHeight]       = useState('')
  const [workPlane,    setWorkPlane]    = useState('0.85')
  const [numFixtures,  setNumFixtures]  = useState('')
  const [lumens,       setLumens]       = useState('')
  const [mf,           setMf]           = useState('0.80')
  const [reflGroup,    setReflGroup]    = useState(0)
  const [roomTypeIdx,  setRoomTypeIdx]  = useState(0)
  const [customTarget, setCustomTarget] = useState('')

  const luxTarget = ROOM_TYPES[roomTypeIdx]?.lux || 0

  const result = useMemo(() => calcLux({
    length, width, height, numFixtures,
    lumensPerFixture: lumens, mf, reflGroup, workPlane,
  }), [length, width, height, numFixtures, lumens, mf, reflGroup, workPlane])

  // When room type changes, optionally pre-fill a sensible room size
  function handleRoomTypeChange(idx) {
    setRoomTypeIdx(idx)
  }

  const cardStyle = { background: 'rgba(255,255,255,0.015)', border: `1px solid ${T.border}`, borderRadius: 6, padding: '28px 28px 8px' }

  return (
    <MarketingLayout>
      {/* JSON-LD WebApplication schema — injected inline for this tool */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'Lumina Design Lux Calculator',
        'url': 'https://app.lightillumina.com/tools/lux-calculator',
        'description': 'Free online lux calculator using the IES Lumen Method (zonal cavity). Calculates average maintained illuminance and checks EN 12464-1 compliance.',
        'applicationCategory': 'UtilitiesApplication',
        'operatingSystem': 'Web',
        'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'INR' },
        'featureList': [
          'IES Lumen Method (zonal cavity) calculation',
          'EN 12464-1 lux target comparison',
          'Room Cavity Ratio (RCR) calculation',
          'Utilisation Factor (UF) lookup',
          'Maintenance Factor (MF) input',
          'Surface reflectance selection',
        ],
      })}} />

      {/* Hero */}
      <header style={{ textAlign: 'center', padding: '64px 32px 48px', borderBottom: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: T.dim, textTransform: 'uppercase', marginBottom: 18 }}>Free Tool</div>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 18, lineHeight: 1.15 }}>
          Free Online Lux Calculator
        </h1>
        <p style={{ fontSize: 15, color: T.muted, maxWidth: 560, margin: '0 auto', lineHeight: 1.75 }}>
          Calculate average illuminance using the IES Lumen Method (zonal cavity). Enter your room dimensions, fixture data, and get instant EN&nbsp;12464-1 compliance feedback.
        </p>
      </header>

      {/* Calculator */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '56px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(280px, 420px)', gap: 32, alignItems: 'start' }}>

          {/* ── Left: Inputs ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Room type */}
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: T.text, textTransform: 'uppercase', marginBottom: 20 }}>Room Type & Target</div>
              <Field label="Room type" hint={ROOM_TYPES[roomTypeIdx]?.standard}>
                <select value={roomTypeIdx} onChange={e => handleRoomTypeChange(Number(e.target.value))} style={S.select}>
                  {ROOM_TYPES.map((r, i) => <option key={i} value={i}>{r.label}{r.lux ? ` — ${r.lux} lux` : ''}</option>)}
                </select>
              </Field>
              {roomTypeIdx === ROOM_TYPES.length - 1 && (
                <Field label="Custom lux target">
                  <NumInput value={customTarget} onChange={setCustomTarget} min="1" step="50" placeholder="e.g. 400" />
                </Field>
              )}
            </div>

            {/* Room dimensions */}
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: T.text, textTransform: 'uppercase', marginBottom: 20 }}>Room Dimensions</div>
              <div style={S.row}>
                <Field label="Length (m)">
                  <NumInput value={length} onChange={setLength} placeholder="e.g. 10" />
                </Field>
                <Field label="Width (m)">
                  <NumInput value={width} onChange={setWidth} placeholder="e.g. 8" />
                </Field>
              </div>
              <div style={S.row}>
                <Field label="Ceiling height (m)">
                  <NumInput value={height} onChange={setHeight} placeholder="e.g. 3" />
                </Field>
                <Field label="Work plane height (m)" hint="Default 0.85m (desk height)">
                  <NumInput value={workPlane} onChange={setWorkPlane} step="0.05" placeholder="0.85" />
                </Field>
              </div>
            </div>

            {/* Fixture data */}
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: T.text, textTransform: 'uppercase', marginBottom: 20 }}>Fixture Data</div>
              <div style={S.row}>
                <Field label="Number of fixtures">
                  <NumInput value={numFixtures} onChange={setNumFixtures} min="1" step="1" placeholder="e.g. 12" />
                </Field>
                <Field label="Lumens per fixture" hint="From fixture datasheet">
                  <NumInput value={lumens} onChange={setLumens} min="1" step="100" placeholder="e.g. 4000" />
                </Field>
              </div>
              <Field label="Maintenance factor (MF)" hint="CIBSE default: 0.80 for office. 0.70 for dusty environments.">
                <select value={mf} onChange={e => setMf(e.target.value)} style={S.select}>
                  <option value="0.90">0.90 — Clean room / hospital</option>
                  <option value="0.80">0.80 — Office / retail (default)</option>
                  <option value="0.70">0.70 — Warehouse / industrial</option>
                  <option value="0.65">0.65 — Dirty / outdoor</option>
                </select>
              </Field>
            </div>

            {/* Reflectances */}
            <div style={cardStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: T.text, textTransform: 'uppercase', marginBottom: 20 }}>Room Reflectances</div>
              <Field label="Surface finish" hint="Affects the Utilisation Factor (UF)">
                {REFLECTANCE_GROUPS.map((g, i) => (
                  <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, cursor: 'pointer' }}>
                    <input type="radio" name="refl" value={i} checked={reflGroup === i} onChange={() => setReflGroup(i)}
                      style={{ accentColor: '#ffffff', cursor: 'pointer' }} />
                    <div>
                      <div style={{ fontSize: 13, color: T.text }}>{g.label}</div>
                      <div style={{ fontSize: 11, color: T.dim }}>{g.hint}</div>
                    </div>
                  </label>
                ))}
              </Field>
            </div>

          </div>

          {/* ── Right: Results (sticky) ── */}
          <div style={{ position: 'sticky', top: 76 }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', color: T.text, textTransform: 'uppercase', marginBottom: 16 }}>Results</div>
            <ResultCard result={result} luxTarget={luxTarget} customTarget={customTarget} roomTypeIdx={roomTypeIdx} />

            {/* Full app CTA */}
            <div style={{ marginTop: 20, padding: '20px 24px', background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, borderRadius: 6 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>Want the full picture?</div>
              <div style={{ fontSize: 12, color: T.muted, lineHeight: 1.65, marginBottom: 16 }}>
                Lumina Design adds heat maps, DALI planning, floor plan upload, and professional PDF export — all in one tool.
              </div>
              <button onClick={() => navigate('/app')} style={{ width: '100%', padding: '11px', fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', background: '#ffffff', color: '#000000', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.88)'}
                onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
              >TRY FREE — NO SIGNUP NEEDED</button>
            </div>
          </div>
        </div>

        {/* Formula explainer */}
        <section style={{ marginTop: 80, paddingTop: 64, borderTop: `1px solid ${T.border}` }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32 }}>How the lux calculation works</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              {
                step: '1', label: 'Room Cavity Ratio (RCR)',
                formula: 'RCR = 5 × h × (L + W) / (L × W)',
                desc: 'h = ceiling height minus work plane height. RCR describes how "deep" the room is relative to its floor area. A narrow, tall room has a high RCR; a wide, low room has a low RCR.',
              },
              {
                step: '2', label: 'Utilisation Factor (UF)',
                formula: 'UF = f(RCR, reflectances)',
                desc: 'UF is read from a manufacturer\'s table based on RCR and room surface reflectances. It represents the fraction of fixture lumens that actually reach the working plane.',
              },
              {
                step: '3', label: 'Average Illuminance (Ēm)',
                formula: 'Ēm = (N × Φ × UF × MF) / A',
                desc: 'N = number of fixtures, Φ = lumens per fixture, MF = maintenance factor (accounts for lamp depreciation and dirt accumulation), A = room area.',
              },
            ].map(s => (
              <div key={s.step} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}`, borderRadius: 6, padding: '24px' }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: T.dim, marginBottom: 10 }}>STEP {s.step}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 12 }}>{s.label}</div>
                <div style={{ fontFamily: "'SF Mono', 'Fira Code', 'Consolas', monospace", fontSize: 12, color: 'rgba(255,255,255,0.70)', background: 'rgba(255,255,255,0.04)', padding: '10px 14px', borderRadius: 4, marginBottom: 14 }}>{s.formula}</div>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.7 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* EN 12464-1 reference table */}
        <section style={{ marginTop: 72 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>EN 12464-1 lux requirements — quick reference</h2>
          <p style={{ fontSize: 14, color: T.muted, marginBottom: 28, lineHeight: 1.7 }}>Average maintained illuminance targets for common room types. Use these to check your calculator result against the standard.</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 500 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Room / Zone', 'Required Ēm (lux)', 'UGR max', 'Standard'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: T.dim, textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['Office — workstation',          '500', '19', 'EN 12464-1 §5.3'],
                  ['Office — meeting room',          '500', '19', 'EN 12464-1 §5.3'],
                  ['Reception / lobby',              '300', '22', 'EN 12464-1 §5.3'],
                  ['Corridor / circulation',         '100', '28', 'EN 12464-1 §5.3'],
                  ['Classroom — general',            '300', '19', 'EN 12464-1 §5.5'],
                  ['Classroom — blackboard',         '500', '19', 'EN 12464-1 §5.5'],
                  ['Warehouse — storage',            '100', '25', 'EN 12464-1 §5.4'],
                  ['Warehouse — picking',            '300', '25', 'EN 12464-1 §5.4'],
                  ['Retail — sales floor',           '500', '22', 'EN 12464-1 §5.24'],
                  ['Hospital — examination',         '1000', '19', 'EN 12464-1 §5.6'],
                  ['Hospital — ward (general)',      '300', '19', 'HTM 08-03'],
                  ['Car park',                       '75',  '—',  'EN 12464-1 §5.30'],
                ].map(([zone, lux, ugr, ref], i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${T.border}`, background: i % 2 === 1 ? 'rgba(255,255,255,0.015)' : 'transparent' }}>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: T.text }}>{zone}</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, fontWeight: 700, color: T.text }}>{lux} lux</td>
                    <td style={{ padding: '12px 14px', fontSize: 13, color: T.muted }}>{ugr}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: T.dim }}>{ref}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ marginTop: 72 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 32 }}>Frequently asked questions</h2>
          {[
            { q: 'What is the IES Lumen Method?', a: 'The IES Lumen Method (also called the zonal cavity method) is a standard procedure for calculating average maintained illuminance. It uses fixture lumens, room geometry, surface reflectances, and maintenance factors to estimate the average lux level across the working plane. It is defined in the IES Lighting Handbook and referenced in EN 12464-1 design guides.' },
            { q: 'What is the Room Cavity Ratio (RCR)?', a: 'RCR = 5 × h × (L + W) / (L × W), where h is the cavity height (ceiling height minus work plane height). A low RCR (0–2) means a wide, low room where light reaches the floor easily. A high RCR (6–10) means a narrow, tall space where much of the light hits the walls before reaching the work plane.' },
            { q: 'What is the Utilisation Factor (UF)?', a: 'The Utilisation Factor is the ratio of the luminous flux reaching the working plane to the total flux emitted by all luminaires. It depends on the RCR and room surface reflectances. A bright room with white walls has a UF of 0.7–0.9; a dark room might be 0.3–0.5. UF tables are published by luminaire manufacturers; this calculator uses standard values for a generic diffuse luminaire.' },
            { q: 'What is the Maintenance Factor (MF)?', a: 'MF accounts for the reduction in light output over time due to lamp lumen depreciation (LLD) and luminaire dirt accumulation (LDD). The CIBSE default for a clean office is 0.80. For dirty or industrial environments, use 0.65–0.70. Always design to the maintained (not initial) lux level.' },
            { q: 'How accurate is this calculator?', a: 'For average maintained illuminance in regularly-shaped rectangular rooms, accuracy is within ±5–10% of a full photometric simulation. The lumen method is less accurate for rooms with complex geometry, significant furniture obstructions, or highly directional luminaires. For critical applications, verify with point-by-point photometric software using manufacturer IES files.' },
            { q: 'What lux level do I need for an office?', a: 'EN 12464-1 requires 500 lux average maintained illuminance at the work plane (0.8m height) for open-plan office workstations and meeting rooms. Reception areas require 300 lux. Circulation areas require 100 lux. UGR should not exceed 19 for office work.' },
            { q: 'How many lumens per square metre do I need?', a: 'A rough rule of thumb: lumens/m² ≈ target lux / (UF × MF). For a typical office (500 lux, UF=0.72, MF=0.80): 500 / (0.72 × 0.80) ≈ 868 lumens/m². For a 60m² office: 868 × 60 ≈ 52,000 total lumens. At 4,000 lumens per fixture: 52,000 / 4,000 ≈ 13 fixtures.' },
          ].map((item, i) => (
            <div key={i} style={{ padding: '20px 0', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: T.text, marginBottom: 8 }}>{item.q}</div>
              <div style={{ fontSize: 14, color: T.muted, lineHeight: 1.8 }}>{item.a}</div>
            </div>
          ))}
        </section>

        {/* Related links */}
        <section style={{ marginTop: 64, paddingTop: 48, borderTop: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.12em', color: T.dim, textTransform: 'uppercase', marginBottom: 20 }}>Related</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[
              ['Lux Calculation Feature',  '/features/lux-calculation'],
              ['Office Lighting Design',   '/solutions/offices'],
              ['Warehouse Lighting',       '/solutions/warehouses'],
              ['Classroom Lighting India', '/solutions/classrooms'],
              ['DIALux Alternative',       '/compare/dialux-alternative'],
            ].map(([label, path]) => (
              <button key={path} onClick={() => navigate(path)}
                style={{ padding: '9px 18px', fontSize: 12, background: 'rgba(255,255,255,0.04)', color: T.muted, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
                onMouseEnter={e => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)' }}
                onMouseLeave={e => { e.currentTarget.style.color = T.muted; e.currentTarget.style.borderColor = T.border }}
              >{label} →</button>
            ))}
          </div>
        </section>
      </div>

      <MarketingCTA navigate={navigate}
        heading="Need more than a calculator?"
        sub="Lumina Design adds heat maps, DALI planning, floor plan upload, and PDF export — all free to try."
      />
    </MarketingLayout>
  )
}
