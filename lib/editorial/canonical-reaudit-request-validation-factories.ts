/**
 * Canonical Re-Audit Request Validation Factories
 *
 * Pure factory functions for creating validation errors and results.
 * No validation logic — only object construction.
 */

import type {
  CanonicalReAuditRequestValidationError,
  CanonicalReAuditRequestValidationErrorCode,
  CanonicalReAuditRequestValidationResult,
} from "./canonical-reaudit-request-validation-result";

/**
 * Creates a validation error.
 * Pure factory — does not validate inputs.
 */
export function createCanonicalReAuditRequestValidationError(
  code: CanonicalReAuditRequestValidationErrorCode,
  fieldPath: readonly string[],
  message: string,
  remediationHint: string
): CanonicalReAuditRequestValidationError {
  return {
    code,
    fieldPath,
    message,
    remediationHint,
  };
}

/**
 * Creates a validation result.
 * Pure factory — does not validate inputs.
 */
export function createCanonicalReAuditRequestValidationResult(
  valid: boolean,
  errors: readonly CanonicalReAuditRequestValidationError[]
): CanonicalReAuditRequestValidationResult {
  return {
    __kind: "canonical-reaudit-request-validation-result",
    valid,
    errors,
  };
}
