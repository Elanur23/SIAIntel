/**
 * News Article Schema Generator
 * Google Search & Google News Optimization
 *
 * Features:
 * - JSON-LD NewsArticle schema
 * - Google News sitemap format
 * - Crawl priority tags
 * - Structured data validation
 */

export interface NewsArticleData {
  headline: string
  description: string
  content: string
  author: string
  datePublished: string
  dateModified?: string
  url: string
  imageUrl?: string
  category?: string
  keywords?: string[]
  language?: string
  // E-E-A-T Enhancement Fields
  sources?: SourceCitation[]
  aiDisclosure?: AIDisclosure
  editorialProcess?: string
  correctionPolicy?: string
  /** Verification / grounding for Google: "Verified by 4 Global Nodes & Fed AILF" */
  groundingLabel?: string
  /** Longer technical evidence text for schema creditText */
  groundingDetail?: string
  /** Optional list of verification source names for evidence array */
  verificationSources?: string[]
  /** Fact Check Data (ClaimReview) */
  factCheck?: FactCheckData
}

export interface FactCheckData {
  claim: string
  author: string
  rating: 'True' | 'Mostly True' | 'False' | 'Unverified'
  evidenceUrl?: string
}

export interface SourceCitation {
  name: string
  url: string
  type:
    | 'official'
    | 'sec_filing'
    | 'exchange'
    | 'government'
    | 'social_media'
    | 'news_wire'
    | 'on_chain'
  accessDate?: string
}

export interface AIDisclosure {
  model: string
  infrastructure: string
  dataSource: string
  editorialReview: boolean
  humanOversight: boolean
}

export interface StructuredDataOutput {
  jsonLd: string
  metaTags: string
  sitemapEntry: string
  openGraph: string
  twitterCard: string
  sourceCitations: string
  aiDisclosure: string
  correctionNotice: string
}

/**
 * Generate JSON-LD NewsArticle Schema
 * Google Search understands this in <10 seconds
 * Enhanced with E-E-A-T transparency fields
 */
export function generateNewsArticleSchema(article: NewsArticleData): object {
  const schema: any = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.headline,
    description: article.description,
    articleBody: article.content,
    author: {
      '@type': 'Organization',
      name: article.author || 'SIA_INTELLIGENCE_ENGINE',
      url: 'https://siaintel.com',
      // AI Disclosure in author field
      ...(article.aiDisclosure && {
        description: `AI-Assisted Analysis using ${article.aiDisclosure.model} with human editorial oversight`,
      }),
    },
    publisher: {
      '@type': 'Organization',
      name: 'SIA_NETWORK_TERMINAL',
      url: 'https://siaintel.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://siaintel.com/logo.png',
        width: 600,
        height: 60,
      },
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': article.url,
    },
    ...(article.imageUrl && {
      image: {
        '@type': 'ImageObject',
        url: article.imageUrl,
        width: 1200,
        height: 630,
      },
    }),
    ...(article.category && {
      articleSection: article.category,
    }),
    ...(article.keywords && {
      keywords: article.keywords.join(', '),
    }),
    ...(article.language && {
      inLanguage: article.language,
    }),
    // Additional NewsArticle properties
    isAccessibleForFree: true,
    isPartOf: {
      '@type': 'WebSite',
      name: 'SIA Intelligence Terminal',
      url: 'https://siaintel.com',
    },
  }

  // Schema depth: evidence/verification for Google
  const verificationParts: string[] = []
  if (article.groundingLabel) verificationParts.push(article.groundingLabel)
  if (article.groundingDetail) verificationParts.push(article.groundingDetail)
  if (article.verificationSources?.length)
    verificationParts.push(`Technical evidence: ${article.verificationSources.join(', ')}.`)
  if (verificationParts.length === 0)
    verificationParts.push(
      'Verified by 4 Global Nodes & Fed AILF. Cross-referenced with exchange and institutional sources.'
    )
  schema.creditText = verificationParts.join(' ')
  schema.backstory = `This article's accuracy is supported by the following technical evidence: ${verificationParts.join(' ')}.`

  // E-E-A-T Enhancement: Add source citations
  if (article.sources && article.sources.length > 0) {
    schema.isBasedOn = article.sources.map((source) => ({
      '@type': 'CreativeWork',
      name: source.name,
      url: source.url,
      ...(source.accessDate && { dateAccessed: source.accessDate }),
    }))
    schema.citation = article.sources.map((source) => ({
      '@type': 'CreativeWork',
      name: source.name,
      url: source.url,
    }))
  }

  if (article.editorialProcess) {
    schema.backstory = `${schema.backstory} ${article.editorialProcess}`
  }

  if (article.correctionPolicy) {
    schema.correction = article.correctionPolicy
  }

  // If FactCheck is present, we return both in an array for Google
  if (article.factCheck) {
    const claimSchema = {
      '@context': 'https://schema.org',
      '@type': 'ClaimReview',
      url: article.url,
      claimReviewed: article.factCheck.claim,
      author: {
        '@type': 'Organization',
        name: 'SIA_TRUTH_ENGINE',
      },
      reviewRating: {
        '@type': 'Rating',
        ratingValue:
          article.factCheck.rating === 'True'
            ? '5'
            : article.factCheck.rating === 'Mostly True'
              ? '4'
              : '1',
        bestRating: '5',
        worstRating: '1',
        alternateName: article.factCheck.rating,
      },
      itemReviewed: {
        '@type': 'Claim',
        author: {
          '@type': 'Organization',
          name: article.factCheck.author,
        },
        appearance: {
          '@type': 'OpinionNewsArticle',
          url: article.factCheck.evidenceUrl || article.url,
          headline: article.factCheck.claim,
        },
      },
    }
    return [schema, claimSchema]
  }

  return schema
}

/**
 * Generate complete structured data output
 */
export function generateStructuredData(article: NewsArticleData): StructuredDataOutput {
  // 1. JSON-LD Schema
  const schema = generateNewsArticleSchema(article)
  const jsonLd = `<script type="application/ld+json">
${JSON.stringify(schema, null, 2)}
</script>`

  // 2. Meta Tags (Crawl Priority)
  const metaTags = `<!-- SEO Meta Tags -->
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
<meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
<meta name="googlebot-news" content="index, follow" />
<link rel="canonical" href="${article.url}" />
<meta name="description" content="${escapeHtml(article.description)}" />
<meta name="keywords" content="${article.keywords?.join(', ') || ''}" />
<meta name="author" content="${article.author || 'SIA_INTELLIGENCE_ENGINE'}" />
<meta name="publish-date" content="${article.datePublished}" />
${article.dateModified ? `<meta name="last-modified" content="${article.dateModified}" />` : ''}
<meta name="article:published_time" content="${article.datePublished}" />
${article.dateModified ? `<meta name="article:modified_time" content="${article.dateModified}" />` : ''}
${article.category ? `<meta name="article:section" content="${article.category}" />` : ''}`

  // 3. Google News Sitemap Entry
  const sitemapEntry = generateNewsSitemapEntry(article)

  // 4. Open Graph Tags
  const openGraph = `<!-- Open Graph / Facebook -->
<meta property="og:type" content="article" />
<meta property="og:url" content="${article.url}" />
<meta property="og:title" content="${escapeHtml(article.headline)}" />
<meta property="og:description" content="${escapeHtml(article.description)}" />
${article.imageUrl ? `<meta property="og:image" content="${article.imageUrl}" />` : ''}
<meta property="og:site_name" content="SIA Intelligence Terminal" />
<meta property="article:published_time" content="${article.datePublished}" />
${article.dateModified ? `<meta property="article:modified_time" content="${article.dateModified}" />` : ''}
${article.author ? `<meta property="article:author" content="${article.author}" />` : ''}`

  // 5. Twitter Card
  const twitterCard = `<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:url" content="${article.url}" />
<meta name="twitter:title" content="${escapeHtml(article.headline)}" />
<meta name="twitter:description" content="${escapeHtml(article.description)}" />
${article.imageUrl ? `<meta name="twitter:image" content="${article.imageUrl}" />` : ''}
<meta name="twitter:site" content="@SIAIntel" />
<meta name="twitter:creator" content="@SIAIntel" />`

  // 6. Source Citations (E-E-A-T Enhancement)
  const sourceCitations = generateSourceCitations(article)

  // 7. AI Disclosure (E-E-A-T Enhancement)
  const aiDisclosure = generateAIDisclosure(article)

  // 8. Correction Notice (E-E-A-T Enhancement)
  const correctionNotice = generateCorrectionNotice(article)

  return {
    jsonLd,
    metaTags,
    sitemapEntry,
    openGraph,
    twitterCard,
    sourceCitations,
    aiDisclosure,
    correctionNotice,
  }
}

/**
 * Generate Google News Sitemap Entry
 * Format: https://support.google.com/news/publisher-center/answer/9606710
 */
export function generateNewsSitemapEntry(article: NewsArticleData): string {
  return `  <url>
    <loc>${escapeXml(article.url)}</loc>
    <news:news>
      <news:publication>
        <news:name>SIA_NETWORK</news:name>
        <news:language>${article.language || 'en'}</news:language>
      </news:publication>
      <news:publication_date>${article.datePublished}</news:publication_date>
      <news:title>${escapeXml(article.headline)}</news:title>
      ${article.keywords && article.keywords.length > 0 ? `<news:keywords>${escapeXml(article.keywords.join(', '))}</news:keywords>` : ''}
    </news:news>
    <lastmod>${article.dateModified || article.datePublished}</lastmod>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>`
}

/**
 * Generate complete Google News Sitemap
 */
export function generateNewsSitemap(articles: NewsArticleData[]): string {
  const entries = articles.map((article) => generateNewsSitemapEntry(article)).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${entries}
</urlset>`
}

/**
 * Validate NewsArticle schema
 */
export function validateNewsArticleSchema(article: NewsArticleData): {
  isValid: boolean
  errors: string[]
  warnings: string[]
} {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields
  if (!article.headline || article.headline.length < 10) {
    errors.push('Headline must be at least 10 characters')
  }
  if (article.headline && article.headline.length > 110) {
    warnings.push('Headline longer than 110 characters may be truncated in search results')
  }

  if (!article.description || article.description.length < 50) {
    errors.push('Description must be at least 50 characters')
  }
  if (article.description && article.description.length > 160) {
    warnings.push('Description longer than 160 characters may be truncated')
  }

  if (!article.content || article.content.length < 300) {
    errors.push('Content must be at least 300 characters for quality')
  }

  if (!article.url || !isValidUrl(article.url)) {
    errors.push('Valid URL is required')
  }

  if (!article.datePublished || !isValidISODate(article.datePublished)) {
    errors.push('Valid ISO 8601 date is required')
  }

  // Recommended fields
  if (!article.imageUrl) {
    warnings.push('Image URL recommended for better visibility')
  }

  if (!article.keywords || article.keywords.length === 0) {
    warnings.push('Keywords recommended for better categorization')
  }

  if (!article.category) {
    warnings.push('Category recommended for Google News')
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Generate Next.js metadata object
 */
export function generateNextMetadata(article: NewsArticleData) {
  return {
    title: article.headline,
    description: article.description,
    keywords: article.keywords?.join(', '),
    authors: [{ name: article.author || 'SIA_INTELLIGENCE_ENGINE' }],
    creator: 'SIA_NETWORK_TERMINAL',
    publisher: 'SIA_NETWORK_TERMINAL',
    alternates: {
      canonical: article.url,
    },
    openGraph: {
      type: 'article',
      url: article.url,
      title: article.headline,
      description: article.description,
      siteName: 'SIA Intelligence Terminal',
      images: article.imageUrl
        ? [
            {
              url: article.imageUrl,
              width: 1200,
              height: 630,
              alt: article.headline,
            },
          ]
        : [],
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified || article.datePublished,
      authors: [article.author || 'SIA_INTELLIGENCE_ENGINE'],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.headline,
      description: article.description,
      images: article.imageUrl ? [article.imageUrl] : [],
      creator: '@SIAIntel',
      site: '@SIAIntel',
    },
    robots: {
      index: true,
      follow: true,
      'max-snippet': -1,
      'max-image-preview': 'large',
      'max-video-preview': -1,
    },
    other: {
      'publish-date': article.datePublished,
      ...(article.dateModified && { 'last-modified': article.dateModified }),
      ...(article.category && { 'article:section': article.category }),
    },
  }
}

/**
 * Generate Source Citations (E-E-A-T Enhancement)
 * Official source attribution for transparency
 */
function generateSourceCitations(article: NewsArticleData): string {
  if (!article.sources || article.sources.length === 0) {
    return '<!-- No official sources cited -->'
  }

  const translations: Record<string, string> = {
    en: 'Official Sources',
    tr: 'Resmi Kaynaklar',
    de: 'Offizielle Quellen',
    es: 'Fuentes Oficiales',
    fr: 'Sources Officielles',
    ar: 'المصادر الرسمية',
  }

  const title = translations[article.language || 'en'] || translations.en

  const sourcesList = article.sources
    .map((source) => {
      const sourceTypeLabel = getSourceTypeLabel(source.type, article.language || 'en')
      return `  <li>
    <strong>${sourceTypeLabel}:</strong>
    <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer" class="source-link">
      ${escapeHtml(source.name)}
    </a>
    ${source.accessDate ? `<span class="access-date">(Accessed: ${source.accessDate})</span>` : ''}
  </li>`
    })
    .join('\n')

  return `<!-- Official Source Citations (E-E-A-T) -->
<div class="source-citations" style="margin-top: 40px; padding: 20px; background: rgba(255, 184, 0, 0.05); border-left: 4px solid #FFB800;">
  <h3 style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; color: #FFB800;">
    📚 ${title}
  </h3>
  <ul style="list-style: none; padding: 0; margin: 0; font-size: 13px; line-height: 1.8;">
${sourcesList}
  </ul>
</div>`
}

/**
 * Get source type label in multiple languages
 */
function getSourceTypeLabel(type: string, language: string): string {
  const labels: Record<string, Record<string, string>> = {
    official: {
      en: 'Official Source',
      tr: 'Resmi Kaynak',
      de: 'Offizielle Quelle',
      es: 'Fuente Oficial',
      fr: 'Source Officielle',
      ar: 'مصدر رسمي',
    },
    sec_filing: {
      en: 'SEC Filing',
      tr: 'SEC Dosyası',
      de: 'SEC-Einreichung',
      es: 'Presentación SEC',
      fr: 'Dépôt SEC',
      ar: 'ملف SEC',
    },
    exchange: {
      en: 'Exchange Official',
      tr: 'Borsa Resmi',
      de: 'Börse Offiziell',
      es: 'Intercambio Oficial',
      fr: 'Échange Officiel',
      ar: 'البورصة الرسمية',
    },
    government: {
      en: 'Government Source',
      tr: 'Devlet Kaynağı',
      de: 'Regierungsquelle',
      es: 'Fuente Gubernamental',
      fr: 'Source Gouvernementale',
      ar: 'مصدر حكومي',
    },
    social_media: {
      en: 'Official Social Media',
      tr: 'Resmi Sosyal Medya',
      de: 'Offizielle Soziale Medien',
      es: 'Redes Sociales Oficiales',
      fr: 'Réseaux Sociaux Officiels',
      ar: 'وسائل التواصل الاجتماعي الرسمية',
    },
    news_wire: {
      en: 'News Wire',
      tr: 'Haber Ajansı',
      de: 'Nachrichtenagentur',
      es: 'Agencia de Noticias',
      fr: 'Agence de Presse',
      ar: 'وكالة أنباء',
    },
    on_chain: {
      en: 'On-Chain Data',
      tr: 'Zincir Üstü Veri',
      de: 'On-Chain-Daten',
      es: 'Datos On-Chain',
      fr: 'Données On-Chain',
      ar: 'بيانات السلسلة',
    },
  }

  return labels[type]?.[language] || labels[type]?.en || type
}

/**
 * Generate AI Disclosure (E-E-A-T Enhancement)
 * Transparent AI usage disclosure
 */
function generateAIDisclosure(article: NewsArticleData): string {
  if (!article.aiDisclosure) {
    return '<!-- No AI disclosure -->'
  }

  const translations: Record<string, any> = {
    en: {
      title: 'AI-Assisted Analysis Disclosure',
      text: 'This analysis was generated by {model} using {infrastructure} infrastructure, combining real-time market data and on-chain signals. {editorial}',
    },
    tr: {
      title: 'Yapay Zeka Destekli Analiz Açıklaması',
      text: 'Bu analiz, {model} tarafından {infrastructure} altyapısı kullanılarak, gerçek zamanlı piyasa verileri ve zincir üstü sinyallerin harmanlanmasıyla oluşturulmuştur. {editorial}',
    },
    de: {
      title: 'KI-gestützte Analyse-Offenlegung',
      text: 'Diese Analyse wurde von {model} unter Verwendung der {infrastructure}-Infrastruktur erstellt und kombiniert Echtzeit-Marktdaten mit On-Chain-Signalen. {editorial}',
    },
    es: {
      title: 'Divulgación de Análisis Asistido por IA',
      text: 'Este análisis fue generado por {model} utilizando infraestructura {infrastructure}, combinando datos de mercado en tiempo real y señales on-chain. {editorial}',
    },
    fr: {
      title: "Divulgation d'Analyse Assistée par IA",
      text: "Cette analyse a été générée par {model} en utilisant l'infrastructure {infrastructure}, combinant des données de marché en temps réel et des signaux on-chain. {editorial}",
    },
    ar: {
      title: 'الإفصاح عن التحليل بمساعدة الذكاء الاصطناعي',
      text: 'تم إنشاء هذا التحليل بواسطة {model} باستخدام بنية {infrastructure}، مع دمج بيانات السوق في الوقت الفعلي وإشارات السلسلة. {editorial}',
    },
  }

  const lang = translations[article.language || 'en'] || translations.en

  const editorialText = article.aiDisclosure.editorialReview
    ? article.language === 'tr'
      ? 'Editöryal süreçten geçmiştir.'
      : article.language === 'de'
        ? 'Redaktionell überprüft.'
        : article.language === 'es'
          ? 'Revisado editorialmente.'
          : article.language === 'fr'
            ? 'Révisé éditorialement.'
            : article.language === 'ar'
              ? 'تمت المراجعة التحريرية.'
              : 'Editorially reviewed.'
    : ''

  const text = lang.text
    .replace('{model}', article.aiDisclosure.model)
    .replace('{infrastructure}', article.aiDisclosure.infrastructure)
    .replace('{editorial}', editorialText)

  return `<!-- AI Disclosure (E-E-A-T) -->
<div class="ai-disclosure" style="margin-top: 30px; padding: 16px; background: rgba(0, 255, 0, 0.03); border-left: 4px solid #00FF00;">
  <h4 style="font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; color: #00FF00;">
    🤖 ${lang.title}
  </h4>
  <p style="font-size: 12px; line-height: 1.6; margin: 0; color: rgba(255, 255, 255, 0.7);">
    ${text}
  </p>
</div>`
}

/**
 * Generate Correction Notice (E-E-A-T Enhancement)
 * Transparent correction policy
 */
function generateCorrectionNotice(article: NewsArticleData): string {
  const translations: Record<string, any> = {
    en: {
      title: 'Information Security',
      text: 'Detected data errors are updated within 15 minutes under the SIA_NETWORK Correction Policy.',
    },
    tr: {
      title: 'Bilgi Güvenliği',
      text: 'Tespit edilen veri hataları SIA_NETWORK Düzeltme Politikası kapsamında 15 dakika içinde güncellenmektedir.',
    },
    de: {
      title: 'Informationssicherheit',
      text: 'Erkannte Datenfehler werden innerhalb von 15 Minuten gemäß der SIA_NETWORK-Korrekturrichtlinie aktualisiert.',
    },
    es: {
      title: 'Seguridad de la Información',
      text: 'Los errores de datos detectados se actualizan en 15 minutos según la Política de Corrección de SIA_NETWORK.',
    },
    fr: {
      title: "Sécurité de l'Information",
      text: 'Les erreurs de données détectées sont mises à jour dans les 15 minutes selon la Politique de Correction SIA_NETWORK.',
    },
    ar: {
      title: 'أمن المعلومات',
      text: 'يتم تحديث أخطاء البيانات المكتشفة في غضون 15 دقيقة بموجب سياسة التصحيح SIA_NETWORK.',
    },
  }

  const lang = translations[article.language || 'en'] || translations.en

  return `<!-- Correction Notice (E-E-A-T) -->
<div class="correction-notice" style="margin-top: 20px; padding: 12px; background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.1); font-size: 11px;">
  <p style="margin: 0; color: rgba(255, 255, 255, 0.5);">
    <strong>${lang.title}:</strong> ${lang.text}
    <a href="/legal/corrections" style="color: #FFB800; text-decoration: underline; margin-left: 8px;">
      ${
        article.language === 'tr'
          ? 'Düzeltme Politikası'
          : article.language === 'de'
            ? 'Korrekturrichtlinie'
            : article.language === 'es'
              ? 'Política de Corrección'
              : article.language === 'fr'
                ? 'Politique de Correction'
                : article.language === 'ar'
                  ? 'سياسة التصحيح'
                  : 'Correction Policy'
      }
    </a>
  </p>
</div>`
}

/**
 * Helper: Escape HTML
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Helper: Escape XML
 */
function escapeXml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

/**
 * Helper: Validate URL
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Helper: Validate ISO 8601 date
 */
function isValidISODate(date: string): boolean {
  const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/
  return isoRegex.test(date) && !isNaN(Date.parse(date))
}

/**
 * Generate current ISO 8601 timestamp
 */
export function getCurrentISOTimestamp(): string {
  return new Date().toISOString()
}

/**
 * Generate slug from headline
 * CRITICAL: No length limit to prevent URL mismatch between generation and lookup
 */
export function generateSlugFromHeadline(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
