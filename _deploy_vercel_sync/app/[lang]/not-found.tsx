'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { WifiOff, ShieldAlert, ArrowLeft } from 'lucide-react'
import { getDictionary, Locale } from '@/lib/i18n/dictionaries'

export default function NotFound() {
  const params = useParams()
  const lang = (params?.lang as Locale) || 'en'
  const dict = getDictionary(lang)

  return (
    <div className="min-h-screen bg-[#020203] flex items-center justify-center p-6 text-white font-sans">
      <div className="max-w-md w-full text-center space-y-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative inline-block"
        >
          <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full" />
          <div className="relative bg-white/5 border border-white/10 p-8 rounded-[3rem] backdrop-blur-xl">
            <WifiOff size={64} className="text-blue-500 mx-auto animate-pulse" />
          </div>
        </motion.div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">
            {dict.common.error} // 404
          </h1>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
            {lang === 'tr' ? 'SİNYAL KAYBOLDU: İSTENEN DÜĞÜM BULUNAMADI' : 'SIGNAL LOST: REQUESTED NODE NOT FOUND'}
          </p>
          <div className="h-px w-24 bg-blue-500/30 mx-auto" />
          <p className="text-slate-400 text-sm leading-relaxed italic">
            {lang === 'tr'
              ? 'Aradığınız koordinatlarda aktif bir istihbarat akışı bulunmuyor. Protokol ana terminaline dönmeniz önerilir.'
              : 'There is no active intelligence stream at the requested coordinates. Return to the main terminal is advised.'}
          </p>
        </div>

        <div className="pt-8">
          <Link
            href={`/${String(lang)}`}
            className="inline-flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-xl shadow-blue-600/20 group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            {dict.nav.home}
          </Link>
        </div>

        <div className="pt-12 flex justify-center gap-4 text-[10px] font-black text-white/10 uppercase tracking-[0.3em]">
          <span className="flex items-center gap-1.5"><ShieldAlert size={12} /> SECURE_HANDSHAKE_FAILED</span>
          <span>//</span>
          <span>SIA_PROTOCOL_v4.0</span>
        </div>
      </div>
    </div>
  )
}
