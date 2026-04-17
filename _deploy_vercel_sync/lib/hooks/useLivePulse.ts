import { useState, useEffect, useRef } from 'react'

interface IntelligenceItem {
  id: string
  time: string
  title: string
  region: string
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  impact: number
  source?: string
  confidence?: number
  market_impact?: number
  executive_summary?: string
  sovereign_insight?: string
  risk_assessment?: string
}

interface UseLivePulseReturn {
  intelligence: IntelligenceItem[]
  isConnected: boolean
  lastUpdate: Date | null
  newItemId: string | null
}

/**
 * THE LIVE PULSE - Real-time streaming intelligence hook
 * 
 * Uses Server-Sent Events (SSE) to receive intelligence one-by-one
 * with 5-15 second random delays, creating authentic live feed experience.
 * 
 * Features:
 * - Real-time streaming (no polling)
 * - Automatic reconnection on disconnect
 * - Real-time timestamp updates
 * - New item flash detection
 */
export default function useLivePulse(): UseLivePulseReturn {
  const [intelligence, setIntelligence] = useState<IntelligenceItem[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [newItemId, setNewItemId] = useState<string | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const connectStream = () => {
      try {
        console.log('[LIVE-PULSE] 🎯 Connecting to stream...')
        
        // Create EventSource connection
        const eventSource = new EventSource('http://localhost:8000/api/intelligence/stream')
        eventSourceRef.current = eventSource

        eventSource.onopen = () => {
          console.log('[LIVE-PULSE] ✅ Stream connected')
          setIsConnected(true)
        }

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            
            // Handle heartbeat
            if (data.type === 'heartbeat') {
              console.log('[LIVE-PULSE] 💓 Heartbeat received')
              return
            }
            
            // Handle error
            if (data.type === 'error') {
              console.error('[LIVE-PULSE] ❌ Stream error:', data.message)
              return
            }
            
            // New intelligence item
            console.log('[LIVE-PULSE] 📡 New intelligence:', data.title?.substring(0, 50))
            
            // Add to intelligence list
            setIntelligence(prev => [...prev, data])
            setLastUpdate(new Date())
            
            // Trigger flash effect
            setNewItemId(data.id)
            setTimeout(() => setNewItemId(null), 2000) // Clear after 2s
            
          } catch (err) {
            console.error('[LIVE-PULSE] ❌ Parse error:', err)
          }
        }

        eventSource.onerror = (error) => {
          console.error('[LIVE-PULSE] ❌ Connection error:', error)
          setIsConnected(false)
          
          // Close current connection
          eventSource.close()
          
          // Attempt reconnection after 5 seconds
          console.log('[LIVE-PULSE] 🔄 Reconnecting in 5s...')
          reconnectTimeoutRef.current = setTimeout(() => {
            connectStream()
          }, 5000)
        }

      } catch (err) {
        console.error('[LIVE-PULSE] ❌ Connection failed:', err)
        setIsConnected(false)
      }
    }

    // Initial connection
    connectStream()

    // Cleanup
    return () => {
      console.log('[LIVE-PULSE] 🔌 Disconnecting stream...')
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
    }
  }, [])

  return {
    intelligence,
    isConnected,
    lastUpdate,
    newItemId
  }
}
