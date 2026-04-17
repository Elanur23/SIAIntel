/**
 * Cross-Language Neural Search - Command+K Global Activation Hook
 * 
 * Listens for Command+K (Mac) or Ctrl+K (Windows/Linux) globally
 * and activates the search overlay.
 * 
 * Task 21: Command+K Global Activation Hook
 */

'use client'

import { useEffect, useCallback } from 'react'

/**
 * Hook options
 */
interface UseCommandKOptions {
  /** Callback when Command+K is pressed */
  onOpen: () => void
  /** Whether the hook is enabled (default: true) */
  enabled?: boolean
}

/**
 * useCommandK Hook
 * 
 * Listens for Command+K (Mac) or Ctrl+K (Windows/Linux) globally
 * and calls onOpen callback when activated.
 * 
 * Requirements:
 * - 21.1: Listen for Command+K on Mac
 * - 21.2: Listen for Ctrl+K on Windows/Linux
 * - 21.3: Prevent default browser behavior
 * - 21.4: Call onOpen callback when activated
 * - 21.5: Work from all pages in application
 * - 21.6: Clean up event listeners on unmount
 */
export function useCommandK({ onOpen, enabled = true }: UseCommandKOptions) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Check for Command+K (Mac) or Ctrl+K (Windows/Linux)
      const isCommandK = (event.metaKey || event.ctrlKey) && event.key === 'k'

      if (isCommandK) {
        // Prevent default browser behavior (e.g., Chrome's address bar focus)
        event.preventDefault()
        event.stopPropagation()

        // Call onOpen callback
        onOpen()

        console.log('🔍 Command+K activated:', {
          platform: event.metaKey ? 'Mac' : 'Windows/Linux',
          timestamp: new Date().toISOString(),
        })
      }
    },
    [onOpen]
  )

  useEffect(() => {
    if (!enabled) return

    // Add event listener to window (global)
    window.addEventListener('keydown', handleKeyDown, { capture: true })

    console.log('🎹 Command+K listener registered')

    // Cleanup on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown, { capture: true })
      console.log('🎹 Command+K listener removed')
    }
  }, [handleKeyDown, enabled])
}
