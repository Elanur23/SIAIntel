/**
 * Circuit Breaker Pattern Implementation for SIA_NEWS_v1.0
 * 
 * Provides fault tolerance and automatic recovery for external services.
 * Prevents cascading failures by stopping requests to failing services.
 * 
 * States:
 * - CLOSED: Normal operation, requests pass through
 * - OPEN: Service is failing, requests are rejected immediately
 * - HALF_OPEN: Testing if service has recovered
 * 
 * Configuration:
 * - Failure threshold: 5 consecutive failures to open
 * - Half-open timeout: 60 seconds before testing recovery
 * - Success threshold: 3 consecutive successes to close
 * 
 * Features:
 * - Per-service circuit breakers
 * - Automatic state transitions
 * - Metrics tracking (state changes, failure counts, recovery attempts)
 * - Event notifications for monitoring
 */

// ============================================================================
// TYPES
// ============================================================================

export type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

export interface CircuitBreakerConfig {
  /** Number of consecutive failures before opening the circuit */
  failureThreshold: number
  /** Time in milliseconds to wait before attempting recovery (HALF_OPEN) */
  halfOpenTimeout: number
  /** Number of consecutive successes needed to close the circuit */
  successThreshold: number
  /** Service name for logging and monitoring */
  serviceName: string
}

export interface CircuitBreakerState {
  /** Current circuit state */
  state: CircuitState
  /** Number of consecutive failures */
  failures: number
  /** Timestamp of last failure */
  lastFailureTime: number
  /** Number of consecutive successes in HALF_OPEN state */
  successCount: number
  /** Total number of state transitions */
  stateTransitions: number
  /** Timestamp of last state change */
  lastStateChange: number
}

export interface CircuitBreakerMetrics {
  serviceName: string
  state: CircuitState
  failures: number
  successCount: number
  stateTransitions: number
  lastFailureTime: number
  lastStateChange: number
  uptime: number
}

export type CircuitBreakerEvent = 
  | { type: 'STATE_CHANGE'; from: CircuitState; to: CircuitState; serviceName: string; timestamp: number }
  | { type: 'FAILURE'; serviceName: string; error: string; timestamp: number }
  | { type: 'SUCCESS'; serviceName: string; timestamp: number }
  | { type: 'REJECTED'; serviceName: string; reason: string; timestamp: number }

// ============================================================================
// DEFAULT CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: Omit<CircuitBreakerConfig, 'serviceName'> = {
  failureThreshold: 5,
  halfOpenTimeout: 60000, // 60 seconds
  successThreshold: 3,
}

// ============================================================================
// CIRCUIT BREAKER CLASS
// ============================================================================

export class CircuitBreaker {
  private config: CircuitBreakerConfig
  private state: CircuitBreakerState
  private eventListeners: Array<(event: CircuitBreakerEvent) => void> = []

  constructor(config: Partial<CircuitBreakerConfig> & { serviceName: string }) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.state = {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      successCount: 0,
      stateTransitions: 0,
      lastStateChange: Date.now(),
    }

    console.log(`[CIRCUIT_BREAKER] Initialized for service: ${this.config.serviceName}`)
  }

  /**
   * Executes an operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check if circuit is open
    if (this.state.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - this.state.lastFailureTime
      
      if (timeSinceLastFailure < this.config.halfOpenTimeout) {
        const waitTime = Math.ceil((this.config.halfOpenTimeout - timeSinceLastFailure) / 1000)
        const error = new Error(
          `Circuit breaker is OPEN for ${this.config.serviceName}. Retry after ${waitTime}s`
        )
        
        this.emitEvent({
          type: 'REJECTED',
          serviceName: this.config.serviceName,
          reason: `Circuit OPEN, retry after ${waitTime}s`,
          timestamp: Date.now(),
        })
        
        throw error
      }
      
      // Transition to HALF_OPEN
      this.transitionTo('HALF_OPEN')
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure(error)
      throw error
    }
  }

  /**
   * Records a successful operation
   */
  private onSuccess(): void {
    this.emitEvent({
      type: 'SUCCESS',
      serviceName: this.config.serviceName,
      timestamp: Date.now(),
    })

    if (this.state.state === 'HALF_OPEN') {
      this.state.successCount++
      
      console.log(
        `[CIRCUIT_BREAKER] ${this.config.serviceName}: Success in HALF_OPEN (${this.state.successCount}/${this.config.successThreshold})`
      )
      
      if (this.state.successCount >= this.config.successThreshold) {
        this.transitionTo('CLOSED')
      }
    } else if (this.state.state === 'CLOSED') {
      // Reset failure count on success
      this.state.failures = 0
    }
  }

  /**
   * Records a failed operation
   */
  private onFailure(error: any): void {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    this.emitEvent({
      type: 'FAILURE',
      serviceName: this.config.serviceName,
      error: errorMessage,
      timestamp: Date.now(),
    })

    this.state.failures++
    this.state.lastFailureTime = Date.now()

    console.error(
      `[CIRCUIT_BREAKER] ${this.config.serviceName}: Failure recorded (${this.state.failures}/${this.config.failureThreshold})`,
      errorMessage
    )

    if (this.state.state === 'HALF_OPEN') {
      // Immediate transition to OPEN on failure in HALF_OPEN
      this.transitionTo('OPEN')
    } else if (this.state.failures >= this.config.failureThreshold) {
      this.transitionTo('OPEN')
    }
  }

  /**
   * Transitions the circuit breaker to a new state
   */
  private transitionTo(newState: CircuitState): void {
    const oldState = this.state.state
    
    if (oldState === newState) {
      return
    }

    this.state.state = newState
    this.state.stateTransitions++
    this.state.lastStateChange = Date.now()

    // Reset counters based on new state
    if (newState === 'CLOSED') {
      this.state.failures = 0
      this.state.successCount = 0
    } else if (newState === 'HALF_OPEN') {
      this.state.successCount = 0
    }

    console.log(
      `[CIRCUIT_BREAKER] ${this.config.serviceName}: State transition ${oldState} → ${newState}`
    )

    this.emitEvent({
      type: 'STATE_CHANGE',
      from: oldState,
      to: newState,
      serviceName: this.config.serviceName,
      timestamp: Date.now(),
    })
  }

  /**
   * Gets the current circuit breaker state
   */
  getState(): CircuitBreakerState {
    return { ...this.state }
  }

  /**
   * Gets circuit breaker metrics
   */
  getMetrics(): CircuitBreakerMetrics {
    return {
      serviceName: this.config.serviceName,
      state: this.state.state,
      failures: this.state.failures,
      successCount: this.state.successCount,
      stateTransitions: this.state.stateTransitions,
      lastFailureTime: this.state.lastFailureTime,
      lastStateChange: this.state.lastStateChange,
      uptime: Date.now() - this.state.lastStateChange,
    }
  }

  /**
   * Manually resets the circuit breaker (for testing or manual recovery)
   */
  reset(): void {
    const oldState = this.state.state
    
    this.state = {
      state: 'CLOSED',
      failures: 0,
      lastFailureTime: 0,
      successCount: 0,
      stateTransitions: this.state.stateTransitions + 1,
      lastStateChange: Date.now(),
    }

    console.log(`[CIRCUIT_BREAKER] ${this.config.serviceName}: Manually reset from ${oldState}`)
    
    if (oldState !== 'CLOSED') {
      this.emitEvent({
        type: 'STATE_CHANGE',
        from: oldState,
        to: 'CLOSED',
        serviceName: this.config.serviceName,
        timestamp: Date.now(),
      })
    }
  }

  /**
   * Registers an event listener
   */
  on(listener: (event: CircuitBreakerEvent) => void): void {
    this.eventListeners.push(listener)
  }

  /**
   * Removes an event listener
   */
  off(listener: (event: CircuitBreakerEvent) => void): void {
    this.eventListeners = this.eventListeners.filter((l) => l !== listener)
  }

  /**
   * Emits an event to all listeners
   */
  private emitEvent(event: CircuitBreakerEvent): void {
    this.eventListeners.forEach((listener) => {
      try {
        listener(event)
      } catch (error) {
        console.error('[CIRCUIT_BREAKER] Error in event listener:', error)
      }
    })
  }
}

// ============================================================================
// CIRCUIT BREAKER MANAGER
// ============================================================================

/**
 * Manages multiple circuit breakers for different services
 */
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map()
  private globalEventListeners: Array<(event: CircuitBreakerEvent) => void> = []

  /**
   * Gets or creates a circuit breaker for a service
   */
  getBreaker(serviceName: string, config?: Partial<CircuitBreakerConfig>): CircuitBreaker {
    if (!this.breakers.has(serviceName)) {
      const breaker = new CircuitBreaker({ serviceName, ...config })
      
      // Forward events to global listeners
      breaker.on((event) => {
        this.globalEventListeners.forEach((listener) => {
          try {
            listener(event)
          } catch (error) {
            console.error('[CIRCUIT_BREAKER_MANAGER] Error in global event listener:', error)
          }
        })
      })
      
      this.breakers.set(serviceName, breaker)
    }
    
    return this.breakers.get(serviceName)!
  }

  /**
   * Gets all circuit breakers
   */
  getAllBreakers(): Map<string, CircuitBreaker> {
    return new Map(this.breakers)
  }

  /**
   * Gets metrics for all circuit breakers
   */
  getAllMetrics(): CircuitBreakerMetrics[] {
    return Array.from(this.breakers.values()).map((breaker) => breaker.getMetrics())
  }

  /**
   * Resets all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset())
    console.log('[CIRCUIT_BREAKER_MANAGER] All circuit breakers reset')
  }

  /**
   * Registers a global event listener
   */
  on(listener: (event: CircuitBreakerEvent) => void): void {
    this.globalEventListeners.push(listener)
  }

  /**
   * Removes a global event listener
   */
  off(listener: (event: CircuitBreakerEvent) => void): void {
    this.globalEventListeners = this.globalEventListeners.filter((l) => l !== listener)
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const circuitBreakerManager = new CircuitBreakerManager()

// ============================================================================
// CONVENIENCE FUNCTIONS
// ============================================================================

/**
 * Executes an operation with circuit breaker protection
 */
export async function withCircuitBreaker<T>(
  serviceName: string,
  operation: () => Promise<T>,
  config?: Partial<CircuitBreakerConfig>
): Promise<T> {
  const breaker = circuitBreakerManager.getBreaker(serviceName, config)
  return breaker.execute(operation)
}

/**
 * Gets circuit breaker metrics for a service
 */
export function getCircuitBreakerMetrics(serviceName: string): CircuitBreakerMetrics | null {
  const breaker = circuitBreakerManager.getAllBreakers().get(serviceName)
  return breaker ? breaker.getMetrics() : null
}

/**
 * Gets all circuit breaker metrics
 */
export function getAllCircuitBreakerMetrics(): CircuitBreakerMetrics[] {
  return circuitBreakerManager.getAllMetrics()
}

/**
 * Resets a circuit breaker
 */
export function resetCircuitBreaker(serviceName: string): void {
  const breaker = circuitBreakerManager.getAllBreakers().get(serviceName)
  if (breaker) {
    breaker.reset()
  }
}

/**
 * Registers a global circuit breaker event listener
 */
export function onCircuitBreakerEvent(listener: (event: CircuitBreakerEvent) => void): void {
  circuitBreakerManager.on(listener)
}
