'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Loader2,
  Radio,
  Zap,
  Terminal,
  RefreshCw,
  Globe2,
  Eye,
  Edit3,
  Shield,
  Activity,
  Image as ImageIcon,
  Send,
  Lock,
  ChevronRight,
  AlertCircle,
  Search,
  Copy,
  Languages,
  X,
  Star,
  Link2,
  Waves,
  Square,
  Play,
  Database,
  Wand2,
} from 'lucide-react'
import { applyLegalShield, LEGAL_CONFIG } from '@/lib/compliance/legal-enforcer'
import TechnicalChart from '@/components/TechnicalChart'
import { transformRawToArticle, type FormattedArticle } from '@/lib/editorial/transform-raw-to-article'

// Fallback implementations for missing dependencies
type ScoredFeedItem = { item: any; score: number }

function rankFeed(feed: any[], publishedTitles: string[]): ScoredFeedItem[] {
  return feed.map((item) => ({ item, score: 10 }))
}

function transformHeadline(title: string): string {
  return title
}

function cleanSystemArtifacts(text: string): string {
  return text
}

function formatArticleBody(body: string, lang: string): string {
  return body.replace(/\n/g, '<br />')
}

const SUPPORTED_LANGS = ['en', 'de', 'es', 'fr', 'ru', 'ar', 'jp', 'zh', 'tr'] as const
type SupportedLang = (typeof SUPPORTED_LANGS)[number]

const LANGUAGE_LABELS: Record<string, string> = {
  en: 'English',
  tr: 'Turkish',
  de: 'German',
  es: 'Spanish',
  fr: 'French',
  ru: 'Russian',
  ar: 'Arabic',
  jp: 'Japanese',
  zh: 'Chinese',
}

const CATEGORY_OPTIONS = ['MARKET', 'AI', 'CRYPTO', 'STOCKS', 'ECONOMY'] as const

function getLangFieldSuffix(lang: string): string {
  const normalized = (lang || '').toLowerCase()
  const map: Record<string, string> = {
    en: 'En',
    tr: 'Tr',
    de: 'De',
    es: 'Es',
    fr: 'Fr',
    ru: 'Ru',
    ar: 'Ar',
    jp: 'Jp',
    zh: 'Zh',
  }
  return map[normalized] || 'En'
}

function LiveClock() {
  const [dt, setDt] = useState<{ date: string; time: string } | null>(null)
  useEffect(() => {
    const update = () =>
      setDt({
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString('en-US', { hour12: false }),
      })
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])
  return (
    <span suppressHydrationWarning className="tabular-nums font-bold text-white/80">
      {dt ? `${dt.date} // ${dt.time}` : '– // –:–:–'}
    </span>
  )
}

function CyberBox({
  title,
  icon: Icon,
  children,
  className = '',
}: {
  title: string
  icon: any
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={`border border-white/15 bg-gradient-to-b from-[#151920]/92 via-[#0d1016]/92 to-[#080a0e]/95 backdrop-blur-md flex flex-col min-h-0 overflow-hidden rounded-lg ring-1 ring-white/10 shadow-[0_18px_34px_rgba(0,0,0,0.5)] ${className}`}
    >
      <div className="border-b border-white/15 px-4 py-3 flex items-center justify-between bg-gradient-to-r from-white/12 via-white/7 to-white/4 shrink-0">
        <div className="flex items-center gap-2">
          {Icon && <Icon size={14} className="text-[#FFB800] drop-shadow-[0_0_4px_rgba(255,184,0,0.5)]" />}
          <span className="text-xs font-black uppercase tracking-wider text-white/80">
            {title}
          </span>
        </div>
        <div className="flex gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-[#FFB800]/30" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar">{children}</div>
    </div>
  )
}

export default function WarRoom() {
  const [newsFeed, setNewsFeed] = useState<any[]>([])
  const [selectedNews, setSelectedNews] = useState<any>(null)
  const [activeLang, setActiveLang] = useState<SupportedLang>('en')
  const [feedQuery, setFeedQuery] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isSyncingWorkspace, setIsSyncingWorkspace] = useState(false)
  const [publishCategory, setPublishCategory] = useState('MARKET')
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit')
  const lockRef = useRef<string | null>(null)
  const [publishedTitles, setPublishedTitles] = useState<string[]>([])
  const [transformedArticle, setTransformedArticle] = useState<FormattedArticle | null>(null)
  const [isTransforming, setIsTransforming] = useState(false)
  const [transformError, setTransformError] = useState<string | null>(null)

  const [vault, setVault] = useState<
    Record<string, { title: string; desc: string; ready: boolean }>
  >({
    tr: { title: '', desc: '', ready: false },
    en: { title: '', desc: '', ready: false },
    fr: { title: '', desc: '', ready: false },
    de: { title: '', desc: '', ready: false },
    es: { title: '', desc: '', ready: false },
    ru: { title: '', desc: '', ready: false },
    ar: { title: '', desc: '', ready: false },
    jp: { title: '', desc: '', ready: false },
    zh: { title: '', desc: '', ready: false },
  })

  const activeDraft = vault[activeLang] || { title: '', desc: '', ready: false }

  const activeWordCount = useMemo(() => {
    const body = (activeDraft.desc || '').trim()
    return body ? body.split(/\s+/).filter(Boolean).length : 0
  }, [activeDraft.desc])

  const scoredFeed: ScoredFeedItem[] = useMemo(
    () => rankFeed(newsFeed, publishedTitles),
    [newsFeed, publishedTitles]
  )
  const filteredFeed = useMemo(() => {
    let items = scoredFeed
    const query = feedQuery.trim().toLowerCase()
    if (query)
      items = items.filter(({ item }) =>
        `${item.title} ${item.content}`.toLowerCase().includes(query)
      )
    return items
  }, [scoredFeed, feedQuery])

  const loadFeed = async () => {
    try {
      const base = typeof window !== 'undefined' ? window.location.origin : ''
      const r = await fetch(`${base}/api/war-room/feed?lang=en`, { cache: 'no-store' })
      const d = await r.json()
      if (d.success) {
        setNewsFeed(d.data)
        if (d.publishedTitles) setPublishedTitles(d.publishedTitles)
      }
    } catch (feedErr) {
      console.warn('[WARROOM] Feed load failed:', (feedErr as Error).message)
    }
  }

  const syncFromAiWorkspace = async () => {
    setIsSyncingWorkspace(true)
    try {
      const res = await fetch('/api/war-room/workspace')
      const data = await res.json()
      if (data.success && data.data) {
        // Normalize workspace source: support both nested (articles[0]) and top-level structures
        const ws = data.data.articles?.[0] || data.data
        const newVault = { ...vault }

        let hydrationCount = 0
        SUPPORTED_LANGS.forEach((lang) => {
          if (ws[lang]) {
            newVault[lang] = {
              title: ws[lang].title,
              desc: ws[lang].content || ws[lang].desc || '',
              ready: true,
            }
            hydrationCount++
          }
        })

        // Only proceed if at least one language was hydrated
        if (hydrationCount > 0) {
          setVault(newVault)
          // FORCE IMAGE SYNC
          const img = ws.imageUrl || ws.en?.imageUrl || null
          setImageUrl(img)

          if (!selectedNews)
            setSelectedNews({ id: 'workspace_sync', title: ws.en?.title || 'AI Sync Node' })
          alert('✅ SYSTEM SYNCED: All nodes and Visuals operational.')
        } else {
          alert('❌ SYNC_FAILED: No valid language data found in workspace')
        }
      }
    } catch (e: any) {
      alert('❌ SYNC_FAILED: ' + e.message)
    } finally {
      setIsSyncingWorkspace(false)
    }
  }

  const handlePublish = async (forceOverride = false) => {
    if (!selectedNews || !vault[activeLang].ready) return
    setIsPublishing(true)

    // Use transformed article body if available, otherwise fall back to raw vault content
    const deployTitle = transformedArticle ? transformedArticle.headline : vault[activeLang].title
    const deployBody = transformedArticle
      ? [
          transformedArticle.summary,
          transformedArticle.body,
          transformedArticle.keyInsights.length
            ? '**Key Insights:**\n' + transformedArticle.keyInsights.map((i) => `• ${i}`).join('\n')
            : '',
          transformedArticle.riskNote ? `*${transformedArticle.riskNote}*` : '',
        ]
          .filter(Boolean)
          .join('\n\n')
      : vault[activeLang].desc

    const finalContent = applyLegalShield(deployBody, activeLang)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    try {
      await fetch(`${origin}/api/content-buffer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          article: {
            headline: deployTitle,
            fullContent: finalContent,
            imageUrl: imageUrl ?? undefined,
            language_code: activeLang,
            source: 'SIA_WAR_ROOM',
            category: publishCategory,
          },
        }),
      })

      const savePayload: Record<string, any> = {
        imageUrl: imageUrl ?? undefined,
        source: 'SIA_WAR_ROOM',
        category: publishCategory,
        status: 'published',
      }

      // Add forceSave flag if override requested
      if (forceOverride) {
        savePayload.forceSave = true
      }

      SUPPORTED_LANGS.forEach((lang) => {
        if (vault[lang].ready) {
          const suffix = getLangFieldSuffix(lang)
          // For the active language, use transformed title if available
          const titleToSave = (lang === activeLang && transformedArticle)
            ? transformedArticle.headline
            : vault[lang].title
          const contentToSave = (lang === activeLang && transformedArticle)
            ? finalContent
            : vault[lang].desc
          savePayload[`title${suffix}`] = titleToSave
          savePayload[`content${suffix}`] = contentToSave
        }
      })

      const saveRes = await fetch(`/api/war-room/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savePayload),
      })

      const saveData = await saveRes.json()

      // Handle duplicate detection (409 Conflict)
      if (saveRes.status === 409 && saveData.duplicate) {
        setIsPublishing(false)
        const matchedTitle = saveData.matchedTitle || 'Unknown article'
        const confirmMsg = `⚠️ DUPLICATE DETECTED\n\nAn article with a similar title already exists:\n"${matchedTitle}"\n\nPublish anyway?`
        
        if (window.confirm(confirmMsg)) {
          // Retry with forceSave flag
          return handlePublish(true)
        }
        return // User cancelled
      }

      // Handle other errors
      if (!saveRes.ok || !saveData.success) {
        alert(`❌ PUBLISH FAILED: ${saveData.error || 'Unknown error'}`)
        return
      }

      // Success
      alert(`🚀 GLOBAL DEPLOY SUCCESS: ${activeLang.toUpperCase()}`)
      await loadFeed()
    } catch (publishErr) {
      console.error('[WARROOM] Publish failed:', (publishErr as Error).message)
      alert(`❌ PUBLISH FAILED: ${(publishErr as Error).message}`)
    } finally {
      setIsPublishing(false)
    }
  }

  const selectNews = (news: any) => {
    setSelectedNews(news)
    setImageUrl(null)
    setTransformedArticle(null)
    setTransformError(null)

    // Fix: Populate vault with news content to enable center panel rendering
    const resetVault: any = {}
    SUPPORTED_LANGS.forEach((l) => {
      resetVault[l] = {
        title: news.titleEn || news.title || '',
        desc: news.contentEn || news.content || '',
        ready: !!(news.contentEn || news.content),
      }
    })
    setVault(resetVault)
    setActiveLang('en')
  }

  const handleTransform = async () => {
    const raw = activeDraft.desc || ''
    if (!raw.trim()) return
    setIsTransforming(true)
    setTransformError(null)
    try {
      const result = await transformRawToArticle(raw)
      setTransformedArticle(result)
    } catch (err: any) {
      console.error('[WARROOM] Transform failed:', err)
      setTransformError(err?.message || 'Transform failed. Raw content preserved.')
    } finally {
      setIsTransforming(false)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [])

  return (
    <div className="flex flex-col h-screen w-full bg-gradient-to-br from-[#0a0a0f] via-[#18181c] to-[#0a0a0f] text-white font-mono text-[13px] overflow-hidden">
      <header className="h-14 border-b border-[#23232a] bg-gradient-to-r from-[#18181c]/95 to-[#23232a]/90 backdrop-blur-md flex items-center justify-between px-8 shrink-0 z-50 shadow-lg shadow-black/60">
        <div className="flex items-center gap-6">
          <Shield className="w-5 h-5 text-[#FFB800] drop-shadow-[0_0_6px_rgba(255,184,0,0.6)]" />
          <h1 className="text-2xl font-black italic tracking-tight text-[#FFB800] drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]">
            SIA<span className="text-white">INTEL</span>
          </h1>
          <button
            onClick={syncFromAiWorkspace}
            disabled={isSyncingWorkspace}
            className="ml-6 flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-700/80 to-blue-500/70 border-2 border-blue-400/60 rounded-lg text-sm font-black text-blue-100 hover:from-blue-600/90 hover:to-blue-400/80 hover:border-blue-200/80 transition-all uppercase disabled:opacity-50 shadow-[0_8px_18px_rgba(37,99,235,0.22)] ring-2 ring-blue-300/20 focus:outline-none focus:ring-4 focus:ring-blue-400/30"
            style={{letterSpacing: '0.08em'}}
          >
            <Database size={16} /> {isSyncingWorkspace ? 'SYNCING...' : 'SYNC WORKSPACE'}
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-xs text-white/60 uppercase tracking-wider font-medium">
            <div className="w-2 h-2 rounded-full bg-[#00FF00] animate-pulse shadow-[0_0_8px_#00FF00]" />
            Terminal Active // 9 Nodes
          </div>
          <LiveClock />
        </div>
      </header>

      <main className="flex-1 grid grid-cols-12 gap-5 xl:gap-8 p-6 overflow-hidden min-h-0 bg-gradient-to-br from-[#18181c] via-[#23232a] to-[#18181c]">
        {/* LEFT: RADAR */}
        <div className="col-span-3 flex flex-col min-h-0 overflow-hidden rounded-2xl border-2 border-[#23232a] bg-gradient-to-b from-[#18181c]/95 via-[#23232a]/90 to-[#18181c]/95 p-2 shadow-[0_4px_32px_0_rgba(0,0,0,0.18)]">
          <CyberBox
            title={`Intelligence Radar (${newsFeed.length})`}
            icon={Radio}
            className="h-full"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 bg-black/65 border border-white/15 rounded-md px-3 py-3 mb-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                <Search size={14} className="text-white/40" />
                <input
                  value={feedQuery}
                  onChange={(e) => setFeedQuery(e.target.value)}
                  placeholder="Search radar..."
                  className="bg-transparent border-none outline-none text-sm w-full text-white/90 uppercase placeholder:text-white/30"
                />
              </div>
              {filteredFeed.map(({ item: news }) => (
                <div
                  key={news.id}
                  onClick={() => selectNews(news)}
                  className={`p-4 border transition-all cursor-pointer rounded-md ${selectedNews?.id === news.id ? 'border-[#FFB800]/80 bg-gradient-to-r from-[#FFB800]/20 to-[#FFB800]/8 shadow-[0_10px_22px_rgba(255,184,0,0.18)]' : 'border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] hover:from-white/[0.09] hover:to-white/[0.04] hover:border-white/30'}`}
                >
                  <p className="text-[13px] font-semibold leading-relaxed line-clamp-2 uppercase tracking-tight text-white/92">
                    {news.title}
                  </p>
                </div>
              ))}
            </div>
          </CyberBox>
        </div>

        {/* MIDDLE: EDITOR & PREVIEW */}
        <div className="col-span-6 flex flex-col min-h-0 overflow-hidden rounded-2xl border-4 border-[#FFB800]/40 bg-gradient-to-b from-[#23232a]/98 via-[#18181c]/95 to-[#23232a]/98 p-2 shadow-[0_8px_48px_0_rgba(255,184,0,0.10)] ring-2 ring-[#FFB800]/10">
          <CyberBox title="Analysis Command Center" icon={Terminal} className="h-full border-[#FFB800]/30 ring-[#FFB800]/10">
            <div className="h-full flex flex-col p-8">
              {selectedNews ? (
                <>
                    <div className="flex items-center justify-between mb-6 shrink-0 border-2 border-[#23232a] rounded-lg bg-gradient-to-r from-[#23232a]/90 to-[#18181c]/90 px-4 py-4 shadow-[0_4px_18px_rgba(255,184,0,0.10)]">
                    <div className="flex bg-[#18181c]/90 border-2 border-[#23232a] rounded-md overflow-hidden p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <button
                        onClick={() => setViewMode('edit')}
                        className={`px-6 py-2.5 text-base font-black uppercase rounded-md transition-all tracking-wide ${viewMode === 'edit' ? 'bg-[#FFB800] text-black shadow-[0_8px_16px_rgba(255,184,0,0.18)] ring-2 ring-[#FFB800]/40' : 'text-white/60 hover:text-white/90'}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`px-6 py-2.5 text-base font-black uppercase rounded-md transition-all tracking-wide ${viewMode === 'preview' ? 'bg-[#FFB800] text-black shadow-[0_8px_16px_rgba(255,184,0,0.18)] ring-2 ring-[#FFB800]/40' : 'text-white/60 hover:text-white/90'}`}
                      >
                        Preview
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleTransform}
                        disabled={isTransforming || !activeDraft.desc}
                        title="Transform raw report into a formatted article using AI"
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-700/80 to-purple-500/70 border-2 border-purple-400/60 rounded-lg text-sm font-black text-purple-100 hover:from-purple-600/90 hover:to-purple-400/80 hover:border-purple-200/80 transition-all uppercase disabled:opacity-40 shadow-[0_8px_18px_rgba(147,51,234,0.22)] ring-2 ring-purple-300/20 focus:outline-none focus:ring-4 focus:ring-purple-400/30"
                        style={{ letterSpacing: '0.08em' }}
                      >
                        {isTransforming ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Wand2 size={14} />
                        )}
                        {isTransforming ? 'Transforming...' : transformedArticle ? 'Re-Transform' : 'Transform to Article'}
                      </button>
                      <button
                        onClick={() => handlePublish()}
                        disabled={isPublishing || !activeDraft.ready}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#FFB800] to-[#FFD35A] text-black font-black uppercase text-base rounded-lg hover:from-[#FFC524] hover:to-[#FFD86D] disabled:opacity-20 shadow-[0_8px_18px_rgba(255,184,0,0.18)] ring-2 ring-[#FFB800]/40 transition-all focus:outline-none focus:ring-4 focus:ring-[#FFB800]/30"
                      >
                        {isPublishing ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={14} />
                        )}{' '}
                        Deploy
                      </button>
                    </div>
                  </div>

                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                    {viewMode === 'edit' ? (
                    <div className="flex-1 flex flex-col gap-6 min-h-0">
                        <input
                          value={activeDraft.title}
                          onChange={(e) =>
                            setVault({
                              ...vault,
                              [activeLang]: { ...activeDraft, title: e.target.value },
                            })
                          }
                          className="w-full bg-[#23232a]/90 border-2 border-[#FFB800]/30 p-5 text-2xl font-black text-[#FFB800] outline-none shrink-0 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-[#FFB800]/60 transition-colors tracking-tight"
                          placeholder="ENTER HEADLINE..."
                        />

                        {/* Edit Mode Mini Preview */}
                        {imageUrl && (
                          <div className="relative h-28 w-full rounded-md overflow-hidden border border-white/15 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-help shrink-0 shadow-lg">
                            <Image
                              src={imageUrl}
                              alt="Haber Görseli"
                              fill
                              className="object-cover"
                              unoptimized
                            />
                            <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white uppercase tracking-wider bg-black/50 backdrop-blur-sm">
                              ACTIVE_VISUAL_LOCKED
                            </div>
                          </div>
                        )}

                        <textarea
                          value={activeDraft.desc}
                          onChange={(e) =>
                            setVault({
                              ...vault,
                              [activeLang]: {
                                ...activeDraft,
                                desc: e.target.value,
                                ready: !!e.target.value,
                              },
                            })
                          }
                          className="flex-1 bg-[#18181c]/90 border-2 border-[#FFB800]/20 p-6 outline-none resize-none text-[16px] leading-7 custom-scrollbar font-sans text-white/95 rounded-lg shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-[#FFB800]/40 transition-colors"
                          placeholder="ENTER INTELLIGENCE DATA..."
                        />
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-gradient-to-b from-[#18181c]/95 to-[#23232a]/90 border-2 border-[#FFB800]/20 rounded-lg space-y-10 shadow-[0_2px_24px_rgba(255,184,0,0.08)]">
                        {imageUrl && (
                          <div className="relative aspect-video w-full rounded-md overflow-hidden border border-white/20 shadow-2xl">
                            <Image
                              src={imageUrl}
                              alt="Preview"
                              fill
                              className="object-cover opacity-90"
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                          </div>
                        )}

                        {/* Transform error banner */}
                        {transformError && (
                          <div className="flex items-center gap-3 px-4 py-3 bg-red-900/30 border border-red-500/40 rounded-lg text-red-300 text-sm font-medium">
                            <AlertCircle size={14} className="shrink-0" />
                            <span>{transformError} — showing raw content.</span>
                          </div>
                        )}

                        {transformedArticle ? (
                          /* ── FORMATTED ARTICLE PREVIEW ── */
                          <>
                            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-purple-400 opacity-80">
                              <Wand2 size={12} /> Transformed Article
                            </div>
                            <h1 className="text-4xl font-black text-white leading-tight uppercase italic tracking-tight drop-shadow-lg mb-2">
                              {transformedArticle.headline}
                            </h1>
                            {transformedArticle.subheadline && (
                              <p className="text-lg text-white/70 font-semibold leading-snug">
                                {transformedArticle.subheadline}
                              </p>
                            )}
                            {transformedArticle.summary && (
                              <p className="text-base text-white/60 italic border-l-2 border-purple-500/50 pl-4">
                                {transformedArticle.summary}
                              </p>
                            )}

                            {/* 🔥 DYNAMIC CHART PREVIEW */}
                            <TechnicalChart
                              articleBody={transformedArticle.body}
                              category={publishCategory}
                              lang={activeLang}
                            />

                            <div
                              className="prose prose-invert prose-sm max-w-none text-white/85 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: formatArticleBody(transformedArticle.body, activeLang),
                              }}
                            />
                            {transformedArticle.keyInsights.length > 0 && (
                              <div className="border border-purple-500/30 bg-purple-900/10 rounded-lg p-5 space-y-2">
                                <p className="text-xs font-black uppercase tracking-widest text-purple-400">Key Insights</p>
                                <ul className="space-y-1.5">
                                  {transformedArticle.keyInsights.map((insight, i) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-white/80">
                                      <span className="text-purple-400 mt-0.5 shrink-0">•</span>
                                      {insight}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {transformedArticle.riskNote && (
                              <p className="text-xs text-white/40 italic border-t border-white/10 pt-4">
                                {transformedArticle.riskNote}
                              </p>
                            )}
                          </>
                        ) : (
                          /* ── RAW REPORT FALLBACK PREVIEW ── */
                          <>
                            <h1 className="text-4xl font-black text-white leading-tight uppercase italic tracking-tight drop-shadow-lg mb-4">
                              {activeDraft.title}
                            </h1>

                            {/* 🔥 DYNAMIC CHART PREVIEW */}
                            <TechnicalChart
                              articleBody={activeDraft.desc}
                              category={publishCategory}
                              lang={activeLang}
                            />

                            <div
                              className="prose prose-invert prose-sm max-w-none text-white/85 leading-relaxed"
                              dangerouslySetInnerHTML={{
                                __html: formatArticleBody(activeDraft.desc, activeLang),
                              }}
                            />
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-white/30 p-16 bg-gradient-to-b from-[#23232a]/80 via-[#18181c]/90 to-[#23232a]/80 border-4 border-dashed border-[#FFB800]/30 rounded-2xl shadow-[0_2px_24px_rgba(255,184,0,0.08)]">
                  <Activity size={80} className="mb-10 opacity-50 drop-shadow-[0_0_24px_rgba(255,184,0,0.18)]" />
                  <p className="uppercase font-black tracking-[0.18em] text-xl text-center mb-4 text-white/60">
                    Awaiting Intelligence Signal
                  </p>
                  <p className="text-base text-white/30 text-center font-medium max-w-xs leading-relaxed">
                    Select a news item from the radar to begin analysis
                  </p>
                </div>
              )}
            </div>
          </CyberBox>
        </div>

        {/* RIGHT: STATUS & NODES */}
        <div className="col-span-3 flex flex-col gap-5 min-h-0 overflow-hidden rounded-2xl border-2 border-[#23232a] bg-gradient-to-b from-[#18181c]/95 via-[#23232a]/90 to-[#18181c]/95 p-2 shadow-[0_4px_32px_0_rgba(0,0,0,0.18)]">
          <CyberBox title="Neural Language Nodes" icon={Globe2} className="shrink-0">
            <div className="p-4 grid grid-cols-2 gap-2.5">
              {SUPPORTED_LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveLang(l)}
                  className={`py-2.5 border transition-all flex items-center justify-between px-3 rounded-md ${activeLang === l ? 'border-[#FFB800]/80 bg-gradient-to-r from-[#FFB800]/24 to-[#FFB800]/10 text-[#FFB800] shadow-[0_8px_16px_rgba(255,184,0,0.18)] ring-1 ring-[#FFB800]/30' : 'border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.01] text-white/50 hover:text-white/80 hover:from-white/[0.08] hover:to-white/[0.03] hover:border-white/25'}`}
                >
                  <span className="uppercase font-black text-sm">{l}</span>
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${vault[l].ready ? 'bg-[#00FF00] shadow-[0_0_10px_#00FF00]' : 'bg-white/20'}`}
                  />
                </button>
              ))}
            </div>
          </CyberBox>

          <CyberBox title="Deploy Configuration" icon={Send} className="shrink-0">
            <div className="p-4 space-y-3">
              <label className="flex items-center justify-between gap-2 bg-white/[0.08] border border-white/20 rounded-md px-4 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.25)]">
                <span className="text-sm font-medium uppercase text-white/60 tracking-wider">
                  Target Category
                </span>
                <select
                  value={publishCategory}
                  onChange={(e) => setPublishCategory(e.target.value)}
                  className="bg-transparent border-none text-white/90 text-sm font-black uppercase outline-none cursor-pointer"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c} className="bg-black">
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <button
                onClick={() => handlePublish()}
                disabled={!activeDraft.ready || isPublishing}
                className="w-full py-5 bg-gradient-to-r from-[#FFB800] to-[#FFD35A] text-black font-black uppercase text-sm tracking-wider hover:from-[#FFC524] hover:to-[#FFD86D] transition-all flex items-center justify-center gap-3 rounded-md disabled:opacity-20 shadow-[0_14px_28px_rgba(255,184,0,0.28)] ring-1 ring-[#FFB800]/50"
              >
                {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}{' '}
                Deploy Hub
              </button>
            </div>
          </CyberBox>

          <CyberBox title="Node Metrics" icon={Activity} className="flex-1">
            <div className="p-5 space-y-4 text-sm uppercase font-bold tracking-wider">
              <div className="flex justify-between border-b border-white/10 pb-3 text-white/50">
                <span className="font-medium">Active Language:</span>{' '}
                <span className="text-white/90 font-black">{LANGUAGE_LABELS[activeLang]}</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-3 text-white/50">
                <span className="font-medium">Intelligence Load:</span>{' '}
                <span className="text-[#FFB800] font-black">{activeWordCount} Words</span>
              </div>
              <div className="flex justify-between border-b border-white/10 pb-3 text-white/50">
                <span className="font-medium">Vault Status:</span>{' '}
                <span className={activeDraft.ready ? 'text-[#00FF00] font-black drop-shadow-[0_0_4px_#00FF00]' : 'text-red-400 font-black'}>
                  {activeDraft.ready ? 'SYNCED' : 'AWAITING'}
                </span>
              </div>
              <div className="flex justify-between text-white/50">
                <span className="font-medium">Visual Locked:</span>{' '}
                <span className={imageUrl ? 'text-emerald-400 font-black' : 'text-white/25 font-medium'}>
                  {imageUrl ? 'YES' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between text-white/50">
                <span className="font-medium">Article Transform:</span>{' '}
                <span className={transformedArticle ? 'text-purple-400 font-black' : 'text-white/25 font-medium'}>
                  {isTransforming ? 'PROCESSING' : transformedArticle ? 'READY' : 'RAW'}
                </span>
              </div>
            </div>
          </CyberBox>
        </div>
      </main>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 184, 0, 0.3);
          border-radius: 10px;
          border: 1px solid rgba(255, 184, 0, 0.1);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 184, 0, 0.5);
          border-color: rgba(255, 184, 0, 0.3);
        }
      `}</style>
    </div>
  )
}
