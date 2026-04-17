# Vercel Production Build Scope Verification

**Date**: 2026-04-17  
**Status**: SCOPE_VERIFIED - OUT_OF_SCOPE_ERRORS_IDENTIFIED  
**Blocker Type**: BUILD_CONFIGURATION_ISSUE

---

## CURRENT_PRODUCTION_STATUS

**Latest Vercel Deployment**: Ready (based on workspace context)  
**TypeScript Compilation**: FAILING (but failures are in excluded directories)  
**Active Build Root**: `/` (workspace root)

---

## FIRST_REAL_BLOCKER

### Blocker Identification

**TypeScript compilation errors exist in `_deploy_root_fix/` and `_deploy_vercel_sync/` directories.**

These directories are:
- **NOT part of the active production codebase**
- **Separate git worktrees or deployment snapshots**
- **Should be excluded from TypeScript compilation**
- **Currently included because `tsconfig.json` doesn't exclude them**

### Evidence

1. **Directory Structure Analysis**:
   - `_deploy_root_fix/` contains a complete Next.js project with its own `package.json`, `tsconfig.json`, `.git`
   - `_deploy_vercel_sync/` contains a complete Next.js project with its own `package.json`, `tsconfig.json`, `.git`
   - These are **separate codebases**, not part of the active workspace

2. **TypeScript Compilation Output**:
   ```
   _deploy_root_fix/app/(public)/[lang]/news/[slug]/page.tsx(544,13): error TS7006
   _deploy_root_fix/lib/db/prisma.ts(8,66): error TS2307
   _deploy_vercel_sync/app/(admin)/[lang]/admin/articles/page.tsx(20,37): error TS2307
   _deploy_vercel_sync/app/(admin)/[lang]/admin/create/page.tsx(1,31): error TS2307
   ... (100+ errors in _deploy_* directories)
   ```

3. **Current `tsconfig.json` Exclude Pattern**:
   ```json
   "exclude": [
     "node_modules",
     "**/__tests__",
     "scripts"
   ]
   ```
   **Missing**: `_deploy_*` directories

---

## BLOCKER_TYPE

**BUILD_CONFIGURATION_ISSUE**

This is NOT a production code issue. This is a TypeScript configuration issue where old/archived deployment directories are being included in type checking.

---

## EXACT_FAILING_SURFACE

**Surface**: TypeScript compilation (`npm run type-check`)  
**Root Cause**: `tsconfig.json` includes `_deploy_*` directories in compilation scope  
**Impact**: Build verification fails, but production code is likely healthy

---

## SMALLEST_SAFE_FIX

### Fix Strategy

**Add `_deploy_*` directories to `tsconfig.json` exclude pattern.**

This is a **SAFE** fix because:
1. These directories are separate codebases (have their own `tsconfig.json`)
2. They are not imported by the active codebase
3. They appear to be deployment snapshots or worktrees
4. Excluding them will not affect production functionality

### Implementation

Update `tsconfig.json`:

```json
{
  "exclude": [
    "node_modules",
    "**/__tests__",
    "scripts",
    "_deploy_root_fix",
    "_deploy_vercel_sync",
    "_release_align_main",
    "_stage7_push_worktree",
    "_stage8_push_worktree"
  ]
}
```

---

## FILES_TO_TOUCH

1. **`tsconfig.json`** - Add exclude patterns for deployment directories

---

## VALIDATION_PLAN

### Step 1: Apply Fix
- Update `tsconfig.json` with new exclude patterns

### Step 2: Verify Type Check
```bash
npm run type-check
```
**Expected**: No errors from `_deploy_*` directories

### Step 3: Verify Build
```bash
npm run build
```
**Expected**: Clean build (or only errors from active codebase)

### Step 4: Check Active Codebase Errors
- If errors remain after excluding `_deploy_*`, those are REAL production blockers
- If no errors remain, production build is healthy

---

## FINAL_STATUS

**READY_TO_APPLY_TINY_FIX**

### Summary

- **Blocker**: TypeScript compilation includes old deployment directories
- **Fix**: Add exclude patterns to `tsconfig.json`
- **Risk**: MINIMAL (only affects type checking scope)
- **Impact**: Will reveal true production build health

### Next Action

Apply the fix to `tsconfig.json` and re-run type check to identify any REAL production blockers in the active codebase.

---

## Additional Context

### Why These Directories Exist

These appear to be:
- **Git worktrees** for parallel development/deployment
- **Deployment snapshots** for rollback purposes
- **Staging branches** checked out as separate directories

They should NOT be part of the main workspace TypeScript compilation.

### Vercel Build Behavior

Vercel likely:
- Uses its own build root (probably the workspace root)
- Has its own `tsconfig.json` or build configuration
- May already exclude these directories in its build process
- The local `npm run type-check` is more strict than Vercel's build

This explains why Vercel deployments may be succeeding while local type checks fail.
