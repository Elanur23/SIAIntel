# Gemini Integration Guide - SIA Intelligence System

## Overview

The SIAIntel system uses Gemini 2.5 Pro as its "brain" to analyze financial news and generate institutional-grade intelligence reports across 6 languages.

## Architecture

```
News Source → Scout → Brain (Gemini) → Voice → Compositor → Output
                        ↓
                    Database
```

## Current Implementation

### Location: `sovereign-core/core/brain.py`

The Brain module is already fully integrated with:
- ✅ Gemini 2.5 Pro API
- ✅ SIA Intelligence Report format
- ✅ 6-language support (EN, TR, DE, ES, FR, AR)
- ✅ Rate limiting (45s base delay)
- ✅ Retry logic for 429 errors
- ✅ JSON cleaning and parsing

### Usage in Factory

```python
from core.brain import Brain, RateLimiter
from core.scout import NewsItem

# Initialize
api_key = os.getenv('GEMINI_API_KEY')
rate_limiter = RateLimiter(base_delay=45)
brain = Brain(
    api_key=api_key,
    rate_limiter=rate_limiter,
    model_type='2.5-pro'
)

# Process news
news_item = NewsItem(
    id="news_001",
    title="Federal Reserve Signals Rate Cuts",
    content="Full article content...",
    source="Bloomberg",
    url="https://...",
    published_at="2024-02-28T10:00:00Z"
)

intelligence = brain.process_news(news_item)

# Access results
for lang in intelligence.languages:
    print(f"{lang.flag} {lang.language}")
    print(f"Title: {lang.title}")
    print(f"Executive Summary: {lang.executive_summary}")
    print(f"Market Impact: {lang.market_impact}/10")
    print(f"Sovereign Insight: {lang.sovereign_insight}")
    print(f"Risk Assessment: {lang.risk_assessment}")
    print(f"Sentiment: {lang.sentiment} ({lang.sentiment_score}%)")
```

## SIA Intelligence Report Format

### Input (News Item)
```python
NewsItem(
    id: str,
    title: str,
    content: str,
    source: str,
    url: str,
    published_at: str
)
```

### Output (Intelligence Package)
```python
IntelligencePackage(
    news_id: str,
    original_title: str,
    original_content: str,
    processed_at: str,
    languages: List[LanguageContent],
    total_cpm: int
)
```

### Language Content Structure
```python
LanguageContent(
    language_code: str,        # 'en', 'tr', 'de', 'es', 'fr', 'ar'
    language: str,             # 'English', 'Türkçe', etc.
    flag: str,                 # '🇺🇸', '🇹🇷', etc.
    cpm: int,                  # 220, 150, 180, etc.
    title: str,                # SEO-optimized (60-70 chars)
    meta: str,                 # Meta description (150-160 chars)
    executive_summary: str,    # 2-sentence sharp summary
    market_impact: int,        # 1-10 score
    sovereign_insight: str,    # Behind-the-scenes analysis
    risk_assessment: str,      # Specific investor warnings
    sentiment: str,            # 'BULLISH', 'BEARISH', 'NEUTRAL'
    sentiment_score: int,      # 0-100 confidence
    content_brief: str,        # First paragraph (200-250 words)
    cpm_tags: List[str],       # 5 premium keywords
    full_content: str          # Complete article (800-1000 words)
)
```

## Gemini System Instruction

The Brain module uses this prompt structure:

```
Sen SIAIntel Ajansı'nın baş stratejistisin.

Görevin: Gelen ham finans haberini 'SIA Intelligence Report' formatında 
analiz etmek ve 6 stratejik dilde yayınlamak.

YAZIM TARZI: Soğuk, objektif, teknik ve otoriter.

SIA INTELLIGENCE REPORT FORMATI:

1. EXECUTIVE SUMMARY: 2-sentence sharp summary
2. MARKET IMPACT: 1-10 score for 24h market effect
3. SOVEREIGN INSIGHT: Behind-the-scenes geopolitical/institutional analysis
4. RISK ASSESSMENT: Specific danger for investors
5. SENTIMENT: BULLISH/BEARISH/NEUTRAL + confidence (0-100)

KRİTİK KURALLAR:
1. ASLA doğrudan çeviri yapma! Her dili RE-CONTEXTUALIZE et.
2. Her dilin hedef kitlesine özel tonalite kullan.
3. Soğuk, objektif, teknik ve otoriter yazım tarzını koru.
4. CPM_Keywords: Her dil için yüksek CPM anahtar kelimelerini seç.
5. Çıktıyı saf JSON formatında ver.
```

## Language-Specific Tonality

### 🇺🇸 English ($220 CPM) - Wall Street Style
- Audience: Hedge funds, institutional investors
- Keywords: Asset Management, Institutional Flow, Alpha Generation
- Tone: Objective, data-driven, professional

### 🇦🇪 Arabic ($440 CPM) - Royal & Wealth Style
- Audience: Sovereign wealth funds, UHNWI, royal families
- Keywords: صناديق سيادية, استثمارات استراتيجية
- Tone: Prestigious, luxury, strategic

### 🇩🇪 Deutsch ($180 CPM) - Industrial Logic
- Audience: Industrial strategists, manufacturing executives
- Keywords: Industrie 4.0, Lieferkette, Effizienz
- Tone: Technical, detailed, systematic

### 🇪🇸 Español ($170 CPM) - FinTech Momentum
- Audience: FinTech investors, digital banking executives
- Keywords: Neobancos, Finanzas Digitales, Innovación
- Tone: Energetic, modern, digital

### 🇫🇷 Français ($190 CPM) - Regulatory Oversight
- Audience: Policy makers, regulatory bodies
- Keywords: Cadre Réglementaire, Surveillance, Conformité
- Tone: Analytical, regulatory, institutional

### 🇹🇷 Türkçe ($150 CPM) - Market Pulse
- Audience: Retail traders, FX traders, local investors
- Keywords: Portföy, Faiz, Dolar Endeksi, BIST
- Tone: Dynamic, market-focused, action-oriented

## Rate Limiting

### Configuration
- Base delay: 45 seconds between requests
- Retry delay: 60 seconds for 429 errors
- Exponential backoff: 2x on repeated failures
- Max delay: 600 seconds (10 minutes)

### Implementation
```python
rate_limiter = RateLimiter(base_delay=45)

# Automatic handling in Brain.process_news()
# - Waits before each request
# - Handles 429 errors automatically
# - Reduces delay on successful requests
```

## Error Handling

### Retry Logic
```python
max_retries = 5
retry_delay = 60  # seconds

# Automatic retry on:
# - 429 Rate Limit errors
# - RESOURCE_EXHAUSTED errors
# - Network timeouts

# Returns None on failure after max retries
```

### JSON Cleaning
```python
# Removes markdown code blocks
cleaned = re.sub(r'```json\s*', '', response_text)
cleaned = re.sub(r'```\s*', '', cleaned)

# Fallback: Manual JSON extraction
json_start = cleaned.find('{')
json_end = cleaned.rfind('}') + 1
json_str = cleaned[json_start:json_end]
```

## Testing

### Test Script: `sovereign-core/test_brain_sia_format.py`

```bash
cd sovereign-core
python test_brain_sia_format.py
```

**Output:**
- Processes sample Federal Reserve news
- Generates 6-language SIA Intelligence Reports
- Displays all fields (executive summary, market impact, etc.)
- Saves to `data/test_sia_report.json`

### Manual Testing

```python
from core.brain import Brain, RateLimiter
from core.scout import NewsItem

# Initialize
api_key = "YOUR_GEMINI_API_KEY"
rate_limiter = RateLimiter(base_delay=45)
brain = Brain(api_key, rate_limiter, model_type='2.5-pro')

# Create test news
news = NewsItem(
    id="test_001",
    title="Bitcoin Breaks $50K Resistance",
    content="Bitcoin surged past $50,000 today...",
    source="CoinDesk",
    url="https://example.com",
    published_at="2024-02-28T10:00:00Z"
)

# Process
result = brain.process_news(news)

# Check results
if result:
    print(f"✅ Success: {len(result.languages)} languages")
    print(f"Total CPM: ${result.total_cpm}")
    for lang in result.languages:
        print(f"\n{lang.flag} {lang.language}")
        print(f"Market Impact: {lang.market_impact}/10")
        print(f"Sentiment: {lang.sentiment} ({lang.sentiment_score}%)")
else:
    print("❌ Failed to process news")
```

## Integration with Factory

The Factory system automatically uses the Brain module:

```python
# In factory.py
intelligence = self.brain.process_news(news_item)

if intelligence:
    # Save to database
    self.db.save_intelligence(intelligence)
    
    # Export to JSON feed
    self.export_to_json(intelligence)
    
    # Generate videos for each language
    for lang in intelligence.languages:
        video_path = self.produce_video(lang)
```

## Output Files

### JSON Feed: `data/feed.json`
```json
{
  "articles": [{
    "id": "news_001",
    "original_title": "Federal Reserve Signals Rate Cuts",
    "source": "Bloomberg",
    "created_at": "2024-02-28T10:00:00Z",
    "languages": [{
      "language_code": "en",
      "title": "Fed Signals Rate Cuts Amid Economic Slowdown",
      "executive_summary": "Federal Reserve indicates potential rate cuts...",
      "market_impact": 8,
      "sovereign_insight": "This signals coordination between Fed and ECB...",
      "risk_assessment": "Primary risk: Sudden dollar volatility...",
      "sentiment": "BULLISH",
      "sentiment_score": 85
    }]
  }]
}
```

### Database: `data/siaintel.db`
- Table: `intelligence`
- Stores all processed news with full SIA reports
- Deduplication by URL hash

## API Endpoints

### Factory Feed API
```
GET /api/factory/feed
Response: JSON feed with all articles and languages
```

### Python Backend API
```
GET http://localhost:8000/videos/recent?limit=20
Response: Recent videos with metadata
```

## Performance Metrics

- Processing time: ~60-90 seconds per article (6 languages)
- Rate limit: 45 seconds between requests
- Success rate: >95% (with retry logic)
- Output size: ~15-20KB per article (JSON)

## Troubleshooting

### Issue: 429 Rate Limit Errors
**Solution:** Increase base_delay in RateLimiter
```python
rate_limiter = RateLimiter(base_delay=60)  # Increase from 45s
```

### Issue: JSON Parse Errors
**Solution:** Check Gemini response format
```python
# Enable debug logging
logger.setLevel(logging.DEBUG)
```

### Issue: Missing Fields in Output
**Solution:** Verify SYSTEM_INSTRUCTION includes all SIA fields
```python
# Check brain.py SYSTEM_INSTRUCTION
# Must include: executive_summary, market_impact, sovereign_insight, risk_assessment
```

## Best Practices

1. **Always use rate limiting** - Prevents API quota exhaustion
2. **Handle failures gracefully** - Return None, don't crash system
3. **Log all operations** - Essential for debugging
4. **Validate JSON output** - Use Pydantic models
5. **Test with sample data** - Before processing real feeds

## References

- Brain Module: `sovereign-core/core/brain.py`
- Test Script: `sovereign-core/test_brain_sia_format.py`
- Factory Controller: `sovereign-core/factory.py`
- SIA Format Guide: `sovereign-core/SIA-REPORT-FORMAT.md`

---

**Last Updated:** 2024-02-28
**Gemini Model:** gemini-2.5-pro
**Status:** ✅ PRODUCTION READY
