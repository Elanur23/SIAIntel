/**
 * Canonical Re-Audit Registration State - Type Contracts
 *
 * This module defines the compile-time governance state model for the registration
 * and promotion lifecycle of canonical re-audit results.
 *
 * CRITICAL SAFETY BOUNDARIES:
 * - PURE TYPE DEFINITIONS ONLY.
 * - NO RUNTIME LOGIC.
 * - NO UI WIRING.
 * - NO PERSISTENCE / BACKEND CALLS.
 * - NO DEPLOY UNLOCK RUNTIME LOGIC.
 * - NO VAULT OR GLOBALAUDIT MUTATION.
 */

import type {
  CanonicalReAuditStatus,
  CanonicalReAuditSnapshotIdentity
} from './canonical-reaudit-types';
import type {
  CanonicalReAuditAcceptanceEligibilityResult
} from './canonical-reaudit-acceptance-types';

/**
 * 1. Governance Stage Union
 *
 * Defines the logical stages of a canonical re-audit result as it moves
 * toward (but not necessarily through) production deployment.
 */
export type CanonicalReAuditGovernanceStage =
  | "AUDIT_PASSED"
  | "ELIGIBILITY_EVALUATED"
  | "REGISTERED_IN_MEMORY"
  | "PROMOTION_PREPARED"
  | "PROMOTED_TO_GLOBAL"
  | "DEPLOY_UNLOCKED";

/**
 * Base safety invariants required for all pre-deploy governance states.
 */
export interface CanonicalReAuditSafetyInvariants {
  readonly memoryOnly: true;
  readonly deployRemainsLocked: true;
  readonly persistenceAllowed: false;
  readonly vaultMutationAllowed: false;
}

/**
 * 2. Registration State Union
 *
 * A discriminated union representing the state of a re-audit result
 * within the registration lifecycle.
 */
export type CanonicalReAuditRegistrationState =
  | CanonicalReAuditEligibilityEvaluatedState
  | CanonicalReAuditRegisteredInMemoryState
  | CanonicalReAuditPromotionPreparedState
  | CanonicalReAuditPromotedToGlobalState
  | CanonicalReAuditDeployUnlockedState;

/**
 * State: ELIGIBILITY_EVALUATED
 */
export interface CanonicalReAuditEligibilityEvaluatedState extends CanonicalReAuditSafetyInvariants {
  readonly stage: "ELIGIBILITY_EVALUATED";
  readonly eligibility: CanonicalReAuditAcceptanceEligibilityResult;
  readonly globalAuditOverwriteAllowed: false;
  readonly productionAuthorizationAllowed: false;
}

/**
 * 3. Registered-in-memory state
 *
 * State: REGISTERED_IN_MEMORY
 */
export interface CanonicalReAuditRegisteredInMemoryState extends CanonicalReAuditSafetyInvariants {
  readonly stage: "REGISTERED_IN_MEMORY";
  readonly registeredAt: string;
  readonly registeredBy?: string | null;
  readonly sourceResultStatus: CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE;
  readonly auditedSnapshot: CanonicalReAuditSnapshotIdentity;
  readonly currentSnapshot: CanonicalReAuditSnapshotIdentity | null;
  readonly eligibilityAtRegistration: CanonicalReAuditAcceptanceEligibilityResult;
  readonly promotionRequired: true;
  readonly globalAuditOverwriteAllowed: false;
  readonly productionAuthorizationAllowed: false;
}

/**
 * State: PROMOTION_PREPARED
 */
export interface CanonicalReAuditPromotionPreparedState extends CanonicalReAuditSafetyInvariants {
  readonly stage: "PROMOTION_PREPARED";
  readonly preparedAt: string;
  readonly promotionRequired: true;
  readonly globalAuditOverwriteAllowed: false;
  readonly productionAuthorizationAllowed: false;
}

/**
 * State: PROMOTED_TO_GLOBAL
 */
export interface CanonicalReAuditPromotedToGlobalState extends CanonicalReAuditSafetyInvariants {
  readonly stage: "PROMOTED_TO_GLOBAL";
  readonly promotedAt: string;
  readonly globalAuditOverwriteAllowed: true; // Allowed in this specific stage type context
  readonly productionAuthorizationAllowed: false;
}

/**
 * State: DEPLOY_UNLOCKED
 *
 * Note: This state is for type-contract modeling only.
 */
export interface CanonicalReAuditDeployUnlockedState {
  readonly stage: "DEPLOY_UNLOCKED";
  readonly unlockedAt: string;
  readonly deployRemainsLocked: false;
  readonly memoryOnly: false;
}

/**
 * 4. Promotion payload type contract only
 *
 * Defines the structure of a promotion payload without implementing a builder.
 */
export interface CanonicalReAuditPromotionPayloadContract {
  readonly sourceStage: "REGISTERED_IN_MEMORY";
  readonly targetStage: "PROMOTION_PREPARED";
  readonly sourceResultStatus: CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE;
  readonly auditedSnapshot: CanonicalReAuditSnapshotIdentity;
  readonly currentSnapshot: CanonicalReAuditSnapshotIdentity | null;
  readonly snapshotMatchRequired: true;
  readonly previousGlobalAuditRef?: unknown;
  readonly summary?: string;
  readonly findings?: unknown[];
  readonly memoryOnly: true;
  readonly deployRemainsLocked: true;
  readonly globalAuditOverwriteAllowed: false;
  readonly vaultMutationAllowed: false;
  readonly persistenceAllowed: false;
  readonly deployUnlockAllowed: false;
}

/**
 * 5. Transition Type
 *
 * Defines the allowed transitions between governance stages.
 * The type system should be used to prevent direct skip transitions.
 */
export type CanonicalReAuditAllowedTransition =
  | { from: "ELIGIBILITY_EVALUATED"; to: "REGISTERED_IN_MEMORY" }
  | { from: "REGISTERED_IN_MEMORY"; to: "PROMOTION_PREPARED" }
  | { from: "PROMOTION_PREPARED"; to: "PROMOTED_TO_GLOBAL" }
  | { from: "PROMOTED_TO_GLOBAL"; to: "DEPLOY_UNLOCKED" };

/**
 * ILLEGAL TRANSITIONS (Documentation via Type Exclusion)
 *
 * The following transitions are explicitly NOT allowed by CanonicalReAuditAllowedTransition:
 * - REGISTERED_IN_MEMORY -> DEPLOY_UNLOCKED
 * - ELIGIBILITY_EVALUATED -> PROMOTED_TO_GLOBAL
 * - AUDIT_PASSED -> DEPLOY_UNLOCKED
 */

/**
 * 6. View Model Type
 *
 * For read-only UI display of the acceptance gate status.
 */
export interface CanonicalReAuditAcceptanceGateViewModel {
  readonly stage: CanonicalReAuditGovernanceStage;
  readonly label: string;
  readonly locked: true;
  readonly informationalOnly: true;
  readonly deployRemainsLocked: true;
  readonly globalAuditUpdated: false;
  readonly persistenceAllowed: false;
  readonly promotionRequired: true;
  readonly blockReasons?: readonly string[];
}
