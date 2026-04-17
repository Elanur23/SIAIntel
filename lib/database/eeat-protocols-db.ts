/**
 * E-E-A-T Reasoning Protocols Database
 * Mock database implementation using in-memory Map structures
 * Following existing pattern from lib/database.ts
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface HistoricalCorrelation {
  id: string
  premise: string
  effect: string
  asset: string
  correlationCoefficient: number // 0.0-1.0
  lookbackPeriod: string // e.g., "12 months"
  occurrenceCount: number
  accuracyPercentage: number // e.g., 90 means "90% accurate"
  confidenceInterval: {
    lower: number
    upper: number
  }
  sources: string[]
  lastUpdated: string // ISO 8601
}

export interface SentimentPattern {
  id: string
  date: string // ISO 8601
  asset: string
  initialSentiment: number // 0-100
  breakpointSentiment: number // 0-100
  duration: number // days
  triggerEvent: string
  metadata: {
    marketConditions: string
    volumeChange: number
    priceChange: number
  }
}

export interface EntityRelationship {
  id: string
  primaryEntity: string
  relatedEntities: string[]
  category: 'MARKET_INDICATOR' | 'ON_CHAIN' | 'CORRELATION' | 'TECHNICAL' | 'MACRO'
  interconnections: Array<{
    targetEntity: string
    connectionType: 'CORRELATION' | 'CAUSATION' | 'INVERSE' | 'LEADING_INDICATOR'
    strength: number // 0.0-1.0
  }>
  languageVariants: Record<string, string> // language → translation
  lastUpdated: string // ISO 8601
}

export interface AuthorityManifestoRecord {
  id: string
  content: string
  topic: string
  asset: string
  language: string
  uniquenessScore: number // 0-100
  createdAt: string // ISO 8601
}

export interface SourceCredibility {
  sourceName: string
  type: 'ON_CHAIN' | 'SENTIMENT' | 'CORRELATION' | 'MACRO'
  credibilityScore: number // 0-100
  verificationURL?: string
  lastVerified: string // ISO 8601
}

// ============================================================================
// IN-MEMORY DATABASES
// ============================================================================

const historicalCorrelationsDB = new Map<string, HistoricalCorrelation>()
const sentimentPatternsDB = new Map<string, SentimentPattern>()
const entityRelationshipsDB = new Map<string, EntityRelationship>()
const authorityManifestosDB = new Map<string, AuthorityManifestoRecord>()
const sourceCredibilityDB = new Map<string, SourceCredibility>()

// ============================================================================
// SEED DATA
// ============================================================================

// Seed Source Credibility (Whitelist)
const sourceCredibilitySeedData: SourceCredibility[] = [
  // ON_CHAIN sources
  { sourceName: 'Glassnode', type: 'ON_CHAIN', credibilityScore: 94, verificationURL: 'https://glassnode.com', lastVerified: '2026-03-01T00:00:00Z' },
  { sourceName: 'CryptoQuant', type: 'ON_CHAIN', credibilityScore: 91, verificationURL: 'https://cryptoquant.com', lastVerified: '2026-03-01T00:00:00Z' },
  { sourceName: 'Etherscan', type: 'ON_CHAIN', credibilityScore: 96, verificationURL: 'https://etherscan.io', lastVerified: '2026-03-01T00:00:00Z' },
  { sourceName: 'Blockchain.com', type: 'ON_CHAIN', credibilityScore: 88, verificationURL: 'https://blockchain.com', lastVerified: '2026-03-01T00:00:00Z' },
  
  // SENTIMENT sources
  { sourceName: 'Crypto Fear & Greed Index', type: 'SENTIMENT', credibilityScore: 87, verificationURL: 'https://alternative.me/crypto/fear-and-greed-index/', lastVerified: '2026-03-01T00:00:00Z' },
  { sourceName: 'LunarCrush', type: 'SENTIMENT', credibilityScore: 82, verificationURL: 'https://lunarcrush.com', lastVerified: '2026-03-01T00:00:00Z' },
  { sourceName: 'Santiment', type: 'SENTIMENT', credibilityScore: 85, verificationURL: 'https://santiment.net', lastVerified: '2026-03-01T00:00:00Z' },
  
  // CORRELATION sources
  { sourceName: 'Federal Reserve', type: 'CORRELATION', credibilityScore: 98, verificationURL: 'https://www.federalreserve.gov', lastVerified: '2026-03-01T00:00:00Z' },
  { sourceName: 'World Gold Council', type: 'CORRELATION', credibilityScore: 93, verificationURL: 'https://www.gold.org', lastVerified: '2026-03-01T00:00:00Z' },
  { sourceName: 'Bloomberg', type: 'CORRELATION', credibilityScore: 91, verificationURL: 'https://www.bloomberg.com', lastVerified: '2026-03-01T00:00:00Z' },
  { sourceName: 'Reuters', type: 'CORRELATION', credibilityScore: 92, verificationURL: 'https://www.reuters.com', lastVerified: '2026-03-01T00:00:00Z' },
  
  // MACRO sources
  { sourceName: 'IMF', type: 'MACRO', credibilityScore: 96, verificationURL: 'https://www.imf.org', lastVerified: '2026-03-01T00:00:00Z' },
  { sourceName: 'World Bank', type: 'MACRO', credibilityScore: 95, verificationURL: 'https://www.worldbank.org', lastVerified: '2026-03-01T00:00:00Z' },
  { sourceName: 'BIS', type: 'MACRO', credibilityScore: 94, verificationURL: 'https://www.bis.org', lastVerified: '2026-03-01T00:00:00Z' },
  { sourceName: 'ECB', type: 'MACRO', credibilityScore: 97, verificationURL: 'https://www.ecb.europa.eu', lastVerified: '2026-03-01T00:00:00Z' }
]

// Seed Historical Correlations (12+ months of sample data)
const historicalCorrelationsSeedData: HistoricalCorrelation[] = [
  {
    id: 'corr-001',
    premise: 'Whale wallet accumulation increases',
    effect: 'Price rally within 7-14 days',
    asset: 'BTC',
    correlationCoefficient: 0.87,
    lookbackPeriod: '24 months',
    occurrenceCount: 34,
    accuracyPercentage: 87,
    confidenceInterval: { lower: 0.82, upper: 0.92 },
    sources: ['Glassnode', 'CryptoQuant'],
    lastUpdated: '2026-03-01T00:00:00Z'
  },
  {
    id: 'corr-002',
    premise: 'Exchange inflows decline sharply',
    effect: 'Supply shock and price increase',
    asset: 'BTC',
    correlationCoefficient: 0.79,
    lookbackPeriod: '18 months',
    occurrenceCount: 28,
    accuracyPercentage: 79,
    confidenceInterval: { lower: 0.73, upper: 0.85 },
    sources: ['CryptoQuant', 'Glassnode'],
    lastUpdated: '2026-03-01T00:00:00Z'
  },
  {
    id: 'corr-003',
    premise: 'Real yields turn negative',
    effect: 'Bitcoin price appreciation',
    asset: 'BTC',
    correlationCoefficient: 0.82,
    lookbackPeriod: '36 months',
    occurrenceCount: 42,
    accuracyPercentage: 82,
    confidenceInterval: { lower: 0.77, upper: 0.87 },
    sources: ['Federal Reserve', 'Bloomberg'],
    lastUpdated: '2026-03-01T00:00:00Z'
  },
  {
    id: 'corr-004',
    premise: 'Fear & Greed Index reaches extreme fear (<20)',
    effect: 'Market bottom formation',
    asset: 'BTC',
    correlationCoefficient: 0.74,
    lookbackPeriod: '48 months',
    occurrenceCount: 18,
    accuracyPercentage: 74,
    confidenceInterval: { lower: 0.67, upper: 0.81 },
    sources: ['Crypto Fear & Greed Index', 'Glassnode'],
    lastUpdated: '2026-03-01T00:00:00Z'
  },
  {
    id: 'corr-005',
    premise: 'Central bank gold purchases increase',
    effect: 'Bitcoin correlation strengthens',
    asset: 'BTC',
    correlationCoefficient: 0.68,
    lookbackPeriod: '24 months',
    occurrenceCount: 22,
    accuracyPercentage: 68,
    confidenceInterval: { lower: 0.61, upper: 0.75 },
    sources: ['World Gold Council', 'Bloomberg'],
    lastUpdated: '2026-03-01T00:00:00Z'
  },
  {
    id: 'corr-006',
    premise: 'DXY Index weakens significantly',
    effect: 'Bitcoin price rally',
    asset: 'BTC',
    correlationCoefficient: 0.76,
    lookbackPeriod: '30 months',
    occurrenceCount: 31,
    accuracyPercentage: 76,
    confidenceInterval: { lower: 0.70, upper: 0.82 },
    sources: ['Bloomberg', 'Federal Reserve'],
    lastUpdated: '2026-03-01T00:00:00Z'
  },
  {
    id: 'corr-007',
    premise: 'Ethereum gas fees spike',
    effect: 'Network congestion and price volatility',
    asset: 'ETH',
    correlationCoefficient: 0.71,
    lookbackPeriod: '18 months',
    occurrenceCount: 45,
    accuracyPercentage: 71,
    confidenceInterval: { lower: 0.65, upper: 0.77 },
    sources: ['Etherscan', 'Glassnode'],
    lastUpdated: '2026-03-01T00:00:00Z'
  },
  {
    id: 'corr-008',
    premise: 'Stablecoin supply increases',
    effect: 'Buying pressure within 30 days',
    asset: 'BTC',
    correlationCoefficient: 0.69,
    lookbackPeriod: '24 months',
    occurrenceCount: 26,
    accuracyPercentage: 69,
    confidenceInterval: { lower: 0.62, upper: 0.76 },
    sources: ['Glassnode', 'CryptoQuant'],
    lastUpdated: '2026-03-01T00:00:00Z'
  }
]

// Seed Sentiment Patterns (20+ historical breakpoint examples)
const sentimentPatternsSeedData: SentimentPattern[] = [
  {
    id: 'pattern-001',
    date: '2025-01-15T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 78,
    breakpointSentiment: 32,
    duration: 12,
    triggerEvent: 'Regulatory uncertainty announcement',
    metadata: { marketConditions: 'Bull market peak', volumeChange: -45, priceChange: -18 }
  },
  {
    id: 'pattern-002',
    date: '2025-03-22T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 25,
    breakpointSentiment: 68,
    duration: 9,
    triggerEvent: 'Institutional adoption news',
    metadata: { marketConditions: 'Bear market bottom', volumeChange: 67, priceChange: 34 }
  },
  {
    id: 'pattern-003',
    date: '2025-05-10T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 82,
    breakpointSentiment: 41,
    duration: 14,
    triggerEvent: 'Exchange hack incident',
    metadata: { marketConditions: 'Overheated market', volumeChange: -52, priceChange: -22 }
  },
  {
    id: 'pattern-004',
    date: '2025-07-08T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 19,
    breakpointSentiment: 71,
    duration: 11,
    triggerEvent: 'ETF approval speculation',
    metadata: { marketConditions: 'Extreme fear zone', volumeChange: 78, priceChange: 41 }
  },
  {
    id: 'pattern-005',
    date: '2025-09-14T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 75,
    breakpointSentiment: 38,
    duration: 10,
    triggerEvent: 'Fed rate hike announcement',
    metadata: { marketConditions: 'Greed zone', volumeChange: -41, priceChange: -16 }
  },
  {
    id: 'pattern-006',
    date: '2025-11-03T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 28,
    breakpointSentiment: 69,
    duration: 8,
    triggerEvent: 'Whale accumulation detected',
    metadata: { marketConditions: 'Fear zone', volumeChange: 62, priceChange: 29 }
  },
  {
    id: 'pattern-007',
    date: '2024-02-18T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 81,
    breakpointSentiment: 35,
    duration: 13,
    triggerEvent: 'Leverage liquidation cascade',
    metadata: { marketConditions: 'Extreme greed', volumeChange: -58, priceChange: -24 }
  },
  {
    id: 'pattern-008',
    date: '2024-04-25T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 22,
    breakpointSentiment: 74,
    duration: 10,
    triggerEvent: 'Halving event anticipation',
    metadata: { marketConditions: 'Capitulation phase', volumeChange: 71, priceChange: 38 }
  },
  {
    id: 'pattern-009',
    date: '2024-06-12T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 77,
    breakpointSentiment: 39,
    duration: 11,
    triggerEvent: 'Macro uncertainty spike',
    metadata: { marketConditions: 'Greed zone', volumeChange: -47, priceChange: -19 }
  },
  {
    id: 'pattern-010',
    date: '2024-08-07T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 26,
    breakpointSentiment: 72,
    duration: 9,
    triggerEvent: 'Technical breakout confirmation',
    metadata: { marketConditions: 'Fear zone', volumeChange: 65, priceChange: 32 }
  },
  {
    id: 'pattern-011',
    date: '2024-10-19T00:00:00Z',
    asset: 'ETH',
    initialSentiment: 79,
    breakpointSentiment: 36,
    duration: 12,
    triggerEvent: 'Network congestion issues',
    metadata: { marketConditions: 'Greed zone', volumeChange: -49, priceChange: -21 }
  },
  {
    id: 'pattern-012',
    date: '2024-12-05T00:00:00Z',
    asset: 'ETH',
    initialSentiment: 24,
    breakpointSentiment: 70,
    duration: 10,
    triggerEvent: 'Upgrade announcement',
    metadata: { marketConditions: 'Fear zone', volumeChange: 68, priceChange: 35 }
  },
  {
    id: 'pattern-013',
    date: '2025-02-14T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 83,
    breakpointSentiment: 40,
    duration: 14,
    triggerEvent: 'Profit-taking wave',
    metadata: { marketConditions: 'Extreme greed', volumeChange: -54, priceChange: -23 }
  },
  {
    id: 'pattern-014',
    date: '2025-04-20T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 21,
    breakpointSentiment: 73,
    duration: 8,
    triggerEvent: 'Institutional buying surge',
    metadata: { marketConditions: 'Extreme fear', volumeChange: 74, priceChange: 39 }
  },
  {
    id: 'pattern-015',
    date: '2025-06-08T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 76,
    breakpointSentiment: 37,
    duration: 11,
    triggerEvent: 'Regulatory crackdown',
    metadata: { marketConditions: 'Greed zone', volumeChange: -46, priceChange: -18 }
  },
  {
    id: 'pattern-016',
    date: '2025-08-16T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 27,
    breakpointSentiment: 71,
    duration: 9,
    triggerEvent: 'Market structure shift',
    metadata: { marketConditions: 'Fear zone', volumeChange: 66, priceChange: 33 }
  },
  {
    id: 'pattern-017',
    date: '2025-10-11T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 80,
    breakpointSentiment: 38,
    duration: 13,
    triggerEvent: 'Geopolitical tensions',
    metadata: { marketConditions: 'Greed zone', volumeChange: -50, priceChange: -20 }
  },
  {
    id: 'pattern-018',
    date: '2025-12-02T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 23,
    breakpointSentiment: 72,
    duration: 10,
    triggerEvent: 'Year-end rally catalyst',
    metadata: { marketConditions: 'Fear zone', volumeChange: 69, priceChange: 36 }
  },
  {
    id: 'pattern-019',
    date: '2024-01-28T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 84,
    breakpointSentiment: 42,
    duration: 15,
    triggerEvent: 'Bubble burst warning',
    metadata: { marketConditions: 'Extreme greed', volumeChange: -56, priceChange: -25 }
  },
  {
    id: 'pattern-020',
    date: '2024-03-17T00:00:00Z',
    asset: 'BTC',
    initialSentiment: 20,
    breakpointSentiment: 75,
    duration: 7,
    triggerEvent: 'Bottom confirmation signal',
    metadata: { marketConditions: 'Extreme fear', volumeChange: 76, priceChange: 42 }
  },
  {
    id: 'pattern-021',
    date: '2024-05-09T00:00:00Z',
    asset: 'ETH',
    initialSentiment: 78,
    breakpointSentiment: 34,
    duration: 12,
    triggerEvent: 'Smart contract vulnerability',
    metadata: { marketConditions: 'Greed zone', volumeChange: -48, priceChange: -19 }
  },
  {
    id: 'pattern-022',
    date: '2024-07-21T00:00:00Z',
    asset: 'ETH',
    initialSentiment: 25,
    breakpointSentiment: 69,
    duration: 9,
    triggerEvent: 'DeFi summer revival',
    metadata: { marketConditions: 'Fear zone', volumeChange: 64, priceChange: 31 }
  }
]

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

// Historical Correlations
export async function getHistoricalCorrelation(
  premise: string,
  effect: string,
  asset: string
): Promise<HistoricalCorrelation | null> {
  const key = `${premise}:${effect}:${asset}`
  for (const [, correlation] of historicalCorrelationsDB) {
    if (
      correlation.premise === premise &&
      correlation.effect === effect &&
      correlation.asset === asset
    ) {
      return correlation
    }
  }
  return null
}

export async function getAllHistoricalCorrelations(
  asset?: string
): Promise<HistoricalCorrelation[]> {
  const correlations = Array.from(historicalCorrelationsDB.values())
  if (asset) {
    return correlations.filter(c => c.asset === asset)
  }
  return correlations
}

export async function saveHistoricalCorrelation(
  correlation: HistoricalCorrelation
): Promise<void> {
  historicalCorrelationsDB.set(correlation.id, correlation)
}

// Sentiment Patterns
export async function getSentimentPatterns(
  asset: string,
  sentimentRange?: { min: number; max: number }
): Promise<SentimentPattern[]> {
  let patterns = Array.from(sentimentPatternsDB.values()).filter(
    p => p.asset === asset
  )
  
  if (sentimentRange) {
    patterns = patterns.filter(
      p =>
        p.initialSentiment >= sentimentRange.min &&
        p.initialSentiment <= sentimentRange.max
    )
  }
  
  return patterns
}

export async function saveSentimentPattern(
  pattern: SentimentPattern
): Promise<void> {
  sentimentPatternsDB.set(pattern.id, pattern)
}

// Entity Relationships
export async function getEntityRelationship(
  primaryEntity: string
): Promise<EntityRelationship | null> {
  for (const [, relationship] of entityRelationshipsDB) {
    if (relationship.primaryEntity === primaryEntity) {
      return relationship
    }
  }
  return null
}

export async function getAllEntityRelationships(
  category?: string
): Promise<EntityRelationship[]> {
  const relationships = Array.from(entityRelationshipsDB.values())
  if (category) {
    return relationships.filter(r => r.category === category)
  }
  return relationships
}

export async function saveEntityRelationship(
  relationship: EntityRelationship
): Promise<void> {
  entityRelationshipsDB.set(relationship.id, relationship)
}

// Authority Manifestos
export async function getAuthorityManifestos(
  topic?: string,
  asset?: string,
  language?: string
): Promise<AuthorityManifestoRecord[]> {
  let manifestos = Array.from(authorityManifestosDB.values())
  
  if (topic) {
    manifestos = manifestos.filter(m => m.topic === topic)
  }
  if (asset) {
    manifestos = manifestos.filter(m => m.asset === asset)
  }
  if (language) {
    manifestos = manifestos.filter(m => m.language === language)
  }
  
  return manifestos
}

export async function saveAuthorityManifesto(
  manifesto: AuthorityManifestoRecord
): Promise<void> {
  authorityManifestosDB.set(manifesto.id, manifesto)
}

// Source Credibility
export async function getSourceCredibility(
  sourceName: string
): Promise<SourceCredibility | null> {
  return sourceCredibilityDB.get(sourceName) || null
}

export async function getAllSourceCredibility(
  type?: string
): Promise<SourceCredibility[]> {
  const sources = Array.from(sourceCredibilityDB.values())
  if (type) {
    return sources.filter(s => s.type === type)
  }
  return sources
}

export async function saveSourceCredibility(
  source: SourceCredibility
): Promise<void> {
  sourceCredibilityDB.set(source.sourceName, source)
}

// ============================================================================
// INITIALIZATION
// ============================================================================

export async function initializeEEATProtocolsDatabase(): Promise<void> {
  // Clear existing data
  historicalCorrelationsDB.clear()
  sentimentPatternsDB.clear()
  entityRelationshipsDB.clear()
  authorityManifestosDB.clear()
  sourceCredibilityDB.clear()
  
  // Seed source credibility
  for (const source of sourceCredibilitySeedData) {
    await saveSourceCredibility(source)
  }
  
  // Seed historical correlations
  for (const correlation of historicalCorrelationsSeedData) {
    await saveHistoricalCorrelation(correlation)
  }
  
  // Seed sentiment patterns
  for (const pattern of sentimentPatternsSeedData) {
    await saveSentimentPattern(pattern)
  }
  
  console.log('✅ E-E-A-T Protocols Database initialized')
  console.log(`   - Source Credibility: ${sourceCredibilityDB.size} sources`)
  console.log(`   - Historical Correlations: ${historicalCorrelationsDB.size} correlations`)
  console.log(`   - Sentiment Patterns: ${sentimentPatternsDB.size} patterns`)
}

// Auto-initialize on import
initializeEEATProtocolsDatabase()
