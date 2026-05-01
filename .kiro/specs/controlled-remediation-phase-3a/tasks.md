# TASKS — CONTROLLED REMEDIATION PHASE 3A: APPLY PROTOCOL TYPES

**Role**: Senior TypeScript Implementation Planner, Editorial Governance Reviewer, Repo Hygiene Auditor, Fail-Closed Remediation Safety Validator.
**Status**: DRAFT (Review Required)
**Approved Specs**:
- [requirements.md](file:///C:/SIAIntel/.kiro/specs/controlled-remediation-phase-3a/requirements.md)
- [design.md](file:///C:/SIAIntel/.kiro/specs/controlled-remediation-phase-3a/design.md)

---

## Phase 3A Implementation Tasks

### Task 1 — Create Apply Protocol Type Module
- [ ] Create `lib/editorial/remediation-apply-types.ts`
- [ ] Import necessary types from `lib/editorial/remediation-types.ts`
- [ ] Export types, enums, constants, and pure helpers only
- [ ] Confirm: No UI, API, or database imports
- [ ] Confirm: No network or filesystem logic
- [ ] Requirements: Requirement 1
- [ ] Success Criteria: Module exists and is types-only.

### Task 2 — Define Core Enums and Statuses
- [ ] Define `AuditInvalidationReason` enum:
  - `DRAFT_TEXT_CHANGED`, `LANGUAGE_NODE_CHANGED`, `REMEDIATION_APPLIED`, `ROLLBACK_PERFORMED`, `PARITY_RISK_CREATED`, `AUDIT_CONTEXT_STALE`
- [ ] Define `RemediationApplyStatus` union or enum:
  - `APPROVED_FOR_DRAFT_CHANGE`, `BLOCKED_HUMAN_ONLY`, `BLOCKED_FORBIDDEN_TO_AUTOFIX`, `BLOCKED_MISSING_SUGGESTED_TEXT`, `BLOCKED_SOURCE_REVIEW`, `BLOCKED_PROVENANCE_REVIEW`, `BLOCKED_PARITY_REVIEW`, `BLOCKED_FACT_SENSITIVE`, `BLOCKED_NUMERIC_OR_ENTITY_RISK`, `BLOCKED_REQUIRES_REAUDIT`, `ERROR_INVALID_INPUT`
- [ ] Requirements: Requirement 4, Requirement 5
- [ ] Success Criteria: Enums correctly represent all required states.

### Task 3 — Implement AppliedRemediationEvent Interface
- [ ] Define `AppliedRemediationEvent` with all mandatory fields:
  - `eventId`, `suggestionId`, `articleId`, `packageId`, `operatorId`, `category`, `affectedLanguage`, `affectedField`, `originalText`, `appliedText`, `diff`, `createdAt`, `approvalTextAccepted`, `confirmationMethod`, `phase`
- [ ] Hard-code safety flags: `auditInvalidated: true`, `reAuditRequired: true`
- [ ] Requirements: Requirement 2
- [ ] Success Criteria: Interface enforces audit invalidation and human provenance.

### Task 4 — Implement DraftSnapshot Interface
- [ ] Define `DraftSnapshot` interface:
  - `snapshotId`, `articleId`, `packageId`, `affectedLanguage`, `affectedField`, `beforeValue`, `createdAt`, `reason`, `linkedSuggestionId`
- [ ] Requirements: Requirement 3
- [ ] Success Criteria: Snapshot structure allows language/field scoped rollbacks.

### Task 5 — Implement RollbackEvent Interface
- [ ] Define `RollbackEvent` interface:
  - `rollbackId`, `linkedApplyEventId`, `linkedSnapshotId`, `articleId`, `packageId`, `affectedLanguage`, `affectedField`, `restoredText`, `createdAt`
- [ ] Hard-code safety flags: `auditInvalidated: true`, `reAuditRequired: true`
- [ ] Requirements: Requirement 6
- [ ] Success Criteria: Reverting a change still requires re-audit.

### Task 6 — Design RemediationApplyResult Structure
- [ ] Define `RemediationApplyResult` interface:
  - `status: RemediationApplyStatus`, `message: string`, `reAuditRequired: boolean`, `canRetry: boolean`
- [ ] Requirements: Requirement 4
- [ ] Success Criteria: Result shape provides clear explanations for blocked attempts.

### Task 7 — Define Human Approval Constants
- [ ] Define `HUMAN_APPROVAL_TEXTS` constant object:
  - `CHANGE_WARNING`, `DIFF_CONFIRMATION`, `DEPLOY_LOCK_AWARENESS`
- [ ] Requirements: Requirement 8
- [ ] Success Criteria: Wording is advisory and does not imply auto-fix or publish readiness.

### Task 8 — Define Forbidden Wording Guards
- [ ] Define `FORBIDDEN_APPLY_WORDING` list
- [ ] Implement `containsForbiddenApplyWording(text: string): boolean` helper
- [ ] Requirements: Requirement 9
- [ ] Success Criteria: Helper identifies misleading terminology (e.g., "Auto-fix").

### Task 9 — Implement Eligibility Helper Functions
- [ ] Implement `isApplyEligibleSuggestion(suggestion: RemediationSuggestion): boolean`
- [ ] Implement `getApplyBlockReason(suggestion: RemediationSuggestion): RemediationApplyStatus | null`
- [ ] Implement `assertApplyProtocolSafe(suggestion: RemediationSuggestion): void`
- [ ] Apply blocking rules: `SOURCE_REVIEW`, `PROVENANCE_REVIEW`, `PARITY_REVIEW`, `suggestedText: null` are BLOCKED
- [ ] Requirements: Requirement 7
- [ ] Success Criteria: Pure logic correctly identifies safe vs unsafe categories.

### Task 10 — Verification Script Foundation
- [ ] Create `scripts/verify-remediation-apply-protocol.ts`
- [ ] Setup test harness with assertion helpers and pass marker
- [ ] Requirements: Requirement 10
- [ ] Success Criteria: Script exists and runs.

### Task 11 — Implement Verification Test Cases
- [ ] Test eligibility matrix (Blocked categories return correct status)
- [ ] Test `suggestedText: null` block
- [ ] Test hard-coded safety flags in `AppliedRemediationEvent` and `RollbackEvent`
- [ ] Test forbidden wording absence in constants
- [ ] Test regression safety (no mutation/side effects)
- [ ] Requirements: Requirement 10
- [ ] Success Criteria: All tests pass with `CONTROLLED_REMEDIATION_APPLY_PROTOCOL_VERIFICATION_PASS`.

### Task 12 — Regression Validation Commands
- [ ] Run `npm run type-check`
- [ ] Run `npx tsx scripts/verify-remediation-engine.ts`
- [ ] Run `npx tsx scripts/verify-remediation-generator.ts`
- [ ] Run `npx tsx scripts/verify-remediation-apply-protocol.ts`
- [ ] Run `npx tsx scripts/verify-global-audit.ts`
- [ ] Run `npx tsx scripts/verify-panda-intake.ts`
- [ ] Requirements: Requirement 11
- [ ] Success Criteria: All verification commands pass.

### Task 13 — Git Hygiene and Final Report
- [ ] Run `git status --short`
- [ ] Confirm exactly 2 new implementation files
- [ ] Generate final implementation report
- [ ] Success Criteria: Repo is clean and scoped.

---

## Out-of-Scope (Strict Enforcement)
The following are NOT to be implemented in Phase 3A:
- ❌ UI Components (Apply button, Modals, History panels)
- ❌ Draft/Vault mutation logic (no runtime Apply to Draft)
- ❌ API Routes or Database persistence
- ❌ Rollback runtime behavior
- ❌ Deploy gate changes or Publish/Save route modifications
- ❌ Auto-apply, Auto-publish, or Auto-commit behavior
