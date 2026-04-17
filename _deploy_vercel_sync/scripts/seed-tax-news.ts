const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const article = await prisma.warRoomArticle.create({
    data: {
      id: 'crypto-tax-laws-2026',
      source: 'SIA_FLUID_ENGINE',
      publishedAt: new Date(),
      sentiment: 'BEARISH',
      confidence: 88,
      marketImpact: 7,
      category: 'REGULATORY',
      region: 'tr',

      titleTr: 'MEVZUAT GÜNCELLEMESİ: YENİ KRİPTO PARA VERGİ YASALARI ÖNERİSİ',
      titleEn: 'REGULATORY UPDATE: NEW CRYPTO TAX LAWS PROPOSED',

      summaryTr: 'Dijital varlık raporlamasını hedefleyen yeni yasal çerçeve piyasalarda şeffaflığı artırırken, kısa vadeli işlem hacminde daralma riski taşıyor.',
      summaryEn: 'New legislative framework for digital asset reporting aims for transparency but carries risks of short-term liquidity contraction.',

      siaInsightTr: 'STATISTICAL_PROBABILITY_ANALYSIS // Bu düzenleme, borsalara yansımayan gizli likidite akışlarını denetim altına almayı hedefliyor. Kurumsal güven artacak olsa da, bireysel yatırımcı iştahında geçici bir soğuma beklenmektedir.',
      siaInsightEn: 'STATISTICAL_PROBABILITY_ANALYSIS // This regulation targets undisclosed liquidity flows. While institutional trust may rise, a temporary cooling in retail sentiment is expected.',

      riskShieldTr: 'İptal seviyesi: Mevzuat sonrası %15 oranında bir düzeltme yaşanması durumunda mevcut stratejiler geçersiz kalacaktır. Risk yönetimi güncellenmelidir.',
      riskShieldEn: 'Invalidation level: A 15% correction following the legislation will invalidate current strategies. Risk management must be updated.',

      contentTr: `Dijital varlık raporlaması hedefleyen yeni bir yasal çerçeve sunulmuştur. Bu gelişme, kripto para piyasalarında önemli bir değişimi işaret etmektedir.

Veri analizi sonuçlarına göre, bu yeni düzenlemelerin kripto para piyasalarına olan etkileri önemli olacaktır. Şeffaflık ve güvenin artırılmasına katkıda bulunacaktır. Ancak, işlem hacminin azalmasına neden olabileceği düşünülmektedir.

Teknik projeksiyonlar, yeni düzenlemelerin uygulanmasıyla birlikte, kripto para piyasalarında bir düzeltme dönemi yaşanabileceğini göstermektedir. [SYSTEM_LOG]: SIA_FLUID_ENGINE_ACTIVE`,

      contentEn: `A new legislative framework targeting digital asset reporting has been introduced. This development marks a significant shift in crypto markets.

Data analysis suggests these regulations will have a major impact. While increasing transparency, they may cause a decrease in trading volumes.

Technical projections show a potential correction period as the new framework is implemented. [SYSTEM_LOG]: SIA_FLUID_ENGINE_ACTIVE`,

      imageUrl: 'https://images.unsplash.com/photo-1621761191319-c6fb62004040?q=80&w=1200&auto=format&fit=crop',
      status: 'published'
    }
  });
  console.log('✅ Kripto Vergi Haberi mühürlendi ve yayınlandı: ', article.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
