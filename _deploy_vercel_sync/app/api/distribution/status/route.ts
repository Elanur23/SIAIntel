/**
 * SIA DISTRIBUTION OS - STATUS ENDPOINT
 * Phase 1: Health check and feature flag status
 */

import { NextResponse } from 'next/server'
import { DISTRIBUTION_CONFIG, isDistributionEnabled } from '@/lib/distribution/core/config'

export async function GET() {
  if (!isDistributionEnabled()) {
    return NextResponse.json(
      { error: 'Distribution OS is disabled' },
      { status: 403 }
    )
  }

  return NextResponse.json({
    success: true,
    status: 'operational',
    phase: 1,
    config: {
      enabled: DISTRIBUTION_CONFIG.enabled,
      platforms: DISTRIBUTION_CONFIG.platforms,
      autoPublish: DISTRIBUTION_CONFIG.autoPublish,
      reviewRequired: DISTRIBUTION_CONFIG.reviewRequired,
    },
    timestamp: new Date().toISOString(),
  })
}
