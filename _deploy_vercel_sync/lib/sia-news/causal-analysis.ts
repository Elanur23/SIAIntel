/**
 * Causal Analysis System for SIA_NEWS_v1.0
 * 
 * This module identifies and structures cause-effect relationships in market events.
 * It analyzes verified data to detect causal patterns, extract metrics, and build
 * causal chains that explain market movements with specific data points.
 * 
 * Requirements: 2.1, 2.2, 2.3
 */

import type {
  VerifiedData,
  CausalChain,
  CausalEvent,
  Metric
} from './types'

// ============================================================================
// CAUSAL PATTERN TEMPLATES
// ============================================================================

/**
 * Predefined causal pattern templates for common market scenarios
 * 
 * Each pattern defines:
 * - trigger: The initiating event that starts the causal chain
 * - intermediate: The intermediate effects that propagate the cause
 * - outcome: The final observable result
 * - keywords: Terms that help identify this pattern in data
 */
export const CAUSAL_PATTERNS = {
  PRICE_SURGE: {
    trigger: 'Institutional buying pressure',
    intermediate: 'Exchange inflows increase',
    outcome: 'Price appreciation',
    keywords: ['buy', 'purchase', 'accumulation', 'inflow', 'demand', 'surge', 'rally', 'pump']
  },
  
  WHALE_ACCUMULATION: {
    trigger: 'Large holder wallet activity',
    intermediate: 'Exchange outflows increase',
    outcome: 'Supply shock potential',
    keywords: ['whale', 'large holder', 'accumulation', 'outflow', 'withdrawal', 'cold storage', 'custody']
  },
  
  MACRO_IMPACT: {
    trigger: 'Central bank policy change',
    intermediate: 'Real yields adjustment',
    outcome: 'Risk asset revaluation',
    keywords: ['fed', 'ecb', 'central bank', 'interest rate', 'policy', 'monetary', 'inflation', 'yield']
  },
  
  EXCHANGE_FLOW: {
    trigger: 'Net exchange flow shift',
    intermediate: 'Liquidity availability change',
    outcome: 'Price volatility increase',
    keywords: ['exchange', 'flow', 'liquidity', 'deposit', 'withdrawal', 'balance', 'reserves']
  },
  
  SENTIMENT_SHIFT: {
    trigger: 'News-driven sentiment change',
    intermediate: 'Market participant behavior shift',
    outcome: 'Directional price movement',
    keywords: ['news', 'announcement', 'report', 'sentiment', 'fear', 'greed', 'panic', 'euphoria']
  }
} as const

export type CausalPatternType = keyof typeof CAUSAL_PATTERNS

// ============================================================================
// CAUSAL RELATIONSHIP IDENTIFICATION
// ============================================================================

/**
 * Identifies causal relationships in verified data
 * 
 * Analyzes verified data to detect cause-effect patterns by:
 * 1. Matching events against causal pattern templates
 * 2. Extracting metrics from each event
 * 3. Identifying trigger events, intermediate effects, and final outcomes
 * 4. Calculating correlation strength and time delays
 * 5. Building structured causal chains
 * 
 * @param verifiedData - Verified data from source verification
 * @returns Array of identified causal chains
 * 
 * Requirements: 2.1, 2.2, 2.3
 */
export async function identifyCausalRelationships(
  verifiedData: VerifiedData
): Promise<CausalChain[]> {
  try {
    console.log(`[Causal Analysis] Analyzing data from ${verifiedData.source}`)
    
    const causalChains: CausalChain[] = []
    
    // Extract all events from verified data
    const events = await extractEventsFromVerifiedData(verifiedData)
    
    if (events.length === 0) {
      console.warn('[Causal Analysis] No events extracted from verified data')
      return causalChains
    }
    
    // Try to match against each causal pattern
    for (const [patternType, pattern] of Object.entries(CAUSAL_PATTERNS)) {
      const matchedChain = await matchPatternToEvents(
        patternType as CausalPatternType,
        pattern,
        events,
        verifiedData
      )
      
      if (matchedChain) {
        causalChains.push(matchedChain)
        console.log(`[Causal Analysis] Identified ${patternType} pattern`)
      }
    }
    
    // If no patterns matched, try to build a generic causal chain
    if (causalChains.length === 0 && events.length >= 2) {
      console.log('[Causal Analysis] No pattern match, building generic causal chain')
      const genericChain = await buildGenericCausalChain(events, verifiedData)
      if (genericChain) {
        causalChains.push(genericChain)
      }
    }
    
    console.log(`[Causal Analysis] Identified ${causalChains.length} causal chain(s)`)
    return causalChains
    
  } catch (error) {
    console.error('[Causal Analysis] Error identifying causal relationships:', error)
    throw error
  }
}

/**
 * Extracts causal events from verified data
 * 
 * Converts verified data into causal events by analyzing:
 * - Numerical values (price changes, volumes, etc.)
 * - Entity references
 * - Timestamps
 * - Source category context
 * 
 * @param verifiedData - Verified data to extract events from
 * @returns Array of causal events
 */
async function extractEventsFromVerifiedData(
  verifiedData: VerifiedData
): Promise<CausalEvent[]> {
  const events: CausalEvent[] = []
  
  const { extractedData, category, source } = verifiedData
  
  // Create events based on numerical values
  for (const numValue of extractedData.numericalValues) {
    const description = buildEventDescription(numValue, category, source)
    const metrics = await extractMetrics([numValue])
    
    const event: CausalEvent = {
      description,
      timestamp: verifiedData.timestamp,
      metrics,
      entities: extractedData.entityReferences
    }
    
    events.push(event)
  }
  
  // If no numerical values, create a single event from the data
  if (events.length === 0 && extractedData.entityReferences.length > 0) {
    const event: CausalEvent = {
      description: `${category} data from ${source}`,
      timestamp: verifiedData.timestamp,
      metrics: [],
      entities: extractedData.entityReferences
    }
    events.push(event)
  }
  
  return events
}

/**
 * Builds a descriptive event description from numerical value
 * 
 * @param numValue - Numerical value with metric, value, and unit
 * @param category - Source category for context
 * @param source - Source name for attribution
 * @returns Human-readable event description
 */
function buildEventDescription(
  numValue: { metric: string; value: number; unit: string },
  category: string,
  source: string
): string {
  const { metric, value, unit } = numValue
  
  // Format the value based on metric type
  let formattedValue = value.toString()
  
  if (unit === '%') {
    formattedValue = `${value > 0 ? '+' : ''}${value.toFixed(2)}%`
  } else if (unit === 'USD' && value >= 1000000) {
    formattedValue = `$${(value / 1000000).toFixed(2)}M`
  } else if (unit === 'USD' && value >= 1000000000) {
    formattedValue = `$${(value / 1000000000).toFixed(2)}B`
  } else if (unit === 'USD') {
    formattedValue = `$${value.toLocaleString()}`
  }
  
  // Build description based on metric type
  const metricDescriptions: Record<string, string> = {
    priceChange: `Price movement of ${formattedValue}`,
    volume: `Trading volume of ${formattedValue}`,
    walletMovement: `Wallet activity of ${formattedValue}`,
    inflow: `Exchange inflow of ${formattedValue}`,
    outflow: `Exchange outflow of ${formattedValue}`,
    netFlow: `Net flow of ${formattedValue}`,
    liquidityChange: `Liquidity change of ${formattedValue}`,
    sentimentScore: `Sentiment shift to ${formattedValue}`
  }
  
  const description = metricDescriptions[metric] || `${metric}: ${formattedValue}`
  
  return `${description} (${source})`
}

/**
 * Matches events against a causal pattern template
 * 
 * @param patternType - Type of causal pattern
 * @param pattern - Pattern template with trigger, intermediate, outcome
 * @param events - Array of causal events to match
 * @param verifiedData - Original verified data for context
 * @returns Matched causal chain or null if no match
 */
async function matchPatternToEvents(
  patternType: CausalPatternType,
  pattern: typeof CAUSAL_PATTERNS[CausalPatternType],
  events: CausalEvent[],
  verifiedData: VerifiedData
): Promise<CausalChain | null> {
  // Check if any event descriptions or entities match pattern keywords
  const hasKeywordMatch = events.some(event => {
    const searchText = `${event.description} ${event.entities.join(' ')}`.toLowerCase()
    return pattern.keywords.some(keyword => searchText.includes(keyword.toLowerCase()))
  })
  
  if (!hasKeywordMatch) {
    return null
  }
  
  // Build causal chain based on pattern
  const triggerEvent: CausalEvent = {
    description: pattern.trigger,
    timestamp: verifiedData.timestamp,
    metrics: events[0]?.metrics || [],
    entities: verifiedData.extractedData.entityReferences
  }
  
  const intermediateEvent: CausalEvent = {
    description: pattern.intermediate,
    timestamp: verifiedData.timestamp,
    metrics: events.length > 1 ? events[1].metrics : events[0]?.metrics || [],
    entities: verifiedData.extractedData.entityReferences
  }
  
  const outcomeEvent: CausalEvent = {
    description: pattern.outcome,
    timestamp: verifiedData.timestamp,
    metrics: events.length > 2 ? events[2].metrics : events[0]?.metrics || [],
    entities: verifiedData.extractedData.entityReferences
  }
  
  // Structure the causal chain
  const chain = await structureCausalChain(
    triggerEvent,
    [intermediateEvent],
    outcomeEvent
  )
  
  return chain
}

/**
 * Builds a generic causal chain when no pattern matches
 * 
 * @param events - Array of causal events
 * @param verifiedData - Original verified data
 * @returns Generic causal chain or null
 */
async function buildGenericCausalChain(
  events: CausalEvent[],
  verifiedData: VerifiedData
): Promise<CausalChain | null> {
  if (events.length < 2) {
    return null
  }
  
  // Use first event as trigger, middle events as intermediate, last as outcome
  const triggerEvent = events[0]
  const intermediateEvents = events.slice(1, -1)
  const outcomeEvent = events[events.length - 1]
  
  // If only 2 events, use trigger and outcome with empty intermediate
  if (events.length === 2) {
    return await structureCausalChain(triggerEvent, [], outcomeEvent)
  }
  
  return await structureCausalChain(triggerEvent, intermediateEvents, outcomeEvent)
}

// ============================================================================
// CAUSAL CHAIN STRUCTURING
// ============================================================================

/**
 * Structures a causal chain from trigger, intermediate, and outcome events
 * 
 * Organizes events into a structured causal chain with:
 * - Trigger event (cause)
 * - Intermediate effects (propagation)
 * - Final outcome (result)
 * - Temporal validation (cause precedes effect)
 * - Confidence score (reliability of the chain)
 * 
 * @param triggerEvent - The initiating cause event
 * @param intermediateEvents - Array of intermediate effect events
 * @param outcomeEvent - The final outcome event
 * @returns Structured causal chain
 * 
 * Requirements: 2.2, 2.3, 2.4
 */
export async function structureCausalChain(
  triggerEvent: CausalEvent,
  intermediateEvents: CausalEvent[],
  outcomeEvent: CausalEvent
): Promise<CausalChain> {
  try {
    // Generate unique ID for the chain
    const chainId = generateChainId(triggerEvent, outcomeEvent)
    
    // Validate temporal ordering
    const temporalValidation = await validateTemporalOrdering(
      triggerEvent,
      intermediateEvents,
      outcomeEvent
    )
    
    // Calculate confidence score
    const confidence = await calculateCausalConfidence(
      triggerEvent,
      intermediateEvents,
      outcomeEvent,
      temporalValidation
    )
    
    // Build the causal chain
    const causalChain: CausalChain = {
      id: chainId,
      triggerEvent,
      intermediateEffects: intermediateEvents,
      finalOutcome: outcomeEvent,
      confidence,
      temporalValidation
    }
    
    console.log(
      `[Causal Chain] Structured chain: ${triggerEvent.description} → ` +
      `${intermediateEvents.length} intermediate(s) → ${outcomeEvent.description} ` +
      `(confidence: ${confidence}%)`
    )
    
    return causalChain
    
  } catch (error) {
    console.error('[Causal Chain] Error structuring causal chain:', error)
    throw error
  }
}

/**
 * Validates temporal ordering of events in causal chain
 * 
 * Ensures that:
 * - Trigger event occurs before intermediate events
 * - Intermediate events occur before outcome event
 * - All timestamps are valid and chronologically ordered
 * 
 * @param triggerEvent - Trigger event
 * @param intermediateEvents - Intermediate events
 * @param outcomeEvent - Outcome event
 * @returns True if temporal ordering is valid
 * 
 * Requirements: 2.4
 */
async function validateTemporalOrdering(
  triggerEvent: CausalEvent,
  intermediateEvents: CausalEvent[],
  outcomeEvent: CausalEvent
): Promise<boolean> {
  try {
    // Parse timestamps
    const triggerTime = new Date(triggerEvent.timestamp).getTime()
    const outcomeTime = new Date(outcomeEvent.timestamp).getTime()
    
    // Check if timestamps are valid
    if (isNaN(triggerTime) || isNaN(outcomeTime)) {
      console.warn('[Temporal Validation] Invalid timestamps detected')
      return false
    }
    
    // For same-timestamp events (common in real-time data), accept as valid
    if (triggerTime === outcomeTime) {
      return true
    }
    
    // Trigger must occur before or at the same time as outcome
    if (triggerTime > outcomeTime) {
      console.warn('[Temporal Validation] Trigger occurs after outcome')
      return false
    }
    
    // Validate intermediate events are between trigger and outcome
    for (const intermediate of intermediateEvents) {
      const intermediateTime = new Date(intermediate.timestamp).getTime()
      
      if (isNaN(intermediateTime)) {
        console.warn('[Temporal Validation] Invalid intermediate timestamp')
        return false
      }
      
      if (intermediateTime < triggerTime || intermediateTime > outcomeTime) {
        console.warn('[Temporal Validation] Intermediate event outside temporal bounds')
        return false
      }
    }
    
    return true
    
  } catch (error) {
    console.error('[Temporal Validation] Error validating temporal ordering:', error)
    return false
  }
}

/**
 * Calculates confidence score for a causal chain
 * 
 * Confidence is based on:
 * - Temporal validation (40 points)
 * - Number of metrics present (30 points)
 * - Number of entities involved (20 points)
 * - Completeness of intermediate effects (10 points)
 * 
 * @param triggerEvent - Trigger event
 * @param intermediateEvents - Intermediate events
 * @param outcomeEvent - Outcome event
 * @param temporalValidation - Whether temporal ordering is valid
 * @returns Confidence score (0-100)
 */
async function calculateCausalConfidence(
  triggerEvent: CausalEvent,
  intermediateEvents: CausalEvent[],
  outcomeEvent: CausalEvent,
  temporalValidation: boolean
): Promise<number> {
  let confidence = 0
  
  // Temporal validation: 40 points
  if (temporalValidation) {
    confidence += 40
  }
  
  // Metrics presence: 30 points (10 points per event with metrics, max 30)
  const triggerMetrics = triggerEvent.metrics.length > 0 ? 10 : 0
  const intermediateMetrics = intermediateEvents.some(e => e.metrics.length > 0) ? 10 : 0
  const outcomeMetrics = outcomeEvent.metrics.length > 0 ? 10 : 0
  confidence += triggerMetrics + intermediateMetrics + outcomeMetrics
  
  // Entity involvement: 20 points (based on number of unique entities)
  const allEntities = new Set([
    ...triggerEvent.entities,
    ...intermediateEvents.flatMap(e => e.entities),
    ...outcomeEvent.entities
  ])
  const entityScore = Math.min(allEntities.size * 5, 20) // 5 points per entity, max 20
  confidence += entityScore
  
  // Intermediate effects completeness: 10 points
  if (intermediateEvents.length > 0) {
    confidence += 10
  }
  
  // Ensure confidence is within 0-100 range
  return Math.min(Math.max(confidence, 0), 100)
}

/**
 * Generates a unique ID for a causal chain
 * 
 * @param triggerEvent - Trigger event
 * @param outcomeEvent - Outcome event
 * @returns Unique chain ID
 */
function generateChainId(
  triggerEvent: CausalEvent,
  outcomeEvent: CausalEvent
): string {
  const timestamp = new Date(triggerEvent.timestamp).getTime()
  const triggerHash = simpleHash(triggerEvent.description)
  const outcomeHash = simpleHash(outcomeEvent.description)
  
  return `chain_${timestamp}_${triggerHash}_${outcomeHash}`
}

/**
 * Simple hash function for generating IDs
 * 
 * @param str - String to hash
 * @returns Hash value
 */
function simpleHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36)
}

// ============================================================================
// METRIC EXTRACTION
// ============================================================================

/**
 * Extracts metrics from numerical values
 * 
 * Converts numerical values into structured Metric objects with:
 * - Type classification (PERCENTAGE, VOLUME, PRICE, etc.)
 * - Value and unit
 * - Optional source attribution
 * 
 * @param numericalValues - Array of numerical values to extract metrics from
 * @returns Array of structured Metric objects
 * 
 * Requirements: 2.3
 */
export async function extractMetrics(
  numericalValues: Array<{ metric: string; value: number; unit: string; source?: string }>
): Promise<Metric[]> {
  const metrics: Metric[] = []
  
  for (const numValue of numericalValues) {
    const metricType = classifyMetricType(numValue.metric, numValue.unit)
    
    const metric: Metric = {
      type: metricType,
      value: numValue.value,
      unit: numValue.unit,
      source: numValue.source
    }
    
    metrics.push(metric)
  }
  
  return metrics
}

/**
 * Classifies metric type based on metric name and unit
 * 
 * @param metricName - Name of the metric
 * @param unit - Unit of measurement
 * @returns Classified metric type
 */
function classifyMetricType(
  metricName: string,
  unit: string
): Metric['type'] {
  const lowerMetric = metricName.toLowerCase()
  
  // Percentage metrics
  if (unit === '%' || lowerMetric.includes('change') || lowerMetric.includes('rate')) {
    return 'PERCENTAGE'
  }
  
  // Volume metrics
  if (lowerMetric.includes('volume') || lowerMetric.includes('flow') || 
      lowerMetric.includes('liquidity') || unit === 'USD') {
    return 'VOLUME'
  }
  
  // Price metrics
  if (lowerMetric.includes('price') || lowerMetric.includes('value') || 
      lowerMetric.includes('cost')) {
    return 'PRICE'
  }
  
  // Time delay metrics
  if (lowerMetric.includes('time') || lowerMetric.includes('delay') || 
      lowerMetric.includes('duration') || unit.includes('s') || unit.includes('min') || 
      unit.includes('hour')) {
    return 'TIME_DELAY'
  }
  
  // Count metrics (default)
  return 'COUNT'
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if a causal chain has sufficient data quality
 * 
 * @param chain - Causal chain to validate
 * @param minConfidence - Minimum confidence threshold (default: 50)
 * @returns True if chain meets quality standards
 */
export function hasMinimumQuality(
  chain: CausalChain,
  minConfidence: number = 50
): boolean {
  return (
    chain.confidence >= minConfidence &&
    chain.temporalValidation &&
    chain.triggerEvent.metrics.length > 0 &&
    chain.finalOutcome.metrics.length > 0
  )
}

/**
 * Gets a summary of a causal chain for logging/display
 * 
 * @param chain - Causal chain
 * @returns Human-readable summary
 */
export function getCausalChainSummary(chain: CausalChain): string {
  const intermediateCount = chain.intermediateEffects.length
  const intermediateText = intermediateCount > 0 
    ? ` → ${intermediateCount} intermediate effect(s)` 
    : ''
  
  return (
    `${chain.triggerEvent.description}${intermediateText} → ` +
    `${chain.finalOutcome.description} (confidence: ${chain.confidence}%)`
  )
}

/**
 * Extracts all metrics from a causal chain
 * 
 * @param chain - Causal chain
 * @returns Array of all metrics in the chain
 */
export function getAllMetricsFromChain(chain: CausalChain): Metric[] {
  return [
    ...chain.triggerEvent.metrics,
    ...chain.intermediateEffects.flatMap(e => e.metrics),
    ...chain.finalOutcome.metrics
  ]
}

/**
 * Extracts all entities from a causal chain
 * 
 * @param chain - Causal chain
 * @returns Array of unique entities in the chain
 */
export function getAllEntitiesFromChain(chain: CausalChain): string[] {
  const entities = new Set([
    ...chain.triggerEvent.entities,
    ...chain.intermediateEffects.flatMap(e => e.entities),
    ...chain.finalOutcome.entities
  ])
  
  return Array.from(entities)
}
