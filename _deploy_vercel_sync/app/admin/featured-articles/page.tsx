'use client'

import { useState, useEffect } from 'react'
import { Plus, Save, X, Star, Image as ImageIcon, Trash2 } from 'lucide-react'
import type { FeaturedArticle } from '@/lib/featured/featured-articles-db'
import type { Language } from '@/lib/sia-news/types'

const DEFAULT_LANG: Language = 'en'

export default function FeaturedArticlesAdmin() {
  const [articles, setArticles] = useState<FeaturedArticle[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingArticle, setEditingArticle] = useState<FeaturedArticle | null>(null)
  const [language, setLanguage] = useState<Language>(DEFAULT_LANG)

  const [formData, setFormData] = useState({
    id: '',
    slug: '',
    title: '',
    summary: '',
    imageUrl: '',
    category: 'CRYPTO' as 'CRYPTO' | 'AI' | 'STOCKS' | 'MACRO' | 'TECH',
    language: DEFAULT_LANG as Language,
    readingTime: 5,
    featuredPriority: 2 as 1 | 2 | 3,
    expertName: 'Dr. Anya Chen',
    expertTitle: 'Chief Blockchain Architect',
    tags: ''
  })

  useEffect(() => {
    loadArticles()
  }, [language])

  async function loadArticles() {
    try {
      const response = await fetch(`/api/featured-articles?language=${language}&limit=10`)
      const data = await response.json()
      if (data.success) setArticles(data.articles || [])
    } catch (error) {
      console.error('Failed to load articles:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const article: Partial<FeaturedArticle> = {
        id: formData.id || `featured-${Date.now()}`,
        slug: formData.slug,
        title: formData.title,
        summary: formData.summary,
        imageUrl: formData.imageUrl,
        category: formData.category,
        language: formData.language,
        readingTime: formData.readingTime,
        featuredPriority: formData.featuredPriority,
        expertByline: {
          name: formData.expertName,
          title: formData.expertTitle,
          bio: 'Expert analyst',
          profileUrl: '/experts/anya-chen',
          imageUrl: '/experts/anya-chen.jpg',
          expertise: ['Cryptocurrency', 'Blockchain'],
          yearsExperience: 12
        },
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        publishedAt: new Date().toISOString(),
        featured: true,
        viewCount: Math.floor(Math.random() * 500) + 100
      }
      const response = await fetch('/api/featured-articles', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(article) })
      const data = await response.json()
      if (data.success) {
        alert('Featured article saved successfully!')
        setShowForm(false)
        resetForm()
        loadArticles()
      } else {
        alert('Failed to save article: ' + data.error)
      }
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save article')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this featured article?')) return
    try {
      const response = await fetch(`/api/featured-articles?id=${id}`, { method: 'DELETE' })
      const data = await response.json()
      if (data.success) {
        alert('Article deleted successfully!')
        loadArticles()
      } else alert('Failed to delete article: ' + data.error)
    } catch (error) {
      console.error('Delete error:', error)
      alert('Failed to delete article')
    }
  }

  function resetForm() {
    setFormData({
      id: '',
      slug: '',
      title: '',
      summary: '',
      imageUrl: '',
      category: 'CRYPTO',
      language: language,
      readingTime: 5,
      featuredPriority: 2,
      expertName: 'Dr. Anya Chen',
      expertTitle: 'Chief Blockchain Architect',
      tags: ''
    })
    setEditingArticle(null)
  }

  return (
    <div className="min-h-screen bg-[#020203] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic mb-2">Featured Articles Manager</h1>
            <p className="text-slate-400">Manage homepage featured stories</p>
          </div>
          <div className="flex items-center gap-4">
            <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className="px-4 py-2 bg-black/40 border border-white/10 rounded-xl text-white text-sm">
              <option value="en">EN</option>
              <option value="tr">TR</option>
              <option value="de">DE</option>
              <option value="fr">FR</option>
              <option value="es">ES</option>
              <option value="ru">RU</option>
              <option value="ar">AR</option>
              <option value="jp">JP</option>
              <option value="zh">ZH</option>
            </select>
            <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-xl font-bold uppercase tracking-wider text-sm transition-colors">
              {showForm ? <X size={20} /> : <Plus size={20} />}
              {showForm ? 'Cancel' : 'Add Featured Article'}
            </button>
          </div>
        </div>

        {showForm && (
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 mb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Title</label>
                  <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Slug</label>
                  <input type="text" value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none" placeholder="bitcoin-analysis-2026" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Summary</label>
                  <textarea value={formData.summary} onChange={(e) => setFormData({ ...formData, summary: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none h-24" required />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Image URL</label>
                  <input type="url" value={formData.imageUrl} onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none" placeholder="https://images.unsplash.com/..." required />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Category</label>
                  <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value as any })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none">
                    <option value="CRYPTO">Crypto</option>
                    <option value="AI">AI</option>
                    <option value="STOCKS">Stocks</option>
                    <option value="MACRO">Macro</option>
                    <option value="TECH">Tech</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Language</label>
                  <select value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value as Language })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none">
                    <option value="en">EN</option>
                    <option value="tr">TR</option>
                    <option value="de">DE</option>
                    <option value="fr">FR</option>
                    <option value="es">ES</option>
                    <option value="ru">RU</option>
                    <option value="ar">AR</option>
                    <option value="jp">JP</option>
                    <option value="zh">ZH</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Priority</label>
                  <select value={formData.featuredPriority} onChange={(e) => setFormData({ ...formData, featuredPriority: parseInt(e.target.value) as any })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none">
                    <option value="1">1 - Hero (Large)</option>
                    <option value="2">2 - Secondary (Top)</option>
                    <option value="3">3 - Secondary (Bottom)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Reading Time (min)</label>
                  <input type="number" value={formData.readingTime} onChange={(e) => setFormData({ ...formData, readingTime: parseInt(e.target.value) })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none" min={1} max={60} />
                </div>
                <div>
                  <label className="block text-sm font-bold mb-2 uppercase tracking-wider">Tags (comma-separated)</label>
                  <input type="text" value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none" placeholder="bitcoin, crypto, analysis" />
                </div>
              </div>
              <button type="submit" className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-blue-600 hover:bg-blue-700 rounded-xl font-black uppercase tracking-wider transition-colors">
                <Save size={20} />
                Save Featured Article
              </button>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading...</div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 text-slate-400">No featured articles yet. Click &quot;Add Featured Article&quot; to create one.</div>
          ) : (
            articles.map((article) => (
              <div key={article.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-blue-500/40 transition-all">
                <div className="flex gap-6">
                  <div className="w-48 h-32 rounded-xl overflow-hidden bg-black/40 shrink-0">
                    {article.imageUrl ? <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-600"><ImageIcon size={32} /></div>}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <span className="px-3 py-1 bg-blue-600 rounded-full text-xs font-black uppercase">{article.category}</span>
                          <span className="px-3 py-1 bg-emerald-600 rounded-full text-xs font-black uppercase flex items-center gap-1"><Star size={12} /> Priority {article.featuredPriority}</span>
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">{article.title}</h3>
                        <p className="text-sm text-slate-400 line-clamp-2">{article.summary}</p>
                      </div>
                      <button onClick={() => handleDelete(article.id)} className="p-2 bg-red-600/20 hover:bg-red-600 rounded-lg transition-colors"><Trash2 size={18} /></button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span>{article.readingTime} min read</span>
                      <span>•</span>
                      <span>{article.viewCount} views</span>
                      <span>•</span>
                      <span>{article.expertByline?.name}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

