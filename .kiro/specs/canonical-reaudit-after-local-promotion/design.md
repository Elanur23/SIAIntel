# Design Document: Canonical Re-Audit After Local Promotion

## A. VERDICT

**DESIGN APPROVED FOR IMPLEMENTATION**

This design implements the canonical re-audit workflow after local promotion (Task 6B-2B) using the safer pending-result model. The design maintains strict deploy lock boundaries, prevents session audit inheritance, requires manual operator trigger, and stores results as pending until explicit acceptance in a future phase.

**Key Safety Guarantees:**
- Deploy remains locked even after successful re-audit
- No automatic re-audit triggers (manual only)
- Pending result storage (no direct globalAudit overwrite)
- Snapshot identity validation before and after audit
- In-memory only (no backend persistence)
- Session audit inheritance banned
- Stale result detection and prevention

## B. DESIGN SUMMARY

### Purpose

After Task 6B-2B promotes session draft content into the local canonical vault, the canonical audit is invalidated and must be re-run. This phase designs the safest path to re-audit the promoted canonical content while maintaining strict safety boundaries.

### Core Design Decisions

1. **Manual Trigger Only**: Re-audit MUST be manually triggered by operator, never automatic
2. **Pending Result Model**: Results stored as `pendingCanonicalReAuditResult`, NOT directly in `globalAudit`
3. **Deploy Lock Preservation**: Deploy remains locked even after successful re-audit
4. **Snapshot Identity Guards**: Validate snapshot before and after re-audit
5. **In-Memory Only**: No backend/API/database/localStorage/sessionStorage
6. **Session Audit Ban**: No inheritance from session audit results
7. **Stale Detection**: Automatic detection when vault changes after re-audit

### Workflow Overview

```
Operator → Manual Trigger → Validate Snapshot → Run Audit (Read-Only) → 
Store Pending Result → Display Status → Deploy Remains Locked
```

### Non-Goals (Deferred to Future Phases)

- Canonical audit acceptance (separate phase)
- Deploy unlock (separate phase)
- Result persistence (separate phase)
- Rollback capability (separate phase)
- Automatic re-audit triggers (never)

## C. STATE MODEL

### Pending Canonical Re-Audit Result States

```typescript
type PendingCanonicalReAuditStatus =
  | 'NOT_RUN'                      // Initial state, no re-audit performed
  | 'RUNNING'                      // Re-audit currently executing
  | 'PASSED_PENDING_ACCEPTANCE'    // Re-audit passed, awaiting acceptance
  | 'FAILED_PENDING_REVIEW'        // Re-audit failed, awaiting review
  | 'STALE'                        // Result no longer valid (vault changed)
  | 'BLOCKED';                     // Re-audit blocked by precondition failure
```

### State Transitions

```
NOT_RUN → RUNNING → PASSED_PENDING_ACCEPTANCE → (acceptance phase)
NOT_RUN → RUNNING → FAILED_PENDING_REVIEW → (review phase)
NOT_RUN → RUNNING → BLOCKED → NOT_RUN (after fix)
PASSED_PENDING_ACCEPTANCE → STALE (if vault changes)
FAILED_PENDING_REVIEW → STALE (if vault changes)
```

### State Invariants

- `NOT_RUN`: `pendingCanonicalReAuditResult === null` OR `status === 'NOT_RUN'`
- `RUNNING`: Button disabled, UI shows spinner
- `PASSED_PENDING_ACCEPTANCE`: Deploy still locked, acceptance required
- `FAILED_PENDING_REVIEW`: Deploy still locked, review required
- `STALE`: Result invalid, fresh re-audit required
- `BLOCKED`: Precondition not met, cannot proceed

## D. TYPE CONTRACTS

### CanonicalReAuditRequest

```typescript
interface CanonicalReAuditRequest {
  // Current canonical vault state
  canonicalVault: PandaPackage;
  
  // Promotion metadata (if available)
  promotionId?: string;
  promotionArchive?: PromotionArchiveMetadata;
  
  // Operator context
  operator: string;
  triggeredAt: string;
  
  // Snapshot validation
  expectedSnapshotHash?: string;
}
```

### PendingCanonicalReAuditResult

```typescript
interface PendingCanonicalReAuditResult {
  // Result status
  status: PendingCanonicalReAuditStatus;
  
  // Provenance metadata
  promotionId?: string;
  auditedSnapshotId: string;
  auditedContentHash: string;
  auditedAt: string;
  operator: string;
  
  // Audit outcome (if completed)
  passed?: boolean;
  failed?: boolean;
  auditDetails?: AuditResultDetails;
  
  // Block information (if blocked)
  blockReason?: string;
  blockCategory?: CanonicalReAuditBlockReason;
  
  // Staleness detection
  isStale: boolean;
  staleReason?: string;
}
```

### CanonicalReAuditBlockReason

```typescript
type CanonicalReAuditBlockReason =
  | 'NO_PROMOTED_VAULT'           // No canonical vault exists
  | 'SNAPSHOT_MISSING'            // Snapshot identity missing
  | 'SNAPSHOT_MISMATCH'           // Snapshot doesn't match expected
  | 'ALREADY_RUNNING'             // Re-audit currently executing
  | 'STALE_RESULT_EXISTS'         // Previous result is stale
  | 'ACKNOWLEDGEMENT_REQUIRED';   // Operator acknowledgement needed
```

### CanonicalReAuditSnapshotIdentity

```typescript
interface CanonicalReAuditSnapshotIdentity {
  contentHash: string;
  ledgerSequence: number;
  capturedAt: string;
  promotionId?: string;
}
```

## E. EXECUTION FLOW

### Main Re-Audit Algorithm

```typescript
async function startCanonicalReAudit(
  request: CanonicalReAuditRequest
): Promise<PendingCanonicalReAuditResult> {
  
  // ========================================================================
  // PHASE 1: PRECONDITION VALIDATION
  // ========================================================================
  
  // Guard 1: Check if already running
  if (isReAuditRunning) {
    return {
      status: 'BLOCKED',
      blockReason: 'Re-audit already running',
      blockCategory: 'ALREADY_RUNNING',
      isStale: false,
      // ... minimal metadata
    };
  }
  
  // Guard 2: Verify promoted canonical vault exists
  if (!request.canonicalVault) {
    return {
      status: 'BLOCKED',
      blockReason: 'No promoted canonical vault exists',
      blockCategory: 'NO_PROMOTED_VAULT',
      isStale: false,
    };
  }
  
  // Guard 3: Capture current snapshot
  const currentSnapshot = captureCanonicalVaultSnapshot(request.canonicalVault);
  
  if (!currentSnapshot || !currentSnapshot.contentHash) {
    return {
      status: 'BLOCKED',
      blockReason: 'Snapshot identity missing',
      blockCategory: 'SNAPSHOT_MISSING',
      isStale: false,
    };
  }
  
  // Guard 4: Verify snapshot matches expected (if promotion archive exists)
  if (request.promotionArchive && request.expectedSnapshotHash) {
    if (currentSnapshot.contentHash !== request.expectedSnapshotHash) {
      return {
        status: 'BLOCKED',
        blockReason: 'Snapshot mismatch - vault content changed since promotion',
        blockCategory: 'SNAPSHOT_MISMATCH',
        isStale: false,
      };
    }
  }
  
  // ========================================================================
  // PHASE 2: AUDIT EXECUTION (IN-MEMORY, READ-ONLY)
  // ========================================================================
  
  // Set running state
  setIsReAuditRunning(true);
  setPendingResult({ status: 'RUNNING', isStale: false });
  
  try {
    // Run audit against canonical vault content
    const auditResult = await runCanonicalAuditInMemory(request.canonicalVault);
    
    // ========================================================================
    // PHASE 3: SNAPSHOT VERIFICATION (AFTER AUDIT)
    // ========================================================================
    
    // Capture snapshot again to detect concurrent changes
    const postAuditSnapshot = captureCanonicalVaultSnapshot(request.canonicalVault);
    
    if (postAuditSnapshot.contentHash !== currentSnapshot.contentHash) {
      return {
        status: 'STALE',
        blockReason: 'Vault content changed during re-audit execution',
        isStale: true,
        auditedSnapshotId: currentSnapshot.contentHash,
        auditedContentHash: currentSnapshot.contentHash,
        auditedAt: new Date().toISOString(),
        operator: request.operator,
      };
    }
    
    // ========================================================================
    // PHASE 4: RESULT STORAGE (PENDING MODEL)
    // ========================================================================
    
    const pendingResult: PendingCanonicalReAuditResult = {
      status: auditResult.passed 
        ? 'PASSED_PENDING_ACCEPTANCE' 
        : 'FAILED_PENDING_REVIEW',
      
      // Provenance
      promotionId: request.promotionId,
      auditedSnapshotId: currentSnapshot.contentHash,
      auditedContentHash: currentSnapshot.contentHash,
      auditedAt: new Date().toISOString(),
      operator: request.operator,
      
      // Audit outcome
      passed: auditResult.passed,
      failed: !auditResult.passed,
      auditDetails: auditResult.details,
      
      // Staleness
      isStale: false,
    };
    
    // Store as pending (DO NOT overwrite globalAudit)
    setPendingCanonicalReAuditResult(pendingResult);
    
    return pendingResult;
    
  } finally {
    // Always release running lock
    setIsReAuditRunning(false);
  }
}
```

### Snapshot Capture Algorithm

```typescript
function captureCanonicalVaultSnapshot(
  vault: PandaPackage
): CanonicalReAuditSnapshotIdentity {
  
  // Compute content hash
  const contentHash = computeContentHash(vault);
  
  // Get current ledger sequence
  const ledgerSequence = getCurrentLedgerSequence();
  
  return {
    contentHash,
    ledgerSequence,
    capturedAt: new Date().toISOString(),
    promotionId: vault.metadata?.promotionId,
  };
}
```

### Stale Detection Algorithm

```typescript
function detectStaleResult(
  pendingResult: PendingCanonicalReAuditResult,
  currentVault: PandaPackage
): boolean {
  
  if (!pendingResult || pendingResult.status === 'NOT_RUN') {
    return false;
  }
  
  // Capture current snapshot
  const currentSnapshot = captureCanonicalVaultSnapshot(currentVault);
  
  // Compare with audited snapshot
  if (currentSnapshot.contentHash !== pendingResult.auditedContentHash) {
    // Mark result as stale
    setPendingCanonicalReAuditResult({
      ...pendingResult,
      status: 'STALE',
      isStale: true,
      staleReason: 'Vault content changed after re-audit',
    });
    
    return true;
  }
  
  return false;
}
```

## F. UI FLOW

### Canonical Re-Audit Panel Component

```typescript
function CanonicalReAuditPanel() {
  const { 
    canonicalVault,
    globalAudit,
    pendingCanonicalReAuditResult,
    isReAuditRunning,
  } = useWarroomState();
  
  // Detect stale results on vault changes
  useEffect(() => {
    if (pendingCanonicalReAuditResult && canonicalVault) {
      detectStaleResult(pendingCanonicalReAuditResult, canonicalVault);
    }
  }, [canonicalVault, pendingCanonicalReAuditResult]);
  
  // Determine button state
  const canRunReAudit = 
    !isReAuditRunning &&
    canonicalVault !== null &&
    globalAudit === null &&
    (!pendingCanonicalReAuditResult || pendingCanonicalReAuditResult.isStale);
  
  const handleRunReAudit = async () => {
    const request: CanonicalReAuditRequest = {
      canonicalVault,
      promotionId: canonicalVault.metadata?.promotionId,
      operator: getCurrentOperator(),
      triggeredAt: new Date().toISOString(),
    };
    
    await startCanonicalReAudit(request);
  };
  
  return (
    <div className="canonical-reaudit-panel">
      {/* Status Banner */}
      <div className="status-banner">
        {globalAudit === null && (
          <Alert severity="warning">
            Canonical audit invalid/stale - Re-audit required
          </Alert>
        )}
      </div>
      
      {/* Promotion Archive Metadata */}
      {canonicalVault?.metadata?.promotionId && (
        <div className="promotion-metadata">
          <Typography variant="caption">
            Promoted: {canonicalVault.metadata.promotedAt}
          </Typography>
          <Typography variant="caption">
            Promotion ID: {canonicalVault.metadata.promotionId}
          </Typography>
        </div>
      )}
      
      {/* Snapshot Info */}
      <div className="snapshot-info">
        <Typography variant="body2">
          Current Snapshot: {computeContentHash(canonicalVault).slice(0, 8)}...
        </Typography>
      </div>
      
      {/* Re-Audit Button */}
      <Button
        variant="contained"
        color="primary"
        disabled={!canRunReAudit}
        onClick={handleRunReAudit}
      >
        {isReAuditRunning ? 'Running Re-Audit...' : 'Run Canonical Re-Audit'}
      </Button>
      
      {/* Pending Result Display */}
      {pendingCanonicalReAuditResult && (
        <div className="pending-result">
          <Typography variant="h6">
            Re-Audit Status: {pendingCanonicalReAuditResult.status}
          </Typography>
          
          {pendingCanonicalReAuditResult.status === 'PASSED_PENDING_ACCEPTANCE' && (
            <Alert severity="success">
              Re-audit passed - Awaiting acceptance
            </Alert>
          )}
          
          {pendingCanonicalReAuditResult.status === 'FAILED_PENDING_REVIEW' && (
            <Alert severity="error">
              Re-audit failed - Review required
            </Alert>
          )}
          
          {pendingCanonicalReAuditResult.isStale && (
            <Alert severity="warning">
              Result is stale - Vault content changed, re-audit required
            </Alert>
          )}
          
          {/* Audit Details */}
          {pendingCanonicalReAuditResult.auditDetails && (
            <div className="audit-details">
              {/* Display pass/fail details */}
            </div>
          )}
        </div>
      )}
      
      {/* Deploy Lock Warning */}
      <Alert severity="info">
        Deploy remains locked even after successful re-audit
      </Alert>
      
      <Alert severity="info">
        Acceptance/deploy unlock is a later phase
      </Alert>
    </div>
  );
}
```

### UI State Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ Canonical Re-Audit Panel                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ ⚠️  Canonical audit invalid/stale - Re-audit required       │
│                                                              │
│ Promoted: 2024-01-15T10:30:00Z                              │
│ Promotion ID: promo-abc123                                  │
│ Current Snapshot: 7f3a9b2c...                               │
│                                                              │
│ ┌──────────────────────────────────────┐                   │
│ │  Run Canonical Re-Audit              │ [Button]          │
│ └──────────────────────────────────────┘                   │
│                                                              │
│ Re-Audit Status: PASSED_PENDING_ACCEPTANCE                  │
│ ✅ Re-audit passed - Awaiting acceptance                    │
│                                                              │
│ Audited At: 2024-01-15T10:35:00Z                           │
│ Operator: operator@example.com                              │
│ Snapshot: 7f3a9b2c...                                       │
│                                                              │
│ ℹ️  Deploy remains locked even after successful re-audit   │
│ ℹ️  Acceptance/deploy unlock is a later phase              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## G. SNAPSHOT / STALENESS MODEL

### Snapshot Identity Binding

**Before Re-Audit:**
1. Capture current canonical vault snapshot (content hash + ledger sequence)
2. Compare against promotion archive snapshot (if available)
3. Block if mismatch detected
4. Proceed only if snapshot identity is valid

**After Re-Audit:**
1. Capture snapshot again
2. Compare with pre-audit snapshot
3. Mark result as STALE if mismatch detected
4. Include snapshot identity in result provenance

### Staleness Detection Triggers

1. **Vault Content Change**: Any modification to canonical vault content
2. **Ledger Sequence Change**: Any new event applied to ledger
3. **Manual Detection**: Operator can manually trigger staleness check
4. **Automatic Detection**: On component mount/update, check if result is stale

### Staleness Recovery

1. Display "Result is stale - Re-audit required" warning
2. Disable result acceptance
3. Enable "Run Canonical Re-Audit" button
4. Operator must trigger fresh re-audit
5. Fresh re-audit captures new snapshot and generates new result

## H. RESULT STORAGE MODEL

### Pending Result Storage

```typescript
// State management
const [pendingCanonicalReAuditResult, setPendingCanonicalReAuditResult] = 
  useState<PendingCanonicalReAuditResult | null>(null);

// DO NOT directly overwrite globalAudit
// globalAudit remains null until acceptance phase

// Pending result lifecycle:
// 1. NOT_RUN → RUNNING → PASSED_PENDING_ACCEPTANCE
// 2. NOT_RUN → RUNNING → FAILED_PENDING_REVIEW
// 3. NOT_RUN → RUNNING → BLOCKED
// 4. PASSED_PENDING_ACCEPTANCE → STALE (if vault changes)
// 5. FAILED_PENDING_REVIEW → STALE (if vault changes)
```

### Result Persistence Boundary

**In This Phase (In-Memory Only):**
- `pendingCanonicalReAuditResult` stored in React state
- No backend/API calls
- No database writes
- No localStorage/sessionStorage
- All state in browser memory

**Future Phase (Acceptance):**
- Operator reviews pending result
- Operator explicitly accepts result
- System promotes pending result to `globalAudit`
- System may persist to backend (separate design)

## I. DEPLOY LOCK BOUNDARY

### Deploy Lock Preservation Rules

1. **Before Re-Audit**: Deploy is locked (canonical audit is null)
2. **During Re-Audit**: Deploy remains locked
3. **After Re-Audit (Pass)**: Deploy STILL locked (pending acceptance)
4. **After Re-Audit (Fail)**: Deploy STILL locked (review required)
5. **After Acceptance**: Deploy unlock is a SEPARATE FUTURE PHASE

### Deploy Lock Verification

```typescript
// Verification check
function verifyDeployLockPreserved(): boolean {
  // Deploy lock state should never change in this phase
  const deployLockBefore = isDeployLocked();
  
  // Run re-audit
  await startCanonicalReAudit(request);
  
  const deployLockAfter = isDeployLocked();
  
  // MUST be true
  return deployLockBefore === true && deployLockAfter === true;
}
```

### UI Deploy Lock Warnings

```typescript
// Always display these warnings
<Alert severity="info">
  Deploy remains locked even after successful re-audit
</Alert>

<Alert severity="info">
  Acceptance/deploy unlock is a later phase
</Alert>

// Never display
// ❌ "Deploy unlocked" (FORBIDDEN)
// ❌ "Ready to deploy" (FORBIDDEN)
// ❌ "Publish enabled" (FORBIDDEN)
```

## J. FORBIDDEN ACTIONS

### Absolutely Forbidden in This Phase

1. **Deploy Unlock**: MUST NOT unlock deploy under any circumstances
2. **GlobalAudit Overwrite**: MUST NOT set `globalAudit` to passed state
3. **Backend Persistence**: MUST NOT call API/database/provider
4. **LocalStorage/SessionStorage**: MUST NOT write to browser storage
5. **Session Audit Inheritance**: MUST NOT copy session audit to canonical audit
6. **Automatic Triggers**: MUST NOT auto-run re-audit after promotion/modal close
7. **Rollback Implementation**: MUST NOT implement rollback in this phase
8. **Session Draft Mutation**: MUST NOT modify session draft state
9. **Publish/Save/Deploy Wiring**: MUST NOT enable any deployment functionality

### Verification Assertions

```typescript
// These assertions MUST pass
assert(globalAudit === null || globalAudit.status !== 'passed');
assert(isDeployLocked() === true);
assert(noBackendCallsMade === true);
assert(noLocalStorageWrites === true);
assert(noSessionAuditInheritance === true);
assert(noAutoTriggers === true);
```

## K. VERIFICATION PLAN

### Verification Script: `verify-canonical-reaudit-after-local-promotion.ts`

```typescript
async function verifyCanonicalReAuditSafety() {
  const results = [];
  
  // Test 1: Manual trigger only
  results.push(await verifyManualTriggerOnly());
  
  // Test 2: No auto-run after promotion
  results.push(await verifyNoAutoRunAfterPromotion());
  
  // Test 3: No auto-run after modal close
  results.push(await verifyNoAutoRunAfterModalClose());
  
  // Test 4: Pending result exists
  results.push(await verifyPendingResultExists());
  
  // Test 5: GlobalAudit not overwritten
  results.push(await verifyGlobalAuditNotOverwritten());
  
  // Test 6: Deploy remains locked
  results.push(await verifyDeployRemainsLocked());
  
  // Test 7: Snapshot identity required
  results.push(await verifySnapshotIdentityRequired());
  
  // Test 8: Stale snapshot blocks acceptance
  results.push(await verifyStaleSnapshotBlocks());
  
  // Test 9: No backend calls
  results.push(await verifyNoBackendCalls());
  
  // Test 10: No localStorage/sessionStorage
  results.push(await verifyNoLocalStorage());
  
  // Test 11: No publish/save/deploy
  results.push(await verifyNoPublishSaveDeploy());
  
  // Test 12: No session audit inheritance
  results.push(await verifyNoSessionAuditInheritance());
  
  // Test 13: No rollback
  results.push(await verifyNoRollback());
  
  // Test 14: No session draft mutation
  results.push(await verifyNoSessionDraftMutation());
  
  // Test 15: Result includes provenance
  results.push(await verifyResultProvenance());
  
  return results.every(r => r.passed);
}
```

### Verification Checks

1. **Manual Trigger Only**: Verify no automatic re-audit after promotion/modal close
2. **Pending Result Storage**: Verify `pendingCanonicalReAuditResult` exists and is used
3. **GlobalAudit Preservation**: Verify `globalAudit` is not overwritten as passed
4. **Deploy Lock**: Verify deploy remains locked after successful re-audit
5. **Snapshot Identity**: Verify snapshot validation before and after re-audit
6. **Stale Detection**: Verify stale results are detected and blocked
7. **No Backend**: Verify no fetch/axios/prisma/libsql calls
8. **No Storage**: Verify no localStorage/sessionStorage writes
9. **No Deploy Wiring**: Verify no publish/save/deploy functionality enabled
10. **No Session Inheritance**: Verify session audit not copied to canonical
11. **No Rollback**: Verify no rollback implementation
12. **No Draft Mutation**: Verify session draft not modified
13. **Provenance**: Verify result includes promotionId, snapshot, timestamp, operator

## L. FILE SCOPE PLAN

### MUST TOUCH Files

1. **`app/admin/warroom/page.tsx`**
   - Add `CanonicalReAuditPanel` component
   - Add state for `pendingCanonicalReAuditResult`
   - Add state for `isReAuditRunning`
   - Wire re-audit handler

2. **`app/admin/warroom/handlers/canonical-reaudit-handler.ts`** (NEW)
   - Implement `startCanonicalReAudit()` function
   - Implement snapshot capture logic
   - Implement stale detection logic
   - Implement audit runner wrapper

3. **`lib/editorial/canonical-reaudit-types.ts`** (NEW)
   - Define `CanonicalReAuditRequest` interface
   - Define `PendingCanonicalReAuditResult` interface
   - Define `CanonicalReAuditBlockReason` type
   - Define `CanonicalReAuditSnapshotIdentity` interface
   - Define `PendingCanonicalReAuditStatus` type

### MAY TOUCH Files

4. **`app/admin/warroom/components/CanonicalReAuditPanel.tsx`** (NEW)
   - Implement UI panel component
   - Display audit status
   - Display pending result
   - Display warnings

5. **`lib/editorial/audit-runner-wrapper.ts`** (NEW OR EXISTING)
   - Wrap existing audit logic for in-memory execution
   - Ensure read-only mode
   - Return audit result without side effects

6. **`scripts/verify-canonical-reaudit-after-local-promotion.ts`** (NEW)
   - Implement verification script
   - Test all safety constraints
   - Generate verification report

### MUST NOT TOUCH Files

7. **Backend/API Files**: Any file in `app/api/`, `lib/api/`, `lib/database/`
8. **Deploy Logic**: Any file related to publish/save/deploy
9. **Rollback Logic**: No rollback implementation files
10. **Session Draft Mutation**: No modification to session draft handlers
11. **Persistence Layers**: No localStorage/sessionStorage/database files

## M. RISK / MITIGATION TABLE

| Risk | Description | Impact | Mitigation |
|------|-------------|--------|------------|
| **Stale Approval** | Operator accepts re-audit result after vault content changes | HIGH | Snapshot identity validation before and after re-audit; automatic stale detection; block acceptance if stale |
| **Accidental Deploy Unlock** | Re-audit success accidentally unlocks deploy | CRITICAL | Explicit deploy lock preservation; verification script checks; UI warnings; no code path to unlock deploy |
| **Session Audit Inheritance** | Session audit results copied to canonical audit | HIGH | Input source validation; explicit ban on session audit inheritance; verification script checks |
| **Wrong Input Source** | Re-audit runs against session draft instead of canonical vault | HIGH | Input source validation; explicit canonical vault parameter; verification script checks |
| **Snapshot Mismatch** | Re-audit runs against different content than expected | HIGH | Snapshot capture before audit; comparison with promotion archive; block if mismatch |
| **Auto-Run Race Condition** | Re-audit auto-runs after promotion before operator ready | MEDIUM | Manual trigger only; no automatic triggers; explicit operator action required |
| **Pending Result Mistaken as Pass** | Operator treats pending result as canonical audit pass | MEDIUM | Pending storage model; clear UI warnings; separate acceptance phase; verification script checks |
| **Concurrent Execution** | Multiple re-audits run simultaneously | MEDIUM | Execution lock; running state check; block if already running |
| **Backend Persistence** | Re-audit results accidentally persisted to backend | HIGH | In-memory only boundary; no API/database calls; verification script checks |
| **Deploy Gate Weakening** | Deploy gate accidentally weakened after re-audit | CRITICAL | Deploy lock preservation; no deploy unlock code paths; verification script checks |

## N. NEXT RECOMMENDATION

### Immediate Next Steps

1. **Review and Approve Design**: Stakeholder review of this design document
2. **Create Tasks Document**: Break down design into implementation tasks
3. **Implement Type Contracts**: Create `canonical-reaudit-types.ts`
4. **Implement Handler**: Create `canonical-reaudit-handler.ts`
5. **Implement UI Panel**: Create `CanonicalReAuditPanel.tsx`
6. **Implement Verification Script**: Create verification script
7. **Test and Verify**: Run verification script and validate all constraints

### Future Phases (Separate Designs Required)

1. **Canonical Audit Acceptance Phase**
   - Design operator review and acceptance workflow
   - Design promotion of pending result to globalAudit
   - Design acceptance verification and logging

2. **Deploy Unlock Phase**
   - Design deploy unlock gating and verification
   - Design operator confirmation workflow
   - Design deploy unlock audit trail

3. **Result Persistence Phase**
   - Design backend persistence of audit results
   - Design audit history and versioning
   - Design persistence verification

4. **Rollback Phase**
   - Design rollback capability for failed promotions
   - Design rollback verification and safety gates
   - Design rollback audit trail

### Success Criteria

This phase is complete when:
- ✅ Manual re-audit trigger works correctly
- ✅ Pending result storage model implemented
- ✅ Deploy remains locked after successful re-audit
- ✅ Snapshot identity validation works before and after audit
- ✅ Stale detection works correctly
- ✅ No backend persistence occurs
- ✅ No session audit inheritance occurs
- ✅ Verification script passes all checks
- ✅ UI displays correct warnings and status
- ✅ All forbidden actions are prevented

---

**END OF DESIGN DOCUMENT**

This is DESIGN ONLY. Do not implement runtime code. Do not commit. Do not push. Do not deploy.
