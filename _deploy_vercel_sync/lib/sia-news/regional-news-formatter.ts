/**
 * Regional News Formatter for SIA_NEWS_v1.0
 * 
 * Formats generated articles into the regional news output structure
 * with language-specific variants and regional economic psychology adaptation.
 * 
 * This module bridges the content generation layer with the final output format
 * used by the frontend and API consumers.
 * 
 * Features:
 * - Language-specific formatters (Turkish, German, Arabic)
 * - RTL (right-to-left) formatting for Arabic
 * - Regional number, date, and time formatting
 * - Cultural reference validation
 * - Regulatory context awareness
 */

import type {
  GeneratedArticle,
  RegionalNewsOutput,
  RegionalNewsVariant,
  Language,
  Region
} from './types'

// ============================================================================
// LANGUAGE-SPECIFIC FORMATTERS
// ============================================================================

/**
 * Language-specific formatting configuration
 */
export interface LanguageFormatter {
  language: Language
  direction: 'ltr' | 'rtl'
  formalityLevel: 'formal' | 'informal'
  numberFormat: Intl.NumberFormatOptions
  dateFormat: Intl.DateTimeFormatOptions
  currencyFormat: Intl.NumberFormatOptions
}

/**
 * Language formatter configurations for all supported languages
 */
export const LANGUAGE_FORMATTERS: Record<Language, LanguageFormatter> = {
  tr: {
    language: 'tr',
    direction: 'ltr',
    formalityLevel: 'formal', // Use "siz" form, not "sen"
    numberFormat: {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    currencyFormat: {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  en: {
    language: 'en',
    direction: 'ltr',
    formalityLevel: 'formal',
    numberFormat: {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    },
    currencyFormat: {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  de: {
    language: 'de',
    direction: 'ltr',
    formalityLevel: 'formal', // Use "Sie" form, not "du"
    numberFormat: {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    currencyFormat: {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  ar: {
    language: 'ar',
    direction: 'rtl', // Right-to-left
    formalityLevel: 'formal', // Modern Standard Arabic
    numberFormat: {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      numberingSystem: 'arab' // Use Arabic-Indic numerals
    },
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      calendar: 'gregory' // Use Gregorian calendar
    },
    currencyFormat: {
      style: 'currency',
      currency: 'AED',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  fr: {
    language: 'fr',
    direction: 'ltr',
    formalityLevel: 'formal',
    numberFormat: {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    currencyFormat: {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  es: {
    language: 'es',
    direction: 'ltr',
    formalityLevel: 'formal',
    numberFormat: {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    currencyFormat: {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  ru: {
    language: 'ru',
    direction: 'ltr',
    formalityLevel: 'formal',
    numberFormat: {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    currencyFormat: {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  },
  jp: {
    language: 'jp',
    direction: 'ltr',
    formalityLevel: 'formal',
    numberFormat: {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    currencyFormat: {
      style: 'currency',
      currency: 'JPY',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }
  },
  zh: {
    language: 'zh',
    direction: 'ltr',
    formalityLevel: 'formal',
    numberFormat: {
      useGrouping: true,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    },
    dateFormat: {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    },
    currencyFormat: {
      style: 'currency',
      currency: 'CNY',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }
  }
}

/**
 * Formats a number according to language-specific conventions
 * 
 * Examples:
 * - EN: 1,234.56
 * - DE: 1.234,56
 * - TR: 1.234,56
 * - AR: ١٬٢٣٤٫٥٦ (Arabic-Indic numerals)
 * 
 * @param value - Number to format
 * @param language - Target language
 * @returns Formatted number string
 */
export function formatNumber(value: number, language: Language): string {
  const formatter = LANGUAGE_FORMATTERS[language]
  const locale = getLocaleCode(language)
  
  return new Intl.NumberFormat(locale, formatter.numberFormat).format(value)
}

/**
 * Formats a date according to language-specific conventions
 * 
 * Examples:
 * - EN: 03/01/2026, 10:30 AM
 * - DE: 01.03.2026, 10:30
 * - TR: 01.03.2026, 10:30
 * - AR: ٠١/٠٣/٢٠٢٦، ١٠:٣٠
 * 
 * @param date - Date to format
 * @param language - Target language
 * @returns Formatted date string
 */
export function formatDate(date: Date, language: Language): string {
  const formatter = LANGUAGE_FORMATTERS[language]
  const locale = getLocaleCode(language)
  
  return new Intl.DateTimeFormat(locale, formatter.dateFormat).format(date)
}

/**
 * Formats a currency value according to language-specific conventions
 * 
 * Examples:
 * - EN: $1,234.56
 * - DE: 1.234,56 €
 * - TR: ₺1.234,56
 * - AR: ١٬٢٣٤٫٥٦ د.إ
 * 
 * @param value - Currency value to format
 * @param language - Target language
 * @returns Formatted currency string
 */
export function formatCurrency(value: number, language: Language): string {
  const formatter = LANGUAGE_FORMATTERS[language]
  const locale = getLocaleCode(language)
  
  return new Intl.NumberFormat(locale, formatter.currencyFormat).format(value)
}

/**
 * Gets the locale code for a language
 * 
 * @param language - Language code
 * @returns Full locale code (e.g., 'en-US', 'de-DE', 'tr-TR', 'ar-AE')
 */
function getLocaleCode(language: Language): string {
  const localeMap: Record<Language, string> = {
    tr: 'tr-TR',
    en: 'en-US',
    de: 'de-DE',
    ar: 'ar-AE',
    fr: 'fr-FR',
    es: 'es-ES',
    ru: 'ru-RU',
    jp: 'ja-JP',
    zh: 'zh-CN'
  }
  
  return localeMap[language]
}

/**
 * Applies language-specific formatting to content
 * 
 * This function:
 * - Formats numbers, dates, and currencies according to regional conventions
 * - Applies RTL formatting for Arabic
 * - Ensures formal business language usage
 * 
 * @param content - Content to format
 * @param language - Target language
 * @returns Formatted content
 */
export function applyLanguageFormatting(content: string, language: Language): string {
  const formatter = LANGUAGE_FORMATTERS[language]
  
  // Apply RTL markers for Arabic
  if (formatter.direction === 'rtl') {
    content = applyRTLFormatting(content)
  }
  
  // Format numbers in content (e.g., "1234.56" → "1,234.56" or "1.234,56")
  content = formatNumbersInContent(content, language)
  
  // Format dates in content
  content = formatDatesInContent(content, language)
  
  return content
}

/**
 * Applies RTL (right-to-left) formatting for Arabic content
 * 
 * Adds Unicode RTL markers and ensures proper text direction
 * 
 * @param content - Content to format
 * @returns RTL-formatted content
 */
function applyRTLFormatting(content: string): string {
  // Add RTL mark at the beginning
  const RTL_MARK = '\u200F' // Right-to-Left Mark
  
  // Wrap content with RTL embedding
  return `${RTL_MARK}${content}`
}

/**
 * Formats numbers within text content according to language conventions
 * 
 * @param content - Content containing numbers
 * @param language - Target language
 * @returns Content with formatted numbers
 */
function formatNumbersInContent(content: string, language: Language): string {
  // Match numbers with optional decimal points (e.g., 1234.56, 1234)
  const numberRegex = /\b\d{1,3}(?:,?\d{3})*(?:\.\d+)?\b/g
  
  return content.replace(numberRegex, (match) => {
    // Parse the number (remove existing formatting)
    const value = parseFloat(match.replace(/,/g, ''))
    
    if (isNaN(value)) {
      return match
    }
    
    // Format according to language
    return formatNumber(value, language)
  })
}

/**
 * Formats dates within text content according to language conventions
 * 
 * @param content - Content containing dates
 * @param language - Target language
 * @returns Content with formatted dates
 */
function formatDatesInContent(content: string, language: Language): string {
  // Match ISO date formats (YYYY-MM-DD)
  const dateRegex = /\b\d{4}-\d{2}-\d{2}\b/g
  
  return content.replace(dateRegex, (match) => {
    const date = new Date(match)
    
    if (isNaN(date.getTime())) {
      return match
    }
    
    // Format according to language
    return formatDate(date, language)
  })
}

/**
 * Turkish formal business language formatter
 * 
 * Ensures content uses formal Turkish (siz form, not sen)
 * and proper financial terminology
 * 
 * @param content - Content to format
 * @returns Formatted Turkish content
 */
export function formatTurkishFormal(content: string): string {
  // Apply Turkish-specific formatting
  content = applyLanguageFormatting(content, 'tr')
  
  // Ensure formal address (this is a placeholder - actual implementation
  // would require NLP to detect and convert informal forms)
  // In practice, the content generator should already use formal language
  
  return content
}

/**
 * German formal business language formatter
 * 
 * Ensures content uses formal German (Sie form, not du)
 * and precise technical terms
 * 
 * @param content - Content to format
 * @returns Formatted German content
 */
export function formatGermanFormal(content: string): string {
  // Apply German-specific formatting
  content = applyLanguageFormatting(content, 'de')
  
  // Ensure formal address (this is a placeholder - actual implementation
  // would require NLP to detect and convert informal forms)
  // In practice, the content generator should already use formal language
  
  return content
}

/**
 * Arabic Modern Standard Arabic formatter with RTL support
 * 
 * Ensures content uses Modern Standard Arabic with proper
 * RTL formatting and Arabic-Indic numerals
 * 
 * @param content - Content to format
 * @returns Formatted Arabic content with RTL
 */
export function formatArabicRTL(content: string): string {
  // Apply Arabic-specific formatting with RTL
  content = applyLanguageFormatting(content, 'ar')
  
  // Convert Western numerals to Arabic-Indic numerals
  content = convertToArabicNumerals(content)
  
  return content
}

/**
 * Converts Western numerals (0-9) to Arabic-Indic numerals (٠-٩)
 * 
 * @param content - Content with Western numerals
 * @returns Content with Arabic-Indic numerals
 */
function convertToArabicNumerals(content: string): string {
  const arabicNumerals: Record<string, string> = {
    '0': '٠',
    '1': '١',
    '2': '٢',
    '3': '٣',
    '4': '٤',
    '5': '٥',
    '6': '٦',
    '7': '٧',
    '8': '٨',
    '9': '٩'
  }
  
  return content.replace(/[0-9]/g, (digit) => arabicNumerals[digit] || digit)
}

// ============================================================================
// CULTURAL REFERENCE VALIDATION
// ============================================================================

/**
 * Regulatory context for each region
 */
export interface RegulatoryContext {
  region: Region
  regulators: string[]
  keyRegulations: string[]
  complianceRequirements: string[]
  culturalSensitivities: string[]
}

/**
 * Regulatory contexts for all supported regions
 */
export const REGULATORY_CONTEXTS: Record<Region, RegulatoryContext> = {
  TR: {
    region: 'TR',
    regulators: ['KVKK (Kişisel Verileri Koruma Kurumu)', 'SPK (Sermaye Piyasası Kurulu)', 'TCMB (Türkiye Cumhuriyet Merkez Bankası)'],
    keyRegulations: ['KVKK Law No. 6698', 'Capital Markets Law', 'Banking Law'],
    complianceRequirements: [
      'KVKK data protection compliance',
      'Financial advice disclaimers',
      'Currency exchange regulations'
    ],
    culturalSensitivities: [
      'Respect for Islamic finance principles',
      'Sensitivity to inflation concerns',
      'Currency devaluation awareness'
    ]
  },
  US: {
    region: 'US',
    regulators: ['SEC (Securities and Exchange Commission)', 'CFTC (Commodity Futures Trading Commission)', 'Federal Reserve'],
    keyRegulations: ['Securities Act of 1933', 'Securities Exchange Act of 1934', 'Investment Advisers Act'],
    complianceRequirements: [
      'SEC investment advice disclaimers',
      'Accredited investor requirements',
      'Anti-money laundering (AML) compliance'
    ],
    culturalSensitivities: [
      'Institutional investor focus',
      'Regulatory compliance emphasis',
      'Professional financial terminology'
    ]
  },
  DE: {
    region: 'DE',
    regulators: ['BaFin (Bundesanstalt für Finanzdienstleistungsaufsicht)', 'ECB (European Central Bank)', 'Deutsche Bundesbank'],
    keyRegulations: ['WpHG (Securities Trading Act)', 'KWG (Banking Act)', 'MiFID II'],
    complianceRequirements: [
      'BaFin licensing requirements',
      'MiFID II investor protection',
      'GDPR data protection'
    ],
    culturalSensitivities: [
      'Precision and accuracy emphasis',
      'Risk-averse investment culture',
      'ECB policy sensitivity'
    ]
  },
  FR: {
    region: 'FR',
    regulators: ['AMF (Autorité des Marchés Financiers)', 'ACPR (Autorité de Contrôle Prudentiel et de Résolution)', 'Banque de France'],
    keyRegulations: ['Code Monétaire et Financier', 'MiFID II', 'RGPD (GDPR)'],
    complianceRequirements: [
      'AMF registration requirements',
      'Investment advice disclaimers',
      'RGPD data protection'
    ],
    culturalSensitivities: [
      'European integration focus',
      'CAC40 market emphasis',
      'French financial terminology'
    ]
  },
  ES: {
    region: 'ES',
    regulators: ['CNMV (Comisión Nacional del Mercado de Valores)', 'Banco de España', 'ECB'],
    keyRegulations: ['Ley del Mercado de Valores', 'MiFID II', 'RGPD'],
    complianceRequirements: [
      'CNMV registration requirements',
      'Investment advice disclaimers',
      'RGPD data protection'
    ],
    culturalSensitivities: [
      'Latin American market connections',
      'Mediterranean economy focus',
      'IBEX35 market emphasis'
    ]
  },
  RU: {
    region: 'RU',
    regulators: ['CBR (Central Bank of Russia)', 'Federal Financial Markets Service'],
    keyRegulations: ['Federal Law on Securities Market', 'Federal Law on Banks and Banking'],
    complianceRequirements: [
      'CBR licensing requirements',
      'Currency control regulations',
      'Cross-border payment restrictions'
    ],
    culturalSensitivities: [
      'Geopolitical risk awareness',
      'Commodity market focus',
      'Sanctions impact consideration'
    ]
  },
  AE: {
    region: 'AE',
    regulators: ['VARA (Virtual Assets Regulatory Authority)', 'DFSA (Dubai Financial Services Authority)', 'Central Bank of UAE'],
    keyRegulations: ['VARA Regulations', 'DFSA Rulebook', 'Federal Decree-Law on AML'],
    complianceRequirements: [
      'VARA virtual asset licensing',
      'Islamic finance compliance',
      'AML/CFT requirements'
    ],
    culturalSensitivities: [
      'Islamic finance principles',
      'No alcohol/pork references',
      'Respect for cultural values',
      'Oil market correlation'
    ]
  },
  JP: {
    region: 'JP',
    regulators: ['FSA (Financial Services Agency)', 'JPX (Japan Exchange Group)', 'Bank of Japan'],
    keyRegulations: ['Financial Instruments and Exchange Act', 'Payment Services Act', 'Virtual Currency Act'],
    complianceRequirements: [
      'FSA registration for financial business',
      'Investment advisory disclaimers',
      'Virtual currency exchange licensing'
    ],
    culturalSensitivities: [
      'Formal business language',
      'Risk disclosure emphasis',
      'Yen and export sector sensitivity'
    ]
  },
  CN: {
    region: 'CN',
    regulators: ['CSRC (China Securities Regulatory Commission)', 'PBOC (People\'s Bank of China)', 'SAFE (State Administration of Foreign Exchange)'],
    keyRegulations: ['Securities Law', 'Banking Law', 'Capital flow regulations'],
    complianceRequirements: [
      'CSRC licensing for securities activities',
      'Cross-border capital flow compliance',
      'Content and data localisation'
    ],
    culturalSensitivities: [
      'Policy and stability narrative',
      'No speculative or political sensitivity',
      'Yuan and property market awareness'
    ]
  }
}

/**
 * Validates cultural references in content for appropriateness
 * 
 * Checks that examples and references are culturally appropriate
 * for the target region (e.g., no pork references in Arabic content)
 * 
 * @param content - Content to validate
 * @param region - Target region
 * @returns Validation result with issues found
 */
export function validateCulturalReferences(
  content: string,
  region: Region
): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  const context = REGULATORY_CONTEXTS[region]
  
  // Check for culturally inappropriate references
  if (region === 'AE' || region === 'TR') {
    // Check for pork references (inappropriate in Islamic contexts)
    const porkReferences = ['pork', 'bacon', 'ham', 'pig', 'swine']
    for (const ref of porkReferences) {
      if (content.toLowerCase().includes(ref)) {
        issues.push(`Inappropriate reference to "${ref}" for Islamic region`)
      }
    }
    
    // Check for alcohol references (sensitive in Islamic contexts)
    const alcoholReferences = ['alcohol', 'wine', 'beer', 'liquor', 'spirits']
    for (const ref of alcoholReferences) {
      if (content.toLowerCase().includes(ref)) {
        issues.push(`Sensitive reference to "${ref}" for Islamic region`)
      }
    }
  }
  
  // Check for gambling references (sensitive in many regions)
  if (region === 'AE' || region === 'TR') {
    const gamblingReferences = ['gambling', 'casino', 'betting', 'lottery']
    for (const ref of gamblingReferences) {
      if (content.toLowerCase().includes(ref)) {
        issues.push(`Inappropriate reference to "${ref}" for region`)
      }
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

/**
 * Adds regulatory context disclaimer to content
 * 
 * Appends appropriate regulatory disclaimers based on the target region
 * 
 * @param content - Content to enhance
 * @param region - Target region
 * @returns Content with regulatory disclaimer
 */
export function addRegulatoryDisclaimer(content: string, region: Region): string {
  const context = REGULATORY_CONTEXTS[region]
  
  const disclaimers: Record<Region, string> = {
    TR: '\n\nUYARI: Bu içerik yatırım tavsiyesi değildir. KVKK ve SPK düzenlemelerine uygun olarak hazırlanmıştır. Yatırım kararlarınızı vermeden önce lisanslı bir finansal danışmana başvurunuz.',
    US: '\n\nDISCLAIMER: This content is not investment advice and is provided for informational purposes only. Not registered with the SEC. Consult a licensed financial advisor before making investment decisions.',
    DE: '\n\nHINWEIS: Dieser Inhalt stellt keine Anlageberatung dar. Nicht von der BaFin zugelassen. Konsultieren Sie einen lizenzierten Finanzberater, bevor Sie Anlageentscheidungen treffen.',
    FR: '\n\nAVERTISSEMENT: Ce contenu ne constitue pas un conseil en investissement. Non enregistré auprès de l\'AMF. Consultez un conseiller financier agréé avant de prendre des décisions d\'investissement.',
    ES: '\n\nADVERTENCIA: Este contenido no constituye asesoramiento de inversión. No registrado con la CNMV. Consulte a un asesor financiero autorizado antes de tomar decisiones de inversión.',
    RU: '\n\nПРЕДУПРЕЖДЕНИЕ: Данный контент не является инвестиционной рекомендацией. Не зарегистрирован ЦБ РФ. Проконсультируйтесь с лицензированным финансовым консультантом перед принятием инвестиционных решений.',
    AE: '\n\nتحذير: هذا المحتوى ليس نصيحة استثمارية. غير مسجل لدى VARA أو DFSA. استشر مستشارًا ماليًا مرخصًا قبل اتخاذ قرارات الاستثمار.',
    JP: '\n\n免責事項: 本コンテンツは投資助言ではありません。FSAに登録されていません。投資判断の前にライセンスを持つ金融アドバイザーにご相談ください。',
    CN: '\n\n免责声明：本内容不构成投资建议，仅供参考。未在证监会注册。投资决策前请咨询持牌金融顾问。'
  }
  
  return content + (disclaimers[region] || '')
}

/**
 * Validates financial terminology accuracy for a language
 * 
 * Checks that financial terms are used correctly and consistently
 * according to regional standards
 * 
 * @param content - Content to validate
 * @param language - Target language
 * @returns Validation result with terminology issues
 */
export function validateFinancialTerminology(
  content: string,
  language: Language
): { isValid: boolean; issues: string[] } {
  const issues: string[] = []
  
  // Define common financial term mappings
  const termMappings: Record<Language, Record<string, string[]>> = {
    tr: {
      'Bitcoin': ['Bitcoin', 'BTC'],
      'Ethereum': ['Ethereum', 'ETH'],
      'Merkez Bankası': ['TCMB', 'Türkiye Cumhuriyet Merkez Bankası'],
      'Borsa': ['Borsa İstanbul', 'BIST']
    },
    en: {
      'Bitcoin': ['Bitcoin', 'BTC'],
      'Ethereum': ['Ethereum', 'ETH'],
      'Federal Reserve': ['Fed', 'Federal Reserve', 'US Central Bank'],
      'Stock Exchange': ['NYSE', 'NASDAQ', 'Stock Exchange']
    },
    de: {
      'Bitcoin': ['Bitcoin', 'BTC'],
      'Ethereum': ['Ethereum', 'ETH'],
      'Europäische Zentralbank': ['EZB', 'ECB', 'Europäische Zentralbank'],
      'Börse': ['DAX', 'Frankfurter Börse', 'Deutsche Börse']
    },
    ar: {
      'بيتكوين': ['بيتكوين', 'BTC'],
      'إيثريوم': ['إيثريوم', 'ETH'],
      'البنك المركزي': ['البنك المركزي الإماراتي', 'المركزي'],
      'البورصة': ['سوق دبي المالي', 'سوق أبوظبي']
    },
    fr: {
      'Bitcoin': ['Bitcoin', 'BTC'],
      'Ethereum': ['Ethereum', 'ETH'],
      'Banque Centrale': ['BCE', 'Banque de France', 'Banque Centrale Européenne'],
      'Bourse': ['CAC40', 'Euronext', 'Bourse de Paris']
    },
    es: {
      'Bitcoin': ['Bitcoin', 'BTC'],
      'Ethereum': ['Ethereum', 'ETH'],
      'Banco Central': ['BCE', 'Banco de España', 'Banco Central Europeo'],
      'Bolsa': ['IBEX35', 'Bolsa de Madrid', 'BME']
    },
    ru: {
      'Биткоин': ['Биткоин', 'BTC'],
      'Эфириум': ['Эфириум', 'ETH'],
      'Центральный Банк': ['ЦБ РФ', 'Центробанк', 'Банк России'],
      'Биржа': ['Московская Биржа', 'ММВБ', 'РТС']
    },
    jp: {
      'Bitcoin': ['Bitcoin', 'BTC', 'ビットコイン'],
      'Ethereum': ['Ethereum', 'ETH', 'イーサリアム'],
      '中央銀行': ['日銀', '日本銀行', 'BoJ'],
      '証券取引所': ['東証', '東京証券取引所', 'JPX']
    },
    zh: {
      'Bitcoin': ['Bitcoin', 'BTC', '比特币'],
      'Ethereum': ['Ethereum', 'ETH', '以太坊'],
      '央行': ['中国人民银行', '央行', 'PBOC'],
      '交易所': ['上交所', '深交所', '港交所']
    }
  }
  
  // Check for consistent terminology usage
  const terms = termMappings[language] || {}
  
  for (const [term, variants] of Object.entries(terms)) {
    // Check if multiple variants are used inconsistently
    const usedVariants = variants.filter(variant => 
      content.includes(variant)
    )
    
    if (usedVariants.length > 1) {
      issues.push(`Inconsistent terminology: Using multiple variants of "${term}": ${usedVariants.join(', ')}`)
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  }
}

// ============================================================================
// REGIONAL NEWS FORMATTING
// ============================================================================

/**
 * Formats multiple generated articles into regional news output
 * 
 * Takes articles generated for different languages/regions and combines them
 * into a single regional news output structure with all language variants.
 * 
 * @param articles - Array of generated articles (one per language)
 * @param newsId - Unique news ID (e.g., "SIA_20260301_ULTRA_001")
 * @param globalSentiment - Overall market sentiment
 * @param dataPoints - Key data points from the analysis
 * @returns Regional news output with all language variants
 */
export function formatRegionalNews(
  articles: GeneratedArticle[],
  newsId: string,
  globalSentiment: RegionalNewsOutput['global_sentiment'],
  dataPoints: string[]
): RegionalNewsOutput {
  // Initialize regions object with all supported languages
  const regions: RegionalNewsOutput['regions'] = {
    tr: { title: '', content: '', insight: '' },
    en: { title: '', content: '', insight: '' },
    ar: { title: '', content: '', insight: '' },
    de: { title: '', content: '', insight: '' },
    fr: { title: '', content: '', insight: '' },
    es: { title: '', content: '', insight: '' },
    ru: { title: '', content: '', insight: '' },
    jp: { title: '', content: '', insight: '' },
    zh: { title: '', content: '', insight: '' }
  }
  
  // Map each article to its language variant
  for (const article of articles) {
    const variant = formatArticleToVariant(article)
    regions[article.language] = variant
  }
  
  return {
    news_id: newsId,
    global_sentiment: globalSentiment,
    data_points: dataPoints,
    regions
  }
}

/**
 * Formats a single generated article into a regional news variant
 * 
 * Extracts the key components (title, content, insight) from a generated article
 * and formats them according to the regional news variant structure with
 * language-specific formatting applied.
 * 
 * @param article - Generated article
 * @returns Regional news variant with language-specific formatting
 */
export function formatArticleToVariant(
  article: GeneratedArticle
): RegionalNewsVariant {
  // Apply language-specific formatting to all content
  const formattedTitle = applyLanguageFormatting(article.headline, article.language)
  const formattedContent = applyLanguageFormatting(article.summary, article.language)
  const formattedInsight = applyLanguageFormatting(article.siaInsight, article.language)
  
  // Apply specific formatters based on language
  let title = formattedTitle
  let content = formattedContent
  let insight = formattedInsight
  
  switch (article.language) {
    case 'tr':
      title = formatTurkishFormal(title)
      content = formatTurkishFormal(content)
      insight = formatTurkishFormal(insight)
      break
    case 'de':
      title = formatGermanFormal(title)
      content = formatGermanFormal(content)
      insight = formatGermanFormal(insight)
      break
    case 'ar':
      title = formatArabicRTL(title)
      content = formatArabicRTL(content)
      insight = formatArabicRTL(insight)
      break
    default:
      // Other languages use standard formatting
      break
  }
  
  // Validate cultural references
  const region = getRegionFromLanguage(article.language)
  const culturalValidation = validateCulturalReferences(content + insight, region)
  
  if (!culturalValidation.isValid) {
    console.warn(`[Cultural Validation] Issues found for ${article.language}:`, culturalValidation.issues)
  }
  
  // Validate financial terminology
  const terminologyValidation = validateFinancialTerminology(content + insight, article.language)
  
  if (!terminologyValidation.isValid) {
    console.warn(`[Terminology Validation] Issues found for ${article.language}:`, terminologyValidation.issues)
  }
  
  // Add regulatory disclaimer
  content = addRegulatoryDisclaimer(content, region)
  
  return {
    title,
    content,
    insight
  }
}

/**
 * Maps language to region for regulatory context
 * 
 * @param language - Language code
 * @returns Region code
 */
function getRegionFromLanguage(language: Language): Region {
  const languageToRegion: Record<Language, Region> = {
    tr: 'TR',
    en: 'US',
    de: 'DE',
    ar: 'AE',
    fr: 'FR',
    es: 'ES',
    ru: 'RU',
    jp: 'JP',
    zh: 'CN'
  }
  
  return languageToRegion[language]
}

/**
 * Generates a unique news ID based on date and sequence
 * 
 * Format: SIA_YYYYMMDD_CATEGORY_SEQUENCE
 * Example: SIA_20260301_ULTRA_001
 * 
 * @param category - News category (ULTRA, FLASH, DEEP, etc.)
 * @param sequence - Sequence number for the day
 * @returns Unique news ID
 */
export function generateNewsId(
  category: 'ULTRA' | 'FLASH' | 'DEEP' | 'MACRO' | 'WHALE' = 'ULTRA',
  sequence: number = 1
): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const seq = String(sequence).padStart(3, '0')
  
  return `SIA_${year}${month}${day}_${category}_${seq}`
}

/**
 * Extracts key data points from articles for the regional news output
 * 
 * Identifies the most important metrics and events mentioned across all articles
 * to create a concise list of data points.
 * 
 * @param articles - Array of generated articles
 * @returns Array of key data points
 */
export function extractDataPoints(articles: GeneratedArticle[]): string[] {
  const dataPoints = new Set<string>()
  
  for (const article of articles) {
    // Extract from causal chains
    for (const chain of article.causalChains) {
      // Add trigger event description
      if (chain.triggerEvent.description) {
        dataPoints.add(chain.triggerEvent.description)
      }
      
      // Add outcome description
      if (chain.finalOutcome.description) {
        dataPoints.add(chain.finalOutcome.description)
      }
    }
    
    // Extract from entities (limit to most relevant)
    article.entities.slice(0, 3).forEach(entity => {
      dataPoints.add(entity.primaryName)
    })
  }
  
  // Return top 5 most relevant data points
  return Array.from(dataPoints).slice(0, 5)
}

/**
 * Determines global sentiment from multiple articles
 * 
 * Aggregates sentiment scores from all language variants to determine
 * the overall market sentiment.
 * 
 * @param articles - Array of generated articles
 * @returns Global sentiment classification
 */
export function determineGlobalSentiment(
  articles: GeneratedArticle[]
): RegionalNewsOutput['global_sentiment'] {
  if (articles.length === 0) {
    return 'Neutral'
  }
  
  // Calculate average sentiment score
  const avgSentiment = articles.reduce((sum, article) => 
    sum + article.sentiment.overall, 0
  ) / articles.length
  
  // Classify sentiment based on score (-100 to +100)
  if (avgSentiment <= -60) return 'Extreme Fear'
  if (avgSentiment <= -20) return 'Fear'
  if (avgSentiment < -5) return 'Neutral-Bearish'
  if (avgSentiment <= 5) return 'Neutral'
  if (avgSentiment <= 20) return 'Neutral-Bullish'
  if (avgSentiment <= 60) return 'Greed'
  return 'Extreme Greed'
}

// ============================================================================
// VALIDATION AND QUALITY CHECKS
// ============================================================================

/**
 * Validates that a regional news output has all required language variants
 * 
 * @param regionalNews - Regional news output to validate
 * @returns True if all language variants are present and valid
 */
export function validateRegionalNews(regionalNews: RegionalNewsOutput): boolean {
  const requiredLanguages: Language[] = ['tr', 'en', 'ar', 'de', 'fr', 'es', 'ru']
  
  for (const lang of requiredLanguages) {
    const variant = regionalNews.regions[lang]
    
    // Check if variant exists and has all required fields
    if (!variant || !variant.title || !variant.content || !variant.insight) {
      console.error(`[Regional News Validation] Missing or incomplete variant for language: ${lang}`)
      return false
    }
    
    // Check minimum content length (AdSense compliance)
    if (variant.content.length < 100) {
      console.error(`[Regional News Validation] Content too short for language: ${lang}`)
      return false
    }
    
    // Check that insight is unique (not same as content)
    if (variant.insight === variant.content) {
      console.error(`[Regional News Validation] Insight must be different from content for language: ${lang}`)
      return false
    }
  }
  
  return true
}

/**
 * Gets a summary of regional news for logging/monitoring
 * 
 * @param regionalNews - Regional news output
 * @returns Human-readable summary
 */
export function getRegionalNewsSummary(regionalNews: RegionalNewsOutput): string {
  const languageCount = Object.keys(regionalNews.regions).length
  const dataPointsCount = regionalNews.data_points.length
  
  return (
    `News ID: ${regionalNews.news_id} | ` +
    `Sentiment: ${regionalNews.global_sentiment} | ` +
    `Languages: ${languageCount} | ` +
    `Data Points: ${dataPointsCount}`
  )
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

/**
 * Example: Load mock regional news data
 * This demonstrates the expected output format
 */
export async function loadMockRegionalNews(): Promise<RegionalNewsOutput> {
  // In production, this would come from the content generation pipeline
  const mockData: RegionalNewsOutput = {
    news_id: "SIA_20260301_ULTRA_001",
    global_sentiment: "Neutral-Bearish",
    data_points: [
      "BTC Exchange Reserve Lows",
      "FED Reverse Repo Spikes"
    ],
    regions: {
      tr: {
        title: "BTC 100K Sınırında: TRY Bazlı Zirve ve Yerel Likidite Analizi",
        content: "Bitcoin küresel 100k direncini zorlarken, iç piyasada USDT/TRY makasındaki daralma dikkat çekiyor. Kur korumalı sistemden çıkan sermayenin kripto rotası, yerel borsalarda hacim rekoru kırabilir.",
        insight: "Yerel yatırımcı için 100k psikolojik değil, teknik bir kâr alım bölgesi sinyali veriyor."
      },
      en: {
        title: "The 100K Psychological Barrier: A Liquidity Absorption Study",
        content: "As BTC flirts with the six-figure mark, FED's latest repo operations suggest a short-term liquidity squeeze. Institutional 'Diamond Hands' are holding, but retail leverage is at extreme levels.",
        insight: "Look for the gap between spot buying and perpetual funding rates as a volatility indicator."
      },
      ar: {
        title: "بيتكوين عند 100 ألف دولار: تحليل التدفقات النقدية في الخليج",
        content: "مع اقتراب البيتكوين من حاجز الـ 100 ألف دولار، تشير بيانات هيئة تنظيم الأصول الافتراضية (VARA) في دبي إلى زيادة في تدفقات الصناديق المؤسسية. الارتباط بين أسعار النفط والسيولة الرقمية يظهر بوادر انفصال إيجابي.",
        insight: "المستثمر الخليجي ينتقل من المضاربة إلى الحيازة الاستراتيجية قبل تقلبات الربع الثاني."
      },
      de: {
        title: "Bitcoin bei 100.000 USD: BaFin-Perspektive und institutionelle Liquidität",
        content: "Während Bitcoin die psychologische Marke von 100.000 USD testet, zeigen deutsche institutionelle Investoren verstärktes Interesse. Die EZB-Zinspolitik und die Korrelation zu traditionellen Anlageklassen deuten auf eine Neubewertung digitaler Assets hin.",
        insight: "Deutsche Anleger bevorzugen regulierte Custody-Lösungen, was die Nachfrage nach Bitcoin-ETPs erhöht."
      },
      fr: {
        title: "Bitcoin à 100 000 $ : Analyse de la liquidité institutionnelle européenne",
        content: "Alors que le Bitcoin approche les 100 000 dollars, les flux institutionnels européens montrent une accélération. La politique monétaire de la BCE et les nouvelles réglementations MiCA créent un environnement favorable pour les actifs numériques.",
        insight: "Les investisseurs français privilégient l'exposition via des véhicules réglementés AMF plutôt que la détention directe."
      },
      es: {
        title: "Bitcoin en 100.000 USD: Flujos de capital latinoamericano y cobertura inflacionaria",
        content: "Con Bitcoin acercándose a los 100.000 dólares, los inversores latinoamericanos intensifican su uso como cobertura contra la inflación. Los flujos desde Argentina, Brasil y México muestran un patrón de acumulación estratégica.",
        insight: "El inversor latinoamericano ve Bitcoin como protección contra devaluación monetaria más que como especulación."
      },
      ru: {
        title: "Биткоин по $100к: Влияние на трансграничные расчеты РФ",
        content: "Достижение отметки в $100,000 меняет математику трансграничных платежей. На фоне новых санкций, ликвидность в паре BTC/RUB становится ключевым индикатором для импортеров.",
        insight: "Высокая волатильность может временно усложнить расчеты, требуя фиксации курса в стейблкоинах."
      },
      jp: {
        title: "ビットコイン10万ドル目前：日銀政策と機関投資家の動向",
        content: "BTCが10万ドルに接近する中、国内機関の動向が注目される。FSA規制とJPXの動向がデジタル資産評価に影響を与える。",
        insight: "国内投資家は規制対応カストディを重視し、ビットコインETP需要が高まる可能性。"
      },
      zh: {
        title: "比特币逼近10万美元：流动性与监管视角",
        content: "随着比特币逼近10万美元关口，央行政策与A股关联度受关注。跨境资金与合规托管成为关键变量。",
        insight: "境内投资者更关注政策稳定性与合规渠道，而非短期投机。"
      }
    }
  }
  
  return mockData
}
