import { MetadataRoute } from 'next'
import { PrismaClient } from '@prisma/client'
import { buildArticleSlug } from '@/lib/warroom/article-seo'

const prisma = new PrismaClient()
const BASE_URL = 'https://siaintel.com'
// 9 Dilin tamamı eklendi
const locales = ['en', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh', 'tr']

const CATEGORY_ROUTES = ['/ai', '/crypto', '/stocks', '/economy']

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // 1. Ana & Yardımcı Statik Sayfalar (9 dil) - AdSense/Discover için Privacy & Terms
  const staticRoutes = ['', '/about', '/contact', '/intelligence', '/experts', '/privacy-policy', '/terms'].flatMap((route) =>
    locales.map((lang) => ({
      url: `${BASE_URL}/${lang}${route}`,
      lastModified: now,
      changeFrequency: 'daily' as const,
      priority: route === '' ? 1.0 : 0.8,
    }))
  )

  // 2. Kategori Sayfaları (9 dil × 4 kategori) — yüksek öncelik
  const categoryRoutes = CATEGORY_ROUTES.flatMap((route) =>
    locales.map((lang) => ({
      url: `${BASE_URL}/${lang}${route}`,
      lastModified: now,
      changeFrequency: 'hourly' as const,
      priority: 0.9,
    }))
  )

  // 3. Dinamik Haber Sayfaları (DB canlı)
  const articles = await prisma.warRoomArticle.findMany({
    where: {
      status: 'published',
      publishedAt: { lte: now },
    },
    select: { id: true, updatedAt: true, publishedAt: true, titleEn: true, titleTr: true },
    orderBy: { publishedAt: 'desc' },
    take: 500, // Google sitemap limit; Google News sitemap covers the recent ones
  })

  const articleRoutes = articles.flatMap((art) =>
    locales.map((lang) => {
      const title = lang === 'tr'
        ? (art.titleTr || art.titleEn || art.id)
        : (art.titleEn || art.titleTr || art.id)

      // Articles published in last 7 days get higher priority
      const ageMs  = now.getTime() - new Date(art.publishedAt).getTime()
      const ageDays = ageMs / (1000 * 60 * 60 * 24)
      const priority = ageDays < 1 ? 0.9 : ageDays < 7 ? 0.8 : 0.7

      return {
        url: `${BASE_URL}/${lang}/news/${buildArticleSlug(art.id, title)}`,
        lastModified: art.updatedAt,
        changeFrequency: ageDays < 7 ? 'daily' as const : 'weekly' as const,
        priority,
      }
    })
  )

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes]
}
