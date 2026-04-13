export interface VisibleDatasetMetric {
  key: string
  label: string
  value: string
  propertyValue: {
    '@type': 'PropertyValue'
    name: string
    value: string | number
    unitText?: string
  }
}

export interface VisibleDatasetSurface {
  selector: string
  title: string
  description: string
  metrics: VisibleDatasetMetric[]
  schema: Record<string, unknown>
}

const DATASET_ELIGIBLE_ROUTE_LOCALES = new Set<string>(['en'])

function normalizeSelector(selector: string): string {
  return selector.trim()
}

function normalizeNumericScore(value: number | null | undefined, max: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  if (value < 0 || value > max) {
    return null
  }

  return Math.round(value)
}

function normalizeTextValue(value: string | null | undefined): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

function normalizeIsoDate(value: string | null | undefined): string | null {
  if (!value) {
    return null
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return null
  }

  return parsed.toISOString()
}

export function buildDatasetForVisibleSignals(params: {
  routeLang: string
  articleUrl: string
  title: string
  summary: string | null | undefined
  selector: string
  category: string | null | undefined
  confidence: number | null | undefined
  impact: number | null | undefined
  signal: string | null | undefined
  publishedAtIso: string
  updatedAtIso: string
}): VisibleDatasetSurface | undefined {
  const routeLang = params.routeLang.toLowerCase()
  if (!DATASET_ELIGIBLE_ROUTE_LOCALES.has(routeLang)) {
    return undefined
  }

  const selector = normalizeSelector(params.selector)
  if (!selector || (!selector.startsWith('#') && !selector.startsWith('.'))) {
    return undefined
  }

  const publishedAtIso = normalizeIsoDate(params.publishedAtIso)
  const updatedAtIso = normalizeIsoDate(params.updatedAtIso)
  if (!publishedAtIso || !updatedAtIso) {
    return undefined
  }

  const confidence = normalizeNumericScore(params.confidence, 100)
  const impact = normalizeNumericScore(params.impact, 10)
  if (confidence === null || impact === null) {
    return undefined
  }

  const category = normalizeTextValue(params.category)
  const signal = normalizeTextValue(params.signal)
  const summary = normalizeTextValue(params.summary)
  const title = normalizeTextValue(params.title) || 'SIA Signal Snapshot'

  const metrics: VisibleDatasetMetric[] = [
    {
      key: 'confidence-score',
      label: 'Confidence Score',
      value: `${confidence} / 100`,
      propertyValue: {
        '@type': 'PropertyValue',
        name: 'Confidence Score',
        value: confidence,
        unitText: 'score',
      },
    },
    {
      key: 'market-impact-score',
      label: 'Market Impact Score',
      value: `${impact} / 10`,
      propertyValue: {
        '@type': 'PropertyValue',
        name: 'Market Impact Score',
        value: impact,
        unitText: 'score',
      },
    },
  ]

  if (category) {
    metrics.push({
      key: 'coverage-category',
      label: 'Coverage Category',
      value: category,
      propertyValue: {
        '@type': 'PropertyValue',
        name: 'Coverage Category',
        value: category,
      },
    })
  }

  if (signal) {
    metrics.push({
      key: 'directional-signal',
      label: 'Directional Signal',
      value: signal,
      propertyValue: {
        '@type': 'PropertyValue',
        name: 'Directional Signal',
        value: signal,
      },
    })
  }

  metrics.push({
    key: 'published-at-utc',
    label: 'Published At (UTC)',
    value: publishedAtIso,
    propertyValue: {
      '@type': 'PropertyValue',
      name: 'Published At (UTC)',
      value: publishedAtIso,
    },
  })

  const description = summary
    ? `${summary} This visible snapshot lists scored indicators rendered on this page.`
    : 'Visible scored indicators rendered on this article page.'

  const datasetName = `${title} | Signal Snapshot Dataset`

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    '@id': `${params.articleUrl}#signal-dataset`,
    name: datasetName,
    description,
    url: params.articleUrl,
    inLanguage: 'en',
    isAccessibleForFree: true,
    datePublished: publishedAtIso,
    dateModified: updatedAtIso,
    creator: {
      '@type': 'Organization',
      name: 'SIA Intelligence Protocol',
      url: 'https://siaintel.com',
    },
    publisher: {
      '@type': 'Organization',
      name: 'SIA Intelligence Protocol',
      url: 'https://siaintel.com',
    },
    includedInDataCatalog: {
      '@type': 'DataCatalog',
      name: 'SIA Article Signal Snapshots',
      url: 'https://siaintel.com/en/news',
    },
    measurementTechnique: 'Scored intelligence indicators from article metadata fields',
    variableMeasured: metrics.map((metric) => metric.propertyValue),
    hasPart: [
      {
        '@type': 'WebPageElement',
        cssSelector: selector,
        isAccessibleForFree: true,
      },
    ],
    isBasedOn: {
      '@id': params.articleUrl,
    },
  }

  if (category || signal) {
    schema.about = [category, signal]
      .filter((value) => Boolean(value))
      .map((value) => ({
        '@type': 'Thing',
        name: value,
      }))
  }

  return {
    selector,
    title: 'Signal Dataset Snapshot',
    description: 'Structured, reader-visible indicators sourced from stored article fields.',
    metrics,
    schema,
  }
}