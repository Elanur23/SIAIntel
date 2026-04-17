'use client'

/**
 * Session Keepalive Component
 * 
 * Monitors session idle timeout and provides warnings.
 * Automatically refreshes session on user activity.
 */

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

const CHECK_INTERVAL = 60 * 1000 // Check every 60 seconds
const WARNING_THRESHOLD = 5 * 60 // Warn at 5 minutes remaining

interface SessionStatus {
  authenticated: boolean
  remainingTime: number
  shouldWarn: boolean
}

export default function SessionKeepalive() {
  const { data: session, update } = useSession()
  const [lastCheck, setLastCheck] = useState<number>(Date.now())
  const [hasWarned, setHasWarned] = useState(false)

  const checkSessionStatus = useCallback(async () => {
    if (!session) return

    try {
      const response = await fetch('/api/auth/session-status')
      const data: SessionStatus = await response.json()

      if (!data.authenticated) {
        // Session expired
        toast.error('Your session has expired. Please log in again.')
        window.location.href = '/admin/login?expired=true'
        return
      }

      // Show warning if approaching timeout
      if (data.shouldWarn && !hasWarned) {
        const minutes = Math.floor(data.remainingTime / 60)
        toast.error(
          `Your session will expire in ${minutes} minute${minutes !== 1 ? 's' : ''} due to inactivity.`,
          { duration: 10000 }
        )
        setHasWarned(true)
      }

      // Reset warning flag if we're back above threshold
      if (!data.shouldWarn && hasWarned) {
        setHasWarned(false)
      }

    } catch (error) {
      console.error('[KEEPALIVE] Failed to check session status:', error)
    }
  }, [session, hasWarned])

  // Update session on user activity
  const handleActivity = useCallback(() => {
    const now = Date.now()
    // Only update if more than 1 minute has passed since last check
    if (now - lastCheck > 60000) {
      setLastCheck(now)
      update() // Triggers NextAuth session update
      setHasWarned(false) // Reset warning on activity
    }
  }, [lastCheck, update])

  // Set up activity listeners
  useEffect(() => {
    if (!session) return

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']
    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [session, handleActivity])

  // Periodic session status check
  useEffect(() => {
    if (!session) return

    const interval = setInterval(checkSessionStatus, CHECK_INTERVAL)
    return () => clearInterval(interval)
  }, [session, checkSessionStatus])

  return null // This component doesn't render anything
}
