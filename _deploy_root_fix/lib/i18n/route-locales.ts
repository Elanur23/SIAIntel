export const PUBLIC_ROUTE_LOCALES = [
  'en',
  'tr',
  'de',
  'fr',
  'es',
  'ru',
  'ja',
  'zh',
  'pt-br',
] as const

export type PublicRouteLocale = (typeof PUBLIC_ROUTE_LOCALES)[number]

export const NON_PT_BR_ROUTE_LOCALES: ReadonlyArray<PublicRouteLocale> = PUBLIC_ROUTE_LOCALES.filter(
  (locale) => locale !== 'pt-br'
)

const PUBLIC_ROUTE_SET = new Set<string>(PUBLIC_ROUTE_LOCALES)
const LEGACY_ROUTE_SET = new Set<string>(['jp', 'ar', 'pt'])

const ROUTE_ALIASES: Record<string, PublicRouteLocale> = {
  jp: 'ja',
  ar: 'en',
  pt: 'pt-br',
}

export const HREFLANG_BY_ROUTE_LOCALE: Record<PublicRouteLocale, string> = {
  en: 'en',
  tr: 'tr',
  de: 'de',
  fr: 'fr',
  es: 'es',
  ru: 'ru',
  ja: 'ja',
  zh: 'zh',
  'pt-br': 'pt-BR',
}

export const OPENGRAPH_LOCALE_BY_ROUTE_LOCALE: Record<PublicRouteLocale, string> = {
  en: 'en_US',
  tr: 'tr_TR',
  de: 'de_DE',
  fr: 'fr_FR',
  es: 'es_ES',
  ru: 'ru_RU',
  ja: 'ja_JP',
  zh: 'zh_CN',
  'pt-br': 'pt_BR',
}

export const NEWS_LANGUAGE_BY_ROUTE_LOCALE: Record<PublicRouteLocale, string> = {
  en: 'en',
  tr: 'tr',
  de: 'de',
  fr: 'fr',
  es: 'es',
  ru: 'ru',
  ja: 'ja',
  zh: 'zh',
  'pt-br': 'pt',
}

export const PUBLIC_ROUTE_LANGUAGE_OPTIONS: ReadonlyArray<{
  code: PublicRouteLocale
  name: string
  flag: string
}> = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'pt-br', name: 'Português (Brasil)', flag: '🇧🇷' },
]

export function normalizePublicRouteLocale(lang?: string): PublicRouteLocale {
  const normalized = (lang || 'en').toLowerCase()
  if (PUBLIC_ROUTE_SET.has(normalized)) return normalized as PublicRouteLocale
  return ROUTE_ALIASES[normalized] ?? 'en'
}

export function isLocaleSegment(segment?: string): boolean {
  if (!segment) return false
  const normalized = segment.toLowerCase()
  return PUBLIC_ROUTE_SET.has(normalized) || LEGACY_ROUTE_SET.has(normalized)
}

export function toDictionaryLocale(routeLocale: string): string {
  const normalized = normalizePublicRouteLocale(routeLocale)
  if (normalized === 'ja') return 'jp'
  if (normalized === 'pt-br') return 'en'
  return normalized
}

export function toHtmlLang(routeLocale: string): string {
  const normalized = normalizePublicRouteLocale(routeLocale)
  return HREFLANG_BY_ROUTE_LOCALE[normalized]
}

export function toOpenGraphLocale(routeLocale: string): string {
  const normalized = normalizePublicRouteLocale(routeLocale)
  return OPENGRAPH_LOCALE_BY_ROUTE_LOCALE[normalized]
}

function normalizeSuffix(suffix = ''): string {
  const trimmed = suffix.trim()
  if (!trimmed) return ''
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`
}

function buildLocalizedUrl(baseUrl: string | undefined, locale: PublicRouteLocale, suffix: string): string {
  const normalizedSuffix = normalizeSuffix(suffix)
  if (!baseUrl) return `/${locale}${normalizedSuffix}`
  return `${baseUrl.replace(/\/+$/, '')}/${locale}${normalizedSuffix}`
}

export function buildLanguageAlternates(
  suffix = '',
  options: {
    baseUrl?: string
    includeXDefault?: boolean
    locales?: ReadonlyArray<PublicRouteLocale>
  } = {}
): Record<string, string> {
  const includeXDefault = options.includeXDefault ?? true
  const locales = options.locales ?? PUBLIC_ROUTE_LOCALES
  const result: Record<string, string> = {}

  if (includeXDefault) {
    result['x-default'] = buildLocalizedUrl(options.baseUrl, 'en', suffix)
  }

  for (const locale of locales) {
    result[HREFLANG_BY_ROUTE_LOCALE[locale]] = buildLocalizedUrl(options.baseUrl, locale, suffix)
  }

  return result
}
