'use client'

import { motion } from 'framer-motion'
import { AlertCircle, Gauge, Activity } from 'lucide-react'

interface RiskMeterProps {
  score: number // 0 - 100
  label?: string
}

/**
 * SIA Risk Meter - V1.0 (Holographic Predictive UI)
 * Visualizes the probability of market volatility or directional risk.
 */
export default function RiskMeter({ score, label = 'MARKET_VOLATILITY_RISK' }: RiskMeterProps) {
  // Determine color based on score
  const getColor = (s: number) => {
    if (s < 30) return 'text-emerald-500'
    if (s < 70) return 'text-amber-500'
    return 'text-rose-500'
  }

  const getBgColor = (s: number) => {
    if (s < 30) return 'bg-emerald-500'
    if (s < 70) return 'bg-amber-500'
    return 'bg-rose-500'
  }

  return (
    <div className="p-6 bg-black/40 border border-white/5 rounded-[2rem] backdrop-blur-xl relative overflow-hidden group">
      {/* Background Pulse */}
      <motion.div
        animate={{ opacity: [0.05, 0.1, 0.05] }}
        transition={{ duration: 4, repeat: Infinity }}
        className={`absolute inset-0 ${getBgColor(score)}`}
      />

      <div className="relative z-10 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge size={16} className="text-blue-500" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">{label}</span>
          </div>
          <Activity size={14} className="text-white/20 animate-pulse" />
        </div>

        <div className="flex items-end justify-between gap-4">
          <div className="space-y-1">
            <span className={`text-4xl font-black italic tracking-tighter ${getColor(score)}`}>
              {score}%
            </span>
            <div className="flex items-center gap-1.5 text-[8px] font-bold text-white/30 uppercase tracking-widest">
              <AlertCircle size={10} /> Probability_Indexed
            </div>
          </div>

          <div className="flex-1 h-12 flex items-end gap-1 pb-1">
            {[...Array(12)].map((_, i) => {
              const isActive = (i / 12) * 100 < score
              return (
                <motion.div
                  key={i}
                  initial={{ height: 2 }}
                  animate={{ height: isActive ? [4, 12, 8] : 2 }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.1 }}
                  className={`flex-1 rounded-full ${isActive ? getBgColor(score) : 'bg-white/5'}`}
                />
              )
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <p className="text-[9px] text-white/40 leading-relaxed font-mono uppercase">
            [SYSTEM_LOG]: Analysis linked to Whale_Alert_Node_V4.
            Real-time divergence detected in liquidity clusters.
          </p>
        </div>
      </div>
    </div>
  )
}
