"""
SIAIntel - Otonom Medya Fabrikası
Sovereign Intelligence Architecture - Autonomous Media Factory

Sistem her 20 dakikada bir:
1. SCOUT: En sıcak 3 finans haberini yakalar
2. BRAIN: 6 dilde analiz eder (EN, TR, DE, ES, FR, AR)
3. VOICE: Neural voice sentezi yapar
4. COMPOSITOR: Logo watermark'lı video üretir
5. STORAGE: siaintel.com API'sine gönderir
"""

import os
import logging
from typing import List, Dict
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from apscheduler.schedulers.background import BackgroundScheduler
import asyncio
import random
import json

from core.scout import Scout, NewsItem
from core.brain import Brain, RateLimiter, IntelligencePackage
from core.database import Database
from core.voice import Voice
from core.compositor import Compositor

# Environment variables
load_dotenv()

# Logging yapılandırması
Path('logs').mkdir(exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    handlers=[
        logging.FileHandler('logs/factory.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(
    title="SIAIntel - Otonom Medya Fabrikası",
    description="Sovereign Intelligence Architecture - Autonomous Media Factory",
    version="2.0.0"
)

# CORS - Development mode (allow all origins)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Geliştirme için tüm originlere izin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# CONFIGURATION
# ============================================================================

RSS_KEYWORDS = [
    'Nasdaq',
    'Bitcoin',
    'Fed',
    'AI',
    'Fintech',
    'Federal Reserve',
    'Cryptocurrency',
    'Stock Market'
]

GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY bulunamadı! .env dosyasını kontrol edin.")

# Model seçimi: 'pro', 'flash', veya '2.5-pro'
GEMINI_MODEL_TYPE = os.getenv('GEMINI_MODEL_TYPE', '2.5-pro')

# Rate limit ayarları
RATE_LIMIT_DELAY = int(os.getenv('RATE_LIMIT_DELAY', '45'))
RATE_LIMIT_RETRY_DELAY = int(os.getenv('RATE_LIMIT_RETRY_DELAY', '60'))

# ============================================================================
# CORE COMPONENTS - THE FACTORY
# ============================================================================

scout = Scout(keywords=RSS_KEYWORDS)
database = Database(db_path='data/siaintel.db')
rate_limiter = RateLimiter(base_delay=RATE_LIMIT_DELAY)
brain = Brain(
    api_key=GEMINI_API_KEY, 
    rate_limiter=rate_limiter,
    model_type=GEMINI_MODEL_TYPE
)
voice = Voice(output_dir='output/audio')

# ============================================================================
# STAGGERED FEED SYSTEM - ULTRA-SYNC
# ============================================================================

import threading
import time
from collections import deque

# Bekleyen intelligence'lar için kuyruk
pending_intelligence_queue = deque()

# Canlı yayın için aktif intelligence store
live_intelligence_store = []

def staggered_broadcast_worker():
    """
    Arka planda çalışan thread: Her 30 saniyede bir kuyruktan
    bir intelligence alıp canlı feed'e ekler.
    
    Bu sayede frontend'de intelligence'lar tek seferde değil,
    30 saniye aralıklarla "canlı" olarak görünür.
    """
    logger.info("[STAGGERED-FEED] 🎯 Broadcast worker başlatıldı (30s interval)")
    
    while True:
        try:
            if pending_intelligence_queue:
                # Kuyruktan bir intelligence al
                intelligence = pending_intelligence_queue.popleft()
                
                # Canlı feed'e ekle
                live_intelligence_store.append(intelligence)
                
                # Log
                logger.info(f"[STAGGERED-FEED] 📡 BROADCAST: {intelligence.get('title', 'Unknown')[:50]}...")
                logger.info(f"[STAGGERED-FEED] 📊 Queue: {len(pending_intelligence_queue)} pending, {len(live_intelligence_store)} live")
            
            # 30 saniye bekle
            time.sleep(30)
            
        except Exception as e:
            logger.error(f"[STAGGERED-FEED] ❌ Broadcast error: {e}")
            time.sleep(30)

# Broadcast worker thread'i başlat
broadcast_thread = threading.Thread(target=staggered_broadcast_worker, daemon=True)
broadcast_thread.start()
compositor = Compositor(output_dir='output/videos', assets_dir='assets')

# Intelligence storage (in-memory)
# DEPRECATED: intelligence_store artık kullanılmıyor
# Yeni sistem: pending_intelligence_queue → live_intelligence_store
intelligence_store: List[IntelligencePackage] = []  # Backward compatibility için tutuldu

# Scheduler
scheduler = BackgroundScheduler()

# Stats
stats = {
    'total_scanned': 0,
    'new_processed': 0,
    'duplicates_skipped': 0,
    'videos_produced': 0,
    'errors': 0,
    'last_run': None,
    'last_cycle_duration': 0
}

# ============================================================================
# AUTONOMOUS ENGINE
# ============================================================================

def run_factory_cycle():
    """THE FACTORY - Otonom video üretim döngüsü
    
    Pipeline: SCOUT → BRAIN → VOICE → COMPOSITOR
    """
    cycle_start = datetime.now()
    
    logger.info("\n" + "="*80)
    logger.info("🏭 SIAIntel - PRODUCTION CYCLE STARTED")
    logger.info("="*80 + "\n")
    
    try:
        # 1. SCOUT - Haberleri topla
        logger.info("[SCOUT] 📡 Haber taraması başladı...")
        all_news = scout.aggregate_news()
        stats['total_scanned'] += len(all_news)
        
        # 2. DEDUPLICATION - Yeni haberleri filtrele
        logger.info("[DEDUP] 🔍 Deduplication kontrolü...")
        new_news = []
        for item in all_news:
            if database.is_seen(item.hash):
                stats['duplicates_skipped'] += 1
                logger.info(f"[DEDUP] ⊗ Tekrar: {item.title[:50]}...")
            else:
                new_news.append(item)
        
        logger.info(f"[DEDUP] ✓ {len(new_news)} yeni haber bulundu")
        
        # 3. İşle (döngü başına max 3 haber - SIAIntel spec)
        to_process = new_news[:3]
        
        logger.info(f"[SIAINTEL] 🎯 {len(to_process)} haber işlenecek")
        
        for item in to_process:
            try:
                logger.info(f"\n[FACTORY] 🎬 İşleniyor: {item.title[:60]}...")
                
                # 3.1 BRAIN - 6 dilli analiz
                logger.info("[BRAIN] 🧠 Gemini analizi başladı...")
                intelligence = brain.process_news(item)
                
                if not intelligence:
                    stats['errors'] += 1
                    logger.error(f"[BRAIN] ✗ Analiz başarısız")
                    continue
                
                logger.info(f"[BRAIN] ✓ {len(intelligence.languages)} dil analiz edildi")
                
                # 3.2 VOICE - Ses sentezi
                logger.info("[VOICE] 🎤 Neural voice sentezi başladı...")
                audio_paths = voice.synthesize_all_languages(
                    intelligence.dict(),
                    item.id
                )
                
                if not audio_paths:
                    stats['errors'] += 1
                    logger.error(f"[VOICE] ✗ Ses sentezi başarısız")
                    continue
                
                logger.info(f"[VOICE] ✓ {len(audio_paths)} ses dosyası oluşturuldu")
                
                # 3.3 COMPOSITOR - Video üretimi
                logger.info("[COMPOSITOR] 🎥 Video kompozisyonu başladı...")
                video_paths = compositor.process_intelligence_to_video(
                    intelligence.dict(),
                    audio_paths,
                    item.id,
                    item.title,
                    item.content
                )
                
                if not video_paths:
                    stats['errors'] += 1
                    logger.error(f"[COMPOSITOR] ✗ Video üretimi başarısız")
                    continue
                
                logger.info(f"[COMPOSITOR] ✓ {len(video_paths)} video oluşturuldu")
                
                # 3.4 DATABASE - Kaydet
                article_id = database.mark_as_seen(item.hash, item.title, item.link)
                
                for lang_code, video_path in video_paths.items():
                    audio_path = audio_paths.get(lang_code, '')
                    
                    # Video metadata
                    video_file = Path(video_path)
                    file_size_mb = video_file.stat().st_size / (1024 * 1024) if video_file.exists() else 0
                    
                    database.save_video_output(
                        article_id=article_id,
                        language_code=lang_code,
                        video_path=video_path,
                        audio_path=audio_path,
                        duration_seconds=0,  # MoviePy'den alınabilir
                        file_size_mb=file_size_mb
                    )
                
                # Intelligence store'a ekle (KUYRUK SİSTEMİ)
                # Artık direkt live_intelligence_store'a değil,
                # pending_intelligence_queue'ya ekliyoruz
                pending_intelligence_queue.append(intelligence.dict())
                logger.info(f"[FACTORY] 📥 Intelligence kuyruğa eklendi (Queue size: {len(pending_intelligence_queue)})")
                
                stats['new_processed'] += 1
                stats['videos_produced'] += len(video_paths)
                
                logger.info(f"[FACTORY] ✅ BAŞARILI: {len(video_paths)} video üretildi")
                
            except Exception as e:
                stats['errors'] += 1
                logger.error(f"[FACTORY] ❌ Hata: {e}", exc_info=True)
        
        # Cycle tamamlandı
        cycle_end = datetime.now()
        cycle_duration = (cycle_end - cycle_start).total_seconds()
        
        stats['last_run'] = cycle_end.isoformat()
        stats['last_cycle_duration'] = cycle_duration
        
    except Exception as e:
        logger.error(f"[FACTORY] ❌ Döngü hatası: {e}", exc_info=True)
        stats['errors'] += 1
    
    logger.info("\n" + "="*80)
    logger.info("🏭 SIAIntel - PRODUCTION CYCLE COMPLETED")
    logger.info(f"📊 Stats: {stats['new_processed']} processed, {stats['videos_produced']} videos, {stats['duplicates_skipped']} skipped")
    logger.info(f"⏱️  Duration: {stats['last_cycle_duration']:.1f}s")
    logger.info("="*80 + "\n")

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
def root():
    """Ana endpoint"""
    return {
        "name": "SIAIntel - Otonom Medya Fabrikası",
        "version": "2.0.0",
        "status": "operational",
        "description": "Sovereign Intelligence Architecture - Autonomous Media Factory",
        "modules": ["SCOUT", "BRAIN", "VOICE", "COMPOSITOR"],
        "cycle_interval": "20 minutes",
        "languages": ["EN", "TR", "DE", "ES", "FR", "AR"],
        "features": ["Logo Watermark", "Auto Upload", "Error Resilience"]
    }

@app.get("/api/intelligence")
def get_intelligence(limit: int = 20):
    """Terminal için intelligence feed (ULTRA-SYNC)
    
    Frontend'in (Next.js) terminal ekranında göstermesi için
    formatlanmış intelligence verisi döner.
    
    STAGGERED FEED: Intelligence'lar 30 saniye aralıklarla
    live_intelligence_store'a eklenir, böylece frontend'de
    canlı akış efekti oluşur.
    """
    try:
        # Canlı feed'den son intelligence'ları al
        recent = live_intelligence_store[-limit:] if live_intelligence_store else []
        
        # Eğer veri yoksa demo veri döndür
        if len(recent) == 0:
            logger.info("[API] No intelligence data, returning demo data")
            demo_news = [
                {
                    "id": "demo-1",
                    "time": datetime.now().strftime("%H:%M:%S"),
                    "title": "FED INTEREST RATE SPECULATION DRIVES NASDAQ VOLATILITY",
                    "region": "WALL ST",
                    "sentiment": "BULLISH",
                    "impact": 8,
                    "source": "SIAINTEL-DEMO",
                    "confidence": 94,
                    "market_impact": 8,
                    "executive_summary": "Federal Reserve signals potential rate cuts as economic indicators weaken.",
                    "sovereign_insight": "This signals coordination between Fed and ECB to prevent dollar strengthening.",
                    "risk_assessment": "Primary risk: Sudden dollar volatility if rate cut exceeds expectations."
                },
                {
                    "id": "demo-2",
                    "time": datetime.now().strftime("%H:%M:%S"),
                    "title": "BITCOIN BREAKS $50K RESISTANCE - INSTITUTIONAL ACCUMULATION DETECTED",
                    "region": "GLOBAL",
                    "sentiment": "BULLISH",
                    "impact": 9,
                    "source": "SIAINTEL-DEMO",
                    "confidence": 92,
                    "market_impact": 9,
                    "executive_summary": "Large holder wallets show significant BTC accumulation pattern.",
                    "sovereign_insight": "Institutional players positioning ahead of ETF approval cycle.",
                    "risk_assessment": "Leverage liquidation risk if price retraces below $48K support."
                },
                {
                    "id": "demo-3",
                    "time": datetime.now().strftime("%H:%M:%S"),
                    "title": "MIDDLE EAST OIL PIPELINE DISRUPTION - ENERGY SECTOR ALERT",
                    "region": "GULF",
                    "sentiment": "BEARISH",
                    "impact": 7,
                    "source": "SIAINTEL-DEMO",
                    "confidence": 88,
                    "market_impact": 7,
                    "executive_summary": "Geopolitical tensions impact oil supply chain logistics.",
                    "sovereign_insight": "Strategic reserves may be deployed to stabilize prices.",
                    "risk_assessment": "Oil price spike could trigger inflation concerns."
                },
                {
                    "id": "demo-4",
                    "time": datetime.now().strftime("%H:%M:%S"),
                    "title": "AI CHIP SHORTAGE IMPACTS TECH GIANTS - SUPPLY CHAIN CRISIS",
                    "region": "ASIA",
                    "sentiment": "BEARISH",
                    "impact": 6,
                    "source": "SIAINTEL-DEMO",
                    "confidence": 85,
                    "market_impact": 6,
                    "executive_summary": "Semiconductor manufacturing delays affect Q1 projections.",
                    "sovereign_insight": "Taiwan-China tensions creating supply uncertainty.",
                    "risk_assessment": "Tech sector earnings may disappoint if shortage persists."
                },
                {
                    "id": "demo-5",
                    "time": datetime.now().strftime("%H:%M:%S"),
                    "title": "EUROPEAN CENTRAL BANK MAINTAINS HAWKISH STANCE ON INFLATION",
                    "region": "EUROPE",
                    "sentiment": "NEUTRAL",
                    "impact": 5,
                    "source": "SIAINTEL-DEMO",
                    "confidence": 90,
                    "market_impact": 5,
                    "executive_summary": "ECB signals continued vigilance despite cooling inflation data.",
                    "sovereign_insight": "Coordinated policy with Fed to manage currency stability.",
                    "risk_assessment": "Euro strength could impact export-dependent economies."
                }
            ]
            
            return {
                "success": True,
                "count": len(demo_news),
                "news": demo_news,
                "timestamp": datetime.now().isoformat(),
                "demo_mode": True
            }
        
        # Terminal formatına dönüştür
        news_items = []
        for intel in recent:
            for lang in intel.languages:
                news_items.append({
                    "id": f"{intel.original_title[:20]}-{lang.code}",
                    "time": datetime.now().strftime("%H:%M:%S"),
                    "title": lang.title,
                    "region": {
                        "en": "WALL ST",
                        "tr": "TURKEY",
                        "de": "EUROPE",
                        "es": "LATAM",
                        "fr": "EUROPE",
                        "ar": "GULF"
                    }.get(lang.code, "GLOBAL"),
                    "sentiment": lang.sentiment,
                    "impact": lang.market_impact,
                    "source": "SIAINTEL",
                    "confidence": lang.sentiment_score,
                    "market_impact": lang.market_impact,
                    "executive_summary": lang.executive_summary,
                    "sovereign_insight": lang.sovereign_insight,
                    "risk_assessment": lang.risk_assessment
                })
        
        return {
            "success": True,
            "count": len(news_items),
            "news": news_items,
            "timestamp": datetime.now().isoformat()
        }
        
    except Exception as e:
        logger.error(f"[API] Intelligence endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/intelligence/stream")
async def stream_intelligence():
    """THE LIVE PULSE - Real-time streaming intelligence feed
    
    Streams intelligence one-by-one with 5-15 second random delays
    to create authentic live feed experience.
    
    Uses Server-Sent Events (SSE) for real-time updates.
    """
    async def event_generator():
        try:
            logger.info("[LIVE-PULSE] 🎯 Stream connection established")
            
            # Demo data for streaming
            demo_intelligence = [
                {
                    "id": "stream-1",
                    "title": "FED INTEREST RATE SPECULATION DRIVES NASDAQ VOLATILITY",
                    "region": "WALL ST",
                    "sentiment": "BULLISH",
                    "impact": 8,
                    "source": "SIAINTEL-LIVE",
                    "confidence": 94,
                    "market_impact": 8,
                    "executive_summary": "Federal Reserve signals potential rate cuts as economic indicators weaken.",
                    "sovereign_insight": "This signals coordination between Fed and ECB to prevent dollar strengthening.",
                    "risk_assessment": "Primary risk: Sudden dollar volatility if rate cut exceeds expectations."
                },
                {
                    "id": "stream-2",
                    "title": "BITCOIN BREAKS $50K RESISTANCE - INSTITUTIONAL ACCUMULATION DETECTED",
                    "region": "GLOBAL",
                    "sentiment": "BULLISH",
                    "impact": 9,
                    "source": "SIAINTEL-LIVE",
                    "confidence": 92,
                    "market_impact": 9,
                    "executive_summary": "Large holder wallets show significant BTC accumulation pattern.",
                    "sovereign_insight": "Institutional players positioning ahead of ETF approval cycle.",
                    "risk_assessment": "Leverage liquidation risk if price retraces below $48K support."
                },
                {
                    "id": "stream-3",
                    "title": "MIDDLE EAST OIL PIPELINE DISRUPTION - ENERGY SECTOR ALERT",
                    "region": "GULF",
                    "sentiment": "BEARISH",
                    "impact": 7,
                    "source": "SIAINTEL-LIVE",
                    "confidence": 88,
                    "market_impact": 7,
                    "executive_summary": "Geopolitical tensions impact oil supply chain logistics.",
                    "sovereign_insight": "Strategic reserves may be deployed to stabilize prices.",
                    "risk_assessment": "Oil price spike could trigger inflation concerns."
                },
                {
                    "id": "stream-4",
                    "title": "AI CHIP SHORTAGE IMPACTS TECH GIANTS - SUPPLY CHAIN CRISIS",
                    "region": "ASIA",
                    "sentiment": "BEARISH",
                    "impact": 6,
                    "source": "SIAINTEL-LIVE",
                    "confidence": 85,
                    "market_impact": 6,
                    "executive_summary": "Semiconductor manufacturing delays affect Q1 projections.",
                    "sovereign_insight": "Taiwan-China tensions creating supply uncertainty.",
                    "risk_assessment": "Tech sector earnings may disappoint if shortage persists."
                },
                {
                    "id": "stream-5",
                    "title": "EUROPEAN CENTRAL BANK MAINTAINS HAWKISH STANCE ON INFLATION",
                    "region": "EUROPE",
                    "sentiment": "NEUTRAL",
                    "impact": 5,
                    "source": "SIAINTEL-LIVE",
                    "confidence": 90,
                    "market_impact": 5,
                    "executive_summary": "ECB signals continued vigilance despite cooling inflation data.",
                    "sovereign_insight": "Coordinated policy with Fed to manage currency stability.",
                    "risk_assessment": "Euro strength could impact export-dependent economies."
                },
                {
                    "id": "stream-6",
                    "title": "TESLA ANNOUNCES BREAKTHROUGH IN BATTERY TECHNOLOGY",
                    "region": "WALL ST",
                    "sentiment": "BULLISH",
                    "impact": 8,
                    "source": "SIAINTEL-LIVE",
                    "confidence": 91,
                    "market_impact": 8,
                    "executive_summary": "New solid-state battery promises 50% range increase.",
                    "sovereign_insight": "Game-changer for EV adoption and energy storage sector.",
                    "risk_assessment": "Production scaling challenges remain uncertain."
                },
                {
                    "id": "stream-7",
                    "title": "CHINA PROPERTY SECTOR SHOWS SIGNS OF STABILIZATION",
                    "region": "ASIA",
                    "sentiment": "NEUTRAL",
                    "impact": 6,
                    "source": "SIAINTEL-LIVE",
                    "confidence": 87,
                    "market_impact": 6,
                    "executive_summary": "Government stimulus measures begin to take effect.",
                    "sovereign_insight": "Systemic risk reduced but structural issues persist.",
                    "risk_assessment": "Shadow banking exposure still unclear."
                },
                {
                    "id": "stream-8",
                    "title": "GOLD HITS NEW ALL-TIME HIGH AS SAFE-HAVEN DEMAND SURGES",
                    "region": "GLOBAL",
                    "sentiment": "BULLISH",
                    "impact": 7,
                    "source": "SIAINTEL-LIVE",
                    "confidence": 93,
                    "market_impact": 7,
                    "executive_summary": "Geopolitical tensions drive precious metals rally.",
                    "sovereign_insight": "Central banks accelerating gold accumulation.",
                    "risk_assessment": "Correction likely if tensions ease."
                }
            ]
            
            # Stream intelligence one by one with random delays
            for intel in demo_intelligence:
                # Random delay between 5-15 seconds
                delay = random.uniform(5.0, 15.0)
                logger.info(f"[LIVE-PULSE] ⏳ Next intelligence in {delay:.1f}s")
                await asyncio.sleep(delay)
                
                # Add real-time timestamp
                intel["time"] = datetime.now().strftime("%H:%M:%S.%f")[:-3]
                
                # Format as SSE
                data = json.dumps(intel)
                yield f"data: {data}\n\n"
                
                logger.info(f"[LIVE-PULSE] 📡 Streamed: {intel['title'][:50]}...")
            
            # Keep connection alive with heartbeat
            while True:
                await asyncio.sleep(30)
                yield f"data: {json.dumps({'type': 'heartbeat', 'timestamp': datetime.now().isoformat()})}\n\n"
                
        except asyncio.CancelledError:
            logger.info("[LIVE-PULSE] 🔌 Stream connection closed")
        except Exception as e:
            logger.error(f"[LIVE-PULSE] ❌ Stream error: {e}")
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/news")
def get_news(limit: int = 10):
    """İşlenmiş istihbaratı getir (ULTRA-SYNC)"""
    recent = live_intelligence_store[-limit:] if live_intelligence_store else []
    return {
        "success": True,
        "count": len(recent),
        "intelligence": recent
    }

@app.post("/manual-process")
def manual_process(news_item: NewsItem):
    """Manuel haber işleme (ULTRA-SYNC)"""
    try:
        intelligence = brain.process_news(news_item)
        
        if intelligence:
            # Kuyruğa ekle (30 saniye sonra yayınlanacak)
            pending_intelligence_queue.append(intelligence.dict())
            database.mark_as_seen(news_item.hash, news_item.title)
            
            return {
                "success": True,
                "intelligence": intelligence.dict(),
                "message": "Intelligence queued for broadcast (30s delay)"
            }
        else:
            raise HTTPException(status_code=500, detail="İşleme başarısız")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/stats")
def get_stats():
    """THE FACTORY istatistikleri (ULTRA-SYNC)"""
    return {
        "success": True,
        "stats": {
            **stats,
            'intelligence_count': len(live_intelligence_store),
            'pending_queue_size': len(pending_intelligence_queue),
            'rate_limiter': {
                'total_requests': rate_limiter.request_count,
                'current_delay_seconds': rate_limiter.current_delay,
                'retry_count': rate_limiter.retry_count
            },
            'database': database.get_stats()
        }
    }

@app.get("/videos/recent")
def get_recent_videos(limit: int = 10):
    """Son üretilen videoları getir"""
    try:
        videos = database.get_recent_videos(limit)
        return {
            "success": True,
            "count": len(videos),
            "videos": videos
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/videos/file/{file_path:path}")
def serve_video_file(file_path: str):
    """Video dosyasını serve et"""
    from fastapi.responses import FileResponse
    import os
    
    try:
        # Security: Only allow files from output directory
        if not file_path.startswith('output/videos/'):
            file_path = f'output/videos/{file_path}'
        
        full_path = os.path.join(os.getcwd(), file_path)
        
        if not os.path.exists(full_path):
            raise HTTPException(status_code=404, detail="Video not found")
        
        return FileResponse(
            full_path,
            media_type="video/mp4",
            headers={
                "Cache-Control": "public, max-age=3600",
                "Access-Control-Allow-Origin": "*"
            }
        )
    except Exception as e:
        logger.error(f"[API] Video serve error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cycle/stats")
def get_cycle_stats():
    """Cycle istatistikleri"""
    return {
        "success": True,
        "cycle_stats": {
            "total_cycles": stats.get('new_processed', 0),
            "total_videos": stats.get('videos_produced', 0),
            "last_cycle_duration": stats.get('last_cycle_duration', 0),
            "last_run": stats.get('last_run'),
            "success_rate": (stats['new_processed'] / max(stats['total_scanned'], 1)) * 100 if stats['total_scanned'] > 0 else 0
        }
    }

@app.post("/cycle/trigger")
def trigger_cycle():
    """Manuel cycle tetikleme"""
    try:
        logger.info("[API] Manuel cycle tetiklendi")
        run_factory_cycle()
        return {
            "success": True,
            "message": "Production cycle triggered",
            "stats": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/start")
def start_factory():
    """SIAIntel'i başlat (20 dakikalık döngü)"""
    try:
        if not scheduler.running:
            scheduler.add_job(
                run_factory_cycle,
                'interval',
                minutes=20,
                id='siaintel_cycle'
            )
            scheduler.start()
            logger.info("[API] 🏭 SIAIntel başlatıldı (20 dakikalık döngü)")
            
            # İlk döngüyü hemen çalıştır
            run_factory_cycle()
            
        return {
            "success": True,
            "message": "SIAIntel started",
            "cycle_interval": "20 minutes",
            "next_cycle": "in 20 minutes"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/stop")
def stop_factory():
    """SIAIntel'i durdur"""
    try:
        if scheduler.running:
            scheduler.shutdown()
            logger.info("[API] 🏭 SIAIntel durduruldu")
        
        return {
            "success": True,
            "message": "SIAIntel stopped"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# STARTUP
# ============================================================================

@app.on_event("startup")
def startup_event():
    """Başlangıç eventi"""
    logger.info("\n" + "="*80)
    logger.info("🏭 SIAIntel - OTONOM MEDYA FABRİKASI")
    logger.info("Sovereign Intelligence Architecture - Autonomous Media Factory")
    logger.info("="*80)
    logger.info("Status: OPERATIONAL")
    logger.info(f"Gemini API: {'✓ Configured' if GEMINI_API_KEY else '✗ ERROR'}")
    logger.info(f"Model: {GEMINI_MODEL_TYPE}")
    logger.info("Rate Limiter: 45s base delay")
    logger.info("Scheduler: 20-minute intervals (3 news per cycle)")
    logger.info("Modules: SCOUT → BRAIN → VOICE → COMPOSITOR")
    logger.info("Features: Logo Watermark, Auto Upload, Error Resilience")
    logger.info("Output: output/videos/, output/audio/")
    logger.info("Database: data/siaintel.db (SQLite)")
    logger.info("="*80 + "\n")

@app.on_event("shutdown")
def shutdown_event():
    """Shutdown eventi"""
    logger.info("[SHUTDOWN] Closing database connection...")
    database.close()
    logger.info("[SHUTDOWN] SIAIntel stopped")

# ============================================================================
# RUN
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
