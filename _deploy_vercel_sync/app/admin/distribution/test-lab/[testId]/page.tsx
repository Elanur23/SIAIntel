/**
 * AI Test Result Detail Page
 * Phase 3A.5: View test results and add manual review
 */

import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getTest } from '@/lib/distribution/services/ai-test-service'
import AIGenerationComparison from '@/components/distribution/AIGenerationComparison'
import AIReviewScoring from '@/components/distribution/AIReviewScoring'
import Link from 'next/link'

export const metadata = {
  title: 'Test Result - SIA Intelligence',
}

interface TestResultPageProps {
  params: { testId: string }
}

export default async function TestResultPage({ params }: TestResultPageProps) {
  // Load test result from in-memory database
  const testResult = await getTest(params.testId)

  // Handle missing/invalid testId
  if (!testResult) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/admin/distribution/test-lab" 
            className="text-blue-500 text-sm mb-2 inline-block hover:underline"
          >
            ← Back to Test Lab
          </Link>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            TEST_RESULT
          </h1>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>ID: {params.testId}</span>
            <span>•</span>
            <span>{testResult.sourceTitle}</span>
            <span>•</span>
            <span>{testResult.createdAt.toLocaleString()}</span>
          </div>
        </div>

        <div className="space-y-8">
          {/* Generation Comparison */}
          <Suspense fallback={<ComparisonSkeleton />}>
            <AIGenerationComparison testResult={testResult} />
          </Suspense>

          {/* Review Scoring */}
          <div className="border-t border-white/10 pt-8">
            <Suspense fallback={<ReviewSkeleton />}>
              <AIReviewScoring 
                testId={params.testId}
                existingReview={testResult.reviewScore}
              />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  )
}

function ComparisonSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
      <div className="grid grid-cols-3 gap-6">
        <div className="h-96 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-96 bg-white/5 rounded-2xl animate-pulse" />
        <div className="h-96 bg-white/5 rounded-2xl animate-pulse" />
      </div>
    </div>
  )
}

function ReviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-32 bg-white/5 rounded-2xl animate-pulse" />
      <div className="h-64 bg-white/5 rounded-2xl animate-pulse" />
    </div>
  )
}
