/**
 * AUTONOMOUS ENGINE
 * Tüm sistemleri birleştiren ana motor
 * Scout → Dedup → Rate Limit → Neuro-Sync → Storage
 */

import { aggregateNews, NewsItem } from './scout';
import { isNewsSeen, markNewsAsSeen, getDeduplicationStats, cleanOldNews } from './deduplication';
import { processNewsWithNeuroSync, GlobalIntelligencePackage } from './neuro-sync-kernel';
import { getRateLimitStatus } from './rate-limiter';

export interface EngineStats {
  totalNewsScanned: number;
  newNewsProcessed: number;
  duplicatesSkipped: number;
  processingErrors: number;
  lastRunTime: string;
  uptime: number;
  rateLimitStatus: ReturnType<typeof getRateLimitStatus>;
  deduplicationStats: ReturnType<typeof getDeduplicationStats>;
}

export interface EngineConfig {
  intervalMinutes: number;
  autoCleanOldNews: boolean;
  cleanOldNewsDays: number;
  maxProcessPerCycle: number;
}

const DEFAULT_CONFIG: EngineConfig = {
  intervalMinutes: 15,
  autoCleanOldNews: true,
  cleanOldNewsDays: 7,
  maxProcessPerCycle: 5 // Maximum 5 haber per cycle (rate limit için)
};

// Engine state
let engineStats: EngineStats = {
  totalNewsScanned: 0,
  newNewsProcessed: 0,
  duplicatesSkipped: 0,
  processingErrors: 0,
  lastRunTime: '',
  uptime: 0,
  rateLimitStatus: getRateLimitStatus(),
  deduplicationStats: getDeduplicationStats()
};

let engineStartTime: number = 0;
let isEngineRunning: boolean = false;
let engineInterval: NodeJS.Timeout | null = null;

// Processed intelligence storage (in-memory, production'da DB kullan)
const intelligenceStore = new Map<string, GlobalIntelligencePackage>();

/**
 * Tek bir news cycle'ı çalıştırır
 */
async function runNewsCycle(config: EngineConfig): Promise<void> {
  console.log('\n[ENGINE] ═══════════════════════════════════════════════════');
  console.log('[ENGINE] Starting news cycle...');
  console.log('[ENGINE] ═══════════════════════════════════════════════════\n');
  
  try {
    // 1. Scout - RSS'ten haberleri topla
    const newsItems = await aggregateNews();
    engineStats.totalNewsScanned += newsItems.length;
    
    console.log(`[ENGINE] Scanned ${newsItems.length} news items`);
    
    // 2. Deduplication - Yeni haberleri filtrele
    const newNews: NewsItem[] = [];
    
    for (const item of newsItems) {
      if (isNewsSeen(item.hash)) {
        engineStats.duplicatesSkipped++;
        console.log(`[ENGINE] ⊗ Duplicate skipped: ${item.title.substring(0, 50)}...`);
      } else {
        newNews.push(item);
      }
    }
    
    console.log(`[ENGINE] Found ${newNews.length} new items (${engineStats.duplicatesSkipped} duplicates skipped)`);
    
    // 3. Rate limit için max process sayısını kontrol et
    const toProcess = newNews.slice(0, config.maxProcessPerCycle);
    
    if (toProcess.length === 0) {
      console.log('[ENGINE] No new news to process');
      return;
    }
    
    console.log(`[ENGINE] Processing ${toProcess.length} items (max: ${config.maxProcessPerCycle})`);
    
    // 4. Neuro-Sync - Her haberi işle
    for (const item of toProcess) {
      try {
        console.log(`\n[ENGINE] → Processing: ${item.title}`);
        
        const intelligence = await processNewsWithNeuroSync(
          item.title,
          item.content,
          item.id
        );
        
        // 5. Storage - İşlenmiş istihbaratı sakla
        intelligenceStore.set(item.id, intelligence);
        
        // 6. Dedup - Haberi görüldü olarak işaretle
        markNewsAsSeen({
          hash: item.hash,
          title: item.title,
          timestamp: item.pubDate,
          processedAt: new Date().toISOString()
        });
        
        engineStats.newNewsProcessed++;
        
        console.log(`[ENGINE] ✓ Success: ${intelligence.languages.length} languages, CPM: $${intelligence.totalCPM}`);
        
      } catch (error) {
        engineStats.processingErrors++;
        console.error(`[ENGINE] ✗ Error processing ${item.id}:`, error);
      }
    }
    
  } catch (error) {
    console.error('[ENGINE] Cycle error:', error);
    engineStats.processingErrors++;
  } finally {
    // Update stats
    engineStats.lastRunTime = new Date().toISOString();
    engineStats.uptime = Math.floor((Date.now() - engineStartTime) / 1000);
    engineStats.rateLimitStatus = getRateLimitStatus();
    engineStats.deduplicationStats = getDeduplicationStats();
    
    console.log('\n[ENGINE] ═══════════════════════════════════════════════════');
    console.log('[ENGINE] Cycle complete');
    console.log(`[ENGINE] Stats: ${engineStats.newNewsProcessed} processed, ${engineStats.duplicatesSkipped} skipped, ${engineStats.processingErrors} errors`);
    console.log('[ENGINE] ═══════════════════════════════════════════════════\n');
  }
}

/**
 * Autonomous Engine'i başlatır
 */
export function startAutonomousEngine(config: EngineConfig = DEFAULT_CONFIG): void {
  if (isEngineRunning) {
    console.log('[ENGINE] Already running!');
    return;
  }
  
  console.log('\n[ENGINE] ╔═══════════════════════════════════════════════════╗');
  console.log('[ENGINE] ║   SOVEREIGN V14 AUTONOMOUS ENGINE STARTING...   ║');
  console.log('[ENGINE] ╚═══════════════════════════════════════════════════╝\n');
  console.log(`[ENGINE] Config: ${config.intervalMinutes}min interval, max ${config.maxProcessPerCycle} per cycle`);
  
  isEngineRunning = true;
  engineStartTime = Date.now();
  
  // İlk cycle'ı hemen çalıştır
  runNewsCycle(config);
  
  // Periyodik cycle'ları başlat
  engineInterval = setInterval(() => {
    runNewsCycle(config);
    
    // Auto-clean old news
    if (config.autoCleanOldNews) {
      cleanOldNews(config.cleanOldNewsDays);
    }
  }, config.intervalMinutes * 60 * 1000);
  
  console.log(`[ENGINE] ✓ Engine started! Running every ${config.intervalMinutes} minutes`);
}

/**
 * Engine'i durdurur
 */
export function stopAutonomousEngine(): void {
  if (!isEngineRunning) {
    console.log('[ENGINE] Not running!');
    return;
  }
  
  if (engineInterval) {
    clearInterval(engineInterval);
    engineInterval = null;
  }
  
  isEngineRunning = false;
  
  console.log('\n[ENGINE] ╔═══════════════════════════════════════════════════╗');
  console.log('[ENGINE] ║   SOVEREIGN V14 AUTONOMOUS ENGINE STOPPED       ║');
  console.log('[ENGINE] ╚═══════════════════════════════════════════════════╝\n');
  console.log(`[ENGINE] Final stats: ${engineStats.newNewsProcessed} processed, ${engineStats.duplicatesSkipped} skipped`);
}

/**
 * Engine durumunu döner
 */
export function getEngineStatus(): {
  isRunning: boolean;
  stats: EngineStats;
  config: EngineConfig;
  intelligenceCount: number;
} {
  return {
    isRunning: isEngineRunning,
    stats: {
      ...engineStats,
      rateLimitStatus: getRateLimitStatus(),
      deduplicationStats: getDeduplicationStats()
    },
    config: DEFAULT_CONFIG,
    intelligenceCount: intelligenceStore.size
  };
}

/**
 * İşlenmiş istihbaratları döner
 */
export function getProcessedIntelligence(limit: number = 10): GlobalIntelligencePackage[] {
  const all = Array.from(intelligenceStore.values());
  
  // En yeni önce
  const sorted = all.sort((a, b) => 
    new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
  );
  
  return sorted.slice(0, limit);
}

/**
 * Belirli bir istihbaratı ID ile döner
 */
export function getIntelligenceById(id: string): GlobalIntelligencePackage | null {
  return intelligenceStore.get(id) || null;
}

/**
 * Engine stats'ı sıfırla (test için)
 */
export function resetEngineStats(): void {
  engineStats = {
    totalNewsScanned: 0,
    newNewsProcessed: 0,
    duplicatesSkipped: 0,
    processingErrors: 0,
    lastRunTime: '',
    uptime: 0,
    rateLimitStatus: getRateLimitStatus(),
    deduplicationStats: getDeduplicationStats()
  };
  
  console.log('[ENGINE] Stats reset');
}

/**
 * Manuel cycle tetikle (test için)
 */
export async function triggerManualCycle(): Promise<void> {
  if (!isEngineRunning) {
    console.log('[ENGINE] Starting manual cycle...');
    await runNewsCycle(DEFAULT_CONFIG);
  } else {
    console.log('[ENGINE] Cannot trigger manual cycle while engine is running');
  }
}
