/**
 * SIA SEO Golden Keywords Engine v2
 * Multilingual trigger matching + content scanning + auto-extraction
 */

// ── Category keyword pools ────────────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  CRYPTO:   ['#Bitcoin', '#BTC', '#Crypto', '#Blockchain', '#DeFi', '#Web3', '#ETH', '#Altcoin', '#CryptoMarket'],
  STOCKS:   ['#Nasdaq', '#WallStreet', '#Equities', '#S&P500', '#Stocks', '#Trading', '#NYSE', '#MarketAlert'],
  AI:       ['#ArtificialIntelligence', '#MachineLearning', '#GenAI', '#LLM', '#AIStocks', '#NvidiaAI', '#TechStocks'],
  ECONOMY:  ['#MacroEconomics', '#FedPolicy', '#CentralBank', '#Inflation', '#SWIFT', '#DXY', '#Sovereign'],
  MARKET:   ['#MarketAlert', '#Volatility', '#LiquidityFlow', '#InstitutionalTrading', '#WhaleAlert'],
  GENERAL:  ['#Finance', '#Markets', '#Intelligence', '#SIARadar', '#GlobalMarkets'],
}

// ── Multilingual trigger map ─────────────────────────────────────────────────
// key: lowercase substring to search | value: SEO keyword tag

const TRIGGER_KEYWORDS: Record<string, string> = {
  // ── Crypto assets
  'bitcoin': '#Bitcoin', 'btc': '#BTC', 'ethereum': '#Ethereum', 'eth': '#ETH',
  'solana': '#Solana', 'sol ': '#Solana', 'xrp': '#XRP', 'ripple': '#XRP',
  'bnb': '#BNB', 'binance': '#Binance', 'usdt': '#Tether', 'tether': '#Tether',
  'crypto': '#Crypto', 'kripto': '#Crypto', 'blockchain': '#Blockchain',
  'defi': '#DeFi', 'web3': '#Web3', 'nft': '#NFT', 'altcoin': '#Altcoin',
  'mining': '#CryptoMining', 'miner': '#CryptoMining',

  // ── Stock market
  'nasdaq': '#Nasdaq', 'sp500': '#S&P500', 's&p': '#S&P500', 'dow': '#DowJones',
  'nyse': '#NYSE', 'borsa': '#StockMarket', 'hisse': '#Stocks', 'stocks': '#Stocks',
  'equities': '#Equities', 'wall street': '#WallStreet', 'ipo': '#IPO',
  'earnings': '#EarningsSeason', 'dividend': '#Dividends',

  // ── Individual stocks
  'nvidia': '#NVDA', 'nvda': '#NVDA', 'apple': '#AAPL', 'aapl': '#AAPL',
  'tesla': '#TSLA', 'tsla': '#TSLA', 'microsoft': '#MSFT', 'msft': '#MSFT',
  'amazon': '#AMZN', 'amzn': '#AMZN', 'google': '#GOOGL', 'alphabet': '#GOOGL',
  'meta ': '#META', 'asml': '#ASML', 'tsmc': '#TSMC',
  'chip ': '#ChipStocks_Sector',

  // ── Macro / Fed
  'fed ': '#FederalReserve', 'federal reserve': '#FedPolicy', 'fomc': '#FOMC',
  'interest rate': '#RateDecision', 'faiz': '#FaizKararı', 'rate cut': '#RateCut',
  'rate hike': '#RateHike', 'inflation': '#Inflation', 'enflasyon': '#Inflation',
  'gdp': '#GDP', 'büyüme': '#GDP', 'treasury': '#USTreasury', 'bond': '#Bonds',
  'yield': '#BondYield', 'tahvil': '#Bonds', 'recession': '#Recession',

  // ── Currencies / FX
  'dxy': '#DXY', 'dollar': '#USD', 'dolar': '#USD', 'euro': '#EUR', 'eur': '#EUR',
  'yuan': '#Yuan', 'rmb': '#Yuan', 'yen': '#JPY', 'jpy': '#JPY',
  'pound': '#GBP', 'gbp': '#GBP', 'lira': '#TRY', 'try': '#TRY',

  // ── Commodities
  'gold': '#Gold', 'altın': '#Gold', 'xau': '#Gold', 'silver': '#Silver', 'gümüş': '#Silver',
  'oil': '#CrudeOil', 'petrol': '#CrudeOil', 'brent': '#Brent', 'wti': '#CrudeOil',
  'copper': '#Copper', 'bakır': '#Copper',

  // ── Geopolitical / Sovereign
  'swift': '#SWIFT', 'mbridge': '#mBridge', 'cbdc': '#CBDC', 'dijital para': '#CBDC',
  'sovereign': '#SovereignCapital', 'egemenlik': '#SovereignCapital',
  'central bank': '#CentralBank', 'merkez bankası': '#CentralBank',
  'sanctions': '#Sanctions', 'yaptırım': '#Sanctions', 'geopolitical': '#Geopolitics',
  'jeopolitik': '#Geopolitics', 'tariff': '#Tariffs', 'tarife': '#Tariffs',

  // ── Institutional / Whale
  'whale': '#WhaleAlert', 'balina': '#WhaleAlert', 'institutional': '#InstitutionalFlow',
  'kurumsal': '#InstitutionalFlow', 'hedge fund': '#HedgeFund', 'liquidity': '#LiquidityFlow',
  'likidite': '#LiquidityFlow', 'dark pool': '#DarkPool', 'prime broker': '#InstitutionTrading',
  'sovereign wealth': '#SovereignFund', 'family office': '#FamilyOffice',

  // ── Technical indicators
  'rsi': '#RSI', 'macd': '#MACD', 'volatility': '#Volatility',
  'volatilite': '#Volatility', 'oynaklık': '#Volatility',
  'support': '#TechnicalAnalysis', 'resistance': '#TechnicalAnalysis',
  'destek': '#TechnicalAnalysis', 'direnç': '#TechnicalAnalysis',
  'bullish': '#Bullish', 'bearish': '#Bearish', 'yükseliş': '#Bullish', 'düşüş': '#Bearish',
  'breakout': '#Breakout', 'kırılım': '#Breakout', 'momentum': '#Momentum',
  'vix': '#VIX', 'fear index': '#VIX',

  // ── Market events
  'flash crash': '#FlashCrash', 'ani düşüş': '#FlashCrash',
  'ath': '#AllTimeHigh', 'all time high': '#AllTimeHigh', 'tüm zamanların': '#AllTimeHigh',
  'halving': '#BTCHalving', 'yarılanma': '#BTCHalving',
  'merger': '#Merger', 'acquisition': '#MA', 'birleşme': '#MA',
  'halka arz': '#IPO_TR',
  'etf': '#ETF', 'fund': '#Fund', 'fon': '#Fund',

  // ── Live / Alert signals
  'live': '#LiveMarket', 'canlı': '#LiveMarket', 'alert': '#MarketAlert',
  'uyarı': '#MarketAlert', 'signal': '#TradingSignal', 'sinyal': '#TradingSignal',
  'scan': '#RadarScan', 'radar': '#SIARadar',

  // ── AI / Tech sector
  'artificial intelligence': '#ArtificialIntelligence', 'yapay zeka': '#ArtificialIntelligence',
  'ai ': '#AIMarket', 'machine learning': '#MachineLearning',
  'data center': '#DataCenter', 'veri merkezi': '#DataCenter',
  'semiconductor': '#Semiconductors',
  'yarı iletken': '#Semiconductors', 'foundry': '#ChipManufacturing',
  'grounding': '#GoogleGrounding', 'google ground': '#GoogleGrounding',
}

// ── Numeric pattern extractors ────────────────────────────────────────────────

function extractNumericKeywords(text: string): string[] {
  const tags: string[] = []

  // Large price moves (e.g. +2.35% → #PriceAlert, -5% → #BearSignal)
  const pctMatch = text.match(/[+-]?\d+\.?\d*\s*%/)
  if (pctMatch) {
    const val = parseFloat(pctMatch[0])
    if (Math.abs(val) > 2) tags.push('#PriceAlert')
    if (val > 5) tags.push('#BullishSignal')
    if (val < -5) tags.push('#BearSignal')
  }

  // Large currency values (Whale alerts)
  if (text.match(/\$\d+(?:\.\d+)?[MB]/)) {
    tags.push('#WhaleAlert')
  }

  return tags
}

/**
 * SCANS TEXT AND RETURNS ARRAY OF HASHTAGS
 */
export function extractSEOKeywords(title: string, body: string, category?: string): string[] {
  const combined = `${title} ${body}`.toLowerCase()
  const found = new Set<string>()

  // 1. Check triggers
  for (const [trigger, tag] of Object.entries(TRIGGER_KEYWORDS)) {
    if (combined.includes(trigger)) {
      found.add(tag)
    }
  }

  // 2. Numeric patterns
  extractNumericKeywords(combined).forEach(t => found.add(t))

  // 3. Category defaults
  if (category && CATEGORY_KEYWORDS[category.toUpperCase()]) {
    CATEGORY_KEYWORDS[category.toUpperCase()].slice(0, 3).forEach(t => found.add(t))
  }

  return Array.from(found).slice(0, 10)
}

export default {
  extractSEOKeywords,
  TRIGGER_KEYWORDS,
  CATEGORY_KEYWORDS
}
