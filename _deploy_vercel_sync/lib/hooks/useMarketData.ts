import { useState, useEffect, useMemo } from 'react'

export interface MarketDataItem {
  symbol: string
  name: string
  price: number
  change: number
  positive: boolean
  region: string
}

const BINANCE_SYMBOLS_MAP: Record<string, { symbol: string, name: string, region: string }> = {
  'BTCUSDT': { symbol: 'BTC', name: 'Bitcoin', region: 'CRYPTO' },
  'ETHUSDT': { symbol: 'ETH', name: 'Ethereum', region: 'CRYPTO' },
  'SOLUSDT': { symbol: 'SOL', name: 'Solana', region: 'CRYPTO' },
  'PAXGUSDT': { symbol: 'GOLD', name: 'Gold', region: 'COMMODITY' }
}

const GLOBAL_INDICES: MarketDataItem[] = [
  { symbol: 'NASDAQ', name: 'Nasdaq 100', price: 18234.45, change: 1.24, positive: true, region: 'en' },
  { symbol: 'S&P 500', name: 'S&P 500', price: 5234.89, change: 0.85, positive: true, region: 'en' },
  { symbol: 'BIST 100', name: 'Borsa Istanbul', price: 9123.40, change: -0.42, positive: false, region: 'tr' },
  { symbol: 'DAX 40', name: 'Frankfurt SE', price: 17945.20, change: 0.15, positive: true, region: 'de' },
  { symbol: 'CAC 40', name: 'Paris SE', price: 8120.45, change: 0.45, positive: true, region: 'fr' },
  { symbol: 'IBEX 35', name: 'Madrid SE', price: 10950.30, change: 0.32, positive: true, region: 'es' },
  { symbol: 'IMOEX', name: 'Moscow SE', price: 3250.15, change: -0.15, positive: false, region: 'ru' },
  { symbol: 'TASI', name: 'Tadawul', price: 12450.60, change: 0.55, positive: true, region: 'ar' },
  { symbol: 'FTSE 100', name: 'London SE', price: 7820.15, change: -0.12, positive: false, region: 'en' },
  { symbol: 'NIKKEI 225', name: 'Tokyo SE', price: 39580.30, change: 2.10, positive: true, region: 'jp' }
]

/**
 * REGIONAL MARKET DATA HOOK
 * Prioritizes local market data based on current language/region
 */
export function useMarketData(lang: string = 'en') {
  const [marketData, setMarketData] = useState<MarketDataItem[]>([
    ...GLOBAL_INDICES,
    { symbol: 'BTC', name: 'Bitcoin', price: 0, change: 0, positive: true, region: 'CRYPTO' },
    { symbol: 'ETH', name: 'Ethereum', price: 0, change: 0, positive: true, region: 'CRYPTO' },
    { symbol: 'SOL', name: 'Solana', price: 0, change: 0, positive: true, region: 'CRYPTO' },
    { symbol: 'GOLD', name: 'Gold', price: 0, change: 0, positive: true, region: 'COMMODITY' }
  ])

  // Akıllı Sıralama: Kullanıcının bölgesini en başa al
  const sortedData = useMemo(() => {
    return [...marketData].sort((a, b) => {
      // Önce kullanıcının kendi bölgesini getir
      if (a.region === lang && b.region !== lang) return -1
      if (a.region !== lang && b.region === lang) return 1

      // Sonra kriptoları getir
      if (a.region === 'CRYPTO' && b.region !== 'CRYPTO') return -1
      if (a.region !== 'CRYPTO' && b.region === 'CRYPTO') return 1

      return 0
    })
  }, [marketData, lang])

  const fetchAndUpdate = async () => {
    try {
      const symbols = Object.keys(BINANCE_SYMBOLS_MAP)
      const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${JSON.stringify(symbols)}`)

      let cryptoUpdates: Partial<MarketDataItem>[] = []
      if (res.ok) {
        const data = await res.json()
        cryptoUpdates = data.map((item: any) => ({
          symbol: BINANCE_SYMBOLS_MAP[item.symbol].symbol,
          price: parseFloat(item.lastPrice),
          change: parseFloat(item.priceChangePercent),
          positive: parseFloat(item.priceChangePercent) >= 0
        }))
      }

      setMarketData(prev => {
        return prev.map(item => {
          const update = cryptoUpdates.find(u => u.symbol === item.symbol)
          if (update) {
            return { ...item, ...update } as MarketDataItem
          }

          // Realistic stock market drift
          const drift = (Math.random() - 0.5) * 0.0006
          const newPrice = item.price * (1 + drift)
          const newChange = item.change + (drift * 100)

          return {
            ...item,
            price: newPrice,
            change: newChange,
            positive: newChange >= 0
          }
        })
      })
    } catch (error) {
      console.error('[useMarketData] Sync Error:', error)
    }
  }

  useEffect(() => {
    fetchAndUpdate()
    const interval = setInterval(fetchAndUpdate, 5000)
    return () => clearInterval(interval)
  }, [])

  return sortedData
}
