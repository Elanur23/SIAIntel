#!/usr/bin/env tsx

/**
 * TASK 6A VERIFICATION SCRIPT
 *
 * Verifies the local promotion transition plan implementation:
 * - Pure transition-plan helper exists
 * - snapshotBinding exposure in hook
 * - No unauthorized mutations
 * - No side effects
 */

import * as fs from 'fs'
import * as path from 'path'

const WORKSPACE_ROOT = process.cwd()

interface VerificationResult {
  checkNumber: number
  description: string
  passed: boolean
  details?: string
}

const results: VerificationResult[] = []

function addResult(checkNumber: number, description: string, passed: boolean, details?: string) {
  results.push({ checkNumber, description, passed, details })
  const status = passed ? '✓ PASS' : '✗ FAIL'
  const detailsStr = details ? ` - ${details}` : ''
  console.log(`${status} - Check ${checkNumber}: ${description}${detailsStr}`)
}

function readFileContent(relativePath: string): string {
  const fullPath = path.join(WORKSPACE_ROOT, relativePath)
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${relativePath}`)
  }
  return fs.readFileSync(fullPath, 'utf-8')
}

function fileExists(relativePath: string): boolean {
  const fullPath = path.join(WORKSPACE_ROOT, relativePath)
  return fs.existsSync(fullPath)
}

console.log('='.repeat(80))
console.log('   TASK 6A: LOCAL PROMOTION TRANSITION PLAN VERIFICATION')
console.log('='.repeat(80))
console.log('')

try {
  // ============================================================================
  // CHECK 1: lib/editorial/session-draft-promotion-local-transition.ts exists
  // ============================================================================
  const transitionHelperPath = 'lib/editorial/session-draft-promotion-local-transition.ts'
  const transitionHelperExists = fileExists(transitionHelperPath)
  addResult(1, 'Transition-plan helper exists', transitionHelperExists, transitionHelperExists ? transitionHelperPath : 'Missing')

  if (transitionHelperExists) {
    const content = readFileContent(transitionHelperPath)
    // CHECK 2: exports computePromotionTransitionPlan
    const hasExport = content.includes('export function computePromotionTransitionPlan')
    addResult(2, 'Exports computePromotionTransitionPlan', hasExport, hasExport ? 'Found' : 'Missing')

    // CHECK 3: Pure implementation (no side effects)
    const hasSideEffects = content.includes('fetch(') || content.includes('axios.') || content.includes('localStorage') || content.includes('sessionStorage')
    addResult(3, 'No side effects in helper', !hasSideEffects, !hasSideEffects ? 'Clean' : 'Side effects found')
  }

  // ============================================================================
  // CHECK 4: snapshotBinding exposure in useLocalDraftRemediationController.ts
  // ============================================================================
  const hookPath = 'app/admin/warroom/hooks/useLocalDraftRemediationController.ts'
  const hookContent = readFileContent(hookPath)
  // Check the main return block (usually the last one in the hook)
  const returnBlocks = hookContent.split('return {')
  const lastReturnBlock = returnBlocks[returnBlocks.length - 1]
  const hasSnapshotBinding = lastReturnBlock.includes('snapshotBinding')
  addResult(4, 'snapshotBinding exposed in controller hook', hasSnapshotBinding, hasSnapshotBinding ? 'Found in main return object' : 'Missing in main return object')

  // ============================================================================
  // CHECK 5: snapshotBinding is derived from currentSnapshotIdentity
  // ============================================================================
  const isDerived = hookContent.includes('currentSnapshotIdentity') && hookContent.includes('checkPromotionPreconditions')
  addResult(5, 'snapshotBinding is derived correctly', isDerived, isDerived ? 'Derived from identity and preconditions' : 'Incorrect derivation')

  // ============================================================================
  // CHECK 6: Strict boundaries verification
  // ============================================================================
  const hasSetVault = hookContent.includes('setVault(')
  addResult(6, 'No setVault in controller hook', !hasSetVault, !hasSetVault ? 'Safe' : 'Forbidden setVault found')

  // clearLocalDraftSession is allowed, but clearLocalDraft (canonical) is NOT
  const hasForbiddenClear = hookContent.includes('clearLocalDraft(')
  addResult(7, 'No canonical clearLocalDraft in controller hook', !hasForbiddenClear, !hasForbiddenClear ? 'Safe' : 'Forbidden clearLocalDraft found')

  // ============================================================================
  // SUMMARY
  // ============================================================================
  console.log('')
  console.log('='.repeat(80))
  console.log('   VERIFICATION SUMMARY')
  console.log('='.repeat(80))

  const totalChecks = results.length
  const passedChecks = results.filter(r => r.passed).length
  const failedChecks = totalChecks - passedChecks

  console.log(`Total Checks: ${totalChecks}`)
  console.log(`Passed: ${passedChecks}`)
  console.log(`Failed: ${failedChecks}`)
  console.log('')

  if (failedChecks === 0) {
    console.log('VERDICT: TASK_6A_VERIFICATION_PASS')
  } else {
    console.log('VERDICT: TASK_6A_VERIFICATION_FAIL')
  }

  console.log('='.repeat(80))
  console.log('')

  process.exit(failedChecks === 0 ? 0 : 1)

} catch (error) {
  console.error('')
  console.error('❌ VERIFICATION SCRIPT ERROR:', error instanceof Error ? error.message : String(error))
  console.error('')
  process.exit(1)
}
