# AI Cluster Root-Cause Verification

**Date**: 2026-04-17  
**Verification Pass**: Task 12  
**Target Cluster**: AI Module Errors  
**Current Error Count**: 4 real production errors (after SIA News fix)  
**Affected Files**: 2

---

## 1. AI_ERROR_GROUP_MAP

### Error Distribution
- **Total AI Errors**: 2 TS2307 errors
- **Affected Files**: 2
- **Missing Modules**: 2

### Error Breakdown by File

#### File 1: `lib/ai/groq-provider.ts`
- **Error Count**: 1
- **Error Type**: TS2307 - Cannot find module
- **Missing Module**: `./quota-guard`
- **Expected Exports**: `withQuotaGuard`, `isCoolingDown`, `cooldownSecondsLeft`, `registerQuotaHit`

#### File 2: `lib/neural-assembly/speed-cell.ts`
- **Error Count**: 1
- **Error Type**: TS2307 - Cannot find module
- **Missing Module**: `@/lib/ai/workspace-io`
- **Expected Exports**: `readWorkspace`, `writeWorkspace`, `Workspace`, `LangKey`

---

## 2. IMPORT_SITES_AND_EXPECTED_EXPORTS

### Import Site 1: `lib/ai/groq-provider.ts`
**Import Statement**:
```typescript
import * as quotaGuard from './quota-guard'
```

**Expected Exports**:
- `withQuotaGuard` (function) - Wraps AI calls with quota protection
- `isCoolingDown` (function) - Checks if provider is in cooldown
- `cooldownSecondsLeft` (function) - Returns remaining cooldown seconds
- `registerQuotaHit` (function) - Registers a 429 quota hit

**Usage Context**: Groq AI provider with quota management and cooldown protection

**Usage Pattern**:
```typescript
interface QuotaGuardCompat {
  withQuotaGuard: typeof quotaGuard.withQuotaGuard
  isCoolingDown: typeof quotaGuard.isCoolingDown
  cooldownSecondsLeft: typeof quotaGuard.cooldownSecondsLeft
  registerQuotaHit: (provider: string, retryAfterSeconds?: number, quotaType?: QuotaType) => void
  getTPMTelemetry?: (provider: string, estimatedTokens: number) => unknown
}
```

---

### Import Site 2: `lib/neural-assembly/speed-cell.ts`
**Import Statement**:
```typescript
import { readWorkspace, writeWorkspace, Workspace, LangKey } from '@/lib/ai/workspace-io';
```

**Expected Exports**:
- `readWorkspace` (function) - Reads ai_workspace.json with BOM stripping and Mojibake fixing
- `writeWorkspace` (function) - Writes ai_workspace.json with UTF-8 encoding
- `Workspace` (type) - Workspace data structure with 9 language keys
- `LangKey` (type) - Language key type ('en' | 'tr' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'jp' | 'zh')

**Usage Context**: Speed cell deployment system for ai_workspace.json content

---

## 3. AI_EXPORT_CLASSIFICATION

### Missing Module 1: `lib/ai/quota-guard.ts`
**Classification**: `EXISTS_ONLY_IN_REFERENCE`

**Evidence**:
- ✅ File exists in `_deploy_vercel_sync/lib/ai/quota-guard.ts` (92 lines)
- ❌ File does NOT exist in active workspace `lib/ai/`
- ✅ All expected exports present in reference file:
  - `registerQuotaHit` - Registers 429 quota hits with exponential backoff
  - `isCoolingDown` - Checks if provider is in cooldown
  - `cooldownSecondsLeft` - Returns remaining cooldown seconds
  - `getCooldownMessage` - Returns user-facing cooldown message
  - `withQuotaGuard` - Wraps AI calls with quota protection

**Dependencies**:
- **NONE** - Completely self-contained
- Uses only JavaScript built-ins (Map, Date, Math, console)

**Self-Contained**: ✅ YES (zero external dependencies)

**File Size**: 92 lines

**Functionality**:
- Centralized 429/rate-limit shield for all AI providers
- Exponential backoff (5m → 10m → 20m, capped at 1h)
- Module-level cooldown map shared across server-side uses
- Automatic re-enable after cooldown expires

---

### Missing Module 2: `lib/ai/workspace-io.ts`
**Classification**: `EXISTS_ONLY_IN_REFERENCE`

**Evidence**:
- ✅ File exists in `_deploy_vercel_sync/lib/ai/workspace-io.ts` (180 lines)
- ❌ File does NOT exist in active workspace `lib/ai/`
- ✅ All expected exports present in reference file:
  - `readWorkspace` - Reads ai_workspace.json with BOM stripping
  - `writeWorkspace` - Writes ai_workspace.json with UTF-8 encoding
  - `Workspace` - Type for workspace data structure
  - `LangKey` - Type for language keys
  - `getMissingLangs` - Returns list of empty language keys
  - `countWordsWs` - CJK-aware word counter

**Dependencies**:
- `fs/promises` - Node.js built-in ✅
- `path` - Node.js built-in ✅

**Self-Contained**: ✅ YES (only Node.js built-ins)

**File Size**: 180 lines

**Functionality**:
- Safe read/write for ai_workspace.json
- BOM (Byte Order Mark) stripping on every read
- Windows-1252/1254 Mojibake auto-detection and reversal
- Guarantees all 9 language keys exist after read
- UTF-8 without BOM on all writes

---

## 4. BEST_FIX_PATH_OPTIONS

### Option A: RESTORE_BOTH_AI_FILES
**Scope**: Restore both missing AI files
**Files**:
1. `lib/ai/quota-guard.ts` (92 lines)
2. `lib/ai/workspace-io.ts` (180 lines)

**Errors Resolved**: 2 out of 2 AI errors (100%)

**Pros**:
- ✅ Eliminates all AI cluster errors
- ✅ Both files are self-contained (zero external dependencies)
- ✅ Tight blast radius (2 files, 272 lines total)
- ✅ No dependency explosion
- ✅ Production-tested code from reference

**Cons**:
- None identified

**Risk Level**: LOW

---

### Option B: RESTORE_QUOTA_GUARD_ONLY
**Scope**: Restore only quota-guard.ts
**Files**:
1. `lib/ai/quota-guard.ts` (92 lines)

**Errors Resolved**: 1 out of 2 AI errors (50%)

**Pros**:
- ✅ Smaller blast radius (1 file, 92 lines)
- ✅ Self-contained (zero dependencies)

**Cons**:
- ❌ Leaves 1 AI error unresolved (workspace-io)
- ❌ Incomplete AI cluster fix

**Risk Level**: LOW

---

### Option C: RESTORE_WORKSPACE_IO_ONLY
**Scope**: Restore only workspace-io.ts
**Files**:
1. `lib/ai/workspace-io.ts` (180 lines)

**Errors Resolved**: 1 out of 2 AI errors (50%)

**Pros**:
- ✅ Self-contained (only Node.js built-ins)

**Cons**:
- ❌ Leaves 1 AI error unresolved (quota-guard)
- ❌ Incomplete AI cluster fix

**Risk Level**: LOW

---

### Option D: REMOVE_DEAD_IMPORTS
**Scope**: Remove imports from groq-provider and speed-cell
**Files Modified**:
1. `lib/ai/groq-provider.ts` - remove quota-guard import
2. `lib/neural-assembly/speed-cell.ts` - remove workspace-io import

**Errors Resolved**: 2 out of 2 AI errors (100%)

**Pros**:
- ✅ Zero new files

**Cons**:
- ❌ Breaks groq-provider quota management functionality
- ❌ Breaks speed-cell deployment functionality
- ❌ May break other parts of the system that depend on these features

**Risk Level**: MEDIUM-HIGH (depends on whether these features are actively used)

---

## 5. SINGLE_BEST_NEXT_FIX_TARGET

**CHOSEN TARGET**: `RESTORE_AI_FILE` (Option A - Both Files)

**Rationale**:
1. **Highest Leverage**: Resolves 100% of AI cluster errors (2 out of 2)
2. **Tight Blast Radius**: Only 2 files, 272 lines total
3. **Zero Dependency Explosion**: Both files are completely self-contained
4. **Low Risk**: Both files use only JavaScript/Node.js built-ins
5. **Production Ready**: Both files are complete, tested, and production-ready in reference
6. **Preserves Functionality**: Maintains quota management and workspace I/O features

**Files to Restore**:
1. `lib/ai/quota-guard.ts` (92 lines) - Quota management with exponential backoff
2. `lib/ai/workspace-io.ts` (180 lines) - Safe ai_workspace.json I/O with Mojibake fixing

**Expected Outcome**:
- All 2 AI cluster errors eliminated
- Total errors reduced from 4 to 2 (50% reduction)
- No new dependencies introduced
- No dependency explosion

---

## 6. WHY_NOT_THE_OTHERS_YET

### Why Not Option B (Restore quota-guard Only)?
- **Incomplete Solution**: Leaves 1 AI error unresolved
- **No Advantage**: Both files are equally safe to restore
- **Better to Complete**: Since both files are self-contained, restore both in one pass

### Why Not Option C (Restore workspace-io Only)?
- **Incomplete Solution**: Leaves 1 AI error unresolved
- **No Advantage**: Both files are equally safe to restore
- **Better to Complete**: Since both files are self-contained, restore both in one pass

### Why Not Option D (Remove Dead Imports)?
- **Unknown Impact**: Don't know if groq-provider quota management is actively used
- **Unknown Impact**: Don't know if speed-cell deployment is actively used
- **Destructive**: Removes functionality rather than restoring it
- **Premature**: Should first restore the files, then evaluate if they're dead code

---

## 7. SAFE_NEXT_ACTION

**ACTION**: `VERIFY_REFERENCE_RESTORE_PATH`

**Verification Steps**:
1. ✅ Confirm both target files exist in reference directory
2. ✅ Confirm both target files do NOT exist in active workspace
3. ✅ Confirm all dependencies are satisfied (Node.js built-ins only)
4. ✅ Confirm no dependency explosion (both files are self-contained)
5. ✅ Confirm reference files are self-consistent and production-ready

**Pre-Restore Checklist**:
- [x] `lib/ai/quota-guard.ts` - Reference exists, self-contained ✅
- [x] `lib/ai/workspace-io.ts` - Reference exists, self-contained ✅
- [x] No external dependencies beyond Node.js built-ins ✅
- [x] No dependency explosion risk ✅

**Dependency Closure**:
- `lib/ai/quota-guard.ts` - ✅ ZERO external dependencies
- `lib/ai/workspace-io.ts` - ✅ Only Node.js built-ins (`fs/promises`, `path`)

**Next Implementation Steps**:
1. Restore `lib/ai/quota-guard.ts` from reference
2. Restore `lib/ai/workspace-io.ts` from reference
3. Run TypeScript type-check to validate
4. Document completion

---

## 8. FINAL_STATUS

**STATUS**: `NEXT_REAL_BLOCKER_ISOLATED`

**Summary**:
- ✅ AI cluster fully analyzed
- ✅ 2 missing modules identified and classified
- ✅ Both modules are self-contained (zero external dependencies)
- ✅ Best fix path identified: Restore both AI files
- ✅ Dependency closure verified (no explosion risk)
- ✅ Ready for implementation pass

**Errors After This Fix**:
- **Current**: 4 real production errors
- **After AI Fix**: 2 real production errors (50% reduction)
- **Remaining Error Families**:
  1. SIA News Content Generation (1 error) - intentionally excluded (dependency explosion)
  2. Signature Mismatch (1 error) - publishing-service argument count

**Next Verification Target**: Signature Mismatch error (1 error) or evaluate if content-generation should be restored

---

## APPENDIX: Dependency Graph

```
AI Cluster Self-Contained Files:

lib/ai/quota-guard.ts (92 lines)
└── ZERO external dependencies ✅
    (Uses only: Map, Date, Math, console)

lib/ai/workspace-io.ts (180 lines)
├── fs/promises (Node.js built-in) ✅
└── path (Node.js built-in) ✅
```

**Restoration Order**:
1. `lib/ai/quota-guard.ts` (no dependencies)
2. `lib/ai/workspace-io.ts` (no dependencies)

Both files can be restored in parallel - no interdependencies.

---

**Verification Complete** ✅  
**Ready for Implementation**: YES  
**Recommended Action**: Proceed to AI Files Restoration Pass
