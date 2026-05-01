# Task 10: Session Draft Clear Intelligence Report

**Date:** 2026-04-30  
**Mission:** READ-ONLY helper intelligence for Task 10 implementation  
**Status:** ✅ SAFE TO IMPLEMENT

---

## A. VERDICT

**TASK_10_SAFE_TO_IMPLEMENT** ✅

Task 10 can safely clear the session draft without accidentally unlocking deploy. All safety boundaries are correctly enforced.

---

## B. SESSION CLEAR FUNCTION MAP

### Location
**File:** `app/admin/warroom/hooks/useLocalDraftRemediationController.ts`  
**Function:** `clearLocalDraftSession` (lines 73-82)

### Function Signature
```typescript
const clearLocalDraftSession = useCallback(() => {
  setLocalDraftCopy(null);
  setSessionRemediationLedger([]);
  setLatestRollbackEvent(null);
  setSessionAuditInvalidation(null);
  // Clear session audit
  setSessionAuditResult(null);
  setSessionAuditLifecycle(SessionAuditLifecycle.NOT_RUN);
}, []);
```

### Invocation Context
- **Exported from:** `useLocalDraftRemediationController` hook
- **Available in:** `app/admin/warroom/page.tsx` as `remediationController.clearLocalDraftSession`
- **Current usage:** Called when article changes (line 267) and when no article selected

---

## C. EXACT CLEARLOCALDRAFTSESSION BEHAVIOR

### States Cleared by clearLocalDraftSession:

1. ✅ **localDraftCopy** → `null`
2. ✅ **sessionRemediationLedger** → `[]` (empty array)
3. ✅ **latestRollbackEvent** → `null`
4. ✅ **sessionAuditInvalidation** → `null`
5. ✅ **sessionAuditResult** → `null`
6. ✅ **sessionAuditLifecycle** → `SessionAuditLifecycle.NOT_RUN`

### States NOT Touched by clearLocalDraftSession:

1. ❌ **promotionDryRunResult** — NOT cleared (page-level state, not in controller)
2. ❌ **globalAudit** — NOT cleared (page-level state, not in controller)
3. ❌ **auditResult** — NOT cleared (page-level state, not in controller)
4. ❌ **transformedArticle** — NOT cleared (page-level state, not in controller)
5. ❌ **transformError** — NOT cleared (page-level state, not in controller)
6. ❌ **vault** — NOT cleared (canonical vault state, not in controller)

---

## D. STATES TASK 10 SHOULD CLEAR

Task 10 should invoke `clearLocalDraftSession()` which clears:

### Session Draft State (Controller-Managed):
1. ✅ **localDraftCopy** — Session draft content
2. ✅ **sessionRemediationLedger** — Applied remediation events
3. ✅ **latestRollbackEvent** — Last rollback event
4. ✅ **sessionAuditInvalidation** — Session audit invalidation state
5. ✅ **sessionAuditResult** — Session audit result
6. ✅ **sessionAuditLifecycle** — Session audit lifecycle state

**CRITICAL:** Task 10 should ONLY call `clearLocalDraftSession()`. No additional state clearing required.

---

## E. STATES TASK 10 SHOULD PRESERVE

Task 10 must NOT clear these states (they are NOT in clearLocalDraftSession):

### Page-Level State (Already Handled):
1. ✅ **promotionDryRunResult** — Preserved for traceability (page-level)
2. ✅ **globalAudit** — Already invalidated in Task 8 (page-level)
3. ✅ **auditResult** — Already cleared in Task 9 (page-level)
4. ✅ **transformedArticle** — Already cleared in Task 9 (page-level)
5. ✅ **transformError** — Already cleared in Task 9 (page-level)

### Canonical State (Never Touched):
6. ✅ **vault** — Canonical vault (already updated in Task 7)

**SAFETY CONFIRMATION:** `clearLocalDraftSession()` does NOT touch any of these states.

---

## F. PROMOTION DRY RUN RESULT RECOMMENDATION

**PRESERVE** ✅

**Rationale:**
- `promotionDryRunResult` is page-level state (not in controller)
- Provides audit trail of promotion intent
- Useful for debugging and verification
- Does NOT block deploy (deploy lock is controlled by other factors)
- `clearLocalDraftSession()` does NOT clear this state

**Action:** No action required. Task 10 should NOT clear `promotionDryRunResult`.

---

## G. SESSION LEDGER / AUDIT TRAIL RECOMMENDATION

**CLEAR** ✅

**Rationale:**
- Session ledger is session-scoped state
- After successful promotion, session draft no longer exists
- Ledger is tied to session draft lifecycle
- Clearing ledger is consistent with clearing session draft
- `clearLocalDraftSession()` already clears `sessionRemediationLedger`

**Action:** No additional action required. `clearLocalDraftSession()` handles this correctly.

---

## H. CALLBACK CONTRACT RECOMMENDATION

### Callback Signature
```typescript
clearSessionDraft: () => LocalMutationCallbackResult
```

### Implementation in warroom page.tsx
```typescript
const clearSessionDraft = useCallback((): LocalMutationCallbackResult => {
  try {
    remediationController.clearLocalDraftSession();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Session clear failed'
    };
  }
}, [remediationController]);
```

### Wiring in RealPromotionExecutionInput
```typescript
const input: RealPromotionExecutionInput = {
  // ... other fields
  clearSessionDraft: clearSessionDraft
};
```

**Contract Properties:**
- Pure state setter (no side effects)
- No backend calls
- No persistence
- Returns structured result with success/error
- Fail-hard: returns `success: false` on any error

---

## I. FAILURE HANDLING RECOMMENDATION

**FAIL-HARD** ✅

**Rationale:**
- Vault and audit are already mutated (Tasks 7 & 8)
- Derived state is already cleared (Task 9)
- Session clear failure leaves inconsistent state
- Operator needs to know session clear failed
- Manual intervention may be required

### Error Handling Strategy:

```typescript
// PHASE 8 — Session draft clear step (Task 10)
if (!input.clearSessionDraft || typeof input.clearSessionDraft !== 'function') {
  return createBlockedResult(
    RealPromotionBlockCategory.SESSION_CLEAR,
    [
      'Session clear callback is missing or invalid',
      'CRITICAL: Vault has already been updated',
      'CRITICAL: Audit has already been invalidated',
      'CRITICAL: Derived state has already been cleared',
      'Deploy must remain locked',
      'Manual intervention required to verify session state consistency'
    ],
    'BLOCKED: Cannot clear session without callback - vault and audit already mutated',
    true
  );
}

let sessionClearResult: { success: boolean; error?: string };
try {
  sessionClearResult = input.clearSessionDraft();
} catch (sessionClearError) {
  return createBlockedResult(
    RealPromotionBlockCategory.SESSION_CLEAR,
    [
      'Session clear callback threw exception',
      `Error: ${sessionClearError instanceof Error ? sessionClearError.message : String(sessionClearError)}`,
      'CRITICAL: Vault has already been updated',
      'CRITICAL: Audit has already been invalidated',
      'CRITICAL: Derived state has already been cleared',
      'Deploy must remain locked',
      'Manual intervention required to verify session state consistency'
    ],
    'BLOCKED: Session clear failed - vault and audit already mutated',
    true
  );
}

// Validate session clear result
if (!sessionClearResult || typeof sessionClearResult.success !== 'boolean') {
  return createBlockedResult(
    RealPromotionBlockCategory.SESSION_CLEAR,
    [
      'Session clear callback returned invalid result (missing success field)',
      'CRITICAL: Vault has already been updated',
      'CRITICAL: Audit has already been invalidated',
      'CRITICAL: Derived state has already been cleared',
      'Deploy must remain locked',
      'Manual intervention required to verify session state consistency'
    ],
    'BLOCKED: Session clear callback contract violation - vault and audit already mutated',
    true
  );
}

if (!sessionClearResult.success) {
  return createBlockedResult(
    RealPromotionBlockCategory.SESSION_CLEAR,
    [
      'Session clear callback reported failure',
      sessionClearResult.error || 'No error message provided',
      'CRITICAL: Vault has already been updated',
      'CRITICAL: Audit has already been invalidated',
      'CRITICAL: Derived state has already been cleared',
      'Deploy must remain locked',
      'Manual intervention required to verify session state consistency'
    ],
    'BLOCKED: Session clear failed - vault and audit already mutated',
    true
  );
}
```

**Key Points:**
- Return blocked result with SESSION_CLEAR category
- Include CRITICAL warnings that vault/audit are already mutated
- Provide clear error message for operator
- Keep deploy locked
- Require manual intervention

---

## J. DEPLOY LOCK AFTER SESSION CLEAR REVIEW

### Deploy Lock Enforcement Location
**File:** `app/admin/warroom/page.tsx`  
**Function:** `isDeployBlocked` (lines 228-263)

### Current Deploy Lock Logic
```typescript
const isDeployBlocked = useMemo(() => {
  // Basic connectivity and ready checks
  if (!selectedNews || !vault[activeLang].ready || isPublishing || isTransforming || transformError) {
    return true;
  }

  // PHASE 3C-3C-3B-2B SAFETY GATE: Deploy remains locked when session draft exists
  // Full protocol re-audit and vault update required to unlock deploy.
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

### Deploy Lock After Task 10 Session Clear

**CRITICAL ANALYSIS:**

After Task 10 clears the session draft:
1. ✅ `remediationController.hasSessionDraft` → `false` (session cleared)
2. ❌ `globalAudit` → `null` (invalidated in Task 8)
3. ❌ `auditResult` → `null` (cleared in Task 9)
4. ❌ `transformedArticle` → `null` (cleared in Task 9)

**Deploy Lock Status:** ✅ **REMAINS LOCKED**

**Reason:** Even though `hasSessionDraft` becomes `false`, deploy is still blocked by:
- `globalAudit` is `null` (invalidated in Task 8)
- `auditResult` is `null` (cleared in Task 9)
- `transformedArticle` is `null` (cleared in Task 9)

**SAFETY CONFIRMATION:** Deploy cannot be unlocked after Task 10 session clear.

---

## K. REQUIRED VERIFICATION CHECKS

### Pre-Execution Checks (Already in Tasks 4-5):
1. ✅ Execution lock available
2. ✅ Dry-run preview exists and succeeded
3. ✅ Preconditions passed
4. ✅ Operator acknowledgements complete
5. ✅ Snapshot freshness verified
6. ✅ Payload verified

### Task 7 Verification (Already Complete):
7. ✅ Vault update callback provided
8. ✅ Vault update succeeded

### Task 8 Verification (Already Complete):
9. ✅ Audit invalidation callback provided
10. ✅ Audit invalidation succeeded

### Task 9 Verification (Already Complete):
11. ✅ Derived state clear attempted (fail-soft)

### Task 10 Verification (NEW):
12. ✅ Session clear callback provided
13. ✅ Session clear callback is a function
14. ✅ Session clear callback returns structured result
15. ✅ Session clear callback reports success
16. ✅ Session draft state is cleared (localDraftCopy === null)
17. ✅ Session ledger is cleared (sessionRemediationLedger.length === 0)
18. ✅ Session audit is cleared (sessionAuditResult === null)

### Post-Execution Verification:
19. ✅ Deploy remains locked (verified by isDeployBlocked logic)
20. ✅ No backend calls made
21. ✅ No persistence occurred
22. ✅ Execution lock released

---

## L. FINAL SAFETY BOUNDARY

### Task 10 MUST NOT:

1. ❌ **Unlock deploy** — Deploy lock controlled by `isDeployBlocked` logic
2. ❌ **Call backend/API/database/provider** — Pure React state mutation only
3. ❌ **Persist data** — No localStorage, sessionStorage, or backend writes
4. ❌ **Publish/save/deploy** — No content deployment
5. ❌ **Copy session audit into canonical audit** — Session audit is discarded
6. ❌ **Auto-run canonical re-audit** — Operator must manually trigger re-audit
7. ❌ **Implement rollback** — Rollback is deferred to future phase
8. ❌ **Wire onPromote** — Modal promotion button remains disabled (scaffold only)

### Task 10 MUST:

1. ✅ **Call clearLocalDraftSession()** — Invoke controller's session clear function
2. ✅ **Validate callback result** — Check success field and handle errors
3. ✅ **Return blocked result on failure** — Use SESSION_CLEAR block category
4. ✅ **Include CRITICAL warnings** — Indicate vault/audit already mutated
5. ✅ **Keep deploy locked** — No deploy unlock logic
6. ✅ **Update success result** — Set sessionDraftCleared: true, clearedAt: timestamp
7. ✅ **Release execution lock** — Ensure lock released in finally block

---

## M. FINAL RECOMMENDATION

**WRITE_TASK_10_IMPLEMENTATION_PROMPT** ✅

Task 10 is safe to implement with the following implementation plan:

### Implementation Steps:

1. **Add clearSessionDraft callback to RealPromotionExecutionInput** (types file)
   - Add callback signature to interface
   - Document callback contract

2. **Implement clearSessionDraft callback in warroom page.tsx**
   - Wrap `remediationController.clearLocalDraftSession()` in try-catch
   - Return structured result with success/error

3. **Wire callback in promotion execution input** (warroom page.tsx)
   - Pass callback to `executeRealLocalPromotion`

4. **Implement Phase 8 in promotion-execution-handler.ts**
   - Add guard for callback presence
   - Call callback with structured error handling
   - Validate callback result
   - Return blocked result on failure with CRITICAL warnings
   - Update success result with session clear confirmation

5. **Update createSuccessResult helper** (types file)
   - Accept sessionDraftCleared and clearedAt parameters
   - Update sessionClear object in success result

6. **Verify deploy lock preservation**
   - Confirm `isDeployBlocked` logic still blocks after session clear
   - Verify no deploy unlock path exists

7. **Test session clear behavior**
   - Verify session state is cleared
   - Verify deploy remains locked
   - Verify error handling works correctly

---

## CRITICAL SAFETY REASONING

### Why Task 10 Cannot Unlock Deploy:

**Deploy Lock Dependencies (from isDeployBlocked):**

1. **globalAudit must be non-null and publishable**
   - Task 8 set `globalAudit` to `null`
   - Task 10 does NOT restore `globalAudit`
   - Deploy blocked: ✅

2. **auditResult must be non-null**
   - Task 9 set `auditResult` to `null`
   - Task 10 does NOT restore `auditResult`
   - Deploy blocked: ✅

3. **transformedArticle must be non-null**
   - Task 9 set `transformedArticle` to `null`
   - Task 10 does NOT restore `transformedArticle`
   - Deploy blocked: ✅

4. **hasSessionDraft must be false**
   - Task 10 clears session draft
   - `hasSessionDraft` becomes `false`
   - But deploy is STILL blocked by items 1-3 above

**Conclusion:** Deploy remains locked after Task 10 because multiple independent conditions block deploy, and Task 10 only affects one of them (hasSessionDraft).

---

## EXECUTION SEQUENCE SUMMARY

### Complete Mutation Sequence (Tasks 7-10):

```
Phase 5 (Task 7):  Vault Update
                   ↓
                   vault[lang] = sessionDraftContent
                   ↓
Phase 6 (Task 8):  Canonical Audit Invalidation
                   ↓
                   globalAudit = null
                   ↓
Phase 7 (Task 9):  Derived State Clear (fail-soft)
                   ↓
                   auditResult = null
                   transformedArticle = null
                   transformError = null
                   ↓
Phase 8 (Task 10): Session Draft Clear (fail-hard)
                   ↓
                   clearLocalDraftSession()
                   ↓
                   localDraftCopy = null
                   sessionRemediationLedger = []
                   sessionAuditResult = null
                   sessionAuditLifecycle = NOT_RUN
                   sessionAuditInvalidation = null
                   latestRollbackEvent = null
                   ↓
                   SUCCESS RESULT
                   (deploy remains locked)
```

### State After Task 10 Completion:

**Canonical State:**
- ✅ vault: Updated with promoted content
- ❌ globalAudit: null (invalidated)

**Page-Level Derived State:**
- ❌ auditResult: null (cleared)
- ❌ transformedArticle: null (cleared)
- ❌ transformError: null (cleared)
- ✅ promotionDryRunResult: Preserved (not cleared)

**Session State:**
- ❌ localDraftCopy: null (cleared)
- ❌ sessionRemediationLedger: [] (cleared)
- ❌ sessionAuditResult: null (cleared)
- ❌ sessionAuditLifecycle: NOT_RUN (cleared)
- ❌ sessionAuditInvalidation: null (cleared)
- ❌ latestRollbackEvent: null (cleared)

**Deploy Status:**
- 🔒 Deploy: LOCKED (multiple blocking conditions)

---

## TASK 10 IMPLEMENTATION CHECKLIST

- [ ] Add `clearSessionDraft` callback to `RealPromotionExecutionInput` interface
- [ ] Implement `clearSessionDraft` callback in warroom page.tsx
- [ ] Wire callback in promotion execution input
- [ ] Implement Phase 8 in promotion-execution-handler.ts
- [ ] Add guard for callback presence
- [ ] Call callback with structured error handling
- [ ] Validate callback result
- [ ] Return blocked result on failure with CRITICAL warnings
- [ ] Update success result with session clear confirmation
- [ ] Update `createSuccessResult` helper to accept session clear parameters
- [ ] Verify deploy lock preservation after session clear
- [ ] Test session clear behavior
- [ ] Verify error handling works correctly
- [ ] Document session clear behavior
- [ ] Update tasks.md to mark Task 10 complete

---

## CONCLUSION

Task 10 is **SAFE TO IMPLEMENT** with the recommended callback contract and fail-hard error handling. The session clear operation:

1. ✅ Clears all session-scoped state correctly
2. ✅ Preserves audit trail (promotionDryRunResult)
3. ✅ Keeps deploy locked (multiple independent blocking conditions)
4. ✅ Provides clear error messages on failure
5. ✅ Follows fail-hard design (any failure blocks execution)
6. ✅ Maintains consistency with Tasks 7-9
7. ✅ Does not introduce any deploy unlock path
8. ✅ Does not call backend/API/database
9. ✅ Does not persist data
10. ✅ Releases execution lock in all cases

**PROCEED WITH TASK 10 IMPLEMENTATION** ✅

---

**Report Generated:** 2026-04-30  
**Auditor:** Kiro AI Assistant  
**Status:** ✅ APPROVED FOR IMPLEMENTATION
