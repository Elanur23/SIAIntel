/**
 * CANONICAL-REAUDIT-PRODUCTION-MONITOR.TS
 *
 * Read-only production monitoring for the canonical re-audit pipeline.
 * No business logic. No mutations. Metrics collection and alert evaluation only.
 *
 * Layers observed:
 *  - canonical-reaudit-request-validator  (validator PASS / FAIL)
 *  - canonical-reaudit-handler            (result outcome: BLOCKED / PASS / STALE / FAILED_REVIEW)
 *  - hard-rule-engine                     (violation frequency by rule_id)
 *
 * Integration: call record* functions from the respective layers.
 * Consumption: call getMonitoringSnapshot() or evaluateAlertConditions() from dashboards.
 */

import { getMetrics } from '../neural-assembly/observability'
import { CanonicalReAuditStatus } from './canonical-reaudit-types'
import type { CanonicalReAuditResult } from './canonical-reaudit-types'
import type { HardRuleViolation } from '../neural-assembly/stabilization/types'

// ============================================================================
// METRIC KEYS
// ============================================================================

const METRIC = {
  // Validator layer
  VALIDATOR_PASS:            'reaudit.validator.pass',
  VALIDATOR_FAIL:            'reaudit.validator.fail',

  // Handler result layer
  RESULT_BLOCKED:            'reaudit.result.blocked',
  RESULT_PASS:               'reaudit.result.pass',
  RESULT_STALE:              'reaudit.result.stale',
  RESULT_FAILED_REVIEW:      'reaudit.result.failed_review',
  TOTAL_EVALUATIONS:         'reaudit.total_evaluations',

  // Block-reason breakdown (prefix)
  BLOCK_REASON_PREFIX:       'reaudit.block_reason.',

  // Hard-rule-engine layer
  HARD_RULE_VIOLATION_PREFIX: 'reaudit.hard_rule.',
  HARD_RULE_EVAL_WITH_HITS:   'reaudit.hard_rule.evals_with_violations',

  // Errors
  UNEXPECTED_ERROR:          'reaudit.unexpected_error',
} as const

// ============================================================================
// RECORD FUNCTIONS  (called from handler / validator — pure counter increments)
// ============================================================================

/**
 * Record the outcome of a validator invocation.
 * Call once per validateCanonicalReAuditRequest() execution.
 */
export function recordValidatorOutcome(valid: boolean): void {
  const m = getMetrics()
  m.increment(valid ? METRIC.VALIDATOR_PASS : METRIC.VALIDATOR_FAIL)
}

/**
 * Record the final handler result after the full pipeline completes.
 * Call once per startCanonicalReAudit() return.
 */
export function recordResultOutcome(result: CanonicalReAuditResult): void {
  const m = getMetrics()
  m.increment(METRIC.TOTAL_EVALUATIONS)

  switch (result.status) {
    case CanonicalReAuditStatus.BLOCKED:
      m.increment(METRIC.RESULT_BLOCKED)
      if (result.blockReason) {
        m.increment(`${METRIC.BLOCK_REASON_PREFIX}${result.blockReason}`)
      }
      break
    case CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE:
      m.increment(METRIC.RESULT_PASS)
      break
    case CanonicalReAuditStatus.STALE:
      m.increment(METRIC.RESULT_STALE)
      break
    case CanonicalReAuditStatus.FAILED_PENDING_REVIEW:
      m.increment(METRIC.RESULT_FAILED_REVIEW)
      break
  }
}

/**
 * Record hard-rule violations from a single evaluateHardRulesForBatch() call.
 * Increments per-rule_id counters.
 */
export function recordHardRuleViolations(violations: readonly HardRuleViolation[]): void {
  if (violations.length === 0) return
  const m = getMetrics()
  m.increment(METRIC.HARD_RULE_EVAL_WITH_HITS)
  for (const v of violations) {
    m.increment(`${METRIC.HARD_RULE_VIOLATION_PREFIX}${v.rule_id}`)
  }
}

/**
 * Record an unexpected error (adapter exception, unhandled throw, etc.).
 */
export function recordUnexpectedError(): void {
  getMetrics().increment(METRIC.UNEXPECTED_ERROR)
}

// ============================================================================
// ALERT CONDITIONS  (read-only evaluation against current counters)
// ============================================================================

export interface AlertCondition {
  readonly id: string
  readonly description: string
  readonly triggered: boolean
  readonly detail: string
}

function safeRatio(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`
}

/**
 * Evaluate all alert conditions against current metric counters.
 * Pure read — does not mutate any state.
 */
export function evaluateAlertConditions(): AlertCondition[] {
  const m = getMetrics()

  const validatorPass   = m.getCounter(METRIC.VALIDATOR_PASS)
  const validatorFail   = m.getCounter(METRIC.VALIDATOR_FAIL)
  const totalValidator  = validatorPass + validatorFail

  const resultBlocked   = m.getCounter(METRIC.RESULT_BLOCKED)
  const resultPass      = m.getCounter(METRIC.RESULT_PASS)
  const resultStale     = m.getCounter(METRIC.RESULT_STALE)
  const totalEvals      = m.getCounter(METRIC.TOTAL_EVALUATIONS)
  const unexpectedErrs  = m.getCounter(METRIC.UNEXPECTED_ERROR)
  const criticalAudit   = m.getCounter(`${METRIC.HARD_RULE_VIOLATION_PREFIX}POLICY_CRITICAL_AUDIT_ISSUES`)
  const hardRuleEvals   = m.getCounter(METRIC.HARD_RULE_EVAL_WITH_HITS)

  const alerts: AlertCondition[] = []

  // ── 1. Sudden increase in BLOCKED ────────────────────────────────────────
  const blockedRate = safeRatio(resultBlocked, totalEvals)
  alerts.push({
    id: 'HIGH_BLOCKED_RATE',
    description: 'BLOCKED rate exceeds 80% (min 10 evaluations)',
    triggered: totalEvals >= 10 && blockedRate > 0.8,
    detail: `blocked=${resultBlocked}/${totalEvals} (${pct(blockedRate)})`
  })

  // ── 2. Validator always FAIL ─────────────────────────────────────────────
  alerts.push({
    id: 'VALIDATOR_ALWAYS_FAIL',
    description: 'Validator rejects every request (min 10 invocations)',
    triggered: totalValidator >= 10 && validatorPass === 0,
    detail: `pass=${validatorPass} fail=${validatorFail}`
  })

  // ── 3. Validator always PASS ─────────────────────────────────────────────
  alerts.push({
    id: 'VALIDATOR_ALWAYS_PASS',
    description: 'Validator accepts every request — possible bypass (min 10 invocations)',
    triggered: totalValidator >= 10 && validatorFail === 0,
    detail: `pass=${validatorPass} fail=${validatorFail}`
  })

  // ── 4. Spike in critical audit issues ────────────────────────────────────
  const criticalRate = safeRatio(criticalAudit, hardRuleEvals || totalEvals)
  alerts.push({
    id: 'CRITICAL_AUDIT_SPIKE',
    description: 'POLICY_CRITICAL_AUDIT_ISSUES rate exceeds 50% (min 5 evaluations)',
    triggered: totalEvals >= 5 && criticalRate > 0.5,
    detail: `critical_audit=${criticalAudit} rate=${pct(criticalRate)}`
  })

  // ── 5. Unexpected error spike ────────────────────────────────────────────
  const errorRate = safeRatio(unexpectedErrs, totalEvals)
  alerts.push({
    id: 'UNEXPECTED_ERROR_SPIKE',
    description: 'Unexpected errors exceed 20% of evaluations (min 5)',
    triggered: totalEvals >= 5 && errorRate > 0.2,
    detail: `errors=${unexpectedErrs}/${totalEvals} (${pct(errorRate)})`
  })

  // ── 6. Inconsistent results: STALE without STALE_DEPENDENCY violation ───
  const staleDep = m.getCounter(`${METRIC.HARD_RULE_VIOLATION_PREFIX}STALE_DEPENDENCY`)
  alerts.push({
    id: 'INCONSISTENT_STALE',
    description: 'STALE results present but no STALE_DEPENDENCY hard-rule violations recorded',
    triggered: resultStale > 5 && staleDep === 0,
    detail: `stale_results=${resultStale} stale_violations=${staleDep}`
  })

  return alerts
}

// ============================================================================
// MONITORING SNAPSHOT  (read-only dashboard payload)
// ============================================================================

export interface MonitoringSnapshot {
  readonly timestamp: string
  readonly metrics: {
    readonly validator_pass: number
    readonly validator_fail: number
    readonly validator_fail_rate: number
    readonly result_blocked: number
    readonly result_pass: number
    readonly result_stale: number
    readonly result_failed_review: number
    readonly blocked_pass_ratio: number
    readonly stale_frequency: number
    readonly hard_rule_evals_with_violations: number
    readonly unexpected_errors: number
    readonly total_evaluations: number
  }
  readonly alerts: readonly AlertCondition[]
}

/**
 * Build a complete read-only monitoring snapshot.
 * Safe to call at any frequency — no side effects.
 */
export function getMonitoringSnapshot(): MonitoringSnapshot {
  const m = getMetrics()

  const validatorPass       = m.getCounter(METRIC.VALIDATOR_PASS)
  const validatorFail       = m.getCounter(METRIC.VALIDATOR_FAIL)
  const totalValidator      = validatorPass + validatorFail
  const resultBlocked       = m.getCounter(METRIC.RESULT_BLOCKED)
  const resultPass          = m.getCounter(METRIC.RESULT_PASS)
  const resultStale         = m.getCounter(METRIC.RESULT_STALE)
  const resultFailedReview  = m.getCounter(METRIC.RESULT_FAILED_REVIEW)
  const totalEvals          = m.getCounter(METRIC.TOTAL_EVALUATIONS)
  const hardRuleEvals       = m.getCounter(METRIC.HARD_RULE_EVAL_WITH_HITS)
  const unexpectedErrs      = m.getCounter(METRIC.UNEXPECTED_ERROR)

  return {
    timestamp: new Date().toISOString(),
    metrics: {
      validator_pass:                  validatorPass,
      validator_fail:                  validatorFail,
      validator_fail_rate:             safeRatio(validatorFail, totalValidator),
      result_blocked:                  resultBlocked,
      result_pass:                     resultPass,
      result_stale:                    resultStale,
      result_failed_review:            resultFailedReview,
      blocked_pass_ratio:              safeRatio(resultBlocked, resultBlocked + resultPass),
      stale_frequency:                 safeRatio(resultStale, totalEvals),
      hard_rule_evals_with_violations: hardRuleEvals,
      unexpected_errors:               unexpectedErrs,
      total_evaluations:               totalEvals,
    },
    alerts: evaluateAlertConditions()
  }
}
