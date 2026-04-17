import { NextRequest, NextResponse } from 'next/server'
import {
  generateStructuredData,
  validateNewsArticleSchema,
  generateNextMetadata,
  getCurrentISOTimestamp,
  generateSlugFromHeadline,
  type NewsArticleData
} from '@/lib/seo/NewsArticleSchema'

/**
 * SEO Schema Generation API
 * POST /api/seo/generate-schema
 * 
 * Generates complete SEO package for news articles:
 * - JSON-LD NewsArticle schema
 * - Meta tags (robots, canonical, etc.)
 * - Google News sitemap entry
 * - Open Graph tags
 * - Twitter Card tags
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.headline) {
      return NextResponse.json(
        { error: 'headline is required' },
        { status: 400 }
      )
    }

    if (!body.description) {
      return NextResponse.json(
        { error: 'description is required' },
        { status: 400 }
      )
    }

    if (!body.content) {
      return NextResponse.json(
        { error: 'content is required' },
        { status: 400 }
      )
    }

    // Build article data
    const slug = body.slug || generateSlugFromHeadline(body.headline)
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
    const articleUrl = `${baseUrl}/${body.language || 'en'}/intelligence/${slug}`

    const articleData: NewsArticleData = {
      headline: body.headline,
      description: body.description,
      content: body.content,
      author: body.author || 'SIA_INTELLIGENCE_ENGINE',
      datePublished: body.datePublished || getCurrentISOTimestamp(),
      dateModified: body.dateModified,
      url: body.url || articleUrl,
      imageUrl: body.imageUrl,
      category: body.category || 'Financial Intelligence',
      keywords: body.keywords || [],
      language: body.language || 'en',
      // E-E-A-T Enhancement Fields
      sources: body.sources,
      aiDisclosure: body.aiDisclosure,
      editorialProcess: body.editorialProcess,
      correctionPolicy: body.correctionPolicy
    }

    console.log('[SEO Schema] Generating for:', articleData.headline)

    // Validate schema
    const validation = validateNewsArticleSchema(articleData)

    if (!validation.isValid) {
      console.warn('[SEO Schema] Validation errors:', validation.errors)
      return NextResponse.json(
        {
          success: false,
          error: 'Schema validation failed',
          errors: validation.errors,
          warnings: validation.warnings
        },
        { status: 400 }
      )
    }

    // Generate structured data
    const structuredData = generateStructuredData(articleData)

    // Generate Next.js metadata
    const nextMetadata = generateNextMetadata(articleData)

    console.log('[SEO Schema] ✓ Generated successfully')
    if (validation.warnings.length > 0) {
      console.log('[SEO Schema] Warnings:', validation.warnings)
    }

    return NextResponse.json({
      success: true,
      data: {
        article: articleData,
        structuredData,
        nextMetadata,
        validation: {
          isValid: validation.isValid,
          warnings: validation.warnings
        }
      },
      metadata: {
        timestamp: getCurrentISOTimestamp(),
        slug,
        url: articleUrl
      }
    })

  } catch (error) {
    console.error('[SEO Schema] Generation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Schema generation failed',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/seo/generate-schema
 * Returns API documentation
 */
export async function GET() {
  return NextResponse.json({
    service: 'SEO Schema Generator',
    version: '1.0.0',
    status: 'operational',
    features: {
      jsonLd: 'NewsArticle schema (Schema.org)',
      metaTags: 'Robots, canonical, description, keywords',
      sitemap: 'Google News sitemap entry',
      openGraph: 'Facebook Open Graph tags',
      twitterCard: 'Twitter Card tags',
      validation: 'Schema validation with errors/warnings',
      eeat: 'E-E-A-T transparency (sources, AI disclosure, corrections)'
    },
    usage: {
      endpoint: 'POST /api/seo/generate-schema',
      requiredFields: ['headline', 'description', 'content'],
      optionalFields: [
        'author',
        'datePublished',
        'dateModified',
        'url',
        'imageUrl',
        'category',
        'keywords',
        'language',
        'slug',
        'sources',
        'aiDisclosure',
        'editorialProcess',
        'correctionPolicy'
      ]
    },
    example: {
      request: {
        headline: 'Bitcoin Surges 8% Following Institutional Adoption',
        description: 'Major financial institutions announce Bitcoin integration, driving market rally.',
        content: 'Full article content here...',
        author: 'SIA_INTELLIGENCE_ENGINE',
        category: 'Cryptocurrency',
        keywords: ['Bitcoin', 'Cryptocurrency', 'Institutional Adoption'],
        language: 'en'
      },
      response: {
        success: true,
        data: {
          structuredData: {
            jsonLd: '<script type="application/ld+json">...</script>',
            metaTags: '<meta name="robots" content="..." />',
            sitemapEntry: '<url><loc>...</loc></url>',
            openGraph: '<meta property="og:type" content="article" />',
            twitterCard: '<meta name="twitter:card" content="..." />'
          }
        }
      }
    }
  })
}
