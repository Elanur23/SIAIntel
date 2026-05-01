# Session Preview / Session State UI — Design

## 1. Phase Status

- **Previous Phase**: Phase 3C-3C-3B-2B — CLOSED / PASS
- **Current Phase**: Session Preview / Session State UI — Design
- **Implementation Status**: NOT STARTED

---

## 2. Problem Statement

After Phase 3C-3C-3B-2B, the controlled remediation system can successfully apply FORMAT_REPAIR suggestions to a session-scoped `localDraftCopy` via the real local apply button. However, this creates a **dark state problem**:

- `localDraftCopy` exists in browser memory after a successful apply
- The operator cannot see, inspect, or distinguish it from canonical vault content
- The main editor continues to display the canonical vault body
- There is no visual indication that session-only changes exist
- The operator cannot compare canonical vs session state
- The audit invalidation state is not surfaced
- The deploy lock reason is not visible
- The session remediation ledger is not accessible

This creates **operator confusion** and **safety risks**:
- Operators may not realize session changes exist
- Operators may not understand why deploy is locked
- Operators may not know that session changes are volatile
- Operators may not understand that a full re-audit is required
- Operators cannot verify what changes were applied

The system needs **read-only visibility** into session state without weakening any safety boundaries.

---

## 3. Design Goals

1. **Make session-only changes visible** — Operators must be able to see when `localDraftCopy` exists and inspect its contents
2. **Preserve canonical vault authority** — Canonical vault remains the default view and authoritative source
3. **Prevent operator confusion** — Clear labeling distinguishes session state from canonical state
4. **Expose audit stale state** — Surface that audit is invalidated and re-audit is required
5. **Keep deploy locked** — Make it clear why deploy is blocked (session draft exists, re-audit required)
6. **Provide read-only inspection** — Allow operators to view session changes without editing capability
7. **Prepare validation surface** — Create UI contracts that can be verified programmatically

---

## 4. Non-Goals

This phase explicitly does NOT include:

- ❌ Runtime implementation (design only)
- ❌ Component creation (design only)
- ❌ Hook changes (design only)
- ❌ Save to Vault functionality
- ❌ Backend/API routes
- ❌ Database persistence
- ❌ localStorage/sessionStorage/cookie/IndexedDB persistence
- ❌ Deploy unlock mechanism
- ❌ Panda validation changes
- ❌ Automatic re-audit triggering
- ❌ Rollback UI execution (deferred to future phase)
- ❌ Publishing session draft directly
- ❌ Multi-user session synchronization
- ❌ Session state persistence across page refresh
- ❌ Editing session draft content
- ❌ Merging session changes back to vault

---

## 5. Current State Model

### Canonical Vault State
- **Source**: `activeDraft` from workspace manager
- **Authority**: Authoritative source of truth
- **Persistence**: Backed by Firestore vault
- **Audit**: May have valid global audit
- **Deploy**: May be deployable if audit passes and Panda validates

### Session-Only State (After Phase 3C-3C-3B-2B)
- **`localDraftCopy`**: Session-scoped clone of canonical vault with applied remediation changes
  - Created by `cloneLocalDraftForRemediation(vault)`
  - Modified by `applyRemediationToLocalDraft()`
  - Exists only in browser memory (React state)
  - Lost on page refresh
  - Not persisted to any storage
  
- **`sessionRemediationLedger`**: Array of `RemediationLedgerEntry[]`
  - Tracks what remediations were applied
  - Each entry contains `appliedEvent` and `snapshot`
  - Used for future rollback capability
  - Session-scoped only
  
- **`sessionAuditInvalidation`**: `AuditInvalidationState`
  - `auditInvalidated: true` — Global audit is now stale
  - `reAuditRequired: true` — Full re-audit required before deploy
  - `invalidationReason: REMEDIATION_APPLIED`
  - `invalidatedAt: ISO timestamp`

### Deploy Blocked State
- Deploy remains locked when `localDraftCopy` exists
- Deploy lock reason: "Local session draft exists — full protocol re-audit required"
- No deploy unlock mechanism in this phase

### Audit Stale State
- Global audit is invalidated when session changes are applied
- Audit stale indicator must be visible
- Re-audit is required before deploy can be considered

---

## 6. Proposed UX Architecture

### 6.1 Session State Banner

**Purpose**: Alert operator that session-only changes exist

**Visibility**: 
- Appears only when `localDraftCopy !== null`
- Positioned at top of warroom page (above main content)
- Persistent (does not dismiss)
- High visual prominence (warning/info styling)

**Content**:
```
⚠️ Session Draft Active — Not Saved to Vault — Not Deployed

Session changes are volatile and may be lost on refresh.
Full re-audit required before deploy.
```

**Styling**:
- Warning/info color scheme (yellow/orange background)
- Icon: Warning or info icon
- Font: Bold primary text, regular secondary text
- Border: Visible border to separate from content

---

### 6.2 Draft Source Switcher

**Purpose**: Allow operator to toggle between canonical vault view and session draft view

**Location**: Near main editor area (above or beside editor)

**States**:
- **Canonical Vault** (default, always available)
- **Session Draft** (only available when `localDraftCopy !== null`)

**Behavior**:
- Canonical Vault is selected by default
- Session Draft option is disabled/hidden when `localDraftCopy === null`
- Switching does NOT mutate any state
- Switching only changes which content is rendered in the preview area

**UI Pattern**: Radio buttons or segmented control
```
○ Canonical Vault (Authoritative)
○ Session Draft (Session Only — Read-only)
```

---

### 6.3 Session Draft Preview Panel

**Purpose**: Display `localDraftCopy` body content when Session Draft view is active

**Visibility**:
- Only renders when Draft Source Switcher is set to "Session Draft"
- Hidden when "Canonical Vault" is selected

**Content**:
- Displays `localDraftCopy.body` for the current language
- Read-only (no editing controls)
- Clearly labeled: "SESSION DRAFT — Session Only — Not Saved to Vault"

**Styling**:
- Distinct visual treatment (different background color or border)
- "SESSION DRAFT" badge/chip prominently displayed
- No save/publish/commit buttons
- No text editing capability

**Metadata Display**:
- Language indicator
- "Session Only" warning
- "Not Saved to Vault" warning
- "Not Deployed" warning

---

### 6.4 Canonical vs Session Comparison View

**Purpose**: Allow side-by-side comparison of canonical vault and session draft

**Visibility**:
- Optional view mode (toggle or separate tab)
- Only available when `localDraftCopy !== null`

**Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Canonical Vault (Authoritative)  │  Session Draft      │
│                                    │  (Session Only —    │
│                                    │   Read-only)        │
├────────────────────────────────────┼─────────────────────┤
│  [canonical body content]          │  [session body]     │
│                                    │                     │
└────────────────────────────────────┴─────────────────────┘
```

**Features**:
- Side-by-side diff view
- Highlight changed sections
- Clear labels on each side
- Read-only (no editing)
- No save/publish/commit wording

**Safety**:
- Both sides are read-only
- No merge/apply/save buttons
- No confusion about which is authoritative

---

### 6.5 Audit Stale / Deploy Locked Chips

**Purpose**: Surface audit invalidation and deploy lock status

**Location**: Near deploy button or in status bar

**Chips**:

1. **Audit Stale Chip**
   - Text: "Audit Invalidated"
   - Color: Red/warning
   - Tooltip: "Audit invalidated by session changes. Full re-audit required."
   - Visible when: `sessionAuditInvalidation.auditInvalidated === true`

2. **Deploy Locked Chip**
   - Text: "Deploy Blocked"
   - Color: Red/error
   - Tooltip: "Deploy blocked: local session draft exists; re-audit and Panda validation required."
   - Visible when: `localDraftCopy !== null`

3. **Re-Audit Required Chip**
   - Text: "Re-Audit Required"
   - Color: Orange/warning
   - Tooltip: "Full protocol re-audit required before deploy."
   - Visible when: `sessionAuditInvalidation.reAuditRequired === true`

---

### 6.6 Read-only Session Ledger Summary

**Purpose**: Display what remediations were applied in this session

**Location**: Collapsible panel or modal

**Content**:
- Count: "X remediations applied in this session"
- List of applied remediations:
  - Suggestion ID
  - Category (FORMAT_REPAIR)
  - Field (body)
  - Language
  - Applied timestamp
  - Original text snippet
  - Applied text snippet

**Behavior**:
- Read-only display
- No rollback button (deferred to future phase)
- No selective rollback
- No mutation capability

**Styling**:
- Clear "Session Only" labeling
- Chronological order (most recent first)
- Expandable/collapsible entries

---

## 7. UI Copy Requirements

### Safe Wording (MUST USE)

**Banner Primary**:
```
Session Draft Active — Not Saved to Vault — Not Deployed
```

**Banner Secondary**:
```
Session changes are volatile and may be lost on refresh.
Full re-audit required before deploy.
```

**Draft Source Switcher**:
```
○ Canonical Vault (Authoritative)
○ Session Draft (Session Only — Read-only)
```

**Session Draft Panel Header**:
```
SESSION DRAFT — Session Only — Not Saved to Vault
```

**Comparison View Labels**:
```
Canonical Vault (Authoritative)
Session Draft (Session Only — Read-only)
```

**Audit Stale Tooltip**:
```
Audit invalidated by session changes. Full re-audit required.
```

**Deploy Locked Tooltip**:
```
Deploy blocked: local session draft exists; re-audit and Panda validation required.
```

**Session Ledger Header**:
```
Session Remediation History (Session Only — Not Saved)
```

---

### Unsafe Wording (MUST AVOID)

❌ "Saved"  
❌ "Ready"  
❌ "Published"  
❌ "Approved"  
❌ "Final"  
❌ "Commit"  
❌ "Save to Vault"  
❌ "Deploy Unlock"  
❌ "Apply to Vault"  
❌ "Merge"  
❌ "Publish Session Draft"  
❌ "Make Permanent"  

---

## 8. State Flow

```
Remediation Suggestion
         ↓
Confirmation Modal
         ↓
Real Local Apply (Phase 3C-3C-3B-2B)
         ↓
localDraftCopy Updated (session-scoped)
         ↓
sessionRemediationLedger Updated
         ↓
sessionAuditInvalidation Set (auditInvalidated: true, reAuditRequired: true)
         ↓
Session Banner Visible
         ↓
Session Draft Can Be Inspected (opt-in, read-only)
         ↓
Deploy Remains Locked
         ↓
Re-Audit Required Before Deploy
```

---

## 9. Rendering Rules

### Rule 1: Canonical View is Default
- Main editor ALWAYS displays canonical vault by default
- Session Draft view is opt-in only
- Switching to Session Draft requires explicit operator action

### Rule 2: Session Draft View is Opt-In
- Session Draft option is only available when `localDraftCopy !== null`
- Operator must explicitly select "Session Draft" to view it
- Switching back to "Canonical Vault" is always available

### Rule 3: Session Draft View is Read-Only
- No editing controls in Session Draft view
- No save/publish/commit buttons
- No text input capability
- Display only

### Rule 4: Comparison View is Read-Only
- Both sides of comparison are read-only
- No merge/apply/save buttons
- No editing capability

### Rule 5: Body Field Visual Marking
- If session draft body differs from canonical body, mark it visually
- Use diff highlighting or change indicators
- Make it obvious which sections changed

### Rule 6: No Silent Replacement
- Session draft content NEVER replaces canonical content silently
- All session content must be clearly labeled
- Operator must always know which view they are seeing

---

## 10. Safety Boundaries

### Boundary 1: No Vault Mutation
- Session UI does NOT mutate canonical vault
- `localDraftCopy` changes do NOT propagate to vault
- Vault remains authoritative and unchanged

### Boundary 2: No Backend/API Write
- No API calls to save session state
- No database writes
- No backend mutation of any kind

### Boundary 3: No Persistence
- No localStorage usage
- No sessionStorage usage
- No cookie usage
- No IndexedDB usage
- Session state is volatile and lost on refresh

### Boundary 4: No Deploy Unlock
- Deploy remains locked when `localDraftCopy` exists
- No mechanism to unlock deploy with session changes
- Re-audit and vault update required before deploy

### Boundary 5: No Panda Bypass
- Panda validation logic unchanged
- No weakening of Panda gates
- Session changes do NOT bypass Panda

### Boundary 6: No Automatic Re-Audit
- No automatic re-audit triggering
- Re-audit must be manual and explicit
- Session UI does NOT trigger re-audit

### Boundary 7: No Rollback Execution UI
- Rollback UI is deferred to future phase
- No rollback button in this phase
- Session ledger is read-only display only

### Boundary 8: Session-Only Labeling Mandatory
- ALL session content must be labeled "Session Only"
- ALL session content must include "Not Saved to Vault"
- ALL session content must include "Not Deployed"
- No ambiguity allowed

---

## 11. Future File Impact Map

The following files will be modified or created in the future implementation phase:

### Modified Files
- `app/admin/warroom/page.tsx`
  - Add session state banner
  - Add draft source switcher
  - Wire session state to UI components
  
- `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`
  - Expose session state for UI consumption
  - Add derived state helpers if needed
  
- `app/admin/warroom/components/RemediationConfirmModal.tsx`
  - May need to surface session state after apply
  
- `app/admin/warroom/components/RemediationPreviewPanel.tsx`
  - May need to integrate with draft source switcher

### New Files
- `app/admin/warroom/components/SessionStateBanner.tsx`
  - Session state alert banner component
  
- `app/admin/warroom/components/SessionDraftPreviewPanel.tsx`
  - Session draft body display component
  
- `app/admin/warroom/components/SessionDraftComparison.tsx`
  - Side-by-side comparison component
  
- `app/admin/warroom/components/DraftSourceSwitcher.tsx` (optional)
  - Canonical vs Session toggle component
  
- `app/admin/warroom/components/SessionLedgerSummary.tsx` (optional)
  - Session remediation history display

### Type Definitions
- `lib/editorial/remediation-apply-types.ts`
  - May need additional types for UI state

### Verification
- `scripts/verify-phase3c3c3b3-session-ui-rendering.ts`
  - Verification script for session UI rendering

**Note**: These files are NOT created in this design phase. They are listed for planning purposes only.

---

## 12. Validation Strategy for Later Implementation

### Verification Script
**File**: `scripts/verify-phase3c3c3b3-session-ui-rendering.ts`

**Purpose**: Verify that session UI rendering preserves all safety boundaries

**Assertions** (to be implemented later):

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

---

## 13. Manual Smoke Plan for Later

### Smoke Test Procedure (to be executed after implementation):

1. **Setup**
   - Navigate to `/admin/warroom`
   - Verify canonical vault is displayed
   - Verify no session banner is visible

2. **Apply Eligible Suggestion**
   - Select a FORMAT_REPAIR suggestion
   - Complete confirmation modal
   - Click "Apply to Local Draft Copy"
   - Wait for success

3. **Verify Banner Appears**
   - Session state banner should appear
   - Banner text: "Session Draft Active — Not Saved to Vault — Not Deployed"
   - Banner warning: "Session changes are volatile..."

4. **Verify Canonical View Remains Default**
   - Main editor should still display canonical vault body
   - Session draft should NOT be displayed automatically

5. **Switch to Session Draft**
   - Locate draft source switcher
   - Select "Session Draft"
   - Verify session draft body is displayed
   - Verify "SESSION DRAFT" label is visible
   - Verify "Session Only — Not Saved to Vault" warning is visible

6. **Verify Body Change Visible**
   - Compare session draft body to canonical body
   - Verify applied remediation is visible in session draft
   - Verify canonical body is unchanged

7. **Verify Canonical Body Unchanged**
   - Switch back to "Canonical Vault"
   - Verify canonical body does NOT include session changes
   - Verify canonical body is byte-identical to before

8. **Open Comparison View**
   - Activate comparison view (if implemented)
   - Verify canonical vault is labeled "Canonical Vault (Authoritative)"
   - Verify session draft is labeled "Session Draft (Session Only — Read-only)"
   - Verify both sides are read-only
   - Verify no save/merge/apply buttons

9. **Verify Labels Are Clear**
   - All session content includes "Session Only"
   - All session content includes "Not Saved to Vault"
   - All session content includes "Not Deployed"
   - No ambiguous wording

10. **Verify Deploy Remains Locked**
    - Locate deploy button or deploy status
    - Verify deploy is locked/disabled
    - Verify deploy lock reason includes "local session draft" and "re-audit required"

11. **Refresh Page**
    - Refresh browser page
    - Verify session state is lost (expected behavior)
    - Verify canonical vault is still displayed
    - Verify no session banner appears
    - Confirm operator understands session volatility

---

## 14. Risks and Mitigations

### Risk 1: Operator Confusion
**Risk**: Operators may not understand the difference between canonical vault and session draft

**Mitigation**:
- Clear, consistent labeling on all session content
- "Session Only — Not Saved to Vault — Not Deployed" on every session view
- Canonical vault is always labeled "Authoritative"
- Session draft is always labeled "Read-only"

---

### Risk 2: Accidental Canonical Overwrite
**Risk**: Operators may think session changes are saved to vault

**Mitigation**:
- Session draft is read-only (no editing)
- No save/publish/commit buttons in session views
- Persistent warning banner
- Clear "Not Saved to Vault" labeling
- Verification script asserts vault integrity

---

### Risk 3: Stale Audit Misunderstanding
**Risk**: Operators may not understand why audit is invalidated

**Mitigation**:
- Audit stale chip with clear tooltip
- Tooltip explains: "Audit invalidated by session changes. Full re-audit required."
- Banner includes "Full re-audit required before deploy"
- Deploy lock reason includes re-audit requirement

---

### Risk 4: Deploy Unlock Misunderstanding
**Risk**: Operators may expect deploy to unlock after viewing session changes

**Mitigation**:
- Deploy remains locked when session draft exists
- Deploy lock reason is explicit: "local session draft exists; re-audit and Panda validation required"
- No deploy unlock mechanism in this phase
- Clear messaging that session changes do NOT unlock deploy

---

### Risk 5: Local Session Volatility
**Risk**: Operators may lose session changes on page refresh

**Mitigation**:
- Banner warning: "Session changes are volatile and may be lost on refresh"
- "Session Only" labeling emphasizes volatility
- No persistence mechanism (by design)
- Future phase may add beforeunload warning (deferred)

---

### Risk 6: UI Overcrowding
**Risk**: Adding session UI may clutter the warroom interface

**Mitigation**:
- Session banner only appears when session state exists
- Draft source switcher is compact (radio buttons or segmented control)
- Session draft preview replaces canonical view (not additive)
- Comparison view is optional/collapsible
- Session ledger is collapsible or modal

---

## 15. Open Questions

### Question 1: Right Rail Placement Constraints
**Question**: Where should session UI components be placed in the right rail layout?

**Options**:
- A. Session banner at top, above all content
- B. Draft source switcher near editor
- C. Session ledger in collapsible panel
- D. Comparison view as separate tab/modal

**Decision**: Deferred to implementation phase

---

### Question 2: Ledger Metadata Shape
**Question**: What metadata should be displayed in the session ledger summary?

**Options**:
- A. Minimal: suggestion ID, timestamp
- B. Standard: + category, field, language
- C. Detailed: + original text, applied text snippets
- D. Full: + complete before/after content

**Decision**: Deferred to implementation phase (recommend Standard or Detailed)

---

### Question 3: Controller Return Contract
**Question**: Does the controller need to return additional metadata for UI display?

**Current Return**: `{ appliedEvent, snapshot }`

**Potential Additions**:
- Session state summary
- Audit invalidation details
- Deploy lock reason

**Decision**: Deferred to implementation phase (current return may be sufficient)

---

### Question 4: Diff Granularity
**Question**: How granular should the comparison view diff be?

**Options**:
- A. Character-level diff
- B. Word-level diff
- C. Line-level diff
- D. Paragraph-level diff

**Decision**: Deferred to implementation phase (recommend Word-level or Line-level)

---

### Question 5: Beforeunload Warning
**Question**: Should we add a beforeunload warning when session state exists?

**Consideration**: Warns operator before losing session changes on page refresh

**Decision**: Deferred to future phase (not in scope for this phase)

---

### Question 6: Rollback UI
**Question**: When should rollback UI be introduced?

**Consideration**: Session ledger is read-only in this phase; rollback execution is deferred

**Decision**: Deferred to future phase (not in scope for this phase)

---

## 16. Design Verdict

**READY_FOR_TASKS**

This design document provides sufficient detail to create an implementation task list. The design:

✅ Defines clear UX architecture  
✅ Specifies exact UI copy requirements  
✅ Establishes safety boundaries  
✅ Maps state flow  
✅ Lists rendering rules  
✅ Identifies future file impacts  
✅ Outlines validation strategy  
✅ Documents risks and mitigations  
✅ Captures open questions  

**Next Step**: Create `tasks.md` to break this design into sequential implementation tasks.
