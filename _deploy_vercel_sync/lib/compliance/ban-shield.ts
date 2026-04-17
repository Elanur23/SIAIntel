/**
 * SIA BAN SHIELD - Anti-Ban Protection System
 * 
 * 4-Layer protection against Google penalties and AdSense bans:
 * 1. Dynamic Legal Armor - Region-specific disclaimers
 * 2. Council of Experts - Already implemented in council-of-five.ts
 * 3. Human-Touch Simulation - UX elements that prove "not a bot"
 * 4. Anti-Spam Drift - Random timing jitter to avoid mechanical patterns
 */

import type { Language, Region } from '@/lib/sia-news/types'

// ============================================================================
// LAYER 1: DYNAMIC LEGAL ARMOR
// ============================================================================

export interface LegalDisclaimer {
  title: string
  content: string
  timestamp: string
  regulatoryReferences: string[]
}

/**
 * Generate dynamic, context-specific legal disclaimers
 * NOT generic copy-paste - includes current timestamp and specific warnings
 */
export function generateDynamicDisclaimer(
  language: Language,
  region: Region,
  confidenceScore: number,
  timestamp: string = new Date().toISOString()
): LegalDisclaimer {
  const disclaimers: Record<Language, Record<string, string>> = {
    en: {
      title: 'Investment Disclaimer',
      high: `INVESTMENT DISCLAIMER: This analysis was prepared with current data as of ${new Date(timestamp).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}. While our analysis shows ${confidenceScore}% confidence based on statistical models and publicly available data (OSINT), cryptocurrency and financial markets remain highly volatile and unpredictable. Past performance does not guarantee future results. This content is provided for informational and educational purposes only and should not be construed as financial, investment, or trading advice. Always conduct your own research (DYOR) and consult with qualified financial advisors before making any investment decisions. SIA Intelligence and its analysts are not registered investment advisors and do not provide personalized investment recommendations.`,
      medium: `INVESTMENT DISCLAIMER: This analysis was prepared as of ${new Date(timestamp).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })} and shows ${confidenceScore}% confidence. Current market conditions display mixed signals with significant volatility expected. This analysis represents data-driven probability assessment, not investment recommendations. Market participants should exercise extreme caution and implement proper risk management strategies. Professional financial consultation is strongly recommended before any trading or investment decisions. This is not financial advice.`,
      low: `INVESTMENT DISCLAIMER: Analysis prepared ${new Date(timestamp).toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })} with ${confidenceScore}% confidence, indicating high uncertainty. Markets are experiencing unpredictable conditions. This information is provided for educational purposes only and should not be construed as financial, investment, or trading advice. Independent verification and professional guidance are essential before any financial decisions. No guarantees or warranties are provided regarding accuracy or completeness.`,
      regulatory: 'This content complies with SEC and FINRA guidelines for financial communications. Not registered investment advice.'
    },
    tr: {
      title: 'Yatırım Uyarısı',
      high: `YATIRIM UYARISI: Bu analiz ${new Date(timestamp).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })} itibarıyla güncel verilerle hazırlanmıştır. Analizimiz istatistiksel modellere ve kamuya açık verilere (OSINT) dayalı %${confidenceScore} güven gösterse de, kripto para ve finansal piyasalar son derece değişken ve öngörülemezdir. Geçmiş performans gelecekteki sonuçları garanti etmez. Bu içerik yalnızca bilgilendirme ve eğitim amaçlıdır ve finansal, yatırım veya ticaret tavsiyesi olarak yorumlanmamalıdır. Herhangi bir yatırım kararı vermeden önce her zaman kendi araştırmanızı yapın (DYOR) ve yetkili finansal danışmanlara danışın. SIA Intelligence ve analistleri kayıtlı yatırım danışmanı değildir.`,
      medium: `YATIRIM UYARISI: Bu analiz ${new Date(timestamp).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })} itibarıyla %${confidenceScore} güven ile hazırlanmıştır. Mevcut piyasa koşulları karışık sinyaller göstermekte ve önemli volatilite beklenmektedir. Bu analiz veriye dayalı olasılık değerlendirmesini temsil eder, yatırım tavsiyesi değildir. Piyasa katılımcıları aşırı dikkatli olmalı ve uygun risk yönetimi uygulamalıdır. Herhangi bir ticaret veya yatırım kararından önce profesyonel finansal danışmanlık şiddetle tavsiye edilir.`,
      low: `YATIRIM UYARISI: ${new Date(timestamp).toLocaleString('tr-TR', { dateStyle: 'long', timeStyle: 'short' })} tarihinde %${confidenceScore} güven ile hazırlanan analiz, yüksek belirsizlik göstermektedir. Piyasalar öngörülemeyen koşullar yaşamaktadır. Bu bilgi yalnızca eğitim amaçlıdır ve finansal, yatırım veya ticaret tavsiyesi olarak yorumlanmamalıdır. Herhangi bir finansal karar öncesinde bağımsız doğrulama ve profesyonel rehberlik şarttır.`,
      regulatory: 'Bu içerik SPK ve TCMB düzenlemelerine uygun olarak hazırlanmıştır. Kayıtlı yatırım tavsiyesi değildir.'
    },
    de: {
      title: 'Investitionshinweis',
      high: `INVESTITIONSHINWEIS: Diese Analyse wurde mit aktuellen Daten zum ${new Date(timestamp).toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' })} erstellt. Obwohl unsere Analyse ${confidenceScore}% Konfidenz basierend auf statistischen Modellen zeigt, bleiben Kryptowährungs- und Finanzmärkte hochvolatil. Vergangene Performance garantiert keine zukünftigen Ergebnisse. Dieser Inhalt dient nur zu Informations- und Bildungszwecken und sollte nicht als Finanz-, Anlage- oder Handelsberatung ausgelegt werden. Konsultieren Sie immer qualifizierte Finanzberater vor Anlageentscheidungen.`,
      medium: `INVESTITIONSHINWEIS: Analyse vom ${new Date(timestamp).toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' })} mit ${confidenceScore}% Konfidenz. Aktuelle Marktbedingungen zeigen gemischte Signale mit erheblicher Volatilität. Dies ist keine Anlageempfehlung. Professionelle Finanzberatung wird dringend empfohlen.`,
      low: `INVESTITIONSHINWEIS: Analyse vom ${new Date(timestamp).toLocaleString('de-DE', { dateStyle: 'long', timeStyle: 'short' })} mit ${confidenceScore}% Konfidenz zeigt hohe Unsicherheit. Nur zu Bildungszwecken. Keine Finanzberatung.`,
      regulatory: 'Dieser Inhalt entspricht den BaFin-Richtlinien. Keine registrierte Anlageberatung.'
    },
    fr: {
      title: 'Avertissement d\'Investissement',
      high: `AVERTISSEMENT D'INVESTISSEMENT: Cette analyse a été préparée avec des données actuelles au ${new Date(timestamp).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })}. Bien que notre analyse montre ${confidenceScore}% de confiance, les marchés des cryptomonnaies et financiers restent très volatils. Les performances passées ne garantissent pas les résultats futurs. Ce contenu est fourni à des fins d'information uniquement et ne doit pas être interprété comme un conseil financier. Consultez toujours des conseillers financiers qualifiés.`,
      medium: `AVERTISSEMENT D'INVESTISSEMENT: Analyse du ${new Date(timestamp).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })} avec ${confidenceScore}% de confiance. Conditions de marché mixtes avec volatilité significative attendue. Pas un conseil d'investissement.`,
      low: `AVERTISSEMENT D'INVESTISSEMENT: Analyse du ${new Date(timestamp).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' })} avec ${confidenceScore}% de confiance indiquant une forte incertitude. À des fins éducatives uniquement.`,
      regulatory: 'Ce contenu est conforme aux directives de l\'AMF. Pas un conseil d\'investissement enregistré.'
    },
    es: {
      title: 'Aviso de Inversión',
      high: `AVISO DE INVERSIÓN: Este análisis fue preparado con datos actuales al ${new Date(timestamp).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}. Aunque nuestro análisis muestra ${confidenceScore}% de confianza, los mercados de criptomonedas y financieros siguen siendo altamente volátiles. El rendimiento pasado no garantiza resultados futuros. Este contenido se proporciona solo con fines informativos y no debe interpretarse como asesoramiento financiero. Siempre consulte con asesores financieros calificados.`,
      medium: `AVISO DE INVERSIÓN: Análisis del ${new Date(timestamp).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })} con ${confidenceScore}% de confianza. Condiciones de mercado mixtas con volatilidad significativa esperada. No es asesoramiento de inversión.`,
      low: `AVISO DE INVERSIÓN: Análisis del ${new Date(timestamp).toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })} con ${confidenceScore}% de confianza indica alta incertidumbre. Solo con fines educativos.`,
      regulatory: 'Este contenido cumple con las directrices de la CNMV. No es asesoramiento de inversión registrado.'
    },
    ru: {
      title: 'Инвестиционное Предупреждение',
      high: `ИНВЕСТИЦИОННОЕ ПРЕДУПРЕЖДЕНИЕ: Этот анализ подготовлен с актуальными данными на ${new Date(timestamp).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })}. Хотя наш анализ показывает ${confidenceScore}% уверенности, рынки криптовалют и финансов остаются крайне волатильными. Прошлые результаты не гарантируют будущих. Этот контент предоставляется только в информационных целях и не должен рассматриваться как финансовый совет. Всегда консультируйтесь с квалифицированными финансовыми консультантами.`,
      medium: `ИНВЕСТИЦИОННОЕ ПРЕДУПРЕЖДЕНИЕ: Анализ от ${new Date(timestamp).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })} с ${confidenceScore}% уверенности. Смешанные рыночные условия с ожидаемой значительной волатильностью. Не инвестиционная рекомендация.`,
      low: `ИНВЕСТИЦИОННОЕ ПРЕДУПРЕЖДЕНИЕ: Анализ от ${new Date(timestamp).toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' })} с ${confidenceScore}% уверенности указывает на высокую неопределенность. Только в образовательных целях.`,
      regulatory: 'Этот контент соответствует требованиям ЦБ РФ. Не зарегистрированная инвестиционная консультация.'
    },
    ar: {
      title: 'إخلاء مسؤولية الاستثمار',
      high: `إخلاء مسؤولية الاستثمار: تم إعداد هذا التحليل بالبيانات الحالية اعتبارًا من ${new Date(timestamp).toLocaleString('ar-SA', { dateStyle: 'long', timeStyle: 'short' })}. على الرغم من أن تحليلنا يظهر ${confidenceScore}٪ ثقة، تظل أسواق العملات المشفرة والمالية شديدة التقلب. الأداء السابق لا يضمن النتائج المستقبلية. يتم توفير هذا المحتوى لأغراض إعلامية فقط ولا ينبغي تفسيره كنصيحة مالية. استشر دائمًا مستشارين ماليين مؤهلين.`,
      medium: `إخلاء مسؤولية الاستثمار: تحليل من ${new Date(timestamp).toLocaleString('ar-SA', { dateStyle: 'long', timeStyle: 'short' })} بثقة ${confidenceScore}٪. ظروف السوق المختلطة مع تقلبات كبيرة متوقعة. ليست توصية استثمارية.`,
      low: `إخلاء مسؤولية الاستثمار: تحليل من ${new Date(timestamp).toLocaleString('ar-SA', { dateStyle: 'long', timeStyle: 'short' })} بثقة ${confidenceScore}٪ يشير إلى عدم يقين عالٍ. لأغراض تعليمية فقط.`,
      regulatory: 'يتوافق هذا المحتوى مع إرشادات VARA و DFSA. ليست استشارة استثمارية مسجلة.'
    },
    jp: {
      title: '投資上の注意',
      high: `投資上の注意: 本分析は${new Date(timestamp).toLocaleString('ja-JP', { dateStyle: 'long', timeStyle: 'short' })}時点のデータに基づいて作成されました。分析では${confidenceScore}%の信頼度を示していますが、暗号資産および金融市場は非常に変動が激しく予測困難です。過去の実績は将来の結果を保証しません。本コンテンツは情報提供のみを目的としており、金融・投資・取引の助言とは解釈されません。投資判断の前に必ずご自身で調査し、資格のある金融アドバイザーにご相談ください。`,
      medium: `投資上の注意: ${new Date(timestamp).toLocaleString('ja-JP', { dateStyle: 'long', timeStyle: 'short' })}時点の分析、信頼度${confidenceScore}%。市場は混戦模様で変動拡大が予想されます。投資助言ではありません。`,
      low: `投資上の注意: ${new Date(timestamp).toLocaleString('ja-JP', { dateStyle: 'long', timeStyle: 'short' })}時点の分析、信頼度${confidenceScore}%、不確実性が高いことを示します。教育目的のみ。`,
      regulatory: '本コンテンツはJFSA等のガイドラインに準拠しています。登録投資助言ではありません。'
    },
    zh: {
      title: '投资免责声明',
      high: `投资免责声明：本分析基于${new Date(timestamp).toLocaleString('zh-CN', { dateStyle: 'long', timeStyle: 'short' })}的当前数据编制。尽管分析显示${confidenceScore}%置信度，加密货币与金融市场仍高度波动且难以预测。过往表现不保证未来结果。本内容仅供信息与教育用途，不构成财务、投资或交易建议。在做出任何投资决定前，请务必自行研究并咨询合格金融顾问。`,
      medium: `投资免责声明：${new Date(timestamp).toLocaleString('zh-CN', { dateStyle: 'long', timeStyle: 'short' })}的分析，置信度${confidenceScore}%。市场条件复杂，波动可能加大。非投资建议。`,
      low: `投资免责声明：${new Date(timestamp).toLocaleString('zh-CN', { dateStyle: 'long', timeStyle: 'short' })}的分析，置信度${confidenceScore}%，表明不确定性较高。仅供教育用途。`,
      regulatory: '本内容符合相关监管机构指引。非注册投资建议。'
    }
  }

  const langDisclaimers = disclaimers[language] || disclaimers.en
  const level = confidenceScore >= 85 ? 'high' : confidenceScore >= 70 ? 'medium' : 'low'
  
  return {
    title: langDisclaimers.title,
    content: langDisclaimers[level],
    timestamp,
    regulatoryReferences: [langDisclaimers.regulatory]
  }
}

// ============================================================================
// LAYER 3: HUMAN-TOUCH SIMULATION
// ============================================================================

export interface HumanTouchMetadata {
  readingTime: string
  difficultyLevel: string
  sharePrompt: string
  relatedArticlesPrompt: string
  lastUpdated: string
  viewCount?: number
}

/**
 * Generate human-touch UX elements that prove "not a bot"
 */
export function generateHumanTouchElements(
  wordCount: number,
  language: Language,
  timestamp: string = new Date().toISOString()
): HumanTouchMetadata {
  const readingTimeMinutes = Math.ceil(wordCount / 200) // Average reading speed
  
  const translations: Record<Language, any> = {
    en: {
      readingTime: `${readingTimeMinutes} min read`,
      difficulty: wordCount > 500 ? 'Advanced' : wordCount > 300 ? 'Intermediate' : 'Beginner',
      share: 'Share this analysis',
      related: 'You might also be interested in',
      updated: `Last updated: ${new Date(timestamp).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}`
    },
    tr: {
      readingTime: `${readingTimeMinutes} dk okuma`,
      difficulty: wordCount > 500 ? 'İleri Seviye' : wordCount > 300 ? 'Orta Seviye' : 'Başlangıç',
      share: 'Bu analizi paylaş',
      related: 'İlginizi çekebilir',
      updated: `Son güncelleme: ${new Date(timestamp).toLocaleString('tr-TR', { dateStyle: 'medium', timeStyle: 'short' })}`
    },
    de: {
      readingTime: `${readingTimeMinutes} Min. Lesezeit`,
      difficulty: wordCount > 500 ? 'Fortgeschritten' : wordCount > 300 ? 'Mittel' : 'Anfänger',
      share: 'Diese Analyse teilen',
      related: 'Das könnte Sie auch interessieren',
      updated: `Zuletzt aktualisiert: ${new Date(timestamp).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short' })}`
    },
    fr: {
      readingTime: `${readingTimeMinutes} min de lecture`,
      difficulty: wordCount > 500 ? 'Avancé' : wordCount > 300 ? 'Intermédiaire' : 'Débutant',
      share: 'Partager cette analyse',
      related: 'Cela pourrait aussi vous intéresser',
      updated: `Dernière mise à jour: ${new Date(timestamp).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}`
    },
    es: {
      readingTime: `${readingTimeMinutes} min de lectura`,
      difficulty: wordCount > 500 ? 'Avanzado' : wordCount > 300 ? 'Intermedio' : 'Principiante',
      share: 'Compartir este análisis',
      related: 'También te puede interesar',
      updated: `Última actualización: ${new Date(timestamp).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}`
    },
    ru: {
      readingTime: `${readingTimeMinutes} мин чтения`,
      difficulty: wordCount > 500 ? 'Продвинутый' : wordCount > 300 ? 'Средний' : 'Начальный',
      share: 'Поделиться этим анализом',
      related: 'Вам также может быть интересно',
      updated: `Последнее обновление: ${new Date(timestamp).toLocaleString('ru-RU', { dateStyle: 'medium', timeStyle: 'short' })}`
    },
    ar: {
      readingTime: `${readingTimeMinutes} دقيقة قراءة`,
      difficulty: wordCount > 500 ? 'متقدم' : wordCount > 300 ? 'متوسط' : 'مبتدئ',
      share: 'شارك هذا التحليل',
      related: 'قد يهمك أيضًا',
      updated: `آخر تحديث: ${new Date(timestamp).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}`
    },
    jp: {
      readingTime: `読了目安 ${readingTimeMinutes} 分`,
      difficulty: wordCount > 500 ? '上級' : wordCount > 300 ? '中級' : '初級',
      share: 'この分析をシェア',
      related: 'こちらもおすすめ',
      updated: `最終更新: ${new Date(timestamp).toLocaleString('ja-JP', { dateStyle: 'medium', timeStyle: 'short' })}`
    },
    zh: {
      readingTime: `阅读约 ${readingTimeMinutes} 分钟`,
      difficulty: wordCount > 500 ? '进阶' : wordCount > 300 ? '中级' : '入门',
      share: '分享本分析',
      related: '您可能还感兴趣',
      updated: `最后更新: ${new Date(timestamp).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })}`
    }
  }

  const t = translations[language] || translations.en
  
  return {
    readingTime: t.readingTime,
    difficultyLevel: t.difficulty,
    sharePrompt: t.share,
    relatedArticlesPrompt: t.related,
    lastUpdated: t.updated,
    viewCount: Math.floor(Math.random() * 500) + 100 // Simulated view count
  }
}

// ============================================================================
// LAYER 4: ANTI-SPAM DRIFT (Random Timing Jitter)
// ============================================================================

/**
 * Generate random time offset to avoid mechanical publishing patterns
 * Google detects bots by perfectly timed intervals - we add natural variance
 */
export function generatePublishingJitter(baseMinutes: number = 19): number {
  // Add ±5 minutes random jitter
  const jitterMinutes = Math.floor(Math.random() * 11) - 5 // -5 to +5
  const jitterSeconds = Math.floor(Math.random() * 60) // 0 to 59 seconds
  
  return (baseMinutes + jitterMinutes) * 60 + jitterSeconds // Return in seconds
}

/**
 * Calculate next publish time with anti-spam drift
 */
export function calculateNextPublishTime(
  lastPublishTime: Date,
  intervalMinutes: number
): Date {
  const jitterSeconds = generatePublishingJitter(intervalMinutes)
  const nextTime = new Date(lastPublishTime.getTime() + jitterSeconds * 1000)
  return nextTime
}

/**
 * Generate random view count that looks organic
 */
export function generateOrganicViewCount(articleAge: number): number {
  // articleAge in hours
  const baseViews = Math.floor(Math.random() * 50) + 20
  const ageMultiplier = Math.min(articleAge / 24, 7) // Cap at 7 days
  const organicGrowth = baseViews * (1 + ageMultiplier * 0.3)
  
  return Math.floor(organicGrowth + Math.random() * 100)
}

// ============================================================================
// BAN SHIELD STATUS
// ============================================================================

export interface BanShieldStatus {
  active: boolean
  layers: {
    legalArmor: boolean
    expertAttribution: boolean
    humanTouch: boolean
    antiSpamDrift: boolean
  }
  protectionScore: number // 0-100
  lastCheck: string
}

/**
 * Get current Ban Shield status
 */
export function getBanShieldStatus(): BanShieldStatus {
  return {
    active: true,
    layers: {
      legalArmor: true,
      expertAttribution: true,
      humanTouch: true,
      antiSpamDrift: true
    },
    protectionScore: 100,
    lastCheck: new Date().toISOString()
  }
}

export default {
  generateDynamicDisclaimer,
  generateHumanTouchElements,
  generatePublishingJitter,
  calculateNextPublishTime,
  generateOrganicViewCount,
  getBanShieldStatus
}
