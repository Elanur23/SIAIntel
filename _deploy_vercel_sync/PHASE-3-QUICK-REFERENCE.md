# Phase 3 Security - Quick Reference

**Hızlı Komutlar ve API Referansı**

---

## 🚀 Kurulum

```bash
# 1. Migration
npx prisma migrate dev --name phase3-security

# 2. Test
npx tsx scripts/test-phase3-security.ts

# 3. Verify
curl -I http://localhost:3000
```

---

## 🔒 1. Security Headers

### Nonce Kullanımı
```typescript
// Server Component
import { headers } from 'next/headers'

const nonce = headers().get('x-nonce')

<script nonce={nonce}>
  console.log('Inline script')
</script>
```

### CSP Kontrol
```bash
curl -I https://your-domain.com | grep -i content-security-policy
```

---

## 🚫 2. IP Filtering

### IP Blokla
```bash
curl -X POST http://localhost:3000/api/admin/ip-block \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "ip": "192.168.1.100",
    "reason": "Suspicious activity",
    "durationHours": 24
  }'
```

### IP Unblock
```bash
curl -X POST http://localhost:3000/api/admin/ip-unblock \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"ip": "192.168.1.100"}'
```

### Kod İçinde Kullanım
```typescript
import { blockIP, unblockIP, isIPBlocked } from '@/lib/security/ip-filter'

// Blokla
await blockIP('192.168.1.100', 'Rate limit exceeded', 3600000) // 1 saat

// Kontrol et
const blocked = await isIPBlocked('192.168.1.100')
if (blocked?.blocked) {
  console.log('IP blocked:', blocked.reason)
}

// Unblock
await unblockIP('192.168.1.100')
```

---

## 🔑 3. Password Policy

### Şifre Değiştir
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldP@ssw0rd123",
    "newPassword": "NewSecureP@ssw0rd456",
    "confirmPassword": "NewSecureP@ssw0rd456"
  }'
```

### Şifre Validasyonu
```typescript
import { validatePassword } from '@/lib/auth/password-policy'

const result = validatePassword('MyP@ssw0rd123')
if (!result.valid) {
  console.error('Errors:', result.errors)
}
```

### Şifre Gereksinimleri
- ✅ Min 12 karakter
- ✅ En az 1 büyük harf (A-Z)
- ✅ En az 1 küçük harf (a-z)
- ✅ En az 1 rakam (0-9)
- ✅ En az 1 özel karakter (!@#$%^&*)
- ✅ Son 5 şifre tekrar kullanılamaz

---

## 🔄 4. Recovery Code Rate Limiting

### Kod Yenile
```bash
curl -X POST http://localhost:3000/api/auth/recovery/regenerate \
  -H "Authorization: Bearer {token}"
```

### Rate Limit
- **Limit**: 3 yenileme / 24 saat
- **Response**: 429 Too Many Requests (limit aşımında)
- **Tracking**: AuditLog tablosu

---

## 📊 Database Queries

### Blocked IP'leri Listele
```sql
SELECT * FROM BlockedIP 
WHERE expiresAt IS NULL OR expiresAt > datetime('now')
ORDER BY blockedAt DESC;
```

### Password History Kontrol
```sql
SELECT * FROM PasswordHistory 
WHERE userId = 'user-id'
ORDER BY changedAt DESC
LIMIT 5;
```

### Recovery Regeneration Sayısı
```sql
SELECT COUNT(*) as count FROM AuditLog
WHERE userId = 'user-id'
  AND action = '2FA_RECOVERY_REGENERATED'
  AND success = 1
  AND timestamp > datetime('now', '-24 hours');
```

---

## 🔍 Monitoring

### Security Headers Kontrol
```bash
# Tüm header'ları göster
curl -I https://your-domain.com

# Sadece CSP
curl -I https://your-domain.com | grep -i content-security-policy

# Sadece HSTS
curl -I https://your-domain.com | grep -i strict-transport-security
```

### Blocked IP Sayısı
```typescript
const count = await prisma.blockedIP.count()
console.log('Blocked IPs:', count)
```

### Password Change Frequency
```typescript
const changes = await prisma.auditLog.count({
  where: {
    action: 'PASSWORD_CHANGED',
    timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
  }
})
console.log('Password changes (last 7 days):', changes)
```

---

## ⚠️ Common Issues

### CSP Blocking Scripts
```typescript
// ❌ YANLIŞ
<script>console.log('test')</script>

// ✅ DOĞRU
const nonce = headers().get('x-nonce')
<script nonce={nonce}>console.log('test')</script>
```

### IP Extraction
```typescript
// ❌ YANLIŞ
const ip = request.headers.get('x-forwarded-for')

// ✅ DOĞRU
import { extractClientIP } from '@/lib/security/ip-filter'
const ip = extractClientIP(request)
```

### Password Comparison
```typescript
// ❌ YANLIŞ
if (newPasswordHash === oldPasswordHash) { }

// ✅ DOĞRU
const isReused = await bcrypt.compare(newPassword, oldPasswordHash)
```

---

## 📁 Dosya Konumları

```
lib/security/
├── security-headers.ts    # CSP, nonce, headers
└── ip-filter.ts           # IP blocking logic

lib/auth/
└── password-policy.ts     # Password validation, history

app/api/admin/
├── ip-block/route.ts      # Block IP endpoint
└── ip-unblock/route.ts    # Unblock IP endpoint

app/api/auth/
├── change-password/route.ts           # Password change
└── recovery/regenerate/route.ts       # Recovery codes (updated)

middleware.ts              # Security headers + IP filtering
next.config.ts            # Static security headers
```

---

## 🎯 Test Checklist

- [ ] Security headers mevcut
- [ ] CSP nonce çalışıyor
- [ ] IP blocking çalışıyor
- [ ] Blocked IP 403 alıyor
- [ ] Password policy enforce ediliyor
- [ ] Zayıf şifreler reddediliyor
- [ ] Password history çalışıyor
- [ ] Session termination çalışıyor
- [ ] Recovery rate limit çalışıyor
- [ ] 3. yenilemeden sonra 429 dönüyor

---

## 📚 Dokümantasyon

- **Detaylı Kılavuz**: `docs/PHASE-3-SECURITY-COMPLETE.md`
- **Özet**: `PHASE-3-SECURITY-SUMMARY.md`
- **Yaygın Hatalar**: `docs/PHASE-3-COMMON-PITFALLS.md`
- **Bu Referans**: `PHASE-3-QUICK-REFERENCE.md`

---

**Version**: 1.0.0  
**Last Updated**: March 21, 2026
