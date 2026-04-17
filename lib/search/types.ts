export type Language = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'jp' | 'zh'

export interface SearchResult {
  id: string
  title: string
  summary: string
  url: string
  language: Language
  category?: string
  confidence?: number
  score?: number
  publishedAt?: string
  snippet?: string
  [key: string]: unknown
}

export interface NeuralSearchFilters {
  category?: string
  dateFrom?: string
  dateTo?: string
  language?: Language
  tags?: string[]
  [key: string]: unknown
}

export interface NeuralSearchOptions {
  limit?: number
  offset?: number
  includeTranslations?: boolean
  [key: string]: unknown
}

export interface NeuralSearchRequest {
  query: string
  userLanguage: Language
  filters?: NeuralSearchFilters
  options?: NeuralSearchOptions
}

export interface NeuralSearchMetadata {
  totalResults: number
  searchTime: number
  embeddingTime: number
  vectorSearchTime: number
  translationTime?: number
  cacheHit: boolean
  protectedTermsDetected: string[]
}

export interface NeuralSearchResponse {
  success: boolean
  query: string
  results: SearchResult[]
  metadata: NeuralSearchMetadata
  pagination?: {
    limit: number
    offset: number
    hasMore: boolean
    total: number
  }
  error?: {
    code: string
    message: string
    details?: unknown
  }
}
