/**
 * SEO Generator
 * Generates SEO metadata, slugs, and structured data for all languages
 * Integrates with existing SEO services
 */

import { generateSlug, generateMultilingualUrls } from '@/lib/seo/url-slug-engine'
import { generateAllLanguageMetadata } from '@/lib/seo/multilingual-metadata-generator'
import type {
  Language,
  TranslatedContent,
  SEOPackage,
  MetadataPackage,
  StructuredDataSchema,
  HreflangTag,
  OpenGraphData,
  TwitterCardData,
} from './types'

export class SEOGenerator {
  private baseUrl: string

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
  }

  /**
   * Generate SEO packages for all languages
   */
  async generateForAllLanguages(
    translations: Record<Language, TranslatedContent>,
    articleId: string
  ): Promise<Record<Language, SEOPackage>> {
    const packages: Record<string, SEOPackage> = {}

    // Generate slugs for all languages
    const slugs = this.generateSlugs(translations)

    // Generate URLs
    const urls = this.generateUrls(articleId, slugs)

    // Generate hreflang tags
    const hreflangTags = this.generateHreflangTags(urls)

    // Generate packages for each language
    for (const [lang, translation] of Object.entries(translations)) {
      const language = lang as Language

      packages[lang] = {
        slug: slugs[language],
        canonicalUrl: urls[language],
        metadata: await this.generateMetadata(translation, language),
        structuredData: this.generateStructuredData(
          translation,
          language,
          urls[language]
        ),
        hreflangTags,
        openGraph: this.generateOpenGraph(translation, language, urls[language]),
        twitterCard: this.generateTwitterCard(translation, language),
      }
    }

    return packages as Record<Language, SEOPackage>
  }

  /**
   * Generate slugs for all languages
   */
  private generateSlugs(
    translations: Record<Language, TranslatedContent>
  ): Record<Language, string> {
    const slugs: Record<string, string> = {}

    for (const [lang, translation] of Object.entries(translations)) {
      slugs[lang] = generateSlug(translation.title, lang as Language, {
        maxLength: 60,
      })
    }

    return slugs as Record<Language, string>
  }

  /**
   * Generate URLs for all languages
   */
  private generateUrls(
    articleId: string,
    slugs: Record<Language, string>
  ): Record<Language, string> {
    const urls: Record<string, string> = {}

    for (const [lang, slug] of Object.entries(slugs)) {
      urls[lang] = `${this.baseUrl}/${lang}/news/${articleId}-${slug}`
    }

    return urls as Record<Language, string>
  }

  /**
   * Generate hreflang tags for all language versions
   */
  private generateHreflangTags(
    urls: Record<Language, string>
  ): HreflangTag[] {
    return Object.entries(urls).map(([lang, url]) => ({
      lang: lang as Language,
      url,
    }))
  }

  /**
   * Generate metadata for a single language
   */
  private async generateMetadata(
    translation: TranslatedContent,
    language: Language
  ): Promise<MetadataPackage> {
    return {
      title: translation.title,
      description: translation.metaDescription,
      keywords: translation.keywords,
      author: 'SIA Intelligence',
      publishedTime: new Date().toISOString(),
      modifiedTime: new Date().toISOString(),
    }
  }

  /**
   * Generate structured data (JSON-LD) for NewsArticle
   */
  private generateStructuredData(
    translation: TranslatedContent,
    language: Language,
    url: string
  ): StructuredDataSchema {
    return {
      '@context': 'https://schema.org',
      '@type': 'NewsArticle',
      headline: translation.title,
      description: translation.summary,
      author: {
        '@type': 'Organization',
        name: 'SIA Intelligence',
      },
      publisher: {
        '@type': 'Organization',
        name: 'SIA Intelligence',
        logo: {
          '@type': 'ImageObject',
          url: `${this.baseUrl}/logo.png`,
        },
      },
      datePublished: new Date().toISOString(),
      dateModified: new Date().toISOString(),
      mainEntityOfPage: url,
    }
  }

  /**
   * Generate Open Graph metadata
   */
  private generateOpenGraph(
    translation: TranslatedContent,
    language: Language,
    url: string
  ): OpenGraphData {
    const localeMap: Record<Language, string> = {
      en: 'en_US',
      tr: 'tr_TR',
      de: 'de_DE',
      fr: 'fr_FR',
      es: 'es_ES',
      ru: 'ru_RU',
      ar: 'ar_AE',
      jp: 'ja_JP',
      zh: 'zh_CN',
    }

    return {
      title: translation.title,
      description: translation.metaDescription,
      type: 'article',
      url,
      locale: localeMap[language],
    }
  }

  /**
   * Generate Twitter Card metadata
   */
  private generateTwitterCard(
    translation: TranslatedContent,
    language: Language
  ): TwitterCardData {
    return {
      card: 'summary_large_image',
      title: translation.title,
      description: translation.metaDescription,
    }
  }

  /**
   * Validate SEO package
   */
  validatePackage(seoPackage: SEOPackage): {
    valid: boolean
    issues: string[]
  } {
    const issues: string[] = []

    // Validate slug
    if (!seoPackage.slug || seoPackage.slug.length === 0) {
      issues.push('Slug is empty')
    }

    if (seoPackage.slug.length > 60) {
      issues.push('Slug exceeds 60 characters')
    }

    // Validate metadata
    if (seoPackage.metadata.description.length !== 160) {
      issues.push(
        `Meta description is ${seoPackage.metadata.description.length} chars (should be exactly 160)`
      )
    }

    if (seoPackage.metadata.keywords.length < 3) {
      issues.push('Less than 3 keywords provided')
    }

    // Validate canonical URL
    if (!seoPackage.canonicalUrl.startsWith('https://')) {
      issues.push('Canonical URL must use HTTPS')
    }

    // Validate hreflang tags
    if (seoPackage.hreflangTags.length < 9) {
      issues.push('Missing hreflang tags for some languages')
    }

    return {
      valid: issues.length === 0,
      issues,
    }
  }

  /**
   * Calculate SEO optimization score
   */
  calculateSEOScore(seoPackage: SEOPackage): number {
    let score = 100

    // Slug quality (20 points)
    if (seoPackage.slug.length > 60) score -= 10
    if (seoPackage.slug.length < 20) score -= 5
    if (!seoPackage.slug.includes('-')) score -= 5

    // Meta description (20 points)
    if (seoPackage.metadata.description.length !== 160) score -= 10
    if (!seoPackage.metadata.description.includes('%')) score -= 5
    if (!seoPackage.metadata.description.match(/\d+/)) score -= 5

    // Keywords (20 points)
    if (seoPackage.metadata.keywords.length < 5) score -= 10
    if (seoPackage.metadata.keywords.length > 10) score -= 5

    // Structured data (20 points)
    if (!seoPackage.structuredData['@context']) score -= 10
    if (!seoPackage.structuredData.headline) score -= 5
    if (!seoPackage.structuredData.author) score -= 5

    // Hreflang tags (20 points)
    if (seoPackage.hreflangTags.length < 9) score -= 10
    if (seoPackage.hreflangTags.length === 0) score -= 20

    return Math.max(0, score)
  }
}

// Singleton instance
let seoGeneratorInstance: SEOGenerator | null = null

export function getSEOGenerator(): SEOGenerator {
  if (!seoGeneratorInstance) {
    seoGeneratorInstance = new SEOGenerator()
  }
  return seoGeneratorInstance
}
