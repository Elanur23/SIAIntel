# SOVEREIGN V14 - Modüler Python Backend

## ✅ TAMAMLANDI

Modüler, temiz ve profesyonel Python backend yapısı başarıyla oluşturuldu.

## 📁 Proje Yapısı

```
sovereign-core/
├── .env                    # API anahtarları ve gizli değişkenler
├── .gitignore              # Git ignore kuralları
├── main.py                 # FastAPI ana uygulama (dış dünyaya açılan kapı)
├── requirements.txt        # Python bağımlılıkları
├── README.md               # Proje dokümantasyonu
├── core/                   # Çekirdek modüller
│   ├── __init__.py         # Modül başlatıcı
│   ├── scout.py            # Google News RSS tarayıcı (haber bulucu)
│   ├── brain.py            # Gemini AI entegrasyonu (6 dilli analiz motoru)
│   └── database.py         # Haber geçmişi veritabanı (deduplication)
├── logs/                   # Sistem çalışma kayıtları
│   └── sovereign.log       # Ana log dosyası
└── data/                   # Yerel veritabanı
    └── seen_news.json      # Görülen haberler
```

## 🧩 Modüller

### 1. Scout (core/scout.py)
**Görev**: Google News RSS feed'lerinden haber toplama

**Özellikler**:
- 8 anahtar kelime: Nasdaq, Bitcoin, Fed, AI, Fintech, Federal Reserve, Cryptocurrency, Stock Market
- Feed başına 5 haber
- URL encoding (boşluklu kelimeler için)
- MD5 hash ile deduplication
- Feed'ler arası 1s gecikme

**Sınıflar**:
- `NewsItem`: Haber veri modeli (Pydantic)
- `Scout`: RSS tarayıcı sınıfı

### 2. Brain (core/brain.py)
**Görev**: Gemini AI ile 6 dilde içerik üretimi

**Özellikler**:
- Gemini 2.5 Pro entegrasyonu
- 6 dil: EN ($220), AR ($440), DE ($180), ES ($170), FR ($190), TR ($150)
- CPM-optimized re-contextualization (çeviri değil!)
- Sentiment analizi (BULLISH/BEARISH/NEUTRAL + 0-100 skor)
- Rate limiting (45s base delay)
- Exponential backoff (429 hatalarında)
- JSON schema enforcement

**Sınıflar**:
- `LanguageContent`: Dil bazlı içerik modeli
- `IntelligencePackage`: İşlenmiş istihbarat paketi
- `RateLimiter`: Akıllı rate limiter
- `Brain`: Gemini AI işleme beyni

**System Instruction**:
- Her dil için özel tonalite
- Bölgesel CPM dinamikleri
- Finansal kültüre göre re-contextualization
- 800-1000 kelimelik premium içerik

### 3. Database (core/database.py)
**Görev**: Haber geçmişi ve deduplication

**Özellikler**:
- JSON-based storage (production'da SQLite/Supabase)
- Hash-based deduplication
- Timestamp tracking
- İstatistik raporlama
- Auto-save

**Sınıflar**:
- `Database`: Veritabanı yönetimi

### 4. Main (main.py)
**Görev**: FastAPI REST API ve otonom motor

**Özellikler**:
- FastAPI framework
- CORS middleware (Next.js entegrasyonu)
- APScheduler (15 dakikalık döngüler)
- In-memory intelligence storage
- Comprehensive logging (file + console)
- Stats tracking

**API Endpoints**:
- `GET /` - Sistem durumu
- `GET /news?limit=10` - İşlenmiş haberler
- `POST /start` - Otonom motoru başlat
- `POST /stop` - Otonom motoru durdur
- `GET /stats` - Sistem istatistikleri
- `POST /manual-process` - Manuel haber işleme

## 🔄 Otonom Döngü

```
1. SCOUT
   ↓ Google News RSS → 40 haber topla
   
2. DEDUPLICATION
   ↓ Hash kontrolü → Yeni haberleri filtrele
   
3. BRAIN
   ↓ Gemini 2.5 Pro → 6 dilde işle (max 5 haber/döngü)
   
4. STORE
   ↓ Intelligence store + Database → Kaydet
   
5. WAIT
   ↓ 15 dakika bekle → Tekrar başla
```

## 🚀 Kurulum ve Çalıştırma

### 1. Bağımlılıkları Yükle
```bash
cd sovereign-core
pip install -r requirements.txt
```

### 2. Environment Variables
`.env` dosyası zaten yapılandırılmış:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Çalıştır
```bash
python main.py
```

Server `http://localhost:8000` adresinde başlar.

### 4. Otonom Motoru Başlat
```bash
curl -X POST http://localhost:8000/start
```

## 📊 Test Komutları

```bash
# Sistem durumu
curl http://localhost:8000/

# İstatistikler
curl http://localhost:8000/stats

# Haberler
curl http://localhost:8000/news?limit=5

# Motoru başlat
curl -X POST http://localhost:8000/start

# Motoru durdur
curl -X POST http://localhost:8000/stop
```

## 📝 Loglar

```bash
# Real-time log takibi
tail -f logs/sovereign.log

# Son 50 satır
tail -n 50 logs/sovereign.log
```

## 🔧 Teknik Detaylar

### Rate Limiting
- **Base Delay**: 45 saniye
- **Exponential Backoff**: 2^retry_count
- **Max Delay**: 600 saniye (10 dakika)
- **Auto-recovery**: Başarılı istekten sonra gecikme azalır

### Deduplication
- **Method**: MD5 hash (title + link)
- **Storage**: JSON file (`data/seen_news.json`)
- **Persistence**: Her işlemde otomatik kayıt

### Logging
- **Format**: `[timestamp] [level] message`
- **Handlers**: File (`logs/sovereign.log`) + Console
- **Level**: INFO
- **Rotation**: Manuel (production'da logrotate kullan)

### Error Handling
- Try-catch her modülde
- Graceful degradation
- Detailed error logging
- HTTP status codes (FastAPI)

## 🎯 Özellikler

✅ **Modüler Yapı**: Her modül bağımsız ve test edilebilir
✅ **Gemini 2.5 Pro**: En güncel model
✅ **6 Dil Desteği**: EN, TR, DE, ES, FR, AR
✅ **CPM Optimization**: Dil başına farklı tonalite
✅ **Rate Limiting**: Free tier uyumlu
✅ **Deduplication**: Hash-based, persistent
✅ **Logging**: File + console, structured
✅ **REST API**: FastAPI, CORS enabled
✅ **Otonom Scheduler**: 15 dakikalık döngüler
✅ **Stats Tracking**: Comprehensive metrics
✅ **Error Recovery**: Exponential backoff
✅ **Production Ready**: .gitignore, requirements.txt, README

## 🔮 Gelecek Geliştirmeler

### Kısa Vadeli
- [ ] SQLite entegrasyonu (JSON yerine)
- [ ] Webhook support (Telegram, Discord)
- [ ] Admin dashboard (web UI)
- [ ] Health check endpoint
- [ ] Prometheus metrics

### Orta Vadeli
- [ ] Supabase entegrasyonu
- [ ] Multi-instance support (horizontal scaling)
- [ ] Redis caching
- [ ] Celery task queue
- [ ] Docker containerization

### Uzun Vadeli
- [ ] Kubernetes deployment
- [ ] GraphQL API
- [ ] Real-time WebSocket
- [ ] ML-based content ranking
- [ ] A/B testing framework

## 📚 Karşılaştırma: Tek Dosya vs Modüler

### Tek Dosya (python-backend/main.py)
- ❌ 600+ satır tek dosya
- ❌ Zor test edilebilir
- ❌ Zor maintain edilebilir
- ❌ Modül bağımlılıkları karışık

### Modüler (sovereign-core/)
- ✅ Her modül ~150-200 satır
- ✅ Bağımsız test edilebilir
- ✅ Kolay maintain
- ✅ Temiz import yapısı
- ✅ Production-ready

## 🎓 Öğrenilen Dersler

1. **Model İsimleri**: `gemini-1.5-pro-002` → `gemini-2.5-pro` (API versiyonu önemli)
2. **URL Encoding**: Boşluklu kelimeler için `+` kullan
3. **Rate Limiting**: Free tier için 45s yeterli, exponential backoff şart
4. **Logging**: Hem file hem console, structured format
5. **Modüler Yapı**: Her modül tek sorumluluk (Single Responsibility Principle)

## 🏆 Başarı Kriterleri

✅ Modüler yapı oluşturuldu
✅ Gemini 2.5 Pro entegre edildi
✅ 6 dil desteği eklendi
✅ Rate limiting çalışıyor
✅ Deduplication aktif
✅ Logging yapılandırıldı
✅ REST API hazır
✅ Otonom scheduler çalışıyor
✅ Dokümantasyon tamamlandı
✅ Production-ready

## 📞 Destek

Sorular için:
- README.md dosyasını incele
- Logs'u kontrol et: `tail -f logs/sovereign.log`
- Stats endpoint'i kullan: `curl http://localhost:8000/stats`

---

**Durum**: ✅ OPERASYONEL
**Versiyon**: 1.0.0
**Son Güncelleme**: 28 Şubat 2026
