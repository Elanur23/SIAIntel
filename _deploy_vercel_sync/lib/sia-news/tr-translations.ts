/**
 * Turkish Translations for SIA News Admin Dashboard
 */

export const TR_TRANSLATIONS = {
  // Header
  title: 'SIA Haber Kontrol Paneli',
  subtitle: 'Çok Dilli Gerçek Zamanlı Haber Üretim Sistemi',
  systemActive: 'Sistem Aktif',
  
  // Time Range
  timeRange: 'Zaman Aralığı',
  lastHour: 'Son 1 Saat',
  last24Hours: 'Son 24 Saat',
  last7Days: 'Son 7 Gün',
  last30Days: 'Son 30 Gün',
  
  // Metrics Cards
  articlesGenerated: 'Üretilen Makaleler',
  totalInPeriod: 'Seçilen dönemdeki toplam',
  successRate: 'Başarı Oranı',
  publishedArticles: 'Yayınlanan makaleler',
  avgProcessingTime: 'Ort. İşlem Süresi',
  targetTime: 'Hedef: <15 saniye',
  articlesPerHour: 'Makale/Saat',
  generationRate: 'Üretim hızı',
  
  // Quality Metrics
  avgEEATScore: 'Ortalama E-E-A-T Skoru',
  minimum: 'Minimum',
  avgSentiment: 'Ortalama Duygu Analizi',
  range: 'Aralık',
  bearish: 'Düşüş Eğilimli',
  bullish: 'Yükseliş Eğilimli',
  avgOriginality: 'Ortalama Özgünlük',
  
  // Charts
  languageDistribution: 'Dil Dağılımı',
  eeatScoresByLanguage: 'Dillere Göre E-E-A-T Skorları',
  sentimentAnalysisByLanguage: 'Dillere Göre Duygu Analizi',
  
  // Manual Generation
  manualGenerationTrigger: 'Manuel Üretim Tetikleyici',
  rawNewsContent: 'Ham Haber İçeriği',
  enterRawNews: 'Ham haber içeriğini buraya girin...',
  rawNewsHelp: 'SIA Haber pipeline\'ından işlenecek ham haber içeriğini sağlayın',
  asset: 'Varlık',
  assetPlaceholder: 'BTC, ETH, vb.',
  language: 'Dil',
  region: 'Bölge',
  generateArticle: 'Makale Üret',
  generatingArticle: 'Makale Üretiliyor...',
  
  // Languages
  languages: {
    tr: 'Türkçe',
    en: 'İngilizce',
    de: 'Almanca',
    fr: 'Fransızca',
    es: 'İspanyolca',
    ru: 'Rusça'
  },
  
  // Regions
  regions: {
    TR: 'Türkiye',
    US: 'Amerika Birleşik Devletleri',
    DE: 'Almanya',
    FR: 'Fransa',
    ES: 'İspanya',
    RU: 'Rusya'
  },
  
  // Article Management
  articleManagement: 'Makale Yönetimi',
  showFilters: 'Filtreleri Göster',
  hideFilters: 'Filtreleri Gizle',
  allLanguages: 'Tüm Diller',
  allRegions: 'Tüm Bölgeler',
  entitySearch: 'Varlık Arama',
  entityPlaceholder: 'Bitcoin, FED, vb.',
  sentimentMin: 'Min Duygu',
  sentimentMax: 'Maks Duygu',
  startDate: 'Başlangıç Tarihi',
  endDate: 'Bitiş Tarihi',
  applyFilters: 'Filtreleri Uygula',
  clearFilters: 'Filtreleri Temizle',
  
  // Article Table
  lang: 'Dil',
  columnTitle: 'Başlık',
  eeatScore: 'E-E-A-T',
  sentiment: 'Duygu',
  status: 'Durum',
  timestamp: 'Zaman',
  actions: 'İşlemler',
  viewDetails: 'Detayları Gör',
  published: 'Yayınlandı',
  draft: 'Taslak',
  
  // Article Detail Modal
  articleDetails: 'Makale Detayları',
  close: 'Kapat',
  metadata: 'Meta Veriler',
  version: 'Versiyon',
  qualityMetrics: 'Kalite Metrikleri',
  originalityScore: 'Özgünlük Skoru',
  confidenceScore: 'Güven Skoru',
  technicalDepth: 'Teknik Derinlik',
  contentLayers: 'İçerik Katmanları',
  headline: 'Başlık',
  summary: 'Özet',
  siaInsight: 'SIA Görüşü',
  riskDisclaimer: 'Risk Uyarısı',
  fullContent: 'Tam İçerik',
  entities: 'Varlıklar',
  technicalGlossary: 'Teknik Sözlük',
  term: 'Terim',
  definition: 'Tanım',
  causalChains: 'Nedensel Zincirler',
  trigger: 'Tetikleyici',
  intermediate: 'Ara',
  outcome: 'Sonuç',
  validationResults: 'Doğrulama Sonuçları',
  consensusScore: 'Konsensüs Skoru',
  overallConfidence: 'Genel Güven',
  approved: 'Onaylandı',
  rejected: 'Reddedildi',
  agent: 'Ajan',
  confidence: 'Güven',
  issues: 'Sorunlar',
  recommendations: 'Öneriler',
  fullMetadata: 'Tam Meta Veriler',
  wordCount: 'Kelime Sayısı',
  readingTime: 'Okuma Süresi',
  minutes: 'dakika',
  generatedAt: 'Üretilme Zamanı',
  publishedAt: 'Yayınlanma Zamanı',
  sources: 'Kaynaklar',
  adSenseCompliant: 'AdSense Uyumlu',
  yes: 'Evet',
  no: 'Hayır',
  
  // Empty States
  noArticlesYet: 'Henüz makale üretilmedi',
  useManualGeneration: 'İlk makalenizi oluşturmak için yukarıdaki manuel üretim tetikleyicisini kullanın',
  
  // Loading States
  loadingDashboard: 'SIA Haber Kontrol Paneli Yükleniyor...',
  
  // Alerts
  enterRawNewsAlert: 'Lütfen ham haber içeriği girin',
  generationSuccess: 'Makale başarıyla üretildi!',
  generationFailed: 'Üretim başarısız',
  failedToGenerate: 'Makale üretilemedi',
  
  // Technical Depth Levels
  technicalDepthLevels: {
    HIGH: 'Yüksek',
    MEDIUM: 'Orta',
    LOW: 'Düşük'
  }
}
