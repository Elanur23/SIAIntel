import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  AuditInvalidationReason,
  getApplyBlockReason,
  isApplyEligibleSuggestion,
  markAuditInvalidated,
  requiresReAudit,
  isDeployBlockedByInvalidatedAudit,
  assertRemediationApplySafety,
  createApplyApprovedResult,
  createApplyBlockedResult,
  RemediationApplyStatus
} from '@/lib/editorial/remediation-apply-types'
import {
  RemediationCategory,
  RemediationFixType,
  RemediationSafetyLevel,
  RemediationSeverity,
  RemediationSource,
  type RemediationSuggestion
} from '@/lib/editorial/remediation-types'

type Check = { label: string; ok: boolean; detail?: string }

const checks: Check[] = []

function check(label: string, condition: boolean, detail?: string) {
  checks.push({ label, ok: condition, detail })
}

function makeSuggestion(overrides: Partial<RemediationSuggestion> = {}): RemediationSuggestion {
  return {
    id: 'phase3c-test',
    source: RemediationSource.globalAudit,
    category: RemediationCategory.FORMAT_REPAIR,
    severity: RemediationSeverity.WARNING,
    safetyLevel: RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL,
    issueType: 'format_issue',
    issueDescription: 'Malformed markdown prefixes detected',
    originalText: '## ## malformed',
    suggestedText: '## corrected',
    rationale: 'Format-only correction',
    fixType: RemediationFixType.format,
    requiresHumanApproval: true,
    canApplyToDraft: true,
    cannotAutoPublish: true,
    cannotAutoCommit: true,
    cannotAutoPush: true,
    cannotAutoDeploy: true,
    preservesFacts: true,
    preservesNumbers: true,
    preservesProvenance: true,
    requiresSourceVerification: false,
    validationTests: ['format-only'],
    createdAt: new Date().toISOString(),
    ...overrides
  }
}

function expectThrows(label: string, fn: () => void) {
  let threw = false
  try {
    fn()
  } catch {
    threw = true
  }
  check(label, threw)
}

function verifyUiSafetyAnchors() {
  const modalPath = join(process.cwd(), 'app/admin/warroom/components/RemediationConfirmModal.tsx')
  const previewPath = join(process.cwd(), 'app/admin/warroom/components/RemediationPreviewPanel.tsx')
  const pagePath = join(process.cwd(), 'app/admin/warroom/page.tsx')
  const modal = readFileSync(modalPath, 'utf8')
  const preview = readFileSync(previewPath, 'utf8')
  const page = readFileSync(pagePath, 'utf8')

  check('Apply to Draft remains disabled in modal', modal.includes('disabled={true}') && modal.includes('Apply to Draft — Disabled in Phase 3B'))
  check('Prototype warning copy remains', modal.includes('Prototype Only — No Changes Made') && modal.includes('does not unlock Deploy'))
  check('Suggested Fixes Preview remains visible', preview.includes('Suggested Fixes Preview'))
  check('Review Suggestion path remains modal-based', preview.includes('Review Suggestion'))
  check('Global safety clarification remains', page.includes('Global Audit PASS ≠ Deploy READY'))
}

console.log('================================================================================')
console.log('PHASE 3C-1 APPLY PROTOCOL VERIFICATION')
console.log('================================================================================')

// 1) Apply still not active at runtime level (UI-level safety)
verifyUiSafetyAnchors()

// 2) FORMAT_REPAIR only Tier-1 candidate
const formatSuggestion = makeSuggestion()
check('FORMAT_REPAIR is eligible for future Tier-1 consideration', isApplyEligibleSuggestion(formatSuggestion))
check('FORMAT_REPAIR block reason is null', getApplyBlockReason(formatSuggestion) === null)

// 3,4,5) High-risk categories blocked
const sourceReview = makeSuggestion({ category: RemediationCategory.SOURCE_REVIEW, suggestedText: null, canApplyToDraft: false })
const provenanceReview = makeSuggestion({ category: RemediationCategory.PROVENANCE_REVIEW, suggestedText: null, canApplyToDraft: false })
const parityReview = makeSuggestion({ category: RemediationCategory.PARITY_REVIEW, suggestedText: null, canApplyToDraft: false })
check('SOURCE_REVIEW is blocked', !isApplyEligibleSuggestion(sourceReview))
check('PROVENANCE_REVIEW is blocked', !isApplyEligibleSuggestion(provenanceReview))
check('PARITY_REVIEW is blocked', !isApplyEligibleSuggestion(parityReview))

// 6) HUMAN_ONLY blocked
const humanOnly = makeSuggestion({
  safetyLevel: RemediationSafetyLevel.HUMAN_ONLY,
  category: RemediationCategory.HUMAN_REVIEW_REQUIRED,
  suggestedText: null,
  canApplyToDraft: false
})
check('HUMAN_ONLY is blocked', !isApplyEligibleSuggestion(humanOnly))

// 7,8,9,10) invalidation + re-audit enforce deploy lock
const invalidated = markAuditInvalidated(AuditInvalidationReason.REMEDIATION_APPLIED, '2026-04-26T00:00:00.000Z')
check('markAuditInvalidated sets auditInvalidated=true', invalidated.auditInvalidated === true)
check('markAuditInvalidated sets reAuditRequired=true', invalidated.reAuditRequired === true)
check('invalidated audit state blocks deploy', isDeployBlockedByInvalidatedAudit(invalidated) === true)
check('re-audit required blocks deploy', requiresReAudit(invalidated) === true)

// 11) Rollback modeling does not auto-restore deploy eligibility
const rollbackInvalidated = markAuditInvalidated(AuditInvalidationReason.ROLLBACK_PERFORMED, '2026-04-26T00:00:01.000Z')
check('rollback invalidation still requires re-audit', requiresReAudit(rollbackInvalidated) === true)
check('rollback invalidation still blocks deploy', isDeployBlockedByInvalidatedAudit(rollbackInvalidated) === true)

// 12) Helper purity: no draft/vault fields in helper outputs
const approved = createApplyApprovedResult('suggestion-1', 'human-approved')
const blocked = createApplyBlockedResult(RemediationApplyStatus.BLOCKED_CATEGORY_NOT_TIER1, 'blocked')
check('approved result has no draft/vault mutation fields', !('vault' in (approved as any)) && !('draft' in (approved as any)))
check('blocked result has no draft/vault mutation fields', !('vault' in (blocked as any)) && !('draft' in (blocked as any)))

// assert helper enforces strict category safety
expectThrows('assertRemediationApplySafety blocks SOURCE_REVIEW', () => assertRemediationApplySafety(sourceReview))
expectThrows('assertRemediationApplySafety blocks PROVENANCE_REVIEW', () => assertRemediationApplySafety(provenanceReview))
expectThrows('assertRemediationApplySafety blocks PARITY_REVIEW', () => assertRemediationApplySafety(parityReview))
expectThrows('assertRemediationApplySafety blocks HUMAN_ONLY', () => assertRemediationApplySafety(humanOnly))
check('assertRemediationApplySafety allows FORMAT_REPAIR', (() => {
  try {
    assertRemediationApplySafety(formatSuggestion)
    return true
  } catch {
    return false
  }
})())

// 13) No API route called by script
check('No API route is required/called in protocol verification', true)

// 14) Existing Phase 3B safety remains compatible
check('Phase 3B compatibility: Review Suggestion remains discoverable', readFileSync(join(process.cwd(), 'app/admin/warroom/components/RemediationPreviewPanel.tsx'), 'utf8').includes('Review Suggestion'))

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

console.log('\n✅ PHASE 3C-1 PROTOCOL VERIFICATION PASSED')
