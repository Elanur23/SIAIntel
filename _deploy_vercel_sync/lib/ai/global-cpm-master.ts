/**
 * Global CPM Master System
 * Tek haber → 6 dilde premium finans içeriği
 * Her dil için CPM-optimized content
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface LanguageContent {
  language: string;
  languageCode: string;
  flag: string;
  cpm: number;
  region: string;
  
  // SEO Optimized
  seoTitle: string;
  metaDescription: string;
  intelligenceBrief: string;
  cpmKeywords: string[];
  
  // Content
  title: string;
  subtitle: string;
  content: string;
  summary: string;
  
  // Market Context
  marketFocus: string;
  localAngle: string;
  targetAudience: string;
}

export interface GlobalContentPackage {
  originalNews: string;
  timestamp: string;
  languages: LanguageContent[];
  totalCPMPotential: number;
}

const GLOBAL_CPM_MASTER_PROMPT = `Sen Sovereign V14 sisteminin Global Baş Editörüsün. Sana verilen ham haberi veya link içeriğini analiz et ve aşağıdaki 6 stratejik dilde, her birinin yerel reklam (CPM) dinamiklerine göre 'Premium' finans içeriği üret.

STRATEJİK DİL VE TONLAMA KURALLARI:

🇺🇸 ENGLISH (en) - CPM: $220 - Wall Street Style
   - Profesyonel, veri odaklı, kurumsal yatırımcı dili
   - Keyword Focus: Asset Management, Institutional Flow, Alpha Generation
   - Ton: Agresif, data-driven, "insider" havası
   - Piyasa: S&P 500, Nasdaq, Fed politikaları
   - Hedef: Hedge fund managers, institutional investors, wealth advisors

🇦🇪 ARABIC (ar) - CPM: $440 (PREMIUM) - Royal & Wealth Style
   - Lüks, büyük yatırımlar ve devlet varlık fonları dili
   - Keyword Focus: Sovereign Wealth, Oil-to-Tech, Mega Projects
   - Ton: Exclusive, royal, "petro-dollar" gücü
   - Piyasa: Petrol, altın, kripto, Dubai/Abu Dhabi
   - Hedef: Sovereign wealth funds, royal families, UHNWI
   - Özel: صناديق سيادية، استثمارات استراتيجية، مشاريع ضخمة

🇩🇪 DEUTSCH (de) - CPM: $180 - Industrial Logic
   - Verimlilik, teknoloji entegrasyonu ve makro-ekonomi dili
   - Keyword Focus: Industry 4.0, Supply Chain, ECB
   - Ton: Teknik, mühendislik hassasiyeti, "Ordnung"
   - Piyasa: DAX, Euro Stoxx 50, ECB kararları
   - Hedef: Mittelstand CFOs, DAX investors, industrial strategists

🇪🇸 ESPAÑOL (es) - CPM: $170 - FinTech Momentum
   - Modern finans, dijital bankacılık ve hızlı piyasa dili
   - Keyword Focus: Neobanks, Crypto Adoption, Digital Finance
   - Ton: Dinamik, emerging market odaklı, tech-savvy
   - Piyasa: IBEX 35, Latin Amerika, fintech
   - Hedef: FinTech investors, LatAm traders, digital banking pros

🇫🇷 FRANÇAIS (fr) - CPM: $190 - Sovereign Strategy
   - AB regülasyonları, devlet destekli AI ve stratejik yatırımlar dili
   - Keyword Focus: Regulatory Framework, AI Sovereignty, Strategic Assets
   - Ton: Sofistike, makro-stratejik, "haute finance"
   - Piyasa: CAC 40, Euro bölgesi, French champions
   - Hedef: Policy makers, CAC 40 traders, sovereign strategists

🇹🇷 TÜRKÇE (tr) - CPM: $150 - Market Pulse
   - Pratik, hızlı, yerel borsa ve küresel korelasyon dili
   - Keyword Focus: Portföy, Faiz, Dolar Endeksi
   - Ton: Hızlı, volatilite odaklı, "fırsat avcısı"
   - Piyasa: BIST 100, USD/TRY, altın, tahvil
   - Hedef: Retail traders, FX traders, portfolio managers

HER DİL İÇİN ÇIKTI FORMATI (JSON):

{
  "language": "English",
  "languageCode": "en",
  "flag": "🇺🇸",
  "cpm": 220,
  "region": "US",
  
  "seoTitle": "Yüksek CTR, merak uyandıran ama ciddi başlık (55-60 karakter)",
  "metaDescription": "Google botları için finansal keywords ile 155 karakter",
  "intelligenceBrief": "Makalenin ilk paragrafı - İstihbarat tonu, okuyucuyu yakalayan",
  "cpmKeywords": ["o dile özel 5 premium keyword"],
  
  "title": "Ana başlık",
  "subtitle": "Alt başlık",
  "content": "800-1000 kelimelik detaylı analiz",
  "summary": "Kısa özet",
  
  "marketFocus": "Yerel piyasa odağı",
  "localAngle": "O bölgenin para babasının ilgilendiği açı",
  "targetAudience": "Hedef kitle"
}

KRİTİK EMİRLER:
1. ASLA doğrudan çeviri yapma! Her dili o bölgenin finansal kültürüne göre RE-CONTEXTUALIZE et.
2. Haberi o bölgenin para babası neyi okumak istiyorsa ona göre yeniden yaz.
3. Yerel piyasa referansları MUTLAKA olmalı (DAX, CAC 40, BIST 100, vb.)
4. CPM yüksek olan dillerde (Arabic, English) daha "exclusive" ve "insider" ton kullan.
5. Her dilin kendi finansal jargonunu kullan - İngilizce terimler değil!

ÖNEMLI: Tüm 6 dil için JSON array dön:
{
  "languages": [...]
}`;

/**
 * Tek haber için 6 dilde içerik üretir
 */
export async function generateGlobalContent(newsContent: string): Promise<GlobalContentPackage> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-pro-002',
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
      }
    });

    const prompt = `
HAM HABER İÇERİĞİ:
${newsContent}

Bu haberi yukarıdaki 6 dil için premium finans içeriğine dönüştür.`;

    const result = await model.generateContent([
      GLOBAL_CPM_MASTER_PROMPT,
      prompt
    ]);

    const response = result.response.text();
    
    // JSON parse et
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Global CPM Master: JSON bulunamadı');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // CPM toplamını hesapla
    const totalCPM = parsed.languages.reduce((sum: number, lang: LanguageContent) => 
      sum + lang.cpm, 0
    );

    const contentPackage: GlobalContentPackage = {
      originalNews: newsContent,
      timestamp: new Date().toISOString(),
      languages: parsed.languages,
      totalCPMPotential: totalCPM
    };

    console.log(`Global Content generated: ${contentPackage.languages.length} languages, Total CPM: $${totalCPM}`);

    return contentPackage;

  } catch (error) {
    console.error('Global CPM Master Error:', error);
    throw error;
  }
}

/**
 * Tek bir dil için içerik üretir (hızlı)
 */
export async function generateSingleLanguageContent(
  newsContent: string,
  languageCode: string
): Promise<LanguageContent> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const languageConfig: Record<string, { name: string; cpm: number; focus: string }> = {
      en: { name: 'English', cpm: 220, focus: 'Wall Street, S&P 500, Fed' },
      ar: { name: 'Arabic', cpm: 440, focus: 'Oil, Gold, Dubai markets' },
      de: { name: 'Deutsch', cpm: 180, focus: 'DAX, Euro Stoxx 50, ECB' },
      fr: { name: 'Français', cpm: 190, focus: 'CAC 40, Euro zone' },
      es: { name: 'Español', cpm: 170, focus: 'IBEX 35, LatAm' },
      ru: { name: 'Russian', cpm: 120, focus: 'MOEX, Central Bank, commodities' },
      jp: { name: 'Japanese', cpm: 200, focus: 'Nikkei, BOJ, Asian markets' },
      zh: { name: 'Chinese', cpm: 180, focus: 'A-shares, PBoC, Hong Kong' },
      tr: { name: 'Türkçe', cpm: 150, focus: 'BIST 100, USD/TRY' },
    };

    const effectiveCode = languageCode === 'ae' ? 'ar' : languageCode;
    const config = languageConfig[effectiveCode] || languageConfig.en;

    const prompt = `Bu haberi ${config.name} dilinde, ${config.focus} odaklı premium finans içeriğine dönüştür:

${newsContent}

JSON formatında yanıt ver (title, content, summary, keywords).`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Single Language: JSON bulunamadı');
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      language: config.name,
      languageCode: effectiveCode,
      flag: getFlagForLanguage(effectiveCode),
      cpm: config.cpm,
      region: getRegionForLanguage(effectiveCode),
      ...parsed
    };

  } catch (error) {
    console.error('Single Language Content Error:', error);
    throw error;
  }
}

/**
 * Helper functions
 */
function getFlagForLanguage(code: string): string {
  const flags: Record<string, string> = {
    en: '🇺🇸', ar: '🇦🇪', de: '🇩🇪', fr: '🇫🇷', es: '🇪🇸', ru: '🇷🇺', jp: '🇯🇵', zh: '🇨🇳', tr: '🇹🇷',
    ae: '🇦🇪'
  };
  return flags[code] || flags[code === 'ae' ? 'ar' : code] || '🌍';
}

function getRegionForLanguage(code: string): string {
  const regions: Record<string, string> = {
    en: 'US', ar: 'UAE', de: 'Germany', fr: 'France', es: 'Spain', ru: 'Russia', jp: 'Japan', zh: 'China', tr: 'Turkey',
    ae: 'UAE'
  };
  return regions[code] || regions[code === 'ae' ? 'ar' : code] || 'Global';
}

/**
 * CPM analizi yapar
 */
export function analyzeCPMPotential(contentPackage: GlobalContentPackage): {
  highestCPM: LanguageContent;
  lowestCPM: LanguageContent;
  averageCPM: number;
  premiumLanguages: LanguageContent[];
  recommendations: string[];
} {
  const sorted = [...contentPackage.languages].sort((a, b) => b.cpm - a.cpm);
  
  const highestCPM = sorted[0];
  const lowestCPM = sorted[sorted.length - 1];
  const averageCPM = contentPackage.totalCPMPotential / contentPackage.languages.length;
  const premiumLanguages = sorted.filter(lang => lang.cpm >= 200);

  const recommendations: string[] = [];
  
  if (premiumLanguages.length > 0) {
    recommendations.push(`Focus on ${premiumLanguages.length} premium languages (CPM ≥ $200)`);
  }
  
  if (highestCPM.cpm > averageCPM * 2) {
    recommendations.push(`${highestCPM.language} has exceptional CPM - prioritize this market`);
  }
  
  recommendations.push(`Total revenue potential: $${contentPackage.totalCPMPotential} per 1000 impressions`);

  return {
    highestCPM,
    lowestCPM,
    averageCPM,
    premiumLanguages,
    recommendations
  };
}
