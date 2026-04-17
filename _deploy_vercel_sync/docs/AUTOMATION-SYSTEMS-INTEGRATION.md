# Automation Systems Integration Guide

Complete guide for integrating and managing the AI Scheduler and Trending News Monitor systems.

## Overview

The platform includes two complementary automation systems that work together to ensure constant content flow:

1. **AI Scheduler** - Generates articles on a fixed schedule (every 2 hours)
2. **Trending News Monitor** - Generates articles on-demand when trends are detected

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Generation                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐          ┌──────────────────────┐     │
│  │  AI Scheduler    │          │ Trending Monitor     │     │
│  │  (Fixed Time)    │          │ (Real-time)          │     │
│  │                  │          │                      │     │
│  │ • Every 2 hours  │          │ • Every 5 minutes    │     │
│  │ • 5 articles     │          │ • Detects trends     │     │
│  │ • Predictable    │          │ • Breaking news      │     │
│  └────────┬─────────┘          └──────────┬───────────┘     │
│           │                               │                  │
│           └───────────────┬───────────────┘                  │
│                           │                                  │
│                    ┌──────▼──────┐                           │
│                    │ AI Publisher │                          │
│                    │              │                          │
│                    │ • Generate   │                          │
│                    │ • Validate   │                          │
│                    │ • Optimize   │                          │
│                    │ • Publish    │                          │
│                    └──────┬───────┘                          │
│                           │                                  │
│                    ┌──────▼──────────┐                       │
│                    │ Published News  │                       │
│                    │ Portal          │                       │
│                    └─────────────────┘                       │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## AI Scheduler

### Purpose
Generates articles on a fixed schedule to ensure consistent content flow.

### Configuration

```env
# Enable/disable scheduler
AI_AUTO_SCHEDULER_ENABLED=true

# Check interval in hours (default: 2)
AI_SCHEDULER_INTERVAL_HOURS=2

# Articles per run (default: 5)
AI_SCHEDULER_ARTICLES_PER_RUN=5

# Maximum daily articles (default: 60)
AI_SCHEDULER_MAX_DAILY_ARTICLES=60

# Start time (optional, format: HH:MM)
AI_SCHEDULER_START_TIME=00:00
```

### How It Works

1. **Initialization**: Starts 10 seconds after server boot
2. **Scheduling**: Runs every 2 hours (configurable)
3. **Generation**: Creates 5 articles per run
4. **Publishing**: Auto-publishes if quality/originality thresholds met
5. **Tracking**: Maintains daily quota (max 60 articles/day)

### Admin Dashboard

Access at `/admin/scheduler`

**Features:**
- Real-time status display
- Uptime tracking
- Statistics (generated, published, failed)
- Manual trigger button
- Start/stop controls
- Daily quota display

### API Endpoints

**Get Status:**
```bash
GET /api/scheduler
Header: x-api-key: dev-api-key-12345
```

**Control Scheduler:**
```bash
POST /api/scheduler
Header: x-api-key: dev-api-key-12345
Body: {"action": "start|stop|run"}
```

## Trending News Monitor

### Purpose
Detects trending topics in real-time and generates articles about them immediately.

### Configuration

```env
# Enable/disable monitor
TRENDING_NEWS_MONITOR_ENABLED=true

# Check interval in minutes (default: 5)
TRENDING_CHECK_INTERVAL_MINUTES=5

# Minimum trend score (1-100, default: 70)
TRENDING_MIN_SCORE=70

# News API key for real trending data
NEWS_API_KEY=your_api_key_here
```

### How It Works

1. **Initialization**: Starts 15 seconds after server boot
2. **Detection**: Checks for trending topics every 5 minutes
3. **Fetching**: Gets real data from News API
4. **Filtering**: Removes already-published topics
5. **Sorting**: Prioritizes by trend score (breaking news first)
6. **Generation**: Creates articles about trending topics
7. **Publishing**: Auto-publishes if quality thresholds met

### Admin Dashboard

Access at `/admin/trending`

**Features:**
- Real-time monitoring status
- Tracked topics count
- Manual topic publishing form
- Category selection (8 categories)
- Control buttons (start/stop/check)
- Recently published topics history
- Quality and originality scores

### API Endpoints

**Get Status:**
```bash
GET /api/trending
Header: x-api-key: dev-api-key-12345
```

**Control Monitor:**
```bash
POST /api/trending
Header: x-api-key: dev-api-key-12345
Body: {"action": "start|stop|check"}
```

**Publish Manual Topic:**
```bash
POST /api/trending
Header: x-api-key: dev-api-key-12345
Body: {
  "action": "publish",
  "topic": "Your topic here",
  "category": "breaking-news"
}
```

## Integration Points

### Shared Components

Both systems use:
- **AI Auto-Publisher** (`lib/ai-auto-publisher.ts`)
  - Article generation
  - Quality validation
  - Originality checking
  - SEO optimization
  - Blockchain proof
  - Auto-linking

- **Database** (`lib/database.ts`)
  - Article storage
  - Topic tracking
  - Statistics

- **Authentication** (`lib/auth.ts`)
  - API key validation
  - Rate limiting

### Data Flow

```
Scheduler/Monitor
    ↓
Topic/Keywords
    ↓
AI Auto-Publisher
    ↓
Generate Article
    ↓
Validate Quality (≥7/10)
    ↓
Validate Originality (≥8/10)
    ↓
SEO Optimization
    ↓
Blockchain Proof
    ↓
Auto-Linking
    ↓
Database Storage
    ↓
Published Article
```

## Combined Operation

### Daily Content Flow

**Example Schedule:**

```
00:00 - Scheduler runs (5 articles)
02:00 - Scheduler runs (5 articles)
04:00 - Scheduler runs (5 articles)
06:00 - Scheduler runs (5 articles)
08:00 - Scheduler runs (5 articles)
10:00 - Scheduler runs (5 articles)
12:00 - Scheduler runs (5 articles)
14:00 - Scheduler runs (5 articles)
16:00 - Scheduler runs (5 articles)
18:00 - Scheduler runs (5 articles)
20:00 - Scheduler runs (5 articles)
22:00 - Scheduler runs (5 articles)

+ Trending Monitor checks every 5 minutes
  - Publishes breaking news immediately
  - Publishes trending topics as detected
  - Publishes viral topics on-demand
```

### Daily Output

- **Scheduled**: ~60 articles/day (12 runs × 5 articles)
- **Trending**: ~20-30 articles/day (varies based on trends)
- **Total**: ~80-90 articles/day

## Monitoring & Logging

### Console Output

Both systems log to console with emoji indicators:

```
🔍 Trending konular kontrol ediliyor...
🔥 3 yeni trending konu bulundu!
📰 Trending haber yapılıyor: [topic]
✅ Trending haber başarıyla yayınlandı!

🤖 AI Scheduler başlatıldı!
📊 Ayarlar: Min Kalite=7, Min Özgünlük=8
📝 [1/5] İşleniyor: [topic]
✅ Başarılı: [title]
```

### Metrics Tracked

**Scheduler:**
- Total generated articles
- Total published articles
- Total failed articles
- Average quality score
- Average originality score
- Last run time
- Daily quota usage

**Trending Monitor:**
- Total detected trends
- Total published articles
- Tracked topics count
- Last check time
- Monitoring status

## Best Practices

### Configuration

1. **Scheduler Interval**: Set based on content needs
   - 1 hour: High-frequency content (news sites)
   - 2 hours: Balanced approach (recommended)
   - 4 hours: Low-frequency content

2. **Trending Check Interval**: Balance API usage vs. responsiveness
   - 5 minutes: Real-time trending (recommended)
   - 10 minutes: Balanced approach
   - 30 minutes: Low API usage

3. **Quality Thresholds**: Don't lower below recommended
   - Min Quality: 7/10 (don't lower)
   - Min Originality: 8/10 (don't lower)

### Monitoring

1. **Daily Checks**:
   - Visit `/admin/scheduler` to verify scheduler is running
   - Visit `/admin/trending` to check trending monitor status
   - Review console logs for errors

2. **Weekly Reviews**:
   - Check article quality scores
   - Monitor originality scores
   - Review published articles count
   - Check for API errors

3. **Monthly Analysis**:
   - Analyze content performance
   - Review trending topics detected
   - Optimize category distribution
   - Plan content strategy

### Troubleshooting

**Scheduler Not Running:**
1. Check `AI_AUTO_SCHEDULER_ENABLED=true`
2. Verify OpenAI API key
3. Check server logs for errors
4. Restart server

**Trending Monitor Not Detecting:**
1. Verify `NEWS_API_KEY` is set
2. Check News API account status
3. Verify API rate limits not exceeded
4. Check server logs

**Low Quality Scores:**
1. Review generated articles
2. Check OpenAI API quality
3. Adjust quality thresholds if needed
4. Review topic selection

## Performance Optimization

### API Usage

**News API:**
- Free tier: 100 requests/day
- Recommended interval: 5-10 minutes
- Daily articles: ~20-30

**OpenAI API:**
- Usage depends on article generation
- Estimated: ~$5-20/day for 80-90 articles
- Monitor usage in OpenAI dashboard

### Database Optimization

1. **Index Topics**: Speed up deduplication
2. **Archive Old Articles**: Reduce database size
3. **Batch Operations**: Process multiple articles together
4. **Cache Results**: Cache trending topics for 5 minutes

### Server Resources

1. **Memory**: ~200-500MB for both systems
2. **CPU**: Minimal impact (async operations)
3. **Network**: ~1-2 Mbps average
4. **Storage**: ~1GB per 1000 articles

## Future Enhancements

### Scheduler Improvements
- [ ] Machine learning-based topic selection
- [ ] Time-zone aware scheduling
- [ ] A/B testing for content types
- [ ] Predictive scheduling based on traffic

### Trending Monitor Improvements
- [ ] Google Trends API integration
- [ ] Twitter/X trending topics
- [ ] Reddit trending subreddits
- [ ] YouTube trending videos
- [ ] Multi-language support
- [ ] Predictive trending detection

### Integration Improvements
- [ ] Unified dashboard for both systems
- [ ] Advanced analytics and reporting
- [ ] Webhook notifications
- [ ] Custom scheduling rules
- [ ] Content calendar view

## Support & Documentation

- **AI Scheduler**: `docs/AI-SCHEDULER.md`
- **Trending Monitor**: `docs/TRENDING-NEWS-MONITOR.md`
- **Quick Start**: `docs/TRENDING-NEWS-MONITOR-QUICKSTART.md`
- **Production Setup**: `docs/PRODUCTION-SETUP-GUIDE.md`

## Related Systems

- **AI Auto-Publisher**: Article generation and publishing
- **SEO Optimizer**: Content optimization
- **Content Proof System**: Blockchain verification
- **Auto-Semantic Interlinking**: Related article linking
- **Analytics**: Performance tracking

## Deployment Checklist

- [ ] Configure `NEWS_API_KEY` in production
- [ ] Set `AI_AUTO_SCHEDULER_ENABLED=true`
- [ ] Set `TRENDING_NEWS_MONITOR_ENABLED=true`
- [ ] Configure appropriate check intervals
- [ ] Set quality thresholds
- [ ] Test both systems manually
- [ ] Monitor console logs
- [ ] Set up alerts for failures
- [ ] Document custom configurations
- [ ] Train team on admin dashboards

## Status

✅ **COMPLETE** - Both systems fully integrated and ready for production use.
