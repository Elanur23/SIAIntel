# Bugfix Requirements Document

## Introduction

The verification scripts for the canonical re-audit handler (`verify-canonical-reaudit-handler-execution.ts` and `verify-canonical-reaudit-handler-preflight.ts`) violate the required test architecture by directly calling the internal preflight function `buildCanonicalReAuditAdapterPreflight()`. This bypasses the handler entry point `startCanonicalReAudit()` and tests internal implementation details rather than the public API contract.

The required test architecture mandates that all tests must call `startCanonicalReAudit()` as the entry point, allowing the validator (preflight) to be executed within the handler's control flow. Direct calls to `buildCanonicalReAuditAdapterPreflight()` violate encapsulation and create brittle tests that are coupled to internal implementation details.

This bug affects the integrity of the test suite and creates a maintenance burden, as changes to internal implementation details can break tests even when the public API contract remains unchanged.

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN the verification script `verify-canonical-reaudit-handler-preflight.ts` executes THEN the system directly calls `buildCanonicalReAuditAdapterPreflight()` to test preflight validation logic (checks 1-15)

1.2 WHEN the verification script `verify-canonical-reaudit-handler-execution.ts` executes THEN the system may directly call `buildCanonicalReAuditAdapterPreflight()` for preflight-specific test cases

1.3 WHEN tests target preflight validation logic THEN the system bypasses the handler entry point `startCanonicalReAudit()` and tests internal implementation details

1.4 WHEN tests call `buildCanonicalReAuditAdapterPreflight()` directly THEN the system does not validate the full handler execution flow (validator → handler → result)

1.5 WHEN preflight validation tests execute THEN the system tests the validator in isolation without verifying integration with the handler

### Expected Behavior (Correct)

2.1 WHEN verification scripts execute THEN the system SHALL call `startCanonicalReAudit()` as the entry point for all test cases

2.2 WHEN tests target preflight validation logic THEN the system SHALL execute the validator through `startCanonicalReAudit()` and verify BLOCKED results

2.3 WHEN tests validate FAIL → BLOCKED behavior THEN the system SHALL call `startCanonicalReAudit()` with invalid inputs and assert BLOCKED status with appropriate blockReason

2.4 WHEN tests validate PASS → continuation behavior THEN the system SHALL call `startCanonicalReAudit()` with valid inputs and assert non-BLOCKED status (PASSED_PENDING_ACCEPTANCE or FAILED_PENDING_REVIEW)

2.5 WHEN staleness tests execute THEN the system SHALL call `startCanonicalReAudit()` with stale snapshots and verify BLOCKED/STALE results through the handler

2.6 WHEN validator-focused test cases execute THEN the system SHALL verify BLOCKED results by calling `startCanonicalReAudit()` with inputs that trigger preflight failures

2.7 WHEN integration flow tests execute THEN the system SHALL verify the complete flow (builder → validator → handler) through `startCanonicalReAudit()`

### Unchanged Behavior (Regression Prevention)

3.1 WHEN staleness tests execute THEN the system SHALL CONTINUE TO verify snapshot mismatch detection (preflight responsibility)

3.2 WHEN execution script tests execute THEN the system SHALL CONTINUE TO verify all tests that already use `startCanonicalReAudit()` as the entry point

3.3 WHEN verification scripts execute THEN the system SHALL CONTINUE TO verify all safety invariants (deployRemainsLocked, globalAuditOverwriteAllowed, etc.)

3.4 WHEN verification scripts execute THEN the system SHALL CONTINUE TO verify immutability (vault and request objects unchanged)

3.5 WHEN verification scripts execute THEN the system SHALL CONTINUE TO verify result mapping correctness (adapter result → handler result)

3.6 WHEN verification scripts execute THEN the system SHALL CONTINUE TO verify unsafe flag detection and rejection

3.7 WHEN verification scripts execute THEN the system SHALL CONTINUE TO verify all Task 5A adapter verification checks

3.8 WHEN verification scripts execute THEN the system SHALL CONTINUE TO verify all Task 4 snapshot helper verification checks

3.9 WHEN verification scripts execute THEN the system SHALL CONTINUE TO print success/failure summaries with check counts

3.10 WHEN verification scripts execute THEN the system SHALL CONTINUE TO exit with non-zero code on failure
