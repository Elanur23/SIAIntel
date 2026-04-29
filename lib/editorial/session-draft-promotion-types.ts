/**
 * Session Draft Promotion Gate - Type Contracts
 *
 * This module defines type-only contracts for the Session Draft Promotion Gate.
 * It contains NO runtime logic, NO state mutations, NO API calls.
 *
 * CRITICAL SAFETY RULES:
 * - Promotion requires explicit operator action (not automatic)
 * - Passing session audit does NOT auto-promote
 * - Passing session audit does NOT unlock deploy
 * - Promotion does NOT overwrite canonical audit as valid
 * - Promotion invalidates canonical audit
 * - Deploy remains locked after promotion
 * - Promotion creates clear audit trail
 * - Promotion requires snapshot identity match
 * - Promotion fails closed on stale/missing/failed audit
 * - Promotion preserves rollback/audit context
 */

import type {
  SnapshotIdentity,
  SessionAuditResult,
  SessionAuditLifecycle
} from './remediation-apply-types';

/**
 * Reasons why promotion to canonical vault is blocked.
 * Each reason corresponds to a failed precondition check.
 */
export enum PromotionBlockReason {
  /** Session draft does not exist */
  NO_SESSION_DRAFT = 'NO_SESSION_DRAFT',
  
  /** Session audit has not been run */
  AUDIT_NOT_RUN = 'AUDIT_NOT_RUN',
  
  /** Session audit failed (Global Audit or Panda Check) */
  AUDIT_FAILED = 'AUDIT_FAILED',
  
  /** Session audit result is stale (snapshot identity mismatch) */
  AUDIT_STALE = 'AUDIT_STALE',
  
  /** Global Audit did not pass */
  GLOBAL_AUDIT_FAILED = 'GLOBAL_AUDIT_FAILED',
  
  /** Panda Check did not pass */
  PANDA_CHECK_FAILED = 'PANDA_CHECK_FAILED',
  
  /** Snapshot identity does not match between audit and current draft */
  SNAPSHOT_MISMATCH = 'SNAPSHOT_MISMATCH',
  
  /** Transform to article failed or has error */
  TRANSFORM_ERROR = 'TRANSFORM_ERROR',
  
  /** No article is selected in warroom */
  NO_ARTICLE_SELECTED = 'NO_ARTICLE_SELECTED',
  
  /** Local draft copy is missing or invalid */
  LOCAL_DRAFT_INVALID = 'LOCAL_DRAFT_INVALID',
  
  /** Panda structural errors exist */
  PANDA_STRUCTURAL_ERRORS = 'PANDA_STRUCTURAL_ERRORS',
  
  /** Operator acknowledgement not provided */
  ACKNOWLEDGEMENT_MISSING = 'ACKNOWLEDGEMENT_MISSING'
}

/**
 * Operator acknowledgement state for promotion confirmation.
 * Requires explicit human sign-off before promotion can proceed.
 */
export interface OperatorAcknowledgementState {
  /** Operator acknowledges promotion will replace canonical vault */
  vaultReplacementAcknowledged: boolean;
  
  /** Operator acknowledges canonical audit will be invalidated */
  auditInvalidationAcknowledged: boolean;
  
  /** Operator acknowledges deploy will remain locked */
  deployLockAcknowledged: boolean;
  
  /** Operator acknowledges full protocol re-audit is required */
  reAuditRequiredAcknowledged: boolean;
  
  /** Timestamp when acknowledgements were provided */
  acknowledgedAt?: string;
  
  /** Operator ID who provided acknowledgements */
  operatorId?: string;
}

/**
 * Binds a precondition check to an immutable snapshot identity.
 * Ensures precondition results are tied to a specific draft state.
 */
export interface PromotionSnapshotBinding {
  /** Snapshot identity at time of precondition check */
  snapshotIdentity: SnapshotIdentity;
  
  /** Timestamp when precondition check was performed */
  checkedAt: string;
  
  /** Whether preconditions were met at this snapshot */
  preconditionsMet: boolean;
  
  /** Block reasons if preconditions not met */
  blockReasons: PromotionBlockReason[];
}

/**
 * Result of promotion precondition validation.
 * Contains detailed information about which preconditions passed/failed.
 */
export interface PromotionPreconditionResult {
  /** Whether promotion is allowed to proceed */
  canPromote: boolean;
  
  /** Reasons why promotion is blocked (empty if canPromote is true) */
  blockReasons: PromotionBlockReason[];
  
  /** Detailed precondition check results */
  preconditions: {
    sessionDraftExists: boolean;
    auditRun: boolean;
    auditPassed: boolean;
    auditNotStale: boolean;
    globalAuditPassed: boolean;
    pandaCheckPassed: boolean;
    snapshotIdentityMatches: boolean;
    noTransformError: boolean;
    articleSelected: boolean;
    localDraftValid: boolean;
  };
  
  /** Snapshot binding for this precondition check */
  snapshotBinding: PromotionSnapshotBinding;
  
  /** Operator acknowledgement state */
  acknowledgement: OperatorAcknowledgementState;
  
  /** Hard-coded safety invariants */
  readonly memoryOnly: true;
  readonly deployUnlockAllowed: false;
  readonly canonicalAuditOverwriteAllowed: false;
  readonly automaticPromotionAllowed: false;
}

/**
 * Audit trail event for a session draft promotion.
 * Records all metadata about the promotion for rollback and audit purposes.
 */
export interface PromotionEvent {
  /** Unique identifier for this promotion event */
  promotionId: string;
  
  /** Article ID being promoted */
  articleId: string;
  
  /** Package ID being promoted */
  packageId: string;
  
  /** Snapshot identity at time of promotion */
  snapshotIdentity: SnapshotIdentity;
  
  /** Session audit result that validated the promotion */
  sessionAuditResult: SessionAuditResult;
  
  /** Number of languages promoted */
  languageCount: number;
  
  /** Languages promoted (e.g., ['en', 'es', 'fr']) */
  promotedLanguages: string[];
  
  /** Number of remediations applied in session */
  remediationCount: number;
  
  /** Ledger sequence at time of promotion */
  ledgerSequence: number;
  
  /** Latest applied event ID from ledger */
  latestAppliedEventId: string | null;
  
  /** Canonical vault snapshot before promotion (for rollback) */
  canonicalVaultSnapshot: Record<string, any>;
  
  /** Operator who performed the promotion */
  operatorId: string;
  
  /** Operator acknowledgement state */
  acknowledgement: OperatorAcknowledgementState;
  
  /** Timestamp when promotion occurred */
  promotedAt: string;
  
  /** Hard-coded safety assertions */
  readonly auditInvalidated: true;
  readonly reAuditRequired: true;
  readonly deployBlocked: true;
  readonly sessionOnly: false;
  readonly canonicalMutated: true;
  readonly noBackendPersistence: true;
}

/**
 * Result of a promotion attempt.
 * Discriminated union for success/failure states.
 */
export type PromotionResult =
  | {
      success: true;
      promotionEvent: PromotionEvent;
      newVault: Record<string, any>;
      message: string;
    }
  | {
      success: false;
      blockReasons: PromotionBlockReason[];
      message: string;
    };

/**
 * Summary data for promotion UI display.
 * Provides human-readable context about the promotion.
 */
export interface PromotionSummary {
  /** Number of languages in session draft */
  languageCount: number;
  
  /** Number of remediations applied in session */
  remediationCount: number;
  
  /** Global Audit score (0-100) */
  auditScore: number;
  
  /** Snapshot content hash (first 8 chars for display) */
  snapshotHash: string;
  
  /** Ledger sequence number */
  ledgerSequence: number;
  
  /** Session audit lifecycle status */
  auditLifecycle: SessionAuditLifecycle;
  
  /** Whether Panda Check passed */
  pandaCheckPassed: boolean;
  
  /** Whether Global Audit passed */
  globalAuditPassed: boolean;
}

/**
 * Type guard to check if a promotion result is successful.
 */
export function isPromotionSuccess(result: PromotionResult): result is Extract<PromotionResult, { success: true }> {
  return result.success === true;
}

/**
 * Type guard to check if a promotion result is blocked.
 */
export function isPromotionBlocked(result: PromotionResult): result is Extract<PromotionResult, { success: false }> {
  return result.success === false;
}

/**
 * Type guard to check if all operator acknowledgements are provided.
 */
export function hasAllAcknowledgements(ack: OperatorAcknowledgementState): boolean {
  return (
    ack.vaultReplacementAcknowledged &&
    ack.auditInvalidationAcknowledged &&
    ack.deployLockAcknowledged &&
    ack.reAuditRequiredAcknowledged
  );
}

/**
 * Type guard to check if precondition result allows promotion.
 */
export function canProceedWithPromotion(result: PromotionPreconditionResult): boolean {
  return result.canPromote && hasAllAcknowledgements(result.acknowledgement);
}

// ============================================================================
// SAFETY ASSERTION CONSTANTS
// ============================================================================

/**
 * Hard-coded safety invariants for promotion events.
 * These values must NEVER be changed at runtime.
 */
export const PROMOTION_SAFETY_INVARIANTS = {
  AUDIT_INVALIDATED: true as const,
  RE_AUDIT_REQUIRED: true as const,
  DEPLOY_BLOCKED: true as const,
  SESSION_ONLY: false as const,
  CANONICAL_MUTATED: true as const,
  NO_BACKEND_PERSISTENCE: true as const,
  MEMORY_ONLY: true as const,
  DEPLOY_UNLOCK_ALLOWED: false as const,
  CANONICAL_AUDIT_OVERWRITE_ALLOWED: false as const,
  AUTOMATIC_PROMOTION_ALLOWED: false as const
} as const;

/**
 * Human-readable acknowledgement text for UI display.
 */
export const PROMOTION_ACKNOWLEDGEMENT_TEXT = {
  VAULT_REPLACEMENT: "I understand this will replace the canonical vault with the session draft.",
  AUDIT_INVALIDATION: "I understand this will invalidate the canonical audit and require full re-audit.",
  DEPLOY_LOCK: "I understand deploy will remain locked until canonical re-audit passes.",
  RE_AUDIT_REQUIRED: "I understand I must run full protocol re-audit before deploy."
} as const;

/**
 * Forbidden wording for promotion UI.
 * These phrases must NEVER appear in promotion-related UI.
 */
export const FORBIDDEN_PROMOTION_WORDING = [
  "Auto-Promote",
  "Promote & Deploy",
  "Unlock Deploy",
  "Make Ready",
  "Verified Promotion",
  "Safe to Deploy",
  "Audit Passed",
  "Deploy Ready"
] as const;

/**
 * Pure helper to detect forbidden terminology in promotion UI text.
 */
export function containsForbiddenPromotionWording(text: string): boolean {
  const normalized = text.toLowerCase();
  return FORBIDDEN_PROMOTION_WORDING.some(word => normalized.includes(word.toLowerCase()));
}
