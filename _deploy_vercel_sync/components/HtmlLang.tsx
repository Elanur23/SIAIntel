// @ts-nocheck - TODO: Fix implicit any return type (Phase 4C - deferred to strict mode phase)
'use client'

/**
 * Sets document.documentElement.lang dynamically per route.
 * Next.js App Router root layout can't receive [lang] params,
 * so we update the HTML lang attribute client-side.
 */
import { useEffect } from 'react'

// Internal lang codes → BCP 47 HTML lang values
const LANG_TO_HTML: Record<string, string> = {
  en: 'en', tr: 'tr', de: 'de', fr: 'fr',
  es: 'es', ru: 'ru', ar: 'ar', jp: 'ja', zh: 'zh',
}

export default function HtmlLang({ lang }: { lang: string }) {
  useEffect(() => {
    const htmlLang = LANG_TO_HTML[lang] ?? lang
    document.documentElement.lang = htmlLang
    document.documentElement.setAttribute('dir', lang === 'ar' ? 'rtl' : 'ltr')
  }, [lang])
  return null
}
