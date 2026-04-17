# SIA Audio Player - Usage Guide

**Component**: `components/SiaAudioPlayer.tsx`  
**Version**: 2.0.0 (Premium Design)  
**Date**: March 1, 2026

---

## 🎨 PREMIUM DESIGN FEATURES

### Visual Elements

1. **Gradient Background**: `from-slate-900 to-black`
2. **Gold Accent Border**: Left border with `border-gold-500`
3. **Animated Play Button**: Hover scale effect with shadow
4. **Pulsing Badge**: "SIA AI Voice: Institutional Analysis"
5. **Regulatory Verification**: "21 Regulatory Entities Verified"
6. **Premium Shadow**: `shadow-2xl` for depth
7. **Rounded Corners**: `rounded-xl` for modern look

### SEO Optimization

- **Google Speakable Target**: `id={transcriptId}` for voice search
- **Semantic HTML**: Proper audio element with controls
- **Accessibility**: ARIA labels for screen readers
- **Schema.org Ready**: Compatible with AudioObject schema

---

## 📋 COMPONENT PROPS

```typescript
interface SiaAudioPlayerProps {
  articleId: string        // Article ID for audio lookup
  language: Language       // Language code (tr, en, ar, etc.)
  autoGenerate?: boolean   // Auto-generate if audio doesn't exist
  transcriptId?: string    // Custom ID for Google Speakable (optional)
}
```

---

## 🚀 BASIC USAGE

### Simple Implementation

```tsx
import SiaAudioPlayer from '@/components/SiaAudioPlayer'

export default function ArticlePage() {
  return (
    <article>
      <h1>Bitcoin Surges 8%</h1>
      
      <SiaAudioPlayer 
        articleId="sia-news-tr-001"
        language="tr"
      />
      
      <div>Article content...</div>
    </article>
  )
}
```

### With Auto-Generation

```tsx
<SiaAudioPlayer 
  articleId="sia-news-en-042"
  language="en"
  autoGenerate={true}
/>
```

### With Custom Transcript ID

```tsx
<SiaAudioPlayer 
  articleId="sia-news-ar-015"
  language="ar"
  transcriptId="speakable-transcript-ar-015"
/>
```

---

## 🎯 DESIGN BREAKDOWN

### Header Section

```tsx
<div className="flex items-center justify-between mb-6">
  {/* Left: Play Button + Title */}
  <div className="flex items-center gap-4">
    <button className="bg-gold-500 hover:bg-gold-400 p-4 rounded-full">
      {/* Play/Pause Icon */}
    </button>
    
    <div className="flex flex-col">
      <span className="text-xs font-bold text-gold-500 uppercase tracking-widest animate-pulse">
        SIA AI Voice: Institutional Analysis
      </span>
      <h4 className="text-white font-medium text-lg">
        Listen to the Intelligence Report
      </h4>
    </div>
  </div>
  
  {/* Right: Regulatory Badge */}
  <div className="hidden md:block text-right">
    <span className="text-gray-400 text-[10px] uppercase font-mono">
      21 Regulatory Entities Verified
    </span>
  </div>
</div>
```

### Audio Element (SEO-Optimized)

```tsx
<audio
  ref={audioRef}
  id={transcriptId}
  src={audioUrl}
  className="w-full accent-gold-500 opacity-80 h-10"
  controls
  controlsList="nodownload"
/>
```

**Key Features**:
- `id={transcriptId}`: Google Speakable target
- `controls`: Native browser controls
- `controlsList="nodownload"`: Disable download button
- `accent-gold-500`: Gold-themed controls

### Progress Bar

```tsx
<div className="mt-4">
  <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
    <span>0:45</span>
    <span>3:20</span>
  </div>
  <input
    type="range"
    className="w-full h-2 bg-gray-700 rounded-lg accent-gold-500"
  />
</div>
```

### Playback Speed Controls

```tsx
<div className="flex items-center gap-2">
  <span className="text-sm text-gray-400">Speed:</span>
  {[0.75, 1.0, 1.25, 1.5].map(rate => (
    <button
      className={playbackRate === rate
        ? 'bg-gold-500 text-black font-medium'
        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
      }
    >
      {rate}x
    </button>
  ))}
</div>
```

---

## 🌍 MULTILINGUAL LABELS

### Supported Languages

```typescript
const labels: Record<Language, { 
  listen: string
  loading: string
  error: string
  generate: string 
}> = {
  en: { 
    listen: 'Listen to Article', 
    loading: 'Loading...', 
    error: 'Audio Error', 
    generate: 'Generate Audio' 
  },
  tr: { 
    listen: 'Makaleyi Dinle', 
    loading: 'Yükleniyor...', 
    error: 'Ses Hatası', 
    generate: 'Ses Oluştur' 
  },
  de: { 
    listen: 'Artikel Anhören', 
    loading: 'Laden...', 
    error: 'Audio-Fehler', 
    generate: 'Audio Generieren' 
  },
  fr: { 
    listen: 'Écouter l\'Article', 
    loading: 'Chargement...', 
    error: 'Erreur Audio', 
    generate: 'Générer Audio' 
  },
  es: { 
    listen: 'Escuchar Artículo', 
    loading: 'Cargando...', 
    error: 'Error de Audio', 
    generate: 'Generar Audio' 
  },
  ru: { 
    listen: 'Слушать Статью', 
    loading: 'Загрузка...', 
    error: 'Ошибка Аудио', 
    generate: 'Создать Аудио' 
  },
  ar: { 
    listen: 'استماع للمقال', 
    loading: 'جاري التحميل...', 
    error: 'خطأ في الصوت', 
    generate: 'إنشاء صوت' 
  }
}
```

---

## 🎭 COMPONENT STATES

### 1. Loading State

```tsx
<div className="sia-player-container bg-gradient-to-r from-slate-900 to-black border-l-4 border-gold-500">
  <div className="flex items-center gap-4">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
    <div className="flex flex-col">
      <span className="text-xs font-bold text-gold-500 uppercase animate-pulse">
        SIA AI Voice: Generating...
      </span>
      <span className="text-white font-medium text-lg">Loading...</span>
    </div>
  </div>
</div>
```

### 2. Error State

```tsx
<div className="sia-player-container bg-gradient-to-r from-red-900/20 to-black border-l-4 border-red-500">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-4">
      <svg className="w-8 h-8 text-red-400">...</svg>
      <div className="flex flex-col">
        <span className="text-xs font-bold text-red-500 uppercase">Audio Error</span>
        <span className="text-red-400">{error}</span>
      </div>
    </div>
    <button className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black">
      Generate Audio
    </button>
  </div>
</div>
```

### 3. Playing State

Full player with all controls active.

---

## 🔍 SEO INTEGRATION

### Google Speakable Schema

Add to your article page's structured data:

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Bitcoin Surges 8%",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": ["#audio-transcript-sia-news-tr-001"]
  },
  "audio": {
    "@type": "AudioObject",
    "contentUrl": "/audio/tr-TR/sia-news-tr-001.mp3",
    "duration": "PT3M20S",
    "encodingFormat": "audio/mpeg"
  }
}
```

### Implementation

```tsx
import SiaSchemaInjector from '@/components/SiaSchemaInjector'
import SiaAudioPlayer from '@/components/SiaAudioPlayer'

export default function ArticlePage({ article }) {
  return (
    <>
      {/* Schema with Speakable */}
      <SiaSchemaInjector 
        article={article}
        includeSpeakable={true}
      />
      
      {/* Audio Player */}
      <SiaAudioPlayer 
        articleId={article.id}
        language={article.language}
        transcriptId={`audio-transcript-${article.id}`}
      />
    </>
  )
}
```

---

## 🎨 CUSTOMIZATION

### Color Scheme

```css
/* Gold Theme (Default) */
.border-gold-500 { border-color: #f59e0b; }
.bg-gold-500 { background-color: #f59e0b; }
.text-gold-500 { color: #f59e0b; }

/* Alternative: Blue Theme */
.border-blue-500 { border-color: #3b82f6; }
.bg-blue-500 { background-color: #3b82f6; }
.text-blue-500 { color: #3b82f6; }
```

### Size Variants

```tsx
// Compact Version
<div className="p-4 my-4 rounded-lg">
  <button className="p-3 rounded-full">
    <svg className="w-6 h-6">...</svg>
  </button>
</div>

// Large Version
<div className="p-8 my-12 rounded-2xl">
  <button className="p-6 rounded-full">
    <svg className="w-12 h-12">...</svg>
  </button>
</div>
```

---

## 📊 ANALYTICS INTEGRATION

### Track Playback Events

```tsx
function handlePlay() {
  // Google Analytics
  gtag('event', 'audio_play', {
    article_id: articleId,
    language: language,
    audio_duration: duration
  })
  
  // Custom Analytics
  trackEvent('audio_player', 'play', articleId)
}

function handleComplete() {
  gtag('event', 'audio_complete', {
    article_id: articleId,
    completion_rate: 100
  })
}
```

---

## 🚀 PERFORMANCE OPTIMIZATION

### Lazy Loading

```tsx
import dynamic from 'next/dynamic'

const SiaAudioPlayer = dynamic(() => import('@/components/SiaAudioPlayer'), {
  loading: () => <div className="h-32 bg-gray-800 animate-pulse rounded-xl" />,
  ssr: false
})
```

### Preload Audio

```tsx
<link 
  rel="preload" 
  href={audioUrl} 
  as="audio" 
  type="audio/mpeg"
/>
```

---

## 📱 RESPONSIVE DESIGN

### Mobile Optimization

```tsx
{/* Hide regulatory badge on mobile */}
<div className="hidden md:block text-right">
  <span>21 Regulatory Entities Verified</span>
</div>

{/* Stack controls on mobile */}
<div className="flex flex-col md:flex-row items-center gap-4">
  <button>Play</button>
  <div className="flex-1 w-full">Progress Bar</div>
</div>
```

---

## ✅ ACCESSIBILITY

### ARIA Labels

```tsx
<button 
  aria-label={isPlaying ? 'Pause audio' : 'Play audio'}
  aria-pressed={isPlaying}
>
  {/* Icon */}
</button>

<audio 
  aria-label="Article audio narration"
  aria-describedby="audio-description"
>
```

### Keyboard Navigation

- `Space`: Play/Pause
- `Arrow Left/Right`: Seek ±5s
- `Arrow Up/Down`: Volume control

---

## 🔧 TROUBLESHOOTING

### Audio Not Loading

```typescript
// Check audio URL
console.log('Audio URL:', audioUrl)

// Verify API response
const response = await fetch(`/api/sia-news/audio?articleId=${articleId}`)
const data = await response.json()
console.log('Audio metadata:', data)
```

### Playback Issues

```typescript
// Check browser support
const audio = document.createElement('audio')
const canPlayMP3 = audio.canPlayType('audio/mpeg')
console.log('MP3 support:', canPlayMP3) // "probably" or "maybe"
```

---

## 📞 SUPPORT

**Component Issues**: tech@siaintel.com  
**Design Feedback**: design@siaintel.com  
**Documentation**: docs.siaintel.com/audio-player

---

**Last Updated**: March 1, 2026  
**Version**: 2.0.0  
**Status**: ✅ Production Ready
