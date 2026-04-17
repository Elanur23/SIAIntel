from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import edge_tts
import os
import uvicorn
import re
from datetime import datetime

app = FastAPI(title="SIA Intelligence - Pro Studio Voice Engine")

# CORS (Sarsılmaz Next.js bağlantısı)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

AUDIO_DIR = "static/audio"
os.makedirs(AUDIO_DIR, exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

# 🎙️ SIA_MASTER_VOICE_MATRIX
# En doğal ve 'Haberci' karakterine sahip sesler seçildi.
VOICES = {
    "tr": "tr-TR-AhmetNeural", # Otoriter Türk spiker
    "en": "en-US-AndrewMultilingualNeural", # Global finans sesi
    "ru": "ru-RU-DmitryNeural",
    "ar": "ar-SA-HamedNeural"
}

def clean_text_for_speech(text: str):
    """
    Metni robotik okumadan kurtarıp spiker akışına sokar.
    """
    # 1. [ÖZET] gibi köşeli parantezleri temizle ama yerlerine duraksama koy
    text = re.sub(r'\[.*?\]', '... ', text)
    # 2. Yıldızları ve gereksiz karakterleri temizle
    text = text.replace('*', '')
    # 3. URL'leri temizle
    text = re.sub(r'http\S+', '', text)
    return text

@app.get("/api/v1/tts/generate")
async def generate_voice(text: str, lang: str = "tr"):
    """
    Microsoft Edge-TTS'i 'Master Studio' ayarlarıyla çalıştırır.
    Kartsız, sınırsız ve ElevenLabs kalitesine en yakın konfigürasyon.
    """
    try:
        if not text:
            raise HTTPException(status_code=400, detail="Text is empty")

        clean_metin = clean_text_for_speech(text)
        filename = f"sia_studio_{int(datetime.now().timestamp())}.mp3"
        filepath = os.path.join(AUDIO_DIR, filename)

        voice = VOICES.get(lang, VOICES["tr"])

        # 💎 MASTER TUNING:
        # rate="-10%": Spikerin daha tane tane ve otoriter konuşmasını sağlar.
        # pitch="+0Hz": Sesin doğallığını korur.
        communicate = edge_tts.Communicate(clean_metin, voice, rate="-10%", pitch="+0Hz")
        await communicate.save(filepath)

        return {
            "success": True,
            "audioUrl": f"http://localhost:8000/static/audio/{filename}",
            "metadata": {
                "engine": "MICROSOFT_EDGE_STUDIO_V1",
                "voice": voice,
                "tuning": "News_Anchor_v2"
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}

@app.get("/")
async def status():
    return {"status": "SIA_PRO_STUDIO_ACTIVE", "mode": "UNLIMITED_ULTRA_QUALITY"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
