/**
 * Platform Adapter Service
 * Phase 2: Interface/Mock Implementation
 * 
 * Generates platform-specific content variants for:
 * - X (Twitter)
 * - LinkedIn
 * - Telegram
 * - Facebook
 */

import type { Platform, PlatformVariant, LocalizedContent, Language } from '../types'

export interface PlatformAdaptRequest {
  content: LocalizedContent
  platform: Platform
  language: Language
}

export interface PlatformAdaptResult {
  success: boolean
  variant: PlatformVariant
  error?: string
}

/**
 * Adapt content for a specific platform
 * Phase 2: Mock implementation
 */
export async function adaptForPlatform(
  request: PlatformAdaptRequest
): Promise<PlatformAdaptResult> {
  console.log('[PLATFORM_ADAPTER] Mock adaptation for:', request.platform)
  
  // Phase 2: Mock implementation
  const variant = createMockVariant(request)
  
  return {
    success: true,
    variant
  }
}

function createMockVariant(request: PlatformAdaptRequest): PlatformVariant {
  const { content, platform, language } = request
  
  // Platform-specific character limits and formatting
  const platformRules = getPlatformRules(platform)
  
  const variant: PlatformVariant = {
    platform,
    language,
    title: truncateText(content.title, platformRules.titleLimit),
    body: formatBodyForPlatform(content.content, platform, platformRules.bodyLimit),
    media: [],
    metadata: createPlatformMetadata(platform),
    status: 'pending'
  }
  
  return variant
}

function getPlatformRules(platform: Platform): {
  titleLimit: number
  bodyLimit: number
  supportsMedia: boolean
  supportsHashtags: boolean
} {
  const rules = {
    x: { titleLimit: 280, bodyLimit: 280, supportsMedia: true, supportsHashtags: true },
    linkedin: { titleLimit: 200, bodyLimit: 3000, supportsMedia: true, supportsHashtags: true },
    telegram: { titleLimit: 256, bodyLimit: 4096, supportsMedia: true, supportsHashtags: false },
    facebook: { titleLimit: 250, bodyLimit: 63206, supportsMedia: true, supportsHashtags: true },
    discord: { titleLimit: 256, bodyLimit: 2000, supportsMedia: true, supportsHashtags: false },
    instagram: { titleLimit: 150, bodyLimit: 2200, supportsMedia: true, supportsHashtags: true },
    tiktok: { titleLimit: 100, bodyLimit: 2200, supportsMedia: true, supportsHashtags: true }
  }
  
  return rules[platform]
}

function formatBodyForPlatform(content: string, platform: Platform, limit: number): string {
  let formatted = content
  
  // Platform-specific formatting
  switch (platform) {
    case 'x':
      // Twitter thread format
      formatted = `${truncateText(content, limit - 50)}\n\n🔗 Read full analysis →`
      break
    
    case 'linkedin':
      // Professional format with line breaks
      formatted = `${content}\n\n#Finance #Analysis #Markets`
      break
    
    case 'telegram':
      // Telegram format with emojis
      formatted = `📊 ${content}\n\n💡 SIA Intelligence`
      break
    
    case 'facebook':
      // Facebook format
      formatted = content
      break
    
    default:
      formatted = truncateText(content, limit)
  }
  
  return formatted
}

function createPlatformMetadata(platform: Platform): any {
  // Phase 2: Mock metadata
  switch (platform) {
    case 'x':
      return { platform: 'x', threadLength: 1 }
    
    case 'linkedin':
      return { platform: 'linkedin', visibility: 'public', articleFormat: false }
    
    case 'telegram':
      return { platform: 'telegram', channelId: 'mock_channel', pinMessage: false, disableNotification: false }
    
    case 'facebook':
      return { platform: 'facebook', pageId: 'mock_page', targetAudience: [] }
    
    default:
      return { platform }
  }
}

function truncateText(text: string, limit: number): string {
  if (text.length <= limit) return text
  return text.substring(0, limit - 3) + '...'
}

/**
 * Validate platform variant before publishing
 */
export function validatePlatformVariant(variant: PlatformVariant): {
  valid: boolean
  issues: string[]
} {
  const issues: string[] = []
  const rules = getPlatformRules(variant.platform)
  
  if (variant.title.length > rules.titleLimit) {
    issues.push(`Title exceeds ${rules.titleLimit} characters`)
  }
  
  if (variant.body.length > rules.bodyLimit) {
    issues.push(`Body exceeds ${rules.bodyLimit} characters`)
  }
  
  if (!variant.title || variant.title.trim().length === 0) {
    issues.push('Title is required')
  }
  
  if (!variant.body || variant.body.trim().length === 0) {
    issues.push('Body is required')
  }
  
  return {
    valid: issues.length === 0,
    issues
  }
}

/**
 * Get platform-specific publishing requirements
 */
export function getPlatformRequirements(platform: Platform): {
  requiresAuth: boolean
  requiresMedia: boolean
  supportedMediaTypes: string[]
  rateLimit: { requests: number; period: string }
} {
  const requirements = {
    x: {
      requiresAuth: true,
      requiresMedia: false,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
      rateLimit: { requests: 300, period: '15min' }
    },
    linkedin: {
      requiresAuth: true,
      requiresMedia: false,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      rateLimit: { requests: 100, period: 'day' }
    },
    telegram: {
      requiresAuth: true,
      requiresMedia: false,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4', 'application/pdf'],
      rateLimit: { requests: 30, period: 'second' }
    },
    facebook: {
      requiresAuth: true,
      requiresMedia: false,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'video/mp4'],
      rateLimit: { requests: 200, period: 'hour' }
    },
    discord: {
      requiresAuth: true,
      requiresMedia: false,
      supportedMediaTypes: ['image/jpeg', 'image/png', 'image/gif'],
      rateLimit: { requests: 50, period: 'second' }
    },
    instagram: {
      requiresAuth: true,
      requiresMedia: true,
      supportedMediaTypes: ['image/jpeg', 'image/png'],
      rateLimit: { requests: 200, period: 'hour' }
    },
    tiktok: {
      requiresAuth: true,
      requiresMedia: true,
      supportedMediaTypes: ['video/mp4'],
      rateLimit: { requests: 100, period: 'day' }
    }
  }
  
  return requirements[platform]
}
