# THE LIVE PULSE - Visual Guide

**What You'll See**: Real-time streaming intelligence with amber flash effects

---

## Before (Polling Mode)

```
┌─────────────────────────────────────────────────────────────┐
│ ● CONNECTED                                                  │
├─────────────────────────────────────────────────────────────┤
│ TIME     │ INTELLIGENCE                    │ REGION │ ...   │
├─────────────────────────────────────────────────────────────┤
│ 21:30:00 │ FED INTEREST RATE...           │ WALL ST│ ...   │
│ 21:30:00 │ BITCOIN BREAKS $50K...         │ GLOBAL │ ...   │
│ 21:30:00 │ MIDDLE EAST OIL...             │ GULF   │ ...   │
└─────────────────────────────────────────────────────────────┘
```

**Issues**:
- All intelligence arrives at once (same timestamp)
- No visual feedback for new items
- Feels static and batch-processed
- Polling every 5 seconds (wasteful)

---

## After (Live Pulse Mode)

```
┌─────────────────────────────────────────────────────────────┐
│ ● LIVE STREAM                                                │
├─────────────────────────────────────────────────────────────┤
│ TIME     │ INTELLIGENCE                    │ REGION │ ...   │
├─────────────────────────────────────────────────────────────┤
│ 21:30:45 │ FED INTEREST RATE...           │ WALL ST│ ...   │
│          │                                                   │
│          │ [Waiting 7 seconds...]                           │
│          │                                                   │
└─────────────────────────────────────────────────────────────┘

[7 seconds later...]

┌─────────────────────────────────────────────────────────────┐
│ ● LIVE STREAM                                                │
├─────────────────────────────────────────────────────────────┤
│ TIME     │ INTELLIGENCE                    │ REGION │ ...   │
├─────────────────────────────────────────────────────────────┤
│ 21:30:45 │ FED INTEREST RATE...           │ WALL ST│ ...   │
│ 21:30:52 │ ⚡ BITCOIN BREAKS $50K...       │ GLOBAL │ ...   │ ← AMBER FLASH!
│          │                                                   │
└─────────────────────────────────────────────────────────────┘

[13 seconds later...]

┌─────────────────────────────────────────────────────────────┐
│ ● LIVE STREAM                                                │
├─────────────────────────────────────────────────────────────┤
│ TIME     │ INTELLIGENCE                    │ REGION │ ...   │
├─────────────────────────────────────────────────────────────┤
│ 21:30:45 │ FED INTEREST RATE...           │ WALL ST│ ...   │
│ 21:30:52 │ BITCOIN BREAKS $50K...         │ GLOBAL │ ...   │
│ 21:31:05 │ ⚡ MIDDLE EAST OIL...           │ GULF   │ ...   │ ← AMBER FLASH!
└─────────────────────────────────────────────────────────────┘
```

**Improvements**:
- Intelligence arrives one-by-one
- Unique timestamps (millisecond precision)
- 2-second amber flash for new items
- Feels live and dynamic
- Single SSE connection (efficient)

---

## Flash Effect Timeline

```
New Intelligence Arrives
         ↓
┌────────────────────────────────────────────────────────────┐
│ T=0s: Row appears with AMBER background                    │
│       Text: BLACK for contrast                             │
│       Glow: 20px amber shadow                              │
│       Scale: 1.02x (subtle zoom)                           │
│                                                             │
│ [User notices the flash]                                   │
│                                                             │
│ T=2s: Smooth transition to normal                          │
│       Background: Transparent                              │
│       Text: Original color                                 │
│       Glow: None                                           │
│       Scale: 1.0x                                          │
└────────────────────────────────────────────────────────────┘
```

**CSS**:
```css
/* Flash state (2 seconds) */
background: #FFB800;
color: black;
box-shadow: 0 0 20px rgba(255, 184, 0, 0.6);
transform: scale(1.02);
transition: all 500ms;

/* Normal state */
background: transparent;
color: inherit;
box-shadow: none;
transform: scale(1.0);
transition: all 500ms;
```

---

## Status Indicators

### Left Panel (System Info)

**Before**:
```
┌─────────────────────┐
│ SESSION: ACTIVE     │
│ REGION: EN          │
│ INTEL COUNT: 5      │
│ BACKEND: ONLINE     │
└─────────────────────┘
```

**After**:
```
┌─────────────────────┐
│ SESSION: ACTIVE     │
│ REGION: EN          │
│ INTEL COUNT: 5      │
│ MODE: LIVE PULSE    │ ← NEW (amber)
│ STATUS: ONLINE      │ ← NEW (green)
└─────────────────────┘
```

### Status Bar (Bottom)

**Before**:
```
● CONNECTED | [System logs...] | LATENCY: 12ms | UPTIME: 99.98%
```

**After**:
```
● LIVE STREAM | [System logs...] | LATENCY: 12ms | UPTIME: 99.98%
   ↑ Green when connected, Red when offline
```

---

## System Logs

**Before**:
```
[21:30:00] ✓ 5 INTELLIGENCE LOADED
[21:30:05] ✓ 5 INTELLIGENCE LOADED
[21:30:10] ✓ 5 INTELLIGENCE LOADED
```

**After**:
```
[21:30:45] 📡 LIVE: FED INTEREST RATE SPECULATION DRIVES...
[21:30:52] 📡 LIVE: BITCOIN BREAKS $50K RESISTANCE - INS...
[21:31:05] 📡 LIVE: MIDDLE EAST OIL PIPELINE DISRUPTION...
```

---

## Connection States

### 1. Connected (Normal)

```
┌─────────────────────────────────────────────────────────────┐
│ ● LIVE STREAM (green)                                        │
│                                                              │
│ MODE: LIVE PULSE (amber)                                     │
│ STATUS: ONLINE (green)                                       │
│ LATENCY: 12ms (amber)                                        │
│ UPTIME: 99.98% (green)                                       │
└─────────────────────────────────────────────────────────────┘
```

### 2. Disconnected (Error)

```
┌─────────────────────────────────────────────────────────────┐
│ ● STREAM OFFLINE (red)                                       │
│                                                              │
│ MODE: LIVE PULSE (amber)                                     │
│ STATUS: OFFLINE (red)                                        │
│ LATENCY: --- (red)                                           │
│ UPTIME: 0.00% (red)                                          │
│                                                              │
│ [Reconnecting in 5 seconds...]                              │
└─────────────────────────────────────────────────────────────┘
```

### 3. Reconnecting (Recovery)

```
┌─────────────────────────────────────────────────────────────┐
│ ● LIVE STREAM (green)                                        │
│                                                              │
│ [21:31:20] 🔄 RECONNECTED                                   │
│ [21:31:20] 📡 LIVE: TESLA BATTERY BREAKTHROUGH...           │
│                                                              │
│ MODE: LIVE PULSE (amber)                                     │
│ STATUS: ONLINE (green)                                       │
└─────────────────────────────────────────────────────────────┘
```

---

## Timing Examples

### Fast Sequence (5-7 seconds)
```
21:30:00.123 - Intelligence #1 arrives
21:30:05.456 - Intelligence #2 arrives (5.3s delay)
21:30:11.789 - Intelligence #3 arrives (6.3s delay)
21:30:17.012 - Intelligence #4 arrives (5.2s delay)
```

### Slow Sequence (12-15 seconds)
```
21:30:00.123 - Intelligence #1 arrives
21:30:13.456 - Intelligence #2 arrives (13.3s delay)
21:30:28.789 - Intelligence #3 arrives (15.3s delay)
21:30:41.012 - Intelligence #4 arrives (12.2s delay)
```

### Mixed Sequence (realistic)
```
21:30:00.123 - Intelligence #1 arrives
21:30:07.456 - Intelligence #2 arrives (7.3s delay)
21:30:20.789 - Intelligence #3 arrives (13.3s delay)
21:30:26.012 - Intelligence #4 arrives (5.2s delay)
21:30:40.345 - Intelligence #5 arrives (14.3s delay)
```

---

## Color Palette

### Flash Effect
- **Background**: `#FFB800` (Amber)
- **Text**: `#000000` (Black)
- **Shadow**: `rgba(255, 184, 0, 0.6)` (Amber glow)

### Status Colors
- **Online**: `#00FF00` (Terminal Green)
- **Offline**: `#FF0000` (Bloomberg Red)
- **Amber**: `#FFB800` (Highlight)
- **Gray**: `#A0A0A0` (Normal text)

### Sentiment Colors
- **BULLISH**: `#00FF00` (Green)
- **BEARISH**: `#FF0000` (Red)
- **NEUTRAL**: `#FFB800` (Amber)

---

## User Experience Flow

```
1. User opens terminal
   ↓
2. Status shows "● LIVE STREAM" (green)
   ↓
3. First intelligence arrives after 5-15s
   ↓
4. Row flashes AMBER for 2 seconds
   ↓
5. User reads the intelligence
   ↓
6. Flash fades to normal
   ↓
7. Next intelligence arrives after 5-15s
   ↓
8. Repeat steps 4-7
   ↓
9. User feels the "live pulse" rhythm
```

---

## Comparison: Polling vs Streaming

### Polling (Old)
```
Frontend: "Give me all intelligence"
Backend:  "Here are 5 items" (batch)
Frontend: [Displays all at once]
[Wait 5 seconds]
Frontend: "Give me all intelligence"
Backend:  "Here are 5 items" (same batch)
Frontend: [No change]
[Wait 5 seconds]
...repeat forever...
```

### Streaming (New)
```
Frontend: "Start streaming"
Backend:  "Connected, streaming..."
[Wait 7 seconds]
Backend:  "Here's item #1"
Frontend: [Flash amber, display]
[Wait 13 seconds]
Backend:  "Here's item #2"
Frontend: [Flash amber, display]
[Wait 5 seconds]
Backend:  "Here's item #3"
Frontend: [Flash amber, display]
...continues until all items sent...
```

---

## What Makes It Feel "Live"

1. **Unpredictable Timing**: 5-15 second random delays
2. **Visual Feedback**: 2-second amber flash
3. **Real-time Timestamps**: Millisecond precision
4. **Smooth Animations**: 500ms transitions
5. **Connection Status**: Live indicators
6. **System Logs**: Real-time updates
7. **Single Stream**: No polling overhead
8. **Authentic Rhythm**: Feels like Bloomberg Terminal

---

## Expected Behavior

✅ Intelligence arrives one-by-one  
✅ Each row flashes amber for 2 seconds  
✅ Timestamps show exact arrival time  
✅ Status shows "LIVE STREAM" when connected  
✅ Automatic reconnection on disconnect  
✅ System logs show each arrival  
✅ Smooth 60fps animations  
✅ Low CPU/memory usage  

---

**The terminal now has a heartbeat. You can feel the intelligence flowing in real-time.**
