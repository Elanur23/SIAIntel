# Test Architecture Mismatch Fix - Bugfix Design

## Overview

The verification scripts for the canonical re-audit handler violate the required test architecture by directly calling the internal preflight function `buildCanonicalReAuditAdapterPreflight()`. This bypasses the handler entry point `startCanonicalReAudit()` and tests internal implementation details rather than the public API contract.

The fix restructures the test architecture to enforce a single entry point (`startCanonicalReAudit()`) for all test cases, allowing the validator (preflight) to be executed within the handler's control flow. This ensures tests validate the complete integration flow (Input → Handler → Result) rather than testing internal functions in isolation.

The fix maintains all existing test coverage while improving test architecture quality, reducing coupling to implementation details, and ensuring tests validate the public API contract.

## Glossary

- **Bug_Condition (C)**: Tests that directly call `buildCanonicalReAuditAdapterPreflight()` instead of using the handler entry point
- **Property (P)**: All tests must call `startCanonicalReAudit()` as the entry point and verify results through handler responses
- **Preservation**: All existing test coverage (staleness detection, safety invariants, immutability, result mapping) must remain unchanged
- **Handler Entry Point**: `startCanonicalReAudit(request, vault?)` - the public API function that all tests must call
- **Internal Preflight Function**: `buildCanonicalReAuditAdapterPreflight()` - internal implementation detail that tests should NOT call directly
- **Test Flow**: Input → Handler → Result (the correct test architecture pattern)
- **BLOCKED Result**: Handler result with status BLOCKED and a specific blockReason indicating why execution was rejected
- **Verification Script**: TypeScript test file that validates handler behavior through assertions

## Bug Details

### Bug Condition

The bug manifests when verification scripts execute test cases that target preflight validation logic. The scripts directly call `buildCanonicalReAuditAdapterPreflight()` to test validator behavior, bypassing the handler entry point and testing internal implementation details.

**Formal Specification:**
```
FUNCTION isBugCondition(testCase)
  INPUT: testCase of type TestCase
  OUTPUT: boolean
  
  RETURN testCase.callsFunction == 'buildCanonicalReAuditAdapterPreflight'
         AND testCase.testTarget IN ['preflight validation', 'staleness detection', 'contamination detection']
         AND NOT testCase.callsFunction == 'startCanonicalReAudit'
END FUNCTION
```

### Examples

**Example 1: Direct Preflight Call (Bug)**
```typescript
// Current (WRONG): Direct call to internal function
const result = buildCanonicalReAuditAdapterPreflight(VALID_REQUEST, VALID_VAULT);
assert(result.ok === true, "Valid preflight returns ok: true");
```

**Example 2: Missing Vault Test (Bug)**
```typescript
// Current (WRONG): Direct call to test preflight failure
const r9 = buildCanonicalReAuditAdapterPreflight(VALID_REQUEST, null);
assert(r9.ok === false, "null vault returns ok: false");
```

**Example 3: Contamination Detection Test (Bug)**
```typescript
// Current (WRONG): Direct call to test contamination detection
const r15 = buildCanonicalReAuditAdapterPreflight(VALID_REQUEST, contaminatedVault);
assert(r15.ok === false, "Contaminated vault returns ok: false");
```

**Example 4: Staleness Detection Test (Bug)**
```typescript
// Current (WRONG): Direct call to test snapshot mismatch
const r16 = buildCanonicalReAuditAdapterPreflight(staleRequest, VALID_VAULT);
assert(r16.ok === false, "Snapshot mismatch returns ok: false");
```

**Expected Behavior (Correct):**
```typescript
// Fixed (CORRECT): Call handler entry point
const result = startCanonicalReAudit(VALID_REQUEST, VALID_VAULT);
assert(
  result.status === CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE ||
  result.status === CanonicalReAuditStatus.FAILED_PENDING_REVIEW,
  "Valid request + vault produces non-BLOCKED status"
);

// Fixed (CORRECT): Test BLOCKED result through handler
const resultNoVault = startCanonicalReAudit(VALID_REQUEST);
assert(
  resultNoVault.status === CanonicalReAuditStatus.BLOCKED,
  "Missing vault returns BLOCKED status"
);
assert(
  resultNoVault.blockReason === CanonicalReAuditBlockReason.AUDIT_RUNNER_UNAVAILABLE,
  "Missing vault returns AUDIT_RUNNER_UNAVAILABLE"
);
```

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Staleness detection tests must continue to verify snapshot mismatch detection
- Safety invariant tests must continue to verify all safety flags (deployRemainsLocked, globalAuditOverwriteAllowed, etc.)
- Immutability tests must continue to verify vault and request objects are unchanged
- Result mapping tests must continue to verify adapter result → handler result transformation
- Unsafe flag detection tests must continue to verify rejection of unsafe adapter flags
- All Task 5A adapter verification checks must continue to pass
- All Task 4 snapshot helper verification checks must continue to pass
- Success/failure summaries with check counts must continue to be printed
- Non-zero exit code on failure must continue to be enforced

**Scope:**
All test cases that currently call `buildCanonicalReAuditAdapterPreflight()` directly must be refactored to call `startCanonicalReAudit()` instead. This includes:
- Preflight validation tests (checks 7-16 in verify-canonical-reaudit-handler-preflight.ts)
- Staleness detection tests
- Contamination detection tests
- Missing vault/request tests
- Invalid request flag tests

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Test Architecture Misunderstanding**: The verification scripts were written to test internal functions directly rather than testing through the public API, violating encapsulation principles

2. **Incremental Development Pattern**: The preflight function was likely tested in isolation during Task 5B development, and those direct tests were never refactored when Task 5C integrated the adapter execution

3. **Missing Test Architecture Guidelines**: The test architecture requirements (single entry point, no direct internal function calls) may not have been clearly documented or enforced during initial development

4. **Convenience Over Correctness**: Direct preflight calls may have seemed more convenient for testing specific validation logic, but this convenience came at the cost of proper test architecture

## Correctness Properties

Property 1: Bug Condition - Single Entry Point Enforcement

_For any_ test case that validates handler behavior (preflight validation, staleness detection, contamination detection, result mapping, safety invariants), the test SHALL call `startCanonicalReAudit()` as the entry point and verify results through the handler's response, never calling `buildCanonicalReAuditAdapterPreflight()` directly.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7**

Property 2: Preservation - Test Coverage Completeness

_For any_ test case that exists in the current verification scripts, the refactored test SHALL preserve the same validation logic and assertions, only changing the entry point from `buildCanonicalReAuditAdapterPreflight()` to `startCanonicalReAudit()` and adjusting assertions to verify handler results instead of preflight results.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `scripts/verify-canonical-reaudit-handler-preflight.ts`

**Function**: All test cases (checks 7-16)

**Specific Changes**:

1. **Test 7: Valid Preflight → Valid Handler Execution**
   - **Before**: `const validResult = buildCanonicalReAuditAdapterPreflight(VALID_REQUEST, VALID_VAULT);`
   - **After**: `const validResult = startCanonicalReAudit(VALID_REQUEST, VALID_VAULT);`
   - **Assertion Change**: Verify `validResult.status !== BLOCKED` instead of `validResult.ok === true`

2. **Test 8: Missing Request → BLOCKED Result**
   - **Before**: `const r8 = buildCanonicalReAuditAdapterPreflight(null, VALID_VAULT);`
   - **After**: `const r8 = startCanonicalReAudit(null as any, VALID_VAULT);`
   - **Assertion Change**: Verify `r8.status === BLOCKED` and `r8.blockReason === UNKNOWN` instead of `r8.ok === false`

3. **Test 9: Missing Vault → BLOCKED Result**
   - **Before**: `const r9 = buildCanonicalReAuditAdapterPreflight(VALID_REQUEST, null);`
   - **After**: `const r9 = startCanonicalReAudit(VALID_REQUEST);` (vault omitted)
   - **Assertion Change**: Verify `r9.status === BLOCKED` and `r9.blockReason === AUDIT_RUNNER_UNAVAILABLE`

4. **Test 10: Missing Snapshot → BLOCKED Result**
   - **Before**: `const r10 = buildCanonicalReAuditAdapterPreflight(requestNoSnapshot, VALID_VAULT);`
   - **After**: `const r10 = startCanonicalReAudit(requestNoSnapshot, VALID_VAULT);`
   - **Assertion Change**: Verify `r10.status === BLOCKED` and `r10.blockReason === SNAPSHOT_MISSING`

5. **Test 11: Wrong Source → BLOCKED Result**
   - **Before**: `const r11 = buildCanonicalReAuditAdapterPreflight(requestWrongSource, VALID_VAULT);`
   - **After**: `const r11 = startCanonicalReAudit(requestWrongSource, VALID_VAULT);`
   - **Assertion Change**: Verify `r11.status === BLOCKED` and `r11.blockReason === SNAPSHOT_MISMATCH`

6. **Test 12: deployUnlockAllowed: true → BLOCKED Result**
   - **Before**: `const r12 = buildCanonicalReAuditAdapterPreflight(requestDeployUnlock, VALID_VAULT);`
   - **After**: `const r12 = startCanonicalReAudit(requestDeployUnlock, VALID_VAULT);`
   - **Assertion Change**: Verify `r12.status === BLOCKED` and `r12.blockReason === DEPLOY_UNLOCK_FORBIDDEN`

7. **Test 13: backendPersistenceAllowed: true → BLOCKED Result**
   - **Before**: `const r13 = buildCanonicalReAuditAdapterPreflight(requestBackend, VALID_VAULT);`
   - **After**: `const r13 = startCanonicalReAudit(requestBackend, VALID_VAULT);`
   - **Assertion Change**: Verify `r13.status === BLOCKED` and `r13.blockReason === BACKEND_FORBIDDEN`

8. **Test 14: sessionAuditInheritanceAllowed: true → BLOCKED Result**
   - **Before**: `const r14 = buildCanonicalReAuditAdapterPreflight(requestSessionInherit, VALID_VAULT);`
   - **After**: `const r14 = startCanonicalReAudit(requestSessionInherit, VALID_VAULT);`
   - **Assertion Change**: Verify `r14.status === BLOCKED` and `r14.blockReason === SESSION_AUDIT_INHERITANCE_FORBIDDEN`

9. **Test 15: Contamination Detection → BLOCKED Result**
   - **Before**: `const r15 = buildCanonicalReAuditAdapterPreflight(VALID_REQUEST, contaminatedVault);`
   - **After**: `const r15 = startCanonicalReAudit(VALID_REQUEST, contaminatedVault);`
   - **Assertion Change**: Verify `r15.status === BLOCKED` (validator rejects contaminated vault)

10. **Test 16: Snapshot Mismatch (Stale) → BLOCKED Result**
    - **Before**: `const r16 = buildCanonicalReAuditAdapterPreflight(staleRequest, VALID_VAULT);`
    - **After**: `const r16 = startCanonicalReAudit(staleRequest, VALID_VAULT);`
    - **Assertion Change**: Verify `r16.status === BLOCKED` and `r16.blockReason === SNAPSHOT_MISMATCH`

11. **Test 17: Immutability → No Change Required**
    - Already uses `buildCanonicalReAuditAdapterPreflight()` but only to verify no mutation
    - **Change**: Replace with `startCanonicalReAudit()` for consistency

**File**: `scripts/verify-canonical-reaudit-handler-execution.ts`

**Function**: All test cases that may call preflight directly

**Specific Changes**:
- **Review all test cases**: Ensure no direct calls to `buildCanonicalReAuditAdapterPreflight()`
- **Verify Test 2**: Already uses `startCanonicalReAudit()` for preflight failure tests - no change needed
- **Verify Test 3**: Uses source code inspection for try-catch verification - no change needed

### Assertion Pattern Changes

**Old Pattern (Direct Preflight Call):**
```typescript
const result = buildCanonicalReAuditAdapterPreflight(request, vault);
assert(result.ok === false, "Preflight fails");
if (!result.ok) {
  assert(result.blockReason === expectedReason, "Correct block reason");
}
```

**New Pattern (Handler Entry Point):**
```typescript
const result = startCanonicalReAudit(request, vault);
assert(result.status === CanonicalReAuditStatus.BLOCKED, "Handler returns BLOCKED");
assert(result.blockReason === expectedReason, "Correct block reason");
```

**Key Differences:**
1. Call `startCanonicalReAudit()` instead of `buildCanonicalReAuditAdapterPreflight()`
2. Check `result.status === BLOCKED` instead of `result.ok === false`
3. Access `result.blockReason` directly (no conditional check needed)
4. Verify handler result type (`CanonicalReAuditResult`) instead of preflight result type

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug in the current test architecture, then verify the fix works correctly and preserves all existing test coverage.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm that tests currently call `buildCanonicalReAuditAdapterPreflight()` directly.

**Test Plan**: Search the verification scripts for direct calls to `buildCanonicalReAuditAdapterPreflight()` and document each occurrence. Run the existing tests to confirm they pass (demonstrating the bug exists but tests still work).

**Test Cases**:
1. **Preflight Validation Tests**: Search for `buildCanonicalReAuditAdapterPreflight(` in verify-canonical-reaudit-handler-preflight.ts (will find multiple occurrences)
2. **Execution Tests**: Search for `buildCanonicalReAuditAdapterPreflight(` in verify-canonical-reaudit-handler-execution.ts (may find occurrences)
3. **Test Execution**: Run both verification scripts to confirm they pass with current architecture (will pass, demonstrating bug exists)

**Expected Counterexamples**:
- Tests 7-17 in verify-canonical-reaudit-handler-preflight.ts call `buildCanonicalReAuditAdapterPreflight()` directly
- Possible causes: incremental development pattern, missing test architecture guidelines, convenience over correctness

### Fix Checking

**Goal**: Verify that for all test cases where the bug condition holds (direct preflight calls), the fixed tests call `startCanonicalReAudit()` and verify results through handler responses.

**Pseudocode:**
```
FOR ALL testCase WHERE isBugCondition(testCase) DO
  fixedTestCase := refactorToUseHandlerEntryPoint(testCase)
  ASSERT fixedTestCase.callsFunction == 'startCanonicalReAudit'
  ASSERT fixedTestCase.verifiesHandlerResult == true
END FOR
```

### Preservation Checking

**Goal**: Verify that for all test cases, the refactored tests preserve the same validation logic and assertions, only changing the entry point and assertion patterns.

**Pseudocode:**
```
FOR ALL testCase IN originalTests DO
  fixedTestCase := findCorrespondingFixedTest(testCase)
  ASSERT fixedTestCase.validationLogic == testCase.validationLogic
  ASSERT fixedTestCase.testCoverage == testCase.testCoverage
  ASSERT fixedTestCase.assertions.length >= testCase.assertions.length
END FOR
```

**Testing Approach**: Property-based testing is NOT recommended for this fix because:
- The fix is deterministic (refactor test architecture)
- The test cases are finite and enumerable (checks 7-17)
- Manual verification is more appropriate for test refactoring

**Test Plan**: Run both verification scripts after refactoring and verify all checks pass with the same pass/fail counts.

**Test Cases**:
1. **Staleness Detection Preservation**: Verify Test 16 still detects snapshot mismatch through handler
2. **Safety Invariant Preservation**: Verify all safety invariant checks still pass
3. **Immutability Preservation**: Verify vault and request immutability checks still pass
4. **Result Mapping Preservation**: Verify result mapping checks still pass
5. **Unsafe Flag Detection Preservation**: Verify unsafe flag rejection checks still pass
6. **Task 5A Regression**: Verify Task 5A adapter verification still passes
7. **Task 4 Regression**: Verify Task 4 snapshot helper verification still passes

### Unit Tests

- Refactor Tests 7-17 in verify-canonical-reaudit-handler-preflight.ts to use `startCanonicalReAudit()`
- Verify all test cases in verify-canonical-reaudit-handler-execution.ts use `startCanonicalReAudit()`
- Verify no direct calls to `buildCanonicalReAuditAdapterPreflight()` remain in test files

### Property-Based Tests

- NOT APPLICABLE: This fix is a deterministic test architecture refactoring, not a behavior change that requires property-based testing

### Integration Tests

- Run verify-canonical-reaudit-handler-preflight.ts and verify all checks pass
- Run verify-canonical-reaudit-handler-execution.ts and verify all checks pass
- Run Task 5A adapter verification and verify it still passes
- Run Task 4 snapshot helper verification and verify it still passes
- Verify pass/fail counts match original test suite
