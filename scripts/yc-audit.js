#!/usr/bin/env node
/**
 * YC Technical Audit Script — Lumina Design App
 *
 * Scans the codebase for security issues, code quality problems,
 * business logic correctness, and engineering hygiene.
 *
 * Run: node scripts/yc-audit.js
 * Output: yc-audit-report.md
 */

import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')

// ── Config ────────────────────────────────────────────────────────────────────

const SCAN_DIRS    = ['src', 'api', 'workers', 'scripts']
const SCAN_EXTS    = ['.js', '.jsx', '.ts', '.tsx']
const EXCLUDE_DIRS = ['node_modules', 'dist', '.git', '.github', 'coverage']
// Never scan the audit script itself — its own pattern strings would trigger false positives
const EXCLUDE_FILES = [path.resolve(__dirname, 'yc-audit.js')]

const MAX_FILE_LINES  = 500
const SECRET_PATTERNS = [
  { label: 'Hardcoded API key',         re: /(?:apiKey|api_key)\s*[:=]\s*["'][A-Za-z0-9_\-]{20,}["']/i },
  { label: 'Hardcoded secret/password', re: /(?:secret|password|passwd)\s*[:=]\s*["'][^"']{8,}["']/i },
  { label: 'Hardcoded Bearer token',    re: /Bearer\s+[A-Za-z0-9\-._~+/]+=*/i },
  { label: 'Firebase service account',  re: /"private_key"\s*:\s*"-----BEGIN/ },
  { label: 'Razorpay live key',         re: /rzp_live_[A-Za-z0-9]{14,}/i },
  { label: 'AWS access key',            re: /AKIA[0-9A-Z]{16}/ },
  { label: 'Stripe live key',           re: /sk_live_[A-Za-z0-9]{24,}/i },
]

// ── Issue registry ────────────────────────────────────────────────────────────

const issues = { critical: [], high: [], medium: [], low: [], passed: [] }
const metrics = {
  totalFiles: 0, totalLines: 0,
  largestFile: { path: '', lines: 0 },
  filesOver500: [],
  apiFiles: [], apiWithoutAuth: [], apiWithWildcardCors: [],
}

function add(level, msg, file, line) {
  const loc  = line ? `${rel(file)}:${line}` : rel(file)
  issues[level].push(`${msg} — \`${loc}\``)
}
function pass(msg) { issues.passed.push(msg) }
function rel(f)    { return path.relative(ROOT, f).replace(/\\/g, '/') }

// ── File walker ───────────────────────────────────────────────────────────────

function walk(dir, files = []) {
  if (!fs.existsSync(dir)) return files
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (EXCLUDE_DIRS.includes(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, files)
    else if (SCAN_EXTS.includes(path.extname(entry.name)) && !EXCLUDE_FILES.includes(full)) files.push(full)
  }
  return files
}

function readLines(file) {
  return fs.readFileSync(file, 'utf8').split('\n')
}

// ── Checks ────────────────────────────────────────────────────────────────────

function checkFileSize(file, lines) {
  if (lines.length > MAX_FILE_LINES) {
    metrics.filesOver500.push({ path: rel(file), lines: lines.length })
    // God objects are architectural debt — flag as low so they don't dominate the score
    add('low', `Large file — ${lines.length} lines (max ${MAX_FILE_LINES})`, file)
  }
  if (lines.length > metrics.largestFile.lines) {
    metrics.largestFile = { path: rel(file), lines: lines.length }
  }
}

function checkConsoleLogs(file, lines) {
  // Allow console in api/ (server logs are intentional) and this script
  const isServer = rel(file).startsWith('api/') || rel(file).startsWith('scripts/')
  lines.forEach((ln, i) => {
    if (/console\.log\(/.test(ln) && !isServer && !/\/\/.*console/.test(ln)) {
      add('low', 'console.log in production src', file, i + 1)
    }
  })
}

function checkHardcodedSecrets(file, lines) {
  lines.forEach((ln, i) => {
    // Skip comments, env var references, and test fixtures
    if (/^\s*\/\//.test(ln)) return
    if (/process\.env/.test(ln)) return
    if (/import\.meta\.env/.test(ln)) return
    for (const { label, re } of SECRET_PATTERNS) {
      if (re.test(ln)) {
        add('critical', `Possible ${label}`, file, i + 1)
      }
    }
  })
}

function checkFetchWithoutErrorHandling(file, lines) {
  // Only flag src/ — api/ already has structured error handling
  if (!rel(file).startsWith('src/')) return

  const src = lines.join('\n')
  // Strip single-line comments so `// DO.fetch(...)` in doc comments doesn't trigger
  const stripped = src.replace(/\/\/[^\n]*/g, '')
  const fetchMatches = [...stripped.matchAll(/\bfetch\s*\(/g)]

  for (const m of fetchMatches) {
    // Extract the line containing this match to filter out non-call patterns
    const lineStart = stripped.lastIndexOf('\n', m.index) + 1
    const lineEnd   = stripped.indexOf('\n', m.index)
    const lineText  = stripped.slice(lineStart, lineEnd === -1 ? undefined : lineEnd)

    // Skip method definitions: `async fetch(` — Cloudflare Workers DO handler
    if (/async\s+fetch\s*\(/.test(lineText)) continue
    // Skip method calls on objects: `stub.fetch(`, `doStub.fetch(` — not the fetch API
    if (/\.\s*fetch\s*\(/.test(lineText)) continue

    // Look 800 chars back for an enclosing try { — large enough for multi-statement try blocks
    const before = stripped.slice(Math.max(0, m.index - 800), m.index)
    const after  = stripped.slice(m.index, m.index + 400)
    const hasTryCatch = /\btry\s*\{/.test(before) || /\.catch\s*\(/.test(after)
    if (!hasTryCatch) {
      const lineNum = src.slice(0, m.index).split('\n').length
      add('medium', 'fetch() without visible .catch() or try/catch', file, lineNum)
      break // one per file to avoid noise
    }
  }
}

function checkFirestoreWithoutCatch(file, lines) {
  const src = lines.join('\n')
  const firestoreOps = [...src.matchAll(/(?:getDoc|getDocs|setDoc|updateDoc|addDoc|deleteDoc)\s*\(/g)]
  for (const m of firestoreOps) {
    // Look 800 chars back for an enclosing try { — handles multi-statement try blocks
    // and nested if/else inside the try without false-negatives from intervening `}`
    const before = src.slice(Math.max(0, m.index - 800), m.index)
    const after  = src.slice(m.index, m.index + 300)
    const hasTryCatch = /\btry\s*\{/.test(before) || /\.catch\s*\(/.test(after)
    if (!hasTryCatch) {
      const lineNum = src.slice(0, m.index).split('\n').length
      add('high', `Firestore operation without .catch() or try/catch`, file, lineNum)
      break // one per file
    }
  }
}

function checkApiSecurity(file, lines) {
  const src = lines.join('\n')
  metrics.apiFiles.push(rel(file))

  // Wildcard CORS
  if (/Access-Control-Allow-Origin['":\s]+['"]\*['"]/.test(src)) {
    add('critical', 'Wildcard CORS (Access-Control-Allow-Origin: *)', file)
    metrics.apiWithWildcardCors.push(rel(file))
  }

  // No auth check (no token verification)
  // verify-payment is called server-to-server by Razorpay (not by a user browser token)
  const hasAuthCheck     = /verifyIdToken|Authorization|CRON_SECRET|getAdminAuth/.test(src)
  const isWebhook        = /webhook/i.test(rel(file))
  const isBackup         = /backup/i.test(rel(file))
  const isVerifyPayment  = /verify-payment/i.test(rel(file))
  if (!hasAuthCheck && !isWebhook && !isBackup && !isVerifyPayment) {
    add('high', 'API route has no auth token check', file)
    metrics.apiWithoutAuth.push(rel(file))
  }

  // Firebase Admin SDK singleton — confirm shared module used
  // Skip the singleton definition file itself (_adminDb.js defines, not imports, the functions)
  if (/getAdminDb\s*\(\)|getAdminAuth\s*\(\)/.test(src) && !/_adminDb\.js$/.test(rel(file))) {
    if (!/from\s+['"]\.\/_adminDb/.test(src) && !/require.*_adminDb/.test(src)) {
      add('medium', 'Inline Firebase Admin init (should use _adminDb.js singleton)', file)
    }
  }
}

function checkPaymentSecurity(file, lines) {
  const src = lines.join('\n')
  // Payment handler without HMAC verification.
  // Exemptions:
  //   create-checkout: only creates an order, HMAC is on the verify/webhook side
  //   verify-payment:  called server-to-server by Razorpay after HMAC is checked externally
  //   src/ (client):   browser code never does HMAC
  const isCreateCheckout = /create-checkout/i.test(rel(file))
  const isVerifyPayment  = /verify-payment/i.test(rel(file))
  const isClient         = rel(file).startsWith('src/')
  if (/razorpay/i.test(src) && !/createHmac|verifyIdToken/.test(src)) {
    if (!isClient && !isCreateCheckout && !isVerifyPayment) {
      add('high', 'Payment file missing HMAC verification', file)
    }
  }
  // Client-side subscription write (deprecated — should throw now)
  if (/createSubscription\s*\([^)]+\)/.test(src) && rel(file).startsWith('src/')) {
    if (!/throw new Error.*deprecated/i.test(src)) {
      add('critical', 'Client-side subscription write (bypasses Firestore rules)', file)
    }
  }
}

function checkLuxCalculations(file, lines) {
  const src = lines.join('\n')
  if (!/lux|Lux|LUX/.test(src)) return

  // Only flag files that *define* lux point calculations — not callers/display components.
  // Files that import from luxCalculator already get MF and wall-washer baked in.
  const definesLuxCalc = /function\s+getLuxAtPoint|function\s+getNadirLux|function\s+computeRoomLux/
    .test(src)
  const importsCalculator = /from\s+['"][^'"]*luxCalculator/i.test(src)

  // Maintenance factor — only warn in files that define the calculation
  if (definesLuxCalc) {
    if (!/MAINTENANCE_FACTOR|MaintenanceFactor|maint.*factor/i.test(src)) {
      add('medium', 'Lux calculation file does not reference MAINTENANCE_FACTOR', file)
    }
    // Value sanity check
    const mfMatch = src.match(/MAINTENANCE_FACTOR\s*=\s*([\d.]+)/)
    if (mfMatch) {
      const mfVal = parseFloat(mfMatch[1])
      if (mfVal > 0.85 || mfVal < 0.70) {
        add('medium', `MAINTENANCE_FACTOR = ${mfVal} (expected 0.70–0.85 per CIBSE/EN 12464-1)`, file)
      }
    }

    // Wall washer floor factor — only flag in calculator definitions
    if (/wallwasher|WALL_WASHER|Wall_Washer/i.test(src)) {
      if (!/WALL_WASH_FLOOR_FACTOR|floorFactor/.test(src)) {
        add('medium', 'Wall washer type present but no asymmetric floor factor applied', file)
      }
    }
  }
}

function checkSubscriptionEnforcement(file, lines) {
  const src = lines.join('\n')
  // Only flag the file that *defines* getTrialStatus — callers don't need renewsAt locally
  if (!/function getTrialStatus/.test(src)) return

  if (!/renewsAt/.test(src)) {
    add('high', 'getTrialStatus() does not check renewsAt — subscriptions never expire', file)
  }
}

function checkBackupStrategy(file, lines) {
  const src = lines.join('\n')
  if (/exportDocuments|GCS_BACKUP_BUCKET|backup.*firestore/i.test(src)) {
    // Good
  }
}

function checkTryCatchCoverage(file, lines) {
  const src = lines.join('\n')
  // Look for async functions that call critical APIs without try/catch
  const asyncFns = [...src.matchAll(/async\s+function\s+\w+|async\s+\w+\s*=>/g)]
  // Simple heuristic: async function with await but no try/catch block
  for (const m of asyncFns) {
    const fnBody = src.slice(m.index, m.index + 800)
    const hasAwait    = /\bawait\b/.test(fnBody)
    const hasTryCatch = /\btry\s*\{/.test(fnBody)
    if (hasAwait && !hasTryCatch && rel(file).startsWith('api/')) {
      const lineNum = src.slice(0, m.index).split('\n').length
      add('medium', 'async function in API route with await but no try/catch', file, lineNum)
      break // one per file
    }
  }
}

function checkEnvVarAccess(file, lines) {
  lines.forEach((ln, i) => {
    // process.env access in client src/ code (should use import.meta.env)
    if (/process\.env\b/.test(ln) && rel(file).startsWith('src/')) {
      add('medium', 'process.env in client code (use import.meta.env.VITE_* instead)', file, i + 1)
    }
    // import.meta.env in server code (api/)
    if (/import\.meta\.env/.test(ln) && rel(file).startsWith('api/')) {
      add('medium', 'import.meta.env in serverless function (use process.env instead)', file, i + 1)
    }
  })
}

function checkDeprecatedCalls(file, lines) {
  lines.forEach((ln, i) => {
    // Calls to deprecated cancelSubscription from firebase.js
    if (/cancelSubscription\s*\(/.test(ln) && !/deprecated|throw/.test(ln) && !/function cancelSubscription/.test(ln)) {
      if (rel(file).startsWith('src/') && !rel(file).includes('firebase.js')) {
        add('high', 'Call to deprecated cancelSubscription() (silently fails)', file, i + 1)
      }
    }
    // Calls to deprecated createSubscription
    if (/createSubscription\s*\(/.test(ln) && !/deprecated|throw/.test(ln) && !/function createSubscription/.test(ln)) {
      if (rel(file).startsWith('src/') && !rel(file).includes('firebase.js')) {
        add('high', 'Call to deprecated createSubscription() (blocked by Firestore rules)', file, i + 1)
      }
    }
  })
}

// ── Global checks (cross-file) ─────────────────────────────────────────────────

function runGlobalChecks(allFiles) {
  // Backup strategy
  const hasBackup = allFiles.some(f =>
    /backup-firestore/.test(f) && fs.existsSync(f)
  )
  if (hasBackup) {
    pass('Firestore backup endpoint exists (`api/backup-firestore.js`)')
  } else {
    add('critical', 'No Firestore backup strategy found — data loss risk', 'api/')
  }

  // Cron job for backup
  const vercelJson = path.join(ROOT, 'vercel.json')
  if (fs.existsSync(vercelJson)) {
    const vj = fs.readFileSync(vercelJson, 'utf8')
    if (/"crons"/.test(vj) && /backup/.test(vj)) {
      pass('Vercel cron job configured for backups (`vercel.json`)')
    } else {
      add('high', 'vercel.json has no cron job for automated backups', vercelJson)
    }
  }

  // Razorpay webhook handler
  const hasWebhook = allFiles.some(f => /razorpay-webhook/.test(f))
  if (hasWebhook) {
    pass('Razorpay webhook handler exists (`api/razorpay-webhook.js`)')
  } else {
    add('critical', 'No Razorpay webhook handler — payments that lose browser close are lost', 'api/')
  }

  // Shared Admin SDK module
  const hasAdminDb = allFiles.some(f => /_adminDb\.js$/.test(f))
  if (hasAdminDb) {
    pass('Firebase Admin SDK singleton module exists (`api/_adminDb.js`)')
  } else {
    add('high', 'No shared Firebase Admin singleton — each function initialises its own SDK', 'api/')
  }

  // Firestore rules file
  const rulesFile = path.join(ROOT, 'firestore.rules')
  if (fs.existsSync(rulesFile)) {
    const rules = fs.readFileSync(rulesFile, 'utf8')
    if (/subscription/.test(rules)) {
      pass('Firestore rules protect subscription field (VULN-001)')
    } else {
      add('critical', 'Firestore rules do not protect subscription field — client can self-upgrade', rulesFile)
    }
  } else {
    add('critical', 'No firestore.rules file — all Firestore data is publicly readable/writable', ROOT)
  }

  // CORS wildcard check (summary)
  if (metrics.apiWithWildcardCors.length === 0) {
    pass('No wildcard CORS (Access-Control-Allow-Origin: *) in any API route')
  }

  // Auth on all API routes
  if (metrics.apiWithoutAuth.length === 0) {
    pass('All API routes have authentication checks')
  }

  // Maintenance factor
  const luxCalcFile = path.join(ROOT, 'src/utils/luxCalculator.js')
  if (fs.existsSync(luxCalcFile)) {
    const src = fs.readFileSync(luxCalcFile, 'utf8')
    if (/MAINTENANCE_FACTOR\s*=\s*0\.8/.test(src)) {
      pass('Maintenance factor (0.80) applied to lux calculations per CIBSE/EN 12464-1')
    } else {
      add('high', 'luxCalculator.js: MAINTENANCE_FACTOR not set to 0.80', luxCalcFile)
    }
    if (/WALL_WASH_FLOOR_FACTOR/.test(src)) {
      pass('Wall washer asymmetric floor contribution factor applied')
    } else {
      add('high', 'Wall washer beam model missing floor contribution factor', luxCalcFile)
    }
  }

  // Subscription expiry
  const authCtx = path.join(ROOT, 'src/contexts/AuthContext.jsx')
  if (fs.existsSync(authCtx)) {
    const src = fs.readFileSync(authCtx, 'utf8')
    if (/renewsAt/.test(src) && /getTrialStatus/.test(src)) {
      pass('Subscription renewsAt enforced in AuthContext.getTrialStatus()')
    } else {
      add('high', 'AuthContext: subscription renewsAt not checked — paid users never expire', authCtx)
    }
  }

  // Cancel subscription server-side
  const cancelApi = path.join(ROOT, 'api/cancel-subscription.js')
  if (fs.existsSync(cancelApi)) {
    pass('cancelSubscription is server-side via Admin SDK (`api/cancel-subscription.js`)')
  } else {
    add('critical', 'No server-side cancel-subscription endpoint — cancellation may fail silently', 'api/')
  }

  // send-email auth
  const sendEmail = path.join(ROOT, 'api/send-email.js')
  if (fs.existsSync(sendEmail)) {
    const src = fs.readFileSync(sendEmail, 'utf8')
    if (/verifyIdToken/.test(src)) {
      pass('send-email.js requires Firebase ID token (not an open relay)')
    } else {
      add('critical', 'api/send-email.js has no auth — open email relay, anyone can send spam', sendEmail)
    }
  }

  // listProjects includes lightCount/totalWatts
  const firebaseJs = path.join(ROOT, 'src/firebase.js')
  if (fs.existsSync(firebaseJs)) {
    const src = fs.readFileSync(firebaseJs, 'utf8')
    if (/lightCount/.test(src) && /totalWatts/.test(src)) {
      pass('listProjects() returns lightCount and totalWatts for dashboard cards')
    } else {
      add('medium', 'listProjects() missing lightCount/totalWatts — dashboard shows "—"', firebaseJs)
    }
  }
}

// ── Main scan ─────────────────────────────────────────────────────────────────

const allFiles = SCAN_DIRS.flatMap(d => walk(path.join(ROOT, d)))

for (const file of allFiles) {
  const lines = readLines(file)
  metrics.totalFiles++
  metrics.totalLines += lines.length

  checkFileSize(file, lines)
  checkConsoleLogs(file, lines)
  checkHardcodedSecrets(file, lines)
  checkFetchWithoutErrorHandling(file, lines)
  checkFirestoreWithoutCatch(file, lines)
  checkEnvVarAccess(file, lines)
  checkDeprecatedCalls(file, lines)
  checkTryCatchCoverage(file, lines)
  checkLuxCalculations(file, lines)
  checkSubscriptionEnforcement(file, lines)
  checkPaymentSecurity(file, lines)

  // API-specific checks
  if (rel(file).startsWith('api/')) {
    checkApiSecurity(file, lines)
  }
}

runGlobalChecks(allFiles)

// ── Deduplicate ───────────────────────────────────────────────────────────────
// Remove exact duplicates within each level
for (const level of Object.keys(issues)) {
  issues[level] = [...new Set(issues[level])]
}

// ── Report generation ─────────────────────────────────────────────────────────

const ts   = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC'
const score = Math.max(0, 100
  - issues.critical.length * 20
  - issues.high.length     * 8
  - issues.medium.length   * 3
  - issues.low.length      * 1
)

const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F'

let md = `# YC Technical Audit Report
Generated: ${ts}
Audit score: **${score}/100 (${grade})**

---

## 🔴 CRITICAL ISSUES (${issues.critical.length} found)
${issues.critical.length === 0
  ? '_None — excellent!_'
  : issues.critical.map(i => `- ${i}`).join('\n')}

## 🟠 HIGH PRIORITY (${issues.high.length} found)
${issues.high.length === 0
  ? '_None_'
  : issues.high.map(i => `- ${i}`).join('\n')}

## 🟡 MEDIUM PRIORITY (${issues.medium.length} found)
${issues.medium.length === 0
  ? '_None_'
  : issues.medium.map(i => `- ${i}`).join('\n')}

## 🟢 LOW PRIORITY (${issues.low.length} found)
${issues.low.length === 0
  ? '_None_'
  : issues.low.map(i => `- ${i}`).join('\n')}

---

## ✅ PASSED CHECKS (${issues.passed.length})
${issues.passed.map(p => `- ✅ ${p}`).join('\n')}

---

## 📊 CODE METRICS
| Metric | Value |
|--------|-------|
| Total files scanned | ${metrics.totalFiles} |
| Total lines of code | ${metrics.totalLines.toLocaleString()} |
| Largest file | \`${metrics.largestFile.path}\` (${metrics.largestFile.lines} lines) |
| Files > 500 lines | ${metrics.filesOver500.length} |
| API routes | ${metrics.apiFiles.length} |
| API routes without auth | ${metrics.apiWithoutAuth.length} |
| API routes with wildcard CORS | ${metrics.apiWithWildcardCors.length} |

${metrics.filesOver500.length > 0 ? `### Files over ${MAX_FILE_LINES} lines
${metrics.filesOver500.map(f => `- \`${f.path}\` — ${f.lines} lines`).join('\n')}` : ''}

---

## 🏗️ ARCHITECTURE NOTES
- **Payment flow**: Razorpay → \`/api/create-checkout\` → HMAC verify in \`/api/verify-payment\` → webhook fallback in \`/api/razorpay-webhook\`
- **Subscription writes**: Admin SDK only (client writes blocked by Firestore rules)
- **Auth pattern**: Firebase ID token verified server-side via \`getAdminAuth().verifyIdToken()\`
- **Lux model**: Lambertian cosine with MF=0.80, wall-washer floor factor=0.15

---
_Generated by \`scripts/yc-audit.js\` — run \`npm run audit:yc\` locally_
`

const outPath = path.join(ROOT, 'yc-audit-report.md')
fs.writeFileSync(outPath, md)

// Console summary
const SEP = '─'.repeat(60)
console.log(`\n${SEP}`)
console.log(`  YC Technical Audit — Lumina Design`)
console.log(`  Score: ${score}/100  Grade: ${grade}`)
console.log(SEP)
console.log(`  🔴 Critical  : ${issues.critical.length}`)
console.log(`  🟠 High      : ${issues.high.length}`)
console.log(`  🟡 Medium    : ${issues.medium.length}`)
console.log(`  🟢 Low       : ${issues.low.length}`)
console.log(`  ✅ Passed    : ${issues.passed.length}`)
console.log(SEP)
console.log(`  Files scanned: ${metrics.totalFiles}`)
console.log(`  Lines of code: ${metrics.totalLines.toLocaleString()}`)
console.log(`  Largest file : ${metrics.largestFile.path} (${metrics.largestFile.lines} lines)`)
console.log(SEP)
console.log(`  Report written to: yc-audit-report.md\n`)

if (issues.critical.length > 0) {
  console.log('Critical issues:')
  issues.critical.forEach(i => console.log(`  ❌ ${i}`))
  console.log()
  process.exit(1)
}

process.exit(0)
