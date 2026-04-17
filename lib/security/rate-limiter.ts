export interface TokenBucketConfig {
  maxTokens: number
  refillRate: number
  windowMs: number
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
  reason?: string
}

export const RATE_LIMIT_TIERS = {
  STRICT: { maxTokens: 10, refillRate: 10 / 60, windowMs: 60_000 },
  STANDARD: { maxTokens: 30, refillRate: 30 / 60, windowMs: 60_000 },
  GENEROUS: { maxTokens: 60, refillRate: 60 / 60, windowMs: 60_000 },
} as const

interface BucketState {
  tokens: number
  lastRefillAt: number
  resetTime: number
}

const buckets = new Map<string, BucketState>()

function resolveConfig(configOrTier?: TokenBucketConfig | (typeof RATE_LIMIT_TIERS)[keyof typeof RATE_LIMIT_TIERS]): TokenBucketConfig {
  if (!configOrTier) {
    return RATE_LIMIT_TIERS.STANDARD
  }

  return {
    maxTokens: configOrTier.maxTokens,
    refillRate: configOrTier.refillRate,
    windowMs: configOrTier.windowMs,
  }
}

function refill(bucket: BucketState, config: TokenBucketConfig, now: number): void {
  if (now <= bucket.lastRefillAt) {
    return
  }

  const elapsedSeconds = (now - bucket.lastRefillAt) / 1000
  const refillAmount = elapsedSeconds * config.refillRate
  bucket.tokens = Math.min(config.maxTokens, bucket.tokens + refillAmount)
  bucket.lastRefillAt = now
  bucket.resetTime = now + config.windowMs
}

export function checkRateLimit(
  identifier: string,
  configOrTier?: TokenBucketConfig | (typeof RATE_LIMIT_TIERS)[keyof typeof RATE_LIMIT_TIERS]
): RateLimitResult {
  const config = resolveConfig(configOrTier)
  const now = Date.now()

  const existing = buckets.get(identifier)
  const bucket: BucketState =
    existing ||
    {
      tokens: config.maxTokens,
      lastRefillAt: now,
      resetTime: now + config.windowMs,
    }

  refill(bucket, config, now)

  if (bucket.tokens < 1) {
    const retryAfter = Math.max(1, Math.ceil((1 - bucket.tokens) / config.refillRate))
    buckets.set(identifier, bucket)
    return {
      allowed: false,
      remaining: 0,
      resetTime: bucket.resetTime,
      retryAfter,
      reason: 'Rate limit exceeded',
    }
  }

  bucket.tokens -= 1
  buckets.set(identifier, bucket)

  return {
    allowed: true,
    remaining: Math.floor(bucket.tokens),
    resetTime: bucket.resetTime,
  }
}

export function resetRateLimit(identifier: string): void {
  buckets.delete(identifier)
}
