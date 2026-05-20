#!/usr/bin/env node
/**
 * IES Photometric File Parser — IESNA LM-63 (1986 / 1991 / 1995 / 2002)
 *
 * Usage:
 *   node scripts/parse-ies-fixtures.cjs [--dir data/ies-files] [--out data/parsed-fixtures.json]
 *
 * Reads every *.ies file in --dir and outputs a JSON array in the same
 * schema as src/data/complete-fixture-library.json so the results can be
 * merged directly into the fixture library.
 */

'use strict'

const fs   = require('fs')
const path = require('path')

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
function getArg(flag, fallback) {
  const i = args.indexOf(flag)
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback
}
const IES_DIR  = path.resolve(getArg('--dir', 'data/ies-files'))
const OUT_FILE = path.resolve(getArg('--out', 'data/parsed-fixtures.json'))

// ── Fixture category classification ──────────────────────────────────────────
const CATEGORY_RULES = [
  // Most specific first — prevents 'recessed' or 'flood' in names from mis-matching
  { keywords: ['wall washer', 'wallwasher', 'wall wash', 'wall light', ' ww '], category: 'Wall_Washer'  },
  { keywords: ['track light', 'track head', 'tracklight', 'track fitting'],     category: 'Track_Light'  },
  { keywords: ['highbay', 'high bay', 'high-bay', 'warehouse'],                 category: 'High_Bay'     },
  { keywords: ['streetlight', 'street light', 'roadway', 'road lighting'],      category: 'Streetlight'  },
  { keywords: ['emergency', 'exit light'],                                       category: 'Emergency'    },
  { keywords: ['pendant', 'suspended', 'chandelier'],                           category: 'Pendant'      },
  { keywords: ['panel', 'troffer', 'flat panel', 'led panel'],                  category: 'Panel'        },
  { keywords: ['linear', 'strip', 'batten', 'trunking', 'line light'],          category: 'Linear'       },
  { keywords: ['downlight', 'recessed', 'recess', ' can ', 'downlighter'],      category: 'Downlight'    },
  { keywords: ['spot', 'accent', 'spotlight', 'mr16', 'par38', 'par30'],        category: 'Spotlight'    },
  { keywords: ['flood', 'floodlight', 'area light', 'area luminaire'],          category: 'Floodlight'   },
  { keywords: ['surface', 'ceiling', 'oyster', 'bulkhead'],                     category: 'Surface'      },
  { keywords: ['sconce', 'wall bracket'],                                        category: 'Wall_Washer'  },
  { keywords: ['rail', 'track'],                                                 category: 'Track_Light'  },
]

function classifyFixture(text) {
  const lower = (text ?? '').toLowerCase()
  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some(kw => lower.includes(kw))) return rule.category
  }
  return 'Downlight' // sensible default — most IES files are downlights
}

// ── Beam angle from 50% peak candela ─────────────────────────────────────────
function calcBeamAngle(vertAngles, candelaValues) {
  if (!candelaValues || candelaValues.length === 0) return 60
  const peak = Math.max(...candelaValues)
  if (peak === 0) return 60
  const half = peak * 0.5
  for (let i = 0; i < vertAngles.length - 1; i++) {
    if (candelaValues[i] >= half && candelaValues[i + 1] < half) {
      // linear interpolation between angles
      const range = candelaValues[i] - candelaValues[i + 1]
      const t     = range === 0 ? 0 : (candelaValues[i] - half) / range
      const halfAngle = vertAngles[i] + t * (vertAngles[i + 1] - vertAngles[i])
      return Math.round(halfAngle * 2)
    }
  }
  // Candela never drops to 50% within measured angles → very wide distribution
  return 180
}

function beamClass(deg) {
  if (deg < 30)  return 'narrow'
  if (deg <= 60) return 'medium'
  return 'wide'
}

// ── Slug generator ────────────────────────────────────────────────────────────
function slugify(str) {
  return (str ?? '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

// ── Core IES parser ───────────────────────────────────────────────────────────
/**
 * Parse a single IES file text.
 * Returns a result object or throws on fatal parse errors.
 */
function parseIES(text, fileName) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const result = {
    manufacturer: null,
    catalogNumber: null,
    description:  null,
    lampType:     null,
    wattage:      null,   // from [WATTAGE] header
    tilt:         'NONE',
    numLamps:     1,
    lumensPerLamp: -1,    // -1 means absolute candela (multiply by 1)
    multiplier:   1.0,
    numVertAngles: 0,
    numHorizAngles: 0,
    vertAngles:   [],
    horizAngles:  [],
    candelaMatrix: [],    // [horizIdx][vertIdx]
  }

  let i = 0
  const n = lines.length

  // ── Phase 1: Header keywords ──────────────────────────────────────────────
  while (i < n) {
    const line = lines[i].trim()

    // LM-63 keyword line: [KEYWORD] value
    const kwMatch = line.match(/^\[([A-Z0-9_]+)\]\s*(.*)/)
    if (kwMatch) {
      const kw  = kwMatch[1]
      const val = kwMatch[2].trim()
      if (kw === 'MANUFAC')   result.manufacturer  = val || null
      if (kw === 'LUMCAT')    result.catalogNumber = val || null
      if (kw === 'LUMINAIRE') result.description   = val || null
      if (kw === 'LAMP')      result.lampType      = val || null
      if (kw === 'WATTAGE')   result.wattage       = parseFloat(val) || null
      i++
      continue
    }

    // TILT line marks end of header
    if (/^TILT\s*=/i.test(line)) {
      result.tilt = line.split('=')[1]?.trim().toUpperCase() ?? 'NONE'
      i++
      // If TILT=INCLUDE, skip tilt data (angle count line + angle data + multiplier data)
      if (result.tilt === 'INCLUDE') {
        // Next line: number of angles in tilt data
        const tiltCount = parseInt(lines[i]?.trim(), 10) || 0
        i++ // skip count line
        i++ // skip tilt angles line
        i++ // skip tilt multipliers line
        // Some files split across multiple lines — skip tiltCount tokens across lines
        // Simplified: skip 2 more lines (angles and multipliers are usually 1 line each)
      }
      break
    }

    // LM-63-86/91 files sometimes have keyword lines without brackets
    const oldKw = line.match(/^(MANUFAC|LUMCAT|LUMINAIRE|LAMP|TEST|ISSUEDATE)\s+(.+)/)
    if (oldKw) {
      const kw = oldKw[1], val = oldKw[2].trim()
      if (kw === 'MANUFAC')   result.manufacturer  = val
      if (kw === 'LUMCAT')    result.catalogNumber = val
      if (kw === 'LUMINAIRE') result.description   = val
      if (kw === 'LAMP')      result.lampType      = val
    }
    i++
  }

  // ── Phase 2: Lamp data — line 1 (10 fields) ──────────────────────────────
  // Spec: numLamps lumensPerLamp candelaMult numVertAngles numHorizAngles
  //       photType unitsType width length height
  // Some files split across two lines; we read until we have 10 numeric tokens.
  const lampLineStart = i
  const lampTokens = []
  while (i < n && lampTokens.length < 10) {
    const toks = lines[i].trim().split(/\s+/).filter(t => /^-?[\d.eE+]+$/.test(t))
    lampTokens.push(...toks)
    i++
  }

  if (lampTokens.length < 5) {
    throw new Error(`Cannot parse lamp data near line ${lampLineStart}: "${lines[lampLineStart]}"`)
  }

  result.numLamps       = parseInt(lampTokens[0], 10)  || 1
  result.lumensPerLamp  = parseFloat(lampTokens[1])    // -1 = absolute candela data
  result.multiplier     = parseFloat(lampTokens[2])    || 1.0
  result.numVertAngles  = parseInt(lampTokens[3], 10)
  result.numHorizAngles = parseInt(lampTokens[4], 10)

  // ── Phase 2b: Lamp data — line 2 (ballast / watts line) ──────────────────
  // LM-63-1991: <ballastFactor> <futureMult>           (2 tokens)
  // LM-63-1995/2002: <ballastFactor> <ballastLampFactor> <inputWatts>  (3 tokens)
  // This WHOLE logical line must be consumed before the angle data begins.
  // Strategy: skip the next non-empty line that has only numeric tokens (≤ 5 of them).
  while (i < n) {
    const line = lines[i].trim()
    if (!line) { i++; continue }  // skip blank lines
    const toks = line.split(/\s+/).filter(t => /^-?[\d.eE+]+$/.test(t))
    // If this line has 2–5 purely numeric tokens and they don't look like angles
    // (angles start at 0.0 or are integer-ish), treat it as the ballast line.
    if (toks.length >= 2 && toks.length <= 5) {
      // Check: if the first token is 0.0 that's almost certainly the start of
      // the vertical angle list (IES vertical angles always begin at 0°).
      if (parseFloat(toks[0]) === 0.0 && toks.length >= 3) {
        // Ambiguous — could be angles. Trust the numVertAngles count to decide.
        // If this line has exactly numVertAngles tokens, it IS the angle data.
        if (toks.length === result.numVertAngles) break  // do NOT skip
      }
      // Extract inputWatts from field index 2 if available and no [WATTAGE] header
      if (!result.wattage && toks[2] != null) {
        const w = parseFloat(toks[2])
        if (w > 0 && w < 100000) result.wattage = w
      }
      i++  // consume the ballast line
    }
    break  // next line is angle data
  }

  // ── Phase 3: Read remaining numeric data (angles + candela) ───────────────
  // From here, the file is one big stream: vertAngles, horizAngles, then
  // candela values (numHoriz × numVert). Collect all numeric tokens.
  const dataTokens = []
  while (i < n) {
    const line = lines[i].trim()
    // Skip empty lines and non-numeric marker lines (ENDLUMINAIRE, etc.)
    if (!line || /^[A-Z\[]/i.test(line)) { i++; continue }
    const toks = line.split(/\s+/).filter(t => /^-?[\d.eE+]+$/.test(t))
    dataTokens.push(...toks)
    i++
  }

  let di = 0
  const readN = (count) => {
    const vals = dataTokens.slice(di, di + count).map(Number)
    di += count
    return vals
  }

  result.vertAngles  = readN(result.numVertAngles)
  result.horizAngles = readN(result.numHorizAngles)

  // Candela matrix: numHorizAngles rows × numVertAngles cols
  // Apply multiplier while reading
  result.candelaMatrix = []
  for (let h = 0; h < result.numHorizAngles; h++) {
    const row = readN(result.numVertAngles).map(v => v * result.multiplier)
    result.candelaMatrix.push(row)
  }

  return result
}

// ── Convert parsed IES → fixture object ───────────────────────────────────────
function iesResultToFixture(parsed, fileName) {
  const descText = [parsed.description, parsed.catalogNumber, parsed.lampType, fileName]
    .filter(Boolean).join(' ')

  const category = classifyFixture(descText)

  // Total lumens: lumensPerLamp × numLamps × multiplier
  // lumensPerLamp = -1 means the candela values ARE absolute (no lumen scaling)
  let totalLumens = null
  if (parsed.lumensPerLamp > 0) {
    totalLumens = Math.round(parsed.lumensPerLamp * parsed.numLamps)
  } else {
    // Estimate from candela data: integrate over sphere
    // Simple approximation: sum candela × sin(θ) × Δθ × 2π / numHoriz
    try {
      const cd    = parsed.candelaMatrix[0] ?? []
      const verts = parsed.vertAngles
      let flux    = 0
      for (let j = 0; j < verts.length - 1; j++) {
        const theta1 = (verts[j]     * Math.PI) / 180
        const theta2 = (verts[j + 1] * Math.PI) / 180
        const avgCd  = (cd[j] + cd[j + 1]) / 2
        flux += avgCd * 2 * Math.PI * (Math.cos(theta1) - Math.cos(theta2))
      }
      // Scale by number of horiz planes (simple average)
      totalLumens = Math.max(0, Math.round(Math.abs(flux)))
    } catch (_) {
      totalLumens = null
    }
  }

  // Beam angle from first (nadir) horizontal plane
  const firstRow  = parsed.candelaMatrix[0] ?? []
  const beamDeg   = calcBeamAngle(parsed.vertAngles, firstRow)
  const bClass    = beamClass(beamDeg)

  const watt      = parsed.wattage ?? null
  const efficacy  = (watt && totalLumens) ? Math.round(totalLumens / watt) : null

  // Build ID from manufacturer + catalog or filename
  const idBase = slugify(
    parsed.manufacturer
      ? `${parsed.manufacturer} ${parsed.catalogNumber ?? path.basename(fileName, '.ies')}`
      : path.basename(fileName, '.ies')
  )

  const name = parsed.description
    ?? parsed.catalogNumber
    ?? path.basename(fileName, '.ies')

  const fixture = {
    id:            idBase,
    source:        'ies',
    iesFile:       fileName,
    category,
    name,
    manufacturer:  parsed.manufacturer  ?? 'Unknown',
    catalogNumber: parsed.catalogNumber ?? null,
    description:   parsed.description   ?? null,
    lampType:      parsed.lampType       ?? 'LED',
    tilt:          parsed.tilt,
    mounting:      category === 'Surface' ? 'Surface' : category === 'Pendant' ? 'Pendant' : 'Recessed',
    variants: [
      {
        watt:      watt,
        lumens:    totalLumens,
        efficacy,
        beamOptions: [beamDeg],
        beamClass:   bClass,
        numLamps:    parsed.numLamps,
      }
    ],
    _raw: {
      numVertAngles:  parsed.numVertAngles,
      numHorizAngles: parsed.numHorizAngles,
      vertAngles:     parsed.vertAngles,
    },
  }

  return fixture
}

// ── Main ──────────────────────────────────────────────────────────────────────
function main() {
  console.log(`\n📐 IES Fixture Parser`)
  console.log(`   Input dir : ${IES_DIR}`)
  console.log(`   Output    : ${OUT_FILE}\n`)

  if (!fs.existsSync(IES_DIR)) {
    console.error(`❌ Directory not found: ${IES_DIR}`)
    console.error(`   Create it and add .ies files, then re-run.`)
    process.exit(1)
  }

  const files = fs.readdirSync(IES_DIR)
    .filter(f => f.toLowerCase().endsWith('.ies'))
    .sort()

  if (files.length === 0) {
    console.warn(`⚠️  No .ies files found in ${IES_DIR}`)
    console.warn(`   Download IES files from ieslibrary.com or manufacturer sites.`)
    fs.writeFileSync(OUT_FILE, JSON.stringify([], null, 2), 'utf8')
    console.log(`   Wrote empty array to ${OUT_FILE}`)
    return
  }

  console.log(`   Found ${files.length} file(s)\n`)

  const fixtures = []
  const errors   = []

  for (const file of files) {
    const filePath = path.join(IES_DIR, file)
    process.stdout.write(`   Parsing ${file}... `)
    try {
      const text    = fs.readFileSync(filePath, 'utf8')
      const parsed  = parseIES(text, file)
      const fixture = iesResultToFixture(parsed, file)
      fixtures.push(fixture)
      const lm  = fixture.variants[0].lumens  ?? '?'
      const w   = fixture.variants[0].watt    ?? '?'
      const deg = fixture.variants[0].beamOptions[0]
      console.log(`✅  ${fixture.category} | ${lm} lm | ${w} W | ${deg}° beam`)
    } catch (err) {
      console.log(`❌  ${err.message}`)
      errors.push({ file, error: err.message })
    }
  }

  // Ensure output directory exists
  const outDir = path.dirname(OUT_FILE)
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

  fs.writeFileSync(OUT_FILE, JSON.stringify(fixtures, null, 2), 'utf8')

  console.log(`\n── Summary ──────────────────────────────────────────────`)
  console.log(`   Parsed   : ${fixtures.length} fixture(s)`)
  if (errors.length > 0) {
    console.log(`   Errors   : ${errors.length}`)
    errors.forEach(e => console.log(`     • ${e.file}: ${e.error}`))
  }
  console.log(`   Output   : ${OUT_FILE}`)

  // Print category breakdown
  const catCount = {}
  fixtures.forEach(f => { catCount[f.category] = (catCount[f.category] ?? 0) + 1 })
  if (Object.keys(catCount).length > 0) {
    console.log(`\n── Categories ───────────────────────────────────────────`)
    Object.entries(catCount)
      .sort((a, b) => b[1] - a[1])
      .forEach(([cat, count]) => console.log(`   ${cat.padEnd(20)} ${count}`))
  }

  console.log(`\n✅  Done. Import into fixture library:`)
  console.log(`   const ies = require('./data/parsed-fixtures.json')`)
  console.log(`   // Merge ies into your fixture library array\n`)
}

main()
