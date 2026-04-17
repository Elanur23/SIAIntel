/**
 * Test Data Seeder
 * Adds sample articles to the database
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const testArticles = [
  {
    source: 'TEST',
    category: 'CRYPTO',
    titleEn: 'Bitcoin Surges Past $67,000 on Institutional Buying',
    titleTr: 'Bitcoin Kurumsal Alımlarla 67.000 Doları Aştı',
    summaryEn: 'Bitcoin reached $67,500 following strong institutional demand across major exchanges.',
    summaryTr: 'Bitcoin, büyük borsalarda güçlü kurumsal talep sonrası 67.500 dolara ulaştı.',
    contentEn: 'Bitcoin surged 8% to $67,500 following institutional buying pressure observed across major exchanges. The movement occurred during Asian trading hours with over $2.3B in net inflows.',
    contentTr: 'Bitcoin, büyük borsalarda gözlemlenen kurumsal alım baskısının ardından %8 yükselerek 67.500 dolara ulaştı. Hareket, Asya işlem saatlerinde 2,3 milyar doların üzerinde net girişle gerçekleşti.',
    siaInsightEn: 'According to SIA_SENTINEL proprietary analysis, on-chain data reveals a 34% increase in whale wallet accumulation.',
    siaInsightTr: 'SIA_SENTINEL özel analizine göre, zincir üstü veriler balina cüzdan biriktirmesinde %34 artış gösteriyor.',
    marketImpact: 8,
    status: 'published',
    publishedAt: new Date(),
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=800'
  },
  {
    source: 'TEST',
    category: 'AI',
    titleEn: 'OpenAI Announces GPT-5 with Revolutionary Capabilities',
    titleTr: 'OpenAI Devrim Niteliğinde Yeteneklere Sahip GPT-5\'i Duyurdu',
    summaryEn: 'OpenAI unveiled GPT-5, featuring advanced reasoning and multimodal processing.',
    summaryTr: 'OpenAI, gelişmiş akıl yürütme ve çok modlu işleme özelliklerine sahip GPT-5\'i tanıttı.',
    contentEn: 'OpenAI has announced GPT-5, marking a significant leap in AI capabilities with enhanced reasoning, multimodal understanding, and real-time processing.',
    contentTr: 'OpenAI, gelişmiş akıl yürütme, çok modlu anlama ve gerçek zamanlı işleme ile yapay zeka yeteneklerinde önemli bir sıçramayı işaret eden GPT-5\'i duyurdu.',
    siaInsightEn: 'Our AI monitoring systems detected unprecedented performance improvements in benchmark tests.',
    siaInsightTr: 'Yapay zeka izleme sistemlerimiz, kıyaslama testlerinde benzeri görülmemiş performans iyileştirmeleri tespit etti.',
    marketImpact: 9,
    status: 'published',
    publishedAt: new Date(Date.now() - 3600000),
    imageUrl: 'https://images.unsplash.com/photo-1677447337457-6e6e64e824c2?q=80&w=800'
  },
  {
    source: 'TEST',
    category: 'STOCKS',
    titleEn: 'NVIDIA Reaches $1 Trillion Market Cap on AI Boom',
    titleTr: 'NVIDIA Yapay Zeka Patlamasıyla 1 Trilyon Dolar Piyasa Değerine Ulaştı',
    summaryEn: 'NVIDIA stock surged 15% as AI chip demand continues to accelerate.',
    summaryTr: 'Yapay zeka çip talebi hızlanmaya devam ederken NVIDIA hissesi %15 yükseldi.',
    contentEn: 'NVIDIA Corporation reached a historic $1 trillion market capitalization as demand for AI chips continues to surge across tech giants.',
    contentTr: 'NVIDIA Corporation, teknoloji devlerinde yapay zeka çip talebi artmaya devam ederken tarihi 1 trilyon dolar piyasa değerine ulaştı.',
    siaInsightEn: 'SIA_SENTINEL tracking shows institutional accumulation increased 45% week-over-week.',
    siaInsightTr: 'SIA_SENTINEL takibi, kurumsal biriktirmenin haftalık %45 arttığını gösteriyor.',
    marketImpact: 7,
    status: 'published',
    publishedAt: new Date(Date.now() - 7200000),
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=800'
  },
  {
    source: 'TEST',
    category: 'ECONOMY',
    titleEn: 'Federal Reserve Holds Rates Steady at 5.25%',
    titleTr: 'Federal Reserve Faiz Oranlarını %5,25\'te Sabit Tuttu',
    summaryEn: 'Fed maintains current interest rate policy amid mixed economic signals.',
    summaryTr: 'Fed, karışık ekonomik sinyaller arasında mevcut faiz politikasını sürdürüyor.',
    contentEn: 'The Federal Reserve announced it will maintain interest rates at 5.25% as policymakers assess inflation trends and economic growth.',
    contentTr: 'Federal Reserve, politika yapıcılar enflasyon trendlerini ve ekonomik büyümeyi değerlendirirken faiz oranlarını %5,25\'te tutacağını açıkladı.',
    siaInsightEn: 'Our economic models predict a 65% probability of rate cuts in Q3 2026.',
    siaInsightTr: 'Ekonomik modellerimiz 2026 3. çeyrekte faiz indirimlerinin %65 olasılıkla gerçekleşeceğini öngörüyor.',
    marketImpact: 6,
    status: 'published',
    publishedAt: new Date(Date.now() - 10800000),
    imageUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?q=80&w=800'
  }
]

async function main() {
  console.log('🌱 Seeding test data...')

  for (const article of testArticles) {
    const created = await prisma.warRoomArticle.create({
      data: article
    })
    console.log(`✅ Created article: ${created.titleEn}`)
  }

  console.log('✨ Seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
