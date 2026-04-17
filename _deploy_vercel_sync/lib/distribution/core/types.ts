/**
 * SIA DISTRIBUTION OS - TYPE DEFINITIONS
 * Phase 1: Foundation types for distribution system
 */

export type Platform = 'x' | 'linkedin' | 'telegram' | 'facebook' | 'discord' | 'instagram' | 'tiktok'
export type DistributionLanguage = 'en' | 'tr' | 'de' | 'es' | 'fr' | 'ru' | 'ar' | 'jp' | 'zh'
export type DistributionMode = 'breaking' | 'editorial'
export type JobStatus = 'draft' | 'review' | 'scheduled' | 'published' | 'failed' | 'cancelled'

export interface DistributionJob {
  id: string
  createdAt: Date
  updatedAt: Date
  articleId: string
  platforms: Platform[]
  languages: DistributionLanguage[]
  mode: DistributionMode
  status: JobStatus
  scheduledAt?: Date
  trustScore: number
  reviewedBy?: string
  reviewedAt?: Date
}

export interface DistributionVariant {
  id: string
  createdAt: Date
  jobId: string
  platform: Platform
  language: DistributionLanguage
  content: string
  mediaUrls?: string[]
  publishedAt?: Date
  externalId?: string
  externalUrl?: string
  views: number
  engagements: number
  clicks: number
}

export interface GlossaryTerm {
  id: string
  createdAt: Date
  updatedAt: Date
  term: string
  category: string
  translations: Record<DistributionLanguage, string>
  context?: string
  alternatives?: string[]
}

export interface BridgeArticle {
  id: string
  titleEn?: string
  titleTr?: string
  titleDe?: string
  titleEs?: string
  titleFr?: string
  titleRu?: string
  titleAr?: string
  titleJp?: string
  titleZh?: string
  summaryEn?: string
  summaryTr?: string
  summaryDe?: string
  summaryEs?: string
  summaryFr?: string
  summaryRu?: string
  summaryAr?: string
  summaryJp?: string
  summaryZh?: string
  contentEn?: string
  contentTr?: string
  contentDe?: string
  contentEs?: string
  contentFr?: string
  contentRu?: string
  contentAr?: string
  contentJp?: string
  contentZh?: string
  category?: string
  imageUrl?: string
  publishedAt: Date
}
