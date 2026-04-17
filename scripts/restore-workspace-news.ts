import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

async function restoreNews() {
  console.log('🔄 Restoring workspace news to database...')

  // 1. MBRIDGE NODE (Restored from memory)
  const mbridge = {
    titleEn: 'MBRIDGE_NODE: The Great Decoupling – Global Liquidity Exits the SWIFT Network',
    summaryEn:
      'A massive structural shift is occurring as the CENTRAL BANK coalition accelerates the MBRIDGE project, creating a parallel highway for global LIQUIDITY and bypassing the DOLLAR-centric SWIFT system.',
    contentEn:
      "[STATISTICAL_PROBABILITY_ANALYSIS // WHALE_NODE_VERIFIED]\n\nGENEVA / HONG KONG — The global financial architecture is undergoing its most significant reorganization since Bretton Woods. Our intelligence identifies the 'MBRIDGE_NODE' as the primary catalyst for a systematic decoupling from the legacy **SWIFT** settlement network. As the **CENTRAL BANK** for International Settlements (BIS) and regional monetary authorities accelerate the multi-CBDC **MBRIDGE** project, a parallel highway for global **LIQUIDITY** is being established. This strategic shift is driven by the persistent **INFLATION** devaluing the **DOLLAR** and the increasing weaponization of financial rails. Data indicates that emerging economies are re-routing their **GDP** settlements through these digital nodes to ensure sovereign autonomy and avoid secondary sanctions. **INSTITUTIONAL** capital is observing a marked 15% treasury re-allocation from liquid dollar-denominated assets toward these mBridge-compatible infrastructure nodes, signaling a fundamental hedge against G7-centric monetary fragility.\n\nTECHNICAL INDICATORS:\n- Liquidity Shift: High (Projected 4.2% SWIFT volume migration within 90 days)\n- DXY Impact: Bearish Divergence (Targeting 102.50 Support Floor)\n- Settlement Latency: mBridge achieving sub-second finality vs. 2-3 days for SWIFT.\n- Support: 101.80 | Resistance: 104.50 (DXY)\n\nMARKET IMPACT:\nThe 'Great Decoupling' is creating a fragmentation of the global financial system. We observe a 'Nokia moment' for legacy banking intermediaries. As the asset classes become integrated with **CENTRAL BANK** digital ledgers, the correlation between global **GDP** growth and real-time settlement efficiency is tightening. This signals a transition from the **DOLLAR**-standard to a multi-polar digital asset standard where **INSTITUTIONAL** dark pool **LIQUIDITY** is stabilized by mBridge-agentic nodes.\n\nINSTITUTIONAL POSITIONING:\nWhale tracking confirms a significant accumulation of mBridge-compatible infrastructure tokens and CBDC-bridge assets. Major hedge funds are repositioning portfolios to account for a 'Post-SWIFT' scenario. We observe **LIQUIDITY** being pulled from standard Eurodollar markets and moved into private digital custody vaults with 'Protocol Immunity'.\n\n[CATCH_BOX]\nRISK MATRIX ANALYSIS:\n- **Regulatory Fragmentation:** Divergent legal frameworks between mBridge participants and G7 regulators could create 'Liquidity Islands'.\n- **Cyber Contagion:** A vulnerability in the mBridge consensus layer could disrupt sovereign **GDP** settlements at unprecedented speeds.\n- **Monetary Policy Friction:** **CENTRAL BANK** rate transmission may become decoupled from the **DOLLAR**-pegged international markets.\n\nSTRATEGIC OUTLOOK:\n- Short-term: Increased volatility in the DXY as **MBRIDGE** nodes go live.\n- Medium-term: 15-20% of global trade settlement shifting to CBDC bridges by 2026.\n- Long-term: Total absorption of the cross-border payment market into AI-managed sovereign ledgers.\n\nCONFIDENCE SCORE: 96%\n\n[OFFICIAL_DISCLAIMER]\nReport verified by SIA Sovereign-Core. Analytical integrity maintained by Council of Five expert analysts. This intelligence node is strictly for institutional oversight and does not constitute financial advice. Past performance of sovereign integration is no guarantee of future stability. \n- Dr. David Kim, SIA Chief Intelligence Officer.",
    titleTr: 'MBRIDGE_DÜĞÜMÜ: Büyük Kopuş – Küresel Likidite SWIFT Ağını Terk Ediyor',
    summaryTr:
      'Merkez Bankası koalisyonu MBRIDGE projesini hızlandırırken, küresel LİKİDİTE için paralel bir otoyol oluşturuluyor ve DOLAR merkezli SWIFT sistemi baypas ediliyor.',
    contentTr:
      "[İSTATİSTİKSEL_OLASILIK_ANALİZİ // BALİNA_DÜĞÜMÜ_ONAYLI]\n\nCENEVRE / HONG KONG — Küresel finansal mimari, Bretton Woods'tan bu yana en önemli yeniden yapılanma sürecinden geçiyor. İstihbaratımız, 'MBRIDGE_DÜĞÜMÜ'nü eski **SWIFT** mutabakat ağından sistematik bir kopuşun birincil katalizörü olarak tanımlıyor. Uluslararası Ödemeler Bankası (BIS) ve bölgesel para otoriteleri çoklu CBDC **MBRIDGE** projesini hızlandırırken, küresel **LIQUIDITY** (likidite) için paralel bir otoyol inşa ediliyor. Bu stratejik değişim, **DOLLAR**'ı (dolar) değersizleştiren kalıcı **INFLATION** (enflasyon) ve finansal hatların artan silah haline getirilmesiyle tetikleniyor. Veriler, gelişmekte olan ekonomilerin egemen özerkliklerini korumak ve ikincil yaptırımlardan kaçınmak için **GDP** (GSYİH) mutabakatlarını bu dijital düğümler üzerinden yeniden yönlendirdiğini gösteriyor. **INSTITUTIONAL** (kurumsal) sermaye, hazine tahsisatının %15'ini likit dolar varlıklarından mBridge uyumlu altyapı düğümlerine kaydırarak, G7 merkezli parasal kırılganlığa karşı temel bir korunma (hedge) sinyali veriyor.\n\nTEKNİK GÖSTERGELER:\n- Likidite Kayması: Yüksek (90 gün içinde %4,2'lik SWIFT hacim göçü öngörülüyor)\n- DXY Etkisi: Ayı Uyumsuzluğu (102,50 Destek Tabanı hedefleniyor)\n- Mutabakat Gecikmesi: mBridge'de saniyenin altında kesinleşme vs. SWIFT'te 2-3 gün.\n- Destek: 101,80 | Direnç: 104,50 (DXY)\n\nPİYASA ETKİSİ:\n'Büyük Kopuş', küresel finansal sistemin parçalanmasına neden oluyor. Eski bankacılık aracıları için bir 'Nokia anı' gözlemliyoruz. Varlık sınıfları **CENTRAL BANK** (merkez bankası) dijital defterleriyle entegre hale geldikçe, küresel **GDP** büyümesi ile gerçek zamanlı mutabakat verimliliği arasındaki korelasyon sıkılaşıyor. Bu, **DOLLAR** standardından, **INSTITUTIONAL** karanlık havuz **LIQUIDITY**'sinin mBridge-ajan düğümleri tarafından stabilize edildiği çok kutuplu bir dijital varlık standardına geçişi simgeliyor.\n\nKURUMSAL POZİSYONLANMA:\nBalina takibi, mBridge uyumlu altyapı tokenları ve CBDC köprü varlıklarında önemli bir birikim olduğunu doğruluyor. Büyük hedge fonları, portföylerini 'SWIFT Sonrası' senaryosuna göre yeniden yapılandırıyor. **LIQUIDITY**'nin standart Eurodolar piyasalarından çekildiğini ve 'Protokol Bağışıklığı'na sahip özel dijital saklama kasalarına taşındığını gözlemliyoruz.\n\n[CATCH_BOX]\nRİSK MATRİS ANALİZİ:\n- **Düzenleyici Parçalanma:** mBridge katılımcıları ve G7 düzenleyicileri arasındaki farklı yasal çerçeveler 'Likidite Adaları' yaratabilir.\n- **Siber Bulaşma:** mBridge konsensüs katmanındaki bir güvenlik açığı, egemen **GDP** mutabakatlarını eşi benzeri görülmemiş bir hızda bozabilir.\n- **Para Politikası Sürtünmesi:** **CENTRAL BANK** faiz aktarımı, **DOLLAR**'a sabitlenmiş uluslararası piyasalardan kopabilir.\n\nSTRATEİK GÖRÜNÜM:\n- Kısa vadeli: **MBRIDGE** düğümleri devreye girdikçe DXY'de artan volatilite.\n- Orta vadeli: 2026 yılına kadar küresel ticaret mutabakatının %15-20'sinin CBDC köprülerine kayması.\n- Uzun vadeli: Sınır ötesi ödeme piyasasının tamamen yapay zeka tarafından yönetilen egemen defterlere emilmesi.\n\nGÜVEN SKORU: %96\n\n[RESMİ_FERAGATNAME]\nRapor SIA Sovereign-Core tarafından doğrulanmıştır. Beşler Konseyi uzman analistleri tarafından onaylanmıştır. Bu istihbarat düğümü kesinlikle kurumsal gözetim içindir ve yatırım tavsiyesi teşkil etmez. Egemen entegrasyonun geçmiş performansı gelecek istikrarın garantisi değildir.\n- Dr. David Kim, SIA İstihbarat Başkanı.",
    category: 'ECONOMY',
    confidence: 96,
    marketImpact: 10,
    status: 'published',
    source: 'SIA_EDITORIAL_DESK',
    imageUrl:
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=1600&auto=format&fit=crop',
  }

  // 2. APPLE GOLD STANDARD (From content folder)
  let appleGold: any = null
  try {
    const appleGoldPath = path.join(process.cwd(), 'content', 'apple-gold-standard-report.json')
    if (fs.existsSync(appleGoldPath)) {
      const data = JSON.parse(fs.readFileSync(appleGoldPath, 'utf8'))
      appleGold = {
        titleEn: data.en.title,
        summaryEn: data.en.summary,
        contentEn: data.en.content,
        titleTr: data.tr.title,
        summaryTr: data.tr.summary,
        contentTr: data.tr.content,
        category: data.category,
        confidence: data.verification.confidenceScore,
        marketImpact: data.marketImpact,
        status: 'published',
        source: 'SIA_AURORA_NODE',
        imageUrl:
          data.en.imageUrl ||
          'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=1600&auto=format&fit=crop',
      }
    }
  } catch (e) {
    console.error('Failed to load Apple Gold report:', e)
  }

  // 3. PROJECT ZENITH (From current ai_workspace.json)
  let zenith: any = null
  try {
    const zenithPath = path.join(process.cwd(), 'ai_workspace.json')
    if (fs.existsSync(zenithPath)) {
      const data = JSON.parse(fs.readFileSync(zenithPath, 'utf8'))
      zenith = {
        titleEn: data.en.title,
        summaryEn: data.en.summary,
        contentEn: data.en.content,
        titleTr: data.tr.title,
        summaryTr: data.tr.summary,
        contentTr: data.tr.content,
        category: data.category,
        confidence: data.verification?.confidenceScore || 94,
        marketImpact: data.marketImpact,
        status: 'published',
        source: 'SIA_ZENITH_NODE',
        imageUrl: data.en.imageUrl,
      }
    }
  } catch (e) {
    console.error('Failed to load Zenith report:', e)
  }

  const articles = [mbridge, appleGold, zenith].filter(Boolean)

  for (const article of articles) {
    const existing = await prisma.warRoomArticle.findFirst({
      where: { titleEn: article.titleEn },
    })

    if (!existing) {
      await prisma.warRoomArticle.create({ data: article })
      console.log(`✅ Restored: ${article.titleEn}`)
    } else {
      console.log(`ℹ️ Already exists: ${article.titleEn}`)
    }
  }

  console.log('🎉 Restoration complete!')
}

restoreNews()
  .catch((e) => {
    console.error('❌ Restoration failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
