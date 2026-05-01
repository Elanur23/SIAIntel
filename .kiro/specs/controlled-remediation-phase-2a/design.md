# Design Document

## 1. Overview

Controlled Remediation Phase 2A establishes a **pure, deterministic, read-only remediation suggestion generator** that maps existing audit and validation findings into structured `RemediationSuggestion` objects and returns a `RemediationPlan`.

**Key Characteristics:**
- **Read-Only:** The generator only reads findings; it does not modify any input data
- **Pure Function:** No side effects, no mutations, deterministic output for given input
- **Advisory Only:** Suggestions are metadata for human review; they are not applied automatically
- **Fail-Closed:** All safety invariants from Phase 1 are preserved
- **No Integration:** Phase 2A does not integrate with Warroom UI, API routes, or deployment systems

**What Phase 2A Does:**
- Reads findings from Global Governance Audit and Panda Intake Validator
- Maps findings to appropriate `RemediationCategory` values
- Generates structured `RemediationSuggestion` objects with safety metadata
- Assembles suggestions into a `RemediationPlan` with correct counts
- Returns a valid plan (empty if no findings)

**What Phase 2A Does NOT Do:**
- Apply suggestions to draft content
- Modify vault or article content
- Unlock publish gates
- Trigger deployments
- Modify audit or validation systems
- Integrate with Warroom UI
- Create API routes
- Make network calls or LLM calls
- Write to filesystem (except creating the 2 implementation files)

---

## 2. Architecture

### Module Structure

```
lib/editorial/
  ├── remediation-types.ts          (Phase 1 - already exists)
  └── remediation-engine.ts          (Phase 2A - to be created)

scripts/
  ├── verify-remediation-engine.ts   (Phase 1 - already exists)
  └── verify-remediation-generator.ts (Phase 2A - to be created)
```

### Component Responsibilities

**`lib/editorial/remediation-engine.ts`** (Pure Generator Module)
- Exports public API functions for generating remediation plans
- Implements deterministic mapping logic from findings to suggestions
- Provides internal helper functions for safe data access and transformation
- No dependencies on UI, API routes, or runtime systems
- No side effects, no mutations, no network calls

**`scripts/verify-remediation-generator.ts`** (Verification Harness)
- Tests all mapping rules with representative findings
- Validates safety invariants for generated suggestions
- Confirms input immutability
- Verifies correct count calculations
- Ensures no forbidden automation flags
- Exits with code 0 on success, non-zero on failure

### Integration Boundaries

**Phase 2A Does NOT Integrate With:**
- ❌ Warroom UI (`app/admin/warroom/page.tsx`)
- ❌ API routes (`app/api/war-room/*`)
- ❌ Global Governance Audit system (read-only consumer)
- ❌ Panda Intake Validator (read-only consumer)
- ❌ Deploy gates
- ❌ Publish/save systems
- ❌ Database
- ❌ Network services

**Phase 2A Is:**
- ✅ A standalone pure function module
- ✅ Imported and called by future phases (Phase 2B, Phase 3)
- ✅ Testable in isolation
- ✅ Side-effect free

---

## 3. Generator Input Model

### GeneratorInput Interface

```typescript
interface GeneratorInput {
  // Identification
  articleId?: string;
  packageId?: string;
  
  // Audit/Validation Results
  globalAudit?: unknown;              // GlobalAuditResult from global-governance-audit.ts
  pandaValidationErrors?: unknown[];  // PandaValidationError[] from panda-intake-validator.ts
  deployLockReasons?: unknown[];      // Optional deploy lock reasons
  auditResult?: unknown;              // Optional generic audit result (may defer in Phase 2A)
}
```

### Input Handling Rules

**All Fields Optional:**
- Every field in `GeneratorInput` is optional
- Missing fields are treated as "no findings for this category"
- Generator gracefully handles partial input

**Null/Undefined Input:**
- `null` or `undefined` input returns a valid empty `RemediationPlan`
- Empty plan has `publishStillBlocked: true` and `totalIssues: 0`
- No exceptions thrown for missing input

**Malformed Sections:**
- If `globalAudit` is malformed, skip global audit mapping and continue
- If `pandaValidationErrors` is malformed, skip Panda mapping and continue
- Conservative fallback: skip unparseable data rather than crash
- Log warnings (console.warn) for malformed sections

**No Input Mutation:**
- Generator never modifies input parameters
- All data access is read-only
- Internal helpers may create shallow copies for safety

**Type Safety:**
- Use `unknown` type for external data structures
- Validate structure before accessing nested properties
- Use safe access helpers (e.g., `safeString`, `safeArray`)

---

## 4. Exported Functions

### Public API

**`generateRemediationPlan(input: GeneratorInput): RemediationPlan`**
- Main entry point for generating a complete remediation plan
- Combines suggestions from all input sources (global audit, Panda validation, deploy locks)
- Deduplicates suggestions by stable ID if needed
- Calculates all counts (totalIssues, safeSuggestionCount, etc.)
- Calls `validateRemediationPlan()` before returning
- Returns valid empty plan if no findings

**`suggestionsFromGlobalAudit(globalAudit: unknown): RemediationSuggestion[]`**
- Maps Global Governance Audit findings to suggestions
- Iterates through language-specific audit results
- Classifies findings by type (residue, fake verification, parity, etc.)
- Returns empty array if input is malformed or null

**`suggestionsFromPandaValidation(errors: unknown[]): RemediationSuggestion[]`**
- Maps Panda Intake Validator errors to suggestions
- Uses error codes to determine category (RESIDUE_DETECTED, FAKE_VERIFICATION, etc.)
- Preserves `lang` and `field` from error objects
- Returns empty array if input is malformed or null

### Internal Helpers

**Finding Classification:**
- `classifyFinding(finding: unknown): RemediationCategory | null`
  - Determines category based on finding type/message
  - Returns null for unclassifiable findings

**Suggestion Creation:**
- `mapFindingToSuggestion(finding: unknown, source: RemediationSource): RemediationSuggestion | null`
  - Converts a global audit finding to a suggestion
  - Returns null if finding cannot be mapped

- `mapPandaErrorToSuggestion(error: unknown): RemediationSuggestion | null`
  - Converts a Panda validation error to a suggestion
  - Returns null if error cannot be mapped

- `createBaseSuggestion(params: BaseSuggestionParams): RemediationSuggestion`
  - Creates a suggestion with all required fields and safety flags
  - Ensures all fail-closed invariants are set

**Plan Assembly:**
- `buildEmptyPlan(articleId?: string, packageId?: string): RemediationPlan`
  - Returns a valid empty plan with `publishStillBlocked: true`

- `calculatePlanCounts(suggestions: RemediationSuggestion[]): PlanCounts`
  - Calculates totalIssues, safeSuggestionCount, requiresApprovalCount, humanOnlyCount, criticalCount

**Utilities:**
- `stableSuggestionId(articleId: string, finding: unknown): string`
  - Generates deterministic ID using hash of (articleId + finding type + field + language)

- `normalizeSeverity(input: unknown): RemediationSeverity`
  - Converts various severity representations to RemediationSeverity enum

- `safeString(value: unknown, fallback?: string): string`
  - Safely extracts string from unknown value

- `safeArray(value: unknown): unknown[]`
  - Safely extracts array from unknown value

---

## 5. Mapping Strategy

### Deterministic Mapping Rules

**Global Audit Findings → RemediationCategory:**

| Finding Type | Category | Safety Level | suggestedText |
|--------------|----------|--------------|---------------|
| `residueFindings` | `RESIDUE_REMOVAL` | `REQUIRES_HUMAN_APPROVAL` | Templated removal guidance |
| `provenanceFindings` with "verification" or "score" | `FAKE_CLAIM_REMOVAL` | `REQUIRES_HUMAN_APPROVAL` | null or guidance |
| `criticalIssues` with "Deterministic financial" | `DETERMINISTIC_LANGUAGE_NEUTRALIZATION` | `REQUIRES_HUMAN_APPROVAL` | Neutral template guidance |
| `provenanceFindings` with "missing" or "provenance" | `PROVENANCE_REVIEW` | `HUMAN_ONLY` | **null** |
| `criticalIssues` with "missing" or "source" | `SOURCE_REVIEW` | `HUMAN_ONLY` | **null** |
| `parityFindings` | `PARITY_REVIEW` | `HUMAN_ONLY` | **null** |
| `criticalIssues` with "Malformed markdown" | `FORMAT_REPAIR` | `SAFE_FORMAT_ONLY` or `REQUIRES_HUMAN_APPROVAL` | Formatting guidance |
| `warnings` with "Duplicate footer" | `FOOTER_REPAIR` | `REQUIRES_HUMAN_APPROVAL` | Removal guidance |
| Unknown/ambiguous | `HUMAN_REVIEW_REQUIRED` | `HUMAN_ONLY` | null |

**Panda Validation Errors → RemediationCategory:**

| Error Code | Category | Safety Level | suggestedText |
|------------|----------|--------------|---------------|
| `RESIDUE_DETECTED` | `RESIDUE_REMOVAL` | `REQUIRES_HUMAN_APPROVAL` | Templated removal guidance |
| `FAKE_VERIFICATION` | `FAKE_CLAIM_REMOVAL` | `REQUIRES_HUMAN_APPROVAL` | null or guidance |
| `UNSUPPORTED_SCORE` | `FAKE_CLAIM_REMOVAL` | `REQUIRES_HUMAN_APPROVAL` | null or guidance |
| `PROVENANCE_FAILURE` | `PROVENANCE_REVIEW` | `HUMAN_ONLY` | **null** |
| `LANGUAGE_MISSING` | `HUMAN_REVIEW_REQUIRED` | `HUMAN_ONLY` | null |
| `LANGUAGE_MISMATCH` | `HUMAN_REVIEW_REQUIRED` | `HUMAN_ONLY` | null |
| `FOOTER_INTEGRITY_FAILURE` | `FOOTER_REPAIR` | `REQUIRES_HUMAN_APPROVAL` | Repair guidance |
| `MALFORMED_JSON` | `HUMAN_REVIEW_REQUIRED` | `HUMAN_ONLY` | null |

### Conservative Fallback

**When a finding cannot be confidently mapped:**
- Category: `HUMAN_REVIEW_REQUIRED`
- Safety Level: `HUMAN_ONLY`
- suggestedText: `null`
- Rationale: "Unable to classify finding; human review required"

---

## 6. suggestedText Rules

### Safe Text Generation Guidelines

**Allowed Categories for suggestedText:**

1. **FORMAT_REPAIR**
   - May provide deterministic formatting guidance
   - Example: "Remove extra whitespace" or "Fix markdown syntax"
   - No factual content, only formatting instructions

2. **RESIDUE_REMOVAL**
   - May provide templated removal guidance when `originalText` is available
   - Example: "Remove residual text: [excerpt]"
   - Must be deterministic (no LLM calls)

3. **LENGTH_ADJUSTMENT**
   - May provide deterministic truncation only if safe
   - Example: "Truncate to 150 characters"
   - Only for non-factual truncation

4. **DETERMINISTIC_LANGUAGE_NEUTRALIZATION**
   - May provide neutral template guidance (not factual rewrite)
   - Example: "Replace deterministic claim with neutral language"
   - Must not fabricate new facts

### Forbidden suggestedText

**Categories that MUST have suggestedText === null:**

1. **PROVENANCE_REVIEW**
   - Cannot suggest provenance data (would be fabrication)
   - Human must manually verify and add provenance

2. **SOURCE_REVIEW**
   - Cannot suggest source attribution (would be fabrication)
   - Human must manually verify and add sources

3. **PARITY_REVIEW**
   - Cannot suggest numeric corrections (would be fabrication)
   - Human must manually verify correct values

### Fabrication Prohibitions

**Never Fabricate:**
- ❌ Sources or source attribution
- ❌ Provenance data or verification metadata
- ❌ E-E-A-T credentials or expert qualifications
- ❌ Facts or factual claims
- ❌ Numeric data or statistics
- ❌ Quotes or attributions

**No LLM Calls:**
- All suggestedText must use deterministic templates
- No calls to OpenAI, Anthropic, or other LLM services
- No dynamic text generation beyond template substitution

---

## 7. Safety Invariants

### Fail-Closed Flags (Every Suggestion)

**Automation Prohibition Flags:**
```typescript
cannotAutoPublish: true    // MUST always be true
cannotAutoCommit: true     // MUST always be true
cannotAutoPush: true       // MUST always be true
cannotAutoDeploy: true     // MUST always be true
```

**Human Approval:**
```typescript
requiresHumanApproval: true  // Default true, except strict SAFE_FORMAT_ONLY
```

**Draft Application:**
```typescript
// HUMAN_ONLY and FORBIDDEN_TO_AUTOFIX:
canApplyToDraft: false

// Other safety levels:
canApplyToDraft: true (but still requires approval)
```

### Safety Validation

**Before Adding to Plan:**
- Call `assertNoForbiddenAutomation(suggestion)` for every suggestion
- Throws if any safety invariant is violated
- Ensures fail-closed design is maintained

**Before Returning Plan:**
- Call `validateRemediationPlan(plan)` before returning
- Validates `publishStillBlocked === true`
- Validates counts match actual suggestions
- Validates all suggestions pass safety checks

### RemediationPlan Safety

**publishStillBlocked:**
```typescript
publishStillBlocked: true  // Literal type true, not boolean
```

- Remediation suggestions **never** unlock publish gates
- Publish decisions remain controlled by existing audit systems
- Generator is advisory only

---

## 8. RemediationPlan Assembly

### Plan Construction Process

**Step 1: Collect Suggestions**
```typescript
const globalSuggestions = suggestionsFromGlobalAudit(input.globalAudit);
const pandaSuggestions = suggestionsFromPandaValidation(input.pandaValidationErrors);
const allSuggestions = [...globalSuggestions, ...pandaSuggestions];
```

**Step 2: Deduplicate (if needed)**
```typescript
// Deduplicate by stable ID if same finding appears in multiple sources
const uniqueSuggestions = deduplicateById(allSuggestions);
```

**Step 3: Calculate Counts**
```typescript
const counts = calculatePlanCounts(uniqueSuggestions);
// Returns: { totalIssues, safeSuggestionCount, requiresApprovalCount, humanOnlyCount, criticalCount }
```

**Step 4: Assemble Plan**
```typescript
const plan: RemediationPlan = {
  articleId: input.articleId,
  packageId: input.packageId,
  suggestions: uniqueSuggestions,
  totalIssues: counts.totalIssues,
  safeSuggestionCount: counts.safeSuggestionCount,
  requiresApprovalCount: counts.requiresApprovalCount,
  humanOnlyCount: counts.humanOnlyCount,
  criticalCount: counts.criticalCount,
  createdAt: new Date().toISOString(),
  publishStillBlocked: true  // Literal true
};
```

**Step 5: Validate**
```typescript
validateRemediationPlan(plan);  // Throws if invalid
return plan;
```

### Empty Plan Handling

**When no findings exist:**
```typescript
return {
  articleId: input.articleId,
  packageId: input.packageId,
  suggestions: [],
  totalIssues: 0,
  safeSuggestionCount: 0,
  requiresApprovalCount: 0,
  humanOnlyCount: 0,
  criticalCount: 0,
  createdAt: new Date().toISOString(),
  publishStillBlocked: true
};
```

---

## 9. Verification Script Design

### Test Cases (scripts/verify-remediation-generator.ts)

**Test 1: Empty Input**
- Input: `null`, `undefined`, or `{}`
- Expected: Valid empty plan with `publishStillBlocked: true` and `totalIssues: 0`

**Test 2: Residue Finding**
- Input: Global audit with `residueFindings`
- Expected: `RESIDUE_REMOVAL` suggestion with correct safety flags

**Test 3: Fake Verification**
- Input: Global audit with provenance finding containing "verification"
- Expected: `FAKE_CLAIM_REMOVAL` suggestion

**Test 4: Deterministic Finance**
- Input: Global audit with critical issue containing "Deterministic financial"
- Expected: `DETERMINISTIC_LANGUAGE_NEUTRALIZATION` suggestion

**Test 5: Missing Source**
- Input: Global audit with critical issue containing "missing" and "source"
- Expected: `SOURCE_REVIEW` suggestion with `suggestedText: null`

**Test 6: Missing Provenance**
- Input: Global audit with provenance finding containing "missing" or "provenance"
- Expected: `PROVENANCE_REVIEW` suggestion with `suggestedText: null`

**Test 7: Numeric Parity**
- Input: Global audit with `parityFindings`
- Expected: `PARITY_REVIEW` suggestion with `suggestedText: null`

**Test 8: Panda RESIDUE_DETECTED**
- Input: Panda error with code `RESIDUE_DETECTED`
- Expected: `RESIDUE_REMOVAL` suggestion

**Test 9: Panda FAKE_VERIFICATION**
- Input: Panda error with code `FAKE_VERIFICATION`
- Expected: `FAKE_CLAIM_REMOVAL` suggestion

**Test 10: Deploy/Process Blocker**
- Input: `deployLockReasons` array
- Expected: `HUMAN_REVIEW_REQUIRED` suggestions (if implemented)

**Test 11: Input Immutability**
- Input: Object with nested properties
- Action: Call `generateRemediationPlan(input)`
- Expected: Input object unchanged (deep equality check)

**Test 12: Counts Correctness**
- Input: Mixed findings
- Expected: All counts match actual suggestion categories

**Test 13: No Forbidden Automation**
- Input: Any findings
- Expected: All suggestions have `cannotAutoPublish/Commit/Push/Deploy: true`

### Output Format

**On Success:**
```
✓ Test 1: Empty Input
✓ Test 2: Residue Finding
...
✓ Test 13: No Forbidden Automation

All 13 tests passed

CONTROLLED_REMEDIATION_GENERATOR_VERIFICATION_PASS
```

**Exit Code:** 0

**On Failure:**
```
✓ Test 1: Empty Input
✗ Test 2: Residue Finding - Expected category RESIDUE_REMOVAL, got HUMAN_REVIEW_REQUIRED
...

2 test(s) failed

CONTROLLED_REMEDIATION_GENERATOR_VERIFICATION_FAIL
```

**Exit Code:** 1

---

## 10. Error Handling

### Safe Access Helpers

**`safeString(value: unknown, fallback = ''): string`**
```typescript
// Safely extract string from unknown value
// Returns fallback if value is not a string
```

**`safeArray(value: unknown): unknown[]`**
```typescript
// Safely extract array from unknown value
// Returns empty array if value is not an array
```

**`safeObject(value: unknown): Record<string, unknown> | null`**
```typescript
// Safely extract object from unknown value
// Returns null if value is not an object
```

### Normalization Helpers

**`normalizeSeverity(input: unknown): RemediationSeverity`**
```typescript
// Converts various severity representations to RemediationSeverity enum
// Fallback: RemediationSeverity.WARNING
```

**`normalizeCategory(input: unknown): RemediationCategory | null`**
```typescript
// Converts various category representations to RemediationCategory enum
// Returns null if unrecognized
```

### Error Handling Strategy

**Skip Malformed Findings:**
- If a single finding cannot be parsed, skip it and continue
- Log warning: `console.warn('Skipping malformed finding:', finding)`
- Do not throw exception

**Graceful Degradation:**
- If entire `globalAudit` is malformed, skip global audit mapping
- If entire `pandaValidationErrors` is malformed, skip Panda mapping
- Return partial plan with available suggestions

**No Exceptions for Normal Input:**
- Generator should not throw for malformed external data
- Only throw for programming errors (e.g., Phase 1 type violations)

**Optional Warning Collection:**
```typescript
// Internal tracking (not exposed in Phase 2A)
const warnings: string[] = [];
if (malformedFinding) {
  warnings.push('Skipped malformed finding');
}
```

---

## 11. File Boundaries

### Files to Create (Phase 2A Implementation)

**`lib/editorial/remediation-engine.ts`**
- Pure generator module
- Exports: `generateRemediationPlan`, `suggestionsFromGlobalAudit`, `suggestionsFromPandaValidation`
- Internal helpers for mapping and safety

**`scripts/verify-remediation-generator.ts`**
- Verification harness with 13+ test cases
- Exits with code 0 on success, non-zero on failure
- Prints `CONTROLLED_REMEDIATION_GENERATOR_VERIFICATION_PASS` on success

### Files NOT to Modify

**Warroom UI:**
- ❌ `app/admin/warroom/page.tsx`

**Audit/Validation Systems:**
- ❌ `lib/editorial/global-governance-audit.ts`
- ❌ `lib/editorial/panda-intake-validator.ts`
- ❌ `lib/neural-assembly/sia-sentinel-core.ts`

**API Routes:**
- ❌ `app/api/war-room/*`
- ❌ Any publish/save routes

**Build Artifacts:**
- ❌ `public/sw.js`
- ❌ `tsconfig.tsbuildinfo`

### Import Restrictions

**Allowed Imports:**
- ✅ `lib/editorial/remediation-types.ts` (Phase 1 types)
- ✅ Node.js built-ins (e.g., `crypto` for hashing)
- ✅ TypeScript type utilities

**Forbidden Imports:**
- ❌ React or Next.js UI components
- ❌ `app/admin/warroom/page.tsx`
- ❌ API route handlers
- ❌ Database clients
- ❌ Network libraries (axios, fetch wrappers)
- ❌ LLM clients (OpenAI, Anthropic)

---

## 12. Testing Strategy

### Validation Commands

**Phase 1 Verification (Regression Check):**
```bash
npx tsx scripts/verify-remediation-engine.ts
```
- Expected: 8/8 tests pass
- Confirms Phase 1 types still work

**Phase 2A Verification:**
```bash
npx tsx scripts/verify-remediation-generator.ts
```
- Expected: 13+ tests pass
- Confirms generator mapping correctness

**Type Checking:**
```bash
npm run type-check
```
- Expected: No compilation errors
- Confirms TypeScript correctness

**Existing System Regression:**
```bash
npx tsx scripts/verify-global-audit.ts
npx tsx scripts/verify-panda-intake.ts
```
- Expected: All tests pass
- Confirms no regressions in existing systems

### Test Execution Order

1. `npm run type-check` - Compile-time validation
2. `npx tsx scripts/verify-remediation-engine.ts` - Phase 1 regression
3. `npx tsx scripts/verify-remediation-generator.ts` - Phase 2A validation
4. `npx tsx scripts/verify-global-audit.ts` - Global audit regression
5. `npx tsx scripts/verify-panda-intake.ts` - Panda validator regression

**All must pass before Phase 2A is considered complete.**

---

## 13. Security and Governance

### Advisory-Only Design

**Phase 2A Suggestions Do NOT:**
- ❌ Unlock publish gates
- ❌ Modify vault content
- ❌ Modify article content
- ❌ Trigger deployments
- ❌ Bypass audit systems
- ❌ Auto-apply fixes
- ❌ Auto-commit changes
- ❌ Auto-push to git
- ❌ Auto-deploy to production

**Phase 2A Suggestions ARE:**
- ✅ Advisory metadata for human review
- ✅ Structured proposals for remediation
- ✅ Input for future phases (Phase 2B UI, Phase 3 Apply to Draft)

### Human Approval Mandatory

**All Remediation Actions Require Human Approval:**
- Viewing suggestions (Phase 2B - future)
- Applying to draft (Phase 3 - future)
- Publishing (existing audit systems)
- Deploying (existing deploy gates)

**Generator Cannot:**
- Make decisions on behalf of humans
- Bypass existing governance
- Unlock any gates or permissions

### No Runtime Integration

**Phase 2A Does Not Integrate With:**
- Warroom UI (no operator interface yet)
- API routes (no HTTP endpoints)
- Database (no persistence)
- Publish systems (no publish triggers)
- Deploy systems (no deployment triggers)

**Phase 2A Is:**
- A standalone pure function module
- Callable by future phases
- Testable in isolation

---

## 14. Future Phases

### Phase 2B: Warroom Read-Only Suggestions Preview

**Goal:** Display remediation suggestions in Warroom UI

**Scope:**
- Add `RemediationPanel` component to Warroom
- Display suggestions grouped by category
- Show safety metadata (requiresHumanApproval, canApplyToDraft)
- Read-only view (no Apply to Draft yet)
- Call `generateRemediationPlan()` from Phase 2A

**Out of Scope:**
- Applying suggestions to draft
- Modifying vault content

### Phase 3: Apply to Draft with Human Approval

**Goal:** Allow operators to apply approved suggestions to draft content

**Scope:**
- Add "Apply to Draft" button for applicable suggestions
- Require explicit human approval before application
- Modify draft content in Warroom vault
- Re-run audit after application
- Audit trail for applied suggestions

**Out of Scope:**
- Auto-publish
- Auto-commit
- Auto-deploy

### Phase 4: Re-Audit and Audit Trail

**Goal:** Track remediation history and re-validate after fixes

**Scope:**
- Store applied suggestions in database
- Track who approved and when
- Re-run Global Governance Audit after fixes
- Show before/after comparison
- Audit trail for compliance

### Phase 5: SEO/Publish-Quality Remediation Expansion

**Goal:** Expand remediation categories for SEO and publish quality

**Scope:**
- SEO_DESCRIPTION_REWRITE suggestions
- HEADLINE_REWRITE suggestions
- RISK_NOTE_ADDITION suggestions
- LENGTH_ADJUSTMENT for SEO optimization
- Still requires human approval

---

## Implementation Notes

### Deterministic ID Generation

Use a stable hash function for suggestion IDs:

```typescript
import crypto from 'crypto';

function stableSuggestionId(
  articleId: string,
  category: string,
  field: string,
  language: string
): string {
  const input = `${articleId}:${category}:${field}:${language}`;
  return crypto.createHash('sha256').update(input).digest('hex').substring(0, 16);
}
```

### Template Examples

**RESIDUE_REMOVAL:**
```typescript
suggestedText: `Remove residual text: "${originalText.substring(0, 50)}..."`
rationale: "Detected editorial residue from previous version"
```

**FORMAT_REPAIR:**
```typescript
suggestedText: "Remove extra whitespace and fix markdown syntax"
rationale: "Malformed markdown prefixes detected"
```

**DETERMINISTIC_LANGUAGE_NEUTRALIZATION:**
```typescript
suggestedText: "Replace deterministic claim with neutral language (e.g., 'may', 'could', 'according to')"
rationale: "Deterministic financial prediction detected"
```

### Conservative Confidence Scoring

```typescript
// Never exceed 0.95 for automated mappings
const confidence = category === RemediationCategory.FORMAT_REPAIR ? 0.90 : 0.75;
```

---

## Success Criteria

Phase 2A is complete when:

- ✅ `lib/editorial/remediation-engine.ts` exists with all exports
- ✅ `scripts/verify-remediation-generator.ts` exists with 13+ tests
- ✅ `npm run type-check` passes
- ✅ `npx tsx scripts/verify-remediation-engine.ts` passes (8/8 - Phase 1)
- ✅ `npx tsx scripts/verify-remediation-generator.ts` passes (13+ tests)
- ✅ `npx tsx scripts/verify-global-audit.ts` passes (no regressions)
- ✅ `npx tsx scripts/verify-panda-intake.ts` passes (no regressions)
- ✅ Git status shows only 2 new files
- ✅ No source files modified
- ✅ All safety invariants preserved
- ✅ Generator is pure and deterministic
- ✅ No LLM calls, no network calls, no file mutations
