# Requirements Document

## Introduction

Task 5B delivers the "Helper Intelligence" layer for the canonical re-audit subsystem of the editorial warroom. It wires the pure in-memory adapter from Task 5A (`runInMemoryCanonicalReAudit`) into a React hook (`useCanonicalReAudit`) that manages the full canonical re-audit lifecycle and exposes read-only state and explicit operator controls to the warroom UI layer.

The hook follows the same safety-first, fail-closed, memory-only patterns established by `useLocalDraftRemediationController`. It is consumed by the warroom page (`app/admin/warroom/page.tsx`) and is designed to be passed down to a future `CanonicalReAuditPanel` UI component (out of scope for 5B). A verification script (`scripts/verify-canonical-reaudit-hook.ts`) is also required to confirm the hook's safety invariants without running the full application.

All operations are memory-only. Deploy remains locked after canonical re-audit. No globalAudit overwrite, no session audit inheritance, and no automatic triggering are permitted.

## Glossary

- **Hook**: The `useCanonicalReAudit` React hook defined in `app/admin/warroom/hooks/useCanonicalReAudit.ts`.
- **Adapter**: The `runInMemoryCanonicalReAudit` function from `lib/editorial/canonical-reaudit-adapter.ts` (Task 5A).
- **Canonical_Vault**: The in-memory record of canonical article content keyed by language code, shaped as `Record<string, { title: string; desc: string; ready: boolean }>`.
- **Snapshot_Identity**: A `CanonicalReAuditSnapshotIdentity` value that uniquely identifies a point-in-time state of the canonical vault.
- **Lifecycle_Status**: One of the `CanonicalReAuditStatus` enum values: `NOT_RUN`, `RUNNING`, `PASSED_PENDING_ACCEPTANCE`, `FAILED_PENDING_REVIEW`, `BLOCKED`, `STALE`.
- **Operator**: A human user interacting with the warroom UI who must explicitly trigger all canonical re-audit actions.
- **Verification_Script**: The TypeScript script at `scripts/verify-canonical-reaudit-hook.ts` that exercises the hook's exported interface and safety invariants in isolation.
- **Warroom_Page**: The Next.js page at `app/admin/warroom/page.tsx` that instantiates the hook and passes state to child components.
- **Remediation_Controller**: The existing `useLocalDraftRemediationController` hook, which serves as the structural pattern for the new hook.

---

## Requirements

### Requirement 1: Hook File and Export Contract

**User Story:** As a warroom engineer, I want a `useCanonicalReAudit` hook exported from a dedicated file, so that the warroom page can import and instantiate it with a single call.

#### Acceptance Criteria

1. THE Hook SHALL be defined in `app/admin/warroom/hooks/useCanonicalReAudit.ts` and exported as a named export.
2. THE Hook SHALL be marked with the `'use client'` directive at the top of the file.
3. THE Hook SHALL import `runInMemoryCanonicalReAudit` and `CanonicalVaultInput` from `lib/editorial/canonical-reaudit-adapter`.
4. THE Hook SHALL import all required types (`CanonicalReAuditStatus`, `CanonicalReAuditBlockReason`, `CanonicalReAuditSnapshotIdentity`, `PendingCanonicalReAuditResult`, `CanonicalReAuditResult`) from `lib/editorial/canonical-reaudit-types`.
5. THE Hook SHALL use only `useState` and `useCallback` from React for state management, matching the pattern of the Remediation_Controller.

---

### Requirement 2: Lifecycle State Management

**User Story:** As a warroom operator, I want the hook to track the canonical re-audit lifecycle from NOT_RUN through to a terminal state, so that the UI always reflects the true current state of the audit.

#### Acceptance Criteria

1. THE Hook SHALL initialise `canonicalReAuditStatus` to `CanonicalReAuditStatus.NOT_RUN` on mount.
2. WHEN `runCanonicalReAudit` is called, THE Hook SHALL immediately set `canonicalReAuditStatus` to `CanonicalReAuditStatus.RUNNING` before invoking the Adapter.
3. WHEN the Adapter returns a result with `status: 'PASSED_PENDING_ACCEPTANCE'`, THE Hook SHALL set `canonicalReAuditStatus` to `CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE`.
4. WHEN the Adapter returns a result with `status: 'FAILED_PENDING_REVIEW'`, THE Hook SHALL set `canonicalReAuditStatus` to `CanonicalReAuditStatus.FAILED_PENDING_REVIEW`.
5. WHEN the Adapter returns a result with `status: 'BLOCKED'`, THE Hook SHALL set `canonicalReAuditStatus` to `CanonicalReAuditStatus.BLOCKED`.
6. WHEN the Adapter returns a result with `status: 'STALE'`, THE Hook SHALL set `canonicalReAuditStatus` to `CanonicalReAuditStatus.STALE`.
7. IF the Adapter throws an exception, THEN THE Hook SHALL set `canonicalReAuditStatus` to `CanonicalReAuditStatus.BLOCKED` and store a blocked result with `CanonicalReAuditBlockReason.AUDIT_RUNNER_FAILED`.
8. WHILE `canonicalReAuditStatus` is `RUNNING`, THE Hook SHALL set `isCanonicalReAuditing` to `true`.
9. WHEN `canonicalReAuditStatus` transitions out of `RUNNING`, THE Hook SHALL set `isCanonicalReAuditing` to `false`.

---

### Requirement 3: Read-Only State Exposure

**User Story:** As a warroom UI component, I want to read canonical re-audit state without being able to mutate it directly, so that all state changes go through the hook's controlled interface.

#### Acceptance Criteria

1. THE Hook SHALL expose `canonicalReAuditStatus` as a read-only `CanonicalReAuditStatus` value.
2. THE Hook SHALL expose `canonicalReAuditResult` as a read-only `CanonicalReAuditResult | null` value, initialised to `null`.
3. THE Hook SHALL expose `canonicalReAuditSnapshotIdentity` as a read-only `CanonicalReAuditSnapshotIdentity | null` value, initialised to `null`.
4. THE Hook SHALL expose `isCanonicalReAuditing` as a read-only `boolean` value, initialised to `false`.
5. THE Hook SHALL NOT expose any state setter functions directly in its return value.
6. WHEN `canonicalReAuditResult` is non-null, THE Hook SHALL ensure `canonicalReAuditSnapshotIdentity` equals the `snapshotIdentity` field of the Adapter result.

---

### Requirement 4: `runCanonicalReAudit` Trigger Function

**User Story:** As a warroom operator, I want to explicitly trigger a canonical re-audit by calling a function with the vault, snapshot, and auditor, so that no audit runs without my deliberate action.

#### Acceptance Criteria

1. THE Hook SHALL expose a `runCanonicalReAudit(vault: CanonicalVaultInput, snapshot: CanonicalReAuditSnapshotIdentity, auditor: string)` function.
2. WHEN `runCanonicalReAudit` is called, THE Hook SHALL construct a `RunInMemoryCanonicalReAuditRequest` with `currentSnapshot` set to the provided `snapshot`, `canonicalVault` set to the provided `vault`, and `auditor` set to the provided `auditor`.
3. WHEN `runCanonicalReAudit` is called, THE Hook SHALL pass the constructed request to `runInMemoryCanonicalReAudit` from the Adapter.
4. WHEN `runCanonicalReAudit` is called while `isCanonicalReAuditing` is `true`, THE Hook SHALL return immediately without invoking the Adapter a second time.
5. IF `vault` is null or undefined, THEN THE Hook SHALL set `canonicalReAuditStatus` to `BLOCKED` with `CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT` without invoking the Adapter.
6. IF `snapshot` is null or undefined, THEN THE Hook SHALL set `canonicalReAuditStatus` to `BLOCKED` with `CanonicalReAuditBlockReason.SNAPSHOT_MISSING` without invoking the Adapter.
7. IF `auditor` is an empty string or whitespace-only, THEN THE Hook SHALL substitute the string `'UNKNOWN_AUDITOR'` before invoking the Adapter.
8. WHEN `runCanonicalReAudit` completes (success or failure), THE Hook SHALL store the Adapter result in `canonicalReAuditResult` and the snapshot in `canonicalReAuditSnapshotIdentity`.

---

### Requirement 5: `resetCanonicalReAudit` Function

**User Story:** As a warroom operator, I want to reset the canonical re-audit state back to its initial values, so that I can start a fresh audit cycle after reviewing results.

#### Acceptance Criteria

1. THE Hook SHALL expose a `resetCanonicalReAudit()` function.
2. WHEN `resetCanonicalReAudit` is called, THE Hook SHALL set `canonicalReAuditStatus` to `CanonicalReAuditStatus.NOT_RUN`.
3. WHEN `resetCanonicalReAudit` is called, THE Hook SHALL set `canonicalReAuditResult` to `null`.
4. WHEN `resetCanonicalReAudit` is called, THE Hook SHALL set `canonicalReAuditSnapshotIdentity` to `null`.
5. WHEN `resetCanonicalReAudit` is called, THE Hook SHALL set `isCanonicalReAuditing` to `false`.
6. WHEN `resetCanonicalReAudit` is called while `isCanonicalReAuditing` is `true`, THE Hook SHALL complete the reset immediately, cancelling any in-progress audit state.

---

### Requirement 6: Safety Invariants

**User Story:** As a system architect, I want the hook to enforce all safety invariants at the type and runtime level, so that no code path can accidentally unlock deploy, mutate canonical state, or inherit session audit results.

#### Acceptance Criteria

1. THE Hook SHALL never set `deployUnlockAllowed` to any value other than `false` in any result it stores or returns.
2. THE Hook SHALL never set `canonicalStateMutationAllowed` to any value other than `false` in any result it stores or returns.
3. THE Hook SHALL never set `persistenceAllowed` to any value other than `false` in any result it stores or returns.
4. THE Hook SHALL never set `sessionAuditInheritanceAllowed` to any value other than `false` in any result it stores or returns.
5. THE Hook SHALL never call any function that writes to `localStorage`, `sessionStorage`, a database, or a backend API.
6. THE Hook SHALL never call any function that mutates the Canonical_Vault directly.
7. THE Hook SHALL never automatically invoke `runCanonicalReAudit` without an explicit call from the Operator.
8. IF the Adapter result contains `deployUnlockAllowed: true`, THEN THE Hook SHALL treat the result as BLOCKED with `CanonicalReAuditBlockReason.DEPLOY_UNLOCK_FORBIDDEN` and discard the original result.
9. IF the Adapter result contains `sessionAuditInheritanceAllowed: true`, THEN THE Hook SHALL treat the result as BLOCKED with `CanonicalReAuditBlockReason.SESSION_AUDIT_INHERITANCE_FORBIDDEN` and discard the original result.

---

### Requirement 7: Snapshot Identity Verification

**User Story:** As a warroom operator, I want the hook to verify snapshot identity before and after the audit, so that stale or mismatched results are never silently accepted.

#### Acceptance Criteria

1. WHEN `runCanonicalReAudit` is called, THE Hook SHALL record the `snapshot` argument as the pre-audit snapshot identity.
2. WHEN the Adapter returns a result, THE Hook SHALL compare the `snapshotIdentity` in the result against the pre-audit snapshot identity using `verifyCanonicalSnapshotIdentityMatch` from `lib/editorial/canonical-reaudit-types`.
3. IF the post-audit snapshot identity does not match the pre-audit snapshot identity, THEN THE Hook SHALL set `canonicalReAuditStatus` to `CanonicalReAuditStatus.STALE` and store a stale result.
4. WHEN a stale result is stored, THE Hook SHALL preserve the pre-audit snapshot identity in `canonicalReAuditSnapshotIdentity` for traceability.

---

### Requirement 8: Warroom Page Integration

**User Story:** As a warroom engineer, I want the warroom page to instantiate `useCanonicalReAudit` and expose its state alongside the existing `remediationController`, so that child components can consume canonical re-audit state without prop-drilling through the hook itself.

#### Acceptance Criteria

1. THE Warroom_Page SHALL instantiate `useCanonicalReAudit` with a call of the form `const canonicalReAudit = useCanonicalReAudit()`.
2. THE Warroom_Page SHALL expose `canonicalReAudit.canonicalReAuditStatus`, `canonicalReAudit.canonicalReAuditResult`, `canonicalReAudit.canonicalReAuditSnapshotIdentity`, and `canonicalReAudit.isCanonicalReAuditing` as named variables or props available to child components.
3. THE Warroom_Page SHALL NOT pass the `runCanonicalReAudit` or `resetCanonicalReAudit` functions to child components that are out of scope for Task 5B.
4. WHEN the Warroom_Page renders, THE Hook SHALL be instantiated exactly once per page mount.
5. THE Warroom_Page SHALL NOT wire `runCanonicalReAudit` to any automatic effect or lifecycle callback.

---

### Requirement 9: Verification Script

**User Story:** As a warroom engineer, I want a standalone verification script that exercises the hook's exported interface and safety invariants, so that I can confirm correctness without running the full Next.js application.

#### Acceptance Criteria

1. THE Verification_Script SHALL be located at `scripts/verify-canonical-reaudit-hook.ts`.
2. THE Verification_Script SHALL import and call `runInMemoryCanonicalReAudit` directly from `lib/editorial/canonical-reaudit-adapter` to verify the adapter contract independently of the hook.
3. THE Verification_Script SHALL construct a valid `RunInMemoryCanonicalReAuditRequest` with a well-formed `CanonicalVaultInput` and `CanonicalReAuditSnapshotIdentity` and assert that the result status is `PASSED_PENDING_ACCEPTANCE` or `FAILED_PENDING_REVIEW` (not `BLOCKED`).
4. THE Verification_Script SHALL construct a request with a null vault and assert that the result status is `BLOCKED` with `CanonicalReAuditBlockReason.MISSING_CANONICAL_VAULT`.
5. THE Verification_Script SHALL construct a request with a null snapshot and assert that the result status is `BLOCKED` with `CanonicalReAuditBlockReason.SNAPSHOT_MISSING`.
6. THE Verification_Script SHALL assert that every result produced by the Adapter has `deployUnlockAllowed: false`, `canonicalStateMutationAllowed: false`, `persistenceAllowed: false`, and `sessionAuditInheritanceAllowed: false`.
7. WHEN all assertions pass, THE Verification_Script SHALL print a summary line of the form `[VERIFY] canonical-reaudit-hook: N checks passed` to stdout.
8. IF any assertion fails, THEN THE Verification_Script SHALL print a descriptive failure message and exit with a non-zero process code.
