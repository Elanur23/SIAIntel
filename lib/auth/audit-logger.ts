/**
 * AUDIT LOGGER - Minimal Security Event Logging
 * 
 * Simplified version for production build compatibility.
 * Storage: Database-backed via Prisma (SQLite → PostgreSQL ready)
 */

import { prisma } from '@/lib/db/prisma'

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
 * Audit logging with structured data
 */
export async function auditLog(
  eventType: string,
  result: 'success' | 'failure',
  options: AuditLogOptions = {}
): Promise<void> {
  try {
    // Store in database
    await prisma.auditLog.create({
      data: {
        timestamp: new Date(),
        action: eventType,
        userId: options.userId || null,
        ipAddress: options.ipAddress || null,
        userAgent: options.userAgent || null,
        success: result === 'success',
        errorMessage: options.reason || options.errorCode || null,
        metadata: options.metadata ? JSON.stringify(options.metadata) : null,
      },
    })

    // Console log for development
    const icon = result === 'success' ? '✅' : '❌'
    console.log(
      `[AUDIT] ${icon} ${eventType} | ` +
      `IP: ${options.ipAddress || 'unknown'} | ` +
      `Risk: ${options.riskScore || 0}` +
      (options.reason ? ` - ${options.reason}` : '')
    )
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
    action,
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
 * Get failed events for IP in time window
 */
export async function getFailedEventsByIp(
  ipAddress: string,
  eventType: string,
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

  return result.count
}

/**
 * Get audit log count (for monitoring)
 */
export async function getAuditLogCount(): Promise<number> {
  return await prisma.auditLog.count()
}
