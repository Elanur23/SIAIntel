# Session Preview / Session State UI — Task 1 State Exposure Audit

## 1. Task Verdict

**READY_FOR_TASK_2**

The controller exposes all necessary session state for UI consumption. All state is read-only, properly typed, and follows the session-scoped memory-only pattern. No adapter is needed for basic state exposure. Task 2 can proceed to create derived state helpers.

---

## 2. Files Inspected

- `app/admin/warroom/hooks/useLocalDraftRemediationController.ts` (complete)
- `app/admin/warroom/page.tsx` (complete)
- `app/admin/warroom/components/RemediationPreviewPanel.tsx` (complete)
- `lib/editorial/remediation-apply-types.ts` (complete)
- `lib/editorial/remediation-local-draft.ts` (complete)

---

## 3. localDraftCopy Contract

### Location
**File**: `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`  
**Declaration**: Line 35 - React state via `useState`

### Type Shape
```typescript
type LocalDraft = Record<string, { title: string; desc: string; ready: boolean }>

const [localDraftCopy, setLocalDraftCopy] = useState<LocalDraft | null>(null);
```

### Ownership
- **State Type**: React state (session-scoped, browser memory only)
- **Initialization**: Via `initializeLocalDraftFromVault(vault)` - deep clones canonical vault
- **Mutation**: Via `applyToLocalDraftController()` - creates new cloned state
- **Nullability**: Yes - `null` when no session exists
- **Persistence**: None - lost on page refresh (by design)

### Fields
- **Structure**: Language-keyed object (e.g., `{ en: {...}, tr: {...}, ... }`)
- **Per-Language Node**:
  - `title: string` - Article headline
  - `desc: string` - Full article body (includes `[BODY]` structural markers)
  - `ready: boolean` - Whether node is hydrated

### Current Rendering
- **NOT rendered anywhere** - This is the dark state problem
- Canonical vault (`activeDraft`) is rendered in editor/preview
- `localDraftCopy` exists in memory but has no UI visibility

### Exposure Status
✅ **EXPOSED** - Controller returns `localDraftCopy` directly  
✅ **READ-ONLY** - No mutation methods exposed for direct state manipulation  
✅ **PROPERLY TYPED** - Uses `LocalDraft` type from `remediation-local-draft.ts`

---

## 4. sessionRemediationLedger Contract

### Location
**File**: `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`  
**Declaration**: Line 36 - React state via `useState`

### Type Shape
```typescript
export interface RemediationLedgerEntry {
  appliedEvent: AppliedRemediationEvent;
  snapshot: DraftSnapshot;
}

const [sessionRemediationLedger, setSessionRemediationLedger] = useState<RemediationLedgerEntry[]>([]);
```

### Ownership
- **State Type**: React state (session-scoped array)
- **Initialization**: Empty array `[]`
- **Mutation**: Via `applyToLocalDraftController()` - appends new entry
- **Rollback**: Via `rollbackLastLocalDraftChange()` - removes last entry
- **Persistence**: None - lost on page refresh

### Entry Fields (Per RemediationLedgerEntry)

**appliedEvent** (AppliedRemediationEvent):
- `eventId: string` - Unique event identifier
- `suggestionId: string` - ID of applied suggestion
- `articleId: string` - Article identifier
- `packageId: string` - Package identifier
- `operatorId: string` - Operator who applied
- `category: RemediationCategory` - e.g., FORMAT_REPAIR
- `affectedLanguage?: string` - Language node affected
- `affectedField?: string` - Field path (e.g., 'body')
- `originalText: string` - Text before apply
- `appliedText: string` - Text after apply
- `diff: { from: string; to: string }` - Before/after diff
- `auditInvalidated: true` - Hard-coded safety invariant
- `reAuditRequired: true` - Hard-coded safety invariant
- `createdAt: string` - ISO timestamp
- `approvalTextAccepted: string[]` - Confirmation texts
- `confirmationMethod: string` - How it was confirmed
- `phase: "3A_PROTOCOL_ONLY"` - Protocol phase marker

**snapshot** (DraftSnapshot):
- `snapshotId: string` - Unique snapshot identifier
- `articleId: string` - Article identifier
- `packageId: string` - Package identifier
- `affectedLanguage?: string` - Language node affected
- `affectedField?: string` - Field path
- `beforeValue: string` - Full content before change
- `createdAt: string` - ISO timestamp
- `reason: string` - Invalidation reason
- `linkedSuggestionId: string` - Suggestion that triggered snapshot

### UI-Friendliness Assessment
✅ **UI-READY** - All fields are directly displayable  
✅ **CHRONOLOGICAL** - Array order preserves application sequence  
✅ **COMPLETE METADATA** - Includes timestamps, IDs, language, field, before/after text  
⚠️ **TEXT SNIPPETS** - `originalText` and `appliedText` may be long; UI may want to truncate

### Exposure Status
✅ **EXPOSED** - Controller returns `sessionRemediationLedger` directly  
✅ **READ-ONLY** - No mutation methods exposed  
✅ **PROPERLY TYPED** - Uses `RemediationLedgerEntry` interface

---

## 5. sessionAuditInvalidation Contract

### Location
**File**: `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`  
**Declaration**: Line 38 - React state via `useState`

### Type Shape
```typescript
export interface AuditInvalidationState {
  auditInvalidated: boolean;
  reAuditRequired: boolean;
  invalidationReason?: AuditInvalidationReason;
  invalidatedAt?: string;
}

const [sessionAuditInvalidation, setSessionAuditInvalidation] = useState<AuditInvalidationState | null>(null);
```

### Ownership
- **State Type**: React state (session-scoped object)
- **Initialization**: `null` when no session exists
- **Mutation**: Set by `applyToLocalDraftController()` and `rollbackLastLocalDraftChange()`
- **Nullability**: Yes - `null` when no invalidation has occurred
- **Persistence**: None - lost on page refresh

### Fields
- `auditInvalidated: boolean` - Whether global audit is now stale
- `reAuditRequired: boolean` - Whether re-audit is required before deploy
- `invalidationReason?: AuditInvalidationReason` - Why audit was invalidated (enum)
- `invalidatedAt?: string` - ISO timestamp of invalidation

### Invalidation Reasons (Enum)
```typescript
enum AuditInvalidationReason {
  DRAFT_TEXT_CHANGED = 'DRAFT_TEXT_CHANGED',
  LANGUAGE_NODE_CHANGED = 'LANGUAGE_NODE_CHANGED',
  REMEDIATION_APPLIED = 'REMEDIATION_APPLIED',
  ROLLBACK_PERFORMED = 'ROLLBACK_PERFORMED',
  PARITY_RISK_CREATED = 'PARITY_RISK_CREATED',
  AUDIT_CONTEXT_STALE = 'AUDIT_CONTEXT_STALE'
}
```

### UI Chip Readiness
✅ **AUDIT STALE CHIP** - Can use `auditInvalidated === true`  
✅ **RE-AUDIT REQUIRED CHIP** - Can use `reAuditRequired === true`  
✅ **DEPLOY BLOCKED CHIP** - Can derive from `auditInvalidated || reAuditRequired`  
✅ **TOOLTIP DATA** - `invalidationReason` provides human-readable context

### Exposure Status
✅ **EXPOSED** - Controller returns `sessionAuditInvalidation` directly  
✅ **READ-ONLY** - No mutation methods exposed  
✅ **PROPERLY TYPED** - Uses `AuditInvalidationState` interface  
✅ **DIRECTLY USABLE** - No adapter needed for UI chips

---

## 6. Controller Return Contract

### Location
**File**: `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`  
**Function**: `useLocalDraftRemediationController()` (lines 40-155)

### Full Return Shape
```typescript
return {
  // State
  localDraftCopy: LocalDraft | null,
  hasLocalDraftChanges: boolean,
  sessionRemediationLedger: RemediationLedgerEntry[],
  latestSnapshot: DraftSnapshot | null,
  latestAppliedEvent: AppliedRemediationEvent | null,
  latestRollbackEvent: RollbackEvent | null,
  sessionAuditInvalidation: AuditInvalidationState | null,
  reAuditRequired: boolean,
  deployBlockedByLocalDraft: boolean,

  // Functions
  initializeLocalDraftFromVault: (vault: LocalDraft) => void,
  clearLocalDraftSession: () => void,
  applyToLocalDraftController: (input: ControllerApplyInput) => { appliedEvent, snapshot },
  rollbackLastLocalDraftChange: (input: { operatorId?: string }) => { rollbackEvent }
};
```

### Success Return (applyToLocalDraftController)
```typescript
{
  appliedEvent: AppliedRemediationEvent,
  snapshot: DraftSnapshot
}
```

### Derived State Helpers (Already Exposed)
✅ `hasLocalDraftChanges: boolean` - True when ledger has entries  
✅ `latestSnapshot: DraftSnapshot | null` - Most recent snapshot  
✅ `latestAppliedEvent: AppliedRemediationEvent | null` - Most recent apply event  
✅ `reAuditRequired: boolean` - Derived from `sessionAuditInvalidation?.reAuditRequired`  
✅ `deployBlockedByLocalDraft: boolean` - Derived from `sessionAuditInvalidation?.auditInvalidated`

### Error Handling
- Throws errors for invalid operations (e.g., apply without initialization)
- Errors include descriptive messages (e.g., "CONTROLLER_REVALIDATION_FAILED: ...")

### Exposure Status
✅ **COMPLETE** - All necessary state is exposed  
✅ **DERIVED HELPERS** - Basic helpers already provided  
✅ **READ-ONLY STATE** - No direct mutation methods for session state  
✅ **FUNCTION METHODS** - Controlled mutation via `applyToLocalDraftController()`

---

## 7. Canonical Rendering Map

### Current Canonical Vault Rendering

**Source State**: `vault` (React state in `page.tsx`)
```typescript
const [vault, setVault] = useState<Record<string, { title: string; desc: string; ready: boolean }>>({
  tr: { title: '', desc: '', ready: false },
  en: { title: '', desc: '', ready: false },
  // ... 9 languages total
})
```

**Active Draft Derivation**:
```typescript
const activeDraft = vault[activeLang] || { title: '', desc: '', ready: false }
```

### Rendering Locations

**1. Edit Mode (viewMode === 'edit')**
- **Title Input** (line ~850):
  ```tsx
  <input
    value={activeDraft.title}
    onChange={(e) => setVault({ ...vault, [activeLang]: { ...activeDraft, title: e.target.value } })}
  />
  ```
- **Body Textarea** (line ~870):
  ```tsx
  <textarea
    value={activeDraft.desc}
    onChange={(e) => setVault({ ...vault, [activeLang]: { ...activeDraft, desc: e.target.value, ready: !!e.target.value } })}
  />
  ```

**2. Preview Mode (viewMode === 'preview')**
- **Transformed Article** (if `transformedArticle` exists):
  - Headline: `transformedArticle.headline`
  - Subheadline: `transformedArticle.subheadline`
  - Summary: `transformedArticle.summary`
  - Body: `transformedArticle.body` (formatted via `formatArticleBody()`)
  - Key Insights: `transformedArticle.keyInsights`
  - Risk Note: `transformedArticle.riskNote`

- **Raw Fallback** (if no `transformedArticle`):
  - Title: `activeDraft.title`
  - Body: `activeDraft.desc` (formatted via `formatArticleBody()`)

### Canonical Authority
✅ **DEFAULT VIEW** - Canonical vault is always displayed by default  
✅ **EDIT CONTROLS** - Only canonical vault has edit capability  
✅ **TRANSFORM SOURCE** - Transform operates on canonical vault  
✅ **DEPLOY SOURCE** - Deploy uses canonical vault (or transformed article)

---

## 8. Session Rendering Gap

### Current State
❌ **DARK STATE CONFIRMED** - `localDraftCopy` is NOT rendered anywhere  
❌ **NO VISIBILITY** - Operator cannot see session-only changes  
❌ **NO COMPARISON** - No way to compare canonical vs session state  
❌ **NO LEDGER UI** - `sessionRemediationLedger` is not displayed  
❌ **NO AUDIT STALE UI** - `sessionAuditInvalidation` is not surfaced  
❌ **NO DEPLOY LOCK REASON** - Deploy lock reason does not mention session draft

### Evidence
1. **No Session Draft Rendering**:
   - Search for `localDraftCopy` in `page.tsx` rendering: NOT FOUND in JSX
   - Only used in controller initialization: `remediationController.initializeLocalDraftFromVault(vault)`

2. **No Ledger Display**:
   - Search for `sessionRemediationLedger` in `page.tsx` rendering: NOT FOUND in JSX
   - Only passed to `RemediationPreviewPanel` but not displayed there

3. **No Audit Invalidation UI**:
   - Search for `sessionAuditInvalidation` in `page.tsx` rendering: NOT FOUND in JSX
   - Deploy lock logic does NOT check `sessionAuditInvalidation`

4. **Deploy Lock Logic** (lines 240-265):
   ```typescript
   const isDeployBlocked = useMemo(() => {
     if (!selectedNews || !vault[activeLang].ready || isPublishing || isTransforming || transformError) return true;
     if (!globalAudit || !globalAudit.publishable) return true;
     if (!transformedArticle || !auditResult) return true;
     if (auditResult.overall_score < 70) return true;
     if (protocolConfig.enableScarcityTone && auditResult.overall_score < 85) return true;
     return false;
   }, [selectedNews, vault, activeLang, isPublishing, isTransforming, transformError, transformedArticle, auditResult, globalAudit, protocolConfig.enableScarcityTone])
   ```
   ❌ **DOES NOT CHECK** `remediationController.localDraftCopy`  
   ❌ **DOES NOT CHECK** `remediationController.sessionAuditInvalidation`  
   ❌ **DOES NOT CHECK** `remediationController.deployBlockedByLocalDraft`

### Gap Summary
The session state exists in memory but is completely invisible to the operator. This is the exact problem that Session Preview / Session State UI is designed to solve.

---

## 9. Deploy Lock / Audit Stale Readiness

### Current Deploy Lock Logic
**Location**: `page.tsx` lines 240-265  
**Variable**: `isDeployBlocked` (useMemo)

**Current Checks**:
1. ✅ `selectedNews` exists
2. ✅ `vault[activeLang].ready` is true
3. ✅ `isPublishing` is false
4. ✅ `isTransforming` is false
5. ✅ `transformError` is null
6. ✅ `globalAudit` exists and `publishable` is true
7. ✅ `transformedArticle` exists
8. ✅ `auditResult` exists
9. ✅ `auditResult.overall_score >= 70`
10. ✅ Scarcity tone check (if enabled, score >= 85)

**Missing Checks**:
❌ `localDraftCopy !== null` (session draft exists)  
❌ `sessionAuditInvalidation?.auditInvalidated === true` (audit is stale)  
❌ `sessionAuditInvalidation?.reAuditRequired === true` (re-audit required)

### UI Chip Readiness

**Can UI Safely Display Chips?**
✅ **YES** - All necessary state is exposed by controller

**Chip 1: Audit Stale**
- **Condition**: `sessionAuditInvalidation?.auditInvalidated === true`
- **Text**: "Audit Invalidated"
- **Tooltip**: "Audit invalidated by session changes. Full re-audit required."
- **Color**: Red/warning
- **Data Source**: `remediationController.sessionAuditInvalidation`

**Chip 2: Deploy Locked**
- **Condition**: `localDraftCopy !== null`
- **Text**: "Deploy Blocked"
- **Tooltip**: "Deploy blocked: local session draft exists; re-audit and Panda validation required."
- **Color**: Red/error
- **Data Source**: `remediationController.localDraftCopy`

**Chip 3: Re-Audit Required**
- **Condition**: `sessionAuditInvalidation?.reAuditRequired === true`
- **Text**: "Re-Audit Required"
- **Tooltip**: "Full protocol re-audit required before deploy."
- **Color**: Orange/warning
- **Data Source**: `remediationController.sessionAuditInvalidation` or `remediationController.reAuditRequired`

### Deploy Lock Reason
**Current**: Generic "GATING_RESTRICTED" or "Locked" text  
**Needed**: Specific reason when session draft exists

**Proposed Logic**:
```typescript
const deployBlockReason = useMemo(() => {
  if (remediationController.localDraftCopy !== null) {
    return "Deploy blocked: local session draft exists; re-audit and Panda validation required.";
  }
  if (remediationController.sessionAuditInvalidation?.auditInvalidated) {
    return "Deploy blocked: audit invalidated by session changes; re-audit required.";
  }
  // ... other reasons
  return null;
}, [remediationController.localDraftCopy, remediationController.sessionAuditInvalidation]);
```

### Safety Assessment
✅ **SAFE TO DISPLAY** - Chips are read-only display only  
✅ **NO LOGIC CHANGE** - Displaying chips does NOT change deploy lock logic  
✅ **NO MUTATION** - Chips do NOT mutate any state  
✅ **NO UNLOCK** - Chips do NOT provide deploy unlock mechanism

---

## 10. Adapter Need Assessment

### Task 2 Requirements
Task 2 requires derived state helpers:
- `hasSessionDraft: boolean` - True when `localDraftCopy !== null`
- `isAuditStale: boolean` - True when `sessionAuditInvalidation?.auditInvalidated === true`
- `isDeployBlocked: boolean` - True when `hasSessionDraft === true`
- `sessionRemediationCount: number` - Count of applied remediations
- `deployBlockReason: string | null` - Human-readable deploy lock reason

### Current State
✅ **hasSessionDraft** - Can derive: `localDraftCopy !== null`  
✅ **isAuditStale** - Can derive: `sessionAuditInvalidation?.auditInvalidated === true`  
✅ **isDeployBlocked** - Already exposed: `deployBlockedByLocalDraft`  
✅ **sessionRemediationCount** - Can derive: `sessionRemediationLedger.length`  
⚠️ **deployBlockReason** - Needs new helper (not currently exposed)

### Adapter Assessment
**NO ADAPTER NEEDED** for basic state exposure.

**SIMPLE HELPERS NEEDED** for Task 2:
- Pure functions to derive boolean flags
- Pure function to generate deploy block reason string
- No complex transformation required
- No controller return shape changes needed

### Recommendation
**Option A** (Recommended): Add helpers to `useLocalDraftRemediationController.ts`
- Co-locate with existing derived state (`hasLocalDraftChanges`, `reAuditRequired`, etc.)
- Maintain single source of truth
- No new files needed

**Option B**: Create separate `lib/editorial/session-state-helpers.ts`
- Separate concerns (pure helpers vs stateful controller)
- Easier to test in isolation
- Requires import in multiple places

**Verdict**: **Option A** is preferred for simplicity and co-location.

---

## 11. Safety Findings

### Vault Integrity
✅ **NO VAULT MUTATION** - Controller does NOT mutate canonical vault  
✅ **DEEP CLONING** - `cloneLocalDraftForRemediation()` creates deep copies  
✅ **IMMUTABLE OPERATIONS** - All transformations create new objects  
✅ **CANONICAL AUTHORITY** - Vault remains authoritative source

### Backend Isolation
✅ **NO BACKEND CALLS** - Controller has zero fetch/axios calls  
✅ **NO API ROUTES** - No network requests of any kind  
✅ **NO DATABASE WRITES** - No Firestore or database mutations  
✅ **SESSION-SCOPED ONLY** - All state is React state (browser memory)

### Persistence Prohibition
✅ **NO LOCALSTORAGE** - No localStorage usage found  
✅ **NO SESSIONSTORAGE** - No sessionStorage usage found  
✅ **NO COOKIES** - No cookie usage found  
✅ **NO INDEXEDDB** - No IndexedDB usage found  
✅ **VOLATILE BY DESIGN** - State is lost on page refresh (confirmed)

### Deploy Lock Preservation
⚠️ **DEPLOY LOCK INCOMPLETE** - Current `isDeployBlocked` does NOT check session state  
⚠️ **NEEDS ENHANCEMENT** - Must add `localDraftCopy !== null` check  
⚠️ **NEEDS REASON** - Must surface deploy lock reason when session draft exists  
✅ **NO UNLOCK MECHANISM** - No way to unlock deploy with session changes (correct)

### Panda Validation Unchanged
✅ **NO PANDA CHANGES** - Panda validation logic is untouched  
✅ **NO GATE WEAKENING** - No weakening of Panda gates  
✅ **NO BYPASS** - Session UI does NOT bypass Panda

### Audit Invalidation Visibility
❌ **NOT VISIBLE** - `sessionAuditInvalidation` is not surfaced to UI  
❌ **NO CHIPS** - Audit stale / re-audit required chips do not exist  
❌ **NO BANNER** - No session state banner exists  
✅ **STATE EXISTS** - Invalidation state is correctly maintained in controller

### Session Labeling
❌ **NO LABELING** - No "Session Only" labels exist (no session UI yet)  
❌ **NO WARNINGS** - No "Not Saved to Vault" warnings exist  
❌ **NO DEPLOY WARNINGS** - No "Not Deployed" warnings exist  
✅ **READY FOR LABELING** - All state is available to add labels in Task 3+

### Read-Only Enforcement
✅ **CONTROLLER READ-ONLY** - No direct mutation methods exposed for session state  
✅ **CONTROLLED MUTATION** - Only via `applyToLocalDraftController()` with validation  
✅ **NO EDITING UI** - No session draft editing capability exists (correct)  
✅ **NO ROLLBACK UI** - No rollback button exists (deferred to future phase)

---

## 12. Recommended Next Step

**Proceed to Task 2 — Read-Only Session View Model**

### Task 2 Objectives
1. Add derived state helpers to `useLocalDraftRemediationController.ts`:
   - `hasSessionDraft: boolean`
   - `isAuditStale: boolean`
   - `sessionRemediationCount: number`
   - `deployBlockReason: string | null`

2. Enhance `isDeployBlocked` logic in `page.tsx`:
   - Add check: `remediationController.localDraftCopy !== null`
   - Add check: `remediationController.sessionAuditInvalidation?.auditInvalidated === true`

3. Create pure helper functions (if needed):
   - `getDeployBlockReason(hasSessionDraft, isAuditStale): string | null`
   - `getSessionRemediationCount(ledger): number`

### No Blockers Identified
✅ All required state is exposed  
✅ All state is properly typed  
✅ All state is read-only  
✅ All safety boundaries are intact  
✅ No adapter needed  
✅ No controller changes needed (only additions)

### Implementation Notes
- Keep all helpers pure (no side effects)
- Co-locate helpers with controller for simplicity
- Use existing derived state pattern (`useMemo`)
- Maintain session-scoped memory-only pattern
- No backend calls, no persistence, no vault mutation

---

## Audit Completion

**Date**: 2026-04-28  
**Phase**: Session Preview / Session State UI  
**Task**: Task 1 - State Exposure Audit  
**Status**: ✅ COMPLETE  
**Verdict**: READY_FOR_TASK_2  
**Blockers**: None  
**Safety**: All boundaries intact  
**Next**: Task 2 - Read-Only Session View Model
