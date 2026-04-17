"use client"

import Link from "next/link"
import { TrendingUp, ChevronRight, Activity, Zap, Shield, TrendingDown } from "lucide-react"
import { motion } from "framer-motion"

interface Article {
  id: string
  title: string
  category: string
  confidence?: number
  marketImpact?: number
}

interface TrendingNowProps {
  articles: Article[]
  lang: string
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, any> = {
    'AI': Zap,
    'CRYPTO': TrendingUp,
    'MACRO': Activity,
    'STOCKS': Shield,
  }
  return icons[category] || Activity
}

export function TrendingNow({ articles, lang }: TrendingNowProps) {
  if (!articles || articles.length === 0) {
    return null
  }

  return (
    <section className="relative overflow-hidden border-b border-black/5 dark:border-white/5 py-20 lg:py-24">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.03)_0%,_transparent_40%)]" />

      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="mb-12 flex items-center gap-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 shadow-lg shadow-blue-900/40">
            <TrendingUp className="h-6 w-6 text-blue-500" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
              TRENDING_NOW<span className="text-blue-500">_TRAFFIC</span>
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/30">
                HIGH_IMPACT_INTEL_CONVERGENCE_v3.0
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2 lg:gap-6">
          {articles.map((item, index) => {
            const isHot = (item.marketImpact || 0) >= 7 || (item.confidence || 0) >= 85
            const Icon = getCategoryIcon(item.category)

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05, cubicBezier: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  href={`/${lang}/news/${item.id}`}
                  className="holographic-card group flex items-center gap-6 rounded-3xl border border-black/5 dark:border-white/5 bg-black/[0.01] dark:bg-white/[0.01] p-5 backdrop-blur-md transition-all hover:bg-black/[0.04] dark:hover:bg-white/[0.04] hover:border-blue-600/30 dark:hover:border-blue-500/30"
                >
                  {/* Digital Index */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-black/5 dark:bg-black/40 border border-black/5 dark:border-white/5 font-mono text-[11px] font-black text-blue-600/60 dark:text-blue-500/60 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-500 group-hover:bg-blue-600/10">
                    {String(index + 1).padStart(2, "0")}
                  </div>

                  {/* Signal Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white/80 transition-colors group-hover:text-slate-900 dark:group-hover:text-white line-clamp-1">
                      {item.title}
                    </h3>
                    <div className="mt-1.5 flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <Icon className="h-3 w-3 text-blue-600/40 dark:text-blue-500/40" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-white/20">{item.category}</span>
                      </div>

                      {isHot && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-500/10 border border-red-500/20">
                          <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-red-600 dark:text-red-500">
                            HIGH_VOLATILITY
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Directional Chevron */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all group-hover:bg-blue-600/10 group-hover:translate-x-1">
                    <ChevronRight className="h-5 w-5 text-slate-300 dark:text-white/20 transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-500" />
                  </div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
