'use client'

import { useEffect, useState } from 'react'

interface DataSyncTimeProps {
  className?: string
  label?: string
  freezeOnLoad?: boolean
}

/**
 * DATA SYNC TIME COMPONENT
 * 
 * Displays real-time or frozen sync timestamp in terminal-style mono font.
 * Used to show data freshness across the intelligence terminal.
 * 
 * Props:
 * - className: Additional Tailwind classes
 * - label: Custom label (default: "LAST_SYNC:")
 * - freezeOnLoad: If true, timestamp freezes at page load (default: false)
 * 
 * Usage:
 * <DataSyncTime />
 * <DataSyncTime label="DATA_SYNC:" freezeOnLoad />
 * <DataSyncTime className="text-blue-400" />
 */
export default function DataSyncTime({ 
  className = '', 
  label = 'LAST_SYNC:',
  freezeOnLoad = false 
}: DataSyncTimeProps) {
  const [timestamp, setTimestamp] = useState<string>('')
  const [isFrozen, setIsFrozen] = useState(freezeOnLoad)

  useEffect(() => {
    // Initialize timestamp
    const updateTimestamp = () => {
      const now = new Date()
      const hours = String(now.getUTCHours()).padStart(2, '0')
      const minutes = String(now.getUTCMinutes()).padStart(2, '0')
      const seconds = String(now.getUTCSeconds()).padStart(2, '0')
      setTimestamp(`${hours}:${minutes}:${seconds} UTC`)
    }

    updateTimestamp()

    // If not frozen, update every second
    if (!isFrozen) {
      const interval = setInterval(updateTimestamp, 1000)
      return () => clearInterval(interval)
    }
  }, [isFrozen])

  if (!timestamp) return null

  return (
    <div className={`flex items-center gap-1.5 font-mono text-[10px] ${className}`}>
      <span className="text-white/40 uppercase tracking-wider">{label}</span>
      <span className="text-white/60 font-bold tabular-nums">{timestamp}</span>
    </div>
  )
}
