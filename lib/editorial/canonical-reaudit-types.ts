/**
 * Canonical Re-Audit - Type Contracts
 *
 * This module defines type-only contracts for the canonical re-audit phase.
 * It contains NO runtime logic, NO UI wiring, NO audit runner calls.
 */

/**
 * Status of the canonical re-audit process.
 */
export enum CanonicalReAuditStatus {
  NOT_RUN = 'NOT_RUN',
  RUNNING = 'RUNNING',
  PASSED_PENDING_ACCEPTANCE = 'PASSED_PENDING_ACCEPTANCE',
  FAILED_PENDING_REVIEW = 'FAILED_PENDING_REVIEW',
  STALE = 'STALE',
  BLOCKED = 'BLOCKED'
}

/**
 * Reasons why the canonical re-audit might be blocked.
 */
export enum CanonicalReAuditBlockReason {
  MISSING_CANONICAL_VAULT = 'MISSING_CANONICAL_VAULT',
  MISSING_PROMOTION_ARCHIVE = 'MISSING_PROMOTION_ARCHIVE',
  SNAPSHOT_MISSING = 'SNAPSHOT_MISSING',
  SNAPSHOT_MISMATCH = 'SNAPSHOT_MISMATCH',
  AUDIT_RUNNER_UNAVAILABLE = 'AUDIT_RUNNER_UNAVAILABLE',
  AUDIT_RUNNER_FAILED = 'AUDIT_RUNNER_FAILED',
  STALE_RESULT = 'STALE_RESULT',
  BACKEND_FORBIDDEN = 'BACKEND_FORBIDDEN',
  DEPLOY_UNLOCK_FORBIDDEN = 'DEPLOY_UNLOCK_FORBIDDEN',
  SESSION_AUDIT_INHERITANCE_FORBIDDEN = 'SESSION_AUDIT_INHERITANCE_FORBIDDEN',
  UNKNOWN = 'UNKNOWN'
}

/**
 * Identity of the snapshot being audited.
 */
export interface CanonicalReAuditSnapshotIdentity {
  contentHash: string;
  ledgerSequence: number;
  promotionId?: string;
  capturedAt: string;
  source: 'canonical-vault';
}

/**
 * Request to initiate a canonical re-audit.
 */
export interface CanonicalReAuditRequest {
  articleId: string;
  operatorId: string;
  requestedAt: string;
  canonicalSnapshot: CanonicalReAuditSnapshotIdentity;
  promotionArchiveId?: string;
  promotionId?: string;
  manualTrigger: true;
  memoryOnly: true;
  deployUnlockAllowed: false;
  backendPersistenceAllowed: false;
  sessionAuditInheritanceAllowed: false;
}

/**
 * Intermediate result of a canonical re-audit before it is finalized/accepted.
 */
export interface PendingCanonicalReAuditResult {
  status: CanonicalReAuditStatus;
  success: boolean;
  passed: boolean;
  readyForAcceptance: boolean;
  deployRemainsLocked: true;
  globalAuditOverwriteAllowed: false;
  backendPersistenceAllowed: false;
  memoryOnly: true;
  sessionAuditInherited: false;
  auditedSnapshot: CanonicalReAuditSnapshotIdentity;
  promotionId?: string;
  auditedAt: string;
  auditor: string;
  findings?: unknown[];
  summary?: string;
  blockReason?: CanonicalReAuditBlockReason;
  errors?: string[];
}

/**
 * Final result of a canonical re-audit.
 */
export type CanonicalReAuditResult =
  | (PendingCanonicalReAuditResult & { status: CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE | CanonicalReAuditStatus.FAILED_PENDING_REVIEW })
  | (PendingCanonicalReAuditResult & { status: CanonicalReAuditStatus.BLOCKED; blockReason: CanonicalReAuditBlockReason })
  | (PendingCanonicalReAuditResult & { status: CanonicalReAuditStatus.STALE });

// ============================================================================
// SAFETY CONSTANTS
// ============================================================================

export const CANONICAL_REAUDIT_MEMORY_ONLY = true;
export const CANONICAL_REAUDIT_DEPLOY_UNLOCK_ALLOWED = false;
export const CANONICAL_REAUDIT_GLOBAL_AUDIT_OVERWRITE_ALLOWED = false;
export const CANONICAL_REAUDIT_SESSION_AUDIT_INHERITANCE_ALLOWED = false;

// ============================================================================
// PURE HELPER FACTORY FUNCTIONS
// ============================================================================

/**
 * Creates a pure canonical snapshot identity.
 */
export function createCanonicalSnapshotIdentity(
  contentHash: string,
  ledgerSequence: number,
  promotionId?: string,
  capturedAt?: string
): CanonicalReAuditSnapshotIdentity {
  return {
    contentHash,
    ledgerSequence,
    promotionId,
    capturedAt: capturedAt || new Date().toISOString(),
    source: 'canonical-vault'
  };
}

/**
 * Verifies if two canonical snapshot identities match exactly.
 * Fail closed if either is null or undefined.
 */
export function verifyCanonicalSnapshotIdentityMatch(
  a: CanonicalReAuditSnapshotIdentity | null | undefined,
  b: CanonicalReAuditSnapshotIdentity | null | undefined
): boolean {
  if (!a || !b) return false;

  return (
    a.contentHash === b.contentHash &&
    a.ledgerSequence === b.ledgerSequence &&
    a.capturedAt === b.capturedAt &&
    a.source === b.source &&
    a.promotionId === b.promotionId
  );
}

/**
 * Gets the canonical snapshot from a request or returns a fail-closed fallback.
 */
export function getCanonicalSnapshot(
  request: CanonicalReAuditRequest | null | undefined
): CanonicalReAuditSnapshotIdentity {
  if (request?.canonicalSnapshot) {
    return request.canonicalSnapshot;
  }

  return {
    contentHash: 'MISSING_CANONICAL_SNAPSHOT',
    ledgerSequence: -1,
    source: 'canonical-vault',
    promotionId: undefined,
    capturedAt: new Date().toISOString()
  };
}

/**
 * Creates a blocked canonical re-audit result.
 */
export function createCanonicalReAuditBlockedResult(
  snapshot: CanonicalReAuditSnapshotIdentity,
  reason: CanonicalReAuditBlockReason,
  auditor: string,
  errors?: string[]
): PendingCanonicalReAuditResult {
  return {
    status: CanonicalReAuditStatus.BLOCKED,
    success: false,
    passed: false,
    readyForAcceptance: false,
    deployRemainsLocked: true,
    globalAuditOverwriteAllowed: false,
    backendPersistenceAllowed: false,
    memoryOnly: true,
    sessionAuditInherited: false,
    auditedSnapshot: snapshot,
    auditedAt: new Date().toISOString(),
    auditor,
    blockReason: reason,
    errors
  };
}

/**
 * Creates a pending canonical re-audit result.
 */
export function createPendingCanonicalReAuditResult(
  snapshot: CanonicalReAuditSnapshotIdentity,
  passed: boolean,
  auditor: string,
  findings?: unknown[],
  summary?: string
): PendingCanonicalReAuditResult {
  return {
    status: passed ? CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE : CanonicalReAuditStatus.FAILED_PENDING_REVIEW,
    success: passed,
    passed,
    readyForAcceptance: passed,
    deployRemainsLocked: true,
    globalAuditOverwriteAllowed: false,
    backendPersistenceAllowed: false,
    memoryOnly: true,
    sessionAuditInherited: false,
    auditedSnapshot: snapshot,
    auditedAt: new Date().toISOString(),
    auditor,
    findings,
    summary
  };
}

/**
 * Creates a stale canonical re-audit result.
 */
export function createStaleCanonicalReAuditResult(
  snapshot: CanonicalReAuditSnapshotIdentity,
  auditor: string
): PendingCanonicalReAuditResult {
  return {
    status: CanonicalReAuditStatus.STALE,
    success: false,
    passed: false,
    readyForAcceptance: false,
    deployRemainsLocked: true,
    globalAuditOverwriteAllowed: false,
    backendPersistenceAllowed: false,
    memoryOnly: true,
    sessionAuditInherited: false,
    auditedSnapshot: snapshot,
    auditedAt: new Date().toISOString(),
    auditor,
    blockReason: CanonicalReAuditBlockReason.STALE_RESULT
  };
}
