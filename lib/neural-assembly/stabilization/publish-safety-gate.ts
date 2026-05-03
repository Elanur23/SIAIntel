import type { Blackboard } from '../blackboard-system'
import type { BatchJob, LanguageEdition } from '../master-orchestrator'
import { evaluateHardRulesForBatch } from './hard-rule-engine'
import type { PublishSafetyGate } from './types'
import type { Language } from '../editorial-event-bus'

function isValidUrl(maybeUrl: unknown): boolean {
  if (typeof maybeUrl !== 'string' || maybeUrl.trim().length === 0) return false
  try {
    // eslint-disable-next-line no-new
    new URL(maybeUrl)
    return true
  } catch {
    return false
  }
}

function validateHreflangSetForApproved(editions: Record<Language, LanguageEdition>, approved: Language[]): string[] {
  const reasons: string[] = []
  if (approved.length === 0) return reasons

  const required = new Set(approved)
  const baseSetCheck = (lang: Language) => {
    const edition = editions[lang]
    const hreflang = edition?.content?.hreflang_tags
    if (!hreflang || typeof hreflang !== 'object') {
      reasons.push(`hreflang_tags missing for ${lang}`)
      return
    }

    for (const needed of required) {
      const value = (hreflang as any)[needed]
      if (!isValidUrl(value)) {
        reasons.push(`hreflang_tags.${needed} invalid for ${lang}`)
      }
    }
  }

  for (const lang of approved) baseSetCheck(lang)
  return reasons
}

function validatePublishContractForEdition(edition: LanguageEdition): string[] {
  const reasons: string[] = []
  if (edition.status !== 'APPROVED') {
    reasons.push(`edition.status not APPROVED for ${edition.language}`)
  }
  // NOTE: stale check removed — single source of truth is hard-rule-engine (STALE_DEPENDENCY)
  // NOTE: schema markup check removed — single source of truth is hard-rule-engine (MALFORMED_SCHEMA_MARKUP)
  return reasons
}

export function prepareSEOForPublish(params: {
  batch: BatchJob
  approved_languages: Language[]
}): void {
  const { batch, approved_languages } = params
  const cdnBase = `https://cdn.sia-intel.com/${batch.id}`

  // Only fill when missing; do not override existing (possibly corrupted) hreflang tags.
  for (const lang of approved_languages) {
    const edition = batch.editions[lang]
    if (!edition) continue

    const hreflang = (edition as any)?.content?.hreflang_tags
    const needsFill = !hreflang || (typeof hreflang === 'object' && Object.keys(hreflang).length === 0)

    if (needsFill) {
      const dynamicHreflang: Record<string, string> = {}
      for (const target of approved_languages) {
        dynamicHreflang[target] = `${cdnBase}/${target}`
      }
      ;(edition as any).content.hreflang_tags = dynamicHreflang as any
    }

    if (!edition.content.canonical_url) {
      edition.content.canonical_url = `${cdnBase}/${lang}`
    }
  }
}

export function validatePublishSafetyGate(params: {
  batch: BatchJob
  mic_id: string
  approved_languages: Language[]
  delayed_languages: Language[]
  blocked_languages: Language[]
  blackboard?: Blackboard
  publish_version_key?: string
}): PublishSafetyGate {
  const {
    batch,
    approved_languages,
    delayed_languages,
    blocked_languages,
    blackboard,
    publish_version_key
  } = params

  const can_publish_base = approved_languages.length > 0
  const blocking_reasons: string[] = []

  if (!can_publish_base) {
    blocking_reasons.push('approved_languages empty')
  }

  // Hard rules block publish (no AI override)
  const hard = evaluateHardRulesForBatch(batch)
  if (hard.violations.length > 0) {
    blocking_reasons.push(`hard_rule_violations_present(${hard.violations.length})`)
  }

  // NOTE: stale dependency check removed — single source of truth is hard-rule-engine (STALE_DEPENDENCY)

  // No pending supervisor review (safety)
  if (batch.status === 'SUPERVISOR_REVIEW' || batch.status === 'MANUAL_REVIEW') {
    blocking_reasons.push('pending supervisor/human review')
  }

  // Duplicate publish guard (idempotency)
  if (blackboard && publish_version_key) {
    const existing = blackboard.read(`publish_guard.${publish_version_key}`)
    if (existing?.status === 'PUBLISHED') {
      // Treat as safely ignored (allowed), but don't publish again. We'll block publish action later in master-orchestrator.
      blocking_reasons.push('duplicate_publish_detected')
    }
  }

  // hreflang set validity
  blocking_reasons.push(...validateHreflangSetForApproved(batch.editions, approved_languages))

  // schema markup validity + contract validity per approved edition
  for (const lang of approved_languages) {
    const edition = batch.editions[lang]
    if (!edition) continue
    // NOTE: validateSchemaMarkup removed — single source of truth is hard-rule-engine (MALFORMED_SCHEMA_MARKUP)
    blocking_reasons.push(...validatePublishContractForEdition(edition))
  }

  // NOTE: critical audit issues check removed — single source of truth is hard-rule-engine (POLICY_CRITICAL_AUDIT_ISSUES)

  const can_publish = blocking_reasons.length === 0

  return {
    can_publish,
    blocking_reasons,
    approved_languages,
    delayed_languages,
    blocked_languages
  }
}

