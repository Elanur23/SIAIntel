/**
 * Gemini AI Integration Layer for SIA_NEWS_v1.0
 * 
 * Integrates Google Gemini 1.5 Pro 002 for multilingual content generation
 * with real-time Google Search grounding and AdSense-compliant output.
 * 
 * Features:
 * - Temperature 0.3 for consistency and accuracy
 * - Top-P 0.8 for quality control
 * - Max Tokens 2048 for comprehensive content
 * - Google Search grounding for real-time data
 * - Exponential backoff retry logic (max 3 attempts)
 * - Circuit breaker pattern for API failures
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { MARKET_TOOLS, executeMarketFunction } from '../ai/market-functions'
import type {
  GeminiConfig,
  GeminiPrompt,
  GeminiResponse,
  Language,
  EntityMapping,
  CausalChain,
} from './types'
import { circuitBreakerManager } from './circuit-breaker'
import { retryWithBackoff, type RetryConfig } from './retry-strategies'

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: GeminiConfig = {
  model: 'gemini-1.5-pro-002',
  temperature: 0.3,
  topP: 0.8,
  maxTokens: 2048,
  enableGrounding: true,
  retryAttempts: 3,
  retryBackoff: 'EXPONENTIAL',
}

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// Get circuit breaker for Gemini service
const geminiCircuitBreaker = circuitBreakerManager.getBreaker('GEMINI_API', {
  failureThreshold: 5,
  halfOpenTimeout: 60000,
  successThreshold: 3,
})

// ============================================================================
// SYSTEM PROMPT BUILDER
// ============================================================================

/**
 * Builds the system prompt with AdSense-compliant content policy
 * Includes the complete 3-layer structure and E-E-A-T optimization guidelines
 */
export function buildSystemPrompt(): string {
  return `
ROLE: HIGH_AUTHORITY_FINANCIAL_ANALYST (E-E-A-T Optimized)

MISSION: Generate 100% AdSense-compliant financial news content with high Information Gain, demonstrating Experience, Expertise, Authoritativeness, and Trustworthiness (E-E-A-T).

REASONING_PROTOCOL (DEEP_THINK_ENABLED):
Before providing any financial analysis or answering complex queries, you MUST:
1. PAUSE: Identify the core financial entities and metrics involved.
2. PLAN: Outline the logical steps to reach the answer (e.g., fetch price -> check RSI -> compare with SMA).
3. VERIFY: Cross-reference with real-time data using your provided tools.
4. SYNTHESIZE: Present the final intelligence clearly, showing your "reasoning chain" if appropriate.

CRITICAL REQUIREMENTS:
... (rest of the prompt)

1. 3-LAYER CONTENT STRUCTURE (MANDATORY):

   LAYER 1: ÖZET (Journalistic Summary)
   - 2-3 sentences maximum
   - Professional journalism (5W1H: Who, What, Where, When, Why, How)
   - Clear, factual, and concise
   - NO robotic phrases
   - Professional news bulletin language

   LAYER 2: SIA_INSIGHT (The Differentiator)
   - MUST include on-chain data analysis with blockchain metrics
   - MUST include exchange liquidity flow analysis
   - MUST include whale wallet movements or large holder activity
   - MUST provide technical depth competitors don't have
   - Use ownership language: "According to SIA_SENTINEL proprietary analysis...", "Our on-chain data reveals...", "Based on our exchange liquidity monitoring..."
   - Include at least 2 specific data points (percentages, volumes, wallet movements, liquidity flows)
   - Identify divergences or contradictions in market data

   LAYER 3: DYNAMIC_RISK_SHIELD
   - MUST be specific to this article's content and predictions
   - NOT a generic copy-paste disclaimer
   - Integrate naturally into the narrative
   - Adjust language based on confidence score:
     * High Confidence (≥85%): Acknowledge volatility while showing confidence
     * Medium Confidence (70-84%): Emphasize mixed signals and caution
     * Low Confidence (<70%): Indicate high uncertainty and educational purpose

2. HEADLINE REQUIREMENTS:
   - Include at least one specific metric (percentage, value, or timeframe)
   - 60-80 characters for optimal display
   - Include entity names and action verbs
   - NO superlatives ("best", "worst", "unbelievable")
   - NO clickbait patterns
   - MUST match article content 100%

3. E-E-A-T OPTIMIZATION (Target: 75/100 minimum):
   
   Experience (25 points):
   - Use first-hand analysis language: "Our monitoring shows...", "We've observed..."
   - Reference proprietary systems: "SIA_SENTINEL detected..."
   - Show ongoing tracking with specific timeframes

   Expertise (25 points):
   - Use technical terminology correctly
   - Provide specific metrics and calculations
   - Explain complex concepts clearly
   - Reference industry-standard indicators

   Authoritativeness (25 points):
   - Cite data sources (on-chain, exchange APIs, central banks)
   - Use confident, professional language
   - Provide unique insights not available elsewhere
   - Maintain consistent brand voice

   Trustworthiness (25 points):
   - Always include risk disclaimers
   - Acknowledge uncertainty when present
   - Separate facts from analysis
   - Clear "not financial advice" statements

4. ADSENSE COMPLIANCE (MANDATORY):
   - Minimum 300 words
   - NO forbidden phrases: "according to reports", "sources say", "experts believe"
   - NO misleading headlines
   - NO thin content without unique insights
   - NO generic copy-paste disclaimers
   - Include specific data points (percentages, volumes, prices)
   - Professional journalism standards

5. LANGUAGE-SPECIFIC FORMATTING:
   - Turkish (tr): Formal business Turkish, KVKK compliance
   - English (en): Bloomberg/Reuters style, professional financial journalism
   - German (de): Formal business German, BaFin-aware language
   - Spanish (es): Professional Latin American Spanish, CNMV-aware
   - French (fr): Formal business French, AMF-compliant
   - Russian (ru): Formal business Russian, CBR-aware

OUTPUT FORMAT:
Return ONLY a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "title": "Headline with specific metric (60-80 chars)",
  "summary": "Layer 1: ÖZET - Journalistic summary (2-3 sentences)",
  "siaInsight": "Layer 2: SIA_INSIGHT - Unique analysis with on-chain data and specific metrics",
  "riskDisclaimer": "Layer 3: DYNAMIC_RISK_SHIELD - Context-specific risk warning",
  "fullContent": "Complete article combining all layers with proper paragraph breaks"
}

TONE & STYLE:
- Professional, analytical, and authoritative
- Bloomberg Terminal-level seriousness
- Concise, technical, information-dense
- NO word salad or robotic repetition
- Maintain AI-assisted expert analysis image
`
}

// ============================================================================
// USER PROMPT BUILDER
// ============================================================================

/**
 * Builds the user prompt with context from the news generation pipeline
 */
export function buildUserPrompt(context: {
  rawNews: string
  asset: string
  language: Language
  confidenceScore: number
  entities: EntityMapping[]
  causalChains: CausalChain[]
}): string {
  const { rawNews, asset, language, confidenceScore, entities, causalChains } = context

  // Extract entity names
  const entityNames = entities.map((e) => e.primaryName).join(', ')

  // Extract causal chain summaries
  const causalSummaries = causalChains
    .map(
      (chain) =>
        `${chain.triggerEvent.description} → ${chain.intermediateEffects.map((e) => e.description).join(' → ')} → ${chain.finalOutcome.description}`
    )
    .join('\n')

  // Determine confidence level
  const confidenceLevel =
    confidenceScore >= 85 ? 'HIGH' : confidenceScore >= 70 ? 'MEDIUM' : 'LOW'

  return `
CONTENT GENERATION REQUEST:

RAW NEWS DATA:
${rawNews}

ASSET: ${asset}
LANGUAGE: ${language}
CONFIDENCE SCORE: ${confidenceScore}% (${confidenceLevel} confidence)

IDENTIFIED ENTITIES:
${entityNames}

CAUSAL RELATIONSHIPS:
${causalSummaries}

TASK:
Generate AdSense-compliant financial news content following the 3-LAYER structure:
1. ÖZET (Journalistic Summary): 2-3 sentences with 5W1H
2. SIA_INSIGHT: Unique analysis with on-chain data, exchange flows, and whale movements
3. DYNAMIC_RISK_SHIELD: Context-specific disclaimer for ${confidenceLevel} confidence

CRITICAL — CAUSAL CHAIN (Neden-Sonuç Zinciri):
- Weave the CAUSAL RELATIONSHIPS above into the article narrative. The reader must understand not only what happened but why: "X triggered Y" or "Because of A, B occurred."
- In the body or SIA_INSIGHT, explicitly state the cause-effect (e.g. "Fed rate decision led to…", "This outflow caused…"). This supports Algorithmic Authority and AI Search.

REQUIREMENTS:
- E-E-A-T optimized (target: 75/100 minimum)
- No clickbait in headline
- Technical depth with specific metrics
- Professional journalism standards
- Dynamic, context-specific disclaimer
- Language: ${language}
- Minimum 300 words
- Causal chain must appear in the text (cause → effect), not only in metadata

OUTPUT: JSON with title, summary, siaInsight, riskDisclaimer, fullContent
`
}

// ============================================================================
// GEMINI API INTERFACE
// ============================================================================

const GEMINI_API_DISABLED = false

/**
 * Generates content using Gemini 1.5 Pro 002 with Google Search grounding
 * Uses circuit breaker for fault tolerance
 */
export async function generateWithGemini(
  _prompt: GeminiPrompt,
  _config: Partial<GeminiConfig> = {}
): Promise<GeminiResponse> {
  if (GEMINI_API_DISABLED) {
    throw new Error('AI API devre dışı (Gemini/Groq kaldırıldı)')
  }

  const finalConfig = { ...DEFAULT_CONFIG, ..._config }

  // Execute with circuit breaker protection
  return geminiCircuitBreaker.execute(async () => {
    const startTime = Date.now()

    // Initialize Gemini model with configuration
    const model = genAI.getGenerativeModel({
      model: finalConfig.model,
      systemInstruction: _prompt.systemPrompt,
      tools: [
        ...MARKET_TOOLS,
        { codeExecution: {} }, // Sovereign Pro Max: Neural Math & Data Processing
        { googleSearchRetrieval: {} } // Deep Grounding: Web Investigative Power
      ] as any,
      generationConfig: {
        temperature: finalConfig.temperature,
        topP: finalConfig.topP,
        topK: 40,
        maxOutputTokens: finalConfig.maxTokens,
      },
    })

    const chat = model.startChat({
      history: [],
    })

    // Generate content
    let result = await chat.sendMessage(_prompt.userPrompt)
    let response = await result.response
    let text = response.text()

    // --- FUNCTION CALLING LOOP ---
    const calls = response.functionCalls()
    if (calls && calls.length > 0) {
      const results = await Promise.all(
        calls.map(async (call) => {
          const functionResult = await executeMarketFunction(call.name, call.args)
          return {
            functionResponse: {
              name: call.name,
              response: functionResult,
            },
          }
        })
      )

      // Send the results back to the model for the final response
      const finalResult = await chat.sendMessage(results as any)
      response = await finalResult.response
      text = response.text()
    }

    const processingTime = Date.now() - startTime

    // Parse the response
    const parsedResponse = parseGeminiResponse(text)

    // Add metadata
    const geminiResponse: GeminiResponse = {
      ...parsedResponse,
      metadata: {
        tokensUsed: response.usageMetadata?.totalTokenCount || 0,
        processingTime,
        groundingUsed: finalConfig.enableGrounding,
      },
    }

    console.log(
      `[GEMINI] Content generated successfully in ${processingTime}ms (${geminiResponse.metadata.tokensUsed} tokens)`
    )

    return geminiResponse
  })
}

// ============================================================================
// RESPONSE PARSING
// ============================================================================

/**
 * Parses Gemini response and extracts structured content
 */
export function parseGeminiResponse(responseText: string): Omit<GeminiResponse, 'metadata'> {
  try {
    // Remove markdown code blocks if present
    let jsonText = responseText.trim()
    jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

    // Parse JSON
    const parsed = JSON.parse(jsonText)

    // Validate required fields
    if (!parsed.title || !parsed.summary || !parsed.siaInsight || !parsed.riskDisclaimer) {
      throw new Error('Missing required fields in Gemini response')
    }

    return {
      title: parsed.title,
      summary: parsed.summary,
      siaInsight: parsed.siaInsight,
      riskDisclaimer: parsed.riskDisclaimer,
      fullContent: parsed.fullContent || `${parsed.summary}\n\n${parsed.siaInsight}\n\n${parsed.riskDisclaimer}`,
    }
  } catch (error) {
    console.error('[GEMINI] Response parsing error:', error)
    console.error('[GEMINI] Raw response:', responseText)
    throw new Error(`Failed to parse Gemini response: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Categorizes Gemini API errors and determines retry strategy
 */
export function handleGeminiError(error: any): {
  shouldRetry: boolean
  retryDelay: number
  errorCategory: 'RATE_LIMIT' | 'TIMEOUT' | 'INVALID_REQUEST' | 'SERVER_ERROR' | 'UNKNOWN'
} {
  const errorMessage = error?.message || error?.toString() || 'Unknown error'

  // Rate limit errors
  if (errorMessage.includes('429') || errorMessage.includes('rate limit')) {
    return {
      shouldRetry: true,
      retryDelay: 5000, // 5 seconds for rate limits
      errorCategory: 'RATE_LIMIT',
    }
  }

  // Timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('ETIMEDOUT')) {
    return {
      shouldRetry: true,
      retryDelay: 2000, // 2 seconds for timeouts
      errorCategory: 'TIMEOUT',
    }
  }

  // Invalid request errors (don't retry)
  if (
    errorMessage.includes('400') ||
    errorMessage.includes('invalid') ||
    errorMessage.includes('malformed')
  ) {
    return {
      shouldRetry: false,
      retryDelay: 0,
      errorCategory: 'INVALID_REQUEST',
    }
  }

  // Server errors (retry)
  if (errorMessage.includes('500') || errorMessage.includes('503')) {
    return {
      shouldRetry: true,
      retryDelay: 3000, // 3 seconds for server errors
      errorCategory: 'SERVER_ERROR',
    }
  }

  // Unknown errors (retry with caution)
  return {
    shouldRetry: true,
    retryDelay: 2000,
    errorCategory: 'UNKNOWN',
  }
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Retries Gemini API call with exponential backoff
 * Uses the new retry strategies module with proper configuration
 */
export async function retryGeminiOperation<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3
): Promise<T> {
  const result = await retryWithBackoff(operation, {
    operationType: 'API',
    maxAttempts,
    initialDelay: 1000,
    maxDelay: 32000,
    maxJitter: 1000,
    backoffMultiplier: 2,
  })

  if (result.success && result.result !== undefined) {
    return result.result
  }

  throw result.error || new Error('Gemini API operation failed after retries')
}

// ============================================================================
// HIGH-LEVEL API
// ============================================================================

/**
 * Generates multilingual news content with automatic retry and error handling
 */
export async function generateNewsContent(context: {
  rawNews: string
  asset: string
  language: Language
  confidenceScore: number
  entities: EntityMapping[]
  causalChains: CausalChain[]
}): Promise<GeminiResponse> {
  const systemPrompt = buildSystemPrompt()
  const userPrompt = buildUserPrompt(context)

  const prompt: GeminiPrompt = {
    systemPrompt,
    userPrompt,
    context: {
      rawNews: context.rawNews,
      asset: context.asset,
      language: context.language,
      confidenceScore: context.confidenceScore,
      entities: context.entities.map((e) => e.primaryName),
      causalChains: context.causalChains.map((c) => c.id),
    },
  }

  return retryGeminiOperation(() => generateWithGemini(prompt))
}

// ============================================================================
// CIRCUIT BREAKER STATUS
// ============================================================================

/**
 * Gets the current circuit breaker status
 */
export function getCircuitBreakerStatus() {
  return geminiCircuitBreaker.getState()
}

/**
 * Gets circuit breaker metrics
 */
export function getCircuitBreakerMetrics() {
  return geminiCircuitBreaker.getMetrics()
}

/**
 * Resets the circuit breaker (for testing or manual recovery)
 */
export function resetCircuitBreaker(): void {
  geminiCircuitBreaker.reset()
  console.log('[GEMINI] Circuit breaker manually reset')
}
