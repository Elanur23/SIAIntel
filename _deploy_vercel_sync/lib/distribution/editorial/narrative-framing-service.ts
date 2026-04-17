/**
 * Narrative Framing Service
 * Phase 3A.7 Step 2: Intelligent narrative angle selection
 * 
 * Determines the best narrative angle for content based on:
 * - Locale (country-specific behavioral patterns)
 * - Platform (audience expectations)
 * - Category (content type)
 * 
 * Provides context-aware framing that resonates with target audience
 * while maintaining editorial integrity.
 */

import type { Language, Platform } from '@/lib/distribution/types'
import type { TrendCategory } from '@/lib/distribution/trends/trend-types'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Available narrative angles
 */
export type NarrativeAngle =
  | 'market_reaction'        // Focus on market response and price action
  | 'why_it_matters_now'     // Urgency and current relevance
  | 'policy_impact'          // Regulatory and policy implications
  | 'hidden_implication'     // Deeper analysis and non-obvious effects
  | 'investor_attention'     // What investors should watch
  | 'institutional_significance' // Institutional perspective
  | 'technical_analysis'     // Technical and data-driven view
  | 'global_context'         // International implications
  | 'risk_assessment'        // Risk and opportunity analysis
  | 'expert_perspective'     // Authority and expertise angle

/**
 * Narrative framing context
 */
export interface NarrativeContext {
  // Content
  title: string
  summary: string
  body: string
  category: TrendCategory
  
  // Target
  locale: Language
  platform: Platform
  
  // Optional metadata
  hasMarketData?: boolean
  hasPolicyContent?: boolean
  hasExpertQuotes?: boolean
  sentiment?: 'positive' | 'negative' | 'neutral'
}

/**
 * Narrative framing result
 */
export interface NarrativeFramingResult {
  // Selected angle
  selectedAngle: NarrativeAngle
  confidence: number // 0-100
  
  // Framing guidance
  framingGuidance: string
  keyPoints: string[]
  toneGuidance: string
  
  // Alternative angles
  alternativeAngles: Array<{
    angle: NarrativeAngle
    score: number
    reasoning: string
  }>
  
  // Reasoning
  reasoning: string[]
  
  // Metadata
  evaluatedAt: Date
  context: NarrativeContext
}

/**
 * Locale behavioral profile
 */
interface LocaleBehavior {
  preferredAngles: NarrativeAngle[]
  avoidAngles: NarrativeAngle[]
  culturalNotes: string[]
  tonePreference: 'formal' | 'balanced' | 'casual'
  riskTolerance: 'conservative' | 'moderate' | 'aggressive'
}

// ============================================================================
// MAIN FRAMING FUNCTION
// ============================================================================

/**
 * Determine optimal narrative angle for content
 */
export function selectNarrativeAngle(
  context: NarrativeContext
): NarrativeFramingResult {
  console.log('[NARRATIVE_FRAMING] Selecting angle for', context.locale, context.platform, context.category)
  
  // Get locale behavioral profile
  const localeBehavior = getLocaleBehavior(context.locale)
  
  // Score all possible angles
  const angleScores = scoreNarrativeAngles(context, localeBehavior)
  
  // Select best angle
  const selectedAngle = angleScores[0].angle
  const confidence = angleScores[0].score
  
  // Generate framing guidance
  const framingGuidance = generateFramingGuidance(selectedAngle, context)
  const keyPoints = generateKeyPoints(selectedAngle, context)
  const toneGuidance = generateToneGuidance(selectedAngle, context, localeBehavior)
  
  // Get alternative angles
  const alternativeAngles = angleScores.slice(1, 4).map(score => ({
    angle: score.angle,
    score: score.score,
    reasoning: score.reasoning
  }))
  
  // Generate reasoning
  const reasoning = generateReasoning(selectedAngle, context, localeBehavior, angleScores[0])
  
  return {
    selectedAngle,
    confidence,
    framingGuidance,
    keyPoints,
    toneGuidance,
    alternativeAngles,
    reasoning,
    evaluatedAt: new Date(),
    context
  }
}

// ============================================================================
// ANGLE SCORING
// ============================================================================

/**
 * Score all narrative angles for given context
 */
function scoreNarrativeAngles(
  context: NarrativeContext,
  localeBehavior: LocaleBehavior
): Array<{ angle: NarrativeAngle; score: number; reasoning: string }> {
  const angles: NarrativeAngle[] = [
    'market_reaction',
    'why_it_matters_now',
    'policy_impact',
    'hidden_implication',
    'investor_attention',
    'institutional_significance',
    'technical_analysis',
    'global_context',
    'risk_assessment',
    'expert_perspective'
  ]
  
  const scores = angles.map(angle => {
    let score = 50 // Base score
    const reasons: string[] = []
    
    // Locale preference
    if (localeBehavior.preferredAngles.includes(angle)) {
      score += 20
      reasons.push('Preferred by locale')
    }
    if (localeBehavior.avoidAngles.includes(angle)) {
      score -= 30
      reasons.push('Avoided by locale')
    }
    
    // Platform fit
    const platformScore = scorePlatformFit(angle, context.platform)
    score += platformScore
    if (platformScore > 0) reasons.push('Good platform fit')
    
    // Category fit
    const categoryScore = scoreCategoryFit(angle, context.category)
    score += categoryScore
    if (categoryScore > 0) reasons.push('Strong category alignment')
    
    // Content analysis
    const contentScore = scoreContentFit(angle, context)
    score += contentScore
    if (contentScore > 0) reasons.push('Content supports this angle')
    
    // Sentiment alignment
    if (context.sentiment) {
      const sentimentScore = scoreSentimentFit(angle, context.sentiment)
      score += sentimentScore
    }
    
    return {
      angle,
      score: Math.max(0, Math.min(100, score)),
      reasoning: reasons.join('; ')
    }
  })
  
  return scores.sort((a, b) => b.score - a.score)
}

/**
 * Score platform fit for angle
 */
function scorePlatformFit(angle: NarrativeAngle, platform: Platform): number {
  const platformPreferences: Record<Platform, NarrativeAngle[]> = {
    x: ['market_reaction', 'why_it_matters_now', 'investor_attention'],
    linkedin: ['institutional_significance', 'expert_perspective', 'policy_impact'],
    telegram: ['technical_analysis', 'hidden_implication', 'risk_assessment'],
    facebook: ['why_it_matters_now', 'global_context', 'market_reaction'],
    discord: ['technical_analysis', 'hidden_implication', 'investor_attention'],
    instagram: ['why_it_matters_now', 'market_reaction', 'global_context'],
    tiktok: ['why_it_matters_now', 'market_reaction', 'hidden_implication']
  }
  
  return platformPreferences[platform]?.includes(angle) ? 15 : 0
}

/**
 * Score category fit for angle
 */
function scoreCategoryFit(angle: NarrativeAngle, category: TrendCategory): number {
  const categoryPreferences: Record<TrendCategory, NarrativeAngle[]> = {
    crypto: ['market_reaction', 'technical_analysis', 'investor_attention', 'hidden_implication'],
    economy: ['policy_impact', 'global_context', 'expert_perspective', 'why_it_matters_now'],
    finance: ['institutional_significance', 'market_reaction', 'risk_assessment', 'investor_attention'],
    ai: ['hidden_implication', 'expert_perspective', 'policy_impact', 'why_it_matters_now'],
    technology: ['hidden_implication', 'expert_perspective', 'why_it_matters_now'],
    markets: ['market_reaction', 'technical_analysis', 'investor_attention', 'risk_assessment'],
    breaking: ['why_it_matters_now', 'market_reaction', 'global_context'],
    general: ['why_it_matters_now', 'global_context', 'expert_perspective']
  }
  
  return categoryPreferences[category]?.includes(angle) ? 20 : 0
}

/**
 * Score content fit for angle
 */
function scoreContentFit(angle: NarrativeAngle, context: NarrativeContext): number {
  const contentLower = (context.title + ' ' + context.summary + ' ' + context.body).toLowerCase()
  let score = 0
  
  switch (angle) {
    case 'market_reaction':
      if (context.hasMarketData) score += 15
      if (contentLower.includes('price') || contentLower.includes('market') || contentLower.includes('trading')) score += 10
      break
      
    case 'policy_impact':
      if (context.hasPolicyContent) score += 15
      if (contentLower.includes('regulation') || contentLower.includes('policy') || contentLower.includes('government')) score += 10
      break
      
    case 'expert_perspective':
      if (context.hasExpertQuotes) score += 15
      if (contentLower.includes('expert') || contentLower.includes('analyst') || contentLower.includes('according to')) score += 10
      break
      
    case 'institutional_significance':
      if (contentLower.includes('institutional') || contentLower.includes('fund') || contentLower.includes('bank')) score += 15
      break
      
    case 'technical_analysis':
      if (contentLower.includes('data') || contentLower.includes('analysis') || contentLower.includes('metric')) score += 10
      break
      
    case 'hidden_implication':
      if (contentLower.includes('however') || contentLower.includes('but') || contentLower.includes('underlying')) score += 10
      break
      
    case 'risk_assessment':
      if (contentLower.includes('risk') || contentLower.includes('warning') || contentLower.includes('caution')) score += 15
      break
      
    case 'global_context':
      if (contentLower.includes('global') || contentLower.includes('international') || contentLower.includes('worldwide')) score += 10
      break
  }
  
  return score
}

/**
 * Score sentiment fit for angle
 */
function scoreSentimentFit(angle: NarrativeAngle, sentiment: 'positive' | 'negative' | 'neutral'): number {
  if (sentiment === 'negative' && (angle === 'risk_assessment' || angle === 'hidden_implication')) {
    return 10
  }
  if (sentiment === 'positive' && (angle === 'market_reaction' || angle === 'investor_attention')) {
    return 10
  }
  return 0
}

// ============================================================================
// LOCALE BEHAVIOR PROFILES
// ============================================================================

/**
 * Get behavioral profile for locale
 */
function getLocaleBehavior(locale: Language): LocaleBehavior {
  const profiles: Record<Language, LocaleBehavior> = {
    en: {
      preferredAngles: ['market_reaction', 'investor_attention', 'institutional_significance'],
      avoidAngles: [],
      culturalNotes: ['Direct communication', 'Data-driven', 'Action-oriented'],
      tonePreference: 'balanced',
      riskTolerance: 'moderate'
    },
    tr: {
      preferredAngles: ['why_it_matters_now', 'policy_impact', 'global_context'],
      avoidAngles: [],
      culturalNotes: ['Context-aware', 'Policy-sensitive', 'Regional focus'],
      tonePreference: 'formal',
      riskTolerance: 'conservative'
    },
    de: {
      preferredAngles: ['technical_analysis', 'expert_perspective', 'risk_assessment'],
      avoidAngles: ['market_reaction'],
      culturalNotes: ['Precision-focused', 'Risk-aware', 'Detail-oriented'],
      tonePreference: 'formal',
      riskTolerance: 'conservative'
    },
    fr: {
      preferredAngles: ['policy_impact', 'expert_perspective', 'global_context'],
      avoidAngles: [],
      culturalNotes: ['Intellectual approach', 'Policy-focused', 'Analytical'],
      tonePreference: 'formal',
      riskTolerance: 'moderate'
    },
    es: {
      preferredAngles: ['why_it_matters_now', 'global_context', 'market_reaction'],
      avoidAngles: [],
      culturalNotes: ['Accessible communication', 'Regional awareness', 'Practical focus'],
      tonePreference: 'balanced',
      riskTolerance: 'moderate'
    },
    ru: {
      preferredAngles: ['policy_impact', 'global_context', 'hidden_implication'],
      avoidAngles: [],
      culturalNotes: ['Geopolitical awareness', 'Strategic thinking', 'Context-heavy'],
      tonePreference: 'formal',
      riskTolerance: 'aggressive'
    },
    ar: {
      preferredAngles: ['policy_impact', 'institutional_significance', 'global_context'],
      avoidAngles: [],
      culturalNotes: ['Formal communication', 'Authority-focused', 'Regional context'],
      tonePreference: 'formal',
      riskTolerance: 'conservative'
    },
    jp: {
      preferredAngles: ['technical_analysis', 'expert_perspective', 'risk_assessment'],
      avoidAngles: ['hidden_implication'],
      culturalNotes: ['Precision-valued', 'Consensus-oriented', 'Risk-conscious'],
      tonePreference: 'formal',
      riskTolerance: 'conservative'
    },
    zh: {
      preferredAngles: ['policy_impact', 'institutional_significance', 'global_context'],
      avoidAngles: [],
      culturalNotes: ['Policy-sensitive', 'Long-term focus', 'Strategic perspective'],
      tonePreference: 'formal',
      riskTolerance: 'moderate'
    }
  }
  
  return profiles[locale] || profiles.en
}

// ============================================================================
// GUIDANCE GENERATION
// ============================================================================

/**
 * Generate framing guidance for selected angle
 */
function generateFramingGuidance(angle: NarrativeAngle, context: NarrativeContext): string {
  const guidance: Record<NarrativeAngle, string> = {
    market_reaction: 'Frame content around market response, price movements, and trading activity. Lead with quantifiable market data.',
    why_it_matters_now: 'Emphasize urgency and current relevance. Explain immediate implications and why readers should care right now.',
    policy_impact: 'Focus on regulatory implications, policy changes, and institutional responses. Highlight governance aspects.',
    hidden_implication: 'Reveal non-obvious consequences and deeper analysis. Go beyond surface-level reporting.',
    investor_attention: 'Frame from investor perspective. Highlight actionable insights and what to watch.',
    institutional_significance: 'Emphasize institutional perspective, large-scale implications, and professional investor viewpoint.',
    technical_analysis: 'Lead with data, metrics, and analytical insights. Use quantitative framing.',
    global_context: 'Position within international landscape. Highlight cross-border implications.',
    risk_assessment: 'Frame around risk factors, potential downsides, and cautionary elements.',
    expert_perspective: 'Lead with authority and expertise. Emphasize credible sources and professional analysis.'
  }
  
  return guidance[angle]
}

/**
 * Generate key points for angle
 */
function generateKeyPoints(angle: NarrativeAngle, context: NarrativeContext): string[] {
  const basePoints: Record<NarrativeAngle, string[]> = {
    market_reaction: [
      'Lead with price/market data',
      'Include trading volumes if available',
      'Mention market sentiment',
      'Reference key price levels'
    ],
    why_it_matters_now: [
      'Establish immediate relevance',
      'Explain current timing',
      'Connect to reader interests',
      'Highlight urgency factors'
    ],
    policy_impact: [
      'Identify regulatory implications',
      'Mention policy stakeholders',
      'Explain compliance aspects',
      'Reference institutional response'
    ],
    hidden_implication: [
      'Reveal non-obvious effects',
      'Provide deeper analysis',
      'Challenge surface assumptions',
      'Connect unexpected dots'
    ],
    investor_attention: [
      'Highlight actionable insights',
      'Identify key metrics to watch',
      'Mention risk/opportunity balance',
      'Provide investor perspective'
    ],
    institutional_significance: [
      'Emphasize large-scale impact',
      'Reference institutional players',
      'Highlight professional implications',
      'Mention systemic effects'
    ],
    technical_analysis: [
      'Lead with data points',
      'Include specific metrics',
      'Reference analytical frameworks',
      'Provide quantitative context'
    ],
    global_context: [
      'Position internationally',
      'Mention cross-border effects',
      'Reference global trends',
      'Highlight regional variations'
    ],
    risk_assessment: [
      'Identify key risk factors',
      'Mention potential downsides',
      'Provide balanced perspective',
      'Include cautionary elements'
    ],
    expert_perspective: [
      'Lead with expert insights',
      'Reference credible sources',
      'Emphasize professional analysis',
      'Highlight authoritative viewpoints'
    ]
  }
  
  return basePoints[angle]
}

/**
 * Generate tone guidance
 */
function generateToneGuidance(
  angle: NarrativeAngle,
  context: NarrativeContext,
  localeBehavior: LocaleBehavior
): string {
  const baseTone = localeBehavior.tonePreference
  const platform = context.platform
  
  let guidance = `Maintain ${baseTone} tone. `
  
  // Platform-specific adjustments
  if (platform === 'x') {
    guidance += 'Keep sharp and concise. '
  } else if (platform === 'linkedin') {
    guidance += 'Use professional business language. '
  } else if (platform === 'telegram') {
    guidance += 'Be informative and direct. '
  }
  
  // Angle-specific tone
  if (angle === 'risk_assessment') {
    guidance += 'Use cautious, balanced language. '
  } else if (angle === 'market_reaction') {
    guidance += 'Be factual and data-driven. '
  } else if (angle === 'expert_perspective') {
    guidance += 'Emphasize authority and credibility. '
  }
  
  return guidance.trim()
}

/**
 * Generate reasoning for angle selection
 */
function generateReasoning(
  angle: NarrativeAngle,
  context: NarrativeContext,
  localeBehavior: LocaleBehavior,
  topScore: { angle: NarrativeAngle; score: number; reasoning: string }
): string[] {
  const reasoning: string[] = []
  
  reasoning.push(`Selected "${angle}" angle with ${topScore.score}% confidence`)
  reasoning.push(`Locale (${context.locale}) preference: ${localeBehavior.tonePreference} tone, ${localeBehavior.riskTolerance} risk tolerance`)
  reasoning.push(`Platform (${context.platform}) alignment: ${topScore.reasoning}`)
  reasoning.push(`Category (${context.category}) fit: Strong alignment with content type`)
  
  if (localeBehavior.preferredAngles.includes(angle)) {
    reasoning.push(`This angle is culturally preferred for ${context.locale} audience`)
  }
  
  return reasoning
}
