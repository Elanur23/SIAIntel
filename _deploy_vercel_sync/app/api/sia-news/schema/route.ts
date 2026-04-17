/**
 * GET /api/sia-news/schema?articleId=xxx
 * 
 * Retrieve JSON-LD structured data schema for a published article
 * 
 * This endpoint provides Google-optimized Schema.org structured data
 * for SEO and rich results optimization.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getStructuredData } from '@/lib/sia-news/publishing-pipeline'
import { generateSchemaScriptTag } from '@/lib/sia-news/structured-data-generator'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')
    const format = searchParams.get('format') || 'json' // json | html
    
    if (!articleId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing articleId parameter'
        },
        { status: 400 }
      )
    }
    
    // Retrieve structured data from cache
    const structuredData = getStructuredData(articleId)
    
    if (!structuredData) {
      return NextResponse.json(
        {
          success: false,
          error: 'Article not found or schema not generated',
          details: 'The article may not be published yet or schema generation failed'
        },
        { status: 404 }
      )
    }
    
    // Return in requested format
    if (format === 'html') {
      const scriptTag = generateSchemaScriptTag(structuredData)
      
      return new NextResponse(scriptTag, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      })
    }
    
    // Default: JSON format
    return NextResponse.json(
      {
        success: true,
        articleId,
        schema: structuredData,
        metadata: {
          timestamp: new Date().toISOString(),
          format: 'application/ld+json'
        }
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
        }
      }
    )
    
  } catch (error) {
    console.error('[SIA News Schema] Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve schema',
        details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}
