/**
 * Decision Log Service
 * Phase 3A.8: Observability and decision logging
 * 
 * Logs editorial decisions for debugging and audit purposes.
 * Stores decisions in-memory (no persistence).
 * 
 * CRITICAL: No external calls, no persistence, no automation.
 */

import type { Language, Platform } from '@/lib/distribution/types'
import type { TrendCategory } from '@/lib/distribution/trends/trend-types'
import type {
  EditorialVariant,
  EditorialVariantType
} from '@/lib/distribution/editorial/editorial-variant-selector'
import type {
  GenerationMode,
  VariantRecommendation
} from '@/lib/distribution/editorial/variant-recommendation-service'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Decision log entry
 */
export interface DecisionLogEntry {
  // Identification
  id: string
  timestamp: Date
  
  // Context
  context: {
    locale: Language
    platform: Platform
    category: TrendCategory
    generationMode: GenerationMode
  }
  
  // Decision
  recommendedVariant: EditorialVariantType
  selectedVariant: EditorialVariantType // May differ if manually overridden
  wasManuallyOverridden: boolean
  
  // Variants
  allVariants: Array<{
    variantType: EditorialVariantType
    overallScore: number
    engagementPotential: number
    editorialQuality: number
    brandSafetyScore: number
    trustComplianceScore: number
  }>
  
  // Scores
  variantScores: Record<EditorialVariantType, number>
  
  // Reasoning
  selectionReasoning: string[]
  rejectionReasons: Record<EditorialVariantType, string[]>
  risksAndTradeoffs: string[]
  
  // Confidence
  recommendationConfidence: number
  warnings: string[]
  
  // Metadata
  articleId?: string
  articleTitle?: string
}

/**
 * Decision log query
 */
export interface DecisionLogQuery {
  locale?: Language
  platform?: Platform
  category?: TrendCategory
  generationMode?: GenerationMode
  wasManuallyOverridden?: boolean
  fromDate?: Date
  toDate?: Date
  limit?: number
}

/**
 * Decision log statistics
 */
export interface DecisionLogStats {
  totalDecisions: number
  manualOverrides: number
  overrideRate: number
  
  variantDistribution: Record<EditorialVariantType, number>
  averageConfidence: number
  
  byLocale: Record<Language, number>
  byPlatform: Record<Platform, number>
  byCategory: Record<TrendCategory, number>
  byMode: Record<GenerationMode, number>
}

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

/**
 * In-memory decision log storage
 * CRITICAL: This is not persisted. For debugging/audit only.
 */
const decisionLog: DecisionLogEntry[] = []

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Log an editorial decision
 */
export function logDecision(
  recommendation: VariantRecommendation,
  selectedVariant: EditorialVariantType,
  allVariants: EditorialVariant[],
  variantScores: Record<EditorialVariantType, number>,
  metadata?: {
    articleId?: string
    articleTitle?: string
  }
): DecisionLogEntry {
  const entry: DecisionLogEntry = {
    id: generateLogId(),
    timestamp: new Date(),
    context: {
      locale: recommendation.context.locale,
      platform: recommendation.context.platform,
      category: recommendation.context.category,
      generationMode: recommendation.context.generationMode
    },
    recommendedVariant: recommendation.recommendedVariant.variantType,
    selectedVariant,
    wasManuallyOverridden: selectedVariant !== recommendation.recommendedVariant.variantType,
    allVariants: allVariants.map(v => ({
      variantType: v.variantType,
      overallScore: v.overallScore,
      engagementPotential: v.engagementPotential,
      editorialQuality: v.editorialQuality,
      brandSafetyScore: v.brandSafetyScore,
      trustComplianceScore: v.trustComplianceScore
    })),
    variantScores,
    selectionReasoning: recommendation.selectionReasoning,
    rejectionReasons: recommendation.rejectionReasons,
    risksAndTradeoffs: recommendation.risksAndTradeoffs,
    recommendationConfidence: recommendation.recommendationConfidence,
    warnings: recommendation.warnings,
    articleId: metadata?.articleId,
    articleTitle: metadata?.articleTitle
  }
  
  // Store in memory
  decisionLog.push(entry)
  
  console.log('[DECISION_LOG] Logged decision:', entry.id, {
    recommended: entry.recommendedVariant,
    selected: entry.selectedVariant,
    overridden: entry.wasManuallyOverridden
  })
  
  return entry
}

/**
 * Query decision log
 */
export function queryDecisionLog(query: DecisionLogQuery = {}): DecisionLogEntry[] {
  let results = [...decisionLog]
  
  // Apply filters
  if (query.locale) {
    results = results.filter(e => e.context.locale === query.locale)
  }
  if (query.platform) {
    results = results.filter(e => e.context.platform === query.platform)
  }
  if (query.category) {
    results = results.filter(e => e.context.category === query.category)
  }
  if (query.generationMode) {
    results = results.filter(e => e.context.generationMode === query.generationMode)
  }
  if (query.wasManuallyOverridden !== undefined) {
    results = results.filter(e => e.wasManuallyOverridden === query.wasManuallyOverridden)
  }
  if (query.fromDate) {
    results = results.filter(e => e.timestamp >= query.fromDate!)
  }
  if (query.toDate) {
    results = results.filter(e => e.timestamp <= query.toDate!)
  }
  
  // Sort by timestamp (newest first)
  results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
  
  // Apply limit
  if (query.limit) {
    results = results.slice(0, query.limit)
  }
  
  return results
}

/**
 * Get decision log statistics
 */
export function getDecisionLogStats(): DecisionLogStats {
  const totalDecisions = decisionLog.length
  const manualOverrides = decisionLog.filter(e => e.wasManuallyOverridden).length
  const overrideRate = totalDecisions > 0 ? (manualOverrides / totalDecisions) * 100 : 0
  
  // Variant distribution
  const variantDistribution: Record<string, number> = {
    safe_factual: 0,
    attention_optimized: 0,
    high_authority_institutional: 0
  }
  decisionLog.forEach(e => {
    variantDistribution[e.selectedVariant] = (variantDistribution[e.selectedVariant] || 0) + 1
  })
  
  // Average confidence
  const avgConfidence = totalDecisions > 0
    ? decisionLog.reduce((sum, e) => sum + e.recommendationConfidence, 0) / totalDecisions
    : 0
  
  // By locale
  const byLocale: Record<string, number> = {}
  decisionLog.forEach(e => {
    byLocale[e.context.locale] = (byLocale[e.context.locale] || 0) + 1
  })
  
  // By platform
  const byPlatform: Record<string, number> = {}
  decisionLog.forEach(e => {
    byPlatform[e.context.platform] = (byPlatform[e.context.platform] || 0) + 1
  })
  
  // By category
  const byCategory: Record<string, number> = {}
  decisionLog.forEach(e => {
    byCategory[e.context.category] = (byCategory[e.context.category] || 0) + 1
  })
  
  // By mode
  const byMode: Record<string, number> = {}
  decisionLog.forEach(e => {
    byMode[e.context.generationMode] = (byMode[e.context.generationMode] || 0) + 1
  })
  
  return {
    totalDecisions,
    manualOverrides,
    overrideRate,
    variantDistribution: variantDistribution as Record<EditorialVariantType, number>,
    averageConfidence: Math.round(avgConfidence),
    byLocale: byLocale as Record<Language, number>,
    byPlatform: byPlatform as Record<Platform, number>,
    byCategory: byCategory as Record<TrendCategory, number>,
    byMode: byMode as Record<GenerationMode, number>
  }
}

/**
 * Get decision by ID
 */
export function getDecisionById(id: string): DecisionLogEntry | undefined {
  return decisionLog.find(e => e.id === id)
}

/**
 * Clear decision log (for testing/debugging)
 */
export function clearDecisionLog(): void {
  decisionLog.length = 0
  console.log('[DECISION_LOG] Cleared all entries')
}

/**
 * Get decision log size
 */
export function getDecisionLogSize(): number {
  return decisionLog.length
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique log ID
 */
function generateLogId(): string {
  return `decision_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * Export decision log as JSON (for debugging)
 */
export function exportDecisionLogJSON(): string {
  return JSON.stringify(decisionLog, null, 2)
}

/**
 * Get recent decisions
 */
export function getRecentDecisions(limit: number = 10): DecisionLogEntry[] {
  return queryDecisionLog({ limit })
}
