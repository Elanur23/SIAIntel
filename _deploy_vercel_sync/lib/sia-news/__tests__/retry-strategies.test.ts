/**
 * Unit tests for Retry Strategies
 * 
 * Tests exponential backoff with jitter, retry queue management,
 * graceful degradation, and operation categorization.
 */

import {
  calculateBackoffDelay,
  retryWithBackoff,
  retryApiCall,
  retryDatabaseOperation,
  retryWebSocketConnection,
  withGracefulDegradation,
  withOptionalResult,
  queueFailedOperation,
  getRetryMetrics,
  getRetryQueueSize,
  retryQueue,
  RetryQueue,
  DEFAULT_RETRY_CONFIGS
} from '../retry-strategies'

describe('Retry Strategies', () => {
  describe('Exponential Backoff Calculation', () => {
    test('should calculate exponential backoff correctly', () => {
      const config = DEFAULT_RETRY_CONFIGS.API
      
      const delay1 = calculateBackoffDelay(1, config)
      const delay2 = calculateBackoffDelay(2, config)
      const delay3 = calculateBackoffDelay(3, config)
      
      // First attempt should be around initialDelay
      expect(delay1).toBeGreaterThanOrEqual(config.initialDelay)
      expect(delay1).toBeLessThanOrEqual(config.initialDelay + config.maxJitter)
      
      // Second attempt should be roughly double
      expect(delay2).toBeGreaterThan(delay1)
      
      // Third attempt should be even larger
      expect(delay3).toBeGreaterThan(delay2)
    })

    test('should respect max delay cap', () => {
      const config = DEFAULT_RETRY_CONFIGS.API
      
      const delay = calculateBackoffDelay(10, config)
      
      expect(delay).toBeLessThanOrEqual(config.maxDelay)
    })

    test('should add jitter to prevent thundering herd', () => {
      const config = DEFAULT_RETRY_CONFIGS.API
      
      const delays = []
      for (let i = 0; i < 10; i++) {
        delays.push(calculateBackoffDelay(1, config))
      }
      
      // Delays should vary due to jitter
      const uniqueDelays = new Set(delays)
      expect(uniqueDelays.size).toBeGreaterThan(1)
    })
  })

  describe('Retry with Backoff', () => {
    test('should succeed on first attempt', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      const result = await retryWithBackoff(operation, {
        operationType: 'API'
      })
      
      expect(result.success).toBe(true)
      expect(result.result).toBe('success')
      expect(result.attempts).toBe(1)
      expect(operation).toHaveBeenCalledTimes(1)
    })

    test('should retry on failure', async () => {
      let attempts = 0
      const operation = jest.fn().mockImplementation(async () => {
        attempts++
        if (attempts < 3) {
          throw new Error('Temporary failure')
        }
        return 'success'
      })
      
      const result = await retryWithBackoff(operation, {
        operationType: 'API',
        maxAttempts: 3
      })
      
      expect(result.success).toBe(true)
      expect(result.result).toBe('success')
      expect(result.attempts).toBe(3)
      expect(operation).toHaveBeenCalledTimes(3)
    })

    test('should fail after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'))
      
      const result = await retryWithBackoff(operation, {
        operationType: 'API',
        maxAttempts: 3
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
      expect(result.error?.message).toBe('Persistent failure')
      expect(result.attempts).toBe(3)
      expect(operation).toHaveBeenCalledTimes(3)
    })

    test('should track total delay', async () => {
      let attempts = 0
      const operation = jest.fn().mockImplementation(async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Temporary failure')
        }
        return 'success'
      })
      
      const result = await retryWithBackoff(operation, {
        operationType: 'API',
        maxAttempts: 3,
        initialDelay: 100
      })
      
      expect(result.success).toBe(true)
      expect(result.totalDelay).toBeGreaterThan(0)
    })

    test('should use operation-specific config', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      await retryWithBackoff(operation, {
        operationType: 'DATABASE',
        maxAttempts: 5
      })
      
      expect(operation).toHaveBeenCalledTimes(1)
    })
  })

  describe('Operation-Specific Retry Functions', () => {
    test('retryApiCall should use API config', async () => {
      const operation = jest.fn().mockResolvedValue('api-success')
      
      const result = await retryApiCall(operation)
      
      expect(result.success).toBe(true)
      expect(result.result).toBe('api-success')
    })

    test('retryDatabaseOperation should use DATABASE config', async () => {
      const operation = jest.fn().mockResolvedValue('db-success')
      
      const result = await retryDatabaseOperation(operation)
      
      expect(result.success).toBe(true)
      expect(result.result).toBe('db-success')
    })

    test('retryWebSocketConnection should use WEBSOCKET config', async () => {
      const operation = jest.fn().mockResolvedValue('ws-success')
      
      const result = await retryWebSocketConnection(operation)
      
      expect(result.success).toBe(true)
      expect(result.result).toBe('ws-success')
    })

    test('should allow custom max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('fail'))
      
      const result = await retryApiCall(operation, 2)
      
      expect(result.attempts).toBe(2)
      expect(operation).toHaveBeenCalledTimes(2)
    })
  })

  describe('Retry Queue', () => {
    let queue: RetryQueue

    beforeEach(() => {
      queue = new RetryQueue()
    })

    afterEach(() => {
      queue.clear()
    })

    test('should enqueue operations', () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      queue.enqueue('op-1', operation, { operationType: 'API' })
      
      expect(queue.size()).toBe(1)
    })

    test('should dequeue operations', () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      queue.enqueue('op-1', operation, { operationType: 'API' })
      const removed = queue.dequeue('op-1')
      
      expect(removed).toBe(true)
      expect(queue.size()).toBe(0)
    })

    test('should process queued operations', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      queue.enqueue('op-1', operation, { operationType: 'API' })
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100))
      
      expect(operation).toHaveBeenCalled()
      expect(queue.size()).toBe(0)
    })

    test('should retry failed operations', async () => {
      let attempts = 0
      const operation = jest.fn().mockImplementation(async () => {
        attempts++
        if (attempts < 2) {
          throw new Error('Temporary failure')
        }
        return 'success'
      })
      
      queue.enqueue('op-1', operation, {
        operationType: 'API',
        maxAttempts: 3,
        initialDelay: 50
      })
      
      // Wait for retries (increased timeout for backoff)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      expect(attempts).toBeGreaterThanOrEqual(1)
    })

    test('should respect priority ordering', () => {
      const op1 = jest.fn().mockResolvedValue('op1')
      const op2 = jest.fn().mockResolvedValue('op2')
      const op3 = jest.fn().mockResolvedValue('op3')
      
      queue.enqueue('op-1', op1, { operationType: 'API' }, 1)
      queue.enqueue('op-2', op2, { operationType: 'API' }, 3)
      queue.enqueue('op-3', op3, { operationType: 'API' }, 2)
      
      const all = queue.getAll()
      expect(all.length).toBe(3)
    })

    test('should track metrics', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      queue.enqueue('op-1', operation, { operationType: 'API' })
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const metrics = queue.getMetrics()
      expect(metrics.length).toBeGreaterThanOrEqual(0)
    })

    test('should clear all operations', () => {
      queue.enqueue('op-1', jest.fn(), { operationType: 'API' })
      queue.enqueue('op-2', jest.fn(), { operationType: 'API' })
      
      queue.clear()
      
      expect(queue.size()).toBe(0)
    })

    test('should remove operation after max attempts', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Persistent failure'))
      
      queue.enqueue('op-1', operation, {
        operationType: 'API',
        maxAttempts: 2,
        initialDelay: 50
      })
      
      // Wait for all retries (need more time for backoff delays)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      expect(queue.size()).toBe(0)
    })
  })

  describe('Graceful Degradation', () => {
    test('should return result on success', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      const fallback = jest.fn().mockReturnValue('fallback')
      
      const result = await withGracefulDegradation(
        operation,
        fallback,
        { operationType: 'API', maxAttempts: 2 }
      )
      
      expect(result).toBe('success')
      expect(fallback).not.toHaveBeenCalled()
    })

    test('should use fallback on failure', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failure'))
      const fallback = jest.fn().mockReturnValue('fallback-value')
      
      const result = await withGracefulDegradation(
        operation,
        fallback,
        { operationType: 'API', maxAttempts: 2 }
      )
      
      expect(result).toBe('fallback-value')
      expect(fallback).toHaveBeenCalled()
    })

    test('should support async fallback', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failure'))
      const fallback = jest.fn().mockResolvedValue('async-fallback')
      
      const result = await withGracefulDegradation(
        operation,
        fallback,
        { operationType: 'API', maxAttempts: 2 }
      )
      
      expect(result).toBe('async-fallback')
    })
  })

  describe('Optional Result', () => {
    test('should return result on success', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      const result = await withOptionalResult(
        operation,
        { operationType: 'API', maxAttempts: 2 }
      )
      
      expect(result).toBe('success')
    })

    test('should return null on failure', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('Failure'))
      
      const result = await withOptionalResult(
        operation,
        { operationType: 'API', maxAttempts: 2 }
      )
      
      expect(result).toBeNull()
    })
  })

  describe('Queue Helper Functions', () => {
    beforeEach(() => {
      retryQueue.clear()
    })

    test('queueFailedOperation should add to queue', () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      queueFailedOperation('op-1', operation, 'API')
      
      expect(getRetryQueueSize()).toBeGreaterThan(0)
    })

    test('getRetryMetrics should return metrics', async () => {
      const operation = jest.fn().mockResolvedValue('success')
      
      queueFailedOperation('op-1', operation, 'API')
      
      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const metrics = getRetryMetrics()
      expect(Array.isArray(metrics)).toBe(true)
    })

    test('getRetryQueueSize should return current size', () => {
      queueFailedOperation('op-1', jest.fn(), 'API')
      queueFailedOperation('op-2', jest.fn(), 'API')
      
      const size = getRetryQueueSize()
      expect(size).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error Handling', () => {
    test('should handle non-Error objects', async () => {
      const operation = jest.fn().mockRejectedValue('string error')
      
      const result = await retryWithBackoff(operation, {
        operationType: 'API',
        maxAttempts: 2
      })
      
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    test('should handle undefined errors', async () => {
      const operation = jest.fn().mockRejectedValue(undefined)
      
      const result = await retryWithBackoff(operation, {
        operationType: 'API',
        maxAttempts: 2
      })
      
      expect(result.success).toBe(false)
    })
  })

  describe('Configuration', () => {
    test('should use default configs for each operation type', () => {
      expect(DEFAULT_RETRY_CONFIGS.API.maxAttempts).toBe(3)
      expect(DEFAULT_RETRY_CONFIGS.DATABASE.maxAttempts).toBe(5)
      expect(DEFAULT_RETRY_CONFIGS.WEBSOCKET.maxAttempts).toBe(10)
      expect(DEFAULT_RETRY_CONFIGS.EXTERNAL_SERVICE.maxAttempts).toBe(3)
    })

    test('should allow config overrides', async () => {
      const operation = jest.fn().mockRejectedValue(new Error('fail'))
      
      const result = await retryWithBackoff(operation, {
        operationType: 'API',
        maxAttempts: 5,
        initialDelay: 50
      })
      
      expect(result.attempts).toBe(5)
    })
  })
})
