export const ARTICLE_LANGS = ['tr', 'en', 'de', 'es', 'fr', 'ru', 'ar', 'jp', 'zh'] as const

export type ArticleLanguage = typeof ARTICLE_LANGS[number]

export type LocalizedArticleField = 'title' | 'summary' | 'content' | 'siaInsight' | 'riskShield' | 'socialSnippet'

export const ARTICLE_LANGUAGE_SUFFIX: Record<ArticleLanguage, string> = {
  tr: 'Tr',
  en: 'En',
  de: 'De',
  es: 'Es',
  fr: 'Fr',
  ru: 'Ru',
  ar: 'Ar',
  jp: 'Jp',
  zh: 'Zh',
}

export const ARTICLE_LANGUAGE_LABELS: Record<ArticleLanguage, string> = {
  tr: 'Turkish',
  en: 'English',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  ru: 'Russian',
  ar: 'Arabic',
  jp: 'Japanese',
  zh: 'Chinese',
}

export const ARTICLE_LANGUAGE_LOCALES: Record<ArticleLanguage, string> = {
  tr: 'tr-TR',
  en: 'en-US',
  de: 'de-DE',
  es: 'es-ES',
  fr: 'fr-FR',
  ru: 'ru-RU',
  ar: 'ar-SA',
  jp: 'ja-JP',
  zh: 'zh-CN',
}

const FALLBACK_LANGS: ArticleLanguage[] = ['en', 'tr']

export function normalizeArticleLanguage(lang?: string): ArticleLanguage {
  const normalized = (lang || 'en').toLowerCase()
  return (ARTICLE_LANGS as readonly string[]).includes(normalized) ? (normalized as ArticleLanguage) : 'en'
}

export function getArticleFieldKey(field: LocalizedArticleField, lang: string): string {
  const normalized = normalizeArticleLanguage(lang)
  return `${field}${ARTICLE_LANGUAGE_SUFFIX[normalized]}`
}

function getRawArticleValue(article: Record<string, any> | null | undefined, field: LocalizedArticleField, lang: string): string {
  if (!article) return ''
  const value = article[getArticleFieldKey(field, lang)]
  return typeof value === 'string' ? value.trim() : ''
}

export function getRequestLocalizedValue(data: Record<string, any> | null | undefined, field: LocalizedArticleField, lang: string): string | undefined {
  if (!data) return undefined

  const normalized = normalizeArticleLanguage(lang)
  const nestedValue = data[field]?.[normalized]
  if (typeof nestedValue === 'string' && nestedValue.trim()) return nestedValue.trim()

  const flatValue = data[getArticleFieldKey(field, normalized)]
  if (typeof flatValue === 'string' && flatValue.trim()) return flatValue.trim()

  return undefined
}

export function getLocalizedArticleValue(article: Record<string, any> | null | undefined, field: LocalizedArticleField, lang: string, fallbacks: ArticleLanguage[] = FALLBACK_LANGS): string {
  const normalized = normalizeArticleLanguage(lang)
  const languages = [normalized, ...fallbacks, ...ARTICLE_LANGS]
  const seen = new Set<string>()

  for (const candidate of languages) {
    if (seen.has(candidate)) continue
    seen.add(candidate)
    const value = getRawArticleValue(article, field, candidate)
    if (value) return value
  }

  return ''
}

export function getFirstAvailableArticleValue(article: Record<string, any> | null | undefined, field: LocalizedArticleField, preferred: ArticleLanguage[] = ['tr', 'en', 'de', 'es', 'fr', 'ru', 'ar', 'jp', 'zh']): string {
  return getLocalizedArticleValue(article, field, preferred[0], preferred.slice(1))
}

export function hasDirectArticleValue(article: Record<string, any> | null | undefined, field: LocalizedArticleField, lang: string): boolean {
  return Boolean(getRawArticleValue(article, field, lang))
}

export function getAvailableArticleLanguages(article: Record<string, any> | null | undefined, fields: LocalizedArticleField[] = ['title', 'content']): ArticleLanguage[] {
  return ARTICLE_LANGS.filter((lang) => fields.every((field) => hasDirectArticleValue(article, field, lang)))
}