# Quick Start: Sovereign Core V14

## 5-Minute Setup Guide

### Step 1: Environment Setup

Create `.env.local` file:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your free Gemini API key: https://aistudio.google.com/app/apikey

### Step 2: Access Admin Interface

Navigate to: **http://localhost:3000/admin/sovereign-core**

You'll see the Bloomberg Terminal-style control panel.

### Step 3: Start Autonomous Mode

Click the **"START SCHEDULER"** button.

The system will:
- Run immediately (first cycle)
- Then run every 15 minutes automatically
- Process news and generate 6-language content

### Step 4: Monitor System

Watch the live metrics:
- **Total Runs** - Processing cycles completed
- **News Processed** - News items analyzed
- **Content Generated** - Language outputs created
- **Total CPM** - Revenue potential

### Step 5: Manual Trigger (Optional)

Click **"MANUAL RUN"** to trigger a cycle immediately without waiting.

## What Happens During a Cycle?

```
1. SCOUT: Fetches news from Google News RSS
   ↓
2. DEDUP: Filters out already-seen news
   ↓
3. RATE LIMITER: Enforces 40s delay between API calls
   ↓
4. GLOBAL CPM MASTER: Generates 6-language content
   ↓
5. PUBLISH: Stores content in memory
```

## Expected Results

### First Run (3 news items)
- Duration: ~2-3 minutes
- Content Generated: 18 languages (3 × 6)
- Total CPM: ~$4,050

### After 1 Hour (4 cycles)
- News Processed: ~12 items
- Content Generated: ~72 languages
- Total CPM: ~$16,200

### After 24 Hours (96 cycles)
- News Processed: ~288 items
- Content Generated: ~1,728 languages
- Total CPM: ~$388,800

## API Testing

### Get System Status
```bash
curl http://localhost:3000/api/sovereign-core/status
```

### Start Scheduler
```bash
curl -X POST http://localhost:3000/api/sovereign-core/scheduler \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'
```

### Trigger Manual Run
```bash
curl -X POST http://localhost:3000/api/sovereign-core/trigger
```

### Get Published Content
```bash
curl http://localhost:3000/api/sovereign-core/published?limit=5
```

## Troubleshooting

### "Rate limit exceeded" errors
✅ **Normal behavior** - System automatically backs off and retries

### No new news found
✅ **Normal behavior** - Deduplication working correctly

### Processing takes long time
✅ **Expected** - 40s delay between API calls for free tier compliance

## Next Steps

1. **View Published Content**
   - Check `/api/sovereign-core/published`
   - Integrate with your CMS

2. **Customize Keywords**
   - Edit `lib/sovereign-core/scout.ts`
   - Add your target keywords

3. **Adjust Timing**
   - Change `intervalMinutes` in scheduler config
   - Default: 15 minutes

4. **Monitor Performance**
   - Watch deduplication stats
   - Track rate limiter failures
   - Review error logs

## Production Checklist

- [ ] Set up database for deduplication persistence
- [ ] Configure Redis for published content caching
- [ ] Set up monitoring and alerting
- [ ] Configure log rotation
- [ ] Set up backup strategy
- [ ] Test failover scenarios
- [ ] Document deployment process

## Support

For issues or questions:
1. Check system status at `/admin/sovereign-core`
2. Review error logs in admin interface
3. Check API responses for detailed error messages

## Performance Tips

1. **Optimize for your API tier**
   - Free tier: 15 requests/min
   - Adjust `baseDelay` accordingly

2. **Monitor CPM metrics**
   - Focus on high-CPM languages (Arabic: $440)
   - Prioritize premium content

3. **Scale gradually**
   - Start with 15-min intervals
   - Increase frequency as needed

## Success Metrics

Track these KPIs:
- **Processing Success Rate** - Should be >95%
- **API Failure Rate** - Should be <5%
- **Average CPM per Article** - Target: $1,350
- **Content Generation Time** - Target: <45s per article

---

**Ready to go!** Start the scheduler and watch your autonomous intelligence engine work.
