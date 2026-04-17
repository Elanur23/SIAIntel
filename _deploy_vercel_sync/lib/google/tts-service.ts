/**
 * SIA VOICE INTELLIGENCE - GOOGLE CLOUD TEXT-TO-SPEECH SERVICE
 * FEATURES: MULTI-LANGUAGE SUPPORT | WAVENET HIGH-FIDELITY VOICES | SSML ENHANCEMENT
 */

// ⚡ PERFORMANCE: Make Google Cloud dependencies optional for build
let TextToSpeechClient: any = null;
try {
  const ttsModule = require('@google-cloud/text-to-speech');
  TextToSpeechClient = ttsModule.TextToSpeechClient;
} catch (e) {
  console.warn('[SIA_TTS] @google-cloud/text-to-speech not installed - TTS features disabled');
}

import { getGoogleCloudConfig } from './cloud-provider';
import { sentinel } from '../monitoring';

let ttsClient: any | null = null;

/**
 * Initializes the TTS client using central Google Cloud config
 */
function getTTSClient(): any {
  if (!TextToSpeechClient) {
    throw new Error('[SIA_TTS] @google-cloud/text-to-speech not installed');
  }
  
  if (ttsClient) return ttsClient;

  const config = getGoogleCloudConfig();
  if (!config) {
    throw new Error('[SIA_TTS] Google Cloud credentials not configured in .env');
  }

  ttsClient = new TextToSpeechClient({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    projectId: config.projectId,
  });

  return ttsClient;
}

export interface TTSRequest {
  text: string;
  languageCode: string;
  ssml?: boolean;
  gender?: 'MALE' | 'FEMALE' | 'NEUTRAL';
}

/**
 * Synthesizes speech from text and returns base64 audio data
 * Perfect for "Leaked Audio" simulations in SIA Terminal
 */
export async function synthesizeSpeech({
  text,
  languageCode = 'en-US',
  ssml = false,
  gender = 'NEUTRAL',
}: TTSRequest): Promise<string> {
  try {
    const client = getTTSClient();

    const request: any = {
      input: ssml ? { ssml: text } : { text: text },
      voice: {
        languageCode: languageCode,
        // Use WaveNet voices for institutional-grade quality
        ssmlGender: gender,
      },
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: 0,
        speakingRate: 1.0,
      },
    };

    const [response] = await client.synthesizeSpeech(request);

    if (!response.audioContent) {
      throw new Error('No audio content received from Google TTS');
    }

    sentinel.log('GOOGLE_TTS', 'SUCCESS', `Speech synthesized for lang: ${languageCode}`);

    // Return as base64 string for easy frontend playback
    return (response.audioContent as Buffer).toString('base64');

  } catch (error: any) {
    sentinel.log('GOOGLE_TTS', 'ERROR', `Synthesis failed: ${error.message}`);
    throw error;
  }
}

/**
 * List available high-quality voices for a specific language
 */
export async function listVoices(languageCode: string = 'en-US') {
  try {
    const client = getTTSClient();
    const [response] = await client.listVoices({ languageCode });
    return response.voices;
  } catch (error: any) {
    sentinel.log('GOOGLE_TTS', 'ERROR', `Failed to list voices: ${error.message}`);
    return [];
  }
}
