/**
 * PURE VALIDATION RESULT FACTORIES ONLY.
 * This module may create only validation error, warning, safety, and result objects.
 * It must not validate input, call guards, build preview/assessment objects, mutate, persist, register, promote, deploy, or authorize anything.
 */

import type {
  CanonicalReAuditRegistrationPreviewAssessmentValidationError,
  CanonicalReAuditRegistrationPreviewAssessmentValidationErrorCode,
  CanonicalReAuditRegistrationPreviewAssessmentValidationWarning,
  CanonicalReAuditRegistrationPreviewAssessmentValidationWarningCode,
  CanonicalReAuditRegistrationPreviewAssessmentValidationSafety,
  CanonicalReAuditRegistrationPreviewAssessmentValidationSafetyFlag,
  CanonicalReAuditRegistrationPreviewAssessmentValidationResult,
} from "./canonical-reaudit-registration-preview-assessment-validation-result";

/**
 * Create a validation error object.
 * This is a pure factory — it does not validate inputs.
 */
export function createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
  code: CanonicalReAuditRegistrationPreviewAssessmentValidationErrorCode,
  fieldPath: readonly string[],
  message: string,
  remediationHint: string
): CanonicalReAuditRegistrationPreviewAssessmentValidationError {
  return {
    code,
    fieldPath: [...fieldPath],
    message,
    remediationHint,
  };
}

/**
 * Create a validation warning object.
 * This is a pure factory — it does not validate inputs.
 */
export function createCanonicalReAuditRegistrationPreviewAssessmentValidationWarning(
  code: CanonicalReAuditRegistrationPreviewAssessmentValidationWarningCode,
  fieldPath: readonly string[],
  message: string
): CanonicalReAuditRegistrationPreviewAssessmentValidationWarning {
  return {
    code,
    fieldPath: [...fieldPath],
    message,
  };
}

/**
 * Create a validation safety object with all safety invariants set.
 * This factory returns a constant safety contract.
 */
export function createCanonicalReAuditRegistrationPreviewAssessmentValidationSafety(): CanonicalReAuditRegistrationPreviewAssessmentValidationSafety {
  return {
    deployUnlockForbidden: true,
    persistenceForbidden: true,
    mutationForbidden: true,
    validatorBuildsObjects: false,
    validatorMutatesInput: false,
    validatorPersistsState: false,
    validatorUnlocksDeploy: false,
  };
}

/**
 * Create a validation result object.
 * This is a pure factory — it does not validate inputs.
 */
export function createCanonicalReAuditRegistrationPreviewAssessmentValidationResult(
  valid: boolean,
  errors: readonly CanonicalReAuditRegistrationPreviewAssessmentValidationError[],
  warnings: readonly CanonicalReAuditRegistrationPreviewAssessmentValidationWarning[],
  safetyFlags: readonly CanonicalReAuditRegistrationPreviewAssessmentValidationSafetyFlag[]
): CanonicalReAuditRegistrationPreviewAssessmentValidationResult {
  return {
    __kind: "registration-preview-assessment-validation-result",
    valid,
    errors: [...errors],
    warnings: [...warnings],
    safety: createCanonicalReAuditRegistrationPreviewAssessmentValidationSafety(),
    safetyFlags: [...safetyFlags],
  };
}
