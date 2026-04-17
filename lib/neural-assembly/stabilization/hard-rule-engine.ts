import type { BatchJob, LanguageEdition } from '../master-orchestrator'
import { Language } from '../editorial-event-bus'
import type { HardRuleViolation } from './types'

const PLACEHOLDER_TOKENS = ['TODO', 'FIXME', '[PLACEHOLDER]', 'TBD', '[INSERT', 'XYZ']

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validateInternalLinks(links: unknown): { ok: boolean; message?: string } {
  if (!Array.isArray(links) || links.length === 0) {
    return { ok: false, message: 'internalLinks missing or empty' }
  }

  let invalid = 0
  for (const link of links) {
    if (typeof link !== 'string') {
      invalid++
      continue
    }
    try {
      // URL constructor checks absolute URL validity
      // eslint-disable-next-line no-new
      new URL(link)
    } catch {
      invalid++
    }
  }

  if (invalid > 0) {
    return { ok: false, message: `${invalid} internal link(s) invalid` }
  }

  return { ok: true }
}

function evaluateEditionHardRules(edition: LanguageEdition): HardRuleViolation[] {
  const violations: HardRuleViolation[] = []

  const title = edition?.content?.title ?? ''
  const lead = edition?.content?.lead ?? ''
  const full = edition?.content?.body?.full ?? ''
  const summary = edition?.content?.body?.summary ?? ''

  if (!title || title.trim().length === 0) {
    violations.push({
      rule_id: 'MISSING_TITLE',
      severity: 'CRITICAL',
      field: 'content.title',
      message: `Missing title for language ${edition.language}`,
      blocking: true
    })
  }

  if (
    typeof full === 'string' &&
    PLACEHOLDER_TOKENS.some(t => full.includes(t))
  ) {
    violations.push({
      rule_id: 'PLACEHOLDER_CONTENT',
      severity: 'CRITICAL',
      field: 'content.body.full',
      message: `Placeholder token found in body for language ${edition.language}`,
      blocking: true
    })
  }

  const effectiveWords = wordCount(full)
  const isCJK = ['zh', 'jp'].includes(String(edition.language).toLowerCase())
  const tooShort = effectiveWords < 50 && (!isCJK || full.length < 75)

  if (typeof full !== 'string' || tooShort) {
    violations.push({
      rule_id: 'NEAR_EMPTY_BODY',
      severity: 'CRITICAL',
      field: 'content.body.full',
      message: `Body too short (<50 words) for language ${edition.language}`,
      blocking: true
    })
  }

  if (!summary || typeof summary !== 'string' || summary.trim().length < 50) {
    violations.push({
      rule_id: 'MISSING_OR_SHORT_SUMMARY',
      severity: 'CRITICAL',
      field: 'content.body.summary',
      message: `Summary missing/too short for language ${edition.language}`,
      blocking: true
    })
  }

  // Structured data (schema markup)
  const schema = (edition as any)?.content?.schema
  if (!isNonEmptyObject(schema) || !schema['@type'] || typeof schema['@type'] !== 'string') {
    violations.push({
      rule_id: 'MALFORMED_SCHEMA_MARKUP',
      severity: 'CRITICAL',
      field: 'content.schema',
      message: `Structured data schema is missing/invalid for language ${edition.language}`,
      blocking: true
    })
  }

  // Internal links
  const internalLinks = (edition as any)?.content?.internalLinks
  const linkCheck = validateInternalLinks(internalLinks)
  if (!linkCheck.ok) {
    violations.push({
      rule_id: 'BROKEN_INTERNAL_LINKS',
      severity: 'CRITICAL',
      field: 'content.internalLinks',
      message: `Broken internal links for language ${edition.language}: ${linkCheck.message ?? 'invalid links'}`,
      blocking: true
    })
  }

  // Policy-critical content from audit results
  const criticalAuditIssues = edition.audit_results?.issues?.filter(i => i.severity === 'CRITICAL') ?? []
  if (criticalAuditIssues.length > 0) {
    violations.push({
      rule_id: 'POLICY_CRITICAL_AUDIT_ISSUES',
      severity: 'CRITICAL',
      field: 'audit_results.issues',
      message: `Critical audit issues present (${criticalAuditIssues.length}) for ${edition.language}`,
      blocking: true
    })
  }

  // Unresolved stale dependency
  if (edition.stale) {
    violations.push({
      rule_id: 'STALE_DEPENDENCY',
      severity: 'CRITICAL',
      field: 'stale',
      message: `Edition stale=true for language ${edition.language}`,
      blocking: true
    })
  }

  // Title/lead are required for many downstream cells
  if (!lead || typeof lead !== 'string' || lead.trim().length < 10) {
    violations.push({
      rule_id: 'LEAD_TOO_SHORT',
      severity: 'CRITICAL',
      field: 'content.lead',
      message: `Lead too short for language ${edition.language}`,
      blocking: true
    })
  }

  return violations
}

export function evaluateHardRulesForBatch(batch: BatchJob): {
  violations: HardRuleViolation[]
  hard_rule_hits: string[]
} {
  const violations: HardRuleViolation[] = []

  // Duplicate/corrupted edition state check
  const editionIds = new Set<string>()
  for (const lang of Object.keys(batch.editions) as Language[]) {
    const edition = batch.editions[lang]
    if (!edition?.id) {
      violations.push({
        rule_id: 'MALFORMED_EDITION_STATE',
        severity: 'CRITICAL',
        field: `editions.${lang}.id`,
        message: `Missing edition id for language ${lang}`,
        blocking: true
      })
      continue
    }
    if (editionIds.has(edition.id)) {
      violations.push({
        rule_id: 'DUPLICATE_EDITION_ID',
        severity: 'CRITICAL',
        field: `editions.${lang}.id`,
        message: `Duplicate edition id detected: ${edition.id}`,
        blocking: true
      })
    }
    editionIds.add(edition.id)
  }

  for (const edition of Object.values(batch.editions)) {
    violations.push(...evaluateEditionHardRules(edition))
  }

  const hard_rule_hits = Array.from(new Set(violations.map(v => v.rule_id)))

  return { violations, hard_rule_hits }
}

