import {
  CanonicalReAuditRequest,
  CanonicalReAuditResult,
  CanonicalReAuditBlockedReason,
  createCanonicalReAuditBlockedResult,
} from "lib/editorial/canonical-reaudit-types";

// Internal lock to prevent concurrent execution
let isLocked = false;

/**
 * Fail-closed canonical re-audit handler scaffold.
 * Does NOT run real audit, mutate globalAudit, or unlock deploy.
 */
export function startCanonicalReAudit(request: CanonicalReAuditRequest): CanonicalReAuditResult {
  if (isLocked) {
    return createCanonicalReAuditBlockedResult({
      reason: CanonicalReAuditBlockedReason.CONCURRENT_EXECUTION,
      message: "Canonical re-audit is already running (scaffold lock).",
      deployUnlockAllowed: false,
      globalAuditOverwriteAllowed: false,
      backendPersistenceAllowed: false,
      sessionAuditInheritanceAllowed: false,
      memoryOnly: true,
    });
  }
  isLocked = true;
  try {
    // Minimal input validation (fail-closed)
    if (!request) {
      return createCanonicalReAuditBlockedResult({
        reason: CanonicalReAuditBlockedReason.INVALID_REQUEST,
        message: "Request object is missing.",
        deployUnlockAllowed: false,
        globalAuditOverwriteAllowed: false,
        backendPersistenceAllowed: false,
        sessionAuditInheritanceAllowed: false,
        memoryOnly: true,
      });
    }
    if (request.manualTrigger !== true) {
      return createCanonicalReAuditBlockedResult({
        reason: CanonicalReAuditBlockedReason.INVALID_TRIGGER,
        message: "Manual trigger is required.",
        deployUnlockAllowed: false,
        globalAuditOverwriteAllowed: false,
        backendPersistenceAllowed: false,
        sessionAuditInheritanceAllowed: false,
        memoryOnly: true,
      });
    }
    if (request.memoryOnly !== true) {
      return createCanonicalReAuditBlockedResult({
        reason: CanonicalReAuditBlockedReason.MEMORY_ONLY_REQUIRED,
        message: "Handler only supports memory-only execution.",
        deployUnlockAllowed: false,
        globalAuditOverwriteAllowed: false,
        backendPersistenceAllowed: false,
        sessionAuditInheritanceAllowed: false,
        memoryOnly: true,
      });
    }
    if (request.deployUnlockAllowed !== false) {
      return createCanonicalReAuditBlockedResult({
        reason: CanonicalReAuditBlockedReason.DEPLOY_UNLOCK_FORBIDDEN,
        message: "Deploy unlock is forbidden in scaffold.",
        deployUnlockAllowed: false,
        globalAuditOverwriteAllowed: false,
        backendPersistenceAllowed: false,
        sessionAuditInheritanceAllowed: false,
        memoryOnly: true,
      });
    }
    if (request.backendPersistenceAllowed !== false) {
      return createCanonicalReAuditBlockedResult({
        reason: CanonicalReAuditBlockedReason.BACKEND_PERSISTENCE_FORBIDDEN,
        message: "Backend persistence is forbidden in scaffold.",
        deployUnlockAllowed: false,
        globalAuditOverwriteAllowed: false,
        backendPersistenceAllowed: false,
        sessionAuditInheritanceAllowed: false,
        memoryOnly: true,
      });
    }
    if (request.sessionAuditInheritanceAllowed !== false) {
      return createCanonicalReAuditBlockedResult({
        reason: CanonicalReAuditBlockedReason.SESSION_AUDIT_INHERITANCE_FORBIDDEN,
        message: "Session audit inheritance is forbidden in scaffold.",
        deployUnlockAllowed: false,
        globalAuditOverwriteAllowed: false,
        backendPersistenceAllowed: false,
        sessionAuditInheritanceAllowed: false,
        memoryOnly: true,
      });
    }
    if (!request.canonicalSnapshot) {
      return createCanonicalReAuditBlockedResult({
        reason: CanonicalReAuditBlockedReason.MISSING_CANONICAL_SNAPSHOT,
        message: "Canonical snapshot is required.",
        deployUnlockAllowed: false,
        globalAuditOverwriteAllowed: false,
        backendPersistenceAllowed: false,
        sessionAuditInheritanceAllowed: false,
        memoryOnly: true,
      });
    }
    if (request.canonicalSnapshot.source !== "canonical-vault") {
      return createCanonicalReAuditBlockedResult({
        reason: CanonicalReAuditBlockedReason.INVALID_SNAPSHOT_SOURCE,
        message: "Canonical snapshot source must be 'canonical-vault'.",
        deployUnlockAllowed: false,
        globalAuditOverwriteAllowed: false,
        backendPersistenceAllowed: false,
        sessionAuditInheritanceAllowed: false,
        memoryOnly: true,
      });
    }
    // Always fail-closed: scaffold does not run real audit
    return createCanonicalReAuditBlockedResult({
      reason: CanonicalReAuditBlockedReason.AUDIT_RUNNER_UNAVAILABLE,
      message: "Canonical re-audit execution is scaffolded and not yet implemented.",
      deployUnlockAllowed: false,
      globalAuditOverwriteAllowed: false,
      backendPersistenceAllowed: false,
      sessionAuditInheritanceAllowed: false,
      memoryOnly: true,
    });
  } finally {
    isLocked = false;
  }
}
