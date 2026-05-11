/**
 * code-review-agent.js
 * Checks staged files for code quality issues.
 * Output: { issues, filesChecked, status: 'pass'|'fail' }
 */

import { execSync, spawnSync } from 'child_process'
import fs   from 'fs'
import path from 'path'

// Patterns that indicate a hardcoded secret
const SECRET_PATTERNS = [
  { re: /(['"`])sk_(live|test)_[A-Za-z0-9]{20,}\1/,         label: 'Stripe secret key' },
  { re: /(['"`])rk_(live|test)_[A-Za-z0-9]{20,}\1/,         label: 'Stripe restricted key' },
  { re: /(['"`])AKIA[0-9A-Z]{16}\1/,                         label: 'AWS access key' },
  { re: /(['"`])AIza[0-9A-Za-z\-_]{35}\1/,                   label: 'Google API key' },
  { re: /(['"`])ghp_[A-Za-z0-9]{36}\1/,                      label: 'GitHub personal token' },
  { re: /(['"`])xoxb-[0-9]{11}-[0-9]{11}-[A-Za-z0-9]{24}\1/,label: 'Slack bot token' },
  { re: /password\s*[:=]\s*(['"`])[^\1]{6,}\1/i,             label: 'Hardcoded password' },
  { re: /api_?key\s*[:=]\s*(['"`])[^\1]{8,}\1/i,             label: 'Hardcoded API key' },
]

// Files/dirs to skip entirely
const SKIP_PATTERNS = [
  /node_modules/,
  /\.env/,
  /dist\//,
  /\.min\.[jt]s$/,
  /yc-audit-report/,
  /package-lock\.json/,
]

function getStagedFiles() {
  try {
    const out = execSync('git diff --cached --name-only --diff-filter=ACMR', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    }).trim()
    return out ? out.split('\n').filter(Boolean) : []
  } catch {
    return []
  }
}

function shouldSkip(file) {
  return SKIP_PATTERNS.some(p => p.test(file))
}

function checkFile(filepath) {
  const issues = []
  let src
  try {
    src = fs.readFileSync(filepath, 'utf8')
  } catch {
    return issues
  }

  const lines = src.split('\n')
  lines.forEach((line, i) => {
    const lineNo = i + 1
    const trimmed = line.trim()

    // Skip comment lines (we stripped these in audit but still flag them here)
    const isComment = trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('#')

    // console.log detection — skip legitimate suppressions and server-side logs
    if (!isComment && /console\.(log|debug|info)\s*\(/.test(line)) {
      // Allow in scripts/ and api/ if it's a console.error/warn (legitimate server logs)
      const isServer = /^(scripts|api)\//.test(filepath)
      if (!isServer) {
        issues.push({ type: 'console', severity: 'low', file: filepath, line: lineNo,
          message: `console.log on line ${lineNo}` })
      }
    }

    // TODO / FIXME / HACK comments
    if (/\b(TODO|FIXME|HACK|XXX)\b/.test(line)) {
      issues.push({ type: 'todo', severity: 'info', file: filepath, line: lineNo,
        message: `${line.match(/\b(TODO|FIXME|HACK|XXX)\b/)[0]} comment on line ${lineNo}` })
    }

    // Hardcoded secrets
    for (const { re, label } of SECRET_PATTERNS) {
      if (re.test(line)) {
        issues.push({ type: 'secret', severity: 'critical', file: filepath, line: lineNo,
          message: `Possible ${label} on line ${lineNo}` })
      }
    }
  })

  return issues
}

function runEslint(files) {
  const jsFiles = files.filter(f => /\.[jt]sx?$/.test(f) && !shouldSkip(f))
  if (!jsFiles.length) return []

  const result = spawnSync(
    'npx', ['eslint', '--format=json', '--max-warnings=0', ...jsFiles],
    { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
  )

  const issues = []
  if (!result.stdout) return issues

  let parsed
  try { parsed = JSON.parse(result.stdout) } catch { return issues }

  for (const fileResult of parsed) {
    const rel = path.relative(process.cwd(), fileResult.filePath)
    for (const msg of fileResult.messages) {
      issues.push({
        type:     'eslint',
        severity: msg.severity === 2 ? 'error' : 'warning',
        file:     rel,
        line:     msg.line,
        message:  `ESLint [${msg.ruleId ?? 'rule'}] ${msg.message} (line ${msg.line})`,
      })
    }
  }
  return issues
}

export async function run(broadcast = () => {}) {
  broadcast('agent:log', { agent: 'code-review', message: 'Starting code review…' })

  const staged = getStagedFiles()
  const reviewable = staged.filter(f =>
    !shouldSkip(f) && fs.existsSync(f) && /\.[jt]sx?$|\.css$|\.json$/.test(f)
  )

  broadcast('agent:log', { agent: 'code-review', message: `Staged files: ${staged.length} total, ${reviewable.length} reviewable` })

  if (!reviewable.length) {
    broadcast('agent:log', { agent: 'code-review', message: 'No reviewable files staged.' })
    return { issues: [], filesChecked: [], status: 'pass' }
  }

  const allIssues = []

  // Per-file checks
  for (const file of reviewable) {
    broadcast('agent:log', { agent: 'code-review', message: `Checking ${file}` })
    const fileIssues = checkFile(file)
    allIssues.push(...fileIssues)
  }

  // ESLint pass
  broadcast('agent:log', { agent: 'code-review', message: 'Running ESLint…' })
  const eslintIssues = runEslint(reviewable)
  allIssues.push(...eslintIssues)

  const critical = allIssues.filter(i => i.severity === 'critical')
  const errors   = allIssues.filter(i => i.severity === 'error')
  const status   = (critical.length > 0 || errors.length > 0) ? 'fail' : 'pass'

  broadcast('agent:log', { agent: 'code-review',
    message: `Done — ${allIssues.length} issues (${critical.length} critical, ${errors.length} errors)` })

  return { issues: allIssues, filesChecked: reviewable, status }
}
