/**
 * Facebook Platform Adapter
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

export class FacebookAdapter implements PlatformAdapter {
  public readonly platform: Platform = 'facebook'
  
  private readonly CHARACTER_LIMIT = 63206
  private readonly HASHTAG_LIMIT = 30
  private readonly MEDIA_LIMIT = 10
  
  /**
   * Format content for Facebook
   */
  formatContent(content: PlatformContent): PublishPayload {
    const { title, body, hashtags, language } = content
    
    // Facebook prefers engaging, conversational content
    let formattedBody = body
    
    // Add title as header if present
    if (title) {
      formattedBody = `${title}\n\n${body}`
    }
    
    // Add hashtags at the end
    const hashtagString = hashtags.length > 0 
      ? '\n\n' + hashtags.slice(0, this.HASHTAG_LIMIT).map(tag => `#${tag}`).join(' ')
      : ''
    
    const fullContent = formattedBody + hashtagString
    
    // Truncate if needed (unlikely with Facebook's high limit)
    const finalContent = fullContent.length > this.CHARACTER_LIMIT
      ? fullContent.substring(0, this.CHARACTER_LIMIT - 3) + '...'
      : fullContent
    
    return {
      platform: 'facebook',
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
   * Validate content for Facebook
   */
  validateContent(payload: PublishPayload): ValidationResult {
    const errors: ValidationError[] = []
    const warnings: ValidationWarning[] = []
    
    // Check character limit (very high, rarely an issue)
    if (payload.formatting.characterCount > this.CHARACTER_LIMIT) {
      errors.push({
        field: 'body',
        message: `Content exceeds Facebook character limit (${payload.formatting.characterCount}/${this.CHARACTER_LIMIT})`,
        severity: 'error'
      })
    }
    
    // Check if content is too short
    if (payload.content.body.trim().length < 30) {
      warnings.push({
        field: 'body',
        message: 'Content is quite short for Facebook. Consider adding more context.',
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
    
    // Recommend fewer hashtags for Facebook
    if (payload.content.hashtags.length > 5) {
      warnings.push({
        field: 'hashtags',
        message: 'Facebook performs best with 1-3 hashtags. Consider reducing.',
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
    
    // Warn about link previews
    if (payload.formatting.hasLinks) {
      warnings.push({
        field: 'body',
        message: 'Facebook will generate link previews automatically',
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
   * Simulate publishing to Facebook
   * WARNING: This does NOT perform real publishing
   */
  async simulatePublish(payload: PublishPayload): Promise<PublishResult> {
    const validation = this.validateContent(payload)
    
    // If validation fails, return failure result
    if (!validation.isValid) {
      return {
        id: this.generateResultId(),
        platform: 'facebook',
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
    
    // Simulate network delay (Facebook can be slower)
    const delay = Math.random() * 2500 + 1500 // 1500-4000ms
    await this.sleep(delay)
    
    // Simulate random failure (4% chance)
    const shouldFail = Math.random() < 0.04
    
    if (shouldFail) {
      return {
        id: this.generateResultId(),
        platform: 'facebook',
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
          code: 'SIMULATED_GRAPH_API_ERROR',
          message: 'Simulated Facebook Graph API error (this is a test)',
          details: 'Random failure simulation for testing error handling'
        },
        timestamp: new Date(),
        dryRun: true
      }
    }
    
    // Simulate success
    const mockPostId = this.generateMockPostId()
    const mockPostUrl = `https://www.facebook.com/siaintel/posts/${mockPostId}`
    
    return {
      id: this.generateResultId(),
      platform: 'facebook',
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
  
  private generateResultId(): string {
    return `facebook_${Date.now()}_${Math.random().toString(36).substring(7)}`
  }
  
  private generateMockPostId(): string {
    return Math.floor(Math.random() * 10000000000000000).toString()
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Export singleton instance
 */
export const facebookAdapter = new FacebookAdapter()
