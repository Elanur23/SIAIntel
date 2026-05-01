# Session Draft Re-Audit / Promotion Gate — Design

## 1. Phase Status
State:
- Previous phase: Session Preview / Session State UI — CLOSED / PASS
- Current phase: Session Draft Re-Audit / Promotion Gate — Design
- Implementation status: NOT STARTED

## 2. Problem Statement
- **Session Visibility exists**: The operator can now inspect the session draft and see applied remediations.
- **Audit Invalidation**: Any remediation applied to the session draft currently invalidates the canonical audit and keeps the deploy gated as a safety measure.
- **Information Gap**: The operator needs a safe, read-only way to run the Global Audit and Panda validation against the session draft to see if the changes are correct and pass governance.
- **Safety Boundary**: This re-audit must be purely informational. It must not unlock the deploy gate or mutate the canonical vault. It serves as a pre-flight check before any future promotion action.

## 3. Design Goals
- **Read-Only Session Re-Audit**: Allow the operator to trigger a Global Audit and Panda validation specifically for the session draft.
- **Preserve Canonical Vault**: The canonical vault (`activeDraft`) must remain completely unchanged during and after the session re-audit.
- **Preserve Deploy Lock**: Deploy must remain hard-locked even if the session re-audit passes.
- **Snapshot Binding**: Bind audit results to a specific `snapshotIdentity` (content hash + ledger sequence) to prevent stale audit reuse.
- **Mandatory Panda Validation**: Ensure the session draft is wrapped into a PandaPackage-like structure for full validation.
- **Separation of Promotion**: Keep the promotion to vault as a separate future phase that requires its own gates and human confirmation.
- **Visibility**: Surface the session audit status (Passed, Failed, Stale) clearly in the UI.
- **Session Memory Only**: Keep all session audit results in React memory; no persistence to backend or storage.

## 4. Non-Goals
- **No Implementation**: This document is for design only.
- **No Save to Vault**: No mechanism to persist session changes to the canonical vault.
- **No Promote to Vault**: No action to move session draft to canonical status.
- **No Deploy Unlock**: A passing session audit must NOT unlock the deploy button.
- **No Direct Deploy**: No mechanism to deploy content directly from the session draft.
- **No Backend/API Writes**: No new API routes or database persistence.
- **No storage persistence**: No usage of localStorage, sessionStorage, or cookies for audit results.
- **No Panda Bypass**: All session content must undergo full Panda validation rules.
- **No Automatic Deploy**: Deploy logic remains strictly gated by canonical state only.
- **No Canonical Audit Overwrite**: The existing canonical audit record remains intact and separate.

## 5. Current State Model
- **Canonical Vault / activeDraft**: Authoritative content stored in the vault, currently read-only when a session draft exists.
- **localDraftCopy**: A `Record<string, VaultNode>` in React memory containing the session draft with applied remediations.
- **desc field**: Stores the composed article body/content in the `localDraftCopy` nodes.
- **sessionRemediationLedger**: Array of `AppliedRemediationEvent` objects tracking session changes.
- **sessionAuditInvalidation**: Tracks `auditInvalidated`, `reAuditRequired`, and `deployBlocked` flags.
- **Deploy Lock**: Enforced by `hasSessionDraft` and `isDeployBlocked` logic in the Warroom component.
- **Session UI**: Read-only preview panels and comparison views already exist.

## 6. Proposed Session Re-Audit Architecture
A purely read-only architecture for validating session-scoped changes.

### Input
- `localDraftCopy` snapshot.
- Active language set (9 required languages).
- `sessionRemediationLedger` (to verify sequence).
- Ledger sequence/version.
- Current Panda writing protocol rules.
- Current Global Governance Audit rules.

### Process
1. **Snapshot Freeze**: Deep-clone the current `localDraftCopy`.
2. **Audit Mapping**: Map `localDraftCopy` into a Global Audit payload: `{ content: Record<string, string>, context: AuditContext }`.
3. **Panda Mapping**: Pass `localDraftCopy` through a **Read-Only Panda Adapter** to create a `PandaPackage` structure.
4. **Execution**:
    - Run Global Audit labeled as `SESSION_DRAFT_AUDIT`.
    - Run Panda validation labeled as `SESSION_DRAFT_PANDA_CHECK`.
5. **Identity Computation**: Generate a `snapshotIdentity` (hash of content + ledger length + latest remediation ID).
6. **Binding**: Associate results with the `snapshotIdentity`.
7. **Memory Storage**: Store result in a `sessionAuditResult` React state variable.

### Constraints
- No mutation of canonical vault state.
- No overwriting of `globalAudit` (canonical audit state).
- `isDeployBlocked` remains `true`.

### Output
- `sessionAuditResult` object containing:
    - `snapshotIdentity`
    - `globalAuditPass: boolean`
    - `pandaCheckPass: boolean`
    - `findings: string[]`
    - `timestamp: string`
    - `isStale: boolean` (computed by comparing current snapshot to bound identity).

## 7. Panda Adapter Design
The Panda validation engine expects a `PandaPackage` (structured fields like headline, subheadline, body, etc.), but the `localDraftCopy` currently stores composed text in the `desc` field.

- **Pure & Read-Only**: The adapter must be a pure function that decomposes the `desc` field back into the Panda shape.
- **Decomposition Logic**: It uses structural markers like `[BODY]`, `[SUMMARY]`, `[KEY_INSIGHTS]` to populate the `PandaPackage` fields.
- **No Side Effects**: Does not write to any state or backend.
- **Error Classification**: Any mapping failure (e.g., missing mandatory `[BODY]` marker in session draft) must be reported as a **Structural/Packaging Error**, distinct from governance violations.

## 8. Snapshot Binding / Staleness Rules
- **Exact Match**: A session audit result is valid ONLY for the exact `localDraftCopy` state it was run against.
- **Identity Components**:
    - Hash of all `desc` fields in `localDraftCopy`.
    - `sessionRemediationLedger.length`.
    - ID of the last `AppliedRemediationEvent`.
- **Invalidation Triggers**:
    - Any new remediation applied to `localDraftCopy`.
    - Any rollback performed in the session.
    - Refreshing the page (clears session memory).
- **Gate Enforcement**: A stale session audit result must be visually marked and cannot be used as evidence for any future promotion logic.

## 9. UI/UX Design
Future UI components to surface the re-audit capability:

### Controls
- **“Re-audit Session Draft” Button**: Triggers the read-only audit flow. Disabled if already auditing or if no session draft exists.

### Status Indicators
- **Session Audit Chip**: Displays status: `AWAITING_AUDIT`, `AUDITING...`, `PASSED`, `FAILED`, or `STALE`.
- **Findings Panel**: A read-only list of Global Audit and Panda findings specific to the session draft.

### Visual Warnings (Safety Wording)
- “Session Draft Audit” (Title)
- “Audit Passed for Session Draft” (Status)
- “Still Not Saved to Vault” (Warning)
- “Still Not Deployed” (Warning)
- “Promotion Requires Separate Gate” (Instruction)
- “Deploy Remains Locked” (Constraint)

### Forbidden Wording
- ❌ Ready
- ❌ Approved
- ❌ Published
- ❌ Final
- ❌ Deployable
- ❌ Saved
- ❌ Promote Now
- ❌ Unlock Deploy
- ❌ Production Ready

## 10. Promotion Gate Separation
This phase defines the **Gate**, not the **Promotion**.
- Promotion to the canonical vault is a high-risk mutation and is strictly out of scope.
- Any future promotion phase must require:
    - Passing session re-audit (not stale).
    - Passing Panda check (not stale).
    - Explicit human "Promote to Vault" confirmation.
    - Immutable audit evidence recorded server-side.
    - Server-side re-validation (cannot trust client-side result for vault writes).

## 11. Deploy Gate Rules
- **Hard Lock**: `isDeployBlocked` remains `true` as long as `hasSessionDraft` is `true`.
- **Independence**: A passing session re-audit does not satisfy the `globalAudit.publishable` requirement of the canonical gate.
- **Path to Deploy**: The only path to deploy is:
    1. Session Re-Audit passes (Informational).
    2. Promotion to Vault occurs (Future Phase).
    3. Canonical Audit passes against the new Vault state.
    4. Deploy Gate unlocks.

## 12. Global Audit Rules
- **Context**: Must run with `AUDIT_TYPE = SESSION_DRAFT`.
- **Non-Destructive**: Must not replace the `globalAudit` state variable used for canonical deployment gating.
- **Findings**: Must be distinct and labeled as "Session Findings".

## 13. Panda Rules
- **Validation**: Must run against the `PandaPackage` generated by the adapter.
- **Fail-Closed**: Any structural failure in the adapter mapping counts as a Panda FAIL.
- **Result Binding**: Result is bound to the snapshot identity.

## 14. Future File Impact Map
*Note: Do not edit these files in this phase.*
- `app/admin/warroom/page.tsx`: Add re-audit button and results display.
- `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`: Add `sessionAuditResult` state and `runSessionReAudit` logic.
- `app/admin/warroom/components/SessionStatusChips.tsx`: Add session audit status chip.
- `app/admin/warroom/components/SessionDraftPreviewPanel.tsx`: Add findings sub-panel.
- `lib/editorial/remediation-apply-types.ts`: Add types for `SessionAuditResult` and `SnapshotIdentity`.
- `lib/editorial/global-governance-audit.ts`: Export or refactor audit logic for session-scoped execution.
- `lib/panda/adapter.ts`: (New File) Pure adapter for `localDraftCopy` to `PandaPackage` mapping.
- `scripts/verify-session-re-audit-safety.ts`: (New File) Script to verify no vault mutation or deploy unlock occurs.

## 15. Future Validation Strategy
- **No Vault Mutation**: Assert that `activeDraft` in the vault is identical before and after a session re-audit.
- **Deploy Lock Assertion**: Assert `isDeployBlocked` is `true` even when session audit status is `PASSED`.
- **Staleness Check**: Verify that applying a new remediation immediately marks the previous session audit as `STALE`.
- **Adapter Integrity**: Verify the Panda adapter correctly handles malformed `desc` fields (e.g., missing markers) by failing safely.
- **Wording Audit**: Grep UI components for forbidden words like "Approved" or "Deployable".

## 16. Risks and Mitigations
- **Risk**: Operator assumes "Audit Passed" means "Ready to Deploy".
- **Mitigation**: Aggressive UI labeling ("Still Not Deployed", "Deploy Remains Locked").
- **Risk**: Stale audit results being used for decision making.
- **Mitigation**: Robust snapshot identity hashing and automated staleness detection.
- **Risk**: Accidental vault mutation during audit mapping.
- **Mitigation**: Use deep-clones and strictly read-only adapters.

## 17. Open Questions
- Should the snapshot hash be a simple content hash (MD5/SHA) or include ledger state?
- Should session audit results be cleared immediately upon any change, or just marked as stale?
- Is a separate Panda adapter file necessary, or should it live within the remediation hook?

## 18. Design Verdict
**READY_FOR_TASKS**
