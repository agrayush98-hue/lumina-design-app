/**
 * auto-fix-agent.js
 * Applies safe automatic fixes to staged files based on code-review-agent output.
 * Only touches files that have fixable issues; re-stages them after fixing.
 * Output: { fixed: [], skipped: [], applied: true|false }
 */

import { execSync } from 'child_process'
import fs   from 'fs'
import path from 'path'

// Fixable issue types and their handlers
// Each handler receives (src: string, issues: Issue[]) and returns new src or null
const FIXERS = {
  console: (src) => {
    // Remove standalone console.log / console.debug / console.info lines
    // Preserves console.error and console.warn (intentional server logs)
    return src
      .split('\n')
      .filter(line => !/^\s*console\.(log|debug|info)\s*\(/.test(line))
      .join('\n')
  },
}

function restage(filepath) {
  try {
    execSync(`git add "${filepath}"`, { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

export async function run(reviewResult, broadcast = () => {}) {
  broadcast('agent:log', { agent: 'auto-fix', message: 'Starting auto-fix pass…' })

  const { issues = [] } = reviewResult
  const fixable = issues.filter(i => FIXERS[i.type])

  if (!fixable.length) {
    broadcast('agent:log', { agent: 'auto-fix', message: 'Nothing to auto-fix.' })
    return { fixed: [], skipped: [], applied: false }
  }

  // Group fixable issues by file
  const byFile = {}
  for (const issue of fixable) {
    if (!byFile[issue.file]) byFile[issue.file] = []
    byFile[issue.file].push(issue)
  }

  const fixed   = []
  const skipped = []

  for (const [filepath, fileIssues] of Object.entries(byFile)) {
    if (!fs.existsSync(filepath)) {
      skipped.push(filepath)
      continue
    }

    let src = fs.readFileSync(filepath, 'utf8')
    const original = src
    const types = [...new Set(fileIssues.map(i => i.type))]

    for (const type of types) {
      if (FIXERS[type]) {
        broadcast('agent:log', { agent: 'auto-fix', message: `Fixing [${type}] in ${filepath}` })
        src = FIXERS[type](src, fileIssues.filter(i => i.type === type))
      }
    }

    if (src !== original) {
      try {
        fs.writeFileSync(filepath, src, 'utf8')
        const restaged = restage(filepath)
        fixed.push({ file: filepath, types, restaged })
        broadcast('agent:log', { agent: 'auto-fix',
          message: `✓ Fixed ${types.join(', ')} in ${path.basename(filepath)}${restaged ? ' (re-staged)' : ''}` })
      } catch (err) {
        skipped.push(filepath)
        broadcast('agent:log', { agent: 'auto-fix', message: `⚠ Could not write ${filepath}: ${err.message}` })
      }
    } else {
      broadcast('agent:log', { agent: 'auto-fix', message: `No changes needed in ${path.basename(filepath)}` })
    }
  }

  broadcast('agent:log', { agent: 'auto-fix',
    message: `Done — ${fixed.length} file(s) fixed, ${skipped.length} skipped` })

  return { fixed, skipped, applied: fixed.length > 0 }
}
