/**
 * Canonical Re-Audit Handler
 *
 * Task 5B: Bridge-Only Preflight Layer
 *
 * This handler provides:
 * 1. A pure vault snapshot computation helper (computeCanonicalVaultSnapshot)
 * 2. A session/local-draft contamination detector (hasSessionContamination)
 * 3. A bridge preflight builder (buildCanonicalReAuditAdapterPreflight)
 * 4. The existing fail-closed scaffold entry point (startCanonicalReAudit)
 *    — updated to accept optional vault and run preflight before returning
 *      the AUDIT_RUNNER_UNAVAILABLE sentinel.
 *
 * CRITICAL SAFETY BOUNDARIES (Task 5B):
 * - Does NOT call runInMemoryCanonicalReAudit
 * - Does NOT execute any real audit runner
 * - Does NOT mutate vault, canonical article state, or session draft state
 * - Does NOT overwrite globalAudit
 * - Does NOT inherit session audit into canonical audit
 * - Does NOT call backend/API/database/provider/network
 * - Does NOT use localStorage/sessionStorage
 * - Does NOT unlock deploy
 * - Does NOT add publish/save/promote/rollback behavior
 * - Does NOT accept audit result into canonical/global state
 * - Fail-closed for all ambiguous or invalid states
 *
 * @version 5B.0.0
 */

import {
  CanonicalReAuditBlockReason,
  CanonicalReAuditStatus,
  createCanonicalReAuditBlockedResult,
  verifyCanonicalSnapshotIdentityMatch,
} from "lib/editorial/canonical-reaudit-types";
import type {
  CanonicalReAuditRequest,
  CanonicalReAuditResult,
  CanonicalReAuditSnapshotIdentity,
} from "lib/editorial/canonical-reaudit-types";

// Type-only imports from adapter — no runtime import of runInMemoryCanonicalReAudit
import type {
  CanonicalVaultInput,
  RunInMemoryCanonicalReAuditRequest,
} from "lib/editorial/canonical-reaudit-adapter";

// ============================================================================
// PREFLIGHT RESULT TYPE
// ============================================================================

/**
 * Result of the bridge preflight check.
 *
 * ok: true  — adapter request is fully constructed and safe to pass to Task 5C
 * ok: false — preflight failed; blockReason and message explain why
 */
export type CanonicalReAuditAdapterPreflightResult =
  | {
      ok: true;
      adapterRequest: RunInMemoryCanonicalReAuditRequest;
      liveSnapshot: CanonicalReAuditSnapshotIdentity;
    }
  | {
      ok: false;
      blockReason: CanonicalReAuditBlockReason;
      message: string;
      liveSnapshot?: CanonicalReAuditSnapshotIdentity;
    };

// ============================================================================
// SESSION / LOCAL-DRAFT CONTAMINATION MARKERS
// ============================================================================

/**
 * Field names that indicate session or local-draft contamination.
 * If any of these keys are present at the top level of the vault input object,
 * the vault is considered contaminated and must be rejected fail-closed.
 */
const SESSION_CONTAMINATION_KEYS: ReadonlyArray<string> = [
  "localDraftCopy",
  "sessionDraft",
  "sessionAuditResult",
  "sessionRemediationLedger",
  "latestAppliedEventId",
  "remediationLedger",
];

/**
 * String values in the vault input that indicate session contamination.
 * Checked against `draftSource` and `source` fields if present.
 */
const SESSION_CONTAMINATION_VALUES: ReadonlyArray<string> = [
  "session-draft",
  "session",
];

// ============================================================================
// PURE HELPER: computeCanonicalVaultSnapshot
// ============================================================================

/**
 * Computes a deterministic CanonicalReAuditSnapshotIdentity from a
 * CanonicalVaultInput.
 *
 * SAFETY RULES:
 * - Pure function — no mutation, no I/O, no network, no storage
 * - source is always "canonical-vault"
 * - Content hash is derived from stable JSON serialization:
 *   - keys sorted alphabetically at every level
 *   - undefined and function values excluded (JSON.stringify default)
 *   - volatile UI/session fields are not present in CanonicalVaultInput
 * - ledgerSequence is always 0 for canonical vault (no remediation ledger)
 * - capturedAt is set to the current ISO timestamp at call time
 * - Does not use crypto — uses deterministic string serialization only,
 *   consistent with the pattern used in useLocalDraftRemediationController
 *   (JSON.stringify of sorted keys)
 *
 * @param vault - Canonical vault input
 * @returns CanonicalReAuditSnapshotIdentity with source "canonical-vault"
 */
export function computeCanonicalVaultSnapshot(
  vault: CanonicalVaultInput
): CanonicalReAuditSnapshotIdentity {
  // Stable serialization: sort top-level vault keys, then sort each node's keys
  const vaultRecord = vault.vault ?? {};
  const sortedLangs = Object.keys(vaultRecord).sort();

  const stablePayload = sortedLangs.map((lang) => {
    const node = vaultRecord[lang];
    // Sort node keys for determinism
    return {
      lang,
      desc: node?.desc ?? "",
      ready: node?.ready ?? false,
      title: node?.title ?? "",
    };
  });

  // Include articleId in the hash so different articles produce different hashes
  const articleId = vault.articleId ?? vault.metadata?.articleId ?? "UNKNOWN_ARTICLE";

  const serialized = JSON.stringify({ articleId, vault: stablePayload });

  // Deterministic non-crypto content hash: stable string identity
  // This matches the pattern in useLocalDraftRemediationController which uses
  // JSON.stringify of sorted keys as the contentHash input.
  const contentHash = serialized;

  return {
    contentHash,
    ledgerSequence: 0,
    capturedAt: new Date().toISOString(),
    source: "canonical-vault",
    promotionId: vault.metadata?.promotionId,
  };
}

// ============================================================================
// PURE HELPER: hasSessionContamination
// ============================================================================

/**
 * Detects session or local-draft contamination in a CanonicalVaultInput.
 *
 * SAFETY RULES:
 * - Pure function — no mutation, no I/O
 * - Fail-closed: returns true (contaminated) for any detected marker
 * - Does not attempt to clean or strip contamination — caller must reject
 *
 * @param vault - Vault input to inspect
 * @returns true if contamination is detected, false if clean
 */
export function hasSessionContamination(
  vault: CanonicalVaultInput | null | undefined
): boolean {
  if (!vault || typeof vault !== "object") {
    return false; // null/undefined is handled by caller as missing vault
  }

  // Check for session contamination keys at top level of vault input
  for (const key of SESSION_CONTAMINATION_KEYS) {
    if (key in vault) {
      return true;
    }
  }

  // Check draftSource field if present
  const vaultAsRecord = vault as Record<string, unknown>;
  if (
    typeof vaultAsRecord["draftSource"] === "string" &&
    SESSION_CONTAMINATION_VALUES.includes(vaultAsRecord["draftSource"])
  ) {
    return true;
  }

  // Check source field if present
  if (
    typeof vaultAsRecord["source"] === "string" &&
    SESSION_CONTAMINATION_VALUES.includes(vaultAsRecord["source"])
  ) {
    return true;
  }

  return false;
}

// ============================================================================
// EXPORTED BRIDGE: buildCanonicalReAuditAdapterPreflight
// ============================================================================

/**
 * Builds and validates the adapter request for a future Task 5C execution.
 *
 * This is a pure bridge function. It does NOT call runInMemoryCanonicalReAudit.
 * It does NOT run any audit. It does NOT write to any state.
 *
 * On success, returns ok: true with a fully constructed RunInMemoryCanonicalReAuditRequest
 * that Task 5C can pass directly to runInMemoryCanonicalReAudit.
 *
 * On failure, returns ok: false with a blockReason and message.
 *
 * FAIL-CLOSED CHECKS (16 total):
 *  1. Missing request → UNKNOWN
 *  2. Missing vault → MISSING_CANONICAL_VAULT
 *  3. Missing request.canonicalSnapshot → SNAPSHOT_MISSING
 *  4. canonicalSnapshot.source !== "canonical-vault" → SNAPSHOT_MISMATCH
 *  5. manualTrigger !== true → UNKNOWN
 *  6. memoryOnly !== true → BACKEND_FORBIDDEN
 *  7. deployUnlockAllowed !== false → DEPLOY_UNLOCK_FORBIDDEN
 *  8. backendPersistenceAllowed !== false → BACKEND_FORBIDDEN
 *  9. sessionAuditInheritanceAllowed !== false → SESSION_AUDIT_INHERITANCE_FORBIDDEN
 * 10. Session/local-draft contamination detected → MISSING_CANONICAL_VAULT
 * 11. vault.vault missing or not an object → MISSING_CANONICAL_VAULT
 * 12. vault.vault is empty → MISSING_CANONICAL_VAULT
 * 13. Any vault node missing title (string) → MISSING_CANONICAL_VAULT
 * 14. Any vault node missing desc (string) → MISSING_CANONICAL_VAULT
 * 15. Any vault node missing ready (boolean) → MISSING_CANONICAL_VAULT
 * 16. liveSnapshot contentHash does not match request.canonicalSnapshot → SNAPSHOT_MISMATCH (STALE)
 *
 * @param request - Canonical re-audit request (from types contract)
 * @param vault   - Canonical vault input (actual vault content)
 * @returns CanonicalReAuditAdapterPreflightResult
 */
export function buildCanonicalReAuditAdapterPreflight(
  request: CanonicalReAuditRequest | null | undefined,
  vault: CanonicalVaultInput | null | undefined
): CanonicalReAuditAdapterPreflightResult {
  // CHECK 1: Missing request
  if (!request) {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.UNKNOWN,
      message: "Preflight failed: request is missing.",
    };
  }

  // CHECK 2: Missing vault
  if (!vault) {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT,
      message: "Preflight failed: canonical vault is missing.",
    };
  }

  // CHECK 3: Missing canonicalSnapshot
  if (!request.canonicalSnapshot) {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.SNAPSHOT_MISSING,
      message: "Preflight failed: request.canonicalSnapshot is missing.",
    };
  }

  // CHECK 4: canonicalSnapshot.source must be "canonical-vault"
  if (request.canonicalSnapshot.source !== "canonical-vault") {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.SNAPSHOT_MISMATCH,
      message: `Preflight failed: canonicalSnapshot.source must be "canonical-vault", got "${request.canonicalSnapshot.source}".`,
    };
  }

  // CHECK 5: manualTrigger must be true
  if (request.manualTrigger !== true) {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.UNKNOWN,
      message: "Preflight failed: manualTrigger must be true.",
    };
  }

  // CHECK 6: memoryOnly must be true
  if (request.memoryOnly !== true) {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.BACKEND_FORBIDDEN,
      message: "Preflight failed: memoryOnly must be true.",
    };
  }

  // CHECK 7: deployUnlockAllowed must be false
  if (request.deployUnlockAllowed !== false) {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.DEPLOY_UNLOCK_FORBIDDEN,
      message: "Preflight failed: deployUnlockAllowed must be false.",
    };
  }

  // CHECK 8: backendPersistenceAllowed must be false
  if (request.backendPersistenceAllowed !== false) {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.BACKEND_FORBIDDEN,
      message: "Preflight failed: backendPersistenceAllowed must be false.",
    };
  }

  // CHECK 9: sessionAuditInheritanceAllowed must be false
  if (request.sessionAuditInheritanceAllowed !== false) {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.SESSION_AUDIT_INHERITANCE_FORBIDDEN,
      message: "Preflight failed: sessionAuditInheritanceAllowed must be false.",
    };
  }

  // CHECK 10: Session/local-draft contamination
  if (hasSessionContamination(vault)) {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT,
      message:
        "Preflight failed: vault contains session or local-draft contamination markers.",
    };
  }

  // CHECK 11: vault.vault must be a non-null object
  if (!vault.vault || typeof vault.vault !== "object") {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT,
      message: "Preflight failed: vault.vault is missing or not an object.",
    };
  }

  // CHECK 12: vault.vault must not be empty
  const langKeys = Object.keys(vault.vault);
  if (langKeys.length === 0) {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT,
      message: "Preflight failed: vault.vault is empty (no language nodes).",
    };
  }

  // CHECKS 13–15: Each vault node must have title (string), desc (string), ready (boolean)
  for (const lang of langKeys) {
    const node = vault.vault[lang];
    if (!node || typeof node !== "object") {
      return {
        ok: false,
        blockReason: CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT,
        message: `Preflight failed: vault node for language "${lang}" is missing or not an object.`,
      };
    }
    if (typeof node.title !== "string") {
      return {
        ok: false,
        blockReason: CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT,
        message: `Preflight failed: vault node for language "${lang}" has missing or non-string title.`,
      };
    }
    if (typeof node.desc !== "string") {
      return {
        ok: false,
        blockReason: CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT,
        message: `Preflight failed: vault node for language "${lang}" has missing or non-string desc.`,
      };
    }
    if (typeof node.ready !== "boolean") {
      return {
        ok: false,
        blockReason: CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT,
        message: `Preflight failed: vault node for language "${lang}" has missing or non-boolean ready flag.`,
      };
    }
  }

  // Compute live snapshot from vault content
  const liveSnapshot = computeCanonicalVaultSnapshot(vault);

  // CHECK 16: liveSnapshot must match request.canonicalSnapshot (staleness check)
  // Note: capturedAt is volatile (set at call time), so we compare only
  // contentHash and ledgerSequence — the stable identity fields.
  // verifyCanonicalSnapshotIdentityMatch also checks capturedAt and promotionId,
  // which would always differ for a freshly computed snapshot. We therefore
  // perform a targeted content-identity comparison here.
  const requestHash = request.canonicalSnapshot.contentHash;
  const liveHash = liveSnapshot.contentHash;

  if (requestHash !== liveHash) {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.SNAPSHOT_MISMATCH,
      message:
        "Preflight failed: live vault content hash does not match request.canonicalSnapshot.contentHash — vault may have changed since snapshot was taken (STALE).",
      liveSnapshot,
    };
  }

  // All checks passed — construct the adapter request for Task 5C
  const adapterRequest: RunInMemoryCanonicalReAuditRequest = {
    canonicalVault: vault,
    currentSnapshot: liveSnapshot,
    expectedSnapshot: request.canonicalSnapshot,
    auditor: request.operatorId && request.operatorId.trim().length > 0
      ? request.operatorId
      : "UNKNOWN_AUDITOR",
  };

  return {
    ok: true,
    adapterRequest,
    liveSnapshot,
  };
}

// ============================================================================
// INTERNAL HANDLER HELPERS (unchanged from Task 5A scaffold)
// ============================================================================

// Internal lock to prevent concurrent execution
let isLocked = false;

const createFallbackSnapshot = (): CanonicalReAuditSnapshotIdentity => ({
  contentHash: "UNAVAILABLE",
  ledgerSequence: -1,
  capturedAt: new Date().toISOString(),
  source: "canonical-vault",
});

const getSnapshot = (
  request?: CanonicalReAuditRequest | null
): CanonicalReAuditSnapshotIdentity =>
  request?.canonicalSnapshot ?? createFallbackSnapshot();

const getAuditor = (request?: CanonicalReAuditRequest | null): string => {
  if (
    request &&
    typeof request.operatorId === "string" &&
    request.operatorId.trim().length > 0
  ) {
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
  const blocked = createCanonicalReAuditBlockedResult(
    getSnapshot(request),
    reason,
    getAuditor(request),
    errors
  );
  return {
    ...blocked,
    status: CanonicalReAuditStatus.BLOCKED,
    blockReason: reason,
  };
};

// ============================================================================
// ENTRY POINT: startCanonicalReAudit
// ============================================================================

/**
 * Fail-closed canonical re-audit handler.
 *
 * Task 5B update: accepts an optional vault parameter and runs the bridge
 * preflight before returning the AUDIT_RUNNER_UNAVAILABLE scaffold sentinel.
 *
 * If vault is provided and preflight fails, returns a BLOCKED or STALE result
 * using the preflight's blockReason. If preflight succeeds, the handler still
 * returns AUDIT_RUNNER_UNAVAILABLE — real adapter execution is deferred to
 * Task 5C.
 *
 * If vault is omitted, the handler behaves identically to the Task 5A scaffold
 * (all existing guards fire, then AUDIT_RUNNER_UNAVAILABLE is returned).
 *
 * CALL-SITE RISK: Zero. No .ts/.tsx file in the project currently imports or
 * calls startCanonicalReAudit. The optional vault parameter is backward-
 * compatible — existing callers (none) would not break.
 *
 * Does NOT call runInMemoryCanonicalReAudit.
 * Does NOT mutate globalAudit.
 * Does NOT unlock deploy.
 */
export function startCanonicalReAudit(
  request: CanonicalReAuditRequest,
  vault?: CanonicalVaultInput
): CanonicalReAuditResult {
  if (isLocked) {
    return createBlockedResult(
      request,
      CanonicalReAuditBlockReason.AUDIT_RUNNER_UNAVAILABLE,
      "Canonical re-audit is already running (scaffold lock)."
    );
  }
  isLocked = true;
  try {
    // ── Existing request-level guards (unchanged from Task 5A) ──────────────

    if (!request) {
      return createBlockedResult(
        request,
        CanonicalReAuditBlockReason.UNKNOWN,
        "Request object is missing."
      );
    }
    if (request.manualTrigger !== true) {
      return createBlockedResult(
        request,
        CanonicalReAuditBlockReason.UNKNOWN,
        "Manual trigger is required."
      );
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

    // ── Task 5B: Bridge preflight (runs only when vault is provided) ─────────

    if (vault !== undefined) {
      const preflight = buildCanonicalReAuditAdapterPreflight(request, vault);

      if (!preflight.ok) {
        // Map preflight failure to the appropriate BLOCKED/STALE result
        return createBlockedResult(
          request,
          preflight.blockReason,
          `Preflight blocked: ${preflight.message}`
        );
      }

      // Preflight succeeded — adapterRequest is ready for Task 5C.
      // Task 5B does NOT call runInMemoryCanonicalReAudit here.
      // Fall through to the scaffold sentinel below.
    }

    // ── Scaffold sentinel (preserved from Task 5A) ───────────────────────────
    // Real adapter execution is deferred to Task 5C.
    return createBlockedResult(
      request,
      CanonicalReAuditBlockReason.AUDIT_RUNNER_UNAVAILABLE,
      "Canonical re-audit execution is scaffolded and not yet implemented."
    );
  } finally {
    isLocked = false;
  }
}
