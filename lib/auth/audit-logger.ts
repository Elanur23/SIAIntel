/**
 * AUDIT LOGGER - Enhanced Security Event Logging (Phase 4B-2)
 * 
 * Features:
 * - Complete event taxonomy
 * - Structured JSON logging
 * - Automatic severity classification
 * - Risk score tracking
 * - Safe metadata (no secrets)
 * 
 * Storage: Database-backed via Prisma (SQLite → PostgreSQL ready)
 */

import { prisma } from '../db/prisma'
import {
  AuditEventType,
  AuditEventResult,
  AuditLogEntry,
  getEventSeverity,
  sanitizeAuditEntry,
  formatAuditEntry,
} from '../security/audit-taxonomy'
import {
  shouldAlert,
  getAlertSeverity,
  sendSecurityAlert,
  type SecurityAlert,
} from '../security/telegram-alerting'

export interface AuditLogOptions {
  userId?: string
  sessionId?: string
  ipAddress?: string
  userAgent?: string
  route?: string
  path?: string
  reason?: string
  errorCode?: string
  riskScore?: number
  metadata?: Record<string, any>
}

/**
 * Enhanced audit logging with taxonomy and structured data
 */
export async function auditLog(
  eventType: AuditEventType,
  result: AuditEventResult,
  options: AuditLogOptions = {}
): Promise<void> {
  try {
    const severity = getEventSeverity(eventType, result)
    
    const entry: AuditLogEntry = {
      timestamp: new Date(),
      eventType,
      result,
      severity,
      ...options,
    }

    // Sanitize to ensure no secrets
    const sanitized = sanitizeAuditEntry(entry)

    // Store in database
    await prisma.auditLog.create({
      data: {
        timestamp: sanitized.timestamp,
        action: sanitized.eventType,
        userId: sanitized.userId,
        ipAddress: sanitized.ipAddress,
        userAgent: sanitized.userAgent,
        success: sanitized.result === 'success',
        errorMessage: sanitized.reason || sanitized.errorCode,
        metadata: sanitized.metadata ? JSON.stringify(sanitized.metadata) : null,
      },
    })

    // Console log for development (structured JSON)
    const icon = result === 'success' ? '✅' : '❌'
    const severityIcon = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    }[severity]
    
    console.log(
      `[AUDIT] ${severityIcon} ${icon} ${eventType} | ` +
      `IP: ${options.ipAddress || 'unknown'} | ` +
      `Risk: ${options.riskScore || 0}` +
      (options.reason ? ` - ${options.reason}` : '')
    )
    
    // Send Telegram alert if needed (non-blocking)
    if (shouldAlert(eventType, options.riskScore)) {
      const alert: SecurityAlert = {
        eventType,
        severity: getAlertSeverity(eventType, options.riskScore),
        timestamp: sanitized.timestamp,
        ipAddress: sanitized.ipAddress,
        route: sanitized.route || sanitized.path,
        riskScore: options.riskScore,
        explanation: sanitized.reason || sanitized.errorCode || `${eventType} event occurred`,
        metadata: sanitized.metadata,
      }
      
      // Fire and forget - don't await
      sendSecurityAlert(alert).catch(error => {
        console.error('[AUDIT-LOGGER] Alert send failed:', error)
      })
    }
  } catch (error) {
    // Don't throw - audit logging should never break the application
    console.error('[AUDIT-LOGGER] Failed to log event:', error)
  }
}

/**
 * Legacy compatibility wrapper
 */
export async function logAuditEvent(
  action: string,
  success: boolean,
  options?: {
    userId?: string
    ipAddress?: string
    userAgent?: string
    errorMessage?: string
    metadata?: Record<string, any>
  }
): Promise<void> {
  await auditLog(
    action as AuditEventType,
    success ? 'success' : 'failure',
    {
      userId: options?.userId,
      ipAddress: options?.ipAddress,
      userAgent: options?.userAgent,
      reason: options?.errorMessage,
      metadata: options?.metadata,
    }
  )
}

/**
 * Get recent audit logs (for admin dashboard)
 */
export async function getRecentAuditLogs(limit: number = 100): Promise<any[]> {
  return await prisma.auditLog.findMany({
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
}

/**
 * Get audit logs for specific user
 */
export async function getUserAuditLogs(userId: string, limit: number = 50): Promise<any[]> {
  return await prisma.auditLog.findMany({
    where: { userId },
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
}

/**
 * Get audit logs by event type
 */
export async function getAuditLogsByType(
  eventType: AuditEventType,
  limit: number = 100
): Promise<any[]> {
  return await prisma.auditLog.findMany({
    where: { action: eventType },
    orderBy: { timestamp: 'desc' },
    take: limit,
  })
}

/**
 * Get failed events for IP in time window
 */
export async function getFailedEventsByIp(
  ipAddress: string,
  eventType: AuditEventType,
  sinceMinutes: number = 15
): Promise<number> {
  const since = new Date(Date.now() - sinceMinutes * 60 * 1000)
  
  return await prisma.auditLog.count({
    where: {
      action: eventType,
      success: false,
      ipAddress,
      timestamp: {
        gte: since,
      },
    },
  })
}

/**
 * Get failed login attempts for IP (legacy compatibility)
 */
export async function getFailedLoginsByIp(
  ipAddress: string,
  sinceMinutes: number = 15
): Promise<number> {
  return await getFailedEventsByIp(ipAddress, 'login_failed', sinceMinutes)
}

/**
 * Cleanup old audit logs (retention policy)
 */
export async function cleanupOldAuditLogs(retentionDays: number = 90): Promise<number> {
  const cutoffDate = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000)
  
  const result = await prisma.auditLog.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  })

  if (result.count > 0) {
    await auditLog('session_cleanup', 'success', {
      metadata: {
        logsDeleted: result.count,
        retentionDays,
      },
    })
  }

  return result.count
}

/**
 * Get audit log count (for monitoring)
 */
export async function getAuditLogCount(): Promise<number> {
  return await prisma.auditLog.count()
}
