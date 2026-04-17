/**
 * Cross-Language Neural Search - Keyboard Navigation Hook
 * 
 * Handles keyboard navigation for search results with Arrow Up/Down,
 * Enter, Escape, Tab, and Command+Number shortcuts.
 * 
 * Task 20: Keyboard Navigation Hook
 */

'use client'

import { useEffect, useState, useCallback } from 'react'
import type { SearchResult } from '@/lib/search/types'

/**
 * Hook options
 */
interface UseKeyboardNavigationOptions {
  /** Search results to navigate */
  results: SearchResult[]
  /** Callback when result is selected (Enter key) */
  onSelect: (result: SearchResult) => void
  /** Callback when overlay should close (Escape key) */
  onClose: () => void
  /** Whether navigation is enabled (default: true) */
  enabled?: boolean
}

/**
 * Hook return value
 */
interface UseKeyboardNavigationReturn {
  /** Currently selected index */
  selectedIndex: number
  /** Set selected index manually */
  setSelectedIndex: (index: number) => void
  /** Navigate to next result */
  navigateNext: () => void
  /** Navigate to previous result */
  navigatePrevious: () => void
  /** Select current result */
  selectCurrent: () => void
}

/**
 * useKeyboardNavigation Hook
 * 
 * Provides keyboard-first navigation for search results.
 * 
 * Requirements:
 * - 20.1: Support Arrow Up/Down to navigate results
 * - 20.2: Highlight currently selected result
 * - 20.3: Support Enter key to open selected result
 * - 20.4: Support Tab key to cycle through result actions
 * - 20.5: Support Command+Number (1-9) for direct selection
 * - 20.6: Maintain keyboard focus within modal
 * - 20.7: Prevent default browser behavior for handled keys
 * - 20.8: Bound selected index to [0, resultCount-1]
 * - 20.9: Clean up event listeners on unmount
 */
export function useKeyboardNavigation({
  results,
  onSelect,
  onClose,
  enabled = true,
}: UseKeyboardNavigationOptions): UseKeyboardNavigationReturn {
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [results])

  // Navigate to next result
  const navigateNext = useCallback(() => {
    setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
  }, [results.length])

  // Navigate to previous result
  const navigatePrevious = useCallback(() => {
    setSelectedIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  // Select current result
  const selectCurrent = useCallback(() => {
    if (results[selectedIndex]) {
      onSelect(results[selectedIndex])
    }
  }, [results, selectedIndex, onSelect])

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Only handle if results exist
      if (results.length === 0) return

      switch (event.key) {
        case 'ArrowDown':
          // Requirement 20.1: Arrow Down to navigate
          event.preventDefault()
          navigateNext()
          console.log('⬇️  Navigate down:', selectedIndex + 1)
          break

        case 'ArrowUp':
          // Requirement 20.1: Arrow Up to navigate
          event.preventDefault()
          navigatePrevious()
          console.log('⬆️  Navigate up:', selectedIndex - 1)
          break

        case 'Enter':
          // Requirement 20.3: Enter to select
          event.preventDefault()
          selectCurrent()
          console.log('✅ Selected result:', selectedIndex)
          break

        case 'Escape':
          // Close overlay
          event.preventDefault()
          onClose()
          console.log('❌ Closed overlay')
          break

        case 'Tab':
          // Requirement 20.4: Tab to cycle through actions
          // For now, just prevent default (action menu not implemented yet)
          event.preventDefault()
          console.log('⭾ Tab pressed (action cycling not implemented)')
          break

        default:
          // Requirement 20.5: Command+Number (1-9) for direct selection
          if ((event.metaKey || event.ctrlKey) && /^[1-9]$/.test(event.key)) {
            event.preventDefault()
            const index = parseInt(event.key) - 1
            
            if (results[index]) {
              setSelectedIndex(index)
              onSelect(results[index])
              console.log(`🔢 Direct selection: ${event.key} → index ${index}`)
            }
          }
          break
      }
    },
    [results, selectedIndex, navigateNext, navigatePrevious, selectCurrent, onClose]
  )

  // Set up keyboard event listener
  useEffect(() => {
    if (!enabled) return

    window.addEventListener('keydown', handleKeyDown)

    console.log('⌨️  Keyboard navigation enabled:', {
      resultCount: results.length,
      selectedIndex,
    })

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      console.log('⌨️  Keyboard navigation disabled')
    }
  }, [handleKeyDown, enabled, results.length, selectedIndex])

  return {
    selectedIndex,
    setSelectedIndex,
    navigateNext,
    navigatePrevious,
    selectCurrent,
  }
}
