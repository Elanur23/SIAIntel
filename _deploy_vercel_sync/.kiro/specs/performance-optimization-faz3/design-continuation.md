# Design Document Continuation: Performance Optimization Faz 3

## Algorithmic Pseudocode (Continued)

### Algorithm 2: Critical CSS Extraction (Continued)

```pascal
ALGORITHM extractCriticalCSS(htmlContent, stylesheets)
INPUT: htmlContent of type String, stylesheets of type Array<String>
OUTPUT: criticalCSS of type String

BEGIN
  // Step 1: Parse HTML and build DOM tree
  dom ← parseHTML(htmlContent)
  viewport ← { width: 1920, height: 1080 }
  
  // Step 2: Identify above-the-fold elements
  aboveFoldElements ← []
  FOR each element IN dom.body DO
    ASSERT element ≠ NULL
    elementPosition ← calculatePosition(element)
    IF elementPosition.top < viewport.height THEN
      aboveFoldElements.add(element)
    END IF
  END FOR
  
  // Step 3: Extract CSS rules for above-fold elements
  criticalRules ← []
  FOR each stylesheet IN stylesheets DO
    rules ← parseCSS(stylesheet)
    FOR each rule IN rules DO
      IF ruleMatchesAnyElement(rule, aboveFoldElements) THEN
        criticalRules.add(rule)
      END IF
    END FOR
  END FOR
  
  // Step 4: Minify and return critical CSS
  criticalCSS ← minifyCSS(criticalRules.join('\n'))
  
  ASSERT criticalCSS.length < 14336 // 14KB limit
  
  RETURN criticalCSS
END
```

**Preconditions**:
- htmlContent is valid HTML string
- stylesheets array contains valid CSS file paths
- Viewport dimensions are positive integers

**Postconditions**:
- Returns minified CSS string
- CSS size < 14KB (HTTP/2 first round trip)
- All above-fold elements have styling rules included

**Loop Invariants**:
- All processed elements have valid positions
- All matched rules are valid CSS
- criticalRules contains only unique rules

---

### Algorithm 3: Link Prefetch with Priority Queue

```pascal
ALGORITHM prefetchLinks(links, strategy)
INPUT: links of type Array<URL>, strategy of type PrefetchStrategy
OUTPUT: prefetchResults of type Array<PrefetchResult>

BEGIN
  queue ← PriorityQueue()
  results ← []
  active ← 0
  maxConcurrent ← 3
  
  // Step 1: Populate priority queue
  FOR each link IN links DO
    priority ← calculatePriority(link, strategy)
    queue.enqueue(link, priority)
  END FOR
  
  // Step 2: Process queue with concurrency limit
  WHILE NOT queue.isEmpty() OR active > 0 DO
    ASSERT active ≤ maxConcurrent
    
    // Start new prefetch if under limit
    IF active < maxConcurrent AND NOT queue.isEmpty() THEN
      link ← queue.dequeue()
      
      // Check if already prefetched
      IF NOT isPrefetched(link) THEN
        active ← active + 1
        startPrefetch(link, onComplete)
      END IF
    END IF
    
    // Wait for completion events
    WAIT_FOR_EVENT()
  END WHILE
  
  RETURN results
END

FUNCTION onComplete(link, success)
BEGIN
  active ← active - 1
  results.add({ url: link, success: success })
  markPrefetched(link)
END
```

**Preconditions**:
- links array is non-empty
- strategy is one of: 'hover', 'viewport', 'idle'
- maxConcurrent is between 1 and 5

**Postconditions**:
- All links are processed
- active count returns to 0
- No more than maxConcurrent requests active simultaneously

**Loop Invariants**:
- active ≤ maxConcurrent at all times
- All completed links are marked as prefetched
- Queue maintains priority ordering

---

### Algorithm 4: Service Worker Cache Strategy Selection

```pascal
ALGORITHM selectCacheStrategy(request)
INPUT: request of type FetchRequest
OUTPUT: strategy of type CacheStrategy

BEGIN
  url ← parseURL(request.url)
  
  // Step 1: Determine resource type
  IF url.pathname.startsWith('/api/') THEN
    // API requests - Network first
    RETURN NetworkFirstStrategy({
      cacheName: 'api-cache',
      maxAge: 300, // 5 minutes
      fallbackToCache: true
    })
  
  ELSE IF url.pathname.match(/\.(js|css|woff2)$/) THEN
    // Static assets - Cache first
    RETURN CacheFirstStrategy({
      cacheName: 'static-assets',
      maxAge: 31536000, // 1 year
      networkFallback: true
    })
  
  ELSE IF url.pathname.match(/\.(jpg|png|webp|avif|svg)$/) THEN
    // Images - Cache first with longer expiry
    RETURN CacheFirstStrategy({
      cacheName: 'images',
      maxAge: 2592000, // 30 days
      maxEntries: 100
    })
  
  ELSE
    // HTML pages - Stale while revalidate
    RETURN StaleWhileRevalidateStrategy({
      cacheName: 'pages',
      maxAge: 3600, // 1 hour
      revalidateInBackground: true
    })
  END IF
END
```

**Preconditions**:
- request is a valid FetchRequest object
- request.url is a valid URL string

**Postconditions**:
- Returns appropriate CacheStrategy for resource type
- Strategy configuration is valid
- Cache names are unique per resource type

**Loop Invariants**: N/A (no loops)

---

## Key Functions with Formal Specifications

### Function 1: applyISRConfig()

```typescript
async function applyISRConfig(
  page: string,
  config: ISRConfig
): Promise<void>
```

**Preconditions:**
- page is a valid Next.js page path
- config.revalidate > 0
- config.dynamicParams is boolean

**Postconditions:**
- ISR configuration is applied to page
- Page exports revalidate constant
- generateStaticParams function is exported if provided
- No build errors occur

**Loop Invariants:** N/A

---

### Function 2: extractAndInlineCriticalCSS()

```typescript
async function extractAndInlineCriticalCSS(
  htmlPath: string,
  cssFiles: string[]
): Promise<string>
```

**Preconditions:**
- htmlPath points to valid HTML file
- cssFiles array contains valid CSS file paths
- All files are readable

**Postconditions:**
- Returns HTML with inlined critical CSS
- Critical CSS size < 14KB
- Non-critical CSS is deferred
- Original HTML structure preserved

**Loop Invariants:**
- All processed CSS rules are valid
- Inline CSS remains under size limit

---

### Function 3: prefetchOnHover()

```typescript
function prefetchOnHover(
  linkElement: HTMLAnchorElement,
  options?: PrefetchOptions
): () => void
```

**Preconditions:**
- linkElement is a valid anchor element
- linkElement.href is a valid URL
- options.throttleMs ≥ 0 if provided

**Postconditions:**
- Returns cleanup function
- Hover event listener is attached
- Prefetch is throttled according to options
- Cleanup removes event listener

**Loop Invariants:** N/A

---

### Function 4: optimizeServiceWorkerCache()

```typescript
async function optimizeServiceWorkerCache(
  manifest: CacheManifest
): Promise<void>
```

**Preconditions:**
- manifest.version follows semver format
- manifest.runtimeCache strategies are valid
- manifest.precache URLs are accessible

**Postconditions:**
- Old cache versions are deleted
- New cache version is created
- Precache assets are cached
- Runtime cache strategies are registered

**Loop Invariants:**
- All cache operations complete successfully
- Cache storage quota is not exceeded

---

## Example Usage

### Example 1: Applying ISR to Homepage

```typescript
// app/[lang]/page.tsx

// ISR Configuration
export const revalidate = 60 // Revalidate every 60 seconds
export const dynamicParams = true

// Pre-render all language variants
export async function generateStaticParams() {
  return [
    { lang: 'en' },
    { lang: 'tr' },
    { lang: 'de' },
    { lang: 'fr' },
    { lang: 'es' },
    { lang: 'ru' },
    { lang: 'ar' },
    { lang: 'jp' },
    { lang: 'zh' }
  ]
}

export default async function HomePage({ params }: { params: { lang: string } }) {
  // Page will be statically generated at build time
  // and revalidated every 60 seconds
  const articles = await getCachedArticles('published')
  
  return <HomePageContent articles={articles} lang={params.lang} />
}
```

---

### Example 2: Critical CSS Extraction

```typescript
// scripts/extract-critical-css.ts

import { extractCriticalCSS } from '@/lib/performance/critical-css'

async function main() {
  const criticalCSS = await extractCriticalCSS({
    base: 'http://localhost:3000',
    src: '.next/server/app/[lang]/page.html',
    target: 'public/critical.css',
    width: 1920,
    height: 1080,
    inline: true,
    minify: true
  })
  
  console.log(`Critical CSS extracted: ${criticalCSS.length} bytes`)
  console.log(`Reduction: ${((1 - criticalCSS.length / originalSize) * 100).toFixed(1)}%`)
}

main()
```

---

### Example 3: Link Prefetching Component

```typescript
// components/PrefetchLink.tsx

'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback } from 'react'

interface PrefetchLinkProps {
  href: string
  children: React.ReactNode
  strategy?: 'hover' | 'viewport'
}

export function PrefetchLink({ href, children, strategy = 'hover' }: PrefetchLinkProps) {
  const router = useRouter()
  
  const handleMouseEnter = useCallback(() => {
    if (strategy === 'hover') {
      router.prefetch(href)
    }
  }, [href, router, strategy])
  
  return (
    <Link 
      href={href}
      onMouseEnter={handleMouseEnter}
      prefetch={strategy === 'viewport'}
    >
      {children}
    </Link>
  )
}
```

---

### Example 4: Service Worker Cache Configuration

```typescript
// public/sw.js

const CACHE_VERSION = 'v3.0.0'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`
const API_CACHE = `api-${CACHE_VERSION}`

// Cache strategies
const cacheStrategies = {
  static: {
    cacheName: STATIC_CACHE,
    handler: 'CacheFirst',
    maxAge: 31536000 // 1 year
  },
  api: {
    cacheName: API_CACHE,
    handler: 'NetworkFirst',
    maxAge: 300 // 5 minutes
  },
  pages: {
    cacheName: DYNAMIC_CACHE,
    handler: 'StaleWhileRevalidate',
    maxAge: 3600 // 1 hour
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)
  
  // Select strategy based on resource type
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request, cacheStrategies.api))
  } else if (url.pathname.match(/\.(js|css|woff2)$/)) {
    event.respondWith(cacheFirst(request, cacheStrategies.static))
  } else {
    event.respondWith(staleWhileRevalidate(request, cacheStrategies.pages))
  }
})
```

---

## Correctness Properties

### Property 1: ISR Cache Freshness

**Universal Quantification:**
```
∀ page ∈ Pages, ∀ time t:
  IF (t - page.lastGenerated) < page.revalidateInterval THEN
    serve(page) returns cached version
  ELSE
    serve(page) generates fresh version AND updates cache
```

**Verification:**
- Test with revalidate = 60s
- Request page at t=0, t=30, t=70
- Verify cache hit at t=30, cache miss at t=70

---

### Property 2: Critical CSS Size Limit

**Universal Quantification:**
```
∀ page ∈ Pages:
  size(extractCriticalCSS(page)) < 14336 bytes (14KB)
```

**Verification:**
- Extract critical CSS for all pages
- Measure byte size of output
- Assert all sizes < 14KB

---

### Property 3: Prefetch Concurrency Limit

**Universal Quantification:**
```
∀ time t during prefetch operation:
  activePrefetchCount(t) ≤ maxConcurrent
```

**Verification:**
- Monitor active prefetch count
- Trigger 10 simultaneous prefetch requests
- Assert active count never exceeds maxConcurrent (3)

---

### Property 4: Cache Strategy Correctness

**Universal Quantification:**
```
∀ request ∈ Requests:
  strategy(request) = 
    CASE request.type OF
      'api' → NetworkFirst
      'static' → CacheFirst
      'page' → StaleWhileRevalidate
    END
```

**Verification:**
- Test requests for each resource type
- Verify correct strategy is applied
- Check cache behavior matches strategy

---

### Property 5: Service Worker Cache Versioning

**Universal Quantification:**
```
∀ deployment d:
  cacheVersion(d) ≠ cacheVersion(d-1) ⟹
    oldCaches(d-1) are deleted AND
    newCaches(d) are created
```

**Verification:**
- Deploy with new cache version
- Verify old caches are deleted
- Verify new caches are created
- Check no stale content served

---

## Error Handling

### Error Scenario 1: ISR Generation Failure

**Condition**: Database connection fails during page generation
**Response**: 
- Return stale cached version if available
- Log error with context
- Schedule retry after 30 seconds
- Display error boundary if no cache available

**Recovery**:
```typescript
try {
  const data = await fetchArticlesFromDatabase()
  return generatePage(data)
} catch (error) {
  console.error('ISR generation failed:', error)
  
  // Fallback to stale cache
  const staleCache = await getStaleCache(request.url)
  if (staleCache) {
    scheduleRetry(request.url, 30000)
    return staleCache
  }
  
  // No cache available - show error page
  return generateErrorPage(500)
}
```

---

### Error Scenario 2: Critical CSS Extraction Timeout

**Condition**: CSS extraction takes > 10 seconds
**Response**:
- Abort extraction process
- Fall back to full CSS loading
- Log timeout warning
- Continue build process

**Recovery**:
```typescript
const extractionPromise = extractCriticalCSS(config)
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Timeout')), 10000)
)

try {
  const criticalCSS = await Promise.race([extractionPromise, timeoutPromise])
  return criticalCSS
} catch (error) {
  console.warn('Critical CSS extraction timeout, using full CSS')
  return null // Fall back to full CSS
}
```

---

### Error Scenario 3: Prefetch Request Failure

**Condition**: Network error during prefetch
**Response**:
- Mark prefetch as failed
- Do not retry automatically
- Log failure for monitoring
- Navigation still works (prefetch is optimization)

**Recovery**:
```typescript
async function prefetchLink(url: string): Promise<void> {
  try {
    await router.prefetch(url)
    markPrefetched(url, 'success')
  } catch (error) {
    console.warn(`Prefetch failed for ${url}:`, error)
    markPrefetched(url, 'failed')
    // Navigation will work normally, just slower
  }
}
```

---

### Error Scenario 4: Service Worker Cache Quota Exceeded

**Condition**: Browser cache storage quota exceeded
**Response**:
- Delete oldest cache entries
- Reduce maxEntries for each cache
- Log quota warning
- Continue with reduced cache

**Recovery**:
```typescript
self.addEventListener('error', async (event) => {
  if (event.error.name === 'QuotaExceededError') {
    console.warn('Cache quota exceeded, cleaning up')
    
    // Delete oldest entries
    const cache = await caches.open(DYNAMIC_CACHE)
    const keys = await cache.keys()
    const oldestKeys = keys.slice(0, Math.floor(keys.length / 2))
    
    await Promise.all(oldestKeys.map(key => cache.delete(key)))
  }
})
```

---

## Testing Strategy

### Unit Testing Approach

**Test Coverage Goals:**
- ISR configuration: 90%
- Critical CSS extraction: 85%
- Prefetch manager: 90%
- Service worker strategies: 95%

**Key Test Cases:**

1. **ISR Revalidation Logic**
```typescript
describe('ISR Revalidation', () => {
  it('should serve cached page within revalidate interval', async () => {
    const page = await generatePage('/en/')
    const cached = await getPage('/en/', { time: Date.now() + 30000 })
    expect(cached).toBe(page)
  })
  
  it('should regenerate page after revalidate interval', async () => {
    const page1 = await generatePage('/en/')
    await sleep(61000) // Wait 61 seconds
    const page2 = await getPage('/en/')
    expect(page2).not.toBe(page1)
  })
})
```

2. **Critical CSS Size Validation**
```typescript
describe('Critical CSS Extraction', () => {
  it('should extract CSS under 14KB', async () => {
    const criticalCSS = await extractCriticalCSS({
      src: 'test-page.html',
      width: 1920,
      height: 1080
    })
    expect(criticalCSS.length).toBeLessThan(14336)
  })
  
  it('should include all above-fold styles', async () => {
    const criticalCSS = await extractCriticalCSS(config)
    expect(criticalCSS).toContain('.hero')
    expect(criticalCSS).toContain('.header')
  })
})
```

3. **Prefetch Concurrency Control**
```typescript
describe('Prefetch Manager', () => {
  it('should respect maxConcurrent limit', async () => {
    const manager = new PrefetchManager({ maxConcurrent: 3 })
    const urls = Array(10).fill(0).map((_, i) => `/page-${i}`)
    
    const activeCounts: number[] = []
    manager.on('activeChange', (count) => activeCounts.push(count))
    
    await manager.prefetchAll(urls)
    
    expect(Math.max(...activeCounts)).toBeLessThanOrEqual(3)
  })
})
```

---

### Property-Based Testing Approach

**Property Test Library**: fast-check (JavaScript/TypeScript)

**Property Tests:**

1. **ISR Cache Consistency**
```typescript
import fc from 'fast-check'

test('ISR cache is consistent across requests', () => {
  fc.assert(
    fc.asyncProperty(
      fc.integer({ min: 0, max: 120 }), // time offset
      async (timeOffset) => {
        const page1 = await getPage('/en/', { time: Date.now() + timeOffset * 1000 })
        const page2 = await getPage('/en/', { time: Date.now() + timeOffset * 1000 })
        
        // Same time = same cached page
        expect(page1).toBe(page2)
      }
    )
  )
})
```

2. **Prefetch Queue Ordering**
```typescript
test('High priority prefetches are processed first', () => {
  fc.assert(
    fc.property(
      fc.array(fc.record({
        url: fc.webUrl(),
        priority: fc.constantFrom('high', 'low')
      })),
      (requests) => {
        const queue = new PrefetchQueue()
        requests.forEach(req => queue.enqueue(req.url, req.priority))
        
        const processed: string[] = []
        while (!queue.isEmpty()) {
          processed.push(queue.dequeue())
        }
        
        // All high priority items should come before low priority
        const highPriorityUrls = requests
          .filter(r => r.priority === 'high')
          .map(r => r.url)
        const firstLowIndex = processed.findIndex(url => 
          !highPriorityUrls.includes(url)
        )
        
        if (firstLowIndex !== -1) {
          const remainingHigh = processed.slice(firstLowIndex)
            .filter(url => highPriorityUrls.includes(url))
          expect(remainingHigh).toHaveLength(0)
        }
      }
    )
  )
})
```

---

### Integration Testing Approach

**Integration Test Scenarios:**

1. **End-to-End ISR Flow**
```typescript
describe('ISR Integration', () => {
  it('should serve cached page and revalidate in background', async () => {
    // First request - generates page
    const response1 = await fetch('http://localhost:3000/en/')
    const html1 = await response1.text()
    const time1 = Date.now()
    
    // Second request within revalidate interval - serves cache
    await sleep(30000) // 30 seconds
    const response2 = await fetch('http://localhost:3000/en/')
    const html2 = await response2.text()
    
    expect(html2).toBe(html1) // Same cached content
    expect(response2.headers.get('x-cache')).toBe('HIT')
    
    // Third request after revalidate interval - regenerates
    await sleep(35000) // Total 65 seconds
    const response3 = await fetch('http://localhost:3000/en/')
    const html3 = await response3.text()
    
    expect(html3).not.toBe(html1) // Fresh content
    expect(response3.headers.get('x-cache')).toBe('MISS')
  })
})
```

2. **Service Worker Cache Strategy**
```typescript
describe('Service Worker Integration', () => {
  it('should apply correct cache strategy per resource type', async () => {
    // Static asset - CacheFirst
    const jsResponse = await fetch('/main.js')
    expect(jsResponse.headers.get('x-cache-strategy')).toBe('CacheFirst')
    
    // API request - NetworkFirst
    const apiResponse = await fetch('/api/articles')
    expect(apiResponse.headers.get('x-cache-strategy')).toBe('NetworkFirst')
    
    // HTML page - StaleWhileRevalidate
    const pageResponse = await fetch('/en/news/article-1')
    expect(pageResponse.headers.get('x-cache-strategy')).toBe('StaleWhileRevalidate')
  })
})
```

---

## Performance Considerations

### Target Metrics

| Metric | Current (Faz 2) | Target (Faz 3) | Improvement |
|--------|-----------------|----------------|-------------|
| Performance Score | 88 | 95+ | +7 points |
| FCP | 1.5s | 1.3s | -200ms |
| LCP | 2.4s | 2.0s | -400ms |
| TBT | 220ms | 150ms | -70ms |
| CLS | 0.09 | 0.05 | -0.04 |
| TTFB | 400ms | 200ms | -200ms |

### Optimization Impact Analysis

**Phase 3A (Quick Wins):**
- ISR: -200ms TTFB, +3 points
- Resource hints: -100ms FCP, +1 point
- Caching headers: -50ms repeat visits, +1 point
- **Total: +5 points, -350ms**

**Phase 3B (Medium Effort):**
- Link prefetching: -300ms navigation, +2 points
- Code splitting: -100KB bundle, -50ms TBT, +1 point
- Service worker: -200ms repeat visits, +1 point
- **Total: +4 points, -550ms**

**Phase 3C (High Effort):**
- Critical CSS: -100ms FCP, -200ms LCP, +2 points
- Image optimization: -100ms LCP, -0.04 CLS, +1 point
- **Total: +3 points, -300ms**

**Combined Impact: +12 points, -1200ms (exceeds target)**

### Performance Budget

```typescript
const performanceBudget = {
  // Bundle sizes
  initialJS: 500, // KB
  initialCSS: 50, // KB
  criticalCSS: 14, // KB
  
  // Timing metrics
  TTFB: 200, // ms
  FCP: 1300, // ms
  LCP: 2000, // ms
  TBT: 150, // ms
  CLS: 0.05,
  
  // Resource counts
  requests: 50,
  domNodes: 1500,
  
  // Cache metrics
  cacheHitRate: 0.8, // 80%
  prefetchSuccessRate: 0.9 // 90%
}
```

---

## Security Considerations

### Security Requirement 1: Cache Poisoning Prevention

**Threat**: Malicious content cached and served to users
**Mitigation**:
- Validate all cached content before serving
- Use cache versioning to invalidate compromised caches
- Implement Content Security Policy (CSP)
- Sign cached responses with HMAC

```typescript
// Cache validation
async function validateCachedContent(content: string): Promise<boolean> {
  const signature = extractSignature(content)
  const expectedSignature = generateHMAC(content, SECRET_KEY)
  return signature === expectedSignature
}
```

---

### Security Requirement 2: Service Worker Security

**Threat**: Malicious service worker hijacking requests
**Mitigation**:
- Serve service worker over HTTPS only
- Implement service worker scope restrictions
- Validate all fetch requests
- Regular service worker updates

```typescript
// Service worker scope restriction
self.addEventListener('install', (event) => {
  // Only cache same-origin resources
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(
        PRECACHE_URLS.filter(url => new URL(url).origin === self.location.origin)
      )
    })
  )
})
```

---

### Security Requirement 3: Prefetch Privacy

**Threat**: Prefetching leaks user browsing intent
**Mitigation**:
- Respect user privacy settings
- Implement prefetch opt-out
- No prefetch for sensitive pages
- Clear prefetch cache on logout

```typescript
// Privacy-aware prefetching
function shouldPrefetch(url: string): boolean {
  // Check user privacy settings
  if (!userSettings.allowPrefetch) return false
  
  // Don't prefetch sensitive pages
  if (url.includes('/admin') || url.includes('/account')) return false
  
  // Respect Do Not Track
  if (navigator.doNotTrack === '1') return false
  
  return true
}
```

---

## Dependencies

### Required Packages

```json
{
  "dependencies": {
    "next": "^14.0.0",
    "@ducanh2912/next-pwa": "^9.0.0"
  },
  "devDependencies": {
    "critical": "^6.0.0",
    "plaiceholder": "^3.0.0",
    "sharp": "^0.33.0",
    "@next/bundle-analyzer": "^14.0.0",
    "fast-check": "^3.15.0"
  }
}
```

### External Services

- **CDN**: Cloudflare or Akamai (optional, for edge caching)
- **Monitoring**: Lighthouse CI, WebPageTest
- **Analytics**: Google Analytics 4 (already integrated)

### Browser Compatibility

- **Service Workers**: Chrome 40+, Firefox 44+, Safari 11.1+, Edge 17+
- **Intersection Observer**: Chrome 51+, Firefox 55+, Safari 12.1+, Edge 15+
- **Cache API**: Chrome 40+, Firefox 41+, Safari 11.1+, Edge 17+

---

## Implementation Phases

### Phase 3A: Quick Wins (1-2 hours)

**Tasks:**
1. Add ISR configuration to homepage and article pages
2. Implement resource hints (preload, preconnect)
3. Configure caching headers in next.config.js
4. Test and verify improvements

**Expected Impact:** +5 performance points

---

### Phase 3B: Medium Effort (2-4 hours)

**Tasks:**
1. Implement link prefetching component
2. Add advanced code splitting for heavy components
3. Optimize service worker cache strategies
4. Test and verify improvements

**Expected Impact:** +4 performance points

---

### Phase 3C: High Effort (4-6 hours)

**Tasks:**
1. Extract and inline critical CSS
2. Implement image optimization with blur placeholders
3. Fine-tune all optimizations
4. Comprehensive testing and validation

**Expected Impact:** +3 performance points

---

## Success Criteria

- [x] Design document completed
- [ ] Phase 3A implemented and tested
- [ ] Phase 3B implemented and tested
- [ ] Phase 3C implemented and tested
- [ ] Lighthouse Performance Score ≥ 95
- [ ] LCP < 2.0s (Google "Good" threshold)
- [ ] TBT < 150ms
- [ ] FCP < 1.3s
- [ ] CLS < 0.05
- [ ] No visual regressions
- [ ] All functionality working
- [ ] Analytics tracking intact
- [ ] Cross-browser testing passed
- [ ] Mobile performance validated

---

**Document Version**: 1.0.0  
**Last Updated**: March 21, 2026  
**Status**: Ready for Implementation  
**Next Step**: Begin Phase 3A Implementation
