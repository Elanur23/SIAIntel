/**
 * Unit tests for Circuit Breaker Pattern Implementation
 * 
 * Tests circuit breaker state transitions, failure handling,
 * automatic recovery, and metrics tracking.
 */

import {
  CircuitBreaker,
  CircuitBreakerManager,
  withCircuitBreaker,
  getCircuitBreakerMetrics,
  getAllCircuitBreakerMetrics,
  resetCircuitBreaker,
  circuitBreakerManager,
  type CircuitBreakerEvent
} from '../circuit-breaker'

describe('Circuit Breaker Pattern', () => {
  describe('CircuitBreaker Class', () => {
    let breaker: CircuitBreaker

    beforeEach(() => {
      breaker = new CircuitBreaker({
        serviceName: 'test-service',
        failureThreshold: 3,
        halfOpenTimeout: 1000,
        successThreshold: 2
      })
    })

    test('should start in CLOSED state', () => {
      const state = breaker.getState()
      expect(state.state).toBe('CLOSED')
      expect(state.failures).toBe(0)
    })

    test('should execute successful operations', async () => {
      const result = await breaker.execute(async () => 'success')
      expect(result).toBe('success')
      
      const state = breaker.getState()
      expect(state.failures).toBe(0)
    })

    test('should track failures', async () => {
      const errors: Error[] = []
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Test failure')
          })
        } catch (error) {
          errors.push(error as Error)
        }
      }
      
      expect(errors.length).toBe(2)
      const state = breaker.getState()
      expect(state.failures).toBe(2)
      expect(state.state).toBe('CLOSED')
    })

    test('should open circuit after threshold failures', async () => {
      const errors: Error[] = []
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Test failure')
          })
        } catch (error) {
          errors.push(error as Error)
        }
      }
      
      expect(errors.length).toBe(3)
      const state = breaker.getState()
      expect(state.state).toBe('OPEN')
    })

    test('should reject requests when circuit is OPEN', async () => {
      // Trigger circuit to open
      const errors: Error[] = []
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Test failure')
          })
        } catch (error) {
          errors.push(error as Error)
        }
      }
      
      expect(errors.length).toBe(3)
      
      // Try to execute when circuit is open
      await expect(
        breaker.execute(async () => 'should not execute')
      ).rejects.toThrow('Circuit breaker is OPEN')
    })

    test('should transition to HALF_OPEN after timeout', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Test failure')
          })
        } catch (error) {
          // Expected
        }
      }
      
      expect(breaker.getState().state).toBe('OPEN')
      
      // Wait for half-open timeout
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // Next request should transition to HALF_OPEN
      try {
        await breaker.execute(async () => 'test')
      } catch (error) {
        // May fail, but should transition
      }
      
      const state = breaker.getState()
      expect(['HALF_OPEN', 'CLOSED']).toContain(state.state)
    })

    test('should close circuit after successful recoveries in HALF_OPEN', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Test failure')
          })
        } catch (error) {
          // Expected
        }
      }
      
      // Wait for half-open timeout
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // Execute successful operations
      for (let i = 0; i < 2; i++) {
        await breaker.execute(async () => 'success')
      }
      
      const state = breaker.getState()
      expect(state.state).toBe('CLOSED')
      expect(state.failures).toBe(0)
    })

    test('should reopen circuit on failure in HALF_OPEN', async () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Test failure')
          })
        } catch (error) {
          // Expected
        }
      }
      
      // Wait for half-open timeout
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      // Fail in HALF_OPEN state
      try {
        await breaker.execute(async () => {
          throw new Error('Test failure')
        })
      } catch (error) {
        // Expected
      }
      
      const state = breaker.getState()
      expect(state.state).toBe('OPEN')
    })

    test('should reset failures on success in CLOSED state', async () => {
      // Cause some failures
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Test failure')
          })
        } catch (error) {
          // Expected
        }
      }
      
      expect(breaker.getState().failures).toBe(2)
      
      // Successful operation should reset failures
      await breaker.execute(async () => 'success')
      
      expect(breaker.getState().failures).toBe(0)
    })

    test('should track metrics correctly', async () => {
      await breaker.execute(async () => 'success')
      
      const metrics = breaker.getMetrics()
      expect(metrics.serviceName).toBe('test-service')
      expect(metrics.state).toBe('CLOSED')
      expect(metrics.failures).toBe(0)
    })

    test('should emit events for state changes', async () => {
      const events: CircuitBreakerEvent[] = []
      breaker.on((event) => events.push(event))
      
      // Trigger state change
      for (let i = 0; i < 3; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Test failure')
          })
        } catch (error) {
          // Expected
        }
      }
      
      const stateChangeEvents = events.filter(e => e.type === 'STATE_CHANGE')
      expect(stateChangeEvents.length).toBeGreaterThan(0)
    })

    test('should manually reset circuit breaker', () => {
      // Open the circuit
      for (let i = 0; i < 3; i++) {
        try {
          breaker.execute(async () => {
            throw new Error('Test failure')
          })
        } catch (error) {
          // Expected
        }
      }
      
      breaker.reset()
      
      const state = breaker.getState()
      expect(state.state).toBe('CLOSED')
      expect(state.failures).toBe(0)
    })
  })

  describe('CircuitBreakerManager', () => {
    let manager: CircuitBreakerManager

    beforeEach(() => {
      manager = new CircuitBreakerManager()
    })

    test('should create and retrieve circuit breakers', () => {
      const breaker1 = manager.getBreaker('service-1')
      const breaker2 = manager.getBreaker('service-1')
      
      expect(breaker1).toBe(breaker2) // Same instance
    })

    test('should manage multiple circuit breakers', () => {
      manager.getBreaker('service-1')
      manager.getBreaker('service-2')
      manager.getBreaker('service-3')
      
      const allBreakers = manager.getAllBreakers()
      expect(allBreakers.size).toBe(3)
    })

    test('should get metrics for all breakers', async () => {
      const breaker1 = manager.getBreaker('service-1')
      const breaker2 = manager.getBreaker('service-2')
      
      await breaker1.execute(async () => 'success')
      await breaker2.execute(async () => 'success')
      
      const metrics = manager.getAllMetrics()
      expect(metrics.length).toBe(2)
    })

    test('should reset all circuit breakers', async () => {
      const breaker1 = manager.getBreaker('service-1', { failureThreshold: 2 })
      const breaker2 = manager.getBreaker('service-2', { failureThreshold: 2 })
      
      // Open both circuits
      for (let i = 0; i < 2; i++) {
        try {
          await breaker1.execute(async () => { throw new Error('fail') })
          await breaker2.execute(async () => { throw new Error('fail') })
        } catch (error) {
          // Expected
        }
      }
      
      manager.resetAll()
      
      expect(breaker1.getState().state).toBe('CLOSED')
      expect(breaker2.getState().state).toBe('CLOSED')
    })

    test('should forward events to global listeners', async () => {
      const events: CircuitBreakerEvent[] = []
      manager.on((event) => events.push(event))
      
      const breaker = manager.getBreaker('test-service', { failureThreshold: 2 })
      
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('Test failure')
          })
        } catch (error) {
          // Expected
        }
      }
      
      expect(events.length).toBeGreaterThan(0)
    })
  })

  describe('Convenience Functions', () => {
    beforeEach(() => {
      circuitBreakerManager.resetAll()
    })

    test('withCircuitBreaker should execute with protection', async () => {
      const result = await withCircuitBreaker(
        'test-service',
        async () => 'success'
      )
      
      expect(result).toBe('success')
    })

    test('getCircuitBreakerMetrics should return metrics', async () => {
      await withCircuitBreaker('test-service', async () => 'success')
      
      const metrics = getCircuitBreakerMetrics('test-service')
      expect(metrics).toBeDefined()
      expect(metrics?.serviceName).toBe('test-service')
    })

    test('getAllCircuitBreakerMetrics should return all metrics', async () => {
      await withCircuitBreaker('service-1', async () => 'success')
      await withCircuitBreaker('service-2', async () => 'success')
      
      const allMetrics = getAllCircuitBreakerMetrics()
      expect(allMetrics.length).toBeGreaterThanOrEqual(2)
    })

    test('resetCircuitBreaker should reset specific breaker', async () => {
      const breaker = circuitBreakerManager.getBreaker('test-service', {
        failureThreshold: 2
      })
      
      // Open the circuit
      for (let i = 0; i < 2; i++) {
        try {
          await breaker.execute(async () => {
            throw new Error('fail')
          })
        } catch (error) {
          // Expected
        }
      }
      
      expect(breaker.getState().state).toBe('OPEN')
      
      resetCircuitBreaker('test-service')
      
      expect(breaker.getState().state).toBe('CLOSED')
    })
  })

  describe('Error Scenarios', () => {
    test('should handle async operation errors', async () => {
      const breaker = new CircuitBreaker({
        serviceName: 'test-service',
        failureThreshold: 3
      })
      
      await expect(
        breaker.execute(async () => {
          throw new Error('Async error')
        })
      ).rejects.toThrow('Async error')
    })

    test('should handle synchronous errors in async operations', async () => {
      const breaker = new CircuitBreaker({
        serviceName: 'test-service',
        failureThreshold: 3
      })
      
      await expect(
        breaker.execute(async () => {
          throw new Error('Sync error in async')
        })
      ).rejects.toThrow('Sync error in async')
    })

    test('should handle event listener errors gracefully', async () => {
      const breaker = new CircuitBreaker({
        serviceName: 'test-service',
        failureThreshold: 2
      })
      
      breaker.on(() => {
        throw new Error('Listener error')
      })
      
      // Should not throw despite listener error
      await expect(
        breaker.execute(async () => 'success')
      ).resolves.toBe('success')
    })
  })
})
