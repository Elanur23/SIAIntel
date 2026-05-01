'use client'

import React from 'react'
import { ShieldCheck, Loader2 } from 'lucide-react'

interface CanonicalReAuditTriggerButtonProps {
  visible: boolean
  disabled: boolean
  isRunning: boolean
  disabledReason?: string | null
  onOpenConfirmModal: () => void
}

/**
 * Canonical Re-Audit Trigger Button
 * 
 * TASK 7C-1 SCOPE:
 * - Renders a button labeled exactly "Run Canonical Re-Audit"
 * - Accepts safe UI-only props
 * - Button onClick may only call onOpenConfirmModal
 * - Does NOT receive canonicalReAudit.run
 * - Does NOT call audit logic
 * - Does NOT call backend/API/database
 * - Does NOT mutate global state
 * - Does NOT unlock deploy
 * - Does NOT use localStorage/sessionStorage
 * - Does NOT use fetch/axios
 * - Does NOT use publish/save/promote/rollback wording or behavior
 */
export default function CanonicalReAuditTriggerButton({
  visible,
  disabled,
  isRunning,
  disabledReason,
  onOpenConfirmModal
}: CanonicalReAuditTriggerButtonProps) {
  // If not visible, return null
  if (!visible) return null

  return (
    <div className="mt-4 pt-4 border-t-2 border-white/5 space-y-3">
      <div className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-2">
        <ShieldCheck size={12} /> Canonical Re-Audit Trigger
      </div>

      <button
        onClick={onOpenConfirmModal}
        disabled={disabled}
        className={`w-full py-3 font-black uppercase text-xs tracking-wider transition-all flex items-center justify-center gap-2 rounded-lg border-2 ${
          disabled
            ? 'bg-neutral-800 text-neutral-500 border-neutral-700 cursor-not-allowed grayscale opacity-50'
            : 'bg-gradient-to-r from-blue-700/80 to-blue-500/70 border-blue-400/60 text-blue-100 hover:from-blue-600/90 hover:to-blue-400/80 hover:border-blue-200/80 shadow-[0_8px_18px_rgba(59,130,246,0.22)] ring-2 ring-blue-300/20 focus:outline-none focus:ring-4 focus:ring-blue-400/30'
        }`}
      >
        {isRunning ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <ShieldCheck size={14} />
        )}
        Run Canonical Re-Audit
      </button>

      {/* Disabled Reason Display */}
      {disabled && disabledReason && (
        <div className="px-3 py-2 bg-neutral-900/30 border border-neutral-600/40 rounded-md text-[10px] text-neutral-400/90 font-mono leading-relaxed">
          {disabledReason}
        </div>
      )}
    </div>
  )
}