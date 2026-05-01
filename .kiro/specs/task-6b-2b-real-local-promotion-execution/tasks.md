# Implementation Plan: Task 6B-2B Real Local Promotion Execution

## Overview

This implementation plan converts the design for Task 6B-2B into actionable coding tasks. Task 6B-2B implements the first controlled phase where session draft content may be promoted into the local canonical vault state in React memory only. This builds upon Task 6B-2A (dry-run promotion) by adding real local vault mutation with strict safety gates.

**Critical Safety Constraints:**
- Memory-only operations (no backend persistence)
- Deploy remains locked
- Canonical audit must be invalidated after promotion
- Mutation sequence: vault → audit → preview → session
- Fail-closed design (any failure prevents all mutations)
- No concurrent execution allowed

**Implementation Language:** TypeScript

## Tasks

- [x] 1. Pre-implementation state audit
  - Review current warroom page implementation
  - Review existing dry-run promotion handler
  - Review session draft promotion types
  - Verify all required state setters are available
  - Document current execution flow
  - _Requirements: All requirements (baseline understanding)_

- [x] 2. Type and interface readiness check
  - [x] 2.1 Extend session-draft-promotion-types.ts with real promotion types
    - Add `RealPromotionExecutionInput` interface
    - Add `RealPromotionExecutionResult` type (success and blocked variants)
    - Add block category enum: `PRECONDITION | DRY_RUN | SNAPSHOT | VAULT_MUTATION | AUDIT_INVALIDATION | SESSION_CLEAR`
    - Ensure compatibility with existing `LocalPromotionDryRunPreview` type
    - _Requirements: 13.1-13.7, 14.1-14.7_
  
  - [ ]* 2.2 Write unit tests for type definitions
    - Test type guards for success vs blocked results
    - Test block category exhaustiveness
    - _Requirements: 13.1-13.7, 14.1-14.7_

- [x] 3. Real promotion handler scaffold
  - [x] 3.1 Create executeRealLocalPromotion function in promotion-execution-handler.ts
    - Create function signature matching `RealPromotionExecutionInput`
    - Add execution lock acquisition and release logic
    - Add try-finally block to ensure lock release
    - Add basic structure for phases: guards, dry-run verification, mutation sequence, success state
    - Return blocked result for unimplemented phases (temporary)
    - _Requirements: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 3.2 Write unit tests for execution lock behavior
    - **Property 1: Execution Lock Safety**
    - **Validates: Requirements 1.2, 1.4**
    - Test concurrent execution is blocked
    - Test lock is released on success
    - Test lock is released on failure
    - Test lock is released on exception
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 4. Guard and precondition re-check integration
  - [x] 4.1 Implement guard validation phase
    - Check execution lock availability (guard 1)
    - Verify dry-run preview exists and succeeded (guard 2)
    - Verify preconditions from dry-run (guard 3)
    - Verify operator acknowledgements (guard 4)
    - Verify snapshot freshness (guard 5)
    - Verify payload exists (guard 6)
    - Return blocked result with appropriate category for each guard failure
    - _Requirements: 1.2, 2.1-2.4, 3.1-3.4, 4.1-4.5, 10.1-10.4_
  
  - [ ]* 4.2 Write unit tests for guard validation
    - **Property 10: Fail-Closed Guarantee**
    - **Validates: Requirements 10.1, 10.2, 10.3, 10.4**
    - Test each guard failure blocks promotion
    - Test no mutations occur when guards fail
    - Test correct block category for each guard
    - _Requirements: 10.1-10.4, 18.1-18.8_

- [x] 5. Dry-run success and snapshot verification integration
  - [x] 5.1 Implement verifyDryRunSuccess helper function
    - Check preview exists and is non-null
    - Check preview.success === true
    - Check all safety invariants are valid
    - Check precondition.canPromote === true
    - Check snapshot binding exists
    - Return boolean indicating validity
    - _Requirements: 2.1-2.4_
  
  - [x] 5.2 Implement verifySnapshotFreshness helper function
    - Check snapshot exists
    - Check content hash matches current checksum
    - Check ledger sequence matches current sequence
    - Return boolean indicating freshness
    - _Requirements: 3.1-3.4_
  
  - [x] 5.3 Implement dry-run re-verification in main handler
    - Re-run dry-run immediately before mutation phase
    - Verify fresh dry-run succeeds
    - Verify snapshot identity matches original
    - Block promotion if verification fails
    - _Requirements: 2.6, 2.7, 3.5_
  
  - [ ]* 5.4 Write unit tests for dry-run verification
    - **Property 2: Dry-Run Success Requirement**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.7**
    - Test null preview is rejected
    - Test failed preview is rejected
    - Test invalid safety invariants are rejected
    - _Requirements: 2.1-2.7_
  
  - [ ]* 5.5 Write unit tests for snapshot verification
    - **Property 3: Snapshot Freshness Requirement**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
    - Test stale content hash is rejected
    - Test stale ledger sequence is rejected
    - Test snapshot identity change during execution is rejected
    - _Requirements: 3.1-3.5_

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Local canonical vault update wiring
  - [ ] 7.1 Implement vault mutation step
    - Call setVault with session draft content
    - Wrap in try-catch to detect mutation failures
    - Return blocked result with "VAULT_MUTATION" category on failure
    - Prevent subsequent mutations if vault mutation fails
    - _Requirements: 6.1, 6.2, 6.3, 6.4_
  
  - [ ]* 7.2 Write unit tests for vault mutation
    - **Property 6: Vault Mutation Correctness**
    - **Validates: Requirements 6.1, 6.2, 6.3, 6.4**
    - Test vault is updated with session draft content
    - Test vault mutation failure prevents subsequent mutations
    - Test error message includes failure details
    - _Requirements: 6.1-6.4_

- [ ] 8. Canonical audit invalidation wiring
  - [ ] 8.1 Implement audit invalidation step
    - Call setGlobalAudit(null) after successful vault mutation
    - Wrap in try-catch to detect invalidation failures
    - Return blocked result with "AUDIT_INVALIDATION" category on failure
    - Include warning that vault is already mutated
    - _Requirements: 7.1, 7.2, 7.3, 7.4_
  
  - [ ]* 8.2 Write unit tests for audit invalidation
    - **Property 7: Audit Invalidation Correctness**
    - **Validates: Requirements 7.1, 7.2, 7.3, 7.4**
    - Test audit is set to null after vault mutation
    - Test audit invalidation failure is detected
    - Test error message indicates vault is already mutated
    - _Requirements: 7.1-7.4_

- [ ] 9. Derived preview and audit state clearing
  - [ ] 9.1 Implement audit result clear step
    - Call setAuditResult(null) after audit invalidation
    - Wrap in try-catch and log warning on failure (non-critical)
    - Continue execution even if clear fails
    - _Requirements: 5.3, 9.1_
  
  - [ ] 9.2 Implement preview state clear step
    - Call setTransformedArticle(null) after audit result clear
    - Call setTransformError(null) after audit result clear
    - Wrap in try-catch and log warning on failure (non-critical)
    - Continue execution even if clear fails
    - _Requirements: 5.4, 9.2, 9.3, 19.1, 19.2, 19.3_
  
  - [ ]* 9.3 Write unit tests for preview state clearing
    - **Property 9: Preview State Clear Correctness**
    - **Validates: Requirements 9.1, 9.2, 9.3, 19.1, 19.2, 19.3**
    - Test transformed article is cleared
    - Test transform error is cleared
    - Test execution continues on clear failure
    - _Requirements: 9.1-9.3, 19.1-19.3_

- [x] 10. Session draft clear after successful vault update and audit invalidation
  - [x] 10.1 Implement session draft clear step
    - Call clearLocalDraftSession() after preview state clear
    - Wrap in try-catch to detect clear failures
    - Return blocked result with "SESSION_CLEAR" category on failure
    - Include warning that vault and audit are already mutated
    - _Requirements: 5.5, 8.1, 8.2, 8.3, 8.4_
  
  - [ ]* 10.2 Write unit tests for session draft clear
    - **Property 8: Session Clear Correctness**
    - **Validates: Requirements 8.1, 8.2, 8.3, 8.4**
    - Test session draft is cleared after preview clear
    - Test session clear failure is detected
    - Test error message indicates vault and audit are already mutated
    - _Requirements: 8.1-8.4_

- [ ] 11. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 12. Modal UI gating and acknowledgement wiring
  - [ ] 12.1 Update PromotionConfirmModal component
    - Add state for operator acknowledgements (4 checkboxes)
    - Display dry-run preview summary
    - Display vault replacement warning with checkbox
    - Display audit invalidation warning with checkbox
    - Display deploy lock warning with checkbox
    - Display re-audit requirement warning with checkbox
    - Disable promote button until all acknowledgements are checked
    - Wire promote button to call executeRealLocalPromotion
    - _Requirements: 16.1-16.8_
  
  - [ ] 12.2 Implement modal control logic
    - Call onClose callback only on success
    - Keep modal open on blocked result
    - Keep modal open on failure after vault mutation
    - Display error message in modal on failure
    - _Requirements: 15.1, 15.2, 15.3_
  
  - [ ]* 12.3 Write integration tests for modal UI
    - Test acknowledgement checkboxes enable promote button
    - Test modal closes on success
    - Test modal remains open on failure
    - Test error message is displayed on failure
    - _Requirements: 15.1-15.3, 16.1-16.8_

- [ ] 13. Failure handling and execution lock
  - [ ] 13.1 Implement error message generation
    - Add helper function to generate error messages for each block category
    - Ensure error messages match requirements specification
    - Include context-specific details in error messages
    - _Requirements: 18.1-18.8_
  
  - [ ] 13.2 Implement success result generation
    - Create success result with all required fields
    - Include promotedAt timestamp
    - Set all boolean flags correctly
    - _Requirements: 13.1-13.7_
  
  - [ ] 13.3 Implement blocked result generation
    - Create blocked result with all required fields
    - Include reason string and block category
    - Set all boolean flags to false
    - _Requirements: 14.1-14.7_
  
  - [ ]* 13.4 Write unit tests for result generation
    - **Property 13: Success Result Completeness**
    - **Validates: Requirements 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7**
    - **Property 14: Blocked Result Completeness**
    - **Validates: Requirements 14.1, 14.2, 14.3, 14.4, 14.5, 14.6, 14.7**
    - Test success result has all required fields
    - Test blocked result has all required fields
    - Test error messages match specification
    - _Requirements: 13.1-13.7, 14.1-14.7, 18.1-18.8_

- [ ] 14. Verification script creation
  - [ ] 14.1 Create verify-session-draft-promotion-6b2b-real-execution.ts script
    - Test execution lock prevents concurrent execution
    - Test dry-run success is required
    - Test snapshot freshness is required
    - Test operator acknowledgements are required
    - Test mutation sequence ordering
    - Test fail-closed design
    - Test deploy lock preservation
    - Test no backend persistence
    - Test audit invalidation
    - Test session draft clear
    - Verify 6B-2A verification constraints still pass
    - _Requirements: 17.1-17.11_
  
  - [ ]* 14.2 Run verification script
    - Execute verification script
    - Verify all checks pass
    - Document any failures
    - _Requirements: 17.1-17.11_

- [ ] 15. Regression validation
  - [ ] 15.1 Verify Task 6B-2A dry-run still works
    - Run existing dry-run promotion flow
    - Verify no mutations occur
    - Verify preview is generated correctly
    - Verify all safety invariants hold
    - _Requirements: All requirements (regression check)_
  
  - [ ] 15.2 Verify warroom page still renders correctly
    - Load warroom page
    - Verify session draft UI renders
    - Verify dry-run button works
    - Verify promote button appears after dry-run
    - _Requirements: All requirements (regression check)_
  
  - [ ]* 15.3 Write integration tests for full promotion flow
    - **Property 5: Mutation Ordering Invariant**
    - **Validates: Requirements 5.1, 5.2, 5.3, 5.4, 5.5, 5.6**
    - **Property 11: Deploy Lock Preservation**
    - **Validates: Requirements 11.1, 11.2, 11.3**
    - **Property 12: No Backend Persistence**
    - **Validates: Requirements 12.1, 12.2, 12.3, 12.4, 12.5**
    - Test end-to-end promotion flow
    - Test mutation sequence ordering
    - Test deploy lock preservation
    - Test no backend calls are made
    - _Requirements: 5.1-5.6, 11.1-11.3, 12.1-12.5_

- [ ] 16. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 17. Scope audit
  - [ ] 17.1 Verify no backend persistence
    - Search codebase for fetch/axios calls in promotion handler
    - Search codebase for prisma/libsql calls in promotion handler
    - Search codebase for localStorage writes in promotion handler
    - Search codebase for sessionStorage writes in promotion handler
    - Document findings
    - _Requirements: 12.1-12.5_
  
  - [ ] 17.2 Verify deploy remains locked
    - Search codebase for deploy unlock calls in promotion handler
    - Verify no code path unlocks deploy
    - Document findings
    - _Requirements: 11.1-11.3_
  
  - [ ] 17.3 Verify audit invalidation is mandatory
    - Verify setGlobalAudit(null) is called after vault mutation
    - Verify no code path skips audit invalidation
    - Document findings
    - _Requirements: 7.1-7.4_
  
  - [ ] 17.4 Verify session audit is not inherited
    - Verify session audit results are not copied to canonical audit
    - Verify canonical re-audit is required
    - Document findings
    - _Requirements: 12.1-12.5_

- [ ] 18. Final verification and documentation
  - [ ] 18.1 Run all unit tests
    - Execute all unit tests
    - Verify all tests pass
    - Document any failures
    - _Requirements: All requirements_
  
  - [ ] 18.2 Run all integration tests
    - Execute all integration tests
    - Verify all tests pass
    - Document any failures
    - _Requirements: All requirements_
  
  - [ ] 18.3 Run verification script
    - Execute verify-session-draft-promotion-6b2b-real-execution.ts
    - Verify all checks pass
    - Document any failures
    - _Requirements: 17.1-17.11_
  
  - [ ] 18.4 Update implementation documentation
    - Document new functions and interfaces
    - Document mutation sequence
    - Document safety constraints
    - Document error handling
    - _Requirements: All requirements_

- [ ] 19. Commit changes
  - Review all changes
  - Ensure no unintended modifications
  - Create commit with descriptive message
  - _Requirements: All requirements (delivery)_

- [ ] 20. Push changes
  - Push to feature branch (not main/master)
  - Verify push succeeds
  - _Requirements: All requirements (delivery)_

- [ ] 21. Deploy verification (DO NOT DEPLOY)
  - Verify deploy remains locked
  - Verify no automatic deploy triggers
  - Document that deploy is intentionally locked
  - Document that canonical re-audit is required before deploy
  - _Requirements: 11.1-11.3_

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- **CRITICAL:** No task may unlock deploy, call backend/API/database, or persist data
- **CRITICAL:** Canonical audit must be invalidated after vault mutation
- **CRITICAL:** Session draft must be cleared only after vault update and audit invalidation succeed
- **CRITICAL:** Mutation sequence must be: vault → audit → preview → session
- **CRITICAL:** Fail-closed design: any guard failure prevents all mutations
- **CRITICAL:** Execution lock must be released in all cases (success, failure, exception)
