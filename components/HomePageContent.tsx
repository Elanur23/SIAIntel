'use client'

import { useEffect, useState } from 'react'
import { getArticleFieldKey } from '@/lib/warroom/article-localization'
import { Locale } from '@/lib/i18n/dictionaries'
import { buildArticleSlug } from '@/lib/warroom/article-seo'
import Link from 'next/link'
import { ArrowRight, Shield, AlertCircle } from 'lucide-react'
import GlobeGrid from '@/components/GlobeGrid'
import DataSyncTime from '@/components/DataSyncTime'
import DecodingText from '@/components/DecodingText'
import SiaDeepIntel from '@/components/SiaDeepIntel'
import LiveBreakingStrip from '@/components/LiveBreakingStrip'
import ThreeColumnGrid from '@/components/ThreeColumnGrid'
import CategoryRows from '@/components/CategoryRows'
import TrendingHeatmap from '@/components/TrendingHeatmap'

interface HomePageContentProps {
  rawLang: string
}

export default function HomePageContent({ rawLang }: HomePageContentProps) {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchArticles() {
      try {
        const url = '/api/news'
        const response = await fetch(url)
        if (!response.ok) {
          throw new Error('Failed to fetch articles')
        }
        const result = await response.json()
        const fetchedArticles = result.success && Array.isArray(result.data) ? result.data : []
        setArticles(fetchedArticles)
      } catch (err) {
        console.error('Error fetching articles:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setArticles([])
      } finally {
        setLoading(false)
      }
    }

    fetchArticles()
  }, [])

  const lang = rawLang as Locale
  const titleKey = getArticleFieldKey('title', String(lang))
  const summaryKey = getArticleFieldKey('summary', String(lang))

  const formattedArticles = articles.map(a => ({
    id: String(a.id),
    slug: buildArticleSlug(String(a.id), String(a[titleKey] || a.titleEn || a.titleTr || a.id)),
    title: String(a[titleKey] || a.titleEn || a.titleTr || 'Intelligence Report'),
    summary: String(a[summaryKey] || a.summaryEn || a.summaryTr || ''),
    category: a.category || 'GENERAL',
    image: a.imageUrl,
    confidence: a.confidence || 90,
    publishedAt: a.publishedAt,
    impact: a.marketImpact || 5
  }))

  const featured = formattedArticles[0]
  const hasArticles = formattedArticles.length > 0

  // Loading state
  if (loading) {
    return (
      <section className="relative pt-8 pb-16 overflow-hidden border-b border-white/5 terminal-grid">
        <GlobeGrid className="left-0 top-1/2 -translate-y-1/2 w-[50%] max-w-[600px] h-[80%] -translate-x-1/4" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="h-[400px] flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-white/[0.01] gap-4">
            <div className="w-16 h-16 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-white/60 uppercase tracking-wider">Synchronizing Intelligence Matrix...</span>
            <span className="text-xs text-white/40">Loading articles...</span>
          </div>
        </div>
      </section>
    )
  }

  // Error or no articles state
  if (error || !hasArticles) {
    return (
      <section className="relative pt-8 pb-16 overflow-hidden border-b border-white/5 terminal-grid">
        <GlobeGrid className="left-0 top-1/2 -translate-y-1/2 w-[50%] max-w-[600px] h-[80%] -translate-x-1/4" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="h-[400px] flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-white/[0.01] gap-4">
            <div className="w-16 h-16 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin" />
            <span className="text-sm text-white/60 uppercase tracking-wider">Synchronizing Intelligence Matrix...</span>
            <span className="text-xs text-white/40">{error || 'Connecting to database...'}</span>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      {/* HERO - Main Featured Article with Intelligence Panel */}
      <section className="relative pt-8 pb-16 overflow-hidden border-b border-white/5 terminal-grid">
        <GlobeGrid className="left-0 top-1/2 -translate-y-1/2 w-[50%] max-w-[600px] h-[80%] -translate-x-1/4" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {featured ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Main Story - Left */}
              <div className="lg:col-span-8 space-y-5">
                {/* Editorial Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                  <div className="px-2.5 py-1 bg-blue-600/90 text-white text-[10px] font-bold uppercase tracking-widest">
                    Lead Intelligence
                  </div>
                  <div className="h-px flex-1 bg-white/5" />
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-soft-pulse" />
                    <span className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest font-mono-data">Live</span>
                  </div>
                </div>
                
                {/* Headline & Summary */}
                <div className="space-y-3">
                  <DecodingText 
                    text={featured.title}
                    duration={500}
                    className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] text-white"
                    as="h1"
                  />
                  <p className="text-base md:text-lg leading-relaxed text-white/70 font-light max-w-3xl">
                    {featured.summary}
                  </p>
                </div>

                {/* Intelligence Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-2">
                  <div className="p-2.5 bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Impact</div>
                      <DataSyncTime freezeOnLoad className="text-white/30" label="" />
                    </div>
                    <div className="text-xl font-black text-white font-mono-data">{featured.impact}<span className="text-xs text-white/40">/10</span></div>
                  </div>
                  <div className="p-2.5 bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Confidence</div>
                      <DataSyncTime freezeOnLoad className="text-white/30" label="" />
                    </div>
                    <div className="text-xl font-black text-emerald-500 font-mono-data">{featured.confidence}%</div>
                  </div>
                  <div className="p-2.5 bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Signal</div>
                      <DataSyncTime freezeOnLoad className="text-white/30" label="" />
                    </div>
                    <div className="text-xl font-black text-blue-500 font-mono-data">HIGH</div>
                  </div>
                  <div className="p-2.5 bg-white/[0.02] border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Volatility</div>
                      <DataSyncTime freezeOnLoad className="text-white/30" label="" />
                    </div>
                    <div className="text-xl font-black text-orange-500 font-mono-data">MED</div>
                  </div>
                </div>

                {/* Read Action */}
                <div className="pt-2">
                  <Link href={`/${rawLang}/news/${featured.slug}`} className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-500 transition-colors border border-blue-500/20 group">
                    Read Full Analysis
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>

              {/* Intelligence Panel - Right */}
              <div className="lg:col-span-4 space-y-3">
                {/* Intelligence Sources */}
                <div className="p-3 bg-white/[0.02] border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Intelligence Sources</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-xs text-white/80">On-Chain Analytics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-xs text-white/80">Exchange APIs</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-xs text-white/80">News Aggregation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                      <span className="text-xs text-white/80">Social Sentiment</span>
                    </div>
                  </div>
                </div>

                {/* Analysis Framework */}
                <div className="p-3 bg-white/[0.02] border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Analysis Process</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="text-xs text-white/80">AI-Powered Analysis</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="text-xs text-white/80">Multi-Source Verification</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="text-xs text-white/80">Confidence Scoring</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                      <span className="text-xs text-white/80">Pattern Recognition</span>
                    </div>
                  </div>
                </div>

                {/* Coverage Scope */}
                <div className="p-3 bg-white/[0.02] border border-white/5 space-y-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Market Coverage</span>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-white/80">Cryptocurrency Markets</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-white/80">Traditional Equities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-white/80">Macro Economics</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span className="text-xs text-white/80">Technology Sector</span>
                    </div>
                  </div>
                </div>

                {/* Verified Intelligence */}
                <div className="p-3 bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield size={16} className="text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Verified Intelligence</span>
                  </div>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Real-time monitoring with 24/7 coverage across global markets and emerging trends
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-[400px] flex items-center justify-center border border-white/5 rounded-2xl bg-white/[0.01]">
              <span className="text-sm text-white/60 uppercase tracking-wider animate-pulse">Synchronizing Intelligence Matrix...</span>
            </div>
          )}
        </div>
      </section>

      {/* TRUST & VERIFICATION LAYER */}
      <section className="border-b border-white/5 bg-gradient-to-r from-blue-950/5 via-purple-950/5 to-blue-950/5">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <div className="rounded-2xl border border-blue-900/40 bg-gradient-to-br from-blue-950/40 to-purple-950/30 shadow-lg p-5 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            {/* Left: Trust signals */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-950/60 border border-blue-500/30">
                  <Shield size={16} className="text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Verified Intelligence</span>
                </span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-blue-500/10" />
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-emerald-400/40" />
                <span className="text-xs text-white/70 font-semibold tracking-wide">Real-Time Data Stream</span>
              </div>
              <div className="hidden sm:block h-6 w-px bg-blue-500/10" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Sources:</span>
                <span className="text-xs text-white/80 font-mono">On-Chain • Exchange APIs • News Feeds</span>
              </div>
            </div>
            {/* Right: System status */}
            <div className="flex flex-col items-center sm:items-end w-full sm:w-auto">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-900/30 border border-emerald-500/20 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse border border-emerald-400/40" />
                <span className="text-xs text-white/60 uppercase tracking-wider">System Status:</span>
                <span className="text-xs text-emerald-400 font-bold">OPERATIONAL</span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* DECISION LAYER - Signal Summary */}
      <section className="border-b border-white/5 bg-gradient-to-b from-transparent to-blue-950/5">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Intelligence Context */}
          <div className="mb-6 px-6 py-4 rounded-lg bg-white/[0.02] border border-white/5">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-bold text-white/90 mb-1 tracking-tight">Market Intelligence Panel</h3>
                <p className="text-xs text-white/60 leading-relaxed">
                  Multi-factor signals with confidence scoring, continuously monitored across global markets
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/5 text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  Multi-Source
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/5 text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  Confidence-Rated
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/5 text-[10px] text-white/70 uppercase tracking-wider font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Real-Time
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {/* Market Sentiment */}
            <div className="p-3 bg-white/[0.02] border border-white/5 hover:border-emerald-500/20 transition-colors relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Market Sentiment</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              </div>
              <div className="text-xl font-black text-emerald-500 mb-1">BULLISH</div>
              <div className="text-[10px] text-white/60 leading-relaxed">Risk-On Environment • 72h Momentum</div>
              <div className="absolute top-2 right-2 text-[9px] text-emerald-500/50 font-mono">4h</div>
            </div>

            {/* Active Signals */}
            <div className="p-3 bg-white/[0.02] border border-white/5 hover:border-blue-500/20 transition-colors relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Active Signals</span>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>
              <div className="text-xl font-black text-blue-500 mb-1">12</div>
              <div className="text-[10px] text-white/60 leading-relaxed">8 High Priority • 4 Medium</div>
              <div className="absolute top-2 right-2 text-[9px] text-blue-500/50 font-mono">Live</div>
            </div>

            {/* Volatility Index */}
            <div className="p-3 bg-white/[0.02] border border-white/5 hover:border-orange-500/20 transition-colors relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Volatility Index</span>
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
              </div>
              <div className="text-xl font-black text-orange-500 mb-1">MEDIUM</div>
              <div className="text-[10px] text-white/60 leading-relaxed">VIX 14.2 • -3.1% 24h</div>
              <div className="absolute top-2 right-2 text-[9px] text-orange-500/50 font-mono">1h</div>
            </div>

            {/* Decision Confidence */}
            <div className="p-3 bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-colors relative">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-semibold">Decision Confidence</span>
                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              </div>
              <div className="text-xl font-black text-purple-500 mb-1">87%</div>
              <div className="text-[10px] text-white/60 leading-relaxed">High Conviction • Low Noise</div>
              <div className="absolute top-2 right-2 text-[9px] text-purple-500/50 font-mono">6h</div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-8 p-8 rounded-2xl bg-gradient-to-br from-blue-950/40 via-blue-900/20 to-purple-950/40 border border-blue-500/30 shadow-2xl shadow-blue-900/20 backdrop-blur-sm">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
              {/* Content */}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
                    Get Real-Time Intelligence Alerts
                  </h3>
                  <p className="text-base text-white/70 leading-relaxed max-w-xl">
                    Join 2,847 institutional traders receiving priority market signals and breaking intelligence via Telegram
                  </p>
                </div>
                
                {/* Social Proof */}
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex -space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-3 border-[#020203] shadow-lg" />
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-blue-600 border-3 border-[#020203] shadow-lg" />
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 border-3 border-[#020203] shadow-lg" />
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 border-3 border-[#020203] shadow-lg" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-white/90 uppercase tracking-wide">Verified Traders</span>
                    <span className="text-[10px] text-white/50 uppercase tracking-wider">Beta Access • Institutional Grade</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                <a 
                  href="https://t.me/siaintel" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/40 flex items-center justify-center gap-3 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <svg className="w-5 h-5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                  <span className="relative z-10">Join Telegram</span>
                </a>
                <button className="group px-8 py-4 bg-white/[0.08] hover:bg-white/[0.15] text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-300 border border-white/20 hover:border-white/40 backdrop-blur-sm flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>Email Alerts</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FLOW CONNECTOR */}
      <div className="max-w-2xl mx-auto px-6">
        <div className="relative flex items-center justify-center py-6 sm:py-8">
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-transparent via-blue-700/30 to-transparent blur-sm rounded-full" />
          <div className="flex items-center gap-3 z-10">
            <div className="h-0.5 w-12 bg-gradient-to-r from-transparent to-blue-500/60 rounded-full" />
            <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_12px_2px_rgba(59,130,246,0.25)] border-2 border-blue-400/60 animate-pulse" />
            <div className="h-0.5 w-12 bg-gradient-to-l from-transparent to-blue-500/60 rounded-full" />
          </div>
        </div>
      </div>

      {/* SIA DEEP INTEL - 1 Large + 2 Small Cards */}
      <SiaDeepIntel articles={formattedArticles} lang={rawLang} />

      {/* LIVE BREAKING STRIP - Ticker */}
      <LiveBreakingStrip lang={rawLang} />

      {/* THREE COLUMN GRID - Latest Intel + Featured + Intelligence Panel */}
      <ThreeColumnGrid articles={formattedArticles} lang={rawLang} />

      {/* CATEGORY ROWS - AI, Crypto, Macro, Markets */}
      <CategoryRows articles={formattedArticles} lang={rawLang} />

      {/* TRENDING + HEATMAP */}
      <TrendingHeatmap lang={rawLang} />

      {/* WAR ROOM - Strategic Intelligence */}
      <section className="border-y border-red-500/10 bg-gradient-to-b from-red-950/5 to-transparent">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-600 to-orange-600">
                <AlertCircle size={18} className="text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">War Room Intelligence</h2>
                <p className="text-[10px] text-white/60 mt-0.5 tracking-wide">Critical market events requiring immediate attention</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 border border-red-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">3 Active Alerts</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Alert 1 */}
            <div className="p-3 bg-white/[0.02] border border-red-500/20 hover:border-red-500/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[10px] text-red-400 font-bold uppercase tracking-widest">Critical</span>
                </div>
                <span className="text-[9px] text-white/40 font-mono">2m ago</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 leading-tight">Fed Emergency Meeting Rumors</h3>
              <p className="text-[10px] text-white/60 mb-2 leading-relaxed">Unconfirmed reports of emergency FOMC session. Market volatility expected.</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/40 uppercase tracking-wider">Impact:</span>
                  <span className="text-[10px] text-red-500 font-bold">EXTREME</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 border border-red-500/20">
                  <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider">Action Required</span>
                </div>
              </div>
            </div>

            {/* Alert 2 */}
            <div className="p-3 bg-white/[0.02] border border-orange-500/20 hover:border-orange-500/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                  <span className="text-[10px] text-orange-400 font-bold uppercase tracking-widest">High</span>
                </div>
                <span className="text-[9px] text-white/40 font-mono">15m ago</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 leading-tight">Whale Movement Detected</h3>
              <p className="text-[10px] text-white/60 mb-2 leading-relaxed">$2.3B BTC transfer from Binance to unknown wallet. Accumulation signal.</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/40 uppercase tracking-wider">Impact:</span>
                  <span className="text-[10px] text-orange-500 font-bold">HIGH</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 border border-orange-500/20">
                  <svg className="w-3 h-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-[9px] text-orange-400 font-bold uppercase tracking-wider">Monitor</span>
                </div>
              </div>
            </div>

            {/* Alert 3 */}
            <div className="p-3 bg-white/[0.02] border border-yellow-500/20 hover:border-yellow-500/30 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                  <span className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest">Medium</span>
                </div>
                <span className="text-[9px] text-white/40 font-mono">1h ago</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-1.5 leading-tight">AI Sector Momentum Shift</h3>
              <p className="text-[10px] text-white/60 mb-2 leading-relaxed">NVDA options flow suggests institutional positioning for earnings.</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-white/40 uppercase tracking-wider">Impact:</span>
                  <span className="text-[10px] text-yellow-500 font-bold">MEDIUM</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 border border-yellow-500/20">
                  <svg className="w-3 h-3 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[9px] text-yellow-400 font-bold uppercase tracking-wider">Tracked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
