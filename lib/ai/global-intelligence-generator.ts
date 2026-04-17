/**
 * Global OSINT & Financial Intelligence Report Generator
 * Multi-language, multi-search-engine optimized content generation
 * Integrates with global indexing infrastructure (Google, Bing, Yandex, Baidu)
 */

import { callGeminiCentral } from '../neural-assembly/gemini-central-provider'

export type Language = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'jp' | 'zh'
export type NewsPriority = 'Urgent' | 'Analysis' | 'Brief'
export type SearchEngine = 'google' | 'bing' | 'yandex' | 'baidu'

export interface GlobalIntelligenceRequest {
  topic: string
  asset?: string
  priority: NewsPriority
  targetLanguages?: Language[]
  includeRegionalOptimization?: boolean
}

export interface RegionalOptimization {
  yandex_eurasia: string // Specific implications for Eurasia/Russia
  baidu_asia: string // Impact on Asian markets and supply chains
  google_sge: string[] // SGE-friendly bullet points for #ai-quick-digest
}

export interface MultilingualContent {
  language: Language
  title: string
  aiDigest: string[] // 3 bullets with emojis
  summary: string // Layer 1: ÖZET
  siaInsight: string // Layer 2: SIA_INSIGHT
  riskDisclaimer: string // Layer 3: DYNAMIC_RISK_SHIELD
  fullContent: string
  metaDescription: string
  keywords: string[]
}

export interface GlobalIntelligenceReport {
  // Core English analysis
  coreAnalysis: {
    title: string
    executiveSummary: string
    keyFindings: string[]
    technicalAnalysis: string
    marketImpact: string
    confidence: number
  }

  // Regional optimizations for search engines
  regionalOptimization: RegionalOptimization

  // Barometer metrics
  barometerMetrics: {
    analysisDepth: 'Sovereign' | 'Elite' | 'Standard'
    sourceReliability: number // 0-100
    dataQuality: 'High' | 'Medium' | 'Low'
    verificationStatus: 'Active' | 'Verified' | 'Pending'
  }

  // Multi-language versions
  translations: MultilingualContent[]

  // IndexNow metadata
  indexingMetadata: {
    priority: NewsPriority
    urgencyScore: number // 0.0-1.0
    targetEngines: SearchEngine[]
    expectedIndexingTime: string // e.g., "< 60 seconds"
  }

  // Global metadata
  metadata: {
    generatedAt: string
    wordCount: number
    readingTime: number
    category: 'CRYPTO' | 'STOCKS' | 'ECONOMY' | 'AI' | 'MARKET'
    eeeatScore: number
  }
}

/**
 * Generate global intelligence report optimized for all search engines
 */
export async function generateGlobalIntelligenceReport(
  request: GlobalIntelligenceRequest
): Promise<GlobalIntelligenceReport> {
  const prompt = buildGlobalIntelligencePrompt(request)
  
  try {
    const centralResponse = await callGeminiCentral({
      context: {
        module: 'global-intelligence-generator',
        function: 'generateGlobalIntelligenceReport',
        purpose: 'intelligence',
        batchId: request.priority,
        language: 'multi'
      },
      model: 'gemini-1.5-pro-002',
      prompt,
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 8192, // Larger for multi-language
      },
    })
    
    return parseGlobalIntelligenceResponse(centralResponse.text, request)
  } catch (error) {
    console.error('Global intelligence generation error:', error)
    throw new Error('Failed to generate global intelligence report')
  }
}

/**
 * Build the Global OSINT & Financial Intelligence prompt
 */
function buildGlobalIntelligencePrompt(request: GlobalIntelligenceRequest): string {
  const targetLanguages = request.targetLanguages || ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']
  
  return `ACT AS: Global OSINT & Financial Intelligence Lead for SIA Terminal

TASK: Create a high-impact intelligence report on ${request.topic}

PRIORITY LEVEL: ${request.priority}

🔥 GOLDEN RULE - HIGH-IMPACT NARRATIVE PRESERVATION:
When performing journalistic conversion, PRESERVE the gravity and strategic significance of the core narrative angles. If the source material contains high-impact concepts (e.g., "Nuclear-Equivalent Asset", "Unbankable by Q3 2026", "Strategic Asset Reclassification"), you MUST:

1. MAINTAIN THE IMPACT: Keep the urgency and strategic weight of the original angle
2. USE PROFESSIONAL TERMINOLOGY: Convert sensational language to institutional-grade terminology
   - "Nuclear-Equivalent" → "Strategic Asset Reclassification" or "Tier-1 Reserve Asset Status"
   - "Unbankable" → "Regulatory Exclusion Framework" or "Banking System Incompatibility"
   - "Collapse" → "Systemic Restructuring" or "Framework Dissolution"
3. PRESERVE TIMEFRAMES: If specific dates/quarters are mentioned (e.g., "Q3 2026"), keep them
4. AMPLIFY INSTITUTIONAL GRAVITY: Use language that resonates with sovereign wealth funds, central banks, and institutional decision-makers
5. AVOID DILUTION: Do NOT soften the strategic implications to the point of losing the core message

EXAMPLES OF PROPER CONVERSION:
❌ BAD: "Bitcoin might become important" 
✅ GOOD: "Strategic Asset Reclassification positions Bitcoin as Tier-1 reserve equivalent by Q3 2026"

❌ BAD: "Banks may have issues with crypto"
✅ GOOD: "Regulatory Exclusion Framework renders traditional banking infrastructure incompatible with digital asset custody by Q3 2026"

❌ BAD: "Dollar could face challenges"
✅ GOOD: "Fiat liquidity framework faces systemic restructuring as Strategic Asset Reclassification accelerates institutional capital reallocation"

STRUCTURE REQUIREMENTS:

1. CORE ANALYSIS (English):
   
   EXECUTIVE SUMMARY (100-150 words):
   - Thesis statement
   - Key findings (3-5 points)
   - Confidence level: XX%
   - Timeframe for analysis
   
   TECHNICAL ANALYSIS (200-300 words):
   - Specific metrics and data points
   - On-chain data (if crypto-related)
   - Market indicators
   - Historical comparisons
   - Statistical significance
   
   MARKET IMPACT (150-200 words):
   - Global implications
   - Regional effects
   - Asset correlations
   - Risk factors

2. REGIONAL OPTIMIZATION (Search Engine Specific):
   
   FOR YANDEX (Russian/Eurasian Markets):
   - Specific implications for Eurasia
   - Impact on Russian economy
   - Commodity market effects
   - Geopolitical considerations
   - Regional regulatory context
   (100-150 words in professional tone)
   
   FOR BAIDU (Asian Markets):
   - Impact on Asian markets
   - Supply chain implications
   - Chinese economic effects
   - Regional trade dynamics
   - APAC investment flows
   (100-150 words in professional tone)
   
   FOR GOOGLE/BING (SGE Optimization):
   - Create 3 SGE-friendly bullet points for #ai-quick-digest
   - Each bullet: 15-25 words
   - Include emojis: 📊 🔍 ⚡
   - Action verbs and specific metrics
   - Voice assistant optimized

3. BAROMETER METRICS:
   
   ANALYSIS DEPTH: Sovereign/Elite/Standard
   Criteria: [Based on data points analyzed, technical indicators used]
   
   SOURCE RELIABILITY: XX% (70-98% range)
   Justification: [Data sources quality, verification level]
   
   DATA QUALITY: High/Medium/Low
   Assessment: [Completeness, accuracy, timeliness]
   
   VERIFICATION STATUS: Active/Verified/Pending

4. MULTI-LANGUAGE TRANSLATION:
   
   For EACH language (${targetLanguages.join(', ')}):
   
   Generate complete article with:
   
   LAYER 1 - ÖZET (Journalistic Summary):
   - 2-3 sentences
   - 5W1H format
   - Professional journalism tone
   - Language-specific cultural adaptation
   
   LAYER 2 - SIA_INSIGHT (Proprietary Analysis):
   - "According to SIA_SENTINEL proprietary analysis..."
   - On-chain data or technical metrics
   - Unique insights
   - 80-120 words
   
   LAYER 3 - DYNAMIC_RISK_SHIELD:
   - Confidence-based disclaimer
   - Context-specific
   - Professional financial disclaimer
   - Integrated naturally
   
   AI-DIGEST (3 bullets with emojis):
   - 📊 [Main fact - 1 sentence]
   - 🔍 [Key insight - 1 sentence]
   - ⚡ [Context - 1 sentence]
   
   FULL CONTENT:
   - 300+ words minimum
   - Technical depth
   - Specific metrics
   - Professional tone
   
   META DESCRIPTION:
   - Exactly 160 characters
   - Includes primary keyword
   - Action verb + metric

5. INDEXNOW METADATA:
   
   NEWS PRIORITY TAG: ${request.priority}
   
   URGENCY SCORE: 
   - Urgent: 0.9-1.0
   - Analysis: 0.7-0.8
   - Brief: 0.5-0.6
   
   TARGET ENGINES: [Google, Bing, Yandex, Baidu]
   
   EXPECTED INDEXING TIME: "< 60 seconds globally"

${request.asset ? `ASSET: ${request.asset}` : ''}

TONE: Sovereign, authoritative, analytical

OUTPUT FORMAT: JSON with the following structure:
{
  "coreAnalysis": {
    "title": "Authority headline",
    "executiveSummary": "Thesis and findings",
    "keyFindings": ["finding1", "finding2", "finding3"],
    "technicalAnalysis": "Detailed analysis",
    "marketImpact": "Global implications",
    "confidence": 85
  },
  "regionalOptimization": {
    "yandex_eurasia": "Eurasian implications",
    "baidu_asia": "Asian market impact",
    "google_sge": ["📊 bullet1", "🔍 bullet2", "⚡ bullet3"]
  },
  "barometerMetrics": {
    "analysisDepth": "Sovereign",
    "sourceReliability": 95,
    "dataQuality": "High",
    "verificationStatus": "Active"
  },
  "translations": [
    {
      "language": "en",
      "title": "English title",
      "aiDigest": ["📊 bullet1", "🔍 bullet2", "⚡ bullet3"],
      "summary": "Layer 1 summary",
      "siaInsight": "Layer 2 insight",
      "riskDisclaimer": "Layer 3 disclaimer",
      "fullContent": "Complete article",
      "metaDescription": "160 chars",
      "keywords": ["keyword1", "keyword2"]
    }
    // ... repeat for all ${targetLanguages.length} languages
  ],
  "indexingMetadata": {
    "priority": "${request.priority}",
    "urgencyScore": 0.9,
    "targetEngines": ["google", "bing", "yandex", "baidu"],
    "expectedIndexingTime": "< 60 seconds"
  }
}

QUALITY STANDARDS:
- Word count: 300+ per language
- E-E-A-T score: 75/100 minimum
- Source reliability: 70/100 minimum
- Technical depth: Medium or High
- AdSense compliant: 100%
- Regional optimization: Complete for Yandex & Baidu`
}

/**
 * Parse Gemini response into structured GlobalIntelligenceReport
 */
function parseGlobalIntelligenceResponse(
  response: string,
  request: GlobalIntelligenceRequest
): GlobalIntelligenceReport {
  try {
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                     response.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }
    
    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
    
    // Calculate metadata
    const wordCount = parsed.translations[0]?.fullContent.split(/\s+/).length || 0
    const readingTime = Math.ceil(wordCount / 200)
    
    return {
      coreAnalysis: parsed.coreAnalysis,
      regionalOptimization: parsed.regionalOptimization,
      barometerMetrics: parsed.barometerMetrics,
      translations: parsed.translations,
      indexingMetadata: parsed.indexingMetadata,
      metadata: {
        generatedAt: new Date().toISOString(),
        wordCount,
        readingTime,
        category: determineCategory(request.topic, request.asset),
        eeeatScore: calculateEEATScore(parsed),
      },
    }
  } catch (error) {
    console.error('Parse error:', error)
    throw new Error('Failed to parse global intelligence response')
  }
}

/**
 * Determine article category
 */
function determineCategory(
  topic: string,
  asset?: string
): 'CRYPTO' | 'STOCKS' | 'ECONOMY' | 'AI' | 'MARKET' {
  const topicLower = topic.toLowerCase()
  const assetLower = asset?.toLowerCase() || ''
  
  if (topicLower.includes('bitcoin') || topicLower.includes('crypto') || 
      topicLower.includes('ethereum') || assetLower.includes('btc')) {
    return 'CRYPTO'
  }
  
  if (topicLower.includes('stock') || topicLower.includes('equity')) {
    return 'STOCKS'
  }
  
  if (topicLower.includes('ai') || topicLower.includes('artificial intelligence')) {
    return 'AI'
  }
  
  if (topicLower.includes('fed') || topicLower.includes('inflation') || 
      topicLower.includes('gdp')) {
    return 'ECONOMY'
  }
  
  return 'MARKET'
}

/**
 * Calculate E-E-A-T score based on content quality
 */
function calculateEEATScore(parsed: any): number {
  let score = 0
  
  // Experience (25 points)
  if (parsed.coreAnalysis.technicalAnalysis.includes('SIA_SENTINEL') ||
      parsed.coreAnalysis.technicalAnalysis.includes('Our monitoring')) {
    score += 25
  } else {
    score += 15
  }
  
  // Expertise (25 points)
  const hasMetrics = /\d+%/.test(parsed.coreAnalysis.technicalAnalysis)
  score += hasMetrics ? 25 : 15
  
  // Authoritativeness (25 points)
  score += parsed.barometerMetrics.sourceReliability >= 85 ? 25 : 15
  
  // Trustworthiness (25 points)
  const hasDisclaimer = parsed.translations.some((t: any) => 
    t.riskDisclaimer.includes('RISK ASSESSMENT')
  )
  score += hasDisclaimer ? 25 : 15
  
  return Math.min(score, 100)
}

/**
 * Get urgency score based on priority
 */
export function getUrgencyScore(priority: NewsPriority): number {
  switch (priority) {
    case 'Urgent':
      return 0.95
    case 'Analysis':
      return 0.75
    case 'Brief':
      return 0.55
    default:
      return 0.70
  }
}

/**
 * Format regional optimization for display
 */
export function formatRegionalOptimization(
  optimization: RegionalOptimization
): string {
  return `
🌍 YANDEX (Eurasia):
${optimization.yandex_eurasia}

🌏 BAIDU (Asia):
${optimization.baidu_asia}

🔍 GOOGLE/BING (SGE):
${optimization.google_sge.join('\n')}
  `.trim()
}
