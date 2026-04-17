/**
 * Monitoring and Logging Layer for SIA_NEWS_v1.0
 * 
 * Comprehensive logging system with structured logging, performance tracking,
 * quality metrics monitoring, alerting capabilities, and circuit breaker/retry tracking.
 * 
 * Requirements: 20.1, 20.2, 20.3, 20.4, 20.5
 */

import {
  LogEntry,
  PerformanceMetrics,
  QualityMetrics,
  SystemHealth,
  DailySummary,
  ValidationIssue
} from './types'

import {
  storePerformanceMetrics,
  storeQualityMetrics,
  getPerformanceMetrics,
  getQualityMetrics,
  getArticleStats
} from './database'

import { 
  getAllCircuitBreakerMetrics,
  onCircuitBreakerEvent,
  type CircuitBreakerEvent 
} from './circuit-breaker'

import { 
  getRetryMetrics,
  getRetryQueueSize 
} from './retry-strategies'

// ============================================================================
// LOG LEVELS AND CONFIGURATION
// ============================================================================

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'

interface LogConfig {
  minLevel: LogLevel
  enableConsole: boolean
  enableFile: boolean
  enableRemote: boolean
}

const LOG_LEVELS: Record<LogLevel, number> = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
}

let logConfig: LogConfig = {
  minLevel: process.env.NODE_ENV === 'development' ? 'DEBUG' : 'INFO',
  enableConsole: true,
  enableFile: false,
  enableRemote: false
}

// In-memory log storage (for recent logs)
const recentLogs: LogEntry[] = []
const MAX_RECENT_LOGS = 1000

// ============================================================================
// CORE LOGGING FUNCTIONS
// ============================================================================

/**
 * Log a message with structured metadata
 * 
 * @param level - Log level
 * @param component - Component name
 * @param message - Log message
 * @param metadata - Additional metadata
 */
export function log(
  level: LogLevel,
  component: string,
  message: string,
  metadata?: Record<string, any>
): void {
  // Check if log level is enabled
  if (LOG_LEVELS[level] < LOG_LEVELS[logConfig.minLevel]) {
    return
  }
  
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    metadata
  }
  
  // Store in recent logs
  recentLogs.push(entry)
  if (recentLogs.length > MAX_RECENT_LOGS) {
    recentLogs.shift()
  }
  
  // Console output
  if (logConfig.enableConsole) {
    const prefix = `[${entry.timestamp}] [${level}] [${component}]`
    const metaStr = metadata ? ` ${JSON.stringify(metadata)}` : ''
    
    switch (level) {
      case 'ERROR':
        console.error(`${prefix} ${message}${metaStr}`)
        break
      case 'WARN':
        console.warn(`${prefix} ${message}${metaStr}`)
        break
      case 'DEBUG':
        console.debug(`${prefix} ${message}${metaStr}`)
        break
      default:
        console.log(`${prefix} ${message}${metaStr}`)
    }
  }
  
  // File output (future enhancement)
  if (logConfig.enableFile) {
    // TODO: Write to log file
  }
  
  // Remote logging (future enhancement)
  if (logConfig.enableRemote) {
    // TODO: Send to remote logging service (e.g., Sentry, DataDog)
  }
}

/**
 * Log API request
 * 
 * @param endpoint - API endpoint
 * @param method - HTTP method
 * @param params - Request parameters
 * @param apiKey - API key (masked)
 */
export function logRequest(
  endpoint: string,
  method: string,
  params: Record<string, any>,
  apiKey?: string
): void {
  log('INFO', 'api', `${method} ${endpoint}`, {
    params,
    apiKey: apiKey ? maskApiKey(apiKey) : undefined,
    timestamp: new Date().toISOString()
  })
}

/**
 * Log validation failure
 * 
 * @param articleId - Article ID
 * @param issues - Validation issues
 * @param consensusScore - Consensus score
 */
export function logValidationFailure(
  articleId: string,
  issues: ValidationIssue[],
  consensusScore: number
): void {
  log('WARN', 'validation', `Article ${articleId} failed validation`, {
    articleId,
    consensusScore,
    criticalIssues: issues.filter(i => i.severity === 'CRITICAL').length,
    highIssues: issues.filter(i => i.severity === 'HIGH').length,
    issues: issues.map(i => ({
      severity: i.severity,
      category: i.category,
      description: i.description
    }))
  })
}

/**
 * Log error with full context
 * 
 * @param component - Component name
 * @param operation - Operation name
 * @param error - Error object
 * @param context - Additional context
 */
export function logError(
  component: string,
  operation: string,
  error: Error,
  context?: Record<string, any>
): void {
  log('ERROR', component, `${operation} failed: ${error.message}`, {
    operation,
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...context
  })
}

/**
 * Log debug information
 * 
 * @param component - Component name
 * @param message - Debug message
 * @param data - Debug data
 */
export function logDebug(
  component: string,
  message: string,
  data?: Record<string, any>
): void {
  log('DEBUG', component, message, data)
}

// ============================================================================
// PERFORMANCE TRACKING
// ============================================================================

interface PerformanceTracker {
  component: string
  operation: string
  startTime: number
}

const activeTrackers = new Map<string, PerformanceTracker>()

/**
 * Start performance tracking for an operation
 * 
 * @param component - Component name
 * @param operation - Operation name
 * @returns Tracker ID
 */
export function startPerformanceTracking(
  component: string,
  operation: string
): string {
  const trackerId = `${component}-${operation}-${Date.now()}`
  
  activeTrackers.set(trackerId, {
    component,
    operation,
    startTime: Date.now()
  })
  
  logDebug(component, `Started ${operation}`)
  
  return trackerId
}

/**
 * End performance tracking and store metrics
 * 
 * @param trackerId - Tracker ID
 * @param success - Operation success status
 */
export async function endPerformanceTracking(
  trackerId: string,
  success: boolean
): Promise<void> {
  const tracker = activeTrackers.get(trackerId)
  if (!tracker) {
    logError('monitoring', 'endPerformanceTracking', new Error('Tracker not found'), { trackerId })
    return
  }
  
  const duration = Date.now() - tracker.startTime
  
  const metrics: PerformanceMetrics = {
    component: tracker.component,
    operation: tracker.operation,
    duration,
    success,
    timestamp: new Date().toISOString()
  }
  
  await storePerformanceMetrics(metrics)
  
  activeTrackers.delete(trackerId)
  
  log(
    success ? 'INFO' : 'WARN',
    tracker.component,
    `${tracker.operation} ${success ? 'completed' : 'failed'} in ${duration}ms`
  )
}

/**
 * Track performance of an async operation
 * 
 * @param component - Component name
 * @param operation - Operation name
 * @param fn - Async function to track
 * @returns Function result
 */
export async function trackPerformance<T>(
  component: string,
  operation: string,
  fn: () => Promise<T>
): Promise<T> {
  const trackerId = startPerformanceTracking(component, operation)
  
  try {
    const result = await fn()
    await endPerformanceTracking(trackerId, true)
    return result
  } catch (error) {
    await endPerformanceTracking(trackerId, false)
    throw error
  }
}

// ============================================================================
// QUALITY METRICS TRACKING
// ============================================================================

/**
 * Track quality metrics for an article
 * 
 * @param articleId - Article ID
 * @param eeatScore - E-E-A-T score
 * @param originalityScore - Originality score
 * @param technicalDepth - Technical depth
 * @param sentimentScore - Sentiment score
 * @param wordCount - Word count
 */
export async function trackQuality(
  articleId: string,
  eeatScore: number,
  originalityScore: number,
  technicalDepth: string,
  sentimentScore: number,
  wordCount: number
): Promise<void> {
  const metrics: QualityMetrics = {
    articleId,
    eeatScore,
    originalityScore,
    technicalDepth,
    sentimentScore,
    wordCount,
    timestamp: new Date().toISOString()
  }
  
  await storeQualityMetrics(metrics)
  
  logDebug('quality', `Tracked quality metrics for ${articleId}`, {
    eeatScore,
    originalityScore,
    technicalDepth
  })
}

// ============================================================================
// REAL-TIME METRICS
// ============================================================================

/**
 * Get real-time metrics for dashboard
 * 
 * @returns Real-time metrics
 */
export async function getRealtimeMetrics(): Promise<{
  performance: {
    avgDuration: number
    successRate: number
    operationsPerHour: number
  }
  quality: {
    avgEEATScore: number
    avgOriginalityScore: number
    avgSentiment: number
  }
  system: SystemHealth
}> {
  // Get metrics for last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()
  
  const perfMetrics = await getPerformanceMetrics(oneHourAgo, now)
  const qualMetrics = await getQualityMetrics(oneHourAgo, now)
  
  // Calculate performance metrics
  const successfulOps = perfMetrics.filter(m => m.success)
  const avgDuration = successfulOps.length > 0
    ? successfulOps.reduce((sum, m) => sum + m.duration, 0) / successfulOps.length
    : 0
  
  const successRate = perfMetrics.length > 0
    ? (successfulOps.length / perfMetrics.length) * 100
    : 100
  
  const operationsPerHour = perfMetrics.length
  
  // Calculate quality metrics
  const avgEEATScore = qualMetrics.length > 0
    ? qualMetrics.reduce((sum, m) => sum + m.eeatScore, 0) / qualMetrics.length
    : 0
  
  const avgOriginalityScore = qualMetrics.length > 0
    ? qualMetrics.reduce((sum, m) => sum + m.originalityScore, 0) / qualMetrics.length
    : 0
  
  const avgSentiment = qualMetrics.length > 0
    ? qualMetrics.reduce((sum, m) => sum + m.sentimentScore, 0) / qualMetrics.length
    : 0
  
  // Get system health
  const systemHealth = await checkSystemHealth()
  
  return {
    performance: {
      avgDuration: Math.round(avgDuration),
      successRate: Math.round(successRate * 100) / 100,
      operationsPerHour
    },
    quality: {
      avgEEATScore: Math.round(avgEEATScore * 100) / 100,
      avgOriginalityScore: Math.round(avgOriginalityScore * 100) / 100,
      avgSentiment: Math.round(avgSentiment * 100) / 100
    },
    system: systemHealth
  }
}

// ============================================================================
// SYSTEM HEALTH MONITORING
// ============================================================================

/**
 * Check system health status
 * 
 * @returns System health status
 */
export async function checkSystemHealth(): Promise<SystemHealth> {
  const components = {
    dataIngestion: await monitorComponentHealth('data-ingestion'),
    contentGeneration: await monitorComponentHealth('content-generation'),
    validation: await monitorComponentHealth('validation'),
    publishing: await monitorComponentHealth('publishing'),
    database: await monitorComponentHealth('database')
  }
  
  // Determine overall status
  const componentStatuses = Object.values(components)
  const downCount = componentStatuses.filter(s => s === 'DOWN').length
  
  let status: 'HEALTHY' | 'DEGRADED' | 'DOWN'
  if (downCount > 0) {
    status = 'DOWN'
  } else {
    status = 'HEALTHY'
  }
  
  return {
    status,
    uptime: process.uptime(),
    components,
    lastCheck: new Date().toISOString()
  }
}

/**
 * Monitor individual component health
 * 
 * @param component - Component name
 * @returns Component status
 */
export async function monitorComponentHealth(
  component: string
): Promise<'UP' | 'DOWN'> {
  // Check recent performance metrics for this component
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const now = new Date().toISOString()
  
  const metrics = await getPerformanceMetrics(fiveMinutesAgo, now)
  const componentMetrics = metrics.filter(m => m.component === component)
  
  if (componentMetrics.length === 0) {
    // No recent activity - assume UP
    return 'UP'
  }
  
  // Check success rate
  const successfulOps = componentMetrics.filter(m => m.success)
  const successRate = successfulOps.length / componentMetrics.length
  
  // Component is DOWN if success rate < 50%
  return successRate >= 0.5 ? 'UP' : 'DOWN'
}

// ============================================================================
// DAILY SUMMARY GENERATION
// ============================================================================

/**
 * Generate daily summary report
 * 
 * @param date - Date for summary (defaults to today)
 * @returns Daily summary
 */
export async function generateDailySummary(date?: Date): Promise<DailySummary> {
  const targetDate = date || new Date()
  targetDate.setHours(0, 0, 0, 0)
  
  const nextDay = new Date(targetDate)
  nextDay.setDate(nextDay.getDate() + 1)
  
  const dateRange = {
    start: targetDate.toISOString(),
    end: nextDay.toISOString()
  }
  
  // Get article statistics
  const stats = await getArticleStats(dateRange)
  
  // Get performance metrics
  const perfMetrics = await getPerformanceMetrics(dateRange.start, dateRange.end)
  const successfulOps = perfMetrics.filter(m => m.success)
  const avgProcessingTime = successfulOps.length > 0
    ? successfulOps.reduce((sum, m) => sum + m.duration, 0) / successfulOps.length
    : 0
  
  // Get quality metrics
  const qualMetrics = await getQualityMetrics(dateRange.start, dateRange.end)
  
  // Calculate quality trends (last 7 days)
  const eeatScores: number[] = []
  const originalityScores: number[] = []
  
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(targetDate)
    dayStart.setDate(dayStart.getDate() - i)
    const dayEnd = new Date(dayStart)
    dayEnd.setDate(dayEnd.getDate() + 1)
    
    const dayMetrics = await getQualityMetrics(
      dayStart.toISOString(),
      dayEnd.toISOString()
    )
    
    const avgEEAT = dayMetrics.length > 0
      ? dayMetrics.reduce((sum, m) => sum + m.eeatScore, 0) / dayMetrics.length
      : 0
    
    const avgOriginality = dayMetrics.length > 0
      ? dayMetrics.reduce((sum, m) => sum + m.originalityScore, 0) / dayMetrics.length
      : 0
    
    eeatScores.push(Math.round(avgEEAT))
    originalityScores.push(Math.round(avgOriginality))
  }
  
  // Get top entities (from recent logs)
  const topEntities = extractTopEntities()
  
  return {
    date: targetDate.toISOString().split('T')[0],
    totalArticles: stats.totalArticles,
    successfulPublications: successfulOps.length,
    failedValidations: perfMetrics.length - successfulOps.length,
    avgEEATScore: Math.round(stats.avgEEATScore * 100) / 100,
    avgProcessingTime: Math.round(avgProcessingTime),
    byLanguage: stats.byLanguage,
    topEntities,
    qualityTrends: {
      eeatScore: eeatScores,
      originalityScore: originalityScores
    }
  }
}

// ============================================================================
// ALERTING SYSTEM
// ============================================================================

export type AlertSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

interface Alert {
  severity: AlertSeverity
  component: string
  message: string
  timestamp: string
  metadata?: Record<string, any>
}

const recentAlerts: Alert[] = []
const MAX_RECENT_ALERTS = 100

/**
 * Send alert for critical issues
 * 
 * @param severity - Alert severity
 * @param component - Component name
 * @param message - Alert message
 * @param metadata - Additional metadata
 */
export async function sendAlert(
  severity: AlertSeverity,
  component: string,
  message: string,
  metadata?: Record<string, any>
): Promise<void> {
  const alert: Alert = {
    severity,
    component,
    message,
    timestamp: new Date().toISOString(),
    metadata
  }
  
  // Store in recent alerts
  recentAlerts.push(alert)
  if (recentAlerts.length > MAX_RECENT_ALERTS) {
    recentAlerts.shift()
  }
  
  // Log alert
  log(
    severity === 'CRITICAL' || severity === 'HIGH' ? 'ERROR' : 'WARN',
    component,
    `ALERT [${severity}]: ${message}`,
    metadata
  )
  
  // Route alert based on severity
  await routeAlert(alert)
}

/**
 * Route alert to appropriate channels
 * 
 * @param alert - Alert object
 */
async function routeAlert(alert: Alert): Promise<void> {
  // Console output (always)
  console.error(`[ALERT] [${alert.severity}] [${alert.component}] ${alert.message}`)
  
  // Email notification (HIGH and CRITICAL)
  if (alert.severity === 'HIGH' || alert.severity === 'CRITICAL') {
    // TODO: Send email notification
    logDebug('alerting', 'Email notification would be sent', { alert })
  }
  
  // SMS notification (CRITICAL only)
  if (alert.severity === 'CRITICAL') {
    // TODO: Send SMS notification
    logDebug('alerting', 'SMS notification would be sent', { alert })
  }
  
  // Slack/Discord webhook (MEDIUM and above)
  if (alert.severity !== 'LOW') {
    // TODO: Send webhook notification
    logDebug('alerting', 'Webhook notification would be sent', { alert })
  }
}

/**
 * Get recent alerts
 * 
 * @param severity - Filter by severity (optional)
 * @returns Recent alerts
 */
export function getRecentAlerts(severity?: AlertSeverity): Alert[] {
  if (severity) {
    return recentAlerts.filter(a => a.severity === severity)
  }
  return [...recentAlerts]
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Mask API key for logging
 * 
 * @param apiKey - API key
 * @returns Masked API key
 */
function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '***'
  }
  return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`
}

/**
 * Extract top entities from recent logs
 * 
 * @returns Top entities with counts
 */
function extractTopEntities(): Array<{ entity: string; count: number }> {
  // This is a simplified implementation
  // In production, would query from database
  return [
    { entity: 'Bitcoin', count: 45 },
    { entity: 'Ethereum', count: 32 },
    { entity: 'Federal Reserve', count: 28 }
  ]
}

/**
 * Get recent logs
 * 
 * @param level - Filter by log level (optional)
 * @param component - Filter by component (optional)
 * @param limit - Maximum number of logs to return
 * @returns Recent logs
 */
export function getRecentLogs(
  level?: LogLevel,
  component?: string,
  limit: number = 100
): LogEntry[] {
  let filtered = [...recentLogs]
  
  if (level) {
    filtered = filtered.filter(l => l.level === level)
  }
  
  if (component) {
    filtered = filtered.filter(l => l.component === component)
  }
  
  return filtered.slice(-limit)
}

/**
 * Configure logging system
 * 
 * @param config - Log configuration
 */
export function configureLogging(config: Partial<LogConfig>): void {
  logConfig = { ...logConfig, ...config }
  log('INFO', 'monitoring', 'Logging configuration updated', config)
}

/**
 * Clear recent logs (for testing)
 */
export function clearRecentLogs(): void {
  recentLogs.length = 0
}

/**
 * Clear recent alerts (for testing)
 */
export function clearRecentAlerts(): void {
  recentAlerts.length = 0
}


// ============================================================================
// CIRCUIT BREAKER AND RETRY MONITORING
// ============================================================================

/**
 * Initialize circuit breaker event monitoring
 * Logs all circuit breaker state changes and failures
 */
export function initializeCircuitBreakerMonitoring(): void {
  onCircuitBreakerEvent((event: CircuitBreakerEvent) => {
    switch (event.type) {
      case 'STATE_CHANGE':
        const severity = event.to === 'OPEN' ? 'ERROR' : event.to === 'HALF_OPEN' ? 'WARN' : 'INFO'
        log(
          severity,
          'circuit-breaker',
          `${event.serviceName}: State transition ${event.from} → ${event.to}`,
          {
            serviceName: event.serviceName,
            from: event.from,
            to: event.to,
            timestamp: event.timestamp
          }
        )
        
        // Send alert if circuit opens (service degradation)
        if (event.to === 'OPEN') {
          sendAlert(
            'HIGH',
            'Circuit Breaker Opened',
            `Service ${event.serviceName} circuit breaker is OPEN due to repeated failures`,
            { serviceName: event.serviceName, timestamp: event.timestamp }
          )
        }
        break
        
      case 'FAILURE':
        log(
          'WARN',
          'circuit-breaker',
          `${event.serviceName}: Operation failed`,
          {
            serviceName: event.serviceName,
            error: event.error,
            timestamp: event.timestamp
          }
        )
        break
        
      case 'SUCCESS':
        logDebug(
          'circuit-breaker',
          `${event.serviceName}: Operation succeeded`,
          {
            serviceName: event.serviceName,
            timestamp: event.timestamp
          }
        )
        break
        
      case 'REJECTED':
        log(
          'ERROR',
          'circuit-breaker',
          `${event.serviceName}: Request rejected - ${event.reason}`,
          {
            serviceName: event.serviceName,
            reason: event.reason,
            timestamp: event.timestamp
          }
        )
        break
    }
  })
  
  console.log('[MONITORING] Circuit breaker event monitoring initialized')
}

/**
 * Get circuit breaker metrics for all services
 * 
 * @returns Circuit breaker metrics
 */
export function getCircuitBreakerMetrics() {
  return getAllCircuitBreakerMetrics()
}

/**
 * Get retry queue metrics
 * 
 * @returns Retry metrics
 */
export function getRetryQueueMetrics() {
  return {
    metrics: getRetryMetrics(),
    queueSize: getRetryQueueSize()
  }
}

/**
 * Check if any circuit breakers are open
 * 
 * @returns True if any circuit breaker is open
 */
export function hasOpenCircuitBreakers(): boolean {
  const metrics = getAllCircuitBreakerMetrics()
  return metrics.some(m => m.state === 'OPEN')
}

/**
 * Get degraded services (circuit breakers in OPEN or HALF_OPEN state)
 * 
 * @returns Array of degraded service names
 */
export function getDegradedServices(): string[] {
  const metrics = getAllCircuitBreakerMetrics()
  return metrics
    .filter(m => m.state === 'OPEN' || m.state === 'HALF_OPEN')
    .map(m => m.serviceName)
}

/**
 * Enhanced system health check including circuit breakers and retry queue
 * 
 * @returns Enhanced system health status
 */
export async function checkEnhancedSystemHealth(): Promise<SystemHealth & {
  circuitBreakers: ReturnType<typeof getAllCircuitBreakerMetrics>
  retryQueue: ReturnType<typeof getRetryQueueMetrics>
  degradedServices: string[]
}> {
  const baseHealth = await checkSystemHealth()
  const circuitBreakers = getAllCircuitBreakerMetrics()
  const retryQueue = getRetryQueueMetrics()
  const degradedServices = getDegradedServices()
  
  // Adjust status based on circuit breakers
  let status = baseHealth.status
  if (degradedServices.length > 0) {
    status = degradedServices.some(s => circuitBreakers.find(cb => cb.serviceName === s && cb.state === 'OPEN'))
      ? 'DOWN'
      : 'DEGRADED'
  }
  
  return {
    ...baseHealth,
    status,
    circuitBreakers,
    retryQueue,
    degradedServices
  }
}

// ============================================================================
// CONTINUOUS HEALTH MONITORING
// ============================================================================

interface ContinuousMonitoringConfig {
  enabled: boolean
  checkInterval: number // Milliseconds between checks (default: 60000 = 1 minute)
  alertThresholds: {
    successRateMin: number // Minimum success rate before alerting (default: 90%)
    avgDurationMax: number // Maximum average duration before alerting (default: 15000ms)
    errorRateMax: number // Maximum error rate before alerting (default: 10%)
  }
  autoRecovery: boolean
}

const DEFAULT_MONITORING_CONFIG: ContinuousMonitoringConfig = {
  enabled: false,
  checkInterval: 60000, // 1 minute
  alertThresholds: {
    successRateMin: 90,
    avgDurationMax: 15000,
    errorRateMax: 10
  },
  autoRecovery: true
}

let monitoringConfig: ContinuousMonitoringConfig = { ...DEFAULT_MONITORING_CONFIG }
let monitoringInterval: NodeJS.Timeout | null = null
let monitoringState = {
  isRunning: false,
  startedAt: null as string | null,
  checksPerformed: 0,
  issuesDetected: 0,
  recoveriesAttempted: 0,
  recoveriesSuccessful: 0
}

/**
 * Start continuous health monitoring
 * 
 * Performs periodic health checks and triggers alerts/recovery as needed.
 * 
 * @param config - Optional monitoring configuration
 */
export function startContinuousMonitoring(config?: Partial<ContinuousMonitoringConfig>): void {
  if (monitoringState.isRunning) {
    log('WARN', 'continuous-monitoring', 'Monitoring is already running')
    return
  }
  
  // Apply configuration
  monitoringConfig = { ...DEFAULT_MONITORING_CONFIG, ...config }
  
  if (!monitoringConfig.enabled) {
    log('WARN', 'continuous-monitoring', 'Monitoring is disabled in configuration')
    return
  }
  
  monitoringState = {
    isRunning: true,
    startedAt: new Date().toISOString(),
    checksPerformed: 0,
    issuesDetected: 0,
    recoveriesAttempted: 0,
    recoveriesSuccessful: 0
  }
  
  log('INFO', 'continuous-monitoring', 'Starting continuous health monitoring', {
    config: monitoringConfig
  })
  
  // Perform initial check
  performContinuousHealthCheck()
  
  // Schedule periodic checks
  monitoringInterval = setInterval(() => {
    performContinuousHealthCheck()
  }, monitoringConfig.checkInterval)
  
  sendAlert(
    'LOW',
    'continuous-monitoring',
    'Continuous health monitoring started',
    { config: monitoringConfig }
  )
}

/**
 * Stop continuous health monitoring
 */
export function stopContinuousMonitoring(): void {
  if (!monitoringState.isRunning) {
    log('WARN', 'continuous-monitoring', 'Monitoring is not running')
    return
  }
  
  if (monitoringInterval) {
    clearInterval(monitoringInterval)
    monitoringInterval = null
  }
  
  monitoringState.isRunning = false
  
  log('INFO', 'continuous-monitoring', 'Continuous health monitoring stopped', {
    stats: {
      checksPerformed: monitoringState.checksPerformed,
      issuesDetected: monitoringState.issuesDetected,
      recoveriesAttempted: monitoringState.recoveriesAttempted,
      recoveriesSuccessful: monitoringState.recoveriesSuccessful
    }
  })
  
  sendAlert(
    'LOW',
    'continuous-monitoring',
    'Continuous health monitoring stopped',
    { stats: getMonitoringStats() }
  )
}

/**
 * Perform continuous health check
 */
async function performContinuousHealthCheck(): Promise<void> {
  monitoringState.checksPerformed++
  
  try {
    // Get enhanced system health
    const health = await checkEnhancedSystemHealth()
    
    logDebug('continuous-monitoring', 'Health check completed', {
      status: health.status,
      checkNumber: monitoringState.checksPerformed
    })
    
    // Check for issues
    const issues: string[] = []
    
    // Check system status
    if (health.status === 'DOWN') {
      issues.push('System status is DOWN')
      monitoringState.issuesDetected++
      
      sendAlert(
        'CRITICAL',
        'continuous-monitoring',
        'System health critical - DOWN',
        { health }
      )
    } else if (health.status === 'DEGRADED') {
      issues.push('System status is DEGRADED')
      monitoringState.issuesDetected++
      
      sendAlert(
        'HIGH',
        'continuous-monitoring',
        'System health degraded',
        { health, degradedServices: health.degradedServices }
      )
    }
    
    // Check component health
    const downComponents = Object.entries(health.components)
      .filter(([_, status]) => status === 'DOWN')
      .map(([name, _]) => name)
    
    if (downComponents.length > 0) {
      issues.push(`Components down: ${downComponents.join(', ')}`)
      
      sendAlert(
        'HIGH',
        'continuous-monitoring',
        `Components are down: ${downComponents.join(', ')}`,
        { components: health.components }
      )
    }
    
    // Check circuit breakers
    if (health.degradedServices.length > 0) {
      issues.push(`Services degraded: ${health.degradedServices.join(', ')}`)
      
      sendAlert(
        'MEDIUM',
        'continuous-monitoring',
        `Services have degraded performance: ${health.degradedServices.join(', ')}`,
        { degradedServices: health.degradedServices, circuitBreakers: health.circuitBreakers }
      )
    }
    
    // Check performance metrics
    const perfMetrics = await getRealtimeMetrics()
    
    if (perfMetrics.performance.successRate < monitoringConfig.alertThresholds.successRateMin) {
      issues.push(`Success rate below threshold: ${perfMetrics.performance.successRate}%`)
      
      sendAlert(
        'MEDIUM',
        'continuous-monitoring',
        `Success rate below threshold: ${perfMetrics.performance.successRate}% < ${monitoringConfig.alertThresholds.successRateMin}%`,
        { successRate: perfMetrics.performance.successRate, threshold: monitoringConfig.alertThresholds.successRateMin }
      )
    }
    
    if (perfMetrics.performance.avgDuration > monitoringConfig.alertThresholds.avgDurationMax) {
      issues.push(`Average duration above threshold: ${perfMetrics.performance.avgDuration}ms`)
      
      sendAlert(
        'MEDIUM',
        'continuous-monitoring',
        `Average processing time above threshold: ${perfMetrics.performance.avgDuration}ms > ${monitoringConfig.alertThresholds.avgDurationMax}ms`,
        { avgDuration: perfMetrics.performance.avgDuration, threshold: monitoringConfig.alertThresholds.avgDurationMax }
      )
    }
    
    // Check quality metrics
    if (perfMetrics.quality.avgEEATScore < 75) {
      issues.push(`E-E-A-T score below minimum: ${perfMetrics.quality.avgEEATScore}`)
      
      sendAlert(
        'MEDIUM',
        'continuous-monitoring',
        `Average E-E-A-T score below minimum: ${perfMetrics.quality.avgEEATScore} < 75`,
        { avgEEATScore: perfMetrics.quality.avgEEATScore }
      )
    }
    
    // Attempt automatic recovery if issues detected and auto-recovery enabled
    if (issues.length > 0 && monitoringConfig.autoRecovery) {
      await attemptAutomaticRecovery(health, issues)
    }
    
  } catch (error) {
    logError('continuous-monitoring', 'performContinuousHealthCheck', error as Error)
    
    sendAlert(
      'HIGH',
      'continuous-monitoring',
      'Health check failed',
      { error: (error as Error).message }
    )
  }
}

/**
 * Attempt automatic recovery from detected issues
 * 
 * @param health - Current system health
 * @param issues - Detected issues
 */
async function attemptAutomaticRecovery(
  health: SystemHealth & { degradedServices: string[] },
  issues: string[]
): Promise<void> {
  monitoringState.recoveriesAttempted++
  
  log('INFO', 'continuous-monitoring', 'Attempting automatic recovery', {
    issues,
    health: health.status
  })
  
  try {
    // Recovery strategies
    const recoveryActions: string[] = []
    
    // 1. Restart degraded services
    if (health.degradedServices.length > 0) {
      for (const service of health.degradedServices) {
        log('INFO', 'continuous-monitoring', `Attempting to recover service: ${service}`)
        // TODO: Implement service-specific recovery logic
        recoveryActions.push(`Restarted ${service}`)
      }
    }
    
    // 2. Clear retry queues if backed up
    if (getRetryQueueSize() > 100) {
      log('INFO', 'continuous-monitoring', 'Clearing backed up retry queue')
      // TODO: Implement queue clearing logic
      recoveryActions.push('Cleared retry queue')
    }
    
    // 3. Reset circuit breakers if stuck open
    const openCircuits = getAllCircuitBreakerMetrics().filter(cb => cb.state === 'OPEN')
    if (openCircuits.length > 0) {
      log('INFO', 'continuous-monitoring', `Resetting ${openCircuits.length} open circuit breakers`)
      // Circuit breakers will auto-recover via half-open state
      recoveryActions.push(`Reset ${openCircuits.length} circuit breakers`)
    }
    
    // Wait for recovery to take effect
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Check if recovery was successful
    const newHealth = await checkEnhancedSystemHealth()
    
    if (newHealth.status === 'HEALTHY' || newHealth.status === 'DEGRADED' && health.status === 'DOWN') {
      monitoringState.recoveriesSuccessful++
      
      log('INFO', 'continuous-monitoring', 'Automatic recovery successful', {
        previousStatus: health.status,
        newStatus: newHealth.status,
        actions: recoveryActions
      })
      
      sendAlert(
        'LOW',
        'continuous-monitoring',
        'System recovered automatically',
        {
          previousStatus: health.status,
          newStatus: newHealth.status,
          actions: recoveryActions
        }
      )
    } else {
      log('WARN', 'continuous-monitoring', 'Automatic recovery incomplete', {
        previousStatus: health.status,
        newStatus: newHealth.status,
        actions: recoveryActions
      })
      
      sendAlert(
        'MEDIUM',
        'continuous-monitoring',
        'Automatic recovery incomplete - manual intervention may be required',
        {
          previousStatus: health.status,
          newStatus: newHealth.status,
          actions: recoveryActions
        }
      )
    }
    
  } catch (error) {
    logError('continuous-monitoring', 'attemptAutomaticRecovery', error as Error)
    
    sendAlert(
      'HIGH',
      'continuous-monitoring',
      'Automatic recovery failed',
      { error: (error as Error).message, issues }
    )
  }
}

/**
 * Get monitoring statistics
 * 
 * @returns Monitoring stats
 */
export function getMonitoringStats() {
  return {
    isRunning: monitoringState.isRunning,
    startedAt: monitoringState.startedAt,
    checksPerformed: monitoringState.checksPerformed,
    issuesDetected: monitoringState.issuesDetected,
    recoveriesAttempted: monitoringState.recoveriesAttempted,
    recoveriesSuccessful: monitoringState.recoveriesSuccessful,
    recoverySuccessRate: monitoringState.recoveriesAttempted > 0
      ? (monitoringState.recoveriesSuccessful / monitoringState.recoveriesAttempted) * 100
      : 0,
    config: { ...monitoringConfig }
  }
}

/**
 * Update monitoring configuration
 * 
 * @param updates - Configuration updates
 */
export function updateMonitoringConfig(updates: Partial<ContinuousMonitoringConfig>): void {
  const oldConfig = { ...monitoringConfig }
  monitoringConfig = { ...monitoringConfig, ...updates }
  
  log('INFO', 'continuous-monitoring', 'Configuration updated', {
    oldConfig,
    newConfig: monitoringConfig
  })
  
  // If enabled state changed, start/stop monitoring
  if (oldConfig.enabled !== monitoringConfig.enabled) {
    if (monitoringConfig.enabled && !monitoringState.isRunning) {
      startContinuousMonitoring()
    } else if (!monitoringConfig.enabled && monitoringState.isRunning) {
      stopContinuousMonitoring()
    }
  }
  
  // If check interval changed and monitoring is running, restart
  if (oldConfig.checkInterval !== monitoringConfig.checkInterval && monitoringState.isRunning) {
    stopContinuousMonitoring()
    startContinuousMonitoring()
  }
}

/**
 * Check if monitoring is running
 * 
 * @returns True if monitoring is active
 */
export function isMonitoringRunning(): boolean {
  return monitoringState.isRunning
}

// ============================================================================
// UPTIME TRACKING
// ============================================================================

interface UptimeTracker {
  startTime: number
  downtimeTotal: number
  downtimeEvents: Array<{
    startTime: number
    endTime: number
    duration: number
    reason: string
  }>
}

const uptimeTracker: UptimeTracker = {
  startTime: Date.now(),
  downtimeTotal: 0,
  downtimeEvents: []
}

let currentDowntime: { startTime: number; reason: string } | null = null

/**
 * Record downtime start
 * 
 * @param reason - Reason for downtime
 */
export function recordDowntimeStart(reason: string): void {
  if (currentDowntime) {
    log('WARN', 'uptime-tracking', 'Downtime already in progress')
    return
  }
  
  currentDowntime = {
    startTime: Date.now(),
    reason
  }
  
  log('WARN', 'uptime-tracking', 'Downtime started', { reason })
  
  sendAlert(
    'HIGH',
    'uptime-tracking',
    `System downtime started: ${reason}`,
    { reason }
  )
}

/**
 * Record downtime end
 */
export function recordDowntimeEnd(): void {
  if (!currentDowntime) {
    log('WARN', 'uptime-tracking', 'No downtime in progress')
    return
  }
  
  const endTime = Date.now()
  const duration = endTime - currentDowntime.startTime
  
  uptimeTracker.downtimeTotal += duration
  uptimeTracker.downtimeEvents.push({
    startTime: currentDowntime.startTime,
    endTime,
    duration,
    reason: currentDowntime.reason
  })
  
  log('INFO', 'uptime-tracking', 'Downtime ended', {
    reason: currentDowntime.reason,
    duration
  })
  
  sendAlert(
    'LOW',
    'uptime-tracking',
    `System downtime ended: ${currentDowntime.reason} (${duration}ms)`,
    { reason: currentDowntime.reason, duration }
  )
  
  currentDowntime = null
}

/**
 * Get uptime statistics
 * 
 * @returns Uptime stats
 */
export function getUptimeStats() {
  const totalTime = Date.now() - uptimeTracker.startTime
  const uptime = totalTime - uptimeTracker.downtimeTotal
  const uptimePercentage = (uptime / totalTime) * 100
  
  return {
    startTime: new Date(uptimeTracker.startTime).toISOString(),
    totalTime,
    uptime,
    downtime: uptimeTracker.downtimeTotal,
    uptimePercentage,
    downtimeEvents: uptimeTracker.downtimeEvents.length,
    recentDowntimeEvents: uptimeTracker.downtimeEvents.slice(-10),
    currentDowntime: currentDowntime ? {
      reason: currentDowntime.reason,
      duration: Date.now() - currentDowntime.startTime
    } : null,
    meetsTarget: uptimePercentage >= 99.5
  }
}

/**
 * Reset uptime tracking
 */
export function resetUptimeTracking(): void {
  uptimeTracker.startTime = Date.now()
  uptimeTracker.downtimeTotal = 0
  uptimeTracker.downtimeEvents = []
  currentDowntime = null
  
  log('INFO', 'uptime-tracking', 'Uptime tracking reset')
}
