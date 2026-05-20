#!/usr/bin/env node
/**
 * IES File Downloader — ieslibrary.com
 *
 * Fetches IES photometric files from ieslibrary.com's internal API.
 * NOTE: ieslibrary.com requires a paid account (€1/month) to download files.
 * The listing/metadata API is freely accessible but downloads return HTML without auth.
 * For free IES files run: node scripts/generate-ies-fixtures.cjs
 *
 * Usage:
 *   node scripts/download-ies-files.cjs [--limit 100] [--out data/ies-files] [--delay 2000]
 *
 * Output: data/ies-files/{manufacturer}-{model}-{hash8}.ies
 *
 * API discovered via network inspection:
 *   POST https://ieslibrary.com/browse/api/pageIes/data.json
 *   params: { page, pageSize, orderBy, orderDirection, manufactur, tags[], search }
 *   download: GET https://ieslibrary.com/browse/download/ies/{hash}
 */

'use strict'

const fs      = require('fs')
const path    = require('path')
const https   = require('https')
const http    = require('http')
const { URL } = require('url')

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
function getArg(flag, fallback) {
  const i = args.indexOf(flag)
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback
}
const LIMIT     = parseInt(getArg('--limit',  '100'), 10)
const OUT_DIR   = path.resolve(getArg('--out', 'data/ies-files'))
const DELAY_MS  = parseInt(getArg('--delay', '2000'), 10)

const BASE = 'https://ieslibrary.com'

// ── Target manufacturers ──────────────────────────────────────────────────────
// IDs discovered from page inline scripts: parseInt('N') on each manufacturer URL
const MANUFACTURERS = [
  { id: 1,   slug: 'BEGA',               name: 'bega'        },
  { id: 6,   slug: 'ERCO',               name: 'erco'        },
  { id: 9,   slug: 'GE',                 name: 'ge'          },
  { id: 14,  slug: 'Lithonia',           name: 'lithonia'    },
  { id: 16,  slug: 'OSRAM',              name: 'osram'       },
  { id: 17,  slug: 'Philips',            name: 'philips'     },
  { id: 55,  slug: 'THORN',              name: 'thorn'       },
  { id: 75,  slug: 'TRILUX',             name: 'trilux'      },
  { id: 187, slug: 'Cree',               name: 'cree'        },
]

// ── Target tags ───────────────────────────────────────────────────────────────
// IDs discovered from page JS: vm.AvailableTags(JSON.parse(...))
const TAGS = [
  { id: 28, name: 'Downlight' },   // 148k files
  { id: 20, name: 'Linear'    },   //  71k files
  { id: 34, name: 'High Bay'  },   //  43k files
  { id: 10, name: 'Pendant'   },   //  44k files
  { id: 43, name: 'Troffer'   },   //  13k files
  { id: 7,  name: 'Wall Washer'},  //   2k files
  { id: 6,  name: 'Recessed'  },   //  64k files
]

// ── Helpers ───────────────────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

function slugify(str) {
  return (str ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

/**
 * HTTP/HTTPS GET — returns Buffer
 */
function get(urlStr, opts = {}) {
  return new Promise((resolve, reject) => {
    const u    = new URL(urlStr)
    const lib  = u.protocol === 'https:' ? https : http
    const req  = lib.get(urlStr, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; lumina-ies-downloader/1.0)',
        'Accept': '*/*',
        ...opts.headers,
      },
      timeout: 30000,
    }, (res) => {
      // Follow redirects (max 5)
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, urlStr).toString()
        res.resume()
        return get(redirectUrl, opts).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for ${urlStr}`))
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end',  () => resolve(Buffer.concat(chunks)))
      res.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${urlStr}`)) })
  })
}

/**
 * POST form-encoded data — returns parsed JSON
 */
function postForm(urlStr, params) {
  return new Promise((resolve, reject) => {
    // jQuery-style array serialization: tags[]=28&tags[]=6
    const parts = []
    for (const [k, v] of Object.entries(params)) {
      if (Array.isArray(v)) {
        v.forEach(item => parts.push(`${encodeURIComponent(k)}%5B%5D=${encodeURIComponent(item)}`))
      } else if (v != null) {
        parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      }
    }
    const body = parts.join('&')
    const u    = new URL(urlStr)
    const lib  = u.protocol === 'https:' ? https : http
    const req  = lib.request({
      hostname: u.hostname,
      port:     u.port || (u.protocol === 'https:' ? 443 : 80),
      path:     u.pathname + u.search,
      method:   'POST',
      headers: {
        'Content-Type':   'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent':     'Mozilla/5.0 (compatible; lumina-ies-downloader/1.0)',
        'Referer':        BASE + '/browse',
        'X-Requested-With': 'XMLHttpRequest',
        'Accept':         'application/json, text/javascript, */*; q=0.01',
      },
      timeout: 30000,
    }, (res) => {
      if (res.statusCode !== 200) {
        res.resume()
        return reject(new Error(`HTTP ${res.statusCode} for POST ${urlStr}`))
      }
      const chunks = []
      res.on('data', c => chunks.push(c))
      res.on('end',  () => {
        try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))) }
        catch (e) { reject(new Error(`JSON parse error: ${e.message}`)) }
      })
      res.on('error', reject)
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error(`Timeout: ${urlStr}`)) })
    req.write(body)
    req.end()
  })
}

// ── Fetch fixture listing ─────────────────────────────────────────────────────

/**
 * Fetch one page of fixtures for a given manufacturer + optional tag.
 * orderBy=4 = most downloaded (discovered from API tests).
 * orderDirection=2 = descending.
 */
async function fetchPage(manufId, tagId, page = 1) {
  const params = {
    page,
    pageSize: 24,
    orderBy: 4,
    orderDirection: 2,
  }
  if (manufId != null) params.manufactur = manufId
  if (tagId   != null) params['tags[]']  = tagId   // single tag; for multiple use an array

  return postForm(`${BASE}/browse/api/pageIes/data.json`, params)
}

// ── Build download list ───────────────────────────────────────────────────────

async function collectFixtures() {
  const seenHashes = new Set()
  const fixtures   = []

  // Strategy: for each manufacturer, fetch page 1 of the most downloaded.
  // Then do a second pass by tag to fill gaps from smaller/unknown manufacturers.

  console.log('\n── Scanning manufacturers ───────────────────────────────')
  for (const m of MANUFACTURERS) {
    if (fixtures.length >= LIMIT) break
    process.stdout.write(`  ${m.name.padEnd(12)} `)
    try {
      const items = await fetchPage(m.id, null, 1)
      let added = 0
      for (const item of items) {
        if (!item.hasIes || seenHashes.has(item.hash)) continue
        seenHashes.add(item.hash)
        fixtures.push({ ...item, _queryManuf: m.name })
        added++
        if (fixtures.length >= LIMIT) break
      }
      console.log(`→ ${added} queued (${items.length} returned)`)
    } catch (e) {
      console.log(`→ error: ${e.message}`)
    }
    await sleep(DELAY_MS)
  }

  // Second pass: popular tags, no manufacturer filter
  console.log('\n── Scanning tags ────────────────────────────────────────')
  for (const t of TAGS) {
    if (fixtures.length >= LIMIT) break
    process.stdout.write(`  ${t.name.padEnd(16)} `)
    try {
      // Fetch 2 pages per tag to get more variety
      let added = 0
      for (let page = 1; page <= 2 && fixtures.length < LIMIT; page++) {
        const items = await fetchPage(null, t.id, page)
        for (const item of items) {
          if (!item.hasIes || seenHashes.has(item.hash)) continue
          seenHashes.add(item.hash)
          fixtures.push({ ...item, _queryTag: t.name })
          added++
          if (fixtures.length >= LIMIT) break
        }
        if (page < 2) await sleep(DELAY_MS)
      }
      console.log(`→ ${added} queued`)
    } catch (e) {
      console.log(`→ error: ${e.message}`)
    }
    await sleep(DELAY_MS)
  }

  return fixtures
}

// ── Download a single IES file ─────────────────────────────────────────────

async function downloadIES(item) {
  const manuf = slugify(item.manufacturString ?? 'unknown')
  const model = slugify(item.luminaire ?? item.lumcat ?? item.hash)
  const hash8 = item.hash.slice(0, 8)
  const fname = `${manuf}-${model}-${hash8}.ies`
  const fpath = path.join(OUT_DIR, fname)

  if (fs.existsSync(fpath)) {
    return { fname, status: 'skipped' }
  }

  const dlUrl = `${BASE}/browse/download/ies/${item.hash}`
  const buf   = await get(dlUrl)

  // Sanity check: IES files must start with IESNA/;/TILT marker — reject HTML responses
  const preview = buf.toString('utf8', 0, 300)
  if (preview.match(/<!DOCTYPE|<html/i)) {
    throw new Error(`Server returned HTML page instead of IES file (download may require auth)`)
  }
  if (!preview.match(/IESNA|^\s*;|TILT\s*=/m)) {
    throw new Error(`Not a valid IES file (${buf.length} bytes, preview: ${preview.slice(0,60).replace(/\n/g,' ')})`)
  }

  fs.writeFileSync(fpath, buf)
  return { fname, status: 'downloaded', size: buf.length }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌐  IES File Downloader — ieslibrary.com')
  console.log(`   Limit   : ${LIMIT} files`)
  console.log(`   Out dir : ${OUT_DIR}`)
  console.log(`   Delay   : ${DELAY_MS}ms between requests\n`)

  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true })
    console.log(`   Created ${OUT_DIR}\n`)
  }

  // ── Phase 1: Collect fixture metadata ─────────────────────────────────────
  console.log('Phase 1: Collecting fixture metadata...\n')
  let fixtures
  try {
    fixtures = await collectFixtures()
  } catch (e) {
    console.error(`\n❌ Failed to collect fixtures: ${e.message}`)
    process.exit(1)
  }

  console.log(`\n   Total queued: ${fixtures.length} fixture(s)\n`)

  // ── Phase 2: Download IES files ───────────────────────────────────────────
  console.log('Phase 2: Downloading IES files...\n')

  let downloaded = 0, skipped = 0, errors = 0
  const errorLog = []

  for (let i = 0; i < fixtures.length; i++) {
    const item = fixtures[i]
    const prefix = `[${String(i + 1).padStart(3)}/${fixtures.length}]`
    const label  = `${item.manufacturString} / ${(item.luminaire ?? '').slice(0, 40)}`
    process.stdout.write(`${prefix} ${label.padEnd(55)} `)

    try {
      const result = await downloadIES(item)
      if (result.status === 'skipped') {
        process.stdout.write('⏭  already exists\n')
        skipped++
      } else {
        const kb = Math.round(result.size / 1024)
        process.stdout.write(`✅  ${result.fname} (${kb} KB)\n`)
        downloaded++
      }
    } catch (e) {
      process.stdout.write(`❌  ${e.message}\n`)
      errorLog.push({ item: label, error: e.message })
      errors++
    }

    if (i < fixtures.length - 1) await sleep(DELAY_MS)
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n── Summary ───────────────────────────────────────────────')
  console.log(`   Downloaded : ${downloaded}`)
  console.log(`   Skipped    : ${skipped} (already existed)`)
  console.log(`   Errors     : ${errors}`)
  console.log(`   Output     : ${OUT_DIR}`)

  if (errorLog.length > 0) {
    console.log('\n── Errors ────────────────────────────────────────────────')
    errorLog.forEach(e => console.log(`   ${e.item}: ${e.error}`))
  }

  if (downloaded > 0) {
    console.log('\n✅  Done. Now run the parser:')
    console.log('   node scripts/parse-ies-fixtures.cjs\n')
  } else if (skipped === fixtures.length) {
    console.log('\n✅  All files already downloaded.\n')
  }
}

main().catch(e => {
  console.error('\n❌ Fatal:', e.message)
  process.exit(1)
})
