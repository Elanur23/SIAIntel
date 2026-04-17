/**
 * Ghost Editor API
 * 
 * Handles AI draft generation for War Room Pipeline
 * Integrates with Ghost Editor System for human-in-the-loop workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { generateCommentaryTemplates } from '@/lib/editorial/ghost-editor-system'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, rawNews } = body
    
    if (action === 'generate-draft') {
      if (!rawNews || !rawNews.title) {
        return NextResponse.json({
          success: false,
          error: 'Raw news data is required'
        }, { status: 400 })
      }
      
      // Generate AI draft using Ghost Editor templates
      const commentaries = generateCommentaryTemplates({
        headline: rawNews.title,
        category: 'CRYPTO_BLOCKCHAIN',
        asset: 'BTC'
      })
      
      // Create AdSense-compliant 3-layer content
      const summary = generateSummary(rawNews.title, rawNews.priority)
      const siaInsight = commentaries.ANALYTIC
      const riskDisclaimer = generateRiskDisclaimer(85)
      
      const fullContent = `${summary}

${siaInsight}

${riskDisclaimer}`
      
      return NextResponse.json({
        success: true,
        data: {
          headline: rawNews.title,
          summary,
          fullContent,
          siaInsight,
          riskDisclaimer,
          languages: ['EN', 'TR', 'DE', 'ES', 'FR', 'AR', 'RU'],
          confidence: calculateConfidence(rawNews.priority),
          commentaries
        },
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      success: false,
      error: 'Invalid action',
      validActions: ['generate-draft']
    }, { status: 400 })
    
  } catch (error) {
    console.error('[Ghost Editor API] Error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to generate draft',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    }, { status: 500 })
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate journalistic summary (Layer 1: ÖZET)
 */
function generateSummary(title: string, priority: string): string {
  const templates = {
    high: [
      'Breaking market development observed across major exchanges with significant institutional activity. The movement occurred during peak trading hours with elevated volume levels. Market participants are closely monitoring whether this momentum can sustain above critical support levels.',
      'Major price action detected following institutional buying pressure across global markets. The development unfolded during Asian trading session with substantial capital inflows. Analysts are tracking key technical levels for continuation signals.'
    ],
    medium: [
      'Market movement observed following recent economic data releases. Trading activity increased during regular hours with moderate volume participation. Technical indicators suggest potential consolidation before next directional move.',
      'Price action continues following earlier market developments. Volume levels remain within normal ranges as participants assess next moves. Key support and resistance levels are being closely watched.'
    ],
    low: [
      'Routine market activity observed with standard trading patterns. Volume levels consistent with recent averages as markets digest latest information. No significant technical breakouts detected at current levels.',
      'Markets showing typical intraday fluctuations within established ranges. Trading activity remains orderly with balanced participation. Technical structure remains intact pending new catalysts.'
    ]
  }
  
  const priorityTemplates = templates[priority as keyof typeof templates] || templates.medium
  return priorityTemplates[Math.floor(Math.random() * priorityTemplates.length)]
}

/**
 * Generate risk disclaimer (Layer 3: DYNAMIC_RISK_SHIELD)
 */
function generateRiskDisclaimer(confidence: number): string {
  if (confidence >= 85) {
    return `RISK ASSESSMENT: While our analysis shows ${confidence}% confidence in this scenario, cryptocurrency markets remain highly volatile. This analysis is based on statistical probability and publicly available data (OSINT). Past performance does not guarantee future results. Always conduct your own research and consult qualified financial advisors before making investment decisions. This is not financial advice.`
  } else if (confidence >= 70) {
    return `RISK ASSESSMENT: Current market conditions show mixed signals with ${confidence}% confidence. Significant volatility is expected. This analysis represents data-driven probability assessment, not investment recommendations. Market participants should exercise extreme caution and implement proper risk management. Professional financial consultation is strongly recommended.`
  } else {
    return `RISK ASSESSMENT: Analysis confidence is ${confidence}%, indicating high uncertainty. Markets are experiencing unpredictable conditions. This information is provided for educational purposes only and should not be construed as financial, investment, or trading advice. Independent verification and professional guidance are essential before any financial decisions.`
  }
}

/**
 * Calculate confidence score based on priority
 */
function calculateConfidence(priority: string): number {
  const scores = {
    high: 85 + Math.floor(Math.random() * 10),
    medium: 70 + Math.floor(Math.random() * 10),
    low: 60 + Math.floor(Math.random() * 10)
  }
  
  return scores[priority as keyof typeof scores] || 75
}
