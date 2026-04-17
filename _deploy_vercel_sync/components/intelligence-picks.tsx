"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, TrendingUp, Clock, Activity, Zap, Shield, Globe, Monitor } from "lucide-react"
import { motion } from "framer-motion"
import { formatDistanceToNow } from "date-fns"

interface Article {
  id: string
  title: string
  summary: string
  category: string
  publishedAt: Date
  confidence?: number
}

interface IntelligencePicksProps {
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
    'TECH': { bg: 'bg-cyan-600/10 border-cyan-500/20', text: 'text-cyan-600 dark:text-cyan-500', icon: Activity },
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

export function IntelligencePicks({ articles, lang }: IntelligencePicksProps) {
  if (!articles || articles.length === 0) {
    return null
  }

  const featuredPick = articles[0]
  const secondaryPicks = articles.slice(1, 3)

  return (
    <section className="relative overflow-hidden border-b border-black/5 dark:border-white/5 py-20 lg:py-24">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(37,99,235,0.03)_0%,_transparent_40%)]" />

      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="mb-12 flex items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 shadow-lg shadow-blue-900/40">
            <BookOpen className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
              SIA_INTEL<span className="text-blue-500">_PICKS</span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/30">
                CURATED_PRIORITY_SIGNALS_v1.0
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Featured Pick */}
          {featuredPick && (
            <motion.article
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
              className="lg:row-span-2"
            >
              <Link
                href={`/${lang}/news/${featuredPick.id}`}
                className="holographic-card relative flex h-full flex-col overflow-hidden rounded-[3rem] border border-blue-500/20 bg-blue-600/[0.03] p-10 backdrop-blur-md transition-all hover:bg-blue-600/[0.08] hover:border-blue-500/40 shadow-xl"
              >
                <div className="mb-8 flex items-center gap-4">
                  {getCategoryBadge(featuredPick.category)}
                  <div className="h-px flex-1 bg-black/5 dark:bg-white/5" />
                </div>

                <h3 className="mb-8 font-heading text-3xl font-black leading-tight text-slate-900 dark:text-white transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-500 lg:text-4xl uppercase tracking-tighter">
                  {featuredPick.title}
                </h3>

                <p className="mb-10 flex-1 text-lg font-medium leading-relaxed text-slate-500 dark:text-white/40 line-clamp-4 uppercase tracking-widest text-pretty">
                  {featuredPick.summary}
                </p>

                <div className="flex items-center justify-between border-t border-black/5 dark:border-white/5 pt-8">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                      <Zap className="h-5 w-5 text-blue-500" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60">SIA_RESEARCH_UNIT</span>
                      <span className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/20">
                        {formatDistanceToNow(new Date(featuredPick.publishedAt), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 transition-transform group-hover:translate-x-1">
                    ACCESS_FULL_INTEL
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </Link>
            </motion.article>
          )}

          {/* Secondary Picks */}
          {secondaryPicks.map((pick, index) => (
            <motion.article
              key={pick.id}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.2, cubicBezier: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={`/${lang}/news/${pick.id}`}
                className="holographic-card flex h-full flex-col overflow-hidden rounded-3xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] p-8 backdrop-blur-md transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-blue-600/30 dark:hover:border-blue-500/30"
              >
                <div className="mb-4 flex items-center justify-between">
                  {getCategoryBadge(pick.category)}
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
                    <Clock className="h-3 w-3 text-blue-500" />
                    {formatDistanceToNow(new Date(pick.publishedAt), { addSuffix: true })}
                  </div>
                </div>

                <h3 className="mb-4 font-heading text-xl font-black leading-snug text-slate-900 dark:text-white transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-500 line-clamp-2 uppercase tracking-tight">
                  {pick.title}
                </h3>

                <p className="mb-6 flex-1 text-sm font-medium leading-relaxed text-slate-500 dark:text-white/40 line-clamp-2 uppercase tracking-widest text-pretty">
                  {pick.summary}
                </p>

                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500 opacity-60 transition-opacity group-hover:opacity-100">
                  ESTABLISH_UPLINK
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}
