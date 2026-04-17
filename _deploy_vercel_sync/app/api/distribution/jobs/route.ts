/**
 * SIA DISTRIBUTION OS - JOBS API
 * Phase 1: Job CRUD endpoints (skeleton)
 */

import { NextRequest, NextResponse } from 'next/server'
import { isDistributionEnabled } from '@/lib/distribution/core/config'

export async function GET(request: NextRequest) {
  if (!isDistributionEnabled()) {
    return NextResponse.json(
      { error: 'Distribution OS is disabled' },
      { status: 403 }
    )
  }

  // Phase 1: Return empty array
  // Phase 2+: Query DistributionJob table
  return NextResponse.json({
    success: true,
    data: [],
    total: 0,
  })
}

export async function POST(request: NextRequest) {
  if (!isDistributionEnabled()) {
    return NextResponse.json(
      { error: 'Distribution OS is disabled' },
      { status: 403 }
    )
  }

  // Phase 1: Not implemented yet
  return NextResponse.json(
    { error: 'Job creation not implemented in Phase 1' },
    { status: 501 }
  )
}
