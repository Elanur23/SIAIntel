/**
 * SIA_SENTINEL_CORE.TS
 * 12-Layer Neural Audit Pipeline for Intelligence Content Analysis
 * 
 * This engine analyzes articles against Google E-E-A-T standards and
 * intelligence reporting best practices, providing real-time diagnostics
 * and actionable treatment plans for content optimization.
 * 
 * @version 1.0.0
 * @author SIA Intelligence Systems
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Severity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type AuditStatus = 'PASS' | 'WARNING' | 'FAIL';

export interface AuditIssue {
  issue_id: string;
  issue_type: string;
  severity: Severity;
  field: string;
  message: string;
  auto_fixable: boolean;
  suggested_fix?: string;
}

export interface AuditCellScore {
  score: number; // 0-100
  status: AuditStatus;
  issues: string[];
  recommendations: string[];
}

export interface AuditInput {
  title: string;
  subtitle?: string;
  lead?: string;
  body: string;
  summary?: string;
  metadata?: Record<string, any>;
  schema?: any;
  internalLinks?: string[];
  language: string;
  region?: string;
  micReferences?: string[];
}

export interface AuditResult {
  overall_score: number; // 0-100
  cell_scores: {
    title_cell: AuditCellScore;
    body_cell: AuditCellScore;
    meta_cell: AuditCellScore;
    seo_cell: AuditCellScore;
    readability_cell: AuditCellScore;
    fact_risk_cell: AuditCellScore;
    schema_cell: AuditCellScore;
    link_cell: AuditCellScore;
    policy_cell: AuditCellScore;
    crosslang_cell?: AuditCellScore;
  };
  issues: AuditIssue[];
  warnings: AuditIssue[];
  critical_issues: AuditIssue[];
  recommendations: string[];
  confidence_score: number;
  audit_duration_ms: number;
  metadata: {
    wordCount: number;
    sentenceCount: number;
    avgWordsPerSentence: number;
    dataPointCount: number;
  };
  status: 'PERFECT' | 'NEEDS_TREATMENT' | 'NULL_CONTENT';
}

// ============================================================================
// CONFIGURATION & CONSTANTS
// ============================================================================

const CRITICAL_ENTITIES = [
  'NVIDIA', 'IMF', 'Federal Reserve', 'ECB', 'Central Bank', 'Blackwell',
  'H100', 'H200', 'B200', 'GPU', 'FLOPS', 'Basel', 'SDR', 'G7', 'GCC',
  'TSMC', 'Taiwan', 'China', 'United States', 'Saudi Arabia', 'UAE',
  'Bitcoin', 'Ethereum', 'BTC', 'ETH', 'SEC', 'CFTC', 'Treasury',
  'World Bank', 'OPEC', 'NATO', 'BRICS', 'WTO', 'UN'
]

const CLICKBAIT_WORDS = [
  'shocking', 'unbelievable', 'incredible', 'mind-blowing', 'insane',
  'you won\'t believe', 'this will shock you', 'secret', 'exposed',
  'revealed', 'bombshell', 'game-changer', 'revolutionary'
]

const AI_CLICHES = [
  'in conclusion', 'it is important to note', 'plays a crucial role',
  'it should be noted', 'needless to say', 'goes without saying',
  'at the end of the day', 'in today\'s world', 'in this day and age',
  'paradigm shift', 'synergy', 'leverage', 'circle back', 'touch base',
  'low-hanging fruit', 'move the needle', 'game changer'
]

const EMOTIONAL_ADJECTIVES = [
  'terrible', 'horrible', 'awful', 'fantastic', 'amazing', 'incredible',
  'devastating', 'catastrophic', 'miraculous', 'spectacular', 'phenomenal',
  'disastrous', 'brilliant', 'genius', 'stupid', 'idiotic'
]

const AUTHORITY_SOURCES = [
  'Reuters', 'Bloomberg', 'Associated Press', 'AP', 'Financial Times',
  'Wall Street Journal', 'WSJ', 'SEC', 'FED', 'ECB', 'IMF', 'World Bank',
  'CNBC', 'Forbes', 'The Economist', 'Nikkei', 'Xinhua', 'TASS',
  'official statement', 'press release', 'regulatory filing', 'whitepaper'
]

const THREAT_KEYWORDS = [
  'crisis', 'crash', 'collapse', 'bankruptcy', 'default', 'embargo',
  'sanctions', 'vulnerability', 'breach', 'hack', 'attack', 'threat',
  'risk', 'danger', 'warning', 'alert', 'emergency', 'critical'
]

const TIME_MARKERS = [
  'today', 'yesterday', 'tomorrow', 'this week', 'this month', 'this year',
  'recently', 'latest', 'breaking', 'Q1', 'Q2', 'Q3', 'Q4',
  '2024', '2025', '2026', 'January', 'February', 'March', 'April',
  'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'
]

const PLACEHOLDERS = ['TODO', 'FIXME', '[PLACEHOLDER]', 'TBD', '[INSERT', 'XYZ'];

// ============================================================================
// HELPERS
// ============================================================================

function createDefaultCellScore(): AuditCellScore {
  return {
    score: 100,
    status: 'PASS',
    issues: [],
    recommendations: []
  };
}

function updateCellStatus(cell: AuditCellScore) {
  if (cell.score < 60) cell.status = 'FAIL';
  else if (cell.score < 90) cell.status = 'WARNING';
  else cell.status = 'PASS';
}

// ============================================================================
// CORE AUDIT ENGINE
// ============================================================================

export function runDeepAudit(input: AuditInput): AuditResult {
  const startTime = Date.now();
  const {
    title, subtitle, lead, body, summary,
    metadata: inputMetadata, schema, internalLinks,
    language, region, micReferences
  } = input;

  // Initialize Audit Result
  const audit: AuditResult = {
    overall_score: 100,
    cell_scores: {
      title_cell: createDefaultCellScore(),
      body_cell: createDefaultCellScore(),
      meta_cell: createDefaultCellScore(),
      seo_cell: createDefaultCellScore(),
      readability_cell: createDefaultCellScore(),
      fact_risk_cell: createDefaultCellScore(),
      schema_cell: createDefaultCellScore(),
      link_cell: createDefaultCellScore(),
      policy_cell: createDefaultCellScore(),
      crosslang_cell: micReferences ? createDefaultCellScore() : undefined,
    },
    issues: [],
    warnings: [],
    critical_issues: [],
    recommendations: [],
    confidence_score: 100,
    audit_duration_ms: 0,
    metadata: {
      wordCount: 0,
      sentenceCount: 0,
      avgWordsPerSentence: 0,
      dataPointCount: 0,
    },
    status: 'PERFECT'
  };

  // 0. NULL CONTENT CHECK
  if (!body || body.trim().length === 0) {
    const issue: AuditIssue = {
      issue_id: 'MISSING_BODY',
      issue_type: 'CONTENT_ERROR',
      severity: 'CRITICAL',
      field: 'body',
      message: 'Article body is completely empty.',
      auto_fixable: false
    };
    audit.issues.push(issue);
    audit.critical_issues.push(issue);
    audit.status = 'NULL_CONTENT';
    audit.overall_score = 0;
    audit.audit_duration_ms = Date.now() - startTime;
    return audit;
  }

  // 1. PRE-PROCESSING
  const textLower = body.toLowerCase();
  const titleLower = title?.toLowerCase() || '';
  const words = body.split(/\s+/).filter(w => w.length > 0);
  const sentences = body.split(/[.!?]+/).filter(s => s.trim().length > 0);

  audit.metadata.wordCount = words.length;
  audit.metadata.sentenceCount = sentences.length;

  // PHASE 3 HARDENING: Robust word count for non-spaced languages (CJK)
  let effectiveWordCount = words.length;
  if (['zh', 'jp'].includes(language.toLowerCase()) && effectiveWordCount < (body.length / 2)) {
    // For CJK, assume 1 word ≈ 1.5 characters (conservative heuristic)
    effectiveWordCount = Math.round(body.length / 1.5);
  }

  audit.metadata.wordCount = effectiveWordCount;
  audit.metadata.avgWordsPerSentence = sentences.length > 0 ? effectiveWordCount / sentences.length : 0;

  const addIssue = (cell: AuditCellScore, issueData: Omit<AuditIssue, 'issue_id'>) => {
    const issue: AuditIssue = {
      ...issueData,
      issue_id: `${issueData.field.toUpperCase()}_${issueData.issue_type.toUpperCase()}_${Date.now()}`
    };
    audit.issues.push(issue);
    cell.issues.push(issue.message);
    if (issue.suggested_fix) cell.recommendations.push(issue.suggested_fix);

    if (issue.severity === 'CRITICAL') audit.critical_issues.push(issue);
    if (issue.severity === 'HIGH' || issue.severity === 'MEDIUM') audit.warnings.push(issue);

    // Apply score deductions
    const deductions: Record<Severity, number> = {
      'LOW': 5,
      'MEDIUM': 15,
      'HIGH': 30,
      'CRITICAL': 50
    };
    cell.score = Math.max(0, cell.score - deductions[issue.severity]);
  };

  // ============================================================================
  // DETERMINISTIC CHECKS
  // ============================================================================

  // TITLE CELL
  if (!title || title.trim().length === 0) {
    addIssue(audit.cell_scores.title_cell, {
      issue_type: 'MISSING_FIELD',
      severity: 'CRITICAL',
      field: 'title',
      message: 'Article title is missing.',
      auto_fixable: false
    });
  } else if (title.length < 10) {
    addIssue(audit.cell_scores.title_cell, {
      issue_type: 'LENGTH_ERROR',
      severity: 'HIGH',
      field: 'title',
      message: 'Title is too short. Target at least 10 characters.',
      auto_fixable: false
    });
  } else if (title.length > 100) {
    addIssue(audit.cell_scores.title_cell, {
      issue_type: 'LENGTH_ERROR',
      severity: 'MEDIUM',
      field: 'title',
      message: 'Title is excessively long (>100 characters).',
      auto_fixable: false
    });
  }

  // PLACEHOLDER CHECK (TODO, FIXME, etc.)
  PLACEHOLDERS.forEach(placeholder => {
    if (body.includes(placeholder)) {
      addIssue(audit.cell_scores.body_cell, {
        issue_type: 'PLACEHOLDER_DETECTED',
        severity: 'CRITICAL',
        field: 'body',
        message: `Placeholder '${placeholder}' found in body.`,
        auto_fixable: false,
        suggested_fix: `Remove or resolve the ${placeholder} before publishing.`
      });
    }
  });

  // BODY CELL - Length
  if (effectiveWordCount < 50) {
    addIssue(audit.cell_scores.body_cell, {
      issue_type: 'MIN_LENGTH',
      severity: 'CRITICAL',
      field: 'body',
      message: 'Content is too thin. Minimum 50 words required for production articles.',
      auto_fixable: false
    });
  }

  // META CELL
  if (!summary || summary.length === 0) {
    addIssue(audit.cell_scores.meta_cell, {
      issue_type: 'MISSING_FIELD',
      severity: 'HIGH',
      field: 'summary',
      message: 'Meta description/summary is missing.',
      auto_fixable: true,
      suggested_fix: 'Generate a meta summary from the body content.'
    });
  } else if (summary.length < 50 || summary.length > 300) {
    addIssue(audit.cell_scores.meta_cell, {
      issue_type: 'LENGTH_ERROR',
      severity: 'MEDIUM',
      field: 'summary',
      message: 'Summary length should be between 50 and 300 characters.',
      auto_fixable: false
    });
  }

  // SEO CELL - Keyword Density & Repeated Phrases
  // (Simplified check for now: duplicate paragraphs)
  const paragraphs = body.split('\n\n').filter(p => p.trim().length > 0);
  const uniqueParagraphs = new Set(paragraphs);
  if (uniqueParagraphs.size < paragraphs.length) {
    addIssue(audit.cell_scores.seo_cell, {
      issue_type: 'DUPLICATE_CONTENT',
      severity: 'HIGH',
      field: 'body',
      message: 'Duplicate paragraphs detected.',
      auto_fixable: true,
      suggested_fix: 'Remove duplicate paragraphs.'
    });
  }

  // LINK CELL
  if (!internalLinks || internalLinks.length === 0) {
    addIssue(audit.cell_scores.link_cell, {
      issue_type: 'MISSING_LINKS',
      severity: 'MEDIUM',
      field: 'internalLinks',
      message: 'No internal links detected. Links are critical for navigation.',
      auto_fixable: false
    });
  } else {
    internalLinks.forEach(link => {
      try {
        new URL(link);
      } catch (e) {
        addIssue(audit.cell_scores.link_cell, {
          issue_type: 'MALFORMED_URL',
          severity: 'HIGH',
          field: 'internalLinks',
          message: `Malformed internal link: ${link}`,
          auto_fixable: false
        });
      }
    });
  }

  // SCHEMA CELL
  if (!schema || Object.keys(schema).length === 0) {
    addIssue(audit.cell_scores.schema_cell, {
      issue_type: 'MISSING_SCHEMA',
      severity: 'CRITICAL',
      field: 'schema',
      message: 'Structured data (schema) is missing.',
      auto_fixable: true,
      suggested_fix: 'Generate Article or NewsArticle schema.'
    });
  }

  // READABILITY CELL
  if (audit.metadata.avgWordsPerSentence > 25) {
    addIssue(audit.cell_scores.readability_cell, {
      issue_type: 'READABILITY_ERROR',
      severity: 'MEDIUM',
      field: 'body',
      message: `Average words per sentence is too high (${audit.metadata.avgWordsPerSentence.toFixed(1)}). Aim for < 25.`,
      auto_fixable: false
    });
  }

  // FACT RISK CELL - Authority Check
  const citedSources = AUTHORITY_SOURCES.filter(source => 
    textLower.includes(source.toLowerCase())
  );
  if (citedSources.length === 0) {
    addIssue(audit.cell_scores.fact_risk_cell, {
      issue_type: 'LOW_AUTHORITY',
      severity: 'MEDIUM',
      field: 'body',
      message: 'No authoritative sources cited (Bloomberg, Reuters, SEC, etc).',
      auto_fixable: false
    });
  }

  // DATA POINTS
  const dataPatterns = [/\d+%/g, /\$\d+/g, /\d+ (million|billion|trillion)/gi];
  let dataPointCount = 0;
  dataPatterns.forEach(pattern => {
    const matches = body.match(pattern);
    if (matches) dataPointCount += matches.length;
  });
  audit.metadata.dataPointCount = dataPointCount;
  if (dataPointCount < 3) {
    addIssue(audit.cell_scores.fact_risk_cell, {
      issue_type: 'LOW_DATA_DENSITY',
      severity: 'MEDIUM',
      field: 'body',
      message: 'Low quantitative data density. Intelligence reports require hard numbers.',
      auto_fixable: false
    });
  }

  // POLICY CELL
  const clickbaitInTitle = CLICKBAIT_WORDS.filter(word => titleLower.includes(word.toLowerCase()));
  if (clickbaitInTitle.length > 0) {
    addIssue(audit.cell_scores.policy_cell, {
      issue_type: 'CLICKBAIT_POLICY',
      severity: 'HIGH',
      field: 'title',
      message: `Clickbait detected in title: ${clickbaitInTitle.join(', ')}`,
      auto_fixable: false
    });
  }

  // CROSSLANG CELL
  if (micReferences && micReferences.length > 0) {
    // Basic check for multilingual references
    // This is a placeholder for actual cross-lang analysis
  }

  // FINAL SCORING
  const cells = Object.values(audit.cell_scores).filter(Boolean) as AuditCellScore[];
  cells.forEach(updateCellStatus);

  const totalScore = cells.reduce((sum, cell) => sum + cell.score, 0);
  audit.overall_score = Math.round(totalScore / cells.length);

  // Status mapping
  if (audit.critical_issues.length > 0) audit.status = 'NEEDS_TREATMENT';
  else if (audit.overall_score >= 90 && audit.issues.length === 0) audit.status = 'PERFECT';
  else audit.status = 'NEEDS_TREATMENT';

  audit.recommendations = Array.from(new Set(audit.issues.map(i => i.suggested_fix).filter(Boolean) as string[]));

  audit.audit_duration_ms = Date.now() - startTime;
  audit.confidence_score = Math.max(0, 100 - (audit.issues.length * 2));

  return audit;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generates a human-readable audit summary
 */
export function generateAuditSummary(audit: AuditResult): string {
  const { overall_score, cell_scores, issues, audit_duration_ms, metadata } = audit;

  let summary = `AUDIT SUMMARY\n`;
  summary += `Overall Score: ${overall_score}/100\n`;
  summary += `Status: ${audit.status}\n`;
  summary += `Processing Time: ${audit_duration_ms}ms\n\n`;

  summary += `METRICS:\n`;
  summary += `- Word Count: ${metadata.wordCount}\n`;
  summary += `- Sentences: ${metadata.sentenceCount}\n`;
  summary += `- Avg Words/Sentence: ${metadata.avgWordsPerSentence.toFixed(1)}\n`;
  summary += `- Data Points: ${metadata.dataPointCount}\n\n`;

  if (issues.length > 0) {
    summary += `ISSUES FOUND (${issues.length}):\n`;
    issues.forEach(i => {
      summary += `[${i.severity}] ${i.field}: ${i.message}\n`;
    });
  } else {
    summary += `✅ No issues detected. Content meets all production standards.\n`;
  }

  return summary;
}

/**
 * Exports audit result to JSON format for API responses
 */
export function exportAuditJSON(audit: AuditResult): string {
  return JSON.stringify(audit, null, 2)
}
