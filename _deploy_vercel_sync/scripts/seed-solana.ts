const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const article = await prisma.warRoomArticle.create({
    data: {
      id: 'solana-breakout-2026',
      title: 'SOLANA BREAKOUT: CRITICAL RESISTANCE FLIPPED TO SUPPORT',
      titleTr: 'SOLANA KIRILIMI: KRİTİK DİRENÇ DESTEĞE DÖNÜŞTÜ',
      titleEn: 'SOLANA BREAKOUT: CRITICAL RESISTANCE FLIPPED TO SUPPORT',
      summaryTr: 'Solana (SOL), son 24 saat içinde sergilediği %15\'lik performansla 120 dolarlık direnci desteğe dönüştürdü.',
      summaryEn: 'Solana (SOL) flipped the $120 psychological resistance into a strong support level after a 15% surge.',
      contentTr: 'Borsa İstanbul BIST 100 endeksi ve küresel piyasalardaki pozitif seyirle uyumlu olarak Solana ekosistemi ralliye öncülük ediyor. Bankacılık ve teknoloji sektörleri ralliye öncülük ederken, yabancı yatırımcıların güçlü alımları dikkat çekti.\n\n[OFFICIAL_DISCLAIMER]\nYATIRIM TAVSİYESİ DEĞİLDİR // SPK 6362 Sayılı Kanun Uyarınca. • SIA_V14_GLOBAL_TERMINAL',
      contentEn: 'US technology markets are showing strong bullish momentum as artificial intelligence infrastructure becomes the primary driver of S&P 500 growth.\n\n[OFFICIAL_DISCLAIMER]\nNOT FINANCIAL ADVICE // In accordance with SEC regulations. • SIA_V14_GLOBAL_TERMINAL',
      siaInsightTr: 'STATISTICAL_PROBABILITY_ANALYSIS // Akıllı para akışı, spekülatif varlıklardan çıkıp Solana gibi sağlam Layer-1 altyapılarına yönelmiş durumda.',
      siaInsightEn: 'STATISTICAL_PROBABILITY_ANALYSIS // Smart money is rotating out of speculative assets back into robust Layer-1 infrastructures like Solana.',
      riskShieldTr: 'Birincil risk faktörü: 145-150 dolar arz bölgesinde yaşanabilecek ani bir satış baskısı.',
      riskShieldEn: 'Primary risk factor: Potential sell pressure at the $145-150 supply zone.',
      imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop',
      sentiment: 'BULLISH',
      confidence: 94,
      marketImpact: 8,
      category: 'CRYPTO',
      region: 'tr',
      status: 'published'
    }
  });
  console.log('✅ Solana haberi başarıyla yayınlandı: ', article.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
