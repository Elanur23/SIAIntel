/**
 * Publish Result Log Component
 * Phase 3B: Display simulation results history
 */

'use client'

import { useState, useEffect } from 'react'
import type { PublishResult } from '@/lib/distribution/types'

interface PublishResultLogProps {
  results: PublishResult[]
  onRefresh?: () => void
}

export default function PublishResultLog({ results, onRefresh }: PublishResultLogProps) {
  const [filter, setFilter] = useState<'all' | 'success' | 'failure' | 'validation_failed'>('all')
  
  const filteredResults = results.filter(result => {
    if (filter === 'all') return true
    if (filter === 'success') return result.status === 'simulated_success'
    if (filter === 'failure') return result.status === 'simulated_failure'
    if (filter === 'validation_failed') return result.status === 'validation_failed'
    return true
  })
  
  const stats = {
    total: results.length,
    success: results.filter(r => r.status === 'simulated_success').length,
    failure: results.filter(r => r.status === 'simulated_failure').length,
    validationFailed: results.filter(r => r.status === 'validation_failed').length
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-black uppercase">PUBLISH_RESULT_LOG</h2>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-xs text-blue-500 hover:text-blue-400 transition-colors"
            >
              ↻ REFRESH
            </button>
          )}
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-black/40 rounded-lg p-3">
            <div className="text-xs text-slate-400 mb-1">Total</div>
            <div className="text-2xl font-black">{stats.total}</div>
          </div>
          <div className="bg-emerald-500/10 rounded-lg p-3">
            <div className="text-xs text-emerald-400 mb-1">Success</div>
            <div className="text-2xl font-black text-emerald-500">{stats.success}</div>
          </div>
          <div className="bg-red-500/10 rounded-lg p-3">
            <div className="text-xs text-red-400 mb-1">Failure</div>
            <div className="text-2xl font-black text-red-500">{stats.failure}</div>
          </div>
          <div className="bg-yellow-500/10 rounded-lg p-3">
            <div className="text-xs text-yellow-400 mb-1">Invalid</div>
            <div className="text-2xl font-black text-yellow-500">{stats.validationFailed}</div>
          </div>
        </div>
      </div>
      
      {/* Filter */}
      <div className="flex gap-2">
        {(['all', 'success', 'failure', 'validation_failed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-colors ${
              filter === f
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            {f.replace('_', ' ')}
          </button>
        ))}
      </div>
      
      {/* Results List */}
      <div className="space-y-3">
        {filteredResults.length === 0 ? (
          <div className="bg-white/5 rounded-2xl p-8 border border-white/10 text-center">
            <p className="text-slate-400">No results to display</p>
          </div>
        ) : (
          filteredResults.map((result) => (
            <div
              key={result.id}
              className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold uppercase">{result.platform}</span>
                    <span className={`text-xs px-2 py-1 rounded ${
                      result.status === 'simulated_success'
                        ? 'bg-emerald-500/20 text-emerald-500'
                        : result.status === 'simulated_failure'
                        ? 'bg-red-500/20 text-red-500'
                        : 'bg-yellow-500/20 text-yellow-500'
                    }`}>
                      {result.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-xs text-slate-400">Delay</div>
                  <div className="text-sm font-bold">{result.simulation.estimatedDelay.toFixed(0)}ms</div>
                </div>
              </div>
              
              {/* Content Preview */}
              <div className="bg-black/40 rounded-lg p-3 mb-3">
                <div className="text-xs text-slate-300 line-clamp-2">
                  {result.payload.content.body}
                </div>
              </div>
              
              {/* Details */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400">Characters:</span>{' '}
                  <span className="text-white font-bold">
                    {result.payload.formatting.characterCount}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Hashtags:</span>{' '}
                  <span className="text-white font-bold">
                    {result.payload.content.hashtags.length}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Language:</span>{' '}
                  <span className="text-white font-bold uppercase">
                    {result.payload.metadata.language}
                  </span>
                </div>
              </div>
              
              {/* Mock URL */}
              {result.simulation.mockResponse.postUrl && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-slate-400 mb-1">Mock URL:</div>
                  <div className="text-xs text-blue-400 font-mono truncate">
                    {result.simulation.mockResponse.postUrl}
                  </div>
                </div>
              )}
              
              {/* Error */}
              {result.error && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-red-400">
                    <div className="font-bold mb-1">{result.error.code}</div>
                    <div>{result.error.message}</div>
                  </div>
                </div>
              )}
              
              {/* Warnings */}
              {result.validation.warnings.length > 0 && (
                <div className="mt-3 pt-3 border-t border-white/10">
                  <div className="text-xs text-yellow-500 space-y-1">
                    {result.validation.warnings.map((warning, idx) => (
                      <div key={idx}>⚠️ {warning.message}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
