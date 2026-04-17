/**
 * SIA DISTRIBUTION OS - VALIDATORS
 * Phase 1: Input validation utilities
 */

import { SUPPORTED_PLATFORMS, SUPPORTED_LANGUAGES, PLATFORM_CHARACTER_LIMITS } from '../core/constants'
import type { Platform, DistributionLanguage } from '../core/types'

export function isValidPlatform(platform: string): platform is Platform {
  return SUPPORTED_PLATFORMS.includes(platform as Platform)
}

export function isValidLanguage(language: string): language is DistributionLanguage {
  return SUPPORTED_LANGUAGES.includes(language as DistributionLanguage)
}

export function validateContentLength(content: string, platform: Platform): { valid: boolean; error?: string } {
  const limit = PLATFORM_CHARACTER_LIMITS[platform]
  const length = content.length

  if (length === 0) {
    return { valid: false, error: 'Content cannot be empty' }
  }

  if (length > limit) {
    return { valid: false, error: `Content exceeds ${platform} limit of ${limit} characters (current: ${length})` }
  }

  return { valid: true }
}

export function validateJobData(data: {
  articleId: string
  platforms: string[]
  languages: string[]
}): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data.articleId || data.articleId.trim() === '') {
    errors.push('Article ID is required')
  }

  if (!data.platforms || data.platforms.length === 0) {
    errors.push('At least one platform must be selected')
  } else {
    const invalidPlatforms = data.platforms.filter(p => !isValidPlatform(p))
    if (invalidPlatforms.length > 0) {
      errors.push(`Invalid platforms: ${invalidPlatforms.join(', ')}`)
    }
  }

  if (!data.languages || data.languages.length === 0) {
    errors.push('At least one language must be selected')
  } else {
    const invalidLanguages = data.languages.filter(l => !isValidLanguage(l))
    if (invalidLanguages.length > 0) {
      errors.push(`Invalid languages: ${invalidLanguages.join(', ')}`)
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
