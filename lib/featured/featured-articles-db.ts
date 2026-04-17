/**
 * Featured Articles Database
 * 
 * Manages manually curated featured stories for homepage
 * Premium editorial content with images
 */

import type { Language } from '@/lib/sia-news/types'
import type { ExpertByline } from '@/lib/identity/expert-attribution'

export interface FeaturedArticle {
  id: string
  slug: string
  title: string
  summary: string
  imageUrl: string
  category: 'CRYPTO' | 'AI' | 'STOCKS' | 'MACRO' | 'TECH'
  language: Language
  publishedAt: string
  readingTime: number // minutes
  featured: boolean
  featuredPriority: 1 | 2 | 3 // 1 = Hero, 2-3 = Secondary cards
  expertByline: ExpertByline
  tags: string[]
  viewCount: number
}

// In-memory storage (replace with real database later)
const featuredArticles = new Map<string, FeaturedArticle>()

/**
 * Save featured article
 */
export async function saveFeaturedArticle(article: FeaturedArticle): Promise<string> {
  featuredArticles.set(article.id, article)
  return article.id
}

/**
 * Get featured article by ID
 */
export async function getFeaturedArticle(id: string): Promise<FeaturedArticle | null> {
  return featuredArticles.get(id) || null
}

/**
 * Get all featured articles for a language
 */
export async function getFeaturedArticles(
  language: Language,
  limit: number = 3
): Promise<FeaturedArticle[]> {
  const articles = Array.from(featuredArticles.values())
    .filter(a => a.language === language && a.featured)
    .sort((a, b) => {
      // Sort by priority first, then by date
      if (a.featuredPriority !== b.featuredPriority) {
        return a.featuredPriority - b.featuredPriority
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    })
    .slice(0, limit)
  
  return articles
}

/**
 * Update featured status
 */
export async function updateFeaturedStatus(
  id: string,
  featured: boolean,
  priority?: 1 | 2 | 3
): Promise<boolean> {
  const article = featuredArticles.get(id)
  if (!article) return false
  
  article.featured = featured
  if (priority) article.featuredPriority = priority
  
  featuredArticles.set(id, article)
  return true
}

/**
 * Delete featured article
 */
export async function deleteFeaturedArticle(id: string): Promise<boolean> {
  return featuredArticles.delete(id)
}

/**
 * Get featured articles count
 */
export async function getFeaturedArticlesCount(language: Language): Promise<number> {
  return Array.from(featuredArticles.values())
    .filter(a => a.language === language && a.featured)
    .length
}

export default {
  saveFeaturedArticle,
  getFeaturedArticle,
  getFeaturedArticles,
  updateFeaturedStatus,
  deleteFeaturedArticle,
  getFeaturedArticlesCount
}
