# DESIGN DOCUMENT — CONTROLLED REMEDIATION PHASE 3A: APPLY PROTOCOL TYPES

**Role**: Senior TypeScript Protocol Architect, Editorial Governance Engineer, Fail-Closed Remediation Safety Reviewer.
**Status**: DRAFT (Review Required)
**Approved Requirements**: [requirements.md](file:///C:/SIAIntel/.kiro/specs/controlled-remediation-phase-3a/requirements.md)

---

## 1. Overview
Controlled Remediation Phase 3A establishes the type-safe protocol and data structures for human-approved remediation apply events. This phase is **protocol and types only**. It defines the safety contract and audit trail requirements for future phases that will allow eligible suggestions to be applied to article drafts. 

Phase 3A does not implement UI, runtime mutations, or API persistence. It provides the "fail-closed" architectural foundation ensuring that any content change through remediation is traceable, approved, and requires re-auditing.

---

## 2. Architecture

### 2.1 Component Boundaries
- **Protocol Module**: `lib/editorial/remediation-apply-types.ts` will contain all interface, enum, and constant definitions.
- **Verification Harness**: `scripts/verify-remediation-apply-protocol.ts` will validate the safety invariants of the protocol.

### 2.2 System Constraints
- **Pure Logic**: All helper functions must be pure and deterministic.
- **No Side Effects**: No network calls, filesystem writes, or global state mutations.
- **No UI Integration**: No changes to Warroom pages or preview components.
- **No Mutation**: Draft and Vault state remain read-only in this phase.

---

## 3. Core Type Model

The protocol revolves around five primary data structures:
1. **AppliedRemediationEvent**: The record of a successful (future) apply operation.
2. **DraftSnapshot**: The state of content immediately before a change.
3. **RemediationApplyResult**: The result/status of an apply attempt.
4. **AuditInvalidationReason**: Why a previous audit is no longer valid.
5. **RollbackEvent**: The record of reverting a draft change.

---

## 4. AppliedRemediationEvent Design

This interface represents the "ledger entry" for a content modification.

```typescript
export interface AppliedRemediationEvent {
  eventId: string;
  suggestionId: string;
  articleId: string;
  packageId?: string;
  operatorId: string; // e.g., "unknown_operator" if not authenticated
  category: RemediationCategory;
  affectedLanguage: string;
  affectedField: string;
  originalText: string;
  appliedText: string;
  diff: string; // Summary of change
  auditInvalidated: true; // Hard-coded safety invariant
  reAuditRequired: true; // Hard-coded safety invariant
  createdAt: string; // ISO 8601
  approvalTextAccepted: string;
  confirmationMethod: "MANUAL_APPROVAL_DIALOG" | "SYSTEM_RECOVERY";
  phase: "3A_PROTOCOL_ONLY";
}
```

**Key Principles**:
- **Never Publish-Ready**: The event explicitly marks the audit as invalidated.
- **Human Provenance**: It records the specific approval text the operator accepted.
- **Traceability**: Links directly back to the `suggestionId` and `articleId`.

---

## 5. DraftSnapshot Design

Snapshots provide the foundation for surgical rollbacks.

```typescript
export interface DraftSnapshot {
  snapshotId: string;
  articleId: string;
  packageId?: string;
  affectedLanguage: string;
  affectedField: string;
  beforeValue: string;
  createdAt: string;
  reason: "PRE_REMEDIATION_APPLY" | "MANUAL_CHECKPOINT";
  linkedSuggestionId?: string;
}
```

**Key Principles**:
- **Scoped**: Only captures the field and language being modified.
- **Immutability**: Once created, the snapshot represents a "point in time" and is never modified.

---

## 6. RemediationApplyResult Design

Defines the possible outcomes of trying to apply a suggestion.

```typescript
export type RemediationApplyStatus =
  | 'APPROVED_FOR_DRAFT_CHANGE'
  | 'BLOCKED_HUMAN_ONLY'
  | 'BLOCKED_FORBIDDEN_TO_AUTOFIX'
  | 'BLOCKED_MISSING_SUGGESTED_TEXT'
  | 'BLOCKED_SOURCE_REVIEW'
  | 'BLOCKED_PROVENANCE_REVIEW'
  | 'BLOCKED_PARITY_REVIEW'
  | 'BLOCKED_FACT_SENSITIVE'
  | 'BLOCKED_NUMERIC_OR_ENTITY_RISK'
  | 'BLOCKED_REQUIRES_REAUDIT'
  | 'ERROR_INVALID_INPUT';

export interface RemediationApplyResult {
  status: RemediationApplyStatus;
  message: string;
  reAuditRequired: boolean; // true if status is APPROVED_FOR_DRAFT_CHANGE
  canRetry: boolean;
}
```

---

## 7. AuditInvalidationReason Design

Enforces re-auditing by categorizing the cause of stale state.

```typescript
export enum AuditInvalidationReason {
  DRAFT_TEXT_CHANGED = 'DRAFT_TEXT_CHANGED',
  LANGUAGE_NODE_CHANGED = 'LANGUAGE_NODE_CHANGED',
  REMEDIATION_APPLIED = 'REMEDIATION_APPLIED',
  ROLLBACK_PERFORMED = 'ROLLBACK_PERFORMED',
  PARITY_RISK_CREATED = 'PARITY_RISK_CREATED',
  AUDIT_CONTEXT_STALE = 'AUDIT_CONTEXT_STALE'
}
```

---

## 8. RollbackEvent Design

```typescript
export interface RollbackEvent {
  rollbackId: string;
  linkedApplyEventId: string;
  linkedSnapshotId: string;
  articleId: string;
  packageId?: string;
  affectedLanguage: string;
  affectedField: string;
  restoredText: string;
  auditInvalidated: true;
  reAuditRequired: true;
  createdAt: string;
}
```

---

## 9. Eligibility Rules Design

Pure functions to determine if a suggestion can transition from "Preview" to "Applied".

- `isApplyEligibleSuggestion(suggestion: RemediationSuggestion): boolean`
- `getApplyBlockReason(suggestion: RemediationSuggestion): RemediationApplyStatus | null`
- `assertApplyProtocolSafe(suggestion: RemediationSuggestion): void`

**Eligibility Matrix**:
| Category | Eligibility | Reason |
| :--- | :--- | :--- |
| `RESIDUE_REMOVAL` | ELIGIBLE | Future-safe formatting/cleanup |
| `FORMAT_REPAIR` | ELIGIBLE | Low risk syntax fix |
| `FOOTER_REPAIR` | ELIGIBLE | Repetitive structural fix |
| `SOURCE_REVIEW` | **BLOCKED** | No system fabrication of sources |
| `PROVENANCE_REVIEW` | **BLOCKED** | No system fabrication of provenance |
| `PARITY_REVIEW` | **BLOCKED** | Human truth-source required |
| `HUMAN_REVIEW_REQUIRED` | **BLOCKED** | Categorically unsafe for auto-apply |
| `suggestedText === null` | **BLOCKED** | Nothing to apply |

---

## 10. Human Approval Constants

Standardized strings for future UI confirmation dialogs.

```typescript
export const HUMAN_APPROVAL_TEXTS = {
  CHANGE_WARNING: "I understand this changes the draft and requires re-audit.",
  DIFF_CONFIRMATION: "I have reviewed the before/after diff.",
  DEPLOY_LOCK_AWARENESS: "I understand this does not unlock Deploy."
};
```

---

## 11. Forbidden Wording Design

The protocol and future UI must strictly avoid language that implies automated resolution or safety.

**Forbidden**:
- `Auto-fix`, `Fix & Publish`, `Resolve Gate`, `Make Ready`, `Verified Fix`, `Safe to Deploy`, `Source Added`, `Provenance Verified`, `Publish Ready`.

---

## 12. Verification Script Design

`scripts/verify-remediation-apply-protocol.ts` will execute the following test suite:
- **Test 1**: Verify eligibility matrix (ensure BLOCKED categories return correct status).
- **Test 2**: Verify `suggestedText: null` is blocked.
- **Test 3**: Verify `AppliedRemediationEvent` hard-coded safety flags (`auditInvalidated: true`).
- **Test 4**: Verify `RollbackEvent` hard-coded safety flags (`reAuditRequired: true`).
- **Test 5**: Verify forbidden wording absence in labels and constants.
- **Test 6**: Confirm no network/disk side effects during type utility execution.

**Marker**: `CONTROLLED_REMEDIATION_APPLY_PROTOCOL_VERIFICATION_PASS`

---

## 13. Error Handling
- Invalid inputs will result in `ERROR_INVALID_INPUT` result objects rather than runtime exceptions.
- `assertApplyProtocolSafe` is the only helper that throws, intended for developer-time safety checks.

---

## 14. File Boundaries

**Files to create**:
- `lib/editorial/remediation-apply-types.ts`
- `scripts/verify-remediation-apply-protocol.ts`

**Files to protect**:
- All UI files (`page.tsx`, components).
- All API routes.
- All core audit engines and validators.

---

## 15. Testing Strategy

All existing and new tests must pass:
1. `npm run type-check`
2. `npx tsx scripts/verify-remediation-engine.ts` (Phase 1)
3. `npx tsx scripts/verify-remediation-generator.ts` (Phase 2A)
4. `npx tsx scripts/verify-remediation-apply-protocol.ts` (Phase 3A)
5. `npx tsx scripts/verify-global-audit.ts`
6. `npx tsx scripts/verify-panda-intake.ts`

---

## 16. Security and Governance
- **Fail-Closed by Design**: The protocol forces a `reAuditRequired` state on every modification.
- **Manual Only**: Every `AppliedRemediationEvent` requires an `operatorId` and `approvalTextAccepted`.
- **Refusal Foundation**: High-risk categories remain mathematically blocked at the protocol level.

---

## 17. Future Phases
- **Phase 3B**: Confirmation modal UI implementation.
- **Phase 3C**: Local draft apply (in-memory state update).
- **Phase 3D**: Audit invalidation enforcement logic in Warroom.
- **Phase 3E**: Ledger persistence for applied events.
