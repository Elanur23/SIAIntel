import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'

/**
 * On-Demand Revalidation API
 * 
 * Allows targeted cache invalidation for:
 * - Specific articles
 * - Category pages
 * - Homepage
 * - Any path or tag
 * 
 * POST /api/revalidate
 * Body: { tags?: string[], paths?: string[], secret?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tags, paths, secret } = body

    // Verify secret token (optional but recommended)
    if (secret && secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      )
    }

    const revalidated: string[] = []

    // Revalidate by tags
    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        revalidateTag(tag)
        revalidated.push(`tag:${tag}`)
      }
    }

    // Revalidate by paths
    if (paths && Array.isArray(paths)) {
      for (const path of paths) {
        revalidatePath(path)
        revalidated.push(`path:${path}`)
      }
    }

    console.log(`✅ Cache revalidated: ${revalidated.join(', ')}`)

    return NextResponse.json({
      success: true,
      revalidated,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Revalidation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Revalidation failed',
        details: process.env.NODE_ENV === 'development' ? 
          (error as Error).message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Get revalidation status
 * GET /api/revalidate
 */
export async function GET() {
  return NextResponse.json({
    status: 'operational',
    message: 'On-demand revalidation API is ready',
    usage: {
      method: 'POST',
      body: {
        tags: ['array of cache tags to revalidate'],
        paths: ['array of paths to revalidate'],
        secret: 'optional secret token',
      },
    },
  })
}
