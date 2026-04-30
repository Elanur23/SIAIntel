/**
 * Session Draft Promotion Gate - Local Promotion Dry-Run Execution Handler
 *
 * This module implements the dry-run execution handler for session draft promotion.
 * It performs a final safety check and builds a promotion preview without any mutation.
 *
 * CRITICAL SAFETY RULES:
 * - ZERO mutations to canonical vault
 * - ZERO mutations to session draft
 * - ZERO mutations to audit state
 * - ZERO API/database/provider calls
 * - ZERO side effects
 * - Fail-closed: block for ANY safety violation or uncertainty
 */

import {
  PromotionPreconditionResult,
  PromotionSnapshotBinding,
  OperatorAcknowledgementState,
} from '@/lib/editorial/session-draft-promotion-types';
import {
  computePromotionTransitionPlan,
} from '@/lib/editorial/session-draft-promotion-local-transition';
import {
  SessionDraftPromotionPayload
} from '@/lib/editorial/session-draft-promotion-payload';
import {
  SessionAuditResult,
  SessionAuditLifecycle
} from '@/lib/editorial/remediation-apply-types';

/**
 * Input for the local promotion dry-run execution handler.
 * Contains all data required to re-verify safety and build a preview.
 */
export interface LocalPromotionDryRunInput {
  /** Precondition result to re-verify */
  precondition: PromotionPreconditionResult | null;

  /** Snapshot binding to re-verify */
  snapshotBinding: PromotionSnapshotBinding | null;

  /** Local draft copy metadata */
  localDraftCopy: {
    draftId: string;
    sessionId?: string;
    contentChecksum: string;
    contentBlobRef?: string;
    metadata?: Record<string, unknown>;
    title?: string;
    body?: string;
  } | null;

  /** Canonical vault state before promotion */
  canonicalVaultBefore: {
    vaultId: string;
    checksum?: string;
    version?: string;
    lastUpdatedAt?: string;
    title?: string;
    bodyChecksum?: string;
  } | null;

  /** Operator context and acknowledgements */
  operatorContext?: {
    operatorId?: string;
    acknowledgementState?: OperatorAcknowledgementState | null;
    acknowledgementNote?: string;
  };

  /** Optional reference to a previously built payload */
  payloadRef?: {
    payloadId?: string;
    instruction?: string;
    expectedChecksum?: string;
  };

  /** Timestamp of the dry-run request */
  requestedAt?: string;

  /** Execution options */
  options?: {
    ttlMinutes?: number;
  };

  /** Raw audit results for re-verification if available */
  sessionAuditResult?: SessionAuditResult | null;

  /** Ledger metadata for re-verification if available */
  sessionRemediationLedger?: {
    eventCount: number;
    latestEventId?: string;
    eventIds?: string[];
  };
}

/**
 * Success preview result for local promotion dry-run.
 */
export interface LocalPromotionDryRunPreview {
  previewId: string;
  createdAt: string;
  transitionPlanId: string;
  /** Full precondition result from transition plan */
  precondition: PromotionPreconditionResult;
  /** Full payload preview (read-only) */
  payload: SessionDraftPromotionPayload | null;
  snapshotBinding: PromotionSnapshotBinding;
  sourceSessionDraftRef: {
    draftId: string;
    contentChecksum: string
  };
  targetCanonicalVaultRef: {
    vaultId: string
  };
  transitionPlanSummary: string;
  safetyInvariants: {
    dryRunOnly: true;
    noExecution: true;
    noMutation: true;
    deployLocked: true;
    canonicalReAuditRequired: true;
    requiredAuditInvalidation: true;
    backendPersistenceForbidden: true;
    sessionAuditNotInherited: true;
    localApplyDeferred: true;
    task6B2RequiredForApply: true;
  };
  warnings: string[];
  canonicalReAuditRequired: true;
  requiredAuditInvalidation: true;
  deployMustRemainLocked: true;
  backendPersistenceAllowed: false;
  sessionAuditInheritanceAllowed: false;
  executionPerformed: false;
  mutationPerformed: false;
  localVaultMutationDeferred: true;
  actualApplyRequiresTask6B2: true;
  isDryRun: true;
}

/**
 * Result of a local promotion dry-run execution.
 */
export type LocalPromotionDryRunResult =
  | {
      success: true;
      preview: LocalPromotionDryRunPreview;
    }
  | {
      success: false;
      blockedReasons: string[];
      summary: string;
      executionPerformed: false;
      mutationPerformed: false;
      deployUnlocked: false;
    };

/**
 * Executes a dry-run promotion to build a preview of what would happen.
 * This function is pure and performs no side effects or mutations.
 *
 * @param input - Dry-run execution input
 * @returns Dry-run result with preview or block reasons
 */
export function executeLocalPromotionDryRun(
  input: LocalPromotionDryRunInput
): LocalPromotionDryRunResult {
  const blockedReasons: string[] = [];

  // ============================================================================
  // 1. DEFENSIVE INPUT VALIDATION (FAIL-CLOSED)
  // ============================================================================

  // CHECK 1: precondition missing
  if (!input.precondition) {
    blockedReasons.push('precondition missing');
  }
  // CHECK 2: precondition does not allow/pass promotion
  else if (!input.precondition.canPromote) {
    blockedReasons.push('precondition does not allow/pass promotion');
  }

  // CHECK 3: precondition has blocked reasons
  if (input.precondition && input.precondition.blockReasons && input.precondition.blockReasons.length > 0) {
    blockedReasons.push(...input.precondition.blockReasons.map(r => `precondition blocked: ${r}`));
  }

  // CHECK 4: snapshotBinding missing
  if (!input.snapshotBinding) {
    blockedReasons.push('snapshotBinding missing');
  }
  // CHECK 5: snapshotBinding checksum/contentHash missing
  else if (!input.snapshotBinding.snapshotIdentity?.contentHash) {
    blockedReasons.push('snapshotBinding checksum/contentHash missing');
  }

  // CHECK 6: localDraftCopy missing
  if (!input.localDraftCopy) {
    blockedReasons.push('localDraftCopy missing');
  }
  // CHECK 7: localDraftCopy contentChecksum missing
  else if (!input.localDraftCopy.contentChecksum) {
    blockedReasons.push('localDraftCopy contentChecksum missing');
  }

  // CHECK 8: snapshot checksum/contentHash mismatches localDraftCopy.contentChecksum
  if (
    input.snapshotBinding?.snapshotIdentity?.contentHash &&
    input.localDraftCopy?.contentChecksum &&
    input.snapshotBinding.snapshotIdentity.contentHash !== input.localDraftCopy.contentChecksum
  ) {
    blockedReasons.push('snapshot checksum/contentHash mismatches localDraftCopy.contentChecksum');
  }

  // CHECK 9: canonicalVaultBefore missing
  if (!input.canonicalVaultBefore) {
    blockedReasons.push('canonicalVaultBefore missing');
  }
  // CHECK 10: canonical vault id missing
  else if (!input.canonicalVaultBefore.vaultId) {
    blockedReasons.push('canonical vault id missing');
  }

  // CHECK 11: operator acknowledgement is required but missing
  const ack = input.operatorContext?.acknowledgementState;
  if (!ack || !ack.vaultReplacementAcknowledged || !ack.auditInvalidationAcknowledged || !ack.deployLockAcknowledged || !ack.reAuditRequiredAcknowledged) {
    blockedReasons.push('operator acknowledgement is required but missing');
  }

  // CHECK 12: payloadRef exists with instruction not equal to PROMOTION_INTENT
  if (input.payloadRef && input.payloadRef.instruction !== 'PROMOTION_INTENT') {
    blockedReasons.push('payloadRef exists with instruction not equal to PROMOTION_INTENT');
  }

  // If initial checks failed, return blocked result
  if (blockedReasons.length > 0) {
    return {
      success: false,
      blockedReasons,
      summary: 'Dry-run blocked by defensive input validation',
      executionPerformed: false,
      mutationPerformed: false,
      deployUnlocked: false
    };
  }

  // ============================================================================
  // 2. COMPUTE TRANSITION PLAN (TASK 6A HELPER)
  // ============================================================================

  // Prepare input for computePromotionTransitionPlan
  const transitionPlanInput = {
    // PreconditionCheckInput part
    hasSessionDraft: true,
    sessionAuditResult: input.sessionAuditResult || null,
    sessionAuditLifecycle: input.sessionAuditResult?.lifecycle || SessionAuditLifecycle.NOT_RUN,
    currentSnapshotIdentity: input.snapshotBinding?.snapshotIdentity || null,
    transformError: null,
    hasSelectedArticle: true,
    hasLocalDraftCopy: true,
    acknowledgement: input.operatorContext?.acknowledgementState!,

    // BuildPromotionPayloadInput part (omitting operator, precondition, snapshot)
    localDraftCopy: {
      draftId: input.localDraftCopy!.draftId,
      sessionId: input.localDraftCopy!.sessionId,
      contentChecksum: input.localDraftCopy!.contentChecksum,
      contentBlobRef: input.localDraftCopy!.contentBlobRef,
      title: input.localDraftCopy!.title,
      body: input.localDraftCopy!.body,
      metadata: input.localDraftCopy!.metadata
    },
    canonicalVaultSnapshot: {
      vaultId: input.canonicalVaultBefore!.vaultId,
      title: input.canonicalVaultBefore!.title,
      currentChecksum: input.canonicalVaultBefore!.checksum,
      currentVersion: input.canonicalVaultBefore!.version,
      lastUpdatedAt: input.canonicalVaultBefore!.lastUpdatedAt,
      bodyChecksum: input.canonicalVaultBefore!.bodyChecksum
    },
    sessionRemediationLedger: input.sessionRemediationLedger ? {
      eventCount: input.sessionRemediationLedger.eventCount,
      latestEventId: input.sessionRemediationLedger.latestEventId,
      eventIds: input.sessionRemediationLedger.eventIds || []
    } : undefined
  };

  const transitionPlan = computePromotionTransitionPlan(transitionPlanInput);

  // CHECK 13: transition plan helper returns blocked result
  if (!transitionPlan.isValid) {
    return {
      success: false,
      blockedReasons: transitionPlan.blockReasons.map(r => `transition plan blocked: ${r}`),
      summary: transitionPlan.summary,
      executionPerformed: false,
      mutationPerformed: false,
      deployUnlocked: false
    };
  }

  // CHECK 14: transition plan lacks required safety invariants
  if (!transitionPlan.precondition.memoryOnly || transitionPlan.precondition.deployUnlockAllowed) {
    return {
      success: false,
      blockedReasons: ['transition plan violates safety invariants'],
      summary: 'Dry-run blocked: Safety invariant violation in transition plan',
      executionPerformed: false,
      mutationPerformed: false,
      deployUnlocked: false
    };
  }

  // CHECK 15: transition plan indicates executionPerformed true
  // CHECK 16: transition plan indicates mutationAllowedInThisTask true
  if ((transitionPlan as any).executionPerformed === true || (transitionPlan as any).mutationAllowedInThisTask === true) {
    return {
      success: false,
      blockedReasons: ['transition plan indicates unauthorized execution or mutation'],
      summary: 'Dry-run blocked: Unexpected state in pure transition plan',
      executionPerformed: false,
      mutationPerformed: false,
      deployUnlocked: false
    };
  }

  // ============================================================================
  // 3. ASSEMBLE DRY-RUN PREVIEW
  // ============================================================================

  const previewId = `dry_run_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const createdAt = new Date().toISOString();

  const preview: LocalPromotionDryRunPreview = {
    previewId,
    createdAt,
    transitionPlanId: transitionPlan.payload?.payloadId || 'unknown_plan',
    precondition: transitionPlan.precondition,
    payload: transitionPlan.payload,
    snapshotBinding: transitionPlan.precondition.snapshotBinding,
    sourceSessionDraftRef: {
      draftId: input.localDraftCopy!.draftId,
      contentChecksum: input.localDraftCopy!.contentChecksum
    },
    targetCanonicalVaultRef: {
      vaultId: input.canonicalVaultBefore!.vaultId
    },
    transitionPlanSummary: transitionPlan.summary,
    safetyInvariants: {
      dryRunOnly: true,
      noExecution: true,
      noMutation: true,
      deployLocked: true,
      canonicalReAuditRequired: true,
      requiredAuditInvalidation: true,
      backendPersistenceForbidden: true,
      sessionAuditNotInherited: true,
      localApplyDeferred: true,
      task6B2RequiredForApply: true
    },
    warnings: [],
    canonicalReAuditRequired: true,
    requiredAuditInvalidation: true,
    deployMustRemainLocked: true,
    backendPersistenceAllowed: false,
    sessionAuditInheritanceAllowed: false,
    executionPerformed: false,
    mutationPerformed: false,
    localVaultMutationDeferred: true,
    actualApplyRequiresTask6B2: true,
    isDryRun: true
  };

  return {
    success: true,
    preview
  };
}

// ============================================================================
// TASK 6B-2B: REAL LOCAL PROMOTION EXECUTION SCAFFOLD
//
// CRITICAL SAFETY RULES (scaffold phase):
// - This function is a SCAFFOLD ONLY. It returns a blocked result for every
//   call until Tasks 4-10 implement the real mutation sequence.
// - ZERO mutations to canonical vault (vault update step NOT executed)
// - ZERO mutations to session draft (session clear step NOT executed)
// - ZERO mutations to audit state (canonical audit invalidation step NOT executed)
// - ZERO API/database/provider calls
// - ZERO side effects
// - Fail-closed: always returns blocked until fully implemented
//
// REQUIRED FUTURE MUTATION SEQUENCE (Tasks 4-10):
//   Phase 1 — Precondition re-check          (Task 4)
//   Phase 2 — Dry-run re-verification        (Task 5)
//   Phase 3 — Snapshot freshness check       (Task 5)
//   Phase 4 — Payload verification           (Task 5)
//   Phase 5 — Vault update step              (Task 7)  ← FIRST mutation
//   Phase 6 — Canonical audit invalidation   (Task 8)  ← SECOND mutation
//   Phase 7 — Derived preview/audit clear    (Task 9)  ← THIRD mutation
//   Phase 8 — Session draft clear step       (Task 10) ← FOURTH mutation
//
// EXECUTION LOCK CONTRACT:
//   - A module-level boolean flag acts as a simple execution lock.
//   - The lock is acquired before any phase begins.
//   - The lock is released in a try-finally block to guarantee release on
//     success, failure, and uncaught exceptions.
//   - Concurrent calls while the lock is held return EXECUTION_LOCK blocked.
//   - The lock is NOT persisted; it lives only in module memory.
// ============================================================================

import {
  RealPromotionExecutionInput,
  RealPromotionExecutionResult,
  RealPromotionBlockCategory,
  createBlockedResult,
  createSuccessResult,
  LocalMutationCallbackResult,
} from '@/lib/editorial/session-draft-promotion-6b2b-types';

// ============================================================================
// MODULE-LEVEL EXECUTION LOCK
// Prevents concurrent real promotion executions.
// Pure in-memory boolean — no persistence, no side effects.
// ============================================================================

/**
 * Execution lock state for real local promotion.
 * Module-scoped to ensure a single lock per warroom session.
 *
 * SCAFFOLD NOTE: This lock is declared here but only enforced once
 * Tasks 4-10 implement the real mutation phases.
 */
let _realPromotionExecutionLock = false;

/**
 * Pure helper to check whether the execution lock is currently held.
 * Exported for testing purposes only — callers must not bypass the lock.
 */
export function isRealPromotionExecutionLocked(): boolean {
  return _realPromotionExecutionLock;
}

/**
 * Pure helper to reset the execution lock.
 * FOR TESTING ONLY — must not be called from production code paths.
 * @internal
 */
export function _resetRealPromotionExecutionLockForTesting(): void {
  _realPromotionExecutionLock = false;
}

// ============================================================================
// REAL LOCAL PROMOTION EXECUTION — SCAFFOLD
// ============================================================================

/**
 * Executes real local promotion of session draft content into the canonical
 * vault state (React memory only).
 *
 * TASK 6B-2B SCAFFOLD: This function currently returns a blocked result for
 * every call. The real mutation sequence will be wired in Tasks 4-10.
 *
 * SAFETY INVARIANTS (enforced even in scaffold):
 * - Returns blocked result immediately — no mutations performed
 * - Execution lock is acquired and released via try-finally
 * - Concurrent calls are rejected with EXECUTION_LOCK block category
 * - Deploy remains locked (no deploy logic touched)
 * - No backend/API/database/provider calls
 * - No browser persistence APIs used
 * - No session audit inheritance
 * - Rollback deferred to future phase
 *
 * REQUIRED MUTATION SEQUENCE (to be implemented in Tasks 4-10):
 *   1. Precondition re-check
 *   2. Dry-run re-verification
 *   3. Snapshot freshness check
 *   4. Payload verification
 *   5. Vault update step              (Task 7)
 *   6. Canonical audit invalidation   (Task 8)
 *   7. Derived preview/audit clear    (Task 9)
 *   8. Session draft clear step       (Task 10)
 *
 * @param input - Real promotion execution input (all required data)
 * @returns RealPromotionExecutionResult — always blocked in scaffold phase
 */
export function executeRealLocalPromotion(
  input: RealPromotionExecutionInput
): RealPromotionExecutionResult {
  // ============================================================================
  // GUARD 0: Execution lock check (concurrent execution prevention)
  // ============================================================================
  if (_realPromotionExecutionLock) {
    return createBlockedResult(
      RealPromotionBlockCategory.EXECUTION_LOCK,
      ['Real promotion execution is already in progress'],
      'BLOCKED: Concurrent real promotion execution is not allowed',
      false // lock was NOT acquired by this call
    );
  }

  // Acquire execution lock
  _realPromotionExecutionLock = true;

  try {
    // ==========================================================================
    // PHASE 1 — Precondition re-check (Task 4)
    // Verify all required inputs and safety conditions before any mutation.
    // ==========================================================================

    // GUARD 1: Required identifier presence (PAYLOAD check)
    if (!input.articleId || !input.packageId || !input.operatorId) {
      return createBlockedResult(
        RealPromotionBlockCategory.PAYLOAD,
        ['Required identifiers (article, package, or operator) are missing'],
        'BLOCKED: Incomplete execution payload',
        true
      );
    }

    // GUARD 2: Session draft presence/content (PAYLOAD check)
    if (!input.sessionDraftContent || Object.keys(input.sessionDraftContent).length === 0) {
      return createBlockedResult(
        RealPromotionBlockCategory.PAYLOAD,
        ['Session draft content is empty or missing'],
        'BLOCKED: No content available for promotion',
        true
      );
    }

    // GUARD 3: Precondition result presence & allows promotion (PRECONDITION check)
    if (!input.precondition) {
      return createBlockedResult(
        RealPromotionBlockCategory.PRECONDITION,
        ['Precondition result is missing'],
        'BLOCKED: Precondition result not provided',
        true
      );
    }
    if (!input.precondition.canPromote) {
      return createBlockedResult(
        RealPromotionBlockCategory.PRECONDITION,
        [
          'Precondition check does not allow promotion',
          ...(input.precondition.blockReasons || []).map(r => `Source block: ${r}`)
        ],
        'BLOCKED: Precondition safety check failed',
        true
      );
    }

    // GUARD 4: Operator acknowledgement state presence & all required acknowledgements true (ACKNOWLEDGEMENT check)
    const ack = input.acknowledgement;
    if (!ack) {
      return createBlockedResult(
        RealPromotionBlockCategory.ACKNOWLEDGEMENT,
        ['Operator acknowledgement state is missing'],
        'BLOCKED: Acknowledgements not provided',
        true
      );
    }
    const missingAcks: string[] = [];
    if (!ack.vaultReplacementAcknowledged) missingAcks.push('Vault replacement not acknowledged');
    if (!ack.auditInvalidationAcknowledged) missingAcks.push('Audit invalidation not acknowledged');
    if (!ack.deployLockAcknowledged) missingAcks.push('Deploy lock requirement not acknowledged');
    if (!ack.reAuditRequiredAcknowledged) missingAcks.push('Re-audit requirement not acknowledged');

    if (missingAcks.length > 0) {
      return createBlockedResult(
        RealPromotionBlockCategory.ACKNOWLEDGEMENT,
        missingAcks,
        'BLOCKED: Required operator acknowledgements are missing',
        true
      );
    }

    // GUARD 5: Snapshot binding presence & identity (SNAPSHOT check)
    if (!input.snapshotBinding) {
      return createBlockedResult(
        RealPromotionBlockCategory.SNAPSHOT,
        ['Snapshot binding is missing'],
        'BLOCKED: Snapshot binding not provided',
        true
      );
    }
    if (!input.snapshotBinding.snapshotIdentity?.contentHash) {
      return createBlockedResult(
        RealPromotionBlockCategory.SNAPSHOT,
        ['Snapshot binding identity is incomplete (missing content hash)'],
        'BLOCKED: Invalid snapshot binding',
        true
      );
    }

    // GUARD 6: Dry-run result/preview presence & validity (DRY_RUN check)
    if (!input.dryRunPreview) {
      return createBlockedResult(
        RealPromotionBlockCategory.DRY_RUN,
        ['Dry-run preview is missing'],
        'BLOCKED: Dry-run preview not provided',
        true
      );
    }
    if (!input.dryRunPreview.isDryRun) {
      return createBlockedResult(
        RealPromotionBlockCategory.DRY_RUN,
        ['Input dry-run preview is invalid (missing isDryRun flag)'],
        'BLOCKED: Invalid dry-run preview',
        true
      );
    }

    // ==========================================================================
    // PHASE 2 — Dry-run preview success verification (Task 5)
    // Verify the dry-run preview is valid and indicates safe state
    // ==========================================================================

    // VERIFICATION 1: Dry-run preview safety invariants
    const preview = input.dryRunPreview;
    
    // Check: isDryRun flag must be true
    if (!preview.isDryRun) {
      return createBlockedResult(
        RealPromotionBlockCategory.DRY_RUN,
        ['Dry-run preview isDryRun flag is not true'],
        'BLOCKED: Invalid dry-run preview state',
        true
      );
    }

    // Check: executionPerformed must be false
    if (preview.executionPerformed !== false) {
      return createBlockedResult(
        RealPromotionBlockCategory.DRY_RUN,
        ['Dry-run preview indicates execution was performed (must be false)'],
        'BLOCKED: Dry-run preview shows unauthorized execution',
        true
      );
    }

    // Check: mutationPerformed must be false
    if (preview.mutationPerformed !== false) {
      return createBlockedResult(
        RealPromotionBlockCategory.DRY_RUN,
        ['Dry-run preview indicates mutation was performed (must be false)'],
        'BLOCKED: Dry-run preview shows unauthorized mutation',
        true
      );
    }

    // Check: deployMustRemainLocked must be true
    if (preview.deployMustRemainLocked !== true) {
      return createBlockedResult(
        RealPromotionBlockCategory.DRY_RUN,
        ['Dry-run preview does not require deploy to remain locked'],
        'BLOCKED: Dry-run preview violates deploy lock requirement',
        true
      );
    }

    // Check: backendPersistenceAllowed must be false
    if (preview.backendPersistenceAllowed !== false) {
      return createBlockedResult(
        RealPromotionBlockCategory.DRY_RUN,
        ['Dry-run preview allows backend persistence (must be false)'],
        'BLOCKED: Dry-run preview violates backend persistence prohibition',
        true
      );
    }

    // Check: canonicalReAuditRequired must be true
    if (preview.canonicalReAuditRequired !== true) {
      return createBlockedResult(
        RealPromotionBlockCategory.DRY_RUN,
        ['Dry-run preview does not require canonical re-audit'],
        'BLOCKED: Dry-run preview violates re-audit requirement',
        true
      );
    }

    // Check: requiredAuditInvalidation must be true
    if (preview.requiredAuditInvalidation !== true) {
      return createBlockedResult(
        RealPromotionBlockCategory.DRY_RUN,
        ['Dry-run preview does not require audit invalidation'],
        'BLOCKED: Dry-run preview violates audit invalidation requirement',
        true
      );
    }

    // Check: sessionAuditInheritanceAllowed must be false
    if (preview.sessionAuditInheritanceAllowed !== false) {
      return createBlockedResult(
        RealPromotionBlockCategory.DRY_RUN,
        ['Dry-run preview allows session audit inheritance (must be false)'],
        'BLOCKED: Dry-run preview violates session audit inheritance prohibition',
        true
      );
    }

    // Check: localVaultMutationDeferred must be true
    if (preview.localVaultMutationDeferred !== true) {
      return createBlockedResult(
        RealPromotionBlockCategory.DRY_RUN,
        ['Dry-run preview does not defer local vault mutation'],
        'BLOCKED: Dry-run preview indicates premature vault mutation',
        true
      );
    }

    // Check: actualApplyRequiresTask6B2 must be true
    if (preview.actualApplyRequiresTask6B2 !== true) {
      return createBlockedResult(
        RealPromotionBlockCategory.DRY_RUN,
        ['Dry-run preview does not require Task 6B-2 for actual apply'],
        'BLOCKED: Dry-run preview missing Task 6B-2 requirement',
        true
      );
    }

    // ==========================================================================
    // PHASE 3 — Snapshot freshness verification (Task 5)
    // Verify snapshot identity has not changed since dry-run
    // ==========================================================================

    // VERIFICATION 2: Snapshot binding from dry-run preview
    const previewSnapshotBinding = preview.snapshotBinding;
    if (!previewSnapshotBinding) {
      return createBlockedResult(
        RealPromotionBlockCategory.SNAPSHOT,
        ['Dry-run preview is missing snapshot binding'],
        'BLOCKED: Dry-run preview has no snapshot binding',
        true
      );
    }

    const previewSnapshotIdentity = previewSnapshotBinding.snapshotIdentity;
    if (!previewSnapshotIdentity) {
      return createBlockedResult(
        RealPromotionBlockCategory.SNAPSHOT,
        ['Dry-run preview snapshot binding is missing snapshot identity'],
        'BLOCKED: Dry-run preview has incomplete snapshot binding',
        true
      );
    }

    // VERIFICATION 3: Snapshot identity content hash match
    const inputSnapshotIdentity = input.snapshotBinding.snapshotIdentity;
    if (!inputSnapshotIdentity) {
      return createBlockedResult(
        RealPromotionBlockCategory.SNAPSHOT,
        ['Input snapshot binding is missing snapshot identity'],
        'BLOCKED: Input snapshot binding is incomplete',
        true
      );
    }

    // Check: content hash must match between input and preview
    if (inputSnapshotIdentity.contentHash !== previewSnapshotIdentity.contentHash) {
      return createBlockedResult(
        RealPromotionBlockCategory.SNAPSHOT,
        [
          'Snapshot content hash mismatch between input and dry-run preview',
          `Input: ${inputSnapshotIdentity.contentHash}`,
          `Preview: ${previewSnapshotIdentity.contentHash}`
        ],
        'BLOCKED: Snapshot identity has changed since dry-run',
        true
      );
    }

    // Check: ledger sequence must match between input and preview
    if (inputSnapshotIdentity.ledgerSequence !== previewSnapshotIdentity.ledgerSequence) {
      return createBlockedResult(
        RealPromotionBlockCategory.SNAPSHOT,
        [
          'Snapshot ledger sequence mismatch between input and dry-run preview',
          `Input: ${inputSnapshotIdentity.ledgerSequence}`,
          `Preview: ${previewSnapshotIdentity.ledgerSequence}`
        ],
        'BLOCKED: Ledger sequence has changed since dry-run',
        true
      );
    }

    // Check: latest applied event ID should match (if both present)
    if (
      inputSnapshotIdentity.latestAppliedEventId !== undefined &&
      previewSnapshotIdentity.latestAppliedEventId !== undefined &&
      inputSnapshotIdentity.latestAppliedEventId !== previewSnapshotIdentity.latestAppliedEventId
    ) {
      return createBlockedResult(
        RealPromotionBlockCategory.SNAPSHOT,
        [
          'Snapshot latest applied event ID mismatch between input and dry-run preview',
          `Input: ${inputSnapshotIdentity.latestAppliedEventId}`,
          `Preview: ${previewSnapshotIdentity.latestAppliedEventId}`
        ],
        'BLOCKED: Latest applied event has changed since dry-run',
        true
      );
    }

    // ==========================================================================
    // PHASE 4 — Payload verification (Task 5)
    // Verify dry-run preview payload is valid and has correct instruction
    // ==========================================================================

    // VERIFICATION 4: Payload presence and instruction
    const payload = preview.payload;
    if (!payload) {
      return createBlockedResult(
        RealPromotionBlockCategory.PAYLOAD,
        ['Dry-run preview is missing payload'],
        'BLOCKED: Dry-run preview has no payload',
        true
      );
    }

    // Check: payload instruction must be PROMOTION_INTENT
    if (payload.instruction !== 'PROMOTION_INTENT') {
      return createBlockedResult(
        RealPromotionBlockCategory.PAYLOAD,
        [
          'Dry-run preview payload has incorrect instruction',
          `Expected: PROMOTION_INTENT`,
          `Actual: ${payload.instruction}`
        ],
        'BLOCKED: Payload instruction is not PROMOTION_INTENT',
        true
      );
    }

    // Check: payload safety flags
    if (payload.forceAuditInvalidation !== true) {
      return createBlockedResult(
        RealPromotionBlockCategory.PAYLOAD,
        ['Payload does not require audit invalidation'],
        'BLOCKED: Payload violates audit invalidation requirement',
        true
      );
    }

    if (payload.maintainDeployLock !== true) {
      return createBlockedResult(
        RealPromotionBlockCategory.PAYLOAD,
        ['Payload does not maintain deploy lock'],
        'BLOCKED: Payload violates deploy lock requirement',
        true
      );
    }

    if (payload.backendPersistenceAllowed !== false) {
      return createBlockedResult(
        RealPromotionBlockCategory.PAYLOAD,
        ['Payload allows backend persistence'],
        'BLOCKED: Payload violates backend persistence prohibition',
        true
      );
    }

    if (payload.memoryOnly !== true) {
      return createBlockedResult(
        RealPromotionBlockCategory.PAYLOAD,
        ['Payload is not memory-only'],
        'BLOCKED: Payload violates memory-only requirement',
        true
      );
    }

    // --------------------------------------------------------------------------
    // PHASE 5 — Vault update step (Task 7) ← FIRST real mutation
    // Deep-clone session draft content and update canonical vault in React memory
    // --------------------------------------------------------------------------

    // GUARD 7: Verify vault update callback is provided
    if (!input.applyLocalVaultUpdate || typeof input.applyLocalVaultUpdate !== 'function') {
      return createBlockedResult(
        RealPromotionBlockCategory.VAULT_MUTATION,
        ['Vault update callback is missing or invalid'],
        'BLOCKED: Cannot perform vault update without callback',
        true
      );
    }

    // GUARD 8: Validate session draft content shape before clone
    // Verify it's a valid vault-shaped object: Record<string, { title: string; desc: string; ready: boolean }>
    if (typeof input.sessionDraftContent !== 'object' || input.sessionDraftContent === null) {
      return createBlockedResult(
        RealPromotionBlockCategory.PAYLOAD,
        ['Session draft content is not a valid object'],
        'BLOCKED: Invalid session draft content shape',
        true
      );
    }

    // Validate each language entry in session draft content
    for (const [lang, entry] of Object.entries(input.sessionDraftContent)) {
      if (typeof entry !== 'object' || entry === null) {
        return createBlockedResult(
          RealPromotionBlockCategory.PAYLOAD,
          [`Session draft content for language "${lang}" is not a valid object`],
          'BLOCKED: Invalid session draft content shape',
          true
        );
      }
      if (typeof entry.title !== 'string') {
        return createBlockedResult(
          RealPromotionBlockCategory.PAYLOAD,
          [`Session draft content for language "${lang}" has invalid title (expected string)`],
          'BLOCKED: Invalid session draft content shape',
          true
        );
      }
      if (typeof entry.desc !== 'string') {
        return createBlockedResult(
          RealPromotionBlockCategory.PAYLOAD,
          [`Session draft content for language "${lang}" has invalid desc (expected string)`],
          'BLOCKED: Invalid session draft content shape',
          true
        );
      }
      if (typeof entry.ready !== 'boolean') {
        return createBlockedResult(
          RealPromotionBlockCategory.PAYLOAD,
          [`Session draft content for language "${lang}" has invalid ready flag (expected boolean)`],
          'BLOCKED: Invalid session draft content shape',
          true
        );
      }
    }

    // Deep-clone session draft content before vault update
    // Use structuredClone if available (modern browsers), otherwise JSON fallback
    let clonedPromotedContent: Record<string, { title: string; desc: string; ready: boolean }>;
    try {
      if (typeof structuredClone === 'function') {
        clonedPromotedContent = structuredClone(input.sessionDraftContent);
      } else {
        // Fallback: JSON clone (safe for plain objects)
        clonedPromotedContent = JSON.parse(JSON.stringify(input.sessionDraftContent));
      }
    } catch (cloneError) {
      return createBlockedResult(
        RealPromotionBlockCategory.VAULT_MUTATION,
        [
          'Failed to deep-clone session draft content',
          `Clone error: ${cloneError instanceof Error ? cloneError.message : String(cloneError)}`
        ],
        'BLOCKED: Content cloning failed before vault update',
        true
      );
    }

    // Snapshot vault state before mutation (for rollback in future phases)
    const vaultSnapshot = typeof structuredClone === 'function'
      ? structuredClone(input.currentVault)
      : JSON.parse(JSON.stringify(input.currentVault));

    // Execute vault update with structured result handling
    let vaultUpdateResult: { success: boolean; error?: string };
    try {
      vaultUpdateResult = input.applyLocalVaultUpdate(clonedPromotedContent);
    } catch (vaultUpdateError) {
      return createBlockedResult(
        RealPromotionBlockCategory.VAULT_MUTATION,
        [
          'Vault update callback threw exception',
          `Error: ${vaultUpdateError instanceof Error ? vaultUpdateError.message : String(vaultUpdateError)}`
        ],
        'BLOCKED: Vault update failed - no mutations performed',
        true
      );
    }

    // Validate vault update result
    if (!vaultUpdateResult || typeof vaultUpdateResult.success !== 'boolean') {
      return createBlockedResult(
        RealPromotionBlockCategory.VAULT_MUTATION,
        ['Vault update callback returned invalid result (missing success field)'],
        'BLOCKED: Vault update callback contract violation',
        true
      );
    }

    if (!vaultUpdateResult.success) {
      return createBlockedResult(
        RealPromotionBlockCategory.VAULT_MUTATION,
        [
          'Vault update callback reported failure',
          vaultUpdateResult.error || 'No error message provided'
        ],
        'BLOCKED: Vault update failed - no mutations performed',
        true
      );
    }

    // --------------------------------------------------------------------------
    // PHASE 6 — Canonical audit invalidation (Task 8) ← SECOND real mutation
    // Invalidate canonical/global audit in React memory immediately after vault update
    // --------------------------------------------------------------------------

    // GUARD 9: Verify audit invalidation callback is provided
    if (!input.invalidateCanonicalAudit || typeof input.invalidateCanonicalAudit !== 'function') {
      return createBlockedResult(
        RealPromotionBlockCategory.AUDIT_INVALIDATION,
        [
          'Audit invalidation callback is missing or invalid',
          'CRITICAL: Vault has already been updated',
          'Session draft was not cleared',
          'Deploy must remain locked',
          'Manual intervention required to verify audit state and vault consistency'
        ],
        'BLOCKED: Cannot invalidate audit without callback - vault already mutated',
        true
      );
    }

    // Execute canonical audit invalidation with structured result handling
    const invalidatedAt = new Date().toISOString();
    let auditInvalidationResult: { success: boolean; error?: string };
    try {
      auditInvalidationResult = input.invalidateCanonicalAudit();
    } catch (auditInvalidationError) {
      return createBlockedResult(
        RealPromotionBlockCategory.AUDIT_INVALIDATION,
        [
          'Audit invalidation callback threw exception',
          `Error: ${auditInvalidationError instanceof Error ? auditInvalidationError.message : String(auditInvalidationError)}`,
          'CRITICAL: Vault has already been updated',
          'Session draft was not cleared',
          'Deploy must remain locked',
          'Manual intervention required to verify audit state and vault consistency'
        ],
        'BLOCKED: Audit invalidation failed - vault already mutated',
        true
      );
    }

    // Validate audit invalidation result
    if (!auditInvalidationResult || typeof auditInvalidationResult.success !== 'boolean') {
      return createBlockedResult(
        RealPromotionBlockCategory.AUDIT_INVALIDATION,
        [
          'Audit invalidation callback returned invalid result (missing success field)',
          'CRITICAL: Vault has already been updated',
          'Session draft was not cleared',
          'Deploy must remain locked',
          'Manual intervention required to verify audit state and vault consistency'
        ],
        'BLOCKED: Audit invalidation callback contract violation - vault already mutated',
        true
      );
    }

    if (!auditInvalidationResult.success) {
      return createBlockedResult(
        RealPromotionBlockCategory.AUDIT_INVALIDATION,
        [
          'Audit invalidation callback reported failure',
          auditInvalidationResult.error || 'No error message provided',
          'CRITICAL: Vault has already been updated',
          'Session draft was not cleared',
          'Deploy must remain locked',
          'Manual intervention required to verify audit state and vault consistency'
        ],
        'BLOCKED: Audit invalidation failed - vault already mutated',
        true
      );
    }

    // --------------------------------------------------------------------------
    // PHASE 7 — Derived preview/audit state clear (Task 9)
    // Clear ONLY stale page-level derived state:
    // - transformedArticle (page-level derived state)
    // - transformError (page-level derived state)
    // - auditResult (page-level active audit result, NOT globalAudit or sessionAuditResult)
    // 
    // CRITICAL - Does NOT clear:
    // - sessionAuditResult (session state, preserved until Task 10)
    // - promotionDryRunResult (preserved for traceability)
    // - globalAudit (already invalidated in Task 8)
    // - localDraftCopy (session draft, preserved until Task 10)
    // - sessionRemediationLedger (session state, preserved until Task 10)
    // - vault (already updated in Task 7)
    // 
    // This is FAIL-SOFT: warnings logged but execution continues on failure
    // --------------------------------------------------------------------------

    let derivedStateCleared = false;
    let derivedStateClearWarning: string | null = null;

    // Check if callback is provided (optional for Task 9)
    if (input.clearDerivedPromotionState && typeof input.clearDerivedPromotionState === 'function') {
      try {
        const derivedClearResult = input.clearDerivedPromotionState();
        
        // Validate result structure
        if (!derivedClearResult || typeof derivedClearResult.success !== 'boolean') {
          derivedStateClearWarning = 'Derived state clear callback returned invalid result (missing success field)';
          console.warn('[TASK 9] Derived state clear callback contract violation:', derivedStateClearWarning);
        } else if (!derivedClearResult.success) {
          derivedStateClearWarning = derivedClearResult.error || 'Derived state clear callback reported failure';
          console.warn('[TASK 9] Derived state clear failed:', derivedStateClearWarning);
        } else {
          // Success - page-level derived state cleared (transformedArticle, transformError, auditResult)
          derivedStateCleared = true;
        }
      } catch (derivedClearError) {
        derivedStateClearWarning = derivedClearError instanceof Error 
          ? derivedClearError.message 
          : String(derivedClearError);
        console.warn('[TASK 9] Derived state clear callback threw exception:', derivedStateClearWarning);
      }
    } else {
      // Callback not provided - this is acceptable for Task 9 (optional callback)
      derivedStateClearWarning = 'Derived state clear callback not provided (optional)';
      console.warn('[TASK 9] Derived state clear callback missing:', derivedStateClearWarning);
    }

    // IMPORTANT: Continue execution even if derived state clear failed
    // This is a non-critical operation - vault and audit are already updated
    // Session state (sessionAuditResult, promotionDryRunResult) is preserved

    // --------------------------------------------------------------------------
    // PHASE 8 — Session draft clear step (Task 10)
    // Archive session evidence BEFORE clearing session draft
    // --------------------------------------------------------------------------

    // GUARD 10: Verify finalization callback is provided
    if (!input.finalizePromotionSession || typeof input.finalizePromotionSession !== 'function') {
      return createBlockedResult(
        RealPromotionBlockCategory.SESSION_CLEAR,
        [
          'Session finalization callback is missing or invalid',
          'CRITICAL: Vault has already been updated',
          'CRITICAL: Canonical audit has already been invalidated',
          'CRITICAL: Derived state clear was attempted',
          'Session draft was NOT cleared',
          'Deploy must remain locked',
          'Manual intervention required to clear session draft and verify state consistency'
        ],
        'BLOCKED: Cannot finalize session without callback - vault and audit already mutated',
        true
      );
    }

    // Execute session finalization (archive + clear)
    let finalizationResult: { success: boolean; error?: string; finalizationSummary?: any; sessionCleared?: boolean };
    try {
      finalizationResult = input.finalizePromotionSession();
    } catch (finalizationError) {
      return createBlockedResult(
        RealPromotionBlockCategory.SESSION_CLEAR,
        [
          'Session finalization callback threw exception',
          `Error: ${finalizationError instanceof Error ? finalizationError.message : String(finalizationError)}`,
          'CRITICAL: Vault has already been updated',
          'CRITICAL: Canonical audit has already been invalidated',
          'CRITICAL: Derived state clear was attempted',
          'Session draft was NOT cleared',
          'Deploy must remain locked',
          'Manual intervention required to clear session draft and verify state consistency'
        ],
        'BLOCKED: Session finalization failed - vault and audit already mutated',
        true
      );
    }

    // Validate finalization result
    if (!finalizationResult || typeof finalizationResult.success !== 'boolean') {
      return createBlockedResult(
        RealPromotionBlockCategory.SESSION_CLEAR,
        [
          'Session finalization callback returned invalid result (missing success field)',
          'CRITICAL: Vault has already been updated',
          'CRITICAL: Canonical audit has already been invalidated',
          'CRITICAL: Derived state clear was attempted',
          'Session draft was NOT cleared',
          'Deploy must remain locked',
          'Manual intervention required to clear session draft and verify state consistency'
        ],
        'BLOCKED: Session finalization callback contract violation - vault and audit already mutated',
        true
      );
    }

    if (!finalizationResult.success) {
      return createBlockedResult(
        RealPromotionBlockCategory.SESSION_CLEAR,
        [
          'Session finalization callback reported failure',
          finalizationResult.error || 'No error message provided',
          'CRITICAL: Vault has already been updated',
          'CRITICAL: Canonical audit has already been invalidated',
          'CRITICAL: Derived state clear was attempted',
          'Session draft was NOT cleared',
          'Deploy must remain locked',
          'Manual intervention required to clear session draft and verify state consistency'
        ],
        'BLOCKED: Session finalization failed - vault and audit already mutated',
        true
      );
    }

    // --------------------------------------------------------------------------
    // SUCCESS RESULT (TASK 7+8+9+10 COMPLETION)
    // Vault updated, audit invalidated, derived state cleared (or warned), session draft cleared
    // --------------------------------------------------------------------------

    const executionId = `real_promo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const promotedLanguages = Object.keys(clonedPromotedContent);
    const languageCount = promotedLanguages.length;

    return createSuccessResult({
      executionId,
      newVault: clonedPromotedContent,
      vaultSnapshot,
      languageCount,
      promotedLanguages,
      snapshotIdentity: {
        contentHash: input.snapshotBinding.snapshotIdentity!.contentHash,
        ledgerSequence: input.snapshotBinding.snapshotIdentity!.ledgerSequence,
        latestAppliedEventId: input.snapshotBinding.snapshotIdentity!.latestAppliedEventId || null,
        timestamp: input.snapshotBinding.snapshotIdentity!.timestamp
      },
      invalidatedAt,
      derivedStateCleared, // Task 9 complete (or warned)
      derivedStateClearWarning: derivedStateClearWarning || undefined,
      sessionDraftCleared: true, // Task 10 complete
      clearedAt: new Date().toISOString(), // Task 10 complete
      finalizationSummary: finalizationResult.finalizationSummary, // Task 10 archive
      archiveCreated: true // Task 10 archive created
    });

  } finally {
    // Always release the execution lock — success, failure, or exception
    _realPromotionExecutionLock = false;
  }
}
