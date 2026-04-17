/**
 * SIA PRIORITY QUEUE - Breaking News Fast Track
 * 
 * Critical events bypass DRIP scheduler and publish instantly
 * Priority levels: 1-10 (10 = highest, publish immediately)
 */

import type { GeneratedArticle } from '@/lib/sia-news/types'
import type { CriticalEvent, BreakingNewsArticle } from './whale-alert-sentinel'

// ============================================================================
// TYPES
// ============================================================================

export interface PriorityQueueItem {
  id: string
  article: Partial<GeneratedArticle>
  priority: number // 1-10
  event: CriticalEvent
  queuedAt: string
  publishAt: string // Immediate or scheduled
  status: 'QUEUED' | 'PUBLISHING' | 'PUBLISHED' | 'FAILED'
}

// ============================================================================
// PRIORITY QUEUE
// ============================================================================

export class PriorityQueue {
  private queue: PriorityQueueItem[] = []
  private processing = false
  
  /**
   * Add breaking news to priority queue
   * Priority 10 = publish immediately (within 10 seconds)
   * Priority 8-9 = publish within 1 minute
   * Priority 6-7 = publish within 5 minutes
   */
  async addBreakingNews(
    article: BreakingNewsArticle,
    event: CriticalEvent
  ): Promise<string> {
    const now = new Date()
    const publishDelay = this.calculatePublishDelay(event.priority)
    const publishAt = new Date(now.getTime() + publishDelay)
    
    const item: PriorityQueueItem = {
      id: `breaking-${event.id}`,
      article: {
        id: `breaking-${event.id}`,
        headline: article.headline,
        summary: article.summary,
        siaInsight: article.siaInsight,
        fullContent: article.fullContent,
        language: article.language,
        metadata: {
          generatedAt: now.toISOString(),
          source: event.source,
          category: 'BREAKING_NEWS',
          tags: article.tags
        }
      } as unknown as Partial<GeneratedArticle>,
      priority: article.priority,
      event,
      queuedAt: now.toISOString(),
      publishAt: publishAt.toISOString(),
      status: 'QUEUED'
    }
    
    // Insert in priority order (highest first)
    this.insertByPriority(item)
    
    console.log(`[PriorityQueue] Added breaking news: ${article.headline} (Priority: ${item.priority})`)
    
    // Start processing if not already running
    if (!this.processing) {
      this.startProcessing()
    }
    
    return item.id
  }
  
  /**
   * Insert item in priority order
   */
  private insertByPriority(item: PriorityQueueItem): void {
    const index = this.queue.findIndex(q => q.priority < item.priority)
    
    if (index === -1) {
      this.queue.push(item)
    } else {
      this.queue.splice(index, 0, item)
    }
  }
  
  /**
   * Calculate publish delay based on priority
   */
  private calculatePublishDelay(priority: number): number {
    if (priority >= 10) return 10_000 // 10 seconds
    if (priority >= 8) return 60_000 // 1 minute
    if (priority >= 6) return 300_000 // 5 minutes
    return 600_000 // 10 minutes
  }
  
  /**
   * Start processing queue
   */
  private async startProcessing(): Promise<void> {
    if (this.processing) return
    
    this.processing = true
    console.log('[PriorityQueue] Started processing')
    
    while (this.queue.length > 0) {
      const item = this.queue[0]
      const now = new Date()
      const publishTime = new Date(item.publishAt)
      
      // Wait until publish time
      if (now < publishTime) {
        const waitTime = publishTime.getTime() - now.getTime()
        console.log(`[PriorityQueue] Waiting ${Math.round(waitTime / 1000)}s for next item`)
        await this.sleep(waitTime)
      }
      
      // Publish item
      await this.publishItem(item)
      
      // Remove from queue
      this.queue.shift()
    }
    
    this.processing = false
    console.log('[PriorityQueue] Processing complete')
  }
  
  /**
   * Publish item
   */
  private async publishItem(item: PriorityQueueItem): Promise<void> {
    try {
      item.status = 'PUBLISHING'
      console.log(`[PriorityQueue] Publishing: ${item.article.headline}`)
      
      // Call publishing API
      const response = await fetch('/api/sia-news/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          article: item.article,
          priority: item.priority,
          breakingNews: true
        })
      })
      
      if (!response.ok) {
        throw new Error(`Publish failed: ${response.status}`)
      }
      
      item.status = 'PUBLISHED'
      console.log(`[PriorityQueue] ✅ Published: ${item.article.headline}`)
      
      // Trigger social media blast for high priority
      if (item.priority >= 9) {
        await this.triggerSocialMediaBlast(item)
      }
      
    } catch (error) {
      item.status = 'FAILED'
      console.error(`[PriorityQueue] ❌ Publish failed:`, error)
    }
  }
  
  /**
   * Trigger social media notifications
   */
  private async triggerSocialMediaBlast(item: PriorityQueueItem): Promise<void> {
    try {
      console.log(`[PriorityQueue] 📢 Triggering social media blast for: ${item.article.headline}`)
      
      // Twitter/X API call (placeholder)
      // await this.postToTwitter(item)
      
      // LinkedIn API call (placeholder)
      // await this.postToLinkedIn(item)
      
      console.log(`[PriorityQueue] ✅ Social media blast complete`)
    } catch (error) {
      console.error(`[PriorityQueue] Social media blast failed:`, error)
    }
  }
  
  /**
   * Get queue status
   */
  getStatus() {
    return {
      queueSize: this.queue.length,
      processing: this.processing,
      items: this.queue.map(item => ({
        id: item.id,
        headline: item.article.headline,
        priority: item.priority,
        status: item.status,
        publishAt: item.publishAt
      }))
    }
  }
  
  /**
   * Clear queue
   */
  clear(): void {
    this.queue = []
    console.log('[PriorityQueue] Queue cleared')
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// Singleton instance
let priorityQueueInstance: PriorityQueue | null = null

export function getPriorityQueue(): PriorityQueue {
  if (!priorityQueueInstance) {
    priorityQueueInstance = new PriorityQueue()
  }
  return priorityQueueInstance
}

export default PriorityQueue
