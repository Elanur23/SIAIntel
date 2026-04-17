'use client'

import { LEGAL_CONFIG } from '@/lib/compliance/legal-enforcer'

const LANGS = ['tr', 'en', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'] as const
type LangKey = (typeof LANGS)[number]

function getFooterText(lang: string): string {
  const key = (lang || 'en').toLowerCase() as LangKey
  return LEGAL_CONFIG.footer[key] ?? LEGAL_CONFIG.footer.en
}

/**
 * Her haberin altında gösterilen yatırım tavsiyesi değildir mühürü.
 * Tüm dillerde LEGAL_CONFIG.footer ile render edilir.
 */
export default function LegalStamp({ lang }: { lang: string }) {
  const text = getFooterText(lang)
  return (
    <div
      className="mt-4 pt-4 flex items-center justify-center text-center"
      role="note"
      aria-label="Yasal uyarı"
    >
      <div className="inline-block px-4 py-2 rounded-lg border-2 border-amber-500/40 bg-amber-500/5 shadow-inner">
        <p className="text-[9px] text-amber-500 font-black uppercase tracking-wider leading-relaxed max-w-full">
          {text}
        </p>
      </div>
    </div>
  )
}
