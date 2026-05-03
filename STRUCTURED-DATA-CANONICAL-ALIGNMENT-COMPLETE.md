# Structured Data (JSON-LD) Canonical Alignment - COMPLETE ✅

## Task Summary
Aligned Article schema (JSON-LD) with canonical URL logic in news article pages.

## Changes Made

### File: `app/(public)/[lang]/news/[slug]/page.tsx`

**Location:** Lines 870-903 (structuredData object)

### Added Fields

1. **`url` field** (line 875):
   ```typescript
   url: articleUrl,
   ```
   - ✅ Uses canonical URL from `articleUrl` variable
   - ✅ Never uses `params.slug`
   - ✅ Always uses `canonicalSlug` and `canonicalRouteLocale`

2. **`inLanguage` field** (line 895):
   ```typescript
   inLanguage: HREFLANG_BY_ROUTE_LOCALE[canonicalRouteLocale],
   ```
   - ✅ Uses canonical route locale
   - ✅ Maps to proper hreflang code (e.g., 'en', 'tr', 'pt-BR')

### Existing Correct Implementation

**`mainEntityOfPage` field** (already correct):
```typescript
mainEntityOfPage: {
  '@type': 'WebPage',
  '@id': articleUrl,
},
```
- ✅ Uses canonical URL
- ✅ Matches sitemap and canonical tag

## Canonical URL Construction

The `articleUrl` variable is constructed correctly (lines 835-837):

```typescript
const canonicalRouteLocale = detailArticle.canonicalRouteLocale
const canonicalSlug = detailArticle.getSlugForLocale(canonicalRouteLocale) || detailArticle.canonicalSlug
const articleUrl = `${baseUrl}/${canonicalRouteLocale}/news/${canonicalSlug}`
```

**Key Points:**
- ✅ Uses `canonicalRouteLocale` (not `routeLang` or `params.lang`)
- ✅ Uses `getSlugForLocale(canonicalRouteLocale)` (not `params.slug`)
- ✅ Falls back to `detailArticle.canonicalSlug` if needed

## Complete Structured Data Schema

```typescript
const structuredData = {
  '@context': 'https://schema.org',
  '@type': ['NewsArticle', 'AnalysisNewsArticle'],
  headline: content.title || 'SIA Intelligence Report',
  description: content.summary || 'Intelligence analysis from SIA',
  url: articleUrl,  // ✅ CANONICAL URL
  image: {
    '@type': 'ImageObject',
    url: content.image || `${baseUrl}/og-image.png`,
    width: 1200,
    height: 630,
  },
  datePublished: content.isoDate || new Date().toISOString(),
  dateModified: content.isoDate || new Date().toISOString(),
  author: [authorSchema],
  publisher: {
    '@type': 'Organization',
    name: 'SIA Intelligence Protocol',
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: 600,
      height: 60,
    },
  },
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': articleUrl,  // ✅ CANONICAL URL
  },
  inLanguage: HREFLANG_BY_ROUTE_LOCALE[canonicalRouteLocale],  // ✅ CANONICAL LOCALE
  isAccessibleForFree: true,
  articleSection: content.category || 'MARKET',
  ...(speakable ? { speakable } : {}),
}
```

## Rules Compliance Checklist

| Rule | Status | Implementation |
|------|--------|----------------|
| SET mainEntityOfPage.@id to canonical URL | ✅ PASS | Line 891: `'@id': articleUrl` |
| SET url field to canonical URL | ✅ PASS | Line 875: `url: articleUrl` |
| NEVER use params.slug | ✅ PASS | Uses `canonicalSlug` from `getSlugForLocale()` |
| NEVER use raw slug | ✅ PASS | Uses `canonicalSlug` |
| ALWAYS use canonicalSlug | ✅ PASS | Line 836: `detailArticle.getSlugForLocale(canonicalRouteLocale)` |
| ALWAYS use canonicalRouteLocale | ✅ PASS | Lines 835, 836, 837, 895 |
| OPTIONAL: inLanguage field | ✅ PASS | Line 895: `HREFLANG_BY_ROUTE_LOCALE[canonicalRouteLocale]` |

## Expected HTML Output

When viewing page source, the JSON-LD script should contain:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": ["NewsArticle", "AnalysisNewsArticle"],
  "headline": "Article Title",
  "url": "https://siaintel.com/en/news/article-slug--articleId",
  "mainEntityOfPage": {
    "@type": "WebPage",
    "@id": "https://siaintel.com/en/news/article-slug--articleId"
  },
  "inLanguage": "en",
  ...
}
</script>
```

## Validation Checklist

✅ **url field** = canonical URL  
✅ **mainEntityOfPage.@id** = canonical URL  
✅ **Matches sitemap** (uses same canonical logic)  
✅ **Matches canonical tag** (uses same `articleUrl` variable)  
✅ **inLanguage** = canonical locale hreflang code  

## Cross-Reference Alignment

All three SEO elements now use the same canonical URL:

1. **Canonical Tag** (metadata):
   ```typescript
   alternates: {
     canonical: articleUrl,
   }
   ```

2. **Hreflang Tags** (metadata):
   ```typescript
   languages: {
     'x-default': xDefaultUrl,
     ...languageAlternates,
   }
   ```

3. **Structured Data** (JSON-LD):
   ```typescript
   url: articleUrl,
   mainEntityOfPage: { '@id': articleUrl },
   inLanguage: HREFLANG_BY_ROUTE_LOCALE[canonicalRouteLocale],
   ```

## Testing Instructions

1. **Start dev server**: `npm run dev`
2. **Navigate to article**: e.g., `http://localhost:3000/en/news/some-article--cuid`
3. **View page source**: Right-click → "View Page Source"
4. **Find JSON-LD script**: Search for `<script type="application/ld+json">`
5. **Verify**:
   - ✅ `"url"` field exists and matches canonical URL
   - ✅ `"mainEntityOfPage"."@id"` matches canonical URL
   - ✅ `"inLanguage"` matches canonical locale
   - ✅ All three match the `<link rel="canonical">` tag

## Result

**STATUS: tamam** ✅

The structured data (JSON-LD) is now fully aligned with canonical URL logic. All schema fields use the canonical URL and locale, ensuring consistency across SEO elements.
