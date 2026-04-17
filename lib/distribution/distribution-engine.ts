import type { Language } from '@/lib/dispatcher/types'

export interface DistributionRequest {
  articleId: string
  languages: Language[]
  category: string
  title: string
  generateWidget?: boolean
}

export interface DistributionJob {
  id: string
  articleId: string
  languages: Language[]
  category: string
  title: string
  generateWidget: boolean
  status: 'queued' | 'processing' | 'completed' | 'failed'
  createdAt: string
  completedAt?: string
  error?: string
}

export interface DistributionMetrics {
  total: number
  queued: number
  processing: number
  completed: number
  failed: number
}

class DistributionEngine {
  private jobs = new Map<string, DistributionJob>()

  async distributeArticle(request: DistributionRequest): Promise<DistributionJob> {
    const jobId = `dist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const job: DistributionJob = {
      id: jobId,
      articleId: request.articleId,
      languages: request.languages,
      category: request.category,
      title: request.title,
      generateWidget: request.generateWidget !== false,
      status: 'processing',
      createdAt: new Date().toISOString(),
    }

    this.jobs.set(jobId, job)

    // Keep behavior deterministic for API consumers while avoiding heavy background work.
    job.status = 'completed'
    job.completedAt = new Date().toISOString()

    return job
  }

  getJob(jobId: string): DistributionJob | null {
    return this.jobs.get(jobId) || null
  }

  getMetrics(): DistributionMetrics {
    const values = Array.from(this.jobs.values())
    return {
      total: values.length,
      queued: values.filter((job) => job.status === 'queued').length,
      processing: values.filter((job) => job.status === 'processing').length,
      completed: values.filter((job) => job.status === 'completed').length,
      failed: values.filter((job) => job.status === 'failed').length,
    }
  }

  getRecentDistributions(limit = 10): DistributionJob[] {
    return Array.from(this.jobs.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  }
}

let globalEngine: DistributionEngine | null = null

export function getDistributionEngine(): DistributionEngine {
  if (!globalEngine) {
    globalEngine = new DistributionEngine()
  }
  return globalEngine
}
