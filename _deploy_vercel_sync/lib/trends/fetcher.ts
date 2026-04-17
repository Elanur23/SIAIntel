/**
 * Trend Data Center - Trending Keywords Fetcher
 * 
 * Fetches trending keywords from:
 * 1. Google Trends RSS feeds
 * 2. News sources (breaking news)
 * 3. Social media trends
 * 
 * Identifies "exploding" keywords with high search volume and velocity
 */

import Parser from 'rss-parser';

// Trend source types
export type TrendSource = 'google_trends' | 'news' | 'social' | 'manual';

// Trend velocity (how fast it's growing)
export type TrendVelocity = 'explosive' | 'rising' | 'steady' | 'declining';

// Trend category
export type TrendCategory = 
  | 'breaking_news'
  | 'politics'
  | 'business'
  | 'sports'
  | 'technology'
  | 'entertainment'
  | 'health'
  | 'science'
  | 'world'
  | 'local'
  | 'other';

export interface TrendKeyword {
  keyword: string;
  searchVolume: number; // Estimated searches per hour
  velocity: TrendVelocity;
  source: TrendSource;
  category: TrendCategory;
  relatedKeywords: string[];
  firstDetected: Date;
  lastUpdated: Date;
  peakTime?: Date;
  confidence: number; // 0-100, how confident we are this is trending
  metadata: {
    newsCount?: number; // Number of news articles
    socialMentions?: number; // Social media mentions
    searchGrowth?: number; // % growth in last hour
    region?: string; // Geographic region
  };
}

export interface TrendReport {
  timestamp: Date;
  topTrends: TrendKeyword[];
  explosiveTrends: TrendKeyword[]; // velocity === 'explosive'
  risingTrends: TrendKeyword[]; // velocity === 'rising'
  categories: Record<TrendCategory, TrendKeyword[]>;
  totalKeywords: number;
}

export class TrendsFetcher {
  private parser: Parser;
  private trendCache: Map<string, TrendKeyword>;
  private lastFetch: Date | null;

  // Google Trends RSS feeds by region
  private readonly GOOGLE_TRENDS_FEEDS = {
    us: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US',
    uk: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=GB',
    global: 'https://trends.google.com/trends/trendingsearches/daily/rss?geo=US', // Default to US for global reach
  };

  // News RSS feeds for trending topics
  private readonly NEWS_FEEDS = [
    'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en',
    'https://rss.cnn.com/rss/cnn_topstories.rss',
    'https://feeds.bbci.co.uk/news/rss.xml',
    'https://www.reuters.com/rssFeed/topNews',
  ];

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ['ht:approx_traffic', 'traffic'],
          ['ht:picture', 'picture'],
          ['ht:picture_source', 'pictureSource'],
          ['ht:news_item', 'newsItems'],
        ],
      },
    });
    this.trendCache = new Map();
    this.lastFetch = null;
  }

  /**
   * Fetch trending keywords from all sources
   */
  async fetchTrends(options?: {
    region?: 'us' | 'uk' | 'global';
    includeNews?: boolean;
    minConfidence?: number;
  }): Promise<TrendReport> {
    const region = options?.region || 'us';
    const includeNews = options?.includeNews !== false;
    const minConfidence = options?.minConfidence || 50;

    console.log('🔥 Fetching trending keywords...');
    console.log(`   Region: ${region.toUpperCase()}`);
    console.log(`   Include News: ${includeNews}`);
    console.log(`   Min Confidence: ${minConfidence}`);

    try {
      // Fetch from multiple sources in parallel
      const [googleTrends, newsTrends] = await Promise.all([
        this.fetchGoogleTrends(region),
        includeNews ? this.fetchNewsTrends() : Promise.resolve([]),
      ]);

      // Merge and deduplicate trends
      const allTrends = this.mergeTrends([...googleTrends, ...newsTrends]);

      // Filter by confidence
      const filteredTrends = allTrends.filter(
        (trend) => trend.confidence >= minConfidence
      );

      // Sort by search volume (descending)
      filteredTrends.sort((a, b) => b.searchVolume - a.searchVolume);

      // Generate report
      const report = this.generateReport(filteredTrends);

      this.lastFetch = new Date();

      console.log(`✅ Fetched ${report.totalKeywords} trending keywords`);
      console.log(`   Explosive: ${report.explosiveTrends.length}`);
      console.log(`   Rising: ${report.risingTrends.length}`);

      return report;
    } catch (error) {
      console.error('❌ Failed to fetch trends:', error);
      throw error;
    }
  }

  /**
   * Fetch trends from Google Trends RSS
   */
  private async fetchGoogleTrends(
    region: 'us' | 'uk' | 'global'
  ): Promise<TrendKeyword[]> {
    try {
      const feedUrl = this.GOOGLE_TRENDS_FEEDS[region];
      const feed = await this.parser.parseURL(feedUrl);

      const trends: TrendKeyword[] = [];

      for (const item of feed.items) {
        if (!item.title) continue;

        // Extract traffic estimate
        const traffic = this.extractTraffic(item);

        // Determine category from content
        const category = this.categorizeKeyword(item.title, item.content || '');

        // Calculate velocity based on traffic
        const velocity = this.calculateVelocity(traffic);

        // Extract related keywords from news items
        const relatedKeywords = this.extractRelatedKeywords(item);

        const trend: TrendKeyword = {
          keyword: item.title,
          searchVolume: traffic,
          velocity,
          source: 'google_trends',
          category,
          relatedKeywords,
          firstDetected: new Date(),
          lastUpdated: new Date(),
          confidence: 90, // Google Trends is highly reliable
          metadata: {
            searchGrowth: this.estimateGrowth(traffic),
            region: region.toUpperCase(),
          },
        };

        trends.push(trend);
      }

      console.log(`   Google Trends (${region}): ${trends.length} keywords`);
      return trends;
    } catch (error) {
      console.error(`❌ Failed to fetch Google Trends (${region}):`, error);
      return [];
    }
  }

  /**
   * Fetch trends from news RSS feeds
   */
  private async fetchNewsTrends(): Promise<TrendKeyword[]> {
    try {
      const allTrends: TrendKeyword[] = [];

      // Fetch from multiple news sources
      const feedPromises = this.NEWS_FEEDS.map(async (feedUrl) => {
        try {
          const feed = await this.parser.parseURL(feedUrl);
          return feed.items.slice(0, 10); // Top 10 from each source
        } catch (error) {
          console.error(`Failed to fetch ${feedUrl}:`, error);
          return [];
        }
      });

      const feedResults = await Promise.all(feedPromises);
      const allItems = feedResults.flat();

      // Extract keywords from news titles
      const keywordCounts = new Map<string, number>();

      for (const item of allItems) {
        if (!item.title) continue;

        // Extract important keywords (2-4 words)
        const keywords = this.extractKeywords(item.title);

        for (const keyword of keywords) {
          keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
        }
      }

      // Convert to TrendKeyword objects
      for (const [keyword, count] of keywordCounts.entries()) {
        if (count < 2) continue; // Must appear in at least 2 sources

        const category = this.categorizeKeyword(keyword, '');
        const searchVolume = this.estimateSearchVolume(count);
        const velocity = count >= 5 ? 'explosive' : count >= 3 ? 'rising' : 'steady';

        const trend: TrendKeyword = {
          keyword,
          searchVolume,
          velocity,
          source: 'news',
          category,
          relatedKeywords: [],
          firstDetected: new Date(),
          lastUpdated: new Date(),
          confidence: Math.min(count * 15, 85), // Max 85 for news
          metadata: {
            newsCount: count,
            region: 'US',
          },
        };

        allTrends.push(trend);
      }

      console.log(`   News Sources: ${allTrends.length} keywords`);
      return allTrends;
    } catch (error) {
      console.error('❌ Failed to fetch news trends:', error);
      return [];
    }
  }

  /**
   * Extract traffic estimate from Google Trends item
   */
  private extractTraffic(item: any): number {
    // Try to extract from custom field
    if (item.traffic) {
      const match = item.traffic.match(/(\d+[\d,]*)\+?/);
      if (match) {
        return parseInt(match[1].replace(/,/g, ''), 10);
      }
    }

    // Estimate based on position (first items have more traffic)
    return 50000; // Default estimate
  }

  /**
   * Calculate velocity based on traffic
   */
  private calculateVelocity(traffic: number): TrendVelocity {
    if (traffic > 100000) return 'explosive';
    if (traffic > 50000) return 'rising';
    if (traffic > 20000) return 'steady';
    return 'declining';
  }

  /**
   * Estimate search growth percentage
   */
  private estimateGrowth(traffic: number): number {
    // Higher traffic usually means faster growth
    if (traffic > 100000) return 500; // 500% growth
    if (traffic > 50000) return 200; // 200% growth
    if (traffic > 20000) return 100; // 100% growth
    return 50; // 50% growth
  }

  /**
   * Estimate search volume from news count
   */
  private estimateSearchVolume(newsCount: number): number {
    // More news articles = more searches
    return newsCount * 10000;
  }

  /**
   * Extract related keywords from news items
   */
  private extractRelatedKeywords(item: any): string[] {
    const related: string[] = [];

    // Extract from content
    if (item.content) {
      const keywords = this.extractKeywords(item.content);
      related.push(...keywords.slice(0, 5));
    }

    return related;
  }

  /**
   * Extract important keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Remove HTML tags
    const cleanText = text.replace(/<[^>]*>/g, '');

    // Split into words
    const words = cleanText.toLowerCase().split(/\s+/);

    // Common stop words to ignore
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'been',
      'be', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
      'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these',
      'those', 'it', 'its', 'they', 'them', 'their', 'what', 'which', 'who',
      'when', 'where', 'why', 'how', 'says', 'said', 'after', 'new', 'more',
    ]);

    // Extract 2-4 word phrases
    const keywords: string[] = [];

    for (let i = 0; i < words.length - 1; i++) {
      // 2-word phrases
      if (!stopWords.has(words[i]) && !stopWords.has(words[i + 1])) {
        keywords.push(`${words[i]} ${words[i + 1]}`);
      }

      // 3-word phrases
      if (
        i < words.length - 2 &&
        !stopWords.has(words[i]) &&
        !stopWords.has(words[i + 2])
      ) {
        keywords.push(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
      }
    }

    // Remove duplicates and return
    return [...new Set(keywords)];
  }

  /**
   * Categorize keyword based on content
   */
  private categorizeKeyword(
    keyword: string,
    content: string
  ): TrendCategory {
    const text = `${keyword} ${content}`.toLowerCase();

    // Category keywords
    const categories: Record<TrendCategory, string[]> = {
      breaking_news: ['breaking', 'urgent', 'alert', 'just in', 'developing'],
      politics: ['election', 'president', 'congress', 'senate', 'vote', 'political', 'government'],
      business: ['stock', 'market', 'economy', 'company', 'ceo', 'earnings', 'trade'],
      sports: ['game', 'team', 'player', 'score', 'championship', 'nfl', 'nba', 'mlb'],
      technology: ['tech', 'ai', 'software', 'app', 'iphone', 'google', 'apple', 'microsoft'],
      entertainment: ['movie', 'actor', 'music', 'celebrity', 'film', 'show', 'netflix'],
      health: ['health', 'medical', 'doctor', 'disease', 'vaccine', 'hospital', 'covid'],
      science: ['science', 'research', 'study', 'discovery', 'space', 'nasa', 'climate'],
      world: ['world', 'international', 'global', 'country', 'war', 'peace'],
      local: ['local', 'city', 'state', 'county', 'community'],
      other: [],
    };

    // Check each category
    for (const [category, keywords] of Object.entries(categories)) {
      for (const kw of keywords) {
        if (text.includes(kw)) {
          return category as TrendCategory;
        }
      }
    }

    return 'other';
  }

  /**
   * Merge trends from multiple sources and deduplicate
   */
  private mergeTrends(trends: TrendKeyword[]): TrendKeyword[] {
    const merged = new Map<string, TrendKeyword>();

    for (const trend of trends) {
      const key = trend.keyword.toLowerCase();

      if (merged.has(key)) {
        // Merge with existing trend
        const existing = merged.get(key)!;

        // Use higher search volume
        if (trend.searchVolume > existing.searchVolume) {
          existing.searchVolume = trend.searchVolume;
        }

        // Use higher velocity
        const velocityOrder = ['explosive', 'rising', 'steady', 'declining'];
        if (
          velocityOrder.indexOf(trend.velocity) <
          velocityOrder.indexOf(existing.velocity)
        ) {
          existing.velocity = trend.velocity;
        }

        // Merge related keywords
        existing.relatedKeywords = [
          ...new Set([...existing.relatedKeywords, ...trend.relatedKeywords]),
        ];

        // Use higher confidence
        existing.confidence = Math.max(existing.confidence, trend.confidence);

        // Merge metadata
        if (trend.metadata.newsCount) {
          existing.metadata.newsCount =
            (existing.metadata.newsCount || 0) + trend.metadata.newsCount;
        }
      } else {
        // Add new trend
        merged.set(key, trend);
      }
    }

    return Array.from(merged.values());
  }

  /**
   * Generate trend report
   */
  private generateReport(trends: TrendKeyword[]): TrendReport {
    // Group by velocity
    const explosiveTrends = trends.filter((t) => t.velocity === 'explosive');
    const risingTrends = trends.filter((t) => t.velocity === 'rising');

    // Group by category
    const categories: Record<TrendCategory, TrendKeyword[]> = {
      breaking_news: [],
      politics: [],
      business: [],
      sports: [],
      technology: [],
      entertainment: [],
      health: [],
      science: [],
      world: [],
      local: [],
      other: [],
    };

    for (const trend of trends) {
      categories[trend.category].push(trend);
    }

    return {
      timestamp: new Date(),
      topTrends: trends.slice(0, 20), // Top 20
      explosiveTrends,
      risingTrends,
      categories,
      totalKeywords: trends.length,
    };
  }

  /**
   * Get cached trends (if available)
   */
  getCachedTrends(): TrendKeyword[] {
    return Array.from(this.trendCache.values());
  }

  /**
   * Get last fetch time
   */
  getLastFetchTime(): Date | null {
    return this.lastFetch;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.trendCache.clear();
    this.lastFetch = null;
  }
}

// Export singleton instance
export const trendsFetcher = new TrendsFetcher();
