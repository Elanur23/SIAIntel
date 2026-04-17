# API Quota Manager - Tam Rehber

## Genel Bakış

API Quota Manager, OpenAI ve DALL-E API kullanımını takip eder, limitler aşılmadan önce uyarır ve fallback mekanizmaları sağlar. Sistem tamamen ücretsiz ve otomatiktir.

## Özellikler

✅ **Günlük Quota Takibi**
- GPT-4 çağrılarını takip et
- DALL-E görsel üretimini takip et
- Token kullanımını hesapla

✅ **Saatlik Limitler**
- Saatlik GPT limiti: 10 çağrı
- Saatlik DALL-E limiti: 5 görsel
- Aşırı kullanımı önle

✅ **Fallback Sistem**
- OpenAI limit aşıldı → Claude kullan
- Claude limit aşıldı → Groq kullan
- Groq limit aşıldı → Cached content kullan

✅ **Maliyet Hesaplama**
- Gerçek zamanlı maliyet takibi
- Günlük/aylık projeksiyon
- Bütçe planlama

✅ **Admin Dashboard**
- Quota durumu görüntüle
- Kullanım grafiği
- Uyarı sistemi
- Fallback durumu

## Kurulum

### 1. Core Library
```typescript
import {
  canGenerateGpt,
  canGenerateDalle,
  getQuotaStatus,
  trackGptCall,
  trackDalleCall,
} from '@/lib/api-quota-manager'
```

### 2. API Endpoints

**GET /api/quota/check**
```bash
curl http://localhost:3000/api/quota/check
```

Yanıt:
```json
{
  "success": true,
  "data": {
    "status": {
      "dailyGptRemaining": 97,
      "dailyDalleRemaining": 50,
      "hourlyGptRemaining": 9,
      "hourlyDalleRemaining": 5,
      "dailyPercentage": 3,
      "hourlyPercentage": 10,
      "canGenerateGpt": true,
      "canGenerateDalle": true,
      "nextResetTime": 1707123600000,
      "estimatedDailyCost": 0.15,
      "fallbackRequired": false,
      "recommendedModel": "gpt-4"
    },
    "canGenerateGpt": true,
    "canGenerateDalle": true,
    "alert": null
  }
}
```

**GET /api/quota/usage**
```bash
# Tüm veriler
curl http://localhost:3000/api/quota/usage

# Günlük veriler
curl http://localhost:3000/api/quota/usage?type=daily

# Saatlik veriler
curl http://localhost:3000/api/quota/usage?type=hourly

# 7 günlük geçmiş
curl http://localhost:3000/api/quota/usage?type=history

# Tahmini maliyet
curl http://localhost:3000/api/quota/usage?type=projected
```

**POST /api/quota/usage**
```bash
# GPT çağrısını takip et
curl -X POST http://localhost:3000/api/quota/usage \
  -H "Content-Type: application/json" \
  -d '{"type": "gpt", "tokens": 500}'

# DALL-E çağrısını takip et
curl -X POST http://localhost:3000/api/quota/usage \
  -H "Content-Type: application/json" \
  -d '{"type": "dalle"}'
```

## Kullanım Örnekleri

### 1. Makale Oluşturmadan Önce Kontrol Et

```typescript
import { canGenerateGpt, getRecommendedFallback } from '@/lib/api-quota-manager'

async function generateArticle(topic: string): Promise<string> {
  if (!canGenerateGpt()) {
    const fallback = getRecommendedFallback()
    console.log(`GPT quota exceeded. Using ${fallback}`)
    return generateWithFallback(topic, fallback)
  }

  const article = await openai.createCompletion({
    model: 'gpt-4',
    prompt: `Write article about ${topic}`,
  })

  trackGptCall(article.usage.prompt_tokens)
  return article.choices[0].text
}
```

### 2. Görsel Oluşturmadan Önce Kontrol Et

```typescript
import { canGenerateDalle, trackDalleCall } from '@/lib/api-quota-manager'

async function generateImage(prompt: string): Promise<string> {
  if (!canGenerateDalle()) {
    console.log('DALL-E quota exceeded. Using cached image')
    return getCachedImage(prompt)
  }

  const image = await openai.createImage({
    prompt,
    n: 1,
    size: '1024x1024',
  })

  trackDalleCall()
  return image.data[0].url
}
```

### 3. Quota Durumunu Kontrol Et

```typescript
import { getQuotaStatus, getAlertMessage } from '@/lib/api-quota-manager'

function checkQuota(): void {
  const status = getQuotaStatus()

  console.log(`Daily GPT: ${status.dailyGptRemaining}/100`)
  console.log(`Daily DALL-E: ${status.dailyDalleRemaining}/50`)
  console.log(`Estimated cost: $${status.estimatedDailyCost.toFixed(2)}`)

  const alert = getAlertMessage()
  if (alert) {
    console.warn(`⚠️ ${alert}`)
  }
}
```

### 4. Maliyet Tahmini

```typescript
import { getProjectedDailyCost, getDailyUsage } from '@/lib/api-quota-manager'

function estimateCosts(): void {
  const daily = getDailyUsage()
  const projected = getProjectedDailyCost()

  console.log(`Today's cost: $${daily.estimatedCost.toFixed(2)}`)
  console.log(`Projected daily: $${projected.toFixed(2)}`)
  console.log(`Projected monthly: $${(projected * 30).toFixed(2)}`)
}
```

## Limitler

### Varsayılan Limitler

| Limit | Değer |
|-------|-------|
| Günlük GPT | 100 çağrı |
| Günlük DALL-E | 50 görsel |
| Saatlik GPT | 10 çağrı |
| Saatlik DALL-E | 5 görsel |

### Limitler Nasıl Değiştirilir

```typescript
import { updateQuotaLimits } from '@/lib/api-quota-manager'

// Limitleri artır
updateQuotaLimits({
  dailyGptLimit: 200,
  dailyDalleLimit: 100,
  hourlyGptLimit: 20,
  hourlyDalleLimit: 10,
})
```

## Maliyet Hesaplama

### OpenAI Fiyatlandırması

**GPT-4:**
- Input: $0.003 / 1K token
- Output: $0.006 / 1K token

**DALL-E 3:**
- 1024x1024: $0.02 / görsel
- 1024x1792: $0.03 / görsel
- 1792x1024: $0.03 / görsel

### Örnek Hesaplamalar

**Senaryo 1: 10 makale/gün**
- 10 makale × 500 token = 5,000 token
- 5,000 × $0.003 = $15/gün
- 10 görsel × $0.02 = $0.20/gün
- **Toplam: $15.20/gün = $456/ay**

**Senaryo 2: 30 makale/gün**
- 30 makale × 500 token = 15,000 token
- 15,000 × $0.003 = $45/gün
- 30 görsel × $0.02 = $0.60/gün
- **Toplam: $45.60/gün = $1,368/ay**

## Fallback Mekanizması

### Fallback Modeller

1. **Claude 3 Haiku** - Hızlı, ucuz, iyi kalite
2. **Groq Mixtral** - Çok hızlı, ücretsiz
3. **Cached Content** - Önceki içeriği yeniden kullan

### Fallback Nasıl Çalışır

```
GPT-4 limit aşıldı?
  ↓
Claude 3 Haiku kullan
  ↓
Claude limit aşıldı?
  ↓
Groq Mixtral kullan
  ↓
Groq limit aşıldı?
  ↓
Cached content kullan
```

## Admin Dashboard

### Erişim
```
http://localhost:3000/admin/api-quotas
```

### Sekmeler

1. **Genel Bakış**
   - Günlük/saatlik quota durumu
   - Maliyet tahmini
   - Fallback durumu

2. **Kullanım Grafiği**
   - 7 günlük GPT çağrıları
   - 7 günlük DALL-E çağrıları

3. **Maliyet Trendi**
   - Günlük maliyet grafiği
   - Aylık projeksiyon

## Uyarı Sistemi

### Uyarı Seviyeleri

| Seviye | Durum | Aksiyon |
|--------|-------|---------|
| 🟢 Yeşil | < 70% | Normal |
| 🟡 Sarı | 70-90% | Uyarı göster |
| 🔴 Kırmızı | > 90% | Fallback kullan |

### Uyarı Mesajları

```
"Warning: 90% of daily GPT quota used (10 remaining)"
"GPT quota exceeded. Using fallback model."
"Daily quota exceeded. Using fallback models."
```

## Best Practices

### 1. Batch Processing
```typescript
// Kötü: Her makale için ayrı çağrı
for (const topic of topics) {
  await generateArticle(topic)
}

// İyi: Batch işleme
const articles = await generateArticlesBatch(topics)
```

### 2. Caching
```typescript
// Aynı prompt için cache kullan
const cache = new Map()

async function generateWithCache(prompt: string): Promise<string> {
  if (cache.has(prompt)) {
    return cache.get(prompt)
  }

  const result = await generateArticle(prompt)
  cache.set(prompt, result)
  return result
}
```

### 3. Scheduling
```typescript
// Yoğun işlemleri off-peak saatlere planla
const scheduler = new ArticleScheduler()
scheduler.scheduleAt('02:00', () => generateArticles(50))
```

### 4. Monitoring
```typescript
// Düzenli olarak quota kontrol et
setInterval(() => {
  const status = getQuotaStatus()
  if (status.dailyPercentage > 80) {
    sendAlert('Quota approaching limit')
  }
}, 3600000) // Her saat
```

## Sorun Giderme

### Soru: Limit aşıldı, ne yapmalı?

**Cevap:** Fallback sistem otomatik olarak devreye girer. Alternatif modeller kullanılır.

### Soru: Maliyet çok yüksek, nasıl azaltabilirim?

**Cevap:**
1. Günlük makale sayısını azalt
2. Token kullanımını optimize et
3. Görsel üretimini azalt
4. Cached content kullan

### Soru: Quota nasıl sıfırlanır?

**Cevap:** Günlük limitler her gün 00:00'da, saatlik limitler her saat başında otomatik sıfırlanır.

## API Referansı

### Fonksiyonlar

```typescript
// Quota Kontrol
canGenerateGpt(): boolean
canGenerateDalle(): boolean

// Takip
trackGptCall(tokens?: number): void
trackDalleCall(): void

// Durum
getQuotaStatus(): QuotaStatus
getDailyUsage(): QuotaUsage
getHourlyUsage(): HourlyUsage
getUsageHistory(): QuotaUsage[]

// Maliyet
getProjectedDailyCost(): number
calculateCost(tokens: number, images: number): number

// Fallback
getRecommendedFallback(): string
isApproachingLimit(): boolean

// Uyarı
getAlertMessage(): string | null

// Admin
updateQuotaLimits(config: Partial<QuotaConfig>): void
resetDailyQuota(): void
```

## Entegrasyon

### AI Editor ile Entegrasyon

```typescript
import { canGenerateGpt } from '@/lib/api-quota-manager'

export async function generateContent(prompt: string): Promise<string> {
  if (!canGenerateGpt()) {
    throw new Error('GPT quota exceeded')
  }

  return await aiEditor.generate(prompt)
}
```

### Auto Publisher ile Entegrasyon

```typescript
import { canGenerateGpt, canGenerateDalle } from '@/lib/api-quota-manager'

export async function publishArticle(topic: string): Promise<void> {
  if (!canGenerateGpt() || !canGenerateDalle()) {
    console.log('Quota exceeded, skipping publication')
    return
  }

  await autoPublisher.publish(topic)
}
```

## Sonuç

API Quota Manager, OpenAI API kullanımını kontrol altında tutarak:
- ✅ Beklenmedik maliyetleri önler
- ✅ Limitler aşılmadan uyarır
- ✅ Fallback mekanizmaları sağlar
- ✅ Maliyet tahmini yapar
- ✅ Tamamen ücretsiz

Sistem otomatik olarak çalışır ve manuel müdahale gerektirmez.
