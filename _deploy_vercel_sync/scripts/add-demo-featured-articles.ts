/**
 * Demo Script: Add Sample Featured Articles
 * 
 * Run this to populate the homepage with demo featured articles
 * Usage: npx ts-node scripts/add-demo-featured-articles.ts
 */

const demoArticles = [
  // Hero Article (Priority 1)
  {
    id: 'featured-demo-1',
    slug: 'bitcoin-institutional-surge-2026',
    title: 'BITCOIN SURGES PAST $70,000 ON INSTITUTIONAL WAVE',
    summary: 'Major institutional investors pour $2.3B into Bitcoin as regulatory clarity emerges. BlackRock and Fidelity lead unprecedented capital inflows, signaling a new era for cryptocurrency adoption in traditional finance.',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80',
    category: 'CRYPTO',
    language: 'en',
    readingTime: 8,
    featuredPriority: 1,
    expertByline: {
      name: 'Dr. Anya Chen',
      title: 'Chief Blockchain Architect',
      bio: 'Dr. Anya Chen is a leading blockchain architect with over 8 years of experience in cryptocurrency markets and on-chain analytics.',
      profileUrl: '/experts/anya-chen',
      imageUrl: '/experts/anya-chen.jpg',
      expertise: ['On-Chain Analytics', 'DeFi Protocol Analysis', 'Whale Wallet Tracking'],
      yearsExperience: 8
    },
    tags: ['bitcoin', 'institutional', 'crypto', 'investment'],
    featured: true
  },

  // Secondary Article 1 (Priority 2)
  {
    id: 'featured-demo-2',
    slug: 'ai-chip-breakthrough-nvidia',
    title: 'NVIDIA UNVEILS NEXT-GEN AI CHIP: 10X PERFORMANCE LEAP',
    summary: 'Revolutionary H200 chip promises to transform AI training speeds. Tech sector rallies on breakthrough announcement.',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    category: 'AI',
    language: 'en',
    readingTime: 6,
    featuredPriority: 2,
    expertByline: {
      name: 'Dr. David Kim',
      title: 'AI & Tech Sector Lead',
      bio: 'Former Google AI researcher specializing in semiconductor technology and artificial intelligence.',
      profileUrl: '/experts/david-kim',
      imageUrl: '/experts/david-kim.jpg',
      expertise: ['Artificial Intelligence', 'Semiconductors', 'Tech Stocks'],
      yearsExperience: 15
    },
    tags: ['nvidia', 'ai', 'technology', 'semiconductors'],
    featured: true
  },

  // Secondary Article 2 (Priority 3)
  {
    id: 'featured-demo-3',
    slug: 'fed-rate-decision-march-2026',
    title: 'FED SIGNALS RATE CUTS: MARKETS REACT WITH OPTIMISM',
    summary: 'Federal Reserve hints at potential rate cuts in Q2 2026. S&P 500 jumps 2.8% on dovish commentary.',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    category: 'MACRO',
    language: 'en',
    readingTime: 5,
    featuredPriority: 3,
    expertByline: {
      name: 'Marcus Vane',
      title: 'Senior Macro Strategist',
      bio: 'CFA charterholder with 18 years of experience in global macro strategy and central bank policy analysis.',
      profileUrl: '/experts/marcus-vane',
      imageUrl: '/experts/marcus-vane.jpg',
      expertise: ['Macro Economics', 'Central Banks', 'Fixed Income'],
      yearsExperience: 18
    },
    tags: ['federal reserve', 'interest rates', 'macro', 'stocks'],
    featured: true
  }
]

// Turkish versions
const demoArticlesTR = [
  {
    id: 'featured-demo-tr-1',
    slug: 'bitcoin-kurumsal-yatirim-dalgasi',
    title: 'BİTCOİN KURUMSAL YATIRIM DALGASIYLA 70.000$ AŞTI',
    summary: 'Büyük kurumsal yatırımcılar Bitcoin\'e 2,3 milyar dolar yatırım yaptı. BlackRock ve Fidelity benzeri görülmemiş sermaye girişlerine öncülük ediyor.',
    imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&q=80',
    category: 'CRYPTO',
    language: 'tr',
    readingTime: 8,
    featuredPriority: 1,
    expertByline: {
      name: 'Dr. Anya Chen',
      title: 'Baş Blockchain Mimarı',
      bio: 'Dr. Anya Chen, kripto para piyasaları ve zincir üstü analitikte 8 yılı aşkın deneyime sahip önde gelen bir blockchain mimarıdır.',
      profileUrl: '/experts/anya-chen',
      imageUrl: '/experts/anya-chen.jpg',
      expertise: ['Zincir Üstü Analitik', 'DeFi Protokol Analizi', 'Balina Cüzdan Takibi'],
      yearsExperience: 8
    },
    tags: ['bitcoin', 'kurumsal', 'kripto', 'yatırım'],
    featured: true
  },
  {
    id: 'featured-demo-tr-2',
    slug: 'nvidia-yapay-zeka-cipi',
    title: 'NVIDIA YENİ NESİL YAPAY ZEKA ÇİPİNİ TANITTI',
    summary: 'Devrim niteliğinde H200 çipi, yapay zeka eğitim hızlarını 10 kat artıracak. Teknoloji sektörü yükselişte.',
    imageUrl: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&q=80',
    category: 'AI',
    language: 'tr',
    readingTime: 6,
    featuredPriority: 2,
    expertByline: {
      name: 'Dr. David Kim',
      title: 'Yapay Zeka ve Teknoloji Lideri',
      bio: 'Yarı iletken teknolojisi ve yapay zeka konusunda uzmanlaşmış eski Google AI araştırmacısı.',
      profileUrl: '/experts/david-kim',
      imageUrl: '/experts/david-kim.jpg',
      expertise: ['Yapay Zeka', 'Yarı İletkenler', 'Teknoloji Hisseleri'],
      yearsExperience: 15
    },
    tags: ['nvidia', 'yapay zeka', 'teknoloji', 'yarı iletken'],
    featured: true
  },
  {
    id: 'featured-demo-tr-3',
    slug: 'fed-faiz-karari-mart-2026',
    title: 'FED FAİZ İNDİRİMİ SİNYALİ VERDİ: PİYASALAR OLUMLU',
    summary: 'Federal Reserve 2026 2. çeyrekte olası faiz indirimine işaret etti. S&P 500 %2,8 yükseldi.',
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    category: 'MACRO',
    language: 'tr',
    readingTime: 5,
    featuredPriority: 3,
    expertByline: {
      name: 'Marcus Vane',
      title: 'Kıdemli Makro Stratejist',
      bio: 'Küresel makro strateji ve merkez bankası politika analizinde 18 yıllık deneyime sahip CFA.',
      profileUrl: '/experts/marcus-vane',
      imageUrl: '/experts/marcus-vane.jpg',
      expertise: ['Makro Ekonomi', 'Merkez Bankaları', 'Sabit Gelir'],
      yearsExperience: 18
    },
    tags: ['federal reserve', 'faiz oranları', 'makro', 'hisse'],
    featured: true
  }
]

console.log('Demo Featured Articles Ready!')
console.log('\nTo add these articles, use the admin interface at:')
console.log('  English: /en/admin/featured-articles')
console.log('  Turkish: /tr/admin/featured-articles')
console.log('\nOr make POST requests to: /api/featured-articles')
console.log('\nExample articles:')
console.log(JSON.stringify(demoArticles, null, 2))
console.log('\nTurkish articles:')
console.log(JSON.stringify(demoArticlesTR, null, 2))

export { demoArticles, demoArticlesTR }
