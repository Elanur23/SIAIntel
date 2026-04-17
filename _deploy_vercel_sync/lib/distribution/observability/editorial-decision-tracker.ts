/**
 * Editorial Decision Tracker
 * Phase 3A.8: Track and compare editorial decisions
 * 
 * Tracks which variants were recommended vs manually selected.
 * Enables comparison and analysis of decision patterns.
 * 
 * CRITICAL: No persistence, no automation, no external calls.
 */

import type { Language, Platform } from '@/lib/distribution/types'
import type { TrendCategory } from '@/lib/distribution/trends/trend-types'
import type { EditorialVariantType } from '@/lib/distribution/editorial/editorial-variant-selector'
import type { GenerationMode } from '@/lib/distribution/editorial/variant-recommendation-service'
import type { DecisionLogEntry } from './decision-log-service'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Decision comparison
 */
export interface DecisionComparison {
  // Identification
  decisionId: string
  timestamp: Date
  
  // Context
  context: {
    locale: Language
    platform: Platform
    category: TrendCategory
    generationMode: GenerationMode
  }
  
  // Comparison
  recommendedVariant: EditorialVariantType
  selectedVariant: EditorialVariantType
  wasOverridden: boolean
  
  // Scores
  recommendedScore: number
  selectedScore: number
  scoreDifference: number
  
  // Analysis
  overrideReason?: string
  impactAssessment: {
    engagementImpact: 'positive' | 'negative' | 'neutral'
    qualityImpact: 'positive' | 'negative' | 'neutral'
    safetyImpact: 'positive' | 'negative' | 'neutral'
  }
}

/**
 * Override pattern
 */
export interface OverridePattern {
  // Pattern identification
  fromVariant: EditorialVariantType
  toVariant: EditorialVariantType
  frequency: number
  
  // Context
  commonLocales: Language[]
  commonPlatforms: Platform[]
  commonCategories: TrendCategory[]
  commonModes: GenerationMode[]
  
  // Impact
  averageScoreDifference: number
  averageEngagementImpact: number
  averageQualityImpact: number
}

/**
 * Decision trend
 */
export interface DecisionTrend {
  period: 'hour' | 'day' | 'week'
  data: Array<{
    timestamp: Date
    totalDecisions: number
    overrideRate: number
    averageConfidence: number
    variantDistribution: Record<EditorialVariantType, number>
  }>
}

// ============================================================================
// TRACKING FUNCTIONS
// ============================================================================

/**
 * Compare recommended vs selected variant
 */
export function compareDecision(entry: DecisionLogEntry): DecisionComparison {
  const recommendedVariant = entry.allVariants.find(
    v => v.variantType === entry.recommendedVariant
  )
  const selectedVariant = entry.allVariants.find(
    v => v.variantType === entry.selectedVariant
  )
  
  if (!recommendedVariant || !selectedVariant) {
    throw new Error('Variant not found in decision entry')
  }
  
  const recommendedScore = entry.variantScores[entry.recommendedVariant]
  const selectedScore = entry.variantScores[entry.selectedVariant]
  const scoreDifference = selectedScore - recommendedScore
  
  // Assess impact
  const impactAssessment = assessOverrideImpact(
    recommendedVariant,
    selectedVariant,
    entry.wasManuallyOverridden
  )
  
  return {
    decisionId: entry.id,
    timestamp: entry.timestamp,
    context: entry.context,
    recommendedVariant: entry.recommendedVariant,
    selectedVariant: entry.selectedVariant,
    wasOverridden: entry.wasManuallyOverridden,
    recommendedScore,
    selectedScore,
    scoreDifference,
    impactAssessment
  }
}

/**
 * Identify override patterns
 */
export function identifyOverridePatterns(
  decisions: DecisionLogEntry[]
): OverridePattern[] {
  const patterns = new Map<string, {
    fromVariant: EditorialVariantType
    toVariant: EditorialVariantType
    entries: DecisionLogEntry[]
  }>()
  
  // Group overrides by from->to pattern
  decisions
    .filter(d => d.wasManuallyOverridden)
    .forEach(entry => {
      const key = `${entry.recommendedVariant}->${entry.selectedVariant}`
      if (!patterns.has(key)) {
        patterns.set(key, {
          fromVariant: entry.recommendedVariant,
          toVariant: entry.selectedVariant,
          entries: []
        })
      }
      patterns.get(key)!.entries.push(entry)
    })
  
  // Analyze each pattern
  return Array.from(patterns.values()).map(pattern => {
    const entries = pattern.entries
    
    // Find common contexts
    const locales = new Set(entries.map(e => e.context.locale))
    const platforms = new Set(entries.map(e => e.context.platform))
    const categories = new Set(entries.map(e => e.context.category))
    const modes = new Set(entries.map(e => e.context.generationMode))
    
    // Calculate average impacts
    const scoreDiffs = entries.map(e => 
      e.variantScores[e.selectedVariant] - e.variantScores[e.recommendedVariant]
    )
    const avgScoreDiff = scoreDiffs.reduce((a, b) => a + b, 0) / scoreDiffs.length
    
    const engagementImpacts = entries.map(e => {
      const rec = e.allVariants.find(v => v.variantType === e.recommendedVariant)!
      const sel = e.allVariants.find(v => v.variantType === e.selectedVariant)!
      return sel.engagementPotential - rec.engagementPotential
    })
    const avgEngagementImpact = engagementImpacts.reduce((a, b) => a + b, 0) / engagementImpacts.length
    
    const qualityImpacts = entries.map(e => {
      const rec = e.allVariants.find(v => v.variantType === e.recommendedVariant)!
      const sel = e.allVariants.find(v => v.variantType === e.selectedVariant)!
      return sel.editorialQuality - rec.editorialQuality
    })
    const avgQualityImpact = qualityImpacts.reduce((a, b) => a + b, 0) / qualityImpacts.length
    
    return {
      fromVariant: pattern.fromVariant,
      toVariant: pattern.toVariant,
      frequency: entries.length,
      commonLocales: Array.from(locales) as Language[],
      commonPlatforms: Array.from(platforms) as Platform[],
      commonCategories: Array.from(categories) as TrendCategory[],
      commonModes: Array.from(modes) as GenerationMode[],
      averageScoreDifference: Math.round(avgScoreDiff),
      averageEngagementImpact: Math.round(avgEngagementImpact),
      averageQualityImpact: Math.round(avgQualityImpact)
    }
  }).sort((a, b) => b.frequency - a.frequency)
}

/**
 * Analyze decision trends over time
 */
export function analyzeDecisionTrends(
  decisions: DecisionLogEntry[],
  period: 'hour' | 'day' | 'week' = 'day'
): DecisionTrend {
  // Group decisions by time period
  const groups = new Map<number, DecisionLogEntry[]>()
  
  decisions.forEach(entry => {
    const timestamp = entry.timestamp.getTime()
    let periodKey: number
    
    if (period === 'hour') {
      periodKey = Math.floor(timestamp / (1000 * 60 * 60))
    } else if (period === 'day') {
      periodKey = Math.floor(timestamp / (1000 * 60 * 60 * 24))
    } else {
      periodKey = Math.floor(timestamp / (1000 * 60 * 60 * 24 * 7))
    }
    
    if (!groups.has(periodKey)) {
      groups.set(periodKey, [])
    }
    groups.get(periodKey)!.push(entry)
  })
  
  // Analyze each period
  const data = Array.from(groups.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([periodKey, entries]) => {
      const totalDecisions = entries.length
      const overrides = entries.filter(e => e.wasManuallyOverridden).length
      const overrideRate = (overrides / totalDecisions) * 100
      
      const avgConfidence = entries.reduce((sum, e) => sum + e.recommendationConfidence, 0) / totalDecisions
      
      const variantDistribution: Record<string, number> = {
        safe_factual: 0,
        attention_optimized: 0,
        high_authority_institutional: 0
      }
      entries.forEach(e => {
        variantDistribution[e.selectedVariant]++
      })
      
      // Convert period key back to timestamp
      let timestamp: Date
      if (period === 'hour') {
        timestamp = new Date(periodKey * 1000 * 60 * 60)
      } else if (period === 'day') {
        timestamp = new Date(periodKey * 1000 * 60 * 60 * 24)
      } else {
        timestamp = new Date(periodKey * 1000 * 60 * 60 * 24 * 7)
      }
      
      return {
        timestamp,
        totalDecisions,
        overrideRate: Math.round(overrideRate),
        averageConfidence: Math.round(avgConfidence),
        variantDistribution: variantDistribution as Record<EditorialVariantType, number>
      }
    })
  
  return {
    period,
    data
  }
}

/**
 * Get override recommendations
 */
export function getOverrideRecommendations(
  patterns: OverridePattern[]
): string[] {
  const recommendations: string[] = []
  
  patterns.forEach(pattern => {
    if (pattern.frequency >= 5) {
      if (pattern.averageQualityImpact < -10) {
        recommendations.push(
          `Warning: Overriding ${pattern.fromVariant} → ${pattern.toVariant} reduces quality by ${Math.abs(pattern.averageQualityImpact)} points on average (${pattern.frequency} occurrences)`
        )
      }
      
      if (pattern.averageEngagementImpact > 15) {
        recommendations.push(
          `Insight: Overriding ${pattern.fromVariant} → ${pattern.toVariant} increases engagement by ${pattern.averageEngagementImpact} points on average (${pattern.frequency} occurrences)`
        )
      }
      
      if (pattern.commonPlatforms.length === 1) {
        recommendations.push(
          `Pattern: ${pattern.fromVariant} → ${pattern.toVariant} override is common on ${pattern.commonPlatforms[0]} platform (${pattern.frequency} occurrences)`
        )
      }
    }
  })
  
  return recommendations
}

// ============================================================================
// IMPACT ASSESSMENT
// ============================================================================

/**
 * Assess impact of override
 */
function assessOverrideImpact(
  recommendedVariant: { engagementPotential: number; editorialQuality: number; brandSafetyScore: number },
  selectedVariant: { engagementPotential: number; editorialQuality: number; brandSafetyScore: number },
  wasOverridden: boolean
): {
  engagementImpact: 'positive' | 'negative' | 'neutral'
  qualityImpact: 'positive' | 'negative' | 'neutral'
  safetyImpact: 'positive' | 'negative' | 'neutral'
} {
  if (!wasOverridden) {
    return {
      engagementImpact: 'neutral',
      qualityImpact: 'neutral',
      safetyImpact: 'neutral'
    }
  }
  
  const engagementDiff = selectedVariant.engagementPotential - recommendedVariant.engagementPotential
  const qualityDiff = selectedVariant.editorialQuality - recommendedVariant.editorialQuality
  const safetyDiff = selectedVariant.brandSafetyScore - recommendedVariant.brandSafetyScore
  
  return {
    engagementImpact: engagementDiff > 5 ? 'positive' : engagementDiff < -5 ? 'negative' : 'neutral',
    qualityImpact: qualityDiff > 5 ? 'positive' : qualityDiff < -5 ? 'negative' : 'neutral',
    safetyImpact: safetyDiff > 5 ? 'positive' : safetyDiff < -5 ? 'negative' : 'neutral'
  }
}

/**
 * Generate comparison summary
 */
export function generateComparisonSummary(comparison: DecisionComparison): string[] {
  const summary: string[] = []
  
  summary.push(`Decision: ${comparison.decisionId}`)
  summary.push(`Context: ${comparison.context.locale} / ${comparison.context.platform} / ${comparison.context.category}`)
  
  if (comparison.wasOverridden) {
    summary.push(`Override: ${comparison.recommendedVariant} → ${comparison.selectedVariant}`)
    summary.push(`Score change: ${comparison.scoreDifference > 0 ? '+' : ''}${comparison.scoreDifference}`)
    
    if (comparison.impactAssessment.engagementImpact !== 'neutral') {
      summary.push(`Engagement impact: ${comparison.impactAssessment.engagementImpact}`)
    }
    if (comparison.impactAssessment.qualityImpact !== 'neutral') {
      summary.push(`Quality impact: ${comparison.impactAssessment.qualityImpact}`)
    }
    if (comparison.impactAssessment.safetyImpact !== 'neutral') {
      summary.push(`Safety impact: ${comparison.impactAssessment.safetyImpact}`)
    }
  } else {
    summary.push(`No override: Recommendation accepted`)
  }
  
  return summary
}
