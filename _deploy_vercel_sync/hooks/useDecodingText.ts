'use client'

import { useEffect, useState } from 'react'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*'

/**
 * DECODING TEXT HOOK
 * Lightweight character scramble effect for intelligence terminal feel
 * Runs once on mount, no heavy dependencies
 */
export function useDecodingText(text: string, duration: number = 500) {
  const [displayText, setDisplayText] = useState(text)
  const [isDecoding, setIsDecoding] = useState(true)

  useEffect(() => {
    if (!text) return

    let frame = 0
    const totalFrames = Math.floor(duration / 30) // ~30fps
    
    const interval = setInterval(() => {
      if (frame >= totalFrames) {
        setDisplayText(text)
        setIsDecoding(false)
        clearInterval(interval)
        return
      }

      // Calculate progress (0 to 1)
      const progress = frame / totalFrames

      // Decode characters progressively
      const decoded = text
        .split('')
        .map((char, index) => {
          // Skip spaces
          if (char === ' ') return ' '

          // Calculate if this character should be decoded yet
          const charProgress = index / text.length
          
          if (progress > charProgress) {
            // Character is decoded
            return char
          } else {
            // Character is still scrambled
            return CHARS[Math.floor(Math.random() * CHARS.length)]
          }
        })
        .join('')

      setDisplayText(decoded)
      frame++
    }, 30)

    return () => clearInterval(interval)
  }, [text, duration])

  return { displayText, isDecoding }
}
