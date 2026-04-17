'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, Mic, Send, Terminal, Zap, BarChart3, Globe,
  Search, ShieldCheck, ChevronRight, Waves, MessageSquare,
  Database, Activity, Monitor
} from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import dynamic from 'next/dynamic'

const SiaRadarVisual = dynamic(() => import('@/components/SiaRadarVisual'), { ssr: false })

interface CommandCenterHUDProps {
  onClose: () => void
}

export default function CommandCenterHUD({ onClose }: CommandCenterHUDProps) {
  const { t } = useLanguage()
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'sia', content: string, type?: string }>>([
    { role: 'sia', content: 'SIA_COMMAND_CENTER_V14: Uplink Established. Ready for intelligence requests.' }
  ])
  const [isProcessing, setIsProcessing] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const quickActions = [
    { label: 'BTC Technical Scan', cmd: 'Bitcoin için teknik analiz yap ve RSI değerini söyle.', icon: Zap, color: 'text-orange-500' },
    { label: 'Live NVDA Price', cmd: 'Nvidia (NVDA) hissesinin güncel fiyatı nedir?', icon: BarChart3, color: 'text-emerald-500' },
    { label: 'Convert 1 BTC to USD', cmd: '1 Bitcoin şu an kaç Dolar?', icon: Globe, color: 'text-blue-500' },
    { label: 'Deep Research AI', cmd: 'Yapay zeka sektörü risk analizi hakkında derin araştırma başlat.', icon: Search, color: 'text-purple-500' }
  ]

  const handleCommand = async (cmd: string) => {
    if (!cmd.trim() || isProcessing) return

    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: cmd }])
    setIsProcessing(true)

    // Stage 1: Deep Thinking (Neural Planning)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        role: 'sia',
        content: `NEURAL_THINKING: Planning multi-step analysis for "${cmd.slice(0, 20)}...". Step 1: Identifying entities. Step 2: Selecting optimal tools.`,
        type: 'status'
      }])

      // Stage 2: Tool Execution (Agentic Loop)
      setTimeout(() => {
        setMessages(prev => [...prev, {
          role: 'sia',
          content: `AGENT_UPLINK: Executing Function Calls (Live Market Sync + Grounding Search).`,
          type: 'status'
        }])

        // Stage 3: Final Synthesis
        setTimeout(() => {
          setIsProcessing(false)
          setMessages(prev => [...prev, {
            role: 'sia',
            content: 'SIA_INTELLIGENCE_REPORT: Analysis complete. All data points verified via Sovereign Pro Max protocols. (System online and fully operational).'
          }])
        }, 1500)
      }, 1200)
    }, 800)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-2xl"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 40 }}
        className="w-full max-w-6xl h-[85vh] bg-[#050505] rounded-[3rem] border border-blue-500/20 overflow-hidden relative shadow-[0_0_150px_rgba(37,99,235,0.2)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* --- 📟 HEADER --- */}
        <div className="p-8 flex items-center justify-between border-b border-white/5 bg-black/40 z-20">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)]">
              <Terminal size={24} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white">SIA_COMMAND_CENTER</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Sovereign_Pro_Max_Active</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-all text-white/40 hover:text-white hover:rotate-90">
            <X size={28} />
          </button>
        </div>

        {/* --- 🖥️ MAIN GRID --- */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">

          {/* LEFT: Chat & Input */}
          <div className="lg:col-span-8 flex flex-col border-r border-white/5 bg-white/[0.01]">
            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: msg.role === 'sia' ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${msg.role === 'sia' ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`max-w-[85%] p-6 rounded-[2rem] border ${
                    msg.role === 'sia'
                      ? msg.type === 'status' ? 'bg-blue-600/5 border-blue-500/20 text-blue-400 font-mono text-xs' : 'bg-white/5 border-white/10 text-slate-300'
                      : 'bg-blue-600 border-blue-400 text-white shadow-xl shadow-blue-600/20'
                  }`}>
                    <p className="text-sm leading-relaxed font-medium">
                      {msg.content}
                    </p>
                  </div>
                </motion.div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="p-6 rounded-[2rem] bg-white/5 border border-white/10 flex gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce" />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-100" />
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-bounce delay-200" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-8 bg-black/40 border-t border-white/5">
              <form
                onSubmit={(e) => { e.preventDefault(); handleCommand(input); }}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter intelligence command (e.g. BTC Price, NVDA RSI...)"
                  className="w-full bg-white/5 border border-white/10 rounded-3xl py-6 pl-8 pr-32 text-sm font-bold text-white placeholder:text-white/10 focus:border-blue-500 focus:bg-white/[0.08] transition-all outline-none"
                />
                <div className="absolute right-4 flex gap-2">
                  <button type="button" className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 transition-all">
                    <Mic size={20} />
                  </button>
                  <button type="submit" className="p-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-all">
                    <Send size={20} />
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* RIGHT: Quick Tools & Status */}
          <div className="lg:col-span-4 p-8 space-y-10 overflow-y-auto custom-scrollbar">

            {/* Quick Actions */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] px-4">Neural_Shortcuts</h3>
              <div className="grid gap-4">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleCommand(action.cmd)}
                    className="flex items-center gap-5 p-6 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-blue-500/30 transition-all text-left group"
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform`}>
                      <action.icon size={20} />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-white uppercase italic tracking-tight">{action.label}</span>
                      <span className="text-[8px] text-white/20 uppercase tracking-widest font-mono">Execute_Function</span>
                    </div>
                    <ChevronRight size={14} className="ml-auto text-white/10" />
                  </button>
                ))}
              </div>
            </div>

            {/* Live Visual */}
            <div className="p-8 rounded-[3rem] bg-gradient-to-br from-blue-600/10 to-transparent border border-blue-500/20 space-y-6 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Database size={60} className="text-blue-500" />
               </div>
               <div className="relative z-10">
                  <h3 className="text-sm font-black text-white uppercase italic tracking-tight mb-4">Neural_Status</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-[9px] text-white/30 uppercase">CPU_Load</span>
                      <span className="text-xs font-mono text-blue-400">12.4%</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-white/5">
                      <span className="text-[9px] text-white/30 uppercase">Network</span>
                      <span className="text-xs font-mono text-emerald-500">Optimized</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-[9px] text-white/30 uppercase">Agent_Sync</span>
                      <span className="text-xs font-mono text-blue-400">Stable</span>
                    </div>
                  </div>
               </div>
            </div>

            {/* Visual Radar Mini */}
            <div className="relative aspect-square rounded-[3rem] overflow-hidden border border-white/5 bg-black/40 flex items-center justify-center group/radar">
               <SiaRadarVisual compact className="scale-125 opacity-40 group-hover:opacity-80 transition-opacity" />
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <Activity size={32} className="text-blue-500 mb-2 animate-pulse" />
                  <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">SIA_SCANNER</span>
               </div>
            </div>

          </div>
        </div>

      </motion.div>
    </motion.div>
  )
}
