/**
 * Oracle Signal Store (Zustand)
 * 
 * Lightweight but powerful state management for Oracle signals.
 * Enables real-time dashboard updates when signals arrive.
 * 
 * Features:
 * - Last 50 signals stored in memory
 * - Real-time updates across components
 * - Automatic timestamp tracking
 * - Simple API for adding/clearing signals
 */

import { create } from 'zustand'

/**
 * Oracle Signal Interface
 * Matches the OracleSignalLog component structure
 */
export interface OracleSignal {
  time: string          // Timestamp (HH:MM:SS format)
  asset: string         // Symbol (e.g., "NVDA", "TSLA")
  type: 'AL' | 'SAT'   // Action type: AL (Buy) or SAT (Sell)
  action: string        // Action description (e.g., "BULLISH_BREAKOUT")
  confidence: number    // Confidence score (0-100)
  insight: string       // Oracle's strategic insight
}

/**
 * Oracle Store State Interface
 */
interface OracleState {
  signals: OracleSignal[]
  lastUpdate: Date
  addSignal: (signal: OracleSignal) => void
  clearSignals: () => void
  getSignalCount: () => number
}

/**
 * Oracle Signal Store
 * 
 * Usage:
 * ```typescript
 * import { useOracleStore } from '@/store/useOracleStore'
 * 
 * // In component
 * const signals = useOracleStore((state) => state.signals)
 * const addSignal = useOracleStore((state) => state.addSignal)
 * 
 * // Add new signal
 * addSignal({
 *   time: '14:30:45',
 *   asset: 'NVDA',
 *   type: 'AL',
 *   action: 'BULLISH_BREAKOUT',
 *   confidence: 95,
 *   insight: 'Strong momentum detected'
 * })
 * ```
 */
export const useOracleStore = create<OracleState>((set, get) => ({
  signals: [],
  lastUpdate: new Date(),
  
  /**
   * Add new signal to store
   * Keeps only last 50 signals for performance
   * 
   * @param newSignal - Oracle signal to add
   */
  addSignal: (newSignal: OracleSignal) => {
    set((state) => ({
      signals: [newSignal, ...state.signals].slice(0, 50), // Last 50 signals
      lastUpdate: new Date()
    }))
    
    console.log('[ORACLE STORE] Signal added:', {
      asset: newSignal.asset,
      type: newSignal.type,
      confidence: newSignal.confidence,
      totalSignals: get().signals.length
    })
  },
  
  /**
   * Clear all signals from store
   */
  clearSignals: () => {
    set({
      signals: [],
      lastUpdate: new Date()
    })
    
    console.log('[ORACLE STORE] All signals cleared')
  },
  
  /**
   * Get current signal count
   * 
   * @returns Number of signals in store
   */
  getSignalCount: () => {
    return get().signals.length
  }
}))

/**
 * Selector hooks for optimized re-renders
 */

/**
 * Get signals array
 */
export const useOracleSignals = () => useOracleStore((state) => state.signals)

/**
 * Get last update timestamp
 */
export const useOracleLastUpdate = () => useOracleStore((state) => state.lastUpdate)

/**
 * Get signal count
 */
export const useOracleSignalCount = () => useOracleStore((state) => state.signals.length)

/**
 * Get add signal function
 */
export const useAddOracleSignal = () => useOracleStore((state) => state.addSignal)

/**
 * Get clear signals function
 */
export const useClearOracleSignals = () => useOracleStore((state) => state.clearSignals)
