/**
 * SESSION HARDENING - Enhanced Session Security
 * 
 * Features:
 * - Idle timeout (30 minutes of inactivity)
 * - Absolute expiry (7 days maximum)
 * - Session rotation on login
 * - IP address change detection
 * - User agent change detection
 * - Suspicious activity tracking
 */

import { prisma } from '@/lib/db/prisma'
import { hashToken } from '@/lib/auth/session-manager'
import { auditLog, logAuditEvent } from '@/lib/auth/audit-logger'
import { detectAllSuspiciousActivity } from '@/lib/security/suspicious-activity-detector'
import { assessRisk, enforceRiskPolicy } from '@/lib/security/risk-scoring'

// Session security configuration
export const SESSION_CONFIG = {
  IDLE_TIMEOUT_MS: 30 * 60 * 1000, // 30 minutes
  ABSOLUTE_EXPIRY_MS: 7 * 24 * 60 * 60 * 1000, // 7 days
  ROTATION_THRESHOLD_MS: 24 * 60 * 60 * 1000, // Rotate after 24 hours
}

export interface SessionValidationResult {
  valid: boolean
  reason?: string
  shouldRotate?: boolean
  suspicious?: boolean
}

/**
 * Validate session with hardened security checks
 */
export async function validateHardenedSession(
  token: string,
  currentIp: string,
  currentUserAgent: string
): Promise<SessionValidationResult> {
  if (!token || token.length !== 64) {
    return { valid: false, reason: 'Invalid token format' }
  }

  const hashedToken = await hashToken(token)
  
  const session = await prisma.session.findUnique({
    where: { hashedToken },
  })

  if (!session) {
    return { valid: false, reason: 'Session not found' }
  }

  const now = new Date()

  // Check absolute expiry
  if (now > session.expiresAt) {
    await prisma.session.delete({ where: { hashedToken } })
    await auditLog('session_expired', 'failure', {
      userId: session.userId,
      ipAddress: currentIp,
      reason: 'Session expired (absolute)',
    })
    return { valid: false, reason: 'Session expired' }
  }

  // Check idle timeout
  const idleTime = now.getTime() - session.lastAccessedAt.getTime()
  if (idleTime > SESSION_CONFIG.IDLE_TIMEOUT_MS) {
    await prisma.session.delete({ where: { hashedToken } })
    await auditLog('session_expired', 'failure', {
      userId: session.userId,
      ipAddress: currentIp,
      reason: 'Session expired (idle timeout)',
    })
    return { valid: false, reason: 'Session expired due to inactivity' }
  }

  // Run suspicious activity detection
  const detection = await detectAllSuspiciousActivity(
    hashedToken,
    currentIp,
    currentUserAgent,
    session.ipAddress,
    session.userAgent
  )

  // Assess risk
  const reasons = detection.results.map(r => r.reason)
  const riskAssessment = assessRisk(hashedToken, detection.totalRiskScore, reasons)

  // Enforce risk policy
  if (detection.detected) {
    const policy = await enforceRiskPolicy(token, riskAssessment, currentIp)
    
    if (!policy.sessionValid) {
      return {
        valid: false,
        reason: policy.message,
        suspicious: true,
      }
    }
  }

  // Check if session should be rotated
  const sessionAge = now.getTime() - session.createdAt.getTime()
  const shouldRotate = sessionAge > SESSION_CONFIG.ROTATION_THRESHOLD_MS

  // Update last accessed time (sliding window)
  await prisma.session.update({
    where: { hashedToken },
    data: {
      lastAccessedAt: now,
      // Update IP and user agent if changed (track latest)
      ipAddress: currentIp,
      userAgent: currentUserAgent,
    },
  })

  if (detection.detected) {
    return {
      valid: true,
      suspicious: true,
      reason: reasons.join(', '),
      shouldRotate: true, // Force rotation on suspicious activity
    }
  }

  return {
    valid: true,
    shouldRotate,
  }
}

/**
 * Rotate session (create new token, delete old)
 */
export async function rotateSession(
  oldToken: string,
  userId: string,
  ipAddress: string,
  userAgent: string
): Promise<string | null> {
  try {
    // Delete old session
    const oldHashedToken = await hashToken(oldToken)
    await prisma.session.delete({
      where: { hashedToken: oldHashedToken },
    }).catch(() => {
      // Ignore if already deleted
    })

    // Create new session
    const { generateSessionToken, createSession } = await import('@/lib/auth/session-manager')
    const newToken = await createSession(userId, ipAddress, userAgent)

    await logAuditEvent('session_rotated', true, {
      userId,
      ipAddress,
      userAgent,
    })

    return newToken
  } catch (error) {
    console.error('[SESSION-HARDENING] Rotation error:', error)
    return null
  }
}

/**
 * Force logout all sessions for a user (security breach response)
 */
export async function forceLogoutAllSessions(userId: string): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: { userId },
  })

  await logAuditEvent('force_logout_all', true, {
    userId,
    metadata: { sessionsDeleted: result.count },
  })

  return result.count
}

/**
 * Get active session count for user
 */
export async function getActiveSessionCount(userId: string): Promise<number> {
  return await prisma.session.count({
    where: {
      userId,
      expiresAt: {
        gt: new Date(),
      },
    },
  })
}

/**
 * Cleanup expired sessions (maintenance task)
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const now = new Date()
  
  // Delete sessions past absolute expiry
  const absoluteExpired = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: now,
      },
    },
  })

  // Delete sessions past idle timeout
  const idleExpired = await prisma.session.deleteMany({
    where: {
      lastAccessedAt: {
        lt: new Date(now.getTime() - SESSION_CONFIG.IDLE_TIMEOUT_MS),
      },
    },
  })

  const totalDeleted = absoluteExpired.count + idleExpired.count

  if (totalDeleted > 0) {
    await auditLog('session_cleanup', 'success', {
      metadata: {
        absoluteExpired: absoluteExpired.count,
        idleExpired: idleExpired.count,
        total: totalDeleted,
      },
    })
  }

  return totalDeleted
}
