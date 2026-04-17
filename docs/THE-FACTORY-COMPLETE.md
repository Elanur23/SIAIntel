# 🏭 THE FACTORY - Complete System Documentation

**Sovereign V14 - Autonomous Financial Intelligence & Video Production System**

## Executive Summary

THE FACTORY is a fully autonomous system that transforms financial news into professional multi-language video content. Operating on 30-minute cycles, it produces 18 videos per cycle (3 articles × 6 languages) with neural voice narration, real-time financial charts, and sentiment analysis.

**Total CPM Potential**: $1,350 per article × 3 articles = $4,050 per cycle

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    THE FACTORY PIPELINE                      │
└─────────────────────────────────────────────────────────────┘

   SCOUT          BRAIN          VOICE        COMPOSITOR
     │              │              │               │
     ├─► RSS ──────►│              │               │
     │   Feeds      │              │               │
     │              ├─► Gemini ───►│               │
     │              │   2.5 Pro    │               │
     │              │              ├─► edge-tts ──►│
     │              │              │   Neural      │
     │              │              │               ├─► MoviePy
     │              │              │               │   Video
     ▼              ▼              ▼               ▼
  
  SQLite ◄────────────────────────────────────── Database
  Dedup                                          Storage
```

## Module Specifications

### 1. SCOUT - RSS News Aggregator

**Purpose**: Aggregate financial news from Google News RSS feeds

**Features**:
- 8 financial keywords: Nasdaq, Bitcoin, Fed, AI, Fintech, Federal Reserve, Cryptocurrency, Stock Market
- Automatic URL encoding for multi-word keywords
- 5 articles per feed
- MD5 hash-based deduplication
- 1-second delay between feeds

**Output**: List[NewsItem]
```python
NewsItem(
    id="news-1234567890-0",
    title="Bitcoin Surges Past $50K",
    link="https://...",
    published="2024-02-28T10:00:00",
    content="Full article content...",
    source="Reuters",
    hash="abc123..."
)
```

### 2. BRAIN - Gemini AI Intelligence

**Purpose**: Transform raw news into 6-language CPM-optimized intelligence

**Model**: Gemini 2.5 Pro (gemini-2.5-pro)

**Configuration**:
- Temperature: 0.7 (balanced creativity)
- Top-p: 0.9 (nucleus sampling)
- Rate Limit: 45s base delay, 60s retry on 429

**Output**: IntelligencePackage with 6 languages

**Language Tonality**:
- 🇺🇸 EN ($220 CPM): Wall Street institutional style
- 🇦🇪 AR ($440 CPM): Gulf wealth fund prestige
- 🇩🇪 DE ($180 CPM): Industrial efficiency focus
- 🇪🇸 ES ($170 CPM): FinTech innovation energy
- 🇫🇷 FR ($190 CPM): Regulatory oversight analysis
- 🇹🇷 TR ($150 CPM): Market pulse, FX trading

**JSON Schema**:
```json
{
  "languages": [
    {
      "language_code": "en",
      "language": "English",
      "flag": "🇺🇸",
      "cpm": 220,
      "title": "SEO-optimized title (60-70 chars)",
      "meta": "Meta description (150-160 chars)",
      "content_brief": "First paragraph (200-250 words)",
      "cpm_tags": ["5 premium keywords"],
      "full_content": "Complete article (800-1000 words)",
      "sentiment": "BULLISH",
      "sentiment_score": 85
    }
  ]
}
```

### 3. VOICE - Neural Voice Synthesis

**Purpose**: Generate high-quality neural voice narration

**Technology**: edge-tts (Microsoft Edge TTS)

**Voice Configuration**:
| Language | Voice Name | Gender | Quality |
|----------|------------|--------|---------|
| English | en-US-GuyNeural | Male | Premium |
| Turkish | tr-TR-AhmetNeural | Male | Premium |
| German | de-DE-ConradNeural | Male | Premium |
| Spanish | es-ES-AlvaroNeural | Male | Premium |
| French | fr-FR-HenriNeural | Male | Premium |
| Arabic | ar-SA-HamedNeural | Male | Premium |

**Output**: MP3 files @ 192 kbps
- Filename: `{article_id}_{lang_code}.mp3`
- Location: `output/audio/`
- Duration: Matches full_content length (~3-5 minutes)

### 4. COMPOSITOR - Video Production

**Purpose**: Compose professional financial intelligence videos

**Technology**: MoviePy + yfinance + matplotlib

**Video Specifications**:
- Resolution: 1920x1080 (Full HD)
- Frame Rate: 30 fps
- Video Codec: H.264 (libx264, CRF 23)
- Audio Codec: AAC @ 192 kbps
- Duration: Matches audio length
- File Size: ~50-100 MB per video

**Visual Elements**:
1. **Background**: Studio image (1920x1080) or solid black (#0A0A0A)
2. **Title Overlay**: Position (50, 50), Font: Arial Bold 48px, Color: White
3. **Sentiment Overlay**: Position (50, 150), Font: Arial Bold 36px, Color: Dynamic
   - BULLISH: #00FF41 (Neon Green)
   - BEARISH: #FF4136 (Red)
   - NEUTRAL: #FFD700 (Gold)
4. **Financial Chart**: Position (1500, 760), Size: 400x300px
   - 24-hour price data from yfinance
   - Line chart with transparent background
   - Cyan line (#00FF41) on black grid

**Symbol Detection**:
```python
SYMBOL_KEYWORDS = {
    'BTC-USD': ['bitcoin', 'btc', 'crypto'],
    'ETH-USD': ['ethereum', 'eth', 'ether'],
    '^IXIC': ['nasdaq', 'tech stocks'],
    '^GSPC': ['s&p 500', 'spx'],
    '^DJI': ['dow jones', 'djia'],
    '^TNX': ['fed', 'federal reserve', 'treasury']
}
```

**Output**: MP4 files
- Filename: `{article_id}_{lang_code}.mp4`
- Location: `output/videos/`

## Database Schema (SQLite)

### Table: processed_articles
```sql
CREATE TABLE processed_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT UNIQUE NOT NULL,
    hash TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    language TEXT,
    video_count INTEGER DEFAULT 0
)
```

### Table: video_outputs
```sql
CREATE TABLE video_outputs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id INTEGER NOT NULL,
    language_code TEXT NOT NULL,
    video_path TEXT NOT NULL,
    audio_path TEXT NOT NULL,
    duration_seconds REAL,
    file_size_mb REAL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES processed_articles(id)
)
```

## API Endpoints

### System Control

#### POST /start
Start THE FACTORY with 30-minute autonomous cycles

**Response**:
```json
{
  "success": true,
  "message": "THE FACTORY started",
  "cycle_interval": "30 minutes"
}
```

#### POST /stop
Stop THE FACTORY

**Response**:
```json
{
  "success": true,
  "message": "THE FACTORY stopped"
}
```

#### POST /cycle/trigger
Manually trigger a production cycle

**Response**:
```json
{
  "success": true,
  "message": "Production cycle triggered",
  "stats": { ... }
}
```

### Monitoring

#### GET /stats
System statistics

**Response**:
```json
{
  "success": true,
  "stats": {
    "total_scanned": 120,
    "new_processed": 15,
    "duplicates_skipped": 105,
    "videos_produced": 90,
    "errors": 2,
    "last_run": "2024-02-28T10:30:00",
    "last_cycle_duration": 1450.5,
    "intelligence_count": 15,
    "rate_limiter": {
      "total_requests": 45,
      "current_delay_seconds": 45,
      "retry_count": 0
    },
    "database": {
      "total_articles": 15,
      "total_videos": 90,
      "videos_by_language": {
        "en": 15,
        "tr": 15,
        "de": 15,
        "es": 15,
        "fr": 15,
        "ar": 15
      }
    }
  }
}
```

#### GET /videos/recent?limit=10
Recent video outputs

**Response**:
```json
{
  "success": true,
  "count": 10,
  "videos": [
    {
      "id": 1,
      "language_code": "en",
      "video_path": "output/videos/news-123_en.mp4",
      "duration_seconds": 245.5,
      "file_size_mb": 87.3,
      "created_at": "2024-02-28T10:25:00",
      "title": "Bitcoin Surges Past $50K",
      "url": "https://..."
    }
  ]
}
```

#### GET /cycle/stats
Cycle performance statistics

**Response**:
```json
{
  "success": true,
  "cycle_stats": {
    "total_cycles": 15,
    "total_videos": 90,
    "last_cycle_duration": 1450.5,
    "last_run": "2024-02-28T10:30:00",
    "success_rate": 95.5
  }
}
```

## Performance Metrics

### Timing Breakdown (per article)

| Stage | Duration | Notes |
|-------|----------|-------|
| SCOUT | 5-10s | RSS feed aggregation |
| BRAIN | 15-20s | Gemini 2.5 Pro analysis (6 languages) |
| VOICE | 30-40s | edge-tts synthesis (6 languages, ~5s each) |
| COMPOSITOR | 180-300s | MoviePy rendering (6 videos, ~30-50s each) |
| **TOTAL** | **230-370s** | **~4-6 minutes per article** |

### Cycle Performance (3 articles)

- **Total Duration**: 12-18 minutes
- **Videos Produced**: 18 (3 articles × 6 languages)
- **Total File Size**: 900 MB - 1.8 GB
- **CPM Value**: $4,050 (3 articles × $1,350)

### Resource Usage

- **CPU**: 50-80% during video rendering (4 threads)
- **Memory**: 2-4 GB RAM
- **Disk I/O**: ~100 MB/s write during rendering
- **Network**: Minimal (Gemini API + yfinance data)

## Installation & Setup

### Prerequisites

```bash
# Python 3.10+
python --version

# ffmpeg (required by MoviePy)
ffmpeg -version
```

### Install ffmpeg

**Windows**:
1. Download from https://ffmpeg.org/download.html
2. Extract to `C:\ffmpeg`
3. Add `C:\ffmpeg\bin` to PATH

**Linux**:
```bash
sudo apt-get update
sudo apt-get install ffmpeg
```

**Mac**:
```bash
brew install ffmpeg
```

### Install Python Dependencies

```bash
cd sovereign-core
pip install -r requirements.txt
```

### Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env and add your Gemini API key
# Get key from: https://makersuite.google.com/app/apikey
```

### Run THE FACTORY

```bash
python main.py
```

API will be available at: http://localhost:8000

## Troubleshooting

### Issue: ffmpeg not found

**Solution**:
```bash
# Verify ffmpeg installation
ffmpeg -version

# Windows: Add to PATH
# Linux/Mac: Install via package manager
```

### Issue: Rate limit errors (429)

**Solution**:
- System automatically retries with exponential backoff
- Increase `RATE_LIMIT_RETRY_DELAY` in .env
- Consider upgrading to Gemini API paid tier

### Issue: Video rendering slow

**Expected**: 30-50 seconds per video is normal
**Optimization**:
- Reduce articles per cycle (currently 3)
- Use faster preset in MoviePy (currently 'medium')
- Upgrade CPU for faster rendering

### Issue: Database locked

**Solution**:
```bash
# Restart THE FACTORY
# SQLite uses check_same_thread=False for thread safety
```

### Issue: Out of disk space

**Solution**:
```bash
# Clean old videos
rm output/videos/*.mp4
rm output/audio/*.mp3

# Or implement auto-cleanup after upload to CDN
```

## Production Deployment

### Systemd Service (Linux)

```ini
[Unit]
Description=THE FACTORY - Sovereign V14
After=network.target

[Service]
Type=simple
User=factory
WorkingDirectory=/opt/sovereign-core
Environment="PATH=/opt/sovereign-core/venv/bin"
ExecStart=/opt/sovereign-core/venv/bin/python main.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### Docker Deployment

```dockerfile
FROM python:3.10-slim

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg

# Copy application
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

# Run
CMD ["python", "main.py"]
```

### Monitoring & Alerts

```bash
# Watch logs in real-time
tail -f logs/factory.log

# Alert on errors
grep "ERROR" logs/factory.log | mail -s "Factory Error" admin@example.com

# Monitor disk space
df -h output/
```

## Future Enhancements

1. **CDN Upload**: Auto-upload videos to S3/CloudFlare
2. **YouTube Publishing**: Automated YouTube channel management
3. **Telegram Bot**: Real-time video notifications
4. **Multi-Instance**: Horizontal scaling with load balancer
5. **Analytics Dashboard**: Real-time metrics visualization
6. **A/B Testing**: Test different thumbnails/titles
7. **Subtitle Generation**: Auto-generate SRT files
8. **Thumbnail Creation**: AI-generated custom thumbnails

## License

Proprietary - Sovereign V14 Intelligence Architecture

---

**Built with**: Python, FastAPI, Gemini AI, edge-tts, MoviePy, yfinance, SQLite

**Version**: 2.0.0

**Last Updated**: February 28, 2026
