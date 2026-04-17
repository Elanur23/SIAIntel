'use client'

import React, { useEffect, useState } from 'react'
import { getNanoCapabilities, type NanoCapabilities } from '@/lib/ai/gemini-nano-bridge'
import { Zap, ShieldCheck, Download, AlertCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function GeminiNanoStatus() {
  const [caps, setCaps] = useState<NanoCapabilities | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    getNanoCapabilities().then(c => {
      setCaps(c)
      if (c.available !== 'no') {
        setVisible(true)
        // Hide after 10 seconds to keep UI clean
        setTimeout(() => setVisible(false), 10000)
      }
    })
  }, [])

  if (!caps || caps.available === 'no') return null

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed bottom-24 right-10 z-[100] max-w-xs"
        >
          <div className="bg-black/80 backdrop-blur-xl border border-blue-500/30 p-5 rounded-3xl shadow-2xl flex items-start gap-4">
            <div className={`p-3 rounded-2xl ${caps.available === 'readily' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
              {caps.available === 'readily' ? <ShieldCheck size={20} /> : <Download size={20} className="animate-bounce" />}
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/80 mb-1">
                Local AI Detected
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">
                {caps.available === 'readily'
                  ? 'Gemini Nano is active. Offline failover enabled.'
                  : 'Gemini Nano detected. Chrome is downloading models...'}
              </p>
              <button
                onClick={() => setVisible(false)}
                className="mt-3 text-[9px] font-black uppercase text-white/20 hover:text-white transition-colors"
              >
                Dismiss_Link
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
