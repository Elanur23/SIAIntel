'use client'

/**
 * Autonomous Distribution Assistant UI
 * Phase 3D: Human-in-the-loop suggestion interface
 * 
 * CRITICAL: This is NOT automation. All actions require manual approval.
 */

import { useState, useEffect } from 'react'
import TelegramPublishButton from './TelegramPublishButton'
import type { AutonomousSuggestion } from '@/lib/distribution/autonomous/autonomous-types'
import type { PublishPayload } from '@/lib/distribution/types'

export default function AutonomousAssistant() {
  const [suggestions, setSuggestions] = useState<AutonomousSuggestion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedSuggestion, setSelectedSuggestion] = useState<AutonomousSuggestion | null>(null)
  
  // Load suggestions on demand
  const loadSuggestions = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/distribution/autonomous/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'telegram',
          locale: 'en',
          limit: 3,
          minScore: 60
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuggestions(data.response.suggestions)
      } else {
        setError(data.error || 'Failed to load suggestions')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }
  
  // Approve suggestion
  const handleApprove = async (suggestion: AutonomousSuggestion) => {
    try {
      const response = await fetch('/api/distribution/autonomous/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          approvedBy: 'admin' // TODO: get from auth
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update local state
        setSuggestions(prev => prev.map(s => 
          s.id === suggestion.id ? { ...s, status: 'approved' } : s
        ))
        
        // Show publish modal
        setSelectedSuggestion(data.result.suggestion)
      }
    } catch (err) {
      console.error('Approval error:', err)
    }
  }
  
  // Reject suggestion
  const handleReject = async (suggestion: AutonomousSuggestion) => {
    const reason = prompt('Rejection reason:')
    if (!reason) return
    
    try {
      const response = await fetch('/api/distribution/autonomous/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestionId: suggestion.id,
          rejectedBy: 'admin',
          reason
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Remove from list
        setSuggestions(prev => prev.filter(s => s.id !== suggestion.id))
      }
    } catch (err) {
      console.error('Rejection error:', err)
    }
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black uppercase">Autonomous Assistant</h2>
          <p className="text-slate-400 text-sm mt-1">
            AI-powered suggestions • Manual approval required
          </p>
        </div>
        
        <button
          onClick={loadSuggestions}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Loading...' : 'Generate Suggestions'}
        </button>
      </div>
      
      {/* Warning */}
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
        <p className="text-yellow-500 font-bold mb-1">🤖 Human-in-the-Loop System</p>
        <p className="text-slate-400 text-sm">
          This assistant suggests content but does NOT auto-publish. All actions require manual approval.
        </p>
      </div>
      
      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-500 font-bold">Error</p>
          <p className="text-slate-400 text-sm">{error}</p>
        </div>
      )}
      
      {/* Suggestions */}
      {suggestions.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Top Suggestions Today</h3>
          
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              rank={index + 1}
              onApprove={() => handleApprove(suggestion)}
              onReject={() => handleReject(suggestion)}
            />
          ))}
        </div>
      ) : !loading && (
        <div className="text-center py-12 text-slate-400">
          <p>No suggestions yet. Click "Generate Suggestions" to start.</p>
        </div>
      )}
      
      {/* Publish Modal */}
      {selectedSuggestion && (
        <PublishModal
          suggestion={selectedSuggestion}
          onClose={() => setSelectedSuggestion(null)}
        />
      )}
    </div>
  )
}

// ============================================================================
// SUGGESTION CARD
// ============================================================================

function SuggestionCard({
  suggestion,
  rank,
  onApprove,
  onReject
}: {
  suggestion: AutonomousSuggestion
  rank: number
  onApprove: () => void
  onReject: () => void
}) {
  const [showDetails, setShowDetails] = useState(false)
  
  const scoreColor = 
    suggestion.overallScore >= 80 ? 'text-green-500' :
    suggestion.overallScore >= 60 ? 'text-yellow-500' :
    'text-red-500'
  
  const confidenceColor =
    suggestion.reasoning.confidence === 'high' ? 'bg-green-500/20 text-green-500' :
    suggestion.reasoning.confidence === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
    'bg-red-500/20 text-red-500'
  
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl font-black text-slate-500">#{rank}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${confidenceColor}`}>
              {suggestion.reasoning.confidence.toUpperCase()} CONFIDENCE
            </span>
          </div>
          
          <h3 className="text-xl font-bold mb-2">{suggestion.suggestedHeadline}</h3>
          
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>📱 {suggestion.suggestedPlatform}</span>
            <span>🌍 {suggestion.suggestedLocale}</span>
            <span>📂 {suggestion.suggestedCategory}</span>
            <span>⏰ {suggestion.suggestedPublishTime.toLocaleTimeString()}</span>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`text-4xl font-black ${scoreColor}`}>
            {suggestion.overallScore}
          </div>
          <div className="text-xs text-slate-400">Overall Score</div>
        </div>
      </div>
      
      {/* Body Preview */}
      <div className="bg-black/20 rounded-lg p-4 mb-4">
        <p className="text-sm text-slate-300 line-clamp-3">
          {suggestion.suggestedBody}
        </p>
      </div>
      
      {/* Scores */}
      <div className="grid grid-cols-5 gap-3 mb-4">
        <ScoreBadge label="Trend" score={suggestion.scores.trendRelevance} />
        <ScoreBadge label="Engagement" score={suggestion.scores.engagementPotential} />
        <ScoreBadge label="Timing" score={suggestion.scores.timingScore} />
        <ScoreBadge label="Platform" score={suggestion.scores.platformFit} />
        <ScoreBadge label="Safety" score={suggestion.scores.safetyScore} />
      </div>
      
      {/* Reasoning */}
      {showDetails && (
        <div className="bg-black/20 rounded-lg p-4 mb-4 space-y-3">
          <ReasoningSection title="Why Selected" items={suggestion.reasoning.contentSelection} />
          <ReasoningSection title="Headline Choice" items={suggestion.reasoning.headlineChoice} />
          <ReasoningSection title="Platform Choice" items={suggestion.reasoning.platformChoice} />
          <ReasoningSection title="Timing Choice" items={suggestion.reasoning.timingChoice} />
          {suggestion.reasoning.risks.length > 0 && (
            <ReasoningSection title="Risks" items={suggestion.reasoning.risks} color="text-yellow-500" />
          )}
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onApprove}
          disabled={suggestion.status !== 'pending'}
          className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✓ Approve & Publish
        </button>
        
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20"
        >
          {showDetails ? 'Hide' : 'Details'}
        </button>
        
        <button
          onClick={onReject}
          disabled={suggestion.status !== 'pending'}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✗ Reject
        </button>
      </div>
      
      {/* Status */}
      {suggestion.status !== 'pending' && (
        <div className="mt-3 text-sm text-slate-400">
          Status: <span className="font-bold">{suggestion.status.toUpperCase()}</span>
        </div>
      )}
    </div>
  )
}

function ScoreBadge({ label, score }: { label: string; score: number }) {
  const color = 
    score >= 80 ? 'bg-green-500/20 text-green-500' :
    score >= 60 ? 'bg-yellow-500/20 text-yellow-500' :
    'bg-red-500/20 text-red-500'
  
  return (
    <div className={`${color} rounded-lg p-2 text-center`}>
      <div className="text-lg font-bold">{score}</div>
      <div className="text-xs">{label}</div>
    </div>
  )
}

function ReasoningSection({ 
  title, 
  items, 
  color = 'text-slate-300' 
}: { 
  title: string
  items: string[]
  color?: string
}) {
  return (
    <div>
      <h4 className="text-sm font-bold text-slate-400 mb-1">{title}:</h4>
      <ul className={`text-sm ${color} space-y-1`}>
        {items.map((item, i) => (
          <li key={i}>• {item}</li>
        ))}
      </ul>
    </div>
  )
}

// ============================================================================
// PUBLISH MODAL
// ============================================================================

function PublishModal({
  suggestion,
  onClose
}: {
  suggestion: AutonomousSuggestion
  onClose: () => void
}) {
  // Create publish payload
  const payload: PublishPayload = {
    platform: suggestion.suggestedPlatform,
    content: {
      title: suggestion.suggestedHeadline,
      body: suggestion.suggestedBody,
      hashtags: [],
      mentions: [],
      mediaUrls: []
    },
    metadata: {
      language: suggestion.suggestedLocale,
      priority: 'normal'
    },
    formatting: {
      characterCount: suggestion.suggestedBody.length,
      characterLimit: 4096,
      hasMedia: false,
      hasLinks: false,
      hasHashtags: false
    }
  }
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-[#0A0A0C] border border-white/10 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-black">Ready to Publish</h2>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
          
          <p className="text-slate-400 mb-6">
            Suggestion approved. Click below to proceed with manual publishing.
          </p>
          
          <TelegramPublishButton
            payload={payload}
            context={{
              locale: suggestion.suggestedLocale,
              platform: suggestion.suggestedPlatform,
              category: suggestion.suggestedCategory,
              headline: suggestion.suggestedHeadline,
              hook: suggestion.suggestedBody.substring(0, 200),
              body: suggestion.suggestedBody
            }}
            metadata={{
              articleId: suggestion.articleId,
              articleTitle: suggestion.articleTitle,
              variantType: suggestion.suggestedVariant
            }}
            mode="sandbox"
            onPublishComplete={() => {
              onClose()
              alert('Published successfully!')
            }}
          />
        </div>
      </div>
    </div>
  )
}
