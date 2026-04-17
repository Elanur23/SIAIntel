/**
 * Deep-Dive Analysis Generator
 * Implements the E-E-A-T Authority Deep Dive prompt template
 * Integrates with Gemini AI and existing SEO infrastructure
 */

import { callGeminiCentral } from '../neural-assembly/gemini-central-provider'

export interface DeepDiveRequest {
  topic: string
  asset?: string
  language: 'en' | 'tr' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'jp' | 'zh'
  targetKeywords?: string[]
  relatedCategories?: string[]
  enhancedMode?: boolean // Sovereign Level: 1200 words, E-E-A-T 90/100
}

export interface RiskOpportunityFactor {
  factor: string
  riskLevel: 'High' | 'Medium' | 'Low'
  opportunityLevel: 'High' | 'Medium' | 'Low'
  netAssessment: 'Bullish' | 'Bearish' | 'Neutral'
  confidence: number
}

export interface BarometerMetrics {
  reliabilityScore: number // 85-98%
  sourceVerification: 'Active' | 'Verified' | 'Pending'
  analysisDepth: 'Sovereign' | 'Elite' | 'Standard'
  sources: string[]
  justification: string
}

export interface FAQItem {
  question: string
  answer: string
  keyword?: string
}

export interface InternalLink {
  anchor: string
  target: string
  context: string
}

export interface DeepDiveAnalysis {
  title: string
  aiDigest: string[] // 3 bullets with icons (📊 🔍 ⚡)
  executiveSummary: string
  riskOpportunityMatrix: RiskOpportunityFactor[]
  bullishCase: string
  bearishCase: string
  neutralAssessment?: string // Enhanced mode only
  barometerMetrics: BarometerMetrics
  quantitativeAnalysis?: string // Enhanced mode only
  faqSchema: FAQItem[]
  internalLinks: InternalLink[]
  proprietaryInsights: string
  fullContent: string
  lsiKeywords?: string[] // Enhanced mode only
  confidence: number
  eeeatScore: number
  category: 'CRYPTO' | 'STOCKS' | 'ECONOMY' | 'AI' | 'MARKET'
  metadata: {
    wordCount: number
    readingTime: number
    technicalDepth: 'High' | 'Medium' | 'Low'
    generatedAt: string
    keywordDensity?: number // Enhanced mode only
  }
}

/**
 * Generate deep-dive analysis using E-E-A-T Authority template
 */
export async function generateDeepDiveAnalysis(
  request: DeepDiveRequest
): Promise<DeepDiveAnalysis> {
  const prompt = buildDeepDivePrompt(request)
  
  try {
    const centralResponse = await callGeminiCentral({
      context: {
        module: 'deep-dive-generator',
        function: 'generateDeepDiveAnalysis',
        purpose: 'main_generation',
        language: request.language
      },
      model: 'gemini-1.5-pro-002',
      prompt,
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        maxOutputTokens: 4096,
      },
    })
    
    return parseDeepDiveResponse(centralResponse.text, request)
  } catch (error) {
    console.error('Deep-dive generation error:', error)
    throw new Error('Failed to generate deep-dive analysis')
  }
}

/**
 * Build the E-E-A-T Authority Deep Dive prompt
 */
function buildDeepDivePrompt(request: DeepDiveRequest): string {
  const enhancedRequirements = request.enhancedMode ? `
ENHANCED SOVEREIGN LEVEL REQUIREMENTS:

1. WORD COUNT: 1200+ words (strict minimum)
2. E-E-A-T SCORE: 90/100 minimum (not 85/100)
3. KEYWORD DENSITY: 2% for primary keyword "${request.topic}"
4. LSI TERMS: 15+ Latent Semantic Indexing keywords naturally integrated
5. TECHNICAL DEPTH: Maximum (quantitative analysis, statistical significance)
6. RISK MATRIX: 5 factors minimum (not 5-7)
7. DATA POINTS: 15+ specific metrics and percentages

KEYWORD OPTIMIZATION:
- Primary keyword: "${request.topic}" (2% density = ~24 mentions in 1200 words)
- LSI keywords (15+ required):
  * Related financial terms
  * Market indicators
  * Technical analysis terms
  * Industry-specific vocabulary
  * Temporal modifiers (Q1 2026, year-over-year, etc.)
  * Geographic modifiers (global, regional, etc.)
  * Action verbs (surged, declined, accelerated, etc.)
  * Quantitative terms (percentage, volume, correlation, etc.)

Distribution:
- Title: 1-2 keywords
- Executive Summary: 3-4 keywords
- Body sections: 10-12 keywords
- Conclusion: 2-3 keywords
- Natural integration (no keyword stuffing)
` : ''

  return `ACT AS: Lead Quantitative Analyst for SIA Terminal

TASK: Produce a 'Sovereign Level' deep-dive analysis on ${request.topic}

${enhancedRequirements}

STRUCTURE REQUIREMENTS:

1. EXECUTIVE SUMMARY (150-200 words):
   - Thesis statement
   - Key findings (3-5 points)
   - Confidence level
   - Timeframe for analysis
   - Include primary keyword naturally

2. AI-DIGEST BLOCK (#ai-quick-digest):
   Create 3 bullet points with icons for SGE extraction:
   - 📊 [Main quantitative finding - 1 sentence with specific metric]
   - 🔍 [Key analytical insight - 1 sentence with data point]
   - ⚡ [Market implication - 1 sentence with forward-looking indicator]
   
   Requirements:
   - Each bullet: 20-30 words
   - Include specific numbers/percentages
   - Professional financial terminology
   - Voice assistant optimized

3. DATA VISUALIZATION (Risk vs. Opportunity Matrix):
   Create table with EXACTLY 5 factors:
   
   | Factor | Risk Level | Opportunity Level | Net Assessment | Confidence | Key Metric |
   |--------|-----------|-------------------|----------------|------------|------------|
   | [Factor 1] | High/Med/Low | High/Med/Low | Bullish/Bearish/Neutral | XX% | [Specific data] |
   | [Factor 2] | High/Med/Low | High/Med/Low | Bullish/Bearish/Neutral | XX% | [Specific data] |
   | [Factor 3] | High/Med/Low | High/Med/Low | Bullish/Bearish/Neutral | XX% | [Specific data] |
   | [Factor 4] | High/Med/Low | High/Med/Low | Bullish/Bearish/Neutral | XX% | [Specific data] |
   | [Factor 5] | High/Med/Low | High/Med/Low | Bullish/Bearish/Neutral | XX% | [Specific data] |
   
   Each factor must include:
   - Specific metric or data point
   - Confidence percentage
   - Clear risk/opportunity assessment

4. BIAS NEUTRALITY (Balanced Perspective):
   
   BULLISH SCENARIO (200-250 words):
   - Supporting evidence with specific data
   - Positive indicators and catalysts
   - Upside price targets or outcomes
   - Historical precedents with dates
   - Probability assessment
   - Timeline for scenario realization
   
   BEARISH SCENARIO (200-250 words):
   - Contradicting evidence with specific data
   - Negative indicators and headwinds
   - Downside price targets or outcomes
   - Risk factors with quantification
   - Probability assessment
   - Timeline for scenario realization
   
   NEUTRAL ASSESSMENT:
   - Synthesize both scenarios
   - Most likely outcome with probability
   - Key variables to monitor

5. BAROMETER METRICS (SiaAnalysisBarometer):
   
   - Reliability Score: XX% (${request.enhancedMode ? '90-98%' : '85-98%'} range)
     Justification: [Data sources, methodology, sample size]
   
   - Source Verification: Active/Verified/Pending
     Sources: [List 5+ primary sources with credibility scores]
   
   - Analysis Depth: Sovereign/Elite/Standard
     Criteria: [Technical indicators used, data points analyzed, models employed]

6. QUANTITATIVE ANALYSIS (${request.enhancedMode ? '300-400' : '200-300'} words):
   - Statistical analysis with significance levels
   - Correlation coefficients
   - Volatility metrics
   - Volume analysis
   - Price action patterns
   - Technical indicators (RSI, MACD, Bollinger Bands, etc.)
   - On-chain metrics (if crypto-related)
   - Institutional flow data
   - Sentiment indicators

7. FAQ SCHEMA (People Also Ask):
   
   Q1: [Question related to main topic with primary keyword]
   A1: [Concise answer, 50-70 words, includes primary keyword and 2-3 LSI terms]
   
   Q2: [Question about implications/impact with LSI keyword]
   A2: [Concise answer, 50-70 words, includes secondary keyword and data point]
   
   Q3: [Question about future outlook/timeline with long-tail keyword]
   A3: [Concise answer, 50-70 words, includes specific timeframe and probability]

8. INTERNAL LINKING (Topical Authority):
   
   Anchor 1: [Keyword-rich anchor text with LSI term]
   Target: /[category]/[related-article]
   Context: [Why relevant, includes metric or data point]
   
   Anchor 2: [Keyword-rich anchor text with LSI term]
   Target: /[category]/[related-article]
   Context: [Why relevant, includes metric or data point]
   
   Anchor 3: [Keyword-rich anchor text with LSI term]
   Target: /[category]/[related-article]
   Context: [Why relevant, includes metric or data point]

9. PROPRIETARY INSIGHTS (SIA_SENTINEL):
   Include 3-4 paragraphs (300-400 words total) with:
   - Unique data analysis not available elsewhere
   - Proprietary indicators or models
   - Expert interpretation with confidence intervals
   - Forward-looking projections with probability ranges
   - Attribution: "According to SIA_SENTINEL proprietary analysis..."
   - Specific methodology transparency

10. TECHNICAL DEPTH:
    Demonstrate expertise through:
    - Industry-standard indicators with specific values
    - Quantitative analysis with statistical significance
    - Historical comparisons with specific dates and percentages
    - Correlation analysis between assets/markets
    - Volatility analysis with standard deviations
    - Volume profile analysis
    - Market microstructure insights
    - Institutional positioning data
    - Methodology transparency (models, assumptions, limitations)

LANGUAGE: ${request.language}
${request.targetKeywords ? `TARGET KEYWORDS: ${request.targetKeywords.join(', ')}` : ''}
${request.asset ? `ASSET: ${request.asset}` : ''}

TONE: Sovereign, authoritative, quantitative, analytical

OUTPUT FORMAT: JSON with the following structure:
{
  "title": "Authority-building headline with primary keyword",
  "aiDigest": [
    "📊 Quantitative finding with metric",
    "🔍 Analytical insight with data",
    "⚡ Market implication with indicator"
  ],
  "executiveSummary": "Thesis and key findings (150-200 words)",
  "riskOpportunityMatrix": [
    {
      "factor": "Factor name",
      "risk": "High/Medium/Low",
      "opportunity": "High/Medium/Low",
      "assessment": "Bullish/Bearish/Neutral",
      "confidence": 85,
      "keyMetric": "Specific data point"
    }
    // Exactly 5 factors
  ],
  "bullishCase": "Supporting arguments (200-250 words)",
  "bearishCase": "Contradicting arguments (200-250 words)",
  "neutralAssessment": "Synthesized outlook (100-150 words)",
  "barometerMetrics": {
    "reliabilityScore": 95,
    "sourceVerification": "active",
    "analysisDepth": "sovereign",
    "sources": ["source1", "source2", "source3", "source4", "source5"],
    "justification": "methodology explanation"
  },
  "quantitativeAnalysis": "Statistical analysis (300-400 words)",
  "faqSchema": [
    {"question": "Q with primary keyword", "answer": "A with data (50-70 words)", "keyword": "primary"},
    {"question": "Q with LSI keyword", "answer": "A with metric (50-70 words)", "keyword": "secondary"},
    {"question": "Q with long-tail", "answer": "A with timeline (50-70 words)", "keyword": "long-tail"}
  ],
  "internalLinks": [
    {"anchor": "LSI-rich anchor", "target": "/category/article", "context": "Relevance with data"},
    {"anchor": "LSI-rich anchor", "target": "/category/article", "context": "Relevance with data"},
    {"anchor": "LSI-rich anchor", "target": "/category/article", "context": "Relevance with data"}
  ],
  "proprietaryInsights": "SIA_SENTINEL analysis (300-400 words)",
  "fullContent": "Complete deep-dive (${request.enhancedMode ? '1200+' : '800+'} words)",
  "lsiKeywords": ["keyword1", "keyword2", ... // ${request.enhancedMode ? '15+' : '10+'} keywords],
  "confidence": 92,
  "eeeatScore": ${request.enhancedMode ? '90' : '85'}
}

QUALITY STANDARDS:
- Word count: ${request.enhancedMode ? '1200+' : '800+'} words minimum
- E-E-A-T score: ${request.enhancedMode ? '90' : '85'}/100 minimum
- Technical depth: ${request.enhancedMode ? 'Maximum (Sovereign Level)' : 'High'}
- Data points: ${request.enhancedMode ? '15+' : '10+'} specific metrics
- Sources cited: 5+ authoritative sources
- Reading time: ${request.enhancedMode ? '7-10' : '5-10'} minutes
- Keyword density: ${request.enhancedMode ? '2%' : '1-2%'} for primary keyword
- LSI keywords: ${request.enhancedMode ? '15+' : '10+'} naturally integrated`
}

/**
 * Parse Gemini response into structured DeepDiveAnalysis
 */
function parseDeepDiveResponse(
  response: string,
  request: DeepDiveRequest
): DeepDiveAnalysis {
  try {
    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/) || 
                     response.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('No valid JSON found in response')
    }
    
    const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0])
    
    // Calculate metadata
    const wordCount = parsed.fullContent.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200) // 200 words per minute
    
    // Calculate keyword density if enhanced mode
    let keywordDensity: number | undefined
    if (request.enhancedMode && request.topic) {
      const topicWords = request.topic.toLowerCase().split(/\s+/)
      const contentLower = parsed.fullContent.toLowerCase()
      let keywordCount = 0
      
      for (const word of topicWords) {
        const regex = new RegExp(`\\b${word}\\b`, 'g')
        const matches = contentLower.match(regex)
        if (matches) {
          keywordCount += matches.length
        }
      }
      
      keywordDensity = (keywordCount / wordCount) * 100
    }
    
    return {
      title: parsed.title,
      aiDigest: parsed.aiDigest || [],
      executiveSummary: parsed.executiveSummary,
      riskOpportunityMatrix: parsed.riskOpportunityMatrix,
      bullishCase: parsed.bullishCase,
      bearishCase: parsed.bearishCase,
      neutralAssessment: parsed.neutralAssessment,
      barometerMetrics: {
        reliabilityScore: parsed.barometerMetrics.reliabilityScore,
        sourceVerification: parsed.barometerMetrics.sourceVerification,
        analysisDepth: parsed.barometerMetrics.analysisDepth,
        sources: parsed.barometerMetrics.sources,
        justification: parsed.barometerMetrics.justification,
      },
      quantitativeAnalysis: parsed.quantitativeAnalysis,
      faqSchema: parsed.faqSchema,
      internalLinks: parsed.internalLinks,
      proprietaryInsights: parsed.proprietaryInsights,
      fullContent: parsed.fullContent,
      lsiKeywords: parsed.lsiKeywords,
      confidence: parsed.confidence,
      eeeatScore: parsed.eeeatScore,
      category: determineCategory(request.topic, request.asset),
      metadata: {
        wordCount,
        readingTime,
        technicalDepth: request.enhancedMode ? 'High' : 'High',
        generatedAt: new Date().toISOString(),
        keywordDensity,
      },
    }
  } catch (error) {
    console.error('Parse error:', error)
    throw new Error('Failed to parse deep-dive response')
  }
}

/**
 * Determine article category based on topic and asset
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
  
  if (topicLower.includes('stock') || topicLower.includes('equity') || 
      topicLower.includes('s&p') || topicLower.includes('nasdaq')) {
    return 'STOCKS'
  }
  
  if (topicLower.includes('ai') || topicLower.includes('artificial intelligence') || 
      topicLower.includes('machine learning')) {
    return 'AI'
  }
  
  if (topicLower.includes('fed') || topicLower.includes('inflation') || 
      topicLower.includes('gdp') || topicLower.includes('economy')) {
    return 'ECONOMY'
  }
  
  return 'MARKET'
}

/**
 * Format Risk vs. Opportunity Matrix as markdown table
 */
export function formatRiskOpportunityMatrix(
  matrix: RiskOpportunityFactor[]
): string {
  let table = '| Factor | Risk Level | Opportunity Level | Net Assessment | Confidence |\n'
  table += '|--------|-----------|-------------------|----------------|------------|\n'
  
  for (const factor of matrix) {
    table += `| ${factor.factor} | ${factor.riskLevel} | ${factor.opportunityLevel} | ${factor.netAssessment} | ${factor.confidence}% |\n`
  }
  
  return table
}

/**
 * Generate FAQ Schema JSON-LD
 */
export function generateFAQSchemaMarkup(faq: FAQItem[]): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map(item => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}
