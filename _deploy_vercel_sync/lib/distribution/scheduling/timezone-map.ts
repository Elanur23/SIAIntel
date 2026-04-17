/**
 * Timezone Mapping
 * Phase 3A.6: Locale to timezone mapping for scheduling intelligence
 */

import type { Language } from '../types'

export interface TimezoneInfo {
  timezone: string
  utcOffset: number // in hours
  region: string
}

/**
 * Map each locale to its primary timezone
 */
export const TIMEZONE_MAP: Record<Language, TimezoneInfo> = {
  en: {
    timezone: 'America/New_York',
    utcOffset: -5, // EST (varies with DST)
    region: 'US'
  },
  tr: {
    timezone: 'Europe/Istanbul',
    utcOffset: 3, // TRT
    region: 'TR'
  },
  de: {
    timezone: 'Europe/Berlin',
    utcOffset: 1, // CET (varies with DST)
    region: 'DE'
  },
  fr: {
    timezone: 'Europe/Paris',
    utcOffset: 1, // CET (varies with DST)
    region: 'FR'
  },
  es: {
    timezone: 'Europe/Madrid',
    utcOffset: 1, // CET (varies with DST)
    region: 'ES'
  },
  ru: {
    timezone: 'Europe/Moscow',
    utcOffset: 3, // MSK
    region: 'RU'
  },
  ar: {
    timezone: 'Asia/Dubai',
    utcOffset: 4, // GST
    region: 'AE'
  },
  jp: {
    timezone: 'Asia/Tokyo',
    utcOffset: 9, // JST
    region: 'JP'
  },
  zh: {
    timezone: 'Asia/Shanghai',
    utcOffset: 8, // CST
    region: 'CN'
  }
}

/**
 * Get timezone info for a locale
 */
export function getTimezoneForLocale(locale: Language): TimezoneInfo {
  return TIMEZONE_MAP[locale]
}

/**
 * Convert UTC time to locale time
 */
export function convertToLocaleTime(utcDate: Date, locale: Language): Date {
  const timezoneInfo = getTimezoneForLocale(locale)
  const localeDate = new Date(utcDate)
  localeDate.setHours(localeDate.getHours() + timezoneInfo.utcOffset)
  return localeDate
}

/**
 * Get current time in locale timezone
 */
export function getCurrentLocaleTime(locale: Language): Date {
  return convertToLocaleTime(new Date(), locale)
}

/**
 * Format time for display with timezone
 */
export function formatLocaleTime(date: Date, locale: Language): string {
  const timezoneInfo = getTimezoneForLocale(locale)
  return `${date.toLocaleString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })} ${timezoneInfo.timezone.split('/')[1]}`
}
