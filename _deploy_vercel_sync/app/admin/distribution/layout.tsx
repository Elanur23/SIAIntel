/**
 * SIA DISTRIBUTION OS - ADMIN LAYOUT
 * Phase 1: Layout for distribution admin pages
 */

import { isDistributionEnabled } from '@/lib/distribution/core/config'
import { notFound } from 'next/navigation'

export default function DistributionLayout({ children }: { children: React.ReactNode }) {
  // Feature flag check - return 404 if disabled (except in development)
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  if (!isDevelopment && !isDistributionEnabled()) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-[#020203]">
      {children}
    </div>
  )
}
