"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLiveIntelStream } from '@/lib/hooks/useLiveIntelStream'

interface IntelItem {
  id: string | number
  title: string
  report: string
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  impact: number
  confidence: number
  source: string
  region: string
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'
  ageStatus: 'FRESH' | 'ACTIVE' | 'STALE'
  sdi: number
  manipulationFlags: string[]
}

export default function PresentationTerminal() {
  const { liveQueue, isScanning, lastScanTime } = useLiveIntelStream()
  const [activeIntel, setActiveIntel] = useState<IntelItem | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [nextScanCountdown, setNextScanCountdown] = useState(30)

  // Auto-select first high-impact intelligence
  useEffect(() => {
    if (liveQueue.length > 0 && !activeIntel) {
      const highImpact = liveQueue.find(item => item.impact >= 7) || liveQueue[0]
      setActiveIntel({
        id: highImpact.id,
        title: highImpact.title.replace(/_/g, ' '),
        report: highImpact.localized.TR,
        sentiment: highImpact.sentiment,
        impact: highImpact.impact,
        confidence: highImpact.confidence,
        source: highImpact.source,
        region: highImpact.region,
        riskLevel: highImpact.riskLevel,
        ageStatus: highImpact.ageStatus,
        sdi: highImpact.sdi,
        manipulationFlags: highImpact.manipulationFlags
      })
    }
  }, [liveQueue, activeIntel])

  // Countdown timer for next scan
  useEffect(() => {
    const interval = setInterval(() => {
      if (lastScanTime) {
        const elapsed = Math.floor((Date.now() - lastScanTime.getTime()) / 1000)
        const remaining = Math.max(0, 30 - elapsed)
        setNextScanCountdown(remaining)
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [lastScanTime])

  // Reset publish status when intel changes
  useEffect(() => {
    setIsLive(false)
  }, [activeIntel])

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === 'BULLISH') return 'text-green-500'
    if (sentiment === 'BEARISH') return 'text-red-500'
    return 'text-yellow-500'
  }

  return (
    <div className="h-screen w-full bg-[#020202] text-gray-400 font-mono flex flex-col overflow-hidden selection:bg-[#FFB800] selection:text-black">
      {/* 🛡️ TOP_SCANNER: SİSTEM DURUMU */}
      <div className="h-10 border-b border-white/5 flex items-center justify-between px-6 bg-black">
        <div className="flex items-center space-x-6">
          <span className="text-[10px] font-black text-white tracking-[0.4em]">
            SIA_TERMINAL_V.2026
          </span>
          <div className="flex items-center space-x-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              isScanning ? 'bg-yellow-500 animate-pulse' : 'bg-green-500 animate-pulse'
            }`} />
            <span className="text-[8px] text-green-500/80 uppercase">
              {isScanning ? 'Scanning_Markets...' : 'Node_Connected: Istanbul_Hub'}
            </span>
          </div>
        </div>
        
        <div className="text-[9px] text-gray-600 space-x-4">
          <span>LATENCY: 12ms</span>
          <span>ENCRYPTION: AES-256</span>
          <span className="text-white bg-red-900/30 px-2 py-0.5 border border-red-900/50">
            LIVE_MODE_ON
          </span>
        </div>
      </div>

      <div className="flex-grow flex">
        {/* 🛰️ SOL PANEL: AI_SENTINEL_QUEUE (Avcı Ekranı) */}
        <div className="w-1/4 border-r border-white/5 p-4 space-y-4 bg-black/20 overflow-auto">
          <h3 className="text-[9px] text-[#FFB800] font-black uppercase tracking-[0.3em] mb-4">
            Awaiting_Approval_Queue
          </h3>

          {liveQueue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-800">
              <div className="w-6 h-6 border-2 border-gray-800 border-t-green-500 rounded-full animate-spin mb-3" />
              <span className="text-[8px] tracking-[0.3em]">SCANNING...</span>
            </div>
          ) : (
            liveQueue.map((intel) => (
              <motion.div
                key={intel.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setActiveIntel({
                  id: intel.id,
                  title: intel.title.replace(/_/g, ' '),
                  report: intel.localized.TR,
                  sentiment: intel.sentiment,
                  impact: intel.impact,
                  confidence: intel.confidence,
                  source: intel.source,
                  region: intel.region,
                  riskLevel: intel.riskLevel,
                  ageStatus: intel.ageStatus,
                  sdi: intel.sdi,
                  manipulationFlags: intel.manipulationFlags
                })}
                className={`p-3 border cursor-pointer transition-all group ${
                  activeIntel?.id === intel.id
                    ? 'border-[#FFB800] bg-[#FFB800]/10'
                    : 'border-white/10 bg-white/5 hover:border-[#FFB800]/50'
                }`}
              >
                <div className="flex justify-between text-[7px] text-gray-600 mb-1">
                  <span>SOURCE: {intel.source}</span>
                  <span>{new Date(intel.timestamp).toLocaleTimeString()}</span>
                </div>
                
                <div className="flex items-center gap-1 mb-2 flex-wrap">
                  <span className={`text-[7px] font-bold ${getSentimentColor(intel.sentiment)}`}>
                    {intel.sentiment}
                  </span>
                  <span className={`text-[7px] font-bold ${
                    intel.riskLevel === 'CRITICAL' ? 'text-red-500' :
                    intel.riskLevel === 'HIGH' ? 'text-orange-500' :
                    intel.riskLevel === 'MODERATE' ? 'text-yellow-500' : 'text-green-500'
                  }`}>
                    • {intel.riskLevel}
                  </span>
                  <span className="text-[7px] text-purple-400">
                    • {intel.confidence}%
                  </span>
                  <span className={`text-[7px] ${
                    intel.ageStatus === 'FRESH' ? 'text-green-500' :
                    intel.ageStatus === 'ACTIVE' ? 'text-yellow-500' : 'text-gray-500'
                  }`}>
                    • {intel.ageStatus}
                  </span>
                  <span className={`text-[7px] ${
                    intel.sdi >= 0.6 ? 'text-green-500' :
                    intel.sdi >= 0.4 ? 'text-yellow-500' : 'text-red-500'
                  }`}>
                    • SDI:{intel.sdi.toFixed(2)}
                  </span>
                </div>
                
                <p className="text-[10px] text-white font-bold uppercase group-hover:text-[#FFB800] line-clamp-2">
                  {intel.title.replace(/_/g, ' ')}
                </p>
              </motion.div>
            ))
          )}
        </div>

        {/* 📡 ORTA PANEL: THE_MAIN_BROADCAST (Asıl Şov) */}
        <div className="flex-grow flex flex-col bg-[radial-gradient(circle_at_center,_#080808_0%,_#020202_100%)] p-12 relative">
          <div className="absolute inset-0 opacity-5 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
          
          <AnimatePresence mode="wait">
            {activeIntel ? (
              <motion.div
                key={activeIntel.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="relative z-10 h-full flex flex-col"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <span className="px-2 py-0.5 bg-[#FFB800] text-black text-[10px] font-black italic">
                    TOP_STORY
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold ${
                    activeIntel.sentiment === 'BULLISH' 
                      ? 'bg-green-500/20 text-green-500 border border-green-500/50'
                      : activeIntel.sentiment === 'BEARISH'
                      ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                      : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                  }`}>
                    {activeIntel.sentiment}
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                    activeIntel.riskLevel === 'CRITICAL' 
                      ? 'bg-red-500/20 text-red-500 border border-red-500/50'
                      : activeIntel.riskLevel === 'HIGH'
                      ? 'bg-orange-500/20 text-orange-500 border border-orange-500/50'
                      : activeIntel.riskLevel === 'MODERATE'
                      ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                      : 'bg-green-500/20 text-green-500 border border-green-500/50'
                  }`}>
                    {activeIntel.riskLevel}_RISK
                  </span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase ${
                    activeIntel.ageStatus === 'FRESH'
                      ? 'bg-green-500/20 text-green-500 border border-green-500/50'
                      : 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/50'
                  }`}>
                    {activeIntel.ageStatus}
                  </span>
                  <span className="text-gray-600 text-[9px] uppercase tracking-widest italic">
                    Analyzed_By_Gemini_1.5_Pro // SDI:{activeIntel.sdi.toFixed(2)}
                  </span>
                </div>

                {/* Manipulation Warnings */}
                {activeIntel.manipulationFlags.length > 0 && (
                  <div className="mb-6 p-4 bg-red-900/10 border-l-4 border-red-500">
                    <div className="text-[10px] text-red-500 font-black uppercase tracking-wider mb-2">
                      ⚠ MANIPULATION_ALERTS_DETECTED
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeIntel.manipulationFlags.map((flag, idx) => (
                        <span key={idx} className="text-[9px] text-red-400 font-mono bg-red-900/20 px-2 py-1 border border-red-900/40">
                          {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <h1 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-[0.9] mb-8">
                  {activeIntel.title}
                </h1>

                <p className="text-xl text-gray-400 font-light leading-relaxed max-w-3xl border-l-2 border-[#FFB800] pl-8 italic mb-12">
                  {activeIntel.report}
                </p>

                <div className="mt-auto">
                  {!isLive ? (
                    <button
                      onClick={() => setIsLive(true)}
                      className="px-12 py-4 bg-white text-black font-black uppercase text-xs tracking-[0.3em] hover:bg-[#FFB800] transition-all shadow-[0_0_30px_rgba(255,184,0,0.2)]"
                    >
                      Broadcast_To_Global_Nodes (Yayınla)
                    </button>
                  ) : (
                    <div className="flex items-center space-x-4">
                      <div className="px-6 py-3 border border-green-500/50 bg-green-500/10 text-green-500 font-black text-[10px] uppercase tracking-widest">
                        ✓ Published_In_6_Languages
                      </div>
                      <span className="text-[9px] text-gray-700 italic">
                        Target: TR, EN, DE, ES, FR, AR
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="awaiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex items-center justify-center opacity-20"
              >
                <span className="text-[10px] tracking-[1em] animate-pulse">
                  AWAITING_INTEL_INPUT...
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 📊 SAĞ PANEL: MARKET_INTEGRITY & LEGAL (Zırh) */}
        <div className="w-1/4 border-l border-white/5 p-6 space-y-8 bg-black/20">
          <div>
            <h4 className="text-[8px] text-gray-600 uppercase tracking-widest mb-4">
              Market_Vitals
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] text-gray-400">FEAR_GREED</span>
                <span className="text-[10px] text-[#FFB800] font-bold">49 (NEUTRAL)</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] text-gray-400">BTC_USDT</span>
                <span className="text-[10px] text-white">$64,281.40</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] text-gray-400">QUEUE_SIZE</span>
                <span className="text-[10px] text-green-500 font-bold">{liveQueue.length}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-[10px] text-gray-400">NEXT_SCAN</span>
                <span className="text-[10px] text-blue-400 font-bold">{nextScanCountdown}s</span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <div className="p-3 bg-red-900/5 border border-red-900/20 text-[7px] text-gray-600 leading-tight uppercase italic">
              YASAL_UYARI: Bu terminal Gemini 1.5 Pro tarafından otonom olarak halka açık verilerle beslenmektedir. Yatırım tavsiyesi içermez. (SPK 6362 • SEC • MiFID II)
            </div>
          </div>
        </div>
      </div>

      {/* 📡 BOTTOM_FOOTER: GLOBAL_STATUS */}
      <div className="h-8 border-t border-white/5 bg-black flex items-center px-6 overflow-hidden">
        <div className="whitespace-nowrap flex space-x-12 animate-marquee text-[8px] text-gray-700 font-bold uppercase tracking-widest">
          <span>SIA_NETWORK_ACTIVE // </span>
          <span>GLOBAL_NODES: [TR] [EN] [DE] [ES] [FR] [AR] ONLINE // </span>
          <span>INTEGRITY_SCORE: %98.2 // </span>
          <span>NEXT_SCAN_IN: {nextScanCountdown}s // </span>
          <span>LIVE_QUEUE: {liveQueue.length} ITEMS // </span>
          <span>SIA_NETWORK_ACTIVE // </span>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </div>
  )
}
