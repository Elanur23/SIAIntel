'use client'

import React, { useState, useEffect } from 'react'
import { Mic, X, Terminal } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '@/contexts/LanguageContext'
import dynamic from 'next/dynamic'
import CommandCenterHUD from './CommandCenterHUD'

/**
 * SIA COMMAND CENTER TRIGGER
 * Floating glowing button to start real-time sessions & AI Command Center
 */
export default function LiveAnalystButton() {
  const [isActive, setIsActive] = useState(false)
  const { t } = useLanguage()

  // Listen for global triggers and Keyboard Escape
  useEffect(() => {
    const handleTrigger = () => setIsActive(true)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsActive(false)
    }

    window.addEventListener('sia-trigger-live-analyst', handleTrigger)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('sia-trigger-live-analyst', handleTrigger)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <>
      <div className="fixed bottom-10 left-10 z-[150] no-print">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsActive(!isActive)}
          className={`relative group p-5 rounded-full border shadow-2xl transition-all duration-500 ${
            isActive
              ? 'bg-rose-600 border-rose-400 text-white rotate-90'
              : 'bg-blue-600 border-blue-400 text-white shadow-[0_0_30px_rgba(37,99,235,0.4)]'
          }`}
        >
          {/* Outer Pulse */}
          {!isActive && (
            <span className="absolute inset-0 rounded-full bg-blue-500/40 animate-ping pointer-events-none" />
          )}

          <div className="relative z-10 flex items-center justify-center">
            {isActive ? <X size={24} /> : (
              <div className="relative">
                <Mic size={24} />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-blue-600 animate-pulse" />
              </div>
            )}
          </div>

          {/* Label */}
          {!isActive && (
            <div className="absolute left-full ml-4 top-1/2 -translate-y-1/2 whitespace-nowrap px-5 py-3 bg-black/90 backdrop-blur-2xl border border-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0 pointer-events-none">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-2">
                <Terminal size={12} className="text-blue-500" />
                Initialize_Command_Center
              </span>
            </div>
          )}
        </motion.button>
      </div>

      <AnimatePresence>
        {isActive && (
          <CommandCenterHUD onClose={() => setIsActive(false)} />
        )}
      </AnimatePresence>
    </>
  )
}
