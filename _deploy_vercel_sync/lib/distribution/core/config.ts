/**
 * SIA DISTRIBUTION OS - CONFIGURATION
 * Phase 1: Feature flags and configuration management
 */

export const DISTRIBUTION_CONFIG = {
  // Feature flags (all disabled by default)
  enabled: process.env.DISTRIBUTION_ENABLED === 'true',
  
  // Platform configuration
  platforms: {
    x: process.env.DISTRIBUTION_PLATFORMS?.includes('x') ?? false,
    linkedin: process.env.DISTRIBUTION_PLATFORMS?.includes('linkedin') ?? false,
    telegram: process.env.DISTRIBUTION_PLATFORMS?.includes('telegram') ?? false,
    facebook: process.env.DISTRIBUTION_PLATFORMS?.includes('facebook') ?? false,
    discord: false, // Phase 2
    instagram: false, // Phase 2
    tiktok: false, // Phase 2
  },
  
  // Workflow configuration
  autoPublish: process.env.DISTRIBUTION_AUTO_PUBLISH === 'true',
  reviewRequired: process.env.DISTRIBUTION_REVIEW_REQUIRED !== 'false', // Default true
  
  // Safety limits
  maxJobsPerDay: 100,
  maxVariantsPerJob: 50,
  
  // API keys (not used in Phase 1)
  apiKeys: {
    twitter: process.env.TWITTER_API_KEY || '',
    linkedin: process.env.LINKEDIN_CLIENT_ID || '',
    telegram: process.env.TELEGRAM_BOT_TOKEN || '',
  },
} as const

export function isDistributionEnabled(): boolean {
  return DISTRIBUTION_CONFIG.enabled
}

export function isPlatformEnabled(platform: string): boolean {
  return DISTRIBUTION_CONFIG.platforms[platform as keyof typeof DISTRIBUTION_CONFIG.platforms] ?? false
}

export function requiresReview(): boolean {
  return DISTRIBUTION_CONFIG.reviewRequired
}
