"use client"

import Link from "next/link"
import { Clock, ArrowRight, Activity, Zap, Shield, TrendingUp, Monitor, Globe } from "lucide-react"
import { motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"

interface Article {
  id: string
  title: string
  summary: string
  category: string
  publishedAt: Date
  imageUrl?: string | null
}

interface TopStoriesGridProps {
  articles: Article[]
  lang: string
}

const getCategoryBadge = (category: string) => {
  const configs: Record<string, { bg: string; text: string; icon: any }> = {
    'AI': { bg: 'bg-blue-600/10 border-blue-500/20', text: 'text-blue-600 dark:text-blue-500', icon: Zap },
    'CRYPTO': { bg: 'bg-yellow-500/10 border-yellow-500/20', text: 'text-yellow-600 dark:text-yellow-500', icon: TrendingUp },
    'MACRO': { bg: 'bg-purple-600/10 border-purple-500/20', text: 'text-purple-600 dark:text-purple-500', icon: Activity },
    'STOCKS': { bg: 'bg-emerald-600/10 border-emerald-500/20', text: 'text-emerald-600 dark:text-emerald-500', icon: Shield },
    'ECONOMY': { bg: 'bg-blue-600/10 border-blue-500/20', text: 'text-blue-600 dark:text-blue-500', icon: Globe },
    'TECH': { bg: 'bg-cyan-600/10 border-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-500', icon: Monitor },
  }

  const config = configs[category] || { bg: 'bg-blue-600/10 border-blue-500/20', text: 'text-blue-600 dark:text-blue-500', icon: Activity }
  const Icon = config.icon

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.2em] ${config.bg} ${config.text} backdrop-blur-md`}>
      <Icon className="h-3 w-3" />
      {category}
    </span>
  )
}

export function TopStoriesGrid({ articles, lang }: TopStoriesGridProps) {
  if (!articles || articles.length === 0) {
    return null
  }

  return (
    <section className="relative overflow-hidden border-b border-black/5 dark:border-white/5 py-20 lg:py-24">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(37,99,235,0.03)_0%,_transparent_40%)]" />

      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 shadow-lg shadow-blue-900/40">
              <Activity className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                SIA_GLOBAL_INTEL<span className="text-blue-500">_STREAMS</span>
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/30">
                  REALTIME_SIGNAL_PROCESSING_NODE_v4.2
                </span>
              </div>
            </div>
          </div>

          <Link
            href={`/${lang}/news`}
            className="flex items-center gap-3 rounded-2xl bg-black/5 dark:bg-white/5 px-6 py-3.5 text-[10px] font-black uppercase tracking-[0.3em] text-slate-700 dark:text-white/80 transition-all hover:bg-black/10 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white border border-black/5 dark:border-white/10 backdrop-blur-md group"
          >
            ALL_INTEL_REPORTS
            <ArrowRight className="h-4 w-4 text-blue-500 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((story, index) => {
            return (
              <motion.article
                key={story.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1, cubicBezier: [0.16, 1, 0.3, 1] }}
                className="group h-full"
              >
                <Link
                  href={`/${lang}/news/${story.id}`}
                  className="holographic-card relative flex h-full flex-col overflow-hidden rounded-[2.5rem] border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-blue-600/30 dark:hover:border-blue-500/30"
                >
                  {/* Image ENGINE */}
                  <div className="aspect-[16/10] w-full relative overflow-hidden bg-black/40">
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                    {story.imageUrl ? (
                      <img 
                        src={story.imageUrl} 
                        alt={story.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-900/20 to-transparent">
                        <Activity className="h-12 w-12 text-blue-500/20 animate-pulse" />
                      </div>
                    )}

                    <div className="absolute top-4 left-4 z-20">
                      {getCategoryBadge(story.category)}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-8">
                    <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/30">
                      <Clock className="h-3.5 w-3.5 text-blue-500" />
                      {formatDistanceToNow(new Date(story.publishedAt), { addSuffix: true })}
                    </div>

                    <h3 className="mb-4 font-heading text-xl font-black leading-tight text-slate-900 dark:text-white transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-500 line-clamp-2 uppercase tracking-tight">
                      {story.title}
                    </h3>

                    <p className="mb-8 flex-1 text-sm font-medium leading-relaxed text-slate-500 dark:text-white/40 line-clamp-2 uppercase tracking-widest text-pretty">
                      {story.summary}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.4em] text-blue-600 dark:text-blue-500">
                      ACCESS_SIGNAL
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>

                  {/* Scanning overlay */}
                  <div className="absolute top-0 left-0 h-[1px] w-full bg-blue-500/30 -translate-y-full transition-all duration-1000 group-hover:translate-y-[400px]" />
                </Link>
              </motion.article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
