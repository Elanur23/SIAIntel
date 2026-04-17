import type {
  HeadlineResolvedSurface,
  HeadlineTitleSurfaceCalibration,
  HeadlineTitleSurfaceAssessment,
  LanguageEdition,
  TitleSurfaceName
} from '../core-types'

const DEFAULT_TITLE_SURFACE_CALIBRATION: HeadlineTitleSurfaceCalibration = {
  minLexicalOverlap: 0.3,
  certaintySkewOverlapGuard: 0.6,
  maxAllowedInconsistentPairs: 2
}

function safeText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function tokenize(value: string): string[] {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'that', 'this', 'will', 'into', 'your', 'their',
    'market', 'news', 'update', 'analysis', 'report',
    'de', 'la', 'el', 'los', 'las', 'del', 'para', 'con', 'una', 'un', 'que'
  ])

  const normalized = value.toLowerCase().normalize('NFKC')
  const rawTokens = normalized.match(/[\p{L}\p{N}]+/gu) || []

  const tokens: string[] = []
  for (const token of rawTokens) {
    if (stopWords.has(token)) {
      continue
    }

    if (/[\u3040-\u30ff\u3400-\u9fff]/u.test(token)) {
      const compact = token.replace(/\s+/g, '')
      if (compact.length <= 2) {
        tokens.push(compact)
        continue
      }

      for (let i = 0; i <= compact.length - 2; i += 1) {
        tokens.push(compact.slice(i, i + 2))
      }
      continue
    }

    if (token.length > 2) {
      tokens.push(token)
    }
  }

  return tokens
}

function overlapScore(left: string, right: string): number {
  const leftTokens = tokenize(left)
  const rightTokens = new Set(tokenize(right))

  if (leftTokens.length === 0 || rightTokens.size === 0) {
    return 0
  }

  let overlap = 0
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1
    }
  }

  return Number((overlap / leftTokens.length).toFixed(2))
}

function extractNumericTokens(value: string): string[] {
  return (value.match(/\b\d+(?:\.\d+)?%?\b/g) || []).map(token => token.toUpperCase())
}

function extractDateTokens(value: string): string[] {
  const canonical = value.match(/\b(?:20\d{2}|19\d{2}|Q[1-4]|JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/gi) || []
  const numericDate = value.match(/\b\d{1,2}[\/-]\d{1,2}(?:[\/-]\d{2,4})?\b/g) || []
  const japaneseDate = value.match(/20\d{2}年|\d{1,2}月|\d{1,2}日/g) || []

  return [...canonical, ...numericDate, ...japaneseDate].map(token => token.toUpperCase())
}

function hasCertaintyAmplifier(value: string): boolean {
  return /(guaranteed|certain|certainly|definitive|will\s+always|no\s+risk|100%|garantizado|garantiza|sin\s+riesgo|certeza|definitivo|確実|保証|必ず|断定|リスクゼロ)/iu.test(value)
}

function resolveSurface(
  surface: TitleSurfaceName,
  explicitValue: string,
  fallbackValue: string
): HeadlineResolvedSurface {
  const explicit = safeText(explicitValue)
  const fallback = safeText(fallbackValue)

  if (explicit.length > 0) {
    return {
      surface,
      value: explicit,
      source: 'explicit'
    }
  }

  return {
    surface,
    value: fallback,
    source: 'fallback'
  }
}

function getSchemaValue(schema: Record<string, unknown>, path: string[]): string {
  let cursor: unknown = schema
  for (const segment of path) {
    if (!cursor || typeof cursor !== 'object') {
      return ''
    }
    cursor = (cursor as Record<string, unknown>)[segment]
  }
  return safeText(cursor)
}

export function resolveHeadlineTitleSurfaceAssessment(
  edition: LanguageEdition,
  calibration?: HeadlineTitleSurfaceCalibration
): HeadlineTitleSurfaceAssessment {
  const activeCalibration: HeadlineTitleSurfaceCalibration = {
    ...DEFAULT_TITLE_SURFACE_CALIBRATION,
    ...(calibration || {})
  }

  const editorialHeadline = safeText(edition?.content?.title)
  const schema = (edition?.content?.schema && typeof edition.content.schema === 'object'
    ? edition.content.schema
    : {}) as Record<string, unknown>

  const canonicalTitle = resolveSurface(
    'CANONICAL_TITLE',
    getSchemaValue(schema, ['headline']),
    editorialHeadline
  )

  const seoTitle = resolveSurface(
    'SEO_TITLE',
    getSchemaValue(schema, ['seoTitle']) || getSchemaValue(schema, ['seo', 'title']) || getSchemaValue(schema, ['meta', 'title']),
    canonicalTitle.value
  )

  const ogTitle = resolveSurface(
    'OG_TITLE',
    getSchemaValue(schema, ['openGraph', 'title']) || getSchemaValue(schema, ['ogTitle']) || getSchemaValue(schema, ['og', 'title']),
    seoTitle.value
  )

  const socialTitle = resolveSurface(
    'SOCIAL_TITLE',
    getSchemaValue(schema, ['social', 'title']) || getSchemaValue(schema, ['twitter', 'title']) || getSchemaValue(schema, ['socialTitle']),
    ogTitle.value
  )

  const homepageTitle = resolveSurface(
    'HOMEPAGE_TITLE',
    getSchemaValue(schema, ['homepageTitle']) || getSchemaValue(schema, ['homepage', 'title']),
    editorialHeadline
  )

  const editorialSurface: HeadlineResolvedSurface = {
    surface: 'EDITORIAL_HEADLINE',
    value: editorialHeadline,
    source: 'explicit'
  }

  const resolvedSurfaces = [
    editorialSurface,
    canonicalTitle,
    seoTitle,
    ogTitle,
    socialTitle,
    homepageTitle
  ]

  const deterministicFallbacksApplied = resolvedSurfaces
    .filter(surface => surface.source === 'fallback')
    .map(surface => surface.surface)

  const inconsistentPairs: HeadlineTitleSurfaceAssessment['inconsistentPairs'] = []

  for (let i = 0; i < resolvedSurfaces.length; i += 1) {
    for (let j = i + 1; j < resolvedSurfaces.length; j += 1) {
      const left = resolvedSurfaces[i]
      const right = resolvedSurfaces[j]

      if (!left.value || !right.value) {
        continue
      }

      const lexicalOverlap = overlapScore(left.value, right.value)
      const leftNumbers = extractNumericTokens(left.value)
      const rightNumbers = extractNumericTokens(right.value)
      const leftDates = extractDateTokens(left.value)
      const rightDates = extractDateTokens(right.value)

      const numberMismatch = leftNumbers.some(token => !rightNumbers.includes(token))
      const dateMismatch = leftDates.some(token => !rightDates.includes(token))
      const certaintySkew = hasCertaintyAmplifier(left.value) !== hasCertaintyAmplifier(right.value)

      if (numberMismatch || dateMismatch) {
        inconsistentPairs.push({
          left: left.surface,
          right: right.surface,
          reason: 'Numeric or date fact mismatch across title surfaces'
        })
        continue
      }

      if (lexicalOverlap < activeCalibration.minLexicalOverlap) {
        inconsistentPairs.push({
          left: left.surface,
          right: right.surface,
          reason: `Low thesis overlap across title surfaces (overlap=${lexicalOverlap}).`
        })
        continue
      }

      if (certaintySkew && lexicalOverlap < activeCalibration.certaintySkewOverlapGuard) {
        inconsistentPairs.push({
          left: left.surface,
          right: right.surface,
          reason: `Certainty amplification mismatch across title surfaces (overlap=${lexicalOverlap}).`
        })
      }
    }
  }

  const editorialComparisons = resolvedSurfaces
    .filter(surface => surface.surface !== 'EDITORIAL_HEADLINE')
    .map(surface => overlapScore(editorialHeadline, surface.value))

  const sharedThesisScore = editorialComparisons.length > 0
    ? Number((editorialComparisons.reduce((sum, value) => sum + value, 0) / editorialComparisons.length).toFixed(2))
    : 0

  return {
    resolvedSurfaces,
    sharedThesisScore,
    inconsistentPairs,
    deterministicFallbacksApplied,
    calibration: { ...activeCalibration }
  }
}
