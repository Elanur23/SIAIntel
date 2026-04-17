# Phase 3 Security - Common Pitfalls & Solutions

**Yaygın Hatalar ve Kaçınılması Gerekenler**

---

## 1. Security Headers

### ❌ HATA: CSP inline script'leri blokluyor

**Sorun:**
```typescript
// Bu çalışmaz - CSP tarafından bloklanır
<script>
  console.log('Hello')
</script>
```

**Çözüm:**
```typescript
// Nonce kullan
const nonce = request.headers.get('x-nonce')

<script nonce={nonce}>
  console.log('Hello')
</script>
```

### ❌ HATA: Development'ta HSTS sorunları

**Sorun:**
```typescript
// HSTS localhost'ta sorun yaratır
headers.set('Strict-Transport-Security', 'max-age=31536000')
```

**Çözüm:**
```typescript
// Sadece production'da HSTS kullan
if (process.env.NODE_ENV === 'production') {
  headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
}
```

### ❌ HATA: CSP'de 'unsafe-eval' kullanımı

**Sorun:**
```typescript
// Production'da güvenlik riski
`script-src 'self' 'unsafe-eval'`
```

**Çözüm:**
```typescript
// Sadece development'ta kullan
`script-src 'self' 'nonce-${nonce}' ${
  process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : ''
}`
```

### ❌ HATA: Nonce'u statik olarak kullanma

**Sorun:**
```typescript
// Her request için aynı nonce - GÜVENSİZ!
const nonce = 'static-nonce-123'
```

**Çözüm:**
```typescript
// Her request için yeni nonce üret
const nonce = crypto.randomBytes(16).toString('base64')
```

---

## 2. IP Filtering

### ❌ HATA: Yanlış IP extraction sırası

**Sorun:**
```typescript
// X-Forwarded-For'u önce kontrol etmek - YANLIŞ
const ip = request.headers.get('x-forwarded-for') || 
           request.headers.get('cf-connecting-ip')
```

**Çözüm:**
```typescript
// Cloudflare IP'yi önce kontrol et (en güvenilir)
const cfIP = request.headers.get('cf-connecting-ip')
if (cfIP) return cfIP

const forwardedFor = request.headers.get('x-forwarded-for')
if (forwardedFor) {
  return forwardedFor.split(',')[0].trim()
}
```

### ❌ HATA: X-Forwarded-For'daki tüm IP'leri kullanma

**Sorun:**
```typescript
// Tüm IP chain'i kullanmak - YANLIŞ
const ip = request.headers.get('x-forwarded-for')
// "192.168.1.1, 10.0.0.1, 203.0.113.1"
```

**Çözüm:**
```typescript
// Sadece ilk IP'yi al (client IP)
const forwardedFor = request.headers.get('x-forwarded-for')
const ip = forwardedFor.split(',')[0].trim()
// "192.168.1.1"
```

### ❌ HATA: 'unknown' IP'leri bloklamak

**Sorun:**
```typescript
// Unknown IP'leri bloklamak tüm erişimi engelleyebilir
if (ip === 'unknown') {
  return blockAccess()
}
```

**Çözüm:**
```typescript
// Unknown IP'leri bloklamadan geç
if (ip === 'unknown') {
  return null // Don't block
}
```

### ❌ HATA: Expired block'ları temizlememek

**Sorun:**
```typescript
// Expired block'lar veritabanında kalır
const blockedIP = await prisma.blockedIP.findUnique({
  where: { ip }
})
```

**Çözüm:**
```typescript
// Expired block'ları kontrol et
const blockedIP = await prisma.blockedIP.findFirst({
  where: {
    ip,
    OR: [
      { expiresAt: null }, // Permanent
      { expiresAt: { gt: new Date() } }, // Not expired
    ],
  },
})
```

---

## 3. Password Policy

### ❌ HATA: Şifre history'yi plaintext saklamak

**Sorun:**
```typescript
// Plaintext şifre saklamak - ÇOK TEHLİKELİ!
await prisma.passwordHistory.create({
  data: {
    userId,
    password: newPassword, // YANLIŞ!
  },
})
```

**Çözüm:**
```typescript
// Her zaman hash'lenmiş şifre sakla
const passwordHash = await bcrypt.hash(newPassword, 10)
await prisma.passwordHistory.create({
  data: {
    userId,
    passwordHash, // DOĞRU
  },
})
```

### ❌ HATA: Şifre karşılaştırmasında === kullanmak

**Sorun:**
```typescript
// Hash'leri direkt karşılaştırmak - ÇALIŞMAZ!
if (newPasswordHash === oldPasswordHash) {
  return 'Password reused'
}
```

**Çözüm:**
```typescript
// bcrypt.compare kullan
const isReused = await bcrypt.compare(newPassword, oldPasswordHash)
if (isReused) {
  return 'Password reused'
}
```

### ❌ HATA: Password history limitini kontrol etmemek

**Sorun:**
```typescript
// Sınırsız history - veritabanı şişer
await prisma.passwordHistory.create({
  data: { userId, passwordHash }
})
```

**Çözüm:**
```typescript
// History'yi limit'le (son 5)
await prisma.passwordHistory.create({
  data: { userId, passwordHash }
})

// Eski kayıtları sil
const allHistory = await prisma.passwordHistory.findMany({
  where: { userId },
  orderBy: { changedAt: 'desc' },
})

if (allHistory.length > 5) {
  const toDelete = allHistory.slice(5)
  await prisma.passwordHistory.deleteMany({
    where: { id: { in: toDelete.map(h => h.id) } },
  })
}
```

### ❌ HATA: Şifre değişiminde session'ları sonlandırmamak

**Sorun:**
```typescript
// Sadece şifreyi değiştir - DİĞER SESSION'LAR AKTİF KALIR!
await prisma.user.update({
  where: { id: userId },
  data: { passwordHash: newPasswordHash },
})
```

**Çözüm:**
```typescript
// Şifre değişiminde tüm diğer session'ları sonlandır
await prisma.user.update({
  where: { id: userId },
  data: { passwordHash: newPasswordHash },
})

await prisma.session.deleteMany({
  where: {
    userId,
    hashedToken: { not: currentSessionToken },
  },
})
```

---

## 4. Recovery Code Rate Limiting

### ❌ HATA: Memory-based rate limiting

**Sorun:**
```typescript
// Memory'de rate limit - server restart'ta sıfırlanır
const rateLimits = new Map<string, number>()
```

**Çözüm:**
```typescript
// Database-based rate limiting (persistent)
const count = await prisma.auditLog.count({
  where: {
    userId,
    action: '2FA_RECOVERY_REGENERATED',
    timestamp: { gte: windowStart },
  },
})
```

### ❌ HATA: Eski kodları silmek

**Sorun:**
```typescript
// Kodları silmek - audit trail kaybı
await prisma.recoveryCode.deleteMany({
  where: { userId }
})
```

**Çözüm:**
```typescript
// Kodları invalidate et (sil değil)
await prisma.recoveryCode.updateMany({
  where: { userId },
  data: { invalidatedAt: new Date() },
})
```

### ❌ HATA: Rate limit window'u yanlış hesaplamak

**Sorun:**
```typescript
// 24 saat yerine 24 dakika
const windowStart = new Date(Date.now() - 24 * 60 * 1000) // YANLIŞ!
```

**Çözüm:**
```typescript
// 24 saat = 24 * 60 * 60 * 1000
const windowStart = new Date(Date.now() - 24 * 60 * 60 * 1000) // DOĞRU
```

### ❌ HATA: Rate limit'i başarısız regeneration'lara da uygulamak

**Sorun:**
```typescript
// Başarısız denemeler de sayılır - kullanıcı bloklanabilir
const count = await prisma.auditLog.count({
  where: {
    userId,
    action: '2FA_RECOVERY_REGENERATED',
    // success kontrolü yok!
  },
})
```

**Çözüm:**
```typescript
// Sadece başarılı regeneration'ları say
const count = await prisma.auditLog.count({
  where: {
    userId,
    action: '2FA_RECOVERY_REGENERATED',
    success: true, // ÖNEMLI!
  },
})
```

---

## 5. Middleware

### ❌ HATA: Her route'ta security headers uygulamak

**Sorun:**
```typescript
// Static asset'lere de header eklemek - gereksiz overhead
export const config = {
  matcher: '/:path*', // Tüm route'lar
}
```

**Çözüm:**
```typescript
// Static asset'leri exclude et
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

### ❌ HATA: Middleware'de blocking operation

**Sorun:**
```typescript
// Middleware'de yavaş database query - tüm request'leri yavaşlatır
export async function middleware(request: NextRequest) {
  const allBlockedIPs = await prisma.blockedIP.findMany() // YAVAŞ!
  // ...
}
```

**Çözüm:**
```typescript
// Sadece gerekli query'yi yap
export async function middleware(request: NextRequest) {
  const clientIP = extractClientIP(request)
  const blockedIP = await prisma.blockedIP.findFirst({
    where: { ip: clientIP } // Sadece bu IP
  })
  // ...
}
```

### ❌ HATA: Middleware'de exception handling eksikliği

**Sorun:**
```typescript
// Hata durumunda middleware crash olur
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  // Hata olursa ne olacak?
}
```

**Çözüm:**
```typescript
// Try-catch ile hataları yakala
export async function middleware(request: NextRequest) {
  try {
    const token = await getToken({ req: request })
    // ...
  } catch (error) {
    console.error('[MIDDLEWARE] Error:', error)
    return NextResponse.next() // Devam et
  }
}
```

---

## 6. Database

### ❌ HATA: Index eksikliği

**Sorun:**
```prisma
// Index olmadan query - YAVAŞ!
model BlockedIP {
  id String @id
  ip String @unique
  expiresAt DateTime?
  // @@index([expiresAt]) YOK!
}
```

**Çözüm:**
```prisma
// Sık kullanılan alanlara index ekle
model BlockedIP {
  id String @id
  ip String @unique
  expiresAt DateTime?
  
  @@index([ip])
  @@index([expiresAt]) // ÖNEMLI!
}
```

### ❌ HATA: Cascade delete eksikliği

**Sorun:**
```prisma
// User silindiğinde password history kalır - orphan records
model PasswordHistory {
  userId String
  user User @relation(fields: [userId], references: [id])
  // onDelete: Cascade YOK!
}
```

**Çözüm:**
```prisma
// Cascade delete ekle
model PasswordHistory {
  userId String
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 7. Testing

### ❌ HATA: Production'da test etmek

**Sorun:**
```typescript
// Production database'de test - TEHLİKELİ!
await blockIP('192.168.1.1', 'Test')
```

**Çözüm:**
```typescript
// Test database kullan
if (process.env.NODE_ENV === 'test') {
  // Test database
} else {
  // Production database
}
```

### ❌ HATA: Cleanup yapmamak

**Sorun:**
```typescript
// Test sonrası cleanup yok - veritabanı kirli kalır
await blockIP('test-ip', 'Test')
// Test bitti, IP hala blocked
```

**Çözüm:**
```typescript
// Test sonrası cleanup
afterEach(async () => {
  await prisma.blockedIP.deleteMany({
    where: { ip: 'test-ip' }
  })
})
```

---

## 8. Production Deployment

### ❌ HATA: Migration'ı production'da test etmemek

**Sorun:**
```bash
# Direkt production'da migrate - RİSKLİ!
npx prisma migrate deploy
```

**Çözüm:**
```bash
# Önce staging'de test et
# Staging
npx prisma migrate deploy

# Test et
npm run test

# Sonra production
npx prisma migrate deploy
```

### ❌ HATA: Backup almadan migration

**Sorun:**
```bash
# Backup olmadan migrate - VERİ KAYBI RİSKİ!
npx prisma migrate deploy
```

**Çözüm:**
```bash
# Önce backup al
pg_dump database > backup.sql

# Sonra migrate
npx prisma migrate deploy

# Sorun olursa restore
psql database < backup.sql
```

---

## Özet: En Önemli Kurallar

1. ✅ **Her zaman bcrypt kullan** - Plaintext şifre saklamayın
2. ✅ **Nonce'u her request'te yenile** - Static nonce kullanmayın
3. ✅ **IP extraction sırasına dikkat** - CF-Connecting-IP öncelikli
4. ✅ **Rate limiting database-based** - Memory-based kullanmayın
5. ✅ **Middleware'de try-catch** - Exception handling şart
6. ✅ **Index ekleyin** - Sık kullanılan alanlara index
7. ✅ **Cascade delete** - Orphan record'ları önleyin
8. ✅ **Production'da test etmeyin** - Staging kullanın
9. ✅ **Backup alın** - Migration öncesi mutlaka
10. ✅ **Cleanup yapın** - Test sonrası temizlik

---

**Bu dokümanı okuduysanız, Phase 3 güvenlik özelliklerini doğru implement edebilirsiniz!** ✅
