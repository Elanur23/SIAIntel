# Implementation Tasks

## Overview

This document outlines the implementation tasks for Controlled Autonomous Remediation Phase 1 (Types-Only Foundation). All tasks must maintain strict fail-closed safety guarantees and create only type definitions without runtime behavior.

**Phase 1 Scope:** Types-only foundation
**Files to Create:** 2 files only
**Files to Modify:** 0 files

---

## Task 1: Create Remediation Type Contract

**Requirements:** Requirement 1, Requirement 2, Requirement 3

Create `lib/editorial/remediation-types.ts` with all type definitions.

- [ ] 1.1 Create file `lib/editorial/remediation-types.ts`
- [ ] 1.2 Add RemediationSource enum
  - [ ] globalAudit
  - [ ] pandaValidator
  - [ ] sentinel
  - [ ] seo
  - [ ] deployGate
  - [ ] manualReview
- [ ] 1.3 Add RemediationCategory enum
  - [ ] RESIDUE_REMOVAL
  - [ ] LENGTH_ADJUSTMENT
  - [ ] FAKE_CLAIM_REMOVAL
  - [ ] DETERMINISTIC_LANGUAGE_NEUTRALIZATION
  - [ ] MISSING_FIELD_GENERATION
  - [ ] FOOTER_REPAIR
  - [ ] RISK_NOTE_ADDITION
  - [ ] SEO_DESCRIPTION_REWRITE
  - [ ] HEADLINE_REWRITE
  - [ ] PARITY_REVIEW
  - [ ] PROVENANCE_REVIEW
  - [ ] SOURCE_REVIEW
  - [ ] FORMAT_REPAIR
  - [ ] HUMAN_REVIEW_REQUIRED
- [ ] 1.4 Add RemediationSafetyLevel enum
  - [ ] SAFE_FORMAT_ONLY
  - [ ] SAFE_TEXTUAL_SUGGESTION
  - [ ] REQUIRES_HUMAN_APPROVAL
  - [ ] HUMAN_ONLY
  - [ ] FORBIDDEN_TO_AUTOFIX
- [ ] 1.5 Add RemediationSeverity enum
  - [ ] INFO
  - [ ] WARNING
  - [ ] HIGH
  - [ ] CRITICAL
- [ ] 1.6 Add RemediationFixType enum
  - [ ] remove
  - [ ] rewrite
  - [ ] truncate
  - [ ] expand
  - [ ] neutralize
  - [ ] format
  - [ ] add_missing_generic_text
  - [ ] request_source
  - [ ] request_human_review
- [ ] 1.7 Add RemediationSuggestion interface
  - [ ] id: string
  - [ ] issueId?: string
  - [ ] source: RemediationSource
  - [ ] category: RemediationCategory
  - [ ] severity: RemediationSeverity
  - [ ] safetyLevel: RemediationSafetyLevel
  - [ ] affectedLanguage?: string
  - [ ] affectedField?: string
  - [ ] issueType: string
  - [ ] issueDescription: string
  - [ ] originalText?: string
  - [ ] suggestedText?: string | null
  - [ ] rationale: string
  - [ ] fixType: RemediationFixType
  - [ ] confidence?: number
  - [ ] requiresHumanApproval: boolean
  - [ ] canApplyToDraft: boolean
  - [ ] cannotAutoPublish: boolean
  - [ ] cannotAutoCommit: boolean
  - [ ] cannotAutoPush: boolean
  - [ ] cannotAutoDeploy: boolean
  - [ ] preservesFacts: boolean
  - [ ] preservesNumbers: boolean
  - [ ] preservesProvenance: boolean
  - [ ] requiresSourceVerification: boolean
  - [ ] validationTests: string[]
  - [ ] createdAt: string
  - [ ] appliedAt?: string | null
  - [ ] approvedBy?: string | null
  - [ ] rejectedAt?: string | null
- [ ] 1.8 Add RemediationPlan interface
  - [ ] articleId?: string
  - [ ] packageId?: string
  - [ ] suggestions: RemediationSuggestion[]
  - [ ] totalIssues: number
  - [ ] safeSuggestionCount: number
  - [ ] requiresApprovalCount: number
  - [ ] humanOnlyCount: number
  - [ ] criticalCount: number
  - [ ] createdAt: string
  - [ ] publishStillBlocked: true (CRITICAL: literal type true, not boolean)

**Success Criteria:**
- All enums defined with correct values
- All interfaces defined with correct field types
- publishStillBlocked is literal type `true`
- File compiles without TypeScript errors
- No runtime logic included

---

## Task 2: Add Pure Safety Helper Functions

**Requirements:** Requirement 5

Add pure helper functions to `lib/editorial/remediation-types.ts`.

- [ ] 2.1 Add isHumanOnlySuggestion function
  - [ ] Function signature: `(suggestion: RemediationSuggestion) => boolean`
  - [ ] Returns true if safetyLevel is HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX
  - [ ] Pure function (no side effects, no mutations)
- [ ] 2.2 Add requiresApproval function
  - [ ] Function signature: `(suggestion: RemediationSuggestion) => boolean`
  - [ ] Returns suggestion.requiresHumanApproval
  - [ ] Pure function (no side effects, no mutations)
- [ ] 2.3 Add canOnlySuggest function
  - [ ] Function signature: `(suggestion: RemediationSuggestion) => boolean`
  - [ ] Returns !suggestion.canApplyToDraft
  - [ ] Pure function (no side effects, no mutations)
- [ ] 2.4 Add assertNoForbiddenAutomation function
  - [ ] Function signature: `(suggestion: RemediationSuggestion) => void`
  - [ ] Throws error if cannotAutoPublish !== true
  - [ ] Throws error if cannotAutoCommit !== true
  - [ ] Throws error if cannotAutoPush !== true
  - [ ] Throws error if cannotAutoDeploy !== true
  - [ ] Throws error if HUMAN_ONLY/FORBIDDEN_TO_AUTOFIX and canApplyToDraft !== false
  - [ ] Pure function (no side effects except throwing, no mutations)
- [ ] 2.5 Add validateRemediationPlan function
  - [ ] Function signature: `(plan: RemediationPlan) => void`
  - [ ] Validates publishStillBlocked === true
  - [ ] Validates totalIssues === suggestions.length
  - [ ] Validates counts match actual suggestion categories
  - [ ] Calls assertNoForbiddenAutomation for all suggestions
  - [ ] Pure function (no side effects except throwing, no mutations)
- [ ] 2.6 Confirm all helpers are pure
  - [ ] No network calls
  - [ ] No file system access
  - [ ] No database queries
  - [ ] No mutations of input parameters
  - [ ] No global state modifications

**Success Criteria:**
- All 5 helper functions implemented
- All functions are pure (no side effects, no mutations)
- Functions compile without TypeScript errors
- Functions enforce safety invariants

---

## Task 3: Add Safety Documentation

**Requirements:** Requirement 11, Requirement 12

Add JSDoc comments documenting safety invariants.

- [ ] 3.1 Add file-level JSDoc comment
  - [ ] Explain Phase 1 is types-only
  - [ ] Explain fail-closed design
  - [ ] Explain no runtime behavior
- [ ] 3.2 Document RemediationSuggestion safety flags
  - [ ] cannotAutoPublish: Must always be true
  - [ ] cannotAutoCommit: Must always be true
  - [ ] cannotAutoPush: Must always be true
  - [ ] cannotAutoDeploy: Must always be true
  - [ ] requiresHumanApproval: Defaults to true unless SAFE_FORMAT_ONLY
- [ ] 3.3 Document RemediationPlan.publishStillBlocked
  - [ ] Explain literal type true (not boolean)
  - [ ] Explain remediation never unlocks publish
- [ ] 3.4 Document forbidden content generation
  - [ ] E-E-A-T credentials must never be generated
  - [ ] Source attribution must never be fabricated
  - [ ] Provenance data must never be fabricated
- [ ] 3.5 Document category-specific safety rules
  - [ ] PROVENANCE_REVIEW: Must be HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX
  - [ ] SOURCE_REVIEW: Must be HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX
  - [ ] PARITY_REVIEW: Must be HUMAN_ONLY
- [ ] 3.6 Document helper function invariants
  - [ ] isHumanOnlySuggestion: If true, canApplyToDraft must be false
  - [ ] assertNoForbiddenAutomation: Enforces all safety flags
  - [ ] validateRemediationPlan: Enforces plan-level invariants

**Success Criteria:**
- All types have JSDoc comments
- All safety-critical fields documented
- All invariants explicitly stated
- Documentation explains fail-closed design

---

## Task 4: Create Verification Script

**Requirements:** Requirement 6, Requirement 10

Create `scripts/verify-remediation-engine.ts` with all test cases.

- [ ] 4.1 Create file `scripts/verify-remediation-engine.ts`
- [ ] 4.2 Import types and helpers from `lib/editorial/remediation-types.ts`
- [ ] 4.3 Add assertion helper
  - [ ] `assert(condition: boolean, message: string): void`
  - [ ] Collects failures in array
  - [ ] Does not throw immediately
- [ ] 4.4 Add Test Case 1: Residue Removal Suggestion
  - [ ] category: RESIDUE_REMOVAL
  - [ ] safetyLevel: REQUIRES_HUMAN_APPROVAL
  - [ ] requiresHumanApproval: true
  - [ ] cannotAutoPublish/Commit/Push/Deploy: true
- [ ] 4.5 Add Test Case 2: Formatting-Only Suggestion
  - [ ] category: FORMAT_REPAIR
  - [ ] safetyLevel: SAFE_FORMAT_ONLY
  - [ ] canApplyToDraft: may be true
  - [ ] cannotAutoPublish/Commit/Push/Deploy: must still be true
- [ ] 4.6 Add Test Case 3: Fake Verification Removal
  - [ ] category: FAKE_CLAIM_REMOVAL
  - [ ] requiresHumanApproval: true
  - [ ] preservesProvenance: true OR requiresSourceVerification: true
  - [ ] cannotAutoPublish: true
- [ ] 4.7 Add Test Case 4: Deterministic Finance Neutralization
  - [ ] category: DETERMINISTIC_LANGUAGE_NEUTRALIZATION
  - [ ] requiresHumanApproval: true
  - [ ] preservesFacts: false OR requiresSourceVerification: true
  - [ ] cannotAutoPublish: true
- [ ] 4.8 Add Test Case 5: Missing Provenance/Source
  - [ ] category: PROVENANCE_REVIEW OR SOURCE_REVIEW
  - [ ] safetyLevel: HUMAN_ONLY OR FORBIDDEN_TO_AUTOFIX
  - [ ] canApplyToDraft: false
  - [ ] suggestedText: null
  - [ ] requiresSourceVerification: true
- [ ] 4.9 Add Test Case 6: Numeric Parity Mismatch
  - [ ] category: PARITY_REVIEW
  - [ ] safetyLevel: HUMAN_ONLY
  - [ ] canApplyToDraft: false
  - [ ] suggestedText: null
- [ ] 4.10 Add Test Case 7: RemediationPlan Validation
  - [ ] publishStillBlocked: must be true
  - [ ] totalIssues: must equal suggestions.length
  - [ ] Counts must match actual suggestion categories/safety levels
- [ ] 4.11 Add Test Case 8: No Forbidden Automation
  - [ ] Assert every sample suggestion has cannotAutoPublish === true
  - [ ] Assert every sample suggestion has cannotAutoCommit === true
  - [ ] Assert every sample suggestion has cannotAutoPush === true
  - [ ] Assert every sample suggestion has cannotAutoDeploy === true
- [ ] 4.12 Add output formatting
  - [ ] Print "CONTROLLED_REMEDIATION_TYPES_VERIFICATION_PASS" on success
  - [ ] Print test case results (✓ or ✗)
  - [ ] Print failure details if any test fails
  - [ ] Print total test count
- [ ] 4.13 Add exit code handling
  - [ ] Exit with code 0 if all tests pass
  - [ ] Exit with code 1 if any test fails
- [ ] 4.14 Confirm script constraints
  - [ ] No network access
  - [ ] No file system mutations
  - [ ] No external service calls (no git, no Vercel, no publish APIs)
  - [ ] No Warroom vault modifications
  - [ ] No audit system integration

**Success Criteria:**
- Script exists at `scripts/verify-remediation-engine.ts`
- All 8 test cases implemented
- Script exits with code 0 on success
- Script exits with code 1 on failure
- Script prints clear pass/fail messages
- Script has no side effects (no network, no file mutations)

---

## Task 5: Run Validation

**Requirements:** Requirement 9, Requirement 10

Run all validation commands to ensure correctness.

- [ ] 5.1 Run TypeScript type checking
  - [ ] Command: `npm run type-check`
  - [ ] Expected: No compilation errors
  - [ ] Verify remediation-types.ts compiles
  - [ ] Verify verify-remediation-engine.ts compiles
- [ ] 5.2 Run remediation verification script
  - [ ] Command: `npx tsx scripts/verify-remediation-engine.ts`
  - [ ] Expected: Exit code 0
  - [ ] Expected: Output "CONTROLLED_REMEDIATION_TYPES_VERIFICATION_PASS"
  - [ ] Expected: All 8 test cases pass
- [ ] 5.3 Run existing global audit verification (regression check)
  - [ ] Command: `npx tsx scripts/verify-global-audit.ts`
  - [ ] Expected: Exit code 0 (no regressions)
  - [ ] Confirm Phase 1 did not break existing audit system
- [ ] 5.4 Run existing Panda intake verification (regression check)
  - [ ] Command: `npx tsx scripts/verify-panda-intake.ts`
  - [ ] Expected: Exit code 0 (no regressions)
  - [ ] Confirm Phase 1 did not break existing Panda validator

**Success Criteria:**
- All 4 validation commands pass
- No TypeScript compilation errors
- Remediation verification script passes all 8 test cases
- No regressions in existing verification scripts

---

## Task 6: Git Hygiene Verification

**Requirements:** Requirement 7, Requirement 8

Verify only the expected files were created/modified.

- [ ] 6.1 Check git status
  - [ ] Command: `git status --short`
  - [ ] Expected: Only 2 new files shown
  - [ ] Expected: `?? lib/editorial/remediation-types.ts`
  - [ ] Expected: `?? scripts/verify-remediation-engine.ts`
- [ ] 6.2 Check changed files list
  - [ ] Command: `git diff --name-only`
  - [ ] Expected: No output (no modified files)
- [ ] 6.3 Check diff statistics
  - [ ] Command: `git diff --stat`
  - [ ] Expected: No output (no modified files)
- [ ] 6.4 Confirm files NOT modified
  - [ ] app/admin/warroom/page.tsx (NOT modified)
  - [ ] lib/editorial/global-governance-audit.ts (NOT modified)
  - [ ] lib/editorial/panda-intake-validator.ts (NOT modified)
  - [ ] lib/neural-assembly/sia-sentinel-core.ts (NOT modified)
  - [ ] Any API routes (NOT modified)
  - [ ] app/api/war-room/save/route.ts (NOT modified)
  - [ ] app/api/war-room/feed/route.ts (NOT modified)
  - [ ] app/api/war-room/workspace/route.ts (NOT modified)
  - [ ] public/sw.js (NOT modified)
  - [ ] tsconfig.tsbuildinfo (NOT modified)
- [ ] 6.5 Confirm no unintended files created
  - [ ] No markdown documentation files created
  - [ ] No test files created (except verification script)
  - [ ] No UI components created
  - [ ] No API routes created

**Success Criteria:**
- Git status shows exactly 2 new files
- No existing files modified
- No unintended files created
- Clean git diff (no modifications)

---

## Task 7: Final Implementation Report

**Requirements:** All requirements

Generate final implementation report.

- [ ] 7.1 Report final status
  - [ ] Status: CONTROLLED_REMEDIATION_PHASE1_TYPES_READY_FOR_REVIEW
  - [ ] Or: CONTROLLED_REMEDIATION_PHASE1_TYPES_BLOCKED (if any task failed)
- [ ] 7.2 Report files created
  - [ ] lib/editorial/remediation-types.ts
  - [ ] scripts/verify-remediation-engine.ts
- [ ] 7.3 Report files modified
  - [ ] Expected: None
  - [ ] Confirm: 0 files modified
- [ ] 7.4 Report tests run
  - [ ] npm run type-check: PASS/FAIL
  - [ ] npx tsx scripts/verify-remediation-engine.ts: PASS/FAIL
  - [ ] npx tsx scripts/verify-global-audit.ts: PASS/FAIL
  - [ ] npx tsx scripts/verify-panda-intake.ts: PASS/FAIL
- [ ] 7.5 Report safety invariant confirmations
  - [ ] cannotAutoPublish === true for all suggestions
  - [ ] cannotAutoCommit === true for all suggestions
  - [ ] cannotAutoPush === true for all suggestions
  - [ ] cannotAutoDeploy === true for all suggestions
  - [ ] publishStillBlocked is literal type true
  - [ ] HUMAN_ONLY/FORBIDDEN_TO_AUTOFIX → canApplyToDraft === false
  - [ ] PROVENANCE_REVIEW/SOURCE_REVIEW → HUMAN_ONLY or FORBIDDEN_TO_AUTOFIX
  - [ ] PARITY_REVIEW → HUMAN_ONLY
  - [ ] No E-E-A-T generation
  - [ ] No source/provenance fabrication
- [ ] 7.6 Report git status
  - [ ] 2 new files
  - [ ] 0 modified files
  - [ ] Clean working directory
- [ ] 7.7 Report generated artifact status
  - [ ] public/sw.js: NOT modified
  - [ ] tsconfig.tsbuildinfo: NOT modified
- [ ] 7.8 Report risk notes
  - [ ] No runtime behavior added
  - [ ] No UI implemented
  - [ ] No Apply to Draft implemented
  - [ ] No auto-fix/auto-publish/auto-commit/auto-push/auto-deploy added
  - [ ] No audit system modifications
  - [ ] No deploy gate changes
  - [ ] No Panda validator changes
- [ ] 7.9 Provide commit recommendation
  - [ ] Files safe to stage:
    - [ ] lib/editorial/remediation-types.ts
    - [ ] scripts/verify-remediation-engine.ts
  - [ ] Files to exclude:
    - [ ] public/sw.js
    - [ ] tsconfig.tsbuildinfo
    - [ ] .idea/*
    - [ ] All markdown documentation files
- [ ] 7.10 Confirm no staging/commit/push
  - [ ] Do NOT stage files
  - [ ] Do NOT commit files
  - [ ] Do NOT push to remote

**Success Criteria:**
- Final report generated
- All confirmations documented
- Status clearly stated
- Commit recommendation provided
- No files staged/committed/pushed

---

## Phase 1 Completion Checklist

Phase 1 is complete when ALL of the following are true:

- [ ] ✅ lib/editorial/remediation-types.ts exists with all types and helpers
- [ ] ✅ scripts/verify-remediation-engine.ts exists with all test cases
- [ ] ✅ npm run type-check passes without errors
- [ ] ✅ npx tsx scripts/verify-remediation-engine.ts exits with code 0
- [ ] ✅ npx tsx scripts/verify-global-audit.ts still passes (no regressions)
- [ ] ✅ npx tsx scripts/verify-panda-intake.ts still passes (no regressions)
- [ ] ✅ git status shows only 2 new files
- [ ] ✅ No source files modified (Warroom UI, audit systems, API routes)
- [ ] ✅ No runtime behavior changed
- [ ] ✅ All safety invariants documented and verified

---

## Out of Scope (Do NOT Implement)

The following are explicitly OUT OF SCOPE for Phase 1:

- ❌ Warroom UI modifications (app/admin/warroom/page.tsx)
- ❌ RemediationPanel component
- ❌ Apply to Draft functionality
- ❌ Runtime remediation generator
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
- ❌ File system mutations (except creating the 2 required files)

---

## Safety Reminders

**CRITICAL SAFETY RULES:**

1. **Fail-Closed Design:** All automation flags must default to "forbidden"
2. **Literal Type True:** publishStillBlocked must be literal type `true`, not `boolean`
3. **Human Approval Required:** requiresHumanApproval defaults to true except for SAFE_FORMAT_ONLY
4. **No Content Fabrication:** Never generate E-E-A-T credentials, source attribution, or provenance data
5. **Human-Only Categories:** PROVENANCE_REVIEW, SOURCE_REVIEW, PARITY_REVIEW must be HUMAN_ONLY
6. **Pure Functions:** All helper functions must be pure (no side effects, no mutations)
7. **No Runtime Integration:** Phase 1 does not integrate with existing systems
8. **No UI:** Phase 1 does not implement any user interface
9. **No Automation:** Phase 1 does not implement any automated fix application
10. **Types Only:** Phase 1 creates only type definitions and verification script

**If any of these rules are violated, Phase 1 is BLOCKED.**
