/**
 * SIA DISTRIBUTION OS - CONSTANTS
 * Phase 1: Platform and language constants
 */

import type { Platform, DistributionLanguage } from './types'

export const SUPPORTED_PLATFORMS: Platform[] = [
  'x',
  'linkedin',
  'telegram',
  'facebook',
  // Phase 2: 'discord', 'instagram', 'tiktok'
]

export const SUPPORTED_LANGUAGES: DistributionLanguage[] = [
  'en',
  'tr',
  'de',
  'es',
  'fr',
  'ru',
  'ar',
  'jp',
  'zh',
]

export const PLATFORM_LABELS: Record<Platform, string> = {
  x: 'X (Twitter)',
  linkedin: 'LinkedIn',
  telegram: 'Telegram',
  facebook: 'Facebook',
  discord: 'Discord',
  instagram: 'Instagram',
  tiktok: 'TikTok',
}

export const LANGUAGE_LABELS: Record<DistributionLanguage, string> = {
  en: 'English',
  tr: 'Turkish',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  ru: 'Russian',
  ar: 'Arabic',
  jp: 'Japanese',
  zh: 'Chinese',
}

export const PLATFORM_CHARACTER_LIMITS: Record<Platform, number> = {
  x: 280,
  linkedin: 3000,
  telegram: 4096,
  facebook: 63206,
  discord: 2000,
  instagram: 2200,
  tiktok: 2200,
}

export const JOB_STATUS_LABELS = {
  draft: 'Draft',
  review: 'In Review',
  scheduled: 'Scheduled',
  published: 'Published',
  failed: 'Failed',
  cancelled: 'Cancelled',
} as const
