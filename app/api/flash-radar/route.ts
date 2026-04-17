/**
 * /api/flash-radar
 *
 * Server-side cache: 5 minutes for live Groq data, 2 minutes for mock.
 * A manual ?refresh=1 query param bypasses the cache (used by the Refresh button).
 */

import { NextRequest, NextResponse } from 'next/server'
import { runFlashRadarScan, generateMockSignals, isRadarCoolingDown, getRadarCooldownMessage } from '../../../lib/ai/flash-radar'

const LIVE_CACHE_MS  = 5 * 60 * 1000  // 5 min when Groq responds
const MOCK_CACHE_MS  = 2 * 60 * 1000  // 2 min for mock / cooldown data

interface CacheEntry {
  signals: ReturnType<typeof generateMockSignals>
  ts: number
  isMock: boolean
}

let cache: CacheEntry | null = null

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  const forceRefresh = request.nextUrl.searchParams.get('refresh') === '1'
  const ttl = cache?.isMock ? MOCK_CACHE_MS : LIVE_CACHE_MS

  // Serve from cache unless caller requested a refresh
  if (!forceRefresh && cache && Date.now() - cache.ts < ttl) {
    return NextResponse.json({
      success: true,
      data: { signals: cache.signals, scanTime: new Date(cache.ts).toISOString(), count: cache.signals.length },
      cached: true,
      coolingDown: isRadarCoolingDown(),
      cooldownMessage: getRadarCooldownMessage(),
      metadata: { timestamp: new Date().toISOString() },
    })
  }

  try {
    const signals = await runFlashRadarScan()
    const isMock = signals.some(s => s.isMock)

    cache = { signals, ts: Date.now(), isMock }

    return NextResponse.json({
      success: true,
      data: { signals, scanTime: new Date().toISOString(), count: signals.length },
      cached: false,
      coolingDown: isRadarCoolingDown(),
      cooldownMessage: getRadarCooldownMessage(),
      metadata: { timestamp: new Date().toISOString() },
    })
  } catch (error) {
    console.error('[FlashRadar API]', error)
    const signals = generateMockSignals()
    return NextResponse.json({
      success: true,
      data: { signals, scanTime: new Date().toISOString(), count: signals.length },
      cached: false,
      coolingDown: true,
      cooldownMessage: 'Sistem dinlendiriliyor – lütfen biraz bekleyin.',
      metadata: { timestamp: new Date().toISOString() },
    })
  }
}
