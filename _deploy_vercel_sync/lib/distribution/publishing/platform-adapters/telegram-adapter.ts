/**
 * Telegram Platform Adapter
 * Phase 3B: Dry-run simulation only
 * 
 * WARNING: This adapter does NOT perform real publishing.
 * All methods are simulation/validation only.
 */

import type { 
  Platform, 
  PlatformContent, 
  PublishPayload, 
  ValidationResult,
  ValidationError,
  ValidationWarning,
  PublishResult,
  PlatformAdapter
} from '@/lib/distribution/types'

export class TelegramAdapter implements PlatformAdapter {
  public readonly platform: Platform = 'telegram'
  
  private readonly CHARACTER_LIMIT = 4096
  private readonly HASHTAG_LIMIT = 50
  private readonly MEDIA_LIMIT = 10
  
  /**
   * Format content for Telegram
   */
  formatContent(content: PlatformContent): PublishPayload {
    const { title, body, hashtags, language } = content
    
    // Telegram supports rich formatting (HTML/Markdown)
    let formattedBody = body
    
    // Add title as bold header if present
    if (title) {
      formattedBody = `<b>${this.escapeHtml(title)}</b>\n\n${body}`
    }
    
    // Add hashtags at the end
    const hashtagString = hashtags.length > 0 
      ? '\n\n' + hashtags.slice(0, this.HASHTAG_LIMIT).map(tag => `#${tag}`).join(' ')
      : ''
    
    const fullContent = formattedBody + hashtagString
    
    // Truncate if needed
    const finalContent = fullContent.length > this.CHARACTER_LIMIT
      ? fullContent.substring(0, this.CHARACTER_LIMIT - 3) + '...'
      : fullContent
    
    return {
      platform: 'telegram',
      content: {
        title,
        body: finalContent,
        hashtags: hashtags.slice(0, this.HASHTAG_LIMIT),
        mentions: [],
        mediaUrls: []
      },
      metadata: {
        language,
        priority: 'normal'
      },
      formatting: {
        characterCount: finalContent.length,
        characterLimit: this.CHARACTER_LIMIT,
        hasMedia: false,
        hasLinks: this.detectLinks(finalContent),
        hasHashtags: hashtags.length > 0
      }
    }
  }
  
  /**
   * Validate content for Telegram
   */
  validateContent(payload: PublishPayload): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Check character limit
    if (payload.formatting.characterCount > this.CHARACTER_LIMIT) {
      errors.push({
        field: 'body',
        message: `Content exceeds Telegram character limit (${payload.formatting.characterCount}/${this.CHARACTER_LIMIT})`,
        severity: 'error'
      })
    }
    
    // Check if content is too short
    if (payload.content.body.trim().length < 20) {
      warnings.push({
        field: 'body',
        message: 'Content is quite short. Consider adding more detail.',
        severity: 'warning'
      })
    }
    
    // Check hashtag limit
    if (payload.content.hashtags.length > this.HASHTAG_LIMIT) {
      warnings.push({
        field: 'hashtags',
        message: `Too many hashtags (${payload.content.hashtags.length}/${this.HASHTAG_LIMIT}). Only first ${this.HASHTAG_LIMIT} will be used.`,
        severity: 'warning'
      })
    }
    
    // Check for empty content
    if (!payload.content.body || payload.content.body.trim().length === 0) {
      errors.push({
        field: 'body',
        message: 'Content body cannot be empty',
        severity: 'error'
      })
    }
    
    // Check media limit
    if (payload.content.mediaUrls.length > this.MEDIA_LIMIT) {
      errors.push({
        field: 'mediaUrls',
        message: `Too many media files (${payload.content.mediaUrls.length}/${this.MEDIA_LIMIT})`,
        severity: 'error'
      })
    }
    
    // Warn about HTML formatting
    if (this.containsHtmlTags(payload.content.body)) {
      warnings.push({
        field: 'body',
        message: 'Content contains HTML tags. Ensure they are properly formatted for Telegram.',
        severity: 'warning'
      })
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }
  
  /**
   * Simulate publishing to Telegram
   * WARNING: This does NOT perform real publishing
   */
  async simulatePublish(payload: PublishPayload): Promise<PublishResult> {
    const validation = this.validateContent(payload)
    
    // If validation fails, return failure result
    if (!validation.isValid) {
      return {
        id: this.generateResultId(),
        platform: 'telegram',
        status: 'validation_failed',
        payload,
        simulation: {
          wouldPublish: false,
          estimatedDelay: 0,
          mockResponse: {
            timestamp: new Date()
          }
        },
        validation,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Content validation failed',
          details: validation.errors.map(e => e.message).join('; ')
        },
        timestamp: new Date(),
        dryRun: true
      }
    }
    
    // Simulate network delay (Telegram is typically fast)
    const delay = Math.random() * 800 + 200 // 200-1000ms
    await this.sleep(delay)
    
    // Simulate random failure (2% chance - Telegram is very reliable)
    const shouldFail = Math.random() < 0.02
    
    if (shouldFail) {
      return {
        id: this.generateResultId(),
        platform: 'telegram',
        status: 'simulated_failure',
        payload,
        simulation: {
          wouldPublish: false,
          estimatedDelay: delay,
          mockResponse: {
            timestamp: new Date()
          }
        },
        validation,
        error: {
          code: 'SIMULATED_BOT_ERROR',
          message: 'Simulated Telegram Bot API error (this is a test)',
          details: 'Random failure simulation for testing error handling'
        },
        timestamp: new Date(),
        dryRun: true
      }
    }
    
    // Simulate success
    const mockMessageId = this.generateMockMessageId()
    const mockPostUrl = `https://t.me/siaintel/${mockMessageId}`
    
    return {
      id: this.generateResultId(),
      platform: 'telegram',
      status: 'simulated_success',
      payload,
      simulation: {
        wouldPublish: true,
        estimatedDelay: delay,
        mockResponse: {
          postId: mockMessageId.toString(),
          postUrl: mockPostUrl,
          timestamp: new Date()
        }
      },
      validation,
      timestamp: new Date(),
      dryRun: true
    }
  }
  
  getCharacterLimit(): number {
    return this.CHARACTER_LIMIT
  }
  
  getHashtagLimit(): number {
    return this.HASHTAG_LIMIT
  }
  
  supportsMedia(): boolean {
    return true
  }
  
  supportsLinks(): boolean {
    return true
  }
  
  // Helper methods
  
  private detectLinks(text: string): boolean {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return urlRegex.test(text)
  }
  
  private containsHtmlTags(text: string): boolean {
    const htmlRegex = /<[^>]+>/g
    return htmlRegex.test(text)
  }
  
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;')
  }
  
  private generateResultId(): string {
    return `telegram_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }
  
  private generateMockMessageId(): number {
    return Math.floor(Math.random() * 1000000)
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Export singleton instance
 */
export const telegramAdapter = new TelegramAdapter()
