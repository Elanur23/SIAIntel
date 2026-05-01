# Design Document — Controlled Remediation Phase 3C-3C-3B-2B: UI Handler & Controller Execution

## 1. Architecture Overview

Phase 3C-3C-3B-2B bridges the UI layer to the controller execution layer, enabling session-scoped local draft mutations. The architecture maintains strict separation between different apply paths to prevent accidental mutations.

### Path Separation
- **Real Local Apply Path (NEW)**: Modal `handleRealLocalApply` -> Adapter Chain -> Controller `applyToLocalDraftController`.
- **Dry-Run Path (EXISTING)**: Modal `handleDryRunApply` -> Page `handleRequestLocalDraftApply` (Dry-run validation only, no controller).
- **Preflight-Only Path (EXISTING)**: Modal `handleRealLocalApplyPreflight` -> Page `handleRequestRealLocalApply` (Contract mapping check only, no controller).
- **Old Disabled Apply Path (EXISTING)**: Remains a static disabled button.
- **Preview Apply Path (EXISTING)**: Remains presentational only (mock objects).

## 2. Event Flow

1. **Operator Intent**: Operator selects an eligible `FORMAT_REPAIR` suggestion in the `RemediationPreviewPanel`.
2. **Review**: Modal opens. Operator reviews diff and checks three mandatory confirmation checkboxes.
3. **Acknowledgement**: Operator types exactly "STAGE" into the acknowledgement input.
4. **Invocation**: Operator clicks "Apply to Local Draft Copy".
5. **UI Handler**: `handleRealLocalApply` in `RemediationConfirmModal` is triggered.
6. **Pre-validation**: Handler validates checkboxes, STAGE phrase, and local eligibility.
7. **Adapter Mapping**: Handler calls `validateAdapterPreconditions` and `mapRealLocalApplyRequestToControllerInput`.
8. **Controller Invocation**: Handler calls `remediationController.applyToLocalDraftController` with the mapped input.
9. **Internal Validation**: Controller revalidates input, checks for duplicate `suggestionId`, and ensures `FORMAT_REPAIR` + `body` scope.
10. **State Mutation**:
    - `localDraftCopy` is cloned and updated.
    - `DraftSnapshot` is created and stored.
    - `sessionRemediationLedger` is appended.
    - `sessionAuditInvalidation` is set to `STALE`.
11. **Result Mapping**: Controller output is mapped to `RealLocalDraftApplyResult` via adapter.
12. **Feedback**: Success/failure result state is updated in the modal for display.

## 3. Handler Design

A dedicated `handleRealLocalApply` function will be implemented in `RemediationConfirmModal.tsx`.

### Logic Steps:
- Set `isApplying` loading state.
- Validate `allConfirmed` and `isAcknowledgementValid`.
- Construct `RealLocalDraftApplyRequest`.
- Try/Catch block:
  - Call `validateAdapterPreconditions`.
  - Call `mapRealLocalApplyRequestToControllerInput`.
  - Call `onRequestRealLocalApply` (passed from page, which wraps `applyToLocalDraftController`).
  - *Wait: The requirements say the modal should call the controller. Since the controller is a hook in the page, the modal should receive the apply function via props.*
- Update `realLocalApplyResult` state.
- Clear loading state.

## 4. Adapter Chain

The design utilizes the pure adapters from Phase 3C-3C-3B-2A:
1. `validateAdapterPreconditions(request, suggestion)`: Ensures contract compatibility.
2. `mapRealLocalApplyRequestToControllerInput(request, suggestion)`: Converts UI request to Controller input.
3. `mapControllerOutputToRealLocalApplyResult(output, request)`: Converts Controller success to UI result.

## 5. Controller Invocation Boundary

The `useLocalDraftRemediationController` remains the **only** authorized mutator of session state.

### Safety Invariants in Controller:
- **Revalidation**: Always checks `category === FORMAT_REPAIR` and `fieldPath === 'body'` before mutation.
- **Deduplication**: Rejects apply if the `suggestionId` is already present in the `sessionRemediationLedger`.
- **Scope Restriction**: Only mutates the `body` field of the local draft copy.
- **Atomic Operations**: Cloning, snapshotting, and mutating occur in a single state update cycle.

## 6. State Mutation Boundary

### Allowed Mutations (Session-Only):
- `localDraftCopy`: Updated with suggested text.
- `sessionRemediationLedger`: Appended with one new entry.
- `sessionAuditInvalidation`: Set to `STALE` with `REMEDIATION_APPLIED` reason.
- `realLocalApplyResult`: Modal-local state for UI feedback.

### Forbidden (Strictly Guarded):
- **Canonical Vault**: Must remain byte-identical to pre-apply state.
- **Backend**: No database writes, no `/api/war-room/save` calls.
- **Network**: No `fetch` or `axios` calls in the apply path.
- **Browser Storage**: No `localStorage` or `sessionStorage` usage.
- **Deploy State**: Official deploy gates and Panda validator must not be weakened.

## 7. Snapshot and Ledger Design

### Snapshot:
- Created **before** the mutation.
- Captures `beforeValue` of the specific field being changed.
- Includes traceability metadata (`snapshotId`, `linkedSuggestionId`).

### Ledger:
- Appends exactly one entry per successful apply.
- Acts as the source of truth for "already applied" suggestions in the current session.
- Enables future rollback by providing the snapshot link.

## 8. Audit Invalidation Design

Any change to `localDraftCopy` must trigger audit invalidation.
- `auditInvalidated: true`
- `reAuditRequired: true`
- `deployBlocked: true`
- `invalidationReason: AuditInvalidationReason.REMEDIATION_APPLIED`
- `invalidatedAt: now()`

The `sessionAuditInvalidation` state is the primary indicator that the session draft has diverged from the audited vault.

## 9. Rendering Boundary

- **Main Editor**: Continues to render `vault[activeLang].desc`.
- **Deploy UI**: Continues to use `vault` state as the source of truth.
- **Remediation Modal**: Displays metadata (`snapshotId`, `appliedEventId`) to confirm the local change.
- **Rationale**: This prevents operator confusion by making it clear that local apply is a "staging" step that doesn't yet affect the live editor or deployment source.

## 10. Button / UI Design

### Apply Button Transformation:
- Label: "Apply to Local Draft Copy".
- Appearance: Distinct from the dry-run/preflight buttons.
- State: Shows a spinner when `isApplying` is true.
- Title: "Execute session-only apply to local draft copy".

### Requirements:
- All three checkboxes (`confirmations`) must be `true`.
- `typedAcknowledgement` must be exactly "STAGE".
- Suggestion must be `isEligibleForPreview`.

## 11. Error Handling

- **Validation Errors**: Displayed before calling the controller (e.g., "Missing acknowledgement").
- **Controller Rejection**: Result mapped to `RealLocalDraftApplyResult` with `success: false` and the specific reason (e.g., "Duplicate apply").
- **Catch-All**: Runtime exceptions in the handler are caught and displayed as "APPLY_EXECUTION_ERROR".

## 12. Verification Strategy

### Automated Script: `scripts/verify-phase3c3c3b2b-ui-handler-execution.ts`
- **Existence**: Check for `handleRealLocalApply` in modal.
- **Flow**: Verify calls to `validateAdapterPreconditions`, `mapRealLocalApplyRequestToControllerInput`, and `mapControllerOutputToRealLocalApplyResult`.
- **Mutation Isolation**:
  - Verify `applyToLocalDraftController` is the only mutator.
  - Verify no `fetch`/`axios` usage.
  - Verify no `localStorage`/`sessionStorage` usage.
- **Vault Integrity**: Verify `vault` state is not updated in the handler.
- **State Check**:
  - Verify `localDraftCopy` updates only within the controller.
  - Verify `sessionRemediationLedger` appends on success.
  - Verify `sessionAuditInvalidation` is set.
- **Constraints**: Verify non-body fields and high-risk categories are blocked.
- **Deduplication**: Verify second apply for same `suggestionId` is blocked.
- **Button Preservation**:
  - Verify dry-run button does NOT call `applyToLocalDraftController`.
  - Verify preflight-only button does NOT call `applyToLocalDraftController`.
  - Verify old "Apply to Draft — Disabled in Phase 3B" button remains disabled.
  - Verify "Preview Apply (No Draft Change)" button does NOT mutate any state.
- **Safety Flags**:
  - Verify result includes `deployBlocked: true`.
  - Verify result includes `noBackendMutation: true`.
  - Verify result includes `vaultUnchanged: true`.
  - Verify result includes `auditInvalidated: true`.
  - Verify result includes `reAuditRequired: true`.
  - Verify result includes `sessionOnly: true`.
- **Preservation Checks**:
  - Verify deploy gate logic files are not modified.
  - Verify Panda validator files are not modified.
  - Verify `lib/editorial/remediation-apply-types.ts` is not modified.
  - Verify `lib/editorial/remediation-types.ts` is not modified.
  - Verify `lib/editorial/remediation-engine.ts` is not modified.
- **Rendering Boundary**:
  - Verify main editor continues to render `vault[activeLang].desc` (not `localDraftCopy`).
  - Verify deploy UI continues to use `vault` state (not `localDraftCopy`).
  - Verify modal displays metadata only (`snapshotId`, `appliedEventId`, and safety flags).

## 13. Manual Smoke Plan

1. **Preconditions**: Load a draft, run audit, select a `FORMAT_REPAIR` body suggestion.
2. **Confirmation Gate**: Verify button is disabled until all checkboxes are checked and "STAGE" is typed.
3. **Invalid Acknowledgement**: Verify "stage" or "STAGED" does not enable the button.
4. **Successful Apply**:
   - Click "Apply to Local Draft Copy".
   - Verify modal shows "Applied Successfully" with `snapshotId` and `appliedEventId`.
   - Verify safety flags are all present and set to `true`.
5. **Vault Preservation**: Confirm main editor still shows the original text.
6. **Controller Internal Block**: Try to apply a `SOURCE_REVIEW` suggestion (if selectable) and verify it's blocked by the handler/controller.
7. **Duplicate Prevention**: Re-open the same suggestion and try to apply again; verify it is blocked.
8. **Audit State**: Verify `sessionAuditInvalidation` is set (inspectable via dev tools or future state banner).

## 14. Files Impacted (Future Implementation)

- `app/admin/warroom/components/RemediationConfirmModal.tsx`: Main UI logic.
- `app/admin/warroom/page.tsx`: Wiring the controller to the modal.
- `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`: Internal revalidation logic.

## 15. Explicit Non-Goals

- NO mutation of the canonical vault article.
- NO persistence to database or browser storage.
- NO unlocking of the Deploy gate.
- NO update to the Panda package.
- NO automatic saving or publishing.
- NO rollback UI (primitive only).
- NO remediation of source, provenance, or facts.
- NO auto-apply for high-risk categories.
