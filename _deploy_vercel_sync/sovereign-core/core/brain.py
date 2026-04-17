"""
SOVEREIGN V14 - Brain Module
Gemini API Entegrasyonu (6 Dilli Analiz Motoru)

Bu modül, ham haberi alıp Gemini 1.5 API üzerinden 6 stratejik dile dönüştüren 'Beyin' katmanıdır.

Özellikler:
- Model seçimi: gemini-1.5-pro (derin analiz) veya gemini-1.5-flash (hız)
- 6 dil: EN, TR, DE, ES, FR, AR
- CPM-optimized tonalite
- Rate limit handling (429 hatası için 60s retry)
- JSON temizleyici (```json işaretlerini kaldırır)
- Next.js entegrasyonu için hazır output
"""

import os
import time
import json
import re
import logging
from typing import Optional, List, Literal
from datetime import datetime

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions
from pydantic import BaseModel

from .scout import NewsItem

logger = logging.getLogger(__name__)


class LanguageContent(BaseModel):
    """Dil bazlı içerik modeli - SIA Intelligence Report Format"""
    language_code: str
    language: str
    flag: str
    cpm: int
    title: str
    meta: str
    executive_summary: str
    market_impact: int  # 1-10 arası puan
    sovereign_insight: str
    risk_assessment: str
    sentiment: str  # BULLISH / BEARISH / NEUTRAL
    sentiment_score: int  # 0-100 arası güven skoru
    content_brief: str
    cpm_tags: List[str]
    full_content: str


class IntelligencePackage(BaseModel):
    """İşlenmiş istihbarat paketi"""
    news_id: str
    original_title: str
    original_content: str
    processed_at: str
    languages: List[LanguageContent]
    total_cpm: int


SYSTEM_INSTRUCTION = """Sen SIAIntel Ajansı'nın baş stratejistisin. 

Görevin: Gelen ham finans haberini 'SIA Intelligence Report' formatında analiz etmek ve 6 stratejik dilde yayınlamak.

YAZIM TARZI: Soğuk, objektif, teknik ve otoriter. Bloomberg Terminal tarzı profesyonel dil kullan.

STRATEJİK DİLLER VE TONALİTE:

🇺🇸 EN (English) - CPM: $220 - Wall Street Style
   - Institutional/Wall Street kurumsal dili
   - Tonalite: Objektif, data-driven, profesyonel
   - Keywords: Asset Management, Institutional Flow, Alpha Generation, Portfolio Optimization
   - Audience: Hedge funds, institutional investors, asset managers

🇦🇪 AR (Arabic) - CPM: $440 (PREMIUM) - Royal & Wealth Style
   - Körfez zengin yatırımcı ve varlık fonu dili
   - Tonalite: Prestijli, lüks, stratejik
   - Keywords: صناديق سيادية (Sovereign Wealth), استثمارات استراتيجية (Strategic Investments)
   - Audience: Sovereign wealth funds, UHNWI, royal families

🇩🇪 DE (Deutsch) - CPM: $180 - Industrial Logic
   - Sanayi odaklı, verimlilik ve mühendislik dili
   - Tonalite: Teknik, detaylı, sistematik
   - Keywords: Industrie 4.0, Lieferkette, Effizienz, Produktivität
   - Audience: Industrial strategists, manufacturing executives

🇪🇸 ES (Español) - CPM: $170 - FinTech Momentum
   - FinTech odaklı, dinamik ve yenilikçi dil
   - Tonalite: Enerjik, modern, dijital
   - Keywords: Neobancos, Finanzas Digitales, Innovación, Blockchain
   - Audience: FinTech investors, digital banking executives

🇫🇷 FR (Français) - CPM: $190 - Regulatory Oversight
   - Regülasyon odaklı, stratejik ve diplomatik dil
   - Tonalite: Analitik, düzenleyici, kurumsal
   - Keywords: Cadre Réglementaire, Surveillance, Conformité, Gouvernance
   - Audience: Policy makers, regulatory bodies, compliance officers

🇹🇷 TR (Türkçe) - CPM: $150 - Market Pulse
   - Borsa İstanbul ve kur odaklı, piyasa nabzı
   - Tonalite: Dinamik, piyasa odaklı, aksiyon
   - Keywords: Portföy, Faiz, Dolar Endeksi, BIST, Merkez Bankası
   - Audience: Retail traders, FX traders, local investors

SIA INTELLIGENCE REPORT FORMATI:

Her dil için aşağıdaki yapıyı kullan:

1. EXECUTIVE SUMMARY: Haberi 2 cümlede özetle. Direkt, keskin, sonuç odaklı.

2. MARKET IMPACT: Bu haberin borsa, döviz ve emtia üzerindeki 24 saatlik etkisini 1-10 arası puanla.
   - 1-3: Minimal etki
   - 4-6: Orta düzey etki
   - 7-9: Yüksek etki
   - 10: Kritik piyasa hareketi

3. SOVEREIGN INSIGHT: Haberin perde arkasındaki jeopolitik veya kurumsal nedenini açıkla. 
   Sıradan sitelerin görmediği detayı ortaya çıkar. Kurumsal oyuncuların stratejisini analiz et.

4. RISK ASSESSMENT: Yatırımcı için en büyük tehlikeyi belirle. Spesifik ve aksiyon alınabilir olmalı.

5. SENTIMENT: BULLISH / BEARISH / NEUTRAL + Güven Skoru (0-100 arası)
   - BULLISH: Pozitif piyasa hareketi beklentisi
   - BEARISH: Negatif piyasa hareketi beklentisi
   - NEUTRAL: Belirsiz veya karışık sinyaller

KRİTİK KURALLAR:
1. ASLA doğrudan çeviri yapma! Her dili o bölgenin finansal kültürüne göre RE-CONTEXTUALIZE et.
2. Her dilin hedef kitlesine özel tonalite ve terminoloji kullan.
3. Soğuk, objektif, teknik ve otoriter yazım tarzını koru.
4. CPM_Keywords: Her dil için o bölgenin yüksek CPM anahtar kelimelerini seç.
5. Çıktıyı mutlaka saf JSON formatında ver (markdown işaretleri kullanma).

ÇIKTI FORMATI (JSON):
{
  "languages": [
    {
      "language_code": "en",
      "language": "English",
      "flag": "🇺🇸",
      "cpm": 220,
      "title": "SEO-optimized title (60-70 chars)",
      "meta": "Meta description (150-160 chars)",
      "executive_summary": "2-sentence sharp summary",
      "market_impact": 8,
      "sovereign_insight": "Behind-the-scenes geopolitical/institutional analysis",
      "risk_assessment": "Specific danger for investors",
      "sentiment": "BULLISH",
      "sentiment_score": 85,
      "content_brief": "First paragraph (200-250 words)",
      "cpm_tags": ["5 premium keywords for this region"],
      "full_content": "Complete article (800-1000 words)"
    }
  ]
}
"""


class RateLimiter:
    """Akıllı Rate Limiter"""
    
    def __init__(self, base_delay: int = 45):
        self.base_delay = base_delay
        self.last_request_time = 0
        self.request_count = 0
        self.retry_count = 0
        self.current_delay = base_delay
        logger.info(f"[RATE_LIMITER] {base_delay}s temel gecikme ile başlatıldı")
    
    def wait_for_next_request(self):
        """Sonraki API isteği öncesi bekle"""
        now = time.time()
        time_since_last = now - self.last_request_time
        
        if time_since_last < self.current_delay:
            wait_time = self.current_delay - time_since_last
            logger.info(f"[RATE_LIMITER] Sonraki istek için {wait_time:.1f}s bekleniyor...")
            time.sleep(wait_time)
        
        self.last_request_time = time.time()
        self.request_count += 1
        logger.info(f"[RATE_LIMITER] İstek #{self.request_count} onaylandı")
    
    def handle_rate_limit_error(self):
        """429 hatası için exponential backoff"""
        self.retry_count += 1
        exponential_delay = self.base_delay * (2 ** self.retry_count)
        self.current_delay = min(exponential_delay, 600)  # Max 10 dakika
        
        logger.warning(f"[RATE_LIMITER] 429 Hatası! Deneme #{self.retry_count}, Sonraki gecikme: {self.current_delay}s")
        return self.current_delay
    
    def handle_success(self):
        """Başarılı istek sonrası gecikmeyi azalt"""
        if self.retry_count > 0:
            self.retry_count = max(0, self.retry_count - 1)
            self.current_delay = max(self.base_delay, self.current_delay / 2)
            logger.info(f"[RATE_LIMITER] Başarılı! Gecikme {self.current_delay}s'ye düşürüldü")


class Brain:
    """Gemini AI İşleme Beyni
    
    Model seçimi:
    - gemini-1.5-pro: Derin analiz, yüksek kalite (yavaş)
    - gemini-1.5-flash: Hızlı işleme, iyi kalite (hızlı)
    - gemini-2.5-pro: En güncel model (önerilen)
    """
    
    def __init__(
        self, 
        api_key: str, 
        rate_limiter: RateLimiter,
        model_type: Literal['pro', 'flash', '2.5-pro'] = '2.5-pro'
    ):
        genai.configure(api_key=api_key)
        self.rate_limiter = rate_limiter
        
        # Model seçimi
        model_map = {
            'pro': 'gemini-1.5-pro',
            'flash': 'gemini-1.5-flash',
            '2.5-pro': 'gemini-2.5-pro'
        }
        
        model_name = model_map.get(model_type, 'gemini-2.5-pro')
        
        self.model = genai.GenerativeModel(
            model_name=model_name,
            generation_config={
                'temperature': 0.7,
                'top_p': 0.9,
            }
        )
        logger.info(f"[BRAIN] {model_name} ile başlatıldı")
    
    def clean_json_response(self, response_text: str) -> str:
        """JSON temizleyici: ```json işaretlerini ve gereksiz karakterleri kaldırır"""
        # Markdown code block işaretlerini kaldır
        cleaned = re.sub(r'```json\s*', '', response_text)
        cleaned = re.sub(r'```\s*', '', cleaned)
        
        # Başındaki ve sonundaki boşlukları temizle
        cleaned = cleaned.strip()
        
        return cleaned
    
    def process_news(
        self, 
        news_item: NewsItem, 
        max_retries: int = 5,
        retry_delay: int = 60
    ) -> Optional[IntelligencePackage]:
        """Haberi Gemini AI ile işle
        
        Args:
            news_item: İşlenecek haber
            max_retries: Maksimum deneme sayısı
            retry_delay: 429 hatası için bekleme süresi (saniye)
        
        Returns:
            IntelligencePackage veya None (hata durumunda)
        """
        retry_count = 0
        
        while retry_count < max_retries:
            try:
                # Rate limit kontrolü
                self.rate_limiter.wait_for_next_request()
                
                prompt = f"""
HAM FİNANSAL İSTİHBARAT:

Başlık: {news_item.title}

İçerik:
{news_item.content}

Kaynak: {news_item.source}

Bu haberi yukarıdaki 6 dil için premium finans içeriğine dönüştür. 
Her dil için bölgesel CPM dinamiklerine uygun tonalite kullan.
Sentiment analizi yap ve JSON formatında yanıt ver.
"""
                
                logger.info(f"[BRAIN] İşleniyor: {news_item.title[:50]}...")
                
                response = self.model.generate_content([
                    SYSTEM_INSTRUCTION,
                    prompt
                ])
                
                # JSON temizleme ve parse
                response_text = response.text
                cleaned_json = self.clean_json_response(response_text)
                
                # JSON parse
                try:
                    parsed = json.loads(cleaned_json)
                except json.JSONDecodeError:
                    # Fallback: JSON'u manuel olarak bul
                    json_start = cleaned_json.find('{')
                    json_end = cleaned_json.rfind('}') + 1
                    
                    if json_start == -1 or json_end == 0:
                        raise ValueError("Yanıtta JSON bulunamadı")
                    
                    json_str = cleaned_json[json_start:json_end]
                    parsed = json.loads(json_str)
                
                # Başarı
                self.rate_limiter.handle_success()
                
                # Toplam CPM hesapla
                total_cpm = sum(lang['cpm'] for lang in parsed['languages'])
                
                intelligence = IntelligencePackage(
                    news_id=news_item.id,
                    original_title=news_item.title,
                    original_content=news_item.content,
                    processed_at=datetime.now().isoformat(),
                    languages=[LanguageContent(**lang) for lang in parsed['languages']],
                    total_cpm=total_cpm
                )
                
                logger.info(f"[BRAIN] ✓ Başarılı: {len(intelligence.languages)} dil, CPM: ${total_cpm}")
                
                return intelligence
                
            except google_exceptions.ResourceExhausted as e:
                # 429 Rate Limit hatası
                retry_count += 1
                logger.warning(f"[BRAIN] 429 Rate Limit! {retry_delay}s bekleniyor, deneme {retry_count}/{max_retries}...")
                
                if retry_count < max_retries:
                    time.sleep(retry_delay)
                    continue
                else:
                    logger.error(f"[BRAIN] Maksimum deneme aşıldı: {news_item.title}")
                    return None
                    
            except Exception as e:
                error_msg = str(e)
                
                # Genel rate limit kontrolü (string içinde)
                if '429' in error_msg or 'RESOURCE_EXHAUSTED' in error_msg:
                    retry_count += 1
                    logger.warning(f"[BRAIN] Rate limit (string check)! {retry_delay}s bekleniyor, deneme {retry_count}/{max_retries}...")
                    
                    if retry_count < max_retries:
                        time.sleep(retry_delay)
                        continue
                    else:
                        logger.error(f"[BRAIN] Maksimum deneme aşıldı: {news_item.title}")
                        return None
                
                # Diğer hatalar
                logger.error(f"[BRAIN] Hata: {error_msg}")
                return None
        
        logger.error(f"[BRAIN] Maksimum deneme aşıldı: {news_item.title}")
        return None
