/**
 * Generates public/og-image.svg — a fallback OG image.
 * Run: node scripts/generate-og-svg.js
 * No npm packages required — pure Node.js built-ins only.
 *
 * For PNG (required by most platforms):
 * Open scripts/generate-og-image.html in Chrome → auto-downloads og-image.png
 * Move the downloaded file to public/og-image.png
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

const W = 1200, H = 630

// ── Fixture grid positions ──────────────────────────────────────────────────
const roomX = 700, roomY = 60, roomW = 440, roomH = 510
const cols = 5, rows = 6
const padX = 55, padY = 55
const stepX = (roomW - padX * 2) / (cols - 1)
const stepY = (roomH - padY * 2) / (rows - 1)

const fixtures = []
for (let r = 0; r < rows; r++) {
  for (let c = 0; c < cols; c++) {
    fixtures.push({ x: roomX + padX + c * stepX, y: roomY + padY + r * stepY })
  }
}

// Build radial gradients for fixtures
const gradDefs = fixtures.map((f, i) => `
  <radialGradient id="fg${i}" cx="50%" cy="50%" r="50%">
    <stop offset="0%"   stop-color="#FFDC78" stop-opacity="0.22"/>
    <stop offset="25%"  stop-color="#D4A843" stop-opacity="0.12"/>
    <stop offset="60%"  stop-color="#B48C3C" stop-opacity="0.05"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
  </radialGradient>`).join('')

const fixtureGlows = fixtures.map((f, i) => `
  <ellipse cx="${f.x}" cy="${f.y}" rx="90" ry="90" fill="url(#fg${i})"/>`).join('')

const fixtureDots = fixtures.map(f => `
  <circle cx="${f.x}" cy="${f.y}" r="5" fill="#D4A843" fill-opacity="0.18"/>
  <circle cx="${f.x}" cy="${f.y}" r="2" fill="#FFE68C" fill-opacity="0.75"/>`).join('')

// Contour rings per fixture
const contourRings = fixtures.map(f =>
  [1, 2, 3].map(ring => `
  <ellipse cx="${f.x}" cy="${f.y}" rx="${ring * 28}" ry="${ring * 22}"
    fill="none" stroke="#D4A843" stroke-opacity="0.06" stroke-width="0.8"/>`).join('')
).join('')

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>

    <!-- Background glow (right side) -->
    <radialGradient id="bgGlow" cx="80%" cy="50%" r="35%">
      <stop offset="0%"   stop-color="#D4A843" stop-opacity="0.07"/>
      <stop offset="60%"  stop-color="#D4A843" stop-opacity="0.03"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>

    <!-- Fixture radial gradients -->
    ${gradDefs}

    <!-- Right panel fade -->
    <linearGradient id="rightFade" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#000000" stop-opacity="1"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>

    <!-- Vertical accent line -->
    <linearGradient id="accentLine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%"   stop-color="#D4A843" stop-opacity="0"/>
      <stop offset="20%"  stop-color="#D4A843" stop-opacity="0.5"/>
      <stop offset="80%"  stop-color="#D4A843" stop-opacity="0.5"/>
      <stop offset="100%" stop-color="#D4A843" stop-opacity="0"/>
    </linearGradient>

    <!-- Tagline divider -->
    <linearGradient id="divider" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%"   stop-color="#ffffff" stop-opacity="0.2"/>
      <stop offset="70%"  stop-color="#ffffff" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>

    <!-- Clip for right panel fade -->
    <clipPath id="rightClip">
      <rect x="${roomX - 20}" y="0" width="${W - roomX + 20}" height="${H}"/>
    </clipPath>

  </defs>

  <!-- Black background -->
  <rect width="${W}" height="${H}" fill="#000000"/>

  <!-- Background glow -->
  <rect width="${W}" height="${H}" fill="url(#bgGlow)"/>

  <!-- Room outline (faint) -->
  <rect x="${roomX}" y="${roomY}" width="${roomW}" height="${roomH}"
    fill="none" stroke="#ffffff" stroke-opacity="0.06" stroke-width="1"/>

  <!-- Fixture glows -->
  ${fixtureGlows}

  <!-- Contour rings -->
  ${contourRings}

  <!-- Fixture dots -->
  ${fixtureDots}

  <!-- Right-panel fade overlay -->
  <rect x="680" y="0" width="40" height="${H}" fill="url(#rightFade)"/>

  <!-- Vertical accent line -->
  <line x1="88" y1="100" x2="88" y2="530" stroke="url(#accentLine)" stroke-width="1"/>

  <!-- Category label -->
  <text x="118" y="178"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
    font-size="14" font-weight="600" fill="#D4A843" fill-opacity="0.7"
    letter-spacing="2">LIGHTING DESIGN SOFTWARE</text>

  <!-- LUMINA -->
  <text x="118" y="300"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
    font-size="118" font-weight="700" fill="#ffffff"
    letter-spacing="-2">LUMINA</text>

  <!-- DESIGN (amber) -->
  <text x="118" y="415"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
    font-size="118" font-weight="700" fill="#D4A843"
    letter-spacing="-2">DESIGN</text>

  <!-- Divider -->
  <line x1="118" y1="445" x2="598" y2="445" stroke="url(#divider)" stroke-width="1"/>

  <!-- Tagline line 1 -->
  <text x="118" y="483"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
    font-size="22" font-weight="400" fill="#ffffff" fill-opacity="0.55">
    Professional Lighting Design Software
  </text>

  <!-- Tagline line 2 -->
  <text x="118" y="511"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
    font-size="22" font-weight="400" fill="#ffffff" fill-opacity="0.55">
    for India &#x2014; EN 12464-1 &#x00B7; NBC &#x00B7; DALI 2.0
  </text>

  <!-- Feature pills -->
  <g font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
     font-size="11" font-weight="500">
    <!-- Pill 1: Lux Calculator -->
    <rect x="118" y="528" width="112" height="24" rx="4"
      fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1"/>
    <text x="128" y="544" fill="#ffffff" fill-opacity="0.4">Lux Calculator</text>
    <!-- Pill 2: DALI Planning -->
    <rect x="238" y="528" width="106" height="24" rx="4"
      fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1"/>
    <text x="248" y="544" fill="#ffffff" fill-opacity="0.4">DALI Planning</text>
    <!-- Pill 3: PDF Export -->
    <rect x="352" y="528" width="90" height="24" rx="4"
      fill="#ffffff" fill-opacity="0.05" stroke="#ffffff" stroke-opacity="0.12" stroke-width="1"/>
    <text x="362" y="544" fill="#ffffff" fill-opacity="0.4">PDF Export</text>
    <!-- Pill 4: Free Trial -->
    <rect x="450" y="528" width="82" height="24" rx="4"
      fill="#D4A843" fill-opacity="0.15" stroke="#D4A843" stroke-opacity="0.35" stroke-width="1"/>
    <text x="460" y="544" fill="#D4A843" fill-opacity="0.85">Free Trial</text>
  </g>

  <!-- URL -->
  <text x="118" y="575"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
    font-size="15" font-weight="400" fill="#ffffff" fill-opacity="0.22">
    app.lightillumina.com
  </text>

  <!-- Top-left brand mark -->
  <circle cx="44" cy="44" r="6" fill="#D4A843"/>
  <text x="58" y="49"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif"
    font-size="13" font-weight="600" fill="#ffffff" fill-opacity="0.5">LUMINA DESIGN</text>

</svg>`

const outPath = path.join(__dirname, '..', 'public', 'og-image.svg')
fs.writeFileSync(outPath, svg, 'utf8')
console.log(`✓ Wrote ${outPath}`)
console.log(`\nFor PNG: open scripts/generate-og-image.html in Chrome`)
console.log(`         → auto-downloads og-image.png`)
console.log(`         → move to public/og-image.png`)
