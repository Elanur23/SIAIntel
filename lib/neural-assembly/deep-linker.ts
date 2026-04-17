/**
 * DEEP LINKER / ARTICLE PATCHER
 * 
 * Automatically injects internal and cross-language links into articles
 * when Internal Link or Cross-Lang cells score below 7.0
 */

import type { Language } from '@/lib/store/language-store'

export interface LinkInjectionResult {
  internal_links_added: number
  cross_lang_links_added: number
  patches: Array<{
    type: 'internal' | 'cross_lang'
    anchor_text: string
    target_url: string
    position: number
  }>
  updated_content: string
}

export interface ArticleReference {
  id: string
  language: Language
  title: string
  slug: string
  keywords: string[]
  category: string
}

/**
 * Deep Linker Engine
 */
export class DeepLinker {
  private articles: ArticleReference[] = []

  /**
   * Load articles from workspace for link injection
   */
  async loadArticlesFromWorkspace(workspacePath: string = './ai_workspace.json'): Promise<void> {
    try {
      const fs = await import('fs/promises')
      const data = await fs.readFile(workspacePath, 'utf8')
      const workspace = JSON.parse(data.replace(/^\uFEFF/, ''))

      // Extract article references from workspace
      if (workspace.articles && Array.isArray(workspace.articles)) {
        this.articles = workspace.articles
          .filter((a: any) => a.status === 'sealed' || a.status === 'deployed')
          .map((a: any) => ({
            id: a.id,
            language: a.language || 'en',
            title: a.en?.title || a.title || 'Untitled',
            slug: this.generateSlug(a.en?.title || a.title || 'untitled'),
            keywords: this.extractKeywords(a.en?.content || a.content || ''),
            category: a.category || 'general',
          }))
      }

      console.log(`[DEEP_LINKER] Loaded ${this.articles.length} articles for link injection`)
    } catch (error) {
      console.error('[DEEP_LINKER] Failed to load workspace:', error)
      this.articles = []
    }
  }

  /**
   * Inject internal links into content
   */
  injectInternalLinks(
    content: string,
    currentArticleId: string,
    language: Language,
    targetCount: number = 3
  ): LinkInjectionResult {
    const patches: LinkInjectionResult['patches'] = []
    let updatedContent = content
    let linksAdded = 0

    // Find related articles in the same language
    const relatedArticles = this.articles
      .filter((a) => a.id !== currentArticleId && a.language === language)
      .slice(0, targetCount * 2) // Get more candidates

    // Extract keywords from current content
    const contentKeywords = this.extractKeywords(content)

    // Find best matching articles
    const matches = relatedArticles
      .map((article) => ({
        article,
        score: this.calculateRelevanceScore(contentKeywords, article.keywords),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, targetCount)

    // Inject links
    matches.forEach((match) => {
      if (linksAdded >= targetCount) return

      const { article } = match
      const anchorText = this.findBestAnchorText(content, article.keywords)

      if (anchorText) {
        const targetUrl = `/${language}/news/${article.slug}`
        const linkHtml = `<a href="${targetUrl}" class="internal-link">${anchorText}</a>`

        // Replace first occurrence of anchor text
        const position = updatedContent.indexOf(anchorText)
        if (position !== -1) {
          updatedContent =
            updatedContent.substring(0, position) +
            linkHtml +
            updatedContent.substring(position + anchorText.length)

          patches.push({
            type: 'internal',
            anchor_text: anchorText,
            target_url: targetUrl,
            position,
          })

          linksAdded++
        }
      }
    })

    return {
      internal_links_added: linksAdded,
      cross_lang_links_added: 0,
      patches,
      updated_content: updatedContent,
    }
  }

  /**
   * Inject cross-language links into content
   */
  injectCrossLanguageLinks(
    content: string,
    currentArticleId: string,
    currentLanguage: Language,
    targetCount: number = 2
  ): LinkInjectionResult {
    const patches: LinkInjectionResult['patches'] = []
    let updatedContent = content
    let linksAdded = 0

    // Find same article in other languages
    const otherLanguages = (['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'] as Language[]).filter(
      (lang) => lang !== currentLanguage
    )

    // For demo: inject links to top articles in other languages
    const crossLangArticles = this.articles
      .filter((a) => a.id !== currentArticleId && otherLanguages.includes(a.language))
      .slice(0, targetCount)

    crossLangArticles.forEach((article) => {
      if (linksAdded >= targetCount) return

      const targetUrl = `/${article.language}/news/${article.slug}`
      const languageFlag = this.getLanguageFlag(article.language)
      const linkHtml = `<a href="${targetUrl}" class="cross-lang-link" hreflang="${article.language}">${languageFlag} ${article.title}</a>`

      // Append cross-language links at the end of content
      updatedContent += `\n\n**Related in ${article.language.toUpperCase()}**: ${linkHtml}`

      patches.push({
        type: 'cross_lang',
        anchor_text: `${languageFlag} ${article.title}`,
        target_url: targetUrl,
        position: updatedContent.length,
      })

      linksAdded++
    })

    return {
      internal_links_added: 0,
      cross_lang_links_added: linksAdded,
      patches,
      updated_content: updatedContent,
    }
  }

  /**
   * Full patch: inject both internal and cross-language links
   */
  async patchArticle(
    content: string,
    articleId: string,
    language: Language,
    internalLinkTarget: number = 3,
    crossLangTarget: number = 2
  ): Promise<LinkInjectionResult> {
    // Load articles if not already loaded
    if (this.articles.length === 0) {
      await this.loadArticlesFromWorkspace()
    }

    // Inject internal links
    const internalResult = this.injectInternalLinks(content, articleId, language, internalLinkTarget)

    // Inject cross-language links
    const crossLangResult = this.injectCrossLanguageLinks(
      internalResult.updated_content,
      articleId,
      language,
      crossLangTarget
    )

    return {
      internal_links_added: internalResult.internal_links_added,
      cross_lang_links_added: crossLangResult.cross_lang_links_added,
      patches: [...internalResult.patches, ...crossLangResult.patches],
      updated_content: crossLangResult.updated_content,
    }
  }

  /**
   * Helper: Generate slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  /**
   * Helper: Extract keywords from content
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction (can be enhanced with NLP)
    const words = content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 4)

    // Get unique words
    return Array.from(new Set(words)).slice(0, 20)
  }

  /**
   * Helper: Calculate relevance score between two keyword sets
   */
  private calculateRelevanceScore(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1)
    const set2 = new Set(keywords2)
    const intersection = new Set([...set1].filter((x) => set2.has(x)))

    return intersection.size / Math.max(set1.size, set2.size)
  }

  /**
   * Helper: Find best anchor text from content based on keywords
   */
  private findBestAnchorText(content: string, keywords: string[]): string | null {
    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\w*\\b`, 'i')
      const match = content.match(regex)
      if (match) {
        return match[0]
      }
    }
    return null
  }

  /**
   * Helper: Get language flag emoji
   */
  private getLanguageFlag(language: Language): string {
    const flags: Record<Language, string> = {
      en: '🇺🇸',
      tr: '🇹🇷',
      de: '🇩🇪',
      fr: '🇫🇷',
      es: '🇪🇸',
      ru: '🇷🇺',
      ar: '🇦🇪',
      jp: '🇯🇵',
      zh: '🇨🇳',
    }
    return flags[language] || '🌐'
  }
}

/**
 * Singleton instance
 */
export const deepLinker = new DeepLinker()
