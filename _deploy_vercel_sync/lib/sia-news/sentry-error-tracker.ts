/**
 * SIA Sentry Error Tracker
 * 
 * Global error boundary and monitoring system for:
 * - Google TTS API failures
 * - Google Indexing API errors
 * - AdSense unit failures
 * - Critical system errors
 * 
 * Sends real-time alerts to admin dashboard
 */

import type { Language } from './types'

// ============================================================================
// TYPES
// ============================================================================

export type ErrorSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'

export interface ErrorLog {
  id: string
  timestamp: string
  severity: ErrorSeverity
  category: 'TTS' | 'INDEXING' | 'ADSENSE' | 'API' | 'SYSTEM'
  message: string
  details: Record<string, any>
  stack?: string
  language?: Language
  articleId?: string
  resolved: boolean
}

export interface ErrorAlert {
  severity: ErrorSeverity
  category: string
  message: string
  count: number
  firstOccurrence: string
  lastOccurrence: string
}

// ============================================================================
// ERROR STORE
// ============================================================================

const errorLogs: ErrorLog[] = []
const MAX_ERROR_LOGS = 1000

// Error counters for alerting
const errorCounters = new Map<string, {
  count: number
  firstOccurrence: string
  lastOccurrence: string
}>()

// ============================================================================
// ERROR LOGGING
// ============================================================================

/**
 * Log error with severity and category
 */
export function logError(
  category: ErrorLog['category'],
  severity: ErrorSeverity,
  message: string,
  details: Record<string, any> = {},
  error?: Error
): string {
  const errorId = generateErrorId()
  
  const errorLog: ErrorLog = {
    id: errorId,
    timestamp: new Date().toISOString(),
    severity,
    category,
    message,
    details,
    stack: error?.stack,
    language: details.language,
    articleId: details.articleId,
    resolved: false
  }
  
  // Add to logs
  errorLogs.unshift(errorLog)
  
  // Keep only last MAX_ERROR_LOGS
  if (errorLogs.length > MAX_ERROR_LOGS) {
    errorLogs.pop()
  }
  
  // Update error counters
  updateErrorCounter(category, severity, message)
  
  // Console logging
  const logLevel = severity === 'CRITICAL' || severity === 'HIGH' ? 'error' : 'warn'
  console[logLevel](`[${category}] [${severity}] ${message}`, details)
  
  // Send alert if critical
  if (severity === 'CRITICAL') {
    sendCriticalAlert(errorLog)
  }
  
  return errorId
}

/**
 * Log TTS failure
 */
export function logTTSFailure(
  language: Language,
  articleId: string,
  error: Error,
  details: Record<string, any> = {}
): string {
  return logError(
    'TTS',
    'CRITICAL',
    `TTS generation failed for ${language}`,
    {
      language,
      articleId,
      errorMessage: error.message,
      ...details
    },
    error
  )
}

/**
 * Log indexing failure
 */
export function logIndexingFailure(
  articleId: string,
  error: Error,
  details: Record<string, any> = {}
): string {
  return logError(
    'INDEXING',
    'HIGH',
    'Google Indexing API failed',
    {
      articleId,
      errorMessage: error.message,
      ...details
    },
    error
  )
}

/**
 * Log AdSense failure
 */
export function logAdSenseFailure(
  slotId: string,
  error: Error,
  details: Record<string, any> = {}
): string {
  return logError(
    'ADSENSE',
    'MEDIUM',
    `AdSense unit failed: ${slotId}`,
    {
      slotId,
      errorMessage: error.message,
      ...details
    },
    error
  )
}

/**
 * Log API failure
 */
export function logAPIFailure(
  endpoint: string,
  statusCode: number,
  error: Error,
  details: Record<string, any> = {}
): string {
  const severity: ErrorSeverity = statusCode >= 500 ? 'HIGH' : 'MEDIUM'
  
  return logError(
    'API',
    severity,
    `API request failed: ${endpoint}`,
    {
      endpoint,
      statusCode,
      errorMessage: error.message,
      ...details
    },
    error
  )
}

// ============================================================================
// ERROR RETRIEVAL
// ============================================================================

/**
 * Get recent errors
 */
export function getRecentErrors(limit: number = 50): ErrorLog[] {
  return errorLogs.slice(0, limit)
}

/**
 * Get errors by category
 */
export function getErrorsByCategory(
  category: ErrorLog['category'],
  limit: number = 50
): ErrorLog[] {
  return errorLogs
    .filter(log => log.category === category)
    .slice(0, limit)
}

/**
 * Get errors by severity
 */
export function getErrorsBySeverity(
  severity: ErrorSeverity,
  limit: number = 50
): ErrorLog[] {
  return errorLogs
    .filter(log => log.severity === severity)
    .slice(0, limit)
}

/**
 * Get unresolved errors
 */
export function getUnresolvedErrors(): ErrorLog[] {
  return errorLogs.filter(log => !log.resolved)
}

/**
 * Get error by ID
 */
export function getErrorById(errorId: string): ErrorLog | undefined {
  return errorLogs.find(log => log.id === errorId)
}

// ============================================================================
// ERROR RESOLUTION
// ============================================================================

/**
 * Mark error as resolved
 */
export function resolveError(errorId: string): boolean {
  const error = getErrorById(errorId)
  
  if (error) {
    error.resolved = true
    console.log(`[ERROR-TRACKER] Error resolved: ${errorId}`)
    return true
  }
  
  return false
}

/**
 * Resolve all errors of a category
 */
export function resolveErrorsByCategory(category: ErrorLog['category']): number {
  let count = 0
  
  errorLogs.forEach(log => {
    if (log.category === category && !log.resolved) {
      log.resolved = true
      count++
    }
  })
  
  console.log(`[ERROR-TRACKER] Resolved ${count} ${category} errors`)
  return count
}

// ============================================================================
// ERROR STATISTICS
// ============================================================================

/**
 * Get error statistics
 */
export function getErrorStatistics(): {
  total: number
  byCategory: Record<string, number>
  bySeverity: Record<string, number>
  unresolved: number
  last24Hours: number
} {
  const now = Date.now()
  const last24Hours = now - 24 * 60 * 60 * 1000
  
  const stats = {
    total: errorLogs.length,
    byCategory: {} as Record<string, number>,
    bySeverity: {} as Record<string, number>,
    unresolved: 0,
    last24Hours: 0
  }
  
  errorLogs.forEach(log => {
    // By category
    stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1
    
    // By severity
    stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1
    
    // Unresolved
    if (!log.resolved) {
      stats.unresolved++
    }
    
    // Last 24 hours
    if (new Date(log.timestamp).getTime() > last24Hours) {
      stats.last24Hours++
    }
  })
  
  return stats
}

/**
 * Get active alerts
 */
export function getActiveAlerts(): ErrorAlert[] {
  const alerts: ErrorAlert[] = []
  
  errorCounters.forEach((counter, key) => {
    const [category, severity, message] = key.split('::')
    
    // Alert if more than 5 occurrences in last hour
    const lastOccurrence = new Date(counter.lastOccurrence).getTime()
    const oneHourAgo = Date.now() - 60 * 60 * 1000
    
    if (lastOccurrence > oneHourAgo && counter.count >= 5) {
      alerts.push({
        severity: severity as ErrorSeverity,
        category,
        message,
        count: counter.count,
        firstOccurrence: counter.firstOccurrence,
        lastOccurrence: counter.lastOccurrence
      })
    }
  })
  
  return alerts.sort((a, b) => {
    const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
    return severityOrder[a.severity] - severityOrder[b.severity]
  })
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateErrorId(): string {
  return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function updateErrorCounter(
  category: string,
  severity: ErrorSeverity,
  message: string
): void {
  const key = `${category}::${severity}::${message}`
  const counter = errorCounters.get(key)
  const now = new Date().toISOString()
  
  if (counter) {
    counter.count++
    counter.lastOccurrence = now
  } else {
    errorCounters.set(key, {
      count: 1,
      firstOccurrence: now,
      lastOccurrence: now
    })
  }
}

function sendCriticalAlert(errorLog: ErrorLog): void {
  // In production, this would send to:
  // - Admin dashboard (WebSocket)
  // - Email notification
  // - Slack/Discord webhook
  // - SMS for critical errors
  
  console.error('🚨 CRITICAL ERROR ALERT 🚨')
  console.error(`Category: ${errorLog.category}`)
  console.error(`Message: ${errorLog.message}`)
  console.error(`Details:`, errorLog.details)
  
  // Trigger dashboard notification
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('sia-critical-error', {
      detail: errorLog
    }))
  }
}

// ============================================================================
// ERROR BOUNDARY INTEGRATION
// ============================================================================

/**
 * Global error handler for uncaught errors
 */
export function initializeGlobalErrorHandler(): void {
  if (typeof window === 'undefined') return
  
  // Catch unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      'SYSTEM',
      'HIGH',
      'Unhandled promise rejection',
      {
        reason: event.reason,
        promise: event.promise
      }
    )
  })
  
  // Catch global errors
  window.addEventListener('error', (event) => {
    logError(
      'SYSTEM',
      'HIGH',
      'Uncaught error',
      {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      },
      event.error
    )
  })
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clear old error logs
 */
export function clearOldErrors(daysOld: number = 7): number {
  const cutoffDate = Date.now() - daysOld * 24 * 60 * 60 * 1000
  let removed = 0
  
  for (let i = errorLogs.length - 1; i >= 0; i--) {
    const logDate = new Date(errorLogs[i].timestamp).getTime()
    
    if (logDate < cutoffDate) {
      errorLogs.splice(i, 1)
      removed++
    }
  }
  
  console.log(`[ERROR-TRACKER] Cleared ${removed} old error logs`)
  return removed
}

// Auto-cleanup every 24 hours
if (typeof window !== 'undefined') {
  setInterval(() => {
    clearOldErrors(7)
  }, 24 * 60 * 60 * 1000)
}
