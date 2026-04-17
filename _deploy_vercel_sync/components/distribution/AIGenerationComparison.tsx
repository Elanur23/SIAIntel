/**
 * AI Generation Comparison Component
 * Phase 3A.5: Side-by-side content comparison display
 * Phase 3A.6: Added scheduling recommendation display
 */

'use client'

import { useState } from 'react'
import type { AITestResult } from '@/lib/distribution/types'
import { calculateSchedulingRecommendation, type SchedulingRecommendation } from '@/lib/distribution/scheduling/scheduling-engine'
import { formatLocaleTime } from '@/lib/distribution/scheduling/timezone-map'

interface AIGenerationComparisonProps {
  testResult: AITestResult
  showScheduling?: boolean
}

export default function AIGenerationComparison({ testResult, showScheduling = true }: AIGenerationComparisonProps) {
  const { 
    masterContent, 
    localizedContent, 
    platformContent,
    glossaryTermsUsed,
    trustScore,
    complianceScore,
    aiMetadata
  } = testResult

  // Calculate scheduling recommendation
  const [schedulingRec, setSchedulingRec] = useState<SchedulingRecommendation | null>(null)
  const [showSchedulingDetails, setShowSchedulingDetails] = useState(false)

  // Generate recommendation on mount if enabled
  if (showScheduling && !schedulingRec) {
    const rec = calculateSchedulingRecommendation({
      locale: testResult.targetLocale,
      platform: testResult.targetPlatform,
      trustScore: testResult.trustScore,
      complianceScore: testResult.complianceScore,
      isBreakingNews: testResult.generationMode === 'breaking'
    })
    setSchedulingRec(rec)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h2 className="text-xl font-black uppercase mb-2">GENERATION_COMPARISON</h2>
        <p className="text-slate-400 text-sm">
          Side-by-side view of master, localized, and platform-adapted content
        </p>
      </div>

      {/* Content Comparison Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Master Content */}
        <ContentPanel
          title="MASTER_CONTENT"
          subtitle={`${testResult.sourceLanguage.toUpperCase()} (Original)`}
          content={masterContent}
          color="slate"
        />

        {/* Localized Content */}
        <ContentPanel
          title="LOCALIZED_CONTENT"
          subtitle={`${testResult.targetLocale.toUpperCase()} (Rewritten)`}
          content={localizedContent.content}
          color="blue"
          metadata={{
            'Title': localizedContent.title,
            'Summary': localizedContent.summary,
            'Hashtags': localizedContent.hashtags.join(', ') || 'None',
            'Readability': `${localizedContent.readabilityScore}/100`,
            'SEO Score': `${localizedContent.seoScore}/100`
          }}
        />

        {/* Platform Content */}
        <ContentPanel
          title="PLATFORM_CONTENT"
          subtitle={`${testResult.targetPlatform.toUpperCase()} (Adapted)`}
          content={platformContent.body}
          color="emerald"
          metadata={{
            'Title': platformContent.title,
            'Status': platformContent.status.toUpperCase(),
            'Language': platformContent.language.toUpperCase()
          }}
        />
      </div>

      {/* Glossary Terms */}
      {glossaryTermsUsed.length > 0 && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-black uppercase mb-4">GLOSSARY_TERMS_USED</h3>
          <div className="flex flex-wrap gap-2">
            {glossaryTermsUsed.map((termId, idx) => (
              <span 
                key={idx}
                className="bg-purple-500/20 border border-purple-500/40 rounded-lg px-3 py-1 text-sm text-purple-400 font-bold"
              >
                {termId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Scores */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Trust Score */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-black uppercase mb-4 text-emerald-500">
            TRUST_SCORE: {trustScore.overall}/100
          </h3>
          <div className="space-y-3">
            <ScoreBar label="Source Credibility" value={trustScore.sourceCredibility} max={25} />
            <ScoreBar label="Factual Accuracy" value={trustScore.factualAccuracy} max={25} />
            <ScoreBar label="Bias Detection" value={trustScore.biasDetection} max={25} />
            <ScoreBar label="Sentiment Balance" value={trustScore.sentimentBalance} max={25} />
          </div>
          {trustScore.warnings.length > 0 && (
            <div className="mt-4 space-y-1">
              {trustScore.warnings.map((warning, idx) => (
                <p key={idx} className="text-xs text-yellow-500">⚠️ {warning}</p>
              ))}
            </div>
          )}
          {trustScore.requiresReview && (
            <p className="mt-4 text-sm text-yellow-500 font-bold">
              ⚠️ Requires Editorial Review
            </p>
          )}
        </div>

        {/* Compliance Score */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <h3 className="text-lg font-black uppercase mb-4 text-blue-500">
            COMPLIANCE_SCORE: {complianceScore.overall}/100
          </h3>
          <div className="space-y-3">
            <ComplianceItem 
              label="GDPR Compliant" 
              value={complianceScore.gdprCompliant} 
            />
            <ComplianceItem 
              label="COPPA Compliant" 
              value={complianceScore.coppaCompliant} 
            />
            <ComplianceItem 
              label="Finance Regulation" 
              value={complianceScore.financeRegulationCompliant} 
            />
            <div className="pt-2 border-t border-white/10">
              <p className="text-xs text-slate-400 mb-1">Content Safety</p>
              <p className="text-sm font-bold">{complianceScore.contentSafetyScore}/100</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Toxicity Score</p>
              <p className="text-sm font-bold">{complianceScore.toxicityScore}/10</p>
            </div>
          </div>
          {complianceScore.violations.length > 0 && (
            <div className="mt-4 space-y-1">
              {complianceScore.violations.map((violation, idx) => (
                <p key={idx} className="text-xs text-red-500">❌ {violation}</p>
              ))}
            </div>
          )}
          {complianceScore.requiresLegalReview && (
            <p className="mt-4 text-sm text-red-500 font-bold">
              ❌ Requires Legal Review
            </p>
          )}
        </div>
      </div>

      {/* AI Metadata */}
      <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
        <h3 className="text-lg font-black uppercase mb-4">AI_METADATA</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetadataItem label="Provider" value={aiMetadata.provider.toUpperCase()} />
          <MetadataItem label="Model" value={aiMetadata.model} />
          <MetadataItem label="Prompt Version" value={aiMetadata.promptVersion} />
          <MetadataItem label="Temperature" value={aiMetadata.temperature.toString()} />
          <MetadataItem label="Max Tokens" value={aiMetadata.maxTokens.toString()} />
          <MetadataItem 
            label="Generation Time" 
            value={`${(aiMetadata.generationTime / 1000).toFixed(2)}s`} 
          />
          {aiMetadata.tokensUsed && (
            <>
              <MetadataItem label="Tokens Used" value={aiMetadata.tokensUsed.total.toString()} />
              {aiMetadata.cost && (
                <MetadataItem 
                  label="Cost" 
                  value={`${aiMetadata.cost.total.toFixed(4)}`} 
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Scheduling Recommendation (Phase 3A.6) */}
      {showScheduling && schedulingRec && (
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black uppercase text-blue-500">SCHEDULING_RECOMMENDATION</h3>
            <button
              onClick={() => setShowSchedulingDetails(!showSchedulingDetails)}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              {showSchedulingDetails ? '▼ Hide Details' : '▶ Show Details'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
            <div>
              <p className="text-xs text-slate-400 mb-1">Recommended Time</p>
              <p className="text-lg font-bold text-white">
                {formatLocaleTime(schedulingRec.recommendedTime, schedulingRec.locale)}
              </p>
              <p className="text-xs text-slate-500 mt-1">{schedulingRec.timezone}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Confidence</p>
              <p className="text-3xl font-black text-blue-500">{schedulingRec.confidence}%</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-1">Risk Adjustment</p>
              <p className={`text-lg font-bold ${
                schedulingRec.riskAdjustment.finalAdjustment >= 0 ? 'text-emerald-500' : 'text-yellow-500'
              }`}>
                {schedulingRec.riskAdjustment.finalAdjustment >= 0 ? '+' : ''}
                {schedulingRec.riskAdjustment.finalAdjustment}
              </p>
            </div>
          </div>

          {showSchedulingDetails && (
            <div className="bg-black/40 rounded-lg p-4 space-y-2">
              <p className="text-xs font-bold text-slate-300 mb-2">REASONING:</p>
              {schedulingRec.reasoning.map((reason: string, idx: number) => (
                <p key={idx} className="text-xs text-slate-400">
                  {idx + 1}. {reason}
                </p>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500 mt-4">
            ℹ️ This is a recommendation only. No automatic scheduling or publishing will occur.
          </p>
        </div>
      )}
    </div>
  )
}

function ContentPanel({ 
  title, 
  subtitle, 
  content, 
  color,
  metadata 
}: { 
  title: string
  subtitle: string
  content: string
  color: 'slate' | 'blue' | 'emerald'
  metadata?: Record<string, string>
}) {
  const colorClasses = {
    slate: 'border-slate-500/40',
    blue: 'border-blue-500/40',
    emerald: 'border-emerald-500/40'
  }

  return (
    <div className={`bg-white/5 rounded-2xl p-6 border ${colorClasses[color]}`}>
      <h3 className="text-sm font-black uppercase mb-1">{title}</h3>
      <p className="text-xs text-slate-400 mb-4">{subtitle}</p>
      
      {metadata && (
        <div className="mb-4 space-y-2 pb-4 border-b border-white/10">
          {Object.entries(metadata).map(([key, value]) => (
            <div key={key} className="flex justify-between text-xs">
              <span className="text-slate-400">{key}:</span>
              <span className="text-white font-bold">{value}</span>
            </div>
          ))}
        </div>
      )}
      
      <div className="bg-black/40 rounded-lg p-4 max-h-96 overflow-y-auto">
        <p className="text-sm text-slate-300 whitespace-pre-wrap">{content}</p>
      </div>
      
      <p className="text-xs text-slate-500 mt-2">
        {content.length} characters
      </p>
    </div>
  )
}

function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const percentage = (value / max) * 100
  
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-bold">{value}/{max}</span>
      </div>
      <div className="w-full bg-black/40 rounded-full h-2">
        <div 
          className="bg-emerald-500 h-2 rounded-full transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}

function ComplianceItem({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-slate-400">{label}</span>
      <span className={`text-sm font-bold ${value ? 'text-emerald-500' : 'text-red-500'}`}>
        {value ? '✓ YES' : '✗ NO'}
      </span>
    </div>
  )
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1">{label}</p>
      <p className="text-sm font-bold text-white">{value}</p>
    </div>
  )
}
