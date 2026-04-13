'use client'

import { useLanguage } from '@/contexts/LanguageContext'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { GlobeAltIcon } from '@heroicons/react/24/outline'
import { languageNames, languageFlags, type Language } from '@/lib/store/language-store'

const languageCodes: Language[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']
const languages = languageCodes.map((code) => ({ code, name: languageNames[code], flag: languageFlags[code] }))

const LanguageSwitcher = () => {
  const { currentLang, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all border border-black/5 dark:border-white/5 hover:border-blue-500/30"
      >
        <GlobeAltIcon className="w-4 h-4 text-blue-500" />
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white/80">{String(currentLang)}</span>
      </button>

      {/* Backdrop — outside AnimatePresence so it doesn't interfere with exit animations */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="lang-dropdown"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden z-50"
          >
            <div className="p-2 grid grid-cols-1 gap-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    window.location.href = `/${lang.code}`
                    setIsOpen(false)
                  }}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-all ${
                    currentLang === lang.code
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 hover:text-blue-600'
                  }`}
                >
                  <span>{lang.name}</span>
                  <span className="text-lg">{lang.flag}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LanguageSwitcher
