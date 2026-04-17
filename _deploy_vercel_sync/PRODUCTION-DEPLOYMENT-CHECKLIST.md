# Production Deployment Checklist

## ⚠️ CRITICAL: Pre-Deployment Security Audit

### 1. Environment Variables

#### ✅ Required Security Variables
- [ ] `NEXTAUTH_SECRET` - Cryptographically secure (min 32 chars)
  ```bash
  # Generate: openssl rand -base64 48
  NEXTAUTH_SECRET=<48+ character random string>
  ```

- [ ] `SESSION_SECRET` - Different from NEXTAUTH_SECRET
  ```bash
  # Generate: openssl rand -base64 48
  SESSION_SECRET=<48+ character random string>
  ```

- [ ] `ADMIN_SECRET` - Strong admin password (min 16 chars)
  ```bash
  # Generate: openssl rand -base64 32
  ADMIN_SECRET=<32+ character random string>
  ```

#### ✅ Redis Configuration (BullMQ Worker)
- [ ] `REDIS_URL` - Production Redis instance
  ```bash
  # Upstash Redis (recommended): https://upstash.com
  REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379
  
  # Or self-hosted:
  REDIS_URL=redis://your-redis-host:6379
  ```

- [ ] `REDIS_HOST` - Redis hostname
- [ ] `REDIS_PORT` - Redis port (default: 6379)
- [ ] `REDIS_PASSWORD` - Redis password (if required)

#### ✅ Slack/Telegram Alerting
- [ ] `SLACK_WEBHOOK_URL` - For audit log alerts
  ```bash
  SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
  ```

- [ ] `TELEGRAM_BOT_TOKEN` - For security alerts (optional)
- [ ] `TELEGRAM_CHAT_ID` - Alert destination

#### ✅ Node Environment
- [ ] `NODE_ENV=production` - MUST be set to 'production'
  - Enables HSTS header
  - Disables 'unsafe-eval' in CSP
  - Optimizes Next.js build
  - Enables secure cookies

---

### 2. Database Migration: SQLite → Turso (LibSQL)

#### Current State: SQLite (Development Only)
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

#### Production State: Turso (Required)
```prisma
datasource db {
  provider = "sqlite"  // LibSQL is SQLite-compatible
  url      = env("DATABASE_URL")
}
```

#### Migration Steps:

1. **Create Turso Database**
   ```bash
   # Install Turso CLI
   curl -sSfL https://get.tur.so/install.sh | bash
   
   # Login
   turso auth login
   
   # Create database
   turso db create siaintel-prod --location ams  # Amsterdam
   
   # Get connection URL
   turso db show siaintel-prod --url
   # Output: libsql://siaintel-prod-<org>.turso.io
   
   # Create auth token
   turso db tokens create siaintel-prod
   # Output: eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9...
   ```

2. **Update Environment Variables**
   ```bash
   # .env.production
   DATABASE_URL="libsql://siaintel-prod-<org>.turso.io?authToken=eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
   ```

3. **Update Prisma Schema**
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = env("DATABASE_URL")
   }
   
   generator client {
     provider = "prisma-client-js"
     previewFeatures = ["driverAdapters"]
   }
   ```

4. **Install Turso Adapter**
   ```bash
   npm install @libsql/client @prisma/adapter-libsql
   ```

5. **Update Prisma Client Initialization**
   ```typescript
   // lib/db/prisma.ts
   import { PrismaClient } from '@prisma/client'
   import { PrismaLibSQL } from '@prisma/adapter-libsql'
   import { createClient } from '@libsql/client'
   
   const libsql = createClient({
     url: process.env.DATABASE_URL!,
     authToken: process.env.DATABASE_AUTH_TOKEN,
   })
   
   const adapter = new PrismaLibSQL(libsql)
   export const prisma = new PrismaClient({ adapter })
   ```

6. **Run Migration**
   ```bash
   # Push schema to Turso
   npx prisma db push
   
   # Generate Prisma Client
   npx prisma generate
   ```

7. **Verify Connection**
   ```bash
   # Test connection
   turso db shell siaintel-prod
   
   # Check tables
   .tables
   
   # Should see: User, Session, RecoveryCode, PasswordHistory, BlockedIP, etc.
   ```

#### ⚠️ Data Migration (if needed)
```bash
# Export from SQLite
sqlite3 prisma/dev.db .dump > backup.sql

# Import to Turso
turso db shell siaintel-prod < backup.sql
```

---

### 3. HTTPS Configuration

#### ✅ SSL/TLS Certificate
- [ ] Valid SSL certificate installed
- [ ] Certificate auto-renewal configured (Let's Encrypt recommended)
- [ ] HTTPS redirect enabled (HTTP → HTTPS)

#### ✅ HSTS Header (Automatic in Production)
```typescript
// middleware.ts automatically enables HSTS when NODE_ENV=production
if (process.env.NODE_ENV === 'production') {
  headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )
}
```

#### ✅ HSTS Preload (Optional but Recommended)
1. Ensure HSTS header is active for 6+ months
2. Submit to: https://hstspreload.org/
3. Adds your domain to browser HSTS preload lists

---

### 4. Redis Production Setup

#### Option A: Upstash (Recommended - Serverless)
```bash
# 1. Create account: https://upstash.com
# 2. Create Redis database (Global or Regional)
# 3. Copy connection URL

REDIS_URL=rediss://default:xxxxx@xxxxx.upstash.io:6379
```

**Pros:**
- Serverless (pay per request)
- Global replication
- No maintenance
- Free tier: 10K commands/day

#### Option B: Redis Cloud
```bash
# 1. Create account: https://redis.com/try-free/
# 2. Create database
# 3. Copy connection details

REDIS_URL=redis://default:password@redis-12345.c123.us-east-1-1.ec2.cloud.redislabs.com:12345
```

#### Option C: Self-Hosted (Advanced)
```bash
# Docker Compose
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --requirepass your-strong-password

volumes:
  redis-data:
```

#### ✅ Test Redis Connection
```bash
# Install Redis CLI
npm install -g redis-cli

# Test connection
redis-cli -u $REDIS_URL ping
# Expected: PONG
```

---

### 5. Security Headers Verification

#### ✅ Test Security Headers (Production)
```bash
# After deployment, test headers:
curl -I https://your-domain.com

# Expected headers:
# Content-Security-Policy: default-src 'self'; ...
# X-Frame-Options: DENY
# X-Content-Type-Options: nosniff
# Referrer-Policy: strict-origin-when-cross-origin
# Permissions-Policy: camera=(), microphone=(), ...
# Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# X-DNS-Prefetch-Control: on
# X-XSS-Protection: 1; mode=block
```

#### ✅ Security Scan
- [ ] Run: https://securityheaders.com/?q=your-domain.com
- [ ] Target Score: A+ rating
- [ ] Fix any warnings

---

### 6. BullMQ Worker Deployment

#### ✅ Worker Process
```bash
# Start worker in production
npm run worker:audit-cleanup

# Or use PM2 for process management:
pm2 start npm --name "audit-cleanup-worker" -- run worker:audit-cleanup
pm2 save
pm2 startup
```

#### ✅ Worker Monitoring
- [ ] Worker logs accessible
- [ ] Slack alerts configured
- [ ] Job failure notifications working
- [ ] Redis connection stable

---

### 7. Initial Admin User Setup

#### ✅ Create First Admin User
```bash
# Run seed script (update with your details)
npx tsx scripts/create-admin-user.ts

# Or manually via Prisma Studio:
npx prisma studio
```

#### ✅ Enable 2FA for Admin
1. Login to `/admin/login`
2. Go to Settings
3. Enable 2FA
4. Save backup codes securely

---

### 8. Rate Limiting & IP Filtering

#### ✅ Rate Limit Configuration
```typescript
// lib/auth/rate-limiter.ts
// Verify production limits:
const RATE_LIMITS = {
  login: { max: 5, window: 15 * 60 * 1000 },      // 5 attempts per 15 min
  api: { max: 100, window: 60 * 1000 },           // 100 requests per minute
  recovery: { max: 3, window: 24 * 60 * 60 * 1000 }, // 3 per 24 hours
}
```

#### ✅ IP Filtering
- [ ] Test IP block/unblock endpoints
- [ ] Verify automatic rate limit blocking
- [ ] Test expired block cleanup

---

### 9. Audit Logging

#### ✅ Audit Log Retention
```typescript
// lib/jobs/audit-cleanup.ts
// Verify retention policy:
const RETENTION_DAYS = 90 // 90 days
```

#### ✅ Slack Alerts
- [ ] Test audit cleanup job
- [ ] Verify Slack notifications
- [ ] Check job scheduling (daily at 02:00)

---

### 10. Password Policy

#### ✅ Password Requirements
```typescript
// lib/auth/password-policy.ts
// Verify production requirements:
- Minimum 12 characters
- Uppercase + lowercase + number + special character
- Last 5 passwords cannot be reused
- Session termination on password change
```

---

### 11. Session Management

#### ✅ Idle Timeout
```bash
# Verify timeout configuration
IDLE_TIMEOUT_MINUTES=30  # 30 minutes
```

#### ✅ Session Security
- [ ] Secure cookies enabled (production only)
- [ ] HttpOnly flag set
- [ ] SameSite=Strict
- [ ] Session fixation prevention active

---

### 12. Deployment Platform Configuration

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables
vercel env add NEXTAUTH_SECRET production
vercel env add DATABASE_URL production
vercel env add REDIS_URL production
# ... (add all required variables)
```

#### Docker (Alternative)
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

---

### 13. Post-Deployment Verification

#### ✅ Functional Tests
- [ ] Admin login works
- [ ] 2FA setup works
- [ ] Password change works
- [ ] Recovery codes work
- [ ] IP blocking works
- [ ] Audit logs created
- [ ] Worker job runs

#### ✅ Security Tests
- [ ] HTTPS redirect works
- [ ] Security headers present
- [ ] Rate limiting active
- [ ] Idle timeout enforced
- [ ] CSRF protection active

#### ✅ Performance Tests
- [ ] Page load < 2s
- [ ] API response < 500ms
- [ ] Database queries optimized
- [ ] Redis connection stable

---

### 14. Monitoring & Alerts

#### ✅ Application Monitoring
- [ ] Error tracking (Sentry recommended)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Uptime monitoring (UptimeRobot)

#### ✅ Security Monitoring
- [ ] Failed login attempts tracked
- [ ] IP blocks logged
- [ ] Suspicious activity alerts
- [ ] Audit log review scheduled

---

## 🚨 CRITICAL SECURITY REMINDERS

1. **NEVER commit `.env.local` or `.env.production` to git**
2. **Rotate secrets every 90 days**
3. **Use different secrets for dev/staging/production**
4. **Enable 2FA for all admin accounts**
5. **Review audit logs weekly**
6. **Keep dependencies updated** (`npm audit fix`)
7. **Monitor security advisories**
8. **Backup database daily**
9. **Test disaster recovery plan**
10. **Document incident response procedures**

---

## 📋 Quick Deployment Commands

```bash
# 1. Install dependencies
npm ci

# 2. Generate Prisma Client
npx prisma generate

# 3. Push database schema
npx prisma db push

# 4. Build application
npm run build

# 5. Start production server
npm start

# 6. Start worker (separate process)
npm run worker:audit-cleanup
```

---

## 🆘 Rollback Plan

If deployment fails:

1. **Revert to previous version**
   ```bash
   vercel rollback
   ```

2. **Check logs**
   ```bash
   vercel logs
   ```

3. **Restore database backup**
   ```bash
   turso db restore siaintel-prod <backup-timestamp>
   ```

4. **Notify team**
   - Post in Slack
   - Update status page
   - Document incident

---

## ✅ Deployment Complete

Once all items are checked:
- [ ] All environment variables set
- [ ] Database migrated to Turso
- [ ] HTTPS configured
- [ ] Redis connected
- [ ] Worker running
- [ ] Security headers verified
- [ ] Admin user created
- [ ] 2FA enabled
- [ ] Monitoring active
- [ ] Team notified

**Status**: 🟢 Production Ready

**Deployed By**: _____________  
**Date**: _____________  
**Version**: _____________
