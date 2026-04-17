/**
 * Database Layer for SIA_NEWS_v1.0
 * 
 * In-memory database implementation with async operations for future migration to real database.
 * Provides CRUD operations for articles, entities, causal chains, and related data.
 * Includes retry logic for resilient database operations.
 */

import { 
  ArticleRecord, 
  ArticleQuery, 
  EntityMapping,
  CausalChain,
  GlossaryEntry,
  ValidationResult,
  PerformanceMetrics,
  QualityMetrics
} from './types'
import { retryDatabaseOperation } from './retry-strategies'

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

const articles = new Map<string, ArticleRecord>()
const entities = new Map<string, EntityMapping>()
const causalChains = new Map<string, CausalChain>()
const glossaryEntries = new Map<string, GlossaryEntry[]>()
const validationLogs = new Map<string, ValidationResult[]>()
const performanceMetrics: PerformanceMetrics[] = []
const qualityMetrics: QualityMetrics[] = []

// Indexes for efficient querying
const indexByLanguage = new Map<string, Set<string>>()
const indexByRegion = new Map<string, Set<string>>()
const indexByEntity = new Map<string, Set<string>>()
const indexBySentiment = new Map<string, Set<string>>()
const indexByDate = new Map<string, Set<string>>()

// ============================================================================
// ARTICLE CRUD OPERATIONS
// ============================================================================

/**
 * Create a new article in the database with retry logic
 * @param article - Article record to store
 * @returns Article ID
 */
export async function createArticle(article: ArticleRecord): Promise<string> {
  const result = await retryDatabaseOperation(async () => {
    articles.set(article.id, article)
    
    // Update indexes
    await updateIndexes(article)
    
    return article.id
  })

  if (result.success && result.result) {
    return result.result
  }

  throw result.error || new Error('Failed to create article')
}

/**
 * Get article by ID with retry logic
 * @param id - Article ID
 * @returns Article record or null if not found
 */
export async function getArticleById(id: string): Promise<ArticleRecord | null> {
  const result = await retryDatabaseOperation(async () => {
    return articles.get(id) || null
  })

  if (result.success) {
    return result.result || null
  }

  // On failure, return null instead of throwing
  console.warn(`[DATABASE] Failed to get article ${id}:`, result.error?.message)
  return null
}

/**
 * Query articles with filters
 * @param query - Query parameters
 * @returns Array of matching articles
 */
export async function queryArticles(query: ArticleQuery): Promise<ArticleRecord[]> {
  let results = Array.from(articles.values())
  
  // Apply filters
  if (query.language) {
    results = results.filter(a => a.language === query.language)
  }
  
  if (query.region) {
    results = results.filter(a => a.region === query.region)
  }
  
  if (query.entities && query.entities.length > 0) {
    results = results.filter(a => 
      query.entities!.some(e => a.entities.includes(e))
    )
  }
  
  if (query.sentimentRange) {
    results = results.filter(a => 
      a.sentiment >= query.sentimentRange!.min && 
      a.sentiment <= query.sentimentRange!.max
    )
  }
  
  if (query.dateRange) {
    const start = new Date(query.dateRange.start).getTime()
    const end = new Date(query.dateRange.end).getTime()
    results = results.filter(a => {
      const date = new Date(a.publishedAt).getTime()
      return date >= start && date <= end
    })
  }
  
  if (query.minEEATScore) {
    results = results.filter(a => a.eeatScore >= query.minEEATScore!)
  }
  
  // Sort by published date (newest first)
  results.sort((a, b) => 
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  )
  
  // Apply pagination
  const offset = query.offset || 0
  const limit = query.limit || 20
  
  return results.slice(offset, offset + limit)
}

/**
 * Update an existing article
 * @param id - Article ID
 * @param updates - Partial article updates
 */
export async function updateArticle(
  id: string, 
  updates: Partial<ArticleRecord>
): Promise<void> {
  const existing = articles.get(id)
  if (!existing) {
    throw new Error(`Article ${id} not found`)
  }
  
  const updated = { ...existing, ...updates }
  articles.set(id, updated)
  
  // Update indexes
  await updateIndexes(updated)
}

/**
 * Delete an article
 * @param id - Article ID
 */
export async function deleteArticle(id: string): Promise<void> {
  const article = articles.get(id)
  if (!article) {
    throw new Error(`Article ${id} not found`)
  }
  
  // Remove from main storage
  articles.delete(id)
  
  // Remove from indexes
  indexByLanguage.get(article.language)?.delete(id)
  indexByRegion.get(article.region)?.delete(id)
  article.entities.forEach(entity => {
    indexByEntity.get(entity)?.delete(id)
  })
  
  // Remove related data
  glossaryEntries.delete(id)
  validationLogs.delete(id)
}

// ============================================================================
// ENTITY OPERATIONS
// ============================================================================

/**
 * Store a new entity
 * @param entity - Entity mapping to store
 */
export async function storeEntity(entity: EntityMapping): Promise<void> {
  entities.set(entity.entityId, entity)
}

/**
 * Get entity by ID
 * @param entityId - Entity ID
 * @returns Entity mapping or null if not found
 */
export async function getEntityById(entityId: string): Promise<EntityMapping | null> {
  return entities.get(entityId) || null
}

/**
 * Get entity by name
 * @param name - Entity name
 * @returns Entity mapping or null if not found
 */
export async function getEntityByName(name: string): Promise<EntityMapping | null> {
  for (const entity of entities.values()) {
    if (entity.primaryName.toLowerCase() === name.toLowerCase()) {
      return entity
    }
  }
  return null
}

/**
 * Get all entities
 * @returns Array of all entities
 */
export async function getAllEntities(): Promise<EntityMapping[]> {
  return Array.from(entities.values())
}

/**
 * Update entity usage count
 * @param entityId - Entity ID
 */
export async function incrementEntityUsage(entityId: string): Promise<void> {
  const entity = entities.get(entityId)
  if (entity) {
    // Note: In real implementation, would track usage count
    entity.storedAt = new Date().toISOString()
    entities.set(entityId, entity)
  }
}

// ============================================================================
// CAUSAL CHAIN OPERATIONS
// ============================================================================

/**
 * Store a causal chain
 * @param chain - Causal chain to store
 */
export async function storeCausalChain(chain: CausalChain): Promise<void> {
  causalChains.set(chain.id, chain)
}

/**
 * Get causal chain by ID
 * @param id - Chain ID
 * @returns Causal chain or null if not found
 */
export async function getCausalChainById(id: string): Promise<CausalChain | null> {
  return causalChains.get(id) || null
}

// ============================================================================
// GLOSSARY OPERATIONS
// ============================================================================

/**
 * Store glossary entries for an article
 * @param articleId - Article ID
 * @param entries - Glossary entries
 */
export async function storeGlossary(
  articleId: string, 
  entries: GlossaryEntry[]
): Promise<void> {
  glossaryEntries.set(articleId, entries)
}

/**
 * Get glossary entries for an article
 * @param articleId - Article ID
 * @returns Glossary entries or empty array
 */
export async function getGlossary(articleId: string): Promise<GlossaryEntry[]> {
  return glossaryEntries.get(articleId) || []
}

// ============================================================================
// VALIDATION LOG OPERATIONS
// ============================================================================

/**
 * Store validation results for an article
 * @param articleId - Article ID
 * @param results - Validation results
 */
export async function storeValidationLog(
  articleId: string, 
  results: ValidationResult[]
): Promise<void> {
  validationLogs.set(articleId, results)
}

/**
 * Get validation logs for an article
 * @param articleId - Article ID
 * @returns Validation results or empty array
 */
export async function getValidationLogs(articleId: string): Promise<ValidationResult[]> {
  return validationLogs.get(articleId) || []
}

// ============================================================================
// METRICS OPERATIONS
// ============================================================================

/**
 * Store performance metrics
 * @param metrics - Performance metrics
 */
export async function storePerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
  performanceMetrics.push(metrics)
  
  // Keep only last 10000 entries
  if (performanceMetrics.length > 10000) {
    performanceMetrics.shift()
  }
}

/**
 * Store quality metrics
 * @param metrics - Quality metrics
 */
export async function storeQualityMetrics(metrics: QualityMetrics): Promise<void> {
  qualityMetrics.push(metrics)
  
  // Keep only last 10000 entries
  if (qualityMetrics.length > 10000) {
    qualityMetrics.shift()
  }
}

/**
 * Get performance metrics for a time range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Performance metrics
 */
export async function getPerformanceMetrics(
  startDate: string, 
  endDate: string
): Promise<PerformanceMetrics[]> {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  
  return performanceMetrics.filter(m => {
    const timestamp = new Date(m.timestamp).getTime()
    return timestamp >= start && timestamp <= end
  })
}

/**
 * Get quality metrics for a time range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Quality metrics
 */
export async function getQualityMetrics(
  startDate: string, 
  endDate: string
): Promise<QualityMetrics[]> {
  const start = new Date(startDate).getTime()
  const end = new Date(endDate).getTime()
  
  return qualityMetrics.filter(m => {
    const timestamp = new Date(m.timestamp).getTime()
    return timestamp >= start && timestamp <= end
  })
}

// ============================================================================
// INDEX OPERATIONS
// ============================================================================

/**
 * Update all indexes for an article
 * @param article - Article record
 */
export async function updateIndexes(article: ArticleRecord): Promise<void> {
  // Language index
  if (!indexByLanguage.has(article.language)) {
    indexByLanguage.set(article.language, new Set())
  }
  indexByLanguage.get(article.language)!.add(article.id)
  
  // Region index
  if (!indexByRegion.has(article.region)) {
    indexByRegion.set(article.region, new Set())
  }
  indexByRegion.get(article.region)!.add(article.id)
  
  // Entity indexes
  article.entities.forEach(entity => {
    if (!indexByEntity.has(entity)) {
      indexByEntity.set(entity, new Set())
    }
    indexByEntity.get(entity)!.add(article.id)
  })
  
  // Sentiment index (bucketed by 20-point ranges)
  const sentimentBucket = Math.floor(article.sentiment / 20) * 20
  const sentimentKey = `${sentimentBucket}`
  if (!indexBySentiment.has(sentimentKey)) {
    indexBySentiment.set(sentimentKey, new Set())
  }
  indexBySentiment.get(sentimentKey)!.add(article.id)
  
  // Date index (by day)
  const dateKey = article.publishedAt.split('T')[0]
  if (!indexByDate.has(dateKey)) {
    indexByDate.set(dateKey, new Set())
  }
  indexByDate.get(dateKey)!.add(article.id)
}

/**
 * Rebuild all indexes from scratch
 */
export async function rebuildIndexes(): Promise<void> {
  // Clear existing indexes
  indexByLanguage.clear()
  indexByRegion.clear()
  indexByEntity.clear()
  indexBySentiment.clear()
  indexByDate.clear()
  
  // Rebuild from articles
  for (const article of articles.values()) {
    await updateIndexes(article)
  }
}

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

/**
 * Get article statistics for a date range
 * @param dateRange - Date range
 * @returns Article statistics
 */
export async function getArticleStats(dateRange: { start: string; end: string }): Promise<{
  totalArticles: number
  byLanguage: Record<string, number>
  byRegion: Record<string, number>
  avgEEATScore: number
  avgSentiment: number
  avgOriginalityScore: number
}> {
  const articlesInRange = await queryArticles({ dateRange })
  
  const byLanguage: Record<string, number> = {}
  const byRegion: Record<string, number> = {}
  let totalEEAT = 0
  let totalSentiment = 0
  let totalOriginality = 0
  
  articlesInRange.forEach(article => {
    byLanguage[article.language] = (byLanguage[article.language] || 0) + 1
    byRegion[article.region] = (byRegion[article.region] || 0) + 1
    totalEEAT += article.eeatScore
    totalSentiment += article.sentiment
    totalOriginality += article.originalityScore
  })
  
  const count = articlesInRange.length || 1
  
  return {
    totalArticles: articlesInRange.length,
    byLanguage,
    byRegion,
    avgEEATScore: totalEEAT / count,
    avgSentiment: totalSentiment / count,
    avgOriginalityScore: totalOriginality / count
  }
}

/**
 * Get version history for an article
 * @param articleId - Article ID
 * @returns Array of article versions
 */
export async function getVersionHistory(articleId: string): Promise<ArticleRecord[]> {
  const versions: ArticleRecord[] = []
  let currentId: string | undefined = articleId
  
  while (currentId) {
    const article = articles.get(currentId)
    if (!article) break
    
    versions.push(article)
    currentId = article.previousVersionId
  }
  
  return versions
}

/**
 * Create a new version of an article
 * @param articleId - Original article ID
 * @param newArticle - New article version
 */
export async function createVersion(
  articleId: string, 
  newArticle: ArticleRecord
): Promise<void> {
  const original = articles.get(articleId)
  if (!original) {
    throw new Error(`Article ${articleId} not found`)
  }
  
  // Set version information
  newArticle.version = original.version + 1
  newArticle.previousVersionId = articleId
  
  // Store new version
  await createArticle(newArticle)
}

// ============================================================================
// DATABASE UTILITIES
// ============================================================================

/**
 * Get total article count
 * @returns Total number of articles
 */
export async function getTotalArticleCount(): Promise<number> {
  return articles.size
}

/**
 * Get total entity count
 * @returns Total number of entities
 */
export async function getTotalEntityCount(): Promise<number> {
  return entities.size
}

/**
 * Clear all data (for testing)
 */
export async function clearAllData(): Promise<void> {
  articles.clear()
  entities.clear()
  causalChains.clear()
  glossaryEntries.clear()
  validationLogs.clear()
  performanceMetrics.length = 0
  qualityMetrics.length = 0
  
  indexByLanguage.clear()
  indexByRegion.clear()
  indexByEntity.clear()
  indexBySentiment.clear()
  indexByDate.clear()
}

/**
 * Export all data (for backup/migration)
 * @returns All database data
 */
export async function exportAllData(): Promise<{
  articles: ArticleRecord[]
  entities: EntityMapping[]
  causalChains: CausalChain[]
}> {
  return {
    articles: Array.from(articles.values()),
    entities: Array.from(entities.values()),
    causalChains: Array.from(causalChains.values())
  }
}

/**
 * Import data (for restore/migration)
 * @param data - Data to import
 */
export async function importData(data: {
  articles: ArticleRecord[]
  entities: EntityMapping[]
  causalChains: CausalChain[]
}): Promise<void> {
  // Clear existing data
  await clearAllData()
  
  // Import articles
  for (const article of data.articles) {
    await createArticle(article)
  }
  
  // Import entities
  for (const entity of data.entities) {
    await storeEntity(entity)
  }
  
  // Import causal chains
  for (const chain of data.causalChains) {
    await storeCausalChain(chain)
  }
}
