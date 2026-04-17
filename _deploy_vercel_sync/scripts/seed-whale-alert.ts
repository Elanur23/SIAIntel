const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const article = await prisma.warRoomArticle.create({
    data: {
      id: 'satoshi-btc-50k-alert',
      source: 'SIA_FLUID_ENGINE',
      publishedAt: new Date(),
      sentiment: 'BEARISH',
      confidence: 92,
      marketImpact: 10,
      category: 'CRYPTO',
      region: 'tr',

      titleTr: 'SATOSHI DÖNEMİ CÜZDANLARI UYANIYOR: 50.000 BTC TRANSFER EDİLDİ',
      titleEn: 'SATOSHI-ERA WALLETS AWAKEN: 50,000 BTC MOVED TO EXCHANGES',

      summaryTr: 'Satoshi dönemine ait 50.000 BTC, uzun süreli uykusundan uyanarak merkezi borsalara (CEX) taşındı. Piyasalarda rekor volatilite bekleniyor.',
      summaryEn: '50,000 BTC from the Satoshi era awakened from long-term dormancy and moved to central exchanges. Record volatility is expected.',

      siaInsightTr: 'SIA_FLUID_ENGINE_ACTIVE // Veri analizi, bu büyük ölçekli transferin Satoshi dönemine ait cüzdanların canlanmakta olduğuna işaret etmektedir. Bu hareket, kurumsal likiditeyi test edecek bir trend değişimini tetikleyebilir.',
      siaInsightEn: 'SIA_FLUID_ENGINE_ACTIVE // Data analysis indicates that this large-scale transfer signals the awakening of Satoshi-era wallets. This movement could trigger a trend shift testing institutional liquidity.',

      riskShieldTr: 'İptal seviyesi: 40.000 dolar. Bu seviyenin altına iniş, sinyali geçersiz kılar ancak üstünde kalındığı sürece sistemik risk %683 artış göstermektedir.',
      riskShieldEn: 'Invalidation level: $40,000. A drop below this level invalidates the signal, but staying above increases systemic risk by 683%.',

      contentTr: `Son günlerde kripto para piyasalarında dikkat çekici bir hareketlilik gözlemlenmiştir. 50.000 BTC'lik bir miktar, uzun süredir hareketsiz olan cüzdanlardan hareket etmiş ve büyük bir likidite merkezi borsalarına (CEX) yönlendirilmiştir.

Veri analizi, bu büyük ölçekli transferin piyasalarda önemli bir etkisinin olabileceğini göstermektedir. Büyük miktarlarda Bitcoin'in hareketi, piyasadaki likiditeyi etkileyebilir ve fiyat dalgalanmalarına neden olabilir.

Teknik projeksiyonlar, bu hareketin piyasalarda bir trend değişimine yol açabileceğini göstermektedir. İptal seviyesi olarak 40.000 dolar seviyesi belirlenmiştir. [SYSTEM_LOG]: SIA_FLUID_ENGINE_ACTIVE`,

      contentEn: `Noticeable activity has been observed in the cryptocurrency markets. 50,000 BTC moved from long-dormant wallets to central exchanges (CEX).

Data analysis suggests this large-scale transfer could have a significant impact on markets. Movement of large amounts of Bitcoin can affect liquidity and cause price fluctuations.

Technical projections show this move could lead to a trend change. An invalidation level of $40,000 has been set. [SYSTEM_LOG]: SIA_FLUID_ENGINE_ACTIVE`,

      imageUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1200&auto=format&fit=crop',
      status: 'published'
    }
  });
  console.log('✅ Satoshi BTC Alert mühürlendi ve yayınlandı: ', article.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
