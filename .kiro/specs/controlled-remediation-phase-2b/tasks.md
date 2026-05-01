# TASKS — CONTROLLED REMEDIATION PHASE 2B: SUGGESTED FIXES PREVIEW

**Role**: Senior Next.js Implementation Planner, TypeScript UI Reviewer, Repo Hygiene Auditor, Fail-Closed Remediation Safety Validator, Accessibility Reviewer.
**Status**: REVISED (Ready for Re-Review)
**Approved Specs**:
- [requirements.md](file:///C:/SIAIntel/.kiro/specs/controlled-remediation-phase-2b/requirements.md)
- [design.md](file:///C:/SIAIntel/.kiro/specs/controlled-remediation-phase-2b/design.md)

**Revision History**:
- Initial Draft: 14 tasks
- Revised: Added 3 new tasks (3.5, 5.5, 5.6), expanded 4 existing tasks (5, 10, 11, 12) to address review gaps

---

## Phase 2B Implementation Tasks

### Task 1 — Create RemediationPreviewPanel Component Shell
- [ ] Create `app/admin/warroom/components/RemediationPreviewPanel.tsx`
- [ ] Define the `RemediationPreviewPanelProps` interface:
  - `globalAudit?: unknown`
  - `auditResult?: unknown`
  - `pandaValidationErrors?: unknown[]`
  - `deployLockReasons?: unknown[]`
  - `articleId?: string`
  - `packageId?: string`
  - `className?: string`
- [ ] Import `generateRemediationPlan` from `lib/editorial/remediation-engine`
- [ ] Import necessary types from `lib/editorial/remediation-types`
- [ ] Requirements: Requirement 1, Requirement 14
- [ ] Success Criteria: File exists, compiles, and export is present.

### Task 2 — Implement Derived Remediation Plan Logic
- [ ] Implement `useMemo` to compute `remediationPlan` inside the component.
- [ ] Ensure dependencies are correctly set: `globalAudit`, `auditResult`, `pandaValidationErrors`, `deployLockReasons`, `articleId`, `packageId`.
- [ ] Verify NO side effects (no `useEffect` for data fetching).
- [ ] Verify NO persistence (no `localStorage`, no database calls).
- [ ] Requirements: Requirement 3, Requirement 9
- [ ] Success Criteria: Plan recomputes correctly when props change; no external mutations occur.

### Task 3 — Build Panel Shell and Warning Banner
- [ ] Implement the outer container using the `CyberBox` or equivalent card styling.
- [ ] Add Header: "Suggested Fixes Preview".
- [ ] Add Badge: "READ-ONLY / PREVIEW".
- [ ] Implement the **Mandatory Warning Banner** with all 4 required messages:
  - "Preview only — not applied."
  - "Suggestions do not unlock Deploy."
  - "Human review required before any draft change."
  - "Re-run audit after any manual change."
- [ ] Ensure warning banner uses alert/warning styling (yellow/orange background or border).
- [ ] Ensure warning banner is non-dismissible and remains visible.
- [ ] Requirements: Requirement 2, Requirement 4
- [ ] Success Criteria: Panel is visually distinct and all 4 warnings are prominent and visible.

### Task 3.5 — Implement Default Compact/Collapsed State
- [ ] Detect if right panel is crowded (e.g., >3 sections visible or limited vertical space).
- [ ] Default panel to collapsed or compact summary state if crowded.
- [ ] Show summary statistics only in collapsed state (total, critical, human-only counts).
- [ ] Provide expand/collapse toggle for full panel view.
- [ ] If suggestion count >10, default to showing top N suggestions with "Show More" option.
- [ ] Ensure no new scroll-fix work unless separately approved.
- [ ] Requirements: Requirement 2.5, Requirement 8.9-10
- [ ] Success Criteria: Panel doesn't overwhelm crowded sidebar; compact state is functional.

### Task 4 — Implement Summary Section
- [ ] Render summary statistics from `remediationPlan`:
  - Total suggestions count.
  - Critical severity count.
  - Human-only count.
  - Requires-approval count.
- [ ] Implement zero-state: Display "No suggestions available" when the list is empty.
- [ ] Requirements: Requirement 1, Requirement 8
- [ ] Success Criteria: Summary reflects the actual plan data; zero-state works.

### Task 5 — Implement Suggestion Card Rendering
- [ ] Map through `remediationPlan.suggestions` and render individual cards.
- [ ] Display metadata for each suggestion:
  - Category/Fix Type badge (e.g., RESIDUE_REMOVAL, FORMAT_REPAIR).
  - Severity badge (color-coded: red for CRITICAL, yellow for WARNING, etc.).
  - Safety Level badge (e.g., SAFE_FORMAT_ONLY, REQUIRES_HUMAN_APPROVAL, HUMAN_ONLY, FORBIDDEN_TO_AUTOFIX).
  - Affected Language (if present).
  - Affected Field (if present).
- [ ] Display content:
  - Issue description.
  - Rationale explaining why this remediation is suggested.
  - `suggestedText` in a read-only block (ONLY if not null).
  - "Human review required" message when `suggestedText` is null.
- [ ] Display footer on EACH card: "Does not unlock Deploy."
- [ ] Ensure cards are visually distinct (border, shadow, spacing).
- [ ] Ensure NO Apply button on any card.
- [ ] Ensure NO Copy button on any card (deferred to Phase 3).
- [ ] Requirements: Requirement 6 (all 15 acceptance criteria)
- [ ] Success Criteria: All metadata, content, and footer are visible and read-only; no mutation buttons exist.

### Task 5.5 — Implement Accessibility Features
- [ ] Use semantic HTML elements:
  - `<section>` for panel container.
  - `<article>` for individual suggestion cards.
  - `<header>` for panel and card headers.
  - `<footer>` for panel and card footers.
- [ ] Add ARIA labels for screen readers:
  - `aria-label="Suggested Fixes Preview Panel"` on panel container.
  - `aria-expanded` on expand/collapse toggles (if implemented).
  - `aria-describedby` linking warnings to panel content.
- [ ] Implement keyboard navigation:
  - Expand/collapse toggles must be triggerable via Enter/Space keys.
  - Tab navigation through interactive elements.
- [ ] Verify color contrast:
  - Badge text must have sufficient contrast against background.
  - Warning banner text must be readable.
  - Badge meaning must not rely on color alone (include text labels).
- [ ] Use readable font sizes (minimum `text-xs` for metadata, larger for main content).
- [ ] Add visible focus indicators for interactive elements.
- [ ] Requirements: Requirement 15 (all 10 acceptance criteria)
- [ ] Success Criteria: Panel passes accessibility audit tools; keyboard navigation works; screen readers can navigate content.

### Task 5.6 — Implement Collapsible/Expandable Card Behavior
- [ ] Add local UI-only state for expand/collapse:
  - `isPanelExpanded: boolean` (for entire panel).
  - `expandedSuggestions: Record<string, boolean>` (for individual cards).
- [ ] Implement compact collapsed view when suggestion count >10:
  - Show summary statistics only.
  - Show top N suggestions (e.g., top 5 critical).
  - Provide "Show All" or "Expand" button.
- [ ] Allow expanding individual suggestion cards for full details.
- [ ] Ensure NO persisted state (no localStorage, no database).
- [ ] Ensure expand/collapse state is UI-only and resets on page reload.
- [ ] Requirements: Requirement 8.10-11, Requirement 2.5
- [ ] Success Criteria: Long suggestion lists are manageable; operator can expand for details; no state persistence.

### Task 6 — Implement Human-Only Category Handling
- [ ] Add conditional rendering logic for `SOURCE_REVIEW`, `PROVENANCE_REVIEW`, and `PARITY_REVIEW`.
- [ ] Display specific messages when `suggestedText` is null:
  - `SOURCE_REVIEW`: "Evidence required — human must verify and add source attribution."
  - `PROVENANCE_REVIEW`: "Provenance required — human must verify provenance data."
  - `PARITY_REVIEW`: "Human truth-source required — numeric/entity verification needed."
- [ ] Ensure NO empty suggested text boxes are rendered for these types.
- [ ] Requirements: Requirement 7
- [ ] Success Criteria: Human-only suggestions show clear, specific guidance instead of code blocks.

### Task 7 — Forbidden Wording Guard
- [ ] Audit the UI text to ensure NO forbidden words are used:
  - Forbidden: `Fixed`, `Corrected`, `Applied`, `Auto-applied`, `Ready for Publish`, `SIA Protocol Satisfied`, `Verified Fix`, `Safe to Deploy`, `Source Added`, `Provenance Verified`.
- [ ] Use only allowed wording: `Suggested`, `Preview`, `Advisory`, `Proposed`, `Potential`, `Human review required`.
- [ ] Requirements: Requirement 5
- [ ] Success Criteria: Code search confirms absence of forbidden strings in the new component.

### Task 8 — Side-Effect and Interaction Audit
- [ ] Confirm the component contains NO:
  - `fetch` or API calls.
  - Vault or article setters.
  - Save/Publish/Deploy calls.
  - Clipboard/Copy buttons.
- [ ] Requirements: Requirement 9, Requirement 10
- [ ] Success Criteria: Manual code review confirms zero mutation surface.

### Task 9 — Integrate into Warroom Page
- [ ] Modify `app/admin/warroom/page.tsx`.
- [ ] Add exactly ONE import for `RemediationPreviewPanel`.
- [ ] Insert the component in the right panel sidebar (e.g., below `Global Health Board`).
- [ ] Pass the required props from the page state (`globalAudit`, `isDeployBlocked` reasons, etc.).
- [ ] Requirements: Requirement 2, Requirement 13
- [ ] Success Criteria: Panel appears in the UI without breaking existing layout or logic.

### Task 10 — Gate Preservation Verification
- [ ] Verify that `isDeployBlocked` logic in `page.tsx` remains UNCHANGED.
- [ ] Verify that deploy lock reasons remain UNCHANGED.
- [ ] Verify that `globalAudit` scoring logic remains UNCHANGED.
- [ ] Verify that active language audit requirements remain UNCHANGED.
- [ ] Verify that `transformedArticle` requirements remain UNCHANGED.
- [ ] Verify that Deploy button behavior remains UNCHANGED.
- [ ] Verify that Deploy button styling remains UNCHANGED.
- [ ] Verify that Publish button behavior remains UNCHANGED.
- [ ] Verify that deploy remains fail-closed (suggestions do NOT unlock gates).
- [ ] Verify that no audit or validation checks are bypassed.
- [ ] Requirements: Requirement 10 (all 12 acceptance criteria)
- [ ] Success Criteria: All gates remain fail-closed; Deploy remains locked when appropriate; no unlock behavior introduced.

---

## Validation and Reporting

### Task 11 — Execute Automated Validation
- [ ] Run `npm run type-check`.
- [ ] Run `npx tsx scripts/verify-remediation-engine.ts`.
- [ ] Run `npx tsx scripts/verify-remediation-generator.ts`.
- [ ] Run `npx tsx scripts/verify-global-audit.ts`.
- [ ] Run `npx tsx scripts/verify-panda-intake.ts`.
- [ ] Run `git status --short`.
- [ ] Run `git diff --name-only`.
- [ ] Run `git diff --stat`.
- [ ] Requirements: Requirement 11.1-5
- [ ] Success Criteria: All commands pass with 0 errors; git shows only 2 files changed.

### Task 12 — Manual UI Smoke Test
- [ ] Open Warroom in browser.
- [ ] Import a Panda package with known audit failures.
- [ ] Run Global Audit to generate audit data.
- [ ] Confirm Suggested Fixes Preview panel appears in right sidebar.
- [ ] Confirm panel header displays "Suggested Fixes Preview" or equivalent.
- [ ] Confirm warning banner is visible with all 4 required messages:
  - [ ] "Preview only — not applied."
  - [ ] "Suggestions do not unlock Deploy."
  - [ ] "Human review required before any draft change."
  - [ ] "Re-run audit after any manual change."
- [ ] Confirm NO "Apply" button exists anywhere in the panel.
- [ ] Confirm NO "Fix" button exists anywhere in the panel.
- [ ] Confirm NO Save behavior change (Save button still works as before).
- [ ] Confirm NO Publish behavior change (Publish button still works as before).
- [ ] Confirm Deploy state remains unchanged (locked if gates fail, ready if gates pass).
- [ ] Confirm suggestions match the audit failures from Global Audit.
- [ ] Confirm human-only suggestions (SOURCE_REVIEW, PROVENANCE_REVIEW, PARITY_REVIEW) show correct messages:
  - [ ] SOURCE_REVIEW: "Evidence required — human must verify and add source attribution."
  - [ ] PROVENANCE_REVIEW: "Provenance required — human must verify provenance data."
  - [ ] PARITY_REVIEW: "Human truth-source required — numeric/entity verification needed."
- [ ] Test zero-state: Clear audit data (or use article with no failures) and confirm "No suggestions available" displays.
- [ ] Test recompute: Modify audit state (e.g., fix an issue manually, re-run audit) and confirm panel updates.
- [ ] Visual forbidden wording check: Manually inspect UI text for absence of:
  - [ ] "Fixed", "Corrected", "Applied", "Auto-applied", "Ready for Publish", "SIA Protocol Satisfied", "Verified Fix", "Safe to Deploy", "Source Added", "Provenance Verified".
- [ ] Confirm each suggestion card displays footer: "Does not unlock Deploy."
- [ ] Requirements: Requirement 11.6-12
- [ ] Success Criteria: Manual inspection confirms advisory-only behavior; all safety checks pass; no forbidden wording present.

### Task 13 — Repository Hygiene Check
- [ ] Run `git status --short`.
- [ ] Confirm only two files are affected:
  - `app/admin/warroom/components/RemediationPreviewPanel.tsx` (New)
  - `app/admin/warroom/page.tsx` (Modified)
- [ ] Ensure no changes to `lib/editorial/*` or documentation.
- [ ] Success Criteria: Git status is clean and scoped.

### Task 14 — Final Implementation Report
- [ ] Summarize the implementation.
- [ ] Confirm adherence to all safety rules.
- [ ] Document test results.
- [ ] FINAL_STATUS: CONTROLLED_REMEDIATION_PHASE2B_IMPLEMENTED.
