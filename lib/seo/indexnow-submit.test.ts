import {
  mapArticleLanguageToRouteLocale,
  resetIndexNowDedupeForTests,
  submitUrlsToIndexNow,
} from '@/lib/seo/indexnow-submit'

describe('indexnow submit', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    resetIndexNowDedupeForTests()
    ;(global as { fetch?: typeof fetch }).fetch = jest.fn()
  })

  afterEach(() => {
    process.env = originalEnv
    jest.resetAllMocks()
  })

  it('skips submission when INDEXNOW_KEY is missing', async () => {
    delete process.env.INDEXNOW_KEY
    process.env.NEXT_PUBLIC_BASE_URL = 'https://siaintel.com'

    const result = await submitUrlsToIndexNow(['https://siaintel.com/en/news/example'])

    expect(result.success).toBe(false)
    expect(result.skipped).toBe(true)
    expect(result.skipReason).toBe('missing-key')
  })

  it('submits eligible canonical article URLs', async () => {
    process.env.INDEXNOW_KEY = 'test-indexnow-key'
    process.env.NEXT_PUBLIC_BASE_URL = 'https://siaintel.com'
    process.env.INDEXNOW_KEY_LOCATION = 'https://siaintel.com/test-indexnow-key.txt'

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    })
    ;(global as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch

    const result = await submitUrlsToIndexNow([
      'https://siaintel.com/en/news/example-one',
      'https://siaintel.com/tr/news/ornek-iki',
    ])

    expect(result.success).toBe(true)
    expect(result.submitted).toBe(true)
    expect(result.acceptedUrls).toHaveLength(2)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const requestPayload = JSON.parse(String(fetchMock.mock.calls[0][1]?.body))
    expect(requestPayload.host).toBe('siaintel.com')
    expect(requestPayload.urlList).toEqual([
      'https://siaintel.com/en/news/example-one',
      'https://siaintel.com/tr/news/ornek-iki',
    ])
  })

  it('dedupes repeated submissions inside the dedupe window', async () => {
    process.env.INDEXNOW_KEY = 'test-indexnow-key'
    process.env.NEXT_PUBLIC_BASE_URL = 'https://siaintel.com'
    process.env.INDEXNOW_KEY_LOCATION = 'https://siaintel.com/test-indexnow-key.txt'

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    })
    ;(global as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch

    const url = 'https://siaintel.com/en/news/example-dedupe'

    const first = await submitUrlsToIndexNow([url])
    const second = await submitUrlsToIndexNow([url])

    expect(first.success).toBe(true)
    expect(first.submitted).toBe(true)
    expect(second.success).toBe(true)
    expect(second.submitted).toBe(false)
    expect(second.skipped).toBe(true)
    expect(second.skipReason).toBe('deduped')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('filters out non-canonical or non-article URLs', async () => {
    process.env.INDEXNOW_KEY = 'test-indexnow-key'
    process.env.NEXT_PUBLIC_BASE_URL = 'https://siaintel.com'
    process.env.INDEXNOW_KEY_LOCATION = 'https://siaintel.com/test-indexnow-key.txt'

    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => '',
    })
    ;(global as { fetch?: typeof fetch }).fetch = fetchMock as unknown as typeof fetch

    const result = await submitUrlsToIndexNow([
      'https://siaintel.com/en/search?q=btc',
      'https://siaintel.com/api/articles',
      'https://example.com/en/news/not-eligible',
    ])

    expect(result.success).toBe(false)
    expect(result.skipped).toBe(true)
    expect(result.skipReason).toBe('no-eligible-urls')
    expect(fetchMock).toHaveBeenCalledTimes(0)
  })

  it('maps article languages to public route locales safely', () => {
    expect(mapArticleLanguageToRouteLocale('en')).toBe('en')
    expect(mapArticleLanguageToRouteLocale('jp')).toBe('ja')
    expect(mapArticleLanguageToRouteLocale('ar')).toBeNull()
    expect(mapArticleLanguageToRouteLocale('pt-br')).toBe('pt-br')
  })
})
