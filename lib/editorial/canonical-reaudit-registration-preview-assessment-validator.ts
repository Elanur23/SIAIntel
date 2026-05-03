/**
 * PURE VALIDATOR COMPOSITION ONLY.
 *
 * This module composes existing primitive guards and result factories to validate
 * Canonical Re-Audit Registration Preview Assessment objects.
 *
 * STRICT RULES:
 * - Use guards (8C-3A-3B) only
 * - Use factories (8C-3A-3C-1) only
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
 */

import type {
  CanonicalReAuditRegistrationPreviewAssessmentValidationResult,
  CanonicalReAuditRegistrationPreviewAssessmentValidationError,
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
 * Pure, synchronous, deterministic validator.
 *
 * @param input - Unknown input to validate
 * @returns Validation result with errors, warnings, and safety flags
 */
export function validateCanonicalReAuditRegistrationPreviewAssessment(
  input: unknown
): CanonicalReAuditRegistrationPreviewAssessmentValidationResult {
  // =========================================================================
  // ROOT INPUT CHECK (FAIL-FAST)
  // =========================================================================
  if (!isPlainRecord(input)) {
    return createCanonicalReAuditRegistrationPreviewAssessmentValidationResult(
      false,
      [
        createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
          "MISSING_REQUIRED_FIELD",
          [],
          "Input must be a plain object (not null, not array)",
          "Ensure input is a plain JavaScript object"
        ),
      ],
      [],
      ["DEPLOY_UNLOCK_FORBIDDEN", "PERSISTENCE_FORBIDDEN", "MUTATION_FORBIDDEN"]
    );
  }

  // Purely type-level assertions for access (no runtime creation/mutation)
  const record = input as Record<string, any>;
  const explanation = record.explanation as Record<string, any>;
  const safety = record.safety as Record<string, any>;
  const boundary = record.boundary as Record<string, any>;

  // =========================================================================
  // ALL OTHER CHECKS (COLLECT ALL ERRORS)
  // =========================================================================
  const errors: readonly CanonicalReAuditRegistrationPreviewAssessmentValidationError[] = [
    // Step 2: Top-Level Literals
    ...(!hasOwnLiteralField(input, "__kind", "registration-preview-assessment")
      ? [
          createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
            "INVALID_KIND",
            ["__kind"],
            'Expected __kind to be "registration-preview-assessment"',
            'Set __kind to "registration-preview-assessment"'
          ),
        ]
      : []),
    ...(!hasOwnLiteralField(input, "assessmentStage", "REGISTRATION_PREVIEW_ASSESSMENT")
      ? [
          createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
            "INVALID_KIND",
            ["assessmentStage"],
            'Expected assessmentStage to be "REGISTRATION_PREVIEW_ASSESSMENT"',
            'Set assessmentStage to "REGISTRATION_PREVIEW_ASSESSMENT"'
          ),
        ]
      : []),

    // Step 3: Child Object Existence
    ...(!isPlainRecord(record.preview)
      ? [
          createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
            "MISSING_REQUIRED_FIELD",
            ["preview"],
            "preview must be a plain object",
            "Ensure preview is a plain object"
          ),
        ]
      : []),
    ...(!isPlainRecord(record.eligibility)
      ? [
          createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
            "MISSING_REQUIRED_FIELD",
            ["eligibility"],
            "eligibility must be a plain object",
            "Ensure eligibility is a plain object"
          ),
        ]
      : []),
    ...(!isPlainRecord(record.explanation)
      ? [
          createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
            "MISSING_REQUIRED_FIELD",
            ["explanation"],
            "explanation must be a plain object",
            "Ensure explanation is a plain object"
          ),
        ]
      : []),
    ...(!isPlainRecord(record.safety)
      ? [
          createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
            "MISSING_REQUIRED_FIELD",
            ["safety"],
            "safety must be a plain object",
            "Ensure safety is a plain object"
          ),
        ]
      : []),
    ...(!isPlainRecord(record.boundary)
      ? [
          createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
            "MISSING_REQUIRED_FIELD",
            ["boundary"],
            "boundary must be a plain object",
            "Ensure boundary is a plain object"
          ),
        ]
      : []),

    // Step 4: Explanation Leaf Field Validation (Satisfies hasOwnStringField requirement)
    ...(isPlainRecord(record.explanation)
      ? [
          ...(!hasOwnStringField(explanation, "title")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("MISSING_REQUIRED_FIELD", ["explanation", "title"], "explanation.title must be a string", "Ensure explanation.title is a string")]
            : []),
          ...(!hasOwnStringField(explanation, "summary")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("MISSING_REQUIRED_FIELD", ["explanation", "summary"], "explanation.summary must be a string", "Ensure explanation.summary is a string")]
            : []),
          ...(!hasOwnStringField(explanation, "preconditionSummary")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("MISSING_REQUIRED_FIELD", ["explanation", "preconditionSummary"], "explanation.preconditionSummary must be a string", "Ensure explanation.preconditionSummary is a string")]
            : []),
        ]
      : []),

    // Step 5: Safety Invariants (14 fields)
    ...(isPlainRecord(record.safety)
      ? [
          ...(!hasOwnBooleanField(safety, "typeOnly")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "typeOnly"], "safety.typeOnly must be a boolean", "Set safety.typeOnly to true")]
            : safety.typeOnly !== true
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "typeOnly"], "safety.typeOnly must be true", "Set safety.typeOnly to true")]
            : []),
          ...(!hasOwnBooleanField(safety, "assessmentOnly")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "assessmentOnly"], "safety.assessmentOnly must be a boolean", "Set safety.assessmentOnly to true")]
            : safety.assessmentOnly !== true
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "assessmentOnly"], "safety.assessmentOnly must be true", "Set safety.assessmentOnly to true")]
            : []),
          ...(!hasOwnBooleanField(safety, "previewOnly")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "previewOnly"], "safety.previewOnly must be a boolean", "Set safety.previewOnly to true")]
            : safety.previewOnly !== true
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "previewOnly"], "safety.previewOnly must be true", "Set safety.previewOnly to true")]
            : []),
          ...(!hasOwnBooleanField(safety, "informationalOnly")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "informationalOnly"], "safety.informationalOnly must be a boolean", "Set safety.informationalOnly to true")]
            : safety.informationalOnly !== true
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "informationalOnly"], "safety.informationalOnly must be true", "Set safety.informationalOnly to true")]
            : []),
          ...(!hasOwnBooleanField(safety, "memoryOnly")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "memoryOnly"], "safety.memoryOnly must be a boolean", "Set safety.memoryOnly to true")]
            : safety.memoryOnly !== true
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "memoryOnly"], "safety.memoryOnly must be true", "Set safety.memoryOnly to true")]
            : []),
          ...(!hasOwnBooleanField(safety, "executionAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "executionAllowed"], "safety.executionAllowed must be a boolean", "Set safety.executionAllowed to false")]
            : safety.executionAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "executionAllowed"], "safety.executionAllowed must be false", "Set safety.executionAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(safety, "registrationExecutionAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "registrationExecutionAllowed"], "safety.registrationExecutionAllowed must be a boolean", "Set safety.registrationExecutionAllowed to false")]
            : safety.registrationExecutionAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "registrationExecutionAllowed"], "safety.registrationExecutionAllowed must be false", "Set safety.registrationExecutionAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(safety, "persistenceAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "persistenceAllowed"], "safety.persistenceAllowed must be a boolean", "Set safety.persistenceAllowed to false")]
            : safety.persistenceAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "persistenceAllowed"], "safety.persistenceAllowed must be false", "Set safety.persistenceAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(safety, "mutationAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "mutationAllowed"], "safety.mutationAllowed must be a boolean", "Set safety.mutationAllowed to false")]
            : safety.mutationAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "mutationAllowed"], "safety.mutationAllowed must be false", "Set safety.mutationAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(safety, "deployRemainsLocked")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "deployRemainsLocked"], "safety.deployRemainsLocked must be a boolean", "Set safety.deployRemainsLocked to true")]
            : safety.deployRemainsLocked !== true
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "deployRemainsLocked"], "safety.deployRemainsLocked must be true", "Set safety.deployRemainsLocked to true")]
            : []),
          ...(!hasOwnBooleanField(safety, "globalAuditOverwriteAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "globalAuditOverwriteAllowed"], "safety.globalAuditOverwriteAllowed must be a boolean", "Set safety.globalAuditOverwriteAllowed to false")]
            : safety.globalAuditOverwriteAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "globalAuditOverwriteAllowed"], "safety.globalAuditOverwriteAllowed must be false", "Set safety.globalAuditOverwriteAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(safety, "vaultMutationAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "vaultMutationAllowed"], "safety.vaultMutationAllowed must be a boolean", "Set safety.vaultMutationAllowed to false")]
            : safety.vaultMutationAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "vaultMutationAllowed"], "safety.vaultMutationAllowed must be false", "Set safety.vaultMutationAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(safety, "productionAuthorizationAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "productionAuthorizationAllowed"], "safety.productionAuthorizationAllowed must be a boolean", "Set safety.productionAuthorizationAllowed to false")]
            : safety.productionAuthorizationAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "productionAuthorizationAllowed"], "safety.productionAuthorizationAllowed must be false", "Set safety.productionAuthorizationAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(safety, "promotionRequired")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "promotionRequired"], "safety.promotionRequired must be a boolean", "Set safety.promotionRequired to true")]
            : safety.promotionRequired !== true
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_SAFETY_INVARIANT", ["safety", "promotionRequired"], "safety.promotionRequired must be true", "Set safety.promotionRequired to true")]
            : []),
        ]
      : []),

    // Step 6: Boundary Requirements (9 fields)
    ...(isPlainRecord(record.boundary)
      ? [
          ...(!hasOwnBooleanField(boundary, "runtimeValidatorAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "runtimeValidatorAllowed"], "boundary.runtimeValidatorAllowed must be a boolean", "Set boundary.runtimeValidatorAllowed to false")]
            : boundary.runtimeValidatorAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "runtimeValidatorAllowed"], "boundary.runtimeValidatorAllowed must be false", "Set boundary.runtimeValidatorAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(boundary, "runtimeBuilderAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "runtimeBuilderAllowed"], "boundary.runtimeBuilderAllowed must be a boolean", "Set boundary.runtimeBuilderAllowed to false")]
            : boundary.runtimeBuilderAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "runtimeBuilderAllowed"], "boundary.runtimeBuilderAllowed must be false", "Set boundary.runtimeBuilderAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(boundary, "factoryAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "factoryAllowed"], "boundary.factoryAllowed must be a boolean", "Set boundary.factoryAllowed to false")]
            : boundary.factoryAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "factoryAllowed"], "boundary.factoryAllowed must be false", "Set boundary.factoryAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(boundary, "generatorAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "generatorAllowed"], "boundary.generatorAllowed must be a boolean", "Set boundary.generatorAllowed to false")]
            : boundary.generatorAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "generatorAllowed"], "boundary.generatorAllowed must be false", "Set boundary.generatorAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(boundary, "handlerIntegrationAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "handlerIntegrationAllowed"], "boundary.handlerIntegrationAllowed must be a boolean", "Set boundary.handlerIntegrationAllowed to false")]
            : boundary.handlerIntegrationAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "handlerIntegrationAllowed"], "boundary.handlerIntegrationAllowed must be false", "Set boundary.handlerIntegrationAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(boundary, "uiIntegrationAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "uiIntegrationAllowed"], "boundary.uiIntegrationAllowed must be a boolean", "Set boundary.uiIntegrationAllowed to false")]
            : boundary.uiIntegrationAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "uiIntegrationAllowed"], "boundary.uiIntegrationAllowed must be false", "Set boundary.uiIntegrationAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(boundary, "adapterIntegrationAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "adapterIntegrationAllowed"], "boundary.adapterIntegrationAllowed must be a boolean", "Set boundary.adapterIntegrationAllowed to false")]
            : boundary.adapterIntegrationAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "adapterIntegrationAllowed"], "boundary.adapterIntegrationAllowed must be false", "Set boundary.adapterIntegrationAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(boundary, "persistenceAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "persistenceAllowed"], "boundary.persistenceAllowed must be a boolean", "Set boundary.persistenceAllowed to false")]
            : boundary.persistenceAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "persistenceAllowed"], "boundary.persistenceAllowed must be false", "Set boundary.persistenceAllowed to false")]
            : []),
          ...(!hasOwnBooleanField(boundary, "deployUnlockAllowed")
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "deployUnlockAllowed"], "boundary.deployUnlockAllowed must be a boolean", "Set boundary.deployUnlockAllowed to false")]
            : boundary.deployUnlockAllowed !== false
            ? [createCanonicalReAuditRegistrationPreviewAssessmentValidationError("INVALID_BOUNDARY_INVARIANT", ["boundary", "deployUnlockAllowed"], "boundary.deployUnlockAllowed must be false", "Set boundary.deployUnlockAllowed to false")]
            : []),
        ]
      : []),

    // Step 7: Leaf Fields
    ...(!hasReadonlyStringArrayField(input, "assessmentNotes")
      ? [
          createCanonicalReAuditRegistrationPreviewAssessmentValidationError(
            "MISSING_REQUIRED_FIELD",
            ["assessmentNotes"],
            "assessmentNotes must be a readonly string array",
            "Ensure assessmentNotes is an array of strings"
          ),
        ]
      : []),
  ];

  // =========================================================================
  // STEP 8: RESULT ASSEMBLY (DETERMINISTIC)
  // =========================================================================
  return createCanonicalReAuditRegistrationPreviewAssessmentValidationResult(
    errors.length === 0,
    errors,
    [],
    ["DEPLOY_UNLOCK_FORBIDDEN", "PERSISTENCE_FORBIDDEN", "MUTATION_FORBIDDEN"]
  );
}
