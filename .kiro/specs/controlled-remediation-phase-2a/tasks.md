# Implementation Tasks

## Overview

This task list implements Controlled Remediation Phase 2A: a pure, deterministic, read-only remediation suggestion generator. The implementation creates exactly 2 files and modifies no existing source files.

**Strict Scope:**
- Create `lib/editorial/remediation-engine.ts` (pure generator module)
- Create `scripts/verify-remediation-generator.ts` (verification harness)
- Modify NO existing source files
- No Warroom UI integration
- No API routes
- No runtime behavior changes

**Safety Invariants:**
- All suggestions have cannotAutoPublish/Commit/Push/Deploy === true
- publishStillBlocked remains literal type `true`
- PROVENANCE_REVIEW, SOURCE_REVIEW, PARITY_REVIEW have suggestedText === null
- No source/provenance/E-E-A-T fabrication
- Conservative fallback to HUMAN_REVIEW_REQUIRED when uncertain

---

## Task 1: Create Generator Module Foundation

**File:** `lib/editorial/remediation-engine.ts`

Create the pure generator module with type definitions, imports, and basic structure.

### Sub-tasks

- [ ] 1.1 Add file header with JSDoc documentation explaining Phase 2A scope and safety rules
- [ ] 1.2 Import Phase 1 types from `lib/editorial/remediation-types.ts`
- [ ] 1.3 Import Node.js `crypto` module for deterministic ID generation
- [ ] 1.4 Define `GeneratorInput` interface with optional fields (articleId, packageId, globalAudit, pandaValidationErrors, deployLockReasons, auditResult)
- [ ] 1.5 Define internal helper types: `BaseSuggestionParams`, `PlanCounts`
- [ ] 1.6 Add JSDoc comments for all exported types

**Acceptance Criteria:**
- File compiles without errors
- All imports resolve correctly
- GeneratorInput interface matches design specification
- No runtime code yet (types only)

---

## Task 2: Implement Safe Access Helpers

**File:** `lib/editorial/remediation-engine.ts`

Implement utility functions for safely accessing unknown data structures.

### Sub-tasks

- [ ] 2.1 Implement `safeString(value: unknown, fallback?: string): string` - safely extract string from unknown value
- [ ] 2.2 Implement `safeArray(value: unknown): unknown[]` - safely extract array from unknown value, return empty array if not array
- [ ] 2.3 Implement `safeObject(value: unknown): Record<string, unknown> | null` - safely extract object from unknown value, return null if not object
- [ ] 2.4 Implement `normalizeSeverity(input: unknown): RemediationSeverity` - convert various severity representations to enum, fallback to WARNING
- [ ] 2.5 Add JSDoc comments explaining safe access behavior and fallback rules

**Acceptance Criteria:**
- All helpers handle null/undefined gracefully
- All helpers handle malformed input without throwing
- Type guards work correctly
- Fallback values are conservative

---

## Task 3: Implement Deterministic ID Generation

**File:** `lib/editorial/remediation-engine.ts`

Implement stable ID generation for suggestions using cryptographic hashing.

### Sub-tasks

- [ ] 3.1 Implement `stableSuggestionId(articleId: string, category: string, field: string, language: string): string` using SHA-256 hash
- [ ] 3.2 Hash input format: `${articleId}:${category}:${field}:${language}`
- [ ] 3.3 Return first 16 characters of hex digest
- [ ] 3.4 Handle missing/undefined parameters with fallback values (e.g., 'unknown')
- [ ] 3.5 Add JSDoc explaining deterministic behavior

**Acceptance Criteria:**
- Same input produces same ID (deterministic)
- Different inputs produce different IDs
- IDs are 16-character hex strings
- No collisions for typical use cases

---

## Task 4: Implement Base Suggestion Creator

**File:** `lib/editorial/remediation-engine.ts`

Implement helper function to create RemediationSuggestion with all safety flags set correctly.

### Sub-tasks

- [ ] 4.1 Implement `createBaseSuggestion(params: BaseSuggestionParams): RemediationSuggestion`
- [ ] 4.2 Set all fail-closed flags: cannotAutoPublish/Commit/Push/Deploy to true
- [ ] 4.3 Set requiresHumanApproval based on safetyLevel (true except for SAFE_FORMAT_ONLY)
- [ ] 4.4 Set canApplyToDraft to false if safetyLevel is HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX
- [ ] 4.5 Set content integrity flags based on category (preservesFacts, preservesNumbers, preservesProvenance, requiresSourceVerification)
- [ ] 4.6 Generate deterministic ID using stableSuggestionId
- [ ] 4.7 Set createdAt to current ISO 8601 timestamp
- [ ] 4.8 Call assertNoForbiddenAutomation before returning
- [ ] 4.9 Add JSDoc explaining safety flag logic

**Acceptance Criteria:**
- All suggestions have correct safety flags
- HUMAN_ONLY suggestions have canApplyToDraft === false
- Content integrity flags match category
- assertNoForbiddenAutomation passes for all suggestions

---

## Task 5: Implement Finding Classification

**File:** `lib/editorial/remediation-engine.ts`

Implement logic to classify findings into RemediationCategory values.

### Sub-tasks

- [ ] 5.1 Implement `classifyFinding(finding: unknown): RemediationCategory | null`
- [ ] 5.2 Check for residue patterns (return RESIDUE_REMOVAL)
- [ ] 5.3 Check for fake verification/score patterns (return FAKE_CLAIM_REMOVAL)
- [ ] 5.4 Check for deterministic finance patterns (return DETERMINISTIC_LANGUAGE_NEUTRALIZATION)
- [ ] 5.5 Check for missing source patterns (return SOURCE_REVIEW)
- [ ] 5.6 Check for missing provenance patterns (return PROVENANCE_REVIEW)
- [ ] 5.7 Check for parity patterns (return PARITY_REVIEW)
- [ ] 5.8 Check for malformed markdown patterns (return FORMAT_REPAIR)
- [ ] 5.9 Check for duplicate footer patterns (return FOOTER_REPAIR)
- [ ] 5.10 Return null for unclassifiable findings (conservative fallback)
- [ ] 5.11 Add JSDoc documenting all classification rules

**Acceptance Criteria:**
- All known patterns are classified correctly
- Unknown patterns return null (not HUMAN_REVIEW_REQUIRED yet)
- Classification is deterministic
- No false positives

---

## Task 6: Implement Global Audit Mapping

**File:** `lib/editorial/remediation-engine.ts`

Implement mapping from Global Governance Audit findings to RemediationSuggestion objects.

### Sub-tasks

- [ ] 6.1 Implement `mapFindingToSuggestion(finding: unknown, source: RemediationSource): RemediationSuggestion | null`
- [ ] 6.2 Extract finding metadata: type, message, language, field, severity
- [ ] 6.3 Call classifyFinding to determine category
- [ ] 6.4 If category is null, create HUMAN_REVIEW_REQUIRED suggestion
- [ ] 6.5 Determine safetyLevel based on category
- [ ] 6.6 Generate suggestedText based on category rules (null for PROVENANCE_REVIEW, SOURCE_REVIEW, PARITY_REVIEW)
- [ ] 6.7 Generate rationale explaining why this remediation is suggested
- [ ] 6.8 Call createBaseSuggestion with all parameters
- [ ] 6.9 Return null if finding is malformed (log warning)
- [ ] 6.10 Add JSDoc explaining mapping logic

**Acceptance Criteria:**
- All global audit finding types are mapped correctly
- PROVENANCE_REVIEW, SOURCE_REVIEW, PARITY_REVIEW have suggestedText === null
- Malformed findings are skipped with warning
- All suggestions pass assertNoForbiddenAutomation

---

## Task 7: Implement Panda Validation Mapping

**File:** `lib/editorial/remediation-engine.ts`

Implement mapping from Panda Intake Validator errors to RemediationSuggestion objects.

### Sub-tasks

- [ ] 7.1 Implement `mapPandaErrorToSuggestion(error: unknown): RemediationSuggestion | null`
- [ ] 7.2 Extract error metadata: code, message, lang, field, severity
- [ ] 7.3 Map error codes to categories: RESIDUE_DETECTED → RESIDUE_REMOVAL, FAKE_VERIFICATION → FAKE_CLAIM_REMOVAL, UNSUPPORTED_SCORE → FAKE_CLAIM_REMOVAL, PROVENANCE_FAILURE → PROVENANCE_REVIEW, LANGUAGE_MISSING → HUMAN_REVIEW_REQUIRED, LANGUAGE_MISMATCH → HUMAN_REVIEW_REQUIRED, FOOTER_INTEGRITY_FAILURE → FOOTER_REPAIR, MALFORMED_JSON → HUMAN_REVIEW_REQUIRED
- [ ] 7.4 Determine safetyLevel based on category
- [ ] 7.5 Generate suggestedText based on category rules (null for PROVENANCE_REVIEW)
- [ ] 7.6 Use error.message as issueDescription
- [ ] 7.7 Call createBaseSuggestion with all parameters
- [ ] 7.8 Return null if error is malformed (log warning)
- [ ] 7.9 Add JSDoc explaining Panda error mapping

**Acceptance Criteria:**
- All Panda error codes are mapped correctly
- PROVENANCE_FAILURE maps to PROVENANCE_REVIEW with suggestedText === null
- lang and field are preserved from error object
- Malformed errors are skipped with warning

---

## Task 8: Implement suggestionsFromGlobalAudit

**File:** `lib/editorial/remediation-engine.ts`

Implement public function to extract suggestions from Global Governance Audit results.

### Sub-tasks

- [ ] 8.1 Implement `suggestionsFromGlobalAudit(globalAudit: unknown): RemediationSuggestion[]`
- [ ] 8.2 Validate input structure using safeObject
- [ ] 8.3 Iterate through language-specific audit results (e.g., globalAudit.en, globalAudit.es)
- [ ] 8.4 Extract findings arrays: residueFindings, provenanceFindings, criticalIssues, warnings, parityFindings
- [ ] 8.5 Map each finding using mapFindingToSuggestion
- [ ] 8.6 Filter out null results (malformed findings)
- [ ] 8.7 Return array of suggestions
- [ ] 8.8 Return empty array if input is null/undefined/malformed
- [ ] 8.9 Log warnings for skipped findings
- [ ] 8.10 Add JSDoc with usage examples

**Acceptance Criteria:**
- Handles null/undefined input gracefully
- Iterates through all languages
- Extracts all finding types
- Returns empty array for malformed input
- No exceptions thrown

---

## Task 9: Implement suggestionsFromPandaValidation

**File:** `lib/editorial/remediation-engine.ts`

Implement public function to extract suggestions from Panda Intake Validator errors.

### Sub-tasks

- [ ] 9.1 Implement `suggestionsFromPandaValidation(errors: unknown[]): RemediationSuggestion[]`
- [ ] 9.2 Validate input using safeArray
- [ ] 9.3 Map each error using mapPandaErrorToSuggestion
- [ ] 9.4 Filter out null results (malformed errors)
- [ ] 9.5 Return array of suggestions
- [ ] 9.6 Return empty array if input is null/undefined/malformed
- [ ] 9.7 Log warnings for skipped errors
- [ ] 9.8 Add JSDoc with usage examples

**Acceptance Criteria:**
- Handles null/undefined input gracefully
- Maps all error codes correctly
- Returns empty array for malformed input
- No exceptions thrown

---

## Task 10: Implement Plan Assembly Helpers

**File:** `lib/editorial/remediation-engine.ts`

Implement helper functions for assembling RemediationPlan objects.

### Sub-tasks

- [ ] 10.1 Implement `buildEmptyPlan(articleId?: string, packageId?: string): RemediationPlan` - returns valid empty plan with publishStillBlocked: true and all counts zero
- [ ] 10.2 Implement `calculatePlanCounts(suggestions: RemediationSuggestion[]): PlanCounts` - calculates totalIssues, safeSuggestionCount, requiresApprovalCount, humanOnlyCount, criticalCount
- [ ] 10.3 Implement `deduplicateById(suggestions: RemediationSuggestion[]): RemediationSuggestion[]` - removes duplicate suggestions by ID (optional, may defer if not needed)
- [ ] 10.4 Add JSDoc explaining count calculation logic

**Acceptance Criteria:**
- Empty plan has publishStillBlocked === true (literal type)
- Counts match actual suggestion categories
- Deduplication preserves first occurrence
- All helpers are pure functions

---

## Task 11: Implement generateRemediationPlan

**File:** `lib/editorial/remediation-engine.ts`

Implement main entry point for generating complete remediation plans.

### Sub-tasks

- [ ] 11.1 Implement `generateRemediationPlan(input: GeneratorInput): RemediationPlan`
- [ ] 11.2 Handle null/undefined input by returning empty plan
- [ ] 11.3 Call suggestionsFromGlobalAudit(input.globalAudit)
- [ ] 11.4 Call suggestionsFromPandaValidation(input.pandaValidationErrors)
- [ ] 11.5 Combine suggestions from all sources
- [ ] 11.6 Deduplicate suggestions if needed
- [ ] 11.7 Calculate counts using calculatePlanCounts
- [ ] 11.8 Assemble RemediationPlan with all fields
- [ ] 11.9 Set publishStillBlocked to literal true
- [ ] 11.10 Set createdAt to current ISO 8601 timestamp
- [ ] 11.11 Call validateRemediationPlan before returning
- [ ] 11.12 Return empty plan if validation fails (log error)
- [ ] 11.13 Add comprehensive JSDoc with usage examples

**Acceptance Criteria:**
- Handles all input combinations correctly
- Returns valid empty plan for empty input
- Combines suggestions from all sources
- Calls validateRemediationPlan before returning
- publishStillBlocked is literal type true
- No exceptions thrown for normal input

---

## Task 12: Create Verification Script Foundation

**File:** `scripts/verify-remediation-generator.ts`

Create verification harness with test infrastructure.

### Sub-tasks

- [ ] 12.1 Add file header with JSDoc explaining verification scope
- [ ] 12.2 Import generator functions from `lib/editorial/remediation-engine.ts`
- [ ] 12.3 Import Phase 1 types and helpers from `lib/editorial/remediation-types.ts`
- [ ] 12.4 Define test result tracking: passCount, failCount, testResults array
- [ ] 12.5 Implement `runTest(name: string, testFn: () => boolean): void` - executes test and tracks result
- [ ] 12.6 Implement `assertEqual(actual: unknown, expected: unknown, message: string): void` - assertion helper
- [ ] 12.7 Implement `assertNotNull(value: unknown, message: string): void` - null check helper
- [ ] 12.8 Implement `printResults(): void` - prints test summary and exits with appropriate code

**Acceptance Criteria:**
- Test infrastructure compiles without errors
- Test tracking works correctly
- Assertion helpers throw on failure
- Exit code 0 on success, non-zero on failure

---

## Task 13: Implement Core Verification Tests

**File:** `scripts/verify-remediation-generator.ts`

Implement tests for empty input, residue, fake verification, and deterministic finance mappings.

### Sub-tasks

- [ ] 13.1 Implement Test 1: Empty Input - verify null/undefined/empty object returns valid empty plan with publishStillBlocked: true and totalIssues: 0
- [ ] 13.2 Implement Test 2: Residue Finding - verify global audit residue finding maps to RESIDUE_REMOVAL with correct safety flags
- [ ] 13.3 Implement Test 3: Fake Verification - verify provenance finding with "verification" maps to FAKE_CLAIM_REMOVAL
- [ ] 13.4 Implement Test 4: Deterministic Finance - verify critical issue with "Deterministic financial" maps to DETERMINISTIC_LANGUAGE_NEUTRALIZATION
- [ ] 13.5 Add assertions for category, safetyLevel, and safety flags for each test

**Acceptance Criteria:**
- All 4 tests pass with correct mappings
- Empty input test verifies publishStillBlocked === true
- Safety flags are validated for each suggestion
- Tests are deterministic and repeatable

---

## Task 14: Implement Human-Only Verification Tests

**File:** `scripts/verify-remediation-generator.ts`

Implement tests for SOURCE_REVIEW, PROVENANCE_REVIEW, and PARITY_REVIEW mappings.

### Sub-tasks

- [ ] 14.1 Implement Test 5: Missing Source - verify critical issue with "missing" and "source" maps to SOURCE_REVIEW with suggestedText === null
- [ ] 14.2 Implement Test 6: Missing Provenance - verify provenance finding with "missing" or "provenance" maps to PROVENANCE_REVIEW with suggestedText === null
- [ ] 14.3 Implement Test 7: Numeric Parity - verify parity finding maps to PARITY_REVIEW with suggestedText === null
- [ ] 14.4 Add assertions verifying suggestedText === null for all three tests
- [ ] 14.5 Add assertions verifying safetyLevel === HUMAN_ONLY for all three tests

**Acceptance Criteria:**
- All 3 tests pass with correct mappings
- suggestedText is null for all human-only categories
- safetyLevel is HUMAN_ONLY
- canApplyToDraft is false

---

## Task 15: Implement Panda Validation Tests

**File:** `scripts/verify-remediation-generator.ts`

Implement tests for Panda Intake Validator error mappings.

### Sub-tasks

- [ ] 15.1 Implement Test 8: Panda RESIDUE_DETECTED - verify error code RESIDUE_DETECTED maps to RESIDUE_REMOVAL
- [ ] 15.2 Implement Test 9: Panda FAKE_VERIFICATION - verify error code FAKE_VERIFICATION maps to FAKE_CLAIM_REMOVAL
- [ ] 15.3 Add assertions for category, source (pandaValidator), and safety flags
- [ ] 15.4 Verify lang and field are preserved from error object

**Acceptance Criteria:**
- Both tests pass with correct mappings
- source is RemediationSource.pandaValidator
- lang and field are preserved
- Safety flags are correct

---

## Task 16: Implement Safety and Immutability Tests

**File:** `scripts/verify-remediation-generator.ts`

Implement tests for input immutability, count correctness, and forbidden automation.

### Sub-tasks

- [ ] 16.1 Implement Test 10: Input Immutability - create input object, call generateRemediationPlan, verify input unchanged using deep equality
- [ ] 16.2 Implement Test 11: Counts Correctness - create mixed findings, verify totalIssues, safeSuggestionCount, requiresApprovalCount, humanOnlyCount, criticalCount match actual suggestions
- [ ] 16.3 Implement Test 12: No Forbidden Automation - verify all suggestions have cannotAutoPublish/Commit/Push/Deploy === true
- [ ] 16.4 Implement Test 13: publishStillBlocked - verify plan.publishStillBlocked === true (literal type)

**Acceptance Criteria:**
- Input immutability test passes (no mutations)
- Count calculations are correct
- All safety flags are true
- publishStillBlocked is literal true

---

## Task 17: Finalize Verification Script

**File:** `scripts/verify-remediation-generator.ts`

Complete verification script with output formatting and execution.

### Sub-tasks

- [ ] 17.1 Implement main execution function that runs all 13+ tests
- [ ] 17.2 Print test results with ✓ for pass, ✗ for fail
- [ ] 17.3 Print summary: "All X tests passed" or "Y test(s) failed"
- [ ] 17.4 Print "CONTROLLED_REMEDIATION_GENERATOR_VERIFICATION_PASS" on success
- [ ] 17.5 Print "CONTROLLED_REMEDIATION_GENERATOR_VERIFICATION_FAIL" on failure
- [ ] 17.6 Exit with code 0 on success, 1 on failure
- [ ] 17.7 Add error handling for unexpected exceptions

**Acceptance Criteria:**
- Script runs all tests
- Output is clear and readable
- Exit code is correct
- Success message is printed on pass

---

## Task 18: Type Check and Phase 1 Regression

**Validation Commands:**
```bash
npm run type-check
npx tsx scripts/verify-remediation-engine.ts
```

Verify that Phase 2A implementation compiles and Phase 1 tests still pass.

### Sub-tasks

- [ ] 18.1 Run `npm run type-check` and verify no compilation errors
- [ ] 18.2 Run `npx tsx scripts/verify-remediation-engine.ts` and verify 8/8 tests pass (Phase 1 regression check)
- [ ] 18.3 Fix any type errors or Phase 1 regressions
- [ ] 18.4 Verify no new TypeScript errors introduced

**Acceptance Criteria:**
- npm run type-check passes with 0 errors
- Phase 1 verification passes (8/8 tests)
- No regressions in existing types
- All imports resolve correctly

---

## Task 19: Phase 2A Verification

**Validation Command:**
```bash
npx tsx scripts/verify-remediation-generator.ts
```

Run Phase 2A verification script and ensure all tests pass.

### Sub-tasks

- [ ] 19.1 Run `npx tsx scripts/verify-remediation-generator.ts`
- [ ] 19.2 Verify all 13+ tests pass
- [ ] 19.3 Verify output prints "CONTROLLED_REMEDIATION_GENERATOR_VERIFICATION_PASS"
- [ ] 19.4 Verify exit code is 0
- [ ] 19.5 Fix any failing tests

**Acceptance Criteria:**
- All tests pass (13+/13+)
- Success message is printed
- Exit code is 0
- No warnings or errors

---

## Task 20: Existing System Regression Tests

**Validation Commands:**
```bash
npx tsx scripts/verify-global-audit.ts
npx tsx scripts/verify-panda-intake.ts
```

Verify that existing audit and validation systems are not affected by Phase 2A.

### Sub-tasks

- [ ] 20.1 Run `npx tsx scripts/verify-global-audit.ts` and verify all tests pass
- [ ] 20.2 Run `npx tsx scripts/verify-panda-intake.ts` and verify all tests pass
- [ ] 20.3 Fix any regressions if tests fail
- [ ] 20.4 Verify no existing source files were modified

**Acceptance Criteria:**
- Global audit verification passes
- Panda intake verification passes
- No regressions in existing systems
- No source files modified (except the 2 new files)

---

## Task 21: Final Validation and Documentation

Perform final checks and ensure all success criteria are met.

### Sub-tasks

- [ ] 21.1 Run `git status` and verify only 2 new files: `lib/editorial/remediation-engine.ts` and `scripts/verify-remediation-generator.ts`
- [ ] 21.2 Verify no existing source files were modified (Warroom UI, audit systems, API routes)
- [ ] 21.3 Run all validation commands in sequence and verify all pass
- [ ] 21.4 Review code for safety invariant compliance
- [ ] 21.5 Verify no LLM calls, no network calls, no file mutations in generator
- [ ] 21.6 Verify generator is pure and deterministic
- [ ] 21.7 Update .config.kiro phase to "complete"

**Acceptance Criteria:**
- Only 2 new files in git status
- All validation commands pass
- No source files modified
- All safety invariants preserved
- Generator is pure and deterministic
- Phase 2A is complete

---

## Success Criteria

Phase 2A is complete when ALL of the following are true:

- ✅ `lib/editorial/remediation-engine.ts` exists with all generator functions
- ✅ `scripts/verify-remediation-generator.ts` exists with 13+ test cases
- ✅ `npm run type-check` passes without errors
- ✅ `npx tsx scripts/verify-remediation-engine.ts` passes (8/8 tests - Phase 1)
- ✅ `npx tsx scripts/verify-remediation-generator.ts` passes (13+ tests - Phase 2A)
- ✅ `npx tsx scripts/verify-global-audit.ts` passes (no regressions)
- ✅ `npx tsx scripts/verify-panda-intake.ts` passes (no regressions)
- ✅ `git status` shows only 2 new files
- ✅ No source files modified (Warroom UI, audit systems, API routes)
- ✅ All safety invariants preserved from Phase 1
- ✅ Generator is pure and deterministic
- ✅ No LLM calls, no network calls, no file mutations

---

## Out of Scope Reminders

The following are explicitly OUT OF SCOPE for Phase 2A:

- ❌ Warroom UI modifications
- ❌ RemediationPanel component
- ❌ Apply to Draft functionality
- ❌ API route modifications
- ❌ Vault content mutation
- ❌ Publish/save behavior changes
- ❌ Deploy gate modifications
- ❌ Auto-fix/publish/commit/push/deploy capabilities
- ❌ Database persistence
- ❌ Network calls
- ❌ LLM calls

---

## Safety Reminders

**CRITICAL SAFETY RULES:**

1. **Pure Functions:** Generator must be pure (no side effects, no mutations, deterministic)
2. **Fail-Closed Design:** All automation flags must remain "forbidden"
3. **Literal Type True:** publishStillBlocked must remain literal type `true`
4. **Human Approval Required:** requiresHumanApproval defaults to true
5. **No Content Fabrication:** Never generate sources, provenance, or E-E-A-T credentials
6. **Human-Only Categories:** PROVENANCE_REVIEW, SOURCE_REVIEW, PARITY_REVIEW must have suggestedText === null
7. **No LLM Calls:** All text generation must use deterministic templates
8. **Conservative Fallback:** Ambiguous findings become HUMAN_REVIEW_REQUIRED
9. **No Runtime Integration:** Phase 2A does not integrate with Warroom UI or API routes
10. **Read-Only:** Phase 2A does not modify vault content, audit systems, or validation systems

**If any of these rules are violated, Phase 2A is BLOCKED.**
