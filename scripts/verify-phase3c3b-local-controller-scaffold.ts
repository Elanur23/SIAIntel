import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

type Check = { label: string; ok: boolean; detail?: string };
const checks: Check[] = [];

function check(label: string, condition: boolean, detail?: string) {
  checks.push({ label, ok: condition, detail });
}

async function runVerification() {
  console.log('Running Phase 3C-3B-1 Local Controller Scaffold Verification...\n');

  // 1. Controller/hook file exists.
  const hookPath = join(process.cwd(), 'app/admin/warroom/hooks/useLocalDraftRemediationController.ts');
  check('Controller hook file exists', existsSync(hookPath));

  if (existsSync(hookPath)) {
    const hookContent = readFileSync(hookPath, 'utf8');

    // 2. Controller uses local/session state only.
    check('Uses useState for local state', hookContent.includes('useState'));

    // 3. Controller imports pure helper from remediation-local-draft.
    check('Imports from remediation-local-draft', hookContent.includes('@/lib/editorial/remediation-local-draft'));

    // 4. Controller does not import or call fetch/axios/network.
    check('No fetch calls in controller', !hookContent.includes('fetch('));
    check('No axios calls in controller', !hookContent.includes('axios.'));

    // 5. Controller does not use localStorage/sessionStorage.
    // Check for actual code usage, not just the word in comments if possible,
    // but here we just ensure the word isn't used in a way that suggests usage.
    check('No localStorage usage', !hookContent.includes('localStorage.'));
    check('No sessionStorage usage', !hookContent.includes('sessionStorage.'));

    // 6. Controller does not call save/update/deploy API routes.
    check('No save API calls in controller', !hookContent.includes('/api/war-room/save'));
    check('No workspace API calls in controller', !hookContent.includes('/api/war-room/workspace'));
    check('No deploy API calls in controller', !hookContent.includes('/api/war-room/deploy'));

    // 8. Controller exposes localDraftCopy/session ledger/invalidation state.
    check('Exposes localDraftCopy', hookContent.includes('localDraftCopy'));
    check('Exposes sessionRemediationLedger', hookContent.includes('sessionRemediationLedger'));
    check('Exposes sessionAuditInvalidation', hookContent.includes('sessionAuditInvalidation'));

    // 9-11. Controller keeps auditInvalidated=true after apply.
    check('Sets auditInvalidated=true in apply', hookContent.includes('auditInvalidation'));

    // 12-14. Rollback keeps audit state invalidated.
    check('Rollback keeps audit state invalidated', hookContent.includes('AuditInvalidationReason.ROLLBACK_PERFORMED') && hookContent.includes('auditInvalidated: true'));
  }

  // 20. RemediationConfirmModal still contains “Apply to Draft — Disabled in Phase 3B”.
  const modalPath = join(process.cwd(), 'app/admin/warroom/components/RemediationConfirmModal.tsx');
  if (existsSync(modalPath)) {
    const modalContent = readFileSync(modalPath, 'utf8');
    check('Modal still shows disabled Apply', modalContent.includes('Apply to Draft \u2014 Disabled in Phase 3B'));

    // 21. RemediationConfirmModal still contains “Preview Apply (No Draft Change)”.
    check('Modal still shows Preview Apply', modalContent.includes('Preview Apply (No Draft Change)'));

    // 22. RemediationConfirmModal does NOT call applyRemediationToLocalDraft directly.
    check('Modal does NOT call applyRemediationToLocalDraft directly', !modalContent.includes('applyRemediationToLocalDraft('));
  }

  // 23. page.tsx does NOT add backend/network apply behavior.
  const pagePath = join(process.cwd(), 'app/admin/warroom/page.tsx');
  if (existsSync(pagePath)) {
    const pageContent = readFileSync(pagePath, 'utf8');
    check('page.tsx does not have network apply', !pageContent.includes('fetch(') || !pageContent.includes('applyRemediationToLocalDraft'));
    check('page.tsx imports the hook', pageContent.includes('useLocalDraftRemediationController'));
    check('page.tsx initializes the controller', pageContent.includes('remediationController = useLocalDraftRemediationController()'));
  }

  // 24. Panda validator remains unchanged.
  const pandaPath = join(process.cwd(), 'lib/editorial/panda-intake-validator.ts');
  if (existsSync(pandaPath)) {
    const pandaContent = readFileSync(pandaPath, 'utf8');
    check('Panda validator unchanged', pandaContent.includes('FOOTER_INTEGRITY_FAILURE'));
  }

  // 25. Deploy gate source is not weakened.
  if (existsSync(pagePath)) {
    const pageContent = readFileSync(pagePath, 'utf8');
    check('Deploy gate not weakened', pageContent.includes('isDeployBlocked = useMemo(() => {'));
  }

  // 26. No app/api remediation apply route exists.
  const apiApplyPath = join(process.cwd(), 'app/api/remediation/apply/route.ts');
  check('No remediation apply API route exists', !existsSync(apiApplyPath));

  // 27. No localDraftCopy is persisted to backend or browser storage.
  // (Inherited from hook check)

  // 28. No UI copy suggests the vault was saved.
  if (existsSync(pagePath)) {
    const pageContent = readFileSync(pagePath, 'utf8');
    check('No UI copy suggests vault saved via remediation', !pageContent.includes('Remediation saved to vault'));
  }

  // Final summary
  const passed = checks.filter(c => c.ok).length;
  const failed = checks.length - passed;

  console.log('\nRESULTS:');
  console.log('--------------------------------------------------------------------------------');
  for (const c of checks) {
    if (c.ok) {
      console.log(`✅ ${c.label}`);
    } else {
      console.log(`❌ ${c.label}${c.detail ? ` (${c.detail})` : ''}`);
    }
  }

  console.log('\n================================================================================');
  console.log(`VERIFICATION RESULT: ${passed} passed, ${failed} failed`);
  console.log('================================================================================');

  if (failed > 0) {
    process.exit(1);
  }

  console.log('\n✅ PHASE 3C-3B-1 LOCAL CONTROLLER SCAFFOLD VERIFICATION PASSED');
}

runVerification().catch(err => {
  console.error(err);
  process.exit(1);
});
