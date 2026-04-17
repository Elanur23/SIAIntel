# SEO & Meta Architect System

DIP Analysis raporlarını Google'ın en tepesine taşımak için teknik SEO optimizasyonu yapar.

## Özellikler

- **Gemini 1.5 Flash**: Hızlı SEO metadata üretimi
- **Financial Keywords**: Institutional, Volatility, Liquidity gibi finansal terimler
- **JSON-LD Schema**: FinancialNewsArticle schema yapısı
- **Image Alt Texts**: SEO uyumlu görsel açıklamaları
- **Google Discover Headlines**: Çarpıcı H2 başlıkları
- **SEO Score**: Otomatik SEO skoru hesaplama

## Kullanım

### API Endpoint

```bash
POST /api/seo-architect
```

Request Body:
```json
{
  "report": {
    "id": "DIP-1234567890",
    "authorityTitle": "Fed Signals Rate Cut...",
    "executiveSummary": "...",
    "confidenceBand": 87,
    ...
  },
  "baseUrl": "https://sia-terminal.com"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "metaTitle": "Fed Rate Cut Signals: Tech Sector Rally Ahead | SIA Terminal",
    "metaDescription": "Institutional analysis reveals 65% bullish probability as Fed signals rate cuts. Liquidity-driven momentum expected across tech and crypto markets.",
    "keywords": [
      "fed rate cuts",
      "institutional analysis",
      "market liquidity",
      "tech sector rally",
      ...
    ],
    "jsonLdSchema": { ... },
    "imageAltTexts": {
      "hero": "Federal Reserve rate cut analysis chart showing institutional positioning",
      "chart": "Market impact probability distribution: 65% bullish scenario",
      "thumbnail": "Fed policy shift drives cross-market liquidity cascade"
    },
    "discoverHeadlines": [
      "Fed Rate Cuts Drive 65% Bullish Probability in Tech Sector",
      "$52K Bitcoin Surge: Liquidity Cascade Across Markets"
    ],
    "canonicalUrl": "https://sia-terminal.com/intelligence/fed-signals-rate-cut..."
  }
}
```

### Frontend Component

```tsx
import SEOMetadataPreview from '@/components/SEOMetadataPreview'
import { calculateSEOScore } from '@/lib/ai/seo-meta-architect'

const seoScore = calculateSEOScore(metadata)

<SEOMetadataPreview metadata={metadata} seoScore={seoScore} />
```

### Programmatic Usage

```typescript
import { generateSEOMetadata } from '@/lib/ai/seo-meta-architect'

const metadata = await generateSEOMetadata(dipReport, 'https://sia-terminal.com')
```

## SEO Metadata Structure

### Meta Title
- 55-60 karakter arası
- Finansal anahtar kelimeler içerir
- Brand name ile biter
- Örnek: "Fed Rate Cut Signals: Tech Sector Rally Ahead | SIA Terminal"

### Meta Description
- 150-160 karakter arası
- Finansal terimler: Institutional, Volatility, Liquidity, Alpha, Beta, Gamma
- Sayısal veri içerir (%, $, rakamlar)
- Call-to-action ima eder
- Örnek: "Institutional analysis reveals 65% bullish probability as Fed signals rate cuts. Liquidity-driven momentum expected across tech and crypto markets."

### Keywords
10-15 adet anahtar kelime:
- **Primary**: Ana konular (fed rate cuts, market analysis)
- **Secondary**: İlgili konular (tech sector, crypto markets)
- **Long-tail**: Uzun kuyruk (institutional liquidity analysis, cross-market correlation)

### JSON-LD Schema
FinancialNewsArticle schema yapısı:
```json
{
  "@context": "https://schema.org",
  "@type": "FinancialNewsArticle",
  "headline": "...",
  "description": "...",
  "datePublished": "2026-02-28T10:30:00Z",
  "author": {
    "@type": "Organization",
    "name": "Sovereign Intelligence Architecture"
  },
  "publisher": {
    "@type": "Organization",
    "name": "SIA Terminal",
    "logo": {
      "@type": "ImageObject",
      "url": "https://sia-terminal.com/logo.png"
    }
  },
  "keywords": [...]
}
```

### Image Alt Texts
SEO uyumlu, finansal terimler içeren açıklamalar:
- **Hero**: Ana görsel için detaylı açıklama
- **Chart**: Grafik/veri görseli için açıklama
- **Thumbnail**: Küçük görsel için kısa açıklama

### Google Discover Headlines
2 adet çarpıcı H2 başlığı:
- 60-70 karakter arası
- Sayısal veri içerir (%, $, rakamlar)
- Aciliyet hissi verir
- Finansal otorite dili
- Örnek: "Fed Rate Cuts Drive 65% Bullish Probability in Tech Sector"

## Financial Keywords

### Tier 1 (High Authority)
- Institutional
- Volatility
- Liquidity
- Alpha
- Beta
- Gamma
- Hedge
- Arbitrage
- Correlation
- Momentum

### Tier 2 (Technical)
- Dark pool
- Whale positioning
- Gamma squeeze
- Options flow
- Cross-asset
- Risk-on/risk-off
- Volatility regime
- Liquidity cascade

### Tier 3 (Long-tail)
- Institutional liquidity analysis
- Cross-market correlation breakdown
- Volatility regime shift detection
- Large holder positioning analysis
- Gamma squeeze risk assessment

## SEO Score Calculation

### Scoring Criteria
- **Meta Title Length** (50-60 chars): -10 points if outside range
- **Meta Description Length** (150-160 chars): -10 points if outside range
- **Keywords Count** (5+ keywords): -15 points if less than 5
- **Image Alt Texts** (all images): -10 points if missing
- **Discover Headlines** (2+ headlines): -10 points if less than 2
- **JSON-LD Keywords**: -15 points if empty

### Score Ranges
- **90-100**: Excellent - SEO optimizasyonu mükemmel
- **70-89**: Good - İyi bir SEO skoru, küçük iyileştirmeler yapılabilir
- **0-69**: Needs Improvement - Ciddi iyileştirme gerektiriyor

## Integration Examples

### Next.js Page Metadata

```tsx
// app/intelligence/[slug]/page.tsx
import { generateSEOMetadata } from '@/lib/ai/seo-meta-architect'

export async function generateMetadata({ params }) {
  const report = await getDIPReport(params.slug)
  const seoMetadata = await generateSEOMetadata(report)
  
  return {
    title: seoMetadata.metaTitle,
    description: seoMetadata.metaDescription,
    keywords: seoMetadata.keywords,
    openGraph: {
      title: seoMetadata.ogTitle,
      description: seoMetadata.ogDescription,
      type: seoMetadata.ogType,
    },
    twitter: {
      card: seoMetadata.twitterCard,
      title: seoMetadata.twitterTitle,
      description: seoMetadata.twitterDescription,
    },
    alternates: {
      canonical: seoMetadata.canonicalUrl,
    },
  }
}
```

### JSON-LD Script Tag

```tsx
export default function IntelligencePage({ metadata }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(metadata.jsonLdSchema)
        }}
      />
      <article>
        {/* Content */}
      </article>
    </>
  )
}
```

### Image Components

```tsx
import Image from 'next/image'

<Image
  src="/hero.jpg"
  alt={metadata.imageAltTexts.hero}
  width={1200}
  height={630}
  priority
/>
```

## Advanced Features

### Keyword Analysis

```typescript
import { analyzeKeywords } from '@/lib/ai/seo-meta-architect'

const analysis = await analyzeKeywords(content)
// Returns: { primary, secondary, longTail, searchVolume }
```

### Competitor Analysis

```typescript
import { analyzeCompetitors } from '@/lib/ai/seo-meta-architect'

const analysis = await analyzeCompetitors(
  'Fed rate cuts analysis',
  ['bloomberg.com', 'reuters.com', 'wsj.com']
)
// Returns: { gaps, opportunities, recommendations }
```

### Quick Meta Description

```typescript
import { generateQuickMetaDescription } from '@/lib/ai/seo-meta-architect'

const description = await generateQuickMetaDescription(content)
```

## Best Practices

### 1. Meta Title
- Brand name her zaman sonda
- Sayısal veri kullan (%, $, rakamlar)
- Finansal anahtar kelime başta
- Örnek: "Fed Rate Cuts Drive 65% Rally | SIA Terminal"

### 2. Meta Description
- İlk 120 karakter en önemli (mobile preview)
- Finansal terimler doğal akışta
- Sayısal veri ve istatistikler
- Pasif değil aktif cümleler

### 3. Keywords
- Primary keywords meta title'da
- Secondary keywords meta description'da
- Long-tail keywords content'te
- Keyword stuffing yapma

### 4. Image Alt Texts
- Finansal terimler içer
- Görsel içeriği açıklar
- 125 karakterden kısa
- Keyword stuffing yapma

### 5. Google Discover
- Sayısal veri mutlaka
- Aciliyet hissi ver
- Merak uyandır
- Clickbait değil, value

## Performance

- **Model**: Gemini 1.5 Flash
- **Response Time**: 2-3 saniye
- **Cost**: ~$0.001 per metadata generation
- **Cache**: Aynı rapor için cache kullan

## Troubleshooting

### Düşük SEO Score
- Meta title/description uzunluklarını kontrol et
- Yeterli keyword var mı?
- Tüm image alt texts dolu mu?
- JSON-LD schema complete mi?

### Keywords Generic
- Daha spesifik finansal terimler kullan
- Long-tail keywords ekle
- Competitor analysis yap

### Discover Headlines Weak
- Sayısal veri ekle
- Daha spesifik ol
- Aciliyet hissi ver
- Finansal otorite dili kullan

## Roadmap

- [ ] A/B testing for headlines
- [ ] Keyword ranking tracker
- [ ] Competitor monitoring
- [ ] Auto-optimization based on performance
- [ ] Multi-language SEO
- [ ] Voice search optimization
- [ ] Featured snippet optimization
- [ ] Local SEO for regional content
