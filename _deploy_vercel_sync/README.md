# 🚀 SIA Intelligence Platform

Bloomberg Terminal-style intelligence platform for high-net-worth individuals and institutional investors, featuring AI-powered market analysis, blockchain intelligence, and real-time whale tracking.

## ✨ Core Features

### 🎯 War Room V60.8
- **7-Language Support**: TR, EN, FR, DE, ES, RU, AR
- **Real-Time News Feed**: Dynamic intelligence radar with priority scoring
- **AI Translation Engine**: GROQ (primary) + Gemini (fallback)
- **Multi-Language Content Vault**: Synchronized translation across all languages
- **Image Generation**: AI-powered visual intelligence
- **Content Publishing**: Direct injection to content buffer
- **Auto-Refresh**: 60-second feed updates

### 🧠 Sovereign Core (Python Backend)
- **Gemini 2.5 Pro Integration**: Advanced AI reasoning
- **Factory System**: Automated content generation
- **Brain Module**: SIA-format intelligence processing
- **Scout Module**: Data ingestion and monitoring
- **Rate Limiting**: 45s delay for API stability

### 📰 SIA News System
- **Multi-Language Generation**: 7 languages supported
- **E-E-A-T Optimization**: Google-compliant content
- **AdSense Integration**: Revenue-optimized placement
- **SEO Architecture**: Instant indexing + structured data
- **Audio/Voice System**: TTS with SSML support

### 💰 Revenue Systems
- **AdSense Placement Optimizer**: Smart ad positioning
- **High-CPC Keyword Intelligence**: Revenue maximization
- **Affiliate Intelligence**: Automated affiliate integration
- **Revenue Maximizer**: Multi-stream optimization

### 🔒 Security & Compliance
- **Ban Shield**: AdSense policy compliance
- **Deep Cyber Shield**: Multi-layer security
- **Content Proof System**: Originality verification
- **E-E-A-T Protocols**: Trust signal generation

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Next.js Frontend
npm install

# Python Backend
cd sovereign-core
pip install -r requirements.txt
cd ..
```

### 2. Environment Variables

Create `.env.local` in root:

```env
# AI APIs
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here

# Database
DATABASE_URL="file:./dev.db"

# Backend
SIAINTEL_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_SIAINTEL_BACKEND_URL=http://localhost:8000

# Admin
NEXT_PUBLIC_ADMIN_PASSWORD=sia2026
```

Create `sovereign-core/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL_TYPE=2.5-pro
RATE_LIMIT_DELAY=45
```

### 3. Start Services

**Terminal 1 - Next.js Frontend:**
```bash
npm run dev
```

**Terminal 2 - Python Backend:**
```bash
cd sovereign-core
python run-dev.py
```

### 4. Access Applications

- **War Room**: http://localhost:3000/tr/admin/warroom
- **Admin Dashboard**: http://localhost:3000/tr/admin
- **Homepage**: http://localhost:3000
- **Python Backend**: http://localhost:8000

## 📁 Project Structure

```
sia-intelligence-platform/
├── app/                         # Next.js 14 App Router
│   ├── [lang]/                 # Multi-language routes
│   │   ├── admin/              # Admin dashboard
│   │   │   └── warroom/        # War Room V60.8
│   │   ├── news/[slug]/        # News articles
│   │   └── page.tsx            # Homepage
│   └── api/                    # API routes
│       ├── war-room/           # War Room APIs
│       ├── translate/          # Translation API (GROQ/Gemini)
│       ├── content-buffer/     # Content publishing
│       ├── generate-image/     # Image generation
│       └── sia-news/           # SIA News system
├── sovereign-core/             # Python Backend
│   ├── core/                   # Core modules
│   │   ├── brain.py           # AI reasoning engine
│   │   ├── scout.py           # Data ingestion
│   │   └── compositor.py      # Content composition
│   ├── factory.py             # Content factory
│   ├── main.py                # Main entry point
│   └── logs/                  # Backend logs
├── lib/                        # Business logic
│   ├── sia-news/              # SIA News system
│   ├── ai/                    # AI integrations
│   ├── seo/                   # SEO optimization
│   ├── revenue/               # Revenue systems
│   └── compliance/            # Compliance & security
├── components/                 # React components
├── docs/                       # Documentation (238 files)
├── logs/                       # Frontend logs
└── .kiro/                      # Kiro AI configuration
    └── steering/              # AI steering rules
```

## 🎯 Usage

### War Room Workflow

1. **Access War Room**: http://localhost:3000/tr/admin/warroom
2. **Select News**: Click on any news item from the radar feed
3. **Generate Content**: Click "Run_SIA_Intelligence" for selected language
4. **Review**: Switch between Edit/Preview modes
5. **Generate Image**: Click "Generate Visual Intel"
6. **Translate**: Switch language and generate content for each
7. **Publish**: Click "Authorize_Inject" to publish to content buffer

### Translation API

```typescript
// POST /api/translate
{
  "text": "Bitcoin surged 8% to $67,500...",
  "targetLang": "tr",
  "newsTitle": "Bitcoin Rally Continues",
  "sourceLang": "en"
}

// Response
{
  "success": true,
  "translatedText": "Bitcoin %8 yükselerek 67.500$'a ulaştı...",
  "title": "Bitcoin Rallisi Devam Ediyor"
}
```

### Content Buffer API

```typescript
// POST /api/content-buffer
{
  "article": {
    "headline": "Bitcoin Rally Analysis",
    "fullContent": "...",
    "imageUrl": "https://...",
    "language_code": "tr",
    "source": "SIA_WAR_ROOM"
  }
}
```

## 🌐 Supported Languages

- 🇹🇷 **Turkish (tr)**: Primary language, full support
- 🇺🇸 **English (en)**: Complete translation
- 🇫🇷 **French (fr)**: Complete translation
- 🇩🇪 **German (de)**: Complete translation
- 🇪🇸 **Spanish (es)**: Complete translation
- 🇷🇺 **Russian (ru)**: Complete translation
- 🇸🇦 **Arabic (ar)**: RTL support, complete translation

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI, Lucide React
- **Animations**: Framer Motion
- **State**: Zustand

### Backend
- **Runtime**: Python 3.11+
- **AI**: Google Gemini 2.5 Pro
- **Translation**: GROQ (llama-3.3-70b-versatile)
- **Database**: SQLite (Prisma ORM)

### AI & APIs
- **Primary Translation**: GROQ API (ultra-fast)
- **Fallback Translation**: Gemini 2.0 Flash
- **Content Generation**: Gemini 2.5 Pro
- **Image Generation**: Integrated AI service

### Infrastructure
- **Deployment**: Vercel (Next.js) + Custom (Python)
- **Caching**: Edge caching strategy
- **CDN**: Vercel Edge Network
- **Monitoring**: Performance monitoring system

## 📝 Key API Endpoints

### War Room
```bash
GET  /api/war-room/feed          # Get news feed (5-7 articles)
POST /api/translate               # Translate content (GROQ/Gemini)
POST /api/generate-image          # Generate article image
POST /api/content-buffer          # Publish to buffer
```

### SIA News
```bash
POST /api/sia-news/generate       # Generate news article
GET  /api/sia-news/articles       # List articles
POST /api/sia-news/batch-index    # Batch index to Google
POST /api/sia-news/audio          # Generate audio version
```

### SEO & Analytics
```bash
POST /api/seo/generate-schema     # Generate structured data
POST /api/sia-news/index-google   # Instant Google indexing
GET  /api/sia-news/metrics        # Performance metrics
```

## 🔧 Development

### Build & Deploy
```bash
# Build Next.js
npm run build

# Start production
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Testing
```bash
# Run tests (when implemented)
npm test

# E2E tests
npm run test:e2e

# Stress tests
npm run test:stress
```

### Logs & Monitoring
```bash
# View frontend logs
tail -f logs/app.log

# View backend logs
tail -f sovereign-core/logs/sia_*.log

# Search for errors
grep "ERROR" logs/app.log
```

## 📚 Documentation

- **Main Docs**: See [docs/README.md](docs/README.md) for complete documentation index
- **Security**: See [SECURITY-AUDIT-COMPLETE.md](SECURITY-AUDIT-COMPLETE.md)
- **Sovereign Core**: See [sovereign-core/README.md](sovereign-core/README.md)
- **War Room**: See War Room documentation in `docs/`
- **SIA News**: See SIA News documentation in `docs/`

### Quick Links
- [War Room Guide](docs/SIA-WAR-ROOM-LAUNCH-READY.md)
- [Translation System](docs/SIA-WAR-ROOM-GEMINI-TRANSLATION-COMPLETE.md)
- [AdSense Compliance](.kiro/steering/adsense-content-policy.md)
- [E-E-A-T Protocols](docs/EEAT-PROTOCOLS-IMPLEMENTATION-COMPLETE.md)

## 🔒 Security

- ✅ API keys protected in `.env.local` (gitignored)
- ✅ No hardcoded credentials in code
- ✅ Security audit completed (March 4, 2026)
- ✅ Content compliance with AdSense policies
- ✅ E-E-A-T optimization for Google trust

See [SECURITY-AUDIT-COMPLETE.md](SECURITY-AUDIT-COMPLETE.md) for details.

## 🚨 Troubleshooting

### War Room not loading?
1. Check both services are running (Next.js + Python)
2. Verify API keys in `.env.local`
3. Check browser console for errors
4. Review logs: `logs/app.log` and `sovereign-core/logs/`

### Translation failing?
1. Verify GROQ_API_KEY is valid
2. Check GEMINI_API_KEY as fallback
3. Review `logs/translation.log`
4. Check API rate limits

### Python backend issues?
1. Verify `sovereign-core/.env` exists
2. Check Python dependencies: `pip install -r requirements.txt`
3. Review `sovereign-core/logs/sia_*.log`
4. Ensure port 8000 is available

## 📊 System Status

- **War Room**: ✅ Operational (V60.8)
- **Translation**: ✅ GROQ + Gemini fallback
- **Content Buffer**: ✅ Active
- **Image Generation**: ✅ Active
- **Python Backend**: ✅ Running (Port 8000)
- **Next.js Frontend**: ✅ Running (Port 3000)

## 🎯 Roadmap

- [ ] Implement Winston/Pino logging
- [ ] Add pre-commit hooks for security
- [ ] Enable GitHub secret scanning
- [ ] Implement automated testing
- [ ] Add performance monitoring dashboard
- [ ] Enhance error tracking with Sentry

## 📄 License

Proprietary - SIA Intelligence Platform

## 👥 Team

SIA Intelligence Platform Development Team

---

**Version**: 60.8
**Last Updated**: March 4, 2026
**Status**: Production Ready
