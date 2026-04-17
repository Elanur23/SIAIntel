/**
 * Gemini 1.5 Pro Provider
 * Phase 3A: Real Gemini AI integration
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import { BaseAIProvider, type AIProviderConfig, type AIGenerationRequest, type AIGenerationResponse } from './base-provider'

export class GeminiProvider extends BaseAIProvider {
  private client: GoogleGenerativeAI | null = null
  
  constructor(config: AIProviderConfig) {
    super(config)
    
    if (config.apiKey) {
      this.client = new GoogleGenerativeAI(config.apiKey)
    }
  }
  
  async generate(request: AIGenerationRequest): Promise<AIGenerationResponse> {
    if (!this.client) {
      return {
        success: false,
        content: '',
        error: 'Gemini client not initialized. Check API key.',
        provider: 'gemini',
        model: this.config.model
      }
    }
    
    try {
      const model = this.client.getGenerativeModel({
        model: this.config.model,
        generationConfig: {
          temperature: request.temperature ?? this.config.temperature,
          maxOutputTokens: request.maxTokens ?? this.config.maxTokens,
          topP: this.config.topP ?? 0.8
        }
      })
      
      // Combine system and user prompts
      const fullPrompt = `${request.systemPrompt}\n\n${request.userPrompt}`
      
      const result = await model.generateContent(fullPrompt)
      const response = result.response
      const text = response.text()
      
      // Estimate tokens (Gemini doesn't provide exact counts in response)
      const inputTokens = this.estimateTokens(fullPrompt)
      const outputTokens = this.estimateTokens(text)
      
      return {
        success: true,
        content: text,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens,
          total: inputTokens + outputTokens
        },
        cost: this.estimateCost(inputTokens, outputTokens),
        provider: 'gemini',
        model: this.config.model
      }
    } catch (error: any) {
      console.error('[GEMINI_PROVIDER] Generation error:', error)
      
      return {
        success: false,
        content: '',
        error: error.message || 'Gemini generation failed',
        provider: 'gemini',
        model: this.config.model
      }
    }
  }
  
  async validateConfig(): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = []
    
    if (!this.config.apiKey) {
      issues.push('API key is required')
    }
    
    if (!this.config.model) {
      issues.push('Model name is required')
    }
    
    if (this.config.temperature < 0 || this.config.temperature > 2) {
      issues.push('Temperature must be between 0 and 2')
    }
    
    if (this.config.maxTokens < 1 || this.config.maxTokens > 8192) {
      issues.push('Max tokens must be between 1 and 8192')
    }
    
    return {
      valid: issues.length === 0,
      issues
    }
  }
  
  async isAvailable(): Promise<boolean> {
    if (!this.client) return false
    
    try {
      // Test with a simple prompt
      const model = this.client.getGenerativeModel({ model: this.config.model })
      const result = await model.generateContent('test')
      return result.response.text().length > 0
    } catch (error) {
      console.error('[GEMINI_PROVIDER] Availability check failed:', error)
      return false
    }
  }
  
  getProviderName(): string {
    return 'gemini'
  }
  
  estimateCost(inputTokens: number, outputTokens: number): {
    input: number
    output: number
    total: number
    currency: string
  } {
    // Gemini 1.5 Pro pricing (as of 2024)
    // Input: $1.25 per 1M tokens
    // Output: $5.00 per 1M tokens
    const INPUT_COST_PER_1M = 1.25
    const OUTPUT_COST_PER_1M = 5.00
    
    const inputCost = (inputTokens / 1_000_000) * INPUT_COST_PER_1M
    const outputCost = (outputTokens / 1_000_000) * OUTPUT_COST_PER_1M
    
    return {
      input: inputCost,
      output: outputCost,
      total: inputCost + outputCost,
      currency: 'USD'
    }
  }
  
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }
}
