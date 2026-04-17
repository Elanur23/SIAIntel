import Link from 'next/link'
import type { ArticleWithTranslation } from '@/lib/articles/types'

interface CategorySectionProps {
  title: string
  category: 'ECONOMY' | 'AI' | 'CRYPTO'
  articles: ArticleWithTranslation[]
  lang: string
  viewAllText: string
  readText: string
}

const categoryConfig = {
  ECONOMY: {
    color: '#3B82F6',
    bgColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: 'rgba(59, 130, 246, 0.3)',
    icon: '◎',
    label: 'ECONOMY',
  },
  AI: {
    color: '#8B5CF6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
    icon: '⬡',
    label: 'AI',
  },
  CRYPTO: {
    color: '#F59E0B',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
    icon: '◈',
    label: 'CRYPTO',
  },
}

export function CategorySection({ title, category, articles, lang, viewAllText, readText }: CategorySectionProps) {
  const config = categoryConfig[category]

  return (
    <section className="mb-16">
      {/* Başlık */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-lg font-mono font-bold" style={{ color: config.color }}>
            {config.icon}
          </span>
          <h2
            className="text-sm font-mono font-bold tracking-widest uppercase"
            style={{ color: config.color }}
          >
            {title}
          </h2>
          <div className="h-px w-16" style={{ backgroundColor: config.borderColor }} />
        </div>
        <Link
          href={`/${lang}/${category.toLowerCase()}`}
          className="text-xs font-mono tracking-wider opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
          style={{ color: config.color }}
        >
          {viewAllText}
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </Link>
      </div>

      {/* Haber kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {articles.slice(0, 3).map((article) => (
          <Link
            key={article.id}
            href={`/${lang}/news/${article.translation.slug}`}
            className="group block rounded-lg border transition-all duration-200 hover:-translate-y-1"
            style={{
              backgroundColor: config.bgColor,
              borderColor: config.borderColor,
            }}
          >
            {/* Görsel */}
            {article.imageUrl && (
              <div className="relative h-40 overflow-hidden rounded-t-lg">
                <img
                  src={article.imageUrl}
                  alt={article.translation.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div
                  className="absolute top-2 left-2 text-xs font-mono px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: config.bgColor,
                    color: config.color,
                    border: `1px solid ${config.borderColor}`,
                  }}
                >
                  {config.label}
                </div>
              </div>
            )}

            {/* İçerik */}
            <div className="p-4">
              <h3 className="text-sm font-mono font-bold mb-2 line-clamp-2 group-hover:opacity-80 transition-opacity">
                {article.translation.title}
              </h3>
              <p className="text-xs opacity-60 line-clamp-2 mb-3">{article.translation.excerpt}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs opacity-40 font-mono">
                  {new Date(article.publishedAt).toLocaleDateString()}
                </span>
                <span className="text-xs font-mono" style={{ color: config.color }}>
                  {readText} →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
