# Requirements Document

## Introduction

Task 6B-2B implements the first controlled phase where session draft content may be promoted into the local canonical vault state in React memory only. This builds upon Task 6B-2A (dry-run promotion) by adding real local vault mutation with strict safety gates. The system ensures that promotion remains a memory-only operation with no backend persistence, no deploy unlock, and mandatory canonical audit invalidation.

This is a critical safety milestone: session draft content can now flow into the canonical vault, but only under strict human supervision with explicit acknowledgement, and only in local browser memory. Deploy remains locked, canonical audit is invalidated, and full protocol re-audit is required before any deployment can occur.

## Glossary

- **Canonical_Vault**: The authoritative source of truth for article content in React memory state
- **Session_Draft**: Temporary working copy of article content with pending remediation changes
- **Promotion**: The act of replacing canonical vault content with session draft content
- **Dry_Run**: A simulation of promotion that validates preconditions without performing mutations
- **Snapshot_Identity**: A cryptographic binding of content hash and ledger sequence at a specific point in time
- **Execution_Lock**: A boolean flag preventing concurrent promotion executions
- **Audit_Invalidation**: Setting canonical audit state to null, requiring full re-audit before deployment
- **Deploy_Lock**: A safety mechanism preventing deployment until canonical audit passes
- **Real_Promotion_Handler**: The function that executes actual vault mutation with safety gates
- **Precondition**: A requirement that must be satisfied before promotion can proceed
- **Acknowledgement**: Explicit operator confirmation of safety implications
- **Mutation_Sequence**: The ordered series of state updates during promotion
- **Fail_Closed**: Design principle where any failure prevents all mutations
- **Backend_Persistence**: Any operation that writes to API, database, localStorage, or sessionStorage
- **Transformed_Article**: Preview of how session draft content will appear after promotion

## Requirements

### Requirement 1: Real Local Promotion Execution

**User Story:** As a content operator, I want to promote session draft content into the local canonical vault, so that I can apply verified remediation changes to the authoritative content state.

#### Acceptance Criteria

1. WHEN a promotion is triggered, THE Real_Promotion_Handler SHALL verify the execution lock is available before proceeding
2. WHEN the execution lock is unavailable, THE Real_Promotion_Handler SHALL block promotion with "PRECONDITION" category
3. WHEN promotion begins, THE Real_Promotion_Handler SHALL acquire the execution lock
4. WHEN promotion completes or fails, THE Real_Promotion_Handler SHALL release the execution lock
5. THE Real_Promotion_Handler SHALL complete execution within 500 milliseconds for typical session draft sizes

### Requirement 2: Dry-Run Verification

**User Story:** As a content operator, I want the system to verify dry-run success before real promotion, so that I can ensure preconditions are met and preview is valid.

#### Acceptance Criteria

1. WHEN a promotion is triggered, THE Real_Promotion_Handler SHALL verify the dry-run preview exists and is non-null
2. WHEN the dry-run preview is null, THE Real_Promotion_Handler SHALL block promotion with "DRY_RUN" category
3. WHEN the dry-run preview indicates failure, THE Real_Promotion_Handler SHALL block promotion with "DRY_RUN" category
4. WHEN the dry-run preview has invalid safety invariants, THE Real_Promotion_Handler SHALL block promotion with "DRY_RUN" category
5. WHEN the dry-run preview indicates preconditions not met, THE Real_Promotion_Handler SHALL block promotion with "PRECONDITION" category
6. WHEN promotion begins, THE Real_Promotion_Handler SHALL re-run the dry-run to verify state has not changed
7. WHEN the fresh dry-run fails, THE Real_Promotion_Handler SHALL block promotion with "DRY_RUN" category

### Requirement 3: Snapshot Freshness Verification

**User Story:** As a content operator, I want the system to verify snapshot freshness before promotion, so that I can ensure the content has not changed since the dry-run preview was generated.

#### Acceptance Criteria

1. WHEN a promotion is triggered, THE Real_Promotion_Handler SHALL compute the current content checksum
2. WHEN a promotion is triggered, THE Real_Promotion_Handler SHALL retrieve the current ledger sequence
3. WHEN the snapshot content hash does not match the current checksum, THE Real_Promotion_Handler SHALL block promotion with "SNAPSHOT" category
4. WHEN the snapshot ledger sequence does not match the current ledger sequence, THE Real_Promotion_Handler SHALL block promotion with "SNAPSHOT" category
5. WHEN the fresh dry-run snapshot identity does not match the original snapshot identity, THE Real_Promotion_Handler SHALL block promotion with "SNAPSHOT" category

### Requirement 4: Operator Acknowledgement Verification

**User Story:** As a content operator, I want the system to verify I have acknowledged all safety implications, so that I cannot accidentally promote content without understanding the consequences.

#### Acceptance Criteria

1. WHEN a promotion is triggered, THE Real_Promotion_Handler SHALL verify vault replacement is acknowledged
2. WHEN a promotion is triggered, THE Real_Promotion_Handler SHALL verify audit invalidation is acknowledged
3. WHEN a promotion is triggered, THE Real_Promotion_Handler SHALL verify deploy lock is acknowledged
4. WHEN a promotion is triggered, THE Real_Promotion_Handler SHALL verify re-audit requirement is acknowledged
5. WHEN any acknowledgement is incomplete, THE Real_Promotion_Handler SHALL block promotion with "PRECONDITION" category

### Requirement 5: Mutation Sequence Ordering

**User Story:** As a content operator, I want the system to execute mutations in a specific order, so that the system maintains consistency even if a mutation fails.

#### Acceptance Criteria

1. WHEN promotion executes, THE Real_Promotion_Handler SHALL update the canonical vault first
2. WHEN the vault update succeeds, THE Real_Promotion_Handler SHALL invalidate the canonical audit second
3. WHEN the audit invalidation succeeds, THE Real_Promotion_Handler SHALL clear the audit result third
4. WHEN the audit result clear succeeds, THE Real_Promotion_Handler SHALL clear the transformed article preview fourth
5. WHEN the preview clear succeeds, THE Real_Promotion_Handler SHALL clear the session draft fifth
6. THE Real_Promotion_Handler SHALL execute mutations in the order: vault → audit invalidation → audit result → preview → session clear

### Requirement 6: Vault Mutation

**User Story:** As a content operator, I want the system to replace canonical vault content with session draft content, so that remediation changes become the new authoritative state.

#### Acceptance Criteria

1. WHEN promotion executes, THE Real_Promotion_Handler SHALL call setVault with the session draft content
2. WHEN the vault mutation fails, THE Real_Promotion_Handler SHALL block promotion with "VAULT_MUTATION" category
3. WHEN the vault mutation fails, THE Real_Promotion_Handler SHALL prevent subsequent mutations
4. WHEN the vault mutation succeeds, THE Real_Promotion_Handler SHALL proceed to audit invalidation

### Requirement 7: Audit Invalidation

**User Story:** As a content operator, I want the system to invalidate the canonical audit after vault mutation, so that the system requires full re-audit before deployment.

#### Acceptance Criteria

1. WHEN the vault mutation succeeds, THE Real_Promotion_Handler SHALL call setGlobalAudit with null
2. WHEN the audit invalidation fails, THE Real_Promotion_Handler SHALL block promotion with "AUDIT_INVALIDATION" category
3. WHEN the audit invalidation fails, THE Real_Promotion_Handler SHALL report that vault is already mutated
4. WHEN the audit invalidation succeeds, THE Real_Promotion_Handler SHALL proceed to audit result clear

### Requirement 8: Session Draft Clear

**User Story:** As a content operator, I want the system to clear the session draft after successful promotion, so that the session draft does not persist after its content has been promoted.

#### Acceptance Criteria

1. WHEN the preview clear succeeds, THE Real_Promotion_Handler SHALL call clearLocalDraftSession
2. WHEN the session clear fails, THE Real_Promotion_Handler SHALL block promotion with "SESSION_CLEAR" category
3. WHEN the session clear fails, THE Real_Promotion_Handler SHALL report that vault and audit are already mutated
4. WHEN the session clear succeeds, THE Real_Promotion_Handler SHALL proceed to success state

### Requirement 9: Preview State Clear

**User Story:** As a content operator, I want the system to clear preview state after promotion, so that stale preview data does not persist.

#### Acceptance Criteria

1. WHEN the audit result clear succeeds, THE Real_Promotion_Handler SHALL call setTransformedArticle with null
2. WHEN the audit result clear succeeds, THE Real_Promotion_Handler SHALL call setTransformError with null
3. IF the preview clear fails, THEN THE Real_Promotion_Handler SHALL log a warning and continue execution

### Requirement 10: Fail-Closed Design

**User Story:** As a content operator, I want the system to prevent all mutations if any precondition fails, so that the system never enters a partially mutated state due to precondition failures.

#### Acceptance Criteria

1. WHEN promotion is blocked, THE Real_Promotion_Handler SHALL ensure vault is not updated
2. WHEN promotion is blocked, THE Real_Promotion_Handler SHALL ensure audit is not invalidated
3. WHEN promotion is blocked, THE Real_Promotion_Handler SHALL ensure session draft is not cleared
4. WHEN any guard fails, THE Real_Promotion_Handler SHALL prevent all subsequent mutations

### Requirement 11: Deploy Lock Preservation

**User Story:** As a content operator, I want the system to preserve the deploy lock after promotion, so that deployment cannot occur without canonical re-audit.

#### Acceptance Criteria

1. WHEN promotion succeeds, THE Real_Promotion_Handler SHALL ensure deploy remains locked
2. WHEN promotion fails, THE Real_Promotion_Handler SHALL ensure deploy remains locked
3. THE Real_Promotion_Handler SHALL never unlock deploy under any circumstances

### Requirement 12: No Backend Persistence

**User Story:** As a content operator, I want the system to perform all mutations in memory only, so that unverified content is never persisted to backend storage.

#### Acceptance Criteria

1. THE Real_Promotion_Handler SHALL not call fetch or axios
2. THE Real_Promotion_Handler SHALL not call prisma or libsql
3. THE Real_Promotion_Handler SHALL not write to localStorage
4. THE Real_Promotion_Handler SHALL not write to sessionStorage
5. THE Real_Promotion_Handler SHALL perform all mutations in React memory state only

### Requirement 13: Success Result

**User Story:** As a content operator, I want the system to return a success result after promotion, so that I can verify the promotion completed successfully.

#### Acceptance Criteria

1. WHEN promotion succeeds, THE Real_Promotion_Handler SHALL return success equal to true
2. WHEN promotion succeeds, THE Real_Promotion_Handler SHALL return vaultUpdated equal to true
3. WHEN promotion succeeds, THE Real_Promotion_Handler SHALL return auditInvalidated equal to true
4. WHEN promotion succeeds, THE Real_Promotion_Handler SHALL return sessionCleared equal to true
5. WHEN promotion succeeds, THE Real_Promotion_Handler SHALL return deployLocked equal to true
6. WHEN promotion succeeds, THE Real_Promotion_Handler SHALL return reAuditRequired equal to true
7. WHEN promotion succeeds, THE Real_Promotion_Handler SHALL return promotedAt timestamp

### Requirement 14: Blocked Result

**User Story:** As a content operator, I want the system to return a blocked result when promotion fails, so that I can understand why the promotion was prevented.

#### Acceptance Criteria

1. WHEN promotion is blocked, THE Real_Promotion_Handler SHALL return success equal to false
2. WHEN promotion is blocked, THE Real_Promotion_Handler SHALL return blocked equal to true
3. WHEN promotion is blocked, THE Real_Promotion_Handler SHALL return a reason string
4. WHEN promotion is blocked, THE Real_Promotion_Handler SHALL return a blockCategory
5. WHEN promotion is blocked, THE Real_Promotion_Handler SHALL return vaultUpdated equal to false
6. WHEN promotion is blocked, THE Real_Promotion_Handler SHALL return auditInvalidated equal to false
7. WHEN promotion is blocked, THE Real_Promotion_Handler SHALL return sessionCleared equal to false

### Requirement 15: Modal Control

**User Story:** As a content operator, I want the modal to close on success and remain open on failure, so that I can see success confirmation or error details.

#### Acceptance Criteria

1. WHEN promotion succeeds, THE Real_Promotion_Handler SHALL call the onClose callback
2. WHEN promotion is blocked, THE Real_Promotion_Handler SHALL not call the onClose callback
3. WHEN promotion fails after vault mutation, THE Real_Promotion_Handler SHALL not call the onClose callback

### Requirement 16: Promotion Confirmation Modal UI

**User Story:** As a content operator, I want a confirmation modal with clear safety warnings, so that I understand the implications before promoting content.

#### Acceptance Criteria

1. WHEN the promotion modal opens, THE PromotionConfirmModal SHALL display the dry-run preview summary
2. WHEN the promotion modal opens, THE PromotionConfirmModal SHALL display vault replacement warning
3. WHEN the promotion modal opens, THE PromotionConfirmModal SHALL display audit invalidation warning
4. WHEN the promotion modal opens, THE PromotionConfirmModal SHALL display deploy lock warning
5. WHEN the promotion modal opens, THE PromotionConfirmModal SHALL display re-audit requirement warning
6. WHEN the promotion modal opens, THE PromotionConfirmModal SHALL require explicit acknowledgement checkboxes
7. WHEN all acknowledgements are incomplete, THE PromotionConfirmModal SHALL disable the promote button
8. WHEN all acknowledgements are complete, THE PromotionConfirmModal SHALL enable the promote button

### Requirement 17: Verification Script

**User Story:** As a developer, I want a verification script that validates all safety constraints, so that I can ensure the implementation meets all requirements.

#### Acceptance Criteria

1. THE Verification_Script SHALL verify execution lock prevents concurrent execution
2. THE Verification_Script SHALL verify dry-run success is required
3. THE Verification_Script SHALL verify snapshot freshness is required
4. THE Verification_Script SHALL verify operator acknowledgements are required
5. THE Verification_Script SHALL verify mutation sequence ordering
6. THE Verification_Script SHALL verify fail-closed design
7. THE Verification_Script SHALL verify deploy lock preservation
8. THE Verification_Script SHALL verify no backend persistence
9. THE Verification_Script SHALL verify audit invalidation
10. THE Verification_Script SHALL verify session draft clear
11. THE Verification_Script SHALL not weaken 6B-2A verification constraints

### Requirement 18: Error Handling

**User Story:** As a content operator, I want clear error messages when promotion fails, so that I can understand what went wrong and how to recover.

#### Acceptance Criteria

1. WHEN concurrent execution is attempted, THE Real_Promotion_Handler SHALL return reason "Promotion already executing"
2. WHEN dry-run preview is invalid, THE Real_Promotion_Handler SHALL return reason "Dry-run preview invalid or failed"
3. WHEN snapshot is stale, THE Real_Promotion_Handler SHALL return reason "Snapshot stale - re-run dry-run required"
4. WHEN preconditions are not met, THE Real_Promotion_Handler SHALL return reason "Preconditions not met"
5. WHEN acknowledgements are incomplete, THE Real_Promotion_Handler SHALL return reason "Operator acknowledgements incomplete"
6. WHEN vault mutation fails, THE Real_Promotion_Handler SHALL return reason "Vault update failed" with error details
7. WHEN audit invalidation fails, THE Real_Promotion_Handler SHALL return reason "Audit invalidation failed - vault mutated"
8. WHEN session clear fails, THE Real_Promotion_Handler SHALL return reason "Session clear failed - vault and audit mutated"

### Requirement 19: Transformed Article Handling

**User Story:** As a content operator, I want the system to handle transformed article preview state, so that preview data is cleared after promotion.

#### Acceptance Criteria

1. WHEN promotion executes, THE Real_Promotion_Handler SHALL clear the transformed article state
2. WHEN promotion executes, THE Real_Promotion_Handler SHALL clear the transform error state
3. IF the transformed article clear fails, THEN THE Real_Promotion_Handler SHALL log a warning and continue

### Requirement 20: Memory Usage

**User Story:** As a content operator, I want the system to manage memory efficiently during promotion, so that large multilingual packages do not cause performance issues.

#### Acceptance Criteria

1. WHEN promotion executes, THE Real_Promotion_Handler SHALL create temporary copies of vault and session draft
2. THE Real_Promotion_Handler SHALL limit memory overhead to less than 1 megabyte for typical multilingual packages
3. THE Real_Promotion_Handler SHALL handle packages with 10-20 languages and 5-10 remediation events efficiently
