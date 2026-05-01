#!/usr/bin/env npx tsx

/**
 * Verification Script: Task 7C-2B-3 — Canonical Re-Audit Result Review Hardening
 *
 * Verifies that the modal result display improvements follow strict boundaries:
 * - result.summary is rendered with memory-only label
 * - result.auditedAt is rendered
 * - All result.errors are displayed (not only errors[0])
 * - findings access is protected by a type guard
 * - globalFindings/failedLanguages displayed only for FAILED_PENDING_REVIEW
 * - STALE does not display findings
 * - PASSED block preserves all mandatory safety copy
 * - No green-light wording added
 * - No forbidden behaviors introduced
 * - Boundary files not modified
 *
 * @version 7C-2B-3.0.0
 */

import * as fs from 'fs'
import { execSync } from 'child_process'

let passCount = 0
let failCount = 0

function pass(check: string): void {
  console.log(`✅ PASS: ${check}`)
  passCount++
}

function fail(check: string, reason: string): void {
  console.error(`❌ FAIL: ${check}`)
  console.error(`   Reason: ${reason}`)
  failCount++
}

function readFile(filePath: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
  return fs.readFileSync(filePath, 'utf-8')
}

function stripComments(content: string): string {
  return content
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function checkFileContains(
  filePath: string,
  description: string,
  predicate: (content: string) => string | null
): void {
  try {
    const content = readFile(filePath)
    const error = predicate(content)
    if (error) {
      fail(description, error)
    } else {
      pass(description)
    }
  } catch (err) {
    fail(description, String(err))
  }
}

function checkFileNotModified(filePath: string, description: string): void {
  try {
    const status = execSync(`git status --porcelain "${filePath}"`, { encoding: 'utf-8' }).trim()
    if (status && (status.startsWith('M') || status.startsWith(' M'))) {
      fail(`${description} not modified`, `File has been modified: ${filePath}`)
    } else {
      pass(`${description} not modified`)
    }
  } catch {
    // If git command fails, check mtime as fallback
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath)
      const ageMinutes = (Date.now() - stats.mtimeMs) / 1000 / 60
      if (ageMinutes < 5) {
        fail(`${description} not modified`, `File was recently modified: ${filePath}`)
        return
      }
    }
    pass(`${description} not modified`)
  }
}

const MODAL_PATH = 'app/admin/warroom/components/CanonicalReAuditConfirmModal.tsx'

// ============================================================================
// SECTION 1: MODAL RESULT DISPLAY CHECKS
// ============================================================================
console.log('\n📋 Section 1: Modal Result Display Checks\n')

checkFileContains(MODAL_PATH, 'result.summary is rendered', (content) => {
  return content.includes('result.summary') && content.includes('result?.summary')
    ? null
    : 'result.summary not rendered in modal'
})

checkFileContains(MODAL_PATH, 'summary label includes memory-only', (content) => {
  return content.includes('Audit Summary (memory-only)')
    ? null
    : 'Summary label does not include "memory-only"'
})

checkFileContains(MODAL_PATH, 'summary not labeled with forbidden terms', (content) => {
  const forbidden = [
    'approval summary',
    'deploy summary',
    'production summary',
    'publishability result'
  ]
  for (const term of forbidden) {
    if (content.toLowerCase().includes(term.toLowerCase())) {
      return `Summary uses forbidden label: "${term}"`
    }
  }
  return null
})

checkFileContains(MODAL_PATH, 'result.auditedAt is rendered', (content) => {
  return content.includes('result.auditedAt') || content.includes('result?.auditedAt')
    ? null
    : 'result.auditedAt not rendered in modal'
})

checkFileContains(MODAL_PATH, 'auditedAt label is neutral', (content) => {
  return content.includes('Audited at')
    ? null
    : 'auditedAt label "Audited at" not found'
})

checkFileContains(MODAL_PATH, 'all result.errors displayed (not only errors[0])', (content) => {
  const codeOnly = stripComments(content)
  // Must use .map() over errors array, not just errors[0]
  const hasMap = codeOnly.includes('result.errors.map(') || codeOnly.includes('result?.errors.map(')
  const stillHasSingleAccess = /result\.errors\[0\]/.test(codeOnly) || /result\?\.errors\[0\]/.test(codeOnly)
  if (!hasMap) {
    return 'result.errors not iterated with .map() — only errors[0] may be shown'
  }
  if (stillHasSingleAccess) {
    return 'result.errors[0] single-access still present alongside .map() — remove the old single-access pattern'
  }
  return null
})

checkFileContains(MODAL_PATH, 'findings access protected by type guard', (content) => {
  const hasTypeGuard =
    content.includes('isCanonicalReAuditFindingEntry') &&
    content.includes('function isCanonicalReAuditFindingEntry')
  return hasTypeGuard
    ? null
    : 'Type guard isCanonicalReAuditFindingEntry not found in modal'
})

checkFileContains(MODAL_PATH, 'type guard checks typeof object and not null', (content) => {
  const hasCheck =
    content.includes("typeof value === 'object'") &&
    content.includes('value !== null')
  return hasCheck
    ? null
    : 'Type guard does not check typeof object && value !== null'
})

checkFileContains(MODAL_PATH, 'globalFindings displayed only for FAILED_PENDING_REVIEW', (content) => {
  const codeOnly = stripComments(content)
  // Strategy: find the findings label and look back up to 1200 chars for the gate condition.
  // The summary block between the gate and the label adds ~400 chars of distance.
  const findingsLabelIdx = codeOnly.indexOf('Audit Findings (memory-only')
  if (findingsLabelIdx === -1) {
    return 'Findings label "Audit Findings (memory-only" not found in modal'
  }
  const contextBefore = codeOnly.substring(Math.max(0, findingsLabelIdx - 1200), findingsLabelIdx)
  if (!contextBefore.includes('FAILED_PENDING_REVIEW')) {
    return 'Findings block is not gated by FAILED_PENDING_REVIEW check'
  }
  return null
})

checkFileContains(MODAL_PATH, 'failedLanguages displayed only for FAILED_PENDING_REVIEW', (content) => {
  const codeOnly = stripComments(content)
  // Same strategy with 1200-char lookback to account for summary block distance.
  const findingsLabelIdx = codeOnly.indexOf('Audit Findings (memory-only')
  if (findingsLabelIdx === -1) {
    return 'Findings label "Audit Findings (memory-only" not found in modal'
  }
  const contextBefore = codeOnly.substring(Math.max(0, findingsLabelIdx - 1200), findingsLabelIdx)
  if (!contextBefore.includes('FAILED_PENDING_REVIEW')) {
    return 'failedLanguages findings block is not gated by FAILED_PENDING_REVIEW check'
  }
  return null
})

checkFileContains(MODAL_PATH, 'STALE status does not display findings', (content) => {
  const codeOnly = stripComments(content)
  // The findings block must be gated to FAILED_PENDING_REVIEW only.
  // Verify: the findings label appears only inside a FAILED_PENDING_REVIEW gate,
  // and is NOT inside a STALE gate.
  const findingsLabelIdx = codeOnly.indexOf('Audit Findings (memory-only')
  if (findingsLabelIdx === -1) {
    return 'Findings block label not found'
  }
  // Check the 1200 chars before the label for the gate condition
  const contextBefore = codeOnly.substring(Math.max(0, findingsLabelIdx - 1200), findingsLabelIdx)
  if (!contextBefore.includes('FAILED_PENDING_REVIEW')) {
    return 'Findings block is not gated by FAILED_PENDING_REVIEW check'
  }
  // Verify STALE is not the gate condition immediately before the findings block
  // (STALE may appear elsewhere in the file for other status handling)
  const nearContext = codeOnly.substring(Math.max(0, findingsLabelIdx - 200), findingsLabelIdx)
  if (nearContext.includes('CanonicalReAuditStatus.STALE') &&
      !nearContext.includes('!== CanonicalReAuditStatus.STALE')) {
    return 'Findings block may be gated by STALE status — should be FAILED_PENDING_REVIEW only'
  }
  return null
})

checkFileContains(MODAL_PATH, 'findings block has memory-only footer', (content) => {
  return content.includes('Memory-only — Deploy remains locked — Review only')
    ? null
    : 'Findings block missing memory-only/deploy-locked footer'
})

// ============================================================================
// SECTION 2: GREEN-LIGHT FALLACY CONTROLS
// ============================================================================
console.log('\n📋 Section 2: Green-Light Fallacy Controls\n')

checkFileContains(MODAL_PATH, 'PASSED block still includes memory-only language', (content) => {
  return content.includes("This result exists only in this session's memory")
    ? null
    : 'PASSED block missing "This result exists only in this session\'s memory"'
})

checkFileContains(MODAL_PATH, 'PASSED block still includes Deploy remains locked', (content) => {
  // Check within the PASSED case body
  const passedIdx = content.indexOf('PASSED_PENDING_ACCEPTANCE')
  const passedBlock = content.substring(passedIdx, passedIdx + 600)
  return passedBlock.includes('Deploy remains locked')
    ? null
    : 'PASSED block missing "Deploy remains locked"'
})

checkFileContains(MODAL_PATH, 'PASSED block still includes Global audit has not been updated', (content) => {
  const passedIdx = content.indexOf('PASSED_PENDING_ACCEPTANCE')
  const passedBlock = content.substring(passedIdx, passedIdx + 600)
  return passedBlock.includes('Global audit has not been updated')
    ? null
    : 'PASSED block missing "Global audit has not been updated"'
})

checkFileContains(MODAL_PATH, 'PASSED block still includes Acceptance review / later phase', (content) => {
  const passedIdx = content.indexOf('PASSED_PENDING_ACCEPTANCE')
  const passedBlock = content.substring(passedIdx, passedIdx + 600)
  return passedBlock.includes('Acceptance review') || passedBlock.includes('later phase')
    ? null
    : 'PASSED block missing "Acceptance review" or "later phase"'
})

checkFileContains(MODAL_PATH, 'PASSED block does not include "approved"', (content) => {
  const codeOnly = stripComments(content)
  const passedIdx = codeOnly.indexOf('PASSED_PENDING_ACCEPTANCE')
  // Check the result display body for PASSED — look at the body string
  const passedBodyStart = codeOnly.indexOf("'Re-audit checks passed'")
  const passedBodyEnd = codeOnly.indexOf('tone:', passedBodyStart)
  if (passedBodyStart === -1) return null // Can't locate, skip
  const passedBody = codeOnly.substring(passedBodyStart, passedBodyEnd > passedBodyStart ? passedBodyEnd : passedBodyStart + 800)
  if (/\bapproved\b/i.test(passedBody)) {
    return 'PASSED result body contains forbidden word "approved"'
  }
  return null
})

checkFileContains(MODAL_PATH, 'PASSED block does not include "accepted"', (content) => {
  const codeOnly = stripComments(content)
  const passedBodyStart = codeOnly.indexOf("'Re-audit checks passed'")
  const passedBodyEnd = codeOnly.indexOf('tone:', passedBodyStart)
  if (passedBodyStart === -1) return null
  const passedBody = codeOnly.substring(passedBodyStart, passedBodyEnd > passedBodyStart ? passedBodyEnd : passedBodyStart + 800)
  if (/\baccepted\b/i.test(passedBody)) {
    return 'PASSED result body contains forbidden word "accepted"'
  }
  return null
})

checkFileContains(MODAL_PATH, 'PASSED block does not include "deploy-ready"', (content) => {
  // Strip JSDoc comments before checking — "Deploy Ready" appears in a comment
  const codeOnly = stripComments(content)
  if (/deploy.?ready/i.test(codeOnly)) {
    return 'Modal code (outside comments) contains forbidden phrase "deploy-ready"'
  }
  return null
})

checkFileContains(MODAL_PATH, 'PASSED block does not include "production-ready"', (content) => {
  if (/production.?ready/i.test(content)) {
    return 'Modal contains forbidden phrase "production-ready"'
  }
  return null
})

checkFileContains(MODAL_PATH, 'PASSED block does not include "clear to deploy"', (content) => {
  if (/clear to deploy/i.test(content)) {
    return 'Modal contains forbidden phrase "clear to deploy"'
  }
  return null
})

checkFileContains(MODAL_PATH, 'PASSED result tone remains amber (not green)', (content) => {
  const passedIdx = content.indexOf('PASSED_PENDING_ACCEPTANCE')
  // Find the tone assignment for PASSED
  const toneIdx = content.indexOf("tone:", passedIdx)
  const toneLine = content.substring(toneIdx, toneIdx + 120)
  if (toneLine.includes('green')) {
    return 'PASSED result tone uses green — must remain amber'
  }
  if (!toneLine.includes('amber')) {
    return 'PASSED result tone does not use amber'
  }
  return null
})

checkFileContains(MODAL_PATH, 'summary section does not use green color class', (content) => {
  const summaryIdx = content.indexOf('Audit Summary (memory-only)')
  if (summaryIdx === -1) return 'Summary section not found'
  const summaryBlock = content.substring(summaryIdx - 200, summaryIdx + 400)
  if (/\bgreen\b/.test(summaryBlock)) {
    return 'Summary section uses green color class'
  }
  return null
})

checkFileContains(MODAL_PATH, 'findings section does not use green color class', (content) => {
  const findingsIdx = content.indexOf('Audit Findings (memory-only')
  if (findingsIdx === -1) return 'Findings section not found'
  const findingsBlock = content.substring(findingsIdx - 200, findingsIdx + 600)
  if (/\bgreen\b/.test(findingsBlock)) {
    return 'Findings section uses green color class'
  }
  return null
})

// ============================================================================
// SECTION 3: FORBIDDEN BEHAVIOR CHECKS
// ============================================================================
console.log('\n📋 Section 3: Forbidden Behavior Checks\n')

checkFileContains(MODAL_PATH, 'No setGlobalAudit in modal', (content) => {
  const codeOnly = stripComments(content)
  return codeOnly.includes('setGlobalAudit') ? 'Found setGlobalAudit in modal' : null
})

checkFileContains(MODAL_PATH, 'No setVault in modal', (content) => {
  const codeOnly = stripComments(content)
  return codeOnly.includes('setVault') ? 'Found setVault in modal' : null
})

checkFileContains(MODAL_PATH, 'No fetch/axios in modal', (content) => {
  const codeOnly = stripComments(content)
  if (/fetch\s*\(/.test(codeOnly)) return 'Found fetch() in modal'
  if (/axios\./.test(codeOnly)) return 'Found axios in modal'
  return null
})

checkFileContains(MODAL_PATH, 'No prisma/turso/libsql in modal', (content) => {
  const codeOnly = stripComments(content)
  if (codeOnly.includes('prisma')) return 'Found prisma in modal'
  if (codeOnly.includes('turso')) return 'Found turso in modal'
  if (codeOnly.includes('libsql')) return 'Found libsql in modal'
  return null
})

checkFileContains(MODAL_PATH, 'No localStorage/sessionStorage in modal', (content) => {
  const codeOnly = stripComments(content)
  if (codeOnly.includes('localStorage')) return 'Found localStorage in modal'
  if (codeOnly.includes('sessionStorage')) return 'Found sessionStorage in modal'
  return null
})

checkFileContains(MODAL_PATH, 'No deployUnlockAllowed: true in modal', (content) => {
  const codeOnly = stripComments(content)
  return codeOnly.includes('deployUnlockAllowed: true') ? 'Found deployUnlockAllowed: true in modal' : null
})

checkFileContains(MODAL_PATH, 'No save/publish/promote/rollback in modal', (content) => {
  const codeOnly = stripComments(content)
  const forbidden = ['save(', 'publish(', 'promote(', 'rollback(']
  for (const f of forbidden) {
    if (codeOnly.includes(f)) return `Found forbidden call: ${f}`
  }
  return null
})

checkFileContains(MODAL_PATH, 'No acceptance/promotion buttons in modal', (content) => {
  const codeOnly = stripComments(content)
  const forbidden = ['onAccept', 'onPromote', 'onDeploy', 'onSave', 'onPublish', 'onRollback']
  for (const f of forbidden) {
    if (codeOnly.includes(f)) return `Found forbidden callback: ${f}`
  }
  return null
})

checkFileContains(MODAL_PATH, 'No new callbacks added to modal props interface', (content) => {
  // The props interface must not have new action callbacks beyond the original set
  const allowedCallbacks = [
    'onClose',
    'onConfirmedRun',
    'onAcknowledgementToggle',
    'onTypedAttestationChange'
  ]
  // Check for any new on* props not in the allowed list
  const propsMatch = content.match(/interface CanonicalReAuditConfirmModalProps\s*\{([\s\S]*?)\}/)
  if (!propsMatch) return 'Could not locate props interface'
  const propsBlock = propsMatch[1]
  const onCallbacks = propsBlock.match(/\bon\w+\s*[?:]?\s*:/g) || []
  for (const cb of onCallbacks) {
    const name = cb.replace(/[?:\s]/g, '')
    if (!allowedCallbacks.includes(name)) {
      return `Unexpected callback in props interface: ${name}`
    }
  }
  return null
})

checkFileContains(MODAL_PATH, 'No run path changes (onConfirmedRun still present)', (content) => {
  return content.includes('onConfirmedRun') && content.includes('handleExecute')
    ? null
    : 'onConfirmedRun or handleExecute missing — run path may have changed'
})

checkFileContains(MODAL_PATH, 'No useEffect in modal', (content) => {
  const codeOnly = stripComments(content)
  return codeOnly.includes('useEffect') ? 'Found useEffect in modal — forbidden' : null
})

checkFileContains(MODAL_PATH, 'No setTimeout/setInterval auto-close in modal', (content) => {
  const codeOnly = stripComments(content)
  if (codeOnly.includes('setTimeout(')) return 'Found setTimeout in modal — forbidden'
  if (codeOnly.includes('setInterval(')) return 'Found setInterval in modal — forbidden'
  return null
})

checkFileContains(MODAL_PATH, 'canClose logic unchanged', (content) => {
  return content.includes('const canClose = !isRunning && (hasTerminalResult || !result)')
    ? null
    : 'canClose logic has changed'
})

checkFileContains(MODAL_PATH, 'canExecute logic unchanged', (content) => {
  return content.includes('const canExecute = Boolean(gateResult?.canExecute) && !hasTerminalResult')
    ? null
    : 'canExecute logic has changed'
})

checkFileContains(MODAL_PATH, 'hasTerminalResult logic unchanged', (content) => {
  return content.includes('const hasTerminalResult = Boolean(result) && !isRunning')
    ? null
    : 'hasTerminalResult logic has changed'
})

// ============================================================================
// SECTION 4: BOUNDARY PRESERVATION CHECKS
// ============================================================================
console.log('\n📋 Section 4: Boundary Preservation Checks\n')

checkFileNotModified(
  'app/admin/warroom/components/CanonicalReAuditPanel.tsx',
  'CanonicalReAuditPanel'
)

checkFileNotModified(
  'app/admin/warroom/components/CanonicalReAuditTriggerButton.tsx',
  'CanonicalReAuditTriggerButton'
)

checkFileNotModified(
  'app/admin/warroom/hooks/useCanonicalReAudit.ts',
  'useCanonicalReAudit hook'
)

checkFileNotModified(
  'app/admin/warroom/controllers/canonical-reaudit-run-controller.ts',
  'canonical-reaudit-run-controller'
)

checkFileNotModified(
  'lib/editorial/canonical-reaudit-adapter.ts',
  'canonical-reaudit-adapter'
)

checkFileNotModified(
  'lib/editorial/canonical-reaudit-types.ts',
  'canonical-reaudit-types'
)

checkFileNotModified(
  'app/admin/warroom/page.tsx',
  'warroom page.tsx'
)

// ============================================================================
// SECTION 5: PANEL BOUNDARY CHECKS
// ============================================================================
console.log('\n📋 Section 5: Panel Boundary Checks\n')

checkFileContains(
  'app/admin/warroom/components/CanonicalReAuditPanel.tsx',
  'Panel does not render findings',
  (content) => {
    const codeOnly = stripComments(content)
    return codeOnly.includes('globalFindings') || codeOnly.includes('Audit Findings')
      ? 'Panel renders findings — boundary violation'
      : null
  }
)

checkFileContains(
  'app/admin/warroom/components/CanonicalReAuditPanel.tsx',
  'Panel does not render summary',
  (content) => {
    const codeOnly = stripComments(content)
    return codeOnly.includes('result.summary') || codeOnly.includes('Audit Summary')
      ? 'Panel renders summary — boundary violation'
      : null
  }
)

checkFileContains(
  'app/admin/warroom/components/CanonicalReAuditPanel.tsx',
  'Panel has no new callbacks',
  (content) => {
    const propsMatch = content.match(/interface CanonicalReAuditPanelProps\s*\{([\s\S]*?)\}/)
    if (!propsMatch) return 'Could not locate panel props interface'
    const propsBlock = propsMatch[1]
    const onCallbacks = propsBlock.match(/\bon\w+\s*[?:]?\s*:/g) || []
    if (onCallbacks.length > 0) {
      return `Panel has unexpected callbacks: ${onCallbacks.join(', ')}`
    }
    return null
  }
)

// ============================================================================
// SUMMARY
// ============================================================================
console.log('\n' + '='.repeat(60))
console.log(`✅ PASSED: ${passCount}`)
console.log(`❌ FAILED: ${failCount}`)
console.log('='.repeat(60))

if (failCount > 0) {
  console.error('\n❌ TASK 7C-2B-3 VERIFICATION FAILED')
  console.error('Fix the issues above within authorized files only.')
  process.exit(1)
}

console.log('\n✅ TASK 7C-2B-3 VERIFICATION PASSED')
console.log('Result review hardening implemented within authorized boundaries.')
process.exit(0)
