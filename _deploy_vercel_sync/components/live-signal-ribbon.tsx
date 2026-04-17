"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import { motion } from "framer-motion"

const signals = [
  { symbol: "BTC", price: "97,842", change: "+2.4%", up: true },
  { symbol: "ETH", price: "3,842", change: "+1.8%", up: true },
  { symbol: "NVDA", price: "142.56", change: "+3.2%", up: true },
  { symbol: "TSLA", price: "248.92", change: "-0.8%", up: false },
  { symbol: "WTI", price: "78.42", change: "-1.2%", up: false },
  { symbol: "Brent", price: "82.18", change: "-0.9%", up: false },
  { symbol: "DXY", price: "104.28", change: "+0.3%", up: true },
  { symbol: "Nasdaq", price: "19,842", change: "+1.1%", up: true },
]

export function LiveSignalRibbon() {
  return (
    <div className="overflow-hidden border-b border-black/5 dark:border-white/5 bg-black/5 dark:bg-muted/30 py-3">
      <div className="mx-auto max-w-[1440px] px-4 md:px-8">
        <div className="flex items-center gap-2">
          {/* Live indicator */}
          <div className="mr-8 flex items-center gap-2 shrink-0">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_#3b82f6]" />
            </span>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 dark:text-blue-500">LIVE_FEED</span>
          </div>

          {/* Scrolling signals */}
          <div className="flex-1 overflow-hidden">
            <motion.div
              className="flex gap-12"
              animate={{ x: [0, -1200] }}
              transition={{
                duration: 40,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              {[...signals, ...signals, ...signals].map((signal, index) => (
                <div
                  key={`${signal.symbol}-${index}`}
                  className="flex shrink-0 items-center gap-3"
                >
                  <span className="font-mono text-xs font-black uppercase text-slate-900 dark:text-white">
                    {signal.symbol}
                  </span>
                  <span className="font-mono text-xs font-medium text-slate-500 dark:text-white/40">
                    ${signal.price}
                  </span>
                  <span className={`flex items-center gap-1 font-mono text-[10px] font-black p-1 rounded-md transition-colors ${
                    signal.up
                      ? "text-emerald-600 dark:text-emerald-500 animate-flash-green bg-emerald-500/5"
                      : "text-red-600 dark:text-red-500 animate-flash-red bg-red-500/5"
                  }`}>
                    {signal.up ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {signal.change}
                  </span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
