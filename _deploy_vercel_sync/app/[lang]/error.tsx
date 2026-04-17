'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldAlert, RefreshCcw, Terminal } from 'lucide-react'
import { useParams } from 'next/navigation'
import { getDictionary, Locale } from '@/lib/i18n/dictionaries'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const params = useParams()
  const lang = (params?.lang as Locale) || 'en'
  const dict = getDictionary(lang)

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('[SIA-SYSTEM-ERROR]:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#020203] flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-xl w-full text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-rose-600/20 blur-3xl rounded-full" />
          <div className="relative bg-white/5 border border-rose-500/20 p-8 rounded-[3rem] backdrop-blur-xl">
            <ShieldAlert size={64} className="text-rose-500 mx-auto" />
          </div>
        </motion.div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-rose-500">
            {dict.common.error} // SYSTEM_BREACH
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            {lang === 'tr' ? 'PROTOKOL HATASI: VERİ AKIŞI KESİLDİ' : 'PROTOCOL ERROR: DATA STREAM INTERRUPTED'}
          </p>

          <div className="bg-black/50 border border-white/5 rounded-2xl p-4 text-left font-mono text-[10px] text-rose-400/70 overflow-hidden">
            <div className="flex items-center gap-2 mb-2 border-b border-white/5 pb-2">
              <Terminal size={12} />
              <span>SIA_DEB_LOG</span>
            </div>
            <p className="break-all opacity-80">
              {error.message || 'Unknown internal protocol error occurred during decryption.'}
            </p>
            {error.digest && <p className="mt-1 opacity-40">DIGEST: {error.digest}</p>}
          </div>

          <p className="text-slate-400 text-sm leading-relaxed italic max-w-sm mx-auto">
            {lang === 'tr'
              ? 'Nöral ağlarımız bu düğümü işlerken beklenmedik bir dirençle karşılaştı. Bağlantıyı yenilemeyi deneyin.'
              : 'Our neural networks encountered unexpected resistance while processing this node. Try to reconnect the link.'}
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => reset()}
            className="flex items-center gap-3 px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all border border-white/10"
          >
            <RefreshCcw size={16} />
            {dict.common.retry}
          </button>

          <a
            href={`/${String(lang)}`}
            className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20"
          >
            {dict.nav.home}
          </a>
        </div>

        <div className="pt-8 text-[9px] font-black text-white/5 uppercase tracking-[0.4em]">
          CORE_INTEGRITY_COMPROMISED // RETRY_LIMIT_0
        </div>
      </div>
    </div>
  )
}
