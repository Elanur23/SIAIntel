'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Shield, Radio, Share2, AlertTriangle, Lightbulb, Satellite, Crosshair, ArrowRight, Zap } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLiveIntel } from '@/lib/hooks/useLiveIntel'
import LegalStamp from '@/components/LegalStamp'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import SiaRadarVisual from '@/components/SiaRadarVisual'
import LiveAnalystTrigger from '@/components/LiveAnalystTrigger'

interface IntelligenceReport {
  id: string
  category: string
  region: string
  flag: string
  impact: number
  confidence: number
  publishDate: string
  readTime: string
  featured: boolean
  data: Record<string, {
    title: string
    summary: string
    content: string
    siaInsight?: string
    riskShield?: string
    socialSnippet?: string
  }>
  metrics: Array<{
    labels: Record<string, string>
    value: string
  }>
}

interface IntelligenceClientProps {
  lang: string
  reports: IntelligenceReport[]
}

export default function IntelligenceClient({ lang, reports }: IntelligenceClientProps) {
  const { setLanguage, t } = useLanguage()
  const [mounted, setMounted] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [warRoomFeed, setWarRoomFeed] = useState<any[]>([])

  const getLoc = (report: IntelligenceReport, field: string) => {
    return report.data[lang]?.[field as keyof typeof report.data[string]] ||
           report.data['en']?.[field as keyof typeof report.data[string]] || ''
  }

  const getMetricLabel = (metric: any) => {
    return metric.labels[lang] || metric.labels['en'] || ''
  }

  const handleTransmit = (report: IntelligenceReport) => {
    const snippet = report.data[lang]?.socialSnippet || report.data['en']?.socialSnippet || ''
    navigator.clipboard.writeText(snippet)
    toast.success(t('common.share_success') || 'Intelligence Transmitted')
  }

  useEffect(() => {
    setMounted(true)
    if (lang) setLanguage(lang as any)
  }, [lang, setLanguage])

  useEffect(() => {
    const load = () => {
      fetch(`/api/content-buffer?action=feed&lang=${lang}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d?.success && Array.isArray(d.data)) setWarRoomFeed(d.data)
        })
        .catch((e: Error) => console.warn('[INTELLIGENCE] Feed fetch failed:', e.message))
    }
    load()
    const interval = setInterval(load, 45000)
    return () => clearInterval(interval)
  }, [lang])

  const categories = ['ALL', 'AI', 'SOVEREIGN', 'CRYPTO', 'STOCKS', 'ECONOMY', 'MACRO']

  const filteredReports = useMemo(() => {
    if (selectedCategory === 'ALL') return reports
    return reports.filter(r => r.category === selectedCategory)
  }, [selectedCategory, reports])

  if (!mounted) return <div className="min-h-screen bg-[#020203]" />

  return (
    <div className="text-white selection:bg-blue-600 relative font-sans">
      <div className="container mx-auto px-4 lg:px-10 py-12 relative z-10">
        <section className="mb-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4">
              <div className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-bold uppercase tracking-[0.4em] flex items-center gap-2">
                <Radio size={12} className="animate-pulse" />
                {t('page.radar_system_live')}
              </div>
              <div className="text-white/20 text-[9px] font-mono">{t('page.radar_node')}</div>
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-6xl md:text-8xl font-black text-white uppercase italic tracking-tighter leading-[0.8] block">
              SIA <span className="text-blue-600">RADAR</span>
            </motion.h1>

            <div className="flex flex-wrap gap-4 mt-6">
              <LiveAnalystTrigger label="Live_AI_Briefing" />
            </div>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="text-xl md:text-2xl text-slate-400 font-light max-w-2xl leading-relaxed border-l-2 border-blue-600/50 pl-10 italic mt-10">
              {t('page.radar_subtitle')}
            </motion.p>

            <div className="flex items-center gap-10 pt-4">
              <div className="text-left">
                <div className="text-4xl font-black text-white tabular-nums">{filteredReports.length}</div>
                <div className="text-[10px] text-slate-600 uppercase font-black tracking-[0.2em]">{t('page.radar_reports')}</div>
              </div>
              <div className="w-px h-12 bg-white/5" />
              <div className="text-left">
                <div className="text-4xl font-black text-emerald-500 tabular-nums">94%</div>
                <div className="text-[10px] text-slate-600 uppercase font-black tracking-[0.2em]">{t('page.radar_accuracy')}</div>
              </div>
              <div className="w-px h-12 bg-white/5" />
              <div className="text-left">
                <div className="flex items-center gap-2 text-4xl font-black text-orange-500">
                  <span className="w-3 h-3 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
                  LIVE
                </div>
                <div className="text-[10px] text-slate-600 uppercase font-black tracking-[0.2em]">{t('page.radar_realtime')}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative flex justify-center items-center">
            <SiaRadarVisual />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-500/20">
              <Crosshair size={300} strokeWidth={0.5} />
            </div>
          </div>
        </section>

        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-8 mb-12 border-b border-white/5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-8 py-4 rounded-2xl text-[10px] font-black tracking-[0.2em] transition-all uppercase whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-[0_0_25px_rgba(37,99,235,0.3)] scale-105'
                  : 'bg-white/[0.03] border border-white/5 text-slate-500 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {t(`page.radar_filter_${cat === 'ALL' ? 'all' : cat.toLowerCase()}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-12 mb-20">
          {filteredReports.filter(r => r.featured).map((report, index) => (
            <motion.article
              key={report.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative bg-[#0A0A0C]/80 border border-white/10 rounded-[4rem] overflow-hidden backdrop-blur-xl shadow-2xl"
            >
              <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                <Satellite size={200} />
              </div>

              <div className="relative p-10 lg:p-16 grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
                <div className="lg:col-span-8 space-y-10">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="px-4 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-full">
                      {report.category} REPORT
                    </span>
                    <span className="px-4 py-2 bg-white/5 border border-white/10 text-white/60 text-[9px] font-black uppercase tracking-[0.3em] rounded-full">
                      {report.region} {report.flag}
                    </span>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-[0.3em] rounded-full">
                      <Shield size={12} /> {report.confidence}% TRUST_NODE
                    </div>
                  </div>

                  <h2 className="text-4xl lg:text-7xl font-black text-white leading-[1] tracking-tighter uppercase italic group-hover:text-blue-400 transition-colors">
                    {getLoc(report, 'title')}
                  </h2>

                  <p className="text-xl lg:text-2xl text-slate-400 font-light leading-relaxed italic border-l-4 border-blue-600/50 pl-10">
                    {getLoc(report, 'summary')}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] relative overflow-hidden group/box">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Lightbulb size={40} className="text-blue-400" />
                      </div>
                      <div className="flex items-center gap-3 mb-4 text-blue-400">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">SIA_INSIGHT</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed relative z-10">{getLoc(report, 'siaInsight')}</p>
                    </div>

                    <div className="p-8 bg-red-600/5 border border-red-500/20 rounded-[2.5rem] relative overflow-hidden group/box">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                        <AlertTriangle size={40} className="text-red-400" />
                      </div>
                      <div className="flex items-center gap-3 mb-4 text-red-400">
                        <span className="text-[10px] font-black uppercase tracking-[0.4em]">RISK_SHIELD</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed relative z-10">{getLoc(report, 'riskShield')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-8">
                    {report.metrics.map((m, i) => (
                      <div key={i} className="p-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] hover:bg-white/[0.04] transition-colors group/metric">
                        <div className="text-[9px] text-slate-600 uppercase font-black mb-4 tracking-widest group-hover/metric:text-blue-400 transition-colors">{getMetricLabel(m)}</div>
                        <div className="text-3xl font-black text-white font-mono">{m.value}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col gap-8">
                  <div className="bg-blue-600/5 border border-blue-500/20 rounded-[3rem] p-10 space-y-8 relative overflow-hidden">
                    <div className="absolute top-[-20%] left-[-20%] w-[150%] h-[150%] bg-[radial-gradient(circle_at_center,rgba(37,99,235,0.1)_0%,transparent_70%)] animate-pulse" />
                    <div className="flex items-center gap-4 text-orange-500 relative z-10">
                      <Zap size={28} className="fill-orange-500" />
                      <span className="text-[10px] font-black uppercase tracking-[0.4em]">IMPACT_SCALE</span>
                    </div>
                    <div className="text-8xl font-black text-white tabular-nums relative z-10">{report.impact}<span className="text-3xl text-white/20">/10</span></div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <Link href={`/${lang}/intelligence/${report.id}`} className="w-full bg-white text-black py-7 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-blue-600 hover:text-white transition-all shadow-xl shadow-black/20">
                      {t('page.radar_open_report')} <ArrowRight size={20} />
                    </Link>
                    <button
                      onClick={() => handleTransmit(report)}
                      className="w-full bg-white/5 border border-white/10 text-white py-7 rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-4 hover:bg-white/10 transition-all backdrop-blur-sm"
                    >
                      <Share2 size={20} /> {t('page.radar_transmit')}
                    </button>
                  </div>
                  <div className="pt-4">
                    <LegalStamp lang={lang} />
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </div>
  )
}
