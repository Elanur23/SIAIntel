/**
 * Live Blog Management Dashboard
 * 
 * Admin interface for managing LiveBlogPosting content
 */

'use client'

import { useState, useEffect } from 'react'
import { Radio, Pause, Square, Plus, RefreshCw, Trash2 } from 'lucide-react'

interface LiveBlogMetadata {
  articleId: string
  status: 'active' | 'paused' | 'ended'
  coverageStartTime: string
  coverageEndTime?: string
  updateCount: number
  lastUpdateTime: string
  isLive: boolean
}

export default function LiveBlogManagementPage() {
  const [liveBlogs, setLiveBlogs] = useState<LiveBlogMetadata[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBlog, setSelectedBlog] = useState<string | null>(null)
  
  // New live blog form
  const [newArticleId, setNewArticleId] = useState('')
  
  // Update form
  const [updateHeadline, setUpdateHeadline] = useState('')
  const [updateContent, setUpdateContent] = useState('')
  const [updateAuthor, setUpdateAuthor] = useState('SIA Live Analysis')

  useEffect(() => {
    loadLiveBlogs()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadLiveBlogs, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadLiveBlogs = async () => {
    try {
      const response = await fetch('/api/sia-news/live-blog?action=active')
      const data = await response.json()
      
      if (data.success) {
        setLiveBlogs(data.data.liveBlogs || [])
      }
    } catch (error) {
      console.error('Failed to load live blogs:', error)
    } finally {
      setLoading(false)
    }
  }

  const startLiveBlog = async () => {
    if (!newArticleId.trim()) {
      alert('Please enter an article ID')
      return
    }

    try {
      const response = await fetch('/api/sia-news/live-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          articleId: newArticleId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('✅ Live coverage started!')
        setNewArticleId('')
        loadLiveBlogs()
      } else {
        alert(`❌ Failed: ${data.error}`)
      }
    } catch (error) {
      alert('❌ Failed to start live coverage')
      console.error(error)
    }
  }

  const addUpdate = async () => {
    if (!selectedBlog || !updateHeadline.trim() || !updateContent.trim()) {
      alert('Please fill in all fields')
      return
    }

    try {
      const response = await fetch('/api/sia-news/live-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update',
          articleId: selectedBlog,
          headline: updateHeadline,
          content: updateContent,
          author: updateAuthor
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('✅ Update added!')
        setUpdateHeadline('')
        setUpdateContent('')
        loadLiveBlogs()
      } else {
        alert(`❌ Failed: ${data.error}`)
      }
    } catch (error) {
      alert('❌ Failed to add update')
      console.error(error)
    }
  }

  const pauseLiveBlog = async (articleId: string) => {
    try {
      const response = await fetch('/api/sia-news/live-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pause',
          articleId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('⏸️ Live coverage paused')
        loadLiveBlogs()
      }
    } catch (error) {
      alert('❌ Failed to pause')
      console.error(error)
    }
  }

  const resumeLiveBlog = async (articleId: string) => {
    try {
      const response = await fetch('/api/sia-news/live-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resume',
          articleId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('▶️ Live coverage resumed')
        loadLiveBlogs()
      }
    } catch (error) {
      alert('❌ Failed to resume')
      console.error(error)
    }
  }

  const endLiveBlog = async (articleId: string) => {
    if (!confirm('Are you sure you want to end this live coverage?')) {
      return
    }

    try {
      const response = await fetch('/api/sia-news/live-blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'end',
          articleId
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('⏹️ Live coverage ended')
        loadLiveBlogs()
      }
    } catch (error) {
      alert('❌ Failed to end coverage')
      console.error(error)
    }
  }

  const formatTime = (isoString: string): string => {
    const date = new Date(isoString)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-800 rounded w-1/4 mb-8"></div>
            <div className="h-64 bg-gray-800 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Radio className="w-8 h-8 text-red-500" />
              Live Blog Management
            </h1>
            <p className="text-gray-400 mt-2">
              Manage LiveBlogPosting content for Google's "LIVE" badge
            </p>
          </div>
          
          <button
            onClick={loadLiveBlogs}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Start New Live Blog */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Plus className="w-5 h-5 text-green-500" />
            Start New Live Coverage
          </h2>
          
          <div className="flex gap-4">
            <input
              type="text"
              value={newArticleId}
              onChange={(e) => setNewArticleId(e.target.value)}
              placeholder="Enter Article ID"
              className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-red-500"
            />
            
            <button
              onClick={startLiveBlog}
              className="px-6 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors"
            >
              Start Live Coverage
            </button>
          </div>
        </div>

        {/* Active Live Blogs */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-bold mb-4">
            Active Live Blogs ({liveBlogs.length})
          </h2>
          
          {liveBlogs.length === 0 ? (
            <p className="text-gray-400 text-center py-8">
              No active live blogs. Start one above!
            </p>
          ) : (
            <div className="space-y-4">
              {liveBlogs.map((blog) => (
                <div
                  key={blog.articleId}
                  className={`
                    p-4 rounded-lg border-2 transition-all cursor-pointer
                    ${selectedBlog === blog.articleId 
                      ? 'border-red-500 bg-gray-900' 
                      : 'border-gray-700 hover:border-gray-600'}
                  `}
                  onClick={() => setSelectedBlog(blog.articleId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {/* Status badge */}
                        {blog.isLive ? (
                          <span className="flex items-center gap-1.5 px-2 py-1 bg-red-600 rounded text-xs font-bold">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                            LIVE
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-gray-700 rounded text-xs font-bold">
                            {blog.status.toUpperCase()}
                          </span>
                        )}
                        
                        <span className="font-mono text-sm text-gray-400">
                          {blog.articleId}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-400">Updates:</span>
                          <span className="ml-2 font-bold">{blog.updateCount}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Started:</span>
                          <span className="ml-2">{formatTime(blog.coverageStartTime)}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Last Update:</span>
                          <span className="ml-2">{formatTime(blog.lastUpdateTime)}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex gap-2">
                      {blog.status === 'active' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            pauseLiveBlog(blog.articleId)
                          }}
                          className="p-2 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
                          title="Pause"
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}
                      
                      {blog.status === 'paused' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            resumeLiveBlog(blog.articleId)
                          }}
                          className="p-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
                          title="Resume"
                        >
                          <Radio className="w-4 h-4" />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          endLiveBlog(blog.articleId)
                        }}
                        className="p-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                        title="End Coverage"
                      >
                        <Square className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add Update Form */}
        {selectedBlog && (
          <div className="bg-gray-800 rounded-lg p-6 border border-red-500">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-red-500" />
              Add Update to {selectedBlog}
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold mb-2">Headline</label>
                <input
                  type="text"
                  value={updateHeadline}
                  onChange={(e) => setUpdateHeadline(e.target.value)}
                  placeholder="Breaking: Bitcoin surges past $70,000"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Content</label>
                <textarea
                  value={updateContent}
                  onChange={(e) => setUpdateContent(e.target.value)}
                  placeholder="Detailed update content..."
                  rows={4}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-bold mb-2">Author</label>
                <input
                  type="text"
                  value={updateAuthor}
                  onChange={(e) => setUpdateAuthor(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-red-500"
                />
              </div>
              
              <button
                onClick={addUpdate}
                className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-bold transition-colors"
              >
                Add Update
              </button>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6">
          <h3 className="text-lg font-bold mb-3 text-blue-400">📘 How to Use</h3>
          <ol className="space-y-2 text-sm text-gray-300">
            <li>1. Enter an article ID and click "Start Live Coverage"</li>
            <li>2. Select the live blog from the list</li>
            <li>3. Add updates as events unfold</li>
            <li>4. Pause/Resume coverage as needed</li>
            <li>5. End coverage when the event concludes</li>
            <li>6. Google will display the red "LIVE" badge in search results</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

