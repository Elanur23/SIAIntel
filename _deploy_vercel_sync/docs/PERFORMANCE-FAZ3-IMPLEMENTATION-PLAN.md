# Performance Optimization - Faz 3 (Advanced) - IMPLEMENTATION PLAN

**Date**: March 21, 2026  
**Status**: 📋 READY TO IMPLEMENT  
**Trigger**: Performance Score < 90 after Faz 1 & 2  
**Target**: Improve Performance Score from 85-90 → 95+

---

## Prerequisites

Before implementing Faz 3, ensure:
- ✅ Faz 1 completed (Dynamic imports, font optimization)
- ✅ Faz 2 completed (Bundle analyzer, GA/GTM lazy load, preconnect)
- ✅ Lighthouse test completed
- ✅ Performance Score < 90

---

## Baseline Metrics (After Faz 2)

- **Performance Score**: 85-90/100
- **FCP**: 1.4s
- **LCP**: 2.2s
- **TBT**: 200ms
- **CLS**: 0.08
- **Speed Index**: 2.5s

---

## Faz 3 Optimizations

### 1. ISR (Incremental Static Regeneration) ⚡

**Goal**: Reduce server response time and improve TTFB

**Implementation**:

```typescript
// app/[lang]/page.tsx
export const revalidate = 60 // Revalidate every 60 seconds

// For article pages
// app/[lang]/news/[slug]/page.tsx
export const revalidate = 300 // 5 minutes for articles
```

**Impact**: 
- TTFB: -200ms
- Server response time: -150ms
- Better caching strategy

---

### 2. Critical CSS Extraction 🎨

**Goal**: Eliminate render-blocking CSS

**Implementation**:

```typescript
// app/layout.tsx - Add critical CSS inline
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical CSS - Above the fold */
            body { margin: 0; background: #020203; }
            .hero { min-height: 100vh; }
            /* ... other critical styles */
          `
        }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
```

**Tools**:
- `critical` package for CSS extraction
- Manual inline for hero section

**Impact**:
- FCP: -100ms
- LCP: -200ms
- Eliminates render-blocking CSS

---

### 3. Link Prefetching Strategy 🔗

**Goal**: Preload likely navigation targets

**Implementation**:

```typescript
// components/ArticleCard.tsx
import Link from 'next/link'

export function ArticleCard({ article }) {
  return (
    <Link 
      href={`/news/${article.slug}`}
      prefetch={true} // Enable prefetch
      onMouseEnter={() => {
        // Prefetch on hover
        router.prefetch(`/news/${article.slug}`)
      }}
    >
      {/* Card content */}
    </Link>
  )
}
```

**Strategy**:
- Prefetch on hover (desktop)
- Prefetch on viewport entry (mobile)
- Limit to top 5 articles

**Impact**:
- Perceived performance: +20%
- Navigation speed: -300ms

---

### 4. Advanced Code Splitting 📦

**Goal**: Further reduce initial bundle size

**Implementation**:

```typescript
// Split large libraries
const ReactMarkdown = dynamic(() => import('react-markdown'), {
  loading: () => <div>Loading...</div>
})

// Split by route
const AdminPanel = dynamic(() => import('@/components/AdminPanel'), {
  ssr: false
})

// Split by feature
const ChartComponent = dynamic(() => import('@/components/Chart'), {
  loading: () => <ChartSkeleton />
})
```

**Targets**:
- Markdown renderer (if used)
- Chart libraries
- Admin components
- Heavy utility libraries

**Impact**:
- Initial bundle: -100KB
- TBT: -50ms

---

### 5. Service Worker Optimization 🔧

**Goal**: Improve cache hit rate and offline experience

**Implementation**:

```javascript
// public/sw.js enhancements
const CACHE_VERSION = 'v2'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`

// Cache strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // API requests - Network first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request))
  }
  // Static assets - Cache first
  else if (url.pathname.match(/\.(js|css|png|jpg|svg)$/)) {
    event.respondWith(cacheFirst(request))
  }
  // HTML - Stale while revalidate
  else {
    event.respondWith(staleWhileRevalidate(request))
  }
})
```

**Impact**:
- Repeat visit speed: +50%
- Offline capability
- Better cache management

---

### 6. Image Optimization (If Needed) 🖼️

**Goal**: Reduce image payload

**Implementation**:

```typescript
// Use blur placeholders
import Image from 'next/image'

<Image
  src={article.image}
  alt={article.title}
  width={800}
  height={400}
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
  priority={isFeatured}
  loading={isFeatured ? 'eager' : 'lazy'}
/>
```

**Tools**:
- `plaiceholder` for blur data URLs
- WebP/AVIF format conversion
- Responsive image sizes

**Impact**:
- LCP: -300ms (if images are LCP element)
- CLS: -0.03

---

### 7. Resource Hints 💡

**Goal**: Optimize resource loading priority

**Implementation**:

```typescript
// app/layout.tsx
<head>
  {/* Preload critical resources */}
  <link rel="preload" href="/fonts/inter.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
  
  {/* Prefetch next likely page */}
  <link rel="prefetch" href="/api/articles" />
  
  {/* Preconnect to critical domains */}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="dns-prefetch" href="https://www.google-analytics.com" />
</head>
```

**Impact**:
- Font loading: -100ms
- API response: -50ms

---

### 8. Compression & Caching Headers 📦

**Goal**: Optimize asset delivery

**Implementation**:

```javascript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|png|webp|avif)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  compress: true, // Already enabled
}
```

**Impact**:
- Repeat visit: -500ms
- Bandwidth: -30%

---

## Implementation Priority

### Phase 3A - Quick Wins (1-2 hours)
1. ✅ ISR implementation (revalidate config)
2. ✅ Resource hints (preload, prefetch)
3. ✅ Caching headers

**Expected**: +3-5 performance points

### Phase 3B - Medium Effort (2-4 hours)
4. ✅ Link prefetching strategy
5. ✅ Advanced code splitting
6. ✅ Service worker optimization

**Expected**: +3-5 performance points

### Phase 3C - High Effort (4-6 hours)
7. ✅ Critical CSS extraction
8. ✅ Image optimization (if needed)

**Expected**: +2-3 performance points

---

## Expected Results

| Metric | Before Faz 3 | After Faz 3 | Improvement |
|--------|--------------|-------------|-------------|
| **Performance Score** | 85-90 | 95+ | +5-10 points |
| **FCP** | 1.4s | 1.3s | -100ms |
| **LCP** | 2.2s | 2.0s | -200ms |
| **TBT** | 200ms | 150ms | -50ms |
| **CLS** | 0.08 | 0.05 | -0.03 |
| **Speed Index** | 2.5s | 2.2s | -300ms |
| **TTFB** | 400ms | 200ms | -200ms |

---

## Testing Strategy

### After Each Phase

```bash
# Build
npm run build

# Start
npm start

# Lighthouse test
# Chrome DevTools → Lighthouse → Performance
# Test URL: http://localhost:3000/en/
```

### Metrics to Monitor

1. **Performance Score**: Target > 95
2. **Core Web Vitals**:
   - LCP < 2.0s ✅
   - FID < 100ms ✅
   - CLS < 0.1 ✅
3. **Additional Metrics**:
   - TTFB < 200ms
   - FCP < 1.3s
   - TBT < 150ms

---

## Rollback Plan

If any phase causes issues:

### Phase 3A Rollback
```bash
# Revert ISR config
git checkout HEAD -- app/[lang]/page.tsx

# Remove resource hints
git checkout HEAD -- app/layout.tsx

# Rebuild
npm run build
```

### Phase 3B Rollback
```bash
# Revert code splitting
git checkout HEAD -- components/

# Revert service worker
git checkout HEAD -- public/sw.js

# Rebuild
npm run build
```

### Phase 3C Rollback
```bash
# Remove critical CSS
git checkout HEAD -- app/layout.tsx

# Revert image optimization
git checkout HEAD -- components/

# Rebuild
npm run build
```

---

## Success Criteria

- [ ] Performance Score > 95
- [ ] LCP < 2.0s (Google "Good" threshold)
- [ ] TBT < 150ms
- [ ] FCP < 1.3s
- [ ] CLS < 0.05
- [ ] TTFB < 200ms
- [ ] No visual regressions
- [ ] All functionality working
- [ ] Analytics tracking intact

---

## Files to Modify

### Phase 3A
1. `app/[lang]/page.tsx` - ISR config
2. `app/[lang]/news/[slug]/page.tsx` - ISR config
3. `app/layout.tsx` - Resource hints
4. `next.config.js` - Caching headers

### Phase 3B
5. `components/ArticleCard.tsx` - Prefetch strategy
6. `components/[various].tsx` - Code splitting
7. `public/sw.js` - Service worker optimization

### Phase 3C
8. `app/layout.tsx` - Critical CSS
9. `components/[image-components].tsx` - Image optimization

---

## Dependencies

### Required Packages (if not installed)
```bash
# Critical CSS extraction
npm install --save-dev critical

# Image blur placeholders
npm install plaiceholder sharp

# Already installed:
# - next (ISR built-in)
# - @ducanh2912/next-pwa (Service worker)
```

---

## Performance Budget

After Faz 3, maintain these budgets:

| Resource Type | Budget | Current |
|---------------|--------|---------|
| **Initial JS** | < 500KB | ~650KB |
| **Initial CSS** | < 50KB | ~30KB |
| **Images** | < 500KB | ~200KB |
| **Fonts** | < 100KB | ~80KB |
| **Total Page** | < 1.5MB | ~1.9MB |

---

## Monitoring & Maintenance

### Daily Checks
- Lighthouse CI scores
- Core Web Vitals from RUM
- Cache hit rates
- Service worker performance

### Weekly Reviews
- Bundle size trends
- Performance regression detection
- User experience metrics
- Mobile vs Desktop performance

### Monthly Audits
- Full performance audit
- Competitor benchmarking
- Optimization opportunities
- Technology updates

---

## Next Steps After Faz 3

If Performance Score > 95:
1. ✅ Production deployment
2. ✅ Real User Monitoring (RUM) setup
3. ✅ Performance dashboard
4. ✅ Continuous monitoring

If Performance Score < 95:
1. ⚠️ Deep dive analysis
2. ⚠️ Identify bottlenecks
3. ⚠️ Custom optimizations
4. ⚠️ Consider CDN/edge optimization

---

**Prepared By**: Kiro AI Assistant  
**Review Status**: Ready for Implementation  
**Trigger Condition**: Performance Score < 90 after Faz 2

