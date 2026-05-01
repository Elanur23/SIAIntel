/**
 * Canonical Re-Audit Acceptance - Type Contracts
 * 
 * Pure type definitions and eligibility validator for canonical re-audit acceptance.
 * 
 * CRITICAL SAFETY BOUNDARIES:
 * - Pure functions only - no side effects
 * - No React imports
 * - No browser APIs (localStorage, sessionStorage, fetch)
 * - No backend/API/database/provider imports
 * - No state mutations (no setGlobalAudit, setVault, setIsDeployBlocked)
 * - No deploy unlock
 * - No globalAudit mutation
 * - No vault mutation
 * - No persistence
 * - No acceptance execution (types + validator only)
 * - Fail-closed for all validation
 * 
 * TASK 8A SCOPE:
 * This module answers only: "Is this result eligible to be accepted later?"
 * It does NOT perform acceptance.
 * It does NOT perform promotion.
 * It does NOT unlock deploy.
 * It does NOT update globalAudit.
 * 
 * @version 8A.0.0
 * @author SIA Intelligence Systems
 */

import {
  CanonicalReAuditResult,
  CanonicalReAuditStatus,
  CanonicalReAuditSnapshotIdentity,
  verifyCanonicalSnapshotIdentityMatch
} from './canonical-reaudit-types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Reasons why canonical re-audit result acceptance is blocked.
 * 
 * Each reason corresponds to a failed precondition check.
 * All reasons are fail-closed.
 */
export enum CanonicalReAuditAcceptanceBlockReason {
  /** Result is null or undefined */
  RESULT_MISSING = 'RESULT_MISSING',
  
  /** Result status is not PASSED_PENDING_ACCEPTANCE */
  RESULT_NOT_PASSED_PENDING_ACCEPTANCE = 'RESULT_NOT_PASSED_PENDING_ACCEPTANCE',
  
  /** Result status is FAILED_PENDING_REVIEW (cannot accept failed audits) */
  RESULT_STATUS_FAILED = 'RESULT_STATUS_FAILED',
  
  /** Result status is BLOCKED (cannot accept blocked audits) */
  RESULT_STATUS_BLOCKED = 'RESULT_STATUS_BLOCKED',
  
  /** Result status is STALE (cannot accept stale audits) */
  RESULT_STATUS_STALE = 'RESULT_STATUS_STALE',
  
  /** Result status is unsupported or unknown */
  UNSUPPORTED_RESULT_STATUS = 'UNSUPPORTED_RESULT_STATUS',
  
  /** Result is stale (snapshot mismatch detected) */
  RESULT_STALE = 'RESULT_STALE',
  
  /** Session draft exists (blocks canonical acceptance) */
  SESSION_DRAFT_EXISTS = 'SESSION_DRAFT_EXISTS',
  
  /** Audit is currently running */
  AUDIT_RUNNING = 'AUDIT_RUNNING',
  
  /** Operator acknowledgement is missing or incomplete */
  OPERATOR_ACKNOWLEDGEMENT_MISSING = 'OPERATOR_ACKNOWLEDGEMENT_MISSING',
  
  /** Attestation phrase does not match */
  ATTESTATION_MISMATCH = 'ATTESTATION_MISMATCH',
  
  /** Current snapshot is missing (cannot verify staleness) */
  CURRENT_SNAPSHOT_MISSING = 'CURRENT_SNAPSHOT_MISSING',
  
  /** Audited snapshot is missing from result */
  AUDITED_SNAPSHOT_MISSING = 'AUDITED_SNAPSHOT_MISSING',
  
  /** Snapshot identity mismatch (result is stale) */
  SNAPSHOT_MISMATCH = 'SNAPSHOT_MISMATCH',
  
  /** Article ID mismatch (result is for different article) */
  ARTICLE_MISMATCH = 'ARTICLE_MISMATCH',
  
  /** Global audit is newer than result or comparison failed */
  GLOBAL_AUDIT_NEWER_OR_UNKNOWN = 'GLOBAL_AUDIT_NEWER_OR_UNKNOWN',
  
  /** Deploy is not locked (acceptance requires deploy to remain locked) */
  DEPLOY_NOT_LOCKED = 'DEPLOY_NOT_LOCKED',
  
  /** Transform error is present */
  TRANSFORM_ERROR_PRESENT = 'TRANSFORM_ERROR_PRESENT',
  
  /** Required context is missing for validation */
  MISSING_REQUIRED_CONTEXT = 'MISSING_REQUIRED_CONTEXT'
}

/**
 * Detailed precondition check results for acceptance eligibility.
 * 
 * All fields are boolean flags indicating whether each precondition passed.
 */
export interface CanonicalReAuditAcceptancePreconditions {
  /** Result exists and is not null */
  resultExists: boolean;
  
  /** Result status is PASSED_PENDING_ACCEPTANCE */
  statusIsPassedPendingAcceptance: boolean;
  
  /** Audited snapshot exists in result */
  auditedSnapshotExists: boolean;
  
  /** Current snapshot exists for comparison */
  currentSnapshotExists: boolean;
  
  /** Snapshot identity matches (result is not stale) */
  snapshotMatches: boolean;
  
  /** Article ID matches (if verifiable) */
  articleMatches: boolean;
  
  /** No session draft exists */
  noSessionDraft: boolean;
  
  /** Audit is not currently running */
  auditNotRunning: boolean;
  
  /** Operator has acknowledged acceptance requirements */
  operatorAcknowledged: boolean;
  
  /** Attestation phrase matches (if required) */
  attestationMatches: boolean;
  
  /** Global audit is not newer than result */
  globalAuditNotNewer: boolean;
  
  /** Deploy is locked (acceptance does not unlock deploy) */
  deployIsLocked: boolean;
  
  /** No transform error exists */
  noTransformError: boolean;
  
  /** All required context is present for validation */
  requiredContextPresent: boolean;
}

/**
 * Snapshot binding for acceptance eligibility validation.
 * 
 * Captures both audited and current snapshots for staleness detection.
 */
export interface CanonicalReAuditAcceptanceSnapshotBinding {
  /** Snapshot from audit result (may be null if result missing) */
  auditedSnapshot: CanonicalReAuditSnapshotIdentity | null;
  
  /** Current snapshot computed from vault (may be null if unavailable) */
  currentSnapshot: CanonicalReAuditSnapshotIdentity | null;
  
  /** Whether snapshots match (true only if both exist and match exactly) */
  snapshotMatches: boolean;
}

/**
 * Result of acceptance eligibility evaluation.
 * 
 * Indicates whether result can be accepted and provides detailed reasoning.
 */
export interface CanonicalReAuditAcceptanceEligibilityResult {
  /** Whether result is eligible for acceptance */
  canAccept: boolean;
  
  /** Reasons why acceptance is blocked (empty if canAccept is true) */
  blockReasons: CanonicalReAuditAcceptanceBlockReason[];
  
  /** Detailed precondition check results */
  preconditions: CanonicalReAuditAcceptancePreconditions;
  
  /** Snapshot binding for staleness detection */
  snapshotBinding: CanonicalReAuditAcceptanceSnapshotBinding;
  
  /** SAFETY INVARIANT: Acceptance is memory-only (never persisted) */
  readonly memoryOnly: true;
  
  /** SAFETY INVARIANT: Deploy remains locked after acceptance */
  readonly deployRemainsLocked: true;
  
  /** SAFETY INVARIANT: GlobalAudit overwrite not allowed by acceptance */
  readonly globalAuditOverwriteAllowed: false;
  
  /** SAFETY INVARIANT: Vault mutation not allowed by acceptance */
  readonly vaultMutationAllowed: false;
  
  /** SAFETY INVARIANT: Persistence not allowed by acceptance */
  readonly persistenceAllowed: false;
}

/**
 * Input for acceptance eligibility evaluation.
 * 
 * Contains only data needed for pure validation (no setters, no callbacks).
 */
export interface EvaluateCanonicalReAuditAcceptanceEligibilityInput {
  /** Canonical re-audit result to evaluate (may be null) */
  result: CanonicalReAuditResult | null;
  
  /** Current snapshot computed from vault (may be null) */
  currentSnapshot: CanonicalReAuditSnapshotIdentity | null;
  
  /** Selected article ID for article match validation (optional) */
  selectedArticleId?: string | null;
  
  /** Whether session draft exists (blocks acceptance) */
  hasSessionDraft: boolean;
  
  /** Whether audit is currently running (blocks acceptance) */
  isAuditRunning: boolean;
  
  /** Whether operator has acknowledged acceptance requirements */
  operatorAcknowledged: boolean;
  
  /** Whether attestation phrase matches (if required) */
  attestationMatches: boolean;
  
  /** Whether deploy is locked (must be true for acceptance) */
  deployIsLocked: boolean;
  
  /** Transform error message (blocks acceptance if present) */
  transformError?: string | null;
  
  /** Global audit auditedAt timestamp for comparison (optional) */
  globalAuditAuditedAt?: string | null;
}

// ============================================================================
// PURE ELIGIBILITY VALIDATOR
// ============================================================================

/**
 * Evaluates whether a canonical re-audit result is eligible for acceptance.
 * 
 * PURE FUNCTION - NO SIDE EFFECTS:
 * - Does not mutate input
 * - Does not call setGlobalAudit, setVault, setIsDeployBlocked
 * - Does not call fetch, axios, prisma, turso, libsql
 * - Does not use localStorage, sessionStorage
 * - Does not unlock deploy
 * - Does not perform acceptance (validation only)
 * 
 * FAIL-CLOSED LOGIC:
 * - Returns canAccept: false if any precondition fails
 * - Returns canAccept: true only if ALL preconditions pass
 * - Blocks on missing/invalid data
 * - Blocks on stale results
 * - Blocks on unsupported statuses
 * 
 * @param input - Acceptance eligibility input
 * @returns Acceptance eligibility result with detailed preconditions
 */
export function evaluateCanonicalReAuditAcceptanceEligibility(
  input: EvaluateCanonicalReAuditAcceptanceEligibilityInput
): CanonicalReAuditAcceptanceEligibilityResult {
  const blockReasons: CanonicalReAuditAcceptanceBlockReason[] = [];
  
  // Initialize preconditions (all false until proven true)
  const preconditions: CanonicalReAuditAcceptancePreconditions = {
    resultExists: false,
    statusIsPassedPendingAcceptance: false,
    auditedSnapshotExists: false,
    currentSnapshotExists: false,
    snapshotMatches: false,
    articleMatches: false,
    noSessionDraft: false,
    auditNotRunning: false,
    operatorAcknowledged: false,
    attestationMatches: false,
    globalAuditNotNewer: false,
    deployIsLocked: false,
    noTransformError: false,
    requiredContextPresent: false
  };
  
  // Initialize snapshot binding
  const snapshotBinding: CanonicalReAuditAcceptanceSnapshotBinding = {
    auditedSnapshot: null,
    currentSnapshot: null,
    snapshotMatches: false
  };
  
  // ============================================================================
  // PRECONDITION 1: Result Exists
  // ============================================================================
  if (!input.result) {
    blockReasons.push(CanonicalReAuditAcceptanceBlockReason.RESULT_MISSING);
  } else {
    preconditions.resultExists = true;
  }
  
  // ============================================================================
  // PRECONDITION 2: Result Status is PASSED_PENDING_ACCEPTANCE
  // ============================================================================
  if (input.result) {
    if (input.result.status === CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE) {
      preconditions.statusIsPassedPendingAcceptance = true;
    } else {
      blockReasons.push(CanonicalReAuditAcceptanceBlockReason.RESULT_NOT_PASSED_PENDING_ACCEPTANCE);
      
      // Add specific block reasons for non-PASSED statuses
      if (input.result.status === CanonicalReAuditStatus.FAILED_PENDING_REVIEW) {
        blockReasons.push(CanonicalReAuditAcceptanceBlockReason.RESULT_STATUS_FAILED);
      } else if (input.result.status === CanonicalReAuditStatus.BLOCKED) {
        blockReasons.push(CanonicalReAuditAcceptanceBlockReason.RESULT_STATUS_BLOCKED);
      } else if (input.result.status === CanonicalReAuditStatus.STALE) {
        blockReasons.push(CanonicalReAuditAcceptanceBlockReason.RESULT_STATUS_STALE);
      } else if (
        input.result.status !== CanonicalReAuditStatus.NOT_RUN &&
        input.result.status !== CanonicalReAuditStatus.RUNNING
      ) {
        blockReasons.push(CanonicalReAuditAcceptanceBlockReason.UNSUPPORTED_RESULT_STATUS);
      }
    }
  }
  
  // ============================================================================
  // PRECONDITION 3: Audited Snapshot Exists
  // ============================================================================
  if (input.result?.auditedSnapshot) {
    preconditions.auditedSnapshotExists = true;
    snapshotBinding.auditedSnapshot = input.result.auditedSnapshot;
  } else if (input.result) {
    blockReasons.push(CanonicalReAuditAcceptanceBlockReason.AUDITED_SNAPSHOT_MISSING);
  }
  
  // ============================================================================
  // PRECONDITION 4: Current Snapshot Exists
  // ============================================================================
  if (input.currentSnapshot) {
    preconditions.currentSnapshotExists = true;
    snapshotBinding.currentSnapshot = input.currentSnapshot;
  } else {
    blockReasons.push(CanonicalReAuditAcceptanceBlockReason.CURRENT_SNAPSHOT_MISSING);
  }
  
  // ============================================================================
  // PRECONDITION 5: Snapshot Identity Matches (Result Not Stale)
  // ============================================================================
  if (snapshotBinding.auditedSnapshot && snapshotBinding.currentSnapshot) {
    const snapshotMatches = verifyCanonicalSnapshotIdentityMatch(
      snapshotBinding.auditedSnapshot,
      snapshotBinding.currentSnapshot
    );
    
    if (snapshotMatches) {
      preconditions.snapshotMatches = true;
      snapshotBinding.snapshotMatches = true;
    } else {
      blockReasons.push(CanonicalReAuditAcceptanceBlockReason.SNAPSHOT_MISMATCH);
      blockReasons.push(CanonicalReAuditAcceptanceBlockReason.RESULT_STALE);
    }
  }
  
  // ============================================================================
  // PRECONDITION 6: Article ID Matches (If Verifiable)
  // ============================================================================
  // Note: CanonicalReAuditSnapshotIdentity does not have articleId field.
  // We cannot reliably verify article match without additional context.
  // Fail-closed: If selectedArticleId is provided but we cannot verify,
  // we mark articleMatches as false and add MISSING_REQUIRED_CONTEXT.
  // If selectedArticleId is not provided, we assume article match is not required.
  if (input.selectedArticleId) {
    // We cannot verify article match because snapshot does not contain articleId
    // Fail-closed: block acceptance if article verification is required but unavailable
    blockReasons.push(CanonicalReAuditAcceptanceBlockReason.MISSING_REQUIRED_CONTEXT);
    preconditions.articleMatches = false;
  } else {
    // Article match verification not required (no selectedArticleId provided)
    preconditions.articleMatches = true;
  }
  
  // ============================================================================
  // PRECONDITION 7: No Session Draft Exists
  // ============================================================================
  if (!input.hasSessionDraft) {
    preconditions.noSessionDraft = true;
  } else {
    blockReasons.push(CanonicalReAuditAcceptanceBlockReason.SESSION_DRAFT_EXISTS);
  }
  
  // ============================================================================
  // PRECONDITION 8: Audit Not Running
  // ============================================================================
  if (!input.isAuditRunning) {
    preconditions.auditNotRunning = true;
  } else {
    blockReasons.push(CanonicalReAuditAcceptanceBlockReason.AUDIT_RUNNING);
  }
  
  // ============================================================================
  // PRECONDITION 9: Operator Acknowledged
  // ============================================================================
  if (input.operatorAcknowledged) {
    preconditions.operatorAcknowledged = true;
  } else {
    blockReasons.push(CanonicalReAuditAcceptanceBlockReason.OPERATOR_ACKNOWLEDGEMENT_MISSING);
  }
  
  // ============================================================================
  // PRECONDITION 10: Attestation Matches
  // ============================================================================
  if (input.attestationMatches) {
    preconditions.attestationMatches = true;
  } else {
    blockReasons.push(CanonicalReAuditAcceptanceBlockReason.ATTESTATION_MISMATCH);
  }
  
  // ============================================================================
  // PRECONDITION 11: Global Audit Not Newer
  // ============================================================================
  if (input.globalAuditAuditedAt && input.result?.auditedAt) {
    try {
      const globalAuditTime = new Date(input.globalAuditAuditedAt).getTime();
      const resultTime = new Date(input.result.auditedAt).getTime();
      
      // Fail-closed: If timestamps are invalid (NaN), block acceptance
      if (isNaN(globalAuditTime) || isNaN(resultTime)) {
        blockReasons.push(CanonicalReAuditAcceptanceBlockReason.GLOBAL_AUDIT_NEWER_OR_UNKNOWN);
      } else if (globalAuditTime > resultTime) {
        // Global audit is newer than result - block acceptance
        blockReasons.push(CanonicalReAuditAcceptanceBlockReason.GLOBAL_AUDIT_NEWER_OR_UNKNOWN);
      } else {
        // Global audit is older or same age - allow acceptance
        preconditions.globalAuditNotNewer = true;
      }
    } catch (error) {
      // Timestamp parsing failed - fail closed
      blockReasons.push(CanonicalReAuditAcceptanceBlockReason.GLOBAL_AUDIT_NEWER_OR_UNKNOWN);
    }
  } else {
    // No global audit or no result auditedAt - assume global audit not newer
    preconditions.globalAuditNotNewer = true;
  }
  
  // ============================================================================
  // PRECONDITION 12: Deploy Is Locked
  // ============================================================================
  if (input.deployIsLocked) {
    preconditions.deployIsLocked = true;
  } else {
    blockReasons.push(CanonicalReAuditAcceptanceBlockReason.DEPLOY_NOT_LOCKED);
  }
  
  // ============================================================================
  // PRECONDITION 13: No Transform Error
  // ============================================================================
  if (!input.transformError || input.transformError.trim().length === 0) {
    preconditions.noTransformError = true;
  } else {
    blockReasons.push(CanonicalReAuditAcceptanceBlockReason.TRANSFORM_ERROR_PRESENT);
  }
  
  // ============================================================================
  // PRECONDITION 14: Required Context Present
  // ============================================================================
  // Check if all required context for validation is present
  const hasRequiredContext = 
    preconditions.resultExists &&
    preconditions.auditedSnapshotExists &&
    preconditions.currentSnapshotExists;
  
  if (hasRequiredContext) {
    preconditions.requiredContextPresent = true;
  } else if (!blockReasons.includes(CanonicalReAuditAcceptanceBlockReason.MISSING_REQUIRED_CONTEXT)) {
    // Only add if not already added by article match check
    blockReasons.push(CanonicalReAuditAcceptanceBlockReason.MISSING_REQUIRED_CONTEXT);
  }
  
  // ============================================================================
  // FINAL DECISION: Can Accept?
  // ============================================================================
  // canAccept is true ONLY if:
  // - blockReasons is empty
  // - result status is PASSED_PENDING_ACCEPTANCE
  // - all critical preconditions pass
  const canAccept = 
    blockReasons.length === 0 &&
    preconditions.resultExists &&
    preconditions.statusIsPassedPendingAcceptance &&
    preconditions.snapshotMatches &&
    preconditions.noSessionDraft &&
    preconditions.auditNotRunning &&
    preconditions.operatorAcknowledged &&
    preconditions.attestationMatches &&
    preconditions.deployIsLocked &&
    preconditions.noTransformError;
  
  // ============================================================================
  // RETURN RESULT WITH SAFETY INVARIANTS
  // ============================================================================
  return {
    canAccept,
    blockReasons,
    preconditions,
    snapshotBinding,
    memoryOnly: true,
    deployRemainsLocked: true,
    globalAuditOverwriteAllowed: false,
    vaultMutationAllowed: false,
    persistenceAllowed: false
  };
}
