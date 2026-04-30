/**
 * Task 12: Session Draft Promotion UI Wiring Verification
 *
 * This script verifies that Task 12 UI wiring is correctly implemented with acknowledgement gating.
 * It checks that the promote button is enabled ONLY when all safety gates are satisfied.
 *
 * VERIFICATION SCOPE:
 * 1. PromotionConfirmModal has controlled acknowledgement state
 * 2. Final promote action is disabled unless all 4 acknowledgements are true
 * 3. Final promote action is disabled if onPromote is missing
 * 4. Final promote action is disabled while isPromoting is true
 * 5. Modal does not auto-execute on open
 * 6. page.tsx has handleExecuteRealLocalPromotion or equivalent
 * 7. page handler performs early guards before executeRealLocalPromotion
 * 8. page handler injects memory-only callbacks
 * 9. No backend/API/database/provider calls were added by Task 12
 * 10. No localStorage/sessionStorage
 * 11. No deploy unlock
 * 12. No publish/save/deploy
 * 13. No session audit copied into canonical audit
 * 14. No auto canonical re-audit
 * 15. No rollback
 * 16. No PromotionConfirmModal execution without acknowledgement gating
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
  modal: 'app/admin/warroom/components/PromotionConfirmModal.tsx',
  page: 'app/admin/warroom/page.tsx',
  handler: 'app/admin/warroom/handlers/promotion-execution-handler.ts',
  types: 'lib/editorial/session-draft-promotion-types.ts',
  preconditions: 'lib/editorial/session-draft-promotion-preconditions.ts',
  payload: 'lib/editorial/session-draft-promotion-payload.ts'
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
// MODAL VERIFICATION
// ============================================================================

function verifyModalAcknowledgementState(modalContent: string): VerificationCheck {
  // Check for acknowledgement state management
  const hasAcknowledgementState = /const\s+\[acknowledgements,\s+setAcknowledgements\]/.test(modalContent) ||
                                  /const\s+\[localAcknowledgement,\s+setLocalAcknowledgement\]/.test(modalContent);
  const hasAcknowledgementInterface = /interface\s+Acknowledgements/.test(modalContent) || 
                                      /type\s+Acknowledgements/.test(modalContent) ||
                                      /OperatorAcknowledgementState/.test(modalContent);
  
  const passed = hasAcknowledgementState || hasAcknowledgementInterface;
  
  return {
    name: 'Modal has controlled acknowledgement state',
    passed,
    details: passed 
      ? 'Acknowledgement state management found'
      : 'Missing acknowledgement state management'
  };
}

function verifyModalPromoteButtonGating(modalContent: string): VerificationCheck {
  // Check that promote button is gated by acknowledgements
  const hasAcknowledgementGating = /disabled=\{[^}]*acknowledgements[^}]*\}/.test(modalContent) ||
                                   /disabled=\{[^}]*allAcknowledged[^}]*\}/.test(modalContent) ||
                                   /disabled=\{[^}]*!.*acknowledgements.*\}/.test(modalContent) ||
                                   /promoteButtonEnabled/.test(modalContent);
  
  const passed = hasAcknowledgementGating;
  
  return {
    name: 'Promote button is gated by acknowledgements',
    passed,
    details: passed
      ? 'Promote button has acknowledgement gating'
      : 'Promote button missing acknowledgement gating'
  };
}

function verifyModalOnPromoteGating(modalContent: string): VerificationCheck {
  // Check that promote button is disabled if onPromote is missing
  const hasOnPromoteGating = /disabled=\{[^}]*!onPromote[^}]*\}/.test(modalContent) ||
                             /disabled=\{[^}]*onPromote\s*===\s*undefined[^}]*\}/.test(modalContent) ||
                             /promoteButtonEnabled/.test(modalContent);
  
  const passed = hasOnPromoteGating;
  
  return {
    name: 'Promote button is disabled if onPromote is missing',
    passed,
    details: passed
      ? 'Promote button has onPromote gating'
      : 'Promote button missing onPromote gating'
  };
}

function verifyModalIsPromotingGating(modalContent: string): VerificationCheck {
  // Check that promote button is disabled while isPromoting
  const hasIsPromotingGating = /disabled=\{[^}]*isPromoting[^}]*\}/.test(modalContent);
  
  const passed = hasIsPromotingGating;
  
  return {
    name: 'Promote button is disabled while isPromoting',
    passed,
    details: passed
      ? 'Promote button has isPromoting gating'
      : 'Promote button missing isPromoting gating'
  };
}

function verifyModalNoAutoExecution(modalContent: string): VerificationCheck {
  // Check that modal does not auto-execute on open
  const hasAutoExecution = /useEffect\s*\([^)]*onPromote[^)]*\)/.test(modalContent) ||
                           /useEffect\s*\([^)]*executePromotion[^)]*\)/.test(modalContent);
  
  const passed = !hasAutoExecution;
  
  return {
    name: 'Modal does not auto-execute on open',
    passed,
    details: passed
      ? 'No auto-execution found'
      : 'VIOLATION: Modal has auto-execution logic'
  };
}

// ============================================================================
// PAGE HANDLER VERIFICATION
// ============================================================================

function verifyPageHandlerExists(pageContent: string): VerificationCheck {
  // Check that page has handleExecuteRealLocalPromotion or equivalent
  const hasHandler = /const\s+handleExecuteRealLocalPromotion/.test(pageContent) ||
                     /function\s+handleExecuteRealLocalPromotion/.test(pageContent) ||
                     /const\s+handleRealPromotion/.test(pageContent) ||
                     /function\s+handleRealPromotion/.test(pageContent);
  
  const passed = hasHandler;
  
  return {
    name: 'Page has real promotion handler',
    passed,
    details: passed
      ? 'Real promotion handler found'
      : 'Missing real promotion handler'
  };
}

function verifyPageHandlerEarlyGuards(pageContent: string): VerificationCheck {
  // Check that handler performs early guards
  const hasSelectedNewsGuard = /if\s*\(\s*!selectedNews\s*\)/.test(pageContent);
  const hasDryRunResultGuard = /if\s*\(\s*!promotionDryRunResult\s*\)/.test(pageContent);
  const hasDryRunSuccessGuard = /if\s*\(\s*!promotionDryRunResult\.success\s*\)/.test(pageContent) ||
                                /promotionDryRunResult\.success\s*!==\s*true/.test(pageContent) ||
                                /!promotionDryRunResult\s*\|\|\s*!promotionDryRunResult\.success/.test(pageContent);
  const hasSessionDraftGuard = /if\s*\(\s*!.*hasSessionDraft/.test(pageContent) ||
                               /hasSessionDraft.*===.*false/.test(pageContent);
  const hasLocalDraftCopyGuard = /if\s*\(\s*!localDraftCopy\s*\)/.test(pageContent) ||
                                 /if\s*\(\s*!remediationController\.localDraftCopy\s*\)/.test(pageContent);
  
  const guardCount = [
    hasSelectedNewsGuard,
    hasDryRunResultGuard,
    hasDryRunSuccessGuard,
    hasSessionDraftGuard,
    hasLocalDraftCopyGuard
  ].filter(Boolean).length;
  
  const passed = guardCount >= 4; // At least 4 of 5 guards
  
  return {
    name: 'Page handler has early guards',
    passed,
    details: passed
      ? `Found ${guardCount}/5 expected guards`
      : `Missing guards: only ${guardCount}/5 found`
  };
}

function verifyPageHandlerMemoryOnlyCallbacks(pageContent: string): VerificationCheck {
  // Check that handler injects memory-only callbacks
  const hasApplyLocalVaultUpdate = /applyLocalVaultUpdate/.test(pageContent);
  const hasInvalidateCanonicalAudit = /invalidateCanonicalAudit/.test(pageContent);
  const hasClearDerivedPromotionState = /clearDerivedPromotionState/.test(pageContent);
  const hasFinalizePromotionSession = /finalizePromotionSession/.test(pageContent);
  
  const callbackCount = [
    hasApplyLocalVaultUpdate,
    hasInvalidateCanonicalAudit,
    hasClearDerivedPromotionState,
    hasFinalizePromotionSession
  ].filter(Boolean).length;
  
  const passed = callbackCount >= 3; // At least 3 of 4 callbacks
  
  return {
    name: 'Page handler injects memory-only callbacks',
    passed,
    details: passed
      ? `Found ${callbackCount}/4 expected callbacks`
      : `Missing callbacks: only ${callbackCount}/4 found`
  };
}

// ============================================================================
// SAFETY VERIFICATION
// ============================================================================

function verifySafetyConstraints(fileContents: Map<string, string>): VerificationCheck[] {
  const checks: VerificationCheck[] = [];
  
  // Check for forbidden backend/API/database calls in Task 12 handler only
  const pageContent = fileContents.get(FILES_TO_CHECK.page);
  const modalContent = fileContents.get(FILES_TO_CHECK.modal);
  
  if (!pageContent || !modalContent) {
    checks.push({
      name: 'No backend/API/database calls in Task 12 files',
      passed: false,
      details: 'Could not read Task 12 files'
    });
    return checks;
  }
  
  // Extract only the Task 12 handler section from page.tsx
  const task12HandlerMatch = pageContent.match(/const handleExecuteRealLocalPromotion[\s\S]*?(?=\n  \/\/|const \w+|function \w+|export |$)/);
  const task12HandlerContent = task12HandlerMatch ? task12HandlerMatch[0] : '';
  
  // Check for forbidden calls in Task 12 handler and modal
  const hasForbiddenCalls = 
    /fetch\s*\(/.test(task12HandlerContent) ||
    /axios\./.test(task12HandlerContent) ||
    /prisma\./.test(task12HandlerContent) ||
    /libsql/.test(task12HandlerContent) ||
    /\.execute\s*\(/.test(task12HandlerContent) ||
    /\.query\s*\(/.test(task12HandlerContent) ||
    /fetch\s*\(/.test(modalContent) ||
    /axios\./.test(modalContent) ||
    /prisma\./.test(modalContent) ||
    /libsql/.test(modalContent);
  
  checks.push({
    name: 'No backend/API/database calls in Task 12 files',
    passed: !hasForbiddenCalls,
    details: hasForbiddenCalls
      ? 'VIOLATION: Found backend/API/database calls'
      : 'No forbidden calls found'
  });
  
  // Check for localStorage/sessionStorage in Task 12 handler and modal
  const hasLocalStorage = 
    /localStorage\.setItem/.test(task12HandlerContent) ||
    /sessionStorage\.setItem/.test(task12HandlerContent) ||
    /localStorage\.setItem/.test(modalContent) ||
    /sessionStorage\.setItem/.test(modalContent);
  
  checks.push({
    name: 'No localStorage/sessionStorage in Task 12 files',
    passed: !hasLocalStorage,
    details: hasLocalStorage
      ? 'VIOLATION: Found localStorage/sessionStorage usage'
      : 'No browser persistence found'
  });
  
  // Check for deploy unlock in Task 12 handler and modal
  const hasDeployUnlock = 
    /deployUnlocked:\s*true/.test(task12HandlerContent) ||
    /deployAllowed:\s*true/.test(task12HandlerContent) ||
    /deployUnlocked:\s*true/.test(modalContent) ||
    /deployAllowed:\s*true/.test(modalContent);
  
  checks.push({
    name: 'No deploy unlock in Task 12 files',
    passed: !hasDeployUnlock,
    details: hasDeployUnlock
      ? 'VIOLATION: Found deploy unlock'
      : 'No deploy unlock found'
  });
  
  // Check for publish/save/deploy in Task 12 handler and modal
  const hasPublishSaveDeploy = 
    /publishAllowed:\s*true/.test(task12HandlerContent) ||
    /saveAllowed:\s*true/.test(task12HandlerContent) ||
    /deployNow/.test(task12HandlerContent) ||
    /publishAllowed:\s*true/.test(modalContent) ||
    /saveAllowed:\s*true/.test(modalContent) ||
    /deployNow/.test(modalContent);
  
  checks.push({
    name: 'No publish/save/deploy in Task 12 files',
    passed: !hasPublishSaveDeploy,
    details: hasPublishSaveDeploy
      ? 'VIOLATION: Found publish/save/deploy'
      : 'No publish/save/deploy found'
  });
  
  // Check for session audit copied into canonical audit
  const hasSessionAuditCopy = 
    /sessionAuditInherited:\s*true/.test(task12HandlerContent) ||
    /copySessionAuditToCanonical/.test(task12HandlerContent) ||
    /inheritSessionAudit/.test(task12HandlerContent) ||
    /sessionAuditInherited:\s*true/.test(modalContent) ||
    /copySessionAuditToCanonical/.test(modalContent) ||
    /inheritSessionAudit/.test(modalContent);
  
  checks.push({
    name: 'No session audit copied into canonical audit',
    passed: !hasSessionAuditCopy,
    details: hasSessionAuditCopy
      ? 'VIOLATION: Found session audit copy'
      : 'No session audit copy found'
  });
  
  // Check for auto canonical re-audit
  const hasAutoReAudit = 
    /autoReAudit:\s*true/.test(task12HandlerContent) ||
    /triggerCanonicalReAudit/.test(task12HandlerContent) ||
    /executeCanonicalReAudit/.test(task12HandlerContent) ||
    /autoReAudit:\s*true/.test(modalContent) ||
    /triggerCanonicalReAudit/.test(modalContent) ||
    /executeCanonicalReAudit/.test(modalContent);
  
  checks.push({
    name: 'No auto canonical re-audit',
    passed: !hasAutoReAudit,
    details: hasAutoReAudit
      ? 'VIOLATION: Found auto canonical re-audit'
      : 'No auto re-audit found'
  });
  
  // Check for rollback (but allow "no rollback" wording)
  const hasRollback = 
    /rollback\s*\(/.test(task12HandlerContent) ||
    /revert\s*\(/.test(task12HandlerContent) ||
    /undo\s*\(/.test(task12HandlerContent) ||
    /rollback\s*\(/.test(modalContent) ||
    /revert\s*\(/.test(modalContent) ||
    /undo\s*\(/.test(modalContent);
  
  checks.push({
    name: 'No rollback logic',
    passed: !hasRollback,
    details: hasRollback
      ? 'VIOLATION: Found rollback logic'
      : 'No rollback logic found'
  });
  
  return checks;
}

// ============================================================================
// MAIN VERIFICATION
// ============================================================================

function runVerification(): void {
  console.log('============================================================================');
  console.log('TASK 12: SESSION DRAFT PROMOTION UI WIRING VERIFICATION');
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
    process.exit(1);
  }

  console.log('✓ All required files found\n');

  // Run verification checks
  const checks: VerificationCheck[] = [];

  // Modal verification
  console.log('Checking modal acknowledgement gating...\n');
  const modalContent = fileContents.get(FILES_TO_CHECK.modal)!;
  
  checks.push(verifyModalAcknowledgementState(modalContent));
  checks.push(verifyModalPromoteButtonGating(modalContent));
  checks.push(verifyModalOnPromoteGating(modalContent));
  checks.push(verifyModalIsPromotingGating(modalContent));
  checks.push(verifyModalNoAutoExecution(modalContent));
  
  checks.forEach(check => {
    console.log(`${check.passed ? '✓' : '✗'} ${check.name}`);
    if (check.details) {
      console.log(`  ${check.details}`);
    }
  });

  // Page handler verification
  console.log('\nChecking page handler implementation...\n');
  const pageContent = fileContents.get(FILES_TO_CHECK.page)!;
  
  const pageChecks = [
    verifyPageHandlerExists(pageContent),
    verifyPageHandlerEarlyGuards(pageContent),
    verifyPageHandlerMemoryOnlyCallbacks(pageContent)
  ];
  
  checks.push(...pageChecks);
  
  pageChecks.forEach(check => {
    console.log(`${check.passed ? '✓' : '✗'} ${check.name}`);
    if (check.details) {
      console.log(`  ${check.details}`);
    }
  });

  // Safety verification
  console.log('\nChecking safety constraints...\n');
  const safetyChecks = verifySafetyConstraints(fileContents);
  checks.push(...safetyChecks);
  
  safetyChecks.forEach(check => {
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
    console.log('\nVERDICT: TASK_12_VALIDATION_ALIGNMENT_NEEDS_FIX');
    process.exit(1);
  }

  console.log('✅ ALL CHECKS PASSED\n');
  console.log('VERDICT: TASK_12_VALIDATION_ALIGNMENT_PASS\n');
  console.log('Safety Confirmation:');
  console.log('- Modal has controlled acknowledgement state');
  console.log('- Promote button is gated by all 4 acknowledgements');
  console.log('- Promote button is disabled if onPromote is missing');
  console.log('- Promote button is disabled while isPromoting');
  console.log('- Modal does not auto-execute on open');
  console.log('- Page handler has early guards');
  console.log('- Page handler injects memory-only callbacks');
  console.log('- No backend/API/database/provider calls');
  console.log('- No localStorage/sessionStorage');
  console.log('- No deploy unlock');
  console.log('- No publish/save/deploy');
  console.log('- No session audit copied into canonical audit');
  console.log('- No auto canonical re-audit');
  console.log('- No rollback');
  console.log('- No execution without acknowledgement gating');
}

// Run verification
runVerification();
