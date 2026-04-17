import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface TrendingAsset {
  symbol: string
  name: string
  price: number
  change24h: number
  volume: number
  sentiment: 'bullish' | 'bearish' | 'neutral'
  heatScore: number
}

// Simulated real-time price fluctuations
const baseAssets = [
  { symbol: 'BTC', name: 'Bitcoin', basePrice: 68200, volatility: 0.02 },
  { symbol: 'NVDA', name: 'NVIDIA', basePrice: 924, volatility: 0.015 },
  { symbol: 'ETH', name: 'Ethereum', basePrice: 3580, volatility: 0.025 },
  { symbol: 'OIL', name: 'Brent Crude', basePrice: 89.4, volatility: 0.01 },
  { symbol: 'SOL', name: 'Solana', basePrice: 156, volatility: 0.03 },
  { symbol: 'TSLA', name: 'Tesla', basePrice: 268, volatility: 0.02 },
  { symbol: 'GOLD', name: 'Gold', basePrice: 2142, volatility: 0.005 },
  { symbol: 'MSFT', name: 'Microsoft', basePrice: 428, volatility: 0.012 },
  { symbol: 'AAPL', name: 'Apple', basePrice: 182, volatility: 0.01 },
  { symbol: 'META', name: 'Meta', basePrice: 512, volatility: 0.018 },
  { symbol: 'XRP', name: 'Ripple', basePrice: 0.64, volatility: 0.04 },
  { symbol: 'GOOGL', name: 'Google', basePrice: 148, volatility: 0.011 }
]

function generateRealtimePrice(basePrice: number, volatility: number): number {
  const fluctuation = (Math.random() - 0.5) * 2 * volatility
  return basePrice * (1 + fluctuation)
}

function calculateHeatScore(change24h: number, volume: number): number {
  const changeScore = Math.abs(change24h) * 5
  const volumeScore = Math.min(volume / 1000000000, 50)
  const momentum = change24h > 0 ? 10 : -5
  return Math.min(Math.max(changeScore + volumeScore + momentum, 0), 100)
}

export async function GET(request: NextRequest) {
  try {
    const trendingAssets: TrendingAsset[] = baseAssets.map(asset => {
      const currentPrice = generateRealtimePrice(asset.basePrice, asset.volatility)
      const change24h = ((currentPrice - asset.basePrice) / asset.basePrice) * 100
      const volume = Math.floor(Math.random() * 50000000000 + 10000000000)
      const heatScore = calculateHeatScore(change24h, volume)
      
      let sentiment: 'bullish' | 'bearish' | 'neutral' = 'neutral'
      if (change24h > 2) sentiment = 'bullish'
      else if (change24h < -2) sentiment = 'bearish'

      return {
        symbol: asset.symbol,
        name: asset.name,
        price: Math.round(currentPrice * 100) / 100,
        change24h: Math.round(change24h * 100) / 100,
        volume,
        sentiment,
        heatScore: Math.round(heatScore)
      }
    })

    // Sort by heat score
    trendingAssets.sort((a, b) => b.heatScore - a.heatScore)

    return NextResponse.json({
      success: true,
      data: trendingAssets,
      timestamp: new Date().toISOString(),
      count: trendingAssets.length,
      metadata: {
        updateFrequency: '10s',
        source: 'SIA_SENTINEL_MARKET_FEED'
      }
    })

  } catch (error) {
    console.error('Market data fetch error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch market data',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}
