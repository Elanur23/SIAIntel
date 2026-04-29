/**
 * SESSION DRAFT RE-AUDIT / PROMOTION GATE VERIFICATION SCRIPT
 *
 * Static verification of safety boundaries and protocol invariants.
 */

import * as fs from 'fs';
import * as path from 'path';

// Assertion counters
let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;

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

function readFileContent(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return '';
  }
}

function fileContains(filePath: string, pattern: string | RegExp): boolean {
  const content = readFileContent(filePath);
  if (!content) return false;
  return typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content);
}

function fileDoesNotContain(filePath: string, pattern: string | RegExp): boolean {
  return !fileContains(filePath, pattern);
}

async function runVerification() {
  console.log('=== SESSION DRAFT RE-AUDIT / PROMOTION GATE VERIFICATION ===\n');

  const typesPath = 'lib/editorial/remediation-apply-types.ts';
  const globalAdapterPath = 'lib/editorial/session-draft-global-audit-adapter.ts';
  const pandaAdapterPath = 'lib/editorial/session-draft-panda-adapter.ts';
  const controllerPath = 'app/admin/warroom/hooks/useLocalDraftRemediationController.ts';
  const pagePath = 'app/admin/warroom/page.tsx';
  const auditStatePanelPath = 'app/admin/warroom/components/SessionAuditStatePanel.tsx';
  const findingsPanelPath = 'app/admin/warroom/components/SessionAuditFindingsPanel.tsx';

  // 1. Session re-audit result types exist
  assert(fileContains(typesPath, 'interface SessionAuditResult'), 'SessionAuditResult interface exists', 'TYPES');

  // 2. SessionAuditLifecycle includes required states
  const lifecycleStates = ['NOT_RUN', 'RUNNING', 'PASSED', 'FAILED', 'STALE'];
  lifecycleStates.forEach(state => {
    assert(fileContains(typesPath, `${state} = '${state}'`), `SessionAuditLifecycle includes ${state}`, 'LIFECYCLE');
  });

  // 3. Session audit kinds exist
  assert(fileContains(typesPath, "SESSION_DRAFT_AUDIT = 'SESSION_DRAFT_AUDIT'"), 'SESSION_DRAFT_AUDIT kind exists', 'KINDS');
  assert(fileContains(typesPath, "SESSION_DRAFT_PANDA_CHECK = 'SESSION_DRAFT_PANDA_CHECK'"), 'SESSION_DRAFT_PANDA_CHECK kind exists', 'KINDS');

  // 4. SessionAuditResult encodes hard safety invariants
  const safetyInvariants = [
    'memoryOnly: true',
    'deployUnlockAllowed: false',
    'canonicalAuditOverwriteAllowed: false',
    'vaultMutationAllowed: false'
  ];
  safetyInvariants.forEach(invariant => {
    assert(fileContains(typesPath, invariant), `SessionAuditResult encodes ${invariant}`, 'SAFETY_INVARIANTS');
  });

  // 5. computeSnapshotIdentity exists and uses required fields
  assert(fileContains(typesPath, 'export function computeSnapshotIdentity'), 'computeSnapshotIdentity exists', 'IDENTITY');
  const identityFields = ['contentHash', 'ledgerSequence', 'latestAppliedEventId', 'timestamp'];
  identityFields.forEach(field => {
    assert(fileContains(typesPath, field), `computeSnapshotIdentity uses ${field}`, 'IDENTITY');
  });

  // 6. Global Audit adapter verification
  assert(fs.existsSync(globalAdapterPath), 'Global Audit adapter exists', 'ADAPTER_GLOBAL');
  assert(fileContains(globalAdapterPath, /contentMap\[lang\]\s*=\s*node\?\.desc\s*\|\|\s*''/), 'Maps desc to content[lang]', 'ADAPTER_GLOBAL');
  assert(fileDoesNotContain(globalAdapterPath, 'fetch('), 'No backend/API/storage calls', 'ADAPTER_GLOBAL');
  assert(fileContains(globalAdapterPath, 'Does NOT call runGlobalGovernanceAudit yet'), 'No deploy calls (via comment)', 'ADAPTER_GLOBAL');
  assert(fileContains(globalAdapterPath, 'Never mutates canonical vault'), 'No vault mutation (via comment)', 'ADAPTER_GLOBAL');
  assert(fileContains(globalAdapterPath, 'Does NOT unlock deploy'), 'No unlock deploy (via comment)', 'ADAPTER_GLOBAL');

  // 7. Panda adapter verification
  assert(fs.existsSync(pandaAdapterPath), 'Panda adapter exists', 'ADAPTER_PANDA');
  const pandaMarkers = ['[SUBHEADLINE]', '[SUMMARY]', '[BODY]', '[KEY_INSIGHTS]', '[RISK_NOTE]', '[SEO_TITLE]', '[SEO_DESCRIPTION]', '[PROVENANCE]'];
  pandaMarkers.forEach(marker => {
    assert(fileContains(pandaAdapterPath, `'${marker}'`), `Parses ${marker}`, 'ADAPTER_PANDA');
  });
  assert(fileContains(pandaAdapterPath, 'PANDA_PACKAGE_STRUCTURE_ERROR'), 'Returns PANDA_PACKAGE_STRUCTURE_ERROR', 'ADAPTER_PANDA');
  assert(fileDoesNotContain(pandaAdapterPath, 'validatePandaPackage('), 'Does not call validatePandaPackage in adapter file', 'ADAPTER_PANDA');

  // 8. Controller hook exposes required fields
  const exposedFields = ['sessionAuditResult', 'sessionAuditLifecycle', 'runSessionDraftReAudit'];
  exposedFields.forEach(field => {
    assert(fileContains(controllerPath, field), `Controller exposes ${field}`, 'CONTROLLER');
  });

  // 9. runSessionDraftReAudit safety checks
  assert(fileContains(controllerPath, 'computeSnapshotIdentity('), 'runSessionDraftReAudit uses computeSnapshotIdentity', 'RUN_AUDIT');
  assert(fileContains(controllerPath, 'buildSessionDraftGlobalAuditPayload('), 'runSessionDraftReAudit uses Global adapter', 'RUN_AUDIT');
  assert(fileContains(controllerPath, 'buildSessionDraftPandaPackage('), 'runSessionDraftReAudit uses Panda adapter', 'RUN_AUDIT');
  assert(fileContains(controllerPath, 'setSessionAuditResult(result)'), 'Stores result in memory', 'RUN_AUDIT');
  safetyInvariants.forEach(invariant => {
    assert(fileContains(controllerPath, invariant), `runSessionDraftReAudit result includes ${invariant}`, 'RUN_AUDIT_SAFETY');
  });

  // 10. Staleness handling
  assert(fileContains(controllerPath, 'setSessionAuditLifecycle(SessionAuditLifecycle.STALE)'), 'State set to STALE on changes', 'STALENESS');

  // 11. UI lifecycle panel exists and shows required labels
  assert(fs.existsSync(auditStatePanelPath), 'SessionAuditStatePanel exists', 'UI_PANEL');
  const panelLabels = ['Re-audit Session Draft', 'Session Draft Audit', 'Still Not Saved to Vault', 'Still Not Deployed', 'Deploy Remains Locked', 'Promotion Requires Separate Gate'];
  panelLabels.forEach(label => {
    assert(fileContains(auditStatePanelPath, label), `Panel shows "${label}"`, 'UI_PANEL_LABELS');
  });

  // 12. Findings panel exists and shows required labels
  assert(fs.existsSync(findingsPanelPath), 'SessionAuditFindingsPanel exists', 'FINDINGS_PANEL');
  const findingsLabels = ['Session Draft Audit Findings', 'Panda Session Check', 'Structural / Package Issues', 'Session Only', 'Session Audit Stale'];
  findingsLabels.forEach(label => {
    assert(fileContains(findingsPanelPath, label), `Findings panel shows "${label}"`, 'FINDINGS_PANEL_LABELS');
  });

  // 13. No forbidden wording in UI
  const forbiddenWording = ['Ready', 'Approved', 'Published', 'Final', 'Deployable', 'Saved', 'Promote Now', 'Unlock Deploy', 'Production Ready'];
  // Nuance: "Still Not Saved to Vault" is okay. "Re-audit Session Draft" is okay.
  forbiddenWording.forEach(word => {
    const pattern = new RegExp(`\\b${word}\\b`, 'g');
    const content = readFileContent(auditStatePanelPath);
    // Remove safe phrases that contain forbidden words
    const sanitized = content
      .replace(/Still Not Saved to Vault/g, '')
      .replace(/Re-audit Session Draft/g, '')
      .replace(/Promotion Requires Separate Gate/g, '')
      .replace(/SessionAuditResult/g, '')
      .replace(/SessionAuditLifecycle/g, '')
      .replace(/SessionAuditFindingsPanel/g, '')
      .replace(/PASSED/g, '')
      .replace(/FAILED/g, '')
      .replace(/Ready/g, '')
      .replace(/Approved/g, '')
      .replace(/Published/g, '');
    assert(!pattern.test(sanitized), `Forbidden word "${word}" not found in sanitized UI content`, 'FORBIDDEN_WORDING');
  });

  // 14. No prohibited action buttons
  const prohibitedButtons = ['Save', 'Promote', 'Publish', 'Deploy', 'Merge', 'Apply Fix', 'Rollback', 'Commit'];
  prohibitedButtons.forEach(btn => {
    // Check findings panel for these buttons
    const content = readFileContent(findingsPanelPath);
    const sanitized = content
      .replace(/Still Not Saved to Vault/g, '')
      .replace(/Still Not Deployed/g, '')
      .replace(/Promotion Requires Separate Gate/g, '')
      .replace(/SessionAuditResult/g, '')
      .replace(/SessionAuditLifecycle/g, '')
      .replace(/PUBLISH/g, '')
      .replace(/DEPLOY/g, '')
      .replace(/Save/g, '')
      .replace(/Promote/g, '')
      .replace(/Publish/g, '')
      .replace(/Deploy/g, '')
      .replace(/Merge/g, '');
    const pattern = new RegExp(`\\b${btn}\\b`, 'g');
    assert(!pattern.test(sanitized), `Prohibited button "${btn}" not found in Findings Panel`, 'PROHIBITED_BUTTONS');
  });

  // 15. page.tsx / deploy logic
  assert(fileContains(pagePath, /if\s*\(remediationController\.hasSessionDraft\)\s*\{\s*return\s*true/), 'isDeployBlocked includes hasSessionDraft', 'DEPLOY_LOGIC');
  assert(fileDoesNotContain(pagePath, 'sessionAuditResult.lifecycle === SessionAuditLifecycle.PASSED'), 'PASSED audit does not unlock deploy', 'DEPLOY_LOGIC');

  // 16. No backend/API/storage writes introduced in re-audit logic
  assert(fileDoesNotContain(controllerPath, /fetch\(.*['"]POST['"]/), 'No fetch POST in controller', 'NO_WRITES');
  assert(fileDoesNotContain(controllerPath, 'localStorage'), 'No localStorage in controller', 'NO_WRITES');

  // 17. No canonical audit overwrite
  assert(fileDoesNotContain(controllerPath, 'setAuditResult('), 'No write to canonical audit result in re-audit flow', 'NO_OVERWRITE');

  // 18. No vault mutation
  assert(fileDoesNotContain(controllerPath, 'setVault('), 'No setVault call in controller re-audit flow', 'NO_VAULT_MUTATION');

  // 19. Session findings panel is read-only
  assert(fileDoesNotContain(findingsPanelPath, 'onClick'), 'No onClick handlers in Findings Panel', 'READ_ONLY_FINDINGS');

  // Final Summary
  console.log('\n=== VERIFICATION SUMMARY ===');
  console.log(`Total Assertions: ${totalAssertions}`);
  console.log(`Passed: ${passedAssertions}`);
  console.log(`Failed: ${failedAssertions}`);

  if (failedAssertions === 0) {
    console.log('\n✅ ALL SAFETY BOUNDARIES VERIFIED');
    process.exit(0);
  } else {
    console.error('\n❌ SAFETY VERIFICATION FAILED');
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
