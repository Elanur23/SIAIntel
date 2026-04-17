/**
 * Glossary Manager Page
 */

import Link from 'next/link'

export const metadata = {
  title: 'Glossary Manager - SIA Intelligence',
}

export default function GlossaryPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/admin/distribution" 
            className="text-blue-500 text-sm mb-2 inline-block hover:underline"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            GLOSSARY_MANAGER
          </h1>
          <p className="text-slate-400 text-sm">
            Terminology memory for 9 languages
          </p>
        </div>
        
        <div className="bg-white/5 rounded-2xl p-8 border border-white/10">
          <p className="text-slate-400 text-center">
            Glossary management UI - Phase 2 Foundation
          </p>
          <p className="text-slate-500 text-sm text-center mt-2">
            Full implementation in Phase 3
          </p>
        </div>
      </div>
    </div>
  )
}
