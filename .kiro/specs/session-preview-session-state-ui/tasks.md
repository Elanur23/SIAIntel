# Session Preview / Session State UI — Implementation Tasks

## Phase Scope

This phase implements read-only UI visibility for session-scoped `localDraftCopy` state created by Phase 3C-3C-3B-2B controlled remediation. The goal is to surface session-only changes to operators while preserving all safety boundaries.

**What This Phase Includes**:
- Session state banner (alerts operator when session draft exists)
- Draft source switcher (toggle between canonical vault and session draft views)
- Session draft preview panel (read-only display of `localDraftCopy` body)
- Canonical vs session comparison view (side-by-side diff)
- Audit stale / deploy locked status chips
- Read-only session ledger summary (history of applied remediations)

**What This Phase Does NOT Include**:
- Save to vault functionality
- Backend/API routes or database writes
- Any persistence (localStorage, sessionStorage, cookies, IndexedDB)
- Deploy unlock mechanism
- Panda validation changes
- Automatic re-audit triggering
- Rollback UI execution (deferred to future phase)
- Editing session draft content
- Merging session changes back to vault

---

## Implementation Order

Tasks must be completed in the following order to maintain safety and incremental verification:

1. **State Exposure Audit** — Verify controller exposes necessary session state
2. **Read-Only Session View Model** — Create derived state helpers for UI consumption
3. **Session State Banner** — Implement persistent warning banner
4. **Draft Source Switcher** — Implement canonical vs session toggle
5. **Session Draft Preview Panel** — Implement read-only session body display
6. **Audit Stale / Deploy Locked UI** — Implement status chips
7. **Session Ledger Summary** — Implement read-only remediation history
8. **Canonical vs Session Comparison** — Implement side-by-side diff view
9. **Verification Script** — Create automated verification script
10. **Regression Validation** — Run full validation suite
11. **Commit / Push / Deploy / Cleanup Plan** — Document deployment strategy

---

## Tasks

### Task 1: State Exposure Audit

**Objective**: Verify that `useLocalDraftRemediationController` exposes all necessary session state for UI consumption.

**Required State**:
- `localDraftCopy: VaultArticle | null`
- `sessionRemediationLedger: RemediationLedgerEntry[]`
- `sessionAuditInvalidation: AuditInvalidationState | null`
- `activeDraft: VaultArticle` (canonical vault)

**Acceptance Criteria**:
- [ ] Controller returns `localDraftCopy` (may be null)
- [ ] Controller returns `sessionRemediationLedger` (may be empty array)
- [ ] Controller returns `sessionAuditInvalidation` (may be null)
- [ ] Controller returns `activeDraft` (canonical vault, never null)
- [ ] All state is read-only (no mutation methods exposed for session state)
- [ ] No new backend calls introduced
- [ ] No persistence logic added

**Files to Inspect**:
- `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`

**Verification**:
```bash
# Verify controller return shape
grep -A 20 "return {" app/admin/warroom/hooks/useLocalDraftRemediationController.ts
```

**Safety Assertions**:
- No vault mutation
- No backend writes
- No persistence
- Session state is read-only

---

### Task 2: Read-Only Session View Model

**Objective**: Create derived state helpers to simplify UI consumption of session state.

**Derived State Needed**:
- `hasSessionDraft: boolean` — True when `localDraftCopy !== null`
- `isAuditStale: boolean` — True when `sessionAuditInvalidation?.auditInvalidated === true`
- `isDeployBlocked: boolean` — True when `hasSessionDraft === true`
- `sessionRemediationCount: number` — Count of applied remediations
- `deployBlockReason: string | null` — Human-readable deploy lock reason

**Acceptance Criteria**:
- [ ] Derived state helpers are pure functions (no side effects)
- [ ] Helpers return correct values based on session state
- [ ] Helpers handle null/undefined gracefully
- [ ] No mutation of source state
- [ ] No backend calls
- [ ] No persistence

**Implementation Location**:
- Option A: Add helpers to `useLocalDraftRemediationController.ts`
- Option B: Create separate `lib/editorial/session-state-helpers.ts`

**Example Helpers**:
```typescript
function hasSessionDraft(localDraftCopy: VaultArticle | null): boolean {
  return localDraftCopy !== null;
}

function isAuditStale(sessionAuditInvalidation: AuditInvalidationState | null): boolean {
  return sessionAuditInvalidation?.auditInvalidated === true;
}

function getDeployBlockReason(hasSessionDraft: boolean, isAuditStale: boolean): string | null {
  if (hasSessionDraft) {
    return "Deploy blocked: local session draft exists; re-audit and Panda validation required.";
  }
  return null;
}
```

**Safety Assertions**:
- No state mutation
- No backend calls
- No persistence
- Pure functions only

---

### Task 3: Session State Banner

**Objective**: Implement persistent warning banner that appears when session draft exists.

**Component**: `app/admin/warroom/components/SessionStateBanner.tsx`

**Props**:
```typescript
interface SessionStateBannerProps {
  visible: boolean; // true when localDraftCopy !== null
}
```

**UI Requirements**:
- **Primary Text**: "Session Draft Active — Not Saved to Vault — Not Deployed"
- **Secondary Text**: "Session changes are volatile and may be lost on refresh. Full re-audit required before deploy."
- **Styling**: Warning/info color scheme (yellow/orange background), visible border, warning icon
- **Positioning**: Top of warroom page, above main content
- **Behavior**: Persistent (does not dismiss), only visible when `visible === true`

**Acceptance Criteria**:
- [ ] Banner appears only when `localDraftCopy !== null`
- [ ] Banner does not appear when `localDraftCopy === null`
- [ ] Banner uses exact required wording
- [ ] Banner has warning/info styling
- [ ] Banner is positioned at top of page
- [ ] Banner does not have dismiss button
- [ ] No backend calls
- [ ] No persistence
- [ ] No state mutation

**Integration**:
- Wire into `app/admin/warroom/page.tsx`
- Pass `visible={hasSessionDraft}` prop

**Safety Assertions**:
- No vault mutation
- No backend writes
- No persistence
- Display only

---

### Task 4: Draft Source Switcher

**Objective**: Implement toggle to switch between canonical vault view and session draft view.

**Component**: `app/admin/warroom/components/DraftSourceSwitcher.tsx` (optional, may be inline)

**Props**:
```typescript
interface DraftSourceSwitcherProps {
  currentView: 'canonical' | 'session';
  onViewChange: (view: 'canonical' | 'session') => void;
  sessionDraftAvailable: boolean; // true when localDraftCopy !== null
}
```

**UI Requirements**:
- **Pattern**: Radio buttons or segmented control
- **Options**:
  - "Canonical Vault (Authoritative)" — always available
  - "Session Draft (Session Only — Read-only)" — only available when `sessionDraftAvailable === true`
- **Default**: "Canonical Vault"
- **Behavior**: Switching only changes which content is rendered; no state mutation

**Acceptance Criteria**:
- [ ] Canonical Vault option is always available
- [ ] Session Draft option is disabled/hidden when `localDraftCopy === null`
- [ ] Session Draft option is enabled when `localDraftCopy !== null`
- [ ] Canonical Vault is selected by default
- [ ] Switching does NOT mutate any state
- [ ] Switching only changes view mode
- [ ] No backend calls
- [ ] No persistence

**Integration**:
- Wire into `app/admin/warroom/page.tsx`
- Manage view state with `useState<'canonical' | 'session'>('canonical')`

**Safety Assertions**:
- No vault mutation
- No backend writes
- No persistence
- View toggle only

---

### Task 5: Session Draft Preview Panel

**Objective**: Implement read-only display of `localDraftCopy` body content.

**Component**: `app/admin/warroom/components/SessionDraftPreviewPanel.tsx`

**Props**:
```typescript
interface SessionDraftPreviewPanelProps {
  localDraftCopy: VaultArticle | null;
  currentLanguage: string;
  visible: boolean; // true when view mode is 'session'
}
```

**UI Requirements**:
- **Header**: "SESSION DRAFT — Session Only — Not Saved to Vault"
- **Content**: Display `localDraftCopy.body[currentLanguage]` (read-only)
- **Styling**: Distinct visual treatment (different background or border), "SESSION DRAFT" badge prominently displayed
- **Metadata**: Language indicator, "Session Only" warning, "Not Saved to Vault" warning, "Not Deployed" warning
- **Behavior**: Read-only (no editing controls, no save/publish/commit buttons)

**Acceptance Criteria**:
- [ ] Panel renders only when `visible === true`
- [ ] Panel displays `localDraftCopy.body[currentLanguage]`
- [ ] Panel is read-only (no text input, no editing controls)
- [ ] Panel uses exact required wording
- [ ] Panel has distinct visual styling
- [ ] Panel includes all required warnings
- [ ] No save/publish/commit buttons
- [ ] No backend calls
- [ ] No persistence
- [ ] No state mutation

**Integration**:
- Wire into `app/admin/warroom/page.tsx`
- Conditionally render based on view mode

**Safety Assertions**:
- No vault mutation
- No backend writes
- No persistence
- Display only, no editing

---

### Task 6: Audit Stale / Deploy Locked UI

**Objective**: Implement status chips to surface audit invalidation and deploy lock status.

**Components**: May be inline chips or separate component

**Chips Required**:

1. **Audit Stale Chip**
   - Text: "Audit Invalidated"
   - Color: Red/warning
   - Tooltip: "Audit invalidated by session changes. Full re-audit required."
   - Visible when: `sessionAuditInvalidation?.auditInvalidated === true`

2. **Deploy Locked Chip**
   - Text: "Deploy Blocked"
   - Color: Red/error
   - Tooltip: "Deploy blocked: local session draft exists; re-audit and Panda validation required."
   - Visible when: `localDraftCopy !== null`

3. **Re-Audit Required Chip**
   - Text: "Re-Audit Required"
   - Color: Orange/warning
   - Tooltip: "Full protocol re-audit required before deploy."
   - Visible when: `sessionAuditInvalidation?.reAuditRequired === true`

**Acceptance Criteria**:
- [ ] Audit Stale chip appears only when audit is invalidated
- [ ] Deploy Locked chip appears only when session draft exists
- [ ] Re-Audit Required chip appears only when re-audit is required
- [ ] All chips use exact required wording
- [ ] All chips have correct tooltips
- [ ] Chips have appropriate color coding
- [ ] No backend calls
- [ ] No persistence
- [ ] No state mutation

**Integration**:
- Wire into `app/admin/warroom/page.tsx`
- Position near deploy button or in status bar

**Safety Assertions**:
- No vault mutation
- No backend writes
- No persistence
- Display only

---

### Task 7: Session Ledger Summary

**Objective**: Implement read-only display of session remediation history.

**Component**: `app/admin/warroom/components/SessionLedgerSummary.tsx`

**Props**:
```typescript
interface SessionLedgerSummaryProps {
  sessionRemediationLedger: RemediationLedgerEntry[];
  visible: boolean; // may be collapsible or modal
}
```

**UI Requirements**:
- **Header**: "Session Remediation History (Session Only — Not Saved)"
- **Count**: "X remediations applied in this session"
- **List**: Display each remediation entry with:
  - Suggestion ID
  - Category (FORMAT_REPAIR)
  - Field (body)
  - Language
  - Applied timestamp
  - Original text snippet (optional)
  - Applied text snippet (optional)
- **Behavior**: Read-only display, no rollback button, no mutation capability
- **Styling**: Chronological order (most recent first), expandable/collapsible entries

**Acceptance Criteria**:
- [ ] Ledger displays all entries from `sessionRemediationLedger`
- [ ] Ledger is read-only (no rollback button, no mutation)
- [ ] Ledger uses exact required wording
- [ ] Ledger includes "Session Only — Not Saved" labeling
- [ ] Ledger displays entries in chronological order
- [ ] No backend calls
- [ ] No persistence
- [ ] No state mutation

**Integration**:
- Wire into `app/admin/warroom/page.tsx`
- May be collapsible panel or modal

**Safety Assertions**:
- No vault mutation
- No backend writes
- No persistence
- Display only, no rollback execution

---

### Task 8: Canonical vs Session Comparison

**Objective**: Implement side-by-side comparison of canonical vault and session draft.

**Component**: `app/admin/warroom/components/SessionDraftComparison.tsx`

**Props**:
```typescript
interface SessionDraftComparisonProps {
  canonicalVault: VaultArticle;
  localDraftCopy: VaultArticle | null;
  currentLanguage: string;
  visible: boolean; // may be optional view mode
}
```

**UI Requirements**:
- **Layout**: Side-by-side diff view
- **Left Side**: "Canonical Vault (Authoritative)" — display `canonicalVault.body[currentLanguage]`
- **Right Side**: "Session Draft (Session Only — Read-only)" — display `localDraftCopy.body[currentLanguage]`
- **Features**: Highlight changed sections, clear labels on each side
- **Behavior**: Both sides read-only, no save/merge/apply buttons

**Acceptance Criteria**:
- [ ] Comparison renders only when `visible === true` and `localDraftCopy !== null`
- [ ] Left side displays canonical vault body
- [ ] Right side displays session draft body
- [ ] Both sides are read-only (no editing controls)
- [ ] Changed sections are highlighted
- [ ] Both sides use exact required labeling
- [ ] No save/merge/apply buttons
- [ ] No backend calls
- [ ] No persistence
- [ ] No state mutation

**Integration**:
- Wire into `app/admin/warroom/page.tsx`
- May be separate tab or optional view mode

**Safety Assertions**:
- No vault mutation
- No backend writes
- No persistence
- Display only, no editing or merging

---

### Task 9: Verification Script

**Objective**: Create automated verification script to assert session UI rendering preserves all safety boundaries.

**Script**: `scripts/verify-phase3c3c3b3-session-ui-rendering.ts`

**Assertions Required**:

1. **Session Banner Visibility**
   - Banner appears only when `localDraftCopy !== null`
   - Banner does not appear when `localDraftCopy === null`

2. **Canonical View Default**
   - Main editor displays canonical vault by default
   - Session draft is not displayed by default

3. **Session Draft Opt-In**
   - Session draft renders only when explicitly selected
   - Session draft option is disabled when `localDraftCopy === null`

4. **Session Draft Read-Only**
   - Session draft view has no editing controls
   - Session draft view has no save/publish/commit buttons
   - Session draft view has no text input capability

5. **Deploy Lock Preservation**
   - Deploy remains locked when `localDraftCopy !== null`
   - Deploy lock reason includes "local session draft" and "re-audit required"

6. **No Backend Writes**
   - No fetch calls to backend routes
   - No API calls to save session state
   - No database writes

7. **No Persistence**
   - No localStorage usage
   - No sessionStorage usage
   - No cookie usage
   - No IndexedDB usage

8. **Canonical Vault Integrity**
   - Canonical vault remains byte-identical after UI toggles
   - Switching to session draft does NOT mutate vault
   - Switching back to canonical does NOT mutate vault

9. **Panda Validation Unchanged**
   - Panda validation logic is unchanged
   - No weakening of Panda gates
   - Session UI does NOT bypass Panda

10. **No Rollback UI**
    - No rollback button in session ledger
    - No rollback execution capability
    - Session ledger is read-only display only

11. **Session Labeling**
    - All session content includes "Session Only" label
    - All session content includes "Not Saved to Vault" warning
    - All session content includes "Not Deployed" warning

**Acceptance Criteria**:
- [ ] Script verifies all 11 assertion categories
- [ ] Script exits with code 0 on success
- [ ] Script exits with non-zero code on failure
- [ ] Script outputs clear pass/fail messages
- [ ] Script can be run in CI/CD pipeline

**Implementation**:
- Use static analysis (grep, AST parsing) where possible
- Use runtime checks for dynamic behavior
- Document manual smoke test steps for assertions that cannot be automated

**Safety Assertions**:
- Script itself does NOT mutate any state
- Script is read-only verification only

---

### Task 10: Regression Validation

**Objective**: Run full validation suite to ensure no regressions in existing functionality.

**Validation Commands**:
```bash
# Run existing test suites
npm run test

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run existing verification scripts
node scripts/phase3c-missing-provenance-probe-corrected.ts
node scripts/phase3d-payload-mutation-probe.ts
node scripts/phase3e-token-replay-probe.ts
node scripts/phase3f-delivery-verification-probe.ts

# Run new session UI verification script
npx tsx scripts/verify-phase3c3c3b3-session-ui-rendering.ts
```

**Acceptance Criteria**:
- [ ] All existing tests pass
- [ ] No type errors
- [ ] No linting errors
- [ ] All existing verification scripts pass
- [ ] New session UI verification script passes
- [ ] No regressions in Phase 3C-3C-3B-2B functionality
- [ ] No regressions in Panda validation
- [ ] No regressions in deploy lock logic

**Safety Assertions**:
- No existing functionality broken
- All safety boundaries preserved
- No new vulnerabilities introduced

---

### Task 11: Commit / Push / Deploy / Cleanup Plan

**Objective**: Document deployment strategy and cleanup plan.

**Commit Message Template**:
```
feat(warroom): Session Preview / Session State UI

Implements read-only UI visibility for session-scoped localDraftCopy state.

Components:
- SessionStateBanner: Persistent warning when session draft exists
- DraftSourceSwitcher: Toggle between canonical and session views
- SessionDraftPreviewPanel: Read-only session body display
- SessionDraftComparison: Side-by-side canonical vs session diff
- Audit stale / deploy locked status chips
- Session ledger summary (read-only remediation history)

Safety boundaries preserved:
- No vault mutation
- No backend writes
- No persistence (session-only, volatile)
- No deploy unlock
- No Panda bypass
- No automatic re-audit
- No rollback execution UI (deferred)

Verification:
- scripts/verify-phase3c3c3b3-session-ui-rendering.ts passes
- All existing tests pass
- No regressions in Phase 3C-3C-3B-2B functionality

Phase: Session Preview / Session State UI
Previous: Phase 3C-3C-3B-2B (CLOSED / PASS)
```

**Deployment Steps**:
1. Run full validation suite (Task 10)
2. Commit changes with message above
3. Push to origin/main
4. Verify Vercel deployment succeeds
5. Run production smoke tests:
   - Navigate to `/admin/warroom`
   - Apply eligible FORMAT_REPAIR suggestion
   - Verify session banner appears
   - Verify canonical view remains default
   - Switch to session draft view
   - Verify session draft is read-only
   - Verify deploy remains locked
   - Verify all session labeling is correct
6. Create deployment verification report

**Cleanup Steps**:
1. Restore tracked local artifacts (`.idea/planningMode.xml`, `tsconfig.tsbuildinfo`)
2. Preserve untracked files (`.kiro/`, phase reports, verification scripts)
3. Verify no tracked modified files remain
4. Create cleanup completion report

**Acceptance Criteria**:
- [ ] Commit message follows template
- [ ] Push to origin/main succeeds
- [ ] Vercel deployment succeeds
- [ ] Production smoke tests pass
- [ ] Deployment verification report created
- [ ] Cleanup completion report created
- [ ] No tracked modified files remain

---

## Per-Task Acceptance Criteria Summary

Each task must satisfy:
- ✅ Implements only what is specified in the task
- ✅ No vault mutation
- ✅ No backend/API writes
- ✅ No persistence (localStorage, sessionStorage, cookies, IndexedDB)
- ✅ No deploy unlock mechanism
- ✅ No Panda validation changes
- ✅ No automatic re-audit triggering
- ✅ No rollback execution UI
- ✅ Session content is read-only
- ✅ Session content is clearly labeled "Session Only — Not Saved to Vault — Not Deployed"
- ✅ Canonical vault remains authoritative and unchanged
- ✅ All existing tests pass
- ✅ No regressions introduced

---

## Safety Assertions (All Tasks)

### Vault Integrity
- Canonical vault is NEVER mutated by session UI
- `activeDraft` remains byte-identical before and after UI interactions
- Session UI does NOT trigger vault updates

### Backend Isolation
- No fetch calls to backend routes
- No API calls to save session state
- No database writes
- No network requests related to session state

### Persistence Prohibition
- No localStorage usage
- No sessionStorage usage
- No cookie usage
- No IndexedDB usage
- Session state is volatile and lost on page refresh

### Deploy Lock Preservation
- Deploy remains locked when `localDraftCopy !== null`
- No deploy unlock mechanism introduced
- Deploy lock reason is explicit and accurate

### Panda Validation Unchanged
- Panda validation logic is unchanged
- No weakening of Panda gates
- Session UI does NOT bypass Panda

### Audit Invalidation Visibility
- Audit stale state is surfaced to operator
- Re-audit requirement is clear
- No automatic re-audit triggering

### Session Labeling Mandatory
- ALL session content includes "Session Only" label
- ALL session content includes "Not Saved to Vault" warning
- ALL session content includes "Not Deployed" warning
- No ambiguous or unsafe wording

### Read-Only Enforcement
- Session draft view has no editing controls
- Session draft view has no save/publish/commit buttons
- Session draft view has no text input capability
- Session ledger has no rollback button
- Comparison view has no merge/apply buttons

---

## Files Expected Later (Not Created in This Phase)

The following files will be created during implementation:

### New Components
- `app/admin/warroom/components/SessionStateBanner.tsx`
- `app/admin/warroom/components/SessionDraftPreviewPanel.tsx`
- `app/admin/warroom/components/SessionDraftComparison.tsx`
- `app/admin/warroom/components/DraftSourceSwitcher.tsx` (optional)
- `app/admin/warroom/components/SessionLedgerSummary.tsx` (optional)

### Modified Files
- `app/admin/warroom/page.tsx` (wire session UI components)
- `app/admin/warroom/hooks/useLocalDraftRemediationController.ts` (expose session state, add derived helpers)
- `app/admin/warroom/components/RemediationConfirmModal.tsx` (may need session state integration)
- `app/admin/warroom/components/RemediationPreviewPanel.tsx` (may need draft source switcher integration)

### Type Definitions
- `lib/editorial/remediation-apply-types.ts` (may need additional UI state types)
- `lib/editorial/session-state-helpers.ts` (optional, if helpers are extracted)

### Verification
- `scripts/verify-phase3c3c3b3-session-ui-rendering.ts`

### Reports
- `SESSION-PREVIEW-SESSION-STATE-UI-IMPLEMENTATION-COMPLETE.md`
- `SESSION-PREVIEW-SESSION-STATE-UI-DEPLOYMENT-VERIFIED.md`
- `SESSION-PREVIEW-SESSION-STATE-UI-CLEANUP-COMPLETE.md`

---

## Explicitly Out of Scope

The following are explicitly NOT included in this phase:

❌ Save to Vault functionality  
❌ Backend/API routes for session state  
❌ Database persistence  
❌ localStorage/sessionStorage/cookie/IndexedDB persistence  
❌ Deploy unlock mechanism  
❌ Panda validation changes  
❌ Automatic re-audit triggering  
❌ Rollback UI execution (deferred to future phase)  
❌ Editing session draft content  
❌ Merging session changes back to vault  
❌ Publishing session draft directly  
❌ Multi-user session synchronization  
❌ Session state persistence across page refresh  
❌ Beforeunload warning (deferred to future phase)  

---

## Validation Commands Placeholder

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Unit tests
npm run test

# Existing verification scripts
node scripts/phase3c-missing-provenance-probe-corrected.ts
node scripts/phase3d-payload-mutation-probe.ts
node scripts/phase3e-token-replay-probe.ts
node scripts/phase3f-delivery-verification-probe.ts

# New session UI verification script
npx tsx scripts/verify-phase3c3c3b3-session-ui-rendering.ts

# Manual smoke test
# 1. Navigate to /admin/warroom
# 2. Apply eligible FORMAT_REPAIR suggestion
# 3. Verify session banner appears
# 4. Verify canonical view remains default
# 5. Switch to session draft view
# 6. Verify session draft is read-only
# 7. Verify deploy remains locked
# 8. Verify all session labeling is correct
# 9. Refresh page and verify session state is lost
```

---

## Task Verdict

**READY_FOR_IMPLEMENTATION_PROMPT**

This task document provides:
✅ Clear implementation order (11 sequential tasks)  
✅ Detailed acceptance criteria for each task  
✅ Safety assertions for all tasks  
✅ File impact map  
✅ Validation strategy  
✅ Deployment and cleanup plan  
✅ Explicit scope boundaries  

**Next Step**: Begin implementation starting with Task 1 (State Exposure Audit).

**Implementation Reminder**: Do NOT implement all tasks at once. Implement incrementally, verify after each task, and maintain safety boundaries throughout.
