/**
 * SCOUT - RSS Aggregator
 * Google News / RSS feed'lerden finansal istihbaratı toplar.
 * Gerçek RSS parse: rss-parser. Başarısız olursa mock fallback.
 */

import crypto from 'crypto';
import Parser from 'rss-parser';

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  pubDate: string;
  content: string;
  source: string;
  hash: string;
}

const KEYWORDS = [
  'Nasdaq',
  'Bitcoin',
  'Fed',
  'AI',
  'Crypto Regulation',
  'Federal Reserve',
  'Cryptocurrency',
  'Stock Market',
  'Artificial Intelligence'
];

/**
 * Google News RSS feed URL'lerini oluşturur
 */
function generateRSSFeeds(): string[] {
  return KEYWORDS.map(keyword =>
    `https://news.google.com/rss/search?q=${encodeURIComponent(keyword)}&hl=en-US&gl=US&ceid=US:en`
  );
}

/**
 * Haber içeriğinden hash oluşturur (deduplication için)
 */
export function generateNewsHash(title: string, link: string): string {
  return crypto
    .createHash('md5')
    .update(`${title}${link}`)
    .digest('hex');
}

const parser = new Parser({
  timeout: 8000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; SIA-Scout/1.0; +https://siaintel.com)'
  }
});

/**
 * RSS feed'i gerçek parse eder; hata olursa mock döner
 */
export async function fetchRSSFeed(feedUrl: string): Promise<NewsItem[]> {
  try {
    const feed = await parser.parseURL(feedUrl);
    if (!feed?.items?.length) return [];

    const items: NewsItem[] = feed.items.map((item, i) => {
      const title = item.title?.trim() || 'Untitled';
      const link = item.link?.trim() || item.guid || '';
      const content = item.contentSnippet?.trim() || item.content?.replace(/<[^>]+>/g, '').slice(0, 500) || title;
      const pubDate = item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString();
      const source = item.creator || (item as any).source?.name || 'RSS';
      return {
        id: `rss-${Date.now()}-${i}-${generateNewsHash(title, link).slice(0, 8)}`,
        title,
        link,
        pubDate,
        content,
        source,
        hash: generateNewsHash(title, link)
      };
    });

    console.log(`[SCOUT] Fetched ${items.length} items from ${feedUrl.slice(0, 60)}...`);
    return items;
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[SCOUT] RSS fetch failed, using mock:', (error as Error).message);
      return getMockNewsItems();
    }
    console.warn('[SCOUT] RSS fetch failed:', (error as Error).message);
    return [];
  }
}

function getMockNewsItems(): NewsItem[] {
  const now = new Date().toISOString();
  const mock: NewsItem[] = [
    { id: `news-${Date.now()}-1`, title: 'Federal Reserve Signals Rate Cuts as Inflation Cools to 2.3%', link: 'https://example.com/fed-rate-cuts', pubDate: now, content: 'The Federal Reserve indicated potential interest rate cuts in Q2 2026 as core PCE inflation declined to 2.3%. Fed Chair Powell emphasized a data-dependent approach.', source: 'Reuters', hash: '' },
    { id: `news-${Date.now()}-2`, title: 'Bitcoin Surges Past $52,000 on Institutional Demand', link: 'https://example.com/bitcoin-surge', pubDate: now, content: 'Bitcoin rallied above $52,000 as institutional investors increased exposure. Trading volume reached $45B in 24 hours.', source: 'Bloomberg', hash: '' },
    { id: `news-${Date.now()}-3`, title: 'Nasdaq Rallies 3.2% on Tech Sector Optimism', link: 'https://example.com/nasdaq-rally', pubDate: now, content: 'The Nasdaq Composite surged 3.2% as tech stocks rallied on dovish Fed signals. Nvidia, Microsoft, and Apple led gains.', source: 'CNBC', hash: '' }
  ];
  return mock.map(item => ({ ...item, hash: generateNewsHash(item.title, item.link) }));
}

/**
 * Tüm RSS feed'lerden haberleri toplar
 */
export async function aggregateNews(): Promise<NewsItem[]> {
  console.log('[SCOUT] Starting news aggregation...');
  
  const feeds = generateRSSFeeds();
  const allNews: NewsItem[] = [];

  for (const feedUrl of feeds) {
    const items = await fetchRSSFeed(feedUrl);
    allNews.push(...items);
    
    // Rate limiting between feeds
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`[SCOUT] Aggregated ${allNews.length} news items`);
  
  return allNews;
}

/**
 * Scout'u başlatır (her 15 dakikada bir çalışır)
 */
export function startScout(callback: (news: NewsItem[]) => void): NodeJS.Timeout {
  console.log('[SCOUT] Starting autonomous news scout...');
  
  // İlk çalıştırma
  aggregateNews().then(callback);
  
  // Her 15 dakikada bir çalıştır
  const interval = setInterval(async () => {
    const news = await aggregateNews();
    callback(news);
  }, 15 * 60 * 1000); // 15 minutes

  return interval;
}
