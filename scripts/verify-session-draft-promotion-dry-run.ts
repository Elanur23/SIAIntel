#!/usr/bin/env tsx

/**
 * TASK 6B-1 VERIFICATION SCRIPT
 *
 * Verifies the local promotion dry-run execution handler:
 * - Handler file exists and exports executeLocalPromotionDryRun
 * - Defensive input checks (missing/blocked preconditions, snapshot mismatches, etc.)
 * - Success preview includes all required safety invariants
 * - Zero mutation (no setVault, fetch, database, etc.)
 * - JSON serializability
 */

import * as fs from 'fs';
import * as path from 'path';
import { executeLocalPromotionDryRun } from '../app/admin/warroom/handlers/promotion-execution-handler';
import { SessionAuditLifecycle } from '../lib/editorial/remediation-apply-types';
import { PromotionBlockReason } from '../lib/editorial/session-draft-promotion-types';

const WORKSPACE_ROOT = process.cwd();

interface VerificationResult {
  checkNumber: number;
  description: string;
  passed: boolean;
  details?: string;
}

const results: VerificationResult[] = [];

function addResult(checkNumber: number, description: string, passed: boolean, details?: string) {
  results.push({ checkNumber, description, passed, details });
  const status = passed ? '✓ PASS' : '✗ FAIL';
  const detailsStr = details ? ` - ${details}` : '';
  console.log(`${status} - Check ${checkNumber}: ${description}${detailsStr}`);
}

function readFileContent(relativePath: string): string {
  const fullPath = path.join(WORKSPACE_ROOT, relativePath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`File not found: ${relativePath}`);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

console.log('='.repeat(80));
console.log('   TASK 6B-1: LOCAL PROMOTION DRY-RUN VERIFICATION');
console.log('='.repeat(80));
console.log('');

try {
  // 1. Handler file exists
  const handlerPath = 'app/admin/warroom/handlers/promotion-execution-handler.ts';
  const handlerExists = fs.existsSync(path.join(WORKSPACE_ROOT, handlerPath));
  addResult(1, 'Handler file exists', handlerExists, handlerPath);

  // 2. executeLocalPromotionDryRun is exported
  const handlerContent = readFileContent(handlerPath);
  const hasExport = handlerContent.includes('export function executeLocalPromotionDryRun');
  addResult(2, 'executeLocalPromotionDryRun is exported', hasExport);

  // Mock data for tests
  const validAck = {
    vaultReplacementAcknowledged: true,
    auditInvalidationAcknowledged: true,
    deployLockAcknowledged: true,
    reAuditRequiredAcknowledged: true,
    operatorId: 'op-123'
  };

  const validIdentity = {
    contentHash: 'hash-123',
    ledgerSequence: 1,
    latestAppliedEventId: 'event-1',
    timestamp: new Date().toISOString()
  };

  const validPrecondition: any = {
    canPromote: true,
    blockReasons: [],
    preconditions: {
      sessionDraftExists: true,
      auditRun: true,
      auditPassed: true,
      auditNotStale: true,
      globalAuditPassed: true,
      pandaCheckPassed: true,
      snapshotIdentityMatches: true,
      noTransformError: true,
      articleSelected: true,
      localDraftValid: true
    },
    snapshotBinding: {
      snapshotIdentity: validIdentity,
      checkedAt: new Date().toISOString(),
      preconditionsMet: true,
      blockReasons: []
    },
    acknowledgement: validAck,
    memoryOnly: true,
    deployUnlockAllowed: false,
    canonicalAuditOverwriteAllowed: false,
    automaticPromotionAllowed: false
  };

  const validLocalDraft = {
    draftId: 'draft-123',
    contentChecksum: 'hash-123',
    title: 'Test Title',
    body: 'Test Body'
  };

  const validVaultBefore = {
    vaultId: 'vault-123',
    title: 'Old Title',
    bodyChecksum: 'old-hash',
    checksum: 'old-hash',
    version: '1.0.0',
    lastUpdatedAt: new Date().toISOString()
  };

  const validAuditResult: any = {
    identity: validIdentity,
    lifecycle: SessionAuditLifecycle.PASSED,
    globalAuditPass: true,
    pandaCheckPass: true,
    isStale: false
  };

  // 3. missing precondition blocks
  const res3 = executeLocalPromotionDryRun({
    precondition: null,
    snapshotBinding: validPrecondition.snapshotBinding,
    localDraftCopy: validLocalDraft,
    canonicalVaultBefore: validVaultBefore,
    operatorContext: { acknowledgementState: validAck }
  });
  addResult(3, 'Missing precondition blocks', !res3.success);

  // 4. blocked precondition blocks
  const blockedPre: any = { ...validPrecondition, canPromote: false, blockReasons: ['AUDIT_FAILED'] };
  const res4 = executeLocalPromotionDryRun({
    precondition: blockedPre,
    snapshotBinding: validPrecondition.snapshotBinding,
    localDraftCopy: validLocalDraft,
    canonicalVaultBefore: validVaultBefore,
    operatorContext: { acknowledgementState: validAck }
  });
  addResult(4, 'Blocked precondition blocks', !res4.success);

  // 5. missing snapshot blocks
  const res5 = executeLocalPromotionDryRun({
    precondition: validPrecondition,
    snapshotBinding: null,
    localDraftCopy: validLocalDraft,
    canonicalVaultBefore: validVaultBefore,
    operatorContext: { acknowledgementState: validAck }
  });
  addResult(5, 'Missing snapshot blocks', !res5.success);

  // 6. snapshot checksum mismatch blocks
  const mismatchDraft = { ...validLocalDraft, contentChecksum: 'wrong-hash' };
  const res6 = executeLocalPromotionDryRun({
    precondition: validPrecondition,
    snapshotBinding: validPrecondition.snapshotBinding,
    localDraftCopy: mismatchDraft,
    canonicalVaultBefore: validVaultBefore,
    operatorContext: { acknowledgementState: validAck },
    sessionAuditResult: validAuditResult
  });
  addResult(6, 'Snapshot checksum mismatch blocks', !res6.success);

  // 7. missing localDraftCopy blocks
  const res7 = executeLocalPromotionDryRun({
    precondition: validPrecondition,
    snapshotBinding: validPrecondition.snapshotBinding,
    localDraftCopy: null,
    canonicalVaultBefore: validVaultBefore,
    operatorContext: { acknowledgementState: validAck }
  });
  addResult(7, 'Missing localDraftCopy blocks', !res7.success);

  // 8. missing canonicalVaultBefore blocks
  const res8 = executeLocalPromotionDryRun({
    precondition: validPrecondition,
    snapshotBinding: validPrecondition.snapshotBinding,
    localDraftCopy: validLocalDraft,
    canonicalVaultBefore: null,
    operatorContext: { acknowledgementState: validAck }
  });
  addResult(8, 'Missing canonicalVaultBefore blocks', !res8.success);

  // 9. invalid payload instruction blocks
  const res9 = executeLocalPromotionDryRun({
    precondition: validPrecondition,
    snapshotBinding: validPrecondition.snapshotBinding,
    localDraftCopy: validLocalDraft,
    canonicalVaultBefore: validVaultBefore,
    operatorContext: { acknowledgementState: validAck },
    payloadRef: { instruction: 'INVALID' },
    sessionAuditResult: validAuditResult
  });
  addResult(9, 'Invalid payload instruction blocks', !res9.success);

  // 10. valid input returns dry-run success
  const res10 = executeLocalPromotionDryRun({
    precondition: validPrecondition,
    snapshotBinding: validPrecondition.snapshotBinding,
    localDraftCopy: validLocalDraft,
    canonicalVaultBefore: validVaultBefore,
    operatorContext: { acknowledgementState: validAck },
    sessionAuditResult: validAuditResult
  });
  addResult(10, 'Valid input returns dry-run success', res10.success);

  if (res10.success) {
    const preview = res10.preview;
    // 11. success preview has executionPerformed false
    addResult(11, 'Preview has executionPerformed false', preview.executionPerformed === false);
    // 12. success preview has mutationPerformed false
    addResult(12, 'Preview has mutationPerformed false', preview.mutationPerformed === false);
    // 13. success preview has deployMustRemainLocked true
    addResult(13, 'Preview has deployMustRemainLocked true', preview.deployMustRemainLocked === true);
    // 14. success preview has canonicalReAuditRequired true
    addResult(14, 'Preview has canonicalReAuditRequired true', preview.canonicalReAuditRequired === true);
    // 15. success preview has requiredAuditInvalidation true
    addResult(15, 'Preview has requiredAuditInvalidation true', preview.requiredAuditInvalidation === true);
    // 16. success preview has backendPersistenceAllowed false
    addResult(16, 'Preview has backendPersistenceAllowed false', preview.backendPersistenceAllowed === false);
    // 17. success preview has sessionAuditInheritanceAllowed false
    addResult(17, 'Preview has sessionAuditInheritanceAllowed false', preview.sessionAuditInheritanceAllowed === false);
    // 18. success preview has localVaultMutationDeferred true
    addResult(18, 'Preview has localVaultMutationDeferred true', preview.localVaultMutationDeferred === true);
    // 19. success preview has actualApplyRequiresTask6B2 true
    addResult(19, 'Preview has actualApplyRequiresTask6B2 true', preview.actualApplyRequiresTask6B2 === true);

    // 20. result is JSON serializable
    const serialized = JSON.stringify(res10);
    addResult(20, 'Result is JSON serializable', typeof serialized === 'string');

    // 21. result contains no functions
    const parsed = JSON.parse(serialized);
    const hasFunctions = (obj: any): boolean => {
      for (const key in obj) {
        if (typeof obj[key] === 'function') return true;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (hasFunctions(obj[key])) return true;
        }
      }
      return false;
    };
    addResult(21, 'Result contains no functions', !hasFunctions(parsed));
  }

  // 22. handler does not mutate input
  const input22 = {
    precondition: { ...validPrecondition },
    snapshotBinding: { ...validPrecondition.snapshotBinding },
    localDraftCopy: { ...validLocalDraft },
    canonicalVaultBefore: { ...validVaultBefore },
    operatorContext: { acknowledgementState: { ...validAck } },
    sessionAuditResult: { ...validAuditResult }
  };
  const inputStrBefore = JSON.stringify(input22);
  executeLocalPromotionDryRun(input22);
  const inputStrAfter = JSON.stringify(input22);
  addResult(22, 'Handler does not mutate input', inputStrBefore === inputStrAfter);

  // 23. handler file has no setVault / clearLocalDraft / setGlobalAudit / setTransformedArticle calls
  const mutations = ['setVault(', 'clearLocalDraft(', 'setGlobalAudit(', 'setTransformedArticle(', 'clearLocalDraftCopy(', 'setLocalDraftCopy('];
  const hasMutations = mutations.some(term => handlerContent.includes(term));
  addResult(23, 'Handler file has no forbidden mutations', !hasMutations);

  // 24. handler file has no fetch/axios/API/provider/database imports
  const forbiddenImports = ['fetch(', 'axios', 'prisma', 'db', 'gemini', 'groq', 'openai', 'anthropic'];
  const hasForbiddenImports = forbiddenImports.some(term => handlerContent.includes(term));
  addResult(24, 'Handler file has no forbidden imports', !hasForbiddenImports);

  // 25. no localStorage/sessionStorage usage
  const hasStorage = handlerContent.includes('localStorage') || handlerContent.includes('sessionStorage');
  addResult(25, 'No localStorage/sessionStorage usage', !hasStorage);

  // 26. no deploy unlock wording or logic
  const hasUnlockWording = handlerContent.includes('deployUnlocked: true') || handlerContent.includes('Unlock Deploy');
  addResult(26, 'No deploy unlock wording or logic', !hasUnlockWording);

  // 27. no backend route files changed
  const hasBackendRef = handlerContent.includes('/api/') || handlerContent.includes('app/api');
  addResult(27, 'No backend references in handler', !hasBackendRef);

  // Final Verdict
  console.log('');
  const failed = results.filter(r => !r.passed).length;
  if (failed === 0) {
    console.log('VERDICT: TASK_6B1_VERIFICATION_PASS');
  } else {
    console.log('VERDICT: TASK_6B1_VERIFICATION_FAIL');
  }

} catch (error) {
  console.error('VERIFICATION SCRIPT CRASHED:', error);
  process.exit(1);
}
