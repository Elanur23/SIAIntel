# Validator Selection Fix: Before & After Comparison

**Date**: 2026-05-03  
**Status**: ✅ Complete

---

## Problem Overview

The canonical re-audit handler was using a validator designed for a **different domain** to validate a **different request type**. This caused all validation to fail, preventing any canonical re-audit from executing.

---

## BEFORE: Incorrect Validator Usage

### Import

```typescript
// ❌ WRONG: Validator for registration preview assessment
import { validateCanonicalReAuditRegistrationPreviewAssessment } 
  from "lib/editorial/canonical-reaudit-registration-preview-assessment-validator";
```

### Input Builder

```typescript
// ❌ WRONG: Maps CanonicalReAuditRequest to registration preview assessment shape
export function buildRegistrationPreviewAssessmentInput(request: unknown): unknown {
  if (!request || typeof request !== 'object' || Array.isArray(request)) {
    return request;
  }
  
  const req = request as Record<string, any>;
  
  // Extract fields that don't exist in CanonicalReAuditRequest
  const __kind = req.__kind;                    // ❌ undefined
  const assessmentStage = req.assessmentStage;  // ❌ undefined
  const preview = req.preview;                  // ❌ undefined
  const eligibility = req.eligibility;          // ❌ undefined
  const explanation = req.explanation;          // ❌ undefined
  const safety = req.safety;                    // ❌ undefined
  const boundary = req.boundary;                // ❌ undefined
  const assessmentNotes = req.assessmentNotes;  // ❌ undefined
  
  // Return mapped shape (all fields undefined)
  return {
    __kind,
    assessmentStage,
    preview,
    eligibility,
    explanation,
    safety,
    boundary,
    assessmentNotes
  };
}
```

### Validator Call

```typescript
// ❌ WRONG: Calling wrong validator with wrong input
const validatorInput = buildRegistrationPreviewAssessmentInput(request);
const validationResult = validateCanonicalReAuditRegistrationPreviewAssessment(validatorInput);

if (!validationResult.valid) {
  // ❌ ALWAYS FAILS: All fields are undefined
  return createBlockedResult(
    request,
    CanonicalReAuditBlockReason.UNKNOWN,
    `Validator failed: ${validationErrors}`
  );
}
```

### Result

```
Input: CanonicalReAuditRequest {
  articleId: "art-123",
  operatorId: "op-456",
  requestedAt: "2026-05-03T12:00:00.000Z",
  canonicalSnapshot: { ... },
  manualTrigger: true,
  memoryOnly: true,
  deployUnlockAllowed: false,
  backendPersistenceAllowed: false,
  sessionAuditInheritanceAllowed: false
}

Mapped to: {
  __kind: undefined,
  assessmentStage: undefined,
  preview: undefined,
  eligibility: undefined,
  explanation: undefined,
  safety: undefined,
  boundary: undefined,
  assessmentNotes: undefined
}

Validation Result: ❌ ALWAYS FAILS
- valid: false
- errors: [8+ validation errors for missing required fields]

Handler Result: BLOCKED
- status: BLOCKED
- blockReason: UNKNOWN
- message: "Validator failed: ..."
```

---

## AFTER: Correct Validator Usage

### Import

```typescript
// ✅ CORRECT: Validator for canonical re-audit request
import { validateCanonicalReAuditRequest } 
  from "lib/editorial/canonical-reaudit-request-validator";
```

### Validator Call

```typescript
// ✅ CORRECT: Calling correct validator with correct input
const validationResult = validateCanonicalReAuditRequest(request);

if (!validationResult.valid) {
  // ✅ ONLY FAILS if request is actually invalid
  const validationErrors = validationResult.errors
    .map(err => err.message)
    .join('; ');
  return createBlockedResult(
    request,
    CanonicalReAuditBlockReason.UNKNOWN,
    `Validator failed: ${validationErrors}`
  );
}

// ✅ PASSES if request is valid, continues to preflight
```

### Validation Checks

```typescript
// ✅ CORRECT: Validates actual CanonicalReAuditRequest structure

// Check 1: Root input is plain object
if (!isPlainRecord(input)) {
  return { valid: false, errors: [...] };
}

// Check 2: Required string fields
if (!hasOwnStringField(record, "articleId")) {
  errors.push({ code: "MISSING_REQUIRED_FIELD", fieldPath: ["articleId"], ... });
}
if (!hasOwnStringField(record, "operatorId")) {
  errors.push({ code: "MISSING_REQUIRED_FIELD", fieldPath: ["operatorId"], ... });
}
if (!hasOwnStringField(record, "requestedAt")) {
  errors.push({ code: "MISSING_REQUIRED_FIELD", fieldPath: ["requestedAt"], ... });
}

// Check 3: Canonical snapshot structure
if (!hasValidSnapshotStructure(record)) {
  errors.push({ code: "INVALID_SNAPSHOT_STRUCTURE", fieldPath: ["canonicalSnapshot"], ... });
}

// Check 4: Required boolean flags
if (!hasOwnLiteralField(record, "manualTrigger", true)) {
  errors.push({ code: "INVALID_FLAG_VALUE", fieldPath: ["manualTrigger"], ... });
}
if (!hasOwnLiteralField(record, "memoryOnly", true)) {
  errors.push({ code: "INVALID_FLAG_VALUE", fieldPath: ["memoryOnly"], ... });
}
if (!hasOwnLiteralField(record, "deployUnlockAllowed", false)) {
  errors.push({ code: "INVALID_FLAG_VALUE", fieldPath: ["deployUnlockAllowed"], ... });
}
// ... and so on for other flags

// Check 5: Optional fields
if ("promotionId" in record && record.promotionId !== undefined) {
  if (typeof record.promotionId !== "string") {
    errors.push({ code: "INVALID_TYPE", fieldPath: ["promotionId"], ... });
  }
}
```

### Result - Valid Request

```
Input: CanonicalReAuditRequest {
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
}

Validation Result: ✅ PASSES
- valid: true
- errors: []

Handler Flow: CONTINUES
- Passes validator
- Proceeds to Step 2: Request-level guards
- Proceeds to Step 3: Preflight
- Proceeds to Step 4: Adapter
- Returns audit result
```

### Result - Invalid Request

```
Input: CanonicalReAuditRequest {
  // Missing articleId
  operatorId: "op-456",
  requestedAt: "2026-05-03T12:00:00.000Z",
  canonicalSnapshot: { ... },
  manualTrigger: true,
  memoryOnly: true,
  deployUnlockAllowed: false,
  backendPersistenceAllowed: false,
  sessionAuditInheritanceAllowed: false
}

Validation Result: ❌ FAILS
- valid: false
- errors: [{
    code: "MISSING_REQUIRED_FIELD",
    fieldPath: ["articleId"],
    message: "articleId is required and must be a string",
    remediationHint: "Provide a non-empty string for articleId"
  }]

Handler Result: BLOCKED
- status: BLOCKED
- blockReason: UNKNOWN
- message: "Validator failed: articleId is required and must be a string"
```

---

## Comparison Table

| Aspect | Before | After |
|--------|--------|-------|
| **Validator** | `validateCanonicalReAuditRegistrationPreviewAssessment` | `validateCanonicalReAuditRequest` |
| **Domain** | Registration preview assessment | Canonical re-audit request |
| **Input Type** | Registration preview assessment shape | CanonicalReAuditRequest |
| **Expected Fields** | `__kind`, `assessmentStage`, `preview`, etc. | `articleId`, `operatorId`, `canonicalSnapshot`, flags |
| **Valid Request Result** | ❌ ALWAYS FAILS | ✅ PASSES |
| **Invalid Request Result** | ❌ ALWAYS FAILS | ✅ FAILS with specific error |
| **Handler Behavior** | Always BLOCKED | Proceeds if valid, BLOCKED if invalid |
| **Preflight Execution** | Never reached | Reached if validation passes |
| **Adapter Execution** | Never reached | Reached if validation and preflight pass |
| **Audit Result** | Never returned | Returned if all checks pass |

---

## Execution Flow Comparison

### BEFORE: Always Blocked

```
startCanonicalReAudit(request)
  │
  ├─ STEP 1: Validator
  │  ├─ validateCanonicalReAuditRegistrationPreviewAssessment()
  │  ├─ Input: { __kind: undefined, assessmentStage: undefined, ... }
  │  ├─ Result: ❌ FAILS (all fields undefined)
  │  └─ Return: BLOCKED
  │
  ├─ STEP 2: Request-level guards
  │  └─ ❌ NEVER REACHED
  │
  ├─ STEP 3: Preflight
  │  └─ ❌ NEVER REACHED
  │
  └─ STEP 4: Adapter
     └─ ❌ NEVER REACHED
```

### AFTER: Conditional Execution

```
startCanonicalReAudit(request)
  │
  ├─ STEP 1: Validator
  │  ├─ validateCanonicalReAuditRequest()
  │  ├─ Input: { articleId: "art-123", operatorId: "op-456", ... }
  │  ├─ Result: ✅ PASSES (all fields valid)
  │  └─ Continue
  │
  ├─ STEP 2: Request-level guards
  │  ├─ Check: manualTrigger === true ✅
  │  ├─ Check: memoryOnly === true ✅
  │  ├─ Check: deployUnlockAllowed === false ✅
  │  ├─ Check: backendPersistenceAllowed === false ✅
  │  ├─ Check: sessionAuditInheritanceAllowed === false ✅
  │  └─ Continue
  │
  ├─ STEP 3: Preflight
  │  ├─ Check: Vault not contaminated ✅
  │  ├─ Check: Snapshot not stale ✅
  │  └─ Continue
  │
  └─ STEP 4: Adapter
     ├─ runInMemoryCanonicalReAudit()
     ├─ runGlobalGovernanceAudit()
     └─ Return: Audit result
```

---

## Error Handling Comparison

### BEFORE: Generic Error

```
Validator failed: 
  __kind is required and must be a literal "registration-preview-assessment";
  assessmentStage is required and must be a literal "REGISTRATION_PREVIEW_ASSESSMENT";
  preview is required and must be an object;
  eligibility is required and must be an object;
  explanation is required and must be an object;
  safety is required and must be an object;
  boundary is required and must be an object;
  assessmentNotes is required and must be an object
```

**Problem**: Error messages don't match actual request structure

### AFTER: Specific Error

```
Validator failed: 
  articleId is required and must be a string
```

**Benefit**: Error message matches actual problem

---

## Safety Properties Comparison

### BEFORE

| Property | Status | Issue |
|----------|--------|-------|
| Pure function | ✅ | No side effects |
| Fail-closed | ❌ | Always fails, even for valid requests |
| Type-safe | ❌ | Validates wrong type |
| Domain-correct | ❌ | Validates wrong domain |
| Useful errors | ❌ | Errors don't match request structure |

### AFTER

| Property | Status | Benefit |
|----------|--------|---------|
| Pure function | ✅ | No side effects |
| Fail-closed | ✅ | Fails only for invalid requests |
| Type-safe | ✅ | Validates correct type |
| Domain-correct | ✅ | Validates correct domain |
| Useful errors | ✅ | Errors match actual problems |

---

## Files Changed

### BEFORE

```
app/admin/warroom/handlers/canonical-reaudit-handler.ts
  - Import: validateCanonicalReAuditRegistrationPreviewAssessment
  - Function: buildRegistrationPreviewAssessmentInput()
  - Call: validateCanonicalReAuditRegistrationPreviewAssessment(validatorInput)
```

### AFTER

```
app/admin/warroom/handlers/canonical-reaudit-handler.ts
  - Import: validateCanonicalReAuditRequest
  - Function: validateCanonicalReAuditRequestInput() [removed]
  - Call: validateCanonicalReAuditRequest(request)

lib/editorial/canonical-reaudit-request-validation-result.ts [NEW]
lib/editorial/canonical-reaudit-request-validation-factories.ts [NEW]
lib/editorial/canonical-reaudit-request-validation-guards.ts [NEW]
lib/editorial/canonical-reaudit-request-validator.ts [NEW]
```

---

## Impact Summary

### What Was Broken

❌ Handler always returned BLOCKED  
❌ Validator always failed  
❌ Preflight never executed  
❌ Adapter never executed  
❌ Audit result never returned  
❌ No canonical re-audit could complete  

### What Is Fixed

✅ Handler validates correct request structure  
✅ Validator passes for valid requests  
✅ Preflight executes for valid requests  
✅ Adapter executes for valid requests  
✅ Audit result returned for valid requests  
✅ Canonical re-audit can now complete  

### Backward Compatibility

✅ No breaking changes to handler interface  
✅ No breaking changes to adapter interface  
✅ No breaking changes to result types  
✅ Existing callers unaffected  

---

## Verification

### Compilation

✅ No diagnostics  
✅ All files compile successfully  
✅ No type errors  
✅ No import errors  

### Correctness

✅ Validator validates correct domain  
✅ Validator checks all required fields  
✅ Validator checks all flag values  
✅ Validator checks snapshot structure  
✅ Validator provides useful error messages  

---

## Summary

**Problem**: Wrong validator for wrong domain  
**Solution**: Created domain-correct validator  
**Result**: Handler now validates correctly  
**Status**: ✅ Complete and ready for testing

The validator now correctly validates `CanonicalReAuditRequest` objects and allows valid requests to proceed through the handler pipeline to the adapter and audit execution.

---

**Document Version**: 1.0.0  
**Date**: 2026-05-03  
**Status**: ✅ Complete
