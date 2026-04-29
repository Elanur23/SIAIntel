'use client'

import React from 'react'
import {
  AlertCircle,
  ShieldAlert,
  FileSearch,
  Hash,
  Layers,
  Database,
  Lock,
  AlertTriangle
} from 'lucide-react'
import {
  SessionAuditResult,
  SessionAuditLifecycle
} from '@/lib/editorial/remediation-apply-types'

interface SessionAuditFindingsPanelProps {
  sessionAuditResult: SessionAuditResult | null
  lifecycle: SessionAuditLifecycle
}

/**
 * Session Audit Findings Panel
 *
 * Displays a read-only list of findings from the session re-audit.
 *
 * CRITICAL SAFETY RULES:
 * - Read-only display only.
 * - No mutation paths.
 * - No action buttons.
 * - No Save/Promote/Publish/Deploy/Merge/Apply/Fix actions.
 * - Purely informational.
 */
export default function SessionAuditFindingsPanel({
  sessionAuditResult,
  lifecycle
}: SessionAuditFindingsPanelProps) {
  // Handle empty or initial states
  if (!sessionAuditResult && lifecycle === SessionAuditLifecycle.NOT_RUN) {
    return (
      <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg text-center">
        <div className="text-[11px] font-bold text-white/40 uppercase tracking-widest">
          No session audit findings available.
        </div>
      </div>
    )
  }

  // Handle running state
  if (lifecycle === SessionAuditLifecycle.RUNNING) {
    return (
      <div className="mt-4 p-8 bg-white/5 border-2 border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center gap-3 animate-pulse">
        <div className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">
          Analyzing Session Draft...
        </div>
        <div className="text-[9px] text-white/20 font-medium">
          Global Audit & Panda Validation in progress
        </div>
      </div>
    )
  }

  const isStale = lifecycle === SessionAuditLifecycle.STALE || (sessionAuditResult?.isStale ?? false)

  return (
    <div className="mt-4 space-y-4 animate-in fade-in duration-500">
      {/* Staleness Warning */}
      {isStale && (
        <div className="px-3 py-2 bg-yellow-900/20 border border-yellow-500/30 rounded-md flex items-center gap-2">
          <AlertTriangle size={14} className="text-yellow-400 shrink-0" />
          <div className="text-[11px] font-black text-yellow-400 uppercase tracking-tight">
            Session Audit Stale — Re-audit required.
          </div>
        </div>
      )}

      {/* Identity & Metadata Section */}
      {sessionAuditResult && (
        <div className="px-3 py-2 bg-black/40 border border-white/5 rounded-md space-y-1">
          <div className="flex items-center justify-between text-[10px] text-white/30 font-mono uppercase">
            <div className="flex items-center gap-1.5">
              <Hash size={10} /> Hash: {sessionAuditResult.identity.contentHash.substring(0, 12)}...
            </div>
            <div className="flex items-center gap-1.5">
              <Layers size={10} /> Seq: {sessionAuditResult.identity.ledgerSequence}
            </div>
          </div>
          <div className="text-[9px] text-white/20 font-mono italic">
            Snapshot ID: {sessionAuditResult.identity.latestAppliedEventId || 'INITIAL_STATE'}
          </div>
        </div>
      )}

      <div className="border-2 border-white/5 rounded-xl overflow-hidden bg-white/[0.02]">
        {/* Global Audit Findings Section */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">
            <ShieldAlert size={12} className="text-blue-400/60" /> Session Draft Audit Findings
          </div>
          <div className="space-y-2">
            {!sessionAuditResult?.findings || sessionAuditResult.findings.length === 0 ? (
              <div className="text-[11px] text-emerald-400/60 font-medium italic">
                No governance violations detected.
              </div>
            ) : (
              sessionAuditResult.findings.map((finding, idx) => (
                <div key={idx} className="flex items-start gap-2.5 px-3 py-2 bg-red-900/10 border border-red-500/20 rounded-lg">
                  <AlertCircle size={12} className="text-red-400 mt-0.5 shrink-0" />
                  <span className="text-[11px] text-red-200/80 leading-relaxed">{finding}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Panda Check Section */}
        <div className="p-4 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">
            <FileSearch size={12} className="text-purple-400/60" /> Panda Session Check
          </div>
          {sessionAuditResult?.pandaCheckPass ? (
            <div className="text-[11px] text-emerald-400/60 font-medium italic">
              Panda validation passed for session draft.
            </div>
          ) : (
            <div className="text-[11px] text-red-400/80 font-bold">
              Panda validation FAILED.
            </div>
          )}
        </div>

        {/* Structural Issues Section */}
        {sessionAuditResult?.pandaStructuralErrors && sessionAuditResult.pandaStructuralErrors.length > 0 && (
          <div className="p-4 bg-orange-900/10">
            <div className="flex items-center gap-2 text-[10px] font-black text-orange-400/80 uppercase tracking-widest mb-3">
              <AlertTriangle size={12} /> Structural / Package Issues
            </div>
            <div className="space-y-2">
              {sessionAuditResult.pandaStructuralErrors.map((error, idx) => (
                <div key={idx} className="text-[11px] text-orange-200/70 border-l-2 border-orange-500/40 pl-3 py-1">
                  {error}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Safety Wording Panel */}
      <div className="p-3 bg-white/5 border border-white/10 rounded-lg space-y-2">
        <div className="flex flex-wrap gap-2">
          <div className="px-2 py-1 bg-blue-900/20 border border-blue-500/20 rounded text-[9px] text-blue-400 font-black uppercase">
            Session Only
          </div>
          <div className="px-2 py-1 bg-yellow-900/20 border border-yellow-500/20 rounded text-[9px] text-yellow-500/70 font-bold uppercase">
            Still Not Saved to Vault
          </div>
          <div className="px-2 py-1 bg-red-900/10 border border-red-500/20 rounded text-[9px] text-red-500/60 font-bold uppercase">
            Still Not Deployed
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-white/30 font-black uppercase tracking-tight italic">
          <Lock size={10} /> Deploy Remains Locked
        </div>
        <div className="text-[9px] text-white/20 font-bold uppercase text-center border-t border-white/5 pt-2">
          Promotion Requires Separate Gate
        </div>
      </div>
    </div>
  )
}
