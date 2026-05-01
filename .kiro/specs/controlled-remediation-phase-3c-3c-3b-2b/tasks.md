# Implementation Tasks — Controlled Remediation Phase 3C-3C-3B-2B: UI Handler & Controller Execution

## Overview

This document outlines the implementation tasks for Phase 3C-3C-3B-2B, which enables real local draft mutations (session-scoped only) by connecting the UI handler to the controller execution layer.

**Phase Scope**: Transform "Apply to Local Draft Copy — Preflight Only" button into real "Apply to Local Draft Copy" button that performs session-scoped mutations while maintaining all safety constraints.

**Safety Principle**: All mutations are session-scoped only. No vault mutation, no backend calls, no storage persistence.

---

## Task List

### Task 1: Baseline Verification and Readiness Check

**Objective**: Verify the codebase is in a clean state and all prerequisite phases are complete before implementation.

**Requirements**: Requirement 16, Requirement 20

**Design**: Section 1 (Architecture Overview)

**Files to Check**:
- `.git/` (status verification)
- `scripts/verify-phase3c3c3b2a-adapter-contract-alignment.ts` (must exist)
- `lib/editorial/remediation-adapters.ts` (Phase 3C-3C-3B-2A adapters)
- `app/admin/warroom/hooks/useLocalDraftRemediationController.ts` (Phase 3C-3B controller)

**Acceptance Criteria**:
- [ ] Git status shows clean working tree (no uncommitted changes to runtime files)
- [ ] HEAD is at Phase 3C-3C-3B-2A commit (e3929f5 or later)
- [ ] Branch `main` is aligned with `origin/main`
- [ ] Phase 3C-3C-3B-2A verification script exists and passes (50 checks)
- [ ] All three Phase 3C-3C-3B-2A adapters exist: `validateAdapterPreconditions`, `mapRealLocalApplyRequestToControllerInput`, `mapControllerOutputToRealLocalApplyResult`
- [ ] `applyToLocalDraftController` exists in controller hook
- [ ] `npm run type-check` passes
- [ ] No `.kiro/` directory is tracked in git

**Safety Notes**:
- Do NOT proceed if Phase 3C-3C-3B-2A is incomplete
- Do NOT proceed if any verification script fails
- Do NOT proceed if type-check fails

---

### Task 2: Implement UI Handler in RemediationConfirmModal

**Objective**: Create the `handleRealLocalApply` function that orchestrates the adapter chain and controller invocation.

**Requirements**: Requirement 1, Requirement 2, Requirement 5, Requirement 12

**Design**: Section 2 (Event Flow), Section 3 (Handler Design), Section 4 (Adapter Chain)

**Files to Modify**:
- `app/admin/warroom/components/RemediationConfirmModal.tsx`

**Implementation Checklist**:
- [ ] Add `handleRealLocalApply` async function to modal component
- [ ] Set `isApplying` loading state at start
- [ ] Validate `allConfirmed` (all three checkboxes checked)
- [ ] Validate `isAcknowledgementValid` (typed "STAGE" exactly)
- [ ] Construct `RealLocalDraftApplyRequest` object with all required fields
- [ ] Wrap adapter chain in try/catch block
- [ ] Call `validateAdapterPreconditions(request, suggestion)` first
- [ ] If validation fails, set error state and return early
- [ ] Call `mapRealLocalApplyRequestToControllerInput(request, suggestion)`
- [ ] Call `onRequestRealLocalApply` (prop from page) with mapped input
- [ ] Call `mapControllerOutputToRealLocalApplyResult(output, request)`
- [ ] Update `realLocalApplyResult` state with mapped result
- [ ] Clear `isApplying` loading state
- [ ] Handle errors gracefully with descriptive messages
- [ ] Display error messages in modal UI

**Acceptance Criteria**:
- [ ] `handleRealLocalApply` function exists in modal
- [ ] Function validates all preconditions before proceeding
- [ ] Function calls adapter chain in correct order
- [ ] Function handles errors without crashing
- [ ] Function updates modal state correctly
- [ ] Loading state is managed properly
- [ ] Error messages are user-friendly

**Safety Notes**:
- Do NOT call controller directly from modal (use prop function)
- Do NOT mutate state outside the controller
- Do NOT skip validation steps
- Do NOT weaken precondition checks

---

### Task 3: Add Controller Internal Revalidation

**Objective**: Ensure the controller revalidates all inputs internally before performing any mutation.

**Requirements**: Requirement 2 (AC 8), Requirement 11

**Design**: Section 5 (Controller Invocation Boundary)

**Files to Modify**:
- `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`

**Implementation Checklist**:
- [ ] Add internal validation at start of `applyToLocalDraftController`
- [ ] Revalidate `category === FORMAT_REPAIR`
- [ ] Revalidate `fieldPath === 'body'`
- [ ] Revalidate suggestion is not already in `sessionRemediationLedger` (duplicate check)
- [ ] Return error result if any validation fails
- [ ] Do NOT proceed with mutation if validation fails
- [ ] Include descriptive error reason in result

**Acceptance Criteria**:
- [ ] Controller revalidates category constraint
- [ ] Controller revalidates field constraint
- [ ] Controller detects duplicate applies
- [ ] Controller returns error for invalid inputs
- [ ] Controller does not mutate state on validation failure

**Safety Notes**:
- Do NOT trust external validation alone
- Do NOT skip duplicate detection
- Do NOT allow non-FORMAT_REPAIR categories
- Do NOT allow non-body fields

---

### Task 4: Implement State Mutation Boundary

**Objective**: Ensure all state mutations are session-scoped only and follow the allowed mutation list.

**Requirements**: Requirement 4, Requirement 10, Requirement 17

**Design**: Section 6 (State Mutation Boundary)

**Files to Verify** (no modification needed, verification only):
- `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`
- `app/admin/warroom/components/RemediationConfirmModal.tsx`

**Verification Checklist**:
- [ ] Verify `localDraftCopy` is the only article state mutated
- [ ] Verify `vault` state is never mutated
- [ ] Verify no `fetch` calls in apply path
- [ ] Verify no `axios` calls in apply path
- [ ] Verify no backend API route calls
- [ ] Verify no database write function calls
- [ ] Verify no `localStorage` usage
- [ ] Verify no `sessionStorage` usage
- [ ] Verify no `IndexedDB` usage
- [ ] Verify mutations occur only inside controller

**Acceptance Criteria**:
- [ ] Only allowed mutations are present
- [ ] No forbidden mutations exist
- [ ] Vault remains byte-identical
- [ ] No backend/network/storage calls

**Safety Notes**:
- Do NOT add any backend calls
- Do NOT add any storage persistence
- Do NOT mutate vault state
- Do NOT weaken session-scoped constraint

---

### Task 5: Implement Snapshot and Ledger Logic

**Objective**: Ensure snapshots are created before mutations and ledger is appended correctly.

**Requirements**: Requirement 6, Requirement 7

**Design**: Section 7 (Snapshot and Ledger Design)

**Files to Verify** (no modification needed if already implemented in Phase 3C-3B):
- `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`

**Verification Checklist**:
- [ ] Verify `DraftSnapshot` is created before mutation
- [ ] Verify snapshot captures `beforeValue` of affected field
- [ ] Verify snapshot includes `snapshotId`, `articleId`, `packageId`
- [ ] Verify snapshot includes `affectedLanguage`, `affectedField`
- [ ] Verify snapshot includes `linkedSuggestionId`
- [ ] Verify snapshot includes `createdAt` timestamp
- [ ] Verify `sessionRemediationLedger` appends exactly one entry on success
- [ ] Verify ledger entry includes `appliedEvent` and `snapshot`
- [ ] Verify ledger is session-scoped only (React state)

**Acceptance Criteria**:
- [ ] Snapshot creation works correctly
- [ ] Ledger append works correctly
- [ ] Snapshot enables future rollback
- [ ] Ledger tracks all applied remediations

**Safety Notes**:
- Do NOT skip snapshot creation
- Do NOT persist ledger to storage
- Do NOT allow ledger corruption

---

### Task 6: Implement Audit Invalidation Result

**Objective**: Ensure audit invalidation is set correctly after local draft changes.

**Requirements**: Requirement 8

**Design**: Section 8 (Audit Invalidation Design)

**Files to Verify** (no modification needed if already implemented in Phase 3C-3B):
- `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`

**Verification Checklist**:
- [ ] Verify `sessionAuditInvalidation.auditInvalidated` is set to `true`
- [ ] Verify `sessionAuditInvalidation.reAuditRequired` is set to `true`
- [ ] Verify `invalidationReason` is `REMEDIATION_APPLIED`
- [ ] Verify `invalidatedAt` is set to current timestamp
- [ ] Verify audit invalidation is session-scoped only
- [ ] Verify global audit state in vault is not affected
- [ ] Verify audit invalidation is hard-coded (no conditional logic)

**Acceptance Criteria**:
- [ ] Audit invalidation works correctly
- [ ] All required flags are set
- [ ] Session-scoped constraint is maintained
- [ ] Global audit state is preserved

**Safety Notes**:
- Do NOT skip audit invalidation
- Do NOT make audit invalidation conditional
- Do NOT mutate global audit state

---

### Task 7: Implement Modal Metadata Result Display

**Objective**: Display the result of the apply action with all safety flags and metadata.

**Requirements**: Requirement 13

**Design**: Section 9 (Rendering Boundary)

**Files to Modify**:
- `app/admin/warroom/components/RemediationConfirmModal.tsx`

**Implementation Checklist**:
- [ ] Add result display section in modal UI
- [ ] Display success message when `realLocalApplyResult.success === true`
- [ ] Display `snapshotId` in success message
- [ ] Display `appliedEventId` in success message
- [ ] Display `affectedLanguage` in success message
- [ ] Display `affectedField` in success message
- [ ] Display all safety flags: `auditInvalidated`, `reAuditRequired`, `deployBlocked`, `noBackendMutation`, `vaultUnchanged`, `sessionOnly`
- [ ] Display error/blocked message when `success === false`
- [ ] Display reason for failure in error message
- [ ] Style result display clearly (success = green, error = red)

**Acceptance Criteria**:
- [ ] Success message displays all required metadata
- [ ] Safety flags are clearly visible
- [ ] Error messages are descriptive
- [ ] Result display is modal-local state only

**Safety Notes**:
- Do NOT hide safety flags
- Do NOT persist result display state
- Do NOT expose internal implementation details

---

### Task 8: Transform Button and Preserve Existing Buttons

**Objective**: Replace "Preflight Only" button with real "Apply to Local Draft Copy" button while preserving all existing buttons.

**Requirements**: Requirement 3, Requirement 14

**Design**: Section 10 (Button / UI Design)

**Files to Modify**:
- `app/admin/warroom/components/RemediationConfirmModal.tsx`

**Implementation Checklist**:
- [ ] Replace "Apply to Local Draft Copy — Preflight Only" button with "Apply to Local Draft Copy"
- [ ] Update button label to "Apply to Local Draft Copy"
- [ ] Update button title to "Execute session-only apply to local draft copy"
- [ ] Wire button `onClick` to `handleRealLocalApply`
- [ ] Enable button only when `allConfirmed && isAcknowledgementValid && isEligibleForPreview`
- [ ] Display spinner when `isApplying === true`
- [ ] Verify "Apply to Draft — Disabled in Phase 3B" button remains disabled
- [ ] Verify "Preview Apply (No Draft Change)" button remains unchanged
- [ ] Verify "Apply to Local Draft Copy — Dry Run" button remains unchanged
- [ ] Verify dry-run button does NOT call `handleRealLocalApply`
- [ ] Verify preview button does NOT call `handleRealLocalApply`
- [ ] Verify disabled button does NOT call `handleRealLocalApply`

**Acceptance Criteria**:
- [ ] New button exists and is functional
- [ ] Button is enabled only when all preconditions are met
- [ ] Button displays loading state correctly
- [ ] All existing buttons are preserved
- [ ] No existing button behaviors are changed

**Safety Notes**:
- Do NOT modify dry-run button behavior
- Do NOT modify preview button behavior
- Do NOT enable the disabled button
- Do NOT weaken button preconditions

---

### Task 9: Verify Rendering Boundary Preservation

**Objective**: Ensure main editor and deploy UI continue to render canonical vault state only.

**Requirements**: Requirement 9 (AC 8), Requirement 10 (AC 8)

**Design**: Section 9 (Rendering Boundary)

**Files to Verify** (no modification needed):
- `app/admin/warroom/page.tsx` (main editor)
- Deploy UI components (if applicable)

**Verification Checklist**:
- [ ] Verify main editor renders `vault[activeLang].desc` (not `localDraftCopy`)
- [ ] Verify deploy UI uses `vault` state (not `localDraftCopy`)
- [ ] Verify modal displays metadata only (not full draft content)
- [ ] Verify no broad `localDraftCopy` rendering exists
- [ ] Verify operator sees canonical vault in editor after apply

**Acceptance Criteria**:
- [ ] Main editor rendering is unchanged
- [ ] Deploy UI rendering is unchanged
- [ ] Modal displays metadata only
- [ ] No confusion about what is "live" vs "staged"

**Safety Notes**:
- Do NOT render `localDraftCopy` in main editor
- Do NOT render `localDraftCopy` in deploy UI
- Do NOT create broad rendering of local draft

---

### Task 10: Create Phase 3C-3C-3B-2B Verification Script

**Objective**: Create a comprehensive verification script that validates all Phase 3C-3C-3B-2B constraints.

**Requirements**: Requirement 15

**Design**: Section 12 (Verification Strategy)

**Files to Create**:
- `scripts/verify-phase3c3c3b2b-ui-handler-execution.ts`

**Implementation Checklist**:
- [ ] Create verification script file
- [ ] Add check: `handleRealLocalApply` exists in modal
- [ ] Add check: Handler calls `validateAdapterPreconditions`
- [ ] Add check: Handler calls `mapRealLocalApplyRequestToControllerInput`
- [ ] Add check: Handler calls controller function
- [ ] Add check: Handler calls `mapControllerOutputToRealLocalApplyResult`
- [ ] Add check: `applyToLocalDraftController` is the only mutator
- [ ] Add check: No `fetch` usage in apply path
- [ ] Add check: No `axios` usage in apply path
- [ ] Add check: No `localStorage` usage
- [ ] Add check: No `sessionStorage` usage
- [ ] Add check: Vault state is not mutated
- [ ] Add check: `localDraftCopy` updates only in controller
- [ ] Add check: `sessionRemediationLedger` appends on success
- [ ] Add check: `sessionAuditInvalidation` is set
- [ ] Add check: Non-body fields are blocked
- [ ] Add check: High-risk categories are blocked
- [ ] Add check: Duplicate applies are blocked
- [ ] Add check: Dry-run button does NOT call `applyToLocalDraftController`
- [ ] Add check: Preflight-only button does NOT call `applyToLocalDraftController`
- [ ] Add check: Old "Apply to Draft — Disabled in Phase 3B" button remains disabled
- [ ] Add check: "Preview Apply (No Draft Change)" button does NOT mutate state
- [ ] Add check: Result includes `deployBlocked: true`
- [ ] Add check: Result includes `noBackendMutation: true`
- [ ] Add check: Result includes `vaultUnchanged: true`
- [ ] Add check: Result includes `auditInvalidated: true`
- [ ] Add check: Result includes `reAuditRequired: true`
- [ ] Add check: Result includes `sessionOnly: true`
- [ ] Add check: Deploy gate logic files are not modified
- [ ] Add check: Panda validator files are not modified
- [ ] Add check: `lib/editorial/remediation-apply-types.ts` is not modified
- [ ] Add check: `lib/editorial/remediation-types.ts` is not modified
- [ ] Add check: `lib/editorial/remediation-engine.ts` is not modified
- [ ] Add check: Main editor renders `vault[activeLang].desc` (not `localDraftCopy`)
- [ ] Add check: Deploy UI uses `vault` state (not `localDraftCopy`)
- [ ] Add check: Modal displays metadata only
- [ ] Add summary report with pass/fail counts
- [ ] Add exit code 0 for all pass, 1 for any fail

**Acceptance Criteria**:
- [ ] Verification script exists
- [ ] Script includes all 27+ explicit checks
- [ ] Script runs without errors
- [ ] Script reports clear pass/fail status
- [ ] Script exits with correct code

**Safety Notes**:
- Do NOT skip any verification checks
- Do NOT weaken verification criteria
- Do NOT allow false positives

---

### Task 11: Run Full Validation Suite

**Objective**: Ensure all existing verification scripts pass after Phase 3C-3C-3B-2B implementation.

**Requirements**: Requirement 16

**Design**: Section 12 (Verification Strategy)

**Scripts to Run**:
- `npx tsc --noEmit --skipLibCheck`
- `npx tsx scripts/verify-phase3b-format-repair-smoke.ts`
- `npx tsx scripts/phase3b-ui-smoke-test.ts`
- `npx tsx scripts/verify-phase3c-apply-protocol.ts`
- `npx tsx scripts/verify-phase3c2-inert-preview.ts`
- `npx tsx scripts/verify-phase3c3-local-draft-scaffold.ts`
- `npx tsx scripts/verify-phase3c3b-local-controller-scaffold.ts`
- `npx tsx scripts/verify-phase3c3b2-callback-plumbing.ts`
- `npx tsx scripts/verify-phase3c3c1-ui-safety-scaffold.ts`
- `npx tsx scripts/verify-phase3c3c2-dry-run-button.ts`
- `npx tsx scripts/verify-phase3c3c3a-real-local-apply-contract.ts`
- `npx tsx scripts/verify-phase3c3c3b1-preflight-mapping.ts`
- `npx tsx scripts/verify-phase3c3c3b2a-adapter-contract-alignment.ts`
- `npx tsx scripts/verify-phase3c3c3b2b-ui-handler-execution.ts` (new, from Task 10)
- `npx tsx scripts/verify-remediation-engine.ts`
- `npx tsx scripts/verify-remediation-generator.ts`
- `npx tsx scripts/verify-remediation-apply-protocol.ts`
- `npx tsx scripts/verify-global-audit.ts`
- `npx tsx scripts/verify-panda-intake.ts`

**Acceptance Criteria**:
- [ ] TypeScript type-check passes
- [ ] Phase 3B format repair smoke test passes
- [ ] Phase 3B UI smoke test passes
- [ ] Phase 3C apply protocol verification passes
- [ ] Phase 3C2 inert preview verification passes
- [ ] Phase 3C3 local draft scaffold verification passes
- [ ] Phase 3C3B local controller scaffold verification passes
- [ ] Phase 3C3B2 callback plumbing verification passes
- [ ] Phase 3C3C1 UI safety scaffold verification passes
- [ ] Phase 3C3C2 dry-run button verification passes
- [ ] Phase 3C3C3A real local apply contract verification passes
- [ ] Phase 3C3C3B1 preflight mapping verification passes
- [ ] Phase 3C3C3B2A adapter contract alignment verification passes
- [ ] Phase 3C3C3B2B UI handler execution verification passes (new)
- [ ] Remediation engine verification passes
- [ ] Remediation generator verification passes
- [ ] Remediation apply protocol verification passes
- [ ] Global audit verification passes
- [ ] Panda intake verification passes
- [ ] Full validation suite: TypeScript plus 18 verification scripts (19 total commands)

**Safety Notes**:
- Do NOT proceed to commit if any script fails
- Do NOT skip any verification script
- Do NOT ignore type errors

---

### Task 12: Manual Smoke Testing

**Objective**: Perform manual smoke testing to validate end-to-end functionality.

**Requirements**: All requirements

**Design**: Section 13 (Manual Smoke Plan)

**Test Cases**:

#### Test Case 1: Preconditions Gate
- [ ] Load a draft with audit results
- [ ] Select a `FORMAT_REPAIR` body suggestion
- [ ] Verify "Apply to Local Draft Copy" button is disabled
- [ ] Check all three confirmation checkboxes
- [ ] Verify button is still disabled (no acknowledgement yet)
- [ ] Type "STAGE" in acknowledgement input
- [ ] Verify button is now enabled

#### Test Case 2: Invalid Acknowledgement
- [ ] Type "stage" (lowercase) in acknowledgement input
- [ ] Verify button remains disabled
- [ ] Type "STAGED" (extra character) in acknowledgement input
- [ ] Verify button remains disabled
- [ ] Type "STAGE" (exact match) in acknowledgement input
- [ ] Verify button is enabled

#### Test Case 3: Successful Apply
- [ ] Click "Apply to Local Draft Copy" button
- [ ] Verify loading spinner appears
- [ ] Wait for completion
- [ ] Verify success message displays
- [ ] Verify `snapshotId` is shown
- [ ] Verify `appliedEventId` is shown
- [ ] Verify all safety flags are shown: `auditInvalidated: true`, `reAuditRequired: true`, `deployBlocked: true`, `noBackendMutation: true`, `vaultUnchanged: true`, `sessionOnly: true`

#### Test Case 4: Vault Preservation
- [ ] After successful apply, check main editor
- [ ] Verify editor still shows original vault text (not changed)
- [ ] Verify deploy UI still shows original vault state
- [ ] Verify modal shows metadata only

#### Test Case 5: Controller Internal Block
- [ ] Select a `SOURCE_REVIEW` suggestion (if available)
- [ ] Try to apply
- [ ] Verify it is blocked by handler or controller
- [ ] Verify error message explains why

#### Test Case 6: Duplicate Prevention
- [ ] Apply a `FORMAT_REPAIR` suggestion successfully
- [ ] Close modal
- [ ] Re-open the same suggestion
- [ ] Try to apply again
- [ ] Verify it is blocked with "Duplicate apply" message

#### Test Case 7: Audit State Verification
- [ ] After successful apply, open browser dev tools
- [ ] Inspect `sessionAuditInvalidation` state
- [ ] Verify `auditInvalidated: true`
- [ ] Verify `reAuditRequired: true`
- [ ] Verify `invalidationReason: REMEDIATION_APPLIED`

**Acceptance Criteria**:
- [ ] All 7 test cases pass
- [ ] No unexpected errors occur
- [ ] UI behaves as expected
- [ ] Safety constraints are enforced

**Safety Notes**:
- Do NOT skip manual testing
- Do NOT ignore unexpected behavior
- Do NOT proceed to commit if any test fails

---

### Task 13: Document Explicit Non-Goals

**Objective**: Clearly document what is NOT included in Phase 3C-3C-3B-2B scope.

**Requirements**: All requirements (Out-of-Scope section)

**Design**: Section 15 (Explicit Non-Goals)

**Documentation Checklist**:
- [ ] Document: NO vault mutation
- [ ] Document: NO backend API calls
- [ ] Document: NO database writes
- [ ] Document: NO localStorage/sessionStorage persistence
- [ ] Document: NO deploy gate weakening
- [ ] Document: NO Panda validator weakening
- [ ] Document: NO auto-publish or auto-deploy
- [ ] Document: NO weakening of FORMAT_REPAIR + body constraint
- [ ] Document: NO weakening of acknowledgement requirement
- [ ] Document: NO weakening of confirmation checkbox requirement
- [ ] Document: NO modification of unrelated files
- [ ] Document: NO modification of existing button behaviors
- [ ] Document: NO rollback UI (primitive only, UI deferred)
- [ ] Document: NO remediation of source, provenance, or facts
- [ ] Document: NO auto-apply for high-risk categories

**Acceptance Criteria**:
- [ ] All non-goals are clearly documented
- [ ] Non-goals are communicated to team
- [ ] No scope creep occurs

**Safety Notes**:
- Do NOT implement any non-goal features
- Do NOT allow scope creep
- Do NOT weaken safety constraints

---

## Task Execution Order

**Sequential Execution Required**:
1. Task 1 (Baseline) → MUST pass before any implementation
2. Task 2 (UI Handler) → Core implementation
3. Task 3 (Controller Revalidation) → Safety layer
4. Task 4 (State Mutation Boundary) → Verification only
5. Task 5 (Snapshot and Ledger) → Verification only
6. Task 6 (Audit Invalidation) → Verification only
7. Task 7 (Modal Result Display) → UI feedback
8. Task 8 (Button Transformation) → UI wiring
9. Task 9 (Rendering Boundary) → Verification only
10. Task 10 (Verification Script) → Automated validation
11. Task 11 (Full Validation Suite) → Comprehensive validation
12. Task 12 (Manual Smoke Testing) → End-to-end validation
13. Task 13 (Non-Goals Documentation) → Scope clarity

**Parallel Execution Allowed**:
- Tasks 4, 5, 6, 9 (all verification-only tasks) can be done in parallel after Task 3

---

## Success Criteria

Phase 3C-3C-3B-2B is complete when:
- ✅ All 13 tasks are completed
- ✅ All 223+ verification checks pass
- ✅ All 7 manual smoke tests pass
- ✅ `npm run type-check` passes
- ✅ Git status shows only intended file changes
- ✅ No regressions in existing functionality
- ✅ All safety constraints are enforced
- ✅ Session-scoped mutation works correctly
- ✅ Vault remains unchanged
- ✅ Deploy remains blocked
- ✅ Re-audit is required

---

## Safety Reminders

**Absolute Constraints**:
- Session-scoped mutations only
- No vault mutation
- No backend/network/storage calls
- No deploy gate weakening
- No Panda validator weakening
- FORMAT_REPAIR + body only
- Acknowledgement required
- Confirmation checkboxes required
- Duplicate applies blocked
- Controller internal revalidation required

**Verification Requirements**:
- All existing verification scripts must pass
- New verification script must pass
- Manual smoke tests must pass
- Type-check must pass
- No regressions allowed

**Scope Boundaries**:
- Only modify RemediationConfirmModal and controller hook
- Do NOT modify remediation-engine.ts
- Do NOT modify remediation-types.ts
- Do NOT modify remediation-apply-types.ts (unless explicitly required)
- Do NOT modify deploy gate logic
- Do NOT modify Panda validator logic

---

## Phase Completion Checklist

Before marking Phase 3C-3C-3B-2B complete:
- [ ] All 13 tasks completed
- [ ] All verification scripts pass
- [ ] All manual smoke tests pass
- [ ] Type-check passes
- [ ] Git status clean (only intended changes)
- [ ] No regressions detected
- [ ] Safety constraints enforced
- [ ] Documentation updated
- [ ] Team notified
- [ ] Ready for commit and deployment

---

**End of Tasks Document**
