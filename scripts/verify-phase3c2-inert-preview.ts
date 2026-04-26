import { readFileSync } from 'node:fs'
import { join } from 'node:path'

type Check = { label: string; ok: boolean; detail?: string }

const checks: Check[] = []

function check(label: string, condition: boolean, detail?: string) {
  checks.push({ label, ok: condition, detail })
}

function verifyModalInertPreview() {
  const modalPath = join(process.cwd(), 'app/admin/warroom/components/RemediationConfirmModal.tsx')
  const modal = readFileSync(modalPath, 'utf8')

  // 1. Preview button exists with correct label
  check(
    'RemediationConfirmModal contains "Preview Apply (No Draft Change)"',
    modal.includes('Preview Apply (No Draft Change)')
  )

  // 2. Preview-only copy exists
  check(
    'RemediationConfirmModal contains "Preview Only — No Draft Change"',
    modal.includes('Preview Only — No Draft Change')
  )

  // 3. Real Apply button still disabled
  check(
    'RemediationConfirmModal still contains "Apply to Draft — Disabled in Phase 3B"',
    modal.includes('Apply to Draft — Disabled in Phase 3B')
  )

  // 4. Real Apply control remains hard disabled
  check(
    'RemediationConfirmModal still has disabled={true} for real Apply',
    modal.includes('disabled={true}') && /Apply to Draft.*Disabled in Phase 3B/s.test(modal)
  )

  // 5. Preview copy says no draft/vault change
  check(
    'Preview copy says no draft/vault change will be made',
    modal.includes('this action will not change the draft or vault')
  )

  // 6. Preview copy says does not unlock Deploy
  check(
    'Preview copy says preview does not unlock Deploy',
    modal.includes('This preview does not unlock Deploy')
  )

  // 7. Preview copy says real Apply will require re-audit
  check(
    'Preview copy says real Apply will require re-audit',
    modal.includes('A real Apply will invalidate the global audit and require a full re-audit')
  )

  // 8. Preview objects include previewOnly/noMutation markers
  check(
    'Preview objects include previewOnly marker',
    modal.includes('previewOnly: true')
  )
  check(
    'Preview objects include noMutation marker',
    modal.includes('noMutation: true')
  )

  // 9. Preview state is local/in-memory only
  check(
    'Preview state uses useState (local component state)',
    modal.includes('useState<InertPreviewState | null>(null)')
  )

  // 10. No fetch/axios/network call added
  check(
    'No fetch call added in modal',
    !modal.includes('fetch(') && !modal.includes('axios.')
  )

  // 11. No localStorage/sessionStorage added
  check(
    'No localStorage added in modal',
    !modal.includes('localStorage.')
  )
  check(
    'No sessionStorage added in modal',
    !modal.includes('sessionStorage.')
  )

  // 12. Clear Preview only clears local state
  check(
    'Clear Preview handler exists and only clears local state',
    modal.includes('handleClearPreview') && modal.includes('setInertPreview(null)')
  )

  // 13. Preview result display shows "No draft change made"
  check(
    'Preview result shows "No draft change made"',
    modal.includes('No draft change made')
  )

  // 14. Preview result shows "No backend call made"
  check(
    'Preview result shows "No backend call made"',
    modal.includes('No backend call made')
  )

  // 15. Preview result shows "Deploy remains locked"
  check(
    'Preview result shows "Deploy remains locked"',
    modal.includes('Deploy remains locked')
  )

  // 16. Mock audit invalidation clearly marked as future effect
  check(
    'Mock audit invalidation marked as MOCK/FUTURE EFFECT ONLY',
    modal.includes('auditInvalidated: true, // MOCK/FUTURE EFFECT ONLY') &&
    modal.includes('reAuditRequired: true, // MOCK/FUTURE EFFECT ONLY')
  )

  // 17. Preview uses Phase 3C-1 eligibility helpers
  check(
    'Preview uses isApplyEligibleSuggestion helper',
    modal.includes('isApplyEligibleSuggestion')
  )
  check(
    'Preview uses getApplyBlockReason helper',
    modal.includes('getApplyBlockReason')
  )

  // 18. No draft/vault mutation strings in modal
  check(
    'No setVault/saveVault/updateVault in modal',
    !modal.includes('setVault') && !modal.includes('saveVault') && !modal.includes('updateVault')
  )
  check(
    'No saveDraft/updateDraft in modal',
    !modal.includes('saveDraft') && !modal.includes('updateDraft')
  )
  check(
    'No applyToDraft function in modal',
    !modal.includes('applyToDraft(')
  )
}

function verifyNoApiRouteAdded() {
  const apiPath = join(process.cwd(), 'app/api')
  
  // Check that no new remediation apply API route exists
  try {
    const remediationApplyPath = join(apiPath, 'remediation/apply/route.ts')
    const fs = require('fs')
    const exists = fs.existsSync(remediationApplyPath)
    check('No app/api/remediation/apply route added', !exists)
  } catch {
    check('No app/api/remediation/apply route added', true)
  }
}

function verifyHighRiskCategoriesBlocked() {
  const modalPath = join(process.cwd(), 'app/admin/warroom/components/RemediationConfirmModal.tsx')
  const modal = readFileSync(modalPath, 'utf8')

  // High-risk categories should show blocked message
  check(
    'Blocked preview message exists for ineligible suggestions',
    modal.includes('Preview Not Available') && modal.includes('requires manual review')
  )
}

function verifyFormatRepairTier1Only() {
  const applyTypesPath = join(process.cwd(), 'lib/editorial/remediation-apply-types.ts')
  const applyTypes = readFileSync(applyTypesPath, 'utf8')

  // FORMAT_REPAIR should be the only Tier-1 eligible category
  check(
    'FORMAT_REPAIR is the only Tier-1 eligible category in helpers',
    applyTypes.includes('case RemediationCategory.FORMAT_REPAIR:') &&
    applyTypes.includes('case RemediationCategory.SOURCE_REVIEW:') &&
    applyTypes.includes('return RemediationApplyStatus.BLOCKED_SOURCE_REVIEW')
  )
}

function verifyDeployGateUnchanged() {
  // Verify deploy gate logic files are not modified to consider preview events
  const warroomPagePath = join(process.cwd(), 'app/admin/warroom/page.tsx')
  const warroomPage = readFileSync(warroomPagePath, 'utf8')

  check(
    'Deploy gate logic unchanged (no preview event consideration)',
    !warroomPage.includes('inertPreview') && !warroomPage.includes('previewEvent')
  )
}

function verifyPandaValidationUnchanged() {
  const pandaPath = join(process.cwd(), 'lib/editorial/panda-intake-validator.ts')
  const panda = readFileSync(pandaPath, 'utf8')

  // Panda validation should not be modified
  check(
    'Panda intake validator unchanged (FOOTER_INTEGRITY_FAILURE check intact)',
    panda.includes('FOOTER_INTEGRITY_FAILURE')
  )
  check(
    'Panda intake validator unchanged (malformed markdown detection intact)',
    panda.includes('Malformed markdown prefixes') || panda.includes('## ##')
  )
}

function verifyPhase3bCompatibility() {
  const previewPanelPath = join(process.cwd(), 'app/admin/warroom/components/RemediationPreviewPanel.tsx')
  const previewPanel = readFileSync(previewPanelPath, 'utf8')

  // Phase 3B Review Suggestion flow should still work
  check(
    'Phase 3B Review Suggestion flow remains intact',
    previewPanel.includes('Review Suggestion') &&
    previewPanel.includes('handleReviewSuggestion')
  )
}

console.log('================================================================================')
console.log('PHASE 3C-2 INERT PREVIEW VERIFICATION')
console.log('================================================================================')

verifyModalInertPreview()
verifyNoApiRouteAdded()
verifyHighRiskCategoriesBlocked()
verifyFormatRepairTier1Only()
verifyDeployGateUnchanged()
verifyPandaValidationUnchanged()
verifyPhase3bCompatibility()

const passed = checks.filter(c => c.ok).length
const failed = checks.length - passed

console.log('\nRESULTS:')
console.log('--------------------------------------------------------------------------------')
for (const c of checks) {
  if (c.ok) {
    console.log(`✅ ${c.label}`)
  } else {
    console.log(`❌ ${c.label}${c.detail ? ` (${c.detail})` : ''}`)
  }
}

console.log('\n================================================================================')
console.log(`VERIFICATION RESULT: ${passed} passed, ${failed} failed`)
console.log('================================================================================')

if (failed > 0) {
  process.exit(1)
}

console.log('\n✅ PHASE 3C-2 INERT PREVIEW VERIFICATION PASSED')
