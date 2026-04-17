/**
 * Retry Strategies for SIA_NEWS_v1.0
 * 
 * Provides exponential backoff with jitter for resilient operation handling.
 * Implements retry queues for failed operations and graceful degradation.
 * 
 * Features:
 * - Exponential backoff with jitter (initial 1s, max 32s)
 * - Configurable max retry attempts (3 for API calls, 5 for database operations)
 * - Retry queue for failed operations
 * - Graceful degradation for unavailable services
 * - Operation categorization (API, DATABASE, WEBSOCKET)
 * - Metrics tracking (retry attempts, success rate, queue size)
 */

// ============================================================================
// TYPES
// ============================================================================

export type OperationType = 'API' | 'DATABASE' | 'WEBSOCKET' | 'EXTERNAL_SERVICE'

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number
  /** Initial delay in milliseconds */
  initialDelay: number
  /** Maximum delay in milliseconds */
  maxDelay: number
  /** Maximum jitter in milliseconds */
  maxJitter: number
  /** Backoff multiplier */
  backoffMultiplier: number
  /** Operation type for logging */
  operationType: OperationType
}

export interface RetryResult<T> {
  success: boolean
  result?: T
  error?: Error
  attempts: number
  totalDelay: number
}

export interface QueuedOperation<T> {
  id: string
  operation: () => Promise<T>
  config: RetryConfig
  attempts: number
  lastAttemptTime: number
  nextRetryTime: number
  error?: Error
  priority: number
}

export interface RetryMetrics {
  operationType: OperationType
  totalAttempts: number
  successfulRetries: number
  failedRetries: number
  averageAttempts: number
  queueSize: number
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_RETRY_CONFIGS: Record<OperationType, RetryConfig> = {
  API: {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 32000, // 32 seconds
    maxJitter: 1000, // 1 second
    backoffMultiplier: 2,
    operationType: 'API',
  },
  DATABASE: {
    maxAttempts: 5,
    initialDelay: 500, // 0.5 seconds
    maxDelay: 16000, // 16 seconds
    maxJitter: 500, // 0.5 seconds
    backoffMultiplier: 2,
    operationType: 'DATABASE',
  },
  WEBSOCKET: {
    maxAttempts: 10,
    initialDelay: 2000, // 2 seconds
    maxDelay: 60000, // 60 seconds
    maxJitter: 2000, // 2 seconds
    backoffMultiplier: 2,
    operationType: 'WEBSOCKET',
  },
  EXTERNAL_SERVICE: {
    maxAttempts: 3,
    initialDelay: 1000, // 1 second
    maxDelay: 32000, // 32 seconds
    maxJitter: 1000, // 1 second
    backoffMultiplier: 2,
    operationType: 'EXTERNAL_SERVICE',
  },
}

// ============================================================================
// EXPONENTIAL BACKOFF WITH JITTER
// ============================================================================

/**
 * Calculates exponential backoff delay with jitter
 * Formula: min(initialDelay * backoffMultiplier^attempt + jitter, maxDelay)
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const { initialDelay, maxDelay, maxJitter, backoffMultiplier } = config

  // Calculate exponential delay
  const exponentialDelay = initialDelay * Math.pow(backoffMultiplier, attempt - 1)

  // Add random jitter to prevent thundering herd
  const jitter = Math.random() * maxJitter

  // Apply max delay cap
  const delay = Math.min(exponentialDelay + jitter, maxDelay)

  return Math.round(delay)
}

/**
 * Sleeps for the specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ============================================================================
// RETRY WITH EXPONENTIAL BACKOFF
// ============================================================================

/**
 * Retries an operation with exponential backoff and jitter
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> & { operationType: OperationType }
): Promise<RetryResult<T>> {
  const finalConfig: RetryConfig = {
    ...DEFAULT_RETRY_CONFIGS[config.operationType],
    ...config,
  }

  let lastError: Error | undefined
  let totalDelay = 0

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      console.log(
        `[RETRY] ${finalConfig.operationType}: Attempt ${attempt}/${finalConfig.maxAttempts}`
      )

      const result = await operation()

      console.log(
        `[RETRY] ${finalConfig.operationType}: Success on attempt ${attempt} (total delay: ${totalDelay}ms)`
      )

      return {
        success: true,
        result,
        attempts: attempt,
        totalDelay,
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      console.error(
        `[RETRY] ${finalConfig.operationType}: Attempt ${attempt} failed:`,
        lastError.message
      )

      // Don't retry if this was the last attempt
      if (attempt === finalConfig.maxAttempts) {
        break
      }

      // Calculate backoff delay
      const delay = calculateBackoffDelay(attempt, finalConfig)
      totalDelay += delay

      console.log(
        `[RETRY] ${finalConfig.operationType}: Retrying in ${delay}ms...`
      )

      await sleep(delay)
    }
  }

  console.error(
    `[RETRY] ${finalConfig.operationType}: Failed after ${finalConfig.maxAttempts} attempts (total delay: ${totalDelay}ms)`
  )

  return {
    success: false,
    error: lastError,
    attempts: finalConfig.maxAttempts,
    totalDelay,
  }
}

// ============================================================================
// RETRY QUEUE
// ============================================================================

/**
 * Manages a queue of failed operations for retry
 */
export class RetryQueue {
  private queue: Map<string, QueuedOperation<any>> = new Map()
  private processing = false
  private metrics: Map<OperationType, RetryMetrics> = new Map()

  /**
   * Adds an operation to the retry queue
   */
  enqueue<T>(
    id: string,
    operation: () => Promise<T>,
    config: Partial<RetryConfig> & { operationType: OperationType },
    priority: number = 0
  ): void {
    const finalConfig: RetryConfig = {
      ...DEFAULT_RETRY_CONFIGS[config.operationType],
      ...config,
    }

    const queuedOp: QueuedOperation<T> = {
      id,
      operation,
      config: finalConfig,
      attempts: 0,
      lastAttemptTime: 0,
      nextRetryTime: Date.now(),
      priority,
    }

    this.queue.set(id, queuedOp)

    console.log(
      `[RETRY_QUEUE] Enqueued operation ${id} (${finalConfig.operationType}, priority: ${priority})`
    )

    // Start processing if not already running
    if (!this.processing) {
      this.processQueue()
    }
  }

  /**
   * Removes an operation from the queue
   */
  dequeue(id: string): boolean {
    const removed = this.queue.delete(id)
    if (removed) {
      console.log(`[RETRY_QUEUE] Dequeued operation ${id}`)
    }
    return removed
  }

  /**
   * Gets the current queue size
   */
  size(): number {
    return this.queue.size
  }

  /**
   * Gets all queued operations
   */
  getAll(): QueuedOperation<any>[] {
    return Array.from(this.queue.values())
  }

  /**
   * Processes the retry queue
   */
  private async processQueue(): Promise<void> {
    this.processing = true

    while (this.queue.size > 0) {
      const now = Date.now()

      // Get operations ready for retry (sorted by priority)
      const readyOps = Array.from(this.queue.values())
        .filter((op) => op.nextRetryTime <= now)
        .sort((a, b) => b.priority - a.priority)

      if (readyOps.length === 0) {
        // Wait for the next operation to be ready
        const nextOp = Array.from(this.queue.values()).sort(
          (a, b) => a.nextRetryTime - b.nextRetryTime
        )[0]

        if (nextOp) {
          const waitTime = nextOp.nextRetryTime - now
          await sleep(Math.min(waitTime, 5000)) // Max 5 second wait
        } else {
          break
        }
        continue
      }

      // Process the highest priority operation
      const op = readyOps[0]
      await this.processOperation(op)
    }

    this.processing = false
  }

  /**
   * Processes a single operation
   */
  private async processOperation<T>(op: QueuedOperation<T>): Promise<void> {
    op.attempts++
    op.lastAttemptTime = Date.now()

    console.log(
      `[RETRY_QUEUE] Processing ${op.id} (attempt ${op.attempts}/${op.config.maxAttempts})`
    )

    try {
      await op.operation()

      // Success - remove from queue
      this.queue.delete(op.id)
      this.recordMetric(op.config.operationType, true, op.attempts)

      console.log(
        `[RETRY_QUEUE] Operation ${op.id} succeeded on attempt ${op.attempts}`
      )
    } catch (error) {
      op.error = error instanceof Error ? error : new Error(String(error))

      console.error(
        `[RETRY_QUEUE] Operation ${op.id} failed on attempt ${op.attempts}:`,
        op.error.message
      )

      if (op.attempts >= op.config.maxAttempts) {
        // Max attempts reached - remove from queue
        this.queue.delete(op.id)
        this.recordMetric(op.config.operationType, false, op.attempts)

        console.error(
          `[RETRY_QUEUE] Operation ${op.id} failed after ${op.attempts} attempts`
        )
      } else {
        // Schedule next retry
        const delay = calculateBackoffDelay(op.attempts, op.config)
        op.nextRetryTime = Date.now() + delay

        console.log(
          `[RETRY_QUEUE] Operation ${op.id} will retry in ${delay}ms`
        )
      }
    }
  }

  /**
   * Records metrics for an operation
   */
  private recordMetric(
    operationType: OperationType,
    success: boolean,
    attempts: number
  ): void {
    if (!this.metrics.has(operationType)) {
      this.metrics.set(operationType, {
        operationType,
        totalAttempts: 0,
        successfulRetries: 0,
        failedRetries: 0,
        averageAttempts: 0,
        queueSize: 0,
      })
    }

    const metric = this.metrics.get(operationType)!
    metric.totalAttempts += attempts

    if (success) {
      metric.successfulRetries++
    } else {
      metric.failedRetries++
    }

    const totalRetries = metric.successfulRetries + metric.failedRetries
    metric.averageAttempts = metric.totalAttempts / totalRetries
    metric.queueSize = this.queue.size
  }

  /**
   * Gets metrics for all operation types
   */
  getMetrics(): RetryMetrics[] {
    return Array.from(this.metrics.values())
  }

  /**
   * Gets metrics for a specific operation type
   */
  getMetricsByType(operationType: OperationType): RetryMetrics | null {
    return this.metrics.get(operationType) || null
  }

  /**
   * Clears all queued operations
   */
  clear(): void {
    this.queue.clear()
    console.log('[RETRY_QUEUE] Queue cleared')
  }
}

// ============================================================================
// GRACEFUL DEGRADATION
// ============================================================================

/**
 * Executes an operation with graceful degradation fallback
 */
export async function withGracefulDegradation<T>(
  operation: () => Promise<T>,
  fallback: () => T | Promise<T>,
  config: Partial<RetryConfig> & { operationType: OperationType }
): Promise<T> {
  const result = await retryWithBackoff(operation, config)

  if (result.success && result.result !== undefined) {
    return result.result
  }

  console.warn(
    `[GRACEFUL_DEGRADATION] ${config.operationType}: Using fallback after ${result.attempts} failed attempts`
  )

  return fallback()
}

/**
 * Executes an operation with optional result on failure
 */
export async function withOptionalResult<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> & { operationType: OperationType }
): Promise<T | null> {
  const result = await retryWithBackoff(operation, config)

  if (result.success && result.result !== undefined) {
    return result.result
  }

  console.warn(
    `[OPTIONAL_RESULT] ${config.operationType}: Operation failed after ${result.attempts} attempts, returning null`
  )

  return null
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const retryQueue = new RetryQueue()

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Retries an API call with exponential backoff
 */
export async function retryApiCall<T>(
  operation: () => Promise<T>,
  maxAttempts?: number
): Promise<RetryResult<T>> {
  return retryWithBackoff(operation, {
    operationType: 'API',
    maxAttempts: maxAttempts || DEFAULT_RETRY_CONFIGS.API.maxAttempts,
  })
}

/**
 * Retries a database operation with exponential backoff
 */
export async function retryDatabaseOperation<T>(
  operation: () => Promise<T>,
  maxAttempts?: number
): Promise<RetryResult<T>> {
  return retryWithBackoff(operation, {
    operationType: 'DATABASE',
    maxAttempts: maxAttempts || DEFAULT_RETRY_CONFIGS.DATABASE.maxAttempts,
  })
}

/**
 * Retries a WebSocket connection with exponential backoff
 */
export async function retryWebSocketConnection<T>(
  operation: () => Promise<T>,
  maxAttempts?: number
): Promise<RetryResult<T>> {
  return retryWithBackoff(operation, {
    operationType: 'WEBSOCKET',
    maxAttempts: maxAttempts || DEFAULT_RETRY_CONFIGS.WEBSOCKET.maxAttempts,
  })
}

/**
 * Adds a failed operation to the retry queue
 */
export function queueFailedOperation<T>(
  id: string,
  operation: () => Promise<T>,
  operationType: OperationType,
  priority: number = 0
): void {
  retryQueue.enqueue(id, operation, { operationType }, priority)
}

/**
 * Gets retry queue metrics
 */
export function getRetryMetrics(): RetryMetrics[] {
  return retryQueue.getMetrics()
}

/**
 * Gets retry queue size
 */
export function getRetryQueueSize(): number {
  return retryQueue.size()
}
