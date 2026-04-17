# Code Conventions & Patterns

## TypeScript Standards

### Strict Mode
- TypeScript strict mode is enabled
- All functions should have explicit return types
- Avoid `any` type - use proper typing or `unknown`

### Type Definitions
```typescript
// Define interfaces for data structures
export interface NewsArticle {
  id: string
  title: string
  content: string
  // ... other fields
}

// Use type for unions and utilities
export type ArticleStatus = 'draft' | 'published' | 'archived'
```

## API Route Patterns

### Standard Structure
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { validateApiKey, rateLimitCheck } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    // 1. API key validation
    const apiKey = request.headers.get('x-api-key')
    if (!validateApiKey(apiKey)) {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      )
    }

    // 2. Rate limiting
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await rateLimitCheck(clientIp, 'endpoint-name')
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', resetTime: rateLimitResult.resetTime },
        { status: 429 }
      )
    }

    // 3. Parse and validate request body
    const body = await request.json()
    
    // 4. Business logic
    const result = await performOperation(body)

    // 5. Return success response
    return NextResponse.json({
      success: true,
      data: result,
      metadata: {
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Operation error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: 'Operation failed',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}
```

### HTTP Methods
- `GET` - Retrieve data (no body)
- `POST` - Create new resources
- `PUT` - Update/bulk operations
- `DELETE` - Remove resources

## Error Handling

### Consistent Error Responses
```typescript
// Client errors (4xx)
return NextResponse.json(
  { error: 'Descriptive error message' },
  { status: 400 } // or 401, 404, 429, etc.
)

// Server errors (5xx)
return NextResponse.json(
  {
    success: false,
    error: 'Operation failed',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined
  },
  { status: 500 }
)
```

### Logging
- Use `console.log()` for operation start/completion
- Use `console.error()` for errors with context
- Include relevant identifiers (IDs, titles, etc.)

## Async/Await Patterns

### Always Use Try-Catch
```typescript
try {
  const result = await asyncOperation()
  return result
} catch (error) {
  console.error('Operation failed:', error)
  throw error // or handle gracefully
}
```

### Parallel Operations
```typescript
// Use Promise.all for independent operations
const [result1, result2, result3] = await Promise.all([
  operation1(),
  operation2(),
  operation3()
])
```

## Component Patterns

### Functional Components
```typescript
import { FC } from 'react'

interface ComponentProps {
  title: string
  onAction?: () => void
}

const Component: FC<ComponentProps> = ({ title, onAction }) => {
  return (
    <div className="container">
      <h1>{title}</h1>
    </div>
  )
}

export default Component
```

### Styling with Tailwind
- Use utility classes directly in JSX
- Use `cn()` helper from `@/lib/utils` for conditional classes
```typescript
import { cn } from '@/lib/utils'

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === 'primary' && "primary-classes"
)}>
```

## Database Patterns

### Mock Database (Current)
- Uses in-memory Map structures
- All operations are async (for future real DB migration)
- Returns proper types

### CRUD Operations
```typescript
// Create
const id = await saveArticle(article)

// Read
const article = await getArticleById(id)
const articles = await getArticles({ status: 'published', limit: 10 })

// Update
await updateArticle(id, { title: 'New Title' })

// Delete
await deleteArticle(id)
```

## Utility Functions

### Common Utilities in `/lib/utils.ts`
- `cn()` - Merge Tailwind classes
- `generateSlug()` - Create URL-friendly slugs
- `truncateText()` - Truncate with ellipsis
- `formatDate()` - Locale-aware date formatting
- `sanitizeHtml()` - Basic HTML sanitization
- `debounce()`, `throttle()` - Performance utilities

### Use Existing Utilities
Before creating new utility functions, check if one already exists in `utils.ts`

## SEO & Performance

### Image Optimization
```typescript
// Use Next.js Image component
import Image from 'next/image'

<Image
  src={imageUrl}
  alt="Descriptive alt text"
  width={800}
  height={400}
  priority={isFeatured}
/>
```

### Metadata
```typescript
// In page.tsx files
export const metadata = {
  title: 'Page Title',
  description: 'Page description',
  openGraph: { /* ... */ },
  twitter: { /* ... */ }
}
```

## Integration Patterns

### AI Integration
- Always include humanization step for AI-generated content
- Check copyright safety before publishing
- Calculate originality scores
- Log generation metadata

### Analytics Integration
- Track important user actions
- Include metadata in tracking calls
- Handle analytics failures gracefully (don't block user flow)

### Third-Party Services
- Always wrap in try-catch
- Provide fallbacks for failures
- Log errors but don't expose to users
- Use environment variables for API keys

## Comments & Documentation

### When to Comment
- Complex business logic
- Non-obvious algorithms
- Important security considerations
- API integration details

### JSDoc for Public Functions
```typescript
/**
 * Analyzes content for SEO optimization
 * @param article - The article to analyze
 * @param targetKeywords - Optional keywords to target
 * @returns SEO analysis with score and recommendations
 */
export async function analyzeContent(
  article: NewsArticle,
  targetKeywords?: string[]
): Promise<SEOAnalysis> {
  // Implementation
}
```

## Testing Considerations

### Current State
- No formal test suite yet
- Manual testing via API endpoints
- Development mode error details enabled

### Future Testing
- Unit tests for utilities
- Integration tests for API routes
- E2E tests for critical user flows
