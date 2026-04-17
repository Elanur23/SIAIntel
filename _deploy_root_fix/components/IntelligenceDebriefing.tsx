'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, ShieldCheck, Send, User, Lock, Terminal, Download, FileText } from 'lucide-react'
import { Locale, getDictionary } from '@/lib/i18n/dictionaries'

interface Debrief {
  id: string
  author: string
  role: string
  content: string
  timestamp: string
  verified: boolean
}

export default function IntelligenceDebriefing({ lang, articleId }: { lang: Locale, articleId: string }) {
  const dict = getDictionary(lang)
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Mock comments - In real app, fetch from database
  const [debriefs, setDebriefs] = useState<Debrief[]>([
    {
      id: '1',
      author: 'Sentinel_04',
      role: 'Macro Strategist',
      content: 'The liquidity mismatch mentioned in the report aligns with the overnight repo rate spikes we observed in the Asian session. High probability of systemic contagion if the gating continues.',
      timestamp: '2h ago',
      verified: true
    },
    {
      id: '2',
      author: 'Quant_Alpha',
      role: 'Senior Analyst',
      content: 'Technical indicators on ADBE suggest a hidden bullish divergence despite the macro gloom. Watching the $480 support level closely.',
      timestamp: '45m ago',
      verified: true
    }
  ])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!comment.trim()) return

    setIsSubmitting(true)
    // Simulate API call
    setTimeout(() => {
      const newDebrief: Debrief = {
        id: Math.random().toString(),
        author: 'Anonymous_Analyst',
        role: 'Field Analyst',
        content: comment,
        timestamp: 'Just now',
        verified: false
      }
      setDebriefs([newDebrief, ...debriefs])
      setComment('')
      setIsSubmitting(false)
    }, 1000)
  }

  const exportReport = () => {
    // Logic to generate/download report
    alert('Generating Intelligence Report (PDF)...')
  }

  return (
    <section className="mt-24 space-y-12">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600/20 rounded-2xl">
            <MessageSquare size={24} className="text-blue-500" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter">{dict.article.comments}</h2>
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em]">Node ID: {articleId}</p>
          </div>
        </div>

        <button
          onClick={exportReport}
          className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black text-white uppercase tracking-widest transition-all"
        >
          <Download size={14} className="text-blue-500" />
          {lang === 'tr' ? 'RAPORU DIŞA AKTAR' : 'EXPORT INTEL REPORT'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Comment Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 space-y-6">
            <div className="flex items-center gap-3 text-blue-500">
              <Terminal size={18} />
              <h3 className="text-xs font-black uppercase tracking-widest">{dict.article.writeComment}</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={lang === 'tr' ? 'İstihbarat verisi veya analiz ekleyin...' : 'Add intelligence data or analysis...'}
                className="w-full h-40 bg-black/40 border border-white/5 rounded-2xl p-4 text-sm text-slate-300 placeholder:text-white/10 focus:border-blue-500/50 focus:ring-0 transition-all resize-none font-medium italic"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] font-black text-white/20 uppercase">
                  <Lock size={10} />
                  SECURE_UPLINK_READY
                </div>
                <button
                  disabled={isSubmitting || !comment.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:hover:bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-600/20"
                >
                  {isSubmitting ? 'UPLOADING...' : <><Send size={14} /> {lang === 'tr' ? 'İLET' : 'TRANSMIT'}</>}
                </button>
              </div>
            </form>
          </div>

          <div className="p-6 border border-amber-500/10 bg-amber-500/5 rounded-[2rem] flex items-start gap-4">
            <ShieldCheck size={20} className="text-amber-500 mt-1 shrink-0" />
            <p className="text-[10px] text-slate-500 leading-relaxed italic">
              {lang === 'tr'
                ? 'UYARI: Tüm bilgi notları SIA Nöral Ağı tarafından doğruluk testine tabi tutulur. Yanıltıcı bilgi paylaşımı düğüm erişiminizin kalıcı olarak askıya alınmasına neden olabilir.'
                : 'NOTICE: All debriefings are subject to accuracy testing by the SIA Neural Network. Sharing misleading info may result in permanent node suspension.'}
            </p>
          </div>
        </div>

        {/* Debriefs List */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence>
            {debriefs.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-white/10 border border-dashed border-white/5 rounded-[3rem]">
                <FileText size={48} className="mb-4 opacity-20" />
                <span className="text-xs font-black uppercase tracking-widest">{dict.article.noComments}</span>
              </div>
            ) : (
              debriefs.map((debrief, i) => (
                <motion.div
                  key={debrief.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/[0.02] border border-white/5 p-6 rounded-[2rem] space-y-4 hover:bg-white/[0.04] transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <User size={16} />
                      </div>
                      <div>
                        <span className="block text-[10px] font-black text-white uppercase tracking-widest">{debrief.author}</span>
                        <span className="text-[8px] font-bold text-blue-500/60 uppercase">{debrief.role}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {debrief.verified && (
                        <span className="flex items-center gap-1 text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded-full border border-emerald-500/20">
                          <ShieldCheck size={10} /> VERIFIED
                        </span>
                      )}
                      <span className="text-[9px] font-black text-white/10 uppercase">{debrief.timestamp}</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed font-medium italic pl-11">
                    "{debrief.content}"
                  </p>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
