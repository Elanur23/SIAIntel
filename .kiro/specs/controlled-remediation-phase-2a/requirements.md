# Requirements Document

## Introduction

The Controlled Autonomous Remediation Phase 2A establishes a read-only remediation suggestion generator that maps existing audit and validation findings into structured RemediationSuggestion objects. This phase creates a pure, deterministic generator that reads findings from the Global Governance Audit and Panda Intake Validator systems and produces RemediationPlan objects using the Phase 1 type contract. The generator remains strictly read-only with no input mutation, no content modification, and no automated fix application.

## Glossary

- **Remediation_Generator**: A pure function module that maps audit/validation findings into RemediationSuggestion objects
- **Global_Audit_Findings**: Output from runGlobalGovernanceAudit() containing language-specific validation results
- **Panda_Validation_Errors**: Output from validatePandaPackage() containing structured validation errors
- **Mapping_Function**: A deterministic function that converts a specific finding type into a RemediationSuggestion
- **Conservative_Fallback**: Default behavior when a finding cannot be confidently mapped to a specific category
- **Deterministic_Template**: Pre-defined text patterns used for suggestedText generation without LLM calls
- **Pure_Function**: A function with no side effects, no mutations, and deterministic output for given input

## Phase 1 Foundation

Phase 2A builds on the completed Phase 1 types-only foundation:

**Phase 1 Deliverables (Completed):**
- `lib/editorial/remediation-types.ts` - Type contract with RemediationSuggestion, RemediationPlan, enums, and helpers
- `scripts/verify-remediation-engine.ts` - Type contract verification script (8 test cases)

**Phase 1 Safety Invariants (Must Be Preserved):**
- cannotAutoPublish === true for all suggestions
- cannotAutoCommit === true for all suggestions
- cannotAutoPush === true for all suggestions
- cannotAutoDeploy === true for all suggestions
- publishStillBlocked is literal type `true` in RemediationPlan
- HUMAN_ONLY and FORBIDDEN_TO_AUTOFIX suggestions have canApplyToDraft === false
- PROVENANCE_REVIEW, SOURCE_REVIEW, PARITY_REVIEW have suggestedText === null
- No E-E-A-T credentials, source attribution, or provenance fabrication

## Requirements

### Requirement 1: Pure Generator Module

**User Story:** As a developer, I want a pure read-only generator module, so that remediation suggestions can be created without side effects or mutations.

#### Acceptance Criteria

1. THE Remediation_Generator SHALL export a function `generateRemediationPlan(input: GeneratorInput): RemediationPlan`
2. THE Remediation_Generator SHALL export a function `suggestionsFromGlobalAudit(auditResult: GlobalAuditResult): RemediationSuggestion[]`
3. THE Remediation_Generator SHALL export a function `suggestionsFromPandaValidation(errors: PandaValidationError[]): RemediationSuggestion[]`
4. THE Remediation_Generator SHALL NOT mutate any input parameters
5. THE Remediation_Generator SHALL NOT make network calls
6. THE Remediation_Generator SHALL NOT write to the filesystem
7. THE Remediation_Generator SHALL NOT call git, Vercel, or publish APIs
8. THE Remediation_Generator SHALL NOT import Warroom UI components
9. THE Remediation_Generator SHALL NOT import app/admin/warroom/page.tsx
10. THE Remediation_Generator SHALL be deterministic (same input produces same output)

### Requirement 2: Generate RemediationPlan

**User Story:** As a developer, I want the generator to return a valid RemediationPlan, so that all suggestions are properly structured and validated.

#### Acceptance Criteria

1. THE Remediation_Generator SHALL return a RemediationPlan with suggestions array populated from input findings
2. THE Remediation_Generator SHALL calculate totalIssues as suggestions.length
3. THE Remediation_Generator SHALL calculate safeSuggestionCount as count of SAFE_FORMAT_ONLY and SAFE_TEXTUAL_SUGGESTION
4. THE Remediation_Generator SHALL calculate requiresApprovalCount as count of suggestions with requiresHumanApproval === true
5. THE Remediation_Generator SHALL calculate humanOnlyCount as count of HUMAN_ONLY and FORBIDDEN_TO_AUTOFIX
6. THE Remediation_Generator SHALL calculate criticalCount as count of CRITICAL severity suggestions
7. THE Remediation_Generator SHALL set publishStillBlocked to literal true
8. WHEN input is empty or has no findings, THE Remediation_Generator SHALL return an empty plan with publishStillBlocked === true and totalIssues === 0
9. THE Remediation_Generator SHALL call validateRemediationPlan() before returning to ensure correctness
10. THE Remediation_Generator SHALL include createdAt timestamp in ISO 8601 format

### Requirement 3: Global Audit Mapping

**User Story:** As a developer, I want global audit findings mapped to remediation suggestions, so that operators can see structured fix proposals for audit failures.

#### Acceptance Criteria

1. WHEN GlobalLanguageAuditResult contains residueFindings, THE Remediation_Generator SHALL create RESIDUE_REMOVAL suggestions
2. WHEN GlobalLanguageAuditResult contains provenanceFindings with "verification" or "score", THE Remediation_Generator SHALL create FAKE_CLAIM_REMOVAL suggestions
3. WHEN GlobalLanguageAuditResult contains criticalIssues with "Deterministic financial", THE Remediation_Generator SHALL create DETERMINISTIC_LANGUAGE_NEUTRALIZATION suggestions
4. WHEN GlobalLanguageAuditResult contains provenanceFindings with "missing" or "provenance", THE Remediation_Generator SHALL create PROVENANCE_REVIEW suggestions with suggestedText === null
5. WHEN GlobalLanguageAuditResult contains criticalIssues with "missing" or "source", THE Remediation_Generator SHALL create SOURCE_REVIEW suggestions with suggestedText === null
6. WHEN GlobalLanguageAuditResult contains parityFindings, THE Remediation_Generator SHALL create PARITY_REVIEW suggestions with suggestedText === null
7. WHEN GlobalLanguageAuditResult contains criticalIssues with "Malformed markdown", THE Remediation_Generator SHALL create FORMAT_REPAIR suggestions
8. WHEN GlobalLanguageAuditResult contains warnings with "Duplicate footer", THE Remediation_Generator SHALL create FOOTER_REPAIR suggestions
9. WHEN GlobalLanguageAuditResult contains criticalIssues that don't match known patterns, THE Remediation_Generator SHALL create HUMAN_REVIEW_REQUIRED suggestions
10. THE Remediation_Generator SHALL preserve affectedLanguage from GlobalLanguageAuditResult language key

### Requirement 4: Panda Validation Mapping

**User Story:** As a developer, I want Panda validation errors mapped to remediation suggestions, so that intake validation failures produce actionable fix proposals.

#### Acceptance Criteria

1. WHEN PandaValidationError has code RESIDUE_DETECTED, THE Remediation_Generator SHALL create RESIDUE_REMOVAL suggestions
2. WHEN PandaValidationError has code FAKE_VERIFICATION, THE Remediation_Generator SHALL create FAKE_CLAIM_REMOVAL suggestions
3. WHEN PandaValidationError has code UNSUPPORTED_SCORE, THE Remediation_Generator SHALL create FAKE_CLAIM_REMOVAL suggestions
4. WHEN PandaValidationError has code PROVENANCE_FAILURE, THE Remediation_Generator SHALL create PROVENANCE_REVIEW suggestions with suggestedText === null
5. WHEN PandaValidationError has code LANGUAGE_MISSING, THE Remediation_Generator SHALL create HUMAN_REVIEW_REQUIRED suggestions
6. WHEN PandaValidationError has code LANGUAGE_MISMATCH, THE Remediation_Generator SHALL create HUMAN_REVIEW_REQUIRED suggestions
7. WHEN PandaValidationError has code FOOTER_INTEGRITY_FAILURE, THE Remediation_Generator SHALL create FOOTER_REPAIR suggestions
8. WHEN PandaValidationError has code MALFORMED_JSON, THE Remediation_Generator SHALL create HUMAN_REVIEW_REQUIRED suggestions
9. THE Remediation_Generator SHALL preserve lang and field from PandaValidationError when available
10. THE Remediation_Generator SHALL use error.message as issueDescription

### Requirement 5: Safe suggestedText Rules

**User Story:** As a compliance officer, I want strict rules for suggestedText generation, so that no fabricated content or unsafe suggestions are produced.

#### Acceptance Criteria

1. WHEN category is FORMAT_REPAIR, THE Remediation_Generator MAY produce suggestedText with deterministic formatting fixes
2. WHEN category is RESIDUE_REMOVAL and originalText is available, THE Remediation_Generator MAY produce suggestedText with deterministic removal guidance
3. WHEN category is LENGTH_ADJUSTMENT and truncation is safe, THE Remediation_Generator MAY produce suggestedText with deterministic truncation
4. WHEN category is DETERMINISTIC_LANGUAGE_NEUTRALIZATION, THE Remediation_Generator MAY produce suggestedText with neutral template guidance (not factual rewrite)
5. WHEN category is PROVENANCE_REVIEW, THE Remediation_Generator SHALL set suggestedText to null
6. WHEN category is SOURCE_REVIEW, THE Remediation_Generator SHALL set suggestedText to null
7. WHEN category is PARITY_REVIEW, THE Remediation_Generator SHALL set suggestedText to null
8. THE Remediation_Generator SHALL NOT fabricate sources, provenance, or E-E-A-T credentials
9. THE Remediation_Generator SHALL NOT fabricate facts or numeric data
10. THE Remediation_Generator SHALL NOT use LLM calls to generate suggestedText

### Requirement 6: Safety Flags Preservation

**User Story:** As a security engineer, I want all Phase 1 safety invariants preserved, so that fail-closed design is maintained.

#### Acceptance Criteria

1. THE Remediation_Generator SHALL set cannotAutoPublish to true for every suggestion
2. THE Remediation_Generator SHALL set cannotAutoCommit to true for every suggestion
3. THE Remediation_Generator SHALL set cannotAutoPush to true for every suggestion
4. THE Remediation_Generator SHALL set cannotAutoDeploy to true for every suggestion
5. THE Remediation_Generator SHALL set requiresHumanApproval to true except for strict SAFE_FORMAT_ONLY cases
6. WHEN safetyLevel is HUMAN_ONLY, THE Remediation_Generator SHALL set canApplyToDraft to false
7. WHEN safetyLevel is FORBIDDEN_TO_AUTOFIX, THE Remediation_Generator SHALL set canApplyToDraft to false
8. THE Remediation_Generator SHALL set publishStillBlocked to literal true in RemediationPlan
9. THE Remediation_Generator SHALL call assertNoForbiddenAutomation() for each suggestion before adding to plan
10. THE Remediation_Generator SHALL preserve all Phase 1 safety invariants

### Requirement 7: Deterministic Mapping and Conservative Fallback

**User Story:** As a developer, I want deterministic mapping with conservative fallbacks, so that ambiguous findings are handled safely.

#### Acceptance Criteria

1. THE Remediation_Generator SHALL use deterministic templates for suggestedText (no randomness)
2. THE Remediation_Generator SHALL NOT make LLM calls for any mapping or text generation
3. WHEN a finding cannot be confidently mapped to a specific category, THE Remediation_Generator SHALL use HUMAN_REVIEW_REQUIRED
4. WHEN originalText is missing or ambiguous, THE Remediation_Generator SHALL create human-only suggestions or guidance-only suggestions
5. THE Remediation_Generator SHALL set confidence conservatively (never > 0.95 for automated mappings)
6. THE Remediation_Generator SHALL NOT use confidence as authority for automated actions
7. THE Remediation_Generator SHALL generate deterministic IDs using hash of (articleId + finding + timestamp) or similar
8. THE Remediation_Generator SHALL produce identical output for identical input (deterministic behavior)
9. THE Remediation_Generator SHALL document all mapping rules in code comments
10. THE Remediation_Generator SHALL prefer human review over automated suggestions when uncertain

### Requirement 8: Verification Script

**User Story:** As a developer, I want a verification script for the generator, so that mapping correctness can be validated automatically.

#### Acceptance Criteria

1. THE Verification_Script SHALL test that empty input returns zero suggestions and valid plan with publishStillBlocked === true
2. THE Verification_Script SHALL test that residue finding returns RESIDUE_REMOVAL suggestion
3. THE Verification_Script SHALL test that fake verification finding returns FAKE_CLAIM_REMOVAL suggestion
4. THE Verification_Script SHALL test that deterministic finance finding returns DETERMINISTIC_LANGUAGE_NEUTRALIZATION suggestion
5. THE Verification_Script SHALL test that missing source finding returns SOURCE_REVIEW suggestion with suggestedText === null
6. THE Verification_Script SHALL test that missing provenance finding returns PROVENANCE_REVIEW suggestion with suggestedText === null
7. THE Verification_Script SHALL test that numeric parity finding returns PARITY_REVIEW suggestion with suggestedText === null
8. THE Verification_Script SHALL test that generator never mutates input objects
9. THE Verification_Script SHALL test that generator never calls network/git/Vercel/publish APIs
10. THE Verification_Script SHALL test that all counts (totalIssues, safeSuggestionCount, etc.) are correct
11. THE Verification_Script SHALL test that validateRemediationPlan() passes for all generated plans
12. THE Verification_Script SHALL exit with code 0 on success and non-zero on failure
13. THE Verification_Script SHALL output "CONTROLLED_REMEDIATION_GENERATOR_VERIFICATION_PASS" on success

### Requirement 9: Regression Safety

**User Story:** As a system operator, I want assurance that existing systems remain stable, so that Phase 2A does not break production.

#### Acceptance Criteria

1. WHEN npm run type-check is executed, THE system SHALL compile without errors
2. WHEN npx tsx scripts/verify-remediation-engine.ts is executed, THE Phase 1 verification SHALL pass (8/8 tests)
3. WHEN npx tsx scripts/verify-remediation-generator.ts is executed, THE Phase 2A verification SHALL pass (all tests)
4. WHEN npx tsx scripts/verify-global-audit.ts is executed, THE global audit verification SHALL pass (no regressions)
5. WHEN npx tsx scripts/verify-panda-intake.ts is executed, THE Panda intake verification SHALL pass (no regressions)
6. THE Remediation_Generator SHALL NOT modify app/admin/warroom/page.tsx
7. THE Remediation_Generator SHALL NOT modify lib/editorial/global-governance-audit.ts
8. THE Remediation_Generator SHALL NOT modify lib/editorial/panda-intake-validator.ts
9. THE Remediation_Generator SHALL NOT modify lib/neural-assembly/sia-sentinel-core.ts
10. THE Remediation_Generator SHALL NOT modify any API routes or publish/save routes

### Requirement 10: File Creation Constraints

**User Story:** As a developer, I want strict file creation rules, so that only the required files are created.

#### Acceptance Criteria

1. THE Remediation_Generator SHALL create exactly one file at lib/editorial/remediation-engine.ts
2. THE Verification_Script SHALL create exactly one file at scripts/verify-remediation-generator.ts
3. WHEN implementation is complete, THE system SHALL show only 2 new files in git status (excluding Phase 1 files)
4. THE Remediation_Generator SHALL NOT create any other files beyond the two specified
5. THE Remediation_Generator SHALL NOT modify public/sw.js
6. THE Remediation_Generator SHALL NOT modify tsconfig.tsbuildinfo

### Requirement 11: Out-of-Scope Protections

**User Story:** As a project manager, I want explicit out-of-scope protections, so that Phase 2A does not implement forbidden functionality.

#### Acceptance Criteria

1. THE Remediation_Generator SHALL NOT implement Warroom UI modifications
2. THE Remediation_Generator SHALL NOT implement RemediationPanel component
3. THE Remediation_Generator SHALL NOT implement Apply to Draft functionality
4. THE Remediation_Generator SHALL NOT implement API routes for remediation
5. THE Remediation_Generator SHALL NOT implement vault content mutation
6. THE Remediation_Generator SHALL NOT implement publish/save behavior changes
7. THE Remediation_Generator SHALL NOT implement deploy gate modifications
8. THE Remediation_Generator SHALL NOT implement Panda validator changes
9. THE Remediation_Generator SHALL NOT implement global audit scoring changes
10. THE Remediation_Generator SHALL NOT implement auto-fix capabilities
11. THE Remediation_Generator SHALL NOT implement auto-publish capabilities
12. THE Remediation_Generator SHALL NOT implement auto-commit capabilities
13. THE Remediation_Generator SHALL NOT implement auto-push capabilities
14. THE Remediation_Generator SHALL NOT implement auto-deploy capabilities

### Requirement 12: Generator Input Interface

**User Story:** As a developer, I want a clear input interface for the generator, so that I can provide audit/validation results in a structured way.

#### Acceptance Criteria

1. THE Remediation_Generator SHALL define a GeneratorInput interface that accepts GlobalAuditResult
2. THE Remediation_Generator SHALL define a GeneratorInput interface that accepts PandaValidationError[]
3. THE Remediation_Generator SHALL define a GeneratorInput interface that accepts articleId
4. THE Remediation_Generator SHALL define a GeneratorInput interface that accepts optional packageId
5. THE Remediation_Generator SHALL handle missing or undefined input fields gracefully
6. THE Remediation_Generator SHALL validate input structure before processing
7. THE Remediation_Generator SHALL return empty plan for null or undefined input
8. THE Remediation_Generator SHALL document all input fields with JSDoc comments
9. THE Remediation_Generator SHALL export GeneratorInput type for external use
10. THE Remediation_Generator SHALL support partial input (e.g., only GlobalAuditResult or only PandaValidationError[])

### Requirement 13: Suggestion Metadata Completeness

**User Story:** As a developer, I want complete metadata in every suggestion, so that operators have full context for remediation decisions.

#### Acceptance Criteria

1. THE Remediation_Generator SHALL populate id with deterministic unique identifier
2. THE Remediation_Generator SHALL populate source with appropriate RemediationSource enum value
3. THE Remediation_Generator SHALL populate category with appropriate RemediationCategory enum value
4. THE Remediation_Generator SHALL populate severity based on finding criticality (INFO, WARNING, HIGH, CRITICAL)
5. THE Remediation_Generator SHALL populate safetyLevel based on category and content type
6. THE Remediation_Generator SHALL populate affectedLanguage when available from finding
7. THE Remediation_Generator SHALL populate affectedField when available from finding
8. THE Remediation_Generator SHALL populate issueType with finding code or type
9. THE Remediation_Generator SHALL populate issueDescription with finding message
10. THE Remediation_Generator SHALL populate originalText when available from finding
11. THE Remediation_Generator SHALL populate rationale explaining why this remediation is suggested
12. THE Remediation_Generator SHALL populate fixType with appropriate RemediationFixType enum value
13. THE Remediation_Generator SHALL populate confidence conservatively (0.0-1.0)
14. THE Remediation_Generator SHALL populate validationTests with applicable test names
15. THE Remediation_Generator SHALL populate createdAt with ISO 8601 timestamp

### Requirement 14: Content Integrity Flags

**User Story:** As a compliance officer, I want content integrity flags set correctly, so that fact preservation is tracked.

#### Acceptance Criteria

1. WHEN category is FORMAT_REPAIR, THE Remediation_Generator SHALL set preservesFacts to true
2. WHEN category is RESIDUE_REMOVAL, THE Remediation_Generator SHALL set preservesFacts to true
3. WHEN category is DETERMINISTIC_LANGUAGE_NEUTRALIZATION, THE Remediation_Generator SHALL set preservesFacts to false
4. WHEN category is FAKE_CLAIM_REMOVAL, THE Remediation_Generator SHALL set preservesFacts to false
5. WHEN category involves numeric changes, THE Remediation_Generator SHALL set preservesNumbers to false
6. WHEN category is PARITY_REVIEW, THE Remediation_Generator SHALL set preservesNumbers to false
7. WHEN category is PROVENANCE_REVIEW, THE Remediation_Generator SHALL set preservesProvenance to false
8. WHEN category is SOURCE_REVIEW, THE Remediation_Generator SHALL set requiresSourceVerification to true
9. WHEN category is PROVENANCE_REVIEW, THE Remediation_Generator SHALL set requiresSourceVerification to true
10. THE Remediation_Generator SHALL document content integrity flag logic in code comments

### Requirement 15: Error Handling and Robustness

**User Story:** As a developer, I want robust error handling, so that the generator fails gracefully on invalid input.

#### Acceptance Criteria

1. WHEN input is null or undefined, THE Remediation_Generator SHALL return empty plan without throwing
2. WHEN input has malformed structure, THE Remediation_Generator SHALL return empty plan without throwing
3. WHEN a single finding fails to map, THE Remediation_Generator SHALL skip it and continue processing other findings
4. WHEN validateRemediationPlan() throws, THE Remediation_Generator SHALL log error and return empty plan
5. THE Remediation_Generator SHALL NOT throw exceptions during normal operation
6. THE Remediation_Generator SHALL log warnings for unmapped findings (console.warn)
7. THE Remediation_Generator SHALL validate all required fields before creating suggestions
8. THE Remediation_Generator SHALL handle missing timestamps gracefully (use current time)
9. THE Remediation_Generator SHALL handle missing articleId gracefully (use placeholder or skip)
10. THE Remediation_Generator SHALL document error handling behavior in JSDoc comments

## Out of Scope

The following are explicitly OUT OF SCOPE for Phase 2A:

- ❌ Warroom UI modifications (app/admin/warroom/page.tsx)
- ❌ RemediationPanel component
- ❌ Apply to Draft functionality
- ❌ Runtime remediation application
- ❌ Vault content mutation
- ❌ API route modifications
- ❌ Publish/save behavior changes
- ❌ Deploy gate modifications
- ❌ Global audit scoring changes
- ❌ Panda validator changes
- ❌ Auto-fix capabilities
- ❌ Auto-publish capabilities
- ❌ Auto-commit capabilities
- ❌ Auto-push capabilities
- ❌ Auto-deploy capabilities
- ❌ Database persistence
- ❌ Network calls
- ❌ LLM calls for text generation
- ❌ File system mutations (except creating the 2 required files)

## Success Criteria

Phase 2A is complete when ALL of the following are true:

- ✅ lib/editorial/remediation-engine.ts exists with all generator functions
- ✅ scripts/verify-remediation-generator.ts exists with all test cases
- ✅ npm run type-check passes without errors
- ✅ npx tsx scripts/verify-remediation-engine.ts passes (8/8 tests - Phase 1)
- ✅ npx tsx scripts/verify-remediation-generator.ts passes (all tests - Phase 2A)
- ✅ npx tsx scripts/verify-global-audit.ts still passes (no regressions)
- ✅ npx tsx scripts/verify-panda-intake.ts still passes (no regressions)
- ✅ git status shows only 2 new files (excluding Phase 1 files)
- ✅ No source files modified (Warroom UI, audit systems, API routes)
- ✅ No runtime behavior changed
- ✅ All safety invariants preserved from Phase 1
- ✅ Generator is pure and deterministic
- ✅ No LLM calls, no network calls, no file mutations

## Safety Reminders

**CRITICAL SAFETY RULES:**

1. **Pure Functions:** Generator must be pure (no side effects, no mutations, deterministic)
2. **Fail-Closed Design:** All automation flags must remain "forbidden" (cannotAutoPublish/Commit/Push/Deploy === true)
3. **Literal Type True:** publishStillBlocked must remain literal type `true`, not `boolean`
4. **Human Approval Required:** requiresHumanApproval defaults to true except for SAFE_FORMAT_ONLY
5. **No Content Fabrication:** Never generate E-E-A-T credentials, source attribution, or provenance data
6. **Human-Only Categories:** PROVENANCE_REVIEW, SOURCE_REVIEW, PARITY_REVIEW must have suggestedText === null
7. **No LLM Calls:** All text generation must use deterministic templates
8. **Conservative Fallback:** Ambiguous findings become HUMAN_REVIEW_REQUIRED
9. **No Runtime Integration:** Phase 2A does not integrate with Warroom UI or API routes
10. **Read-Only:** Phase 2A does not modify vault content, audit systems, or validation systems

**If any of these rules are violated, Phase 2A is BLOCKED.**
