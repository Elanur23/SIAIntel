'use client'

import React from 'react'
import {
  ShieldCheck,
  ShieldAlert,
  ShieldQuestion,
  Loader2,
  AlertTriangle,
  Lock,
  Database,
  ArrowRight
} from 'lucide-react'
import { SessionAuditLifecycle, SessionAuditResult } from '@/lib/editorial/remediation-apply-types'
import SessionAuditFindingsPanel from './SessionAuditFindingsPanel'

interface SessionAuditStatePanelProps {
  lifecycle: SessionAuditLifecycle
  onReAudit: () => void
  hasSessionDraft: boolean
  sessionAuditResult: SessionAuditResult | null
}

/**
 * Session Audit State Panel
 *
 * Displays the current lifecycle of the session-scoped re-audit and provide
 * a trigger for re-auditing.
 *
 * CRITICAL SAFETY RULES:
 * - Presentational/read-only except receiving onReAudit callback.
 * - Shows ONLY session-scoped audit state.
 * - Does NOT unlock canonical deploy gate.
 * - Uses mandatory safe wording (no "Ready", "Approved", "Published", etc.)
 */
export default function SessionAuditStatePanel({
  lifecycle,
  onReAudit,
  hasSessionDraft,
  sessionAuditResult
}: SessionAuditStatePanelProps) {
  // Only show if a session draft exists
  if (!hasSessionDraft) return null

  const isRunning = lifecycle === SessionAuditLifecycle.RUNNING

  const getStatusConfig = () => {
    switch (lifecycle) {
      case SessionAuditLifecycle.NOT_RUN:
        return {
          icon: ShieldQuestion,
          label: 'Session Draft Audit: NOT RUN',
          colorClass: 'text-white/40',
          bgClass: 'bg-white/5 border-white/10'
        }
      case SessionAuditLifecycle.RUNNING:
        return {
          icon: Loader2,
          label: 'Session Draft Audit: RUNNING...',
          colorClass: 'text-blue-400',
          bgClass: 'bg-blue-900/20 border-blue-500/30',
          animate: true
        }
      case SessionAuditLifecycle.PASSED:
        return {
          icon: ShieldCheck,
          label: 'Audit Passed for Session Draft',
          colorClass: 'text-emerald-400',
          bgClass: 'bg-emerald-900/20 border-emerald-500/30'
        }
      case SessionAuditLifecycle.FAILED:
        return {
          icon: ShieldAlert,
          label: 'Audit Failed for Session Draft',
          colorClass: 'text-red-400',
          bgClass: 'bg-red-900/20 border-red-500/30'
        }
      case SessionAuditLifecycle.STALE:
        return {
          icon: AlertTriangle,
          label: 'Session Audit Stale',
          colorClass: 'text-yellow-400',
          bgClass: 'bg-yellow-900/20 border-yellow-500/30'
        }
      default:
        return {
          icon: ShieldQuestion,
          label: 'Session Draft Audit: UNKNOWN',
          colorClass: 'text-white/40',
          bgClass: 'bg-white/5 border-white/10'
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className="mt-4 pt-4 border-t-2 border-white/5 space-y-4">
      <div className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
        <ShieldCheck size={12} /> Session Audit Lifecycle
      </div>

      {/* Status Banner */}
      <div className={`px-4 py-3 rounded-lg border flex items-center gap-3 ${config.bgClass}`}>
        <Icon size={18} className={`${config.colorClass} ${config.animate ? 'animate-spin' : ''} shrink-0`} />
        <div className={`text-xs font-black uppercase tracking-tight ${config.colorClass}`}>
          {config.label}
        </div>
      </div>

      {/* Re-audit Trigger */}
      <button
        onClick={onReAudit}
        disabled={isRunning}
        className={`w-full py-3.5 flex items-center justify-center gap-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all border-2 ${
          isRunning
            ? 'bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-700/80 to-blue-500/70 text-blue-100 border-blue-400/60 hover:from-blue-600/90 hover:to-blue-400/80 shadow-[0_8px_16px_rgba(37,99,235,0.15)] ring-2 ring-blue-300/10'
        }`}
      >
        {isRunning ? <Loader2 size={14} className="animate-spin" /> : <ArrowRight size={14} />}
        Re-audit Session Draft
      </button>

      {/* Mandatory Safety Footers */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/20 border border-yellow-500/20 rounded-md text-[10px] text-yellow-500/70 font-bold uppercase tracking-wide">
          <Database size={10} />
          Still Not Saved to Vault
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/10 border border-red-500/20 rounded-md text-[10px] text-red-500/60 font-bold uppercase tracking-wide">
          <Lock size={10} />
          Still Not Deployed
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/20 border border-red-500/30 rounded-md text-[10px] text-red-400/80 font-black uppercase tracking-wide">
          <Lock size={10} />
          Deploy Remains Locked
        </div>
        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-[9px] text-white/30 font-bold uppercase tracking-tighter text-center">
          Promotion Requires Separate Gate
        </div>
      </div>

      {/* Findings Display Panel - Task 8 */}
      <SessionAuditFindingsPanel
        sessionAuditResult={sessionAuditResult}
        lifecycle={lifecycle}
      />
    </div>
  )
}
