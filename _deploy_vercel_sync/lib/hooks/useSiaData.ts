import { useState, useEffect } from 'react'

interface SiaIntelligence {
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

interface SiaLog {
  message: string
  type: 'success' | 'error' | 'info'
  timestamp: string
}

interface UseSiaDataReturn {
  intel: SiaIntelligence[]
  logs: SiaLog[]
  isConnected: boolean
  lastUpdate: Date | null
}

/**
 * SIA REGIONAL DATA HOOK
 * Fetches intelligence based on the user's active region node (lang)
 */
export default function useSiaData(lang: string = 'en'): UseSiaDataReturn {
  const [intel, setIntel] = useState<SiaIntelligence[]>([])
  const [logs, setLogs] = useState<SiaLog[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const fetchRegionalIntelligence = async () => {
      try {
        const backendUrl = (typeof window !== 'undefined' ? '' : (process.env.NEXT_PUBLIC_SIAINTEL_BACKEND_URL || ''))
        const endpoint = backendUrl
          ? `${backendUrl}/api/intelligence?region=${lang}`
          : `/api/siaintel/proxy?region=${lang}`
        const res = await fetch(endpoint, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })

        if (res.ok) {
          const data = await res.json()
          
          const transformedIntel = (data.news || data.articles || []).map((item: any, idx: number) => ({
            id: item.id || `intel-${idx}`,
            time: item.time || new Date().toLocaleTimeString(),
            title: item.title,
            region: item.region || lang.toUpperCase(),
            sentiment: item.sentiment || 'NEUTRAL',
            impact: item.market_impact || 5,
            source: item.source || 'SIA_NODE_' + lang.toUpperCase(),
            confidence: item.confidence || 90,
            executive_summary: item.executive_summary,
            sovereign_insight: item.sovereign_insight,
            risk_assessment: item.risk_assessment
          }))

          setIntel(transformedIntel)
          setIsConnected(true)
          setLastUpdate(new Date())
          setLogs(prev => [{
            message: `🛰️ REGIONAL_NODE_${lang.toUpperCase()}_SYNCED`,
            type: 'success' as const,
            timestamp: new Date().toISOString()
          }, ...prev].slice(0, 5))
        }
      } catch (err) {
        setIsConnected(false)
        setLogs(prev => [{
          message: `⚠ NODE_${lang.toUpperCase()}_CONNECTION_ERROR`,
          type: 'error' as const,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 5))
      }
    }

    fetchRegionalIntelligence()
    const interval = setInterval(fetchRegionalIntelligence, 10000)
    return () => clearInterval(interval)
  }, [lang])

  return { intel, logs, isConnected, lastUpdate }
}
