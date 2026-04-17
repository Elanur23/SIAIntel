/**
 * SIA SENTIMENT INTELLIGENCE - GOOGLE CLOUD NATURAL LANGUAGE SERVICE
 * FEATURES: MARKET SENTIMENT SCORING | ENTITY EXTRACTION | TONE ANALYSIS
 */

// ⚡ PERFORMANCE: Make Google Cloud dependencies optional for build
let LanguageServiceClient: any = null;
try {
  const languageModule = require('@google-cloud/language');
  LanguageServiceClient = languageModule.LanguageServiceClient;
} catch (e) {
  console.warn('[SIA_SENTIMENT] @google-cloud/language not installed - sentiment features disabled');
}

import { getGoogleCloudConfig } from './cloud-provider';
import { sentinel } from '../monitoring';

let languageClient: any | null = null;

/**
 * Initializes the Language client using central Google Cloud config
 */
function getLanguageClient(): any {
  if (!LanguageServiceClient) {
    throw new Error('[SIA_SENTIMENT] @google-cloud/language not installed');
  }
  
  if (languageClient) return languageClient;

  const config = getGoogleCloudConfig();
  if (!config) {
    throw new Error('[SIA_SENTIMENT] Google Cloud credentials not configured');
  }

  languageClient = new LanguageServiceClient({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    projectId: config.projectId,
  });

  return languageClient;
}

export interface MarketPulse {
  score: number; // -1.0 to 1.0 (Sentiment)
  magnitude: number; // Strength of the sentiment
  entities: string[]; // Organizations, Persons, Assets detected
  language: string;
}

/**
 * Analyzes news text or leak content for "Market Impact" sentiment
 * Helps fill the 'sentiment' and 'marketImpact' fields in ai_workspace.json
 */
export async function analyzeMarketPulse(content: string): Promise<MarketPulse> {
  try {
    const client = getLanguageClient();

    // Perform Sentiment Analysis
    const [sentimentResult] = await client.analyzeSentiment({
      document: { content, type: 'PLAIN_TEXT' }
    });

    // Perform Entity Analysis (To find assets like BTC, Dollar, Banks)
    const [entitiesResult] = await client.analyzeEntities({
      document: { content, type: 'PLAIN_TEXT' }
    });

    const score = sentimentResult.documentSentiment?.score || 0;
    const magnitude = sentimentResult.documentSentiment?.magnitude || 0;
    const entities = entitiesResult.entities?.map((e: any) => e.name || '') || [];

    sentinel.log('GOOGLE_SENTIMENT', 'SUCCESS',
      `Market pulse analyzed: Score ${score.toFixed(2)} | Magnitude: ${magnitude.toFixed(1)}`);

    return {
      score,
      magnitude,
      entities: entities.slice(0, 10), // Top 10 entities
      language: sentimentResult.language || 'en'
    };

  } catch (error: any) {
    sentinel.log('GOOGLE_SENTIMENT', 'ERROR', `Pulse analysis failed: ${error.message}`);
    throw error;
  }
}

/**
 * Checks if the news content matches "Institutional Grade" tone
 * Analyzes the syntax and complexity of the writing
 */
export async function auditInstitutionalTone(content: string): Promise<boolean> {
  try {
    const client = getLanguageClient();
    const [result] = await client.analyzeSyntax({
      document: { content, type: 'PLAIN_TEXT' }
    });

    // Logic to check for "complex sentences" or "passive voice" (Institutional style)
    // Simplified for now: check if it has enough tokens and a formal structure
    return (result.tokens?.length || 0) > 100;

  } catch (error: any) {
    sentinel.log('GOOGLE_SENTIMENT', 'ERROR', `Tone audit failed: ${error.message}`);
    return false;
  }
}
