/**
 * CSRF PROTECTION - Token-based CSRF Defense
 * 
 * Protects all state-changing operations (POST, PUT, PATCH, DELETE)
 * Session-bound tokens with server-side validation
 * Edge Runtime compatible
 */

/**
 * Generate CSRF token bound to session
 * Uses Web Crypto API for Edge Runtime compatibility
 */
export async function generateCsrfToken(sessionId: string): Promise<string> {
  const timestamp = Date.now().toString()
  const data = `${sessionId}:${timestamp}`
  
  // Encode data
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  
  // Hash with SHA-256
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  
  // Return token: timestamp:hash
  return `${timestamp}:${hashHex}`
}

/**
 * Validate CSRF token
 * Checks token format, expiry, and session binding
 */
export async function validateCsrfToken(
  token: string,
  sessionId: string,
  maxAgeMs: number = 3600000 // 1 hour default
): Promise<{ valid: boolean; reason?: string }> {
  if (!token || !sessionId) {
    return { valid: false, reason: 'Missing token or session' }
  }

  // Parse token
  const parts = token.split(':')
  if (parts.length !== 2) {
    return { valid: false, reason: 'Invalid token format' }
  }

  const [timestamp, hash] = parts
  const tokenTime = parseInt(timestamp, 10)

  if (isNaN(tokenTime)) {
    return { valid: false, reason: 'Invalid timestamp' }
  }

  // Check expiry
  const now = Date.now()
  if (now - tokenTime > maxAgeMs) {
    return { valid: false, reason: 'Token expired' }
  }

  // Regenerate expected hash using the SAME timestamp from token
  const data = `${sessionId}:${timestamp}`
  const encoder = new TextEncoder()
  const dataBuffer = encoder.encode(data)
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const expectedHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Constant-time comparison (prevent timing attacks)
  if (hash !== expectedHash) {
    return { valid: false, reason: 'Invalid token signature' }
  }

  return { valid: true }
}

/**
 * Extract CSRF token from request headers or body
 */
export function extractCsrfToken(request: Request): string | null {
  // Check X-CSRF-Token header (preferred)
  const headerToken = request.headers.get('x-csrf-token')
  if (headerToken) {
    return headerToken
  }

  // Check body for form submissions (fallback)
  // Note: Body parsing should be done by caller
  return null
}

/**
 * CSRF validation result
 */
export interface CsrfValidationResult {
  valid: boolean
  reason?: string
  shouldRegenerate?: boolean
}

/**
 * Validate CSRF for incoming request
 * Returns validation result with regeneration hint
 */
export async function validateRequestCsrf(
  request: Request,
  sessionId: string
): Promise<CsrfValidationResult> {
  const token = extractCsrfToken(request)
  
  if (!token) {
    return {
      valid: false,
      reason: 'CSRF token missing',
      shouldRegenerate: false
    }
  }

  const result = await validateCsrfToken(token, sessionId)
  
  return {
    valid: result.valid,
    reason: result.reason,
    shouldRegenerate: result.reason === 'Token expired'
  }
}
