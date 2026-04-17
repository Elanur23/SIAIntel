// Otomatik radar/backfill batch tetikleyici (her 30 dakikada bir)
const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.BASE_URL || 'http://localhost:3000';

async function triggerRadarBatch() {
  try {
    const res = await fetch(`${BASE_URL}/api/admin/backfill-multilingual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 5 })
    });
    const data = await res.json();
    console.log(`[${new Date().toISOString()}] Radar batch result:`, data);
  } catch (e) {
    console.error(`[${new Date().toISOString()}] Radar batch error:`, e);
  }
}

// 30 dakikada bir tetikleme
setInterval(triggerRadarBatch, 30 * 60 * 1000);

// İlk başlatmada da çalışsın
triggerRadarBatch();
