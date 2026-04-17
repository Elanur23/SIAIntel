'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield, Zap, Activity, TrendingUp, TrendingDown, AlertTriangle, Info, Play, Clock,
  Globe, Lock, ArrowUpRight, Mic2, Volume2, Brain, Cpu,
  Target, Server, Radio, Search, Filter, Hexagon, X, MapPin
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useMarketData } from '@/lib/hooks/useMarketData'
import useLivePulse from '@/lib/hooks/useLivePulse'
import { useLiveIntel } from '@/lib/hooks/useLiveIntel'

interface NewsItem {
  id: string
  title: string
  summary: string
  content: string
  insight: string
  risk: string
  category: string
  sentiment: string
  confidence: number
  impact: number
  region: string
  time: string
  image: string
}

interface Props {
  initialNews: NewsItem[]
  lang: string
}

export default function ClientPageWrapper({ initialNews = [], lang }: Props) {
  const { setLanguage, t } = useLanguage()
  const [activeTab, setActiveTab] = useState<'ALL' | 'AI' | 'STOCKS' | 'CRYPTO' | 'ECONOMY'>('ALL')
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const marketData = useMarketData(lang)
  const { intelligence: streamIntel = [] } = useLivePulse() || {}
  const { intelFeed: binanceIntel = [] } = useLiveIntel() || {}

  const allNews = useMemo(() => {
    const dbArticles = (initialNews || []).map(a => ({ ...a, source: 'DATABASE' }))
    const binanceLive = (binanceIntel || []).map(b => ({
      id: b.id, title: b.title, summary: b.executive_summary, content: b.report,
      insight: '', risk: '', category: 'CRYPTO', sentiment: b.sentiment,
      confidence: b.confidence, impact: b.market_impact || b.impact,
      region: 'GLOBAL', time: 'LIVE', image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800&auto=format&fit=crop',
      source: 'BINANCE'
    }))
    const streamLive = (streamIntel || []).map(s => ({
      id: s.id, title: s.title, summary: s.executive_summary, content: '',
      insight: s.sovereign_insight, risk: s.risk_assessment,
      category: s.region === 'US' ? 'STOCKS' : 'AI', sentiment: s.sentiment,
      confidence: s.confidence || 90, impact: s.impact, region: s.region,
      time: s.time, image: 'https://images.unsplash.com/photo-1642104704074-907c0698bcd9?q=80&w=800&auto=format&fit=crop',
      source: 'SIA_PULSE'
    }))

    const combined = [...dbArticles, ...binanceLive, ...streamLive]
    const sorted = combined.sort((a, b) => {
      const aIsLocal = a.region?.toLowerCase() === lang.toLowerCase() ? 1 : 0
      const bIsLocal = b.region?.toLowerCase() === lang.toLowerCase() ? 1 : 0
      if (aIsLocal !== bIsLocal) return bIsLocal - aIsLocal
      return (b.impact || 0) - (a.impact || 0)
    })

    let result = sorted;
    if (activeTab !== 'ALL') result = sorted.filter(n => n.category === activeTab)
    if (searchQuery) result = result.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()))
    return result
  }, [initialNews, binanceIntel, streamIntel, activeTab, searchQuery, lang])

  useEffect(() => {
    if (lang) setLanguage(lang as any)
  }, [lang, setLanguage])

  useEffect(() => {
    if (allNews.length > 0 && !selectedReport) {
      setSelectedReport(allNews[0])
    }
  }, [allNews, selectedReport])

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'BULLISH') return 'text-emerald-500'
    if (sentiment === 'BEARISH') return 'text-rose-500'
    return 'text-amber-500'
  }

  return (
    <div key={`sia-stable-wrapper-${lang}`}>
      <div className="fixed top-0 left-0 z-[100] px-3 py-1 bg-blue-600 text-[9px] font-black text-white uppercase tracking-widest shadow-2xl rounded-br-xl">
        SIA_STABLE_NODE_V18.5_LIVE // {lang.toUpperCase()}
      </div>

      <div className="h-11 bg-black/60 backdrop-blur-2xl border-b border-white/5 flex items-center overflow-hidden z-50 sticky top-20 shadow-xl">
        <div className="flex animate-scroll-ticker whitespace-nowrap items-center pl-4">
          {[...marketData, ...marketData].map((item, i) => (
            <div key={`${item.symbol}-${i}`} className={`flex items-center gap-3 px-6 border-r border-white/5 shrink-0 ${item.region?.toLowerCase() === lang.toLowerCase() ? 'bg-emerald-500/10' : ''}`}>
              <span className={`text-[9px] font-black uppercase tracking-widest shrink-0 ${item.region?.toLowerCase() === lang.toLowerCase() ? 'text-emerald-400' : 'text-blue-500'}`}>
                {item.region?.toLowerCase() === lang.toLowerCase() ? `● ${t('hub.verified')}` : item.region}
              </span>
              <span className="text-white/30 shrink-0">·</span>
              <span className="text-[12px] font-black text-white uppercase shrink-0">{item.symbol}</span>
              <span className="text-[12px] font-bold text-white/70 tabular-nums shrink-0">${item.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              <div className={`flex items-center gap-1 text-[10px] font-black shrink-0 ${item.positive ? 'text-emerald-500' : 'text-rose-500'}`}>
                {item.positive ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <main className="container mx-auto px-4 lg:px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-180px)] overflow-hidden">

          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6 overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/10 rounded-3xl backdrop-blur-3xl shadow-2xl">
              <div className="flex gap-2">
                {(['ALL', 'AI', 'STOCKS', 'CRYPTO', 'ECONOMY'] as const).map(tab => (
                  <button key={tab} onClick={() => setActiveTab(tab)} className={`px-6 py-2 rounded-xl text-[10px] font-black tracking-widest transition-all uppercase ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-white/20 hover:text-white'}`}>
                    {t(`hub.${tab.toLowerCase()}`)}
                  </button>
                ))}
              </div>
              <div className="hidden md:flex items-center bg-black/40 border border-white/5 rounded-2xl px-4 py-2 gap-3 w-64 focus-within:border-blue-500/50 transition-all">
                <Search size={16} className="text-white/20" />
                <input type="text" placeholder={t('hub.search')} className="bg-transparent border-none outline-none text-[10px] text-white w-full uppercase placeholder:text-white/10" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
              {allNews.map((news: any, idx) => (
                <motion.div key={news.id || idx} layout onClick={() => setSelectedReport(news)} className={`group relative flex gap-8 p-6 rounded-[2.5rem] border transition-all cursor-pointer overflow-hidden ${selectedReport?.id === news.id ? 'bg-gradient-to-br from-blue-600/[0.15] to-transparent border-blue-500/40 shadow-3xl' : 'bg-white/[0.02] border-white/5 hover:border-white/10'}`}>
                  <div className="w-52 h-36 rounded-[2rem] overflow-hidden bg-gray-950 shrink-0 relative border border-white/5 shadow-2xl">
                    <img src={news.image} className="w-full h-full object-cover opacity-40 transition-transform duration-1000 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className="px-3 py-1 bg-blue-600 rounded-full text-[8px] font-black text-white uppercase tracking-widest shadow-lg">{t(`hub.${news.category.toLowerCase()}`)}</div>
                      {news.region?.toLowerCase() === lang.toLowerCase() && (
                        <div className="px-3 py-1 bg-emerald-500 rounded-full text-[8px] font-black text-white uppercase tracking-widest flex items-center gap-1.5 shadow-xl animate-bounce">
                          <MapPin size={10} /> {t('hub.verified')}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-1 py-2 space-y-4">
                    <div className="flex items-center gap-4 text-[10px] font-black text-white/20 uppercase tracking-widest">
                      <span className="text-blue-500">{news.time}</span>
                      <div className="h-1 w-1 rounded-full bg-white/10" />
                      <span className={`italic font-black ${news.region?.toLowerCase() === lang.toLowerCase() ? 'text-emerald-500' : ''}`}>
                        {news.region?.toLowerCase() === lang.toLowerCase() ? t('hub.local_priority') : t('hub.global_dispatch')}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black text-white leading-tight group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter">{news.title}</h3>
                    <p className="text-[13px] text-slate-500 line-clamp-2 font-medium leading-relaxed italic border-l border-white/10 pl-4">"{news.summary || news.executive_summary}"</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          <aside className="hidden lg:col-span-2 lg:flex flex-col gap-6 border-x border-white/5 px-4 overflow-hidden bg-black/20 text-white/20">
            <div className="flex items-center justify-between text-white px-2 mt-4">
              <div className="flex items-center gap-2">
                <Radio size={14} className="text-blue-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">{t('hub.neural_live')}</span>
              </div>
              <Activity size={14} className="text-white/10" />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-1">
              {allNews.map((sig, idx) => (
                <motion.div key={idx} whileHover={{ scale: 1.02, x: 3, backgroundColor: 'rgba(37, 99, 235, 0.05)' }} onClick={() => setSelectedReport(sig)} className={`p-4 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${selectedReport?.id === sig.id ? 'bg-blue-600/10 border-blue-500/30 shadow-lg' : 'bg-white/[0.02] border-white/5'}`}>
                  <span className={`text-[7px] font-black uppercase mb-2 block ${getSentimentColor(sig.sentiment)}`}>{sig.sentiment || 'NEUTRAL'}</span>
                  <p className="text-[11px] text-white font-bold leading-tight uppercase tracking-tighter line-clamp-2">{sig.title}</p>
                </motion.div>
              ))}
            </div>
          </aside>

          {/* --- LAYER 3: COMMAND (SIA Analysis) --- */}
          <div className="col-span-12 lg:col-span-3 flex flex-col overflow-hidden bg-black/40 shadow-inner">
            <AnimatePresence mode="wait">
              {selectedReport ? (
                <motion.div
                  key={selectedReport.id || 'report'}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 flex flex-col gap-6 p-4"
                  itemScope
                  itemType="https://schema.org/NewsArticle"
                >
                  <div className="bg-[#0A0A0C] border border-white/10 rounded-[3rem] p-8 shadow-3xl relative overflow-hidden flex-1 group">
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full group-hover:bg-blue-600/20 transition-all duration-1000" />
                    <div className="flex items-center gap-3 text-blue-500 mb-8 relative z-10 font-black uppercase tracking-[0.4em] text-[11px]">
                      <Brain size={24}/> {t('hub.analysis')}
                    </div>

                    {/* Google SEO Improvement: itemProp="headline" */}
                    <h2 itemProp="headline" className="text-3xl font-black text-white leading-none tracking-tighter uppercase italic mb-10 relative z-10">
                      {selectedReport.title}
                    </h2>

                    {/* Google SEO Improvement: itemProp="abstract" and aria-live */}
                    <div
                      className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 relative shadow-inner overflow-hidden mb-8"
                      aria-live="polite"
                    >
                      <p
                        itemProp="abstract"
                        className="text-[14px] text-slate-300 leading-relaxed font-bold italic opacity-90"
                      >
                        "{selectedReport.summary || selectedReport.executive_summary}..."
                      </p>
                    </div>

                    <button onClick={() => setIsPlaying(!isPlaying)} className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase tracking-widest text-[12px] flex items-center justify-center gap-4 shadow-2xl hover:bg-blue-600 hover:text-white transition-all active:scale-95 shadow-blue-600/20">
                      {isPlaying ? (
                        <div className="flex items-center gap-1.5 h-5">
                          {[...Array(5)].map((_, i) => (<motion.div key={i} animate={{ height: [4, 20, 4] }} transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }} className="w-1.5 bg-current rounded-full" />))}
                        </div>
                      ) : <Volume2 size={24}/>}
                      {isPlaying ? t('hub.node_linked') : t('hub.listen')}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="no-report"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex-1 flex items-center justify-center text-white/10"
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  )
}
