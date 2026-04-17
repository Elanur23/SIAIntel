# Google Search Console - Setup Guide

## 🚀 Hızlı Başlangıç

Google Search Console entegrasyonu **ÜCRETSİZ** ve çok güçlü!

## 📋 Kurulum Adımları

### 1. Google Cloud Project Oluştur

1. [Google Cloud Console](https://console.cloud.google.com/) git
2. Yeni proje oluştur: "News Portal SEO"
3. Proje seç

### 2. Search Console API'yi Aktifleştir

1. "APIs & Services" > "Library" git
2. "Google Search Console API" ara
3. "Enable" tıkla

### 3. Service Account Oluştur

1. "APIs & Services" > "Credentials" git
2. "Create Credentials" > "Service Account" seç
3. İsim ver: "search-console-api"
4. "Create and Continue" tıkla
5. Role seç: "Owner" veya "Editor"
6. "Done" tıkla

### 4. Service Account Key İndir

1. Oluşturduğun service account'a tıkla
2. "Keys" tab'ına git
3. "Add Key" > "Create new key"
4. "JSON" seç
5. Key indir (güvenli sakla!)

### 5. Search Console'a Erişim Ver

1. [Google Search Console](https://search.google.com/search-console) git
2. Property'ni seç
3. "Settings" > "Users and permissions" git
4. "Add user" tıkla
5. Service account email'ini ekle (örnek: `search-console-api@project-id.iam.gserviceaccount.com`)
6. Permission: "Owner" seç
7. "Add" tıkla

### 6. Environment Variables Ekle

`.env.local` dosyana ekle:

```env
# Google Search Console
GOOGLE_CLIENT_EMAIL=your-service-account@project-id.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
SITE_URL=https://your-domain.com
```

**Not**: `GOOGLE_PRIVATE_KEY` JSON dosyasındaki `private_key` alanından al.

### 7. Package Yükle

```bash
npm install googleapis
```

## 🎯 Kullanım Örnekleri

### Basit Kullanım

```typescript
import { googleSearchConsole } from '@/lib/google-search-console'

// Performance metrics al
const metrics = await googleSearchConsole.getPerformanceMetrics(30)
console.log(`Total Clicks: ${metrics.totalClicks}`)
console.log(`Average CTR: ${metrics.averageCTR}%`)
console.log(`Average Position: ${metrics.averagePosition}`)

// Top queries
metrics.topQueries.forEach(query => {
  console.log(`${query.query}: ${query.clicks} clicks`)
})
```

### Sitemap Submit

```typescript
// Sitemap submit et
await googleSearchConsole.submitSitemap('https://your-domain.com/sitemap.xml')

// Sitemaps listele
const sitemaps = await googleSearchConsole.getSitemaps()
sitemaps.forEach(sitemap => {
  console.log(`${sitemap.path}: ${sitemap.contents[0].indexed} indexed`)
})
```

### URL Inspection

```typescript
// URL durumunu kontrol et
const status = await googleSearchConsole.inspectUrl('https://your-domain.com/article')
console.log(`Coverage: ${status.coverageState}`)
console.log(`Last Crawl: ${status.lastCrawlTime}`)
```

### Trending Queries

```typescript
// Trend olan query'leri bul
const trending = await googleSearchConsole.getTrendingQueries(7)
trending.forEach(query => {
  console.log(`${query.query}: ${query.trend} (${query.change}%)`)
})
```

### Comprehensive Report

```typescript
// Kapsamlı rapor al
const report = await googleSearchConsole.getComprehensiveReport(30)
console.log(`Health Score: ${report.summary.healthScore}/100`)
console.log(`Indexed Pages: ${report.summary.indexedPages}`)
console.log(`Opportunities: ${report.opportunities.length}`)
```

## 📊 Özellikler

### ✅ Mevcut Özellikler

1. **Performance Metrics**
   - Total clicks, impressions
   - Average CTR, position
   - Top queries & pages
   - Device & country breakdown

2. **Sitemap Management**
   - List sitemaps
   - Submit sitemap
   - Delete sitemap
   - Check sitemap status

3. **URL Inspection**
   - Index status
   - Coverage state
   - Last crawl time
   - Canonical URLs

4. **Trending Analysis**
   - Trending queries
   - Declining pages
   - Opportunities

5. **Comprehensive Reports**
   - Full performance report
   - Health score
   - Actionable insights

## 🎯 Otomatik Workflow Entegrasyonu

### Günlük Rapor

```typescript
import { aiWorkflowAutomation } from '@/lib/ai-workflow-automation'

await aiWorkflowAutomation.createWorkflow({
  name: 'Daily GSC Report',
  trigger: {
    type: 'schedule',
    config: { schedule: '0 9 * * *' } // Her gün 09:00
  },
  actions: [
    {
      id: 'get_metrics',
      type: 'gsc_metrics',
      name: 'Get GSC Metrics',
      config: { days: 7 }
    },
    {
      id: 'send_report',
      type: 'send_email',
      name: 'Send Report',
      config: { to: 'admin@example.com' }
    }
  ]
})
```

### Otomatik Sitemap Submit

```typescript
await aiWorkflowAutomation.createWorkflow({
  name: 'Auto Sitemap Submit',
  trigger: {
    type: 'event',
    config: { event: 'sitemap.updated' }
  },
  actions: [
    {
      id: 'submit_sitemap',
      type: 'gsc_submit_sitemap',
      name: 'Submit to GSC',
      config: { sitemapUrl: '/sitemap.xml' }
    }
  ]
})
```

## 💡 Best Practices

### 1. Günlük Monitoring
```typescript
// Her gün metrics kontrol et
const metrics = await googleSearchConsole.getPerformanceMetrics(1)
if (metrics.totalClicks < previousDay * 0.8) {
  // Alert gönder
}
```

### 2. Haftalık Trend Analizi
```typescript
// Her hafta trending queries kontrol et
const trending = await googleSearchConsole.getTrendingQueries(7)
// Yeni content fikirleri için kullan
```

### 3. Aylık Comprehensive Report
```typescript
// Her ay detaylı rapor al
const report = await googleSearchConsole.getComprehensiveReport(30)
// SEO stratejisini güncelle
```

## 🔧 Troubleshooting

### Error: "User does not have sufficient permissions"
**Çözüm**: Service account'a Search Console'da "Owner" permission ver.

### Error: "Invalid credentials"
**Çözüm**: `.env.local` dosyasındaki credentials'ı kontrol et.

### Error: "API not enabled"
**Çözüm**: Google Cloud Console'da Search Console API'yi enable et.

## 📊 Maliyet

**ÜCRETSİZ!** 🎉

- Google Search Console: $0
- API kullanımı: $0
- Quota: 1,200 requests/minute

## 🎯 Sonuç

Google Search Console entegrasyonu ile:

✅ Real-time performance tracking
✅ Automated sitemap submission
✅ URL inspection & monitoring
✅ Trending query analysis
✅ Opportunity identification
✅ Comprehensive reporting

**Maliyet: $0/ay** 🚀
