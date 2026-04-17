/**
 * AI Review Scoring Component
 * Phase 3A.5: Manual review scoring UI
 */

'use client'

import { useState } from 'react'
import { saveReviewFeedback } from '@/lib/distribution/database'
import type { ReviewScore } from '@/lib/distribution/types'

interface AIReviewScoringProps {
  testId: string
  existingReview?: ReviewScore
  onReviewSaved?: (review: ReviewScore) => void
}

export default function AIReviewScoring({ 
  testId, 
  existingReview,
  onReviewSaved 
}: AIReviewScoringProps) {
  const [naturalness, setNaturalness] = useState(existingReview?.naturalness || 75)
  const [headlineQuality, setHeadlineQuality] = useState(existingReview?.headlineQuality || 75)
  const [platformFit, setPlatformFit] = useState(existingReview?.platformFit || 75)
  const [localeFit, setLocaleFit] = useState(existingReview?.localeFit || 75)
  const [complianceConfidence, setComplianceConfidence] = useState(existingReview?.complianceConfidence || 75)
  const [reviewerNotes, setReviewerNotes] = useState(existingReview?.reviewerNotes || '')
  const [saving, setSaving] = useState(false)

  const overall = Math.round(
    (naturalness + headlineQuality + platformFit + localeFit + complianceConfidence) / 5
  )

  const handleSave = async () => {
    setSaving(true)

    try {
      const review: ReviewScore = {
        naturalness,
        headlineQuality,
        platformFit,
        localeFit,
        complianceConfidence,
        overall,
        reviewerNotes: reviewerNotes.trim() || undefined,
        reviewedBy: 'admin', // TODO: Get from auth context
        reviewedAt: new Date()
      }

      await saveReviewFeedback(testId, review)

      if (onReviewSaved) {
        onReviewSaved(review)
      }

    } catch (error) {
      console.error('Failed to save review:', error)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-black uppercase mb-2">MANUAL_REVIEW_SCORING</h2>
        <p className="text-slate-400 text-sm">
          Rate the quality of AI-generated content across 5 dimensions
        </p>
      </div>

      {/* Overall Score */}
      <div className="bg-gradient-to-r from-blue-500/20 to-emerald-500/20 rounded-2xl p-6 border border-blue-500/40">
        <p className="text-sm text-slate-400 mb-2">OVERALL_SCORE</p>
        <p className="text-5xl font-black text-white">{overall}/100</p>
      </div>

      {/* Scoring Dimensions */}
      <div className="space-y-4">
        <ScoreSlider
          label="Naturalness"
          description="Does the content read naturally and fluently?"
          value={naturalness}
          onChange={setNaturalness}
        />

        <ScoreSlider
          label="Headline Quality"
          description="Is the headline compelling and accurate?"
          value={headlineQuality}
          onChange={setHeadlineQuality}
        />

        <ScoreSlider
          label="Platform Fit"
          description="Is the content optimized for the target platform?"
          value={platformFit}
          onChange={setPlatformFit}
        />

        <ScoreSlider
          label="Locale Fit"
          description="Is the localization culturally appropriate?"
          value={localeFit}
          onChange={setLocaleFit}
        />

        <ScoreSlider
          label="Compliance Confidence"
          description="Does the content meet compliance standards?"
          value={complianceConfidence}
          onChange={setComplianceConfidence}
        />
      </div>

      {/* Reviewer Notes */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <label className="block text-sm font-bold text-slate-400 mb-2">
          REVIEWER_NOTES (optional)
        </label>
        <textarea
          value={reviewerNotes}
          onChange={(e) => setReviewerNotes(e.target.value)}
          placeholder="Add any additional feedback or observations..."
          rows={4}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none resize-none"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full py-4 rounded-lg font-black uppercase transition-all ${
          saving
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
            : 'bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer'
        }`}
      >
        {saving ? 'SAVING...' : 'SAVE_REVIEW'}
      </button>

      {existingReview && (
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4">
          <p className="text-blue-500 text-sm">
            ℹ️ Last reviewed by {existingReview.reviewedBy} on{' '}
            {existingReview.reviewedAt.toLocaleString()}
          </p>
        </div>
      )}
    </div>
  )
}

function ScoreSlider({
  label,
  description,
  value,
  onChange
}: {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
}) {
  const getColor = (score: number) => {
    if (score >= 80) return 'emerald'
    if (score >= 60) return 'blue'
    if (score >= 40) return 'yellow'
    return 'red'
  }

  const color = getColor(value)
  const colorClasses = {
    emerald: 'bg-emerald-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500'
  }

  return (
    <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-sm font-black uppercase">{label}</h3>
          <p className="text-xs text-slate-400">{description}</p>
        </div>
        <span className={`text-2xl font-black ${
          color === 'emerald' ? 'text-emerald-500' :
          color === 'blue' ? 'text-blue-500' :
          color === 'yellow' ? 'text-yellow-500' :
          'text-red-500'
        }`}>
          {value}
        </span>
      </div>
      
      <input
        type="range"
        min="0"
        max="100"
        step="5"
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-black/40"
        style={{
          background: `linear-gradient(to right, ${
            color === 'emerald' ? '#10b981' :
            color === 'blue' ? '#3b82f6' :
            color === 'yellow' ? '#eab308' :
            '#ef4444'
          } ${value}%, rgba(0,0,0,0.4) ${value}%)`
        }}
      />
      
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>0</span>
        <span>50</span>
        <span>100</span>
      </div>
    </div>
  )
}
