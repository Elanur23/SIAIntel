/**
 * RATE LIMITER - Database-Backed Brute Force Protection
 * 
 * STORAGE: Database-backed via Prisma (SQLite → PostgreSQL ready)
 * - Rate limits persist across server restarts
 * - Suitable for multi-instance deployments (with PostgreSQL)
 * - No memory leaks
 * 
 * Migration to PostgreSQL:
 * 1. Update datasource in prisma/schema.prisma
 * 2. Update DATABASE_URL environment variable
 * 3. Run: npx prisma migrate deploy
 * No code changes needed.
 */

import { prisma } from '@/lib/db/prisma'

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

const LOGIN_ATTEMPTS_LIMIT = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

/**
 * Check if request is rate limited
 */
export async function checkRateLimit(
  identifier: string,
  action: string = 'login'
): Promise<RateLimitResult> {
  const key = `${action}:${identifier}`
  const now = Date.now()

  const entry = await prisma.rateLimit.findUnique({
    where: { key },
  })

  // No previous attempts or window expired
  if (!entry || now > entry.resetTime.getTime()) {
    const resetTime = new Date(now + LOGIN_WINDOW_MS)
    
    await prisma.rateLimit.upsert({
      where: { key },
      create: {
        key,
        count: 1,
        resetTime,
        firstAttempt: new Date(now),
      },
      update: {
        count: 1,
        resetTime,
        firstAttempt: new Date(now),
      },
    })

    return {
      allowed: true,
      remaining: LOGIN_ATTEMPTS_LIMIT - 1,
      resetTime: resetTime.getTime(),
    }
  }

  // Rate limit exceeded
  if (entry.count >= LOGIN_ATTEMPTS_LIMIT) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime.getTime(),
      retryAfter: Math.ceil((entry.resetTime.getTime() - now) / 1000), // seconds
    }
  }

  // Increment count
  const updated = await prisma.rateLimit.update({
    where: { key },
    data: {
      count: entry.count + 1,
    },
  })

  return {
    allowed: true,
    remaining: LOGIN_ATTEMPTS_LIMIT - updated.count,
    resetTime: updated.resetTime.getTime(),
  }
}

/**
 * Reset rate limit for identifier (e.g., after successful login)
 */
export async function resetRateLimit(
  identifier: string,
  action: string = 'login'
): Promise<void> {
  const key = `${action}:${identifier}`
  
  await prisma.rateLimit.delete({
    where: { key },
  }).catch(() => {
    // Ignore errors if entry doesn't exist
  })
}

/**
 * Cleanup expired rate limit entries (opportunistic, no cron)
 * Call this manually or from admin endpoints only
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const result = await prisma.rateLimit.deleteMany({
    where: {
      resetTime: {
        lt: new Date(),
      },
    },
  })

  return result.count
}

/**
 * Get rate limit count (for monitoring)
 */
export async function getRateLimitCount(): Promise<number> {
  return await prisma.rateLimit.count()
}
