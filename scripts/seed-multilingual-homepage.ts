import { PrismaClient } from '@prisma/client'

type TranslationSeed = {
  title: string
  excerpt: string
  content: string
  slug: string
}

type ArticleSeed = {
  category: string
  featured: boolean
  published: boolean
  impact: number
  confidence: number
  signal: string
  volatility: string
  imageUrl: string
  translations: {
    en: TranslationSeed
    tr: TranslationSeed
  }
}

const prisma = new PrismaClient()

const seed: ArticleSeed[] = [
  {
    category: 'ECONOMY',
    featured: true,
    published: true,
    impact: 8,
    confidence: 91,
    signal: 'BULLISH',
    volatility: 'MEDIUM',
    imageUrl:
      'https://images.unsplash.com/photo-1559526324-593bc073d938?q=80&w=1200&auto=format&fit=crop',
    translations: {
      en: {
        title: 'Fed Rate Path Stabilizes Risk Assets into Q2',
        excerpt:
          'Macro signals suggest a lower-volatility window for equities as rate expectations converge.',
        content:
          'US macro indicators point to a softer but stable growth profile. With terminal-rate expectations narrowing, risk assets are repricing in a more orderly channel.',
        slug: 'fed-rate-path-stabilizes-risk-assets-q2',
      },
      tr: {
        title: 'Fed Faiz Patikasi Riskli Varliklari Q2ye Tasiyor',
        excerpt:
          'Makro sinyaller, faiz beklentileri yakinlasirken hisselerde daha dusuk oynaklik penceresine isaret ediyor.',
        content:
          'ABD makro gostergeleri daha yumusak ancak istikrarli bir buyumeye isaret ediyor. Nihai faiz beklentileri daraldikca riskli varliklarda fiyatlama daha duzenli bir kanala geciyor.',
        slug: 'fed-faiz-patikasi-riskli-varliklari-q2ye-tasiyor',
      },
    },
  },
  {
    category: 'AI',
    featured: false,
    published: true,
    impact: 7,
    confidence: 88,
    signal: 'BULLISH',
    volatility: 'HIGH',
    imageUrl:
      'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=1200&auto=format&fit=crop',
    translations: {
      en: {
        title: 'Inference Cost Compression Reshapes Enterprise AI Budgets',
        excerpt:
          'Lower token-cost curves are accelerating deployment beyond pilot programs.',
        content:
          'Enterprise AI demand is shifting from experimentation to process embedding as inference economics improve and latency constraints ease in production.',
        slug: 'inference-cost-compression-reshapes-enterprise-ai-budgets',
      },
      tr: {
        title: 'Cikarim Maliyeti Dususu Kurumsal AI Butcelerini Sekillendiriyor',
        excerpt:
          'Token maliyet egrilerindeki dusus, pilotlarin otesinde uretim kullanimini hizlandiriyor.',
        content:
          'Cikarim ekonomisi iyilestikce ve uretimde gecikme kisitlari azaldikca kurumsal AI talebi denemeden surec entegrasyonuna kayiyor.',
        slug: 'cikarim-maliyeti-dususu-kurumsal-ai-butcelerini-sekillendiriyor',
      },
    },
  },
  {
    category: 'CRYPTO',
    featured: false,
    published: true,
    impact: 9,
    confidence: 93,
    signal: 'BULLISH',
    volatility: 'HIGH',
    imageUrl:
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop',
    translations: {
      en: {
        title: 'Spot ETF Flows Re-Open Momentum in Large-Cap Crypto',
        excerpt:
          'Net inflows and derivatives basis support a continuation setup for BTC and ETH.',
        content:
          'Institutional net inflows into spot products combined with a constructive basis curve indicate improving demand quality across large-cap crypto.',
        slug: 'spot-etf-flows-re-open-momentum-large-cap-crypto',
      },
      tr: {
        title: 'Spot ETF Akislari Buyuk Kriptolarda Momentumu Yeniden Acti',
        excerpt:
          'Net girisler ve turev baz egrisi BTC ile ETH icin devam senaryosunu destekliyor.',
        content:
          'Spot urunlere kurumsal net girisler ve yapici baz egrisi, buyuk piyasa degerli kriptolarda talep kalitesinin iyilestigine isaret ediyor.',
        slug: 'spot-etf-akislari-buyuk-kriptolarda-momentum',
      },
    },
  },
]

async function upsertSeedArticle(item: ArticleSeed): Promise<void> {
  const en = item.translations.en

  const existing = await prisma.articleTranslation.findUnique({
    where: {
      slug_lang: {
        slug: en.slug,
        lang: 'en',
      },
    },
    include: {
      article: true,
    },
  })

  if (!existing) {
    const created = await prisma.article.create({
      data: {
        category: item.category,
        imageUrl: item.imageUrl,
        impact: item.impact,
        confidence: item.confidence,
        signal: item.signal,
        volatility: item.volatility,
        featured: item.featured,
        published: item.published,
        translations: {
          create: [
            {
              lang: 'en',
              title: item.translations.en.title,
              excerpt: item.translations.en.excerpt,
              content: item.translations.en.content,
              slug: item.translations.en.slug,
            },
            {
              lang: 'tr',
              title: item.translations.tr.title,
              excerpt: item.translations.tr.excerpt,
              content: item.translations.tr.content,
              slug: item.translations.tr.slug,
            },
          ],
        },
      },
      include: {
        translations: true,
      },
    })

    console.log(`created: ${created.id} (${item.category})`)
    return
  }

  const articleId = existing.articleId

  await prisma.article.update({
    where: { id: articleId },
    data: {
      category: item.category,
      imageUrl: item.imageUrl,
      impact: item.impact,
      confidence: item.confidence,
      signal: item.signal,
      volatility: item.volatility,
      featured: item.featured,
      published: item.published,
    },
  })

  await prisma.articleTranslation.upsert({
    where: {
      articleId_lang: {
        articleId,
        lang: 'en',
      },
    },
    create: {
      articleId,
      lang: 'en',
      title: item.translations.en.title,
      excerpt: item.translations.en.excerpt,
      content: item.translations.en.content,
      slug: item.translations.en.slug,
    },
    update: {
      title: item.translations.en.title,
      excerpt: item.translations.en.excerpt,
      content: item.translations.en.content,
      slug: item.translations.en.slug,
    },
  })

  await prisma.articleTranslation.upsert({
    where: {
      articleId_lang: {
        articleId,
        lang: 'tr',
      },
    },
    create: {
      articleId,
      lang: 'tr',
      title: item.translations.tr.title,
      excerpt: item.translations.tr.excerpt,
      content: item.translations.tr.content,
      slug: item.translations.tr.slug,
    },
    update: {
      title: item.translations.tr.title,
      excerpt: item.translations.tr.excerpt,
      content: item.translations.tr.content,
      slug: item.translations.tr.slug,
    },
  })

  console.log(`updated: ${articleId} (${item.category})`)
}

async function main(): Promise<void> {
  console.log('seeding multilingual homepage articles...')

  for (const item of seed) {
    await upsertSeedArticle(item)
  }

  const [articleCount, translationCount] = await Promise.all([
    prisma.article.count(),
    prisma.articleTranslation.count(),
  ])

  console.log(`done. article=${articleCount}, articleTranslation=${translationCount}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
