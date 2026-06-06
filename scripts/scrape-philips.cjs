#!/usr/bin/env node
/**
 * Philips Signify India — Fixture Scraper
 *
 * Crawls signify.com/en-in product catalog via:
 *   Category page (JSON-LD ItemList) → Family page (JSON-LD ItemList) → Product page (spec HTML)
 *
 * Usage:
 *   node scripts/scrape-philips.cjs [--limit 100] [--delay 1500] [--debug]
 *
 * Output: data/scraped/philips-fixtures.json
 */

'use strict'

const fs    = require('fs')
const path  = require('path')
const https = require('https')
const http  = require('http')
const { URL } = require('url')

let cheerio
try { cheerio = require('cheerio') } catch {
  console.error('❌  Missing dependency: npm install --save-dev cheerio')
  process.exit(1)
}

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
function getArg(flag, fallback) {
  const i = args.indexOf(flag)
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback
}
const LIMIT    = parseInt(getArg('--limit',  '100'), 10)
const DELAY_MS = parseInt(getArg('--delay',  '1500'), 10)
const DEBUG    = args.includes('--debug')
const OUT_DIR  = path.resolve('data/scraped')
const OUT_FILE = path.join(OUT_DIR, 'philips-fixtures.json')

// ── Target categories ─────────────────────────────────────────────────────────
// Category IDs confirmed from signify.com/en-in navigation
const CATEGORIES = [
  { name: 'Downlight',   url: 'https://www.signify.com/en-in/prof/indoor-luminaires/downlights/SMC_CDOWNL_CA/category',                     target: 20 },
  { name: 'Panel',       url: 'https://www.signify.com/en-in/prof/indoor-luminaires/recessed/SMC_CREC_CA/category',                          target: 15 },
  { name: 'Linear',      url: 'https://www.signify.com/en-in/prof/indoor-luminaires/battens/SMC_CIBATT_CA/category',                         target: 10 },
  { name: 'Pendant',     url: 'https://www.signify.com/en-in/prof/indoor-luminaires/suspended/SMC_LESUSP_CA/category',                       target: 10 },
  { name: 'High_Bay',    url: 'https://www.signify.com/en-in/prof/indoor-luminaires/high-bay-and-low-bay/SMC_CHLBAY_CA/category',            target: 10 },
  { name: 'Spotlight',   url: 'https://www.signify.com/en-in/prof/indoor-luminaires/accent-downlights/SMC_ACCDOWNL_CA/category',             target: 10 },
  { name: 'Surface',     url: 'https://www.signify.com/en-in/prof/indoor-luminaires/surface-mounted/SMC_LESURF_CA/category',                 target: 10 },
  { name: 'Wall_Washer', url: 'https://www.signify.com/en-in/prof/outdoor-luminaires/architectural-floodlighting/SMC_PROJECT_CA/category',   target: 10 },
  { name: 'Floodlight',  url: 'https://www.signify.com/en-in/prof/outdoor-luminaires/sports-and-area-floodlighting/SMC_NSPAREA_CA/category', target: 5  },
]

// ── HTTP helper ───────────────────────────────────────────────────────────────
const DEFAULT_HEADERS = {
  'User-Agent':      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-IN,en;q=0.9',
  'Accept-Encoding': 'identity',
  'Cache-Control':   'no-cache',
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function fetchHtml(urlStr, redirects = 0) {
  return new Promise((resolve, reject) => {
    if (redirects > 5) return reject(new Error('Too many redirects'))
    const u   = new URL(urlStr)
    const lib = u.protocol === 'https:' ? https : http
    const req = lib.get(urlStr, { headers: DEFAULT_HEADERS, timeout: 30000 }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const next = new URL(res.headers.location, urlStr).toString()
        res.resume()
        return fetchHtml(next, redirects + 1).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode}: ${urlStr}`))
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end',  () => resolve(Buffer.concat(chunks).toString('utf8')))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${urlStr}`)) })
  })
}

// ── JSON-LD extraction ────────────────────────────────────────────────────────
function extractJsonLd(html) {
  const $ = cheerio.load(html)
  const scripts = $('script[type="application/ld+json"]')
  const results = []
  scripts.each((_, el) => {
    try { results.push(JSON.parse($(el).html())) } catch {}
  })
  return results
}

/**
 * From a category or family page, extract ItemList URLs from JSON-LD
 */
function extractItemListUrls(html) {
  const blocks = extractJsonLd(html)
  for (const block of blocks) {
    // Handle @graph arrays
    const graphs = block['@graph'] ? block['@graph'] : [block]
    for (const node of graphs) {
      if (node['@type'] === 'ItemList' && Array.isArray(node.itemListElement)) {
        return node.itemListElement
          .map(item => item.url)
          .filter(Boolean)
      }
    }
  }
  return []
}

// ── Product spec extraction ───────────────────────────────────────────────────
function extractSpecs(html) {
  const $ = cheerio.load(html)
  const specs = {}

  // Build key→value map from spec list items
  $('.specification__list-item').each((_, el) => {
    const label = $(el).find('.specification__list-header').text().trim()
    const value = $(el).find('.specification__list-description').text().trim()
    if (label && value) specs[label] = value
  })

  return specs
}

function extractProductJsonLd(html) {
  const blocks = extractJsonLd(html)
  for (const block of blocks) {
    const graphs = block['@graph'] ? block['@graph'] : [block]
    for (const node of graphs) {
      if (node['@type'] === 'Product') return node
    }
    if (block['@type'] === 'Product') return block
  }
  return null
}

// ── Parse spec values ─────────────────────────────────────────────────────────
function parseLumens(val) {
  if (!val) return null
  const n = parseFloat(val.replace(/,/g, '').replace(/[^\d.]/g, ''))
  return isNaN(n) ? null : Math.round(n)
}

function parseWatts(val) {
  if (!val) return null
  const n = parseFloat(val.replace(/[^\d.]/g, ''))
  return isNaN(n) ? null : Math.round(n)
}

function parseCCT(val) {
  if (!val) return null
  // "3000 K" → "3000K"
  const m = val.match(/(\d{3,4})\s*K/i)
  return m ? m[1] + 'K' : null
}

function parseBeamAngle(val) {
  if (!val) return null
  const m = val.match(/(\d+\.?\d*)/)
  return m ? Math.round(parseFloat(m[1])) : null
}

function parseCRI(val) {
  if (!val) return null
  const m = val.match(/(\d+)/)
  return m ? parseInt(m[1]) : null
}

function parseIP(val) {
  if (!val) return 'IP20'
  const m = val.match(/IP\s*(\d{2})/i)
  return m ? 'IP' + m[1] : 'IP20'
}

function parseDimming(val) {
  if (!val) return 'Non-Dimmable'
  const v = val.toLowerCase()
  if (v === 'yes' || v.includes('dim')) return 'Dimmable'
  return 'Non-Dimmable'
}

// ── Fixture schema builder ────────────────────────────────────────────────────
let uidCounter = 1

function buildFixture(category, familyName, productUrl, jsonLd, specs) {
  // Core luminous/electrical specs
  const lumens  = parseLumens(specs['Luminous Flux'] || specs['Luminaire Luminous Flux (Nom)'])
  const watts   = parseWatts(specs['Power Consumption'] || specs['Input Power (Nom)'])
  const cct     = parseCCT(specs['Correlated Color Temperature (Nom)'] || specs['Color temperature'])
  const cri     = parseCRI(specs['Color rendering index (CRI)'] || specs['CRI'])
  const beam    = parseBeamAngle(
    specs['Luminaire light beam spread'] ||
    specs['Beam angle of light source'] ||
    specs['Beam Angle']
  )
  const ip      = parseIP(specs['Ingress protection code'] || specs['IP Rating'])
  const dimming = parseDimming(specs['Dimmable'])

  // Order code
  const orderCode = specs['Full order code'] || specs['Order code'] || ''
  const sku = jsonLd?.sku || orderCode

  // Name
  const productName = jsonLd?.name || familyName

  // Image
  const image = Array.isArray(jsonLd?.image) ? jsonLd.image[0] : (jsonLd?.image || null)

  // Efficacy — prefer spec-sheet value; fall back to computed
  const efficacyRaw = specs['Luminous Efficacy (rated) (Nom)'] || specs['Luminous Efficacy']
  const efficacy = efficacyRaw
    ? Math.round(parseFloat(efficacyRaw.replace(/[^\d.]/g, '')))
    : (watts && lumens ? Math.round(lumens / watts) : null)

  // ID
  const slug = (familyName || 'philips')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 30)
  const id = `philips-${slug}-${String(uidCounter++).padStart(3, '0')}`

  const variant = {}
  if (watts)   variant.watt = watts
  if (lumens)  variant.lumens = lumens
  if (efficacy) variant.efficacy = efficacy
  if (beam)    variant.beamOptions = [beam]
  if (cct)     variant.cct = cct
  if (sku)     variant.catalogNumber = sku
  if (orderCode) variant.orderCode = orderCode

  return {
    id,
    category,
    subcategory:   'Philips Signify',
    name:          productName,
    manufacturer:  'Philips',
    catalogNumber: sku,
    source:        'scraped',
    sourceUrl:     productUrl,
    description:   jsonLd?.description || '',
    image,
    mounting:      mountingFromCategory(category, productName),
    cri:           cri || 80,
    cct:           cct ? [cct] : ['4000K'],
    voltage:       specs['Input Voltage'] || '220-240V',
    dimming,
    ipRating:      ip,
    variants:      [variant],
  }
}

const { mountingFromCategory } = require('./lib/mounting-utils.cjs')

// ── Category page scraping ────────────────────────────────────────────────────
async function scrapeFamilyUrls(categoryUrl) {
  if (DEBUG) console.log(`  Fetching category: ${categoryUrl}`)
  const html = await fetchHtml(categoryUrl)
  const urls = extractItemListUrls(html)
  if (DEBUG) console.log(`  → Found ${urls.length} families`)
  return urls
}

async function scrapeProductUrls(familyUrl) {
  if (DEBUG) console.log(`    Fetching family: ${familyUrl}`)
  const html = await fetchHtml(familyUrl)
  const urls = extractItemListUrls(html)
  if (DEBUG) console.log(`    → Found ${urls.length} products`)
  return { urls, familyName: extractFamilyName(html) }
}

function extractFamilyName(html) {
  const $ = cheerio.load(html)
  // Try JSON-LD CollectionPage name first
  const blocks = extractJsonLd(html)
  for (const block of blocks) {
    const graphs = block['@graph'] ? block['@graph'] : [block]
    for (const node of graphs) {
      if (node['@type'] === 'CollectionPage' && node.name) return node.name
    }
  }
  // Fallback: h1
  return $('h1').first().text().trim() || 'Unknown'
}

async function scrapeProduct(category, familyName, productUrl) {
  if (DEBUG) console.log(`      Product: ${productUrl}`)
  const html  = await fetchHtml(productUrl)
  const specs = extractSpecs(html)
  const jld   = extractProductJsonLd(html)
  return buildFixture(category, familyName, productUrl, jld, specs)
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔍  Philips Signify India — Fixture Scraper')
  console.log(`   Limit   : ${LIMIT} products total`)
  console.log(`   Delay   : ${DELAY_MS}ms between requests`)
  console.log(`   Output  : ${OUT_FILE}\n`)

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
  }

  const allFixtures = []
  const errors = []

  for (const cat of CATEGORIES) {
    if (allFixtures.length >= LIMIT) break
    console.log(`\n── ${cat.name} (target: ${cat.target}) ────────────────────────────`)

    let familyUrls
    try {
      familyUrls = await scrapeFamilyUrls(cat.url)
      await sleep(DELAY_MS)
    } catch (e) {
      console.log(`  ❌ Category fetch failed: ${e.message}`)
      errors.push({ url: cat.url, error: e.message })
      continue
    }

    if (!familyUrls.length) {
      console.log(`  ⚠️  No families found — category URL may be wrong`)
      continue
    }

    let catCount = 0

    for (const familyUrl of familyUrls) {
      if (allFixtures.length >= LIMIT || catCount >= cat.target) break

      let productUrls, familyName
      try {
        const result = await scrapeProductUrls(familyUrl)
        productUrls = result.urls
        familyName  = result.familyName
        await sleep(DELAY_MS)
      } catch (e) {
        console.log(`  ❌ Family fetch failed: ${e.message}`)
        errors.push({ url: familyUrl, error: e.message })
        continue
      }

      if (!productUrls.length) continue

      for (const productUrl of productUrls) {
        if (allFixtures.length >= LIMIT || catCount >= cat.target) break

        try {
          const fixture = await scrapeProduct(cat.name, familyName, productUrl)
          allFixtures.push(fixture)
          catCount++
          const w = fixture.variants[0]?.watt  ?? '?'
          const l = fixture.variants[0]?.lumens ?? '?'
          const b = fixture.variants[0]?.beamOptions?.[0] ?? '?'
          process.stdout.write(`  [${String(allFixtures.length).padStart(3)}] ${fixture.name.slice(0, 55).padEnd(55)} ${w}W ${l}lm ${b}°\n`)
        } catch (e) {
          process.stdout.write(`  ❌  ${productUrl.slice(-40)}: ${e.message}\n`)
          errors.push({ url: productUrl, error: e.message })
        }

        await sleep(DELAY_MS)
      }
    }

    console.log(`  → ${catCount} fixtures scraped for ${cat.name}`)
  }

  // ── Write output ──────────────────────────────────────────────────────────
  const output = {
    metadata: {
      source:         'signify.com/en-in',
      manufacturer:   'Philips',
      totalFixtures:  allFixtures.length,
      lastUpdated:    new Date().toISOString().slice(0, 10),
      errors:         errors.length,
    },
    fixtures: allFixtures,
  }

  fs.writeFileSync(OUT_FILE, JSON.stringify(output, null, 2), 'utf8')

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n── Summary ───────────────────────────────────────────────')
  console.log(`   Scraped  : ${allFixtures.length} fixtures`)
  console.log(`   Errors   : ${errors.length}`)
  console.log(`   Output   : ${OUT_FILE}`)

  const cats = {}
  allFixtures.forEach(f => { cats[f.category] = (cats[f.category] || 0) + 1 })
  console.log('\n   By category:')
  Object.entries(cats).forEach(([c, n]) => console.log(`   ${c.padEnd(14)} ${n}`))

  // Stats on spec completeness
  const withBeam  = allFixtures.filter(f => f.variants[0]?.beamOptions?.length).length
  const withLumen = allFixtures.filter(f => f.variants[0]?.lumens).length
  const withWatt  = allFixtures.filter(f => f.variants[0]?.watt).length
  console.log('\n   Spec coverage:')
  console.log(`   Wattage  : ${withWatt}/${allFixtures.length}`)
  console.log(`   Lumens   : ${withLumen}/${allFixtures.length}`)
  console.log(`   Beam     : ${withBeam}/${allFixtures.length}`)

  if (errors.length > 0 && DEBUG) {
    console.log('\n── Errors ────────────────────────────────────────────────')
    errors.forEach(e => console.log(`   ${e.url.slice(-50)}: ${e.error}`))
  }

  if (allFixtures.length > 0) {
    console.log('\n✅  Done. To add to app library:')
    console.log('   node scripts/convert-scraped-to-library.cjs\n')
  }
}

main().catch(e => {
  console.error('\n❌  Fatal:', e.message)
  if (DEBUG) console.error(e.stack)
  process.exit(1)
})
