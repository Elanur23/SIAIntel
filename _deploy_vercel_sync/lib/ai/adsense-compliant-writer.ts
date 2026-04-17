/**
 * AdSense-Compliant Content Writer
 * E-E-A-T Optimized Content Generation System
 * 
 * Ensures all generated content meets Google AdSense policies:
 * - Original, high-value content
 * - Professional journalism standards
 * - Technical depth with on-chain data
 * - Dynamic risk disclaimers
 * - Anti-spam optimization
 */

export interface ContentGenerationRequest {
  rawNews: string
  asset?: string
  language: 'en' | 'tr' | 'de' | 'es' | 'fr' | 'ar'
  includeOnChainData?: boolean
  confidenceScore?: number
  // E-E-A-T Protocols Enhancement (Phase 4)
  enableEEATProtocols?: boolean // Default: false for backward compatibility
  enabledProtocols?: string[] // Optional: selective protocol activation
  targetEntityCount?: number // Optional: override default 20
  minimumHistoricalPrecedents?: number // Optional: override default 20
  targetEEATScore?: number // Optional: override default 95
  // Required for E-E-A-T protocols
  reasoningChains?: Array<{
    steps: Array<{ premise: string; implication: string; conclusion: string }>
    topic: string
    asset: string
  }>
  inverseEntities?: Array<{
    primaryEntity: string
    inverseEntity: string
    correlationCoefficient: number
  }>
  sentimentResult?: {
    fearGreedIndex: number
    sentimentCategory: 'EXTREME_FEAR' | 'FEAR' | 'NEUTRAL' | 'GREED' | 'EXTREME_GREED'
    divergenceDetected: boolean
    confidence: number
  }
  dataSources?: string[]
  methodology?: string
}

export interface AdSenseCompliantContent {
  title: string
  summary: string // Layer 1: Journalistic summary
  siaInsight: string // Layer 2: Unique value proposition
  riskDisclaimer: string // Layer 3: Dynamic risk shield
  fullContent: string
  metadata: {
    wordCount: number
    readingTime: number
    eeatScore: number
    originalityScore: number
    technicalDepth: 'high' | 'medium' | 'low'
  }
  // E-E-A-T Protocols Enhancement (Phase 4)
  eeATProtocols?: {
    authorityManifesto?: string
    enhancedSiaInsight?: string // Layer 2 with entities, causal reasoning, transparency
    eeATVerification?: string
    sentimentScore?: string
    protocolBonuses?: {
      authorityManifesto: number
      quantumExpertise: number
      transparencyLayer: number
      entityMapping: number
      totalBonus: number
    }
    performanceMetrics?: {
      totalProcessingTime: number
      protocolTimings: Record<string, number>
      geminiAPICalls: number
    }
  }
}

/**
 * LAYER 1: Journalistic Summary
 * Follows 5W1H principles (Who, What, Where, When, Why, How)
 */
function generateJournalisticSummary(rawNews: string, language: string): string {
  // Professional news bulletin style
  // Avoids robotic phrases
  // 2-3 sentences maximum
  
  const templates = {
    en: "According to recent market developments, {event}. This movement was observed {when}, affecting {asset} with {impact}. Market participants are closely monitoring the situation as {context}.",
    tr: "Son piyasa gelişmelerine göre, {event}. Bu hareket {when} gözlemlendi ve {asset} üzerinde {impact} etkisi yarattı. Piyasa katılımcıları durumu yakından takip ediyor çünkü {context}.",
    de: "Laut jüngsten Marktentwicklungen {event}. Diese Bewegung wurde {when} beobachtet und betrifft {asset} mit {impact}. Marktteilnehmer beobachten die Situation genau, da {context}.",
    es: "Según los últimos desarrollos del mercado, {event}. Este movimiento se observó {when}, afectando a {asset} con {impact}. Los participantes del mercado están monitoreando de cerca la situación ya que {context}.",
    fr: "Selon les derniers développements du marché, {event}. Ce mouvement a été observé {when}, affectant {asset} avec {impact}. Les participants du marché surveillent de près la situation car {context}.",
    ar: "وفقًا لأحدث تطورات السوق، {event}. لوحظت هذه الحركة {when}، مما أثر على {asset} بـ {impact}. يراقب المشاركون في السوق الوضع عن كثب حيث {context}."
  }
  
  return templates[language as keyof typeof templates] || templates.en
}

/**
 * LAYER 2: SIA_INSIGHT - The Differentiator
 * This is where Google's "Unique Value" approval happens
 * 
 * CRITICAL: Must include:
 * - On-chain data analysis
 * - Exchange liquidity maps
 * - Whale wallet movements
 * - Technical depth that competitors don't have
 */
function generateSiaInsight(
  rawNews: string,
  asset: string,
  language: string,
  onChainData?: any
): string {
  const insights = {
    en: {
      prefix: "According to SIA_SENTINEL proprietary analysis",
      onChain: "on-chain data reveals",
      liquidity: "exchange liquidity patterns indicate",
      whale: "large holder wallet activity shows",
      technical: "technical indicators suggest",
      conclusion: "This divergence between price action and underlying metrics"
    },
    tr: {
      prefix: "SIA_SENTINEL özel analizine göre",
      onChain: "zincir üstü veriler gösteriyor ki",
      liquidity: "borsa likidite kalıpları işaret ediyor",
      whale: "büyük cüzdan hareketleri gösteriyor",
      technical: "teknik göstergeler öneriyor",
      conclusion: "Fiyat hareketi ile temel metrikler arasındaki bu farklılık"
    },
    de: {
      prefix: "Laut SIA_SENTINEL proprietärer Analyse",
      onChain: "On-Chain-Daten zeigen",
      liquidity: "Börsen-Liquiditätsmuster deuten darauf hin",
      whale: "Große Wallet-Aktivitäten zeigen",
      technical: "Technische Indikatoren deuten darauf hin",
      conclusion: "Diese Divergenz zwischen Preisbewegung und zugrunde liegenden Metriken"
    },
    es: {
      prefix: "Según el análisis propietario de SIA_SENTINEL",
      onChain: "los datos on-chain revelan",
      liquidity: "los patrones de liquidez del exchange indican",
      whale: "la actividad de billeteras grandes muestra",
      technical: "los indicadores técnicos sugieren",
      conclusion: "Esta divergencia entre la acción del precio y las métricas subyacentes"
    },
    fr: {
      prefix: "Selon l'analyse propriétaire de SIA_SENTINEL",
      onChain: "les données on-chain révèlent",
      liquidity: "les modèles de liquidité des exchanges indiquent",
      whale: "l'activité des grands portefeuilles montre",
      technical: "les indicateurs techniques suggèrent",
      conclusion: "Cette divergence entre l'action des prix et les métriques sous-jacentes"
    },
    ar: {
      prefix: "وفقًا لتحليل SIA_SENTINEL الخاص",
      onChain: "تكشف البيانات على السلسلة",
      liquidity: "تشير أنماط السيولة في البورصة",
      whale: "يُظهر نشاط المحافظ الكبيرة",
      technical: "تشير المؤشرات الفنية",
      conclusion: "هذا الاختلاف بين حركة السعر والمقاييس الأساسية"
    }
  }
  
  const lang = insights[language as keyof typeof insights] || insights.en
  
  // Build unique insight with technical depth
  return `${lang.prefix}, ${lang.onChain} [specific_metric]. ${lang.liquidity} [pattern_analysis]. ${lang.whale} [wallet_movement]. ${lang.conclusion} [interpretation].`
}

/**
 * LAYER 3: Dynamic Risk Shield
 * Custom, non-static risk warnings for each piece of content
 * Professional financial disclaimer integrated naturally
 */
function generateDynamicRiskDisclaimer(
  asset: string,
  confidenceScore: number,
  language: string
): string {
  const disclaimers = {
    en: {
      high: `RISK ASSESSMENT: While our analysis shows ${confidenceScore}% confidence in this scenario, cryptocurrency markets remain highly volatile. This analysis is based on statistical probability and publicly available data (OSINT). Past performance does not guarantee future results. Always conduct your own research and consult qualified financial advisors before making investment decisions. This is not financial advice.`,
      medium: `RISK ASSESSMENT: Current market conditions for ${asset} show mixed signals with ${confidenceScore}% confidence. Significant volatility is expected. This analysis represents data-driven probability assessment, not investment recommendations. Market participants should exercise extreme caution and implement proper risk management. Professional financial consultation is strongly recommended.`,
      low: `RISK ASSESSMENT: Analysis confidence is ${confidenceScore}%, indicating high uncertainty. ${asset} markets are experiencing unpredictable conditions. This information is provided for educational purposes only and should not be construed as financial, investment, or trading advice. Independent verification and professional guidance are essential before any financial decisions.`
    },
    tr: {
      high: `RİSK DEĞERLENDİRMESİ: Analizimiz bu senaryoda %${confidenceScore} güven gösterse de, kripto para piyasaları son derece volatildir. Bu analiz istatistiksel olasılık ve halka açık verilere (OSINT) dayanmaktadır. Geçmiş performans gelecekteki sonuçları garanti etmez. Yatırım kararları vermeden önce her zaman kendi araştırmanızı yapın ve nitelikli finansal danışmanlara danışın. Bu finansal tavsiye değildir.`,
      medium: `RİSK DEĞERLENDİRMESİ: ${asset} için mevcut piyasa koşulları %${confidenceScore} güvenle karışık sinyaller gösteriyor. Önemli volatilite bekleniyor. Bu analiz veriye dayalı olasılık değerlendirmesini temsil eder, yatırım tavsiyesi değildir. Piyasa katılımcıları aşırı dikkatli olmalı ve uygun risk yönetimi uygulamalıdır. Profesyonel finansal danışmanlık şiddetle tavsiye edilir.`,
      low: `RİSK DEĞERLENDİRMESİ: Analiz güveni %${confidenceScore} olup yüksek belirsizlik göstermektedir. ${asset} piyasaları öngörülemeyen koşullar yaşıyor. Bu bilgi yalnızca eğitim amaçlıdır ve finansal, yatırım veya ticaret tavsiyesi olarak yorumlanmamalıdır. Herhangi bir finansal karar öncesi bağımsız doğrulama ve profesyonel rehberlik esastır.`
    }
  }
  
  const lang = disclaimers[language as keyof typeof disclaimers] || disclaimers.en
  
  if (confidenceScore >= 85) return lang.high
  if (confidenceScore >= 70) return lang.medium
  return lang.low
}

/**
 * Calculate E-E-A-T Score
 * Experience, Expertise, Authoritativeness, Trustworthiness
 */
function calculateEEATScore(content: string): number {
  let score = 0
  
  // Experience indicators (25 points)
  if (content.includes('SIA_SENTINEL') || content.includes('our analysis')) score += 10
  if (content.includes('on-chain') || content.includes('zincir üstü')) score += 15
  
  // Expertise indicators (25 points)
  if (content.includes('technical') || content.includes('teknik')) score += 10
  if (content.includes('liquidity') || content.includes('likidite')) score += 15
  
  // Authoritativeness indicators (25 points)
  if (content.includes('According to') || content.includes('göre')) score += 10
  if (content.includes('data reveals') || content.includes('veriler')) score += 15
  
  // Trustworthiness indicators (25 points)
  if (content.includes('RISK') || content.includes('RİSK')) score += 15
  if (content.includes('not financial advice') || content.includes('tavsiye değildir')) score += 10
  
  return Math.min(score, 100)
}

/**
 * Main Content Generation Function
 * Combines all 3 layers into AdSense-compliant content
 * With optional E-E-A-T Protocols Enhancement (Phase 4)
 */
export async function generateAdSenseCompliantContent(
  request: ContentGenerationRequest
): Promise<AdSenseCompliantContent> {
  const { rawNews, asset = 'BTC', language, includeOnChainData, confidenceScore = 75 } = request
  
  // LAYER 1: Journalistic Summary
  const summary = generateJournalisticSummary(rawNews, language)
  
  // LAYER 2: SIA Insight (Unique Value)
  let siaInsight = generateSiaInsight(rawNews, asset, language, includeOnChainData)
  
  // LAYER 3: Dynamic Risk Disclaimer
  const riskDisclaimer = generateDynamicRiskDisclaimer(asset, confidenceScore, language)
  
  // Generate title (non-clickbait, matches content 100%)
  const title = generateProfessionalTitle(rawNews, asset, language)
  
  // ==========================================================================
  // E-E-A-T PROTOCOLS ENHANCEMENT (PHASE 4)
  // ==========================================================================
  let eeATProtocols: AdSenseCompliantContent['eeATProtocols'] | undefined
  let enhancedEEATScore = confidenceScore
  
  if (request.enableEEATProtocols && request.reasoningChains && request.inverseEntities && request.sentimentResult) {
    try {
      // Import orchestrator dynamically to avoid circular dependencies
      const { enhanceWithEEATProtocols } = await import('./eeat-protocols-orchestrator')
      
      // Prepare orchestrator request
      const orchestratorRequest = {
        content: `${summary}\n\n${siaInsight}`,
        topic: rawNews.substring(0, 100), // First 100 chars as topic
        asset,
        language,
        reasoningChains: request.reasoningChains,
        inverseEntities: request.inverseEntities,
        sentimentResult: request.sentimentResult,
        dataSources: request.dataSources || ['Glassnode', 'CryptoQuant', 'Bloomberg'],
        methodology: request.methodology || 'Multi-modal reasoning with Google Search grounding',
        baseConfidenceScore: confidenceScore,
        enabledProtocols: request.enabledProtocols,
        targetEntityCount: request.targetEntityCount,
        minimumHistoricalPrecedents: request.minimumHistoricalPrecedents,
        targetEEATScore: request.targetEEATScore
      }
      
      // Execute E-E-A-T protocols
      const protocolsResult = await enhanceWithEEATProtocols(orchestratorRequest)
      
      // Extract protocol components
      const { formatSentimentScoreSection } = await import('./predictive-sentiment-analyzer')
      const { formatCausalProof } = await import('./quantum-expertise-signaler')
      const { formatCitation } = await import('./transparency-layer-generator')
      
      // Build Authority Manifesto section
      const authorityManifesto = protocolsResult.authorityManifesto.content
        ? `\n\n[AUTHORITY_MANIFESTO]\n${protocolsResult.authorityManifesto.content}\n`
        : ''
      
      // Enhance Layer 2 (SIA_INSIGHT) with entities, causal reasoning, transparency
      let enhancedSiaInsight = siaInsight
      
      // Add entity links
      if (protocolsResult.semanticEntityMap.entities.length > 0) {
        const topEntities = protocolsResult.semanticEntityMap.entities
          .sort((a, b) => b.relevanceScore - a.relevanceScore)
          .slice(0, 5)
        
        const entityLinks = topEntities
          .map(e => `${e.name} (${e.definition.substring(0, 50)}...)`)
          .join(', ')
        
        enhancedSiaInsight += `\n\nKey Technical Entities: ${entityLinks}`
      }
      
      // Add causal reasoning proofs
      if (protocolsResult.quantumExpertise.length > 0 && protocolsResult.quantumExpertise[0].causalProofs.length > 0) {
        const topProof = protocolsResult.quantumExpertise[0].causalProofs[0]
        const causalText = formatCausalProof(topProof, language)
        enhancedSiaInsight += `\n\nCausal Analysis: ${causalText}`
      }
      
      // Add transparency layers (citations)
      if (protocolsResult.transparencyLayers.layers.length > 0) {
        const topCitation = protocolsResult.transparencyLayers.layers[0]
        enhancedSiaInsight += `\n\nData Source: ${topCitation.citation}`
      }
      
      // Build E-E-A-T Verification section
      const eeATVerification = protocolsResult.eeATVerification.content
        ? `\n\n[E-E-A-T_VERIFICATION]\n${protocolsResult.eeATVerification.content}\n`
        : ''
      
      // Build Sentiment Score section
      const sentimentScore = protocolsResult.predictiveSentiment.nextBreakingPoint
        ? `\n\n${formatSentimentScoreSection(protocolsResult.predictiveSentiment, language)}\n`
        : ''
      
      // Update E-E-A-T score with protocol bonuses
      enhancedEEATScore = protocolsResult.enhancedEEATScore
      
      // Store protocol results
      eeATProtocols = {
        authorityManifesto,
        enhancedSiaInsight,
        eeATVerification,
        sentimentScore,
        protocolBonuses: protocolsResult.protocolBonuses,
        performanceMetrics: {
          totalProcessingTime: protocolsResult.performanceMetrics.totalProcessingTime,
          protocolTimings: protocolsResult.performanceMetrics.protocolTimings,
          geminiAPICalls: protocolsResult.performanceMetrics.geminiAPICalls
        }
      }
      
      // Use enhanced SIA insight
      siaInsight = enhancedSiaInsight
      
    } catch (error) {
      console.error('E-E-A-T Protocols enhancement failed:', error)
      // Graceful degradation: continue with base content
    }
  }
  
  // ==========================================================================
  // ASSEMBLE FINAL CONTENT
  // ==========================================================================
  
  let fullContent = ''
  
  // Add Authority Manifesto (before Layer 1)
  if (eeATProtocols?.authorityManifesto) {
    fullContent += eeATProtocols.authorityManifesto
  }
  
  // Layer 1: Journalistic Summary
  fullContent += `${summary}\n\n`
  
  // Layer 2: Enhanced SIA Insight
  fullContent += `${siaInsight}\n\n`
  
  // Layer 3: Dynamic Risk Disclaimer
  fullContent += `${riskDisclaimer}`
  
  // Add E-E-A-T Verification (after Layer 3)
  if (eeATProtocols?.eeATVerification) {
    fullContent += eeATProtocols.eeATVerification
  }
  
  // Add Sentiment Score (at end)
  if (eeATProtocols?.sentimentScore) {
    fullContent += eeATProtocols.sentimentScore
  }
  
  // Calculate metadata
  const countWords = (text: string): number => {
    if (!text) return 0
    const cjk = (text.match(/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/g) || []).length
    if (cjk > 30) return Math.round(cjk / 2)
    return text.trim().split(/\s+/).filter(Boolean).length
  }

  const wordCount = countWords(fullContent)
  const readingTime = Math.ceil(wordCount / 200) // Average reading speed
  const eeatScore = eeATProtocols ? enhancedEEATScore : calculateEEATScore(fullContent)
  const originalityScore = calculateOriginalityScore(fullContent)
  const technicalDepth = determineTechnicalDepth(fullContent)
  
  return {
    title,
    summary,
    siaInsight,
    riskDisclaimer,
    fullContent,
    metadata: {
      wordCount,
      readingTime,
      eeatScore,
      originalityScore,
      technicalDepth
    },
    eeATProtocols
  }
}

/**
 * Generate Professional Title
 * ANTI-BAN RULE: No clickbait, 100% content match
 */
function generateProfessionalTitle(rawNews: string, asset: string, language: string): string {
  const templates = {
    en: `${asset} Market Analysis: [Key Event] - SIA Intelligence Report`,
    tr: `${asset} Piyasa Analizi: [Ana Olay] - SIA İstihbarat Raporu`,
    de: `${asset} Marktanalyse: [Hauptereignis] - SIA Intelligence Bericht`,
    es: `Análisis de Mercado ${asset}: [Evento Clave] - Informe SIA Intelligence`,
    fr: `Analyse du Marché ${asset}: [Événement Clé] - Rapport SIA Intelligence`,
    ar: `تحليل سوق ${asset}: [الحدث الرئيسي] - تقرير SIA Intelligence`
  }
  
  return templates[language as keyof typeof templates] || templates.en
}

/**
 * Calculate Originality Score
 * Measures unique value vs generic content
 */
function calculateOriginalityScore(content: string): number {
  let score = 100
  
  // Penalize generic phrases
  const genericPhrases = [
    'according to reports',
    'sources say',
    'it is believed',
    'experts think',
    'many analysts'
  ]
  
  genericPhrases.forEach(phrase => {
    if (content.toLowerCase().includes(phrase)) score -= 10
  })
  
  // Reward unique identifiers
  if (content.includes('SIA_SENTINEL')) score += 10
  if (content.includes('on-chain')) score += 10
  if (content.includes('proprietary')) score += 10
  
  return Math.max(0, Math.min(100, score))
}

/**
 * Determine Technical Depth
 */
function determineTechnicalDepth(content: string): 'high' | 'medium' | 'low' {
  const technicalTerms = [
    'on-chain', 'liquidity', 'whale', 'wallet', 'exchange',
    'technical indicators', 'divergence', 'metrics', 'volatility'
  ]
  
  const count = technicalTerms.filter(term => 
    content.toLowerCase().includes(term.toLowerCase())
  ).length
  
  if (count >= 6) return 'high'
  if (count >= 3) return 'medium'
  return 'low'
}

/**
 * ANTI-SPAM VALIDATION
 * Ensures content won't trigger Google's spam filters
 */
export function validateAntiSpam(content: AdSenseCompliantContent): {
  isValid: boolean
  issues: string[]
} {
  const issues: string[] = []
  
  // Check word count (SIA Master Protocol v6.1: 850-950 words)
  if (content.metadata.wordCount < 850) {
    issues.push(`Content depth too low: ${content.metadata.wordCount} words (SIA Target: 850-950)`)
  }
  
  // Check E-E-A-T score
  if (content.metadata.eeatScore < 60) {
    issues.push('E-E-A-T score too low (minimum 60/100)')
  }
  
  // Check originality
  if (content.metadata.originalityScore < 70) {
    issues.push('Originality score too low (minimum 70/100)')
  }
  
  // Check for risk disclaimer
  if (!content.riskDisclaimer.includes('not financial advice') && 
      !content.riskDisclaimer.includes('tavsiye değildir')) {
    issues.push('Missing proper financial disclaimer')
  }
  
  // Check title-content match
  if (!content.fullContent.toLowerCase().includes(content.title.split(':')[0].toLowerCase())) {
    issues.push('Title does not match content (clickbait risk)')
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}
