# Validator Integration Summary

**Date**: 2026-05-03  
**Status**: ✅ Complete  
**Validator**: `validateCanonicalReAuditRequest`

---

## Quick Reference

### What Was Fixed

| Aspect | Before | After |
|--------|--------|-------|
| **Validator Used** | `validateCanonicalReAuditRegistrationPreviewAssessment` | `validateCanonicalReAuditRequest` |
| **Domain** | Registration preview assessment | Canonical re-audit request |
| **Expected Fields** | `__kind`, `assessmentStage`, `preview`, etc. | `articleId`, `operatorId`, `canonicalSnapshot`, flags |
| **Result** | Always failed (all fields undefined) | Validates correctly |
| **Handler Status** | Always BLOCKED | Proceeds to preflight/adapter |

---

## Validator Location

**Module**: `lib/editorial/canonical-reaudit-request-validator.ts`

**Function**: 
```typescript
export function validateCanonicalReAuditRequest(
  input: unknown
): CanonicalReAuditRequestValidationResult
```

**Imports**:
```typescript
import { validateCanonicalReAuditRequest } 
  from "lib/editorial/canonical-reaudit-request-validator";
```

---

## Where It's Used

### Handler Integration

**File**: `app/admin/warroom/handlers/canonical-reaudit-handler.ts`

**Function**: `startCanonicalReAudit()`

**Step**: 1 (First validation step)

**Code**:
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

  // Continue to Step 2: Request-level guards
  // ...
}
```

---

## Validation Checks

### Fields Validated

| Field | Type | Required | Constraint |
|-------|------|----------|-----------|
| `articleId` | string | Yes | Non-empty |
| `operatorId` | string | Yes | Non-empty |
| `requestedAt` | string | Yes | Valid ISO 8601 |
| `canonicalSnapshot` | object | Yes | See snapshot structure |
| `promotionArchiveId` | string | No | If present, must be string |
| `promotionId` | string | No | If present, must be string |
| `manualTrigger` | boolean | Yes | Must be `true` |
| `memoryOnly` | boolean | Yes | Must be `true` |
| `deployUnlockAllowed` | boolean | Yes | Must be `false` |
| `backendPersistenceAllowed` | boolean | Yes | Must be `false` |
| `sessionAuditInheritanceAllowed` | boolean | Yes | Must be `false` |

### Snapshot Structure

```typescript
interface CanonicalReAuditSnapshotIdentity {
  contentHash: string;           // Required
  ledgerSequence: number;        // Required
  source: "canonical-vault";     // Required (exact value)
  capturedAt: string;            // Required (valid ISO 8601)
  promotionId?: string;          // Optional
}
```

---

## Error Handling

### Error Codes

| Code | Meaning | Example |
|------|---------|---------|
| `MISSING_REQUIRED_FIELD` | Required field missing or wrong type | articleId missing |
| `INVALID_TYPE` | Field has wrong type | promotionId is number instead of string |
| `INVALID_SNAPSHOT_STRUCTURE` | Snapshot structure invalid | source is not "canonical-vault" |
| `INVALID_FLAG_VALUE` | Flag has wrong value | deployUnlockAllowed is true instead of false |
| `INVALID_TIMESTAMP` | Timestamp not valid ISO 8601 | requestedAt is "2026-05-03" instead of ISO format |

### Error Response

```typescript
interface CanonicalReAuditRequestValidationError {
  code: CanonicalReAuditRequestValidationErrorCode;
  fieldPath: readonly string[];
  message: string;
  remediationHint: string;
}
```

### Example Error

```typescript
{
  code: "INVALID_FLAG_VALUE",
  fieldPath: ["deployUnlockAllowed"],
  message: "deployUnlockAllowed must be false",
  remediationHint: "Set deployUnlockAllowed to false"
}
```

---

## Execution Flow

```
startCanonicalReAudit(request, vault)
  │
  ├─ STEP 1: Validator
  │  ├─ validateCanonicalReAuditRequest(request)
  │  ├─ Check: Plain object
  │  ├─ Check: Required string fields
  │  ├─ Check: Snapshot structure
  │  ├─ Check: Boolean flags
  │  ├─ Check: Optional fields
  │  │
  │  ├─ FAIL → Return BLOCKED
  │  └─ PASS → Continue
  │
  ├─ STEP 2: Request-level guards
  │  ├─ Check: manualTrigger === true
  │  ├─ Check: memoryOnly === true
  │  ├─ Check: deployUnlockAllowed === false
  │  ├─ Check: backendPersistenceAllowed === false
  │  ├─ Check: sessionAuditInheritanceAllowed === false
  │  ├─ Check: canonicalSnapshot exists
  │  ├─ Check: snapshot.source === "canonical-vault"
  │  │
  │  ├─ FAIL → Return BLOCKED
  │  └─ PASS → Continue
  │
  ├─ STEP 3: Preflight
  │  ├─ buildCanonicalReAuditAdapterPreflight(request, vault)
  │  ├─ Check: Vault not contaminated
  │  ├─ Check: Snapshot not stale (contentHash match)
  │  │
  │  ├─ FAIL → Return BLOCKED/STALE
  │  └─ PASS → Continue
  │
  └─ STEP 4: Adapter
     ├─ runInMemoryCanonicalReAudit(adapterRequest)
     ├─ Call: runGlobalGovernanceAudit()
     ├─ Map: mapAdapterResultToHandlerResult()
     └─ Return: CanonicalReAuditResult
```

---

## Safety Properties

### Validator Properties

✅ **Pure Function**
- No side effects
- No mutation
- No I/O
- Deterministic

✅ **Fail-Closed**
- Invalid input → valid=false
- Ambiguous input → valid=false
- All errors collected

✅ **Type-Safe**
- Validates all required fields
- Validates all flag values
- Validates snapshot structure
- Validates timestamp format

✅ **Domain-Correct**
- Validates CanonicalReAuditRequest structure
- Checks safety flags
- Validates snapshot identity
- Matches actual request type

### Handler Properties

✅ **Validation Before Execution**
- Validator runs first
- If validation fails, handler returns BLOCKED immediately
- No preflight or adapter execution on validation failure

✅ **Defense-in-Depth**
- Validator checks flags
- Request-level guards check flags again
- Preflight checks vault state
- Adapter checks content

✅ **Memory-Only**
- No backend calls
- No persistence
- No state mutation
- No deploy unlock

✅ **Fail-Closed**
- All ambiguous states return BLOCKED
- All invalid states return BLOCKED
- All errors are collected and reported

---

## Files Created

### New Validator Files

1. **lib/editorial/canonical-reaudit-request-validation-result.ts**
   - Type definitions
   - Error codes
   - Result interface

2. **lib/editorial/canonical-reaudit-request-validation-factories.ts**
   - Factory functions
   - Error creation
   - Result creation

3. **lib/editorial/canonical-reaudit-request-validation-guards.ts**
   - Guard functions
   - Type checks
   - Field validation

4. **lib/editorial/canonical-reaudit-request-validator.ts**
   - Main validator
   - Validation logic
   - Error collection

### Modified Files

1. **app/admin/warroom/handlers/canonical-reaudit-handler.ts**
   - Updated import
   - Updated validator call
   - Removed old input builder

---

## Testing

### Valid Request Test

```typescript
const validRequest: CanonicalReAuditRequest = {
  articleId: "art-123",
  operatorId: "op-456",
  requestedAt: "2026-05-03T12:00:00.000Z",
  canonicalSnapshot: {
    contentHash: "abc123def456",
    ledgerSequence: 0,
    source: "canonical-vault",
    capturedAt: "2026-05-03T12:00:00.000Z"
  },
  manualTrigger: true,
  memoryOnly: true,
  deployUnlockAllowed: false,
  backendPersistenceAllowed: false,
  sessionAuditInheritanceAllowed: false
};

const result = validateCanonicalReAuditRequest(validRequest);
// Expected: valid === true, errors === []
```

### Invalid Request Test

```typescript
const invalidRequest = {
  // Missing articleId
  operatorId: "op-456",
  requestedAt: "2026-05-03T12:00:00.000Z",
  canonicalSnapshot: { /* ... */ },
  manualTrigger: true,
  memoryOnly: true,
  deployUnlockAllowed: false,
  backendPersistenceAllowed: false,
  sessionAuditInheritanceAllowed: false
};

const result = validateCanonicalReAuditRequest(invalidRequest);
// Expected: valid === false, errors[0].code === "MISSING_REQUIRED_FIELD"
```

---

## Compilation Status

✅ **No Diagnostics**
- All new files compile successfully
- Handler compiles successfully
- No type errors
- No import errors

---

## Summary

### What Changed

✅ Validator now validates correct domain (CanonicalReAuditRequest)  
✅ Validator now checks actual request structure  
✅ Validator now validates safety flags  
✅ Handler now uses domain-correct validator  

### What Stayed the Same

✅ Handler execution order unchanged  
✅ Preflight logic unchanged  
✅ Adapter integration unchanged  
✅ Result mapping unchanged  
✅ Safety invariants unchanged  
✅ Memory-only operation unchanged  
✅ Deploy remains locked  

### Impact

✅ Handler can now proceed past validation with valid requests  
✅ Handler still blocks invalid requests  
✅ All safety properties maintained  
✅ No breaking changes  

---

**Document Version**: 1.0.0  
**Status**: ✅ Complete  
**Date**: 2026-05-03
