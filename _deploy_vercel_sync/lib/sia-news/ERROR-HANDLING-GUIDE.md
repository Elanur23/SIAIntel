# Error Handling and Recovery Mechanisms - Implementation Guide

## Overview

The SIA_NEWS_v1.0 system implements comprehensive error handling and recovery mechanisms to ensure resilient operation across all external services and internal components. This guide documents the circuit breaker pattern, retry strategies, and graceful degradation implementations.

## Architecture

### Components

1. **Circuit Breaker** (`circuit-breaker.ts`)
   - Prevents cascading failures
   - Automatic state management (CLOSED → OPEN → HALF_OPEN)
   - Per-service isolation
   - Event-driven monitoring

2. **Retry Strategies** (`retry-strategies.ts`)
   - Exponential backoff with jitter
   - Operation-specific configurations
   - Retry queue for failed operations
   - Graceful degradation support

3. **Monitoring Integration** (`monitoring.ts`)
   - Circuit breaker event tracking
   - Retry metrics collection
   - System health monitoring
   - Alerting on service degradation

## Circuit Breaker Pattern

### States

```
CLOSED (Normal Operation)
    ↓ (5 consecutive failures)
OPEN (Failing - Reject Requests)
    ↓ (60 seconds timeout)
HALF_OPEN (Testing Recovery)
    ↓ (3 consecutive successes)
CLOSED (Recovered)
```

### Configuration

```typescript
{
  failureThreshold: 5,      // Open after 5 consecutive failures
  halfOpenTimeout: 60000,   // Wait 60s before testing recovery
  successThreshold: 3       // Close after 3 consecutive successes
}
```

### Usage

#### Basic Usage

```typescript
import { withCircuitBreaker } from '@/lib/sia-news/circuit-breaker'

// Execute operation with circuit breaker protection
const result = await withCircuitBreaker(
  'GEMINI_API',
  async () => {
    return await geminiApi.generateContent(prompt)
  },
  {
    failureThreshold: 5,
    halfOpenTimeout: 60000,
    successThreshold: 3
  }
)
```

#### Using Circuit Breaker Manager

```typescript
import { circuitBreakerManager } from '@/lib/sia-news/circuit-breaker'

// Get or create a circuit breaker for a service
const breaker = circuitBreakerManager.getBreaker('MY_SERVICE', {
  failureThreshold: 3,
  halfOpenTimeout: 30000,
  successThreshold: 2
})

// Execute operation
const result = await breaker.execute(async () => {
  return await myService.doSomething()
})
```

#### Monitoring Circuit Breaker State

```typescript
import { 
  getCircuitBreakerMetrics,
  getAllCircuitBreakerMetrics 
} from '@/lib/sia-news/circuit-breaker'

// Get metrics for a specific service
const metrics = getCircuitBreakerMetrics('GEMINI_API')
console.log(`State: ${metrics.state}`)
console.log(`Failures: ${metrics.failures}`)
console.log(`State Transitions: ${metrics.stateTransitions}`)

// Get metrics for all services
const allMetrics = getAllCircuitBreakerMetrics()
allMetrics.forEach(m => {
  console.log(`${m.serviceName}: ${m.state}`)
})
```

#### Event Listening

```typescript
import { onCircuitBreakerEvent } from '@/lib/sia-news/circuit-breaker'

// Listen to all circuit breaker events
onCircuitBreakerEvent((event) => {
  if (event.type === 'STATE_CHANGE') {
    console.log(`${event.serviceName}: ${event.from} → ${event.to}`)
    
    if (event.to === 'OPEN') {
      // Alert: Service is down
      sendAlert('Service degradation detected')
    }
  }
})
```

## Retry Strategies

### Exponential Backoff Formula

```
delay = min(initialDelay * backoffMultiplier^(attempt-1) + jitter, maxDelay)
```

Example delays (initial=1s, multiplier=2, jitter=0-1s):
- Attempt 1: 1s + jitter
- Attempt 2: 2s + jitter
- Attempt 3: 4s + jitter
- Attempt 4: 8s + jitter (capped at maxDelay)

### Default Configurations

#### API Calls
```typescript
{
  maxAttempts: 3,
  initialDelay: 1000,    // 1 second
  maxDelay: 32000,       // 32 seconds
  maxJitter: 1000,       // 1 second
  backoffMultiplier: 2
}
```

#### Database Operations
```typescript
{
  maxAttempts: 5,
  initialDelay: 500,     // 0.5 seconds
  maxDelay: 16000,       // 16 seconds
  maxJitter: 500,        // 0.5 seconds
  backoffMultiplier: 2
}
```

#### WebSocket Connections
```typescript
{
  maxAttempts: 10,
  initialDelay: 2000,    // 2 seconds
  maxDelay: 60000,       // 60 seconds
  maxJitter: 2000,       // 2 seconds
  backoffMultiplier: 2
}
```

### Usage

#### Basic Retry

```typescript
import { retryWithBackoff } from '@/lib/sia-news/retry-strategies'

const result = await retryWithBackoff(
  async () => {
    return await apiCall()
  },
  {
    operationType: 'API',
    maxAttempts: 3
  }
)

if (result.success) {
  console.log('Operation succeeded:', result.result)
  console.log(`Took ${result.attempts} attempts`)
} else {
  console.error('Operation failed:', result.error)
}
```

#### Convenience Functions

```typescript
import { 
  retryApiCall,
  retryDatabaseOperation,
  retryWebSocketConnection 
} from '@/lib/sia-news/retry-strategies'

// API call with default config (3 attempts)
const apiResult = await retryApiCall(async () => {
  return await fetch('/api/endpoint')
})

// Database operation with default config (5 attempts)
const dbResult = await retryDatabaseOperation(async () => {
  return await db.query('SELECT * FROM articles')
})

// WebSocket connection with default config (10 attempts)
const wsResult = await retryWebSocketConnection(async () => {
  return await connectWebSocket('wss://api.example.com')
})
```

#### Retry Queue

```typescript
import { 
  queueFailedOperation,
  getRetryQueueSize,
  getRetryMetrics 
} from '@/lib/sia-news/retry-strategies'

// Add failed operation to retry queue
queueFailedOperation(
  'article-generation-123',
  async () => {
    return await generateArticle(data)
  },
  'API',
  priority: 10  // Higher priority = processed first
)

// Check queue size
const queueSize = getRetryQueueSize()
console.log(`${queueSize} operations in retry queue`)

// Get retry metrics
const metrics = getRetryMetrics()
metrics.forEach(m => {
  console.log(`${m.operationType}: ${m.successfulRetries}/${m.totalAttempts}`)
})
```

### Graceful Degradation

```typescript
import { 
  withGracefulDegradation,
  withOptionalResult 
} from '@/lib/sia-news/retry-strategies'

// Provide fallback value on failure
const data = await withGracefulDegradation(
  async () => {
    return await fetchLiveData()
  },
  () => {
    // Fallback to cached data
    return getCachedData()
  },
  { operationType: 'API' }
)

// Return null on failure (optional result)
const optionalData = await withOptionalResult(
  async () => {
    return await fetchOptionalData()
  },
  { operationType: 'API' }
)

if (optionalData) {
  console.log('Got optional data:', optionalData)
} else {
  console.log('Optional data unavailable, continuing without it')
}
```

## Integration Examples

### Gemini API Integration

The Gemini API integration uses both circuit breaker and retry strategies:

```typescript
// lib/sia-news/gemini-integration.ts

import { circuitBreakerManager } from './circuit-breaker'
import { retryWithBackoff } from './retry-strategies'

// Get circuit breaker for Gemini service
const geminiCircuitBreaker = circuitBreakerManager.getBreaker('GEMINI_API', {
  failureThreshold: 5,
  halfOpenTimeout: 60000,
  successThreshold: 3,
})

// Generate content with circuit breaker protection
export async function generateWithGemini(prompt: GeminiPrompt): Promise<GeminiResponse> {
  return geminiCircuitBreaker.execute(async () => {
    // Gemini API call implementation
    const model = genAI.getGenerativeModel({ ... })
    const result = await model.generateContent({ ... })
    return parseResponse(result)
  })
}

// Retry wrapper for Gemini operations
export async function retryGeminiOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  const result = await retryWithBackoff(operation, {
    operationType: 'API',
    maxAttempts,
    initialDelay: 1000,
    maxDelay: 32000,
    maxJitter: 1000,
    backoffMultiplier: 2,
  })

  if (result.success && result.result !== undefined) {
    return result.result
  }

  throw result.error || new Error('Gemini API operation failed after retries')
}

// High-level API with both protections
export async function generateNewsContent(context: GenerationContext): Promise<GeminiResponse> {
  return retryGeminiOperation(() => generateWithGemini(prompt))
}
```

### Database Operations

Database operations use retry strategies for resilience:

```typescript
// lib/sia-news/database.ts

import { retryDatabaseOperation } from './retry-strategies'

export async function createArticle(article: ArticleRecord): Promise<string> {
  const result = await retryDatabaseOperation(async () => {
    articles.set(article.id, article)
    await updateIndexes(article)
    return article.id
  })

  if (result.success && result.result) {
    return result.result
  }

  throw result.error || new Error('Failed to create article')
}

export async function getArticleById(id: string): Promise<ArticleRecord | null> {
  const result = await retryDatabaseOperation(async () => {
    return articles.get(id) || null
  })

  if (result.success) {
    return result.result || null
  }

  // On failure, return null instead of throwing
  console.warn(`[DATABASE] Failed to get article ${id}:`, result.error?.message)
  return null
}
```

## Monitoring and Alerting

### Initialize Monitoring

```typescript
// Initialize circuit breaker event monitoring
import { initializeCircuitBreakerMonitoring } from '@/lib/sia-news/monitoring'

initializeCircuitBreakerMonitoring()
```

This will:
- Log all circuit breaker state changes
- Send alerts when circuits open (service degradation)
- Track failures and successes
- Monitor rejected requests

### Get System Health

```typescript
import { checkEnhancedSystemHealth } from '@/lib/sia-news/monitoring'

const health = await checkEnhancedSystemHealth()

console.log(`Status: ${health.status}`)
console.log(`Circuit Breakers:`, health.circuitBreakers)
console.log(`Retry Queue:`, health.retryQueue)
console.log(`Degraded Services:`, health.degradedServices)

// Check if any services are degraded
if (health.degradedServices.length > 0) {
  console.warn('Degraded services:', health.degradedServices.join(', '))
}
```

### Get Metrics

```typescript
import { 
  getCircuitBreakerMetrics,
  getRetryQueueMetrics 
} from '@/lib/sia-news/monitoring'

// Circuit breaker metrics
const cbMetrics = getCircuitBreakerMetrics()
cbMetrics.forEach(m => {
  console.log(`${m.serviceName}:`)
  console.log(`  State: ${m.state}`)
  console.log(`  Failures: ${m.failures}`)
  console.log(`  State Transitions: ${m.stateTransitions}`)
  console.log(`  Uptime: ${m.uptime}ms`)
})

// Retry queue metrics
const retryMetrics = getRetryQueueMetrics()
console.log(`Queue Size: ${retryMetrics.queueSize}`)
retryMetrics.metrics.forEach(m => {
  console.log(`${m.operationType}:`)
  console.log(`  Success Rate: ${m.successfulRetries}/${m.totalAttempts}`)
  console.log(`  Average Attempts: ${m.averageAttempts}`)
})
```

## Best Practices

### 1. Choose Appropriate Configurations

- **API Calls**: Use 3 attempts with 1s initial delay
- **Database Operations**: Use 5 attempts with 0.5s initial delay
- **WebSocket Connections**: Use 10 attempts with 2s initial delay
- **Critical Operations**: Lower failure threshold (3 instead of 5)
- **Non-Critical Operations**: Higher failure threshold (7-10)

### 2. Implement Graceful Degradation

Always provide fallback mechanisms:

```typescript
// Good: Fallback to cached data
const data = await withGracefulDegradation(
  () => fetchLiveData(),
  () => getCachedData(),
  { operationType: 'API' }
)

// Good: Optional feature
const enhancedData = await withOptionalResult(
  () => fetchEnhancedData(),
  { operationType: 'API' }
)
```

### 3. Monitor Circuit Breaker State

Set up monitoring and alerting:

```typescript
onCircuitBreakerEvent((event) => {
  if (event.type === 'STATE_CHANGE' && event.to === 'OPEN') {
    // Critical: Service is down
    sendAlert('HIGH', `${event.serviceName} circuit breaker opened`)
  }
})
```

### 4. Use Retry Queue for Background Operations

For non-critical operations that can be retried later:

```typescript
try {
  await operation()
} catch (error) {
  // Add to retry queue for later processing
  queueFailedOperation(
    operationId,
    operation,
    'API',
    priority: 5
  )
}
```

### 5. Log All Failures

Always log failures with context:

```typescript
import { logError } from '@/lib/sia-news/monitoring'

try {
  await operation()
} catch (error) {
  logError('component', 'operation', error, {
    context: 'additional context',
    data: relevantData
  })
  throw error
}
```

## Testing

### Test Circuit Breaker

```typescript
import { circuitBreakerManager } from '@/lib/sia-news/circuit-breaker'

const breaker = circuitBreakerManager.getBreaker('TEST_SERVICE', {
  failureThreshold: 3,
  halfOpenTimeout: 1000,
  successThreshold: 2
})

// Simulate failures
for (let i = 0; i < 3; i++) {
  try {
    await breaker.execute(async () => {
      throw new Error('Simulated failure')
    })
  } catch (error) {
    console.log(`Failure ${i + 1}`)
  }
}

// Circuit should be OPEN now
const state = breaker.getState()
console.log(`Circuit state: ${state.state}`) // Should be 'OPEN'

// Wait for half-open timeout
await new Promise(resolve => setTimeout(resolve, 1100))

// Next call should transition to HALF_OPEN
try {
  await breaker.execute(async () => {
    return 'success'
  })
} catch (error) {
  // Circuit is testing recovery
}
```

### Test Retry Logic

```typescript
import { retryWithBackoff } from '@/lib/sia-news/retry-strategies'

let attempts = 0
const result = await retryWithBackoff(
  async () => {
    attempts++
    if (attempts < 3) {
      throw new Error('Not yet')
    }
    return 'success'
  },
  {
    operationType: 'API',
    maxAttempts: 5
  }
)

console.log(`Succeeded after ${attempts} attempts`)
console.log(`Result:`, result)
```

## Troubleshooting

### Circuit Breaker Stuck in OPEN State

**Symptom**: Circuit breaker remains OPEN even though service is available

**Solution**:
```typescript
import { resetCircuitBreaker } from '@/lib/sia-news/circuit-breaker'

// Manually reset the circuit breaker
resetCircuitBreaker('SERVICE_NAME')
```

### Retry Queue Growing Too Large

**Symptom**: Retry queue size keeps increasing

**Solution**:
1. Check if operations are failing permanently
2. Increase max retry attempts
3. Clear failed operations from queue:

```typescript
import { retryQueue } from '@/lib/sia-news/retry-strategies'

// Clear all queued operations
retryQueue.clear()
```

### High Failure Rate

**Symptom**: Many operations failing even with retries

**Solution**:
1. Check circuit breaker metrics to identify failing services
2. Review error logs for root cause
3. Implement graceful degradation
4. Consider increasing retry attempts or delays

```typescript
import { getDegradedServices } from '@/lib/sia-news/monitoring'

const degraded = getDegradedServices()
console.log('Degraded services:', degraded)
```

## Performance Considerations

### Circuit Breaker Overhead

- Minimal overhead: ~1-2ms per operation
- State checks are in-memory
- Event listeners are async and non-blocking

### Retry Overhead

- Exponential backoff adds delay only on failures
- Jitter prevents thundering herd
- Successful operations have zero retry overhead

### Memory Usage

- Circuit breaker state: ~1KB per service
- Retry queue: ~1KB per queued operation
- Recent logs: Capped at 1000 entries

## Summary

The error handling and recovery mechanisms provide:

✅ **Fault Tolerance**: Circuit breakers prevent cascading failures
✅ **Resilience**: Exponential backoff with jitter for transient failures
✅ **Graceful Degradation**: Fallback mechanisms for unavailable services
✅ **Monitoring**: Comprehensive metrics and alerting
✅ **Performance**: Minimal overhead with maximum reliability

For questions or issues, refer to the monitoring dashboard or check the logs for detailed error information.
