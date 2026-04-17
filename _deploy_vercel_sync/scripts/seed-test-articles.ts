import { prisma } from '../lib/warroom/database'

async function seedTestArticles() {
  console.log('🌱 Seeding test articles...')

  const testArticles = [
    {
      titleEn: 'Bitcoin Surges Past $100K as Institutional Demand Accelerates',
      titleTr: 'Bitcoin Kurumsal Talep Hızlanırken 100 Bin Doları Aştı',
      summaryEn: 'Bitcoin reached a historic milestone crossing $100,000 for the first time, driven by unprecedented institutional buying pressure across major exchanges.',
      summaryTr: 'Bitcoin, büyük borsalarda görülmemiş kurumsal alım baskısıyla ilk kez 100.000 doları aşarak tarihi bir dönüm noktasına ulaştı.',
      contentEn: 'Full analysis of the Bitcoin surge...',
      contentTr: 'Bitcoin yükselişinin tam analizi...',
      category: 'CRYPTO',
      confidence: 92,
      marketImpact: 9,
      status: 'published',
      source: 'SIA_SENTINEL',
    },
    {
      titleEn: 'Fed Signals Rate Cuts as Inflation Cools to 2.1%',
      titleTr: 'Enflasyon %2,1\'e Düşerken Fed Faiz İndirimi Sinyali Verdi',
      summaryEn: 'Federal Reserve officials indicated potential rate cuts in Q2 2026 as inflation metrics show sustained cooling trend.',
      summaryTr: 'Federal Reserve yetkilileri, enflasyon göstergeleri sürekli soğuma eğilimi gösterirken 2026 2. çeyrekte olası faiz indirimleri sinyali verdi.',
      contentEn: 'Detailed Fed analysis...',
      contentTr: 'Detaylı Fed analizi...',
      category: 'MACRO',
      confidence: 85,
      marketImpact: 8,
      status: 'published',
      source: 'SIA_SENTINEL',
    },
    {
      titleEn: 'Nvidia Unveils Next-Gen AI Chips with 10x Performance Boost',
      titleTr: 'Nvidia 10 Kat Performans Artışıyla Yeni Nesil AI Çiplerini Tanıttı',
      summaryEn: 'Nvidia announced its Blackwell Ultra architecture, promising revolutionary improvements in AI training and inference capabilities.',
      summaryTr: 'Nvidia, AI eğitimi ve çıkarım yeteneklerinde devrim niteliğinde iyileştirmeler vaat eden Blackwell Ultra mimarisini duyurdu.',
      contentEn: 'Technical breakdown of new chips...',
      contentTr: 'Yeni çiplerin teknik analizi...',
      category: 'AI',
      confidence: 88,
      marketImpact: 7,
      status: 'published',
      source: 'SIA_SENTINEL',
    },
    {
      titleEn: 'Ethereum Spot ETF Sees Record $1.2B Inflows in Single Day',
      titleTr: 'Ethereum Spot ETF Tek Günde Rekor 1,2 Milyar Dolar Giriş Gördü',
      summaryEn: 'Ethereum spot ETFs recorded their largest single-day inflow since launch, signaling growing institutional appetite for ETH exposure.',
      summaryTr: 'Ethereum spot ETF\'leri lansmanından bu yana en büyük tek günlük girişini kaydetti ve ETH\'ye artan kurumsal iştahın sinyalini verdi.',
      contentEn: 'ETF flow analysis...',
      contentTr: 'ETF akış analizi...',
      category: 'CRYPTO',
      confidence: 90,
      marketImpact: 8,
      status: 'published',
      source: 'SIA_SENTINEL',
    },
    {
      titleEn: 'S&P 500 Hits New All-Time High on Tech Rally',
      titleTr: 'S&P 500 Teknoloji Rallisiyle Yeni Tüm Zamanların Zirvesine Ulaştı',
      summaryEn: 'The S&P 500 index reached a new record high driven by strong earnings from mega-cap technology companies.',
      summaryTr: 'S&P 500 endeksi, mega-cap teknoloji şirketlerinden gelen güçlü kazançlarla yeni rekor seviyeye ulaştı.',
      contentEn: 'Market analysis...',
      contentTr: 'Piyasa analizi...',
      category: 'STOCKS',
      confidence: 87,
      marketImpact: 7,
      status: 'published',
      source: 'SIA_SENTINEL',
    },
    {
      titleEn: 'China Announces $500B Economic Stimulus Package',
      titleTr: 'Çin 500 Milyar Dolarlık Ekonomik Teşvik Paketi Açıkladı',
      summaryEn: 'Chinese government unveiled comprehensive stimulus measures targeting infrastructure, technology, and consumer spending.',
      summaryTr: 'Çin hükümeti altyapı, teknoloji ve tüketici harcamalarını hedefleyen kapsamlı teşvik önlemlerini açıkladı.',
      contentEn: 'Stimulus breakdown...',
      contentTr: 'Teşvik paketi detayları...',
      category: 'ECONOMY',
      confidence: 83,
      marketImpact: 9,
      status: 'published',
      source: 'SIA_SENTINEL',
    },
  ]

  for (const article of testArticles) {
    await prisma.warRoomArticle.create({
      data: {
        ...article,
        publishedAt: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Random time in last 24h
      },
    })
    console.log(`✅ Created: ${article.titleEn}`)
  }

  console.log('🎉 Seeding complete!')
}

seedTestArticles()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
