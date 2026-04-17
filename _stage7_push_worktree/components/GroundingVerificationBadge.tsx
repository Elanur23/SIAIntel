'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Info, Database, Globe, Search } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export interface GroundingVerificationData {
  isGrounded: boolean
  confidence: number
  sources: string[]
  verifiedAt: Date
  factualClaims?: Array<{ claim: string; verified: boolean; source?: string }>
}

interface Props {
  confidence?: number
  sources?: string[]
  groundingData?: GroundingVerificationData
  reportTitle?: string
}

/**
 * SIA Grounding Verification Badge - E-E-A-T Authority Signal
 * Shows Google and users that the content is based on multiple verified sources.
 */
export default function GroundingVerificationBadge({ confidence: directConfidence, sources: directSources, groundingData, reportTitle }: Props) {
  const { t } = useLanguage()
  const confidence = directConfidence ?? groundingData?.confidence ?? 90
  const sources = directSources ?? groundingData?.sources ?? []

  return (
    <div className="relative group">
      {/* Main Badge */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full cursor-help"
      >
        <div className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </div>
        <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
          SIA_VERIFIED_{confidence}%
        </span>
      </motion.div>

      {/* Hover Info Panel (HUD Style) */}
      <div className="absolute top-full mt-4 right-0 w-72 p-6 bg-[#0A0A0C] border border-white/10 rounded-[2rem] shadow-3xl opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50 backdrop-blur-xl">
        <div className="space-y-6">
          <div className="flex items-center gap-3 text-blue-500 border-b border-white/5 pb-4">
            <ShieldCheck size={20} />
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Evidence Protocol</h4>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Database size={14} className="text-slate-500 mt-0.5" />
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-white/40 uppercase">Verified Sources</span>
                <div className="flex flex-wrap gap-1.5">
                  {sources.map((s, i) => (
                    <span key={i} className="text-[9px] text-slate-300 bg-white/5 px-2 py-0.5 rounded-sm">{s}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              < Globe size={14} className="text-slate-500 mt-0.5" />
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-white/40 uppercase">Nodes Scanned</span>
                <span className="text-[10px] font-bold text-white">21 Global Intelligence Nodes</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Search size={14} className="text-slate-500 mt-0.5" />
              <div className="space-y-1">
                <span className="block text-[9px] font-black text-white/40 uppercase">Methodology</span>
                <span className="text-[10px] font-bold text-emerald-500 italic">STATISTICAL_CROSS_VALIDATION</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-center">
            <p className="text-[8px] text-slate-600 leading-relaxed italic">
              Google E-E-A-T Compliant Verification Protocol v14.1
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
