'use client'

import React from 'react'
import { AlertCircle, Lock, ShieldAlert } from 'lucide-react'

interface SessionStatusChipsProps {
  hasSessionDraft: boolean
  isAuditStale: boolean
  sessionRemediationCount: number
}

/**
 * Session Status Chips Component
 * 
 * Displays read-only status indicators for session state, audit invalidation, and deploy lock.
 * 
 * CRITICAL SAFETY RULES:
 * - Display only (no mutations)
 * - No backend calls
 * - No persistence
 * - No state changes
 * - No click handlers or actions
 * - Read-only status indicators only
 */
export default function SessionStatusChips({
  hasSessionDraft,
  isAuditStale,
  sessionRemediationCount
}: SessionStatusChipsProps) {
  // Do not render if no session state exists
  if (!hasSessionDraft && !isAuditStale) return null

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Deploy Locked Chip - Visible when session draft exists */}
      {hasSessionDraft && (
        <div 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 border border-red-500/50 rounded-md text-red-400 text-xs font-black uppercase tracking-wide shadow-[0_4px_12px_rgba(239,68,68,0.15)]"
          title="Deploy blocked: local session draft exists; re-audit and Panda validation required."
        >
          <Lock size={12} className="shrink-0" />
          <span>Deploy Locked</span>
        </div>
      )}

      {/* Audit Stale Chip - Visible when audit is stale */}
      {isAuditStale && (
        <div 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-900/30 border border-red-500/50 rounded-md text-red-400 text-xs font-black uppercase tracking-wide shadow-[0_4px_12px_rgba(239,68,68,0.15)]"
          title="Audit invalidated by session changes. Full re-audit required."
        >
          <ShieldAlert size={12} className="shrink-0" />
          <span>Audit Stale</span>
        </div>
      )}

      {/* Session Draft Indicator - Shows remediation count */}
      {hasSessionDraft && sessionRemediationCount > 0 && (
        <div 
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-900/30 border border-yellow-500/50 rounded-md text-yellow-400 text-xs font-bold tracking-wide shadow-[0_4px_12px_rgba(234,179,8,0.15)]"
          title="Session Only — Not Saved to Vault — Not Deployed"
        >
          <span>Session Draft ({sessionRemediationCount})</span>
        </div>
      )}
    </div>
  )
}
