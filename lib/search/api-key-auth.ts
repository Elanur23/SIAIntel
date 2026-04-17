import type { SearchTier } from '@/lib/search/rate-limiter'

export interface ApiKeyValidationResult {
  valid: boolean
  userId: string
  tier: SearchTier
}

class ApiKeyAuth {
  async validateApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
    const standardKey = process.env.NEURAL_SEARCH_API_KEY
    const premiumKey = process.env.NEURAL_SEARCH_PREMIUM_API_KEY

    if (premiumKey && apiKey === premiumKey) {
      return { valid: true, userId: 'premium-user', tier: 'premium' }
    }

    if (standardKey && apiKey === standardKey) {
      return { valid: true, userId: 'standard-user', tier: 'standard' }
    }

    if (!standardKey && !premiumKey && process.env.NODE_ENV !== 'production' && apiKey.trim().length > 0) {
      return { valid: true, userId: 'dev-user', tier: 'standard' }
    }

    return { valid: false, userId: '', tier: 'standard' }
  }
}

let globalAuth: ApiKeyAuth | null = null

export function getApiKeyAuth(): ApiKeyAuth {
  if (!globalAuth) {
    globalAuth = new ApiKeyAuth()
  }
  return globalAuth
}
