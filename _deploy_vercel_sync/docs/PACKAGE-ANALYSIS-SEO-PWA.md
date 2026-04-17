# SIA Intel – Paket Analiz Raporu (SEO, PWA, AdSense, Görsel)

## Mevcut Durum (package.json)

| Kategori | Paket | Durum | Açıklama |
|----------|-------|-------|----------|
| **Gemini** | `@google/generative-ai` | ✅ Yüklü | Gemini API entegrasyonu |
| **Görsel** | `sharp` | ✅ Yüklü | next/image optimizasyonu (AVIF/WebP) |
| **Firebase** | `firebase` | ❌ Yok | Client SDK (Auth, Analytics, Performance/Vitals) yok |
| **Firebase REST** | `googleapis` | ✅ Yüklü | Server-side Firebase REST API'leri (hosting, firestore vb.) |
| **PWA** | `next-pwa` / `@ducanh2912/next-pwa` | ❌ Yok | Service Worker, manifest, offline destek |
| **Cookie/KVKK** | Harici kütüphane | ❌ Yok | `CookieConsent.tsx` custom component mevcut |
| **Android Vitals** | Firebase Perf | ❌ Yok | `firebase` ile birlikte gelir |

---

## Eksik Paketler ve Öneriler

### 1. PWA (Google Discover uyumluluğu) – **Kurulacak**

- **Paket:** `@ducanh2912/next-pwa`
- **Neden:** Next.js 14 uyumlu, service worker, manifest, offline cache
- **Ek:** `webpack` (devDependency – next-pwa için)

### 2. Firebase Client SDK – **Opsiyonel**

- **Paket:** `firebase`
- **Neden:** Firebase Auth, Analytics, Performance Monitoring (Android Vitals)
- **Not:** Kodda doğrudan Firebase client kullanımı yok; ileride eklenirse kurulmalı

### 3. Cookie Consent (KVKK/AdSense) – **Opsiyonel**

- **Mevcut:** `components/CookieConsent.tsx` – Accept/Reject, localStorage
- **Opsiyonel paketler:** `cookieconsent`, `@cookiehub/react`, `react-cookie-consent`
- **Not:** Mevcut component temel KVKK/AdSense için yeterli; IAB TCF 2.0 / Google Consent Mode v2 için ek kütüphane düşünülebilir

### 4. Sharp – **Zaten yüklü**

- `next.config.js` içinde `serverComponentsExternalPackages: ['sharp']` tanımlı
- `images.formats: ['image/avif', 'image/webp']` kullanılıyor

---

## Kurulum Planı

**Kesin kurulacaklar:**
- `@ducanh2912/next-pwa`
- `webpack` (devDependency)

**next.config.js:** `withPWA` ile sarmalanacak
