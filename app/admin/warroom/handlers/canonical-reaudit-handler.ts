import {
  CanonicalReAuditBlockReason,
  CanonicalReAuditStatus,
  createCanonicalReAuditBlockedResult,
} from "lib/editorial/canonical-reaudit-types";
import type {
  CanonicalReAuditRequest,
  CanonicalReAuditResult,
  CanonicalReAuditSnapshotIdentity,
} from "lib/editorial/canonical-reaudit-types";

// Internal lock to prevent concurrent execution
let isLocked = false;

const createFallbackSnapshot = (): CanonicalReAuditSnapshotIdentity => ({
  contentHash: "UNAVAILABLE",
  ledgerSequence: -1,
  capturedAt: new Date().toISOString(),
  source: "canonical-vault",
});

const getSnapshot = (request?: CanonicalReAuditRequest | null): CanonicalReAuditSnapshotIdentity =>
  request?.canonicalSnapshot ?? createFallbackSnapshot();

const getAuditor = (request?: CanonicalReAuditRequest | null): string => {
  if (request && typeof request.operatorId === "string" && request.operatorId.trim().length > 0) {
    return request.operatorId;
  }
  return "UNKNOWN";
};

const createBlockedResult = (
  request: CanonicalReAuditRequest | null | undefined,
  reason: CanonicalReAuditBlockReason,
  message: string
): CanonicalReAuditResult => {
  const errors = message ? [message] : undefined;
  const blocked = createCanonicalReAuditBlockedResult(getSnapshot(request), reason, getAuditor(request), errors);
  return {
    ...blocked,
    status: CanonicalReAuditStatus.BLOCKED,
    blockReason: reason,
  };
};

/**
 * Fail-closed canonical re-audit handler scaffold.
 * Does NOT run real audit, mutate globalAudit, or unlock deploy.
 */
export function startCanonicalReAudit(request: CanonicalReAuditRequest): CanonicalReAuditResult {
  if (isLocked) {
    return createBlockedResult(
      request,
      CanonicalReAuditBlockReason.AUDIT_RUNNER_UNAVAILABLE,
      "Canonical re-audit is already running (scaffold lock)."
    );
  }
  isLocked = true;
  try {
    // Minimal input validation (fail-closed)
    if (!request) {
      return createBlockedResult(request, CanonicalReAuditBlockReason.UNKNOWN, "Request object is missing.");
    }
    if (request.manualTrigger !== true) {
      return createBlockedResult(request, CanonicalReAuditBlockReason.UNKNOWN, "Manual trigger is required.");
    }
    if (request.memoryOnly !== true) {
      return createBlockedResult(
        request,
        CanonicalReAuditBlockReason.BACKEND_FORBIDDEN,
        "Handler only supports memory-only execution."
      );
    }
    if (request.deployUnlockAllowed !== false) {
      return createBlockedResult(
        request,
        CanonicalReAuditBlockReason.DEPLOY_UNLOCK_FORBIDDEN,
        "Deploy unlock is forbidden in scaffold."
      );
    }
    if (request.backendPersistenceAllowed !== false) {
      return createBlockedResult(
        request,
        CanonicalReAuditBlockReason.BACKEND_FORBIDDEN,
        "Backend persistence is forbidden in scaffold."
      );
    }
    if (request.sessionAuditInheritanceAllowed !== false) {
      return createBlockedResult(
        request,
        CanonicalReAuditBlockReason.SESSION_AUDIT_INHERITANCE_FORBIDDEN,
        "Session audit inheritance is forbidden in scaffold."
      );
    }
    if (!request.canonicalSnapshot) {
      return createBlockedResult(
        request,
        CanonicalReAuditBlockReason.SNAPSHOT_MISSING,
        "Canonical snapshot is required."
      );
    }
    if (request.canonicalSnapshot.source !== "canonical-vault") {
      return createBlockedResult(
        request,
        CanonicalReAuditBlockReason.SNAPSHOT_MISMATCH,
        "Canonical snapshot source must be 'canonical-vault'."
      );
    }
    // Always fail-closed: scaffold does not run real audit
    return createBlockedResult(
      request,
      CanonicalReAuditBlockReason.AUDIT_RUNNER_UNAVAILABLE,
      "Canonical re-audit execution is scaffolded and not yet implemented."
    );
  } finally {
    isLocked = false;
  }
}
