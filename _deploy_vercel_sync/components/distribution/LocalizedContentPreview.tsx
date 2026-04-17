/**
 * Localized Content Preview Component
 * Shows content in all 9 languages
 */

'use client'

import { useState } from 'react'
import type { Language, LocalizedContent } from '@/lib/distribution/types'

interface LocalizedContentPreviewProps {
  localizedContent: Record<Language, LocalizedContent>
}

const LANGUAGE_NAMES: Record<Language, string> = {
  en: 'English',
  tr: 'Türkçe',
  de: 'Deutsch',
  fr: 'Français',
  es: 'Español',
  ru: 'Русский',
  ar: 'العربية',
  jp: '日本語',
  zh: '中文'
}

export default function LocalizedContentPreview({ localizedContent }: LocalizedContentPreviewProps) {
  const [selectedLang, setSelectedLang] = useState<Language>('en')
  
  const languages = Object.keys(localizedContent) as Language[]
  const content = localizedContent[selectedLang]

  if (languages.length === 0) {
    return (
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10 text-center">
        <p className="text-slate-400">No localized content available</p>
      </div>
    )
  }

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Language Tabs */}
      <div className="flex items-center gap-2 p-4 border-b border-white/10 overflow-x-auto">
        {languages.map(lang => (
          <button
            key={lang}
            onClick={() => setSelectedLang(lang)}
            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all ${
              selectedLang === lang
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {lang} - {LANGUAGE_NAMES[lang]}
          </button>
        ))}
      </div>

      {/* Content */}
      {content ? (
        <div className="p-6 space-y-6">
          <div>
            <p className="text-slate-500 text-sm mb-2">Title</p>
            <h3 className="text-xl font-bold">{content.title}</h3>
          </div>

          <div>
            <p className="text-slate-500 text-sm mb-2">Summary</p>
            <p className="text-slate-300">{content.summary}</p>
          </div>

          <div>
            <p className="text-slate-500 text-sm mb-2">Content</p>
            <div className="text-slate-300 whitespace-pre-wrap">
              {content.content}
            </div>
          </div>

          {content.hashtags && content.hashtags.length > 0 && (
            <div>
              <p className="text-slate-500 text-sm mb-2">Hashtags</p>
              <div className="flex flex-wrap gap-2">
                {content.hashtags.map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-blue-500/20 text-blue-500 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-slate-500 text-sm mb-1">Readability Score</p>
              <p className="text-lg font-bold text-emerald-500">{content.readabilityScore}/100</p>
            </div>
            <div>
              <p className="text-slate-500 text-sm mb-1">SEO Score</p>
              <p className="text-lg font-bold text-blue-500">{content.seoScore}/100</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-slate-400">
          No content available for {LANGUAGE_NAMES[selectedLang]}
        </div>
      )}
    </div>
  )
}
