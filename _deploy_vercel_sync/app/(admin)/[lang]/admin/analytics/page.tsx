'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  MousePointer2,
  TrendingUp,
  Zap,
  Globe,
  ShieldCheck,
  Activity,
  ArrowUpRight,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'
import Link from 'next/link'

export default function SEOAnalyticsPage() {
  const [stats, setStats] = useState({
    impressions: 42800,
    clicks: 3120,
    ctr: 7.2,
    indexedPages: 154,
  })

  // Simüle edilmiş Google bot tarama verileri
  const crawlLogs = [
    {
      time: '2 mins ago',
      node: 'Googlebot-News',
      status: 'SUCCESS',
      target: '/en/news/mbridge-2026',
    },
    {
      time: '14 mins ago',
      node: 'SIA_Indexer',
      status: 'NOTIFIED',
      target: '/tr/news/nvidia-shock',
    },
    {
      time: '45 mins ago',
      node: 'Googlebot-Image',
      status: 'SUCCESS',
      target: '/public/images/ai-hero.jpg',
    },
    { time: '1 hour ago', node: 'Bingbot', status: 'SUCCESS', target: '/rss.xml' },
  ]

  return (
    <div className="min-h-screen bg-[#020203] text-white p-6 lg:p-10 font-sans relative overflow-hidden">
      {/* Visual Depth */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-10 relative z-10">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                <Activity size={12} className="animate-pulse" />
                DISCOVER_ANALYTICS_PROTOCOL
              </div>
              <div className="text-white/20 text-[9px] font-mono tracking-widest uppercase">
                V6.0_STABLE
              </div>
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic text-white">
              SEO_COMMAND_DASHBOARD
            </h1>
            <p className="text-sm text-slate-500 font-medium max-w-xl">
              Monitor Google Discover impact, indexing velocity, and global E-E-A-T performance.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
              Export_Report
            </button>
            <button className="px-6 py-3 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20">
              Sync_Search_Console
            </button>
          </div>
        </header>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              label: 'DISCOVER_IMPRESSIONS',
              value: stats.impressions.toLocaleString(),
              sub: '+12% vs last 24h',
              icon: Search,
              color: 'text-blue-500',
            },
            {
              label: 'DISCOVER_CLICKS',
              value: stats.clicks.toLocaleString(),
              sub: '+8.4% growth',
              icon: MousePointer2,
              color: 'text-emerald-500',
            },
            {
              label: 'AVG_CTR_RATE',
              value: stats.ctr + '%',
              sub: 'Institutional standard',
              icon: TrendingUp,
              color: 'text-orange-500',
            },
            {
              label: 'INDEXED_ENTITIES',
              value: stats.indexedPages,
              sub: '9 Nodes Synced',
              icon: Globe,
              color: 'text-purple-500',
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group"
            >
              <div className="flex justify-between items-start mb-6">
                <div className={`p-3 rounded-2xl bg-black/40 border border-white/5 ${stat.color}`}>
                  <stat.icon size={20} />
                </div>
                <ArrowUpRight
                  size={16}
                  className="text-white/10 group-hover:text-white transition-colors"
                />
              </div>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">
                {stat.label}
              </p>
              <h3 className="text-3xl font-black text-white italic tabular-nums">{stat.value}</h3>
              <p className="text-[10px] font-bold text-emerald-500 mt-3 uppercase tracking-widest">
                {stat.sub}
              </p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Real-time Crawl Logs (Terminal Style) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 h-full backdrop-blur-xl">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
                    <Zap className="text-blue-500" size={20} />
                  </div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter">
                    Live_Crawl_Telemetry
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black uppercase tracking-widest animate-pulse">
                  Monitoring_Active
                </span>
              </div>

              <div className="space-y-2 font-mono">
                {crawlLogs.map((log, idx) => (
                  <div
                    key={idx}
                    className="grid grid-cols-12 gap-4 p-4 rounded-xl hover:bg-white/[0.03] transition-colors text-[11px] items-center border-b border-white/[0.02]"
                  >
                    <div className="col-span-2 text-white/30">{log.time}</div>
                    <div className="col-span-3 text-blue-400 font-bold uppercase tracking-tighter">
                      [{log.node}]
                    </div>
                    <div className="col-span-5 text-white/60 truncate">{log.target}</div>
                    <div className="col-span-2 text-right">
                      <span
                        className={`px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[9px] font-black`}
                      >
                        {log.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-6 bg-black/40 rounded-[2rem] border border-white/5 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                    SIA_INDEXING_API
                  </p>
                  <p className="text-sm font-bold text-white uppercase italic">
                    Status: Fully Operational
                  </p>
                </div>
                <CheckCircle2 className="text-emerald-500" size={24} />
              </div>
            </div>
          </div>

          {/* Discover Health Checklist */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-10 rounded-[3rem] bg-gradient-to-br from-orange-600/10 to-transparent border border-orange-500/20 space-y-8">
              <div className="flex items-center gap-3 text-orange-500">
                <BarChart3 size={20} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.4em]">
                  DISCOVER_HEALTH_AUDIT
                </h3>
              </div>

              <div className="space-y-6">
                {[
                  { name: 'Sitemap_Freshness', score: 100, status: 'OPTIMAL' },
                  { name: 'RSS_Feed_Velocity', score: 94, status: 'STABLE' },
                  { name: 'E-E-A-T_Schema_Link', score: 88, status: 'VERIFIED' },
                  { name: 'Instant_Index_API', score: 100, status: 'READY' },
                ].map((item) => (
                  <div key={item.name} className="space-y-3">
                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                      <span className="text-white/40">{item.name}</span>
                      <span className="text-orange-500">{item.status}</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/5">
                <div className="flex gap-3 items-start p-4 bg-black/40 rounded-2xl border border-white/5">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-relaxed uppercase font-bold italic">
                    Warning: 2 images in /news lack 1200px Large_Preview compliance.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 space-y-6">
              <h3 className="text-sm font-black uppercase italic tracking-tighter">
                System_Insights
              </h3>
              <p className="text-[11px] text-slate-500 leading-relaxed italic">
                "Global liquidity reports are currently driving 64% of Discover impressions.
                SIA_SENTINEL suggests focusing on mBridge and CBDC nodes for Q1 saturation."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
