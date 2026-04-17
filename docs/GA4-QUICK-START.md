# GA4 Article Metrics - Quick Start Guide

**5-Minute Setup** | **Production Ready** | **Zero Dependencies**

---

## 🚀 Quick Setup (3 Steps)

### Step 1: Environment Variables

Add to `.env.local`:

```bash
GA4_PROPERTY_ID=properties/123456789
GOOGLE_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR-KEY-HERE\n-----END PRIVATE KEY-----\n"
```

### Step 2: Validate Setup

```bash
npm run validate:ga4
```

### Step 3: Use in Code

```tsx
import { useArticleGA4Metrics } from '@/lib/hooks/useArticleGA4Metrics'

function MyComponent() {
  const { metrics, loading } = useArticleGA4Metrics('https://siaintel.com/en/reports/cbsb')
  
  return <div>Read Time: {metrics?.avg_read_time_seconds}s</div>
}
```

---

## 📊 Available Metrics

```typescript
{
  avg_read_time_seconds: 145,    // Average read time
  engagement_rate: 0.78,         // 78% engagement
  sessions: 1250,                // Total sessions
  active_users: 980              // Unique users
}
```

---

## 🔧 API Usage

**Fetch metrics for any article**:

```bash
curl -X POST http://localhost:3000/api/analytics/article-metrics \
  -H "Content-Type: application/json" \
  -d '{"articleUrl": "https://siaintel.com/en/reports/cbsb"}'
```

---

## 🎯 Integration Examples

### Neural Cell Audit Row

```tsx
// components/admin/NeuralCellAuditRow.tsx
import { useArticleGA4Metrics } from '@/lib/hooks/useArticleGA4Metrics'

function NeuralCellAuditRow({ article }) {
  const { metrics } = useArticleGA4Metrics(article.url)

  return (
    <tr>
      <td>{article.title}</td>
      <td>{metrics?.avg_read_time_seconds || 'N/A'}s</td>
      <td>{((metrics?.engagement_rate || 0) * 100).toFixed(1)}%</td>
    </tr>
  )
}
```

### Revenue Calculator

```typescript
// lib/neural-assembly/revenue-calculator.ts
import { googleAnalyticsService } from '@/lib/signals/google-analytics-service'

async function calculateRevenue(articleUrl: string) {
  const metrics = await googleAnalyticsService.getPageMetrics(articleUrl)
  return metrics ? metrics.sessions * 0.05 * (1 + metrics.engagement_rate) : 0
}
```

### AI Supervisor Quality Check

```typescript
// lib/neural-assembly/ai-supervisor.ts
import { googleAnalyticsService } from '@/lib/signals/google-analytics-service'

async function assessQuality(articleUrl: string) {
  const metrics = await googleAnalyticsService.getPageMetrics(articleUrl)
  
  return {
    readTimeScore: metrics.avg_read_time_seconds >= 120 ? 30 : 0,
    engagementScore: metrics.engagement_rate > 0.6 ? 40 : 0,
    trafficScore: metrics.sessions > 100 ? 30 : 0
  }
}
```

---

## 🔍 Troubleshooting

### No Data Returned?

**Cause**: Article is new or has no traffic  
**Solution**: Wait 24-48 hours for data to accumulate

### Authentication Error?

**Cause**: Service account not configured  
**Solution**: Run `npm run validate:ga4` to check setup

### Quota Exceeded?

**Cause**: Too many requests  
**Solution**: Metrics are cached for 1 hour automatically

---

## 📚 Full Documentation

See `docs/GA4-ARTICLE-METRICS-COMPLETE.md` for:
- Complete architecture details
- Service account setup guide
- Advanced integration patterns
- Performance optimization
- Security considerations

---

## ✅ Validation Checklist

- [ ] Environment variables set
- [ ] `npm run validate:ga4` passes
- [ ] API endpoint responds
- [ ] React hook works in component
- [ ] Metrics display correctly

---

**Ready to integrate!** 🎉

For questions or issues, see the complete documentation.
