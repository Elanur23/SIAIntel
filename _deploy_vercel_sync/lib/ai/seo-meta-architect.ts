/**
 * SEO & Meta Architect System
 * DIP Analysis raporlarını Google için optimize eder
 * Gemini 1.5 Flash ile hızlı SEO optimizasyonu
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { DIPAnalysisReport } from './deep-intelligence-pro';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface SEOMetadata {
  // Meta Tags
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  
  // Open Graph
  ogTitle: string;
  ogDescription: string;
  ogType: string;
  
  // Twitter Card
  twitterTitle: string;
  twitterDescription: string;
  twitterCard: string;
  
  // JSON-LD Schema
  jsonLdSchema: {
    '@context': string;
    '@type': string;
    headline: string;
    description: string;
    datePublished: string;
    author: {
      '@type': string;
      name: string;
    };
    publisher: {
      '@type': string;
      name: string;
      logo: {
        '@type': string;
        url: string;
      };
    };
    mainEntityOfPage: {
      '@type': string;
      '@id': string;
    };
    keywords: string[];
  };
  
  // Image Alt Texts
  imageAltTexts: {
    hero: string;
    chart: string;
    thumbnail: string;
  };
  
  // H2 Headlines for Google Discover
  discoverHeadlines: string[];
  
  // Canonical URL
  canonicalUrl: string;
}

const SEO_ARCHITECT_PROMPT = `Sovereign V14 için hazırlanan bu analizi Google botları için 'Otorite İçerik' olarak optimize et.

Görevlerin:

1. Meta Description: Finansal anahtar kelimeleri (Institutional, Volatility, Liquidity, Alpha, Beta, Gamma, Hedge, Arbitrage, Correlation, Momentum) doğal bir şekilde içeren 150-160 karakter arası bir meta description yaz.

2. JSON-LD Schema: 'FinancialNewsArticle' schema yapısına uygun tag'leri belirle.

3. Alt Text: Görseller için SEO uyumlu, finansal terimler içeren alt text önerileri sun.

4. Google Discover Headlines: Bu içeriğin 'Google Discover'da öne çıkması için en çarpıcı 2 adet 'H2' alt başlığı oluştur. Başlıklar:
   - Sayısal veri içermeli (%, $, rakamlar)
   - Aciliyet hissi vermeli
   - Finansal otorite dili kullanmalı
   - 60-70 karakter arası olmalı

5. Keywords: 10-15 adet finansal anahtar kelime belirle (long-tail keywords dahil).

Tonlama: SEO uyumlu, finansal otorite, kurumsal dil.

ÖNEMLI: Yanıtını JSON formatında ver:
{
  "metaTitle": "string (55-60 karakter)",
  "metaDescription": "string (150-160 karakter)",
  "keywords": ["string"],
  "ogTitle": "string",
  "ogDescription": "string",
  "twitterTitle": "string",
  "twitterDescription": "string",
  "imageAltTexts": {
    "hero": "string",
    "chart": "string",
    "thumbnail": "string"
  },
  "discoverHeadlines": ["string", "string"],
  "canonicalUrl": "string"
}`;

/**
 * DIP Analysis raporunu SEO için optimize eder
 */
export async function generateSEOMetadata(
  report: DIPAnalysisReport,
  baseUrl: string = 'https://sia-terminal.com'
): Promise<SEOMetadata> {
  try {
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.4,
        topP: 0.9,
      }
    });

    const contentPrompt = `
ANALİZ RAPORU:
Başlık: ${report.authorityTitle}
Özet: ${report.executiveSummary}
Confidence: ${report.confidenceBand}%
Market Impact: Bull ${report.marketImpact.bullish}% / Bear ${report.marketImpact.bearish}% / Neutral ${report.marketImpact.neutral}%
Risk Level: ${report.riskLevel}
Key Takeaways: ${report.keyTakeaways.join(', ')}

Bu rapor için SEO metadata oluştur.`;

    const result = await model.generateContent([
      SEO_ARCHITECT_PROMPT,
      contentPrompt
    ]);

    const response = result.response.text();
    
    // JSON parse et
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('SEO Architect: JSON bulunamadı');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Slug oluştur
    const slug = report.authorityTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // JSON-LD Schema oluştur
    const jsonLdSchema = {
      '@context': 'https://schema.org',
      '@type': 'FinancialNewsArticle',
      headline: parsed.metaTitle,
      description: parsed.metaDescription,
      datePublished: report.timestamp,
      author: {
        '@type': 'Organization',
        name: 'Sovereign Intelligence Architecture'
      },
      publisher: {
        '@type': 'Organization',
        name: 'SIA Terminal',
        logo: {
          '@type': 'ImageObject',
          url: `${baseUrl}/logo.png`
        }
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': `${baseUrl}/intelligence/${slug}`
      },
      keywords: parsed.keywords
    };

    const metadata: SEOMetadata = {
      metaTitle: parsed.metaTitle,
      metaDescription: parsed.metaDescription,
      keywords: parsed.keywords,
      ogTitle: parsed.ogTitle || parsed.metaTitle,
      ogDescription: parsed.ogDescription || parsed.metaDescription,
      ogType: 'article',
      twitterTitle: parsed.twitterTitle || parsed.metaTitle,
      twitterDescription: parsed.twitterDescription || parsed.metaDescription,
      twitterCard: 'summary_large_image',
      jsonLdSchema,
      imageAltTexts: parsed.imageAltTexts,
      discoverHeadlines: parsed.discoverHeadlines,
      canonicalUrl: parsed.canonicalUrl || `${baseUrl}/intelligence/${slug}`
    };

    console.log(`SEO Metadata generated for: ${report.authorityTitle}`);

    return metadata;

  } catch (error) {
    console.error('SEO Architect Error:', error);
    throw error;
  }
}

/**
 * Hızlı meta description oluşturur
 */
export async function generateQuickMetaDescription(content: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Bu içerik için 150-160 karakter arası, finansal anahtar kelimeler içeren bir meta description yaz:

${content}

Sadece meta description'ı yaz, başka bir şey yazma.`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();

  } catch (error) {
    console.error('Quick Meta Description Error:', error);
    throw error;
  }
}

/**
 * Toplu keyword analizi yapar
 */
export async function analyzeKeywords(content: string): Promise<{
  primary: string[];
  secondary: string[];
  longTail: string[];
  searchVolume: 'HIGH' | 'MEDIUM' | 'LOW';
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Bu içerikten finansal anahtar kelimeleri çıkar ve kategorize et:

${content}

JSON formatında yanıt ver:
{
  "primary": ["ana anahtar kelimeler"],
  "secondary": ["ikincil anahtar kelimeler"],
  "longTail": ["uzun kuyruk anahtar kelimeler"],
  "searchVolume": "HIGH|MEDIUM|LOW"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Keyword Analysis: JSON bulunamadı');
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('Keyword Analysis Error:', error);
    throw error;
  }
}

/**
 * Rakip analizi yapar
 */
export async function analyzeCompetitors(
  topic: string,
  competitors: string[]
): Promise<{
  gaps: string[];
  opportunities: string[];
  recommendations: string[];
}> {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `Konu: ${topic}

Rakipler: ${competitors.join(', ')}

Bu konuda rakiplerin eksik bıraktığı noktaları (content gaps) ve SEO fırsatlarını belirle.

JSON formatında yanıt ver:
{
  "gaps": ["içerik boşlukları"],
  "opportunities": ["SEO fırsatları"],
  "recommendations": ["öneriler"]
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Competitor Analysis: JSON bulunamadı');
    }

    return JSON.parse(jsonMatch[0]);

  } catch (error) {
    console.error('Competitor Analysis Error:', error);
    throw error;
  }
}

/**
 * SEO score hesaplar
 */
export function calculateSEOScore(metadata: SEOMetadata): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Meta Title kontrolü
  if (metadata.metaTitle.length < 50 || metadata.metaTitle.length > 60) {
    score -= 10;
    issues.push('Meta title uzunluğu optimal değil (50-60 karakter olmalı)');
  }

  // Meta Description kontrolü
  if (metadata.metaDescription.length < 150 || metadata.metaDescription.length > 160) {
    score -= 10;
    issues.push('Meta description uzunluğu optimal değil (150-160 karakter olmalı)');
  }

  // Keywords kontrolü
  if (metadata.keywords.length < 5) {
    score -= 15;
    issues.push('Yeterli anahtar kelime yok (en az 5 olmalı)');
    recommendations.push('Daha fazla finansal anahtar kelime ekleyin');
  }

  // Alt text kontrolü
  if (!metadata.imageAltTexts.hero || !metadata.imageAltTexts.chart) {
    score -= 10;
    issues.push('Tüm görseller için alt text eksik');
    recommendations.push('Her görsel için açıklayıcı alt text ekleyin');
  }

  // Discover headlines kontrolü
  if (metadata.discoverHeadlines.length < 2) {
    score -= 10;
    issues.push('Google Discover için yeterli headline yok');
    recommendations.push('En az 2 çarpıcı H2 başlığı ekleyin');
  }

  // JSON-LD kontrolü
  if (!metadata.jsonLdSchema.keywords || metadata.jsonLdSchema.keywords.length === 0) {
    score -= 15;
    issues.push('JSON-LD schema\'da keywords eksik');
  }

  if (score >= 90) {
    recommendations.push('SEO optimizasyonu mükemmel!');
  } else if (score >= 70) {
    recommendations.push('İyi bir SEO skoru, küçük iyileştirmeler yapılabilir');
  } else {
    recommendations.push('SEO optimizasyonu ciddi iyileştirme gerektiriyor');
  }

  return { score, issues, recommendations };
}
