/**
 * Base AI Provider Interface
 * Phase 3A: Abstract provider for Gemini/OpenAI
 */

export interface AIProviderConfig {
  apiKey: string
  model: string
  temperature: number
  maxTokens: number
  topP?: number
}

export interface AIGenerationRequest {
  systemPrompt: string
  userPrompt: string
  temperature?: number
  maxTokens?: number
  responseFormat?: 'text' | 'json'
}

export interface AIGenerationResponse {
  success: boolean
  content: string
  tokensUsed?: {
    input: number
    output: number
    total: number
  }
  cost?: {
    input: number
    output: number
    total: number
  }
  error?: string
  provider: string
  model: string
}

/**
 * Abstract base provider
 * All AI providers must implement this interface
 */
export abstract class BaseAIProvider {
  protected config: AIProviderConfig
  
  constructor(config: AIProviderConfig) {
    this.config = config
  }
  
  /**
   * Generate content using the AI provider
   */
  abstract generate(request: AIGenerationRequest): Promise<AIGenerationResponse>
  
  /**
   * Validate provider configuration
   */
  abstract validateConfig(): Promise<{ valid: boolean; issues: string[] }>
  
  /**
   * Check if provider is available
   */
  abstract isAvailable(): Promise<boolean>
  
  /**
   * Get provider name
   */
  abstract getProviderName(): string
  
  /**
   * Get model name
   */
  getModelName(): string {
    return this.config.model
  }
  
  /**
   * Estimate cost for a request
   */
  abstract estimateCost(inputTokens: number, outputTokens: number): {
    input: number
    output: number
    total: number
    currency: string
  }
}
