/**
 * SIA ARTICLE FORMATTER ENGINE v2.5 - NON-DESTRUCTIVE & GRAPHIC-AWARE
 * FIXED: Removes system tags WITHOUT deleting the news content inside.
 * FIXED: Preserves technical data for the TechnicalChart component.
 */

const SIA_STAMPS = {
  tr: ['SIA_STRATEJİK_ANALİZ // DOĞRULANDI', 'NÖRAL_DENETİM // AKTİF', 'PİYASA_SİNYALİ // ONAYLANDI'],
  en: ['SIA_STRATEGIC_ANALYSIS // VERIFIED', 'NEURAL_OVERSIGHT // ACTIVE', 'MARKET_SIGNAL // AUTHENTICATED'],
}

/**
 * Safe Cleaner: Strips tag markers while preserving the valuable intelligence content.
 */
export function cleanSystemArtifacts(content: string): string {
  if (!content) return '';

  return content
    // 1. Remove ONLY the tag strings, leaving the content inside untouched
    .replace(/\[CATCH_BOX\]/gi, '')
    .replace(/\[\/CATCH_BOX\]/gi, '')
    .replace(/\[OFFICIAL_DISCLAIMER\]/gi, '')
    .replace(/\[STATISTICAL_PROBABILITY_ANALYSIS.*?\]/gi, '')
    .replace(/\[تحليل الاحتمالات.*?\]/gi, '')
    .replace(/\[İSTATİSTİKSEL OLASILIK ANALİZİ.*?\]/gi, '')
    .replace(/\[统计概率分析.*?\]/gi, '')
    .replace(/\[.*?\]/gu, '') // Any other remaining brackets

    // 2. Remove ONLY purely technical system lines (Metadata junk)
    .replace(/Validation:?\s*[\d-]*/gi, '')
    .replace(/验证评分:?\s*[\d-]*/gi, '')
    .replace(/•\s*Global Node:.*?$/gim, '')
    .replace(/\[SYSTEM_LOG\]:.*?$/gim, '')
    .replace(/Analysis by:?\s*.*$/gim, '') // Remove redundant author lines inside body

    // 3. Clean up formatting artifacts but keep the text
    .replace(/[-=_*]{5,}/g, '')
    .replace(/\n\s*\n\s*\n/g, '\n\n')
    .trim();
}

function boldFinancialData(text: string): string {
  // Bold Percentages
  text = text.replace(/([-−+]?\d+[.,]?\d*%\s*)/g, '<strong>$1</strong>');
  // Bold Currencies
  text = text.replace(/([$€₺][\d,.]+)/g, '<strong>$1</strong>');
  text = text.replace(/([\d,.]+\s*(?:TL|USD|EUR|dolar|euro|milyon|milyar|trilyon))/gi, '<strong>$1</strong>');
  // Bold Technical Terms
  text = text.replace(/\b(RSI|MACD|EMA|SMA|NASDAQ|BTC|ETH|FED|SEC|TXSE|NYSE|BIST|NVDA)\b/gi, '<strong>$1</strong>');
  return text;
}

export function formatArticleBody(rawContent: string, lang: string = 'en'): string {
  // 1. Clean the markers (Safe version)
  const cleaned = cleanSystemArtifacts(rawContent);

  // 2. Logic Split
  const paragraphs = cleaned.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 5);
  const stamps = SIA_STAMPS[lang as keyof typeof SIA_STAMPS] || SIA_STAMPS.en;

  const htmlParts: string[] = [];
  let stampIndex = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    let para = paragraphs[i];

    // Heading Detection (**Title**)
    if (para.startsWith('**') && para.endsWith('**') && para.length < 120) {
      para = para.replace(/\*\*/g, '');
      if (para.trim()) {
        htmlParts.push(`<h2 class="sia-section-heading">${para}</h2>`);
      }
      continue;
    }

    // Normal paragraph processing
    const formatted = boldFinancialData(para);
    htmlParts.push(`<p>${formatted}</p>`);

    // Subtle brand stamp every 4 paragraphs
    if ((i + 1) % 4 === 0 && i < paragraphs.length - 1) {
      htmlParts.push(`<div class="sia-brand-stamp">${stamps[stampIndex % stamps.length]}</div>`);
      stampIndex++;
    }
  }

  return htmlParts.join('\n');
}
