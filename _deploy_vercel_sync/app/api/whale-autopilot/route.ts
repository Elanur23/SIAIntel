/**
 * 🐋 SIA WHALE AUTOPILOT v2.0
 * ────────────────────────────────────────────────────
 * Admin panelden "Start Whale Autopilot" ile aktif edilir.
 * Feed'den haberleri alır → AI ile makale yazar → DB'ye kaydeder.
 * Tamamen otonom çalışır, müdahale gerektirmez.
 * 
 * v2.0: globalThis ile state persistence — Next.js HMR/module reload sorunları çözüldü
 */

import { NextRequest, NextResponse } from 'next/server'
import { saveArticle, updateArticle, findDuplicateArticle } from '@/lib/warroom/database'
import { buildArticleSeoPackage, buildArticleSummary } from '@/lib/warroom/article-seo'
import { buildSocialMediaPackage } from '@/lib/warroom/social-media'
import { applyLegalShield } from '@/lib/compliance/legal-enforcer'
import { transformHeadline } from '@/lib/content/title-transformer'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 dakika timeout (serverless)

// ═══ AUTOPILOT STATE — globalThis ile kalıcı (HMR/module reload'a dayanıklı) ═══
interface AutopilotState {
  active: boolean
  startedAt: number | null
  totalGenerated: number
  totalFailed: number
  totalSkipped: number
  currentItem: string | null
  lastActivity: number | null
  logs: string[]
  intervalId: ReturnType<typeof setInterval> | null
  processedTitles: Set<string>
  cycleRunning: boolean
}

const GLOBAL_KEY = '__SIA_WHALE_AUTOPILOT__'

function getState(): AutopilotState {
  if (!(globalThis as any)[GLOBAL_KEY]) {
    (globalThis as any)[GLOBAL_KEY] = {
      active: false,
      startedAt: null,
      totalGenerated: 0,
      totalFailed: 0,
      totalSkipped: 0,
      currentItem: null,
      lastActivity: null,
      logs: [],
      intervalId: null,
      processedTitles: new Set(),
      cycleRunning: false
    }
  }
  return (globalThis as any)[GLOBAL_KEY]
}

const MAX_LOGS = 50
const CYCLE_INTERVAL_MS = 3 * 60 * 1000 // 3 dakikada bir döngü
const LANGUAGES = ['tr', 'en'] // Otopilot ana diller

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  if (process.env.NODE_ENV === 'production') return 'https://siaintel.com'
  return 'http://localhost:3000'
}

function addLog(msg: string) {
  const state = getState()
  const ts = new Date().toLocaleTimeString('tr-TR', { hour12: false })
  const entry = `[${ts}] ${msg}`
  state.logs.unshift(entry)
  if (state.logs.length > MAX_LOGS) state.logs.length = MAX_LOGS
  console.log(`[🐋 Autopilot] ${msg}`)
}

// ═══ CORE: Tek bir haber için tam döngü ═══
async function processOneArticle(newsItem: { title: string; content: string; titleEn?: string; titleTr?: string; contentEn?: string; contentTr?: string; id?: string }) {
  const state = getState()
  const baseUrl = getBaseUrl()

  const rawTitle = newsItem.titleEn || newsItem.title || ''
  const rawContent = newsItem.contentEn || newsItem.content || ''

  if (!rawTitle || !rawContent || rawContent.length < 20) {
    addLog(`⏭️ Atlandı (içerik çok kısa): ${rawTitle.slice(0, 50)}`)
    state.totalSkipped++
    return false
  }

  // Duplicate kontrolü (başlık bazlı)
  const normalizedTitle = rawTitle.toLowerCase().trim()
  if (state.processedTitles.has(normalizedTitle)) {
    addLog(`⏭️ Zaten işlendi: ${rawTitle.slice(0, 50)}`)
    state.totalSkipped++
    return false
  }

  // DB duplicate kontrolü
  const dupCheck = await findDuplicateArticle({
    en: rawTitle,
    tr: newsItem.titleTr || rawTitle
  })
  if (dupCheck.isDuplicate) {
    addLog(`⏭️ DB'de mevcut: ${rawTitle.slice(0, 50)}`)
    state.processedTitles.add(normalizedTitle)
    state.totalSkipped++
    return false
  }

  state.currentItem = rawTitle.slice(0, 60)
  addLog(`🔄 İşleniyor: ${rawTitle.slice(0, 60)}`)

  const results: Record<string, { title: string; content: string }> = {}

  for (const lang of LANGUAGES) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 120000) // 2 dakika timeout

      const res = await fetch(`${baseUrl}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: rawContent,
          targetLang: lang,
          newsTitle: rawTitle,
          sourceLang: 'en'
        }),
        signal: controller.signal
      })
      clearTimeout(timeout)

      const data = await res.json().catch(() => ({}))
      if (data.success && data.translatedText) {
        const headline = transformHeadline(data.title || rawTitle, lang as 'tr' | 'en')
        const content = applyLegalShield(data.translatedText, lang)
        results[lang] = { title: headline, content }
        addLog(`✅ ${lang.toUpperCase()}: ${data.meta?.wordCount || '?'} kelime (${data.systemLog || 'unknown'})`)
      } else {
        addLog(`⚠️ ${lang.toUpperCase()} üretim başarısız: ${data.error || 'unknown'}`)
      }
    } catch (err: any) {
      addLog(`❌ ${lang.toUpperCase()} hata: ${err?.message || 'network error'}`)
    }

    // Rate limit koruma: diller arası 2s bekle
    if (LANGUAGES.indexOf(lang) < LANGUAGES.length - 1) {
      await new Promise(r => setTimeout(r, 2000))
    }
  }

  // En az 1 dil başarılı olmalı
  if (Object.keys(results).length === 0) {
    addLog(`❌ Tüm diller başarısız: ${rawTitle.slice(0, 40)}`)
    state.totalFailed++
    state.currentItem = null
    return false
  }

  // DB'ye kaydet
  try {
    const savePayload: Record<string, any> = {
      source: 'SIA_WHALE_AUTOPILOT',
      category: 'MARKET',
      imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800&auto=format&fit=crop',
      status: 'published'
    }

    if (results.tr) {
      savePayload.titleTr = results.tr.title
      savePayload.contentTr = results.tr.content
      savePayload.summaryTr = buildArticleSummary(results.tr.content, results.tr.title)
    }
    if (results.en) {
      savePayload.titleEn = results.en.title
      savePayload.contentEn = results.en.content
      savePayload.summaryEn = buildArticleSummary(results.en.content, results.en.title)
    }

    const article = await saveArticle(savePayload as any)

    // SEO paketi oluştur
    const seoPayload: Record<string, any> = { generatedAt: new Date().toISOString() }
    for (const lang of ['en', 'tr'] as const) {
      const title = lang === 'tr' ? article.titleTr : article.titleEn
      const content = lang === 'tr' ? article.contentTr : article.contentEn
      if (title && content) {
        seoPayload[lang] = buildArticleSeoPackage({
          id: article.id,
          lang,
          title,
          content,
          imageUrl: article.imageUrl || undefined,
          category: article.category || undefined,
          publishedAt: article.publishedAt.toISOString(),
        })
      }
    }

    // Social media paketi
    const socialPayload: Record<string, any> = { generatedAt: new Date().toISOString() }
    for (const lang of ['en', 'tr'] as const) {
      const title = lang === 'tr' ? article.titleTr : article.titleEn
      const summary = lang === 'tr' ? savePayload.summaryTr : savePayload.summaryEn
      const seoUrl = seoPayload[lang]?.url
      if (title && summary) {
        socialPayload[lang] = buildSocialMediaPackage({
          language: lang,
          title,
          summary,
          url: seoUrl || `/${lang}/news/pending`,
          category: article.category || undefined,
          region: article.region || undefined,
          impact: article.marketImpact || 5
        })
      }
    }

    await updateArticle(article.id, {
      socialSnippetEn: socialPayload.en?.heroSnippet,
      socialSnippetTr: socialPayload.tr?.heroSnippet,
      visualData: JSON.stringify({ seo: seoPayload, social: socialPayload })
    })

    state.processedTitles.add(normalizedTitle)
    state.totalGenerated++
    state.lastActivity = Date.now()
    addLog(`🚀 YAYINLANDI: ${results.tr?.title || results.en?.title || rawTitle.slice(0, 40)} (ID: ${article.id})`)
    return true
  } catch (err: any) {
    addLog(`❌ Kayıt hatası: ${err?.message || 'DB error'}`)
    state.totalFailed++
    return false
  } finally {
    state.currentItem = null
  }
}

// ═══ AUTOPILOT DÖNGÜSÜ ═══
async function runCycle() {
  const state = getState()
  if (!state.active) return
  if (state.cycleRunning) {
    addLog('⏳ Önceki döngü hala çalışıyor, atlanıyor...')
    return
  }

  state.cycleRunning = true
  addLog('🔄 Döngü başlatılıyor...')

  try {
    const baseUrl = getBaseUrl()

    // Önce RSS'i tazele
    try {
      await fetch(`${baseUrl}/api/war-room/refresh-rss`, { cache: 'no-store' })
    } catch (rssErr) {
      addLog(`RSS refresh failed: ${(rssErr as Error).message}`)
    }

    const feedRes = await fetch(`${baseUrl}/api/war-room/feed?lang=en`, { cache: 'no-store' })
    const feedData = await feedRes.json().catch(() => ({}))

    if (!feedData.success || !Array.isArray(feedData.data) || feedData.data.length === 0) {
      addLog('⚠️ Feed boş veya erişilemez')
      return
    }

    // Yayınlanmış başlıkları güncelle
    const publishedTitles = new Set(
      (feedData.publishedTitles || []).map((t: string) => t.toLowerCase().trim())
    )

    // Sıralama: priority yüksek olanlar önce
    const sortedFeed = feedData.data
      .filter((item: any) => {
        const title = (item.titleEn || item.title || '').toLowerCase().trim()
        return title && !publishedTitles.has(title) && !state.processedTitles.has(title)
      })
      .sort((a: any, b: any) => (b.priority || 5) - (a.priority || 5))

    if (sortedFeed.length === 0) {
      addLog('✅ Tüm haberler zaten işlenmiş — bekleme modunda')
      return
    }

    addLog(`📰 ${sortedFeed.length} yeni haber bulundu`)

    // Tek döngüde max 3 makale üret (API yükünü kontrol altında tut)
    const maxPerCycle = 3
    let processed = 0

    for (const item of sortedFeed) {
      if (!state.active) break // Durdurulmuşsa çık
      if (processed >= maxPerCycle) {
        addLog(`⏸️ Döngü limiti (${maxPerCycle}) doldu, sonraki döngüye bırakılıyor`)
        break
      }
      await processOneArticle(item)
      processed++

      // Makaleler arası 5s bekle (rate limit koruma)
      if (processed < maxPerCycle && state.active) {
        await new Promise(r => setTimeout(r, 5000))
      }
    }
  } catch (err: any) {
    addLog(`❌ Döngü hatası: ${err?.message || 'unknown'}`)
  } finally {
    state.cycleRunning = false
  }
}

function startAutopilot() {
  const state = getState()
  if (state.active) return

  // Eski interval varsa temizle (orphan timer'ları önle)
  if (state.intervalId) {
    clearInterval(state.intervalId)
    state.intervalId = null
  }

  state.active = true
  state.startedAt = Date.now()
  state.processedTitles.clear()
  state.cycleRunning = false
  addLog('🐋 WHALE AUTOPILOT AKTİF!')

  // İlk döngüyü hemen çalıştır (fire-and-forget, catch ile güvenli)
  runCycle().catch(err => {
    addLog(`❌ İlk döngü hatası: ${err?.message || 'unknown'}`)
  })

  // Sonraki döngüler interval ile
  state.intervalId = setInterval(() => {
    const s = getState()
    if (s.active) {
      runCycle().catch(err => {
        addLog(`❌ Interval döngü hatası: ${err?.message || 'unknown'}`)
      })
    }
  }, CYCLE_INTERVAL_MS)
}

function stopAutopilot() {
  const state = getState()
  state.active = false
  if (state.intervalId) {
    clearInterval(state.intervalId)
    state.intervalId = null
  }
  state.currentItem = null
  state.cycleRunning = false
  addLog('🛑 WHALE AUTOPILOT DURDURULDU')
}

// ═══ API ENDPOINTS ═══

export async function GET() {
  const state = getState()
  const uptime = state.startedAt ? Math.floor((Date.now() - state.startedAt) / 1000) : 0
  const hours = Math.floor(uptime / 3600)
  const minutes = Math.floor((uptime % 3600) / 60)

  return NextResponse.json({
    success: true,
    autopilot: {
      active: state.active,
      startedAt: state.startedAt ? new Date(state.startedAt).toISOString() : null,
      uptime: state.active ? `${hours}h ${minutes}m` : null,
      stats: {
        totalGenerated: state.totalGenerated,
        totalFailed: state.totalFailed,
        totalSkipped: state.totalSkipped
      },
      currentItem: state.currentItem,
      lastActivity: state.lastActivity ? new Date(state.lastActivity).toISOString() : null,
      cycleInterval: `${CYCLE_INTERVAL_MS / 60000} dakika`,
      logs: state.logs.slice(0, 20)
    }
  })
}

export async function POST(request: NextRequest) {
  const state = getState()
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'start') {
      if (state.active) {
        return NextResponse.json({ success: true, message: 'Autopilot zaten aktif', active: true })
      }
      startAutopilot()
      return NextResponse.json({ success: true, message: '🐋 Whale Autopilot başlatıldı!', active: true })
    }

    if (action === 'stop') {
      stopAutopilot()
      return NextResponse.json({ success: true, message: '🛑 Whale Autopilot durduruldu', active: false })
    }

    return NextResponse.json({ success: false, error: 'Geçersiz action. Kullanım: start | stop' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
