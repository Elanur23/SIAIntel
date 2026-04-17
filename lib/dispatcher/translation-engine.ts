/**
 * Translation Engine
 * Gemini 1.5 Pro 002 powered translation service
 * Handles batch translation with caching and quality validation
 */

import { callGeminiCentral } from '../neural-assembly/gemini-central-provider'
import crypto from 'crypto'
import type {
  Language,
  TranslationResult,
  CachedTranslation,
} from './types'

interface GeminiConfig {
  temperature: number
  topP: number
  maxOutputTokens: number
}

interface QualityScore {
  score: number
  issues: string[]
  lengthRatio: number
  hasProtectedTerms: boolean
}

export class TranslationEngine {
  private cache: Map<string, CachedTranslation> = new Map()
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

  constructor() {
    // Gemini client is now handled centrally via callGeminiCentral
  }

  /**
   * Translate content to multiple languages in batch
   */
  async translateBatch(
    content: string,
    sourceLanguage: Language,
    targetLanguages: Language[]
  ): Promise<Record<Language, TranslationResult>> {
    const results: Record<string, TranslationResult> = {}
    const contentHash = this.generateContentHash(content)

    // Process translations in parallel
    const promises = targetLanguages.map(async (targetLang) => {
      try {
        // Check cache first
        const cached = this.getCachedTranslation(contentHash, targetLang)
        if (cached) {
          console.log(`[TRANSLATION_ENGINE] Cache hit for ${targetLang}`)
          cached.hitCount++
          return { lang: targetLang, result: cached.translation }
        }

        // Translate
        const startTime = Date.now()
        const translation = await this.translate(
          content,
          sourceLanguage,
          targetLang
        )
        const processingTime = Date.now() - startTime

        const result: TranslationResult = {
          language: targetLang,
          ...translation,
          processingTime,
        }

        // Cache the result
        this.cacheTranslation(contentHash, targetLang, result)

        return { lang: targetLang, result }
      } catch (error: any) {
        console.error(`[TRANSLATION_ENGINE] Error translating to ${targetLang}:`, error)
        throw new Error(`Translation failed for ${targetLang}: ${error.message}`)
      }
    })

    const translations = await Promise.all(promises)

    // Build results object
    for (const { lang, result } of translations) {
      results[lang] = result
    }

    return results as Record<Language, TranslationResult>
  }

  /**
   * Translate content to a single language
   */
  private async translate(
    content: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): Promise<Omit<TranslationResult, 'language' | 'processingTime'>> {
    const prompt = this.buildTranslationPrompt(content, sourceLanguage, targetLanguage)

    try {
      const result = await callGeminiCentral({
        context: {
          module: 'TranslationEngine',
          function: 'translate',
          purpose: 'translation',
        },
        model: 'gemini-1.5-pro-002',
        prompt,
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          maxOutputTokens: 8192,
        },
      })

      return this.parseTranslationResponse(result.text, targetLanguage)
    } catch (error: any) {
      console.error('[TRANSLATION_ENGINE] Central Gemini API error:', error)
      throw new Error(`Central Gemini API error: ${error.message}`)
    }
  }

  /**
   * Build translation prompt for Gemini
   */
  private buildTranslationPrompt(
    content: string,
    sourceLanguage: Language,
    targetLanguage: Language
  ): string {
    const languageNames: Record<Language, string> = {
      en: 'English',
      tr: 'Turkish',
      de: 'German',
      fr: 'French',
      es: 'Spanish',
      ru: 'Russian',
      ar: 'Arabic',
      jp: 'Japanese',
      zh: 'Chinese (Simplified)',
    }

    return `ACT AS: Professional Financial Translator & Content Specialist

TASK: Translate financial intelligence content from ${languageNames[sourceLanguage]} to ${languageNames[targetLanguage]}

SOURCE CONTENT:
${content}

TRANSLATION REQUIREMENTS:

1. ACCURACY:
   - Maintain technical accuracy for all financial terms
   - Preserve numerical data exactly
   - Keep proper nouns in original form
   - Maintain paragraph structure

2. PROTECTED TERMS (Never translate):
   - DePIN, RWA, CBDC, TVL, APY, APR, DeFi, NFT, DAO, DEX, CEX
   - Layer-1, Layer-2, Proof-of-Work, Proof-of-Stake, Smart Contract
   - GDP, CPI, PCE, Fed Funds Rate, Quantitative Easing, QE
   - SIA_SENTINEL, CENTINEL_NODE, Council of Five

3. TONE & STYLE:
   - Professional financial journalism
   - Bloomberg/Reuters style
   - Technical but accessible
   - Authoritative and confident

4. CULTURAL ADAPTATION:
   - Adapt idioms and expressions naturally
   - Use culturally appropriate examples
   - Maintain professional formality

5. STRUCTURE:
   Generate complete article with:
   
   TITLE: Compelling headline (60 chars max)
   
   SUMMARY (Layer 1 - ÖZET):
   - 2-3 sentences
   - 5W1H format (Who, What, Where, When, Why, How)
   - Professional journalism tone
   
   SIA_INSIGHT (Layer 2):
   - "According to SIA_SENTINEL proprietary analysis..."
   - Include specific metrics and data
   - 80-120 words
   
   RISK_DISCLAIMER (Layer 3):
   - Context-specific financial disclaimer
   - Professional tone
   - 60-100 words
   
   FULL_CONTENT:
   - Complete translated article
   - 300+ words minimum
   - Maintain all technical depth
   - Preserve formatting
   
   META_DESCRIPTION:
   - Exactly 160 characters
   - Include primary keyword
   - Action verb + metric
   
   KEYWORDS:
   - 5-8 relevant keywords
   - Mix of broad and specific terms

OUTPUT FORMAT: JSON
{
  "title": "Translated title",
  "fullContent": "Full translated content",
  "summary": "Layer 1 summary",
  "siaInsight": "Layer 2 insight",
  "riskDisclaimer": "Layer 3 disclaimer",
  "metaDescription": "160 char description",
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "eeatScore": 95
}

QUALITY STANDARDS:
- Translation accuracy: 95%+
- Technical term preservation: 100%
- Tone consistency: Professional
- Length: Within 20% of source
- Readability: Native-level fluency`
  }

  /**
   * Parse Gemini translation response
   */
  private parseTranslationResponse(
    response: string,
    targetLanguage: Language
  ): Omit<TranslationResult, 'language' | 'processingTime'> {
    try {
      // Extract JSON from response
      const jsonMatch =
        response.match(/```json\n([\s\S]*?)\n```/) || response.match(/\{[\s\S]*\}/)

      if (!jsonMatch) {
        throw new Error('No valid JSON found in response')
      }

      const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])

      return {
        title: parsed.title || '',
        fullContent: parsed.fullContent || parsed.content || '',
        summary: parsed.summary || '',
        siaInsight: parsed.siaInsight || '',
        riskDisclaimer: parsed.riskDisclaimer || '',
        metaDescription: parsed.metaDescription || '',
        keywords: parsed.keywords || [],
        eeatScore: parsed.eeatScore || parsed.qualityScore || 85,
      }
    } catch (error: any) {
      console.error('[TRANSLATION_ENGINE] Parse error:', error)
      throw new Error(`Failed to parse translation response: ${error.message}`)
    }
  }

  /**
   * Validate translation quality
   */
  async validateTranslationQuality(
    source: string,
    translation: string,
    targetLanguage: Language
  ): Promise<QualityScore> {
    const issues: string[] = []

    // Check 1: Length ratio (should be within 20% of source)
    const sourceLength = source.split(/\s+/).length
    const translationLength = translation.split(/\s+/).length
    const lengthRatio = translationLength / sourceLength

    if (lengthRatio < 0.8 || lengthRatio > 1.2) {
      issues.push(
        `Length ratio ${(lengthRatio * 100).toFixed(0)}% is outside acceptable range (80-120%)`
      )
    }

    // Check 2: Protected terms preservation
    const protectedTerms = [
      'DePIN',
      'RWA',
      'CBDC',
      'TVL',
      'APY',
      'DeFi',
      'NFT',
      'DAO',
      'SIA_SENTINEL',
    ]
    const hasProtectedTerms = protectedTerms.some((term) =>
      source.toLowerCase().includes(term.toLowerCase())
    )

    if (hasProtectedTerms) {
      const allPreserved = protectedTerms.every((term) => {
        if (source.toLowerCase().includes(term.toLowerCase())) {
          return translation.includes(term)
        }
        return true
      })

      if (!allPreserved) {
        issues.push('Some protected terms were not preserved in translation')
      }
    }

    // Check 3: Paragraph count
    const sourceParagraphs = source.split('\n\n').length
    const translationParagraphs = translation.split('\n\n').length

    if (Math.abs(sourceParagraphs - translationParagraphs) > 2) {
      issues.push('Paragraph structure differs significantly from source')
    }

    // Calculate overall score
    let score = 100
    score -= issues.length * 10
    score = Math.max(0, Math.min(100, score))

    return {
      score,
      issues,
      lengthRatio,
      hasProtectedTerms,
    }
  }

  /**
   * Generate content hash for caching
   */
  private generateContentHash(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16)
  }

  /**
   * Get cached translation
   */
  private getCachedTranslation(
    contentHash: string,
    targetLanguage: Language
  ): CachedTranslation | null {
    const cacheKey = `${contentHash}-${targetLanguage}`
    const cached = this.cache.get(cacheKey)

    if (!cached) return null

    // Check if expired
    const now = Date.now()
    const expiresAt = new Date(cached.expiresAt).getTime()

    if (now > expiresAt) {
      this.cache.delete(cacheKey)
      return null
    }

    return cached
  }

  /**
   * Cache translation result
   */
  private cacheTranslation(
    contentHash: string,
    targetLanguage: Language,
    result: TranslationResult
  ): void {
    const cacheKey = `${contentHash}-${targetLanguage}`
    const now = new Date()
    const expiresAt = new Date(now.getTime() + this.CACHE_TTL)

    const cached: CachedTranslation = {
      contentHash,
      sourceLanguage: 'en', // Assuming English source for now
      targetLanguage,
      translation: result,
      eeatScore: result.eeatScore,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      hitCount: 0,
    }

    this.cache.set(cacheKey, cached)
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache(): number {
    const now = Date.now()
    let cleared = 0

    for (const [key, cached] of this.cache.entries()) {
      const expiresAt = new Date(cached.expiresAt).getTime()
      if (now > expiresAt) {
        this.cache.delete(key)
        cleared++
      }
    }

    return cleared
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): {
    size: number
    hitRate: number
    avgQualityScore: number
  } {
    const entries = Array.from(this.cache.values())
    const totalHits = entries.reduce((sum, entry) => sum + entry.hitCount, 0)
    const avgQualityScore =
      entries.reduce((sum, entry) => sum + entry.eeatScore, 0) / entries.length || 0

    return {
      size: entries.length,
      hitRate: totalHits / Math.max(entries.length, 1),
      avgQualityScore: Math.round(avgQualityScore),
    }
  }
}

// Singleton instance
let translationEngineInstance: TranslationEngine | null = null

export function getTranslationEngine(): TranslationEngine {
  if (!translationEngineInstance) {
    translationEngineInstance = new TranslationEngine()
  }
  return translationEngineInstance
}
