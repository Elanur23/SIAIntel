/**
 * PURE VALIDATOR COMPOSITION ONLY.
 * 
 * This module composes existing primitive guards and result factories to validate
 * Canonical Re-Audit Registration Preview Assessment objects.
 * 
 * It must not:
 * - Build or create assessment objects
 * - Mutate input
 * - Persist or store anything
 * - Integrate with runtime, UI, handlers, hooks, adapters, or deployment
 * - Use async, Promise, fetch, Date, timers, random values, or network calls
 * - Import React, Next.js, handlers, hooks, adapters, or API routes
 * 
 * This file must:
 * - Be synchronous and deterministic
 * - Be non-mutating (memory-only)
 * - Be fail-closed (invalid by default)
 * - Compose only existing guards and factories
 * - Return validation results using existing factories
 */

import type {
  CanonicalReAuditRegistrationPreviewAssessment,
  CanonicalReAuditRegistrationPreviewAssessmentKind,
} from "./canonical-reaudit-registration-preview-assessment";

import type {
  CanonicalReAuditRegistrationPreviewAssessmentValidationResult,
  CanonicalReAuditRegistrationPreviewAssessmentValidationError,
  CanonicalReAuditRegistrationPreviewAssessmentValidationWarning,
} from "./canonical-reaudit-registration-preview-assessment-validation-result";

import {
  isPlainRecord,
  hasOwnStringField,
  hasOwnBooleanField,
  hasOwnLiteralField,
  hasReadonlyStringArrayField,
} from "./canonical-reaudit-registration-preview-assessment-validation-guards";

import {
  createCanonicalReAuditRegistrationPreviewAssessmentValidationError,
  createCanonicalReAuditRegistrationPreviewAssessmentValidationResult,
} from "./canonical-reaudit-registration-preview-assessment-validation-factories";

/**
 * Validate a Canonical Re-Audit Registration Preview Assessment.
 * 
 * This is a pure, synchronous, deterministic validator that:
 * 1. Validates top-level record structure
 * 2. Validates literal discriminants (__kind, assessmentStage)
 * 3. Validates child objects exist and are plain records
 * 4. Deep-checks safety invariant fields
 * 5. Deep-checks boundary requirement fields
 * 6. Uses existing primitive guards for leaf field validation
 * 7. Accumulates all errors
 * 8. Returns validation result using existing factory
 * 
 * @param input - Unknown input to validate
 * @returns Validation result with errors, warnings, and safety flags
 */
export function validateCanonicalReAuditRegistrationPreviewAssessment(
  input: unknown
): CanonicalReAuditRegistrationPreviewAssessmentValidationResult {
  const errors: CanonicalReAuditRegistrationPreviewAssessmentValidationError[] = [];

  // =========================================================================
  // STEP 1: TOP-LEVEL RECORD VALIDATION
  // =========================================================================
  if (!isPlainRecord(input)) {
    errors.push(
      createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
        "MISSING_REQUIRED_FIELD",
        [],
        "Input must be a plain object (not null, not array)",
        "Ensure input is a plain JavaScript object"
      )
    );
    return createCanonicalReAuditRegistrationPreviewAssessmentValidationResult(
      false,
      errors,
      [],
      ["DEPLOY_UNLOCK_FORBIDDEN", "PERSISTENCE_FORBIDDEN", "MUTATION_FORBIDDEN"]
    );
  }

  // =========================================================================
  // STEP 2: TOP-LEVEL LITERAL VALIDATION
  // =========================================================================

  // Validate __kind
  if (!hasOwnLiteralField(input, "__kind", "registration-preview-assessment" as const)) {
    errors.push(
      createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
        "INVALID_KIND",
        ["__kind"],
        'Expected __kind to be "registration-preview-assessment"',
        'Set __kind to "registration-preview-assessment"'
      )
    );
  }

  // Validate assessmentStage
  if (!hasOwnLiteralField(input, "assessmentStage", "REGISTRATION_PREVIEW_ASSESSMENT" as const)) {
    errors.push(
      createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
        "INVALID_KIND",
        ["assessmentStage"],
        'Expected assessmentStage to be "REGISTRATION_PREVIEW_ASSESSMENT"',
        'Set assessmentStage to "REGISTRATION_PREVIEW_ASSESSMENT"'
      )
    );
  }

  // =========================================================================
  // STEP 3: CHILD OBJECT VALIDATION
  // =========================================================================

  // Validate preview exists and is a plain record
  if (!isPlainRecord((input as Record<string, unknown>).preview)) {
    errors.push(
      createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
        "MISSING_REQUIRED_FIELD",
        ["preview"],
        "preview must be a plain object",
        "Ensure preview is a plain object"
      )
    );
  }

  // Validate eligibility exists and is a plain record
  if (!isPlainRecord((input as Record<string, unknown>).eligibility)) {
    errors.push(
      createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
        "MISSING_REQUIRED_FIELD",
        ["eligibility"],
        "eligibility must be a plain object",
        "Ensure eligibility is a plain object"
      )
    );
  }

  // Validate explanation exists and is a plain record
  if (!isPlainRecord((input as Record<string, unknown>).explanation)) {
    errors.push(
      createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
        "MISSING_REQUIRED_FIELD",
        ["explanation"],
        "explanation must be a plain object",
        "Ensure explanation is a plain object"
      )
    );
  }

  // Validate safety exists and is a plain record
  if (!isPlainRecord((input as Record<string, unknown>).safety)) {
    errors.push(
      createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
        "MISSING_REQUIRED_FIELD",
        ["safety"],
        "safety must be a plain object",
        "Ensure safety is a plain object"
      )
    );
  }

  // Validate boundary exists and is a plain record
  if (!isPlainRecord((input as Record<string, unknown>).boundary)) {
    errors.push(
      createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
        "MISSING_REQUIRED_FIELD",
        ["boundary"],
        "boundary must be a plain object",
        "Ensure boundary is a plain object"
      )
    );
  }

  // =========================================================================
  // STEP 4: SAFETY INVARIANT VALIDATION
  // =========================================================================

  const safety = (input as Record<string, unknown>).safety;
  if (isPlainRecord(safety)) {
    // Check all safety invariants are set to their required values
    const safetyInvariants: Array<[string, boolean]> = [
      ["typeOnly", true],
      ["assessmentOnly", true],
      ["previewOnly", true],
      ["informationalOnly", true],
      ["memoryOnly", true],
      ["executionAllowed", false],
      ["registrationExecutionAllowed", false],
      ["persistenceAllowed", false],
      ["mutationAllowed", false],
      ["deployRemainsLocked", true],
      ["globalAuditOverwriteAllowed", false],
      ["vaultMutationAllowed", false],
      ["productionAuthorizationAllowed", false],
      ["promotionRequired", true],
    ];

    for (const [fieldName, expectedValue] of safetyInvariants) {
      if (!hasOwnBooleanField(safety, fieldName as any)) {
        errors.push(
          createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
            "INVALID_SAFETY_INVARIANT",
            ["safety", fieldName],
            `safety.${fieldName} must be a boolean`,
            `Set safety.${fieldName} to ${expectedValue}`
          )
        );
      } else if ((safety as Record<string, unknown>)[fieldName] !== expectedValue) {
        errors.push(
          createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
            "INVALID_SAFETY_INVARIANT",
            ["safety", fieldName],
            `safety.${fieldName} must be ${expectedValue}, got ${(safety as Record<string, unknown>)[fieldName]}`,
            `Set safety.${fieldName} to ${expectedValue}`
          )
        );
      }
    }
  }

  // =========================================================================
  // STEP 5: BOUNDARY REQUIREMENT VALIDATION
  // =========================================================================

  const boundary = (input as Record<string, unknown>).boundary;
  if (isPlainRecord(boundary)) {
    // Check all boundary requirements are set to their required values
    const boundaryRequirements: Array<[string, boolean]> = [
      ["runtimeValidatorAllowed", false],
      ["runtimeBuilderAllowed", false],
      ["factoryAllowed", false],
      ["generatorAllowed", false],
      ["handlerIntegrationAllowed", false],
      ["uiIntegrationAllowed", false],
      ["adapterIntegrationAllowed", false],
      ["persistenceAllowed", false],
      ["deployUnlockAllowed", false],
    ];

    for (const [fieldName, expectedValue] of boundaryRequirements) {
      if (!hasOwnBooleanField(boundary, fieldName as any)) {
        errors.push(
          createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
            "INVALID_BOUNDARY_INVARIANT",
            ["boundary", fieldName],
            `boundary.${fieldName} must be a boolean`,
            `Set boundary.${fieldName} to ${expectedValue}`
          )
        );
      } else if ((boundary as Record<string, unknown>)[fieldName] !== expectedValue) {
        errors.push(
          createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
            "INVALID_BOUNDARY_INVARIANT",
            ["boundary", fieldName],
            `boundary.${fieldName} must be ${expectedValue}, got ${(boundary as Record<string, unknown>)[fieldName]}`,
            `Set boundary.${fieldName} to ${expectedValue}`
          )
        );
      }
    }
  }

  // =========================================================================
  // STEP 6: LEAF FIELD VALIDATION
  // =========================================================================

  // Validate assessmentNotes is a readonly string array
  if (!hasReadonlyStringArrayField(input, "assessmentNotes")) {
    errors.push(
      createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
        "MISSING_REQUIRED_FIELD",
        ["assessmentNotes"],
        "assessmentNotes must be a readonly string array",
        "Ensure assessmentNotes is an array of strings"
      )
    );
  }

  // =========================================================================
  // STEP 7: RESULT ASSEMBLY
  // =========================================================================

  const valid = errors.length === 0;
  return createCanonicalReAuditRegistrationPreviewAssessmentValidationResult(
    valid,
    errors,
    [],
    ["DEPLOY_UNLOCK_FORBIDDEN", "PERSISTENCE_FORBIDDEN", "MUTATION_FORBIDDEN"]
  );
}
