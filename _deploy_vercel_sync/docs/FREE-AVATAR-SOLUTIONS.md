# 🆓 Ücretsiz Avatar Çözümleri

**THE FACTORY için tamamen ücretsiz AI Avatar alternatifleri**

## 📋 Özet

| Çözüm | Kalite | Hız | Zorluk | Maliyet |
|-------|--------|-----|--------|---------|
| SadTalker | 7/10 | Orta | Orta | $0 |
| Wav2Lip | 6/10 | Hızlı | Kolay | $0 |
| Roop + Wav2Lip | 8/10 | Yavaş | Zor | $0 |
| HeyGen API | 9/10 | Hızlı | Çok Kolay | $29/ay |

## 🎯 Önerilen: SadTalker

### Nedir?
Ses dosyası + statik fotoğraf → Konuşan video (baş ve dudak hareketi)

### Avantajlar
- ✅ Tamamen ücretsiz
- ✅ Baş hareketleri dahil
- ✅ Gerçekçi dudak senkronizasyonu
- ✅ Google Colab ile GPU ücretsiz
- ✅ Offline çalışabilir

### Dezavantajlar
- ❌ HeyGen'den biraz daha düşük kalite
- ❌ GPU gerekir (ama Colab ücretsiz)
- ❌ Video başına 3-5 dakika render
- ❌ Vücut hareketi yok

## 🚀 Hızlı Başlangıç

### Google Colab (Önerilen)

```python
# 1. Colab'a git: https://colab.research.google.com
# 2. Yeni notebook oluştur
# 3. GPU'yu aktif et: Runtime → Change runtime type → GPU

# 4. SadTalker'ı kur
!git clone https://github.com/OpenTalker/SadTalker.git
%cd SadTalker
!pip install -r requirements.txt
!bash scripts/download_models.sh

# 5. Test et
!python inference.py \
  --driven_audio test_audio.mp3 \
  --source_image test_image.jpg \
  --result_dir results \
  --still --preprocess full
```

### Local Kurulum (GPU Varsa)

```bash
# 1. Repository'yi klonla
git clone https://github.com/OpenTalker/SadTalker.git
cd SadTalker

# 2. Bağımlılıkları kur
pip install -r requirements.txt

# 3. Model'leri indir
bash scripts/download_models.sh

# 4. Test et
python inference.py \
  --driven_audio audio.mp3 \
  --source_image anchor.jpg \
  --result_dir output
```

## 📝 THE FACTORY Entegrasyonu

### Adım 1: Avatar Modülü Oluştur

```python
# sovereign-core/core/avatar_free.py
import subprocess
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class FreeAvatarGenerator:
    """Ücretsiz AI Avatar - SadTalker"""
    
    def __init__(self, sadtalker_path: str = "SadTalker"):
        self.sadtalker_path = Path(sadtalker_path)
        logger.info(f"[AVATAR] SadTalker yolu: {self.sadtalker_path}")
    
    def generate_video(
        self,
        audio_path: str,
        image_path: str = "assets/anchor.jpg",
        output_dir: str = "output/avatars"
    ) -> str:
        """
        Konuşan avatar video oluştur
        
        Args:
            audio_path: Ses dosyası (.mp3)
            image_path: Spiker fotoğrafı (.jpg)
            output_dir: Çıktı klasörü
        
        Returns:
            Video dosya yolu
        """
        
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"[AVATAR] Video oluşturuluyor: {audio_path}")
        
        cmd = [
            "python", "inference.py",
            "--driven_audio", audio_path,
            "--source_image", image_path,
            "--result_dir", str(output_path),
            "--still",  # Statik arka plan
            "--preprocess", "full",  # Tam işleme
            "--enhancer", "gfpgan"  # Yüz iyileştirme
        ]
        
        try:
            subprocess.run(
                cmd, 
                cwd=self.sadtalker_path,
                check=True,
                capture_output=True
            )
            
            # Çıktı dosyasını bul
            video_file = list(output_path.glob("*.mp4"))[0]
            
            logger.info(f"[AVATAR] ✓ Video oluşturuldu: {video_file}")
            return str(video_file)
            
        except Exception as e:
            logger.error(f"[AVATAR] ✗ Hata: {e}")
            return None
```

### Adım 2: Compositor'a Entegre Et

```python
# sovereign-core/core/compositor.py içine ekle

from core.avatar_free import FreeAvatarGenerator

class Compositor:
    def __init__(self, ...):
        # Mevcut kod...
        
        # Avatar generator ekle (opsiyonel)
        if os.getenv('USE_FREE_AVATAR') == 'true':
            self.avatar_gen = FreeAvatarGenerator()
        else:
            self.avatar_gen = None
    
    def compose_video_with_avatar(
        self,
        audio_path: str,
        title: str,
        sentiment: str,
        sentiment_score: int,
        language_code: str,
        article_id: str,
        chart_path: Optional[str] = None
    ) -> Optional[str]:
        """Avatar'lı video kompozisyonu"""
        
        output_filename = f"{article_id}_{language_code}_avatar.mp4"
        output_path = self.output_dir / output_filename
        
        try:
            # 1. Avatar video oluştur
            if self.avatar_gen:
                logger.info("[COMPOSITOR] Avatar oluşturuluyor...")
                avatar_video = self.avatar_gen.generate_video(
                    audio_path=audio_path,
                    image_path="assets/anchor.jpg"
                )
                
                if not avatar_video:
                    logger.warning("[COMPOSITOR] Avatar oluşturulamadı, standart video yapılıyor")
                    return self.compose_video(...)  # Fallback
                
                # Avatar video'yu yükle
                avatar_clip = VideoFileClip(avatar_video)
            else:
                # Avatar yok, background kullan
                audio = AudioFileClip(audio_path)
                avatar_clip = ImageClip(str(self.background_path)).set_duration(audio.duration)
                avatar_clip = avatar_clip.set_audio(audio)
            
            # 2. Overlays ekle
            clips = [avatar_clip]
            
            # Title overlay
            title_clip = TextClip(
                title[:80],
                fontsize=48,
                color='white',
                font='Arial-Bold',
                size=(1820, None),
                method='caption'
            ).set_position((50, 50)).set_duration(avatar_clip.duration)
            clips.append(title_clip)
            
            # Sentiment overlay
            sentiment_color = {
                'BULLISH': '#00FF41',
                'BEARISH': '#FF4136',
                'NEUTRAL': '#FFD700'
            }.get(sentiment, '#FFFFFF')
            
            sentiment_text = f"Sentiment: {sentiment} ({sentiment_score}/100)"
            sentiment_clip = TextClip(
                sentiment_text,
                fontsize=36,
                color=sentiment_color,
                font='Arial-Bold'
            ).set_position((50, 150)).set_duration(avatar_clip.duration)
            clips.append(sentiment_clip)
            
            # Chart overlay
            if chart_path and Path(chart_path).exists():
                chart_clip = ImageClip(chart_path).set_duration(avatar_clip.duration)
                chart_clip = chart_clip.set_position((1920 - 420, 1080 - 320))
                clips.append(chart_clip)
            
            # 3. Final composition
            video = CompositeVideoClip(clips, size=(1920, 1080))
            
            # 4. Render
            logger.info(f"[COMPOSITOR] Rendering: {output_filename}")
            video.write_videofile(
                str(output_path),
                fps=30,
                codec='libx264',
                audio_codec='aac',
                audio_bitrate='192k',
                preset='medium',
                threads=4,
                logger=None
            )
            
            # Cleanup
            video.close()
            if self.avatar_gen:
                avatar_clip.close()
            
            file_size_mb = output_path.stat().st_size / (1024 * 1024)
            logger.info(f"[COMPOSITOR] ✓ Video: {output_filename} ({file_size_mb:.2f} MB)")
            
            return str(output_path)
            
        except Exception as e:
            logger.error(f"[COMPOSITOR] ✗ Hata: {e}")
            return None
```

### Adım 3: .env Konfigürasyonu

```env
# Avatar ayarları
USE_FREE_AVATAR=false  # true yapınca aktif olur
SADTALKER_PATH=SadTalker  # SadTalker klasör yolu
ANCHOR_IMAGE=assets/anchor.jpg  # Spiker fotoğrafı
```

## 🎬 Kullanım

### Manuel Test

```bash
cd sovereign-core

# Avatar modülünü test et
python -c "
from core.avatar_free import FreeAvatarGenerator

gen = FreeAvatarGenerator()
video = gen.generate_video(
    audio_path='output/audio/test_en.mp3',
    image_path='assets/anchor.jpg'
)
print(f'Video: {video}')
"
```

### THE FACTORY ile

```bash
# .env dosyasını düzenle
USE_FREE_AVATAR=true

# THE FACTORY'yi başlat
python main.py

# Manuel cycle tetikle
curl -X POST http://localhost:8000/cycle/trigger
```

## 📊 Performans

### Render Süreleri (GPU: T4)

| Video Uzunluğu | SadTalker | HeyGen API |
|----------------|-----------|------------|
| 1 dakika | ~2 dakika | ~30 saniye |
| 3 dakika | ~5 dakika | ~1 dakika |
| 5 dakika | ~8 dakika | ~2 dakika |

### Kalite Karşılaştırması

| Özellik | SadTalker | HeyGen |
|---------|-----------|--------|
| Dudak Sync | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Baş Hareketi | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Vücut Hareketi | ❌ | ⭐⭐⭐⭐ |
| Doğallık | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Hız | ⭐⭐ | ⭐⭐⭐⭐⭐ |

## 🔧 Troubleshooting

### GPU Bulunamadı
```bash
# Google Colab kullan (ücretsiz GPU)
# veya
# CPU ile çalıştır (çok yavaş)
```

### Model İndirme Hatası
```bash
cd SadTalker
bash scripts/download_models.sh
# Manuel: https://github.com/OpenTalker/SadTalker/releases
```

### Düşük Kalite
```python
# Yüz iyileştirme aktif et
--enhancer gfpgan

# Tam işleme kullan
--preprocess full

# Daha yüksek çözünürlük
--size 1024
```

## 💡 İpuçları

### 1. Spiker Fotoğrafı Seçimi
- Yüksek çözünürlük (min 512x512)
- Düz bakış açısı
- İyi aydınlatma
- Nötr ifade

### 2. Performans Optimizasyonu
- Batch processing kullan
- GPU memory'yi optimize et
- Düşük öncelikli videolar için CPU

### 3. Hybrid Yaklaşım
```python
# İlk 10 saniye: Avatar (SadTalker)
# Orta kısım: Charts + B-roll
# Son 5 saniye: Avatar
# Toplam render: Daha hızlı
```

## 🚀 Gelecek İyileştirmeler

1. **Colab API Entegrasyonu**
   - Uzaktan render
   - Daha hızlı işleme
   - Otomatik scaling

2. **Batch Processing**
   - Çoklu video aynı anda
   - Queue sistemi
   - Öncelik sıralaması

3. **Custom Avatar Training**
   - Kendi yüzünü eğit
   - Daha iyi kalite
   - Marka kimliği

## 📚 Kaynaklar

- **SadTalker GitHub**: https://github.com/OpenTalker/SadTalker
- **Wav2Lip GitHub**: https://github.com/Rudrabha/Wav2Lip
- **Google Colab**: https://colab.research.google.com
- **HeyGen API**: https://docs.heygen.com (ücretli alternatif)

## 🎯 Sonuç

**Ücretsiz Çözüm:**
- Maliyet: $0
- Kalite: 7/10
- Kurulum: Orta zorluk
- Sürdürülebilir: ✅

**Ücretli Çözüm (HeyGen):**
- Maliyet: $29/ay
- Kalite: 9/10
- Kurulum: Çok kolay
- Sürdürülebilir: ✅

**Öneri:** Ücretsiz ile başla, büyüdükçe ücretliye geç!

---

**Not:** Bu dokümantasyon hazır, ihtiyaç olduğunda kullanılabilir.
