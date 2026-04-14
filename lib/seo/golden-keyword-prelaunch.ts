export type GoldenKeywordStatus =
  | 'not-applicable'
  | 'missing'
  | 'partial'
  | 'aligned'
  | 'stuffing-risk'

export interface GoldenKeywordCoverage {
  inHeadline: boolean
  inSummary: boolean
  inFirstParagraph: boolean
  repetitionCount: number
}

export interface GoldenKeywordAdvisory {
  eligible: boolean
  locale: string
  category: string
  primaryKeyword: string | null
  keywordSource: 'category' | 'content' | null
  candidateKeywords: string[]
  firstParagraph: string
  coverage: GoldenKeywordCoverage | null
  status: GoldenKeywordStatus
  recommendations: string[]
}

interface GoldenKeywordInput {
  routeLang: string
  category?: string | null
  title?: string | null
  summary?: string | null
  content?: string | null
}

const GOLDEN_KEYWORD_ELIGIBLE_LOCALES = new Set<string>(['en'])

const CATEGORY_GOLDEN_KEYWORDS: Record<string, string[]> = {
  AI: ['artificial intelligence', 'ai model', 'chip demand', 'inference'],
  CRYPTO: ['bitcoin', 'crypto market', 'on-chain', 'etf flow'],
  STOCKS: ['equity market', 'earnings', 'stock outlook', 'valuation'],
  ECONOMY: ['inflation', 'interest rate', 'economic growth', 'labor market'],
  MACRO: ['central bank', 'liquidity', 'yield', 'macro outlook'],
  MARKET: ['market outlook', 'risk sentiment', 'volatility', 'institutional flow'],
  FOREX: ['currency market', 'dollar index', 'fx outlook', 'exchange rate'],
  COMMODITIES: ['oil price', 'gold market', 'commodity demand', 'supply shock'],
  TECH: ['technology sector', 'semiconductor', 'cloud demand', 'software growth'],
  GENERAL: ['market outlook', 'financial intelligence', 'risk signal'],
}

const CONTENT_KEYWORD_STOPWORDS = new Set<string>([
  'this',
  'that',
  'with',
  'from',
  'have',
  'into',
  'about',
  'after',
  'before',
  'through',
  'under',
  'over',
  'between',
  'news',
  'report',
  'analysis',
  'market',
  'intelligence',
  'live',
  'runtime',
  'validation',
  'controlled',
  'publish',
])

function normalizeWhitespace(value: string | null | undefined): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.replace(/\s+/g, ' ').trim()
}

function normalizeCategory(value: string | null | undefined): string {
  const normalized = normalizeWhitespace(value).toUpperCase()
  if (!normalized) {
    return 'GENERAL'
  }

  if (normalized.startsWith('CRYPTO')) return 'CRYPTO'
  if (normalized.includes('STOCK') || normalized === 'MARKET') return normalized.includes('STOCK') ? 'STOCKS' : 'MARKET'
  if (normalized.includes('ECONOMY')) return 'ECONOMY'

  return CATEGORY_GOLDEN_KEYWORDS[normalized] ? normalized : 'GENERAL'
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function countPhraseOccurrences(source: string, phrase: string): number {
  const normalizedSource = normalizeWhitespace(source).toLowerCase()
  const normalizedPhrase = normalizeWhitespace(phrase).toLowerCase()

  if (!normalizedSource || !normalizedPhrase) {
    return 0
  }

  const pattern = new RegExp(`\\b${escapeRegExp(normalizedPhrase)}\\b`, 'gi')
  const matches = normalizedSource.match(pattern)
  return matches ? matches.length : 0
}

function stripMarkup(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\*\*/g, ' ')
    .replace(/[_`~>#]/g, ' ')
}

function truncateAtSentenceBoundary(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value
  }

  const cut = value.slice(0, maxLength)
  const boundary = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('! '), cut.lastIndexOf('? '))
  if (boundary > 80) {
    return cut.slice(0, boundary + 1).trim()
  }

  return `${cut.trimEnd()}...`
}

function deriveContentKeywordCandidates(values: string[]): string[] {
  const frequency = new Map<string, number>()

  for (const value of values) {
    const normalized = normalizeWhitespace(value).toLowerCase()
    if (!normalized) continue

    const tokens = normalized.match(/[a-z][a-z0-9-]{3,}/g) || []
    for (const token of tokens) {
      if (CONTENT_KEYWORD_STOPWORDS.has(token)) continue
      frequency.set(token, (frequency.get(token) || 0) + 1)
    }
  }

  return Array.from(frequency.entries())
    .filter(([, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token)
    .slice(0, 4)
}

export function isGoldenKeywordEligibleLocale(routeLang: string): boolean {
  return GOLDEN_KEYWORD_ELIGIBLE_LOCALES.has(normalizeWhitespace(routeLang).toLowerCase())
}

export function extractArticleFirstParagraph(
  content: string | null | undefined,
  maxLength = 280
): string {
  if (typeof content !== 'string' || !content.trim()) {
    return ''
  }

  const cleaned = stripMarkup(content)
    .replace(/\r\n/g, '\n')
    .replace(/\t/g, ' ')
    .trim()

  if (!cleaned) {
    return ''
  }

  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((paragraph) => normalizeWhitespace(paragraph))
    .filter((paragraph) => paragraph.length >= 40)

  const firstParagraph = paragraphs[0] || cleaned
  return truncateAtSentenceBoundary(firstParagraph, maxLength)
}

export function buildVisibleSummaryWithIntroFallback(params: {
  summary: string | null | undefined
  content: string | null | undefined
  maxLength?: number
}): string {
  const summary = normalizeWhitespace(params.summary)
  if (summary) {
    return summary
  }

  return extractArticleFirstParagraph(params.content, params.maxLength ?? 220)
}

export function buildGoldenKeywordAdvisory(input: GoldenKeywordInput): GoldenKeywordAdvisory {
  const locale = normalizeWhitespace(input.routeLang).toLowerCase() || 'en'
  const category = normalizeCategory(input.category)
  const title = normalizeWhitespace(input.title)
  const summary = normalizeWhitespace(input.summary)
  const firstParagraph = extractArticleFirstParagraph(input.content)
  const categoryCandidates = CATEGORY_GOLDEN_KEYWORDS[category] || CATEGORY_GOLDEN_KEYWORDS.GENERAL
  const contentCandidates = deriveContentKeywordCandidates([title, summary, firstParagraph])
  const candidateKeywords = Array.from(new Set([...categoryCandidates, ...contentCandidates]))

  if (!isGoldenKeywordEligibleLocale(locale)) {
    return {
      eligible: false,
      locale,
      category,
      primaryKeyword: null,
      keywordSource: null,
      candidateKeywords,
      firstParagraph,
      coverage: null,
      status: 'not-applicable',
      recommendations: ['Pre-launch golden keyword layer is currently scoped to English only.'],
    }
  }

  type CoverageScore = {
    keyword: string
    coverage: GoldenKeywordCoverage
    surfaceCount: number
  }

  const allText = [title, summary, firstParagraph].join(' ')

  const scored = candidateKeywords
    .map<CoverageScore>((keyword) => {
      const inHeadline = countPhraseOccurrences(title, keyword) > 0
      const inSummary = countPhraseOccurrences(summary, keyword) > 0
      const inFirstParagraph = countPhraseOccurrences(firstParagraph, keyword) > 0
      const repetitionCount = countPhraseOccurrences(allText, keyword)
      const surfaceCount = Number(inHeadline) + Number(inSummary) + Number(inFirstParagraph)

      return {
        keyword,
        coverage: {
          inHeadline,
          inSummary,
          inFirstParagraph,
          repetitionCount,
        },
        surfaceCount,
      }
    })
    .sort((a, b) => {
      if (b.surfaceCount !== a.surfaceCount) return b.surfaceCount - a.surfaceCount
      return b.coverage.repetitionCount - a.coverage.repetitionCount
    })

  const best = scored[0]
  if (!best || best.coverage.repetitionCount === 0) {
    return {
      eligible: true,
      locale,
      category,
      primaryKeyword: null,
      keywordSource: null,
      candidateKeywords,
      firstParagraph,
      coverage: null,
      status: 'missing',
      recommendations: [
        `If editorially accurate, naturally include one category-fit term in headline or summary: ${candidateKeywords
          .slice(0, 3)
          .join(', ')}.`,
      ],
    }
  }

  const coverage = best.coverage
  const repetitionCount = coverage.repetitionCount
  const keywordSource: 'category' | 'content' = categoryCandidates.includes(best.keyword)
    ? 'category'
    : 'content'
  const status: GoldenKeywordStatus =
    repetitionCount > 4
      ? 'stuffing-risk'
      : best.surfaceCount >= 2
        ? 'aligned'
        : 'partial'

  const recommendations: string[] = []
  if (status === 'stuffing-risk') {
    recommendations.push(
      `Reduce repetitions of "${best.keyword}" across headline, summary, and intro to keep phrasing natural.`
    )
  }
  if (status === 'partial') {
    if (!coverage.inSummary) {
      recommendations.push(
        `Consider mirroring "${best.keyword}" naturally in the visible summary when it improves clarity.`
      )
    }
    if (!coverage.inFirstParagraph) {
      recommendations.push(
        `Consider a natural mention of "${best.keyword}" in the first paragraph for intent clarity.`
      )
    }
  }
  if (status === 'aligned') {
    recommendations.push('Current keyword alignment is natural. No forced edits are needed.')
  }
  if (keywordSource === 'content' && status !== 'stuffing-risk') {
    recommendations.push(
      `Primary term "${best.keyword}" is content-driven; verify category/silo labeling still matches the article intent.`
    )
  }

  return {
    eligible: true,
    locale,
    category,
    primaryKeyword: best.keyword,
    keywordSource,
    candidateKeywords,
    firstParagraph,
    coverage,
    status,
    recommendations,
  }
}
