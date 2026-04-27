/**
 * PHASE 3C-3B-2: Apply-to-Local-Draft Callback Plumbing Verification Script
 *
 * This script ensures that:
 * 1. Typed callback plumbing exists.
 * 2. Handlers are dry-run only and perform no mutation.
 * 3. UI remains inert and unreachable for actual apply.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const modalPath = join(process.cwd(), 'app/admin/warroom/components/RemediationConfirmModal.tsx');
const panelPath = join(process.cwd(), 'app/admin/warroom/components/RemediationPreviewPanel.tsx');
const pagePath = join(process.cwd(), 'app/admin/warroom/page.tsx');
const typesPath = join(process.cwd(), 'lib/editorial/remediation-apply-types.ts');

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`[PASS] ${label}`);
  } else {
    console.error(`[FAIL] ${label}`);
    process.exit(1);
  }
}

console.log("--- PHASE 3C-3B-2 VERIFICATION START ---");

// 1. Files exist
check('remediation-apply-types.ts exists', existsSync(typesPath));
check('RemediationConfirmModal.tsx exists', existsSync(modalPath));
check('RemediationPreviewPanel.tsx exists', existsSync(panelPath));
check('page.tsx exists', existsSync(pagePath));

const typesContent = readFileSync(typesPath, 'utf8');
const modalContent = readFileSync(modalPath, 'utf8');
const panelContent = readFileSync(panelPath, 'utf8');
const pageContent = readFileSync(pagePath, 'utf8');

// 2. Types Check
check('LocalDraftApplyRequest type defined', typesContent.includes('export interface LocalDraftApplyRequest'));
check('LocalDraftApplyRequestResult type defined', typesContent.includes('export interface LocalDraftApplyRequestResult'));
check('DryRunOnly flag in types', typesContent.includes('dryRunOnly: true'));
check('NoMutation flag in result type', typesContent.includes('noMutation: true'));

// 3. Modal Plumbing
check('Modal accepts onRequestLocalDraftApply prop', modalContent.includes('onRequestLocalDraftApply?: (request: LocalDraftApplyRequest)'));
check('Modal Apply button remains disabled', modalContent.includes('disabled={true}'));
check('Modal contains "Disabled in Phase 3B"', modalContent.includes('Apply to Draft — Disabled in Phase 3B'));
check('Modal does NOT invoke onRequestLocalDraftApply', !modalContent.includes('onRequestLocalDraftApply('));

// 4. Panel Plumbing
check('Panel accepts onRequestLocalDraftApply prop', panelContent.includes('onRequestLocalDraftApply?: (request: LocalDraftApplyRequest)'));
check('Panel passes prop to Modal', panelContent.includes('onRequestLocalDraftApply={onRequestLocalDraftApply}'));

// 5. Page Handler Check
check('Page defines handleRequestLocalDraftApply', pageContent.includes('const handleRequestLocalDraftApply = (request: LocalDraftApplyRequest)'));
check('Page handler returns dryRunOnly: true', pageContent.includes('dryRunOnly: true'));
check('Page handler returns noMutation: true', pageContent.includes('noMutation: true'));
check('Page handler returns DRY_RUN_PLUMBING_ONLY_NO_APPLY_EXECUTED', pageContent.includes('DRY_RUN_PLUMBING_ONLY_NO_APPLY_EXECUTED'));
check('Page handler validates FORMAT_REPAIR', pageContent.includes('category === RemediationCategory.FORMAT_REPAIR'));
check('Page handler validates fieldPath === body', pageContent.includes("fieldPath === 'body'"));
check('Page handler validates language', pageContent.includes('!!language'));
check('Page handler validates suggestionId', pageContent.includes('!!suggestionId'));

// 6. Safety/Inertness Proof
check('Page handler does NOT call applyToLocalDraftController', !pageContent.match(/handleRequestLocalDraftApply[\s\S]*?remediationController\.applyToLocalDraft/));
check('Page handler does NOT call rollbackLastLocalDraftChange', !pageContent.match(/handleRequestLocalDraftApply[\s\S]*?remediationController\.rollbackLastLocalDraftChange/));
check('No fetch/axios/network calls added in handler', !pageContent.match(/handleRequestLocalDraftApply[\s\S]*?fetch\(/) && !pageContent.match(/handleRequestLocalDraftApply[\s\S]*?axios\./));
check('No storage calls added in handler', !pageContent.match(/handleRequestLocalDraftApply[\s\S]*?localStorage/) && !pageContent.match(/handleRequestLocalDraftApply[\s\S]*?sessionStorage/));

// 7. Component Wiring
check('Page passes handler to PreviewPanel', pageContent.includes('onRequestLocalDraftApply={handleRequestLocalDraftApply}'));

console.log("--- PHASE 3C-3B-2 VERIFICATION COMPLETE ---");
process.exit(0);
