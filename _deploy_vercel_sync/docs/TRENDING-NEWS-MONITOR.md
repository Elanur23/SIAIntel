# Trending News Monitor System

## Overview

The Trending News Monitor is an automated system that detects trending topics in real-time and automatically generates and publishes news articles about them. It integrates with real trending data sources and works 24/7 without manual intervention.

## Features

- **Real-Time Trending Detection**: Fetches trending topics from News API
- **Automatic Article Generation**: Creates original articles about trending topics using AI
- **Quality Assurance**: Validates quality and originality before publishing
- **Duplicate Prevention**: Tracks published topics to avoid duplicates
- **Priority-Based Publishing**: Publishes breaking news first (highest trend score)
- **Fallback System**: Uses simulated trending topics if News API is unavailable
- **24/7 Operation**: Runs continuously without user intervention
- **Manual Override**: Allows manual topic publishing via admin dashboard

## Architecture

### Components

1. **TrendingNewsMonitor** (`lib/trending-news-monitor.ts`)
   - Main monitoring engine
   - Fetches trending data from News API
   - Manages topic deduplication
   - Coordinates article generation and publishing

2. **API Endpoint** (`app/api/trending/route.ts`)
   - GET: Retrieve monitor status
   - POST: Control monitor (start/stop/check) or publish manual topics

3. **Admin Dashboard** (`app/admin/trending/page.tsx`)
   - Real-time status display
   - Manual topic publishing form
   - Monitor control buttons
   - Statistics and metrics

## Configuration

### Environment Variables

```env
# Enable/disable the trending monitor
TRENDING_NEWS_MONITOR_ENABLED=true

# Check interval in minutes (default: 5)
TRENDING_CHECK_INTERVAL_MINUTES=5

# Minimum trend score to publish (1-100, default: 70)
TRENDING_MIN_SCORE=70

# News API key for fetching real trending data
NEWS_API_KEY=your_news_api_key_here
```

### Getting a News API Key

1. Visit [newsapi.org](https://newsapi.org)
2. Sign up for a free account
3. Copy your API key
4. Add to `.env.local`:
   ```
   NEWS_API_KEY=your_api_key_here
   ```

## How It Works

### Automatic Trending Detection

1. **Initialization**: Monitor starts 15 seconds after server boot
2. **Periodic Checks**: Every 5 minutes (configurable), the system:
   - Fetches top headlines from News API across all categories
   - Extracts trending topics with trend scores
   - Filters out already-published topics
   - Sorts by trend score (highest first)
3. **Article Generation**: For each new trending topic:
   - Generates original article using AI
   - Validates quality (minimum 7/10)
   - Validates originality (minimum 8/10)
   - Checks AI detection score
   - Applies SEO optimization
   - Creates blockchain proof
   - Auto-links to related articles
4. **Publishing**: Successful articles are published automatically

### Data Flow

```
News API
   ↓
Trending Detection
   ↓
Deduplication Check
   ↓
AI Article Generation
   ↓
Quality Validation
   ↓
SEO Optimization
   ↓
Auto-Publishing
```

### Trend Score Calculation

- **Breaking News** (90-100): Most urgent, published first
- **Trending** (75-89): Popular topics, published second
- **Viral** (50-74): Emerging topics, published last

## API Reference

### GET /api/trending

Retrieve current monitor status.

**Request:**
```bash
curl -H "x-api-key: dev-api-key-12345" \
  https://yoursite.com/api/trending
```

**Response:**
```json
{
  "success": true,
  "status": {
    "isMonitoring": true,
    "checkIntervalMs": 300000,
    "trackedTopics": 42
  },
  "message": "Trending News Monitor is running"
}
```

### POST /api/trending

Control the monitor or publish manual topics.

**Start Monitor:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-12345" \
  -d '{"action": "start"}' \
  https://yoursite.com/api/trending
```

**Stop Monitor:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-12345" \
  -d '{"action": "stop"}' \
  https://yoursite.com/api/trending
```

**Check Now:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-12345" \
  -d '{"action": "check"}' \
  https://yoursite.com/api/trending
```

**Publish Manual Topic:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "x-api-key: dev-api-key-12345" \
  -d '{
    "action": "publish",
    "topic": "Major earthquake hits California coast with 7.2 magnitude",
    "category": "breaking-news"
  }' \
  https://yoursite.com/api/trending
```

## Admin Dashboard

Access the trending monitor dashboard at `/admin/trending`

### Features

- **Status Display**: Real-time monitoring status with visual indicators
- **Statistics**: Shows check interval, tracked topics, and uptime
- **Manual Publishing**: Form to publish trending topics manually
- **Category Selection**: Choose from 8 news categories
- **Control Buttons**: Start, stop, and manual check buttons
- **Auto-Refresh**: Dashboard updates every 5 seconds

### Categories

- 🚨 Breaking News
- 💼 Business
- 💻 Technology
- 🏛️ Politics
- ⚽ Sports
- 🎬 Entertainment
- 🏥 Health
- 🔬 Science

## Integration with Other Systems

### AI Auto-Publisher

The trending monitor uses the AI Auto-Publisher system to generate articles:
- Automatic humanization of AI content
- Copyright safety checks
- Quality and originality validation
- SEO optimization
- Blockchain content proof
- Auto-linking to related articles

### Scheduler

Works alongside the AI Scheduler:
- **Scheduler**: Generates articles on fixed schedule (every 2 hours)
- **Trending Monitor**: Generates articles on-demand when trends detected
- **Combined**: Ensures constant content flow with both scheduled and trending content

## Monitoring & Logging

### Console Output

The system logs all activities to console:

```
🔍 Trending konular kontrol ediliyor...
🔥 3 yeni trending konu bulundu!

📰 Trending haber yapılıyor: Major earthquake hits California coast with 7.2 magnitude
   🔥 Trend Skoru: 95/100
   ⚡ Aciliyet: breaking
   📂 Kategori: breaking-news
   📡 Kaynak: NewsAPI - CNN

✅ Trending haber başarıyla yayınlandı!
   📊 Kalite: 8.5/10
   📊 Özgünlük: 9.2/10
   🌐 URL: /news/major-earthquake-hits-california-coast-with-72-magnitude
```

### Metrics Tracked

- Total trending topics detected
- Successfully published articles
- Failed publications
- Average quality scores
- Average originality scores
- Last check timestamp

## Troubleshooting

### Monitor Not Starting

1. Check if `TRENDING_NEWS_MONITOR_ENABLED=true` in `.env.local`
2. Verify server logs for startup errors
3. Check if `NEWS_API_KEY` is configured

### No Trending Topics Found

1. Verify `NEWS_API_KEY` is valid
2. Check News API account status and rate limits
3. Monitor will use fallback simulated topics if API fails
4. Try manual topic publishing via admin dashboard

### Articles Not Publishing

1. Check quality score (must be ≥ 7/10)
2. Check originality score (must be ≥ 8/10)
3. Verify OpenAI API key is configured
4. Check console logs for specific errors

### High API Usage

1. Increase `TRENDING_CHECK_INTERVAL_MINUTES` to reduce frequency
2. Implement caching for News API responses
3. Consider using News API's free tier limits

## Performance Considerations

### API Rate Limits

- **News API Free Tier**: 100 requests/day
- **Recommended Check Interval**: 5-10 minutes
- **Daily Trending Articles**: ~20-30 articles

### Optimization Tips

1. **Increase Check Interval**: Reduce API calls by checking less frequently
2. **Implement Caching**: Cache trending topics for 5-10 minutes
3. **Batch Processing**: Process multiple topics in parallel
4. **Database Indexing**: Index topic names for faster deduplication

## Future Enhancements

- [ ] Integration with Google Trends API
- [ ] Twitter/X trending topics integration
- [ ] Reddit trending subreddits
- [ ] YouTube trending videos
- [ ] Trend history analytics
- [ ] Predictive trending detection
- [ ] Multi-language support
- [ ] Custom trend scoring algorithm
- [ ] Webhook notifications for new trends
- [ ] Trend analytics dashboard

## Related Documentation

- [AI Auto-Publisher](./AI-AUTO-PUBLISHER.md)
- [AI Scheduler](./AI-SCHEDULER.md)
- [Production Setup Guide](./PRODUCTION-SETUP-GUIDE.md)
