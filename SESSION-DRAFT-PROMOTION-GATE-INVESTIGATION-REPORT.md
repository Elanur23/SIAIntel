# Session Draft Promotion Gate - READ-ONLY Investigation Report

**Date**: 2026-04-29  
**Mission**: Perform READ-ONLY investigation for Session Draft Promotion Gate design  
**Status**: INVESTIGATION COMPLETE  
**Verdict**: READY_FOR_DESIGN_PHASE

---

## Executive Summary

This report documents a comprehensive READ-ONLY investigation of the current Warroom architecture to inform the design of a Session Draft Promotion Gate. The investigation identifies all canonical vault write paths, session draft state management, deploy lock logic, and existing safety primitives.

**Key Finding**: The current architecture has a clear separation between canonical vault state and session draft state, with hard-coded safety invariants preventing automatic promotion. A promotion gate can be safely designed as an explicit operator action with strict preconditions.

---

## Investigation Targets & Findings

### 1. Canonical Vault State Management

**Location**: `app/admin/warroom/page.tsx`

**State Variable**:
```typescript
const [vault, setVault] = useState<
  Record<string, { title: string; desc: string; ready: boolean }>
>({
  tr: { title: '', desc: '', ready: false },
  en: { title: '', desc: '', ready: false },
  // ... 9 languages total
})
```

**Write Paths Identified**:

1. **Manual Edit** (lines 1000-1015):
   - User types in textarea
   - Calls `setVault({ ...vault, [activeLang]: { ...activeDraft, desc: e.target.value, ready: !!e.target.value } })`
   - Clears global audit on edit

2. **Manual Title Edit** (lines 990-995):
   - User types in title input
   - Calls `setVault({ ...vault, [activeLang]: { ...activeDraft, title: e.target.value } })`

3. **Load Manual Draft** (lines 330-345):
   - User clicks "Load Manual Draft" button
   - Resets entire vault with manual input
   - Sets all 9 languages to same title/desc

4. **Apply Panda Package** (lines 347-385):
   - User imports Panda JSON
   - Calls `applyPandaPackageToVault(pkg)`
   - Overwrites vault with 9-language Panda data
   - Clears transformed article, audit results

5. **Sync from AI Workspace** (lines 387-425):
   - User clicks "SYNC WORKSPACE" button
   - Fetches from `/api/war-room/workspace`
   - Hydrates vault from workspace data
   - Force syncs image URL

**Critical Observation**: No existing function promotes session draft to canonical vault. All vault writes are either:
- Direct user input (manual edit)
- External data import (Panda, workspace sync)
- Never from session draft state

---

### 2. Session Draft State Management

**Location**: `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`

**State Variable**:
```typescript
const [localDraftCopy, setLocalDraftCopy] = useState<LocalDraft | null>(null);
```

**Write Paths Identified**:

1. **Initialize from Vault** (lines 60-70):
   - Called when `selectedNews` changes
   - Deep clones vault to create session draft
   - Clears ledger and audit state

2. **Apply Remediation** (lines 90-135):
   - Called by `applyToLocalDraftController`
   - Mutates `localDraftCopy` with remediation
   - Appends to `sessionRemediationLedger`
   - Invalidates session audit

3. **Rollback Last Change** (lines 140-175):
   - Restores from snapshot in ledger
   - Removes last ledger entry
   - Keeps audit invalidated

4. **Clear Session** (lines 75-85):
   - Sets `localDraftCopy` to null
   - Clears all session state

**Critical Observation**: Session draft is completely isolated from vault. No write path from session to vault exists.

---

### 3. Deploy Lock Logic

**Location**: `app/admin/warroom/page.tsx` (lines 220-260)

**Deploy Lock Conditions** (fail-closed):
```typescript
const isDeployBlocked = useMemo(() => {
  // Basic connectivity and ready checks
  if (!selectedNews || !vault[activeLang].ready || isPublishing || isTransforming || transformError) {
    return true;
  }

  // PHASE 3C-3C-3B-2B SAFETY GATE: Deploy remains locked when session draft exists
  if (remediationController.hasSessionDraft) {
    return true;
  }

  // MUST have a global audit pass
  if (!globalAudit || !globalAudit.publishable) {
    return true;
  }

  // Must have a transformed article and audit result for active language
  if (!transformedArticle || !auditResult) {
    return true;
  }

  // Strict audit score threshold
  if (auditResult.overall_score < 70) {
    return true;
  }

  // Scarcity Tone requires Sovereign-level validation (85+)
  if (protocolConfig.enableScarcityTone && auditResult.overall_score < 85) {
    return true;
  }

  return false;
}, [
  selectedNews,
  vault,
  activeLang,
  isPublishing,
  isTransforming,
  transformError,
  transformedArticle,
  auditResult,
  globalAudit,
  protocolConfig.enableScarcityTone,
  remediationController.hasSessionDraft
]);
```

**Critical Observation**: Deploy is blocked when `remediationController.hasSessionDraft` is true. This is the primary session draft safety gate.

---

### 4. Session Re-Audit Result Storage

**Location**: `app/admin/warroom/hooks/useLocalDraftRemediationController.ts` (lines 180-250)

**State Variable**:
```typescript
const [sessionAuditResult, setSessionAuditResult] = useState<SessionAuditResult | null>(null);
const [sessionAuditLifecycle, setSessionAuditLifecycle] = useState<SessionAuditLifecycle>(SessionAuditLifecycle.NOT_RUN);
```

**Session Audit Result Contract** (`lib/editorial/remediation-apply-types.ts`):
```typescript
export interface SessionAuditResult {
  identity: SnapshotIdentity;
  lifecycle: SessionAuditLifecycle;
  globalAuditPass: boolean;
  pandaCheckPass: boolean;
  findings: string[];
  globalAuditResult: any;
  pandaCheckResult: any;
  pandaStructuralErrors?: string[];
  timestamp: string;
  isStale: boolean;

  // Hard-coded safety invariants
  memoryOnly: true;
  deployUnlockAllowed: false;
  canonicalAuditOverwriteAllowed: false;
  vaultMutationAllowed: false;
}
```

**Critical Observation**: Session audit result has hard-coded safety invariants:
- `memoryOnly: true` - Never persisted
- `deployUnlockAllowed: false` - Cannot unlock deploy
- `canonicalAuditOverwriteAllowed: false` - Cannot overwrite canonical audit
- `vaultMutationAllowed: false` - Cannot mutate vault

---

### 5. Existing Vault Mutation Functions

**Finding**: NO existing function mutates canonical vault from session draft state.

**Vault Mutation Functions Identified**:
- `setVault()` - Direct React state setter
- `applyPandaPackageToVault()` - Imports Panda JSON
- `syncFromAiWorkspace()` - Syncs from workspace API
- `loadManualDraft()` - Loads manual input

**None of these read from `localDraftCopy`.**

---

### 6. Rollback/Session Ledger Events

**Location**: `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`

**Ledger Structure**:
```typescript
export interface RemediationLedgerEntry {
  appliedEvent: AppliedRemediationEvent;
  snapshot: DraftSnapshot;
}

const [sessionRemediationLedger, setSessionRemediationLedger] = useState<RemediationLedgerEntry[]>([]);
```

**Ledger Entry Contents**:
- `appliedEvent`: Full remediation event with metadata
  - `eventId`, `suggestionId`, `articleId`, `packageId`
  - `operatorId`, `category`, `affectedLanguage`, `affectedField`
  - `originalText`, `appliedText`, `diff`
  - `auditInvalidated: true`, `reAuditRequired: true`
  - `createdAt`, `approvalTextAccepted`, `confirmationMethod`
- `snapshot`: Content state before remediation
  - `snapshotId`, `articleId`, `packageId`
  - `affectedLanguage`, `affectedField`, `beforeValue`
  - `createdAt`, `reason`, `linkedSuggestionId`

**Rollback Event Structure**:
```typescript
export interface RollbackEvent {
  rollbackId: string;
  linkedApplyEventId: string;
  linkedSnapshotId: string;
  articleId: string;
  packageId: string;
  affectedLanguage?: string;
  affectedField?: string;
  restoredText: string;
  auditInvalidated: true;
  reAuditRequired: true;
  createdAt: string;
}
```

**Critical Observation**: Ledger provides full audit trail of all session changes with snapshots for rollback. This can be used for promotion metadata.

---

### 7. Safety Fields Available

**Snapshot Identity** (`lib/editorial/remediation-apply-types.ts`):
```typescript
export interface SnapshotIdentity {
  contentHash: string;
  ledgerSequence: number;
  latestAppliedEventId: string | null;
  timestamp: string;
}
```

**Audit Invalidation State**:
```typescript
export interface AuditInvalidationState {
  auditInvalidated: boolean;
  reAuditRequired: boolean;
  invalidationReason?: AuditInvalidationReason;
  invalidatedAt?: string;
}
```

**Session Audit Lifecycle**:
```typescript
export enum SessionAuditLifecycle {
  NOT_RUN = 'NOT_RUN',
  RUNNING = 'RUNNING',
  PASSED = 'PASSED',
  FAILED = 'FAILED',
  STALE = 'STALE'
}
```

**Critical Observation**: Rich safety metadata available for promotion gate preconditions.

---

### 8. Promotion Action Preconditions

**Identified Preconditions for Safe Promotion**:

1. **Session Draft Must Exist**:
   - `remediationController.hasSessionDraft === true`
   - `remediationController.localDraftCopy !== null`

2. **Session Audit Must Pass**:
   - `remediationController.sessionAuditLifecycle === SessionAuditLifecycle.PASSED`
   - `remediationController.sessionAuditResult?.globalAuditPass === true`
   - `remediationController.sessionAuditResult?.pandaCheckPass === true`
   - `remediationController.sessionAuditResult?.isStale === false`

3. **Snapshot Identity Must Match**:
   - Current session state must match the audited snapshot
   - Prevents promotion of content that changed after audit

4. **No Transform Error**:
   - `transformError === null`

5. **Operator Acknowledgement**:
   - Explicit confirmation that promotion is intended
   - Acknowledgement that deploy remains locked after promotion

6. **No Pending Rollback**:
   - `remediationController.latestRollbackEvent === null` (optional)

---

## Current Deploy Lock Conditions

**Deploy remains locked when**:
1. No article selected
2. Active language vault not ready
3. Publishing in progress
4. Transforming in progress
5. Transform error exists
6. **Session draft exists** ← Primary session gate
7. No global audit or global audit failed
8. No transformed article
9. No active language audit result
10. Active language audit score < 70
11. Scarcity tone enabled and score < 85

**Critical Observation**: Condition #6 (session draft exists) is the primary blocker. After promotion, this condition would be cleared, but all other conditions would still need to be satisfied.

---

## Publish Flow Analysis

**Location**: `app/admin/warroom/page.tsx` (lines 427-550)

**Publish Flow**:
1. Check `isDeployBlocked` - fail-closed gate
2. Construct deploy payload from `vault[activeLang]` (NOT from session draft)
3. Use `transformedArticle` if available
4. Apply legal shield
5. POST to `/api/content-buffer`
6. Sync to AI workspace (mandatory pre-publish gate)
7. POST to `/api/war-room/save`
8. Handle duplicate detection (409 Conflict)

**Critical Observation**: Publish reads from `vault` state, never from `localDraftCopy`. After promotion, publish would use the promoted content.

---

## Missing Safety Primitives

**Identified Gaps**:

1. **Promotion Event Logging**:
   - No existing event type for "session promoted to canonical"
   - Need to track: who promoted, when, from which snapshot identity

2. **Promotion Precondition Validator**:
   - No existing function to check if promotion is safe
   - Need pure helper: `canPromoteSessionToCanonical()`

3. **Promotion Mutation Helper**:
   - No existing function to copy session draft to vault
   - Need pure helper: `promoteSessionDraftToVault()`

4. **Post-Promotion Audit Invalidation**:
   - After promotion, canonical vault audit is stale
   - Need to clear `globalAudit`, `auditResult`, `transformedArticle`
   - Need to set deploy lock reason to "Canonical vault updated - re-audit required"

5. **Promotion Confirmation Modal**:
   - No existing UI component for promotion confirmation
   - Need modal with:
     - Clear explanation of what promotion does
     - List of preconditions satisfied
     - Acknowledgement checkboxes
     - Explicit "Promote to Canonical Vault" button

---

## Recommended Promotion Gate Design

### Phase 1: Promotion Precondition Validation

**Pure Helper Function**:
```typescript
export interface PromotionPreconditionCheck {
  canPromote: boolean;
  blockReasons: string[];
  preconditionsMet: {
    sessionDraftExists: boolean;
    sessionAuditPassed: boolean;
    sessionAuditNotStale: boolean;
    snapshotIdentityMatches: boolean;
    noTransformError: boolean;
  };
}

export function checkPromotionPreconditions(
  remediationController: ReturnType<typeof useLocalDraftRemediationController>,
  transformError: string | null
): PromotionPreconditionCheck
```

### Phase 2: Promotion Mutation Helper

**Pure Helper Function**:
```typescript
export interface PromotionResult {
  success: boolean;
  promotedVault: LocalDraft;
  promotionEvent: PromotionEvent;
  auditInvalidated: true;
  reAuditRequired: true;
  deployBlocked: true;
}

export interface PromotionEvent {
  promotionId: string;
  articleId: string;
  packageId: string;
  operatorId: string;
  sourceSnapshotIdentity: SnapshotIdentity;
  promotedAt: string;
  remediationCount: number;
  ledgerSnapshot: RemediationLedgerEntry[];
}

export function promoteSessionDraftToVault(
  sessionDraft: LocalDraft,
  currentVault: LocalDraft,
  snapshotIdentity: SnapshotIdentity,
  ledger: RemediationLedgerEntry[],
  operatorId: string
): PromotionResult
```

### Phase 3: Promotion UI Component

**Component**: `SessionDraftPromotionModal.tsx`

**Features**:
- Display precondition checklist (all must be green)
- Show diff summary (languages modified, remediation count)
- Show session audit result summary
- Acknowledgement checkboxes:
  - "I understand this saves session draft to canonical vault"
  - "I understand deploy remains locked until canonical vault is re-audited"
  - "I understand this invalidates current canonical audit results"
- Explicit "Promote to Canonical Vault" button
- Cancel button

### Phase 4: Post-Promotion State Management

**Actions After Promotion**:
1. Call `setVault(promotedVault)` - Update canonical vault
2. Call `remediationController.clearLocalDraftSession()` - Clear session
3. Clear `globalAudit`, `auditResult`, `transformedArticle` - Invalidate canonical audit
4. Set deploy lock reason: "Canonical vault updated from session draft - full re-audit required"
5. Show success toast: "Session draft promoted to canonical vault. Run full protocol re-audit before deploy."

### Phase 5: Promotion Button Placement

**Location**: Right rail, Deploy Configuration section

**Placement**: Between "Session Audit State Panel" and "Deploy Hub" button

**Visibility**: Only when `remediationController.hasSessionDraft === true`

**Button States**:
- **Enabled**: All preconditions met
- **Disabled**: One or more preconditions not met
- **Tooltip**: Shows which preconditions are blocking

---

## Risks & Open Questions

### Risks

1. **Accidental Promotion**:
   - **Mitigation**: Require explicit confirmation modal with acknowledgements

2. **Promotion of Stale Session Audit**:
   - **Mitigation**: Check `sessionAuditResult.isStale === false` in preconditions

3. **Promotion Without Session Audit**:
   - **Mitigation**: Require `sessionAuditLifecycle === PASSED` in preconditions

4. **Snapshot Identity Mismatch**:
   - **Mitigation**: Recompute snapshot identity before promotion and compare

5. **Loss of Canonical Vault Content**:
   - **Mitigation**: Store canonical vault snapshot in promotion event for rollback

### Open Questions

1. **Should promotion be reversible?**
   - **Recommendation**: No. Promotion is a one-way operation. If user wants to revert, they can manually edit vault or re-import Panda.

2. **Should promotion create a backup of canonical vault?**
   - **Recommendation**: Yes. Store canonical vault snapshot in promotion event metadata.

3. **Should promotion trigger automatic canonical re-audit?**
   - **Recommendation**: No. Operator must explicitly trigger canonical re-audit after promotion.

4. **Should promotion be logged to backend?**
   - **Recommendation**: Not in initial phase. Keep promotion session-only like session audit.

5. **Should promotion be allowed if session audit has warnings?**
   - **Recommendation**: Yes, if `globalAuditPass && pandaCheckPass`. Warnings are informational.

---

## Implementation Phases

### Phase 1: Promotion Precondition Validation (READ-ONLY)
- Create `checkPromotionPreconditions()` helper
- Add unit tests for all precondition scenarios
- No UI changes, no state mutations

### Phase 2: Promotion Mutation Helper (PURE FUNCTION)
- Create `promoteSessionDraftToVault()` helper
- Add unit tests for promotion logic
- No UI changes, no state mutations

### Phase 3: Promotion UI Component (UI-ONLY)
- Create `SessionDraftPromotionModal.tsx`
- Add promotion button to right rail
- Wire up precondition checks
- No actual promotion execution yet

### Phase 4: Promotion Execution (FULL INTEGRATION)
- Wire promotion button to mutation helper
- Implement post-promotion state management
- Add success/error handling
- Add promotion event logging

### Phase 5: Verification & Testing
- Create verification script
- Test all precondition scenarios
- Test promotion with various session states
- Test post-promotion canonical re-audit flow

---

## Conclusion

**Investigation Status**: COMPLETE

**Key Findings**:
1. Clear separation between canonical vault and session draft state
2. No existing promotion path from session to vault
3. Hard-coded safety invariants prevent automatic promotion
4. Rich metadata available for promotion gate preconditions
5. Deploy lock logic already enforces session draft blocking

**Recommendation**: Proceed with promotion gate design using the recommended phased approach. The architecture is well-suited for a safe, explicit promotion action with strict preconditions.

**Next Steps**:
1. Review this investigation report with stakeholders
2. Confirm promotion gate requirements and preconditions
3. Create detailed design document for promotion gate
4. Implement Phase 1 (precondition validation) as first deliverable

---

**Report Generated**: 2026-04-29  
**Investigation Duration**: Complete READ-ONLY analysis  
**Files Analyzed**: 3 core files + 2 verification scripts  
**Safety Boundaries**: All intact, no mutations performed
