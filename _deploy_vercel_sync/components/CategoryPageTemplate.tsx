'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Activity,
  Zap,
  Radio,
  ChevronRight,
  ArrowRight,
  Loader2,
  Globe,
  BarChart3,
  Brain,
  Bitcoin
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const SiaRadarVisual = dynamic(() => import('@/components/SiaRadarVisual'), { ssr: false })

// ── Types ─────────────────────────────────────────────────────────────────────

interface Article {
  id: string
  slug: string
  titleEn?: string; titleTr?: string; titleDe?: string; titleFr?: string
  titleEs?: string; titleRu?: string; titleAr?: string; titleJp?: string; titleZh?: string
  summaryEn?: string; summaryTr?: string; summaryDe?: string; summaryFr?: string
  summaryEs?: string; summaryRu?: string; summaryAr?: string; summaryJp?: string; summaryZh?: string
  category: string
  sentiment?: string
  impact?: number
  confidence?: number
  publishedAt: string
  image?: string
}

interface LiveSignal {
  _uid?: string
  id?: string
  title?: string
  executive_summary?: string
  summary?: string
  category?: string
  sentiment?: string
  impact?: number
  time?: string
}

interface CategoryConfig {
  categoryKey: string
  category: string
  accentColor: string
  icon: string
  badgeLabel: string
  nodeLabel: string
  streamLabel: string
  labels: Record<string, {
    hero_title: string
    hero_subtitle: string
    breadcrumb_current: string
    empty_msg: string
    cta_title: string
    cta_desc: string
    cta_btn: string
    live_section: string
    articles_section: string
  }>
}

interface CategoryPageTemplateProps {
  params: { lang: string }
  config: CategoryConfig
  initialArticles?: Article[]
  initialSignals?: LiveSignal[]
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const LANG_TITLE_KEYS: Record<string, keyof Article> = {
  en: 'titleEn', tr: 'titleTr', de: 'titleDe', fr: 'titleFr',
  es: 'titleEs', ru: 'titleRu', ar: 'titleAr', jp: 'titleJp', zh: 'titleZh'
}
const LANG_SUMMARY_KEYS: Record<string, keyof Article> = {
  en: 'summaryEn', tr: 'summaryTr', de: 'summaryDe', fr: 'summaryFr',
  es: 'summaryEs', ru: 'summaryRu', ar: 'summaryAr', jp: 'summaryJp', zh: 'summaryZh'
}

function getLocalizedTitle(a: Article, lang: string): string {
  const key = LANG_TITLE_KEYS[lang]
  return (key && (a as any)[key]) || a.titleEn || a.titleTr || ''
}
function getLocalizedSummary(a: Article, lang: string): string {
  const key = LANG_SUMMARY_KEYS[lang]
  return (key && (a as any)[key]) || a.summaryEn || a.summaryTr || ''
}

const TIME_AGO_LABELS: Record<string, { live: string; justNow: string; mAgo: string; hAgo: string; dAgo: string }> = {
  en: { live: 'LIVE', justNow: 'JUST NOW', mAgo: 'm ago', hAgo: 'h ago', dAgo: 'd ago' },
  tr: { live: 'CANLI', justNow: 'ŞİMDİ', mAgo: 'dk önce', hAgo: 'sa önce', dAgo: 'gün önce' },
}

function timeAgo(publishedAt: string | undefined, lang = 'en'): string {
  const lb = TIME_AGO_LABELS[lang] || TIME_AGO_LABELS.en
  if (!publishedAt) return lb.live
  const diff = Date.now() - new Date(publishedAt).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return lb.justNow
  if (m < 60) return `${m}${lb.mAgo}`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}${lb.hAgo}`
  return `${Math.floor(h / 24)}${lb.dAgo}`
}

const SENTIMENT_STYLE: Record<string, string> = {
  BULLISH: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  BEARISH: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  NEUTRAL: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
}

const ACCENT: Record<string, { bg: string; border: string; text: string; badge: string; glow: string; btn: string }> = {
  purple: { bg: 'bg-purple-600/10', border: 'border-purple-500/20', text: 'text-purple-400', badge: 'bg-purple-600', glow: 'bg-purple-500/20', btn: 'bg-purple-600' },
  orange: { bg: 'bg-orange-600/10', border: 'border-orange-500/20', text: 'text-orange-400', badge: 'bg-orange-600', glow: 'bg-orange-500/20', btn: 'bg-orange-600' },
  emerald: { bg: 'bg-emerald-600/10', border: 'border-emerald-500/20', text: 'text-emerald-400', badge: 'bg-emerald-600', glow: 'bg-emerald-500/20', btn: 'bg-emerald-600' },
  blue: { bg: 'bg-blue-600/10', border: 'border-blue-500/20', text: 'text-blue-400', badge: 'bg-blue-600', glow: 'bg-blue-500/20', btn: 'bg-blue-600' },
}

const CategoryIcon = ({ type, size, className }: { type: string; size?: number; className?: string }) => {
  switch (type) {
    case 'globe': return <Globe size={size} className={className} />;
    case 'bar-chart': return <BarChart3 size={size} className={className} />;
    case 'brain': return <Brain size={size} className={className} />;
    case 'bitcoin': return <Bitcoin size={size} className={className} />;
    default: return <Activity size={size} className={className} />;
  }
}

export default function CategoryPageTemplate({ params, config, initialArticles, initialSignals }: CategoryPageTemplateProps) {
  const { setLanguage, t } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [articles, setArticles] = useState<Article[]>(initialArticles || [])
  const [liveSignals, setLiveSignals] = useState<LiveSignal[]>(initialSignals || [])
  const [loading, setLoading] = useState(!initialArticles)
  const [selectedSignal, setSelectedSignal] = useState<LiveSignal | null>(null)

  const lang = params.lang || 'en'
  const labels = config.labels[lang] || config.labels.en
  const ac = ACCENT[config.accentColor] || ACCENT.blue

  useEffect(() => {
    setMounted(true)
    if (params.lang) setLanguage(params.lang as any)

    if (!initialArticles) {
      fetch(`/api/news?category=${config.categoryKey}`)
        .then(r => r.json())
        .then(d => { if (d?.success) setArticles(d.data) })
        .catch((e: Error) => console.warn('[CATEGORY] Articles fetch failed:', e.message))
        .finally(() => setLoading(false))
    }

    if (!initialSignals) {
      fetch(`/api/content-buffer?action=feed&lang=${params.lang || 'en'}`)
        .then(r => r.json())
        .then(d => {
          if (d?.success && Array.isArray(d.data)) {
            const filtered = d.data.filter((s: any) => !s.category || s.category === config.categoryKey || s.category === 'MARKET')
            setLiveSignals(filtered.slice(0, 8))
          }
        })
        .catch((e: Error) => console.warn('[CATEGORY] Signals fetch failed:', e.message))
    }
  }, [params.lang, setLanguage, config.categoryKey, initialArticles, initialSignals])

  if (!mounted) return <div className="min-h-screen bg-[#020203]" />

  return (
    <div className="text-white selection:bg-blue-600 relative font-sans">
      <div className="container mx-auto px-4 lg:px-10 py-12 md:py-20 relative z-10">

        {/* Breadcrumb */}
        <nav className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] text-white/20 mb-12">
          <Link href={`/${lang}`} className="hover:text-blue-400 transition-colors uppercase">{t('nav.home')}</Link>
          <ChevronRight size={10} />
          <span className="text-white/60">{labels.breadcrumb_current}</span>
        </nav>

        {/* Hero Section */}
        <section className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-8 space-y-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
              <div className={`px-3 py-1.5 rounded-full ${ac.bg} border ${ac.border} ${ac.text} text-[9px] font-bold uppercase tracking-[0.4em] flex items-center gap-2`}>
                <Radio size={12} className="animate-pulse" />
                {config.nodeLabel}: {t('category.status.online')}
              </div>
              <div className="text-white/20 text-[9px] font-mono tracking-widest">{config.streamLabel}</div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl md:text-9xl font-black text-white uppercase italic tracking-tighter leading-[0.8] block">
              {labels.hero_title}
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl md:text-2xl text-slate-400 font-light max-w-2xl leading-relaxed border-l-2 border-blue-600/50 pl-10 italic">
              {labels.hero_subtitle}
            </motion.p>
          </div>

          <div className="lg:col-span-4 flex justify-center lg:justify-end">
            <div className={`p-10 ${ac.bg} rounded-[3rem] ${ac.border} border shadow-2xl relative group`}>
              <div className={`absolute inset-0 ${ac.glow} blur-[60px] rounded-full opacity-50 group-hover:opacity-100 transition-opacity`} />
              <CategoryIcon type={config.icon} size={80} className={`${ac.text} relative z-10 group-hover:scale-110 transition-transform`} />
            </div>
          </div>
        </section>

        {/* ── LIVE SIGNALS FEED ── */}
        {liveSignals.length > 0 && (
          <section className="mb-24">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-4">
                <div className={`p-2 ${ac.bg} rounded-lg ${ac.text}`}>
                  <Activity size={18} />
                </div>
                <div>
                  <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40">{labels.live_section}</h2>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mt-1">{t('category.status.anomaly_detectors')}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full ${ac.bg} ${ac.text} border ${ac.border} text-[9px] font-black tracking-widest`}>
                {liveSignals.length} {t('home.signals.found')}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {liveSignals.map((sig, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  onClick={() => setSelectedSignal(selectedSignal === sig ? null : sig)}
                  className={`p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-white/20 transition-all cursor-pointer group ${selectedSignal === sig ? 'bg-white/[0.05] border-white/30' : ''}`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${SENTIMENT_STYLE[sig.sentiment || 'NEUTRAL']}`}>
                      {sig.sentiment || 'NEUTRAL'}
                    </span>
                    <span className="text-[8px] font-bold text-white/20 uppercase font-mono">{sig.time || 'LIVE'}</span>
                  </div>
                  <h3 className="text-xs font-black text-white uppercase leading-snug group-hover:text-blue-400 transition-colors">
                    {sig.title}
                  </h3>
                  {selectedSignal === sig && (
                    <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-[11px] text-slate-400 leading-relaxed font-medium italic border-t border-white/5 pt-4">
                      {sig.executive_summary || sig.summary}
                    </motion.p>
                  )}
                </motion.div>
              ))}
            </div>
          </section>
        )}

        {/* ── REPORTS GRID ── */}
        <section className="mb-24">
          <div className="flex items-center gap-6 mb-12">
            <div className={`w-12 h-12 rounded-2xl ${ac.bg} border ${ac.border} flex items-center justify-center ${ac.text}`}>
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter italic">{labels.articles_section}</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1">{t('category.reports.database')}</p>
            </div>
            <div className="flex-1 h-px bg-white/5 ml-4" />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-40 gap-4">
              <Loader2 className={`animate-spin ${ac.text}`} size={48} />
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">{t('common.loading')}</span>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-32 bg-white/[0.01] border border-white/5 rounded-[4rem] backdrop-blur-sm">
              <CategoryIcon type={config.icon} size={64} className={`${ac.text} opacity-10 mx-auto mb-6`} />
              <p className="text-white/20 text-sm font-black uppercase italic tracking-[0.2em]">{labels.empty_msg}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {articles.map((news, idx) => (
                <Link key={news.id} href={`/${lang}/news/${news.slug}`}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-[3rem] overflow-hidden transition-all hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:scale-[1.02] duration-300 shadow-2xl flex flex-col h-full"
                  >
                    <div className="relative h-56 overflow-hidden bg-black shrink-0">
                      <SiaRadarVisual category={config.category} confidence={news.confidence ?? 90} compact className="w-full h-full" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-transparent to-transparent" />
                      <div className="absolute top-6 left-6 z-10">
                        <span className={`px-4 py-1.5 ${ac.badge} rounded-full text-[9px] font-black text-white uppercase tracking-[0.2em]`}>
                          {config.badgeLabel}
                        </span>
                      </div>
                    </div>

                    <div className="p-8 space-y-6 flex-1 flex flex-col">
                      <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest">
                        <span className={ac.text}>{timeAgo(news.publishedAt, lang)}</span>
                        <span className="text-white/20">{news.confidence || 94}% {t('hub.confidence_label')}</span>
                      </div>
                      <h3 className="text-2xl font-black text-white leading-[1.1] uppercase italic tracking-tighter group-hover:text-blue-400 transition-colors flex-1">
                        {getLocalizedTitle(news, lang)}
                      </h3>
                      <p className="text-sm text-slate-400 font-light leading-relaxed italic border-l-2 border-white/5 pl-6 line-clamp-3">
                        {getLocalizedSummary(news, lang)}
                      </p>
                      <div className="flex items-center justify-between pt-6 border-t border-white/5">
                        <div className="flex items-center gap-2">
                          <Activity size={14} className={ac.text} />
                          <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">{t('home.hero.impact_scale')}: {news.impact || 5}/10</span>
                        </div>
                        <ArrowRight size={18} className={`${ac.text} opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all`} />
                      </div>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className={`p-16 md:p-24 bg-gradient-to-br ${ac.bg} to-transparent border ${ac.border} rounded-[4rem] text-center relative overflow-hidden group`}
        >
          <div className={`absolute -top-40 -right-40 w-96 h-96 ${ac.glow} blur-[120px] rounded-full opacity-0 group-hover:opacity-100 transition-all duration-1000`} />
          <CategoryIcon type={config.icon} size={72} className={`${ac.text} mx-auto mb-8 animate-pulse`} />
          <h2 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-8 max-w-4xl mx-auto leading-none">
            {labels.cta_title}
          </h2>
          <p className="text-xl text-slate-400 font-light mb-12 max-w-2xl mx-auto italic border-l-2 border-white/10 px-10 leading-relaxed">
            {labels.cta_desc}
          </p>
          <Link href={`/${lang}/intelligence`} className={`inline-flex items-center gap-4 px-12 py-6 ${ac.btn} text-white font-black uppercase tracking-[0.3em] rounded-2xl transition-all shadow-2xl shadow-black/40 text-[10px] hover:scale-105 active:scale-95`}>
            {labels.cta_btn} <ArrowRight size={18} />
          </Link>
        </motion.div>

      </div>
    </div>
  )
}
