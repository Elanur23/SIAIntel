'use client'

import { useState, useEffect } from 'react'
import { isNanoReady, runNanoAnalysis } from '@/lib/ai/gemini-nano-bridge'

/**
 * Custom hook to provide Gemini Nano (Local AI) capabilities to components
 */
export function useNanoAnalyst() {
  const [ready, setReady] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)

  useEffect(() => {
    setReady(isNanoReady())
  }, [])

  const analyzeLocally = async (text: string, context: string = 'Financial analysis') => {
    if (!ready) return null
    setAnalyzing(true)
    try {
      const systemPrompt = `You are SIA_NANO, an on-device financial intelligence agent. Analyze the provided text for: ${context}. Be concise and technical.`
      const result = await runNanoAnalysis(text, systemPrompt)
      return result
    } finally {
      setAnalyzing(false)
    }
  }

  return {
    isNanoAvailable: ready,
    isNanoAnalyzing: analyzing,
    analyzeLocally
  }
}
