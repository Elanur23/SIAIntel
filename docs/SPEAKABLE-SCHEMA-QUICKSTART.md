# Speakable Schema Integration - Quick Start

## 🎯 Goal

Enable Google Assistant and voice assistants to read SIA News articles with synchronized audio playback.

## 📦 What's Included

- ✅ Audio player with premium Sovereign-Lux design
- ✅ Google Speakable Schema (JSON-LD)
- ✅ Automatic transcript ID generation
- ✅ Multi-language support (7 languages)
- ✅ WCAG 2.1 accessibility compliance

## 🚀 Quick Implementation

### Step 1: Import Components

```tsx
import SiaAudioPlayer from '@/components/SiaAudioPlayer'
import SiaSchemaInjector from '@/components/SiaSchemaInjector'
```

### Step 2: Generate Transcript ID

```tsx
const transcriptId = `sia-audio-transcript-${article.id}`
```

### Step 3: Add Audio Player

```tsx
<SiaAudioPlayer 
  articleId={article.id}
  language={params.lang}
  autoGenerate={true}
  transcriptId={transcriptId}
/>
```

### Step 4: Mark Content as Speakable

```tsx
<section 
  id={transcriptId}
  className="article-summary"
>
  <p>{article.summary}</p>
</section>
```

### Step 5: Inject Schema

```tsx
<SiaSchemaInjector 
  schema={structuredData} 
  priority="high" 
/>
```

## 📝 Complete Example

```tsx
export default async function ArticlePage({ params }) {
  const article = await getArticleBySlug(params.slug)
  const transcriptId = `sia-audio-transcript-${article.id}`
  const structuredData = getStructuredData(article.id)
  
  return (
    <>
      <SiaSchemaInjector schema={structuredData} priority="high" />
      
      <article>
        {/* Audio Player */}
        <SiaAudioPlayer 
          articleId={article.id}
          language={params.lang}
          autoGenerate={true}
          transcriptId={transcriptId}
        />
        
        {/* Speakable Content */}
        <section id={transcriptId} className="article-summary">
          <h2>Summary</h2>
          <p>{article.summary}</p>
        </section>
        
        <section className="sia-insight">
          <h2>SIA Insight</h2>
          <p>{article.siaInsight}</p>
        </section>
      </article>
    </>
  )
}
```

## 🔍 Schema Structure

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [
      "#sia-audio-transcript-{articleId}",
      ".article-summary",
      ".sia-insight",
      ".technical-glossary"
    ]
  }
}
```

## ✅ Validation

### Test Page
Visit: `/test-speakable-schema`

### Google Rich Results Test
1. Go to: https://search.google.com/test/rich-results
2. Enter your article URL
3. Check for "Speakable" in results

### Expected Output
- ✅ Valid NewsArticle schema
- ✅ Speakable specification present
- ✅ 4 CSS selectors detected
- ✅ Audio player functional

## 🎨 Audio Player Features

- **Play/Pause**: Toggle audio playback
- **Speed Control**: 0.75x, 1.0x, 1.25x, 1.5x
- **Seek Bar**: Jump to any position
- **Time Display**: Current time / Total duration
- **Auto-Generate**: Creates audio if missing
- **Error Handling**: Graceful fallback

## 🌍 Language Support

```tsx
// English
<SiaAudioPlayer articleId="123" language="en" />

// Turkish
<SiaAudioPlayer articleId="123" language="tr" />

// German
<SiaAudioPlayer articleId="123" language="de" />

// French
<SiaAudioPlayer articleId="123" language="fr" />

// Spanish
<SiaAudioPlayer articleId="123" language="es" />

// Russian
<SiaAudioPlayer articleId="123" language="ru" />

// Arabic (RTL)
<SiaAudioPlayer articleId="123" language="ar" />
```

## 📊 Benefits

### SEO
- Featured snippets for voice search
- Google Assistant integration
- Smart display compatibility
- Voice search ranking boost

### User Experience
- Accessibility (screen readers)
- Multitasking (listen while working)
- Premium feel (Bloomberg-style)
- Increased engagement

### Revenue
- Longer dwell time
- More ad impressions
- Higher CPC rates
- Better brand authority

## 🐛 Troubleshooting

### Audio Not Playing
```bash
# Check API key
echo $GOOGLE_CLOUD_TTS_API_KEY

# Verify article exists
curl /api/sia-news/articles?id={articleId}

# Test audio generation
curl -X POST /api/sia-news/audio -d '{"articleId":"123"}'
```

### Schema Not Validating
- Ensure transcript ID matches between player and content
- Check CSS selectors resolve to actual elements
- Verify JSON-LD is properly formatted

### Player Not Rendering
- Import SiaAudioPlayer component
- Pass required props (articleId, language)
- Check for JavaScript errors in console

## 📚 Documentation

- [Complete Integration Guide](./SIA-SPEAKABLE-SCHEMA-INTEGRATION.md)
- [Audio System Documentation](./SIA-AUDIO-SYSTEM-COMPLETE.md)
- [SSML Voice Guide](./SIA-VOICE-SSML-COMPLETE.md)

## 🆘 Support

- **Email**: dev@siaintel.com
- **Docs**: /docs/SIA-SPEAKABLE-SCHEMA-INTEGRATION.md
- **Test Page**: /test-speakable-schema

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: March 1, 2026
