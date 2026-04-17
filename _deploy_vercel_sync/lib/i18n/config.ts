/**
 * i18n Configuration
 * Multi-language support for the news portal
 */

export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'es'],
} as const

export type Locale = (typeof i18n)['locales'][number]

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
}

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
}

export function getLocaleFromPathname(pathname: string): Locale {
  const segments = pathname.split('/')
  const potentialLocale = segments[1]
  
  if (i18n.locales.includes(potentialLocale as Locale)) {
    return potentialLocale as Locale
  }
  
  return i18n.defaultLocale
}

export function removeLocaleFromPathname(pathname: string): string {
  const segments = pathname.split('/')
  const potentialLocale = segments[1]
  
  if (i18n.locales.includes(potentialLocale as Locale)) {
    return '/' + segments.slice(2).join('/')
  }
  
  return pathname
}

export function addLocaleToPathname(pathname: string, locale: Locale): string {
  if (locale === i18n.defaultLocale) {
    return pathname
  }
  
  const cleanPath = removeLocaleFromPathname(pathname)
  return `/${locale}${cleanPath}`
}
