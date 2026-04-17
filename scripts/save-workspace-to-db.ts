#!/usr/bin/env tsx
/**
 * Save AI Workspace to Database
 * Creates multilingual article from ai_workspace.json
 * 
 * Usage: npx tsx scripts/save-workspace-to-db.ts
 */

import { readWorkspaceFile } from '../lib/ai/translate-workspace'
import { createArticle } from '../lib/articles/mutations'
import { slugify } from '../lib/articles/slugify'
import type { SupportedLang } from '../lib/articles/types'

async function main() {
  console.log('🚀 Save Workspace to Database\n')

  try {
    // Read workspace file
    console.log('📖 Reading ai_workspace.json...')
    const workspace = await readWorkspaceFile('./ai_workspace.json')

    if (!workspace.en) {
      throw new Error('English content is required')
    }

    // Prepare translations
    const languages: SupportedLang[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']
    const translations: any = {}

    for (const lang of languages) {
      const content = workspace[lang]
      if (!content) {
        console.log(`  ⚠️  ${lang.toUpperCase()}: Not available, skipping`)
        continue
      }

      // Generate slug for this language
      const slug = slugify(content.title, lang)

      translations[lang] = {
        title: content.title,
        excerpt: content.summary,
        content: content.content,
        slug,
      }

      console.log(`  ✓ ${lang.toUpperCase()}: Prepared (slug: ${slug})`)
    }

    // Create article
    console.log('\n💾 Creating article in database...')
    const article = await createArticle({
      category: workspace.category || 'GENERAL',
      imageUrl: workspace.en.imageUrl,
      impact: 10,
      confidence: 97,
      signal: 'BULLISH',
      volatility: 'HIGH',
      featured: true,
      published: true,
      translations,
    })

    console.log(`\n✅ Article created successfully!`)
    console.log(`   ID: ${article.id}`)
    console.log(`   Category: ${article.category}`)
    console.log(`   Translations: ${article.translations?.length || 0}`)

    console.log('\n🌍 Available URLs:')
    for (const translation of article.translations || []) {
      console.log(`   /${translation.lang}/news/${translation.slug}`)
    }

    console.log('\n💡 Test the article:')
    console.log('   npm run dev')
    console.log('   Open: http://localhost:3003/en/news/[slug]')

  } catch (error) {
    console.error('\n❌ Failed to save article:', error)
    process.exit(1)
  }
}

main()
