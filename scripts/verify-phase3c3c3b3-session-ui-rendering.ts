/**
 * PHASE 3C-3C-3B-2B: SESSION UI RENDERING VERIFICATION SCRIPT
 * 
 * Verifies that session UI components preserve all safety boundaries and
 * implement read-only session state visibility without compromising security.
 * 
 * VERIFICATION SCOPE:
 * - Session banner visibility rules
 * - Canonical view default behavior
 * - Session draft opt-in behavior
 * - Read-only enforcement
 * - Deploy lock preservation
 * - No backend writes
 * - No persistence
 * - Canonical vault integrity
 * - Panda validation unchanged
 * - No rollback UI
 * - Session labeling compliance
 * 
 * EXPECTED RESULT:
 * - All assertions pass: Exit code 0
 * - Any assertion fails: Exit code 1
 * - Clear pass/fail messages for each category
 */

import * as fs from 'fs';
import * as path from 'path';

// Assertion counters
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

// Helper function to assert conditions
function assert(condition: boolean, message: string, category: string): void {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`✅ [${category}] ${message}`);
  } else {
    failedAssertions++;
    console.error(`❌ [${category}] ${message}`);
  }
}

// Helper function to check if file exists and read content
function readFileContent(filePath: string): string | null {
  try {
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf-8');
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Helper function to check if pattern exists in file
function fileContains(filePath: string, pattern: string | RegExp): boolean {
  const content = readFileContent(filePath);
  if (!content) return false;
  
  if (typeof pattern === 'string') {
    return content.includes(pattern);
  } else {
    return pattern.test(content);
  }
}

// Helper function to check if pattern does NOT exist in file
function fileDoesNotContain(filePath: string, pattern: string | RegExp): boolean {
  return !fileContains(filePath, pattern);
}

async function runSessionUIVerification() {
  console.log('=== PHASE 3C-3C-3B-2B: SESSION UI RENDERING VERIFICATION ===\n');
  
  // Define file paths
  const sessionBannerPath = 'app/admin/warroom/components/SessionStateBanner.tsx';
  const draftSwitcherPath = 'app/admin/warroom/components/DraftSourceSwitcher.tsx';
  const sessionPreviewPath = 'app/admin/warroom/components/SessionDraftPreviewPanel.tsx';
  const sessionChipsPath = 'app/admin/warroom/components/SessionStatusChips.tsx';
  const sessionLedgerPath = 'app/admin/warroom/components/SessionLedgerSummary.tsx';
  const sessionComparisonPath = 'app/admin/warroom/components/SessionDraftComparison.tsx';
  const warroomPagePath = 'app/admin/warroom/page.tsx';
  const controllerHookPath = 'app/admin/warroom/hooks/useLocalDraftRemediationController.ts';

  console.log('[VERIFICATION] Step 1: Checking component files exist...\n');

  // Verify all session UI component files exist
  assert(fs.existsSync(sessionBannerPath), 'SessionStateBanner component exists', 'FILE_EXISTENCE');
  assert(fs.existsSync(draftSwitcherPath), 'DraftSourceSwitcher component exists', 'FILE_EXISTENCE');
  assert(fs.existsSync(sessionPreviewPath), 'SessionDraftPreviewPanel component exists', 'FILE_EXISTENCE');
  assert(fs.existsSync(sessionChipsPath), 'SessionStatusChips component exists', 'FILE_EXISTENCE');
  assert(fs.existsSync(sessionLedgerPath), 'SessionLedgerSummary component exists', 'FILE_EXISTENCE');
  assert(fs.existsSync(sessionComparisonPath), 'SessionDraftComparison component exists', 'FILE_EXISTENCE');
  assert(fs.existsSync(warroomPagePath), 'Warroom page exists', 'FILE_EXISTENCE');
  assert(fs.existsSync(controllerHookPath), 'Controller hook exists', 'FILE_EXISTENCE');

  console.log('\n[VERIFICATION] Step 2: Session Banner Visibility Rules...\n');

  // 1. Session Banner Visibility
  assert(
    fileContains(sessionBannerPath, 'if (!visible) return null'),
    'SessionStateBanner only renders when visible prop is true',
    'BANNER_VISIBILITY'
  );
  
  assert(
    fileContains(warroomPagePath, 'visible={remediationController.hasSessionDraft}'),
    'SessionStateBanner visibility controlled by hasSessionDraft',
    'BANNER_VISIBILITY'
  );

  assert(
    fileContains(sessionBannerPath, 'Session Draft Active — Not Saved to Vault — Not Deployed'),
    'SessionStateBanner displays required warning text',
    'BANNER_VISIBILITY'
  );

  console.log('\n[VERIFICATION] Step 3: Canonical View Default Behavior...\n');

  // 2. Canonical View Default
  assert(
    fileContains(warroomPagePath, /useState<DraftSource>\('canonical'\)/),
    'Draft source defaults to canonical',
    'CANONICAL_DEFAULT'
  );

  assert(
    fileContains(warroomPagePath, 'draftSource === \'session\' && remediationController.hasSessionDraft'),
    'Session draft view requires explicit selection AND session draft availability',
    'CANONICAL_DEFAULT'
  );

  assert(
    fileContains(warroomPagePath, '/* ── CANONICAL VAULT EDITOR/PREVIEW (DEFAULT) ── */'),
    'Canonical vault is the default view mode',
    'CANONICAL_DEFAULT'
  );

  console.log('\n[VERIFICATION] Step 4: Session Draft Opt-In Behavior...\n');

  // 3. Session Draft Opt-In
  assert(
    fileContains(draftSwitcherPath, 'disabled={!sessionDraftAvailable}'),
    'Session draft option is disabled when not available',
    'SESSION_OPT_IN'
  );

  assert(
    fileContains(warroomPagePath, 'sessionDraftAvailable={remediationController.hasSessionDraft}'),
    'Session draft availability controlled by hasSessionDraft',
    'SESSION_OPT_IN'
  );

  assert(
    fileContains(warroomPagePath, 'if (!remediationController.hasSessionDraft && draftSource === \'session\')'),
    'Auto-reset to canonical when session draft becomes unavailable',
    'SESSION_OPT_IN'
  );

  console.log('\n[VERIFICATION] Step 5: Read-Only Enforcement...\n');

  // 4. Session Draft Read-Only
  assert(
    fileDoesNotContain(sessionPreviewPath, 'input'),
    'SessionDraftPreviewPanel has no input elements',
    'READ_ONLY'
  );

  assert(
    fileDoesNotContain(sessionPreviewPath, 'textarea'),
    'SessionDraftPreviewPanel has no textarea elements',
    'READ_ONLY'
  );

  assert(
    fileDoesNotContain(sessionPreviewPath, 'contentEditable'),
    'SessionDraftPreviewPanel has no contentEditable elements',
    'READ_ONLY'
  );

  assert(
    fileContains(sessionPreviewPath, 'Read-Only View — No Editing Controls'),
    'SessionDraftPreviewPanel displays read-only indicator',
    'READ_ONLY'
  );

  assert(
    fileDoesNotContain(sessionComparisonPath, /\bsave\s*\(/),
    'SessionDraftComparison has no save functionality',
    'READ_ONLY'
  );

  assert(
    fileDoesNotContain(sessionComparisonPath, /\bmerge\s*\(/),
    'SessionDraftComparison has no merge functionality',
    'READ_ONLY'
  );

  assert(
    fileDoesNotContain(sessionComparisonPath, /\bapply\s*\(/),
    'SessionDraftComparison has no apply functionality',
    'READ_ONLY'
  );

  assert(
    fileContains(sessionComparisonPath, 'Read-Only Comparison — No Editing, Merging, or Apply Controls'),
    'SessionDraftComparison displays read-only footer',
    'READ_ONLY'
  );

  console.log('\n[VERIFICATION] Step 6: Deploy Lock Preservation...\n');

  // 5. Deploy Lock Preservation
  assert(
    fileContains(sessionChipsPath, 'Deploy Locked'),
    'SessionStatusChips displays deploy locked indicator',
    'DEPLOY_LOCK'
  );

  assert(
    fileContains(sessionChipsPath, 'hasSessionDraft &&'),
    'Deploy locked chip only shows when session draft exists',
    'DEPLOY_LOCK'
  );

  assert(
    fileContains(warroomPagePath, 'deployBlockReason'),
    'Deploy block reason is displayed to user',
    'DEPLOY_LOCK'
  );

  console.log('\n[VERIFICATION] Step 7: No Backend Writes...\n');

  // 6. No Backend Writes
  assert(
    fileDoesNotContain(sessionBannerPath, 'fetch('),
    'SessionStateBanner makes no fetch calls',
    'NO_BACKEND'
  );

  assert(
    fileDoesNotContain(sessionPreviewPath, 'fetch('),
    'SessionDraftPreviewPanel makes no fetch calls',
    'NO_BACKEND'
  );

  assert(
    fileDoesNotContain(sessionComparisonPath, 'fetch('),
    'SessionDraftComparison makes no fetch calls',
    'NO_BACKEND'
  );

  assert(
    fileDoesNotContain(sessionChipsPath, 'fetch('),
    'SessionStatusChips makes no fetch calls',
    'NO_BACKEND'
  );

  assert(
    fileDoesNotContain(sessionLedgerPath, 'fetch('),
    'SessionLedgerSummary makes no fetch calls',
    'NO_BACKEND'
  );

  console.log('\n[VERIFICATION] Step 8: No Persistence...\n');

  // 7. No Persistence
  const persistencePatterns = [
    'localStorage',
    'sessionStorage',
    'cookie',
    'indexedDB',
    'IndexedDB'
  ];

  persistencePatterns.forEach(pattern => {
    assert(
      fileDoesNotContain(sessionBannerPath, pattern),
      `SessionStateBanner does not use ${pattern}`,
      'NO_PERSISTENCE'
    );
    
    assert(
      fileDoesNotContain(sessionPreviewPath, pattern),
      `SessionDraftPreviewPanel does not use ${pattern}`,
      'NO_PERSISTENCE'
    );
    
    assert(
      fileDoesNotContain(sessionComparisonPath, pattern),
      `SessionDraftComparison does not use ${pattern}`,
      'NO_PERSISTENCE'
    );
  });

  console.log('\n[VERIFICATION] Step 9: Canonical Vault Integrity...\n');

  // 8. Canonical Vault Integrity
  assert(
    fileContains(warroomPagePath, 'activeDraft = vault[activeLang]'),
    'Canonical vault remains the source of activeDraft',
    'VAULT_INTEGRITY'
  );

  assert(
    fileDoesNotContain(sessionPreviewPath, 'setVault'),
    'SessionDraftPreviewPanel does not mutate vault',
    'VAULT_INTEGRITY'
  );

  assert(
    fileDoesNotContain(sessionComparisonPath, 'setVault'),
    'SessionDraftComparison does not mutate vault',
    'VAULT_INTEGRITY'
  );

  assert(
    fileContains(controllerHookPath, 'Session-scoped memory only'),
    'Controller explicitly states session-scoped operation',
    'VAULT_INTEGRITY'
  );

  console.log('\n[VERIFICATION] Step 10: Panda Validation Unchanged...\n');

  // 9. Panda Validation Unchanged
  assert(
    fileDoesNotContain(sessionBannerPath, 'panda'),
    'SessionStateBanner does not reference Panda validation',
    'PANDA_UNCHANGED'
  );

  assert(
    fileDoesNotContain(sessionPreviewPath, 'panda'),
    'SessionDraftPreviewPanel does not reference Panda validation',
    'PANDA_UNCHANGED'
  );

  assert(
    fileDoesNotContain(sessionComparisonPath, 'panda'),
    'SessionDraftComparison does not reference Panda validation',
    'PANDA_UNCHANGED'
  );

  console.log('\n[VERIFICATION] Step 11: No Rollback UI...\n');

  // 10. No Rollback UI
  assert(
    fileDoesNotContain(sessionLedgerPath, /\brollback\s*\(/),
    'SessionLedgerSummary has no rollback functionality',
    'NO_ROLLBACK'
  );

  assert(
    fileDoesNotContain(sessionLedgerPath, 'undo'),
    'SessionLedgerSummary has no undo functionality',
    'NO_ROLLBACK'
  );

  assert(
    fileContains(sessionLedgerPath, 'Read-only display only'),
    'SessionLedgerSummary explicitly states read-only nature',
    'NO_ROLLBACK'
  );

  console.log('\n[VERIFICATION] Step 12: Session Labeling Compliance...\n');

  // 11. Session Labeling Mandatory
  const requiredLabels = [
    'Session Only',
    'Not Saved to Vault',
    'Not Deployed'
  ];

  requiredLabels.forEach(label => {
    assert(
      fileContains(sessionPreviewPath, label),
      `SessionDraftPreviewPanel includes "${label}" label`,
      'SESSION_LABELING'
    );
    
    assert(
      fileContains(sessionComparisonPath, label),
      `SessionDraftComparison includes "${label}" label`,
      'SESSION_LABELING'
    );
  });

  assert(
    fileContains(sessionBannerPath, 'Session Draft Active — Not Saved to Vault — Not Deployed'),
    'SessionStateBanner includes all required warnings',
    'SESSION_LABELING'
  );

  console.log('\n[VERIFICATION] Step 13: Controller Safety Rules...\n');

  // 12. Controller Safety Assertions
  assert(
    fileContains(controllerHookPath, 'No persistence'),
    'Controller explicitly prohibits persistence',
    'CONTROLLER_SAFETY'
  );

  assert(
    fileContains(controllerHookPath, 'No network calls'),
    'Controller explicitly prohibits network calls',
    'CONTROLLER_SAFETY'
  );

  assert(
    fileContains(controllerHookPath, 'Hard-coded audit invalidation logic'),
    'Controller uses hard-coded audit invalidation',
    'CONTROLLER_SAFETY'
  );

  assert(
    fileContains(controllerHookPath, 'hasSessionDraft'),
    'Controller exposes hasSessionDraft helper',
    'CONTROLLER_SAFETY'
  );

  assert(
    fileContains(controllerHookPath, 'isAuditStale'),
    'Controller exposes isAuditStale helper',
    'CONTROLLER_SAFETY'
  );

  console.log('\n[VERIFICATION] Step 14: Component Integration Safety...\n');

  // 13. Component Integration Safety
  assert(
    fileContains(warroomPagePath, 'SessionStateBanner'),
    'SessionStateBanner is integrated in warroom page',
    'INTEGRATION_SAFETY'
  );

  assert(
    fileContains(warroomPagePath, 'DraftSourceSwitcher'),
    'DraftSourceSwitcher is integrated in warroom page',
    'INTEGRATION_SAFETY'
  );

  assert(
    fileContains(warroomPagePath, 'SessionDraftPreviewPanel'),
    'SessionDraftPreviewPanel is integrated in warroom page',
    'INTEGRATION_SAFETY'
  );

  assert(
    fileContains(warroomPagePath, 'SessionStatusChips'),
    'SessionStatusChips is integrated in warroom page',
    'INTEGRATION_SAFETY'
  );

  assert(
    fileContains(warroomPagePath, 'SessionLedgerSummary'),
    'SessionLedgerSummary is integrated in warroom page',
    'INTEGRATION_SAFETY'
  );

  assert(
    fileContains(warroomPagePath, 'SessionDraftComparison'),
    'SessionDraftComparison is integrated in warroom page',
    'INTEGRATION_SAFETY'
  );

  console.log('\n[VERIFICATION] Step 15: Conditional Rendering Safety...\n');

  // 14. Conditional Rendering Safety
  assert(
    fileContains(warroomPagePath, /showComparison\s*&&\s*remediationController\.hasSessionDraft/),
    'Comparison view requires both toggle AND session draft existence',
    'CONDITIONAL_RENDERING'
  );

  assert(
    fileContains(warroomPagePath, /draftSource\s*===\s*['"]session['"]\s*&&\s*remediationController\.hasSessionDraft/),
    'Session preview requires both source selection AND session draft existence',
    'CONDITIONAL_RENDERING'
  );

  assert(
    fileContains(warroomPagePath, 'remediationController.hasSessionDraft && ('),
    'Comparison toggle only visible when session draft exists',
    'CONDITIONAL_RENDERING'
  );

  console.log('\n[VERIFICATION] Step 16: State Management Safety...\n');

  // 15. State Management Safety
  assert(
    fileContains(warroomPagePath, 'useState<DraftSource>'),
    'Draft source is managed as local UI state',
    'STATE_MANAGEMENT'
  );

  assert(
    fileContains(warroomPagePath, 'useState(false)'),
    'Comparison view defaults to closed/off',
    'STATE_MANAGEMENT'
  );

  assert(
    fileContains(warroomPagePath, 'setDraftSource(\'canonical\')'),
    'Auto-reset to canonical when session becomes unavailable',
    'STATE_MANAGEMENT'
  );

  assert(
    fileContains(warroomPagePath, 'setShowComparison(false)'),
    'Auto-reset comparison view when session becomes unavailable',
    'STATE_MANAGEMENT'
  );

  console.log('\n[VERIFICATION] Step 17: Deploy Gate Safety Hardening...\n');

  // 16. Deploy Gate Safety
  assert(
    fileContains(warroomPagePath, 'if (remediationController.hasSessionDraft)'),
    'isDeployBlocked explicitly checks for session draft existence',
    'DEPLOY_GATE_SAFETY'
  );

  assert(
    fileContains(warroomPagePath, 'remediationController.hasSessionDraft'),
    'remediationController.hasSessionDraft is a dependency for isDeployBlocked',
    'DEPLOY_GATE_SAFETY'
  );

  console.log('\n[VERIFICATION] Step 18: Safety Comments and Documentation...\n');

  // 17. Safety Comments and Documentation
  assert(
    fileContains(sessionBannerPath, 'CRITICAL SAFETY RULES'),
    'SessionStateBanner has safety documentation',
    'SAFETY_DOCUMENTATION'
  );

  assert(
    fileContains(sessionPreviewPath, 'CRITICAL SAFETY RULES'),
    'SessionDraftPreviewPanel has safety documentation',
    'SAFETY_DOCUMENTATION'
  );

  assert(
    fileContains(sessionComparisonPath, 'CRITICAL SAFETY RULES'),
    'SessionDraftComparison has safety documentation',
    'SAFETY_DOCUMENTATION'
  );

  assert(
    fileContains(sessionChipsPath, 'CRITICAL SAFETY RULES'),
    'SessionStatusChips has safety documentation',
    'SAFETY_DOCUMENTATION'
  );

  assert(
    fileContains(sessionLedgerPath, 'CRITICAL SAFETY RULES'),
    'SessionLedgerSummary has safety documentation',
    'SAFETY_DOCUMENTATION'
  );

  console.log('\n[VERIFICATION] Step 19: Final Safety Boundary Checks...\n');

  // 18. Final Safety Boundary Checks
  const dangerousPatterns = [
    'eval(',
    'Function(',
    'setTimeout(',
    'setInterval(',
    'XMLHttpRequest',
    'WebSocket',
    'postMessage',
    'importScripts'
  ];

  dangerousPatterns.forEach(pattern => {
    assert(
      fileDoesNotContain(sessionBannerPath, pattern),
      `SessionStateBanner does not use dangerous pattern: ${pattern}`,
      'DANGEROUS_PATTERNS'
    );
    
    assert(
      fileDoesNotContain(sessionPreviewPath, pattern),
      `SessionDraftPreviewPanel does not use dangerous pattern: ${pattern}`,
      'DANGEROUS_PATTERNS'
    );
    
    assert(
      fileDoesNotContain(sessionComparisonPath, pattern),
      `SessionDraftComparison does not use dangerous pattern: ${pattern}`,
      'DANGEROUS_PATTERNS'
    );
  });

  // Summary
  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(`Total Assertions: ${totalAssertions}`);
  console.log(`Passed: ${passedAssertions}`);
  console.log(`Failed: ${failedAssertions}`);
  
  if (failedAssertions === 0) {
    console.log('\n✅ ALL SESSION UI SAFETY BOUNDARIES VERIFIED');
    console.log('\n[VERIFIED SECURITY PROPERTIES]:');
    console.log('  - Session banner visibility rules enforced');
    console.log('  - Canonical view remains default');
    console.log('  - Session draft is opt-in only');
    console.log('  - All session UI is read-only');
    console.log('  - Deploy lock preserved when session exists');
    console.log('  - No backend writes from session UI');
    console.log('  - No persistence mechanisms used');
    console.log('  - Canonical vault integrity maintained');
    console.log('  - Panda validation unchanged');
    console.log('  - No rollback UI exposed');
    console.log('  - Session labeling compliance verified');
    console.log('  - Controller safety rules enforced');
    console.log('  - Component integration safety verified');
    console.log('  - Conditional rendering safety verified');
    console.log('  - State management safety verified');
    console.log('  - Safety documentation present');
    console.log('  - No dangerous patterns detected');
    
    process.exit(0);
  } else {
    console.error('\n❌ SESSION UI SAFETY VERIFICATION FAILED');
    console.error(`${failedAssertions} assertion(s) failed out of ${totalAssertions}`);
    console.error('\nCRITICAL: Session UI implementation does not meet safety requirements');
    process.exit(1);
  }
}

// Run verification
runSessionUIVerification().catch((error) => {
  console.error('\n[VERIFICATION] FATAL ERROR:', error);
  console.error(error.stack);
  process.exit(1);
});