# PHASE 3 BATCH 07 - PROVENANCE UNAVAILABLE FIX COMPLETE

**Status**: ✅ SURGICAL FIX APPLIED  
**Date**: 2026-04-03  
**Root Cause**: MIC parameter undefined at final batch persistence call site

---

## ACTUAL FAILING CALLER

**File**: `lib/neural-assembly/master-orchestrator.ts`  
**Line**: 1632  
**Function**: `publish()` - Production finalization path after delivery verification

**Why this is the one**:
1. FORENSIC-1-CALLSITE marker at line 1525 did NOT appear in failing execution
2. Failure occurred in final persistence after delivery verification reconciliation
3. Line 1632 is in the production path (not shadow mode)
4. Forensic evidence shows this exact call site had `mic = undefined`

---

## FILE MODIFIED

`lib/neural-assembly/master-orchestrator.ts`

---

## BEFORE BLOCK

```typescript
        // RUNTIME WIRING: Final batch persistence (RECONCILED)
        const finalBatch = blackboard.read(`batch.${batch.id}`) as BatchJob
        if (finalBatch) {
          const mic = db.getMIC(finalBatch.mic_id)
          await db.saveBatch(finalBatch, mic || undefined)
          db.saveCheckpoint('batch', finalBatch)
        }
```

---

## AFTER BLOCK

```typescript
        // RUNTIME WIRING: Final batch persistence (RECONCILED)
        const finalBatch = blackboard.read(`batch.${batch.id}`) as BatchJob
        if (finalBatch) {
          // PHASE 3 PROVENANCE FIX: Retrieve MIC for provenance verification
          // Use the original batch.mic_id as the authoritative source
          const micId = batch.mic_id || finalBatch.mic_id
          const mic = db.getMIC(micId)
          
          if (!mic) {
            logOperation('ORCHESTRATOR', 'PUBLISH_FINALIZATION', 'WARN', `MIC ${micId} not found during final persistence`, {
              batch_id: finalBatch.id,
              original_mic_id: batch.mic_id,
              finalBatch_mic_id: finalBatch.mic_id,
              using_mic_id: micId
            })
          }
          
          await db.saveBatch(finalBatch, mic || undefined)
          db.saveCheckpoint('batch', finalBatch)
        }
```

---

## ONE-LINE REASON

Use original `batch.mic_id` as authoritative source instead of potentially corrupted `finalBatch.mic_id` from blackboard state mutations.

---

## ROOT CAUSE ANALYSIS

### The Problem
The `finalBatch` object read from blackboard may have had its `mic_id` field corrupted or cleared during state mutations (atomicUpdate calls). When `db.getMIC(finalBatch.mic_id)` was called with a corrupted/empty MIC ID, it returned `null`, causing `mic || undefined` to evaluate to `undefined`.

### The Evidence
1. MIC was successfully saved to database (proven by immediate verification)
2. MIC retrieval works when using correct ID (proven by earlier successful calls)
3. Final saveBatch call had `mic = undefined` (proven by forensic logs)
4. Batch had valid `p2p_token`, `manifest`, `manifest_hash` (proven by forensic logs)
5. Only missing piece was the MIC parameter

### The Fix
Use the original `batch.mic_id` from the function parameter as the authoritative source, falling back to `finalBatch.mic_id` only if needed. The `batch` parameter is the original input to the `publish()` function and has not been subject to blackboard state mutations.

---

## VERIFICATION STEPS

1. **Execute Batch 07**:
   ```bash
   npx tsx scripts/execute-batch-07-live.ts
   ```

2. **Expected Outcome**:
   - EN generation succeeds
   - TR hits terminal TPD exhaustion
   - Remaining languages marked ABANDONED
   - Chief editor review completes
   - **saveBatch succeeds with MIC provenance verification**
   - No PROVENANCE_UNAVAILABLE error

3. **Success Criteria**:
   - Batch reaches FULLY_PUBLISHED or PARTIAL_PUBLISHED status
   - No terminal sink enforcer errors
   - Final batch record persisted to database

---

## ADDITIONAL SAFEGUARDS

The fix includes defensive logging to detect if MIC retrieval fails:

```typescript
if (!mic) {
  logOperation('ORCHESTRATOR', 'PUBLISH_FINALIZATION', 'WARN', `MIC ${micId} not found during final persistence`, {
    batch_id: finalBatch.id,
    original_mic_id: batch.mic_id,
    finalBatch_mic_id: finalBatch.mic_id,
    using_mic_id: micId
  })
}
```

This will help diagnose any future issues where MIC retrieval fails unexpectedly.

---

## RELATED FIXES

This fix complements the earlier instrumentation applied in:
- `lib/neural-assembly/master-orchestrator.ts` (FORENSIC-1-CALLSITE at line 1525)
- `lib/neural-assembly/database.ts` (FORENSIC-2-DB-ENTRY, FORENSIC-3-DB-CONTEXT)
- `lib/neural-assembly/stabilization/terminal-sink-enforcer.ts` (FORENSIC-4-ENFORCER)

The instrumentation can remain in place for future debugging or be removed once the fix is verified.

---

## IMPACT ASSESSMENT

**Scope**: Minimal - single call site fix  
**Risk**: Low - only changes MIC ID source selection logic  
**Behavior**: Preserved - all other logic unchanged  
**Security**: Maintained - zero-trust enforcement still active  

---

**Status**: Ready for verification  
**Next Step**: Execute Batch 07 and confirm successful completion
