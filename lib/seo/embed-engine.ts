export interface EmbedConfig {
  widgetType: 'barometer' | 'live-intel' | 'price-ticker' | 'sentiment-gauge'
  articleId?: string
  language: string
  theme?: 'light' | 'dark' | 'auto'
  width?: string
  height?: string
  showAttribution?: boolean
  customStyles?: Record<string, string>
}

export interface EmbedCode {
  html: string
  javascript: string
  css: string
  iframe: string
  preview: string
}

function buildWidgetUrl(config: EmbedConfig): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
  const params = new URLSearchParams({
    type: config.widgetType,
    lang: config.language,
    theme: config.theme || 'light',
  })

  if (config.articleId) {
    params.set('articleId', config.articleId)
  }

  return `${baseUrl}/embed/widget?${params.toString()}`
}

function buildEmbed(config: EmbedConfig): EmbedCode {
  const widgetUrl = buildWidgetUrl(config)
  const width = config.width || '100%'
  const height = config.height || '200px'
  const attribution = config.showAttribution !== false
    ? `<p style="margin-top:8px;font-size:12px">Powered by <a href=\"https://siaintel.com\" target=\"_blank\" rel=\"noopener noreferrer\">SIA Intelligence</a></p>`
    : ''

  const iframe = `<iframe src="${widgetUrl}" style="width:${width};height:${height};border:0;" loading="lazy"></iframe>`

  return {
    html: `${iframe}${attribution}`,
    javascript: `<script>window.open('${widgetUrl}', '_blank');</script>`,
    css: '.sia-widget{font-family:inherit;}',
    iframe,
    preview: `<div class="sia-widget">${iframe}${attribution}</div>`,
  }
}

export function generateBarometerEmbed(config: EmbedConfig): EmbedCode {
  return buildEmbed(config)
}

export function generateLiveIntelEmbed(config: EmbedConfig): EmbedCode {
  return buildEmbed({ ...config, height: config.height || '400px' })
}

export function generateWordPressShortcode(config: EmbedConfig): string {
  return `[sia_widget type="${config.widgetType}" lang="${config.language}" article_id="${config.articleId || ''}"]`
}

export function generateWixEmbed(config: EmbedConfig): string {
  return `<iframe src="${buildWidgetUrl(config)}" width="${config.width || '100%'}" height="${config.height || '200px'}"></iframe>`
}

export function generateSquarespaceEmbed(config: EmbedConfig): string {
  return `<div class="sqs-block-embed">${generateWixEmbed(config)}</div>`
}
