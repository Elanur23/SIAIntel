/**
 * GLOBAL GOVERNANCE AUDIT ENGINE
 * 9-Language Multilingual Validation System
 * 
 * Enforces fail-closed governance across all required language nodes.
 * A Panda package must pass validation across all 9 languages before deploy unlock.
 * 
 * @version 1.0.0
 * @author SIA Intelligence Systems
 */

import { detectForbiddenResidue } from '@/lib/neural-assembly/sia-sentinel-core';
import { PANDA_REQUIRED_LANGS, type PandaLanguage } from '@/lib/content/sia-panda-writing-protocol';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type SupportedLang = 'en' | 'tr' | 'de' | 'fr' | 'es' | 'ru' | 'ar' | 'jp' | 'zh';
export type GlobalAuditStatus = 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | 'STALE';
export type GatingStatus = 'READY_FOR_GLOBAL_DEPLOY' | 'GATING_RESTRICTED';

export interface GlobalLanguageAuditResult {
  score: number;
  status: GlobalAuditStatus;
  wordCount: number;
  residueDetected: boolean;
  criticalIssues: string[];
  warnings: string[];
  residueFindings: string[];
  seoFindings: string[];
  provenanceFindings: string[];
  parityFindings: string[];
}

export interface GlobalAuditResult {
  articleId: string;
  status: GlobalAuditStatus;
  publishable: boolean;
  gatingStatus: GatingStatus;
  globalScore: number;
  timestamp: string;
  failedLanguages: SupportedLang[];
  warningLanguages: SupportedLang[];
  globalFindings: string[];
  auditInvalidated?: boolean;
  reAuditRequired?: boolean;
  invalidationReason?: string;
  invalidatedAt?: string;
  consistency: {
    numberParityPass: boolean;
    entityParityPass: boolean;
    mismatchedNodes: string[];
  };
  languages: Record<SupportedLang, GlobalLanguageAuditResult>;
}

interface VaultNode {
  title: string;
  desc: string;
  ready: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const DETERMINISTIC_FINANCE_PATTERNS = [
  'guaranteed returns',
  'will rise',
  'will fall',
  'guaranteed profit',
  'certain gain',
  'risk-free',
  'cannot lose',
  'guaranteed success'
];

const FAKE_VERIFICATION_PATTERNS = [
  'multilingual parity verified',
  'E-E-A-T verified',
  'Google verified',
  'officially verified',
  'certified accurate',
  'independently verified'
];

const UNSUPPORTED_SCORE_PATTERNS = [
  'confidence score',
  'accuracy score',
  'verification score',
  'trust score'
];

const MIN_WORD_COUNT = 50;
const MIN_SCORE_THRESHOLD = 70;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Strip Warroom structural labels from composed vault text before residue detection.
 * These labels are added by applyPandaPackageToVault() and should not trigger residue detection.
 * 
 * Allowed structural labels:
 * - [SUBHEADLINE], [SUMMARY], [BODY], [KEY_INSIGHTS]
 * - [RISK_NOTE], [SEO_TITLE], [SEO_DESCRIPTION], [PROVENANCE]
 */
function stripWarroomStructuralLabels(text: string): string {
  return text.replace(/\[(SUBHEADLINE|SUMMARY|BODY|KEY_INSIGHTS|RISK_NOTE|SEO_TITLE|SEO_DESCRIPTION|PROVENANCE)\]/gi, '');
}

/**
 * Extract numbers from text for parity checking
 */
function extractNumbers(text: string): number[] {
  const numbers: number[] = [];
  
  // Match currency values: $123, €456, ¥789
  const currencyMatches = text.match(/[$€¥£]\s*[\d,]+(?:\.\d+)?/g);
  if (currencyMatches) {
    currencyMatches.forEach(match => {
      const num = parseFloat(match.replace(/[$€¥£,\s]/g, ''));
      if (!isNaN(num)) numbers.push(num);
    });
  }
  
  // Match percentages: 12.5%, 50%
  const percentMatches = text.match(/\d+(?:\.\d+)?%/g);
  if (percentMatches) {
    percentMatches.forEach(match => {
      const num = parseFloat(match.replace('%', ''));
      if (!isNaN(num)) numbers.push(num);
    });
  }
  
  // Match large numbers with units: 1.5 billion, 200 million
  const largeNumMatches = text.match(/\d+(?:\.\d+)?\s*(million|billion|trillion)/gi);
  if (largeNumMatches) {
    largeNumMatches.forEach(match => {
      const parts = match.split(/\s+/);
      const num = parseFloat(parts[0]);
      if (!isNaN(num)) {
        const multiplier = parts[1].toLowerCase();
        if (multiplier.includes('million')) numbers.push(num * 1000000);
        else if (multiplier.includes('billion')) numbers.push(num * 1000000000);
        else if (multiplier.includes('trillion')) numbers.push(num * 1000000000000);
      }
    });
  }
  
  return numbers;
}

/**
 * Check if two number arrays have material mismatches
 */
function checkNumberParity(enNumbers: number[], langNumbers: number[], tolerance: number = 0.05): boolean {
  if (enNumbers.length === 0 && langNumbers.length === 0) return true;
  if (enNumbers.length !== langNumbers.length) return false;
  
  // Sort both arrays for comparison
  const sortedEn = [...enNumbers].sort((a, b) => a - b);
  const sortedLang = [...langNumbers].sort((a, b) => a - b);
  
  // Check each pair for material mismatch
  for (let i = 0; i < sortedEn.length; i++) {
    const en = sortedEn[i];
    const lang = sortedLang[i];
    
    // Allow 5% tolerance for rounding/conversion
    const diff = Math.abs(en - lang);
    const relativeDiff = en !== 0 ? diff / Math.abs(en) : diff;
    
    if (relativeDiff > tolerance) {
      return false;
    }
  }
  
  return true;
}

/**
 * Audit a single language node
 * 
 * NOTE: Current Warroom vault stores each language as a composed string in the 'desc' field.
 * Structured field access (headline, body, keyInsights, etc.) is not available in this phase.
 * We audit the composed text and report limitations where applicable.
 */
function auditLanguageNode(
  lang: SupportedLang,
  node: VaultNode,
  enNode?: VaultNode
): GlobalLanguageAuditResult {
  const result: GlobalLanguageAuditResult = {
    score: 100,
    status: 'PASS',
    wordCount: 0,
    residueDetected: false,
    criticalIssues: [],
    warnings: [],
    residueFindings: [],
    seoFindings: [],
    provenanceFindings: [],
    parityFindings: []
  };
  
  // Check if node exists and is ready
  if (!node || !node.ready) {
    result.criticalIssues.push(`Language node ${lang.toUpperCase()} is not ready or missing`);
    result.score = 0;
    result.status = 'FAIL';
    return result;
  }
  
  const content = node.desc || '';
  const title = node.title || '';
  const fullText = `${title}\n\n${content}`;
  
  // Check for empty content
  if (!content.trim()) {
    result.criticalIssues.push(`Language node ${lang.toUpperCase()} has empty content`);
    result.score = 0;
    result.status = 'FAIL';
    return result;
  }
  
  // Word count
  const words = content.split(/\s+/).filter(w => w.length > 0);
  result.wordCount = words.length;
  
  if (result.wordCount < MIN_WORD_COUNT) {
    result.criticalIssues.push(`Word count too low: ${result.wordCount} (minimum ${MIN_WORD_COUNT})`);
    result.score -= 30;
  }
  
  // RESIDUE DETECTION
  // Strip Warroom structural labels before residue scan to avoid false positives
  // Labels like [SUBHEADLINE], [SUMMARY] are legitimate vault structure markers
  const residueScanText = stripWarroomStructuralLabels(fullText);
  const residueMatch = detectForbiddenResidue(residueScanText);
  if (residueMatch) {
    result.residueDetected = true;
    result.residueFindings.push(`Forbidden residue detected: "${residueMatch}"`);
    result.criticalIssues.push(`Editorial residue found: ${residueMatch}`);
    result.score = 0; // Hard fail on residue
  }
  
  // FAKE VERIFICATION DETECTION
  const lowerText = fullText.toLowerCase();
  for (const pattern of FAKE_VERIFICATION_PATTERNS) {
    if (lowerText.includes(pattern.toLowerCase())) {
      result.provenanceFindings.push(`Fake verification claim: "${pattern}"`);
      result.criticalIssues.push(`Unsupported verification claim: ${pattern}`);
      result.score = 0; // Hard fail
    }
  }
  
  // UNSUPPORTED CONFIDENCE SCORE DETECTION
  for (const pattern of UNSUPPORTED_SCORE_PATTERNS) {
    if (lowerText.includes(pattern.toLowerCase())) {
      result.provenanceFindings.push(`Unsupported score claim: "${pattern}"`);
      result.criticalIssues.push(`Unsupported confidence score claim: ${pattern}`);
      result.score = 0; // Hard fail
    }
  }
  
  // DETERMINISTIC FINANCE LANGUAGE DETECTION
  for (const pattern of DETERMINISTIC_FINANCE_PATTERNS) {
    if (lowerText.includes(pattern.toLowerCase())) {
      result.criticalIssues.push(`Deterministic financial claim: "${pattern}"`);
      result.score = 0; // Hard fail
    }
  }
  
  // MALFORMED FOOTER CHECK
  if (fullText.includes('## ##') || fullText.includes('### ###')) {
    result.criticalIssues.push('Malformed markdown prefixes detected');
    result.score -= 30;
  }
  
  // DUPLICATE FOOTER CHECK
  const footerMarkers = ['SIA-V4-EEAT-SOURCE-VERIFICATION', 'Verification Metadata'];
  footerMarkers.forEach(marker => {
    const count = (fullText.match(new RegExp(marker, 'g')) || []).length;
    if (count > 1) {
      result.warnings.push(`Duplicate footer marker: ${marker}`);
      result.score -= 15;
    }
  });
  
  // RISK NOTE CHECK (Basic - check if "risk" keyword exists)
  // NOTE: Structured riskNote field not available in current vault structure
  if (!lowerText.includes('risk') && !lowerText.includes('disclaimer')) {
    result.warnings.push('No risk disclaimer detected in content');
    result.score -= 10;
  }
  
  // SEO CHECKS (Basic - check for structured markers)
  // NOTE: Structured seoTitle/seoDescription not available in current vault
  if (content.includes('[SEO_TITLE]') || content.includes('[SEO_DESCRIPTION]')) {
    result.seoFindings.push('SEO fields detected in composed content');
  }
  
  // CROSS-LANGUAGE PARITY CHECK (if English node provided)
  if (enNode && lang !== 'en') {
    const enNumbers = extractNumbers(enNode.desc || '');
    const langNumbers = extractNumbers(content);
    
    if (enNumbers.length > 0 && langNumbers.length > 0) {
      const parityPass = checkNumberParity(enNumbers, langNumbers);
      if (!parityPass) {
        result.parityFindings.push(`Numeric mismatch with EN node (EN: ${enNumbers.length} numbers, ${lang.toUpperCase()}: ${langNumbers.length} numbers)`);
        result.warnings.push('Numeric parity check failed');
        result.score -= 20;
      }
    }
  }
  
  // Final status determination
  if (result.score < MIN_SCORE_THRESHOLD) {
    result.status = 'FAIL';
  } else if (result.warnings.length > 0 || result.parityFindings.length > 0) {
    result.status = 'NEEDS_REVIEW';
  }
  
  result.score = Math.max(0, Math.min(100, result.score));
  
  return result;
}

// ============================================================================
// MAIN AUDIT FUNCTION
// ============================================================================

/**
 * Run global governance audit across all 9 required language nodes
 * 
 * @param articleId - Unique identifier for the article
 * @param vault - Current Warroom vault state with all language nodes
 * @returns GlobalAuditResult with comprehensive validation results
 */
export function runGlobalGovernanceAudit(
  articleId: string,
  vault: Record<string, VaultNode>
): GlobalAuditResult {
  const timestamp = new Date().toISOString();
  
  const result: GlobalAuditResult = {
    articleId,
    status: 'PASS',
    publishable: true,
    gatingStatus: 'READY_FOR_GLOBAL_DEPLOY',
    globalScore: 100,
    timestamp,
    failedLanguages: [],
    warningLanguages: [],
    globalFindings: [],
    consistency: {
      numberParityPass: true,
      entityParityPass: true,
      mismatchedNodes: []
    },
    languages: {} as Record<SupportedLang, GlobalLanguageAuditResult>
  };
  
  // Check all required languages exist
  const missingLanguages: SupportedLang[] = [];
  for (const lang of PANDA_REQUIRED_LANGS) {
    if (!vault[lang]) {
      missingLanguages.push(lang as SupportedLang);
    }
  }
  
  if (missingLanguages.length > 0) {
    result.status = 'FAIL';
    result.publishable = false;
    result.gatingStatus = 'GATING_RESTRICTED';
    result.globalScore = 0;
    result.failedLanguages = missingLanguages;
    result.globalFindings.push(`Missing required languages: ${missingLanguages.join(', ')}`);
    
    // Create placeholder results for missing languages
    missingLanguages.forEach(lang => {
      result.languages[lang] = {
        score: 0,
        status: 'FAIL',
        wordCount: 0,
        residueDetected: false,
        criticalIssues: ['Language node missing'],
        warnings: [],
        residueFindings: [],
        seoFindings: [],
        provenanceFindings: [],
        parityFindings: []
      };
    });
    
    return result;
  }
  
  // Audit each language node
  const enNode = vault['en'];
  let totalScore = 0;
  let auditedCount = 0;
  
  for (const lang of PANDA_REQUIRED_LANGS) {
    const langKey = lang as SupportedLang;
    const node = vault[langKey];
    
    const langResult = auditLanguageNode(langKey, node, enNode);
    result.languages[langKey] = langResult;
    
    totalScore += langResult.score;
    auditedCount++;
    
    // Track failed and warning languages
    if (langResult.status === 'FAIL') {
      result.failedLanguages.push(langKey);
    } else if (langResult.status === 'NEEDS_REVIEW') {
      result.warningLanguages.push(langKey);
    }
    
    // Track residue detection
    if (langResult.residueDetected) {
      result.globalFindings.push(`${langKey.toUpperCase()}: Residue detected`);
    }
    
    // Track critical issues
    if (langResult.criticalIssues.length > 0) {
      result.globalFindings.push(`${langKey.toUpperCase()}: ${langResult.criticalIssues.length} critical issue(s)`);
    }
    
    // Track parity issues
    if (langResult.parityFindings.length > 0) {
      result.consistency.numberParityPass = false;
      result.consistency.mismatchedNodes.push(langKey);
    }
  }
  
  // Calculate global score
  result.globalScore = auditedCount > 0 ? Math.round(totalScore / auditedCount) : 0;
  
  // FAIL-CLOSED RULES: Determine publishable status
  result.publishable = true; // Start optimistic
  
  // Rule 1: Any required language missing
  if (missingLanguages.length > 0) {
    result.publishable = false;
    result.globalFindings.push('FAIL: Required language(s) missing');
  }
  
  // Rule 2: Any language node empty or not ready
  for (const lang of PANDA_REQUIRED_LANGS) {
    const langKey = lang as SupportedLang;
    const node = vault[langKey];
    if (!node || !node.ready || !node.desc || node.desc.trim().length === 0) {
      result.publishable = false;
      result.globalFindings.push(`FAIL: ${langKey.toUpperCase()} node empty or not ready`);
    }
  }
  
  // Rule 3: Any language score < 70
  if (result.failedLanguages.length > 0) {
    result.publishable = false;
    result.globalFindings.push(`FAIL: ${result.failedLanguages.length} language(s) below threshold`);
  }
  
  // Rule 4: Any residue detected
  const residueDetected = Object.values(result.languages).some(l => l.residueDetected);
  if (residueDetected) {
    result.publishable = false;
    result.globalFindings.push('FAIL: Editorial residue detected');
  }
  
  // Rule 5: Fake verification/provenance detected
  const fakeVerification = Object.values(result.languages).some(l => 
    l.provenanceFindings.some(f => f.includes('verification') || f.includes('score'))
  );
  if (fakeVerification) {
    result.publishable = false;
    result.globalFindings.push('FAIL: Fake verification claims detected');
  }
  
  // Rule 6: Deterministic financial promises detected
  const deterministicClaims = Object.values(result.languages).some(l =>
    l.criticalIssues.some(i => i.includes('Deterministic financial'))
  );
  if (deterministicClaims) {
    result.publishable = false;
    result.globalFindings.push('FAIL: Deterministic financial claims detected');
  }
  
  // Rule 7: Global score too low
  if (result.globalScore < MIN_SCORE_THRESHOLD) {
    result.publishable = false;
    result.globalFindings.push(`FAIL: Global score ${result.globalScore} below threshold ${MIN_SCORE_THRESHOLD}`);
  }
  
  // Determine final status and gating
  if (!result.publishable) {
    result.status = 'FAIL';
    result.gatingStatus = 'GATING_RESTRICTED';
  } else if (result.warningLanguages.length > 0 || !result.consistency.numberParityPass) {
    result.status = 'NEEDS_REVIEW';
    result.gatingStatus = 'READY_FOR_GLOBAL_DEPLOY'; // Still publishable but needs review
  }
  
  return result;
}
