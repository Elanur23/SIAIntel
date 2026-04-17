# PHASE 3 BATCH 07 — GROQ TPD TERMINAL PROPAGATION FIX COMPLETE

**STATUS**: ✅ COMPLETE  
**TIMESTAMP**: 2026-04-03T[CURRENT]  
**SCOPE**: Surgical fix for TPD terminal semantics loss during error propagation  
**FILES MODIFIED**: 2  
**LINES CHANGED**: ~40 lines

---

## EXECUTIVE SUMMARY

**PROBLEM**: TPD (Tokens Per Day) exhaustion errors were correctly marked as `terminal=true` and `quotaType='TPD'` in `groq-provider.ts`, but these properties were **lost during error propagation** through `llm-provider.ts`, causing the orchestrator to misclassify them as `RETRYABLE` instead of `FATAL_NON_RETRYABLE`.

**ROOT CAUSE IDENTIFIED**:
1. **Line 260-280 in `groq-provider.ts`**: TPD errors correctly marked with `error.terminal = true` and `error.quotaType = 'TPD'`
2. **Line 171 in `llm-provider.ts`**: Error re-wrapped with `throw new Error(...)`, **losing all custom properties**
3. **Line 1081-1149 in `master-orchestrator.ts`**: Only checked `error.message.includes('rate limit')`, couldn't see lost `terminal` or `quotaType` properties

**SOLUTION APPLIED**: 
- Preserve error properties during re-wrapping in `llm-provider.ts`
- Add TPD-specific classification logic in `master-orchestrator.ts`
- Add forensic telemetry at classification boundary

---

## PATCH 1: LLM PROVIDER ERROR PRESERVATION

**FILE**: `lib/neural-assembly/llm-provider.ts`  
**LOCATION**: Lines 165-171 (error catch block)  
**CHANGE TYPE**: Error property preservation

### BEFORE (Property Loss)
```typescript
} catch (error: any) {
  // FORENSIC TELEMETRY: Log provider failure propagation
  console.log(`[FORENSIC:LLM_PROVIDER:GROQ_FAILURE] errorMessage=${error.message} errorStatus=${error.status} errorQuotaType=${error.quotaType} errorRetryAfter=${error.retryAfter}`);
  
  console.error('[FORENSIC:GROQ_API_CALL_FAILED]', JSON.stringify({
    timestamp: new Date().toISOString(),
    errorMessage: error.message
  }))
  throw new Error(`Groq provider error: ${error.message}`)  // ❌ LOSES PROPERTIES
}
```

### AFTER (Property Preservation)
```typescript
} catch (error: any) {
  // FORENSIC TELEMETRY: Log provider failure propagation
  console.log(`[FORENSIC:LLM_PROVIDER:GROQ_FAILURE] errorMessage=${error.message} errorStatus=${error.status} errorQuotaType=${error.quotaType} errorRetryAfter=${error.retryAfter} errorTerminal=${error.terminal}`);
  
  console.error('[FORENSIC:GROQ_API_CALL_FAILED]', JSON.stringify({
    timestamp: new Date().toISOString(),
    errorMessage: error.message
  }))
  
  // PHASE 3 TPD FIX: Preserve error properties (terminal, quotaType, retryAfter) during propagation
  const wrappedError: any = new Error(`Groq provider error: ${error.message}`)
  wrappedError.terminal = error.terminal
  wrappedError.quotaType = error.quotaType
  wrappedError.retryAfter = error.retryAfter
  wrappedError.status = error.status
  wrappedError.originalError = error
  
  throw wrappedError  // ✅ PRESERVES PROPERTIES
}
```

**WHY SAFE**:
- Only adds property copying, doesn't change control flow
- Preserves original error message
- Maintains backward compatibility (properties are optional)
- Adds `originalError` for debugging

---

## PATCH 2: ORCHESTRATOR TPD CLASSIFICATION

**FILE**: `lib/neural-assembly/master-orchestrator.ts`  
**LOCATION**: Lines 1080-1150 (error classification logic)  
**CHANGE TYPE**: Add TPD-specific terminal handling

### BEFORE (TPD Misclassified as Retryable)
```typescript
} catch (error: any) {
  // RUNTIME WIRING: Classify failure and set cooldown if needed
  const isRateLimit = error.message?.includes('rate limit') || error.status === 429
  const isFatal = error.status === 401 || error.status === 403
  
  if (isRateLimit) {
    // ... sets COOLDOWN_RETRYABLE
  } else if (isFatal) {
    // ... sets FATAL_NON_RETRYABLE
  }
  
  logFailure('ORCHESTRATOR', 'GENERATE_EDITION', error, {
    batch_id: `batch-${mic.id}`,
    provider,
    failure_class: isRateLimit ? 'COOLDOWN_RETRYABLE' : isFatal ? 'FATAL_NON_RETRYABLE' : 'RETRYABLE'
    // ❌ TPD falls into 'RETRYABLE' bucket
  })
```

### AFTER (TPD Correctly Classified as Fatal)
```typescript
} catch (error: any) {
  // RUNTIME WIRING: Classify failure and set cooldown if needed
  // PHASE 3 TPD FIX: Check for terminal TPD exhaustion FIRST
  const isTPDExhaustion = error.terminal === true && error.quotaType === 'TPD'
  const isRateLimit = error.message?.includes('rate limit') || error.status === 429
  const isFatal = error.status === 401 || error.status === 403
  
  // FORENSIC TELEMETRY: Log error classification
  console.log(`[FORENSIC:ORCHESTRATOR:ERROR_CLASSIFICATION] isTPDExhaustion=${isTPDExhaustion} isRateLimit=${isRateLimit} isFatal=${isFatal} errorTerminal=${error.terminal} errorQuotaType=${error.quotaType} errorRetryAfter=${error.retryAfter}`);
  
  if (isTPDExhaustion) {
    // PHASE 3 TPD FIX: TPD exhaustion is TERMINAL - set long cooldown and mark as fatal
    const retryAfter = error.retryAfter || 3600 // Default 1 hour if not specified
    db.setProviderCooldown({
      provider,
      cooldown_until: Date.now() + (retryAfter * 1000),
      retry_after: retryAfter,
      failure_count: (cooldown?.failure_count || 0) + 1,
      failure_reason: 'Daily token quota exhausted (TPD)',
      failure_class: 'FATAL_NON_RETRYABLE',  // ✅ TERMINAL
      last_failure: Date.now(),
      updated_at: Date.now()
    })
    
    logOperation('ORCHESTRATOR', 'GENERATE_EDITION', 'ERROR', `TPD exhaustion - batch must be abandoned`, {
      trace_id: mic.id,
      edition_id,
      language,
      provider,
      status: 'TPD_EXHAUSTED',
      failure_class: 'FATAL_NON_RETRYABLE',
      metadata: { 
        retry_after_seconds: retryAfter,
        quota_type: 'TPD',
        terminal: true
      }
    })
    
    metrics.increment('provider_tpd_exhaustion_total')
  } else if (isRateLimit) {
    // ... existing TPM handling
  }
  
  // PHASE 3 TPD FIX: Determine failure class based on terminal status
  const failureClass = isTPDExhaustion 
    ? 'FATAL_NON_RETRYABLE'  // ✅ TPD is terminal
    : isRateLimit 
      ? 'COOLDOWN_RETRYABLE' 
      : isFatal 
        ? 'FATAL_NON_RETRYABLE' 
        : 'RETRYABLE'
  
  logFailure('ORCHESTRATOR', 'GENERATE_EDITION', error, {
    batch_id: `batch-${mic.id}`,
    provider,
    failure_class: failureClass,
    metadata: {
      quota_type: error.quotaType || 'UNKNOWN',  // ✅ Now preserved
      terminal: error.terminal || false,
      retry_after: error.retryAfter
    }
  })
```

**WHY SAFE**:
- Checks TPD **before** generic rate limit check (priority order)
- Only affects errors with `terminal=true` and `quotaType='TPD'`
- Existing TPM/cooldown logic unchanged
- Adds forensic telemetry for verification
- Preserves all existing error paths

---

## ERROR PROPAGATION CHAIN (FIXED)

### BEFORE (Properties Lost)
```
groq-provider.ts (Line 260-280)
  ↓ error.terminal = true
  ↓ error.quotaType = 'TPD'
  ↓ error.retryAfter = 961
  
llm-provider.ts (Line 171)
  ↓ throw new Error(...)  ❌ PROPERTIES LOST
  
master-orchestrator.ts (Line 1081-1149)
  ↓ Only sees error.message
  ↓ Classifies as 'RETRYABLE'  ❌ WRONG
  ↓ Continues to next language  ❌ WRONG
```

### AFTER (Properties Preserved)
```
groq-provider.ts (Line 260-280)
  ↓ error.terminal = true
  ↓ error.quotaType = 'TPD'
  ↓ error.retryAfter = 961
  
llm-provider.ts (Line 171-178)
  ↓ wrappedError.terminal = error.terminal  ✅ PRESERVED
  ↓ wrappedError.quotaType = error.quotaType  ✅ PRESERVED
  ↓ wrappedError.retryAfter = error.retryAfter  ✅ PRESERVED
  
master-orchestrator.ts (Line 1083-1120)
  ↓ isTPDExhaustion = true  ✅ DETECTED
  ↓ Classifies as 'FATAL_NON_RETRYABLE'  ✅ CORRECT
  ↓ Sets long cooldown  ✅ CORRECT
  ↓ Batch should abandon  ✅ CORRECT
```

---

## FORENSIC TELEMETRY ADDED

### 1. LLM Provider Layer
```typescript
console.log(`[FORENSIC:LLM_PROVIDER:GROQ_FAILURE] errorMessage=${error.message} errorStatus=${error.status} errorQuotaType=${error.quotaType} errorRetryAfter=${error.retryAfter} errorTerminal=${error.terminal}`);
```

### 2. Orchestrator Classification Layer
```typescript
console.log(`[FORENSIC:ORCHESTRATOR:ERROR_CLASSIFICATION] isTPDExhaustion=${isTPDExhaustion} isRateLimit=${isRateLimit} isFatal=${isFatal} errorTerminal=${error.terminal} errorQuotaType=${error.quotaType} errorRetryAfter=${error.retryAfter}`);
```

### 3. Structured Failure Logging
```typescript
logFailure('ORCHESTRATOR', 'GENERATE_EDITION', error, {
  batch_id: `batch-${mic.id}`,
  provider,
  failure_class: failureClass,
  metadata: {
    quota_type: error.quotaType || 'UNKNOWN',  // Now shows 'TPD'
    terminal: error.terminal || false,          // Now shows true
    retry_after: error.retryAfter               // Now shows 961
  }
})
```

---

## EXPECTED BATCH 07 BEHAVIOR (NEXT RUN)

### BEFORE FIX (Observed)
```
[EN] ✅ Success
[TR] ❌ GROQ_TPD_EXHAUSTED (retryAfterSeconds=961, quotaType=TPD, terminal=true)
     ↓ Logged as failure_class=RETRYABLE  ❌ WRONG
     ↓ quota_type='UNKNOWN'  ❌ WRONG
[DE] 🔄 Attempted (should have stopped)  ❌ WRONG
[FR] 🔄 Attempted (should have stopped)  ❌ WRONG
... (all remaining languages attempted)
```

### AFTER FIX (Expected)
```
[EN] ✅ Success
[TR] ❌ GROQ_TPD_EXHAUSTED (retryAfterSeconds=961, quotaType=TPD, terminal=true)
     ↓ [FORENSIC:ORCHESTRATOR:ERROR_CLASSIFICATION] isTPDExhaustion=true  ✅
     ↓ Logged as failure_class=FATAL_NON_RETRYABLE  ✅ CORRECT
     ↓ quota_type='TPD'  ✅ CORRECT
     ↓ terminal=true  ✅ CORRECT
     ↓ Cooldown set for 961s  ✅ CORRECT
[DE] ⏸️  BLOCKED: Provider in cooldown  ✅ CORRECT
[FR] ⏸️  BLOCKED: Provider in cooldown  ✅ CORRECT
... (all remaining languages blocked by cooldown)
```

---

## VERIFICATION CHECKLIST (BATCH 07 NEXT RUN)

### Log Strings to Grep For

#### ✅ SUCCESS INDICATORS
```bash
# 1. TPD detection at provider level
grep "FORENSIC:GROQ_PROVIDER:429_PARSED.*quotaType=TPD" batch-07-logs.txt

# 2. Property preservation at LLM layer
grep "FORENSIC:LLM_PROVIDER:GROQ_FAILURE.*errorTerminal=true.*errorQuotaType=TPD" batch-07-logs.txt

# 3. Correct classification at orchestrator
grep "FORENSIC:ORCHESTRATOR:ERROR_CLASSIFICATION.*isTPDExhaustion=true" batch-07-logs.txt

# 4. Terminal failure class logged
grep "failure_class.*FATAL_NON_RETRYABLE.*quota_type.*TPD" batch-07-logs.txt

# 5. Cooldown blocks subsequent languages
grep "GROQ_COOLDOWN_ACTIVE.*Provider in cooldown" batch-07-logs.txt
```

#### ❌ FAILURE INDICATORS (Should NOT Appear)
```bash
# 1. TPD classified as retryable (OLD BUG)
grep "failure_class.*RETRYABLE.*TPD" batch-07-logs.txt  # Should be EMPTY

# 2. Unknown quota type (OLD BUG)
grep "quota_type.*UNKNOWN" batch-07-logs.txt  # Should be EMPTY

# 3. Languages attempted after TPD (OLD BUG)
# Check if DE/FR/ES/RU/AR/JP/ZH show "REAL_API_CALL_IMMINENT" after TR fails
grep "REAL_API_CALL_IMMINENT" batch-07-logs.txt | grep -A1 "language.*tr"
# Should NOT be followed by DE/FR/etc attempts
```

---

## PASS/FAIL CRITERIA

### ✅ PASS CONDITIONS
1. **TPD Error Detected**: `quotaType=TPD` appears in provider logs
2. **Properties Preserved**: `errorTerminal=true` and `errorQuotaType=TPD` appear in LLM layer logs
3. **Correct Classification**: `isTPDExhaustion=true` appears in orchestrator logs
4. **Terminal Failure Class**: `failure_class=FATAL_NON_RETRYABLE` with `quota_type=TPD`
5. **Cooldown Activated**: Subsequent languages blocked with `GROQ_COOLDOWN_ACTIVE`
6. **No Wasted Attempts**: DE/FR/ES/RU/AR/JP/ZH do NOT show `REAL_API_CALL_IMMINENT`

### ❌ FAIL CONDITIONS
1. **Property Loss**: `quota_type=UNKNOWN` appears in logs
2. **Misclassification**: `failure_class=RETRYABLE` with TPD error
3. **Wasted Attempts**: Languages attempted after TPD exhaustion
4. **No Cooldown**: Subsequent languages not blocked

---

## TECHNICAL DEBT NOTES

### Future Improvements (Out of Scope)
1. **Typed Error Classes**: Replace `any` with proper `ProviderError` interface
2. **Error Middleware**: Centralized error transformation layer
3. **Quota Type Enum**: Replace string literals with enum
4. **Retry Strategy**: Exponential backoff for non-terminal errors

### Known Limitations
1. **Manual Property Copying**: Relies on explicit property assignment (no automatic spread)
2. **Type Safety**: Error properties are `any` type (TypeScript doesn't enforce)
3. **Backward Compatibility**: Old code may not expect new properties

---

## FILES MODIFIED

### 1. lib/neural-assembly/llm-provider.ts
- **Lines Changed**: 165-178 (error catch block)
- **Change**: Preserve error properties during re-wrapping
- **Risk**: LOW (additive change, no behavior modification)

### 2. lib/neural-assembly/master-orchestrator.ts
- **Lines Changed**: 1080-1195 (error classification logic)
- **Change**: Add TPD-specific classification before generic rate limit check
- **Risk**: LOW (priority-based classification, existing paths unchanged)

---

## ROLLBACK PLAN

If Batch 07 shows unexpected behavior:

### Quick Rollback (Git)
```bash
git diff HEAD~1 lib/neural-assembly/llm-provider.ts
git diff HEAD~1 lib/neural-assembly/master-orchestrator.ts
git revert HEAD
```

### Manual Rollback (llm-provider.ts)
```typescript
// Revert to simple re-throw
throw new Error(`Groq provider error: ${error.message}`)
```

### Manual Rollback (master-orchestrator.ts)
```typescript
// Remove isTPDExhaustion check, revert to original logic
const isRateLimit = error.message?.includes('rate limit') || error.status === 429
const isFatal = error.status === 401 || error.status === 403
```

---

## CONCLUSION

**PATCH STATUS**: ✅ APPLIED AND READY FOR VERIFICATION

**NEXT STEP**: Execute Batch 07 and verify:
1. TPD terminal semantics preserved end-to-end
2. Correct `FATAL_NON_RETRYABLE` classification
3. Cooldown blocks subsequent languages
4. No wasted API calls after TPD exhaustion

**EXPECTED OUTCOME**: Batch 07 will fail fast on TPD exhaustion (after EN success, TR failure), preventing wasted attempts on remaining 7 languages.

**FORENSIC VERIFICATION**: All classification decisions now logged with explicit `isTPDExhaustion`, `errorTerminal`, `errorQuotaType` values for post-mortem analysis.

---

**PATCH COMPLETE** — Ready for Batch 07 Live Validation  
**TIMESTAMP**: 2026-04-03T[CURRENT]  
**OPERATOR**: Kiro AI Surgical Patch System  
**APPROVAL**: Pending Runtime Verification
