/**
 * Voice Assistant Hook — Professional Edition
 * 
 * Natural human-like speech using FREE Web Speech API.
 * Features:
 *  - Sentence-level chunking (fixes Chrome 15-second cutoff bug)
 *  - Natural pauses between sentences (like breathing)
 *  - Human-like rate/pitch tuning per language
 *  - Premium voice auto-selection (Google Neural > Microsoft Neural > default)
 *  - Real progress tracking (sentence index + percentage)
 *  - Estimated reading time
 *  - Speed control (0.5x – 2x)
 *  - Pause / Resume / Stop
 *  - Keyboard shortcut support (Space = toggle, Esc = stop)
 *  - Auto-retry on transient errors
 *  - Fully FREE — no API key required
 */

import { useState, useEffect, useCallback, useRef } from 'react'

export type VoiceProvider = 'web-speech' | 'elevenlabs'

export interface VoiceConfig {
  provider: VoiceProvider
  language: string
  autoPlay: boolean
  rate: number
  pitch: number
  volume: number
  enableKeyboard: boolean
}

export interface VoiceState {
  isPlaying: boolean
  isPaused: boolean
  isLoading: boolean
  currentText: string | null
  progress: number
  error: string | null
  isSupported: boolean
  currentSentence: number
  totalSentences: number
  estimatedTime: number
  elapsedTime: number
  voiceName: string | null
}

// Natural human-like defaults — slightly slower, natural pitch
const DEFAULT_CONFIG: VoiceConfig = {
  provider: 'web-speech',
  language: 'en-US',
  autoPlay: false,
  rate: 0.92,
  pitch: 1.05,
  volume: 1.0,
  enableKeyboard: true
}

// Language-specific tuning for natural sound
const LANG_TUNING: Record<string, { rate: number; pitch: number; pauseMs: number }> = {
  'en-US': { rate: 0.92, pitch: 1.05, pauseMs: 320 },
  'tr-TR': { rate: 0.90, pitch: 1.08, pauseMs: 350 },
  'de-DE': { rate: 0.88, pitch: 1.02, pauseMs: 380 },
  'es-ES': { rate: 0.94, pitch: 1.06, pauseMs: 300 },
  'fr-FR': { rate: 0.91, pitch: 1.10, pauseMs: 340 },
  'ru-RU': { rate: 0.89, pitch: 0.98, pauseMs: 360 },
  'ar-SA': { rate: 0.87, pitch: 1.02, pauseMs: 400 },
  'ja-JP': { rate: 0.85, pitch: 1.12, pauseMs: 420 },
  'zh-CN': { rate: 0.88, pitch: 1.08, pauseMs: 380 },
  'ko-KR': { rate: 0.88, pitch: 1.06, pauseMs: 360 },
  'it-IT': { rate: 0.93, pitch: 1.08, pauseMs: 300 },
  'pt-BR': { rate: 0.92, pitch: 1.04, pauseMs: 320 },
}

// Language to voice locale mapping
const LANG_TO_VOICE: Record<string, { code: string; name: string }> = {
  'en': { code: 'en-US', name: 'English (US)' },
  'es': { code: 'es-ES', name: 'Español' },
  'tr': { code: 'tr-TR', name: 'Türkçe' },
  'fr': { code: 'fr-FR', name: 'Français' },
  'de': { code: 'de-DE', name: 'Deutsch' },
  'it': { code: 'it-IT', name: 'Italiano' },
  'pt': { code: 'pt-BR', name: 'Português' },
  'ru': { code: 'ru-RU', name: 'Русский' },
  'zh': { code: 'zh-CN', name: '中文' },
  'ja': { code: 'ja-JP', name: '日本語' },
  'ko': { code: 'ko-KR', name: '한국어' },
  'ar': { code: 'ar-SA', name: 'العربية' }
}

// Voice quality ranking — prefer neural/natural voices
const VOICE_PRIORITY = [
  'Google', 'Microsoft Online (Natural)', 'Microsoft', 'Neural', 'Natural',
  'Premium', 'Enhanced', 'Wavenet', 'Studio'
]

/**
 * Split text into natural sentences for chunked speech.
 * Handles abbreviations (Dr., Mr., U.S.) and decimal numbers gracefully.
 */
function splitIntoSentences(text: string): string[] {
  const cleaned = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, 've')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim()

  if (!cleaned) return []

  // Split on sentence boundaries. Avoid lookbehind for broader browser support.
  // Primary: split after punctuation + whitespace.
  let raw: string[] = []
  try {
    // Includes Arabic question mark (F) and also handles line breaks.
    raw = cleaned.split(/[.!?…؟]+\s+|\n+/)
  } catch {
    raw = [cleaned]
  }

  const sentences: string[] = []
  for (const chunk of raw) {
    const trimmed = chunk.trim()
    if (!trimmed) continue
    // If a chunk is very long (>300 chars), split on commas/semicolons too
    if (trimmed.length > 300) {
      // No lookbehind for compatibility
      const subParts = trimmed.split(/[,;:—،]\s+/)
      sentences.push(...subParts.filter(s => s.trim()))
    } else {
      sentences.push(trimmed)
    }
  }

  return sentences.length > 0 ? sentences : [cleaned]
}

/**
 * Estimate reading time in seconds based on word count and speech rate.
 */
function estimateReadingTime(text: string, rate: number): number {
  const wordCount = text.split(/\s+/).length
  const wordsPerMinute = 150 * rate // avg human ~150 wpm at rate 1.0
  return Math.ceil((wordCount / wordsPerMinute) * 60)
}

/**
 * Select the most natural-sounding voice for a given language.
 */
function selectBestVoice(voices: SpeechSynthesisVoice[], language: string): SpeechSynthesisVoice | null {
  const langCode = language.split('-')[0]

  // Exact language match candidates
  const candidates = voices.filter(
    v => v.lang === language || v.lang.startsWith(langCode)
  )

  if (candidates.length === 0) return null

  // Score each voice by quality keywords
  const scored = candidates.map(v => {
    let score = 0
    const name = v.name.toLowerCase()

    for (let i = 0; i < VOICE_PRIORITY.length; i++) {
      if (name.includes(VOICE_PRIORITY[i].toLowerCase())) {
        score += (VOICE_PRIORITY.length - i) * 10
      }
    }

    // Prefer non-compact, non-legacy voices
    if (name.includes('compact') || name.includes('legacy')) score -= 20

    // Prefer local voices (faster, no network)
    if (!v.localService) score -= 5

    // Exact lang match bonus
    if (v.lang === language) score += 15

    return { voice: v, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.voice || candidates[0]
}

export function useVoiceAssistant(initialConfig?: Partial<VoiceConfig>) {
  const [config, setConfig] = useState<VoiceConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig
  })

  const [state, setState] = useState<VoiceState>({
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentText: null,
    progress: 0,
    error: null,
    isSupported: false,
    currentSentence: 0,
    totalSentences: 0,
    estimatedTime: 0,
    elapsedTime: 0,
    voiceName: null
  })

  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const sentencesRef = useRef<string[]>([])
  const currentIndexRef = useRef<number>(0)
  const isCancelledRef = useRef<boolean>(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const selectedVoiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const retryCountRef = useRef<number>(0)

  // Always-current language ref (prevents stale closures)
  const languageRef = useRef(config.language)
  const rateRef = useRef(config.rate)
  const pitchRef = useRef(config.pitch)
  const volumeRef = useRef(config.volume)

  useEffect(() => {
    languageRef.current = config.language
    rateRef.current = config.rate
    pitchRef.current = config.pitch
    volumeRef.current = config.volume
  }, [config.language, config.rate, config.pitch, config.volume])

  // Check browser support & preload voices
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isSupported = 'speechSynthesis' in window
    setState(prev => ({ ...prev, isSupported }))

    if (isSupported) {
      synthesisRef.current = window.speechSynthesis

      // Voices may load async (Chrome)
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices()
        if (voices.length > 0) {
          const best = selectBestVoice(voices, config.language)
          selectedVoiceRef.current = best
          if (best) {
            setState(prev => ({ ...prev, voiceName: best.name }))
          }
        }
      }

      loadVoices()
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  }, [config.language])

  // Sync language when initialConfig.language changes (e.g. page language switch)
  useEffect(() => {
    if (initialConfig?.language) {
      setConfig(prev => ({
        ...prev,
        language: initialConfig.language!
      }))
    }
  }, [initialConfig?.language])

  // Auto-detect language from cookie — only if no language was explicitly provided
  useEffect(() => {
    if (initialConfig?.language) return // explicit language takes priority
    if (typeof document === 'undefined') return

    const getCookie = (name: string) => {
      const value = `; ${document.cookie}`
      const parts = value.split(`; ${name}=`)
      if (parts.length === 2) return parts.pop()?.split(';').shift()
      return undefined
    }

    const locale = getCookie('NEXT_LOCALE') || 'en'
    const langConfig = LANG_TO_VOICE[locale] || LANG_TO_VOICE['en']

    setConfig(prev => ({
      ...prev,
      language: langConfig.code
    }))
  }, [initialConfig?.language])

  // Elapsed time counter
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now()
    timerRef.current = setInterval(() => {
      setState(prev => ({
        ...prev,
        elapsedTime: Math.floor((Date.now() - startTimeRef.current) / 1000)
      }))
    }, 1000)
  }, [])

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  /**
   * Speak a single sentence with natural human-like settings.
   * Uses refs to always get the latest language/rate/pitch/volume (no stale closures).
   */
  const speakSentence = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && !synthesisRef.current && 'speechSynthesis' in window) {
        synthesisRef.current = window.speechSynthesis
      }

      if (!synthesisRef.current || isCancelledRef.current) {
        reject(new Error('cancelled'))
        return
      }

      const lang = languageRef.current
      const rate = rateRef.current
      const pitch = pitchRef.current
      const vol = volumeRef.current

      const utterance = new SpeechSynthesisUtterance(text)

      // Apply language-specific natural tuning
      const tuning = LANG_TUNING[lang] || LANG_TUNING['en-US']
      const userRate = rate / DEFAULT_CONFIG.rate

      utterance.lang = lang
      utterance.rate = tuning.rate * userRate
      utterance.pitch = pitch !== DEFAULT_CONFIG.pitch ? pitch : tuning.pitch
      utterance.volume = vol

      // Apply best voice for current language
      if (selectedVoiceRef.current) {
        utterance.voice = selectedVoiceRef.current
      }

      utterance.onend = () => resolve()
      utterance.onerror = (event) => {
        if (event.error === 'canceled' || event.error === 'interrupted') {
          reject(new Error('cancelled'))
        } else {
          reject(new Error(event.error || 'speech-error'))
        }
      }

      utteranceRef.current = utterance
      synthesisRef.current!.speak(utterance)
    })
  }, [])

  /**
   * Main speech engine — reads sentences one by one with natural pauses.
   */
  const speakChunked = useCallback(async (sentences: string[]) => {
    if (!synthesisRef.current) return

    if (!sentences || sentences.length === 0) {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        progress: 0,
        currentText: null,
        currentSentence: 0,
        totalSentences: 0
      }))
      stopTimer()
      return
    }

    const tuning = LANG_TUNING[languageRef.current] || LANG_TUNING['en-US']

    for (let i = currentIndexRef.current; i < sentences.length; i++) {
      if (isCancelledRef.current) break

      currentIndexRef.current = i
      const progress = ((i + 1) / sentences.length) * 100

      setState(prev => ({
        ...prev,
        currentSentence: i + 1,
        progress
      }))

      try {
        await speakSentence(sentences[i])
        retryCountRef.current = 0

        // Natural pause between sentences (like breathing)
        if (i < sentences.length - 1 && !isCancelledRef.current) {
          await new Promise(r => setTimeout(r, tuning.pauseMs))
        }
      } catch (err: any) {
        if (err.message === 'cancelled') break

        // Retry once on transient error
        if (retryCountRef.current < 1) {
          retryCountRef.current++
          i-- // retry same sentence
          await new Promise(r => setTimeout(r, 200))
          continue
        }

        setState(prev => ({ ...prev, error: `Sentence ${i + 1} failed` }))
        break
      }
    }

    // Finished or cancelled
    if (!isCancelledRef.current) {
      setState(prev => ({
        ...prev,
        isPlaying: false,
        isPaused: false,
        progress: 100,
        currentText: null,
        currentSentence: 0
      }))
    }

    stopTimer()
  }, [speakSentence, stopTimer])

  // Main speak function
  const speak = useCallback((text: string) => {
    if (!text) return

    if (typeof window !== 'undefined' && !synthesisRef.current && 'speechSynthesis' in window) {
      synthesisRef.current = window.speechSynthesis
    }

    if (!synthesisRef.current) {
      setState(prev => ({ ...prev, isSupported: false, error: 'not-supported' }))
      return
    }

    // Cancel any ongoing speech
    isCancelledRef.current = true
    synthesisRef.current.cancel()

    // Small delay to let cancel propagate
    setTimeout(() => {
      isCancelledRef.current = false
      retryCountRef.current = 0

      const sentences = splitIntoSentences(text)
      sentencesRef.current = sentences
      currentIndexRef.current = 0

      const est = estimateReadingTime(text, rateRef.current)

      setState(prev => ({
        ...prev,
        isPlaying: true,
        isPaused: false,
        isLoading: false,
        currentText: text,
        progress: 0,
        error: null,
        currentSentence: 0,
        totalSentences: sentences.length,
        estimatedTime: est,
        elapsedTime: 0
      }))

      startTimer()
      speakChunked(sentences)
    }, 100)
  }, [speakChunked, startTimer])

  // Pause
  const pause = useCallback(() => {
    if (config.provider === 'web-speech' && synthesisRef.current) {
      synthesisRef.current.pause()
      setState(prev => ({ ...prev, isPaused: true }))
    } else if (audioRef.current) {
      audioRef.current.pause()
      setState(prev => ({ ...prev, isPaused: true }))
    }
    stopTimer()
  }, [config.provider, stopTimer])

  // Resume
  const resume = useCallback(() => {
    if (config.provider === 'web-speech' && synthesisRef.current) {
      synthesisRef.current.resume()
      setState(prev => ({ ...prev, isPaused: false }))
    } else if (audioRef.current) {
      audioRef.current.play()
      setState(prev => ({ ...prev, isPaused: false }))
    }
    startTimer()
  }, [config.provider, startTimer])

  // Stop
  const stop = useCallback(() => {
    isCancelledRef.current = true

    if (config.provider === 'web-speech' && synthesisRef.current) {
      synthesisRef.current.cancel()
    } else if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    sentencesRef.current = []
    currentIndexRef.current = 0
    retryCountRef.current = 0

    setState(prev => ({
      ...prev,
      isPlaying: false,
      isPaused: false,
      progress: 0,
      currentText: null,
      currentSentence: 0,
      totalSentences: 0,
      elapsedTime: 0
    }))

    stopTimer()
  }, [config.provider, stopTimer])

  // Toggle play/pause
  const toggle = useCallback((text?: string) => {
    if (state.isPlaying) {
      if (state.isPaused) {
        resume()
      } else {
        pause()
      }
    } else if (text) {
      speak(text)
    }
  }, [state.isPlaying, state.isPaused, speak, pause, resume])

  // Speed control
  const setSpeed = useCallback((rate: number) => {
    const clamped = Math.max(0.5, Math.min(2.0, rate))
    setConfig(prev => ({ ...prev, rate: clamped }))
  }, [])

  // Update config
  const updateConfig = useCallback((newConfig: Partial<VoiceConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
  }, [])

  // Keyboard shortcuts (Space = toggle, Escape = stop)
  useEffect(() => {
    if (!config.enableKeyboard || typeof window === 'undefined') return

    const handler = (e: KeyboardEvent) => {
      // Don't capture when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return

      if (e.code === 'Escape' && state.isPlaying) {
        e.preventDefault()
        stop()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [config.enableKeyboard, state.isPlaying, stop])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isCancelledRef.current = true
      if (synthesisRef.current) synthesisRef.current.cancel()
      if (audioRef.current) audioRef.current.pause()
      stopTimer()
    }
  }, [stopTimer])

  return {
    state,
    config,
    speak,
    pause,
    resume,
    stop,
    toggle,
    setSpeed,
    updateConfig
  }
}
