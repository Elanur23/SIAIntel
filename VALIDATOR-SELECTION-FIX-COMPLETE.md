# Validator Selection Fix - Complete

**Date**: 2026-05-03  
**Status**: ✅ COMPLETE  
**Impact**: Critical - Fixes validator domain mismatch

---

## Problem Statement

The canonical re-audit handler was using the **wrong validator** for the **wrong domain**:

### ❌ BEFORE: Incorrect Validator Usage

```typescript
// Handler was using:
import { validateCanonicalReAuditRegistrationPreviewAssessment } 
  from "lib/editorial/canonical-reaudit-registration-preview-assessment-validator";

// Called with CanonicalReAuditRequest:
const validationResult = validateCanonicalReAuditRegistrationPreviewAssessment(request);
```

**The Mismatch:**

| Aspect | CanonicalReAuditRequest | Registration Preview Assessment Validator |
|--------|------------------------|------------------------------------------|
| **Domain** | Canonical re-audit phase | Registration preview assessment phase |
| **Expected Fields** | articleId, operatorId, canonicalSnapshot, flags | __kind, assessmentStage, preview, eligibility, explanation, safety, boundary, assessmentNotes |
| **Result** | All fields map to undefined | Validator always fails |
| **Impact** | Handler always returns BLOCKED | No canonical re-audit can execute |

### Root Cause

The validator was designed for a different phase (registration preview assessment) and expected a completely different request structure. When called with `CanonicalReAuditRequest`, all expected fields were undefined, causing validation to always fail.

---

## Solution

Created a **domain-correct validator** for `CanonicalReAuditRequest`:

### ✅ AFTER: Correct Validator Usage

```typescript
// Handler now uses:
import { validateCanonicalReAuditRequest } 
  from "lib/editorial/canonical-reaudit-request-validator";

// Called with CanonicalReAuditRequest:
const validationResult = validateCanonicalReAuditRequest(request);
```

---

## New Validator Contract

### File Structure

```
lib/editorial/
├── canonical-reaudit-request-validation-result.ts    (Type definitions)
├── canonical-reaudit-request-validation-factories.ts  (Factory functions)
├── canonical-reaudit-request-validation-guards.ts     (Guard functions)
└── canonical-reaudit-request-validator.ts             (Main validator)
```

### Validator: `validateCanonicalReAuditRequest(input: unknown)`

**Purpose**: Validate that input is a valid `CanonicalReAuditRequest`

**Checks Performed**:

1. **Root Input Check (Fail-Fast)**
   - Input must be a plain object (not null, not array, not primitive)

2. **Required String Fields**
   - `articleId` - must be a non-empty string
   - `operatorId` - must be a non-empty string
   - `requestedAt` - must be a valid ISO 8601 timestamp

3. **Canonical Snapshot Structure**
   - `canonicalSnapshot.contentHash` - must be a string
   - `canonicalSnapshot.ledgerSequence` - must be a number
   - `canonicalSnapshot.source` - must be exactly `"canonical-vault"`
   - `canonicalSnapshot.capturedAt` - must be a valid ISO 8601 timestamp

4. **Required Boolean Flags (Safety Constraints)**
   - `manualTrigger` - must be exactly `true`
   - `memoryOnly` - must be exactly `true`
   - `deployUnlockAllowed` - must be exactly `false`
   - `backendPersistenceAllowed` - must be exactly `false`
   - `sessionAuditInheritanceAllowed` - must be exactly `false`

5. **Optional Fields**
   - `promotionArchiveId` - if present, must be a string
   - `promotionId` - if present, must be a string

### Validation Result

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
```

**Error Codes**:
- `MISSING_REQUIRED_FIELD` - Required field is missing or wrong type
- `INVALID_TYPE` - Field has wrong type
- `INVALID_SNAPSHOT_STRUCTURE` - Snapshot structure is invalid
- `INVALID_FLAG_VALUE` - Flag has wrong value
- `INVALID_TIMESTAMP` - Timestamp is not valid ISO 8601

---

## Handler Integration

### Updated Handler Flow

```typescript
export function startCanonicalReAudit(
  request: CanonicalReAuditRequest,
  vault?: CanonicalVaultInput
): CanonicalReAuditResult {
  // ── STEP 1: VALIDATOR (Task 5D: Validator Integration) ──────────────────
  // Validate request structure and safety constraints BEFORE any execution
  const validationResult = validateCanonicalReAuditRequest(request);
  
  if (!validationResult.valid) {
    // Validator failed - return BLOCKED with validation errors
    const validationErrors = validationResult.errors.map(err => err.message).join('; ');
    return createBlockedResult(
      request,
      CanonicalReAuditBlockReason.UNKNOWN,
      `Validator failed: ${validationErrors}`
    );
  }

  // ── STEP 2: Request-level guards (unchanged) ─────────────────────────────
  // ... existing checks ...

  // ── STEP 3: Bridge preflight (unchanged) ─────────────────────────────────
  // ... existing preflight logic ...

  // ── STEP 4: Adapter execution (unchanged) ────────────────────────────────
  // ... existing adapter execution ...
}
```

### Execution Order (STRICT)

1. **Validator** (`validateCanonicalReAuditRequest`)
   - Validates request structure and safety flags
   - If FAIL → return BLOCKED immediately
   - If PASS → continue to Step 2

2. **Request-level guards** (unchanged)
   - Verify manualTrigger, memoryOnly, flags
   - Verify canonicalSnapshot exists and has correct source

3. **Preflight** (`buildCanonicalReAuditAdapterPreflight`)
   - Staleness detection (contentHash mismatch)
   - Session contamination detection
   - If FAIL → return BLOCKED/STALE

4. **Adapter** (`runInMemoryCanonicalReAudit`)
   - Calls `runGlobalGovernanceAudit` for content validation
   - Returns audit result

---

## Files Changed

### New Files Created

1. **lib/editorial/canonical-reaudit-request-validation-result.ts**
   - Type definitions for validation result and errors
   - Error codes: MISSING_REQUIRED_FIELD, INVALID_TYPE, INVALID_SNAPSHOT_STRUCTURE, INVALID_FLAG_VALUE, INVALID_TIMESTAMP

2. **lib/editorial/canonical-reaudit-request-validation-factories.ts**
   - Pure factory functions for creating validation errors and results
   - `createCanonicalReAuditRequestValidationError()`
   - `createCanonicalReAuditRequestValidationResult()`

3. **lib/editorial/canonical-reaudit-request-validation-guards.ts**
   - Pure guard functions for type checking
   - `isPlainRecord()` - checks if input is plain object
   - `hasOwnStringField()` - checks for string field
   - `hasOwnBooleanField()` - checks for boolean field
   - `hasOwnLiteralField()` - checks for exact value
   - `isValidISOTimestamp()` - validates ISO 8601 timestamp
   - `hasValidSnapshotStructure()` - validates snapshot structure

4. **lib/editorial/canonical-reaudit-request-validator.ts**
   - Main validator function: `validateCanonicalReAuditRequest()`
   - Performs all validation checks in strict order
   - Collects all errors (not fail-fast after root check)
   - Returns validation result with error details

### Modified Files

1. **app/admin/warroom/handlers/canonical-reaudit-handler.ts**
   - Changed import from `validateCanonicalReAuditRegistrationPreviewAssessment` to `validateCanonicalReAuditRequest`
   - Removed `buildRegistrationPreviewAssessmentInput()` function (no longer needed)
   - Updated validator call to use correct validator
   - Execution order unchanged, validator now validates correct domain

---

## Validation Examples

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
// result.valid === true
// result.errors === []
```

### ❌ Invalid Request (Missing Required Field)

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
// result.valid === false
// result.errors[0].code === "MISSING_REQUIRED_FIELD"
// result.errors[0].fieldPath === ["articleId"]
// result.errors[0].message === "articleId is required and must be a string"
```

### ❌ Invalid Request (Wrong Flag Value)

```typescript
const invalidRequest = {
  articleId: "art-123",
  operatorId: "op-456",
  requestedAt: "2026-05-03T12:00:00.000Z",
  canonicalSnapshot: { /* ... */ },
  manualTrigger: true,
  memoryOnly: true,
  deployUnlockAllowed: true,  // ❌ Should be false
  backendPersistenceAllowed: false,
  sessionAuditInheritanceAllowed: false
};

const result = validateCanonicalReAuditRequest(invalidRequest);
// result.valid === false
// result.errors[0].code === "INVALID_FLAG_VALUE"
// result.errors[0].fieldPath === ["deployUnlockAllowed"]
// result.errors[0].message === "deployUnlockAllowed must be false"
```

---

## Safety Properties

### Validator Properties

✅ **Pure Function**
- No side effects
- No mutation
- No I/O
- Deterministic output

✅ **Fail-Closed**
- Root input check fails fast
- All other checks collect all errors
- Invalid input always returns valid=false

✅ **Type-Safe**
- Validates all required fields
- Validates all flag values
- Validates snapshot structure
- Validates timestamp format

✅ **Domain-Correct**
- Validates CanonicalReAuditRequest structure
- Checks safety flags (manualTrigger, memoryOnly, etc.)
- Validates snapshot identity structure
- Matches actual request type contract

---

## Compilation Status

✅ **No Diagnostics**
- `app/admin/warroom/handlers/canonical-reaudit-handler.ts` - OK
- `lib/editorial/canonical-reaudit-request-validator.ts` - OK
- All new validation files - OK

---

## Impact Analysis

### What Changed

- ✅ Validator now validates correct domain (CanonicalReAuditRequest)
- ✅ Validator now checks actual request structure
- ✅ Validator now validates safety flags
- ✅ Handler now uses domain-correct validator

### What Stayed the Same

- ✅ Handler execution order unchanged
- ✅ Preflight logic unchanged
- ✅ Adapter integration unchanged
- ✅ Result mapping unchanged
- ✅ Safety invariants unchanged
- ✅ Memory-only operation unchanged
- ✅ Deploy remains locked

### Backward Compatibility

- ✅ No breaking changes to handler interface
- ✅ No breaking changes to adapter interface
- ✅ No breaking changes to result types
- ✅ Existing callers unaffected

---

## Next Steps

1. **Run Verification Scripts**
   - Execute `scripts/verify-canonical-reaudit-handler-execution.ts`
   - Execute `scripts/verify-canonical-reaudit-handler-preflight.ts`
   - Execute `scripts/verify-canonical-reaudit-adapter.ts`

2. **Test Handler Integration**
   - Test with valid requests
   - Test with invalid requests
   - Test error handling

3. **Update Documentation**
   - Update handler documentation
   - Update validator documentation
   - Update integration guide

---

## Summary

**Problem**: Handler was using wrong validator for wrong domain  
**Solution**: Created domain-correct validator for CanonicalReAuditRequest  
**Result**: Handler now validates correct request structure and safety flags  
**Status**: ✅ Complete and ready for testing

The validator now correctly validates `CanonicalReAuditRequest` objects with:
- Required string fields (articleId, operatorId, requestedAt)
- Canonical snapshot structure validation
- Safety flag validation (manualTrigger=true, memoryOnly=true, others=false)
- Optional field validation
- Comprehensive error reporting

All changes are backward compatible and maintain the existing handler execution order and safety properties.
