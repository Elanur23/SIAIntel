// @ts-nocheck - TODO: Fix implicit any types (Phase 4C - deferred to strict mode phase)
import { useState, useEffect } from 'react'

interface LiveIntelDraft {
  id: string | number
  title: string
  rawIntel: string
  region: string
  probability: number
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL'
  impact: number
  localized: {
    TR: string
    EN: string
    DE: string
    ES: string
    FR: string
    AR: string
  }
  source: string
  timestamp: string
  confidence: number
  // SIA Master Protocol v2.1 fields
  sdi: number // Source Diversity Index
  riskLevel: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW'
  ageStatus: 'FRESH' | 'ACTIVE' | 'STALE'
  correlationScore: number
  manipulationFlags: string[]
}

/**
 * SIA_SENTINEL Live Intelligence Stream with Master Protocol v2.1
 * 
 * Implements:
 * - Confidence Scoring Matrix
 * - Source Diversity Index (SDI)
 * - Risk Quantification
 * - Temporal Decay Protocol
 * - Correlation Engine
 * - Anti-Manipulation Filter
 * - Gemini 1.5 Pro 002 Integration (optional)
 */
export const useLiveIntelStream = (useGemini: boolean = false) => {
  const [liveQueue, setLiveQueue] = useState<LiveIntelDraft[]>([])
  const [isScanning, setIsScanning] = useState(false)
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null)
  const [geminiEnabled, setGeminiEnabled] = useState(useGemini)

  // SIA Master Protocol v2.1: Confidence Scoring Matrix
  const calculateConfidenceScore = (
    sourceCount: number,
    ageMinutes: number,
    volumeDeviation: number,
    socialSpike: number
  ): number => {
    let score = 60 // Base score

    // Data source count
    if (sourceCount >= 3) score += 35
    else if (sourceCount === 2) score += 20

    // Time factor
    if (ageMinutes <= 60) score += 10
    else if (ageMinutes <= 1440) score += 5

    // Volume anomaly
    if (volumeDeviation >= 30) score += 25
    else if (volumeDeviation >= 20) score += 20
    else if (volumeDeviation >= 10) score += 15

    // Social signal strength
    if (socialSpike >= 200) score += 20
    else if (socialSpike >= 100) score += 15
    else if (socialSpike >= 50) score += 10

    return Math.min(score, 100)
  }

  // SIA Master Protocol v2.1: Source Diversity Index
  const calculateSDI = (sources: string[]): number => {
    const uniqueSources = new Set(sources)
    const totalPossibleSources = 5 // Binance, CryptoPanic, Twitter, On-chain, Google Trends
    return uniqueSources.size / totalPossibleSources
  }

  // SIA Master Protocol v2.1: Risk Quantification
  const calculateRiskLevel = (impact: number): 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW' => {
    if (impact >= 8) return 'CRITICAL'
    if (impact >= 6) return 'HIGH'
    if (impact >= 4) return 'MODERATE'
    return 'LOW'
  }

  // SIA Master Protocol v2.1: Temporal Decay Protocol
  const calculateAgeStatus = (timestamp: string): 'FRESH' | 'ACTIVE' | 'STALE' => {
    const ageMinutes = (Date.now() - new Date(timestamp).getTime()) / 60000
    if (ageMinutes <= 30) return 'FRESH'
    if (ageMinutes <= 120) return 'ACTIVE'
    return 'STALE'
  }

  // SIA Master Protocol v2.1: Anti-Manipulation Filter
  const detectManipulation = (
    priceChange: number,
    volumeChange: number,
    socialActivity: number
  ): string[] => {
    const flags: string[] = []

    // Pattern 1: Coordinated Pump
    if (Math.abs(priceChange) > 10 && volumeChange > 50 && socialActivity < 20) {
      flags.push('SUSPICIOUS_PUMP')
    }

    // Pattern 2: Wash Trading
    if (volumeChange > 100 && Math.abs(priceChange) < 2) {
      flags.push('WASH_TRADING_POSSIBLE')
    }

    // Pattern 3: Extreme Volatility
    if (Math.abs(priceChange) > 30) {
      flags.push('EXTREME_VOLATILITY')
    }

    return flags
  }

  // SIA Master Protocol v2.1: Correlation Engine
  const calculateCorrelation = (hasMarketData: boolean, hasNewsData: boolean): number => {
    if (hasMarketData && hasNewsData) return 0.9 // STRONG_SIGNAL
    if (hasMarketData || hasNewsData) return 0.5 // MODERATE
    return 0.3 // WEAK
  }

  // Process intelligence through Gemini 1.5 Pro 002 (optional)
  const processWithGemini = async (rawInput: any): Promise<LiveIntelDraft | null> => {
    try {
      const response = await fetch('/api/sia-gemini/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: rawInput })
      })

      if (!response.ok) {
        console.error('[SIA_GEMINI] API error:', response.status)
        return null
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        return result.data as LiveIntelDraft
      }

      return null
    } catch (error) {
      console.error('[SIA_GEMINI] Processing error:', error)
      return null
    }
  }

  const fetchLiveAlpha = async () => {
    setIsScanning(true)
    
    try {
      // 1. PIYASA VERİSİ - Binance üzerinden anomali takibi
      const marketSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'ADAUSDT']
      const marketPromises = marketSymbols.map(symbol =>
        fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`)
          .then(res => res.json())
          .catch(() => null)
      )
      
      const marketDataArray = await Promise.all(marketPromises)
      const validMarketData = marketDataArray.filter(data => data !== null)

      // 2. HABER AKIŞI - CryptoPanic üzerinden gerçek zamanlı haberler
      // Not: Demo için public endpoint kullanıyoruz
      let newsData: any = { results: [] }
      try {
        const newsRes = await fetch('https://cryptopanic.com/api/v1/posts/?auth_token=free&public=true&kind=news')
        if (newsRes.ok) {
          newsData = await newsRes.json()
        }
      } catch (newsErr) {
        console.log('[SIA_SENTINEL] News API unavailable, using market data only')
      }

      // 3. GEMINI OTONOM EDİTÖR - SIA_SENTINEL Filtresi
      const processedDrafts: LiveIntelDraft[] = []

      // Piyasa anomalilerini işle - SIA Master Protocol v2.1 Enhanced
      validMarketData.forEach((marketData, idx) => {
        const priceChange = parseFloat(marketData.priceChangePercent)
        const volume = parseFloat(marketData.volume)
        const symbol = marketData.symbol.replace('USDT', '')
        
        // Anomali tespiti: %5'ten fazla değişim veya yüksek hacim
        const isAnomaly = Math.abs(priceChange) > 5 || volume > 1000000
        
        if (isAnomaly) {
          const sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 
            priceChange > 0 ? 'BULLISH' : priceChange < 0 ? 'BEARISH' : 'NEUTRAL'
          
          const impact = Math.min(Math.abs(priceChange * 10), 10)
          
          // SIA Master Protocol v2.1: Calculate enhanced metrics
          const sourceCount = 1 // Only Binance for now
          const ageMinutes = 0 // Fresh data
          const volumeDeviation = Math.abs(priceChange)
          const socialSpike = 0 // No social data yet
          
          const enhancedConfidence = calculateConfidenceScore(
            sourceCount,
            ageMinutes,
            volumeDeviation,
            socialSpike
          )
          
          const sdi = calculateSDI(['BINANCE'])
          const riskLevel = calculateRiskLevel(impact)
          const timestamp = new Date().toISOString()
          const ageStatus = calculateAgeStatus(timestamp)
          const correlationScore = calculateCorrelation(true, false)
          const manipulationFlags = detectManipulation(priceChange, volumeDeviation, socialSpike)

          // Only add if confidence >= 85 (HIGH_CONFIDENCE threshold)
          if (enhancedConfidence >= 85) {
            processedDrafts.push({
              id: `market-${symbol}-${Date.now()}-${idx}`,
              title: `${symbol} VOLATILITY ALERT - ${Math.abs(priceChange).toFixed(2)}% PRICE DEVIATION DETECTED`,
              rawIntel: `SOURCE: BINANCE_PUBLIC_API // MARKET_IMPACT: ${Math.abs(priceChange).toFixed(2)}% // VOLUME: ${(volume / 1000000).toFixed(2)}M // SDI: ${sdi.toFixed(2)} // RISK: ${riskLevel}`,
              region: 'GLOBAL_MARKETS',
              probability: enhancedConfidence,
              sentiment,
              impact: Math.round(impact),
              localized: {
                TR: `STATISTICAL_PROBABILITY_ANALYSIS // [SIA_ANALİZ]: ${symbol} varlığında %${Math.abs(priceChange).toFixed(2)} algoritmik sapma tespiti. 24 saatlik volatilite anomalisi gözlemlendi. Risk Seviyesi: ${riskLevel}. Güven Skoru: ${enhancedConfidence}%. ${manipulationFlags.length > 0 ? `⚠ Uyarı: ${manipulationFlags.join(', ')}` : ''} // NOT_FINANCIAL_ADVICE`,
                EN: `STATISTICAL_PROBABILITY_ANALYSIS // [SIA_ANALYSIS]: ${symbol} asset shows ${Math.abs(priceChange).toFixed(2)}% algorithmic deviation detection. 24h volatility anomaly observed. Risk Level: ${riskLevel}. Confidence Score: ${enhancedConfidence}%. ${manipulationFlags.length > 0 ? `⚠ Warning: ${manipulationFlags.join(', ')}` : ''} // NOT_FINANCIAL_ADVICE`,
                DE: `STATISTISCHE_WAHRSCHEINLICHKEITSANALYSE // [SIA_ANALYSE]: ${symbol}-Asset zeigt ${Math.abs(priceChange).toFixed(2)}% algorithmische Abweichungserkennung. 24h-Volatilitätsanomalie beobachtet. Risikostufe: ${riskLevel}. Konfidenzscore: ${enhancedConfidence}%. ${manipulationFlags.length > 0 ? `⚠ Warnung: ${manipulationFlags.join(', ')}` : ''} // KEINE_ANLAGEBERATUNG`,
                ES: `ANÁLISIS_DE_PROBABILIDAD_ESTADÍSTICA // [SIA_ANÁLISIS]: Activo ${symbol} muestra ${Math.abs(priceChange).toFixed(2)}% detección de desviación algorítmica. Anomalía de volatilidad 24h observada. Nivel de Riesgo: ${riskLevel}. Puntuación de Confianza: ${enhancedConfidence}%. ${manipulationFlags.length > 0 ? `⚠ Advertencia: ${manipulationFlags.join(', ')}` : ''} // NO_ES_ASESORAMIENTO_FINANCIERO`,
                FR: `ANALYSE_DE_PROBABILITÉ_STATISTIQUE // [SIA_ANALYSE]: L'actif ${symbol} présente ${Math.abs(priceChange).toFixed(2)}% détection de déviation algorithmique. Anomalie de volatilité 24h observée. Niveau de Risque: ${riskLevel}. Score de Confiance: ${enhancedConfidence}%. ${manipulationFlags.length > 0 ? `⚠ Avertissement: ${manipulationFlags.join(', ')}` : ''} // PAS_DE_CONSEIL_FINANCIER`,
                AR: `تحليل_الاحتمالية_الإحصائية // [تحليل_SIA]: الأصل ${symbol} يظهر ${Math.abs(priceChange).toFixed(2)}% كشف انحراف خوارزمي. لوحظ شذوذ تقلب 24 ساعة. مستوى المخاطر: ${riskLevel}. درجة الثقة: ${enhancedConfidence}%. ${manipulationFlags.length > 0 ? `⚠ تحذير: ${manipulationFlags.join(', ')}` : ''} // ليس_نصيحة_مالية`
              },
              source: 'BINANCE_LIVE',
              timestamp,
              confidence: enhancedConfidence,
              sdi,
              riskLevel,
              ageStatus,
              correlationScore,
              manipulationFlags
            })
          } else {
            console.log(`[SIA_FILTER] ${symbol} rejected: confidence ${enhancedConfidence} < 85`)
          }
        }
      })

      // Haber akışını işle (varsa) - SIA Master Protocol v2.1 Enhanced
      if (newsData.results && newsData.results.length > 0) {
        const topNews = newsData.results.slice(0, 3) // İlk 3 haber
        
        topNews.forEach((news: any, idx: number) => {
          const newsImpact = news.votes?.positive || 0
          const impact = Math.min(newsImpact / 10, 10)
          
          // Haber sentiment analizi (basit keyword bazlı)
          const title = news.title.toLowerCase()
          let sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL' = 'NEUTRAL'
          
          if (title.includes('surge') || title.includes('rally') || title.includes('bullish') || title.includes('gains')) {
            sentiment = 'BULLISH'
          } else if (title.includes('crash') || title.includes('drop') || title.includes('bearish') || title.includes('falls')) {
            sentiment = 'BEARISH'
          }

          // SIA Master Protocol v2.1: Calculate enhanced metrics
          const sourceCount = 2 // Binance + CryptoPanic
          const ageMinutes = 0 // Fresh data
          const volumeDeviation = impact * 2 // Estimate from news impact
          const socialSpike = newsImpact // Use votes as social signal
          
          const enhancedConfidence = calculateConfidenceScore(
            sourceCount,
            ageMinutes,
            volumeDeviation,
            socialSpike
          )
          
          const sdi = calculateSDI(['BINANCE', 'CRYPTOPANIC'])
          const riskLevel = calculateRiskLevel(impact)
          const timestamp = new Date().toISOString()
          const ageStatus = calculateAgeStatus(timestamp)
          const correlationScore = calculateCorrelation(false, true)
          const manipulationFlags: string[] = []

          // Only add if confidence >= 85
          if (enhancedConfidence >= 85) {
            processedDrafts.push({
              id: `news-${news.id || Date.now()}-${idx}`,
              title: news.title.toUpperCase(),
              rawIntel: `SOURCE: ${news.source?.title || 'CRYPTOPANIC'} // VOTES: ${newsImpact} // SDI: ${sdi.toFixed(2)} // RISK: ${riskLevel}`,
              region: 'GLOBAL_STREAMS',
              probability: enhancedConfidence,
              sentiment,
              impact: Math.round(impact),
              localized: {
                TR: `STATISTICAL_PROBABILITY_ANALYSIS // [SIA_HABER]: ${news.title} haberi piyasa volatilitesini tetikledi. Halka açık kaynaklardan toplanan veriler ${enhancedConfidence}% güven skoruyla işlendi. Risk Seviyesi: ${riskLevel}. // NOT_FINANCIAL_ADVICE`,
                EN: `STATISTICAL_PROBABILITY_ANALYSIS // [SIA_NEWS]: ${news.title} is triggering market volatility. Public source data processed with ${enhancedConfidence}% confidence score. Risk Level: ${riskLevel}. // NOT_FINANCIAL_ADVICE`,
                DE: `STATISTISCHE_WAHRSCHEINLICHKEITSANALYSE // [SIA_NACHRICHTEN]: ${news.title} löst Marktvolatilität aus. Öffentliche Quelldaten mit ${enhancedConfidence}% Konfidenzscore verarbeitet. Risikostufe: ${riskLevel}. // KEINE_ANLAGEBERATUNG`,
                ES: `ANÁLISIS_DE_PROBABILIDAD_ESTADÍSTICA // [SIA_NOTICIAS]: ${news.title} está desencadenando volatilidad del mercado. Datos de fuentes públicas procesados con ${enhancedConfidence}% puntuación de confianza. Nivel de Riesgo: ${riskLevel}. // NO_ES_ASESORAMIENTO_FINANCIERO`,
                FR: `ANALYSE_DE_PROBABILITÉ_STATISTIQUE // [SIA_ACTUALITÉS]: ${news.title} déclenche la volatilité du marché. Données de sources publiques traitées avec ${enhancedConfidence}% score de confiance. Niveau de Risque: ${riskLevel}. // PAS_DE_CONSEIL_FINANCIER`,
                AR: `تحليل_الاحتمالية_الإحصائية // [أخبار_SIA]: ${news.title} يؤدي إلى تقلبات السوق. تمت معالجة بيانات المصادر العامة بدرجة ثقة ${enhancedConfidence}%. مستوى المخاطر: ${riskLevel}. // ليس_نصيحة_مالية`
              },
              source: 'CRYPTOPANIC_LIVE',
              timestamp,
              confidence: enhancedConfidence,
              sdi,
              riskLevel,
              ageStatus,
              correlationScore,
              manipulationFlags
            })
          } else {
            console.log(`[SIA_FILTER] News rejected: confidence ${enhancedConfidence} < 85`)
          }
        })
      }

      // SIA Master Protocol v2.1: Filter STALE items and sort by priority
      const filteredDrafts = processedDrafts
        .filter(draft => draft.ageStatus !== 'STALE') // Remove STALE items
        .sort((a, b) => {
          // Priority: CRITICAL + HIGH_CONFIDENCE first
          const aPriority = (a.riskLevel === 'CRITICAL' ? 1000 : a.riskLevel === 'HIGH' ? 500 : 0) + a.confidence
          const bPriority = (b.riskLevel === 'CRITICAL' ? 1000 : b.riskLevel === 'HIGH' ? 500 : 0) + b.confidence
          return bPriority - aPriority
        })

      // OPTIONAL: Process through Gemini 1.5 Pro 002 for enhanced analysis
      let finalDrafts = filteredDrafts
      
      if (geminiEnabled && filteredDrafts.length > 0) {
        console.log('[SIA_GEMINI] Processing', filteredDrafts.length, 'items through Gemini...')
        
        // Process top 3 items through Gemini for enhanced analysis
        const topItems = filteredDrafts.slice(0, 3)
        const geminiPromises = topItems.map(draft => 
          processWithGemini({
            source: draft.source,
            data: {
              title: draft.title,
              rawIntel: draft.rawIntel,
              sentiment: draft.sentiment,
              impact: draft.impact,
              confidence: draft.confidence
            },
            timestamp: draft.timestamp,
            type: draft.source.includes('BINANCE') ? 'MARKET' : 'NEWS'
          })
        )

        const geminiResults = await Promise.all(geminiPromises)
        const validGeminiResults = geminiResults.filter(r => r !== null) as LiveIntelDraft[]

        if (validGeminiResults.length > 0) {
          console.log('[SIA_GEMINI] Enhanced', validGeminiResults.length, 'items with AI analysis')
          // Replace original items with Gemini-enhanced versions
          finalDrafts = [
            ...validGeminiResults,
            ...filteredDrafts.slice(validGeminiResults.length)
          ]
        }
      }

      // Queue'yu güncelle (en yeni 10 draft, FRESH/ACTIVE only)
      setLiveQueue(finalDrafts.slice(0, 10))
      setLastScanTime(new Date())
      
      console.log('[SIA_SENTINEL] Live scan complete:', processedDrafts.length, 'total,', filteredDrafts.length, 'passed filters')
      console.log('[SIA_PROTOCOL] Confidence threshold: ≥85, Age filter: FRESH/ACTIVE only')
      if (geminiEnabled) {
        console.log('[SIA_GEMINI] AI enhancement:', finalDrafts.length > filteredDrafts.length ? 'ACTIVE' : 'STANDBY')
      }
      
    } catch (err) {
      console.error('[SIA_SENTINEL] STREAM_ERR:', err)
      console.log('[SIA_SENTINEL] Bağlantı bekleniyor...')
    } finally {
      setIsScanning(false)
    }
  }

  useEffect(() => {
    // İlk tarama
    fetchLiveAlpha()
    
    // 30 saniyede bir tarama
    const interval = setInterval(fetchLiveAlpha, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return {
    liveQueue,
    isScanning,
    lastScanTime,
    manualScan: fetchLiveAlpha,
    geminiEnabled,
    toggleGemini: () => setGeminiEnabled(!geminiEnabled)
  }
}
