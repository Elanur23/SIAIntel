/**
 * API SECURITY MIDDLEWARE - Centralized Protection
 * 
 * FEATURES:
 * - Rate limiting (multi-tier)
 * - CORS validation
 * - Security headers
 * - Request logging (production-safe)
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkApiRateLimit, type RateLimitTier } from './api-rate-limiter'
import { addCorsHeaders, handleCorsPreFlight, corsErrorResponse } from './cors-config'
import { logApiRequest } from '@/lib/utils/logger'

export interface ApiSecurityOptions {
  rateLimitTier?: RateLimitTier
  requireAuth?: boolean
  allowedMethods?: string[]
  skipRateLimit?: boolean
  skipCors?: boolean
}

/**
 * Apply API security middleware
 * 
 * Usage in API routes:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const securityCheck = await applyApiSecurity(request, { rateLimitTier: 'strict' })
 *   if (securityCheck) return securityCheck
 *   
 *   // Your API logic here
 * }
 * ```
 */
export async function applyApiSecurity(
  request: NextRequest,
  options: ApiSecurityOptions = {}
): Promise<NextResponse | null> {
  const {
    rateLimitTier = 'public',
    allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    skipRateLimit = false,
    skipCors = false,
  } = options

  const origin = request.headers.get('origin')
  const method = request.method

  // 1. Handle CORS preflight
  if (method === 'OPTIONS' && !skipCors) {
    return handleCorsPreFlight(origin, allowedMethods)
  }

  // 2. Check rate limit
  if (!skipRateLimit) {
    const rateLimit = checkApiRateLimit(request, rateLimitTier)
    
    if (!rateLimit.allowed) {
      logApiRequest(request, 'RATE_LIMITED', { tier: rateLimitTier })
      
      const response = NextResponse.json(
        {
          error: 'Rate limit exceeded',
          retryAfter: rateLimit.retryAfter,
          resetTime: rateLimit.resetTime,
        },
        { status: 429 }
      )
      
      // Add rate limit headers
      response.headers.set('X-RateLimit-Limit', String(rateLimit.remaining + 1))
      response.headers.set('X-RateLimit-Remaining', '0')
      response.headers.set('X-RateLimit-Reset', String(rateLimit.resetTime))
      response.headers.set('Retry-After', String(rateLimit.retryAfter))
      
      return skipCors ? response : addCorsHeaders(response, origin, allowedMethods)
    }

    // Add rate limit headers to successful requests (will be added to actual response)
    request.headers.set('X-RateLimit-Remaining', String(rateLimit.remaining))
    request.headers.set('X-RateLimit-Reset', String(rateLimit.resetTime))
  }

  // 3. Log request (production-safe)
  logApiRequest(request, 'ALLOWED', { tier: rateLimitTier })

  // No blocking issues, allow request to proceed
  return null
}

/**
 * Add security headers to API response
 */
export function addSecurityHeaders(
  response: NextResponse,
  request: NextRequest,
  options: ApiSecurityOptions = {}
): NextResponse {
  const { allowedMethods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], skipCors = false } = options
  const origin = request.headers.get('origin')

  // Add CORS headers
  if (!skipCors) {
    addCorsHeaders(response, origin, allowedMethods)
  }

  // Add rate limit headers if available
  const remaining = request.headers.get('X-RateLimit-Remaining')
  const reset = request.headers.get('X-RateLimit-Reset')
  
  if (remaining) response.headers.set('X-RateLimit-Remaining', remaining)
  if (reset) response.headers.set('X-RateLimit-Reset', reset)

  // Add security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

/**
 * Wrapper for API routes with automatic security
 * 
 * Usage:
 * ```ts
 * export const POST = withApiSecurity(
 *   async (request: NextRequest) => {
 *     // Your API logic
 *     return NextResponse.json({ success: true })
 *   },
 *   { rateLimitTier: 'strict' }
 * )
 * ```
 */
export function withApiSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: ApiSecurityOptions = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Apply security checks
    const securityCheck = await applyApiSecurity(request, options)
    if (securityCheck) return securityCheck

    try {
      // Execute handler
      const response = await handler(request)
      
      // Add security headers to response
      return addSecurityHeaders(response, request, options)
    } catch (error) {
      // Handle errors with security headers
      const errorResponse = NextResponse.json(
        {
          error: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        },
        { status: 500 }
      )
      
      return addSecurityHeaders(errorResponse, request, options)
    }
  }
}
