/**
 * Session Draft Promotion Gate - Pure Precondition Validator
 *
 * This module implements pure precondition validation logic for session draft promotion.
 * It contains NO side effects, NO mutations, NO I/O, NO API calls.
 *
 * CRITICAL SAFETY RULES:
 * - Fail-closed by default: block promotion for ANY uncertainty
 * - All preconditions must pass for promotion to be allowed
 * - Snapshot identity must match between audit and current draft
 * - Session audit must be PASSED and NOT stale
 * - No deploy unlock implied
 * - No canonical audit validation implied
 * - No backend persistence implied
 * - No automatic promotion implied
 *
 * FORBIDDEN RETURN FIELDS:
 * - promoted, applied, saved, isSaved, vaultUpdated, dbStatus
 * - deployUnlocked, readyToDeploy, publishReady
 * - autoPromote, executePromotion, promotionSuccessful
 * - commit, transactionId, endpoint, token, credentials
 */

import type {
  PromotionPreconditionResult,
  PromotionBlockReason,
  PromotionSnapshotBinding,
  OperatorAcknowledgementState,
  PROMOTION_SAFETY_INVARIANTS
} from './session-draft-promotion-types';

import type {
  SessionAuditResult,
  SessionAuditLifecycle,
  SnapshotIdentity
} from './remediation-apply-types';

import { SessionAuditLifecycle as AuditLifecycle } from './remediation-apply-types';

/**
 * Input parameters for precondition validation.
 * All parameters are read-only and never mutated.
 */
export interface PreconditionCheckInput {
  /** Whether a session draft exists */
  hasSessionDraft: boolean;
  
  /** Session audit result (null if not run) */
  sessionAuditResult: SessionAuditResult | null;
  
  /** Session audit lifecycle status */
  sessionAuditLifecycle: SessionAuditLifecycle;
  
  /** Current snapshot identity of session draft */
  currentSnapshotIdentity: SnapshotIdentity | null;
  
  /** Transform error (null if no error, empty string treated as no error) */
  transformError: string | null;
  
  /** Whether an article is selected */
  hasSelectedArticle: boolean;
  
  /** Whether local draft copy is available */
  hasLocalDraftCopy: boolean;
  
  /** Operator acknowledgement state */
  acknowledgement: OperatorAcknowledgementState;
}

/**
 * Pure function to check all promotion preconditions.
 * Returns detailed result with block reasons and safety invariants.
 *
 * FAIL-CLOSED CHECKS (21 total):
 * 1. No session draft → NO_SESSION_DRAFT
 * 2. Session audit null → AUDIT_NOT_RUN
 * 3. Audit lifecycle NOT_RUN → AUDIT_NOT_RUN
 * 4. Audit lifecycle RUNNING → AUDIT_NOT_RUN
 * 5. Audit lifecycle FAILED → AUDIT_FAILED
 * 6. Audit lifecycle STALE → AUDIT_STALE
 * 7. Unknown audit lifecycle → AUDIT_FAILED
 * 8. Global Audit failed → GLOBAL_AUDIT_FAILED
 * 9. Panda Check failed → PANDA_CHECK_FAILED
 * 10. Panda structural errors → PANDA_STRUCTURAL_ERRORS
 * 11. Audit isStale flag true → AUDIT_STALE
 * 12. Snapshot content hash mismatch → SNAPSHOT_MISMATCH
 * 13. Snapshot ledger sequence mismatch → SNAPSHOT_MISMATCH
 * 14. Snapshot event ID mismatch → SNAPSHOT_MISMATCH
 * 15. Transform error present → TRANSFORM_ERROR
 * 16. No article selected → NO_ARTICLE_SELECTED
 * 17. Local draft copy null → LOCAL_DRAFT_INVALID
 * 18. Any acknowledgement false → ACKNOWLEDGEMENT_MISSING
 * 19. Missing snapshot identity → SNAPSHOT_MISMATCH
 * 20. Missing audit snapshot identity → SNAPSHOT_MISMATCH
 * 21. Current snapshot identity null → SNAPSHOT_MISMATCH
 *
 * @param input - Precondition check input parameters
 * @returns Precondition check result with detailed block reasons
 */
export function checkPromotionPreconditions(
  input: PreconditionCheckInput
): PromotionPreconditionResult {
  const blockReasons: PromotionBlockReason[] = [];
  const preconditions = {
    sessionDraftExists: false,
    auditRun: false,
    auditPassed: false,
    auditNotStale: false,
    globalAuditPassed: false,
    pandaCheckPassed: false,
    snapshotIdentityMatches: false,
    noTransformError: false,
    articleSelected: false,
    localDraftValid: false
  };

  // ============================================================================
  // CHECK 1: Session draft must exist
  // ============================================================================
  if (!input.hasSessionDraft) {
    blockReasons.push('NO_SESSION_DRAFT' as PromotionBlockReason);
  } else {
    preconditions.sessionDraftExists = true;
  }

  // ============================================================================
  // CHECK 2-7: Session audit must be run and passed
  // ============================================================================
  
  // CHECK 2: Session audit result must not be null
  if (input.sessionAuditResult === null) {
    blockReasons.push('AUDIT_NOT_RUN' as PromotionBlockReason);
  } else {
    preconditions.auditRun = true;

    // CHECK 3-7: Audit lifecycle must be PASSED
    switch (input.sessionAuditLifecycle) {
      case AuditLifecycle.NOT_RUN:
        // CHECK 3: Audit lifecycle NOT_RUN
        blockReasons.push('AUDIT_NOT_RUN' as PromotionBlockReason);
        break;
      
      case AuditLifecycle.RUNNING:
        // CHECK 4: Audit lifecycle RUNNING
        blockReasons.push('AUDIT_NOT_RUN' as PromotionBlockReason);
        break;
      
      case AuditLifecycle.FAILED:
        // CHECK 5: Audit lifecycle FAILED
        blockReasons.push('AUDIT_FAILED' as PromotionBlockReason);
        break;
      
      case AuditLifecycle.STALE:
        // CHECK 6: Audit lifecycle STALE
        blockReasons.push('AUDIT_STALE' as PromotionBlockReason);
        break;
      
      case AuditLifecycle.PASSED:
        preconditions.auditPassed = true;
        break;
      
      default:
        // CHECK 7: Unknown audit lifecycle (fail-closed)
        blockReasons.push('AUDIT_FAILED' as PromotionBlockReason);
        break;
    }
  }

  // ============================================================================
  // CHECK 8: Global Audit must have passed
  // ============================================================================
  if (input.sessionAuditResult && !input.sessionAuditResult.globalAuditPass) {
    blockReasons.push('GLOBAL_AUDIT_FAILED' as PromotionBlockReason);
  } else if (input.sessionAuditResult && input.sessionAuditResult.globalAuditPass) {
    preconditions.globalAuditPassed = true;
  }

  // ============================================================================
  // CHECK 9: Panda Check must have passed
  // ============================================================================
  if (input.sessionAuditResult && !input.sessionAuditResult.pandaCheckPass) {
    blockReasons.push('PANDA_CHECK_FAILED' as PromotionBlockReason);
  } else if (input.sessionAuditResult && input.sessionAuditResult.pandaCheckPass) {
    preconditions.pandaCheckPassed = true;
  }

  // ============================================================================
  // CHECK 10: Panda structural errors must not exist
  // ============================================================================
  if (
    input.sessionAuditResult &&
    input.sessionAuditResult.pandaStructuralErrors &&
    input.sessionAuditResult.pandaStructuralErrors.length > 0
  ) {
    blockReasons.push('PANDA_STRUCTURAL_ERRORS' as PromotionBlockReason);
  }

  // ============================================================================
  // CHECK 11: Audit isStale flag must be false
  // ============================================================================
  if (input.sessionAuditResult && input.sessionAuditResult.isStale === true) {
    blockReasons.push('AUDIT_STALE' as PromotionBlockReason);
  } else if (input.sessionAuditResult && input.sessionAuditResult.isStale === false) {
    preconditions.auditNotStale = true;
  }

  // ============================================================================
  // CHECK 12-14, 19-21: Snapshot identity must match
  // ============================================================================
  
  // CHECK 19: Missing audit snapshot identity
  if (input.sessionAuditResult && !input.sessionAuditResult.identity) {
    blockReasons.push('SNAPSHOT_MISMATCH' as PromotionBlockReason);
  }
  
  // CHECK 21: Current snapshot identity must not be null
  if (!input.currentSnapshotIdentity) {
    blockReasons.push('SNAPSHOT_MISMATCH' as PromotionBlockReason);
  }
  
  // CHECK 12-14: Snapshot identity fields must match
  if (
    input.sessionAuditResult &&
    input.sessionAuditResult.identity &&
    input.currentSnapshotIdentity
  ) {
    const auditIdentity = input.sessionAuditResult.identity;
    const currentIdentity = input.currentSnapshotIdentity;

    // CHECK 12: Content hash must match
    if (auditIdentity.contentHash !== currentIdentity.contentHash) {
      blockReasons.push('SNAPSHOT_MISMATCH' as PromotionBlockReason);
    }
    // CHECK 13: Ledger sequence must match
    else if (auditIdentity.ledgerSequence !== currentIdentity.ledgerSequence) {
      blockReasons.push('SNAPSHOT_MISMATCH' as PromotionBlockReason);
    }
    // CHECK 14: Latest event ID must match
    else if (auditIdentity.latestAppliedEventId !== currentIdentity.latestAppliedEventId) {
      blockReasons.push('SNAPSHOT_MISMATCH' as PromotionBlockReason);
    }
    else {
      preconditions.snapshotIdentityMatches = true;
    }
  }

  // ============================================================================
  // CHECK 15: Transform error must not be present
  // ============================================================================
  // Empty string is treated as no error (not a block)
  if (input.transformError !== null && input.transformError.trim() !== '') {
    blockReasons.push('TRANSFORM_ERROR' as PromotionBlockReason);
  } else {
    preconditions.noTransformError = true;
  }

  // ============================================================================
  // CHECK 16: Article must be selected
  // ============================================================================
  if (!input.hasSelectedArticle) {
    blockReasons.push('NO_ARTICLE_SELECTED' as PromotionBlockReason);
  } else {
    preconditions.articleSelected = true;
  }

  // ============================================================================
  // CHECK 17: Local draft copy must be available
  // ============================================================================
  if (!input.hasLocalDraftCopy) {
    blockReasons.push('LOCAL_DRAFT_INVALID' as PromotionBlockReason);
  } else {
    preconditions.localDraftValid = true;
  }

  // ============================================================================
  // CHECK 18: All operator acknowledgements must be provided
  // ============================================================================
  if (
    !input.acknowledgement.vaultReplacementAcknowledged ||
    !input.acknowledgement.auditInvalidationAcknowledged ||
    !input.acknowledgement.deployLockAcknowledged ||
    !input.acknowledgement.reAuditRequiredAcknowledged
  ) {
    blockReasons.push('ACKNOWLEDGEMENT_MISSING' as PromotionBlockReason);
  }

  // ============================================================================
  // Compute final result
  // ============================================================================
  const canPromote = blockReasons.length === 0;

  // Create snapshot binding
  const snapshotBinding: PromotionSnapshotBinding = {
    snapshotIdentity: input.currentSnapshotIdentity || {
      contentHash: '',
      ledgerSequence: 0,
      latestAppliedEventId: null,
      timestamp: new Date().toISOString()
    },
    checkedAt: new Date().toISOString(),
    preconditionsMet: canPromote,
    blockReasons
  };

  // Return result with hard-coded safety invariants
  return {
    canPromote,
    blockReasons,
    preconditions,
    snapshotBinding,
    acknowledgement: input.acknowledgement,
    // Hard-coded safety invariants (MUST NEVER CHANGE)
    memoryOnly: true,
    deployUnlockAllowed: false,
    canonicalAuditOverwriteAllowed: false,
    automaticPromotionAllowed: false
  };
}

/**
 * Pure helper to verify if snapshot identities match.
 * Used for defensive snapshot identity verification.
 *
 * @param auditIdentity - Snapshot identity from audit result
 * @param currentIdentity - Current snapshot identity
 * @returns true if all fields match, false otherwise
 */
export function verifySnapshotIdentityMatch(
  auditIdentity: SnapshotIdentity | null | undefined,
  currentIdentity: SnapshotIdentity | null | undefined
): boolean {
  // Fail-closed: if either is missing, return false
  if (!auditIdentity || !currentIdentity) {
    return false;
  }

  // All fields must match exactly
  return (
    auditIdentity.contentHash === currentIdentity.contentHash &&
    auditIdentity.ledgerSequence === currentIdentity.ledgerSequence &&
    auditIdentity.latestAppliedEventId === currentIdentity.latestAppliedEventId
  );
}

/**
 * Pure helper to get human-readable block reason messages.
 * Used for UI display and error messages.
 *
 * @param reason - Block reason enum value
 * @returns Human-readable message
 */
export function getBlockReasonMessage(reason: PromotionBlockReason): string {
  switch (reason) {
    case 'NO_SESSION_DRAFT':
      return 'No session draft exists';
    case 'AUDIT_NOT_RUN':
      return 'Session audit has not been run';
    case 'AUDIT_FAILED':
      return 'Session audit failed';
    case 'AUDIT_STALE':
      return 'Session audit is stale - re-audit required';
    case 'GLOBAL_AUDIT_FAILED':
      return 'Global audit did not pass';
    case 'PANDA_CHECK_FAILED':
      return 'Panda validation did not pass';
    case 'SNAPSHOT_MISMATCH':
      return 'Session content has changed since audit - re-audit required';
    case 'TRANSFORM_ERROR':
      return 'Transform error exists - resolve before promotion';
    case 'NO_ARTICLE_SELECTED':
      return 'No article selected';
    case 'LOCAL_DRAFT_INVALID':
      return 'Session draft content not available';
    case 'PANDA_STRUCTURAL_ERRORS':
      return 'Session draft has structural errors';
    case 'ACKNOWLEDGEMENT_MISSING':
      return 'Operator acknowledgement required';
    default:
      return 'Unknown block reason';
  }
}

/**
 * Pure helper to get all block reason messages as an array.
 * Used for UI display of multiple block reasons.
 *
 * @param reasons - Array of block reasons
 * @returns Array of human-readable messages
 */
export function getBlockReasonMessages(reasons: PromotionBlockReason[]): string[] {
  return reasons.map(getBlockReasonMessage);
}

/**
 * Pure helper to check if precondition result allows promotion.
 * Convenience wrapper for UI components.
 *
 * @param result - Precondition check result
 * @returns true if promotion is allowed, false otherwise
 */
export function canProceedWithPromotion(result: PromotionPreconditionResult): boolean {
  return result.canPromote && result.blockReasons.length === 0;
}

/**
 * Pure helper to validate safety invariants are correct.
 * Used for defensive programming and testing.
 *
 * @param result - Precondition check result
 * @returns true if all safety invariants are correct, false otherwise
 */
export function validateSafetyInvariants(result: PromotionPreconditionResult): boolean {
  return (
    result.memoryOnly === true &&
    result.deployUnlockAllowed === false &&
    result.canonicalAuditOverwriteAllowed === false &&
    result.automaticPromotionAllowed === false
  );
}

/**
 * Developer-time assertion for safety invariants.
 * Throws if safety invariants are violated.
 *
 * @param result - Precondition check result
 */
export function assertSafetyInvariants(result: PromotionPreconditionResult): void {
  if (!validateSafetyInvariants(result)) {
    throw new Error('Promotion precondition result violates safety invariants');
  }
}
