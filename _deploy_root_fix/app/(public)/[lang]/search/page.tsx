'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowLeft, Loader2, Zap, Radio, Globe, Activity, Terminal } from 'lucide-react'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { normalizePublicRouteLocale } from '@/lib/i18n/route-locales'

export default function SearchPage({ params }: { params: { lang: string } }) {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const { t } = useLanguage()
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const routeLang = normalizePublicRouteLocale(params.lang)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setIsLoading(true)

    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    fetch(`${origin}/api/content-buffer?action=feed`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          const q = query.toLowerCase()
          const filtered = data.data.filter(
            (item: any) =>
              item.title?.toLowerCase().includes(q) ||
              item.executive_summary?.toLowerCase().includes(q) ||
              item.report?.toLowerCase().includes(q) ||
              item.category?.toLowerCase().includes(q)
          )
          setResults(filtered)
        }
      })
      .catch(() => setResults([]))
      .finally(() => setIsLoading(false))
  }, [query])

  const labels: Record<
    string,
    { title: string; noResults: string; placeholder: string; back: string; scanning: string }
  > = {
    en: {
      title: 'Search_Results',
      noResults: 'No Intelligence Found',
      placeholder: 'Awaiting Query...',
      back: 'Back to Terminal',
      scanning: 'Scanning Global Nodes...',
    },
    tr: {
      title: 'Arama_Sonuçları',
      noResults: 'İstihbarat Bulunamadı',
      placeholder: 'Sorgu Bekleniyor...',
      back: 'Terminale Dön',
      scanning: 'Küresel Düğümler Taranıyor...',
    },
  }

  const l = labels[routeLang] || labels.en

  return (
    <div className="text-white selection:bg-blue-600 relative font-sans">
      <div className="container mx-auto px-4 lg:px-10 py-12 md:py-20 relative z-10">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-white/5 pb-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Link
                href={`/${routeLang}`}
                className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-blue-600 hover:border-blue-500 transition-all group shadow-xl"
              >
                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
              </Link>
              <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-[0.4em] flex items-center gap-2">
                <Terminal size={12} /> SEARCH_PROTOCOL: {query ? 'ACTIVE' : 'IDLE'}
              </div>
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none">
              {l.title}
            </h1>

            {query && (
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                  Query_ID:
                </span>
                <span className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-blue-400 text-xs font-mono">
                  "{query}"
                </span>
                <div className="h-4 w-px bg-white/10 mx-2" />
                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                  {results.length} NODES_FOUND
                </span>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-center gap-8 text-[9px] font-black text-white/20 uppercase tracking-[0.3em]">
            <div className="flex items-center gap-2">
              <Globe size={14} className="text-blue-500" /> OSINT_VERIFIED
            </div>
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-amber-500" /> REAL_TIME_INDEXING
            </div>
          </div>
        </div>

        {/* Loading State */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center justify-center py-32 gap-6"
            >
              <div className="relative">
                <Loader2 size={64} className="animate-spin text-blue-600 opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity size={24} className="text-blue-500 animate-pulse" />
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-400 animate-pulse">
                {l.scanning}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State / No Query */}
        {!query && !isLoading && (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-8 bg-white/[0.01] border border-white/5 rounded-[4rem] backdrop-blur-sm">
            <div className="p-8 bg-white/[0.03] rounded-full border border-white/5 relative group">
              <div className="absolute inset-0 bg-blue-500/10 blur-3xl rounded-full group-hover:bg-blue-500/20 transition-all" />
              <Search size={64} className="text-white/10 relative z-10" />
            </div>
            <p className="text-white/30 text-lg font-black uppercase italic tracking-[0.2em]">
              {l.placeholder}
            </p>
          </div>
        )}

        {/* No Results */}
        {query && !isLoading && results.length === 0 && (
          <div className="flex flex-col items-center justify-center py-40 text-center space-y-10 bg-white/[0.01] border border-white/5 rounded-[4rem] backdrop-blur-sm">
            <div className="p-8 bg-rose-500/10 rounded-full border border-rose-500/20 relative">
              <Radio size={64} className="text-rose-500/40" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                {l.noResults}
              </h2>
              <p className="text-slate-500 text-sm font-medium uppercase tracking-widest italic">
                SIA_SENTINEL could not locate any matching intelligence for "{query}"
              </p>
            </div>
            <Link
              href={`/${routeLang}`}
              className="px-10 py-5 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center gap-3"
            >
              <ArrowLeft size={16} /> {l.back}
            </Link>
          </div>
        )}

        {/* Results Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {results.map((item: any, idx: number) => (
            <Link key={item.id || idx} href={`/${routeLang}/news/${item.slug || item.id}`}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="p-8 rounded-[2.5rem] border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] hover:border-blue-500/30 transition-all group relative overflow-hidden h-full backdrop-blur-sm"
              >
                <div className="absolute top-0 right-0 p-8 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                  <Zap size={100} className="text-blue-500" />
                </div>

                <div className="flex items-center gap-4 mb-6 relative z-10">
                  <span className="px-3 py-1 rounded-full bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[8px] font-black uppercase tracking-[0.3em]">
                    {item.category || 'NEWS'}
                  </span>
                  <div className="h-px w-8 bg-white/10" />
                  <span className="text-[9px] text-white/20 font-mono tracking-widest uppercase">
                    {item.time || 'LIVE'}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter leading-tight group-hover:text-blue-400 transition-colors relative z-10 mb-4">
                  {item.title}
                </h3>

                <p className="text-sm text-slate-400 font-light leading-relaxed italic border-l border-white/10 pl-6 line-clamp-2 relative z-10">
                  {item.executive_summary || item.report || ''}
                </p>

                <div className="mt-8 pt-8 border-t border-white/5 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest">
                    <Activity size={12} className="text-blue-500" />
                    IMPACT_SCAN: {item.impact || 7}/10
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-lg">
                    <ArrowLeft size={16} className="rotate-180" />
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
