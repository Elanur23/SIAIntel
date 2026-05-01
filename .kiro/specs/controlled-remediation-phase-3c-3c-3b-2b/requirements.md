# Requirements Document — Controlled Remediation Phase 3C-3C-3B-2B: UI Handler & Controller Execution

## Introduction

Controlled Remediation Phase 3C-3C-3B-2B implements the UI handler that bridges the modal interface to the controller execution layer. This phase enables actual local draft mutations (session-scoped only) by connecting the pure adapter functions from Phase 3C-3C-3B-2A to the controller from Phase 3C-3B.

This phase transforms the "Apply to Local Draft Copy — Preflight Only" button into a real "Apply to Local Draft Copy" button that performs session-scoped mutations while maintaining all safety constraints.

## Glossary

- **UI_Handler**: The function in RemediationConfirmModal that orchestrates adapter calls and controller invocation
- **Controller_Execution**: The invocation of `applyToLocalDraftController` with mapped input
- **Session_Scoped_Mutation**: Changes to `localDraftCopy` that exist only in browser memory for the current session
- **Ledger_Append**: Adding an entry to `sessionRemediationLedger` tracking applied remediations
- **Snapshot_Creation**: Creating a `DraftSnapshot` before applying changes to enable rollback
- **Audit_Invalidation**: Setting `sessionAuditInvalidation` to STALE after local draft changes
- **Adapter_Chain**: The sequence of adapter calls: validate → map request → call controller → map result
- **Vault_Preservation**: Ensuring canonical article state remains unchanged
- **Deploy_Gate_Preservation**: Ensuring deploy remains blocked after local draft changes
- **Preflight_Button**: The Phase 3C-3C-3B-1 button that only maps adapters without controller execution
- **Real_Apply_Button**: The Phase 3C-3C-3B-2B button that executes the full adapter chain with controller

---

## Requirements

### Requirement 1: UI Handler Implementation

**User Story:** As a warroom operator, I want to apply eligible remediation suggestions to my local draft copy, so that I can preview changes before committing to the vault.

#### Acceptance Criteria

1. THE RemediationConfirmModal SHALL include a handler function `handleRealLocalApply` that orchestrates the adapter chain
2. THE handler SHALL call `validateAdapterPreconditions` before proceeding
3. THE handler SHALL call `mapRealLocalApplyRequestToControllerInput` to prepare controller input
4. THE handler SHALL call `applyToLocalDraftController` with the mapped input
5. THE handler SHALL call `mapControllerOutputToRealLocalApplyResult` to format the result
6. THE handler SHALL store the result in modal-local state for display
7. THE handler SHALL handle errors gracefully and display error messages to the operator

### Requirement 2: Controller Execution Integration

**User Story:** As a system, I want to execute the controller when the operator confirms a real apply, so that local draft mutations occur correctly.

#### Acceptance Criteria

1. WHEN the operator clicks "Apply to Local Draft Copy", THE system SHALL invoke `applyToLocalDraftController`
2. THE controller invocation SHALL mutate `localDraftCopy` with the suggested text
3. THE controller invocation SHALL append an entry to `sessionRemediationLedger`
4. THE controller invocation SHALL create a `DraftSnapshot` before applying changes
5. THE controller invocation SHALL set `sessionAuditInvalidation` to STALE
6. THE controller invocation SHALL return `appliedEvent` and `snapshot` objects
7. THE controller invocation SHALL occur only after all preconditions are validated
8. THE controller SHALL revalidate all inputs internally before performing any mutation

### Requirement 3: Button Behavior Transformation

**User Story:** As a warroom operator, I want a clear button that applies changes to my local draft, so that I understand what action I'm taking.

#### Acceptance Criteria

1. THE "Apply to Local Draft Copy — Preflight Only" button SHALL be replaced with "Apply to Local Draft Copy"
2. THE new button SHALL be enabled when all preconditions are met (confirmations checked, acknowledgement typed, suggestion eligible)
3. THE new button SHALL call `handleRealLocalApply` when clicked
4. THE new button SHALL display loading state during controller execution
5. THE old "Apply to Draft — Disabled in Phase 3B" button SHALL remain disabled
6. THE "Preview Apply (No Draft Change)" button SHALL remain unchanged
7. THE "Apply to Local Draft Copy — Dry Run" button SHALL remain unchanged

### Requirement 4: Session-Scoped Mutation Safety

**User Story:** As a system architect, I want all mutations to be session-scoped only, so that vault integrity is preserved.

#### Acceptance Criteria

1. THE handler SHALL mutate `localDraftCopy` only (session-scoped React state)
2. THE handler SHALL NOT mutate vault state
3. THE handler SHALL NOT call backend APIs
4. THE handler SHALL NOT call database write functions
5. THE handler SHALL NOT use localStorage or sessionStorage
6. THE handler SHALL NOT call network functions (fetch, axios)
7. THE handler SHALL preserve all existing safety constraints from Phase 3C-3C-3B-2A

### Requirement 5: Adapter Chain Execution

**User Story:** As a system, I want to execute the adapter chain correctly, so that type safety and validation are maintained.

#### Acceptance Criteria

1. WHEN the handler executes, THE system SHALL call `validateAdapterPreconditions` first
2. IF validation fails, THEN THE system SHALL display an error and NOT proceed
3. WHEN validation passes, THE system SHALL call `mapRealLocalApplyRequestToControllerInput`
4. WHEN mapping succeeds, THE system SHALL call `applyToLocalDraftController`
5. WHEN controller succeeds, THE system SHALL call `mapControllerOutputToRealLocalApplyResult`
6. WHEN result mapping succeeds, THE system SHALL display the result to the operator
7. THE adapter chain SHALL maintain type safety at each step

### Requirement 6: Ledger Append Behavior

**User Story:** As a system, I want to track all applied remediations in the session ledger, so that rollback is possible.

#### Acceptance Criteria

1. WHEN a remediation is applied, THE system SHALL append an entry to `sessionRemediationLedger`
2. THE ledger entry SHALL include the `appliedEvent` object
3. THE ledger entry SHALL include the `snapshot` object
4. THE ledger SHALL be session-scoped only (React state)
5. THE ledger SHALL NOT be persisted to localStorage or backend
6. THE ledger SHALL support multiple entries (sequential applies)
7. THE ledger SHALL enable future rollback functionality

### Requirement 7: Snapshot Creation Behavior

**User Story:** As a system, I want to create snapshots before applying changes, so that rollback is possible.

#### Acceptance Criteria

1. WHEN a remediation is applied, THE system SHALL create a `DraftSnapshot` before mutation
2. THE snapshot SHALL capture the `beforeValue` of the affected field
3. THE snapshot SHALL include `snapshotId`, `articleId`, `packageId`, `affectedLanguage`, `affectedField`
4. THE snapshot SHALL include `linkedSuggestionId` for traceability
5. THE snapshot SHALL include `createdAt` timestamp
6. THE snapshot SHALL be stored in the ledger entry
7. THE snapshot SHALL enable future rollback to the pre-apply state

### Requirement 8: Audit Invalidation Behavior

**User Story:** As a system, I want to invalidate the audit state after local draft changes, so that re-audit is required.

#### Acceptance Criteria

1. WHEN a remediation is applied, THE system SHALL set `sessionAuditInvalidation.auditInvalidated` to `true`
2. WHEN a remediation is applied, THE system SHALL set `sessionAuditInvalidation.reAuditRequired` to `true`
3. THE system SHALL set `invalidationReason` to `REMEDIATION_APPLIED`
4. THE system SHALL set `invalidatedAt` to the current timestamp
5. THE audit invalidation SHALL be session-scoped only
6. THE audit invalidation SHALL NOT affect the global audit state in the vault
7. THE audit invalidation SHALL be hard-coded (no conditional logic)

### Requirement 9: Deploy Gate Preservation

**User Story:** As a system architect, I want deploy to remain blocked after local draft changes, so that unaudited content cannot be published.

#### Acceptance Criteria

1. THE handler SHALL NOT modify deploy gate logic
2. THE handler SHALL NOT call deploy-related functions
3. THE result object SHALL include `deployBlocked: true` (hard-coded)
4. THE result object SHALL include `reAuditRequired: true` (hard-coded)
5. THE system SHALL preserve existing deploy gate constraints
6. THE system SHALL NOT weaken Panda validator constraints
7. THE system SHALL maintain fail-closed deploy behavior
8. THE deploy UI SHALL continue to use canonical vault state only and SHALL NOT use localDraftCopy

### Requirement 10: Vault Preservation

**User Story:** As a system architect, I want the vault to remain unchanged, so that canonical article state is preserved.

#### Acceptance Criteria

1. THE handler SHALL NOT mutate vault state
2. THE handler SHALL NOT call vault write functions
3. THE handler SHALL NOT call backend save/publish APIs
4. THE result object SHALL include `vaultUnchanged: true` (hard-coded)
5. THE result object SHALL include `noBackendMutation: true` (hard-coded)
6. THE result object SHALL include `sessionOnly: true` (hard-coded)
7. THE system SHALL preserve vault integrity at all times
8. THE main editor SHALL continue to render canonical vault state only and SHALL NOT render localDraftCopy

### Requirement 11: Category and Field Constraints

**User Story:** As a system architect, I want only FORMAT_REPAIR suggestions on body field to be eligible, so that high-risk changes require manual review.

#### Acceptance Criteria

1. THE handler SHALL enforce `category === FORMAT_REPAIR` constraint
2. THE handler SHALL enforce `fieldPath === 'body'` constraint
3. THE handler SHALL reject SOURCE_REVIEW suggestions
4. THE handler SHALL reject PROVENANCE_REVIEW suggestions
5. THE handler SHALL reject PARITY_REVIEW suggestions
6. THE handler SHALL reject HUMAN_REVIEW_REQUIRED suggestions
7. THE handler SHALL use existing guard functions for validation
8. THE handler SHALL reject duplicate applies for the same suggestionId within the same session

### Requirement 12: Error Handling

**User Story:** As a warroom operator, I want clear error messages when apply fails, so that I understand what went wrong.

#### Acceptance Criteria

1. WHEN validation fails, THE system SHALL display a descriptive error message
2. WHEN adapter mapping fails, THE system SHALL display a descriptive error message
3. WHEN controller execution fails, THE system SHALL display a descriptive error message
4. THE error messages SHALL be displayed in the modal UI
5. THE error messages SHALL NOT expose internal implementation details
6. THE error messages SHALL guide the operator toward resolution
7. THE system SHALL NOT crash or enter an invalid state on error

### Requirement 13: Result Display

**User Story:** As a warroom operator, I want to see the result of my apply action, so that I know if it succeeded.

#### Acceptance Criteria

1. WHEN apply succeeds, THE system SHALL display a success message
2. THE success message SHALL include `snapshotId` and `appliedEventId`
3. THE success message SHALL include `affectedLanguage` and `affectedField`
4. THE success message SHALL display all safety flags (auditInvalidated, reAuditRequired, deployBlocked, etc.)
5. WHEN apply fails, THE system SHALL display a blocked/error message
6. THE blocked message SHALL include the reason for failure
7. THE result display SHALL be modal-local state only (not persisted)

### Requirement 14: Existing Button Preservation

**User Story:** As a system architect, I want existing buttons to remain unchanged, so that no regressions occur.

#### Acceptance Criteria

1. THE "Apply to Draft — Disabled in Phase 3B" button SHALL remain disabled
2. THE "Preview Apply (No Draft Change)" button SHALL remain functional
3. THE "Apply to Local Draft Copy — Dry Run" button SHALL remain functional
4. THE dry-run button SHALL NOT call the controller
5. THE preview button SHALL NOT call the controller
6. THE disabled button SHALL NOT call the controller
7. THE existing button behaviors SHALL pass all existing verification scripts

### Requirement 15: Verification Script Creation

**User Story:** As a system architect, I want a verification script for Phase 3C-3C-3B-2B, so that correctness is validated.

#### Acceptance Criteria

1. THE system SHALL include a verification script `scripts/verify-phase3c3c3b2b-ui-handler-execution.ts`
2. THE script SHALL verify the UI handler exists
3. THE script SHALL verify the handler calls adapters correctly
4. THE script SHALL verify the handler calls the controller
5. THE script SHALL verify mutations are session-scoped only
6. THE script SHALL verify no backend/network/storage calls
7. THE script SHALL verify all safety constraints are enforced

### Requirement 16: Existing Verification Preservation

**User Story:** As a system architect, I want all existing verification scripts to pass, so that no regressions occur.

#### Acceptance Criteria

1. THE implementation SHALL pass `scripts/verify-phase3c3c3b2a-adapter-contract-alignment.ts` (50 checks)
2. THE implementation SHALL pass `scripts/verify-remediation-engine.ts`
3. THE implementation SHALL pass `scripts/verify-remediation-generator.ts`
4. THE implementation SHALL pass `scripts/verify-remediation-apply-protocol.ts`
5. THE implementation SHALL pass `scripts/verify-global-audit.ts`
6. THE implementation SHALL pass `scripts/verify-panda-intake.ts`
7. THE implementation SHALL pass `npm run type-check`

### Requirement 17: No Backend/Network/Storage Calls

**User Story:** As a system architect, I want no backend/network/storage calls, so that session-scoped safety is maintained.

#### Acceptance Criteria

1. THE handler SHALL NOT call `fetch`
2. THE handler SHALL NOT call `axios`
3. THE handler SHALL NOT call backend API routes
4. THE handler SHALL NOT call database write functions
5. THE handler SHALL NOT use `localStorage`
6. THE handler SHALL NOT use `sessionStorage`
7. THE handler SHALL NOT use `IndexedDB`

### Requirement 18: Acknowledgement Validation

**User Story:** As a system architect, I want operator acknowledgement to be validated, so that intentional action is confirmed.

#### Acceptance Criteria

1. THE handler SHALL validate `typedAcknowledgement === REQUIRED_ACKNOWLEDGEMENT_PHRASE`
2. THE handler SHALL NOT proceed if acknowledgement is invalid
3. THE handler SHALL display an error if acknowledgement is missing
4. THE required phrase SHALL be "STAGE"
5. THE acknowledgement SHALL be case-sensitive
6. THE acknowledgement SHALL be exact match (no whitespace tolerance)
7. THE acknowledgement validation SHALL occur before controller invocation

### Requirement 19: Confirmation Checkbox Validation

**User Story:** As a system architect, I want all confirmation checkboxes to be checked, so that operator understanding is confirmed.

#### Acceptance Criteria

1. THE handler SHALL validate all three confirmation checkboxes are checked
2. THE handler SHALL NOT proceed if any checkbox is unchecked
3. THE handler SHALL display an error if confirmations are incomplete
4. THE confirmations SHALL include "I understand this changes the draft and requires re-audit"
5. THE confirmations SHALL include "I have reviewed the before/after diff"
6. THE confirmations SHALL include "I understand this does not unlock Deploy"
7. THE confirmation validation SHALL occur before controller invocation

### Requirement 20: File Boundary Protections

**User Story:** As a system architect, I want file boundaries to be respected, so that unrelated code is not modified.

#### Acceptance Criteria

1. THE implementation SHALL modify `app/admin/warroom/components/RemediationConfirmModal.tsx` only
2. THE implementation SHALL NOT modify `lib/editorial/remediation-apply-types.ts`
3. THE implementation SHALL NOT modify `lib/editorial/remediation-types.ts`
4. THE implementation SHALL NOT modify `lib/editorial/remediation-engine.ts`
5. THE implementation SHALL NOT modify backend API routes
6. THE implementation SHALL NOT modify deploy gate logic
7. THE implementation SHALL NOT modify Panda validator logic

---

## Success Criteria

- ✅ UI handler `handleRealLocalApply` exists in RemediationConfirmModal
- ✅ Handler calls adapter chain correctly (validate → map → controller → map result)
- ✅ Controller execution mutates `localDraftCopy` (session-scoped)
- ✅ Ledger append works (`sessionRemediationLedger` updated)
- ✅ Snapshot creation works (`DraftSnapshot` created before mutation)
- ✅ Audit invalidation works (`sessionAuditInvalidation` set to STALE)
- ✅ "Apply to Local Draft Copy" button replaces "Preflight Only" button
- ✅ Button is enabled when all preconditions are met
- ✅ Result display shows success/failure with all safety flags
- ✅ All safety constraints enforced (session-scoped, no backend, no vault mutation)
- ✅ All existing verification scripts pass (223+ checks)
- ✅ New verification script passes (Phase 3C-3C-3B-2B checks)
- ✅ No backend/network/storage calls
- ✅ Deploy remains blocked
- ✅ Re-audit required
- ✅ Vault unchanged
- ✅ `npm run type-check` passes
- ✅ Git status shows only intended file changes

---

## Out-of-Scope / Explicitly Forbidden

- ❌ Vault mutation
- ❌ Backend API calls
- ❌ Database writes
- ❌ localStorage/sessionStorage persistence
- ❌ Deploy gate weakening
- ❌ Panda validator weakening
- ❌ Auto-publish or auto-deploy
- ❌ Weakening of FORMAT_REPAIR + body constraint
- ❌ Weakening of acknowledgement requirement
- ❌ Weakening of confirmation checkbox requirement
- ❌ Modification of unrelated files
- ❌ Modification of existing button behaviors (dry-run, preview, disabled)

---

## Phase Completion

This requirements document represents Phase 3C-3C-3B-2B: UI Handler & Controller Execution. After implementation, the system will support real local draft mutations (session-scoped only) while maintaining all safety constraints from previous phases.
