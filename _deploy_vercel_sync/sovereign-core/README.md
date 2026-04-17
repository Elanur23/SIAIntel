# 🏭 SOVEREIGN V14 - THE FACTORY

**Autonomous Financial Intelligence & Video Production System**

THE FACTORY is a fully autonomous system that transforms financial news into professional multi-language video content. It operates on 30-minute cycles, producing 6-language videos with neural voice narration, financial charts, and sentiment analysis.

## 🎯 System Architecture

```
SCOUT → BRAIN → VOICE → COMPOSITOR
  ↓       ↓       ↓         ↓
 RSS    Gemini  edge-tts  MoviePy
```

### Modules

1. **SCOUT** - RSS News Aggregator
   - Google News RSS feeds (Bitcoin, Nasdaq, Fed, AI, etc.)
   - Automatic deduplication via SQLite
   - 8 financial keywords tracking

2. **BRAIN** - Gemini AI Intelligence
   - Gemini 2.5 Pro for deep analysis
   - 6-language output (EN, TR, DE, ES, FR, AR)
   - CPM-optimized regional tonality
   - Sentiment analysis (BULLISH/BEARISH/NEUTRAL)

3. **VOICE** - Neural Voice Synthesis
   - edge-tts for high-quality neural voices
   - Language-specific voices (e.g., tr-TR-AhmetNeural)
   - MP3 audio output

4. **COMPOSITOR** - Video Production
   - MoviePy for professional video composition
   - 1920x1080 Full HD @ 30fps
   - Financial charts via yfinance
   - Title and sentiment overlays
   - Background studio image

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- ffmpeg (required by MoviePy)
- Gemini API Key

### Installation

```bash
# 1. Install Python dependencies
pip install -r requirements.txt

# 2. Install ffmpeg (Windows)
# Download from: https://ffmpeg.org/download.html
# Add to PATH

# 3. Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY
```

### Configuration (.env)

```env
# Gemini API
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL_TYPE=2.5-pro

# Rate Limiting
RATE_LIMIT_DELAY=45
RATE_LIMIT_RETRY_DELAY=60

# Server
HOST=0.0.0.0
PORT=8000
CYCLE_INTERVAL_MINUTES=30
```

### Run THE FACTORY

```bash
# Start the system
python main.py

# API will be available at:
# http://localhost:8000
```

## 📡 API Endpoints

### System Control

```bash
# Start THE FACTORY (30-minute autonomous cycles)
POST http://localhost:8000/start

# Stop THE FACTORY
POST http://localhost:8000/stop

# Trigger manual production cycle
POST http://localhost:8000/cycle/trigger
```

### Monitoring

```bash
# System status
GET http://localhost:8000/stats

# Recent videos
GET http://localhost:8000/videos/recent?limit=10

# Cycle statistics
GET http://localhost:8000/cycle/stats

# Intelligence reports
GET http://localhost:8000/news?limit=10
```

## 📁 Output Structure

```
sovereign-core/
├── output/
│   ├── videos/          # Final MP4 videos
│   │   ├── news-123_en.mp4
│   │   ├── news-123_tr.mp4
│   │   └── ...
│   └── audio/           # Neural voice MP3 files
│       ├── news-123_en.mp3
│       ├── news-123_tr.mp3
│       └── ...
├── assets/
│   └── studio_background.jpg  # Background image (auto-created if missing)
├── data/
│   └── sovereign.db     # SQLite database
└── logs/
    └── factory.log      # System logs
```

## 🎬 Video Specifications

- **Resolution**: 1920x1080 (Full HD)
- **Frame Rate**: 30 fps
- **Video Codec**: H.264 (libx264)
- **Audio Codec**: AAC @ 192 kbps
- **Duration**: Matches neural voice audio length
- **File Format**: MP4

## 🌍 Supported Languages

| Language | Code | Voice | CPM | Target Audience |
|----------|------|-------|-----|-----------------|
| English | en | en-US-GuyNeural | $220 | Wall Street, Institutional |
| Arabic | ar | ar-SA-HamedNeural | $440 | Gulf Wealth Funds, UHNWI |
| German | de | de-DE-ConradNeural | $180 | Industrial, Manufacturing |
| Spanish | es | es-ES-AlvaroNeural | $170 | FinTech, Digital Banking |
| French | fr | fr-FR-HenriNeural | $190 | Regulatory, Compliance |
| Turkish | tr | tr-TR-AhmetNeural | $150 | Retail Traders, FX |

**Total CPM Potential**: $1,350 per article

## 📊 Financial Chart Detection

THE FACTORY automatically detects financial symbols and generates 24-hour charts:

| Keywords | Symbol | Chart |
|----------|--------|-------|
| Bitcoin, BTC | BTC-USD | Cryptocurrency |
| Ethereum, ETH | ETH-USD | Cryptocurrency |
| Nasdaq | ^IXIC | Tech Index |
| S&P 500, SPX | ^GSPC | Market Index |
| Dow Jones, DJIA | ^DJI | Market Index |
| Fed, Federal Reserve | ^TNX | 10-Year Treasury |

## 🔧 Troubleshooting

### ffmpeg not found
```bash
# Windows: Download from ffmpeg.org and add to PATH
# Linux: sudo apt-get install ffmpeg
# Mac: brew install ffmpeg
```

### Rate limit errors (429)
- System automatically retries with exponential backoff
- Default retry delay: 60 seconds
- Adjust RATE_LIMIT_RETRY_DELAY in .env

### Video rendering slow
- Normal: 30-60 seconds per video
- 6 languages = 3-6 minutes total per article
- Reduce to 3 articles per cycle (already configured)

### Database locked
- SQLite uses check_same_thread=False
- If issues persist, restart the system

## 📈 Performance Metrics

- **Cycle Duration**: ~25 minutes (for 3 articles × 6 languages)
- **Video Production**: ~45 seconds per video
- **Voice Synthesis**: ~5 seconds per language
- **Brain Analysis**: ~15 seconds per article
- **Total Output**: 18 videos per cycle (3 articles × 6 languages)

## 🛡️ Production Considerations

1. **Storage**: ~50-100 MB per video × 18 videos = ~1-2 GB per cycle
2. **Memory**: ~2-4 GB RAM during video rendering
3. **CPU**: Multi-threaded rendering (4 threads default)
4. **Network**: Gemini API + yfinance data fetching

## 📝 Logs

```bash
# View real-time logs
tail -f logs/factory.log

# Search for errors
grep "ERROR" logs/factory.log

# Check cycle completions
grep "PRODUCTION CYCLE COMPLETED" logs/factory.log
```

## 🎯 Next Steps

1. **Deploy to Production**: Use systemd/supervisor for auto-restart
2. **Add CDN**: Upload videos to S3/CloudFlare for distribution
3. **Telegram Bot**: Auto-post videos to Telegram channels
4. **YouTube Upload**: Automated YouTube publishing
5. **Analytics**: Track video views and engagement

## 📄 License

Proprietary - Sovereign V14 Intelligence Architecture

## 🤝 Support

For issues or questions, check logs/factory.log for detailed error messages.

---

**Built with**: Python, FastAPI, Gemini AI, edge-tts, MoviePy, yfinance
