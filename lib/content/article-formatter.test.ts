import { formatArticleBody } from '@/lib/content/article-formatter'

function countInternalLinksByHref(html: string, href: string): number {
  const escapedHref = href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`<a[^>]*href="${escapedHref}"[^>]*class="internal-link"[^>]*>`, 'g')
  return (html.match(regex) || []).length
}

describe('formatArticleBody controlled silo-linking', () => {
  it('renders representative English content with bounded links to valid silo routes', () => {
    const input = [
      'Bitcoin and Nasdaq opened the session with strong momentum.',
      'FED policy updates pushed Ethereum and Nasdaq sentiment higher as Gold stayed bid.',
      'Federal Reserve commentary and S&P 500 breadth kept market volatility elevated.',
    ].join('\n\n')

    const html = formatArticleBody(input, 'en')

    expect(html).toContain('<p>')
    expect(html).toContain('class="internal-link"')
    expect(html).toContain('href="/en/crypto"')
    expect(html).toContain('href="/en/stocks"')
    expect(html).toContain('href="/en/economy"')

    const firstParagraph = html.split('</p>')[0]
    expect(firstParagraph).not.toContain('class="internal-link"')
  })

  it('uses locale-safe route behavior for Japanese articles', () => {
    const input = [
      'This lead paragraph should stay unlinked for readability.',
      'Bitcoin and FED signals shaped the macro outlook for institutional desks.',
    ].join('\n\n')

    const html = formatArticleBody(input, 'jp')

    expect(html).toContain('href="/ja/crypto"')
    expect(html).toContain('href="/ja/economy"')
    expect(html).not.toContain('href="/jp/category/')
  })

  it('skips ambiguous terms to avoid misleading or noisy links', () => {
    const input = [
      'Lead paragraph remains clean.',
      'USD EUR Dollar Euro and TRY moved quickly while desks repriced risk.',
    ].join('\n\n')

    const html = formatArticleBody(input, 'en')

    expect(html).not.toContain('class="internal-link"')
  })

  it('caps repeated links to the same target within one article', () => {
    const input = [
      'Intro paragraph with context only.',
      'Bitcoin, BTC, Ethereum, ETH, Cryptocurrency and Bitcoin all signaled accumulation.',
      'Ethereum and BTC remained in focus while Bitcoin stayed above key support.',
    ].join('\n\n')

    const html = formatArticleBody(input, 'en')

    const cryptoLinkCount = countInternalLinksByHref(html, '/en/crypto')
    expect(cryptoLinkCount).toBeGreaterThan(0)
    expect(cryptoLinkCount).toBeLessThanOrEqual(2)
  })

  it('does not auto-link heading surfaces or re-link already-linked fragments', () => {
    const input = [
      '**Bitcoin Outlook**',
      'Lead paragraph.',
      '<a href="/en/crypto">Bitcoin</a> remained active while FED tone shifted.',
    ].join('\n\n')

    const html = formatArticleBody(input, 'en')

    expect(html).toContain('<h2 class="sia-section-heading">Bitcoin Outlook</h2>')
    expect(html).not.toContain('<h2 class="sia-section-heading"><a')
    expect(html).not.toContain('class="internal-link"')
  })
})
