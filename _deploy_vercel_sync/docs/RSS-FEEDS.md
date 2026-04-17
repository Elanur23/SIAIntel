# RSS Feed System for Google News Compliance

This document outlines the comprehensive RSS feed implementation for the US News website, specifically designed for Google News acceptance and optimal syndication.

## 🎯 Overview

Our RSS feed system provides multiple feed formats and categories to ensure maximum compatibility with Google News, RSS aggregators, and syndication services.

### Key Features
- **Google News Compliant** RSS feeds
- **Multiple feed formats** (RSS 2.0, Atom)
- **Category-specific feeds** for targeted content
- **Breaking news feeds** with priority updates
- **Dynamic generation** with automatic updates
- **Static fallback feeds** for reliability

## 📋 Feed Structure

### Main Feeds
| Feed Type | URL | Description | Update Frequency |
|-----------|-----|-------------|------------------|
| **Main RSS** | `/feed.xml` | Primary RSS feed with latest articles | Every hour |
| **Alternative RSS** | `/rss.xml` | Alternative RSS endpoint | Every hour |
| **Atom Feed** | `/atom.xml` | Atom 1.0 format feed | Every hour |
| **Breaking News** | `/feed/breaking.xml` | Breaking news only | Every 15 minutes |
| **Google News** | `/feed/google-news.xml` | Google News optimized | Every 15 minutes |

### Category Feeds
| Category | URL | Description |
|----------|-----|-------------|
| Politics | `/feed/politics` | Political news and analysis |
| Business | `/feed/business` | Business and economic news |
| Sports | `/feed/sports` | Sports news and updates |
| Technology | `/feed/technology` | Tech industry news |
| Entertainment | `/feed/entertainment` | Entertainment and celebrity news |
| Health | `/feed/health` | Health and medical news |
| Science | `/feed/science` | Science and research news |
| World | `/feed/world` | International news |
| Weather | `/feed/weather` | Weather updates and alerts |
| Crime | `/feed/crime` | Crime and law enforcement |
| Local | `/feed/local` | Local and regional news |

## 🚀 Implementation

### RSS Generator (`lib/rss-generator.ts`)
Core service for generating RSS feeds:

```typescript
import { rssGenerator } from '@/lib/rss-generator'

// Generate main RSS feed
const mainFeed = await rssGenerator.generateMainFeed(50)

// Generate category-specific feed
const businessFeed = await rssGenerator.generateCategoryFeed('business', 30)

// Generate Google News feed
const googleNewsFeed = await rssGenerator.generateGoogleNewsFeed(100)

// Generate breaking news feed
const breakingFeed = await rssGenerator.generateBreakingNewsFeed(20)
```

### Dynamic RSS Service (`lib/dynamic-rss.ts`)
Automatic feed updates:

```typescript
import { dynamicRSS } from '@/lib/dynamic-rss'

// Trigger feed updates when article is published
await dynamicRSS.onArticlePublished(article)

// Regenerate all feeds
await dynamicRSS.regenerateFeeds()

// Generate static backup feeds
await dynamicRSS.generateStaticFeeds()
```

### Next.js API Routes
Dynamic feed generation:

```typescript
// app/feed.xml/route.ts
export async function GET() {
  const rssXML = await rssGenerator.generateMainFeed(50)
  return new NextResponse(rssXML, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  })
}
```

## 📊 Google News Compliance

### Required Elements
Our RSS feeds include all Google News requirements:

#### Channel Elements
- `<title>` - Feed title
- `<description>` - Feed description
- `<link>` - Website URL
- `<language>` - Content language (en-US)
- `<copyright>` - Copyright notice
- `<managingEditor>` - Editorial contact
- `<webMaster>` - Technical contact
- `<pubDate>` - Publication date
- `<lastBuildDate>` - Last update
- `<category>` - Content category
- `<generator>` - RSS generator info
- `<ttl>` - Time to live (60 minutes)
- `<image>` - Feed logo/image

#### Item Elements
- `<title>` - Article headline
- `<description>` - Article summary
- `<content:encoded>` - Full article content
- `<link>` - Article URL
- `<guid>` - Unique identifier
- `<pubDate>` - Publication date
- `<author>` - Article author
- `<category>` - Article category
- `<source>` - Source attribution
- `<enclosure>` - Media attachments

### Google News Specific Features

#### Enhanced Metadata
```xml
<item>
  <title><![CDATA[Article Title]]></title>
  <description><![CDATA[Article summary under 200 characters]]></description>
  <link>https://site.com/news/article-slug</link>
  <guid isPermaLink="true">https://site.com/news/article-slug</guid>
  <pubDate>Sat, 01 Feb 2026 10:30:00 GMT</pubDate>
  <author><![CDATA[Author Name]]></author>
  <category><![CDATA[Category Name]]></category>
  <source url="https://site.com/feed.xml">US News Today</source>
  <georss:featurename>Location</georss:featurename>
</item>
```

#### Media Content
```xml
<media:content url="image-url" type="image/jpeg" medium="image" width="1200" height="630">
  <media:title><![CDATA[Image Title]]></media:title>
  <media:description><![CDATA[Image Description]]></media:description>
</media:content>
```

#### Geographic Information
```xml
<georss:featurename>Washington D.C.</georss:featurename>
```

## 🔄 Automatic Updates

### Database Integration
RSS feeds automatically update when:

```typescript
// When article is published
await saveArticle({ ...article, status: 'published' })
// ↑ Automatically triggers RSS update

// When article is updated
await updateArticle(articleId, updates)
// ↑ Automatically triggers RSS update

// When article is deleted
await deleteArticle(articleId)
// ↑ Automatically triggers RSS update
```

### AI Editor Integration
```typescript
// AI-generated articles automatically update RSS
const article = await aiEditor.generateNews(prompt)
await saveArticle({ ...article, status: 'published' })
// ↑ RSS feeds update automatically
```

### Scheduled Updates
```typescript
// Automatic regeneration every 30 minutes
dynamicRSS.startScheduledRegeneration()
```

## 📈 Feed Optimization

### Performance Features
- **Caching**: 1-hour cache for main feeds, 15-minute for breaking news
- **Compression**: Gzip compression for faster delivery
- **CDN Ready**: Static feeds for CDN distribution
- **Error Handling**: Graceful fallback feeds on errors

### Content Optimization
- **Character Limits**: Descriptions under 200 characters for Google News
- **Image Optimization**: Proper media tags with dimensions
- **Location Data**: Geographic information where available
- **Clean HTML**: Sanitized content without scripts or styles

### SEO Benefits
- **Discoverability**: Multiple feed formats for different aggregators
- **Indexing**: Faster content discovery by search engines
- **Syndication**: Wide distribution through RSS networks
- **Authority**: Proper attribution and source links

## 🛠️ Management API

### RSS Management Endpoint
```bash
# Trigger RSS regeneration
POST /api/rss/manage
{
  "action": "regenerate"
}

# Update for published article
POST /api/rss/manage
{
  "action": "article_published",
  "article": { ... }
}

# Generate static feeds
POST /api/rss/manage
{
  "action": "generate_static"
}
```

### Feed Status Check
```bash
# Check RSS status and statistics
GET /api/rss/manage

# Response
{
  "success": true,
  "feeds": {
    "main": "https://site.com/feed.xml",
    "breaking": "https://site.com/feed/breaking.xml",
    "categories": { ... }
  },
  "stats": {
    "mainFeedItems": 50,
    "categoryFeeds": { ... },
    "lastUpdated": "2026-02-01T12:00:00Z"
  }
}
```

### Feed Validation
```bash
# Validate RSS feed
PUT /api/rss/manage
{
  "feedUrl": "https://site.com/feed.xml"
}

# Response
{
  "success": true,
  "validation": {
    "isValid": true,
    "errors": [],
    "warnings": []
  }
}
```

## 📋 Google News Submission

### Submission Requirements
1. **RSS Feed URL**: `https://your-news-site.com/feed.xml`
2. **Google News Feed**: `https://your-news-site.com/feed/google-news.xml`
3. **Publisher Verification**: Complete Google News Publisher Center setup
4. **Content Guidelines**: Follow Google News content policies
5. **Technical Requirements**: Valid RSS 2.0 format

### Submission Process
1. **Create Google News Publisher Account**
2. **Verify Website Ownership**
3. **Submit RSS Feed URL**
4. **Complete Publisher Information**
5. **Wait for Review (typically 2-4 weeks)**

### Monitoring
```bash
# Check feed validity
curl -I https://your-news-site.com/feed.xml

# Validate RSS format
curl https://your-news-site.com/feed.xml | xmllint --format -

# Test with RSS validators
https://validator.w3.org/feed/
https://www.feedvalidator.org/
```

## 🔧 Configuration

### Environment Variables
```env
NEXT_PUBLIC_SITE_URL=https://your-news-site.com
RSS_CACHE_DURATION=3600
RSS_BREAKING_CACHE_DURATION=900
RSS_MAX_ITEMS=50
RSS_CATEGORY_MAX_ITEMS=30
```

### RSS Configuration
```typescript
// lib/rss-config.ts
export const rssConfig = {
  title: 'US News Today - Breaking News & Latest Headlines',
  description: 'Stay informed with the latest breaking news...',
  language: 'en-US',
  copyright: 'Copyright 2026 US News Today. All rights reserved.',
  managingEditor: 'editor@usnewstoday.com (US News Today Editorial Team)',
  webMaster: 'webmaster@usnewstoday.com (US News Today Technical Team)',
  category: 'News',
  generator: 'US News Today RSS Generator v1.0'
}
```

## 📊 Analytics and Monitoring

### Feed Statistics
```typescript
// Get feed statistics
const stats = await dynamicRSS.getFeedStats()

// Response
{
  mainFeedItems: 50,
  categoryFeeds: {
    'politics': 15,
    'business': 12,
    'sports': 8
  },
  lastUpdated: '2026-02-01T12:00:00Z',
  totalFeeds: 16
}
```

### Performance Monitoring
- **Feed Generation Time**: Track RSS generation performance
- **Cache Hit Rates**: Monitor caching effectiveness
- **Error Rates**: Track feed generation failures
- **Subscriber Counts**: Monitor RSS subscriber growth

## 🚨 Troubleshooting

### Common Issues

#### Feed Not Updating
1. Check database connection
2. Verify article publication status
3. Review cache settings
4. Check API endpoint responses

#### Google News Rejection
1. Validate RSS format
2. Check content guidelines compliance
3. Verify publisher information
4. Ensure proper categorization

#### Performance Issues
1. Review cache configuration
2. Check database query performance
3. Monitor feed generation times
4. Consider static feed generation

### Debug Commands
```bash
# Test RSS feed
curl https://your-news-site.com/feed.xml

# Validate RSS format
xmllint --noout https://your-news-site.com/feed.xml

# Check feed headers
curl -I https://your-news-site.com/feed.xml

# Test category feed
curl https://your-news-site.com/feed/politics

# Validate with online tools
https://validator.w3.org/feed/check.cgi?url=YOUR_FEED_URL
```

## 📈 Best Practices

### Content Guidelines
1. **Accurate Headlines**: Clear, descriptive titles
2. **Quality Summaries**: Informative descriptions under 200 characters
3. **Proper Categorization**: Accurate category assignment
4. **Timely Updates**: Fresh content with proper timestamps
5. **Clean Content**: Sanitized HTML without scripts

### Technical Best Practices
1. **Valid XML**: Well-formed RSS 2.0 format
2. **Proper Encoding**: UTF-8 character encoding
3. **Appropriate Caching**: Balance freshness with performance
4. **Error Handling**: Graceful failure with fallback feeds
5. **Monitoring**: Regular validation and performance checks

### Google News Optimization
1. **Fresh Content**: Regular updates with new articles
2. **Geographic Information**: Include location data where relevant
3. **Media Content**: Proper image tags and descriptions
4. **Author Attribution**: Clear author information
5. **Source Attribution**: Proper source and copyright information

This comprehensive RSS feed system ensures Google News compliance while providing optimal syndication and discoverability for the US News website.