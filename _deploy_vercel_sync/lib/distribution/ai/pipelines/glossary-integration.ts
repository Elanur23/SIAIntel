/**
 * Glossary Integration Pipeline
 * Phase 3A: Terminology memory integration
 */

import { getGlossaryTerms, incrementGlossaryTermUsage } from '../../database'
import type { Language, GlossaryTerm } from '../../types'

export interface GlossaryIntegrationRequest {
  content: string
  language: Language
}

export interface GlossaryIntegrationResult {
  enhancedContent: string
  termsUsed: string[]
  termsApplied: number
}

/**
 * Apply glossary terms to content
 */
export async function applyGlossary(
  request: GlossaryIntegrationRequest
): Promise<GlossaryIntegrationResult> {
  const terms = await getGlossaryTerms({ language: request.language })
  
  let enhancedContent = request.content
  const termsUsed: string[] = []
  let termsApplied = 0
  
  for (const term of terms) {
    const translation = term.translations[request.language]
    
    if (!translation) continue
    
    // Check if term exists in content
    const regex = new RegExp(`\\b${term.term}\\b`, 'gi')
    const matches = enhancedContent.match(regex)
    
    if (matches && matches.length > 0) {
      // Replace with localized term
      enhancedContent = enhancedContent.replace(regex, translation)
      termsUsed.push(term.id)
      termsApplied += matches.length
      
      // Increment usage count
      await incrementGlossaryTermUsage(term.id)
    }
  }
  
  return {
    enhancedContent,
    termsUsed,
    termsApplied
  }
}

/**
 * Extract financial terms from content
 */
export function extractFinancialTerms(content: string): string[] {
  const commonTerms = [
    'bitcoin', 'ethereum', 'cryptocurrency', 'blockchain',
    'market', 'trading', 'exchange', 'wallet', 'token',
    'price', 'volume', 'liquidity', 'volatility',
    'bull', 'bear', 'rally', 'correction', 'resistance', 'support'
  ]
  
  const found: string[] = []
  
  for (const term of commonTerms) {
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    if (regex.test(content)) {
      found.push(term)
    }
  }
  
  return found
}
