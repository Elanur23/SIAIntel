import { NextRequest, NextResponse } from 'next/server'
import { getArticleById } from '@/lib/sia-news/database'
import { generateSSML } from '@/lib/sia-news/ssml-generator'
import type { GeneratedArticle } from '@/lib/sia-news/types'
import { generateArticleAudio, getAudioMetadata, getAudioStatistics } from '@/lib/sia-news/audio-service'
import { verifySignedUrl, isHotlinking, getAntiHotlinkHeaders } from '@/lib/security/signed-url-generator'


export const dynamic = 'force-dynamic';

/**
 * Generate audio for article
 * POST /api/sia-news/audio
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { articleId, regenerate } = body

    if (!articleId) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      )
    }

    // Check if audio already exists
    if (!regenerate) {
      const existingAudio = await getAudioMetadata(articleId)
      if (existingAudio) {
        console.log(`✅ Audio already exists for article: ${articleId}`)
        return NextResponse.json({
          success: true,
          data: existingAudio,
          cached: true
        })
      }
    }

    // Get article
    const article = await getArticleById(articleId)
    
    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      )
    }

    console.log(`🎙️  Generating audio for article: ${article.headline}`)
    console.log(`   Language: ${article.language}`)

    // Generate SSML (ArticleRecord has headline/summary/siaInsight/riskDisclaimer; SSML only needs those + language. Cast to satisfy GeneratedArticle.)
    const articleForSSML = {
      ...article,
      metadata: {
        generatedAt: article.generatedAt || new Date().toISOString(),
        confidenceScore: article.confidenceScore ?? 0,
        eeatScore: article.eeatScore ?? 0,
        wordCount: article.wordCount ?? (article.fullContent || '').split(/\s+/).length,
        readingTime: article.readingTime ?? 0,
        sources: article.sources ?? [],
        processingTime: 0,
      },
    } as unknown as GeneratedArticle
    const ssmlOutput = generateSSML(articleForSSML)
    
    console.log(`   SSML generated: ${ssmlOutput.wordCount} words, ~${ssmlOutput.estimatedDuration}s`)

    // Generate audio
    const audioMetadata = await generateArticleAudio(
      articleId,
      ssmlOutput.ssml,
      article.language
    )

    console.log(`✅ Audio generated successfully`)
    console.log(`   URL: ${audioMetadata.url}`)
    console.log(`   Duration: ${audioMetadata.duration}s`)
    console.log(`   Size: ${(audioMetadata.size / 1024).toFixed(2)} KB`)

    return NextResponse.json({
      success: true,
      data: audioMetadata,
      cached: false
    })

  } catch (error) {
    console.error('Audio generation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Audio generation failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Get audio metadata or statistics
 * GET /api/sia-news/audio?articleId=xxx&lang=en&exp=xxx&sig=xxx (signed URL)
 * GET /api/sia-news/audio?stats=true
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const articleId = searchParams.get('articleId')
    const stats = searchParams.get('stats')
    const signature = searchParams.get('sig')

    // Get statistics (no signature required for admin endpoint)
    if (stats === 'true') {
      const statistics = await getAudioStatistics()
      
      return NextResponse.json({
        success: true,
        data: statistics
      })
    }

    // Get audio file - requires signed URL
    if (articleId) {
      // 1. Check for hotlinking
      if (isHotlinking(request)) {
        console.warn(`[HOTLINK] Blocked hotlink attempt for article: ${articleId}`)
        return new NextResponse('Forbidden - Hotlinking Not Allowed', {
          status: 403,
          headers: getAntiHotlinkHeaders()
        })
      }

      // 2. Verify signed URL
      if (signature) {
        const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                        request.headers.get('x-real-ip') || 
                        'unknown'
        
        const verification = verifySignedUrl(request.url, clientIP)
        
        if (!verification.valid) {
          console.warn(`[SIGNED-URL] Invalid signature for article: ${articleId}, Reason: ${verification.reason}`)
          
          if (verification.expired) {
            return new NextResponse('URL Expired - Please Refresh', {
              status: 410,
              headers: getAntiHotlinkHeaders()
            })
          }
          
          return new NextResponse('Forbidden - Invalid Signature', {
            status: 403,
            headers: getAntiHotlinkHeaders()
          })
        }
        
        console.log(`✅ Signed URL verified for article: ${articleId}`)
      } else {
        // No signature - allow for backward compatibility but log warning
        console.warn(`[SIGNED-URL] Missing signature for article: ${articleId}`)
      }

      // 3. Get audio metadata
      const audioMetadata = await getAudioMetadata(articleId)
      
      if (!audioMetadata) {
        return NextResponse.json(
          { error: 'Audio not found for this article' },
          { status: 404 }
        )
      }

      // 4. Return audio with anti-hotlink headers
      return NextResponse.json(
        {
          success: true,
          data: audioMetadata
        },
        {
          headers: getAntiHotlinkHeaders()
        }
      )
    }

    return NextResponse.json(
      { error: 'articleId or stats parameter is required' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Audio retrieval error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Audio retrieval failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}
