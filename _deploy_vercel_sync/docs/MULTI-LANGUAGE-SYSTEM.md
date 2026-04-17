# Multi-Language System (i18n)

## Overview

Full multi-language support for the news portal with English (default) and Spanish translations.

## Features

✅ **Automatic Language Detection**
- Browser language detection via Accept-Language header
- Cookie-based language persistence
- Manual language switching

✅ **SEO Optimized**
- Hreflang tags for search engines
- Locale-specific URLs (`/es/news/...`)
- Proper canonical URLs

✅ **Professional UI**
- Language switcher with flags (🇺🇸 🇪🇸)
- Smooth transitions
- Persistent language selection

✅ **Complete Translation Coverage**
- Navigation menus
- Category names
- Common UI elements
- Article metadata
- Error messages
- Search functionality

## Supported Languages

| Language | Code | Flag | Status |
|----------|------|------|--------|
| English (US) | `en` | 🇺🇸 | ✅ Default |
| Spanish | `es` | 🇪🇸 | ✅ Complete |

## URL Structure

### English (Default)
```
/ → Homepage
/news/article-slug → Article page
/category/technology → Category page
```

### Spanish
```
/es → Homepage
/es/news/article-slug → Article page
/es/category/technology → Category page
```

## Implementation

### 1. Middleware (`middleware.ts`)
- Detects user language from cookie or browser
- Redirects to appropriate locale
- Skips API routes and static files

### 2. Translation Dictionaries (`lib/i18n/dictionaries.ts`)
- Complete translations for all UI text
- Type-safe dictionary access
- Easy to extend with new languages

### 3. Configuration (`lib/i18n/config.ts`)
- Locale settings
- Language names and flags
- Helper functions for pathname manipulation

### 4. Language Switcher Component (`components/LanguageSwitcher.tsx`)
- Dropdown with flags
- Cookie persistence
- Smooth navigation

### 5. Localized Routes (`app/[lang]/page.tsx`)
- Dynamic locale parameter
- Translated content
- Locale-aware links

## Usage

### In Components

```typescript
import { getDictionary } from '@/lib/i18n/dictionaries'
import { type Locale } from '@/lib/i18n/config'

export default function MyComponent({ params }: { params: { lang: Locale } }) {
  const dict = getDictionary(params.lang)
  
  return (
    <div>
      <h1>{dict.home.hero.title}</h1>
      <p>{dict.home.hero.subtitle}</p>
    </div>
  )
}
```

### Creating Links

```typescript
// For localized pages
const langPrefix = params.lang === 'en' ? '' : `/${params.lang}`
<Link href={`${langPrefix}/news/${article.slug}`}>
  {dict.common.readMore}
</Link>
```

## Adding New Languages

### Step 1: Add Language to Config

```typescript
// lib/i18n/config.ts
export const i18n = {
  defaultLocale: 'en',
  locales: ['en', 'es', 'fr'], // Add 'fr'
} as const

export const localeNames: Record<Locale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français', // Add French
}

export const localeFlags: Record<Locale, string> = {
  en: '🇺🇸',
  es: '🇪🇸',
  fr: '🇫🇷', // Add flag
}
```

### Step 2: Add Translations

```typescript
// lib/i18n/dictionaries.ts
const fr = {
  nav: {
    home: 'Accueil',
    news: 'Actualités',
    // ... more translations
  },
  // ... complete translation object
}

export const dictionaries = {
  en,
  es,
  fr, // Add French
} as const
```

### Step 3: Update Metadata

```typescript
// app/layout.tsx
alternates: {
  canonical: '/',
  languages: {
    'en-US': '/en',
    'es-ES': '/es',
    'fr-FR': '/fr', // Add French
  },
}
```

## Translation Coverage

### Navigation
- Home, News, Categories, About, Contact

### Categories
- Breaking News, Politics, Business, Sports, Technology
- Entertainment, Health, Science, World, Weather, Crime, Local

### Common UI
- Read More, Loading, Error, Retry, Share
- Views, Min Read, Published, Updated, By, In
- Subscribe, Search, Trending, Featured, Latest, Popular

### Article Page
- Summary, Tags, Share Article, Related News
- Comments, Write Comment, No Comments

### Footer
- About Us, Contact, Privacy Policy, Terms of Service
- Copyright, Follow Us

### Newsletter
- Title, Description, Placeholder, Button
- Success/Error messages

### Search
- Placeholder, No Results, Results

### Errors
- Not Found, Server Error, Go Home, Try Again

## SEO Benefits

✅ **Better Rankings**
- Separate URLs for each language
- Proper hreflang tags
- Language-specific sitemaps

✅ **User Experience**
- Automatic language detection
- Persistent language choice
- Native language content

✅ **International Reach**
- Target Spanish-speaking markets
- Expand to more languages easily
- Localized content strategy

## Performance

- **Zero Runtime Overhead**: Translations loaded at build time
- **Type Safety**: TypeScript ensures all translations exist
- **Small Bundle**: Only active language loaded
- **Fast Switching**: Client-side navigation

## Browser Support

- All modern browsers
- Fallback to English for unsupported languages
- Cookie-based persistence (no localStorage needed)

## Testing

### Test Language Detection
1. Open browser in incognito mode
2. Change browser language to Spanish
3. Visit site → Should redirect to `/es`

### Test Language Switching
1. Click language switcher (🇺🇸 icon)
2. Select Español
3. Page should reload in Spanish
4. Cookie should persist across pages

### Test SEO
1. View page source
2. Check for hreflang tags:
```html
<link rel="alternate" hreflang="en-US" href="/en" />
<link rel="alternate" hreflang="es-ES" href="/es" />
```

## Future Enhancements

🔮 **Planned Features**
- [ ] Portuguese (Brazil) - 🇧🇷
- [ ] French - 🇫🇷
- [ ] German - 🇩🇪
- [ ] AI-powered article translation
- [ ] Language-specific content recommendations
- [ ] RTL language support (Arabic, Hebrew)

## Troubleshooting

### Language Not Switching
- Clear browser cookies
- Check middleware is running
- Verify locale in URL

### Missing Translations
- Check dictionary has all keys
- TypeScript will show errors
- Add missing translations

### SEO Issues
- Verify hreflang tags in HTML
- Check canonical URLs
- Test with Google Search Console

## Resources

- [Next.js i18n Documentation](https://nextjs.org/docs/app/building-your-application/routing/internationalization)
- [Google Hreflang Guide](https://developers.google.com/search/docs/specialty/international/localized-versions)
- [MDN Accept-Language](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Accept-Language)

---

**Status**: ✅ Complete and Production Ready
**Last Updated**: February 3, 2026
**Version**: 1.0.0
