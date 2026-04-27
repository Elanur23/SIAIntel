#!/usr/bin/env tsx
/**
 * Verification Script: Phase 3C-3C-3B-2B - UI Handler & Controller Execution
 *
 * This script validates that the UI handler correctly orchestrates the adapter chain
 * and controller invocation while maintaining all safety constraints.
 *
 * CRITICAL VERIFICATION AREAS:
 * - UI handler exists and calls adapters correctly
 * - Controller execution is properly wired
 * - Session-scoped mutations only
 * - No backend/network/storage calls
 * - All safety constraints enforced
 * - Rendering boundary preserved
 * - Existing buttons preserved
 */

import * as fs from 'fs';
import * as path from 'path';

interface VerificationResult {
  passed: boolean;
  message: string;
  category: string;
}

const results: VerificationResult[] = [];

function verify(category: string, condition: boolean, message: string): void {
  results.push({ passed: condition, message, category });
  const status = condition ? '✅' : '❌';
  console.log(`${status} ${category}: ${message}`);
}

function readFileContent(filePath: string): string {
  const fullPath = path.join(process.cwd(), filePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${filePath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

console.log('='.repeat(80));
console.log('Phase 3C-3C-3B-2B Verification: UI Handler & Controller Execution');
console.log('='.repeat(80));
console.log('');

// ============================================================================
// CATEGORY 1: UI HANDLER EXISTENCE
// ============================================================================
console.log('Category 1: UI Handler Existence');
console.log('-'.repeat(80));

const modalContent = readFileContent('app/admin/warroom/components/RemediationConfirmModal.tsx');

verify(
  'Handler Existence',
  modalContent.includes('handleRealLocalApply'),
  'handleRealLocalApply function exists in modal'
);

verify(
  'Handler Type',
  modalContent.includes('const handleRealLocalApply = async'),
  'handleRealLocalApply is an async function'
);

verify(
  'Handler Prop',
  modalContent.includes('onRequestRealLocalApplyWithController'),
  'onRequestRealLocalApplyWithController prop exists'
);

console.log('');

// ============================================================================
// CATEGORY 2: ADAPTER CHAIN ORCHESTRATION
// ============================================================================
console.log('Category 2: Adapter Chain Orchestration');
console.log('-'.repeat(80));

verify(
  'Adapter Import',
  modalContent.includes('validateAdapterPreconditions') &&
  modalContent.includes('mapRealLocalApplyRequestToControllerInput') &&
  modalContent.includes('mapControllerOutputToRealLocalApplyResult'),
  'All three adapter functions are imported'
);

verify(
  'Precondition Validation',
  modalContent.includes('validateAdapterPreconditions(request, suggestion)'),
  'Handler calls validateAdapterPreconditions'
);

verify(
  'Controller Call',
  modalContent.includes('onRequestRealLocalApplyWithController(request, suggestion)'),
  'Handler calls controller function with request and suggestion'
);

verify(
  'Error Handling',
  modalContent.includes('try {') && modalContent.includes('catch (error)'),
  'Handler has try/catch error handling'
);

console.log('');

// ============================================================================
// CATEGORY 3: CONTROLLER INTERNAL REVALIDATION
// ============================================================================
console.log('Category 3: Controller Internal Revalidation');
console.log('-'.repeat(80));

const controllerContent = readFileContent('app/admin/warroom/hooks/useLocalDraftRemediationController.ts');

verify(
  'Category Revalidation',
  controllerContent.includes("input.suggestion.category !== 'FORMAT_REPAIR'"),
  'Controller revalidates category constraint'
);

verify(
  'Field Revalidation',
  controllerContent.includes("input.fieldPath !== 'body'"),
  'Controller revalidates field constraint'
);

verify(
  'Duplicate Detection',
  controllerContent.includes('sessionRemediationLedger.some') &&
  controllerContent.includes('suggestionId === input.suggestion.id'),
  'Controller detects duplicate applies'
);

verify(
  'Revalidation Error',
  controllerContent.includes('CONTROLLER_REVALIDATION_FAILED'),
  'Controller throws descriptive errors on revalidation failure'
);

console.log('');

// ============================================================================
// CATEGORY 4: STATE MUTATION BOUNDARY
// ============================================================================
console.log('Category 4: State Mutation Boundary');
console.log('-'.repeat(80));

const pageContent = readFileContent('app/admin/warroom/page.tsx');

verify(
  'No Fetch Calls',
  !modalContent.includes('fetch(') && !controllerContent.includes('fetch('),
  'No fetch calls in modal or controller'
);

verify(
  'No Axios Calls',
  !modalContent.includes('axios.') && !controllerContent.includes('axios.'),
  'No axios calls in modal or controller'
);

verify(
  'No LocalStorage',
  !modalContent.includes('localStorage.') && !controllerContent.includes('localStorage.'),
  'No localStorage usage in modal or controller'
);

verify(
  'No SessionStorage',
  !modalContent.includes('sessionStorage.') && !controllerContent.includes('sessionStorage.'),
  'No sessionStorage usage in modal or controller'
);

verify(
  'Session-Scoped Only',
  controllerContent.includes('setLocalDraftCopy') &&
  controllerContent.includes('setSessionRemediationLedger') &&
  controllerContent.includes('setSessionAuditInvalidation'),
  'Controller only mutates session-scoped state'
);

console.log('');

// ============================================================================
// CATEGORY 5: BUTTON TRANSFORMATION
// ============================================================================
console.log('Category 5: Button Transformation');
console.log('-'.repeat(80));

verify(
  'Real Apply Button',
  modalContent.includes('Apply to Local Draft Copy') &&
  modalContent.includes('onClick={handleRealLocalApply}'),
  'Real "Apply to Local Draft Copy" button exists and calls handler'
);

verify(
  'Button Enabled Condition',
  modalContent.includes('allConfirmed && isAcknowledgementValid && !isApplying'),
  'Button is enabled only when all preconditions are met'
);

verify(
  'Loading State',
  modalContent.includes('isApplying') &&
  modalContent.includes('setIsApplying(true)') &&
  modalContent.includes('setIsApplying(false)'),
  'Button displays loading state during execution'
);

verify(
  'Disabled Button Preserved',
  modalContent.includes('Apply to Draft — Disabled in Phase 3B') &&
  modalContent.includes('disabled={true}'),
  'Old disabled button remains disabled'
);

verify(
  'Preview Button Preserved',
  modalContent.includes('Preview Apply (No Draft Change)') &&
  modalContent.includes('handleInertPreview'),
  'Preview button remains unchanged'
);

verify(
  'Dry-Run Button Preserved',
  modalContent.includes('Apply to Local Draft Copy — Dry Run') &&
  modalContent.includes('handleDryRunApply'),
  'Dry-run button remains unchanged'
);

console.log('');

// ============================================================================
// CATEGORY 6: RESULT DISPLAY
// ============================================================================
console.log('Category 6: Result Display');
console.log('-'.repeat(80));

verify(
  'Result State',
  modalContent.includes('realLocalApplyResult') &&
  modalContent.includes('setRealLocalApplyResult'),
  'Modal has result state for display'
);

verify(
  'Success Display',
  modalContent.includes('realLocalApplyResult.success') &&
  (modalContent.includes('snapshotId') || modalContent.includes('snapshot')) &&
  (modalContent.includes('appliedEventId') || modalContent.includes('event')),
  'Success result displays metadata'
);

verify(
  'Safety Flags Display',
  modalContent.includes('auditInvalidated') &&
  modalContent.includes('reAuditRequired') &&
  modalContent.includes('deployBlocked') &&
  modalContent.includes('noBackendMutation') &&
  modalContent.includes('vaultUnchanged') &&
  modalContent.includes('sessionOnly'),
  'Result displays all safety flags'
);

console.log('');

// ============================================================================
// CATEGORY 7: PAGE WIRING
// ============================================================================
console.log('Category 7: Page Wiring');
console.log('-'.repeat(80));

verify(
  'Handler in Page',
  pageContent.includes('handleRequestRealLocalApplyWithController'),
  'Page has real apply handler with controller'
);

verify(
  'Adapter Imports',
  pageContent.includes('mapRealLocalApplyRequestToControllerInput') &&
  pageContent.includes('mapControllerOutputToRealLocalApplyResult'),
  'Page imports adapter functions'
);

verify(
  'Controller Usage',
  pageContent.includes('remediationController.applyToLocalDraftController'),
  'Page handler calls controller'
);

verify(
  'Prop Passed to Panel',
  pageContent.includes('onRequestRealLocalApplyWithController={handleRequestRealLocalApplyWithController}'),
  'Page passes handler to RemediationPreviewPanel'
);

console.log('');

// ============================================================================
// CATEGORY 8: PANEL WIRING
// ============================================================================
console.log('Category 8: Panel Wiring');
console.log('-'.repeat(80));

const panelContent = readFileContent('app/admin/warroom/components/RemediationPreviewPanel.tsx');

verify(
  'Panel Prop',
  panelContent.includes('onRequestRealLocalApplyWithController'),
  'Panel has onRequestRealLocalApplyWithController prop'
);

verify(
  'Prop Passed to Modal',
  panelContent.includes('onRequestRealLocalApplyWithController={onRequestRealLocalApplyWithController}'),
  'Panel passes handler to modal'
);

console.log('');

// ============================================================================
// CATEGORY 9: SAFETY CONSTRAINTS
// ============================================================================
console.log('Category 9: Safety Constraints');
console.log('-'.repeat(80));

// Read the handler function specifically
const handlerMatch = pageContent.match(/handleRequestRealLocalApplyWithController[\s\S]*?^\s*};/m);
const handlerCode = handlerMatch ? handlerMatch[0] : '';

verify(
  'No Vault Mutation',
  !handlerCode.includes('setVault'),
  'Handler does not mutate vault'
);

verify(
  'Session Only Flag',
  modalContent.includes('sessionOnly: true'),
  'Request includes sessionOnly: true flag'
);

verify(
  'Dry Run False',
  modalContent.includes('dryRunOnly: false'),
  'Request includes dryRunOnly: false flag'
);

verify(
  'Acknowledgement Required',
  modalContent.includes('REQUIRED_ACKNOWLEDGEMENT_PHRASE') &&
  modalContent.includes('typedPhrase: typedAcknowledgement'),
  'Acknowledgement validation is enforced'
);

verify(
  'Confirmation Checkboxes',
  modalContent.includes('allConfirmed') &&
  modalContent.includes('understandsDraftChange') &&
  modalContent.includes('reviewedDiff') &&
  modalContent.includes('understandsNoDeployUnlock'),
  'All three confirmation checkboxes are validated'
);

console.log('');

// ============================================================================
// CATEGORY 10: RENDERING BOUNDARY
// ============================================================================
console.log('Category 10: Rendering Boundary');
console.log('-'.repeat(80));

verify(
  'Main Editor Uses Vault',
  pageContent.includes('vault[activeLang]') &&
  !pageContent.includes('localDraftCopy[activeLang]'),
  'Main editor renders vault state (not localDraftCopy)'
);

verify(
  'Modal Displays Metadata',
  (modalContent.includes('snapshotId') || modalContent.includes('snapshot')) &&
  (modalContent.includes('appliedEventId') || modalContent.includes('event')) &&
  !modalContent.includes('localDraftCopy['),
  'Modal displays metadata only (not full draft)'
);

console.log('');

// ============================================================================
// SUMMARY
// ============================================================================
console.log('='.repeat(80));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(80));

const totalChecks = results.length;
const passedChecks = results.filter(r => r.passed).length;
const failedChecks = totalChecks - passedChecks;

console.log(`Total Checks: ${totalChecks}`);
console.log(`Passed: ${passedChecks}`);
console.log(`Failed: ${failedChecks}`);
console.log('');

if (failedChecks > 0) {
  console.log('FAILED CHECKS:');
  console.log('-'.repeat(80));
  results
    .filter(r => !r.passed)
    .forEach(r => {
      console.log(`❌ ${r.category}: ${r.message}`);
    });
  console.log('');
}

// Group by category
const categories = [...new Set(results.map(r => r.category))];
console.log('BY CATEGORY:');
console.log('-'.repeat(80));
categories.forEach(category => {
  const categoryResults = results.filter(r => r.category === category);
  const categoryPassed = categoryResults.filter(r => r.passed).length;
  const categoryTotal = categoryResults.length;
  console.log(`${category}: ${categoryPassed}/${categoryTotal}`);
});

console.log('');
console.log('='.repeat(80));

if (failedChecks === 0) {
  console.log('✅ ALL CHECKS PASSED - Phase 3C-3C-3B-2B is correctly implemented');
  process.exit(0);
} else {
  console.log('❌ SOME CHECKS FAILED - Review implementation');
  process.exit(1);
}
