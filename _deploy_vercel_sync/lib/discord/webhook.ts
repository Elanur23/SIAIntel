/**
 * SIA Intelligence — Discord Webhook Engine
 * Yeni haber yayınlandığında Discord kanalına otomatik profesyonel embed gönderir.
 */

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL

// Kategori renk kodları (Discord embed color = decimal)
const CATEGORY_COLORS: Record<string, number> = {
  CRYPTO:  0x3b82f6, // mavi
  ECONOMY: 0xf59e0b, // amber
  STOCKS:  0x10b981, // yeşil
  AI:      0x8b5cf6, // mor
  MARKET:  0x06b6d4, // cyan
  BREAKING:0xef4444, // kırmızı
  DEFAULT: 0x1e40af, // koyu mavi
}

// Kategori emoji
const CATEGORY_EMOJI: Record<string, string> = {
  CRYPTO:  '🪙',
  ECONOMY: '🏦',
  STOCKS:  '📈',
  AI:      '🤖',
  MARKET:  '⚡',
  BREAKING:'🔴',
  DEFAULT: '📡',
}

export interface DiscordArticlePayload {
  titleEn: string
  summaryEn: string
  category: string
  confidence?: number
  marketImpact?: number
  imageUrl?: string
  articleUrl: string
  authorName?: string
  publishedAt?: Date
}

export async function sendArticleToDiscord(article: DiscordArticlePayload): Promise<boolean> {
  if (!WEBHOOK_URL) {
    console.log('[DISCORD] Webhook URL not configured — skipping notification')
    return false
  }

  const category = (article.category || 'DEFAULT').toUpperCase()
  const color = CATEGORY_COLORS[category] || CATEGORY_COLORS.DEFAULT
  const emoji = CATEGORY_EMOJI[category] || CATEGORY_EMOJI.DEFAULT
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://siaintel.com'

  const confidenceBar = article.confidence
    ? `${'█'.repeat(Math.round(article.confidence / 10))}${'░'.repeat(10 - Math.round(article.confidence / 10))} ${article.confidence}%`
    : null

  const impactStars = article.marketImpact
    ? '★'.repeat(Math.min(article.marketImpact, 5)) + '☆'.repeat(Math.max(0, 5 - Math.min(article.marketImpact, 5)))
    : null

  const embed = {
    title: `${emoji} ${article.titleEn}`,
    description: article.summaryEn
      ? `> ${article.summaryEn.slice(0, 280)}${article.summaryEn.length > 280 ? '...' : ''}`
      : '',
    color,
    url: article.articleUrl,
    fields: [
      {
        name: '📊 Category',
        value: `\`${category}\``,
        inline: true,
      },
      ...(confidenceBar ? [{
        name: '🎯 Confidence',
        value: `\`${confidenceBar}\``,
        inline: true,
      }] : []),
      ...(impactStars ? [{
        name: '💥 Market Impact',
        value: impactStars,
        inline: true,
      }] : []),
      {
        name: '🌍 Available In',
        value: '🇺🇸 🇹🇷 🇩🇪 🇫🇷 🇪🇸 🇷🇺 🇦🇪 🇯🇵 🇨🇳',
        inline: false,
      },
    ],
    ...(article.imageUrl ? { image: { url: article.imageUrl } } : {}),
    author: {
      name: article.authorName || 'SIA Intelligence Unit',
      icon_url: `${baseUrl}/logo.png`,
    },
    footer: {
      text: 'SIA Intelligence Terminal • siaintel.com',
      icon_url: `${baseUrl}/logo.png`,
    },
    timestamp: (article.publishedAt || new Date()).toISOString(),
  }

  // Ana mesaj + buton satırı
  const body = {
    content: `**⚡ NEW INTELLIGENCE SIGNAL**\n🔗 Read full analysis → ${article.articleUrl}`,
    embeds: [embed],
    components: [
      {
        type: 1, // Action Row
        components: [
          {
            type: 2, // Button
            style: 5, // Link
            label: '📖 Full Report (EN)',
            url: article.articleUrl,
          },
          {
            type: 2,
            style: 5,
            label: '🇹🇷 Türkçe Oku',
            url: article.articleUrl.replace('/en/', '/tr/'),
          },
          {
            type: 2,
            style: 5,
            label: '🌐 SIA Terminal',
            url: baseUrl,
          },
        ],
      },
    ],
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      console.log(`[DISCORD] ✅ Article sent: ${article.titleEn.slice(0, 60)}`)
      return true
    } else {
      const err = await res.text()
      console.error(`[DISCORD] ❌ Failed (${res.status}): ${err}`)
      return false
    }
  } catch (e: any) {
    console.error('[DISCORD] ❌ Network error:', e.message)
    return false
  }
}

/**
 * Test mesajı — webhook bağlantısını doğrulamak için
 */
export async function sendDiscordTest(): Promise<boolean> {
  if (!WEBHOOK_URL) return false

  const body = {
    embeds: [{
      title: '✅ SIA Intelligence — Webhook Active',
      description: 'Discord entegrasyonu başarıyla bağlandı. Yeni haberler otomatik olarak bu kanala gönderilecek.',
      color: 0x10b981,
      footer: { text: 'SIA Intelligence Terminal' },
      timestamp: new Date().toISOString(),
    }],
  }

  try {
    const res = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    return res.ok
  } catch {
    return false
  }
}
