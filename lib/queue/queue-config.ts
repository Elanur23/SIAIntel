// @ts-nocheck - TODO: Fix implicit any types (Phase 4C - deferred to strict mode phase)
import { Queue } from 'bullmq'

// Redis connection options (BullMQ uses its own ioredis; use host/port or redis URL)
const connection = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT) || 6379,
  maxRetriesPerRequest: null
}

// Oracle Prediction Queue
export const oraclePredictionQueue = new Queue('oracle-predictions', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: 100,
    removeOnFail: 500
  }
})

// Neural Link Data Ingestion Queue
export const neuralLinkQueue = new Queue('neural-link-ingestion', {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'fixed',
      delay: 5000
    }
  }
})

// Whale Alert Processing Queue
export const whaleAlertQueue = new Queue('whale-alerts', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    priority: 1
  }
})

// Telegram Broadcast Queue
export const telegramBroadcastQueue = new Queue('telegram-broadcast', {
  connection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000
    }
  }
})
