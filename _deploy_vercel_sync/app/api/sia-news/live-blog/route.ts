import { NextRequest, NextResponse } from 'next/server'
import { LiveBlogManager, liveBlogStore } from '@/lib/sia-news/live-blog-manager'

/**
 * SIA LIVE_ANCHOR API
 * Manages real-time LiveBlogPosting coverage and updates.
 */

export async function GET() {
  const activeBlogs = LiveBlogManager.getActiveLiveBlogs()
  return NextResponse.json({
    success: true,
    count: activeBlogs.length,
    data: activeBlogs
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, articleId, update, headline, content, author, imageUrl, imageCaption } = body

    switch (action) {
      case 'start':
        if (!articleId) throw new Error('articleId is required')
        const metadata = LiveBlogManager.startCoverage(articleId)
        return NextResponse.json({ success: true, message: 'Coverage started', data: metadata })

      case 'add_update':
        if (!articleId) throw new Error('articleId is required')
        // Support both structured 'update' object or flat fields
        const finalHeadline = update?.headline || headline
        const finalContent = update?.content || content
        if (!finalHeadline || !finalContent) throw new Error('headline and content are required')

        const newUpdate = LiveBlogManager.addUpdate(
          articleId,
          finalHeadline,
          finalContent,
          update?.author || author,
          update?.imageUrl || imageUrl,
          update?.imageCaption || imageCaption
        )
        return NextResponse.json({ success: true, message: 'Update added', data: newUpdate })

      case 'end':
        if (!articleId) throw new Error('articleId is required')
        LiveBlogManager.endCoverage(articleId)
        return NextResponse.json({ success: true, message: 'Coverage ended' })

      case 'get_updates':
        if (!articleId) throw new Error('articleId is required')
        const updates = LiveBlogManager.getUpdates(articleId)
        return NextResponse.json({ success: true, data: updates })

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[LiveBlog API Error]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
