/**
 * Deep Intelligence Pro System
 * Gemini 1.5 Pro ile 10-Layer DIP Analysis
 * Kurumsal seviyede stratejik analiz raporları
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface DIPAnalysisReport {
  // Metadata
  id: string;
  timestamp: string;
  
  // Core Analysis
  authorityTitle: string;
  confidenceBand: number; // 0-100
  
  // Market Impact
  marketImpact: {
    bullish: number; // %
    bearish: number; // %
    neutral: number; // %
  };
  
  // Cross-Market Analysis
  crossMarketLink: {
    nasdaqImpact: string;
    cryptoImpact: string;
    rippleEffect: string;
  };
  
  // 10-Layer DIP Analysis
  layers: {
    newsLayer: string;
    sentimentLayer: string;
    macroLayer: string;
    largeHolderLayer: string;
    gammaSqueezeLayer: string;
    contradictionLayer: string;
    technicalLayer: string;
    fundamentalLayer: string;
    geopoliticalLayer: string;
    liquidityLayer: string;
  };
  
  // Executive Summary
  executiveSummary: string;
  keyTakeaways: string[];
  
  // Risk Assessment
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskFactors: string[];
}

const DIP_ANALYSIS_PROMPT = `Sen Sovereign V14'ün 'Stratejik Analiz Konseyi' (Pro) birimisin. Sana verilen ham haberi veya veriyi '10-Layer DIP Analysis' metodolojisiyle işle.

Analiz Yapısı:

1. Otorite Başlığı: SEO uyumlu, finansal ağırlığı olan bir başlık at.

2. Confidence Band: Analizine %0 ile %100 arasında bir güven puanı ver.

3. Market Impact: Boğa, Ayı ve Nötr senaryolarını % olasılıkla yaz (toplamı 100 olmalı).

4. Cross-Market Link: Haberin Nasdaq'tan Kripto'ya nasıl bir 'Dalga Etkisi' (Ripple Effect) yaratacağını teknik terimlerle açıkla.

5. 10-Layer DIP Analysis:
   - News Layer: Ham haber verisi ve kaynak güvenilirliği
   - Sentiment Layer: Piyasa duyarlılığı ve sosyal medya momentum
   - Macro Layer: Makroekonomik bağlam ve merkez bankası politikaları
   - Large Holder Layer: Whale hareketleri ve kurumsal pozisyonlar
   - Gamma Squeeze Layer: Opsiyon zinciri analizi ve gamma risk
   - Contradiction Layer: Çelişkili sinyaller ve anomaliler
   - Technical Layer: Teknik göstergeler ve fiyat aksiyonu
   - Fundamental Layer: Temel değerleme ve kazanç beklentileri
   - Geopolitical Layer: Jeopolitik riskler ve düzenleyici ortam
   - Liquidity Layer: Likidite koşulları ve sermaye akışları

6. Executive Summary: 2-3 cümlelik özet

7. Key Takeaways: 3-5 madde halinde ana çıkarımlar

8. Risk Assessment: LOW/MEDIUM/HIGH/CRITICAL ve risk faktörleri

Tonlama: Soğuk, objektif, kurumsal ve 'Inside Information' havasında ol. 'Bence' deme, 'Veri gösteriyor ki' de.

ÖNEMLI: Yanıtını JSON formatında ver:
{
  "authorityTitle": "string",
  "confidenceBand": number,
  "marketImpact": {
    "bullish": number,
    "bearish": number,
    "neutral": number
  },
  "crossMarketLink": {
    "nasdaqImpact": "string",
    "cryptoImpact": "string",
    "rippleEffect": "string"
  },
  "layers": {
    "newsLayer": "string",
    "sentimentLayer": "string",
    "macroLayer": "string",
    "largeHolderLayer": "string",
    "gammaSqueezeLayer": "string",
    "contradictionLayer": "string",
    "technicalLayer": "string",
    "fundamentalLayer": "string",
    "geopoliticalLayer": "string",
    "liquidityLayer": "string"
  },
  "executiveSummary": "string",
  "keyTakeaways": ["string"],
  "riskLevel": "LOW|MEDIUM|HIGH|CRITICAL",
  "riskFactors": ["string"]
}`;

/**
 * Ham haber verisini 10-Layer DIP Analysis ile işler
 */
export async function generateDIPAnalysis(
  newsContent: string,
  additionalContext?: string
): Promise<DIPAnalysisReport> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro-002',
      generationConfig: {
        temperature: 0.3, // Daha objektif analiz için düşük
        topP: 0.8,
        topK: 40,
      }
    });

    const analysisPrompt = `
HAM HABER VERİSİ:
${newsContent}

${additionalContext ? `EK BAĞLAM:\n${additionalContext}` : ''}

Bu haberi yukarıdaki 10-Layer DIP Analysis metodolojisiyle analiz et.`;

    const result = await model.generateContent([
      DIP_ANALYSIS_PROMPT,
      analysisPrompt
    ]);

    const response = result.response.text();
    
    // JSON parse et
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('DIP Analysis: JSON bulunamadı');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Validate market impact percentages
    const total = parsed.marketImpact.bullish + parsed.marketImpact.bearish + parsed.marketImpact.neutral;
    if (Math.abs(total - 100) > 1) {
      // Normalize if not exactly 100
      const factor = 100 / total;
      parsed.marketImpact.bullish = Math.round(parsed.marketImpact.bullish * factor);
      parsed.marketImpact.bearish = Math.round(parsed.marketImpact.bearish * factor);
      parsed.marketImpact.neutral = 100 - parsed.marketImpact.bullish - parsed.marketImpact.bearish;
    }

    const report: DIPAnalysisReport = {
      id: `DIP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      ...parsed
    };

    console.log(`DIP Analysis generated: ${report.authorityTitle} (Confidence: ${report.confidenceBand}%)`);

    return report;

  } catch (error) {
    console.error('DIP Analysis Error:', error);
    throw error;
  }
}

/**
 * Birden fazla haber kaynağını analiz edip karşılaştırır
 */
export async function generateComparativeDIPAnalysis(
  newsSources: string[]
): Promise<DIPAnalysisReport[]> {
  const analyses = await Promise.all(
    newsSources.map(source => generateDIPAnalysis(source))
  );
  
  return analyses;
}

/**
 * Mevcut analizi günceller (yeni veri geldiğinde)
 */
export async function updateDIPAnalysis(
  existingReport: DIPAnalysisReport,
  newData: string
): Promise<DIPAnalysisReport> {
  const context = `
MEVCUT ANALİZ:
Başlık: ${existingReport.authorityTitle}
Confidence: ${existingReport.confidenceBand}%
Market Impact: Bull ${existingReport.marketImpact.bullish}% / Bear ${existingReport.marketImpact.bearish}% / Neutral ${existingReport.marketImpact.neutral}%

YENİ VERİ:
${newData}

Bu yeni veriyi mevcut analize entegre et ve güncellenmiş bir analiz üret.`;

  return generateDIPAnalysis(newData, context);
}

/**
 * Hızlı özet için lightweight versiyonu
 */
export async function generateQuickDIPSummary(newsContent: string): Promise<{
  title: string;
  confidence: number;
  impact: string;
  summary: string;
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Bu haberi analiz et ve kısa bir özet ver:

${newsContent}

JSON formatında yanıt ver:
{
  "title": "SEO uyumlu başlık",
  "confidence": 0-100 arası sayı,
  "impact": "BULLISH/BEARISH/NEUTRAL",
  "summary": "2 cümlelik özet"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Quick Summary: JSON bulunamadı');
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('Quick DIP Summary Error:', error);
    throw error;
  }
}
