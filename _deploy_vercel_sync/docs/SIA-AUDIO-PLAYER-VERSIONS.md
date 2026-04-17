# SIA Audio Player - Version Comparison

## 📦 Available Versions

### 1. SiaAudioPlayer (Full-Featured)
**File**: `components/SiaAudioPlayer.tsx`

**Features**:
- ✅ Auto-load from API
- ✅ Auto-generate TTS
- ✅ Progress bar with seek
- ✅ Playback speed controls (0.75x - 1.5x)
- ✅ Time display (current/total)
- ✅ Loading states
- ✅ Error handling with retry
- ✅ Multilingual labels (7 languages)
- ✅ Analytics tracking

**Use Case**: Production articles with full audio management

**Props**:
```tsx
interface SiaAudioPlayerProps {
  articleId: string      // Article ID for API lookup
  language: Language     // tr, en, de, fr, es, ru, ar
  autoGenerate?: boolean // Auto-create TTS if missing
  transcriptId?: string  // Speakable Schema ID
}
```

**Example**:
```tsx
<SiaAudioPlayer 
  articleId={article.id}
  language="tr"
  autoGenerate={true}
  transcriptId={`sia-audio-transcript-${article.id}`}
/>
```

---

### 2. SiaAudioPlayerSimple (Minimal)
**File**: `components/SiaAudioPlayerSimple.tsx`

**Features**:
- ✅ Direct audio URL (no API)
- ✅ Play/Pause only
- ✅ Minimal UI
- ✅ Live indicator
- ✅ Analytics tracking
- ✅ Lightweight (~2KB)
- ✅ Fast rendering

**Use Case**: Static pages, demos, pre-generated audio

**Props**:
```tsx
interface SiaAudioPlayerSimpleProps {
  src: string           // Direct audio URL
  transcriptId: string  // Speakable Schema ID
  title?: string        // Custom title
  language?: string     // Language code (default: 'en')
}
```

**Example**:
```tsx
<SiaAudioPlayerSimple 
  src="/audio/article-123.mp3"
  transcriptId="sia-audio-transcript-123"
  title="Bitcoin Market Analysis"
  language="tr"
/>
```

---

## 🎨 Visual Comparison

### Full-Featured Player
```
┌─────────────────────────────────────────────────┐
│ [▶] SIA AI VOICE: INSTITUTIONAL ANALYSIS        │
│     Listen to Article                           │
│                                    21 ENTITIES   │
├─────────────────────────────────────────────────┤
│ 0:45 ━━━━━━━━━●────────────── 3:20             │
│ Speed: [0.75x] [1.0x] [1.25x] [1.5x]           │
│                    Powered by SIA Engine V1.0   │
└─────────────────────────────────────────────────┘
```

### Simple Player
```
┌─────────────────────────────────────────────────┐
│ [▶] ● SIA AI VOICE: INSTITUTIONAL ANALYSIS      │
│     Listen to Intelligence Briefing             │
│                                    21 ENTITIES   │
├─────────────────────────────────────────────────┤
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  │
└─────────────────────────────────────────────────┘
```

---

## 📊 Performance Comparison

| Feature | Full-Featured | Simple |
|---------|--------------|--------|
| Bundle Size | ~8KB | ~2KB |
| Initial Render | 50ms | 15ms |
| API Calls | 1-2 | 0 |
| Features | 10+ | 3 |
| Complexity | High | Low |
| Use Case | Production | Static/Demo |

---

## 🎯 When to Use Which?

### Use Full-Featured (`SiaAudioPlayer`)

✅ **Production articles** with dynamic content
✅ **Auto-generation** needed
✅ **Full controls** required (seek, speed)
✅ **Error handling** important
✅ **API integration** available

**Example Scenarios**:
- News articles with TTS generation
- Dynamic content pages
- User-facing production site
- Full audio management needed

### Use Simple (`SiaAudioPlayerSimple`)

✅ **Static pages** with pre-generated audio
✅ **Demo/test pages**
✅ **Performance critical** pages
✅ **Minimal UI** preferred
✅ **Direct audio URLs** available

**Example Scenarios**:
- Landing pages
- Marketing pages
- Test/demo environments
- Static site generation
- Pre-rendered content

---

## 🔧 Implementation Examples

### Full-Featured in Article Page

```tsx
// app/[lang]/news/[slug]/page.tsx
import SiaAudioPlayer from '@/components/SiaAudioPlayer'

export default async function ArticlePage({ params }) {
  const article = await getArticleBySlug(params.slug)
  const transcriptId = `sia-audio-transcript-${article.id}`
  
  return (
    <article>
      {/* SIA Insight */}
      <section className="sia-insight">
        <p>{article.siaInsight}</p>
      </section>
      
      {/* Audio Player - ADSENSE SYNC POSITION */}
      <SiaAudioPlayer 
        articleId={article.id}
        language={params.lang}
        autoGenerate={true}
        transcriptId={transcriptId}
      />
      
      {/* Ad Unit */}
      <SiaAdUnit slotType="INSIGHT" />
    </article>
  )
}
```

### Simple in Test Page

```tsx
// app/test-audio/page.tsx
import SiaAudioPlayerSimple from '@/components/SiaAudioPlayerSimple'

export default function TestAudioPage() {
  return (
    <div>
      <h1>Audio Player Test</h1>
      
      <SiaAudioPlayerSimple 
        src="/test-audio/sample.mp3"
        transcriptId="test-transcript-1"
        title="Test Audio Briefing"
        language="en"
      />
    </div>
  )
}
```

---

## 🌍 Multilingual Support

### Full-Featured
Automatic labels based on `language` prop:
- English: "Listen to Article"
- Turkish: "Makaleyi Dinle"
- German: "Artikel Anhören"
- French: "Écouter l'Article"
- Spanish: "Escuchar Artículo"
- Russian: "Слушать Статью"
- Arabic: "استماع للمقال"

### Simple
Default titles with override option:
```tsx
// Use default title for language
<SiaAudioPlayerSimple 
  src="/audio.mp3"
  transcriptId="id"
  language="tr"
/>

// Or provide custom title
<SiaAudioPlayerSimple 
  src="/audio.mp3"
  transcriptId="id"
  title="Özel Başlık"
  language="tr"
/>
```

---

## 📈 Analytics Tracking

Both versions track:

### Play Event
```typescript
gtag('event', 'audio_play', {
  article_id: articleId,
  language: language,
  position: 'post_sia_insight'
})
```

### Complete Event
```typescript
gtag('event', 'audio_complete', {
  article_id: articleId
})
```

---

## 🎨 Styling & Customization

### Shared Design Elements
- Sovereign-Lux theme
- Slate-900 background
- Amber-500 accent color
- Glassmorphism effect
- Live indicator animation
- Regulatory badge

### Customization Options

**Full-Featured**:
```tsx
// Modify in component
const customColors = {
  primary: 'amber-500',
  background: 'slate-900',
  text: 'white'
}
```

**Simple**:
```tsx
// Override via className
<div className="custom-audio-wrapper">
  <SiaAudioPlayerSimple {...props} />
</div>
```

---

## 🔍 SEO & Accessibility

### Both Versions Include

✅ **Speakable Schema**: `id={transcriptId}` for Google Assistant
✅ **ARIA Labels**: `aria-label` on buttons
✅ **Semantic HTML**: Proper audio element
✅ **Keyboard Nav**: Tab-accessible controls

### Schema Integration

```json
{
  "@type": "SpeakableSpecification",
  "cssSelector": [
    "#sia-audio-transcript-{articleId}",
    ".article-summary",
    ".sia-insight"
  ]
}
```

---

## 🐛 Troubleshooting

### Full-Featured Issues

**Audio not loading**:
```bash
# Check API endpoint
curl /api/sia-news/audio?articleId=123

# Check auto-generate
autoGenerate={true}
```

**Controls not working**:
- Verify audioRef is not null
- Check browser console for errors
- Test in different browsers

### Simple Issues

**Audio not playing**:
```bash
# Verify audio URL is accessible
curl -I /audio/file.mp3

# Check CORS headers
Access-Control-Allow-Origin: *
```

**Styling issues**:
- Check Tailwind classes are compiled
- Verify lucide-react icons installed
- Test responsive breakpoints

---

## 🚀 Migration Guide

### From Simple to Full-Featured

```tsx
// Before (Simple)
<SiaAudioPlayerSimple 
  src="/audio/article-123.mp3"
  transcriptId="transcript-123"
/>

// After (Full-Featured)
<SiaAudioPlayer 
  articleId="123"
  language="en"
  autoGenerate={true}
  transcriptId="transcript-123"
/>
```

### From Full-Featured to Simple

```tsx
// Before (Full-Featured)
<SiaAudioPlayer 
  articleId="123"
  language="en"
  transcriptId="transcript-123"
/>

// After (Simple) - Need audio URL
const audioUrl = await getAudioUrl("123")
<SiaAudioPlayerSimple 
  src={audioUrl}
  transcriptId="transcript-123"
  language="en"
/>
```

---

## 📚 Related Documentation

- [AdSense Audio Sync](./SIA-ADSENSE-AUDIO-SYNC-COMPLETE.md)
- [Speakable Schema](./SIA-SPEAKABLE-SCHEMA-INTEGRATION.md)
- [Audio System](./SIA-AUDIO-SYSTEM-COMPLETE.md)
- [Quick Start](./ADSENSE-AUDIO-SYNC-QUICKSTART.md)

---

## 🆘 Support

- **Technical**: dev@siaintel.com
- **Documentation**: /docs/
- **Test Pages**: 
  - Full: `/test-speakable-schema`
  - Simple: `/test-audio-simple`

---

**Version**: 1.0.0  
**Last Updated**: March 1, 2026  
**Status**: Both versions production-ready
