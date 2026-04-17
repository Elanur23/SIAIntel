/**
 * AI Test Lab Page
 * Phase 3A.5: Manual AI generation testing interface
 */

import { Suspense } from 'react'
import AITestLab from '@/components/distribution/AITestLab'
import { isFeatureEnabled } from '@/lib/distribution/feature-flags'
import Link from 'next/link'

export const metadata = {
  title: 'AI Test Lab - SIA Intelligence',
  description: 'Manual AI generation testing and validation'
}

export default function TestLabPage() {
  const aiGenerationEnabled = isFeatureEnabled('enableAIGeneration')

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/admin/distribution" 
            className="text-blue-500 text-sm mb-2 inline-block hover:underline"
          >
            ← Back to Distribution
          </Link>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            AI_TEST_LAB
          </h1>
          <p className="text-slate-400 text-sm">
            Manual AI generation testing - no publishing, no automation
          </p>
        </div>

        {!aiGenerationEnabled ? (
          <FeatureDisabledWarning />
        ) : (
          <Suspense fallback={<TestLabSkeleton />}>
            <AITestLab />
          </Suspense>
        )}
      </div>
    </div>
  )
}

function FeatureDisabledWarning() {
  return (
    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-2xl p-8">
      <p className="text-yellow-500 font-bold text-lg mb-4">
        ⚠️ AI Generation Disabled
      </p>
      <p className="text-slate-400 mb-4">
        The AI generation feature is currently disabled. Enable it in the feature flags to use the test lab.
      </p>
      <div className="space-y-2 text-sm text-slate-400">
        <p>Required flags:</p>
        <ul className="list-disc list-inside space-y-1 ml-4">
          <li><code className="bg-black/40 px-2 py-1 rounded">enableAIGeneration</code> - Master switch for AI generation</li>
          <li><code className="bg-black/40 px-2 py-1 rounded">enableGeminiProvider</code> - Enable Gemini 1.5 Pro provider</li>
        </ul>
      </div>
      <Link 
        href="/admin/distribution/settings"
        className="inline-block mt-6 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-bold uppercase transition-all"
      >
        Go to Settings
      </Link>
    </div>
  )
}

function TestLabSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
      <div className="h-96 bg-white/5 rounded-2xl animate-pulse" />
      <div className="h-48 bg-white/5 rounded-2xl animate-pulse" />
    </div>
  )
}
