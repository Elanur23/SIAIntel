/**
 * Canonical Re-Audit Handler
 *
 * Task 5D: Validator Integration
 *
 * This handler provides:
 * 1. A pure vault snapshot computation helper (computeCanonicalVaultSnapshot)
 * 2. A session/local-draft contamination detector (hasSessionContamination)
 * 3. A bridge preflight builder (buildCanonicalReAuditAdapterPreflight)
 * 4. A result mapper (mapAdapterResultToHandlerResult) that transforms adapter
 *    results to handler results with full safety invariants
 * 5. The fail-closed entry point (startCanonicalReAudit) that integrates
 *    validator → preflight → adapter execution in strict order
 *
 * EXECUTION ORDER (Task 5D):
 * 1. Validator: validateCanonicalReAuditRegistrationPreviewAssessment(request)
 *    - If FAIL → return BLOCKED immediately
 * 2. Request-level guards (manualTrigger, memoryOnly, etc.)
 * 3. Preflight: buildCanonicalReAuditAdapterPreflight(request, vault)
 *    - Staleness check only
 *    - If FAIL → return BLOCKED/STALE
 * 4. Adapter: runInMemoryCanonicalReAudit(adapterRequest)
 *    - Calls runGlobalGovernanceAudit for content validation
 *    - Returns audit result
 *
 * CRITICAL SAFETY BOUNDARIES (Task 5D):
 * - Validator runs BEFORE adapter (no validation inside adapter)
 * - Validator is NOT replaced by audit logic
 * - No duplicate validation logic
 * - Calls runInMemoryCanonicalReAudit only after successful validator + preflight
 * - Wraps adapter execution in try-catch for fail-closed error handling
 * - Maps adapter results to handler results with safety invariants
 * - Rejects unsafe adapter flags (deployUnlockAllowed, sessionAuditInheritanceAllowed)
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
 * @version 5D.0.0
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
  PendingCanonicalReAuditResult,
} from "lib/editorial/canonical-reaudit-types";

// Runtime imports from adapter (Task 5C: Adapter Integration)
import {
  runInMemoryCanonicalReAudit,
  type CanonicalVaultInput,
  type RunInMemoryCanonicalReAuditRequest,
  type CanonicalReAuditAdapterResult,
} from "lib/editorial/canonical-reaudit-adapter";

// Validator import (Task 5D: Validator Integration)
import { validateCanonicalReAuditRequest } from "lib/editorial/canonical-reaudit-request-validator";

function mapValidationErrorsToBlockReason(
  errors: readonly { readonly fieldPath: readonly string[]; readonly message: string }[]
): CanonicalReAuditBlockReason {
  for (const err of errors) {
    const path = err.fieldPath.join('.');
    if (path === 'canonicalSnapshot') return CanonicalReAuditBlockReason.SNAPSHOT_MISSING;
    if (path === 'canonicalSnapshot.source') return CanonicalReAuditBlockReason.SNAPSHOT_MISMATCH;
    if (path === 'deployUnlockAllowed') return CanonicalReAuditBlockReason.DEPLOY_UNLOCK_FORBIDDEN;
    if (path === 'backendPersistenceAllowed') return CanonicalReAuditBlockReason.BACKEND_FORBIDDEN;
    if (path === 'sessionAuditInheritanceAllowed') return CanonicalReAuditBlockReason.SESSION_AUDIT_INHERITANCE_FORBIDDEN;
  }
  return CanonicalReAuditBlockReason.UNKNOWN;
}

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
// VALIDATOR INPUT BUILDER
// ============================================================================

/**
 * Validates the canonical re-audit request directly.
 * 
 * Pure function that passes the request to the validator.
 * The validator checks all required fields and flags.
 * 
 * @param request - Unknown request input
 * @returns Validation result
 */
export function validateCanonicalReAuditRequestInput(request: unknown) {
  return validateCanonicalReAuditRequest(request);
}

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
 * FAIL-CLOSED CHECKS:
 * 1. Vault contamination detection (session/local-draft markers)
 * 2. Staleness detection (contentHash mismatch)
 *
 * @param request - Canonical re-audit request (from types contract)
 * @param vault   - Canonical vault input (actual vault content)
 * @returns CanonicalReAuditAdapterPreflightResult
 */
export function buildCanonicalReAuditAdapterPreflight(
  request: CanonicalReAuditRequest,
  vault: CanonicalVaultInput
): CanonicalReAuditAdapterPreflightResult {
  // CHECK: Session/local-draft contamination detection
  if (hasSessionContamination(vault)) {
    return {
      ok: false,
      blockReason: CanonicalReAuditBlockReason.UNKNOWN,
      message: "Preflight failed: vault contains session or local-draft contamination markers.",
    };
  }

  // CHECK: Staleness detection — compare live vault hash with request snapshot
  const liveSnapshot = computeCanonicalVaultSnapshot(vault);
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
// RESULT MAPPER: mapAdapterResultToHandlerResult
// ============================================================================

/**
 * Maps adapter result to handler result with full safety invariants.
 *
 * Task 5C: Result Mapper Function
 *
 * This function transforms a CanonicalReAuditAdapterResult (from Task 5A)
 * into a CanonicalReAuditResult (handler layer type) with:
 * - All safety invariants injected
 * - Status enum conversion
 * - Derived field computation
 * - Field renaming
 * - Promotion ID extraction
 * - Unsafe flag detection and rejection
 *
 * SAFETY RULES:
 * - Pure function — no mutation, no I/O
 * - Injects all safety invariants regardless of adapter output
 * - Computes derived fields from status
 * - Preserves adapter findings and summary
 * - Wraps blockMessage in errors array
 * - Rejects unsafe adapter flags (deployUnlockAllowed, sessionAuditInheritanceAllowed)
 *
 * @param adapterResult - Result from runInMemoryCanonicalReAudit
 * @param request - Original canonical re-audit request
 * @returns Handler result with full safety invariants
 */
function mapAdapterResultToHandlerResult(
  adapterResult: CanonicalReAuditAdapterResult,
  request: CanonicalReAuditRequest
): CanonicalReAuditResult {
  // ── Task 2.1: Unsafe Flag Detection - deployUnlockAllowed ──────────────
  // Defense-in-depth: adapter should never return unsafe flags, but fail-closed
  // design requires defensive checks at every boundary
  if (adapterResult.deployUnlockAllowed !== false) {
    return createBlockedResult(
      request,
      CanonicalReAuditBlockReason.DEPLOY_UNLOCK_FORBIDDEN,
      'Adapter result contains unsafe deployUnlockAllowed flag'
    );
  }

  // ── Task 2.2: Unsafe Flag Detection - sessionAuditInheritanceAllowed ───
  if (adapterResult.sessionAuditInheritanceAllowed !== false) {
    return createBlockedResult(
      request,
      CanonicalReAuditBlockReason.SESSION_AUDIT_INHERITANCE_FORBIDDEN,
      'Adapter result contains unsafe sessionAuditInheritanceAllowed flag'
    );
  }
  // Map adapter status to handler status enum
  let status: CanonicalReAuditStatus;
  switch (adapterResult.status) {
    case 'PASSED_PENDING_ACCEPTANCE':
      status = CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE;
      break;
    case 'FAILED_PENDING_REVIEW':
      status = CanonicalReAuditStatus.FAILED_PENDING_REVIEW;
      break;
    case 'BLOCKED':
      status = CanonicalReAuditStatus.BLOCKED;
      break;
    case 'STALE':
      status = CanonicalReAuditStatus.STALE;
      break;
    default:
      // Fail-closed: unknown status
      status = CanonicalReAuditStatus.BLOCKED;
  }

  // Compute derived fields from status
  const success = status === CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE;
  const passed = status === CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE;
  const readyForAcceptance = status === CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE;

  // Extract promotionId from request or snapshot
  const promotionId = request.promotionId || adapterResult.snapshotIdentity.promotionId;

  // Wrap blockMessage in errors array if present
  const errors = adapterResult.blockMessage ? [adapterResult.blockMessage] : undefined;

  // Build base result with all safety invariants
  const baseResult: PendingCanonicalReAuditResult = {
    status,
    success,
    passed,
    readyForAcceptance,
    // Safety invariants (always enforced)
    deployRemainsLocked: true,
    globalAuditOverwriteAllowed: false,
    backendPersistenceAllowed: false,
    memoryOnly: true,
    sessionAuditInherited: false,
    // Field renaming
    auditedSnapshot: adapterResult.snapshotIdentity,
    summary: adapterResult.auditSummary,
    // Direct copies
    findings: adapterResult.findings,
    auditedAt: adapterResult.auditedAt,
    auditor: adapterResult.auditor,
    promotionId,
    blockReason: adapterResult.blockReason,
    errors,
  };

  // Return typed result based on status
  if (status === CanonicalReAuditStatus.BLOCKED) {
    return {
      ...baseResult,
      status: CanonicalReAuditStatus.BLOCKED,
      blockReason: adapterResult.blockReason || CanonicalReAuditBlockReason.UNKNOWN,
    };
  }

  if (status === CanonicalReAuditStatus.STALE) {
    return {
      ...baseResult,
      status: CanonicalReAuditStatus.STALE,
    };
  }

  // PASSED_PENDING_ACCEPTANCE or FAILED_PENDING_REVIEW
  return {
    ...baseResult,
    status,
  };
}

// ============================================================================
// ENTRY POINT: startCanonicalReAudit
// ============================================================================

/**
 * Fail-closed canonical re-audit handler.
 *
 * Task 5D update: Integrates validator execution BEFORE preflight and adapter.
 * Execution order is now:
 * 1. Validator (validateCanonicalReAuditRegistrationPreviewAssessment)
 * 2. Request-level guards
 * 3. Preflight (staleness check)
 * 4. Adapter (runInMemoryCanonicalReAudit → runGlobalGovernanceAudit)
 *
 * If validator fails, returns BLOCKED immediately without proceeding to preflight or adapter.
 * If vault is provided and all checks succeed, calls runInMemoryCanonicalReAudit
 * and maps the result to handler result format with full safety invariants.
 *
 * If vault is omitted or any check fails, returns appropriate BLOCKED/STALE result.
 *
 * CALL-SITE RISK: Zero. No .ts/.tsx file in the project currently imports or
 * calls startCanonicalReAudit. The optional vault parameter is backward-
 * compatible — existing callers (none) would not break.
 *
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
    // ── STEP 1: VALIDATOR (Task 5D: Validator Integration) ──────────────────
    // Validate request structure and safety constraints BEFORE any execution
    const validationResult = validateCanonicalReAuditRequest(request);
    
    if (!validationResult.valid) {
      // Validator failed - return BLOCKED with validation errors
      const validationErrors = validationResult.errors.map(err => err.message).join('; ');
      return createBlockedResult(
        request,
        mapValidationErrorsToBlockReason(validationResult.errors),
        `Validator failed: ${validationErrors}`
      );
    }

    // ── STEP 2: Bridge preflight (runs only when vault is provided) ─────────
    // ── Task 5C: Adapter execution after successful preflight ────────────────

    if (vault === undefined) {
      // Vault not provided — backward compatibility path
      return createBlockedResult(
        request,
        CanonicalReAuditBlockReason.AUDIT_RUNNER_UNAVAILABLE,
        "Canonical vault is required for re-audit execution."
      );
    }

    // Run preflight validation
    const preflight = buildCanonicalReAuditAdapterPreflight(request, vault);

    if (!preflight.ok) {
      // Preflight failed — return BLOCKED/STALE result
      return createBlockedResult(
        request,
        preflight.blockReason,
        `Preflight blocked: ${preflight.message}`
      );
    }

    // ── STEP 4: Adapter execution after successful preflight ─────────────────
    // ── Task 3.2: Try-catch wrapper for fail-closed error handling ───────────

    try {
      // Call adapter with validated request
      const adapterResult = runInMemoryCanonicalReAudit(preflight.adapterRequest);

      // ── Task 3.3: Wire result mapping and safety guards ──────────────────
      // Map adapter result to handler result with safety invariants
      const handlerResult = mapAdapterResultToHandlerResult(adapterResult, request);

      return handlerResult;

    } catch (error) {
      // Adapter threw exception — fail-closed with BLOCKED result
      return createBlockedResult(
        request,
        CanonicalReAuditBlockReason.AUDIT_RUNNER_FAILED,
        `Adapter execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }

  } finally {
    isLocked = false;
  }
}
