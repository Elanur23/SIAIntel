# Task 10: Session Draft Clear - Implementation Plan

**Date:** 2026-04-30  
**Status:** READY FOR IMPLEMENTATION  
**Design Adjustment:** APPROVED (Option B - Archive Before Clear)

---

## Executive Summary

Task 10 implements session draft clearing after successful local promotion (Tasks 7-9 complete). Based on the design adjustment audit, we will implement **Option B: Archive Before Clear** to preserve audit trail and traceability.

**Critical Design Decision:**
- ❌ **NOT using** `clearLocalDraftSession()` directly (destroys audit trail)
- ✅ **USING** new `finalizePromotionSession()` callback that archives THEN clears

---

## Current State

### Completed Tasks:
- ✅ **Task 7**: Local canonical vault update implemented
- ✅ **Task 8**: Canonical/global audit invalidation implemented
- ✅ **Task 9**: Derived preview/audit state clearing implemented

### Current Implementation Location:
**File:** `app/admin/warroom/handlers/promotion-execution-handler.ts`  
**Line:** 1127-1163 (Phase 8 marked as TODO)

### Current State After Task 9:
```typescript
// Vault: UPDATED (Task 7)
// Audit: INVALIDATED (Task 8)
// Derived State: CLEARED (Task 9)
// Session Draft: STILL EXISTS ← Task 10 will clear this
// Session Ledger: STILL EXISTS ← Task 10 will archive then clear
// Session Audit: STILL EXISTS ← Task 10 will archive then clear
```

---

## Design Adjustment: Archive Before Clear

### Problem with Direct Clear:
```typescript
// ❌ BAD: Direct clearLocalDraftSession() destroys audit trail
clearLocalDraftSession()
  ↓
  sessionRemediationLedger = []      // LOST: remediation history
  sessionAuditResult = null          // LOST: audit findings
  latestAppliedEventId = null        // LOST: snapshot identity
```

### Solution: Archive Then Clear:
```typescript
// ✅ GOOD: Archive before clearing preserves audit trail
finalizePromotionSession()
  ↓
  1. archivePromotionSession()
     ↓
     promotionFinalizationSummary = {
       archivedLedger: {...},        // PRESERVED: remediation history
       archivedSessionAudit: {...},  // PRESERVED: audit findings
       snapshotIdentity: {...}       // PRESERVED: snapshot identity
     }
  ↓
  2. clearLocalDraftSession()
     ↓
     sessionRemediationLedger = []   // OK: already archived
     sessionAuditResult = null       // OK: already archived
```

---

## Implementation Phases

### Phase 1: Type Definitions
**File:** `lib/editorial/session-draft-promotion-6b2b-types.ts`

#### 1.1 Add PromotionFinalizationSummary Interface

```typescript
/**
 * Archived audit trail and session metadata from a completed promotion.
 * Stored in page-level state after session clear for traceability.
 */
export interface PromotionFinalizationSummary {
  /** Unique promotion execution ID */
  promotionId: string;
  
  /** Timestamp when promotion was finalized */
  executedAt: string;
  
  /** Operator who performed the promotion */
  operatorId: string;
  
  /** Archived session remediation ledger summary */
  archivedLedger: {
    eventCount: number;
    eventIds: string[];
    latestEventId: string | null;
    affectedFields: string[];
    affectedLanguages: string[];
  };
  
  /** Archived session audit result summary */
  archivedSessionAudit: {
    lifecycle: SessionAuditLifecycle;
    globalAuditPass: boolean;
    pandaCheckPass: boolean;
    findings: string[];
    timestamp: string;
  } | null;
  
  /** Snapshot identity at time of promotion */
  snapshotIdentity: {
    contentHash: string;
    ledgerSequence: number;
    latestAppliedEventId: string | null;
    timestamp: string;
  };
  
  /** Confirmation flags */
  vaultUpdated: true;
  auditInvalidated: true;
  sessionCleared: true;
  deployRemainedLocked: true;
}
```

#### 1.2 Update RealPromotionExecutionInput Interface

```typescript
export interface RealPromotionExecutionInput {
  // ... existing fields
  
  /**
   * Injected callback to finalize promotion session in React memory.
   * TASK 10: Session draft clear with audit trail preservation
   * 
   * This callback:
   * 1. Archives session ledger and audit trail
   * 2. Clears session draft state
   * 3. Preserves audit trail in promotionFinalizationSummary
   * 
   * Must be called after successful vault update, audit invalidation, and derived state clear.
   * 
   * @returns Result indicating success or failure with optional error message
   */
  finalizePromotionSession: () => LocalMutationCallbackResult;
}
```

#### 1.3 Update RealPromotionExecutionSuccess Interface

```typescript
export interface RealPromotionExecutionSuccess {
  // ... existing fields
  
  /** Promotion finalization summary (TASK 10) */
  finalizationSummary: {
    promotionId: string;
    archivedLedgerEventCount: number;
    archivedSessionAuditLifecycle: SessionAuditLifecycle | null;
    snapshotIdentityPreserved: boolean;
  };
  
  /** Session clear confirmation (TASK 10) */
  sessionClear: {
    localDraftCleared: true;           // Now true after Task 10
    sessionAuditCleared: true;         // Now true after Task 10
    remediationLedgerCleared: true;    // Now true after Task 10
    clearedAt: string;                 // Now populated after Task 10
  };
  
  /** Task completion status */
  readonly sessionDraftCleared: true;  // Now true after Task 10
}
```

---

### Phase 2: Controller Enhancement
**File:** `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`

#### 2.1 Add archivePromotionSession Function

```typescript
/**
 * Archives the current promotion session before clearing.
 * Returns a summary of the session for audit trail preservation.
 * 
 * CRITICAL: This is a READ-ONLY operation. No mutations occur.
 * 
 * @returns Promotion finalization summary or null if no session exists
 */
const archivePromotionSession = useCallback((): PromotionFinalizationSummary | null => {
  if (!localDraftCopy) return null;
  
  // Build archived ledger summary
  const archivedLedger = {
    eventCount: sessionRemediationLedger.length,
    eventIds: sessionRemediationLedger.map(e => e.appliedEvent.eventId),
    latestEventId: sessionRemediationLedger.length > 0 
      ? sessionRemediationLedger[sessionRemediationLedger.length - 1].appliedEvent.eventId 
      : null,
    affectedFields: Array.from(new Set(
      sessionRemediationLedger.map(e => e.appliedEvent.affectedField)
    )),
    affectedLanguages: Array.from(new Set(
      sessionRemediationLedger.map(e => e.appliedEvent.affectedLanguage)
    ))
  };
  
  // Build archived session audit summary
  const archivedSessionAudit = sessionAuditResult ? {
    lifecycle: sessionAuditLifecycle,
    globalAuditPass: sessionAuditResult.globalAuditPass,
    pandaCheckPass: sessionAuditResult.pandaCheckPass,
    findings: sessionAuditResult.findings,
    timestamp: sessionAuditResult.timestamp
  } : null;
  
  // Build snapshot identity
  const snapshotIdentity = currentSnapshotIdentity || {
    contentHash: '',
    ledgerSequence: 0,
    latestAppliedEventId: null,
    timestamp: new Date().toISOString()
  };
  
  return {
    promotionId: `promo_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    executedAt: new Date().toISOString(),
    operatorId: 'warroom-operator',
    archivedLedger,
    archivedSessionAudit,
    snapshotIdentity,
    vaultUpdated: true,
    auditInvalidated: true,
    sessionCleared: true,
    deployRemainedLocked: true
  };
}, [localDraftCopy, sessionRemediationLedger, sessionAuditResult, sessionAuditLifecycle, currentSnapshotIdentity]);
```

#### 2.2 Export archivePromotionSession

```typescript
return {
  // ... existing exports
  archivePromotionSession,  // NEW: Export archive function
};
```

---

### Phase 3: Page-Level Wiring
**File:** `app/admin/warroom/page.tsx`

#### 3.1 Add promotionFinalizationSummary State

```typescript
// Add after promotionDryRunResult state (around line 180)
const [promotionFinalizationSummary, setPromotionFinalizationSummary] = 
  useState<PromotionFinalizationSummary | null>(null);
```

#### 3.2 Implement finalizePromotionSession Callback

```typescript
// Add after handleBuildPromotionDryRun callback (around line 750)
const finalizePromotionSession = useCallback((): LocalMutationCallbackResult => {
  try {
    // Archive ledger and audit trail BEFORE clearing
    const summary = remediationController.archivePromotionSession();
    
    if (summary) {
      setPromotionFinalizationSummary(summary);
    }
    
    // Now clear the session
    remediationController.clearLocalDraftSession();
    
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Session finalization failed'
    };
  }
}, [remediationController]);
```

#### 3.3 Wire Callback in Promotion Execution Input

**NOTE:** This will be wired when real promotion execution is implemented (not in current scope).

```typescript
// Future wiring (not implemented yet):
const realPromotionInput: RealPromotionExecutionInput = {
  // ... existing fields
  finalizePromotionSession,  // NEW: Wire finalization callback
};
```

---

### Phase 4: Handler Implementation
**File:** `app/admin/warroom/handlers/promotion-execution-handler.ts`

#### 4.1 Replace TODO with Phase 8 Implementation

**Location:** Lines 1127-1163 (current TODO block)

```typescript
// --------------------------------------------------------------------------
// PHASE 8 — Session draft clear step (Task 10)
// --------------------------------------------------------------------------
// Invokes the session draft clear function after phases 5-7 succeed.
// This is the FOURTH and FINAL mutation in the promotion sequence.
// 
// CRITICAL SAFETY:
// - Vault already updated (Phase 5)
// - Audit already invalidated (Phase 6)
// - Derived state already cleared (Phase 7)
// - If this phase fails, vault/audit are already mutated
// - Must fail-hard and return blocked result with CRITICAL warnings
// --------------------------------------------------------------------------

// GUARD 10: Verify finalization callback is provided
if (!input.finalizePromotionSession || typeof input.finalizePromotionSession !== 'function') {
  return createBlockedResult(
    RealPromotionBlockCategory.SESSION_CLEAR,
    [
      'Session finalization callback is missing or invalid',
      'CRITICAL: Vault has already been updated',
      'CRITICAL: Audit has already been invalidated',
      'CRITICAL: Derived state has already been cleared',
      'Deploy must remain locked',
      'Manual intervention required to verify session state consistency'
    ],
    'BLOCKED: Cannot finalize session without callback - vault and audit already mutated',
    true
  );
}

// Execute session finalization with structured result handling
const clearedAt = new Date().toISOString();
let finalizationResult: { success: boolean; error?: string };

try {
  finalizationResult = input.finalizePromotionSession();
} catch (finalizationError) {
  return createBlockedResult(
    RealPromotionBlockCategory.SESSION_CLEAR,
    [
      'Session finalization callback threw exception',
      `Error: ${finalizationError instanceof Error ? finalizationError.message : String(finalizationError)}`,
      'CRITICAL: Vault has already been updated',
      'CRITICAL: Audit has already been invalidated',
      'CRITICAL: Derived state has already been cleared',
      'Deploy must remain locked',
      'Manual intervention required to verify session state consistency'
    ],
    'BLOCKED: Session finalization failed - vault and audit already mutated',
    true
  );
}

// Validate finalization result
if (!finalizationResult || typeof finalizationResult.success !== 'boolean') {
  return createBlockedResult(
    RealPromotionBlockCategory.SESSION_CLEAR,
    [
      'Session finalization callback returned invalid result (missing success field)',
      'CRITICAL: Vault has already been updated',
      'CRITICAL: Audit has already been invalidated',
      'CRITICAL: Derived state has already been cleared',
      'Deploy must remain locked',
      'Manual intervention required to verify session state consistency'
    ],
    'BLOCKED: Session finalization callback contract violation - vault and audit already mutated',
    true
  );
}

if (!finalizationResult.success) {
  return createBlockedResult(
    RealPromotionBlockCategory.SESSION_CLEAR,
    [
      'Session finalization callback reported failure',
      finalizationResult.error || 'No error message provided',
      'CRITICAL: Vault has already been updated',
      'CRITICAL: Audit has already been invalidated',
      'CRITICAL: Derived state has already been cleared',
      'Deploy must remain locked',
      'Manual intervention required to verify session state consistency'
    ],
    'BLOCKED: Session finalization failed - vault and audit already mutated',
    true
  );
}

// Session finalization succeeded
console.log('[PROMOTION_HANDLER] Phase 8 (Task 10): Session finalization succeeded');
```

#### 4.2 Update Success Result Creation

```typescript
// Update the createSuccessResult call (around line 1159)
return createSuccessResult({
  executionId,
  newVault: clonedSessionDraft,
  vaultSnapshot: clonedCanonicalVault,
  languageCount: Object.keys(clonedSessionDraft).length,
  promotedLanguages: Object.keys(clonedSessionDraft),
  snapshotIdentity: input.snapshotBinding.snapshotIdentity,
  invalidatedAt,
  derivedStateCleared,
  derivedStateClearWarning: derivedStateClearWarning || undefined,
  sessionDraftCleared: true,  // NOW TRUE (Task 10 complete)
  clearedAt                   // NOW POPULATED (Task 10 complete)
});
```

---

## Verification Checklist

### Pre-Implementation Verification:
- [ ] Read TASK-10-DESIGN-ADJUSTMENT-AUDIT.md
- [ ] Understand why direct `clearLocalDraftSession()` is unsafe
- [ ] Understand archive-before-clear approach
- [ ] Review current implementation state (Tasks 7-9)

### Phase 1 Verification (Types):
- [ ] `PromotionFinalizationSummary` interface added
- [ ] `finalizePromotionSession` callback added to input interface
- [ ] `finalizationSummary` field added to success interface
- [ ] `sessionClear` fields updated to reflect Task 10 completion
- [ ] TypeScript compilation succeeds

### Phase 2 Verification (Controller):
- [ ] `archivePromotionSession()` function implemented
- [ ] Function is read-only (no mutations)
- [ ] Function returns null when no session exists
- [ ] Function builds complete archive summary
- [ ] Function exported from controller hook

### Phase 3 Verification (Page):
- [ ] `promotionFinalizationSummary` state added
- [ ] `finalizePromotionSession` callback implemented
- [ ] Callback archives BEFORE clearing
- [ ] Callback handles errors gracefully
- [ ] Callback returns structured result

### Phase 4 Verification (Handler):
- [ ] Guard 10 implemented (callback presence check)
- [ ] Callback invocation wrapped in try-catch
- [ ] Result validation implemented
- [ ] Blocked result returned on failure with CRITICAL warnings
- [ ] Success result updated with finalization data
- [ ] Console logging added for debugging

### Post-Implementation Verification:
- [ ] Audit trail preserved in `promotionFinalizationSummary`
- [ ] Session state cleared (localDraftCopy === null)
- [ ] Session ledger cleared (sessionRemediationLedger.length === 0)
- [ ] Session audit cleared (sessionAuditResult === null)
- [ ] Deploy remains locked (verified by isDeployBlocked logic)
- [ ] No backend calls made
- [ ] No persistence occurred
- [ ] Error handling works correctly

---

## Safety Boundaries

### Task 10 MUST NOT:
- ❌ Unlock deploy
- ❌ Call backend/API/database/provider
- ❌ Persist data to storage
- ❌ Publish/save/deploy content
- ❌ Copy session audit into canonical audit
- ❌ Auto-run canonical re-audit
- ❌ Implement rollback
- ❌ Wire onPromote unless explicitly part of later UI task

### Task 10 MUST:
- ✅ Archive audit trail before clearing
- ✅ Clear session draft state
- ✅ Preserve traceability in page-level state
- ✅ Keep deploy locked
- ✅ Fail-hard on finalization failure
- ✅ Return blocked result with CRITICAL warnings on failure
- ✅ Maintain memory-only operations

---

## Deploy Lock Confirmation

### After Task 10 Completes:

**Session State:**
- `localDraftCopy` → `null` ✅
- `sessionRemediationLedger` → `[]` ✅
- `sessionAuditResult` → `null` ✅

**Page-Level State:**
- `globalAudit` → `null` (invalidated in Task 8) ✅
- `auditResult` → `null` (cleared in Task 9) ✅
- `transformedArticle` → `null` (cleared in Task 9) ✅
- `promotionFinalizationSummary` → `{...}` (archived in Task 10) ✅

**Deploy Lock Status:** 🔒 **REMAINS LOCKED**

**Blocking Conditions:**
1. `globalAudit` is `null` → Deploy blocked ✅
2. `auditResult` is `null` → Deploy blocked ✅
3. `transformedArticle` is `null` → Deploy blocked ✅

**Multiple Independent Locks:** Even though `hasSessionDraft` becomes `false`, three other independent conditions still block deploy. This is **defense-in-depth** design.

---

## Error Handling Strategy

### Fail-Hard Approach:
- Vault and audit are already mutated (Tasks 7 & 8)
- Derived state is already cleared (Task 9)
- Session finalization failure leaves inconsistent state
- Operator needs to know finalization failed
- Manual intervention may be required

### Error Response:
```typescript
{
  success: false,
  blockCategory: RealPromotionBlockCategory.SESSION_CLEAR,
  blockReasons: [
    'Session finalization callback reported failure',
    '<error message>',
    'CRITICAL: Vault has already been updated',
    'CRITICAL: Audit has already been invalidated',
    'CRITICAL: Derived state has already been cleared',
    'Deploy must remain locked',
    'Manual intervention required to verify session state consistency'
  ],
  summary: 'BLOCKED: Session finalization failed - vault and audit already mutated',
  mutationOccurred: false,
  lockAcquired: true
}
```

---

## Implementation Order

1. **Phase 1**: Type definitions (no runtime impact)
2. **Phase 2**: Controller enhancement (pure function, no side effects)
3. **Phase 3**: Page-level wiring (callback implementation)
4. **Phase 4**: Handler implementation (Phase 8 TODO replacement)
5. **Verification**: Run through verification checklist

---

## Files to Modify

### Primary Files:
1. `lib/editorial/session-draft-promotion-6b2b-types.ts` (Phase 1)
2. `app/admin/warroom/hooks/useLocalDraftRemediationController.ts` (Phase 2)
3. `app/admin/warroom/page.tsx` (Phase 3)
4. `app/admin/warroom/handlers/promotion-execution-handler.ts` (Phase 4)

### Files to Read (Context):
- `.kiro/specs/task-6b-2b-real-local-promotion-execution/tasks.md`
- `.kiro/specs/task-6b-2b-real-local-promotion-execution/design.md`
- `TASK-10-DESIGN-ADJUSTMENT-AUDIT.md`
- `TASK-10-SESSION-CLEAR-INTELLIGENCE-REPORT.md`

---

## Next Steps

1. **Review this implementation plan** with the user
2. **Confirm design adjustment approval** (Option B: Archive Before Clear)
3. **Begin Phase 1** (Type definitions)
4. **Proceed sequentially** through Phases 2-4
5. **Run verification checklist** after each phase
6. **Final verification** after Phase 4 complete

---

## Critical Success Factors

### Must Have:
- ✅ Audit trail preserved
- ✅ Session state cleared
- ✅ Deploy remains locked
- ✅ Fail-hard error handling
- ✅ No backend calls
- ✅ No persistence

### Must Not Have:
- ❌ Audit trail loss
- ❌ Deploy unlock
- ❌ Backend calls
- ❌ Data persistence
- ❌ Silent failures

---

**Implementation Plan Status:** READY FOR EXECUTION  
**Design Adjustment Status:** APPROVED  
**Safety Review Status:** PASSED  
**Traceability Review Status:** PASSED

**Proceed with implementation when ready.**
