/**
 * PHASE 3C-3C-3A: Real Local Apply Contract Hardening Verification Script
 *
 * This script ensures that the strict types and pure guard helpers are correctly
 * implemented and that no runtime wiring or mutations were introduced.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Import from the actual file to test runtime logic
import {
  RealLocalApplyBlockReason,
  isRealLocalDraftApplyRequestEligible,
  getRealLocalDraftApplyBlockReason,
  createBlockedRealLocalApplyResult,
  createSuccessfulRealLocalApplyResult
} from '../lib/editorial/remediation-apply-types';
import { RemediationCategory } from '../lib/editorial/remediation-types';

const typesPath = join(process.cwd(), 'lib/editorial/remediation-apply-types.ts');
const pagePath = join(process.cwd(), 'app/admin/warroom/page.tsx');
const modalPath = join(process.cwd(), 'app/admin/warroom/components/RemediationConfirmModal.tsx');

function check(label: string, condition: boolean) {
  if (condition) {
    console.log(`[PASS] ${label}`);
  } else {
    console.error(`[FAIL] ${label}`);
    process.exit(1);
  }
}

console.log("--- PHASE 3C-3C-3A CONTRACT VERIFICATION START ---");

// 1. Files exist
check('remediation-apply-types.ts exists', existsSync(typesPath));

const typesContent = readFileSync(typesPath, 'utf8');
const pageContent = readFileSync(pagePath, 'utf8');
const modalContent = readFileSync(modalPath, 'utf8');

// 2. Type definitions
check('RealLocalDraftApplyRequest type exists', typesContent.includes('export interface RealLocalDraftApplyRequest'));
check('RealLocalDraftApplyResult type exists', typesContent.includes('export interface RealLocalDraftApplyResult'));

// 3. Request Fields
check('Request includes suggestionId', typesContent.includes('suggestionId: string'));
check('Request includes language', typesContent.includes('language: string'));
check('Request requires fieldPath body', typesContent.includes("fieldPath: 'body'"));
check('Request includes suggestedText', typesContent.includes('suggestedText: string'));
check('Request includes operatorAcknowledgement', typesContent.includes('operatorAcknowledgement: {'));
check('Request includes sessionOnly: true', typesContent.includes('sessionOnly: true'));
check('Request includes dryRunOnly: false', typesContent.includes('dryRunOnly: false'));

// 4. Result Fields & Invariants
check('Result includes auditInvalidated: true', typesContent.includes('auditInvalidated: true'));
check('Result includes reAuditRequired: true', typesContent.includes('reAuditRequired: true'));
check('Result includes deployBlocked: true', typesContent.includes('deployBlocked: true'));
check('Result includes noBackendMutation: true', typesContent.includes('noBackendMutation: true'));
check('Result includes vaultUnchanged: true', typesContent.includes('vaultUnchanged: true'));
check('Result includes sessionOnly: true', typesContent.includes('sessionOnly: true'));
check('Result includes dryRunOnly: false', typesContent.includes('dryRunOnly: false'));

// 5. Block Reasons
check('Blocking reason for non-FORMAT_REPAIR exists', typesContent.includes('BLOCKED_NOT_FORMAT_REPAIR'));
check('Blocking reason for non-body field exists', typesContent.includes('BLOCKED_NON_BODY_FIELD'));
check('Blocking reason for missing language exists', typesContent.includes('BLOCKED_MISSING_LANGUAGE'));
check('Blocking reason for missing suggestionId exists', typesContent.includes('BLOCKED_MISSING_SUGGESTION_ID'));
check('Blocking reason for missing suggestedText exists', typesContent.includes('BLOCKED_MISSING_SUGGESTED_TEXT'));
check('Blocking reason for acknowledgement mismatch exists', typesContent.includes('BLOCKED_ACKNOWLEDGEMENT_MISMATCH'));
check('Blocking reason for high-risk category exists', typesContent.includes('BLOCKED_HIGH_RISK_CATEGORY'));
check('Blocking reason for duplicate client nonce exists', typesContent.includes('BLOCKED_DUPLICATE_CLIENT_NONCE'));
check('Blocking reason for target text mismatch exists', typesContent.includes('BLOCKED_TARGET_TEXT_MISMATCH'));
check('Blocking reason for real apply not active exists', typesContent.includes('BLOCKED_REAL_APPLY_NOT_ACTIVE'));

// 6. Guard Helper Tests (Runtime Logic)
const mockRequest: any = {
  suggestionId: 's1',
  language: 'en',
  category: RemediationCategory.FORMAT_REPAIR,
  fieldPath: 'body',
  suggestedText: 'fixed text',
  operatorAcknowledgement: {
    typedPhrase: 'CONFIRM',
    requiredPhrase: 'CONFIRM',
    acknowledgedAt: new Date().toISOString()
  },
  requestedAt: new Date().toISOString(),
  sessionOnly: true,
  dryRunOnly: false
};

check('Guard helper enforces FORMAT_REPAIR', getRealLocalDraftApplyBlockReason({...mockRequest, category: RemediationCategory.SOURCE_REVIEW}) === RealLocalApplyBlockReason.BLOCKED_NOT_FORMAT_REPAIR);
check('Guard helper enforces language', getRealLocalDraftApplyBlockReason({...mockRequest, language: ''}) === RealLocalApplyBlockReason.BLOCKED_MISSING_LANGUAGE);
check('Guard helper enforces suggestionId', getRealLocalDraftApplyBlockReason({...mockRequest, suggestionId: ''}) === RealLocalApplyBlockReason.BLOCKED_MISSING_SUGGESTION_ID);
check('Guard helper enforces suggestedText', getRealLocalDraftApplyBlockReason({...mockRequest, suggestedText: ''}) === RealLocalApplyBlockReason.BLOCKED_MISSING_SUGGESTED_TEXT);
check('Guard helper enforces acknowledgement phrase', getRealLocalDraftApplyBlockReason({...mockRequest, operatorAcknowledgement: {...mockRequest.operatorAcknowledgement, typedPhrase: 'WRONG'}}) === RealLocalApplyBlockReason.BLOCKED_ACKNOWLEDGEMENT_MISMATCH);

// 7. Result Creator Tests
const blockedResult = createBlockedRealLocalApplyResult(RealLocalApplyBlockReason.BLOCKED_REAL_APPLY_NOT_ACTIVE);
check('Blocked result helper hard-codes noBackendMutation true', blockedResult.noBackendMutation === true);
check('Blocked result helper hard-codes vaultUnchanged true', blockedResult.vaultUnchanged === true);

const successResult = createSuccessfulRealLocalApplyResult({ snapshotId: 'snap1', appliedEventId: 'evt1', language: 'en' });
check('Successful result helper hard-codes auditInvalidated true', successResult.auditInvalidated === true);
check('Successful result helper hard-codes reAuditRequired true', successResult.reAuditRequired === true);
check('Successful result helper hard-codes deployBlocked true', successResult.deployBlocked === true);

// 8. No Runtime Wiring Proof
check('No applyToLocalDraftController call added to page', !pageContent.includes('remediationController.applyToLocalDraftController'));
check('No applyToLocalDraftController call added to modal', !modalContent.includes('applyToLocalDraftController'));
check('No rollbackLastLocalDraftChange call added to page', !pageContent.includes('remediationController.rollbackLastLocalDraftChange'));
check('No rollbackLastLocalDraftChange call added to modal', !modalContent.includes('rollbackLastLocalDraftChange'));

// 9. Safety Invariants
check('No localDraftCopy mutation added in page', !pageContent.match(/handleRequestLocalDraftApply[\s\S]*?setLocalDraftCopy/));
check('No fetch/axios calls added', !typesContent.includes('fetch(') && !typesContent.includes('axios.'));
check('No backend API route added', !existsSync(join(process.cwd(), 'app/api/remediation/apply/route.ts')));

// 10. UI Preservation
check('Dry-run button behavior preserved in page', pageContent.includes('handleRequestLocalDraftApply'));
check('Old Apply disabled behavior preserved in modal', modalContent.includes('disabled={true}') && modalContent.includes('Apply to Draft — Disabled in Phase 3B'));

console.log("--- PHASE 3C-3C-3A CONTRACT VERIFICATION COMPLETE ---");
process.exit(0);
