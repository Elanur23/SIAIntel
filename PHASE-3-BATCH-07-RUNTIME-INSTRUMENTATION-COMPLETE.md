# PHASE 3 BATCH 07 - RUNTIME INSTRUMENTATION COMPLETE

**Status**: ✅ INSTRUMENTATION APPLIED  
**Date**: 2026-04-03  
**Objective**: Prove exact execution path for PROVENANCE_UNAVAILABLE failure

---

## PROVEN RUNTIME FACTS (FROM PREVIOUS RUNS)

1. ✅ `saveMIC` is executed successfully
2. ✅ Immediate `getMIC(mic.id)` returns FOUND
3. ✅ EN generation succeeds
4. ✅ TR hits terminal GROQ_TPD_EXHAUSTED
5. ✅ Remaining languages stopped and marked ABANDONED
6. ✅ `saveDecisionDNA` passes terminal sink verification
7. ❌ `saveBatch` fails with `PROVENANCE_UNAVAILABLE`
8. ✅ Failure-time batch JSON contains `p2p_token`, `manifest`, `manifest_hash`

---

## ROOT CAUSE HYPOTHESES (RANKED)

### 1. Call-Site Reference Loss (85% confidence)
**Theory**: `saveDecisionDNA` receives valid MIC, but downstream `saveBatch` call site in orchestrator passes `undefined`/`null` due to scoping or state mutation after TPD rejection routing.

**Evidence Supporting**:
- MIC persistence confirmed working
- Immediate verification shows MIC retrieval works
- `saveDecisionDNA` passes (proves MIC available at that point)
- `saveBatch` fails (suggests MIC lost between calls)

**What instrumentation will prove**:
- FORENSIC-1 will show if `getMIC` returns FOUND but `saveBatch` receives UNDEFINED

---

### 2. Context Assembly Omission (10% confidence)
**Theory**: `database.saveBatch` receives MIC successfully, but internal mapping drops it when constructing `VerifierContext` for enforcer.

**Evidence Supporting**:
- Less likely given the code structure
- Context is built inline at call site

**What instrumentation will prove**:
- FORENSIC-2 will show MIC received at entry
- FORENSIC-3 will show if context.mic is UNDEFINED despite receiving MIC

---

### 3. SignedClaims DTO Stripping (5% confidence)
**Theory**: MIC makes it to verifier, but `batch.p2p_token` not correctly parsed into `signedClaims` object, or token claims provenance but `context.mic` is missing.

**Evidence Supporting**:
- Least likely given proven token structure
- Token parsing has been stable

**What instrumentation will prove**:
- FORENSIC-4 will show if signedClaims has digests but context.mic is UNDEFINED

---

## INSTRUMENTATION APPLIED

### FORENSIC-1-CALLSITE: Orchestrator Publish Call Site
**File**: `lib/neural-assembly/master-orchestrator.ts`  
**Location**: Lines 1501-1527 (before and after `db.saveBatch`)

**Purpose**: Prove what the orchestrator passes to `saveBatch`

**Logs**:
```
🔬 [FORENSIC-1-CALLSITE] BEFORE getMIC:
   Batch ID: {batch.id}
   MIC ID from batch: {batch.mic_id}
   Batch has p2p_token: {boolean}
   Batch has manifest: {boolean}
   Batch has manifest_hash: {boolean}

🔬 [FORENSIC-1-CALLSITE] AFTER getMIC:
   getMIC result: {FOUND|NULL}
   MIC ID: {mic.id}
   MIC Version: {mic.version}

🔬 [FORENSIC-1-CALLSITE] BEFORE saveBatch:
   Passing mic parameter: {VALID_OBJECT|UNDEFINED}
   MIC parameter ID: {mic.id}
   MIC parameter Version: {mic.version}
```

---

### FORENSIC-2-DB-ENTRY: Database saveBatch Entry Point
**File**: `lib/neural-assembly/database.ts`  
**Location**: Lines 587-604 (at function entry)

**Purpose**: Prove what `saveBatch` receives as parameters

**Logs**:
```
🔬 [FORENSIC-2-DB-ENTRY] saveBatch called:
   Batch ID: {batch.id}
   Batch MIC ID: {batch.mic_id}
   Batch has p2p_token: {boolean}
   Batch has manifest: {boolean}
   Batch has manifest_hash: {boolean}
   MIC parameter received: {VALID_OBJECT|UNDEFINED}
   MIC parameter ID: {mic.id}
   MIC parameter Version: {mic.version}
```

---

### FORENSIC-3-DB-CONTEXT: Context Assembly Before Enforcer
**File**: `lib/neural-assembly/database.ts`  
**Location**: Lines 623-632 (before `enforceSinkGate` call)

**Purpose**: Prove what context is passed to the enforcer

**Logs**:
```
🔬 [FORENSIC-3-DB-CONTEXT] BEFORE enforceSinkGate:
   Context sinkName: saveBatch
   Context language: {language|undefined}
   Context manifest exists: {boolean}
   Context mic exists: {boolean}
   Context mic.id: {mic.id}
   Context mic.version: {mic.version}
```

---

### FORENSIC-4-ENFORCER: Provenance Unavailable Branch
**File**: `lib/neural-assembly/stabilization/terminal-sink-enforcer.ts`  
**Location**: Lines 171-179 (in PROVENANCE_UNAVAILABLE branch)

**Purpose**: Prove why PROVENANCE_UNAVAILABLE is triggered

**Logs**:
```
🔬 [FORENSIC-4-ENFORCER] PROVENANCE_UNAVAILABLE branch:
   signedClaims.claimGraphDigest: {digest_prefix}...
   signedClaims.evidenceLedgerDigest: {digest_prefix}...
   context.mic: {VALID_OBJECT|UNDEFINED}
   Reason: Token claims provenance but context.mic is missing
```

---

## EXECUTION PATH PROOF MATRIX

| Scenario | FORENSIC-1 | FORENSIC-2 | FORENSIC-3 | FORENSIC-4 | Root Cause |
|----------|------------|------------|------------|------------|------------|
| **Call-Site Loss** | getMIC=FOUND, saveBatch param=UNDEFINED | MIC=UNDEFINED | context.mic=UNDEFINED | context.mic=UNDEFINED | Orchestrator loses MIC reference between getMIC and saveBatch call |
| **Context Assembly** | getMIC=FOUND, saveBatch param=VALID | MIC=VALID | context.mic=UNDEFINED | context.mic=UNDEFINED | Database drops MIC when building context |
| **Token Parsing** | getMIC=FOUND, saveBatch param=VALID | MIC=VALID | context.mic=VALID | signedClaims has digests, context.mic=UNDEFINED | Enforcer loses MIC during verification |

---

## NEXT STEPS

### 1. Execute Instrumented Script
```bash
npx tsx scripts/execute-batch-07-live.ts
```

### 2. Analyze Forensic Output
Look for the four `🔬 [FORENSIC-X]` marker blocks in the output.

### 3. Determine Root Cause
Based on the forensic logs, identify which hypothesis is correct:

**If FORENSIC-1 shows getMIC=FOUND but saveBatch receives UNDEFINED**:
- Root cause: Call-site parameter passing issue
- Fix: Ensure `mic` variable is not lost between `getMIC` and `saveBatch` call
- Likely cause: Variable scoping or conditional logic dropping the reference

**If FORENSIC-2 shows RECEIVED but FORENSIC-3 shows UNDEFINED**:
- Root cause: Context assembly drops MIC
- Fix: Ensure `mic` parameter is correctly passed to `enforceSinkGate` context
- Likely cause: Context object construction error

**If FORENSIC-4 shows signedClaims has digests but context.mic is UNDEFINED**:
- Root cause: Token parsing or MIC retrieval timing
- Fix: Investigate token structure and MIC availability at verification time
- Likely cause: Async timing issue or token structure mismatch

### 4. Apply Surgical Fix
Once root cause is proven, apply the minimal fix to the exact failure point.

### 5. Verify Fix
Re-run Batch 07 and confirm `saveBatch` succeeds without PROVENANCE_UNAVAILABLE error.

---

## INSTRUMENTATION CHARACTERISTICS

- ✅ **Minimal**: Only adds logging, no behavior changes
- ✅ **Surgical**: Targets exact boundaries where MIC could be lost
- ✅ **Grep-able**: Uses unique marker strings for easy log filtering
- ✅ **Evidence-bound**: Logs concrete values, not assumptions
- ✅ **Non-invasive**: Can be removed after root cause is proven

---

## FILES MODIFIED

1. `lib/neural-assembly/master-orchestrator.ts` (lines 1501-1527)
2. `lib/neural-assembly/database.ts` (lines 587-632)
3. `lib/neural-assembly/stabilization/terminal-sink-enforcer.ts` (lines 171-179)

---

## EXECUTION COMMAND

```bash
# Run instrumented Batch 07
npx tsx scripts/execute-batch-07-live.ts 2>&1 | tee batch-07-forensic-output.log

# Filter for forensic markers only
grep "🔬 \[FORENSIC" batch-07-forensic-output.log
```

---

**Status**: Ready for execution  
**Expected Duration**: 2-3 minutes (9 language generations with TPM pacing)  
**Expected Outcome**: Forensic logs will prove exact MIC loss point
