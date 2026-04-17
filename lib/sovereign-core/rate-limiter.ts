/**
 * SMART RATE LIMITER (API GUARD)
 * Optimized for free Gemini 1.5 API limits
 * Exponential backoff on 429 errors
 */

export interface RateLimitConfig {
  baseDelay: number; // Base delay between requests (ms)
  maxRetries: number; // Max retry attempts
  backoffMultiplier: number; // Exponential backoff multiplier
  maxBackoff: number; // Maximum backoff time (ms)
}

export interface RateLimitResult {
  success: boolean;
  retries: number;
  totalWaitTime: number;
  error?: string;
}

class RateLimiter {
  private lastRequestTime = 0;
  private requestCount = 0;
  private failureCount = 0;

  private config: RateLimitConfig = {
    baseDelay: 40000, // 40 seconds between requests
    maxRetries: 5,
    backoffMultiplier: 2,
    maxBackoff: 300000 // 5 minutes max
  };

  /**
   * Wait before making next request
   */
  async waitForNextRequest(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const waitTime = Math.max(0, this.config.baseDelay - timeSinceLastRequest);

    if (waitTime > 0) {
      console.log(`[RATE_LIMITER] Waiting ${(waitTime / 1000).toFixed(1)}s before next request...`);
      await this.sleep(waitTime);
    }

    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Execute API call with retry logic
   */
  async executeWithRetry<T>(
    apiCall: () => Promise<T>,
    operationName: string
  ): Promise<RateLimitResult & { data?: T }> {
    let retries = 0;
    let totalWaitTime = 0;

    while (retries <= this.config.maxRetries) {
      try {
        // Wait before request
        await this.waitForNextRequest();

        // Execute API call
        console.log(`[RATE_LIMITER] Executing: ${operationName} (attempt ${retries + 1}/${this.config.maxRetries + 1})`);
        const data = await apiCall();

        // Success
        this.failureCount = 0; // Reset failure count on success
        return {
          success: true,
          retries,
          totalWaitTime,
          data
        };

      } catch (error: any) {
        retries++;
        
        // Check if it's a rate limit error (429)
        const isRateLimitError = 
          error.message?.includes('429') ||
          error.message?.includes('rate limit') ||
          error.message?.includes('quota exceeded');

        if (isRateLimitError && retries <= this.config.maxRetries) {
          this.failureCount++;
          
          // Calculate exponential backoff
          const backoffTime = Math.min(
            this.config.baseDelay * Math.pow(this.config.backoffMultiplier, retries),
            this.config.maxBackoff
          );

          totalWaitTime += backoffTime;

          console.warn(
            `[RATE_LIMITER] Rate limit hit! Backing off for ${(backoffTime / 1000).toFixed(1)}s ` +
            `(attempt ${retries}/${this.config.maxRetries})`
          );

          await this.sleep(backoffTime);
          continue;
        }

        // Non-rate-limit error or max retries reached
        console.error(`[RATE_LIMITER] Failed: ${operationName}`, error.message);
        return {
          success: false,
          retries,
          totalWaitTime,
          error: error.message
        };
      }
    }

    return {
      success: false,
      retries,
      totalWaitTime,
      error: 'Max retries exceeded'
    };
  }

  /**
   * Get current statistics
   */
  getStats(): {
    requestCount: number;
    failureCount: number;
    lastRequestTime: string;
    timeSinceLastRequest: number;
  } {
    return {
      requestCount: this.requestCount,
      failureCount: this.failureCount,
      lastRequestTime: new Date(this.lastRequestTime).toISOString(),
      timeSinceLastRequest: Date.now() - this.lastRequestTime
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RateLimitConfig>): void {
    this.config = { ...this.config, ...config };
    console.log('[RATE_LIMITER] Config updated:', this.config);
  }

  /**
   * Reset statistics
   */
  reset(): void {
    this.requestCount = 0;
    this.failureCount = 0;
    this.lastRequestTime = 0;
    console.log('[RATE_LIMITER] Statistics reset');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

/** For neuro-sync-kernel / autonomous-engine: wait before next request */
export async function waitForRateLimit(): Promise<void> {
  await rateLimiter.waitForNextRequest();
}

/** Whether another retry is allowed (always true; actual limit is in executeWithRetry) */
export function canRetry(): boolean {
  return true;
}

/** No-op: success handled inside executeWithRetry */
export function handleSuccessfulRequest(): void {
  // rateLimiter tracks success internally
}

/** Return delay ms on rate limit; neuro-sync uses this for backoff */
export function handleRateLimitError(): number {
  return 60000; // 1 minute
}

/** Status for autonomous-engine dashboard */
export function getRateLimitStatus(): {
  requestCount: number;
  failureCount: number;
  lastRequestTime: string;
  timeSinceLastRequest: number;
} {
  return rateLimiter.getStats();
}
