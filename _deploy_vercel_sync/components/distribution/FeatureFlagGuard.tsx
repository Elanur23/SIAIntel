'use client'

/**
 * SIA DISTRIBUTION OS - FEATURE FLAG GUARD
 * Phase 1: Wrapper component to hide features behind flags
 */

import { isDistributionEnabled } from '@/lib/distribution/core/config'

interface FeatureFlagGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function FeatureFlagGuard({ children, fallback = null }: FeatureFlagGuardProps) {
  if (!isDistributionEnabled()) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
