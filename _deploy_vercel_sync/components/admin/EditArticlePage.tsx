'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { LEGAL_CONFIG } from '@/lib/compliance/legal-enforcer';
import { ARTICLE_LANGS, ARTICLE_LANGUAGE_LABELS, getArticleFieldKey, type ArticleLanguage } from '@/lib/warroom/article-localization';

type EditArticlePageProps = {
  id: string;
  basePath: string;
};

export default function EditArticlePage({ id, basePath }: EditArticlePageProps) {
  const router = useRouter();
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveLang] = useState<ArticleLanguage>('tr');

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        const res = await fetch(`/api/war-room/content?id=${id}`);
        const data = await res.json();
        if (data.success) setArticle(data.data);
      } catch (error) {
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchArticle();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/war-room/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...article, action: 'update' })
      });
      if (res.ok) {
        alert('Haber basariyla guncellendi!');
        router.push(basePath);
      }
    } catch {
      alert('Kaydetme hatasi!');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <Loader2 className="animate-spin text-yellow-500" size={48} />
      <p className="text-gray-500 font-black uppercase tracking-widest">Fetching Intelligence...</p>
    </div>
  );

  if (!article) return <div className="p-20 text-center text-red-500">Haber bulunamadi!</div>;

  return (
    <div className="p-10 space-y-8 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href={basePath} className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-all border border-white/5">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">Edit_Intelligence</h2>
            <p className="text-gray-500 text-xs font-mono">ID: {id}</p>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-black px-8 py-3 rounded-full text-[10px] font-black uppercase shadow-lg transition-all">
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Commit_Changes
        </button>
      </div>

      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
        {ARTICLE_LANGS.map((lang) => (
          <button key={lang} onClick={() => setActiveLang(lang)} className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all ${activeTab === lang ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>{ARTICLE_LANGUAGE_LABELS[lang]}</button>
        ))}
      </div>

      <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-10 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Headline ({activeTab})</label>
          <input value={article[getArticleFieldKey('title', activeTab)] || ''} onChange={(e) => setArticle({ ...article, [getArticleFieldKey('title', activeTab)]: e.target.value })} className="w-full bg-black/40 border border-white/10 p-5 rounded-2xl text-xl font-bold text-yellow-500 outline-none focus:border-yellow-500/30" />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-2">Intelligence_Report</label>
          <textarea value={article[getArticleFieldKey('content', activeTab)] || ''} onChange={(e) => setArticle({ ...article, [getArticleFieldKey('content', activeTab)]: e.target.value })} className="w-full h-[500px] bg-black/40 border border-white/10 p-10 rounded-[2.5rem] text-lg font-mono leading-relaxed text-gray-300 outline-none focus:border-yellow-500/30" />
        </div>
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <p className="text-[10px] text-amber-400/90 uppercase tracking-wider font-bold leading-relaxed">{LEGAL_CONFIG.footer[activeTab as keyof typeof LEGAL_CONFIG.footer] || LEGAL_CONFIG.footer.en}</p>
        </div>
      </div>
    </div>
  );
}