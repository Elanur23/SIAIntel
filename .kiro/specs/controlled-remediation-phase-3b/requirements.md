# Requirements Document — Controlled Remediation Phase 3B: Confirmation Modal Prototype

## Introduction
Controlled Remediation Phase 3B focuses on the creation of a UI confirmation modal prototype. This modal will allow operators to review eligible remediation suggestions side-by-side with the current draft content. This phase is strictly a UI prototype; no actual draft or vault mutation behavior is to be implemented.

## Glossary
- **RemediationConfirmModal**: The UI component for human review of a suggestion.
- **Eligible_Suggestion**: A suggestion that satisfies the safety rules defined in Phase 3A (e.g., not human-only, not missing suggested text).
- **Side_by_Side_Preview**: A layout displaying original text and suggested text concurrently for comparison.
- **Mandatory_Confirmation**: A set of checkboxes that must be acknowledged before an apply action can be considered.

---

## Requirements

### Requirement 1 — Confirmation Modal Prototype
The system shall provide a `RemediationConfirmModal` prototype for human review.
- THE modal SHALL open only when an operator selects an eligible suggestion for review.
- THE modal SHALL be strictly UI-only.
- THE modal SHALL NOT mutate draft content or vault content.
- THE modal SHALL NOT call API routes or write to the database.
- THE modal SHALL NOT change deploy or audit state.

### Requirement 2 — Eligible Suggestion Review Only
The modal shall only be available for suggestions that pass Phase 3A eligibility checks.
- THE implementation SHALL use Phase 3A eligibility helpers to determine if a suggestion can be reviewed.
- `SOURCE_REVIEW`, `PROVENANCE_REVIEW`, `PARITY_REVIEW`, `HUMAN_ONLY`, and `FORBIDDEN_TO_AUTOFIX` SHALL remain locked and not trigger the modal.
- LOCKED suggestions SHALL continue to display "Human review required" messaging without review/apply controls.

### Requirement 3 — Side-by-Side Diff Preview
The modal shall show a before/after review.
- THE modal SHALL display a "Left side" with current/original draft text (if available) and a "Right side" with `suggestedText` preview.
- IF original text is unavailable, THE modal SHALL display "Original text unavailable — apply disabled."
- IF `suggestedText` is missing, THE modal SHALL display "No automated suggestion available."
- THE modal SHALL NOT fabricate original text, suggested text, sources, or numeric corrections.

### Requirement 4 — Mandatory Human Confirmation
The modal shall include mandatory confirmation language.
- THE modal SHALL include checkboxes for the following acknowledgments:
  - "I understand this changes the draft and requires re-audit."
  - "I have reviewed the before/after diff."
  - "I understand this does not unlock Deploy."
- Checkboxes SHALL be unchecked by default.
- THE prototype Apply button SHALL remain disabled until all confirmations are checked.
- Confirmation state SHALL be local UI state only (no persistence).

### Requirement 5 — Disabled/Mock Apply Control
If an Apply control is shown in Phase 3B, it must be disabled or non-mutating.
- THE button label SHALL be "Apply to Draft — Disabled in Phase 3B" or equivalent.
- THE button SHALL NOT call mutation handlers, APIs, save, or publish functions.
- THE button SHALL NOT change draft/vault state or unlock deploy.
- THE button SHALL visually indicate its prototype/disabled status.

### Requirement 6 — Safe Wording
The modal shall use advisory and prototype-safe wording.
- **Allowed**: `Review Suggestion`, `Suggested Draft Edit`, `Preview Only`, `Human Approval Required`, `Apply to Draft — Disabled in Phase 3B`, `Does not unlock Deploy`, `Re-audit required before publish consideration`.
- **Forbidden**: `Auto-fix`, `Fix Now`, `Correct Automatically`, `Resolve Gate`, `Make Ready`, `Verified Fix`, `Safe to Deploy`, `Source Added`, `Provenance Verified`, `Publish Ready`.

### Requirement 7 — Warning Banner
The modal shall show a visible safety warning.
- THE modal SHALL display a non-dismissible warning stating: "Prototype only — no draft change will be made. This does not unlock Deploy. Future apply will require re-audit. Human approval is required before any draft change."
- THE warning SHALL be visible immediately upon modal opening.

### Requirement 8 — No Mutation / No Side Effects
The modal and preview panel integration must remain side-effect free.
- THE implementation SHALL NOT include `fetch`, API calls, database calls, or setter calls for vault/draft/audit state.
- THE implementation SHALL NOT include `localStorage` persistence.

### Requirement 9 — Accessibility
The modal shall be accessible.
- THE component SHALL use semantic structure (`role="dialog"`, `aria-modal="true"`).
- THE modal SHALL have a clear title and a focusable close button.
- THE modal SHALL support keyboard closure (Esc) if safe.
- THE checkbox and controls SHALL be keyboard accessible.

### Requirement 10 — Integration with RemediationPreviewPanel
The preview panel may add a Review control for eligible suggestions.
- THE "Review" button SHALL open the modal only and NOT apply changes.
- INELIGIBLE suggestions SHALL NOT show Review/Apply controls.
- EXISTING warning banners and footers ("Does not unlock Deploy") SHALL remain unchanged.

### Requirement 11 — Gate Preservation
The implementation must not affect deploy/publish readiness.
- `isDeployBlocked` logic SHALL remain unchanged.
- `globalAudit` scoring and audit requirements SHALL remain unchanged.
- DEPLOY remains fail-closed.

### Requirement 12 — Validation Requirements
Implementation must pass:
- `npm run type-check`
- All verification scripts (`scripts/verify-remediation-engine.ts`, `scripts/verify-remediation-generator.ts`, `scripts/verify-remediation-apply-protocol.ts`, `scripts/verify-global-audit.ts`, `scripts/verify-panda-intake.ts`).

### Requirement 13 — File Boundary Protections
Implementation must avoid modifying:
- Core remediation logic (`remediation-engine.ts`, `remediation-apply-types.ts`, `remediation-types.ts`).
- Audit/Validator logic (`global-governance-audit.ts`, `panda-intake-validator.ts`).
- API routes, publish/save routes, and build artifacts (`sw.js`, `tsconfig.tsbuildinfo`).

### Requirement 14 — Out-of-Scope Protections
Explicitly forbid:
- Real Apply to Draft or draft/vault mutation.
- API route creation or database writing.
- Rollback or audit invalidation runtime.
- Auto-apply/publish/deploy.
- Source/provenance/fact/number fabrication.

---

## Success Criteria
- ✅ `app/admin/warroom/components/RemediationConfirmModal.tsx` exists as a UI-only prototype.
- ✅ `app/admin/warroom/components/RemediationPreviewPanel.tsx` integrated to trigger the modal for eligible items.
- ✅ Modal displays side-by-side preview and mandatory checkboxes.
- ✅ No draft or vault mutation occurs.
- ✅ All regression tests pass.
- ✅ Git status shows only intended UI file changes.
