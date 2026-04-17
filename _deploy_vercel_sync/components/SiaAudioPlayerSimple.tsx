'use client'

import React, { useState, useRef } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'

interface SiaAudioPlayerSimpleProps {
  src: string
  transcriptId: string
  title?: string
  language?: string
}

export default function SiaAudioPlayerSimple({ 
  src, 
  transcriptId, 
  title,
  language = 'en'
}: SiaAudioPlayerSimpleProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement>(null)

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
        // Track audio play for analytics
        trackAudioPlay()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const trackAudioPlay = () => {
    // Google Analytics event
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'audio_play', {
        article_id: transcriptId,
        language: language,
        position: 'post_sia_insight'
      })
    }
  }

  const handleEnded = () => {
    setIsPlaying(false)
    
    // Track completion
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'audio_complete', {
        article_id: transcriptId
      })
    }
  }

  const titles: Record<string, string> = {
    en: 'Listen to Intelligence Briefing',
    tr: 'İstihbarat Özetini Dinle',
    de: 'Intelligence-Briefing Anhören',
    fr: 'Écouter le Briefing',
    es: 'Escuchar Briefing',
    ru: 'Слушать Брифинг',
    ar: 'استماع للإحاطة'
  }

  return (
    <div className="sia-player-root bg-slate-900 border-l-4 border-amber-500 p-5 my-8 rounded-r-2xl shadow-2xl backdrop-blur-sm bg-opacity-95">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-5">
          {/* Play/Pause Button */}
          <button 
            onClick={togglePlay}
            className="w-14 h-14 flex items-center justify-center bg-amber-500 hover:bg-amber-400 text-black rounded-full transition-all transform hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(245,158,11,0.4)]"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" className="ml-1" />
            )}
          </button>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              {/* Live Indicator */}
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-[0.2em]">
                SIA AI VOICE: INSTITUTIONAL ANALYSIS
              </span>
            </div>
            <h3 className="text-white font-semibold text-lg">
              {title || titles[language] || titles.en}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <Volume2 size={18} />
          <div className="text-[10px] font-mono border border-slate-700 px-2 py-1 rounded">
            21 REGULATORY ENTITIES VERIFIED
          </div>
        </div>
      </div>

      {/* Hidden but functional Audio Tag with Google Target ID */}
      <audio 
        ref={audioRef}
        id={transcriptId}
        src={src}
        onEnded={handleEnded}
        className="hidden"
        aria-describedby={transcriptId}
      />

      {/* Progress Bar */}
      <div className="w-full bg-slate-800 h-1 mt-4 rounded-full overflow-hidden">
        <div 
          className={`h-full bg-amber-500 transition-all duration-300 ${
            isPlaying ? 'w-1/3 animate-pulse' : 'w-0'
          }`}
        />
      </div>
    </div>
  )
}
