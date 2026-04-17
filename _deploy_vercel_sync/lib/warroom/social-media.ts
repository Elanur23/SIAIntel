import type { ArticleLanguage } from '@/lib/warroom/article-localization'

const BASE_URL = 'https://siaintel.com'

export type SocialLanguage = ArticleLanguage

export interface SocialMediaPackage {
  heroSnippet: string
  xPost: string
  linkedinPost: string
  telegramPost: string
  whatsappText: string
  hashtags: string[]
  shareUrls: {
    x: string
    linkedin: string
    telegram: string
    whatsapp: string
  }
  distributionNotes: string[]
}

export interface SocialCampaignBrief {
  title: string
  body: string
}

function sanitizeText(value: string): string {
  return (value || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function truncate(value: string, maxLength: number): string {
  const normalized = sanitizeText(value)
  if (normalized.length <= maxLength) return normalized
  const clipped = `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`
  return clipped.length <= maxLength ? clipped : clipped.slice(0, maxLength)
}

function encode(value: string): string {
  return encodeURIComponent(value)
}

function getCategoryHashtags(category?: string, region?: string): string[] {
  const normalizedCategory = (category || 'market').toLowerCase()
  const normalizedRegion = (region || '').toUpperCase()

  const categoryTags: Record<string, string[]> = {
    crypto: ['CryptoMarkets', 'DigitalAssets', 'OnChain'],
    crypto_blockchain: ['CryptoMarkets', 'Blockchain', 'DigitalAssets'],
    economy: ['Macro', 'Rates', 'GlobalMarkets'],
    macro_economy: ['Macro', 'CentralBanks', 'GlobalMarkets'],
    stocks: ['Equities', 'MarketStructure', 'InstitutionalFlow'],
    tech_stocks: ['Equities', 'Nasdaq', 'InstitutionalFlow'],
    commodities: ['Commodities', 'Macro', 'RiskAssets'],
    market: ['MarketIntel', 'InstitutionalFlow', 'RiskMonitor']
  }

  const regionTags: Record<string, string> = {
    US: 'USMarkets',
    TR: 'TurkeyMarkets',
    DE: 'EurozoneMarkets',
    FR: 'EurozoneMarkets',
    ES: 'EurozoneMarkets',
    GLOBAL: 'GlobalMarkets'
  }

  const tags = categoryTags[normalizedCategory] || categoryTags.market
  const regionTag = regionTags[normalizedRegion] || regionTags.GLOBAL
  return Array.from(new Set(['siaintel', ...tags, regionTag]))
}

function buildDistributionNotes(language: SocialLanguage, impact: number, category?: string): string[] {
  const highImpact = impact >= 8
  const en = [
    highImpact ? 'Prioritize X and Telegram in the first 15 minutes to capture market attention.' : 'Lead with LinkedIn for context-first distribution.',
    `Anchor the conversation around ${category || 'market'} implications, not raw headlines.`,
    'Keep replies factual and route deeper readers to the full article page.'
  ]
  const tr = [
    highImpact ? 'İlk 15 dakikada dikkat toplamak için X ve Telegram önceliklendirilmeli.' : 'Bağlam odaklı dağıtım için LinkedIn ile başlanmalı.',
    `Konuşmayı salt başlık yerine ${category || 'piyasa'} etkileri etrafında kur.`,
    'Yanıtlarda veri disiplinini koru ve derin okuma için tam makaleye yönlendir.'
  ]

  return language === 'tr' ? tr : en
}

export function buildSocialMediaPackage(params: {
  language: SocialLanguage
  title: string
  summary: string
  url: string
  category?: string
  region?: string
  impact?: number
}) : SocialMediaPackage {
  const language = params.language
  const title = sanitizeText(params.title)
  const summary = sanitizeText(params.summary)
  const impact = params.impact ?? 5
  const hashtags = getCategoryHashtags(params.category, params.region)
  const hashtagBlock = hashtags.map((tag) => `#${tag}`).join(' ')

  const heroSnippet = language === 'tr'
    ? truncate(`${title}. ${summary}`, 190)
    : truncate(`${title}. ${summary}`, 190)

  const xLead = language === 'tr'
    ? `${title} | Etki ${impact}/10`
    : `${title} | Impact ${impact}/10`

  const xPost = truncate(`${xLead} ${summary} ${params.url} ${hashtagBlock}`, 268)

  const linkedinIntro = language === 'tr'
    ? `${title}

Öne çıkan tez: ${summary}`
    : `${title}

Key thesis: ${summary}`

  const linkedinBody = language === 'tr'
    ? `

Bu rapor, ${params.category || 'piyasa'} tarafında kurumsal akış, risk dengesi ve ikinci dereceden etkileri çerçeveliyor. Tam raporda zamanlama, etki seviyesi ve izlenmesi gereken senaryolar yer alıyor.

Tam makale:`
    : `

This report frames the institutional flow, risk balance, and second-order implications across ${params.category || 'market'} conditions. The full article covers timing, impact tier, and the scenarios worth monitoring next.

Full article:`

  const linkedinPost = truncate(`${linkedinIntro}${linkedinBody} ${params.url}

${hashtagBlock}`, 900)

  const telegramPost = language === 'tr'
    ? truncate(`🚨 ${title}

${summary}

Etki seviyesi: ${impact}/10
Tam rapor: ${params.url}`, 700)
    : truncate(`🚨 ${title}

${summary}

Impact tier: ${impact}/10
Full report: ${params.url}`, 700)

  const whatsappText = language === 'tr'
    ? truncate(`${title}

${summary}

Tam rapor: ${params.url}`, 500)
    : truncate(`${title}

${summary}

Full report: ${params.url}`, 500)

  return {
    heroSnippet,
    xPost,
    linkedinPost,
    telegramPost,
    whatsappText,
    hashtags,
    shareUrls: {
      x: `https://twitter.com/intent/tweet?text=${encode(xPost)}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encode(params.url)}`,
      telegram: `https://t.me/share/url?url=${encode(params.url)}&text=${encode(telegramPost)}`,
      whatsapp: `https://wa.me/?text=${encode(whatsappText)}`
    },
    distributionNotes: buildDistributionNotes(language, impact, params.category)
  }
}

export function getShareDomainUrl(path: string): string {
  if (!path) return BASE_URL
  return path.startsWith('http') ? path : `${BASE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

export function buildSocialCampaignBrief(params: {
  headline: string
  packageData: SocialMediaPackage
  articleUrl?: string
}): SocialCampaignBrief {
  const articleUrl = params.articleUrl || 'N/A'
  const body = [
    `CAMPAIGN BRIEF | ${params.headline}`,
    '',
    'PRIMARY MESSAGE',
    params.packageData.heroSnippet,
    '',
    'X / TWITTER',
    params.packageData.xPost,
    '',
    'LINKEDIN',
    params.packageData.linkedinPost,
    '',
    'TELEGRAM',
    params.packageData.telegramPost,
    '',
    'WHATSAPP',
    params.packageData.whatsappText,
    '',
    'HASHTAGS',
    params.packageData.hashtags.map((tag) => `#${tag}`).join(' '),
    '',
    'SHARE URLS',
    `Article: ${articleUrl}`,
    `X: ${params.packageData.shareUrls.x}`,
    `LinkedIn: ${params.packageData.shareUrls.linkedin}`,
    `Telegram: ${params.packageData.shareUrls.telegram}`,
    `WhatsApp: ${params.packageData.shareUrls.whatsapp}`,
    '',
    'DISTRIBUTION NOTES',
    ...params.packageData.distributionNotes.map((note, index) => `${index + 1}. ${note}`)
  ].join('\n')

  return {
    title: `${params.headline} Campaign Brief`,
    body
  }
}