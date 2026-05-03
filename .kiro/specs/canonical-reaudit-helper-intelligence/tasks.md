# Implementation Plan: Canonical Re-Audit Handler Layer (Task 5C)

## Overview

This implementation plan covers Task 5C: Handler Layer Implementation for the canonical re-audit subsystem. The handler layer integrates the pure in-memory adapter (Task 5A) with the warroom UI by adding adapter execution, result mapping, and safety guards to the existing handler.

The implementation follows a fail-closed, memory-only architecture with comprehensive safety invariant enforcement. All operations are memory-only. Deploy remains locked after canonical re-audit. No globalAudit overwrite, no session audit inheritance, and no automatic triggering are permitted.

**Key Deliverables:**
- Result mapper function (`mapAdapterResultToHandlerResult`)
- Adapter integration in `startCanonicalReAudit`
- Unsafe flag detection and rejection
- Try-catch wrapper for fail-closed error handling
- Execution verification script
- Updated preflight verification script

## Tasks

- [x] 1. Implement Result Mapper Function
  - Create `mapAdapterResultToHandlerResult` function in `app/admin/warroom/handlers/canonical-reaudit-handler.ts`
  - Transform `CanonicalReAuditAdapterResult` to `CanonicalReAuditResult`
  - Inject all safety invariants (deployRemainsLocked, globalAuditOverwriteAllowed, etc.)
  - Map adapter status to handler status enum
  - Compute derived fields (success, passed, readyForAcceptance)
  - Rename fields (snapshotIdentity → auditedSnapshot, auditSummary → summary)
  - Extract promotionId from request or snapshot
  - Wrap blockMessage in errors array if present
  - _Requirements: 1.6, 1.8, 4.1, 4.2, 4.3, 4.4_

- [x] 2. Add Unsafe Flag Detection
  - [x] 2.1 Implement deployUnlockAllowed guard
    - Check if `adapterResult.deployUnlockAllowed !== false`
    - Return BLOCKED result with `DEPLOY_UNLOCK_FORBIDDEN` reason
    - Include descriptive error message
    - _Requirements: 1.7, 4.7_

  - [x] 2.2 Implement sessionAuditInheritanceAllowed guard
    - Check if `adapterResult.sessionAuditInheritanceAllowed !== false`
    - Return BLOCKED result with `SESSION_AUDIT_INHERITANCE_FORBIDDEN` reason
    - Include descriptive error message
    - _Requirements: 1.7, 4.8_

- [x] 3. Integrate Adapter Execution into Handler
  - [x] 3.1 Add adapter execution after successful preflight
    - Locate the successful preflight path in `startCanonicalReAudit`
    - Replace `AUDIT_RUNNER_UNAVAILABLE` sentinel with adapter call
    - Call `runInMemoryCanonicalReAudit(preflight.adapterRequest)`
    - Preserve all existing preflight and validation logic
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 3.2 Add try-catch wrapper for fail-closed error handling
    - Wrap adapter execution in try-catch block
    - Catch any exceptions thrown by adapter
    - Return BLOCKED result with `AUDIT_RUNNER_FAILED` reason
    - Include error message from exception
    - _Requirements: 1.9, 4.5_

  - [x] 3.3 Wire result mapping and safety guards
    - Call `mapAdapterResultToHandlerResult(adapterResult, request)`
    - Apply unsafe flag detection before returning result
    - Ensure all error paths return BLOCKED status
    - _Requirements: 1.5, 1.6, 1.8_

- [x] 4. Checkpoint - Verify Handler Integration
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Create Execution Verification Script
  - [ ] 5.1 Create script file structure
    - Create `scripts/verify-canonical-reaudit-handler-execution.ts`
    - Import handler, adapter, and type definitions
    - Set up test fixtures (valid vault, snapshot, request)
    - _Requirements: 2.1, 2.2_

  - [ ] 5.2 Implement adapter execution verification
    - Test: Handler calls adapter after successful preflight
    - Test: Handler does NOT call adapter when preflight fails
    - Test: Handler wraps adapter exceptions in BLOCKED result
    - Assert adapter execution behavior
    - _Requirements: 2.3, 2.4_

  - [ ] 5.3 Implement result mapping verification
    - Test: Each adapter status maps to correct handler status
    - Test: Safety invariants injected for all statuses
    - Test: Derived fields computed correctly (success, passed, readyForAcceptance)
    - Test: Field renaming works (snapshotIdentity → auditedSnapshot, etc.)
    - Assert result transformation correctness
    - _Requirements: 2.5, 2.6, 2.7_

  - [ ] 5.4 Implement safety guard verification
    - Test: deployUnlockAllowed: true → BLOCKED with DEPLOY_UNLOCK_FORBIDDEN
    - Test: sessionAuditInheritanceAllowed: true → BLOCKED with SESSION_AUDIT_INHERITANCE_FORBIDDEN
    - Assert unsafe flags are rejected
    - _Requirements: 2.8, 2.9_

  - [ ] 5.5 Implement immutability verification
    - Test: Vault object unchanged after handler execution
    - Test: Request object unchanged after handler execution
    - Assert no mutations to input objects
    - _Requirements: 4.6_

  - [ ] 5.6 Add verification summary output
    - Print success message with check count
    - Exit with non-zero code on failure
    - Include descriptive failure messages
    - _Requirements: 2.10_

- [ ] 6. Update Preflight Verification Script
  - [ ] 6.1 Add adapter execution checks
    - Test: Adapter NOT called when preflight fails
    - Test: Adapter IS called when preflight succeeds
    - Update test expectations for Task 5C behavior
    - _Requirements: 3.1, 3.2_

  - [ ] 6.2 Preserve existing preflight checks
    - Ensure all Task 5B checks still pass
    - Verify snapshot computation unchanged
    - Verify contamination detection unchanged
    - _Requirements: 3.3, 3.4_

- [ ] 7. Run All Verification Scripts
  - [ ] 7.1 Run execution verification script
    - Execute `scripts/verify-canonical-reaudit-handler-execution.ts`
    - Verify all checks pass
    - Fix any failures before proceeding
    - _Requirements: 2.1-2.10_

  - [ ] 7.2 Run preflight verification script
    - Execute `scripts/verify-canonical-reaudit-handler-preflight.ts`
    - Verify all checks pass (Task 5B regression)
    - Fix any failures before proceeding
    - _Requirements: 3.1-3.4_

  - [ ] 7.3 Run adapter verification script
    - Execute `scripts/verify-canonical-reaudit-adapter.ts`
    - Verify all checks pass (Task 5A regression)
    - Ensure adapter unchanged
    - _Requirements: 3.5, 3.6_

- [ ] 8. Final Checkpoint - Complete Verification
  - Ensure all verification scripts pass, ask the user if questions arise.

## Notes

- **Memory-Only Operation**: All operations are in-memory. No persistence, no backend calls, no storage writes.
- **Fail-Closed Architecture**: All ambiguous or invalid states result in BLOCKED status.
- **Safety Invariants**: Every result preserves safety flags regardless of adapter output.
- **Type Safety**: Adapter results are mapped to handler results with explicit type transformations.
- **Verification-Driven**: Comprehensive verification scripts validate all safety properties.
- **No UI Changes**: This task only modifies handler layer and verification scripts. No UI/page/hook changes.
- **No New Dependencies**: All implementation uses existing types and functions.

## Safety Checklist

Before completing Task 5C, verify:
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

## Type Mapping Reference

### Adapter Result → Handler Result Field Mapping

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

### Status Mapping

| Adapter Status | Handler Status |
|---------------|----------------|
| `'PASSED_PENDING_ACCEPTANCE'` | `CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE` |
| `'FAILED_PENDING_REVIEW'` | `CanonicalReAuditStatus.FAILED_PENDING_REVIEW` |
| `'BLOCKED'` | `CanonicalReAuditStatus.BLOCKED` |
| `'STALE'` | `CanonicalReAuditStatus.STALE` |

### Derived Field Logic

| Field | Logic |
|-------|-------|
| `success` | `status === 'PASSED_PENDING_ACCEPTANCE'` |
| `passed` | `status === 'PASSED_PENDING_ACCEPTANCE'` |
| `readyForAcceptance` | `status === 'PASSED_PENDING_ACCEPTANCE'` |

---

**Document Version**: 1.0.0  
**Spec Type**: Feature (Requirements-First)  
**Task**: 5C - Handler Layer Implementation  
**Date**: 2026-05-01
