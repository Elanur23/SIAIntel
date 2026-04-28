'use client'

import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import { RemediationLedgerEntry } from '../hooks/useLocalDraftRemediationController'

interface SessionLedgerSummaryProps {
  sessionRemediationLedger: RemediationLedgerEntry[]
  visible: boolean
}

/**
 * Session Ledger Summary Component
 * 
 * Displays read-only history of session remediation changes.
 * 
 * CRITICAL SAFETY RULES:
 * - Read-only display only (no rollback button)
 * - No mutations
 * - No backend calls
 * - No persistence
 * - No state changes
 * - No rollback execution
 * - Display only
 */
export default function SessionLedgerSummary({
  sessionRemediationLedger,
  visible
}: SessionLedgerSummaryProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Do not render if not visible or no ledger entries
  if (!visible || sessionRemediationLedger.length === 0) return null

  const count = sessionRemediationLedger.length

  return (
    <div className="space-y-2">
      {/* Collapsible Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-neutral-900/50 border border-neutral-700/50 rounded-md hover:bg-neutral-900/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Clock size={14} className="text-neutral-400" />
          <span className="text-xs font-bold text-neutral-300 uppercase tracking-wide">
            Session Changes
          </span>
          <span className="text-xs font-normal text-neutral-500">
            ({count})
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp size={14} className="text-neutral-400" />
        ) : (
          <ChevronDown size={14} className="text-neutral-400" />
        )}
      </button>

      {/* Expanded Ledger Entries */}
      {isExpanded && (
        <div className="space-y-2 px-2">
          {/* Session Only Warning */}
          <div className="px-3 py-2 bg-yellow-900/20 border border-yellow-500/30 rounded-md text-xs text-yellow-300/90 leading-relaxed">
            Session Only — Not Saved to Vault — Not Deployed
          </div>

          {/* Ledger Entries (Most Recent First) */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {[...sessionRemediationLedger].reverse().map((entry, index) => {
              const { appliedEvent, snapshot } = entry
              const reverseIndex = count - index

              // Format timestamp
              const timestamp = appliedEvent.createdAt
                ? new Date(appliedEvent.createdAt).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                  })
                : 'Unknown'

              // Extract metadata
              const suggestionId = appliedEvent.suggestionId || 'Unknown'
              const category = appliedEvent.category || 'Unknown'
              const language = appliedEvent.affectedLanguage || 'Unknown'
              const field = appliedEvent.affectedField || 'Unknown'

              return (
                <div
                  key={snapshot.snapshotId || index}
                  className="px-3 py-2 bg-neutral-900/30 border border-neutral-700/30 rounded-md space-y-1"
                >
                  {/* Entry Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-neutral-300">
                      #{reverseIndex}
                    </span>
                    <span className="text-xs text-neutral-500 font-mono">
                      {timestamp}
                    </span>
                  </div>

                  {/* Entry Metadata */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                    <div>
                      <span className="text-neutral-500">Category:</span>{' '}
                      <span className="text-neutral-300 font-medium">{category}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Field:</span>{' '}
                      <span className="text-neutral-300 font-medium">{field}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">Language:</span>{' '}
                      <span className="text-neutral-300 font-medium">{language}</span>
                    </div>
                    <div>
                      <span className="text-neutral-500">ID:</span>{' '}
                      <span className="text-neutral-400 font-mono text-[10px]">
                        {suggestionId.slice(0, 8)}...
                      </span>
                    </div>
                  </div>

                  {/* Optional: Text Snippets */}
                  {appliedEvent.originalText && appliedEvent.appliedText && (
                    <div className="mt-2 pt-2 border-t border-neutral-700/30 space-y-1">
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wide">
                        Change Preview
                      </div>
                      <div className="text-xs text-red-400/70 line-through">
                        {appliedEvent.originalText.slice(0, 60)}
                        {appliedEvent.originalText.length > 60 ? '...' : ''}
                      </div>
                      <div className="text-xs text-green-400/70">
                        {appliedEvent.appliedText.slice(0, 60)}
                        {appliedEvent.appliedText.length > 60 ? '...' : ''}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Empty State (Should Not Render Due to Guard) */}
          {count === 0 && (
            <div className="px-3 py-4 text-center text-xs text-neutral-500">
              No session changes recorded.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
