"use client"

import { Activity, TrendingUp, TrendingDown, AlertTriangle, Zap, BarChart3, Clock, Cpu } from "lucide-react"
import { motion } from "framer-motion"

const signals = [
  {
    name: "Macro Bias",
    value: "Risk-On",
    status: "bullish",
    icon: TrendingUp,
    description: "Favorable conditions",
  },
  {
    name: "Volatility State",
    value: "Elevated",
    status: "warning",
    icon: Activity,
    description: "Above historical mean",
  },
  {
    name: "Liquidity Rotation",
    value: "Inflow",
    status: "bullish",
    icon: BarChart3,
    description: "Net positive flow",
  },
  {
    name: "AI Momentum",
    value: "Strong",
    status: "bullish",
    icon: Zap,
    description: "Sector outperforming",
  },
  {
    name: "Market Stress",
    value: "Low",
    status: "neutral",
    icon: AlertTriangle,
    description: "Within normal range",
  },
]

const statusConfigs = {
  bullish: {
    text: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/5",
    border: "border-emerald-500/30",
    glow: "micro-led-green",
    accent: "bg-emerald-500/20"
  },
  bearish: {
    text: "text-red-600 dark:text-red-400",
    bg: "bg-red-500/5",
    border: "border-red-500/30",
    glow: "micro-led-red",
    accent: "bg-red-500/20"
  },
  warning: {
    text: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-500/5",
    border: "border-amber-500/30",
    glow: "micro-led-orange",
    accent: "bg-amber-500/20"
  },
  neutral: {
    text: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-500/5",
    border: "border-blue-500/30",
    glow: "micro-led-blue",
    accent: "bg-blue-500/20"
  },
}

export function SignalTerminal() {
  return (
    <section className="relative overflow-hidden border-b border-black/5 dark:border-white/5 py-20 lg:py-24">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(37,99,235,0.05)_0%,_transparent_40%)]" />

      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="mb-12 flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/10 border border-blue-500/20 shadow-lg shadow-blue-900/40">
              <Activity className="h-7 w-7 text-blue-600 dark:text-blue-500" />
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="font-heading text-3xl font-black uppercase tracking-tighter text-slate-950 dark:text-white">
                SIA_SIGNAL<span className="text-blue-600 dark:text-blue-500">_TERMINAL</span>
              </h2>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-white/40">
                  REALTIME_MARKET_INTELLIGENCE_LAYER_V8.4
                </span>
                <div className="h-px w-20 bg-black/5 dark:bg-white/10" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-2xl bg-black/5 dark:bg-white/5 px-6 py-3 border border-black/5 dark:border-white/10 backdrop-blur-md">
            <div className="flex flex-col items-end gap-1">
              <span className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-white/20">UPLINK_STATUS</span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500">CONNECTED_VIA_SIA_CORE</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {signals.map((signal, index) => {
            const Icon = signal.icon
            const config = statusConfigs[signal.status as keyof typeof statusConfigs] || statusConfigs.neutral

            return (
              <motion.div
                key={signal.name}
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1, cubicBezier: [0.16, 1, 0.3, 1] }}
                className={`group relative overflow-hidden rounded-3xl border ${config.border} ${config.bg} p-6 backdrop-blur-md transition-all hover:scale-105 hover:bg-white/40 dark:hover:bg-white/[0.05] hover-scanline shadow-sm hover:shadow-xl`}
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${config.accent} border border-white/5 transition-transform group-hover:scale-110 shadow-inner`}>
                    <Icon className={`h-5 w-5 ${config.text}`} />
                  </div>
                  <div className={`h-2 w-2 rounded-full ${config.glow}`} />
                </div>

                <div className="flex flex-col gap-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-slate-500 dark:text-white/30">
                    {signal.name}
                  </p>
                  <p className={`font-mono text-2xl font-black uppercase tracking-tighter ${config.text} drop-shadow-sm`}>
                    {signal.value}
                  </p>
                  <p className="text-[10px] font-bold leading-relaxed text-slate-600 dark:text-white/40 uppercase tracking-widest">
                    {signal.description}
                  </p>
                </div>

                {/* Decorative scanning line */}
                <div className="absolute bottom-0 left-0 h-[2px] w-full bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
              </motion.div>
            )
          })}
        </div>

        {/* TERMINAL ANALYTICS FOOTER */}
        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          <div className="flex items-center gap-4 rounded-3xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-6 backdrop-blur-md">
            <Cpu className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/20">PROCESSING_UNIT</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-white/60">SIA_SOVEREIGN_V2_MATRIX</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-6 backdrop-blur-md">
            <Clock className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/20">LAST_TX_LOGGED</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-white/60">2_MINUTES_AGO</span>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-3xl border border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02] p-6 backdrop-blur-md">
            <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-500" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/20">SIGNAL_CONVERGENCE</span>
              <span className="text-[11px] font-black uppercase tracking-widest text-slate-800 dark:text-white/60">STABLE_EQUILIBRIUM</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
