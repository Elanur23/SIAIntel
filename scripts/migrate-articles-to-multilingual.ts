/**
 * Migration Script: WarRoomArticle → Article + ArticleTranslation
 * Migrates existing flat structure to normalized multilingual structure
 * 
 * Usage: npx tsx scripts/migrate-articles-to-multilingual.ts
 */

import { PrismaClient } from '@prisma/client'
import { slugify } from '../lib/articles/slugify'
import type { SupportedLang } from '../lib/articles/types'

const prisma = new PrismaClient()

const LANGUAGE_FIELDS: Record<SupportedLang, { title: string; summary: string; content: string }> = {
  en: { title: 'titleEn', summary: 'summaryEn', content: 'contentEn' },
  tr: { title: 'titleTr', summary: 'summaryTr', content: 'contentTr' },
  de: { title: 'titleDe', summary: 'summaryDe', content: 'contentDe' },
  fr: { title: 'titleFr', summary: 'summaryFr', content: 'contentFr' },
  es: { title: 'titleEs', summary: 'summaryEs', content: 'contentEs' },
  ru: { title: 'titleRu', summary: 'summaryRu', content: 'contentRu' },
  ar: { title: 'titleAr', summary: 'summaryAr', content: 'contentAr' },
  jp: { title: 'titleJp', summary: 'summaryJp', content: 'contentJp' },
  zh: { title: 'titleZh', summary: 'summaryZh', content: 'contentZh' },
}

async function migrateArticles() {
  console.log('🚀 Starting migration: WarRoomArticle → Article + ArticleTranslation\n')

  try {
    // Fetch all WarRoomArticle records
    const warRoomArticles = await prisma.warRoomArticle.findMany({
      orderBy: { createdAt: 'asc' },
    })

    console.log(`📊 Found ${warRoomArticles.length} articles to migrate\n`)

    let successCount = 0
    let skipCount = 0
    let errorCount = 0

    for (const oldArticle of warRoomArticles) {
      try {
        console.log(`Processing: ${oldArticle.titleEn || oldArticle.titleTr || oldArticle.id}`)

        // Collect translations
        const translations: Array<{
          lang: string
          title: string
          excerpt: string
          content: string
          slug: string
        }> = []

        for (const [lang, fields] of Object.entries(LANGUAGE_FIELDS)) {
          const title = (oldArticle as any)[fields.title]
          const summary = (oldArticle as any)[fields.summary]
          const content = (oldArticle as any)[fields.content]

          // Only add translation if title exists
          if (title && typeof title === 'string' && title.trim()) {
            const slug = slugify(title, lang as SupportedLang) + '-' + oldArticle.id.slice(0, 8)

            translations.push({
              lang,
              title: title.trim(),
              excerpt: summary && typeof summary === 'string' ? summary.trim() : title.trim(),
              content: content && typeof content === 'string' ? content.trim() : title.trim(),
              slug,
            })

            console.log(`  ✓ ${lang.toUpperCase()}: ${title.substring(0, 50)}...`)
          }
        }

        // Skip if no translations found
        if (translations.length === 0) {
          console.log(`  ⚠️  Skipped: No translations found\n`)
          skipCount++
          continue
        }

        // Ensure English translation exists (fallback to first available)
        if (!translations.find((t) => t.lang === 'en')) {
          const firstTranslation = translations[0]
          translations.unshift({
            ...firstTranslation,
            lang: 'en',
            slug: slugify(firstTranslation.title, 'en') + '-' + oldArticle.id.slice(0, 8),
          })
          console.log(`  ℹ️  Added English fallback from ${firstTranslation.lang}`)
        }

        // Create new Article with translations
        await prisma.article.create({
          data: {
            id: oldArticle.id, // Preserve ID
            category: oldArticle.category || 'GENERAL',
            publishedAt: oldArticle.publishedAt,
            imageUrl: oldArticle.imageUrl,
            impact: oldArticle.marketImpact,
            confidence: oldArticle.confidence ? oldArticle.confidence / 100 : null,
            featured: false, // Default
            published: oldArticle.status === 'published',
            createdAt: oldArticle.createdAt,
            updatedAt: oldArticle.updatedAt,
            translations: {
              create: translations,
            },
          },
        })

        console.log(`  ✅ Migrated with ${translations.length} translations\n`)
        successCount++
      } catch (error) {
        console.error(`  ❌ Error migrating article ${oldArticle.id}:`, error)
        console.error(`     ${(error as Error).message}\n`)
        errorCount++
      }
    }

    console.log('\n' + '='.repeat(60))
    console.log('📈 Migration Summary:')
    console.log('='.repeat(60))
    console.log(`✅ Successfully migrated: ${successCount}`)
    console.log(`⚠️  Skipped (no content):  ${skipCount}`)
    console.log(`❌ Errors:                ${errorCount}`)
    console.log(`📊 Total processed:       ${warRoomArticles.length}`)
    console.log('='.repeat(60) + '\n')

    if (successCount > 0) {
      console.log('🎉 Migration completed successfully!')
      console.log('\n💡 Next steps:')
      console.log('   1. Verify data: Check Article and ArticleTranslation tables')
      console.log('   2. Test API: GET /api/articles?lang=en')
      console.log('   3. Test pages: Visit /en/news/[slug]')
      console.log('   4. Update application code to use new models')
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateArticles()
  .then(() => {
    console.log('\n✨ Migration script completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Migration script failed:', error)
    process.exit(1)
  })
