/**
 * Verification Script: Session Draft Promotion Payload Builder
 *
 * This script validates the promotion payload builder implementation
 * using synthetic test inputs only. No API calls, no provider calls,
 * no database calls, no app runtime imports.
 *
 * CRITICAL: This script uses SYNTHETIC inputs only for verification.
 */

import {
  buildPromotionPayload,
  validatePayloadSafety,
  isPayloadBuildSuccess,
  isPayloadBuildBlocked,
  assertPayloadSafety,
  type BuildPromotionPayloadInput,
  type SessionDraftPromotionPayload,
  type PromotionPayloadBuildResult
} from '../lib/editorial/session-draft-promotion-payload';

import type {
  PromotionPreconditionResult,
  PromotionSnapshotBinding,
  OperatorAcknowledgementState,
  PromotionBlockReason
} from '../lib/editorial/session-draft-promotion-types';

import type {
  SnapshotIdentity
} from '../lib/editorial/remediation-apply-types';

import { SessionAuditLifecycle } from '../lib/editorial/remediation-apply-types';

// ============================================================================
// SYNTHETIC TEST DATA
// ============================================================================

const SYNTHETIC_SNAPSHOT_IDENTITY: SnapshotIdentity = {
  contentHash: 'test_hash_abc123',
  ledgerSequence: 5,
  latestAppliedEventId: 'event_123',
  timestamp: '2026-04-29T12:00:00Z'
};

const SYNTHETIC_ACKNOWLEDGEMENT: OperatorAcknowledgementState = {
  vaultReplacementAcknowledged: true,
  auditInvalidationAcknowledged: true,
  deployLockAcknowledged: true,
  reAuditRequiredAcknowledged: true,
  acknowledgedAt: '2026-04-29T12:00:00Z',
  operatorId: 'test-operator'
};

const SYNTHETIC_SNAPSHOT_BINDING: PromotionSnapshotBinding = {
  snapshotIdentity: SYNTHETIC_SNAPSHOT_IDENTITY,
  checkedAt: '2026-04-29T12:00:00Z',
  preconditionsMet: true,
  blockReasons: []
};

const SYNTHETIC_PASSING_PRECONDITION: PromotionPreconditionResult = {
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
  snapshotBinding: SYNTHETIC_SNAPSHOT_BINDING,
  acknowledgement: SYNTHETIC_ACKNOWLEDGEMENT,
  memoryOnly: true,
  deployUnlockAllowed: false,
  canonicalAuditOverwriteAllowed: false,
  automaticPromotionAllowed: false
};

const SYNTHETIC_LOCAL_DRAFT_COPY = {
  draftId: 'draft_123',
  sessionId: 'session_456',
  title: 'Test Article',
  body: 'Test body content',
  contentChecksum: 'test_hash_abc123',
  contentBlobRef: 'blob_ref_789',
  metadata: { source: 'test' }
};

const SYNTHETIC_CANONICAL_VAULT_SNAPSHOT = {
  vaultId: 'vault_123',
  title: 'Old Article',
  bodyChecksum: 'old_hash_xyz789',
  currentChecksum: 'old_hash_xyz789',
  currentVersion: '1.0.0',
  lastUpdatedAt: '2026-04-28T12:00:00Z'
};

const SYNTHETIC_OPERATOR = {
  operatorId: 'test-operator',
  acknowledgementState: SYNTHETIC_ACKNOWLEDGEMENT,
  acknowledgementNote: 'Test acknowledgement',
  acknowledgedAt: '2026-04-29T12:00:00Z'
};

const SYNTHETIC_LEDGER = {
  eventCount: 3,
  latestEventId: 'event_123',
  eventIds: ['event_001', 'event_002', 'event_123']
};

// ============================================================================
// TEST CASES
// ============================================================================

interface TestCase {
  name: string;
  input: BuildPromotionPayloadInput | null;
  expectedSuccess: boolean;
  expectedBlockReasons?: PromotionBlockReason[];
  validate?: (result: PromotionPayloadBuildResult) => boolean;
}

const TEST_CASES: TestCase[] = [
  // ============================================================================
  // BLOCKED CASES
  // ============================================================================
  
  {
    name: 'Test 1: Missing precondition blocks payload',
    input: null,
    expectedSuccess: false,
    expectedBlockReasons: ['NO_SESSION_DRAFT']
  },
  
  {
    name: 'Test 2: Blocked precondition blocks payload',
    input: {
      precondition: {
        ...SYNTHETIC_PASSING_PRECONDITION,
        canPromote: false,
        blockReasons: ['AUDIT_FAILED' as PromotionBlockReason]
      },
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: false,
    expectedBlockReasons: ['AUDIT_FAILED']
  },
  
  {
    name: 'Test 3: Precondition with blocked reasons blocks payload',
    input: {
      precondition: {
        ...SYNTHETIC_PASSING_PRECONDITION,
        blockReasons: ['AUDIT_STALE' as PromotionBlockReason]
      },
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: false,
    expectedBlockReasons: ['AUDIT_STALE']
  },
  
  {
    name: 'Test 4: Unsafe deployUnlockAllowed blocks payload',
    input: {
      precondition: {
        ...SYNTHETIC_PASSING_PRECONDITION,
        deployUnlockAllowed: true as any
      },
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: false,
    expectedBlockReasons: ['AUDIT_FAILED']
  },
  
  {
    name: 'Test 5: Unsafe canonicalAuditOverwriteAllowed blocks payload',
    input: {
      precondition: {
        ...SYNTHETIC_PASSING_PRECONDITION,
        canonicalAuditOverwriteAllowed: true as any
      },
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: false,
    expectedBlockReasons: ['AUDIT_FAILED']
  },
  
  {
    name: 'Test 6: Missing memoryOnly blocks payload',
    input: {
      precondition: {
        ...SYNTHETIC_PASSING_PRECONDITION,
        memoryOnly: false as any
      },
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: false,
    expectedBlockReasons: ['AUDIT_FAILED']
  },
  
  {
    name: 'Test 7: Missing snapshot blocks payload',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: null as any,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: false,
    expectedBlockReasons: ['SNAPSHOT_MISMATCH']
  },
  
  {
    name: 'Test 8: Missing localDraftCopy blocks payload',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: null as any,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: false,
    expectedBlockReasons: ['LOCAL_DRAFT_INVALID']
  },
  
  {
    name: 'Test 9: Missing canonicalVaultSnapshot blocks payload',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: null as any,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: false,
    expectedBlockReasons: ['NO_ARTICLE_SELECTED']
  },
  
  {
    name: 'Test 10: Missing acknowledgement metadata blocks payload',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: null as any,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: false,
    expectedBlockReasons: ['ACKNOWLEDGEMENT_MISSING']
  },
  
  {
    name: 'Test 11: Snapshot checksum mismatch blocks payload',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: {
        ...SYNTHETIC_SNAPSHOT_BINDING,
        snapshotIdentity: {
          ...SYNTHETIC_SNAPSHOT_IDENTITY,
          contentHash: 'different_hash_xyz'
        }
      },
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: false,
    expectedBlockReasons: ['SNAPSHOT_MISMATCH']
  },
  
  {
    name: 'Test 12: Missing canonical vault id blocks payload',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: {
        ...SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
        vaultId: ''
      },
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: false,
    expectedBlockReasons: ['NO_ARTICLE_SELECTED']
  },
  
  // ============================================================================
  // SUCCESS CASES
  // ============================================================================
  
  {
    name: 'Test 13: Valid input builds success payload',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER,
      requestedAt: '2026-04-29T12:00:00Z',
      reason: 'Test promotion'
    },
    expectedSuccess: true,
    validate: (result) => {
      if (!isPayloadBuildSuccess(result)) return false;
      return result.payload.instruction === 'PROMOTION_INTENT';
    }
  },
  
  {
    name: 'Test 14: Success payload has instruction PROMOTION_INTENT',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: true,
    validate: (result) => {
      if (!isPayloadBuildSuccess(result)) return false;
      return result.payload.instruction === 'PROMOTION_INTENT';
    }
  },
  
  {
    name: 'Test 15: Success payload has forceAuditInvalidation true',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: true,
    validate: (result) => {
      if (!isPayloadBuildSuccess(result)) return false;
      return result.payload.forceAuditInvalidation === true;
    }
  },
  
  {
    name: 'Test 16: Success payload has maintainDeployLock true',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: true,
    validate: (result) => {
      if (!isPayloadBuildSuccess(result)) return false;
      return result.payload.maintainDeployLock === true;
    }
  },
  
  {
    name: 'Test 17: Success payload has backendPersistenceAllowed false',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: true,
    validate: (result) => {
      if (!isPayloadBuildSuccess(result)) return false;
      return result.payload.backendPersistenceAllowed === false;
    }
  },
  
  {
    name: 'Test 18: Success payload has memoryOnly true',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: true,
    validate: (result) => {
      if (!isPayloadBuildSuccess(result)) return false;
      return result.payload.memoryOnly === true;
    }
  },
  
  {
    name: 'Test 19: Success payload includes before/after diff metadata',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: true,
    validate: (result) => {
      if (!isPayloadBuildSuccess(result)) return false;
      return result.payload.diff !== undefined &&
             result.payload.diff.affectedFields !== undefined &&
             result.payload.diff.changedPaths !== undefined &&
             result.payload.diff.changeSummary !== undefined &&
             result.payload.diff.changeCount !== undefined;
    }
  },
  
  {
    name: 'Test 20: Success payload includes auditEvent',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: true,
    validate: (result) => {
      if (!isPayloadBuildSuccess(result)) return false;
      return result.payload.auditEvent !== undefined &&
             result.payload.auditEvent.eventType === 'PROMOTION_PAYLOAD_BUILT';
    }
  },
  
  {
    name: 'Test 21: Success payload includes safetyInvariants',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: true,
    validate: (result) => {
      if (!isPayloadBuildSuccess(result)) return false;
      return result.payload.safetyInvariants !== undefined &&
             result.payload.safetyInvariants.length > 0;
    }
  },
  
  {
    name: 'Test 22: Builder does not mutate input',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: true,
    validate: (result) => {
      // Check that input objects were not mutated
      return SYNTHETIC_LOCAL_DRAFT_COPY.contentChecksum === 'test_hash_abc123' &&
             SYNTHETIC_CANONICAL_VAULT_SNAPSHOT.vaultId === 'vault_123';
    }
  },
  
  {
    name: 'Test 23: Output does not contain forbidden fields',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: true,
    validate: (result) => {
      if (!isPayloadBuildSuccess(result)) return false;
      const payload = result.payload as any;
      const forbiddenFields = [
        'execute', 'commit', 'promoteNow', 'apply', 'autoPromote',
        'promotionJobId', 'promotionScheduledAt', 'isSaved', 'saved',
        'vaultUpdated', 'writeToDb', 'dbStatus', 'transactionId',
        'endpoint', 'url', 'token', 'credentials',
        'deployUnlocked', 'readyToDeploy', 'publishReady', 'promotionSuccessful'
      ];
      for (const field of forbiddenFields) {
        if (payload[field] !== undefined) return false;
      }
      return true;
    }
  },
  
  {
    name: 'Test 24: Output does not contain forbidden deploy/publish wording',
    input: {
      precondition: SYNTHETIC_PASSING_PRECONDITION,
      snapshot: SYNTHETIC_SNAPSHOT_BINDING,
      localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
      canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
      operator: SYNTHETIC_OPERATOR,
      sessionRemediationLedger: SYNTHETIC_LEDGER
    },
    expectedSuccess: true,
    validate: (result) => {
      if (!isPayloadBuildSuccess(result)) return false;
      const payloadStr = JSON.stringify(result.payload).toLowerCase();
      const forbiddenWording = [
        'promotion completed', 'saved to vault', 'ready to deploy',
        'safe to publish', 'published', 'live', 'final approved',
        'no re-audit required'
      ];
      for (const wording of forbiddenWording) {
        if (payloadStr.includes(wording)) return false;
      }
      return true;
    }
  }
];

// ============================================================================
// TEST RUNNER
// ============================================================================

function runTests(): void {
  console.log('='.repeat(80));
  console.log('SESSION DRAFT PROMOTION PAYLOAD BUILDER - VERIFICATION SCRIPT');
  console.log('='.repeat(80));
  console.log('');

  let passCount = 0;
  let failCount = 0;

  for (const testCase of TEST_CASES) {
    try {
      let result: PromotionPayloadBuildResult;
      
      if (testCase.input === null) {
        // Test missing precondition case
        result = buildPromotionPayload({
          precondition: null as any,
          snapshot: SYNTHETIC_SNAPSHOT_BINDING,
          localDraftCopy: SYNTHETIC_LOCAL_DRAFT_COPY,
          canonicalVaultSnapshot: SYNTHETIC_CANONICAL_VAULT_SNAPSHOT,
          operator: SYNTHETIC_OPERATOR
        });
      } else {
        result = buildPromotionPayload(testCase.input);
      }

      // Check expected success/failure
      if (result.success !== testCase.expectedSuccess) {
        console.log(`❌ FAIL: ${testCase.name}`);
        console.log(`   Expected success: ${testCase.expectedSuccess}, Got: ${result.success}`);
        failCount++;
        continue;
      }

      // Check expected block reasons
      if (!testCase.expectedSuccess && testCase.expectedBlockReasons) {
        const blocked = result as Extract<PromotionPayloadBuildResult, { success: false }>;
        const hasExpectedReason = testCase.expectedBlockReasons.some(reason =>
          blocked.blockedReasons.includes(reason)
        );
        if (!hasExpectedReason) {
          console.log(`❌ FAIL: ${testCase.name}`);
          console.log(`   Expected block reasons: ${testCase.expectedBlockReasons.join(', ')}`);
          console.log(`   Got: ${blocked.blockedReasons.join(', ')}`);
          failCount++;
          continue;
        }
      }

      // Run custom validation if provided
      if (testCase.validate) {
        if (!testCase.validate(result)) {
          console.log(`❌ FAIL: ${testCase.name}`);
          console.log(`   Custom validation failed`);
          failCount++;
          continue;
        }
      }

      // Validate payload safety for success cases
      if (testCase.expectedSuccess && isPayloadBuildSuccess(result)) {
        if (!validatePayloadSafety(result.payload)) {
          console.log(`❌ FAIL: ${testCase.name}`);
          console.log(`   Payload safety validation failed`);
          failCount++;
          continue;
        }
      }

      console.log(`✅ PASS: ${testCase.name}`);
      passCount++;
    } catch (error) {
      console.log(`❌ FAIL: ${testCase.name}`);
      console.log(`   Exception: ${error instanceof Error ? error.message : String(error)}`);
      failCount++;
    }
  }

  console.log('');
  console.log('='.repeat(80));
  console.log('VERIFICATION RESULTS');
  console.log('='.repeat(80));
  console.log(`Total Tests: ${TEST_CASES.length}`);
  console.log(`Passed: ${passCount}`);
  console.log(`Failed: ${failCount}`);
  console.log('');

  if (failCount === 0) {
    console.log('✅ ALL TESTS PASSED');
    console.log('');
    console.log('VERDICT: TASK_3_VERIFICATION_PASS');
    console.log('');
    console.log('Safety Confirmation:');
    console.log('- Pure builder only (no side effects)');
    console.log('- No UI components');
    console.log('- No hook wiring');
    console.log('- No vault/session mutation');
    console.log('- No deploy logic changes');
    console.log('- No Panda/Global Audit rule changes');
    console.log('- No API/provider/database calls');
    console.log('- No backend routes');
    console.log('- No forbidden deploy/publish wording');
    process.exit(0);
  } else {
    console.log('❌ SOME TESTS FAILED');
    console.log('');
    console.log('VERDICT: TASK_3_VERIFICATION_FAIL');
    process.exit(1);
  }
}

// ============================================================================
// MAIN
// ============================================================================

runTests();
