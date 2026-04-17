/**
 * API RATE LIMITER - Multi-Tier Protection
 * 
 * TIERS:
 * - PUBLIC: 60 req/min (comments, newsletter, translate)
 * - MODERATE: 30 req/min (content APIs, search)
 * - STRICT: 10 req/min (AI generation, expensive ops)
 * - AUTH: 5 req/15min (login, sensitive ops)
 * 
 * STORAGE: In-memory with automatic cleanup
 * NOTE: For multi-instance deployments, migrate to Redis
 */

import { NextRequest } from 'next/server'

export type RateLimitTier = 'public' | 'moderate' | 'strict' | 'auth'

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

interface RateLimitEntry {
  count: number
  resetTime: number
  firstRequest: number
}

const TIER_CONFIGS: Record<RateLimitTier, RateLimitConfig> = {
  public: { maxRequests: 60, windowMs: 60 * 1000 }, // 60/min
  moderate: { maxRequests: 30, windowMs: 60 * 1000 }, // 30/min
  strict: { maxRequests: 10, windowMs: 60 * 1000 }, // 10/min
  auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5/15min
}

// In-memory store (migrate to Redis for production multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Cleanup expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

/**
 * Get client identifier from request
 */
function getClientIdentifier(request: NextRequest): string {
  // Try multiple headers for IP detection (Vercel, Cloudflare, standard)
  const forwarded = request.headers.get('x-forwarded-for')
  const realIp = request.headers.get('x-real-ip')
  const vercelIp = request.headers.get('x-vercel-forwarded-for')
  
  const ip = forwarded?.split(',')[0] || realIp || vercelIp || 'unknown'
  
  return ip
}

/**
 * Check rate limit for request
 */
export function checkApiRateLimit(
  request: NextRequest,
  tier: RateLimitTier = 'public'
): {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
} {
  const config = TIER_CONFIGS[tier]
  const identifier = getClientIdentifier(request)
  const pathname = new URL(request.url).pathname
  const key = `${tier}:${identifier}:${pathname}`
  const now = Date.now()

  const entry = rateLimitStore.get(key)

  // No previous requests or window expired
  if (!entry || now > entry.resetTime) {
    const resetTime = now + config.windowMs
    
    rateLimitStore.set(key, {
      count: 1,
      resetTime,
      firstRequest: now,
    })

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    }
  }

  // Rate limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000),
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  }
}

/**
 * Get rate limit stats (for monitoring)
 */
export function getRateLimitStats(): {
  totalKeys: number
  tierBreakdown: Record<RateLimitTier, number>
} {
  const tierBreakdown: Record<RateLimitTier, number> = {
    public: 0,
    moderate: 0,
    strict: 0,
    auth: 0,
  }

  for (const key of rateLimitStore.keys()) {
    const tier = key.split(':')[0] as RateLimitTier
    if (tier in tierBreakdown) {
      tierBreakdown[tier]++
    }
  }

  return {
    totalKeys: rateLimitStore.size,
    tierBreakdown,
  }
}
