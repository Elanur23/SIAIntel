'use client'

import React, { useMemo, useState } from 'react'
import { AlertCircle, ChevronDown, ChevronUp, ShieldAlert, Info, Lock } from 'lucide-react'
import {
  generateRemediationPlan
} from '@/lib/editorial/remediation-engine'
import {
  RemediationCategory,
  RemediationSeverity,
  RemediationSafetyLevel,
  type RemediationSuggestion
} from '@/lib/editorial/remediation-types'

interface RemediationPreviewPanelProps {
  globalAudit?: unknown
  auditResult?: unknown
  pandaValidationErrors?: unknown[]
  deployLockReasons?: unknown[]
  articleId?: string
  packageId?: string
  className?: string
}

/**
 * Controlled Remediation Phase 2B - Suggested Fixes Preview Panel
 *
 * This component provides a read-only preview of remediation suggestions.
 * It is strictly presentational and does not allow application of fixes.
 *
 * SAFETY RULES:
 * - Read-only / Presentational
 * - No Apply/Fix buttons
 * - No vault/article mutation
 * - No API/Database calls
 * - Forbidden wording guarded
 */
export default function RemediationPreviewPanel({
  globalAudit,
  auditResult,
  pandaValidationErrors,
  deployLockReasons,
  articleId,
  packageId,
  className = ''
}: RemediationPreviewPanelProps) {
  const [isPanelExpanded, setIsPanelExpanded] = useState(true)
  const [expandedSuggestions, setExpandedSuggestions] = useState<Record<string, boolean>>({})

  // Derived remediation plan - Pure calculation from props
  const remediationPlan = useMemo(() => {
    // WORKAROUND: Phase 2A engine's suggestionsFromGlobalAudit expects the 'languages'
    // record directly, but page.tsx provides the full GlobalAuditResult object.
    const auditData = (globalAudit && typeof globalAudit === 'object' && 'languages' in globalAudit)
      ? (globalAudit as any).languages
      : globalAudit;

    return generateRemediationPlan({
      articleId,
      packageId,
      globalAudit: auditData,
      pandaValidationErrors,
      deployLockReasons,
      auditResult
    })
  }, [articleId, packageId, globalAudit, pandaValidationErrors, deployLockReasons, auditResult])

  const toggleSuggestion = (id: string) => {
    setExpandedSuggestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Zero-state handling
  if (!remediationPlan || remediationPlan.suggestions.length === 0) {
    return (
      <div className={`mt-4 pt-4 border-t-2 border-white/10 ${className}`}>
        <div className="px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-center">
          <div className="text-xs font-black text-white/40 uppercase">
            No Suggested Fixes Available
          </div>
          <div className="text-[10px] text-white/30 mt-1">
            Audit state does not currently trigger remediation suggestions.
          </div>
        </div>
      </div>
    )
  }

  return (
    <section className={`mt-4 pt-4 border-t-2 border-[#FFB800]/20 space-y-4 ${className}`}>
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="text-xs font-black text-[#FFB800] tracking-wider uppercase">
            Suggested Fixes Preview
          </div>
          <span className="px-1.5 py-0.5 bg-white/10 text-white/50 text-[9px] font-bold rounded uppercase">
            Read-Only
          </span>
        </div>
        <button
          onClick={() => setIsPanelExpanded(!isPanelExpanded)}
          className="text-white/50 hover:text-white transition-colors focus:outline-none focus:ring-1 focus:ring-[#FFB800]/50 rounded"
          aria-expanded={isPanelExpanded}
          aria-label="Toggle Remediation Panel"
        >
          {isPanelExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </header>

      {isPanelExpanded && (
        <div className="space-y-4">
          {/* MANDATORY WARNING BANNER */}
          <div className="px-4 py-3 bg-yellow-900/30 border-2 border-yellow-500/50 rounded-lg">
            <div className="flex items-center gap-2 text-xs font-black text-yellow-400 uppercase mb-2">
              <ShieldAlert size={14} />
              Preview Only — Not Applied
            </div>
            <ul className="text-[10px] text-yellow-300/80 space-y-1 font-medium list-disc list-inside">
              <li>Suggestions do not unlock Deploy.</li>
              <li>Human review required before any draft change.</li>
              <li>Re-run audit after any manual change.</li>
            </ul>
          </div>

          {/* SUMMARY STATS */}
          <div className="grid grid-cols-2 gap-2">
            <div className="px-2 py-2 bg-white/5 border border-white/10 rounded text-center">
              <div className="text-sm font-black text-white">{remediationPlan.totalIssues}</div>
              <div className="text-[9px] uppercase text-white/40 font-bold">Total Suggestions</div>
            </div>
            <div className="px-2 py-2 bg-red-900/20 border border-red-500/30 rounded text-center">
              <div className="text-sm font-black text-red-400">{remediationPlan.criticalCount}</div>
              <div className="text-[9px] uppercase text-red-300/60 font-bold">Critical Issues</div>
            </div>
            <div className="px-2 py-2 bg-yellow-900/20 border border-yellow-500/30 rounded text-center">
              <div className="text-sm font-black text-yellow-400">{remediationPlan.requiresApprovalCount}</div>
              <div className="text-[9px] uppercase text-yellow-300/60 font-bold">Requires Approval</div>
            </div>
            <div className="px-2 py-2 bg-white/10 border border-white/20 rounded text-center">
              <div className="text-sm font-black text-white/60">{remediationPlan.humanOnlyCount}</div>
              <div className="text-[9px] uppercase text-white/40 font-bold">Human-Only</div>
            </div>
          </div>

          {/* SUGGESTION CARDS */}
          <div className="space-y-3">
            {remediationPlan.suggestions.map((suggestion) => (
              <SuggestionCard
                key={suggestion.id}
                suggestion={suggestion}
                isExpanded={expandedSuggestions[suggestion.id] ?? remediationPlan.suggestions.length <= 5}
                onToggle={() => toggleSuggestion(suggestion.id)}
              />
            ))}
          </div>

          <footer className="text-[10px] text-white/30 text-center italic">
            Re-run audit after any manual change.
          </footer>
        </div>
      )}
    </section>
  )
}

/**
 * Individual Suggestion Card
 */
function SuggestionCard({
  suggestion,
  isExpanded,
  onToggle
}: {
  suggestion: RemediationSuggestion,
  isExpanded: boolean,
  onToggle: () => void
}) {
  const severityColors: Record<string, string> = {
    [RemediationSeverity.INFO]: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    [RemediationSeverity.WARNING]: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    [RemediationSeverity.HIGH]: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    [RemediationSeverity.CRITICAL]: 'bg-red-500/20 text-red-300 border-red-500/30',
  }

  const isHumanOnly = suggestion.safetyLevel === RemediationSafetyLevel.HUMAN_ONLY ||
                      suggestion.safetyLevel === RemediationSafetyLevel.FORBIDDEN_TO_AUTOFIX

  return (
    <article className={`border rounded-lg overflow-hidden transition-all ${isHumanOnly ? 'bg-white/5 border-white/10' : 'bg-white/10 border-white/20'}`}>
      <button
        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 transition-colors focus:outline-none focus:bg-white/5 text-left"
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded border ${severityColors[suggestion.severity] || severityColors[RemediationSeverity.INFO]}`}>
            {suggestion.severity}
          </span>
          <span className="px-1.5 py-0.5 bg-white/10 text-white/60 text-[9px] font-bold rounded uppercase">
            {suggestion.category.replace(/_/g, ' ')}
          </span>
          {suggestion.affectedLanguage && (
            <span className="px-1.5 py-0.5 bg-blue-900/30 text-blue-300 text-[9px] font-bold rounded uppercase">
              {suggestion.affectedLanguage}
            </span>
          )}
        </div>
        <div className="text-white/40">
          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
          <div className="space-y-1">
            <div className="text-[11px] font-bold text-white/80">{suggestion.issueDescription}</div>
            <div className="text-[10px] text-white/50 leading-relaxed italic">
              Rationale: {suggestion.rationale}
            </div>
          </div>

          {suggestion.suggestedText ? (
            <div className="space-y-1">
              <div className="text-[9px] font-black text-[#FFB800]/70 uppercase tracking-tighter">Suggested Preview:</div>
              <pre className="p-2 bg-black/40 border border-white/10 rounded text-[10px] text-emerald-400/90 whitespace-pre-wrap font-mono break-all overflow-x-auto">
                {suggestion.suggestedText}
              </pre>
            </div>
          ) : (
            <div className="p-2 bg-yellow-900/20 border border-yellow-500/30 rounded flex items-start gap-2">
              <Lock size={12} className="text-yellow-400 mt-0.5 shrink-0" />
              <div className="text-[10px] text-yellow-300/90 font-medium leading-tight">
                {suggestion.category === RemediationCategory.SOURCE_REVIEW && "Evidence required — human must verify and add source attribution."}
                {suggestion.category === RemediationCategory.PROVENANCE_REVIEW && "Provenance required — human must verify provenance data."}
                {suggestion.category === RemediationCategory.PARITY_REVIEW && "Human truth-source required — numeric/entity verification needed."}
                {![RemediationCategory.SOURCE_REVIEW, RemediationCategory.PROVENANCE_REVIEW, RemediationCategory.PARITY_REVIEW].includes(suggestion.category) && "Human review required — no automated suggestion."}
              </div>
            </div>
          )}

          <footer className="pt-2 border-t border-white/5 flex items-center justify-between">
            <div className="text-[9px] text-white/30 uppercase font-bold flex items-center gap-1">
              <Info size={10} />
              Does not unlock Deploy.
            </div>
            {suggestion.affectedField && (
              <div className="text-[9px] text-white/40 font-mono">
                Field: {suggestion.affectedField}
              </div>
            )}
          </footer>
        </div>
      )}
    </article>
  )
}
