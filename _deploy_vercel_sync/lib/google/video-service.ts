/**
 * SIA VIDEO INTELLIGENCE - GOOGLE CLOUD VIDEO INTELLIGENCE SERVICE
 * FEATURES: LABEL DETECTION | LOGO RECOGNITION | SPEECH TRANSCRIPTION | EXPLICIT CONTENT DETECTION
 */

// ⚡ PERFORMANCE: Make Google Cloud dependencies optional for build
let VideoIntelligenceServiceClient: any = null;
try {
  const videoModule = require('@google-cloud/video-intelligence');
  VideoIntelligenceServiceClient = videoModule.VideoIntelligenceServiceClient;
} catch (e) {
  console.warn('[SIA_VIDEO] @google-cloud/video-intelligence not installed - video features disabled');
}

import { getGoogleCloudConfig } from './cloud-provider';
import { sentinel } from '../monitoring';

let videoClient: any | null = null;

/**
 * Initializes the Video Intelligence client using central Google Cloud config
 */
function getVideoClient(): any {
  if (!VideoIntelligenceServiceClient) {
    throw new Error('[SIA_VIDEO] @google-cloud/video-intelligence not installed');
  }
  
  if (videoClient) return videoClient;

  const config = getGoogleCloudConfig();
  if (!config) {
    throw new Error('[SIA_VIDEO] Google Cloud credentials not configured');
  }

  videoClient = new VideoIntelligenceServiceClient({
    credentials: {
      client_email: config.clientEmail,
      private_key: config.privateKey,
    },
    projectId: config.projectId,
  });

  return videoClient;
}

export interface VideoAnalysisResult {
  labels: string[];
  logos: string[];
  transcription: string;
  explicitContent: boolean;
}

/**
 * Analyzes a video (GCS URI or base64) for intelligence gathering
 * Perfect for verifying "Project Lazarus-X" leaked meeting footage
 */
export async function analyzeLeakedVideo(input: string, isGcsUri: boolean = false): Promise<VideoAnalysisResult> {
  try {
    const client = getVideoClient();

    const request = {
      inputUri: isGcsUri ? input : undefined,
      inputContent: !isGcsUri ? input : undefined,
      features: [
        'LABEL_DETECTION',
        'LOGO_RECOGNITION',
        'SPEECH_TRANSCRIPTION',
        'EXPLICIT_CONTENT_DETECTION'
      ],
      videoContext: {
        speechTranscriptionConfig: {
          languageCode: 'en-US',
          enableAutomaticPunctuation: true,
        },
      },
    };

    // Operation is asynchronous and can take time
    const [operation] = await client.annotateVideo(request as any);
    sentinel.log('GOOGLE_VIDEO', 'INFO', 'Video analysis started. Waiting for operation...');

    const [operationResult] = await operation.promise();
    const annotations = operationResult.annotationResults?.[0];

    const labels = annotations?.segmentLabelAnnotations?.map((l: any) => l.entity?.description || '') || [];
    const logos = annotations?.logoRecognitionAnnotations?.map((l: any) => l.entity?.description || '') || [];

    const transcription = annotations?.speechTranscriptions?.map((t: any) =>
      t.alternatives?.[0]?.transcript || ''
    ).join(' ') || '';

    const explicitContent = !!annotations?.explicitAnnotation?.frames?.some((f: any) =>
      f.pornographyLikelihood && ['LIKELY', 'VERY_LIKELY'].includes(f.pornographyLikelihood as string)
    );

    sentinel.log('GOOGLE_VIDEO', 'SUCCESS', `Video analysis complete. Found ${labels.length} labels and ${logos.length} logos.`);

    return {
      labels,
      logos,
      transcription,
      explicitContent
    };

  } catch (error: any) {
    sentinel.log('GOOGLE_VIDEO', 'ERROR', `Video analysis failed: ${error.message}`);
    throw error;
  }
}
