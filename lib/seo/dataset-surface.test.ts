import { buildDatasetForVisibleSignals } from '@/lib/seo/dataset-surface'

describe('dataset surface eligibility', () => {
  it('returns Dataset schema for english route with valid visible signal fields', () => {
    const dataset = buildDatasetForVisibleSignals({
      routeLang: 'en',
      articleUrl: 'https://siaintel.com/en/news/example-slug',
      title: 'Example Headline',
      summary: 'Visible summary from article translation.',
      selector: '#article-visible-signal-dataset',
      category: 'ECONOMY',
      confidence: 91,
      impact: 8,
      signal: 'BULLISH',
      publishedAtIso: '2026-04-05T07:30:32.286Z',
      updatedAtIso: '2026-04-05T07:34:22.924Z',
    })

    expect(dataset).toBeDefined()
    expect(dataset?.schema['@type']).toBe('Dataset')
    expect(dataset?.schema.hasPart).toEqual([
      {
        '@type': 'WebPageElement',
        cssSelector: '#article-visible-signal-dataset',
        isAccessibleForFree: true,
      },
    ])
  })

  it('returns undefined for non-english route', () => {
    const dataset = buildDatasetForVisibleSignals({
      routeLang: 'tr',
      articleUrl: 'https://siaintel.com/tr/news/example-slug',
      title: 'Ornek Baslik',
      summary: 'Gorunur ozet.',
      selector: '#article-visible-signal-dataset',
      category: 'ECONOMY',
      confidence: 91,
      impact: 8,
      signal: 'BULLISH',
      publishedAtIso: '2026-04-05T07:30:32.286Z',
      updatedAtIso: '2026-04-05T07:34:22.924Z',
    })

    expect(dataset).toBeUndefined()
  })

  it('returns undefined when metrics are unavailable', () => {
    const dataset = buildDatasetForVisibleSignals({
      routeLang: 'en',
      articleUrl: 'https://siaintel.com/en/news/example-slug',
      title: 'Example Headline',
      summary: 'Visible summary from article translation.',
      selector: '#article-visible-signal-dataset',
      category: 'ECONOMY',
      confidence: null,
      impact: 8,
      signal: 'BULLISH',
      publishedAtIso: '2026-04-05T07:30:32.286Z',
      updatedAtIso: '2026-04-05T07:34:22.924Z',
    })

    expect(dataset).toBeUndefined()
  })

  it('returns undefined when selector is invalid', () => {
    const dataset = buildDatasetForVisibleSignals({
      routeLang: 'en',
      articleUrl: 'https://siaintel.com/en/news/example-slug',
      title: 'Example Headline',
      summary: 'Visible summary from article translation.',
      selector: 'article-visible-signal-dataset',
      category: 'ECONOMY',
      confidence: 91,
      impact: 8,
      signal: 'BULLISH',
      publishedAtIso: '2026-04-05T07:30:32.286Z',
      updatedAtIso: '2026-04-05T07:34:22.924Z',
    })

    expect(dataset).toBeUndefined()
  })

  it('returns undefined when publication timestamp is invalid', () => {
    const dataset = buildDatasetForVisibleSignals({
      routeLang: 'en',
      articleUrl: 'https://siaintel.com/en/news/example-slug',
      title: 'Example Headline',
      summary: 'Visible summary from article translation.',
      selector: '#article-visible-signal-dataset',
      category: 'ECONOMY',
      confidence: 91,
      impact: 8,
      signal: 'BULLISH',
      publishedAtIso: 'not-a-date',
      updatedAtIso: '2026-04-05T07:34:22.924Z',
    })

    expect(dataset).toBeUndefined()
  })
})