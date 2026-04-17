/**
 * SIA LEGAL & SEO ENFORCER - V60 ULTIMATE
 * Google E-E-A-T ve NewsArticle Standartlarına Tam Uyum Sağlar.
 */

export const LEGAL_CONFIG = {
  header: "[STATISTICAL_PROBABILITY_ANALYSIS // OSINT_VERIFIED]",
  footer: {
    tr: "YATIRIM TAVSİYESİ DEĞİLDİR // SPK Mevzuatı 6362 Sayılı Kanun Uyarınca: Bu analiz tamamen açık kaynaklı verilerin istatistiksel modellemesidir.",
    en: "NOT FINANCIAL ADVICE // SEC Compliance: This report represents statistical probability analysis and not an investment recommendation.",
    de: "KEINE ANLAGEBERATUNG // MiFID II & BaFin Konformität.",
    fr: "PAS DE CONSEIL FINANCIER // Conformité AMF & MiFID II.",
    es: "NO ES CONSEJO FINANCIERO // Cumplimiento de CNMV & MiFID II.",
    ru: "НЕ ЯВЛЯЕТСЯ ФИНАНСОВОЙ РЕКОМЕНДАЦИЕЙ // Соответствие стандартам ЦБ РФ.",
    ar: "ليست نصيحة مالية // متوافق مع معايير هيئة الأسواق المالية: هذا التقرير يمثل تحليلاً احتمالياً إحصائياً.",
    jp: "投資助言ではありません // 本レポートは統計的確率分析であり、投資推奨ではありません。SEC準拠。",
    zh: "非投资建议 // 本报告为统计概率分析，不构成投资建议。符合相关监管要求。"
  }
};

/**
 * Aggressively remove STRATEGIC OUTLOOK sections and related lines from any content.
 */
function sanitizeContent(content: string): string {
  if (!content) return '';

  return content
    // Remove STRATEGIC OUTLOOK blocks (bold header + content)
    .replace(/\*\*\s*STRATEGIC\s+OUTLOOK\s*\*\*[\s\S]*?(?=\n\s*\n|\Z)/gim, '')
    .replace(/\*\*\s*STRATEJİK\s+GÖRÜNÜM\s*\*\*[\s\S]*?(?=\n\s*\n|\Z)/gim, '')
    .replace(/^\s*(STRATEGIC\s+OUTLOOK|STRATEJİK\s+GÖRÜNÜM)\s*[:：]?\s*[\s\S]*?(?=\n\s*\n|\Z)/gim, '')

    // Remove common outlook lines even when not grouped as a section
    .replace(/^\s*(Short-term|Long-term|Mid-term|Near-term)\s*:\s*.*$/gim, '')
    .replace(/^\s*(Kısa\s*vade|Orta\s*vade|Uzun\s*vade)\s*:\s*.*$/gim, '')
    .replace(/^\s*(Confidence\s*score|Confidence|Validation)\s*:?\s*\d+%?.*$/gim, '')

    // Remove 5n1k/5N1K related keywords and phrases
    .replace(/\b5n1k\b/gi, '')
    .replace(/\b5N1K\b/g, '')
    .replace(/5n1k\s*[:：]\s*.*$/gim, '')
    .replace(/5N1K\s*[:：]\s*.*$/gim, '')
    .replace(/5n1k\s*kelimeleri?/gi, '')
    .replace(/5N1K\s*kelimeleri?/g, '')

    // Clean up extra whitespace
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

/**
 * GOOGLE NEWS STRUCTURED DATA (JSON-LD)
 * Google botlarını haberi 'Otorite' olarak tanımasını sağlar.
 */
export function generateNewsSchema(article: any) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": article.title,
    "image": [article.imageUrl],
    "datePublished": article.date || new Date().toISOString(),
    "dateModified": new Date().toISOString(),
    "author": [{
      "@type": "Organization",
      "name": "SIAINTEL",
      "url": "https://siaintel.com"
    }],
    "publisher": {
      "@type": "Organization",
      "name": "SIAINTEL",
      "logo": {
        "@type": "ImageObject",
        "url": "https://siaintel.com/logo.png"
      }
    }
  };
}

export function applyLegalShield(content: string, lang: string): string {
  const language = (lang || 'en').toLowerCase();
  const footerText = LEGAL_CONFIG.footer[language as keyof typeof LEGAL_CONFIG.footer] || LEGAL_CONFIG.footer.en;
  const sanitizedContent = sanitizeContent(content);

  return `
${LEGAL_CONFIG.header}

${sanitizedContent}

--------------------------------------------------
[OFFICIAL_DISCLAIMER]
${footerText}
• Global Node: SIA_V14_TERMINAL
`.trim();
}
