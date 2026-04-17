/**
 * SIA VISION INTELLIGENCE - GOOGLE CLOUD VISION SERVICE
 * FEATURES: DOCUMENT OCR | LEAKED IMAGE ANALYSIS | EVIDENCE VERIFICATION
 */

// ⚡ PERFORMANCE: Make Google Cloud dependencies optional for build
let ImageAnnotatorClient: any = null;
try {
  const visionModule = require('@google-cloud/vision');
  ImageAnnotatorClient = visionModule.ImageAnnotatorClient;
} catch (e) {
  console.warn('[SIA_VISION] @google-cloud/vision not installed - vision features disabled');
}

import { getGoogleCloudConfig } from './cloud-provider';
import { sentinel } from '../monitoring';

let visionClient: any | null = null;

/**
 * Initializes the Vision client using central Google Cloud config
 */
function getVisionClient(): any {
  if (!ImageAnnotatorClient) {
    throw new Error('[SIA_VISION] @google-cloud/vision not installed');
  }
  
  if (visionClient) return visionClient;

  const config = getGoogleCloudConfig();
  if (!config) {
    throw new Error('[SIA_VISION] Google Cloud credentials not configured');
  }

  visionClient = new ImageAnnotatorClient({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    projectId: config.projectId,
  });

  return visionClient;
}

export interface AnalysisResult {
  text: string;
  labels: string[];
  isDocument: boolean;
  confidence: number;
}

/**
 * Analyzes an image (buffer or remote URL) for OCR and object detection
 * Critical for verifying "Project Lazarus-X" document leaks
 */
export async function analyzeLeakedEvidence(imageInput: Buffer | string): Promise<AnalysisResult> {
  try {
    const client = getVisionClient();

    // Requesting both Text Detection and Label Detection
    const [result] = await client.annotateImage({
      image: typeof imageInput === 'string' ? { source: { imageUri: imageInput } } : { content: imageInput },
      features: [
        { type: 'TEXT_DETECTION' },
        { type: 'LABEL_DETECTION' },
        { type: 'DOCUMENT_TEXT_DETECTION' }
      ]
    });

    const fullText = result.fullTextAnnotation?.text || '';
    const labels = result.labelAnnotations?.map((label: any) => label.description || '') || [];

    // Logic to determine if it's likely an institutional document
    const isDocument = labels.some((l: string) =>
      ['document', 'paper', 'text', 'signature', 'official'].includes(l.toLowerCase())
    ) || fullText.length > 100;

    sentinel.log('GOOGLE_VISION', 'SUCCESS', `Evidence analyzed. Found ${fullText.length} chars of text.`);

    return {
      text: fullText,
      labels: labels,
      isDocument,
      confidence: result.fullTextAnnotation ? 0.95 : 0.5
    };

  } catch (error: any) {
    sentinel.log('GOOGLE_VISION', 'ERROR', `Analysis failed: ${error.message}`);
    throw error;
  }
}

/**
 * Specifically looks for logos (e.g., State Street, BNY Mellon) in leaked photos
 */
export async function detectInstitutionalLogos(imageInput: Buffer | string) {
  try {
    const client = getVisionClient();
    const [result] = await client.logoDetection(
      typeof imageInput === 'string' ? { source: { imageUri: imageInput } } : { content: imageInput }
    );

    return result.logoAnnotations?.map((logo: any) => logo.description) || [];
  } catch (error: any) {
    sentinel.log('GOOGLE_VISION', 'ERROR', `Logo detection failed: ${error.message}`);
    return [];
  }
}
