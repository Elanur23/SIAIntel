/**
 * DEBUG SCRIPT: Slug Resolution Issue
 * Tests the failing URL: alpha-node-the-rise-of-the-compute-backed-sovereig
 */

import { prisma } from '@/lib/db/prisma'

async function debugSlugIssue() {
  const failingSlug = 'alpha-node-the-rise-of-the-compute-backed-sovereig'
  
  console.log('=== SLUG DEBUG ANALYSIS ===')
  console.log('Failing URL slug:', failingSlug)
  console.log('Slug length:', failingSlug.length)
  console.log('')
  
  // Check if this is a truncated slug
  console.log('Searching for articles with similar slugs...')
  
  // Search in ArticleTranslation
  const translations = await prisma.articleTranslation.findMany({
    where: {
      slug: {
        startsWith: 'alpha-node-the-rise'
      }
    },
    include: {
      article: true
    }
  })
  
  console.log(`Found ${translations.length} matching translations:`)
  translations.forEach(t => {
    console.log(`  - ID: ${t.articleId}`)
    console.log(`    Lang: ${t.lang}`)
    console.log(`    Slug: ${t.slug}`)
    console.log(`    Slug Length: ${t.slug.length}`)
    console.log(`    Title: ${t.title}`)
    console.log(`    Published: ${t.article.published}`)
    console.log('')
  })
  
  // Check WarRoomArticle
  const warRoomArticles = await prisma.warRoomArticle.findMany({
    where: {
      OR: [
        { titleEn: { contains: 'Alpha Node' } },
        { titleEn: { contains: 'Compute-Backed Sovereign' } }
      ]
    }
  })
  
  console.log(`Found ${warRoomArticles.length} matching WarRoom articles:`)
  warRoomArticles.forEach(a => {
    console.log(`  - ID: ${a.id}`)
    console.log(`    Title (EN): ${a.titleEn}`)
    console.log(`    Status: ${a.status}`)
    console.log('')
  })
  
  // Test slug generation
  const testTitle = 'Alpha Node: The Rise of the Compute-Backed Sovereign'
  const generatedSlug = testTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100)
  
  console.log('=== SLUG GENERATION TEST ===')
  console.log('Test title:', testTitle)
  console.log('Generated slug:', generatedSlug)
  console.log('Generated slug length:', generatedSlug.length)
  console.log('Matches failing slug?', generatedSlug === failingSlug)
  console.log('')
  
  // Check if the issue is the 100-char limit
  const fullSlug = testTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  
  console.log('Full slug (no limit):', fullSlug)
  console.log('Full slug length:', fullSlug.length)
  console.log('Truncated at 100?', fullSlug.length > 100)
}

debugSlugIssue()
  .then(() => {
    console.log('Debug complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('Debug failed:', err)
    process.exit(1)
  })
