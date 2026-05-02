/**
 * TYPE ONLY — VALIDATION RESULT CONTRACT FOR FUTURE REGISTRATION PREVIEW ASSESSMENT VALIDATOR.
 * This module must not validate, build, mutate, persist, register, promote, deploy, or authorize anything.
 */

export type CanonicalReAuditRegistrationPreviewAssessmentValidationResultKind =
  "registration-preview-assessment-validation-result";

export type CanonicalReAuditRegistrationPreviewAssessmentValidationErrorCode =
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_KIND"
  | "INVALID_SAFETY_INVARIANT"
  | "INVALID_BOUNDARY_INVARIANT"
  | "INVALID_CHAIN_REFERENCE"
  | "UNSAFE_RUNTIME_FIELD"
  | "FORBIDDEN_MUTATION_FIELD"
  | "FORBIDDEN_DEPLOY_FIELD"
  | "FORBIDDEN_PERSISTENCE_FIELD";

export type CanonicalReAuditRegistrationPreviewAssessmentValidationWarningCode =
  | "UNUSUAL_FIELD_VALUE"
  | "DEPRECATED_FIELD"
  | "MISSING_OPTIONAL_FIELD"
  | "SUSPICIOUS_PATTERN";

export type CanonicalReAuditRegistrationPreviewAssessmentValidationSafetyFlag =
  | "DEPLOY_UNLOCK_FORBIDDEN"
  | "PERSISTENCE_FORBIDDEN"
  | "MUTATION_FORBIDDEN";

export interface CanonicalReAuditRegistrationPreviewAssessmentValidationError {
  readonly code: CanonicalReAuditRegistrationPreviewAssessmentValidationErrorCode;
  readonly fieldPath: readonly string[];
  readonly message: string;
  readonly remediationHint: string;
}

export interface CanonicalReAuditRegistrationPreviewAssessmentValidationWarning {
  readonly code: CanonicalReAuditRegistrationPreviewAssessmentValidationWarningCode;
  readonly fieldPath: readonly string[];
  readonly message: string;
}

export interface CanonicalReAuditRegistrationPreviewAssessmentValidationSafety {
  readonly deployUnlockForbidden: true;
  readonly persistenceForbidden: true;
  readonly mutationForbidden: true;
  readonly validatorBuildsObjects: false;
  readonly validatorMutatesInput: false;
  readonly validatorPersistsState: false;
  readonly validatorUnlocksDeploy: false;
}

export interface CanonicalReAuditRegistrationPreviewAssessmentValidationResult {
  readonly __kind: CanonicalReAuditRegistrationPreviewAssessmentValidationResultKind;
  readonly valid: boolean;
  readonly errors: readonly CanonicalReAuditRegistrationPreviewAssessmentValidationError[];
  readonly warnings: readonly CanonicalReAuditRegistrationPreviewAssessmentValidationWarning[];
  readonly safety: CanonicalReAuditRegistrationPreviewAssessmentValidationSafety;
  readonly safetyFlags: readonly CanonicalReAuditRegistrationPreviewAssessmentValidationSafetyFlag[];
}
