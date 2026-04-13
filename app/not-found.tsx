'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { AlertTriangle, Terminal, ArrowLeft } from 'lucide-react'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import { type Locale } from '@/lib/i18n/dictionaries'
import {
  isLocaleSegment,
  normalizePublicRouteLocale,
  toDictionaryLocale,
} from '@/lib/i18n/route-locales'

function resolveNotFoundLocale(pathname: string | null): Locale {
  const firstSegment = pathname?.split('/').filter(Boolean)[0]?.toLowerCase()

  if (!firstSegment) return 'en'

  if (firstSegment === 'ar' || firstSegment === 'jp') {
    return firstSegment as Locale
  }

  if (!isLocaleSegment(firstSegment)) {
    return 'en'
  }

  return toDictionaryLocale(normalizePublicRouteLocale(firstSegment)) as Locale
}

/**
 * SIA 404 ERROR TERMINAL
 * A futuristic error page that maintains system integrity for users and Googlebot.
 */
function NotFoundContent() {
  const { t, currentLang } = useLanguage()

  return (
    <div className="min-h-screen bg-[#050505] text-white font-mono flex items-center justify-center p-6 overflow-hidden relative">
      {/* Background Grid Effect */}
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none">
        <div className="h-full w-full bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="max-w-2xl w-full relative z-10 border border-white/10 bg-black/40 backdrop-blur-2xl p-12 rounded-[3rem] shadow-3xl text-center space-y-8">
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="inline-block p-6 bg-red-500/10 rounded-full border border-red-500/20"
        >
          <AlertTriangle size={48} className="text-red-500" />
        </motion.div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white">
            {String(t('notFound.title') || '404 ERROR')}
          </h1>
          <p className="text-slate-500 text-sm tracking-widest uppercase leading-relaxed">
            {String(t('notFound.description') || 'INTELLIGENCE NODE NOT FOUND')}
          </p>
        </div>

        <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl text-left">
          <div className="flex items-center gap-2 text-blue-500 mb-2">
            <Terminal size={14} />
            <span className="text-[10px] font-black uppercase">System_Output:</span>
          </div>
          <p className="text-[11px] text-slate-400 font-mono italic whitespace-pre-line">
            {String(t('notFound.systemOutput') || 'SYSTEM_ERROR: Resource not found in database')}
          </p>
        </div>

        <Link
          href={`/${String(currentLang)}`}
          className="inline-flex items-center gap-3 bg-white text-black px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-2xl active:scale-95"
        >
          <ArrowLeft size={16} />
          {String(t('notFound.backButton') || 'RETURN TO TERMINAL')}
        </Link>

        <div className="pt-8 border-t border-white/5 opacity-20 text-[8px] uppercase tracking-[0.4em]">
          SIA INTELLIGENCE PROTOCOL v14.1 // SECURE_ENCRYPTED_LINK
        </div>
      </div>
    </div>
  )
}

export default function NotFound() {
  const pathname = usePathname()
  const initialLocale = resolveNotFoundLocale(pathname)

  return (
    <LanguageProvider initialLang={initialLocale}>
      <NotFoundContent />
    </LanguageProvider>
  )
}
