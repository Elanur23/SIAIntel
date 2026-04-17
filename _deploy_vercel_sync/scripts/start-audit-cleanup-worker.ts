/**
 * Audit Cleanup Worker Startup Script
 * 
 * Starts the BullMQ worker for audit log cleanup.
 * Run this as a separate process in production.
 */

import { createAuditCleanupWorker, scheduleAuditCleanup } from '../lib/jobs/audit-cleanup'

async function main() {
  console.log('🚀 Starting Audit Cleanup Worker...')
  console.log('================================')

  try {
    // Check environment variables
    const redisHost = process.env.REDIS_HOST || 'localhost'
    const redisPort = process.env.REDIS_PORT || '6379'
    const slackWebhook = process.env.SLACK_WEBHOOK_URL

    console.log(`📡 Redis: ${redisHost}:${redisPort}`)
    console.log(`📢 Slack Alerts: ${slackWebhook ? 'Enabled' : 'Disabled'}`)

    // Create worker
    console.log('\n⚙️  Creating worker...')
    const worker = createAuditCleanupWorker()

    // Schedule repeatable job
    console.log('📅 Scheduling daily job...')
    await scheduleAuditCleanup()

    console.log('\n✅ Audit Cleanup Worker Started')
    console.log('⏰ Scheduled to run daily at 02:00')
    console.log('🔄 Worker is now listening for jobs...')
    console.log('\nPress Ctrl+C to stop')

    // Keep process alive
    process.on('SIGINT', async () => {
      console.log('\n\n🛑 Shutting down worker...')
      await worker.close()
      console.log('✅ Worker stopped')
      process.exit(0)
    })

  } catch (error) {
    console.error('\n❌ Failed to start worker:', error)
    process.exit(1)
  }
}

main()
