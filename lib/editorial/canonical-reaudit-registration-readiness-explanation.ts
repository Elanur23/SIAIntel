/**
 * Canonical Re-Audit Registration Readiness Explanation Mapper
 * 
 * Pure explanation mapper that converts registration eligibility results
 * into human-readable, primitive-only readiness explanations.
 * 
 * CRITICAL SAFETY BOUNDARIES:
 * - Pure functions only - no side effects
 * - No React imports
 * - No browser APIs
 * - No backend/database/provider imports
 * - No state mutations
 * - No deploy unlock
 * - No globalAudit mutation
 * - No vault mutation
 * - No persistence
 * - No registration execution (explanation only)
 * - Fail-closed for all mappings
 * 
 * TASK 8C-2B SCOPE:
 * This module answers only: "Why is this registration eligibility result ready or blocked, in human-readable form?"
 * It does NOT create REGISTERED_IN_MEMORY objects.
 * It does NOT create registration payloads.
 * It does NOT preview state transitions.
 * It does NOT perform registration.
 * It does NOT perform promotion.
 * It does NOT unlock deploy.
 * It does NOT update globalAudit.
 * 
 * @version 8C-2B.0.0
 * @author SIA Intelligence Systems
 */

import type {
  CanonicalReAuditRegistrationEligibilityResult,
  CanonicalReAuditRegistrationBlockReason
} from './canonical-reaudit-registration-eligibility-types';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Severity level for registration readiness explanation.
 */
export type CanonicalReAuditRegistrationReadinessSeverity =
  | 'INFO'
  | 'WARNING'
  | 'HIGH'
  | 'CRITICAL';

/**
 * Human-readable explanation of registration readiness status.
 * 
 * Contains only primitive types and readonly arrays.
 * Does NOT contain:
 * - REGISTERED_IN_MEMORY objects
 * - Registration payloads
 * - State transition previews
 * - Execution payloads
 * - Complex state objects
 */
export interface CanonicalReAuditRegistrationReadinessExplanation {
  /** Whether result is eligible for registration */
  readonly eligible: boolean;
  
  /** Whether result is ready for registration (same as eligible) */
  readonly readyForRegistration: boolean;
  
  /** Severity level of the readiness status */
  readonly severity: CanonicalReAuditRegistrationReadinessSeverity;
  
  /** Short title summarizing readiness status */
  readonly title: string;
  
  /** Detailed summary of readiness status */
  readonly summary: string;
  
  /** Human-readable labels for each block reason */
  readonly blockReasonLabels: readonly string[];
  
  /** Actionable remediation hints as strings */
  readonly remediationHints: readonly string[];
  
  /** Summary of precondition checks */
  readonly preconditionSummary: string;
  
  /** Number of block reasons */
  readonly blockReasonCount: number;
  
  /** SAFETY INVARIANT: This is informational only (no execution) */
  readonly informationalOnly: true;
  
  /** SAFETY INVARIANT: Registration execution not allowed by this explanation */
  readonly registrationExecutionAllowed: false;
  
  /** SAFETY INVARIANT: Deploy remains locked */
  readonly deployRemainsLocked: true;
  
  /** SAFETY INVARIANT: Persistence not allowed */
  readonly persistenceAllowed: false;
  
  /** SAFETY INVARIANT: Mutation not allowed */
  readonly mutationAllowed: false;
}

// ============================================================================
// PURE HELPER FUNCTIONS
// ============================================================================

/**
 * Gets human-readable label for a registration block reason.
 * 
 * PURE FUNCTION - NO SIDE EFFECTS.
 * 
 * @param reason - Block reason enum value
 * @returns Human-readable label string
 */
export function getRegistrationBlockReasonLabel(
  reason: CanonicalReAuditRegistrationBlockReason
): string {
  switch (reason) {
    case 'RESULT_MISSING':
      return 'Registration state is missing';
    
    case 'RESULT_STATUS_NOT_PENDING_ACCEPTANCE':
      return 'Result status is not pending acceptance';
    
    case 'AUDITED_SNAPSHOT_MISSING':
      return 'Audited snapshot is missing';
    
    case 'CURRENT_SNAPSHOT_MISSING':
      return 'Current snapshot is missing';
    
    case 'SNAPSHOT_IDENTITY_MISMATCH':
      return 'Snapshot identity mismatch (result is stale)';
    
    case 'ACCEPTANCE_ELIGIBILITY_MISSING':
      return 'Acceptance eligibility result is missing';
    
    case 'ACCEPTANCE_NOT_ELIGIBLE':
      return 'Acceptance eligibility does not allow registration';
    
    case 'SESSION_DRAFT_PRESENT':
      return 'Session draft exists (blocks registration)';
    
    case 'AUDIT_RUNNING':
      return 'Audit is currently running';
    
    case 'DEPLOY_NOT_LOCKED':
      return 'Deploy is not locked';
    
    case 'TRANSFORM_ERROR_PRESENT':
      return 'Transform error is present';
    
    case 'CONTEXT_MISSING':
      return 'Required context is missing';
    
    case 'UNKNOWN_REGISTRATION_STATE':
      return 'Registration state is unknown or unsupported';
    
    case 'REGISTRATION_FORBIDDEN_BY_POLICY':
      return 'Registration is forbidden by policy';
    
    default:
      return 'Unknown block reason';
  }
}

/**
 * Gets remediation hint for a registration block reason.
 * 
 * PURE FUNCTION - NO SIDE EFFECTS.
 * 
 * @param reason - Block reason enum value
 * @returns Remediation hint string
 */
export function getRegistrationBlockReasonHint(
  reason: CanonicalReAuditRegistrationBlockReason
): string {
  switch (reason) {
    case 'RESULT_MISSING':
      return 'Ensure registration state is properly initialized before evaluation.';
    
    case 'RESULT_STATUS_NOT_PENDING_ACCEPTANCE':
      return 'Result must have status PASSED_PENDING_ACCEPTANCE to be eligible for registration.';
    
    case 'AUDITED_SNAPSHOT_MISSING':
      return 'Audited snapshot must be present in the result for registration.';
    
    case 'CURRENT_SNAPSHOT_MISSING':
      return 'Current snapshot must be computed from vault for staleness detection.';
    
    case 'SNAPSHOT_IDENTITY_MISMATCH':
      return 'Result is stale. Re-run canonical re-audit to get fresh result matching current snapshot.';
    
    case 'ACCEPTANCE_ELIGIBILITY_MISSING':
      return 'Acceptance eligibility must be evaluated before registration.';
    
    case 'ACCEPTANCE_NOT_ELIGIBLE':
      return 'Result must pass acceptance eligibility checks before registration.';
    
    case 'SESSION_DRAFT_PRESENT':
      return 'Clear or commit session draft before registering canonical re-audit result.';
    
    case 'AUDIT_RUNNING':
      return 'Wait for audit to complete before attempting registration.';
    
    case 'DEPLOY_NOT_LOCKED':
      return 'Deploy must remain locked during registration. Check deploy lock status.';
    
    case 'TRANSFORM_ERROR_PRESENT':
      return 'Resolve transform error before attempting registration.';
    
    case 'CONTEXT_MISSING':
      return 'Ensure all required context is available for validation.';
    
    case 'UNKNOWN_REGISTRATION_STATE':
      return 'Registration state must be in ELIGIBILITY_EVALUATED stage.';
    
    case 'REGISTRATION_FORBIDDEN_BY_POLICY':
      return 'Registration policy does not allow evaluation. Check preconditions.';
    
    default:
      return 'Review block reason and resolve underlying issue.';
  }
}

/**
 * Determines severity level based on block reasons.
 * 
 * PURE FUNCTION - NO SIDE EFFECTS.
 * 
 * @param reasons - Array of block reasons
 * @returns Severity level
 */
export function getRegistrationReadinessSeverity(
  reasons: readonly CanonicalReAuditRegistrationBlockReason[]
): CanonicalReAuditRegistrationReadinessSeverity {
  // No block reasons = INFO (ready for registration)
  if (reasons.length === 0) {
    return 'INFO';
  }
  
  // CRITICAL severity for unsafe/unknown states
  for (const reason of reasons) {
    if (
      reason === 'UNKNOWN_REGISTRATION_STATE' ||
      reason === 'DEPLOY_NOT_LOCKED' ||
      reason === 'REGISTRATION_FORBIDDEN_BY_POLICY'
    ) {
      return 'CRITICAL';
    }
  }
  
  // HIGH severity for policy, snapshot, status, or acceptance blocks
  for (const reason of reasons) {
    if (
      reason === 'RESULT_STATUS_NOT_PENDING_ACCEPTANCE' ||
      reason === 'SNAPSHOT_IDENTITY_MISMATCH' ||
      reason === 'ACCEPTANCE_NOT_ELIGIBLE' ||
      reason === 'ACCEPTANCE_ELIGIBILITY_MISSING' ||
      reason === 'AUDITED_SNAPSHOT_MISSING'
    ) {
      return 'HIGH';
    }
  }
  
  // WARNING severity for contextual/environmental blocks
  return 'WARNING';
}

// ============================================================================
// PURE EXPLANATION MAPPER
// ============================================================================

/**
 * Creates human-readable registration readiness explanation from eligibility result.
 * 
 * PURE FUNCTION - NO SIDE EFFECTS:
 * - Does not mutate input
 * - Does not call fetch, axios, prisma, turso, libsql
 * - Does not use localStorage, sessionStorage
 * - Does not unlock deploy
 * - Does not perform registration (explanation only)
 * - Does not create REGISTERED_IN_MEMORY objects
 * - Does not create registration payloads
 * - Does not preview state transitions
 * 
 * DETERMINISTIC:
 * - Returns identical output for identical input
 * - No random values
 * - No timestamps
 * - No external state reads
 * 
 * @param eligibility - Registration eligibility result from Task 8C-2A
 * @returns Human-readable readiness explanation with primitive-only fields
 */
export function createRegistrationReadinessExplanation(
  eligibility: CanonicalReAuditRegistrationEligibilityResult
): CanonicalReAuditRegistrationReadinessExplanation {
  // Extract eligibility status
  const eligible = eligibility.canRegister;
  const blockReasons = eligibility.blockReasons;
  const preconditions = eligibility.preconditions;
  
  // Compute severity
  const severity = getRegistrationReadinessSeverity(blockReasons);
  
  // Generate block reason labels
  const blockReasonLabels = blockReasons.map(reason =>
    getRegistrationBlockReasonLabel(reason)
  );
  
  // Generate remediation hints
  const remediationHints = blockReasons.map(reason =>
    getRegistrationBlockReasonHint(reason)
  );
  
  // Generate title
  const title = eligible
    ? 'Registration Ready'
    : `Registration Blocked (${blockReasons.length} ${blockReasons.length === 1 ? 'issue' : 'issues'})`;
  
  // Generate summary
  let summary: string;
  if (eligible) {
    summary = 'Canonical re-audit result is eligible for registration. All preconditions passed.';
  } else {
    summary = `Canonical re-audit result is not eligible for registration. ${blockReasons.length} ${blockReasons.length === 1 ? 'issue' : 'issues'} must be resolved before registration can proceed.`;
  }
  
  // Generate precondition summary
  const passedCount = Object.values(preconditions).filter(v => v === true).length;
  const totalCount = Object.keys(preconditions).length;
  const preconditionSummary = `${passedCount} of ${totalCount} preconditions passed`;
  
  // Return primitive-only explanation
  return {
    eligible,
    readyForRegistration: eligible,
    severity,
    title,
    summary,
    blockReasonLabels,
    remediationHints,
    preconditionSummary,
    blockReasonCount: blockReasons.length,
    informationalOnly: true,
    registrationExecutionAllowed: false,
    deployRemainsLocked: true,
    persistenceAllowed: false,
    mutationAllowed: false
  };
}
