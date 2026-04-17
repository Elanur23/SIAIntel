import { getDistributionEngine } from '@/lib/distribution/distribution-engine'
import type { Language } from '@/lib/dispatcher/types'

export interface HighFrequencyTestResult {
  totalJobs: number
  successfulJobs: number
  failedJobs: number
  durationMs: number
  jobs: Array<{ id: string; status: string }>
}

const DEFAULT_LANGUAGES: Language[] = ['en', 'tr', 'de']

export async function runHighFrequencyTest(): Promise<HighFrequencyTestResult> {
  const start = Date.now()
  const engine = getDistributionEngine()
  const jobs: Array<{ id: string; status: string }> = []

  for (let i = 0; i < 10; i += 1) {
    const job = await engine.distributeArticle({
      articleId: `hf-${i + 1}`,
      languages: DEFAULT_LANGUAGES,
      category: 'MARKET',
      title: `High Frequency Test ${i + 1}`,
      generateWidget: false,
    })

    jobs.push({ id: job.id, status: job.status })
  }

  const successfulJobs = jobs.filter((job) => job.status === 'completed').length

  return {
    totalJobs: jobs.length,
    successfulJobs,
    failedJobs: jobs.length - successfulJobs,
    durationMs: Date.now() - start,
    jobs,
  }
}
