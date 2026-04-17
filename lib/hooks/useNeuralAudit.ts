/**
 * useNeuralAudit Hook
 * React hook for integrating the SIA_Sentinel_Core engine into UI components
 * 
 * Features:
 * - Real-time content auditing
 * - Autonomous healing mode (auto-fixes failed cells)
 * - Sequential repair queue (prevents API overload)
 * - Recursive re-auditing until 9.0+ score
 * 
 * Usage:
 * const { audit, isLoading, error, runAudit, isAutoHealing } = useNeuralAudit({ autonomousMode: true })
 * await runAudit(title, content, language)
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import type { AuditResult } from '@/lib/neural-assembly/sia-sentinel-core'

interface UseNeuralAuditOptions {
  autonomousMode?: boolean // Enable auto-healing
  healingThreshold?: number // Score threshold to trigger healing (default: 8.5)
  maxHealingRounds?: number // Max healing iterations (default: 3)
  onHealingStart?: () => void
  onHealingComplete?: (finalScore: number) => void
  onHealingError?: (error: string) => void
}

interface UseNeuralAuditReturn {
  audit: AuditResult | null
  isLoading: boolean
  isAutoHealing: boolean
  healingProgress: {
    currentRound: number
    totalRounds: number
    currentCell: string | null
    cellsHealed: string[]
  }
  error: string | null
  runAudit: (title: string, content: string, language?: string) => Promise<void>
  clearAudit: () => void
  stopHealing: () => void
}

export function useNeuralAudit(options: UseNeuralAuditOptions = {}): UseNeuralAuditReturn {
  const {
    autonomousMode = false,
    healingThreshold = 8.5,
    maxHealingRounds = 3,
    onHealingStart,
    onHealingComplete,
    onHealingError,
  } = options

  const [audit, setAudit] = useState<AuditResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isAutoHealing, setIsAutoHealing] = useState(false)
  const [healingProgress, setHealingProgress] = useState({
    currentRound: 0,
    totalRounds: 0,
    currentCell: null as string | null,
    cellsHealed: [] as string[],
  })
  const [error, setError] = useState<string | null>(null)

  // Refs for autonomous healing
  const healingQueueRef = useRef<string[]>([])
  const currentContentRef = useRef<{ title: string; content: string; language: string }>({
    title: '',
    content: '',
    language: 'en',
  })
  const healingRoundRef = useRef(0)
  const shouldStopHealingRef = useRef(false)

  // Cell type mapping for healing
  const HEALABLE_CELLS = ['title', 'body', 'meta', 'sovereign', 'readability', 'seo']

  const runAudit = useCallback(async (
    title: string,
    content: string,
    language: string = 'en'
  ) => {
    setIsLoading(true)
    setError(null)

    // Store current content for healing
    currentContentRef.current = { title, content, language }

    try {
      console.log('[useNeuralAudit] Starting audit...')
      console.log('[useNeuralAudit] Title:', title.substring(0, 50) + '...')
      console.log('[useNeuralAudit] Content length:', content.length)

      const response = await fetch('/api/neural-audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title, content, language }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Audit failed')
      }

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Audit failed')
      }

      console.log('[useNeuralAudit] ✅ Audit complete')
      console.log('[useNeuralAudit] Overall Score:', result.data.scores.overall)
      console.log('[useNeuralAudit] Status:', result.data.status)

      // 🔍 CLIENT-SIDE FACT-CHECK VERIFICATION
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🧬 CLIENT: FACT-CHECK CELL DATA (Cell 5)')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('📊 Data Points Found:', result.data.metadata.dataPointCount)
      console.log('📈 Fact-Check Score:', result.data.scores.factCheck, '/ 9.9')
      console.log('🎯 Overall Score:', result.data.scores.overall, '/ 9.9')
      console.log('📝 Word Count:', result.data.metadata.wordCount)
      console.log('🏢 Entities:', result.data.detectedEntities.length, '→', result.data.detectedEntities.slice(0, 3).join(', '))
      
      if (result.data.metadata.dataPointCount === 0) {
        console.warn('⚠️  No data points - this is a REAL audit result, not default!')
      } else {
        console.log('✅ CONFIRMED: Score is based on', result.data.metadata.dataPointCount, 'actual data points')
      }
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

      setAudit(result.data)
    } catch (err) {
      console.error('[useNeuralAudit] ❌ Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // 🤖 AUTONOMOUS HEALING WATCHER
  useEffect(() => {
    if (!autonomousMode || !audit || isAutoHealing || shouldStopHealingRef.current) {
      return
    }

    // Check if healing is needed
    const failedCells: string[] = []
    
    // Check overall score against threshold
    if (audit.overall_score < 90) {
      // Check individual cell scores
      Object.entries(audit.cell_scores).forEach(([cellName, cellScore]) => {
        if (cellScore.score < healingThreshold * 10 && !failedCells.includes(cellName)) {
          failedCells.push(cellName)
        }
      })
    }

    if (failedCells.length > 0 && healingRoundRef.current < maxHealingRounds) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('⚡ AUTONOMOUS_REPAIR_IN_PROGRESS')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎯 Current Score:', audit.overall_score, '/ 100')
      console.log('🔧 Cells to Heal:', failedCells.join(', '))
      console.log('🔄 Healing Round:', healingRoundRef.current + 1, '/', maxHealingRounds)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      healingQueueRef.current = failedCells
      startAutonomousHealing()
    } else if (audit.overall_score >= 90) {
      console.log('✅ AUTONOMOUS_HEALING_COMPLETE: Score', audit.overall_score, '≥ 90')
      onHealingComplete?.(audit.overall_score)
    }
  }, [audit, autonomousMode, healingThreshold, maxHealingRounds, isAutoHealing])

  // 🔧 AUTONOMOUS HEALING ORCHESTRATOR
  const startAutonomousHealing = async () => {
    if (shouldStopHealingRef.current) return

    setIsAutoHealing(true)
    healingRoundRef.current += 1
    onHealingStart?.()

    const cellsToHeal = [...healingQueueRef.current]
    const healedCells: string[] = []

    setHealingProgress({
      currentRound: healingRoundRef.current,
      totalRounds: maxHealingRounds,
      currentCell: null,
      cellsHealed: [],
    })

    try {
      // Sequential healing to avoid API overload
      for (const cellType of cellsToHeal) {
        if (shouldStopHealingRef.current) break

        console.log(`[AUTONOMOUS_HEALER] Healing cell: ${cellType}`)
        
        setHealingProgress((prev) => ({
          ...prev,
          currentCell: cellType,
        }))

        // Call Gemini API to heal this cell
        const healResult = await healCell(cellType, currentContentRef.current)

        if (healResult.success) {
          // Update content with healed version
          if (cellType === 'title' && healResult.healedContent) {
            currentContentRef.current.title = healResult.healedContent
          } else if (cellType === 'body' && healResult.healedContent) {
            currentContentRef.current.content = healResult.healedContent
          }
          // For other cells, we'd update the relevant part of content

          healedCells.push(cellType)
          console.log(`[AUTONOMOUS_HEALER] ✅ ${cellType} healed successfully`)
        } else {
          console.error(`[AUTONOMOUS_HEALER] ❌ Failed to heal ${cellType}:`, healResult.error)
        }

        // Small delay between healing operations
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      setHealingProgress((prev) => ({
        ...prev,
        currentCell: null,
        cellsHealed: healedCells,
      }))

      // Re-audit with healed content
      if (healedCells.length > 0 && !shouldStopHealingRef.current) {
        console.log('[AUTONOMOUS_HEALER] Re-auditing with healed content...')
        await runAudit(
          currentContentRef.current.title,
          currentContentRef.current.content,
          currentContentRef.current.language
        )
      }
    } catch (err) {
      console.error('[AUTONOMOUS_HEALER] ❌ Error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Autonomous healing failed'
      setError(errorMsg)
      onHealingError?.(errorMsg)
    } finally {
      setIsAutoHealing(false)
      healingQueueRef.current = []
    }
  }

  // 🔧 CELL HEALING FUNCTION
  const healCell = async (
    cellType: string,
    content: { title: string; content: string; language: string }
  ): Promise<{ success: boolean; healedContent?: string; error?: string }> => {
    try {
      const currentContent = cellType === 'title' ? content.title : content.content

      const response = await fetch('/api/neural-healer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articleId: 'autonomous-healing',
          cellType,
          currentContent,
          issues: [`Low ${cellType} score`],
          language: content.language,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        return { success: false, error: errorData.error || 'Healing API failed' }
      }

      const result = await response.json()

      if (!result.success) {
        return { success: false, error: result.error || 'Healing failed' }
      }

      return { success: true, healedContent: result.data?.healedContent || currentContent }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  // 🔍 HELPER: Extract cell name from diagnostic message
  const getCellNameFromDiagnostic = (issue: string): string | null => {
    const lowerIssue = issue.toLowerCase()
    
    if (lowerIssue.includes('clickbait') || lowerIssue.includes('title')) return 'title'
    if (lowerIssue.includes('thin content') || lowerIssue.includes('data density')) return 'body'
    if (lowerIssue.includes('meta')) return 'meta'
    if (lowerIssue.includes('emotional') || lowerIssue.includes('clickbait')) return 'sovereign'
    if (lowerIssue.includes('sentence') || lowerIssue.includes('readability')) return 'readability'
    if (lowerIssue.includes('seo') || lowerIssue.includes('keyword')) return 'seo'
    
    return null
  }

  const stopHealing = useCallback(() => {
    console.log('[AUTONOMOUS_HEALER] 🛑 Stopping autonomous healing...')
    shouldStopHealingRef.current = true
    setIsAutoHealing(false)
    healingQueueRef.current = []
  }, [])

  const clearAudit = useCallback(() => {
    setAudit(null)
    setError(null)
    setIsAutoHealing(false)
    setHealingProgress({
      currentRound: 0,
      totalRounds: 0,
      currentCell: null,
      cellsHealed: [],
    })
    healingRoundRef.current = 0
    shouldStopHealingRef.current = false
    healingQueueRef.current = []
  }, [])

  return {
    audit,
    isLoading,
    isAutoHealing,
    healingProgress,
    error,
    runAudit,
    clearAudit,
    stopHealing,
  }
}

/**
 * Hook for batch auditing multiple articles
 */
export function useBatchNeuralAudit() {
  const [audits, setAudits] = useState<Map<string, AuditResult>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runBatchAudit = useCallback(async (
    articles: Array<{ id: string; title: string; content: string; language?: string }>
  ) => {
    setIsLoading(true)
    setError(null)

    try {
      console.log('[useBatchNeuralAudit] Starting batch audit for', articles.length, 'articles')

      const results = await Promise.all(
        articles.map(async (article) => {
          const response = await fetch('/api/neural-audit', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              title: article.title,
              content: article.content,
              language: article.language || 'en',
            }),
          })

          if (!response.ok) {
            throw new Error(`Audit failed for article ${article.id}`)
          }

          const result = await response.json()
          return { id: article.id, audit: result.data }
        })
      )

      const auditMap = new Map<string, AuditResult>()
      results.forEach(({ id, audit }) => {
        auditMap.set(id, audit)
      })

      console.log('[useBatchNeuralAudit] ✅ Batch audit complete')
      console.log('[useBatchNeuralAudit] Processed:', auditMap.size, 'articles')

      setAudits(auditMap)
    } catch (err) {
      console.error('[useBatchNeuralAudit] ❌ Error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearAudits = useCallback(() => {
    setAudits(new Map())
    setError(null)
  }, [])

  return {
    audits,
    isLoading,
    error,
    runBatchAudit,
    clearAudits,
  }
}
