import { NextRequest, NextResponse } from 'next/server'
import { fallbackHandlerPro } from '@/lib/ai/fallback-handler-pro'
import { validateApiKey, rateLimitCheck } from '@/lib/auth'


export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // API key validation
    const apiKey = request.headers.get('x-api-key')
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await rateLimitCheck(clientIp, 'ai-fallback')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded',
          resetTime: rateLimitResult.resetTime
        },
        { status: 429 }
      )
    }

    const body = await request.json()
    const {
      prompt,
      systemPrompt = 'You are a helpful AI assistant.',
      category = 'news'
    } = body

    // Validate input
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Invalid prompt. String required.' },
        { status: 400 }
      )
    }

    if (prompt.length > 5000) {
      return NextResponse.json(
        { error: 'Prompt too long. Maximum 5000 characters.' },
        { status: 400 }
      )
    }

    console.log(`Fallback handler processing: ${prompt.substring(0, 50)}...`)

    // Process with fallback chain
    const result = await fallbackHandlerPro.handleWithFallback(
      prompt,
      systemPrompt,
      category
    )

    console.log(`Fallback handler completed:`)
    console.log(`  - Model: ${result.model}`)
    console.log(`  - Source: ${result.source}`)
    console.log(`  - Processing time: ${result.processingTime}ms`)
    console.log(`  - Fallback chain: ${result.fallbackChain.join(' → ')}`)

    return NextResponse.json({
      success: true,
      data: {
        content: result.content,
        model: result.model,
        source: result.source,
        cacheHit: result.cacheHit,
        fallbackChain: result.fallbackChain,
        processingTime: result.processingTime
      },
      metadata: {
        timestamp: new Date().toISOString(),
        clientIp: clientIp.substring(0, 10) // Privacy
      }
    })

  } catch (error) {
    console.error('Fallback handler error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Fallback processing failed',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * GET - Health check and status
 */
export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')

    if (action === 'health') {
      const health = await fallbackHandlerPro.healthCheck()
      return NextResponse.json({
        success: true,
        data: health
      })
    }

    if (action === 'status') {
      const modelStatus = fallbackHandlerPro.getModelStatus()
      const cacheStats = fallbackHandlerPro.getCacheStats()
      const fallbackStats = fallbackHandlerPro.getFallbackStats()

      return NextResponse.json({
        success: true,
        data: {
          models: modelStatus,
          cache: cacheStats,
          stats: fallbackStats
        }
      })
    }

    if (action === 'config') {
      const config = fallbackHandlerPro.getConfig()
      return NextResponse.json({
        success: true,
        data: config
      })
    }

    // Default: return status
    const modelStatus = fallbackHandlerPro.getModelStatus()
    const cacheStats = fallbackHandlerPro.getCacheStats()

    return NextResponse.json({
      success: true,
      data: {
        models: modelStatus,
        cache: cacheStats,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Fallback status error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Status check failed',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update configuration
 */
export async function PUT(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { config } = body

    if (!config || typeof config !== 'object') {
      return NextResponse.json(
        { error: 'Invalid config object' },
        { status: 400 }
      )
    }

    fallbackHandlerPro.updateConfig(config)

    console.log('Fallback handler config updated:', config)

    return NextResponse.json({
      success: true,
      message: 'Configuration updated',
      data: fallbackHandlerPro.getConfig()
    })

  } catch (error) {
    console.error('Config update error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Configuration update failed',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Clear cache
 */
export async function DELETE(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key')
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    fallbackHandlerPro.clearCache()

    console.log('Fallback handler cache cleared')

    return NextResponse.json({
      success: true,
      message: 'Cache cleared'
    })

  } catch (error) {
    console.error('Cache clear error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Cache clear failed',
        details: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined
      },
      { status: 500 }
    )
  }
}

