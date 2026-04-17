import {
  generateArticleAudio as generateArticleAudioInternal,
  getAudioMetadata as getAudioMetadataInternal,
  getAudioStatistics as getAudioStatisticsInternal,
  type AudioMetadata,
} from './audio-service'
import {
  generateSSML as generateSSMLInternal,
  validateSSML as validateSSMLInternal,
  type SSMLConfig,
  type SSMLOutput,
} from './ssml-generator'
import type { GeneratedArticle, Language } from './types'

type ValidationResult = ReturnType<typeof validateSSMLInternal>
type AudioStatisticsResult = Awaited<ReturnType<typeof getAudioStatisticsInternal>>

export function generateSSML(
  article: GeneratedArticle,
  voiceConfig?: Partial<SSMLConfig>
): SSMLOutput {
  return generateSSMLInternal(article, voiceConfig)
}

export function validateSSML(ssml: string): ValidationResult {
  return validateSSMLInternal(ssml)
}

export async function generateArticleAudio(
  articleId: string,
  ssml: string,
  language: Language
): Promise<AudioMetadata> {
  return generateArticleAudioInternal(articleId, ssml, language)
}

export async function getAudioMetadata(articleId: string): Promise<AudioMetadata | null> {
  return getAudioMetadataInternal(articleId)
}

export async function getAudioStatistics(): Promise<AudioStatisticsResult> {
  return getAudioStatisticsInternal()
}

export function composeNarrationMarkup(
  article: GeneratedArticle,
  voiceConfig?: Partial<SSMLConfig>
): SSMLOutput {
  return generateSSMLInternal(article, voiceConfig)
}

export function verifyNarrationMarkup(ssml: string): ValidationResult {
  return validateSSMLInternal(ssml)
}

export async function createNarrationAudio(
  articleId: string,
  ssml: string,
  language: Language
): Promise<AudioMetadata> {
  return generateArticleAudioInternal(articleId, ssml, language)
}

export async function fetchNarrationAudioMetadata(articleId: string): Promise<AudioMetadata | null> {
  return getAudioMetadataInternal(articleId)
}

export async function fetchNarrationAudioStatistics(): Promise<AudioStatisticsResult> {
  return getAudioStatisticsInternal()
}