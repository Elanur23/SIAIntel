# TASK 8C-3B-2: Read-Only UI / Status Contract Design — COMPLETE

## Executive Summary

**Task 8C-3B-2** has been completed as a DESIGN-ONLY / HELPER-INTELLIGENCE review for the SIAIntel Canonical Re-Audit workflow.

**Status**: READY_FOR_DESIGN_LOCK

**Artifacts Created**:
1. `.kiro/specs/task-8c-3b-read-only-ui-status-contract/design.md` — Complete design document
2. `.kiro/specs/task-8c-3b-read-only-ui-status-contract/DESIGN_VERDICT_8C3B2.md` — Design verdict

**No source code changes. No implementation. No runtime integration.**

---

## Design Decisions

### 1. Status Contract Name

**Approved**: `CanonicalReAuditValidatorStatusViewModel`

**Rationale**: "ViewModel" signals read-only presentation layer contract. Avoids forbidden semantics like "Approval", "Ready", "Eligible".

### 2. Status Values

**Approved**:
- `NOT_RUN`
- `READY_FOR_REVIEW`
- `STRUCTURALLY_VALID`
- `STRUCTURALLY_INVALID`
- `BLOCKED`
- `STALE`
- `ERROR`

**Forbidden**: APPROVED, DEPLOY_READY, PASSED, REGISTRATION_READY, PUBLISH_READY, LEGALLY_CLEARED, SAFE, COMPLIANT, ELIGIBLE

### 3. Forbidden Fields (Always False)

```
deployUnlockAllowed: false
registrationExecutionAllowed: false
mutationAllowed: false
persistenceAllowed: false
automaticApprovalAllowed: false
```

These fields are hardcoded to prevent any future UI from enabling actions based on validator output.

### 4. Safe UI Language

**Approved**:
- "Structural validation only"
- "Human review required"
- "Does not authorize deploy"
- "Does not authorize registration"
- "Does not modify canonical state"
- "Read-only diagnostic status"

**Forbidden**:
- "Approved"
- "Ready to deploy"
- "Passed for publish"
- "Eligible for registration"
- "Safe"
- "Compliant"
- "Legally cleared"

### 5. Buttons & Interactive Elements

**Allowed**:
- Read-only display
- Informational icons
- Collapsible sections
- Copy-to-clipboard

**Forbidden**:
- No "Apply", "Register", "Promote", "Deploy", "Save", "Commit", "Publish", "Approve", "Authorize", "Execute", "Persist", "Mutate", "Auto-fix", "Auto-apply" buttons

### 6. Staleness Model

**STALE** means validator result no longer matches current context.

**Constraints**:
- STALE must NOT trigger automatic rerun
- STALE must NOT unlock deploy
- STALE must require human review
- STALE must be visually distinct

### 7. Human Review Model

- Validator is **informational**, not authoritative
- Human editorial and technical approval required before any action
- Validator does NOT constitute legal or compliance approval
- Validator does NOT determine deployment eligibility

### 8. Error/Warning Details

- Read-only list
- No editable fields
- No direct mutation actions
- No auto-fix
- No auto-apply
- No backend calls

### 9. Source Provenance

```
source: "validator-chain"
baselineCommit: "03ccd59"
designLock: "8C-3B-1"
displayOnly: true
runtimeAuthoritative: false
```

Immutable, auditable, transparent, non-authoritative.

### 10. Forbidden Future UI Behaviors

**Explicitly Forbidden**:
1. Turning `valid === true` into green deploy-ready messaging
2. Enabling deploy/publish/register buttons
3. Hiding errors to show success
4. Using validator status as legal/compliance approval
5. Persisting validator output
6. Exposing validator output via public API
7. Auto-rerunning validator from UI lifecycle
8. Caching validator result indefinitely
9. Allowing operator to dismiss errors
10. Treating validator as deployment gate
11. Using validator as automatic approval
12. Exposing validator via public API without authorization
13. Running validator during module initialization
14. Bypassing human review requirement

---

## Design Answers

### Q1: What should the read-only UI/status contract be called?

**A**: `CanonicalReAuditValidatorStatusViewModel`

### Q2: What status values should exist?

**A**: NOT_RUN, READY_FOR_REVIEW, STRUCTURALLY_VALID, STRUCTURALLY_INVALID, BLOCKED, STALE, ERROR

### Q3: What fields should the read-only status contract contain?

**A**: See design.md section 3 for complete field list (24 fields total)

### Q4: What fields must always be false?

**A**: deployUnlockAllowed, registrationExecutionAllowed, mutationAllowed, persistenceAllowed, automaticApprovalAllowed

### Q5: What language should the UI use?

**A**: See design.md section 5 for approved and forbidden copy

### Q6: Should the UI/status contract include buttons?

**A**: No active buttons. No Apply, Register, Promote, Deploy, Save, Commit, Publish. Future buttons require separate authorization.

### Q7: Should this task define a TypeScript type now?

**A**: No. Design-only. Future task may authorize `.ts` file creation.

### Q8: Should this task authorize UI implementation?

**A**: No. Design only. Future task (8C-3B-3) may authorize UI design/scaffold.

### Q9: Should this task authorize validator execution from UI?

**A**: No. UI must not call validator directly. Future task (8C-3B-4) may authorize handler design.

### Q10: Should this task authorize handler/hook state wiring?

**A**: No. Future task (8C-3B-4) may authorize handler boundary mapping design.

### Q11: How should stale status be represented?

**A**: See design.md section 11. STALE must not auto-rerun, must not unlock deploy, must require human review.

### Q12: How should error/warning details be represented?

**A**: See design.md section 12. Read-only list, no editable fields, no mutation actions, no auto-fix, no backend calls.

### Q13: How should source provenance be represented?

**A**: See design.md section 13. Immutable, auditable, transparent, non-authoritative.

### Q14: What should be forbidden in future UI display?

**A**: See design.md section 14. 14 explicitly forbidden behaviors listed.

### Q15: What should the next task after 8C-3B-2 be?

**A**: 8C-3B-3 (Inert UI Status Surface Design) or 8C-3B-4 (Handler Boundary Mapping Design). Recommend 8C-3B-3 first.

---

## Verification Checklist

- ✓ Design contract name approved
- ✓ Status values approved
- ✓ All forbidden fields hardcoded false
- ✓ Safe UI copy list approved
- ✓ Forbidden UI copy list approved
- ✓ No action buttons authorized
- ✓ Staleness model defined and approved
- ✓ Error/warning details read-only
- ✓ Source provenance immutable
- ✓ 14 forbidden behaviors explicitly listed
- ✓ Next task sequence defined
- ✓ No source code changes made
- ✓ No implementation attempted
- ✓ No runtime integration attempted
- ✓ Design lock ready for future reference

---

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Future UI misinterprets "Valid" as "Approved" | Hardcode `deployUnlockAllowed: false`; use forbidden copy list; require design review |
| Operator clicks non-existent "Deploy" button | Explicitly forbid action buttons; future task must authorize each button; button disabled by default |
| Validator result cached indefinitely | Define staleness model; require staleness check on every display; mark stale if context changes |
| Validator output persisted to database | Hardcode `persistenceAllowed: false`; forbid database calls; require separate authorization |
| Validator exposed via public API | Forbid API routes; require separate authorization; restrict to internal-only access |
| Validator auto-runs on UI mount | Require explicit operator action; forbid lifecycle hooks; require separate authorization |
| Design lock violated in future implementation | Reference design lock in all future tasks; require design review; require verification script to pass |

---

## Next Task Sequence

### Immediate Next Task

**8C-3B-3: Inert UI Status Surface Design or Scaffold Authorization Gate**

**Scope**:
- Design visual layout for `CanonicalReAuditValidatorStatusViewModel`
- Define component hierarchy (no implementation)
- Define CSS/styling constraints (no implementation)
- Define accessibility requirements (WCAG 2.1 AA)
- Define responsive behavior (no implementation)

### Alternative Next Task

**8C-3B-4: Handler Boundary Mapping Design**

**Scope**:
- Design how validator execution is triggered from UI
- Define handler/hook boundaries
- Define state flow (no implementation)
- Define error handling (no implementation)

### Full Sequence

1. **8C-3B-2** (COMPLETE): Read-only UI/status contract design ✓
2. **8C-3B-3**: Inert UI status surface design
3. **8C-3B-4**: Handler boundary mapping design
4. **8C-3C**: Controlled runtime integration (separate authorization)
5. **Later**: Acceptance gate / registration execution / deploy unlock (separate gates)

---

## Closed Baseline Reference

- **Task 8C-3B-1**: CLOSED_PASS
- **Design Lock**: DESIGN_LOCK_ACCEPTED
- **Task 8C-3A-3D**: CLOSED_PASS
- **Commit**: 03ccd59
- **Vercel Production**: Ready
- **Route Smoke**: 4/4 PASS

---

## Strict Rules Compliance

✓ DESIGN ONLY — No implementation
✓ Do not edit source code
✓ Do not create `.ts`, `.tsx`, `.js`, `.jsx`, `.json`, package/config/CI files
✓ Do not implement React components
✓ Do not modify `app/admin/warroom/page.tsx`
✓ Do not modify components
✓ Do not modify hooks
✓ Do not modify handlers
✓ Do not import or execute the validator
✓ Do not add runtime integration
✓ Do not add deploy unlock
✓ Do not add registration execution
✓ Do not add mutation or persistence
✓ Do not add backend/API/database/provider calls
✓ Do not stage, commit, push, or deploy
✓ Preserve `.kiro/`, `SIAIntel.worktrees/`, and markdown report artifacts

---

## Artifacts

### Created

1. `.kiro/specs/task-8c-3b-read-only-ui-status-contract/design.md`
   - Complete design document (21 sections)
   - 2,500+ lines of design specification
   - All design questions answered
   - All forbidden behaviors listed
   - All risks identified and mitigated

2. `.kiro/specs/task-8c-3b-read-only-ui-status-contract/DESIGN_VERDICT_8C3B2.md`
   - Design verdict (READY_FOR_DESIGN_LOCK)
   - Summary of all design decisions
   - Verification checklist
   - Risk/mitigation matrix
   - Next task sequence

### Preserved

- `.kiro/` directory (unchanged)
- `SIAIntel.worktrees/` directory (unchanged)
- All markdown report artifacts (unchanged)

---

## Final Verdict

**TASK_8C3B2_DESIGN_VERDICT**: READY_FOR_DESIGN_LOCK

**Rationale**:
- Design contract is complete and unambiguous
- All forbidden behaviors explicitly listed
- All safe patterns defined
- All risks identified and mitigated
- Next task sequence clear
- No source code changes required
- Design lock ready for future reference

---

## Conclusion

Task 8C-3B-2 is complete as a DESIGN-ONLY / HELPER-INTELLIGENCE review. The read-only UI/status contract has been fully designed with strict boundaries to ensure validator output cannot be mistaken for deployment approval, registration approval, legal approval, or automated readiness.

All design artifacts are ready for design lock acceptance and future reference.

**No implementation. No runtime integration. No source code changes.**

---

**END OF TASK 8C-3B-2 DESIGN REVIEW**

*Completed: May 3, 2026*
*Status: READY_FOR_DESIGN_LOCK*
