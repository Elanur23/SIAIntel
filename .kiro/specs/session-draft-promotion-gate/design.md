# Session Draft Promotion Gate - Design Document

**Feature**: Session Draft Promotion to Canonical Vault  
**Phase**: Design  
**Date**: 2026-04-29  
**Status**: DESIGN_COMPLETE  
**Investigation Report**: `SESSION-DRAFT-PROMOTION-GATE-INVESTIGATION-REPORT.md`

---

## 1. Title and Scope

### Title
**Session Draft Promotion Gate: Explicit Operator-Controlled Promotion of Validated Session Drafts to Canonical Vault**

### Scope
This design covers the creation of a fail-closed promotion gate that allows operators to explicitly promote a validated session draft to the canonical vault after passing session re-audit. The promotion is a separate, explicit human action that does not automatically unlock deploy or overwrite canonical audit validity.

**In Scope**:
- Promotion precondition validation logic
- Promotion mutation helper (pure function)
- Promotion confirmation UI component
- Promotion execution handler
- Post-promotion state management
- Promotion audit trail creation
- Snapshot identity verification
- Fail-closed safety gates

**Out of Scope**:
- Automatic promotion based on session audit pass
- Deploy unlock as part of promotion
- Canonical audit overwrite or validation
- Backend persistence of promotion events (session-memory only in initial phase)
- Promotion rollback/undo functionality
- Multi-operator approval workflow
- Promotion scheduling or batching

---

## 2. Non-Goals

This design explicitly **does not** aim to:

1. **Auto-promote on session audit pass**: Passing session re-audit must never automatically trigger promotion
2. **Unlock deploy on promotion**: Promotion must not change deploy lock state (deploy remains locked)
3. **Validate canonical audit**: Promotion must not mark canonical vault as audit-passed
4. **Skip canonical re-audit**: After promotion, full canonical protocol re-audit is mandatory
5. **Preserve session draft after promotion**: Session draft is cleared after successful promotion
6. **Allow promotion without session audit**: Session audit pass is a mandatory precondition
7. **Support partial promotion**: All 9 languages are promoted atomically or none at all
8. **Provide promotion undo**: Promotion is a one-way operation (manual vault edit required to revert)

---

## 3. Current State Summary

### Canonical Vault State
- **Location**: `app/admin/warroom/page.tsx`
- **State Variable**: `vault` (Record<string, { title, desc, ready }>)
- **Write Paths**: Manual edit, load manual draft, apply Panda package, sync from AI workspace
- **Critical**: No existing write path from session draft to vault

### Session Draft State
- **Location**: `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`
- **State Variable**: `localDraftCopy` (LocalDraft | null)
- **Write Paths**: Initialize from vault, apply remediation, rollback
- **Critical**: Completely isolated from canonical vault

### Deploy Lock Logic
- **Location**: `app/admin/warroom/page.tsx` (lines 220-260)
- **Primary Session Gate**: `if (remediationController.hasSessionDraft) return true`
- **Critical**: Deploy is blocked while session draft exists

### Session Audit State
- **Location**: `useLocalDraftRemediationController` hook
- **State Variables**: `sessionAuditResult`, `sessionAuditLifecycle`
- **Safety Invariants**: `memoryOnly: true`, `deployUnlockAllowed: false`, `vaultMutationAllowed: false`
- **Critical**: Session audit cannot unlock deploy or mutate vault

### Available Safety Primitives
- `sessionAuditResult` - Full audit result with global + Panda validation
- `sessionAuditLifecycle` - Lifecycle state (NOT_RUN, RUNNING, PASSED, FAILED, STALE)
- `SnapshotIdentity` - Content hash + ledger sequence + latest event ID
- `sessionRemediationLedger` - Full audit trail of all applied remediations
- `localDraftCopy` - Session draft content (9 languages)
- `AuditInvalidationState` - Audit invalidation tracking

---

## 4. Threat Model

### Threat 1: Accidental Promotion
**Risk**: Operator accidentally promotes session draft without reviewing changes  
**Mitigation**: Require explicit confirmation modal with acknowledgement checkboxes  
**Severity**: HIGH

### Threat 2: Promotion of Stale Session Audit
**Risk**: Session draft content changes after audit, then gets promoted  
**Mitigation**: Verify snapshot identity matches current session state before promotion  
**Severity**: CRITICAL

### Threat 3: Promotion Without Session Audit
**Risk**: Operator attempts to promote session draft that was never audited  
**Mitigation**: Require `sessionAuditLifecycle === PASSED` as mandatory precondition  
**Severity**: CRITICAL

### Threat 4: Promotion Unlocks Deploy
**Risk**: Operator assumes promotion makes content ready for deploy  
**Mitigation**: Keep deploy locked after promotion, require canonical re-audit  
**Severity**: HIGH

### Threat 5: Loss of Canonical Vault Content
**Risk**: Promotion overwrites canonical vault without backup  
**Mitigation**: Store canonical vault snapshot in promotion event metadata  
**Severity**: MEDIUM

### Threat 6: Promotion During Active Session Changes
**Risk**: Operator promotes while another remediation is being applied  
**Mitigation**: Disable promotion button during remediation apply/rollback operations  
**Severity**: MEDIUM

### Threat 7: Snapshot Identity Mismatch
**Risk**: Session content hash doesn't match audited snapshot  
**Mitigation**: Recompute snapshot identity before promotion and compare with audit result  
**Severity**: CRITICAL

### Threat 8: Partial Promotion Failure
**Risk**: Some languages promoted, others fail, leaving vault in inconsistent state  
**Mitigation**: Use atomic state update (single `setVault` call with complete new vault)  
**Severity**: HIGH

### Threat 9: Promotion Without Transform
**Risk**: Session draft promoted but transform never ran  
**Mitigation**: Check `transformError === null` as precondition (optional, based on workflow)  
**Severity**: LOW (transform is not mandatory for all workflows)

### Threat 10: Audit Trail Loss
**Risk**: Promotion occurs but no record of what was promoted or when  
**Mitigation**: Create immutable promotion event with full metadata before mutation  
**Severity**: MEDIUM

---

## 5. Promotion Gate Preconditions

All preconditions must be satisfied for promotion to be allowed. Fail-closed: if any precondition fails, promotion is blocked.

### Precondition 1: Session Draft Exists
**Check**: `remediationController.hasSessionDraft === true`  
**Reason**: Cannot promote if no session draft exists  
**Block Message**: "No session draft exists"

### Precondition 2: Session Audit Passed
**Check**: `remediationController.sessionAuditLifecycle === SessionAuditLifecycle.PASSED`  
**Reason**: Session draft must pass full audit before promotion  
**Block Message**: "Session audit has not passed"

### Precondition 3: Session Audit Not Stale
**Check**: `remediationController.sessionAuditResult?.isStale === false`  
**Reason**: Audit result must reflect current session state  
**Block Message**: "Session audit is stale - re-audit required"

### Precondition 4: Global Audit Passed
**Check**: `remediationController.sessionAuditResult?.globalAuditPass === true`  
**Reason**: All 9 languages must pass global governance audit  
**Block Message**: "Global audit did not pass"

### Precondition 5: Panda Check Passed
**Check**: `remediationController.sessionAuditResult?.pandaCheckPass === true`  
**Reason**: Session draft must conform to Panda package structure  
**Block Message**: "Panda validation did not pass"

### Precondition 6: Snapshot Identity Matches
**Check**: Recompute current snapshot identity and compare with `sessionAuditResult.identity`  
**Reason**: Prevent promotion of content that changed after audit  
**Block Message**: "Session content has changed since audit - re-audit required"

### Precondition 7: No Transform Error (Optional)
**Check**: `transformError === null` (optional based on workflow)  
**Reason**: If transform was attempted, it must have succeeded  
**Block Message**: "Transform error exists - resolve before promotion"

### Precondition 8: Article Selected
**Check**: `selectedNews !== null`  
**Reason**: Must have an active article context  
**Block Message**: "No article selected"

### Precondition 9: Local Draft Copy Available
**Check**: `remediationController.localDraftCopy !== null`  
**Reason**: Must have session draft content to promote  
**Block Message**: "Session draft content not available"

### Precondition 10: No Structural Errors
**Check**: `sessionAuditResult.pandaStructuralErrors === undefined || length === 0`  
**Reason**: Session draft must have valid structure  
**Block Message**: "Session draft has structural errors"

---

## 6. Forbidden Side Effects

The following side effects are **strictly forbidden** during or after promotion:

### Forbidden 1: Deploy Unlock
**Rule**: Promotion must NOT change `isDeployBlocked` from `true` to `false`  
**Enforcement**: Deploy lock logic checks canonical audit state, which is invalidated post-promotion

### Forbidden 2: Canonical Audit Validation
**Rule**: Promotion must NOT set `globalAudit.publishable = true` or mark canonical audit as passed  
**Enforcement**: Clear `globalAudit`, `auditResult`, `transformedArticle` after promotion

### Forbidden 3: Session Audit Persistence
**Rule**: Promotion must NOT persist `sessionAuditResult` to backend or storage  
**Enforcement**: Session audit remains memory-only, never written to database/API

### Forbidden 4: Automatic Canonical Re-Audit
**Rule**: Promotion must NOT automatically trigger canonical protocol re-audit  
**Enforcement**: Operator must explicitly click "Run Global 9-Node Audit" after promotion

### Forbidden 5: Session Draft Preservation
**Rule**: Promotion must NOT keep session draft active after promotion  
**Enforcement**: Call `remediationController.clearLocalDraftSession()` after promotion

### Forbidden 6: Partial Vault Update
**Rule**: Promotion must NOT update only some languages in vault  
**Enforcement**: Use atomic `setVault()` call with complete new vault object

### Forbidden 7: Backend Mutation
**Rule**: Promotion must NOT call `/api/war-room/save` or any backend write API  
**Enforcement**: Promotion is client-side state mutation only (no fetch/axios calls)

### Forbidden 8: Ledger Persistence
**Rule**: Promotion must NOT persist `sessionRemediationLedger` to backend  
**Enforcement**: Ledger is session-memory only, cleared after promotion

### Forbidden 9: Snapshot Overwrite
**Rule**: Promotion must NOT overwrite canonical vault snapshots in backend  
**Enforcement**: No backend calls during promotion

### Forbidden 10: Audit Trail Omission
**Rule**: Promotion must NOT proceed without creating promotion event metadata  
**Enforcement**: Create promotion event before calling `setVault()`

---

## 7. Required State Transitions

### Transition 1: Session Draft → Canonical Vault
**Before**: `localDraftCopy` contains session draft content  
**After**: `vault` contains promoted content (deep copy of `localDraftCopy`)  
**Mechanism**: `setVault(promoteSessionDraftToVault(localDraftCopy, vault, ...))`

### Transition 2: Session Draft Exists → Session Draft Cleared
**Before**: `remediationController.hasSessionDraft === true`  
**After**: `remediationController.hasSessionDraft === false`  
**Mechanism**: `remediationController.clearLocalDraftSession()`

### Transition 3: Canonical Audit Valid → Canonical Audit Invalidated
**Before**: `globalAudit !== null`, `auditResult !== null`, `transformedArticle !== null`  
**After**: `globalAudit === null`, `auditResult === null`, `transformedArticle === null`  
**Mechanism**: `setGlobalAudit(null)`, `setAuditResult(null)`, `setTransformedArticle(null)`

### Transition 4: Deploy Block Reason → Canonical Re-Audit Required
**Before**: Deploy block reason: "Local session draft exists — full protocol re-audit required."  
**After**: Deploy block reason: "Canonical vault updated from session draft — full re-audit required."  
**Mechanism**: Deploy lock logic detects `hasSessionDraft === false` but `globalAudit === null`

### Transition 5: Session Audit Result → Cleared
**Before**: `sessionAuditResult !== null`, `sessionAuditLifecycle === PASSED`  
**After**: `sessionAuditResult === null`, `sessionAuditLifecycle === NOT_RUN`  
**Mechanism**: `clearLocalDraftSession()` clears all session state

### Transition 6: Session Remediation Ledger → Cleared
**Before**: `sessionRemediationLedger.length > 0`  
**After**: `sessionRemediationLedger.length === 0`  
**Mechanism**: `clearLocalDraftSession()` clears ledger

### Transition 7: Transform Error → Preserved (if exists)
**Before**: `transformError !== null`  
**After**: `transformError !== null` (unchanged)  
**Mechanism**: Transform error is not cleared by promotion (operator must resolve separately)

### Transition 8: Image URL → Preserved
**Before**: `imageUrl === "https://..."`  
**After**: `imageUrl === "https://..."` (unchanged)  
**Mechanism**: Image URL is not affected by promotion

### Transition 9: Active Language → Preserved
**Before**: `activeLang === "en"`  
**After**: `activeLang === "en"` (unchanged)  
**Mechanism**: Active language selection is not affected by promotion

### Transition 10: Promotion Event → Created
**Before**: No promotion event exists  
**After**: Promotion event created with full metadata  
**Mechanism**: Create promotion event before state mutations

---

## 8. Required Audit Trail Fields

### Promotion Event Structure
```typescript
export interface PromotionEvent {
  // Identity
  promotionId: string;              // UUID v4
  articleId: string;                // From selectedNews.id
  packageId: string;                // From lastImportInfo?.id or 'manual'
  operatorId: string;               // Hard-coded 'warroom-operator' for now
  
  // Snapshot Binding
  sourceSnapshotIdentity: SnapshotIdentity;  // From sessionAuditResult.identity
  canonicalVaultSnapshot: LocalDraft;        // Backup of vault before promotion
  
  // Audit Context
  sessionAuditResult: SessionAuditResult;    // Full session audit result
  globalAuditPass: boolean;                  // From sessionAuditResult
  pandaCheckPass: boolean;                   // From sessionAuditResult
  
  // Remediation Context
  remediationCount: number;                  // sessionRemediationLedger.length
  ledgerSnapshot: RemediationLedgerEntry[];  // Deep copy of ledger
  
  // Metadata
  promotedAt: string;                        // ISO 8601 timestamp
  promotedLanguages: string[];               // ['en', 'tr', 'de', ...]
  
  // Safety Assertions
  auditInvalidated: true;                    // Hard-coded
  reAuditRequired: true;                     // Hard-coded
  deployBlocked: true;                       // Hard-coded
  sessionOnly: true;                         // Hard-coded (no backend persistence)
}
```

### Audit Trail Storage
**Phase 1 (Initial)**: Session-memory only (React state)  
**Phase 2 (Future)**: Persist to backend audit log table

### Audit Trail Retention
**Session-memory**: Cleared on page refresh  
**Backend (future)**: Permanent retention for compliance

---

## 9. UI/Operator Confirmation Requirements

### Confirmation Modal Component
**Component Name**: `SessionDraftPromotionModal.tsx`  
**Location**: `app/admin/warroom/components/`

### Modal Trigger
**Button Label**: "Promote to Canonical Vault"  
**Button Location**: Right rail, Deploy Configuration section, between Session Audit State Panel and Deploy Hub button  
**Button Visibility**: Only when `remediationController.hasSessionDraft === true`  
**Button State**: Enabled only when all preconditions pass

### Modal Content Structure

#### Section 1: Header
- **Title**: "Promote Session Draft to Canonical Vault"
- **Icon**: Upload icon or promotion icon
- **Color**: Amber/warning theme (not green/success)

#### Section 2: Precondition Checklist
Display all 10 preconditions with visual indicators:
- ✅ Green checkmark: Precondition satisfied
- ❌ Red X: Precondition failed
- ⏳ Gray spinner: Precondition checking

**Example**:
```
✅ Session draft exists
✅ Session audit passed
✅ Session audit not stale
✅ Global audit passed
✅ Panda check passed
✅ Snapshot identity matches
✅ No transform error
✅ Article selected
✅ Local draft copy available
✅ No structural errors
```

#### Section 3: Promotion Summary
- **Languages Modified**: List of languages with changes (e.g., "9 languages")
- **Remediation Count**: Number of remediations applied (e.g., "3 format repairs applied")
- **Session Audit Score**: Global audit score (e.g., "Global Health: 92/100")
- **Snapshot Identity**: Display content hash (truncated) for verification

#### Section 4: Impact Warning
Display clear warnings about what promotion does and does not do:

**What Promotion Does**:
- ✅ Saves session draft content to canonical vault
- ✅ Clears session draft and remediation history
- ✅ Invalidates current canonical audit results

**What Promotion Does NOT Do**:
- ❌ Does NOT unlock deploy
- ❌ Does NOT validate canonical vault as audit-passed
- ❌ Does NOT skip canonical re-audit requirement

#### Section 5: Acknowledgement Checkboxes
Operator must check all boxes before promotion is enabled:

1. ☐ "I understand this saves session draft to canonical vault"
2. ☐ "I understand deploy remains locked until canonical vault is re-audited"
3. ☐ "I understand this invalidates current canonical audit results"
4. ☐ "I understand session draft will be cleared after promotion"

#### Section 6: Action Buttons
- **Primary Button**: "Promote to Canonical Vault" (enabled only when all checkboxes checked)
- **Secondary Button**: "Cancel" (closes modal without promotion)

### Button Styling
**Promote Button**:
- Color: Amber gradient (warning theme, not success green)
- Icon: Upload or promotion icon
- Text: "PROMOTE TO CANONICAL VAULT"
- Disabled state: Gray with tooltip showing which preconditions failed

**Cancel Button**:
- Color: Neutral gray
- Text: "CANCEL"

### Post-Promotion Feedback
**Success Toast**:
- Message: "✅ Session draft promoted to canonical vault. Run full protocol re-audit before deploy."
- Duration: 5 seconds
- Color: Amber (not green)

**Error Toast** (if promotion fails):
- Message: "❌ Promotion failed: {error reason}"
- Duration: 10 seconds
- Color: Red

---

## 10. Post-Promotion Lock Behavior

### Deploy Lock State
**Before Promotion**: Deploy locked due to session draft existence  
**After Promotion**: Deploy remains locked due to canonical audit invalidation

### Deploy Lock Reason Evolution
**Before Promotion**:
```
"Local session draft exists — full protocol re-audit required."
```

**After Promotion**:
```
"Canonical vault updated from session draft — full re-audit required."
```

### Deploy Lock Conditions After Promotion
Deploy remains blocked because:
1. `globalAudit === null` (cleared by promotion)
2. `auditResult === null` (cleared by promotion)
3. `transformedArticle === null` (cleared by promotion)

### Unlock Path After Promotion
Operator must:
1. Click "Run Global 9-Node Audit" button
2. Wait for global audit to complete
3. Click "TRANSFORM TO ARTICLE" button (if needed)
4. Verify all deploy lock conditions are satisfied
5. Only then can deploy be unlocked

### Session Draft Lock Cleared
**Before Promotion**: `remediationController.hasSessionDraft === true` blocks deploy  
**After Promotion**: `remediationController.hasSessionDraft === false` (no longer blocks)

### Canonical Audit Lock Active
**After Promotion**: Canonical audit gates become active blockers:
- No global audit → blocks deploy
- No transformed article → blocks deploy
- No active language audit → blocks deploy
- Audit score < 70 → blocks deploy

---

## 11. Rollback/Recovery Expectations

### Promotion is One-Way
**Design Decision**: Promotion is NOT reversible through UI  
**Rationale**: Promotion is a deliberate operator action, not an automatic process

### Recovery Options After Promotion

#### Option 1: Manual Vault Edit
Operator can manually edit canonical vault content through:
- Manual edit textarea
- Load manual draft
- Apply Panda package
- Sync from AI workspace

#### Option 2: Re-Import Panda Package
If original Panda package is available:
1. Click "Import Panda JSON"
2. Select original Panda package file
3. Confirm import (overwrites vault)

#### Option 3: Sync from AI Workspace
If workspace has backup:
1. Click "SYNC WORKSPACE"
2. Workspace content overwrites vault

### Canonical Vault Snapshot Preservation
**Promotion Event** stores `canonicalVaultSnapshot` field:
- Contains full vault state before promotion
- Stored in session memory (Phase 1)
- Can be used for manual recovery if needed
- Not automatically restored (requires manual intervention)

### Session Draft Cannot Be Restored
**After Promotion**: Session draft is permanently cleared  
**Rationale**: Session draft is ephemeral by design  
**Recovery**: Operator must manually recreate session draft if needed

### Remediation Ledger Preservation
**Promotion Event** stores `ledgerSnapshot` field:
- Contains full remediation history
- Stored in session memory (Phase 1)
- Can be reviewed for audit purposes
- Not used for automatic rollback

### No Automatic Rollback
**Design Decision**: No "Undo Promotion" button  
**Rationale**: Promotion is a deliberate, confirmed action with multiple acknowledgements

---

## 12. Verification Strategy

### Unit Tests

#### Test 1: Precondition Validation
**File**: `lib/editorial/__tests__/promotion-gate.test.ts`  
**Coverage**:
- All 10 preconditions individually
- Precondition combinations
- Edge cases (null values, undefined, empty strings)

#### Test 2: Promotion Mutation
**File**: `lib/editorial/__tests__/promotion-mutation.test.ts`  
**Coverage**:
- Vault content deep copy
- Snapshot identity computation
- Promotion event creation
- Atomic state update

#### Test 3: Snapshot Identity Verification
**File**: `lib/editorial/__tests__/snapshot-identity.test.ts`  
**Coverage**:
- Content hash computation
- Ledger sequence tracking
- Identity mismatch detection
- Stale audit detection

### Integration Tests

#### Test 4: Full Promotion Flow
**File**: `app/admin/warroom/__tests__/promotion-flow.test.tsx`  
**Coverage**:
- Button visibility based on preconditions
- Modal open/close behavior
- Acknowledgement checkbox validation
- Promotion execution
- Post-promotion state verification

#### Test 5: Post-Promotion Deploy Lock
**File**: `app/admin/warroom/__tests__/post-promotion-lock.test.tsx`  
**Coverage**:
- Deploy remains locked after promotion
- Deploy lock reason updates correctly
- Canonical audit invalidation
- Session draft cleared

### Manual Verification Script

#### Script: `scripts/verify-session-draft-promotion-gate.ts`
**Checks**:
1. Precondition validation logic exists
2. Promotion mutation helper exists
3. Promotion modal component exists
4. Promotion button renders correctly
5. Post-promotion state transitions correct
6. Deploy lock behavior correct
7. Audit trail creation correct
8. Snapshot identity verification correct
9. No forbidden side effects occur
10. All safety invariants preserved

### Production Smoke Tests

#### Smoke 1: Promotion with Valid Session Audit
1. Create session draft
2. Apply remediation
3. Run session re-audit (pass)
4. Click "Promote to Canonical Vault"
5. Verify vault updated
6. Verify session cleared
7. Verify deploy still locked

#### Smoke 2: Promotion Blocked by Stale Audit
1. Create session draft
2. Run session re-audit (pass)
3. Apply another remediation (audit becomes stale)
4. Verify promotion button disabled
5. Verify tooltip shows "Session audit is stale"

#### Smoke 3: Post-Promotion Canonical Re-Audit
1. Promote session draft
2. Click "Run Global 9-Node Audit"
3. Verify canonical audit runs
4. Verify deploy lock updates based on canonical audit result

---

## 13. Implementation Task Breakdown Preview

### Phase 1: Precondition Validation (Pure Logic)
**Tasks**:
1. Create `lib/editorial/promotion-gate-preconditions.ts`
2. Implement `checkPromotionPreconditions()` pure helper
3. Implement `computeCurrentSnapshotIdentity()` helper
4. Implement `verifySnapshotIdentityMatch()` helper
5. Add unit tests for all precondition scenarios
6. Add TypeScript types for precondition check result

**Deliverable**: Pure precondition validation logic with 100% test coverage

### Phase 2: Promotion Mutation Helper (Pure Logic)
**Tasks**:
1. Create `lib/editorial/promotion-mutation.ts`
2. Implement `promoteSessionDraftToVault()` pure helper
3. Implement `createPromotionEvent()` helper
4. Implement `deepCopyLocalDraft()` helper
5. Add unit tests for promotion mutation logic
6. Add TypeScript types for promotion event

**Deliverable**: Pure promotion mutation logic with 100% test coverage

### Phase 3: Promotion UI Component (UI Only)
**Tasks**:
1. Create `app/admin/warroom/components/SessionDraftPromotionModal.tsx`
2. Implement precondition checklist display
3. Implement promotion summary display
4. Implement impact warning display
5. Implement acknowledgement checkboxes
6. Implement action buttons (promote/cancel)
7. Add component unit tests

**Deliverable**: Promotion modal component (no execution logic)

### Phase 4: Promotion Button Integration (UI Only)
**Tasks**:
1. Add "Promote to Canonical Vault" button to right rail
2. Wire button to precondition checks
3. Wire button to modal open
4. Implement button disabled state logic
5. Implement button tooltip with block reasons
6. Add integration tests for button behavior

**Deliverable**: Promotion button with precondition-based enable/disable

### Phase 5: Promotion Execution Handler (Full Integration)
**Tasks**:
1. Create `handlePromoteSessionDraft()` handler in warroom page
2. Wire modal "Promote" button to handler
3. Implement promotion event creation
4. Implement vault state update (`setVault`)
5. Implement session draft clearing (`clearLocalDraftSession`)
6. Implement canonical audit invalidation
7. Implement success/error toast notifications
8. Add integration tests for full promotion flow

**Deliverable**: Working promotion execution with state management

### Phase 6: Verification & Testing
**Tasks**:
1. Create `scripts/verify-session-draft-promotion-gate.ts`
2. Run all unit tests
3. Run all integration tests
4. Run verification script
5. Perform manual smoke tests
6. Document test results

**Deliverable**: Verified promotion gate with passing tests

---

## 14. Final Design Verdict

### Design Completeness Assessment

**Preconditions**: ✅ Fully specified (10 preconditions with clear checks)  
**Forbidden Side Effects**: ✅ Fully specified (10 forbidden actions)  
**State Transitions**: ✅ Fully specified (10 required transitions)  
**Audit Trail**: ✅ Fully specified (PromotionEvent structure)  
**UI Requirements**: ✅ Fully specified (modal structure and button placement)  
**Post-Promotion Behavior**: ✅ Fully specified (deploy lock and unlock path)  
**Rollback Strategy**: ✅ Fully specified (one-way with recovery options)  
**Verification Strategy**: ✅ Fully specified (unit, integration, manual tests)  
**Implementation Tasks**: ✅ Fully specified (6 phases with clear deliverables)  
**Threat Model**: ✅ Fully specified (10 threats with mitigations)

### Safety Guarantees Verified

✅ Promotion is explicit operator action (not automatic)  
✅ Passing session audit does not auto-promote  
✅ Passing session audit does not unlock deploy  
✅ Promotion does not overwrite canonical audit as valid  
✅ Promotion invalidates canonical audit  
✅ Deploy remains locked after promotion  
✅ Promotion creates clear audit trail  
✅ Promotion requires snapshot identity match  
✅ Promotion fails closed on stale/missing/failed audit  
✅ Promotion preserves rollback/audit context

### Design Risks Identified

**Risk 1**: Snapshot identity mismatch detection complexity  
**Mitigation**: Use existing `computeSnapshotIdentity()` helper, add comprehensive tests

**Risk 2**: Atomic vault update failure  
**Mitigation**: Use single `setVault()` call, no partial updates

**Risk 3**: Operator confusion about deploy lock  
**Mitigation**: Clear UI warnings, acknowledgement checkboxes, post-promotion toast

**Risk 4**: Loss of canonical vault content  
**Mitigation**: Store canonical vault snapshot in promotion event

**Risk 5**: Promotion during active session changes  
**Mitigation**: Disable promotion button during remediation operations

### Open Questions Resolved

**Q1**: Should promotion be reversible?  
**A1**: No. Promotion is one-way. Manual recovery options available.

**Q2**: Should promotion create backup of canonical vault?  
**A2**: Yes. Store in promotion event metadata.

**Q3**: Should promotion trigger automatic canonical re-audit?  
**A3**: No. Operator must explicitly trigger canonical re-audit.

**Q4**: Should promotion be logged to backend?  
**A4**: Not in Phase 1. Session-memory only. Backend logging in Phase 2.

**Q5**: Should promotion be allowed if session audit has warnings?  
**A5**: Yes, if `globalAuditPass && pandaCheckPass`. Warnings are informational.

### Design Approval Criteria

✅ All mandatory design principles satisfied  
✅ All forbidden side effects specified  
✅ All required state transitions specified  
✅ All preconditions specified with clear checks  
✅ All threats identified with mitigations  
✅ UI/operator confirmation requirements specified  
✅ Post-promotion lock behavior specified  
✅ Rollback/recovery expectations specified  
✅ Verification strategy specified  
✅ Implementation task breakdown specified

### Final Verdict

**READY_FOR_TASKS**

This design is complete, safe, and ready for implementation. All safety guarantees are specified, all threats are mitigated, and all implementation tasks are clearly defined. The design follows fail-closed principles and maintains strict separation between session audit pass and deploy unlock.

---

**Design Document Version**: 1.0  
**Design Approval Date**: 2026-04-29  
**Next Phase**: Implementation (Task Breakdown)  
**Estimated Implementation Effort**: 6 phases, ~40 hours total
