/**
 * Live Blog Badge Component
 * 
 * Displays "LIVE" badge for active live blog coverage
 * Mimics Google's red "LIVE" badge in search results
 */

'use client'

import { useEffect, useState } from 'react'

interface LiveBlogBadgeProps {
  articleId: string
  language?: string
  className?: string
}

export default function LiveBlogBadge({ articleId, language = 'en', className = '' }: LiveBlogBadgeProps) {
  const [isLive, setIsLive] = useState(false)
  const [updateCount, setUpdateCount] = useState(0)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  useEffect(() => {
    // Check live status on mount
    checkLiveStatus()

    // Poll for updates every 30 seconds
    const interval = setInterval(checkLiveStatus, 30000)

    return () => clearInterval(interval)
  }, [articleId])

  const checkLiveStatus = async () => {
    try {
      const response = await fetch(`/api/sia-news/live-blog?action=status&articleId=${articleId}`)
      const data = await response.json()

      if (data.success && data.data) {
        setIsLive(data.data.isLive)
        setUpdateCount(data.data.updateCount)
        setLastUpdate(data.data.lastUpdateTime)
      }
    } catch (error) {
      console.error('[LiveBlogBadge] Failed to check status:', error)
    }
  }

  if (!isLive) {
    return null
  }

  const labels: Record<string, string> = {
    en: 'LIVE',
    tr: 'CANLI',
    de: 'LIVE',
    fr: 'EN DIRECT',
    es: 'EN VIVO',
    ru: 'ПРЯМОЙ ЭФИР',
    ar: 'مباشر',
    jp: 'ライブ',
    zh: '直播'
  }

  const updateLabels: Record<string, string> = {
    en: 'updates',
    tr: 'güncelleme',
    de: 'Updates',
    fr: 'mises à jour',
    es: 'actualizaciones',
    ru: 'обновления',
    ar: 'تحديثات',
    jp: '更新',
    zh: '更新'
  }

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Google-style LIVE badge */}
      <div className="relative inline-flex items-center gap-1.5 px-3 py-1 bg-red-600 rounded-md">
        {/* Pulsing dot */}
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
        </span>
        
        {/* LIVE text */}
        <span className="text-white text-xs font-bold tracking-wider">
          {labels[language] || labels.en}
        </span>
      </div>

      {/* Update count */}
      {updateCount > 0 && (
        <span className="text-xs text-gray-400">
          {updateCount} {updateLabels[language] || updateLabels.en}
        </span>
      )}
    </div>
  )
}
