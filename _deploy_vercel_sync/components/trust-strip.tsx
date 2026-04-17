"use client"

import { Shield, BarChart2, Globe, Database, Activity, Zap, Cpu, Lock, CheckCircle2 } from "lucide-react"
import { motion } from "framer-motion"

const trustItems = [
  {
    icon: Shield,
    title: "INTERNAL_SIGNAL_FRAMEWORK",
    description: "Proprietary indicators built on institutional-grade data matrix",
    color: "text-blue-600 dark:text-blue-500"
  },
  {
    icon: BarChart2,
    title: "EDITORIAL_ANALYSIS_V2",
    description: "Expert commentary from experienced market analysts and quants",
    color: "text-emerald-600 dark:text-emerald-500"
  },
  {
    icon: Globe,
    title: "GLOBAL_LOCALIZATION",
    description: "Available in 9 languages for global accessibility and coverage",
    color: "text-purple-600 dark:text-purple-500"
  },
  {
    icon: Database,
    title: "DATA_DRIVEN_COVERAGE",
    description: "Real-time market data informing every analysis and signal TX",
    color: "text-amber-600 dark:text-amber-500"
  },
]

export function TrustStrip() {
  return (
    <section className="relative overflow-hidden border-b border-black/5 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 py-16 lg:py-24 backdrop-blur-3xl">
      {/* Background decoration engine */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.03)_0%,_transparent_40%)]" />

      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {trustItems.map((item, index) => {
            const Icon = item.icon
            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1, cubicBezier: [0.16, 1, 0.3, 1] }}
                className="group flex flex-col items-start gap-6 border-l border-black/5 dark:border-white/5 pl-8 transition-colors hover:border-blue-500/30"
              >
                <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 transition-all group-hover:scale-110 group-hover:shadow-xl shadow-sm`}>
                  <Icon className={`h-6 w-6 ${item.color} transition-colors`} />
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-900 dark:text-white transition-colors group-hover:text-blue-600 dark:group-hover:text-blue-500">
                    {item.title}
                  </h3>
                  <div className="h-px w-10 bg-blue-600/20 transition-all group-hover:w-full" />
                  <p className="text-[10px] font-bold leading-relaxed text-slate-500 dark:text-white/40 uppercase tracking-widest transition-colors group-hover:text-slate-900 dark:group-hover:text-white/60">
                    {item.description}
                  </p>
                </div>

                {/* Micro LED status indicator */}
                <div className="mt-4 flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 dark:text-white/20 group-hover:text-emerald-500 transition-colors">NODE_VERIFIED_SIA</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* SYSTEM CAPABILITIES BANNER */}
        <div className="mt-20 grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12 border-t border-black/5 dark:border-white/5 pt-16 opacity-60">
          <div className="flex items-center gap-3 group cursor-default">
            <Cpu className="h-5 w-5 text-blue-600 dark:text-blue-500 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-white/40 group-hover:text-slate-900 dark:group-hover:text-white">NEURAL_NET_v4</span>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <Shield className="h-5 w-5 text-emerald-600 dark:text-emerald-500 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-white/40 group-hover:text-slate-900 dark:group-hover:text-white">AES_256_CRYPT</span>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <Zap className="h-5 w-5 text-amber-600 dark:text-amber-500 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-white/40 group-hover:text-slate-900 dark:group-hover:text-white">SUB_SECOND_TX</span>
          </div>
          <div className="flex items-center gap-3 group cursor-default">
            <Activity className="h-5 w-5 text-red-600 dark:text-red-500 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 dark:text-white/40 group-hover:text-slate-900 dark:group-hover:text-white">99.99_UPTIME</span>
          </div>
        </div>
      </div>
    </section>
  )
}
