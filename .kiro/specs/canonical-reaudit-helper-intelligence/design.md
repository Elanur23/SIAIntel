# Design Document: Canonical Re-Audit Handler Layer (Task 5C)

## Overview

Task 5C implements the Handler Layer for the canonical re-audit subsystem, completing the integration between the pure in-memory adapter (Task 5A) and the warroom UI. The handler layer is responsible for:

1. **Adapter Integration**: Replacing the successful-preflight `AUDIT_RUNNER_UNAVAILABLE` sentinel with guarded `runInMemoryCanonicalReAudit` execution
2. **Result Mapping**: Transforming adapter results (`CanonicalReAuditAdapterResult`) into handler results (`CanonicalReAuditResult`) with full safety invariants
3. **Safety Guards**: Rejecting unsafe adapter results and enforcing fail-closed behavior
4. **Verification**: Providing comprehensive verification scripts to validate handler behavior

The handler layer follows the same safety-first, fail-closed, memory-only patterns established by `useLocalDraftRemediationController` and the Task 5B preflight layer. All operations are memory-only. Deploy remains locked after canonical re-audit. No globalAudit overwrite, no session audit inheritance, and no automatic triggering are permitted.

### Design Principles

1. **Fail-Closed Architecture**: All ambiguous or invalid states result in BLOCKED status
2. **Memory-Only Operation**: No persistence, no backend calls, no storage writes
3. **Safety Invariant Enforcement**: Every result preserves safety flags regardless of adapter output
4. **Type Safety**: Adapter results are mapped to handler results with explicit type transformations
5. **Verification-Driven**: Comprehensive verification scripts validate all safety properties

## Architecture

### Component Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                     Warroom UI Layer                         │
│                  (app/admin/warroom/page.tsx)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ (future: useCanonicalReAudit hook)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Handler Layer (Task 5C)                    │
│        app/admin/warroom/handlers/canonical-reaudit-         │
│                       handler.ts                             │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  startCanonicalReAudit (entry point)                 │  │
│  │  • Concurrency lock                                  │  │
│  │  • Request validation                                │  │
│  │  • Preflight execution                               │  │
│  │  • Adapter execution (NEW in 5C)                     │  │
│  │  • Result mapping (NEW in 5C)                        │  │
│  │  • Safety guard enforcement (NEW in 5C)              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  mapAdapterResultToHandlerResult (NEW in 5C)         │  │
│  │  • Type transformation                               │  │
│  │  • Safety invariant injection                        │  │
│  │  • Unsafe flag detection                             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ (RunInMemoryCanonicalReAuditRequest)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Adapter Layer (Task 5A)                    │
│        lib/editorial/canonical-reaudit-adapter.ts            │
│                                                              │
│  • runInMemoryCanonicalReAudit                              │
│  • Pure in-memory audit execution                           │
│  • No side effects                                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ (audit content)
                         │
┌────────────────────────▼────────────────────────────────────┐
│                   Audit Runner Layer                         │
│        lib/editorial/global-governance-audit.ts              │
│                                                              │
│  • runGlobalGovernanceAudit                                 │
│  • Pure audit logic                                         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
Request + Vault
      │
      ▼
┌─────────────────────┐
│  Concurrency Lock   │ ──► BLOCKED (if locked)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Request Validation  │ ──► BLOCKED (if invalid)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Preflight Execution │ ──► BLOCKED/STALE (if preflight fails)
└──────────┬──────────┘
           │
           ▼ (preflight.ok === true)
┌─────────────────────┐
│ Adapter Execution   │ ──► CanonicalReAuditAdapterResult
│ (NEW in Task 5C)    │     • status: PASSED_PENDING_ACCEPTANCE
└──────────┬──────────┘     • status: FAILED_PENDING_REVIEW
           │                • status: BLOCKED
           │                • status: STALE
           ▼
┌─────────────────────┐
│  Result Mapping     │ ──► CanonicalReAuditResult
│  (NEW in Task 5C)   │     • All safety invariants injected
└──────────┬──────────┘     • Unsafe flags rejected
           │
           ▼
┌─────────────────────┐
│  Safety Guards      │ ──► BLOCKED (if unsafe flags detected)
│  (NEW in Task 5C)   │
└──────────┬──────────┘
           │
           ▼
    Final Result
```

## Components and Interfaces

### 1. Handler Entry Point: `startCanonicalReAudit`

**Signature:**
```typescript
export function startCanonicalReAudit(
  request: CanonicalReAuditRequest,
  vault?: CanonicalVaultInput
): CanonicalReAuditResult
```

**Responsibilities:**
- Enforce concurrency lock (preserve existing behavior)
- Validate request (preserve existing guards)
- Execute preflight (preserve Task 5B behavior)
- **NEW**: Call adapter when preflight succeeds
- **NEW**: Map adapter result to handler result
- **NEW**: Enforce safety guards on mapped result
- Return fail-closed result for all error paths

**Execution Paths:**

1. **Concurrency Lock Path** (preserved from Task 5A/5B):
   - If `isLocked === true`, return BLOCKED with `AUDIT_RUNNER_UNAVAILABLE`
   - This prevents concurrent execution

2. **Request Validation Path** (preserved from Task 5A/5B):
   - Validate `manualTrigger === true`
   - Validate `memoryOnly === true`
   - Validate `deployUnlockAllowed === false`
   - Validate `backendPersistenceAllowed === false`
   - Validate `sessionAuditInheritanceAllowed === false`
   - Validate `canonicalSnapshot` exists
   - Validate `canonicalSnapshot.source === 'canonical-vault'`
   - Any failure returns BLOCKED with appropriate reason

3. **Vault-Undefined Fallback Path** (preserved from Task 5A/5B):
   - If `vault === undefined`, return BLOCKED with `AUDIT_RUNNER_UNAVAILABLE`
   - This preserves backward compatibility

4. **Preflight Execution Path** (preserved from Task 5B):
   - Call `buildCanonicalReAuditAdapterPreflight(request, vault)`
   - If `preflight.ok === false`, return BLOCKED/STALE with preflight's blockReason
   - This validates vault structure and snapshot identity

5. **Adapter Execution Path** (NEW in Task 5C):
   - If `preflight.ok === true`, call `runInMemoryCanonicalReAudit(preflight.adapterRequest)`
   - Wrap in try-catch for fail-closed error handling
   - If adapter throws, return BLOCKED with `AUDIT_RUNNER_FAILED`

6. **Result Mapping Path** (NEW in Task 5C):
   - Call `mapAdapterResultToHandlerResult(adapterResult, request)`
   - Transform adapter result type to handler result type
   - Inject safety invariants
   - Detect and reject unsafe flags

### 2. Result Mapper: `mapAdapterResultToHandlerResult`

**Signature:**
```typescript
function mapAdapterResultToHandlerResult(
  adapterResult: CanonicalReAuditAdapterResult,
  request: CanonicalReAuditRequest
): CanonicalReAuditResult
```

**Responsibilities:**
- Transform adapter result type to handler result type
- Inject all required safety invariants
- Detect unsafe adapter flags and block if present
- Preserve adapter findings and audit summary
- Map adapter status to handler status

**Type Transformation:**

```typescript
// Adapter Result Type (from Task 5A)
interface CanonicalReAuditAdapterResult {
  status: 'BLOCKED' | 'PASSED_PENDING_ACCEPTANCE' | 'FAILED_PENDING_REVIEW' | 'STALE';
  deployUnlockAllowed: false;
  canonicalStateMutationAllowed: false;
  persistenceAllowed: false;
  sessionAuditInheritanceAllowed: false;
  source: 'canonical-vault';
  snapshotIdentity: CanonicalReAuditSnapshotIdentity;
  auditSummary?: string;
  findings?: unknown[];
  blockReason?: CanonicalReAuditBlockReason;
  blockMessage?: string;
  auditedAt: string;
  auditor: string;
}

// Handler Result Type (from canonical-reaudit-types.ts)
interface PendingCanonicalReAuditResult {
  status: CanonicalReAuditStatus;
  success: boolean;
  passed: boolean;
  readyForAcceptance: boolean;
  deployRemainsLocked: true;
  globalAuditOverwriteAllowed: false;
  backendPersistenceAllowed: false;
  memoryOnly: true;
  sessionAuditInherited: false;
  auditedSnapshot: CanonicalReAuditSnapshotIdentity;
  promotionId?: string;
  auditedAt: string;
  auditor: string;
  findings?: unknown[];
  summary?: string;
  blockReason?: CanonicalReAuditBlockReason;
  errors?: string[];
}
```

**Mapping Logic:**

1. **Status Mapping:**
   - `'PASSED_PENDING_ACCEPTANCE'` → `CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE`
   - `'FAILED_PENDING_REVIEW'` → `CanonicalReAuditStatus.FAILED_PENDING_REVIEW`
   - `'BLOCKED'` → `CanonicalReAuditStatus.BLOCKED`
   - `'STALE'` → `CanonicalReAuditStatus.STALE`

2. **Safety Invariant Injection:**
   - `deployRemainsLocked: true` (always)
   - `globalAuditOverwriteAllowed: false` (always)
   - `backendPersistenceAllowed: false` (always)
   - `memoryOnly: true` (always)
   - `sessionAuditInherited: false` (always)

3. **Derived Fields:**
   - `success: boolean` = `status === 'PASSED_PENDING_ACCEPTANCE'`
   - `passed: boolean` = `status === 'PASSED_PENDING_ACCEPTANCE'`
   - `readyForAcceptance: boolean` = `status === 'PASSED_PENDING_ACCEPTANCE'`

4. **Field Renaming:**
   - `snapshotIdentity` → `auditedSnapshot`
   - `auditSummary` → `summary`
   - `blockMessage` → `errors: [blockMessage]` (if present)

5. **Promotion ID Extraction:**
   - Extract `promotionId` from `request.promotionId` or `adapterResult.snapshotIdentity.promotionId`

### 3. Safety Guard: Unsafe Flag Detection

**Unsafe Flags:**
- `deployUnlockAllowed: true` (must always be false)
- `sessionAuditInheritanceAllowed: true` (must always be false)

**Detection Logic:**

```typescript
// Check for unsafe flags in adapter result
if (adapterResult.deployUnlockAllowed !== false) {
  return createBlockedResult(
    request,
    CanonicalReAuditBlockReason.DEPLOY_UNLOCK_FORBIDDEN,
    'Adapter result contains unsafe deployUnlockAllowed flag'
  );
}

if (adapterResult.sessionAuditInheritanceAllowed !== false) {
  return createBlockedResult(
    request,
    CanonicalReAuditBlockReason.SESSION_AUDIT_INHERITANCE_FORBIDDEN,
    'Adapter result contains unsafe sessionAuditInheritanceAllowed flag'
  );
}
```

**Rationale:**
- The adapter is a pure function and should never return unsafe flags
- However, fail-closed design requires defensive checks at every boundary
- If adapter is compromised or modified incorrectly, handler must block unsafe results
- This provides defense-in-depth for safety-critical invariants

## Data Models

### Input Types

**CanonicalReAuditRequest** (from canonical-reaudit-types.ts):
```typescript
interface CanonicalReAuditRequest {
  articleId: string;
  operatorId: string;
  requestedAt: string;
  canonicalSnapshot: CanonicalReAuditSnapshotIdentity;
  promotionArchiveId?: string;
  promotionId?: string;
  manualTrigger: true;
  memoryOnly: true;
  deployUnlockAllowed: false;
  backendPersistenceAllowed: false;
  sessionAuditInheritanceAllowed: false;
}
```

**CanonicalVaultInput** (from canonical-reaudit-adapter.ts):
```typescript
interface CanonicalVaultInput {
  vault?: Record<string, {
    title: string;
    desc: string;
    ready: boolean;
  }>;
  articleId?: string;
  metadata?: {
    promotionId?: string;
    promotedAt?: string;
    [key: string]: any;
  };
}
```

### Intermediate Types

**CanonicalReAuditAdapterPreflightResult** (from handler, Task 5B):
```typescript
type CanonicalReAuditAdapterPreflightResult =
  | {
      ok: true;
      adapterRequest: RunInMemoryCanonicalReAuditRequest;
      liveSnapshot: CanonicalReAuditSnapshotIdentity;
    }
  | {
      ok: false;
      blockReason: CanonicalReAuditBlockReason;
      message: string;
      liveSnapshot?: CanonicalReAuditSnapshotIdentity;
    };
```

**CanonicalReAuditAdapterResult** (from adapter, Task 5A):
```typescript
interface CanonicalReAuditAdapterResult {
  status: 'BLOCKED' | 'PASSED_PENDING_ACCEPTANCE' | 'FAILED_PENDING_REVIEW' | 'STALE';
  deployUnlockAllowed: false;
  canonicalStateMutationAllowed: false;
  persistenceAllowed: false;
  sessionAuditInheritanceAllowed: false;
  source: 'canonical-vault';
  snapshotIdentity: CanonicalReAuditSnapshotIdentity;
  auditSummary?: string;
  findings?: unknown[];
  blockReason?: CanonicalReAuditBlockReason;
  blockMessage?: string;
  auditedAt: string;
  auditor: string;
}
```

### Output Type

**CanonicalReAuditResult** (from canonical-reaudit-types.ts):
```typescript
type CanonicalReAuditResult =
  | (PendingCanonicalReAuditResult & { 
      status: CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE | 
              CanonicalReAuditStatus.FAILED_PENDING_REVIEW 
    })
  | (PendingCanonicalReAuditResult & { 
      status: CanonicalReAuditStatus.BLOCKED; 
      blockReason: CanonicalReAuditBlockReason 
    })
  | (PendingCanonicalReAuditResult & { 
      status: CanonicalReAuditStatus.STALE 
    });

interface PendingCanonicalReAuditResult {
  status: CanonicalReAuditStatus;
  success: boolean;
  passed: boolean;
  readyForAcceptance: boolean;
  deployRemainsLocked: true;
  globalAuditOverwriteAllowed: false;
  backendPersistenceAllowed: false;
  memoryOnly: true;
  sessionAuditInherited: false;
  auditedSnapshot: CanonicalReAuditSnapshotIdentity;
  promotionId?: string;
  auditedAt: string;
  auditor: string;
  findings?: unknown[];
  summary?: string;
  blockReason?: CanonicalReAuditBlockReason;
  errors?: string[];
}
```

## Core Validator Specification

### 1. GUARD → ERROR CODE MAPPING

**Explicit Guard-to-Error Mapping (No Ambiguity):**

| Guard | Condition | Error Code | Handler |
|-------|-----------|-----------|---------|
| `isLocked === true` | Concurrency lock active | `AUDIT_RUNNER_UNAVAILABLE` | Return BLOCKED immediately |
| `manualTrigger !== true` | Request not manually triggered | `MANUAL_TRIGGER_REQUIRED` | Return BLOCKED |
| `memoryOnly !== true` | Request not memory-only | `MEMORY_ONLY_REQUIRED` | Return BLOCKED |
| `deployUnlockAllowed !== false` | Deploy unlock requested | `DEPLOY_UNLOCK_FORBIDDEN` | Return BLOCKED |
| `backendPersistenceAllowed !== false` | Backend persistence requested | `BACKEND_PERSISTENCE_FORBIDDEN` | Return BLOCKED |
| `sessionAuditInheritanceAllowed !== false` | Session inheritance requested | `SESSION_AUDIT_INHERITANCE_FORBIDDEN` | Return BLOCKED |
| `canonicalSnapshot === undefined` | Snapshot missing | `SNAPSHOT_REQUIRED` | Return BLOCKED |
| `canonicalSnapshot.source !== 'canonical-vault'` | Invalid snapshot source | `INVALID_SNAPSHOT_SOURCE` | Return BLOCKED |
| `vault === undefined` | Vault not provided | `AUDIT_RUNNER_UNAVAILABLE` | Return BLOCKED (backward compat) |
| `preflight.ok === false` | Preflight validation failed | `preflight.blockReason` | Return BLOCKED/STALE |
| `adapter throws` | Adapter execution error | `AUDIT_RUNNER_FAILED` | Return BLOCKED |
| `adapterResult.deployUnlockAllowed === true` | Unsafe adapter flag | `DEPLOY_UNLOCK_FORBIDDEN` | Return BLOCKED |
| `adapterResult.sessionAuditInheritanceAllowed === true` | Unsafe adapter flag | `SESSION_AUDIT_INHERITANCE_FORBIDDEN` | Return BLOCKED |

**Mapping Guarantee**: Each guard maps to exactly one error code. No guard maps to multiple codes. No code is produced by multiple guards.

---

### 2. ERROR / WARNING / SAFETY RULES

**Clear Conditions (No Overlap):**

| Condition | Classification | Trigger | Response |
|-----------|-----------------|---------|----------|
| `status === 'PASSED_PENDING_ACCEPTANCE'` | SAFETY | Audit passed all checks | `success: true`, `passed: true`, `readyForAcceptance: true` |
| `status === 'FAILED_PENDING_REVIEW'` | ERROR | Audit found violations | `success: false`, `passed: false`, `readyForAcceptance: false` |
| `status === 'BLOCKED'` | ERROR | Guard rejected execution | `success: false`, `passed: false`, `readyForAcceptance: false`, `blockReason` set |
| `status === 'STALE'` | WARNING | Snapshot outdated | `success: false`, `passed: false`, `readyForAcceptance: false`, `blockReason: SNAPSHOT_STALE` |
| `deployRemainsLocked === false` | ERROR | Safety invariant violated | Return BLOCKED with `DEPLOY_UNLOCK_FORBIDDEN` |
| `globalAuditOverwriteAllowed === true` | ERROR | Safety invariant violated | Return BLOCKED with `GLOBAL_AUDIT_OVERWRITE_FORBIDDEN` |
| `backendPersistenceAllowed === true` | ERROR | Safety invariant violated | Return BLOCKED with `BACKEND_PERSISTENCE_FORBIDDEN` |
| `memoryOnly === false` | ERROR | Safety invariant violated | Return BLOCKED with `MEMORY_ONLY_REQUIRED` |
| `sessionAuditInherited === true` | ERROR | Safety invariant violated | Return BLOCKED with `SESSION_AUDIT_INHERITANCE_FORBIDDEN` |
| `adapterResult.deployUnlockAllowed === true` | ERROR | Adapter compromise detected | Return BLOCKED with `DEPLOY_UNLOCK_FORBIDDEN` |
| `adapterResult.sessionAuditInheritanceAllowed === true` | ERROR | Adapter compromise detected | Return BLOCKED with `SESSION_AUDIT_INHERITANCE_FORBIDDEN` |

**Classification Guarantee**: Each condition maps to exactly one classification. No condition is both ERROR and WARNING. No condition is both SAFETY and ERROR.

---

### 3. AGGREGATION RULE

**Error Collection Strategy:**

**Root Fail (Fail-Fast):**
- If input is not object: Stop immediately, return single error via factory
- No further validation after root fail

**All Other Validations (Collect All Errors):**
- Check ALL guards in fixed order
- Collect ALL errors that occur
- Do NOT stop at first error
- Aggregate via deterministic factory function

**Ordering (Fixed, Deterministic):**
1. Concurrency lock check (highest priority)
2. Request validation checks (in order: manualTrigger, memoryOnly, deployUnlockAllowed, backendPersistenceAllowed, sessionAuditInheritanceAllowed, canonicalSnapshot, snapshot.source)
3. Vault undefined check
4. Preflight execution
5. Adapter execution
6. Unsafe flag detection (lowest priority)

**No Overwrite Rule**: Later errors do not overwrite earlier errors. All collected errors preserved in result.

**Deterministic Aggregation via Factory:**
```typescript
function aggregateErrors(
  errors: Array<{ code: CanonicalReAuditBlockReason; message: string }>,
  request: CanonicalReAuditRequest
): CanonicalReAuditResult {
  // Errors already in fixed order from collection phase
  // Return BLOCKED with first error code (highest priority)
  // Include all error messages in errors array
  return createBlockedResult(
    request,
    errors[0].code,  // First error (highest priority)
    errors.map(e => e.message)  // All messages
  );
}
```

**Example:**
```typescript
// If BOTH manualTrigger is false AND deployUnlockAllowed is true:
// → Collect MANUAL_TRIGGER_REQUIRED error
// → Collect DEPLOY_UNLOCK_FORBIDDEN error
// → Return BLOCKED with MANUAL_TRIGGER_REQUIRED (first in order)
// → Include both messages in errors array

// If preflight fails AND adapter would throw:
// → Collect preflight.blockReason error
// → Do NOT call adapter (checked later in order)
// → Return BLOCKED with preflight.blockReason
```

---

### 4. ROOT FAIL BEHAVIOR

**If Input Is Not Object:**

**Condition**: `typeof request !== 'object' || request === null`

**Immediate Stop**: Yes. No further processing.

**Response**: Return single error via factory function:

```typescript
function createBlockedResult(
  request: CanonicalReAuditRequest | null | undefined,
  blockReason: CanonicalReAuditBlockReason,
  message: string
): CanonicalReAuditResult {
  return {
    status: CanonicalReAuditStatus.BLOCKED,
    success: false,
    passed: false,
    readyForAcceptance: false,
    deployRemainsLocked: true,
    globalAuditOverwriteAllowed: false,
    backendPersistenceAllowed: false,
    memoryOnly: true,
    sessionAuditInherited: false,
    auditedSnapshot: request?.canonicalSnapshot || {
      articleId: 'unknown',
      promotionId: 'unknown',
      source: 'canonical-vault',
      snapshotHash: 'unknown',
      capturedAt: new Date().toISOString(),
    },
    auditedAt: new Date().toISOString(),
    auditor: 'canonical-reaudit-handler',
    blockReason,
    errors: [message],
  };
}
```

**No Further Steps**: After returning from factory, execution stops. No validation. No preflight. No adapter call.

---

### 5. CROSS-FIELD LIMIT

**Allowed Structural Consistency Checks Only:**

| Check | Allowed | Reason |
|-------|---------|--------|
| `canonicalSnapshot` exists | ✓ YES | Structural requirement |
| `canonicalSnapshot.source === 'canonical-vault'` | ✓ YES | Structural requirement |
| `findings` array length matches audit scope | ✓ YES | Structural consistency |
| `auditedSnapshot.articleId === request.articleId` | ✓ YES | Identity consistency |
| `auditedSnapshot.promotionId === request.promotionId` | ✓ YES | Identity consistency |
| `errors` array length > 0 when status === 'BLOCKED'` | ✓ YES | Structural consistency |

| Check | NOT Allowed | Reason |
|-------|-------------|--------|
| Compare `auditedAt` timestamp with current time | ✗ NO | Value comparison (business logic) |
| Compare `findings` content against business rules | ✗ NO | Value comparison (business logic) |
| Validate `auditor` against approved list | ✗ NO | Value comparison (business logic) |
| Check if `summary` contains specific keywords | ✗ NO | Value comparison (business logic) |
| Validate `promotionId` format or pattern | ✗ NO | Value comparison (business logic) |

**Scope Guarantee**: Cross-field validation is limited to structural consistency only. No business logic. No value comparison. No semantic validation.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Result Mapping Preserves Safety Invariants

*For any* adapter result returned by `runInMemoryCanonicalReAudit`, the mapped handler result SHALL have:
- `deployRemainsLocked: true`
- `globalAuditOverwriteAllowed: false`
- `backendPersistenceAllowed: false`
- `memoryOnly: true`
- `sessionAuditInherited: false`

**Validates: Requirements 1.8, 4.1, 4.2, 4.3, 4.4**

### Property 2: Unsafe Adapter Flags Are Rejected

*For any* adapter result with `deployUnlockAllowed: true` OR `sessionAuditInheritanceAllowed: true`, the handler SHALL return a BLOCKED result with the appropriate block reason (`DEPLOY_UNLOCK_FORBIDDEN` or `SESSION_AUDIT_INHERITANCE_FORBIDDEN`).

**Validates: Requirements 1.7, 4.7, 4.8**

### Property 3: Vault Input Immutability

*For any* vault input provided to `startCanonicalReAudit`, the vault object SHALL remain unchanged after handler execution (no mutations).

**Validates: Requirement 4.6**

### Property 4: Status Mapping Correctness

*For any* adapter result with status `S` in `{'PASSED_PENDING_ACCEPTANCE', 'FAILED_PENDING_REVIEW', 'BLOCKED', 'STALE'}`, the mapped handler result SHALL have status `S` (same status value).

**Validates: Requirement 1.6**

### Property 5: Derived Field Consistency

*For any* handler result with status `PASSED_PENDING_ACCEPTANCE`, the result SHALL have:
- `success: true`
- `passed: true`
- `readyForAcceptance: true`

*For any* handler result with status NOT `PASSED_PENDING_ACCEPTANCE`, the result SHALL have:
- `success: false`
- `passed: false`
- `readyForAcceptance: false`

**Validates: Requirement 1.5**

## Error Handling

### Error Categories

1. **Concurrency Errors**
   - **Trigger**: Handler called while already running
   - **Response**: Return BLOCKED with `AUDIT_RUNNER_UNAVAILABLE`
   - **Recovery**: Caller must wait and retry

2. **Request Validation Errors**
   - **Trigger**: Invalid request flags or missing required fields
   - **Response**: Return BLOCKED with specific reason (e.g., `DEPLOY_UNLOCK_FORBIDDEN`)
   - **Recovery**: Caller must fix request and retry

3. **Preflight Errors**
   - **Trigger**: Vault validation fails or snapshot mismatch detected
   - **Response**: Return BLOCKED/STALE with preflight's blockReason
   - **Recovery**: Caller must fix vault or refresh snapshot

4. **Adapter Execution Errors**
   - **Trigger**: Adapter throws exception
   - **Response**: Return BLOCKED with `AUDIT_RUNNER_FAILED`
   - **Recovery**: Investigate adapter failure, fix root cause

5. **Unsafe Result Errors**
   - **Trigger**: Adapter returns unsafe flags
   - **Response**: Return BLOCKED with `DEPLOY_UNLOCK_FORBIDDEN` or `SESSION_AUDIT_INHERITANCE_FORBIDDEN`
   - **Recovery**: Fix adapter implementation (should never happen)

### Error Handling Patterns

**Try-Catch Wrapper:**
```typescript
try {
  const adapterResult = runInMemoryCanonicalReAudit(preflight.adapterRequest);
  // ... result mapping and safety guards
} catch (error) {
  return createBlockedResult(
    request,
    CanonicalReAuditBlockReason.AUDIT_RUNNER_FAILED,
    `Adapter execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  );
}
```

**Fail-Closed Philosophy:**
- All error paths return BLOCKED status
- No silent failures or undefined behavior
- Explicit error messages for debugging
- Preserve request context in error results

## Testing Strategy

### Unit Tests

**Test Coverage:**
1. **Adapter Execution Tests**
   - Valid preflight → adapter called → result mapped
   - Invalid preflight → adapter NOT called → BLOCKED returned
   - Adapter throws → BLOCKED with `AUDIT_RUNNER_FAILED`

2. **Result Mapping Tests**
   - Each adapter status maps correctly
   - Safety invariants injected for all statuses
   - Derived fields computed correctly
   - Field renaming works correctly

3. **Safety Guard Tests**
   - `deployUnlockAllowed: true` → BLOCKED with `DEPLOY_UNLOCK_FORBIDDEN`
   - `sessionAuditInheritanceAllowed: true` → BLOCKED with `SESSION_AUDIT_INHERITANCE_FORBIDDEN`

4. **Immutability Tests**
   - Vault object unchanged after handler execution
   - Request object unchanged after handler execution

5. **Backward Compatibility Tests**
   - Vault undefined → `AUDIT_RUNNER_UNAVAILABLE` (preserved)
   - Concurrency lock → `AUDIT_RUNNER_UNAVAILABLE` (preserved)
   - Request validation failures → appropriate BLOCKED reasons (preserved)

### Verification Scripts

**1. Execution Verification Script** (NEW in Task 5C):
- **Path**: `scripts/verify-canonical-reaudit-handler-execution.ts`
- **Purpose**: Verify handler calls adapter and maps results correctly
- **Checks**:
  - Handler calls adapter after successful preflight
  - Handler maps adapter result to handler result
  - Handler preserves all safety invariants
  - Handler rejects unsafe adapter results
  - Handler does not mutate vault input
  - Handler returns correct status for each adapter status
  - Handler computes derived fields correctly

**2. Preflight Verification Script** (preserved from Task 5B):
- **Path**: `scripts/verify-canonical-reaudit-handler-preflight.ts`
- **Purpose**: Verify preflight logic still works correctly
- **Checks**: All existing Task 5B checks must pass

**3. Adapter Verification Script** (preserved from Task 5A):
- **Path**: `scripts/verify-canonical-reaudit-adapter.ts`
- **Purpose**: Verify adapter logic still works correctly
- **Checks**: All existing Task 5A checks must pass

### Integration Tests

**Handler → Adapter Integration:**
- Valid request + vault → adapter executes → result returned
- Invalid request → adapter NOT executed → BLOCKED returned
- Stale snapshot → adapter NOT executed → STALE returned

**Handler → Types Integration:**
- Handler result conforms to `CanonicalReAuditResult` type
- All required fields present
- All safety invariants correct

### Regression Tests

**Task 5B Regression:**
- Preflight verification script passes
- Preflight logic unchanged
- Snapshot computation unchanged
- Contamination detection unchanged

**Task 5A Regression:**
- Adapter verification script passes
- Adapter logic unchanged
- Adapter result type unchanged

## Implementation Notes

### File Modifications

**1. app/admin/warroom/handlers/canonical-reaudit-handler.ts** (MODIFY):
- Add `mapAdapterResultToHandlerResult` function
- Add adapter execution logic to `startCanonicalReAudit`
- Add unsafe flag detection logic
- Add try-catch wrapper for adapter execution
- Preserve all existing preflight and validation logic

**2. scripts/verify-canonical-reaudit-handler-preflight.ts** (MODIFY):
- Update test expectations to verify adapter is NOT called when preflight fails
- Add test to verify adapter IS called when preflight succeeds
- Preserve all existing preflight checks

**3. scripts/verify-canonical-reaudit-handler-execution.ts** (ADD):
- New verification script for Task 5C
- Verify adapter execution
- Verify result mapping
- Verify safety guards
- Verify immutability

### Implementation Order

1. **Phase 1: Result Mapper**
   - Implement `mapAdapterResultToHandlerResult` function
   - Add unit tests for result mapping
   - Verify type transformations

2. **Phase 2: Adapter Integration**
   - Add adapter execution to `startCanonicalReAudit`
   - Add try-catch wrapper
   - Add unsafe flag detection
   - Preserve existing preflight logic

3. **Phase 3: Verification**
   - Create execution verification script
   - Update preflight verification script
   - Run all verification scripts
   - Verify regression tests pass

4. **Phase 4: Documentation**
   - Update handler file comments
   - Update verification script comments
   - Document result mapping logic
   - Document safety guards

### Safety Checklist

Before merging Task 5C:
- [ ] Handler calls adapter only after successful preflight
- [ ] Handler maps adapter result correctly
- [ ] Handler injects all safety invariants
- [ ] Handler rejects unsafe adapter flags
- [ ] Handler does not mutate vault input
- [ ] Handler does not mutate request input
- [ ] Handler does not call backend/API/database
- [ ] Handler does not use localStorage/sessionStorage
- [ ] Handler does not unlock deploy
- [ ] Handler does not overwrite globalAudit
- [ ] Handler does not inherit session audit
- [ ] Execution verification script passes
- [ ] Preflight verification script passes
- [ ] Adapter verification script passes
- [ ] No UI/page/hook changes
- [ ] No new dependencies added

## Future Work

### Task 5D: Hook Layer Integration (Out of Scope)

The handler layer (Task 5C) provides the foundation for the hook layer (Task 5D), which will:
- Wrap `startCanonicalReAudit` in a React hook
- Manage lifecycle state (NOT_RUN, RUNNING, PASSED, FAILED, BLOCKED, STALE)
- Expose read-only state to UI components
- Provide explicit operator controls (run, reset)

The handler layer is designed to be hook-agnostic and can be tested independently of React.

### Task 5E: UI Integration (Out of Scope)

The UI layer will:
- Consume the hook's read-only state
- Display canonical re-audit results
- Provide operator controls for triggering re-audit
- Show audit findings and summary

The handler layer is designed to be UI-agnostic and can be tested independently of UI components.

## Appendix: Type Mapping Reference

### Adapter Result → Handler Result Mapping

| Adapter Field | Handler Field | Transformation |
|--------------|---------------|----------------|
| `status` | `status` | Enum conversion |
| `snapshotIdentity` | `auditedSnapshot` | Direct copy |
| `auditSummary` | `summary` | Rename |
| `findings` | `findings` | Direct copy |
| `blockReason` | `blockReason` | Direct copy |
| `blockMessage` | `errors` | Wrap in array |
| `auditedAt` | `auditedAt` | Direct copy |
| `auditor` | `auditor` | Direct copy |
| N/A | `success` | Derived from status |
| N/A | `passed` | Derived from status |
| N/A | `readyForAcceptance` | Derived from status |
| N/A | `deployRemainsLocked` | Always `true` |
| N/A | `globalAuditOverwriteAllowed` | Always `false` |
| N/A | `backendPersistenceAllowed` | Always `false` |
| N/A | `memoryOnly` | Always `true` |
| N/A | `sessionAuditInherited` | Always `false` |
| N/A | `promotionId` | From request or snapshot |

### Safety Invariant Enforcement

| Invariant | Source | Enforcement Point |
|-----------|--------|-------------------|
| `deployRemainsLocked: true` | Handler | Result mapper |
| `globalAuditOverwriteAllowed: false` | Handler | Result mapper |
| `backendPersistenceAllowed: false` | Handler | Result mapper |
| `memoryOnly: true` | Handler | Result mapper |
| `sessionAuditInherited: false` | Handler | Result mapper |
| `deployUnlockAllowed: false` | Adapter | Unsafe flag guard |
| `sessionAuditInheritanceAllowed: false` | Adapter | Unsafe flag guard |

---

**Document Version**: 1.0.0  
**Author**: SIA Intelligence Systems  
**Date**: 2026-05-01  
**Task**: 5C - Handler Layer Implementation
