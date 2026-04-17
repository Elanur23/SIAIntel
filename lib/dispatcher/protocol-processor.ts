/**
 * Protocol Processor
 * Integrates with SIA Master Protocol v4 for batch processing
 * Applies protocol rules to all translated content
 */

import {
  processSIAMasterProtocol,
  validateProtocolCompliance,
  generateComplianceReport,
  batchProcessProtocol,
} from '@/lib/content/sia-master-protocol-v4'
import type {
  Language,
  ProcessedContent,
  ProtocolComplianceResult,
  TranslatedContent,
} from './types'

export class ProtocolProcessor {
  /**
   * Process multiple translations through SIA Master Protocol
   */
  async processBatch(
    translations: Record<Language, TranslatedContent>
  ): Promise<Record<Language, ProcessedContent>> {
    const results: Record<string, ProcessedContent> = {}

    // Prepare batch input
    const batchInput = Object.entries(translations).map(([lang, translation]) => ({
      id: lang,
      content: translation.fullContent,
      lang: lang as Language,
    }))

    // Process through protocol
    const processed = batchProcessProtocol(batchInput, {
      enableGlobalLexicon: true,
      enableScarcityTone: true,
      enableFinancialGravity: true,
      enableVerificationFooter: true,
      confidenceScore: 98.4,
    })

    // Build results
    for (const item of processed) {
      results[item.id] = item.processed
    }

    return results as Record<Language, ProcessedContent>
  }

  /**
   * Validate protocol compliance for a single translation
   */
  async validateCompliance(
    content: string
  ): Promise<ProtocolComplianceResult> {
    const validation = validateProtocolCompliance(content)

    return {
      isCompliant: validation.isCompliant,
      score: validation.score,
      issues: validation.issues.map((issue) => ({
        type: 'protocol_violation',
        severity: 'medium' as const,
        message: issue,
        suggestedFix: this.getSuggestedFix(issue),
      })),
      recommendations: this.generateRecommendations(validation.issues),
    }
  }

  /**
   * Process content with protocol and return E-E-A-T scores
   */
  async processContent(
    content: string,
    language: Language,
    metadata: Record<string, any>
  ): Promise<{
    content: string
    protocolCompliance: number
    eeatScore: number
    qualityMetrics: {
      protectedTerms: number
      imperativeVerbs: number
      fiatReferences: number
      wordCount: number
    }
    warnings: string[]
    errors: string[]
  }> {
    const processed = processSIAMasterProtocol(content, language, {
      enableGlobalLexicon: true,
      enableScarcityTone: true,
      enableFinancialGravity: true,
      enableVerificationFooter: true,
      confidenceScore: metadata.confidenceScore || 98.4,
    })

    const compliance = validateProtocolCompliance(processed.content)
    const report = generateComplianceReport(processed.content)

    // Calculate E-E-A-T score
    const eeatScore = this.calculateEEATScore(processed.content, metadata)

    return {
      content: processed.content,
      protocolCompliance: compliance.score,
      eeatScore,
      qualityMetrics: {
        protectedTerms: report.metrics.protectedTerms,
        imperativeVerbs: report.metrics.imperativeVerbs,
        fiatReferences: report.metrics.fiatReferences,
        wordCount: report.metrics.wordCount,
      },
      warnings: compliance.issues.filter(i => !i.includes('Missing')),
      errors: compliance.issues.filter(i => i.includes('Missing')),
    }
  }

  /**
   * Calculate E-E-A-T score
   */
  private calculateEEATScore(content: string, metadata: Record<string, any>): number {
    let score = 0

    // Experience (25 points)
    if (content.includes('SIA_SENTINEL') || content.includes('Our monitoring')) {
      score += 25
    } else {
      score += 15
    }

    // Expertise (25 points)
    const hasMetrics = /\d+%/.test(content)
    score += hasMetrics ? 25 : 15

    // Authoritativeness (25 points)
    const hasProtectedTerms = content.includes('**DePIN**') || content.includes('**RWA**')
    score += hasProtectedTerms ? 25 : 15

    // Trustworthiness (25 points)
    const hasDisclaimer = content.includes('RISK ASSESSMENT') || content.includes('Disclaimer')
    score += hasDisclaimer ? 25 : 15

    return Math.min(score, 100)
  }

  /**
   * Generate compliance report for all translations
   */
  async generateBatchReport(
    translations: Record<Language, TranslatedContent>
  ): Promise<Record<Language, ProtocolComplianceResult>> {
    const reports: Record<string, ProtocolComplianceResult> = {}

    for (const [lang, translation] of Object.entries(translations)) {
      const report = generateComplianceReport(translation.fullContent)

      reports[lang] = {
        isCompliant: report.compliance.isCompliant,
        score: report.compliance.score,
        issues: report.compliance.issues.map((issue) => ({
          type: 'protocol_violation',
          severity: 'medium' as const,
          message: issue,
          suggestedFix: this.getSuggestedFix(issue),
        })),
        recommendations: report.recommendations,
      }
    }

    return reports as Record<Language, ProtocolComplianceResult>
  }

  /**
   * Get suggested fix for a compliance issue
   */
  private getSuggestedFix(issue: string): string {
    if (issue.includes('Protected finance terms')) {
      return 'Add **bold** formatting to protected terms (DePIN, RWA, CBDC, etc.)'
    }

    if (issue.includes('Weak language')) {
      return 'Replace weak verbs (could, might, may) with imperative verbs (must, shall, will)'
    }

    if (issue.includes('fiat instrument')) {
      return 'Add reference to USD, EUR, or other fiat currency in first 2 paragraphs'
    }

    if (issue.includes('verification footer')) {
      return 'Add SOVEREIGN VERIFICATION PROTOCOL footer with confidence rating and hash'
    }

    return 'Review content and apply SIA Master Protocol v4 rules'
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: string[]): string[] {
    const recommendations: string[] = []

    if (issues.some((i) => i.includes('Protected finance terms'))) {
      recommendations.push('Use more high-ticket finance terms (DePIN, RWA, CBDC)')
      recommendations.push('Ensure all protected terms are in bold Latin script')
    }

    if (issues.some((i) => i.includes('Weak language'))) {
      recommendations.push('Use imperative verbs for scarcity tone')
      recommendations.push('Replace tentative language with confident assertions')
    }

    if (issues.some((i) => i.includes('fiat instrument'))) {
      recommendations.push('Add fiat currency references for financial gravity')
      recommendations.push('Mention USD, EUR, or CNY in context of market impact')
    }

    if (issues.some((i) => i.includes('verification footer'))) {
      recommendations.push('Add verification footer with cryptographic hash')
      recommendations.push('Include confidence rating and Council of Five signature')
    }

    return recommendations
  }

  /**
   * Apply protocol to single content
   */
  async processSingleContent(
    content: string,
    language: Language,
    confidenceScore: number = 98.4
  ): Promise<ProcessedContent> {
    const processed = processSIAMasterProtocol(content, language, {
      enableGlobalLexicon: true,
      enableScarcityTone: true,
      enableFinancialGravity: true,
      enableVerificationFooter: true,
      confidenceScore,
    })

    return processed
  }

  /**
   * Calculate overall protocol compliance score
   */
  calculateOverallScore(
    reports: Record<Language, ProtocolComplianceResult>
  ): number {
    const scores = Object.values(reports).map((r) => r.score)
    return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
  }
}

// Singleton instance
let protocolProcessorInstance: ProtocolProcessor | null = null

export function getProtocolProcessor(): ProtocolProcessor {
  if (!protocolProcessorInstance) {
    protocolProcessorInstance = new ProtocolProcessor()
  }
  return protocolProcessorInstance
}
