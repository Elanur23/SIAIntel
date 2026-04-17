'use client';

import React, { useEffect, useState } from 'react';
import {
  ArrowLeft, Loader2, Brain, Globe, Languages, Zap
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ARTICLE_LANGS, ARTICLE_LANGUAGE_LABELS } from '@/lib/warroom/article-localization';
import { useNanoAnalyst } from '@/lib/hooks/useNanoAnalyst';

const ALL_LOCALES = ARTICLE_LANGS;

function getLocalizedField(data: any, field: 'title' | 'summary', locale: string) {
  if (!data) return '';

  const nested = data[field]?.[locale];
  if (typeof nested === 'string' && nested.trim()) return nested;

  const suffix = locale.charAt(0).toUpperCase() + locale.slice(1);
  const flat = data[`${field}${suffix}`];
  if (typeof flat === 'string' && flat.trim()) return flat;

  return data[`${field}En`] || data[field]?.en || '';
}

type ManualEntryEditorProps = {
  lang?: string;
};

export default function ManualEntryEditor({ lang }: ManualEntryEditorProps) {
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('tr');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const { isNanoAvailable, isNanoAnalyzing, analyzeLocally } = useNanoAnalyst();
  const [nanoInsight, setNanoInsight] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [articleData, setArticleData] = useState<any>(null);

  useEffect(() => { setMounted(true); }, []);

  const adminHref = lang ? `/${lang}/admin` : '/admin';

  const handleHaberlestirVeKaydet = async () => {
    if (!title) { alert('Lutfen once bir baslik girin!'); return; }

    setIsAiGenerating(true);

    // START LOCAL NANO ANALYSIS IN PARALLEL IF AVAILABLE
    if (isNanoAvailable) {
      analyzeLocally(title, 'Quick market impact and sentiment preview')
        .then(res => setNanoInsight(res))
        .catch((e: Error) => console.warn('[NANO_ANALYST] Local analysis failed:', e.message));
    }

    try {
      const res = await fetch('/api/sia-gemini/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: { source: 'MANUAL', type: 'NEWS', data: { title } } })
      });
      const result = await res.json();

      if (result.success && result.data) {
        const aiData = result.data;

        const saveRes = await fetch('/api/war-room/save', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: aiData.title,
            summary: aiData.summary,
            siaInsight: aiData.siaInsight,
            riskShield: aiData.riskShield,
            content: aiData.content,
            socialSnippet: {
              en: aiData.socialSnippetEn,
              tr: aiData.socialSnippetTr,
            },
            sentiment: aiData.sentiment,
            confidence: aiData.confidence,
            marketImpact: aiData.marketImpact,
            imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800&auto=format&fit=crop',
            status: 'published'
          })
        });

        if (saveRes.ok) {
          setArticleData(aiData);
          alert('SIA istihbarati 9 dilde olusturuldu ve veritabanina kaydedildi.');
        }
      } else {
        alert(`AI Hatasi: ${result.error || 'Icerik uretilemedi.'}`);
      }
    } catch {
      alert('Baglanti hatasi!');
    } finally {
      setIsAiGenerating(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-[#020203] text-white p-6 lg:p-12 font-sans selection:bg-blue-600">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/5 pb-10">
          <div className="flex items-center gap-4">
            <Link href={adminHref} className="p-2 hover:bg-white/5 rounded-2xl text-gray-500 transition-all"><ArrowLeft size={24} /></Link>
            <div>
              <h1 className="text-3xl font-black italic tracking-tighter uppercase leading-none text-blue-500">SIA_COMMAND_CENTER</h1>
              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.4em] mt-2">Autonomous Intelligence Node v18</p>
            </div>
          </div>

          <button
            onClick={handleHaberlestirVeKaydet}
            disabled={isAiGenerating}
            className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 px-12 py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all shadow-2xl shadow-blue-900/40 disabled:opacity-50"
          >
            {isAiGenerating ? <Loader2 size={18} className="animate-spin text-white" /> : <Brain size={18} />}
            {isAiGenerating ? 'ANALYZING...' : 'Haberlestir ve Yayinla'}
          </button>
        </div>

        <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {ALL_LOCALES.map((loc) => (
            <button
              key={loc}
              onClick={() => setActiveTab(loc)}
              className={`flex-1 min-w-[100px] py-3 rounded-xl text-[10px] font-black uppercase transition-all ${
                activeTab === loc ? 'bg-white text-black shadow-xl' : 'text-gray-500 hover:text-white'
              }`}
            >
              {ARTICLE_LANGUAGE_LABELS[loc]}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <label className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 ml-2">Istihbarat Basligi (Sinyal)</label>
              <textarea
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-8 text-3xl font-black outline-none focus:border-blue-500 transition-all placeholder:text-white/5 min-h-[150px]"
                placeholder="Haber basligini buraya girin..."
              />
            </div>

            <AnimatePresence mode="wait">
              {articleData ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-10 bg-gradient-to-br from-white/[0.03] to-transparent border border-white/10 rounded-[3rem] space-y-6"
                >
                  <div className="flex items-center gap-2 text-emerald-500 font-black text-[10px] uppercase tracking-widest">
                    Node [{activeTab.toUpperCase()}] Linked & Published
                  </div>
                  <h2 className="text-3xl font-black text-white leading-tight uppercase italic border-l-4 border-blue-600 pl-6">
                    {getLocalizedField(articleData, 'title', activeTab)}
                  </h2>
                  <p className="text-slate-400 text-lg leading-relaxed italic">
                    &quot;{getLocalizedField(articleData, 'summary', activeTab)}&quot;
                  </p>
                </motion.div>
              ) : (
                <div className="h-64 border border-dashed border-white/5 rounded-[3rem] flex items-center justify-center opacity-10">
                  <Languages size={48} />
                </div>
              )}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0A0A0C] border border-white/10 rounded-[2.5rem] p-8 space-y-8">
              <div className="flex items-center gap-3 text-blue-500">
                <Globe size={20} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Neural Metrics</span>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                  <span className="text-gray-500">Sentiment</span>
                  <span className="text-emerald-500 font-black">{articleData?.sentiment || 'AWAITING'}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] font-black uppercase">
                  <span className="text-gray-500">Accuracy</span>
                  <span className="text-white font-black">{articleData?.confidence || 0}%</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${articleData?.confidence || 0}%` }} className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]" />
                </div>
              </div>
            </div>

            <div className="p-8 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] flex flex-col gap-4 shadow-2xl">
              <p className="text-[10px] font-bold text-emerald-500/80 leading-relaxed uppercase tracking-wider">
                Veritabani senkronizasyonu aktif. Tum diller muhurlendi.
              </p>

              {isNanoAvailable && (
                <div className="pt-4 border-t border-emerald-500/10">
                  <div className="flex items-center gap-2 mb-2 text-[9px] font-black text-blue-400 uppercase tracking-widest">
                    <Zap size={12} className={isNanoAnalyzing ? 'animate-pulse' : ''} />
                    Local Gemini Nano Insight
                  </div>
                  <p className="text-[10px] text-slate-400 italic leading-relaxed">
                    {isNanoAnalyzing ? 'Analyzing locally...' : nanoInsight || 'Waiting for signal...'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}