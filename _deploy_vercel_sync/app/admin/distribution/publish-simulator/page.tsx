/**
 * Publish Simulator Admin Page
 * Phase 3B: Testing interface for platform publishing (dry-run only)
 */

'use client'

import { useState, useEffect } from 'react'
import { isFeatureEnabled } from '@/lib/distribution/feature-flags'
import PublishSimulator from '@/components/distribution/PublishSimulator'
import PublishResultLog from '@/components/distribution/PublishResultLog'
import type { PublishResult } from '@/lib/distribution/types'
import { getAllPublishResults } from '@/lib/distribution/database'

export default function PublishSimulatorPage() {
  const [results, setResults] = useState<PublishResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'simulator' | 'log'>('simulator')
  
  const featureEnabled = isFeatureEnabled('enablePublishSimulation')
  
  useEffect(() => {
    loadResults()
  }, [])
  
  const loadResults = async () => {
    setIsLoading(true)
    try {
      const data = await getAllPublishResults()
      setResults(data)
    } catch (error) {
      console.error('Failed to load results:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  if (!featureEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-2xl p-8">
            <h1 className="text-2xl font-black uppercase mb-4 text-yellow-500">
              FEATURE_DISABLED
            </h1>
            <p className="text-slate-300 mb-4">
              The publish simulation feature is currently disabled.
            </p>
            <p className="text-sm text-slate-400">
              To enable this feature, set <code className="bg-black/40 px-2 py-1 rounded">enablePublishSimulation</code> to true in feature flags.
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-black uppercase mb-2">PUBLISH_SIMULATOR</h1>
          <p className="text-slate-400">
            Test platform publishing with dry-run simulation. No real publishing occurs.
          </p>
        </div>
        
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-6 py-3 rounded-lg font-bold uppercase transition-colors ${
              activeTab === 'simulator'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            Simulator
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`px-6 py-3 rounded-lg font-bold uppercase transition-colors ${
              activeTab === 'log'
                ? 'bg-blue-500 text-white'
                : 'bg-white/5 text-slate-400 hover:bg-white/10'
            }`}
          >
            Result Log ({results.length})
          </button>
        </div>
        
        {/* Content */}
        {activeTab === 'simulator' ? (
          <PublishSimulator />
        ) : (
          <PublishResultLog results={results} onRefresh={loadResults} />
        )}
      </div>
    </div>
  )
}
