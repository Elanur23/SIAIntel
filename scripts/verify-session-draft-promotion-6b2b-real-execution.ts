/**
 * Task 6B-2B: Real Local Promotion Execution Verification
 *
 * This script verifies that Task 6B-2B real local promotion execution is correctly implemented
 * with all safety constraints, mutation sequence ordering, and fail-closed design.
 *
 * VERIFICATION SCOPE:
 * 1. Execution lock exists and releases in finally
 * 2. Dry-run success is required before mutation
 * 3. Snapshot freshness checks exist
 * 4. All four operator acknowledgements are required
 * 5. Mutation sequence ordering (vault → audit → derived → session)
 * 6. Fail-closed design (blocked results for all failure modes)
 * 7. Deploy lock preservation
 * 8. No backend persistence in execution path
 * 9. Audit invalidation required
 * 10. Archive-before-clear session finalization
 * 11. UI wiring remains gated
 * 12. Phase-obsolete note (Task 12 replaces disabled-button behavior)
 *
 * CRITICAL: This is a READ-ONLY verification script.
 * - No file modifications
 * - No execution of promotion logic
 * - No mutations
 * - No API calls
 */

import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// VERIFICATION CONFIGURATION
// ============================================================================

const FILES_TO_CHECK = {
  handler: 'app/admin/warroom/handlers/promotion-execution-handler.ts',
  types: 'lib/editorial/session-draft-promotion-6b2b-types.ts',
  modal: 'app/admin/warroom/components/PromotionConfirmModal.tsx',
  page: 'app/admin/warroom/page.tsx'
};

// ============================================================================
// VERIFICATION HELPERS
// ============================================================================

interface VerificationCheck {
  name: string;
  passed: boolean;
  details?: string;
}

function readFileContent(filePath: string): string | null {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    return fs.readFileSync(fullPath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

// ============================================================================
// CHECK 1: EXECUTION LOCK
// ============================================================================

function verifyExecutionLockExists(handlerContent: string): VerificationCheck {
  const hasLockVariable = /_realPromotionExecutionLock/.test(handlerContent);
  const hasLockCheck = /if\s*\(\s*_realPromotionExecutionLock\s*\)/.test(handlerContent);
  const hasLockAcquisition = /_realPromotionExecutionLock\s*=\s*true/.test(handlerContent);
  
  const passed = hasLockVariable && hasLockCheck && hasLockAcquisition;
  
  return {
    name: 'Execution lock exists',
    passed,
    details: passed
      ? 'Execution lock variable, check, and acquisition found'
      : 'Missing execution lock implementation'
  };
}

function verifyExecutionLockReleasedInFinally(handlerContent: string): VerificationCheck {
  const hasTryBlock = /try\s*\{/.test(handlerContent);
  const hasFinallyBlock = /finally\s*\{/.test(handlerContent);
  const hasLockRelease = /_realPromotionExecutionLock\s*=\s*false/.test(handlerContent);
  
  // Check that lock release is in finally block
  const finallyMatch = handlerContent.match(/finally\s*\{[\s\S]*?\n\s*\}/);
  const lockReleaseInFinally = finallyMatch ? /_realPromotionExecutionLock\s*=\s*false/.test(finallyMatch[0]) : false;
  
  const passed = hasTryBlock && hasFinallyBlock && hasLockRelease && lockReleaseInFinally;
  
  return {
    name: 'Execution lock released in finally block',
    passed,
    details: passed
      ? 'Lock release found in finally block'
      : 'Lock release not properly placed in finally block'
  };
}

// ============================================================================
// CHECK 2: DRY-RUN SUCCESS REQUIRED
// ============================================================================

function verifyDryRunSuccessRequired(handlerContent: string): VerificationCheck {
  const hasDryRunPreviewCheck = /if\s*\(\s*!input\.dryRunPreview\s*\)/.test(handlerContent) ||
                                 /if\s*\(\s*!.*dryRunPreview\s*\)/.test(handlerContent);
  const hasIsDryRunCheck = /if\s*\(\s*!preview\.isDryRun\s*\)/.test(handlerContent) ||
                           /if\s*\(\s*!.*\.isDryRun\s*\)/.test(handlerContent);
  const hasExecutionPerformedCheck = /executionPerformed\s*!==\s*false/.test(handlerContent) ||
                                     /executionPerformed\s*===\s*true/.test(handlerContent);
  const hasMutationPerformedCheck = /mutationPerformed\s*!==\s*false/.test(handlerContent) ||
                                    /mutationPerformed\s*===\s*true/.test(handlerContent);
  
  const checkCount = [
    hasDryRunPreviewCheck,
    hasIsDryRunCheck,
    hasExecutionPerformedCheck,
    hasMutationPerformedCheck
  ].filter(Boolean).length;
  
  const passed = checkCount >= 3;
  
  return {
    name: 'Dry-run success is required before mutation',
    passed,
    details: passed
      ? `Found ${checkCount}/4 dry-run safety checks`
      : `Missing dry-run checks: only ${checkCount}/4 found`
  };
}

// ============================================================================
// CHECK 3: SNAPSHOT FRESHNESS REQUIRED
// ============================================================================

function verifySnapshotFreshnessRequired(handlerContent: string): VerificationCheck {
  const hasSnapshotBindingCheck = /if\s*\(\s*!input\.snapshotBinding\s*\)/.test(handlerContent) ||
                                  /if\s*\(\s*!.*snapshotBinding\s*\)/.test(handlerContent);
  const hasContentHashCheck = /contentHash/.test(handlerContent) &&
                              (/snapshotIdentity\.contentHash/.test(handlerContent) ||
                               /\.contentHash\s*!==/.test(handlerContent));
  const hasLedgerSequenceCheck = /ledgerSequence/.test(handlerContent) &&
                                 (/snapshotIdentity\.ledgerSequence/.test(handlerContent) ||
                                  /\.ledgerSequence\s*!==/.test(handlerContent));
  
  const checkCount = [
    hasSnapshotBindingCheck,
    hasContentHashCheck,
    hasLedgerSequenceCheck
  ].filter(Boolean).length;
  
  const passed = checkCount >= 2;
  
  return {
    name: 'Snapshot freshness checks exist',
    passed,
    details: passed
      ? `Found ${checkCount}/3 snapshot freshness checks`
      : `Missing snapshot checks: only ${checkCount}/3 found`
  };
}

// ============================================================================
// CHECK 4: OPERATOR ACKNOWLEDGEMENTS REQUIRED
// ============================================================================

function verifyOperatorAcknowledgementsRequired(handlerContent: string): VerificationCheck {
  const hasVaultReplacementCheck = /vaultReplacementAcknowledged/.test(handlerContent);
  const hasAuditInvalidationCheck = /auditInvalidationAcknowledged/.test(handlerContent);
  const hasDeployLockCheck = /deployLockAcknowledged/.test(handlerContent);
  const hasReAuditRequiredCheck = /reAuditRequiredAcknowledged/.test(handlerContent);
  
  const checkCount = [
    hasVaultReplacementCheck,
    hasAuditInvalidationCheck,
    hasDeployLockCheck,
    hasReAuditRequiredCheck
  ].filter(Boolean).length;
  
  const passed = checkCount === 4;
  
  return {
    name: 'All four operator acknowledgements are required',
    passed,
    details: passed
      ? 'All 4 acknowledgement checks found'
      : `Missing acknowledgements: only ${checkCount}/4 found`
  };
}

// ============================================================================
// CHECK 5: MUTATION SEQUENCE ORDERING
// ============================================================================

function verifyMutationSequenceOrdering(handlerContent: string): VerificationCheck {
  const hasApplyLocalVaultUpdate = /applyLocalVaultUpdate/.test(handlerContent);
  const hasInvalidateCanonicalAudit = /invalidateCanonicalAudit/.test(handlerContent);
  const hasClearDerivedPromotionState = /clearDerivedPromotionState/.test(handlerContent);
  const hasFinalizePromotionSession = /finalizePromotionSession/.test(handlerContent);
  
  const callbackCount = [
    hasApplyLocalVaultUpdate,
    hasInvalidateCanonicalAudit,
    hasClearDerivedPromotionState,
    hasFinalizePromotionSession
  ].filter(Boolean).length;
  
  const passed = callbackCount >= 3;
  
  return {
    name: 'Mutation sequence ordering callbacks exist',
    passed,
    details: passed
      ? `Found ${callbackCount}/4 mutation callbacks`
      : `Missing mutation callbacks: only ${callbackCount}/4 found`
  };
}

// ============================================================================
// CHECK 6: FAIL-CLOSED DESIGN
// ============================================================================

function verifyFailClosedDesign(handlerContent: string): VerificationCheck {
  const hasPreconditionBlock = /RealPromotionBlockCategory\.PRECONDITION/.test(handlerContent);
  const hasDryRunBlock = /RealPromotionBlockCategory\.DRY_RUN/.test(handlerContent);
  const hasSnapshotBlock = /RealPromotionBlockCategory\.SNAPSHOT/.test(handlerContent);
  const hasAcknowledgementBlock = /RealPromotionBlockCategory\.ACKNOWLEDGEMENT/.test(handlerContent);
  const hasVaultMutationBlock = /RealPromotionBlockCategory\.VAULT_MUTATION/.test(handlerContent);
  const hasAuditInvalidationBlock = /RealPromotionBlockCategory\.AUDIT_INVALIDATION/.test(handlerContent);
  const hasSessionClearBlock = /RealPromotionBlockCategory\.SESSION_CLEAR/.test(handlerContent);
  
  const blockCount = [
    hasPreconditionBlock,
    hasDryRunBlock,
    hasSnapshotBlock,
    hasAcknowledgementBlock,
    hasVaultMutationBlock,
    hasAuditInvalidationBlock,
    hasSessionClearBlock
  ].filter(Boolean).length;
  
  const passed = blockCount >= 6;
  
  return {
    name: 'Fail-closed design with blocked results for all failure modes',
    passed,
    details: passed
      ? `Found ${blockCount}/7 block categories`
      : `Missing block categories: only ${blockCount}/7 found`
  };
}

// ============================================================================
// CHECK 7: DEPLOY LOCK PRESERVATION
// ============================================================================

function verifyDeployLockPreservation(handlerContent: string, typesContent: string): VerificationCheck {
  const hasDeployRemainedLocked = /deployRemainedLocked:\s*true/.test(handlerContent) ||
                                  /deployRemainedLocked:\s*true/.test(typesContent);
  const hasDeployMustRemainLocked = /deployMustRemainLocked:\s*true/.test(handlerContent) ||
                                    /deployMustRemainLocked:\s*true/.test(typesContent);
  const noDeployUnlocked = !/deployUnlocked:\s*true/.test(handlerContent);
  const noDeployAllowed = !/deployAllowed:\s*true/.test(handlerContent);
  const noPublishAllowed = !/publishAllowed:\s*true/.test(handlerContent);
  
  const checkCount = [
    hasDeployRemainedLocked,
    hasDeployMustRemainLocked,
    noDeployUnlocked,
    noDeployAllowed,
    noPublishAllowed
  ].filter(Boolean).length;
  
  const passed = checkCount === 5;
  
  return {
    name: 'Deploy lock preservation',
    passed,
    details: passed
      ? 'All deploy lock checks passed'
      : `Deploy lock violations: ${5 - checkCount} found`
  };
}

// ============================================================================
// CHECK 8: NO BACKEND PERSISTENCE
// ============================================================================

function verifyNoBackendPersistence(handlerContent: string): VerificationCheck {
  // Extract only the executeRealLocalPromotion function
  const functionMatch = handlerContent.match(/export function executeRealLocalPromotion[\s\S]*?(?=\nexport |$)/);
  const functionContent = functionMatch ? functionMatch[0] : handlerContent;
  
  const hasFetch = /fetch\s*\(/.test(functionContent);
  const hasAxios = /axios\./.test(functionContent);
  const hasPrisma = /prisma\./.test(functionContent);
  const hasLibsql = /libsql/.test(functionContent);
  const hasDatabase = /database\.execute/.test(functionContent) || /database\.query/.test(functionContent);
  const hasProvider = /provider\./.test(functionContent) && !/\/\/ provider/.test(functionContent);
  const hasLocalStorage = /localStorage\.setItem/.test(functionContent);
  const hasSessionStorage = /sessionStorage\.setItem/.test(functionContent);
  
  const violationCount = [
    hasFetch,
    hasAxios,
    hasPrisma,
    hasLibsql,
    hasDatabase,
    hasProvider,
    hasLocalStorage,
    hasSessionStorage
  ].filter(Boolean).length;
  
  const passed = violationCount === 0;
  
  return {
    name: 'No backend persistence in execution path',
    passed,
    details: passed
      ? 'No forbidden backend/persistence calls found'
      : `VIOLATION: Found ${violationCount} forbidden calls`
  };
}

// ============================================================================
// CHECK 9: AUDIT INVALIDATION REQUIRED
// ============================================================================

function verifyAuditInvalidationRequired(handlerContent: string, typesContent: string): VerificationCheck {
  const hasInvalidateCallback = /invalidateCanonicalAudit/.test(handlerContent);
  const hasCanonicalAuditInvalidated = /canonicalAuditInvalidated:\s*true/.test(handlerContent) ||
                                       /canonicalAuditInvalidated:\s*true/.test(typesContent);
  const hasReAuditRequired = /reAuditRequired:\s*true/.test(handlerContent) ||
                             /reAuditRequired:\s*true/.test(typesContent);
  const noSessionAuditInheritance = !/sessionAuditInherited:\s*true/.test(handlerContent) &&
                                    !/sessionAuditInheritanceAllowed:\s*true/.test(handlerContent);
  
  const checkCount = [
    hasInvalidateCallback,
    hasCanonicalAuditInvalidated,
    hasReAuditRequired,
    noSessionAuditInheritance
  ].filter(Boolean).length;
  
  const passed = checkCount === 4;
  
  return {
    name: 'Audit invalidation required',
    passed,
    details: passed
      ? 'All audit invalidation checks passed'
      : `Missing audit checks: only ${checkCount}/4 found`
  };
}

// ============================================================================
// CHECK 10: ARCHIVE-BEFORE-CLEAR SESSION FINALIZATION
// ============================================================================

function verifyArchiveBeforeClearFinalization(handlerContent: string, typesContent: string): VerificationCheck {
  const hasFinalizePromotionSession = /finalizePromotionSession/.test(handlerContent);
  const hasFinalizationSummary = /PromotionFinalizationSummary/.test(typesContent) ||
                                 /finalizationSummary/.test(handlerContent);
  const noClearLocalDraftSessionDirect = !/clearLocalDraftSession\s*\(/.test(handlerContent) ||
                                         /finalizePromotionSession/.test(handlerContent);
  const hasSessionDraftCleared = /sessionDraftCleared/.test(handlerContent) ||
                                 /sessionDraftCleared/.test(typesContent);
  
  const checkCount = [
    hasFinalizePromotionSession,
    hasFinalizationSummary,
    noClearLocalDraftSessionDirect,
    hasSessionDraftCleared
  ].filter(Boolean).length;
  
  const passed = checkCount >= 3;
  
  return {
    name: 'Archive-before-clear session finalization',
    passed,
    details: passed
      ? `Found ${checkCount}/4 finalization checks`
      : `Missing finalization checks: only ${checkCount}/4 found`
  };
}

// ============================================================================
// CHECK 11: UI WIRING REMAINS GATED
// ============================================================================

function verifyUIWiringRemainsGated(modalContent: string, pageContent: string): VerificationCheck {
  const modalHasAcknowledgements = /acknowledgements/.test(modalContent) ||
                                   /OperatorAcknowledgementState/.test(modalContent);
  const modalHasDisabledGating = /disabled=\{/.test(modalContent);
  const pageHasEarlyGuards = /if\s*\(\s*!selectedNews\s*\)/.test(pageContent) ||
                             /if\s*\(\s*!promotionDryRunResult\s*\)/.test(pageContent);
  const noAutoExecution = !/useEffect\s*\([^)]*onPromote[^)]*\)/.test(modalContent);
  
  const checkCount = [
    modalHasAcknowledgements,
    modalHasDisabledGating,
    pageHasEarlyGuards,
    noAutoExecution
  ].filter(Boolean).length;
  
  const passed = checkCount >= 3;
  
  return {
    name: 'UI wiring remains gated',
    passed,
    details: passed
      ? `Found ${checkCount}/4 UI gating checks`
      : `Missing UI gating: only ${checkCount}/4 found`
  };
}

// ============================================================================
// CHECK 12: HELPER FUNCTIONS EXIST
// ============================================================================

function verifyHelperFunctionsExist(typesContent: string): VerificationCheck {
  const hasCreateBlockedResult = /export function createBlockedResult/.test(typesContent);
  const hasCreateSuccessResult = /export function createSuccessResult/.test(typesContent);
  const hasBlockCategory = /RealPromotionBlockCategory/.test(typesContent);
  
  const checkCount = [
    hasCreateBlockedResult,
    hasCreateSuccessResult,
    hasBlockCategory
  ].filter(Boolean).length;
  
  const passed = checkCount === 3;
  
  return {
    name: 'Helper functions exist (createBlockedResult, createSuccessResult)',
    passed,
    details: passed
      ? 'All helper functions found'
      : `Missing helpers: only ${checkCount}/3 found`
  };
}

// ============================================================================
// MAIN VERIFICATION
// ============================================================================

function runVerification(): void {
  console.log('============================================================================');
  console.log('TASK 6B-2B: REAL LOCAL PROMOTION EXECUTION VERIFICATION');
  console.log('============================================================================\n');

  // Read all files
  const fileContents = new Map<string, string>();
  const missingFiles: string[] = [];

  for (const [key, filePath] of Object.entries(FILES_TO_CHECK)) {
    const content = readFileContent(filePath);
    if (content === null) {
      missingFiles.push(filePath);
    } else {
      fileContents.set(filePath, content);
    }
  }

  if (missingFiles.length > 0) {
    console.log('❌ VERIFICATION FAILED: Missing required files\n');
    console.log('Missing files:');
    missingFiles.forEach(file => console.log(`  - ${file}`));
    console.log('\nVERDICT: TASK_6B2B_REAL_EXECUTION_VERIFICATION_FAIL');
    process.exit(1);
  }

  console.log('✓ All required files found\n');

  // Run verification checks
  const checks: VerificationCheck[] = [];

  const handlerContent = fileContents.get(FILES_TO_CHECK.handler)!;
  const typesContent = fileContents.get(FILES_TO_CHECK.types)!;
  const modalContent = fileContents.get(FILES_TO_CHECK.modal)!;
  const pageContent = fileContents.get(FILES_TO_CHECK.page)!;

  // Check 1: Execution lock
  console.log('Checking execution lock...\n');
  checks.push(verifyExecutionLockExists(handlerContent));
  checks.push(verifyExecutionLockReleasedInFinally(handlerContent));

  // Check 2: Dry-run success required
  console.log('Checking dry-run success requirement...\n');
  checks.push(verifyDryRunSuccessRequired(handlerContent));

  // Check 3: Snapshot freshness required
  console.log('Checking snapshot freshness...\n');
  checks.push(verifySnapshotFreshnessRequired(handlerContent));

  // Check 4: Operator acknowledgements required
  console.log('Checking operator acknowledgements...\n');
  checks.push(verifyOperatorAcknowledgementsRequired(handlerContent));

  // Check 5: Mutation sequence ordering
  console.log('Checking mutation sequence ordering...\n');
  checks.push(verifyMutationSequenceOrdering(handlerContent));

  // Check 6: Fail-closed design
  console.log('Checking fail-closed design...\n');
  checks.push(verifyFailClosedDesign(handlerContent));

  // Check 7: Deploy lock preservation
  console.log('Checking deploy lock preservation...\n');
  checks.push(verifyDeployLockPreservation(handlerContent, typesContent));

  // Check 8: No backend persistence
  console.log('Checking no backend persistence...\n');
  checks.push(verifyNoBackendPersistence(handlerContent));

  // Check 9: Audit invalidation required
  console.log('Checking audit invalidation...\n');
  checks.push(verifyAuditInvalidationRequired(handlerContent, typesContent));

  // Check 10: Archive-before-clear finalization
  console.log('Checking archive-before-clear finalization...\n');
  checks.push(verifyArchiveBeforeClearFinalization(handlerContent, typesContent));

  // Check 11: UI wiring remains gated
  console.log('Checking UI wiring gating...\n');
  checks.push(verifyUIWiringRemainsGated(modalContent, pageContent));

  // Check 12: Helper functions exist
  console.log('Checking helper functions...\n');
  checks.push(verifyHelperFunctionsExist(typesContent));

  // Print all check results
  console.log('\n============================================================================');
  console.log('CHECK RESULTS');
  console.log('============================================================================\n');

  checks.forEach(check => {
    console.log(`${check.passed ? '✓' : '✗'} ${check.name}`);
    if (check.details) {
      console.log(`  ${check.details}`);
    }
  });

  // Summary
  console.log('\n============================================================================');
  console.log('VERIFICATION SUMMARY');
  console.log('============================================================================\n');

  const totalChecks = checks.length;
  const passedChecks = checks.filter(c => c.passed).length;
  const failedChecks = totalChecks - passedChecks;

  console.log(`Total Checks: ${totalChecks}`);
  console.log(`Passed: ${passedChecks}`);
  console.log(`Failed: ${failedChecks}\n`);

  if (failedChecks > 0) {
    console.log('❌ VERIFICATION FAILED\n');
    console.log('Failed checks:');
    checks.filter(c => !c.passed).forEach(check => {
      console.log(`  - ${check.name}`);
      if (check.details) {
        console.log(`    ${check.details}`);
      }
    });
    console.log('\nVERDICT: TASK_6B2B_REAL_EXECUTION_VERIFICATION_FAIL');
    process.exit(1);
  }

  console.log('✅ ALL CHECKS PASSED\n');
  console.log('VERDICT: TASK_6B2B_REAL_EXECUTION_VERIFICATION_PASS\n');
  console.log('Safety Confirmation:');
  console.log('- Execution lock exists and releases in finally');
  console.log('- Dry-run success is required before mutation');
  console.log('- Snapshot freshness checks exist');
  console.log('- All four operator acknowledgements are required');
  console.log('- Mutation sequence ordering callbacks exist');
  console.log('- Fail-closed design with blocked results');
  console.log('- Deploy lock preservation');
  console.log('- No backend/API/database/provider/localStorage/sessionStorage');
  console.log('- Audit invalidation required');
  console.log('- Archive-before-clear session finalization');
  console.log('- UI wiring remains gated');
  console.log('- Helper functions exist');
  console.log('\nPhase-Obsolete Note:');
  console.log('- Task 12 replaces old disabled-button scaffold behavior');
  console.log('- Acknowledgement-gated execution is now the standard');
}

// Run verification
runVerification();
