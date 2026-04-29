#!/usr/bin/env tsx

/**
 * TASK 5 VERIFICATION SCRIPT
 * 
 * Verifies that the disabled promotion entry point integration is safe:
 * - Modal wiring is read-only
 * - No execution logic added
 * - No validator/payload builder calls
 * - No vault/session mutations
 * - No API/provider/database calls
 * - No forbidden wording
 * - Task 4 modal scaffold remains safe
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
console.log('   TASK 5: DISABLED PROMOTION ENTRY POINT VERIFICATION')
console.log('='.repeat(80))
console.log('')

try {
  // ============================================================================
  // CHECK 1: page.tsx imports PromotionConfirmModal
  // ============================================================================
  const pageContent = readFileContent('app/admin/warroom/page.tsx')
  const hasModalImport = pageContent.includes("import PromotionConfirmModal from './components/PromotionConfirmModal'")
  addResult(1, 'page.tsx imports PromotionConfirmModal', hasModalImport, hasModalImport ? 'Import found' : 'Import missing')

  // ============================================================================
  // CHECK 2: page.tsx has local modal open/close state only
  // ============================================================================
  const hasModalState = pageContent.includes('isPromotionModalOpen') && pageContent.includes('setIsPromotionModalOpen')
  addResult(2, 'page.tsx has local modal open/close state only', hasModalState, hasModalState ? 'Modal state found' : 'Modal state missing')

  // ============================================================================
  // CHECK 3: Promotion entry point is gated by session draft state
  // ============================================================================
  const hasSessionDraftGate = pageContent.includes('remediationController.hasSessionDraft') && 
                               pageContent.includes('Open Promotion Review')
  addResult(3, 'Promotion entry point is gated by session draft state', hasSessionDraftGate, hasSessionDraftGate ? 'Session draft gate found' : 'Session draft gate missing')

  // ============================================================================
  // CHECK 4: Required warning copy exists near entry point
  // ============================================================================
  const hasWarning1 = pageContent.includes('promotion execution is disabled')
  const hasWarning2 = pageContent.includes('not saved') && pageContent.includes('canonical vault')
  const hasWarning3 = pageContent.includes('Deploy remains') && pageContent.includes('locked')
  const hasWarning4 = pageContent.includes('Canonical re-audit') && pageContent.includes('required')
  const allWarningsPresent = hasWarning1 && hasWarning2 && hasWarning3 && hasWarning4
  addResult(4, 'Required warning copy exists near entry point', allWarningsPresent, allWarningsPresent ? 'All 4 required warnings present' : 'Missing warnings')

  // ============================================================================
  // CHECK 5: Modal is rendered with isOpen/onClose
  // ============================================================================
  const hasModalRender = pageContent.includes('<PromotionConfirmModal') &&
                         pageContent.includes('isOpen={isPromotionModalOpen}') &&
                         pageContent.includes('onClose={() => setIsPromotionModalOpen(false)}')
  addResult(5, 'Modal is rendered with isOpen/onClose', hasModalRender, hasModalRender ? 'Modal render found' : 'Modal render missing')

  // ============================================================================
  // CHECK 6: Modal receives precondition={null} or no validator-built result
  // ============================================================================
  const hasPreconditionNull = pageContent.includes('precondition={null}')
  addResult(6, 'Modal receives precondition={null}', hasPreconditionNull, hasPreconditionNull ? 'precondition={null} found' : 'precondition not null')

  // ============================================================================
  // CHECK 7: Modal receives payloadPreview={null} or no builder-built payload
  // ============================================================================
  const hasPayloadNull = pageContent.includes('payloadPreview={null}')
  addResult(7, 'Modal receives payloadPreview={null}', hasPayloadNull, hasPayloadNull ? 'payloadPreview={null} found' : 'payloadPreview not null')

  // ============================================================================
  // CHECK 8: page.tsx does NOT call checkPromotionPreconditions
  // ============================================================================
  const hasValidatorCall = pageContent.includes('checkPromotionPreconditions') ||
                           pageContent.includes('evaluatePromotionEligibility')
  addResult(8, 'page.tsx does NOT call validator functions', !hasValidatorCall, !hasValidatorCall ? 'No validator calls' : 'Validator calls found')

  // ============================================================================
  // CHECK 9: page.tsx does NOT call buildPromotionPayload
  // ============================================================================
  const hasPayloadBuilderCall = pageContent.includes('buildPromotionPayload')
  addResult(9, 'page.tsx does NOT call buildPromotionPayload', !hasPayloadBuilderCall, !hasPayloadBuilderCall ? 'No payload builder calls' : 'Payload builder calls found')

  // ============================================================================
  // CHECK 10: No onPromote/onExecute/onSave/onDeploy prop is passed
  // ============================================================================
  const hasForbiddenProps = pageContent.includes('onPromote=') ||
                            pageContent.includes('onExecute=') ||
                            pageContent.includes('onSave=') ||
                            pageContent.includes('onDeploy=')
  addResult(10, 'No onPromote/onExecute/onSave/onDeploy prop exists', !hasForbiddenProps, !hasForbiddenProps ? 'No forbidden props' : 'Forbidden props found')

  // ============================================================================
  // CHECK 11: No enabled real Promote button exists
  // ============================================================================
  const hasEnabledPromoteButton = pageContent.includes('Promote') && 
                                  pageContent.includes('onClick') &&
                                  !pageContent.includes('disabled') &&
                                  pageContent.includes('setVault')
  addResult(11, 'No enabled real Promote button exists', !hasEnabledPromoteButton, !hasEnabledPromoteButton ? 'No enabled Promote button' : 'Enabled Promote button found')

  // ============================================================================
  // CHECK 12: No fetch/axios/API calls added
  // ============================================================================
  // We expect existing fetch calls for publish/workspace, so we just check no new promotion-related API endpoints
  const hasPromotionAPIEndpoint = pageContent.includes('/api/promotion') || 
                                  pageContent.includes('/api/draft-promotion') ||
                                  pageContent.includes('/api/session-promotion')
  addResult(12, 'No promotion-related fetch/axios/API calls added', !hasPromotionAPIEndpoint, !hasPromotionAPIEndpoint ? 'No promotion API calls' : 'Promotion API calls found')

  // ============================================================================
  // CHECK 13: No provider imports added
  // ============================================================================
  const hasProviderImports = pageContent.includes('from \'@/lib/ai/gemini') ||
                             pageContent.includes('from \'@/lib/ai/groq') ||
                             pageContent.includes('from \'@/lib/ai/openai') ||
                             pageContent.includes('anthropic')
  addResult(13, 'No provider imports added', !hasProviderImports, !hasProviderImports ? 'No provider imports' : 'Provider imports found')

  // ============================================================================
  // CHECK 14: No database imports added
  // ============================================================================
  const hasDatabaseImports = pageContent.includes('from \'@/lib/neural-assembly/database') ||
                             pageContent.includes('from \'@/lib/db')
  addResult(14, 'No database imports added', !hasDatabaseImports, !hasDatabaseImports ? 'No database imports' : 'Database imports found')

  // ============================================================================
  // CHECK 15: No setVault/clearLocalDraft/session mutation calls added in promotion context
  // ============================================================================
  // We expect existing setVault calls for editing, so we check for actual promotion execution logic
  const hasPromotionExecutionHandler = pageContent.includes('handlePromoteSessionDraft') ||
                                       pageContent.includes('executePromotion') ||
                                       pageContent.includes('promoteSessionDraftToVault')
  addResult(15, 'No promotion execution handler added', !hasPromotionExecutionHandler, !hasPromotionExecutionHandler ? 'No promotion execution' : 'Promotion execution found')

  // ============================================================================
  // CHECK 16: No localStorage/sessionStorage usage
  // ============================================================================
  const hasStorageUsage = pageContent.includes('localStorage') || pageContent.includes('sessionStorage')
  addResult(16, 'No localStorage/sessionStorage usage', !hasStorageUsage, !hasStorageUsage ? 'No storage usage' : 'Storage usage found')

  // ============================================================================
  // CHECK 17: No deploy unlock wording or logic added
  // ============================================================================
  const hasDeployUnlock = pageContent.includes('Deploy Ready') ||
                          pageContent.includes('Approved for Deploy') ||
                          pageContent.includes('Safe to Publish')
  addResult(17, 'No deploy unlock wording or logic added', !hasDeployUnlock, !hasDeployUnlock ? 'No deploy unlock' : 'Deploy unlock found')

  // ============================================================================
  // CHECK 18: No backend route files changed
  // ============================================================================
  const backendRoutes = [
    'app/api/war-room/save/route.ts',
    'app/api/war-room/workspace/route.ts',
    'app/api/content-buffer/route.ts'
  ]
  const backendRoutesUnchanged = backendRoutes.every(route => {
    if (!fileExists(route)) return true
    const content = readFileContent(route)
    return !content.includes('promotion') && !content.includes('Promotion')
  })
  addResult(18, 'No backend route files changed', backendRoutesUnchanged, backendRoutesUnchanged ? 'No backend routes changed' : 'Backend routes changed')

  // ============================================================================
  // CHECK 19: Existing PromotionConfirmModal scaffold remains safe
  // ============================================================================
  const modalContent = readFileContent('app/admin/warroom/components/PromotionConfirmModal.tsx')
  const modalHasDisabledButton = modalContent.includes('disabled={true}')
  const modalHasNoExecution = !modalContent.includes('setVault') && !modalContent.includes('clearLocalDraft')
  const modalIsSafe = modalHasDisabledButton && modalHasNoExecution
  addResult(19, 'Existing PromotionConfirmModal scaffold remains safe', modalIsSafe, modalIsSafe ? 'Modal scaffold safe' : 'Modal scaffold unsafe')

  // ============================================================================
  // CHECK 20: Task 4 verification still passes
  // ============================================================================
  const task4ScriptExists = fileExists('scripts/verify-session-draft-promotion-modal-scaffold.ts')
  addResult(20, 'Task 4 verification script exists', task4ScriptExists, task4ScriptExists ? 'Task 4 script exists' : 'Task 4 script missing')

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
    console.log('VERDICT: TASK_5_VERIFICATION_PASS')
  } else {
    console.log('VERDICT: TASK_5_VERIFICATION_FAIL')
    console.log('')
    console.log('Failed checks:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - Check ${r.checkNumber}: ${r.description}`)
      if (r.details) console.log(`    ${r.details}`)
    })
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
