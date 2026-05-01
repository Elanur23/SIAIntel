# Session Draft Promotion Gate - Implementation Tasks

**Feature**: Session Draft Promotion to Canonical Vault  
**Phase**: Implementation  
**Date**: 2026-04-29  
**Design Document**: `.kiro/specs/session-draft-promotion-gate/design.md`  
**Design Verdict**: READY_FOR_TASKS

---

## Task Execution Rules

**CRITICAL CONSTRAINTS**:
- Do NOT implement code until explicitly instructed
- Do NOT modify runtime files without approval
- Do NOT add UI components without approval
- Do NOT add backend routes
- Do NOT change deploy logic
- Do NOT change Panda validation
- Do NOT change Global Audit logic
- Do NOT call APIs/providers
- Do NOT commit/push/deploy without approval

**TASK SEQUENCE**: Tasks must be completed in order. Each task has clear completion criteria and stop conditions.

---

## Task 1: Precondition Contract Types

### Objective
Define TypeScript types and enums for promotion precondition validation, promotion events, and audit trail. No runtime logic, pure type definitions only.

### Files to Create
- `lib/editorial/promotion-gate-types.ts`

### Files to Modify
- None (new file only)

### Allowed Changes
1. Define `PromotionPreconditionCheck` interface with:
   - `canPromote: boolean`
   - `blockReasons: string[]`
   - `preconditionsMet: Record<string, boolean>` (10 preconditions)
2. Define `PromotionBlockReason` enum with all 10 block reasons
3. Define `PromotionEvent` interface matching design spec (Section 8)
4. Define `PromotionResult` interface with success/failure states
5. Define `PromotionAcknowledgement` interface for operator confirmations
6. Add JSDoc comments for all types
7. Export all types for use in other modules

### Forbidden Changes
- Do NOT add runtime validation logic
- Do NOT add React hooks
- Do NOT add UI components
- Do NOT add state management
- Do NOT add API calls
- Do NOT modify existing types in `remediation-apply-types.ts`
- Do NOT add backend persistence logic

### Validation Command
```bash
npx tsc --noEmit --skipLibCheck lib/editorial/promotion-gate-types.ts
```

### Completion Criteria
- [ ] `PromotionPreconditionCheck` interface defined with all 10 preconditions
- [ ] `PromotionBlockReason` enum defined with all 10 reasons
- [ ] `PromotionEvent` interface defined with all required fields from design
- [ ] `PromotionResult` interface defined
- [ ] `PromotionAcknowledgement` interface defined
- [ ] All types have JSDoc comments
- [ ] TypeScript validation passes (exit code 0)
- [ ] No runtime logic added
- [ ] No imports from React or UI libraries

### Stop Condition
**STOP** if:
- TypeScript validation fails
- Runtime logic is added
- Existing types are modified
- Backend persistence types are added

---

## Task 2: Pure Precondition Validator

### Objective
Implement pure helper function to validate all 10 promotion preconditions. No React hooks, no state mutations, pure function only.

### Files to Create
- `lib/editorial/promotion-gate-preconditions.ts`
- `lib/editorial/__tests__/promotion-gate-preconditions.test.ts` (unit tests)

### Files to Modify
- None (new files only)

### Allowed Changes
1. Implement `checkPromotionPreconditions()` pure function:
   - Input: session draft state, session audit result, snapshot identity, transform error, selected news
   - Output: `PromotionPreconditionCheck` object
   - Check all 10 preconditions from design (Section 5)
   - Return detailed block reasons for failed preconditions
2. Implement `computeCurrentSnapshotIdentity()` helper:
   - Input: localDraftCopy, sessionRemediationLedger
   - Output: `SnapshotIdentity`
   - Compute content hash from draft content
   - Include ledger sequence and latest event ID
3. Implement `verifySnapshotIdentityMatch()` helper:
   - Input: current identity, audit result identity
   - Output: boolean (true if match)
   - Compare content hash, ledger sequence, latest event ID
4. Add comprehensive unit tests:
   - Test each precondition individually
   - Test precondition combinations
   - Test edge cases (null, undefined, empty)
   - Test snapshot identity computation
   - Test snapshot identity mismatch detection

### Forbidden Changes
- Do NOT add React hooks (useState, useEffect, etc.)
- Do NOT add UI components
- Do NOT mutate input parameters
- Do NOT call APIs or backend
- Do NOT add state management
- Do NOT modify existing remediation types
- Do NOT add automatic promotion logic

### Validation Command
```bash
npx tsc --noEmit --skipLibCheck lib/editorial/promotion-gate-preconditions.ts
npm test lib/editorial/__tests__/promotion-gate-preconditions.test.ts
```

### Completion Criteria
- [ ] `checkPromotionPreconditions()` implemented and validates all 10 preconditions
- [ ] `computeCurrentSnapshotIdentity()` implemented
- [ ] `verifySnapshotIdentityMatch()` implemented
- [ ] All functions are pure (no side effects)
- [ ] Unit tests written with 100% coverage
- [ ] All unit tests pass
- [ ] TypeScript validation passes
- [ ] No React dependencies
- [ ] No state mutations
- [ ] No API calls

### Stop Condition
**STOP** if:
- TypeScript validation fails
- Unit tests fail
- React hooks are added
- State mutations occur
- API calls are added
- Existing types are modified

---

## Task 3: Pure Promotion Payload Builder

### Objective
Implement pure helper function to build canonical vault update payload from session draft. No state mutations, pure transformation only.

### Files to Create
- `lib/editorial/promotion-mutation.ts`
- `lib/editorial/__tests__/promotion-mutation.test.ts` (unit tests)

### Files to Modify
- None (new files only)

### Allowed Changes
1. Implement `promoteSessionDraftToVault()` pure function:
   - Input: localDraftCopy, current vault, session audit result, ledger, operator ID
   - Output: `PromotionResult` with new vault and promotion event
   - Deep copy localDraftCopy to create new vault
   - Preserve all 9 languages atomically
   - Create promotion event with full metadata
   - Store canonical vault snapshot in promotion event
2. Implement `createPromotionEvent()` helper:
   - Input: article ID, package ID, snapshot identity, audit result, ledger, operator ID
   - Output: `PromotionEvent` with all required fields
   - Generate UUID for promotion ID
   - Include timestamp, promoted languages, remediation count
   - Hard-code safety assertions (auditInvalidated: true, etc.)
3. Implement `deepCopyLocalDraft()` helper:
   - Input: LocalDraft
   - Output: Deep copy of LocalDraft
   - Ensure no shared references
4. Add comprehensive unit tests:
   - Test vault deep copy
   - Test promotion event creation
   - Test snapshot preservation
   - Test atomic update (all languages or none)
   - Test metadata completeness

### Forbidden Changes
- Do NOT mutate input parameters
- Do NOT call setVault or any state setters
- Do NOT call APIs or backend
- Do NOT add React hooks
- Do NOT add UI components
- Do NOT add automatic promotion execution
- Do NOT modify existing vault state
- Do NOT persist to backend

### Validation Command
```bash
npx tsc --noEmit --skipLibCheck lib/editorial/promotion-mutation.ts
npm test lib/editorial/__tests__/promotion-mutation.test.ts
```

### Completion Criteria
- [ ] `promoteSessionDraftToVault()` implemented
- [ ] `createPromotionEvent()` implemented
- [ ] `deepCopyLocalDraft()` implemented
- [ ] All functions are pure (no side effects)
- [ ] Atomic vault update (all 9 languages)
- [ ] Canonical vault snapshot preserved in promotion event
- [ ] Unit tests written with 100% coverage
- [ ] All unit tests pass
- [ ] TypeScript validation passes
- [ ] No state mutations
- [ ] No API calls
- [ ] No React dependencies

### Stop Condition
**STOP** if:
- TypeScript validation fails
- Unit tests fail
- State mutations occur
- API calls are added
- Partial vault updates are implemented
- Backend persistence is added

---

## Task 4: Promotion Modal UI Scaffold (Read-Only)

### Objective
Create promotion confirmation modal component with precondition checklist, promotion summary, impact warnings, and acknowledgement checkboxes. No execution logic, read-only display only.

### Files to Create
- `app/admin/warroom/components/SessionDraftPromotionModal.tsx`
- `app/admin/warroom/components/__tests__/SessionDraftPromotionModal.test.tsx` (unit tests)

### Files to Modify
- None (new files only)

### Allowed Changes
1. Create modal component with props:
   - `isOpen: boolean`
   - `onClose: () => void`
   - `onPromote: () => void` (disabled in this task)
   - `preconditionCheck: PromotionPreconditionCheck`
   - `promotionSummary: { languageCount, remediationCount, auditScore, snapshotHash }`
2. Implement UI sections from design (Section 9):
   - Header with title and amber theme
   - Precondition checklist with visual indicators (✅/❌/⏳)
   - Promotion summary display
   - Impact warning (what promotion does/doesn't do)
   - Acknowledgement checkboxes (4 checkboxes)
   - Action buttons (Promote/Cancel)
3. Keep "Promote" button DISABLED in this task
4. Wire "Cancel" button to onClose prop
5. Add component unit tests:
   - Test modal open/close
   - Test precondition checklist rendering
   - Test acknowledgement checkbox state
   - Test button disabled state

### Forbidden Changes
- Do NOT enable "Promote" button execution
- Do NOT call promotion mutation functions
- Do NOT mutate vault state
- Do NOT call APIs or backend
- Do NOT add automatic promotion logic
- Do NOT modify existing warroom components
- Do NOT add deploy unlock logic
- Do NOT add canonical audit validation

### Validation Command
```bash
npx tsc --noEmit --skipLibCheck app/admin/warroom/components/SessionDraftPromotionModal.tsx
npm test app/admin/warroom/components/__tests__/SessionDraftPromotionModal.test.tsx
```

### Completion Criteria
- [ ] Modal component created with all UI sections from design
- [ ] Precondition checklist displays all 10 preconditions
- [ ] Promotion summary displays language count, remediation count, audit score
- [ ] Impact warning displays what promotion does/doesn't do
- [ ] 4 acknowledgement checkboxes implemented
- [ ] "Promote" button exists but is DISABLED
- [ ] "Cancel" button wired to onClose
- [ ] Component unit tests written
- [ ] All unit tests pass
- [ ] TypeScript validation passes
- [ ] No execution logic added
- [ ] No state mutations
- [ ] No API calls

### Stop Condition
**STOP** if:
- TypeScript validation fails
- Unit tests fail
- "Promote" button is enabled
- Execution logic is added
- State mutations occur
- API calls are added
- Existing components are modified

---

## Task 5: Disabled Promotion Button Integration

### Objective
Add "Promote to Canonical Vault" button to warroom right rail. Button is visible when session draft exists but remains disabled until all preconditions pass. No execution logic yet.

### Files to Modify
- `app/admin/warroom/page.tsx`

### Allowed Changes
1. Add state for promotion modal:
   - `const [isPromotionModalOpen, setIsPromotionModalOpen] = useState(false)`
2. Add precondition check computation:
   - Call `checkPromotionPreconditions()` in useMemo
   - Pass session draft state, audit result, snapshot identity, transform error
3. Add "Promote to Canonical Vault" button in right rail:
   - Location: Between Session Audit State Panel and Deploy Hub button
   - Visibility: Only when `remediationController.hasSessionDraft === true`
   - State: Disabled when `!preconditionCheck.canPromote`
   - Tooltip: Show block reasons when disabled
   - Click: Opens promotion modal (no execution yet)
4. Import and render `SessionDraftPromotionModal`:
   - Pass precondition check
   - Pass promotion summary data
   - Wire onClose to close modal
   - Keep onPromote as no-op for now

### Forbidden Changes
- Do NOT enable promotion execution
- Do NOT mutate vault state
- Do NOT call promotion mutation functions
- Do NOT call APIs or backend
- Do NOT modify deploy lock logic
- Do NOT modify existing buttons or panels
- Do NOT add automatic promotion logic
- Do NOT unlock deploy

### Validation Command
```bash
npx tsc --noEmit --skipLibCheck app/admin/warroom/page.tsx
```

### Completion Criteria
- [ ] Promotion modal state added
- [ ] Precondition check computed in useMemo
- [ ] "Promote to Canonical Vault" button added to right rail
- [ ] Button visible only when session draft exists
- [ ] Button disabled when preconditions not met
- [ ] Button tooltip shows block reasons
- [ ] Button opens modal on click
- [ ] Modal renders with precondition checklist
- [ ] Modal "Promote" button still disabled
- [ ] TypeScript validation passes
- [ ] No execution logic added
- [ ] No state mutations
- [ ] No API calls

### Stop Condition
**STOP** if:
- TypeScript validation fails
- Promotion execution is enabled
- Vault state is mutated
- Deploy lock logic is modified
- Existing components are broken
- API calls are added

---

## Task 6: Promotion Execution Handler

### Objective
Implement promotion execution handler with explicit operator acknowledgement, precondition re-check, vault mutation, session clearing, and canonical audit invalidation. Deploy remains locked.

### Files to Modify
- `app/admin/warroom/page.tsx`

### Allowed Changes
1. Implement `handlePromoteSessionDraft()` handler:
   - Re-check all preconditions at execution time (fail-closed)
   - Verify all 4 acknowledgement checkboxes are checked
   - Call `promoteSessionDraftToVault()` to build promotion payload
   - Create promotion event with full metadata
   - Update vault state: `setVault(promotionResult.newVault)`
   - Clear session draft: `remediationController.clearLocalDraftSession()`
   - Invalidate canonical audit: `setGlobalAudit(null)`, `setAuditResult(null)`, `setTransformedArticle(null)`
   - Store promotion event in session state (React state)
   - Show success toast: "Session draft promoted to canonical vault. Run full protocol re-audit before deploy."
   - Close modal
   - Handle errors with error toast
2. Wire handler to modal "Promote" button:
   - Enable button only when all acknowledgements checked
   - Call handler on click
3. Add promotion event state:
   - `const [lastPromotionEvent, setLastPromotionEvent] = useState<PromotionEvent | null>(null)`
4. Verify deploy remains locked after promotion:
   - Deploy lock logic already checks `globalAudit === null`
   - No changes to deploy lock logic needed

### Forbidden Changes
- Do NOT unlock deploy
- Do NOT validate canonical audit as passed
- Do NOT persist promotion event to backend
- Do NOT automatically trigger canonical re-audit
- Do NOT preserve session draft after promotion
- Do NOT allow partial vault updates
- Do NOT skip precondition re-check
- Do NOT skip acknowledgement verification
- Do NOT modify Panda validation
- Do NOT modify Global Audit logic

### Validation Command
```bash
npx tsc --noEmit --skipLibCheck app/admin/warroom/page.tsx
```

### Completion Criteria
- [ ] `handlePromoteSessionDraft()` handler implemented
- [ ] Preconditions re-checked at execution time
- [ ] Acknowledgement checkboxes verified
- [ ] Promotion event created with full metadata
- [ ] Vault updated atomically (all 9 languages)
- [ ] Session draft cleared after promotion
- [ ] Canonical audit invalidated (globalAudit, auditResult, transformedArticle set to null)
- [ ] Success toast shown
- [ ] Error toast shown on failure
- [ ] Modal closes after success
- [ ] Deploy remains locked after promotion
- [ ] TypeScript validation passes
- [ ] No backend persistence
- [ ] No deploy unlock
- [ ] No automatic re-audit

### Stop Condition
**STOP** if:
- TypeScript validation fails
- Deploy is unlocked
- Canonical audit is validated
- Backend persistence is added
- Automatic re-audit is triggered
- Session draft is preserved
- Partial vault updates occur
- Precondition re-check is skipped

---

## Task 7: Verification Script

### Objective
Create verification script to validate all promotion gate safety invariants, fail-closed conditions, and forbidden side effects.

### Files to Create
- `scripts/verify-session-draft-promotion-gate.ts`

### Files to Modify
- None (new file only)

### Allowed Changes
1. Implement verification checks:
   - **Check 1**: Precondition validation logic exists
   - **Check 2**: Promotion mutation helper exists
   - **Check 3**: Promotion modal component exists
   - **Check 4**: Promotion button renders correctly
   - **Check 5**: Post-promotion state transitions correct
   - **Check 6**: Deploy lock behavior correct (remains locked)
   - **Check 7**: Audit trail creation correct
   - **Check 8**: Snapshot identity verification correct
   - **Check 9**: No forbidden side effects occur
   - **Check 10**: All safety invariants preserved
2. Verify fail-closed conditions:
   - Stale audit blocks promotion
   - Missing audit blocks promotion
   - Failed audit blocks promotion
   - Snapshot mismatch blocks promotion
3. Verify no deploy unlock:
   - Deploy remains locked after promotion
   - Deploy lock reason updates correctly
4. Verify canonical audit invalidation:
   - globalAudit set to null
   - auditResult set to null
   - transformedArticle set to null
5. Verify no backend writes:
   - No fetch calls to /api/war-room/save
   - No axios calls
   - No database writes
6. Output verification report with pass/fail for each check

### Forbidden Changes
- Do NOT modify runtime files
- Do NOT add provider calls
- Do NOT weaken Panda validation
- Do NOT weaken Global Audit logic
- Do NOT weaken deploy gates
- Do NOT add backend persistence

### Validation Command
```bash
npx tsc --noEmit --skipLibCheck scripts/verify-session-draft-promotion-gate.ts
npx tsx scripts/verify-session-draft-promotion-gate.ts
```

### Completion Criteria
- [ ] Verification script created
- [ ] All 10 verification checks implemented
- [ ] Fail-closed conditions verified
- [ ] Deploy lock behavior verified
- [ ] Canonical audit invalidation verified
- [ ] No backend writes verified
- [ ] Script outputs pass/fail report
- [ ] TypeScript validation passes
- [ ] Script runs without errors
- [ ] All checks pass

### Stop Condition
**STOP** if:
- TypeScript validation fails
- Script execution fails
- Any verification check fails
- Runtime files are modified
- Provider calls are added
- Deploy gates are weakened

---

## Task 8: Pre-Commit Audit

### Objective
Validate all implementation work before commit. Ensure TypeScript passes, verification script passes, no provider calls, no Panda/Global Audit weakening, no deploy gate weakening.

### Files to Validate
- All files modified in Tasks 1-7

### Validation Steps
1. **TypeScript Validation**:
   ```bash
   npx tsc --noEmit --skipLibCheck
   ```
   - Must exit with code 0
   - No type errors allowed

2. **Promotion Verification Script**:
   ```bash
   npx tsx scripts/verify-session-draft-promotion-gate.ts
   ```
   - All checks must pass
   - No failures allowed

3. **Provider Call Audit**:
   ```bash
   grep -r "gemini\|openai\|anthropic" lib/editorial/promotion-*.ts
   ```
   - Must return no matches
   - No provider calls allowed

4. **Panda Validation Audit**:
   ```bash
   git diff lib/editorial/panda-intake-validator.ts
   ```
   - Must show no changes
   - Panda validation unchanged

5. **Global Audit Audit**:
   ```bash
   git diff lib/editorial/global-governance-audit.ts
   ```
   - Must show no changes
   - Global Audit logic unchanged

6. **Deploy Gate Audit**:
   ```bash
   git diff app/admin/warroom/page.tsx | grep -A5 -B5 "isDeployBlocked"
   ```
   - Deploy lock logic must remain fail-closed
   - Session draft must still block deploy
   - Promotion must not unlock deploy

7. **Unit Test Execution**:
   ```bash
   npm test lib/editorial/__tests__/promotion-*.test.ts
   ```
   - All tests must pass
   - No test failures allowed

### Completion Criteria
- [ ] TypeScript validation passes (exit code 0)
- [ ] Promotion verification script passes (all checks pass)
- [ ] No provider calls found
- [ ] Panda validation unchanged
- [ ] Global Audit logic unchanged
- [ ] Deploy gate logic unchanged (fail-closed preserved)
- [ ] All unit tests pass
- [ ] No test failures
- [ ] No runtime errors

### Stop Condition
**STOP** if:
- TypeScript validation fails
- Verification script fails
- Provider calls found
- Panda validation weakened
- Global Audit weakened
- Deploy gate weakened
- Unit tests fail

### Commit Approval Criteria
**ONLY PROCEED TO COMMIT IF**:
- All validation steps pass
- All completion criteria met
- No stop conditions triggered
- User explicitly approves commit

---

## Implementation Sequence Summary

```
Task 1: Precondition Contract Types (Pure Types)
   ↓
Task 2: Pure Precondition Validator (Pure Logic + Tests)
   ↓
Task 3: Pure Promotion Payload Builder (Pure Logic + Tests)
   ↓
Task 4: Promotion Modal UI Scaffold (Read-Only UI)
   ↓
Task 5: Disabled Promotion Button Integration (UI Wiring)
   ↓
Task 6: Promotion Execution Handler (Full Integration)
   ↓
Task 7: Verification Script (Safety Validation)
   ↓
Task 8: Pre-Commit Audit (Final Validation)
```

---

## Safety Invariants Checklist

After completing all tasks, verify these safety invariants:

### Promotion Gate Safety
- [ ] Promotion requires explicit operator action (not automatic)
- [ ] Passing session audit does NOT auto-promote
- [ ] Passing session audit does NOT unlock deploy
- [ ] Promotion does NOT overwrite canonical audit as valid
- [ ] Promotion invalidates canonical audit
- [ ] Deploy remains locked after promotion
- [ ] Promotion creates clear audit trail
- [ ] Promotion requires snapshot identity match
- [ ] Promotion fails closed on stale/missing/failed audit
- [ ] Promotion preserves rollback/audit context

### Forbidden Side Effects
- [ ] Deploy is NOT unlocked by promotion
- [ ] Canonical audit is NOT validated by promotion
- [ ] Session audit is NOT persisted to backend
- [ ] Canonical re-audit is NOT automatically triggered
- [ ] Session draft is NOT preserved after promotion
- [ ] Partial vault updates do NOT occur
- [ ] Backend mutations do NOT occur during promotion
- [ ] Ledger is NOT persisted to backend
- [ ] Snapshot overwrite does NOT occur
- [ ] Audit trail omission does NOT occur

### State Transitions
- [ ] Session draft → Canonical vault (atomic)
- [ ] Session draft exists → Session draft cleared
- [ ] Canonical audit valid → Canonical audit invalidated
- [ ] Deploy block reason updates correctly
- [ ] Session audit result cleared
- [ ] Session remediation ledger cleared
- [ ] Transform error preserved (if exists)
- [ ] Image URL preserved
- [ ] Active language preserved
- [ ] Promotion event created

---

## Estimated Implementation Effort

**Task 1**: 2 hours (type definitions)  
**Task 2**: 6 hours (pure logic + tests)  
**Task 3**: 6 hours (pure logic + tests)  
**Task 4**: 8 hours (UI component + tests)  
**Task 5**: 4 hours (button integration)  
**Task 6**: 8 hours (execution handler + integration)  
**Task 7**: 4 hours (verification script)  
**Task 8**: 2 hours (pre-commit audit)

**Total**: ~40 hours

---

## Risk Mitigation

### Risk 1: Snapshot Identity Mismatch
**Mitigation**: Comprehensive unit tests for snapshot identity computation and comparison

### Risk 2: Atomic Vault Update Failure
**Mitigation**: Single `setVault()` call with complete new vault object, no partial updates

### Risk 3: Operator Confusion
**Mitigation**: Clear UI warnings, acknowledgement checkboxes, post-promotion toast

### Risk 4: Canonical Vault Loss
**Mitigation**: Store canonical vault snapshot in promotion event metadata

### Risk 5: Promotion During Active Changes
**Mitigation**: Disable promotion button during remediation operations

---

## Final Checklist Before Deployment

Before deploying to production, verify:

- [ ] All 8 tasks completed
- [ ] All unit tests pass
- [ ] Verification script passes
- [ ] TypeScript validation passes
- [ ] No provider calls added
- [ ] Panda validation unchanged
- [ ] Global Audit logic unchanged
- [ ] Deploy gate logic unchanged
- [ ] All safety invariants verified
- [ ] All forbidden side effects prevented
- [ ] All state transitions correct
- [ ] Manual smoke tests completed
- [ ] User approval obtained

---

**TASKS_READY_FOR_INCREMENTAL_IMPLEMENTATION**
