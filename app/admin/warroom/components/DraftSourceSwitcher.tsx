'use client'

import React from 'react'

// Type for draft source selection
export type DraftSource = 'canonical' | 'session'

interface DraftSourceSwitcherProps {
  currentSource: DraftSource
  onSourceChange: (source: DraftSource) => void
  sessionDraftAvailable: boolean
}

/**
 * Draft Source Switcher Component
 * 
 * Allows operator to toggle between canonical vault view and session draft view.
 * 
 * CRITICAL SAFETY RULES:
 * - View toggle only (no mutations)
 * - No backend calls
 * - No persistence
 * - No state changes beyond view selection
 * - Canonical is always available and default
 * - Session option only available when session draft exists
 */
export default function DraftSourceSwitcher({
  currentSource,
  onSourceChange,
  sessionDraftAvailable
}: DraftSourceSwitcherProps) {
  return (
    <div className="flex w-full bg-[#18181c]/90 border-2 border-[#23232a] rounded-md overflow-hidden p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] lg:w-auto">
      {/* Canonical Vault Option - Always Available */}
      <button
        onClick={() => onSourceChange('canonical')}
        disabled={false}
        className={`flex-1 px-4 py-2 text-xs font-black uppercase rounded-md transition-all tracking-wide sm:px-6 sm:py-2.5 sm:text-sm ${
          currentSource === 'canonical'
            ? 'bg-[#FFB800] text-black shadow-[0_8px_16px_rgba(255,184,0,0.18)] ring-2 ring-[#FFB800]/40'
            : 'text-white/60 hover:text-white/90'
        }`}
        title="Canonical Vault is the authoritative source"
      >
        Canonical Vault
      </button>

      {/* Session Draft Option - Only Available When Session Exists */}
      <button
        onClick={() => onSourceChange('session')}
        disabled={!sessionDraftAvailable}
        className={`flex-1 px-4 py-2 text-xs font-black uppercase rounded-md transition-all tracking-wide sm:px-6 sm:py-2.5 sm:text-sm ${
          currentSource === 'session'
            ? 'bg-[#FFB800] text-black shadow-[0_8px_16px_rgba(255,184,0,0.18)] ring-2 ring-[#FFB800]/40'
            : sessionDraftAvailable
            ? 'text-white/60 hover:text-white/90'
            : 'text-white/20 cursor-not-allowed opacity-40'
        }`}
        title={
          sessionDraftAvailable
            ? 'Session Draft is read-only and not saved'
            : 'Session Draft not available (no session changes)'
        }
      >
        Session Draft
      </button>
    </div>
  )
}
