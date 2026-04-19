# 🚀 Vercel Deployment Commands

## Peer Dependency Fix Applied

Fixed `@libsql/client` version conflict:
- **Before:** `^0.17.2` (incompatible with @prisma/adapter-libsql@5.22.0)
- **After:** `^0.8.1` (compatible)

## Commands to Deploy

Run these commands in order:

### 1. Stage all changes
```bash
git add .
```

### 2. Commit with descriptive message
```bash
git commit -m "fix: downgrade @libsql/client to ^0.8.1 for Vercel compatibility

- Fixed peer dependency conflict with @prisma/adapter-libsql@5.22.0
- Downgraded @libsql/client from ^0.17.2 to ^0.8.1
- Updated lib/db/turso.ts to use web client for platform compatibility
- Fixed NextAuth 500 error by initializing Turso database
- Added secure environment variables (NEXTAUTH_SECRET, SESSION_SECRET, ADMIN_SECRET)
- Tested Turso connection successfully
- Admin user initialized and ready for production"
```

### 3. Push to remote repository
```bash
git push origin main
```

**Note:** Replace `main` with your branch name if different (e.g., `master`, `production`)

### 4. Verify Vercel Deployment

After pushing, Vercel will automatically deploy. Monitor the deployment:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Check the "Deployments" tab
4. Wait for build to complete (should succeed now!)

### 5. Test Production Deployment

Once deployed, test the admin login:

```bash
curl -X POST https://siaintel.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"password":"YOUR_ADMIN_SECRET_FROM_VERCEL_ENV"}'
```

Expected response:
```json
{
  "success": true,
  "requires2FA": false,
  "csrfToken": "..."
}
```

## Vercel Environment Variables Checklist

Ensure these are set in Vercel Dashboard → Settings → Environment Variables:

### Critical (Required)
- ✅ `TURSO_DATABASE_URL`
- ✅ `TURSO_AUTH_TOKEN`
- ✅ `DATABASE_URL` (same as TURSO_DATABASE_URL)
- ✅ `NEXTAUTH_SECRET`
- ✅ `NEXTAUTH_URL`
- ✅ `SESSION_SECRET`
- ✅ `ADMIN_SECRET`
- ✅ `NODE_ENV=production`

### Site Config
- ✅ `NEXT_PUBLIC_SITE_URL`
- ✅ `NEXT_PUBLIC_BASE_URL`

### Optional (but recommended)
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `NEXT_PUBLIC_GA4_MEASUREMENT_ID`
- `GOOGLE_ADSENSE_ID`

## Troubleshooting

### If deployment still fails:

1. **Check Vercel build logs** for specific errors
2. **Verify environment variables** are set correctly
3. **Clear Vercel cache**: Settings → General → Clear Cache
4. **Redeploy**: Deployments → Click "..." → Redeploy

### If admin login fails:

1. **Check ADMIN_SECRET** matches between local .env and Vercel
2. **Verify database connection** in Vercel logs
3. **Check NEXTAUTH_URL** matches your production domain

## Success Indicators

✅ Vercel build completes without errors  
✅ No peer dependency warnings  
✅ Admin login API returns 200 status  
✅ Database queries work in production  
✅ Session cookies are set correctly  

---

**Status:** Ready for deployment  
**Date:** 2026-04-19  
**Fixed:** Peer dependency conflict + Turso connection + NextAuth 500 error
