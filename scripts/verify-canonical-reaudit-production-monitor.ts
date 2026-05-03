/**
 * verify-canonical-reaudit-production-monitor.ts
 *
 * Simulates production traffic and validates that the monitoring module
 * tracks counters, computes ratios, and triggers alerts correctly.
 *
 * EXIT 0 = PASS, EXIT 1 = FAIL
 */

import { resetObservability, getMetrics } from '../lib/neural-assembly/observability'
import {
  recordValidatorOutcome,
  recordResultOutcome,
  recordHardRuleViolations,
  recordUnexpectedError,
  evaluateAlertConditions,
  getMonitoringSnapshot,
} from '../lib/editorial/canonical-reaudit-production-monitor'
import {
  CanonicalReAuditStatus,
  CanonicalReAuditBlockReason,
} from '../lib/editorial/canonical-reaudit-types'
import type { CanonicalReAuditResult } from '../lib/editorial/canonical-reaudit-types'
import type { HardRuleViolation } from '../lib/neural-assembly/stabilization/types'

// ── Helpers ─────────────────────────────────────────────────────────────────

const failures: string[] = []

function assert(condition: boolean, label: string): void {
  if (!condition) {
    failures.push(label)
    console.error(`  ✗ FAIL: ${label}`)
  } else {
    console.log(`  ✓ ${label}`)
  }
}

function assertEq(actual: number, expected: number, label: string): void {
  if (actual !== expected) {
    failures.push(`${label} (expected=${expected}, actual=${actual})`)
    console.error(`  ✗ FAIL: ${label} — expected=${expected}, actual=${actual}`)
  } else {
    console.log(`  ✓ ${label} = ${actual}`)
  }
}

function assertApprox(actual: number, expected: number, epsilon: number, label: string): void {
  if (Math.abs(actual - expected) > epsilon) {
    failures.push(`${label} (expected≈${expected}, actual=${actual})`)
    console.error(`  ✗ FAIL: ${label} — expected≈${expected}, actual=${actual}`)
  } else {
    console.log(`  ✓ ${label} ≈ ${expected}`)
  }
}

function alertTriggered(alerts: readonly { id: string; triggered: boolean }[], id: string): boolean {
  const a = alerts.find(x => x.id === id)
  return a?.triggered === true
}

function makeBlockedResult(reason: CanonicalReAuditBlockReason): CanonicalReAuditResult {
  return {
    status: CanonicalReAuditStatus.BLOCKED,
    blockReason: reason,
    success: false,
    passed: false,
    readyForAcceptance: false,
    deployRemainsLocked: true,
    globalAuditOverwriteAllowed: false,
    backendPersistenceAllowed: false,
    memoryOnly: true,
    sessionAuditInherited: false,
    auditedSnapshot: { contentHash: 'h', ledgerSequence: 1, capturedAt: new Date().toISOString(), source: 'canonical-vault' },
    auditedAt: new Date().toISOString(),
    auditor: 'test',
  } as CanonicalReAuditResult
}

function makePassResult(): CanonicalReAuditResult {
  return {
    status: CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE,
    success: true,
    passed: true,
    readyForAcceptance: true,
    deployRemainsLocked: true,
    globalAuditOverwriteAllowed: false,
    backendPersistenceAllowed: false,
    memoryOnly: true,
    sessionAuditInherited: false,
    auditedSnapshot: { contentHash: 'h', ledgerSequence: 1, capturedAt: new Date().toISOString(), source: 'canonical-vault' },
    auditedAt: new Date().toISOString(),
    auditor: 'test',
  } as CanonicalReAuditResult
}

function makeStaleResult(): CanonicalReAuditResult {
  return {
    status: CanonicalReAuditStatus.STALE,
    blockReason: CanonicalReAuditBlockReason.STALE_RESULT,
    success: false,
    passed: false,
    readyForAcceptance: false,
    deployRemainsLocked: true,
    globalAuditOverwriteAllowed: false,
    backendPersistenceAllowed: false,
    memoryOnly: true,
    sessionAuditInherited: false,
    auditedSnapshot: { contentHash: 'h', ledgerSequence: 1, capturedAt: new Date().toISOString(), source: 'canonical-vault' },
    auditedAt: new Date().toISOString(),
    auditor: 'test',
  } as CanonicalReAuditResult
}

function makeFailedReviewResult(): CanonicalReAuditResult {
  return {
    status: CanonicalReAuditStatus.FAILED_PENDING_REVIEW,
    success: false,
    passed: false,
    readyForAcceptance: false,
    deployRemainsLocked: true,
    globalAuditOverwriteAllowed: false,
    backendPersistenceAllowed: false,
    memoryOnly: true,
    sessionAuditInherited: false,
    auditedSnapshot: { contentHash: 'h', ledgerSequence: 1, capturedAt: new Date().toISOString(), source: 'canonical-vault' },
    auditedAt: new Date().toISOString(),
    auditor: 'test',
  } as CanonicalReAuditResult
}

function makeViolation(rule_id: string): HardRuleViolation {
  return { rule_id, severity: 'CRITICAL', field: 'test', message: 'test', blocking: true }
}

// ============================================================================
// TEST 1: Counter accuracy after mixed traffic
// ============================================================================

console.log('\n═══ TEST 1: Counter accuracy ═══')
resetObservability()
// Disable persistence to avoid DB calls during test
getMetrics().setPersistence(false)

// Simulate: 5 valid, 3 invalid
for (let i = 0; i < 5; i++) recordValidatorOutcome(true)
for (let i = 0; i < 3; i++) recordValidatorOutcome(false)

// Simulate: 4 PASS, 3 BLOCKED, 2 STALE, 1 FAILED_REVIEW
for (let i = 0; i < 4; i++) recordResultOutcome(makePassResult())
for (let i = 0; i < 3; i++) recordResultOutcome(makeBlockedResult(CanonicalReAuditBlockReason.SNAPSHOT_MISSING))
for (let i = 0; i < 2; i++) recordResultOutcome(makeStaleResult())
recordResultOutcome(makeFailedReviewResult())

// 2 unexpected errors
recordUnexpectedError()
recordUnexpectedError()

// Hard-rule violations: 3 evals, one with POLICY_CRITICAL_AUDIT_ISSUES
recordHardRuleViolations([makeViolation('MISSING_TITLE'), makeViolation('STALE_DEPENDENCY')])
recordHardRuleViolations([makeViolation('POLICY_CRITICAL_AUDIT_ISSUES')])
recordHardRuleViolations([makeViolation('MALFORMED_SCHEMA_MARKUP'), makeViolation('POLICY_CRITICAL_AUDIT_ISSUES')])

const snap1 = getMonitoringSnapshot()

assertEq(snap1.metrics.validator_pass, 5, 'validator_pass = 5')
assertEq(snap1.metrics.validator_fail, 3, 'validator_fail = 3')
assertEq(snap1.metrics.result_blocked, 3, 'result_blocked = 3')
assertEq(snap1.metrics.result_pass, 4, 'result_pass = 4')
assertEq(snap1.metrics.result_stale, 2, 'result_stale = 2')
assertEq(snap1.metrics.result_failed_review, 1, 'result_failed_review = 1')
assertEq(snap1.metrics.total_evaluations, 10, 'total_evaluations = 10')
assertEq(snap1.metrics.unexpected_errors, 2, 'unexpected_errors = 2')
assertEq(snap1.metrics.hard_rule_evals_with_violations, 3, 'hard_rule_evals_with_violations = 3')

// Block-reason breakdown
const m1 = getMetrics()
assertEq(m1.getCounter('reaudit.block_reason.SNAPSHOT_MISSING'), 3, 'block_reason.SNAPSHOT_MISSING = 3')
assertEq(m1.getCounter('reaudit.hard_rule.MISSING_TITLE'), 1, 'hard_rule.MISSING_TITLE = 1')
assertEq(m1.getCounter('reaudit.hard_rule.STALE_DEPENDENCY'), 1, 'hard_rule.STALE_DEPENDENCY = 1')
assertEq(m1.getCounter('reaudit.hard_rule.POLICY_CRITICAL_AUDIT_ISSUES'), 2, 'hard_rule.POLICY_CRITICAL_AUDIT_ISSUES = 2')
assertEq(m1.getCounter('reaudit.hard_rule.MALFORMED_SCHEMA_MARKUP'), 1, 'hard_rule.MALFORMED_SCHEMA_MARKUP = 1')

// ============================================================================
// TEST 2: Ratio accuracy
// ============================================================================

console.log('\n═══ TEST 2: Ratio accuracy ═══')

// validator_fail_rate = 3 / (5+3) = 0.375
assertApprox(snap1.metrics.validator_fail_rate, 3 / 8, 0.001, 'validator_fail_rate = 37.5%')

// blocked_pass_ratio = 3 / (3+4) = 0.4286
assertApprox(snap1.metrics.blocked_pass_ratio, 3 / 7, 0.001, 'blocked_pass_ratio = 42.9%')

// stale_frequency = 2/10 = 0.2
assertApprox(snap1.metrics.stale_frequency, 0.2, 0.001, 'stale_frequency = 20%')

// ============================================================================
// TEST 3: Alerts NOT triggered (healthy traffic)
// ============================================================================

console.log('\n═══ TEST 3: Alerts NOT triggered (healthy traffic) ═══')

const alerts1 = snap1.alerts
assert(!alertTriggered(alerts1, 'HIGH_BLOCKED_RATE'), 'HIGH_BLOCKED_RATE not triggered (30% < 80%)')
assert(!alertTriggered(alerts1, 'VALIDATOR_ALWAYS_FAIL'), 'VALIDATOR_ALWAYS_FAIL not triggered (5 passes exist)')
assert(!alertTriggered(alerts1, 'VALIDATOR_ALWAYS_PASS'), 'VALIDATOR_ALWAYS_PASS not triggered (3 fails exist)')
assert(!alertTriggered(alerts1, 'INCONSISTENT_STALE'), 'INCONSISTENT_STALE not triggered (stale_dep=1)')

// UNEXPECTED_ERROR_SPIKE: 2/10 = 20% — threshold is >20%, so NOT triggered
assert(!alertTriggered(alerts1, 'UNEXPECTED_ERROR_SPIKE'), 'UNEXPECTED_ERROR_SPIKE not triggered (20% = threshold, not >')

// CRITICAL_AUDIT_SPIKE: criticalAudit=2, hardRuleEvals=3 → 2/3=66.7% >50% — TRIGGERED
// This is expected because we injected 2 POLICY_CRITICAL_AUDIT_ISSUES in 3 hard-rule evals
assert(alertTriggered(alerts1, 'CRITICAL_AUDIT_SPIKE'), 'CRITICAL_AUDIT_SPIKE triggered (2/3 = 66.7% > 50%)')

// ============================================================================
// TEST 4: HIGH_BLOCKED_RATE alert triggers
// ============================================================================

console.log('\n═══ TEST 4: HIGH_BLOCKED_RATE alert ═══')
resetObservability()
getMetrics().setPersistence(false)

// 9 BLOCKED, 1 PASS → 90% blocked, ≥10 evals
for (let i = 0; i < 9; i++) recordResultOutcome(makeBlockedResult(CanonicalReAuditBlockReason.UNKNOWN))
recordResultOutcome(makePassResult())

const alerts4 = evaluateAlertConditions()
assert(alertTriggered(alerts4, 'HIGH_BLOCKED_RATE'), 'HIGH_BLOCKED_RATE triggers at 90%')

// ============================================================================
// TEST 5: VALIDATOR_ALWAYS_FAIL alert triggers
// ============================================================================

console.log('\n═══ TEST 5: VALIDATOR_ALWAYS_FAIL alert ═══')
resetObservability()
getMetrics().setPersistence(false)

for (let i = 0; i < 12; i++) recordValidatorOutcome(false)

const alerts5 = evaluateAlertConditions()
assert(alertTriggered(alerts5, 'VALIDATOR_ALWAYS_FAIL'), 'VALIDATOR_ALWAYS_FAIL triggers (12 fails, 0 passes)')
assert(!alertTriggered(alerts5, 'VALIDATOR_ALWAYS_PASS'), 'VALIDATOR_ALWAYS_PASS NOT triggered')

// ============================================================================
// TEST 6: VALIDATOR_ALWAYS_PASS alert triggers
// ============================================================================

console.log('\n═══ TEST 6: VALIDATOR_ALWAYS_PASS alert ═══')
resetObservability()
getMetrics().setPersistence(false)

for (let i = 0; i < 15; i++) recordValidatorOutcome(true)

const alerts6 = evaluateAlertConditions()
assert(alertTriggered(alerts6, 'VALIDATOR_ALWAYS_PASS'), 'VALIDATOR_ALWAYS_PASS triggers (15 passes, 0 fails)')
assert(!alertTriggered(alerts6, 'VALIDATOR_ALWAYS_FAIL'), 'VALIDATOR_ALWAYS_FAIL NOT triggered')

// ============================================================================
// TEST 7: UNEXPECTED_ERROR_SPIKE alert triggers
// ============================================================================

console.log('\n═══ TEST 7: UNEXPECTED_ERROR_SPIKE alert ═══')
resetObservability()
getMetrics().setPersistence(false)

for (let i = 0; i < 5; i++) recordResultOutcome(makePassResult())
for (let i = 0; i < 3; i++) recordUnexpectedError()
// 3/5 = 60% > 20%

const alerts7 = evaluateAlertConditions()
assert(alertTriggered(alerts7, 'UNEXPECTED_ERROR_SPIKE'), 'UNEXPECTED_ERROR_SPIKE triggers at 60%')

// ============================================================================
// TEST 8: INCONSISTENT_STALE alert triggers
// ============================================================================

console.log('\n═══ TEST 8: INCONSISTENT_STALE alert ═══')
resetObservability()
getMetrics().setPersistence(false)

// 6 STALE results but zero STALE_DEPENDENCY hard-rule violations
for (let i = 0; i < 6; i++) recordResultOutcome(makeStaleResult())

const alerts8 = evaluateAlertConditions()
assert(alertTriggered(alerts8, 'INCONSISTENT_STALE'), 'INCONSISTENT_STALE triggers (6 stale, 0 violations)')

// ============================================================================
// TEST 9: INCONSISTENT_STALE does NOT trigger when violations present
// ============================================================================

console.log('\n═══ TEST 9: INCONSISTENT_STALE not triggered with violations ═══')
resetObservability()
getMetrics().setPersistence(false)

for (let i = 0; i < 6; i++) recordResultOutcome(makeStaleResult())
recordHardRuleViolations([makeViolation('STALE_DEPENDENCY')])

const alerts9 = evaluateAlertConditions()
assert(!alertTriggered(alerts9, 'INCONSISTENT_STALE'), 'INCONSISTENT_STALE NOT triggered (violations present)')

// ============================================================================
// TEST 10: Below-threshold counts do NOT trigger alerts
// ============================================================================

console.log('\n═══ TEST 10: Below minimum thresholds ═══')
resetObservability()
getMetrics().setPersistence(false)

// Only 3 evals — below min of 10 for HIGH_BLOCKED_RATE
for (let i = 0; i < 3; i++) recordResultOutcome(makeBlockedResult(CanonicalReAuditBlockReason.UNKNOWN))

// Only 5 validator calls — below min of 10 for VALIDATOR_ALWAYS_FAIL
for (let i = 0; i < 5; i++) recordValidatorOutcome(false)

const alerts10 = evaluateAlertConditions()
assert(!alertTriggered(alerts10, 'HIGH_BLOCKED_RATE'), 'HIGH_BLOCKED_RATE not triggered (3 < 10 min)')
assert(!alertTriggered(alerts10, 'VALIDATOR_ALWAYS_FAIL'), 'VALIDATOR_ALWAYS_FAIL not triggered (5 < 10 min)')

// ============================================================================
// TEST 11: Snapshot completeness — no missing metrics
// ============================================================================

console.log('\n═══ TEST 11: Snapshot completeness ═══')
resetObservability()
getMetrics().setPersistence(false)

const emptySnap = getMonitoringSnapshot()

const requiredMetricKeys = [
  'validator_pass', 'validator_fail', 'validator_fail_rate',
  'result_blocked', 'result_pass', 'result_stale', 'result_failed_review',
  'blocked_pass_ratio', 'stale_frequency',
  'hard_rule_evals_with_violations', 'unexpected_errors', 'total_evaluations'
]

for (const key of requiredMetricKeys) {
  const val = (emptySnap.metrics as any)[key]
  assert(typeof val === 'number', `metric '${key}' present and numeric (${val})`)
}

assert(typeof emptySnap.timestamp === 'string' && emptySnap.timestamp.length > 0, 'timestamp present')
assert(Array.isArray(emptySnap.alerts), 'alerts is array')

const requiredAlertIds = [
  'HIGH_BLOCKED_RATE', 'VALIDATOR_ALWAYS_FAIL', 'VALIDATOR_ALWAYS_PASS',
  'CRITICAL_AUDIT_SPIKE', 'UNEXPECTED_ERROR_SPIKE', 'INCONSISTENT_STALE'
]

for (const id of requiredAlertIds) {
  assert(emptySnap.alerts.some(a => a.id === id), `alert '${id}' present in snapshot`)
}

// Zero-state: all metrics should be 0, all ratios should be 0
assertEq(emptySnap.metrics.total_evaluations, 0, 'empty snapshot total_evaluations = 0')
assertEq(emptySnap.metrics.validator_fail_rate, 0, 'empty snapshot validator_fail_rate = 0')
assertEq(emptySnap.metrics.blocked_pass_ratio, 0, 'empty snapshot blocked_pass_ratio = 0')
assertEq(emptySnap.metrics.stale_frequency, 0, 'empty snapshot stale_frequency = 0')

// No alerts triggered at zero state
for (const a of emptySnap.alerts) {
  assert(!a.triggered, `alert '${a.id}' NOT triggered at zero state`)
}

// ============================================================================
// TEST 12: Multiple block reasons tracked independently
// ============================================================================

console.log('\n═══ TEST 12: Block reason breakdown ═══')
resetObservability()
getMetrics().setPersistence(false)

recordResultOutcome(makeBlockedResult(CanonicalReAuditBlockReason.SNAPSHOT_MISSING))
recordResultOutcome(makeBlockedResult(CanonicalReAuditBlockReason.SNAPSHOT_MISSING))
recordResultOutcome(makeBlockedResult(CanonicalReAuditBlockReason.DEPLOY_UNLOCK_FORBIDDEN))
recordResultOutcome(makeBlockedResult(CanonicalReAuditBlockReason.BACKEND_FORBIDDEN))
recordResultOutcome(makeBlockedResult(CanonicalReAuditBlockReason.AUDIT_RUNNER_FAILED))

const m12 = getMetrics()
assertEq(m12.getCounter('reaudit.block_reason.SNAPSHOT_MISSING'), 2, 'SNAPSHOT_MISSING = 2')
assertEq(m12.getCounter('reaudit.block_reason.DEPLOY_UNLOCK_FORBIDDEN'), 1, 'DEPLOY_UNLOCK_FORBIDDEN = 1')
assertEq(m12.getCounter('reaudit.block_reason.BACKEND_FORBIDDEN'), 1, 'BACKEND_FORBIDDEN = 1')
assertEq(m12.getCounter('reaudit.block_reason.AUDIT_RUNNER_FAILED'), 1, 'AUDIT_RUNNER_FAILED = 1')
assertEq(m12.getCounter('reaudit.block_reason.SNAPSHOT_MISMATCH'), 0, 'SNAPSHOT_MISMATCH = 0 (never recorded)')
assertEq(m12.getCounter('reaudit.result.blocked'), 5, 'total blocked = 5')

// ============================================================================
// VERDICT
// ============================================================================

console.log('\n══════════════════════════════════')
if (failures.length === 0) {
  console.log('PASS — all monitoring checks passed')
  process.exit(0)
} else {
  console.error(`FAIL — ${failures.length} issue(s):`)
  for (const f of failures) console.error(`  • ${f}`)
  process.exit(1)
}
