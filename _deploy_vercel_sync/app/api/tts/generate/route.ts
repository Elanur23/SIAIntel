/**
 * SIA GLOBAL TTS ENGINE - V3.0 (GOOGLE CLOUD INTEGRATED)
 * Converts SSML to MP3 audio using Google Cloud Text-to-Speech.
 * Returns a 503 with a clear message when credentials are not configured.
 */

import { NextRequest, NextResponse } from 'next/server'
import { isGoogleCloudReady, getGoogleCloudConfig } from '@/lib/google/cloud-provider'

// Voice language code map for each SIA locale
const LOCALE_MAP: Record<string, string> = {
  en: 'en-US', tr: 'tr-TR', de: 'de-DE', fr: 'fr-FR',
  es: 'es-ES', ru: 'ru-RU', ar: 'ar-XA', jp: 'ja-JP', zh: 'cmn-CN',
}

export async function POST(request: NextRequest) {
  try {
    const { ssml, languageCode, gender = 'FEMALE', lang } = await request.json()

    if (!ssml) {
      return NextResponse.json({ success: false, error: 'SSML content is required' }, { status: 400 })
    }

    // Resolve language code: accept explicit languageCode, SIA lang slug, or default en-US
    const resolvedLocale = languageCode || (lang && LOCALE_MAP[lang]) || 'en-US'

    if (!isGoogleCloudReady()) {
      return NextResponse.json(
        {
          success: false,
          error: 'TTS_NOT_CONFIGURED',
          message: 'Set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY env vars to enable audio.',
        },
        { status: 503 }
      )
    }

    const config = getGoogleCloudConfig()!

    // Dynamic import avoids build errors when package is not installed
    const { TextToSpeechClient } = await import('@google-cloud/text-to-speech')

    const client = new TextToSpeechClient({
      credentials: {
        client_email: config.clientEmail,
        private_key: config.privateKey,
      },
      ...(config.projectId ? { projectId: config.projectId } : {}),
    })

    const [response] = await client.synthesizeSpeech({
      input: { ssml },
      voice: {
        languageCode: resolvedLocale,
        ssmlGender: gender as 'FEMALE' | 'MALE' | 'NEUTRAL',
      },
      audioConfig: { audioEncoding: 'MP3' },
    })

    const audioContent = response.audioContent
    if (!audioContent) {
      return NextResponse.json({ success: false, error: 'Empty audio response from Google Cloud TTS' }, { status: 502 })
    }

    // audioContent from Google TTS can be string (base64) or Uint8Array
    let nodeBuffer: Buffer
    if (typeof audioContent === 'string') {
      nodeBuffer = Buffer.from(audioContent, 'base64')
    } else {
      nodeBuffer = Buffer.from(audioContent as Uint8Array)
    }

    return new NextResponse(nodeBuffer as unknown as BodyInit, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(nodeBuffer.byteLength),
        'Cache-Control': 'public, max-age=86400',
        'X-SIA-TTS-Provider': 'Google_Cloud_Live',
        'X-SIA-TTS-Locale': resolvedLocale,
      },
    })
  } catch (error: any) {
    console.error('[SIA_TTS] Error:', error.message)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
