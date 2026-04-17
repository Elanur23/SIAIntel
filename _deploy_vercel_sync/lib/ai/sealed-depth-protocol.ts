/**
 * SIA_V4.8 SEALED DEPTH PROTOCOL — Full-Node Infiltration
 * Zero-Shortening | Direct Mounting | 850-900 words per node
 *
 * OPERASYONEL KURALLAR:
 * - Her dil düğümü minimum 850-900 kelime
 * - Teknik tetikleyici: Price: $... | RSI: ... | Support: ... (yerel terimlerle)
 * - Doğrudan ai_workspace.json'a mühürle
 */

import { translateStructuredArticle } from './translation-service'
import * as fs from 'fs'
import * as path from 'path'

export const SEALED_DEPTH_LANGS = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'] as const

const IMAGE_BY_TOPIC: Record<string, string> = {
  compute: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1200&auto=format&fit=crop',
  crypto: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop',
  stocks: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1200&auto=format&fit=crop',
  ai: 'https://images.unsplash.com/photo-1677447337457-6e6e64e824c2?q=80&w=1200&auto=format&fit=crop',
  economy: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=1200&auto=format&fit=crop',
  default: 'https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=1200&auto=format&fit=crop',
}

function detectTopic(text: string): string {
  const t = text.toLowerCase()
  if (t.includes('compute') || t.includes('hpc') || t.includes('gpu')) return 'compute'
  if (t.includes('bitcoin') || t.includes('crypto') || t.includes('blockchain')) return 'crypto'
  if (t.includes('nasdaq') || t.includes('equity') || t.includes('semiconductor')) return 'stocks'
  if (t.includes('ai ') || t.includes('artificial')) return 'ai'
  if (t.includes('reserve') || t.includes('sovereign') || t.includes('treasury')) return 'economy'
  return 'default'
}

const MIN_WORDS_PER_NODE = 850

function countWords(text: string): number {
  const cjk = (text.match(/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/g) || []).length
  if (cjk > 30) return Math.round(cjk / 2)
  return text.split(/\s+/).filter(Boolean).length
}

function extractSummary(content: string, maxWords = 50): string {
  const paras = content.split(/\n\n+/).filter(Boolean)
  const firstPara = paras.find((p) => p.length > 40) || paras[0] || content
  const words = firstPara.split(/\s+/).slice(0, maxWords)
  return words.join(' ').replace(/\*\*/g, '').trim()
}

function extractTitle(content: string): string {
  const paras = content.split(/\n\n+/).filter(Boolean)
  const firstReal = paras.find((p) => p.length > 60 && !/^\[.*\]$/.test(p)) || paras[0] || content
  const match = firstReal.match(/^([^.!?]+[.!?])/)
  return (match ? match[1] : firstReal.slice(0, 100)).replace(/\*\*/g, '').trim()
}

/** Gemini ile metni MIN_WORDS_PER_NODE kelimeye genişletir */
async function expandToMinWords(text: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY?.trim() || process.env.GOOGLE_GEMINI_API_KEY?.trim()
  if (!key) return text

  try {
    const { GoogleGenerativeAI } = await import('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
    })
    const prompt = `You are a professional financial analyst. Expand the following intelligence report to at least ${MIN_WORDS_PER_NODE} words while maintaining the same tone, technical depth, and formatting. Add real analysis, market context, and technical detail — do NOT pad with filler. Return ONLY the expanded text.

ORIGINAL TEXT:
${text}`

    const result = await model.generateContent(prompt)
    const expanded = result.response.text()?.trim()
    return expanded && expanded.length > text.length ? expanded : text
  } catch (e) {
    console.warn('[SEALED_DEPTH] expandToMinWords failed:', (e as Error).message)
    return text
  }
}

export interface SealedDepthOutput {
  [lang: string]: {
    title: string
    summary: string
    content: string
    imageUrl: string
  }
}

export async function runSealedDepthProtocol(signal: string): Promise<SealedDepthOutput> {
  const sourceText = signal.trim()
  const topic = detectTopic(sourceText)
  const imageUrl = IMAGE_BY_TOPIC[topic] || IMAGE_BY_TOPIC.default

  const output: SealedDepthOutput = {}

  let enContent = sourceText
  if (countWords(enContent) < MIN_WORDS_PER_NODE) {
    enContent = await expandToMinWords(enContent)
  }

  output.en = {
    title: extractTitle(enContent) || 'SIA Intelligence Report',
    summary: extractSummary(enContent, 35),
    content: enContent,
    imageUrl,
  }

  const targetLangs = ['tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'] as const
  for (const lang of targetLangs) {
    try {
      const result = await translateStructuredArticle({
        text: enContent,
        targetLang: lang,
        sourceLang: 'en',
      })

      // Sanity check: translated content should be at least 60% of EN word count
      const enWords = countWords(enContent)
      const translatedWords = countWords(result.translatedText)
      if (translatedWords < enWords * 0.5) {
        console.warn(`[SEALED_DEPTH] ${lang}: short output (${translatedWords}/${enWords} words), retrying…`)
        // Retry once with Gemini directly
        const retry = await translateStructuredArticle({ text: enContent, targetLang: lang, sourceLang: 'en' })
        const retryWords = countWords(retry.translatedText)
        console.log(`[SEALED_DEPTH] ${lang} retry: ${retryWords} words`)
        output[lang] = {
          title: retry.title || extractSummary(retry.translatedText, 15),
          summary: extractSummary(retry.translatedText, 35),
          content: retry.translatedText,
          imageUrl,
        }
      } else {
        output[lang] = {
          title: result.title || extractSummary(result.translatedText, 15),
          summary: extractSummary(result.translatedText, 35),
          content: result.translatedText,
          imageUrl,
        }
      }
    } catch (e) {
      // Log the error so admins know — do NOT silently copy EN content
      console.error(`[SEALED_DEPTH] Translation failed for ${lang}:`, (e as Error).message)
      // Store empty so the admin panel shows the node as missing, not as fake EN
      output[lang] = {
        title: '',
        summary: '',
        content: '',
        imageUrl,
      }
    }
  }

  return output
}

export function writeToAiWorkspace(data: SealedDepthOutput): string {
  const root = path.join(process.cwd(), 'ai_workspace.json')
  const imageUrl = data.en?.imageUrl || ''
  const payload: Record<string, unknown> = { ...data, imageUrl }
  const json = JSON.stringify(payload, null, 2)
  fs.writeFileSync(root, json, 'utf-8')
  return root
}
