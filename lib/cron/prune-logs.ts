/**
 * SIA_SENTINEL: DATA_RETENTION_&_PRUNING_ENGINE
 *
 * Retention: 90 Days (Standard Compliance)
 * Target: Session, AuditLog, RateLimit
 */

import { prisma } from '@/lib/db/prisma';

export async function pruneOldLogs(): Promise<{ sessions: number; auditLogs: number; rateLimits: number }> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  try {
    console.log(`[SIA_PRUNE] Starting data pruning before cutoff: ${ninetyDaysAgo.toISOString()}`);

    // 1. Prune expired sessions (or older than 90 days)
    const sessionResult = await prisma.session.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: new Date() } },
          { createdAt: { lt: ninetyDaysAgo } }
        ]
      }
    });

    // 2. Prune AuditLogs older than 90 days
    const auditLogResult = await prisma.auditLog.deleteMany({
      where: {
        timestamp: { lt: ninetyDaysAgo }
      }
    });

    // 3. Prune RateLimit records older than 90 days (if they didn't expire naturally)
    const rateLimitResult = await prisma.rateLimit.deleteMany({
      where: {
        resetTime: { lt: ninetyDaysAgo }
      }
    });

    console.log('[SIA_PRUNE] Pruning complete:');
    console.log(` - Sessions: ${sessionResult.count}`);
    console.log(` - AuditLogs: ${auditLogResult.count}`);
    console.log(` - RateLimits: ${rateLimitResult.count}`);

    return {
      sessions: sessionResult.count,
      auditLogs: auditLogResult.count,
      rateLimits: rateLimitResult.count
    };
  } catch (error) {
    console.error('[SIA_PRUNE] CRITICAL_ERROR: Log pruning failed', error);
    throw error;
  }
}
