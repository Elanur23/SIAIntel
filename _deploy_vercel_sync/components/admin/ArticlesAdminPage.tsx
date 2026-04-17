import React from 'react';
import { prisma } from '@/lib/warroom/database';
import {
  FileText,
  Calendar,
  Globe2,
  Trash2,
  Edit,
  ImageIcon as ImageIconIcon
} from 'lucide-react';
import Link from 'next/link';
import { getFirstAvailableArticleValue } from '@/lib/warroom/article-localization';
import BackfillTranslationsButton from '@/components/admin/BackfillTranslationsButton';

function getDayLabel(date: Date): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - d.getTime()) / (24 * 60 * 60 * 1000));
  if (diff === 0) return 'Bugun';
  if (diff === 1) return 'Dun';
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

function groupByDay<T>(items: T[], getDate: (item: T) => Date): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const d = getDate(item);
    const key = d.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return map;
}

async function getArticles() {
  try {
    return await prisma.warRoomArticle.findMany({
      orderBy: { publishedAt: 'desc' }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

type ArticlesAdminPageProps = {
  basePath: string;
};

export default async function ArticlesAdminPage({ basePath }: ArticlesAdminPageProps) {
  const articles = await getArticles();
  const byDay = groupByDay(articles, (a) => new Date(a.publishedAt));
  const sortedDays = Array.from(byDay.keys()).sort((a, b) => b.localeCompare(a));

  return (
    <div className="p-10 space-y-8 font-sans">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white uppercase">Yayinlanan Haberler</h2>
          <p className="text-gray-500 text-sm font-mono mt-1 tracking-widest">Gunluk liste - buradan duzenleyebilirsiniz</p>
        </div>
        <div className="flex items-end gap-4">
          <BackfillTranslationsButton />
          <div className="bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full text-[10px] font-black text-blue-400 uppercase">
            Toplam: {articles.length} haber
          </div>
        </div>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white/5 border border-white/5 p-20 rounded-[2rem] text-center">
          <FileText size={48} className="mx-auto text-gray-700 mb-4 opacity-20" />
          <p className="text-gray-500 font-bold uppercase tracking-widest">Henuz yayinlanan haber yok</p>
        </div>
      ) : (
        <div className="space-y-10">
          {sortedDays.map((dayKey) => {
            const dayArticles = byDay.get(dayKey)!;
            const firstDate = new Date(dayArticles[0].publishedAt);
            const label = getDayLabel(firstDate);
            return (
              <section key={dayKey}>
                <h3 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Calendar size={14} />
                  {label}
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  {dayArticles.map((article) => (
                    <div key={article.id} className="bg-white/5 border border-white/5 p-6 rounded-2xl hover:bg-white/10 transition-all group flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-black/40 rounded-xl overflow-hidden border border-white/5">
                          {article.imageUrl ? (
                            <img src={article.imageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-700">
                              <ImageIconIcon size={24} />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg group-hover:text-yellow-500 transition-colors">
                            {getFirstAvailableArticleValue(article, 'title') || '-'}
                          </h3>
                          <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                            <span className="flex items-center gap-1">
                              <Calendar size={12} /> {new Date(article.publishedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="flex items-center gap-1 text-blue-400"><Globe2 size={12} /> {article.source || 'SIA'}</span>
                            <span className="bg-green-500/10 text-green-500 px-2 py-0.5 rounded-md border border-green-500/20">{article.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link href={`${basePath}/edit/${article.id}`} className="p-3 bg-white/5 rounded-xl hover:bg-yellow-500/20 hover:text-yellow-400 transition-all border border-white/5" title="Duzenle">
                          <Edit size={18} />
                        </Link>
                        <button className="p-3 bg-white/5 rounded-xl hover:bg-red-500/20 hover:text-red-400 transition-all border border-white/5">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}