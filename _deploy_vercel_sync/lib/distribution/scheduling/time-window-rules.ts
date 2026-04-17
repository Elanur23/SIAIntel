/**
 * Time Window Rules
 * Phase 3A.6: Best time windows per platform and category
 */

import type { Platform } from '../types'

export type ContentCategory = 'economy' | 'finance' | 'ai' | 'crypto' | 'general'

export interface TimeWindow {
  startHour: number // 0-23
  endHour: number // 0-23
  weight: number // 0-100 (importance)
  reason: string
}

export interface PlatformRules {
  platform: Platform
  defaultWindows: TimeWindow[]
  categoryWindows: Partial<Record<ContentCategory, TimeWindow[]>>
  frequency: 'high' | 'medium' | 'low' // posting frequency
  breakingNewsBoost: boolean // boost for breaking news
}

/**
 * Platform-specific time window rules
 */
export const PLATFORM_RULES: Record<Platform, PlatformRules> = {
  x: {
    platform: 'x',
    defaultWindows: [
      { startHour: 8, endHour: 10, weight: 90, reason: 'Morning commute peak' },
      { startHour: 12, endHour: 14, weight: 85, reason: 'Lunch break engagement' },
      { startHour: 17, endHour: 20, weight: 95, reason: 'Evening peak activity' }
    ],
    categoryWindows: {
      crypto: [
        { startHour: 21, endHour: 23, weight: 90, reason: 'Crypto community active late' },
        { startHour: 6, endHour: 8, weight: 85, reason: 'Asian market open' }
      ],
      economy: [
        { startHour: 9, endHour: 11, weight: 95, reason: 'Market open hours' },
        { startHour: 14, endHour: 16, weight: 85, reason: 'Afternoon trading' }
      ]
    },
    frequency: 'high',
    breakingNewsBoost: true
  },
  
  linkedin: {
    platform: 'linkedin',
    defaultWindows: [
      { startHour: 7, endHour: 9, weight: 90, reason: 'Pre-work browsing' },
      { startHour: 12, endHour: 13, weight: 85, reason: 'Lunch break' },
      { startHour: 17, endHour: 18, weight: 80, reason: 'End of workday' }
    ],
    categoryWindows: {
      finance: [
        { startHour: 8, endHour: 10, weight: 95, reason: 'Business hours start' }
      ],
      ai: [
        { startHour: 9, endHour: 11, weight: 90, reason: 'Tech professional hours' }
      ]
    },
    frequency: 'medium',
    breakingNewsBoost: false
  },
  
  telegram: {
    platform: 'telegram',
    defaultWindows: [
      { startHour: 7, endHour: 9, weight: 90, reason: 'Morning check-in' },
      { startHour: 19, endHour: 22, weight: 95, reason: 'Evening engagement peak' }
    ],
    categoryWindows: {
      crypto: [
        { startHour: 20, endHour: 23, weight: 95, reason: 'Crypto community prime time' },
        { startHour: 6, endHour: 8, weight: 85, reason: 'Early traders' }
      ]
    },
    frequency: 'high',
    breakingNewsBoost: true
  },
  
  facebook: {
    platform: 'facebook',
    defaultWindows: [
      { startHour: 13, endHour: 16, weight: 85, reason: 'Afternoon browsing' },
      { startHour: 19, endHour: 21, weight: 90, reason: 'Evening leisure time' }
    ],
    categoryWindows: {},
    frequency: 'low',
    breakingNewsBoost: false
  },
  
  discord: {
    platform: 'discord',
    defaultWindows: [
      { startHour: 18, endHour: 23, weight: 95, reason: 'Community active evening' }
    ],
    categoryWindows: {
      crypto: [
        { startHour: 20, endHour: 24, weight: 95, reason: 'Crypto Discord peak' }
      ]
    },
    frequency: 'high',
    breakingNewsBoost: true
  },
  
  instagram: {
    platform: 'instagram',
    defaultWindows: [
      { startHour: 11, endHour: 13, weight: 85, reason: 'Lunch scroll' },
      { startHour: 19, endHour: 21, weight: 90, reason: 'Evening engagement' }
    ],
    categoryWindows: {},
    frequency: 'low',
    breakingNewsBoost: false
  },
  
  tiktok: {
    platform: 'tiktok',
    defaultWindows: [
      { startHour: 18, endHour: 22, weight: 95, reason: 'Peak viewing hours' }
    ],
    categoryWindows: {},
    frequency: 'medium',
    breakingNewsBoost: false
  }
}

/**
 * Get time windows for platform and category
 */
export function getTimeWindows(
  platform: Platform,
  category?: ContentCategory
): TimeWindow[] {
  const rules = PLATFORM_RULES[platform]
  
  if (category && rules.categoryWindows[category]) {
    return rules.categoryWindows[category]!
  }
  
  return rules.defaultWindows
}

/**
 * Check if hour is within any time window
 */
export function isInTimeWindow(hour: number, windows: TimeWindow[]): {
  inWindow: boolean
  window?: TimeWindow
} {
  for (const window of windows) {
    if (hour >= window.startHour && hour < window.endHour) {
      return { inWindow: true, window }
    }
  }
  return { inWindow: false }
}

/**
 * Get next optimal time window
 */
export function getNextTimeWindow(
  currentHour: number,
  windows: TimeWindow[]
): TimeWindow | null {
  // Sort windows by start hour
  const sortedWindows = [...windows].sort((a, b) => a.startHour - b.startHour)
  
  // Find next window after current hour
  for (const window of sortedWindows) {
    if (window.startHour > currentHour) {
      return window
    }
  }
  
  // If no window found, return first window (next day)
  return sortedWindows[0] || null
}
