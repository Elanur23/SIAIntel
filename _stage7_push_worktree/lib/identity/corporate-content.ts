/**
 * Corporate Content - Multilingual About, Editorial Policy, AI Transparency
 * 
 * LOCALIZED (not just translated) content with region-specific regulatory references
 */

export type CorporatePage = 'about' | 'editorial' | 'ai-transparency' | 'disclaimer'

export interface CorporateContent {
  title: string
  subtitle: string
  sections: {
    heading: string
    content: string
  }[]
  regulatoryReferences?: {
    name: string
    url: string
    description: string
  }[]
}

// ============================================================================
// ABOUT US CONTENT
// ============================================================================

export const ABOUT_CONTENT: Record<string, CorporateContent> = {
  en: {
    title: 'About SIA Intelligence',
    subtitle: 'AI-Powered Financial Intelligence for Sophisticated Investors',
    sections: [
      {
        heading: 'Our Mission',
        content: 'SIA Intelligence provides institutional-grade market analysis powered by artificial intelligence and verified by expert analysts. We combine cutting-edge technology with human expertise to deliver actionable insights across cryptocurrency, macro economy, commodities, technology, and emerging markets.'
      },
      {
        heading: 'Our Technology',
        content: 'Our proprietary SIA_SENTINEL system processes real-time market data, on-chain analytics, and global news feeds through advanced AI models. Every insight is validated by our Council of Five expert analysts before publication, ensuring accuracy and reliability.'
      },
      {
        heading: 'Our Standards',
        content: 'We adhere to the highest standards of financial journalism and comply with SEC, FINRA, and global regulatory guidelines. Our content undergoes multi-agent validation, originality verification, and E-E-A-T optimization to ensure quality and trustworthiness.'
      }
    ],
    regulatoryReferences: [
      {
        name: 'SEC - U.S. Securities and Exchange Commission',
        url: 'https://www.sec.gov',
        description: 'We follow SEC guidelines for financial content and disclosures'
      },
      {
        name: 'FINRA - Financial Industry Regulatory Authority',
        url: 'https://www.finra.org',
        description: 'Our content complies with FINRA standards for financial communications'
      }
    ]
  },
  tr: {
    title: 'SIA Intelligence Hakkında',
    subtitle: 'Sofistike Yatırımcılar için Yapay Zeka Destekli Finansal İstihbarat',
    sections: [
      {
        heading: 'Misyonumuz',
        content: 'SIA Intelligence, yapay zeka ile desteklenen ve uzman analistler tarafından doğrulanan kurumsal düzeyde piyasa analizi sağlar. Kripto para, makro ekonomi, emtia, teknoloji ve gelişmekte olan piyasalarda uygulanabilir içgörüler sunmak için son teknoloji ile insan uzmanlığını birleştiriyoruz.'
      },
      {
        heading: 'Teknolojimiz',
        content: 'Özel SIA_SENTINEL sistemimiz, gelişmiş yapay zeka modelleri aracılığıyla gerçek zamanlı piyasa verilerini, zincir üstü analitiği ve küresel haber akışlarını işler. Her içgörü, doğruluk ve güvenilirlik sağlamak için yayınlanmadan önce Beş Kişilik Konsey uzman analistlerimiz tarafından doğrulanır.'
      },
      {
        heading: 'Standartlarımız',
        content: 'Finansal gazeteciliğin en yüksek standartlarına bağlıyız ve SPK, TCMB ve küresel düzenleyici yönergelerine uyuyoruz. İçeriğimiz, kalite ve güvenilirlik sağlamak için çok ajanlı doğrulama, özgünlük kontrolü ve E-E-A-T optimizasyonundan geçer.'
      }
    ],
    regulatoryReferences: [
      {
        name: 'SPK - Sermaye Piyasası Kurulu',
        url: 'https://www.spk.gov.tr',
        description: 'Finansal içerik ve açıklamalar için SPK yönergelerini takip ediyoruz'
      },
      {
        name: 'TCMB - Türkiye Cumhuriyet Merkez Bankası',
        url: 'https://www.tcmb.gov.tr',
        description: 'Makroekonomik analizlerimiz TCMB verilerine dayanır'
      }
    ]
  },
  de: {
    title: 'Über SIA Intelligence',
    subtitle: 'KI-gestützte Finanzintelligenz für anspruchsvolle Investoren',
    sections: [
      {
        heading: 'Unsere Mission',
        content: 'SIA Intelligence bietet institutionelle Marktanalysen, die von künstlicher Intelligenz unterstützt und von Expertenanalysten verifiziert werden. Wir kombinieren modernste Technologie mit menschlicher Expertise, um umsetzbare Erkenntnisse über Kryptowährungen, Makroökonomie, Rohstoffe, Technologie und Schwellenmärkte zu liefern.'
      },
      {
        heading: 'Unsere Technologie',
        content: 'Unser proprietäres SIA_SENTINEL-System verarbeitet Echtzeit-Marktdaten, On-Chain-Analysen und globale Nachrichtenfeeds durch fortschrittliche KI-Modelle. Jede Erkenntnis wird vor der Veröffentlichung von unseren fünf Expertenanalysten validiert, um Genauigkeit und Zuverlässigkeit zu gewährleisten.'
      },
      {
        heading: 'Unsere Standards',
        content: 'Wir halten uns an die höchsten Standards des Finanzjournalismus und entsprechen den BaFin- und globalen Regulierungsrichtlinien. Unsere Inhalte durchlaufen Multi-Agenten-Validierung, Originalitätsprüfung und E-E-A-T-Optimierung.'
      }
    ],
    regulatoryReferences: [
      {
        name: 'BaFin - Bundesanstalt für Finanzdienstleistungsaufsicht',
        url: 'https://www.bafin.de',
        description: 'Wir folgen BaFin-Richtlinien für Finanzinhalte'
      }
    ]
  },
  zh: {
    title: '关于 SIA Intelligence',
    subtitle: '为成熟投资者提供 AI 驱动的金融情报',
    sections: [
      {
        heading: '我们的使命',
        content: 'SIA Intelligence 提供由人工智能驱动、经专家分析师验证的机构级市场分析。我们将前沿技术与人类专业知识相结合，在加密货币、宏观经济、大宗商品、科技与新兴市场领域提供可操作的洞察。'
      },
      {
        heading: '我们的技术',
        content: '我们的 SIA_SENTINEL 系统通过先进 AI 模型处理实时市场数据、链上分析与全球新闻流。每项洞察在发布前均经我们五人委员会专家分析师验证，确保准确与可靠。'
      },
      {
        heading: '我们的标准',
        content: '我们遵循最高标准的金融新闻报道，并遵守 SEC、FINRA 及全球监管准则。我们的内容经过多智能体验证、原创性核查与 E-E-A-T 优化，以确保质量与可信度。'
      }
    ],
    regulatoryReferences: [
      {
        name: 'SEC - 美国证券交易委员会',
        url: 'https://www.sec.gov',
        description: '我们遵循 SEC 对金融内容与披露的指引'
      },
      {
        name: 'FINRA - 金融业监管局',
        url: 'https://www.finra.org',
        description: '我们的内容符合 FINRA 金融传播标准'
      }
    ]
  }
}
