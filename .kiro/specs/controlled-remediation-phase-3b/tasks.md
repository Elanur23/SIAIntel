# Tasks Document — Controlled Remediation Phase 3B: Confirmation Modal Prototype

## Overview

This document outlines the implementation tasks for Controlled Remediation Phase 3B, which creates a **UI-only confirmation modal prototype** for reviewing eligible remediation suggestions. All tasks maintain strict fail-closed safety constraints with no mutation behavior.

**Phase 3B Scope:** UI prototype only — no real Apply to Draft, no mutations, no side effects.

---

## Implementation Tasks

### Task 1 — Create RemediationConfirmModal Component

- [ ] **1.1** Create `app/admin/warroom/components/RemediationConfirmModal.tsx`
  - [ ] Component must be presentational and UI-only
  - [ ] Define props interface with required fields:
    - [ ] `isOpen: boolean`
    - [ ] `onClose: () => void`
    - [ ] `suggestion: RemediationSuggestion | null`
    - [ ] `originalText?: string | null`
    - [ ] `articleId?: string`
    - [ ] `packageId?: string`
    - [ ] `className?: string`
  - [ ] **CRITICAL:** Do not include `onApply` prop
  - [ ] **CRITICAL:** Do not include mutation callbacks
  - [ ] **CRITICAL:** Do not call API/database/save/publish/deploy
  - [ ] **CRITICAL:** Do not mutate draft/vault/audit state
- [ ] **Requirements:** 1, 2, 8, 13, 14
- [ ] **Success Criteria:** Component exists, compiles, has correct props interface, no mutation capabilities

### Task 2 — Modal Open/Close Behavior

- [ ] **2.1** Implement modal visibility logic
  - [ ] Modal renders only when `isOpen` is `true`
  - [ ] Modal returns `null` when `isOpen` is `false`
- [ ] **2.2** Implement close functionality
  - [ ] Close button calls only `onClose` prop
  - [ ] ESC key handler calls `onClose` (if safe)
  - [ ] Background click calls `onClose`
- [ ] **2.3** Reset local state on close
  - [ ] Checkbox state resets when modal closes
  - [ ] No persistence of confirmation state
  - [ ] No localStorage usage
  - [ ] No background mutation on close
- [ ] **Requirements:** 1, 4, 8
- [ ] **Success Criteria:** Modal opens/closes correctly, state resets, no side effects

### Task 3 — Warning Banner Implementation

- [ ] **3.1** Create non-dismissible warning banner
  - [ ] Display required warning text:
    - [ ] "Prototype only — no draft change will be made."
    - [ ] "This does not unlock Deploy."
    - [ ] "Future apply will require re-audit."
    - [ ] "Human approval is required before any draft change."
  - [ ] Use prominent warning styling (yellow/amber colors)
  - [ ] Include warning icon (ShieldAlert or similar)
- [ ] **3.2** Ensure warning visibility
  - [ ] Warning visible immediately when modal opens
  - [ ] Warning cannot be dismissed or hidden
  - [ ] No success/verification/publish-ready wording
- [ ] **Requirements:** 7
- [ ] **Success Criteria:** Warning banner displays correctly, non-dismissible, contains required text

### Task 4 — Side-by-Side Diff Preview

- [ ] **4.1** Implement diff layout
  - [ ] Left column: original/current text display
  - [ ] Right column: suggested text display
  - [ ] Grid or flex layout for side-by-side presentation
- [ ] **4.2** Handle missing original text
  - [ ] Display "Original text unavailable — apply disabled." when `originalText` is null/undefined
  - [ ] Style as disabled/unavailable state
- [ ] **4.3** Handle missing suggested text
  - [ ] Display "No automated suggestion available." when `suggestion.suggestedText` is null/undefined
  - [ ] Style as unavailable state
- [ ] **4.4** Safety constraints
  - [ ] **CRITICAL:** Do not fabricate original text
  - [ ] **CRITICAL:** Do not fabricate suggested text
  - [ ] **CRITICAL:** Do not fabricate source/provenance/numeric corrections
  - [ ] **CRITICAL:** Do not render fake diff
- [ ] **Requirements:** 3
- [ ] **Success Criteria:** Side-by-side preview displays safely, handles missing data correctly, no fabrication

### Task 5 — Mandatory Confirmation Checklist

- [ ] **5.1** Implement confirmation checkboxes
  - [ ] Checkbox 1: "I understand this changes the draft and requires re-audit."
  - [ ] Checkbox 2: "I have reviewed the before/after diff."
  - [ ] Checkbox 3: "I understand this does not unlock Deploy."
- [ ] **5.2** Checkbox behavior
  - [ ] All checkboxes unchecked by default
  - [ ] Local UI state only (useState)
  - [ ] State resets when modal closes
  - [ ] Checking boxes does not trigger mutation
  - [ ] No persistence of checkbox state
- [ ] **5.3** Checkbox accessibility
  - [ ] Proper labels and keyboard navigation
  - [ ] Clear visual focus indicators
- [ ] **Requirements:** 4, 9
- [ ] **Success Criteria:** Three checkboxes work correctly, reset on close, no persistence, accessible

### Task 6 — Disabled/Mock Apply Control

- [ ] **6.1** Implement disabled apply button
  - [ ] Button label: "Apply to Draft — Disabled in Phase 3B"
  - [ ] Button remains permanently disabled
  - [ ] No onClick handler implementation
- [ ] **6.2** Safety constraints
  - [ ] **CRITICAL:** No console.log simulation
  - [ ] **CRITICAL:** No mutation behavior
  - [ ] **CRITICAL:** No API calls
  - [ ] **CRITICAL:** No save operations
  - [ ] **CRITICAL:** No publish triggers
  - [ ] **CRITICAL:** No deploy unlock
  - [ ] **CRITICAL:** No draft/vault setters
- [ ] **6.3** Visual indication
  - [ ] Visually indicate prototype-only status
  - [ ] Tooltip or help text explaining deferred implementation
  - [ ] Disabled styling (grayed out)
- [ ] **Requirements:** 5, 8, 14
- [ ] **Success Criteria:** Apply button exists, permanently disabled, no mutation capability, clear prototype labeling

### Task 7 — Safe Wording Guard

- [ ] **7.1** Audit all UI text for forbidden terms
  - [ ] **FORBIDDEN:** Auto-fix, Fix Now, Correct Automatically
  - [ ] **FORBIDDEN:** Resolve Gate, Make Ready, Verified Fix
  - [ ] **FORBIDDEN:** Safe to Deploy, Source Added, Provenance Verified
  - [ ] **FORBIDDEN:** Publish Ready, Ready for Publish
- [ ] **7.2** Ensure only allowed wording
  - [ ] **ALLOWED:** Review Suggestion, Suggested Draft Edit, Preview Only
  - [ ] **ALLOWED:** Human Approval Required, Apply to Draft — Disabled in Phase 3B
  - [ ] **ALLOWED:** Does not unlock Deploy, Re-audit required before publish consideration
- [ ] **7.3** Review all button labels, tooltips, and help text
- [ ] **Requirements:** 6
- [ ] **Success Criteria:** No forbidden wording present, only approved terminology used

### Task 8 — Eligibility Integration with Phase 3A Helpers

- [ ] **8.1** Import Phase 3A helpers
  - [ ] Import `isApplyEligibleSuggestion` from `@/lib/editorial/remediation-apply-types`
  - [ ] Import `getApplyBlockReason` from `@/lib/editorial/remediation-apply-types`
  - [ ] Import `RemediationApplyStatus` enum
- [ ] **8.2** Implement eligibility checking
  - [ ] Use `isApplyEligibleSuggestion()` to determine if suggestion can be reviewed
  - [ ] Use `getApplyBlockReason()` to get specific block reason
- [ ] **8.3** Handle locked categories
  - [ ] `SOURCE_REVIEW` locked (no modal access)
  - [ ] `PROVENANCE_REVIEW` locked (no modal access)
  - [ ] `PARITY_REVIEW` locked (no modal access)
  - [ ] `HUMAN_ONLY` safety level locked (no modal access)
  - [ ] `FORBIDDEN_TO_AUTOFIX` safety level locked (no modal access)
  - [ ] `suggestedText` null locked (no modal access)
  - [ ] Fact/source/provenance/number sensitive suggestions locked
- [ ] **8.4** Preserve existing locked messaging
  - [ ] Locked suggestions keep existing "Human review required" messaging
  - [ ] No Review/Apply controls for locked suggestions
- [ ] **Requirements:** 2, 8
- [ ] **Success Criteria:** Eligibility checking works, locked categories properly handled, existing messaging preserved

### Task 9 — RemediationPreviewPanel Integration

- [ ] **9.1** Add modal state management
  - [ ] Add `selectedSuggestion` state (`RemediationSuggestion | null`)
  - [ ] Add `isModalOpen` state (`boolean`)
  - [ ] Add handlers for opening/closing modal
- [ ] **9.2** Add Review button for eligible suggestions
  - [ ] Show "Review Suggestion" button only for eligible suggestions
  - [ ] Use `isApplyEligibleSuggestion()` to determine eligibility
  - [ ] Button opens modal with selected suggestion
- [ ] **9.3** Preserve existing behavior
  - [ ] **CRITICAL:** Do not add Apply button inside cards
  - [ ] **CRITICAL:** Do not add Fix button
  - [ ] **CRITICAL:** Do not add Copy button
  - [ ] Preserve existing warning banners
  - [ ] Preserve existing "Does not unlock Deploy." footer
  - [ ] Preserve zero-state behavior
- [ ] **9.4** Render RemediationConfirmModal
  - [ ] Pass `isOpen={isModalOpen}`
  - [ ] Pass `onClose={handleCloseModal}`
  - [ ] Pass `suggestion={selectedSuggestion}`
  - [ ] Pass `originalText` if safely available
- [ ] **Requirements:** 10
- [ ] **Success Criteria:** Review button appears for eligible suggestions, modal integrates correctly, existing behavior preserved

### Task 10 — Page.tsx Boundary Check

- [ ] **10.1** Assess if page.tsx modification is required
  - [ ] Check if minimal prop wiring is absolutely necessary
  - [ ] If not required, do not modify `app/admin/warroom/page.tsx`
- [ ] **10.2** If modification is required (minimal only)
  - [ ] **CRITICAL:** No deploy logic changes
  - [ ] **CRITICAL:** No audit logic changes
  - [ ] **CRITICAL:** No publish/save behavior changes
  - [ ] **CRITICAL:** No vault/article state management changes
  - [ ] **CRITICAL:** No API calls added
  - [ ] **CRITICAL:** No mutation added
- [ ] **Requirements:** 11, 13, 14
- [ ] **Success Criteria:** Page.tsx modified only if absolutely necessary, no forbidden changes made

### Task 11 — Accessibility Implementation

- [ ] **11.1** Implement semantic dialog structure
  - [ ] Add `role="dialog"` to modal container
  - [ ] Add `aria-modal="true"`
  - [ ] Add `aria-labelledby` pointing to modal title
  - [ ] Add `aria-describedby` for modal description
- [ ] **11.2** Implement keyboard support
  - [ ] ESC key closes modal (if safe)
  - [ ] Focus management on modal open/close
  - [ ] Tab navigation within modal
- [ ] **11.3** Ensure interactive element accessibility
  - [ ] Focusable close button with proper label
  - [ ] Keyboard-accessible checkboxes
  - [ ] Visible focus indicators on all interactive elements
  - [ ] Disabled apply control clearly announced to screen readers
- [ ] **11.4** Visual accessibility
  - [ ] No color-only meaning (use icons + text)
  - [ ] Readable text sizes (minimum 12px)
  - [ ] High contrast colors
- [ ] **Requirements:** 9
- [ ] **Success Criteria:** Modal is fully accessible, keyboard navigable, screen reader friendly

### Task 12 — Side-Effect Audit

- [ ] **12.1** Verify no forbidden side effects in implementation
  - [ ] **FORBIDDEN:** `fetch()` calls
  - [ ] **FORBIDDEN:** API route calls
  - [ ] **FORBIDDEN:** Database calls
  - [ ] **FORBIDDEN:** Save calls
  - [ ] **FORBIDDEN:** Publish calls
  - [ ] **FORBIDDEN:** Deploy calls
  - [ ] **FORBIDDEN:** Vault setters
  - [ ] **FORBIDDEN:** Draft setters
  - [ ] **FORBIDDEN:** Audit state setters
  - [ ] **FORBIDDEN:** `localStorage` usage
  - [ ] **FORBIDDEN:** Clipboard/copy button
  - [ ] **FORBIDDEN:** Mutation callbacks
  - [ ] **FORBIDDEN:** `console.log` apply simulation
- [ ] **12.2** Code review for side effects
  - [ ] Review all event handlers
  - [ ] Review all useEffect hooks
  - [ ] Review all function calls
- [ ] **Requirements:** 8, 14
- [ ] **Success Criteria:** No forbidden side effects present, code is purely presentational

### Task 13 — Gate Preservation Check

- [ ] **13.1** Verify unchanged deploy/audit systems
  - [ ] `isDeployBlocked` logic unchanged
  - [ ] Deploy lock reasons unchanged
  - [ ] `globalAudit` scoring unchanged
  - [ ] Active-language audit requirement unchanged
  - [ ] `transformedArticle` requirement unchanged
  - [ ] Publish/Deploy button behavior unchanged
  - [ ] Deploy remains fail-closed
  - [ ] No audit bypass introduced
- [ ] **13.2** Test deploy state isolation
  - [ ] Modal interaction does not affect deploy status
  - [ ] Modal closing does not trigger audit changes
- [ ] **Requirements:** 11
- [ ] **Success Criteria:** All deploy/audit systems remain unchanged, modal operates in isolation

### Task 14 — Automated Validation

- [ ] **14.1** Run type checking
  - [ ] Execute: `npm run type-check`
  - [ ] Verify no TypeScript errors
- [ ] **14.2** Run remediation system verification
  - [ ] Execute: `npx tsx scripts/verify-remediation-engine.ts`
  - [ ] Execute: `npx tsx scripts/verify-remediation-generator.ts`
  - [ ] Execute: `npx tsx scripts/verify-remediation-apply-protocol.ts`
- [ ] **14.3** Run audit system verification
  - [ ] Execute: `npx tsx scripts/verify-global-audit.ts`
  - [ ] Execute: `npx tsx scripts/verify-panda-intake.ts`
- [ ] **14.4** Verify all scripts pass
  - [ ] No errors in any verification script
  - [ ] All safety invariants maintained
- [ ] **Requirements:** 12
- [ ] **Success Criteria:** All validation commands pass without errors

### Task 15 — Manual Smoke Testing Instructions

- [ ] **15.1** Warroom access and setup
  - [ ] Open Warroom admin interface
  - [ ] Import Panda package for testing
  - [ ] Run Global Audit to generate suggestions
- [ ] **15.2** Preview panel verification
  - [ ] Confirm Suggested Fixes Preview appears
  - [ ] Confirm eligible suggestions show "Review Suggestion" button
  - [ ] Confirm locked suggestions do not show Review/Apply controls
  - [ ] Verify locked suggestions show appropriate messaging
- [ ] **15.3** Modal functionality testing
  - [ ] Click "Review Suggestion" on eligible suggestion
  - [ ] Confirm modal opens correctly
  - [ ] Confirm warning banner is visible and non-dismissible
  - [ ] Confirm side-by-side preview displays correctly
  - [ ] Test all three confirmation checkboxes
  - [ ] Confirm Apply control is disabled/non-mutating
- [ ] **15.4** Safety verification
  - [ ] Confirm no real Apply to Draft occurs
  - [ ] Confirm Deploy state remains unchanged
  - [ ] Confirm no forbidden wording appears
  - [ ] Confirm modal closes safely (ESC, close button, background click)
- [ ] **15.5** Accessibility testing
  - [ ] Test keyboard navigation
  - [ ] Test screen reader compatibility
  - [ ] Verify focus management
- [ ] **Requirements:** All
- [ ] **Success Criteria:** All manual tests pass, modal functions as designed, no mutations occur

### Task 16 — Git Hygiene Verification

- [ ] **16.1** Check git status
  - [ ] Execute: `git status --short`
  - [ ] Execute: `git diff --name-only`
  - [ ] Execute: `git diff --stat`
- [ ] **16.2** Verify expected file changes
  - [ ] **EXPECTED:** `app/admin/warroom/components/RemediationConfirmModal.tsx` (new)
  - [ ] **EXPECTED:** `app/admin/warroom/components/RemediationPreviewPanel.tsx` (modified)
  - [ ] **CONDITIONAL:** `app/admin/warroom/page.tsx` (only if minimal prop wiring required)
- [ ] **16.3** Verify no unexpected changes
  - [ ] **FORBIDDEN:** `lib/editorial/remediation-engine.ts`
  - [ ] **FORBIDDEN:** `lib/editorial/remediation-apply-types.ts` (except import-only)
  - [ ] **FORBIDDEN:** `lib/editorial/remediation-types.ts`
  - [ ] **FORBIDDEN:** `lib/editorial/global-governance-audit.ts`
  - [ ] **FORBIDDEN:** `lib/editorial/panda-intake-validator.ts`
  - [ ] **FORBIDDEN:** `app/api/*` files
  - [ ] **FORBIDDEN:** Publish/save routes
  - [ ] **FORBIDDEN:** `public/sw.js`
  - [ ] **FORBIDDEN:** `tsconfig.tsbuildinfo`
  - [ ] **FORBIDDEN:** `.idea/*` files
  - [ ] **FORBIDDEN:** Documentation files
- [ ] **Requirements:** 13
- [ ] **Success Criteria:** Only expected files changed, no forbidden modifications

### Task 17 — Final Implementation Report

- [ ] **17.1** Document final status
  - [ ] Report implementation completion status
  - [ ] List all files created
  - [ ] List all files modified
- [ ] **17.2** Document implemented features
  - [ ] Modal behavior implemented correctly
  - [ ] Preview panel integration completed
  - [ ] Eligibility gating functional
  - [ ] Confirmation checklist working
  - [ ] Disabled apply control in place
  - [ ] Accessibility features implemented
- [ ] **17.3** Confirm safety compliance
  - [ ] No mutation/API/deploy behavior added
  - [ ] All validation commands passed
  - [ ] Git status clean (only expected changes)
  - [ ] Manual smoke testing completed
- [ ] **17.4** Provide commit recommendation
  - [ ] Suggest appropriate commit message
  - [ ] Confirm readiness for commit
- [ ] **Requirements:** All
- [ ] **Success Criteria:** Complete implementation report, all tasks verified, ready for commit

---

## Out of Scope (Explicitly Forbidden)

The following functionality is **explicitly forbidden** in Phase 3B and must not be implemented:

### Mutation Behavior
- ❌ Real Apply to Draft functionality
- ❌ Draft content mutation
- ❌ Vault content mutation
- ❌ Audit state mutation
- ❌ Deploy gate changes

### Server Integration
- ❌ API route creation
- ❌ Database write operations
- ❌ Server persistence
- ❌ Background processing

### Automation
- ❌ Auto-apply functionality
- ❌ Auto-publish behavior
- ❌ Auto-commit/push/deploy
- ❌ Rollback runtime
- ❌ Audit invalidation runtime

### Content Fabrication
- ❌ Source/provenance fabrication
- ❌ E-E-A-T/factual fabrication
- ❌ Numeric correction fabrication
- ❌ Fake diff generation

### Side Effects
- ❌ localStorage persistence
- ❌ Clipboard operations
- ❌ Console.log apply simulation
- ❌ Mock handlers that pretend to apply

---

## Success Criteria Summary

**Phase 3B is complete when:**

1. ✅ `RemediationConfirmModal.tsx` exists as UI-only prototype
2. ✅ `RemediationPreviewPanel.tsx` integrated with Review button for eligible suggestions
3. ✅ Modal displays side-by-side preview and mandatory checkboxes
4. ✅ Apply control is disabled/non-mutating with clear prototype labeling
5. ✅ Warning banner displays required safety messaging
6. ✅ Eligibility gating works with Phase 3A helpers
7. ✅ Locked categories properly handled with existing messaging
8. ✅ No forbidden wording appears anywhere
9. ✅ Full accessibility implementation
10. ✅ No draft, vault, or audit mutation occurs
11. ✅ All automated validation scripts pass
12. ✅ Manual smoke testing passes
13. ✅ Git status shows only intended UI file changes
14. ✅ Deploy state remains unchanged
15. ✅ No side effects or forbidden functionality implemented

**Phase 3B provides a complete UI prototype for future human-approved draft apply workflow without implementing any actual mutation behavior.**