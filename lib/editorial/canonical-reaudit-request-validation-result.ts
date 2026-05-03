/**
 * Canonical Re-Audit Request Validation Result Types
 *
 * Type contracts for validating CanonicalReAuditRequest objects.
 * Pure type definitions only — no runtime logic.
 */

export type CanonicalReAuditRequestValidationResultKind =
  | "canonical-reaudit-request-validation-result";

export type CanonicalReAuditRequestValidationErrorCode =
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_TYPE"
  | "INVALID_SNAPSHOT_STRUCTURE"
  | "INVALID_FLAG_VALUE"
  | "INVALID_TIMESTAMP"
  | "MUTATION_FORBIDDEN";

export interface CanonicalReAuditRequestValidationError {
  readonly code: CanonicalReAuditRequestValidationErrorCode;
  readonly fieldPath: readonly string[];
  readonly message: string;
  readonly remediationHint: string;
}

export interface CanonicalReAuditRequestValidationResult {
  readonly __kind: CanonicalReAuditRequestValidationResultKind;
  readonly valid: boolean;
  readonly errors: readonly CanonicalReAuditRequestValidationError[];
}
