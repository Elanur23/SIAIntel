import { NextRequest, NextResponse } from 'next/server'
import { generateSSML, validateSSML } from '@/lib/sia-news/ssml-generator'
import { getArticleById } from '@/lib/sia-news/database'
import type { GeneratedArticle } from '@/lib/sia-news/types'


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId, voiceConfig } = body

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    const article = await getArticleById(articleId)
    
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const articleForSSML = {
      ...article,
      metadata: {
        generatedAt: article.generatedAt || new Date().toISOString(),
        confidenceScore: article.confidenceScore ?? 0,
        eeatScore: article.eeatScore ?? 0,
        wordCount: article.wordCount ?? 0,
        readingTime: article.readingTime ?? 0,
        sources: article.sources ?? [],
        processingTime: 0,
      },
    } as unknown as GeneratedArticle
    const ssmlOutput = generateSSML(articleForSSML, voiceConfig)
    
    const validation = validateSSML(ssmlOutput.ssml)
    
    if (!validation.isValid) {
      console.error('SSML validation failed:', validation.errors)
      return NextResponse.json(
        {
          error: 'SSML generation failed validation',
          details: validation.errors
        },
        { status: 500 }
      )
    }

    console.log(`✅ SSML generated for article: ${article.headline}`)
    console.log(`   Language: ${article.language}`)
    console.log(`   Duration: ${ssmlOutput.estimatedDuration}s`)
    console.log(`   Word Count: ${ssmlOutput.wordCount}`)
    
    if (validation.warnings.length > 0) {
      console.warn('⚠️  SSML warnings:', validation.warnings)
    }

    return NextResponse.json({
      success: true,
      data: {
        articleId: article.id,
        language: article.language,
        ssml: ssmlOutput.ssml,
        plainText: ssmlOutput.plainText,
        metadata: {
          estimatedDuration: ssmlOutput.estimatedDuration,
          wordCount: ssmlOutput.wordCount,
          characterCount: ssmlOutput.characterCount,
          voiceName: voiceConfig?.language ? 
            `Google Cloud TTS - ${article.language.toUpperCase()}` : 
            'Default'
        },
        validation: {
          isValid: validation.isValid,
          warnings: validation.warnings
        }
      }
    })

  } catch (error) {
    console.error('SSML generation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'SSML generation failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    const article = await getArticleById(articleId)
    
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    const articleForSSML = {
      ...article,
      metadata: {
        generatedAt: article.generatedAt || new Date().toISOString(),
        confidenceScore: article.confidenceScore ?? 0,
        eeatScore: article.eeatScore ?? 0,
        wordCount: article.wordCount ?? 0,
        readingTime: article.readingTime ?? 0,
        sources: article.sources ?? [],
        processingTime: 0,
      },
    } as unknown as GeneratedArticle
    const ssmlOutput = generateSSML(articleForSSML)

    return new NextResponse(ssmlOutput.ssml, {
      status: 200,
      headers: {
        'Content-Type': 'application/ssml+xml',
        'Content-Disposition': `attachment; filename="article-${articleId}.ssml"`,
        'X-Estimated-Duration': ssmlOutput.estimatedDuration.toString(),
        'X-Word-Count': ssmlOutput.wordCount.toString()
      }
    })

  } catch (error) {
    console.error('SSML retrieval error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'SSML retrieval failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}
