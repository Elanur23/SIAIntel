# Structured Data Implementation for Google News

This document outlines the comprehensive structured data implementation for the US News website, specifically optimized for Google News and search engine visibility.

## 🎯 Overview

Our structured data system implements Schema.org markup with a focus on:
- **NewsArticle** schema for individual articles
- **BreadcrumbList** schema for navigation
- **NewsMediaOrganization** schema for publisher information
- **WebSite** schema for site-wide information
- Dynamic injection for both Next.js and static HTML pages

## 📋 Schema Types Implemented

### 1. NewsArticle Schema
Enhanced for Google News compliance with:
- **Speakable content** for voice assistants
- **Dateline** information for location context
- **Associated media** for images and videos
- **Publisher verification** with ethics policies
- **Content accessibility** indicators
- **Fact-checking** and correction policies

```json
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Article Title",
  "description": "Article excerpt",
  "image": {
    "@type": "ImageObject",
    "url": "image-url",
    "width": 1200,
    "height": 630
  },
  "author": {
    "@type": "Person",
    "name": "Author Name",
    "url": "author-page-url"
  },
  "publisher": {
    "@type": "NewsMediaOrganization",
    "name": "US News Today",
    "logo": { ... },
    "publishingPrinciples": "editorial-guidelines-url",
    "ethicsPolicy": "ethics-policy-url"
  },
  "datePublished": "2026-02-01T10:30:00Z",
  "dateModified": "2026-02-01T10:30:00Z",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".article-headline", ".article-summary"]
  },
  "dateline": "Washington D.C., February 1, 2026"
}
```

### 2. BreadcrumbList Schema
Dynamic breadcrumb generation based on page type:

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": {
        "@type": "WebPage",
        "@id": "https://site.com/",
        "name": "Home",
        "url": "https://site.com/"
      }
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Business",
      "item": {
        "@type": "WebPage",
        "@id": "https://site.com/category/business",
        "name": "Business",
        "url": "https://site.com/category/business"
      }
    }
  ]
}
```

### 3. NewsMediaOrganization Schema
Comprehensive publisher information for Google News:

```json
{
  "@context": "https://schema.org",
  "@type": "NewsMediaOrganization",
  "name": "US News Today",
  "url": "https://your-news-site.com",
  "logo": { ... },
  "publishingPrinciples": "editorial-guidelines-url",
  "diversityPolicy": "diversity-policy-url",
  "ethicsPolicy": "ethics-policy-url",
  "correctionsPolicy": "corrections-policy-url",
  "verificationFactCheckingPolicy": "fact-checking-url",
  "areaServed": {
    "@type": "Country",
    "name": "United States"
  },
  "knowsAbout": [
    "Breaking News",
    "US Politics",
    "Business News",
    "Technology"
  ]
}
```

## 🔧 Implementation Components

### 1. Schema Generator (`lib/schema-generator.ts`)
Core service for generating structured data:

```typescript
import { schemaGenerator } from '@/lib/schema-generator'

// Generate Google News optimized schema
const schema = schemaGenerator.generateGoogleNewsSchema(article, {
  isBreaking: true,
  liveBlog: false,
  speakable: true,
  dateline: "Washington D.C., February 1, 2026",
  associatedMedia: [
    {
      type: 'image',
      url: 'image-url',
      caption: 'Image caption'
    }
  ]
})
```

### 2. React Components (`components/StructuredData.tsx`)
Dynamic structured data injection for Next.js:

```tsx
import { ArticleStructuredData } from '@/components/StructuredData'

// In article page component
<ArticleStructuredData
  article={article}
  isBreaking={true}
  liveBlog={false}
  associatedMedia={mediaArray}
  faqs={faqArray}
  video={videoData}
/>
```

### 3. HTML Schema Injector (`lib/html-schema-injector.ts`)
For static HTML files:

```typescript
import { htmlSchemaInjector } from '@/lib/html-schema-injector'

// Update HTML file with structured data
await htmlSchemaInjector.updateHTMLFile('news/article.html', {
  article: articleData,
  isBreaking: true,
  associatedMedia: mediaArray
})
```

## 📊 Google News Optimization Features

### 1. Speakable Content
Marks content suitable for voice assistants:
```json
"speakable": {
  "@type": "SpeakableSpecification",
  "cssSelector": [
    ".article-headline",
    ".article-summary", 
    ".article-content p:first-of-type"
  ]
}
```

### 2. Dateline Information
Provides location and date context:
```json
"dateline": "Washington D.C., February 1, 2026"
```

### 3. Publisher Verification
Comprehensive publisher information:
```json
"publisher": {
  "@type": "NewsMediaOrganization",
  "publishingPrinciples": "editorial-guidelines-url",
  "diversityPolicy": "diversity-policy-url",
  "ethicsPolicy": "ethics-policy-url",
  "correctionsPolicy": "corrections-policy-url"
}
```

### 4. Content Classification
```json
"genre": "Breaking News",
"articleSection": "Business",
"about": [
  {
    "@type": "Thing",
    "name": "Federal Reserve"
  }
]
```

## 🚀 Dynamic Implementation

### Next.js Pages
Automatic structured data injection:

```tsx
// app/news/[slug]/page.tsx
export default async function ArticlePage({ params }) {
  const article = await getArticleBySlug(params.slug)
  
  return (
    <>
      <ArticleStructuredData
        article={article}
        isBreaking={article.isBreaking}
        liveBlog={false}
        speakable={true}
      />
      {/* Article content */}
    </>
  )
}
```

### Static HTML Files
Automated schema injection:

```html
<!-- Automatically injected structured data -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "NewsArticle",
  "headline": "Article Title",
  ...
}
</script>
```

## 📈 SEO Benefits

### 1. Google News Inclusion
- Proper NewsMediaOrganization schema
- Editorial guidelines and policies
- Fact-checking verification
- Content accessibility indicators

### 2. Rich Snippets
- Article headlines and descriptions
- Author information and images
- Publication dates and updates
- Reading time estimates

### 3. Voice Search Optimization
- Speakable content markup
- Clear content structure
- FAQ schema for common questions

### 4. Enhanced Search Results
- Breadcrumb navigation
- Publisher information
- Article categorization
- Related content suggestions

## 🔍 Validation and Testing

### Google Tools
1. **Rich Results Test**: Test individual URLs
2. **Search Console**: Monitor rich results performance
3. **Google News Publisher Center**: Submit for Google News inclusion

### Validation Commands
```bash
# Test structured data
curl -s "https://search.google.com/test/rich-results?url=YOUR_URL"

# Validate schema
npx schema-dts validate schema.json

# Test with Google's tool
https://search.google.com/test/rich-results
```

### Schema Validation
```javascript
// Validate generated schema
const schema = schemaGenerator.generateGoogleNewsSchema(article)
console.log('Schema validation:', validateSchema(schema))
```

## 📋 Implementation Checklist

### ✅ Basic Requirements
- [x] NewsArticle schema implemented
- [x] BreadcrumbList schema implemented
- [x] NewsMediaOrganization schema implemented
- [x] WebSite schema implemented

### ✅ Google News Requirements
- [x] Publisher verification policies
- [x] Editorial guidelines linked
- [x] Fact-checking policy linked
- [x] Corrections policy linked
- [x] Diversity policy linked
- [x] Ethics policy linked

### ✅ Technical Implementation
- [x] Dynamic schema generation
- [x] React component integration
- [x] HTML file injection
- [x] Sitemap integration
- [x] Meta tag optimization

### ✅ Content Optimization
- [x] Speakable content markup
- [x] Dateline information
- [x] Associated media support
- [x] FAQ schema support
- [x] Video schema support

## 🛠️ Usage Examples

### Article Page
```tsx
import { ArticleStructuredData } from '@/components/StructuredData'

export default function ArticlePage({ article }) {
  return (
    <>
      <ArticleStructuredData
        article={article}
        isBreaking={article.category === 'breaking-news'}
        associatedMedia={[
          {
            type: 'image',
            url: article.featuredImage.url,
            caption: article.featuredImage.alt,
            width: 1200,
            height: 630
          }
        ]}
        faqs={[
          {
            question: "What does this rate cut mean?",
            answer: "The rate cut is designed to stimulate economic growth..."
          }
        ]}
      />
      
      <article>
        <h1 className="article-headline">{article.title}</h1>
        <p className="article-summary">{article.excerpt}</p>
        <div className="article-content">
          {article.content}
        </div>
      </article>
    </>
  )
}
```

### Category Page
```tsx
import { CategoryStructuredData } from '@/components/StructuredData'

export default function CategoryPage({ category, articles }) {
  return (
    <>
      <CategoryStructuredData
        category={category}
        articles={articles}
        description={`Latest ${category} news and updates`}
      />
      
      <div>
        <h1>{category} News</h1>
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </>
  )
}
```

### Homepage
```tsx
import { HomepageStructuredData } from '@/components/StructuredData'

export default function Homepage({ featuredArticles, breakingNews }) {
  return (
    <>
      <HomepageStructuredData
        featuredArticles={featuredArticles}
        breakingNews={breakingNews}
      />
      
      <main>
        <section>
          <h2>Breaking News</h2>
          {breakingNews.map(article => (
            <BreakingNewsCard key={article.id} article={article} />
          ))}
        </section>
        
        <section>
          <h2>Featured Stories</h2>
          {featuredArticles.map(article => (
            <FeaturedCard key={article.id} article={article} />
          ))}
        </section>
      </main>
    </>
  )
}
```

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_SITE_URL=https://your-news-site.com
GOOGLE_NEWS_PUBLICATION_NAME=US News Today
GOOGLE_ANALYTICS_ID=GA_MEASUREMENT_ID
GOOGLE_ADSENSE_ID=ca-pub-xxxxxxxxxx
```

### Schema Configuration
```typescript
// lib/schema-config.ts
export const schemaConfig = {
  siteName: 'US News Today',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL,
  logoUrl: '/logo.png',
  publisherPolicies: {
    editorial: '/editorial-guidelines',
    ethics: '/ethics-policy',
    diversity: '/diversity-policy',
    corrections: '/corrections-policy',
    factChecking: '/fact-checking'
  }
}
```

## 📊 Performance Monitoring

### Key Metrics
1. **Rich Results Impressions**: Track in Search Console
2. **Click-through Rates**: Monitor article CTR
3. **Google News Traffic**: Analyze referral traffic
4. **Schema Validation**: Regular validation checks

### Monitoring Tools
```javascript
// Monitor schema performance
const monitorSchema = () => {
  // Track rich results impressions
  gtag('event', 'rich_result_impression', {
    'schema_type': 'NewsArticle',
    'article_id': article.id
  })
}
```

## 🚨 Troubleshooting

### Common Issues
1. **Schema Validation Errors**: Check JSON syntax
2. **Missing Required Fields**: Verify all required properties
3. **Image Issues**: Ensure proper image dimensions
4. **Publisher Verification**: Link all required policies

### Debug Tools
```javascript
// Debug schema generation
const debugSchema = (schema) => {
  console.log('Generated Schema:', JSON.stringify(schema, null, 2))
  
  // Validate required fields
  const required = ['@context', '@type', 'headline', 'author', 'publisher']
  required.forEach(field => {
    if (!schema[field]) {
      console.error(`Missing required field: ${field}`)
    }
  })
}
```

This comprehensive structured data implementation ensures optimal Google News compatibility and enhanced search engine visibility for the US News website.