# Uygulama Planı - Ana Sayfa Görsel ve Fonksiyonel Mükemmelleştirme

Ana sayfadaki metinlerin okunabilirliğini (kontrastını) artırmak, renksiz alanları canlandırmak ve "AI Terminal" hissini profesyonel bir dokunuşla pekiştirmek için bu planı hazırladım.

## Kullanıcı Onayı Gereken Kritik Noktalar

> [!IMPORTANT]
> - **Okunabilirlik**: Soluk gri metinleri, hem koyu hem açık modda keskin ve net okunacak (Pure White / Deep Slate) renklerle değiştireceğim.
> - **Renk Paleti**:Bloomberg Turuncusu ve Kurumsal Mavi'yi ana sayfanın "işlevsiz" duran (sadece metin içeren) yerlerinde ikonlar ve canlı sınır çizgileri olarak kullanacağım.

## Önerilen Değişiklikler

### 1. Tipografi ve Kontrast Güçlendirme

#### [globals.css](file:///C:/Users/ela19/OneDrive/Desktop/SIAIntel/app/globals.css)
- `--text-muted` ve `--text-secondary` değişkenlerini daha yüksek kontrastlı değerlere çekeceğim.
- Metinlerin üzerine gelindiğinde oluşan "soluklaşma" efektlerini kaldırıp, "parlama" (glow) veya "netleşme" efektleri ekleyeceğim.

### 2. Renksiz ve İşlevsiz Alanların Canlandırılması

#### [signal-terminal.tsx](file:///C:/Users/ela19/OneDrive/Desktop/SIAIntel/components/signal-terminal.tsx)
- Terminal kartlarına canlı gradyan kenarlıklar eklenecek.
- Veri değerleri (Risk-On, Elevated vb.) daha büyük ve parlak fontlarla vurgulanacak.

#### [trust-strip.tsx](file:///C:/Users/ela19/OneDrive/Desktop/SIAIntel/components/trust-strip.tsx)
- Şu an çok düz duran bu bölümü, mikro-animasyonlu ikonlar ve "SIA Verification" damgalarıyla "kurumsal güven" veren bir alana dönüştüreceğim.

### 3. Kendi Gözlemimle Eksik Gördüğüm Noktalar (Benim Önerilerim)

- **Hover Etkinliği**: Kartların üzerine gelindiğinde sadece renk değişmesi yetersiz. Kartın içinde hafif bir "taramalı radar" efekti (scanline) geçmesini sağlayacağım.
- **Canlılık Hissi**: `live-signal-ribbon.tsx` bölümündeki fiyat geçişlerine "yukarı/aşağı" yönlü anlık renk değişimleri (yeşil/kırmızı flaş) ekleyerek canlı veri akışı hissini güçlendireceğim.
- **Veri Görselleştirme**: `HeroSection`daki confidence bar (güven çubuğu) şu an çok statik. Oraya küçük bir "dalgalanma" animasyonu ekleyerek gerçek zamanlı hesaplama yapıldığı izlenimini vereceğim.

## Doğrulama Planı

### Manuel Kontrol
- **Kontrast Testi**: Metinlerin beyaz ve siyah zeminde WCAG standartlarına (okunabilirlik) uygunluğu test edilecek.
- **Etkileşim Kontrolü**: Tüm yeni animasyonların sayfa hızını (FPS) düşürmediği doğrulanacak.
