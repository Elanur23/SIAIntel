/**
 * Audit Explanation Service
 * Phase 3A.8: Generate human-readable audit explanations
 * 
 * Generates comprehensive explanations for editorial decisions.
 * Explains why variants were selected or rejected.
 * Documents risks and tradeoffs.
 * 
 * CRITICAL: No external calls, no persistence, no automation.
 */

import type { Language, Platform } from '@/lib/distribution/types'
import type { TrendCategory } from '@/lib/distribution/trends/trend-types'
import type { EditorialVariantType } from '@/lib/distribution/editorial/editorial-variant-selector'
import type { GenerationMode } from '@/lib/distribution/editorial/variant-recommendation-service'
import type { DecisionLogEntry } from './decision-log-service'
import type { DecisionComparison } from './editorial-decision-tracker'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Audit explanation
 */
export interface AuditExplanation {
  // Identification
  decisionId: string
  timestamp: Date
  
  // Summary
  executiveSummary: string
  
  // Detailed explanation
  sections: {
    context: AuditSection
    recommendation: AuditSection
    selection: AuditSection
    alternatives: AuditSection
    risks: AuditSection
    quality: AuditSection
  }
  
  // Structured data
  structuredData: {
    context: Record<string, any>
    scores: Record<string, any>
    reasoning: Record<string, any>
  }
  
  // Human-readable output
  readableOutput: string
}

/**
 * Audit section
 */
export interface AuditSection {
  title: string
  content: string[]
  highlights: string[]
  warnings: string[]
}

// ============================================================================
// EXPLANATION GENERATION
// ============================================================================

/**
 * Generate comprehensive audit explanation
 */
export function generateAuditExplanation(
  entry: DecisionLogEntry,
  comparison?: DecisionComparison
): AuditExplanation {
  console.log('[AUDIT_EXPLANATION] Generating explanation for decision:', entry.id)
  
  // Generate executive summary
  const executiveSummary = generateExecutiveSummary(entry, comparison)
  
  // Generate sections
  const sections = {
    context: generateContextSection(entry),
    recommendation: generateRecommendationSection(entry),
    selection: generateSelectionSection(entry, comparison),
    alternatives: generateAlternativesSection(entry),
    risks: generateRisksSection(entry),
    quality: generateQualitySection(entry)
  }
  
  // Generate structured data
  const structuredData = generateStructuredData(entry)
  
  // Generate readable output
  const readableOutput = generateReadableOutput(executiveSummary, sections)
  
  return {
    decisionId: entry.id,
    timestamp: entry.timestamp,
    executiveSummary,
    sections,
    structuredData,
    readableOutput
  }
}

// ============================================================================
// SECTION GENERATORS
// ============================================================================

/**
 * Generate executive summary
 */
function generateExecutiveSummary(
  entry: DecisionLogEntry,
  comparison?: DecisionComparison
): string {
  const parts: string[] = []
  
  parts.push(`Editorial decision for ${entry.context.locale} / ${entry.context.platform} / ${entry.context.category}`)
  parts.push(`using ${entry.context.generationMode} generation mode.`)
  
  if (entry.wasManuallyOverridden) {
    parts.push(`Recommendation (${entry.recommendedVariant}) was overridden.`)
    parts.push(`Selected variant: ${entry.selectedVariant}.`)
    
    if (comparison) {
      if (comparison.scoreDifference > 0) {
        parts.push(`Override improved score by ${comparison.scoreDifference} points.`)
      } else if (comparison.scoreDifference < 0) {
        parts.push(`Override reduced score by ${Math.abs(comparison.scoreDifference)} points.`)
      }
    }
  } else {
    parts.push(`Recommendation accepted: ${entry.selectedVariant}.`)
  }
  
  parts.push(`Confidence: ${entry.recommendationConfidence}%.`)
  
  if (entry.warnings.length > 0) {
    parts.push(`${entry.warnings.length} warning(s) present.`)
  }
  
  return parts.join(' ')
}

/**
 * Generate context section
 */
function generateContextSection(entry: DecisionLogEntry): AuditSection {
  const content: string[] = []
  const highlights: string[] = []
  
  content.push(`Locale: ${entry.context.locale}`)
  content.push(`Platform: ${entry.context.platform}`)
  content.push(`Category: ${entry.context.category}`)
  content.push(`Generation Mode: ${entry.context.generationMode}`)
  
  if (entry.articleTitle) {
    content.push(`Article: "${entry.articleTitle}"`)
  }
  if (entry.articleId) {
    content.push(`Article ID: ${entry.articleId}`)
  }
  
  content.push(`Timestamp: ${entry.timestamp.toISOString()}`)
  
  // Highlights
  highlights.push(`${entry.context.generationMode} mode prioritizes ${getModeDescription(entry.context.generationMode)}`)
  highlights.push(`${entry.context.platform} platform prefers ${getPlatformPreference(entry.context.platform)} content`)
  
  return {
    title: 'Decision Context',
    content,
    highlights,
    warnings: []
  }
}

/**
 * Generate recommendation section
 */
function generateRecommendationSection(entry: DecisionLogEntry): AuditSection {
  const content: string[] = []
  const highlights: string[] = []
  const warnings: string[] = []
  
  content.push(`Recommended Variant: ${entry.recommendedVariant}`)
  content.push(`Recommendation Confidence: ${entry.recommendationConfidence}%`)
  content.push(`Context-Adjusted Score: ${entry.variantScores[entry.recommendedVariant]}`)
  
  // Add reasoning
  content.push('')
  content.push('Reasoning:')
  entry.selectionReasoning.forEach(reason => {
    content.push(`  • ${reason}`)
  })
  
  // Highlights
  const recommendedVariant = entry.allVariants.find(v => v.variantType === entry.recommendedVariant)
  if (recommendedVariant) {
    highlights.push(`Engagement Potential: ${recommendedVariant.engagementPotential}/100`)
    highlights.push(`Editorial Quality: ${recommendedVariant.editorialQuality}/100`)
    highlights.push(`Brand Safety: ${recommendedVariant.brandSafetyScore}/100`)
  }
  
  // Warnings
  if (entry.recommendationConfidence < 70) {
    warnings.push('Low recommendation confidence - consider manual review')
  }
  entry.warnings.forEach(warning => warnings.push(warning))
  
  return {
    title: 'Recommendation Analysis',
    content,
    highlights,
    warnings
  }
}

/**
 * Generate selection section
 */
function generateSelectionSection(
  entry: DecisionLogEntry,
  comparison?: DecisionComparison
): AuditSection {
  const content: string[] = []
  const highlights: string[] = []
  const warnings: string[] = []
  
  content.push(`Selected Variant: ${entry.selectedVariant}`)
  content.push(`Was Manually Overridden: ${entry.wasManuallyOverridden ? 'Yes' : 'No'}`)
  
  if (entry.wasManuallyOverridden) {
    content.push('')
    content.push(`Override: ${entry.recommendedVariant} → ${entry.selectedVariant}`)
    content.push(`Score Change: ${entry.variantScores[entry.selectedVariant] - entry.variantScores[entry.recommendedVariant]}`)
    
    if (comparison) {
      content.push('')
      content.push('Impact Assessment:')
      content.push(`  • Engagement: ${comparison.impactAssessment.engagementImpact}`)
      content.push(`  • Quality: ${comparison.impactAssessment.qualityImpact}`)
      content.push(`  • Safety: ${comparison.impactAssessment.safetyImpact}`)
      
      // Warnings for negative impacts
      if (comparison.impactAssessment.qualityImpact === 'negative') {
        warnings.push('Override reduced editorial quality')
      }
      if (comparison.impactAssessment.safetyImpact === 'negative') {
        warnings.push('Override reduced brand safety')
      }
    }
  } else {
    highlights.push('Recommendation was accepted without modification')
  }
  
  return {
    title: 'Selection Decision',
    content,
    highlights,
    warnings
  }
}

/**
 * Generate alternatives section
 */
function generateAlternativesSection(entry: DecisionLogEntry): AuditSection {
  const content: string[] = []
  const highlights: string[] = []
  
  content.push('Alternative Variants:')
  content.push('')
  
  entry.allVariants
    .filter(v => v.variantType !== entry.selectedVariant)
    .sort((a, b) => entry.variantScores[b.variantType] - entry.variantScores[a.variantType])
    .forEach(variant => {
      content.push(`${variant.variantType}:`)
      content.push(`  • Context Score: ${entry.variantScores[variant.variantType]}`)
      content.push(`  • Overall Score: ${variant.overallScore}`)
      content.push(`  • Engagement: ${variant.engagementPotential}`)
      content.push(`  • Quality: ${variant.editorialQuality}`)
      content.push(`  • Safety: ${variant.brandSafetyScore}`)
      
      // Add rejection reasons
      const rejectionReasons = entry.rejectionReasons[variant.variantType]
      if (rejectionReasons && rejectionReasons.length > 0) {
        content.push('  Rejection Reasons:')
        rejectionReasons.forEach(reason => {
          content.push(`    - ${reason}`)
        })
      }
      
      content.push('')
    })
  
  // Highlight score differences
  const scores = entry.allVariants.map(v => entry.variantScores[v.variantType])
  const maxScore = Math.max(...scores)
  const minScore = Math.min(...scores)
  highlights.push(`Score range: ${minScore} - ${maxScore} (spread: ${maxScore - minScore})`)
  
  return {
    title: 'Alternative Variants',
    content,
    highlights,
    warnings: []
  }
}

/**
 * Generate risks section
 */
function generateRisksSection(entry: DecisionLogEntry): AuditSection {
  const content: string[] = []
  const highlights: string[] = []
  const warnings: string[] = []
  
  if (entry.risksAndTradeoffs.length > 0) {
    content.push('Identified Risks and Tradeoffs:')
    entry.risksAndTradeoffs.forEach(risk => {
      content.push(`  • ${risk}`)
      
      // Categorize as warning if it's a risk
      if (risk.toLowerCase().includes('risk:')) {
        warnings.push(risk.replace(/^Risk:\s*/i, ''))
      }
    })
  } else {
    content.push('No significant risks identified')
    highlights.push('Low-risk decision')
  }
  
  return {
    title: 'Risks and Tradeoffs',
    content,
    highlights,
    warnings
  }
}

/**
 * Generate quality section
 */
function generateQualitySection(entry: DecisionLogEntry): AuditSection {
  const content: string[] = []
  const highlights: string[] = []
  const warnings: string[] = []
  
  const selectedVariant = entry.allVariants.find(v => v.variantType === entry.selectedVariant)
  
  if (selectedVariant) {
    content.push('Quality Metrics:')
    content.push(`  • Brand Safety: ${selectedVariant.brandSafetyScore}/100`)
    content.push(`  • Trust & Compliance: ${selectedVariant.trustComplianceScore}/100`)
    content.push(`  • Editorial Quality: ${selectedVariant.editorialQuality}/100`)
    content.push(`  • Engagement Potential: ${selectedVariant.engagementPotential}/100`)
    content.push(`  • Overall Score: ${selectedVariant.overallScore}/100`)
    
    // Highlights
    if (selectedVariant.brandSafetyScore >= 90) {
      highlights.push('Excellent brand safety')
    }
    if (selectedVariant.editorialQuality >= 85) {
      highlights.push('High editorial quality')
    }
    
    // Warnings
    if (selectedVariant.brandSafetyScore < 70) {
      warnings.push('Brand safety score below recommended threshold')
    }
    if (selectedVariant.trustComplianceScore < 70) {
      warnings.push('Trust score below recommended threshold')
    }
  }
  
  return {
    title: 'Quality Assessment',
    content,
    highlights,
    warnings
  }
}

// ============================================================================
// STRUCTURED DATA
// ============================================================================

/**
 * Generate structured data for programmatic access
 */
function generateStructuredData(entry: DecisionLogEntry): {
  context: Record<string, any>
  scores: Record<string, any>
  reasoning: Record<string, any>
} {
  return {
    context: {
      locale: entry.context.locale,
      platform: entry.context.platform,
      category: entry.context.category,
      generationMode: entry.context.generationMode,
      articleId: entry.articleId,
      articleTitle: entry.articleTitle,
      timestamp: entry.timestamp.toISOString()
    },
    scores: {
      variants: entry.allVariants.map(v => ({
        type: v.variantType,
        overallScore: v.overallScore,
        contextScore: entry.variantScores[v.variantType],
        engagement: v.engagementPotential,
        quality: v.editorialQuality,
        safety: v.brandSafetyScore,
        trust: v.trustComplianceScore
      })),
      recommendationConfidence: entry.recommendationConfidence
    },
    reasoning: {
      recommended: entry.recommendedVariant,
      selected: entry.selectedVariant,
      wasOverridden: entry.wasManuallyOverridden,
      selectionReasoning: entry.selectionReasoning,
      rejectionReasons: entry.rejectionReasons,
      risksAndTradeoffs: entry.risksAndTradeoffs,
      warnings: entry.warnings
    }
  }
}

// ============================================================================
// READABLE OUTPUT
// ============================================================================

/**
 * Generate human-readable text output
 */
function generateReadableOutput(
  executiveSummary: string,
  sections: Record<string, AuditSection>
): string {
  const lines: string[] = []
  
  lines.push('='.repeat(80))
  lines.push('EDITORIAL DECISION AUDIT REPORT')
  lines.push('='.repeat(80))
  lines.push('')
  
  lines.push('EXECUTIVE SUMMARY')
  lines.push('-'.repeat(80))
  lines.push(executiveSummary)
  lines.push('')
  
  Object.values(sections).forEach(section => {
    lines.push(section.title.toUpperCase())
    lines.push('-'.repeat(80))
    
    section.content.forEach(line => lines.push(line))
    
    if (section.highlights.length > 0) {
      lines.push('')
      lines.push('Highlights:')
      section.highlights.forEach(highlight => lines.push(`  ✓ ${highlight}`))
    }
    
    if (section.warnings.length > 0) {
      lines.push('')
      lines.push('Warnings:')
      section.warnings.forEach(warning => lines.push(`  ⚠ ${warning}`))
    }
    
    lines.push('')
  })
  
  lines.push('='.repeat(80))
  lines.push('END OF REPORT')
  lines.push('='.repeat(80))
  
  return lines.join('\n')
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get mode description
 */
function getModeDescription(mode: GenerationMode): string {
  const descriptions: Record<GenerationMode, string> = {
    conservative: 'safety and compliance',
    balanced: 'balance between engagement and quality',
    engagement: 'engagement and platform performance',
    institutional: 'credibility and authority'
  }
  return descriptions[mode]
}

/**
 * Get platform preference
 */
function getPlatformPreference(platform: Platform): string {
  const preferences: Record<Platform, string> = {
    x: 'sharp, concise',
    linkedin: 'professional, authoritative',
    telegram: 'informative, direct',
    facebook: 'balanced, accessible',
    discord: 'technical, community-focused',
    instagram: 'visual, engaging',
    tiktok: 'punchy, fast-paced'
  }
  return preferences[platform]
}

/**
 * Export explanation as JSON
 */
export function exportExplanationJSON(explanation: AuditExplanation): string {
  return JSON.stringify(explanation, null, 2)
}

/**
 * Export explanation as text
 */
export function exportExplanationText(explanation: AuditExplanation): string {
  return explanation.readableOutput
}
