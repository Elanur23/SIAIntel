import { NextRequest, NextResponse } from 'next/server'
import { getArticleById } from '@/lib/warroom/database'


export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ success: false, error: 'ID required' });

  try {
    const article = await getArticleById(id)
    return NextResponse.json({ success: true, data: article })
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Article not found' })
  }
}
