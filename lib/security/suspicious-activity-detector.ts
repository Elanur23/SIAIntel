/**
 * SUSPICIOUS ACTIVITY DETECTOR - Pattern-Based Threat Detection
 * 
 * Detects and responds to suspicious patterns:
 * - IP address changes within active session
 * - User agent changes within active session
 * - Repeated CSRF failures
 * - Repeated denied admin access attempts
 * - Repeated rate-limit hits
 */

import { auditLog } from '@/lib/auth/audit-logger'
import { getFailedEventsByIp } from '@/lib/auth/audit-logger'
import { prisma } from '@/lib/db/prisma'

export interface SuspiciousActivityResult {
  detected: boolean
  reason: string
  riskScore: number
  shouldInvalidateSession: boolean
  shouldElevateRisk: boolean
}

/**
 * Risk score thresholds
 */
export const RISK_THRESHOLDS = {
  ELEVATED: 30, // Mark session as elevated risk
  CRITICAL: 50, // Force re-authentication
}

/**
 * Detection thresholds
 */
export const DETECTION_THRESHOLDS = {
  CSRF_FAILURES: 3, // Within 10 minutes
  CSRF_WINDOW_MINUTES: 10,
  
  DENIED_ACCESS: 5, // Within 15 minutes
  DENIED_ACCESS_WINDOW_MINUTES: 15,
  
  RATE_LIMIT_HITS: 10, // Within 60 minutes
  RATE_LIMIT_WINDOW_MINUTES: 60,
}

/**
 * Calculate risk score for IP change
 */
export function calculateIpChangeRisk(
  oldIp: string | null | undefined,
  newIp: string
): number {
  if (!oldIp) return 0 // First IP, no risk
  if (oldIp === newIp) return 0 // Same IP, no risk
  
  // IP changed - moderate risk
  return 30
}

/**
 * Calculate risk score for user agent change
 */
export function calculateUserAgentChangeRisk(
  oldUserAgent: string | null | undefined,
  newUserAgent: string
): number {
  if (!oldUserAgent) return 0 // First UA, no risk
  if (oldUserAgent === newUserAgent) return 0 // Same UA, no risk
  
  // UA changed - moderate risk
  return 20
}

/**
 * Detect IP address change in session
 */
export async function detectIpChange(
  sessionId: string,
  oldIp: string | null | undefined,
  newIp: string
): Promise<SuspiciousActivityResult> {
  const riskScore = calculateIpChangeRisk(oldIp, newIp)
  
  if (riskScore > 0) {
    await auditLog('suspicious_activity_detected', 'failure', {
      sessionId,
      ipAddress: newIp,
      reason: `IP changed from ${oldIp} to ${newIp}`,
      riskScore,
      metadata: {
        oldIp,
        newIp,
        detectionType: 'ip_change',
      },
    })
    
    return {
      detected: true,
      reason: 'IP address changed',
      riskScore,
      shouldInvalidateSession: riskScore >= RISK_THRESHOLDS.CRITICAL,
      shouldElevateRisk: riskScore >= RISK_THRESHOLDS.ELEVATED,
    }
  }
  
  return {
    detected: false,
    reason: '',
    riskScore: 0,
    shouldInvalidateSession: false,
    shouldElevateRisk: false,
  }
}

/**
 * Detect user agent change in session
 */
export async function detectUserAgentChange(
  sessionId: string,
  oldUserAgent: string | null | undefined,
  newUserAgent: string
): Promise<SuspiciousActivityResult> {
  const riskScore = calculateUserAgentChangeRisk(oldUserAgent, newUserAgent)
  
  if (riskScore > 0) {
    await auditLog('suspicious_activity_detected', 'failure', {
      sessionId,
      userAgent: newUserAgent,
      reason: 'User agent changed',
      riskScore,
      metadata: {
        oldUserAgent,
        newUserAgent,
        detectionType: 'user_agent_change',
      },
    })
    
    return {
      detected: true,
      reason: 'User agent changed',
      riskScore,
      shouldInvalidateSession: riskScore >= RISK_THRESHOLDS.CRITICAL,
      shouldElevateRisk: riskScore >= RISK_THRESHOLDS.ELEVATED,
    }
  }
  
  return {
    detected: false,
    reason: '',
    riskScore: 0,
    shouldInvalidateSession: false,
    shouldElevateRisk: false,
  }
}

/**
 * Detect repeated CSRF failures
 */
export async function detectCsrfFailureBurst(
  ipAddress: string
): Promise<SuspiciousActivityResult> {
  const failureCount = await getFailedEventsByIp(
    ipAddress,
    'csrf_failed',
    DETECTION_THRESHOLDS.CSRF_WINDOW_MINUTES
  )
  
  if (failureCount >= DETECTION_THRESHOLDS.CSRF_FAILURES) {
    const riskScore = 30
    
    await auditLog('suspicious_activity_detected', 'failure', {
      ipAddress,
      reason: `${failureCount} CSRF failures in ${DETECTION_THRESHOLDS.CSRF_WINDOW_MINUTES} minutes`,
      riskScore,
      metadata: {
        failureCount,
        windowMinutes: DETECTION_THRESHOLDS.CSRF_WINDOW_MINUTES,
        detectionType: 'csrf_burst',
      },
    })
    
    return {
      detected: true,
      reason: 'Repeated CSRF failures',
      riskScore,
      shouldInvalidateSession: riskScore >= RISK_THRESHOLDS.CRITICAL,
      shouldElevateRisk: riskScore >= RISK_THRESHOLDS.ELEVATED,
    }
  }
  
  return {
    detected: false,
    reason: '',
    riskScore: 0,
    shouldInvalidateSession: false,
    shouldElevateRisk: false,
  }
}

/**
 * Detect repeated denied admin access attempts
 */
export async function detectDeniedAccessBurst(
  ipAddress: string
): Promise<SuspiciousActivityResult> {
  const deniedCount = await getFailedEventsByIp(
    ipAddress,
    'protected_route_denied',
    DETECTION_THRESHOLDS.DENIED_ACCESS_WINDOW_MINUTES
  )
  
  if (deniedCount >= DETECTION_THRESHOLDS.DENIED_ACCESS) {
    const riskScore = 20
    
    await auditLog('suspicious_activity_detected', 'failure', {
      ipAddress,
      reason: `${deniedCount} denied access attempts in ${DETECTION_THRESHOLDS.DENIED_ACCESS_WINDOW_MINUTES} minutes`,
      riskScore,
      metadata: {
        deniedCount,
        windowMinutes: DETECTION_THRESHOLDS.DENIED_ACCESS_WINDOW_MINUTES,
        detectionType: 'denied_access_burst',
      },
    })
    
    return {
      detected: true,
      reason: 'Repeated denied access attempts',
      riskScore,
      shouldInvalidateSession: riskScore >= RISK_THRESHOLDS.CRITICAL,
      shouldElevateRisk: riskScore >= RISK_THRESHOLDS.ELEVATED,
    }
  }
  
  return {
    detected: false,
    reason: '',
    riskScore: 0,
    shouldInvalidateSession: false,
    shouldElevateRisk: false,
  }
}

/**
 * Detect repeated rate limit hits
 */
export async function detectRateLimitBurst(
  ipAddress: string
): Promise<SuspiciousActivityResult> {
  const rateLimitCount = await getFailedEventsByIp(
    ipAddress,
    'rate_limit_triggered',
    DETECTION_THRESHOLDS.RATE_LIMIT_WINDOW_MINUTES
  )
  
  if (rateLimitCount >= DETECTION_THRESHOLDS.RATE_LIMIT_HITS) {
    const riskScore = 15
    
    await auditLog('suspicious_activity_detected', 'failure', {
      ipAddress,
      reason: `${rateLimitCount} rate limit hits in ${DETECTION_THRESHOLDS.RATE_LIMIT_WINDOW_MINUTES} minutes`,
      riskScore,
      metadata: {
        rateLimitCount,
        windowMinutes: DETECTION_THRESHOLDS.RATE_LIMIT_WINDOW_MINUTES,
        detectionType: 'rate_limit_burst',
      },
    })
    
    return {
      detected: true,
      reason: 'Repeated rate limit violations',
      riskScore,
      shouldInvalidateSession: false, // Don't invalidate for rate limits
      shouldElevateRisk: true,
    }
  }
  
  return {
    detected: false,
    reason: '',
    riskScore: 0,
    shouldInvalidateSession: false,
    shouldElevateRisk: false,
  }
}

/**
 * Aggregate risk score from multiple detections
 */
export function aggregateRiskScore(results: SuspiciousActivityResult[]): number {
  return results.reduce((total, result) => total + result.riskScore, 0)
}

/**
 * Determine if session should be invalidated based on total risk
 */
export function shouldInvalidateSession(totalRiskScore: number): boolean {
  return totalRiskScore >= RISK_THRESHOLDS.CRITICAL
}

/**
 * Determine if session should be marked as elevated risk
 */
export function shouldElevateRisk(totalRiskScore: number): boolean {
  return totalRiskScore >= RISK_THRESHOLDS.ELEVATED
}

/**
 * Run all suspicious activity checks for a session
 */
export async function detectAllSuspiciousActivity(
  sessionId: string,
  ipAddress: string,
  userAgent: string,
  oldIp?: string | null,
  oldUserAgent?: string | null
): Promise<{
  detected: boolean
  results: SuspiciousActivityResult[]
  totalRiskScore: number
  shouldInvalidate: boolean
  shouldElevate: boolean
}> {
  const results: SuspiciousActivityResult[] = []
  
  // Check IP change
  if (oldIp) {
    const ipResult = await detectIpChange(sessionId, oldIp, ipAddress)
    if (ipResult.detected) results.push(ipResult)
  }
  
  // Check UA change
  if (oldUserAgent) {
    const uaResult = await detectUserAgentChange(sessionId, oldUserAgent, userAgent)
    if (uaResult.detected) results.push(uaResult)
  }
  
  // Check CSRF failures
  const csrfResult = await detectCsrfFailureBurst(ipAddress)
  if (csrfResult.detected) results.push(csrfResult)
  
  // Check denied access
  const deniedResult = await detectDeniedAccessBurst(ipAddress)
  if (deniedResult.detected) results.push(deniedResult)
  
  // Check rate limits
  const rateLimitResult = await detectRateLimitBurst(ipAddress)
  if (rateLimitResult.detected) results.push(rateLimitResult)
  
  const totalRiskScore = aggregateRiskScore(results)
  
  return {
    detected: results.length > 0,
    results,
    totalRiskScore,
    shouldInvalidate: shouldInvalidateSession(totalRiskScore),
    shouldElevate: shouldElevateRisk(totalRiskScore),
  }
}
