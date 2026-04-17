'use client'

import { useState, useRef, useEffect } from 'react'
import type { Language } from '@/lib/sia-news/types'

interface SiaAudioPlayerProps {
  articleId: string
  language: Language
  autoGenerate?: boolean
  transcriptId?: string
}

export default function SiaAudioPlayer({ 
  articleId, 
  language,
  autoGenerate = false,
  transcriptId 
}: SiaAudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const finalTranscriptId = transcriptId || `audio-transcript-${articleId}`

  // Load audio metadata
  useEffect(() => {
    loadAudio()
  }, [articleId])

  async function loadAudio() {
    try {
      setIsLoading(true)
      setError(null)

      // Check if audio exists
      const response = await fetch(`/api/sia-news/audio?articleId=${articleId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setAudioUrl(data.data.url)
        setDuration(data.data.duration)
      } else if (autoGenerate) {
        // Generate audio if it doesn't exist
        await generateAudio()
      } else {
        setError('Audio not available')
      }
    } catch (err) {
      console.error('Failed to load audio:', err)
      setError('Failed to load audio')
    } finally {
      setIsLoading(false)
    }
  }

  async function generateAudio() {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/sia-news/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId })
      })

      const data = await response.json()

      if (data.success && data.data) {
        setAudioUrl(data.data.url)
        setDuration(data.data.duration)
      } else {
        setError('Failed to generate audio')
      }
    } catch (err) {
      console.error('Failed to generate audio:', err)
      setError('Failed to generate audio')
    } finally {
      setIsLoading(false)
    }
  }

  function togglePlay() {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  function handleTimeUpdate() {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  function handleLoadedMetadata() {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  function handleEnded() {
    setIsPlaying(false)
    setCurrentTime(0)
  }

  function handleSeek(e: React.ChangeEvent<HTMLInputElement>) {
    const time = parseFloat(e.target.value)
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }

  function changePlaybackRate(rate: number) {
    if (audioRef.current) {
      audioRef.current.playbackRate = rate
      setPlaybackRate(rate)
    }
  }

  function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const labels: Record<Language, { listen: string; loading: string; error: string; generate: string }> = {
    en: { listen: 'Listen to Article', loading: 'Loading...', error: 'Audio Error', generate: 'Generate Audio' },
    tr: { listen: 'Makaleyi Dinle', loading: 'Yükleniyor...', error: 'Ses Hatası', generate: 'Ses Oluştur' },
    de: { listen: 'Artikel Anhören', loading: 'Laden...', error: 'Audio-Fehler', generate: 'Audio Generieren' },
    fr: { listen: 'Écouter l\'Article', loading: 'Chargement...', error: 'Erreur Audio', generate: 'Générer Audio' },
    es: { listen: 'Escuchar Artículo', loading: 'Cargando...', error: 'Error de Audio', generate: 'Generar Audio' },
    ru: { listen: 'Слушать Статью', loading: 'Загрузка...', error: 'Ошибка Аудио', generate: 'Создать Аудио' },
    ar: { listen: 'استماع للمقال', loading: 'جاري التحميل...', error: 'خطأ في الصوت', generate: 'إنشاء صوت' },
    jp: { listen: '記事を聴く', loading: '読み込み中...', error: 'オーディオエラー', generate: '音声を生成' },
    zh: { listen: '收听文章', loading: '加载中...', error: '音频错误', generate: '生成音频' }
  }

  if (isLoading) {
    return (
      <div className="sia-player-container bg-gradient-to-r from-slate-900 to-black border-l-4 border-gold-500 p-6 my-8 rounded-xl shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-500"></div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gold-500 uppercase tracking-widest animate-pulse">
              SIA AI Voice: Generating...
            </span>
            <span className="text-white font-medium text-lg">{labels[language].loading}</span>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="sia-player-container bg-gradient-to-r from-red-900/20 to-black border-l-4 border-red-500 p-6 my-8 rounded-xl shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-red-500 uppercase tracking-widest">
                Audio Error
              </span>
              <span className="text-red-400">{error}</span>
            </div>
          </div>
          {!autoGenerate && (
            <button
              onClick={generateAudio}
              className="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black font-medium rounded-lg transition-all transform hover:scale-105"
            >
              {labels[language].generate}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!audioUrl) {
    return null
  }

  return (
    <div className="sia-player-container bg-gradient-to-r from-slate-900 to-black border-l-4 border-gold-500 p-6 my-8 rounded-xl shadow-2xl">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {/* Play Button */}
          <div className="relative group">
            <button
              onClick={togglePlay}
              className="bg-gold-500 hover:bg-gold-400 p-4 rounded-full transition-all transform hover:scale-110 shadow-lg"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Title Section */}
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gold-500 uppercase tracking-widest animate-pulse">
              SIA AI Voice: Institutional Analysis
            </span>
            <h4 className="text-white font-medium text-lg leading-tight">
              {labels[language].listen}
            </h4>
          </div>
        </div>

        {/* Regulatory Badge */}
        <div className="hidden md:block text-right">
          <span className="text-gray-400 text-[10px] uppercase font-mono tracking-tighter">
            21 Regulatory Entities Verified
          </span>
        </div>
      </div>

      {/* Audio Element with Google Speakable Target */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        className="hidden"
        aria-describedby={finalTranscriptId}
      />

      {/* Progress Bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <input
          type="range"
          min="0"
          max={duration || 0}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-gold-500"
        />
      </div>

      {/* Playback Speed Controls */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Speed:</span>
          {[0.75, 1.0, 1.25, 1.5].map(rate => (
            <button
              key={rate}
              onClick={() => changePlaybackRate(rate)}
              className={`px-3 py-1 rounded text-sm transition-all ${
                playbackRate === rate
                  ? 'bg-gold-500 text-black font-medium'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {rate}x
            </button>
          ))}
        </div>

        {/* Footer Badge */}
        <div className="text-[10px] text-gray-500 italic">
          Powered by SIA Multimodal Engine V1.0
        </div>
      </div>
    </div>
  )
}
