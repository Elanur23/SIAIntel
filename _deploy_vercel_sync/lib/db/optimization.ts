/**
 * DATABASE OPTIMIZATION - Scale Preparation
 * 
 * Utilities for database performance and PostgreSQL migration
 * Ensures efficient queries and proper indexing
 */

import { prisma } from '@/lib/db/prisma'
import { auditLog } from '@/lib/auth/audit-logger'

/**
 * Database statistics
 */
export interface DatabaseStats {
  sessions: {
    total: number
    active: number
    expired: number
  }
  auditLogs: {
    total: number
    last24h: number
    last7d: number
  }
  rateLimits: {
    total: number
    active: number
  }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<DatabaseStats> {
  const now = new Date()
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  const [
    totalSessions,
    activeSessions,
    expiredSessions,
    totalAuditLogs,
    auditLogs24h,
    auditLogs7d,
    totalRateLimits,
    activeRateLimits,
  ] = await Promise.all([
    prisma.session.count(),
    prisma.session.count({ where: { expiresAt: { gt: now } } }),
    prisma.session.count({ where: { expiresAt: { lte: now } } }),
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { timestamp: { gte: yesterday } } }),
    prisma.auditLog.count({ where: { timestamp: { gte: lastWeek } } }),
    prisma.rateLimit.count(),
    prisma.rateLimit.count({ where: { resetTime: { gt: now } } }),
  ])

  return {
    sessions: {
      total: totalSessions,
      active: activeSessions,
      expired: expiredSessions,
    },
    auditLogs: {
      total: totalAuditLogs,
      last24h: auditLogs24h,
      last7d: auditLogs7d,
    },
    rateLimits: {
      total: totalRateLimits,
      active: activeRateLimits,
    },
  }
}

/**
 * Cleanup expired sessions
 */
export async function cleanupExpiredSessions(): Promise<number> {
  const result = await prisma.session.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  })

  if (result.count > 0) {
    await auditLog('session_cleanup', 'success', {
      metadata: {
        sessionsDeleted: result.count,
      },
    })
  }

  return result.count
}

/**
 * Cleanup old audit logs
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
        auditLogsDeleted: result.count,
        retentionDays,
      },
    })
  }

  return result.count
}

/**
 * Cleanup expired rate limits
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  const result = await prisma.rateLimit.deleteMany({
    where: {
      resetTime: {
        lt: new Date(),
      },
    },
  })

  return result.count
}

/**
 * Run all cleanup tasks
 */
export async function runDatabaseMaintenance(): Promise<{
  sessionsDeleted: number
  auditLogsDeleted: number
  rateLimitsDeleted: number
}> {
  console.log('[DB-MAINTENANCE] Starting database maintenance...')

  const [sessionsDeleted, auditLogsDeleted, rateLimitsDeleted] = await Promise.all([
    cleanupExpiredSessions(),
    cleanupOldAuditLogs(90),
    cleanupExpiredRateLimits(),
  ])

  console.log('[DB-MAINTENANCE] Maintenance complete:', {
    sessionsDeleted,
    auditLogsDeleted,
    rateLimitsDeleted,
  })

  return {
    sessionsDeleted,
    auditLogsDeleted,
    rateLimitsDeleted,
  }
}

/**
 * Check database health
 */
export async function checkDatabaseHealth(): Promise<{
  healthy: boolean
  issues: string[]
  stats: DatabaseStats
}> {
  const issues: string[] = []

  try {
    const stats = await getDatabaseStats()

    // Check for too many expired sessions
    if (stats.sessions.expired > 1000) {
      issues.push(`${stats.sessions.expired} expired sessions need cleanup`)
    }

    // Check for too many old audit logs
    if (stats.auditLogs.total > 100000) {
      issues.push(`${stats.auditLogs.total} audit logs (consider cleanup)`)
    }

    // Check for too many rate limit entries
    if (stats.rateLimits.total > 10000) {
      issues.push(`${stats.rateLimits.total} rate limit entries need cleanup`)
    }

    return {
      healthy: issues.length === 0,
      issues,
      stats,
    }
  } catch (error) {
    console.error('[DB-HEALTH] Health check failed:', error)
    return {
      healthy: false,
      issues: ['Database health check failed'],
      stats: {
        sessions: { total: 0, active: 0, expired: 0 },
        auditLogs: { total: 0, last24h: 0, last7d: 0 },
        rateLimits: { total: 0, active: 0 },
      },
    }
  }
}

/**
 * PostgreSQL migration checklist
 */
export interface PostgreSQLMigrationChecklist {
  schemaCompatible: boolean
  indexesOptimized: boolean
  queriesOptimized: boolean
  connectionPooling: boolean
  sslConfigured: boolean
  backupStrategy: boolean
  issues: string[]
}

/**
 * Check PostgreSQL migration readiness
 */
export function checkPostgreSQLReadiness(): PostgreSQLMigrationChecklist {
  const issues: string[] = []

  // Check schema compatibility
  const schemaCompatible = true // Prisma schema is database-agnostic

  // Check if indexes are defined
  const indexesOptimized = true // Indexes defined in schema

  // Check if queries use database-agnostic patterns
  const queriesOptimized = true // Using Prisma ORM

  // Check connection pooling (needs configuration)
  const connectionPooling = false
  issues.push('Configure connection pooling for PostgreSQL')

  // Check SSL configuration
  const sslConfigured = false
  issues.push('Configure SSL for PostgreSQL connection')

  // Check backup strategy
  const backupStrategy = false
  issues.push('Set up automated backup strategy')

  return {
    schemaCompatible,
    indexesOptimized,
    queriesOptimized,
    connectionPooling,
    sslConfigured,
    backupStrategy,
    issues,
  }
}

/**
 * Get recommended indexes for PostgreSQL
 */
export function getRecommendedIndexes(): string[] {
  return [
    'CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON "Session"("expiresAt");',
    'CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON "Session"("userId");',
    'CREATE INDEX IF NOT EXISTS idx_sessions_hashed_token ON "Session"("hashedToken");',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON "AuditLog"("timestamp");',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON "AuditLog"("action");',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON "AuditLog"("userId");',
    'CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON "AuditLog"("ipAddress");',
    'CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON "RateLimit"("key");',
    'CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON "RateLimit"("resetTime");',
  ]
}
