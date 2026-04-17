/**
 * Live Blog Updates Component
 * 
 * Displays real-time updates for LiveBlogPosting articles
 * Auto-refreshes to show new updates
 */

'use client'

import { useEffect, useState } from 'react'
import { Clock, TrendingUp } from 'lucide-react'

interface LiveBlogUpdate {
  id: string
  headline: string
  articleBody: string
  datePublished: string
  author?: string
  image?: {
    url: string
    caption?: string
  }
  position: number
}

interface LiveBlogUpdatesProps {
  articleId: string
  language?: string
  autoRefresh?: boolean
  refreshInterval?: number // milliseconds
}

export default function LiveBlogUpdates({
  articleId,
  language = 'en',
  autoRefresh = true,
  refreshInterval = 30000
}: LiveBlogUpdatesProps) {
  const [updates, setUpdates] = useState<LiveBlogUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [newUpdateCount, setNewUpdateCount] = useState(0)

  useEffect(() => {
    // Load initial updates
    loadUpdates()

    // Auto-refresh if enabled
    if (autoRefresh) {
      const interval = setInterval(() => {
        loadUpdates(true)
      }, refreshInterval)

      return () => clearInterval(interval)
    }
  }, [articleId, autoRefresh, refreshInterval])

  const loadUpdates = async (silent = false) => {
    try {
      if (!silent) setLoading(true)

      const response = await fetch(`/api/sia-news/live-blog?action=updates&articleId=${articleId}`)
      const data = await response.json()

      if (data.success && data.data.updates) {
        const newUpdates = data.data.updates

        // Check for new updates
        if (silent && updates.length > 0 && newUpdates.length > updates.length) {
          setNewUpdateCount(newUpdates.length - updates.length)
          
          // Clear notification after 5 seconds
          setTimeout(() => setNewUpdateCount(0), 5000)
        }

        setUpdates(newUpdates)
      }
    } catch (error) {
      console.error('[LiveBlogUpdates] Failed to load updates:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) {
      return language === 'tr' ? 'Az önce' : 'Just now'
    } else if (diffMins < 60) {
      return language === 'tr' ? `${diffMins} dakika önce` : `${diffMins} min ago`
    } else {
      const hours = date.getHours().toString().padStart(2, '0')
      const minutes = date.getMinutes().toString().padStart(2, '0')
      return `${hours}:${minutes}`
    }
  }

  const titles: Record<string, string> = {
    en: 'Live Updates',
    tr: 'Canlı Güncellemeler',
    de: 'Live-Updates',
    fr: 'Mises à jour en direct',
    es: 'Actualizaciones en vivo',
    ru: 'Обновления в реальном времени',
    ar: 'التحديثات المباشرة',
    jp: 'ライブアップデート',
    zh: '实时更新'
  }

  const newUpdateLabels: Record<string, string> = {
    en: 'new update',
    tr: 'yeni güncelleme',
    de: 'neue Aktualisierung',
    fr: 'nouvelle mise à jour',
    es: 'nueva actualización',
    ru: 'новое обновление',
    ar: 'تحديث جديد',
    jp: '新しい更新',
    zh: '新更新'
  }

  if (loading && updates.length === 0) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-800 rounded w-1/4"></div>
        <div className="h-32 bg-gray-800 rounded"></div>
        <div className="h-32 bg-gray-800 rounded"></div>
      </div>
    )
  }

  if (updates.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-red-500" />
          {titles[language] || titles.en}
        </h2>

        {/* New update notification */}
        {newUpdateCount > 0 && (
          <div className="animate-bounce bg-red-600 text-white px-3 py-1 rounded-full text-sm font-bold">
            +{newUpdateCount} {newUpdateLabels[language] || newUpdateLabels.en}
          </div>
        )}
      </div>

      {/* Updates timeline */}
      <div className="space-y-4">
        {updates.map((update, index) => (
          <div
            key={update.id}
            className={`
              relative border-l-4 border-red-500 pl-6 pb-6
              ${index === 0 ? 'animate-fadeIn' : ''}
            `}
          >
            {/* Timeline dot */}
            <div className="absolute -left-2 top-0 w-4 h-4 bg-red-500 rounded-full border-4 border-gray-900"></div>

            {/* Timestamp */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Clock className="w-4 h-4" />
              <span>{formatTime(update.datePublished)}</span>
              {index === 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-600 text-white text-xs rounded-full font-bold">
                  {language === 'tr' ? 'YENİ' : 'NEW'}
                </span>
              )}
            </div>

            {/* Update headline */}
            <h3 className="text-lg font-bold text-white mb-2">
              {update.headline}
            </h3>

            {/* Update content */}
            <div className="text-gray-300 leading-relaxed">
              {update.articleBody}
            </div>

            {/* Update image */}
            {update.image && (
              <div className="mt-4">
                <img
                  src={update.image.url}
                  alt={update.image.caption || update.headline}
                  className="rounded-lg w-full max-w-2xl"
                />
                {update.image.caption && (
                  <p className="text-sm text-gray-400 mt-2 italic">
                    {update.image.caption}
                  </p>
                )}
              </div>
            )}

            {/* Author */}
            {update.author && (
              <div className="mt-3 text-sm text-gray-500">
                {language === 'tr' ? 'Yazar' : 'By'}: {update.author}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Auto-refresh indicator */}
      {autoRefresh && (
        <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-800">
          {language === 'tr' 
            ? '🔄 Otomatik güncelleme aktif' 
            : '🔄 Auto-refreshing'}
        </div>
      )}
    </div>
  )
}
