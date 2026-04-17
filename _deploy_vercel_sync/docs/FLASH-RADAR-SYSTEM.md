# Flash Radar System

Bloomberg Terminal tarzı hızlı akan anomali tespit sistemi.

## Özellikler

- **Gemini 1.5 Flash**: Saniyeler içinde binlerce satır veriyi analiz eder
- **Anomali Tespiti**: Hacim, fiyat, korelasyon anomalilerini otomatik tespit
- **Bloomberg Tarzı**: 150 karakterlik kısa, aksiyon alınabilir sinyaller
- **Real-time**: Her 30 saniyede bir otomatik güncelleme
- **Ticker Display**: Sayfanın üstünde sürekli akan haber bandı

## Sinyal Tipleri

### ABNORMAL VOLUME
Hacim son 1 saatte %20+ sapma gösterdiğinde tetiklenir.
```
$NVDA - ABNORMAL VOLUME - Insider activity probability increased by 14%
```

### DECOUPLING ALERT
Nasdaq ve Kripto arasındaki korelasyon koptuğunda.
```
$BTC - DECOUPLING ALERT - Crypto diverging from tech stocks by 8.2%
```

### WHALE MOVEMENT
Büyük whale transferleri tespit edildiğinde.
```
$ETH - WHALE MOVEMENT - 3 large transfers detected, total $45M
```

### GAMMA SQUEEZE
Opsiyon gamma squeeze riski tespit edildiğinde.
```
$SPY - GAMMA SQUEEZE - Call wall at $520 may trigger upward pressure
```

### DARK POOL
Dark pool aktivitesi anormal seviyelerde olduğunda.
```
$TSLA - DARK POOL - Elevated activity, 2.3x normal volume
```

## Kullanım

### API Endpoint

```bash
GET /api/flash-radar
```

Response:
```json
{
  "success": true,
  "data": {
    "signals": [
      {
        "asset": "$NVDA",
        "status": "ABNORMAL VOLUME",
        "note": "Insider activity probability increased by 14%",
        "timestamp": "2026-02-28T10:30:00Z",
        "confidence": 85
      }
    ],
    "scanTime": "2026-02-28T10:30:00Z",
    "count": 1
  }
}
```

### Frontend Component

```tsx
import FlashRadarTicker from '@/components/FlashRadarTicker'

export default function Layout({ children }) {
  return (
    <>
      <FlashRadarTicker />
      {children}
    </>
  )
}
```

## Konfigürasyon

### Environment Variables

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Güncelleme Sıklığı

Component içinde değiştirilebilir:
```tsx
const interval = setInterval(fetchSignals, 30000); // 30 saniye
```

## Piyasa Verisi Entegrasyonu

Şu anda mock veri kullanılıyor. Production için gerçek API entegrasyonu:

### CoinGecko (Kripto)
```typescript
const btcData = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true')
```

### Alpha Vantage (Hisse)
```typescript
const nasdaqData = await fetch(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=NDX&apikey=${API_KEY}`)
```

### TradingView (Opsiyon Flow)
```typescript
// TradingView WebSocket veya REST API
```

## Prompt Engineering

Flash Radar'ın prompt'u `lib/ai/flash-radar.ts` içinde:

```typescript
const FLASH_RADAR_PROMPT = `Sen Sovereign V14 sisteminin 'Flash Radar' birimisin...`
```

Prompt'u özelleştirerek:
- Yeni anomali tipleri ekleyebilirsiniz
- Tespit hassasiyetini ayarlayabilirsiniz
- Farklı varlık sınıfları ekleyebilirsiniz

## Performance

- **Gemini 1.5 Flash**: ~1-2 saniye yanıt süresi
- **API Rate Limit**: Dakikada 60 istek (Gemini free tier)
- **Frontend Update**: 30 saniyede bir
- **Bandwidth**: ~5KB per request

## Güvenlik

- API key'ler server-side'da tutulur
- Rate limiting uygulanmalı (production)
- CORS politikaları ayarlanmalı
- API key rotation önerilir

## Geliştirme Roadmap

- [ ] Gerçek piyasa verisi entegrasyonu
- [ ] WebSocket real-time updates
- [ ] Kullanıcı özel filtreler
- [ ] Sinyal geçmişi ve analytics
- [ ] Telegram/Discord bot entegrasyonu
- [ ] Confidence threshold ayarları
- [ ] Multi-timeframe analiz (1h, 4h, 1d)
- [ ] Backtesting ve accuracy tracking

## Troubleshooting

### Sinyaller Görünmüyor
1. GEMINI_API_KEY doğru mu kontrol edin
2. API rate limit'e takılmış olabilirsiniz
3. Console'da hata mesajlarını kontrol edin

### Yavaş Güncelleme
1. Gemini API yanıt süresini kontrol edin
2. Network latency'yi ölçün
3. Güncelleme interval'ini artırın

### Yanlış Sinyaller
1. Prompt'u daha spesifik hale getirin
2. Confidence threshold'u yükseltin
3. Piyasa verisi kaynaklarını doğrulayın
