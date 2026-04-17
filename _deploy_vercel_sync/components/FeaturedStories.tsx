'use client'

import { motion } from 'framer-motion'
import { Clock, TrendingUp, Eye } from 'lucide-react'
import Link from 'next/link'
import type { FeaturedArticle } from '@/lib/featured/featured-articles-db'

interface FeaturedStoriesProps {
  articles: FeaturedArticle[]
  language: string
}

export default function FeaturedStories({ articles, language }: FeaturedStoriesProps) {
  if (articles.length === 0) return null

  const heroArticle = articles.find(a => a.featuredPriority === 1)
  const secondaryArticles = articles.filter(a => a.featuredPriority > 1).slice(0, 2)

  const translations: Record<string, any> = {
    tr: {
      featured: 'ÖNE ÇIKAN HABERLER',
      readMore: 'DEVAMINI OKU',
      minRead: 'dk okuma'
    },
    en: {
      featured: 'FEATURED STORIES',
      readMore: 'READ MORE',
      minRead: 'min read'
    },
    de: {
      featured: 'HAUPTGESCHICHTEN',
      readMore: 'MEHR LESEN',
      minRead: 'Min. Lesezeit'
    },
    es: {
      featured: 'HISTORIAS DESTACADAS',
      readMore: 'LEER MÁS',
      minRead: 'min de lectura'
    },
    fr: {
      featured: 'HISTOIRES EN VEDETTE',
      readMore: 'LIRE PLUS',
      minRead: 'min de lecture'
    },
    ru: {
      featured: 'ИЗБРАННЫЕ СТАТЬИ',
      readMore: 'ЧИТАТЬ ДАЛЕЕ',
      minRead: 'мин чтения'
    },
    ar: {
      featured: 'قصص مميزة',
      readMore: 'اقرأ المزيد',
      minRead: 'دقيقة قراءة'
    }
  }

  const t = translations[language] || translations.en

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      CRYPTO: 'bg-orange-500',
      AI: 'bg-purple-500',
      STOCKS: 'bg-blue-500',
      MACRO: 'bg-emerald-500',
      TECH: 'bg-pink-500'
    }
    return colors[category] || 'bg-gray-500'
  }

  return (
    <section className="mb-12">
      {/* Section Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="flex items-center gap-3">
          <TrendingUp className="text-blue-500" size={28} />
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
            {t.featured}
          </h2>
        </div>
        <div className="flex-1 h-px bg-gradient-to-r from-blue-500/50 to-transparent" />
      </div>

      {/* Featured Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Hero Article (Left - 8 columns) */}
        {heroArticle && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="col-span-12 lg:col-span-8"
          >
            <Link href={`/${language}/news/${heroArticle.slug}`}>
              <div className="group relative h-[600px] rounded-[3rem] overflow-hidden bg-black border border-white/10 hover:border-blue-500/40 transition-all duration-500 cursor-pointer">
                
                {/* Background Image */}
                <div className="absolute inset-0">
                  <img
                    src={heroArticle.imageUrl}
                    alt={heroArticle.title}
                    className="w-full h-full object-cover opacity-40 transition-transform duration-1000 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent" />
                </div>

                {/* Content */}
                <div className="absolute inset-0 p-10 flex flex-col justify-end">
                  
                  {/* Category Badge */}
                  <div className="mb-6">
                    <span className={`inline-block px-4 py-2 ${getCategoryColor(heroArticle.category)} rounded-full text-white text-xs font-black uppercase tracking-widest shadow-lg`}>
                      {heroArticle.category}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-5xl font-black text-white leading-tight mb-6 group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter">
                    {heroArticle.title}
                  </h3>

                  {/* Summary */}
                  <p className="text-lg text-slate-300 mb-8 line-clamp-3 font-medium leading-relaxed max-w-3xl">
                    {heroArticle.summary}
                  </p>

                  {/* Meta Info */}
                  <div className="flex items-center gap-6 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-white font-bold">
                        {heroArticle.expertByline.name.charAt(0)}
                      </div>
                      <span className="font-bold text-white">{heroArticle.expertByline.name}</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-slate-600" />
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span>{heroArticle.readingTime} {t.minRead}</span>
                    </div>
                    <div className="h-1 w-1 rounded-full bg-slate-600" />
                    <div className="flex items-center gap-2">
                      <Eye size={16} />
                      <span>{heroArticle.viewCount.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Read More Button */}
                  <div className="mt-8">
                    <div className="inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xl">
                      {t.readMore}
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Secondary Articles (Right - 4 columns) */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
          {secondaryArticles.map((article, idx) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="flex-1"
            >
              <Link href={`/${language}/news/${article.slug}`}>
                <div className="group relative h-full min-h-[280px] rounded-[2.5rem] overflow-hidden bg-black border border-white/10 hover:border-blue-500/40 transition-all duration-500 cursor-pointer">
                  
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover opacity-30 transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="absolute inset-0 p-6 flex flex-col justify-end">
                    
                    {/* Category Badge */}
                    <div className="mb-4">
                      <span className={`inline-block px-3 py-1 ${getCategoryColor(article.category)} rounded-full text-white text-[9px] font-black uppercase tracking-widest shadow-lg`}>
                        {article.category}
                      </span>
                    </div>

                    {/* Title */}
                    <h4 className="text-2xl font-black text-white leading-tight mb-4 group-hover:text-blue-400 transition-colors uppercase italic tracking-tighter line-clamp-3">
                      {article.title}
                    </h4>

                    {/* Meta Info */}
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} />
                        <span>{article.readingTime} {t.minRead}</span>
                      </div>
                      <div className="h-1 w-1 rounded-full bg-slate-600" />
                      <div className="flex items-center gap-1.5">
                        <Eye size={12} />
                        <span>{article.viewCount.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
