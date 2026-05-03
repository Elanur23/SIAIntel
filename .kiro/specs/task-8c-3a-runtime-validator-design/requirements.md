# Requirements Document: Task 8C-3A-1 Pure Runtime Validator Design Lock

## Introduction

Task 8C-3A-1 establishes the design contract for the first pure runtime validator in the canonical re-audit subsystem. This is a **design-only phase** that defines what a future pure validator SHALL do, without implementing runtime behavior.

The pure runtime validator is a foundational component that will validate already-existing registration preview assessment-like input and return a validation result only. It is **not** a builder, **not** a creator, **not** a mutator, and **not** a persistence layer.

This design lock precedes any implementation. **Implementation (Task 8C-3A-3+) is a separate phase that is NOT authorized by this design approval.** The validator is designed to be:

- **Pure**: No side effects, no I/O, no network calls, no persistence
- **Synchronous**: No async/await, no Promises, no callbacks
- **Deterministic**: Same input always produces same output
- **Non-mutating**: Input remains unchanged after validation
- **Fail-closed**: Invalid input returns structured errors, never silent passes
- **Human-led**: AI is a system layer; humans select, review, and approve publication

## Glossary

- **Pure Validator**: A synchronous function that inspects input and returns a validation result only.
- **Registration Preview Assessment**: A structured object representing a proposed article registration state (title, summary, editorial direction, safety flags, etc.).
- **Validation Result**: A readonly object containing `valid: boolean`, `errors: readonly StructuredError[]`, `warnings: readonly StructuredWarning[]`, and `safety: readonly SafetyFlag[]`.
- **Structured Error**: A fail-closed error with category, code, message, and optional remediation hint.
- **Structured Warning**: A non-blocking warning with category, code, and message.
- **Safety Flag**: A readonly safety invariant (e.g., `DEPLOY_UNLOCK_FORBIDDEN`, `PERSISTENCE_FORBIDDEN`).
- **Design Lock**: A formal specification of the validator contract before implementation begins.
- **Human-Led Approval**: Editorial decision-making remains with human operators; AI provides analysis only.
- **Jurisdictional Compliance**: Country-law compliance gates (e.g., content moderation, legal review) are separate from core validator design.
- **Panda/SIA Protocol**: Editorial protocol integration (e.g., Panda editorial workflow, SIA governance) is separate from core validator design.

---

## Requirements

### Requirement 1: Validator Purpose and Scope

**User Story:** As a system architect, I want a clear definition of what the pure runtime validator does and does not do, so that implementation stays within safe boundaries.

#### Acceptance Criteria

1. THE Validator SHALL inspect already-existing registration preview assessment-like input.
2. THE Validator SHALL return a validation result only (no mutations, no state creation, no persistence).
3. THE Validator SHALL NOT build or create a registration preview assessment object.
4. THE Validator SHALL NOT create a preview object.
5. THE Validator SHALL NOT create an assessment object.
6. THE Validator SHALL NOT register anything.
7. THE Validator SHALL NOT promote anything.
8. THE Validator SHALL NOT persist anything to vault, session, or globalAudit.
9. THE Validator SHALL NOT unlock deploy.
10. THE Validator SHALL NOT call any API, database, or provider.
11. THE Validator SHALL NOT interact with UI, handlers, adapters, or hooks.
12. THE Validator SHALL NOT perform autonomous AI publication or approval.
13. THE Validator SHALL NOT override human-led approval workflows.

---

### Requirement 2: Validator Purity Contract

**User Story:** As a verification engineer, I want a formal contract that guarantees the validator is pure, so that I can verify it has no side effects.

#### Acceptance Criteria

1. THE Validator function SHALL be synchronous (no async/await, no Promises, no callbacks).
2. THE Validator function SHALL be deterministic (same input always produces same output).
3. THE Validator function SHALL not mutate its input parameter.
4. THE Validator function SHALL not mutate any external state (no global variables, no closures).
5. THE Validator function SHALL not perform I/O (no file reads/writes, no network calls, no database queries).
6. THE Validator function SHALL not call `fetch`, `axios`, `prisma`, `turso`, `libsql`, or any HTTP client.
7. THE Validator function SHALL not access `localStorage`, `sessionStorage`, or any browser storage.
8. THE Validator function SHALL not use `fs`, `child_process`, or any Node.js system modules.
9. THE Validator function SHALL not import UI libraries, handler modules, adapter modules, or hook modules.
10. THE Validator function SHALL not use builder patterns, factory patterns, or generator patterns.
11. THE Validator function SHALL return a readonly validation result only.

---

### Requirement 3: Validator Input Contract

**User Story:** As a validator consumer, I want a clear definition of what input the validator accepts, so that I can prepare data correctly.

#### Acceptance Criteria

1. THE Validator SHALL accept an input parameter of type `unknown` or `readonly unknown` (defensive, fail-closed).
2. THE Validator input MAY be a plain object representing a registration preview assessment-like structure.
3. THE Validator input MAY contain fields such as:
   - `articleId: string` (article identifier)
   - `title: string` (article title)
   - `summary: string` (article summary)
   - `editorialDirection: string` (editorial guidance)
   - `safetyFlags: readonly string[]` (safety invariants)
   - `deployUnlockAllowed: boolean` (deploy unlock flag)
   - `persistenceAllowed: boolean` (persistence flag)
   - `sessionAuditInheritanceAllowed: boolean` (session inheritance flag)
   - Other fields as needed for validation
4. THE Validator SHALL NOT require exact TypeScript type matching at input boundary (defensive).
5. THE Validator SHALL treat missing fields as validation errors (fail-closed).
6. THE Validator SHALL treat unexpected fields as warnings (non-blocking).

---

### Requirement 4: Validator Output Contract

**User Story:** As a validator consumer, I want a clear definition of what the validator returns, so that I can handle results correctly.

#### Acceptance Criteria

1. THE Validator SHALL return a readonly validation result object.
2. THE Validator result SHALL contain:
   - `valid: boolean` (true if all required fields present and valid, false otherwise)
   - `errors: readonly StructuredError[]` (fail-closed errors, empty if valid)
   - `warnings: readonly StructuredWarning[]` (non-blocking warnings, may be non-empty even if valid)
   - `safety: readonly SafetyFlag[]` (safety invariants, always present)
3. THE Validator result `valid` field SHALL be `true` only if:
   - All required fields are present
   - All required fields have valid values
   - No fail-closed errors are present
4. THE Validator result `valid` field SHALL be `false` if:
   - Any required field is missing
   - Any required field has invalid value
   - Any fail-closed error is present
5. THE Validator result `errors` array SHALL be empty if `valid === true`.
6. THE Validator result `warnings` array MAY be non-empty even if `valid === true`.
7. THE Validator result `safety` array SHALL always contain at least:
   - `DEPLOY_UNLOCK_FORBIDDEN` (deploy remains locked)
   - `PERSISTENCE_FORBIDDEN` (no vault/session/globalAudit writes)
   - `MUTATION_FORBIDDEN` (input remains unchanged)

---

### Requirement 5: Validator Error Model

**User Story:** As a validator consumer, I want a clear definition of error categories, so that I can handle different error types appropriately.

#### Acceptance Criteria

1. THE Validator SHALL define conservative, fail-closed error categories:
   - `MISSING_REQUIRED_FIELD` (required field not present)
   - `INVALID_KIND` (field has wrong type or kind)
   - `INVALID_SAFETY_INVARIANT` (safety flag has invalid value)
   - `INVALID_BOUNDARY_INVARIANT` (boundary constraint violated)
   - `INVALID_CHAIN_REFERENCE` (reference to non-existent entity)
   - `UNSAFE_RUNTIME_FIELD` (field should not exist at runtime)
   - `FORBIDDEN_MUTATION_FIELD` (field indicates mutation intent)
   - `FORBIDDEN_DEPLOY_FIELD` (field indicates deploy unlock intent)
   - `FORBIDDEN_PERSISTENCE_FIELD` (field indicates persistence intent)
2. EACH error SHALL contain:
   - `category: string` (error category from above list)
   - `code: string` (specific error code, e.g., `MISSING_TITLE`)
   - `message: string` (human-readable error message)
   - `field?: string` (field name if applicable)
   - `remediation?: string` (optional hint for fixing the error)
3. THE Validator SHALL use error categories consistently across all validation checks.
4. THE Validator SHALL provide remediation hints for common errors (e.g., "Title must be at least 10 characters").

---

### Requirement 6: Validator Warning Model

**User Story:** As a validator consumer, I want non-blocking warnings, so that I can alert operators to potential issues without blocking validation.

#### Acceptance Criteria

1. THE Validator SHALL define warning categories:
   - `UNUSUAL_FIELD_VALUE` (field value is unusual but valid)
   - `DEPRECATED_FIELD` (field is deprecated but still accepted)
   - `MISSING_OPTIONAL_FIELD` (optional field not present)
   - `SUSPICIOUS_PATTERN` (field value matches suspicious pattern)
2. EACH warning SHALL contain:
   - `category: string` (warning category from above list)
   - `code: string` (specific warning code, e.g., `VERY_LONG_TITLE`)
   - `message: string` (human-readable warning message)
   - `field?: string` (field name if applicable)
3. THE Validator SHALL NOT block validation if warnings are present.
4. THE Validator SHALL include warnings in the result even if `valid === true`.

---

### Requirement 7: Validator Safety Invariants

**User Story:** As a security engineer, I want the validator to enforce safety invariants, so that unsafe states are rejected.

#### Acceptance Criteria

1. THE Validator SHALL enforce that `deployUnlockAllowed` is always `false` in the result.
2. THE Validator SHALL enforce that `persistenceAllowed` is always `false` in the result.
3. THE Validator SHALL enforce that `sessionAuditInheritanceAllowed` is always `false` in the result.
4. THE Validator SHALL reject input with `deployUnlockAllowed: true` as a fail-closed error.
5. THE Validator SHALL reject input with `persistenceAllowed: true` as a fail-closed error.
6. THE Validator SHALL reject input with `sessionAuditInheritanceAllowed: true` as a fail-closed error.
7. THE Validator result `safety` array SHALL always include:
   - `DEPLOY_UNLOCK_FORBIDDEN`
   - `PERSISTENCE_FORBIDDEN`
   - `MUTATION_FORBIDDEN`
8. THE Validator result `safety` array MAY include additional safety flags as needed.

---

### Requirement 8: Validator Boundary Invariants

**User Story:** As a system architect, I want the validator to enforce boundary invariants, so that the validator stays within its safe scope.

#### Acceptance Criteria

1. THE Validator SHALL NOT create any objects (no `new`, no object literals in return value except result structure).
2. THE Validator SHALL NOT call any functions except pure utility functions (no builders, factories, generators).
3. THE Validator SHALL NOT access any global state (no `globalAudit`, no `vault`, no `session`).
4. THE Validator SHALL NOT import from `lib/` except for type definitions and pure utility functions.
5. THE Validator SHALL NOT import from `app/` under any circumstances.
6. THE Validator SHALL NOT import from `components/` under any circumstances.
7. THE Validator SHALL NOT import handler, adapter, or hook modules.
8. THE Validator result SHALL be readonly (all arrays and objects readonly).

---

### Requirement 9: Validator Verification Plan

**User Story:** As a verification engineer, I want a clear plan for verifying the validator, so that I can ensure it meets all requirements.

#### Acceptance Criteria

1. A future verification script SHALL check that the validator is pure:
   - No async/Promise usage
   - No fetch/axios/prisma/turso/libsql calls
   - No localStorage/sessionStorage access
   - No fs/child_process usage
   - No UI/handler/adapter/hook imports
   - No mutation tokens in function names
   - No builder/factory/generator patterns
2. A future verification script SHALL check that the validator returns result only:
   - No object creation (except result structure)
   - No state mutation
   - No side effects
3. A future verification script SHALL check that the validator enforces safety invariants:
   - `deployUnlockAllowed: true` input rejected
   - `persistenceAllowed: true` input rejected
   - `sessionAuditInheritanceAllowed: true` input rejected
   - Result always contains safety flags
4. A future verification script SHALL check that the validator does not create preview/assessment objects:
   - No preview object creation
   - No assessment object creation
   - No registration state creation
5. A future verification script SHALL check that the validator does not modify closed 8C files:
   - No changes to existing 8C verification scripts
   - No changes to existing 8C adapters
   - No changes to existing 8C handlers

---

### Requirement 10: Human-Led AI Principle

**User Story:** As an editorial director, I want AI to remain a system layer, so that humans retain editorial control.

#### Acceptance Criteria

1. THE Validator SHALL NOT autonomously approve or publish content.
2. THE Validator SHALL NOT make editorial decisions.
3. THE Validator SHALL NOT override human approval workflows.
4. THE Validator SHALL provide analysis and validation results only.
5. THE Validator result SHALL be consumed by human operators for decision-making.
6. THE Validator SHALL NOT trigger any publication or promotion automatically.
7. THE Validator SHALL NOT modify any human-controlled state (vault, session, globalAudit).

---

### Requirement 11: Jurisdictional Compliance Sequencing

**User Story:** As a compliance officer, I want jurisdictional compliance to be sequenced separately, so that core validator design is not mixed with legal/regulatory requirements.

#### Acceptance Criteria

1. THE Validator design SHALL NOT include country-law compliance logic.
2. THE Validator design SHALL NOT include content moderation rules.
3. THE Validator design SHALL NOT include legal review gates.
4. Jurisdictional compliance SHALL be addressed in a separate design/deep-research phase.
5. Jurisdictional compliance SHALL inform content/legal risk gates later, not core validator design.
6. THE Validator SHALL be designed to accept compliance results as input (not perform compliance checks).

---

### Requirement 12: Panda/SIA Protocol Sequencing

**User Story:** As a protocol architect, I want Panda/SIA protocol integration to be sequenced separately, so that core validator design is not mixed with editorial protocol requirements.

#### Acceptance Criteria

1. THE Validator design SHALL NOT include Panda editorial protocol logic.
2. THE Validator design SHALL NOT include SIA governance protocol logic.
3. THE Validator design SHALL NOT integrate with Panda/SIA APIs or workflows.
4. Panda/SIA protocol integration SHALL be addressed in a separate design/pilot phase.
5. Panda/SIA protocol integration SHALL happen after governance validator design is stable.
6. THE Validator SHALL be designed to accept protocol results as input (not perform protocol checks).

---

### Requirement 13: Readiness Estimation

**User Story:** As a project manager, I want clear readiness criteria, so that I can distinguish internal test readiness from live public readiness.

#### Acceptance Criteria

1. **Internal Test Article Readiness**: Validator design is locked and approved. **Implementation is NOT authorized.**
2. **Live Public Article Readiness**: Validator is implemented, verified, tested, jurisdictional compliance is addressed, Panda/SIA protocol is integrated, human approval workflow is in place.
3. THE Validator design lock (Task 8C-3A-1) SHALL enable internal test article design readiness.
4. THE Validator implementation (if authorized in future) SHALL enable live public article readiness (pending compliance and protocol integration).

---

## Design Constraints

### Scope Boundaries

- **IN SCOPE**: Pure validator contract, input/output types, error model, safety invariants, verification plan
- **OUT OF SCOPE**: Implementation code, runtime behavior, UI integration, handler integration, adapter integration
- **OUT OF SCOPE**: Jurisdictional compliance logic, Panda/SIA protocol logic, content moderation rules
- **OUT OF SCOPE**: Builder patterns, factory patterns, preview/assessment creation

### Safety Constraints

- **MUST**: Validator is pure (no side effects, no I/O, no persistence)
- **MUST**: Validator is synchronous (no async/await, no Promises)
- **MUST**: Validator is deterministic (same input → same output)
- **MUST**: Validator does not mutate input
- **MUST**: Validator enforces safety invariants (deploy locked, persistence forbidden, mutation forbidden)
- **MUST**: Validator is fail-closed (invalid input → structured errors, never silent passes)

### Architectural Constraints

- **MUST**: Validator is a pure function (no class, no builder, no factory)
- **MUST**: Validator accepts `unknown` input (defensive, fail-closed)
- **MUST**: Validator returns readonly result
- **MUST**: Validator does not import from `lib/`, `app/`, `components/`
- **MUST**: Validator does not import handler, adapter, or hook modules
- **MUST**: Validator does not create objects (except result structure)

---

## Success Criteria

1. Design document is complete and approved by stakeholders
2. Validator contract is formally defined (input, output, errors, warnings, safety invariants)
3. Verification plan is defined and ready for implementation
4. No implementation code is written (design-only phase)
5. No runtime behavior is created
6. No lib/, app/, or component changes are made
7. Design enables internal test article readiness
8. Design enables future implementation without scope creep

