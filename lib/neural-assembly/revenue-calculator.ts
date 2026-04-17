/**
 * REVENUE_INTELLIGENCE_LAYER
 * Financial Revenue Terminal Calculator
 * 
 * Calculates projected revenue based on CPM tables, language multipliers,
 * and article performance metrics for the Executive Analytics Dashboard.
 */

export type Language = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'jp' | 'zh'
export type AssetCategory = 'finance' | 'tech' | 'energy' | 'general'

/**
 * CPM_TABLE: Base CPM rates by asset category (in USD)
 * Finance/Sovereign: Premium institutional content
 * Tech/AI: High-value technology content
 * Energy/SMR: Energy sector content
 * General: Standard content
 */
export const CPM_TABLE: Record<AssetCategory, number> = {
  finance: 45.0,
  tech: 32.0,
  energy: 28.0,
  general: 18.0,
}

/**
 * LANG_MULTIPLIER: Revenue multipliers by language/region
 * High-value niches (AR/JP/ZH): 1.4x
 * Standard markets (EN/DE/FR): 1.0x
 * Emerging markets (TR/RU/ES): 0.8x
 */
export const LANG_MULTIPLIER: Record<Language, number> = {
  ar: 1.4, // Arabic - High-value Middle East market
  jp: 1.4, // Japanese - Premium Asian market
  zh: 1.4, // Chinese - High-value Asian market
  en: 1.0, // English - Standard global market
  de: 1.0, // German - Standard European market
  fr: 1.0, // French - Standard European market
  tr: 0.8, // Turkish - Emerging market
  ru: 0.8, // Russian - Emerging market
  es: 0.8, // Spanish - Emerging market
}

/**
 * Article Revenue Metrics
 */
export interface ArticleRevenueMetrics {
  articleId: string
  language: Language
  category: AssetCategory
  estimatedDailyViews: number
  estimatedMonthlyViews: number
  dailyRevenue: number
  monthlyRevenue: number
  cpm: number
  multiplier: number
}

/**
 * Global Revenue Metrics
 */
export interface GlobalRevenueMetrics {
  totalArticles: number
  totalDailyRevenue: number
  totalMonthlyRevenue: number
  projectedAnnualRevenue: number
  revenueByLanguage: Record<Language, number>
  revenueByCategory: Record<AssetCategory, number>
  topPerformingLanguages: Array<{ language: Language; revenue: number; percentage: number }>
  averageCPM: number
  trafficIntensity: Record<Language, number>
}

/**
 * Calculate revenue for a single article
 */
export function calculateArticleRevenue(
  language: Language,
  category: AssetCategory = 'general',
  estimatedDailyViews: number = 500,
  articleId?: string
): ArticleRevenueMetrics {
  const baseCPM = CPM_TABLE[category]
  const multiplier = LANG_MULTIPLIER[language]
  const effectiveCPM = baseCPM * multiplier

  // Revenue = (Views * CPM) / 1000
  const dailyRevenue = (estimatedDailyViews * effectiveCPM) / 1000
  const monthlyRevenue = dailyRevenue * 30
  const estimatedMonthlyViews = estimatedDailyViews * 30

  return {
    articleId: articleId || 'unknown',
    language,
    category,
    estimatedDailyViews,
    estimatedMonthlyViews,
    dailyRevenue,
    monthlyRevenue,
    cpm: effectiveCPM,
    multiplier,
  }
}

/**
 * Calculate global revenue metrics across all articles
 */
export function calculateGlobalRevenue(
  articles: Array<{
    language: Language
    category?: AssetCategory
    estimatedDailyViews?: number
    isLive?: boolean
  }>
): GlobalRevenueMetrics {
  // Filter only live articles
  const liveArticles = articles.filter((a) => a.isLive !== false)

  // Initialize accumulators
  const revenueByLanguage: Record<Language, number> = {
    en: 0,
    tr: 0,
    de: 0,
    fr: 0,
    es: 0,
    ru: 0,
    ar: 0,
    jp: 0,
    zh: 0,
  }

  const revenueByCategory: Record<AssetCategory, number> = {
    finance: 0,
    tech: 0,
    energy: 0,
    general: 0,
  }

  const trafficIntensity: Record<Language, number> = {
    en: 0,
    tr: 0,
    de: 0,
    fr: 0,
    es: 0,
    ru: 0,
    ar: 0,
    jp: 0,
    zh: 0,
  }

  let totalDailyRevenue = 0
  let totalCPM = 0

  // Calculate revenue for each article
  liveArticles.forEach((article) => {
    const metrics = calculateArticleRevenue(
      article.language,
      article.category || 'general',
      article.estimatedDailyViews || 500
    )

    totalDailyRevenue += metrics.dailyRevenue
    totalCPM += metrics.cpm
    revenueByLanguage[article.language] += metrics.monthlyRevenue
    revenueByCategory[metrics.category] += metrics.monthlyRevenue
    trafficIntensity[article.language] += 1
  })

  const totalMonthlyRevenue = totalDailyRevenue * 30
  const projectedAnnualRevenue = totalMonthlyRevenue * 12
  const averageCPM = liveArticles.length > 0 ? totalCPM / liveArticles.length : 0

  // Calculate traffic intensity percentage
  const totalArticleCount = liveArticles.length
  Object.keys(trafficIntensity).forEach((lang) => {
    trafficIntensity[lang as Language] =
      totalArticleCount > 0 ? (trafficIntensity[lang as Language] / totalArticleCount) * 100 : 0
  })

  // Sort languages by revenue
  const topPerformingLanguages = (Object.keys(revenueByLanguage) as Language[])
    .map((lang) => ({
      language: lang,
      revenue: revenueByLanguage[lang],
      percentage: totalMonthlyRevenue > 0 ? (revenueByLanguage[lang] / totalMonthlyRevenue) * 100 : 0,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  return {
    totalArticles: liveArticles.length,
    totalDailyRevenue,
    totalMonthlyRevenue,
    projectedAnnualRevenue,
    revenueByLanguage,
    revenueByCategory,
    topPerformingLanguages,
    averageCPM,
    trafficIntensity,
  }
}

/**
 * Format currency with proper locale
 */
export function formatCurrency(amount: number, locale: string = 'en-US'): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format large numbers with K/M/B suffixes
 */
export function formatCompactNumber(num: number): string {
  if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`
  }
  if (num >= 1_000_000) {
    return `$${(num / 1_000_000).toFixed(2)}M`
  }
  if (num >= 1_000) {
    return `$${(num / 1_000).toFixed(2)}K`
  }
  return `$${num.toFixed(2)}`
}

/**
 * Determine asset category from article content/tags
 */
export function detectAssetCategory(
  title: string,
  content?: string,
  tags?: string[]
): AssetCategory {
  const text = `${title} ${content || ''} ${tags?.join(' ') || ''}`.toLowerCase()

  // Finance/Sovereign keywords
  if (
    /bitcoin|ethereum|crypto|defi|institutional|sovereign|wealth|fund|asset|capital|treasury|reserve|central bank|fed|monetary/i.test(
      text
    )
  ) {
    return 'finance'
  }

  // Tech/AI keywords
  if (/ai|artificial intelligence|machine learning|neural|quantum|compute|gpu|cloud|saas|tech/i.test(text)) {
    return 'tech'
  }

  // Energy/SMR keywords
  if (/energy|nuclear|smr|renewable|solar|wind|power|grid|electricity|oil|gas/i.test(text)) {
    return 'energy'
  }

  return 'general'
}
