import { NextRequest, NextResponse } from 'next/server'
import { translateStructuredArticle } from '@/lib/ai/translation-service'

/**
 * API KALDIRILDI: Gemini, Groq ve diğer AI API'leri devre dışı.
 * Çeviri yapılmıyor — kaynak metin olduğu gibi döndürülüyor.
 */

export const dynamic = 'force-dynamic'

const STRUCTURED_LANGS = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'] as const

function countWords(content: string): number {
  return content.split(/\s+/).filter(Boolean).length
}

export async function POST(request: NextRequest) {
  try {
    const { text, targetLang, sourceLang = 'en' } = await request.json()
    if (!text) return NextResponse.json({ success: false, error: 'Content empty' })

    if ((STRUCTURED_LANGS as readonly string[]).includes(targetLang)) {
      const out = await translateStructuredArticle({ text, targetLang, sourceLang })
      return NextResponse.json({
        success: true,
        translatedText: out.translatedText,
        systemLog: out.systemLog,
        meta: out.meta,
        ...(out.title && { title: out.title })
      })
    }

    // Diğer diller için de kaynak metni döndür
    return NextResponse.json({
      success: true,
      translatedText: text,
      systemLog: 'API_DISABLED',
      meta: { wordCount: countWords(text) }
    })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
