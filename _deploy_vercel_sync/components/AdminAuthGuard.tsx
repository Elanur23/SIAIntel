'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AdminAuthGuardProps {
  children: React.ReactNode
}

export default function AdminAuthGuard({ children }: AdminAuthGuardProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check if already authenticated
    const authToken = localStorage.getItem('sia_admin_auth')
    if (authToken === 'authenticated') {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Simple password check (in production, use proper auth)
    const adminPassword = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'sia2026'
    
    if (password === adminPassword) {
      localStorage.setItem('sia_admin_auth', 'authenticated')
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Yanlış şifre')
      setPassword('')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('sia_admin_auth')
    setIsAuthenticated(false)
    setPassword('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Yükleniyor...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="text-4xl mb-4">🔐</div>
            <h1 className="text-2xl font-bold text-white mb-2">SIA Admin Girişi</h1>
            <p className="text-slate-400">Devam etmek için şifrenizi girin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Admin Şifresi
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Şifrenizi girin"
                autoFocus
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02]"
            >
              Giriş Yap
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-slate-500">
            <p>Varsayılan şifre: <code className="bg-slate-900/50 px-2 py-1 rounded">sia2026</code></p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Logout button in top right */}
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={handleLogout}
          className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
        >
          🚪 Çıkış Yap
        </button>
      </div>
      {children}
    </>
  )
}
