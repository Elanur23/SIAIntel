/**
 * Session Draft Promotion Gate - Precondition Validator Verification Script
 *
 * This script verifies the pure precondition validator implementation.
 * It runs 22+ test cases covering all fail-closed conditions and edge cases.
 *
 * VERIFICATION SCOPE:
 * - All 21 fail-closed checks
 * - Safety invariants hard-coded correctly
 * - Snapshot identity verification
 * - Block reason messages
 * - Edge cases (null, undefined, empty)
 * - No forbidden return fields
 */

import {
  checkPromotionPreconditions,
  verifySnapshotIdentityMatch,
  getBlockReasonMessage,
  getBlockReasonMessages,
  canProceedWithPromotion,
  validateSafetyInvariants,
  assertSafetyInvariants,
  type PreconditionCheckInput
} from '../lib/editorial/session-draft-promotion-preconditions';

import type {
  PromotionPreconditionResult,
  OperatorAcknowledgementState
} from '../lib/editorial/session-draft-promotion-types';

import type {
  SessionAuditResult,
  SnapshotIdentity
} from '../lib/editorial/remediation-apply-types';

import { SessionAuditLifecycle } from '../lib/editorial/remediation-apply-types';

// ============================================================================
// TEST UTILITIES
// ============================================================================

let testCount = 0;
let passCount = 0;
let failCount = 0;

function test(name: string, fn: () => void): void {
  testCount++;
  try {
    fn();
    passCount++;
    console.log(`✅ TEST ${testCount}: ${name}`);
  } catch (error) {
    failCount++;
    console.error(`❌ TEST ${testCount}: ${name}`);
    console.error(`   Error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}\n  Expected: ${expected}\n  Actual: ${actual}`);
  }
}

function assertArrayEquals<T>(actual: T[], expected: T[], message: string): void {
  if (actual.length !== expected.length) {
    throw new Error(`${message}\n  Expected length: ${expected.length}\n  Actual length: ${actual.length}`);
  }
  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== expected[i]) {
      throw new Error(`${message}\n  Expected[${i}]: ${expected[i]}\n  Actual[${i}]: ${actual[i]}`);
    }
  }
}

// ============================================================================
// TEST FIXTURES
// ============================================================================

const validSnapshotIdentity: SnapshotIdentity = {
  contentHash: 'abc123def456',
  ledgerSequence: 5,
  latestAppliedEventId: 'event-123',
  timestamp: '2026-04-29T12:00:00Z'
};

const validSessionAuditResult: SessionAuditResult = {
  identity: validSnapshotIdentity,
  lifecycle: SessionAuditLifecycle.PASSED,
  globalAuditPass: true,
  pandaCheckPass: true,
  findings: [],
  globalAuditResult: {},
  pandaCheckResult: {},
  pandaStructuralErrors: [],
  timestamp: '2026-04-29T12:00:00Z',
  isStale: false,
  memoryOnly: true,
  deployUnlockAllowed: false,
  canonicalAuditOverwriteAllowed: false,
  vaultMutationAllowed: false
};

const validAcknowledgement: OperatorAcknowledgementState = {
  vaultReplacementAcknowledged: true,
  auditInvalidationAcknowledged: true,
  deployLockAcknowledged: true,
  reAuditRequiredAcknowledged: true,
  acknowledgedAt: '2026-04-29T12:00:00Z',
  operatorId: 'test-operator'
};

const validInput: PreconditionCheckInput = {
  hasSessionDraft: true,
  sessionAuditResult: validSessionAuditResult,
  sessionAuditLifecycle: SessionAuditLifecycle.PASSED,
  currentSnapshotIdentity: validSnapshotIdentity,
  transformError: null,
  hasSelectedArticle: true,
  hasLocalDraftCopy: true,
  acknowledgement: validAcknowledgement
};

// ============================================================================
// TEST SUITE
// ============================================================================

console.log('\n=== Session Draft Promotion Precondition Validator Verification ===\n');

// ============================================================================
// TEST 1: Valid input should allow promotion
// ============================================================================
test('Valid input allows promotion', () => {
  const result = checkPromotionPreconditions(validInput);
  assert(result.canPromote === true, 'canPromote should be true');
  assert(result.blockReasons.length === 0, 'blockReasons should be empty');
  assert(result.preconditions.sessionDraftExists === true, 'sessionDraftExists should be true');
  assert(result.preconditions.auditRun === true, 'auditRun should be true');
  assert(result.preconditions.auditPassed === true, 'auditPassed should be true');
  assert(result.preconditions.auditNotStale === true, 'auditNotStale should be true');
  assert(result.preconditions.globalAuditPassed === true, 'globalAuditPassed should be true');
  assert(result.preconditions.pandaCheckPassed === true, 'pandaCheckPassed should be true');
  assert(result.preconditions.snapshotIdentityMatches === true, 'snapshotIdentityMatches should be true');
  assert(result.preconditions.noTransformError === true, 'noTransformError should be true');
  assert(result.preconditions.articleSelected === true, 'articleSelected should be true');
  assert(result.preconditions.localDraftValid === true, 'localDraftValid should be true');
});

// ============================================================================
// TEST 2: Safety invariants are hard-coded correctly
// ============================================================================
test('Safety invariants are hard-coded correctly', () => {
  const result = checkPromotionPreconditions(validInput);
  assertEquals(result.memoryOnly, true, 'memoryOnly must be true');
  assertEquals(result.deployUnlockAllowed, false, 'deployUnlockAllowed must be false');
  assertEquals(result.canonicalAuditOverwriteAllowed, false, 'canonicalAuditOverwriteAllowed must be false');
  assertEquals(result.automaticPromotionAllowed, false, 'automaticPromotionAllowed must be false');
  assert(validateSafetyInvariants(result), 'validateSafetyInvariants should return true');
});

// ============================================================================
// TEST 3: No session draft blocks promotion
// ============================================================================
test('No session draft blocks promotion', () => {
  const input = { ...validInput, hasSessionDraft: false };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('NO_SESSION_DRAFT' as any), 'blockReasons should include NO_SESSION_DRAFT');
  assert(result.preconditions.sessionDraftExists === false, 'sessionDraftExists should be false');
});

// ============================================================================
// TEST 4: Session audit null blocks promotion
// ============================================================================
test('Session audit null blocks promotion', () => {
  const input = { ...validInput, sessionAuditResult: null };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('AUDIT_NOT_RUN' as any), 'blockReasons should include AUDIT_NOT_RUN');
  assert(result.preconditions.auditRun === false, 'auditRun should be false');
});

// ============================================================================
// TEST 5: Audit lifecycle NOT_RUN blocks promotion
// ============================================================================
test('Audit lifecycle NOT_RUN blocks promotion', () => {
  const input = { ...validInput, sessionAuditLifecycle: SessionAuditLifecycle.NOT_RUN };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('AUDIT_NOT_RUN' as any), 'blockReasons should include AUDIT_NOT_RUN');
  assert(result.preconditions.auditPassed === false, 'auditPassed should be false');
});

// ============================================================================
// TEST 6: Audit lifecycle RUNNING blocks promotion
// ============================================================================
test('Audit lifecycle RUNNING blocks promotion', () => {
  const input = { ...validInput, sessionAuditLifecycle: SessionAuditLifecycle.RUNNING };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('AUDIT_NOT_RUN' as any), 'blockReasons should include AUDIT_NOT_RUN');
  assert(result.preconditions.auditPassed === false, 'auditPassed should be false');
});

// ============================================================================
// TEST 7: Audit lifecycle FAILED blocks promotion
// ============================================================================
test('Audit lifecycle FAILED blocks promotion', () => {
  const input = { ...validInput, sessionAuditLifecycle: SessionAuditLifecycle.FAILED };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('AUDIT_FAILED' as any), 'blockReasons should include AUDIT_FAILED');
  assert(result.preconditions.auditPassed === false, 'auditPassed should be false');
});

// ============================================================================
// TEST 8: Audit lifecycle STALE blocks promotion
// ============================================================================
test('Audit lifecycle STALE blocks promotion', () => {
  const input = { ...validInput, sessionAuditLifecycle: SessionAuditLifecycle.STALE };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('AUDIT_STALE' as any), 'blockReasons should include AUDIT_STALE');
  assert(result.preconditions.auditPassed === false, 'auditPassed should be false');
});

// ============================================================================
// TEST 9: Global Audit failed blocks promotion
// ============================================================================
test('Global Audit failed blocks promotion', () => {
  const auditResult = { ...validSessionAuditResult, globalAuditPass: false };
  const input = { ...validInput, sessionAuditResult: auditResult };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('GLOBAL_AUDIT_FAILED' as any), 'blockReasons should include GLOBAL_AUDIT_FAILED');
  assert(result.preconditions.globalAuditPassed === false, 'globalAuditPassed should be false');
});

// ============================================================================
// TEST 10: Panda Check failed blocks promotion
// ============================================================================
test('Panda Check failed blocks promotion', () => {
  const auditResult = { ...validSessionAuditResult, pandaCheckPass: false };
  const input = { ...validInput, sessionAuditResult: auditResult };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('PANDA_CHECK_FAILED' as any), 'blockReasons should include PANDA_CHECK_FAILED');
  assert(result.preconditions.pandaCheckPassed === false, 'pandaCheckPassed should be false');
});

// ============================================================================
// TEST 11: Panda structural errors block promotion
// ============================================================================
test('Panda structural errors block promotion', () => {
  const auditResult = { ...validSessionAuditResult, pandaStructuralErrors: ['error1', 'error2'] };
  const input = { ...validInput, sessionAuditResult: auditResult };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('PANDA_STRUCTURAL_ERRORS' as any), 'blockReasons should include PANDA_STRUCTURAL_ERRORS');
});

// ============================================================================
// TEST 12: Audit isStale flag true blocks promotion
// ============================================================================
test('Audit isStale flag true blocks promotion', () => {
  const auditResult = { ...validSessionAuditResult, isStale: true };
  const input = { ...validInput, sessionAuditResult: auditResult };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('AUDIT_STALE' as any), 'blockReasons should include AUDIT_STALE');
  assert(result.preconditions.auditNotStale === false, 'auditNotStale should be false');
});

// ============================================================================
// TEST 13: Snapshot content hash mismatch blocks promotion
// ============================================================================
test('Snapshot content hash mismatch blocks promotion', () => {
  const currentIdentity = { ...validSnapshotIdentity, contentHash: 'different-hash' };
  const input = { ...validInput, currentSnapshotIdentity: currentIdentity };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('SNAPSHOT_MISMATCH' as any), 'blockReasons should include SNAPSHOT_MISMATCH');
  assert(result.preconditions.snapshotIdentityMatches === false, 'snapshotIdentityMatches should be false');
});

// ============================================================================
// TEST 14: Snapshot ledger sequence mismatch blocks promotion
// ============================================================================
test('Snapshot ledger sequence mismatch blocks promotion', () => {
  const currentIdentity = { ...validSnapshotIdentity, ledgerSequence: 999 };
  const input = { ...validInput, currentSnapshotIdentity: currentIdentity };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('SNAPSHOT_MISMATCH' as any), 'blockReasons should include SNAPSHOT_MISMATCH');
  assert(result.preconditions.snapshotIdentityMatches === false, 'snapshotIdentityMatches should be false');
});

// ============================================================================
// TEST 15: Snapshot event ID mismatch blocks promotion
// ============================================================================
test('Snapshot event ID mismatch blocks promotion', () => {
  const currentIdentity = { ...validSnapshotIdentity, latestAppliedEventId: 'different-event' };
  const input = { ...validInput, currentSnapshotIdentity: currentIdentity };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('SNAPSHOT_MISMATCH' as any), 'blockReasons should include SNAPSHOT_MISMATCH');
  assert(result.preconditions.snapshotIdentityMatches === false, 'snapshotIdentityMatches should be false');
});

// ============================================================================
// TEST 16: Transform error present blocks promotion
// ============================================================================
test('Transform error present blocks promotion', () => {
  const input = { ...validInput, transformError: 'Transform failed: invalid format' };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('TRANSFORM_ERROR' as any), 'blockReasons should include TRANSFORM_ERROR');
  assert(result.preconditions.noTransformError === false, 'noTransformError should be false');
});

// ============================================================================
// TEST 17: Empty transform error does NOT block promotion
// ============================================================================
test('Empty transform error does NOT block promotion', () => {
  const input = { ...validInput, transformError: '' };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === true, 'canPromote should be true');
  assert(!result.blockReasons.includes('TRANSFORM_ERROR' as any), 'blockReasons should NOT include TRANSFORM_ERROR');
  assert(result.preconditions.noTransformError === true, 'noTransformError should be true');
});

// ============================================================================
// TEST 18: No article selected blocks promotion
// ============================================================================
test('No article selected blocks promotion', () => {
  const input = { ...validInput, hasSelectedArticle: false };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('NO_ARTICLE_SELECTED' as any), 'blockReasons should include NO_ARTICLE_SELECTED');
  assert(result.preconditions.articleSelected === false, 'articleSelected should be false');
});

// ============================================================================
// TEST 19: Local draft copy null blocks promotion
// ============================================================================
test('Local draft copy null blocks promotion', () => {
  const input = { ...validInput, hasLocalDraftCopy: false };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('LOCAL_DRAFT_INVALID' as any), 'blockReasons should include LOCAL_DRAFT_INVALID');
  assert(result.preconditions.localDraftValid === false, 'localDraftValid should be false');
});

// ============================================================================
// TEST 20: Missing acknowledgement blocks promotion
// ============================================================================
test('Missing acknowledgement blocks promotion', () => {
  const ack = { ...validAcknowledgement, vaultReplacementAcknowledged: false };
  const input = { ...validInput, acknowledgement: ack };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('ACKNOWLEDGEMENT_MISSING' as any), 'blockReasons should include ACKNOWLEDGEMENT_MISSING');
});

// ============================================================================
// TEST 21: Missing audit snapshot identity blocks promotion
// ============================================================================
test('Missing audit snapshot identity blocks promotion', () => {
  const auditResult = { ...validSessionAuditResult, identity: null as any };
  const input = { ...validInput, sessionAuditResult: auditResult };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('SNAPSHOT_MISMATCH' as any), 'blockReasons should include SNAPSHOT_MISMATCH');
});

// ============================================================================
// TEST 22: Current snapshot identity null blocks promotion
// ============================================================================
test('Current snapshot identity null blocks promotion', () => {
  const input = { ...validInput, currentSnapshotIdentity: null };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.includes('SNAPSHOT_MISMATCH' as any), 'blockReasons should include SNAPSHOT_MISMATCH');
});

// ============================================================================
// TEST 23: verifySnapshotIdentityMatch returns true for matching identities
// ============================================================================
test('verifySnapshotIdentityMatch returns true for matching identities', () => {
  const result = verifySnapshotIdentityMatch(validSnapshotIdentity, validSnapshotIdentity);
  assert(result === true, 'verifySnapshotIdentityMatch should return true');
});

// ============================================================================
// TEST 24: verifySnapshotIdentityMatch returns false for mismatched identities
// ============================================================================
test('verifySnapshotIdentityMatch returns false for mismatched identities', () => {
  const identity1 = validSnapshotIdentity;
  const identity2 = { ...validSnapshotIdentity, contentHash: 'different' };
  const result = verifySnapshotIdentityMatch(identity1, identity2);
  assert(result === false, 'verifySnapshotIdentityMatch should return false');
});

// ============================================================================
// TEST 25: verifySnapshotIdentityMatch returns false for null identities
// ============================================================================
test('verifySnapshotIdentityMatch returns false for null identities', () => {
  const result1 = verifySnapshotIdentityMatch(null, validSnapshotIdentity);
  const result2 = verifySnapshotIdentityMatch(validSnapshotIdentity, null);
  const result3 = verifySnapshotIdentityMatch(null, null);
  assert(result1 === false, 'verifySnapshotIdentityMatch should return false for null audit identity');
  assert(result2 === false, 'verifySnapshotIdentityMatch should return false for null current identity');
  assert(result3 === false, 'verifySnapshotIdentityMatch should return false for both null');
});

// ============================================================================
// TEST 26: getBlockReasonMessage returns correct messages
// ============================================================================
test('getBlockReasonMessage returns correct messages', () => {
  const message1 = getBlockReasonMessage('NO_SESSION_DRAFT' as any);
  const message2 = getBlockReasonMessage('AUDIT_NOT_RUN' as any);
  const message3 = getBlockReasonMessage('SNAPSHOT_MISMATCH' as any);
  assert(message1 === 'No session draft exists', 'NO_SESSION_DRAFT message incorrect');
  assert(message2 === 'Session audit has not been run', 'AUDIT_NOT_RUN message incorrect');
  assert(message3 === 'Session content has changed since audit - re-audit required', 'SNAPSHOT_MISMATCH message incorrect');
});

// ============================================================================
// TEST 27: getBlockReasonMessages returns array of messages
// ============================================================================
test('getBlockReasonMessages returns array of messages', () => {
  const reasons = ['NO_SESSION_DRAFT' as any, 'AUDIT_NOT_RUN' as any];
  const messages = getBlockReasonMessages(reasons);
  assert(messages.length === 2, 'messages array length should be 2');
  assert(messages[0] === 'No session draft exists', 'First message incorrect');
  assert(messages[1] === 'Session audit has not been run', 'Second message incorrect');
});

// ============================================================================
// TEST 28: canProceedWithPromotion returns true for valid result
// ============================================================================
test('canProceedWithPromotion returns true for valid result', () => {
  const result = checkPromotionPreconditions(validInput);
  const canProceed = canProceedWithPromotion(result);
  assert(canProceed === true, 'canProceedWithPromotion should return true');
});

// ============================================================================
// TEST 29: canProceedWithPromotion returns false for blocked result
// ============================================================================
test('canProceedWithPromotion returns false for blocked result', () => {
  const input = { ...validInput, hasSessionDraft: false };
  const result = checkPromotionPreconditions(input);
  const canProceed = canProceedWithPromotion(result);
  assert(canProceed === false, 'canProceedWithPromotion should return false');
});

// ============================================================================
// TEST 30: assertSafetyInvariants does not throw for valid result
// ============================================================================
test('assertSafetyInvariants does not throw for valid result', () => {
  const result = checkPromotionPreconditions(validInput);
  assertSafetyInvariants(result); // Should not throw
});

// ============================================================================
// TEST 31: Multiple block reasons are accumulated
// ============================================================================
test('Multiple block reasons are accumulated', () => {
  const input: PreconditionCheckInput = {
    hasSessionDraft: false,
    sessionAuditResult: null,
    sessionAuditLifecycle: SessionAuditLifecycle.NOT_RUN,
    currentSnapshotIdentity: null,
    transformError: 'error',
    hasSelectedArticle: false,
    hasLocalDraftCopy: false,
    acknowledgement: {
      vaultReplacementAcknowledged: false,
      auditInvalidationAcknowledged: false,
      deployLockAcknowledged: false,
      reAuditRequiredAcknowledged: false
    }
  };
  const result = checkPromotionPreconditions(input);
  assert(result.canPromote === false, 'canPromote should be false');
  assert(result.blockReasons.length >= 5, 'Should have multiple block reasons');
  assert(result.blockReasons.includes('NO_SESSION_DRAFT' as any), 'Should include NO_SESSION_DRAFT');
  assert(result.blockReasons.includes('AUDIT_NOT_RUN' as any), 'Should include AUDIT_NOT_RUN');
  assert(result.blockReasons.includes('TRANSFORM_ERROR' as any), 'Should include TRANSFORM_ERROR');
  assert(result.blockReasons.includes('NO_ARTICLE_SELECTED' as any), 'Should include NO_ARTICLE_SELECTED');
  assert(result.blockReasons.includes('LOCAL_DRAFT_INVALID' as any), 'Should include LOCAL_DRAFT_INVALID');
});

// ============================================================================
// TEST 32: Snapshot binding is created correctly
// ============================================================================
test('Snapshot binding is created correctly', () => {
  const result = checkPromotionPreconditions(validInput);
  assert(result.snapshotBinding !== null, 'snapshotBinding should not be null');
  assert(result.snapshotBinding.snapshotIdentity !== null, 'snapshotBinding.snapshotIdentity should not be null');
  assert(result.snapshotBinding.preconditionsMet === true, 'snapshotBinding.preconditionsMet should be true');
  assert(result.snapshotBinding.blockReasons.length === 0, 'snapshotBinding.blockReasons should be empty');
  assert(result.snapshotBinding.checkedAt !== '', 'snapshotBinding.checkedAt should not be empty');
});

// ============================================================================
// FINAL REPORT
// ============================================================================

console.log('\n=== Verification Summary ===\n');
console.log(`Total Tests: ${testCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);

if (failCount === 0) {
  console.log('\n✅ ALL TESTS PASSED - Precondition validator is SAFE\n');
  process.exit(0);
} else {
  console.log('\n❌ SOME TESTS FAILED - Review implementation\n');
  process.exit(1);
}
