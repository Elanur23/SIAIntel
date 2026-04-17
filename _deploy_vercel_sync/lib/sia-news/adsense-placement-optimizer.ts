/**
 * SIA AdSense Placement Optimizer
 * 
 * Intelligently places ad units at psychological "hot spots" in content
 * to maximize CPC/CPM based on regional tiers and investor psychology.
 * 
 * Strategy:
 * - Contextual Sync: Ads placed after SIA_INSIGHT and DYNAMIC_RISK_SHIELD
 * - Regional CPC Tiers: High-value keywords for premium regions
 * - Native Styling: Ads blend naturally with content
 * - Financial Disclosure: Transparent ad labeling
 */

import type { GeneratedArticle, Language, Region } from './types'

// ============================================================================
// TYPES
// ============================================================================

export type AdSlotPosition = 
  | 'IN_FEED_TOP'           // After headline, before content
  | 'POST_SIA_INSIGHT'      // After SIA_INSIGHT (highest engagement)
  | 'POST_RISK_DISCLAIMER'  // After DYNAMIC_RISK_SHIELD (decision point)
  | 'MID_CONTENT'           // Middle of article
  | 'ARTICLE_END'           // End of article (retargeting)
  | 'SIDEBAR_TOP'           // Sidebar top (desktop)
  | 'SIDEBAR_STICKY'        // Sticky sidebar (desktop)

export type AdFormat = 
  | 'DISPLAY_RESPONSIVE'    // Responsive display ad
  | 'IN_ARTICLE'            // Native in-article ad
  | 'MULTIPLEX'             // Related content ads
  | 'IN_FEED'               // Native in-feed ad
  | 'MATCHED_CONTENT'       // Matched content recommendations

export type CPCTier = 'PREMIUM' | 'HIGH' | 'MEDIUM' | 'STANDARD'

export interface AdPlacement {
  slotId: string
  position: AdSlotPosition
  format: AdFormat
  cpcTier: CPCTier
  anchorTags: string[]
  nativeStyle: boolean
  financialDisclosure: string
  estimatedCPC: number
  priority: number
}

export interface AdPlacementStrategy {
  articleId: string
  language: Language
  region: Region
  placements: AdPlacement[]
  totalSlots: number
  estimatedRevenue: {
    perView: number
    per1000Views: number
    monthly: number
  }
  optimizationHints: string[]
}

// ============================================================================
// REGIONAL CPC TIERS
// ============================================================================

/**
 * Regional CPC benchmarks for financial content (in USD)
 * Based on Google AdSense financial niche averages
 */
const REGIONAL_CPC_BENCHMARKS: Record<Region, {
  tier: CPCTier
  avgCPC: number
  avgCPM: number
  topKeywords: string[]
}> = {
  US: {
    tier: 'PREMIUM',
    avgCPC: 3.50,
    avgCPM: 42.00,
    topKeywords: [
      'Asset Management',
      'Investment Strategy',
      'Portfolio Diversification',
      'Hedge Fund',
      'Institutional Finance',
      'Wealth Management',
      'Financial Advisory',
      'Market Analysis'
    ]
  },
  AE: {
    tier: 'PREMIUM',
    avgCPC: 2.80,
    avgCPM: 33.75,
    topKeywords: [
      'VARA Compliance',
      'Virtual Assets',
      'Dubai Finance',
      'Islamic Finance',
      'Crypto Regulation',
      'DIFC Investment',
      'Gulf Markets',
      'Sovereign Wealth'
    ]
  },
  DE: {
    tier: 'HIGH',
    avgCPC: 2.10,
    avgCPM: 25.30,
    topKeywords: [
      'BaFin Regulierung',
      'Vermögensverwaltung',
      'Finanzmarkt',
      'Investmentfonds',
      'Kapitalanlage',
      'Börsenanalyse',
      'Finanzberatung',
      'Marktregulierung'
    ]
  },
  FR: {
    tier: 'HIGH',
    avgCPC: 1.75,
    avgCPM: 20.90,
    topKeywords: [
      'AMF Régulation',
      'Gestion d\'Actifs',
      'Marchés Financiers',
      'Investissement',
      'Analyse Financière',
      'Conseil Financier',
      'Bourse',
      'Finance Institutionnelle'
    ]
  },
  ES: {
    tier: 'MEDIUM',
    avgCPC: 1.40,
    avgCPM: 17.00,
    topKeywords: [
      'CNMV Regulación',
      'Gestión de Activos',
      'Mercados Financieros',
      'Inversión',
      'Análisis Financiero',
      'Asesoría Financiera',
      'Bolsa',
      'Finanzas'
    ]
  },
  RU: {
    tier: 'MEDIUM',
    avgCPC: 0.75,
    avgCPM: 9.00,
    topKeywords: [
      'ЦБ РФ Регулирование',
      'Управление Активами',
      'Финансовые Рынки',
      'Инвестиции',
      'Финансовый Анализ',
      'Биржа',
      'Криптовалюты',
      'Финансы'
    ]
  },
  TR: {
    tier: 'STANDARD',
    avgCPC: 0.50,
    avgCPM: 6.00,
    topKeywords: [
      'TCMB Düzenleme',
      'Varlık Yönetimi',
      'Finansal Piyasalar',
      'Yatırım',
      'Finansal Analiz',
      'Borsa',
      'Kripto Para',
      'Finans'
    ]
  },
  JP: {
    tier: 'PREMIUM',
    avgCPC: 2.40,
    avgCPM: 28.00,
    topKeywords: [
      '資産運用',
      '投資戦略',
      '日経225',
      '金融市場',
      'BOJ',
      'ヘッジファンド',
      'ポートフォリオ',
      'マーケット分析'
    ]
  },
  CN: {
    tier: 'HIGH',
    avgCPC: 1.90,
    avgCPM: 22.00,
    topKeywords: [
      '资产管理',
      '投资策略',
      'A股',
      '金融市场',
      '央行',
      '港股',
      '财富管理',
      '市场分析'
    ]
  }
}

// ============================================================================
// AD PLACEMENT GENERATION
// ============================================================================

/**
 * Generate optimal ad placement strategy for article
 * 
 * @param article - Generated article
 * @returns Ad placement strategy
 */
export function generateAdPlacementStrategy(article: GeneratedArticle): AdPlacementStrategy {
  const regionalData = REGIONAL_CPC_BENCHMARKS[article.region]
  const placements: AdPlacement[] = []
  
  // Slot 1: Post SIA_INSIGHT (Highest Engagement Point)
  placements.push({
    slotId: 'sia-insight-ad',
    position: 'POST_SIA_INSIGHT',
    format: 'IN_ARTICLE',
    cpcTier: regionalData.tier,
    anchorTags: regionalData.topKeywords.slice(0, 3),
    nativeStyle: true,
    financialDisclosure: getFinancialDisclosure(article.language),
    estimatedCPC: regionalData.avgCPC * 1.2, // 20% premium for hot spot
    priority: 1
  })
  
  // Slot 2: Post Risk Disclaimer (Decision Point)
  placements.push({
    slotId: 'risk-disclaimer-ad',
    position: 'POST_RISK_DISCLAIMER',
    format: 'DISPLAY_RESPONSIVE',
    cpcTier: regionalData.tier,
    anchorTags: regionalData.topKeywords.slice(3, 6),
    nativeStyle: true,
    financialDisclosure: getFinancialDisclosure(article.language),
    estimatedCPC: regionalData.avgCPC * 1.1, // 10% premium
    priority: 2
  })
  
  // Slot 3: Article End (Retargeting)
  placements.push({
    slotId: 'article-end-ad',
    position: 'ARTICLE_END',
    format: 'MULTIPLEX',
    cpcTier: regionalData.tier,
    anchorTags: regionalData.topKeywords.slice(6, 8),
    nativeStyle: false,
    financialDisclosure: getFinancialDisclosure(article.language),
    estimatedCPC: regionalData.avgCPC * 0.9, // Standard rate
    priority: 3
  })
  
  // Slot 4: Sidebar (Desktop Only)
  if ((article.metadata?.wordCount ?? 0) > 500) {
    placements.push({
      slotId: 'sidebar-sticky-ad',
      position: 'SIDEBAR_STICKY',
      format: 'DISPLAY_RESPONSIVE',
      cpcTier: regionalData.tier,
      anchorTags: regionalData.topKeywords.slice(0, 2),
      nativeStyle: false,
      financialDisclosure: getFinancialDisclosure(article.language),
      estimatedCPC: regionalData.avgCPC,
      priority: 4
    })
  }
  
  // Calculate estimated revenue
  const avgCPCWeighted = placements.reduce((sum, p) => sum + p.estimatedCPC, 0) / placements.length
  const clickThroughRate = 0.02 // 2% CTR (conservative)
  const viewability = 0.70 // 70% viewability
  
  const revenuePerView = avgCPCWeighted * clickThroughRate * viewability
  const revenuePer1000Views = revenuePerView * 1000
  const monthlyViews = 2500 // Conservative estimate per article
  const monthlyRevenue = revenuePerView * monthlyViews
  
  // Generate optimization hints
  const optimizationHints = generateOptimizationHints(article, regionalData)
  
  return {
    articleId: article.id,
    language: article.language,
    region: article.region,
    placements,
    totalSlots: placements.length,
    estimatedRevenue: {
      perView: parseFloat(revenuePerView.toFixed(4)),
      per1000Views: parseFloat(revenuePer1000Views.toFixed(2)),
      monthly: parseFloat(monthlyRevenue.toFixed(2))
    },
    optimizationHints
  }
}

// ============================================================================
// FINANCIAL DISCLOSURE
// ============================================================================

/**
 * Get financial disclosure text in appropriate language
 * 
 * @param language - Article language
 * @returns Disclosure text
 */
function getFinancialDisclosure(language: Language): string {
  const disclosures: Record<Language, string> = {
    en: 'Advertisement - This content is supported by advertising',
    tr: 'Reklam - Bu içerik reklamlarla desteklenmektedir',
    de: 'Werbung - Dieser Inhalt wird durch Werbung unterstützt',
    fr: 'Publicité - Ce contenu est soutenu par la publicité',
    es: 'Publicidad - Este contenido está respaldado por publicidad',
    ru: 'Реклама - Этот контент поддерживается рекламой',
    ar: 'إعلان - هذا المحتوى مدعوم بالإعلانات',
    jp: '広告 - このコンテンツは広告によりサポートされています',
    zh: '广告 - 本内容由广告支持'
  }
  
  return disclosures[language]
}

// ============================================================================
// OPTIMIZATION HINTS
// ============================================================================

/**
 * Generate optimization hints based on article and regional data
 * 
 * @param article - Generated article
 * @param regionalData - Regional CPC data
 * @returns Array of optimization hints
 */
function generateOptimizationHints(
  article: GeneratedArticle,
  regionalData: typeof REGIONAL_CPC_BENCHMARKS[Region]
): string[] {
  const hints: string[] = []
  
  // E-E-A-T score hint
  if (article.eeatScore >= 85) {
    hints.push(`High E-E-A-T score (${article.eeatScore}/100) attracts premium advertisers`)
  }
  
  // Regional keyword hint
  const hasRegionalKeywords = regionalData.topKeywords.some(keyword =>
    article.fullContent.toLowerCase().includes(keyword.toLowerCase())
  )
  
  if (hasRegionalKeywords) {
    hints.push(`Content includes high-CPC keywords for ${article.region} region`)
  } else {
    hints.push(`Consider adding regional keywords: ${regionalData.topKeywords.slice(0, 3).join(', ')}`)
  }
  
  // Technical depth hint
  if (article.technicalDepth === 'HIGH') {
    hints.push('High technical depth attracts sophisticated investors (higher CPC)')
  }
  
  // Word count hint
  if ((article.metadata?.wordCount ?? 0) < 500) {
    hints.push('Consider expanding content to 500+ words for additional ad slots')
  }
  
  // Sentiment hint
  if (article.sentiment.overall > 50) {
    hints.push('Positive sentiment may attract bullish investment ads')
  } else if (article.sentiment.overall < -50) {
    hints.push('Bearish sentiment may attract hedging/protection ads')
  }
  
  return hints
}

// ============================================================================
// AD UNIT HTML GENERATION
// ============================================================================

/**
 * Generate AdSense ad unit HTML for placement
 * 
 * @param placement - Ad placement configuration
 * @param adSenseId - Google AdSense publisher ID
 * @returns HTML string for ad unit
 */
export function generateAdUnitHTML(placement: AdPlacement, adSenseId: string): string {
  const slotId = `${placement.slotId}-${Date.now()}`
  
  // Native styling classes
  const nativeClasses = placement.nativeStyle
    ? 'sia-native-ad border-t border-b border-gray-200 py-4 my-6'
    : 'sia-display-ad my-6'
  
  return `
<!-- ${placement.financialDisclosure} -->
<div class="${nativeClasses}" data-ad-slot="${placement.slotId}">
  ${placement.nativeStyle ? `<div class="text-xs text-gray-500 mb-2">${placement.financialDisclosure}</div>` : ''}
  <ins class="adsbygoogle"
       style="display:block"
       data-ad-client="${adSenseId}"
       data-ad-slot="${slotId}"
       data-ad-format="${getAdFormat(placement.format)}"
       data-full-width-responsive="true"
       data-ad-keywords="${placement.anchorTags.join(',')}"></ins>
  <script>
    (adsbygoogle = window.adsbygoogle || []).push({});
  </script>
</div>
`.trim()
}

/**
 * Get AdSense format string
 * 
 * @param format - Ad format type
 * @returns AdSense format string
 */
function getAdFormat(format: AdFormat): string {
  const formatMap: Record<AdFormat, string> = {
    DISPLAY_RESPONSIVE: 'auto',
    IN_ARTICLE: 'fluid',
    MULTIPLEX: 'autorelaxed',
    IN_FEED: 'fluid',
    MATCHED_CONTENT: 'autorelaxed'
  }
  
  return formatMap[format]
}

// ============================================================================
// CONTENT INJECTION
// ============================================================================

/**
 * Inject ad units into article content at optimal positions
 * 
 * @param article - Generated article
 * @param strategy - Ad placement strategy
 * @param adSenseId - Google AdSense publisher ID
 * @returns Article content with injected ads
 */
export function injectAdUnits(
  article: GeneratedArticle,
  strategy: AdPlacementStrategy,
  adSenseId: string
): string {
  let content = article.fullContent
  
  // Find injection points
  const siaInsightEnd = content.indexOf(article.siaInsight) + article.siaInsight.length
  const riskDisclaimerEnd = content.indexOf(article.riskDisclaimer) + article.riskDisclaimer.length
  
  // Sort placements by priority
  const sortedPlacements = [...strategy.placements].sort((a, b) => a.priority - b.priority)
  
  // Inject ads (in reverse order to maintain positions)
  for (const placement of sortedPlacements.reverse()) {
    const adHTML = generateAdUnitHTML(placement, adSenseId)
    
    switch (placement.position) {
      case 'POST_SIA_INSIGHT':
        if (siaInsightEnd > 0) {
          content = content.slice(0, siaInsightEnd) + '\n\n' + adHTML + '\n\n' + content.slice(siaInsightEnd)
        }
        break
        
      case 'POST_RISK_DISCLAIMER':
        if (riskDisclaimerEnd > 0) {
          content = content.slice(0, riskDisclaimerEnd) + '\n\n' + adHTML + '\n\n' + content.slice(riskDisclaimerEnd)
        }
        break
        
      case 'ARTICLE_END':
        content = content + '\n\n' + adHTML
        break
        
      case 'MID_CONTENT':
        const midPoint = Math.floor(content.length / 2)
        content = content.slice(0, midPoint) + '\n\n' + adHTML + '\n\n' + content.slice(midPoint)
        break
    }
  }
  
  return content
}

// ============================================================================
// REVENUE ANALYTICS
// ============================================================================

/**
 * Calculate potential revenue for article based on placement strategy
 * 
 * @param strategy - Ad placement strategy
 * @param expectedViews - Expected monthly views
 * @returns Revenue projection
 */
export function calculateRevenueProjection(
  strategy: AdPlacementStrategy,
  expectedViews: number = 2500
): {
  daily: number
  weekly: number
  monthly: number
  yearly: number
  breakdown: Array<{ slot: string; revenue: number }>
} {
  const dailyViews = expectedViews / 30
  const weeklyViews = expectedViews / 4
  const yearlyViews = expectedViews * 12
  
  const revenuePerView = strategy.estimatedRevenue.perView
  
  // Calculate breakdown by slot
  const breakdown = strategy.placements.map(placement => ({
    slot: placement.slotId,
    revenue: parseFloat((placement.estimatedCPC * 0.02 * 0.70 * expectedViews).toFixed(2))
  }))
  
  return {
    daily: parseFloat((revenuePerView * dailyViews).toFixed(2)),
    weekly: parseFloat((revenuePerView * weeklyViews).toFixed(2)),
    monthly: parseFloat((revenuePerView * expectedViews).toFixed(2)),
    yearly: parseFloat((revenuePerView * yearlyViews).toFixed(2)),
    breakdown
  }
}

// ============================================================================
// A/B TESTING SUPPORT
// ============================================================================

/**
 * Generate alternative placement strategy for A/B testing
 * 
 * @param article - Generated article
 * @param variant - Variant identifier ('A' or 'B')
 * @returns Alternative ad placement strategy
 */
export function generateABTestVariant(
  article: GeneratedArticle,
  variant: 'A' | 'B'
): AdPlacementStrategy {
  const baseStrategy = generateAdPlacementStrategy(article)
  
  if (variant === 'B') {
    // Variant B: More aggressive placement
    const regionalData = REGIONAL_CPC_BENCHMARKS[article.region]
    
    baseStrategy.placements.push({
      slotId: 'mid-content-ad',
      position: 'MID_CONTENT',
      format: 'IN_ARTICLE',
      cpcTier: regionalData.tier,
      anchorTags: regionalData.topKeywords.slice(0, 2),
      nativeStyle: true,
      financialDisclosure: getFinancialDisclosure(article.language),
      estimatedCPC: regionalData.avgCPC,
      priority: 5
    })
    
    baseStrategy.totalSlots = baseStrategy.placements.length
  }
  
  return baseStrategy
}

// ============================================================================
// COMPLIANCE VALIDATION
// ============================================================================

/**
 * Validate ad placement strategy for AdSense compliance
 * 
 * @param strategy - Ad placement strategy
 * @returns Validation result
 */
export function validateAdPlacementCompliance(strategy: AdPlacementStrategy): {
  compliant: boolean
  issues: string[]
  warnings: string[]
} {
  const issues: string[] = []
  const warnings: string[] = []
  
  // Check ad density (max 3 ads per 500 words)
  const maxAdsAllowed = Math.floor(strategy.placements.length / 500) * 3
  if (strategy.totalSlots > maxAdsAllowed) {
    issues.push(`Too many ad slots (${strategy.totalSlots}). Maximum allowed: ${maxAdsAllowed}`)
  }
  
  // Check for financial disclosure
  const missingDisclosure = strategy.placements.filter(p => !p.financialDisclosure)
  if (missingDisclosure.length > 0) {
    issues.push('Some ad placements missing financial disclosure')
  }
  
  // Check for native ad labeling
  const unlabeledNative = strategy.placements.filter(p => p.nativeStyle && !p.financialDisclosure)
  if (unlabeledNative.length > 0) {
    warnings.push('Native ads should have clear disclosure labels')
  }
  
  return {
    compliant: issues.length === 0,
    issues,
    warnings
  }
}
