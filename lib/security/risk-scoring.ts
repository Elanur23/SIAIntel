/**
 * RISK SCORING & RE-AUTH SYSTEM
 * 
 * Rule-based risk scoring with automatic session invalidation
 * Enforces re-authentication when risk threshold exceeded
 */

import { prisma } from '@/lib/db/prisma'
import { auditLog } from '@/lib/auth/audit-logger'
import { hashToken } from '@/lib/auth/session-manager'
import { RISK_THRESHOLDS } from '@/lib/security/suspicious-activity-detector'

export interface RiskAssessment {
  sessionId: string
  totalRiskScore: number
  riskLevel: 'low' | 'elevated' | 'critical'
  shouldInvalidate: boolean
  shouldReduceIdleTimeout: boolean
  reasons: string[]
}

/**
 * Calculate risk level from score
 */
export function getRiskLevel(riskScore: number): 'low' | 'elevated' | 'critical' {
  if (riskScore >= RISK_THRESHOLDS.CRITICAL) return 'critical'
  if (riskScore >= RISK_THRESHOLDS.ELEVATED) return 'elevated'
  return 'low'
}

/**
 * Get reduced idle timeout for elevated risk sessions
 */
export function getReducedIdleTimeout(riskScore: number): number {
  const baseTimeout = 30 * 60 * 1000 // 30 minutes
  
  if (riskScore >= RISK_THRESHOLDS.CRITICAL) {
    return 5 * 60 * 1000 // 5 minutes for critical
  }
  
  if (riskScore >= RISK_THRESHOLDS.ELEVATED) {
    return 15 * 60 * 1000 // 15 minutes for elevated
  }
  
  return baseTimeout
}

/**
 * Assess risk for a session
 */
export function assessRisk(
  sessionId: string,
  riskScore: number,
  reasons: string[]
): RiskAssessment {
  const riskLevel = getRiskLevel(riskScore)
  
  return {
    sessionId,
    totalRiskScore: riskScore,
    riskLevel,
    shouldInvalidate: riskScore >= RISK_THRESHOLDS.CRITICAL,
    shouldReduceIdleTimeout: riskScore >= RISK_THRESHOLDS.ELEVATED,
    reasons,
  }
}

/**
 * Invalidate session due to high risk
 */
export async function invalidateSessionForRisk(
  sessionToken: string,
  riskAssessment: RiskAssessment,
  ipAddress: string
): Promise<void> {
  try {
    const hashedToken = await hashToken(sessionToken)
    
    // Delete session from database
    await prisma.session.delete({
      where: { hashedToken },
    }).catch(() => {
      // Ignore if already deleted
    })
    
    // Log invalidation
    await auditLog('session_invalidated', 'success', {
      sessionId: riskAssessment.sessionId,
      ipAddress,
      reason: `High risk score: ${riskAssessment.totalRiskScore}`,
      riskScore: riskAssessment.totalRiskScore,
      metadata: {
        riskLevel: riskAssessment.riskLevel,
        reasons: riskAssessment.reasons,
      },
    })
    
    console.log(
      `[RISK-SCORING] 🚨 Session invalidated due to high risk (${riskAssessment.totalRiskScore}): ` +
      riskAssessment.reasons.join(', ')
    )
  } catch (error) {
    console.error('[RISK-SCORING] Failed to invalidate session:', error)
  }
}

/**
 * Mark session as elevated risk (shorter idle timeout)
 */
export async function markSessionElevatedRisk(
  sessionToken: string,
  riskAssessment: RiskAssessment
): Promise<void> {
  try {
    const hashedToken = await hashToken(sessionToken)
    const reducedTimeout = getReducedIdleTimeout(riskAssessment.totalRiskScore)
    
    // Update session with reduced expiry
    const now = new Date()
    await prisma.session.update({
      where: { hashedToken },
      data: {
        expiresAt: new Date(now.getTime() + reducedTimeout),
      },
    }).catch(() => {
      // Ignore if session doesn't exist
    })
    
    console.log(
      `[RISK-SCORING] ⚠️  Session marked elevated risk (${riskAssessment.totalRiskScore}): ` +
      `Idle timeout reduced to ${reducedTimeout / 60000} minutes`
    )
  } catch (error) {
    console.error('[RISK-SCORING] Failed to mark session as elevated risk:', error)
  }
}

/**
 * Enforce risk-based session policy
 */
export async function enforceRiskPolicy(
  sessionToken: string,
  riskAssessment: RiskAssessment,
  ipAddress: string
): Promise<{
  sessionValid: boolean
  message: string
}> {
  if (riskAssessment.shouldInvalidate) {
    await invalidateSessionForRisk(sessionToken, riskAssessment, ipAddress)
    return {
      sessionValid: false,
      message: 'Session invalidated due to suspicious activity. Please log in again.',
    }
  }
  
  if (riskAssessment.shouldReduceIdleTimeout) {
    await markSessionElevatedRisk(sessionToken, riskAssessment)
    return {
      sessionValid: true,
      message: 'Elevated security mode: Session timeout reduced.',
    }
  }
  
  return {
    sessionValid: true,
    message: 'Session valid',
  }
}

/**
 * Check if session should trigger re-auth
 */
export function shouldTriggerReAuth(riskScore: number): boolean {
  return riskScore >= RISK_THRESHOLDS.CRITICAL
}

/**
 * Get risk score summary for monitoring
 */
export interface RiskScoreSummary {
  low: number
  elevated: number
  critical: number
  total: number
}

/**
 * Get risk score distribution (for admin dashboard)
 */
export async function getRiskScoreDistribution(): Promise<RiskScoreSummary> {
  // This would require storing risk scores in sessions
  // For now, return placeholder
  return {
    low: 0,
    elevated: 0,
    critical: 0,
    total: 0,
  }
}
