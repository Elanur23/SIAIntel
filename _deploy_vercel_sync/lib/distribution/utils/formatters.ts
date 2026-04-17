/**
 * SIA DISTRIBUTION OS - FORMATTERS
 * Phase 1: Text formatting utilities
 */

import type { Platform } from '../core/types'

/**
 * Truncate text to fit platform character limits
 */
export function truncateForPlatform(text: string, platform: Platform, suffix = '...'): string {
  const limits: Record<Platform, number> = {
    x: 280,
    linkedin: 3000,
    telegram: 4096,
    facebook: 63206,
    discord: 2000,
    instagram: 2200,
    tiktok: 2200,
  }

  const limit = limits[platform]
  if (text.length <= limit) return text

  return text.substring(0, limit - suffix.length) + suffix
}

/**
 * Format date for display
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`

  return formatDate(date)
}

/**
 * Sanitize text for safe display
 */
export function sanitizeText(text: string): string {
  return text
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
