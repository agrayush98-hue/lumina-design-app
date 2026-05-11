/**
 * yc-audit-agent.js
 * Runs the YC audit script and parses the result.
 * Output: { score, grade, critical, high, medium, low, passed, status: 'pass'|'fail' }
 */

import { spawnSync } from 'child_process'
import fs   from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname   = path.dirname(fileURLToPath(import.meta.url))
const REPORT_PATH = path.resolve(__dirname, '../../yc-audit-report.md')
const PASS_SCORE  = 80

function parseReport() {
  if (!fs.existsSync(REPORT_PATH)) return null
  const md = fs.readFileSync(REPORT_PATH, 'utf8')

  // Format: "Audit score: **82/100 (B)**"
  const scoreMatch = md.match(/Audit score:\s*\**(\d+)\/100\s*\(([A-F][+-]?)\)/i)
  const score   = parseInt(scoreMatch?.[1] ?? '0', 10)
  const grade   = scoreMatch?.[2] ?? '?'
  // Format: "## 🔴 CRITICAL ISSUES (0 found)"
  const critical = parseInt(md.match(/CRITICAL ISSUES?\s*\((\d+)/i)?.[1] ?? '0', 10)
  const high     = parseInt(md.match(/HIGH PRIORITY\s*\((\d+)/i)?.[1] ?? '0', 10)
  const medium   = parseInt(md.match(/MEDIUM PRIORITY\s*\((\d+)/i)?.[1] ?? '0', 10)
  const low      = parseInt(md.match(/LOW PRIORITY\s*\((\d+)/i)?.[1] ?? '0', 10)
  // Format: "## ✅ PASSED CHECKS (13)"
  const passed   = parseInt(md.match(/PASSED CHECKS?\s*\((\d+)/i)?.[1] ?? '0', 10)

  return { score, grade, critical, high, medium, low, passed }
}

export async function run(broadcast = () => {}) {
  broadcast('agent:log', { agent: 'yc-audit', message: 'Running YC audit…' })

  const result = spawnSync('node', ['scripts/yc-audit.js'], {
    encoding: 'utf8',
    stdio:    ['pipe', 'pipe', 'pipe'],
    cwd:      process.cwd(),
  })

  // Stream stdout lines as log events
  const lines = (result.stdout ?? '').split('\n').filter(Boolean)
  for (const line of lines) {
    broadcast('agent:log', { agent: 'yc-audit', message: line })
  }

  if (result.status !== 0 && result.status !== null) {
    broadcast('agent:log', { agent: 'yc-audit', message: `⚠ Audit exited with code ${result.status}` })
  }

  const parsed = parseReport()
  if (!parsed) {
    broadcast('agent:log', { agent: 'yc-audit', message: '⚠ Could not parse audit report.' })
    return { score: 0, grade: '?', critical: 0, high: 0, medium: 0, low: 0, passed: 0, status: 'fail' }
  }

  const status = parsed.score >= PASS_SCORE && parsed.critical === 0 ? 'pass' : 'fail'

  broadcast('agent:log', { agent: 'yc-audit',
    message: `Score: ${parsed.score}/100  Grade: ${parsed.grade}  Critical: ${parsed.critical}  → ${status.toUpperCase()}` })

  return { ...parsed, status }
}
