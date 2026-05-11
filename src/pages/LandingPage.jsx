import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', Helvetica, Arial, sans-serif"
const MONO = "'SF Mono', 'Fira Code', 'Consolas', monospace"

const T = {
  bg:         '#000000',
  text:       '#ffffff',
  muted:      'rgba(255,255,255,0.55)',
  dim:        'rgba(255,255,255,0.28)',
  border:     'rgba(255,255,255,0.10)',
  btnGray:    'rgba(255,255,255,0.10)',
  btnGrayHov: 'rgba(255,255,255,0.16)',
  panelBg:    'rgba(255,255,255,0.03)',
}

const NAV_LINKS = [
  { label: 'HOME',         path: '/' },
  { label: 'FEATURES',     path: '/features' },
  { label: 'HOW IT WORKS', path: '/features#how' },
  { label: 'PRICING',      path: '/pricing' },
  { label: 'CONTACT',      path: '/contact' },
]

// ─────────────────────────────────────────────────────────────────
// SVG DIAGRAMS
// ─────────────────────────────────────────────────────────────────

/** Beam-angle technical diagram — hero right panel */
function BeamDiagram() {
  // Geometry: 36° total beam angle (18° half-angle)
  // Fixture apex at (200, 46), floor at y=370
  const cx = 200, apexY = 46, floorY = 370
  const h = floorY - apexY                       // 324
  const halfSpread = Math.round(h * Math.tan(18 * Math.PI / 180))  // ≈105
  const lx = cx - halfSpread, rx = cx + halfSpread  // 95, 305

  // Arc endpoints at radius 72 from apex
  const r = 72
  const arcLx = cx - Math.round(r * Math.sin(18 * Math.PI / 180))  // 178
  const arcLy = apexY + Math.round(r * Math.cos(18 * Math.PI / 180))  // 114
  const arcRx = cx + Math.round(r * Math.sin(18 * Math.PI / 180))  // 222
  const arcRy = arcLy

  return (
    <svg viewBox="0 0 400 420" width="100%" style={{ maxWidth: 400, display: 'block' }} aria-label="Beam angle diagram">
      <defs>
        {/* Cone fill gradient */}
        <radialGradient id="beamGrad" cx="50%" cy="5%" r="90%" fx="50%" fy="5%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.14" />
          <stop offset="45%"  stopColor="#ffffff" stopOpacity="0.07" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00" />
        </radialGradient>
        {/* Floor lux hotspot */}
        <radialGradient id="floorGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.00" />
        </radialGradient>
        <marker id="arrowU" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M3,6 L0,2 L6,2 Z" fill="rgba(255,255,255,0.35)" />
        </marker>
        <marker id="arrowD" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
          <path d="M3,0 L0,4 L6,4 Z" fill="rgba(255,255,255,0.35)" />
        </marker>
      </defs>

      {/* ── Ceiling dotted grid ── */}
      {[40,80,120,160,200,240,280,320,360].map(x => (
        [8,16].map(y => <circle key={`${x}-${y}`} cx={x} cy={y} r={1.2} fill="rgba(255,255,255,0.12)" />)
      ))}

      {/* ── Ceiling line ── */}
      <line x1={0} y1={30} x2={400} y2={30} stroke="rgba(255,255,255,0.18)" strokeWidth={1} />

      {/* ── Fixture housing ── */}
      <rect x={172} y={14} width={56} height={16} rx={3}
        fill="#111" stroke="rgba(255,255,255,0.55)" strokeWidth={1} />
      {/* LED strip inside fixture */}
      <rect x={180} y={19} width={40} height={5} rx={1}
        fill="rgba(255,255,255,0.30)" />
      {/* Fixture label */}
      <text x={200} y={10} textAnchor="middle" fontSize={7.5} fill="rgba(255,255,255,0.38)" fontFamily={MONO} letterSpacing="0.1em">DOWNLIGHT 12W</text>

      {/* ── Beam cone fill ── */}
      <polygon points={`${cx},${apexY} ${lx},${floorY} ${rx},${floorY}`}
        fill="url(#beamGrad)" />

      {/* ── Cone edge lines (dashed) ── */}
      <line x1={cx} y1={apexY} x2={lx} y2={floorY}
        stroke="rgba(255,255,255,0.30)" strokeWidth={1} strokeDasharray="5 4" />
      <line x1={cx} y1={apexY} x2={rx} y2={floorY}
        stroke="rgba(255,255,255,0.30)" strokeWidth={1} strokeDasharray="5 4" />
      {/* Center axis (nadir) */}
      <line x1={cx} y1={apexY} x2={cx} y2={floorY}
        stroke="rgba(255,255,255,0.12)" strokeWidth={1} strokeDasharray="3 5" />

      {/* ── Angle arc + label ── */}
      <path d={`M ${arcLx} ${arcLy} A ${r} ${r} 0 0 1 ${arcRx} ${arcRy}`}
        fill="none" stroke="rgba(255,255,255,0.50)" strokeWidth={1} />
      {/* Left angle tick */}
      <line x1={cx} y1={apexY} x2={arcLx} y2={arcLy}
        stroke="rgba(255,255,255,0.28)" strokeWidth={0.8} />
      <line x1={cx} y1={apexY} x2={arcRx} y2={arcRy}
        stroke="rgba(255,255,255,0.28)" strokeWidth={0.8} />
      <text x={cx} y={arcLy + 18} textAnchor="middle" fontSize={10} fontWeight="600"
        fill="rgba(255,255,255,0.80)" fontFamily={MONO}>36°</text>

      {/* ── Floor lux hotspot ── */}
      <ellipse cx={cx} cy={floorY} rx={halfSpread * 0.55} ry={8}
        fill="url(#floorGrad)" />

      {/* ── Floor line ── */}
      <line x1={20} y1={floorY} x2={380} y2={floorY}
        stroke="rgba(255,255,255,0.22)" strokeWidth={1} />
      {/* Floor hatch marks */}
      {[40, 100, 160, 240, 300, 360].map(x => (
        <line key={x} x1={x} y1={floorY} x2={x - 8} y2={floorY + 8}
          stroke="rgba(255,255,255,0.10)" strokeWidth={1} />
      ))}

      {/* ── Lux value labels on floor ── */}
      <text x={cx} y={floorY - 8} textAnchor="middle" fontSize={10} fontWeight="700"
        fill="rgba(255,255,255,0.90)" fontFamily={MONO}>850 lx</text>
      <text x={cx - 60} y={floorY - 20} textAnchor="middle" fontSize={9}
        fill="rgba(255,255,255,0.55)" fontFamily={MONO}>480 lx</text>
      <text x={cx + 60} y={floorY - 20} textAnchor="middle" fontSize={9}
        fill="rgba(255,255,255,0.55)" fontFamily={MONO}>480 lx</text>
      <text x={lx - 8} y={floorY - 10} textAnchor="end" fontSize={8}
        fill="rgba(255,255,255,0.30)" fontFamily={MONO}>120 lx</text>
      <text x={rx + 8} y={floorY - 10} textAnchor="start" fontSize={8}
        fill="rgba(255,255,255,0.30)" fontFamily={MONO}>120 lx</text>

      {/* ── Height dimension (left side) ── */}
      <line x1={52} y1={30} x2={52} y2={floorY}
        stroke="rgba(255,255,255,0.20)" strokeWidth={0.8} strokeDasharray="3 4"
        markerStart="url(#arrowU)" markerEnd="url(#arrowD)" />
      <text x={44} y={210} textAnchor="middle" fontSize={8.5}
        fill="rgba(255,255,255,0.40)" fontFamily={MONO}
        transform="rotate(-90, 44, 210)">4.0 m</text>

      {/* ── Span dimension (bottom) ── */}
      <line x1={lx} y1={floorY + 18} x2={rx} y2={floorY + 18}
        stroke="rgba(255,255,255,0.20)" strokeWidth={0.8} />
      <line x1={lx} y1={floorY + 13} x2={lx} y2={floorY + 23}
        stroke="rgba(255,255,255,0.20)" strokeWidth={0.8} />
      <line x1={rx} y1={floorY + 13} x2={rx} y2={floorY + 23}
        stroke="rgba(255,255,255,0.20)" strokeWidth={0.8} />
      <text x={cx} y={floorY + 32} textAnchor="middle" fontSize={8.5}
        fill="rgba(255,255,255,0.38)" fontFamily={MONO}>2.1 m spread</text>

      {/* ── Maintenance factor note ── */}
      <text x={330} y={260} textAnchor="end" fontSize={7.5}
        fill="rgba(255,255,255,0.22)" fontFamily={MONO}>MF = 0.80</text>
      <text x={330} y={272} textAnchor="end" fontSize={7.5}
        fill="rgba(255,255,255,0.22)" fontFamily={MONO}>EN 12464-1</text>

      {/* ── Corner label ── */}
      <rect x={8} y={380} width={84} height={16} rx={2} fill="rgba(255,255,255,0.05)" />
      <text x={16} y={391} fontSize={7.5} fill="rgba(255,255,255,0.40)" fontFamily={MONO} letterSpacing="0.06em">
        BEAM ANALYSIS
      </text>
    </svg>
  )
}

/** DALI topology diagram */
function DaliTopology() {
  const nodes = [32, 92, 152, 212, 272]
  const busY = 78, dropY = 110, circleY = 130

  return (
    <svg viewBox="0 0 304 190" width="100%" style={{ maxWidth: 304, display: 'block' }} aria-label="DALI topology diagram">
      {/* Controller box */}
      <rect x={102} y={8} width={100} height={34} rx={4}
        fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      <text x={152} y={23} textAnchor="middle" fontSize={7.5} fontWeight="700"
        fill="rgba(255,255,255,0.90)" fontFamily={MONO} letterSpacing="0.1em">CONTROLLER</text>
      <text x={152} y={34} textAnchor="middle" fontSize={6.5}
        fill="rgba(255,255,255,0.40)" fontFamily={MONO} letterSpacing="0.08em">DALI MASTER</text>

      {/* Drop from controller to bus */}
      <line x1={152} y1={42} x2={152} y2={busY}
        stroke="rgba(255,255,255,0.35)" strokeWidth={1} />

      {/* Main bus line */}
      <line x1={nodes[0]} y1={busY} x2={nodes[4]} y2={busY}
        stroke="rgba(255,255,255,0.50)" strokeWidth={1.5} />

      {/* Bus label */}
      <text x={152} y={busY - 6} textAnchor="middle" fontSize={6.5}
        fill="rgba(255,255,255,0.35)" fontFamily={MONO} letterSpacing="0.1em">DALI 2.0 BUS</text>

      {/* Nodes */}
      {nodes.map((x, i) => (
        <g key={i}>
          {/* Drop line */}
          <line x1={x} y1={busY} x2={x} y2={dropY}
            stroke="rgba(255,255,255,0.30)" strokeWidth={1} />
          {/* Fixture circle */}
          <circle cx={x} cy={circleY} r={13}
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.40)" strokeWidth={1} />
          {/* Fixture dot (light source) */}
          <circle cx={x} cy={circleY} r={3}
            fill="rgba(255,255,255,0.70)" />
          {/* Light rays (tiny) */}
          {[-20, 0, 20].map(angle => {
            const rad = (angle + 90) * Math.PI / 180
            return (
              <line key={angle}
                x1={x + 4 * Math.cos(rad)} y1={circleY + 4 * Math.sin(rad)}
                x2={x + 10 * Math.cos(rad)} y2={circleY + 10 * Math.sin(rad)}
                stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
            )
          })}
          {/* Address label */}
          <text x={x} y={circleY + 25} textAnchor="middle" fontSize={7}
            fill="rgba(255,255,255,0.40)" fontFamily={MONO}>0{i + 1}</text>
        </g>
      ))}

      {/* Capacity badge */}
      <rect x={210} y={158} width={86} height={22} rx={2}
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.14)" strokeWidth={0.8} />
      <text x={253} y={168} textAnchor="middle" fontSize={7} fontWeight="700"
        fill="rgba(255,255,255,0.60)" fontFamily={MONO} letterSpacing="0.08em">64 NODES MAX</text>
      <text x={253} y={177} textAnchor="middle" fontSize={6.5}
        fill="rgba(255,255,255,0.30)" fontFamily={MONO}>per bus segment</text>
    </svg>
  )
}

/** Real-time lux heatmap visualization */
function LuxHeatmap() {
  const values = [
    [80,  160, 220, 160, 80 ],
    [160, 380, 640, 380, 160],
    [220, 640, 850, 640, 220],
    [160, 380, 640, 380, 160],
    [80,  160, 220, 160, 80 ],
  ]
  const cellW = 46, cellH = 32, startX = 14, startY = 18
  const maxLux = 850

  function opacity(v) { return (v / maxLux) * 0.60 + 0.02 }
  function textOpacity(v) { return v > 400 ? 0.90 : v > 180 ? 0.65 : 0.35 }

  return (
    <svg viewBox="0 0 274 196" width="100%" style={{ maxWidth: 274, display: 'block' }} aria-label="Lux heatmap">
      {/* Title */}
      <text x={137} y={12} textAnchor="middle" fontSize={7.5}
        fill="rgba(255,255,255,0.35)" fontFamily={MONO} letterSpacing="0.12em">LUX DISTRIBUTION HEATMAP</text>

      {values.map((row, ri) =>
        row.map((val, ci) => {
          const x = startX + ci * cellW
          const y = startY + ri * cellH
          return (
            <g key={`${ri}-${ci}`}>
              <rect x={x} y={y} width={cellW - 1} height={cellH - 1} rx={1}
                fill={`rgba(255,255,255,${opacity(val).toFixed(2)})`}
                stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
              <text x={x + cellW / 2 - 0.5} y={y + cellH / 2 + 4}
                textAnchor="middle" fontSize={8} fontWeight={val === maxLux ? '700' : '400'}
                fill={`rgba(255,255,255,${textOpacity(val)})`} fontFamily={MONO}>
                {val}
              </text>
            </g>
          )
        })
      )}

      {/* Average lux badge */}
      <rect x={14} y={176} width={112} height={16} rx={2}
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth={0.7} />
      <text x={70} y={187} textAnchor="middle" fontSize={7.5}
        fill="rgba(255,255,255,0.55)" fontFamily={MONO}>AVG  396 lx</text>

      {/* Target lux badge */}
      <rect x={134} y={176} width={126} height={16} rx={2}
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.12)" strokeWidth={0.7} />
      <text x={197} y={187} textAnchor="middle" fontSize={7.5}
        fill="rgba(255,255,255,0.55)" fontFamily={MONO}>TARGET  300 lx  ✓</text>

      {/* Scale bar (right side) */}
      <defs>
        <linearGradient id="scaleGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.62)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
        </linearGradient>
      </defs>
      <rect x={258} y={18} width={8} height={158} rx={1} fill="url(#scaleGrad)" />
      <text x={266} y={22}  fontSize={6.5} fill="rgba(255,255,255,0.35)" fontFamily={MONO} textAnchor="start"> 850</text>
      <text x={266} y={176} fontSize={6.5} fill="rgba(255,255,255,0.35)" fontFamily={MONO} textAnchor="start"> 80</text>
    </svg>
  )
}

/** PDF report preview mockup */
function PdfPreview() {
  return (
    <svg viewBox="0 0 280 210" width="100%" style={{ maxWidth: 280, display: 'block' }} aria-label="PDF export preview">
      {/* Shadow */}
      <rect x={60} y={18} width={168} height={184} rx={2} fill="rgba(0,0,0,0.50)" />
      {/* Page */}
      <rect x={54} y={12} width={168} height={184} rx={2}
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.22)" strokeWidth={0.8} />

      {/* Header band */}
      <rect x={54} y={12} width={168} height={32} rx={2}
        fill="rgba(255,255,255,0.08)" />
      <line x1={54} y1={44} x2={222} y2={44} stroke="rgba(255,255,255,0.14)" strokeWidth={0.8} />

      {/* Logo mark in header */}
      <rect x={62} y={20} width={28} height={16} rx={1} fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.25)" strokeWidth={0.5} />
      <text x={76} y={31} textAnchor="middle" fontSize={6} fontWeight="700"
        fill="rgba(255,255,255,0.70)" fontFamily={MONO} letterSpacing="0.12em">LUM</text>

      {/* Report title */}
      <text x={100} y={24} fontSize={7} fontWeight="700"
        fill="rgba(255,255,255,0.80)" fontFamily={MONO} letterSpacing="0.08em">LIGHTING DESIGN REPORT</text>
      <text x={100} y={34} fontSize={6}
        fill="rgba(255,255,255,0.38)" fontFamily={MONO}>Office Floor 2 · Zone A</text>

      {/* Section label */}
      <text x={62} y={56} fontSize={6} fontWeight="700"
        fill="rgba(255,255,255,0.50)" fontFamily={MONO} letterSpacing="0.14em">FIXTURE SCHEDULE</text>

      {/* Table header */}
      <rect x={62} y={60} width={152} height={14} rx={1}
        fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.10)" strokeWidth={0.5} />
      {['TYPE', 'QTY', 'W', 'lm'].map((h, i) => (
        <text key={h} x={70 + i * 36} y={70} fontSize={5.5} fontWeight="700"
          fill="rgba(255,255,255,0.45)" fontFamily={MONO} letterSpacing="0.1em">{h}</text>
      ))}

      {/* Table rows */}
      {[
        ['Downlight', '12', '12W', '900'],
        ['LED Panel', '4',  '36W', '3400'],
        ['Strip LED', '8',  '14W', '1200'],
      ].map((row, i) => (
        <g key={i}>
          <rect x={62} y={74 + i * 14} width={152} height={13} rx={0}
            fill={i % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}
            stroke="rgba(255,255,255,0.06)" strokeWidth={0.5} />
          {row.map((cell, j) => (
            <text key={j} x={70 + j * 36} y={83 + i * 14} fontSize={6}
              fill="rgba(255,255,255,0.45)" fontFamily={MONO}>{cell}</text>
          ))}
        </g>
      ))}

      {/* Lux summary box */}
      <text x={62} y={124} fontSize={6} fontWeight="700"
        fill="rgba(255,255,255,0.50)" fontFamily={MONO} letterSpacing="0.14em">LUX SUMMARY</text>
      <rect x={62} y={128} width={68} height={30} rx={1}
        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth={0.5} />
      <text x={96} y={140} textAnchor="middle" fontSize={11} fontWeight="700"
        fill="rgba(255,255,255,0.80)" fontFamily={MONO}>396</text>
      <text x={96} y={151} textAnchor="middle" fontSize={6}
        fill="rgba(255,255,255,0.35)" fontFamily={MONO}>avg lux</text>
      <rect x={138} y={128} width={76} height={30} rx={1}
        fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.10)" strokeWidth={0.5} />
      <text x={176} y={140} textAnchor="middle" fontSize={8} fontWeight="700"
        fill="rgba(255,255,255,0.60)" fontFamily={MONO}>PASS ✓</text>
      <text x={176} y={151} textAnchor="middle" fontSize={6}
        fill="rgba(255,255,255,0.35)" fontFamily={MONO}>EN 12464-1</text>

      {/* Mini canvas snapshot placeholder */}
      <text x={62} y={172} fontSize={6} fontWeight="700"
        fill="rgba(255,255,255,0.50)" fontFamily={MONO} letterSpacing="0.14em">FLOOR PLAN</text>
      <rect x={62} y={176} width={152} height={12} rx={1}
        fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.08)" strokeWidth={0.5} />
      {/* Room outline mini */}
      {[0,1,2,3].map(i => (
        <rect key={i} x={70 + i * 34} y={178} width={28} height={8} rx={0.5}
          fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={0.5} />
      ))}

      {/* Page number */}
      <text x={138} y={200} textAnchor="middle" fontSize={6}
        fill="rgba(255,255,255,0.20)" fontFamily={MONO}>Page 1 of 4</text>

      {/* A4 label badge */}
      <rect x={4} y={12} width={40} height={16} rx={2}
        fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.18)" strokeWidth={0.8} />
      <text x={24} y={23} textAnchor="middle" fontSize={7} fontWeight="700"
        fill="rgba(255,255,255,0.60)" fontFamily={MONO} letterSpacing="0.1em">A4 PDF</text>
    </svg>
  )
}

/** Stat icons — 4 unique SVGs */
function IconUsers() {
  return (
    <svg viewBox="0 0 40 32" width={40} height={32} aria-hidden="true">
      {/* Person 1 */}
      <circle cx={14} cy={9} r={5} fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.2} />
      <path d="M4,28 C4,20 24,20 24,28" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth={1.2} strokeLinecap="round" />
      {/* Person 2 (overlapping) */}
      <circle cx={26} cy={9} r={5} fill="#000" stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} />
      <path d="M16,28 C16,20 36,20 36,28" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  )
}

function IconProjects() {
  return (
    <svg viewBox="0 0 40 32" width={40} height={32} aria-hidden="true">
      {/* Stack of documents */}
      <rect x={16} y={2}  width={20} height={24} rx={1.5} fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.25)" strokeWidth={1} />
      <rect x={10} y={5}  width={20} height={24} rx={1.5} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.35)" strokeWidth={1} />
      <rect x={4}  y={8}  width={20} height={22} rx={1.5} fill="#000" stroke="rgba(255,255,255,0.55)" strokeWidth={1.2} />
      {/* Lines on front doc */}
      <line x1={8}  y1={14} x2={20} y2={14} stroke="rgba(255,255,255,0.35)" strokeWidth={0.8} />
      <line x1={8}  y1={18} x2={20} y2={18} stroke="rgba(255,255,255,0.25)" strokeWidth={0.8} />
      <line x1={8}  y1={22} x2={16} y2={22} stroke="rgba(255,255,255,0.20)" strokeWidth={0.8} />
    </svg>
  )
}

function IconUptime() {
  return (
    <svg viewBox="0 0 40 32" width={40} height={32} aria-hidden="true">
      {/* Shield */}
      <path d="M20,2 L34,8 L34,19 C34,26 20,30 20,30 C20,30 6,26 6,19 L6,8 Z"
        fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.50)" strokeWidth={1.2} />
      {/* Check mark */}
      <path d="M13,16 L18,21 L27,11"
        fill="none" stroke="rgba(255,255,255,0.80)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg viewBox="0 0 40 32" width={40} height={32} aria-hidden="true">
      {/* Clock circle */}
      <circle cx={20} cy={16} r={12} fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.55)" strokeWidth={1.2} />
      {/* Hour hand */}
      <line x1={20} y1={16} x2={20} y2={8}  stroke="rgba(255,255,255,0.80)" strokeWidth={1.5} strokeLinecap="round" />
      {/* Minute hand */}
      <line x1={20} y1={16} x2={26} y2={16} stroke="rgba(255,255,255,0.80)" strokeWidth={1.5} strokeLinecap="round" />
      {/* Center dot */}
      <circle cx={20} cy={16} r={1.5} fill="rgba(255,255,255,0.80)" />
      {/* Hour ticks */}
      {[0,3,6,9].map(h => {
        const a = h * 30 * Math.PI / 180
        return <line key={h}
          x1={20 + 10 * Math.sin(a)} y1={16 - 10 * Math.cos(a)}
          x2={20 + 12 * Math.sin(a)} y2={16 - 12 * Math.cos(a)}
          stroke="rgba(255,255,255,0.30)" strokeWidth={1} />
      })}
    </svg>
  )
}

const STAT_ICONS = [<IconUsers />, <IconProjects />, <IconUptime />, <IconClock />]

const STATS = [
  { num: '10K+',  label: 'Users worldwide',   icon: 0 },
  { num: '50M+',  label: 'Projects created',  icon: 1 },
  { num: '99.9%', label: 'Uptime',            icon: 2 },
  { num: '24/7',  label: 'Support',           icon: 3 },
]

const FEATURE_TILES = [
  {
    tag:   'REAL-TIME LUX',
    title: 'Live lux calculations',
    desc:  'Place a fixture and see lux update instantly. Full heatmap with per-point values, average lux vs. target, and EN 12464-1 compliance check.',
    svg:   <LuxHeatmap />,
  },
  {
    tag:   'DALI 2.0 AUTOMATION',
    title: 'Full DALI circuit planning',
    desc:  'Assign addresses, validate bus capacity (64-device limit), define zone groups, and export driver schedules to PDF and Excel.',
    svg:   <DaliTopology />,
  },
  {
    tag:   'PROFESSIONAL EXPORT',
    title: 'One-click PDF reports',
    desc:  'Client-ready A4 reports with canvas snapshot, fixture schedule, lux summary, circuit allocation, and DALI driver schedule.',
    svg:   <PdfPreview />,
  },
]

// ─────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const link = document.querySelector("link[rel='canonical']") || document.createElement('link')
    link.rel  = 'canonical'
    link.href = 'https://lumina-design-rho.vercel.app/'
    if (!link.parentNode) document.head.appendChild(link)
    document.title = 'Lumina Design — Precision Lighting Design Software'
  }, [])

  function go(path) {
    if (path.startsWith('http')) window.location.href = path
    else navigate(path)
  }

  return (
    <div style={{ minHeight: '100vh', background: T.bg, color: T.text, fontFamily: FONT, overflowX: 'hidden' }}>

      {/* ── Navigation ── */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 60,
        borderBottom: `1px solid ${T.border}`,
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(0,0,0,0.94)', backdropFilter: 'blur(16px)',
      }}>
        <span onClick={() => navigate('/')}
          style={{ fontSize: 16, fontWeight: 700, letterSpacing: '0.18em', cursor: 'pointer', userSelect: 'none' }}>
          LUMINA
        </span>
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          {NAV_LINKS.map(l => (
            <span key={l.label} onClick={() => go(l.path)}
              style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.09em', color: T.muted, cursor: 'pointer', whiteSpace: 'nowrap' }}
              onMouseEnter={e => e.currentTarget.style.color = T.text}
              onMouseLeave={e => e.currentTarget.style.color = T.muted}>
              {l.label}
            </span>
          ))}
        </div>
        <button onClick={() => navigate('/app')}
          style={{ padding: '8px 20px', fontSize: 11, fontWeight: 600, letterSpacing: '0.09em', background: T.btnGray, color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
          onMouseEnter={e => e.currentTarget.style.background = T.btnGrayHov}
          onMouseLeave={e => e.currentTarget.style.background = T.btnGray}>
          LAUNCH APP
        </button>
      </nav>

      {/* ── Hero — two column ── */}
      <section style={{
        display: 'flex', alignItems: 'center', gap: 0,
        maxWidth: 1200, margin: '0 auto',
        padding: '80px 48px 72px',
        borderBottom: `1px solid ${T.border}`,
      }}>
        {/* Left: text */}
        <div style={{ flex: '1 1 480px', paddingRight: 64 }}>
          <div style={{
            display: 'inline-block', marginBottom: 24,
            fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: T.muted,
            fontFamily: MONO, textTransform: 'uppercase',
            padding: '4px 12px', border: `1px solid ${T.border}`, borderRadius: 2,
          }}>
            Lighting Design Software
          </div>

          <h1 style={{
            fontSize: 'clamp(34px, 4.5vw, 58px)', fontWeight: 700,
            lineHeight: 1.12, letterSpacing: '-0.025em',
            marginBottom: 24, color: T.text,
          }}>
            Precision Lighting<br />Design Simplified
          </h1>

          <p style={{
            fontSize: 16, color: T.muted, lineHeight: 1.80,
            marginBottom: 40, fontWeight: 400, maxWidth: 460,
          }}>
            Interactive canvas. Real-time lux calculations.
            DALI automation. Professional exports.
            For architects, engineers, and lighting professionals.
          </p>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/app')}
              style={{ padding: '13px 28px', fontSize: 13, fontWeight: 600, letterSpacing: '0.07em', background: '#ffffff', color: '#000000', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.88)'}
              onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
              START FREE TRIAL
            </button>
            <button onClick={() => navigate('/features')}
              style={{ padding: '13px 28px', fontSize: 13, fontWeight: 500, letterSpacing: '0.07em', background: 'transparent', color: T.text, border: `1px solid ${T.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
              onMouseEnter={e => { e.currentTarget.style.background = T.btnGray; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.24)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = T.border }}>
              SEE HOW IT WORKS
            </button>
          </div>

          {/* Trust signals */}
          <div style={{ marginTop: 40, display: 'flex', gap: 24, alignItems: 'center', flexWrap: 'wrap' }}>
            {['No credit card required', 'EN 12464-1 compliant', 'DALI 2.0 ready'].map(t => (
              <span key={t} style={{ fontSize: 11, color: T.dim, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: T.muted }}>✓</span> {t}
              </span>
            ))}
          </div>
        </div>

        {/* Right: beam diagram */}
        <div style={{
          flex: '0 0 420px',
          background: T.panelBg,
          border: `1px solid ${T.border}`,
          borderRadius: 8,
          padding: '24px 16px 16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center',
        }}>
          <BeamDiagram />
          <div style={{ marginTop: 12, fontSize: 9, color: T.dim, fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center' }}>
            Beam angle · Lux distribution · Maintenance factor
          </div>
        </div>
      </section>

      {/* ── Stats bar with icons ── */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        borderBottom: `1px solid ${T.border}`,
      }}>
        {STATS.map((s, i) => (
          <div key={s.label} style={{
            flex: '1 1 0', textAlign: 'center', padding: '36px 20px',
            borderRight: i < STATS.length - 1 ? `1px solid ${T.border}` : 'none',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          }}>
            {/* Icon */}
            <div style={{ opacity: 0.75, lineHeight: 0 }}>
              {STAT_ICONS[s.icon]}
            </div>
            <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: '-0.02em', color: T.text, lineHeight: 1 }}>
              {s.num}
            </div>
            <div style={{ fontSize: 10, color: T.muted, letterSpacing: '0.09em', textTransform: 'uppercase' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Feature tiles ── */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 48px 72px' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.18em', color: T.dim, fontFamily: MONO, textTransform: 'uppercase', marginBottom: 16 }}>
            CAPABILITIES
          </div>
          <h2 style={{ fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 700, letterSpacing: '-0.02em', color: T.text }}>
            Everything a lighting professional needs
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 1, border: `1px solid ${T.border}` }}>
          {FEATURE_TILES.map((f, i) => (
            <div key={f.tag} style={{
              background: T.panelBg, padding: '40px 32px',
              borderRight: i < FEATURE_TILES.length - 1 ? `1px solid ${T.border}` : 'none',
              display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              <div>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', color: T.dim, fontFamily: MONO, marginBottom: 10, textTransform: 'uppercase' }}>{f.tag}</div>
                <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em', color: T.text, marginBottom: 10, lineHeight: 1.3 }}>{f.title}</div>
                <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.75 }}>{f.desc}</div>
              </div>
              {/* SVG diagram */}
              <div style={{
                background: '#000', border: `1px solid ${T.border}`, borderRadius: 4,
                padding: '16px 12px', display: 'flex', justifyContent: 'center', alignItems: 'center',
              }}>
                {f.svg}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <div style={{ textAlign: 'center', padding: '88px 32px', borderTop: `1px solid ${T.border}` }}>
        <h2 style={{ fontSize: 'clamp(26px, 3.5vw, 42px)', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 16 }}>
          Ready to start your first project?
        </h2>
        <p style={{ fontSize: 15, color: T.muted, marginBottom: 40, lineHeight: 1.7 }}>
          Free trial includes full access to the design canvas. No credit card required.
        </p>
        <button onClick={() => navigate('/app')}
          style={{ padding: '14px 40px', fontSize: 13, fontWeight: 600, letterSpacing: '0.07em', background: '#ffffff', color: '#000000', border: 'none', borderRadius: 4, cursor: 'pointer', fontFamily: FONT }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.88)'}
          onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}>
          START FREE TRIAL
        </button>
      </div>

      {/* ── Footer ── */}
      <footer style={{
        borderTop: `1px solid ${T.border}`, padding: '28px 48px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16,
      }}>
        <div style={{ fontSize: 12, color: T.dim }}>© 2026 Lumina Design · Built for lighting professionals.</div>
        <div style={{ display: 'flex', gap: 28 }}>
          {[['Features', '/features'], ['Pricing', '/pricing'], ['App', '/app']].map(([label, path]) => (
            <span key={label} onClick={() => navigate(path)}
              style={{ fontSize: 11, color: T.dim, cursor: 'pointer', letterSpacing: '0.08em', textTransform: 'uppercase' }}
              onMouseEnter={e => e.currentTarget.style.color = T.muted}
              onMouseLeave={e => e.currentTarget.style.color = T.dim}>
              {label}
            </span>
          ))}
        </div>
      </footer>

    </div>
  )
}
