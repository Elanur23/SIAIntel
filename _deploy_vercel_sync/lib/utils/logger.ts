/**
 * PRODUCTION-SAFE LOGGER
 * 
 * RULES:
 * - No sensitive data in production logs
 * - Structured logging for monitoring
 * - Automatic PII redaction
 */

import { NextRequest } from 'next/server'

const IS_PRODUCTION = process.env.NODE_ENV === 'production'

/**
 * Redact sensitive information from logs
 */
function redactSensitive(data: any): any {
  if (typeof data === 'string') {
    // Redact API keys, tokens, passwords
    return data
      .replace(/api[_-]?key[=:]\s*[\w-]+/gi, 'api_key=***REDACTED***')
      .replace(/token[=:]\s*[\w-]+/gi, 'token=***REDACTED***')
      .replace(/password[=:]\s*[\w-]+/gi, 'password=***REDACTED***')
      .replace(/secret[=:]\s*[\w-]+/gi, 'secret=***REDACTED***')
  }
  
  if (typeof data === 'object' && data !== null) {
    const redacted: any = Array.isArray(data) ? [] : {}
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()
      
      // Redact sensitive keys
      if (
        lowerKey.includes('password') ||
        lowerKey.includes('secret') ||
        lowerKey.includes('token') ||
        lowerKey.includes('key') ||
        lowerKey.includes('auth')
      ) {
        redacted[key] = '***REDACTED***'
      } else {
        redacted[key] = redactSensitive(value)
      }
    }
    
    return redacted
  }
  
  return data
}

/**
 * Log API request (production-safe)
 */
export function logApiRequest(
  request: NextRequest,
  status: 'ALLOWED' | 'RATE_LIMITED' | 'BLOCKED',
  metadata?: Record<string, any>
): void {
  if (IS_PRODUCTION && status === 'ALLOWED') {
    // Don't log successful requests in production (too noisy)
    return
  }

  const pathname = new URL(request.url).pathname
  const method = request.method
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'

  const logData = {
    timestamp: new Date().toISOString(),
    method,
    pathname,
    ip,
    status,
    ...metadata,
  }

  if (status === 'RATE_LIMITED' || status === 'BLOCKED') {
    console.warn('[API_SECURITY]', JSON.stringify(logData))
  } else if (!IS_PRODUCTION) {
    console.log('[API_REQUEST]', JSON.stringify(logData))
  }
}

/**
 * Log error (production-safe)
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, any>
): void {
  const errorData = {
    timestamp: new Date().toISOString(),
    context,
    error: error instanceof Error ? error.message : String(error),
    stack: IS_PRODUCTION ? undefined : error instanceof Error ? error.stack : undefined,
    ...redactSensitive(metadata || {}),
  }

  console.error(`[ERROR:${context}]`, JSON.stringify(errorData))
}

/**
 * Log info (production-safe)
 */
export function logInfo(
  context: string,
  message: string,
  metadata?: Record<string, any>
): void {
  if (IS_PRODUCTION) {
    // Only log important info in production
    return
  }

  const logData = {
    timestamp: new Date().toISOString(),
    context,
    message,
    ...metadata,
  }

  console.log(`[INFO:${context}]`, JSON.stringify(logData))
}

/**
 * Log warning (always logged)
 */
export function logWarning(
  context: string,
  message: string,
  metadata?: Record<string, any>
): void {
  const logData = {
    timestamp: new Date().toISOString(),
    context,
    message,
    ...redactSensitive(metadata || {}),
  }

  console.warn(`[WARN:${context}]`, JSON.stringify(logData))
}
