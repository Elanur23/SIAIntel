import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  cloneLocalDraftForRemediation,
  applyRemediationToLocalDraft,
  rollbackLocalDraftFromSnapshot,
  LocalDraft
} from '../lib/editorial/remediation-local-draft';
import {
  RemediationCategory,
  RemediationSource,
  RemediationSeverity,
  RemediationSafetyLevel,
  RemediationFixType
} from '../lib/editorial/remediation-types';

type Check = { label: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function check(label: string, condition: boolean, detail?: string) {
  checks.push({ label, ok: condition, detail });
}

// ----------------------------------------------------------------------------
// TEST DATA
// ----------------------------------------------------------------------------

const mockVault: LocalDraft = {
  en: {
    title: 'Headline EN',
    desc: '[SUBHEADLINE]\nSubheadline EN\n\n[SUMMARY]\nSummary EN\n\n[BODY]\nOld body content EN\n\n[RISK_NOTE]\nRisk EN',
    ready: true
  },
  tr: {
    title: 'Headline TR',
    desc: '[SUBHEADLINE]\nSubheadline TR\n\n[SUMMARY]\nSummary TR\n\n[BODY]\nOld body content TR\n\n[RISK_NOTE]\nRisk TR',
    ready: true
  }
};

const eligibleSuggestion = {
  id: 'sugg-1',
  source: RemediationSource.globalAudit,
  category: RemediationCategory.FORMAT_REPAIR,
  severity: RemediationSeverity.INFO,
  safetyLevel: RemediationSafetyLevel.SAFE_FORMAT_ONLY,
  affectedLanguage: 'en',
  affectedField: 'body',
  issueType: 'whitespace',
  issueDescription: 'Extra whitespace in body',
  originalText: 'Old body content EN',
  suggestedText: 'New body content EN',
  rationale: 'Cleanup',
  fixType: RemediationFixType.format,
  requiresHumanApproval: false,
  canApplyToDraft: true,
  cannotAutoPublish: true,
  cannotAutoCommit: true,
  cannotAutoPush: true,
  cannotAutoDeploy: true,
  preservesFacts: true,
  preservesNumbers: true,
  preservesProvenance: true,
  requiresSourceVerification: false,
  validationTests: [],
  createdAt: new Date().toISOString()
};

const sourceReviewSuggestion = { ...eligibleSuggestion, id: 'sugg-src', category: RemediationCategory.SOURCE_REVIEW, suggestedText: null };
const humanOnlySuggestion = { ...eligibleSuggestion, id: 'sugg-human', safetyLevel: RemediationSafetyLevel.HUMAN_ONLY };

// ----------------------------------------------------------------------------
// TESTS
// ----------------------------------------------------------------------------

async function runTests() {
  console.log('Running Phase 3C-3A Local Draft Scaffold Verification...\n');

  // 1. cloneLocalDraftForRemediation returns a new object.
  const cloned = cloneLocalDraftForRemediation(mockVault);
  check('cloneLocalDraftForRemediation returns a new object', cloned !== mockVault);

  // 2. cloneLocalDraftForRemediation does not mutate the original.
  cloned.en.title = 'Mutated';
  check('cloneLocalDraftForRemediation does not mutate the original', mockVault.en.title === 'Headline EN');

  // 3. applyRemediationToLocalDraft changes only the local draft copy.
  const applyOutput = applyRemediationToLocalDraft({
    localDraft: mockVault,
    suggestion: eligibleSuggestion,
    language: 'en',
    fieldPath: 'body'
  });
  check('applyRemediationToLocalDraft changes the draft content', applyOutput.nextLocalDraft.en.desc.includes('New body content EN'));
  check('applyRemediationToLocalDraft does not change the input vault', mockVault.en.desc.includes('Old body content EN'));

  // 4. canonical vault object remains byte-identical after apply (conceptual check since we don't have a real DB here, but mockVault is our surrogate)
  check('Canonical vault remains untouched', JSON.stringify(mockVault).includes('Old body content EN'));

  // 5. DraftSnapshot captures exact beforeValue.
  check('DraftSnapshot captures exact beforeValue', applyOutput.snapshot.beforeValue === mockVault.en.desc);

  // 6. AppliedRemediationEvent records suggestionId, language, fieldPath, category.
  const ev = applyOutput.appliedEvent;
  check('AppliedRemediationEvent records metadata',
    ev.suggestionId === eligibleSuggestion.id &&
    ev.affectedLanguage === 'en' &&
    ev.affectedField === 'body' &&
    ev.category === RemediationCategory.FORMAT_REPAIR
  );

  // 7. auditInvalidated=true after apply.
  check('auditInvalidated=true after apply', applyOutput.auditInvalidated === true);

  // 8. reAuditRequired=true after apply.
  check('reAuditRequired=true after apply', applyOutput.reAuditRequired === true);

  // 9. deployBlocked=true after apply.
  check('deployBlocked=true after apply', applyOutput.deployBlocked === true);

  // 10. rollback restores localDraft body to snapshot.beforeValue.
  const rbOutput = rollbackLocalDraftFromSnapshot({
    localDraft: applyOutput.nextLocalDraft,
    snapshot: applyOutput.snapshot
  });
  check('Rollback restores localDraft content', rbOutput.restoredLocalDraft.en.desc === mockVault.en.desc);

  // 11. rollback does not mutate vault.
  check('Rollback does not mutate input draft', applyOutput.nextLocalDraft.en.desc.includes('New body content EN'));

  // 12. rollback keeps auditInvalidated=true.
  check('Rollback keeps auditInvalidated=true', rbOutput.auditInvalidated === true);

  // 13. rollback keeps reAuditRequired=true.
  check('Rollback keeps reAuditRequired=true', rbOutput.reAuditRequired === true);

  // 14. rollback keeps deployBlocked=true.
  check('Rollback keeps deployBlocked=true', rbOutput.deployBlocked === true);

  // 15. FORMAT_REPAIR is accepted only when safety/category are eligible.
  check('FORMAT_REPAIR accepted', !!applyOutput);

  // 16. SOURCE_REVIEW is rejected.
  try {
    applyRemediationToLocalDraft({ localDraft: mockVault, suggestion: sourceReviewSuggestion, language: 'en', fieldPath: 'body' });
    check('SOURCE_REVIEW is rejected', false);
  } catch (e) {
    check('SOURCE_REVIEW is rejected', true);
  }

  // 17. PROVENANCE_REVIEW is rejected.
  try {
    applyRemediationToLocalDraft({ localDraft: mockVault, suggestion: { ...eligibleSuggestion, category: RemediationCategory.PROVENANCE_REVIEW }, language: 'en', fieldPath: 'body' });
    check('PROVENANCE_REVIEW is rejected', false);
  } catch (e) {
    check('PROVENANCE_REVIEW is rejected', true);
  }

  // 18. PARITY_REVIEW is rejected.
  try {
    applyRemediationToLocalDraft({ localDraft: mockVault, suggestion: { ...eligibleSuggestion, category: RemediationCategory.PARITY_REVIEW }, language: 'en', fieldPath: 'body' });
    check('PARITY_REVIEW is rejected', false);
  } catch (e) {
    check('PARITY_REVIEW is rejected', true);
  }

  // 19. HUMAN_ONLY / FORBIDDEN_TO_AUTOFIX are rejected.
  try {
    applyRemediationToLocalDraft({ localDraft: mockVault, suggestion: humanOnlySuggestion, language: 'en', fieldPath: 'body' });
    check('HUMAN_ONLY is rejected', false);
  } catch (e) {
    check('HUMAN_ONLY is rejected', true);
  }

  // 20. unsupported fieldPath is rejected.
  try {
    applyRemediationToLocalDraft({ localDraft: mockVault, suggestion: eligibleSuggestion, language: 'en', fieldPath: 'headline' });
    check('Unsupported fieldPath rejected', false);
  } catch (e) {
    check('Unsupported fieldPath rejected', true);
  }

  // 21. missing language is rejected.
  try {
    applyRemediationToLocalDraft({ localDraft: mockVault, suggestion: eligibleSuggestion, language: '', fieldPath: 'body' });
    check('Missing language rejected', false);
  } catch (e) {
    check('Missing language rejected', true);
  }

  const helperFile = readFileSync(join(process.cwd(), 'lib/editorial/remediation-local-draft.ts'), 'utf8');
  // 22. no helper uses fetch/axios/network.
  check('No network calls in helper', !helperFile.includes('fetch') && !helperFile.includes('axios'));

  // 23. no helper uses localStorage/sessionStorage.
  check('No storage calls in helper', !helperFile.includes('localStorage') && !helperFile.includes('sessionStorage'));

  // 24. no API route is added.
  const apiFiles = join(process.cwd(), 'app/api');
  check('No API route added (remediation/apply)', !existsSync(join(apiFiles, 'remediation/apply/route.ts')));

  // 25. Panda validator remains unchanged.
  const pandaFile = readFileSync(join(process.cwd(), 'lib/editorial/panda-intake-validator.ts'), 'utf8');
  check('Panda validator unchanged (FOOTER_INTEGRITY_FAILURE)', pandaFile.includes('FOOTER_INTEGRITY_FAILURE'));

  // 26. RemediationConfirmModal still contains real Apply disabled copy.
  const modalFile = readFileSync(join(process.cwd(), 'app/admin/warroom/components/RemediationConfirmModal.tsx'), 'utf8');
  check('RemediationConfirmModal still disabled', modalFile.includes('Apply to Draft \u2014 Disabled in Phase 3B'));

  // 27. Phase 3C-2 inert preview copy remains present.
  check('Phase 3C-2 inert preview remains', modalFile.includes('Preview Apply (No Draft Change)'));

  // 28. Deploy gate source code is not changed to unlock deploy.
  const pageFile = readFileSync(join(process.cwd(), 'app/admin/warroom/page.tsx'), 'utf8');
  check('Deploy gate unchanged (isDeployBlocked)', pageFile.includes('const isDeployBlocked = useMemo(() => {'));
  check('Deploy gate still blocks without audit', pageFile.includes('if (!globalAudit || !globalAudit.publishable) {'));

  // 29. No backend mutation route exists for remediation apply.
  check('No backend mutation route for apply', !existsSync(join(apiFiles, 'remediation/apply/route.ts')));

  // 30. All helper outputs are plain objects, not runtime side effects.
  check('Helper output is plain object', typeof applyOutput === 'object' && applyOutput.constructor === Object);
  check('Rollback output is plain object', typeof rbOutput === 'object' && rbOutput.constructor === Object);

  // Final summary
  const passedCount = checks.filter(function(c) { return c.ok; }).length;
  const failedCount = checks.length - passedCount;

  console.log('\nRESULTS:');
  console.log('--------------------------------------------------------------------------------');
  for (const c of checks) {
    if (c.ok) {
      console.log('PASS: ' + c.label);
    } else {
      console.log('FAIL: ' + c.label + (c.detail ? ' (' + c.detail + ')' : ''));
    }
  }

  console.log('\n================================================================================');
  console.log('VERIFICATION RESULT: ' + passedCount + ' passed, ' + failedCount + ' failed');
  console.log('================================================================================');

  if (failedCount > 0) {
    process.exit(1);
  }

  console.log('\nPHASE 3C-3A SCAFFOLD VERIFICATION PASSED');
}

runTests().catch(function(err) {
  console.error(err);
  process.exit(1);
});
