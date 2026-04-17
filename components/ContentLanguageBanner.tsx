'use client'

import { useState } from 'react'
import { X, Globe } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface ContentLanguageBannerProps {
  requestedLang: string
  availableLang: string
}

export default function ContentLanguageBanner({
  requestedLang,
  availableLang,
}: ContentLanguageBannerProps) {
  const [dismissed, setDismissed] = useState(false)
  const { t } = useLanguage()

  if (dismissed || requestedLang === availableLang) return null

  const languageNames: Record<string, string> = {
    en: 'English',
    tr: 'Türkçe',
    de: 'Deutsch',
    fr: 'Français',
    es: 'Español',
    ru: 'Русский',
    ar: 'العربية',
    jp: '日本語',
    zh: '中文',
  }

  return (
    <div className="relative z-20 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-b border-blue-500/20 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 p-2 bg-blue-500/10 rounded-lg">
              <Globe className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-mono text-slate-700 dark:text-white/80">
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  CONTENT_LANGUAGE_NOTICE:
                </span>{' '}
                This content is currently available in{' '}
                <span className="font-bold">{languageNames[availableLang] || availableLang}</span>{' '}
                only.
              </p>
            </div>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="flex-shrink-0 p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors group"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white" />
          </button>
        </div>
      </div>
    </div>
  )
}
