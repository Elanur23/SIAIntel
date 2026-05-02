/**
 * Canonical Re-Audit Registration Eligibility - Type Contracts
 * 
 * Pure type definitions and eligibility validator for canonical re-audit registration.
 * 
 * CRITICAL SAFETY BOUNDARIES:
 * - Pure functions only - no side effects
 * - No React imports
 * - No browser APIs (fetch)
 * - No backend/database/provider imports
 * - No state mutations
 * - No deploy unlock
 * - No globalAudit mutation
 * - No vault mutation
 * - No persistence
 * - No registration execution (types + validator only)
 * - Fail-closed for all validation
 * 
 * TASK 8C-2A SCOPE:
 * This module answers only: "Is this canonical re-audit result eligible to be registered in memory later?"
 * It does NOT perform registration.
 * It does NOT perform promotion.
 * It does NOT unlock deploy.
 * It does NOT update globalAudit.
 * 
 * @version 8C-2A.0.0
 * @author SIA Intelligence Systems
 */

import type {
  CanonicalReAuditRegistrationState,
  CanonicalReAuditEligibilityEvaluatedState
} from './canonical-reaudit-registration-state-types';
import type {
  CanonicalReAuditSnapshotIdentity
} from './canonical-reaudit-types';
import type {
  CanonicalReAuditAcceptanceEligibilityResult
} from './canonical-reaudit-acceptance-types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Reasons why canonical re-audit result registration is blocked.
 * 
 * Each reason corresponds to a failed precondition check.
 * All reasons are fail-closed.
 */
export enum CanonicalReAuditRegistrationBlockReason {
  /** Registration state is null or undefined */
  RESULT_MISSING = 'RESULT_MISSING',
  
  /** Result status is not PASSED_PENDING_ACCEPTANCE */
  RESULT_STATUS_NOT_PENDING_ACCEPTANCE = 'RESULT_STATUS_NOT_PENDING_ACCEPTANCE',
  
  /** Audited snapshot is missing from result */
  AUDITED_SNAPSHOT_MISSING = 'AUDITED_SNAPSHOT_MISSING',
  
  /** Current snapshot is missing for comparison */
  CURRENT_SNAPSHOT_MISSING = 'CURRENT_SNAPSHOT_MISSING',
  
  /** Snapshot identity mismatch (result is stale) */
  SNAPSHOT_IDENTITY_MISMATCH = 'SNAPSHOT_IDENTITY_MISMATCH',
  
  /** Acceptance eligibility result is missing */
  ACCEPTANCE_ELIGIBILITY_MISSING = 'ACCEPTANCE_ELIGIBILITY_MISSING',
  
  /** Acceptance eligibility does not allow registration */
  ACCEPTANCE_NOT_ELIGIBLE = 'ACCEPTANCE_NOT_ELIGIBLE',
  
  /** Session draft exists (blocks registration) */
  SESSION_DRAFT_PRESENT = 'SESSION_DRAFT_PRESENT',
  
  /** Audit is currently running */
  AUDIT_RUNNING = 'AUDIT_RUNNING',
  
  /** Deploy is not locked (registration requires deploy to remain locked) */
  DEPLOY_NOT_LOCKED = 'DEPLOY_NOT_LOCKED',
  
  /** Transform error is present */
  TRANSFORM_ERROR_PRESENT = 'TRANSFORM_ERROR_PRESENT',
  
  /** Required context is missing for validation */
  CONTEXT_MISSING = 'CONTEXT_MISSING',
  
  /** Registration state is unknown or unsupported */
  UNKNOWN_REGISTRATION_STATE = 'UNKNOWN_REGISTRATION_STATE',
  
  /** Registration is forbidden by policy */
  REGISTRATION_FORBIDDEN_BY_POLICY = 'REGISTRATION_FORBIDDEN_BY_POLICY'
}

/**
 * Detailed precondition check results for registration eligibility.
 * 
 * All fields are boolean flags indicating whether each precondition passed.
 */
export interface CanonicalReAuditRegistrationPreconditions {
  /** Registration state exists and is not null */
  hasResult: boolean;
  
  /** Result status is PASSED_PENDING_ACCEPTANCE */
  hasPendingAcceptanceStatus: boolean;
  
  /** Audited snapshot exists in result */
  hasAuditedSnapshot: boolean;
  
  /** Current snapshot exists for comparison */
  hasCurrentSnapshot: boolean;
  
  /** Snapshot identity matches (result is not stale) */
  snapshotIdentityMatches: boolean;
  
  /** Acceptance eligibility result exists */
  hasAcceptanceEligibility: boolean;
  
  /** Acceptance eligibility allows registration */
  acceptanceEligibilityAllowsRegistration: boolean;
  
  /** No session draft exists */
  noSessionDraftPresent: boolean;
  
  /** Audit is not currently running */
  auditNotRunning: boolean;
  
  /** Deploy remains locked */
  deployRemainsLocked: boolean;
  
  /** No transform error exists */
  noTransformError: boolean;
  
  /** All required context is present for validation */
  hasRequiredContext: boolean;
  
  /** Registration policy allows evaluation */
  registrationPolicyAllowsEvaluation: boolean;
}

/**
 * Result of registration eligibility evaluation.
 * 
 * Indicates whether result can be registered and provides detailed reasoning.
 */
export interface CanonicalReAuditRegistrationEligibilityResult {
  /** Whether result is eligible for registration */
  canRegister: boolean;
  
  /** Reasons why registration is blocked (empty if canRegister is true) */
  blockReasons: CanonicalReAuditRegistrationBlockReason[];
  
  /** Detailed precondition check results */
  preconditions: CanonicalReAuditRegistrationPreconditions;
  
  /** SAFETY INVARIANT: Registration is memory-only (never persisted) */
  readonly memoryOnly: true;
  
  /** SAFETY INVARIANT: Deploy remains locked after registration */
  readonly deployRemainsLocked: true;
  
  /** SAFETY INVARIANT: Persistence not allowed by registration */
  readonly persistenceAllowed: false;
  
  /** SAFETY INVARIANT: Vault mutation not allowed by registration */
  readonly vaultMutationAllowed: false;
  
  /** SAFETY INVARIANT: GlobalAudit overwrite not allowed by registration */
  readonly globalAuditOverwriteAllowed: false;
  
  /** SAFETY INVARIANT: Production authorization not allowed by registration */
  readonly productionAuthorizationAllowed: false;
  
  /** SAFETY INVARIANT: Registration execution not allowed by this validator */
  readonly registrationExecutionAllowed: false;
  
  /** SAFETY INVARIANT: Promotion required after registration */
  readonly promotionRequired: true;
  
  /** Stage at which evaluation occurred */
  readonly evaluatedStage: "ELIGIBILITY_EVALUATED";
}

/**
 * Input for registration eligibility evaluation.
 * 
 * Contains only data needed for pure validation (no setters, no callbacks).
 */
export interface EvaluateCanonicalReAuditRegistrationEligibilityInput {
  /** Registration state to evaluate (may be null) */
  registrationState: CanonicalReAuditRegistrationState | null;
  
  /** Current snapshot computed from vault (may be null) */
  currentSnapshot: CanonicalReAuditSnapshotIdentity | null;
  
  /** Whether session draft exists (blocks registration) */
  hasSessionDraft: boolean;
  
  /** Whether audit is currently running (blocks registration) */
  auditRunning: boolean;
  
  /** Whether deploy is locked (must be true for registration) */
  deployLocked: boolean;
  
  /** Transform error message (blocks registration if present) */
  transformErrorPresent: boolean;
  
  /** Whether required context is ready for validation */
  contextReady: boolean;
}

// ============================================================================
// PURE ELIGIBILITY VALIDATOR
// ============================================================================

/**
 * Evaluates whether a canonical re-audit result is eligible for registration.
 * 
 * PURE FUNCTION - NO SIDE EFFECTS:
 * - Does not mutate input
 * - Does not call fetch
 * - Does not unlock deploy
 * - Does not perform registration (validation only)
 * 
 * FAIL-CLOSED LOGIC:
 * - Returns canRegister: false if any precondition fails
 * - Returns canRegister: true only if ALL preconditions pass
 * - Blocks on missing/invalid data
 * - Blocks on stale results
 * - Blocks on unsupported states
 * - Only allows evaluation from ELIGIBILITY_EVALUATED stage
 * 
 * @param input - Registration eligibility input
 * @returns Registration eligibility result with detailed preconditions
 */
export function evaluateCanonicalReAuditRegistrationEligibility(
  input: EvaluateCanonicalReAuditRegistrationEligibilityInput
): CanonicalReAuditRegistrationEligibilityResult {
  const blockReasons: CanonicalReAuditRegistrationBlockReason[] = [];
  
  // Initialize preconditions (all false until proven true)
  const preconditions: CanonicalReAuditRegistrationPreconditions = {
    hasResult: false,
    hasPendingAcceptanceStatus: false,
    hasAuditedSnapshot: false,
    hasCurrentSnapshot: false,
    snapshotIdentityMatches: false,
    hasAcceptanceEligibility: false,
    acceptanceEligibilityAllowsRegistration: false,
    noSessionDraftPresent: false,
    auditNotRunning: false,
    deployRemainsLocked: false,
    noTransformError: false,
    hasRequiredContext: false,
    registrationPolicyAllowsEvaluation: false
  };
  
  // ============================================================================
  // PRECONDITION 1: Registration State Exists
  // ============================================================================
  if (!input.registrationState) {
    blockReasons.push(CanonicalReAuditRegistrationBlockReason.RESULT_MISSING);
  } else {
    preconditions.hasResult = true;
  }
  
  // ============================================================================
  // PRECONDITION 2: State is ELIGIBILITY_EVALUATED
  // ============================================================================
  if (input.registrationState) {
    if (input.registrationState.stage === "ELIGIBILITY_EVALUATED") {
      // Check if eligibility exists
      const eligibilityEvaluatedState = input.registrationState as CanonicalReAuditEligibilityEvaluatedState;
      if (eligibilityEvaluatedState.eligibility) {
        preconditions.hasAcceptanceEligibility = true;
        
        // Check if acceptance eligibility allows registration
        if (eligibilityEvaluatedState.eligibility.canAccept) {
          preconditions.acceptanceEligibilityAllowsRegistration = true;
        } else {
          blockReasons.push(CanonicalReAuditRegistrationBlockReason.ACCEPTANCE_NOT_ELIGIBLE);
        }
      } else {
        blockReasons.push(CanonicalReAuditRegistrationBlockReason.ACCEPTANCE_ELIGIBILITY_MISSING);
      }
    } else {
      // Not in ELIGIBILITY_EVALUATED stage
      blockReasons.push(CanonicalReAuditRegistrationBlockReason.UNKNOWN_REGISTRATION_STATE);
    }
  }
  
  // ============================================================================
  // PRECONDITION 3: Audited Snapshot Exists
  // ============================================================================
  // Note: In ELIGIBILITY_EVALUATED state, we don't have direct access to audited snapshot
  // This would need to come from the original result, but we don't have it in this input
  // For now, we'll mark this as false and require it from context
  preconditions.hasAuditedSnapshot = false;
  blockReasons.push(CanonicalReAuditRegistrationBlockReason.AUDITED_SNAPSHOT_MISSING);
  
  // ============================================================================
  // PRECONDITION 4: Current Snapshot Exists
  // ============================================================================
  if (input.currentSnapshot) {
    preconditions.hasCurrentSnapshot = true;
  } else {
    blockReasons.push(CanonicalReAuditRegistrationBlockReason.CURRENT_SNAPSHOT_MISSING);
  }
  
  // ============================================================================
  // PRECONDITION 5: Snapshot Identity Matches
  // ============================================================================
  // Cannot verify without audited snapshot
  preconditions.snapshotIdentityMatches = false;
  if (preconditions.hasAuditedSnapshot && preconditions.hasCurrentSnapshot) {
    // In a real implementation, we would compare snapshots here
    // For now, we'll leave as false since we don't have audited snapshot
  }
  
  // ============================================================================
  // PRECONDITION 6: No Session Draft Exists
  // ============================================================================
  if (!input.hasSessionDraft) {
    preconditions.noSessionDraftPresent = true;
  } else {
    blockReasons.push(CanonicalReAuditRegistrationBlockReason.SESSION_DRAFT_PRESENT);
  }
  
  // ============================================================================
  // PRECONDITION 7: Audit Not Running
  // ============================================================================
  if (!input.auditRunning) {
    preconditions.auditNotRunning = true;
  } else {
    blockReasons.push(CanonicalReAuditRegistrationBlockReason.AUDIT_RUNNING);
  }
  
  // ============================================================================
  // PRECONDITION 8: Deploy Remains Locked
  // ============================================================================
  if (input.deployLocked) {
    preconditions.deployRemainsLocked = true;
  } else {
    blockReasons.push(CanonicalReAuditRegistrationBlockReason.DEPLOY_NOT_LOCKED);
  }
  
  // ============================================================================
  // PRECONDITION 9: No Transform Error
  // ============================================================================
  if (!input.transformErrorPresent) {
    preconditions.noTransformError = true;
  } else {
    blockReasons.push(CanonicalReAuditRegistrationBlockReason.TRANSFORM_ERROR_PRESENT);
  }
  
  // ============================================================================
  // PRECONDITION 10: Required Context Present
  // ============================================================================
  if (input.contextReady) {
    preconditions.hasRequiredContext = true;
  } else {
    blockReasons.push(CanonicalReAuditRegistrationBlockReason.CONTEXT_MISSING);
  }
  
  // ============================================================================
  // PRECONDITION 11: Registration Policy Allows Evaluation
  // ============================================================================
  // Default policy: allow evaluation if all other preconditions pass
  // This is a placeholder for actual policy evaluation
  const policyAllowsEvaluation = 
    preconditions.hasResult &&
    preconditions.hasAcceptanceEligibility &&
    preconditions.acceptanceEligibilityAllowsRegistration &&
    preconditions.hasCurrentSnapshot &&
    preconditions.noSessionDraftPresent &&
    preconditions.auditNotRunning &&
    preconditions.deployRemainsLocked &&
    preconditions.noTransformError &&
    preconditions.hasRequiredContext;
  
  if (policyAllowsEvaluation) {
    preconditions.registrationPolicyAllowsEvaluation = true;
  } else {
    blockReasons.push(CanonicalReAuditRegistrationBlockReason.REGISTRATION_FORBIDDEN_BY_POLICY);
  }
  
  // ============================================================================
  // FINAL DECISION: Can Register?
  // ============================================================================
  // canRegister is true ONLY if:
  // - blockReasons is empty
  // - registration state is ELIGIBILITY_EVALUATED
  // - acceptance eligibility allows registration
  // - all critical preconditions pass
  const canRegister = 
    blockReasons.length === 0 &&
    preconditions.hasResult &&
    preconditions.hasAcceptanceEligibility &&
    preconditions.acceptanceEligibilityAllowsRegistration &&
    preconditions.hasCurrentSnapshot &&
    preconditions.noSessionDraftPresent &&
    preconditions.auditNotRunning &&
    preconditions.deployRemainsLocked &&
    preconditions.noTransformError &&
    preconditions.hasRequiredContext &&
    preconditions.registrationPolicyAllowsEvaluation;
  
  // ============================================================================
  // RETURN RESULT WITH SAFETY INVARIANTS
  // ============================================================================
  return {
    canRegister,
    blockReasons,
    preconditions,
    memoryOnly: true,
    deployRemainsLocked: true,
    persistenceAllowed: false,
    vaultMutationAllowed: false,
    globalAuditOverwriteAllowed: false,
    productionAuthorizationAllowed: false,
    registrationExecutionAllowed: false,
    promotionRequired: true,
    evaluatedStage: "ELIGIBILITY_EVALUATED"
  };
}
