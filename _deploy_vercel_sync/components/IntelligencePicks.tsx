'use client'

import { motion } from 'framer-motion'
import { ArrowUpRight, Zap, Brain, Shield } from 'lucide-react'
import Image from 'next/image'

const picks = [
  {
    title: 'NVIDIA_LIQUIDATION_REPORT',
    category: 'TECH_SHOCK',
    impact: 'CRITICAL',
    confidence: '97%',
    icon: Zap,
    color: 'text-orange-500'
  },
  {
    title: 'SIA_SENTINEL_V9_DEPLOYMENT',
    category: 'SYSTEM_UPDATE',
    impact: 'HIGH',
    confidence: '99%',
    icon: Shield,
    color: 'text-blue-500'
  },
  {
    title: 'AI_ROI_MYTH_DEBUNKED',
    category: 'MARKET_INTEL',
    impact: 'MODERATE',
    confidence: '92%',
    icon: Brain,
    color: 'text-purple-500'
  }
]

export const IntelligencePicks = () => {
  return (
    <section className="py-20">
      <div className="flex items-center gap-4 mb-10">
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center">
          <Zap className="text-blue-500" size={20} />
        </div>
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">
            Intelligence_Picks
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            Hand-picked deep analysis from SIA nodes
          </p>
        </div>
        <div className="flex-1 h-px bg-white/5 ml-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {picks.map((pick, index) => (
          <motion.div
            key={pick.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:border-blue-500/30 transition-all overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-100 transition-opacity">
              <pick.icon size={40} className={pick.color} />
            </div>

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full bg-white/5 border border-white/10 ${pick.color}`}>
                  {pick.category}
                </span>
                <span className="text-[9px] font-black text-slate-500 uppercase">
                  CONFID: {pick.confidence}
                </span>
              </div>

              <h3 className="text-lg font-black uppercase italic leading-tight group-hover:text-blue-400 transition-colors">
                {pick.title}
              </h3>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                  IMPACT: {pick.impact}
                </span>
                <ArrowUpRight size={14} className="text-slate-600 group-hover:text-white transition-all" />
              </div>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
