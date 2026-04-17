import { NextRequest, NextResponse } from 'next/server'
import { getAllNews } from '@/lib/database'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const language = searchParams.get('language') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    const news = getAllNews(language, limit)

    return NextResponse.json({
      success: true,
      data: news,
      count: news.length
    })
  } catch (error) {
    console.error('Get news error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
