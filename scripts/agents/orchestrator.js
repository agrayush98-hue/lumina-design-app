#!/usr/bin/env node
/**
 * orchestrator.js
 * Runs all agents sequentially, serves the real-time dashboard,
 * and exits 0 (approve) or 1 (reject).
 *
 * Usage:
 *   node scripts/agents/orchestrator.js            # normal run
 *   node scripts/agents/orchestrator.js --no-open  # skip browser open
 */

import { execSync } from 'child_process'
import { startServer, stopServer, broadcast } from './dashboard-server.js'
import { run as runCodeReview } from './code-review-agent.js'
import { run as runAutoFix    } from './auto-fix-agent.js'
import { run as runYcAudit    } from './yc-audit-agent.js'

const NO_OPEN = process.argv.includes('--no-open')

// ── Helpers ───────────────────────────────────────────────────────────────────

function openBrowser(url) {
  try {
    const cmd = process.platform === 'win32' ? `start "" "${url}"`
              : process.platform === 'darwin' ? `open "${url}"`
              : `xdg-open "${url}"`
    execSync(cmd, { stdio: 'ignore' })
  } catch {}
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function log(msg) {
  process.stdout.write(`\n  ${msg}\n`)
}

// ── Agent runner wrapper ──────────────────────────────────────────────────────

async function runAgent(id, label, fn, ...args) {
  broadcast('agent:start', { agent: id, label })
  log(`▶  ${label}`)
  try {
    const result = await fn(...args, (type, payload) => broadcast(type, payload))
    broadcast('agent:done', { agent: id, label, result })
    log(`${result.status === 'fail' ? '✗' : '✓'}  ${label} — ${result.status?.toUpperCase() ?? 'DONE'}`)
    return result
  } catch (err) {
    const result = { status: 'fail', error: err.message }
    broadcast('agent:done', { agent: id, label, result })
    log(`✗  ${label} — ERROR: ${err.message}`)
    return result
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // Start dashboard server
  const url = await startServer()
  broadcast('orchestrator:start', { agents: ['code-review', 'auto-fix', 'yc-audit'] })

  if (!NO_OPEN) {
    // Brief pause so the server is ready before the browser hits it
    await sleep(300)
    openBrowser(url)
    log(`Dashboard: ${url}`)
    // Give browser time to connect before first agent fires
    await sleep(800)
  }

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  log('  Lumina CI/CD — Agent Pipeline')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

  // ── Agent 1: Code Review ──────────────────────────────────────────────────
  const reviewResult = await runAgent(
    'code-review', 'Code Review Agent',
    runCodeReview,
  )

  // ── Agent 2: Auto Fix ─────────────────────────────────────────────────────
  const fixResult = await runAgent(
    'auto-fix', 'Auto-Fix Agent',
    runAutoFix, reviewResult,
  )

  // If auto-fix changed files, re-run review to confirm clean
  let finalReview = reviewResult
  if (fixResult.applied) {
    log('  Auto-fix applied changes — re-running code review…')
    broadcast('agent:log', { agent: 'code-review', message: 'Re-running after auto-fix…' })
    finalReview = await runAgent(
      'code-review', 'Code Review (post-fix)',
      runCodeReview,
    )
  }

  // ── Agent 3: YC Audit ─────────────────────────────────────────────────────
  const auditResult = await runAgent(
    'yc-audit', 'YC Audit Agent',
    runYcAudit,
  )

  // ── Final Decision ────────────────────────────────────────────────────────
  const criticalSecrets = (finalReview.issues ?? []).filter(i => i.severity === 'critical')
  const reviewFailed    = finalReview.status === 'fail'
  const auditFailed     = auditResult.status === 'fail'

  const approved = !reviewFailed && !auditFailed

  const decision = {
    approved,
    reason: approved
      ? 'All checks passed'
      : [
          reviewFailed  ? `Code review failed (${criticalSecrets.length} critical)` : '',
          auditFailed   ? `YC audit failed (score ${auditResult.score}/100)` : '',
        ].filter(Boolean).join(' | '),
    review:  finalReview,
    autoFix: fixResult,
    audit:   auditResult,
  }

  broadcast('orchestrator:decision', decision)

  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  if (approved) {
    log('  ✅  APPROVED — commit allowed')
  } else {
    log('  ❌  REJECTED — fix issues before committing')
    log(`      Reason: ${decision.reason}`)
  }
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

  // Keep server alive briefly so dashboard can render the final state
  await sleep(NO_OPEN ? 0 : 3000)
  await stopServer()

  process.exit(approved ? 0 : 1)
}

main().catch(err => {
  console.error('[orchestrator] fatal:', err.message)
  stopServer().then(() => process.exit(1))
})
