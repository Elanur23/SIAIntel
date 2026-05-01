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
  ShieldX
} from 'lucide-react'
import {
  CanonicalReAuditStatus,
  CanonicalReAuditBlockReason
} from '@/lib/editorial/canonical-reaudit-types'
import type {
  CanonicalReAuditResult,
  CanonicalReAuditSnapshotIdentity
} from '@/lib/editorial/canonical-reaudit-types'

interface CanonicalReAuditPanelProps {
  visible: boolean
  articleId: string | null
  status: CanonicalReAuditStatus
  result: CanonicalReAuditResult | null
  error: string | null
  isRunning: boolean
  snapshotIdentity: CanonicalReAuditSnapshotIdentity | null
}

/**
 * Canonical Re-Audit Panel
 *
 * Displays the current lifecycle of the canonical vault re-audit.
 *
 * CRITICAL SAFETY RULES:
 * - Read-only display component (no callbacks, no triggers)
 * - Shows ONLY canonical vault audit state
 * - Does NOT unlock deploy gate
 * - Does NOT overwrite global audit
 * - Uses mandatory safe wording (no "Ready", etc.)
 * - PASSED_PENDING_ACCEPTANCE uses AMBER (not green) to avoid deploy-ready confusion
 */
export default function CanonicalReAuditPanel({
  visible,
  articleId,
  status,
  result,
  error,
  isRunning,
  snapshotIdentity
}: CanonicalReAuditPanelProps) {
  // Only show if visible and article exists
  if (!visible || !articleId) return null

  const getStatusConfig = () => {
    switch (status) {
      case CanonicalReAuditStatus.NOT_RUN:
        return {
          icon: ShieldQuestion,
          label: 'Canonical Re-Audit: NOT RUN',
          colorClass: 'text-white/40',
          bgClass: 'bg-white/5 border-white/10'
        }
      case CanonicalReAuditStatus.RUNNING:
        return {
          icon: Loader2,
          label: 'Canonical Re-Audit: RUNNING...',
          colorClass: 'text-blue-400',
          bgClass: 'bg-blue-900/20 border-blue-500/30',
          animate: true
        }
      case CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE:
        return {
          icon: ShieldCheck,
          label: 'Passed - Pending Acceptance',
          colorClass: 'text-amber-400',
          bgClass: 'bg-amber-900/20 border-amber-500/30'
        }
      case CanonicalReAuditStatus.FAILED_PENDING_REVIEW:
        return {
          icon: ShieldAlert,
          label: 'Failed - Pending Review',
          colorClass: 'text-red-400',
          bgClass: 'bg-red-900/20 border-red-500/30'
        }
      case CanonicalReAuditStatus.STALE:
        return {
          icon: AlertTriangle,
          label: 'Canonical Re-Audit: STALE',
          colorClass: 'text-yellow-400',
          bgClass: 'bg-yellow-900/20 border-yellow-500/30'
        }
      case CanonicalReAuditStatus.BLOCKED:
        return {
          icon: ShieldX,
          label: 'Canonical Re-Audit: BLOCKED',
          colorClass: 'text-red-500',
          bgClass: 'bg-red-900/30 border-red-500/40'
        }
      default:
        return {
          icon: ShieldQuestion,
          label: 'Canonical Re-Audit: UNKNOWN',
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
        <ShieldCheck size={12} /> Canonical Re-Audit Lifecycle
      </div>

      {/* Status Banner */}
      <div className={`px-4 py-3 rounded-lg border flex items-center gap-3 ${config.bgClass}`}>
        <Icon size={18} className={`${config.colorClass} ${config.animate ? 'animate-spin' : ''} shrink-0`} />
        <div className={`text-xs font-black uppercase tracking-tight ${config.colorClass}`}>
          {config.label}
        </div>
      </div>

      {/* State-Specific Warnings */}
      {status === CanonicalReAuditStatus.NOT_RUN && (
        <div className="space-y-1.5 pt-1">
          <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-white/40 font-bold uppercase tracking-wide">
            Canonical re-audit has not been executed
          </div>
          <div className="px-3 py-1.5 bg-red-900/10 border border-red-500/20 rounded-md text-[10px] text-red-500/60 font-bold uppercase tracking-wide">
            Manual trigger required
          </div>
        </div>
      )}

      {status === CanonicalReAuditStatus.RUNNING && (
        <div className="space-y-1.5 pt-1">
          <div className="px-3 py-1.5 bg-blue-900/20 border border-blue-500/30 rounded-md text-[10px] text-blue-400/80 font-bold uppercase tracking-wide">
            Audit in progress
          </div>
          <div className="px-3 py-1.5 bg-yellow-900/20 border border-yellow-500/20 rounded-md text-[10px] text-yellow-500/70 font-bold uppercase tracking-wide">
            Do not navigate away
          </div>
        </div>
      )}

      {status === CanonicalReAuditStatus.PASSED_PENDING_ACCEPTANCE && (
        <div className="space-y-1.5 pt-1">
          <div className="px-3 py-1.5 bg-amber-900/20 border border-amber-500/30 rounded-md text-[10px] text-amber-400/90 font-bold uppercase tracking-wide">
            In-memory only
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-900/20 border border-amber-500/30 rounded-md text-[10px] text-amber-400/90 font-bold uppercase tracking-wide">
            <Lock size={10} />
            Deploy remains locked
          </div>
          <div className="px-3 py-1.5 bg-amber-900/20 border border-amber-500/30 rounded-md text-[10px] text-amber-400/90 font-bold uppercase tracking-wide">
            Global audit has not been updated
          </div>
          <div className="px-3 py-1.5 bg-amber-900/20 border border-amber-500/30 rounded-md text-[10px] text-amber-400/90 font-bold uppercase tracking-wide">
            Acceptance is a later phase
          </div>
        </div>
      )}

      {status === CanonicalReAuditStatus.FAILED_PENDING_REVIEW && (
        <div className="space-y-1.5 pt-1">
          <div className="px-3 py-1.5 bg-red-900/20 border border-red-500/30 rounded-md text-[10px] text-red-400/80 font-bold uppercase tracking-wide">
            Canonical re-audit failed
          </div>
          <div className="px-3 py-1.5 bg-red-900/20 border border-red-500/30 rounded-md text-[10px] text-red-400/80 font-bold uppercase tracking-wide">
            Review findings before retry
          </div>
          <div className="px-3 py-1.5 bg-red-900/10 border border-red-500/20 rounded-md text-[10px] text-red-500/60 font-bold uppercase tracking-wide">
            Global audit has not been updated
          </div>
        </div>
      )}

      {status === CanonicalReAuditStatus.BLOCKED && result?.blockReason && (
        <div className="space-y-1.5 pt-1">
          <div className="px-3 py-1.5 bg-red-900/30 border border-red-500/40 rounded-md text-[10px] text-red-400/90 font-bold uppercase tracking-wide">
            Canonical re-audit blocked
          </div>
          <div className="px-3 py-1.5 bg-red-900/30 border border-red-500/40 rounded-md text-[10px] text-red-300/80 font-mono tracking-tight">
            Reason: {result.blockReason}
          </div>
          <div className="px-3 py-1.5 bg-red-900/20 border border-red-500/30 rounded-md text-[10px] text-red-400/80 font-bold uppercase tracking-wide">
            Resolve block condition before retry
          </div>
        </div>
      )}

      {status === CanonicalReAuditStatus.STALE && (
        <div className="space-y-1.5 pt-1">
          <div className="px-3 py-1.5 bg-yellow-900/20 border border-yellow-500/30 rounded-md text-[10px] text-yellow-400/90 font-bold uppercase tracking-wide">
            Audit result is stale
          </div>
          <div className="px-3 py-1.5 bg-yellow-900/20 border border-yellow-500/30 rounded-md text-[10px] text-yellow-400/90 font-bold uppercase tracking-wide">
            Snapshot identity mismatch detected
          </div>
          <div className="px-3 py-1.5 bg-yellow-900/20 border border-yellow-500/30 rounded-md text-[10px] text-yellow-400/90 font-bold uppercase tracking-wide">
            Re-audit required
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="px-3 py-2 bg-red-900/30 border border-red-500/40 rounded-md text-[10px] text-red-300/90 font-mono leading-relaxed">
          {error}
        </div>
      )}

      {/* Mandatory Safety Footers (Always Visible) */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-900/20 border border-yellow-500/20 rounded-md text-[10px] text-yellow-500/70 font-bold uppercase tracking-wide">
          <Database size={10} />
          In-Memory Only — Not Saved to Vault
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/20 border border-red-500/30 rounded-md text-[10px] text-red-400/80 font-black uppercase tracking-wide">
          <Lock size={10} />
          Deploy Remains Locked
        </div>
        <div className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-md text-[9px] text-white/30 font-bold uppercase tracking-tighter text-center">
          Global Audit Not Updated — Acceptance Required
        </div>
      </div>
    </div>
  )
}
