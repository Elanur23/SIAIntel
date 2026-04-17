export type SearchTier = 'standard' | 'premium' | 'enterprise'

interface TierConfig {
  perMinute: number
  perDay: number
}

interface UsageState {
  minuteWindowStart: number
  dayWindowStart: number
  minuteCount: number
  dayCount: number
}

const CONFIG: Record<SearchTier, TierConfig> = {
  standard: { perMinute: 100, perDay: 5000 },
  premium: { perMinute: 500, perDay: 50000 },
  enterprise: { perMinute: 2000, perDay: 250000 },
}

const usage = new Map<string, UsageState>()

interface LimitResult {
  allowed: boolean
  reason?: string
  resetTime: number
}

class SearchRateLimiter {
  checkLimit(userId: string, tier: SearchTier): LimitResult {
    const key = `${tier}:${userId}`
    const now = Date.now()
    const minuteMs = 60_000
    const dayMs = 24 * 60 * 60 * 1000

    const state = usage.get(key) || {
      minuteWindowStart: now,
      dayWindowStart: now,
      minuteCount: 0,
      dayCount: 0,
    }

    if (now - state.minuteWindowStart >= minuteMs) {
      state.minuteWindowStart = now
      state.minuteCount = 0
    }

    if (now - state.dayWindowStart >= dayMs) {
      state.dayWindowStart = now
      state.dayCount = 0
    }

    const limits = CONFIG[tier]

    if (state.minuteCount >= limits.perMinute) {
      usage.set(key, state)
      return {
        allowed: false,
        reason: 'Per-minute rate limit exceeded',
        resetTime: state.minuteWindowStart + minuteMs,
      }
    }

    if (state.dayCount >= limits.perDay) {
      usage.set(key, state)
      return {
        allowed: false,
        reason: 'Daily rate limit exceeded',
        resetTime: state.dayWindowStart + dayMs,
      }
    }

    state.minuteCount += 1
    state.dayCount += 1
    usage.set(key, state)

    return {
      allowed: true,
      resetTime: state.minuteWindowStart + minuteMs,
    }
  }

  getRetryAfter(userId: string): number {
    const now = Date.now()
    const states = Array.from(usage.entries()).filter(([key]) => key.endsWith(`:${userId}`))

    if (states.length === 0) {
      return 60
    }

    const nextReset = Math.min(...states.map(([, state]) => state.minuteWindowStart + 60_000))
    return Math.max(1, Math.ceil((nextReset - now) / 1000))
  }

  getHeaders(userId: string, tier: SearchTier): Record<string, string> {
    const key = `${tier}:${userId}`
    const now = Date.now()
    const state = usage.get(key)
    const limits = CONFIG[tier]

    if (!state) {
      return {
        'X-RateLimit-Limit-Minute': String(limits.perMinute),
        'X-RateLimit-Remaining-Minute': String(limits.perMinute),
        'X-RateLimit-Limit-Day': String(limits.perDay),
        'X-RateLimit-Remaining-Day': String(limits.perDay),
      }
    }

    return {
      'X-RateLimit-Limit-Minute': String(limits.perMinute),
      'X-RateLimit-Remaining-Minute': String(Math.max(0, limits.perMinute - state.minuteCount)),
      'X-RateLimit-Limit-Day': String(limits.perDay),
      'X-RateLimit-Remaining-Day': String(Math.max(0, limits.perDay - state.dayCount)),
      'X-RateLimit-Reset': String(Math.ceil((state.minuteWindowStart + 60_000 - now) / 1000)),
    }
  }
}

let globalLimiter: SearchRateLimiter | null = null

export function getRateLimiter(): SearchRateLimiter {
  if (!globalLimiter) {
    globalLimiter = new SearchRateLimiter()
  }
  return globalLimiter
}
