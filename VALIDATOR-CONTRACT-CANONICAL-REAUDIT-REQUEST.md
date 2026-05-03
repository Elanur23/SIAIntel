# Validator Contract: validateCanonicalReAuditRequest

**Module**: `lib/editorial/canonical-reaudit-request-validator.ts`  
**Function**: `validateCanonicalReAuditRequest(input: unknown)`  
**Domain**: Canonical Re-Audit Request Validation  
**Status**: ✅ Active

---

## Function Signature

```typescript
export function validateCanonicalReAuditRequest(
  input: unknown
): CanonicalReAuditRequestValidationResult
```

---

## Input Contract

**Type**: `unknown`  
**Expected**: `CanonicalReAuditRequest` object

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

interface CanonicalReAuditSnapshotIdentity {
  contentHash: string;
  ledgerSequence: number;
  source: "canonical-vault";
  capturedAt: string;
  promotionId?: string;
}
```

---

## Output Contract

**Type**: `CanonicalReAuditRequestValidationResult`

```typescript
interface CanonicalReAuditRequestValidationResult {
  readonly __kind: "canonical-reaudit-request-validation-result";
  readonly valid: boolean;
  readonly errors: readonly CanonicalReAuditRequestValidationError[];
}

interface CanonicalReAuditRequestValidationError {
  readonly code: CanonicalReAuditRequestValidationErrorCode;
  readonly fieldPath: readonly string[];
  readonly message: string;
  readonly remediationHint: string;
}

type CanonicalReAuditRequestValidationErrorCode =
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_TYPE"
  | "INVALID_SNAPSHOT_STRUCTURE"
  | "INVALID_FLAG_VALUE"
  | "INVALID_TIMESTAMP"
  | "MUTATION_FORBIDDEN";
```

---

## Validation Checks

### Check 1: Root Input (Fail-Fast)

**Condition**: Input must be a plain object

```typescript
if (!isPlainRecord(input)) {
  return {
    valid: false,
    errors: [{
      code: "INVALID_TYPE",
      fieldPath: [],
      message: "Input must be a plain object (not null, not array)",
      remediationHint: "Ensure input is a plain JavaScript object"
    }]
  };
}
```

**Fail-Fast**: Yes - returns immediately if root check fails

---

### Check 2: Required String Fields

**Fields**: `articleId`, `operatorId`, `requestedAt`

**Validation**:
- Must be present
- Must be of type `string`
- `requestedAt` must be valid ISO 8601 timestamp

**Error Code**: `MISSING_REQUIRED_FIELD` or `INVALID_TIMESTAMP`

**Example Error**:
```typescript
{
  code: "MISSING_REQUIRED_FIELD",
  fieldPath: ["articleId"],
  message: "articleId is required and must be a string",
  remediationHint: "Provide a non-empty string for articleId"
}
```

---

### Check 3: Canonical Snapshot Structure

**Field**: `canonicalSnapshot`

**Validation**:
- Must be present
- Must be a plain object
- Must have `contentHash` (string)
- Must have `ledgerSequence` (number)
- Must have `source` (exactly `"canonical-vault"`)
- Must have `capturedAt` (valid ISO 8601 timestamp)

**Error Code**: `INVALID_SNAPSHOT_STRUCTURE`

**Example Error**:
```typescript
{
  code: "INVALID_SNAPSHOT_STRUCTURE",
  fieldPath: ["canonicalSnapshot"],
  message: "canonicalSnapshot must have contentHash (string), ledgerSequence (number), source ('canonical-vault'), and capturedAt (ISO timestamp)",
  remediationHint: "Provide a valid CanonicalReAuditSnapshotIdentity object"
}
```

---

### Check 4: Required Boolean Flags

**Fields**: `manualTrigger`, `memoryOnly`, `deployUnlockAllowed`, `backendPersistenceAllowed`, `sessionAuditInheritanceAllowed`

**Validation**:
- Must be present
- Must be of type `boolean`
- Must have exact values:
  - `manualTrigger` = `true`
  - `memoryOnly` = `true`
  - `deployUnlockAllowed` = `false`
  - `backendPersistenceAllowed` = `false`
  - `sessionAuditInheritanceAllowed` = `false`

**Error Codes**: `MISSING_REQUIRED_FIELD` or `INVALID_FLAG_VALUE`

**Example Errors**:
```typescript
// Missing flag
{
  code: "MISSING_REQUIRED_FIELD",
  fieldPath: ["manualTrigger"],
  message: "manualTrigger is required and must be a boolean",
  remediationHint: "Set manualTrigger to true"
}

// Wrong flag value
{
  code: "INVALID_FLAG_VALUE",
  fieldPath: ["deployUnlockAllowed"],
  message: "deployUnlockAllowed must be false",
  remediationHint: "Set deployUnlockAllowed to false"
}
```

---

### Check 5: Optional Fields

**Fields**: `promotionArchiveId`, `promotionId`

**Validation**:
- If present, must be of type `string`
- Can be omitted entirely

**Error Code**: `INVALID_TYPE`

**Example Error**:
```typescript
{
  code: "INVALID_TYPE",
  fieldPath: ["promotionId"],
  message: "promotionId must be a string if provided",
  remediationHint: "Provide a string or omit the field"
}
```

---

## Validation Behavior

### Error Collection

- **Root Check**: Fail-fast (returns immediately if input is not plain object)
- **All Other Checks**: Collect all errors (does not stop at first error)
- **Result**: All validation errors are returned in single result

### Determinism

- Pure function - no side effects
- Same input always produces same output
- No randomness, no I/O, no mutation

### Fail-Closed

- Invalid input always returns `valid: false`
- Ambiguous input always returns `valid: false`
- Missing required fields always return `valid: false`
- Wrong flag values always return `valid: false`

---

## Usage in Handler

### Location

**File**: `app/admin/warroom/handlers/canonical-reaudit-handler.ts`  
**Function**: `startCanonicalReAudit()`  
**Step**: 1 (First step, before preflight and adapter)

### Code

```typescript
export function startCanonicalReAudit(
  request: CanonicalReAuditRequest,
  vault?: CanonicalVaultInput
): CanonicalReAuditResult {
  // ── STEP 1: VALIDATOR ────────────────────────────────────────────────────
  const validationResult = validateCanonicalReAuditRequest(request);
  
  if (!validationResult.valid) {
    const validationErrors = validationResult.errors
      .map(err => err.message)
      .join('; ');
    return createBlockedResult(
      request,
      CanonicalReAuditBlockReason.UNKNOWN,
      `Validator failed: ${validationErrors}`
    );
  }

  // ── STEP 2: Request-level guards ─────────────────────────────────────────
  // ... existing checks ...

  // ── STEP 3: Preflight ────────────────────────────────────────────────────
  // ... existing preflight logic ...

  // ── STEP 4: Adapter ──────────────────────────────────────────────────────
  // ... existing adapter execution ...
}
```

### Execution Order

1. **Validator** (this function)
   - Validates request structure
   - If FAIL → return BLOCKED immediately
   - If PASS → continue to Step 2

2. **Request-level guards**
   - Verify flags again (defense-in-depth)
   - Verify snapshot source

3. **Preflight**
   - Staleness detection
   - Contamination detection

4. **Adapter**
   - Run in-memory audit

---

## Test Cases

### ✅ Valid Request

```typescript
const validRequest: CanonicalReAuditRequest = {
  articleId: "art-123",
  operatorId: "op-456",
  requestedAt: "2026-05-03T12:00:00.000Z",
  canonicalSnapshot: {
    contentHash: "abc123def456",
    ledgerSequence: 0,
    source: "canonical-vault",
    capturedAt: "2026-05-03T12:00:00.000Z",
    promotionId: "promo-789"
  },
  promotionArchiveId: "archive-001",
  promotionId: "promo-789",
  manualTrigger: true,
  memoryOnly: true,
  deployUnlockAllowed: false,
  backendPersistenceAllowed: false,
  sessionAuditInheritanceAllowed: false
};

const result = validateCanonicalReAuditRequest(validRequest);
assert(result.valid === true);
assert(result.errors.length === 0);
```

### ❌ Invalid: Not a Plain Object

```typescript
const result = validateCanonicalReAuditRequest(null);
assert(result.valid === false);
assert(result.errors[0].code === "INVALID_TYPE");
```

### ❌ Invalid: Missing Required Field

```typescript
const result = validateCanonicalReAuditRequest({
  // Missing articleId
  operatorId: "op-456",
  requestedAt: "2026-05-03T12:00:00.000Z",
  canonicalSnapshot: { /* ... */ },
  manualTrigger: true,
  memoryOnly: true,
  deployUnlockAllowed: false,
  backendPersistenceAllowed: false,
  sessionAuditInheritanceAllowed: false
});
assert(result.valid === false);
assert(result.errors[0].code === "MISSING_REQUIRED_FIELD");
assert(result.errors[0].fieldPath[0] === "articleId");
```

### ❌ Invalid: Wrong Flag Value

```typescript
const result = validateCanonicalReAuditRequest({
  articleId: "art-123",
  operatorId: "op-456",
  requestedAt: "2026-05-03T12:00:00.000Z",
  canonicalSnapshot: { /* ... */ },
  manualTrigger: true,
  memoryOnly: true,
  deployUnlockAllowed: true,  // ❌ Should be false
  backendPersistenceAllowed: false,
  sessionAuditInheritanceAllowed: false
});
assert(result.valid === false);
assert(result.errors[0].code === "INVALID_FLAG_VALUE");
assert(result.errors[0].fieldPath[0] === "deployUnlockAllowed");
```

### ❌ Invalid: Invalid Snapshot Structure

```typescript
const result = validateCanonicalReAuditRequest({
  articleId: "art-123",
  operatorId: "op-456",
  requestedAt: "2026-05-03T12:00:00.000Z",
  canonicalSnapshot: {
    contentHash: "abc123",
    ledgerSequence: 0,
    source: "wrong-source",  // ❌ Should be "canonical-vault"
    capturedAt: "2026-05-03T12:00:00.000Z"
  },
  manualTrigger: true,
  memoryOnly: true,
  deployUnlockAllowed: false,
  backendPersistenceAllowed: false,
  sessionAuditInheritanceAllowed: false
});
assert(result.valid === false);
assert(result.errors[0].code === "INVALID_SNAPSHOT_STRUCTURE");
```

---

## Safety Properties

✅ **Pure Function**
- No side effects
- No mutation
- No I/O
- No external access

✅ **Fail-Closed**
- Invalid input always returns valid=false
- Ambiguous input always returns valid=false
- All errors collected and returned

✅ **Type-Safe**
- Validates all required fields
- Validates all flag values
- Validates snapshot structure
- Validates timestamp format

✅ **Domain-Correct**
- Validates CanonicalReAuditRequest structure
- Checks safety flags
- Validates snapshot identity
- Matches actual request type contract

---

## Related Files

- **Handler**: `app/admin/warroom/handlers/canonical-reaudit-handler.ts`
- **Types**: `lib/editorial/canonical-reaudit-types.ts`
- **Adapter**: `lib/editorial/canonical-reaudit-adapter.ts`
- **Preflight**: `app/admin/warroom/handlers/canonical-reaudit-handler.ts` (buildCanonicalReAuditAdapterPreflight)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-05-03 | Initial validator creation |

---

**Document Version**: 1.0.0  
**Last Updated**: 2026-05-03  
**Status**: ✅ Active
