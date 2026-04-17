import { NextRequest, NextResponse } from 'next/server'
import {
  saveFeaturedArticle,
  getFeaturedArticle,
  getFeaturedArticles,
  updateFeaturedStatus,
  deleteFeaturedArticle,
  type FeaturedArticle
} from '@/lib/featured/featured-articles-db'
import type { Language } from '@/lib/sia-news/types'
import { requirePermission } from '@/lib/rbac/rbac-helpers'
import { extractClientIP } from '@/lib/security/client-ip-extractor'


export const dynamic = 'force-dynamic';

/**
 * GET /api/featured-articles
 * Get featured articles for a language
 * Permission: view_content (for authenticated users) or public
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = (searchParams.get('language') || 'en') as Language
    const limit = parseInt(searchParams.get('limit') || '3')
    const id = searchParams.get('id')

    // Public endpoint - no auth required for GET
    // (Featured articles are public content)

    // Get single article by ID
    if (id) {
      const article = await getFeaturedArticle(id)
      if (!article) {
        return NextResponse.json(
          { error: 'Article not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ article })
    }

    // Get all featured articles for language
    const articles = await getFeaturedArticles(language, limit)
    
    return NextResponse.json({
      success: true,
      articles,
      count: articles.length
    })

  } catch (error) {
    console.error('Featured articles GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch featured articles' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/featured-articles
 * Create new featured article
 * Permission: publish_content
 */
export async function POST(request: NextRequest) {
  try {
    // Require permission
    const sessionToken = request.cookies.get('sia_admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const ipResult = extractClientIP(request.headers)
    await requirePermission(sessionToken, 'publish_content', {
      ipAddress: ipResult.normalized,
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/featured-articles',
    })

    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['id', 'slug', 'title', 'summary', 'imageUrl', 'category', 'language', 'expertByline']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create featured article
    const article: FeaturedArticle = {
      id: body.id,
      slug: body.slug,
      title: body.title,
      summary: body.summary,
      imageUrl: body.imageUrl,
      category: body.category,
      language: body.language,
      publishedAt: body.publishedAt || new Date().toISOString(),
      readingTime: body.readingTime || 5,
      featured: body.featured !== undefined ? body.featured : true,
      featuredPriority: body.featuredPriority || 2,
      expertByline: body.expertByline,
      tags: body.tags || [],
      viewCount: body.viewCount || Math.floor(Math.random() * 500) + 100
    }

    const id = await saveFeaturedArticle(article)

    return NextResponse.json({
      success: true,
      id,
      article
    })

  } catch (error: any) {
    console.error('Featured articles POST error:', error)

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create featured article' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/featured-articles
 * Update featured status
 * Permission: edit_content
 */
export async function PUT(request: NextRequest) {
  try {
    // Require permission
    const sessionToken = request.cookies.get('sia_admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const ipResult = extractClientIP(request.headers)
    await requirePermission(sessionToken, 'edit_content', {
      ipAddress: ipResult.normalized,
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/featured-articles',
    })

    const body = await request.json()
    const { id, featured, priority } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Missing article ID' },
        { status: 400 }
      )
    }

    const success = await updateFeaturedStatus(id, featured, priority)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Featured status updated'
    })

  } catch (error: any) {
    console.error('Featured articles PUT error:', error)

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to update featured status' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/featured-articles
 * Delete featured article
 * Permission: delete_content
 */
export async function DELETE(request: NextRequest) {
  try {
    // Require permission
    const sessionToken = request.cookies.get('sia_admin_session')?.value
    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const ipResult = extractClientIP(request.headers)
    await requirePermission(sessionToken, 'delete_content', {
      ipAddress: ipResult.normalized,
      userAgent: request.headers.get('user-agent') || 'unknown',
      route: '/api/featured-articles',
    })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Missing article ID' },
        { status: 400 }
      )
    }

    const success = await deleteFeaturedArticle(id)
    
    if (!success) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Featured article deleted'
    })

  } catch (error: any) {
    console.error('Featured articles DELETE error:', error)

    if (error.name === 'UnauthorizedError') {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      )
    }

    if (error.name === 'ForbiddenError') {
      return NextResponse.json(
        { error: error.message },
        { status: 403 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to delete featured article' },
      { status: 500 }
    )
  }
}
