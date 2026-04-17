"use client"

import Link from "next/link"
import { ArrowRight, Clock, Shield, Zap, TrendingUp, Activity, Globe, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface HeroSectionProps {
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
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${config.bg} ${config.text} shadow-sm backdrop-blur-md`}>
      <Icon className="h-3 w-3" />
      {category}
    </span>
  )
}

export function HeroSection({ articles, lang }: HeroSectionProps) {
  const heroStory = articles[0]
  const secondaryStories = articles.slice(1, 3)

  if (!heroStory) {
    return (
      <section className="relative overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-24 border-b border-black/5 dark:border-white/5">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 mb-6">
            <Activity className="h-8 w-8 text-blue-500 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
            SYSTEM_SCAN_IN_PROGRESS...
          </h2>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-24 border-b border-black/5 dark:border-white/5">
      {/* BACKGROUND DEPTH ENGINE */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(37,99,235,0.08)_0%,_transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,_rgba(37,99,235,0.05)_0%,_transparent_40%)]" />

      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          {/* MAIN INTEL NODE */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, cubicBezier: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-2"
          >
            <Link href={`/${lang}/news/${heroStory.id}`} className="group relative block">
              <div className="mb-6 flex flex-wrap items-center gap-4">
                {getCategoryBadge(heroStory.category)}
                <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-white/30">
                  <Clock className="h-3 w-3 text-blue-500" />
                  {formatDistanceToNow(new Date(heroStory.publishedAt), { addSuffix: true })}
                </span>
                <div className="h-px flex-1 bg-black/5 dark:bg-white/5" />
              </div>

              <h1 className="mb-8 text-balance font-heading text-4xl font-black leading-[1.1] tracking-tighter text-slate-900 dark:text-white transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-500 sm:text-5xl lg:text-7xl">
                {heroStory.title}
              </h1>

              <p className="mb-10 max-w-3xl text-pretty text-lg font-medium leading-relaxed text-slate-600 dark:text-white/50 lg:text-xl">
                {heroStory.summary}
              </p>

              <div className="flex flex-wrap items-center gap-6">
                <Button className="h-14 rounded-2xl bg-blue-600 px-8 text-[11px] font-black uppercase tracking-[0.3em] text-white shadow-2xl shadow-blue-600/30 transition-all hover:bg-blue-700 dark:hover:bg-blue-500 hover:scale-105 active:scale-95">
                  ACCESS_INTEL_REPORT
                  <ArrowRight className="ml-3 h-4 w-4" />
                </Button>

                {heroStory.confidence && (
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">CONF_LEVEL</span>
                    <div className="flex items-center gap-3">
                      <div className="h-1.5 w-32 rounded-full bg-black/5 dark:bg-white/5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${heroStory.confidence}%` }}
                          transition={{ duration: 1.5, delay: 0.5 }}
                          className="h-full bg-blue-600 dark:bg-blue-500 shadow-[0_0_10px_rgba(37,99,235,0.8)]"
                        />
                      </div>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-500">{heroStory.confidence}%</span>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          </motion.div>

          {/* SECONDARY SIGNAL NODES */}
          <div className="flex flex-col gap-6">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/20">
              CORRELATED_SIGNALS
            </h4>

            {secondaryStories.map((story, index) => (
              <motion.div
                key={story.id}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 + index * 0.2 }}
              >
                <Link
                  href={`/${lang}/news/${story.id}`}
                  className="holographic-card group block rounded-3xl border border-black/5 dark:border-white/5 bg-white/[0.02] dark:bg-white/[0.02] p-6 backdrop-blur-md transition-all hover:bg-white/[0.05] hover:border-blue-600/30 dark:hover:border-blue-500/30"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-500">
                      {story.category}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20">
                      {formatDistanceToNow(new Date(story.publishedAt), { addSuffix: true })}
                    </span>
                  </div>
                  <h3 className="text-base font-black leading-snug text-slate-800 dark:text-white/80 transition-colors group-hover:text-slate-900 dark:group-hover:text-white">
                    {story.title}
                  </h3>
                </Link>
              </motion.div>
            ))}

            {/* QUICK LINK PANEL */}
            <div className="mt-4 rounded-3xl border border-dashed border-black/10 dark:border-white/10 p-6">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 dark:text-white/40">SYSTEM_STATUS</span>
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 leading-relaxed">
                Neural networks actively scanning SEC EDGAR and central bank transcripts for predictive shocks.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
