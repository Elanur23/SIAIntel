'use client'

import React, { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Zap,
  Settings,
  Database,
  Star,
  LogOut,
  ChevronRight,
  FileText,
  PlusSquare,
  BarChart3
} from 'lucide-react'

const menuItems = [
  { name: 'Dashboard', icon: LayoutDashboard, key: 'dashboard' },
  { name: 'Global Sync', icon: Database, key: 'sync' },
  { name: 'War Room', icon: Zap, key: 'warroom' },
  { name: 'Articles', icon: FileText, key: 'articles' },
  { name: 'Manual Entry', icon: PlusSquare, key: 'create' },
  { name: 'Featured', icon: Star, key: 'featured' },
  { name: 'Analytics', icon: BarChart3, key: 'analytics' },
  { name: 'Settings', icon: Settings, key: 'settings' },
]

function resolveAdminHref(pathname: string, key: string) {
  const match = pathname.match(/^\/(\w+)\/admin(?:\/|$)/)
  const langBase = match ? `/${match[1]}/admin` : '/en/admin'

  switch (key) {
    case 'dashboard': return langBase
    case 'sync': return `${langBase}/sync`
    case 'warroom': return `${langBase}/warroom`
    case 'articles': return `${langBase}/news`
    case 'create': return `${langBase}/create`
    case 'featured': return `${langBase}/featured-articles`
    case 'analytics': return `${langBase}/analytics`
    case 'settings': return `${langBase}/settings`
    default: return langBase
  }
}

export default function AdminShell({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? ''
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const isLoginPage = pathname.includes('/admin/login')

  if (isLoginPage) {
    return <>{children}</>
  }

  // Hydration hatasını önlemek için mounted kontrolü
  if (!mounted) {
    return (
      <div className="flex min-h-screen bg-[#050506] text-white font-mono">
        <aside className="w-64 border-r border-white/5 bg-black/40" />
        <main className="flex-1" />
      </div>
    )
  }

  async function doLogout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/en/admin/login'
  }

  return (
    <div className="flex min-h-screen bg-[#050506] text-white font-mono selection:bg-blue-600">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 bg-black/40 backdrop-blur-3xl flex flex-col shrink-0 fixed h-full z-50">
        <div className="p-8 border-b border-white/5 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
            <h1 className="text-xl font-black tracking-tighter text-white uppercase italic">SIA<span className="text-blue-600">INTEL</span></h1>
          </div>
          <p className="text-[8px] text-white/20 font-black uppercase tracking-[0.3em]">Command Center v4.3</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          <p className="px-4 py-2 text-[9px] font-black text-white/20 uppercase tracking-widest">Main Operations</p>
          {menuItems.map((item) => {
            const href = resolveAdminHref(pathname, item.key);
            const isActive = pathname === href || (item.key === 'dashboard' && (pathname.endsWith('/admin') || pathname.endsWith('/admin/')));

            return (
              <Link
                key={item.name}
                href={href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-blue-600/10 text-white border border-blue-500/20 shadow-lg shadow-blue-900/10'
                    : 'text-white/40 hover:bg-white/[0.03] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon
                    size={18}
                    className={isActive ? 'text-blue-500' : 'text-white/20 group-hover:text-blue-400 transition-colors'}
                  />
                  <span className="text-xs font-black uppercase tracking-tight">{item.name}</span>
                </div>
                {isActive && <ChevronRight size={12} className="text-blue-500" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-black/20">
          <button
            type="button"
            onClick={() => doLogout()}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-rose-500/60 hover:bg-rose-500/10 hover:text-rose-400 transition-all text-xs font-black uppercase tracking-widest"
          >
            <LogOut size={18} />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 pl-64">
        {children}
      </main>
    </div>
  )
}
