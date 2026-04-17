# SIAIntel Factory - Autonomous Video Production Engine

**"Mutfak"** - Python Backend & Video Fabrikası

## 🎯 Overview

Factory, SIAIntel'in otonom video üretim motorudur. RSS feed'lerden haber toplar, Gemini AI ile 6 dilde analiz eder ve her dil için logolu video üretir.

## 🏗️ Architecture

```
Factory (factory.py)
    ↓
    ├── Scout (core/scout.py)          → RSS + Google News tarama
    ├── Brain (core/brain.py)          → Gemini 2.5 Pro analiz (6 dil)
    ├── Voice (core/voice.py)          → Edge-TTS ses sentezi
    ├── Compositor (core/compositor.py) → MoviePy video kurgu + logo
    └── Database (core/database.py)    → SQLite deduplication
```

## 📦 Features

### 1. Multi-Source News Aggregation
- **5 Premium RSS Feeds**:
  - CoinDesk (crypto)
  - Cointelegraph (blockchain)
  - Investing.com (markets)
  - Yahoo Finance (stocks)
  - MarketWatch (business)

- **Google News Keywords**:
  - Bitcoin price
  - Ethereum market
  - Stock market news
  - Federal Reserve
  - Cryptocurrency regulation

### 2. AI-Powered Analysis (Gemini 2.5 Pro)
- **6 Strategic Languages**: EN, TR, DE, ES, FR, AR
- **CPM-Optimized Tonality**: Her dil için bölgesel CPM dinamiklerine göre içerik
- **Sentiment Analysis**: BULLISH/BEARISH/NEUTRAL + 0-100 skor
- **Rate Limit Handling**: 45s base delay + exponential backoff

### 3. Video Production
- **Duration**: 45 seconds per video
- **Logo Watermark**: assets/logo.png (top-right, 80% opacity)
- **Audio**: Edge-TTS neural voices
- **Output**: MP4 format, 1280x720

### 4. Autonomous Operation
- **Cycle Interval**: 30 minutes
- **Articles per Cycle**: Top 3 new articles
- **Videos per Article**: 6 (one per language)
- **Total Videos per Cycle**: Up to 18 videos

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd sovereign-core
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Test Single Cycle

```bash
python test_factory.py
```

### 4. Run Autonomous Mode

```bash
python factory.py
```

## 📊 Output Structure

### Videos
```
public/videos/
├── video_en_20260228_190000.mp4
├── video_tr_20260228_190000.mp4
├── video_de_20260228_190000.mp4
├── video_es_20260228_190000.mp4
├── video_fr_20260228_190000.mp4
└── video_ar_20260228_190000.mp4
```

### Feed Data
```json
// data/feed.json
{
  "articles": [
    {
      "id": "news-1234567890-0",
      "title": "Bitcoin Surges Past $50K",
      "link": "https://...",
      "published": "2026-02-28T19:00:00",
      "source": "CoinDesk",
      "processed_at": "2026-02-28T19:05:00",
      "total_cpm": 1350,
      "languages": [
        {
          "code": "en",
          "language": "English",
          "flag": "🇺🇸",
          "cpm": 220,
          "title": "Bitcoin Breaks $50K Barrier...",
          "meta": "Institutional demand drives...",
          "sentiment": "BULLISH",
          "sentiment_score": 85,
          "video": "/videos/video_en_20260228_190000.mp4"
        }
      ]
    }
  ],
  "last_updated": "2026-02-28T19:05:00"
}
```

### Database
```
data/siaintel.db (SQLite)
├── articles (deduplication)
├── intelligence (analysis results)
└── videos (video metadata)
```

## 🔧 Configuration

### Cycle Interval
```python
# factory.py
CYCLE_INTERVAL = 30 * 60  # 30 minutes (in seconds)
```

### RSS Sources
```python
# factory.py
RSS_SOURCES = [
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
    'https://cointelegraph.com/rss',
    # Add more...
]
```

### Keywords
```python
# factory.py
KEYWORDS = [
    'Bitcoin price',
    'Ethereum market',
    # Add more...
]
```

### Rate Limiting
```python
# factory.py
rate_limiter = RateLimiter(base_delay=45)  # 45 seconds
```

## 📈 Performance

### Single Cycle Metrics
- **Duration**: ~15-20 minutes (3 articles × 6 languages)
- **API Calls**: ~3 (one per article, returns 6 languages)
- **Videos Produced**: Up to 18 (3 articles × 6 languages)
- **Storage**: ~50-100 MB per cycle

### Daily Production
- **Cycles**: 48 (every 30 minutes)
- **Articles**: ~144 (3 per cycle)
- **Videos**: ~864 (18 per cycle)
- **Storage**: ~2.4-4.8 GB per day

## 🛡️ Error Handling

### Rate Limit (429)
- **Base Delay**: 45 seconds between requests
- **Retry Delay**: 60 seconds on 429 error
- **Max Retries**: 5 attempts
- **Exponential Backoff**: 2^retry_count

### Failed Articles
- **Skip**: Continue to next article
- **Log**: Error logged to `logs/factory.log`
- **No Crash**: System remains operational

### Resource Management
- **Temp Files**: Cleaned after video creation
- **Database**: Automatic deduplication
- **Logs**: Rotated daily

## 🔍 Monitoring

### Logs
```bash
# Real-time monitoring
tail -f logs/factory.log

# Search for errors
grep "ERROR" logs/factory.log

# Count processed articles
grep "Article processed" logs/factory.log | wc -l
```

### Database Queries
```bash
# Enter SQLite shell
sqlite3 data/siaintel.db

# Count articles
SELECT COUNT(*) FROM articles;

# Recent videos
SELECT * FROM videos ORDER BY created_at DESC LIMIT 10;
```

## 🚨 Troubleshooting

### Issue: No videos produced
**Solution**: Check `logs/factory.log` for errors. Verify:
- Gemini API key is valid
- `assets/logo.png` exists
- FFmpeg is installed

### Issue: Rate limit errors
**Solution**: Increase `base_delay` in RateLimiter:
```python
rate_limiter = RateLimiter(base_delay=60)  # Increase to 60s
```

### Issue: Database locked
**Solution**: Only one factory instance should run at a time.

## 📝 Next.js Integration

Factory outputs are automatically consumed by Next.js frontend:

```typescript
// app/page.tsx
const response = await fetch('http://localhost:8000/videos/recent?limit=6')
const data = await response.json()
// data.videos contains latest videos with metadata
```

## 🎯 Production Deployment

### Systemd Service (Linux)
```ini
[Unit]
Description=SIAIntel Factory
After=network.target

[Service]
Type=simple
User=siaintel
WorkingDirectory=/path/to/sovereign-core
ExecStart=/usr/bin/python3 factory.py
Restart=always

[Install]
WantedBy=multi-user.target
```

### Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["python", "factory.py"]
```

## 📚 Related Documentation

- [Brain Module](docs/BRAIN-MODULE-COMPLETE.md)
- [Sovereign Core](docs/SOVEREIGN-CORE-COMPLETE.md)
- [SIAIntel Launch](docs/SIAINTEL-LAUNCH-COMPLETE.md)

## 🤝 Contributing

Factory is part of the SIAIntel ecosystem. For contributions:
1. Test with `test_factory.py`
2. Ensure all 6 languages work
3. Verify video output quality
4. Check database integrity

## 📄 License

Proprietary - SIAIntel Project

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: February 28, 2026
