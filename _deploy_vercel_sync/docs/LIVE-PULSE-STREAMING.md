# THE LIVE PULSE - Real-time Intelligence Streaming

**Date**: February 28, 2026  
**Status**: ✅ IMPLEMENTED

---

## Overview

"The Live Pulse" transforms the terminal from a polling-based system to a real-time streaming experience. Intelligence arrives one-by-one with realistic 5-15 second delays, creating an authentic live feed that feels like watching a Bloomberg Terminal.

---

## Architecture

### Backend: Server-Sent Events (SSE)

**Endpoint**: `GET /api/intelligence/stream`

```python
@app.get("/api/intelligence/stream")
async def stream_intelligence():
    """
    Streams intelligence one-by-one with random delays
    Uses Server-Sent Events (SSE) for real-time updates
    """
    async def event_generator():
        for intel in intelligence_queue:
            # Random delay: 5-15 seconds
            delay = random.uniform(5.0, 15.0)
            await asyncio.sleep(delay)
            
            # Real-time timestamp
            intel["time"] = datetime.now().strftime("%H:%M:%S.%f")[:-3]
            
            # Stream as SSE
            yield f"data: {json.dumps(intel)}\n\n"
    
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```

**Features**:
- Random delays between 5-15 seconds per intelligence
- Real-time millisecond timestamps
- Heartbeat every 30 seconds to keep connection alive
- Automatic error handling and reconnection

---

### Frontend: EventSource Hook

**Hook**: `lib/hooks/useLivePulse.ts`

```typescript
export default function useLivePulse() {
  const [intelligence, setIntelligence] = useState<IntelligenceItem[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [newItemId, setNewItemId] = useState<string | null>(null)
  
  useEffect(() => {
    const eventSource = new EventSource('http://localhost:8000/api/intelligence/stream')
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      // Add to intelligence list
      setIntelligence(prev => [...prev, data])
      
      // Trigger 2-second flash
      setNewItemId(data.id)
      setTimeout(() => setNewItemId(null), 2000)
    }
    
    return () => eventSource.close()
  }, [])
  
  return { intelligence, isConnected, newItemId }
}
```

**Features**:
- EventSource for SSE connection
- Automatic reconnection on disconnect (5s delay)
- New item flash detection
- Connection status tracking

---

## Visual Effects

### 2-Second Amber Flash

When new intelligence arrives, the row flashes amber for 2 seconds:

```typescript
className={`
  transition-all duration-500
  ${newItemId === String(item.id)
    ? 'bg-[#FFB800] text-black shadow-[0_0_20px_rgba(255,184,0,0.6)] scale-[1.02]'
    : ''
  }
`}
```

**Effect Details**:
- Background: Amber (#FFB800)
- Text: Black for contrast
- Glow: 20px amber shadow
- Scale: 1.02x (subtle zoom)
- Duration: 2 seconds
- Transition: Smooth 500ms

---

## Streaming vs Polling

The system supports both modes:

### LIVE PULSE Mode (Default)
- Real-time SSE streaming
- 5-15 second random delays
- Authentic live feed experience
- Lower server load (single connection)
- Status: "LIVE STREAM"

### Polling Mode (Fallback)
- 5-second polling interval
- Batch updates
- Fallback for SSE issues
- Status: "POLLING"

**Toggle**:
```typescript
const [useStreaming, setUseStreaming] = useState(true)
```

---

## Demo Data

8 intelligence items stream in sequence:

1. **FED INTEREST RATE SPECULATION** (WALL ST, BULLISH, 8%)
2. **BITCOIN BREAKS $50K** (GLOBAL, BULLISH, 9%)
3. **MIDDLE EAST OIL DISRUPTION** (GULF, BEARISH, 7%)
4. **AI CHIP SHORTAGE** (ASIA, BEARISH, 6%)
5. **ECB HAWKISH STANCE** (EUROPE, NEUTRAL, 5%)
6. **TESLA BATTERY BREAKTHROUGH** (WALL ST, BULLISH, 8%)
7. **CHINA PROPERTY STABILIZATION** (ASIA, NEUTRAL, 6%)
8. **GOLD ALL-TIME HIGH** (GLOBAL, BULLISH, 7%)

Each arrives 5-15 seconds after the previous one.

---

## Connection Management

### Status Indicators

**Left Panel**:
- MODE: "LIVE PULSE" (amber) or "POLLING" (gray)
- STATUS: "ONLINE" (green) or "OFFLINE" (red)

**Status Bar**:
- "● LIVE STREAM" (green) when connected
- "● STREAM OFFLINE" (red) when disconnected
- Latency: 12ms (amber) or --- (red)
- Uptime: 99.98% (green) or 0.00% (red)

### Reconnection Logic

```typescript
eventSource.onerror = (error) => {
  console.error('[LIVE-PULSE] Connection error')
  setIsConnected(false)
  eventSource.close()
  
  // Reconnect after 5 seconds
  setTimeout(() => connectStream(), 5000)
}
```

**Behavior**:
- Automatic reconnection on disconnect
- 5-second delay between attempts
- Infinite retry (no max attempts)
- Graceful degradation to polling mode

---

## System Logs

New intelligence arrivals are logged:

```typescript
addSystemLog(`📡 LIVE: ${newItem.title.substring(0, 40)}...`)
```

**Log Format**:
```
[21:30:45] 📡 LIVE: FED INTEREST RATE SPECULATION DRIVES...
[21:31:02] 📡 LIVE: BITCOIN BREAKS $50K RESISTANCE - INS...
[21:31:18] 📡 LIVE: MIDDLE EAST OIL PIPELINE DISRUPTION...
```

---

## Performance

### Backend
- Async streaming (non-blocking)
- Memory efficient (generator pattern)
- Heartbeat prevents timeout
- Graceful error handling

### Frontend
- Single EventSource connection
- No polling overhead
- Efficient state updates
- Smooth animations (GPU-accelerated)

### Network
- SSE: ~1KB per intelligence
- Heartbeat: ~100 bytes every 30s
- Total: ~8KB for full demo sequence
- Bandwidth: Minimal (<1KB/s average)

---

## Testing

### Start Backend
```bash
cd sovereign-core
python main.py
```

### Start Frontend
```bash
npm run dev
```

### Verify Streaming
1. Open http://localhost:3000
2. Watch status: "● LIVE STREAM" (green)
3. Intelligence arrives every 5-15 seconds
4. Each row flashes amber for 2 seconds
5. Timestamps show millisecond precision

### Test Reconnection
1. Stop backend: `Ctrl+C`
2. Status changes to "● STREAM OFFLINE" (red)
3. Restart backend
4. Connection auto-restores in 5 seconds
5. Streaming resumes

---

## Browser Compatibility

### EventSource Support
- ✅ Chrome 6+
- ✅ Firefox 6+
- ✅ Safari 5+
- ✅ Edge 79+
- ❌ IE (not supported)

### Fallback
For browsers without EventSource, system automatically falls back to polling mode.

---

## Future Enhancements

### Phase 2: Real Intelligence Integration
- Connect to Factory pipeline
- Stream real Gemini-analyzed intelligence
- Multi-language support
- Region-based filtering

### Phase 3: Advanced Features
- Pause/resume streaming
- Speed control (delay multiplier)
- Historical playback
- Export stream to CSV

### Phase 4: Enterprise Features
- WebSocket upgrade for bidirectional
- Authentication tokens
- Rate limiting per user
- Analytics tracking

---

## Troubleshooting

### "STREAM OFFLINE" Status

**Cause**: Backend not running or CORS issue

**Solution**:
```bash
# Check backend is running
curl http://localhost:8000/api/intelligence/stream

# Verify CORS in main.py
allow_origins=["*"]
```

### No Intelligence Arriving

**Cause**: EventSource connection failed

**Solution**:
1. Check browser console for errors
2. Verify backend logs show connection
3. Test with curl:
```bash
curl -N http://localhost:8000/api/intelligence/stream
```

### Flash Effect Not Working

**Cause**: `newItemId` state not updating

**Solution**:
1. Check `useLivePulse` hook is imported
2. Verify `newItemId` prop is passed
3. Inspect element for amber classes

---

## Code Locations

**Backend**:
- `sovereign-core/main.py` - SSE endpoint

**Frontend**:
- `lib/hooks/useLivePulse.ts` - Streaming hook
- `app/page.tsx` - Terminal integration

**Styling**:
- Amber flash: `bg-[#FFB800] text-black shadow-[0_0_20px_rgba(255,184,0,0.6)]`
- Transition: `transition-all duration-500`

---

## Success Metrics

✅ Intelligence streams one-by-one  
✅ 5-15 second random delays  
✅ Real-time millisecond timestamps  
✅ 2-second amber flash effect  
✅ Automatic reconnection  
✅ Connection status indicators  
✅ System log integration  
✅ Zero TypeScript errors  

---

**The Live Pulse is operational. Terminal now has authentic streaming intelligence feed.**
