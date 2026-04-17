/**
 * useWorkspaceWatcher Hook
 * Real-time monitoring of ai_workspace.json changes via SSE
 * 
 * Features:
 * - Automatic reconnection on disconnect
 * - File change detection
 * - Auto-refresh workspace data
 * - Optional auto-audit on changes
 * 
 * Usage:
 * const { isConnected, lastUpdate, error } = useWorkspaceWatcher({
 *   onFileChange: () => refetchWorkspace(),
 *   autoAudit: true
 * })
 */

import { useEffect, useRef, useState, useCallback } from 'react'

interface WorkspaceWatcherOptions {
  enabled?: boolean
  onFileChange?: () => void
  onConnected?: () => void
  onDisconnected?: () => void
  onError?: (error: string) => void
  autoReconnect?: boolean
  reconnectDelay?: number
}

interface WorkspaceWatcherReturn {
  isConnected: boolean
  lastUpdate: Date | null
  error: string | null
  reconnect: () => void
  disconnect: () => void
}

export function useWorkspaceWatcher(
  options: WorkspaceWatcherOptions = {}
): WorkspaceWatcherReturn {
  const {
    enabled = true,
    onFileChange,
    onConnected,
    onDisconnected,
    onError,
    autoReconnect = true,
    reconnectDelay = 3000,
  } = options

  const [isConnected, setIsConnected] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [error, setError] = useState<string | null>(null)

  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isManualDisconnectRef = useRef(false)

  const connect = useCallback(() => {
    if (!enabled || eventSourceRef.current) return

    console.log('[WORKSPACE_WATCHER] Connecting to SSE stream...')

    try {
      const eventSource = new EventSource('/api/watch-workspace')
      eventSourceRef.current = eventSource

      // Handle connection open
      eventSource.onopen = () => {
        console.log('[WORKSPACE_WATCHER] ✅ Connected')
        setIsConnected(true)
        setError(null)
        onConnected?.()
      }

      // Handle messages
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('[WORKSPACE_WATCHER] Message received:', data.type)

          switch (data.type) {
            case 'connected':
              console.log('[WORKSPACE_WATCHER] Initial connection established')
              break

            case 'file-changed':
              console.log('[WORKSPACE_WATCHER] 📡 File changed detected!')
              setLastUpdate(new Date(data.timestamp))
              onFileChange?.()
              break

            case 'heartbeat':
              // Keep-alive heartbeat
              break

            case 'error':
              console.error('[WORKSPACE_WATCHER] Server error:', data.message)
              setError(data.message)
              onError?.(data.message)
              break

            default:
              console.warn('[WORKSPACE_WATCHER] Unknown message type:', data.type)
          }
        } catch (err) {
          console.error('[WORKSPACE_WATCHER] Failed to parse message:', err)
        }
      }

      // Handle errors
      eventSource.onerror = (event) => {
        console.error('[WORKSPACE_WATCHER] ❌ Connection error')
        setIsConnected(false)
        eventSource.close()
        eventSourceRef.current = null

        if (!isManualDisconnectRef.current && autoReconnect) {
          console.log(`[WORKSPACE_WATCHER] Reconnecting in ${reconnectDelay}ms...`)
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, reconnectDelay)
        }

        onDisconnected?.()
      }
    } catch (err) {
      console.error('[WORKSPACE_WATCHER] Failed to create EventSource:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
      onError?.(err instanceof Error ? err.message : 'Connection failed')
    }
  }, [enabled, onFileChange, onConnected, onDisconnected, onError, autoReconnect, reconnectDelay])

  const disconnect = useCallback(() => {
    console.log('[WORKSPACE_WATCHER] Disconnecting...')
    isManualDisconnectRef.current = true

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }

    setIsConnected(false)
  }, [])

  const reconnect = useCallback(() => {
    console.log('[WORKSPACE_WATCHER] Manual reconnect triggered')
    disconnect()
    isManualDisconnectRef.current = false
    setTimeout(() => connect(), 100)
  }, [connect, disconnect])

  // Auto-connect on mount
  useEffect(() => {
    if (enabled) {
      connect()
    }

    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])

  return {
    isConnected,
    lastUpdate,
    error,
    reconnect,
    disconnect,
  }
}
