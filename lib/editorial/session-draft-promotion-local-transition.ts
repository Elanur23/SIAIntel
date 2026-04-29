/**
 * Session Draft Promotion Gate - Pure Transition Plan Helper
 *
 * This module implements a pure helper to compute the promotion transition plan.
 * It combines precondition validation and payload construction into a single
 * read-only analysis of what WOULD happen if promotion were executed.
 *
 * CRITICAL SAFETY RULES:
 * - NO side effects
 * - NO mutations
 * - NO I/O
 * - Read-only analysis of state
 * - Fail-closed: return blocked transition plan for ANY uncertainty
 */

import {
  PromotionPreconditionResult,
  PromotionBlockReason,
  OperatorAcknowledgementState
} from './session-draft-promotion-types';
import {
  checkPromotionPreconditions,
  PreconditionCheckInput
} from './session-draft-promotion-preconditions';
import {
  buildPromotionPayload,
  BuildPromotionPayloadInput,
  SessionDraftPromotionPayload,
  PromotionPayloadBuildResult
} from './session-draft-promotion-payload';

/**
 * Result of the transition plan computation.
 */
export interface PromotionTransitionPlan {
  /** Results of all precondition checks */
  precondition: PromotionPreconditionResult;

  /** Payload preview if preconditions met (null if blocked) */
  payload: SessionDraftPromotionPayload | null;

  /** Whether the complete transition plan is valid and ready for review */
  isValid: boolean;

  /** Reasons why the transition plan is blocked */
  blockReasons: PromotionBlockReason[];

  /** Human-readable summary of the transition */
  summary: string;
}

/**
 * Pure helper to compute the complete transition plan for session draft promotion.
 *
 * This function takes the current state and returns an object describing
 * exactly what would happen if promotion were to be executed, including
 * all safety checks and payload previews.
 *
 * @param input - All inputs required for precondition check and payload building
 * @returns Complete transition plan
 */
export function computePromotionTransitionPlan(
  input: PreconditionCheckInput & Omit<BuildPromotionPayloadInput, 'precondition' | 'snapshot' | 'operator'>
): PromotionTransitionPlan {
  // 1. Check Preconditions
  const precondition = checkPromotionPreconditions(input);

  // 2. Build Payload if preconditions met
  let payload: SessionDraftPromotionPayload | null = null;
  let payloadResult: PromotionPayloadBuildResult | null = null;

  if (precondition.canPromote) {
    const payloadInput: BuildPromotionPayloadInput = {
      precondition,
      snapshot: precondition.snapshotBinding,
      localDraftCopy: input.localDraftCopy,
      canonicalVaultSnapshot: input.canonicalVaultSnapshot,
      operator: {
        acknowledgementState: input.acknowledgement,
        operatorId: input.acknowledgement.operatorId
      },
      sessionRemediationLedger: input.sessionRemediationLedger,
      requestedAt: new Date().toISOString()
    };

    payloadResult = buildPromotionPayload(payloadInput);
    if (payloadResult.success) {
      payload = payloadResult.payload;
    }
  }

  // 3. Assemble Plan
  const blockReasons = [...precondition.blockReasons];
  if (payloadResult && !payloadResult.success) {
    blockReasons.push(...payloadResult.blockedReasons);
  }

  // Deduplicate block reasons
  const uniqueBlockReasons = Array.from(new Set(blockReasons)) as PromotionBlockReason[];

  const isValid = precondition.canPromote && payload !== null;

  let summary = '';
  if (isValid && payload) {
    summary = `Ready to promote ${payload.diff.changeCount} changes from session draft to canonical vault.`;
  } else if (uniqueBlockReasons.length > 0) {
    summary = `Promotion blocked: ${uniqueBlockReasons.length} issue(s) found.`;
  } else {
    summary = 'Promotion transition plan initialized - checks pending.';
  }

  return {
    precondition,
    payload,
    isValid,
    blockReasons: uniqueBlockReasons,
    summary
  };
}
