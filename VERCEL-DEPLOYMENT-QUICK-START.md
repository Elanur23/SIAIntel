# 🚀 Vercel Deployment - Hızlı Başlangıç

## ✅ Adım 1: GitHub'a Push (GitHub Desktop)

1. GitHub Desktop'ı aç
2. Değişiklikleri gör
3. Commit mesajı: `feat: production deployment ready`
4. **Commit to main** → **Push origin**

---

## ✅ Adım 2: Vercel'e Git

https://vercel.com/new

---

## ✅ Adım 3: Repository Import Et

1. "Import Git Repository" seçin
2. GitHub hesabını bağlayın
3. `SIAIntel` repository'sini seçin

---

## ✅ Adım 4: Environment Variables Ekle

### 🔐 Security Secrets (ZORUNLU)

```env
NEXTAUTH_SECRET=RVShzgS62yEk0oUKq0n6JyTlnXaSn2EVnUEsA3h8pY4ZYC9yfgXixUnMpk9HSJ67
SESSION_SECRET=GXL7xGZPCkjSPsJdV0Hc5vZYIkC1oAgnZxSLQBI0dutZLz8zrKi+R6HiTsJPunV4
ADMIN_SECRET=gdEvG2+yMzUSj9/TxLNrHJ4EE0JuPkA5K6t2FHFODYY=
CRON_SECRET=SzRGH/RUw22jK8oUrt9lqBA9JPdqs9/MGZLV+rMYmEM=
```

### 🗄️ Database (ZORUNLU - Turso'dan alın)

```env
TURSO_DATABASE_URL=libsql://siaintel-prod-[org].turso.io
TURSO_AUTH_TOKEN=eyJhbGci...
DATABASE_URL=${TURSO_DATABASE_URL}?authToken=${TURSO_AUTH_TOKEN}
```

**Turso Setup:**
```bash
# Turso CLI kur
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Database oluştur
turso db create siaintel-prod --location ams

# Credentials al
turso db show siaintel-prod --url
turso db tokens create siaintel-prod
```

### 🔴 Redis (ZORUNLU - Upstash'ten alın)

```env
REDIS_URL=rediss://default:[password]@[endpoint].upstash.io:6379
```

**Upstash Setup:**
1. https://console.upstash.com/redis
2. "Create Database" tıklayın
3. Connection URL'i kopyalayın

### 📢 Alerting (ZORUNLU)

```env
SLACK_WEBHOOK_URL=[MASKED_SECRET]
```

**Slack Webhook Setup:**
1. Slack Workspace Settings → Apps
2. "Incoming Webhooks" ara ve ekle
3. Webhook URL'i kopyala

### 🤖 AI Services (ZORUNLU)

```env
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
GOOGLE_GEMINI_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**API Keys:**
- OpenAI: https://platform.openai.com/api-keys
- Gemini: https://aistudio.google.com/app/apikey

### 📊 Google Services (ZORUNLU)

```env
GOOGLE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX
GA4_PROPERTY_ID=123456789
GA4_CLIENT_EMAIL=ga4-service@your-project.iam.gserviceaccount.com
GA4_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_CLIENT_EMAIL=search-console@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

### 🌐 Site Configuration (ZORUNLU)

```env
NEXTAUTH_URL=https://siaintel.vercel.app
SITE_URL=https://siaintel.vercel.app
SITE_NAME=SIA Intelligence Terminal
NEXT_PUBLIC_SITE_URL=https://siaintel.vercel.app
NEXT_PUBLIC_BASE_URL=https://siaintel.vercel.app
NODE_ENV=production
```

---

## ✅ Adım 5: Deploy

1. Tüm environment variables'ları ekledikten sonra
2. **"Deploy"** butonuna tıklayın
3. Build sürecini izleyin (5-10 dakika)

---

## ✅ Adım 6: Deployment Sonrası Kontrol

Build tamamlandıktan sonra PowerShell'de:

```powershell
$env:SITE_URL="https://siaintel.vercel.app"
npx tsx scripts/verify-production.ts
```

**Beklenen Sonuç:**
```
✅ Environment Variables: All required variables set
✅ SSL Certificate: HTTPS working
✅ Security Headers: All required security headers present
✅ HSTS Header: HSTS enabled
✅ Database Connection: Connected to Turso
✅ Redis Connection: Redis connected
✅ Auth Endpoints: Login page accessible
✅ Cron Endpoint: Cron endpoint accessible

📊 Summary: 8 passed, 0 failed, 0 warnings
✅ Deployment verification PASSED
```

---

## 🔧 Troubleshooting

### Build Fails: "Prisma generate failed"

**Çözüm:** DATABASE_URL environment variable'ını ekleyin

### Build Fails: "Module not found"

**Çözüm:** `package.json` dependencies'leri kontrol edin

### 404 Error After Deployment

**Çözüm:** 
1. Vercel Dashboard → Deployments
2. Son deployment'ı seçin
3. "Logs" sekmesinde hataları kontrol edin
4. Environment variables'ları tekrar kontrol edin

### Database Connection Fails

**Çözüm:**
1. Turso dashboard'da database'in aktif olduğunu kontrol edin
2. `TURSO_AUTH_TOKEN`'ın doğru olduğunu kontrol edin
3. `DATABASE_URL` formatını kontrol edin

---

## 📚 Ek Kaynaklar

- **Vercel Docs**: https://vercel.com/docs
- **Turso Docs**: https://docs.turso.tech
- **Upstash Docs**: https://docs.upstash.com
- **Next.js Deployment**: https://nextjs.org/docs/deployment

---

## ⚠️ Önemli Notlar

1. **Secrets'ları asla Git'e commit etmeyin!**
2. Her environment (dev/staging/prod) için farklı secrets kullanın
3. Secrets'ları 90 günde bir rotate edin
4. Backup secrets'ları güvenli bir yerde saklayın (1Password, etc.)

---

**Oluşturulma Tarihi**: 21 Mart 2026  
**Versiyon**: 1.0.0  
**Durum**: ✅ Production Ready

