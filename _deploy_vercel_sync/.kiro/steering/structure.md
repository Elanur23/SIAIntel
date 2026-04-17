# Project Structure

## Directory Organization

```
professional-news-portal/
├── app/                    # Next.js 14 App Router
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API route handlers
│   ├── legal/             # Legal pages (privacy, terms, etc.)
│   ├── news/              # News article pages
│   ├── feed/              # RSS feed routes
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Homepage
├── components/            # React components
├── lib/                   # Business logic & utilities
├── public/                # Static assets
├── docs/                  # Documentation
├── config/                # Configuration files
└── .kiro/                 # Kiro AI settings
    └── steering/          # AI steering rules
```

## Key Directories

### `/app` - Next.js App Router
- **admin/**: Admin dashboard with feature-specific pages (SEO, analytics, AI editor, etc.)
- **api/**: RESTful API routes organized by feature
  - Each feature has its own folder with related endpoints
  - Example: `api/seo/analyze/`, `api/ai-editor/generate/`
- **legal/**: Legal compliance pages (privacy policy, terms, DMCA, etc.)
- **news/[slug]/**: Dynamic news article pages
- **feed/**: RSS feed generation routes

### `/components` - React Components
Reusable UI components:
- `AdBanner.tsx` - AdSense integration
- `AIComments.tsx` - AI-powered comment system
- `AIChatbot.tsx` - Intelligent chatbot
- `SEOLayout.tsx` - SEO wrapper component
- `StructuredData.tsx` - Schema markup component
- `Header.tsx`, `Footer.tsx` - Layout components
- Feature-specific components (PushSubscription, CookieConsent, etc.)

### `/lib` - Business Logic
Core functionality organized by feature:
- **AI Systems**: `ai-editor.ts`, `ai-chatbot-intelligence.ts`, `ai-model-router.ts`
- **SEO**: `seo-optimizer.ts`, `schema-generator.ts`, `sitemap-generator.ts`
- **Analytics**: `google-analytics-4.ts`, `google-search-console.ts`
- **Revenue**: `advertising-management-system.ts`, `affiliate-intelligence-system.ts`, `high-cpc-keyword-intelligence.ts`
- **Content**: `semantic-interlinking.ts`, `auto-semantic-interlinking.ts`, `content-proof-system.ts`
- **Intelligence**: `brightedge-intelligence-platform.ts`, `conductor-intelligence-platform.ts`, `moz-intelligence-analyzer.ts`
- **Utilities**: `utils.ts`, `database.ts`, `api.ts`, `auth.ts`

### `/public` - Static Assets
- Service workers: `sw.js`, `push-worker.js`
- Tracking scripts: `affiliate-tracking.js`, `data-tracker.js`
- Configuration: `robots.txt`, `site.webmanifest`
- RSS feeds: `feed.xml`

### `/docs` - Documentation
Comprehensive documentation for all features:
- System documentation (e.g., `AI-CHATBOT.md`, `SEO-OPTIMIZER.md`)
- Quickstart guides (e.g., `PUSH-NOTIFICATIONS-QUICKSTART.md`)
- Comparison documents (e.g., `GA4-COMPARISON.md`)
- Task completion records (e.g., `TASK-XX-FEATURE-COMPLETE.md`)

## File Naming Conventions

### Components
- PascalCase: `AIComments.tsx`, `PushSubscription.tsx`
- Descriptive names indicating purpose

### Library Files
- kebab-case: `ai-editor.ts`, `google-analytics-4.ts`
- Feature-based naming

### API Routes
- Folder structure: `app/api/[feature]/[action]/route.ts`
- Always named `route.ts` (Next.js convention)

### Pages
- Folder structure: `app/[route]/page.tsx`
- Always named `page.tsx` (Next.js convention)

## Import Patterns

### Path Aliases
- `@/` maps to project root
- Example: `import { seoOptimizer } from '@/lib/seo-optimizer'`

### Common Imports
```typescript
// Next.js
import { NextRequest, NextResponse } from 'next/server'

// Components
import ComponentName from '@/components/ComponentName'

// Libraries
import { functionName } from '@/lib/library-name'

// Utilities
import { cn, formatDate } from '@/lib/utils'
```

## Code Organization Principles

1. **Feature-based**: Group related functionality together
2. **Separation of Concerns**: UI (components), logic (lib), routes (app)
3. **Reusability**: Shared utilities in `/lib/utils.ts`
4. **Type Safety**: TypeScript interfaces and types defined near usage
5. **API Structure**: RESTful endpoints with clear HTTP methods (GET, POST, PUT, DELETE)
