/**
 * SIA Distribution OS - Database Layer
 * In-Memory Storage (Migration-Ready for Prisma/LibSQL)
 * 
 * All operations are async to maintain compatibility with future real database
 */

import type {
  DistributionRecord,
  GlossaryTerm,
  PlatformCredentials,
  DistributionAnalytics,
  Platform,
  Language,
  WorkflowStatus,
  AITestResult,
  ReviewScore,
  PublishResult
} from './types'

// ============================================================================
// IN-MEMORY STORAGE
// ============================================================================

const distributionRecords = new Map<string, DistributionRecord>()
const glossaryTerms = new Map<string, GlossaryTerm>()
const platformCredentials = new Map<Platform, PlatformCredentials>()
const analyticsData = new Map<string, DistributionAnalytics>()

// Phase 3A.5: AI Test Lab storage
const aiTestResults = new Map<string, AITestResult>()
const reviewFeedback = new Map<string, ReviewScore>()

// ============================================================================
// DISTRIBUTION RECORDS - CRUD
// ============================================================================

export async function createDistributionRecord(
  record: Omit<DistributionRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<DistributionRecord> {
  const id = `dist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const newRecord: DistributionRecord = {
    ...record,
    id,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  distributionRecords.set(id, newRecord)
  return newRecord
}

export async function getDistributionRecord(id: string): Promise<DistributionRecord | null> {
  return distributionRecords.get(id) || null
}

export async function getDistributionRecords(filters?: {
  articleId?: string
  status?: WorkflowStatus
  mode?: 'breaking' | 'editorial'
  limit?: number
}): Promise<DistributionRecord[]> {
  let records = Array.from(distributionRecords.values())
  
  if (filters?.articleId) {
    records = records.filter(r => r.articleId === filters.articleId)
  }
  
  if (filters?.status) {
    records = records.filter(r => r.status === filters.status)
  }
  
  if (filters?.mode) {
    records = records.filter(r => r.mode === filters.mode)
  }
  
  // Sort by createdAt desc
  records.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  
  if (filters?.limit) {
    records = records.slice(0, filters.limit)
  }
  
  return records
}

export async function updateDistributionRecord(
  id: string,
  updates: Partial<Omit<DistributionRecord, 'id' | 'createdAt'>>
): Promise<DistributionRecord | null> {
  const existing = distributionRecords.get(id)
  if (!existing) return null
  
  const updated: DistributionRecord = {
    ...existing,
    ...updates,
    updatedAt: new Date()
  }
  
  distributionRecords.set(id, updated)
  return updated
}

export async function deleteDistributionRecord(id: string): Promise<boolean> {
  return distributionRecords.delete(id)
}

// ============================================================================
// GLOSSARY TERMS - CRUD
// ============================================================================

export async function createGlossaryTerm(
  term: Omit<GlossaryTerm, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>
): Promise<GlossaryTerm> {
  const id = `term_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const newTerm: GlossaryTerm = {
    ...term,
    id,
    usageCount: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }
  
  glossaryTerms.set(id, newTerm)
  return newTerm
}

export async function getGlossaryTerm(id: string): Promise<GlossaryTerm | null> {
  return glossaryTerms.get(id) || null
}

export async function getGlossaryTermByName(term: string): Promise<GlossaryTerm | null> {
  const terms = Array.from(glossaryTerms.values())
  return terms.find(t => t.term.toLowerCase() === term.toLowerCase()) || null
}

export async function getGlossaryTerms(filters?: {
  category?: GlossaryTerm['category']
  language?: Language
  limit?: number
}): Promise<GlossaryTerm[]> {
  let terms = Array.from(glossaryTerms.values())
  
  if (filters?.category) {
    terms = terms.filter(t => t.category === filters.category)
  }
  
  // Sort by usage count desc
  terms.sort((a, b) => b.usageCount - a.usageCount)
  
  if (filters?.limit) {
    terms = terms.slice(0, filters.limit)
  }
  
  return terms
}

export async function updateGlossaryTerm(
  id: string,
  updates: Partial<Omit<GlossaryTerm, 'id' | 'createdAt' | 'usageCount'>>
): Promise<GlossaryTerm | null> {
  const existing = glossaryTerms.get(id)
  if (!existing) return null
  
  const updated: GlossaryTerm = {
    ...existing,
    ...updates,
    updatedAt: new Date()
  }
  
  glossaryTerms.set(id, updated)
  return updated
}

export async function incrementGlossaryTermUsage(id: string): Promise<void> {
  const term = glossaryTerms.get(id)
  if (!term) return
  
  term.usageCount++
  term.lastUsed = new Date()
  term.updatedAt = new Date()
  
  glossaryTerms.set(id, term)
}

export async function deleteGlossaryTerm(id: string): Promise<boolean> {
  return glossaryTerms.delete(id)
}

// ============================================================================
// PLATFORM CREDENTIALS - CRUD
// ============================================================================

export async function savePlatformCredentials(
  credentials: PlatformCredentials
): Promise<void> {
  platformCredentials.set(credentials.platform, credentials)
}

export async function getPlatformCredentials(
  platform: Platform
): Promise<PlatformCredentials | null> {
  return platformCredentials.get(platform) || null
}

export async function getAllPlatformCredentials(): Promise<PlatformCredentials[]> {
  return Array.from(platformCredentials.values())
}

export async function deletePlatformCredentials(platform: Platform): Promise<boolean> {
  return platformCredentials.delete(platform)
}

// ============================================================================
// ANALYTICS - CRUD
// ============================================================================

export async function saveAnalytics(analytics: DistributionAnalytics): Promise<void> {
  analyticsData.set(analytics.distributionId, analytics)
}

export async function getAnalytics(
  distributionId: string
): Promise<DistributionAnalytics | null> {
  return analyticsData.get(distributionId) || null
}

export async function getAllAnalytics(): Promise<DistributionAnalytics[]> {
  return Array.from(analyticsData.values())
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export async function getDistributionStats(): Promise<{
  total: number
  byStatus: Record<WorkflowStatus, number>
  byMode: Record<'breaking' | 'editorial', number>
}> {
  const records = Array.from(distributionRecords.values())
  
  const byStatus: Record<WorkflowStatus, number> = {
    draft: 0,
    review: 0,
    approved: 0,
    scheduled: 0,
    publishing: 0,
    published: 0,
    failed: 0,
    cancelled: 0
  }
  
  const byMode = {
    breaking: 0,
    editorial: 0
  }
  
  records.forEach(record => {
    byStatus[record.status]++
    byMode[record.mode]++
  })
  
  return {
    total: records.length,
    byStatus,
    byMode
  }
}

export async function clearAllData(): Promise<void> {
  distributionRecords.clear()
  glossaryTerms.clear()
  platformCredentials.clear()
  analyticsData.clear()
  aiTestResults.clear()
  reviewFeedback.clear()
}

// ============================================================================
// AI TEST LAB - CRUD (Phase 3A.5)
// ============================================================================

export async function saveTestResult(
  result: Omit<AITestResult, 'id' | 'createdAt'>
): Promise<AITestResult> {
  const id = `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  const newResult: AITestResult = {
    ...result,
    id,
    createdAt: new Date()
  }
  
  aiTestResults.set(id, newResult)
  return newResult
}

export async function getTestResult(id: string): Promise<AITestResult | null> {
  return aiTestResults.get(id) || null
}

export async function getTestResults(filters?: {
  articleId?: string
  targetLocale?: Language
  targetPlatform?: Platform
  limit?: number
}): Promise<AITestResult[]> {
  let results = Array.from(aiTestResults.values())
  
  if (filters?.articleId) {
    results = results.filter(r => r.articleId === filters.articleId)
  }
  
  if (filters?.targetLocale) {
    results = results.filter(r => r.targetLocale === filters.targetLocale)
  }
  
  if (filters?.targetPlatform) {
    results = results.filter(r => r.targetPlatform === filters.targetPlatform)
  }
  
  // Sort by createdAt desc
  results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  
  if (filters?.limit) {
    results = results.slice(0, filters.limit)
  }
  
  return results
}

export async function deleteTestResult(id: string): Promise<boolean> {
  return aiTestResults.delete(id)
}

export async function saveReviewFeedback(
  testId: string,
  review: ReviewScore
): Promise<void> {
  reviewFeedback.set(testId, review)
  
  // Also update the test result
  const testResult = aiTestResults.get(testId)
  if (testResult) {
    testResult.reviewScore = review
    aiTestResults.set(testId, testResult)
  }
}

export async function getReviewFeedback(testId: string): Promise<ReviewScore | null> {
  return reviewFeedback.get(testId) || null
}

export async function getTestStats(): Promise<{
  total: number
  byLocale: Partial<Record<Language, number>>
  byPlatform: Partial<Record<Platform, number>>
  averageScores: {
    trust: number
    compliance: number
    review: number
  }
}> {
  const results = Array.from(aiTestResults.values())
  
  const byLocale: Partial<Record<Language, number>> = {}
  const byPlatform: Partial<Record<Platform, number>> = {}
  
  let totalTrust = 0
  let totalCompliance = 0
  let totalReview = 0
  let reviewCount = 0
  
  results.forEach(result => {
    // Count by locale
    byLocale[result.targetLocale] = (byLocale[result.targetLocale] || 0) + 1
    
    // Count by platform
    byPlatform[result.targetPlatform] = (byPlatform[result.targetPlatform] || 0) + 1
    
    // Sum scores
    totalTrust += result.trustScore.overall
    totalCompliance += result.complianceScore.overall
    
    if (result.reviewScore) {
      totalReview += result.reviewScore.overall
      reviewCount++
    }
  })
  
  return {
    total: results.length,
    byLocale,
    byPlatform,
    averageScores: {
      trust: results.length > 0 ? totalTrust / results.length : 0,
      compliance: results.length > 0 ? totalCompliance / results.length : 0,
      review: reviewCount > 0 ? totalReview / reviewCount : 0
    }
  }
}

// ============================================================================
// MIGRATION HELPERS (for future real database)
// ============================================================================

/**
 * Export all data for migration to real database
 */
export async function exportAllData() {
  return {
    distributionRecords: Array.from(distributionRecords.entries()),
    glossaryTerms: Array.from(glossaryTerms.entries()),
    platformCredentials: Array.from(platformCredentials.entries()),
    analyticsData: Array.from(analyticsData.entries()),
    aiTestResults: Array.from(aiTestResults.entries()),
    reviewFeedback: Array.from(reviewFeedback.entries())
  }
}

/**
 * Import data from backup/migration
 */
export async function importAllData(data: {
  distributionRecords: [string, DistributionRecord][]
  glossaryTerms: [string, GlossaryTerm][]
  platformCredentials: [Platform, PlatformCredentials][]
  analyticsData: [string, DistributionAnalytics][]
  aiTestResults?: [string, AITestResult][]
  reviewFeedback?: [string, ReviewScore][]
}): Promise<void> {
  data.distributionRecords.forEach(([id, record]) => {
    distributionRecords.set(id, record)
  })
  
  data.glossaryTerms.forEach(([id, term]) => {
    glossaryTerms.set(id, term)
  })
  
  data.platformCredentials.forEach(([platform, creds]) => {
    platformCredentials.set(platform, creds)
  })
  
  data.analyticsData.forEach(([id, analytics]) => {
    analyticsData.set(id, analytics)
  })
  
  // Phase 3A.5: Import test lab data if present
  if (data.aiTestResults) {
    data.aiTestResults.forEach(([id, result]) => {
      aiTestResults.set(id, result)
    })
  }
  
  if (data.reviewFeedback) {
    data.reviewFeedback.forEach(([id, review]) => {
      reviewFeedback.set(id, review)
    })
  }
}

// ============================================================================
// PUBLISH RESULTS STORAGE (Phase 3B - Simulation Only)
// ============================================================================

/**
 * In-memory storage for simulated publish results
 */
const publishResults = new Map<string, PublishResult>()

/**
 * Save a simulated publish result
 */
export async function savePublishResult(result: PublishResult): Promise<void> {
  publishResults.set(result.id, result)
  console.log(`[DATABASE] Saved publish result: ${result.id} (${result.platform}, ${result.status})`)
}

/**
 * Get a publish result by ID
 */
export async function getPublishResult(id: string): Promise<PublishResult | null> {
  return publishResults.get(id) || null
}

/**
 * Get all publish results
 */
export async function getAllPublishResults(): Promise<PublishResult[]> {
  return Array.from(publishResults.values()).sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  )
}

/**
 * Get publish results by platform
 */
export async function getPublishResultsByPlatform(platform: Platform): Promise<PublishResult[]> {
  return Array.from(publishResults.values())
    .filter(result => result.platform === platform)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Get publish results by status
 */
export async function getPublishResultsByStatus(
  status: 'simulated_success' | 'simulated_failure' | 'validation_failed'
): Promise<PublishResult[]> {
  return Array.from(publishResults.values())
    .filter(result => result.status === status)
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
}

/**
 * Get recent publish results (last N)
 */
export async function getRecentPublishResults(limit: number = 20): Promise<PublishResult[]> {
  return Array.from(publishResults.values())
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, limit)
}

/**
 * Delete a publish result
 */
export async function deletePublishResult(id: string): Promise<boolean> {
  const deleted = publishResults.delete(id)
  if (deleted) {
    console.log(`[DATABASE] Deleted publish result: ${id}`)
  }
  return deleted
}

/**
 * Clear all publish results
 */
export async function clearAllPublishResults(): Promise<void> {
  publishResults.clear()
  console.log('[DATABASE] Cleared all publish results')
}

/**
 * Get publish result statistics
 */
export async function getPublishResultStats(): Promise<{
  total: number
  byPlatform: Record<Platform, number>
  byStatus: Record<string, number>
  successRate: number
}> {
  const results = Array.from(publishResults.values())
  
  const byPlatform: Record<string, number> = {}
  const byStatus: Record<string, number> = {}
  
  results.forEach(result => {
    byPlatform[result.platform] = (byPlatform[result.platform] || 0) + 1
    byStatus[result.status] = (byStatus[result.status] || 0) + 1
  })
  
  const successCount = byStatus['simulated_success'] || 0
  const successRate = results.length > 0 ? (successCount / results.length) * 100 : 0
  
  return {
    total: results.length,
    byPlatform: byPlatform as Record<Platform, number>,
    byStatus,
    successRate
  }
}
