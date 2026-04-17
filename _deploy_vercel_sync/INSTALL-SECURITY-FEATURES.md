# Security Features Installation Guide

**Quick setup guide for the 4 new security features**

---

## 📦 Step 1: Install Dependencies

```bash
npm install bullmq ioredis bcryptjs
npm install --save-dev jest @types/jest ts-jest tsx @types/bcryptjs
```

---

## 🗄️ Step 2: Database Migration

```bash
npx prisma migrate dev --name add-security-features
```

This adds the `RecoveryCode` model to your database.

---

## 🔧 Step 3: Environment Variables

Add to `.env.local`:

```bash
# NextAuth (if not already set)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Idle Timeout
IDLE_TIMEOUT_MINUTES=30

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Slack Alerts (optional but recommended)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

---

## 🔴 Step 4: Start Redis

### macOS (Homebrew)
```bash
brew services start redis
```

### Linux
```bash
sudo systemctl start redis
```

### Windows
Use Redis for Windows or Docker:
```bash
docker run -d -p 6379:6379 redis:alpine
```

### Verify Redis
```bash
redis-cli ping
# Should return: PONG
```

---

## 🧪 Step 5: Run Tests

```bash
# Run RBAC tests
npm run test:rbac

# Run all security tests
npm run test:security-all

# Run with coverage
npm run test:coverage
```

All tests should pass ✅

---

## 🔗 Step 6: Integrate SessionKeepalive

Update your root layout (`app/layout.tsx` or `app/[lang]/layout.tsx`):

```typescript
import SessionKeepalive from '@/components/SessionKeepalive'
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <SessionProvider>
          <SessionKeepalive />
          {children}
        </SessionProvider>
      </body>
    </html>
  )
}
```

---

## 🤖 Step 7: Start BullMQ Worker

In a separate terminal:

```bash
npm run worker:audit-cleanup
```

You should see:
```
✅ Audit Cleanup Worker Started
⏰ Scheduled to run daily at 02:00
🔄 Worker is now listening for jobs...
```

Keep this running in production (use PM2 or systemd).

---

## ✅ Step 8: Verify Installation

### Test Idle Timeout
```bash
curl http://localhost:3000/api/auth/session-status
```

### Test Recovery Code Generation
```typescript
// In your code
import { generateRecoveryCodes, saveRecoveryCodes } from '@/lib/auth/recovery-codes'

const codes = generateRecoveryCodes(8)
await saveRecoveryCodes(userId, codes)
console.log('Recovery codes:', codes)
```

### Test RBAC Middleware
```typescript
// In an API route
import { requireRole } from '@/lib/rbac/middleware'

export async function POST(request: NextRequest) {
  const { user, error } = await requireRole(request, ['admin'])
  if (error) return error
  
  return NextResponse.json({ message: 'Success', user })
}
```

### Test Audit Cleanup (Manual Trigger)
```typescript
import { triggerManualCleanup } from '@/lib/jobs/audit-cleanup'

const job = await triggerManualCleanup()
console.log('Cleanup job queued:', job.id)
```

---

## 🚀 Production Deployment

### 1. Environment Variables
Set all environment variables in your production environment.

### 2. Database Migration
```bash
npx prisma migrate deploy
```

### 3. Start Worker as Service

#### Using PM2
```bash
pm2 start npm --name "audit-cleanup-worker" -- run worker:audit-cleanup
pm2 save
```

#### Using systemd (Linux)
Create `/etc/systemd/system/audit-cleanup-worker.service`:
```ini
[Unit]
Description=Audit Cleanup Worker
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/your-app
ExecStart=/usr/bin/npm run worker:audit-cleanup
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable audit-cleanup-worker
sudo systemctl start audit-cleanup-worker
```

### 4. Monitor Logs
```bash
# PM2
pm2 logs audit-cleanup-worker

# systemd
sudo journalctl -u audit-cleanup-worker -f
```

---

## 📊 Available NPM Scripts

```bash
# Run RBAC tests
npm run test:rbac

# Run all security tests
npm run test:security

# Run integration tests
npm run test:security-all

# Run with coverage
npm run test:coverage

# Start audit cleanup worker
npm run worker:audit-cleanup
```

---

## 🔍 Troubleshooting

### Redis Connection Failed
```bash
# Check if Redis is running
redis-cli ping

# Check Redis logs
redis-cli info
```

### Jest Tests Fail
```bash
# Clear Jest cache
npx jest --clearCache

# Run with verbose output
npm test -- --verbose
```

### Session Not Updating
- Ensure `SessionKeepalive` is inside `SessionProvider`
- Check browser console for errors
- Verify `NEXTAUTH_SECRET` is set

### Recovery Codes Not Working
```bash
# Verify bcryptjs is installed
npm list bcryptjs

# Check database schema
npx prisma studio
```

---

## 📚 Documentation

- **Setup Guide**: `docs/SECURITY-FEATURES-SETUP.md`
- **Complete Report**: `docs/SECURITY-IMPLEMENTATION-COMPLETE.md`
- **Quick Reference**: `docs/SECURITY-QUICK-REFERENCE.md`
- **Summary**: `SECURITY-FEATURES-SUMMARY.md`

---

## ✅ Installation Complete!

You're all set! The 4 security features are now installed and ready to use:

1. ✅ Idle Timeout (30 minutes)
2. ✅ RBAC Tests (7 test suites)
3. ✅ Audit Cleanup (daily at 02:00)
4. ✅ 2FA Recovery (8 codes per user)

**Next**: Start using the features in your application!

---

**Need Help?**
- Check logs: `tail -f logs/security.log`
- Review audit logs: `SELECT * FROM AuditLog ORDER BY timestamp DESC`
- Test endpoints with curl or Postman
