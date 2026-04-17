/**
 * SIA DISTRIBUTION OS - BRIDGE LAYER
 * Phase 1: Read-only bridge to existing article system
 * 
 * CRITICAL: This layer is STRICTLY READ-ONLY
 * - No writes to WarRoomArticle
 * - No mutations of existing data
 * - No side effects
 */

import { prisma } from '@/lib/warroom/database'
import type { BridgeArticle } from './types'

/**
 * Get article by ID for distribution (read-only)
 * @param articleId - Existing article ID from WarRoomArticle
 * @returns Article data or null if not found
 */
export async function getArticleForDistribution(articleId: string): Promise<BridgeArticle | null> {
  try {
    const article = await prisma.warRoomArticle.findUnique({
      where: { id: articleId },
      select: {
        id: true,
        titleEn: true,
        titleTr: true,
        titleDe: true,
        titleEs: true,
        titleFr: true,
        titleRu: true,
        titleAr: true,
        titleJp: true,
        titleZh: true,
        summaryEn: true,
        summaryTr: true,
        summaryDe: true,
        summaryEs: true,
        summaryFr: true,
        summaryRu: true,
        summaryAr: true,
        summaryJp: true,
        summaryZh: true,
        contentEn: true,
        contentTr: true,
        contentDe: true,
        contentEs: true,
        contentFr: true,
        contentRu: true,
        contentAr: true,
        contentJp: true,
        contentZh: true,
        category: true,
        imageUrl: true,
        publishedAt: true,
      },
    })

    if (!article) return null

    return article as BridgeArticle
  } catch (error) {
    console.error('[BRIDGE] Error fetching article:', error)
    return null
  }
}

/**
 * List published articles for distribution selection (read-only)
 * @param limit - Maximum number of articles to return
 * @returns Array of articles
 */
export async function listArticlesForDistribution(limit = 50): Promise<BridgeArticle[]> {
  try {
    const articles = await prisma.warRoomArticle.findMany({
      where: {
        status: 'published',
      },
      select: {
        id: true,
        titleEn: true,
        titleTr: true,
        category: true,
        imageUrl: true,
        publishedAt: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
      take: limit,
    })

    return articles as BridgeArticle[]
  } catch (error) {
    console.error('[BRIDGE] Error listing articles:', error)
    return []
  }
}

/**
 * Check if article exists (read-only)
 * @param articleId - Article ID to check
 * @returns True if article exists and is published
 */
export async function articleExists(articleId: string): Promise<boolean> {
  try {
    const count = await prisma.warRoomArticle.count({
      where: {
        id: articleId,
        status: 'published',
      },
    })
    return count > 0
  } catch (error) {
    console.error('[BRIDGE] Error checking article existence:', error)
    return false
  }
}
