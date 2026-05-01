# Requirements Document

## Introduction

The Controlled Autonomous Remediation Phase 1 establishes a strict type-only foundation for structured content remediation in the Warroom system. This phase creates the remediation data contract without implementing any runtime behavior, UI components, or automated fix application. The system ensures all remediation remains human-controlled and fail-closed by design.

## Glossary

- **Remediation_Engine**: The type system and data structures that define how content issues are represented and categorized
- **Remediation_Source**: The origin system that detected the content issue (globalAudit, pandaValidator, sentinel, seo, deployGate, manualReview)
- **Remediation_Category**: The classification of the remediation action required (RESIDUE_REMOVAL, LENGTH_ADJUSTMENT, FAKE_CLAIM_REMOVAL, etc.)
- **Safety_Level**: The degree of automation safety for a remediation action (SAFE_FORMAT_ONLY, SAFE_TEXTUAL_SUGGESTION, REQUIRES_HUMAN_APPROVAL, HUMAN_ONLY, FORBIDDEN_TO_AUTOFIX)
- **Remediation_Suggestion**: A structured proposal for fixing a specific content issue with safety constraints
- **Remediation_Plan**: A collection of remediation suggestions with publish-blocking status
- **Verification_Script**: An executable test that validates type system correctness and safety invariants

## Requirements

### Requirement 1: Remediation Type System

**User Story:** As a developer, I want a complete type system for remediation data, so that all remediation operations have strict contracts.

#### Acceptance Criteria

1. THE Remediation_Engine SHALL define a RemediationSource enum with values: globalAudit, pandaValidator, sentinel, seo, deployGate, manualReview
2. THE Remediation_Engine SHALL define a RemediationCategory enum with values: RESIDUE_REMOVAL, LENGTH_ADJUSTMENT, FAKE_CLAIM_REMOVAL, DETERMINISTIC_LANGUAGE_NEUTRALIZATION, MISSING_FIELD_GENERATION, FOOTER_REPAIR, RISK_NOTE_ADDITION, SEO_DESCRIPTION_REWRITE, HEADLINE_REWRITE, PARITY_REVIEW, PROVENANCE_REVIEW, SOURCE_REVIEW, FORMAT_REPAIR, HUMAN_REVIEW_REQUIRED
3. THE Remediation_Engine SHALL define a RemediationSafetyLevel enum with values: SAFE_FORMAT_ONLY, SAFE_TEXTUAL_SUGGESTION, REQUIRES_HUMAN_APPROVAL, HUMAN_ONLY, FORBIDDEN_TO_AUTOFIX
4. THE Remediation_Engine SHALL define a RemediationSeverity enum with values: INFO, WARNING, HIGH, CRITICAL
5. THE Remediation_Engine SHALL define a RemediationFixType enum with values: remove, rewrite, truncate, expand, neutralize, format, add_missing_generic_text, request_source, request_human_review

### Requirement 2: Remediation Suggestion Interface

**User Story:** As a developer, I want a structured interface for remediation suggestions, so that all fix proposals contain required safety metadata.

#### Acceptance Criteria

1. THE Remediation_Engine SHALL define a RemediationSuggestion interface with fields: id, source, category, severity, safetyLevel, fixType, targetField, issueDescription, suggestedFix, originalContent, canApplyToDraft, requiresHumanApproval, cannotAutoPublish, cannotAutoCommit, cannotAutoPush, cannotAutoDeploy, metadata
2. THE RemediationSuggestion interface SHALL require cannotAutoPublish to default to true
3. THE RemediationSuggestion interface SHALL require cannotAutoCommit to default to true
4. THE RemediationSuggestion interface SHALL require cannotAutoPush to default to true
5. THE RemediationSuggestion interface SHALL require cannotAutoDeploy to default to true
6. THE RemediationSuggestion interface SHALL require requiresHumanApproval to default to true unless safetyLevel is SAFE_FORMAT_ONLY

### Requirement 3: Remediation Plan Interface

**User Story:** As a developer, I want a remediation plan structure, so that multiple suggestions can be grouped with publish-blocking status.

#### Acceptance Criteria

1. THE Remediation_Engine SHALL define a RemediationPlan interface with fields: articleId, suggestions, publishStillBlocked, createdAt, lastUpdatedAt
2. THE RemediationPlan interface SHALL define publishStillBlocked as literal type true
3. THE RemediationPlan interface SHALL include a suggestions array of RemediationSuggestion objects
4. THE RemediationPlan interface SHALL include timestamp fields for audit trail

### Requirement 4: Safety Constraint Enforcement

**User Story:** As a security engineer, I want type-level safety constraints, so that dangerous automation is prevented at compile time.

#### Acceptance Criteria

1. WHEN a RemediationSuggestion has safetyLevel HUMAN_ONLY, THE Remediation_Engine SHALL enforce canApplyToDraft as false
2. WHEN a RemediationSuggestion has safetyLevel FORBIDDEN_TO_AUTOFIX, THE Remediation_Engine SHALL enforce canApplyToDraft as false
3. WHEN a RemediationSuggestion has category PROVENANCE_REVIEW, THE Remediation_Engine SHALL enforce safetyLevel as HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX
4. WHEN a RemediationSuggestion has category SOURCE_REVIEW, THE Remediation_Engine SHALL enforce safetyLevel as HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX
5. WHEN a RemediationSuggestion has category PARITY_REVIEW, THE Remediation_Engine SHALL enforce safetyLevel as HUMAN_ONLY

### Requirement 5: Type Guard Helper Functions

**User Story:** As a developer, I want type guard functions, so that I can safely narrow remediation types at runtime.

#### Acceptance Criteria

1. THE Remediation_Engine SHALL provide an isSafeFormatOnly function that returns true when safetyLevel is SAFE_FORMAT_ONLY
2. THE Remediation_Engine SHALL provide a requiresHumanReview function that returns true when safetyLevel is HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX
3. THE Remediation_Engine SHALL provide an isAutoApplicable function that returns true when canApplyToDraft is true and requiresHumanApproval is false
4. THE Remediation_Engine SHALL provide a canPublishAfterFix function that always returns false (since publishStillBlocked is literal true)

### Requirement 6: Verification Script

**User Story:** As a developer, I want an automated verification script, so that I can validate type system correctness without manual testing.

#### Acceptance Criteria

1. THE Verification_Script SHALL test all RemediationSource enum values
2. THE Verification_Script SHALL test all RemediationCategory enum values
3. THE Verification_Script SHALL test all RemediationSafetyLevel enum values
4. THE Verification_Script SHALL validate that HUMAN_ONLY suggestions have canApplyToDraft false
5. THE Verification_Script SHALL validate that FORBIDDEN_TO_AUTOFIX suggestions have canApplyToDraft false
6. THE Verification_Script SHALL validate that PROVENANCE_REVIEW requires HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX
7. THE Verification_Script SHALL validate that SOURCE_REVIEW requires HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX
8. THE Verification_Script SHALL validate that PARITY_REVIEW requires HUMAN_ONLY
9. THE Verification_Script SHALL validate that RemediationPlan.publishStillBlocked is always true
10. THE Verification_Script SHALL exit with code 0 on success and non-zero on failure

### Requirement 7: No Runtime Behavior Changes

**User Story:** As a system operator, I want assurance that no runtime behavior changes, so that existing systems remain stable.

#### Acceptance Criteria

1. THE Remediation_Engine SHALL NOT modify app/admin/warroom/page.tsx
2. THE Remediation_Engine SHALL NOT modify lib/neural-assembly/global-governance-audit.ts
3. THE Remediation_Engine SHALL NOT modify lib/neural-assembly/panda-intake-validator.ts
4. THE Remediation_Engine SHALL NOT modify lib/neural-assembly/sia-sentinel-core.ts
5. THE Remediation_Engine SHALL NOT modify any publish, save, or API route files
6. THE Remediation_Engine SHALL NOT implement UI components
7. THE Remediation_Engine SHALL NOT implement Apply to Draft functionality
8. THE Remediation_Engine SHALL NOT implement runtime remediation logic

### Requirement 8: File Creation Constraints

**User Story:** As a developer, I want strict file creation rules, so that only the required files are created.

#### Acceptance Criteria

1. THE Remediation_Engine SHALL create exactly one file at lib/editorial/remediation-types.ts
2. THE Verification_Script SHALL create exactly one file at scripts/verify-remediation-engine.ts
3. WHEN implementation is complete, THE system SHALL show only 2 new files in git status
4. THE Remediation_Engine SHALL NOT create any other files beyond the two specified

### Requirement 9: TypeScript Compilation

**User Story:** As a developer, I want type-safe code, so that compilation catches errors before runtime.

#### Acceptance Criteria

1. WHEN npm run type-check is executed, THE Remediation_Engine SHALL compile without errors
2. WHEN npm run type-check is executed, THE Verification_Script SHALL compile without errors
3. THE Remediation_Engine SHALL use strict TypeScript configuration
4. THE Remediation_Engine SHALL export all public types for external consumption

### Requirement 10: Verification Script Execution

**User Story:** As a developer, I want executable verification, so that I can validate safety invariants automatically.

#### Acceptance Criteria

1. WHEN npx tsx scripts/verify-remediation-engine.ts is executed, THE Verification_Script SHALL run all test cases
2. WHEN all tests pass, THE Verification_Script SHALL exit with code 0
3. WHEN any test fails, THE Verification_Script SHALL exit with non-zero code
4. THE Verification_Script SHALL require no network access
5. THE Verification_Script SHALL require no file system mutations
6. THE Verification_Script SHALL require no external service calls
7. THE Verification_Script SHALL output clear pass/fail messages for each test case

### Requirement 11: Safety Invariant Documentation

**User Story:** As a security auditor, I want documented safety invariants, so that I can verify fail-closed design.

#### Acceptance Criteria

1. THE Remediation_Engine SHALL document that cannotAutoPublish defaults to true
2. THE Remediation_Engine SHALL document that cannotAutoCommit defaults to true
3. THE Remediation_Engine SHALL document that cannotAutoPush defaults to true
4. THE Remediation_Engine SHALL document that cannotAutoDeploy defaults to true
5. THE Remediation_Engine SHALL document that requiresHumanApproval defaults to true unless SAFE_FORMAT_ONLY
6. THE Remediation_Engine SHALL document that HUMAN_ONLY and FORBIDDEN_TO_AUTOFIX prevent canApplyToDraft
7. THE Remediation_Engine SHALL document that RemediationPlan.publishStillBlocked is always true

### Requirement 12: Forbidden Content Generation

**User Story:** As a compliance officer, I want guarantees against content fabrication, so that editorial integrity is maintained.

#### Acceptance Criteria

1. THE Remediation_Engine SHALL document that E-E-A-T credentials must never be generated
2. THE Remediation_Engine SHALL document that source attribution must never be fabricated
3. THE Remediation_Engine SHALL document that provenance data must never be fabricated
4. THE Remediation_Engine SHALL enforce that missing sources require HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX
5. THE Remediation_Engine SHALL enforce that missing provenance requires HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX

