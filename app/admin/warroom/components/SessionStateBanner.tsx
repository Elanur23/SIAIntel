'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'

interface SessionStateBannerProps {
  visible: boolean
  sessionWarningCopy: string | null
  auditStaleCopy: string | null
  volatilityWarningCopy: string | null
}

/**
 * Session State Banner Component
 * 
 * Displays a persistent warning banner when session-only draft changes exist.
 * 
 * CRITICAL SAFETY RULES:
 * - Display only (no mutations)
 * - No backend calls
 * - No persistence
 * - No state changes
 * - Session-scoped visibility only
 */
export default function SessionStateBanner({
  visible,
  sessionWarningCopy,
  auditStaleCopy,
  volatilityWarningCopy
}: SessionStateBannerProps) {
  // Do not render if not visible
  if (!visible) return null

  return (
    <div className="mb-4 border-2 border-yellow-500/60 bg-gradient-to-r from-yellow-900/40 via-yellow-800/30 to-yellow-900/40 backdrop-blur-sm rounded-lg shadow-[0_8px_24px_rgba(234,179,8,0.25)] ring-2 ring-yellow-400/20">
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        {/* Primary Warning */}
        <div className="flex items-start gap-3 mb-3">
          <AlertCircle 
            size={20} 
            className="text-yellow-400 shrink-0 mt-0.5 drop-shadow-[0_0_6px_rgba(234,179,8,0.6)]" 
          />
          <div className="flex-1">
            <p className="text-sm sm:text-base font-black uppercase tracking-wide text-yellow-200 leading-tight">
              {sessionWarningCopy || 'Session Draft Active — Not Saved to Vault — Not Deployed'}
            </p>
          </div>
        </div>

        {/* Secondary Warnings */}
        <div className="ml-8 space-y-1.5">
          {volatilityWarningCopy && (
            <p className="text-xs sm:text-sm text-yellow-300/90 font-medium leading-relaxed">
              {volatilityWarningCopy}
            </p>
          )}
          {auditStaleCopy && (
            <p className="text-xs sm:text-sm text-yellow-300/90 font-medium leading-relaxed">
              {auditStaleCopy}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
