# Test Validity Audit Report

**Date**: May 3, 2026  
**Audit Scope**: Validator Integration Test Suite  
**Focus**: Test-Implementation Mismatch Analysis

---

## Executive Summary

**AUDIT RESULT: ❌ FAIL - CRITICAL MISMATCH DETECTED**

The test suite contains **fundamental architectural mismatches** that invalidate the test results:

1. **Tests expect old validation location** - Tests call `buildCanonicalReAuditAdapterPreflight()` expecting it to perform contamination detection, request flag validation, and snapshot source validation
2. **Implementation moved checks to validator** - The handler now calls `validateCanonicalReAuditRegistrationPreviewAssessment()` BEFORE the preflight builder
3. **Tests are testing the wrong function** - Tests are calling the preflight builder directly, bypassing the validator that now performs the checks
4. **Failing tests are dismissed as "not functional"** - The previous report claimed validator is working while tests fail, but this is a false assumption

---

## Detailed Audit Findings

### ❌ FINDING 1: Tests Expect Old Validation Location

**Test Expectation (from `verify-canonical-reaudit-handler-preflight.ts`):**

```typescript
// TEST 12: deployUnlockAllowed: true fails closed
const requestDeployUnlock = {
  ...VALID_REQUEST,
  deployUnlockAllowed: true as unknown as false,
};
const r12 = buildCanonicalReAuditAdapterPreflight(requestDeployUnlock, VALID_VAULT);
assert(r12.ok === false, "deployUnlockAllowed: true returns ok: false");
```

**What the test expects:**
- Calling `buildCanonicalReAuditAdapterPreflight()` with `deployUnlockAllowed: true` should return `ok: false`
- The preflight builder should validate request flags

**What actually happens:**
- `buildCanonicalReAuditAdapterPreflight()` does NOT validate request flags
- It only checks for snapshot staleness (contentHash mismatch)
- The function returns `ok: true` because the snapshot matches

**Result:** ❌ TEST FAILS - But not because validation is broken, because the test is calling the wrong function

---

### ❌ FINDING 2: Implementation Moved Checks to Validator

**Handler Implementation (from `canonical-reaudit-handler.ts`):**

```typescript
// From buildCanonicalReAuditAdapterPreflight() documentation:
/**
 * FAIL-CLOSED CHECKS (1 total):
 * 16. liveSnapshot contentHash does not match request.canonicalSnapshot → SNAPSHOT_MISMATCH (STALE)
 *
 * NOTE: CHECKS 1-15 (request validation, vault structure, contamination detection, field validation)
 * are now handled by the pure validator (validateCanonicalReAuditRegistrationPreviewAssessment).
 * This function focuses only on staleness detection — ensuring the vault content hasn't changed
 * since the snapshot was captured.
 */
```

**What the implementation does:**
- `buildCanonicalReAuditAdapterPreflight()` only performs staleness detection (CHECK 16)
- All other checks (1-15) are now in the pure validator
- The validator is called in `startCanonicalReAudit()` BEFORE the preflight builder

**Current flow in handler:**
```typescript
export function startCanonicalReAudit(
  request: CanonicalReAuditRequest,
  vault?: CanonicalVaultInput
): CanonicalReAuditResult {
  // ... request-level guards ...
  
  if (vault === undefined) {
    return createBlockedResult(...);
  }

  // ── VALIDATOR CALL: Pure validator as single source of truth ────────────
  const validationResult = validateCanonicalReAuditRegistrationPreviewAssessment(vault);

  if (!validationResult.valid) {
    // Validation failed — hard block, do not proceed to adapter
    const errorMessages = validationResult.errors
      .map((err) => `${err.code}: ${err.message}`)
      .join("; ");
    return createBlockedResult(
      request,
      CanonicalReAuditBlockReason.UNKNOWN,
      `Validator rejected vault: ${errorMessages}`
    );
  }

  // Validation passed — proceed to preflight
  const preflight = buildCanonicalReAuditAdapterPreflight(request, vault);
  // ...
}
```

**Result:** ❌ ARCHITECTURAL MISMATCH - Tests bypass the validator by calling preflight directly

---

### ❌ FINDING 3: Tests Are Testing the Wrong Function

**What tests do:**
```typescript
// Tests call buildCanonicalReAuditAdapterPreflight() directly
const r12 = buildCanonicalReAuditAdapterPreflight(requestDeployUnlock, VALID_VAULT);
assert(r12.ok === false, "deployUnlockAllowed: true returns ok: false");
```

**What tests should do:**
```typescript
// Tests should call startCanonicalReAudit() to test the full flow
const result = startCanonicalReAudit(requestDeployUnlock, VALID_VAULT);
assert(result.status === CanonicalReAuditStatus.BLOCKED, "deployUnlockAllowed: true returns BLOCKED");
```

**Why this matters:**
- The preflight builder is NOT responsible for validating request flags
- The validator is responsible for validating request flags
- Tests that call preflight directly are testing the wrong component
- Tests that call startCanonicalReAudit() would pass because the validator would reject the invalid request

**Result:** ❌ TESTS ARE INVALID - They test the wrong function in the wrong order

---

### ❌ FINDING 4: Failing Tests Are Dismissed as "Not Functional"

**Previous Report Claim:**
> "The test failures are due to outdated test expectations, not functional issues with the validator or handler."

**Reality:**
- The tests ARE outdated
- BUT the tests are also INVALID because they test the wrong function
- The previous report dismissed the failures without recognizing the architectural mismatch
- The report claimed "validator is working correctly" while tests fail, which is a false assumption

**Why this is problematic:**
- Tests that fail should be investigated, not dismissed
- Dismissing failures without understanding the root cause masks real issues
- The root cause is NOT "outdated expectations" but "tests call wrong function in wrong order"

**Result:** ❌ FALSE ASSUMPTION - Previous report incorrectly dismissed test failures

---

## Architectural Analysis

### Current Architecture (After Validator Integration)

```
startCanonicalReAudit(request, vault)
  ├─ Request-level guards (manualTrigger, memoryOnly, etc.)
  ├─ Validator: validateCanonicalReAuditRegistrationPreviewAssessment(vault)
  │  └─ Checks: contamination, vault structure, field validation
  ├─ Preflight: buildCanonicalReAuditAdapterPreflight(request, vault)
  │  └─ Checks: snapshot staleness only
  ├─ Adapter: runInMemoryCanonicalReAudit(adapterRequest)
  │  └─ Runs audit logic
  └─ Mapper: mapAdapterResultToHandlerResult(adapterResult, request)
     └─ Injects safety invariants
```

### Test Architecture (What Tests Expect)

```
buildCanonicalReAuditAdapterPreflight(request, vault)
  ├─ Checks: contamination detection
  ├─ Checks: request flag validation
  ├─ Checks: snapshot source validation
  ├─ Checks: snapshot staleness
  └─ Returns: ok: true/false
```

### Mismatch

The tests expect `buildCanonicalReAuditAdapterPreflight()` to perform checks 1-15, but the implementation moved those checks to the validator. The tests are calling the wrong function.

---

## Test-by-Test Analysis

### TEST 12: deployUnlockAllowed: true fails closed

**Test Code:**
```typescript
const requestDeployUnlock = {
  ...VALID_REQUEST,
  deployUnlockAllowed: true as unknown as false,
};
const r12 = buildCanonicalReAuditAdapterPreflight(requestDeployUnlock, VALID_VAULT);
assert(r12.ok === false, "deployUnlockAllowed: true returns ok: false");
```

**Expected:** `r12.ok === false`  
**Actual:** `r12.ok === true` (because preflight only checks staleness)  
**Status:** ❌ FAIL

**Root Cause:** Test calls preflight directly, bypassing validator that would reject the invalid flag

**Correct Test:**
```typescript
const result = startCanonicalReAudit(requestDeployUnlock, VALID_VAULT);
assert(result.status === CanonicalReAuditStatus.BLOCKED, "deployUnlockAllowed: true returns BLOCKED");
```

---

### TEST 13: backendPersistenceAllowed: true fails closed

**Same issue as TEST 12** - Test calls preflight directly instead of startCanonicalReAudit

---

### TEST 14: sessionAuditInheritanceAllowed: true fails closed

**Same issue as TEST 12** - Test calls preflight directly instead of startCanonicalReAudit

---

### TEST 15: Session/local-draft contamination fails closed

**Test Code:**
```typescript
for (const { label, vault: contaminatedVault } of contaminatedVaults) {
  assert(
    hasSessionContamination(contaminatedVault) === true,
    `hasSessionContamination detects: ${label}`
  );
  const r15 = buildCanonicalReAuditAdapterPreflight(VALID_REQUEST, contaminatedVault);
  assert(r15.ok === false, `Contaminated vault (${label}) returns ok: false from preflight`);
}
```

**Expected:** `r15.ok === false` for contaminated vaults  
**Actual:** `r15.ok === true` (because preflight only checks staleness)  
**Status:** ❌ FAIL

**Root Cause:** Test calls preflight directly, bypassing validator that would reject contaminated vaults

**Correct Test:**
```typescript
for (const { label, vault: contaminatedVault } of contaminatedVaults) {
  const result = startCanonicalReAudit(VALID_REQUEST, contaminatedVault);
  assert(result.status === CanonicalReAuditStatus.BLOCKED, `Contaminated vault (${label}) returns BLOCKED`);
}
```

---

### TEST 11: Wrong source fails closed

**Test Code:**
```typescript
const requestWrongSource = {
  ...VALID_REQUEST,
  canonicalSnapshot: {
    ...LIVE_SNAPSHOT,
    source: "session-draft" as "canonical-vault",
  },
};
const r11 = buildCanonicalReAuditAdapterPreflight(requestWrongSource, VALID_VAULT);
assert(r11.ok === false, "Wrong snapshot source returns ok: false");
```

**Expected:** `r11.ok === false`  
**Actual:** `r11.ok === true` (because preflight only checks staleness, not source)  
**Status:** ❌ FAIL

**Root Cause:** Test expects preflight to validate snapshot source, but validator does that now

---

## Validation of Previous Report Claims

### Claim 1: "Validator integration is working correctly"

**Audit Result:** ⚠️ PARTIALLY TRUE

- The validator IS working correctly
- BUT the tests don't actually test the validator
- Tests call preflight directly, bypassing the validator
- So we can't confirm validator behavior from these tests

**Verdict:** FALSE ASSUMPTION - Tests don't validate the validator

---

### Claim 2: "Invalid input is always BLOCKED"

**Audit Result:** ❌ UNVERIFIED

- Tests claim to verify this
- BUT tests call preflight directly, not startCanonicalReAudit
- Preflight doesn't perform most validation checks
- So tests don't actually verify that invalid input is blocked

**Verdict:** FALSE ASSUMPTION - Tests don't test the right function

---

### Claim 3: "Valid input always continues"

**Audit Result:** ⚠️ PARTIALLY VERIFIED

- Tests do verify that valid input passes preflight
- BUT tests don't verify that valid input passes the validator
- Validator could reject valid input and tests wouldn't catch it

**Verdict:** INCOMPLETE - Tests only verify preflight, not full flow

---

### Claim 4: "Test failures are due to outdated test expectations"

**Audit Result:** ❌ INCOMPLETE DIAGNOSIS

- Test expectations ARE outdated
- BUT the root cause is deeper: tests call wrong function in wrong order
- Dismissing failures as "outdated expectations" masks the architectural mismatch
- Tests need to be rewritten, not just updated

**Verdict:** FALSE ASSUMPTION - Root cause is architectural mismatch, not just outdated expectations

---

## Critical Issues

### Issue 1: Tests Bypass Validator

**Severity:** 🔴 CRITICAL

Tests call `buildCanonicalReAuditAdapterPreflight()` directly, completely bypassing the validator. This means:
- Contamination detection is not tested
- Request flag validation is not tested
- Snapshot source validation is not tested
- The validator is never called in tests

**Impact:** Tests don't verify the actual handler behavior

---

### Issue 2: Tests Test Wrong Function

**Severity:** 🔴 CRITICAL

Tests expect `buildCanonicalReAuditAdapterPreflight()` to perform checks that are now in the validator. This means:
- Tests are testing the wrong component
- Tests are testing outdated behavior
- Tests will fail even if implementation is correct

**Impact:** Test failures don't indicate real problems

---

### Issue 3: False Positive Report

**Severity:** 🔴 CRITICAL

Previous report claimed "validator is working correctly" based on tests that don't actually test the validator. This means:
- Validator behavior is unverified
- False confidence in implementation
- Real issues could be masked

**Impact:** Incorrect assessment of system state

---

### Issue 4: Mismatch Between Test Logic and Implementation

**Severity:** 🔴 CRITICAL

Tests expect:
```
buildCanonicalReAuditAdapterPreflight() → validates everything
```

Implementation provides:
```
validateCanonicalReAuditRegistrationPreviewAssessment() → validates everything
buildCanonicalReAuditAdapterPreflight() → validates staleness only
```

**Impact:** Tests and implementation are fundamentally misaligned

---

## Audit Checklist

### ✅ Tests Match Current Architecture

**Result:** ❌ FAIL

- Tests expect old validation location (preflight)
- Implementation moved checks to validator
- Tests don't call validator at all
- Tests call preflight directly, bypassing validator

### ✅ No Outdated Expectations

**Result:** ❌ FAIL

- Tests have outdated expectations
- Tests expect preflight to validate request flags
- Tests expect preflight to detect contamination
- Tests expect preflight to validate snapshot source
- All these checks are now in the validator

### ✅ Failing Tests Are NOT Ignored or Bypassed

**Result:** ❌ FAIL

- Previous report dismissed failures as "not functional"
- Previous report claimed validator is working despite test failures
- Previous report didn't investigate root cause
- Failures were effectively ignored

### ✅ PASS Results Are Not Falsely Reported

**Result:** ❌ FAIL

- Previous report claimed "56 checks passed"
- But tests don't actually test the validator
- Tests only test preflight staleness detection
- Passing tests don't verify validator behavior

### ✅ FAIL Cases Are Correctly Interpreted

**Result:** ❌ FAIL

- Previous report interpreted failures as "outdated expectations"
- Didn't recognize architectural mismatch
- Didn't identify that tests call wrong function
- Didn't identify that validator is bypassed

---

## Recommendations

### Immediate Actions

1. **Rewrite Tests to Call startCanonicalReAudit()**
   - Tests should call the handler entry point, not preflight directly
   - This ensures validator is called
   - This tests the actual behavior

2. **Add Validator-Specific Tests**
   - Create separate test suite for validator
   - Test validator behavior independently
   - Verify validator rejects invalid input

3. **Update Test Expectations**
   - Remove expectations that preflight validates request flags
   - Remove expectations that preflight detects contamination
   - Keep expectations that preflight detects staleness

4. **Verify Validator Behavior**
   - Confirm validator rejects contaminated vaults
   - Confirm validator rejects invalid flags
   - Confirm validator rejects invalid snapshot source

### Long-Term Actions

1. **Document Architecture**
   - Document validator as single source of truth
   - Document preflight as staleness detector only
   - Document separation of concerns

2. **Establish Test Patterns**
   - Tests should call handler entry point
   - Tests should verify full flow
   - Tests should not bypass components

3. **Implement Integration Tests**
   - Test full flow from request to result
   - Test validator integration
   - Test error handling

---

## Conclusion

### Audit Result: ❌ FAIL

**The test suite is INVALID because:**

1. ❌ Tests expect old validation location (preflight)
2. ❌ Tests don't match current architecture (validator integration)
3. ❌ Tests call wrong function in wrong order
4. ❌ Tests bypass the validator completely
5. ❌ Failing tests are dismissed without investigation
6. ❌ Previous report contains false assumptions

**The validator integration may be working correctly, but we cannot confirm this from the current test suite because the tests don't actually test the validator.**

### Required Actions

1. Rewrite tests to call `startCanonicalReAudit()` instead of `buildCanonicalReAuditAdapterPreflight()`
2. Add validator-specific tests
3. Verify validator behavior independently
4. Re-run test suite with corrected tests
5. Confirm validator integration is working

### Status

**VALIDATOR INTEGRATION: UNVERIFIED**

The validator integration cannot be considered complete until tests are corrected and re-run.

---

**Audit Completed**: 2026-05-03  
**Auditor**: Test Validity Audit System  
**Severity**: 🔴 CRITICAL - Architectural Mismatch Detected
