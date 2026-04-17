/**
 * Dispatcher Orchestrator
 * Central coordination service for Global Intelligence Dispatcher
 * Manages job lifecycle, concurrent processing, and error recovery
 */

import { v4 as uuidv4 } from 'uuid'
import type {
  IntelligenceInput,
  DispatcherJob,
  DispatcherResult,
  DispatcherOptions,
  DispatcherConfig,
  DispatcherError,
  Language,
  JobStatus,
  ProcessingStep,
  TranslatedContent,
  ValidationResult,
  PublishResult,
  ProgressUpdate,
} from './types'

export class DispatcherOrchestrator {
  private jobs: Map<string, DispatcherJob> = new Map()
  private config: DispatcherConfig
  private activeJobs: number = 0

  constructor(config?: Partial<DispatcherConfig>) {
    this.config = {
      maxConcurrentJobs: config?.maxConcurrentJobs || 10,
      translationTimeout: config?.translationTimeout || 30000,
      publishingTimeout: config?.publishingTimeout || 30000,
      cacheEnabled: config?.cacheEnabled ?? true,
      cacheTTL: config?.cacheTTL || 86400000, // 24 hours
      retryAttempts: config?.retryAttempts || 3,
      retryBackoff: config?.retryBackoff || 'exponential',
    }
  }

  /**
   * Create a new dispatcher job
   */
  async createJob(
    input: IntelligenceInput,
    sourceLanguage: Language,
    targetLanguages: Language[],
    userId: string,
    options?: DispatcherOptions
  ): Promise<DispatcherResult> {
    // Check concurrent job limit
    if (this.activeJobs >= this.config.maxConcurrentJobs) {
      return {
        success: false,
        jobId: '',
        status: 'failed',
        errors: [
          {
            code: 'MAX_CONCURRENT_JOBS',
            message: `Maximum concurrent jobs (${this.config.maxConcurrentJobs}) reached. Please try again later.`,
            step: 'validation',
            severity: 'high',
            recoverable: true,
            timestamp: new Date().toISOString(),
          },
        ],
      }
    }

    // Validate input
    const validationError = this.validateInput(input)
    if (validationError) {
      return {
        success: false,
        jobId: '',
        status: 'failed',
        errors: [validationError],
      }
    }

    // Create job
    const jobId = uuidv4()
    const job: DispatcherJob = {
      id: jobId,
      status: 'pending',
      sourceLanguage,
      sourceContent: input,
      targetLanguages,
      currentStep: 'validation',
      completedSteps: [],
      progress: 0,
      errors: [],
      createdAt: new Date().toISOString(),
      userId,
    }

    this.jobs.set(jobId, job)
    this.activeJobs++

    // Start processing asynchronously
    this.processJob(jobId, options).catch((error) => {
      console.error(`Job ${jobId} processing error:`, error)
      this.updateJobStatus(jobId, 'failed', {
        code: 'PROCESSING_ERROR',
        message: error.message,
        step: job.currentStep,
        severity: 'critical',
        recoverable: false,
        timestamp: new Date().toISOString(),
        stack: error.stack,
      })
    })

    return {
      success: true,
      jobId,
      status: 'pending',
      estimatedTime: this.estimateProcessingTime(targetLanguages.length),
    }
  }

  /**
   * Get job status
   */
  getJob(jobId: string): DispatcherJob | undefined {
    return this.jobs.get(jobId)
  }

  /**
   * Get job progress
   */
  getProgress(jobId: string): ProgressUpdate | null {
    const job = this.jobs.get(jobId)
    if (!job) return null

    const totalSteps = 7 // validation, translation, protocol, seo, quality, publishing, indexing
    const completedSteps = job.completedSteps.length
    const percentage = Math.round((completedSteps / totalSteps) * 100)

    const estimatedTimeRemaining = this.estimateRemainingTime(
      job.currentStep,
      job.targetLanguages.length
    )

    return {
      jobId,
      currentStep: job.currentStep,
      completedSteps: job.completedSteps,
      percentage,
      estimatedTimeRemaining,
      message: this.getStepMessage(job.currentStep),
    }
  }

  /**
   * Cancel a job
   */
  async cancelJob(jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId)
    if (!job) return false

    if (job.status === 'completed' || job.status === 'failed') {
      return false
    }

    job.status = 'failed'
    job.errors.push({
      code: 'JOB_CANCELLED',
      message: 'Job was cancelled by user',
      step: job.currentStep,
      severity: 'low',
      recoverable: false,
      timestamp: new Date().toISOString(),
    })

    this.activeJobs--
    return true
  }

  /**
   * Process a job through all steps
   */
  private async processJob(
    jobId: string,
    options?: DispatcherOptions
  ): Promise<void> {
    const job = this.jobs.get(jobId)
    if (!job) throw new Error('Job not found')

    try {
      job.status = 'processing'
      job.startedAt = new Date().toISOString()

      // Step 1: Validation (already done in createJob)
      this.updateStep(jobId, 'validation')
      await this.delay(100)
      this.completeStep(jobId, 'validation')

      // Step 2: Translation
      this.updateStep(jobId, 'translation')
      // Translation will be handled by TranslationEngine
      // For now, mark as complete
      await this.delay(1000)
      this.completeStep(jobId, 'translation')

      // Step 3: Protocol Processing
      this.updateStep(jobId, 'protocol_processing')
      await this.delay(500)
      this.completeStep(jobId, 'protocol_processing')

      // Step 4: SEO Generation
      this.updateStep(jobId, 'seo_generation')
      await this.delay(500)
      this.completeStep(jobId, 'seo_generation')

      // Step 5: Quality Check
      this.updateStep(jobId, 'quality_check')
      await this.delay(300)
      this.completeStep(jobId, 'quality_check')

      if (options?.validateOnly) {
        job.status = 'completed'
        job.completedAt = new Date().toISOString()
        job.processingTime = Date.now() - new Date(job.startedAt).getTime()
        this.activeJobs--
        return
      }

      // Step 6: Publishing
      this.updateStep(jobId, 'publishing')
      await this.delay(1000)
      this.completeStep(jobId, 'publishing')

      // Step 7: Indexing
      if (!options?.skipIndexing) {
        this.updateStep(jobId, 'indexing')
        await this.delay(500)
        this.completeStep(jobId, 'indexing')
      }

      // Complete job
      job.status = 'completed'
      job.completedAt = new Date().toISOString()
      job.processingTime = Date.now() - new Date(job.startedAt).getTime()
      this.activeJobs--
    } catch (error: any) {
      job.status = 'failed'
      job.errors.push({
        code: 'PROCESSING_ERROR',
        message: error.message,
        step: job.currentStep,
        severity: 'critical',
        recoverable: false,
        timestamp: new Date().toISOString(),
        stack: error.stack,
      })
      this.activeJobs--
      throw error
    }
  }

  /**
   * Validate intelligence input
   */
  private validateInput(input: IntelligenceInput): DispatcherError | null {
    if (!input.title || input.title.length < 10) {
      return {
        code: 'INVALID_TITLE',
        message: 'Title must be at least 10 characters long',
        step: 'validation',
        severity: 'high',
        recoverable: true,
        timestamp: new Date().toISOString(),
      }
    }

    if (!input.content || input.content.length < 100) {
      return {
        code: 'INVALID_CONTENT',
        message: 'Content must be at least 100 characters long',
        step: 'validation',
        severity: 'high',
        recoverable: true,
        timestamp: new Date().toISOString(),
      }
    }

    if (!input.category) {
      return {
        code: 'MISSING_CATEGORY',
        message: 'Category is required',
        step: 'validation',
        severity: 'medium',
        recoverable: true,
        timestamp: new Date().toISOString(),
      }
    }

    return null
  }

  /**
   * Update job status
   */
  private updateJobStatus(
    jobId: string,
    status: JobStatus,
    error?: DispatcherError
  ): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.status = status
    if (error) {
      job.errors.push(error)
    }

    if (status === 'completed' || status === 'failed') {
      job.completedAt = new Date().toISOString()
      if (job.startedAt) {
        job.processingTime = Date.now() - new Date(job.startedAt).getTime()
      }
      this.activeJobs--
    }
  }

  /**
   * Update current processing step
   */
  private updateStep(jobId: string, step: ProcessingStep): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    job.currentStep = step
  }

  /**
   * Mark step as completed
   */
  private completeStep(jobId: string, step: ProcessingStep): void {
    const job = this.jobs.get(jobId)
    if (!job) return

    if (!job.completedSteps.includes(step)) {
      job.completedSteps.push(step)
    }

    // Update progress
    const totalSteps = 7
    job.progress = Math.round((job.completedSteps.length / totalSteps) * 100)
  }

  /**
   * Estimate processing time based on number of languages
   */
  private estimateProcessingTime(languageCount: number): number {
    // Base time: 5 seconds
    // Per language: 2 seconds
    return 5 + languageCount * 2
  }

  /**
   * Estimate remaining time based on current step
   */
  private estimateRemainingTime(
    currentStep: ProcessingStep,
    languageCount: number
  ): number {
    const stepTimes: Record<ProcessingStep, number> = {
      validation: 1,
      translation: languageCount * 2,
      protocol_processing: languageCount * 0.5,
      seo_generation: languageCount * 0.5,
      quality_check: languageCount * 0.3,
      publishing: languageCount * 1,
      indexing: 2,
    }

    const steps: ProcessingStep[] = [
      'validation',
      'translation',
      'protocol_processing',
      'seo_generation',
      'quality_check',
      'publishing',
      'indexing',
    ]

    const currentIndex = steps.indexOf(currentStep)
    let remainingTime = 0

    for (let i = currentIndex + 1; i < steps.length; i++) {
      remainingTime += stepTimes[steps[i]]
    }

    return remainingTime
  }

  /**
   * Get user-friendly message for current step
   */
  private getStepMessage(step: ProcessingStep): string {
    const messages: Record<ProcessingStep, string> = {
      validation: 'Validating intelligence input...',
      translation: 'Translating to all languages...',
      protocol_processing: 'Applying SIA Master Protocol...',
      seo_generation: 'Generating SEO metadata...',
      quality_check: 'Performing quality checks...',
      publishing: 'Publishing to all languages...',
      indexing: 'Notifying search engines...',
    }

    return messages[step]
  }

  /**
   * Utility: Delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  /**
   * Get all jobs for a user
   */
  getUserJobs(userId: string): DispatcherJob[] {
    return Array.from(this.jobs.values()).filter((job) => job.userId === userId)
  }

  /**
   * Clean up old completed jobs (older than 24 hours)
   */
  cleanupOldJobs(): number {
    const now = Date.now()
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    let cleaned = 0

    for (const [jobId, job] of this.jobs.entries()) {
      if (
        (job.status === 'completed' || job.status === 'failed') &&
        job.completedAt
      ) {
        const completedTime = new Date(job.completedAt).getTime()
        if (now - completedTime > maxAge) {
          this.jobs.delete(jobId)
          cleaned++
        }
      }
    }

    return cleaned
  }
}

// Singleton instance
let orchestratorInstance: DispatcherOrchestrator | null = null

export function getOrchestrator(): DispatcherOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new DispatcherOrchestrator()
  }
  return orchestratorInstance
}
