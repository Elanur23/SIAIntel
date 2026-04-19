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
      className={`border border-white/20 bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-sm flex flex-col min-h-0 overflow-hidden shadow-lg shadow-black/50 ${className}`}
    >
      <div className="border-b border-white/20 p-3 flex items-center justify-between bg-gradient-to-r from-white/10 to-white/5 shrink-0">
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
    <div className="flex flex-col h-screen w-full bg-[#050505] text-white font-mono text-[11px] overflow-hidden">
      <header className="h-12 border-b border-white/20 bg-gradient-to-r from-black/90 to-black/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50 shadow-lg shadow-black/50">
        <div className="flex items-center gap-6">
          <Shield className="w-5 h-5 text-[#FFB800] drop-shadow-[0_0_6px_rgba(255,184,0,0.6)]" />
          <h1 className="text-lg font-black italic tracking-tighter text-[#FFB800] drop-shadow-[0_0_8px_rgba(255,184,0,0.4)]">
            SIA<span className="text-white">INTEL</span>
          </h1>
          <button
            onClick={syncFromAiWorkspace}
            disabled={isSyncingWorkspace}
            className="ml-4 flex items-center gap-2 px-4 py-2 bg-blue-600/30 border border-blue-500/50 rounded-sm text-xs font-black text-blue-300 hover:bg-blue-600/40 hover:border-blue-400/60 transition-all uppercase disabled:opacity-50 shadow-md shadow-blue-900/30"
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

      <main className="flex-1 grid grid-cols-12 gap-2 p-2 overflow-hidden min-h-0 bg-gradient-to-br from-[#050505] via-[#0a0a0a] to-[#050505]">
        {/* LEFT: RADAR */}
        <div className="col-span-3 flex flex-col min-h-0 overflow-hidden">
          <CyberBox
            title={`Intelligence Radar (${newsFeed.length})`}
            icon={Radio}
            className="h-full"
          >
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 bg-black/60 border border-white/10 rounded-sm p-3 mb-3 shadow-inner">
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
                  className={`p-4 border transition-all cursor-pointer rounded-sm ${selectedNews?.id === news.id ? 'border-[#FFB800] bg-[#FFB800]/15 shadow-lg shadow-[#FFB800]/20' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.08] hover:border-white/20'}`}
                >
                  <p className="text-sm leading-relaxed line-clamp-2 uppercase tracking-tight text-white/90">
                    {news.title}
                  </p>
                </div>
              ))}
            </div>
          </CyberBox>
        </div>

        {/* MIDDLE: EDITOR & PREVIEW */}
        <div className="col-span-6 flex flex-col min-h-0 overflow-hidden">
          <CyberBox title="Analysis Command Center" icon={Terminal} className="h-full">
            <div className="h-full flex flex-col p-4">
              {selectedNews ? (
                <>
                    <div className="flex items-center justify-between mb-4 shrink-0 border-b border-white/10 pb-4">
                    <div className="flex bg-black/60 border border-white/20 rounded-sm overflow-hidden p-1 shadow-md">
                      <button
                        onClick={() => setViewMode('edit')}
                        className={`px-5 py-2.5 text-sm font-black uppercase transition-all ${viewMode === 'edit' ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/30' : 'text-white/50 hover:text-white/80'}`}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setViewMode('preview')}
                        className={`px-5 py-2.5 text-sm font-black uppercase transition-all ${viewMode === 'preview' ? 'bg-[#FFB800] text-black shadow-lg shadow-[#FFB800]/30' : 'text-white/50 hover:text-white/80'}`}
                      >
                        Preview
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePublish()}
                        disabled={isPublishing || !activeDraft.ready}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#FFB800] text-black font-black uppercase text-sm rounded-sm hover:bg-[#FFB800]/90 disabled:opacity-20 shadow-xl shadow-[#FFB800]/30 transition-all"
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
                          className="w-full bg-black/70 border border-white/20 p-4 text-base font-bold text-[#FFB800] outline-none shrink-0 rounded-sm shadow-inner focus:border-[#FFB800]/50 transition-colors"
                          placeholder="ENTER HEADLINE..."
                        />

                        {/* Edit Mode Mini Preview */}
                        {imageUrl && (
                          <div className="relative h-28 w-full rounded-sm overflow-hidden border border-white/10 opacity-60 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-help shrink-0 shadow-lg">
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
                          className="flex-1 bg-black/70 border border-white/20 p-5 outline-none resize-none text-sm leading-relaxed custom-scrollbar font-sans text-white/95 rounded-sm shadow-inner focus:border-[#FFB800]/50 transition-colors"
                          placeholder="ENTER INTELLIGENCE DATA..."
                        />
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-gradient-to-b from-black/70 to-black/60 border border-white/20 rounded-sm space-y-8 shadow-inner">
                        {imageUrl && (
                          <div className="relative aspect-video w-full rounded-sm overflow-hidden border border-white/20 shadow-2xl">
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
                <div className="flex-1 flex flex-col items-center justify-center text-white/25 p-12 bg-gradient-to-b from-black/40 to-black/60 border border-white/10 rounded-sm">
                  <Activity size={72} className="mb-8 opacity-40 drop-shadow-lg" />
                  <p className="uppercase font-black tracking-wider text-base text-center mb-3 text-white/30">
                    Awaiting Intelligence Signal
                  </p>
                  <p className="text-sm text-white/15 text-center font-medium max-w-xs">
                    Select a news item from the radar to begin analysis
                  </p>
                </div>
              )}
            </div>
          </CyberBox>
        </div>

        {/* RIGHT: STATUS & NODES */}
        <div className="col-span-3 flex flex-col gap-2 min-h-0 overflow-hidden">
          <CyberBox title="Neural Language Nodes" icon={Globe2} className="shrink-0">
            <div className="p-4 grid grid-cols-2 gap-2.5">
              {SUPPORTED_LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => setActiveLang(l)}
                  className={`py-2.5 border transition-all flex items-center justify-between px-3 rounded-sm shadow-md ${activeLang === l ? 'border-[#FFB800] bg-[#FFB800]/25 text-[#FFB800] shadow-[#FFB800]/20' : 'border-white/10 bg-white/[0.04] text-white/50 hover:text-white/80 hover:bg-white/[0.08] hover:border-white/20'}`}
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
              <label className="flex items-center justify-between gap-2 bg-white/[0.08] border border-white/20 rounded-sm px-4 py-3 shadow-md">
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
                className="w-full py-5 bg-[#FFB800] text-black font-black uppercase text-sm tracking-wider hover:bg-[#FFB800]/90 transition-all flex items-center justify-center gap-3 rounded-sm disabled:opacity-20 shadow-xl shadow-[#FFB800]/30"
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
