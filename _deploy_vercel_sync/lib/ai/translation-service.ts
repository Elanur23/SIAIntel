/**
 * SIA TRANSLATION SERVICE — Gemini + Groq Active
 * Groq → Gemini fallback, anti-truncation prompts, chunking for long texts
 */

import { GoogleGenerativeAI } from '@google/generative-ai'

const LANG_NAMES: Record<string, string> = {
  tr: 'Turkish', en: 'English', fr: 'French', de: 'German',
  es: 'Spanish', ru: 'Russian', ar: 'Arabic', jp: 'Japanese', zh: 'Chinese'
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const GROQ_API_KEY = process.env.GROQ_API_KEY || ''

function countWords(content: string): number {
  const cjk = (content.match(/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/g) || []).length
  if (cjk > 30) return Math.round(cjk / 2)
  return content.split(/\s+/).filter(Boolean).length
}

// ── Groq ─────────────────────────────────────────────────────────────────────

async function requestGroq(prompt: string): Promise<string> {
  if (!GROQ_API_KEY) throw new Error('GROQ_API_KEY missing')
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 4096,
      temperature: 0.2,
    }),
  })
  if (!res.ok) throw new Error(`Groq HTTP ${res.status}`)
  const data = await res.json()
  const text = data.choices?.[0]?.message?.content?.trim()
  if (!text) throw new Error('Groq empty response')
  return text
}

// ── Gemini ────────────────────────────────────────────────────────────────────

async function requestGemini(prompt: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GEMINI_API_KEY?.trim()
  if (!key) throw new Error('GEMINI_API_KEY missing')
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { temperature: 0.2, maxOutputTokens: 8192 },
  })
  const result = await model.generateContent(prompt)
  const text = result.response.text()?.trim()
  if (!text) throw new Error('Gemini empty response')
  return text
}

// ── Fallback chain ────────────────────────────────────────────────────────────

async function generateWithFallback(prompt: string): Promise<string> {
  if (GROQ_API_KEY) {
    try { return await requestGroq(prompt) } catch (e) {
      console.warn('[TRANSLATION] Groq failed, falling back to Gemini:', (e as Error).message)
    }
  }
  return requestGemini(prompt)
}

// ── Chunking ──────────────────────────────────────────────────────────────────

function splitIntoChunks(text: string, maxWords = 400): string[] {
  const blocks = text.split(/\n\n+/)
  const chunks: string[] = []
  let current = ''

  for (const block of blocks) {
    const combined = current ? current + '\n\n' + block : block
    if (countWords(combined) > maxWords && current) {
      chunks.push(current.trim())
      current = block
    } else {
      current = combined
    }
  }
  if (current.trim()) chunks.push(current.trim())
  return chunks.length ? chunks : [text]
}

// ── Single chunk translation ──────────────────────────────────────────────────

async function translateOneChunk(
  chunk: string,
  targetLang: string,
  sourceLang: string
): Promise<string> {
  const langName = LANG_NAMES[targetLang] || targetLang
  const sourceName = LANG_NAMES[sourceLang] || sourceLang
  const wordHint = countWords(chunk)

  const prompt = `You are a professional financial translator. Translate the following text from ${sourceName} to ${langName}.

CRITICAL — LENGTH: The output MUST have approximately the same word count as the source (~${wordHint} words). Do NOT shorten, summarize, omit, or condense any section. Translate EVERY sentence, paragraph, and technical detail fully. This applies to ALL target languages including Arabic, Chinese, Japanese, Russian, German, French, Spanish — full length required.

RULES:
- Keep all formatting: **bold**, headers, bullet points, section markers like [CATCH_BOX], [OFFICIAL_DISCLAIMER]
- Keep all numbers, prices, ticker symbols, percentages exactly as-is
- Translate ONLY the natural language text, not technical codes
- Return ONLY the translated text, no explanations or meta-commentary

SOURCE TEXT:
${chunk}`

  return generateWithFallback(prompt)
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function translateStructuredArticle(params: {
  text: string
  targetLang: string
  sourceLang?: string
}) {
  const { text, targetLang, sourceLang = 'en' } = params

  // Same language — skip translation
  if (targetLang === sourceLang) {
    const body = text.trim()
    const firstLine = body.split('\n')[0] || ''
    return {
      translatedText: body,
      title: firstLine.length < 120 ? firstLine : firstLine.slice(0, 100),
      systemLog: 'SAME_LANG',
      meta: { wordCount: countWords(body) },
    }
  }

  try {
    const chunks = splitIntoChunks(text.trim(), 400)
    const translated = await Promise.all(
      chunks.map((c) => translateOneChunk(c, targetLang, sourceLang))
    )
    const translatedText = translated.join('\n\n')
    const firstLine = translatedText.split('\n')[0] || ''
    const title = firstLine.length < 150 ? firstLine : firstLine.slice(0, 120)

    return {
      translatedText,
      title,
      systemLog: 'GEMINI_GROQ_OK',
      meta: { wordCount: countWords(translatedText), chunks: chunks.length },
    }
  } catch (err: any) {
    console.error('[TRANSLATION] Failed:', err.message)
    // Fallback: return source text
    const body = text.trim()
    return {
      translatedText: body,
      title: body.split('\n')[0]?.slice(0, 100) || '',
      systemLog: `TRANSLATION_ERROR: ${err.message}`,
      meta: { wordCount: countWords(body) },
    }
  }
}

export async function translatePlainText(params: {
  text: string
  targetLang: string
  sourceLang?: string
}) {
  const { text, targetLang, sourceLang = 'en' } = params
  if (targetLang === sourceLang) {
    return { translatedText: text.trim(), systemLog: 'SAME_LANG', meta: { wordCount: countWords(text) } }
  }
  try {
    const result = await translateOneChunk(text.trim(), targetLang, sourceLang)
    return { translatedText: result, systemLog: 'GEMINI_GROQ_OK', meta: { wordCount: countWords(result) } }
  } catch (err: any) {
    return { translatedText: text.trim(), systemLog: `TRANSLATION_ERROR: ${err.message}`, meta: { wordCount: countWords(text) } }
  }
}
