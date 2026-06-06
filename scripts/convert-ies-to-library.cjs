#!/usr/bin/env node
/**
 * Convert data/parsed-fixtures.json → src/data/ies-fixture-library.json
 *
 * Run as part of build:ies-lib pipeline:
 *   npm run build:ies-lib
 *
 * Or standalone:
 *   node scripts/convert-ies-to-library.cjs
 */

'use strict'

const fs   = require('fs')
const path = require('path')

const IN_FILE  = path.resolve('data/parsed-fixtures.json')
const OUT_FILE = path.resolve('src/data/ies-fixture-library.json')

if (!fs.existsSync(IN_FILE)) {
  console.error('❌  data/parsed-fixtures.json not found. Run: npm run parse:ies')
  process.exit(1)
}

const parsed = JSON.parse(fs.readFileSync(IN_FILE, 'utf8'))

function extractCCT(text) {
  const m = (text || '').match(/(\d{4}K)/g) || []
  return m.length ? [...new Set(m)] : ['4000K']
}

const { mountingFromCategory } = require('./lib/mounting-utils.cjs')

const fixtures = parsed.map(f => {
  // Strip _raw from variants, keep only schema-compatible fields
  const variants = f.variants.map(({ _raw, numLamps, ...rest }) => rest)

  return {
    id:            'ies-' + f.id,
    category:      f.category,
    subcategory:   'IES Photometric',
    name:          f.name,
    manufacturer:  f.manufacturer,
    catalogNumber: f.catalogNumber,
    iesFile:       f.iesFile,
    source:        'ies',
    description:   f.description,
    mounting:      mountingFromCategory(f.category, f.description),
    cri:           80,
    cct:           extractCCT(f.name + ' ' + f.description),
    voltage:       '220-240V',
    dimming:       'Dimmable',
    ipRating:      'IP20',
    variants,
  }
})

const library = {
  metadata: {
    version:        '1.0',
    totalFixtures:  fixtures.length,
    lastUpdated:    new Date().toISOString().slice(0, 10),
    description:    'IES photometric fixtures — LM-63 parsed data'
  },
  fixtures,
}

fs.writeFileSync(OUT_FILE, JSON.stringify(library, null, 2), 'utf8')
console.log(`✅  Written ${OUT_FILE}`)
console.log(`   ${fixtures.length} fixtures across categories:`)
const cats = {}
fixtures.forEach(f => { cats[f.category] = (cats[f.category] || 0) + 1 })
Object.entries(cats).forEach(([c, n]) => console.log(`   ${c.padEnd(14)} ${n}`))
