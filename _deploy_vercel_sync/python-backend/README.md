# SOVEREIGN V14 - Python Backend

Otonom Finansal İstihbarat & Yayın Motoru - Python Backend Core

## 🚀 Hızlı Başlangıç

### 1. Kurulum

```bash
# Python backend klasörüne git
cd python-backend

# Virtual environment oluştur
python -m venv venv

# Virtual environment'ı aktif et
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Bağımlılıkları yükle
pip install -r requirements.txt
```

### 2. Environment Ayarları

```bash
# .env dosyası oluştur
cp .env.example .env

# .env dosyasını düzenle ve Gemini API key ekle
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Backend'i Başlat

```bash
# Development mode
python main.py

# Veya uvicorn ile
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend şu adreste çalışacak: `http://localhost:8000`

## 📡 API Endpoints

### GET /
Root endpoint - sistem durumu

### GET /news?limit=10
İşlenmiş son haberleri listele

**Response:**
```json
{
  "success": true,
  "count": 10,
  "intelligence": [...]
}
```

### POST /manual-process
Manuel olarak bir haberi işle

**Request:**
```json
{
  "id": "news-123",
  "title": "Federal Reserve Signals Rate Cuts",
  "link": "https://example.com/news",
  "published": "2026-02-28T10:00:00Z",
  "content": "The Federal Reserve...",
  "source": "Reuters",
  "hash": "abc123"
}
```

### GET /stats
Sistem istatistiklerini getir

### POST /start
Otonom motoru başlat (15 dakikalık cycle)

### POST /stop
Otonom motoru durdur

## 🏗️ Sistem Mimarisi

```
PYTHON BACKEND
├── Scout (RSS Aggregator)
│   └── Google News RSS feeds
│       └── 8 keywords (Nasdaq, Bitcoin, Fed, AI, Fintech, etc.)
│
├── Deduplication System
│   └── JSON-based seen news database
│       └── Hash-based duplicate detection
│
├── Smart Rate Limiter
│   └── 45-second base delay
│       └── Exponential backoff on 429 errors
│
├── Neuro-Sync Kernel
│   └── Gemini 1.5 Pro 002
│       └── 6-language processing
│           └── CPM-optimized content
│
└── FastAPI Server
    └── REST API endpoints
        └── CORS enabled for Next.js frontend
```

## 🌍 6 Stratejik Dil

| Dil | Kod | CPM | Stil | Hedef Kitle |
|-----|-----|-----|------|-------------|
| 🇺🇸 English | en | $220 | Wall Street | Hedge funds |
| 🇦🇪 Arabic | ar | $440 | Royal & Wealth | Sovereign wealth funds |
| 🇩🇪 Deutsch | de | $180 | Industrial Logic | Industrial strategists |
| 🇪🇸 Español | es | $170 | FinTech | FinTech investors |
| 🇫🇷 Français | fr | $190 | Regulatory | Policy makers |
| 🇹🇷 Türkçe | tr | $150 | Market Pulse | Retail traders |

**Toplam CPM per haber:** $1,350

## 🔧 Konfigürasyon

### Rate Limiter
- Base delay: 45 saniye
- Max retries: 5
- Exponential base: 2x
- Max backoff: 10 dakika

### Scheduler
- Interval: 15 dakika
- Max per cycle: 5 haber
- Auto-start: Manuel (API ile başlatılır)

### Deduplication
- Storage: JSON file (`seen_news.json`)
- Hash algorithm: MD5
- Retention: Sınırsız (manuel cleanup gerekir)

## 🧪 Test Etme

### 1. Backend'i Test Et

```bash
# Root endpoint
curl http://localhost:8000/

# Stats
curl http://localhost:8000/stats

# Start engine
curl -X POST http://localhost:8000/start

# Get news
curl http://localhost:8000/news?limit=5
```

### 2. Manuel İşleme Test

```bash
curl -X POST http://localhost:8000/manual-process \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-123",
    "title": "Bitcoin Surges Past $50,000",
    "link": "https://example.com",
    "published": "2026-02-28T10:00:00Z",
    "content": "Bitcoin rallied above $50,000...",
    "source": "Bloomberg",
    "hash": "test123"
  }'
```

## 🔗 Next.js Frontend Entegrasyonu

Next.js frontend'inden Python backend'e bağlanmak için:

```typescript
// lib/python-backend-client.ts
const PYTHON_BACKEND_URL = 'http://localhost:8000';

export async function getIntelligence(limit = 10) {
  const response = await fetch(`${PYTHON_BACKEND_URL}/news?limit=${limit}`);
  return response.json();
}

export async function startEngine() {
  const response = await fetch(`${PYTHON_BACKEND_URL}/start`, {
    method: 'POST'
  });
  return response.json();
}

export async function getStats() {
  const response = await fetch(`${PYTHON_BACKEND_URL}/stats`);
  return response.json();
}
```

## 📊 Loglama

Backend tüm işlemleri console'a loglar:

```
[2026-02-28 10:30:00] [INFO] [SCOUT] Starting news aggregation...
[2026-02-28 10:30:05] [INFO] [SCOUT] Aggregated 45 total news items
[2026-02-28 10:30:05] [INFO] [ENGINE] Found 12 new items
[2026-02-28 10:30:05] [INFO] [RATE_LIMITER] Waiting 45.0s before next request...
[2026-02-28 10:30:50] [INFO] [NEURO_SYNC] Processing: Federal Reserve Signals Rate Cuts...
[2026-02-28 10:31:15] [INFO] [NEURO_SYNC] ✓ Success: 6 languages, CPM: $1350
```

## 🐛 Troubleshooting

### "ModuleNotFoundError: No module named 'feedparser'"
```bash
pip install -r requirements.txt
```

### "GEMINI_API_KEY not found"
```bash
# .env dosyasını kontrol et
cat .env

# API key ekle
echo "GEMINI_API_KEY=your_key_here" > .env
```

### "429 Too Many Requests"
- Normal davranış - sistem otomatik olarak exponential backoff uygular
- Rate limiter loglarını kontrol et
- Base delay'i artır (main.py içinde RATE_LIMIT_DELAY)

### RSS feeds boş dönüyor
- İnternet bağlantısını kontrol et
- Google News RSS URL'lerini test et
- feedparser versiyonunu kontrol et

## 📈 Production Deployment

### 1. Gunicorn ile Production Server

```bash
pip install gunicorn

gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

### 2. Systemd Service (Linux)

```ini
# /etc/systemd/system/sovereign-v14.service
[Unit]
Description=Sovereign V14 Intelligence Engine
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/path/to/python-backend
Environment="PATH=/path/to/venv/bin"
ExecStart=/path/to/venv/bin/gunicorn main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable sovereign-v14
sudo systemctl start sovereign-v14
```

### 3. Docker (Opsiyonel)

```dockerfile
FROM python:3.10-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```bash
docker build -t sovereign-v14 .
docker run -p 8000:8000 --env-file .env sovereign-v14
```

## 🔐 Güvenlik

### Production Checklist
- [ ] `.env` dosyasını `.gitignore`'a ekle
- [ ] API key'i environment variable olarak sakla
- [ ] CORS ayarlarını production domain'e göre güncelle
- [ ] Rate limiting ekle (FastAPI middleware)
- [ ] HTTPS kullan (Nginx/Caddy reverse proxy)
- [ ] Logging'i file'a yönlendir
- [ ] Error tracking ekle (Sentry)
- [ ] Health check endpoint ekle

## 📚 Bağımlılıklar

- **FastAPI**: Modern, hızlı web framework
- **feedparser**: RSS feed parsing
- **google-generativeai**: Gemini API client
- **APScheduler**: Cron job scheduling
- **uvicorn**: ASGI server
- **pydantic**: Data validation

## 🎯 Performans

### Beklenen Metrikler (24 Saat)
- **RSS Scans:** ~96 cycle (15 dakikada bir)
- **News Scanned:** ~500-800 item
- **New Processed:** ~100-150 item
- **Intelligence Generated:** 600-900 language version
- **Total CPM Potential:** $135,000 - $202,500

### API Kullanımı (Free Tier)
- **Requests/Hour:** ~4 request (45s delay)
- **Daily Requests:** ~96 request
- **Monthly Requests:** ~2,880 request
- **Free tier limiti içinde** ✅

## 📞 Destek

Sorular için:
1. Logları kontrol et
2. `/stats` endpoint'ini çağır
3. `seen_news.json` dosyasını kontrol et
4. Gemini API key'i doğrula

---

**Sovereign V14 Python Backend - Production Ready** 🚀
