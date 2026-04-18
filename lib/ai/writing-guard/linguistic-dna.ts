/**
 * SIA MULTILINGUAL WRITING GUARD - v1.0
 * Defines the "Linguistic DNA" for each of the 9 supported locales.
 *
 * Ensures that AI generation sounds like a local professional expert,
 * not a machine translation.
 */

export type SIA_Locale = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'ja' | 'zh';

export interface LinguisticDNA {
  tone: string;
  regionalNuances: string[];
  forbiddenPatterns: string[]; // Patterns that sound like "AI translation"
  preferredTerminology: Record<string, string>;
}

export const LINGUISTIC_DNA_MAP: Record<SIA_Locale, LinguisticDNA> = {
  en: {
    tone: 'Wall Street / London City institutional reporting. Cold, precise, data-heavy.',
    regionalNuances: [
      'Use British spelling (e.g., "capitalise") if target is EU/London, otherwise US.',
      'Use "basis points" instead of "percent points".',
      'Reference "Fed" or "BoE" where appropriate.'
    ],
    forbiddenPatterns: ['As an AI language model', 'I hope this helps', 'Delve into'],
    preferredTerminology: { 'stock market': 'equity markets', 'rising': 'rallying' }
  },
  tr: {
    tone: 'Istanbul Finance Center (IFC) formal business Turkish. Professional and authoritative.',
    regionalNuances: [
      'Use formal "siz" or third-person passive voice.',
      'Prefer "mevduat", "likidite", "volatilite" instead of common Turkish words.',
      'Capitalize specific Turkish financial entities correctly (BIST, TCMB).'
    ],
    forbiddenPatterns: ['Yardımcı olabilirim', 'Çeviri yapıldı', 'Bunu bilmek önemlidir'],
    preferredTerminology: { 'artış': 'yukarı yönlü ivmelenme', 'düşüş': 'negatif ayrışma' }
  },
  de: {
    tone: 'Frankfurt Stock Exchange (DAX) formal style. Teutonic precision, maximum clarity.',
    regionalNuances: [
      'Strict adherence to German grammar and noun-heavy financial reporting.',
      'Direct, zero fluff. Focus on "Grundlagen" and "Kennzahlen".'
    ],
    forbiddenPatterns: ['Ich bin eine KI', 'Gerne geschehen'],
    preferredTerminology: { 'growth': 'Wachstumspfad', 'risk': 'Risikoexposition' }
  },
  fr: {
    tone: 'Paris Bourse (CAC 40) formal reporting. Sophisticated, regulatory-aware (AMF style).',
    regionalNuances: [
      'Elegance in professional phrasing. Use "conjoncture" and "perspectives".',
      'Accurate French pluralization for financial acronyms.'
    ],
    forbiddenPatterns: ['Voici la traduction', 'N’hésitez pas'],
    preferredTerminology: { 'bull market': 'marché haussier', 'bear market': 'marché baissier' }
  },
  es: {
    tone: 'Madrid / Mexico City professional financial Spanish. Formal and expansive.',
    regionalNuances: [
      'Neutral business Spanish (Español Neutro). Avoid slang.',
      'Use "rentabilidad" and "divisas" consistently.'
    ],
    forbiddenPatterns: ['Soy una IA', 'Espero que te guste'],
    preferredTerminology: { 'investment': 'inversión estratégica', 'profit': 'margen de beneficio' }
  },
  ru: {
    tone: 'Moscow / St. Petersburg formal business Russian. Technical and serious.',
    regionalNuances: [
      'Use proper Russian case endings for financial terms.',
      'High density of technical terminology (ЦБ, котировки).'
    ],
    forbiddenPatterns: ['Я ИИ', 'Вот ваш перевод'],
    preferredTerminology: { 'bullish': 'бычий тренд', 'bearish': 'медвежий тренд' }
  },
  ar: {
    tone: 'Dubai / Riyadh Modern Standard Arabic (MSA). Professional with Gulf business awareness.',
    regionalNuances: [
      'Proper RTL alignment and punctuation.',
      'Honorific formal tone suitable for high-net-worth audiences.',
      'Awareness of Islamic finance terminology (Sukuk, Sharia-compliant).'
    ],
    forbiddenPatterns: ['أنا نموذج ذكاء اصطناعي', 'إليك الترجمة'],
    preferredTerminology: { 'interest': 'فائدة / عوائد', 'liquidity': 'سيولة مالية' }
  },
  ja: {
    tone: 'Tokyo Stock Exchange (Kabutocho) professional style. Maximum respect and precision.',
    regionalNuances: [
      'Use Keigo (honorifics) where appropriate for professional reports.',
      'Precise Katakana for foreign financial names (e.g., $NVDA).'
    ],
    forbiddenPatterns: ['私はAIです', '翻訳しました'],
    preferredTerminology: { 'growth': '成長戦略', 'risk': '地政学的リスク' }
  },
  zh: {
    tone: 'Shanghai / Hong Kong professional Simplified Chinese. Concise and authoritative.',
    regionalNuances: [
      'Simplified Chinese (ZH-CN) standard.',
      'Use industry-standard terms for tech and finance (A股, 牛市).'
    ],
    forbiddenPatterns: ['我是一个人工智能', '这是翻译'],
    preferredTerminology: { 'volatility': '波动率', 'impact': '市场影响' }
  }
};
