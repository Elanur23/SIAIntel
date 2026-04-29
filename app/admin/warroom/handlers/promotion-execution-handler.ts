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
