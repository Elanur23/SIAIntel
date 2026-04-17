import { getCachedArticles } from '@/lib/warroom/database'
import { getArticleFieldKey } from '@/lib/warroom/article-localization'
import { getDictionary, Locale } from '@/lib/i18n/dictionaries'
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

export default async function HomePageContent({ rawLang }: HomePageContentProps) {
  const lang = rawLang as Locale
  const dict = getDictionary(lang)
  const allArticles = await getCachedArticles('published')
  const titleKey = getArticleFieldKey('title', String(lang))
  const summaryKey = getArticleFieldKey('summary', String(lang))

  const formattedArticles = (allArticles as any[]).map(a => ({
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

  // If no articles, show fallback and skip rendering child components
  if (!hasArticles) {
    return (
      <>
        <section className="relative pt-8 pb-16 overflow-hidden border-b border-white/5 terminal-grid">
          <GlobeGrid className="left-0 top-1/2 -translate-y-1/2 w-[50%] max-w-[600px] h-[80%] -translate-x-1/4" />
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="h-[400px] flex flex-col items-center justify-center border border-white/5 rounded-2xl bg-white/[0.01] gap-4">
              <div className="w-16 h-16 border-4 border-white/10 border-t-blue-500 rounded-full animate-spin" />
              <span className="text-sm text-white/60 uppercase tracking-wider">Synchronizing Intelligence Matrix...</span>
              <span className="text-xs text-white/40">Connecting to database...</span>
            </div>
          </div>
        </section>
      </>
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
              <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold uppercase tracking-wider">
                    Priority Intel
                  </div>
                  <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent" />
                  <div className="text-emerald-500 text-xs font-bold flex items-center gap-2 uppercase tracking-wider font-mono-data">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-soft-pulse" />
                    Live
                  </div>
                </div>
                
                <div className="space-y-4">
                  <DecodingText 
                    text={featured.title}
                    duration={500}
                    className="text-3xl md:text-5xl font-bold tracking-tight leading-tight text-white"
                    as="h1"
                  />
                  <p className="text-base font-medium leading-tight text-slate-400">
                    {featured.summary}
                  </p>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover-lift">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-white/40 uppercase tracking-wider">Impact</div>
                      <DataSyncTime freezeOnLoad className="text-white/30" label="SYNC:" />
                    </div>
                    <div className="text-2xl font-black text-white font-mono-data">{featured.impact}<span className="text-sm text-white/40">/10</span></div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover-lift">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-white/40 uppercase tracking-wider">Confidence</div>
                      <DataSyncTime freezeOnLoad className="text-white/30" label="SYNC:" />
                    </div>
                    <div className="text-2xl font-black text-emerald-500 font-mono-data">{featured.confidence}%</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover-lift">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-white/40 uppercase tracking-wider">Signal</div>
                      <DataSyncTime freezeOnLoad className="text-white/30" label="SYNC:" />
                    </div>
                    <div className="text-2xl font-black text-blue-500 font-mono-data">HIGH</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 hover-lift">
                    <div className="flex items-center justify-between mb-1">
                      <div className="text-xs text-white/40 uppercase tracking-wider">Volatility</div>
                      <DataSyncTime freezeOnLoad className="text-white/30" label="SYNC:" />
                    </div>
                    <div className="text-2xl font-black text-orange-500 font-mono-data">MED</div>
                  </div>
                </div>

                <Link href={`/${rawLang}/news/${featured.slug}`} className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 text-white rounded-xl text-sm font-bold uppercase tracking-wider hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 group">
                  Access Full Analysis
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>

              {/* Intelligence Panel - Right */}
              <div className="lg:col-span-4 space-y-4">
                {/* Mini Market Dashboard */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Market Pulse</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">BTC/USD</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">$68,234</span>
                        <span className="text-xs font-bold text-emerald-500">+2.3%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">S&P 500</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">5,234</span>
                        <span className="text-xs font-bold text-red-500">-0.8%</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">VIX</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">14.2</span>
                        <span className="text-xs font-bold text-emerald-500">-3.1%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signal Indicators */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Active Signals</span>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span className="text-sm text-white/90">Whale Accumulation</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="text-sm text-white/90">Fed Policy Shift</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                      <span className="text-sm text-white/90">AI Sector Momentum</span>
                    </div>
                  </div>
                </div>

                {/* Trend Direction */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
                  <span className="text-xs font-bold text-white/60 uppercase tracking-wider">Trend Analysis</span>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Crypto</span>
                      <span className="text-sm font-bold text-emerald-500">↗ Bullish</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Equities</span>
                      <span className="text-sm font-bold text-orange-500">→ Neutral</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white/70">Macro</span>
                      <span className="text-sm font-bold text-red-500">↘ Bearish</span>
                    </div>
                  </div>
                </div>

                {/* Trust Indicator */}
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-600/10 to-purple-600/10 border border-blue-500/20">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Verified Intelligence</span>
                  </div>
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
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-2">
                <Shield size={14} className="text-blue-400" />
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Verified Intelligence</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-white/60">Real-Time Data Stream</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/60">Sources:</span>
                <span className="text-xs text-white/80 font-mono">On-Chain • Exchange APIs • News Feeds</span>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5">
              <span className="text-xs text-white/40 uppercase tracking-wider">System Status:</span>
              <span className="text-xs text-emerald-500 font-bold">OPERATIONAL</span>
            </div>
          </div>
        </div>
      </section>

      {/* DECISION LAYER - Signal Summary */}
      <section className="border-b border-white/5 bg-gradient-to-b from-transparent to-blue-950/5">
        <div className="max-w-7xl mx-auto px-6 py-6">
          {/* Terminal Guide */}
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-950/20 to-purple-950/20 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <div className="shrink-0 p-2 rounded-lg bg-blue-600/20 border border-blue-500/30">
                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">How to Read This Terminal</span>
                  <span className="text-[10px] text-white/40">First time here?</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs text-white/70">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1 shrink-0" />
                    <div>
                      <span className="text-emerald-400 font-bold">Green signals</span> = Bullish momentum
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1 shrink-0" />
                    <div>
                      <span className="text-red-400 font-bold">Red alerts</span> = Risk events
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                    <div>
                      <span className="text-blue-400 font-bold">Confidence %</span> = Signal strength
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1 shrink-0" />
                    <div>
                      <span className="text-purple-400 font-bold">Impact score</span> = Market effect
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Market Sentiment */}
            <div className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 hover:bg-white/[0.04] transition-all cursor-pointer hover:scale-[1.02] relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Market Sentiment</span>
                  <div className="group/tooltip relative">
                    <svg className="w-3 h-3 text-white/30 hover:text-white/60 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap z-50 border border-white/10">
                      Overall market direction based on multiple indicators
                    </div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:shadow-[0_0_8px_rgba(16,185,129,0.6)] transition-shadow" />
              </div>
              <div className="text-2xl font-black text-emerald-500 mb-1">BULLISH</div>
              <div className="text-xs text-white/60">Risk-On Environment • 72h Momentum</div>
              <div className="absolute top-2 right-2 text-[9px] text-emerald-500/60 font-mono">Valid: 4h</div>
            </div>

            {/* Active Signals */}
            <div className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-blue-500/30 hover:bg-white/[0.04] transition-all cursor-pointer hover:scale-[1.02] relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Active Signals</span>
                  <div className="group/tooltip relative">
                    <svg className="w-3 h-3 text-white/30 hover:text-white/60 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap z-50 border border-white/10">
                      Number of actionable trading signals detected
                    </div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-blue-500 group-hover:shadow-[0_0_8px_rgba(59,130,246,0.6)] transition-shadow" />
              </div>
              <div className="text-2xl font-black text-blue-500 mb-1">12</div>
              <div className="text-xs text-white/60">8 High Priority • 4 Medium</div>
              <div className="absolute top-2 right-2 text-[9px] text-blue-500/60 font-mono">Live</div>
            </div>

            {/* Volatility Index */}
            <div className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-orange-500/30 hover:bg-white/[0.04] transition-all cursor-pointer hover:scale-[1.02] relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Volatility Index</span>
                  <div className="group/tooltip relative">
                    <svg className="w-3 h-3 text-white/30 hover:text-white/60 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap z-50 border border-white/10">
                      Expected price movement range (VIX-based)
                    </div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-orange-500 group-hover:shadow-[0_0_8px_rgba(249,115,22,0.6)] transition-shadow" />
              </div>
              <div className="text-2xl font-black text-orange-500 mb-1">MEDIUM</div>
              <div className="text-xs text-white/60">VIX 14.2 • -3.1% 24h</div>
              <div className="absolute top-2 right-2 text-[9px] text-orange-500/60 font-mono">Valid: 1h</div>
            </div>

            {/* Decision Confidence */}
            <div className="group p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-purple-500/30 hover:bg-white/[0.04] transition-all cursor-pointer hover:scale-[1.02] relative">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40 uppercase tracking-wider">Decision Confidence</span>
                  <div className="group/tooltip relative">
                    <svg className="w-3 h-3 text-white/30 hover:text-white/60 cursor-help" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="invisible group-hover/tooltip:visible absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg whitespace-nowrap z-50 border border-white/10">
                      AI model confidence in current analysis
                    </div>
                  </div>
                </div>
                <div className="w-2 h-2 rounded-full bg-purple-500 group-hover:shadow-[0_0_8px_rgba(168,85,247,0.6)] transition-shadow" />
              </div>
              <div className="text-2xl font-black text-purple-500 mb-1">87%</div>
              <div className="text-xs text-white/60">High Conviction • Low Noise</div>
              <div className="absolute top-2 right-2 text-[9px] text-purple-500/60 font-mono">Valid: 6h</div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-6 p-6 rounded-xl bg-gradient-to-r from-blue-600/10 to-purple-600/10 border border-blue-500/20">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-white mb-1">Get Real-Time Alerts</h3>
                <p className="text-sm text-white/60">Join 2,847 institutional traders receiving priority signals via Telegram</p>
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 border-2 border-[#020203]" />
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-500 to-blue-500 border-2 border-[#020203]" />
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 border-2 border-[#020203]" />
                  </div>
                  <span className="text-xs text-white/40">Beta users • Verified traders</span>
                </div>
              </div>
              <div className="flex gap-3">
                <a href="https://t.me/siaintel" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 flex items-center gap-2 shadow-lg shadow-blue-600/20">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                  </svg>
                  Join Telegram
                </a>
                <button className="px-6 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:scale-105 border border-white/10">
                  Email Alerts
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FLOW CONNECTOR */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-center py-3">
          <div className="flex items-center gap-2">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-blue-500/50" />
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-blue-500/50" />
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
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl">
                <AlertCircle size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-white">War Room Intelligence</h2>
                <p className="text-xs text-white/60 mt-1">Critical market events requiring immediate attention</p>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-bold uppercase tracking-wider">3 Active Alerts</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Alert 1 */}
            <div className="group p-4 rounded-xl bg-white/[0.02] border border-red-500/20 hover:border-red-500/40 hover:bg-white/[0.04] transition-all cursor-pointer hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500 group-hover:shadow-[0_0_8px_rgba(239,68,68,0.6)] transition-shadow" />
                  <span className="text-xs text-red-400 font-bold uppercase tracking-wider">Critical</span>
                </div>
                <span className="text-[10px] text-white/40">2m ago</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2 group-hover:text-red-400 transition-colors">Fed Emergency Meeting Rumors</h3>
              <p className="text-xs text-white/60 mb-3">Unconfirmed reports of emergency FOMC session. Market volatility expected.</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40">Impact:</span>
                  <span className="text-[10px] text-red-500 font-bold">EXTREME</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-red-500/10 rounded border border-red-500/20">
                  <svg className="w-3 h-3 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <span className="text-[10px] text-red-400 font-bold uppercase">Action Required</span>
                </div>
              </div>
            </div>

            {/* Alert 2 */}
            <div className="group p-4 rounded-xl bg-white/[0.02] border border-orange-500/20 hover:border-orange-500/40 hover:bg-white/[0.04] transition-all cursor-pointer hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 group-hover:shadow-[0_0_8px_rgba(249,115,22,0.6)] transition-shadow" />
                  <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">High</span>
                </div>
                <span className="text-[10px] text-white/40">15m ago</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2 group-hover:text-orange-400 transition-colors">Whale Movement Detected</h3>
              <p className="text-xs text-white/60 mb-3">$2.3B BTC transfer from Binance to unknown wallet. Accumulation signal.</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40">Impact:</span>
                  <span className="text-[10px] text-orange-500 font-bold">HIGH</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-500/10 rounded border border-orange-500/20">
                  <svg className="w-3 h-3 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="text-[10px] text-orange-400 font-bold uppercase">Monitor</span>
                </div>
              </div>
            </div>

            {/* Alert 3 */}
            <div className="group p-4 rounded-xl bg-white/[0.02] border border-yellow-500/20 hover:border-yellow-500/40 hover:bg-white/[0.04] transition-all cursor-pointer hover:scale-[1.02]">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 group-hover:shadow-[0_0_8px_rgba(234,179,8,0.6)] transition-shadow" />
                  <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider">Medium</span>
                </div>
                <span className="text-[10px] text-white/40">1h ago</span>
              </div>
              <h3 className="text-sm font-bold text-white mb-2 group-hover:text-yellow-400 transition-colors">AI Sector Momentum Shift</h3>
              <p className="text-xs text-white/60 mb-3">NVDA options flow suggests institutional positioning for earnings.</p>
              <div className="flex items-center justify-between pt-2 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-white/40">Impact:</span>
                  <span className="text-[10px] text-yellow-500 font-bold">MEDIUM</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-yellow-500/10 rounded border border-yellow-500/20">
                  <svg className="w-3 h-3 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[10px] text-yellow-400 font-bold uppercase">Tracked</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
