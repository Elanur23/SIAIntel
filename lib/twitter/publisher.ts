/**
 * SIA Intelligence — Twitter/X Auto-Publisher
 * Yeni haber yayınlandığında otomatik tweet atar.
 * Twitter API v2 kullanır — OAuth 1.0a ile kimlik doğrulama.
 */

// Kategori hashtag seti
const CATEGORY_HASHTAGS: Record<string, string> = {
  CRYPTO:  '#Bitcoin #Crypto #BTC #WhaleAlert #DeFi #CryptoIntel',
  ECONOMY: '#Macro #FedPolicy #CentralBank #DXY #SWIFT #MacroIntel',
  STOCKS:  '#Nasdaq #SP500 #WallStreet #Equities #StockMarket',
  AI:      '#AI #ArtificialIntelligence #NVDA #TechStocks #GenAI',
  MARKET:  '#Markets #Finance #Trading #Volatility #MarketAlert',
  BREAKING:'🔴 #Breaking #BREAKING #UrgentNews',
  DEFAULT: '#Finance #Markets #Intelligence',
}

const CATEGORY_EMOJI: Record<string, string> = {
  CRYPTO:  '🪙',
  ECONOMY: '🏦',
  STOCKS:  '📈',
  AI:      '🤖',
  MARKET:  '⚡',
  BREAKING:'🔴',
  DEFAULT: '📡',
}

export interface TwitterArticlePayload {
  titleEn: string
  summaryEn: string
  category: string
  confidence?: number
  articleUrl: string
}

function buildTweet(article: TwitterArticlePayload): string {
  const cat = (article.category || 'DEFAULT').toUpperCase()
  const emoji = CATEGORY_EMOJI[cat] || CATEGORY_EMOJI.DEFAULT
  const hashtags = CATEGORY_HASHTAGS[cat] || CATEGORY_HASHTAGS.DEFAULT

  // Başlık — max 100 karakter
  const title = article.titleEn.length > 100
    ? article.titleEn.slice(0, 97) + '...'
    : article.titleEn

  // Özet — max 120 karakter
  const summary = article.summaryEn && article.summaryEn.length > 0
    ? (article.summaryEn.length > 120 ? article.summaryEn.slice(0, 117) + '...' : article.summaryEn)
    : ''

  const confidence = article.confidence ? `\nConfidence: ${article.confidence}%` : ''

  const tweet = [
    `${emoji} SIA RADAR SIGNAL`,
    ``,
    title,
    ``,
    summary ? `"${summary}"` : '',
    confidence,
    ``,
    `🔗 ${article.articleUrl}`,
    ``,
    hashtags,
    `#SIAIntel #FinancialIntelligence`,
  ].filter(l => l !== null).join('\n').trim()

  // Twitter 280 karakter limiti
  return tweet.length > 280 ? tweet.slice(0, 277) + '...' : tweet
}

/**
 * Tweet atar — Twitter API v2 OAuth 1.0a
 * Not: Bu fonksiyon çalışmak için TWITTER_* env değişkenlerine ihtiyaç duyar
 */
export async function postTweet(article: TwitterArticlePayload): Promise<{ success: boolean; tweetId?: string; error?: string }> {
  const {
    TWITTER_API_KEY,
    TWITTER_API_SECRET,
    TWITTER_ACCESS_TOKEN,
    TWITTER_ACCESS_SECRET,
  } = process.env

  if (!TWITTER_API_KEY || !TWITTER_API_SECRET || !TWITTER_ACCESS_TOKEN || !TWITTER_ACCESS_SECRET) {
    console.log('[TWITTER] API keys not configured — skipping tweet')
    return { success: false, error: 'Twitter API keys not configured' }
  }

  const tweetText = buildTweet(article)

  try {
    // OAuth 1.0a imzalama
    const oauthHeader = await buildOAuthHeader(
      'POST',
      'https://api.twitter.com/2/tweets',
      {},
      { TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_SECRET }
    )

    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: oauthHeader,
      },
      body: JSON.stringify({ text: tweetText }),
    })

    const data = await res.json()

    if (res.ok && data?.data?.id) {
      console.log(`[TWITTER] ✅ Tweet posted: https://twitter.com/i/web/status/${data.data.id}`)
      return { success: true, tweetId: data.data.id }
    } else {
      console.error('[TWITTER] ❌ Failed:', JSON.stringify(data))
      return { success: false, error: data?.detail || 'Unknown error' }
    }
  } catch (e: any) {
    console.error('[TWITTER] ❌ Network error:', e.message)
    return { success: false, error: e.message }
  }
}

/** Tweet içeriği önizlemesi — API çağrısı yapmadan */
export function previewTweet(article: TwitterArticlePayload): string {
  return buildTweet(article)
}

// ── OAuth 1.0a İmzalama ───────────────────────────────────────────────────────
async function buildOAuthHeader(
  method: string,
  url: string,
  params: Record<string, string>,
  keys: { TWITTER_API_KEY: string; TWITTER_API_SECRET: string; TWITTER_ACCESS_TOKEN: string; TWITTER_ACCESS_SECRET: string }
): Promise<string> {
  const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36)
  const timestamp = Math.floor(Date.now() / 1000).toString()

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: keys.TWITTER_API_KEY,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA256',
    oauth_timestamp: timestamp,
    oauth_token: keys.TWITTER_ACCESS_TOKEN,
    oauth_version: '1.0',
    ...params,
  }

  // İmza tabanı string'i
  const sortedParams = Object.keys(oauthParams)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(oauthParams[k])}`)
    .join('&')

  const signatureBase = [
    method.toUpperCase(),
    encodeURIComponent(url),
    encodeURIComponent(sortedParams),
  ].join('&')

  // HMAC-SHA256 imzası
  const signingKey = `${encodeURIComponent(keys.TWITTER_API_SECRET)}&${encodeURIComponent(keys.TWITTER_ACCESS_SECRET)}`

  const encoder = new TextEncoder()
  const keyData = encoder.encode(signingKey)
  const msgData = encoder.encode(signatureBase)

  const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signatureBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData)
  const signature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))

  oauthParams['oauth_signature'] = signature

  const headerValue = 'OAuth ' + Object.keys(oauthParams)
    .filter(k => k.startsWith('oauth_'))
    .sort()
    .map(k => `${encodeURIComponent(k)}="${encodeURIComponent(oauthParams[k])}"`)
    .join(', ')

  return headerValue
}
