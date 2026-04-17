# SOVEREIGN CORE V14 - Autonomous Financial Intelligence Engine

## Overview

Sovereign Core V14 is a fully autonomous financial intelligence system that aggregates news from RSS feeds, processes them through Gemini 1.5 Pro AI, and generates premium multi-language content optimized for regional CPM (Cost Per Mille) advertising revenue.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SOVEREIGN CORE V14                        │
│                  Autonomous Engine Loop                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  SCOUT (RSS Aggregator)                                      │
│  • Google News RSS feeds                                     │
│  • Keywords: Nasdaq, Bitcoin, Fed, AI, Crypto Regulation    │
│  • Runs every 15 minutes                                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  DEDUPLICATION SYSTEM                                        │
│  • Hash-based duplicate detection                           │
│  • In-memory store (max 1000 items)                         │
│  • Auto-cleanup of old entries (7 days)                     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  SMART RATE LIMITER (API Guard)                             │
│  • 40-second base delay between requests                    │
│  • Exponential backoff on 429 errors                        │
│  • Max 5 retries per request                                │
│  • Optimized for Gemini Free Tier                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  NEURO-SYNC KERNEL (The Brain)                              │
│  • Gemini 1.5 Pro 002 with system instructions             │
│  • 6-language processing (EN, AR, DE, ES, FR, TR)          │
│  • CPM-optimized content generation                         │
│  • Sentiment analysis (BULLISH/BEARISH/NEUTRAL)            │
│  • JSON schema enforcement                                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  INTELLIGENCE STORAGE                                        │
│  • In-memory Map (production: use database)                 │
│  • Indexed by news ID                                       │
│  • Includes all 6 language versions                         │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Scout (RSS Aggregator)
**File:** `lib/sovereign-core/scout.ts`

Fetches financial news from Google News RSS feeds.

**Features:**
- Monitors 9 keywords: Nasdaq, Bitcoin, Fed, AI, Crypto Regulation, Federal Reserve, Cryptocurrency, Stock Market, Artificial Intelligence
- Generates MD5 hash for each news item (deduplication)
- 1-second delay between feed requests
- Mock data fallback for development

**Functions:**
```typescript
aggregateNews(): Promise<NewsItem[]>
fetchRSSFeed(feedUrl: string): Promise<NewsItem[]>
generateNewsHash(title: string, link: string): string
startScout(callback: (news: NewsItem[]) => void): NodeJS.Timeout
```

### 2. Deduplication System
**File:** `lib/sovereign-core/deduplication.ts`

Prevents processing the same news multiple times.

**Features:**
- Hash-based duplicate detection
- In-memory store (max 1000 entries)
- Auto-cleanup of oldest entries when limit reached
- 7-day retention policy

**Functions:**
```typescript
isNewsSeen(hash: string): boolean
markNewsAsSeen(news: SeenNews): void
getDeduplicationStats(): { totalSeen, oldestEntry, newestEntry }
clearSeenNews(): void
cleanOldNews(daysOld: number): number
```

### 3. Smart Rate Limiter
**File:** `lib/sovereign-core/rate-limiter.ts`

Optimized for Gemini 1.5 Pro free tier limits.

**Features:**
- 40-second base delay between requests
- Exponential backoff on 429 errors (2x multiplier)
- Maximum 10-minute delay cap
- Automatic delay reduction on successful requests
- Max 5 retries per request

**Functions:**
```typescript
waitForRateLimit(): Promise<void>
handleRateLimitError(): number
handleSuccessfulRequest(): void
getRateLimitStatus(): { totalRequests, currentDelaySeconds, retryCount, lastRequestAgo }
canRetry(): boolean
resetRateLimiter(): void
```

### 4. Neuro-Sync Kernel
**File:** `lib/sovereign-core/neuro-sync-kernel.ts`

The AI brain that processes news into 6-language intelligence.

**Features:**
- Gemini 1.5 Pro 002 with system instructions
- 6 strategic languages with CPM optimization
- Sentiment analysis (BULLISH/BEARISH/NEUTRAL + 0-100 score)
- JSON schema enforcement
- Automatic retry with rate limiting

**Languages & CPM:**
- 🇺🇸 English (EN): $220 - Wall Street Style
- 🇦🇪 Arabic (AR): $440 - Royal & Wealth Style (PREMIUM)
- 🇩🇪 Deutsch (DE): $180 - Industrial Logic
- 🇪🇸 Español (ES): $170 - FinTech Momentum
- 🇫🇷 Français (FR): $190 - Sovereign Strategy
- 🇹🇷 Türkçe (TR): $150 - Market Pulse

**Functions:**
```typescript
processNewsWithNeuroSync(newsTitle, newsContent, newsId): Promise<GlobalIntelligencePackage>
processNewsForSingleLanguage(newsContent, languageCode): Promise<LanguageIntelligence>
processBatchNews(newsItems): Promise<GlobalIntelligencePackage[]>
```

### 5. Autonomous Engine
**File:** `lib/sovereign-core/autonomous-engine.ts`

Main orchestrator that runs the entire pipeline.

**Features:**
- 15-minute cycle interval (configurable)
- Max 5 news items per cycle (rate limit protection)
- Auto-cleanup of old news (7 days)
- Comprehensive statistics tracking
- Start/stop controls

**Functions:**
```typescript
startAutonomousEngine(config?: EngineConfig): void
stopAutonomousEngine(): void
getEngineStatus(): { isRunning, stats, config, intelligenceCount }
getProcessedIntelligence(limit: number): GlobalIntelligencePackage[]
getIntelligenceById(id: string): GlobalIntelligencePackage | null
triggerManualCycle(): Promise<void>
```

## API Endpoints

### Start Engine
```
POST /api/sovereign-core/start
```

**Request Body:**
```json
{
  "intervalMinutes": 15,
  "autoCleanOldNews": true,
  "cleanOldNewsDays": 7,
  "maxProcessPerCycle": 5
}
```

**Response:**
```json
{
  "success": true,
  "message": "Autonomous engine started",
  "status": { ... }
}
```

### Stop Engine
```
POST /api/sovereign-core/stop
```

**Response:**
```json
{
  "success": true,
  "message": "Autonomous engine stopped",
  "status": { ... }
}
```

### Get Status
```
GET /api/sovereign-core/status
```

**Response:**
```json
{
  "success": true,
  "status": {
    "isRunning": true,
    "stats": {
      "totalNewsScanned": 150,
      "newNewsProcessed": 45,
      "duplicatesSkipped": 105,
      "processingErrors": 0,
      "lastRunTime": "2026-02-28T10:30:00Z",
      "uptime": 3600,
      "rateLimitStatus": { ... },
      "deduplicationStats": { ... }
    },
    "config": { ... },
    "intelligenceCount": 45
  },
  "recentIntelligence": [ ... ]
}
```

### Get Intelligence
```
GET /api/sovereign-core/intelligence?limit=10
GET /api/sovereign-core/intelligence?id=news-123
```

**Response:**
```json
{
  "success": true,
  "count": 10,
  "intelligence": [
    {
      "newsId": "news-123",
      "originalTitle": "Federal Reserve Signals Rate Cuts",
      "originalContent": "...",
      "processedAt": "2026-02-28T10:30:00Z",
      "languages": [
        {
          "languageCode": "en",
          "language": "English",
          "flag": "🇺🇸",
          "cpm": 220,
          "title": "...",
          "meta": "...",
          "contentBrief": "...",
          "cpmTags": ["..."],
          "fullContent": "...",
          "sentiment": "BULLISH",
          "sentimentScore": 75
        }
      ],
      "totalCPM": 1350,
      "averageConfidence": 78
    }
  ]
}
```

## Admin Interface

**URL:** `/admin/sovereign-core`

Bloomberg Terminal-style monitoring dashboard.

**Features:**
- Real-time status monitoring (5-second refresh)
- Start/Stop engine controls
- System metrics display:
  - News Processed
  - Intelligence Stored
  - API Requests
  - Uptime
- Processing statistics
- Rate limiter status
- Recent intelligence feed
- Engine configuration display

**Metrics:**
- Total News Scanned
- New Processed
- Duplicates Skipped
- Processing Errors
- Last Run Time
- Rate Limiter Delay
- Retry Count
- Deduplication Stats

## Configuration

### Default Settings
```typescript
{
  intervalMinutes: 15,        // Run every 15 minutes
  autoCleanOldNews: true,     // Auto-cleanup enabled
  cleanOldNewsDays: 7,        // Keep 7 days of history
  maxProcessPerCycle: 5       // Max 5 news per cycle
}
```

### Rate Limiter Settings
```typescript
{
  requestsPerMinute: 2,       // Very conservative
  baseDelayMs: 40000,         // 40 seconds base delay
  maxRetries: 5,              // Max 5 retries
  exponentialBase: 2          // 2x backoff multiplier
}
```

### Environment Variables
```bash
GEMINI_API_KEY=your_gemini_api_key
```

## Usage Examples

### Start the Engine
```typescript
import { startAutonomousEngine } from '@/lib/sovereign-core/autonomous-engine';

startAutonomousEngine({
  intervalMinutes: 15,
  maxProcessPerCycle: 5
});
```

### Get Engine Status
```typescript
import { getEngineStatus } from '@/lib/sovereign-core/autonomous-engine';

const status = getEngineStatus();
console.log(`Running: ${status.isRunning}`);
console.log(`Processed: ${status.stats.newNewsProcessed}`);
```

### Get Recent Intelligence
```typescript
import { getProcessedIntelligence } from '@/lib/sovereign-core/autonomous-engine';

const recent = getProcessedIntelligence(10);
recent.forEach(intel => {
  console.log(`${intel.originalTitle} - ${intel.languages.length} languages`);
});
```

## Performance Optimization

### Free Tier Optimization
- 40-second delay between requests (conservative)
- Max 5 news items per 15-minute cycle
- Exponential backoff on rate limit errors
- Automatic retry with increasing delays

### Memory Management
- Max 1000 deduplication entries
- Auto-cleanup of oldest entries
- 7-day retention policy
- In-memory storage (migrate to DB for production)

### Error Handling
- Graceful degradation on API errors
- Automatic retry with backoff
- Error statistics tracking
- Continues processing on individual failures

## Production Deployment

### Database Migration
Replace in-memory stores with persistent database:

1. **Deduplication Store:**
   - Use SQLite or TinyDB
   - Index on hash field
   - TTL for auto-cleanup

2. **Intelligence Store:**
   - Use PostgreSQL or MongoDB
   - Index on newsId and processedAt
   - Full-text search on content

### RSS Parser
Replace mock data with real RSS parser:

```bash
npm install rss-parser
```

```typescript
import Parser from 'rss-parser';

const parser = new Parser();
const feed = await parser.parseURL(feedUrl);
```

### Monitoring
- Add logging service (Winston, Pino)
- Set up error tracking (Sentry)
- Add performance monitoring
- Create alerting for failures

### Scaling
- Use job queue (Bull, BullMQ)
- Implement worker processes
- Add Redis for distributed state
- Use database connection pooling

## Troubleshooting

### Engine Won't Start
- Check GEMINI_API_KEY environment variable
- Verify API key has access to Gemini 1.5 Pro
- Check console logs for errors

### Rate Limit Errors (429)
- System automatically handles with exponential backoff
- Check rate limiter status in admin dashboard
- Consider reducing maxProcessPerCycle

### No New Intelligence
- Check if Scout is finding new news
- Verify deduplication isn't blocking all items
- Check processing errors in stats

### High Memory Usage
- Reduce deduplication store size (MAX_STORED_NEWS)
- Implement database storage
- Add periodic cleanup

## Future Enhancements

1. **Real-time RSS Parsing:** Integrate actual RSS parser
2. **Database Storage:** Migrate to PostgreSQL/MongoDB
3. **Webhook Notifications:** Alert on new intelligence
4. **API Rate Limiting:** Add authentication and rate limits
5. **Content Publishing:** Auto-publish to website
6. **Telegram Integration:** Send alerts to Telegram channel
7. **Analytics Dashboard:** Track CPM performance
8. **A/B Testing:** Test different content styles
9. **SEO Optimization:** Auto-generate meta tags
10. **Multi-source Aggregation:** Add more RSS sources

## License

Proprietary - Sovereign Intelligence Architecture (SIA)

## Support

For issues or questions, contact the development team.
