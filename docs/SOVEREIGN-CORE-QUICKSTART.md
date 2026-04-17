# SOVEREIGN CORE V14 - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

1. **Gemini API Key** (Free Tier)
   - Visit: https://makersuite.google.com/app/apikey
   - Create a new API key
   - Copy the key

2. **Environment Setup**
   ```bash
   # Add to .env.local
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Install Dependencies**
   ```bash
   npm install @google/generative-ai
   ```

### Step 1: Start the Development Server

```bash
npm run dev
```

### Step 2: Access the Admin Dashboard

Open your browser and navigate to:
```
http://localhost:3000/admin/sovereign-core
```

### Step 3: Start the Autonomous Engine

1. Click the **"START ENGINE"** button
2. Watch the system metrics update in real-time
3. The engine will:
   - Scan RSS feeds every 15 minutes
   - Process new financial news
   - Generate 6-language intelligence
   - Store processed content

### Step 4: Monitor the System

The dashboard shows:
- ✅ **News Processed:** Total intelligence generated
- 💾 **Intelligence Stored:** Items in memory
- ⚡ **API Requests:** Gemini API calls made
- ⏱️ **Uptime:** How long the engine has been running

### Step 5: View Recent Intelligence

Scroll down to see the **"RECENT INTELLIGENCE"** section showing:
- Original news title
- Processing timestamp
- Number of languages generated (6)
- Total CPM potential ($1,350)
- Average confidence score

## 📊 Understanding the Metrics

### Processing Stats
- **Total Scanned:** All news items found by Scout
- **New Processed:** Unique news items processed
- **Duplicates Skipped:** Already-seen news items
- **Errors:** Processing failures (should be 0)

### Rate Limiter
- **Total Requests:** API calls to Gemini
- **Current Delay:** Wait time between requests (40s default)
- **Retry Count:** Number of 429 error retries
- **Last Request:** Time since last API call

## 🎯 What Happens Automatically

### Every 15 Minutes:
1. **Scout** fetches news from Google News RSS feeds
2. **Deduplication** filters out already-seen news
3. **Rate Limiter** ensures API limits aren't exceeded
4. **Neuro-Sync** processes up to 5 new items
5. **Storage** saves the 6-language intelligence

### For Each News Item:
1. Generates content in 6 languages:
   - 🇺🇸 English ($220 CPM)
   - 🇦🇪 Arabic ($440 CPM) - PREMIUM
   - 🇩🇪 Deutsch ($180 CPM)
   - 🇪🇸 Español ($170 CPM)
   - 🇫🇷 Français ($190 CPM)
   - 🇹🇷 Türkçe ($150 CPM)

2. Each language includes:
   - SEO-optimized title
   - Meta description
   - Intelligence brief
   - 5 premium CPM keywords
   - 800-1000 word content
   - Sentiment analysis
   - Market focus

## 🔧 Configuration Options

### Custom Interval
```typescript
// Start with 30-minute interval
POST /api/sovereign-core/start
{
  "intervalMinutes": 30,
  "maxProcessPerCycle": 3
}
```

### Adjust Processing Limit
```typescript
// Process max 3 items per cycle (more conservative)
{
  "maxProcessPerCycle": 3
}
```

## 📡 API Usage

### Check Status
```bash
curl http://localhost:3000/api/sovereign-core/status
```

### Get Recent Intelligence
```bash
curl http://localhost:3000/api/sovereign-core/intelligence?limit=5
```

### Get Specific Intelligence
```bash
curl http://localhost:3000/api/sovereign-core/intelligence?id=news-123
```

## 🛑 Stopping the Engine

1. Click **"STOP ENGINE"** button in dashboard
2. Or via API:
```bash
curl -X POST http://localhost:3000/api/sovereign-core/stop
```

## ⚠️ Important Notes

### Free Tier Limits
- Gemini 1.5 Pro Free Tier has rate limits
- System uses 40-second delays between requests
- Max 5 items per 15-minute cycle
- Automatic exponential backoff on 429 errors

### Memory Usage
- In-memory storage (max 1000 deduplication entries)
- Auto-cleanup after 7 days
- For production, migrate to database

### Mock Data
- Scout currently uses mock RSS data
- For production, integrate real RSS parser:
  ```bash
  npm install rss-parser
  ```

## 🎨 Language Styles

### 🇺🇸 English (Wall Street)
- Institutional, data-driven
- Keywords: Asset Management, Alpha Generation
- Audience: Hedge funds, institutional investors

### 🇦🇪 Arabic (Royal & Wealth)
- Luxury, sovereign wealth focus
- Keywords: صناديق سيادية، استثمارات استراتيجية
- Audience: Sovereign wealth funds, UHNWI

### 🇩🇪 Deutsch (Industrial Logic)
- Technical, efficiency-focused
- Keywords: Industrie 4.0, Lieferkette
- Audience: Mittelstand CFOs, industrial strategists

### 🇪🇸 Español (FinTech Momentum)
- Dynamic, emerging market focus
- Keywords: Neobancos, Adopción Cripto
- Audience: FinTech investors, LatAm traders

### 🇫🇷 Français (Sovereign Strategy)
- Sophisticated, macro-strategic
- Keywords: Cadre Réglementaire, Souveraineté IA
- Audience: Policy makers, CAC 40 traders

### 🇹🇷 Türkçe (Market Pulse)
- Fast-paced, volatility-focused
- Keywords: Portföy, Faiz, Dolar Endeksi
- Audience: Retail traders, FX traders

## 📈 Expected Performance

### First Cycle (0-15 min)
- Scans ~30 news items
- Processes 5 new items
- Generates 30 language versions (5 × 6)
- Total CPM potential: $6,750

### After 1 Hour (4 cycles)
- Processed: ~20 items
- Intelligence stored: 20
- Total CPM potential: ~$27,000

### After 24 Hours
- Processed: ~100-150 items
- Most items will be duplicates
- System stabilizes at ~5-10 new items per day

## 🐛 Troubleshooting

### "Invalid API Key" Error
```bash
# Check your .env.local file
cat .env.local | grep GEMINI_API_KEY

# Restart dev server
npm run dev
```

### No New Intelligence
- Check console logs for errors
- Verify Scout is finding news
- Check deduplication stats (might be blocking all)

### Rate Limit Errors (429)
- System handles automatically with backoff
- Check "Rate Limiter" section in dashboard
- Wait for delay to decrease

### High Memory Usage
- Stop engine
- Restart dev server
- Consider reducing maxProcessPerCycle

## 🎯 Next Steps

1. **Test the System:** Let it run for 1 hour
2. **Review Intelligence:** Check quality of generated content
3. **Adjust Settings:** Tune interval and processing limits
4. **Integrate RSS Parser:** Replace mock data with real feeds
5. **Add Database:** Migrate from in-memory to persistent storage
6. **Deploy to Production:** Set up on server with monitoring

## 📚 Additional Resources

- Full Documentation: `docs/SOVEREIGN-CORE-V14.md`
- API Reference: See "API Endpoints" section
- Architecture: See "System Architecture" diagram
- Troubleshooting: See "Troubleshooting" section

## 💡 Pro Tips

1. **Start Small:** Begin with 15-minute intervals and 5 items per cycle
2. **Monitor Closely:** Watch the first few cycles for errors
3. **Check Logs:** Console logs show detailed processing info
4. **Be Patient:** Rate limiting means slow but steady processing
5. **Plan for Scale:** Design database schema before production

## 🎉 Success Indicators

✅ Engine status shows "ACTIVE"
✅ News Processed count increasing
✅ No processing errors
✅ Rate limiter delay stable at 40s
✅ Recent intelligence showing 6 languages
✅ Total CPM potential at $1,350 per item

---

**Ready to build your autonomous intelligence empire!** 🚀
