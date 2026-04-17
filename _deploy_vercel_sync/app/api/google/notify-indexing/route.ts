/**
 * GOOGLE INDEXING API ENDPOINT - ADMIN ONLY
 * Manual trigger for priority indexing
 */

import { NextRequest, NextResponse } from 'next/server'
import { validateSession } from '@/lib/auth/session-manager'
import { notifyGoogleIndexing, shouldTriggerIndexing, getRateLimitStatus } from '@/lib/google/indexing-service'

export async function POST(request: NextRequest) {
  try {
    // 1. Validate admin session
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      )
    }
    
    const session = await validateSession(token)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      )
    }

    // 2. Parse request body
    const body = await request.json()
    const { url, articleData } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // 3. Check if article qualifies (optional validation)
    if (articleData) {
      const qualifies = shouldTriggerIndexing(articleData)
      if (!qualifies) {
        return NextResponse.json(
          {
            success: false,
            message: 'Article does not qualify for priority indexing',
            reason: 'Not breaking news or exclusive content'
          },
          { status: 200 }
        )
      }
    }

    // 4. Check rate limit
    const rateLimitStatus = getRateLimitStatus()
    if (rateLimitStatus.remaining <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Daily rate limit reached',
          rateLimit: rateLimitStatus
        },
        { status: 429 }
      )
    }

    // 5. Notify Google
    const result = await notifyGoogleIndexing(url, 'URL_UPDATED')

    // 6. Return result with rate limit info
    return NextResponse.json({
      ...result,
      rateLimit: getRateLimitStatus()
    })

  } catch (error: any) {
    console.error('[Indexing API] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET endpoint to check rate limit status
 */
export async function GET(request: NextRequest) {
  try {
    // Validate admin session
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No session token' },
        { status: 401 }
      )
    }
    
    const session = await validateSession(token)
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid session' },
        { status: 401 }
      )
    }

    const rateLimitStatus = getRateLimitStatus()

    return NextResponse.json({
      success: true,
      rateLimit: rateLimitStatus
    })

  } catch (error: any) {
    console.error('[Indexing API] Error:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
