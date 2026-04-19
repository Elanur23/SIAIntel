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
} from 'lucide-react'
import { applyLegalShield, LEGAL_CONFIG } from '@/lib/compliance/legal-enforcer'
import TechnicalChart from '@/components/TechnicalChart'

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
  // VISUAL CANARY: DO NOT REMOVE
  const canaryBanner = (
    <div
      style={{
        width: '100%',
        background: '#FF0000',
        border: '6px solid #FFD600',
        color: '#fff',
        fontWeight: 'bold',
        fontSize: '2rem',
        textTransform: 'uppercase',
        letterSpacing: '0.15em',
        padding: '2rem 0',
        textAlign: 'center',
        zIndex: 9999,
        position: 'relative',
        boxShadow: '0 0 24px 8px #FFD600',
        marginBottom: '2rem',
      }}
      data-canary="WARROOM_CANARY_V1"
    >
      WARROOM_CANARY_V1
    </div>
  )
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

    const finalContent = applyLegalShield(vault[activeLang].desc, activeLang)
    const origin = typeof window !== 'undefined' ? window.location.origin : ''

    try {
      await fetch(`${origin}/api/content-buffer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          article: {
            headline: vault[activeLang].title,
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
          savePayload[`title${suffix}`] = vault[lang].title
          savePayload[`content${suffix}`] = vault[lang].desc
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

  useEffect(() => {
    loadFeed()
  }, [])

  return (
    <div className="flex flex-col h-screen w-full bg-[radial-gradient(circle_at_top,rgba(255,184,0,0.08),transparent_38%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.08),transparent_35%),#050505] text-white font-mono text-[12px] overflow-hidden">
      {canaryBanner}
      <header className="h-12 border-b border-white/20 bg-gradient-to-r from-black/90 to-black/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50 shadow-lg shadow-black/50">
        <div className="flex items-center gap-6">
          <Shield className="w-5 h-5 text-[#FFB800] drop-shadow-[0_0_6px_rgba(255,184,0,0.6)]" />
          <h1 className="text-lg font-black italic tracking-tighter text-[#FFB800] drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]">
            SIA<span className="text-white">INTEL</span>
          </h1>
          <button
            onClick={syncFromAiWorkspace}
            disabled={isSyncingWorkspace}
            className="ml-4 flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600/35 to-blue-500/20 border border-blue-400/45 rounded-md text-xs font-black text-blue-200 hover:from-blue-500/45 hover:to-blue-400/25 hover:border-blue-300/70 transition-all uppercase disabled:opacity-50 shadow-[0_10px_24px_rgba(37,99,235,0.28)] ring-1 ring-blue-300/20"
          >
            <Database size={12} /> {isSyncingWorkspace ? 'SYNCING...' : 'SYNC WORKSPACE'}
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

      <main className="flex-1 grid grid-cols-12 gap-3 xl:gap-4 p-3 overflow-hidden min-h-0 bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505]">
        {/* LEFT: RADAR */}
        <div className="col-span-3 flex flex-col min-h-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-1">
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
        <div className="col-span-6 flex flex-col min-h-0 overflow-hidden rounded-xl border border-[#FFB800]/20 bg-gradient-to-b from-[#1a1510]/65 via-black/35 to-black/70 p-1 shadow-[0_22px_42px_rgba(0,0,0,0.55)]">
          <CyberBox title="Analysis Command Center" icon={Terminal} className="h-full border-[#FFB800]/25 ring-[#FFB800]/15">
            <div className="h-full flex flex-col p-4">
              {selectedNews ? (
                <>
                    <div className="flex items-center justify-between mb-4 shrink-0 border border-white/15 rounded-md bg-black/35 px-3 py-3 shadow-[0_8px_18px_rgba(0,0,0,0.35)]">
                    <div className="flex bg-black/70 border border-white/20 rounded-md overflow-hidden p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <button
                        onClick={() => setViewMode('edit')}
                        className={`px-5 py-2.5 text-sm font-black uppercase rounded-sm transition-all ${viewMode === 'edit' ? 'bg-[#FFB800] text-black shadow-[0_8px_16px_rgba(255,184,0,0.25)] ring-1 ring-[#FFB800]/40' : 'text-white/55 hover:text-white/85'}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`px-5 py-2.5 text-sm font-black uppercase rounded-sm transition-all ${viewMode === 'preview' ? 'bg-[#FFB800] text-black shadow-[0_8px_16px_rgba(255,184,0,0.25)] ring-1 ring-[#FFB800]/40' : 'text-white/55 hover:text-white/85'}`}
                      >
                        Preview
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePublish()}
                        disabled={isPublishing || !activeDraft.ready}
                        className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FFB800] to-[#FFD35A] text-black font-black uppercase text-sm rounded-md hover:from-[#FFC524] hover:to-[#FFD86D] disabled:opacity-20 shadow-[0_12px_24px_rgba(255,184,0,0.28)] ring-1 ring-[#FFB800]/50 transition-all"
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
                    <div className="flex-1 flex flex-col gap-4 min-h-0">
                        <input
                          value={activeDraft.title}
                          onChange={(e) =>
                            setVault({
                              ...vault,
                              [activeLang]: { ...activeDraft, title: e.target.value },
                            })
                          }
                          className="w-full bg-black/70 border border-white/20 p-4 text-lg font-bold text-[#FFB800] outline-none shrink-0 rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-[#FFB800]/50 transition-colors"
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
                          className="flex-1 bg-black/70 border border-white/20 p-5 outline-none resize-none text-[15px] leading-7 custom-scrollbar font-sans text-white/95 rounded-md shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] focus:border-[#FFB800]/50 transition-colors"
                          placeholder="ENTER INTELLIGENCE DATA..."
                        />
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-gradient-to-b from-black/70 to-black/60 border border-white/20 rounded-md space-y-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
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
                        <h1 className="text-3xl font-black text-white leading-tight uppercase italic tracking-tighter drop-shadow-lg">
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
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-white/25 p-12 bg-gradient-to-b from-[#17100a]/55 via-black/45 to-black/70 border border-dashed border-[#FFB800]/30 rounded-md">
                  <Activity size={72} className="mb-8 opacity-45 drop-shadow-[0_0_16px_rgba(255,184,0,0.18)]" />
                  <p className="uppercase font-black tracking-[0.14em] text-base text-center mb-3 text-white/45">
                    Awaiting Intelligence Signal
                  </p>
                  <p className="text-sm text-white/25 text-center font-medium max-w-xs leading-relaxed">
                    Select a news item from the radar to begin analysis
                  </p>
                </div>
              )}
            </div>
          </CyberBox>
        </div>

        {/* RIGHT: STATUS & NODES */}
        <div className="col-span-3 flex flex-col gap-3 min-h-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-1">
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
