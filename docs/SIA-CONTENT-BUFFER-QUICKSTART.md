# Content Buffer System - Quick Start Guide

**Get started with the Content Buffer & Exponential Growth System in 5 minutes**

---

## 🚀 Quick Start (3 Steps)

### Step 1: Access Dashboard

```
Navigate to: http://localhost:3000/admin/content-buffer
```

### Step 2: Start Auto-Scheduler

Click the **"Start Auto"** button in the dashboard.

The system will now:
- Check buffer every 60 minutes
- Schedule articles for next 24 hours
- Publish articles hourly
- Maintain 30/25/20/15/10% category distribution

### Step 3: Monitor

Watch the dashboard for real-time statistics:
- Buffer size
- Category distribution
- Hourly publishing schedule
- Diversity score

**That's it!** The system is now running autonomously.

---

## 📊 Understanding the Dashboard

### Top Metrics (4 Cards)

```
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Total: 247  │ Buffered: 150│ Scheduled: 85│ Published: 12│
└─────────────┴─────────────┴─────────────┴─────────────┘
```

- **Total**: All articles in system
- **Buffered**: Waiting to be scheduled
- **Scheduled**: Waiting for publish time
- **Published**: Already live

### Category Distribution

Shows how articles are distributed across 5 categories:

- **Crypto & Blockchain** (30% target)
- **Macro Economy** (25% target)
- **Commodities** (20% target)
- **Tech Stocks** (15% target)
- **Emerging Markets** (10% target)

### Hourly Mix

Current hour breakdown showing:
- Total articles for this hour
- Articles per category
- Diversity score (higher = better balance)

### 24-Hour Schedule

Visual representation of exponential growth:
- Hour 0: 5 articles
- Hour 6: 11 articles
- Hour 12: 26 articles
- Hour 18: 50 articles (capped)

---

## 🎯 Common Tasks

### Add Article to Buffer

```typescript
import { addToBuffer } from '@/lib/content/content-buffer-system'

const article = await generateArticle(...)
const buffered = addToBuffer(article)

console.log(`Category: ${buffered.category}`)
console.log(`Priority: ${buffered.priority}`)
```

### Manual Scheduling

```bash
# Schedule next 24 hours
curl -X POST http://localhost:3000/api/content-buffer \
  -H "Content-Type: application/json" \
  -d '{"action":"schedule"}'
```

### Manual Publishing

```bash
# Publish current hour
curl -X POST http://localhost:3000/api/content-buffer \
  -H "Content-Type: application/json" \
  -d '{"action":"publish"}'
```

### Get Statistics

```bash
# Get buffer stats
curl http://localhost:3000/api/content-buffer?action=stats
```

---

## 📈 Exponential Growth Formula

```
articles(t) = 5 × (1.15)^t

Where t = hours since start
```

**Example Growth:**
- Hour 0: 5 articles
- Hour 3: 7 articles
- Hour 6: 11 articles
- Hour 12: 26 articles
- Hour 24: 50 articles (capped)

**Total in 24 hours**: ~729 articles

---

## 🎨 Topic Categories

Articles are automatically classified into 5 categories:

### A: Crypto & Blockchain (30%)
Keywords: Bitcoin, Ethereum, DeFi, NFT, Whale Wallet

### B: Macro Economy (25%)
Keywords: FED, ECB, Inflation, Interest Rate, GDP

### C: Commodities (20%)
Keywords: Gold, Silver, Oil, Natural Gas

### D: Tech Stocks (15%)
Keywords: Nasdaq, AI, Apple, Microsoft, Nvidia

### E: Emerging Markets (10%)
Keywords: BIST, Turkey, Brazil, India, MSCI EM

---

## 🔧 Configuration

### Adjust Growth Rate

```typescript
// Slower growth (10% per hour)
generatePublishingSchedule(0, 5, 0.10)

// Default growth (15% per hour)
generatePublishingSchedule(0, 5, 0.15)

// Faster growth (20% per hour)
generatePublishingSchedule(0, 5, 0.20)
```

### Change Auto-Scheduler Interval

```typescript
// Check every 30 minutes
scheduler.start(30)

// Check every hour (default)
scheduler.start(60)

// Check every 2 hours
scheduler.start(120)
```

---

## 🎯 Success Indicators

### System is Working When:

✅ Buffer size: 500-1000 articles  
✅ Diversity score: >70%  
✅ Category distribution: ±5% of target  
✅ Publishing success rate: >95%  
✅ Auto-scheduler: Running without errors  

### Warning Signs:

⚠️ Buffer size: <100 articles (need more content)  
⚠️ Diversity score: <50% (imbalanced categories)  
⚠️ Publishing failures: >5% (check logs)  
⚠️ Auto-scheduler: Stopped (restart needed)  

---

## 🆘 Troubleshooting

### Buffer Not Filling

**Problem**: Buffer size stays low  
**Solution**: Generate more articles or reduce publishing rate

```typescript
// Reduce base articles per hour
generatePublishingSchedule(0, 3, 0.15) // Start with 3 instead of 5
```

### Imbalanced Categories

**Problem**: One category dominates  
**Solution**: Check keyword matching in classification

```typescript
// View article category
const category = classifyArticle(article)
console.log(`Classified as: ${category}`)
```

### Auto-Scheduler Not Running

**Problem**: Articles not publishing automatically  
**Solution**: Restart auto-scheduler from dashboard

Click **"Stop Auto"** then **"Start Auto"**

### Low Diversity Score

**Problem**: Diversity score <50%  
**Solution**: Ensure buffer has articles from all categories

```typescript
// Check category distribution
const stats = getBufferStats()
console.log(stats.byCategory)
```

---

## 📚 Learn More

- **Full Documentation**: `docs/SIA-CONTENT-BUFFER-COMPLETE.md`
- **API Reference**: `app/api/content-buffer/route.ts`
- **System Code**: `lib/content/content-buffer-system.ts`
- **Dashboard**: `app/admin/content-buffer/page.tsx`

---

## 🎉 You're Ready!

The Content Buffer System is now managing your article distribution with exponential growth. Monitor the dashboard and let the system work autonomously.

**Questions?** Check the full documentation or review the code comments.

---

**Quick Start Version**: 1.0.0  
**Last Updated**: March 1, 2026
