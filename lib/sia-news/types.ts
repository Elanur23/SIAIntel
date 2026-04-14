/**
 * Core TypeScript interfaces for SIA_NEWS_v1.0 - Multilingual Real-Time News Generation System
 * 
 * This file defines all data structures used throughout the system for type safety and consistency.
 */

// ============================================================================
// RAW DATA INGESTION TYPES
// ============================================================================

export interface RawDataSource {
  name: 'BINANCE' | 'WHALEALERT' | 'BLOOMBERG'
  websocketUrl: string
  reconnectInterval: number // milliseconds
  maxReconnectAttempts: number
}

export interface RawEvent {
  source: string
  eventType: 'PRICE_CHANGE' | 'WHALE_MOVEMENT' | 'NEWS_ALERT' | 'MACRO_DATA'
  timestamp: string // ISO 8601
  data: Record<string, any>
  rawPayload: string
}

export interface NormalizedEvent {
  id: string
  source: string
  eventType: string
  asset: string
  timestamp: string
  metrics: {
    priceChange?: number
    volume?: number
    walletMovement?: number
    [key: string]: any
  }
  isValid: boolean
  isDuplicate: boolean
}

// ============================================================================
// SOURCE VERIFICATION TYPES
// ============================================================================

export type SourceCategory = 'ON_CHAIN' | 'CENTRAL_BANK' | 'VERIFIED_NEWS_AGENCY'

export interface VerifiedData {
  source: string
  category: SourceCategory
  timestamp: string
  extractedData: {
    timestamps: string[]
    numericalValues: Array<{ metric: string; value: number; unit: string }>
    entityReferences: string[]
  }
  crossReferences: CrossReference[]
  auditTrail: AuditEntry
}

export interface CrossReference {
  primarySource: string
  secondarySource: string
  dataPoint: string
  primaryValue: any
  secondaryValue: any
  discrepancy: boolean
  discrepancyPercentage?: number
}

export interface AuditEntry {
  verificationTimestamp: string
  verifiedBy: string // System component name
  sourceAttribution: string
  validationResult: 'APPROVED' | 'REJECTED' | 'FLAGGED'
  rejectionReason?: string
}

// ============================================================================
// CAUSAL ANALYSIS TYPES
// ============================================================================

export interface CausalChain {
  id: string
  triggerEvent: CausalEvent
  intermediateEffects: CausalEvent[]
  finalOutcome: CausalEvent
  confidence: number // 0-100
  temporalValidation: boolean
}

export interface CausalEvent {
  description: string
  timestamp: string
  metrics: Metric[]
  entities: string[]
}

export interface Metric {
  type: 'PERCENTAGE' | 'VOLUME' | 'TIME_DELAY' | 'PRICE' | 'COUNT'
  value: number
  unit: string
  source?: string
}

export interface CausalRelationship {
  cause: string
  effect: string
  correlationStrength: number // 0.0-1.0
  timeDelay: number // milliseconds
  historicalPrecedents: number
}

// ============================================================================
// ENTITY MAPPING TYPES
// ============================================================================

export type EntityCategory = 'CRYPTOCURRENCY' | 'CENTRAL_BANK' | 'COMMODITY' | 'INDEX' | 'INSTITUTION'

export interface EntityMapping {
  entityId: string
  primaryName: string
  category: EntityCategory
  translations: Record<string, string> // language code → translated name
  definitions: Record<string, string> // language code → definition
  isNew: boolean
  storedAt?: string
}

export interface EntityMappingResult {
  entities: EntityMapping[]
  entityCount: number
  newEntitiesAdded: number
  consistencyScore: number // 0-100
}

// ============================================================================
// REGIONAL CONTEXT TYPES
// ============================================================================

export type Region = 'TR' | 'US' | 'DE' | 'FR' | 'ES' | 'RU' | 'AE' | 'JP' | 'CN'
export type Language = 'tr' | 'en' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'jp' | 'zh'

export interface RegionalContext {
  region: Region
  economicFocus: string[]
  priorityIndicators: string[]
  culturalReferences: string[]
  regulatoryContext: string
}

export interface RewrittenContent {
  region: Region
  language: Language
  headline: string
  content: string
  regionalAdaptations: string[]
  economicPsychology: string
  confidenceScore: number
}

// ============================================================================
// CONTENT GENERATION TYPES
// ============================================================================

export interface ContentGenerationRequest {
  verifiedData: VerifiedData
  causalChains: CausalChain[]
  entities: EntityMapping[]
  regionalContent: RewrittenContent
  language: Language
  asset: string
  confidenceScore: number
}

export interface GeneratedArticle {
  id: string
  language: Language
  region: Region
  
  // Content layers
  headline: string // 60-80 chars, includes metrics
  summary: string // Layer 1: ÖZET (2-3 sentences)
  siaInsight: string // Layer 2: Unique analysis with on-chain data
  riskDisclaimer: string // Layer 3: Dynamic, context-specific
  fullContent: string // Complete article
  
  // Technical components
  technicalGlossary: GlossaryEntry[]
  sentiment: SentimentScore
  entities: EntityMapping[]
  causalChains: CausalChain[]
  
  // Metadata
  metadata: ArticleMetadata
  
  // Quality scores
  eeatScore: number
  originalityScore: number
  technicalDepth: 'HIGH' | 'MEDIUM' | 'LOW'
  adSenseCompliant: boolean
}

export interface GlossaryEntry {
  term: string
  definition: string
  language: Language
  schemaMarkup: string // Schema.org format
}

export interface SentimentScore {
  overall: number // -100 to +100
  zone: 'EXTREME_FEAR' | 'FEAR' | 'NEUTRAL' | 'GREED' | 'EXTREME_GREED'
  byEntity: Record<string, number>
  confidence: number
  timestamp: string
}

export interface ArticleMetadata {
  generatedAt: string
  confidenceScore: number
  eeatScore: number
  wordCount: number
  readingTime: number // minutes
  sources: string[]
  processingTime: number // milliseconds
  eeATProtocols?: {
    quantumExpertiseSignals: number
    transparencyLayers: number
    semanticEntities: number
    authorityManifestoScore: number
    verificationScore: number
    protocolBonuses: {
      authorityManifesto: number
      quantumExpertise: number
      transparencyLayer: number
      entityMapping: number
      totalBonus: number
    }
    errors: Array<{
      protocol: string
      error: string
      timestamp: string
      severity: 'LOW' | 'MEDIUM' | 'HIGH'
    }>
  }
  adPlacement?: {
    totalSlots: number
    estimatedRevenuePerView: number
    estimatedRevenuePer1000Views: number
    estimatedMonthlyRevenue: number
  }
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export type ValidationAgentName = 'ACCURACY_VERIFIER' | 'IMPACT_ASSESSOR' | 'COMPLIANCE_CHECKER'

export interface ValidationAgent {
  name: ValidationAgentName
  role: string
  validationCriteria: string[]
}

export interface ValidationResult {
  agent: ValidationAgentName
  approved: boolean
  confidence: number // 0-100
  issues: ValidationIssue[]
  recommendations: string[]
  processingTime: number
}

export interface ValidationIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  category: string
  description: string
  suggestedFix?: string
}

export interface ConsensusResult {
  approved: boolean
  consensusScore: number // 0-3 (number of agents approving)
  overallConfidence: number
  criticalIssues: ValidationIssue[]
  requiresManualReview: boolean
  validationResults: ValidationResult[]
}

// ============================================================================
// PUBLISHING TYPES
// ============================================================================

export interface PublicationRequest {
  article: GeneratedArticle
  validationResult: ConsensusResult
  publishImmediately: boolean
  scheduledTime?: string
  useBuffer?: boolean // If true, add to content buffer instead of immediate publish
}

export interface PublicationResult {
  success: boolean
  articleId: string
  publishedAt: string
  webhooksTriggered: number
  indexesUpdated: string[]
  error?: string
  buffered?: boolean // True if article was added to buffer
  bufferId?: string // Buffer ID if buffered
}

export interface WebhookPayload {
  event: 'ARTICLE_PUBLISHED' | 'ARTICLE_UPDATED' | 'ARTICLE_REJECTED'
  articleId: string
  language: Language
  region: Region
  timestamp: string
  metadata: {
    eeatScore: number
    sentiment: number
    entities: string[]
  }
}

// ============================================================================
// DATABASE TYPES
// ============================================================================

export interface ArticleRecord {
  id: string
  language: Language
  region: Region
  
  // Content
  headline: string
  summary: string
  siaInsight: string
  riskDisclaimer: string
  fullContent: string
  
  // Structured data
  entities: string[]
  causalChains: string[]
  technicalGlossary: string[]
  
  // Scores and metrics
  sentiment: number
  eeatScore: number
  originalityScore: number
  technicalDepth: string
  confidenceScore: number
  
  // Metadata
  generatedAt: string
  publishedAt: string
  sources: string[]
  wordCount: number
  readingTime: number
  
  // Validation
  validationResult: string // JSON
  adSenseCompliant: boolean
  
  // Version control
  version: number
  previousVersionId?: string
}

export interface ArticleQuery {
  language?: Language
  region?: Region
  entities?: string[]
  sentimentRange?: { min: number; max: number }
  dateRange?: { start: string; end: string }
  minEEATScore?: number
  limit?: number
  offset?: number
}

export interface ArticleIndex {
  byLanguage: Map<string, string[]>
  byEntity: Map<string, string[]>
  bySentiment: Map<string, string[]>
  byDate: Map<string, string[]>
}

// ============================================================================
// GEMINI AI TYPES
// ============================================================================

export interface GeminiConfig {
  model: 'gemini-1.5-pro-002'
  temperature: 0.3
  topP: 0.8
  maxTokens: 2048
  enableGrounding: boolean
  retryAttempts: 3
  retryBackoff: 'EXPONENTIAL'
}

export interface GeminiPrompt {
  systemPrompt: string
  userPrompt: string
  context: {
    rawNews: string
    asset: string
    language: Language
    confidenceScore: number
    entities: string[]
    causalChains: string[]
  }
}

export interface GeminiResponse {
  title: string
  summary: string
  siaInsight: string
  riskDisclaimer: string
  fullContent: string
  metadata: {
    tokensUsed: number
    processingTime: number
    groundingUsed: boolean
  }
}

// ============================================================================
// MONITORING TYPES
// ============================================================================

export interface LogEntry {
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG'
  component: string
  message: string
  metadata?: Record<string, any>
}

export interface PerformanceMetrics {
  component: string
  operation: string
  duration: number
  success: boolean
  timestamp: string
}

export interface QualityMetrics {
  articleId: string
  eeatScore: number
  originalityScore: number
  technicalDepth: string
  sentimentScore: number
  wordCount: number
  timestamp: string
}

export interface SystemHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'DOWN'
  uptime: number
  components: {
    dataIngestion: 'UP' | 'DOWN' | 'DEGRADED'
    contentGeneration: 'UP' | 'DOWN' | 'DEGRADED'
    validation: 'UP' | 'DOWN' | 'DEGRADED'
    publishing: 'UP' | 'DOWN' | 'DEGRADED'
    database: 'UP' | 'DOWN' | 'DEGRADED'
  }
  lastCheck: string
}

export interface DailySummary {
  date: string
  totalArticles: number
  successfulPublications: number
  failedValidations: number
  avgEEATScore: number
  avgProcessingTime: number
  byLanguage: Record<string, number>
  topEntities: Array<{ entity: string; count: number }>
  qualityTrends: {
    eeatScore: number[]
    originalityScore: number[]
  }
}

// ============================================================================
// API TYPES
// ============================================================================

export interface GenerateRequest {
  rawNews: string
  asset: string
  language: Language
  region?: Region
  confidenceScore?: number
  publishImmediately?: boolean
}

export interface GenerateResponse {
  success: boolean
  articleId: string
  article: GeneratedArticle
  validationResult: ConsensusResult
  processingTime: number
}

export interface ArticlesRequest {
  language?: Language
  region?: Region
  entity?: string
  sentimentMin?: number
  sentimentMax?: number
  startDate?: string
  endDate?: string
  page?: number
  pageSize?: number
}

export interface ArticlesResponse {
  success: boolean
  articles: ArticleRecord[]
  pagination: {
    page: number
    pageSize: number
    totalCount: number
    totalPages: number
  }
}

export interface MetricsResponse {
  success: boolean
  timeRange: string
  timestamp: string
  realtime: {
    articlesGenerated: number
    successRate: number
    avgProcessingTime: number
    articlesPerHour: number
  }
  quality: {
    avgEEATScore: number
    avgSentiment: number
    avgOriginality: number
    technicalDepth?: Record<string, number>
  }
  byLanguage: Array<{
    language: string
    count: number
    avgEEATScore: number
    avgSentiment: number
    successRate: number
  }>
  byRegion: Array<{
    region: string
    count: number
    avgEEATScore: number
    avgSentiment: number
    successRate: number
  }>
  performance: {
    dataIngestion: number
    sourceVerification: number
    causalAnalysis: number
    entityMapping: number
    contentGeneration: number
    validation: number
    publishing: number
  }
  systemHealth: {
    status: 'HEALTHY' | 'DEGRADED' | 'DOWN'
    uptime: number
    components: Record<string, 'UP' | 'DOWN' | 'DEGRADED'>
  }
}

export interface WebhookRequest {
  url: string
  events: ('ARTICLE_PUBLISHED' | 'ARTICLE_UPDATED' | 'ARTICLE_REJECTED')[]
  secret: string
}

export interface WebhookResponse {
  success: boolean
  webhookId: string
}

// ============================================================================
// REGIONAL NEWS OUTPUT TYPES
// ============================================================================

export interface RegionalNewsVariant {
  title: string
  content: string
  insight: string
}

export interface RegionalNewsOutput {
  news_id: string
  global_sentiment: 'Extreme Fear' | 'Fear' | 'Neutral' | 'Neutral-Bearish' | 'Neutral-Bullish' | 'Greed' | 'Extreme Greed'
  data_points: string[]
  regions: {
    tr: RegionalNewsVariant
    en: RegionalNewsVariant
    ar: RegionalNewsVariant
    de: RegionalNewsVariant
    fr: RegionalNewsVariant
    es: RegionalNewsVariant
    ru: RegionalNewsVariant
    jp: RegionalNewsVariant
    zh: RegionalNewsVariant
  }
}

// ============================================================================
// INTELLIGENCE & RECOMMENDATION TYPES
// ============================================================================

export type StrategicTone = 'sakin' | 'agresif' | 'resmi' | 'ultra-agresif' | 'spekülatif' | 'insider'

export interface IntelligenceRecommendation {
  recommendedTone: StrategicTone
  logic: string
  ctrPotential: number // 0-100
  isGoldSignal: boolean
  impactKeywords: string[]
}

export interface MasterDataPacket {
  supplyShockRatio?: number
  maginotLineLevel?: number
  institutionalFlows: {
    source: string
    amount: number
  }[]
  correlationShift: {
    asset: string
    direction: 'POSITIVE' | 'NEGATIVE'
    strength: number // 0.0 - 1.0
  }
}

export interface SiaMasterReport extends GeneratedArticle {
  recommendation: IntelligenceRecommendation
  masterData: MasterDataPacket
  publishedChannels: Language[]
  visualAssetUrl: string
}
