# Session Draft Re-Audit / Promotion Gate — Tasks

## 1. Phase Scope
This phase plans a read-only session draft re-audit path. It allows operators to validate in-memory remediation changes against governance and structural rules without compromising the canonical vault or bypassing deployment gates.

It must:
- re-audit `localDraftCopy` as a session-only candidate
- bind audit result to a snapshot identity
- prevent stale audit reuse
- run/read Panda validation through a pure adapter design
- keep result session-memory only
- keep deploy locked
- keep vault unchanged

It must not:
- save to vault
- promote to vault
- unlock deploy
- write backend/database/storage
- overwrite canonical audit records

## 2. Implementation Order

### Task 1 — Re-Audit Contract Audit
- Confirm exact design assumptions against current code in `app/admin/warroom/page.tsx` and `useLocalDraftRemediationController.ts`.
- Confirm `localDraftCopy` shape (`Record<string, { title: string; desc: string; ready: boolean }>`).
- Confirm Global Audit input mapping (must not replace `globalAudit` state).
- Confirm PandaPackage adapter requirement (decomposing `desc` field).
- Confirm deploy gate cannot be affected by session audit result (check `isDeployBlocked` logic).
- No runtime changes unless only documenting findings.

**Acceptance Criteria:**
- Design assumptions validated against `app/admin/warroom/page.tsx` and `useLocalDraftRemediationController.ts`.
- No runtime files modified.
- Technical findings documented if deviations found.

### Task 2 — Snapshot Identity / Staleness View Model
- Add pure read-only session snapshot identity helper if needed in `lib/editorial/remediation-apply-types.ts` or `useLocalDraftRemediationController.ts`.
- Compute or derive snapshot identity from `localDraftCopy` (content hash) + ledger sequence.
- Ensure any change to `localDraftCopy` or `sessionRemediationLedger` invalidates the bound identity.
- No persistence.
- No backend writes.
- No deploy changes.

**Acceptance Criteria:**
- `SnapshotIdentity` type defined.
- Pure helper function for identity computation implemented.
- No side effects or persistence introduced.

### Task 3 — Session Audit Result Types
- Add TypeScript-only types for session audit result in `lib/editorial/remediation-apply-types.ts`.
- Must distinguish:
  - `SESSION_DRAFT_AUDIT`
  - `SESSION_DRAFT_PANDA_CHECK`
  - stale/fresh state
  - snapshot identity
  - ledger sequence
- No UI yet.
- No runtime mutation except local/session state scaffolding if required later.

**Acceptance Criteria:**
- `SessionAuditResult` type defined with all required fields.
- Type safety confirmed via TypeScript.

### Task 4 — Read-Only Global Audit Adapter
- Create or expose a pure adapter that maps `localDraftCopy` to Global Audit input: `{ content: Record<string, string>, context: AuditContext }`.
- Ensure it handles the 9 required languages correctly.
- No mutation.
- No backend writes.
- No canonical audit overwrite.
- Does not unlock deploy.

**Acceptance Criteria:**
- Adapter function implemented and tested against sample `localDraftCopy`.
- No external state mutations.

### Task 5 — Read-Only Panda Adapter
- Create a pure adapter from `localDraftCopy` desc / structural markers to `PandaPackage` in `lib/panda/adapter.ts` (new file).
- Must classify adapter failures (e.g., missing `[BODY]` marker) as structural/package errors.
- No Panda validation rule changes.
- No backend writes.
- No deploy unlock.

**Acceptance Criteria:**
- `lib/panda/adapter.ts` created.
- Adapter correctly maps `[SUMMARY]`, `[BODY]`, etc., to `PandaPackage` fields.
- Safe failure on malformed input.

### Task 6 — Session Re-Audit Controller Hook
- Add a session-only re-audit trigger/state inside `useLocalDraftRemediationController.ts`.
- It may run read-only Global Audit + Panda checks against the snapshot.
- Result must remain in React/session memory only.
- Must not persist.
- Must not mutate vault.
- Must not unlock deploy.

**Acceptance Criteria:**
- `runSessionReAudit` function added to controller hook.
- `sessionAuditResult` state managed within the hook.
- Assertions confirm no vault or deploy state mutation.

### Task 7 — Session Audit UI State
- Add UI state indicators in `app/admin/warroom/components/SessionStatusChips.tsx` or similar:
  - Session Audit Not Run
  - Session Audit Running
  - Session Audit Passed
  - Session Audit Failed
  - Session Audit Stale
- Must use safe wording:
  - “Still Not Saved to Vault”
  - “Still Not Deployed”
  - “Deploy Remains Locked”
  - “Promotion Requires Separate Gate”
- No Save/Promote/Deploy actions.

**Acceptance Criteria:**
- UI chips reflect the current `sessionAuditResult` state.
- All required safety labels present in the UI.

### Task 8 — Findings Display Panel
- Show session audit findings read-only in `app/admin/warroom/components/SessionDraftPreviewPanel.tsx` or new sub-component.
- Separate Global Audit findings from Panda findings.
- Distinguish content violation vs structural/package violation.
- No actions.
- No mutation.

**Acceptance Criteria:**
- Read-only findings panel renders session-specific audit details.
- Clear separation between different types of findings.

### Task 9 — Verification Script
Create future script: `scripts/verify-session-draft-reaudit-promotion-gate.ts`

It must assert:
1. session re-audit does not mutate vault
2. session re-audit does not unlock deploy
3. client-side session audit result cannot affect deploy eligibility
4. session audit result is tied to snapshot identity
5. stale audit invalidated after new local apply
6. Panda adapter is read-only
7. Global Audit adapter is read-only
8. no backend/database/storage writes
9. canonical audit result not overwritten
10. no Save/Promote/Deploy actions introduced
11. forbidden wording absent:
   Ready, Approved, Published, Final, Deployable, Saved, Promote Now, Unlock Deploy

**Acceptance Criteria:**
- Verification script created and executable.
- All 11 assertions pass.

### Task 10 — Regression Validation
- Run TypeScript.
- Run existing Session UI verification (`scripts/verify-phase3c3c3b3-session-ui-rendering.ts`).
- Run new re-audit verification script (`scripts/verify-session-draft-reaudit-promotion-gate.ts`).
- Run relevant Phase 3B/3C validation scripts.
- Do not commit unless all pass.

**Acceptance Criteria:**
- All validation scripts exit with code 0.
- No regressions in existing session UI behavior.

### Task 11 — Commit / Push / Deploy / Cleanup Plan
- Commit scoped files only after validation.
- Push only after clean status.
- Verify Vercel production deployment.
- Route-smoke `/admin/warroom`.
- Cleanup local artifacts.

**Acceptance Criteria:**
- Repository clean and synced.
- Production environment verified.

## 3. Per-Task Acceptance Criteria
Included in section 2.

## 4. Safety Assertions
Every task must preserve:
- canonical vault unchanged
- canonical audit record unchanged
- session audit result memory-only
- no backend/API/database/storage writes
- no deploy unlock
- no Panda bypass
- no Global Audit bypass
- no Save/Promote/Publish/Deploy action
- stale audit prevention
- snapshot binding

## 5. Files Expected Later
- `app/admin/warroom/page.tsx`
- `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`
- `app/admin/warroom/components/SessionStatusChips.tsx`
- `app/admin/warroom/components/SessionDraftPreviewPanel.tsx`
- `app/admin/warroom/components/SessionDraftComparison.tsx`
- `app/admin/warroom/components/SessionLedgerSummary.tsx`
- `lib/editorial/remediation-apply-types.ts`
- `lib/editorial/global-governance-audit.ts`
- `lib/panda/validation.ts`
- `lib/panda/adapter.ts`
- `scripts/verify-session-draft-reaudit-promotion-gate.ts`

## 6. Explicitly Out of Scope
- Save to Vault
- Promote to Vault
- backend/API mutation routes
- database persistence
- localStorage/sessionStorage/cookie persistence
- deploy unlock
- direct session draft deploy
- Panda validation rule changes
- canonical audit overwrite
- automatic promotion
- publishing session draft directly

## 7. Validation Commands Placeholder
- TypeScript: `npx tsc --noEmit`
- existing Session UI: `npx ts-node scripts/verify-phase3c3c3b3-session-ui-rendering.ts`
- Phase 3B/3C: (As defined in those phases)
- new re-audit/promotion gate: `npx ts-node scripts/verify-session-draft-reaudit-promotion-gate.ts`

## 8. Task Verdict
READY_FOR_IMPLEMENTATION_PROMPT
