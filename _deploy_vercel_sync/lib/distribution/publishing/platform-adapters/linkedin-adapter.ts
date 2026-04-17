/**
 * LinkedIn Platform Adapter
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

export class LinkedInAdapter implements PlatformAdapter {
  public readonly platform: Platform = 'linkedin'
  
  private readonly CHARACTER_LIMIT = 3000
  private readonly HASHTAG_LIMIT = 30
  private readonly MEDIA_LIMIT = 9
  
  /**
   * Format content for LinkedIn
   */
  formatContent(content: PlatformContent): PublishPayload {
    const { title, body, hashtags, language } = content
    
    // LinkedIn prefers professional, longer-form content
    let formattedBody = body
    
    // Add title as bold header if present
    if (title) {
      formattedBody = `${title}\n\n${body}`
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
      platform: 'linkedin',
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
   * Validate content for LinkedIn
   */
  validateContent(payload: PublishPayload): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Check character limit
    if (payload.formatting.characterCount > this.CHARACTER_LIMIT) {
      errors.push({
        field: 'body',
        message: `Content exceeds LinkedIn character limit (${payload.formatting.characterCount}/${this.CHARACTER_LIMIT})`,
        severity: 'error'
      })
    }
    
    // Check if content is too short
    if (payload.content.body.trim().length < 50) {
      warnings.push({
        field: 'body',
        message: 'Content is quite short for LinkedIn. Consider adding more context (minimum 50 characters recommended).',
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
    
    // Recommend 3-5 hashtags for LinkedIn
    if (payload.content.hashtags.length > 5) {
      warnings.push({
        field: 'hashtags',
        message: 'LinkedIn performs best with 3-5 hashtags. Consider reducing.',
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
    
    // Warn about professional tone
    if (this.containsCasualLanguage(payload.content.body)) {
      warnings.push({
        field: 'body',
        message: 'Content may contain casual language. LinkedIn prefers professional tone.',
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
   * Simulate publishing to LinkedIn
   * WARNING: This does NOT perform real publishing
   */
  async simulatePublish(payload: PublishPayload): Promise<PublishResult> {
    const validation = this.validateContent(payload)
    
    // If validation fails, return failure result
    if (!validation.isValid) {
      return {
        id: this.generateResultId(),
        platform: 'linkedin',
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
    
    // Simulate network delay (LinkedIn is typically slower)
    const delay = Math.random() * 2000 + 1000 // 1000-3000ms
    await this.sleep(delay)
    
    // Simulate random failure (3% chance - LinkedIn is more reliable)
    const shouldFail = Math.random() < 0.03
    
    if (shouldFail) {
      return {
        id: this.generateResultId(),
        platform: 'linkedin',
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
          code: 'SIMULATED_API_ERROR',
          message: 'Simulated LinkedIn API error (this is a test)',
          details: 'Random failure simulation for testing error handling'
        },
        timestamp: new Date(),
        dryRun: true
      }
    }
    
    // Simulate success
    const mockPostId = this.generateMockPostId()
    const mockPostUrl = `https://www.linkedin.com/feed/update/urn:li:share:${mockPostId}`
    
    return {
      id: this.generateResultId(),
      platform: 'linkedin',
      status: 'simulated_success',
      payload,
      simulation: {
        wouldPublish: true,
        estimatedDelay: delay,
        mockResponse: {
          postId: mockPostId,
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
  
  private containsCasualLanguage(text: string): boolean {
    const casualWords = ['lol', 'omg', 'wtf', 'lmao', 'tbh', 'imho', 'fyi']
    const lowerText = text.toLowerCase()
    return casualWords.some(word => lowerText.includes(word))
  }
  
  private generateResultId(): string {
    return `linkedin_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }
  
  private generateMockPostId(): string {
    return Math.floor(Math.random() * 10000000000000).toString()
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Export singleton instance
 */
export const linkedInAdapter = new LinkedInAdapter()
