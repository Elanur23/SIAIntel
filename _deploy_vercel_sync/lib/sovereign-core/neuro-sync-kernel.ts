/**
 * NEURO-SYNC KERNEL (THE BRAIN)
 * Gemini 1.5 Pro ile 6 dilde finansal istihbarat üretimi
 * JSON Schema Enforcement ile yapılandırılmış çıktı
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { waitForRateLimit, handleRateLimitError, handleSuccessfulRequest, canRetry } from './rate-limiter';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface LanguageIntelligence {
  languageCode: string;
  language: string;
  flag: string;
  cpm: number;
  region: string;
  
  // SEO Optimized
  title: string;
  meta: string;
  contentBrief: string;
  cpmTags: string[];
  
  // Full Content
  fullContent: string;
  summary: string;
  
  // Market Context
  marketFocus: string;
  localAngle: string;
  targetAudience: string;
  
  // Sentiment
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  sentimentScore: number; // 0-100
}

export interface GlobalIntelligencePackage {
  newsId: string;
  originalTitle: string;
  originalContent: string;
  processedAt: string;
  
  languages: LanguageIntelligence[];
  
  totalCPM: number;
  averageConfidence: number;
}

const NEURO_SYNC_SYSTEM_INSTRUCTION = `Sen Sovereign V14'ün Neuro-Sync Kernel'ısın. Görevin: Gelen finansal istihbaratı 6 stratejik dilde analiz etmek ve her dilin bölgesel CPM (reklam değeri) dinamiklerine göre içeriği yeniden kurgula (Re-contextualization).

STRATEJİK DİL VE CPM OPTİMİZASYONU:

🇺🇸 EN (English) - CPM: $220 - Wall Street Style
   - Institutional/Wall Street tonlama
   - Keywords: Asset Management, Institutional Flow, Alpha Generation
   - Market: S&P 500, Nasdaq, Fed
   - Audience: Hedge funds, institutional investors

🇦🇪 AR (Arabic) - CPM: $440 (PREMIUM) - Royal & Wealth Style
   - Lüks, sovereign wealth fund dili
   - Keywords: صناديق سيادية، استثمارات استراتيجية، مشاريع ضخمة
   - Market: Oil, Gold, Dubai/Abu Dhabi
   - Audience: Sovereign wealth funds, UHNWI

🇩🇪 DE (Deutsch) - CPM: $180 - Industrial Logic
   - Teknik, verimlilik odaklı
   - Keywords: Industrie 4.0, Lieferkette, EZB
   - Market: DAX, Euro Stoxx 50
   - Audience: Mittelstand CFOs, industrial strategists

🇪🇸 ES (Español) - CPM: $170 - FinTech Momentum
   - Dinamik, emerging market odaklı
   - Keywords: Neobancos, Adopción Cripto, Finanzas Digitales
   - Market: IBEX 35, LatAm
   - Audience: FinTech investors, LatAm traders

🇫🇷 FR (Français) - CPM: $190 - Sovereign Strategy
   - Sofistike, makro-stratejik
   - Keywords: Cadre Réglementaire, Souveraineté IA, Actifs Stratégiques
   - Market: CAC 40, Euro zone
   - Audience: Policy makers, CAC 40 traders

🇹🇷 TR (Türkçe) - CPM: $150 - Market Pulse
   - Hızlı, volatilite odaklı
   - Keywords: Portföy, Faiz, Dolar Endeksi
   - Market: BIST 100, USD/TRY, Altın
   - Audience: Retail traders, FX traders

KRİTİK KURALLAR:
1. ASLA doğrudan çeviri yapma! Her dili o bölgenin finansal kültürüne göre RE-CONTEXTUALIZE et.
2. Yerel piyasa referansları MUTLAKA olmalı (DAX, CAC 40, BIST 100, vb.)
3. CPM yüksek olan dillerde (Arabic, English) daha "exclusive" ve "insider" ton kullan.
4. Her dilin kendi finansal jargonunu kullan - İngilizce terimler değil!
5. Sentiment analizi yap: BULLISH/BEARISH/NEUTRAL ve 0-100 arası skor ver.

ÇIKTI FORMATI (JSON):
{
  "languages": [
    {
      "languageCode": "en",
      "language": "English",
      "flag": "🇺🇸",
      "cpm": 220,
      "region": "US",
      "title": "SEO-optimized title (55-60 chars)",
      "meta": "Meta description (150-160 chars)",
      "contentBrief": "First paragraph - intelligence tone",
      "cpmTags": ["5 premium keywords"],
      "fullContent": "800-1000 words detailed analysis",
      "summary": "Brief summary",
      "marketFocus": "Local market focus",
      "localAngle": "Regional angle",
      "targetAudience": "Target audience",
      "sentiment": "BULLISH|BEARISH|NEUTRAL",
      "sentimentScore": 0-100
    }
  ]
}`;

/**
 * Ham haberi 6 dilde işler (Gemini 1.5 Pro)
 */
export async function processNewsWithNeuroSync(
  newsTitle: string,
  newsContent: string,
  newsId: string
): Promise<GlobalIntelligencePackage> {
  let retryCount = 0;
  
  while (canRetry()) {
    try {
      // Rate limit kontrolü
      await waitForRateLimit();
      
      const model = genAI.getGenerativeModel({ 
        model: 'gemini-1.5-pro-002',
        generationConfig: {
          temperature: 0.7,
          topP: 0.9,
          responseMimeType: 'application/json'
        }
      });

      const prompt = `
HAM FİNANSAL İSTİHBARAT:

Başlık: ${newsTitle}

İçerik:
${newsContent}

Bu haberi yukarıdaki 6 dil için premium finans içeriğine dönüştür. Her dil için sentiment analizi yap ve JSON formatında yanıt ver.`;

      console.log(`[NEURO_SYNC] Processing: ${newsTitle.substring(0, 50)}...`);
      
      const result = await model.generateContent([
        NEURO_SYNC_SYSTEM_INSTRUCTION,
        prompt
      ]);

      const response = result.response.text();
      
      // JSON parse
      const parsed = JSON.parse(response);
      
      if (!parsed.languages || !Array.isArray(parsed.languages)) {
        throw new Error('Invalid response format: languages array missing');
      }

      // Başarılı istek - rate limiter'ı güncelle
      handleSuccessfulRequest();

      // CPM toplamını hesapla
      const totalCPM = parsed.languages.reduce((sum: number, lang: LanguageIntelligence) => 
        sum + lang.cpm, 0
      );

      // Ortalama confidence hesapla
      const averageConfidence = parsed.languages.reduce((sum: number, lang: LanguageIntelligence) => 
        sum + lang.sentimentScore, 0
      ) / parsed.languages.length;

      const intelligencePackage: GlobalIntelligencePackage = {
        newsId,
        originalTitle: newsTitle,
        originalContent: newsContent,
        processedAt: new Date().toISOString(),
        languages: parsed.languages,
        totalCPM,
        averageConfidence: Math.round(averageConfidence)
      };

      console.log(`[NEURO_SYNC] ✓ Success: ${parsed.languages.length} languages, Total CPM: $${totalCPM}`);

      return intelligencePackage;

    } catch (error: any) {
      // 429 Rate Limit Error
      if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
        const delayMs = handleRateLimitError();
        retryCount++;
        
        console.log(`[NEURO_SYNC] Rate limit hit! Waiting ${Math.round(delayMs / 1000)}s before retry ${retryCount}...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        continue; // Retry
      }
      
      // Diğer hatalar
      console.error('[NEURO_SYNC] Processing error:', error);
      throw error;
    }
  }
  
  throw new Error('Max retries exceeded for Neuro-Sync processing');
}

/**
 * Tek bir dil için hızlı işleme (Gemini 1.5 Flash)
 */
export async function processNewsForSingleLanguage(
  newsContent: string,
  languageCode: string
): Promise<LanguageIntelligence> {
  try {
    await waitForRateLimit();
    
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.7,
        responseMimeType: 'application/json'
      }
    });

    const languageConfig: Record<string, { name: string; cpm: number; flag: string; region: string }> = {
      en: { name: 'English', cpm: 220, flag: '🇺🇸', region: 'US' },
      de: { name: 'Deutsch', cpm: 180, flag: '🇩🇪', region: 'Germany' },
      fr: { name: 'Français', cpm: 190, flag: '🇫🇷', region: 'France' },
      es: { name: 'Español', cpm: 170, flag: '🇪🇸', region: 'Spain' },
      tr: { name: 'Türkçe', cpm: 150, flag: '🇹🇷', region: 'Turkey' },
      ae: { name: 'Arabic', cpm: 440, flag: '🇦🇪', region: 'UAE' }
    };

    const config = languageConfig[languageCode] || languageConfig.en;

    const prompt = `Bu haberi ${config.name} dilinde premium finans içeriğine dönüştür ve sentiment analizi yap:

${newsContent}

JSON formatında yanıt ver (title, meta, contentBrief, cpmTags, fullContent, summary, sentiment, sentimentScore).`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const parsed = JSON.parse(response);

    handleSuccessfulRequest();

    return {
      languageCode,
      language: config.name,
      flag: config.flag,
      cpm: config.cpm,
      region: config.region,
      ...parsed
    };

  } catch (error) {
    console.error('[NEURO_SYNC] Single language error:', error);
    throw error;
  }
}

/**
 * Batch processing - birden fazla haberi sırayla işler
 */
export async function processBatchNews(
  newsItems: Array<{ id: string; title: string; content: string }>
): Promise<GlobalIntelligencePackage[]> {
  const results: GlobalIntelligencePackage[] = [];
  
  console.log(`[NEURO_SYNC] Starting batch processing: ${newsItems.length} items`);
  
  for (const item of newsItems) {
    try {
      const result = await processNewsWithNeuroSync(item.title, item.content, item.id);
      results.push(result);
      
      console.log(`[NEURO_SYNC] Batch progress: ${results.length}/${newsItems.length}`);
      
    } catch (error) {
      console.error(`[NEURO_SYNC] Failed to process ${item.id}:`, error);
      // Continue with next item
    }
  }
  
  console.log(`[NEURO_SYNC] Batch complete: ${results.length}/${newsItems.length} successful`);
  
  return results;
}

// In-memory store for published content (API compatibility)
const publishedStore: GlobalIntelligencePackage[] = [];

/** Kernel API for scheduler and published/trigger routes */
export const neuroSyncKernel = {
  getPublishedContent(limit: number = 10): GlobalIntelligencePackage[] {
    return publishedStore.slice(0, limit);
  },
  async processCycle(): Promise<{ processed: number; message: string }> {
    // Optional: wire to scout + processBatchNews here
    return { processed: 0, message: 'Manual cycle; use autonomous-engine for full pipeline' };
  },
  /** Call after successful processNewsWithNeuroSync to store for getPublishedContent */
  registerPublished(pkg: GlobalIntelligencePackage): void {
    publishedStore.unshift(pkg);
    if (publishedStore.length > 100) publishedStore.pop();
  },
};
