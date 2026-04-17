/**
 * SIA Distribution OS - Type Definitions
 * Multilingual Financial News Distribution System
 * 
 * Supports: X, LinkedIn, Telegram, Facebook, Discord, Instagram, TikTok
 * Languages: 9 (en, tr, de, fr, es, ru, ar, jp, zh)
 * Modes: Breaking, Editorial
 */

// ============================================================================
// PLATFORM DEFINITIONS
// ============================================================================

export type Platform = 
  | 'x'           // X (Twitter)
  | 'linkedin'    // LinkedIn
  | 'telegram'    // Telegram
  | 'facebook'    // Facebook
  | 'discord'     // Discord
  | 'instagram'   // Instagram
  | 'tiktok'      // TikTok

export const PLATFORMS: Platform[] = [
  'x',
  'linkedin',
  'telegram',
  'facebook',
  'discord',
  'instagram',
  'tiktok'
]

// ============================================================================
// LANGUAGE & REGION
// ============================================================================

export type Language = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'jp' | 'zh'

export const LANGUAGES: Language[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']

export type Region = 'US' | 'TR' | 'DE' | 'FR' | 'ES' | 'RU' | 'AE' | 'JP' | 'CN'

// ============================================================================
// DISTRIBUTION MODES
// ============================================================================

export type DistributionMode = 'breaking' | 'editorial'

export interface DistributionModeConfig {
  mode: DistributionMode
  priority: 'high' | 'medium' | 'low'
  autoPublish: boolean
  requiresReview: boolean
}

// ============================================================================
// WORKFLOW STATES
// ============================================================================

export type WorkflowStatus = 
  | 'draft'       // Initial state, being edited
  | 'review'      // Awaiting editorial review
  | 'approved'    // Approved, ready to schedule
  | 'scheduled'   // Scheduled for future publish
  | 'publishing'  // Currently being published
  | 'published'   // Successfully published
  | 'failed'      // Publish failed
  | 'cancelled'   // Cancelled by user

// ============================================================================
// DISTRIBUTION RECORD
// ============================================================================

export interface DistributionRecord {
  id: string
  articleId: string
  mode: DistributionMode
  status: WorkflowStatus
  
  // Source content
  sourceTitle: string
  sourceContent: string
  sourceLanguage: Language
  
  // Locale-specific rewrites (9 languages)
  localizedContent: Record<Language, LocalizedContent>
  
  // Platform-specific variants
  platformVariants: Partial<Record<Platform, PlatformVariant>>
  
  // Scheduling
  scheduledAt?: Date
  publishedAt?: Date
  
  // Metadata
  createdAt: Date
  updatedAt: Date
  createdBy: string
  
  // Trust & Compliance
  trustScore: number
  complianceScore: number
  
  // Analytics
  analytics?: DistributionAnalytics
}

// ============================================================================
// LOCALIZED CONTENT
// ============================================================================

export interface LocalizedContent {
  language: Language
  title: string
  summary: string
  content: string
  hashtags: string[]
  
  // Glossary-enhanced
  glossaryTermsUsed: string[]
  
  // Quality metrics
  readabilityScore: number
  seoScore: number
}

// ============================================================================
// PLATFORM VARIANTS
// ============================================================================

export interface PlatformVariant {
  platform: Platform
  language: Language
  
  // Platform-optimized content
  title: string
  body: string
  media?: string[]
  
  // Platform-specific metadata
  metadata: PlatformMetadata
  
  // Publish status
  status: 'pending' | 'published' | 'failed'
  publishedUrl?: string
  publishedAt?: Date
  error?: string
}

export type PlatformMetadata = 
  | XMetadata
  | LinkedInMetadata
  | TelegramMetadata
  | FacebookMetadata
  | DiscordMetadata
  | InstagramMetadata
  | TikTokMetadata

export interface XMetadata {
  platform: 'x'
  threadLength?: number
  replyToTweetId?: string
  quoteTweetId?: string
}

export interface LinkedInMetadata {
  platform: 'linkedin'
  visibility: 'public' | 'connections' | 'private'
  articleFormat: boolean
}

export interface TelegramMetadata {
  platform: 'telegram'
  channelId: string
  pinMessage: boolean
  disableNotification: boolean
}

export interface FacebookMetadata {
  platform: 'facebook'
  pageId: string
  targetAudience?: string[]
}

export interface DiscordMetadata {
  platform: 'discord'
  channelId: string
  embedColor?: string
  mentionRoles?: string[]
}

export interface InstagramMetadata {
  platform: 'instagram'
  postType: 'feed' | 'story' | 'reel'
  aspectRatio: '1:1' | '4:5' | '9:16'
}

export interface TikTokMetadata {
  platform: 'tiktok'
  videoUrl: string
  duetEnabled: boolean
  stitchEnabled: boolean
}

// ============================================================================
// GLOSSARY & TERMINOLOGY
// ============================================================================

export interface GlossaryTerm {
  id: string
  term: string
  
  // Translations for 9 languages
  translations: Record<Language, string>
  
  // Context
  category: 'finance' | 'crypto' | 'economy' | 'ai' | 'general'
  definition: string
  
  // Usage tracking
  usageCount: number
  lastUsed?: Date
  
  // Metadata
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// PLATFORM CREDENTIALS
// ============================================================================

export interface PlatformCredentials {
  platform: Platform
  enabled: boolean
  
  // API credentials (encrypted in production)
  apiKey?: string
  apiSecret?: string
  accessToken?: string
  refreshToken?: string
  
  // Platform-specific config
  config: Record<string, any>
  
  // Metadata
  lastVerified?: Date
  expiresAt?: Date
}

// ============================================================================
// ANALYTICS
// ============================================================================

export interface DistributionAnalytics {
  distributionId: string
  
  // Per-platform metrics
  platformMetrics: Partial<Record<Platform, PlatformMetrics>>
  
  // Aggregated metrics
  totalReach: number
  totalEngagement: number
  totalClicks: number
  
  // Performance
  publishDuration: number // milliseconds
  successRate: number // 0-100
  
  // Timestamps
  lastUpdated: Date
}

export interface PlatformMetrics {
  platform: Platform
  
  // Engagement
  views: number
  likes: number
  shares: number
  comments: number
  clicks: number
  
  // Reach
  impressions: number
  reach: number
  
  // Conversion
  clickThroughRate: number
  engagementRate: number
  
  // Timestamp
  measuredAt: Date
}

// ============================================================================
// TRUST & COMPLIANCE
// ============================================================================

export interface TrustScore {
  overall: number // 0-100
  
  // Components
  sourceCredibility: number
  factualAccuracy: number
  biasDetection: number
  sentimentBalance: number
  
  // Flags
  warnings: string[]
  requiresReview: boolean
}

export interface ComplianceScore {
  overall: number // 0-100
  
  // Platform-specific compliance
  platformCompliance: Partial<Record<Platform, number>>
  
  // Regulatory
  gdprCompliant: boolean
  coppaCompliant: boolean
  financeRegulationCompliant: boolean
  
  // Content safety
  contentSafetyScore: number
  toxicityScore: number
  
  // Flags
  violations: string[]
  requiresLegalReview: boolean
}

// ============================================================================
// AI TEST LAB (Phase 3A.5)
// ============================================================================

export type RegenerationMode = 
  | 'more_professional'
  | 'shorter'
  | 'sharper'
  | 'safer'
  | 'fewer_hashtags'

export interface AITestResult {
  id: string
  
  // Source
  articleId: string
  sourceTitle: string
  sourceContent: string
  sourceLanguage: Language
  
  // Test parameters
  targetLocale: Language
  targetPlatform: Platform
  generationMode: DistributionMode
  regenerationMode?: RegenerationMode
  
  // Generated content
  masterContent: string
  localizedContent: LocalizedContent
  platformContent: PlatformVariant
  
  // Glossary
  glossaryTermsUsed: string[]
  
  // Scores
  trustScore: TrustScore
  complianceScore: ComplianceScore
  
  // AI metadata
  aiMetadata: AIGenerationMetadata
  
  // Manual review
  reviewScore?: ReviewScore
  
  // Timestamps
  createdAt: Date
  createdBy: string
}

export interface AIGenerationMetadata {
  provider: 'gemini' | 'openai'
  model: string
  promptVersion: string
  temperature: number
  maxTokens: number
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  cost?: {
    input: number
    output: number
    total: number
    currency: string
  }
  generationTime: number // milliseconds
}

export interface ReviewScore {
  // Quality dimensions (0-100)
  naturalness: number
  headlineQuality: number
  platformFit: number
  localeFit: number
  complianceConfidence: number
  
  // Overall
  overall: number
  
  // Feedback
  reviewerNotes?: string
  reviewedBy: string
  reviewedAt: Date
}

// ============================================================================
// PUBLISHING SYSTEM (Phase 3B - Dry-Run Only)
// ============================================================================

/**
 * Content for platform publishing (simplified from PlatformVariant)
 */
export interface PlatformContent {
  title?: string
  body: string
  hashtags: string[]
  language: Language
  status: 'draft' | 'pending' | 'published' | 'failed'
}

/**
 * Platform credentials (mock/secure storage) - Extended for Phase 3B
 * WARNING: This is for simulation only. Never store real credentials in code.
 */
export interface PlatformCredentialsExtended extends PlatformCredentials {
  accountId: string
  accountName: string
  isValid: boolean
  lastValidated: Date
  environment: 'sandbox' | 'production' | 'simulation'
}

/**
 * Platform-specific payload for publishing
 */
export interface PublishPayload {
  platform: Platform
  content: {
    title?: string
    body: string
    hashtags: string[]
    mentions: string[]
    mediaUrls: string[]
  }
  metadata: {
    language: Language
    category?: string
    scheduledTime?: Date
    priority: 'low' | 'normal' | 'high' | 'urgent'
  }
  formatting: {
    characterCount: number
    characterLimit: number
    hasMedia: boolean
    hasLinks: boolean
    hasHashtags: boolean
  }
}

/**
 * Validation result for publish payload
 */
export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
}

export interface ValidationError {
  field: string
  message: string
  severity: 'error'
}

export interface ValidationWarning {
  field: string
  message: string
  severity: 'warning'
}

/**
 * Simulated publish result
 */
export interface PublishResult {
  id: string
  platform: Platform
  status: 'simulated_success' | 'simulated_failure' | 'validation_failed'
  payload: PublishPayload
  simulation: {
    wouldPublish: boolean
    estimatedDelay: number // milliseconds
    mockResponse: {
      postId?: string
      postUrl?: string
      timestamp: Date
    }
  }
  validation: ValidationResult
  error?: {
    code: string
    message: string
    details?: string
  }
  timestamp: Date
  dryRun: true // Always true - this is simulation only
}

/**
 * Platform adapter interface
 * All adapters must implement these methods
 */
export interface PlatformAdapter {
  platform: Platform
  formatContent(content: PlatformContent): PublishPayload
  validateContent(payload: PublishPayload): ValidationResult
  simulatePublish(payload: PublishPayload): Promise<PublishResult>
  getCharacterLimit(): number
  getHashtagLimit(): number
  supportsMedia(): boolean
  supportsLinks(): boolean
}

/**
 * Publish simulation options
 */
export interface SimulationOptions {
  simulateDelay: boolean
  simulateFailure: boolean
  failureRate: number // 0-1 (0 = never fail, 1 = always fail)
  delayRange: {
    min: number // milliseconds
    max: number // milliseconds
  }
}
