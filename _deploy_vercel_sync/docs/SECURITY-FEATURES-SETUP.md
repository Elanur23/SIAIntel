# Security Features Setup Guide

This guide covers the setup and configuration of the 4 new security features implemented for Next.js 14 + NextAuth.js 5 + Prisma.

## Features Implemented

1. **Idle Timeout** - Automatic session expiration after 30 minutes of inactivity
2. **Privilege Escalation Tests** - Jest test suite for RBAC security
3. **Audit Log Cleanup** - BullMQ job for 90-day retention policy
4. **2FA Recovery Flow** - Recovery codes for 2FA account recovery

---

## 1. Idle Timeout

### Overview
Automatically expires user sessions after 30 minutes of inactivity. Provides client-side warnings and activity tracking.

### Files Created
- `lib/auth/idle-timeout.ts` - Core timeout logic
- `app/api/auth/session-status/route.ts` - Session status endpoint
- `components/SessionKeepalive.tsx` - Client-side activity monitor
- `middleware.ts` - Updated with timeout enforcement

### Configuration

Add to `.env.local`:
```bash
IDLE_TIMEOUT_MINUTES=30
NEXTAUTH_SECRET=your-secret-here
```

### Integration

1. **Update your root layout** (`app/layout.tsx`):
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

2. **Database migration**:
```bash
npx prisma migrate dev --name add-idle-timeout
```

### Testing

```bash
# Test session status endpoint
curl http://localhost:3000/api/auth/session-status \
  -H "Cookie: next-auth.session-token=YOUR_TOKEN"

# Expected response:
{
  "authenticated": true,
  "remainingTime": 1800,
  "remainingMinutes": 30,
  "shouldWarn": false
}
```

---

## 2. Privilege Escalation Tests

### Overview
Comprehensive Jest test suite that validates RBAC middleware against privilege escalation attacks.

### Files Created
- `lib/rbac/middleware.ts` - RBAC middleware
- `lib/rbac/__tests__/privilege-escalation.test.ts` - Test suite

### Test Coverage

- ✅ Viewer accessing Admin endpoints
- ✅ Token manipulation attempts
- ✅ Role field tampering
- ✅ Editor accessing Admin-only routes
- ✅ Session hijacking attempts
- ✅ Role elevation prevention
- ✅ hasRole utility validation

### Running Tests

```bash
# Install Jest if not already installed
npm install --save-dev jest @types/jest ts-jest

# Run tests
npm test lib/rbac/__tests__/privilege-escalation.test.ts

# Run with coverage
npm test -- --coverage lib/rbac/__tests__/
```

### Usage in API Routes

```typescript
import { requireRole } from '@/lib/rbac/middleware'

export async function POST(request: NextRequest) {
  // Require admin role
  const authResult = await requireRole(request, ['admin'])
  
  if (authResult.error) {
    return authResult.error
  }
  
  const { user } = authResult
  // user.id, user.role, user.username available
  
  // Your logic here
}
```

---

## 3. Audit Log Cleanup (BullMQ)

### Overview
Automated daily job that deletes audit logs older than 90 days. Runs at 02:00 daily with Slack alerts on failure.

### Files Created
- `lib/jobs/audit-cleanup.ts` - BullMQ job implementation

### Configuration

Add to `.env.local`:
```bash
# Redis connection (required for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Slack webhook for error alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
```

### Installation

```bash
# Install BullMQ and Redis client
npm install bullmq ioredis

# Start Redis (if not running)
# macOS: brew services start redis
# Linux: sudo systemctl start redis
# Windows: Use Redis for Windows or Docker
```

### Setup

Create a worker script (`scripts/start-audit-cleanup-worker.ts`):

```typescript
import { createAuditCleanupWorker, scheduleAuditCleanup } from '@/lib/jobs/audit-cleanup'

async function main() {
  console.log('Starting audit cleanup worker...')
  
  // Create worker
  const worker = createAuditCleanupWorker()
  
  // Schedule repeatable job
  await scheduleAuditCleanup()
  
  console.log('Audit cleanup worker started')
  console.log('Scheduled to run daily at 02:00')
}

main().catch(console.error)
```

Run the worker:
```bash
npx tsx scripts/start-audit-cleanup-worker.ts
```

### Manual Trigger (Testing)

```typescript
import { triggerManualCleanup } from '@/lib/jobs/audit-cleanup'

// Trigger cleanup immediately
const job = await triggerManualCleanup()
console.log('Cleanup job queued:', job.id)
```

### Monitoring

Check BullMQ dashboard:
```bash
npm install -g bull-board
bull-board
```

---

## 4. 2FA Recovery Flow

### Overview
Allows users to recover their account using one-time recovery codes when 2FA device is unavailable.

### Files Created
- `lib/auth/recovery-codes.ts` - Recovery code utilities
- `app/api/auth/recovery/verify/route.ts` - Verification endpoint
- `app/api/auth/recovery/regenerate/route.ts` - Regeneration endpoint

### Database Migration

```bash
npx prisma migrate dev --name add-recovery-codes
```

### API Endpoints

#### 1. Verify Recovery Code (Login)

```bash
POST /api/auth/recovery/verify
Content-Type: application/json

{
  "username": "admin",
  "password": "password123",
  "recoveryCode": "a1b2c3d4e5f6g7h8..."
}

# Response:
{
  "success": true,
  "sessionToken": "...",
  "user": { "id": "...", "username": "admin", "role": "admin" },
  "warning": "Recovery code used. Please regenerate your recovery codes."
}
```

#### 2. Regenerate Recovery Codes

```bash
POST /api/auth/recovery/regenerate
Authorization: Bearer YOUR_SESSION_TOKEN

# Response:
{
  "success": true,
  "recoveryCodes": [
    "a1b2c3d4e5f6g7h8...",
    "i9j0k1l2m3n4o5p6...",
    ...
  ],
  "warning": "Save these codes in a secure location. They will not be shown again."
}
```

#### 3. Check Recovery Code Status

```bash
GET /api/auth/recovery/regenerate
Authorization: Bearer YOUR_SESSION_TOKEN

# Response:
{
  "total": 8,
  "unused": 6,
  "used": 2
}
```

### Integration Example

```typescript
// Generate recovery codes when enabling 2FA
import { generateRecoveryCodes, saveRecoveryCodes } from '@/lib/auth/recovery-codes'

async function enable2FA(userId: string) {
  // ... enable 2FA logic
  
  // Generate recovery codes
  const codes = generateRecoveryCodes(8)
  await saveRecoveryCodes(userId, codes)
  
  // Show codes to user (one-time display)
  return { codes }
}
```

---

## Environment Variables Summary

Create or update `.env.local`:

```bash
# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Idle Timeout
IDLE_TIMEOUT_MINUTES=30

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Slack Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Database
DATABASE_URL="file:./dev.db"
```

---

## Testing Checklist

### Idle Timeout
- [ ] Session expires after 30 minutes of inactivity
- [ ] Warning appears at 5 minutes remaining
- [ ] Activity resets the timer
- [ ] Expired session redirects to login

### RBAC Tests
- [ ] All 7 test suites pass
- [ ] Viewer cannot access admin routes
- [ ] Token manipulation is rejected
- [ ] Role hierarchy is enforced

### Audit Cleanup
- [ ] Job runs at 02:00 daily
- [ ] Logs older than 90 days are deleted
- [ ] Deletion count is logged
- [ ] Slack alert sent on failure

### 2FA Recovery
- [ ] Recovery codes can be generated
- [ ] Codes are bcrypt hashed
- [ ] Used codes are marked (not deleted)
- [ ] Login with recovery code works
- [ ] Regeneration requires authentication

---

## Common Issues

### Issue: Redis connection failed
**Solution**: Ensure Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

### Issue: Jest tests fail with "Cannot find module"
**Solution**: Configure Jest for TypeScript:
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
}
```

### Issue: Session not updating on activity
**Solution**: Ensure SessionKeepalive is inside SessionProvider:
```typescript
<SessionProvider>
  <SessionKeepalive />
  {children}
</SessionProvider>
```

### Issue: Recovery codes not working
**Solution**: Check bcrypt is installed:
```bash
npm install bcryptjs @types/bcryptjs
```

---

## Security Best Practices

1. **Idle Timeout**: Use HTTPS in production to prevent session hijacking
2. **RBAC**: Always validate roles server-side, never trust client
3. **Audit Cleanup**: Monitor Slack alerts for cleanup failures
4. **Recovery Codes**: Display codes only once, force user to save them

---

## Production Deployment

1. Set all environment variables in production
2. Run database migrations: `npx prisma migrate deploy`
3. Start BullMQ worker as a separate process
4. Monitor Redis memory usage
5. Set up log aggregation for audit events
6. Configure Slack webhook for alerts

---

## Support

For issues or questions:
- Check logs: `tail -f logs/security.log`
- Review audit logs: `SELECT * FROM AuditLog ORDER BY timestamp DESC LIMIT 100`
- Test endpoints with curl or Postman

**Last Updated**: March 21, 2026
**Version**: 1.0.0
