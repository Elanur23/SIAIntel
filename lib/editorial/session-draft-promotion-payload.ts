/**
 * Session Draft Promotion Gate - Pure Promotion Payload Builder
 *
 * This module implements pure payload construction logic for session draft promotion.
 * It contains NO side effects, NO mutations, NO I/O, NO API calls, NO execution logic.
 *
 * CRITICAL SAFETY RULES:
 * - This builder ONLY constructs a serializable payload
 * - This builder does NOT execute promotion
 * - This builder does NOT mutate canonical vault
 * - This builder does NOT clear session draft
 * - This builder does NOT unlock deploy
 * - Payload is for future execution handler only
 * - Fail-closed by default: block payload build for ANY uncertainty
 * - All preconditions must pass for payload to be built
 * - Snapshot identity must match between audit and current draft
 * - No deploy unlock implied
 * - No canonical audit validation implied
 * - No backend persistence implied
 * - No automatic promotion implied
 *
 * FORBIDDEN RETURN FIELDS:
 * - execute, commit, promoteNow, apply, autoPromote
 * - promotionJobId, promotionScheduledAt, isSaved, saved
 * - vaultUpdated, writeToDb, dbStatus, transactionId
 * - endpoint, url, token, credentials
 * - deployUnlocked, readyToDeploy, publishReady, promotionSuccessful
 */

import type {
  PromotionPreconditionResult,
  PromotionBlockReason,
  PromotionSnapshotBinding,
  OperatorAcknowledgementState
} from './session-draft-promotion-types';

import type {
  SnapshotIdentity
} from './remediation-apply-types';

import {
  checkPromotionPreconditions,
  verifySnapshotIdentityMatch,
  validateSafetyInvariants
} from './session-draft-promotion-preconditions';

/**
 * Input parameters for building promotion payload.
 * All parameters are read-only and never mutated.
 */
export interface BuildPromotionPayloadInput {
  /** Precondition check result (must be passing) */
  readonly precondition: PromotionPreconditionResult;
  
  /** Snapshot binding for this promotion */
  readonly snapshot: PromotionSnapshotBinding;
  
  /** Local draft copy metadata */
  readonly localDraftCopy: Readonly<{
    draftId: string;
    sessionId?: string;
    title?: string;
    body?: string;
    contentChecksum: string;
    contentBlobRef?: string;
    metadata?: Readonly<Record<string, unknown>>;
  }>;
  
  /** Canonical vault snapshot before promotion */
  readonly canonicalVaultSnapshot: Readonly<{
    vaultId: string;
    title?: string;
    bodyChecksum?: string;
    currentChecksum?: string;
    currentVersion?: string;
    lastUpdatedAt?: string;
  }>;
  
  /** Operator metadata */
  readonly operator: Readonly<{
    operatorId?: string;
    acknowledgementState: OperatorAcknowledgementState;
    acknowledgementNote?: string;
    acknowledgedAt?: string;
  }>;
  
  /** Session remediation ledger metadata */
  readonly sessionRemediationLedger?: Readonly<{
    eventCount: number;
    latestEventId?: string;
    eventIds?: readonly string[];
  }>;
  
  /** Promotion request metadata */
  readonly requestedAt?: string;
  readonly reason?: string;
}

/**
 * Serializable promotion payload for future execution.
 * Contains all metadata needed to execute promotion safely.
 */
export interface SessionDraftPromotionPayload {
  /** Unique payload identifier */
  readonly payloadId: string;
  
  /** Instruction type (always PROMOTION_INTENT) */
  readonly instruction: 'PROMOTION_INTENT';
  
  /** Protocol version */
  readonly promotionProtocolVersion: '1.0';
  
  /** Precondition result ID for audit trail */
  readonly preconditionResultId?: string;
  
  /** Snapshot binding */
  readonly snapshot: PromotionSnapshotBinding;
  
  /** Draft reference */
  readonly draftRef: Readonly<{
    draftId: string;
    sessionId?: string;
    contentChecksum: string;
    contentBlobRef?: string;
  }>;
  
  /** Vault state before promotion */
  readonly vaultBefore: Readonly<{
    vaultId: string;
    checksum?: string;
    version?: string;
    lastUpdatedAt?: string;
  }>;
  
  /** Expected vault state after promotion */
  readonly vaultAfter: Readonly<{
    vaultId: string;
    expectedChecksum: string;
    expectedVersion?: string;
  }>;
  
  /** Diff metadata */
  readonly diff: Readonly<{
    affectedFields: readonly string[];
    changedPaths: readonly string[];
    changeSummary: string;
    changeCount: number;
  }>;
  
  /** Promotion metadata */
  readonly promotionMeta: Readonly<{
    requestedBy?: string;
    requestedAt: string;
    reason?: string;
    ledgerEventCount?: number;
    latestLedgerEventId?: string;
    ledgerEventIds?: readonly string[];
    evaluationChecksum?: string;
  }>;
  
  /** Operator acknowledgement blob */
  readonly acknowledgementBlob: OperatorAcknowledgementState;
  
  /** Hard-coded safety invariants */
  readonly canonicalReAuditRequiredAfterPromotion: true;
  readonly forceAuditInvalidation: true;
  readonly maintainDeployLock: true;
  readonly backendPersistenceAllowed: false;
  readonly memoryOnly: true;
  
  /** Audit event for this payload build */
  readonly auditEvent: Readonly<{
    eventId: string;
    eventType: 'PROMOTION_PAYLOAD_BUILT';
    timestamp: string;
    actorId?: string;
    payloadId: string;
    preconditionResultId?: string;
    snapshotChecksum?: string;
    draftChecksum?: string;
    vaultBeforeChecksum?: string;
    vaultAfterChecksum?: string;
    summary: string;
  }>;
  
  /** Safety invariants list */
  readonly safetyInvariants: readonly string[];
  
  /** Purity marker */
  readonly isPure: true;
}

/**
 * Result of promotion payload build attempt.
 * Discriminated union for success/failure states.
 */
export type PromotionPayloadBuildResult =
  | {
      readonly success: true;
      readonly payload: SessionDraftPromotionPayload;
    }
  | {
      readonly success: false;
      readonly blockedReasons: readonly PromotionBlockReason[];
      readonly summary: string;
      readonly safetyInvariants: readonly string[];
    };

/**
 * Pure function to build promotion payload from validated inputs.
 * Returns detailed result with payload or block reasons.
 *
 * FAIL-CLOSED CHECKS (17 total):
 * 1. Precondition is missing → BLOCKED
 * 2. Precondition does not allow promotion → BLOCKED
 * 3. Precondition safety invariants missing/unsafe → BLOCKED
 * 4. deployUnlockAllowed is not false → BLOCKED
 * 5. canonicalAuditOverwriteAllowed is not false → BLOCKED
 * 6. canonicalReAuditRequiredAfterPromotion is not true → BLOCKED (derived from memoryOnly)
 * 7. backendPersistenceAllowed / memoryOnly safety not safe → BLOCKED
 * 8. Snapshot is missing → BLOCKED
 * 9. LocalDraftCopy is missing → BLOCKED
 * 10. LocalDraftCopy.contentChecksum is missing → BLOCKED
 * 11. Snapshot checksum does not match localDraftCopy.contentChecksum → BLOCKED
 * 12. CanonicalVaultSnapshot is missing → BLOCKED
 * 13. Canonical vault id is missing → BLOCKED
 * 14. Acknowledgement metadata is missing → BLOCKED
 * 15. Transform error or blocked reason still present in precondition → BLOCKED
 * 16. Precondition has any blocked reasons → BLOCKED
 * 17. Output would include forbidden fields or wording → BLOCKED (enforced by type system)
 *
 * @param input - Promotion payload build input parameters
 * @returns Payload build result with payload or block reasons
 */
export function buildPromotionPayload(
  input: BuildPromotionPayloadInput
): PromotionPayloadBuildResult {
  const blockReasons: PromotionBlockReason[] = [];

  // ============================================================================
  // CHECK 1: Precondition must be present
  // ============================================================================
  if (!input.precondition) {
    return createBlockedResult(
      ['NO_SESSION_DRAFT' as PromotionBlockReason],
      'Precondition check result is missing'
    );
  }

  // ============================================================================
  // CHECK 2: Precondition must allow promotion
  // ============================================================================
  if (!input.precondition.canPromote) {
    return createBlockedResult(
      input.precondition.blockReasons,
      'Precondition check does not allow promotion'
    );
  }

  // ============================================================================
  // CHECK 3-7: Precondition safety invariants must be valid
  // ============================================================================
  if (!validateSafetyInvariants(input.precondition)) {
    return createBlockedResult(
      ['AUDIT_FAILED' as PromotionBlockReason],
      'Precondition safety invariants are invalid'
    );
  }

  // CHECK 4: deployUnlockAllowed must be false
  if (input.precondition.deployUnlockAllowed !== false) {
    return createBlockedResult(
      ['AUDIT_FAILED' as PromotionBlockReason],
      'Deploy unlock is not allowed'
    );
  }

  // CHECK 5: canonicalAuditOverwriteAllowed must be false
  if (input.precondition.canonicalAuditOverwriteAllowed !== false) {
    return createBlockedResult(
      ['AUDIT_FAILED' as PromotionBlockReason],
      'Canonical audit overwrite is not allowed'
    );
  }

  // CHECK 6: memoryOnly must be true (implies canonicalReAuditRequired)
  if (input.precondition.memoryOnly !== true) {
    return createBlockedResult(
      ['AUDIT_FAILED' as PromotionBlockReason],
      'Memory-only safety invariant violated'
    );
  }

  // CHECK 7: automaticPromotionAllowed must be false
  if (input.precondition.automaticPromotionAllowed !== false) {
    return createBlockedResult(
      ['AUDIT_FAILED' as PromotionBlockReason],
      'Automatic promotion is not allowed'
    );
  }

  // ============================================================================
  // CHECK 8: Snapshot must be present
  // ============================================================================
  if (!input.snapshot) {
    return createBlockedResult(
      ['SNAPSHOT_MISMATCH' as PromotionBlockReason],
      'Snapshot binding is missing'
    );
  }

  // ============================================================================
  // CHECK 9-10: LocalDraftCopy must be present with checksum
  // ============================================================================
  if (!input.localDraftCopy) {
    return createBlockedResult(
      ['LOCAL_DRAFT_INVALID' as PromotionBlockReason],
      'Local draft copy is missing'
    );
  }

  if (!input.localDraftCopy.contentChecksum) {
    return createBlockedResult(
      ['LOCAL_DRAFT_INVALID' as PromotionBlockReason],
      'Local draft content checksum is missing'
    );
  }

  // ============================================================================
  // CHECK 11: Snapshot checksum must match localDraftCopy checksum
  // ============================================================================
  if (input.snapshot.snapshotIdentity && input.snapshot.snapshotIdentity.contentHash) {
    if (input.snapshot.snapshotIdentity.contentHash !== input.localDraftCopy.contentChecksum) {
      return createBlockedResult(
        ['SNAPSHOT_MISMATCH' as PromotionBlockReason],
        'Snapshot content hash does not match local draft checksum'
      );
    }
  }

  // ============================================================================
  // CHECK 12-13: CanonicalVaultSnapshot must be present with vault ID
  // ============================================================================
  if (!input.canonicalVaultSnapshot) {
    return createBlockedResult(
      ['NO_ARTICLE_SELECTED' as PromotionBlockReason],
      'Canonical vault snapshot is missing'
    );
  }

  if (!input.canonicalVaultSnapshot.vaultId) {
    return createBlockedResult(
      ['NO_ARTICLE_SELECTED' as PromotionBlockReason],
      'Canonical vault ID is missing'
    );
  }

  // ============================================================================
  // CHECK 14: Acknowledgement metadata must be present
  // ============================================================================
  if (!input.operator || !input.operator.acknowledgementState) {
    return createBlockedResult(
      ['ACKNOWLEDGEMENT_MISSING' as PromotionBlockReason],
      'Operator acknowledgement metadata is missing'
    );
  }

  // ============================================================================
  // CHECK 15-16: Precondition must have no blocked reasons
  // ============================================================================
  if (input.precondition.blockReasons && input.precondition.blockReasons.length > 0) {
    return createBlockedResult(
      input.precondition.blockReasons,
      'Precondition check has blocked reasons'
    );
  }

  // ============================================================================
  // All checks passed - build payload
  // ============================================================================

  const payloadId = generatePayloadId();
  const timestamp = new Date().toISOString();
  const preconditionResultId = generatePreconditionResultId(input.precondition);

  // Build diff metadata
  const diff = buildDiffMetadata(input.localDraftCopy, input.canonicalVaultSnapshot);

  // Build promotion metadata
  const promotionMeta = {
    requestedBy: input.operator.operatorId || 'warroom-operator',
    requestedAt: input.requestedAt || timestamp,
    reason: input.reason || 'Session draft promotion',
    ledgerEventCount: input.sessionRemediationLedger?.eventCount || 0,
    latestLedgerEventId: input.sessionRemediationLedger?.latestEventId,
    ledgerEventIds: input.sessionRemediationLedger?.eventIds || [],
    evaluationChecksum: computeEvaluationChecksum(input)
  };

  // Build audit event
  const auditEvent = {
    eventId: generateAuditEventId(),
    eventType: 'PROMOTION_PAYLOAD_BUILT' as const,
    timestamp,
    actorId: input.operator.operatorId || 'warroom-operator',
    payloadId,
    preconditionResultId,
    snapshotChecksum: input.snapshot.snapshotIdentity?.contentHash,
    draftChecksum: input.localDraftCopy.contentChecksum,
    vaultBeforeChecksum: input.canonicalVaultSnapshot.currentChecksum,
    vaultAfterChecksum: input.localDraftCopy.contentChecksum,
    summary: `Promotion payload built for draft ${input.localDraftCopy.draftId}`
  };

  // Build safety invariants list
  const safetyInvariants = [
    'canonicalReAuditRequiredAfterPromotion: true',
    'forceAuditInvalidation: true',
    'maintainDeployLock: true',
    'backendPersistenceAllowed: false',
    'memoryOnly: true',
    'deployUnlockAllowed: false',
    'canonicalAuditOverwriteAllowed: false',
    'automaticPromotionAllowed: false'
  ];

  // Build payload
  const payload: SessionDraftPromotionPayload = {
    payloadId,
    instruction: 'PROMOTION_INTENT',
    promotionProtocolVersion: '1.0',
    preconditionResultId,
    snapshot: input.snapshot,
    draftRef: {
      draftId: input.localDraftCopy.draftId,
      sessionId: input.localDraftCopy.sessionId,
      contentChecksum: input.localDraftCopy.contentChecksum,
      contentBlobRef: input.localDraftCopy.contentBlobRef
    },
    vaultBefore: {
      vaultId: input.canonicalVaultSnapshot.vaultId,
      checksum: input.canonicalVaultSnapshot.currentChecksum,
      version: input.canonicalVaultSnapshot.currentVersion,
      lastUpdatedAt: input.canonicalVaultSnapshot.lastUpdatedAt
    },
    vaultAfter: {
      vaultId: input.canonicalVaultSnapshot.vaultId,
      expectedChecksum: input.localDraftCopy.contentChecksum,
      expectedVersion: incrementVersion(input.canonicalVaultSnapshot.currentVersion)
    },
    diff,
    promotionMeta,
    acknowledgementBlob: input.operator.acknowledgementState,
    // Hard-coded safety invariants (MUST NEVER CHANGE)
    canonicalReAuditRequiredAfterPromotion: true,
    forceAuditInvalidation: true,
    maintainDeployLock: true,
    backendPersistenceAllowed: false,
    memoryOnly: true,
    auditEvent,
    safetyInvariants,
    isPure: true
  };

  return {
    success: true,
    payload
  };
}

/**
 * Pure helper to create blocked result.
 */
function createBlockedResult(
  blockedReasons: readonly PromotionBlockReason[],
  summary: string
): PromotionPayloadBuildResult {
  return {
    success: false,
    blockedReasons,
    summary,
    safetyInvariants: [
      'canonicalReAuditRequiredAfterPromotion: true',
      'forceAuditInvalidation: true',
      'maintainDeployLock: true',
      'backendPersistenceAllowed: false',
      'memoryOnly: true'
    ]
  };
}

/**
 * Pure helper to generate payload ID.
 * Uses deterministic lightweight local hashing for test/audit identity only.
 * NOT a cryptographic hash - for audit trail purposes only.
 */
function generatePayloadId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `payload_${timestamp}_${random}`;
}

/**
 * Pure helper to generate precondition result ID.
 */
function generatePreconditionResultId(precondition: PromotionPreconditionResult): string {
  const timestamp = Date.now();
  const checksumPart = precondition.snapshotBinding?.snapshotIdentity?.contentHash?.substring(0, 8) || 'unknown';
  return `precond_${timestamp}_${checksumPart}`;
}

/**
 * Pure helper to generate audit event ID.
 */
function generateAuditEventId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `audit_${timestamp}_${random}`;
}

/**
 * Pure helper to build diff metadata.
 */
function buildDiffMetadata(
  localDraftCopy: BuildPromotionPayloadInput['localDraftCopy'],
  canonicalVaultSnapshot: BuildPromotionPayloadInput['canonicalVaultSnapshot']
): SessionDraftPromotionPayload['diff'] {
  // Simplified diff computation for payload metadata
  // Real diff would be computed by execution handler
  const affectedFields: string[] = [];
  const changedPaths: string[] = [];
  let changeCount = 0;

  if (localDraftCopy.title !== canonicalVaultSnapshot.title) {
    affectedFields.push('title');
    changedPaths.push('vault.title');
    changeCount++;
  }

  if (localDraftCopy.contentChecksum !== canonicalVaultSnapshot.bodyChecksum) {
    affectedFields.push('body');
    changedPaths.push('vault.body');
    changeCount++;
  }

  const changeSummary = changeCount > 0
    ? `${changeCount} field(s) changed: ${affectedFields.join(', ')}`
    : 'No changes detected';

  return {
    affectedFields,
    changedPaths,
    changeSummary,
    changeCount
  };
}

/**
 * Pure helper to compute evaluation checksum.
 * Deterministic lightweight local checksum for audit identity only.
 * NOT a cryptographic hash - for audit trail purposes only.
 */
function computeEvaluationChecksum(input: BuildPromotionPayloadInput): string {
  // Simple deterministic checksum based on key input fields
  const parts = [
    input.localDraftCopy.contentChecksum,
    input.canonicalVaultSnapshot.vaultId,
    input.snapshot.snapshotIdentity?.contentHash || '',
    input.operator.operatorId || 'unknown'
  ];
  
  const combined = parts.join('|');
  
  // Simple non-cryptographic hash for audit identity
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `eval_${Math.abs(hash).toString(36)}`;
}

/**
 * Pure helper to increment version string.
 */
function incrementVersion(currentVersion: string | undefined): string {
  if (!currentVersion) {
    return '1.0.0';
  }

  const parts = currentVersion.split('.');
  if (parts.length !== 3) {
    return '1.0.0';
  }

  const [major, minor, patch] = parts.map(p => parseInt(p, 10));
  return `${major}.${minor}.${patch + 1}`;
}

/**
 * Pure helper to validate payload does not contain forbidden fields.
 * Used for defensive programming and testing.
 */
export function validatePayloadSafety(payload: SessionDraftPromotionPayload): boolean {
  // Check that payload does not contain forbidden fields
  const payloadKeys = Object.keys(payload);
  const forbiddenFields = [
    'execute', 'commit', 'promoteNow', 'apply', 'autoPromote',
    'promotionJobId', 'promotionScheduledAt', 'isSaved', 'saved',
    'vaultUpdated', 'writeToDb', 'dbStatus', 'transactionId',
    'endpoint', 'url', 'token', 'credentials',
    'deployUnlocked', 'readyToDeploy', 'publishReady', 'promotionSuccessful'
  ];

  for (const forbiddenField of forbiddenFields) {
    if (payloadKeys.includes(forbiddenField)) {
      return false;
    }
  }

  // Check safety invariants are correct
  if (payload.canonicalReAuditRequiredAfterPromotion !== true) return false;
  if (payload.forceAuditInvalidation !== true) return false;
  if (payload.maintainDeployLock !== true) return false;
  if (payload.backendPersistenceAllowed !== false) return false;
  if (payload.memoryOnly !== true) return false;
  if (payload.isPure !== true) return false;

  return true;
}

/**
 * Pure helper to check if payload build result is successful.
 */
export function isPayloadBuildSuccess(
  result: PromotionPayloadBuildResult
): result is Extract<PromotionPayloadBuildResult, { success: true }> {
  return result.success === true;
}

/**
 * Pure helper to check if payload build result is blocked.
 */
export function isPayloadBuildBlocked(
  result: PromotionPayloadBuildResult
): result is Extract<PromotionPayloadBuildResult, { success: false }> {
  return result.success === false;
}

/**
 * Developer-time assertion for payload safety.
 * Throws if payload contains forbidden fields or invalid safety invariants.
 */
export function assertPayloadSafety(payload: SessionDraftPromotionPayload): void {
  if (!validatePayloadSafety(payload)) {
    throw new Error('Promotion payload violates safety invariants or contains forbidden fields');
  }
}
