# SIA Intel Terminal - Language System Guide

**Version**: SOVEREIGN_V14  
**Languages**: 6 (EN, TR, DE, ES, FR, AR)  
**Status**: OPERATIONAL

---

## 🌍 Overview

The SIA Intel Terminal supports 6 languages with full UI translation, region-based intelligence filtering, and language-specific video streaming.

---

## 📚 Supported Languages

| Code | Language | Region | Flag |
|------|----------|--------|------|
| `en` | English | WALL ST | 🇺🇸 |
| `tr` | Turkish | TURKEY | 🇹🇷 |
| `de` | German | EUROPE | 🇩🇪 |
| `es` | Spanish | LATAM | 🇪🇸 |
| `fr` | French | EUROPE | 🇫🇷 |
| `ar` | Arabic | GULF | 🇸🇦 |

---

## 🔧 Implementation

### Context Provider

**File**: `contexts/LanguageContext.tsx`

```typescript
import { useLanguage } from '@/contexts/LanguageContext'

const { currentLang, setLanguage, t } = useLanguage()
```

### Translation Function

```typescript
// Simple translation
t('terminal.title') // Returns: "SIA INTEL"

// With parameters
t('log.loaded', { count: 5 }) // Returns: "✓ LOADED 5 INTELLIGENCE REPORTS"
```

### Language Switching

```typescript
// Switch to Turkish
setLanguage('tr')

// This triggers:
// 1. UI text updates
// 2. Intelligence feed filtering
// 3. Video reload for new language
// 4. System log message
// 5. localStorage save
```

---

## 📖 Translation Keys

### Terminal UI

| Key | EN | TR | DE | ES | FR | AR |
|-----|----|----|----|----|----|----|
| `terminal.title` | SIA INTEL | SIA INTEL | SIA INTEL | SIA INTEL | SIA INTEL | SIA INTEL |
| `terminal.access` | LIVE TERMINAL - ACCESS GRANTED | CANLI TERMİNAL - ERİŞİM ONAYLANDI | LIVE-TERMINAL - ZUGRIFF GEWÄHRT | TERMINAL EN VIVO - ACCESO CONCEDIDO | TERMINAL EN DIRECT - ACCÈS ACCORDÉ | محطة مباشرة - تم منح الوصول |
| `terminal.session` | SESSION: SOVEREIGN_V14 | OTURUM: SOVEREIGN_V14 | SITZUNG: SOVEREIGN_V14 | SESIÓN: SOVEREIGN_V14 | SESSION: SOVEREIGN_V14 | الجلسة: SOVEREIGN_V14 |

### Market Sentiment

| Key | EN | TR | DE | ES | FR | AR |
|-----|----|----|----|----|----|----|
| `terminal.sentiment` | MARKET SENTIMENT | PİYASA DUYARLILIĞI | MARKTSTIMMUNG | SENTIMIENTO DEL MERCADO | SENTIMENT DU MARCHÉ | معنويات السوق |
| `terminal.greed` | GREED INDEX | AÇGÖZLÜLÜK ENDEKSİ | GIER-INDEX | ÍNDICE DE CODICIA | INDICE DE CUPIDITÉ | مؤشر الجشع |
| `terminal.vol` | VOL INDEX | VOL ENDEKSİ | VOL-INDEX | ÍNDICE VOL | INDICE VOL | مؤشر VOL |
| `terminal.putcall` | PUT/CALL | PUT/CALL | PUT/CALL | PUT/CALL | PUT/CALL | PUT/CALL |
| `terminal.momentum` | MOMENTUM | MOMENTUM | MOMENTUM | MOMENTUM | MOMENTUM | الزخم |

### Intelligence Feed

| Key | EN | TR | DE | ES | FR | AR |
|-----|----|----|----|----|----|----|
| `terminal.intel` | INTEL FEED // GLOBAL_SURVEILLANCE_ACTIVE | İSTİHBARAT AKIŞI // KÜRESEL_GÖZETİM_AKTİF | INTEL-FEED // GLOBALE_ÜBERWACHUNG_AKTIV | FEED DE INTEL // VIGILANCIA_GLOBAL_ACTIVA | FLUX INTEL // SURVEILLANCE_GLOBALE_ACTIVE | تدفق المعلومات // المراقبة_العالمية_نشطة |
| `terminal.time` | TIME | ZAMAN | ZEIT | TIEMPO | TEMPS | الوقت |
| `terminal.intelligence` | INTELLIGENCE | İSTİHBARAT | INTELLIGENZ | INTELIGENCIA | INTELLIGENCE | الاستخبارات |
| `terminal.region` | REGION | BÖLGE | REGION | REGIÓN | RÉGION | المنطقة |
| `terminal.signal` | SIGNAL | SİNYAL | SIGNAL | SEÑAL | SIGNAL | الإشارة |
| `terminal.impact` | IMPACT | ETKİ | AUSWIRKUNG | IMPACTO | IMPACT | التأثير |

### Video Monitor

| Key | EN | TR | DE | ES | FR | AR |
|-----|----|----|----|----|----|----|
| `terminal.monitor` | LIVE MONITOR | CANLI MONİTÖR | LIVE-MONITOR | MONITOR EN VIVO | MONITEUR EN DIRECT | شاشة مباشرة |
| `terminal.rec` | REC | KAYIT | AUFN | GRAB | ENREG | تسجيل |
| `terminal.awaiting` | AWAITING SIGNAL | SİNYAL BEKLENİYOR | WARTE AUF SIGNAL | ESPERANDO SEÑAL | EN ATTENTE DE SIGNAL | في انتظار الإشارة |
| `terminal.channel` | CHANNEL: SIAINTEL-01 | KANAL: SIAINTEL-01 | KANAL: SIAINTEL-01 | CANAL: SIAINTEL-01 | CANAL: SIAINTEL-01 | القناة: SIAINTEL-01 |
| `terminal.resolution` | RESOLUTION | ÇÖZÜNÜRLÜK | AUFLÖSUNG | RESOLUCIÓN | RÉSOLUTION | الدقة |
| `terminal.framerate` | FRAMERATE | KARE HIZI | BILDRATE | TASA DE FOTOGRAMAS | FRÉQUENCE D'IMAGES | معدل الإطار |
| `terminal.bitrate` | BITRATE | BİT HIZI | BITRATE | TASA DE BITS | DÉBIT BINAIRE | معدل البت |
| `terminal.channels` | AVAILABLE CHANNELS | MEVCUT KANALLAR | VERFÜGBARE KANÄLE | CANALES DISPONIBLES | CANAUX DISPONIBLES | القنوات المتاحة |

### System Logs

| Key | EN | TR | DE | ES | FR | AR |
|-----|----|----|----|----|----|----|
| `log.init` | TERMINAL INITIALIZED | TERMİNAL BAŞLATILDI | TERMINAL INITIALISIERT | TERMINAL INICIALIZADO | TERMINAL INITIALISÉ | تم تهيئة المحطة |
| `log.connecting` | CONNECTING TO INTELLIGENCE NETWORK... | İSTİHBARAT AĞINA BAĞLANILIYOR... | VERBINDUNG ZUM INTELLIGENCE-NETZWERK... | CONECTANDO A RED DE INTELIGENCIA... | CONNEXION AU RÉSEAU D'INTELLIGENCE... | الاتصال بشبكة الاستخبارات... |
| `log.connected` | ✓ CONNECTED TO GEMINI-2.5-PRO | ✓ GEMINI-2.5-PRO'YA BAĞLANDI | ✓ MIT GEMINI-2.5-PRO VERBUNDEN | ✓ CONECTADO A GEMINI-2.5-PRO | ✓ CONNECTÉ À GEMINI-2.5-PRO | ✓ متصل بـ GEMINI-2.5-PRO |
| `log.market` | ✓ MARKET DATA STREAM ACTIVE | ✓ PİYASA VERİ AKIŞI AKTİF | ✓ MARKTDATEN-STREAM AKTIV | ✓ FLUJO DE DATOS DE MERCADO ACTIVO | ✓ FLUX DE DONNÉES DE MARCHÉ ACTIF | ✓ تدفق بيانات السوق نشط |
| `log.sync` | ✓ INTELLIGENCE FEED SYNCHRONIZED | ✓ İSTİHBARAT AKIŞI SENKRONİZE | ✓ INTELLIGENCE-FEED SYNCHRONISIERT | ✓ FEED DE INTELIGENCIA SINCRONIZADO | ✓ FLUX D'INTELLIGENCE SYNCHRONISÉ | ✓ تم مزامنة تدفق الاستخبارات |
| `log.unavailable` | ⚠ FACTORY FEED UNAVAILABLE | ⚠ FABRİKA AKIŞI KULLANILAMAZ | ⚠ FABRIK-FEED NICHT VERFÜGBAR | ⚠ FEED DE FÁBRICA NO DISPONIBLE | ⚠ FLUX D'USINE NON DISPONIBLE | ⚠ تدفق المصنع غير متاح |

### Status Bar

| Key | EN | TR | DE | ES | FR | AR |
|-----|----|----|----|----|----|----|
| `terminal.connected` | CONNECTED | BAĞLANDI | VERBUNDEN | CONECTADO | CONNECTÉ | متصل |
| `terminal.latency` | LATENCY | GECİKME | LATENZ | LATENCIA | LATENCE | الكمون |
| `terminal.uptime` | UPTIME | ÇALIŞMA SÜRESİ | BETRIEBSZEIT | TIEMPO ACTIVO | TEMPS DE FONCTIONNEMENT | وقت التشغيل |
| `terminal.live` | LIVE | CANLI | LIVE | EN VIVO | EN DIRECT | مباشر |
| `terminal.systime` | SYS TIME | SİSTEM ZAMANI | SYSTEMZEIT | HORA DEL SISTEMA | HEURE SYSTÈME | وقت النظام |
| `terminal.source` | SOURCE: GEMINI-2.5-PRO-SIA | KAYNAK: GEMINI-2.5-PRO-SIA | QUELLE: GEMINI-2.5-PRO-SIA | FUENTE: GEMINI-2.5-PRO-SIA | SOURCE: GEMINI-2.5-PRO-SIA | المصدر: GEMINI-2.5-PRO-SIA |

---

## 🎯 Region Mapping

```typescript
const getRegionFromLanguage = (code: string): string => {
  const regions: Record<string, string> = {
    'en': 'WALL ST',   // United States
    'ar': 'GULF',      // Middle East
    'de': 'EUROPE',    // Germany
    'es': 'LATAM',     // Latin America
    'fr': 'EUROPE',    // France
    'tr': 'TURKEY'     // Turkey
  }
  return regions[code] || 'GLOBAL'
}
```

---

## 📹 Video File Naming

Videos must follow this naming convention:

```
article-{id}-{lang}.mp4

Examples:
- article-123-en.mp4
- article-123-tr.mp4
- article-123-de.mp4
- article-123-es.mp4
- article-123-fr.mp4
- article-123-ar.mp4
```

**Location**: `public/videos/`

---

## 🔄 Language Switch Flow

```
User clicks language button (e.g., "TR")
    ↓
setLanguage('tr') called
    ↓
┌─────────────────────────────────────┐
│ 1. Update currentLang state         │
│ 2. Save to localStorage             │
│ 3. Trigger useEffect hooks          │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ UI Updates (immediate)              │
│ - All t() calls re-render           │
│ - Headers, labels, buttons          │
│ - System logs                       │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Intelligence Feed Filter            │
│ - Filter by region                  │
│ - Show only relevant intelligence   │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ Video Reload                        │
│ - Fetch latest video for language   │
│ - Update video player source        │
│ - Show loading state                │
└─────────────────────────────────────┘
    ↓
┌─────────────────────────────────────┐
│ System Log                          │
│ - Add "✓ CHANNEL SWITCHED: TR"     │
└─────────────────────────────────────┘
```

---

## 💾 Persistence

Language preference is saved to browser localStorage:

```typescript
// Save
localStorage.setItem('terminal-lang', 'tr')

// Load on mount
const saved = localStorage.getItem('terminal-lang')
if (saved) {
  setCurrentLang(saved)
}
```

**Key**: `terminal-lang`  
**Value**: Language code (en, tr, de, es, fr, ar)

---

## 🧪 Testing Language System

### Manual Tests

1. **Switch to each language**:
   - Click EN, TR, DE, ES, FR, AR buttons
   - Verify all UI text changes
   - Check system logs update

2. **Intelligence filtering**:
   - Switch to TR → Should show TURKEY region
   - Switch to AR → Should show GULF region
   - Switch to DE → Should show EUROPE region

3. **Video loading**:
   - Switch language
   - Verify video URL changes
   - Check system log shows video filename

4. **Persistence**:
   - Switch to TR
   - Refresh page
   - Verify TR is still selected

### Automated Tests (Future)

```typescript
describe('Language System', () => {
  it('should switch language on button click', () => {
    // Test implementation
  })
  
  it('should filter intelligence by region', () => {
    // Test implementation
  })
  
  it('should load language-specific video', () => {
    // Test implementation
  })
  
  it('should persist language preference', () => {
    // Test implementation
  })
})
```

---

## 🐛 Troubleshooting

### Issue: Language not switching

**Solution**: Check if LanguageProvider is in layout.tsx:

```typescript
// app/layout.tsx
import { LanguageProvider } from '@/contexts/LanguageContext'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <LanguageProvider>
          {children}
        </LanguageProvider>
      </body>
    </html>
  )
}
```

### Issue: Translation key not found

**Solution**: Add missing key to all languages in `contexts/LanguageContext.tsx`:

```typescript
const translations: Record<Language, Record<string, string>> = {
  en: {
    'new.key': 'English Text',
    // ...
  },
  tr: {
    'new.key': 'Türkçe Metin',
    // ...
  },
  // ... other languages
}
```

### Issue: Video not loading for language

**Solution**: Check video file exists with correct naming:

```bash
ls public/videos/article-*-tr.mp4
```

### Issue: Intelligence feed empty after language switch

**Solution**: Check region mapping and ensure Factory produces content for that language.

---

## 📝 Adding New Translations

### Step 1: Add to Context

Edit `contexts/LanguageContext.tsx`:

```typescript
const translations: Record<Language, Record<string, string>> = {
  en: {
    'new.feature.title': 'New Feature',
    // ...
  },
  tr: {
    'new.feature.title': 'Yeni Özellik',
    // ...
  },
  // ... add to all 6 languages
}
```

### Step 2: Use in Component

```typescript
import { useLanguage } from '@/contexts/LanguageContext'

const { t } = useLanguage()

return <h1>{t('new.feature.title')}</h1>
```

### Step 3: Test

- Switch to each language
- Verify text displays correctly
- Check for missing translations (falls back to EN)

---

## 🌐 Adding New Language

### Step 1: Update Type

```typescript
type Language = 'en' | 'tr' | 'de' | 'es' | 'fr' | 'ar' | 'pt' // Add 'pt'
```

### Step 2: Add Translations

```typescript
const translations: Record<Language, Record<string, string>> = {
  // ... existing languages
  pt: {
    'terminal.title': 'SIA INTEL',
    'terminal.access': 'TERMINAL AO VIVO - ACESSO CONCEDIDO',
    // ... all keys
  }
}
```

### Step 3: Add Region Mapping

```typescript
const getRegionFromLanguage = (code: string): string => {
  const regions: Record<string, string> = {
    // ... existing
    'pt': 'LATAM'
  }
  return regions[code] || 'GLOBAL'
}
```

### Step 4: Add Button

```typescript
{(['en', 'tr', 'de', 'es', 'fr', 'ar', 'pt'] as const).map((lang) => (
  <button key={lang} onClick={() => setLanguage(lang)}>
    {lang.toUpperCase()}
  </button>
))}
```

---

## 📊 Translation Coverage

| Component | Coverage | Status |
|-----------|----------|--------|
| System Header | 100% | ✅ |
| Market Sentiment | 100% | ✅ |
| Intelligence Feed | 100% | ✅ |
| Video Monitor | 100% | ✅ |
| Status Bar | 100% | ✅ |
| System Logs | 100% | ✅ |
| Language Buttons | 100% | ✅ |

**Total Keys**: 30+  
**Languages**: 6  
**Total Translations**: 180+

---

## 🎉 Conclusion

The language system is fully operational with:

- ✅ 6 languages supported
- ✅ 180+ translations
- ✅ Real-time UI updates
- ✅ Intelligence filtering by region
- ✅ Language-specific video loading
- ✅ Persistent language preference
- ✅ Smooth transitions
- ✅ Fallback to English

**Status**: PRODUCTION READY 🚀

---

**Last Updated**: 2026-02-28  
**Version**: SOVEREIGN_V14  
**Maintainer**: SIA Intel Development Team
