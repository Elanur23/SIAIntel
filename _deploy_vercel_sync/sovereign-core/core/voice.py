"""
SOVEREIGN V14 - Voice Module
Neural Voice Synthesis using edge-tts (6 Languages)
"""

import os
import logging
import asyncio
from typing import Dict, Optional
from pathlib import Path

import edge_tts
from pydantic import BaseModel

logger = logging.getLogger(__name__)


class VoiceConfig(BaseModel):
    """Dil bazlı ses yapılandırması"""
    language_code: str
    voice_name: str
    language: str
    flag: str


# 6 Dil için Neural Voice Yapılandırması
VOICE_CONFIGS = {
    'en': VoiceConfig(
        language_code='en',
        voice_name='en-US-GuyNeural',
        language='English',
        flag='🇺🇸'
    ),
    'tr': VoiceConfig(
        language_code='tr',
        voice_name='tr-TR-AhmetNeural',
        language='Türkçe',
        flag='🇹🇷'
    ),
    'de': VoiceConfig(
        language_code='de',
        voice_name='de-DE-ConradNeural',
        language='Deutsch',
        flag='🇩🇪'
    ),
    'es': VoiceConfig(
        language_code='es',
        voice_name='es-ES-AlvaroNeural',
        language='Español',
        flag='🇪🇸'
    ),
    'fr': VoiceConfig(
        language_code='fr',
        voice_name='fr-FR-HenriNeural',
        language='Français',
        flag='🇫🇷'
    ),
    'ar': VoiceConfig(
        language_code='ar',
        voice_name='ar-SA-HamedNeural',
        language='العربية',
        flag='🇦🇪'
    )
}


class Voice:
    """Neural Voice Synthesis Engine"""
    
    def __init__(self, output_dir: str = 'output/audio'):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info(f"[VOICE] Neural voice engine başlatıldı: {self.output_dir}")
    
    async def synthesize_async(
        self, 
        text: str, 
        language_code: str, 
        output_filename: str
    ) -> Optional[str]:
        """Async ses sentezi (edge-tts kullanır)"""
        
        if language_code not in VOICE_CONFIGS:
            logger.error(f"[VOICE] Desteklenmeyen dil: {language_code}")
            return None
        
        config = VOICE_CONFIGS[language_code]
        output_path = self.output_dir / output_filename
        
        try:
            logger.info(f"[VOICE] {config.flag} {config.language} sentezi başladı...")
            
            # edge-tts ile ses üret
            communicate = edge_tts.Communicate(text, config.voice_name)
            await communicate.save(str(output_path))
            
            # Dosya boyutunu kontrol et
            file_size_mb = output_path.stat().st_size / (1024 * 1024)
            
            logger.info(f"[VOICE] ✓ {config.flag} {config.language}: {output_filename} ({file_size_mb:.2f} MB)")
            
            return str(output_path)
            
        except Exception as e:
            logger.error(f"[VOICE] ✗ {config.flag} {config.language} hatası: {e}")
            return None
    
    def synthesize(
        self, 
        text: str, 
        language_code: str, 
        output_filename: str
    ) -> Optional[str]:
        """Sync wrapper for async synthesis"""
        return asyncio.run(self.synthesize_async(text, language_code, output_filename))
    
    def synthesize_all_languages(
        self, 
        intelligence_data: Dict, 
        article_id: str
    ) -> Dict[str, str]:
        """Tüm diller için ses sentezi yap
        
        Args:
            intelligence_data: Brain'den gelen intelligence package
            article_id: Haber ID'si (dosya adı için)
        
        Returns:
            Dict[language_code, audio_path]
        """
        audio_paths = {}
        
        for lang_data in intelligence_data.get('languages', []):
            language_code = lang_data.get('language_code')
            script = lang_data.get('full_content', '')
            
            if not script:
                logger.warning(f"[VOICE] {language_code} için script bulunamadı, atlanıyor")
                continue
            
            output_filename = f"{article_id}_{language_code}.mp3"
            audio_path = self.synthesize(script, language_code, output_filename)
            
            if audio_path:
                audio_paths[language_code] = audio_path
        
        logger.info(f"[VOICE] {len(audio_paths)}/6 dil için ses üretildi")
        
        return audio_paths
