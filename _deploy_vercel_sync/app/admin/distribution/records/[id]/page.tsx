/**
 * Distribution Record Detail Page
 */

import { Suspense } from 'react'
import RecordDetail from '@/components/distribution/RecordDetail'
import Link from 'next/link'

export const metadata = {
  title: 'Record Detail - SIA Intelligence',
}

interface RecordDetailPageProps {
  params: { id: string }
}

export default function RecordDetailPage({ params }: RecordDetailPageProps) {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/admin/distribution/records" 
            className="text-blue-500 text-sm mb-2 inline-block hover:underline"
          >
            ← Back to Records
          </Link>
          <h1 className="text-4xl font-black uppercase tracking-tight">
            RECORD_DETAIL
          </h1>
          <p className="text-slate-400 text-sm mt-2">ID: {params.id}</p>
        </div>
        
        <Suspense fallback={<DetailSkeleton />}>
          <RecordDetail recordId={params.id} />
        </Suspense>
      </div>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-40 bg-white/5 rounded-2xl animate-pulse" />
      <div className="h-60 bg-white/5 rounded-2xl animate-pulse" />
      <div className="h-80 bg-white/5 rounded-2xl animate-pulse" />
    </div>
  )
}
