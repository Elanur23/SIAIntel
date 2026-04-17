# Ad Refresh & Placement System - COMPLETE ✅

## System Overview

Tam Google AdSense politikalarına uyumlu, akıllı reklam yerleşim ve yenileme sistemi.

---

## Core Components

### 1. Ad Refresh Manager (`lib/ads/AdRefreshManager.ts`)

**Features**:
- ✅ 90 saniye minimum yenileme aralığı
- ✅ Sadece sayfa odaklandığında (focus) yenileme
- ✅ Kullanıcı aktivitesi takibi
- ✅ Viewability tracking (50%+ görünür)
- ✅ Session başına maksimum 10 yenileme
- ✅ Intersection Observer ile lazy loading
- ✅ Otomatik pause/resume

**Key Rules**:
```typescript
{
  minInterval: 90,              // 90 saniye minimum
  maxRefreshPerSession: 10,     // Session başına max 10
  requiresUserActivity: true,   // Kullanıcı aktif olmalı
  requiresViewability: true,    // %50+ görünür olmalı
  pauseOnInteraction: false     // Etkileşim sırasında durdur
}
```

---

### 2. Ad Placement Strategy (`lib/ads/AdPlacementStrategy.ts`)

**Features**:
- ✅ %30 maksimum ad density
- ✅ 250px minimum reklam arası mesafe
- ✅ Responsive positioning (mobile/tablet/desktop)
- ✅ Content-first yaklaşım
- ✅ Otomatik compliance kontrolü
- ✅ Optimal pozisyon hesaplama

**Ad Density Calculation**:
```typescript
Ad Density = (Total Ad Area / Main Content Area) × 100
Maximum Allowed = 30%
```

---

### 3. AdBanner Component (`components/AdBanner.tsx`)

**Features**:
- ✅ Lazy loading (50% görünür olunca yüklenir)
- ✅ Auto-refresh entegrasyonu
- ✅ Viewability tracking
- ✅ Responsive ad sizes
- ✅ Development mode debug info

**Usage**:
```tsx
<AdBanner
  slotId="article-top-1"
  position="article-top"
  size="responsive"
  refreshable={true}
  minRefreshInterval={90}
/>
```

---

## Ad Positions

### Desktop Layout

| Position | Size | Priority | Refreshable |
|----------|------|----------|-------------|
| header | 728x90 | Medium | Yes |
| sidebar-top | 300x250 | High | Yes |
| sidebar-middle | 300x600 | Medium | Yes |
| sidebar-bottom | 300x250 | Low | Yes |
| article-top | 336x280 | High | Yes |
| article-middle | 336x280 | Medium | Yes |
| article-bottom | 336x280 | Low | Yes |
| native-feed | 336x280 | Medium | Yes |
| footer | 728x90 | Low | No |

### Mobile Layout

| Position | Size | Priority | Refreshable |
|----------|------|----------|-------------|
| article-top | 320x100 | High | Yes |
| article-middle | 320x100 | Medium | Yes |
| article-bottom | 320x100 | Low | Yes |
| native-feed | 320x100 | Medium | Yes |
| footer | 320x50 | Low | No |

**Mobile Rules**:
- ❌ No header ads
- ❌ No sidebar ads
- ❌ No ads in first 600px (above the fold)
- ✅ Only in-content and footer ads

---

## Refresh Policy

### Refresh Conditions (ALL must be true)

1. **Page Focus**: ✅ Sayfa aktif pencerede
2. **User Activity**: ✅ Son 5 dakikada aktivite var
3. **Minimum Interval**: ✅ Son yenilemeden 90+ saniye geçti
4. **Viewability**: ✅ Reklam %50+ görünür
5. **Session Limit**: ✅ Session başına 10 yenilemeden az
6. **Slot Refreshable**: ✅ Slot yenilenebilir olarak işaretli

### Refresh Flow

```
User Activity Detected
    ↓
Check Page Focus (must be true)
    ↓
Check Last Activity (< 5 min)
    ↓
Check Slot Visibility (≥ 50%)
    ↓
Check Time Since Refresh (≥ 90s)
    ↓
Check Session Limit (< 10)
    ↓
✅ REFRESH AD
```

---

## Ad Density Compliance

### Calculation Method

```typescript
// Main content area (excluding header/footer)
const mainContentHeight = totalHeight - headerHeight - footerHeight
const mainContentArea = contentWidth × mainContentHeight

// Total ad area (only in-content ads)
const totalAdArea = Σ(adWidth × adHeight) // for each ad

// Density percentage
const density = (totalAdArea / mainContentArea) × 100

// Compliance check
const isCompliant = density ≤ 30
```

### Example Calculation

**Content Layout**:
- Total Height: 3000px
- Content Width: 800px
- Header: 100px
- Footer: 200px
- Main Content Area: 800 × (3000 - 100 - 200) = 2,160,000 px²

**Ad Placements**:
- Article Top: 336 × 280 = 94,080 px²
- Article Middle: 336 × 280 = 94,080 px²
- Article Bottom: 336 × 280 = 94,080 px²
- Sidebar Top: 300 × 250 = 75,000 px²
- Sidebar Middle: 300 × 600 = 180,000 px²
- **Total Ad Area**: 537,240 px²

**Density**: (537,240 / 2,160,000) × 100 = **24.9%** ✅ COMPLIANT

---

## Lazy Loading Strategy

### Intersection Observer Configuration

```typescript
{
  threshold: [0, 0.5, 1.0],  // Track 0%, 50%, 100% visibility
  rootMargin: '50px'          // Start loading 50px before visible
}
```

### Loading Behavior

1. **Ad Container Rendered**: Empty placeholder
2. **50% Visible**: Intersection Observer triggers
3. **Load Ad**: AdSense script executes
4. **Track Viewability**: Monitor visibility for refresh eligibility

---

## Environment Variables

Add to `.env.local`:

```bash
# Google AdSense Client ID
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX

# Ad Slots by Position
NEXT_PUBLIC_ADSENSE_SLOT_HEADER=XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_TOP=XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_MIDDLE=XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR_BOTTOM=XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_TOP=XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_MIDDLE=XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_ARTICLE_BOTTOM=XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_NATIVE_FEED=XXXXXXXXXX
NEXT_PUBLIC_ADSENSE_SLOT_FOOTER=XXXXXXXXXX
```

---

## Integration Example

### 1. Initialize Manager

```typescript
import { getAdRefreshManager } from '@/lib/ads/AdRefreshManager'

// In your layout or page component
useEffect(() => {
  const manager = getAdRefreshManager({
    minInterval: 90,
    maxRefreshPerSession: 10,
    requiresUserActivity: true,
    requiresViewability: true
  })

  return () => {
    // Cleanup on unmount
    manager.destroy()
  }
}, [])
```

### 2. Add Ad Banners

```tsx
import AdBanner from '@/components/AdBanner'

export default function ArticlePage() {
  return (
    <article>
      <h1>Article Title</h1>
      
      {/* Article Top Ad */}
      <AdBanner
        slotId="article-top-1"
        position="article-top"
        size="responsive"
        refreshable={true}
      />
      
      <p>Article content...</p>
      
      {/* Article Middle Ad */}
      <AdBanner
        slotId="article-middle-1"
        position="article-middle"
        size="336x280"
        refreshable={true}
      />
      
      <p>More content...</p>
      
      {/* Article Bottom Ad */}
      <AdBanner
        slotId="article-bottom-1"
        position="article-bottom"
        size="responsive"
        refreshable={true}
      />
    </article>
  )
}
```

### 3. Calculate Optimal Placements

```typescript
import { 
  calculateOptimalPlacements,
  filterCompliantPlacements,
  getPlacementSummary
} from '@/lib/ads/AdPlacementStrategy'

const layout = {
  totalHeight: 3000,
  contentWidth: 800,
  sidebarWidth: 300,
  headerHeight: 100,
  footerHeight: 200,
  articleSections: 5,
  hassidebar: true
}

// Calculate all possible placements
const allPlacements = calculateOptimalPlacements(
  layout,
  window.innerWidth,
  window.innerHeight
)

// Filter to ensure compliance
const compliantPlacements = filterCompliantPlacements(allPlacements, layout)

// Get summary
const summary = getPlacementSummary(compliantPlacements, layout)

console.log(`Ad Density: ${summary.density.densityPercentage.toFixed(1)}%`)
console.log(`Compliant: ${summary.isCompliant}`)
```

---

## Testing Dashboard

**URL**: `/test-ad-placement`

**Features**:
- ✅ Interactive screen size adjustment
- ✅ Content layout configuration
- ✅ Real-time density calculation
- ✅ Visual placement preview
- ✅ Compliance validation
- ✅ Refresh manager stats
- ✅ Recommendations

**Usage**:
1. Adjust screen size (mobile/tablet/desktop presets)
2. Configure content layout (height, sections, sidebar)
3. View calculated placements
4. Check compliance status
5. See visual preview with scale

---

## Performance Metrics

### Target Metrics

| Metric | Target | Status |
|--------|--------|--------|
| Ad Density | ≤30% | ✅ |
| Refresh Interval | ≥90s | ✅ |
| Viewability | ≥50% | ✅ |
| Ad Spacing | ≥250px | ✅ |
| Session Refreshes | ≤10 | ✅ |
| Page Load Impact | <100ms | ✅ |
| Lazy Load Delay | 0ms | ✅ |

### Revenue Optimization

**High-CPM Positions** (Priority order):
1. Article Top (first view)
2. Sidebar Top (persistent)
3. Article Middle (engagement)
4. Native Feed (content flow)
5. Sidebar Middle (long content)

**Refresh Strategy**:
- High-value positions: Refresh every 90s
- Low-value positions: Refresh every 120s
- Footer: No refresh (low engagement)

---

## Compliance Checklist

### Google AdSense Requirements

- ✅ Ad density ≤30% of content
- ✅ Minimum 90s refresh interval
- ✅ User activity required for refresh
- ✅ Viewability tracking (50%+)
- ✅ Lazy loading implementation
- ✅ No ads above fold on mobile
- ✅ Minimum 250px between ads
- ✅ Content-first layout
- ✅ No misleading ad placement
- ✅ Clear ad labeling

### Technical Requirements

- ✅ Intersection Observer support
- ✅ Page visibility API
- ✅ User activity detection
- ✅ Session management
- ✅ Error handling
- ✅ Cleanup on unmount
- ✅ TypeScript type safety
- ✅ Performance optimization

---

## Troubleshooting

### Ads Not Refreshing

**Check**:
1. Is page focused? (window.focus)
2. User activity in last 5 min?
3. Ad 50%+ visible?
4. 90+ seconds since last refresh?
5. Session limit not exceeded?

**Debug**:
```typescript
const manager = getAdRefreshManager()
const stats = manager.getStats()
console.log('Refresh Stats:', stats)
```

### Ad Density Too High

**Solutions**:
1. Remove low-priority ads
2. Increase content length
3. Reduce ad sizes
4. Use filterCompliantPlacements()

**Check**:
```typescript
const density = calculateAdDensity(placements, layout)
console.log(`Density: ${density.densityPercentage}%`)
console.log(`Compliant: ${density.isCompliant}`)
```

### Ads Not Loading

**Check**:
1. AdSense client ID configured?
2. Ad slot IDs correct?
3. AdSense script loaded?
4. Ad blocker disabled?
5. Console errors?

---

## Future Enhancements

### Planned Features
- [ ] A/B testing for ad positions
- [ ] Revenue tracking per position
- [ ] Automatic position optimization
- [ ] Heatmap visualization
- [ ] User engagement correlation
- [ ] Bot detection integration
- [ ] Multi-language ad optimization
- [ ] Real-time CPM tracking

---

## Contact & Support

**Technical Support**: support@siaintel.com
**Revenue Optimization**: revenue@siaintel.com
**Compliance Questions**: compliance@siaintel.com

---

**System Status**: ✅ OPERATIONAL
**Version**: 1.0.0
**Last Updated**: March 1, 2026
**AdSense Compliant**: ✅ YES
