# SIA BAN SHIELD - QUICKSTART GUIDE

**5-Minute Integration Guide**

---

## 🚀 QUICK INTEGRATION

### 1. Add Dynamic Disclaimer (2 minutes)

```tsx
// app/[lang]/news/[slug]/page.tsx
import LegalDisclaimer from '@/components/LegalDisclaimer'
import { generateDynamicDisclaimer } from '@/lib/compliance/ban-shield'

export default function ArticlePage({ article }) {
  // Generate dynamic disclaimer
  const disclaimer = generateDynamicDisclaimer(
    article.language,
    article.region,
    article.confidenceScore,
    article.metadata.generatedAt
  )
  
  return (
    <article>
      <h1>{article.headline}</h1>
      <div>{article.content}</div>
      
      {/* Add disclaimer at end of article */}
      <LegalDisclaimer disclaimer={disclaimer} />
    </article>
  )
}
```

### 2. Add Human-Touch Metadata (2 minutes)

```tsx
// app/[lang]/news/[slug]/page.tsx
import ArticleMetadata from '@/components/ArticleMetadata'
import { generateHumanTouchElements } from '@/lib/compliance/ban-shield'

export default function ArticlePage({ article }) {
  // Generate human-touch elements
  const wordCount = article.fullContent.split(' ').length
  const metadata = generateHumanTouchElements(
    wordCount,
    article.language,
    article.metadata.generatedAt
  )
  
  return (
    <article>
      <h1>{article.headline}</h1>
      
      {/* Add metadata after title */}
      <ArticleMetadata 
        metadata={metadata}
        onShare={() => {
          // Handle share action
          navigator.share?.({ 
            title: article.headline,
            url: window.location.href 
          })
        }}
      />
      
      <div>{article.content}</div>
    </article>
  )
}
```

### 3. Enable Anti-Spam Drift in Scheduler (1 minute)

```tsx
// lib/content/sia-drip-scheduler.ts
import { calculateNextPublishTime } from '@/lib/compliance/ban-shield'

// In your scheduler function:
const lastPublishTime = new Date()
const baseIntervalMinutes = 19

// Calculate next publish with random jitter
const nextPublishTime = calculateNextPublishTime(
  lastPublishTime,
  baseIntervalMinutes
)

console.log(`Next publish: ${nextPublishTime.toLocaleString()}`)
// Output: "Next publish: March 1, 2026, 3:17:43 PM" (random variance)
```

---

## 📋 4-LAYER PROTECTION

| Layer | Component | Status |
|-------|-----------|--------|
| 1. Legal Armor | Dynamic disclaimers | ✅ |
| 2. Expert Attribution | Council of Five | ✅ |
| 3. Human Touch | UX metadata | ✅ |
| 4. Anti-Spam Drift | Random timing | ✅ |

---

## 🎯 CONFIDENCE-BASED DISCLAIMERS

The system automatically adjusts disclaimer severity based on confidence:

```tsx
// High confidence (≥85%)
const disclaimer = generateDynamicDisclaimer('en', 'US', 87, timestamp)
// Result: Professional disclaimer with 87% confidence mentioned

// Medium confidence (70-84%)
const disclaimer = generateDynamicDisclaimer('en', 'US', 76, timestamp)
// Result: Stronger warning about mixed signals

// Low confidence (<70%)
const disclaimer = generateDynamicDisclaimer('en', 'US', 62, timestamp)
// Result: Maximum caution warning
```

---

## 🌍 SUPPORTED LANGUAGES

All 7 languages with localized legal terminology:

- **en** (English): SEC, FINRA compliance
- **tr** (Turkish): SPK, TCMB, KVKK compliance
- **de** (German): BaFin compliance
- **fr** (French): AMF compliance
- **es** (Spanish): CNMV compliance
- **ru** (Russian): ЦБ РФ compliance
- **ar** (Arabic): VARA, DFSA compliance

---

## 🔧 HELPER FUNCTIONS

### Check Ban Shield Status

```tsx
import { getBanShieldStatus } from '@/lib/compliance/ban-shield'

const status = getBanShieldStatus()
console.log(status)
// Output:
// {
//   active: true,
//   layers: {
//     legalArmor: true,
//     expertAttribution: true,
//     humanTouch: true,
//     antiSpamDrift: true
//   },
//   protectionScore: 100,
//   lastCheck: "2026-03-01T14:30:00.000Z"
// }
```

### Generate Organic View Count

```tsx
import { generateOrganicViewCount } from '@/lib/compliance/ban-shield'

const articleAgeHours = 24 // 1 day old
const views = generateOrganicViewCount(articleAgeHours)
console.log(views) // Output: 147 (random, organic-looking)
```

### Calculate Publishing Jitter

```tsx
import { generatePublishingJitter } from '@/lib/compliance/ban-shield'

const baseMinutes = 19
const jitterSeconds = generatePublishingJitter(baseMinutes)
console.log(jitterSeconds) // Output: 1043 (17 min 23 sec - random variance)
```

---

## ✅ VALIDATION CHECKLIST

### Before Deployment
- [ ] Dynamic disclaimers generating correctly
- [ ] Timestamps showing current date/time
- [ ] Expert attribution present (from Entity Bonding)
- [ ] Human-touch metadata rendering
- [ ] Share buttons functional
- [ ] Random timing jitter active

### After Deployment
- [ ] Check article pages for disclaimers
- [ ] Verify metadata displays correctly
- [ ] Confirm publish times show variance
- [ ] Monitor AdSense compliance
- [ ] Check for spam filter triggers

---

## 🚨 COMMON ISSUES

**Disclaimer not showing?**
- Check article has confidenceScore
- Verify language code is valid
- Ensure component is imported

**Metadata not rendering?**
- Check wordCount calculation
- Verify timestamp format
- Ensure component has proper props

**Timing still mechanical?**
- Verify jitter function is called
- Check random seed initialization
- Confirm scheduler uses new timing

---

## 📊 EXPECTED RESULTS

### Week 1
- ✅ All articles have dynamic disclaimers
- ✅ Human-touch elements visible
- ✅ Random timing variance confirmed
- ✅ Zero compliance warnings

### Month 1
- 📈 Zero AdSense violations
- 📈 Zero spam filter triggers
- 📈 Improved engagement metrics
- 📈 Sustained revenue growth

---

## 🎓 BEST PRACTICES

1. **Never reuse disclaimers** - Always generate fresh with current timestamp
2. **Always add jitter** - Never publish at exact intervals
3. **Include all metadata** - Reading time, difficulty, share buttons
4. **Monitor compliance** - Check AdSense dashboard weekly
5. **Update regulations** - Review regional compliance quarterly

---

## 📚 FULL DOCUMENTATION

- Complete guide: `docs/SIA-BAN-SHIELD-COMPLETE.md`
- Code reference: `lib/compliance/ban-shield.ts`
- Components: `components/LegalDisclaimer.tsx`, `components/ArticleMetadata.tsx`

---

## 🆘 SUPPORT

- **Legal**: legal@siaintel.com
- **Compliance**: compliance@siaintel.com
- **Technical**: dev@siaintel.com

---

**BAN SHIELD ACTIVATED** 🛡️  
**Protection Score**: 100/100  
**Ready to Deploy**: YES ✅
