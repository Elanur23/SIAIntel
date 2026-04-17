'use client'

import { useState } from 'react'

/**
 * SIAINTEL CONTACT PAGE
 * Professional communication portal for tips, legal, and advertising.
 */
export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    category: 'general'
  })
  const [submitted, setSubmitted] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setFormData({ name: '', email: '', subject: '', message: '', category: 'general' })
      setSubmitted(false)
    }, 3000)
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white py-12 px-4 font-sans selection:bg-blue-600">
      <div className="max-w-4xl mx-auto">

        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-900 text-white rounded-[3rem] shadow-2xl p-12 mb-12 border border-white/10">
          <h1 className="text-5xl font-black uppercase tracking-tighter italic mb-4 text-white">Contact Command</h1>
          <p className="text-xl text-blue-100/80">SIAINTEL Global Intelligence Network — Submit tips, report errors, or request institutional access.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Info */}
          <div className="lg:col-span-1">
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 space-y-8 backdrop-blur-xl">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Intelligence Tips</h3>
                <a href="mailto:tips@siaintel.com" className="text-sm font-bold hover:text-blue-400 transition-colors">tips@siaintel.com</a>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Corrections</h3>
                <a href="mailto:corrections@siaintel.com" className="text-sm font-bold hover:text-blue-400 transition-colors">corrections@siaintel.com</a>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Advertising</h3>
                <a href="mailto:ads@siaintel.com" className="text-sm font-bold hover:text-blue-400 transition-colors">ads@siaintel.com</a>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-500 mb-2">Legal/DMCA</h3>
                <a href="mailto:legal@siaintel.com" className="text-sm font-bold hover:text-blue-400 transition-colors">legal@siaintel.com</a>
              </div>

              <div className="pt-6 border-t border-white/5">
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white/40 mb-4">Network Nodes</h3>
                <div className="flex gap-3">
                  {['X', 'IN', 'TG'].map(node => (
                    <div key={node} className="w-10 h-10 bg-white/5 border border-white/10 rounded-full flex items-center justify-center text-[10px] font-black hover:bg-blue-600 transition-all cursor-pointer">
                      {node}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 backdrop-blur-xl">
              <h2 className="text-2xl font-black uppercase italic mb-6">Dispatch Message</h2>
              
              {submitted ? (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-10 text-center space-y-4">
                  <div className="text-4xl">⚡</div>
                  <h3 className="text-lg font-black text-emerald-400 uppercase">Transmission Received</h3>
                  <p className="text-sm text-slate-400">Your signal has been routed to the appropriate department.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <input
                      type="text" name="name" value={formData.name} onChange={handleChange} required
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                      placeholder="Operator Name"
                    />
                    <input
                      type="email" name="email" value={formData.email} onChange={handleChange} required
                      className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none"
                      placeholder="Secure Email"
                    />
                  </div>

                  <select
                    name="category" value={formData.category} onChange={handleChange}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none appearance-none"
                  >
                    <option value="general">General Transmission</option>
                    <option value="news-tip">Intelligence Tip</option>
                    <option value="advertising">Institutional Partnership</option>
                    <option value="feedback">System Feedback</option>
                  </select>

                  <textarea
                    name="message" value={formData.message} onChange={handleChange} required rows={6}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-blue-500 outline-none resize-none"
                    placeholder="Provide detailed intelligence or inquiry..."
                  />

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase py-4 rounded-2xl transition-all shadow-xl shadow-blue-900/20 active:scale-[0.98]"
                  >
                    Send Dispatch
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white/[0.02] border border-white/5 rounded-[3.5rem] p-10">
          <h2 className="text-2xl font-black uppercase italic mb-8 border-l-4 border-blue-600 pl-6 text-white">Knowledge Base FAQ</h2>
          <div className="space-y-8">
            <div className="group">
              <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-2 group-hover:text-blue-300 transition-colors">How do I submit an anonymous tip?</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Route your intelligence to tips@siaintel.com. We support encrypted PGP transmissions for high-stakes information.
                Our team will verify the node before publication.
              </p>
            </div>
            <div className="group">
              <h3 className="text-sm font-black text-blue-400 uppercase tracking-widest mb-2 group-hover:text-blue-300 transition-colors">Institutional Advertising at SIAINTEL</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                We offer targeted exposure to institutional investors. Contact ads@siaintel.com for our media kit and global reach metrics.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

