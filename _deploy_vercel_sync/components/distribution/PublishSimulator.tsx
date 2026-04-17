/**
 * Publish Simulator Component
 * Phase 3B: UI for testing platform publishing (dry-run only)
 */

'use client'

import { useState } from 'react'
import type { Platform, PlatformContent, PublishResult } from '@/lib/distribution/types'
import { simulatePublish, simulateMultiPlatformPublish, getAllPlatformCapabilities } from '@/lib/distribution/publishing/publishing-engine'

const PLATFORMS: Platform[] = ['x', 'linkedin', 'telegram', 'facebook']

export default function PublishSimulator() {
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['x'])
  const [content, setContent] = useState<PlatformContent>({
    title: 'Bitcoin Surges 8% Following Institutional Buying Pressure',
    body: 'Bitcoin surged 8% to $67,500 following institutional buying pressure observed across major exchanges. The movement occurred during Asian trading hours with over $2.3B in net inflows.',
    hashtags: ['Bitcoin', 'Crypto', 'Markets'],
    language: 'en',
    status: 'draft'
  })
  const [results, setResults] = useState<PublishResult[]>([])
  const [isSimulating, setIsSimulating] = useState(false)
  
  const capabilities = getAllPlatformCapabilities()
  
  const handlePlatformToggle = (platform: Platform) => {
    setSelectedPlatforms(prev => 
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    )
  }
  
  const handleSimulate = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform')
      return
    }
    
    setIsSimulating(true)
    setResults([])
    
    try {
      const simulationResults = await simulateMultiPlatformPublish(selectedPlatforms, content)
      setResults(simulationResults)
    } catch (error) {
      console.error('Simulation error:', error)
      alert('Simulation failed. Check console for details.')
    } finally {
      setIsSimulating(false)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-black uppercase mb-2">PUBLISH_SIMULATOR</h2>
        <p className="text-slate-400 text-sm">
          Test platform publishing with dry-run simulation. No real publishing occurs.
        </p>
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <p className="text-xs text-yellow-500">
            ⚠️ DRY-RUN MODE: This is simulation only. No content will be published to real platforms.
          </p>
        </div>
      </div>
      
      {/* Platform Selection */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-black uppercase mb-4">SELECT_PLATFORMS</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {PLATFORMS.map(platform => {
            const cap = capabilities.find(c => c.platform === platform)
            return (
              <button
                key={platform}
                onClick={() => handlePlatformToggle(platform)}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedPlatforms.includes(platform)
                    ? 'border-blue-500 bg-blue-500/20'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                <div className="text-sm font-bold uppercase mb-2">{platform}</div>
                {cap && (
                  <div className="text-xs text-slate-400 space-y-1">
                    <div>Limit: {cap.characterLimit}</div>
                    <div>Tags: {cap.hashtagLimit}</div>
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Content Input */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-black uppercase mb-4">CONTENT</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2">Title</label>
            <input
              type="text"
              value={content.title}
              onChange={(e) => setContent({ ...content, title: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white"
              placeholder="Enter title..."
            />
          </div>
          
          <div>
            <label className="block text-xs text-slate-400 mb-2">Body</label>
            <textarea
              value={content.body}
              onChange={(e) => setContent({ ...content, body: e.target.value })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white h-32"
              placeholder="Enter content..."
            />
          </div>
          
          <div>
            <label className="block text-xs text-slate-400 mb-2">Hashtags (comma-separated)</label>
            <input
              type="text"
              value={content.hashtags.join(', ')}
              onChange={(e) => setContent({ 
                ...content, 
                hashtags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
              })}
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white"
              placeholder="Bitcoin, Crypto, Markets"
            />
          </div>
        </div>
      </div>
      
      {/* Simulate Button */}
      <button
        onClick={handleSimulate}
        disabled={isSimulating || selectedPlatforms.length === 0}
        className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-4 rounded-lg transition-colors"
      >
        {isSimulating ? 'SIMULATING...' : 'SIMULATE PUBLISH'}
      </button>
      
      {/* Results */}
      {results.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-black uppercase mb-4">SIMULATION_RESULTS</h3>
          <div className="space-y-4">
            {results.map((result, idx) => (
              <div 
                key={idx}
                className={`p-4 rounded-lg border ${
                  result.status === 'simulated_success'
                    ? 'border-emerald-500/40 bg-emerald-500/10'
                    : result.status === 'simulated_failure'
                    ? 'border-red-500/40 bg-red-500/10'
                    : 'border-yellow-500/40 bg-yellow-500/10'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold uppercase">{result.platform}</span>
                  <span className={`text-xs font-bold ${
                    result.status === 'simulated_success'
                      ? 'text-emerald-500'
                      : result.status === 'simulated_failure'
                      ? 'text-red-500'
                      : 'text-yellow-500'
                  }`}>
                    {result.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                {result.status === 'simulated_success' && result.simulation.mockResponse.postUrl && (
                  <div className="text-xs text-slate-400 mb-2">
                    Mock URL: {result.simulation.mockResponse.postUrl}
                  </div>
                )}
                
                {result.error && (
                  <div className="text-xs text-red-400 mb-2">
                    Error: {result.error.message}
                  </div>
                )}
                
                <div className="text-xs text-slate-500">
                  Delay: {result.simulation.estimatedDelay.toFixed(0)}ms | 
                  Characters: {result.payload.formatting.characterCount}
                </div>
                
                {result.validation.warnings.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {result.validation.warnings.map((warning, wIdx) => (
                      <div key={wIdx} className="text-xs text-yellow-500">
                        ⚠️ {warning.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
