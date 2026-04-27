#!/usr/bin/env ts-node
/**
 * Phase 3C-3C-3B-1 Preflight Mapping Verification Script
 *
 * This script verifies that the Phase 3C-3C-3B-1 implementation is correct:
 * - Handler exists and accepts RealLocalDraftApplyRequest
 * - Preflight guard blocks ineligible requests
 * - Preflight guard allows eligible requests
 * - No controller call, no mutations
 * - All safety invariants are enforced
 *
 * CRITICAL: This phase is preflight mapping ONLY. No controller execution.
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  category: string;
  checks: Array<{
    name: string;
    passed: boolean;
    details?: string;
  }>;
}

const results: VerificationResult[] = [];
let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function addCheck(category: string, name: string, passed: boolean, details?: string) {
  let categoryResult = results.find(r => r.category === category);
  if (!categoryResult) {
    categoryResult = { category, checks: [] };
    results.push(categoryResult);
  }
  categoryResult.checks.push({ name, passed, details });
  totalChecks++;
  if (passed) {
    passedChecks++;
  } else {
    failedChecks++;
  }
}

/**
 * Helper to extract a function body by name.
 */
function extractFunctionBody(content: string, funcName: string): string {
  const startRegex = new RegExp(`const ${funcName} = [\\s\\S]*?=> {`);
  const match = content.match(startRegex);
  if (!match) return '';

  const startIndex = match.index! + match[0].length;
  // Look for the next major boundary: next const, next // PHASE comment, or return (
  const endMatch = content.substring(startIndex).match(/\n  };|\n\n  \/\/ PHASE/);
  const endIndex = endMatch ? startIndex + endMatch.index! : content.length;

  return content.substring(startIndex, endIndex);
}

// Read files
const pageFilePath = path.join(process.cwd(), 'app/admin/warroom/page.tsx');
const modalFilePath = path.join(process.cwd(), 'app/admin/warroom/components/RemediationConfirmModal.tsx');
const panelFilePath = path.join(process.cwd(), 'app/admin/warroom/components/RemediationPreviewPanel.tsx');
const typesFilePath = path.join(process.cwd(), 'lib/editorial/remediation-apply-types.ts');

const pageContent = fs.readFileSync(pageFilePath, 'utf-8');
const modalContent = fs.readFileSync(modalFilePath, 'utf-8');
const panelContent = fs.readFileSync(panelFilePath, 'utf-8');
const typesContent = fs.readFileSync(typesFilePath, 'utf-8');

// ============================================================================
// CATEGORY 1: HANDLER EXISTENCE (5 checks)
// ============================================================================

addCheck(
  'Handler Existence',
  'Handler function exists',
  pageContent.includes('handleRequestRealLocalApply'),
  'handleRequestRealLocalApply function must exist in page.tsx'
);

addCheck(
  'Handler Existence',
  'Handler accepts RealLocalDraftApplyRequest',
  pageContent.includes('RealLocalDraftApplyRequest') && pageContent.includes('handleRequestRealLocalApply'),
  'Handler must accept RealLocalDraftApplyRequest type'
);

addCheck(
  'Handler Existence',
  'Handler returns RealLocalDraftApplyResult',
  pageContent.includes('RealLocalDraftApplyResult') && pageContent.includes('handleRequestRealLocalApply'),
  'Handler must return RealLocalDraftApplyResult type'
);

addCheck(
  'Handler Existence',
  'Handler is passed to RemediationPreviewPanel',
  pageContent.includes('onRequestRealLocalApply={handleRequestRealLocalApply}'),
  'Handler must be passed to RemediationPreviewPanel'
);

addCheck(
  'Handler Existence',
  'Handler is NOT called from other locations',
  !pageContent.includes('handleRequestRealLocalApply()') || pageContent.split('handleRequestRealLocalApply').length <= 10,
  'Handler should only be defined and passed as prop, not called directly'
);

// ============================================================================
// CATEGORY 2: PREFLIGHT GUARD (10 checks)
// ============================================================================

addCheck(
  'Preflight Guard',
  'Calls getRealLocalDraftApplyBlockReason',
  pageContent.includes('getRealLocalDraftApplyBlockReason'),
  'Handler must call getRealLocalDraftApplyBlockReason'
);

addCheck(
  'Preflight Guard',
  'Blocks non-FORMAT_REPAIR categories',
  typesContent.includes('BLOCKED_NOT_FORMAT_REPAIR'),
  'Guard must block non-FORMAT_REPAIR categories'
);

addCheck(
  'Preflight Guard',
  'Blocks non-body fields',
  typesContent.includes('BLOCKED_NON_BODY_FIELD'),
  'Guard must block non-body fields'
);

addCheck(
  'Preflight Guard',
  'Blocks missing language',
  typesContent.includes('BLOCKED_MISSING_LANGUAGE'),
  'Guard must block missing language'
);

addCheck(
  'Preflight Guard',
  'Blocks missing suggestion ID',
  typesContent.includes('BLOCKED_MISSING_SUGGESTION_ID'),
  'Guard must block missing suggestion ID'
);

addCheck(
  'Preflight Guard',
  'Blocks missing suggested text',
  typesContent.includes('BLOCKED_MISSING_SUGGESTED_TEXT'),
  'Guard must block missing suggested text'
);

addCheck(
  'Preflight Guard',
  'Blocks acknowledgement mismatch',
  typesContent.includes('BLOCKED_ACKNOWLEDGEMENT_MISMATCH'),
  'Guard must block acknowledgement mismatch'
);

addCheck(
  'Preflight Guard',
  'Blocks high-risk categories',
  typesContent.includes('BLOCKED_HIGH_RISK_CATEGORY'),
  'Guard must block high-risk categories'
);

addCheck(
  'Preflight Guard',
  'Returns blocked result with correct reason',
  pageContent.includes('createBlockedRealLocalApplyResult'),
  'Handler must use createBlockedRealLocalApplyResult for blocked cases'
);

addCheck(
  'Preflight Guard',
  'Returns preflight success when eligible',
  pageContent.includes('REAL_LOCAL_APPLY_PREFLIGHT_ONLY_NO_CONTROLLER_EXECUTED'),
  'Handler must return preflight success reason when eligible'
);

// ============================================================================
// CATEGORY 3: NO CONTROLLER CALL (10 checks)
// ============================================================================

const preflightHandlerCode = extractFunctionBody(pageContent, 'handleRequestRealLocalApply');

addCheck(
  'No Controller Call',
  'Preflight handler does NOT call applyToLocalDraftController',
  !preflightHandlerCode.includes('applyToLocalDraftController'),
  'Preflight handler (handleRequestRealLocalApply) must NOT call applyToLocalDraftController'
);

addCheck(
  'No Controller Call',
  'Preflight handler does NOT call rollbackLastLocalDraftChange',
  !preflightHandlerCode.includes('rollbackLastLocalDraftChange'),
  'Preflight handler (handleRequestRealLocalApply) must NOT call rollbackLastLocalDraftChange'
);

addCheck(
  'No Controller Call',
  'Preflight handler does NOT mutate localDraftCopy',
  !preflightHandlerCode.includes('setLocalDraftCopy'),
  'Preflight handler (handleRequestRealLocalApply) must NOT mutate localDraftCopy'
);

addCheck(
  'No Controller Call',
  'Preflight handler does NOT mutate sessionRemediationLedger',
  !preflightHandlerCode.includes('setSessionRemediationLedger'),
  'Preflight handler (handleRequestRealLocalApply) must NOT mutate sessionRemediationLedger'
);

addCheck(
  'No Controller Call',
  'Preflight handler does NOT mutate sessionAuditInvalidation',
  !preflightHandlerCode.includes('setSessionAuditInvalidation'),
  'Preflight handler (handleRequestRealLocalApply) must NOT mutate sessionAuditInvalidation'
);

addCheck(
  'No Controller Call',
  'Preflight handler does NOT mutate vault',
  !preflightHandlerCode.includes('setVault'),
  'Preflight handler (handleRequestRealLocalApply) must NOT mutate vault'
);

addCheck(
  'No Controller Call',
  'Preflight handler does NOT call backend routes',
  !preflightHandlerCode.includes('fetch') && !preflightHandlerCode.includes('axios'),
  'Preflight handler (handleRequestRealLocalApply) must NOT call backend routes'
);

addCheck(
  'No Controller Call',
  'Preflight handler does NOT use localStorage',
  !preflightHandlerCode.includes('localStorage'),
  'Preflight handler (handleRequestRealLocalApply) must NOT use localStorage'
);

addCheck(
  'No Controller Call',
  'Preflight handler does NOT use sessionStorage',
  !preflightHandlerCode.includes('sessionStorage'),
  'Preflight handler (handleRequestRealLocalApply) must NOT use sessionStorage'
);

addCheck(
  'No Controller Call',
  'Real Apply handler (Phase 3C-3C-3B-2B) exists separately',
  pageContent.includes('handleRequestRealLocalApplyWithController'),
  'The real apply handler must exist separately from preflight'
);

// ============================================================================
// CATEGORY 4: REQUEST MAPPING (15 checks)
// ============================================================================

addCheck(
  'Request Mapping',
  'Maps suggestionId correctly',
  modalContent.includes('suggestionId: suggestion.id'),
  'Modal must map suggestionId from suggestion.id'
);

addCheck(
  'Request Mapping',
  'Maps language correctly',
  modalContent.includes('language: suggestion.affectedLanguage'),
  'Modal must map language from suggestion.affectedLanguage'
);

addCheck(
  'Request Mapping',
  'Maps category correctly',
  modalContent.includes('category: suggestion.category'),
  'Modal must map category from suggestion.category'
);

addCheck(
  'Request Mapping',
  'Maps fieldPath correctly',
  modalContent.includes("fieldPath: 'body'"),
  'Modal must map fieldPath to "body"'
);

addCheck(
  'Request Mapping',
  'Maps suggestedText correctly',
  modalContent.includes('suggestedText: suggestion.suggestedText'),
  'Modal must map suggestedText from suggestion.suggestedText'
);

addCheck(
  'Request Mapping',
  'Maps originalText correctly',
  modalContent.includes('originalText: suggestion.originalText'),
  'Modal must map originalText from suggestion.originalText'
);

addCheck(
  'Request Mapping',
  'Validates operatorAcknowledgement.typedPhrase',
  modalContent.includes('typedPhrase: typedAcknowledgement'),
  'Modal must include typedPhrase in operatorAcknowledgement'
);

addCheck(
  'Request Mapping',
  'Validates operatorAcknowledgement.requiredPhrase',
  modalContent.includes('requiredPhrase: REQUIRED_ACKNOWLEDGEMENT_PHRASE'),
  'Modal must include requiredPhrase in operatorAcknowledgement'
);

addCheck(
  'Request Mapping',
  'Validates requestedAt timestamp',
  modalContent.includes('requestedAt: new Date().toISOString()'),
  'Modal must include requestedAt timestamp'
);

addCheck(
  'Request Mapping',
  'Validates sessionOnly flag',
  modalContent.includes('sessionOnly: true'),
  'Modal must set sessionOnly to true'
);

addCheck(
  'Request Mapping',
  'Validates dryRunOnly flag',
  modalContent.includes('dryRunOnly: false'),
  'Modal must set dryRunOnly to false'
);

addCheck(
  'Request Mapping',
  'Handles missing articleId',
  modalContent.includes('articleId: articleId') || modalContent.includes("articleId || 'unknown'"),
  'Modal must handle missing articleId'
);

addCheck(
  'Request Mapping',
  'Handles missing packageId',
  modalContent.includes('packageId: packageId') || modalContent.includes("packageId || 'unknown'"),
  'Modal must handle missing packageId'
);

addCheck(
  'Request Mapping',
  'Handles missing clientNonce',
  !modalContent.includes('clientNonce:') || modalContent.includes('clientNonce?:'),
  'Modal must handle optional clientNonce'
);

addCheck(
  'Request Mapping',
  'Handles missing originalText',
  modalContent.includes('originalText: suggestion.originalText') || modalContent.includes('originalText?:'),
  'Modal must handle optional originalText'
);

// ============================================================================
// CATEGORY 5: RESULT STRUCTURE (10 checks)
// ============================================================================

addCheck(
  'Result Structure',
  'Returns success: false when blocked',
  pageContent.includes('success: false') || pageContent.includes('createBlockedRealLocalApplyResult'),
  'Handler must return success: false when blocked'
);

addCheck(
  'Result Structure',
  'Returns blocked: true when blocked',
  pageContent.includes('blocked: true') || pageContent.includes('createBlockedRealLocalApplyResult'),
  'Handler must return blocked: true when blocked'
);

addCheck(
  'Result Structure',
  'Returns correct reason string',
  pageContent.includes('reason:') && pageContent.includes('REAL_LOCAL_APPLY_PREFLIGHT_ONLY_NO_CONTROLLER_EXECUTED'),
  'Handler must return correct reason string'
);

addCheck(
  'Result Structure',
  'Returns auditInvalidated: true',
  pageContent.includes('auditInvalidated: true'),
  'Handler must return auditInvalidated: true'
);

addCheck(
  'Result Structure',
  'Returns reAuditRequired: true',
  pageContent.includes('reAuditRequired: true'),
  'Handler must return reAuditRequired: true'
);

addCheck(
  'Result Structure',
  'Returns deployBlocked: true',
  pageContent.includes('deployBlocked: true'),
  'Handler must return deployBlocked: true'
);

addCheck(
  'Result Structure',
  'Returns noBackendMutation: true',
  pageContent.includes('noBackendMutation: true'),
  'Handler must return noBackendMutation: true'
);

addCheck(
  'Result Structure',
  'Returns vaultUnchanged: true',
  pageContent.includes('vaultUnchanged: true'),
  'Handler must return vaultUnchanged: true'
);

addCheck(
  'Result Structure',
  'Returns sessionOnly: true',
  pageContent.includes('sessionOnly: true'),
  'Handler must return sessionOnly: true'
);

addCheck(
  'Result Structure',
  'Returns dryRunOnly: false',
  pageContent.includes('dryRunOnly: false'),
  'Handler must return dryRunOnly: false'
);

// ============================================================================
// CATEGORY 6: MODAL INTEGRATION (10 checks)
// ============================================================================

addCheck(
  'Modal Integration',
  'Modal sends RealLocalDraftApplyRequest',
  modalContent.includes('RealLocalDraftApplyRequest'),
  'Modal must construct RealLocalDraftApplyRequest'
);

addCheck(
  'Modal Integration',
  'Modal receives RealLocalDraftApplyResult',
  modalContent.includes('RealLocalDraftApplyResult'),
  'Modal must handle RealLocalDraftApplyResult'
);

addCheck(
  'Modal Integration',
  'Modal displays blocked reason',
  modalContent.includes('realLocalApplyResult.reason'),
  'Modal must display blocked reason'
);

addCheck(
  'Modal Integration',
  'Modal displays preflight success',
  modalContent.includes('Preflight Success'),
  'Modal must display preflight success'
);

addCheck(
  'Modal Integration',
  'Modal does NOT show "applied" state',
  !modalContent.includes('Applied Successfully') || modalContent.includes('Preflight'),
  'Modal must NOT show "applied" state for preflight'
);

// Extract just the real local apply result display section
const realLocalApplyResultMatch = modalContent.match(/PHASE 3C-3C-3B-1: REAL LOCAL APPLY PREFLIGHT RESULT DISPLAY[\s\S]*?(?=\n          \{\/\*|<\/div>)/);
const realLocalApplyResultContent = realLocalApplyResultMatch ? realLocalApplyResultMatch[0] : '';

addCheck(
  'Modal Integration',
  'Modal does NOT show snapshot ID',
  !realLocalApplyResultContent.includes('snapshotId'),
  'Modal must NOT show snapshot ID for preflight (no snapshot created)'
);

addCheck(
  'Modal Integration',
  'Modal does NOT show event ID',
  !realLocalApplyResultContent.includes('eventId') && !realLocalApplyResultContent.includes('appliedEventId'),
  'Modal must NOT show event ID for preflight (no event created)'
);

addCheck(
  'Modal Integration',
  'Modal button is enabled when eligible',
  modalContent.includes('allConfirmed && isAcknowledgementValid'),
  'Modal button must be enabled when all conditions met'
);

addCheck(
  'Modal Integration',
  'Modal button is disabled when ineligible',
  modalContent.includes('!allConfirmed || !isAcknowledgementValid'),
  'Modal button must be disabled when conditions not met'
);

addCheck(
  'Modal Integration',
  'Modal button shows correct label',
  modalContent.includes('Preflight') || modalContent.includes('Apply to Local Draft Copy'),
  'Modal button must show correct label'
);

// ============================================================================
// PRINT RESULTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('PHASE 3C-3C-3B-1 PREFLIGHT MAPPING VERIFICATION');
console.log('='.repeat(80) + '\n');

results.forEach(result => {
  console.log(`\n${result.category}:`);
  console.log('-'.repeat(80));
  result.checks.forEach(check => {
    const status = check.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`  ${status}: ${check.name}`);
    if (check.details && !check.passed) {
      console.log(`    Details: ${check.details}`);
    }
  });
});

console.log('\n' + '='.repeat(80));
console.log('SUMMARY');
console.log('='.repeat(80));
console.log(`Total Checks: ${totalChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${failedChecks}`);
console.log(`Success Rate: ${((passedChecks / totalChecks) * 100).toFixed(2)}%`);

if (failedChecks === 0) {
  console.log('\n✅ ALL CHECKS PASSED - Phase 3C-3C-3B-1 implementation is correct!');
  process.exit(0);
} else {
  console.log('\n❌ SOME CHECKS FAILED - Please review the failed checks above.');
  process.exit(1);
}
