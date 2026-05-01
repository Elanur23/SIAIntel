# Requirements Document: Canonical Re-Audit After Local Promotion

## Introduction

This feature implements the canonical re-audit workflow that must occur after session draft content has been promoted to the local canonical vault. After Task 6B-2B (Real Local Promotion Execution), the canonical vault contains promoted content but the canonical audit is invalidated. This phase designs the safest path to re-audit the promoted canonical content while maintaining strict deploy lock boundaries.

**Critical Safety Principle**: This phase MUST NOT unlock deploy. Deploy unlock gating must remain a separate later phase with its own design, audit, verification, and human confirmation.

**Design Decision**: Use the safer pending-result model where re-audit results are stored as `pendingCanonicalReAuditResult` and do NOT directly overwrite `globalAudit` as passed. Canonical audit acceptance must be a separate future phase.

## Glossary

- **Canonical_Vault**: The authoritative source of truth for article content in React memory state (contains promoted content after 6B-2B)
- **Canonical_Audit**: The global audit result for canonical vault content (invalidated after promotion)
- **Pending_Canonical_ReAudit_Result**: Temporary storage for re-audit results before acceptance
- **Snapshot_Identity**: Cryptographic binding of content hash and ledger sequence at audit time
- **Promotion_Archive**: Metadata about the promotion event including snapshot and timestamp
- **Stale_Result**: Re-audit result that no longer matches current vault snapshot
- **Deploy_Lock**: Safety mechanism preventing deployment (MUST remain locked in this phase)
- **Session_Audit**: Audit result from session draft (MUST NOT be inherited into canonical audit)
- **Manual_Trigger**: Operator-initiated action (re-audit MUST be manual only, never automatic)
- **Audit_Runner**: In-memory audit execution logic (read-only mode)
- **Provenance**: Audit metadata including promotionId, snapshot, timestamp, and operator

## Requirements

### Requirement 1: Manual Re-Audit Trigger Only

**User Story:** As a content operator, I want canonical re-audit to be manually triggered only, so that I maintain explicit control over when re-audit occurs and can verify vault state before auditing.

#### Acceptance Criteria

1. WHEN the canonical vault is promoted, THE system SHALL NOT automatically trigger canonical re-audit
2. WHEN the promotion modal closes, THE system SHALL NOT automatically trigger canonical re-audit
3. WHEN promotion succeeds, THE system SHALL NOT automatically trigger canonical re-audit
4. THE system SHALL provide a manual "Run Canonical Re-Audit" button
5. THE canonical re-audit SHALL execute only when the operator explicitly clicks the manual trigger button

### Requirement 2: Pending Result Storage Model

**User Story:** As a content operator, I want re-audit results stored as pending until explicitly accepted, so that passing re-audit does not automatically mark canonical audit as valid.

#### Acceptance Criteria

1. WHEN canonical re-audit completes, THE system SHALL store the result in `pendingCanonicalReAuditResult`
2. WHEN canonical re-audit passes, THE system SHALL NOT directly overwrite `globalAudit` as passed
3. WHEN canonical re-audit passes, THE system SHALL set `pendingCanonicalReAuditResult.status` to "PASSED_PENDING_ACCEPTANCE"
4. WHEN canonical re-audit fails, THE system SHALL set `pendingCanonicalReAuditResult.status` to "FAILED_PENDING_REVIEW"
5. WHEN canonical re-audit has not been run, THE system SHALL set `pendingCanonicalReAuditResult.status` to "NOT_RUN"
6. WHEN vault content changes after re-audit, THE system SHALL set `pendingCanonicalReAuditResult.status` to "STALE"
7. WHEN re-audit is blocked, THE system SHALL set `pendingCanonicalReAuditResult.status` to "BLOCKED"

### Requirement 3: Deploy Lock Boundary Preservation

**User Story:** As a content operator, I want deploy to remain locked even after re-audit passes, so that deploy unlock requires explicit separate approval.

#### Acceptance Criteria

1. WHEN canonical re-audit passes, THE system SHALL NOT unlock deploy
2. WHEN canonical re-audit passes, THE system SHALL NOT enable publish/save/deploy functionality
3. WHEN canonical re-audit passes, THE system SHALL NOT change any deploy unlock state
4. WHEN canonical re-audit passes, THE system SHALL NOT weaken any deployment gate
5. THE system SHALL display "Deploy remains locked" warning even after successful re-audit
6. THE system SHALL display "Acceptance/deploy unlock is a later phase" warning

### Requirement 4: Snapshot Identity Guard (Before Re-Audit)

**User Story:** As a content operator, I want the system to verify snapshot identity before re-audit, so that re-audit runs against the expected promoted content.

#### Acceptance Criteria

1. WHEN re-audit is triggered, THE system SHALL capture current canonical vault snapshot hash
2. WHEN promotion archive exists, THE system SHALL compare current snapshot against promotion archive snapshot
3. WHEN snapshot mismatch is detected, THE system SHALL block re-audit with reason "Snapshot mismatch"
4. WHEN snapshot identity is missing, THE system SHALL block re-audit with reason "Snapshot identity missing"
5. THE system SHALL require valid snapshot identity before proceeding to audit execution

### Requirement 5: Snapshot Identity Guard (After Re-Audit)

**User Story:** As a content operator, I want re-audit results to include snapshot identity, so that result validity can be verified against current vault state.

#### Acceptance Criteria

1. WHEN re-audit completes, THE result SHALL include `auditedSnapshotId` or `auditedContentHash`
2. WHEN re-audit completes, THE result SHALL include `promotionId` if available
3. WHEN re-audit completes, THE result SHALL include `auditedAt` timestamp
4. WHEN re-audit completes, THE result SHALL include `auditor` or `operator` identifier
5. WHEN vault changes after re-audit, THE system SHALL detect snapshot mismatch and mark result as STALE

### Requirement 6: Input Source Validation

**User Story:** As a content operator, I want canonical re-audit to run against promoted canonical vault content only, so that audit results reflect the actual canonical state.

#### Acceptance Criteria

1. WHEN re-audit executes, THE system SHALL run audit against promoted canonical vault content
2. WHEN re-audit executes, THE system SHALL NOT run audit against session draft
3. WHEN re-audit executes, THE system SHALL NOT run audit against transformedArticle
4. WHEN re-audit executes, THE system SHALL NOT run audit against stale promotionDryRunResult
5. WHEN re-audit executes, THE system SHALL NOT run audit against archived session audit

### Requirement 7: Session Audit Inheritance Ban

**User Story:** As a content operator, I want the system to prevent session audit inheritance, so that canonical audit is always based on fresh canonical vault audit.

#### Acceptance Criteria

1. THE system SHALL NOT copy sessionAuditResult into globalAudit
2. THE system SHALL NOT copy archived session audit into canonical audit
3. THE system SHALL NOT treat session audit pass as canonical audit pass
4. THE system SHALL NOT use session ledger as audit clearance
5. THE system SHALL require fresh canonical vault audit for canonical audit result

### Requirement 8: In-Memory Only Boundary

**User Story:** As a content operator, I want re-audit to remain in-memory only, so that no backend persistence occurs in this phase.

#### Acceptance Criteria

1. THE system SHALL NOT call backend/API endpoints during re-audit
2. THE system SHALL NOT call database/provider during re-audit
3. THE system SHALL NOT use localStorage during re-audit
4. THE system SHALL NOT use sessionStorage during re-audit
5. THE system SHALL NOT write files during re-audit
6. THE system SHALL NOT save audit results to server
7. THE system SHALL NOT publish/deploy/save during re-audit
8. THE system SHALL maintain all re-audit state in browser memory only

### Requirement 9: Canonical Re-Audit Panel UI

**User Story:** As a content operator, I want a clear UI panel showing canonical audit state and re-audit controls, so that I understand audit status and can trigger re-audit when ready.

#### Acceptance Criteria

1. WHEN canonical audit is invalid, THE UI SHALL display "Canonical audit invalid/stale" state
2. WHEN promotion archive exists, THE UI SHALL display promotion archive metadata
3. WHEN re-audit is available, THE UI SHALL display snapshot/hash being audited
4. THE UI SHALL provide a manual "Run Canonical Re-Audit" button
5. WHEN re-audit completes, THE UI SHALL display pending result status
6. WHEN re-audit completes, THE UI SHALL display pass/fail details
7. THE UI SHALL display "Deploy remains locked" warning
8. THE UI SHALL display "Acceptance/deploy unlock is a later phase" warning

### Requirement 10: Re-Audit Button Gating

**User Story:** As a content operator, I want the re-audit button to be disabled when preconditions are not met, so that I cannot trigger re-audit in invalid states.

#### Acceptance Criteria

1. WHEN no promoted canonical vault exists, THE button SHALL be disabled
2. WHEN canonical vault snapshot is missing, THE button SHALL be disabled
3. WHEN promotion archive/snapshot mismatch is detected, THE button SHALL be disabled
4. WHEN re-audit is currently running, THE button SHALL be disabled
5. WHEN stale state is detected, THE button SHALL be disabled
6. WHEN operator acknowledgement is required, THE button SHALL require explicit acknowledgement

### Requirement 11: Re-Audit Handler Function

**User Story:** As a developer, I want a well-defined re-audit handler function, so that re-audit execution is predictable and testable.

#### Acceptance Criteria

1. THE handler SHALL accept `CanonicalReAuditRequest` as input
2. THE handler SHALL return `PendingCanonicalReAuditResult` as output
3. THE handler SHALL validate snapshot identity before execution
4. THE handler SHALL validate canonical vault content before execution
5. THE handler SHALL run in-memory audit runner in read-only mode
6. THE handler SHALL return pending result with provenance metadata
7. THE handler SHALL NOT mutate deploy gate state
8. THE handler SHALL NOT write to backend/API/database/provider
9. THE handler SHALL NOT promote pending result to globalAudit pass

### Requirement 12: Re-Audit Result Provenance

**User Story:** As a content operator, I want re-audit results to include full provenance metadata, so that result validity and context can be verified.

#### Acceptance Criteria

1. THE result SHALL include `promotionId` if available
2. THE result SHALL include `auditedSnapshotId` or `auditedContentHash`
3. THE result SHALL include `auditedAt` timestamp
4. THE result SHALL include `operator` or `auditor` identifier
5. THE result SHALL include `status` field (NOT_RUN, RUNNING, PASSED_PENDING_ACCEPTANCE, FAILED_PENDING_REVIEW, STALE, BLOCKED)
6. THE result SHALL include pass/fail details if audit completed
7. THE result SHALL include block reason if audit was blocked

### Requirement 13: Stale Result Detection

**User Story:** As a content operator, I want the system to detect when re-audit results become stale, so that I do not rely on outdated audit results.

#### Acceptance Criteria

1. WHEN vault content changes after re-audit, THE system SHALL detect snapshot mismatch
2. WHEN snapshot mismatch is detected, THE system SHALL mark `pendingCanonicalReAuditResult.status` as STALE
3. WHEN result is marked STALE, THE system SHALL prevent result acceptance
4. WHEN result is marked STALE, THE UI SHALL display "Re-audit required - vault content changed"
5. THE system SHALL require fresh re-audit if vault content changes

### Requirement 14: Verification Script Requirements

**User Story:** As a developer, I want a verification script that validates all re-audit safety constraints, so that implementation correctness can be verified.

#### Acceptance Criteria

1. THE script SHALL verify manual trigger only (no auto-run after promotion)
2. THE script SHALL verify no auto-run after modal close
3. THE script SHALL verify `pendingCanonicalReAuditResult` exists
4. THE script SHALL verify `globalAudit` is not directly overwritten as pass
5. THE script SHALL verify deploy remains locked after successful re-audit
6. THE script SHALL verify snapshot identity is required
7. THE script SHALL verify stale snapshot blocks result acceptance
8. THE script SHALL verify no backend/API/database/provider calls
9. THE script SHALL verify no localStorage/sessionStorage usage
10. THE script SHALL verify no publish/save/deploy wiring
11. THE script SHALL verify no session audit inheritance
12. THE script SHALL verify no rollback implementation
13. THE script SHALL verify no mutation of session draft
14. THE script SHALL verify result includes provenance metadata

### Requirement 15: Expected File Scope

**User Story:** As a developer, I want clear guidance on which files must be touched, so that implementation scope is well-defined.

#### Acceptance Criteria

1. THE implementation MUST touch `app/admin/warroom/page.tsx`
2. THE implementation MUST touch a canonical re-audit handler file (new or existing)
3. THE implementation MUST touch a type file for canonical re-audit contracts
4. THE implementation MAY touch a new `CanonicalReAuditPanel` component
5. THE implementation MAY touch existing audit helpers through in-memory wrapper
6. THE implementation MAY touch verification script for canonical re-audit
7. THE implementation MUST NOT touch backend/API/database/provider files
8. THE implementation MUST NOT touch deploy/publish logic
9. THE implementation MUST NOT touch rollback implementation
10. THE implementation MUST NOT touch session draft mutation logic
11. THE implementation MUST NOT touch persistence layers

### Requirement 16: Risk Mitigation

**User Story:** As a content operator, I want the system to mitigate known risks, so that re-audit execution is safe and predictable.

#### Acceptance Criteria

1. THE system SHALL prevent stale approval by requiring snapshot identity match
2. THE system SHALL prevent accidental deploy unlock by preserving deploy lock boundary
3. THE system SHALL prevent session audit inheritance by validating input source
4. THE system SHALL prevent wrong input source by validating canonical vault content
5. THE system SHALL prevent snapshot mismatch by validating before and after re-audit
6. THE system SHALL prevent auto-run race condition by requiring manual trigger only
7. THE system SHALL prevent pending result mistaken as canonical pass by using pending storage model

