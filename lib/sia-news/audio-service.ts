/**
 * SIA Audio Service
 * 
 * Handles text-to-speech generation using Google Cloud TTS API
 * Converts SSML to MP3 audio files
 */

import type { Language } from './types'
import { GOOGLE_VOICE_NAMES } from './ssml-generator'

// ============================================================================
// TYPES
// ============================================================================

export interface AudioGenerationRequest {
  ssml: string
  language: Language
  speakingRate?: number
  pitch?: number
  volumeGainDb?: number
}

export interface AudioGenerationResponse {
  audioUrl: string
  audioContent?: string // Base64 encoded audio
  duration: number
  format: 'mp3' | 'ogg' | 'wav'
  size: number // bytes
}

export interface AudioMetadata {
  articleId: string
  language: Language
  voiceName: string
  duration: number
  format: string
  size: number
  generatedAt: string
  url: string
}

// ============================================================================
// VOICE NAME MAPPING
// ============================================================================

export { GOOGLE_VOICE_NAMES }

/**
 * Get Google Cloud TTS voice name for language
 */
export function getVoiceName(language: Language): string {
  return GOOGLE_VOICE_NAMES[language]
}

/**
 * Get language code for Google Cloud TTS
 */
export function getLanguageCode(language: Language): string {
  const codes: Record<Language, string> = {
    en: 'en-US',
    tr: 'tr-TR',
    de: 'de-DE',
    fr: 'fr-FR',
    es: 'es-ES',
    ru: 'ru-RU',
    ar: 'ar-XA',
    jp: 'ja-JP',
    zh: 'zh-CN'
  }
  return codes[language]
}

// ============================================================================
// AUDIO GENERATION
// ============================================================================

/**
 * Generate audio from SSML using Google Cloud TTS
 * 
 * @param request - Audio generation request
 * @returns Audio generation response with URL
 */
export async function generateSiaAudio(
  request: AudioGenerationRequest
): Promise<AudioGenerationResponse> {
  try {
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { ssml: request.ssml },
        voice: {
          languageCode: getLanguageCode(request.language),
          name: getVoiceName(request.language)
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate: request.speakingRate || 0.9,
          pitch: request.pitch || -5.0,
          volumeGainDb: request.volumeGainDb || 0.0
        }
      })
    })

    if (!response.ok) {
      throw new Error(`TTS API error: ${response.statusText}`)
    }

    const data = await response.json()
    
    return {
      audioUrl: data.audioUrl,
      audioContent: data.audioContent,
      duration: data.duration,
      format: 'mp3',
      size: data.size
    }

  } catch (error) {
    console.error('Audio generation error:', error)
    throw error
  }
}

/**
 * Generate audio for article
 * 
 * @param articleId - Article ID
 * @param ssml - SSML content
 * @param language - Language code
 * @returns Audio metadata
 */
export async function generateArticleAudio(
  articleId: string,
  ssml: string,
  language: Language
): Promise<AudioMetadata> {
  const audioResponse = await generateSiaAudio({
    ssml,
    language
  })

  const metadata: AudioMetadata = {
    articleId,
    language,
    voiceName: getVoiceName(language),
    duration: audioResponse.duration,
    format: audioResponse.format,
    size: audioResponse.size,
    generatedAt: new Date().toISOString(),
    url: audioResponse.audioUrl
  }

  // Store metadata in database
  await storeAudioMetadata(metadata)

  return metadata
}

// ============================================================================
// AUDIO STORAGE
// ============================================================================

// In-memory storage (replace with real database)
const audioMetadataStore = new Map<string, AudioMetadata>()

/**
 * Store audio metadata
 */
async function storeAudioMetadata(metadata: AudioMetadata): Promise<void> {
  audioMetadataStore.set(metadata.articleId, metadata)
  console.log(`✅ Audio metadata stored for article: ${metadata.articleId}`)
}

/**
 * Get audio metadata by article ID
 */
export async function getAudioMetadata(articleId: string): Promise<AudioMetadata | null> {
  return audioMetadataStore.get(articleId) || null
}

/**
 * Delete audio metadata
 */
export async function deleteAudioMetadata(articleId: string): Promise<void> {
  audioMetadataStore.delete(articleId)
}

// ============================================================================
// BATCH AUDIO GENERATION
// ============================================================================

/**
 * Generate audio for multiple articles
 * 
 * @param requests - Array of audio generation requests with article IDs
 * @returns Map of article IDs to audio metadata
 */
export async function generateBatchAudio(
  requests: Array<{ articleId: string; ssml: string; language: Language }>
): Promise<Map<string, AudioMetadata>> {
  const results = new Map<string, AudioMetadata>()
  
  console.log(`🎙️  Generating audio for ${requests.length} articles...`)
  
  for (const request of requests) {
    try {
      const metadata = await generateArticleAudio(
        request.articleId,
        request.ssml,
        request.language
      )
      results.set(request.articleId, metadata)
      
      console.log(`✅ Audio generated: ${request.articleId} (${metadata.duration}s)`)
    } catch (error) {
      console.error(`❌ Audio generation failed for ${request.articleId}:`, error)
    }
  }
  
  console.log(`✅ Batch audio generation complete: ${results.size}/${requests.length}`)
  
  return results
}

// ============================================================================
// AUDIO URL GENERATION
// ============================================================================

/**
 * Generate public audio URL for article
 * 
 * @param articleId - Article ID
 * @param language - Language code
 * @returns Public audio URL
 */
export function getAudioUrl(articleId: string, language: Language): string {
  return `/audio/${language}/${articleId}.mp3`
}

/**
 * Generate CDN audio URL for article
 * 
 * @param articleId - Article ID
 * @param language - Language code
 * @returns CDN audio URL
 */
export function getCdnAudioUrl(articleId: string, language: Language): string {
  const cdnDomain = process.env.NEXT_PUBLIC_CDN_DOMAIN || 'https://cdn.siaintel.com'
  return `${cdnDomain}/audio/${language}/${articleId}.mp3`
}

// ============================================================================
// AUDIO VALIDATION
// ============================================================================

/**
 * Validate audio file
 * 
 * @param audioUrl - Audio URL
 * @returns Validation result
 */
export async function validateAudio(audioUrl: string): Promise<{
  isValid: boolean
  error?: string
}> {
  try {
    const response = await fetch(audioUrl, { method: 'HEAD' })
    
    if (!response.ok) {
      return {
        isValid: false,
        error: `Audio file not accessible: ${response.statusText}`
      }
    }
    
    const contentType = response.headers.get('content-type')
    if (!contentType?.includes('audio')) {
      return {
        isValid: false,
        error: `Invalid content type: ${contentType}`
      }
    }
    
    return { isValid: true }
    
  } catch (error) {
    return {
      isValid: false,
      error: (error as Error).message
    }
  }
}

// ============================================================================
// AUDIO STATISTICS
// ============================================================================

/**
 * Get audio generation statistics
 */
export async function getAudioStatistics(): Promise<{
  totalAudios: number
  totalDuration: number
  totalSize: number
  byLanguage: Record<Language, number>
}> {
  const audios = Array.from(audioMetadataStore.values())
  
  const byLanguage: Record<Language, number> = {
    en: 0,
    tr: 0,
    de: 0,
    fr: 0,
    es: 0,
    ru: 0,
    ar: 0,
    jp: 0,
    zh: 0
  }
  
  audios.forEach(audio => {
    byLanguage[audio.language]++
  })
  
  return {
    totalAudios: audios.length,
    totalDuration: audios.reduce((sum, a) => sum + a.duration, 0),
    totalSize: audios.reduce((sum, a) => sum + a.size, 0),
    byLanguage
  }
}

