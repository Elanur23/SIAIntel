import { NextRequest, NextResponse } from 'next/server'
import WhaleAlertSentinel, { generateBreakingNewsArticle } from '@/lib/realtime/whale-alert-sentinel'
import { getPriorityQueue } from '@/lib/realtime/priority-queue'

// Singleton sentinel instance
let sentinelInstance: WhaleAlertSentinel | null = null

function getSentinel(): WhaleAlertSentinel {
  if (!sentinelInstance) {
    const apiKey = process.env.WHALE_ALERT_API_KEY
    sentinelInstance = new WhaleAlertSentinel(apiKey)
  }
  return sentinelInstance
}

/**
 * GET /api/whale-alert - Get monitoring status
 */
export async function GET(request: NextRequest) {
  try {
    const sentinel = getSentinel()
    const priorityQueue = getPriorityQueue()
    
    const status = {
      sentinel: sentinel.getStatus(),
      priorityQueue: priorityQueue.getStatus(),
      timestamp: new Date().toISOString()
    }
    
    return NextResponse.json({
      success: true,
      data: status
    })
  } catch (error) {
    console.error('[WhaleAlert API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/whale-alert - Start/stop monitoring or trigger test event
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, testEvent } = body
    
    const sentinel = getSentinel()
    const priorityQueue = getPriorityQueue()
    
    if (action === 'start') {
      // Start monitoring with event handler
      sentinel.startMonitoring(async (event) => {
        console.log(`[WhaleAlert] Critical event detected:`, event)
        
        // Generate breaking news article
        const article = await generateBreakingNewsArticle(event, 'en')
        
        // Add to priority queue
        await priorityQueue.addBreakingNews(article, event)
      })
      
      return NextResponse.json({
        success: true,
        message: 'Monitoring started',
        status: sentinel.getStatus()
      })
    }
    
    if (action === 'stop') {
      sentinel.stopMonitoring()
      
      return NextResponse.json({
        success: true,
        message: 'Monitoring stopped'
      })
    }
    
    if (action === 'test' && testEvent) {
      // Trigger test event
      const article = await generateBreakingNewsArticle(testEvent, 'en')
      const itemId = await priorityQueue.addBreakingNews(article, testEvent)
      
      return NextResponse.json({
        success: true,
        message: 'Test event triggered',
        itemId,
        article
      })
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('[WhaleAlert API] Error:', error)
    return NextResponse.json(
      { success: false, error: 'Operation failed' },
      { status: 500 }
    )
  }
}
