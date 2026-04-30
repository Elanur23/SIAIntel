/**
 * Task 6B-2B: Real Local Promotion Execution - Type Definitions
 *
 * This module extends session-draft-promotion-types.ts with types specific to
 * real local promotion execution (Task 6B-2B).
 *
 * CRITICAL SAFETY RULES:
 * - Memory-only operations (no backend persistence)
 * - Deploy remains locked after promotion
 * - Canonical audit must be invalidated
 * - Mutation sequence: vault → audit → preview → session
 * - Fail-closed design (any failure prevents all mutations)
 * - No concurrent execution allowed
 */

import type {
  PromotionPreconditionResult,
  PromotionSnapshotBinding,
  OperatorAcknowledgementState
} from './session-draft-promotion-types';
import type {
  LocalPromotionDryRunPreview
} from '../../app/admin/warroom/handlers/promotion-execution-handler';

/**
 * Structured result type for local mutation callbacks.
 * Used by vault update and audit invalidation callbacks to report success/failure.
 */
export type LocalMutationCallbackResult = {
  success: boolean;
  error?: string;
};

/**
 * Promotion finalization summary - Archive of session evidence before clear.
 * TASK 10: Archive-Before-Clear design
 * 
 * This summary preserves traceability of what was promoted and cleared.
 * Created BEFORE calling clearLocalDraftSession to ensure evidence is not lost.
 */
export interface PromotionFinalizationSummary {
  /** Unique archive identifier */
  archiveId: string;
  
  /** Timestamp when archive was created */
  archivedAt: string;
  
  /** Timestamp when finalization completed (after session clear) */
  finalizedAt?: string;
  
  /** Execution ID from the promotion that triggered this finalization */
  executionId: string;
  
  /** Operator ID who performed the promotion */
  operatorId: string;
  
  /** Languages that were promoted */
  promotedLanguages: string[];
  
  /** Count of promoted languages */
  promotedLanguageCount: number;
  
  /** Whether local draft was present at archive time */
  localDraftWasPresent: boolean;
  
  /** Number of remediation events in the ledger */
  archivedLedgerLength: number;
  
  /** Whether session audit result was present */
  archivedSessionAuditPresent: boolean;
  
  /** Session audit lifecycle state at archive time */
  archivedSessionAuditLifecycle?: string;
  
  /** Whether session audit invalidation was present */
  archivedSessionAuditInvalidationPresent: boolean;
  
  /** Whether latest rollback event was present */
  archivedLatestRollbackEventPresent: boolean;
  
  /** Snapshot identity at archive time (if available) */
  archivedSnapshotIdentity?: unknown;
  
  /** Hard-coded safety invariants */
  readonly memoryOnly: true;
  readonly backendPersistencePerformed: false;
  readonly deployRemainedLocked: true;
  readonly rollbackImplemented: false;
}

/**
 * Result of promotion finalization callback.
 * TASK 10: Returned by finalizePromotionSession callback
 */
export interface PromotionFinalizationCallbackResult {
  /** Whether finalization succeeded */
  success: boolean;
  
  /** Error message if finalization failed */
  error?: string;
  
  /** Finalization summary (archive + clear confirmation) */
  finalizationSummary?: PromotionFinalizationSummary;
  
  /** Whether session draft was cleared */
  sessionCleared?: boolean;
}

/**
 * Categories of blocks that can prevent real promotion execution.
 * Used for detailed error reporting and debugging.
 */
export enum RealPromotionBlockCategory {
  /** Precondition check failed (audit not passed, snapshot stale, etc.) */
  PRECONDITION = 'PRECONDITION',
  
  /** Dry-run verification failed or missing */
  DRY_RUN = 'DRY_RUN',
  
  /** Snapshot identity mismatch or staleness */
  SNAPSHOT = 'SNAPSHOT',
  
  /** Vault mutation phase failed */
  VAULT_MUTATION = 'VAULT_MUTATION',
  
  /** Audit invalidation phase failed */
  AUDIT_INVALIDATION = 'AUDIT_INVALIDATION',
  
  /** Session clear phase failed */
  SESSION_CLEAR = 'SESSION_CLEAR',
  
  /** Execution lock unavailable (concurrent execution attempt) */
  EXECUTION_LOCK = 'EXECUTION_LOCK',
  
  /** Operator acknowledgement missing or invalid */
  ACKNOWLEDGEMENT = 'ACKNOWLEDGEMENT',
  
  /** Payload missing or invalid */
  PAYLOAD = 'PAYLOAD',

  /**
   * Scaffold sentinel: this execution phase has not been implemented yet.
   * Any call to executeRealLocalPromotion returns this category until
   * Tasks 4-10 wire the real mutation sequence.
   * MUST be removed once all phases are implemented.
   */
  UNIMPLEMENTED_PHASE = 'UNIMPLEMENTED_PHASE'
}

/**
 * Input for real local promotion execution.
 * Contains all data required to execute a real promotion with mutations.
 */
export interface RealPromotionExecutionInput {
  /** Dry-run preview that must have succeeded */
  dryRunPreview: LocalPromotionDryRunPreview;
  
  /** Current precondition result (re-verified before execution) */
  precondition: PromotionPreconditionResult;
  
  /** Current snapshot binding (re-verified before execution) */
  snapshotBinding: PromotionSnapshotBinding;
  
  /** Session draft content to promote (LocalDraft shape) */
  sessionDraftContent: Record<string, { title: string; desc: string; ready: boolean }>;
  
  /** Current canonical vault state before promotion */
  currentVault: Record<string, { title: string; desc: string; ready: boolean }>;
  
  /** Operator acknowledgement state */
  acknowledgement: OperatorAcknowledgementState;
  
  /** Operator ID performing the promotion */
  operatorId: string;
  
  /** Article ID being promoted */
  articleId: string;
  
  /** Package ID being promoted */
  packageId: string;
  
  /** Timestamp of execution request */
  requestedAt: string;
  
  /**
   * Injected callback to apply local vault update in React memory.
   * TASK 7: Local canonical vault update
   * 
   * This callback receives the cloned promoted vault content and performs
   * the local React-memory vault update. It must be a pure state setter
   * with no side effects, no backend calls, no persistence.
   * 
   * @param promotedVaultContent - Deep-cloned session draft content to promote
   * @returns Result indicating success or failure with optional error message
   */
  applyLocalVaultUpdate: (
    promotedVaultContent: Record<string, { title: string; desc: string; ready: boolean }>
  ) => LocalMutationCallbackResult;
  
  /**
   * Injected callback to invalidate canonical/global audit in React memory.
   * TASK 8: Canonical audit invalidation
   * 
   * This callback invalidates the canonical and global audit state in React
   * memory, forcing re-audit before deploy. It must be a pure state setter
   * with no side effects, no backend calls, no persistence.
   * 
   * Must be called immediately after successful vault update.
   * Must keep deploy locked.
   * Must force re-audit required.
   * 
   * @returns Result indicating success or failure with optional error message
   */
  invalidateCanonicalAudit: () => LocalMutationCallbackResult;
  
  /**
   * Injected callback to clear derived preview/audit state in React memory.
   * TASK 9: Derived preview and audit state clearing
   * 
   * This callback clears ONLY the following stale derived state in React memory:
   * - transformedArticle (page-level derived state)
   * - transformError (page-level derived state)
   * - auditResult (page-level active audit result, NOT globalAudit or sessionAuditResult)
   * 
   * It must be a pure state setter with no side effects, no backend calls, no persistence.
   * 
   * This is a fail-soft operation: if it fails, execution continues with a warning.
   * 
   * Must be called after successful audit invalidation.
   * 
   * CRITICAL - Must NOT clear:
   * - globalAudit (already invalidated in Task 8)
   * - sessionAuditResult (session state, preserved until Task 10)
   * - promotionDryRunResult (preserved for traceability)
   * - localDraftCopy (session draft, preserved until Task 10)
   * - sessionRemediationLedger (session state, preserved until Task 10)
   * - vault (already updated in Task 7)
   * 
   * @returns Result indicating success or failure with optional error message
   */
  clearDerivedPromotionState?: () => LocalMutationCallbackResult;
  
  /**
   * Injected callback to finalize promotion session (archive + clear).
   * TASK 10: Session draft clear with archive-before-clear design
   * 
   * This callback performs the following sequence:
   * 1. Archive session evidence (ledger, audit, snapshot identity)
   * 2. Clear session draft state (localDraftCopy, sessionRemediationLedger, etc.)
   * 3. Return finalization summary with archive and clear confirmation
   * 
   * It must be called AFTER vault update and audit invalidation succeed.
   * It must preserve traceability by archiving before clearing.
   * 
   * CRITICAL - Must clear:
   * - localDraftCopy (session draft content)
   * - sessionRemediationLedger (remediation history)
   * - latestRollbackEvent (rollback state)
   * - sessionAuditInvalidation (audit invalidation state)
   * - sessionAuditResult (session audit result)
   * - sessionAuditLifecycle (session audit lifecycle)
   * 
   * CRITICAL - Must NOT:
   * - Mutate canonical vault (already updated in Task 7)
   * - Mutate globalAudit (already invalidated in Task 8)
   * - Call backend/API/database/provider
   * - Persist to localStorage/sessionStorage
   * - Unlock deploy
   * - Copy session audit into canonical audit
   * - Auto-run canonical re-audit
   * 
   * @returns Result with finalization summary or error
   */
  finalizePromotionSession?: () => PromotionFinalizationCallbackResult;
  
  /** Execution options */
  options?: {
    /** Whether to skip dry-run re-verification (NOT RECOMMENDED) */
    skipDryRunReVerification?: boolean;
    
    /** Whether to skip snapshot freshness check (NOT RECOMMENDED) */
    skipSnapshotFreshnessCheck?: boolean;
  };
}

/**
 * Successful result of real local promotion execution.
 * Contains all mutation results and audit trail data.
 * 
 * TASK 7+8 STATE: Vault updated, audit invalidated, session draft NOT cleared yet.
 * Session draft clear is deferred to Task 10.
 */
export interface RealPromotionExecutionSuccess {
  success: true;
  
  /** Unique execution ID for audit trail */
  executionId: string;
  
  /** Timestamp when execution completed */
  executedAt: string;
  
  /** New vault state after promotion */
  newVault: Record<string, { title: string; desc: string; ready: boolean }>;
  
  /** Snapshot of vault state before promotion (for rollback) */
  vaultSnapshot: Record<string, { title: string; desc: string; ready: boolean }>;
  
  /** Number of languages promoted */
  languageCount: number;
  
  /** Languages that were promoted */
  promotedLanguages: string[];
  
  /** Snapshot identity at time of execution */
  snapshotIdentity: {
    contentHash: string;
    ledgerSequence: number;
    latestAppliedEventId: string | null;
    timestamp: string;
  };
  
  /** Audit invalidation confirmation (TASK 8) */
  auditInvalidation: {
    canonicalAuditInvalidated: true;
    globalAuditInvalidated: true;
    invalidatedAt: string;
  };
  
  /** Derived state clear confirmation (TASK 9) */
  derivedStateClear: {
    derivedStateCleared: boolean; // True if Task 9 succeeded, false if failed/missing
    derivedStateClearWarning?: string; // Optional warning if Task 9 failed
    sessionAuditResultPreserved: true; // Always true - session audit not touched
    promotionDryRunResultPreserved: true; // Always true - dry-run result not touched
  };
  
  /** Session clear confirmation (TASK 10 - deferred) */
  sessionClear: {
    localDraftCleared: boolean; // False until Task 10
    sessionAuditCleared: boolean; // False until Task 10
    remediationLedgerCleared: boolean; // False until Task 10
    clearedAt: string | null; // Null until Task 10
  };
  
  /** Finalization summary (TASK 10) */
  finalizationSummary?: PromotionFinalizationSummary;
  
  /** Archive created confirmation (TASK 10) */
  archiveCreated?: boolean;
  
  /** Hard-coded safety invariants */
  readonly memoryOnly: true;
  readonly deployRemainedLocked: true;
  readonly canonicalAuditInvalidated: true;
  readonly reAuditRequired: true;
  readonly noBackendPersistence: true;
  readonly sessionAuditNotInherited: true;
  
  /** Task completion status */
  readonly vaultUpdated: true; // TASK 7 complete
  readonly sessionDraftCleared: boolean; // False until TASK 10
  readonly backendPersistencePerformed: false; // Always false
  readonly sessionAuditInherited: false; // Always false
}

/**
 * Blocked result of real local promotion execution.
 * Contains detailed information about why execution was blocked.
 */
export interface RealPromotionExecutionBlocked {
  success: false;
  
  /** Block category for high-level classification */
  blockCategory: RealPromotionBlockCategory;
  
  /** Detailed block reasons */
  blockReasons: string[];
  
  /** Human-readable summary of why execution was blocked */
  summary: string;
  
  /** Timestamp when block was detected */
  blockedAt: string;
  
  /** Whether any mutations occurred before block (should always be false) */
  mutationOccurred: false;
  
  /** Whether execution lock was acquired (for debugging) */
  lockAcquired: boolean;
  
  /** Hard-coded safety confirmations */
  readonly vaultUnchanged: true;
  readonly auditUnchanged: true;
  readonly sessionUnchanged: true;
  readonly deployRemainedLocked: true;
}

/**
 * Result of real local promotion execution.
 * Discriminated union for success/blocked states.
 */
export type RealPromotionExecutionResult =
  | RealPromotionExecutionSuccess
  | RealPromotionExecutionBlocked;

/**
 * Type guard to check if execution result is successful.
 */
export function isRealPromotionSuccess(
  result: RealPromotionExecutionResult
): result is RealPromotionExecutionSuccess {
  return result.success === true;
}

/**
 * Type guard to check if execution result is blocked.
 */
export function isRealPromotionBlocked(
  result: RealPromotionExecutionResult
): result is RealPromotionExecutionBlocked {
  return result.success === false;
}

/**
 * Pure helper to create a blocked result.
 */
export function createBlockedResult(
  blockCategory: RealPromotionBlockCategory,
  blockReasons: string[],
  summary: string,
  lockAcquired: boolean = false
): RealPromotionExecutionBlocked {
  return {
    success: false,
    blockCategory,
    blockReasons,
    summary,
    blockedAt: new Date().toISOString(),
    mutationOccurred: false,
    lockAcquired,
    vaultUnchanged: true,
    auditUnchanged: true,
    sessionUnchanged: true,
    deployRemainedLocked: true
  };
}

/**
 * Pure helper to create a success result.
 * TASK 7+8+9+10: Vault updated, audit invalidated, derived state cleared (or warned), session cleared (or not).
 */
export function createSuccessResult(fields: {
  executionId: string;
  newVault: Record<string, { title: string; desc: string; ready: boolean }>;
  vaultSnapshot: Record<string, { title: string; desc: string; ready: boolean }>;
  languageCount: number;
  promotedLanguages: string[];
  snapshotIdentity: {
    contentHash: string;
    ledgerSequence: number;
    latestAppliedEventId: string | null;
    timestamp: string;
  };
  invalidatedAt: string;
  derivedStateCleared?: boolean; // Optional, defaults to false for Task 7+8
  derivedStateClearWarning?: string; // Optional warning from Task 9
  sessionDraftCleared?: boolean; // Optional, defaults to false for Task 7+8+9
  clearedAt?: string | null; // Optional, defaults to null for Task 7+8+9
  finalizationSummary?: PromotionFinalizationSummary; // Optional, from Task 10
  archiveCreated?: boolean; // Optional, from Task 10
}): RealPromotionExecutionSuccess {
  return {
    success: true,
    executionId: fields.executionId,
    executedAt: new Date().toISOString(),
    newVault: fields.newVault,
    vaultSnapshot: fields.vaultSnapshot,
    languageCount: fields.languageCount,
    promotedLanguages: fields.promotedLanguages,
    snapshotIdentity: fields.snapshotIdentity,
    auditInvalidation: {
      canonicalAuditInvalidated: true,
      globalAuditInvalidated: true,
      invalidatedAt: fields.invalidatedAt
    },
    derivedStateClear: {
      derivedStateCleared: fields.derivedStateCleared ?? false,
      derivedStateClearWarning: fields.derivedStateClearWarning,
      sessionAuditResultPreserved: true,
      promotionDryRunResultPreserved: true
    },
    sessionClear: {
      localDraftCleared: fields.sessionDraftCleared ?? false,
      sessionAuditCleared: fields.sessionDraftCleared ?? false,
      remediationLedgerCleared: fields.sessionDraftCleared ?? false,
      clearedAt: fields.clearedAt ?? null
    },
    finalizationSummary: fields.finalizationSummary,
    archiveCreated: fields.archiveCreated,
    memoryOnly: true,
    deployRemainedLocked: true,
    canonicalAuditInvalidated: true,
    reAuditRequired: true,
    noBackendPersistence: true,
    sessionAuditNotInherited: true,
    vaultUpdated: true,
    sessionDraftCleared: fields.sessionDraftCleared ?? false,
    backendPersistencePerformed: false,
    sessionAuditInherited: false
  };
}

/**
 * Safety assertion constants for Task 6B-2B.
 */
export const TASK_6B2B_SAFETY_INVARIANTS = {
  MEMORY_ONLY: true as const,
  DEPLOY_REMAINED_LOCKED: true as const,
  CANONICAL_AUDIT_INVALIDATED: true as const,
  RE_AUDIT_REQUIRED: true as const,
  NO_BACKEND_PERSISTENCE: true as const,
  SESSION_AUDIT_NOT_INHERITED: true as const,
  FAIL_CLOSED: true as const,
  NO_CONCURRENT_EXECUTION: true as const
} as const;
