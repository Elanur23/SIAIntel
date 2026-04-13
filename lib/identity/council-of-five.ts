/**
 * THE COUNCIL OF FIVE - Expert Analyst Personas
 * 
 * Five specialized analysts for E-E-A-T authority building
 * Each persona has expertise in a specific market category
 */

export type ExpertCategory = 
  | 'CRYPTO_BLOCKCHAIN'
  | 'MACRO_ECONOMY'
  | 'COMMODITIES'
  | 'TECH_STOCKS'
  | 'EMERGING_MARKETS'

export interface ExpertPersona {
  id: string
  name: string
  title: string
  category: ExpertCategory
  expertise: string[]
  education: {
    degree: string
    institution: string
    year: number
  }[]
  experience: {
    role: string
    organization: string
    years: string
  }[]
  certifications: string[]
  languages: string[]
  bio: Record<string, string> // language code -> bio
  imageUrl: string
  linkedIn?: string
  twitter?: string
  publications: number
  yearsExperience: number
}

// ============================================================================
// THE COUNCIL OF FIVE
// ============================================================================

export const COUNCIL_OF_FIVE: Record<ExpertCategory, ExpertPersona> = {
  CRYPTO_BLOCKCHAIN: {
    id: 'anya-chen',
    name: 'Dr. Anya Chen',
    title: 'Chief Blockchain Architect',
    category: 'CRYPTO_BLOCKCHAIN',
    expertise: [
      'On-Chain Analytics',
      'DeFi Protocol Analysis',
      'Whale Wallet Tracking',
      'Smart Contract Auditing',
      'Cryptocurrency Market Microstructure'
    ],
    education: [
      {
        degree: 'Ph.D. in Computer Science (Blockchain Systems)',
        institution: 'MIT',
        year: 2018
      },
      {
        degree: 'M.S. in Cryptography',
        institution: 'Stanford University',
        year: 2014
      }
    ],
    experience: [
      {
        role: 'Lead Blockchain Researcher',
        organization: 'Chainalysis',
        years: '2019-2023'
      },
      {
        role: 'Senior Cryptographer',
        organization: 'Coinbase',
        years: '2016-2019'
      }
    ],
    certifications: [
      'Certified Blockchain Expert (CBE)',
      'Certified Bitcoin Professional (CBP)',
      'Ethereum Developer Certification'
    ],
    languages: ['English', 'Mandarin', 'German'],
    bio: {
      en: 'Dr. Anya Chen is a leading blockchain architect with over 8 years of experience in cryptocurrency markets and on-chain analytics. Her research on whale wallet behavior has been cited in over 150 academic papers. She specializes in identifying large holder movements and predicting market shifts through proprietary on-chain metrics.',
      tr: 'Dr. Anya Chen, kripto para piyasaları ve zincir üstü analitikte 8 yılı aşkın deneyime sahip önde gelen bir blockchain mimarıdır. Balina cüzdan davranışları üzerine yaptığı araştırmalar 150\'den fazla akademik makalede alıntılanmıştır. Özel zincir üstü metrikler aracılığıyla büyük sahiplerin hareketlerini tespit etme ve piyasa değişimlerini tahmin etme konusunda uzmanlaşmıştır.',
      de: 'Dr. Anya Chen ist eine führende Blockchain-Architektin mit über 8 Jahren Erfahrung in Kryptowährungsmärkten und On-Chain-Analytik. Ihre Forschung zum Verhalten von Wal-Wallets wurde in über 150 wissenschaftlichen Arbeiten zitiert.',
      fr: 'Dr. Anya Chen est une architecte blockchain de premier plan avec plus de 8 ans d\'expérience dans les marchés des cryptomonnaies et l\'analyse on-chain. Ses recherches sur le comportement des portefeuilles de baleines ont été citées dans plus de 150 articles académiques.',
      es: 'La Dra. Anya Chen es una arquitecta blockchain líder con más de 8 años de experiencia en mercados de criptomonedas y análisis on-chain. Su investigación sobre el comportamiento de las billeteras ballena ha sido citada en más de 150 artículos académicos.',
      ru: 'Доктор Аня Чен - ведущий архитектор блокчейна с более чем 8-летним опытом работы на рынках криптовалют и он-чейн аналитики. Ее исследования поведения китовых кошельков цитировались в более чем 150 научных статьях.',
      ar: 'الدكتورة آنيا تشين هي مهندسة بلوكتشين رائدة تتمتع بخبرة تزيد عن 8 سنوات في أسواق العملات المشفرة والتحليلات على السلسلة. تم الاستشهاد بأبحاثها حول سلوك محافظ الحيتان في أكثر من 150 ورقة أكاديمية.',
      zh: '陈安雅博士是区块链架构专家，在加密货币市场与链上分析领域拥有逾 8 年经验。其关于巨鲸钱包行为的研究被 150 余篇学术论文引用。她擅长通过自有链上指标识别大额持仓变动并预测市场走势。',
      jp: 'アーニャ・チェン博士は、暗号資産市場とオンチェーン分析において8年以上の経験を持つブロックチェーンアーキテクトです。ホエールウォレットの行動に関する研究は150以上の学術論文で引用されています。独自のオンチェーン指標を用いて大口保有者の動向を特定し、市場の変動を予測する専門家です。'
    },
    imageUrl: '/images/experts/anya-chen.jpg',
    linkedIn: 'https://linkedin.com/in/anya-chen-blockchain',
    twitter: '@AnyaChenCrypto',
    publications: 47,
    yearsExperience: 8
  },

  MACRO_ECONOMY: {
    id: 'marcus-vane',
    name: 'Marcus Vane, CFA',
    title: 'Chief Macro Strategist',
    category: 'MACRO_ECONOMY',
    expertise: [
      'Central Bank Policy Analysis',
      'Interest Rate Forecasting',
      'Inflation Dynamics',
      'Currency Markets',
      'Global Economic Cycles'
    ],
    education: [
      {
        degree: 'MBA in Finance',
        institution: 'London Business School',
        year: 2012
      },
      {
        degree: 'B.A. in Economics',
        institution: 'University of Oxford',
        year: 2008
      }
    ],
    experience: [
      {
        role: 'Senior Macro Strategist',
        organization: 'Goldman Sachs',
        years: '2018-2024'
      },
      {
        role: 'Economic Analyst',
        organization: 'Bank of England',
        years: '2012-2018'
      }
    ],
    certifications: [
      'Chartered Financial Analyst (CFA)',
      'Financial Risk Manager (FRM)',
      'Certified International Investment Analyst (CIIA)'
    ],
    languages: ['English', 'French', 'Spanish'],
    bio: {
      en: 'Marcus Vane is a seasoned macro strategist with 16 years of experience analyzing central bank policies and global economic trends. His accurate predictions of FED rate decisions have earned him recognition as one of the top 10 macro analysts globally. He specializes in translating complex monetary policy into actionable market insights.',
      tr: 'Marcus Vane, merkez bankası politikalarını ve küresel ekonomik trendleri analiz etmede 16 yıllık deneyime sahip deneyimli bir makro stratejisttir. FED faiz kararlarına ilişkin isabetli tahminleri, onu küresel olarak en iyi 10 makro analist arasına sokmuştur. Karmaşık para politikasını uygulanabilir piyasa içgörülerine dönüştürme konusunda uzmanlaşmıştır.',
      de: 'Marcus Vane ist ein erfahrener Makro-Stratege mit 16 Jahren Erfahrung in der Analyse von Zentralbankpolitik und globalen Wirtschaftstrends. Seine präzisen Vorhersagen von FED-Zinsentscheidungen haben ihm Anerkennung als einer der Top-10-Makroanalysten weltweit eingebracht.',
      fr: 'Marcus Vane est un stratège macro chevronné avec 16 ans d\'expérience dans l\'analyse des politiques des banques centrales et des tendances économiques mondiales. Ses prédictions précises des décisions de taux de la FED lui ont valu d\'être reconnu comme l\'un des 10 meilleurs analystes macro au monde.',
      es: 'Marcus Vane es un estratega macro experimentado con 16 años de experiencia analizando políticas de bancos centrales y tendencias económicas globales. Sus predicciones precisas de las decisiones de tasas de la FED le han valido el reconocimiento como uno de los 10 mejores analistas macro a nivel mundial.',
      ru: 'Маркус Вейн - опытный макростратег с 16-летним опытом анализа политики центральных банков и глобальных экономических тенденций. Его точные прогнозы решений ФРС по процентным ставкам принесли ему признание как одного из 10 лучших макроаналитиков в мире.',
      ar: 'ماركوس فين هو استراتيجي اقتصادي كلي متمرس يتمتع بخبرة 16 عامًا في تحليل سياسات البنوك المركزية والاتجاهات الاقتصادية العالمية. حصلت توقعاته الدقيقة لقرارات أسعار الفائدة الفيدرالية على اعتراف كواحد من أفضل 10 محللين اقتصاديين كليين عالميًا.',
      zh: '马库斯·韦恩是资深宏观策略师，拥有 16 年央行政策与全球经济趋势分析经验。其对美联储利率决策的准确预测使他跻身全球十大宏观分析师之列。他擅长将复杂货币政策转化为可操作的市场洞察。',
      jp: 'マーカス・ヴェインは、中央銀行の政策とグローバル経済トレンドの分析において16年の経験を持つ熟練のマクロストラテジストです。FRBの金利決定に関する正確な予測により、世界トップ10のマクロアナリストとして認められています。複雑な金融政策を実行可能な市場インサイトに変換する専門家です。'
    },
    imageUrl: '/images/experts/marcus-vane.jpg',
    linkedIn: 'https://linkedin.com/in/marcus-vane-cfa',
    twitter: '@MarcusVaneMacro',
    publications: 89,
    yearsExperience: 16
  },

  COMMODITIES: {
    id: 'elena-rodriguez',
    name: 'Elena Rodriguez, CMT',
    title: 'Senior Commodities Analyst',
    category: 'COMMODITIES',
    expertise: [
      'Precious Metals Analysis',
      'Energy Markets',
      'Technical Analysis',
      'Supply Chain Dynamics',
      'Commodity Futures Trading'
    ],
    education: [
      {
        degree: 'M.S. in Commodity Trading',
        institution: 'University of Geneva',
        year: 2015
      },
      {
        degree: 'B.S. in Geology',
        institution: 'Colorado School of Mines',
        year: 2011
      }
    ],
    experience: [
      {
        role: 'Lead Commodities Strategist',
        organization: 'JP Morgan Commodities',
        years: '2020-2024'
      },
      {
        role: 'Precious Metals Analyst',
        organization: 'World Gold Council',
        years: '2015-2020'
      }
    ],
    certifications: [
      'Chartered Market Technician (CMT)',
      'Certified Commodity Trader (CCT)',
      'Energy Risk Professional (ERP)'
    ],
    languages: ['English', 'Spanish', 'Portuguese'],
    bio: {
      en: 'Elena Rodriguez is a leading commodities analyst with 13 years of experience in precious metals and energy markets. Her technical analysis of gold price movements has achieved 82% accuracy over the past 5 years. She combines geological expertise with market analysis to provide unique insights into commodity supply-demand dynamics.',
      tr: 'Elena Rodriguez, değerli metaller ve enerji piyasalarında 13 yıllık deneyime sahip önde gelen bir emtia analistidir. Altın fiyat hareketlerine ilişkin teknik analizi son 5 yılda %82 doğruluk oranına ulaşmıştır. Emtia arz-talep dinamiklerine benzersiz içgörüler sağlamak için jeolojik uzmanlığı piyasa analiziyle birleştirir.',
      de: 'Elena Rodriguez ist eine führende Rohstoffanalystin mit 13 Jahren Erfahrung in Edelmetall- und Energiemärkten. Ihre technische Analyse von Goldpreisbewegungen hat in den letzten 5 Jahren eine Genauigkeit von 82% erreicht.',
      fr: 'Elena Rodriguez est une analyste de matières premières de premier plan avec 13 ans d\'expérience dans les métaux précieux et les marchés de l\'énergie. Son analyse technique des mouvements des prix de l\'or a atteint une précision de 82% au cours des 5 dernières années.',
      es: 'Elena Rodriguez es una analista de materias primas líder con 13 años de experiencia en metales preciosos y mercados energéticos. Su análisis técnico de los movimientos del precio del oro ha logrado una precisión del 82% en los últimos 5 años.',
      ru: 'Елена Родригес - ведущий аналитик товарных рынков с 13-летним опытом работы на рынках драгоценных металлов и энергоносителей. Ее технический анализ движения цен на золото достиг точности 82% за последние 5 лет.',
      ar: 'إيلينا رودريغيز هي محللة سلع رائدة تتمتع بخبرة 13 عامًا في أسواق المعادن الثمينة والطاقة. حقق تحليلها الفني لحركات أسعار الذهب دقة 82٪ على مدى السنوات الخمس الماضية.',
      zh: '埃琳娜·罗德里格斯是资深大宗商品分析师，在贵金属与能源市场拥有 13 年经验。其黄金价格走势技术分析在过去 5 年准确率达 82%。她将地质专业与市场分析相结合，为大宗商品供需提供独特洞察。',
      jp: 'エレナ・ロドリゲスは、貴金属とエネルギー市場において13年の経験を持つコモディティアナリストです。金価格の動きに対するテクニカル分析は過去5年間で82%の精度を達成しています。地質学の専門知識と市場分析を組み合わせ、コモディティの需給ダイナミクスに独自の洞察を提供します。'
    },
    imageUrl: '/images/experts/elena-rodriguez.jpg',
    linkedIn: 'https://linkedin.com/in/elena-rodriguez-cmt',
    twitter: '@ElenaRodCommodities',
    publications: 62,
    yearsExperience: 13
  },

  TECH_STOCKS: {
    id: 'david-kim',
    name: 'David Kim, Ph.D.',
    title: 'Technology Sector Specialist',
    category: 'TECH_STOCKS',
    expertise: [
      'AI & Machine Learning Markets',
      'Semiconductor Industry Analysis',
      'Cloud Computing Valuation',
      'Tech IPO Assessment',
      'Innovation Cycle Forecasting'
    ],
    education: [
      {
        degree: 'Ph.D. in Electrical Engineering (AI Systems)',
        institution: 'Carnegie Mellon University',
        year: 2016
      },
      {
        degree: 'M.S. in Computer Science',
        institution: 'UC Berkeley',
        year: 2012
      }
    ],
    experience: [
      {
        role: 'Senior Tech Analyst',
        organization: 'Morgan Stanley',
        years: '2021-2024'
      },
      {
        role: 'AI Research Scientist',
        organization: 'Google DeepMind',
        years: '2016-2021'
      }
    ],
    certifications: [
      'Chartered Financial Analyst (CFA)',
      'Certified Technology Specialist (CTS)',
      'AI Ethics Certification'
    ],
    languages: ['English', 'Korean', 'Japanese'],
    bio: {
      en: 'Dr. David Kim bridges the gap between technology and finance with 12 years of experience in AI systems and tech equity analysis. His unique background as both an AI researcher and financial analyst provides unparalleled insights into technology valuations. He accurately predicted the AI boom of 2023-2024, positioning clients ahead of the market.',
      tr: 'Dr. David Kim, AI sistemleri ve teknoloji hisse senedi analizinde 12 yıllık deneyimle teknoloji ve finans arasındaki boşluğu dolduruyor. Hem AI araştırmacısı hem de finansal analist olarak benzersiz geçmişi, teknoloji değerlemelerine eşsiz içgörüler sağlıyor. 2023-2024 AI patlamasını doğru bir şekilde tahmin ederek müşterilerini piyasanın önüne geçirdi.',
      de: 'Dr. David Kim überbrückt die Lücke zwischen Technologie und Finanzen mit 12 Jahren Erfahrung in KI-Systemen und Tech-Aktienanalyse. Sein einzigartiger Hintergrund als KI-Forscher und Finanzanalyst bietet unvergleichliche Einblicke in Technologiebewertungen.',
      fr: 'Dr. David Kim comble le fossé entre la technologie et la finance avec 12 ans d\'expérience dans les systèmes d\'IA et l\'analyse des actions technologiques. Son parcours unique en tant que chercheur en IA et analyste financier offre des perspectives inégalées sur les valorisations technologiques.',
      es: 'El Dr. David Kim cierra la brecha entre tecnología y finanzas con 12 años de experiencia en sistemas de IA y análisis de acciones tecnológicas. Su experiencia única como investigador de IA y analista financiero proporciona perspectivas incomparables sobre valoraciones tecnológicas.',
      ru: 'Доктор Дэвид Ким преодолевает разрыв между технологиями и финансами с 12-летним опытом работы в системах ИИ и анализе технологических акций. Его уникальный опыт как исследователя ИИ и финансового аналитика обеспечивает беспрецедентное понимание технологических оценок.',
      ar: 'يسد الدكتور ديفيد كيم الفجوة بين التكنولوجيا والتمويل بخبرة 12 عامًا في أنظمة الذكاء الاصطناعي وتحليل أسهم التكنولوجيا. توفر خلفيته الفريدة كباحث في الذكاء الاصطناعي ومحلل مالي رؤى لا مثيل لها في تقييمات التكنولوجيا.',
      zh: '金大卫博士在 AI 系统与科技股分析领域拥有 12 年经验，弥合科技与金融之间的鸿沟。其兼具 AI 研究员与金融分析师背景，为科技估值提供独到洞察。他准确预判 2023–2024 年 AI 热潮，帮助客户领先市场。',
      jp: 'デイビッド・キム博士は、AIシステムとテクノロジー株分析において12年の経験を持ち、テクノロジーと金融の架け橋です。AI研究者と金融アナリストとしての独自の経歴により、テクノロジー企業の評価に比類のない洞察を提供します。2023-2024年のAIブームを正確に予測し、クライアントを市場に先駆けてポジショニングしました。'
    },
    imageUrl: '/images/experts/david-kim.jpg',
    linkedIn: 'https://linkedin.com/in/david-kim-tech-analyst',
    twitter: '@DavidKimTech',
    publications: 73,
    yearsExperience: 12
  },

  EMERGING_MARKETS: {
    id: 'sofia-almeida',
    name: 'Sofia Almeida, CFA',
    title: 'Emerging Markets Director',
    category: 'EMERGING_MARKETS',
    expertise: [
      'BIST & Turkish Markets',
      'Latin American Equities',
      'Frontier Markets Analysis',
      'Currency Risk Management',
      'Political Risk Assessment'
    ],
    education: [
      {
        degree: 'MBA in International Finance',
        institution: 'INSEAD',
        year: 2014
      },
      {
        degree: 'B.A. in International Relations',
        institution: 'Sciences Po Paris',
        year: 2010
      }
    ],
    experience: [
      {
        role: 'Head of Emerging Markets',
        organization: 'BlackRock',
        years: '2019-2024'
      },
      {
        role: 'EM Equity Analyst',
        organization: 'HSBC',
        years: '2014-2019'
      }
    ],
    certifications: [
      'Chartered Financial Analyst (CFA)',
      'Certified International Investment Analyst (CIIA)',
      'Emerging Markets Specialist (EMS)'
    ],
    languages: ['English', 'Portuguese', 'Spanish', 'Turkish', 'French'],
    bio: {
      en: 'Sofia Almeida is a distinguished emerging markets specialist with 14 years of experience across BIST, Latin American, and frontier markets. Her multilingual capabilities and deep understanding of political-economic dynamics enable unique insights into high-growth markets. She has successfully navigated clients through multiple EM crises, preserving capital while capturing upside opportunities.',
      tr: 'Sofia Almeida, BIST, Latin Amerika ve sınır piyasalarında 14 yıllık deneyime sahip seçkin bir gelişmekte olan piyasalar uzmanıdır. Çok dilli yetenekleri ve politik-ekonomik dinamiklere dair derin anlayışı, yüksek büyüme potansiyeli olan piyasalara benzersiz içgörüler sağlar. Müşterilerini birden fazla gelişmekte olan piyasa krizinden başarıyla geçirerek sermayeyi korurken yukarı yönlü fırsatları yakalamıştır.',
      de: 'Sofia Almeida ist eine angesehene Spezialistin für Schwellenländer mit 14 Jahren Erfahrung in BIST, lateinamerikanischen und Frontier-Märkten. Ihre mehrsprachigen Fähigkeiten und ihr tiefes Verständnis politisch-ökonomischer Dynamiken ermöglichen einzigartige Einblicke in wachstumsstarke Märkte.',
      fr: 'Sofia Almeida est une spécialiste distinguée des marchés émergents avec 14 ans d\'expérience sur les marchés BIST, latino-américains et frontières. Ses capacités multilingues et sa compréhension approfondie des dynamiques politico-économiques permettent des perspectives uniques sur les marchés à forte croissance.',
      es: 'Sofia Almeida es una especialista distinguida en mercados emergentes con 14 años de experiencia en BIST, mercados latinoamericanos y fronterizos. Sus capacidades multilingües y su profunda comprensión de las dinámicas político-económicas permiten perspectivas únicas sobre mercados de alto crecimiento.',
      ru: 'София Алмейда - выдающийся специалист по развивающимся рынкам с 14-летним опытом работы на рынках BIST, Латинской Америки и пограничных рынках. Ее многоязычные способности и глубокое понимание политико-экономической динамики обеспечивают уникальное понимание быстрорастущих рынков.',
      ar: 'صوفيا ألميدا هي متخصصة متميزة في الأسواق الناشئة تتمتع بخبرة 14 عامًا في أسواق BIST وأمريكا اللاتينية والأسواق الحدودية. تتيح قدراتها متعددة اللغات وفهمها العميق للديناميكيات السياسية والاقتصادية رؤى فريدة في الأسواق عالية النمو.',
      zh: '索菲娅·阿尔梅达是新兴市场专家，在 BIST、拉美与前沿市场拥有 14 年经验。其多语言能力与对政治经济动态的深入理解，为高增长市场提供独特洞察。她曾多次带领客户度过新兴市场危机，在保全资本的同时把握上行机会。',
      jp: 'ソフィア・アルメイダは、BIST、ラテンアメリカ、フロンティア市場において14年の経験を持つ新興市場スペシャリストです。多言語能力と政治経済ダイナミクスへの深い理解により、高成長市場に独自の洞察を提供します。複数の新興市場危機を通じてクライアントの資本を守りながら、上昇機会を捉えてきました。'
    },
    imageUrl: '/images/experts/sofia-almeida.jpg',
    linkedIn: 'https://linkedin.com/in/sofia-almeida-em',
    twitter: '@SofiaAlmeidaEM',
    publications: 54,
    yearsExperience: 14
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get expert by category
 */
export function getExpertByCategory(category: ExpertCategory): ExpertPersona {
  return COUNCIL_OF_FIVE[category]
}

/**
 * Get all experts
 */
export function getAllExperts(): ExpertPersona[] {
  return Object.values(COUNCIL_OF_FIVE)
}

/**
 * Get expert bio in specific language
 */
export function getExpertBio(category: ExpertCategory, language: string): string {
  const expert = COUNCIL_OF_FIVE[category]
  return expert.bio[language] || expert.bio['en']
}

/**
 * Generate Schema.org Person markup for expert
 */
export function generateExpertSchema(category: ExpertCategory) {
  const expert = COUNCIL_OF_FIVE[category]
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `https://siaintel.com/experts/${expert.id}`,
    name: expert.name,
    jobTitle: expert.title,
    description: expert.bio.en,
    image: `https://siaintel.com${expert.imageUrl}`,
    url: `https://siaintel.com/experts/${expert.id}`,
    sameAs: [
      expert.linkedIn,
      `https://twitter.com/${expert.twitter}`
    ].filter(Boolean),
    alumniOf: expert.education.map(edu => ({
      '@type': 'EducationalOrganization',
      name: edu.institution
    })),
    hasCredential: expert.certifications.map(cert => ({
      '@type': 'EducationalOccupationalCredential',
      credentialCategory: 'Professional Certification',
      name: cert
    })),
    knowsLanguage: expert.languages,
    worksFor: {
      '@type': 'Organization',
      name: 'SIAINTEL',
      url: 'https://siaintel.com'
    }
  }
}

export default COUNCIL_OF_FIVE
