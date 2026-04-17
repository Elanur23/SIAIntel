# SIA Audio Integration - Best Practices

## ✅ Do's (Yapılması Gerekenler)

### 1. Transcript ID Kullanımı

**✅ DOĞRU**:
```tsx
const transcriptId = `sia-audio-transcript-${article.id}`

<section id={transcriptId} className="article-summary">
  {/* Speakable content */}
</section>

<SiaAudioPlayerSimple 
  transcriptId={transcriptId}
  src={audioUrl}
/>
```

**❌ YANLIŞ**:
```tsx
// Hard-coded ID - her makale için aynı
<section id="sia-audio-transcript-content">
```

### 2. Audio URL Yapısı

**✅ DOĞRU**:
```tsx
// CDN URL with article slug
const audioUrl = `https://cdn.sia-global.com/audio/${params.slug}.mp3`

// Or with article ID
const audioUrl = `https://cdn.sia-global.com/audio/${article.id}.mp3`
```

**❌ YANLIŞ**:
```tsx
// Relative path without CDN
const audioUrl = `/audio/${params.slug}.mp3`
```

### 3. Schema Placement

**✅ DOĞRU**:
```tsx
return (
  <>
    {/* Schema at top, outside article */}
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    
    <article>
      {/* Content */}
    </article>
  </>
)
```

**❌ YANLIŞ**:
```tsx
return (
  <article>
    {/* Schema inside article */}
    <script type="application/ld+json">...</script>
  </article>
)
```

### 4. Audio Player Position

**✅ DOĞRU**:
```tsx
<section className="sia-insight">
  {/* SIA_INSIGHT content */}
</section>

{/* Audio player after insight, before ad */}
<SiaAudioPlayerSimple {...props} />

{/* Ad unit */}
<SiaAdUnit slotType="INSIGHT" />
```

**❌ YANLIŞ**:
```tsx
{/* Audio at top - misses engagement opportunity */}
<SiaAudioPlayerSimple {...props} />

<section className="sia-insight">...</section>
<SiaAdUnit slotType="INSIGHT" />
```

### 5. Speakable CSS Selectors

**✅ DOĞRU**:
```tsx
speakable: {
  '@type': 'SpeakableSpecification',
  cssSelector: [
    `#${transcriptId}`,        // Unique ID
    '.article-summary',         // Class selector
    '.sia-insight'              // Class selector
  ]
}
```

**❌ YANLIŞ**:
```tsx
speakable: {
  '@type': 'SpeakableSpecification',
  cssSelector: [
    '#sia-audio-transcript-content',  // Same for all articles
    'div',                             // Too generic
    'p'                                // Too generic
  ]
}
```

---

## ❌ Don'ts (Yapılmaması Gerekenler)

### 1. Auto-Play (Policy Violation)

**❌ YANLIŞ**:
```tsx
<audio autoPlay>
  <source src={audioUrl} />
</audio>
```

**✅ DOĞRU**:
```tsx
// User-initiated playback only
<SiaAudioPlayerSimple 
  src={audioUrl}
  transcriptId={transcriptId}
/>
```

### 2. Missing Transcript ID

**❌ YANLIŞ**:
```tsx
<SiaAudioPlayerSimple 
  src={audioUrl}
  // Missing transcriptId!
/>
```

**✅ DOĞRU**:
```tsx
<SiaAudioPlayerSimple 
  src={audioUrl}
  transcriptId={`sia-audio-transcript-${article.id}`}
/>
```

### 3. Inline Schema

**❌ YANLIŞ**:
```tsx
<script type="application/ld+json">
  {JSON.stringify(jsonLd)}  {/* Won't work */}
</script>
```

**✅ DOĞRU**:
```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

### 4. Missing Audio Object in Schema

**❌ YANLIŞ**:
```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  speakable: { /* ... */ }
  // Missing audio object!
}
```

**✅ DOĞRU**:
```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  speakable: { /* ... */ },
  audio: {
    '@type': 'AudioObject',
    name: `${article.headline} - SIA AI Voice`,
    contentUrl: audioUrl,
    encodingFormat: 'audio/mpeg'
  }
}
```

### 5. Ad Too Close to Audio

**❌ YANLIŞ**:
```tsx
<SiaAudioPlayerSimple {...props} />
{/* No spacing! */}
<SiaAdUnit slotType="INSIGHT" />
```

**✅ DOĞRU**:
```tsx
<SiaAudioPlayerSimple {...props} />
{/* Natural spacing with my-8 */}
<SiaAdUnit slotType="INSIGHT" />
```

---

## 🎯 Optimal Layout Pattern

### Complete Structure

```tsx
export default async function ArticlePage({ params }) {
  const article = await getArticleBySlug(params.slug)
  const transcriptId = `sia-audio-transcript-${article.id}`
  const audioUrl = `https://cdn.sia-global.com/audio/${params.slug}.mp3`
  
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.headline,
    description: article.summary,
    datePublished: article.publishedAt,
    author: {
      '@type': 'Organization',
      name: 'SIA Autonomous Analyst'
    },
    publisher: {
      '@type': 'Organization',
      name: 'SIA Global Network',
      logo: {
        '@type': 'ImageObject',
        url: 'https://siaintel.com/logo.png'
      }
    },
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: [
        `#${transcriptId}`,
        '.article-summary',
        '.sia-insight'
      ]
    },
    audio: {
      '@type': 'AudioObject',
      name: `${article.headline} - SIA AI Voice`,
      contentUrl: audioUrl,
      encodingFormat: 'audio/mpeg'
    }
  }
  
  return (
    <>
      {/* 1. JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* 2. Article Container */}
      <article className="max-w-4xl mx-auto px-4 py-8">
        {/* 3. Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-white">
            {article.headline}
          </h1>
        </header>
        
        {/* 4. Summary (Speakable) */}
        <section 
          id={transcriptId}
          className="article-summary mb-8 p-6 bg-blue-900/20 rounded-lg border-l-4 border-blue-500"
        >
          <h2 className="text-xl font-semibold mb-3 text-blue-300">
            Summary
          </h2>
          <p className="text-lg text-gray-200">
            {article.summary}
          </p>
        </section>
        
        {/* 5. SIA Insight (Speakable) */}
        <section className="sia-insight mb-8 p-6 bg-gradient-to-r from-gold-900/20 to-amber-900/20 rounded-lg border-l-4 border-gold-500">
          <h2 className="text-xl font-semibold mb-3 text-gold-300">
            🔍 SIA Insight
          </h2>
          <div className="text-gray-200 whitespace-pre-line">
            {article.siaInsight}
          </div>
        </section>
        
        {/* 6. Audio Player - STRATEGIC POSITION */}
        <SiaAudioPlayerSimple 
          src={audioUrl}
          transcriptId={transcriptId}
          title={article.headline}
          language={params.lang}
        />
        
        {/* 7. Ad Unit #1 - POST_SIA_INSIGHT */}
        <SiaAdUnit 
          slotType="INSIGHT" 
          language={params.lang}
          region={article.region}
        />
        
        {/* 8. Additional Content */}
        {/* Technical Glossary, Risk Disclaimer, etc. */}
        
        {/* 9. Ad Unit #2 - POST_RISK_DISCLAIMER */}
        <SiaAdUnit 
          slotType="SHIELD" 
          language={params.lang}
          region={article.region}
        />
        
        {/* 10. Footer */}
        <footer className="mt-12 pt-8 border-t border-gray-700">
          {/* Author, Date, E-E-A-T Badge */}
        </footer>
      </article>
    </>
  )
}
```

---

## 📊 Performance Optimization

### 1. Lazy Loading

**✅ DOĞRU**:
```tsx
// Audio player loads on scroll
import dynamic from 'next/dynamic'

const SiaAudioPlayerSimple = dynamic(
  () => import('@/components/SiaAudioPlayerSimple'),
  { ssr: false }
)
```

### 2. CDN Usage

**✅ DOĞRU**:
```tsx
// Use CDN for audio files
const audioUrl = `https://cdn.sia-global.com/audio/${params.slug}.mp3`
```

**❌ YANLIŞ**:
```tsx
// Serve from origin server
const audioUrl = `/api/audio/${params.slug}`
```

### 3. Preload Critical Resources

**✅ DOĞRU**:
```tsx
export async function generateMetadata({ params }) {
  return {
    // ... other metadata
    other: {
      'preload': `https://cdn.sia-global.com/audio/${params.slug}.mp3`
    }
  }
}
```

---

## 🔍 SEO Optimization

### 1. Complete Schema

**✅ DOĞRU**:
```tsx
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: article.headline,
  description: article.summary,
  datePublished: article.publishedAt,
  dateModified: article.publishedAt,
  author: { /* ... */ },
  publisher: { /* ... */ },
  speakable: { /* ... */ },
  audio: { /* ... */ },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `https://siaintel.com/${params.lang}/news/${params.slug}`
  }
}
```

### 2. Proper Heading Hierarchy

**✅ DOĞRU**:
```tsx
<article>
  <h1>Main Headline</h1>
  <section>
    <h2>Summary</h2>
  </section>
  <section>
    <h2>SIA Insight</h2>
  </section>
</article>
```

**❌ YANLIŞ**:
```tsx
<article>
  <h1>Main Headline</h1>
  <section>
    <h3>Summary</h3>  {/* Skipped h2 */}
  </section>
</article>
```

---

## 📱 Mobile Best Practices

### 1. Responsive Layout

**✅ DOĞRU**:
```tsx
<article className="max-w-4xl mx-auto px-4 py-8">
  {/* Mobile: px-4, Desktop: max-w-4xl */}
</article>
```

### 2. Touch-Friendly Controls

**✅ DOĞRU**:
```tsx
// 48px minimum touch target
<button className="w-14 h-14 flex items-center justify-center">
  <Play size={28} />
</button>
```

### 3. Fast Loading

**✅ DOĞRU**:
```tsx
// Optimize images
<Image
  src={article.image}
  alt={article.headline}
  width={800}
  height={400}
  loading="lazy"
/>
```

---

## 🧪 Testing Checklist

### Pre-Deployment
- [ ] Audio URL accessible
- [ ] Transcript ID unique per article
- [ ] Schema validates (validator.schema.org)
- [ ] Mobile responsive
- [ ] Page load <3s
- [ ] Analytics tracking works
- [ ] Ad units display
- [ ] No console errors

### Post-Deployment
- [ ] Monitor audio play rate
- [ ] Track ad viewability
- [ ] Measure dwell time
- [ ] Analyze revenue impact
- [ ] Check error rates
- [ ] Review user feedback

---

## 🆘 Common Issues & Solutions

### Issue 1: Audio Not Playing

**Problem**: User clicks play, nothing happens

**Solution**:
```tsx
// Check audio URL is accessible
curl -I https://cdn.sia-global.com/audio/article.mp3

// Verify CORS headers
Access-Control-Allow-Origin: *
```

### Issue 2: Schema Not Validating

**Problem**: Google Rich Results Test fails

**Solution**:
```tsx
// Ensure transcript ID exists in DOM
const transcriptId = `sia-audio-transcript-${article.id}`

<section id={transcriptId}>
  {/* Content */}
</section>

// Verify in schema
speakable: {
  cssSelector: [`#${transcriptId}`]
}
```

### Issue 3: Low Ad Viewability

**Problem**: Ads not staying in viewport

**Solution**:
```tsx
// Ensure audio player is BEFORE ad unit
<SiaAudioPlayerSimple {...props} />
<SiaAdUnit slotType="INSIGHT" />

// Not the other way around
```

---

## 📚 Related Documentation

- [Integration Example](./SIA-AUDIO-INTEGRATION-EXAMPLE.md)
- [Audio Player Versions](./SIA-AUDIO-PLAYER-VERSIONS.md)
- [AdSense Sync](./SIA-ADSENSE-AUDIO-SYNC-COMPLETE.md)
- [Speakable Schema](./SIA-SPEAKABLE-SCHEMA-INTEGRATION.md)

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: March 1, 2026
