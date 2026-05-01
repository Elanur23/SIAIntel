# Requirements Document

## Introduction

Controlled Remediation Phase 3A establishes the type-safe protocol and data structures for human-approved remediation apply events. This phase creates the foundation for future "Apply to Draft" functionality by defining the event schemas, snapshot structures, and eligibility rules required to maintain fail-closed safety and audit integrity. 

Phase 3A is strictly limited to type definitions, enums, constants, and pure helper functions. It does not implement any UI components, draft mutations, or runtime apply logic.

## Glossary

- **Applied_Remediation_Event**: A record of a successfully applied remediation suggestion to a draft
- **Draft_Snapshot**: A language-and-field-scoped record of content state before a remediation is applied
- **Remediation_Apply_Result**: The status of an attempt to apply a suggestion (e.g., APPROVED_FOR_DRAFT_CHANGE, BLOCKED_HUMAN_ONLY)
- **Audit_Invalidation**: The process of marking an audit as stale because the underlying content has changed
- **Rollback_Event**: A record of restoring a previously snapshotted draft state
- **Eligibility_Rules**: Pure logic determining if a category of remediation can be applied to a draft (with human approval)

## Phase 1, 2A, and 2B Foundation

**Phase 1 Deliverables (Completed and Deployed):**
- `lib/editorial/remediation-types.ts` - Type contract for suggestions and plans

**Phase 2A Deliverables (Completed and Deployed):**
- `lib/editorial/remediation-engine.ts` - Read-only suggestion generator

**Phase 2B Deliverables (Completed and Deployed):**
- `app/admin/warroom/components/RemediationPreviewPanel.tsx` - Read-only UI preview

## Requirements

### Requirement 1: Apply Protocol Type Module

**User Story:** As a developer, I want a dedicated module for apply protocol types, so that future implementation of draft application is built on a shared, type-safe contract.

#### Acceptance Criteria

1. THE system SHALL provide a types-only module at `lib/editorial/remediation-apply-types.ts`
2. THE module SHALL export only types, enums, constants, and pure helper functions
3. THE module SHALL NOT contain runtime mutation logic
4. THE module SHALL NOT import UI, API, or database-related modules
5. THE module SHALL NOT make network calls or filesystem writes
6. THE module SHALL be independent of any Warroom page state

### Requirement 2: AppliedRemediationEvent Interface

**User Story:** As an auditor, I want a structured event record for applied remediations, so that I can trace exactly what changed, by whom, and why.

#### Acceptance Criteria

1. THE `AppliedRemediationEvent` interface SHALL include:
   - `eventId`: Unique identifier for the event
   - `suggestionId`: Reference to the original suggestion
   - `articleId`: Reference to the affected article
   - `packageId`: Reference to the affected package
   - `operatorId`: Identifier of the human who approved the change (optional or defaults to "unknown_operator")
   - `category`: Remediation category
   - `affectedLanguage`: The language code affected
   - `affectedField`: The specific field changed (e.g., 'headline', 'body')
   - `originalText`: The content before application
   - `appliedText`: The content after application
   - `diff`: A representation of the change (e.g., standard diff or summary)
   - `auditInvalidated`: BOOLEAN (MUST be true)
   - `reAuditRequired`: BOOLEAN (MUST be true)
   - `createdAt`: ISO 8601 timestamp
   - `approvalTextAccepted`: The specific confirmation text the human accepted
   - `confirmationMethod`: e.g., "MANUAL_APPROVAL_DIALOG"
   - `phase`: String identifier (e.g., "3A_PROTOCOL_ONLY")
2. THE event SHALL explicitly prove human approval was required
3. THE event SHALL record before/after diff
4. THE event SHALL NOT claim publish readiness
5. THE event SHALL NOT claim verification
6. THE event SHALL keep `auditInvalidated` true
7. THE event SHALL keep `reAuditRequired` true

### Requirement 3: DraftSnapshot Interface

**User Story:** As an operator, I want content snapshots before applying fixes, so that I can safely rollback changes if needed.

#### Acceptance Criteria

1. THE `DraftSnapshot` interface SHALL include:
   - `snapshotId`: Unique identifier
   - `articleId`: Reference to the article
   - `packageId`: Reference to the package
   - `affectedLanguage`: Scoped language
   - `affectedField`: Scoped field
   - `beforeValue`: The raw content before change
   - `createdAt`: Timestamp
   - `reason`: Explanation (e.g., "PRE_REMEDIATION_APPLY")
   - `linkedSuggestionId`: Reference to the suggestion being applied
2. Snapshot SHALL exist before apply in future phases
3. Snapshots SHALL be language-and-field scoped for surgical rollbacks
4. Snapshots SHALL NOT mutate the vault or article draft themselves
5. Snapshots SHALL support rollback planning

### Requirement 4: RemediationApplyResult Type

**User Story:** As a developer, I want a comprehensive result type for apply attempts, so that the UI can explain exactly why an apply was blocked.

#### Acceptance Criteria

1. THE `RemediationApplyResult` type SHALL include states for:
   - `APPROVED_FOR_DRAFT_CHANGE`
   - `BLOCKED_HUMAN_ONLY`
   - `BLOCKED_FORBIDDEN_TO_AUTOFIX`
   - `BLOCKED_MISSING_SUGGESTED_TEXT`
   - `BLOCKED_SOURCE_REVIEW`
   - `BLOCKED_PROVENANCE_REVIEW`
   - `BLOCKED_PARITY_REVIEW`
   - `BLOCKED_FACT_SENSITIVE`
   - `BLOCKED_NUMERIC_OR_ENTITY_RISK`
   - `BLOCKED_REQUIRES_REAUDIT`
   - `ERROR_INVALID_INPUT`
2. Result states SHALL NOT indicate publish ready
3. Any state allowing a change MUST require `reAuditRequired: true`
4. Blocked states MUST explain why apply is not allowed

### Requirement 5: AuditInvalidationReason Enum

**User Story:** As a governance system, I want to track why an audit became invalid, so that I can enforce re-auditing before deployment.

#### Acceptance Criteria

1. THE `AuditInvalidationReason` enum SHALL include:
   - `DRAFT_TEXT_CHANGED`
   - `LANGUAGE_NODE_CHANGED`
   - `REMEDIATION_APPLIED`
   - `ROLLBACK_PERFORMED`
   - `PARITY_RISK_CREATED`
   - `AUDIT_CONTEXT_STALE`
2. ANY future successful application MUST invalidate audit
3. ANY future rollback MUST still require re-audit
4. DEPLOY GATES SHALL remain locked after invalidation until a new audit passes

### Requirement 6: RollbackEvent Interface

**User Story:** As an auditor, I want a record of rollbacks, so that the content history is complete and transparent.

#### Acceptance Criteria

1. THE `RollbackEvent` interface SHALL include:
   - `rollbackId`: Unique identifier
   - `linkedApplyEventId`: Reference to the apply event being reverted
   - `linkedSnapshotId`: Reference to the snapshot being restored
   - `articleId`: Reference to the article
   - `packageId`: Reference to the package
   - `affectedLanguage`: Scoped language
   - `affectedField`: Scoped field
   - `restoredText`: The content after rollback
   - `auditInvalidated`: BOOLEAN (MUST be true)
   - `reAuditRequired`: BOOLEAN (MUST be true)
   - `createdAt`: Timestamp
2. Rollback SHALL NOT automatically restore publish readiness
3. Rollback MUST require re-audit
4. Rollback MUST link back to original apply event and snapshot

### Requirement 7: Eligibility Rules (Pure Helpers)

**User Story:** As a developer, I want pure logic to determine eligibility, so that safety rules are centralized and easily testable.

#### Acceptance Criteria

1. THE protocol SHALL provide pure helpers (e.g., constants or functions for category eligibility)
2. ELIGIBLE categories (Future): RESIDUE_REMOVAL, FORMAT_REPAIR, FOOTER_REPAIR, LENGTH_ADJUSTMENT (only when deterministic), DETERMINISTIC_LANGUAGE_NEUTRALIZATION (only when safe)
3. BLOCKED categories: SOURCE_REVIEW, PROVENANCE_REVIEW, PARITY_REVIEW, HUMAN_REVIEW_REQUIRED, FORBIDDEN_TO_AUTOFIX
4. ANY suggestion with `suggestedText === null` SHALL be BLOCKED
5. ANY fact/source/provenance/number/entity sensitive suggestion SHALL be BLOCKED
6. Ineligible categories MUST return a blocked result
7. Helpers SHALL NOT perform any state mutation or side effects

### Requirement 8: Human Approval Constants

**User Story:** As a compliance officer, I want standardized confirmation text, so that operators acknowledge the risks of applying suggestions.

#### Acceptance Criteria

1. THE system SHALL define required human approval text constants:
   - "I understand this changes the draft and requires re-audit."
   - "I have reviewed the before/after diff."
   - "I understand this does not unlock Deploy."
2. Future Apply MUST require these confirmations
3. Constants SHALL NOT imply auto-fix
4. Constants SHALL NOT imply publish readiness

### Requirement 9: Forbidden Wording Guards

**User Story:** As a compliance officer, I want to prevent misleading terminology in the protocol, so that safety guarantees are not diluted.

#### Acceptance Criteria

1. THE protocol SHALL NOT use:
   - `Auto-fix`, `Fix & Publish`, `Resolve Gate`, `Make Ready`, `Verified Fix`, `Safe to Deploy`, `Source Added`, `Provenance Verified`, `Publish Ready`
2. Verification script SHALL check that forbidden wording is not used in approval or apply labels
3. Apply protocol SHALL use safe wording only

### Requirement 10: Verification Script Requirements

**User Story:** As a developer, I want a strict verification script for the apply protocol, so that I can guarantee the foundation is sound.

#### Acceptance Criteria

1. THE system SHALL provide requirements for `scripts/verify-remediation-apply-protocol.ts`
2. THE script SHALL verify the eligible category matrix (blocked vs eligible)
3. THE script SHALL verify that SOURCE_REVIEW is blocked
4. THE script SHALL verify that PROVENANCE_REVIEW is blocked
5. THE script SHALL verify that PARITY_REVIEW is blocked
6. THE script SHALL verify that `suggestedText` null is blocked
7. THE script SHALL verify `auditInvalidated: true` for apply events
8. THE script SHALL verify `reAuditRequired: true` for apply and rollback events
9. THE script SHALL verify that rollback does not restore publish readiness
10. THE script SHALL verify that forbidden wording is absent
11. THE script SHALL verify no mutation, network, or publish behavior
12. THE script SHALL print `CONTROLLED_REMEDIATION_APPLY_PROTOCOL_VERIFICATION_PASS` on success

### Requirement 11: Regression Safety

**User Story:** As a developer, I want to ensure Phase 3A does not break existing features, so that system stability is maintained.

#### Acceptance Criteria

1. `npm run type-check` SHALL pass
2. `npx tsx scripts/verify-remediation-engine.ts` (Phase 1) SHALL pass
3. `npx tsx scripts/verify-remediation-generator.ts` (Phase 2A) SHALL pass
4. `npx tsx scripts/verify-remediation-apply-protocol.ts` (Phase 3A) SHALL pass
5. `npx tsx scripts/verify-global-audit.ts` SHALL pass
6. `npx tsx scripts/verify-panda-intake.ts` SHALL pass

### Requirement 12: Out-of-Scope Protections (Fail-Closed)

**User Story:** As a security engineer, I want explicit boundaries for Phase 3A, so that no mutation logic or UI is accidentally introduced.

#### Acceptance Criteria

1. THE implementation SHALL NOT create `RemediationConfirmModal`
2. THE implementation SHALL NOT add an "Apply" button to the UI
3. THE implementation SHALL NOT implement the actual draft or vault mutation logic
4. THE implementation SHALL NOT implement the actual Apply to Draft runtime behavior
5. THE implementation SHALL NOT create API routes or database writes
6. THE implementation SHALL NOT implement rollback runtime
7. THE implementation SHALL NOT mutate audit state
8. THE implementation SHALL NOT change any UI
9. THE implementation SHALL NOT change any deploy gate
10. THE implementation SHALL NOT modify publish or save routes
11. THE implementation SHALL NOT implement auto-apply, auto-publish, or auto-commit/push/deploy

## Out of Scope

- ❌ RemediationConfirmModal (deferred to Phase 3B)
- ❌ Apply button in Warroom (deferred to Phase 3B)
- ❌ Runtime draft mutation (deferred to Phase 3B)
- ❌ Vault mutation logic (deferred to Phase 3B)
- ❌ API routes for apply events (deferred to Phase 3C)
- ❌ Database persistence of events/snapshots (deferred to Phase 3C)
- ❌ Rollback runtime implementation (deferred to Phase 3D)
- ❌ UI history panel (deferred to Phase 4)

## Success Criteria

- ✅ `lib/editorial/remediation-apply-types.ts` exists with defined protocol
- ✅ `scripts/verify-remediation-apply-protocol.ts` exists and passes
- ✅ `npm run type-check` passes
- ✅ All previous phase verification scripts pass
- ✅ No UI components created
- ✅ No mutation logic implemented
- ✅ Git status shows exactly 2 new files
- ✅ No source/provenance/E-E-A-T/factual/numeric fabrication

## Safety Reminders

1. **Protocol Only**: Do not implement behavior.
2. **Fail-Closed**: Always require re-audit after any potential change.
3. **No Fabrication**: Protocol must never handle fabricated content.
4. **Human in the Loop**: Events must prove explicit human approval.
5. **Traceability**: Every change must be linked to a snapshot and a suggestion.
