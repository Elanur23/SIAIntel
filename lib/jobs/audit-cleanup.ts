/**
 * Audit Log Cleanup Job
 * 
 * BullMQ repeatable job that runs daily at 02:00 to clean up old audit logs.
 * Retention policy: 90 days
 */

import { Queue, Worker, Job } from 'bullmq'
import { prisma } from '@/lib/db/prisma'
import { logAuditEvent } from '@/lib/auth/audit-logger'

// Redis connection configuration
const redisConnection = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
}

// Retention period in days
const RETENTION_DAYS = 90

// Slack webhook for error alerts
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL

/**
 * Audit Cleanup Queue
 */
export const auditCleanupQueue = new Queue('audit-cleanup', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
})

/**
 * Send alert to Slack
 */
async function sendSlackAlert(message: string, error?: Error): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('[AUDIT-CLEANUP] Slack webhook not configured')
    return
  }

  try {
    const payload = {
      text: '🚨 Audit Log Cleanup Error',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 Audit Log Cleanup Failed',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*Message:* ${message}`,
          },
        },
        ...(error
          ? [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Error:* \`${error.message}\``,
                },
              },
            ]
          : []),
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Timestamp: ${new Date().toISOString()}`,
            },
          ],
        },
      ],
    }

    const response = await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error('[AUDIT-CLEANUP] Failed to send Slack alert:', response.statusText)
    }
  } catch (err) {
    console.error('[AUDIT-CLEANUP] Error sending Slack alert:', err)
  }
}

/**
 * Cleanup old audit logs
 */
async function cleanupAuditLogs(): Promise<number> {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

  console.log(`[AUDIT-CLEANUP] Deleting audit logs older than ${cutoffDate.toISOString()}`)

  try {
    // Delete old audit logs
    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    })

    const deletedCount = result.count

    console.log(`[AUDIT-CLEANUP] Successfully deleted ${deletedCount} audit log entries`)

    // Log the cleanup action to audit log
    await logAuditEvent({
      action: 'AUDIT_LOG_CLEANUP',
      userId: 'system',
      success: true,
      metadata: JSON.stringify({
        deletedCount,
        cutoffDate: cutoffDate.toISOString(),
        retentionDays: RETENTION_DAYS,
      }),
    })

    return deletedCount
  } catch (error) {
    console.error('[AUDIT-CLEANUP] Error during cleanup:', error)
    throw error
  }
}

/**
 * Job processor
 */
async function processCleanupJob(job: Job): Promise<{ deletedCount: number }> {
  console.log(`[AUDIT-CLEANUP] Starting job ${job.id}`)

  try {
    const deletedCount = await cleanupAuditLogs()

    return { deletedCount }
  } catch (error) {
    const err = error as Error
    console.error('[AUDIT-CLEANUP] Job failed:', err)

    // Send Slack alert on failure
    await sendSlackAlert('Audit log cleanup job failed', err)

    // Log failure to audit log
    await logAuditEvent({
      action: 'AUDIT_LOG_CLEANUP',
      userId: 'system',
      success: false,
      errorMessage: err.message,
      metadata: JSON.stringify({
        retentionDays: RETENTION_DAYS,
      }),
    })

    throw err
  }
}

/**
 * Create and configure the worker
 */
export function createAuditCleanupWorker(): Worker {
  const worker = new Worker('audit-cleanup', processCleanupJob, {
    connection: redisConnection,
    concurrency: 1, // Only one cleanup job at a time
  })

  worker.on('completed', (job, result) => {
    console.log(`[AUDIT-CLEANUP] Job ${job.id} completed:`, result)
  })

  worker.on('failed', (job, err) => {
    console.error(`[AUDIT-CLEANUP] Job ${job?.id} failed:`, err)
  })

  return worker
}

/**
 * Schedule the repeatable job
 * Runs daily at 02:00 (2 AM)
 */
export async function scheduleAuditCleanup(): Promise<void> {
  try {
    // Remove existing repeatable jobs with same pattern
    const repeatableJobs = await auditCleanupQueue.getRepeatableJobs()
    for (const job of repeatableJobs) {
      if (job.name === 'audit-cleanup-daily') {
        await auditCleanupQueue.removeRepeatableByKey(job.key)
      }
    }

    // Add new repeatable job
    await auditCleanupQueue.add(
      'audit-cleanup-daily',
      {},
      {
        repeat: {
          pattern: '0 2 * * *', // Every day at 02:00
        },
      }
    )

    console.log('[AUDIT-CLEANUP] Scheduled daily cleanup job at 02:00')
  } catch (error) {
    console.error('[AUDIT-CLEANUP] Failed to schedule job:', error)
    throw error
  }
}

/**
 * Manually trigger cleanup (for testing)
 */
export async function triggerManualCleanup(): Promise<Job> {
  return auditCleanupQueue.add('audit-cleanup-manual', {})
}
