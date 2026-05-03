/**
 * Canonical Re-Audit Request Validator
 *
 * Pure validator for CanonicalReAuditRequest objects.
 *
 * STRICT RULES:
 * - Use guards only
 * - Use factories only
 * - No object creation {}
 * - No mutation
 * - No logging
 * - No async
 * - No external access
 * - Root input check -> fail-fast
 * - All other checks -> collect ALL errors
 * - Fixed order execution
 * - Deterministic output
 * - Return ONLY ValidationResult via factory
 *
 * VALIDATION CHECKS:
 * 1. Input is plain object (fail-fast)
 * 2. Required string fields: articleId, operatorId, requestedAt
 * 3. Required snapshot structure: canonicalSnapshot with contentHash, ledgerSequence, source, capturedAt
 * 4. Required boolean flags: manualTrigger, memoryOnly, deployUnlockAllowed, backendPersistenceAllowed, sessionAuditInheritanceAllowed
 * 5. Flag values must be correct (manualTrigger=true, memoryOnly=true, others=false)
 * 6. Optional fields: promotionArchiveId (string), promotionId (string)
 */

import type {
  CanonicalReAuditRequestValidationResult,
  CanonicalReAuditRequestValidationError,
} from "./canonical-reaudit-request-validation-result";

import {
  isPlainRecord,
  hasOwnStringField,
  hasOwnBooleanField,
  hasOwnLiteralField,
  isValidISOTimestamp,
  hasValidSnapshotStructure,
} from "./canonical-reaudit-request-validation-guards";

import {
  createCanonicalReAuditRequestValidationError,
  createCanonicalReAuditRequestValidationResult,
} from "./canonical-reaudit-request-validation-factories";

/**
 * Validate a Canonical Re-Audit Request.
 *
 * Pure, synchronous, deterministic validator.
 *
 * @param input - Unknown input to validate
 * @returns Validation result with errors
 */
export function validateCanonicalReAuditRequest(
  input: unknown
): CanonicalReAuditRequestValidationResult {
  // =========================================================================
  // ROOT INPUT CHECK (FAIL-FAST)
  // =========================================================================
  if (!isPlainRecord(input)) {
    return createCanonicalReAuditRequestValidationResult(
      false,
      [
        createCanonicalReAuditRequestValidationError(
          "INVALID_TYPE",
          [],
          "Input must be a plain object (not null, not array)",
          "Ensure input is a plain JavaScript object"
        ),
      ]
    );
  }

  const record = input as Record<string, any>;

  // =========================================================================
  // ALL OTHER CHECKS (COLLECT ALL ERRORS)
  // =========================================================================
  const errors: CanonicalReAuditRequestValidationError[] = [];

  // ── Check 1: Required string fields ──────────────────────────────────────
  if (!hasOwnStringField(record, "articleId")) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "MISSING_REQUIRED_FIELD",
        ["articleId"],
        "articleId is required and must be a string",
        "Provide a non-empty string for articleId"
      )
    );
  }

  if (!hasOwnStringField(record, "operatorId")) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "MISSING_REQUIRED_FIELD",
        ["operatorId"],
        "operatorId is required and must be a string",
        "Provide a non-empty string for operatorId"
      )
    );
  }

  if (!hasOwnStringField(record, "requestedAt")) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "MISSING_REQUIRED_FIELD",
        ["requestedAt"],
        "requestedAt is required and must be a string",
        "Provide an ISO 8601 timestamp for requestedAt"
      )
    );
  } else if (!isValidISOTimestamp(record.requestedAt)) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "INVALID_TIMESTAMP",
        ["requestedAt"],
        "requestedAt must be a valid ISO 8601 timestamp",
        "Use new Date().toISOString() format"
      )
    );
  }

  // ── Check 2: Canonical snapshot structure ────────────────────────────────
  if (!("canonicalSnapshot" in record) || record.canonicalSnapshot == null) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "MISSING_REQUIRED_FIELD",
        ["canonicalSnapshot"],
        "canonicalSnapshot is required",
        "Provide a CanonicalReAuditSnapshotIdentity for canonicalSnapshot"
      )
    );
  } else {
    const snapshot = record.canonicalSnapshot;
    if (!isPlainRecord(snapshot)) {
      errors.push(
        createCanonicalReAuditRequestValidationError(
          "INVALID_SNAPSHOT_STRUCTURE",
          ["canonicalSnapshot"],
          "canonicalSnapshot must be a plain object",
          "Provide a valid CanonicalReAuditSnapshotIdentity object"
        )
      );
    } else {
      if (snapshot.source !== "canonical-vault") {
        errors.push(
          createCanonicalReAuditRequestValidationError(
            "INVALID_SNAPSHOT_STRUCTURE",
            ["canonicalSnapshot", "source"],
            "canonicalSnapshot.source must be 'canonical-vault'",
            "Set canonicalSnapshot.source to 'canonical-vault'"
          )
        );
      }
      if (!hasValidSnapshotStructure(record)) {
        errors.push(
          createCanonicalReAuditRequestValidationError(
            "INVALID_SNAPSHOT_STRUCTURE",
            ["canonicalSnapshot"],
            "canonicalSnapshot must have contentHash (string), ledgerSequence (number), source ('canonical-vault'), and capturedAt (ISO timestamp)",
            "Provide a valid CanonicalReAuditSnapshotIdentity object"
          )
        );
      }
    }
  }

  // ── Check 3: Required boolean flags ──────────────────────────────────────
  if (!hasOwnBooleanField(record, "manualTrigger")) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "MISSING_REQUIRED_FIELD",
        ["manualTrigger"],
        "manualTrigger is required and must be a boolean",
        "Set manualTrigger to true"
      )
    );
  } else if (!hasOwnLiteralField(record, "manualTrigger", true)) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "INVALID_FLAG_VALUE",
        ["manualTrigger"],
        "manualTrigger must be true",
        "Set manualTrigger to true"
      )
    );
  }

  if (!hasOwnBooleanField(record, "memoryOnly")) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "MISSING_REQUIRED_FIELD",
        ["memoryOnly"],
        "memoryOnly is required and must be a boolean",
        "Set memoryOnly to true"
      )
    );
  } else if (!hasOwnLiteralField(record, "memoryOnly", true)) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "INVALID_FLAG_VALUE",
        ["memoryOnly"],
        "memoryOnly must be true",
        "Set memoryOnly to true"
      )
    );
  }

  if (!hasOwnBooleanField(record, "deployUnlockAllowed")) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "MISSING_REQUIRED_FIELD",
        ["deployUnlockAllowed"],
        "deployUnlockAllowed is required and must be a boolean",
        "Set deployUnlockAllowed to false"
      )
    );
  } else if (!hasOwnLiteralField(record, "deployUnlockAllowed", false)) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "INVALID_FLAG_VALUE",
        ["deployUnlockAllowed"],
        "deployUnlockAllowed must be false",
        "Set deployUnlockAllowed to false"
      )
    );
  }

  if (!hasOwnBooleanField(record, "backendPersistenceAllowed")) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "MISSING_REQUIRED_FIELD",
        ["backendPersistenceAllowed"],
        "backendPersistenceAllowed is required and must be a boolean",
        "Set backendPersistenceAllowed to false"
      )
    );
  } else if (!hasOwnLiteralField(record, "backendPersistenceAllowed", false)) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "INVALID_FLAG_VALUE",
        ["backendPersistenceAllowed"],
        "backendPersistenceAllowed must be false",
        "Set backendPersistenceAllowed to false"
      )
    );
  }

  if (!hasOwnBooleanField(record, "sessionAuditInheritanceAllowed")) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "MISSING_REQUIRED_FIELD",
        ["sessionAuditInheritanceAllowed"],
        "sessionAuditInheritanceAllowed is required and must be a boolean",
        "Set sessionAuditInheritanceAllowed to false"
      )
    );
  } else if (!hasOwnLiteralField(record, "sessionAuditInheritanceAllowed", false)) {
    errors.push(
      createCanonicalReAuditRequestValidationError(
        "INVALID_FLAG_VALUE",
        ["sessionAuditInheritanceAllowed"],
        "sessionAuditInheritanceAllowed must be false",
        "Set sessionAuditInheritanceAllowed to false"
      )
    );
  }

  // ── Check 4: Optional fields (if present, must be strings) ────────────────
  if ("promotionArchiveId" in record && record.promotionArchiveId !== undefined) {
    if (typeof record.promotionArchiveId !== "string") {
      errors.push(
        createCanonicalReAuditRequestValidationError(
          "INVALID_TYPE",
          ["promotionArchiveId"],
          "promotionArchiveId must be a string if provided",
          "Provide a string or omit the field"
        )
      );
    }
  }

  if ("promotionId" in record && record.promotionId !== undefined) {
    if (typeof record.promotionId !== "string") {
      errors.push(
        createCanonicalReAuditRequestValidationError(
          "INVALID_TYPE",
          ["promotionId"],
          "promotionId must be a string if provided",
          "Provide a string or omit the field"
        )
      );
    }
  }

  // =========================================================================
  // RETURN RESULT
  // =========================================================================
  const valid = errors.length === 0;
  return createCanonicalReAuditRequestValidationResult(valid, errors);
}
