/**
 * SIA SEMANTIC AUTO-LINKER V2.0
 * 
 * Refactored to use Vector Embeddings (Gemini text-embedding-004)
 * for true cross-language intelligence.
 */

import { prisma } from '@/lib/warroom/database'
import { buildArticleSlug } from '@/lib/warroom/article-seo'
import { calculateSimilarity } from '@/lib/ai/embedding-service'

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface RelatedNode {
  id: string
  slug: string
  title: string
  summary: string
  category: string
  sentiment: string
  publishedAt: string
  imageUrl: string
  relevanceScore: number
  matchReasons: string[]
}

export interface AutoLinkResult {
  articleId: string
  relatedNodes: RelatedNode[]
  totalCandidates: number
  processingTimeMs: number
}

// ═══════════════════════════════════════════════════════════════
// CORE SEMANTIC ENGINE
// ═══════════════════════════════════════════════════════════════

/**
 * MAIN: Find semantically related articles using Vector Embeddings
 */
export async function findRelatedNodes(
  articleId: string,
  options: {
    maxResults?: number;
    lang?: string;
    currentEmbedding?: number[]; // Pre-computed embedding for the current article
  } = {}
): Promise<AutoLinkResult> {
  const start = Date.now()
  const { maxResults = 6, lang = 'en', currentEmbedding } = options

  // 1. Fetch the target article if embedding not provided
  let targetVector = currentEmbedding
  let targetCategory = ''

  if (!targetVector) {
    const target = await prisma.warRoomArticle.findUnique({ where: { id: articleId } })
    if (!target) return { articleId, relatedNodes: [], totalCandidates: 0, processingTimeMs: 0 }

    targetCategory = target.category || ''
    try {
      const visualData = JSON.parse(target.visualData || '{}')
      targetVector = visualData.embedding
    } catch { /* no vector found */ }
  }

  // 2. Fetch all other published articles that have embeddings
  const candidates = await prisma.warRoomArticle.findMany({
    where: {
      id: { not: articleId },
      status: { in: ['published', 'scheduled'] },
      visualData: { contains: '"embedding":[' } // Ensure they have vectors
    },
    orderBy: { publishedAt: 'desc' },
    take: 100,
  })

  // 3. Compare vectors
  const scored: (RelatedNode & { _raw: number })[] = []

  for (const candidate of candidates) {
    let candVector: number[] = []
    try {
      const data = JSON.parse(candidate.visualData || '{}')
      candVector = data.embedding || []
    } catch { continue }

    if (!candVector.length || !targetVector) continue

    // Calculate Semantic Similarity
    const similarity = calculateSimilarity(targetVector, candVector)

    // Scale similarity (0.7-1.0 is usually high relevance)
    let score = Math.round(similarity * 100)
    const reasons: string[] = ['semantic match']

    // Category boost
    if (targetCategory && candidate.category === targetCategory) {
      score += 5
      reasons.push('same sector')
    }

    if (score >= 65) { // Confidence threshold
      const candTitle = (lang === 'tr' ? candidate.titleTr : candidate.titleEn) || candidate.titleEn || ''
      const summary = (lang === 'tr' ? candidate.summaryTr : candidate.summaryEn) || candidate.summaryEn || ''

      scored.push({
        id: candidate.id,
        slug: buildArticleSlug(candidate.id, candTitle),
        title: candTitle,
        summary: summary.slice(0, 160),
        category: candidate.category || 'GENERAL',
        sentiment: candidate.sentiment || 'NEUTRAL',
        publishedAt: candidate.publishedAt.toISOString(),
        imageUrl: candidate.imageUrl || '',
        relevanceScore: Math.min(100, score),
        matchReasons: reasons,
        _raw: score,
      })
    }
  }

  scored.sort((a, b) => b._raw - a._raw)
  const results = scored.slice(0, maxResults).map(({ _raw, ...node }) => node)

  return {
    articleId,
    relatedNodes: results,
    totalCandidates: candidates.length,
    processingTimeMs: Date.now() - start,
  }
}

/**
 * Batch process helper (preserved signature)
 */
export async function batchFindRelatedNodes(
  articleIds: string[],
  lang: 'en' | 'tr' = 'en'
): Promise<Map<string, RelatedNode[]>> {
  const results = new Map<string, RelatedNode[]>()
  for (const id of articleIds) {
    const result = await findRelatedNodes(id, { lang: lang as any })
    results.set(id, result.relatedNodes)
  }
  return results
}
