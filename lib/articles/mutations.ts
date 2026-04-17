/**
 * Multilingual Article Mutations
 * Create, update, and delete operations
 */

import { prisma } from '@/lib/db/prisma'
import type { CreateArticleInput, UpdateArticleInput, SupportedLang, Article } from './types'
import { generateUniqueSlug } from './slugify'

/**
 * Create article with translations
 */
export async function createArticle(input: CreateArticleInput): Promise<Article> {
  const {
    category,
    imageUrl,
    impact,
    confidence,
    signal,
    volatility,
    featured = false,
    published = true,
    translations,
  } = input

  // Validate: English translation is required
  if (!translations.en) {
    throw new Error('English translation is required')
  }

  // Create article with translations
  const article = await prisma.article.create({
    data: {
      category,
      imageUrl,
      impact,
      confidence,
      signal,
      volatility,
      featured,
      published,
      translations: {
        create: Object.entries(translations)
          .filter(([_, translation]) => translation !== undefined)
          .map(([lang, translation]) => ({
            lang,
            title: translation!.title,
            excerpt: translation!.excerpt,
            content: translation!.content,
            slug: translation!.slug,
          })),
      },
    },
    include: {
      translations: true,
    },
  })

  return article
}

/**
 * Update article and/or translations
 */
export async function updateArticle(id: string, input: UpdateArticleInput): Promise<Article> {
  const {
    category,
    imageUrl,
    impact,
    confidence,
    signal,
    volatility,
    featured,
    published,
    translations,
  } = input

  // Update article metadata
  const article = await prisma.article.update({
    where: { id },
    data: {
      category,
      imageUrl,
      impact,
      confidence,
      signal,
      volatility,
      featured,
      published,
    },
    include: {
      translations: true,
    },
  })

  // Update translations if provided
  if (translations) {
    for (const [lang, translation] of Object.entries(translations)) {
      if (!translation) continue

      // Check if translation exists
      const existing = await prisma.articleTranslation.findUnique({
        where: {
          articleId_lang: {
            articleId: id,
            lang,
          },
        },
      })

      if (existing) {
        // Update existing translation
        await prisma.articleTranslation.update({
          where: {
            articleId_lang: {
              articleId: id,
              lang,
            },
          },
          data: {
            title: translation.title,
            excerpt: translation.excerpt,
            content: translation.content,
            slug: translation.slug,
          },
        })
      } else {
        // Create new translation
        await prisma.articleTranslation.create({
          data: {
            articleId: id,
            lang,
            title: translation.title!,
            excerpt: translation.excerpt!,
            content: translation.content!,
            slug: translation.slug!,
          },
        })
      }
    }
  }

  // Return updated article with translations
  return await prisma.article.findUniqueOrThrow({
    where: { id },
    include: {
      translations: true,
    },
  })
}

/**
 * Delete article (cascades to translations)
 */
export async function deleteArticle(id: string): Promise<void> {
  await prisma.article.delete({
    where: { id },
  })
}

/**
 * Delete specific translation
 */
export async function deleteTranslation(articleId: string, lang: SupportedLang): Promise<void> {
  // Don't allow deleting English translation if it's the only one
  const translationCount = await prisma.articleTranslation.count({
    where: { articleId },
  })

  if (translationCount === 1 && lang === 'en') {
    throw new Error('Cannot delete the last translation (English is required)')
  }

  await prisma.articleTranslation.delete({
    where: {
      articleId_lang: {
        articleId,
        lang,
      },
    },
  })
}

/**
 * Publish/unpublish article
 */
export async function togglePublished(id: string): Promise<Article> {
  const article = await prisma.article.findUniqueOrThrow({
    where: { id },
  })

  return await prisma.article.update({
    where: { id },
    data: {
      published: !article.published,
    },
    include: {
      translations: true,
    },
  })
}

/**
 * Toggle featured status
 */
export async function toggleFeatured(id: string): Promise<Article> {
  const article = await prisma.article.findUniqueOrThrow({
    where: { id },
  })

  return await prisma.article.update({
    where: { id },
    data: {
      featured: !article.featured,
    },
    include: {
      translations: true,
    },
  })
}
