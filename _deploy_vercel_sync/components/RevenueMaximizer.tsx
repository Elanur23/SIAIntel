'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, ShieldCheck, Mail, ArrowRight, Zap, Gift } from 'lucide-react'
import { getContextualOffer } from '@/lib/ads/RevenueOptimizer'
import { toast } from 'react-hot-toast'

interface RevenueMaximizerProps {
  category: string
  lang: string
}

/**
 * SIA REVENUE MAXIMIZER UI
 * Injects high-conversion offers and lead-gen forms into content.
 */
export default function RevenueMaximizer({ category, lang }: RevenueMaximizerProps) {
  const offer = getContextualOffer(category)
  const [email, setEmail] = useState('')
  const [isSent, setIsSent] = useState(false)

  const handleLeadGen = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    toast.success('Access Granted. Deep Report sent to your uplink.')
    setIsSent(true)
    setEmail('')
  }

  return (
    <div className="space-y-8 my-10">

      {/* 💰 DYNAMIC AFFILIATE UPLINK */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="p-10 rounded-[3rem] bg-white/[0.02] border border-white/5 relative overflow-hidden group shadow-2xl"
      >
        <div className={`absolute top-0 right-0 w-32 h-32 ${offer.color} opacity-5 blur-[80px] rounded-full group-hover:opacity-20 transition-opacity`} />

        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-blue-500" />
              <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em]">SIA_PARTNER_PROTOCOL</span>
            </div>
            <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">
              {offer.label}
            </h3>
          </div>

          <a
            href={offer.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-10 py-6 ${offer.color} text-white font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl flex items-center gap-4 hover:brightness-110 transition-all shadow-xl shadow-black/40`}
          >
            {offer.cta}
            <ExternalLink size={18} />
          </a>
        </div>
      </motion.div>

      {/* 📧 PREMIUM LEAD GENERATION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-12 p-12 rounded-[4rem] bg-gradient-to-br from-blue-600/10 via-transparent to-purple-600/10 border border-white/5 relative overflow-hidden shadow-inner">
          <div className="absolute top-0 right-0 p-10 opacity-5">
            <Gift size={120} className="text-blue-500" />
          </div>

          <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
            <div className="space-y-4 flex-1">
              <div className="flex items-center gap-3 text-blue-400">
                <Zap size={20} className="fill-blue-400 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em]">Exclusive_Intelligence</span>
              </div>
              <h4 className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none">
                Unlock Deep_Alpha <span className="text-blue-500">Reports</span>
              </h4>
              <p className="text-slate-400 font-light italic text-lg leading-relaxed border-l border-white/10 pl-6">
                Receive the 15-page institutional PDF analysis for this specific asset directly in your inbox.
              </p>
            </div>

            <div className="w-full max-w-md">
              {!isSent ? (
                <form onSubmit={handleLeadGen} className="space-y-4">
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ENTER_UPLINK_EMAIL"
                      className="w-full bg-black/60 border border-white/10 rounded-2xl py-6 px-8 text-sm font-bold text-white placeholder:text-white/10 focus:border-blue-500 transition-all outline-none font-mono"
                      required
                    />
                    <button type="submit" className="absolute right-3 top-3 p-4 bg-blue-600 rounded-xl text-white hover:bg-blue-500 transition-colors">
                      <ArrowRight size={20} />
                    </button>
                  </div>
                  <p className="text-[8px] text-white/20 uppercase tracking-widest text-center">
                    Secure Transmission • 100% Privacy Guaranteed
                  </p>
                </form>
              ) : (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="p-8 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl text-center"
                >
                  <span className="text-emerald-500 font-black uppercase tracking-widest text-xs">Access_Code_Sent</span>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
