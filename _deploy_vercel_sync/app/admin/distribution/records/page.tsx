/**
 * Distribution Records List Page
 */

import { Suspense } from 'react'
import RecordsList from '@/components/distribution/RecordsList'
import Link from 'next/link'

export const metadata = {
  title: 'Distribution Records - SIA Intelligence',
}

export default function RecordsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link 
              href="/admin/distribution" 
              className="text-blue-500 text-sm mb-2 inline-block hover:underline"
            >
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-black uppercase tracking-tight">
              DISTRIBUTION_RECORDS
            </h1>
          </div>
        </div>
        
        <Suspense fallback={<ListSkeleton />}>
          <RecordsList />
        </Suspense>
      </div>
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="h-20 bg-white/5 rounded-2xl animate-pulse" />
      ))}
    </div>
  )
}
