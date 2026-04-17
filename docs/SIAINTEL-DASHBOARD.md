# 🎛️ SIAIntel Command Center Dashboard

**Professional News Flow Dashboard for SIAIntel Autonomous Media Factory**

## Overview

Bloomberg Terminal-style dashboard for monitoring and managing the SIAIntel autonomous video production system. Real-time monitoring of 6-language content generation with institutional-grade UI.

## Features

### 1. Live Feed
- Real-time video production monitoring
- 6-language content cards with flags
- Sentiment indicators (BULLISH/BEARISH/NEUTRAL)
- Quick actions (Play, Publish, Edit)
- Grid layout for easy scanning

### 2. Video Archive
- Complete video history table
- Sortable columns (Language, Title, Size, Date)
- Quick search and filter
- Bulk actions support

### 3. Analytics Dashboard
- Production overview metrics
- Performance statistics
- Success rate tracking
- Language distribution charts
- Cycle time analysis

### 4. System Logs
- Real-time log streaming
- Terminal-style interface
- Color-coded messages
- Searchable log history
- Export functionality

### 5. Live Terminal (Bottom-Right)
- Floating terminal window
- Real-time system activity
- Non-intrusive monitoring
- Auto-scroll latest logs

## Design System

### Color Palette
```css
Background: #001F3F (Deep Navy)
Secondary: #002855 (Navy Blue)
Accent: #C0C0C0 (Intelligence Silver)
Success: #00FF41 (Neon Green)
Warning: #FFD700 (Gold)
Error: #FF4136 (Red)
```

### Typography
```css
Font Family: Monospace (Courier New, Monaco)
Heading: Bold, 18-24px
Body: Regular, 14px
Small: 12px
Terminal: 11px
```

### Components
- Cards with subtle borders
- Hover effects for interactivity
- Smooth transitions (200ms)
- Consistent spacing (4px grid)
- Icon-first design

## API Integration

### Python Backend Endpoints

**System Control:**
```bash
POST /start          # Start autonomous cycle
POST /stop           # Stop system
POST /cycle/trigger  # Manual cycle trigger
```

**Data Retrieval:**
```bash
GET /stats           # System statistics
GET /videos/recent   # Recent videos
GET /cycle/stats     # Cycle performance
GET /news            # Intelligence feed
```

**Monitoring:**
```bash
GET /                # System info
```

### Next.js Proxy API

```typescript
// Proxy requests through Next.js
GET  /api/siaintel/proxy?endpoint=/stats
POST /api/siaintel/proxy?endpoint=/start
```

## Usage

### 1. Start Python Backend

```bash
cd sovereign-core
python main.py
```

Backend will run on `http://localhost:8000`

### 2. Start Next.js Frontend

```bash
npm run dev
```

Frontend will run on `http://localhost:3000`

### 3. Access Dashboard

```
http://localhost:3000/admin/siaintel-dashboard
```

## Dashboard Sections

### Top Bar
- System status indicator (LIVE/IDLE)
- Start/Stop system controls
- Manual cycle trigger
- Real-time stats (5 metrics)

### Sidebar Navigation
- Live Feed (default view)
- Video Archive (table view)
- Analytics (charts & metrics)
- System Logs (terminal view)
- Language distribution stats

### Main Content Area
- Dynamic content based on active tab
- Responsive grid layouts
- Interactive cards and tables
- Modal video player

### Live Terminal
- Fixed bottom-right position
- 10 most recent log entries
- Auto-refresh every 10 seconds
- Collapsible/expandable

## Key Metrics

### Top Stats Bar
1. **Active Cycles**: Total production cycles run
2. **Videos Generated**: Total videos produced
3. **Success Rate**: Percentage of successful operations
4. **Last Cycle**: Duration of most recent cycle
5. **Languages**: Number of supported languages (6)

### Analytics View
- Total articles processed
- Total videos generated
- Videos per article ratio
- Average cycle time
- Success rate percentage
- Language distribution

## Video Cards

Each video card displays:
- Language flag and name
- Article title (truncated)
- File size and timestamp
- Status indicator (✓ Complete)
- Action buttons (Play, Publish)

### Card Actions
- **Play**: Open video player modal
- **Publish**: Publish to siaintel.com
- **Edit**: Modify video script

## Video Player Modal

Full-screen modal with:
- Language indicator
- Video title
- Video player (aspect ratio 16:9)
- Action buttons (Publish, Edit)
- Close button

## Real-time Updates

Dashboard auto-refreshes every 10 seconds:
- Fetches latest videos
- Updates system stats
- Refreshes cycle metrics
- Appends new logs

## Responsive Design

### Desktop (1920px+)
- 3-column video grid
- Full sidebar visible
- All stats displayed
- Large terminal window

### Laptop (1280px+)
- 2-column video grid
- Sidebar visible
- Compact stats
- Medium terminal

### Tablet (768px+)
- 1-column video grid
- Collapsible sidebar
- Essential stats only
- Small terminal

## Performance

### Optimization
- Lazy loading for video thumbnails
- Pagination for large datasets
- Debounced search inputs
- Memoized components
- Efficient re-renders

### Loading States
- Skeleton screens
- Loading spinners
- Progressive enhancement
- Graceful degradation

## Error Handling

### Connection Errors
- Retry logic (3 attempts)
- Fallback UI states
- Error notifications
- Offline mode support

### Data Errors
- Validation checks
- Default values
- Error boundaries
- User-friendly messages

## Keyboard Shortcuts

```
Ctrl + R: Refresh data
Ctrl + S: Start/Stop system
Ctrl + T: Trigger manual cycle
Ctrl + L: Focus logs
Ctrl + 1-4: Switch tabs
```

## Customization

### Environment Variables

```env
# .env.local
SIAINTEL_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_REFRESH_INTERVAL=10000
NEXT_PUBLIC_MAX_VIDEOS_DISPLAY=20
```

### Theme Customization

Edit `app/admin/siaintel-dashboard/page.tsx`:

```typescript
// Change colors
const THEME = {
  background: '#001F3F',
  secondary: '#002855',
  accent: '#C0C0C0',
  success: '#00FF41',
  warning: '#FFD700',
  error: '#FF4136'
}
```

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Setup

```bash
# Production environment
SIAINTEL_BACKEND_URL=https://api.siaintel.com
NODE_ENV=production
```

## Security

### API Authentication
- API key validation
- Rate limiting
- CORS configuration
- Request validation

### Data Protection
- No sensitive data in logs
- Secure video URLs
- Encrypted connections
- Access control

## Monitoring

### Health Checks
- Backend connectivity
- API response times
- Error rates
- System uptime

### Alerts
- System failures
- High error rates
- Low success rates
- Disk space warnings

## Troubleshooting

### Dashboard Not Loading
```bash
# Check backend is running
curl http://localhost:8000

# Check Next.js is running
curl http://localhost:3000

# Check browser console for errors
```

### No Data Displayed
```bash
# Verify backend has data
curl http://localhost:8000/stats

# Check API proxy
curl http://localhost:3000/api/siaintel/proxy?endpoint=/stats

# Clear browser cache
```

### Videos Not Playing
```bash
# Check video file exists
ls sovereign-core/output/videos/

# Verify file permissions
chmod 644 sovereign-core/output/videos/*.mp4

# Check video codec support
```

## Future Enhancements

### Phase 1 (Current)
- [x] Live feed monitoring
- [x] Video archive table
- [x] Basic analytics
- [x] System logs
- [x] Real-time updates

### Phase 2 (Next)
- [ ] Advanced charts (Chart.js)
- [ ] Video player integration
- [ ] Sentiment timeline
- [ ] Export reports
- [ ] User preferences

### Phase 3 (Future)
- [ ] Multi-user support
- [ ] Role-based access
- [ ] Webhook integrations
- [ ] Mobile app
- [ ] AI insights

## Support

### Documentation
- [SIAIntel Complete Guide](./SIAINTEL-COMPLETE.md)
- [Python Backend Docs](./SOVEREIGN-CORE-COMPLETE.md)
- [API Reference](./API-REFERENCE.md)

### Community
- GitHub Issues
- Discord Server
- Email Support

---

**SIAIntel Command Center Dashboard**

Version: 1.0.0
Status: ✅ OPERATIONAL
Access: http://localhost:3000/admin/siaintel-dashboard

🎛️ **Professional News Flow Monitoring for Institutional Investors** 🎛️
