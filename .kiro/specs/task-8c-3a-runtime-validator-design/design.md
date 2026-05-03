# Design Document: Task 8C-3A-1 Pure Runtime Validator Design Lock

## Overview

Task 8C-3A-1 establishes the formal design contract for the first pure runtime validator in the canonical re-audit subsystem. This is a **design-only specification** that defines the validator's interface, behavior, and constraints without implementing runtime code.

The pure runtime validator is a foundational component that will validate already-existing registration preview assessment-like input and return a validation result only. It represents the first movement from type-only/verification-only artifacts (Tasks 8C-1 through 8C-2F) toward future runtime validation.

**Key Design Principles:**
1. **Pure**: No side effects, no I/O, no network calls, no persistence
2. **Synchronous**: No async/await, no Promises, no callbacks
3. **Deterministic**: Same input always produces same output
4. **Non-mutating**: Input remains unchanged after validation
5. **Fail-closed**: Invalid input returns structured errors, never silent passes
6. **Human-led**: AI is a system layer; humans select, review, and approve publication

---

## Architecture

### Validator Position in System

```
┌─────────────────────────────────────────────────────────────┐
│                   Human Editorial Operator                  │
│              (selects story, reviews, approves)              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ (human decision)
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Pure Runtime Validator (8C-3A-1)               │
│                                                              │
│  Input: Registration Preview Assessment-like object         │
│  Output: Validation result (valid, errors, warnings, safety)│
│  Behavior: Inspect only, no mutations, no persistence       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ (validation result)
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Human Approval Workflow                         │
│         (review validation result, make decision)            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ (human approval)
                         │
┌────────────────────────▼────────────────────────────────────┐
│         Future: Registration/Promotion/Publication          │
│              (only after human approval)                     │
└─────────────────────────────────────────────────────────────┘
```

### Validator Scope Boundaries

**VALIDATOR DOES:**
- Inspect already-existing registration preview assessment-like input
- Validate required fields are present and valid
- Detect safety invariant violations
- Return structured errors and warnings
- Return readonly validation result

**VALIDATOR DOES NOT:**
- Build or create registration preview assessment objects
- Create preview objects
- Create assessment objects
- Register anything
- Promote anything
- Persist anything (vault, session, globalAudit)
- Unlock deploy
- Call API, database, or provider
- Interact with UI, handlers, adapters, or hooks
- Perform autonomous AI publication or approval
- Override human-led approval workflows

---

## Validator Contract

### Function Signature (Conceptual)

```typescript
// Conceptual signature (not implemented yet)
function validateCanonicalReAuditRegistrationPreviewAssessment(
  input: unknown
): readonly ValidationResult
```

**Characteristics:**
- **Pure**: No side effects
- **Synchronous**: No async/await, no Promises
- **Deterministic**: Same input → same output
- **Non-mutating**: Input unchanged
- **Fail-closed**: Invalid input → structured errors

### Input Contract

**Input Type:** `unknown` (defensive, fail-closed)

**Expected Input Structure** (not required, but typical):
```typescript
interface RegistrationPreviewAssessmentLike {
  // Core fields
  articleId?: string;
  title?: string;
  summary?: string;
  editorialDirection?: string;
  
  // Safety flags
  safetyFlags?: readonly string[];
  deployUnlockAllowed?: boolean;
  persistenceAllowed?: boolean;
  sessionAuditInheritanceAllowed?: boolean;
  
  // Metadata
  createdAt?: string;
  createdBy?: string;
  
  // Other fields as needed
  [key: string]: unknown;
}
```

**Input Validation Rules:**
- Missing required fields → `MISSING_REQUIRED_FIELD` error
- Invalid field types → `INVALID_KIND` error
- Unexpected fields → `UNUSUAL_FIELD_VALUE` warning (non-blocking)
- `deployUnlockAllowed: true` → `FORBIDDEN_DEPLOY_FIELD` error
- `persistenceAllowed: true` → `FORBIDDEN_PERSISTENCE_FIELD` error
- `sessionAuditInheritanceAllowed: true` → `FORBIDDEN_MUTATION_FIELD` error

### Output Contract

**Output Type:** `readonly ValidationResult`

```typescript
interface ValidationResult {
  readonly valid: boolean;
  readonly errors: readonly StructuredError[];
  readonly warnings: readonly StructuredWarning[];
  readonly safety: readonly SafetyFlag[];
}

interface StructuredError {
  readonly category: ErrorCategory;
  readonly code: string;
  readonly message: string;
  readonly field?: string;
  readonly remediation?: string;
}

interface StructuredWarning {
  readonly category: WarningCategory;
  readonly code: string;
  readonly message: string;
  readonly field?: string;
}

type SafetyFlag = 
  | 'DEPLOY_UNLOCK_FORBIDDEN'
  | 'PERSISTENCE_FORBIDDEN'
  | 'MUTATION_FORBIDDEN'
  | string; // extensible for future safety flags

type ErrorCategory =
  | 'MISSING_REQUIRED_FIELD'
  | 'INVALID_KIND'
  | 'INVALID_SAFETY_INVARIANT'
  | 'INVALID_BOUNDARY_INVARIANT'
  | 'INVALID_CHAIN_REFERENCE'
  | 'UNSAFE_RUNTIME_FIELD'
  | 'FORBIDDEN_MUTATION_FIELD'
  | 'FORBIDDEN_DEPLOY_FIELD'
  | 'FORBIDDEN_PERSISTENCE_FIELD';

type WarningCategory =
  | 'UNUSUAL_FIELD_VALUE'
  | 'DEPRECATED_FIELD'
  | 'MISSING_OPTIONAL_FIELD'
  | 'SUSPICIOUS_PATTERN';
```

**Output Semantics:**
- `valid: true` → All required fields present and valid, no fail-closed errors
- `valid: false` → At least one required field missing or invalid, or fail-closed error present
- `errors: []` → No fail-closed errors (only if `valid === true`)
- `errors: [...]` → Fail-closed errors present (only if `valid === false`)
- `warnings: [...]` → Non-blocking warnings (may be present even if `valid === true`)
- `safety: [...]` → Always contains at least `DEPLOY_UNLOCK_FORBIDDEN`, `PERSISTENCE_FORBIDDEN`, `MUTATION_FORBIDDEN`

---

## Error Model

### Error Categories

#### 1. MISSING_REQUIRED_FIELD
- **Trigger**: Required field not present in input
- **Example**: `title` field missing
- **Remediation**: "Provide a title for the article"
- **Fail-Closed**: Yes (blocks validation)

#### 2. INVALID_KIND
- **Trigger**: Field has wrong type or kind
- **Example**: `title` is a number instead of string
- **Remediation**: "Title must be a string"
- **Fail-Closed**: Yes (blocks validation)

#### 3. INVALID_SAFETY_INVARIANT
- **Trigger**: Safety flag has invalid value
- **Example**: `deployUnlockAllowed` is not a boolean
- **Remediation**: "Deploy unlock flag must be a boolean"
- **Fail-Closed**: Yes (blocks validation)

#### 4. INVALID_BOUNDARY_INVARIANT
- **Trigger**: Boundary constraint violated
- **Example**: `title` length exceeds maximum
- **Remediation**: "Title must be less than 500 characters"
- **Fail-Closed**: Yes (blocks validation)

#### 5. INVALID_CHAIN_REFERENCE
- **Trigger**: Reference to non-existent entity
- **Example**: `articleId` references non-existent article
- **Remediation**: "Article ID must reference an existing article"
- **Fail-Closed**: Yes (blocks validation)

#### 6. UNSAFE_RUNTIME_FIELD
- **Trigger**: Field should not exist at runtime
- **Example**: `_internalState` field present
- **Remediation**: "Remove internal state fields"
- **Fail-Closed**: Yes (blocks validation)

#### 7. FORBIDDEN_MUTATION_FIELD
- **Trigger**: Field indicates mutation intent
- **Example**: `mutationToken` field present
- **Remediation**: "Validator does not support mutations"
- **Fail-Closed**: Yes (blocks validation)

#### 8. FORBIDDEN_DEPLOY_FIELD
- **Trigger**: Field indicates deploy unlock intent
- **Example**: `deployUnlockAllowed: true`
- **Remediation**: "Deploy unlock is forbidden"
- **Fail-Closed**: Yes (blocks validation)

#### 9. FORBIDDEN_PERSISTENCE_FIELD
- **Trigger**: Field indicates persistence intent
- **Example**: `persistenceAllowed: true`
- **Remediation**: "Persistence is forbidden"
- **Fail-Closed**: Yes (blocks validation)

### Warning Categories

#### 1. UNUSUAL_FIELD_VALUE
- **Trigger**: Field value is unusual but valid
- **Example**: `title` is very long (but within limits)
- **Blocking**: No (non-blocking warning)

#### 2. DEPRECATED_FIELD
- **Trigger**: Field is deprecated but still accepted
- **Example**: `legacyFormat` field present
- **Blocking**: No (non-blocking warning)

#### 3. MISSING_OPTIONAL_FIELD
- **Trigger**: Optional field not present
- **Example**: `editorialNotes` field missing
- **Blocking**: No (non-blocking warning)

#### 4. SUSPICIOUS_PATTERN
- **Trigger**: Field value matches suspicious pattern
- **Example**: `title` contains suspicious characters
- **Blocking**: No (non-blocking warning)

---

## Safety Invariants

### Core Safety Invariants

#### 1. DEPLOY_UNLOCK_FORBIDDEN
- **Invariant**: Deploy remains locked after validation
- **Enforcement**: 
  - Input with `deployUnlockAllowed: true` → error
  - Result always includes this flag
- **Rationale**: Prevent accidental deploy unlock

#### 2. PERSISTENCE_FORBIDDEN
- **Invariant**: No persistence to vault, session, or globalAudit
- **Enforcement**:
  - Input with `persistenceAllowed: true` → error
  - Result always includes this flag
- **Rationale**: Prevent accidental state mutation

#### 3. MUTATION_FORBIDDEN
- **Invariant**: Input remains unchanged after validation
- **Enforcement**:
  - Input with `mutationToken` → error
  - Result always includes this flag
- **Rationale**: Prevent accidental input mutation

### Verification of Safety Invariants

A future verification script SHALL check:
1. Validator does not mutate input
2. Validator does not call mutation-related functions
3. Validator does not access global state
4. Validator does not perform I/O
5. Validator result always includes safety flags

---

## Purity Contract

### Pure Function Characteristics

**The validator SHALL be pure:**

1. **No Side Effects**
   - Does not mutate input
   - Does not mutate external state
   - Does not modify global variables
   - Does not modify closures

2. **Synchronous**
   - No `async`/`await`
   - No `Promise` usage
   - No callbacks
   - No event listeners

3. **Deterministic**
   - Same input → same output
   - No random values
   - No timestamps
   - No external dependencies

4. **No I/O**
   - No file reads/writes
   - No network calls
   - No database queries
   - No API calls

5. **No Persistence**
   - No `localStorage`/`sessionStorage`
   - No vault writes
   - No session writes
   - No globalAudit writes

6. **No System Calls**
   - No `fs` module
   - No `child_process` module
   - No system commands

7. **No UI Integration**
   - No UI library imports
   - No handler imports
   - No adapter imports
   - No hook imports

### Verification of Purity

A future verification script SHALL check:
1. No `async`/`await` keywords
2. No `Promise` usage
3. No `fetch`, `axios`, `prisma`, `turso`, `libsql` calls
4. No `localStorage`/`sessionStorage` access
5. No `fs`/`child_process` usage
6. No UI/handler/adapter/hook imports
7. No mutation tokens in function names
8. No builder/factory/generator patterns
9. Returns result only (no object creation except result)
10. Does not modify closed 8C files

---

## Boundary Invariants

### Validator Boundaries

**The validator SHALL NOT:**

1. **Create Objects**
   - No `new` keyword (except for result structure)
   - No object literals (except for result structure)
   - No builder patterns
   - No factory patterns
   - No generator patterns

2. **Call Functions**
   - Only pure utility functions allowed
   - No builder functions
   - No factory functions
   - No generator functions
   - No async functions

3. **Access Global State**
   - No `globalAudit` access
   - No `vault` access
   - No `session` access
   - No global variables

4. **Import Modules**
   - No imports from `lib/` (except types and pure utils)
   - No imports from `app/`
   - No imports from `components/`
   - No handler imports
   - No adapter imports
   - No hook imports

5. **Modify Closed Files**
   - No changes to existing 8C verification scripts
   - No changes to existing 8C adapters
   - No changes to existing 8C handlers
   - No changes to existing 8C types

### Verification of Boundaries

A future verification script SHALL check:
1. No object creation (except result structure)
2. No function calls (except pure utils)
3. No global state access
4. No forbidden module imports
5. No closed file modifications

---

## Verification Plan

### Phase 1: Design Verification (Task 8C-3A-1)

**Deliverable**: This design document

**Verification Steps**:
1. Design document is complete and approved
2. Validator contract is formally defined
3. Error model is comprehensive
4. Safety invariants are clear
5. Purity contract is explicit
6. Boundary invariants are defined
7. Verification plan is ready for implementation

### Phase 2: Design Review (Task 8C-3A-2)

**Deliverable**: Design review and approval

**Review Criteria**:
1. Validator contract is clear and unambiguous
2. Error model covers all fail-closed cases
3. Safety invariants are sufficient
4. Purity contract is verifiable
5. Boundary invariants are enforceable
6. Verification plan is feasible

### Phase 3: Implementation (Task 8C-3A-3+)

**Deliverable**: Pure validator implementation

**Implementation Verification**:
1. Validator is pure (no side effects, no I/O, no persistence)
2. Validator is synchronous (no async/await, no Promises)
3. Validator is deterministic (same input → same output)
4. Validator does not mutate input
5. Validator enforces safety invariants
6. Validator is fail-closed (invalid input → structured errors)
7. Validator does not create preview/assessment objects
8. Validator does not modify closed 8C files

### Verification Scripts (Future Implementation)

#### Script 1: Purity Verification
- **Path**: `scripts/verify-8c-3a-validator-purity.ts`
- **Purpose**: Verify validator is pure
- **Checks**:
  - No async/Promise usage
  - No fetch/axios/prisma/turso/libsql calls
  - No localStorage/sessionStorage access
  - No fs/child_process usage
  - No UI/handler/adapter/hook imports
  - No mutation tokens in function names
  - No builder/factory/generator patterns

#### Script 2: Boundary Verification
- **Path**: `scripts/verify-8c-3a-validator-boundaries.ts`
- **Purpose**: Verify validator stays within boundaries
- **Checks**:
  - No object creation (except result structure)
  - No function calls (except pure utils)
  - No global state access
  - No forbidden module imports
  - No closed file modifications

#### Script 3: Safety Invariant Verification
- **Path**: `scripts/verify-8c-3a-validator-safety.ts`
- **Purpose**: Verify validator enforces safety invariants
- **Checks**:
  - `deployUnlockAllowed: true` input rejected
  - `persistenceAllowed: true` input rejected
  - `sessionAuditInheritanceAllowed: true` input rejected
  - Result always contains safety flags
  - Input remains unchanged after validation

#### Script 4: Contract Verification
- **Path**: `scripts/verify-8c-3a-validator-contract.ts`
- **Purpose**: Verify validator implements contract
- **Checks**:
  - Accepts `unknown` input
  - Returns readonly result
  - Result contains `valid`, `errors`, `warnings`, `safety`
  - Error categories are correct
  - Warning categories are correct
  - Safety flags are correct

---

## Risk Register

### Risk 1: Validator Becoming a Builder

**Risk**: Validator implementation gradually adds object creation logic, becoming a builder instead of a validator.

**Likelihood**: Medium (scope creep is common)

**Impact**: High (violates core design principle)

**Mitigation**:
- Boundary verification script checks for object creation
- Code review focuses on purity
- Design lock prevents scope creep
- Verification scripts run in CI/CD

**Detection**: Boundary verification script fails

---

### Risk 2: Validator Mutating Input

**Risk**: Validator implementation accidentally mutates input during validation.

**Likelihood**: Medium (easy to miss in code review)

**Impact**: High (violates core design principle)

**Mitigation**:
- Purity verification script checks for mutations
- Input is passed as `readonly`
- Code review focuses on immutability
- Unit tests verify input unchanged

**Detection**: Purity verification script fails

---

### Risk 3: UI Wiring Too Early

**Risk**: Validator is wired into UI before design review is complete, creating pressure to add UI-related logic.

**Likelihood**: Low (design lock prevents this)

**Impact**: High (violates core design principle)

**Mitigation**:
- Design lock (Task 8C-3A-1) prevents implementation
- Design review (Task 8C-3A-2) must approve before implementation
- No UI imports allowed in validator
- Boundary verification script checks for UI imports

**Detection**: Boundary verification script fails

---

### Risk 4: Legal Compliance Mixed Too Early

**Risk**: Validator implementation adds country-law compliance logic, mixing concerns.

**Likelihood**: Low (requirements explicitly separate this)

**Impact**: Medium (violates separation of concerns)

**Mitigation**:
- Requirements explicitly separate compliance
- Verification plan does not include compliance checks
- Compliance is addressed in separate design phase
- Code review focuses on scope boundaries

**Detection**: Code review identifies compliance logic

---

### Risk 5: Panda/SIA Integration Too Early

**Risk**: Validator implementation adds Panda/SIA protocol logic, mixing concerns.

**Likelihood**: Low (requirements explicitly separate this)

**Impact**: Medium (violates separation of concerns)

**Mitigation**:
- Requirements explicitly separate protocol integration
- Verification plan does not include protocol checks
- Protocol integration is addressed in separate design phase
- Code review focuses on scope boundaries

**Detection**: Code review identifies protocol logic

---

### Risk 6: Verification Scripts Insufficient

**Risk**: Verification scripts do not catch violations of design principles.

**Likelihood**: Low (verification plan is comprehensive)

**Impact**: High (design principles not enforced)

**Mitigation**:
- Verification scripts are comprehensive
- Multiple verification scripts check different aspects
- Code review validates verification scripts
- Verification scripts run in CI/CD

**Detection**: Verification scripts fail or are bypassed

---

## Jurisdictional Compliance Sequencing

### Current Phase (Task 8C-3A-1)

**What We Do**: Define pure validator contract

**What We Don't Do**: Include country-law compliance logic

### Future Phase (Separate Design/Deep-Research - NOT AUTHORIZED YET)

**What We Will Do**:
- Define compliance validation rules
- Map compliance requirements to validator input
- Design compliance result integration
- Plan compliance gate implementation

**When**: After validator design is stable and approved

### Integration Sequence

```
Task 8C-3A-1: Pure Validator Design Lock
         ↓
Task 8C-3A-2: Design Review & Approval
         ↓
Task 8C-3A-3+: Pure Validator Implementation
         ↓
[Separate Phase]: Jurisdictional Compliance Design
         ↓
[Separate Phase]: Compliance Integration Design
         ↓
[Future]: Compliance-Aware Validator (if needed)
```

**Rationale**: Core validator design must be stable before compliance logic is added. Compliance is a separate concern that should not pollute core validator design.

---

## Panda/SIA Protocol Sequencing

### Current Phase (Task 8C-3A-1)

**What We Do**: Define pure validator contract

**What We Don't Do**: Include Panda/SIA protocol logic

### Future Phase (Separate Design/Pilot - NOT AUTHORIZED YET)

**What We Will Do**:
- Define Panda editorial protocol integration
- Define SIA governance protocol integration
- Design protocol result integration
- Plan protocol gate implementation

**When**: After validator design is stable and approved

### Integration Sequence

```
Task 8C-3A-1: Pure Validator Design Lock
         ↓
Task 8C-3A-2: Design Review & Approval
         ↓
Task 8C-3A-3+: Pure Validator Implementation
         ↓
[Separate Phase]: Panda/SIA Protocol Design
         ↓
[Separate Phase]: Protocol Integration Design
         ↓
[Future]: Protocol-Aware Validator (if needed)
```

**Rationale**: Core validator design must be stable before protocol logic is added. Protocol integration is a separate concern that should not pollute core validator design.

---

## Readiness Estimation

### Internal Test Article Readiness

**Criteria**:
- Validator design is locked and approved (Task 8C-3A-1) ✓
- **Implementation is NOT authorized.**
- Validator is implemented (Future Phase)
- Verification scripts pass (Future Phase)
- Unit tests pass (Future Phase)
- Internal test article can be validated (Future Phase)

**Timeline**: After future implementation phase

**Blockers**: Implementation authorization

### Live Public Article Readiness

**Criteria**:
- Validator is implemented and verified
- Jurisdictional compliance is addressed
- Panda/SIA protocol is integrated
- Human approval workflow is in place
- Legal review is complete
- Editorial policy is finalized
- Live public article can be validated and published

**Timeline**: After compliance and protocol integration phases

**Blockers**: 
- Implementation authorization
- Jurisdictional compliance design and implementation
- Panda/SIA protocol design and implementation
- Legal review and approval
- Editorial policy finalization

---

## Success Criteria

1. ✓ Design document is complete and comprehensive
2. ✓ Validator contract is formally defined (input, output, errors, warnings, safety invariants)
3. ✓ Verification plan is defined and ready for implementation
4. ✓ No implementation code is written (design-only phase)
5. ✓ No runtime behavior is created
6. ✓ No lib/, app/, or component changes are made
7. ✓ Design enables internal test article readiness (after implementation)
8. ✓ Design enables future implementation without scope creep
9. ✓ Risk register identifies and mitigates key risks
10. ✓ Jurisdictional compliance and Panda/SIA protocol are sequenced separately

---

## Next Steps

### Immediate (Task 8C-3A-1 CLOSED_PASS)

1. **Design Approval Recorded**: Task 8C-3A-1 is marked as DESIGN_APPROVED.
2. **Implementation Deferred**: Implementation and CI/CD integration are NOT authorized.
3. **Wait for Authorization**: Awaiting formal authorization for future implementation phases.

### Future (NOT AUTHORIZED YET)

1. **Task 8C-3A-3+ Implementation**: Implementation of pure validator.
2. **CI/CD Integration**: Integration of verification scripts into CI/CD.
3. **Jurisdictional Compliance**: Design and implementation of compliance gates.
4. **Panda/SIA Protocol**: Design and implementation of protocol integration.

---

**Document Version**: 1.0.0  
**Author**: SIA Intelligence Systems  
**Date**: 2026-05-02  
**Task**: 8C-3A-1 - Pure Runtime Validator Design Lock  
**Status**: DESIGN_APPROVED / CLOSED_PASS (No Implementation Authorized)

