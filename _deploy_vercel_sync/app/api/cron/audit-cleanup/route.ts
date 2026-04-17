/**
 * Vercel Cron Job: Audit Log Cleanup
 * 
 * Runs daily at 02:00 UTC to clean up old audit logs.
 * Replaces BullMQ worker for serverless environments.
 * 
 * Vercel Cron Configuration:
 * - Schedule: 0 2 * * * (daily at 02:00)
 * - Timeout: 10 seconds
 * - Authorization: CRON_SECRET header
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db/turso'

const RETENTION_DAYS = 90

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret (Vercel automatically adds this header)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('[CRON] Starting audit log cleanup...')

    // Calculate cutoff date
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS)

    // Delete old audit logs
    const result = await prisma.auditLog.deleteMany({
      where: {
        timestamp: {
          lt: cutoffDate,
        },
      },
    })

    const deletedCount = result.count

    console.log(`[CRON] Deleted ${deletedCount} audit logs older than ${RETENTION_DAYS} days`)

    // Send Slack notification if configured
    if (process.env.SLACK_WEBHOOK_URL && deletedCount > 0) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🧹 Audit Log Cleanup Complete`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Audit Log Cleanup*\n✅ Deleted ${deletedCount} logs older than ${RETENTION_DAYS} days`,
                },
              },
              {
                type: 'context',
                elements: [
                  {
                    type: 'mrkdwn',
                    text: `Cutoff Date: ${cutoffDate.toISOString()}`,
                  },
                ],
              },
            ],
          }),
        })
      } catch (slackError) {
        console.error('[CRON] Failed to send Slack notification:', slackError)
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      cutoffDate: cutoffDate.toISOString(),
      retentionDays: RETENTION_DAYS,
    })

  } catch (error) {
    console.error('[CRON] Audit cleanup failed:', error)

    // Send error notification to Slack
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `❌ Audit Log Cleanup Failed`,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: `*Audit Log Cleanup Error*\n\`\`\`${error instanceof Error ? error.message : 'Unknown error'}\`\`\``,
                },
              },
            ],
          }),
        })
      } catch (slackError) {
        console.error('[CRON] Failed to send error notification:', slackError)
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// Prevent caching
export const dynamic = 'force-dynamic'
export const revalidate = 0
