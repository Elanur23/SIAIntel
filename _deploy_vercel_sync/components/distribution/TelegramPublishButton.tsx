'use client'

/**
 * Telegram Publish Button Component
 * Phase 3C Step 1: Manual publish UI with preview and confirmation
 * 
 * CRITICAL SAFETY:
 * - Shows preview before publish
 * - Displays safety scores
 * - Requires manual confirmation
 * - Shows mode (SANDBOX vs PRODUCTION)
 * - Blocks publish if validation fails
 */

import { useState } from 'react'
import type { PublishPayload, Language, Platform } from '@/lib/distribution/types'
import type { TrendCategory } from '@/lib/distribution/trends/trend-types'
import type {
  TelegramPublishRequest,
  TelegramPublishResponse,
  PrePublishValidation
} from '@/lib/distribution/publishing/telegram-publish-service'
import type { TelegramPublishMode } from '@/lib/distribution/publishing/telegram-real-adapter'

// ============================================================================
// TYPES
// ============================================================================

interface TelegramPublishButtonProps {
  payload: PublishPayload
  context: {
    locale: Language
    platform: Platform
    category: TrendCategory
    headline: string
    hook: string
    body: string
  }
  metadata?: {
    articleId?: string
    articleTitle?: string
    variantType?: string
  }
  mode?: TelegramPublishMode
  onPublishComplete?: (response: TelegramPublishResponse) => void
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function TelegramPublishButton({
  payload,
  context,
  metadata,
  mode = 'sandbox',
  onPublishComplete
}: TelegramPublishButtonProps) {
  const [showPreview, setShowPreview] = useState(false)
  const [validation, setValidation] = useState<PrePublishValidation | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishResponse, setPublishResponse] = useState<TelegramPublishResponse | null>(null)
  
  // Handle preview click
  const handlePreview = async () => {
    setShowPreview(true)
    setIsValidating(true)
    setValidation(null)
    
    try {
      const response = await fetch('/api/distribution/telegram/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload,
          context,
          mode
        })
      })
      
      const data = await response.json()
      setValidation(data.validation)
    } catch (error) {
      console.error('Validation error:', error)
      setValidation({
        canPublish: false,
        mode,
        errors: ['Failed to validate: ' + (error instanceof Error ? error.message : 'Unknown error')],
        warnings: [],
        safetyChecks: {
          featureFlagEnabled: false,
          configurationValid: false,
          trustScorePass: false,
          complianceScorePass: false,
          brandSafetyPass: false
        },
        scores: {
          trustScore: 0,
          complianceScore: 0,
          brandSafetyScore: 0
        }
      })
    } finally {
      setIsValidating(false)
    }
  }
  
  // Handle publish confirmation
  const handlePublish = async () => {
    if (!validation?.canPublish) return
    
    setIsPublishing(true)
    
    try {
      const request: TelegramPublishRequest = {
        payload,
        context,
        mode,
        metadata
      }
      
      const response = await fetch('/api/distribution/telegram/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      })
      
      const data: TelegramPublishResponse = await response.json()
      setPublishResponse(data)
      
      if (onPublishComplete) {
        onPublishComplete(data)
      }
    } catch (error) {
      console.error('Publish error:', error)
    } finally {
      setIsPublishing(false)
    }
  }
  
  // Handle close
  const handleClose = () => {
    setShowPreview(false)
    setValidation(null)
    setPublishResponse(null)
  }
  
  return (
    <>
      {/* Publish Button */}
      <button
        onClick={handlePreview}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Publish to Telegram ({mode.toUpperCase()})
      </button>
      
      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  Telegram Publish Preview
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              
              {/* Mode Badge */}
              <div className="mt-2">
                {mode === 'sandbox' ? (
                  <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    🧪 SANDBOX MODE - Test Only
                  </span>
                ) : (
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    🚨 PRODUCTION MODE - Real Publishing
                  </span>
                )}
              </div>
            </div>
            
            {/* Content Preview */}
            <div className="p-6 border-b">
              <h3 className="font-semibold mb-2">Message Preview:</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {payload.content.title && (
                  <div className="font-bold mb-2">{payload.content.title}</div>
                )}
                <div className="whitespace-pre-wrap">{payload.content.body}</div>
                {payload.content.hashtags.length > 0 && (
                  <div className="mt-2 text-blue-600">
                    {payload.content.hashtags.map(tag => `#${tag}`).join(' ')}
                  </div>
                )}
              </div>
            </div>
            
            {/* Validation Status */}
            <div className="p-6 border-b">
              <h3 className="font-semibold mb-3">Safety Validation:</h3>
              
              {isValidating ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Validating...</p>
                </div>
              ) : validation ? (
                <>
                  {/* Safety Checks */}
                  <div className="space-y-2 mb-4">
                    <CheckItem
                      label="Feature Flag Enabled"
                      passed={validation.safetyChecks.featureFlagEnabled}
                    />
                    <CheckItem
                      label="Configuration Valid"
                      passed={validation.safetyChecks.configurationValid}
                    />
                    <CheckItem
                      label="Brand Safety Pass"
                      passed={validation.safetyChecks.brandSafetyPass}
                    />
                    <CheckItem
                      label="Trust Score Pass"
                      passed={validation.safetyChecks.trustScorePass}
                    />
                    <CheckItem
                      label="Compliance Score Pass"
                      passed={validation.safetyChecks.complianceScorePass}
                    />
                  </div>
                  
                  {/* Scores */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <ScoreCard
                      label="Brand Safety"
                      score={validation.scores.brandSafetyScore}
                      threshold={60}
                    />
                    <ScoreCard
                      label="Trust"
                      score={validation.scores.trustScore}
                      threshold={70}
                    />
                    <ScoreCard
                      label="Compliance"
                      score={validation.scores.complianceScore}
                      threshold={70}
                    />
                  </div>
                  
                  {/* Errors */}
                  {validation.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-red-800 mb-2">Errors:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.errors.map((error, i) => (
                          <li key={i} className="text-red-700 text-sm">{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {/* Warnings */}
                  {validation.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="font-semibold text-yellow-800 mb-2">Warnings:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {validation.warnings.map((warning, i) => (
                          <li key={i} className="text-yellow-700 text-sm">{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : null}
            </div>
            
            {/* Publish Result */}
            {publishResponse && (
              <div className="p-6 border-b">
                <h3 className="font-semibold mb-3">Publish Result:</h3>
                {publishResponse.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                      ✓ Published Successfully
                    </div>
                    {publishResponse.publishResult?.messageId && (
                      <p className="text-sm text-green-700">
                        Message ID: {publishResponse.publishResult.messageId}
                      </p>
                    )}
                    <p className="text-sm text-green-700">
                      Mode: {publishResponse.mode.toUpperCase()}
                    </p>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                      ✗ Publish Failed
                    </div>
                    {publishResponse.publishResult?.error && (
                      <p className="text-sm text-red-700">
                        {publishResponse.publishResult.error.message}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Actions */}
            <div className="p-6 flex gap-3 justify-end">
              <button
                onClick={handleClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              
              {!publishResponse && validation?.canPublish && (
                <button
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPublishing ? 'Publishing...' : 'Confirm & Publish'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

function CheckItem({ label, passed }: { label: string; passed: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span className={passed ? 'text-green-600' : 'text-red-600'}>
        {passed ? '✓' : '✗'}
      </span>
      <span className="text-sm">{label}</span>
    </div>
  )
}

function ScoreCard({
  label,
  score,
  threshold
}: {
  label: string
  score: number
  threshold: number
}) {
  const passed = score >= threshold
  
  return (
    <div className="bg-gray-50 rounded-lg p-3">
      <div className="text-xs text-gray-600 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
        {score}
      </div>
      <div className="text-xs text-gray-500">
        Threshold: {threshold}
      </div>
    </div>
  )
}
