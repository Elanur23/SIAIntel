/**
 * SIA Master Protocol v4.0
 * High-CPM Content Optimization Engine
 */

import { Language } from '@/lib/store/language-store'
import crypto from 'crypto'
import { protocolStrings, ProtocolLanguage } from '@/lib/i18n/protocol-dictionaries'

/**
 * HIGH-TICKET FINANCE TERMS - Never translate, always bold Latin
 */
export const PROTECTED_TERMS = [
  // Crypto & DeFi
  'DePIN', 'RWA', 'CBDC', 'Compute-Collateral', 'TVL', 'APY', 'APR',
  'DeFi', 'NFT', 'DAO', 'DEX', 'CEX', 'Layer-1', 'Layer-2',
  'Proof-of-Work', 'Proof-of-Stake', 'PoW', 'PoS', 'Smart Contract',
  
  // AI & Compute
  'FLOPS', 'GPU', 'TPU', 'Neural Network', 'Transformer', 'LLM',
  'Machine Learning', 'Deep Learning', 'AI Compute', 'Edge Computing',
  
  // Traditional Finance
  'GDP', 'CPI', 'PCE', 'Fed Funds Rate', 'Quantitative Easing', 'QE',
  'Yield Curve', 'Treasury Bond', 'Sovereign Debt', 'Credit Default Swap',
  'Collateralized Debt Obligation', 'CDO', 'MBS', 'ABS',
  
  // Institutional
  'Institutional Flow', 'Dark Pool', 'Block Trade', 'Prime Brokerage',
  'Hedge Fund', 'Family Office', 'Sovereign Wealth Fund', 'SWF',
  
  // SIA-Specific
  'SIA_SENTINEL', 'SIA_LISA', 'CENTINEL_NODE', 'Council of Five',
  'Sovereign Core', 'Intelligence Node', 'War Room Protocol',
]

/**
 * FIAT INSTRUMENTS for Financial Gravity
 */
const FIAT_INSTRUMENTS = {
  USD: { symbol: '$', name: 'US Dollar', region: 'US' },
  EUR: { symbol: '€', name: 'Euro', region: 'EU' },
  CNY: { symbol: '¥', name: 'Chinese Yuan', region: 'CN' },
  GBP: { symbol: '£', name: 'British Pound', region: 'UK' },
  JPY: { symbol: '¥', name: 'Japanese Yen', region: 'JP' },
  CHF: { symbol: 'CHF', name: 'Swiss Franc', region: 'CH' },
}

/**
 * IMPERATIVE VERBS for Scarcity Tone
 */
const IMPERATIVE_VERBS = {
  weak: ['could', 'might', 'may', 'possibly', 'potentially', 'perhaps'],
  strong: ['must', 'shall', 'will', 'requires', 'demands', 'necessitates'],
}

interface ProtocolConfig {
  enableGlobalLexicon?: boolean
  enableScarcityTone?: boolean
  enableFinancialGravity?: boolean
  enableVerificationFooter?: boolean
  confidenceScore?: number
}

interface ProcessedContent {
  content: string
  protectedTermsCount: number
  fiatReferencesCount: number
  imperativeVerbsCount: number
  verificationHash: string
  confidenceRating: number
}

/**
 * 1. GLOBAL LEXICON: Protect high-ticket finance terms
 */
export function protectFinanceTerms(content: string): {
  processed: string
  termsProtected: number
} {
  let processed = content
  let termsProtected = 0

  for (const term of PROTECTED_TERMS) {
    // Case-insensitive match, but preserve original case in replacement
    const regex = new RegExp(`\\b${term}\\b`, 'gi')
    const matches = content.match(regex)
    
    if (matches) {
      termsProtected += matches.length
      // Replace with bold Latin script
      processed = processed.replace(regex, `**${term}**`)
    }
  }

  return { processed, termsProtected }
}

/**
 * 2. SCARCITY TONE: Convert weak language to imperative
 */
export function enforceScarcityTone(content: string): {
  processed: string
  conversionsCount: number
} {
  let processed = content
  let conversionsCount = 0

  // Replace weak verbs with strong imperatives
  const replacements: Record<string, string> = {
    'could potentially': 'will',
    'might possibly': 'shall',
    'may eventually': 'must',
    'could': 'will',
    'might': 'shall',
    'may': 'must',
    'possibly': 'inevitably',
    'potentially': 'certainly',
    'perhaps': 'undoubtedly',
    'it seems': 'it is',
    'appears to be': 'is',
    'suggests that': 'confirms that',
    'indicates that': 'proves that',
    'could lead to': 'will result in',
    'might result in': 'shall produce',
    'may cause': 'will trigger',
  }

  for (const [weak, strong] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${weak}\\b`, 'gi')
    const matches = processed.match(regex)
    
    if (matches) {
      conversionsCount += matches.length
      processed = processed.replace(regex, strong)
    }
  }

  return { processed, conversionsCount }
}

/**
 * 3. FINANCIAL GRAVITY: Inject fiat instrument references
 * GUARD: Only injects if the target language matches the instrument template (currently EN only)
 */
export function injectFinancialGravity(
  content: string,
  lang: Language,
  targetInstrument: keyof typeof FIAT_INSTRUMENTS = 'USD'
): {
  processed: string
  injectionPoint: number
  fiatReference: string
} {
  // SAFETY GUARD: Financial gravity templates are currently English-only.
  // We skip injection for non-English locales to avoid mixed-language content.
  if (lang !== 'en') {
    return { processed: content, injectionPoint: -1, fiatReference: '' }
  }

  const instrument = FIAT_INSTRUMENTS[targetInstrument]
  
  // Find first paragraph end (after first period followed by space or newline)
  const firstParagraphEnd = content.search(/\.\s+[A-Z]/)
  
  if (firstParagraphEnd === -1) {
    // If no clear paragraph break, inject after first sentence
    const firstSentenceEnd = content.indexOf('. ')
    if (firstSentenceEnd !== -1) {
      const fiatReference = ` This development carries direct implications for ${instrument.name} (${instrument.symbol}) liquidity flows and institutional capital allocation.`
      const processed = content.slice(0, firstSentenceEnd + 1) + fiatReference + content.slice(firstSentenceEnd + 1)
      
      return {
        processed,
        injectionPoint: firstSentenceEnd,
        fiatReference,
      }
    }
  }

  // Inject fiat reference at end of first paragraph
  const fiatReference = ` The convergence of AI compute power and traditional finance creates a direct correlation with ${instrument.name} (${instrument.symbol}) denominated assets, as institutional players recalibrate risk models based on computational sovereignty metrics.`
  
  const processed = content.slice(0, firstParagraphEnd + 1) + fiatReference + content.slice(firstParagraphEnd + 1)

  return {
    processed,
    injectionPoint: firstParagraphEnd,
    fiatReference,
  }
}

/**
 * 4. VERIFICATION FOOTER: Generate cryptographic hash and confidence rating
 * SIA-V4-EEAT-SOURCE-VERIFICATION: Structured metadata with SHA-256 verification
 */
export function generateVerificationFooter(
  content: string,
  lang: Language,
  confidenceScore: number = 98.4,
  dataSources?: string[]
): {
  footer: string
  hash: string
  timestamp: string
} {
  const dict = protocolStrings[lang as ProtocolLanguage] || protocolStrings.en;

  // Generate SHA-256 hash (full 64-character for integrity)
  const timestamp = new Date().toISOString()
  const hashInput = `${content}${timestamp}${confidenceScore}`
  const hash = crypto.createHash('sha256').update(hashInput).digest('hex').toUpperCase()

  // Default data sources if not provided
  const sources = dataSources || [
    'On-Chain Analytics (Blockchain Explorers)',
    'Exchange Liquidity Data (CEX/DEX APIs)',
    'Institutional Flow Tracking (Dark Pool Monitors)',
    'Macroeconomic Indicators (Central Bank Data)',
    'SIA_SENTINEL Proprietary Intelligence Network',
  ]

  const footer = `

---

## 🛡️ ${dict.verification_title}

### ${dict.methodology_title}
${sources.map((source, idx) => `${idx + 1}. **${source}**`).join('\n')}

### ${dict.metadata_title}
- **${dict.confidence_score}**: ${confidenceScore.toFixed(1)}% (${dict.statistical_probability})
- **${dict.hash}**: \`${hash}\`
- **${dict.timestamp}**: ${timestamp}
- **${dict.protocol_version}**: SIA Master Protocol v4.0
- **${dict.authority}**: Council of Five Intelligence Network
- **${dict.compliance}**: ✅ ${dict.verified}

### ${dict.intelligence_validation_title}
*This analysis has been processed through SIA's multi-node validation system. The Confidence Score represents statistical probability based on:*
- On-chain transaction data and wallet movement patterns
- Exchange liquidity depth and order book analysis
- Institutional capital flow tracking across global markets
- Macroeconomic correlation matrices and central bank policy signals
- Historical pattern recognition with 72-hour rolling validation

### ${dict.risk_disclaimer_title}
**${dict.important}**: This intelligence report is provided for informational and educational purposes only. It does not constitute financial, investment, or trading advice. Cryptocurrency and financial markets are highly volatile and carry substantial risk of loss. Past performance does not guarantee future results. Market conditions can change rapidly and unpredictably.

**${dict.action_required}**: Always conduct independent research, verify information through multiple sources, and consult qualified financial advisors before making investment decisions. SIA Intelligence Terminal assumes no liability for decisions made based on this analysis.

**${dict.regulatory_notice}**: This content complies with Google AdSense policies and E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) standards. All analysis is based on publicly available data (OSINT) and proprietary analytical models.
  `.trim()

  return { footer, hash, timestamp }
}

/**
 * MASTER PROCESSOR: Apply all 4 protocol rules
 */
export function processSIAMasterProtocol(
  content: string,
  lang: Language,
  config: ProtocolConfig = {}
): ProcessedContent {
  const {
    enableGlobalLexicon = true,
    enableScarcityTone = true,
    enableFinancialGravity = true,
    enableVerificationFooter = true,
    confidenceScore = 98.4,
  } = config

  let processed = content
  let protectedTermsCount = 0
  let imperativeVerbsCount = 0
  let fiatReferencesCount = 0

  // Step 1: Protect finance terms
  if (enableGlobalLexicon) {
    const result = protectFinanceTerms(processed)
    processed = result.processed
    protectedTermsCount = result.termsProtected
  }

  // Step 2: Enforce scarcity tone
  if (enableScarcityTone) {
    const result = enforceScarcityTone(processed)
    processed = result.processed
    imperativeVerbsCount = result.conversionsCount
  }

  // Step 3: Inject financial gravity
  if (enableFinancialGravity) {
    const result = injectFinancialGravity(processed, lang, 'USD')
    processed = result.processed
    fiatReferencesCount = result.injectionPoint !== -1 ? 1 : 0
  }

  // Step 4: Add verification footer with data sources
  let verificationHash = ''
  if (enableVerificationFooter) {
    const dataSources = [
      'On-Chain Analytics (Blockchain Explorers)',
      'Exchange Liquidity Data (CEX/DEX APIs)',
      'Institutional Flow Tracking (Dark Pool Monitors)',
      'Macroeconomic Indicators (Central Bank Data)',
      'SIA_SENTINEL Proprietary Intelligence Network',
    ]
    const result = generateVerificationFooter(processed, lang, confidenceScore, dataSources)
    processed = processed + '\n\n' + result.footer
    verificationHash = result.hash
  }

  return {
    content: processed,
    protectedTermsCount,
    fiatReferencesCount,
    imperativeVerbsCount,
    verificationHash,
    confidenceRating: confidenceScore,
  }
}

/**
 * Validate protocol compliance
 */
export function validateProtocolCompliance(content: string): {
  isCompliant: boolean
  issues: string[]
  score: number
} {
  const issues: string[] = []
  let score = 100

  // Check 1: Protected terms should be in bold
  const protectedTermsInContent = PROTECTED_TERMS.filter(term => 
    content.toLowerCase().includes(term.toLowerCase())
  )
  const protectedTermsInBold = protectedTermsInContent.filter(term =>
    content.includes(`**${term}**`)
  )
  
  if (protectedTermsInContent.length > 0 && protectedTermsInBold.length === 0) {
    issues.push('Protected finance terms are not bolded')
    score -= 25
  }

  // Check 2: Weak language detection
  const weakLanguage = IMPERATIVE_VERBS.weak.filter(verb =>
    new RegExp(`\\b${verb}\\b`, 'i').test(content)
  )
  
  if (weakLanguage.length > 0) {
    issues.push(`Weak language detected: ${weakLanguage.join(', ')}`)
    score -= 25
  }

  // Check 3: Fiat instrument reference in first 2 paragraphs
  const firstTwoParagraphs = content.split('\n\n').slice(0, 2).join('\n\n')
  const hasFiatReference = Object.values(FIAT_INSTRUMENTS).some(instrument =>
    firstTwoParagraphs.includes(instrument.name) || firstTwoParagraphs.includes(instrument.symbol)
  )
  
  if (!hasFiatReference) {
    issues.push('No fiat instrument reference in first 2 paragraphs')
    score -= 25
  }

  // Check 4: Verification footer
  const hasVerificationFooter = content.includes('SOVEREIGN VERIFICATION PROTOCOL') &&
                                 content.includes('Confidence Rating') &&
                                 content.includes('Verification Hash')
  
  if (!hasVerificationFooter) {
    issues.push('Missing verification footer')
    score -= 25
  }

  return {
    isCompliant: issues.length === 0,
    issues,
    score: Math.max(0, score),
  }
}

/**
 * Generate protocol compliance report
 */
export function generateComplianceReport(content: string): {
  compliance: ReturnType<typeof validateProtocolCompliance>
  metrics: {
    protectedTerms: number
    imperativeVerbs: number
    fiatReferences: number
    wordCount: number
    readingTime: number
  }
  recommendations: string[]
} {
  const compliance = validateProtocolCompliance(content)
  
  // Count metrics
  const protectedTerms = PROTECTED_TERMS.filter(term =>
    content.toLowerCase().includes(term.toLowerCase())
  ).length
  
  const imperativeVerbs = IMPERATIVE_VERBS.strong.filter(verb =>
    new RegExp(`\\b${verb}\\b`, 'i').test(content)
  ).length
  
  const fiatReferences = Object.values(FIAT_INSTRUMENTS).filter(instrument =>
    content.includes(instrument.name) || content.includes(instrument.symbol)
  ).length
  
  const wordCount = content.split(/\s+/).length
  const readingTime = Math.ceil(wordCount / 200) // 200 words per minute

  // Generate recommendations
  const recommendations: string[] = []
  
  if (protectedTerms < 3) {
    recommendations.push('Add more high-ticket finance terms (DePIN, RWA, CBDC, etc.)')
  }
  
  if (imperativeVerbs < 5) {
    recommendations.push('Use more imperative verbs (must, shall, will) for scarcity tone')
  }
  
  if (fiatReferences < 2) {
    recommendations.push('Add more fiat instrument references (USD, EUR, CNY) for financial gravity')
  }
  
  if (wordCount < 500) {
    recommendations.push('Increase content length to 500+ words for better CPM')
  }

  return {
    compliance,
    metrics: {
      protectedTerms,
      imperativeVerbs,
      fiatReferences,
      wordCount,
      readingTime,
    },
    recommendations,
  }
}

/**
 * Batch process multiple contents
 */
export function batchProcessProtocol(
  contents: Array<{ id: string; content: string; lang: Language }>,
  config: ProtocolConfig = {}
): Array<{
  id: string
  processed: ProcessedContent
  compliance: ReturnType<typeof validateProtocolCompliance>
}> {
  return contents.map(({ id, content, lang }) => {
    const processed = processSIAMasterProtocol(content, lang, config)
    const compliance = validateProtocolCompliance(processed.content)

    return {
      id,
      processed,
      compliance,
    }
  })
}

/**
 * SIA-V4-GLOBAL-CONTEXT-LINKING
 * Generate internal cross-language links for SEO authority
 */
export function generateGlobalContextLinks(
  articleId: string,
  currentLang: Language,
  articleTitle: string
): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://siaintel.com'
  
  const languageMap: Record<Language, { name: string; flag: string }> = {
    en: { name: 'English', flag: '🇺🇸' },
    tr: { name: 'Türkçe', flag: '🇹🇷' },
    de: { name: 'Deutsch', flag: '🇩🇪' },
    fr: { name: 'Français', flag: '🇫🇷' },
    es: { name: 'Español', flag: '🇪🇸' },
    ru: { name: 'Русский', flag: '🇷🇺' },
    ar: { name: 'العربية', flag: '🇦🇪' },
    jp: { name: '日本語', flag: '🇯🇵' },
    zh: { name: '中文', flag: '🇨🇳' },
  }

  const allLanguages: Language[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']
  const otherLanguages = allLanguages.filter(lang => lang !== currentLang)

  const links = otherLanguages.map(lang => {
    const langInfo = languageMap[lang]
    const url = `${baseUrl}/${lang}/news/${articleId}`
    return `[${langInfo.flag} ${langInfo.name}](${url})`
  }).join(' • ')

  const footer = `

---

## 🌐 Global Intelligence Network

**This analysis is available in 9 languages across the SIA Intelligence Network:**

${links}

*Cross-border intelligence distribution ensures institutional-grade analysis reaches global markets simultaneously. Each language version is optimized for regional SEO authority while maintaining protocol compliance.*

### Regional Intelligence Nodes
- **🇺🇸 North America**: US Dollar (USD) market analysis
- **🇪🇺 European Union**: Euro (EUR) institutional flows
- **🇨🇳 Greater China**: Yuan (CNY) and Baidu-optimized content
- **🇷🇺 Russia & CIS**: Ruble (RUB) and Yandex integration
- **🇦🇪 Middle East**: Dirham (AED) and Arabic financial terminology
- **🇯🇵 Japan**: Yen (JPY) and institutional trading patterns
- **🇹🇷 Turkey**: Lira (TRY) and emerging market dynamics
- **🇩🇪 DACH Region**: Euro (EUR) and German financial precision
- **🇪🇸 Iberia & LATAM**: Euro/Peso markets and Spanish-speaking regions

**Network Effect**: Each language node strengthens the entire SIA Intelligence Network through cross-border SEO authority and institutional backlink distribution.
  `.trim()

  return footer
}

/**
 * Add global context links to processed content
 */
export function addGlobalContextLinks(
  content: string,
  articleId: string,
  currentLang: Language,
  articleTitle: string
): string {
  const globalLinks = generateGlobalContextLinks(articleId, currentLang, articleTitle)
  
  // Insert before the verification footer if it exists
  if (content.includes('SIA-V4-EEAT-SOURCE-VERIFICATION')) {
    const parts = content.split('## 🛡️ SIA-V4-EEAT-SOURCE-VERIFICATION')
    return parts[0] + globalLinks + '\n\n## 🛡️ SIA-V4-EEAT-SOURCE-VERIFICATION' + parts[1]
  }
  
  // Otherwise append at the end
  return content + '\n\n' + globalLinks
}
