/**
 * SIA Internal Silo Linking API
 * POST /api/interlinking/auto-link
 *
 * Manages and triggers the automatic silo linking system.
 */

import { NextRequest, NextResponse } from 'next/server'
import { smartInsertLinks, analyzeLinking } from '@/lib/seo/auto-silo-linking'
import { getArticles, updateArticle } from '@/lib/warroom/database'
import type { Language } from '@/lib/sia-news/types'

// Default configuration
let siloConfig = {
  enabled: true,
  maxArticlesToScan: 1000,
  minRelevanceScore: 65,
  bidirectional: true,
  maxLinksPerUpdate: 3,
  autoPublish: true
}

/**
 * POST: Trigger auto-linking for a specific article or bulk process
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { article, config: overrideConfig } = body

    const config = { ...siloConfig, ...overrideConfig }

    if (!article || !article.content || !article.language) {
      return NextResponse.json({ success: false, error: 'Article content and language are required' }, { status: 400 })
    }

    // 1. Process the provided article
    const result = smartInsertLinks(
      article.content,
      article.language as Language,
      {
        maxTotalLinks: 10,
        avoidHeadings: true
      }
    )

    // 2. If it's a new article being published, we could also scan old ones
    // (This part would interface with the database to find related articles)

    return NextResponse.json({
      success: true,
      result: {
        articleId: article.id,
        linksAdded: result.linksAdded,
        keywords: result.keywords,
        content: result.linkedContent,
        analysis: analyzeLinking(article.content, result.linkedContent)
      },
      config
    })

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

/**
 * GET: Get current silo linking configuration
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    config: siloConfig
  })
}

/**
 * PUT: Update silo linking configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (body.config) {
      siloConfig = { ...siloConfig, ...body.config }
    }

    return NextResponse.json({
      success: true,
      config: siloConfig
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
