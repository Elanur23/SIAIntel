/**
 * Global Intelligence Dispatcher - Type Definitions
 * Centralized type system for the dispatcher architecture
 */

export type Language = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'jp' | 'zh'
export type Region = 'US' | 'TR' | 'DE' | 'FR' | 'ES' | 'RU' | 'AE' | 'JP' | 'CN'

/**
 * Type guard to check if a string is a valid Language
 */
export function isLanguage(value: string): value is Language {
  return ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'].includes(value)
}

/**
 * Safely convert string to Language with fallback
 */
export function toLanguage(value: string, fallback: Language = 'en'): Language {
  return isLanguage(value) ? value : fallback
}

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type ProcessingStep =
  | 'validation'
  | 'translation'
  | 'protocol_processing'
  | 'seo_generation'
  | 'quality_check'
  | 'publishing'
  | 'indexing'

export type TechnicalDepth = 'HIGH' | 'MEDIUM' | 'LOW'
export type Priority = 'urgent' | 'normal' | 'low'

// Core Input Types
export interface IntelligenceInput {
  title: string
  content: string
  category: string
  asset?: string
  metadata: {
    author?: string
    tags?: string[]
    priority?: Priority
  }
}

// Translation Types
export interface TranslatedContent {
  language: Language
  title: string
  summary: string
  siaInsight: string
  riskDisclaimer: string
  fullContent: string
  metaDescription: string
  keywords: string[]
  slug: string
  eeatScore: number
  protocolCompliance: ProtocolComplianceResult
}

export interface TranslationResult {
  language: Language
  title: string
  fullContent: string // Unified naming
  summary: string
  siaInsight: string
  riskDisclaimer: string
  metaDescription: string
  keywords: string[]
  eeatScore: number // Unified naming
  processingTime: number
  slug?: string // Added for contract composition
  seoPackage?: SEOPackage // Added for contract composition
}

// Protocol Types
export interface ProcessedContent {
  content: string
  protectedTermsCount: number
  fiatReferencesCount: number
  imperativeVerbsCount: number
  verificationHash: string
  confidenceRating: number
}

export interface ProtocolComplianceResult {
  isCompliant: boolean
  score: number
  issues: ComplianceIssue[]
  recommendations: string[]
}

export interface ComplianceIssue {
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  field?: string
  suggestedFix?: string
}

// SEO Types
export interface SEOPackage {
  slug: string
  canonicalUrl: string
  metadata: MetadataPackage
  structuredData: StructuredDataSchema
  hreflangTags: HreflangTag[]
  openGraph: OpenGraphData
  twitterCard: TwitterCardData
}

export interface MetadataPackage {
  title: string
  description: string
  keywords: string[]
  author?: string
  publishedTime?: string
  modifiedTime?: string
}

export interface StructuredDataSchema {
  '@context': string
  '@type': string
  headline: string
  description: string
  author: {
    '@type': string
    name: string
  }
  publisher: {
    '@type': string
    name: string
    logo: {
      '@type': string
      url: string
    }
  }
  datePublished: string
  dateModified: string
  mainEntityOfPage: string
}

export interface HreflangTag {
  lang: Language
  url: string
}

export interface OpenGraphData {
  title: string
  description: string
  type: string
  url: string
  image?: string
  locale: string
}

export interface TwitterCardData {
  card: string
  title: string
  description: string
  image?: string
}

// Quality Types
export interface QualityMetrics {
  eeatScore: number
  originalityScore: number
  technicalDepth: TechnicalDepth
  protocolCompliance: number
  translationQuality: number
  seoOptimization: number
  overallScore: number
}

export interface ValidationResult {
  passed: boolean
  score: number
  issues: ValidationIssue[]
  warnings: ValidationWarning[]
  recommendations: string[]
}

export interface ValidationIssue {
  type: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  message: string
  field?: string
  suggestedFix?: string
}

export interface ValidationWarning {
  type: string
  message: string
  field?: string
}

// Publishing Types
export interface PublishableArticle {
  id: string
  language: Language
  title: string
  slug: string
  content: string
  summary: string
  siaInsight: string
  riskDisclaimer: string
  metadata: ArticleMetadata
  seoPackage: SEOPackage
  eeatScore: number
  publishedAt: string
  manifest_hash?: string  // ULTRA-FINAL HARDENING: Deterministic content hash for verification
}

export interface ArticleMetadata {
  author?: string
  category: string
  tags: string[]
  asset?: string
  priority: Priority
  wordCount: number
  readingTime: number
}

export interface PublishResult {
  success: boolean
  articleId: string
  publishedLanguages: Language[]
  failedLanguages: Language[]
  urls: Record<Language, string>
  indexingResults: IndexingResult
  errors: DispatcherError[]
  totalTime: number
}

export interface IndexingResult {
  google: { success: boolean; message: string }
  indexnow: { success: boolean; message: string }
  baidu: { success: boolean; message: string }
}

export interface RollbackResult {
  success: boolean
  rolledBackLanguages: Language[]
  failedRollbacks: Language[]
  errors: DispatcherError[]
  articlesRemoved?: number
  searchEnginesNotified?: string[]
  cacheCleared?: boolean
  auditLogCreated?: boolean
}

// Job Management Types
export interface DispatcherJob {
  id: string
  status: JobStatus
  sourceLanguage: Language
  sourceContent: IntelligenceInput
  targetLanguages: Language[]
  currentStep: ProcessingStep
  completedSteps: ProcessingStep[]
  progress: number
  articleId?: string
  translations?: Record<Language, TranslatedContent>
  validationResults?: Record<Language, ValidationResult>
  publishResults?: PublishResult
  errors: DispatcherError[]
  createdAt: string
  startedAt?: string
  completedAt?: string
  processingTime?: number
  userId: string
}

export interface DispatcherError {
  code: string
  message: string
  step: ProcessingStep
  language?: Language
  severity: 'critical' | 'high' | 'medium' | 'low'
  recoverable: boolean
  timestamp: string
  stack?: string
}

// Configuration Types
export interface DispatcherConfig {
  maxConcurrentJobs: number
  translationTimeout: number
  publishingTimeout: number
  cacheEnabled: boolean
  cacheTTL: number
  retryAttempts: number
  retryBackoff: 'linear' | 'exponential'
}

export interface DispatcherOptions {
  skipCache?: boolean
  validateOnly?: boolean
  publishImmediately?: boolean
  scheduledTime?: string
  skipIndexing?: boolean
}

// Result Types
export interface DispatcherResult {
  success: boolean
  jobId: string
  status: JobStatus
  estimatedTime?: number
  translations?: Record<Language, TranslatedContent>
  publishResult?: PublishResult
  errors?: DispatcherError[]
}

// Cache Types
export interface CachedTranslation {
  contentHash: string
  sourceLanguage: Language
  targetLanguage: Language
  translation: TranslationResult
  eeatScore: number
  createdAt: string
  expiresAt: string
  hitCount: number
}

// Progress Types
export interface ProgressUpdate {
  jobId: string
  currentStep: ProcessingStep
  completedSteps: ProcessingStep[]
  percentage: number
  estimatedTimeRemaining: number
  message?: string
}
