'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Zap, Activity, Cpu, Radio } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import { toast } from 'react-hot-toast'

export const SignalTerminal = () => {
  const { t } = useLanguage()
  const [isRecalibrating, setIsRecalibrating] = useState(false)
  const [stats, setStats] = useState({
    volatility: 84.2,
    neuralLoad: 94,
    syncRate: 99.9,
    latency: 12
  })

  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        volatility: +(prev.volatility + (Math.random() * 2 - 1)).toFixed(1),
        neuralLoad: Math.min(100, Math.max(80, prev.neuralLoad + (Math.random() * 4 - 2))),
        syncRate: +(99.8 + Math.random() * 0.2).toFixed(2),
        latency: Math.floor(10 + Math.random() * 5)
      }))
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  const handleRecalibrate = () => {
    setIsRecalibrating(true)
    toast.loading('Synchronizing neural frequencies...', { id: 'recalibrate' })

    setTimeout(() => {
      setStats(prev => ({
        ...prev,
        syncRate: 99.9,
        latency: 8
      }))
      setIsRecalibrating(false)
      toast.success('System Re-calibrated. Accuracy: Optimal.', { id: 'recalibrate' })
    }, 2000)
  }

  const handleLiveBriefing = () => {
    window.dispatchEvent(new CustomEvent('sia-trigger-live-analyst'))
  }

  return (
    <div className="p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 space-y-8 backdrop-blur-md relative overflow-hidden group">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition-colors" />

      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3 text-blue-500 font-black uppercase tracking-[0.3em] text-[10px]">
          <ShieldCheck size={18} className={isRecalibrating ? 'animate-spin' : 'animate-pulse'} /> {t('footer.secure_node')}
        </div>
        <div className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[8px] font-black">
          {isRecalibrating ? 'RECALIBRATING...' : 'LIVE_STREAMING'}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10">
        <div className="p-5 rounded-2xl bg-black/40 border border-white/5 group/stat">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
             <Activity size={10} className="text-rose-500" /> {t('hub.volatility')}
          </p>
          <AnimatePresence mode="wait">
            <motion.p
              key={stats.volatility}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-black text-rose-500 font-mono"
            >
              {stats.volatility}%
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="p-5 rounded-2xl bg-black/40 border border-white/5 group/stat">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
            <Cpu size={10} className="text-blue-500" /> {t('hub.neural_load')}
          </p>
          <motion.p
            animate={{ color: stats.neuralLoad > 95 ? '#ef4444' : '#3b82f6' }}
            className="text-xl font-black font-mono transition-colors"
          >
            {Math.round(stats.neuralLoad)}%
          </motion.p>
        </div>
      </div>

      <div className="space-y-4 relative z-10">
        <div className="flex justify-between items-center text-[10px] font-bold py-3 border-b border-white/5">
          <span className="text-slate-500 uppercase tracking-widest">{t('footer.sync_rate')}</span>
          <span className="text-emerald-500 font-mono">{stats.syncRate}%</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold py-3 border-b border-white/5">
          <span className="text-slate-500 uppercase tracking-widest">{t('footer.latency')}</span>
          <span className="text-blue-400 font-mono">{stats.latency}MS</span>
        </div>
        <div className="flex justify-between items-center text-[10px] font-bold py-3">
          <span className="text-slate-500 uppercase tracking-widest">ENCRYPTION</span>
          <span className="text-white font-mono">AES-256_GCM</span>
        </div>
      </div>

      <div className="space-y-3 pt-4">
        <button
          onClick={handleLiveBriefing}
          className="w-full py-5 bg-blue-600 border border-blue-400 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 group"
        >
          <Radio size={16} className="animate-pulse" /> Launch Live Briefing
        </button>

        <button
          onClick={handleRecalibrate}
          disabled={isRecalibrating}
          className="w-full py-3 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/10 hover:border-white/20 transition-all text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-wait"
        >
          {isRecalibrating ? 'Recalibrating...' : 'Re-calibrate Sensors'}
        </button>
      </div>
    </div>
  )
}
