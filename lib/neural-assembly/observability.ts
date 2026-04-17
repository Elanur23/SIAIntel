/**
 * OBSERVABILITY.TS
 * Runtime Observability & Monitoring Infrastructure
 * 
 * Provides structured logging, metrics, and operational visibility for:
 * - Master Orchestrator execution paths
 * - Blackboard state changes
 * - Database persistence operations
 * - Cooldown and budget management
 * - Idempotency hits
 * - Lock contention
 * - Recovery actions
 * - Failure classification
 * 
 * @version 1.0.0 (Phase 2 Pre-Gap #3)
 * @author SIA Intelligence Systems
 */

// ============================================================================
// STRUCTURED LOGGING
// ============================================================================

export interface StructuredLog {
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  component: string
  operation: string
  trace_id?: string
  batch_id?: string
  edition_id?: string
  language?: string
  tier?: string
  provider?: string
  status?: string
  retry_count?: number
  failure_class?: string
  duration_ms?: number
  idempotency_key?: string
  lock_id?: string
  message: string
  metadata?: Record<string, any>
}

class StructuredLogger {
  private logs: StructuredLog[] = []
  private maxLogs: number = 10000
  private persistCritical: boolean = true

  log(log: Omit<StructuredLog, 'timestamp'>): void {
    const entry: StructuredLog = {
      ...log,
      timestamp: new Date().toISOString()
    }

    this.logs.push(entry)

    // Keep only last N logs in memory
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Console output with structured format
    const logLine = this.formatLog(entry)
    
    switch (entry.level) {
      case 'ERROR':
        console.error(logLine)
        break
      case 'WARN':
        console.warn(logLine)
        break
      case 'DEBUG':
        console.debug(logLine)
        break
      default:
        console.log(logLine)
    }

    // Persist critical logs to database
    if (this.persistCritical && (entry.level === 'ERROR' || entry.level === 'WARN' || entry.operation.startsWith('PECL_'))) {
      this.persistToDatabase(entry)
    }
  }

  private persistToDatabase(log: StructuredLog): void {
    try {
      const { getGlobalDatabase } = require('./database')
      const db = getGlobalDatabase()
      
      db.saveLog({
        timestamp: new Date(log.timestamp).getTime(),
        level: log.level,
        component: log.component,
        operation: log.operation,
        trace_id: log.trace_id,
        batch_id: log.batch_id,
        edition_id: log.edition_id,
        language: log.language,
        provider: log.provider,
        status: log.status,
        retry_count: log.retry_count,
        failure_class: log.failure_class,
        duration_ms: log.duration_ms,
        idempotency_key: log.idempotency_key,
        lock_id: log.lock_id,
        message: log.message,
        metadata: log.metadata ? JSON.stringify(log.metadata) : undefined
      })
    } catch (error) {
      // Fail silently to avoid logging loops
      console.error('[StructuredLogger] Failed to persist log to database:', error)
    }
  }

  private formatLog(log: StructuredLog): string {
    const parts = [
      `[${log.timestamp}]`,
      `[${log.level}]`,
      `[${log.component}]`,
      `[${log.operation}]`
    ]

    if (log.trace_id) parts.push(`trace_id=${log.trace_id}`)
    if (log.batch_id) parts.push(`batch_id=${log.batch_id}`)
    if (log.edition_id) parts.push(`edition_id=${log.edition_id}`)
    if (log.language) parts.push(`language=${log.language}`)
    if (log.provider) parts.push(`provider=${log.provider}`)
    if (log.status) parts.push(`status=${log.status}`)
    if (log.duration_ms !== undefined) parts.push(`duration_ms=${log.duration_ms}`)
    if (log.retry_count !== undefined) parts.push(`retry_count=${log.retry_count}`)
    if (log.failure_class) parts.push(`failure_class=${log.failure_class}`)

    parts.push(log.message)

    if (log.metadata && Object.keys(log.metadata).length > 0) {
      parts.push(JSON.stringify(log.metadata))
    }

    return parts.join(' ')
  }

  getLogs(filter?: Partial<StructuredLog>): StructuredLog[] {
    if (!filter) return [...this.logs]

    return this.logs.filter(log => {
      for (const [key, value] of Object.entries(filter)) {
        if (log[key as keyof StructuredLog] !== value) {
          return false
        }
      }
      return true
    })
  }

  getRecentErrors(limit: number = 50): StructuredLog[] {
    return this.logs
      .filter(log => log.level === 'ERROR')
      .slice(-limit)
  }

  clear(): void {
    this.logs = []
  }

  /**
   * Enables or disables database persistence for critical logs
   */
  setPersistence(enabled: boolean): void {
    this.persistCritical = enabled
  }
}

// ============================================================================
// METRICS & COUNTERS
// ============================================================================

export interface MetricValue {
  count: number
  last_updated: number
  metadata?: Record<string, any>
}

export interface TimerValue {
  count: number
  total_ms: number
  min_ms: number
  max_ms: number
  avg_ms: number
  last_updated: number
}

class MetricsCollector {
  private counters: Map<string, MetricValue> = new Map()
  private timers: Map<string, TimerValue> = new Map()
  private gauges: Map<string, number> = new Map()
  private persistInterval: NodeJS.Timeout | null = null
  private persistEnabled: boolean = false

  constructor() {
    // Start periodic persistence (every 60 seconds)
    this.startPeriodicPersistence()
  }

  private startPeriodicPersistence(): void {
    this.persistInterval = setInterval(() => {
      if (this.persistEnabled) {
        this.persistMetrics()
      }
    }, 60000) // 60 seconds

    if (this.persistInterval && this.persistInterval.unref) {
      this.persistInterval.unref()
    }
  }

  private persistMetrics(): void {
    try {
      const { getGlobalDatabase } = require('./database')
      const db = getGlobalDatabase()
      const timestamp = Date.now()

      // Persist counters
      for (const [name, value] of this.counters.entries()) {
        db.saveMetricSnapshot({
          timestamp,
          metric_name: name,
          metric_type: 'counter',
          value: value.count,
          metadata: value.metadata ? JSON.stringify(value.metadata) : undefined
        })
      }

      // Persist timers
      for (const [name, value] of this.timers.entries()) {
        db.saveMetricSnapshot({
          timestamp,
          metric_name: name,
          metric_type: 'timer',
          value: value.avg_ms,
          metadata: JSON.stringify({
            count: value.count,
            min_ms: value.min_ms,
            max_ms: value.max_ms,
            total_ms: value.total_ms
          })
        })
      }

      // Persist gauges
      for (const [name, value] of this.gauges.entries()) {
        db.saveMetricSnapshot({
          timestamp,
          metric_name: name,
          metric_type: 'gauge',
          value
        })
      }
    } catch (error) {
      console.error('[MetricsCollector] Failed to persist metrics:', error)
    }
  }

  stopPersistence(): void {
    if (this.persistInterval) {
      clearInterval(this.persistInterval)
      this.persistInterval = null
    }
  }

  setPersistence(enabled: boolean): void {
    this.persistEnabled = enabled
  }

  // Counters
  increment(metric: string, metadata?: Record<string, any>): void {
    const current = this.counters.get(metric) || { count: 0, last_updated: 0 }
    this.counters.set(metric, {
      count: current.count + 1,
      last_updated: Date.now(),
      metadata
    })
  }

  getCounter(metric: string): number {
    return this.counters.get(metric)?.count || 0
  }

  // Timers
  recordTiming(metric: string, duration_ms: number): void {
    const current = this.timers.get(metric)

    if (!current) {
      this.timers.set(metric, {
        count: 1,
        total_ms: duration_ms,
        min_ms: duration_ms,
        max_ms: duration_ms,
        avg_ms: duration_ms,
        last_updated: Date.now()
      })
    } else {
      const newCount = current.count + 1
      const newTotal = current.total_ms + duration_ms
      this.timers.set(metric, {
        count: newCount,
        total_ms: newTotal,
        min_ms: Math.min(current.min_ms, duration_ms),
        max_ms: Math.max(current.max_ms, duration_ms),
        avg_ms: newTotal / newCount,
        last_updated: Date.now()
      })
    }
  }

  getTimer(metric: string): TimerValue | null {
    return this.timers.get(metric) || null
  }

  // Gauges
  setGauge(metric: string, value: number): void {
    this.gauges.set(metric, value)
  }

  getGauge(metric: string): number {
    return this.gauges.get(metric) || 0
  }

  // Snapshots
  getSnapshot(): {
    counters: Record<string, MetricValue>
    timers: Record<string, TimerValue>
    gauges: Record<string, number>
  } {
    return {
      counters: Object.fromEntries(this.counters),
      timers: Object.fromEntries(this.timers),
      gauges: Object.fromEntries(this.gauges)
    }
  }

  reset(): void {
    this.counters.clear()
    this.timers.clear()
    this.gauges.clear()
  }
}

// ============================================================================
// OPERATIONAL STATUS
// ============================================================================

export interface CooldownStatus {
  provider: string
  cooldown_until: string
  retry_after_seconds: number
  failure_count: number
  failure_class: string
  failure_reason?: string
}

export interface LockStatus {
  key: string
  lock_id: string
  acquired_at: string
  expires_at: string
  holder: string
  age_seconds: number
}

export interface BatchStatus {
  batch_id: string
  mic_id: string
  status: string
  approved_languages: string[]
  pending_languages: string[]
  rejected_languages: string[]
  budget_spent: number
  budget_remaining: number
  recirculation_count: number
  created_at: string
  updated_at: string
}

export interface FailureRecord {
  timestamp: string
  component: string
  operation: string
  batch_id?: string
  provider?: string
  failure_class: string
  error_message: string
  retry_count?: number
}

export interface RecoveryAction {
  timestamp: string
  action_type: 'BATCH_RESTORED' | 'CHECKPOINT_LOADED' | 'COOLDOWN_DETECTED' | 'LOCK_RECLAIMED'
  batch_id?: string
  details: string
}

export interface EditorialDecisionStatus {
  audit_id: string
  batch_id: string
  trace_id: string
  decision_dna_audit_id: string | null
  overall_decision: string
  confidence_score: number
  confidence_band: string
  requires_supervisor_review: boolean
  approved_languages: string[]
  rejected_languages: string[]
  delayed_languages: string[]
  reasons: string[]
  reason_code_digest: Record<string, unknown>
  gate_payload: Record<string, unknown>
  decision_trace_payload: Record<string, unknown>
  pecl_snapshot: Record<string, unknown> | null
  timestamp: string
}

export interface OperationalStatus {
  timestamp: string
  active_cooldowns: CooldownStatus[]
  active_locks: LockStatus[]
  in_progress_batches: BatchStatus[]
  partial_batches: BatchStatus[]
  recent_failures: FailureRecord[]
  recent_recoveries: RecoveryAction[]
  recent_editorial_decisions?: EditorialDecisionStatus[]
  budget_pressure: {
    total_reserved: number
    total_consumed: number
    active_reservations: number
  }
  metrics_snapshot: {
    batches_started: number
    batches_completed: number
    batches_failed: number
    editions_generated: number
    publish_attempts: number
    publish_success: number
    retries_total: number
    cooldown_blocks: number
    idempotency_hits: number
    lock_contentions: number
    recovery_resumes: number
  }
}

// ============================================================================
// SINGLETON INSTANCES
// ============================================================================

let globalLogger: StructuredLogger | null = null
let globalMetrics: MetricsCollector | null = null

export function getLogger(): StructuredLogger {
  if (!globalLogger) {
    globalLogger = new StructuredLogger()
  }
  return globalLogger
}

export function getMetrics(): MetricsCollector {
  if (!globalMetrics) {
    globalMetrics = new MetricsCollector()
  }
  return globalMetrics
}

export function resetObservability(): void {
  globalLogger = null
  globalMetrics = null
}

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

export function logOperation(
  component: string,
  operation: string,
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR',
  message: string,
  context?: {
    trace_id?: string
    batch_id?: string
    edition_id?: string
    language?: string
    provider?: string
    status?: string
    duration_ms?: number
    user_id?: string
    ip_address?: string
    errors?: string[]
    idempotency_key?: string
    lock_id?: string
    failure_class?: string
    retry_count?: number
    metadata?: Record<string, any>
  }
): void {
  getLogger().log({
    level,
    component,
    operation,
    message,
    ...context
  })
}

export function logRecovery(
  action_type: RecoveryAction['action_type'],
  details: string,
  batch_id?: string
): void {
  logOperation('RECOVERY', action_type, 'INFO', details, { batch_id })
  getMetrics().increment('recovery_actions_total')
}

export function logCooldownBlock(
  provider: string,
  cooldown_until: number,
  failure_class: string
): void {
  const retryAfter = Math.ceil((cooldown_until - Date.now()) / 1000)
  logOperation('COOLDOWN', 'BLOCK', 'WARN', `Provider ${provider} in cooldown`, {
    provider,
    status: 'BLOCKED',
    metadata: {
      cooldown_until: new Date(cooldown_until).toISOString(),
      retry_after_seconds: retryAfter,
      failure_class
    }
  })
  getMetrics().increment('cooldown_blocks_total')
}

export function logBudgetReservation(
  batch_id: string,
  operation: string,
  provider: string,
  amount: number
): void {
  logOperation('BUDGET', 'RESERVE', 'INFO', `Reserved ${amount} for ${operation}`, {
    batch_id,
    provider,
    metadata: { reserved_amount: amount }
  })
  getMetrics().increment('budget_reservations_total')
}

export function logBudgetConsumption(
  batch_id: string,
  operation: string,
  provider: string,
  amount: number
): void {
  logOperation('BUDGET', 'CONSUME', 'INFO', `Consumed ${amount} for ${operation}`, {
    batch_id,
    provider,
    metadata: { consumed_amount: amount }
  })
  getMetrics().increment('budget_consumed_total')
}

export function logIdempotencyHit(
  operation: string,
  key: string,
  batch_id?: string
): void {
  logOperation('IDEMPOTENCY', 'HIT', 'INFO', `Idempotency hit for ${operation}`, {
    batch_id,
    idempotency_key: key
  })
  getMetrics().increment('idempotency_hits_total')
}

export function logLockAcquired(
  key: string,
  lock_id: string,
  holder: string
): void {
  logOperation('LOCK', 'ACQUIRED', 'DEBUG', `Lock acquired on ${key}`, {
    lock_id,
    metadata: { key, holder }
  })
  getMetrics().increment('lock_acquire_success_total')
}

export function logLockContention(
  key: string,
  holder: string
): void {
  logOperation('LOCK', 'CONTENTION', 'WARN', `Lock contention on ${key}`, {
    metadata: { key, holder }
  })
  getMetrics().increment('lock_contention_total')
}

export function logLockReleased(
  lock_id: string
): void {
  logOperation('LOCK', 'RELEASED', 'DEBUG', `Lock released`, {
    lock_id
  })
  getMetrics().increment('lock_release_total')
}

export function logFailure(
  component: string,
  operation: string,
  error: Error,
  context?: {
    batch_id?: string
    provider?: string
    failure_class?: string
    retry_count?: number
  }
): void {
  logOperation(component, operation, 'ERROR', `Operation failed: ${error.message}`, {
    ...context,
    metadata: {
      error_name: error.name,
      error_stack: error.stack
    }
  })
  getMetrics().increment(`${component.toLowerCase()}_failures_total`)
}

// ============================================================================
// EXPORT
// ============================================================================

export {
  StructuredLogger,
  MetricsCollector
}
