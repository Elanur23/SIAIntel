# Ban-Safety Compliance Integration Guide

## Overview

This guide shows how to integrate the Ban-Safety Compliance System into your automation and publishing workflows.

## Step 1: Import the Compliance System

```typescript
import {
  prePublishComplianceCheck,
  calculateNextPublishTime,
  isPublishTimeSafe,
  validateDailyPublishingCadence,
  validateSitemapConfig,
  validateArticleTrustSignals,
  validateInternalLinking,
  validateContentUniqueness,
  type ComplianceCheckResult,
  type InternalLink,
  type ContentAnalysis,
} from '@/lib/ban-safety-compliance'
```

## Step 2: Integrate into AI Auto-Publisher

Update `lib/ai-auto-publisher.ts`:

```typescript
import { prePublishComplianceCheck } from '@/lib/ban-safety-compliance'

export async function publishArticleWithCompliance(article: {
  id: string
  title: string
  content: string
  authorName: string
  authorProfileUrl: string
  publishDate: string
  publishTime: string
  timezone: string
  category: string
  tone: 'editorial' | 'blog' | 'opinion'
  internalLinks: Array<{ url: string; anchorText: string; context: string }>
}): Promise<{ success: boolean; reason?: string }> {
  try {
    // Get recent publish times and articles
    const recentPublishTimes = await getRecentPublishTimes(24) // Last 24 hours
    const recentArticles = await getRecentArticles(10) // Last 10 articles

    // Run compliance check
    const compliance = await prePublishComplianceCheck(
      article,
      recentPublishTimes,
      recentArticles
    )

    if (!compliance.canPublish) {
      console.error('[COMPLIANCE] Publication blocked:', compliance.issues)
      
      // Log for audit trail
      console.log('[AUDIT] Blocked article:', {
        articleId: article.id,
        reason: 'Compliance check failed',
        issues: compliance.issues,
        timestamp: new Date().toISOString(),
      })

      return {
        success: false,
        reason: `Compliance check failed: ${compliance.issues.join('; ')}`,
      }
    }

    // Safe to publish
    console.log('[COMPLIANCE] Article passed all checks:', article.id)
    
    // Publish the article
    const result = await publishArticle(article)
    
    return { success: true }
  } catch (error) {
    console.error('[COMPLIANCE] Error during compliance check:', error)
    return {
      success: false,
      reason: 'Compliance check error',
    }
  }
}
```

## Step 3: Integrate into Automation Scheduler

Update `lib/ai-scheduler.ts`:

```typescript
import { calculateNextPublishTime, isPublishTimeSafe } from '@/lib/ban-safety-compliance'

export async function scheduleNextPublish(lastPublishTime: number): Promise<number> {
  // Calculate next safe publish time with randomization
  const nextTime = calculateNextPublishTime(lastPublishTime)
  
  // Get recent publish times to check for same-minute conflicts
  const recentPublishTimes = await getRecentPublishTimes(1) // Last 1 hour
  
  // Verify it's safe
  if (!isPublishTimeSafe(nextTime, recentPublishTimes)) {
    console.warn('[COMPLIANCE] Publish time conflict, recalculating...')
    // Recursively find next safe time
    return scheduleNextPublish(nextTime)
  }
  
  console.log('[COMPLIANCE] Next publish scheduled for:', new Date(nextTime).toISOString())
  return nextTime
}
```

## Step 4: Integrate into Sitemap Generator

Update `lib/dynamic-sitemap.ts`:

```typescript
import { validateSitemapConfig } from '@/lib/ban-safety-compliance'

export async function generateSitemap(): Promise<string> {
  // Get articles from last 48 hours only
  const fortyEightHoursAgo = Date.now() - 48 * 60 * 60 * 1000
  const recentArticles = await getArticles({
    publishedAfter: fortyEightHoursAgo,
    limit: 1000, // Max 1000 URLs
  })

  // Validate sitemap config
  const validation = validateSitemapConfig(
    recentArticles.length,
    (Date.now() - recentArticles[recentArticles.length - 1].publishTime) / (60 * 60 * 1000)
  )

  if (!validation.passed) {
    console.error('[COMPLIANCE] Sitemap validation failed:', validation.violations)
    // Don't generate invalid sitemap
    return ''
  }

  // Generate sitemap with recent articles only
  const sitemap = generateSitemapXml(recentArticles)
  
  console.log('[COMPLIANCE] Sitemap generated with', recentArticles.length, 'URLs')
  return sitemap
}
```

## Step 5: Integrate into Article Generation

Update `lib/ai-editor.ts`:

```typescript
import { validateArticleTrustSignals, validateInternalLinking } from '@/lib/ban-safety-compliance'

export async function generateArticleWithCompliance(prompt: string): Promise<any> {
  // Generate article content
  const article = await generateArticleContent(prompt)
  
  // Ensure all trust signals are present
  const trustSignals = validateArticleTrustSignals({
    title: article.title,
    authorName: article.authorName,
    authorProfileUrl: article.authorProfileUrl,
    publishDate: article.publishDate,
    publishTime: article.publishTime,
    timezone: article.timezone,
    category: article.category,
    tone: article.tone,
  })

  if (!trustSignals.passed) {
    console.error('[COMPLIANCE] Missing trust signals:', trustSignals.violations)
    // Add missing signals
    article.authorName = article.authorName || 'Staff Reporter'
    article.timezone = article.timezone || 'ET'
    article.tone = article.tone || 'editorial'
  }

  // Validate internal links
  const linkValidation = validateInternalLinking(article.internalLinks || [])
  
  if (!linkValidation.passed) {
    console.warn('[COMPLIANCE] Internal linking issues:', linkValidation.violations)
    // Reduce links to max 3
    article.internalLinks = article.internalLinks.slice(0, 3)
  }

  return article
}
```

## Step 6: Add Compliance Monitoring Dashboard

The admin dashboard is already available at:
```
http://localhost:3000/admin/ban-safety-monitor
```

Monitor:
- Publishing cadence (6-10 articles/day)
- Publishing gaps (45-120 minutes)
- Sitemap status (< 1000 URLs, < 48 hours)
- Trust signals (all present)
- Internal linking (max 3 per article)

## Step 7: Set Up Compliance Logging

Create a compliance log file for audits:

```typescript
// In your logging system
export async function logComplianceEvent(event: {
  type: 'publish' | 'block' | 'warning' | 'error'
  articleId?: string
  message: string
  details?: any
}): Promise<void> {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...event,
  }

  // Log to console
  console.log('[COMPLIANCE]', JSON.stringify(logEntry))

  // Log to file (optional)
  // await appendToFile('compliance-logs.jsonl', JSON.stringify(logEntry))

  // Log to audit system (optional)
  // await auditLog('compliance_event', logEntry)
}
```

## Step 8: Test the Integration

### Test 1: Publishing Cadence
```bash
# Publish 6 articles with 45-120 minute gaps
# Verify no same-minute duplicates
# Verify randomization (gaps should vary)
```

### Test 2: Sitemap
```bash
# Generate sitemap
# Verify only articles from last 48 hours
# Verify max 1000 URLs
# Verify accurate lastmod timestamps
```

### Test 3: Trust Signals
```bash
# Generate article
# Verify author name present
# Verify date, time, timezone present
# Verify category assigned
# Verify editorial tone
```

### Test 4: Internal Linking
```bash
# Generate article with links
# Verify max 3 links
# Verify no repeated anchor text
# Verify editorial language
```

### Test 5: Content Uniqueness
```bash
# Generate 3 articles in same category
# Verify different lead types
# Verify different paragraph structures
# Verify different angles
```

## Step 9: Monitor and Adjust

### Daily Monitoring
- Check admin dashboard for compliance status
- Review compliance logs
- Verify publishing pattern is random
- Check sitemap size and age

### Weekly Review
- Export compliance logs
- Analyze publishing patterns
- Check for any violations
- Verify all rules are being followed

### Monthly Audit
- Full compliance audit
- Review all logs
- Check Google Search Console for crawl patterns
- Verify no ban signals

## Integration Checklist

- [ ] Import compliance functions
- [ ] Integrate into AI auto-publisher
- [ ] Integrate into automation scheduler
- [ ] Integrate into sitemap generator
- [ ] Integrate into article generation
- [ ] Set up compliance logging
- [ ] Test all 5 scenarios
- [ ] Monitor dashboard daily
- [ ] Review logs weekly
- [ ] Audit monthly

## Troubleshooting

### Issue: "Publishing pattern is too predictable"
**Solution**: Ensure `calculateNextPublishTime()` is using randomization
```typescript
const randomGap = Math.random() * (maxGapMs - minGapMs) + minGapMs
```

### Issue: "Sitemap contains too many URLs"
**Solution**: Reduce retention to 36 hours instead of 48
```typescript
const thirtyHoursAgo = Date.now() - 36 * 60 * 60 * 1000
```

### Issue: "Same-minute duplicate detected"
**Solution**: Ensure `isPublishTimeSafe()` is called before publishing
```typescript
if (!isPublishTimeSafe(publishTime, recentPublishTimes)) {
  return scheduleNextPublish(publishTime)
}
```

### Issue: "Missing trust signals"
**Solution**: Ensure all fields are populated before publishing
```typescript
article.authorName = article.authorName || 'Staff Reporter'
article.timezone = article.timezone || 'ET'
article.tone = article.tone || 'editorial'
```

## API Reference

### POST /api/compliance/check

**Actions:**
- `pre_publish` - Complete pre-publish check
- `daily_cadence` - Validate daily publishing cadence
- `sitemap_validation` - Validate sitemap configuration
- `status_report` - Get compliance status report

**Response:**
```json
{
  "success": true,
  "data": {
    "passed": true,
    "violations": [],
    "warnings": [],
    "recommendations": []
  }
}
```

## Support

- **Admin Dashboard**: `/admin/ban-safety-monitor`
- **Documentation**: `docs/BAN-SAFETY-COMPLIANCE-SYSTEM.md`
- **Quick Start**: `BAN-SAFETY-COMPLIANCE-QUICKSTART.md`
- **API Endpoint**: `/api/compliance/check`

## Final Notes

1. **Safety First**: Never publish if compliance is uncertain
2. **Human-like**: Randomization is mandatory
3. **Transparent**: All rules are logged and auditable
4. **Fail-safe**: If any rule is violated, do NOT publish

**These rules are non-negotiable for site survival.**
