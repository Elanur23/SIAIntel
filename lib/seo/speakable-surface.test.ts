import {
  buildSpeakableForVisibleSummary,
  getVisibleSummaryText,
} from '@/lib/seo/speakable-surface'

describe('speakable surface eligibility', () => {
  it('returns SpeakableSpecification for english route with visible summary', () => {
    const speakable = buildSpeakableForVisibleSummary({
      routeLang: 'en',
      summary: 'Bitcoin surged after the Fed policy signal.',
      selector: '#article-visible-summary',
    })

    expect(speakable).toEqual({
      '@type': 'SpeakableSpecification',
      cssSelector: ['#article-visible-summary'],
    })
  })

  it('returns undefined when summary is empty', () => {
    const speakable = buildSpeakableForVisibleSummary({
      routeLang: 'en',
      summary: '   ',
      selector: '#article-visible-summary',
    })

    expect(speakable).toBeUndefined()
  })

  it('returns undefined for non-english routes', () => {
    const speakable = buildSpeakableForVisibleSummary({
      routeLang: 'ja',
      summary: 'Visible Japanese summary',
      selector: '#article-visible-summary',
    })

    expect(speakable).toBeUndefined()
  })

  it('returns undefined for invalid selector', () => {
    const speakable = buildSpeakableForVisibleSummary({
      routeLang: 'en',
      summary: 'Visible summary',
      selector: 'article-visible-summary',
    })

    expect(speakable).toBeUndefined()
  })

  it('normalizes visible summary content', () => {
    expect(getVisibleSummaryText('  A concise standfirst.  ')).toBe('A concise standfirst.')
    expect(getVisibleSummaryText(null)).toBe('')
  })
})
