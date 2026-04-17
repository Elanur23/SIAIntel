import { NextRequest, NextResponse } from 'next/server'
import { generateNewsArticle } from '@/lib/ai-generator'
import { createNews, generateSlug } from '@/lib/database'
import { isCoolingDown, getCooldownMessage } from '@/lib/ai/quota-guard'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { topic, language, category, tone, length, autoPublish } = body

    if (!topic || !language || !category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: topic, language, category' },
        { status: 400 }
      )
    }

    // Quota guard: reject early if Gemini is in cooldown
    if (isCoolingDown('gemini')) {
      return NextResponse.json(
        { success: false, error: getCooldownMessage('gemini'), code: 'QUOTA_COOLDOWN' },
        { status: 429 }
      )
    }

    const generated = await generateNewsArticle({
      topic,
      language,
      category,
      tone: tone || 'professional',
      length: length || 'medium'
    })

    // Create slug from title
    const slug = generateSlug(generated.title)

    // Save to database
    const newsId = createNews({
      title: generated.title,
      slug,
      content: generated.content,
      excerpt: generated.excerpt,
      language,
      category,
      author: 'AI Generator',
      status: autoPublish ? 'published' : 'draft'
    })

    return NextResponse.json({
      success: true,
      data: {
        id: newsId,
        ...generated,
        slug,
        language,
        category,
        status: autoPublish ? 'published' : 'draft'
      }
    })
  } catch (error: any) {
    console.error('AI Generation error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to generate news article' },
      { status: 500 }
    )
  }
}
