'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, RefreshCcw, Home, ShieldAlert, Terminal } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log telemetry for internal SIA monitoring
    console.error('[SIA_SENTINEL_ERROR_REPORT]:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#020203] text-slate-400 flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* --- 🌌 SOVEREIGN BACKGROUND PROTOCOL --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="noise-overlay" />
        <div className="quantum-scanline" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(239,68,68,0.05)_0%,transparent_70%)]" />
      </div>

      <div className="max-w-3xl w-full relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-panel border-rose-500/20 p-12 md:p-20 rounded-[4rem] text-center shadow-[0_0_100px_rgba(239,68,68,0.1)] overflow-hidden relative group"
        >
          {/* Internal Glow Decor */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-rose-600/10 blur-[100px] rounded-full group-hover:bg-rose-600/20 transition-all duration-1000" />

          {/* ⚠️ SYSTEM ALERT ICON */}
          <div className="mb-12 relative inline-block">
            <div className="w-32 h-32 bg-rose-600/10 border border-rose-500/30 rounded-[2.5rem] flex items-center justify-center text-rose-500 relative z-10 shadow-[0_0_40px_rgba(239,68,68,0.2)]">
              <ShieldAlert size={64} className="animate-pulse" />
            </div>
            <div className="absolute inset-0 bg-rose-500/20 blur-3xl rounded-full" />
          </div>

          <div className="space-y-6 mb-16">
            <div className="flex items-center justify-center gap-4 text-rose-500 mb-2">
              <div className="h-px w-12 bg-rose-500/30" />
              <span className="text-[10px] font-black uppercase tracking-[0.6em]">SIA_NODE_OFFLINE</span>
              <div className="h-px w-12 bg-rose-500/30" />
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white uppercase italic tracking-tighter leading-none shadow-text">
              Neural_Link <span className="text-rose-600">Severed</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 font-light leading-relaxed italic border-l-2 border-rose-500/20 pl-8 max-w-2xl mx-auto">
              "The SIA intelligence grid has encountered a synchronization anomaly. Operational protocols are currently undergoing neural restoration."
            </p>
          </div>

          {/* 🛠 RECOVERY ACTIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-lg mx-auto">
            <button
              onClick={reset}
              className="px-8 py-6 bg-white text-black font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl hover:scale-105 transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 group/btn"
            >
              <RefreshCcw size={18} className="group-hover/btn:rotate-180 transition-transform duration-700" />
              Attempt_Reconnect
            </button>
            <a
              href="/"
              className="px-8 py-6 bg-white/5 border border-white/10 text-white font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl hover:bg-white/10 transition-all flex items-center justify-center gap-3"
            >
              <Home size={18} />
              Return_to_Hub
            </a>
          </div>

          {/* Technical Diagnostics (Visible in Dev or via toggle) */}
          <div className="mt-16 pt-10 border-t border-white/5 flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <Terminal size={14} className="text-slate-700" />
              <span className="text-[9px] font-mono text-slate-700 uppercase tracking-widest">Diagnostic_ID: {error.digest || 'SIA_PRO_MAX_CORE_FAIL'}</span>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <div className="p-6 bg-black/60 rounded-3xl border border-rose-500/10 text-left w-full overflow-hidden">
                <p className="text-[10px] font-mono text-rose-400/60 break-all leading-relaxed">
                  [FATAL_LOG]: {error.message}
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Footer Technical Stamp */}
        <div className="mt-12 text-center">
          <p className="text-[8px] font-black text-white/10 uppercase tracking-[0.8em]">
            Autonomous Intelligence Integrity Protocol // V14.0
          </p>
        </div>
      </div>
    </div>
  )
}
