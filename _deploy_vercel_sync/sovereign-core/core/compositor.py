"""
SOVEREIGN V14 - Compositor Module
Video Composition using MoviePy (Financial Intelligence Videos)
"""

import os
import re
import logging
from typing import Dict, Optional, Tuple
from pathlib import Path
from datetime import datetime, timedelta

import yfinance as yf
import matplotlib
matplotlib.use('Agg')  # Non-GUI backend
import matplotlib.pyplot as plt
from matplotlib.figure import Figure

from moviepy import (
    ImageClip, 
    AudioFileClip, 
    CompositeVideoClip, 
    TextClip
)
from PIL import Image, ImageDraw, ImageFont

logger = logging.getLogger(__name__)


# Symbol detection mapping
SYMBOL_KEYWORDS = {
    'BTC-USD': ['bitcoin', 'btc', 'crypto'],
    'ETH-USD': ['ethereum', 'eth', 'ether'],
    '^IXIC': ['nasdaq', 'tech stocks', 'technology'],
    '^GSPC': ['s&p 500', 'spx', 's&p', 'sp500'],
    '^DJI': ['dow jones', 'djia', 'dow'],
    '^TNX': ['fed', 'federal reserve', 'treasury', 'interest rate']
}


class Compositor:
    """Video Composition Engine"""
    
    def __init__(
        self, 
        output_dir: str = 'output/videos',
        assets_dir: str = 'assets'
    ):
        self.output_dir = Path(output_dir)
        self.assets_dir = Path(assets_dir)
        
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.assets_dir.mkdir(parents=True, exist_ok=True)
        
        # Background image kontrolü
        self.background_path = self.assets_dir / 'studio_background.jpg'
        if not self.background_path.exists():
            logger.warning(f"[COMPOSITOR] Background image bulunamadı: {self.background_path}")
            logger.warning("[COMPOSITOR] Solid color background kullanılacak")
            self._create_default_background()
        
        # Logo kontrolü (SIAIntel watermark)
        self.logo_path = self.assets_dir / 'logo.png'
        if not self.logo_path.exists():
            logger.warning(f"[COMPOSITOR] Logo bulunamadı: {self.logo_path}")
            logger.warning("[COMPOSITOR] Logo watermark atlanacak")
            self.logo_path = None
        else:
            logger.info(f"[COMPOSITOR] ✓ Logo yüklendi: {self.logo_path}")
        
        logger.info(f"[COMPOSITOR] Video compositor başlatıldı: {self.output_dir}")
    
    def _create_default_background(self):
        """Varsayılan solid color background oluştur"""
        # 1920x1080 pure black background
        img = Image.new('RGB', (1920, 1080), color='#0A0A0A')
        img.save(self.background_path)
        logger.info("[COMPOSITOR] Varsayılan background oluşturuldu")
    
    def detect_symbol(self, title: str, content: str) -> Optional[str]:
        """Haber içeriğinden finansal sembol tespit et"""
        combined_text = f"{title} {content}".lower()
        
        for symbol, keywords in SYMBOL_KEYWORDS.items():
            for keyword in keywords:
                if keyword in combined_text:
                    logger.info(f"[COMPOSITOR] Sembol tespit edildi: {symbol} (keyword: {keyword})")
                    return symbol
        
        logger.info("[COMPOSITOR] Sembol tespit edilemedi")
        return None
    
    def generate_chart(
        self, 
        symbol: str, 
        output_filename: str,
        hours: int = 24
    ) -> Optional[str]:
        """yfinance ile finansal chart oluştur"""
        
        chart_path = self.assets_dir / output_filename
        
        try:
            logger.info(f"[COMPOSITOR] Chart oluşturuluyor: {symbol} (son {hours} saat)")
            
            # yfinance'den veri çek
            ticker = yf.Ticker(symbol)
            
            # Son 24 saat için 1 saatlik interval
            end_date = datetime.now()
            start_date = end_date - timedelta(hours=hours)
            
            df = ticker.history(start=start_date, end=end_date, interval='1h')
            
            if df.empty:
                logger.warning(f"[COMPOSITOR] {symbol} için veri bulunamadı")
                return None
            
            # Chart oluştur
            fig, ax = plt.subplots(figsize=(4, 3), facecolor='#0A0A0A')
            ax.set_facecolor('#0A0A0A')
            
            # Çizgi grafiği
            ax.plot(df.index, df['Close'], color='#00FF41', linewidth=2)
            
            # Grid ve stil
            ax.grid(True, color='#1A1A1A', linestyle='--', linewidth=0.5)
            ax.tick_params(colors='#FFFFFF', labelsize=8)
            
            # Başlık
            ax.set_title(f"{symbol} - Last {hours}H", color='#FFD700', fontsize=10, fontweight='bold')
            
            # Eksen etiketleri
            ax.set_xlabel('Time', color='#FFFFFF', fontsize=8)
            ax.set_ylabel('Price', color='#FFFFFF', fontsize=8)
            
            # Tight layout
            plt.tight_layout()
            
            # Kaydet (transparent background)
            plt.savefig(
                chart_path, 
                facecolor='#0A0A0A', 
                edgecolor='none',
                dpi=100,
                bbox_inches='tight'
            )
            plt.close(fig)
            
            logger.info(f"[COMPOSITOR] ✓ Chart oluşturuldu: {chart_path}")
            
            return str(chart_path)
            
        except Exception as e:
            logger.error(f"[COMPOSITOR] Chart hatası: {e}")
            return None
    
    def compose_video(
        self,
        audio_path: str,
        title: str,
        sentiment: str,
        sentiment_score: int,
        language_code: str,
        article_id: str,
        chart_path: Optional[str] = None
    ) -> Optional[str]:
        """Video kompozisyonu oluştur
        
        Args:
            audio_path: Ses dosyası yolu
            title: Video başlığı
            sentiment: BULLISH/BEARISH/NEUTRAL
            sentiment_score: 0-100 arası skor
            language_code: Dil kodu (en, tr, vb.)
            article_id: Haber ID'si
            chart_path: Finansal chart yolu (opsiyonel)
        
        Returns:
            Video dosya yolu veya None
        """
        
        output_filename = f"{article_id}_{language_code}.mp4"
        output_path = self.output_dir / output_filename
        
        try:
            logger.info(f"[COMPOSITOR] Video kompozisyonu başladı: {output_filename}")
            
            # Audio yükle
            audio = AudioFileClip(audio_path)
            duration = audio.duration
            
            # Background image
            background = ImageClip(str(self.background_path)).set_duration(duration)
            
            # Title overlay (üst kısım)
            title_clip = TextClip(
                title[:80],  # Max 80 karakter
                fontsize=48,
                color='white',
                font='Arial-Bold',
                size=(1820, None),  # Width constraint
                method='caption'
            ).set_position((50, 50)).set_duration(duration)
            
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
            ).set_position((50, 150)).set_duration(duration)
            
            # Kompozisyon başlat
            clips = [background, title_clip, sentiment_clip]
            
            # Logo watermark (sağ üst köşe - SIAIntel branding)
            if self.logo_path:
                try:
                    logo_clip = ImageClip(str(self.logo_path)).set_duration(duration)
                    # Logo boyutunu ayarla (max 150x150)
                    logo_clip = logo_clip.resize(height=80)
                    # Sağ üst köşe (20px padding)
                    logo_clip = logo_clip.set_position((1920 - logo_clip.w - 20, 20))
                    # Opacity %80
                    logo_clip = logo_clip.set_opacity(0.8)
                    clips.append(logo_clip)
                    logger.info("[COMPOSITOR] ✓ Logo watermark eklendi")
                except Exception as e:
                    logger.warning(f"[COMPOSITOR] Logo eklenemedi: {e}")
            
            # Chart overlay (eğer varsa)
            if chart_path and Path(chart_path).exists():
                chart_clip = ImageClip(chart_path).set_duration(duration)
                chart_clip = chart_clip.set_position((1920 - 420, 1080 - 320))  # Sağ alt köşe
                clips.append(chart_clip)
            
            # Final composition
            video = CompositeVideoClip(clips, size=(1920, 1080))
            video = video.set_audio(audio)
            
            # Render
            logger.info(f"[COMPOSITOR] Rendering başladı: {output_filename}")
            
            video.write_videofile(
                str(output_path),
                fps=30,
                codec='libx264',
                audio_codec='aac',
                audio_bitrate='192k',
                preset='medium',
                threads=4,
                logger=None  # MoviePy logging'i kapat
            )
            
            # Cleanup
            video.close()
            audio.close()
            
            # Dosya boyutu
            file_size_mb = output_path.stat().st_size / (1024 * 1024)
            
            logger.info(f"[COMPOSITOR] ✓ Video oluşturuldu: {output_filename} ({file_size_mb:.2f} MB, {duration:.1f}s)")
            
            return str(output_path)
            
        except Exception as e:
            logger.error(f"[COMPOSITOR] Video kompozisyon hatası: {e}")
            return None
    
    def process_intelligence_to_video(
        self,
        intelligence_data: Dict,
        audio_paths: Dict[str, str],
        article_id: str,
        original_title: str,
        original_content: str
    ) -> Dict[str, str]:
        """Intelligence package'ı videoya dönüştür
        
        Args:
            intelligence_data: Brain'den gelen intelligence package
            audio_paths: Voice'dan gelen audio paths (language_code -> path)
            article_id: Haber ID'si
            original_title: Orijinal haber başlığı
            original_content: Orijinal haber içeriği
        
        Returns:
            Dict[language_code, video_path]
        """
        
        video_paths = {}
        
        # Sembol tespit et
        symbol = self.detect_symbol(original_title, original_content)
        chart_path = None
        
        if symbol:
            chart_filename = f"{article_id}_chart.png"
            chart_path = self.generate_chart(symbol, chart_filename)
        
        # Her dil için video oluştur
        for lang_data in intelligence_data.get('languages', []):
            language_code = lang_data.get('language_code')
            
            if language_code not in audio_paths:
                logger.warning(f"[COMPOSITOR] {language_code} için audio bulunamadı, atlanıyor")
                continue
            
            audio_path = audio_paths[language_code]
            title = lang_data.get('title', 'Untitled')
            sentiment = lang_data.get('sentiment', 'NEUTRAL')
            sentiment_score = lang_data.get('sentiment_score', 50)
            
            video_path = self.compose_video(
                audio_path=audio_path,
                title=title,
                sentiment=sentiment,
                sentiment_score=sentiment_score,
                language_code=language_code,
                article_id=article_id,
                chart_path=chart_path
            )
            
            if video_path:
                video_paths[language_code] = video_path
        
        logger.info(f"[COMPOSITOR] {len(video_paths)}/6 dil için video oluşturuldu")
        
        # Chart dosyasını temizle
        if chart_path and Path(chart_path).exists():
            Path(chart_path).unlink()
            logger.info("[COMPOSITOR] Geçici chart dosyası temizlendi")
        
        return video_paths
