# SIAIntel Terminal - Visual Feature Guide

**Complete Implementation Overview**

---

## 🎯 Terminal Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ MARKET TICKER: NASDAQ ▲2.3% | S&P500 ▲1.8% | BTC ▼0.5% | GOLD ▲0.3%       │
├─────────────────────────────────────────────────────────────────────────────┤
│ SIAINTEL TERMINAL                                    [SOVEREIGN ACCESS]     │
│                                                      2026-02-28 15:30:45     │
├─────────────────────────────────────────────────────────────────────────────┤
│ NEWS TICKER: [BULLISH] FED RATE SPECULATION | [BEARISH] OIL DISRUPTION...  │
├──────────────┬──────────────────────────────────────┬────────────────────────┤
│              │                                      │                        │
│  SENTIMENT   │      INTELLIGENCE FEED               │  SPOTLIGHT             │
│  OSCILLATOR  │                                      │  INTELLIGENCE          │
│              │  TIME    INTELLIGENCE    REGION      │                        │
│  Fear/Greed  │  ────────────────────────────────    │  ┌──────────────────┐ │
│    Index     │  22:41   FED INTEREST... WALL ST    │  │  ANALYSIS PANEL  │ │
│              │  22:39   OIL PIPELINE... GULF       │  │  ┌────────────┐   │ │
│     72       │  22:37   CRYPTO REGUL... EUROPE     │  │  │ WORLD MAP  │   │ │
│  ████████    │  22:35   NASDAQ VOLAT... WALL ST    │  │  │  + RADAR   │   │ │
│              │  22:33   BITCOIN SURG... GLOBAL     │  │  └────────────┘   │ │
│  VOL: 23.4   │                                      │  └──────────────────┘ │
│  P/C: 0.87   │  ● LIVE STREAM | LATENCY: 12ms      │                        │
│  MOM: +12.3  │    UPTIME: 99.98%                    │  [EN][TR][DE][ES][FR]  │
│              │                                      │                        │
└──────────────┴──────────────────────────────────────┴────────────────────────┘
```

---

## 📊 Feature Breakdown

### 1. Intelligence Feed Grid (Center Column)

**Layout**: Exact column widths for Bloomberg Terminal aesthetic

```
┌─────────┬──────────────────────────┬─────────┬─────────┬─────────┐
│  TIME   │     INTELLIGENCE         │ REGION  │ SIGNAL  │ IMPACT  │
│ (100px) │         (1fr)            │ (120px) │ (100px) │ (100px) │
├─────────┼──────────────────────────┼─────────┼─────────┼─────────┤
│ 22:41   │ FED INTEREST RATE...     │ WALL ST │ BULLISH │   8%    │
│ 22:39   │ MIDDLE EAST OIL...       │ GULF    │ BULLISH │   7%    │
│ 22:37   │ CRYPTO REGULATORY...     │ EUROPE  │ BULLISH │   9%    │
└─────────┴──────────────────────────┴─────────┴─────────┴─────────┘
```

**Features**:
- ✅ Click any row to view detailed analysis
- ✅ New items flash AMBER for 2 seconds
- ✅ Real-time millisecond timestamps
- ✅ Color-coded signals (GREEN/RED/AMBER)
- ✅ Impact percentage (was "/10", now "%")
- ✅ Empty state: "ESTABLISHING_ENCRYPTED_CONNECTION..."

---

### 2. Spotlight Intelligence (Right Column)

#### A. Active Intelligence View (When Item Selected)

```
┌────────────────────────────────────────────────────────────┐
│ ● SPOTLIGHT INTELLIGENCE // WALL ST    COORDS: 22% / 35%  │
├──────────────────────────┬─────────────────────────────────┤
│                          │                                 │
│  ANALYSIS PANEL          │      WORLD MAP + RADAR          │
│                          │                                 │
│  FED INTEREST RATE...    │         ┌─────────────┐         │
│  ─────────────           │         │             │         │
│                          │         │   ◉ PING    │         │
│  [SIA_ASSESSMENT]:       │         │   WALL ST   │         │
│  Federal Reserve signals │         │             │         │
│  potential rate cuts...▊ │         └─────────────┘         │
│  (typing effect 30ms)    │                                 │
│                          │  ┌─────────────────────────┐    │
│  ┌─────────────────────┐ │  │ ◉ TARGET_LOCKED:       │    │
│  │ Risk Level: 8/10    │ │  │   WALL ST              │    │
│  │ ████████░░          │ │  │ LAT: 40.7128°          │    │
│  └─────────────────────┘ │  │ LONG: -74.0060°        │    │
│                          │  │ SIGNAL: 98%            │    │
│  ┌─────────────────────┐ │  └─────────────────────────┘    │
│  │ Market Sentiment    │ │  (shows for 2 seconds)          │
│  │ BULLISH             │ │                                 │
│  │ 94% confidence      │ │  ┌─────────────────────────┐    │
│  └─────────────────────┘ │  │ CORRELATION_DETECTED    │    │
│                          │  │ Fed speculation 22:30   │    │
│  ┌─────────────────────┐ │  │ 90% MATCH               │    │
│  │ AI PREDICTION       │ │  └─────────────────────────┘    │
│  │ ▲ VOLATILITY_UP     │ │                                 │
│  │    /\  /\           │ │                                 │
│  │   /  \/  \          │ │                                 │
│  │  /        \         │ │                                 │
│  └─────────────────────┘ │                                 │
│                          │                                 │
└──────────────────────────┴─────────────────────────────────┘
```

**Features**:
- ✅ Grid layout (left: analysis, right: map)
- ✅ Typing effect (30ms per character)
- ✅ Risk Level progress bar (color-coded)
- ✅ Market Sentiment with confidence
- ✅ AI Prediction Chart (dynamic trend)
- ✅ Interactive world map with radar ping
- ✅ TARGET_LOCKED HUD (2s display)
- ✅ Real LAT/LONG coordinates
- ✅ Correlation detection box

#### B. Scanning Mode (No Selection)

```
┌────────────────────────────────────────────────────────────┐
│ ● SPOTLIGHT INTELLIGENCE // GLOBAL     COORDS: 50% / 45%  │
├────────────────────────────────────────────────────────────┤
│                                                            │
│                    ┌─────────────┐                         │
│                    │   ○ ○ ○     │  Rotating Radar        │
│                    │  ○  ●  ○    │                         │
│                    │   ○ ○ ○     │                         │
│                    └─────────────┘                         │
│                                                            │
│              SCANNING_SIA_NODES...                         │
│           Awaiting Intelligence Selection                  │
│                                                            │
│  ┌────────────────────────────────────────────────────┐   │
│  │ PAST_EVENTS_LOG // LAST_HOUR                       │   │
│  ├────────────────────────────────────────────────────┤   │
│  │ 22:41  BULLISH  FED INTEREST RATE SPECULATION...   │   │
│  │ 22:39  BULLISH  MIDDLE EAST OIL PIPELINE DISRUP... │   │
│  │ 22:37  BULLISH  CRYPTO REGULATORY FRAMEWORK PASS...│   │
│  │ 22:35  NEUTRAL  NASDAQ VOLATILITY ANALYSIS REPOR...│   │
│  │ 22:33  BEARISH  BITCOIN SURGE TRIGGERS PROFIT TA...│   │
│  └────────────────────────────────────────────────────┘   │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

**Features**:
- ✅ Rotating radar animation
- ✅ PAST_EVENTS_LOG timeline
- ✅ Last 5 intelligence items
- ✅ Widened to max-w-2xl (full titles visible)
- ✅ No truncation
- ✅ Hover effect (border turns amber)
- ✅ Staggered animation on load

---

## 🎬 Animation Timeline

### Intelligence Selection Flow

```
User Clicks Intelligence Row
         ↓
[0.0s] setSelectedReport(item)
         ↓
[0.0s] TARGET_ACQUIRED HUD appears (fade in)
         ↓
[0.0s] Map coordinates animate to region
         ↓
[0.0s] Typing effect starts (30ms/char)
         ↓
[0.5s] Risk Level bar animates (1s duration)
         ↓
[1.0s] AI Prediction Chart draws (2s duration)
         ↓
[2.0s] TARGET_ACQUIRED HUD fades out
         ↓
[2.0s] Correlation box appears (if match >50%)
         ↓
[3.0s] All animations complete
```

### New Intelligence Arrival (Live Pulse)

```
Backend Sends Intelligence via SSE
         ↓
[0.0s] useLivePulse receives data
         ↓
[0.0s] Intelligence added to list
         ↓
[0.0s] Row flashes AMBER (2s duration)
         ↓
[0.0s] System log updated
         ↓
[2.0s] Flash effect ends
         ↓
[2.0s] Row returns to normal state
```

---

## 🎨 Color Coding System

### Signals
```
BULLISH  → #00FF00 (Terminal Green)
BEARISH  → #FF0000 (Bloomberg Red)
NEUTRAL  → #FFB800 (Amber)
```

### Impact Levels
```
8-10 → #FF0000 (High Risk - Red)
6-7  → #FFB800 (Medium Risk - Amber)
0-5  → #00FF00 (Low Risk - Green)
```

### Status Indicators
```
ONLINE      → #00FF00 (Green)
OFFLINE     → #FF0000 (Red)
CONNECTING  → #FFB800 (Amber)
```

### Flash Effects
```
New Item    → #FFB800 (Amber - 2s)
BULLISH     → #00FF00 (Green - 1s)
BEARISH     → #FF0000 (Red - 1s)
```

---

## 🗺️ Region Coordinate System

### Real LAT/LONG Coordinates

```
WALL ST  → 40.7128°, -74.0060°  (New York)
GULF     → 25.2048°,  55.2708°  (Dubai)
EUROPE   → 51.5074°,  -0.1278°  (London)
LATAM    → -23.5505°, -46.6333° (São Paulo)
TURKEY   → 41.0082°,  28.9784°  (Istanbul)
GLOBAL   → 0.0°,      0.0°      (Center)
```

### Map Positions (Percentage-based)

```
WALL ST  → x: 22%, y: 35%
GULF     → x: 55%, y: 52%
EUROPE   → x: 48%, y: 28%
LATAM    → x: 25%, y: 65%
TURKEY   → x: 52%, y: 38%
GLOBAL   → x: 50%, y: 45%
```

---

## 🔄 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    PYTHON BACKEND                           │
│                   (Port 8000)                               │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  SCOUT   │→ │  BRAIN   │→ │  VOICE   │→ │COMPOSITOR│  │
│  │ (News)   │  │(Gemini)  │  │ (TTS)    │  │ (Video)  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                       ↓                                     │
│              ┌────────────────┐                            │
│              │   DATABASE     │                            │
│              │  (SQLite)      │                            │
│              └────────────────┘                            │
│                       ↓                                     │
│         ┌─────────────┴─────────────┐                     │
│         ↓                           ↓                      │
│  ┌─────────────┐            ┌─────────────┐              │
│  │ REST API    │            │ SSE STREAM  │              │
│  │ /api/intel  │            │ /api/stream │              │
│  └─────────────┘            └─────────────┘              │
└────────┬────────────────────────────┬────────────────────┘
         │                            │
         ↓                            ↓
┌────────────────────────────────────────────────────────────┐
│                  NEXT.JS FRONTEND                          │
│                 (Port 3000/3001)                           │
│                                                            │
│  ┌──────────────┐              ┌──────────────┐          │
│  │ useSiaData   │              │ useLivePulse │          │
│  │ (Polling)    │              │ (Streaming)  │          │
│  └──────┬───────┘              └──────┬───────┘          │
│         │                             │                   │
│         └─────────────┬───────────────┘                   │
│                       ↓                                    │
│              ┌────────────────┐                           │
│              │  app/page.tsx  │                           │
│              │  (Terminal)    │                           │
│              └────────┬───────┘                           │
│                       │                                    │
│         ┌─────────────┼─────────────┐                    │
│         ↓             ↓             ↓                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │Sentiment │  │  Intel   │  │Spotlight │              │
│  │Oscillator│  │  Feed    │  │  Panel   │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│                                     ↓                      │
│                          ┌──────────────────┐            │
│                          │ PredictionChart  │            │
│                          └──────────────────┘            │
└────────────────────────────────────────────────────────────┘
```

---

## 🎯 User Interaction Flow

### 1. Initial Load
```
1. User opens http://localhost:3001
2. Terminal loads with empty state
3. SSE connection established
4. Intelligence starts streaming (5-15s delays)
5. Each new item flashes amber for 2s
6. Status bar shows "LIVE STREAM" + "ONLINE"
```

### 2. Viewing Intelligence
```
1. User clicks intelligence row in feed
2. TARGET_ACQUIRED HUD appears (2s)
3. Spotlight panel switches to active mode
4. Executive summary types out (30ms/char)
5. Map animates to region coordinates
6. Risk Level bar fills
7. AI Prediction Chart draws
8. Correlation box appears (if match found)
```

### 3. Switching Languages
```
1. User clicks language button (e.g., TR)
2. System log: "✓ CHANNEL SWITCHED: TR"
3. Feed filters to show TURKEY + GLOBAL
4. Spotlight updates if selected item filtered out
5. Language button highlights in amber
```

### 4. Scanning Mode
```
1. User deselects intelligence (or none selected)
2. Spotlight shows rotating radar
3. PAST_EVENTS_LOG displays last 5 items
4. User can click any past event to view
5. Spotlight switches to active mode
```

---

## 📱 Responsive Behavior

### Desktop (1920x1080)
```
┌────────────────────────────────────────────────────────────┐
│ [Sentiment: 25%] [Intelligence Feed: 50%] [Spotlight: 25%] │
└────────────────────────────────────────────────────────────┘
```

### Tablet (1024x768)
```
┌────────────────────────────────────────────────────────────┐
│ [Sentiment: 30%] [Intelligence Feed: 70%]                  │
│ [Spotlight: 100% - Below]                                  │
└────────────────────────────────────────────────────────────┘
```

### Mobile (375x667)
```
┌────────────────────────────────────────────────────────────┐
│ [Sentiment: 100% - Collapsed]                              │
│ [Intelligence Feed: 100%]                                  │
│ [Spotlight: 100% - Modal]                                  │
└────────────────────────────────────────────────────────────┘
```

---

## 🎭 Visual Effects Catalog

### 1. CRT Scanlines
```css
background: repeating-linear-gradient(
  0deg,
  transparent,
  transparent 2px,
  rgba(0, 255, 0, 0.03) 2px,
  rgba(0, 255, 0, 0.03) 4px
);
animation: scanline 8s linear infinite;
```

### 2. Radar Ping
```
3 concentric circles expanding outward
Scale: 1 → 2 → 3
Opacity: 0.3 → 0.15 → 0
Duration: 2s per wave
Delay: 0.6s between waves
```

### 3. Typing Effect
```
Speed: 30ms per character
Cursor: Blinking block (▊)
Color: Terminal Green (#00FF00)
```

### 4. Flash Effect
```
Duration: 2s (new items) or 1s (updates)
Color: Amber (#FFB800) or Signal color
Scale: 1.02 (slight zoom)
Shadow: 0 0 20px rgba(255,184,0,0.6)
```

### 5. Correlation Box
```
Animation: Fade in + slide up
Duration: 0.5s
Border: Green (#00FF00) with 50% opacity
Background: Black with 90% opacity
```

---

## 🔧 Configuration Options

### Streaming vs Polling
```typescript
const [useStreaming, setUseStreaming] = useState(true)

// Streaming: Real-time SSE (default)
// Polling: 5-second intervals (fallback)
```

### Language Filtering
```typescript
const regions = {
  'en': 'WALL ST',
  'ar': 'GULF',
  'de': 'EUROPE',
  'es': 'LATAM',
  'fr': 'EUROPE',
  'tr': 'TURKEY'
}
```

### Timing Constants
```typescript
TYPING_SPEED = 30ms        // Per character
FLASH_DURATION = 2000ms    // New item flash
TARGET_HUD_DURATION = 2000ms // HUD display
CORRELATION_THRESHOLD = 50  // Percentage match
PAST_EVENTS_COUNT = 5       // Timeline items
```

---

## ✨ Summary

The SIAIntel Terminal provides a complete Bloomberg Terminal-style experience with:

- **Real-time streaming** via SSE (5-15s delays)
- **Interactive spotlight** with typing effect and map
- **TARGET_ACQUIRED HUD** with real coordinates
- **Correlation detection** with past events
- **PAST_EVENTS_LOG** timeline (widened for full titles)
- **AI Prediction Chart** with sentiment-based trends
- **Language filtering** by region
- **Zero errors** (TypeScript, hydration, console)

All features are production-ready and provide an exceptional user experience for institutional investors and high-net-worth individuals.

---

**Status**: ✅ COMPLETE  
**Last Updated**: February 28, 2026  
**Visual Guide Version**: 1.0
