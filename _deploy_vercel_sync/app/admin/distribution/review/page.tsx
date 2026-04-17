/**
 * Review Queue Page
 */

import { Suspense } from 'react'
import ReviewQueue from '@/components/distribution/ReviewQueue'
import Link from 'next/link'

export const metadata = {
  title: 'Review Queue - SIA Intelligence',
}

export default function ReviewPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/admin/distribution" 
            className="text-blue-500 text-sm mb-2 inline-block hover:underline"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            REVIEW_QUEUE
          </h1>
          <p className="text-slate-400 text-sm">
            Editorial review workflow
          </p>
        </div>
        
        <Suspense fallback={<QueueSkeleton />}>
          <ReviewQueue />
        </Suspense>
      </div>
    </div>
  )
}

function QueueSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className="h-32 bg-white/5 rounded-2xl animate-pulse" />
      ))}
    </div>
  )
}
