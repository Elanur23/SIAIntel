# Phase 4D: Security Layer Implementation Plan

## API Route Security Categorization

### Total Routes: 76 API endpoints

### Security Tiers

#### 🔴 STRICT (5 req/15min) - Authentication & Destructive Operations
**Count**: 7 routes
- `app/api/admin/login/route.ts` - Already has rate limiting ✅
- `app/api/admin/logout/route.ts`
- `app/api/admin/backfill-multilingual/route.ts`
- `app/api/admin/normalize-workspace/route.ts`
- `app/api/admin/sync-workspace/route.ts`
- `app/api/war-room/wipe/route.ts` - Destructive operation
- `app/api/upload/route.ts` - File upload abuse risk

#### 🟡 MODERATE (30 req/min) - AI Generation & Heavy Operations
**Count**: 20 routes
- `app/api/ai/generate/route.ts`
- `app/api/ai/adsense-content/route.ts`
- `app/api/ai/fallback/route.ts`
- `app/api/sia-news/generate/route.ts`
- `app/api/sia-gemini/process/route.ts`
- `app/api/generate-image/route.ts`
- `app/api/ghost-editor/route.ts`
- `app/api/translate/route.ts`
- `app/api/tts/generate/route.ts`
- `app/api/deep-intelligence/route.ts`
- `app/api/seo-architect/route.ts`
- `app/api/seo-intelligence/route.ts`
- `app/api/eeat-protocols/enhance/route.ts`
- `app/api/intelligence/save/route.ts`
- `app/api/war-room/save/route.ts`
- `app/api/war-room/publish-breaking/route.ts`
- `app/api/distribution/telegram/publish/route.ts`
- `app/api/sia-news/batch-index/route.ts`
- `app/api/sia-news/index-google/route.ts`
- `app/api/signals/scan/route.ts`

#### 🟢 PUBLIC (60 req/min) - Read Operations & Public APIs
**Count**: 49 routes
- `app/api/comments/route.ts`
- `app/api/newsletter/subscribe/route.ts`
- `app/api/og/route.ts`
- `app/api/news/route.ts`
- `app/api/news/list/route.ts`
- `app/api/news/multi-source/route.ts`
- `app/api/market-data/route.ts`
- `app/api/market-data/live/route.ts`
- `app/api/content-buffer/route.ts`
- `app/api/featured-articles/route.ts`
- `app/api/global-content/route.ts`
- `app/api/war-room/content/route.ts`
- `app/api/war-room/feed/route.ts`
- `app/api/war-room/refresh-rss/route.ts`
- `app/api/war-room/workspace/route.ts`
- `app/api/war-room/mark-published/route.ts`
- `app/api/distribution/status/route.ts`
- `app/api/distribution/jobs/route.ts`
- `app/api/distribution/autonomous/suggestions/route.ts`
- `app/api/distribution/autonomous/approve/route.ts`
- `app/api/distribution/autonomous/reject/route.ts`
- `app/api/distribution/telegram/status/route.ts`
- `app/api/distribution/telegram/test/route.ts`
- `app/api/distribution/telegram/validate/route.ts`
- `app/api/sovereign-core/status/route.ts`
- `app/api/sovereign-core/intelligence/route.ts`
- `app/api/sovereign-core/published/route.ts`
- `app/api/sovereign-core/scheduler/route.ts`
- `app/api/sovereign-core/start/route.ts`
- `app/api/sovereign-core/stop/route.ts`
- `app/api/sovereign-core/trigger/route.ts`
- `app/api/whale-alert/route.ts`
- `app/api/whale-autopilot/route.ts`
- `app/api/sia-news/articles/route.ts`
- `app/api/sia-news/audio/route.ts`
- `app/api/sia-news/live-blog/route.ts`
- `app/api/sia-news/metrics/route.ts`
- `app/api/sia-news/scheduler/route.ts`
- `app/api/sia-news/schema/route.ts`
- `app/api/sia-news/ssml/route.ts`
- `app/api/sia-news/webhook/route.ts`
- `app/api/siaintel/proxy/route.ts`
- `app/api/factory/feed/route.ts`
- `app/api/flash-radar/route.ts`
- `app/api/drip-scheduler/route.ts`
- `app/api/interlinking/auto-link/route.ts`
- `app/api/revenue/optimize/route.ts`
- `app/api/sealed-depth/route.ts`
- `app/api/discord/test/route.ts`
- `app/api/revalidate/route.ts`

#### ⚠️ SEO ROUTES (DO NOT MODIFY - IMMUTABLE)
**Count**: 2 routes (excluded from security layer)
- `app/api/seo/generate-schema/route.ts` - SEO system
- `app/api/seo/news-sitemap/route.ts` - SEO system

## Implementation Strategy

### Approach: Middleware Wrapper Pattern

Instead of modifying each route file, we'll use Next.js middleware to intercept API requests and apply security checks.

### Files to Create/Modify

1. **middleware.ts** (modify existing)
   - Add API route security checks
   - Apply rate limiting based on path
   - Add CORS headers

2. **lib/security/api-security-config.ts** (new)
   - Route-to-tier mapping
   - Security configuration

### CORS Configuration

```typescript
Allowed Origins:
- https://siaintel.com
- https://www.siaintel.com
- http://localhost:3000 (development only)
- Environment variable: ALLOWED_ORIGINS

Allowed Methods:
- GET, POST, PUT, DELETE, OPTIONS

Allowed Headers:
- Content-Type, Authorization, X-API-Key
```

### Rate Limiting Configuration

```typescript
Tiers:
- strict: 5 requests per 15 minutes
- moderate: 30 requests per minute
- public: 60 requests per minute

Storage: In-memory (already implemented)
Identifier: IP address (x-forwarded-for, x-real-ip, x-vercel-forwarded-for)
```

## Implementation Steps

### Step 1: Create Route Configuration
Map all routes to security tiers

### Step 2: Update Middleware
Add API security checks to existing middleware

### Step 3: Test Critical Paths
- ✅ Telegram sandbox still works
- ✅ Autonomous assistant still works
- ✅ Public article pages unaffected
- ✅ Admin login still works

### Step 4: Verification
- Rate limiting enforced
- CORS headers correct
- No legitimate traffic blocked
- Error responses clear

## Risk Mitigation

### Zero Impact on Public Site
- Middleware only affects `/api/*` routes
- Public pages (`/[lang]/*`) unchanged
- SEO routes excluded
- Article rendering unaffected

### Graceful Degradation
- Rate limit errors return 429 with retry-after
- CORS errors return 403 with clear message
- Existing functionality preserved

### Rollback Plan
If issues occur:
1. Revert middleware.ts changes
2. System returns to current state
3. No data loss, no breaking changes

## Success Criteria

- [ ] All 76 API routes have rate limiting
- [ ] CORS headers on all API responses
- [ ] Telegram sandbox functional
- [ ] Autonomous assistant functional
- [ ] Public site unaffected
- [ ] SEO routes untouched
- [ ] Build passes
- [ ] No console errors

---

**Next**: Implement the security layer
