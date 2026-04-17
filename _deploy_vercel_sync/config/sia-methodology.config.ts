/**
 * SIA Methodology & About Us Content
 * 
 * E-E-A-T compliant methodology documentation in 7 languages
 * Technical, professional, and credible - no marketing hyperbole
 * 
 * Follows Google's E-E-A-T guidelines:
 * - Experience: Demonstrates first-hand technical implementation
 * - Expertise: Uses precise engineering and data science terminology
 * - Authoritativeness: Cites specific technologies and methodologies
 * - Trustworthiness: Transparent about capabilities and limitations
 */

export interface MethodologyContent {
  mission: string
  dataLayers: {
    title: string
    items: string[]
  }
  technicalInfrastructure: {
    title: string
    items: string[]
  }
  regionalFocus: {
    title: string
    description: string
    specialization: string
  }
  limitations: {
    title: string
    items: string[]
  }
  disclaimer: string
}

export const SIA_METHODOLOGY: Record<string, MethodologyContent> = {
  // ============================================================================
  // TURKISH (TR)
  // ============================================================================
  tr: {
    mission: "SIA (Sovereign Intelligence Analysis), finansal veriyi 7 farklı bölgenin yerel ekonomik gerçekliğiyle analiz eden bir veri platformudur. Amacımız, küresel piyasa hareketlerini bölgesel likidite dinamikleri ve makroekonomik göstergeler üzerinden değerlendirmektir.",
    
    dataLayers: {
      title: "Veri Katmanları",
      items: [
        "On-chain Veriler: Blockchain ağlarından (Bitcoin, Ethereum, BNB Chain, Polygon) alınan işlem verileri, cüzdan hareketleri ve borsa rezerv seviyeleri",
        "Makroekonomik Raporlar: Merkez bankası politika kararları (FED, ECB, TCMB, BoE), enflasyon verileri ve faiz oranı değişimleri",
        "Doğrulanmış Haber Akışları: Bloomberg, Reuters ve merkez bankası resmi açıklamalarından oluşan kaynak doğrulamalı veri akışı",
        "Borsa Likidite Metrikleri: Spot ve türev piyasalarda işlem hacmi, açık pozisyon analizi ve fonlama oranları"
      ]
    },
    
    technicalInfrastructure: {
      title: "Teknik Altyapı",
      items: [
        "Next.js 14 App Router ile sunucu taraflı dinamik içerik dağıtımı",
        "Edge Middleware kullanarak coğrafi konum bazlı otomatik dil yönlendirmesi",
        "WebSocket bağlantıları ile gerçek zamanlı veri akışı (Binance API, WhaleAlert)",
        "TypeScript ile tip güvenli veri işleme ve doğrulama katmanları",
        "Gemini 1.5 Pro 002 ile Google Search grounding destekli semantik analiz",
        "Çok katmanlı kaynak doğrulama sistemi (on-chain, merkez bankası, doğrulanmış haber ajansları)"
      ]
    },
    
    regionalFocus: {
      title: "Türkiye Bölgesel Odak",
      description: "Türkiye piyasası için özel analiz alanlarımız:",
      specialization: "USDT/TRY kur makası analizi, yerel borsa likidite takibi, kur korumalı mevduat sisteminden çıkan sermaye akışlarının kripto rotası, TCMB politika kararlarının dijital varlık piyasalarına etkisi ve yerel yatırımcı davranış kalıpları"
    },
    
    limitations: {
      title: "Metodolojik Sınırlamalar",
      items: [
        "Analizlerimiz geçmiş verilere ve istatistiksel olasılıklara dayanır, gelecek performansı garanti etmez",
        "Piyasa koşulları hızla değişebilir ve beklenmedik olaylar analiz sonuçlarını geçersiz kılabilir",
        "On-chain veriler blockchain ağlarının şeffaflığına bağlıdır ancak cüzdan sahipliği her zaman doğrulanamaz",
        "Makroekonomik göstergeler revize edilebilir ve ilk açıklamalar nihai verilerden farklılık gösterebilir"
      ]
    },
    
    disclaimer: "SIA platformu eğitim ve bilgilendirme amaçlıdır. Sunulan analizler yatırım tavsiyesi değildir. Finansal kararlar almadan önce lisanslı yatırım danışmanlarına başvurmanız önerilir. KVKK uyumlu veri işleme politikalarımız hakkında detaylı bilgi için gizlilik politikamızı inceleyebilirsiniz."
  },

  // ============================================================================
  // ENGLISH (EN)
  // ============================================================================
  en: {
    mission: "SIA (Sovereign Intelligence Analysis) is a data platform that analyzes financial data through the lens of regional economic realities across 7 distinct markets. Our objective is to evaluate global market movements through regional liquidity dynamics and macroeconomic indicators.",
    
    dataLayers: {
      title: "Data Layers",
      items: [
        "On-Chain Data: Transaction data, wallet movements, and exchange reserve levels from blockchain networks (Bitcoin, Ethereum, BNB Chain, Polygon)",
        "Macroeconomic Reports: Central bank policy decisions (FED, ECB, TCMB, BoE), inflation data, and interest rate changes",
        "Verified News Feeds: Source-validated data streams from Bloomberg, Reuters, and official central bank announcements",
        "Exchange Liquidity Metrics: Trading volume in spot and derivatives markets, open interest analysis, and funding rates"
      ]
    },
    
    technicalInfrastructure: {
      title: "Technical Infrastructure",
      items: [
        "Server-side dynamic content delivery using Next.js 14 App Router",
        "Automatic language routing based on geographic location using Edge Middleware",
        "Real-time data streaming via WebSocket connections (Binance API, WhaleAlert)",
        "Type-safe data processing and validation layers with TypeScript",
        "Semantic analysis with Gemini 1.5 Pro 002 and Google Search grounding",
        "Multi-layer source verification system (on-chain, central banks, verified news agencies)"
      ]
    },
    
    regionalFocus: {
      title: "United States Regional Focus",
      description: "Specialized analysis areas for US markets:",
      specialization: "Federal Reserve policy impact on digital assets, institutional liquidity flows, spot Bitcoin ETF inflows/outflows, correlation between traditional equity markets and cryptocurrency, repo market dynamics, and stablecoin supply metrics as USD liquidity indicators"
    },
    
    limitations: {
      title: "Methodological Limitations",
      items: [
        "Our analyses are based on historical data and statistical probabilities; they do not guarantee future performance",
        "Market conditions can change rapidly, and unexpected events may invalidate analysis results",
        "On-chain data depends on blockchain network transparency, but wallet ownership cannot always be verified",
        "Macroeconomic indicators may be revised, and initial announcements can differ from final data"
      ]
    },
    
    disclaimer: "The SIA platform is for educational and informational purposes only. The analyses presented are not investment advice. It is recommended that you consult licensed investment advisors before making financial decisions. For detailed information about our GDPR-compliant data processing policies, please review our privacy policy."
  }
}
