'use client'

import { motion } from 'framer-motion'
import { Database, ShieldCheck, Globe, Cpu } from 'lucide-react'

export const TrustStrip = () => {
  const nodes = [
    { name: 'BLOOMBERG_L2', status: 'STABLE', icon: Database },
    { name: 'REUTERS_OSINT', status: 'ACTIVE', icon: Globe },
    { name: 'NASDAQ_FEED', status: 'STABLE', icon: Cpu },
    { name: 'SIA_SENTINEL', status: 'STABLE', icon: ShieldCheck },
  ]

  return (
    <div className="py-4 border-y border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 opacity-40 hover:opacity-100 transition-opacity duration-500">
          {nodes.map((node) => (
            <div key={node.name} className="flex items-center gap-3 grayscale hover:grayscale-0 transition-all cursor-default group">
              <node.icon size={14} className="text-blue-500 group-hover:animate-pulse" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-[0.2em] text-white">
                  {node.name}
                </span>
                <span className="text-[8px] font-bold text-emerald-500/80">
                  NODE_{node.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
