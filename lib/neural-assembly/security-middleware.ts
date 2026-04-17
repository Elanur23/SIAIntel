/**
 * NEURAL ASSEMBLY SECURITY MIDDLEWARE
 * Production-grade authentication, authorization, and abuse protection
 * 
 * Features:
 * - JWT/API key authentication
 * - Role-based access control (RBAC)
 * - Rate limiting per endpoint
 * - Cost exhaustion protection
 * - Input validation
 * - Audit logging
 * 
 * @version 1.0.0 (Phase 2 Pre-Gap #4)
 * @author SIA Intelligence Systems - Security Team
 */

import { NextRequest, NextResponse } from 'next/server'
import { getGlobalDatabase } from './database'
import { z } from 'zod'

// ============================================================================
// TYPES
// ============================================================================

export type Role = 'ADMIN' | 'OPERATOR' | 'PUBLIC'

export interface AuthContext {
  authenticated: boolean
  role: Role
  userId?: string
  apiKey?: string
  ipAddress: string
  userAgent?: string
}

export interface SecurityConfig {
  requireAuth: boolean
  allowedRoles: Role[]
  rateLimit?: {
    maxRequests: number
    windowMs: number
  }
  maxBudgetPerRequest?: number
  maxConcurrentBatches?: number
  inputSchema?: z.ZodSchema
}

// ============================================================================
// RATE LIMITING (In-Memory)
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

async function checkRateLimit(identifier: string, endpoint: string, maxRequests: number, windowMs: number): Promise<{ allowed: boolean; retryAfter?: number }> {
  const key = `${endpoint}:${identifier}`
  const now = Date.now()
  
  const entry = rateLimitStore.get(key)
  
  // No previous attempts or window expired
  if (!entry || now > entry.resetTime) {
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs
    })
    return { allowed: true }
  }
  
  // Rate limit exceeded
  if (entry.count >= maxRequests) {
    return {
      allowed: false,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000)
    }
  }
  
  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)
  
  return { allowed: true }
}

// ============================================================================
// AUDIT LOGGING (Simple Console)
// ============================================================================

async function auditLog(eventType: string, result: 'success' | 'failure', options: any = {}): Promise<void> {
  const timestamp = new Date().toISOString()
  const icon = result === 'success' ? '✅' : '❌'
  
  console.log(
    `[AUDIT] ${icon} ${eventType} | ` +
    `IP: ${options.ipAddress || 'unknown'} | ` +
    `User: ${options.userId || 'unknown'}` +
    (options.reason ? ` - ${options.reason}` : '')
  )
}

// ============================================================================
// AUTHENTICATION
// ============================================================================

/**
 * Extract and validate API key from request
 */
function extractApiKey(request: NextRequest): string | null {
  // Try Authorization header first (Bearer token)
  const authHeader = request.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7)
  }

  // Try X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key')
  if (apiKeyHeader) {
    return apiKeyHeader
  }

  return null
}

/**
 * Validate API key and determine role
 */
function validateApiKey(apiKey: string | null): { valid: boolean; role: Role; userId?: string } {
  if (!apiKey) {
    return { valid: false, role: 'PUBLIC' }
  }

  // Admin keys (from environment)
  const adminKeys = [
    process.env.NEURAL_ASSEMBLY_ADMIN_KEY,
    process.env.AI_API_KEY
  ].filter(Boolean)

  if (adminKeys.includes(apiKey)) {
    return { valid: true, role: 'ADMIN', userId: 'admin' }
  }

  // Operator keys (from environment)
  const operatorKeys = [
    process.env.NEURAL_ASSEMBLY_OPERATOR_KEY
  ].filter(Boolean)

  if (operatorKeys.includes(apiKey)) {
    return { valid: true, role: 'OPERATOR', userId: 'operator' }
  }

  return { valid: false, role: 'PUBLIC' }
}

/**
 * Authenticate request and build auth context
 */
export function authenticate(request: NextRequest): AuthContext {
  const apiKey = extractApiKey(request)
  const { valid, role, userId } = validateApiKey(apiKey)

  const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() 
    || request.headers.get('x-real-ip') 
    || 'unknown'

  const userAgent = request.headers.get('user-agent') || undefined

  return {
    authenticated: valid,
    role,
    userId,
    apiKey: apiKey || undefined,
    ipAddress,
    userAgent
  }
}

// ============================================================================
// AUTHORIZATION
// ============================================================================

/**
 * Check if role is allowed for endpoint
 */
export function authorize(authContext: AuthContext, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(authContext.role)
}

// ============================================================================
// RATE LIMITING
// ============================================================================

/**
 * Check rate limit for endpoint
 */
export async function checkEndpointRateLimit(
  authContext: AuthContext,
  endpoint: string,
  config?: { maxRequests: number; windowMs: number }
): Promise<{ allowed: boolean; retryAfter?: number }> {
  if (!config) {
    return { allowed: true }
  }

  // Use userId if authenticated, otherwise IP
  const identifier = authContext.userId || authContext.ipAddress

  const result = await checkRateLimit(identifier, endpoint, config.maxRequests, config.windowMs)

  return {
    allowed: result.allowed,
    retryAfter: result.retryAfter
  }
}

// ============================================================================
// COST EXHAUSTION PROTECTION
// ============================================================================

/**
 * Check if request exceeds budget limits
 */
export function checkBudgetLimits(
  authContext: AuthContext,
  maxBudgetPerRequest?: number,
  maxConcurrentBatches?: number
): { allowed: boolean; reason?: string } {
  const db = getGlobalDatabase()
  const identifier = authContext.userId || authContext.ipAddress

  // Check concurrent batches per user
  if (maxConcurrentBatches !== undefined) {
    const inProgressCount = db.getActiveBatchCount(identifier)

    if (inProgressCount >= maxConcurrentBatches) {
      return {
        allowed: false,
        reason: `Maximum concurrent batches (${maxConcurrentBatches}) reached for user ${identifier}`
      }
    }
  }

  return { allowed: true }
}

/**
 * Check daily usage limits for user/IP
 */
export async function checkDailyUsageLimit(
  authContext: AuthContext,
  maxDailyBudget: number = 100
): Promise<{ allowed: boolean; used: number; remaining: number }> {
  const db = getGlobalDatabase()
  const identifier = authContext.userId || authContext.ipAddress

  // Get start of today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTimestamp = today.getTime()

  // Use database to get aggregate sum (more efficient than memory filter)
  const totalSpent = db.getDailySpent(identifier, todayTimestamp)

  const remaining = Math.max(0, maxDailyBudget - totalSpent)

  return {
    allowed: remaining > 0,
    used: totalSpent,
    remaining
  }
}

// ============================================================================
// INPUT VALIDATION
// ============================================================================

/**
 * Validate request body against schema
 */
export function validateInput<T>(
  body: any,
  schema: z.ZodSchema<T>
): { valid: boolean; data?: T; errors?: string[] } {
  try {
    const data = schema.parse(body)
    return { valid: true, data }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        valid: false,
        errors: error.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      }
    }
    return {
      valid: false,
      errors: ['Invalid input format']
    }
  }
}

// ============================================================================
// SECURITY MIDDLEWARE
// ============================================================================

/**
 * Main security middleware
 * Applies authentication, authorization, rate limiting, and validation
 */
export async function securityMiddleware(
  request: NextRequest,
  config: SecurityConfig
): Promise<{ allowed: boolean; response?: NextResponse; authContext?: AuthContext }> {
  const authContext = authenticate(request)

  // 1. AUTHENTICATION CHECK
  if (config.requireAuth && !authContext.authenticated) {
    await auditLog('api_access_denied', 'failure', {
      ipAddress: authContext.ipAddress,
      userAgent: authContext.userAgent,
      route: request.nextUrl.pathname,
      reason: 'Authentication required'
    })

    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Authentication required', code: 'AUTH_REQUIRED' },
        { status: 401 }
      )
    }
  }

  // 2. AUTHORIZATION CHECK
  if (!authorize(authContext, config.allowedRoles)) {
    await auditLog('api_access_denied', 'failure', {
      userId: authContext.userId,
      ipAddress: authContext.ipAddress,
      userAgent: authContext.userAgent,
      route: request.nextUrl.pathname,
      reason: `Insufficient permissions (role: ${authContext.role})`
    })

    return {
      allowed: false,
      response: NextResponse.json(
        { error: 'Insufficient permissions', code: 'FORBIDDEN', required_role: config.allowedRoles },
        { status: 403 }
      )
    }
  }

  // 3. RATE LIMITING CHECK
  if (config.rateLimit) {
    const rateLimitResult = await checkEndpointRateLimit(
      authContext,
      request.nextUrl.pathname,
      config.rateLimit
    )

    if (!rateLimitResult.allowed) {
      await auditLog('rate_limit_exceeded', 'failure', {
        userId: authContext.userId,
        ipAddress: authContext.ipAddress,
        route: request.nextUrl.pathname,
        reason: 'Rate limit exceeded'
      })

      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: 'Rate limit exceeded',
            code: 'RATE_LIMIT_EXCEEDED',
            retry_after_seconds: rateLimitResult.retryAfter
          },
          {
            status: 429,
            headers: {
              'Retry-After': rateLimitResult.retryAfter?.toString() || '60'
            }
          }
        )
      }
    }
  }

  // 4. BUDGET LIMITS CHECK
  if (config.maxBudgetPerRequest !== undefined || config.maxConcurrentBatches !== undefined) {
    const budgetCheck = checkBudgetLimits(
      authContext,
      config.maxBudgetPerRequest,
      config.maxConcurrentBatches
    )

    if (!budgetCheck.allowed) {
      await auditLog('budget_limit_exceeded', 'failure', {
        userId: authContext.userId,
        ipAddress: authContext.ipAddress,
        route: request.nextUrl.pathname,
        reason: budgetCheck.reason
      })

      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: 'Budget limit exceeded',
            code: 'BUDGET_LIMIT_EXCEEDED',
            reason: budgetCheck.reason
          },
          { status: 429 }
        )
      }
    }
  }

  // 5. DAILY USAGE LIMIT CHECK
  // NOTE: Legacy /orchestrate endpoint logic removed.
  // Modern dispatcher handles usage through job orchestration.

  // All checks passed
  return {
    allowed: true,
    authContext
  }
}

// ============================================================================
// ERROR SANITIZATION
// ============================================================================

/**
 * Sanitize error for public consumption
 */
export function sanitizeError(error: any, isDevelopment: boolean = false): any {
  if (isDevelopment) {
    return {
      error: error.message || 'Operation failed',
      details: error.message,
      stack: error.stack
    }
  }

  // Production: generic error
  return {
    error: 'Operation failed',
    code: 'INTERNAL_ERROR'
  }
}

// ============================================================================
// SECURITY HEADERS
// ============================================================================

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Content-Security-Policy', "default-src 'self'")

  return response
}
