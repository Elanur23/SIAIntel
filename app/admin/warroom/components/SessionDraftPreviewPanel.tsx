'use client'

import React from 'react'
import { AlertCircle, FileText } from 'lucide-react'

interface SessionDraftPreviewPanelProps {
  sessionBody: string
  currentLanguage: string
  visible: boolean
  auditStaleCopy: string | null
  volatilityWarningCopy: string | null
}

/**
 * Session Draft Preview Panel Component
 * 
 * Displays read-only session draft body content when Session Draft view is active.
 * 
 * CRITICAL SAFETY RULES:
 * - Read-only display only (no editing controls)
 * - No save/publish/commit buttons
 * - No backend calls
 * - No persistence
 * - No state mutations
 * - Session-scoped visibility only
 * - Clear labeling: "SESSION DRAFT — Session Only — Not Saved to Vault"
 */
export default function SessionDraftPreviewPanel({
  sessionBody,
  currentLanguage,
  visible,
  auditStaleCopy,
  volatilityWarningCopy
}: SessionDraftPreviewPanelProps) {
  // Do not render if not visible
  if (!visible) return null

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header with Clear Labeling */}
      <div className="shrink-0 mb-4 border-2 border-orange-500/60 bg-gradient-to-r from-orange-900/40 via-orange-800/30 to-orange-900/40 backdrop-blur-sm rounded-lg shadow-[0_8px_24px_rgba(249,115,22,0.25)] ring-2 ring-orange-400/20">
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          {/* Primary Label */}
          <div className="flex items-start gap-3 mb-3">
            <FileText 
              size={20} 
              className="text-orange-400 shrink-0 mt-0.5 drop-shadow-[0_0_6px_rgba(249,115,22,0.6)]" 
            />
            <div className="flex-1">
              <p className="text-sm sm:text-base font-black uppercase tracking-wide text-orange-200 leading-tight">
                SESSION DRAFT — Session Only — Not Saved to Vault
              </p>
            </div>
          </div>

          {/* Metadata */}
          <div className="ml-8 space-y-1.5">
            <p className="text-xs sm:text-sm text-orange-300/90 font-medium leading-relaxed">
              Language: <span className="font-black uppercase">{currentLanguage}</span>
            </p>
            {volatilityWarningCopy && (
              <p className="text-xs sm:text-sm text-orange-300/90 font-medium leading-relaxed">
                {volatilityWarningCopy}
              </p>
            )}
            {auditStaleCopy && (
              <p className="text-xs sm:text-sm text-orange-300/90 font-medium leading-relaxed">
                {auditStaleCopy}
              </p>
            )}
            <p className="text-xs sm:text-sm text-orange-300/90 font-medium leading-relaxed">
              ⚠️ Not Deployed — Read-Only View
            </p>
          </div>
        </div>
      </div>

      {/* Read-Only Body Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-orange-950/30 via-orange-900/20 to-orange-950/30 border-2 border-orange-500/30 rounded-lg shadow-[0_2px_24px_rgba(249,115,22,0.12)]">
        {/* Content Display */}
        <div className="prose prose-invert prose-sm max-w-none text-white/85 leading-relaxed">
          <pre className="whitespace-pre-wrap font-sans text-sm sm:text-base leading-6 sm:leading-7 text-white/90">
            {sessionBody || '(No session body content)'}
          </pre>
        </div>

        {/* Read-Only Indicator */}
        <div className="mt-6 pt-4 border-t border-orange-500/20 flex items-center justify-center gap-2 text-xs text-orange-400/60 font-bold uppercase tracking-wider">
          <AlertCircle size={12} />
          Read-Only View — No Editing Controls
        </div>
      </div>
    </div>
  )
}
