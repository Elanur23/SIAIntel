# Vercel Deployment Setup Guide

## Prerequisites

1. **Vercel Account**: Sign up at https://vercel.com
2. **Vercel CLI**: Install globally
   ```bash
   npm i -g vercel
   ```
3. **Environment Variables**: Prepare all values from `.env.production.template`

---

## Step 1: Install Vercel CLI

```bash
# Install globally
npm i -g vercel

# Login to your account
vercel login
```

---

## Step 2: Link Project

```bash
# In your project directory
vercel link

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? Select your team/personal account
# - Link to existing project? No (first time) or Yes (if exists)
# - Project name? siaintel-terminal (or your choice)
```

---

## Step 3: Add Environment Variables

### Option A: Via Vercel CLI (Recommended)

```bash
# Add each variable for production environment
vercel env add NEXTAUTH_SECRET production
# Paste value when prompted

vercel env add SESSION_SECRET production
vercel env add TURSO_DATABASE_URL production
vercel env add TURSO_AUTH_TOKEN production
vercel env add REDIS_URL production
vercel env add SLACK_WEBHOOK_URL production
vercel env add OPENAI_API_KEY production
vercel env add GOOGLE_GEMINI_API_KEY production
vercel env add GOOGLE_ADSENSE_ID production
vercel env add NEXT_PUBLIC_GA4_MEASUREMENT_ID production
# ... add all required variables
```

### Option B: Via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add each variable:
   - **Key**: Variable name (e.g., `NEXTAUTH_SECRET`)
   - **Value**: Your secret value
   - **Environment**: Select `Production`
5. Click **Save**

### Required Variables Checklist

#### 🔐 Security (REQUIRED)
- [ ] `NEXTAUTH_SECRET` - Generate: `openssl rand -base64 48`
- [ ] `SESSION_SECRET` - Generate: `openssl rand -base64 48`
- [ ] `ADMIN_SECRET` - Generate: `openssl rand -base64 32`
- [ ] `NEXTAUTH_URL` - Your production domain (e.g., `https://siaintel.com`)
- [ ] `NODE_ENV` - Set to `production`

#### 🗄️ Database (REQUIRED)
- [ ] `TURSO_DATABASE_URL` - From: `turso db show [db-name] --url`
- [ ] `TURSO_AUTH_TOKEN` - From: `turso db tokens create [db-name]`
- [ ] `DATABASE_URL` - Combined: `${TURSO_DATABASE_URL}?authToken=${TURSO_AUTH_TOKEN}`

#### 🔴 Redis (REQUIRED)
- [ ] `REDIS_URL` - Upstash Redis URL (rediss://...)

#### 📢 Alerting (REQUIRED)
- [ ] `SLACK_WEBHOOK_URL` - Slack incoming webhook URL

#### 🤖 AI Services (REQUIRED)
- [ ] `OPENAI_API_KEY` - OpenAI API key
- [ ] `GOOGLE_GEMINI_API_KEY` - Google Gemini API key

#### 📊 Google Services (REQUIRED)
- [ ] `GOOGLE_ADSENSE_ID` - AdSense publisher ID
- [ ] `NEXT_PUBLIC_GOOGLE_ADSENSE_ID` - Same as above
- [ ] `NEXT_PUBLIC_GA4_MEASUREMENT_ID` - GA4 measurement ID
- [ ] `GA4_PROPERTY_ID` - GA4 property ID
- [ ] `GA4_CLIENT_EMAIL` - Service account email
- [ ] `GA4_PRIVATE_KEY` - Service account private key
- [ ] `GOOGLE_CLIENT_EMAIL` - Search Console service account
- [ ] `GOOGLE_PRIVATE_KEY` - Search Console private key

#### 🌐 Site Configuration (REQUIRED)
- [ ] `SITE_URL` - Your production domain
- [ ] `SITE_NAME` - Your site name
- [ ] `NEXT_PUBLIC_SITE_URL` - Same as SITE_URL
- [ ] `NEXT_PUBLIC_BASE_URL` - Same as SITE_URL

#### 🔧 Optional Services
- [ ] `DISCORD_WEBHOOK_URL` - Discord webhook (optional)
- [ ] `TELEGRAM_BOT_TOKEN` - Telegram bot token (optional)
- [ ] `TELEGRAM_ALERT_CHAT_ID` - Telegram chat ID (optional)
- [ ] `CRON_SECRET` - For Vercel Cron Jobs (generate: `openssl rand -base64 32`)

---

## Step 4: Configure Vercel Cron Jobs

Vercel Cron Jobs replace BullMQ workers in serverless environments.

### Add Cron Secret

```bash
# Generate cron secret
openssl rand -base64 32

# Add to Vercel
vercel env add CRON_SECRET production
# Paste the generated secret
```

### Verify Cron Configuration

The `vercel.json` file already includes:

```json
{
  "crons": [
    {
      "path": "/api/cron/audit-cleanup",
      "schedule": "0 2 * * *"
    }
  ]
}
```

This runs the audit cleanup job daily at 02:00 UTC.

### Test Cron Job Locally

```bash
# Start dev server
npm run dev

# In another terminal, test the cron endpoint
curl -H "Authorization: Bearer YOUR_CRON_SECRET" http://localhost:3003/api/cron/audit-cleanup
```

---

## Step 5: Deploy to Production

### First Deployment

```bash
# Deploy to production
vercel --prod

# Vercel will:
# 1. Build your application
# 2. Run Prisma generate
# 3. Deploy to production
# 4. Assign a domain (e.g., siaintel-terminal.vercel.app)
```

### Subsequent Deployments

```bash
# Deploy latest changes
vercel --prod

# Or use Git integration (recommended):
# 1. Push to main branch
# 2. Vercel auto-deploys
```

---

## Step 6: Configure Custom Domain

### Add Custom Domain

1. Go to **Project Settings** → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `siaintel.com`)
4. Follow DNS configuration instructions:

   **For Cloudflare:**
   ```
   Type: CNAME
   Name: @ (or subdomain)
   Target: cname.vercel-dns.com
   Proxy: DNS only (gray cloud)
   ```

   **For other DNS providers:**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   ```

5. Wait for DNS propagation (5-60 minutes)
6. Vercel will automatically provision SSL certificate

### Update Environment Variables

After adding custom domain, update:

```bash
vercel env add NEXTAUTH_URL production
# Enter: https://your-domain.com

vercel env add SITE_URL production
# Enter: https://your-domain.com

vercel env add NEXT_PUBLIC_SITE_URL production
# Enter: https://your-domain.com
```

---

## Step 7: Verify Deployment

### Run Verification Script

```bash
# Install dependencies
npm install

# Run verification
npm run verify:production
```

This checks:
- ✅ Security headers
- ✅ Database connection
- ✅ Redis connection
- ✅ Auth endpoints

### Manual Verification

1. **Visit your site**: https://your-domain.com
2. **Check security headers**:
   ```bash
   curl -I https://your-domain.com
   ```
3. **Test admin login**: https://your-domain.com/admin/login
4. **Check Vercel logs**:
   ```bash
   vercel logs
   ```

---

## Step 8: Monitor Deployment

### Vercel Dashboard

- **Deployments**: View deployment history
- **Analytics**: Monitor traffic and performance
- **Logs**: Real-time function logs
- **Cron Jobs**: View cron execution history

### Slack Notifications

Audit cleanup job sends notifications to Slack:
- ✅ Success: Number of deleted logs
- ❌ Failure: Error message

---

## Troubleshooting

### Build Fails

**Error**: `Prisma generate failed`

**Solution**:
```bash
# Ensure DATABASE_URL is set
vercel env add DATABASE_URL production

# Redeploy
vercel --prod
```

### Database Connection Fails

**Error**: `Can't reach database server`

**Solution**:
1. Verify `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`
2. Test connection locally:
   ```bash
   turso db shell [db-name]
   ```
3. Check Turso dashboard for database status

### Redis Connection Fails

**Error**: `Redis connection timeout`

**Solution**:
1. Verify `REDIS_URL` format: `rediss://default:password@host:6379`
2. Test connection:
   ```bash
   redis-cli -u $REDIS_URL ping
   ```
3. Check Upstash dashboard for instance status

### Cron Job Not Running

**Error**: Cron job doesn't execute

**Solution**:
1. Verify `vercel.json` cron configuration
2. Check `CRON_SECRET` is set
3. View cron logs in Vercel dashboard
4. Test endpoint manually:
   ```bash
   curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/audit-cleanup
   ```

### Environment Variables Not Loading

**Error**: `process.env.VARIABLE is undefined`

**Solution**:
1. Verify variable is added in Vercel dashboard
2. Check variable is set for **Production** environment
3. Redeploy after adding variables:
   ```bash
   vercel --prod --force
   ```

---

## Rollback

If deployment fails, rollback to previous version:

```bash
# List deployments
vercel ls

# Rollback to specific deployment
vercel rollback [deployment-url]

# Or via dashboard:
# 1. Go to Deployments
# 2. Find working deployment
# 3. Click "..." → "Promote to Production"
```

---

## Best Practices

### 1. Use Git Integration

- Connect Vercel to your GitHub repository
- Auto-deploy on push to `main` branch
- Preview deployments for pull requests

### 2. Separate Environments

- **Production**: `main` branch
- **Staging**: `staging` branch
- **Development**: Local only

### 3. Rotate Secrets

- Rotate `NEXTAUTH_SECRET` and `SESSION_SECRET` every 90 days
- Update in Vercel dashboard
- Redeploy

### 4. Monitor Logs

```bash
# Real-time logs
vercel logs --follow

# Filter by function
vercel logs --follow /api/admin/login
```

### 5. Enable Vercel Analytics

1. Go to **Analytics** tab
2. Enable **Web Analytics**
3. Monitor Core Web Vitals

---

## Cost Optimization

### Vercel Pro Plan ($20/month)

**Includes:**
- Unlimited bandwidth
- 100GB-hours compute
- Advanced analytics
- Cron jobs
- Team collaboration

**When to upgrade:**
- Traffic > 100GB/month
- Need cron jobs (audit cleanup)
- Team collaboration required

### Free Tier Limitations

- 100GB bandwidth/month
- 100 hours compute/month
- No cron jobs (use external service)
- Single user

---

## Alternative: Self-Hosted

If Vercel doesn't fit your needs:

### Docker Deployment

```bash
# Build image
docker build -t siaintel-terminal .

# Run container
docker run -p 3000:3000 --env-file .env.production siaintel-terminal
```

### VPS Deployment (DigitalOcean, AWS, etc.)

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone repository
git clone https://github.com/your-repo/siaintel-terminal.git
cd siaintel-terminal

# Install dependencies
npm ci

# Build
npm run build

# Start with PM2
npm install -g pm2
pm2 start npm --name "siaintel" -- start
pm2 startup
pm2 save
```

---

## Support

- **Vercel Docs**: https://vercel.com/docs
- **Vercel Support**: https://vercel.com/support
- **Community**: https://github.com/vercel/vercel/discussions

---

**Last Updated**: March 21, 2026  
**Version**: 1.0.0
