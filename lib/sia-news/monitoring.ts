/**
 * Monitoring Module - Minimal Stub
 *
 * Minimal stub to satisfy scheduler-control.ts imports.
 * This is a self-contained implementation with no external dependencies.
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'

export function log(
  level: LogLevel,
  component: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString()
  const logEntry = {
    timestamp,
    level,
    component,
    message,
    ...metadata,
  }

  // Simple console logging
  switch (level) {
    case 'ERROR':
      console.error(`[${component}]`, message, metadata)
      break
    case 'WARN':
      console.warn(`[${component}]`, message, metadata)
      break
    case 'INFO':
      console.info(`[${component}]`, message, metadata)
      break
    case 'DEBUG':
      console.debug(`[${component}]`, message, metadata)
      break
  }
}

export function logError(
  component: string,
  operation: string,
  error: Error,
  metadata?: Record<string, unknown>
): void {
  log('ERROR', component, `${operation} failed: ${error.message}`, {
    error: error.message,
    stack: error.stack,
    ...metadata,
  })
}
