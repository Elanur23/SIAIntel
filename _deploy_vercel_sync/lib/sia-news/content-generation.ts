/**
 * Content Generation Layer
 * Integrates with adsense-compliant-writer and predictive-sentiment-analyzer
 * Generates complete articles with 3-layer structure, technical glossary, and sentiment analysis
 * Enhanced with Auto-Silo Internal Linking
 */

import {
  generateAdSenseCompliantContent,
  type ContentGenerationRequest as AdSenseRequest,
  type AdSenseCompliantContent
} from '@/lib/ai/adsense-compliant-writer'
import {
  generatePredictiveSentiment,
  type SentimentAnalysisResult,
  type PredictiveSentimentScore
} from '@/lib/ai/predictive-sentiment-analyzer'
import {
  enhanceWithEEATProtocols,
  type EEATProtocolsRequest,
  type EEATProtocolsResult
} from '@/lib/ai/eeat-protocols-orchestrator'
import type { ReasoningChain } from '@/lib/ai/quantum-expertise-signaler'
import type { InverseEntity } from '@/lib/ai/semantic-entity-mapper'
import { generateAdPlacementStrategy } from './adsense-placement-optimizer'
import { smartInsertLinks } from '@/lib/seo/auto-silo-linking'
import type {
  ContentGenerationRequest,
  GeneratedArticle,
  GlossaryEntry,
  SentimentScore,
  Language,
  Region,
  VerifiedData,
  CausalChain,
  EntityMapping,
  RewrittenContent
} from './types'

// ============================================================================
// CORE CONTENT GENERATION
// ============================================================================

/**
 * Generate complete article with all components
 * Integrates with adsense-compliant-writer for content generation
 * Enhanced with E-E-A-T protocols orchestrator and Auto-Silo Linking
 */
export async function generateArticle(
  request: ContentGenerationRequest
): Promise<GeneratedArticle> {
  const startTime = Date.now()
  
  // Prepare AdSense-compliant content request
  const rawNews = buildRawNewsFromData(request.verifiedData, request.causalChains)
  
  // Map language to AdSense-compatible language (exclude 'ru' if not supported)
  const adSenseLanguage = request.language === 'ru' ? 'en' : request.language
  
  const adSenseRequest: AdSenseRequest = {
    rawNews,
    asset: request.asset,
    language: adSenseLanguage as any, // Type assertion for language compatibility
    includeOnChainData: true,
    confidenceScore: request.confidenceScore
  }

  // Generate AdSense-compliant content
  const adSenseContent = await generateAdSenseCompliantContent(adSenseRequest)
  
  // Generate headline with metrics
  const headline = generateHeadline(
    request.verifiedData,
    request.causalChains,
    request.asset,
    request.language
  )
  
  // Build technical glossary
  const technicalGlossary = await buildTechnicalGlossary(
    adSenseContent.fullContent,
    request.entities,
    request.language
  )
  
  // Calculate sentiment with entity-level breakdown
  const sentiment = await calculateSentiment(
    adSenseContent.fullContent,
    request.entities,
    request.causalChains,
    request.asset,
    request.language
  )
  
  // ========================================================================
  // E-E-A-T PROTOCOLS ENHANCEMENT
  // ========================================================================
  
  // Prepare reasoning chains from causal chains
  const reasoningChains: ReasoningChain[] = convertCausalChainsToReasoningChains(
    request.causalChains,
    request.asset
  )
  
  // Prepare inverse entities from entity mappings
  const inverseEntities: InverseEntity[] = convertEntityMappingsToInverseEntities(
    request.entities
  )
  
  // Build sentiment analysis result for E-E-A-T
  const sentimentResult: SentimentAnalysisResult = {
    fearGreedIndex: sentiment.overall,
    sentimentCategory: determineSentimentCategory(sentiment.overall),
    divergenceDetected: Math.abs(sentiment.overall - 50) < 15,
    confidence: sentiment.confidence
  }
  
  // Extract data sources from verified data
  const dataSources = extractSources(request.verifiedData)
  
  // Prepare E-E-A-T protocols request
  const eeATRequest: EEATProtocolsRequest = {
    content: adSenseContent.fullContent,
    topic: request.regionalContent.economicPsychology,
    asset: request.asset,
    language: request.language,
    reasoningChains,
    inverseEntities,
    sentimentResult,
    dataSources,
    methodology: 'Multi-modal reasoning with Google Search grounding',
    baseConfidenceScore: request.confidenceScore,
    targetEEATScore: 95
  }
  
  // Enhance content with E-E-A-T protocols
  let eeATResult: EEATProtocolsResult | null = null
  let enhancedEEATScore = adSenseContent.metadata.eeatScore
  
  try {
    eeATResult = await enhanceWithEEATProtocols(eeATRequest)
    enhancedEEATScore = eeATResult.enhancedEEATScore
  } catch (error) {
    console.error('E-E-A-T enhancement failed, using base score:', error)
  }
  
  // ========================================================================
  // CONTENT ASSEMBLY WITH E-E-A-T ENHANCEMENTS
  // ========================================================================
  
  // Format full content with E-E-A-T enhancements
  const rawFormattedContent = formatFullContentWithEEAT(
    adSenseContent.summary,
    adSenseContent.siaInsight,
    adSenseContent.riskDisclaimer,
    technicalGlossary,
    eeATResult,
    request.language
  )

  // ========================================================================
  // AUTO-SILO INTERNAL LINKING ENHANCEMENT
  // ========================================================================

  // Apply smart internal linking for SEO Silo structure
  const linkingResult = smartInsertLinks(
    rawFormattedContent,
    request.language,
    {
      maxLinksPerKeyword: 1,
      maxTotalLinks: 8,
      avoidHeadings: true
    }
  )

  const fullContent = linkingResult.linkedContent

  // Validate content quality
  const qualityValidation = validateContentQuality(
    headline,
    fullContent,
    technicalGlossary,
    sentiment,
    adSenseContent.metadata
  )
  
  if (!qualityValidation.isValid) {
    throw new Error(`Content quality validation failed: ${qualityValidation.issues.join(', ')}`)
  }
  
  const processingTime = Date.now() - startTime
  
  // Assemble final article with E-E-A-T metadata
  const article: GeneratedArticle = {
    id: generateArticleId(),
    language: request.language,
    region: request.regionalContent.region,
    
    // Content layers
    headline,
    summary: adSenseContent.summary,
    siaInsight: adSenseContent.siaInsight,
    riskDisclaimer: adSenseContent.riskDisclaimer,
    fullContent,
    
    // Technical components
    technicalGlossary,
    sentiment,
    entities: request.entities,
    causalChains: request.causalChains,
    
    // Metadata with E-E-A-T enhancements
    metadata: {
      generatedAt: new Date().toISOString(),
      confidenceScore: request.confidenceScore,
      eeatScore: enhancedEEATScore,
      wordCount: adSenseContent.metadata.wordCount,
      readingTime: adSenseContent.metadata.readingTime,
      sources: dataSources,
      processingTime,
      // Add E-E-A-T protocol metadata
      eeATProtocols: eeATResult ? {
        quantumExpertiseSignals: eeATResult.quantumExpertise.length,
        transparencyLayers: eeATResult.transparencyLayers.layers.length,
        semanticEntities: eeATResult.semanticEntityMap.entityCount,
        authorityManifestoScore: eeATResult.authorityManifesto.authorityManifestoScore,
        verificationScore: eeATResult.eeATVerification.verificationCompletenessScore,
        protocolBonuses: eeATResult.protocolBonuses,
        errors: eeATResult.errors
      } : undefined
    },
    
    // Quality scores
    eeatScore: enhancedEEATScore,
    originalityScore: adSenseContent.metadata.originalityScore,
    technicalDepth: adSenseContent.metadata.technicalDepth.toUpperCase() as 'HIGH' | 'MEDIUM' | 'LOW',
    adSenseCompliant: true
  }
  
  // Generate ad placement strategy
  const adPlacementStrategy = generateAdPlacementStrategy(article)
  
  // Add ad placement metadata
  article.metadata.adPlacement = {
    totalSlots: adPlacementStrategy.totalSlots,
    estimatedRevenuePerView: adPlacementStrategy.estimatedRevenue.perView,
    estimatedRevenuePer1000Views: adPlacementStrategy.estimatedRevenue.per1000Views,
    estimatedMonthlyRevenue: adPlacementStrategy.estimatedRevenue.monthly
  }
  
  return article
}

// ... rest of the helper functions remain unchanged ...

// ============================================================================
// HEADLINE GENERATION
// ============================================================================

export function generateHeadline(
  verifiedData: VerifiedData,
  causalChains: CausalChain[],
  asset: string,
  language: Language
): string {
  const keyMetric = extractKeyMetric(verifiedData)
  const primaryEntity = verifiedData.extractedData.entityReferences[0] || asset
  const action = causalChains.length > 0
    ? extractActionVerb(causalChains[0], language)
    : getDefaultAction(language)
  
  const templates: Record<Language, string> = {
    en: `${primaryEntity} ${action} ${keyMetric.value}${keyMetric.unit}`,
    tr: `${primaryEntity} ${keyMetric.value}${keyMetric.unit} ${action}`,
    de: `${primaryEntity} ${action} ${keyMetric.value}${keyMetric.unit}`,
    fr: `${primaryEntity} ${action} ${keyMetric.value}${keyMetric.unit}`,
    es: `${primaryEntity} ${action} ${keyMetric.value}${keyMetric.unit}`,
    ru: `${primaryEntity} ${action} ${keyMetric.value}${keyMetric.unit}`,
    ar: `${primaryEntity} ${action} ${keyMetric.value}${keyMetric.unit}`,
    jp: `${primaryEntity} ${action} ${keyMetric.value}${keyMetric.unit}`,
    zh: `${primaryEntity} ${action} ${keyMetric.value}${keyMetric.unit}`
  }
  
  let headline = templates[language]
  if (headline.length < 60) {
    headline = expandHeadline(headline, verifiedData, language)
  } else if (headline.length > 80) {
    headline = truncateHeadline(headline, 80)
  }
  return headline
}

function extractKeyMetric(verifiedData: VerifiedData): { value: number; unit: string } {
  const numericalValues = verifiedData.extractedData.numericalValues
  if (numericalValues.length === 0) return { value: 0, unit: '' }
  const percentageMetric = numericalValues.find(v => v.unit === '%')
  if (percentageMetric) return { value: percentageMetric.value, unit: percentageMetric.unit }
  return { value: numericalValues[0].value, unit: numericalValues[0].unit }
}

function extractActionVerb(causalChain: CausalChain, language: Language): string {
  const actionVerbs: Record<Language, Record<string, string>> = {
    en: { increase: 'Surges', decrease: 'Drops', stable: 'Holds' },
    tr: { increase: 'Yükseldi', decrease: 'Düştü', stable: 'Sabit Kaldı' },
    de: { increase: 'Steigt', decrease: 'Fällt', stable: 'Bleibt' },
    fr: { increase: 'Augmente', decrease: 'Chute', stable: 'Reste' },
    es: { increase: 'Sube', decrease: 'Cae', stable: 'Se Mantiene' },
    ru: { increase: 'Растёт', decrease: 'Падает', stable: 'Держится' },
    ar: { increase: 'يرتفع', decrease: 'ينخفض', stable: 'يستقر' },
    jp: { increase: '急騰', decrease: '下落', stable: '横ばい' },
    zh: { increase: '上涨', decrease: '下跌', stable: '持稳' }
  }
  const description = causalChain.finalOutcome.description.toLowerCase()
  if (description.includes('increase') || description.includes('surge') || description.includes('rise')) {
    return actionVerbs[language].increase
  } else if (description.includes('decrease') || description.includes('drop') || description.includes('fall')) {
    return actionVerbs[language].decrease
  }
  return actionVerbs[language].stable
}

function getDefaultAction(language: Language): string {
  const defaults: Record<Language, string> = {
    en: 'Moves', tr: 'Hareket Etti', de: 'Bewegt', fr: 'Bouge', es: 'Se Mueve', ru: 'Движется', ar: 'يتحرك', jp: '動く', zh: '波动'
  }
  return defaults[language]
}

function expandHeadline(headline: string, verifiedData: VerifiedData, language: Language): string {
  const expansions: Record<Language, string> = {
    en: ' Following Market Activity', tr: ' Piyasa Hareketleri Sonrası', de: ' Nach Marktaktivität', fr: ' Suite à l\'Activité du Marché', es: ' Tras Actividad del Mercado', ru: ' После Рыночной Активности', ar: ' بعد نشاط السوق', jp: ' 市場動向を受けて', zh: ' 市场活动后'
  }
  return headline + expansions[language]
}

function truncateHeadline(headline: string, maxLength: number): string {
  if (headline.length <= maxLength) return headline
  return headline.substring(0, maxLength - 3) + '...'
}

export async function buildTechnicalGlossary(
  content: string,
  entities: EntityMapping[],
  language: Language
): Promise<GlossaryEntry[]> {
  const glossary: GlossaryEntry[] = []
  const addedTerms = new Set<string>()
  const technicalTerms = extractTechnicalTerms(content, language)
  for (const entity of entities.slice(0, 3)) {
    if (addedTerms.has(entity.primaryName)) continue
    const definition = entity.definitions[language] || entity.primaryName
    glossary.push({ term: entity.primaryName, definition, language, schemaMarkup: generateSchemaMarkup(entity.primaryName, definition) })
    addedTerms.add(entity.primaryName)
  }
  for (const term of technicalTerms) {
    if (glossary.length >= 3) break
    if (addedTerms.has(term)) continue
    const definition = await generateTermDefinition(term, language)
    glossary.push({ term, definition, language, schemaMarkup: generateSchemaMarkup(term, definition) })
    addedTerms.add(term)
  }
  return glossary
}

function extractTechnicalTerms(content: string, language: Language): string[] {
  const technicalPatterns: Record<Language, string[]> = {
    en: ['on-chain', 'liquidity', 'whale', 'exchange', 'volatility', 'accumulation', 'divergence'],
    tr: ['zincir üstü', 'likidite', 'balina', 'borsa', 'volatilite', 'birikim', 'farklılık'],
    de: ['On-Chain', 'Liquidität', 'Wal', 'Börse', 'Volatilität', 'Akkumulation', 'Divergenz'],
    fr: ['on-chain', 'liquidité', 'baleine', 'exchange', 'volatilité', 'accumulation', 'divergence'],
    es: ['on-chain', 'liquidez', 'ballena', 'exchange', 'volatilidad', 'acumulación', 'divergencia'],
    ru: ['он-чейн', 'ликвидность', 'кит', 'биржа', 'волатильность', 'накопление', 'дивергенция'],
    ar: ['أون تشين', 'سيولة', 'حوت', 'بورصة', 'تقلب', 'تراكم', 'تباعد'],
    jp: ['オンチェーン', '流動性', 'クジラ', '取引所', 'ボラティリティ', '蓄積', 'ダイバージェンス'],
    zh: ['链上', '流动性', '巨鲸', '交易所', '波动率', '积累', '背离']
  }
  const patterns = technicalPatterns[language]
  const foundTerms: string[] = []
  for (const pattern of patterns) {
    if (content.toLowerCase().includes(pattern.toLowerCase())) {
      foundTerms.push(pattern)
    }
  }
  return foundTerms
}

async function generateTermDefinition(term: string, language: Language): Promise<string> {
  const definitions: Record<Language, Record<string, string>> = {
    en: { 'on-chain': 'Data recorded directly on the blockchain', 'liquidity': 'Ease of buying/selling', 'whale': 'Large holder', 'exchange': 'Trading platform', 'volatility': 'Price variation', 'accumulation': 'Buying process', 'divergence': 'Indicator mismatch' },
    tr: { 'zincir üstü': 'Blokzincir verisi', 'likidite': 'Alım satım kolaylığı', 'balina': 'Büyük yatırımcı', 'borsa': 'İşlem platformu', 'volatilite': 'Fiyat oynaklığı', 'birikim': 'Toplama süreci', 'farklılık': 'Uyumsuzluk' },
    fr: { 'on-chain': 'Données sur la blockchain', 'liquidity': 'Liquidité', 'whale': 'Baleine', 'exchange': 'Bourse', 'volatility': 'Volatilité', 'accumulation': 'Accumulation', 'divergence': 'Divergence' },
    de: { 'on-chain': 'On-Chain-Daten', 'liquidity': 'Liquidität', 'whale': 'Wal', 'exchange': 'Börse', 'volatility': 'Volatilität', 'accumulation': 'Akkumulation', 'divergence': 'Divergenz' },
    es: { 'on-chain': 'Datos en cadena', 'liquidity': 'Liquidez', 'whale': 'Ballena', 'exchange': 'Intercambio', 'volatility': 'Volatilidad', 'accumulation': 'Acumulación', 'divergence': 'Divergencia' },
    ru: { 'on-chain': 'Он-чейн данные', 'liquidity': 'Ликвидность', 'whale': 'Кит', 'exchange': 'Биржа', 'volatility': 'Волатильность', 'accumulation': 'Накопление', 'divergence': 'Дивергенция' },
    ar: { 'on-chain': 'بيانات على السلسلة', 'liquidity': 'سيولة', 'whale': 'حوت', 'exchange': 'بورصة', 'volatility': 'تقلب', 'accumulation': 'تراكم', 'divergence': 'تباعد' },
    jp: { 'on-chain': 'オンチェーンデータ', 'liquidity': '流動性', 'whale': 'クジラ', 'exchange': '取引所', 'volatility': 'ボラティリティ', 'accumulation': '蓄積', 'divergence': 'ダイバージェンス' },
    zh: { 'on-chain': '链上数据', 'liquidity': '流动性', 'whale': '巨鲸', 'exchange': '交易所', 'volatility': '波动性', 'accumulation': '积累', 'divergence': '背离' }
  }
  const langDefinitions = definitions[language]
  return langDefinitions?.[term.toLowerCase()] ?? langDefinitions?.[term] ?? `Technical term: ${term}`
}

function generateSchemaMarkup(term: string, definition: string): string {
  return JSON.stringify({ '@context': 'https://schema.org', '@type': 'DefinedTerm', 'name': term, 'description': definition })
}

export async function calculateSentiment(
  content: string,
  entities: EntityMapping[],
  causalChains: CausalChain[],
  asset: string,
  language: Language
): Promise<SentimentScore> {
  const sentimentResult = analyzeSentimentFromContent(content, causalChains)
  const byEntity = calculateEntitySentiment(entities, causalChains, content)
  return { overall: sentimentResult.fearGreedIndex, zone: determineSentimentZone(sentimentResult.fearGreedIndex), byEntity, confidence: sentimentResult.confidence, timestamp: new Date().toISOString() }
}

function analyzeSentimentFromContent(content: string, causalChains: CausalChain[]): SentimentAnalysisResult {
  let sentimentScore = 50
  const positiveTerms = ['surge', 'increase', 'growth', 'accumulation', 'bullish', 'rally']
  const negativeTerms = ['drop', 'decrease', 'decline', 'fear', 'bearish', 'crash']
  const contentLower = content.toLowerCase()
  positiveTerms.forEach(term => { if (contentLower.includes(term)) sentimentScore += 5 })
  negativeTerms.forEach(term => { if (contentLower.includes(term)) sentimentScore -= 5 })
  causalChains.forEach(chain => {
    const outcomeDesc = chain.finalOutcome.description.toLowerCase()
    if (outcomeDesc.includes('increase') || outcomeDesc.includes('positive')) sentimentScore += 10
    else if (outcomeDesc.includes('decrease') || outcomeDesc.includes('negative')) sentimentScore -= 10
  })
  sentimentScore = Math.max(0, Math.min(100, sentimentScore))
  return { fearGreedIndex: sentimentScore, sentimentCategory: determineSentimentCategory(sentimentScore), divergenceDetected: Math.abs(sentimentScore - 50) < 15, confidence: Math.min(100, Math.abs(sentimentScore - 50) * 2) }
}

function determineSentimentCategory(score: number): 'EXTREME_FEAR' | 'FEAR' | 'NEUTRAL' | 'GREED' | 'EXTREME_GREED' {
  if (score < 20) return 'EXTREME_FEAR'
  if (score < 40) return 'FEAR'
  if (score < 60) return 'NEUTRAL'
  if (score < 80) return 'GREED'
  return 'EXTREME_GREED'
}

function determineSentimentZone(score: number): 'EXTREME_FEAR' | 'FEAR' | 'NEUTRAL' | 'GREED' | 'EXTREME_GREED' {
  return determineSentimentCategory(score)
}

function calculateEntitySentiment(entities: EntityMapping[], causalChains: CausalChain[], content: string): Record<string, number> {
  const entitySentiment: Record<string, number> = {}
  entities.forEach(entity => {
    let score = 50
    const mentions = findEntityMentions(entity.primaryName, content)
    mentions.forEach(mention => {
      const context = mention.context.toLowerCase()
      if (context.includes('increase') || context.includes('positive')) score += 10
      else if (context.includes('decrease') || context.includes('negative')) score -= 10
    })
    entitySentiment[entity.primaryName] = Math.max(-100, Math.min(100, score - 50))
  })
  return entitySentiment
}

function findEntityMentions(entityName: string, content: string): Array<{ context: string }> {
  const mentions: Array<{ context: string }> = []
  const sentences = content.split(/[.!?]+/)
  sentences.forEach(sentence => { if (sentence.toLowerCase().includes(entityName.toLowerCase())) mentions.push({ context: sentence.trim() }) })
  return mentions
}

export function formatFullContentWithEEAT(
  summary: string,
  siaInsight: string,
  riskDisclaimer: string,
  technicalGlossary: GlossaryEntry[],
  eeATResult: EEATProtocolsResult | null,
  language: Language
): string {
  const sections: string[] = []
  if (eeATResult?.authorityManifesto?.content) sections.push(`${eeATResult.authorityManifesto.content}\n`)
  sections.push(`${summary}\n`)
  sections.push(`${siaInsight}\n`)
  if (eeATResult?.quantumExpertise?.length) {
    const validSignals = eeATResult.quantumExpertise.slice(0, 2).filter(s => s.causalProofs.length > 0)
    if (validSignals.length > 0) {
      sections.push(`\n${getExpertiseHeader(language)}\n`)
      validSignals.forEach(s => sections.push(`• ${s.causalProofs[0].premise} → ${s.causalProofs[0].effect}`))
    }
  }
  if (eeATResult?.transparencyLayers?.layers?.length) {
    sections.push(`\n${getTransparencyHeader(language)}\n`)
    eeATResult.transparencyLayers.layers.slice(0, 3).forEach((l, i) => sections.push(`${i + 1}. ${l.citation}`))
  }
  if (technicalGlossary.length > 0) {
    sections.push(`\n${getGlossaryHeader(language)}\n`)
    technicalGlossary.forEach(e => sections.push(`• ${e.term}: ${e.definition}`))
  }
  if (eeATResult?.eeATVerification?.content) sections.push(`\n${eeATResult.eeATVerification.content}\n`)
  sections.push(`\n${riskDisclaimer}`)
  return sections.join('\n')
}

function getTransparencyHeader(language: Language): string {
  const headers: Record<Language, string> = {
    en: '📊 Data Sources & Verification',
    tr: '📊 Veri Kaynakları ve Doğrulama',
    de: '📊 Datenquellen & Verifizierung',
    fr: '📊 Sources de données & vérification',
    es: '📊 Fuentes de datos y verificación',
    ru: '📊 Источники данных и проверка',
    ar: '📊 مصادر البيانات والتحقق',
    jp: '📊 データソースと検証',
    zh: '📊 数据源与验证'
  }
  return headers[language] || headers.en
}

function getExpertiseHeader(language: Language): string {
  const headers: Record<Language, string> = {
    en: '🔬 Historical Validation',
    tr: '🔬 Tarihsel Doğrulama',
    de: '🔬 Historische Validierung',
    fr: '🔬 Validation historique',
    es: '🔬 Validación histórica',
    ru: '🔬 Историческая проверка',
    ar: '🔬 التحقق التاريخي',
    jp: '🔬 歴史的検証',
    zh: '🔬 历史验证'
  }
  return headers[language] || headers.en
}

function getGlossaryHeader(language: Language): string {
  const headers: Record<Language, string> = {
    en: '📚 Technical Terms',
    tr: '📚 Teknik Terimler',
    de: '📚 Technische Begriffe',
    fr: '📚 Termes techniques',
    es: '📚 Términos técnicos',
    ru: '📚 Технические термины',
    ar: '📚 المصطلحات الفنية',
    jp: '📚 テクニカル用語',
    zh: '📚 技术术语'
  }
  return headers[language] || headers.en
}

export function validateContentQuality(
  headline: string,
  fullContent: string,
  technicalGlossary: GlossaryEntry[],
  sentiment: SentimentScore,
  metadata: any
): { isValid: boolean; issues: string[] } {
  const issues: string[] = []

  // Word count algorithm - CJK aware
  const countWords = (text: string): number => {
    if (!text) return 0
    const cjk = (text.match(/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/g) || []).length
    if (cjk > 30) return Math.round(cjk / 2)
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  const actualWordCount = countWords(fullContent)

  if (headline.length < 60 || headline.length > 80) issues.push('Headline length mismatch (Target: 60-80 chars)')

  // SIA Master Protocol v6.1 - Depth Enforcement (850-950 words)
  if (actualWordCount < 850) {
    issues.push(`Content depth too low: ${actualWordCount} words (SIA Target: 850-950)`)
  }

  return { isValid: issues.length === 0, issues }
}

function buildRawNewsFromData(verifiedData: VerifiedData, causalChains: CausalChain[]): string {
  return `Source: ${verifiedData.source}\nEntities: ${verifiedData.extractedData.entityReferences.join(', ')}`
}

function extractSources(verifiedData: VerifiedData): string[] {
  return [verifiedData.source]
}

function generateArticleId(): string {
  return `sia-news-${Date.now()}`
}

function convertCausalChainsToReasoningChains(causalChains: CausalChain[], asset: string): ReasoningChain[] {
  return causalChains.map(c => ({ steps: [{ premise: c.triggerEvent.description, implication: 'Direct', conclusion: c.finalOutcome.description }], topic: `${asset} analysis`, asset }))
}

function convertEntityMappingsToInverseEntities(entities: EntityMapping[]): InverseEntity[] {
  return entities.map(e => ({ primaryEntity: e.primaryName, inverseEntity: `Not ${e.primaryName}`, correlationCoefficient: 0.9 }))
}
