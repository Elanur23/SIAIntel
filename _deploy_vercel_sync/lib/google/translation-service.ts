/**
 * SIA UNIVERSAL DECODER - GOOGLE CLOUD TRANSLATE SERVICE
 * FEATURES: AUTO-DETECTION | 100+ LANGUAGES | PROJECT NODE PARITY (9 LANGS)
 */

import { getGoogleCloudConfig } from './cloud-provider';
import { sentinel } from '../monitoring';

// ⚡ BUILD FIX: Make @google-cloud/translate optional
let TranslationServiceClient: any;
try {
  const translateModule = require('@google-cloud/translate');
  TranslationServiceClient = translateModule.TranslationServiceClient;
} catch (error) {
  console.warn('[SIA_TRANSLATE] @google-cloud/translate not installed - translation features disabled');
}

let translateClient: any | null = null;

/**
 * Initializes the Translate client using central Google Cloud config
 */
function getTranslateClient(): any {
  if (!TranslationServiceClient) {
    throw new Error('[SIA_TRANSLATE] @google-cloud/translate not installed');
  }

  if (translateClient) return translateClient;

  const config = getGoogleCloudConfig();
  if (!config) {
    throw new Error('[SIA_TRANSLATE] Google Cloud credentials not configured');
  }

  translateClient = new TranslationServiceClient({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    projectId: config.projectId,
  });

  return translateClient;
}

/**
 * Translates intelligence content to all 9 project languages automatically
 */
export async function translateIntelligence(
  text: string,
  targetLanguages: string[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'ja', 'zh']
): Promise<Record<string, string>> {
  try {
    const client = getTranslateClient();
    const config = getGoogleCloudConfig();
    const results: Record<string, string> = {};

    sentinel.log('GOOGLE_TRANSLATE', 'INFO', `Translating content into ${targetLanguages.length} nodes...`);

    const request = {
      parent: `projects/${config?.projectId}/locations/global`,
      contents: [text],
      mimeType: 'text/plain',
      targetLanguageCode: '',
    };

    // Parallel processing for all language nodes
    await Promise.all(
      targetLanguages.map(async (lang) => {
        const [response] = await client.translateText({
          ...request,
          targetLanguageCode: lang === 'zh' ? 'zh-CN' : lang === 'ja' ? 'ja' : lang,
        });
        results[lang] = response.translations?.[0]?.translatedText || '';
      })
    );

    sentinel.log('GOOGLE_TRANSLATE', 'SUCCESS', 'Intelligence translated successfully for all nodes.');
    return results;

  } catch (error: any) {
    sentinel.log('GOOGLE_TRANSLATE', 'ERROR', `Translation failed: ${error.message}`);
    throw error;
  }
}

/**
 * Detects the language of a leaked document or snippet
 */
export async function detectLanguage(text: string): Promise<string> {
  try {
    const client = getTranslateClient();
    const config = getGoogleCloudConfig();

    const [response] = await client.detectLanguage({
      parent: `projects/${config?.projectId}/locations/global`,
      content: text,
      mimeType: 'text/plain',
    });

    const lang = response.languages?.[0]?.languageCode || 'und';
    sentinel.log('GOOGLE_TRANSLATE', 'SUCCESS', `Language detected: ${lang}`);
    return lang;

  } catch (error: any) {
    sentinel.log('GOOGLE_TRANSLATE', 'ERROR', `Detection failed: ${error.message}`);
    return 'en'; // Default to EN on failure
  }
}
