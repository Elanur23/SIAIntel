# Design Document

## 1. Overview

Controlled Autonomous Remediation Phase 1 establishes a **types-only foundation** for structured content remediation in the Warroom system. This phase creates a fail-closed remediation data contract without implementing any runtime behavior, UI components, or automated fix application.

**Phase 1 Deliverables:**
- `lib/editorial/remediation-types.ts` - Pure TypeScript type definitions and helper functions
- `scripts/verify-remediation-engine.ts` - Automated verification script for safety invariants

**What Phase 1 Does NOT Include:**
- No Warroom UI modifications
- No Apply to Draft functionality
- No runtime remediation generator
- No vault content mutation
- No audit behavior changes
- No deploy gate modifications
- No Panda import changes
- No publish/save/API route changes
- No auto-fix, auto-publish, auto-commit, auto-push, or auto-deploy capabilities

This phase ensures all remediation remains human-controlled and fail-closed by design.

## 2. Architecture

### 2.1 Module Structure

```
lib/editorial/
  └── remediation-types.ts    # Pure type contract module (no runtime logic)

scripts/
  └── verify-remediation-engine.ts    # Invariant verification script
```

### 2.2 Design Principles

**remediation-types.ts:**
- Pure TypeScript type definitions (enums, interfaces, type aliases)
- Pure helper functions (no side effects, no mutations, no I/O)
- No network calls, no file system access, no database queries
- No integration with existing audit/validation systems
- Exports only types and pure utility functions

**verify-remediation-engine.ts:**
- Standalone verification script
- No network access
- No file system mutations
- No external service calls (no git, no Vercel, no publish APIs)
- Validates type system correctness and safety invariants
- Exits with code 0 on success, non-zero on failure

### 2.3 Integration Boundaries

**Phase 1 Has NO Runtime Integration:**
- Does not modify `app/admin/warroom/page.tsx`
- Does not modify `lib/editorial/global-governance-audit.ts`
- Does not modify `lib/editorial/panda-intake-validator.ts`
- Does not modify `lib/neural-assembly/sia-sentinel-core.ts`
- Does not modify any API routes
- Does not modify publish/save routes
- Does not integrate with existing audit systems

**Future Integration (Out of Scope for Phase 1):**
- Phase 2: Read-only remediation suggestion generator
- Phase 3: Suggested Fixes UI in Warroom
- Phase 4: Apply to Draft with human approval workflow
- Phase 5: Re-audit and audit trail

## 3. Type Definitions

### 3.1 RemediationSource Enum

Identifies the origin system that detected the content issue.

```typescript
enum RemediationSource {
  globalAudit = 'globalAudit',
  pandaValidator = 'pandaValidator',
  sentinel = 'sentinel',
  seo = 'seo',
  deployGate = 'deployGate',
  manualReview = 'manualReview'
}
```

### 3.2 RemediationCategory Enum

Classifies the type of remediation action required.

```typescript
enum RemediationCategory {
  RESIDUE_REMOVAL = 'RESIDUE_REMOVAL',
  LENGTH_ADJUSTMENT = 'LENGTH_ADJUSTMENT',
  FAKE_CLAIM_REMOVAL = 'FAKE_CLAIM_REMOVAL',
  DETERMINISTIC_LANGUAGE_NEUTRALIZATION = 'DETERMINISTIC_LANGUAGE_NEUTRALIZATION',
  MISSING_FIELD_GENERATION = 'MISSING_FIELD_GENERATION',
  FOOTER_REPAIR = 'FOOTER_REPAIR',
  RISK_NOTE_ADDITION = 'RISK_NOTE_ADDITION',
  SEO_DESCRIPTION_REWRITE = 'SEO_DESCRIPTION_REWRITE',
  HEADLINE_REWRITE = 'HEADLINE_REWRITE',
  PARITY_REVIEW = 'PARITY_REVIEW',
  PROVENANCE_REVIEW = 'PROVENANCE_REVIEW',
  SOURCE_REVIEW = 'SOURCE_REVIEW',
  FORMAT_REPAIR = 'FORMAT_REPAIR',
  HUMAN_REVIEW_REQUIRED = 'HUMAN_REVIEW_REQUIRED'
}
```

### 3.3 RemediationSafetyLevel Enum

Defines the degree of automation safety for a remediation action.

```typescript
enum RemediationSafetyLevel {
  SAFE_FORMAT_ONLY = 'SAFE_FORMAT_ONLY',
  SAFE_TEXTUAL_SUGGESTION = 'SAFE_TEXTUAL_SUGGESTION',
  REQUIRES_HUMAN_APPROVAL = 'REQUIRES_HUMAN_APPROVAL',
  HUMAN_ONLY = 'HUMAN_ONLY',
  FORBIDDEN_TO_AUTOFIX = 'FORBIDDEN_TO_AUTOFIX'
}
```

**Safety Level Semantics:**
- `SAFE_FORMAT_ONLY`: Formatting changes only (whitespace, punctuation)
- `SAFE_TEXTUAL_SUGGESTION`: Textual suggestions that preserve facts
- `REQUIRES_HUMAN_APPROVAL`: Requires explicit human approval before application
- `HUMAN_ONLY`: Can only be fixed by a human (no draft application allowed)
- `FORBIDDEN_TO_AUTOFIX`: Must never be automatically fixed

### 3.4 RemediationSeverity Enum

Indicates the severity of the issue being remediated.

```typescript
enum RemediationSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}
```

### 3.5 RemediationFixType Enum

Specifies the type of fix operation.

```typescript
enum RemediationFixType {
  remove = 'remove',
  rewrite = 'rewrite',
  truncate = 'truncate',
  expand = 'expand',
  neutralize = 'neutralize',
  format = 'format',
  add_missing_generic_text = 'add_missing_generic_text',
  request_source = 'request_source',
  request_human_review = 'request_human_review'
}
```

### 3.6 RemediationSuggestion Interface

A structured proposal for fixing a specific content issue with comprehensive safety constraints.

```typescript
interface RemediationSuggestion {
  // Identification
  id: string;
  issueId?: string;
  
  // Classification
  source: RemediationSource;
  category: RemediationCategory;
  severity: RemediationSeverity;
  safetyLevel: RemediationSafetyLevel;
  
  // Context
  affectedLanguage?: string;
  affectedField?: string;
  issueType: string;
  issueDescription: string;
  
  // Content
  originalText?: string;
  suggestedText?: string | null;
  rationale: string;
  
  // Fix Metadata
  fixType: RemediationFixType;
  confidence?: number;
  
  // Safety Flags (Fail-Closed Defaults)
  requiresHumanApproval: boolean;
  canApplyToDraft: boolean;
  cannotAutoPublish: boolean;
  cannotAutoCommit: boolean;
  cannotAutoPush: boolean;
  cannotAutoDeploy: boolean;
  
  // Content Integrity Flags
  preservesFacts: boolean;
  preservesNumbers: boolean;
  preservesProvenance: boolean;
  requiresSourceVerification: boolean;
  
  // Validation
  validationTests: string[];
  
  // Audit Trail
  createdAt: string;
  appliedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
}
```

**Field Semantics:**
- `suggestedText`: `null` indicates human-only review required (no automated suggestion possible)
- `canApplyToDraft`: `false` means suggestion cannot be applied even to draft (human must manually edit)
- `cannotAutoPublish/Commit/Push/Deploy`: Must always be `true` (fail-closed)
- `preservesFacts/Numbers/Provenance`: Indicates whether the suggestion maintains content integrity
- `requiresSourceVerification`: Indicates whether the fix requires verified source material

### 3.7 RemediationPlan Interface

A collection of remediation suggestions with publish-blocking status.

```typescript
interface RemediationPlan {
  // Identification
  articleId?: string;
  packageId?: string;
  
  // Suggestions
  suggestions: RemediationSuggestion[];
  
  // Counts
  totalIssues: number;
  safeSuggestionCount: number;
  requiresApprovalCount: number;
  humanOnlyCount: number;
  criticalCount: number;
  
  // Timestamps
  createdAt: string;
  
  // Publish Blocking (Literal Type)
  publishStillBlocked: true;
}
```

**Critical Design Decision:**
- `publishStillBlocked` is typed as literal `true` (not `boolean`)
- This enforces at compile-time that remediation suggestions NEVER unlock publish
- Publish gates remain controlled by existing audit systems
- Remediation is purely advisory and human-controlled

## 4. Helper Functions

All helper functions are pure (no side effects, no mutations, no I/O).

### 4.1 isHumanOnlySuggestion

```typescript
function isHumanOnlySuggestion(suggestion: RemediationSuggestion): boolean
```

Returns `true` if the suggestion has `safetyLevel` of `HUMAN_ONLY` or `FORBIDDEN_TO_AUTOFIX`.

**Invariant:** If this returns `true`, `canApplyToDraft` must be `false`.

### 4.2 requiresApproval

```typescript
function requiresApproval(suggestion: RemediationSuggestion): boolean
```

Returns `true` if the suggestion requires human approval before application.

**Logic:** Returns `suggestion.requiresHumanApproval`.

### 4.3 canOnlySuggest

```typescript
function canOnlySuggest(suggestion: RemediationSuggestion): boolean
```

Returns `true` if the suggestion can only be displayed (not applied to draft).

**Logic:** Returns `!suggestion.canApplyToDraft`.

### 4.4 assertNoForbiddenAutomation

```typescript
function assertNoForbiddenAutomation(suggestion: RemediationSuggestion): void
```

Throws an error if the suggestion violates fail-closed safety invariants.

**Checks:**
- `cannotAutoPublish` must be `true`
- `cannotAutoCommit` must be `true`
- `cannotAutoPush` must be `true`
- `cannotAutoDeploy` must be `true`
- If `safetyLevel` is `HUMAN_ONLY` or `FORBIDDEN_TO_AUTOFIX`, `canApplyToDraft` must be `false`

### 4.5 validateRemediationPlan

```typescript
function validateRemediationPlan(plan: RemediationPlan): void
```

Validates that a remediation plan satisfies all safety invariants.

**Checks:**
- `publishStillBlocked` must be `true`
- `totalIssues` must equal `suggestions.length`
- Counts must match actual suggestion categories/safety levels
- All suggestions must pass `assertNoForbiddenAutomation`

## 5. Safety Invariants

### 5.1 Fail-Closed Automation Flags

**All RemediationSuggestion objects MUST have:**
- `cannotAutoPublish === true`
- `cannotAutoCommit === true`
- `cannotAutoPush === true`
- `cannotAutoDeploy === true`

**Rationale:** Remediation suggestions are purely advisory. They never trigger automated publishing, committing, pushing, or deployment.

### 5.2 Publish Blocking

**RemediationPlan.publishStillBlocked MUST be literal type `true`.**

**Rationale:** Remediation suggestions do not unlock publish gates. Publish decisions remain controlled by existing audit systems (global-governance-audit, panda-intake-validator, sia-sentinel-core).

### 5.3 Human-Only Suggestions

**If `safetyLevel` is `HUMAN_ONLY` or `FORBIDDEN_TO_AUTOFIX`:**
- `canApplyToDraft` MUST be `false`
- `suggestedText` SHOULD be `null` (no automated suggestion)

**Rationale:** Some issues cannot be safely automated and require human judgment.

### 5.4 Provenance and Source Integrity

**For categories `PROVENANCE_REVIEW` and `SOURCE_REVIEW`:**
- `safetyLevel` MUST be `HUMAN_ONLY` or `FORBIDDEN_TO_AUTOFIX`
- `suggestedText` MUST be `null`
- `requiresSourceVerification` MUST be `true`

**Rationale:** Source attribution and provenance data must never be fabricated. Missing sources require human research and verification.

### 5.5 Numeric Parity

**For category `PARITY_REVIEW`:**
- `safetyLevel` MUST be `HUMAN_ONLY`
- `suggestedText` MUST be `null`

**Rationale:** Numeric mismatches require human verification against authoritative sources. Automated numeric "fixes" risk introducing factual errors.

### 5.6 Forbidden Content Generation

**The system MUST NOT generate:**
- E-E-A-T credentials (expertise, authoritativeness, trustworthiness claims)
- Source attribution (must be verified by humans)
- Provenance data (must be verified by humans)
- Factual claims without verified sources
- Numeric data without verified sources

**Rationale:** Editorial integrity requires human verification of all factual content.

### 5.7 Human Approval Default

**`requiresHumanApproval` MUST default to `true` unless:**
- `safetyLevel` is `SAFE_FORMAT_ONLY` AND
- `category` is `FORMAT_REPAIR`

**Rationale:** Fail-closed design requires explicit human approval for all non-trivial changes.

## 6. Verification Script Design

### 6.1 Script Structure

```
scripts/verify-remediation-engine.ts
├── Import types and helpers from lib/editorial/remediation-types.ts
├── Define test cases
├── Run assertions
├── Collect failures
├── Print results
└── Exit with appropriate code
```

### 6.2 Required Test Cases

#### Test Case 1: Residue Removal Suggestion
- `category`: `RESIDUE_REMOVAL`
- `safetyLevel`: `REQUIRES_HUMAN_APPROVAL`
- `requiresHumanApproval`: `true`
- `cannotAutoPublish/Commit/Push/Deploy`: `true`

#### Test Case 2: Formatting-Only Suggestion
- `category`: `FORMAT_REPAIR`
- `safetyLevel`: `SAFE_FORMAT_ONLY`
- `canApplyToDraft`: may be `true`
- `cannotAutoPublish/Commit/Push/Deploy`: must still be `true`

#### Test Case 3: Fake Verification Removal
- `category`: `FAKE_CLAIM_REMOVAL`
- `requiresHumanApproval`: `true`
- `preservesProvenance`: `true` OR `requiresSourceVerification`: `true`
- `cannotAutoPublish`: `true`

#### Test Case 4: Deterministic Finance Neutralization
- `category`: `DETERMINISTIC_LANGUAGE_NEUTRALIZATION`
- `requiresHumanApproval`: `true`
- `preservesFacts`: `false` OR `requiresSourceVerification`: `true`
- `cannotAutoPublish`: `true`

#### Test Case 5: Missing Provenance/Source
- `category`: `PROVENANCE_REVIEW` OR `SOURCE_REVIEW`
- `safetyLevel`: `HUMAN_ONLY` OR `FORBIDDEN_TO_AUTOFIX`
- `canApplyToDraft`: `false`
- `suggestedText`: `null`
- `requiresSourceVerification`: `true`

#### Test Case 6: Numeric Parity Mismatch
- `category`: `PARITY_REVIEW`
- `safetyLevel`: `HUMAN_ONLY`
- `canApplyToDraft`: `false`
- `suggestedText`: `null`

#### Test Case 7: RemediationPlan Validation
- `publishStillBlocked`: must be `true`
- `totalIssues`: must equal `suggestions.length`
- Counts must match actual suggestion categories/safety levels

#### Test Case 8: No Forbidden Automation
- Assert every sample suggestion has:
  - `cannotAutoPublish === true`
  - `cannotAutoCommit === true`
  - `cannotAutoPush === true`
  - `cannotAutoDeploy === true`

### 6.3 Assertion Helper

```typescript
function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures.push(message);
  }
}
```

### 6.4 Output Format

**On Success:**
```
CONTROLLED_REMEDIATION_TYPES_VERIFICATION_PASS
✓ Test Case 1: Residue Removal Suggestion
✓ Test Case 2: Formatting-Only Suggestion
✓ Test Case 3: Fake Verification Removal
✓ Test Case 4: Deterministic Finance Neutralization
✓ Test Case 5: Missing Provenance/Source
✓ Test Case 6: Numeric Parity Mismatch
✓ Test Case 7: RemediationPlan Validation
✓ Test Case 8: No Forbidden Automation

All 8 test cases passed.
```

**On Failure:**
```
CONTROLLED_REMEDIATION_TYPES_VERIFICATION_FAILED

✗ Test Case 5: Missing Provenance/Source
  - Expected canApplyToDraft to be false, got true

1 test case(s) failed.
```

### 6.5 Exit Codes

- Exit code `0`: All tests passed
- Exit code `1`: One or more tests failed

### 6.6 Constraints

The verification script MUST NOT:
- Access the network
- Mutate files
- Call publish APIs
- Call git commands
- Call Vercel CLI
- Modify Warroom vault
- Integrate with existing audit systems

## 7. Files and Boundaries

### 7.1 Files to Create (Phase 1)

1. `lib/editorial/remediation-types.ts`
   - All type definitions (enums, interfaces)
   - All helper functions
   - JSDoc documentation for safety invariants

2. `scripts/verify-remediation-engine.ts`
   - Verification script with all test cases
   - Assertion helpers
   - Output formatting

### 7.2 Files NOT to Modify (Phase 1)

**Warroom UI:**
- `app/admin/warroom/page.tsx`

**Audit Systems:**
- `lib/editorial/global-governance-audit.ts`
- `lib/editorial/panda-intake-validator.ts`
- `lib/neural-assembly/sia-sentinel-core.ts`

**API Routes:**
- `app/api/war-room/save/route.ts`
- `app/api/war-room/feed/route.ts`
- `app/api/war-room/workspace/route.ts`
- Any other API routes

**Generated Files:**
- `public/sw.js`
- `tsconfig.tsbuildinfo`
- `.next/*`

**Documentation:**
- No markdown documentation files in Phase 1

### 7.3 Git Status Expectation

After Phase 1 implementation:
```
?? lib/editorial/remediation-types.ts
?? scripts/verify-remediation-engine.ts
```

Only 2 new files should appear in `git status`.

## 8. Testing Strategy

### 8.1 Type Checking

```bash
npm run type-check
```

**Expected Result:** No TypeScript compilation errors.

### 8.2 Verification Script

```bash
npx tsx scripts/verify-remediation-engine.ts
```

**Expected Result:** 
- Exit code 0
- Output: `CONTROLLED_REMEDIATION_TYPES_VERIFICATION_PASS`
- All 8 test cases pass

### 8.3 Existing Verification Scripts

Run existing verification scripts to ensure no regressions:

```bash
npx tsx scripts/verify-global-audit.ts
npx tsx scripts/verify-panda-intake.ts
```

**Expected Result:** Both scripts should pass unchanged (Phase 1 does not modify audit systems).

### 8.4 Build Verification (Optional)

```bash
npm run build
```

**Expected Result:** Build succeeds (Phase 1 adds only types, no runtime changes).

## 9. Security and Governance

### 9.1 Phase 1 Cannot Unlock Deploy

Remediation suggestions are purely advisory. They do not:
- Bypass deploy gates
- Override audit scores
- Unlock publish workflows
- Modify content in vault
- Trigger automated deployments

**Publish decisions remain controlled by:**
- `lib/editorial/global-governance-audit.ts`
- `lib/editorial/panda-intake-validator.ts`
- `lib/neural-assembly/sia-sentinel-core.ts`
- Existing deploy gate logic

### 9.2 Phase 1 Cannot Auto-Apply Fixes

Phase 1 provides only type definitions. It does not:
- Implement Apply to Draft functionality
- Mutate article content
- Modify Warroom vault
- Auto-apply suggestions
- Generate remediation suggestions at runtime

### 9.3 Phase 1 Cannot Auto-Publish

All suggestions have `cannotAutoPublish === true`. Phase 1 does not:
- Trigger publish workflows
- Commit changes to git
- Push to remote repositories
- Deploy to Vercel
- Modify CI/CD pipelines

### 9.4 Fail-Closed Design

Phase 1 enforces fail-closed design at the type level:
- `publishStillBlocked` is literal type `true` (not `boolean`)
- All automation flags default to "forbidden"
- Human approval is required by default
- Dangerous categories (provenance, source, parity) are human-only

### 9.5 Audit Trail

`RemediationSuggestion` includes audit trail fields:
- `createdAt`: When the suggestion was created
- `appliedAt`: When the suggestion was applied (null in Phase 1)
- `approvedBy`: Who approved the suggestion (null in Phase 1)
- `rejectedAt`: When the suggestion was rejected (null in Phase 1)

These fields support future audit trail requirements but are not used in Phase 1.

## 10. Future Phases

### 10.1 Phase 2: Read-Only Remediation Generator (Out of Scope)

**Objective:** Generate remediation suggestions from audit results.

**Approach:**
- Read audit results from global-governance-audit, panda-intake-validator, sia-sentinel-core
- Map audit issues to `RemediationSuggestion` objects
- Return `RemediationPlan` with suggestions
- No vault mutation, no draft application

**Integration Points:**
- Import types from `lib/editorial/remediation-types.ts`
- Call existing audit functions
- Generate suggestions based on audit results

### 10.2 Phase 3: Suggested Fixes UI (Out of Scope)

**Objective:** Display remediation suggestions in Warroom UI.

**Approach:**
- Add "Suggested Fixes" panel to Warroom
- Display `RemediationPlan` suggestions
- Show safety levels, rationale, suggested text
- No "Apply" button in Phase 3 (read-only display)

**Integration Points:**
- Import types from `lib/editorial/remediation-types.ts`
- Call Phase 2 remediation generator
- Render suggestions in UI

### 10.3 Phase 4: Apply to Draft with Human Approval (Out of Scope)

**Objective:** Allow human operators to apply suggestions to draft content.

**Approach:**
- Add "Apply to Draft" button for suggestions where `canApplyToDraft === true`
- Require explicit human approval
- Mutate draft content only (not published content)
- Re-run audit after application
- Maintain audit trail

**Safety Constraints:**
- Only suggestions with `canApplyToDraft === true` can be applied
- `HUMAN_ONLY` and `FORBIDDEN_TO_AUTOFIX` suggestions cannot be applied
- Publish gates remain in effect after application
- Re-audit required before publish

### 10.4 Phase 5: Re-Audit and Audit Trail (Out of Scope)

**Objective:** Track remediation history and re-audit after fixes.

**Approach:**
- Populate `appliedAt`, `approvedBy`, `rejectedAt` fields
- Store remediation history in database
- Re-run audit after suggestion application
- Update `RemediationPlan` with new audit results

**Audit Trail:**
- Who applied the suggestion
- When it was applied
- What changed
- New audit score after application

## 11. Implementation Notes

### 11.1 TypeScript Configuration

Use strict TypeScript configuration:
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `strictFunctionTypes: true`

### 11.2 Documentation

All types and functions must have JSDoc comments explaining:
- Purpose
- Safety constraints
- Invariants
- Usage examples

### 11.3 Export Strategy

`lib/editorial/remediation-types.ts` must export:
- All enums
- All interfaces
- All helper functions

Do not export internal implementation details.

### 11.4 No Dependencies

`lib/editorial/remediation-types.ts` should have no external dependencies (except TypeScript standard library).

### 11.5 Verification Script Dependencies

`scripts/verify-remediation-engine.ts` may import:
- Types and helpers from `lib/editorial/remediation-types.ts`
- Node.js standard library (for `process.exit`)

Do not import:
- Network libraries
- File system mutation libraries
- External APIs
- Audit systems

## 12. Success Criteria

Phase 1 is complete when:

1. ✅ `lib/editorial/remediation-types.ts` exists with all types and helpers
2. ✅ `scripts/verify-remediation-engine.ts` exists with all test cases
3. ✅ `npm run type-check` passes without errors
4. ✅ `npx tsx scripts/verify-remediation-engine.ts` exits with code 0
5. ✅ `npx tsx scripts/verify-global-audit.ts` still passes (no regressions)
6. ✅ `npx tsx scripts/verify-panda-intake.ts` still passes (no regressions)
7. ✅ `git status` shows only 2 new files
8. ✅ No source files modified (Warroom UI, audit systems, API routes)
9. ✅ No runtime behavior changed
10. ✅ All safety invariants documented and verified

## 13. Risk Mitigation

### 13.1 Scope Creep Prevention

**Risk:** Phase 1 expands to include runtime remediation or UI.

**Mitigation:** 
- Strict file creation limits (only 2 files)
- Verification script checks for forbidden modifications
- Code review focuses on types-only scope

### 13.2 Safety Invariant Violations

**Risk:** Suggestions bypass fail-closed safety constraints.

**Mitigation:**
- Literal type `true` for `publishStillBlocked`
- Verification script validates all safety flags
- Helper functions enforce invariants

### 13.3 Accidental Runtime Integration

**Risk:** Types accidentally imported into runtime code, triggering premature integration.

**Mitigation:**
- Phase 1 does not modify any existing files
- Types are purely declarative (no runtime logic)
- Future phases will explicitly integrate types

### 13.4 Audit System Regressions

**Risk:** Phase 1 accidentally breaks existing audit systems.

**Mitigation:**
- No modifications to audit system files
- Run existing verification scripts after Phase 1
- Monitor for unexpected behavior

## 14. Conclusion

Controlled Autonomous Remediation Phase 1 establishes a solid, fail-closed foundation for future remediation workflows. By limiting scope to types-only, we ensure:

- No runtime behavior changes
- No accidental automation
- No publish gate bypasses
- No content mutations
- Clear safety contracts for future phases

This design enables safe, incremental development of remediation capabilities while maintaining strict editorial governance and human control.
