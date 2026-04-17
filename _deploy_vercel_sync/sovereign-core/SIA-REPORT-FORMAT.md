# SIA Intelligence Report Format

## Quick Reference Guide

This document explains the new intelligence report structure used by the Brain module.

## Report Components

### 1. EXECUTIVE SUMMARY
**Purpose**: 2-sentence sharp summary of the news
**Style**: Direct, result-oriented, no fluff
**Example**: 
```
Federal Reserve signals potential rate cuts as economic indicators weaken. 
Institutional investors repositioning portfolios ahead of policy shift.
```

### 2. MARKET IMPACT (1-10)
**Purpose**: Quantify 24-hour impact on markets
**Scale**:
- 1-3: Minimal impact (routine news)
- 4-6: Medium impact (sector-specific movement)
- 7-9: High impact (broad market movement)
- 10: Critical (major policy shift, crisis event)

**Example**: `8` (High impact expected on equity and forex markets)

### 3. SOVEREIGN INSIGHT
**Purpose**: Behind-the-scenes analysis that mainstream sites miss
**Focus**: 
- Geopolitical implications
- Institutional player strategies
- Hidden connections
- Long-term strategic context

**Example**:
```
This signals coordination between Fed and ECB to prevent dollar 
strengthening that could destabilize emerging markets. Major hedge 
funds have been accumulating defensive positions for 3 weeks, 
suggesting advance knowledge of policy shift.
```

### 4. RISK ASSESSMENT
**Purpose**: Identify specific danger for investors
**Requirements**:
- Concrete and actionable
- Not generic warnings
- Specific to this news event

**Example**:
```
Primary risk: Sudden dollar volatility if rate cut exceeds market 
expectations. EM currency exposure should be hedged immediately.
```

### 5. SENTIMENT
**Purpose**: Clear directional signal with confidence
**Values**: BULLISH / BEARISH / NEUTRAL
**Confidence**: 0-100 score

**Examples**:
- `BULLISH (85%)` - Strong positive signal
- `BEARISH (72%)` - Moderate negative signal
- `NEUTRAL (60%)` - Mixed signals, low confidence

## Language-Specific Adaptation

Each language uses region-specific terminology and context:

### 🇺🇸 English (Wall Street)
- Terms: "institutional flow", "alpha generation", "portfolio optimization"
- Context: US equity markets, Fed policy, S&P 500 impact

### 🇦🇪 Arabic (Gulf Wealth)
- Terms: "صناديق سيادية" (sovereign funds), "استثمارات استراتيجية"
- Context: Oil markets, Gulf sovereign wealth funds, regional stability

### 🇩🇪 Deutsch (Industrial)
- Terms: "Industrie 4.0", "Lieferkette", "Effizienz"
- Context: Manufacturing impact, supply chain, DAX movements

### 🇪🇸 Español (FinTech)
- Terms: "Neobancos", "Finanzas Digitales", "Innovación"
- Context: Digital banking, LatAm markets, crypto implications

### 🇫🇷 Français (Regulatory)
- Terms: "Cadre Réglementaire", "Surveillance", "Conformité"
- Context: EU regulations, compliance impact, CAC 40

### 🇹🇷 Türkçe (Market Pulse)
- Terms: "Portföy", "Faiz", "Dolar Endeksi", "BIST"
- Context: Turkish lira, BIST 100, Central Bank policy

## Writing Style

**Tone**: Cold, objective, technical, authoritative
**Perspective**: Institutional analyst, not retail blogger
**Language**: Professional financial terminology
**Approach**: Data-driven, not emotional

### Good Examples:
✅ "Fed policy shift indicates coordinated central bank action"
✅ "Institutional positioning suggests advance knowledge"
✅ "Primary risk vector: EM currency volatility"

### Bad Examples:
❌ "This is amazing news for investors!"
❌ "You should definitely buy stocks now"
❌ "Everyone is talking about this"

## JSON Structure

```json
{
  "language_code": "en",
  "language": "English",
  "flag": "🇺🇸",
  "cpm": 220,
  "title": "Fed Signals Rate Cuts Amid Economic Slowdown",
  "meta": "Federal Reserve indicates potential rate cuts as economic indicators weaken, triggering institutional portfolio repositioning.",
  "executive_summary": "Federal Reserve signals potential rate cuts as economic indicators weaken. Institutional investors repositioning portfolios ahead of policy shift.",
  "market_impact": 8,
  "sovereign_insight": "This signals coordination between Fed and ECB to prevent dollar strengthening that could destabilize emerging markets. Major hedge funds have been accumulating defensive positions for 3 weeks.",
  "risk_assessment": "Primary risk: Sudden dollar volatility if rate cut exceeds market expectations. EM currency exposure should be hedged immediately.",
  "sentiment": "BULLISH",
  "sentiment_score": 85,
  "content_brief": "The Federal Reserve's indication of potential rate cuts...",
  "cpm_tags": ["Federal Reserve", "Rate Cuts", "Institutional Flow", "Portfolio Optimization", "Dollar Index"],
  "full_content": "Complete 800-1000 word article..."
}
```

## Usage in Code

```python
from core.brain import Brain, RateLimiter
from core.scout import NewsItem

# Initialize
rate_limiter = RateLimiter(base_delay=45)
brain = Brain(api_key=api_key, rate_limiter=rate_limiter, model_type='2.5-pro')

# Process news
result = brain.process_news(news_item)

# Access new fields
for lang in result.languages:
    print(f"Executive Summary: {lang.executive_summary}")
    print(f"Market Impact: {lang.market_impact}/10")
    print(f"Sovereign Insight: {lang.sovereign_insight}")
    print(f"Risk Assessment: {lang.risk_assessment}")
    print(f"Sentiment: {lang.sentiment} ({lang.sentiment_score}%)")
```

## Testing

```bash
cd sovereign-core
python test_brain_sia_format.py
```

Output will show all 5 intelligence components for each of the 6 languages.

---

**Format Version**: 1.0
**Last Updated**: 2024-02-28
**Module**: `core/brain.py`
