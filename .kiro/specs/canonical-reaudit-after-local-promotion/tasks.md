# Implementation Tasks: Canonical Re-Audit After Local Promotion

## Overview

This document defines the sequential implementation plan for the canonical re-audit feature after local promotion (Task 6B-2B). The implementation follows a controlled, incremental approach with strict safety boundaries.

**Critical Constraints:**
- Manual re-audit trigger only (no automatic triggers)
- Pending result storage model (no direct globalAudit overwrite)
- Deploy remains locked (no deploy unlock in this phase)
- In-memory only (no backend/API/database/provider)
- Snapshot identity validation (before and after audit)
- Session audit inheritance banned
- No publish/save/deploy wiring
- No rollback implementation

---

## Task 1: Pre-Implementation State Audit

**Objective:** Conduct read-only audit of current audit/global/vault/promotion archive state to understand existing implementation before making changes.

**Allowed Files:**
- Read-only access to:
  - `app/admin/warroom/page.tsx`
  - `lib/hooks/useNeuralAudit.ts`
  - `lib/neural-assembly/sia-sentinel-core.ts`
  - Any existing audit-related files
  - Any existing promotion-related files

**Forbidden Actions:**
- Do NOT modify any files
- Do NOT create any files
- Do NOT stage/commit/push
- Do NOT run any commands that modify state

**Validation Commands:**
```bash
# Read-only inspection only
# No validation commands required
```

**Acceptance Criteria:**
- [ ] Identify exact location of `globalAudit` state variable
- [ ] Identify exact location of canonical vault state
- [ ] Identify existing audit execution functions
- [ ] Identify existing promotion archive metadata (if any)
- [ ] Identify existing snapshot/hash computation functions (if any)
- [ ] Document current audit flow and state management
- [ ] Document current promotion flow and state management
- [ ] Identify any existing pending result patterns
- [ ] Create state audit report documenting findings

**Helper Intelligence Required:** No

---

## Task 2: Type Contracts

**Objective:** Create type definitions for canonical re-audit contracts without any runtime wiring.

**Allowed Files:**
- Create: `lib/editorial/canonical-reaudit-types.ts`

**Forbidden Actions:**
- Do NOT import types into runtime files yet
- Do NOT create runtime functions
- Do NOT modify existing files
- Do NOT wire into UI
- Do NOT stage/commit/push

**Validation Commands:**
```bash
# TypeScript compilation check
npx tsc --noEmit
```

**Acceptance Criteria:**
- [ ] Define `PendingCanonicalReAuditStatus` type with all states:
  - `NOT_RUN`
  - `RUNNING`
  - `PASSED_PENDING_ACCEPTANCE`
  - `FAILED_PENDING_REVIEW`
  - `STALE`
  - `BLOCKED`
- [ ] Define `CanonicalReAuditRequest` interface with fields:
  - `canonicalVault: PandaPackage`
  - `promotionId?: string`
  - `promotionArchive?: PromotionArchiveMetadata`
  - `operator: string`
  - `triggeredAt: string`
  - `expectedSnapshotHash?: string`
- [ ] Define `PendingCanonicalReAuditResult` interface with fields:
  - `status: PendingCanonicalReAuditStatus`
  - `promotionId?: string`
  - `auditedSnapshotId: string`
  - `auditedContentHash: string`
  - `auditedAt: string`
  - `operator: string`
  - `passed?: boolean`
  - `failed?: boolean`
  - `auditDetails?: AuditResultDetails`
  - `blockReason?: string`
  - `blockCategory?: CanonicalReAuditBlockReason`
  - `isStale: boolean`
  - `staleReason?: string`
- [ ] Define `CanonicalReAuditBlockReason` type with all block categories:
  - `NO_PROMOTED_VAULT`
  - `SNAPSHOT_MISSING`
  - `SNAPSHOT_MISMATCH`
  - `ALREADY_RUNNING`
  - `STALE_RESULT_EXISTS`
  - `ACKNOWLEDGEMENT_REQUIRED`
- [ ] Define `CanonicalReAuditSnapshotIdentity` interface with fields:
  - `contentHash: string`
  - `ledgerSequence: number`
  - `capturedAt: string`
  - `promotionId?: string`
- [ ] All types compile without errors
- [ ] Types match design document specifications exactly

**Helper Intelligence Required:** No

---

## Task 3: Handler Scaffold

**Objective:** Create canonical re-audit handler scaffold with fail-closed/no-op blocked result only, no UI wiring, no audit execution yet.

**Allowed Files:**
- Create: `app/admin/warroom/handlers/canonical-reaudit-handler.ts`
- Read: `lib/editorial/canonical-reaudit-types.ts`

**Forbidden Actions:**
- Do NOT wire into UI yet
- Do NOT implement actual audit execution
- Do NOT call backend/API/database/provider
- Do NOT modify existing files
- Do NOT stage/commit/push

**Validation Commands:**
```bash
# TypeScript compilation check
npx tsc --noEmit
```

**Acceptance Criteria:**
- [ ] Create `startCanonicalReAudit()` function signature
- [ ] Function accepts `CanonicalReAuditRequest` parameter
- [ ] Function returns `Promise<PendingCanonicalReAuditResult>`
- [ ] Initial implementation returns BLOCKED result with reason "Not implemented"
- [ ] No actual audit execution logic yet
- [ ] No backend/API/database/provider calls
- [ ] No UI wiring
- [ ] Function compiles without errors
- [ ] Function is exported for future use

**Helper Intelligence Required:** No

---

## Task 4: Snapshot Identity + Staleness Helpers

**Objective:** Implement pure helper functions for snapshot identity capture, comparison, and staleness detection without UI wiring.

**Allowed Files:**
- Modify: `app/admin/warroom/handlers/canonical-reaudit-handler.ts`
- Read: `lib/editorial/canonical-reaudit-types.ts`
- Read: Any existing hash/snapshot utilities

**Forbidden Actions:**
- Do NOT wire into UI yet
- Do NOT call backend/API/database/provider
- Do NOT modify existing files outside handler
- Do NOT stage/commit/push

**Validation Commands:**
```bash
# TypeScript compilation check
npx tsc --noEmit

# Unit test if created
npm test -- canonical-reaudit-handler
```

**Acceptance Criteria:**
- [ ] Implement `captureCanonicalVaultSnapshot()` function:
  - Accepts `PandaPackage` parameter
  - Returns `CanonicalReAuditSnapshotIdentity`
  - Computes content hash
  - Captures ledger sequence
  - Captures timestamp
  - Captures promotionId if available
- [ ] Implement `computeContentHash()` function:
  - Accepts `PandaPackage` parameter
  - Returns deterministic content hash string
  - Uses existing hash utilities if available
  - Creates new hash implementation if needed
- [ ] Implement `compareSnapshotIdentity()` function:
  - Accepts two `CanonicalReAuditSnapshotIdentity` parameters
  - Returns boolean indicating match
  - Compares content hash
  - Compares ledger sequence
- [ ] Implement `detectStaleResult()` function:
  - Accepts `PendingCanonicalReAuditResult` and current `PandaPackage`
  - Returns boolean indicating staleness
  - Compares current snapshot with audited snapshot
  - Returns true if mismatch detected
- [ ] All functions are pure (no side effects)
- [ ] All functions compile without errors
- [ ] No backend/API/database/provider calls

**Helper Intelligence Required:** No

---

## Task 5: In-Memory Audit Runner Adapter

**Objective:** Create read-only adapter around existing audit/Panda logic that runs in-memory without backend calls, persistence, or globalAudit mutation.

**Allowed Files:**
- Modify: `app/admin/warroom/handlers/canonical-reaudit-handler.ts`
- Read: `lib/hooks/useNeuralAudit.ts`
- Read: `lib/neural-assembly/sia-sentinel-core.ts`
- Read: Any existing audit execution files

**Forbidden Actions:**
- Do NOT call backend/API/database/provider
- Do NOT persist results
- Do NOT mutate globalAudit
- Do NOT wire into UI yet
- Do NOT stage/commit/push

**Validation Commands:**
```bash
# TypeScript compilation check
npx tsc --noEmit

# Unit test if created
npm test -- canonical-reaudit-handler
```

**Acceptance Criteria:**
- [ ] Implement `runCanonicalAuditInMemory()` function:
  - Accepts `PandaPackage` parameter
  - Returns audit result with pass/fail status
  - Wraps existing audit logic in read-only mode
  - Does NOT call backend/API/database/provider
  - Does NOT persist results
  - Does NOT mutate globalAudit
  - Runs entirely in browser memory
- [ ] Function reuses existing audit logic if available
- [ ] Function creates minimal audit implementation if needed
- [ ] Function returns structured audit result with:
  - `passed: boolean`
  - `failed: boolean`
  - `details: AuditResultDetails`
- [ ] All audit execution is synchronous or properly awaited
- [ ] No side effects beyond memory allocation
- [ ] Function compiles without errors

**Helper Intelligence Required:** Yes (high-risk - audit runner adapter)

---

## Task 6: Manual Re-Audit Execution

**Objective:** Implement full `startCanonicalReAudit()` function with precondition validation, audit execution, snapshot verification, and pending result storage.

**Allowed Files:**
- Modify: `app/admin/warroom/handlers/canonical-reaudit-handler.ts`
- Read: `lib/editorial/canonical-reaudit-types.ts`

**Forbidden Actions:**
- Do NOT overwrite globalAudit as passed
- Do NOT unlock deploy
- Do NOT call backend/API/database/provider
- Do NOT wire into UI yet
- Do NOT stage/commit/push

**Validation Commands:**
```bash
# TypeScript compilation check
npx tsc --noEmit

# Unit test if created
npm test -- canonical-reaudit-handler
```

**Acceptance Criteria:**
- [ ] Implement Phase 1: Precondition Validation
  - Check if already running → return BLOCKED
  - Verify canonical vault exists → return BLOCKED if missing
  - Capture current snapshot → return BLOCKED if missing
  - Compare with expected snapshot → return BLOCKED if mismatch
- [ ] Implement Phase 2: Audit Execution
  - Set running state
  - Call `runCanonicalAuditInMemory()`
  - Handle audit result
- [ ] Implement Phase 3: Snapshot Verification (After Audit)
  - Capture post-audit snapshot
  - Compare with pre-audit snapshot
  - Return STALE if mismatch detected
- [ ] Implement Phase 4: Result Storage (Pending Model)
  - Create `PendingCanonicalReAuditResult` with provenance
  - Set status to `PASSED_PENDING_ACCEPTANCE` or `FAILED_PENDING_REVIEW`
  - Include snapshot identity
  - Include timestamp and operator
  - Return pending result
- [ ] Function does NOT overwrite globalAudit
- [ ] Function does NOT unlock deploy
- [ ] Function does NOT call backend/API/database/provider
- [ ] Function includes proper error handling
- [ ] Function releases running lock in finally block
- [ ] Function compiles without errors

**Helper Intelligence Required:** Yes (high-risk - manual re-audit execution)

---

## Task 7: Canonical Re-Audit Panel UI

**Objective:** Create minimal UI panel showing canonical audit state, promotion metadata, manual trigger button, pending result display, and deploy lock warnings.

**Allowed Files:**
- Create: `app/admin/warroom/components/CanonicalReAuditPanel.tsx`
- Read: `lib/editorial/canonical-reaudit-types.ts`
- Read: `app/admin/warroom/handlers/canonical-reaudit-handler.ts`

**Forbidden Actions:**
- Do NOT wire into page yet
- Do NOT implement deploy unlock
- Do NOT call backend/API/database/provider
- Do NOT stage/commit/push

**Validation Commands:**
```bash
# TypeScript compilation check
npx tsc --noEmit

# Component test if created
npm test -- CanonicalReAuditPanel
```

**Acceptance Criteria:**
- [ ] Create `CanonicalReAuditPanel` component
- [ ] Display status banner when canonical audit is invalid/stale
- [ ] Display promotion archive metadata if available:
  - Promoted timestamp
  - Promotion ID
- [ ] Display current snapshot hash
- [ ] Provide "Run Canonical Re-Audit" button:
  - Disabled when preconditions not met
  - Disabled when already running
  - Shows "Running Re-Audit..." when executing
- [ ] Display pending result status when available:
  - Status badge (PASSED_PENDING_ACCEPTANCE, FAILED_PENDING_REVIEW, STALE, BLOCKED)
  - Audit details if available
  - Provenance metadata (timestamp, operator, snapshot)
- [ ] Display stale warning when result is stale
- [ ] Display "Deploy remains locked" warning (always)
- [ ] Display "Acceptance/deploy unlock is a later phase" warning (always)
- [ ] Component uses proper TypeScript types
- [ ] Component compiles without errors
- [ ] No deploy unlock functionality

**Helper Intelligence Required:** No

---

## Task 8: UI Wiring

**Objective:** Wire `CanonicalReAuditPanel` into Warroom page with proper state management, button gating, and staleness detection.

**Allowed Files:**
- Modify: `app/admin/warroom/page.tsx`
- Read: `app/admin/warroom/components/CanonicalReAuditPanel.tsx`
- Read: `app/admin/warroom/handlers/canonical-reaudit-handler.ts`
- Read: `lib/editorial/canonical-reaudit-types.ts`

**Forbidden Actions:**
- Do NOT implement auto-run after promotion
- Do NOT implement auto-run after modal close
- Do NOT unlock deploy
- Do NOT call backend/API/database/provider
- Do NOT stage/commit/push

**Validation Commands:**
```bash
# TypeScript compilation check
npx tsc --noEmit

# Build check
npm run build
```

**Acceptance Criteria:**
- [ ] Add state for `pendingCanonicalReAuditResult` in Warroom page
- [ ] Add state for `isReAuditRunning` in Warroom page
- [ ] Wire `CanonicalReAuditPanel` component into page layout
- [ ] Pass required props to panel:
  - `canonicalVault`
  - `globalAudit`
  - `pendingCanonicalReAuditResult`
  - `isReAuditRunning`
  - `onRunReAudit` handler
- [ ] Implement `handleRunReAudit` function:
  - Creates `CanonicalReAuditRequest`
  - Calls `startCanonicalReAudit()`
  - Updates `pendingCanonicalReAuditResult` state
  - Updates `isReAuditRunning` state
- [ ] Implement staleness detection on vault changes:
  - Use `useEffect` to detect vault changes
  - Call `detectStaleResult()` when vault changes
  - Update pending result status to STALE if needed
- [ ] Button is disabled when preconditions not met:
  - No canonical vault
  - Already running
  - Snapshot missing
  - Result not stale and already exists
- [ ] No auto-run after promotion
- [ ] No auto-run after modal close
- [ ] No deploy unlock
- [ ] Page compiles without errors
- [ ] Page builds successfully

**Helper Intelligence Required:** Yes (high-risk - UI wiring with execution path changes)

---

## Task 9: Verification Script

**Objective:** Create comprehensive verification script that validates all canonical re-audit safety constraints.

**Allowed Files:**
- Create: `scripts/verify-canonical-reaudit-after-local-promotion.ts`
- Read: All implementation files

**Forbidden Actions:**
- Do NOT modify implementation files
- Do NOT stage/commit/push yet

**Validation Commands:**
```bash
# Run verification script
npx tsx scripts/verify-canonical-reaudit-after-local-promotion.ts
```

**Acceptance Criteria:**
- [ ] Verify manual trigger only (no auto-run)
- [ ] Verify no auto-run after promotion success
- [ ] Verify no auto-run after modal close
- [ ] Verify `pendingCanonicalReAuditResult` exists and is used
- [ ] Verify `globalAudit` is not directly overwritten as pass
- [ ] Verify deploy remains locked after successful re-audit
- [ ] Verify snapshot identity is required before audit
- [ ] Verify snapshot identity is validated after audit
- [ ] Verify stale snapshot blocks result acceptance
- [ ] Verify no backend/API calls (no fetch/axios)
- [ ] Verify no database/provider calls (no prisma/libsql)
- [ ] Verify no localStorage writes
- [ ] Verify no sessionStorage writes
- [ ] Verify no publish/save/deploy wiring
- [ ] Verify no session audit inheritance
- [ ] Verify no rollback implementation
- [ ] Verify no session draft mutation
- [ ] Verify result includes provenance metadata:
  - promotionId
  - auditedSnapshotId
  - auditedContentHash
  - auditedAt
  - operator
- [ ] Script generates detailed verification report
- [ ] Script exits with code 0 if all checks pass
- [ ] Script exits with code 1 if any check fails
- [ ] Script output is clear and actionable

**Helper Intelligence Required:** No

---

## Task 10: Regression Validation

**Objective:** Run TypeScript compilation and existing promotion scripts to ensure no regressions, classify old 6B-2A script as phase-obsolete if needed.

**Allowed Files:**
- Read: All implementation files
- Read: Existing verification scripts

**Forbidden Actions:**
- Do NOT modify implementation files
- Do NOT stage/commit/push yet

**Validation Commands:**
```bash
# TypeScript compilation
npx tsc --noEmit

# Run existing promotion verification (if exists)
npx tsx scripts/verify-task-6b-2b-real-local-promotion-execution.ts

# Run new canonical re-audit verification
npx tsx scripts/verify-canonical-reaudit-after-local-promotion.ts
```

**Acceptance Criteria:**
- [ ] TypeScript compiles without errors
- [ ] No new TypeScript errors introduced
- [ ] Existing promotion verification passes (if exists)
- [ ] New canonical re-audit verification passes
- [ ] If old 6B-2A script fails only for disabled-button expectation:
  - Document as phase-obsolete
  - Explain why (button behavior changed in this phase)
  - Confirm no other failures
- [ ] All regression checks documented
- [ ] No breaking changes to existing functionality

**Helper Intelligence Required:** No

---

## Task 11: Scope Audit

**Objective:** Verify implementation file scope and confirm no forbidden boundaries were crossed.

**Allowed Files:**
- Read: All implementation files

**Forbidden Actions:**
- Do NOT modify implementation files
- Do NOT stage/commit/push yet

**Validation Commands:**
```bash
# Manual file scope review
# Check git status for modified files
git status

# Check for forbidden patterns
grep -r "localStorage" app/admin/warroom/
grep -r "sessionStorage" app/admin/warroom/
grep -r "fetch(" app/admin/warroom/handlers/
grep -r "axios" app/admin/warroom/handlers/
grep -r "prisma" app/admin/warroom/handlers/
grep -r "libsql" app/admin/warroom/handlers/
```

**Acceptance Criteria:**
- [ ] Verify only allowed files were modified:
  - `app/admin/warroom/page.tsx`
  - `app/admin/warroom/handlers/canonical-reaudit-handler.ts`
  - `app/admin/warroom/components/CanonicalReAuditPanel.tsx`
  - `lib/editorial/canonical-reaudit-types.ts`
  - `scripts/verify-canonical-reaudit-after-local-promotion.ts`
- [ ] Verify no backend/API files were modified
- [ ] Verify no database/provider files were modified
- [ ] Verify no deploy/publish logic was modified
- [ ] Verify no rollback implementation was added
- [ ] Verify no session draft mutation was added
- [ ] Verify no localStorage/sessionStorage usage
- [ ] Verify no fetch/axios/prisma/libsql calls
- [ ] Verify deploy lock boundary preserved
- [ ] Verify no direct globalAudit pass overwrite
- [ ] Verify no session audit inheritance
- [ ] Document any unexpected file modifications
- [ ] Confirm scope is within design boundaries

**Helper Intelligence Required:** No

---

## Task 12: Commit Scope Review

**Objective:** Review exact files to commit and exclude .kiro/report artifacts unless explicitly approved.

**Allowed Files:**
- Read: All implementation files
- Read: Git status

**Forbidden Actions:**
- Do NOT commit yet
- Do NOT push yet

**Validation Commands:**
```bash
# Review git status
git status

# Review git diff
git diff

# Check for .kiro/report artifacts
git status | grep ".kiro/report"
```

**Acceptance Criteria:**
- [ ] Review all modified files
- [ ] Confirm all modifications are intentional
- [ ] Exclude .kiro/report artifacts unless explicitly approved
- [ ] Exclude any temporary test files
- [ ] Exclude any debug files
- [ ] Confirm commit scope matches implementation scope
- [ ] Document files to be committed:
  - `app/admin/warroom/page.tsx`
  - `app/admin/warroom/handlers/canonical-reaudit-handler.ts`
  - `app/admin/warroom/components/CanonicalReAuditPanel.tsx`
  - `lib/editorial/canonical-reaudit-types.ts`
  - `scripts/verify-canonical-reaudit-after-local-promotion.ts`
- [ ] Confirm no forbidden files in commit scope
- [ ] Ready for commit

**Helper Intelligence Required:** No

---

## Task 13: Commit

**Objective:** Commit only approved implementation and verification files with clear commit message.

**Allowed Files:**
- Commit: Approved files from Task 12

**Forbidden Actions:**
- Do NOT push yet
- Do NOT deploy yet

**Validation Commands:**
```bash
# Stage approved files
git add app/admin/warroom/page.tsx
git add app/admin/warroom/handlers/canonical-reaudit-handler.ts
git add app/admin/warroom/components/CanonicalReAuditPanel.tsx
git add lib/editorial/canonical-reaudit-types.ts
git add scripts/verify-canonical-reaudit-after-local-promotion.ts

# Commit
git commit -m "feat: implement canonical re-audit after local promotion

- Add manual re-audit trigger (no auto-run)
- Add pending result storage model (no direct globalAudit overwrite)
- Add snapshot identity validation (before and after audit)
- Add stale result detection
- Add in-memory audit runner adapter
- Add CanonicalReAuditPanel UI component
- Add verification script
- Deploy remains locked (no deploy unlock in this phase)
- No backend/API/database/provider calls
- No session audit inheritance
- No publish/save/deploy wiring

Ref: .kiro/specs/canonical-reaudit-after-local-promotion"
```

**Acceptance Criteria:**
- [ ] All approved files staged
- [ ] Commit message is clear and descriptive
- [ ] Commit message references spec path
- [ ] Commit message lists key features
- [ ] Commit message lists key constraints
- [ ] Commit created successfully
- [ ] Commit hash recorded
- [ ] Ready for push

**Helper Intelligence Required:** No

---

## Task 14: Push / Deployment Verification

**Objective:** Push commit, verify Vercel deployment, smoke test routes, confirm deploy remains locked.

**Allowed Files:**
- Push: Committed files

**Forbidden Actions:**
- Do NOT modify files after push
- Do NOT manually unlock deploy

**Validation Commands:**
```bash
# Push to remote
git push origin main

# Wait for Vercel deployment
# Check Vercel dashboard

# Smoke test routes (after deployment)
curl https://your-domain.com/admin/warroom
curl https://your-domain.com/

# Run verification script against deployed version (if possible)
npx tsx scripts/verify-canonical-reaudit-after-local-promotion.ts
```

**Acceptance Criteria:**
- [ ] Push successful
- [ ] Vercel deployment triggered
- [ ] Vercel deployment completed successfully
- [ ] No build errors
- [ ] No deployment errors
- [ ] Smoke test: Homepage loads
- [ ] Smoke test: Warroom page loads
- [ ] Smoke test: CanonicalReAuditPanel renders
- [ ] Smoke test: Manual re-audit button visible
- [ ] Smoke test: Deploy remains locked
- [ ] Smoke test: No auto-run after page load
- [ ] Verification script passes (if run against deployed version)
- [ ] Deployment URL recorded
- [ ] Ready for post-deploy cleanup

**Helper Intelligence Required:** No

---

## Task 15: Post-Deploy Cleanup

**Objective:** Restore build artifacts only, preserve .kiro and reports.

**Allowed Files:**
- Restore: Build artifacts only

**Forbidden Actions:**
- Do NOT delete .kiro directory
- Do NOT delete reports
- Do NOT delete verification scripts

**Validation Commands:**
```bash
# Clean build artifacts if needed
npm run clean

# Rebuild if needed
npm run build
```

**Acceptance Criteria:**
- [ ] Build artifacts restored if needed
- [ ] .kiro directory preserved
- [ ] Reports preserved
- [ ] Verification scripts preserved
- [ ] Implementation files preserved
- [ ] No unintended deletions
- [ ] Workspace is clean
- [ ] Ready for final verification

**Helper Intelligence Required:** No

---

## Task 16: Final Verification / Closeout

**Objective:** Final validation, final scope confirmation, classify phase-obsolete scripts, ready for next phase.

**Allowed Files:**
- Read: All implementation files
- Read: All verification scripts
- Read: All reports

**Forbidden Actions:**
- Do NOT modify implementation files
- Do NOT commit/push

**Validation Commands:**
```bash
# Run final verification
npx tsx scripts/verify-canonical-reaudit-after-local-promotion.ts

# Run TypeScript check
npx tsc --noEmit

# Run build check
npm run build

# Review all verification reports
cat .kiro/report/canonical-reaudit-verification-report.txt
```

**Acceptance Criteria:**
- [ ] Final verification script passes
- [ ] TypeScript compiles without errors
- [ ] Build succeeds without errors
- [ ] All acceptance criteria met:
  - Manual re-audit trigger works
  - Pending result storage model implemented
  - Deploy remains locked after successful re-audit
  - Snapshot identity validation works
  - Stale detection works
  - No backend persistence
  - No session audit inheritance
  - Verification script passes
  - UI displays correct warnings
  - All forbidden actions prevented
- [ ] Classify phase-obsolete scripts:
  - Document which scripts are obsolete
  - Explain why (button behavior changed, etc.)
  - Confirm no other failures
- [ ] Document next phase recommendations:
  - Canonical audit acceptance phase
  - Deploy unlock phase
  - Result persistence phase
  - Rollback phase
- [ ] Create closeout report
- [ ] Phase complete

**Helper Intelligence Required:** No

---

## Summary

**Total Tasks:** 16

**Tasks Requiring Helper Intelligence:**
- Task 5: In-Memory Audit Runner Adapter (high-risk)
- Task 6: Manual Re-Audit Execution (high-risk)
- Task 8: UI Wiring (high-risk if execution path changes)

**Tasks Not Requiring Helper Intelligence:**
- Task 1: Pre-Implementation State Audit (read-only)
- Task 2: Type Contracts (types only)
- Task 3: Handler Scaffold (scaffold only)
- Task 4: Snapshot Identity + Staleness Helpers (pure functions)
- Task 7: Canonical Re-Audit Panel UI (UI component)
- Task 9: Verification Script (verification only)
- Task 10: Regression Validation (validation only)
- Task 11: Scope Audit (audit only)
- Task 12: Commit Scope Review (review only)
- Task 13: Commit (commit only)
- Task 14: Push / Deployment Verification (deployment only)
- Task 15: Post-Deploy Cleanup (cleanup only)
- Task 16: Final Verification / Closeout (verification only)

**Safety Boundaries Included:**
- ✅ Manual trigger only (no auto-run)
- ✅ Pending result storage (no direct globalAudit overwrite)
- ✅ Deploy lock preservation (no deploy unlock)
- ✅ Snapshot identity validation (before and after)
- ✅ In-memory only (no backend/API/database/provider)
- ✅ Session audit inheritance banned
- ✅ No publish/save/deploy wiring
- ✅ No rollback implementation
- ✅ Stale detection and prevention
- ✅ Verification script for all constraints

**Expected File Scope:**
- `app/admin/warroom/page.tsx` (modified)
- `app/admin/warroom/handlers/canonical-reaudit-handler.ts` (new)
- `app/admin/warroom/components/CanonicalReAuditPanel.tsx` (new)
- `lib/editorial/canonical-reaudit-types.ts` (new)
- `scripts/verify-canonical-reaudit-after-local-promotion.ts` (new)

**Forbidden File Scope:**
- Backend/API files
- Database/provider files
- Deploy/publish logic
- Rollback implementation
- Session draft mutation
- Persistence layers

---

**END OF TASKS DOCUMENT**

This is TASKS DOCUMENT ONLY. Do not implement runtime code. Do not commit. Do not push. Do not deploy.
