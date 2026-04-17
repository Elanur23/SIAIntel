import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface BreakingNews {
  id: string
  title: string
  slug: string
  category: 'CRYPTO' | 'AI' | 'MACRO' | 'MARKETS'
  confidence: number
  timestamp: string
}

export async function GET(request: NextRequest) {
  try {
    // In production, fetch from real-time news aggregator
    // For now, return dynamic mock data
    const breakingNews: BreakingNews[] = [
      {
        id: `bn-${Date.now()}-1`,
        title: `BTC ${Math.random() > 0.5 ? '+' : '-'}${(Math.random() * 3).toFixed(1)}% - Whale activity detected at $${(68000 + Math.random() * 2000).toFixed(0)}`,
        slug: 'btc-whale-activity',
        category: 'CRYPTO',
        confidence: Math.floor(88 + Math.random() * 10),
        timestamp: new Date().toISOString()
      },
      {
        id: `bn-${Date.now()}-2`,
        title: 'FED SIGNAL: Powell speech impacts rate expectations - Markets volatile',
        slug: 'fed-powell-speech',
        category: 'MACRO',
        confidence: Math.floor(85 + Math.random() * 10),
        timestamp: new Date().toISOString()
      },
      {
        id: `bn-${Date.now()}-3`,
        title: `AI CHIP WAR: NVDA ${Math.random() > 0.5 ? 'secures' : 'announces'} major deal - Geopolitical implications`,
        slug: 'nvda-chip-deal',
        category: 'AI',
        confidence: Math.floor(87 + Math.random() * 10),
        timestamp: new Date().toISOString()
      },
      {
        id: `bn-${Date.now()}-4`,
        title: `OIL SPIKE: Brent crude ${Math.random() > 0.5 ? 'jumps' : 'surges'} ${(Math.random() * 5).toFixed(1)}% - OPEC+ decision impact`,
        slug: 'oil-opec-decision',
        category: 'MARKETS',
        confidence: Math.floor(84 + Math.random() * 10),
        timestamp: new Date().toISOString()
      },
      {
        id: `bn-${Date.now()}-5`,
        title: `ETH staking surge: $${(Math.random() * 3 + 1).toFixed(1)}B locked in 24h - DeFi momentum builds`,
        slug: 'eth-staking-surge',
        category: 'CRYPTO',
        confidence: Math.floor(89 + Math.random() * 8),
        timestamp: new Date().toISOString()
      },
      {
        id: `bn-${Date.now()}-6`,
        title: `BREAKING: China GDP ${Math.random() > 0.5 ? 'beats' : 'meets'} estimates at ${(5.5 + Math.random() * 0.5).toFixed(1)}% - Yuan reacts`,
        slug: 'china-gdp-report',
        category: 'MACRO',
        confidence: Math.floor(86 + Math.random() * 10),
        timestamp: new Date().toISOString()
      }
    ]

    return NextResponse.json({
      success: true,
      data: breakingNews,
      timestamp: new Date().toISOString(),
      count: breakingNews.length
    })

  } catch (error) {
    console.error('Breaking news fetch error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch breaking news',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
