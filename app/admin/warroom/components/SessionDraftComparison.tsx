'use client'

import React from 'react'
import { GitCompare, FileText, Shield, AlertCircle } from 'lucide-react'

interface SessionDraftComparisonProps {
  canonicalBody: string
  sessionBody: string
  currentLanguage: string
  visible: boolean
  auditStaleCopy: string | null
  volatilityWarningCopy: string | null
}

/**
 * Session Draft Comparison Component
 * 
 * Displays side-by-side comparison of canonical vault and session draft.
 * 
 * CRITICAL SAFETY RULES:
 * - Read-only display only (no editing controls)
 * - No save/merge/apply/rollback buttons
 * - No backend calls
 * - No persistence
 * - No state mutations
 * - Both sides are read-only
 * - Clear labeling: "Canonical Vault (Authoritative)" vs "Session Draft (Session Only — Read-only)"
 * - No confusion about which is authoritative
 */
export default function SessionDraftComparison({
  canonicalBody,
  sessionBody,
  currentLanguage,
  visible,
  auditStaleCopy,
  volatilityWarningCopy
}: SessionDraftComparisonProps) {
  // Do not render if not visible
  if (!visible) return null

  // Safe fallback handling
  const safeCanonicalBody = canonicalBody || 'Canonical vault body is not available for comparison.'
  const safeSessionBody = sessionBody || 'Session draft body is not available for comparison.'

  // Check if comparison can be rendered
  const canRenderComparison = canonicalBody && sessionBody
  
  if (!canRenderComparison) {
    return (
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Unavailable State */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center space-y-4 max-w-md">
            <GitCompare size={48} className="mx-auto text-neutral-500" />
            <p className="text-lg font-bold text-neutral-400">
              Comparison Unavailable
            </p>
            <p className="text-sm text-neutral-500 leading-relaxed">
              Comparison is unavailable until both canonical and session draft content are present.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      {/* Header with Warning */}
      <div className="shrink-0 mb-4 border-2 border-blue-500/60 bg-gradient-to-r from-blue-900/40 via-blue-800/30 to-blue-900/40 backdrop-blur-sm rounded-lg shadow-[0_8px_24px_rgba(59,130,246,0.25)] ring-2 ring-blue-400/20">
        <div className="px-4 py-4 sm:px-6 sm:py-5">
          {/* Primary Label */}
          <div className="flex items-start gap-3 mb-3">
            <GitCompare 
              size={20} 
              className="text-blue-400 shrink-0 mt-0.5 drop-shadow-[0_0_6px_rgba(59,130,246,0.6)]" 
            />
            <div className="flex-1">
              <p className="text-sm sm:text-base font-black uppercase tracking-wide text-blue-200 leading-tight">
                Canonical vs Session Comparison — Read-Only View
              </p>
            </div>
          </div>

          {/* Metadata and Warnings */}
          <div className="ml-8 space-y-1.5">
            <p className="text-xs sm:text-sm text-blue-300/90 font-medium leading-relaxed">
              Language: <span className="font-black uppercase">{currentLanguage}</span>
            </p>
            <p className="text-xs sm:text-sm text-blue-300/90 font-medium leading-relaxed">
              Session Only — Not Saved to Vault — Not Deployed
            </p>
            {volatilityWarningCopy && (
              <p className="text-xs sm:text-sm text-blue-300/90 font-medium leading-relaxed">
                {volatilityWarningCopy}
              </p>
            )}
            {auditStaleCopy && (
              <p className="text-xs sm:text-sm text-blue-300/90 font-medium leading-relaxed">
                {auditStaleCopy}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side Comparison */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0 overflow-hidden">
        
        {/* Left Side: Canonical Vault (Authoritative) */}
        <div className="flex flex-col min-h-0 overflow-hidden border-2 border-green-500/40 bg-gradient-to-b from-green-950/30 via-green-900/20 to-green-950/30 rounded-lg shadow-[0_2px_24px_rgba(34,197,94,0.12)]">
          {/* Canonical Header */}
          <div className="shrink-0 px-4 py-3 border-b border-green-500/30 bg-green-900/30">
            <div className="flex items-center gap-2">
              <Shield size={16} className="text-green-400" />
              <h3 className="text-sm font-black uppercase tracking-wide text-green-200">
                Canonical Vault (Authoritative)
              </h3>
            </div>
            <p className="text-xs text-green-300/70 mt-1">
              Source of truth — Backed by Firestore vault
            </p>
          </div>
          
          {/* Canonical Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <div className="prose prose-invert prose-sm max-w-none text-white/85 leading-relaxed">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-white/90">
                {safeCanonicalBody}
              </pre>
            </div>
          </div>
        </div>

        {/* Right Side: Session Draft (Session Only — Read-only) */}
        <div className="flex flex-col min-h-0 overflow-hidden border-2 border-orange-500/40 bg-gradient-to-b from-orange-950/30 via-orange-900/20 to-orange-950/30 rounded-lg shadow-[0_2px_24px_rgba(249,115,22,0.12)]">
          {/* Session Header */}
          <div className="shrink-0 px-4 py-3 border-b border-orange-500/30 bg-orange-900/30">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-orange-400" />
              <h3 className="text-sm font-black uppercase tracking-wide text-orange-200">
                Session Draft (Session Only — Read-only)
              </h3>
            </div>
            <p className="text-xs text-orange-300/70 mt-1">
              Volatile session changes — Not saved to vault
            </p>
          </div>
          
          {/* Session Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            <div className="prose prose-invert prose-sm max-w-none text-white/85 leading-relaxed">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-white/90">
                {safeSessionBody}
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Read-Only Footer */}
      <div className="shrink-0 mt-4 pt-4 border-t border-neutral-500/20 flex items-center justify-center gap-2 text-xs text-neutral-400/60 font-bold uppercase tracking-wider">
        <AlertCircle size={12} />
        Read-Only Comparison — No Editing, Merging, or Apply Controls
      </div>
    </div>
  )
}