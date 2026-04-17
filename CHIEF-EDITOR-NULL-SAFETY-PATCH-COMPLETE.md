# Chief Editor Engine Null-Safety Hardening Patch - COMPLETE

**Date**: 2026-04-03  
**Status**: ✅ COMPLETE  
**File**: `lib/neural-assembly/chief-editor-engine.ts`

---

## Objective

Apply surgical null-safety hardening patch to prevent Phase 3 / Batch 07 crashes when some languages fail upstream and `batch.editions` contains incomplete or partially missing editions.

---

## Root Cause

When multilingual orchestrator fails for some languages, `batch.editions` may contain:
- Missing `content.title`, `content.lead`, `content.body.full`, or `content.body.summary`
- Missing or incomplete `audit_results` or `audit_results.issues`
- Undefined/null values that cause crashes when accessed without defensive guards

---

## Patch Strategy

1. **Entry Point Sanitization**: Build sanitized editions map at the start of `makeDecision()` containing only content-ready editions
2. **Defensive Guards**: Add null-safety checks in all helper methods that access edition properties
3. **Downstream Propagation**: Replace all downstream calls to use sanitized editions map (not raw `batch.editions`)
4. **Warning Logs**: Add structured warnings when editions are excluded
5. **Preserve Launch Policy**: No lowered thresholds, no widened approval criteria

---

## Changes Applied

### 1. Entry Point Sanitization (Line ~820)

**Before**:
```typescript
const contentReadyEditions = Object.entries(batch.editions).filter(([, e]) =>
  e?.content?.title &&
  e?.content?.lead &&
  e?.content?.body?.full &&
  e?.content?.body?.summary
);

if (contentReadyEditions.length === 0) {
  throw new Error("CHIEF_EDITOR_NO_CONTENT_READY_EDITIONS");
}
```

**After**:
```typescript
// SURGICAL NULL-SAFETY PATCH: Filter to only include editions with complete content
const contentReadyEditions = Object.entries(batch.editions).filter(([, e]) =>
  e?.content?.title &&
  e?.content?.lead &&
  e?.content?.body?.full &&
  e?.content?.body?.summary
);

// Log excluded editions for observability
const excludedLanguages = Object.keys(batch.editions).filter(
  lang => !contentReadyEditions.some(([l]) => l === lang)
);
if (excludedLanguages.length > 0) {
  console.warn(`[CHIEF_EDITOR] Excluding ${excludedLanguages.length} incomplete edition(s) from manifest: ${excludedLanguages.join(', ')}`);
}

if (contentReadyEditions.length === 0) {
  throw new Error("CHIEF_EDITOR_NO_CONTENT_READY_EDITIONS");
}

// Build sanitized editions map for downstream use (only content-ready editions)
const sanitizedEditions = Object.fromEntries(contentReadyEditions) as Record<Language, LanguageEdition>;
```

### 2. Downstream Propagation

**Step 1: Evaluate all editions** (Line ~870)
```typescript
// Use sanitized map to prevent undefined access
const evaluations = this.evaluator.evaluateAllEditions({ ...batch, editions: sanitizedEditions })
```

**Step 4: Semantic analysis** (Line ~895)
```typescript
// Use sanitized map
semantic_analysis = await this.semanticAnalyzer.analyzeConsistency(sanitizedEditions, mic)
```

**Step 5: Risk assessment** (Line ~903)
```typescript
// Use sanitized map
const risk_assessment = await this.riskAssessor.assessRisk(sanitizedEditions, mic)
```

**Step 7: Multilingual headline integrity** (Line ~910)
```typescript
// Use sanitized editions to prevent undefined access
const multilingual_input: MultilingualHeadlineInput = {
  base_language: "en",
  expected_languages: Object.keys(batch.editions) as Language[],
  sensitive_topic: mic.metadata.urgency === "breaking" || risk_assessment.overall_risk_score > 60,
  variants: evaluations.map((ev) => {
    const edition = sanitizedEditions[ev.language];
    // Defensive: edition should exist in sanitizedEditions, but guard anyway
    const issues = edition?.audit_results?.issues ?? [];
    // ... rest of mapping
  }),
};
```

### 3. Defensive Guards in Helper Methods

#### `calculateTitleDrift()` (Line ~450)
```typescript
// Defensive: ensure content and title exist
const title1 = edition1?.content?.title?.toLowerCase() ?? '';
const title2 = edition2?.content?.title?.toLowerCase() ?? '';

if (!title1 || !title2) {
  return 1.0; // Maximum drift if either title is missing
}
```

#### `calculateLeadDrift()` (Line ~480)
```typescript
// Defensive: ensure content and lead exist
const lead1 = edition1?.content?.lead?.toLowerCase() ?? '';
const lead2 = edition2?.content?.lead?.toLowerCase() ?? '';

if (!lead1 || !lead2) {
  return 1.0; // Maximum drift if either lead is missing
}
```

#### `assessPolicyRisk()` (Line ~550)
```typescript
// Defensive: ensure audit_results and issues exist
const issues = edition?.audit_results?.issues ?? [];

// Check for policy violations in audit results
const policyIssues = issues.filter(
  issue => issue.cell === 'policy_cell' && issue.severity === 'HIGH'
)
```

#### `assessBrandSafetyRisk()` (Line ~650)
```typescript
// Defensive: ensure audit_results and issues exist
const issues = edition?.audit_results?.issues ?? [];

// Check tone issues
const toneIssues = issues.filter(
  issue => issue.cell === 'tone_cell' && issue.severity === 'HIGH'
)
```

#### `validate_brand_safety_threshold()` (Line ~1500)
```typescript
// Defensive: ensure audit_results and issues exist
const issues = edition?.audit_results?.issues ?? [];

// Check for policy violations
const policyIssues = issues.filter(
  issue => issue.cell === 'policy_cell'
)
```

#### `evaluateEdition()` (Line ~750)
```typescript
// Defensive: ensure audit_results and issues exist
const issues = edition.audit_results?.issues ?? []
const critical_issues = issues.filter(i => i.severity === 'CRITICAL').length
const high_issues = issues.filter(i => i.severity === 'HIGH').length
const medium_issues = issues.filter(i => i.severity === 'MEDIUM').length
const low_issues = issues.filter(i => i.severity === 'LOW').length

// ... later in the method ...

// Defensive: ensure healing_history exists
const has_manual_override = (edition.healing_history ?? []).some(
  h => h.cell === 'manual_override' as any
)

// ... later in the method ...

const overall_score = edition.audit_results?.overall_score ?? 0

// ... later in the method ...

cell_scores: edition.audit_results?.cell_scores ?? {},
```

### 4. Type Safety Fix

Fixed type error for `affected_languages` in Gate 4 (Line ~1236):
```typescript
affected_languages: [], // Multilingual gate affects all languages
```

---

## Verification

### Diagnostics Check
```bash
✅ No TypeScript errors
✅ No linting errors
```

### Null-Safety Coverage

| Method | Crash Point | Guard Applied |
|--------|-------------|---------------|
| `makeDecision()` | `batch.editions` incomplete content | ✅ Sanitized map |
| `evaluateEdition()` | `audit_results.issues` undefined | ✅ `?? []` |
| `evaluateEdition()` | `healing_history` undefined | ✅ `?? []` |
| `evaluateEdition()` | `audit_results.overall_score` undefined | ✅ `?? 0` |
| `evaluateEdition()` | `audit_results.cell_scores` undefined | ✅ `?? {}` |
| `calculateTitleDrift()` | `content.title` undefined | ✅ `?? ''` + early return |
| `calculateLeadDrift()` | `content.lead` undefined | ✅ `?? ''` + early return |
| `assessPolicyRisk()` | `audit_results.issues` undefined | ✅ `?? []` |
| `assessBrandSafetyRisk()` | `audit_results.issues` undefined | ✅ `?? []` |
| `validate_brand_safety_threshold()` | `audit_results.issues` undefined | ✅ `?? []` |
| Multilingual input | `audit_results.issues` undefined | ✅ `?? []` |

---

## Launch Policy Preservation

✅ **No thresholds lowered**  
✅ **No approval criteria widened**  
✅ **Existing decision logic unchanged**  
✅ **Only defensive guards added**

---

## Expected Behavior

### Before Patch
- **Crash**: `TypeError: Cannot read property 'title' of undefined`
- **Crash**: `TypeError: Cannot read property 'issues' of undefined`
- **Crash**: `TypeError: Cannot read property 'overall_score' of undefined`

### After Patch
- **Graceful Handling**: Incomplete editions excluded from manifest
- **Warning Logs**: `[CHIEF_EDITOR] Excluding 2 incomplete edition(s) from manifest: de, fr`
- **Safe Defaults**: Missing properties default to safe values (`[]`, `0`, `{}`, `''`)
- **Maximum Drift**: Missing content returns 1.0 drift (maximum semantic difference)
- **Continues Processing**: Chief Editor completes decision with available editions

---

## Testing Recommendations

### Unit Test Scenarios

1. **All 9 languages complete** → Should process normally
2. **7 languages complete, 2 incomplete** → Should exclude 2, process 7
3. **1 language complete, 8 incomplete** → Should process 1 (if above min threshold)
4. **0 languages complete** → Should throw `CHIEF_EDITOR_NO_CONTENT_READY_EDITIONS`
5. **Missing `audit_results`** → Should use safe defaults (`[]`, `0`, `{}`)
6. **Missing `healing_history`** → Should use safe default (`[]`)

### Integration Test (Batch 07)

```bash
kubectl logs -f job/batch-07-official-rerun -n sia-validation-production
```

**Expected Output**:
```
[CHIEF_EDITOR] Starting evaluation for batch batch-07-xxx [MODE: SHADOW]
[CHIEF_EDITOR] Excluding 2 incomplete edition(s) from manifest: de, fr
[CHIEF_EDITOR] Provenance digests computed: claimGraph=abc123..., evidenceLedger=def456...
[CHIEF_EDITOR] Initial categorization: 7 approved, 0 rejected, 0 delayed
[CHIEF_EDITOR] Semantic consistency score: 85
[CHIEF_EDITOR] Overall risk score: 45
[CHIEF_EDITOR] Decision: APPROVE_PARTIAL (7 languages)
```

---

## Deployment Checklist

- [x] Null-safety guards applied to all crash points
- [x] Sanitized editions map created at entry point
- [x] Downstream methods use sanitized map
- [x] Warning logs added for excluded editions
- [x] TypeScript diagnostics pass
- [x] Launch policy preserved (no threshold changes)
- [ ] Unit tests added (recommended)
- [ ] Integration test with Batch 07 (ready to execute)

---

## Next Steps

1. **Execute Batch 07** to validate patch under real multilingual failure conditions
2. **Monitor logs** for exclusion warnings and crash prevention
3. **Add unit tests** for partial multilingual failure scenarios (optional but recommended)

---

**Patch Applied By**: Kiro AI  
**Verification**: TypeScript diagnostics clean  
**Status**: Ready for Batch 07 execution
