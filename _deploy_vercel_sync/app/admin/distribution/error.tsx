'use client'

/**
 * Distribution Error Page
 * Phase 4C: Stability Hardening
 * 
 * Catches errors specific to distribution workflows
 */

import { useEffect } from 'react'

export default function DistributionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service in production
    console.error('[DISTRIBUTION ERROR]', error)
  }, [error])

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-lg p-8">
        {/* Error Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
        </div>

        {/* Error Message */}
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          DISTRIBUTION_ERROR
        </h1>
        <p className="text-slate-400 text-center mb-6">
          An error occurred in the distribution system. The error has been logged for investigation.
        </p>

        {/* Error Details (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-black/30 rounded-lg border border-red-500/20">
            <p className="text-sm font-mono text-red-400 break-words">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-slate-500 mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-colors uppercase tracking-wide"
          >
            Retry Operation
          </button>
          <a
            href="/admin/distribution"
            className="block w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-4 rounded-lg text-center transition-colors uppercase tracking-wide"
          >
            Return to Distribution Dashboard
          </a>
          <a
            href="/admin"
            className="block w-full text-slate-400 hover:text-white text-center py-2 transition-colors"
          >
            Go to Admin Panel
          </a>
        </div>

        {/* System Status */}
        <div className="mt-6 pt-6 border-t border-white/10">
          <p className="text-xs text-slate-500 text-center">
            Distribution system status: Operational with errors
          </p>
          <p className="text-xs text-slate-500 text-center mt-1">
            Feature flags and safety checks remain active
          </p>
        </div>
      </div>
    </div>
  )
}
