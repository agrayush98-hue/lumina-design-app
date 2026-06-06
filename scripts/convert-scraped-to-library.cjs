#!/usr/bin/env node
/**
 * Convert data/scraped/philips-fixtures.json → src/data/philips-fixture-library.json
 *
 * Run after scrape:philips:
 *   node scripts/convert-scraped-to-library.cjs
 *
 * Output matches the same schema as ies-fixture-library.json
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const IN_FILE  = path.resolve('data/scraped/philips-fixtures.json')
const OUT_FILE = path.resolve('src/data/philips-fixture-library.json')

if (!fs.existsSync(IN_FILE)) {
  console.error('❌  data/scraped/philips-fixtures.json not found. Run: npm run scrape:philips')
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(IN_FILE, 'utf8'))

// Clean up fixtures for the library schema
const fixtures = raw.fixtures.map(f => {
  // Ensure variant has beamOptions array (use [] if unknown)
  const variant = { ...f.variants[0] }
  if (!variant.beamOptions || !variant.beamOptions.length) {
    // Try to infer from category defaults when no measured data
    const defaultBeam = defaultBeamForCategory(f.category)
    if (defaultBeam) variant.beamOptions = [defaultBeam]
    else             variant.beamOptions = []
  }

  // Strip internal fields from variant
  const { orderCode, ...cleanVariant } = variant

  return {
    id:            f.id,
    category:      f.category,
    subcategory:   'Philips Signify',
    name:          cleanProductName(f.name),
    manufacturer:  'Philips',
    catalogNumber: f.catalogNumber || '',
    source:        'scraped',
    sourceUrl:     f.sourceUrl,
    description:   f.description || '',
    image:         f.image || null,
    mounting:      f.mounting,
    cri:           f.cri || 80,
    cct:           f.cct || ['4000K'],
    voltage:       f.voltage || '220-240V',
    dimming:       f.dimming || 'Non-Dimmable',
    ipRating:      f.ipRating || 'IP20',
    variants:      [cleanVariant],
  }
})

function cleanProductName(name) {
  if (!name) return 'Philips LED Fixture'
  // "Philips DN 392B LED 10S-6500 PSD WH" → keep as-is (already clean catalog names)
  // "Philips Greenspace Flex, 6 W, 930 warm white, IP20 | Finger-protected" → trim at first ','
  if (name.length > 60 && name.includes(',')) {
    return name.split(',')[0].trim()
  }
  return name
}

function defaultBeamForCategory(cat) {
  const defaults = {
    'Downlight':   90,
    'Panel':       120,
    'Linear':      120,
    'High_Bay':    90,
    'Pendant':     120,
    'Spotlight':   36,
    'Surface':     120,
    'Wall_Washer': 120,
    'Floodlight':  60,
  }
  return defaults[cat] || null
}

const library = {
  metadata: {
    version:       '1.0',
    source:        'signify.com/en-in',
    manufacturer:  'Philips',
    totalFixtures: fixtures.length,
    lastUpdated:   new Date().toISOString().slice(0, 10),
    description:   'Philips professional lighting — scraped from Signify India catalog',
  },
  fixtures,
}

fs.writeFileSync(OUT_FILE, JSON.stringify(library, null, 2), 'utf8')
console.log(`✅  Written ${OUT_FILE}`)
console.log(`   ${fixtures.length} fixtures across categories:`)

const cats = {}
fixtures.forEach(f => { cats[f.category] = (cats[f.category] || 0) + 1 })
Object.entries(cats).forEach(([c, n]) => console.log(`   ${c.padEnd(14)} ${n}`))

const withBeam  = fixtures.filter(f => f.variants[0]?.beamOptions?.length).length
const withImage = fixtures.filter(f => f.image).length
console.log(`\n   Beam data  : ${withBeam}/${fixtures.length}`)
console.log(`   Images     : ${withImage}/${fixtures.length}`)
