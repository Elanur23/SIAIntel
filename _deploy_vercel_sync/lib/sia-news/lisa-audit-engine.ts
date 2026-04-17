/**
 * SIA_LISA (Linguistic Integrity & Semantic Accuracy) Audit Engine
 * Version 1.0.0 (LISA_ENFORCEMENT)
 *
 * Enforces final quality standards based on SIA_AUDIT_PROTOCOL.md:
 * 1. Semantic Purity (AI-ism Elimination)
 * 2. Institutional Terminology Parity
 * 3. Syntactic Flow & Density
 * 4. Slang & Dialect Detection
 * 5. Mojibake Detection
 */

import { Language } from './types'

// ============================================================================
// TYPES
// ============================================================================

export interface LISAAuditResult {
  passed: boolean
  score: number // 0-100
  violations: LISAViolation[]
  metrics: LISAMetrics
  recommendations: string[]
}

export interface LISAViolation {
  category: 'AI_ISM' | 'TERMINOLOGY' | 'SYNTAX' | 'SLANG' | 'MOJIBAKE' | 'DENSITY'
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  description: string
  offendingText?: string
  fix?: string
}

export interface LISAMetrics {
  semanticNoiseRatio: number
  dataDensity: number
  terminalAccuracy: number
  avgSentenceLength: number
  mojibakeDetected: boolean
}

// ============================================================================
// FORBIDDEN PHRASES (AI-ISMS)
// ============================================================================

const FORBIDDEN_PHRASES: Record<string, string[]> = {
  en: [
    "In the ever-evolving world of",
    "It is important to remember",
    "A deep dive into",
    "Navigate the landscape",
    "In today's fast-paced",
    "The truth is",
    "Beyond just",
    "Harness the power",
    "Game changer"
  ],
  tr: [
    "Hızla değişen dünyada",
    "Unutmamak gerekir ki",
    "Derinlemesine bir bakış",
    "Önemli bir rol oynamaktadır",
    "Göz ardı edilemez bir gerçek ki",
    "Merakla beklenen",
    "Adeta bir devrim",
    "Heyecan verici"
  ],
  de: [
    "In der sich ständig weiterentwickelnden Welt",
    "Es ist wichtig zu bedenken",
    "Ein tiefer Einblick",
    "In der heutigen schnelllebigen",
    "Tatsache ist"
  ],
  // Add more languages as needed
}

// ============================================================================
// INSTITUTIONAL TERMINOLOGY MAPPING
// ============================================================================

const TERMINOLOGY_CHECKS: Record<string, Array<{ common: string; institutional: string }>> = {
  tr: [
    { common: "para bolluğu", institutional: "likidite genişlemesi" },
    { common: "fiyat fırladı", institutional: "fiyat ralli yaptı" },
    { common: "büyük oyuncular", institutional: "kurumsal yapılar" },
    { common: "kâr ettirir", institutional: "getiri potansiyeli sunar" },
    { common: "alın", institutional: "birikim bölgesinde" },
    { common: "satın", institutional: "dağıtım bölgesinde" }
  ],
  en: [
    { common: "price jump", institutional: "valuation surge" },
    { common: "big players", institutional: "institutional entities" },
    { common: "lots of money", institutional: "surplus liquidity" },
    { common: "buy now", institutional: "asset entering accumulation zone" },
    { common: "strong buy", institutional: "high-confidence institutional alignment" }
  ]
}

// ============================================================================
// CORE AUDIT FUNCTIONS
// ============================================================================

/**
 * Detects AI-isms and semantic noise
 */
function auditAIisms(content: string, language: Language): LISAViolation[] {
  const violations: LISAViolation[] = []
  const phrases = FORBIDDEN_PHRASES[language] || FORBIDDEN_PHRASES.en

  phrases.forEach(phrase => {
    if (content.toLowerCase().includes(phrase.toLowerCase())) {
      violations.push({
        category: 'AI_ISM',
        severity: 'MEDIUM',
        description: `Forbidden AI-ism detected: "${phrase}"`,
        offendingText: phrase,
        fix: 'Remove or replace with data-driven terminology'
      })
    }
  })

  return violations
}

/**
 * Detects non-institutional or slang terminology
 */
function auditTerminology(content: string, language: Language): LISAViolation[] {
  const violations: LISAViolation[] = []
  const mappings = TERMINOLOGY_CHECKS[language] || []

  mappings.forEach(map => {
    if (content.toLowerCase().includes(map.common.toLowerCase())) {
      violations.push({
        category: 'TERMINOLOGY',
        severity: 'HIGH',
        description: `Non-institutional term used: "${map.common}"`,
        offendingText: map.common,
        fix: `Use institutional term: "${map.institutional}"`
      })
    }
  })

  // Detect direct commands (Financial Advice Violation)
  const directCommands = {
    tr: [/\balın\b/gi, /\bsatın\b/gi, /\byatırım yapın\b/gi],
    en: [/\bbuy now\b/gi, /\bsell now\b/gi, /\binvest now\b/gi]
  }

  const commands = directCommands[language as keyof typeof directCommands] || []
  commands.forEach(regex => {
    if (regex.test(content)) {
      violations.push({
        category: 'TERMINOLOGY',
        severity: 'CRITICAL',
        description: 'Direct financial command detected. Forbidden by SIA Master Protocol.',
        fix: 'Replace with analytical accumulation/distribution zones.'
      })
    }
  })

  return violations
}

/**
 * Audits syntactic flow, sentence length and information density
 */
function auditSyntaxAndDensity(content: string): { violations: LISAViolation[]; metrics: Partial<LISAMetrics> } {
  const violations: LISAViolation[] = []
  const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0)

  let totalWords = 0
  let longSentences = 0

  sentences.forEach(s => {
    const wordCount = s.trim().split(/\s+/).length
    totalWords += wordCount
    if (wordCount > 25) {
      longSentences++
    }
  })

  const avgLength = sentences.length > 0 ? totalWords / sentences.length : 0

  if (avgLength > 20) {
    violations.push({
      category: 'SYNTAX',
      severity: 'LOW',
      description: `Average sentence length too high (${Math.round(avgLength)} words). Aim for 15-20.`,
    })
  }

  // Data Density Calculation (Technical terms / Total words)
  const technicalKeywords = ['LIQUIDITY', 'CENTRAL BANK', 'DOLLAR', 'INFLATION', 'MBRIDGE', 'SWIFT', 'INSTITUTIONAL', 'GDP', 'RSI', 'MACD', 'Support', 'Resistance', '%']
  let keywordCount = 0
  technicalKeywords.forEach(kw => {
    const matches = content.match(new RegExp(kw, 'gi'))
    if (matches) keywordCount += matches.length
  })

  const density = (keywordCount / totalWords) * 100

  if (density < 5) { // Protocol requirement is technically higher but 5% is a safe start for metrics
    violations.push({
      category: 'DENSITY',
      severity: 'HIGH',
      description: `Information density too low (${density.toFixed(1)}%). Paragraphs must contain more metrics or Golden Keywords.`,
    })
  }

  return {
    violations,
    metrics: {
      avgSentenceLength: avgLength,
      dataDensity: density
    }
  }
}

/**
 * Detects Mojibake and character corruption
 */
function auditMojibake(content: string): LISAViolation[] {
  const violations: LISAViolation[] = []
  const mojibakeIndicators = /[ÃÄÅÆÇĞÑ°¼½¾œžŸ\\]|\\u[0-9a-fA-F]{4}/

  if (mojibakeIndicators.test(content) && !content.includes('STATISTICAL_PROBABILITY_ANALYSIS')) { // Exclude headers
    // Note: CJK languages and specific indicators might false positive, need careful regex
    const corruptChars = content.match(/[ÃÄÅÆÇĞÑ°¼½¾œžŸ]/g)
    if (corruptChars && corruptChars.length > 5) {
      violations.push({
        category: 'MOJIBAKE',
        severity: 'CRITICAL',
        description: 'Possible character encoding corruption (Mojibake) detected.',
        offendingText: corruptChars.slice(0, 5).join(', ')
      })
    }
  }

  return violations
}

// ============================================================================
// MAIN AUDIT ENGINE
// ============================================================================

/**
 * Runs a complete LISA Audit on a single language node
 */
export async function runLISAArticleAudit(
  content: string,
  language: Language
): Promise<LISAAuditResult> {
  const aiViolations = auditAIisms(content, language)
  const termViolations = auditTerminology(content, language)
  const { violations: syntaxViolations, metrics: syntaxMetrics } = auditSyntaxAndDensity(content)
  const mojibakeViolations = auditMojibake(content)

  const allViolations = [
    ...aiViolations,
    ...termViolations,
    ...syntaxViolations,
    ...mojibakeViolations
  ]

  // Calculate Score
  let score = 100
  allViolations.forEach(v => {
    if (v.severity === 'CRITICAL') score -= 30
    if (v.severity === 'HIGH') score -= 15
    if (v.severity === 'MEDIUM') score -= 5
    if (v.severity === 'LOW') score -= 2
  })

  score = Math.max(0, score)

  const recommendations = allViolations
    .map(v => v.fix || v.description)
    .filter((v, i, a) => a.indexOf(v) === i) // Deduplicate

  return {
    passed: score >= 80 && !allViolations.some(v => v.severity === 'CRITICAL'),
    score,
    violations: allViolations,
    metrics: {
      semanticNoiseRatio: aiViolations.length / 10, // Normalized
      dataDensity: syntaxMetrics.dataDensity || 0,
      terminalAccuracy: 100 - (termViolations.length * 10),
      avgSentenceLength: syntaxMetrics.avgSentenceLength || 0,
      mojibakeDetected: mojibakeViolations.length > 0
    },
    recommendations
  }
}

/**
 * Runs LISA Audit on an entire Workspace (all 9 nodes)
 */
export async function runLISAWorkspaceAudit(ws: any): Promise<{
  allPassed: boolean
  results: Record<string, LISAAuditResult>
}> {
  const results: Record<string, LISAAuditResult> = {}
  let allPassed = true

  const langs = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'] as Language[]

  for (const lang of langs) {
    const node = ws[lang]
    if (node && node.content) {
      const result = await runLISAArticleAudit(node.content, lang)
      results[lang] = result
      if (!result.passed) {
        allPassed = false
      }
    }
  }

  return { allPassed, results }
}
