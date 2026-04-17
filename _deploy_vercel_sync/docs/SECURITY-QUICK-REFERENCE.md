# Security Features Quick Reference

**Stack**: Next.js 14 + NextAuth.js 5 + Prisma + BullMQ

---

## 🔒 1. Idle Timeout

**Timeout**: 30 minutes  
**Warning**: 5 minutes before expiration

### Check Session Status
```bash
GET /api/auth/session-status
```

### Integration
```typescript
// app/layout.tsx
<SessionProvider>
  <SessionKeepalive />
  {children}
</SessionProvider>
```

---

## 🛡️ 2. RBAC Middleware

### Protect API Routes
```typescript
import { requireRole } from '@/lib/rbac/middleware'

export async function POST(request: NextRequest) {
  const { user, error } = await requireRole(request, ['admin'])
  if (error) return error
  
  // user.id, user.role, user.username
}
```

### Run Tests
```bash
npm test lib/rbac/__tests__/privilege-escalation.test.ts
```

---

## 🧹 3. Audit Log Cleanup

**Schedule**: Daily at 02:00  
**Retention**: 90 days

### Start Worker
```typescript
import { createAuditCleanupWorker, scheduleAuditCleanup } from '@/lib/jobs/audit-cleanup'

const worker = createAuditCleanupWorker()
await scheduleAuditCleanup()
```

### Manual Trigger
```typescript
import { triggerManualCleanup } from '@/lib/jobs/audit-cleanup'
await triggerManualCleanup()
```

---

## 🔑 4. 2FA Recovery Codes

**Count**: 8 codes per user  
**Hashing**: bcrypt (10 rounds)

### Verify Recovery Code (Login)
```bash
POST /api/auth/recovery/verify
{
  "username": "admin",
  "password": "pass123",
  "recoveryCode": "abc123..."
}
```

### Regenerate Codes
```bash
POST /api/auth/recovery/regenerate
Authorization: Bearer TOKEN
```

### Check Status
```bash
GET /api/auth/recovery/regenerate
Authorization: Bearer TOKEN
```

### Generate Codes
```typescript
import { generateRecoveryCodes, saveRecoveryCodes } from '@/lib/auth/recovery-codes'

const codes = generateRecoveryCodes(8)
await saveRecoveryCodes(userId, codes)
// Display codes to user (one-time only)
```

---

## 📋 Environment Variables

```bash
# NextAuth
NEXTAUTH_SECRET=your-secret
NEXTAUTH_URL=http://localhost:3000

# Idle Timeout
IDLE_TIMEOUT_MINUTES=30

# Redis (BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Slack Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/...

# Database
DATABASE_URL="file:./dev.db"
```

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install bullmq ioredis bcryptjs

# 2. Run migration
npx prisma migrate dev --name add-security-features

# 3. Run tests
npm test

# 4. Test features
npx tsx scripts/test-security-features.ts

# 5. Start worker (separate terminal)
npx tsx scripts/start-audit-cleanup-worker.ts
```

---

## 📊 Test Commands

```bash
# RBAC tests
npm test lib/rbac/__tests__/privilege-escalation.test.ts

# All security tests
npx tsx scripts/test-security-features.ts

# With coverage
npm test -- --coverage lib/rbac/
```

---

## 🔍 Monitoring

```bash
# Check Redis
redis-cli ping

# View audit logs
sqlite3 prisma/dev.db "SELECT * FROM AuditLog ORDER BY timestamp DESC LIMIT 10"

# Check recovery codes
sqlite3 prisma/dev.db "SELECT userId, COUNT(*) as total, SUM(used) as used FROM RecoveryCode GROUP BY userId"
```

---

## 📚 Documentation

- **Setup Guide**: `docs/SECURITY-FEATURES-SETUP.md`
- **Complete Report**: `docs/SECURITY-IMPLEMENTATION-COMPLETE.md`
- **This Reference**: `docs/SECURITY-QUICK-REFERENCE.md`

---

**Version**: 1.0.0  
**Last Updated**: March 21, 2026
