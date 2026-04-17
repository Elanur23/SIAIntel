/**
 * SIA SOVEREIGN CORE - AUTONOMOUS NEWS PROCESSOR v1.0
 * FEATURES: UNIFIED GOOGLE STACK INTEGRATION | AI-DRIVEN NEWS HUB
 */

import { notifyGoogleIndexing } from '../google/indexing-service';
import { synthesizeSpeech } from '../google/tts-service';
import { analyzeMarketPulse } from '../google/sentiment-service';
import { analyzeLeakedEvidence } from '../google/vision-service';
import { factCheckIntelligence } from '../google/truth-engine';
import { translateIntelligence, detectLanguage } from '../google/translation-service';
import { sentinel } from '../monitoring';

export interface NewsArticle {
  id: string;
  title: string;
  content: string;
  language: string;
  imageUrl?: string;
  evidenceUrl?: string; // Optional image of a leak document
}

export interface ProcessedNewsResult {
  success: boolean;
  marketPulse: { score: number; magnitude: number; sentiment: string };
  audioBriefBase64?: string;
  indexingStatus: string;
  evidenceAnalysis?: string;
  truthAnalysis?: { truthScore: number; verdict: string; summary: string };
  translations?: Record<string, string>;
  detectedLanguage?: string;
  credibilityScore: number; // 0-100 aggregated score
  timestamp: string;
}

/**
 * The Central Command: Processes a new intelligence leak through the entire Google stack.
 * Used for "Project Lazarus-X" and similar institutional grade reports.
 */
export async function processIntelligenceLeak(article: NewsArticle): Promise<ProcessedNewsResult> {
  const timestamp = new Date().toISOString();
  sentinel.log('CORE_PROCESSOR', 'INFO', `Processing Leak ID: ${article.id} - "${article.title}"`);

  try {
    // 0.0 PHASE: UNIVERSAL DECODER (Detection & Translation)
    const detectedLang = await detectLanguage(article.content);
    const translations = await translateIntelligence(article.content);

    // 0.1 PHASE: TRUTH ENGINE (Fact-Checking Grounding)
    const truth = await factCheckIntelligence(article.content);

    // 1. PHASE: MARKET PULSE (Sentiment Analysis)
    const pulse = await analyzeMarketPulse(article.content);
    const sentiment = pulse.score > 0.25 ? 'BULLISH' : pulse.score < -0.25 ? 'BEARISH' : 'VOLATILE';

    // 2. PHASE: AUDIO BRIEFING (TTS)
    // Create a 200-character summary for the TTS intro
    const ttsIntro = `SIA Intelligence Briefing for ${article.title}. Market sentiment is currently ${sentiment}. Analyzing now.`;
    const audioBrief = await synthesizeSpeech({
      text: ttsIntro + article.content.substring(0, 1000), // Max content length for clear audio
      languageCode: article.language === 'tr' ? 'tr-TR' : 'en-US',
      gender: 'MALE' // Professional voice
    });

    // 3. PHASE: EVIDENCE ANALYSIS (Vision) - Optional
    let evidenceResult = 'No evidence document provided.';
    let visionConfidence = 0;
    if (article.evidenceUrl) {
      const visionData = await analyzeLeakedEvidence(article.evidenceUrl);
      visionConfidence = visionData.confidence * 100;
      evidenceResult = `Evidence analyzed: ${visionData.text.substring(0, 100)}... Is Document: ${visionData.isDocument}`;
    }

    // 4. PHASE: CREDIBILITY AGGREGATION (Panda 4 Logic)
    // Combining Truth Score (60%) and Vision Confidence (40%)
    const credibilityScore = Math.round(
      (truth.truthScore * 0.6) + (visionConfidence > 0 ? visionConfidence * 0.4 : 30 * 0.4)
    );

    // 5. PHASE: GOOGLE INDEXING (SEO Acceleration)
    const siteUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/${article.language}/news/${article.id}`;
    const indexing = await notifyGoogleIndexing(siteUrl);

    // 6. PHASE: DISCOVER IMAGE OPTIMIZATION (Metadata for Googlebot)
    // Ensures image is forced to high-res via URL parameters if it's from Unsplash/Placeholder
    let optimizedImageUrl = article.imageUrl || 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1600';
    if (optimizedImageUrl.includes('unsplash.com')) {
      optimizedImageUrl = optimizedImageUrl.split('?')[0] + '?q=80&w=1600&auto=format&fit=crop';
    }

    sentinel.log('CORE_PROCESSOR', 'SUCCESS', `Full processing complete for: ${article.title}`);

    return {
      success: true,
      marketPulse: {
        score: pulse.score,
        magnitude: pulse.magnitude,
        sentiment: sentiment
      },
      audioBriefBase64: audioBrief,
      indexingStatus: indexing.message,
      evidenceAnalysis: evidenceResult,
      truthAnalysis: {
        truthScore: truth.truthScore,
        verdict: truth.verdict,
        summary: truth.summary
      },
      translations,
      detectedLanguage: detectedLang,
      credibilityScore,
      optimizedImageUrl, // Discover-Ready image URL
      timestamp
    };

  } catch (error: any) {
    sentinel.log('CORE_PROCESSOR', 'ERROR', `Processing failed: ${error.message}`);
    return {
      success: false,
      marketPulse: { score: 0, magnitude: 0, sentiment: 'UNCERTAIN' },
      indexingStatus: 'FAILED',
      credibilityScore: 0,
      timestamp
    };
  }
}
