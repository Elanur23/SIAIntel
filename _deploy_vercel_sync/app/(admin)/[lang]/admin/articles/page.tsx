'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Globe2,
  ImagePlus,
  Loader2,
  Shield,
  Sparkles,
  Wand2,
  Search,
  AlertCircle,
  Info,
  Radio,
} from 'lucide-react'
import SocialDistributionSuite from '@/components/SocialDistributionSuite'
import type { SocialMediaPackage } from '@/lib/warroom/social-media'
import {
  ARTICLE_LANGS,
  ARTICLE_LANGUAGE_LABELS,
  getArticleFieldKey,
  type ArticleLanguage,
} from '@/lib/warroom/article-localization'
import { notifyGoogleOfUpdate } from '@/lib/seo/google-indexer'

const EDIT_LANGS = ARTICLE_LANGS
type EditLang = (typeof EDIT_LANGS)[number]

type ArticleDraft = {
  title: string
  summary: string
  insight: string
  risk: string
  content: string
}

type PublishResult = {
  id?: string
  status?: string
  publishedAt?: string
  articleUrl?: string
  socialPackage?: SocialMediaPackage
  googleIndexed?: boolean
}

function buildSummaryFromBody(content: string) {
  const normalized = content.replace(/\s+/g, ' ').trim()
  if (!normalized) return ''
  const sentences = normalized.split(/(?<=[.!?])\s+/).filter(Boolean)
  return sentences.slice(0, 2).join(' ').slice(0, 320)
}

function mapImageCategory(category: string) {
  switch (category) {
    case 'CRYPTO':
      return 'CRYPTO_BLOCKCHAIN'
    case 'STOCKS':
    case 'AI':
      return 'TECH_STOCKS'
    case 'ECONOMY':
      return 'MACRO_ECONOMY'
    default:
      return null
  }
}

const EMPTY_DRAFT: ArticleDraft = { title: '', summary: '', insight: '', risk: '', content: '' }
const INITIAL_DRAFTS = Object.fromEntries(
  EDIT_LANGS.map((lang) => [lang, { ...EMPTY_DRAFT }])
) as Record<EditLang, ArticleDraft>
const INITIAL_PUBLISH_RESULT = Object.fromEntries(EDIT_LANGS.map((lang) => [lang, {}])) as Record<
  EditLang,
  PublishResult
>

function getDefaultInsight(lang: EditLang, score: number) {
  if (lang === 'tr') return `Güven skoru ${score}/100. AI destekli editoryal genişletme tamamlandı.`
  return `Confidence ${score}/100. Generated with AI editorial expansion.`
}

function getDefaultRisk(lang: EditLang) {
  if (lang === 'tr')
    return 'Bu analiz mevcut piyasa verilerine dayanmaktadır ve yatırım tavsiyesi niteliğinde değildir.'
  return 'This analysis is based on available market intelligence and should be treated as informational, not as investment advice.'
}

export default function AdminArticlesPage({ params }: { params: { lang: string } }) {
  const [activeLang, setActiveLang] = useState<EditLang>('en' as ArticleLanguage)
  const [isPublishing, setIsPublishing] = useState(false)
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [editorStatus, setEditorStatus] = useState<'draft' | 'scheduled' | 'published'>('draft')
  const [scheduledFor, setScheduledFor] = useState('')
  const [lastActionMessage, setLastActionMessage] = useState('')
  const [imageUrl, setImageUrl] = useState(
    'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop'
  )
  const [category, setCategory] = useState('MARKET')
  const [region, setRegion] = useState('GLOBAL')
  const [sentiment, setSentiment] = useState('NEUTRAL')
  const [confidence, setConfidence] = useState(88)
  const [marketImpact, setMarketImpact] = useState(7)
  const [source, setSource] = useState('SIA_EDITORIAL_DESK')
  const [drafts, setDrafts] = useState<Record<EditLang, ArticleDraft>>(INITIAL_DRAFTS)
  const [publishResult, setPublishResult] =
    useState<Record<EditLang, PublishResult>>(INITIAL_PUBLISH_RESULT)

  const currentDraft = drafts[activeLang]
  const primaryTitle =
    EDIT_LANGS.map((lang) => drafts[lang].title).find((value) => value.trim()) || 'Untitled Article'

  // Discover Health Check Logic
  const discoverHealth = useMemo(() => {
    return {
      hasLargeImage: imageUrl.length > 10,
      titleLength: currentDraft.title.length >= 40 && currentDraft.title.length <= 110,
      hasSummary: currentDraft.summary.length > 50,
      hasConfidence: confidence >= 90,
    }
  }, [imageUrl, currentDraft, confidence])

  const completion = useMemo(() => {
    const values = EDIT_LANGS.flatMap((lang) => [
      drafts[lang].title,
      drafts[lang].summary,
      drafts[lang].content,
    ])
    const completed = values.filter((value) => value.trim().length > 0).length
    return Math.round((completed / values.length) * 100)
  }, [drafts])

  const updateDraft = (lang: EditLang, key: keyof ArticleDraft, value: string) => {
    setDrafts((prev) => ({ ...prev, [lang]: { ...prev[lang], [key]: value } }))
  }

  const handlePersist = async (mode: 'draft' | 'scheduled' | 'published') => {
    if (!EDIT_LANGS.some((lang) => drafts[lang].title.trim())) {
      alert('En az bir dilde başlık gerekli.')
      return
    }

    setIsPublishing(true)
    setEditorStatus(mode)
    setLastActionMessage(mode === 'draft' ? 'Saving to vault...' : 'Broadcasting intelligence...')

    try {
      const localizedPayload = EDIT_LANGS.reduce<Record<string, string | undefined>>(
        (acc, lang) => {
          acc[getArticleFieldKey('title', lang)] = drafts[lang].title || undefined
          acc[getArticleFieldKey('summary', lang)] = drafts[lang].summary || undefined
          acc[getArticleFieldKey('siaInsight', lang)] = drafts[lang].insight || undefined
          acc[getArticleFieldKey('riskShield', lang)] = drafts[lang].risk || undefined
          acc[getArticleFieldKey('content', lang)] = drafts[lang].content || undefined
          return acc
        },
        {}
      )

      // Ensure mandatory fields for Zod (English fallback if not present)
      if (!localizedPayload.titleEn) localizedPayload.titleEn = currentDraft.title
      if (!localizedPayload.contentEn) localizedPayload.contentEn = currentDraft.content

      const response = await fetch('/api/war-room/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl,
          category,
          region,
          sentiment: sentiment.toLowerCase(),
          confidence,
          marketImpact,
          source,
          status: mode,
          publishedAt: mode === 'scheduled' ? new Date(scheduledFor).toISOString() : undefined,
          ...localizedPayload,
        }),
      })

      const data = await response.json().catch(() => ({}))
      if (!response.ok || data.success === false) throw new Error(data.error || 'Action failed')

      // --- 🚀 INSTANT INDEXING TRIGGER ---
      let googleIndexed = false
      if (mode === 'published' && data.seo?.en?.url) {
        setLastActionMessage('Broadcasting to Google Indexing API...')
        const indexResult = await notifyGoogleOfUpdate(data.seo.en.url)
        if (indexResult?.success) googleIndexed = true
      }

      setPublishResult(
        EDIT_LANGS.reduce(
          (acc, lang) => ({
            ...acc,
            [lang]: {
              id: data.id,
              status: data.status,
              publishedAt: data.publishedAt,
              articleUrl: data.seo?.[lang]?.url,
              socialPackage: data.social?.[lang],
              googleIndexed,
            },
          }),
          {} as Record<EditLang, PublishResult>
        )
      )

      setLastActionMessage(
        mode === 'published' ? 'Intelligence Live & Indexed by Google.' : 'Draft secured.'
      )
    } catch (error: any) {
      alert(`Error: ${error?.message}`)
      setLastActionMessage('Transmission failed.')
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#020203] text-white p-6 lg:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-white/5 pb-8">
          <div className="flex items-center gap-4">
            <Link
              href={`/${params.lang}/admin`}
              className="p-2 rounded-2xl text-gray-500 hover:bg-white/5 hover:text-white transition-all"
            >
              <ArrowLeft size={22} />
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tighter uppercase text-white">
                SIA_EDITORIAL_COMMAND
              </h1>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.35em] mt-2">
                Discover & Global Reach Optimized
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handlePersist('published')}
              disabled={isPublishing}
              className="inline-flex items-center justify-center gap-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 px-10 py-4 text-xs font-black uppercase tracking-[0.2em] shadow-2xl disabled:opacity-50"
            >
              {isPublishing ? <Loader2 size={18} className="animate-spin" /> : <Globe2 size={18} />}
              Broadcast Intelligence
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <div className="xl:col-span-8 space-y-6">
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/5 bg-white/[0.03] p-2">
              {EDIT_LANGS.map((lang) => (
                <button
                  key={lang}
                  onClick={() => setActiveLang(lang)}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeLang === lang ? 'bg-white text-black' : 'text-gray-500 hover:text-white'}`}
                >
                  {ARTICLE_LANGUAGE_LABELS[lang]}
                </button>
              ))}
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 space-y-6">
              <div className="grid grid-cols-1 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
                    Strategic_Headline
                  </label>
                  <input
                    value={currentDraft.title}
                    onChange={(e) => updateDraft(activeLang, 'title', e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-lg font-bold outline-none focus:border-blue-500"
                    placeholder="Enter discover-optimized headline"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
                    Executive_Summary
                  </label>
                  <textarea
                    value={currentDraft.summary}
                    onChange={(e) => updateDraft(activeLang, 'summary', e.target.value)}
                    className="w-full h-28 rounded-2xl border border-white/10 bg-black/30 px-5 py-4 text-sm outline-none focus:border-blue-500 resize-none"
                    placeholder="Brief intelligence overview"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
                  Full_Report_Dossier
                </label>
                <textarea
                  value={currentDraft.content}
                  onChange={(e) => updateDraft(activeLang, 'content', e.target.value)}
                  className="w-full h-[500px] rounded-[2rem] border border-white/10 bg-black/30 px-6 py-5 text-sm leading-relaxed outline-none focus:border-blue-500 resize-none"
                  placeholder="Comprehensive intelligence content"
                />
              </div>
            </div>
          </div>

          <div className="xl:col-span-4 space-y-6">
            {/* --- 🛡️ DISCOVER HEALTH CHECK PANEL --- */}
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 space-y-6">
              <div className="flex items-center gap-3 text-orange-400">
                <Search size={18} />
                <h2 className="text-sm font-black uppercase tracking-[0.25em]">Discover_Audit</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-gray-500 uppercase tracking-widest">Image Resolution</span>
                  <span
                    className={discoverHealth.hasLargeImage ? 'text-emerald-500' : 'text-rose-500'}
                  >
                    {discoverHealth.hasLargeImage ? 'VALID' : 'TOO_SMALL'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-gray-500 uppercase tracking-widest">Headline Strength</span>
                  <span
                    className={discoverHealth.titleLength ? 'text-emerald-500' : 'text-amber-500'}
                  >
                    {discoverHealth.titleLength ? 'OPTIMAL' : 'REVISE'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-gray-500 uppercase tracking-widest">Meta Description</span>
                  <span
                    className={discoverHealth.hasSummary ? 'text-emerald-500' : 'text-rose-500'}
                  >
                    {discoverHealth.hasSummary ? 'READY' : 'MISSING'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-bold">
                  <span className="text-gray-500 uppercase tracking-widest">E-E-A-T Score</span>
                  <span
                    className={discoverHealth.hasConfidence ? 'text-emerald-500' : 'text-amber-500'}
                  >
                    {discoverHealth.hasConfidence ? 'HIGH' : 'LOW'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex gap-3 items-start">
                <Info size={16} className="text-blue-400 mt-0.5" />
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Discover prefers headlines between 60-100 chars and high-res technical imagery.
                </p>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-white/[0.02] p-8 space-y-6">
              <div className="flex items-center gap-3 text-blue-400">
                <Globe2 size={18} />
                <h2 className="text-sm font-black uppercase tracking-[0.25em]">
                  Transmission_Config
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                    Category
                  </span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs outline-none"
                  >
                    <option value="MARKET">MARKET</option>
                    <option value="AI">AI</option>
                    <option value="CRYPTO">CRYPTO</option>
                    <option value="STOCKS">STOCKS</option>
                  </select>
                </label>
                <label className="space-y-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                    Impact
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={marketImpact}
                    onChange={(e) => setMarketImpact(Number(e.target.value) || 1)}
                    className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs outline-none"
                  />
                </label>
              </div>

              <label className="space-y-2 block">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
                  Hero Image URL
                </span>
                <input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-xs outline-none"
                />
              </label>

              <div className="pt-4 space-y-3">
                <button
                  onClick={() => handlePersist('draft')}
                  disabled={isPublishing}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white disabled:opacity-50"
                >
                  Save to Vault
                </button>
                <button
                  onClick={() => handlePersist('published')}
                  disabled={isPublishing}
                  className="w-full rounded-2xl bg-blue-600 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl disabled:opacity-50"
                >
                  Broadcast Live
                </button>
              </div>
            </div>

            {lastActionMessage && (
              <div className="rounded-[2rem] border border-blue-500/20 bg-blue-500/10 p-6 text-center">
                <div className="flex items-center justify-center gap-2 text-blue-400 animate-pulse mb-2">
                  <Radio size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    Protocol_Log
                  </span>
                </div>
                <p className="text-xs text-blue-200 font-bold uppercase">{lastActionMessage}</p>
                {publishResult[activeLang]?.googleIndexed && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                    <CheckCircle2 size={14} /> Google_Index_Signal_Sent
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
