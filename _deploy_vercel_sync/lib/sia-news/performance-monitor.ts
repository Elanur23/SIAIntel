/**
 * SIA Performance Monitor - Post-Publication Analytics
 * 
 * Analyzes the performance potential of published content across:
 * - E-E-A-T Score & Authority Metrics
 * - Regional CPC (Cost Per Mille) Estimates
 * - SEO Health & Indexability Factor
 * - Featured Snippet Probability
 * - Revenue Projection by Region
 */

import type { GeneratedArticle, Language, Region } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface PerformanceAnalysis {
  post_id: string
  authority_metrics: AuthorityMetrics
  revenue_projection: RevenueProjection
  seo_health: SEOHealth
  indexability_factor: IndexabilityFactor
  information_gain: InformationGainMetrics
  timestamp: string
}

export interface AuthorityMetrics {
  eeat: number // 0-100
  originality: number // 0-100
  technical_depth: 'HIGH' | 'MEDIUM' | 'LOW'
  data_source_count: number
  unique_insights: number
}

export interface RevenueProjection {
  top_region: Region
  estimated_ecpm: string // e.g., "$12.50"
  regional_breakdown: RegionalCPC[]
  total_potential_monthly: string
  confidence: number // 0-100
}

export interface RegionalCPC {
  region: Region
  language: Language
  estimated_cpc: number // Cost Per Click in USD
  estimated_cpm: number // Cost Per Mille (1000 impressions) in USD
  niche_multiplier: number // Financial niche premium (1.5x - 3.0x)
  projected_monthly_revenue: number
}

export interface SEOHealth {
  hreflang_check: 'Valid' | 'Missing' | 'Invalid'
  structured_data: 'JSON-LD_Injected' | 'Missing' | 'Invalid'
  meta_tags_complete: boolean
  canonical_url: string
  sitemap_included: boolean
  mobile_friendly: boolean
  page_speed_score: number // 0-100
}

export interface IndexabilityFactor {
  featured_snippet_probability: number // 0-100
  information_gain_score: number // 0-100
  keyword_density_optimal: boolean
  content_freshness: 'FRESH' | 'RECENT' | 'STALE'
  backlink_potential: 'HIGH' | 'MEDIUM' | 'LOW'
  social_share_potential: number // 0-100
}

export interface InformationGainMetrics {
  uniqueness_score: number // 0-100
  data_density: number // data points per 100 words
  competitor_gap: number // 0-100 (how much better than competitors)
  search_intent_match: number // 0-100
}

// ============================================================================
// REGIONAL CPC DATA (Financial Niche)
// ============================================================================

/**
 * Regional CPC estimates for financial/crypto content
 * Based on Google AdSense benchmarks for financial niche (2026)
 */
const REGIONAL_CPC_DATA: Record<Region, { baseCPC: number; baseCPM: number; nicheMultiplier: number }> = {
  US: { baseCPC: 2.50, baseCPM: 15.00, nicheMultiplier: 2.8 }, // Highest CPC
  AE: { baseCPC: 2.20, baseCPM: 13.50, nicheMultiplier: 2.5 }, // Dubai/UAE premium
  JP: { baseCPC: 2.00, baseCPM: 12.00, nicheMultiplier: 2.4 }, // Japan premium
  CN: { baseCPC: 1.70, baseCPM: 10.00, nicheMultiplier: 2.2 }, // China / Greater China
  DE: { baseCPC: 1.80, baseCPM: 11.00, nicheMultiplier: 2.3 }, // German market
  FR: { baseCPC: 1.60, baseCPM: 9.50, nicheMultiplier: 2.2 }, // French market
  ES: { baseCPC: 1.40, baseCPM: 8.50, nicheMultiplier: 2.0 }, // Spanish market
  RU: { baseCPC: 0.80, baseCPM: 5.00, nicheMultiplier: 1.8 }, // Russian market
  TR: { baseCPC: 0.60, baseCPM: 4.00, nicheMultiplier: 1.5 }, // Turkish market
}

// ============================================================================
// AUTHORITY METRICS CALCULATION
// ============================================================================

/**
 * Calculate authority metrics from article data
 */
export function calculateAuthorityMetrics(article: GeneratedArticle): AuthorityMetrics {
  // Count unique insights (SIA_SENTINEL mentions, proprietary analysis)
  const uniqueInsights = (article.siaInsight.match(/SIA_SENTINEL/g) || []).length +
                        (article.fullContent.match(/proprietary analysis|exclusive data|our monitoring/gi) || []).length
  
  return {
    eeat: article.eeatScore,
    originality: article.originalityScore,
    technical_depth: article.technicalDepth,
    data_source_count: article.metadata.sources.length,
    unique_insights: uniqueInsights
  }
}

// ============================================================================
// REVENUE PROJECTION CALCULATION
// ============================================================================

/**
 * Calculate revenue projection based on regional CPC and content quality
 */
export function calculateRevenueProjection(
  article: GeneratedArticle,
  authorityMetrics: AuthorityMetrics
): RevenueProjection {
  const regionalBreakdown: RegionalCPC[] = []
  
  // Calculate for each region
  Object.entries(REGIONAL_CPC_DATA).forEach(([region, data]) => {
    const regionKey = region as Region
    
    // Quality multiplier based on E-E-A-T and originality
    const qualityMultiplier = (authorityMetrics.eeat / 100) * 1.2 + 
                             (authorityMetrics.originality / 100) * 0.8
    
    // Calculate adjusted CPC and CPM
    const adjustedCPC = data.baseCPC * data.nicheMultiplier * qualityMultiplier
    const adjustedCPM = data.baseCPM * data.nicheMultiplier * qualityMultiplier
    
    // Estimate monthly traffic (conservative: 1000-5000 views per article)
    const estimatedMonthlyViews = 2500 * (authorityMetrics.eeat / 100)
    
    // Calculate projected revenue
    const projectedMonthlyRevenue = (estimatedMonthlyViews / 1000) * adjustedCPM
    
    regionalBreakdown.push({
      region: regionKey,
      language: mapRegionToLanguage(regionKey),
      estimated_cpc: parseFloat(adjustedCPC.toFixed(2)),
      estimated_cpm: parseFloat(adjustedCPM.toFixed(2)),
      niche_multiplier: data.nicheMultiplier,
      projected_monthly_revenue: parseFloat(projectedMonthlyRevenue.toFixed(2))
    })
  })
  
  // Sort by projected revenue to find top region
  regionalBreakdown.sort((a, b) => b.projected_monthly_revenue - a.projected_monthly_revenue)
  
  const topRegion = regionalBreakdown[0]
  const totalPotentialMonthly = regionalBreakdown.reduce((sum, r) => sum + r.projected_monthly_revenue, 0)
  
  // Confidence based on E-E-A-T and data quality
  const confidence = Math.round(
    (authorityMetrics.eeat * 0.4) +
    (authorityMetrics.originality * 0.3) +
    (authorityMetrics.data_source_count >= 3 ? 30 : authorityMetrics.data_source_count * 10)
  )
  
  return {
    top_region: topRegion.region,
    estimated_ecpm: `$${topRegion.estimated_cpm.toFixed(2)}`,
    regional_breakdown: regionalBreakdown,
    total_potential_monthly: `$${totalPotentialMonthly.toFixed(2)}`,
    confidence
  }
}

// ============================================================================
// SEO HEALTH CHECK
// ============================================================================

/**
 * Validate SEO health indicators
 */
export function checkSEOHealth(article: GeneratedArticle): SEOHealth {
  // Check hreflang (multilingual support)
  const hreflang_check: 'Valid' | 'Missing' | 'Invalid' = 'Valid' // Assume valid for now
  
  // Check structured data (JSON-LD)
  const structured_data: 'JSON-LD_Injected' | 'Missing' | 'Invalid' = 
    article.technicalGlossary.length > 0 ? 'JSON-LD_Injected' : 'Missing'
  
  // Check meta tags completeness
  const meta_tags_complete = 
    article.headline.length >= 60 && article.headline.length <= 80 &&
    article.summary.length >= 150 && article.summary.length <= 160
  
  // Generate canonical URL
  const canonical_url = `https://siaintel.com/${article.language}/news/${generateSlug(article.headline)}`
  
  // Sitemap inclusion (assume true for published articles)
  const sitemap_included = true
  
  // Mobile friendly (assume true for responsive design)
  const mobile_friendly = true
  
  // Page speed score (estimate based on content size)
  const contentSize = article.fullContent.length
  const page_speed_score = contentSize < 5000 ? 95 : 
                          contentSize < 10000 ? 85 : 75
  
  return {
    hreflang_check,
    structured_data,
    meta_tags_complete,
    canonical_url,
    sitemap_included,
    mobile_friendly,
    page_speed_score
  }
}

// ============================================================================
// INDEXABILITY FACTOR CALCULATION
// ============================================================================

/**
 * Calculate probability of ranking for featured snippets and search visibility
 */
export function calculateIndexabilityFactor(
  article: GeneratedArticle,
  authorityMetrics: AuthorityMetrics
): IndexabilityFactor {
  // Featured snippet probability based on:
  // - E-E-A-T score
  // - Technical glossary (definitions)
  // - Structured data
  // - Content format (lists, tables, clear answers)
  
  let featuredSnippetScore = 0
  
  // E-E-A-T contribution (40%)
  featuredSnippetScore += (article.eeatScore / 100) * 40
  
  // Technical glossary contribution (20%)
  featuredSnippetScore += (article.technicalGlossary.length >= 3 ? 20 : article.technicalGlossary.length * 6.67)
  
  // Structured data contribution (20%)
  featuredSnippetScore += 20 // Assume JSON-LD is present
  
  // Content format contribution (20%)
  const hasLists = article.fullContent.includes('•') || article.fullContent.includes('1.')
  const hasClearStructure = article.fullContent.split('\n\n').length >= 4
  featuredSnippetScore += (hasLists ? 10 : 0) + (hasClearStructure ? 10 : 0)
  
  // Information Gain score
  const information_gain_score = calculateInformationGainScore(article, authorityMetrics)
  
  // Keyword density check (optimal: 1-2%)
  const wordCount = article.metadata.wordCount
  const keywordCount = article.entities.length > 0
    ? (article.fullContent.match(new RegExp(article.entities[0].primaryName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')) || []).length
    : 0
  const keywordDensity = (keywordCount / wordCount) * 100
  const keyword_density_optimal = keywordDensity >= 1 && keywordDensity <= 2
  
  // Content freshness (based on publication time)
  const publishedDate = new Date(article.metadata.generatedAt)
  const now = new Date()
  const hoursSincePublished = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60)
  
  const content_freshness: 'FRESH' | 'RECENT' | 'STALE' = 
    hoursSincePublished < 24 ? 'FRESH' :
    hoursSincePublished < 168 ? 'RECENT' : 'STALE'
  
  // Backlink potential (based on uniqueness and authority)
  const backlink_potential: 'HIGH' | 'MEDIUM' | 'LOW' = 
    authorityMetrics.unique_insights >= 3 && article.eeatScore >= 85 ? 'HIGH' :
    authorityMetrics.unique_insights >= 2 && article.eeatScore >= 75 ? 'MEDIUM' : 'LOW'
  
  // Social share potential (based on sentiment and engagement factors)
  const social_share_potential = Math.round(
    (Math.abs(article.sentiment.overall - 50) / 50) * 40 + // Extreme sentiment = more shares
    (article.eeatScore / 100) * 30 + // Authority = trust = shares
    (authorityMetrics.unique_insights * 10) // Unique insights = shareability
  )
  
  return {
    featured_snippet_probability: Math.round(featuredSnippetScore),
    information_gain_score,
    keyword_density_optimal,
    content_freshness,
    backlink_potential,
    social_share_potential: Math.min(social_share_potential, 100)
  }
}

// ============================================================================
// INFORMATION GAIN CALCULATION
// ============================================================================

/**
 * Calculate Information Gain score (how much unique value this content provides)
 */
export function calculateInformationGainScore(
  article: GeneratedArticle,
  authorityMetrics: AuthorityMetrics
): number {
  let score = 0
  
  // Uniqueness score (40%)
  score += (article.originalityScore / 100) * 40
  
  // Data density (30%)
  const dataPoints = (article.fullContent.match(/\d+%|\d+\.\d+|\$\d+/g) || []).length
  const dataDensity = (dataPoints / article.metadata.wordCount) * 100
  score += Math.min(dataDensity * 3, 30)
  
  // Unique insights (20%)
  score += Math.min(authorityMetrics.unique_insights * 6.67, 20)
  
  // Technical depth (10%)
  score += article.technicalDepth === 'HIGH' ? 10 : article.technicalDepth === 'MEDIUM' ? 5 : 0
  
  return Math.round(Math.min(score, 100))
}

/**
 * Calculate detailed Information Gain metrics
 */
export function calculateInformationGainMetrics(
  article: GeneratedArticle,
  authorityMetrics: AuthorityMetrics
): InformationGainMetrics {
  // Uniqueness score
  const uniqueness_score = article.originalityScore
  
  // Data density (data points per 100 words)
  const dataPoints = (article.fullContent.match(/\d+%|\d+\.\d+|\$\d+/g) || []).length
  const data_density = parseFloat(((dataPoints / article.metadata.wordCount) * 100).toFixed(2))
  
  // Competitor gap (estimate based on unique insights and E-E-A-T)
  const competitor_gap = Math.round(
    (authorityMetrics.unique_insights * 15) +
    ((article.eeatScore - 75) * 2) + // Bonus for exceeding baseline
    (article.technicalDepth === 'HIGH' ? 20 : 10)
  )
  
  // Search intent match (based on content structure and completeness)
  const hasWhatWhenWhere = article.summary.split(/\b(what|when|where|who|why|how)\b/i).length > 1
  const hasDataProof = article.metadata.sources.length >= 2
  const hasActionableInsight = article.siaInsight.length > 200
  
  const search_intent_match = Math.round(
    (hasWhatWhenWhere ? 30 : 0) +
    (hasDataProof ? 30 : 0) +
    (hasActionableInsight ? 40 : 0)
  )
  
  return {
    uniqueness_score,
    data_density,
    competitor_gap: Math.min(competitor_gap, 100),
    search_intent_match
  }
}

// ============================================================================
// MAIN PERFORMANCE ANALYSIS FUNCTION
// ============================================================================

/**
 * Comprehensive performance analysis for published article
 */
export async function analyzePerformance(article: GeneratedArticle): Promise<PerformanceAnalysis> {
  // Calculate all metrics
  const authority_metrics = calculateAuthorityMetrics(article)
  const revenue_projection = calculateRevenueProjection(article, authority_metrics)
  const seo_health = checkSEOHealth(article)
  const indexability_factor = calculateIndexabilityFactor(article, authority_metrics)
  const information_gain = calculateInformationGainMetrics(article, authority_metrics)
  
  return {
    post_id: article.id,
    authority_metrics,
    revenue_projection,
    seo_health,
    indexability_factor,
    information_gain,
    timestamp: new Date().toISOString()
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function mapRegionToLanguage(region: Region): Language {
  const mapping: Record<Region, Language> = {
    TR: 'tr',
    US: 'en',
    DE: 'de',
    FR: 'fr',
    ES: 'es',
    RU: 'ru',
    AE: 'ar',
    JP: 'jp',
    CN: 'zh'
  }
  return mapping[region]
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 60)
}

// ============================================================================
// PERFORMANCE COMPARISON
// ============================================================================

/**
 * Compare performance across multiple articles
 */
export interface PerformanceComparison {
  best_performer: {
    article_id: string
    metric: string
    value: number
  }
  average_eeat: number
  average_revenue_potential: number
  top_performing_region: Region
  improvement_recommendations: string[]
}

export function comparePerformance(analyses: PerformanceAnalysis[]): PerformanceComparison {
  if (analyses.length === 0) {
    throw new Error('No analyses to compare')
  }
  
  // Find best performer by E-E-A-T
  const bestEEAT = analyses.reduce((best, current) => 
    current.authority_metrics.eeat > best.authority_metrics.eeat ? current : best
  )
  
  // Calculate averages
  const average_eeat = analyses.reduce((sum, a) => sum + a.authority_metrics.eeat, 0) / analyses.length
  
  const average_revenue_potential = analyses.reduce((sum, a) => {
    const revenue = parseFloat(a.revenue_projection.total_potential_monthly.replace('$', ''))
    return sum + revenue
  }, 0) / analyses.length
  
  // Find top performing region
  const regionCounts = new Map<Region, number>()
  analyses.forEach(a => {
    const count = regionCounts.get(a.revenue_projection.top_region) || 0
    regionCounts.set(a.revenue_projection.top_region, count + 1)
  })
  
  const top_performing_region = Array.from(regionCounts.entries())
    .sort((a, b) => b[1] - a[1])[0][0]
  
  // Generate improvement recommendations
  const improvement_recommendations: string[] = []
  
  if (average_eeat < 80) {
    improvement_recommendations.push('Increase E-E-A-T scores by adding more data sources and expert citations')
  }
  
  if (average_revenue_potential < 50) {
    improvement_recommendations.push('Focus on high-CPC regions (US, AE, DE) for better revenue potential')
  }
  
  const avgFeaturedSnippet = analyses.reduce((sum, a) => 
    sum + a.indexability_factor.featured_snippet_probability, 0) / analyses.length
  
  if (avgFeaturedSnippet < 60) {
    improvement_recommendations.push('Improve featured snippet probability by adding more structured data and clear definitions')
  }
  
  return {
    best_performer: {
      article_id: bestEEAT.post_id,
      metric: 'E-E-A-T Score',
      value: bestEEAT.authority_metrics.eeat
    },
    average_eeat: Math.round(average_eeat),
    average_revenue_potential: Math.round(average_revenue_potential),
    top_performing_region,
    improvement_recommendations
  }
}
