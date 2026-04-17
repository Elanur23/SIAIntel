/**
 * CHIEF_EDITOR_ENGINE.TS
 * Production-Grade Chief Editor Decision Engine for Cellular Multilingual Editorial OS
 * 
 * This engine evaluates batch jobs across 9 languages using deterministic rules
 * combined with AI-assisted semantic analysis to make approval decisions.
 * 
 * Decision Factors:
 * - Cross-language semantic consistency
 * - Audit scores per language
 * - Critical/unresolved issues
 * - Stale dependencies
 * - Manual override flags
 * - Risk scores (policy, financial, geopolitical)
 * 
 * @version 1.0.0
 * @author SIA Intelligence Systems - Cellular Editorial OS
 */

import {
  Language,
  BatchJob,
  LanguageEdition,
  MasterIntelligenceCore,
  ChiefEditorDecision,
  OverallDecision,
  DecisionTrace,
  RuleCheckResult,
  SemanticAnalysisResult,
  RiskAssessmentResult,
  SurfaceGateResult,
  MultilingualIntegrityResult,
  TrustGateResult,
  TruthGateResult,
  ClaimAwareComplianceResult,
  LockedContentPackage,
  PECLDecision,
  SovereignGateResult,
  PECLGateDecision,
  PECLAuthorizationEnvelope
} from './core-types'

export type {
  Language,
  BatchJob,
  LanguageEdition,
  MasterIntelligenceCore,
  ChiefEditorDecision,
  OverallDecision,
  DecisionTrace,
  RuleCheckResult,
  SemanticAnalysisResult,
  RiskAssessmentResult,
  SurfaceGateResult,
  MultilingualIntegrityResult,
  TrustGateResult,
  TruthGateResult,
  ClaimAwareComplianceResult
}
import { CellType } from './field-dependency-engine'
import { evaluateHardRulesForBatch } from './stabilization/hard-rule-engine'
import { computeDecisionConfidence } from './stabilization/confidence-scoring'
import { DEFAULT_CONFIDENCE_CONFIG, PECL_DEPLOYMENT_MODE } from './stabilization/config'
import type { DecisionConfidence, ConfidenceBand } from './stabilization/types'
import {
  runMultilingualHeadlineIntegrityEngine,
  MultilingualHeadlineInput,
  MultilingualHeadlineResult,
} from "../sia-news/failure-engine/multilingual-headline-integrity";
import { runNarrativeDisciplineEngine } from "../sia-news/failure-engine/narrative-discipline";
import { buildEvidenceLedger } from "../sia-news/failure-engine/evidence-ledger";
import type { NarrativeInput, NarrativeResult, EvidenceLedgerResult } from "../sia-news/failure-engine/types";
import { logOperation } from "./observability";
import { generateSlug } from "../database";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getGlobalCryptoProvider, getGlobalKeyProvider, normalizePECLKeyId, canonicalizeJSON } from './stabilization/crypto-provider';
import { computeProvenanceDigests } from './stabilization/provenance-binder';

// Core types imported from core-types.ts

export interface EditionEvaluation {
  language: Language
  audit_score: number
  critical_issues: number // Count of severity === 'CRITICAL'
  high_issues: number     // Count of severity === 'HIGH'
  medium_issues: number   // Count of severity === 'MEDIUM'
  low_issues: number      // Count of severity === 'LOW'
  is_stale: boolean
  has_manual_override: boolean
  cell_scores: Record<CellType, number>
  recommendation: 'APPROVE' | 'REJECT' | 'DELAY'
  reasons: string[]
}

let localPECLRuntimeEnvHydrated = false

function hasRequiredPECLRuntimeKeyMaterial(): boolean {
  const hasSigningKeyId = !!(process.env.PECL_SIGNING_KEY_ID || '').trim()
  const hasPrivateKey = !!(process.env.PECL_PRIVATE_KEY || '').trim()
  const hasPublicKey = Object.keys(process.env).some((key) => {
    if (!key.startsWith('PECL_PUBLIC_KEY_')) {
      return false
    }
    return !!(process.env[key] || '').trim()
  })

  return hasSigningKeyId && hasPrivateKey && hasPublicKey
}

function resolveLocalPECLRuntimeEnvPaths(): string[] {
  const explicitRuntimeEnvPath = (process.env.PECL_RUNTIME_ENV_PATH || '').trim()
  if (explicitRuntimeEnvPath.length > 0) {
    return [path.resolve(explicitRuntimeEnvPath)]
  }

  const candidates = new Set<string>()
  const searchRoots = [process.cwd(), __dirname]

  for (const root of searchRoots) {
    let currentPath = path.resolve(root)
    for (let depth = 0; depth < 6; depth += 1) {
      candidates.add(path.join(currentPath, '.pecl-runtime.env'))
      const parentPath = path.dirname(currentPath)
      if (parentPath === currentPath) {
        break
      }
      currentPath = parentPath
    }
  }

  return Array.from(candidates)
}

function hydrateLocalPECLRuntimeEnvIfMissing(): void {
  if (process.env.NODE_ENV === 'production') {
    return
  }

  const hasRequiredKeyMaterial = hasRequiredPECLRuntimeKeyMaterial()
  if (localPECLRuntimeEnvHydrated && hasRequiredKeyMaterial) {
    return
  }

  if (hasRequiredKeyMaterial) {
    localPECLRuntimeEnvHydrated = true
    return
  }

  const importedKeys = new Set<string>()
  let hydratedRuntimeEnvPath: string | null = null

  const runtimeEnvPaths = resolveLocalPECLRuntimeEnvPaths()

  for (const runtimeEnvPath of runtimeEnvPaths) {
    if (!fs.existsSync(runtimeEnvPath)) {
      continue
    }

    hydratedRuntimeEnvPath = runtimeEnvPath

    const content = fs.readFileSync(runtimeEnvPath, 'utf8')
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim()
      if (!line || line.startsWith('#')) {
        continue
      }

      const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
      if (!match) {
        continue
      }

      const key = match[1]
      if (!key.startsWith('PECL_')) {
        continue
      }

      const existing = (process.env[key] || '').trim()
      if (existing.length > 0) {
        continue
      }

      let value = match[2].trim()
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1)
      }

      process.env[key] = value
      importedKeys.add(key)
    }

    if (hasRequiredPECLRuntimeKeyMaterial()) {
      break
    }
  }

  localPECLRuntimeEnvHydrated = hasRequiredPECLRuntimeKeyMaterial()

  if (importedKeys.size > 0 && hydratedRuntimeEnvPath) {
    logOperation('CHIEF_EDITOR', 'key_loading.runtime_env_hydrated', 'INFO', 'Hydrated local PECL runtime env for signing path', {
      metadata: {
        runtime_env_path: hydratedRuntimeEnvPath,
        imported_keys: Array.from(importedKeys)
      }
    })
  }
}

// ============================================================================
// CONFIGURATION & THRESHOLDS
// ============================================================================

export interface ChiefEditorConfig {
  // Audit score thresholds
  min_audit_score_approve: number          // Default: 75
  min_audit_score_partial: number          // Default: 60
  
  // Issue thresholds
  max_critical_issues: number              // Default: 0
  max_high_issues: number                  // Default: 2
  
  // Semantic consistency
  semantic_drift_threshold: number         // Default: 0.25 (25%)
  min_consistency_score: number            // Default: 70
  
  // Risk thresholds
  max_overall_risk_score: number           // Default: 70
  max_policy_risk: number                  // Default: 80
  max_geopolitical_risk: number            // Default: 75
  max_financial_risk: number               // Default: 80
  max_legal_risk: number                   // Default: 75

  // Partial approval
  min_languages_for_partial: number        // Default: 5 (out of 9)
  
  // Confidence
  min_confidence_for_auto_approve: number  // Default: 85
}

export const DEFAULT_CHIEF_EDITOR_CONFIG: ChiefEditorConfig = {
  min_audit_score_approve: 75,
  min_audit_score_partial: 60,
  max_critical_issues: 0,
  max_high_issues: 2,
  semantic_drift_threshold: 0.25,
  min_consistency_score: 70,
  max_overall_risk_score: 70,
  max_policy_risk: 80,
  max_geopolitical_risk: 75,
  max_financial_risk: 80,
  max_legal_risk: 75,
  min_languages_for_partial: 5,
  min_confidence_for_auto_approve: 85
}

// ============================================================================
// DETERMINISTIC RULE ENGINE
// ============================================================================

export class DeterministicRuleEngine {
  private config: ChiefEditorConfig
  
  constructor(config: ChiefEditorConfig = DEFAULT_CHIEF_EDITOR_CONFIG) {
    this.config = config
  }
  
  /**
   * Rule 1: Check for critical issues
   * If ANY language has critical issues → CANNOT APPROVE_ALL
   */
  checkCriticalIssues(evaluations: EditionEvaluation[]): RuleCheckResult {
    const affected: Language[] = []
    let totalCritical = 0
    
    for (const evaluation of evaluations) {
      if (evaluation.critical_issues > this.config.max_critical_issues) {
        affected.push(evaluation.language)
        totalCritical += evaluation.critical_issues
      }
    }
    
    return {
      rule_name: 'CRITICAL_ISSUES_CHECK',
      passed: affected.length === 0,
      severity: 'CRITICAL',
      affected_languages: affected,
      details: affected.length > 0
        ? `${affected.length} language(s) have ${totalCritical} critical issue(s): ${affected.join(', ')}`
        : 'No critical issues detected',
      timestamp: Date.now()
    }
  }
  
  /**
   * Rule 2: Check audit scores
   * If 2+ languages fail audit → REJECT
   * If 1-2 languages fail → APPROVE_PARTIAL
   */
  checkAuditScores(evaluations: EditionEvaluation[]): RuleCheckResult {
    const failed: Language[] = []
    
    for (const evaluation of evaluations) {
      if (evaluation.audit_score < this.config.min_audit_score_approve) {
        failed.push(evaluation.language)
      }
    }
    
    const severity = failed.length >= 2 ? 'CRITICAL' : failed.length === 1 ? 'HIGH' : 'LOW'
    
    return {
      rule_name: 'AUDIT_SCORE_CHECK',
      passed: failed.length === 0,
      severity,
      affected_languages: failed,
      details: failed.length > 0
        ? `${failed.length} language(s) below audit threshold (${this.config.min_audit_score_approve}): ${failed.join(', ')}`
        : 'All languages meet audit score threshold',
      timestamp: Date.now()
    }
  }
  
  /**
   * Rule 3: Check for stale dependencies
   * Stale editions must be delayed for regeneration
   */
  checkStaleDependencies(evaluations: EditionEvaluation[]): RuleCheckResult {
    const stale: Language[] = []
    
    for (const evaluation of evaluations) {
      if (evaluation.is_stale) {
        stale.push(evaluation.language)
      }
    }
    
    return {
      rule_name: 'STALE_DEPENDENCY_CHECK',
      passed: stale.length === 0,
      severity: 'HIGH',
      affected_languages: stale,
      details: stale.length > 0
        ? `${stale.length} language(s) have stale dependencies: ${stale.join(', ')}`
        : 'No stale dependencies detected',
      timestamp: Date.now()
    }
  }
  
  /**
   * Rule 4: Check manual override flags
   * Manual overrides bypass normal checks but must be logged
   */
  checkManualOverrides(evaluations: EditionEvaluation[]): RuleCheckResult {
    const overridden: Language[] = []
    
    for (const evaluation of evaluations) {
      if (evaluation.has_manual_override) {
        overridden.push(evaluation.language)
      }
    }
    
    return {
      rule_name: 'MANUAL_OVERRIDE_CHECK',
      passed: true,  // Always passes, just informational
      severity: 'MEDIUM',
      affected_languages: overridden,
      details: overridden.length > 0
        ? `${overridden.length} language(s) have manual overrides: ${overridden.join(', ')}`
        : 'No manual overrides',
      timestamp: Date.now()
    }
  }
  
  /**
   * Rule 5: Check minimum languages for partial approval
   * Need at least N languages approved for partial publish
   */
  checkMinimumLanguages(approvedCount: number): RuleCheckResult {
    const passed = approvedCount >= this.config.min_languages_for_partial
    
    return {
      rule_name: 'MINIMUM_LANGUAGES_CHECK',
      passed,
      severity: 'HIGH',
      affected_languages: [],
      details: passed
        ? `${approvedCount} languages approved (minimum: ${this.config.min_languages_for_partial})`
        : `Only ${approvedCount} languages approved, need ${this.config.min_languages_for_partial}`,
      timestamp: Date.now()
    }
  }
  
  /**
   * Runs all deterministic rules
   */
  runAllRules(evaluations: EditionEvaluation[], approvedCount: number): RuleCheckResult[] {
    return [
      this.checkCriticalIssues(evaluations),
      this.checkAuditScores(evaluations),
      this.checkStaleDependencies(evaluations),
      this.checkManualOverrides(evaluations),
      this.checkMinimumLanguages(approvedCount)
    ]
  }
}

// ============================================================================
// SEMANTIC CONSISTENCY ANALYZER
// ============================================================================

export class SemanticConsistencyAnalyzer {
  private config: ChiefEditorConfig
  
  constructor(config: ChiefEditorConfig = DEFAULT_CHIEF_EDITOR_CONFIG) {
    this.config = config
  }
  
  /**
   * Analyzes cross-language semantic consistency
   * This is a placeholder for AI-assisted analysis (Phase 4)
   */
  async analyzeConsistency(
    editions: Record<Language, LanguageEdition>,
    mic: MasterIntelligenceCore
  ): Promise<SemanticAnalysisResult> {
    const inconsistencies: Array<{
      language_pair: [Language, Language]
      field: string
      drift_score: number
      description: string
    }> = []
    
    // Compare key language pairs
    const keyPairs: Array<[Language, Language]> = [
      ['en', 'tr'],
      ['en', 'de'],
      ['en', 'fr'],
      ['en', 'es'],
      ['en', 'ru'],
      ['en', 'ar'],
      ['en', 'jp'],
      ['en', 'zh']
    ]
    
    for (const [lang1, lang2] of keyPairs) {
      const edition1 = editions[lang1]
      const edition2 = editions[lang2]
      
      if (!edition1 || !edition2) continue
      
      // Check title consistency
      const titleDrift = this.calculateTitleDrift(edition1, edition2, mic)
      if (titleDrift > this.config.semantic_drift_threshold) {
        inconsistencies.push({
          language_pair: [lang1, lang2],
          field: 'title',
          drift_score: titleDrift,
          description: `Title semantic drift detected: ${(titleDrift * 100).toFixed(1)}%`
        })
      }
      
      // Check lead consistency
      const leadDrift = this.calculateLeadDrift(edition1, edition2, mic)
      if (leadDrift > this.config.semantic_drift_threshold) {
        inconsistencies.push({
          language_pair: [lang1, lang2],
          field: 'lead',
          drift_score: leadDrift,
          description: `Lead paragraph semantic drift detected: ${(leadDrift * 100).toFixed(1)}%`
        })
      }
    }
    
    const consistency_score = this.calculateOverallConsistency(inconsistencies)
    const drift_detected = inconsistencies.length > 0
    
    return {
      consistency_score,
      drift_detected,
      drift_threshold: this.config.semantic_drift_threshold,
      inconsistencies,
      ai_confidence: 0.85  // Placeholder for AI confidence
    }
  }
  
  /**
   * Calculates title drift between two editions
   * Returns 0.0 (identical) to 1.0 (completely different)
   */
  private calculateTitleDrift(
    edition1: LanguageEdition,
    edition2: LanguageEdition,
    mic: MasterIntelligenceCore
  ): number {
    // Defensive: ensure content and title exist
    const title1 = edition1?.content?.title?.toLowerCase() ?? '';
    const title2 = edition2?.content?.title?.toLowerCase() ?? '';
    
    if (!title1 || !title2) {
      return 1.0; // Maximum drift if either title is missing
    }
    
    // Check if core facts are mentioned
    const coreFacts = mic.truth_nucleus.facts.map(f => f.statement.toLowerCase())
    
    let title1FactCount = 0
    let title2FactCount = 0
    
    for (const fact of coreFacts) {
      const factWords = fact.split(' ').filter(w => w.length > 3)
      for (const word of factWords) {
        if (title1.includes(word)) title1FactCount++
        if (title2.includes(word)) title2FactCount++
      }
    }
    
    // If both titles mention similar number of facts, drift is low
    const factDiff = Math.abs(title1FactCount - title2FactCount)
    const maxFacts = Math.max(title1FactCount, title2FactCount, 1)
    
    return factDiff / maxFacts
  }
  
  /**
   * Calculates lead drift between two editions
   */
  private calculateLeadDrift(
    edition1: LanguageEdition,
    edition2: LanguageEdition,
    mic: MasterIntelligenceCore
  ): number {
    // Defensive: ensure content and lead exist
    const lead1 = edition1?.content?.lead?.toLowerCase() ?? '';
    const lead2 = edition2?.content?.lead?.toLowerCase() ?? '';
    
    if (!lead1 || !lead2) {
      return 1.0; // Maximum drift if either lead is missing
    }
    
    // Check entity coverage
    const entities = mic.structural_atoms.key_entities.map(e => e.toLowerCase())
    
    let lead1EntityCount = 0
    let lead2EntityCount = 0
    
    for (const entity of entities) {
      if (lead1.includes(entity)) lead1EntityCount++
      if (lead2.includes(entity)) lead2EntityCount++
    }
    
    const entityDiff = Math.abs(lead1EntityCount - lead2EntityCount)
    const maxEntities = Math.max(lead1EntityCount, lead2EntityCount, 1)
    
    return entityDiff / maxEntities
  }
  
  /**
   * Calculates overall consistency score
   */
  private calculateOverallConsistency(
    inconsistencies: Array<{ drift_score: number }>
  ): number {
    if (inconsistencies.length === 0) return 100
    
    const avgDrift = inconsistencies.reduce((sum, inc) => sum + inc.drift_score, 0) / inconsistencies.length
    return Math.max(0, 100 - (avgDrift * 100))
  }
}

// ============================================================================
// RISK ASSESSMENT ENGINE
// ============================================================================

export class RiskAssessmentEngine {
  private config: ChiefEditorConfig
  
  constructor(config: ChiefEditorConfig = DEFAULT_CHIEF_EDITOR_CONFIG) {
    this.config = config
  }
  
  /**
   * Assesses overall risk across all dimensions
   */
  async assessRisk(
    editions: Record<Language, LanguageEdition>,
    mic: MasterIntelligenceCore
  ): Promise<RiskAssessmentResult> {
    const risk_factors: Array<{
      type: 'policy' | 'financial' | 'geopolitical' | 'legal' | 'brand_safety'
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      description: string
      affected_languages: Language[]
    }> = []
    
    // Policy risk assessment
    const policy_risk = this.assessPolicyRisk(editions, mic, risk_factors)
    
    // Financial risk assessment
    const financial_risk = this.assessFinancialRisk(editions, mic, risk_factors)
    
    // Geopolitical risk assessment
    const geopolitical_risk = this.assessGeopoliticalRisk(editions, mic, risk_factors)
    
    // Legal risk assessment
    const legal_risk = this.assessLegalRisk(editions, mic, risk_factors)
    
    // Brand safety risk assessment
    const brand_safety_risk = this.assessBrandSafetyRisk(editions, mic, risk_factors)
    
    // Calculate overall risk score (weighted average)
    const overall_risk_score = (
      policy_risk * 0.25 +
      financial_risk * 0.15 +
      geopolitical_risk * 0.25 +
      legal_risk * 0.20 +
      brand_safety_risk * 0.15
    )
    
    return {
      overall_risk_score,
      policy_risk,
      financial_risk,
      geopolitical_risk,
      legal_risk,
      brand_safety_risk,
      risk_factors
    }
  }
  
  /**
   * Assesses policy compliance risk
   */
  private assessPolicyRisk(
    editions: Record<Language, LanguageEdition>,
    mic: MasterIntelligenceCore,
    risk_factors: any[]
  ): number {
    let risk_score = 0
    const affected: Language[] = []
    
    for (const [lang, edition] of Object.entries(editions) as Array<[Language, LanguageEdition]>) {
      // Defensive: ensure audit_results and issues exist
      const issues = edition?.audit_results?.issues ?? [];
      
      // Check for policy violations in audit results
      const policyIssues = issues.filter(
        issue => issue.cell === 'policy_cell' && issue.severity === 'HIGH'
      )
      
      if (policyIssues.length > 0) {
        risk_score += 20 * policyIssues.length
        affected.push(lang)
      }
    }
    
    if (affected.length > 0) {
      risk_factors.push({
        type: 'policy',
        severity: risk_score > 50 ? 'HIGH' : 'MEDIUM',
        description: `Policy compliance issues detected in ${affected.length} language(s)`,
        affected_languages: affected
      })
    }
    
    return Math.min(100, risk_score)
  }
  
  /**
   * Assesses financial content risk
   */
  private assessFinancialRisk(
    editions: Record<Language, LanguageEdition>,
    mic: MasterIntelligenceCore,
    risk_factors: any[]
  ): number {
    let risk_score = 0
    
    // Check if content contains financial advice or predictions
    const category = mic.metadata.category.toLowerCase()
    const isFinancial = category.includes('finance') || 
                       category.includes('investment') || 
                       category.includes('trading')
    
    if (isFinancial) {
      risk_score += 30
      
      // Check for unverified claims
      const unverifiedClaims = mic.truth_nucleus.claims.filter(
        claim => claim.verification_status === 'unverified'
      )
      
      if (unverifiedClaims.length > 0) {
        risk_score += 20 * unverifiedClaims.length
        
        risk_factors.push({
          type: 'financial',
          severity: 'HIGH',
          description: `${unverifiedClaims.length} unverified financial claim(s)`,
          affected_languages: Object.keys(editions) as Language[]
        })
      }
    }
    
    return Math.min(100, risk_score)
  }
  
  /**
   * Assesses geopolitical sensitivity risk
   */
  private assessGeopoliticalRisk(
    editions: Record<Language, LanguageEdition>,
    mic: MasterIntelligenceCore,
    risk_factors: any[]
  ): number {
    let risk_score = 0
    
    // Check geopolitical context
    const geoContext = mic.truth_nucleus.geopolitical_context.toLowerCase()
    
    const sensitiveKeywords = [
      'conflict', 'war', 'sanctions', 'diplomatic', 'sovereignty',
      'territorial', 'military', 'nuclear', 'regime', 'coup'
    ]
    
    let sensitiveCount = 0
    for (const keyword of sensitiveKeywords) {
      if (geoContext.includes(keyword)) {
        sensitiveCount++
      }
    }
    
    if (sensitiveCount > 0) {
      risk_score = Math.min(100, sensitiveCount * 15)
      
      risk_factors.push({
        type: 'geopolitical',
        severity: sensitiveCount >= 3 ? 'HIGH' : 'MEDIUM',
        description: `Geopolitically sensitive content detected (${sensitiveCount} indicators)`,
        affected_languages: Object.keys(editions) as Language[]
      })
    }
    
    return risk_score
  }
  
  /**
   * Assesses legal compliance risk
   */
  private assessLegalRisk(
    editions: Record<Language, LanguageEdition>,
    mic: MasterIntelligenceCore,
    risk_factors: any[]
  ): number {
    let risk_score = 0
    const affected: Language[] = []
    
    for (const [lang, edition] of Object.entries(editions) as Array<[Language, LanguageEdition]>) {
      // Check for disputed claims
      const disputedClaims = mic.truth_nucleus.claims.filter(
        claim => claim.verification_status === 'disputed'
      )
      
      if (disputedClaims.length > 0) {
        risk_score += 25 * disputedClaims.length
        affected.push(lang)
      }
    }
    
    if (affected.length > 0) {
      risk_factors.push({
        type: 'legal',
        severity: risk_score > 50 ? 'HIGH' : 'MEDIUM',
        description: `Disputed claims present legal risk`,
        affected_languages: affected
      })
    }
    
    return Math.min(100, risk_score)
  }
  
  /**
   * Assesses brand safety risk
   */
  private assessBrandSafetyRisk(
    editions: Record<Language, LanguageEdition>,
    mic: MasterIntelligenceCore,
    risk_factors: any[]
  ): number {
    let risk_score = 0
    const affected: Language[] = []
    
    for (const [lang, edition] of Object.entries(editions) as Array<[Language, LanguageEdition]>) {
      // Defensive: ensure audit_results and issues exist
      const issues = edition?.audit_results?.issues ?? [];
      
      // Check tone issues
      const toneIssues = issues.filter(
        issue => issue.cell === 'tone_cell' && issue.severity === 'HIGH'
      )
      
      if (toneIssues.length > 0) {
        risk_score += 15 * toneIssues.length
        affected.push(lang)
      }
    }
    
    if (affected.length > 0) {
      risk_factors.push({
        type: 'brand_safety',
        severity: risk_score > 40 ? 'HIGH' : 'MEDIUM',
        description: `Brand safety concerns in ${affected.length} language(s)`,
        affected_languages: affected
      })
    }
    
    return Math.min(100, risk_score)
  }
}

// ============================================================================
// EDITION EVALUATOR
// ============================================================================

export class EditionEvaluator {
  private config: ChiefEditorConfig
  
  constructor(config: ChiefEditorConfig = DEFAULT_CHIEF_EDITOR_CONFIG) {
    this.config = config
  }
  
  /**
   * Evaluates a single language edition
   */
  evaluateEdition(edition: LanguageEdition): EditionEvaluation {
    // Defensive: ensure audit_results and issues exist
    const issues = edition.audit_results?.issues ?? []
    const critical_issues = issues.filter(i => i.severity === 'CRITICAL').length
    const high_issues = issues.filter(i => i.severity === 'HIGH').length
    const medium_issues = issues.filter(i => i.severity === 'MEDIUM').length
    const low_issues = issues.filter(i => i.severity === 'LOW').length
    
    const reasons: string[] = []
    let recommendation: 'APPROVE' | 'REJECT' | 'DELAY' = 'APPROVE'
    
    // Manual override bypasses all checks (check first)
    // Defensive: ensure healing_history exists
    const has_manual_override = (edition.healing_history ?? []).some(
      h => h.cell === 'manual_override' as any
    )
    
    if (has_manual_override) {
      reasons.push('Manual override applied - auto-approved')
      return {
        language: edition.language,
        audit_score: edition.audit_results?.overall_score ?? 0,
        critical_issues,
        high_issues,
        medium_issues,
        low_issues,
        is_stale: edition.stale,
        has_manual_override,
        cell_scores: edition.audit_results?.cell_scores ?? {},
        recommendation: 'APPROVE',
        reasons
      }
    }
    
    // Check critical issues (highest priority)
    if (critical_issues > this.config.max_critical_issues) {
      recommendation = 'REJECT'
      reasons.push(`${critical_issues} critical issue(s) detected`)
    }
    
    // Check audit score
    const overall_score = edition.audit_results?.overall_score ?? 0
    if (recommendation !== 'REJECT' && overall_score < this.config.min_audit_score_approve) {
      if (overall_score < this.config.min_audit_score_partial) {
        recommendation = 'REJECT'
        reasons.push(`Audit score ${overall_score} below minimum (${this.config.min_audit_score_partial})`)
      } else {
        recommendation = 'DELAY'
        reasons.push(`Audit score ${overall_score} below approval threshold (${this.config.min_audit_score_approve})`)
      }
    }
    
    // Check stale status (delays even if audit score is good)
    if (recommendation !== 'REJECT' && edition.stale) {
      recommendation = 'DELAY'
      reasons.push('Edition is stale - requires regeneration')
    }
    
    // Check status
    if (recommendation !== 'REJECT' && edition.status === 'MANUAL_QUEUE') {
      recommendation = 'DELAY'
      reasons.push('Edition in manual review queue')
    }
    
    return {
      language: edition.language,
      audit_score: overall_score,
      critical_issues,
      high_issues,
      medium_issues,
      low_issues,
      is_stale: edition.stale,
      has_manual_override,
      cell_scores: edition.audit_results?.cell_scores ?? {},
      recommendation,
      reasons
    }
  }
  
  /**
   * Evaluates all editions in a batch
   */
  evaluateAllEditions(batch: BatchJob): EditionEvaluation[] {
    const evaluations: EditionEvaluation[] = []
    
    for (const edition of Object.values(batch.editions)) {
      evaluations.push(this.evaluateEdition(edition))
    }
    
    return evaluations
  }
}

// ============================================================================
// CHIEF EDITOR DECISION ENGINE
// ============================================================================

export class ChiefEditorEngine {
  private config: ChiefEditorConfig
  private ruleEngine: DeterministicRuleEngine
  private semanticAnalyzer: SemanticConsistencyAnalyzer
  private riskAssessor: RiskAssessmentEngine
  private evaluator: EditionEvaluator
  
  constructor(config: ChiefEditorConfig = DEFAULT_CHIEF_EDITOR_CONFIG) {
    this.config = config
    this.ruleEngine = new DeterministicRuleEngine(config)
    this.semanticAnalyzer = new SemanticConsistencyAnalyzer(config)
    this.riskAssessor = new RiskAssessmentEngine(config)
    this.evaluator = new EditionEvaluator(config)
  }
  
  /**
   * Main decision method - evaluates batch and returns decision
   */
  async makeDecision(
    batch: BatchJob,
    mic: MasterIntelligenceCore
  ): Promise<ChiefEditorDecision> {
    const timestamp = Date.now()
    const trace_id = `trace-${batch.id}-chief-${timestamp}`

    console.log(`[CHIEF_EDITOR] Starting evaluation for batch ${batch.id} [MODE: ${PECL_DEPLOYMENT_MODE}]`)
    
    // Step 0: Compute Real Provenance Digests (L6-BLK-002 & L6-BLK-003)
    const provenanceDigests = computeProvenanceDigests(mic);
    console.log(`[CHIEF_EDITOR] Provenance digests computed: claimGraph=${provenanceDigests.claimGraphDigest.substring(0, 16)}..., evidenceLedger=${provenanceDigests.evidenceLedgerDigest.substring(0, 16)}...`);
    
    // Step 0.5: Manifest Lock & Hashing (PECS V7.0 Requirement)
    // SURGICAL NULL-SAFETY PATCH: Filter to only include editions with complete content to prevent undefined access errors
    const contentReadyEditions = Object.entries(batch.editions).filter(([, e]) =>
      e?.content?.title &&
      e?.content?.lead &&
      e?.content?.body?.full &&
      e?.content?.body?.summary
    );

    // Log excluded editions for observability
    const excludedLanguages = Object.keys(batch.editions).filter(
      lang => !contentReadyEditions.some(([l]) => l === lang)
    );
    if (excludedLanguages.length > 0) {
      console.warn(`[CHIEF_EDITOR] Excluding ${excludedLanguages.length} incomplete edition(s) from manifest: ${excludedLanguages.join(', ')}`);
    }

    if (contentReadyEditions.length === 0) {
      throw new Error("CHIEF_EDITOR_NO_CONTENT_READY_EDITIONS");
    }

    // Build sanitized editions map for downstream use (only content-ready editions)
    const sanitizedEditions = Object.fromEntries(contentReadyEditions) as Record<Language, LanguageEdition>;

    const locked_package: LockedContentPackage = {
      payload_id: batch.id,
      manifest_id: crypto.randomUUID(),
      manifest_version: "1.0.0",
      timestamp: new Date(timestamp).toISOString(),
      base_language: "en",
      // Keep all expected languages for manifest integrity
      expected_languages: Object.keys(batch.editions),
      content: {
        // Only include content-ready editions in the actual content maps
        headlines: Object.fromEntries(contentReadyEditions.map(([l, e]) => [l, e.content.title])),
        slugs: Object.fromEntries(contentReadyEditions.map(([l, e]) => [
          l,
          e.content.canonical_url?.split('/').pop() || generateSlug(e.content.title)
        ])),
        leads: Object.fromEntries(contentReadyEditions.map(([l, e]) => [l, e.content.lead])),
        bodies: Object.fromEntries(contentReadyEditions.map(([l, e]) => [l, e.content.body.full])),
        summaries: Object.fromEntries(contentReadyEditions.map(([l, e]) => [l, e.content.body.summary])),
      },
      intelligence: {
        claim_graph_hash: provenanceDigests.claimGraphDigest,
        evidence_ledger_ref: provenanceDigests.evidenceLedgerDigest,
        trust_score_upstream: 80, // Placeholder from generation
      },
      metadata: {
        topic_sensitivity: mic.metadata.urgency === "breaking" ? "CRITICAL" : "STANDARD",
        category: mic.metadata.category,
        urgency: mic.metadata.urgency === "breaking" ? "BREAKING" : "STANDARD",
      }
    };

    const manifest_hash = crypto.createHash('sha256').update(canonicalizeJSON(locked_package)).digest('hex');

    // Step 1: Evaluate all editions (use sanitized map to prevent undefined access)
    const evaluations = this.evaluator.evaluateAllEditions({ ...batch, editions: sanitizedEditions })
    
    // Step 2: Categorize editions
    const approved: Language[] = []
    const rejected: Language[] = []
    const delayed: Language[] = []
    
    for (const evaluation of evaluations) {
      if (evaluation.recommendation === 'APPROVE') {
        approved.push(evaluation.language)
      } else if (evaluation.recommendation === 'REJECT') {
        rejected.push(evaluation.language)
      } else {
        delayed.push(evaluation.language)
      }
    }
    
    console.log(`[CHIEF_EDITOR] Initial categorization: ${approved.length} approved, ${rejected.length} rejected, ${delayed.length} delayed`)
    
    // Step 3: Run deterministic rules
    const rule_checks = this.ruleEngine.runAllRules(evaluations, approved.length)
    
    // Step 4: Run semantic analysis (use sanitized map)
    let semantic_analysis: SemanticAnalysisResult | null = null
    try {
      semantic_analysis = await this.semanticAnalyzer.analyzeConsistency(sanitizedEditions, mic)
      console.log(`[CHIEF_EDITOR] Semantic consistency score: ${semantic_analysis.consistency_score}`)
    } catch (error) {
      console.error('[CHIEF_EDITOR] Semantic analysis failed:', error)
    }
    
    // Step 5: Run risk assessment (use sanitized map)
    const risk_assessment = await this.riskAssessor.assessRisk(sanitizedEditions, mic)
    console.log(`[CHIEF_EDITOR] Overall risk score: ${risk_assessment.overall_risk_score}`)

    // Step 6: Hard rule safety scan (must not be overrideable)
    const hard_rules = evaluateHardRulesForBatch(batch)

    // Step 7: Multilingual Headline Integrity Check (HARD-LOCK SURGICAL INTEGRATION)
    // Use sanitized editions to prevent undefined access
    const multilingual_input: MultilingualHeadlineInput = {
      base_language: "en",
      expected_languages: Object.keys(batch.editions) as Language[],
      sensitive_topic: mic.metadata.urgency === "breaking" || risk_assessment.overall_risk_score > 60,
      variants: evaluations.map((ev) => {
        const edition = sanitizedEditions[ev.language];
        // Defensive: edition should exist in sanitizedEditions, but guard anyway
        const issues = edition?.audit_results?.issues ?? [];

        return {
          language: ev.language,
          headline_intensity_score: ev.cell_scores["tone_cell"] || 70,
          certainty_language_detected: issues.some(
            (i) => i.cell === "tone_cell" && /certainty|absolute|guarantee/i.test(i.description)
          ),
          clickbait_detected: issues.some(
            (i) => i.cell === "tone_cell" && /clickbait|sensational|exaggerate/i.test(i.description)
          ),
          emotional_language_detected: issues.some(
            (i) => i.cell === "tone_cell" && /emotional|outrage|shocking/i.test(i.description)
          ),
          thesis_alignment_passed: !issues.some(
            (i) => i.cell === "title_cell" && /thesis|alignment|mismatch/i.test(i.description)
          ),
          confidence_signal_present: !issues.some(
            (i) => i.cell === "tone_cell" && /confidence|signal|missing/i.test(i.description)
          ),
          discover_safety_passed: !issues.some((i) => i.cell === "discover_cell"),
          has_core_entity_preservation: !issues.some(
            (i) => i.cell === "schema_cell" && /entity|missing|identity/i.test(i.description)
          ),
          has_numeric_consistency: !issues.some(
            (i) => i.cell === "fact_check_cell" && /numeric|number|stat|figure/i.test(i.description)
          ),
        };
      }),
    };

    const multilingual_result = runMultilingualHeadlineIntegrityEngine(multilingual_input);

    logOperation("CHIEF_EDITOR", "MULTILINGUAL_HEADLINE_GATE_EXECUTED", "INFO", `Multilingual headline gate executed: ${multilingual_result.decision}`, {
      batch_id: batch.id,
      status: multilingual_result.decision,
      metadata: {
        multilingual_headline_decision: multilingual_result.decision,
        multilingual_headline_severity: multilingual_result.severity,
        multilingual_headline_risk_count: multilingual_result.risk_reasons.length,
        multilingual_headline_risk_reasons: multilingual_result.risk_reasons,
        multilingual_headline_publish_allowed: multilingual_result.publish_allowed,
      },
    });

    // Step 7.5: Evidence Ledger Safety Evaluation (Editorial Backbone Consolidation)
    const evidence_ledger_result = this.evaluateEvidenceLedgerSafety(batch, mic);
    const evidence_gate_decision = this.mapEvidenceLedgerToGateDecision(evidence_ledger_result);
    logOperation("CHIEF_EDITOR", "EVIDENCE_LEDGER_GATE_EXECUTED", "INFO", `Evidence ledger gate executed: ${evidence_gate_decision}`, {
      batch_id: batch.id,
      status: evidence_gate_decision,
      metadata: {
        ledger_safe: evidence_ledger_result.ledger_safe,
        uncovered_claims: evidence_ledger_result.uncovered_claims.length,
        weak_evidence_records: evidence_ledger_result.weak_evidence_records,
        missing_evidence_records: evidence_ledger_result.missing_evidence_records,
        duplicate_evidence_records: evidence_ledger_result.duplicate_evidence_records,
        incomplete_evidence_records: evidence_ledger_result.incomplete_evidence_records,
      },
    });

    const narrative_input = this.buildNarrativeInput(
      batch,
      mic,
      evaluations,
      semantic_analysis,
      evidence_ledger_result,
      sanitizedEditions
    );
    const narrative_result = runNarrativeDisciplineEngine(narrative_input);
    const narrative_gate_decision = this.mapNarrativeToGateDecision(narrative_result);

    logOperation("CHIEF_EDITOR", "NARRATIVE_DISCIPLINE_GATE_EXECUTED", "INFO", `Narrative discipline gate executed: ${narrative_result.narrative_decision}`, {
      batch_id: batch.id,
      status: narrative_gate_decision,
      metadata: {
        narrative_decision: narrative_result.narrative_decision,
        narrative_severity: narrative_result.narrative_severity,
        narrative_risk_count: narrative_result.narrative_risk_reasons.length,
        narrative_risk_reasons: narrative_result.narrative_risk_reasons,
        publish_allowed: narrative_result.publish_allowed,
      },
    });

    const truth_gate_result = this.evaluateTruthGate(
      mic,
      evidence_ledger_result,
      provenanceDigests
    );

    logOperation("CHIEF_EDITOR", "TRUTH_GATE_EXECUTED", "INFO", `Truth gate executed: ${truth_gate_result.gate_decision}`, {
      batch_id: batch.id,
      status: truth_gate_result.gate_decision,
      metadata: {
        truth_classification: truth_gate_result.critical_truth_outcome,
        reason_codes: truth_gate_result.reason_codes,
        truth_markers: truth_gate_result.truth_markers,
        provenance_binding: truth_gate_result.provenance_binding,
      },
    });

    const claim_aware_compliance_result = this.evaluateClaimAwareComplianceGate(
      mic,
      risk_assessment,
      evidence_ledger_result,
      provenanceDigests
    );

    logOperation("CHIEF_EDITOR", "CLAIM_AWARE_COMPLIANCE_GATE_EXECUTED", "INFO", `Claim-aware compliance gate executed: ${claim_aware_compliance_result.gate_decision}`, {
      batch_id: batch.id,
      status: claim_aware_compliance_result.gate_decision,
      metadata: {
        reason_codes: claim_aware_compliance_result.reason_codes,
        claim_metrics: claim_aware_compliance_result.claim_metrics,
        provenance: claim_aware_compliance_result.provenance,
        compliance_surface: claim_aware_compliance_result.compliance_surface,
      },
    });

    const trust_gate_authorization_result = this.evaluateTrustGateAuthorization(
      narrative_result,
      evidence_ledger_result,
      truth_gate_result,
      claim_aware_compliance_result
    );

    logOperation("CHIEF_EDITOR", "TRUST_GATE_AUTHORIZATION_EXECUTED", "INFO", `Trust gate authorization executed: ${trust_gate_authorization_result.trust_verdict}`, {
      batch_id: batch.id,
      status: trust_gate_authorization_result.gate_decision,
      metadata: {
        trust_verdict: trust_gate_authorization_result.trust_verdict,
        reason_codes: trust_gate_authorization_result.reason_codes,
        fail_closed: trust_gate_authorization_result.fail_closed,
        contributing_signals: trust_gate_authorization_result.contributing_signals,
      },
    });

    const surface_compliance_result = this.evaluateSurfaceComplianceGate(
      sanitizedEditions,
      mic,
      trust_gate_authorization_result,
      truth_gate_result,
      claim_aware_compliance_result
    );

    logOperation("CHIEF_EDITOR", "SURFACE_COMPLIANCE_GATE_EXECUTED", "INFO", `Surface compliance gate executed: ${surface_compliance_result.surface_verdict}`, {
      batch_id: batch.id,
      status: surface_compliance_result.gate_decision,
      metadata: {
        surface_verdict: surface_compliance_result.surface_verdict,
        reason_codes: surface_compliance_result.reason_codes,
        base_language: surface_compliance_result.base_language,
        fail_closed: surface_compliance_result.fail_closed,
        contributing_surface_fields: surface_compliance_result.contributing_surface_fields,
        trust_binding: surface_compliance_result.trust_binding,
      },
    });

    const multilingual_integrity_en_tr_result = this.evaluateEnTrMultilingualIntegrityGate(
      sanitizedEditions,
      trust_gate_authorization_result,
      truth_gate_result,
      surface_compliance_result
    );

    logOperation("CHIEF_EDITOR", "MULTILINGUAL_INTEGRITY_EN_TR_GATE_EXECUTED", "INFO", `Multilingual integrity EN->TR gate executed: ${multilingual_integrity_en_tr_result.multilingual_verdict}`, {
      batch_id: batch.id,
      status: multilingual_integrity_en_tr_result.gate_decision,
      metadata: {
        source_language: multilingual_integrity_en_tr_result.source_language,
        target_language: multilingual_integrity_en_tr_result.target_language,
        multilingual_verdict: multilingual_integrity_en_tr_result.multilingual_verdict,
        reason_codes: multilingual_integrity_en_tr_result.reason_codes,
        fail_closed: multilingual_integrity_en_tr_result.fail_closed,
        checked_surfaces: multilingual_integrity_en_tr_result.checked_surfaces,
      },
    });

    // Step 8: Confidence scoring for stabilization thresholds
    const criticalIssueCount = evaluations.reduce((sum, e) => sum + (e.critical_issues > 0 ? 1 : 0), 0)
    const highIssueCount = evaluations.reduce((sum, e) => sum + e.high_issues, 0)
    const staleCount = evaluations.reduce((sum, e) => sum + (e.is_stale ? 1 : 0), 0)
    const deterministicRuleCriticalFailures = rule_checks.filter(r => !r.passed && r.severity === 'CRITICAL').length
    const deterministicRuleHighFailures = rule_checks.filter(r => !r.passed && r.severity === 'HIGH').length

    const batchScore = evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.audit_score, 0) / evaluations.length
      : 0

    const confidence = computeDecisionConfidence({
      batchScore,
      criticalIssueCount,
      highIssueCount,
      semanticConsistencyScore: semantic_analysis?.consistency_score ?? 50,
      semanticAiConfidence: semantic_analysis?.ai_confidence,
      riskOverallScore: risk_assessment.overall_risk_score,
      staleCount,
      deterministicRuleCriticalFailures,
      deterministicRuleHighFailures,
      confidence_thresholds: {
        min_confidence_approve_all: DEFAULT_CONFIDENCE_CONFIG.min_confidence_approve_all,
        min_confidence_partial: DEFAULT_CONFIDENCE_CONFIG.min_confidence_partial
      }
    })
    
    // Step 9: Make final decision
    const pecl_decision = this.computePECLDecision(
      rule_checks,
      semantic_analysis,
      risk_assessment,
      evaluations,
      narrative_result,
      evidence_ledger_result,
      truth_gate_result,
      claim_aware_compliance_result,
      trust_gate_authorization_result,
      surface_compliance_result,
      multilingual_integrity_en_tr_result,
      multilingual_result,
      manifest_hash,
      trace_id,
      mic,
      hard_rules,
      timestamp
    );

    const legacy_decision = this.computeFinalDecision(
      approved,
      rejected,
      delayed,
      rule_checks,
      semantic_analysis,
      risk_assessment,
      evaluations,
      confidence,
      hard_rules,
      narrative_result,
      evidence_ledger_result,
      truth_gate_result,
      claim_aware_compliance_result,
      trust_gate_authorization_result,
      surface_compliance_result,
      multilingual_integrity_en_tr_result,
      multilingual_result
    )

    // Rollout Logic: Divergence Detection
    if (legacy_decision.overall_decision !== this.mapPECLToLegacy(pecl_decision.final_decision)) {
      logOperation("CHIEF_EDITOR", "PECL_SHADOW_DIVERGENCE", "WARN", `Divergence detected: Legacy=${legacy_decision.overall_decision}, PECL=${pecl_decision.final_decision}`, {
        batch_id: batch.id,
        metadata: {
          legacy: legacy_decision.overall_decision,
          pecl: pecl_decision.final_decision,
          manifest_hash
        }
      });
    }

    const decision: ChiefEditorDecision = {
      ...legacy_decision,
      timestamp,
      multilingual_headline_integrity: multilingual_result,
      narrative_discipline: narrative_result,
      multilingual_integrity_en_tr: multilingual_integrity_en_tr_result,
      surface_compliance_pack: surface_compliance_result,
      trust_gate_authorization: trust_gate_authorization_result,
      truth_gate: truth_gate_result,
      claim_aware_compliance: claim_aware_compliance_result,
      evidence_ledger_safety: {
        ledger_safe: evidence_ledger_result.ledger_safe,
        uncovered_claims: evidence_ledger_result.uncovered_claims.length,
        weak_evidence_records: evidence_ledger_result.weak_evidence_records,
        missing_evidence_records: evidence_ledger_result.missing_evidence_records,
        duplicate_evidence_records: evidence_ledger_result.duplicate_evidence_records,
        incomplete_evidence_records: evidence_ledger_result.incomplete_evidence_records,
      },
      pecl_decision,
      manifest_hash,
      manifest: locked_package,
      gate_results: pecl_decision.gate_results, // Real gate outputs (L6-BLK-005)
      decision_trace: {
        trace_id,
        stage: 'CHIEF_EDITOR',
        decision: legacy_decision.overall_decision,
        confidence_score: legacy_decision.confidence_score,
        hard_rule_hits: hard_rules.hard_rule_hits,
        reasons: legacy_decision.reasons,
        multilingual_headline_integrity: multilingual_result,
        narrative_discipline: narrative_result,
        multilingual_integrity_en_tr: multilingual_integrity_en_tr_result,
        surface_compliance_pack: surface_compliance_result,
        trust_gate_authorization: trust_gate_authorization_result,
        truth_gate: truth_gate_result,
        claim_aware_compliance: claim_aware_compliance_result,
        evidence_ledger_safety: {
          ledger_safe: evidence_ledger_result.ledger_safe,
          uncovered_claims: evidence_ledger_result.uncovered_claims.length,
          weak_evidence_records: evidence_ledger_result.weak_evidence_records,
          missing_evidence_records: evidence_ledger_result.missing_evidence_records,
          duplicate_evidence_records: evidence_ledger_result.duplicate_evidence_records,
          incomplete_evidence_records: evidence_ledger_result.incomplete_evidence_records,
        },
        emitted_events: [],
        rule_checks,
        semantic_analysis,
        risk_assessment,
        timestamp: new Date().toISOString(),
        final_reasoning: legacy_decision.reasons.join('; ')
      }
    };

    // P2P Token Issuance (Real Ed25519 Signed Claims with Provenance Binding)
    if (pecl_decision.token_issuance_eligible) {
      hydrateLocalPECLRuntimeEnvIfMissing();
      const allowDevEphemeral = process.env.PECL_ALLOW_DEV_EPHEMERAL === 'true' || process.env.NODE_ENV === 'test';
      const selectedKeyIdRaw = (process.env.PECL_SIGNING_KEY_ID || '').trim();
      const selectedKeyId = normalizePECLKeyId(selectedKeyIdRaw);
      const configuredPrivateKey = (process.env.PECL_PRIVATE_KEY || '').trim();
      const devPrivateKey = ((global as any).__DEV_PRIVATE_KEY__ || '').trim();
      const privateKeyBase64 = configuredPrivateKey || (allowDevEphemeral ? devPrivateKey : '');
      const keySource = configuredPrivateKey
        ? 'PECL_PRIVATE_KEY'
        : allowDevEphemeral && devPrivateKey
          ? '__DEV_PRIVATE_KEY__'
          : 'NONE';

      logOperation('CHIEF_EDITOR', 'key_loading.source', 'INFO', 'Resolved signing key source before token issuance', {
        batch_id: batch.id,
        metadata: {
          key_source: keySource,
          pecl_mode: PECL_DEPLOYMENT_MODE,
          allow_dev_ephemeral: allowDevEphemeral
        }
      });

      logOperation('CHIEF_EDITOR', 'key_loading.selected_key_id', selectedKeyId ? 'INFO' : 'ERROR', 'Resolved signing key id before token issuance', {
        batch_id: batch.id,
        metadata: {
          selected_key_id: selectedKeyId || null
        }
      });

      if (!selectedKeyId) {
        logOperation('CHIEF_EDITOR', 'key_loading.fallback_blocked_or_allowed', 'ERROR', 'Token issuance blocked: missing PECL_SIGNING_KEY_ID', {
          batch_id: batch.id,
          metadata: {
            pecl_mode: PECL_DEPLOYMENT_MODE,
            allow_dev_ephemeral: allowDevEphemeral
          }
        });
        return decision;
      }

      const signedClaims = {
        payload_id: batch.id,
        manifest_hash,
        authorized_languages: pecl_decision.authorized_languages,
        keyId: selectedKeyId,
        algorithm: 'Ed25519' as const,
        issuedAt: timestamp,
        expiresAt: timestamp + (30 * 60 * 1000), // 30 min TTL
        claimGraphDigest: provenanceDigests.claimGraphDigest,
        evidenceLedgerDigest: provenanceDigests.evidenceLedgerDigest
      };

      // Sign the claims
      const cryptoProvider = getGlobalCryptoProvider();

      const keyProvider = getGlobalKeyProvider();
      const loadedKeyIds = (await keyProvider.listPublicKeys()).map((key) => key.keyId)

      logOperation('CHIEF_EDITOR', 'key_loading.loaded_key_ids', loadedKeyIds.length > 0 ? 'INFO' : 'ERROR', 'Loaded key ids visible to signing runtime', {
        batch_id: batch.id,
        metadata: {
          selected_key_id_raw: selectedKeyIdRaw || null,
          selected_key_id: selectedKeyId || null,
          loaded_key_ids: loadedKeyIds,
          loaded_key_count: loadedKeyIds.length
        }
      })

      const publicKeyMetadata = await keyProvider.getPublicKey(selectedKeyId);

      if (!publicKeyMetadata) {
        logOperation('CHIEF_EDITOR', 'key_loading.fallback_blocked_or_allowed', 'ERROR', 'Token issuance blocked: selected signing key id has no matching public key', {
          batch_id: batch.id,
          metadata: {
            selected_key_id: selectedKeyId,
            pecl_mode: PECL_DEPLOYMENT_MODE,
            allow_dev_ephemeral: allowDevEphemeral
          }
        });
        return decision;
      }
      
      if (!privateKeyBase64) {
        console.error('[CHIEF_EDITOR] No private key available for signing. Set PECL_PRIVATE_KEY environment variable.');
        logOperation("CHIEF_EDITOR", "SIGNING_KEY_MISSING", "ERROR", "No private key available for P2P token signing", {
          batch_id: batch.id,
          metadata: { keyId: signedClaims.keyId }
        });
      } else {
        try {
          const signature = cryptoProvider.sign(signedClaims, privateKeyBase64);
          
          const signedEnvelope = {
            signedClaims,
            signature
          };
          
          const tokenStr = JSON.stringify(signedEnvelope);
          decision.p2p_token = tokenStr;
          pecl_decision.p2p_token = tokenStr;

          logOperation("CHIEF_EDITOR", "P2P_TOKEN_ISSUED", "INFO", "P2P authorization token issued with Ed25519 signature and provenance binding", {
            batch_id: batch.id,
            metadata: {
              keyId: signedClaims.keyId,
              algorithm: signedClaims.algorithm,
              authorized_languages_count: signedClaims.authorized_languages.length,
              manifest_hash,
              expires_at: signedClaims.expiresAt,
              claim_graph_digest_prefix: signedClaims.claimGraphDigest.substring(0, 16),
              evidence_ledger_digest_prefix: signedClaims.evidenceLedgerDigest.substring(0, 16)
            }
          });
        } catch (error) {
          console.error('[CHIEF_EDITOR] Failed to sign P2P token:', error);
          logOperation("CHIEF_EDITOR", "P2P_TOKEN_SIGNING_FAILED", "ERROR", "Failed to sign P2P token", {
            batch_id: batch.id,
            metadata: { error: String(error) }
          });
        }
      }
    }

    return decision;
  }

  private computePECLDecision(
    rule_checks: RuleCheckResult[],
    semantic_analysis: SemanticAnalysisResult | null,
    risk_assessment: RiskAssessmentResult,
    evaluations: EditionEvaluation[],
    narrative_result: NarrativeResult,
    evidence_ledger_result: EvidenceLedgerResult,
    truth_gate_result: TruthGateResult,
    claim_aware_compliance_result: ClaimAwareComplianceResult,
    trust_gate_authorization_result: TrustGateResult,
    surface_compliance_result: SurfaceGateResult,
    multilingual_integrity_en_tr_result: MultilingualIntegrityResult,
    multilingual_result: MultilingualHeadlineResult,
    manifest_hash: string,
    trace_id: string,
    mic: MasterIntelligenceCore,
    hard_rules: { violations: any[], hard_rule_hits: string[] },
    timestamp: number
  ): PECLDecision & { gate_results: SovereignGateResult[] } {
    const isCritical = mic.metadata.urgency === "breaking" || risk_assessment.overall_risk_score > 60;
    const evidence_gate_decision = this.mapEvidenceLedgerToGateDecision(evidence_ledger_result);
    const narrative_gate_decision = this.mapNarrativeToGateDecision(narrative_result);
    const truth_gate_decision = truth_gate_result.gate_decision;
    const claim_gate_decision = claim_aware_compliance_result.gate_decision;
    const trust_gate_decision = trust_gate_authorization_result.gate_decision;
    const surface_gate_decision = surface_compliance_result.gate_decision;
    const multilingual_integrity_en_tr_decision = multilingual_integrity_en_tr_result.gate_decision;

    let final_decision: PECLDecision["final_decision"] = 'PUBLISH_APPROVED';
    let veto_source: string | null = null;

    // Collect Real Gate Results (L6-BLK-005)
    const gate_results: SovereignGateResult[] = [];

    // Gate 1: Hard Rules
    gate_results.push({
      gate_id: "HARD_RULE_GATE",
      gate_version: "1.0.0",
      manifest_hash,
      trace_id,
      decision: hard_rules.violations.length > 0 ? "BLOCK" : "PASS",
      severity: hard_rules.violations.length > 0 ? "CRITICAL" : "LOW",
      confidence_score: hard_rules.violations.length > 0 ? 0 : 100,
      risk_reasons: hard_rules.hard_rule_hits,
      reasoning: hard_rules.violations.length > 0
        ? `Hard rule violations detected: ${hard_rules.hard_rule_hits.join(', ')}`
        : "All hard rules passed",
      affected_languages: Array.from(new Set(hard_rules.violations.map(v => v.language || 'all'))) as Language[],
      mitigation_instructions: null,
      execution_telemetry: {
        status_code: 200,
        latency_ms: 0,
        started_at: new Date(timestamp).toISOString(),
        completed_at: new Date().toISOString()
      }
    });

    // Gate 2: Semantic Consistency
    if (semantic_analysis) {
      gate_results.push({
        gate_id: "SEMANTIC_CONSISTENCY_GATE",
        gate_version: "1.0.0",
        manifest_hash,
        trace_id,
        decision: semantic_analysis.drift_detected ? "CORRECTION" : "PASS",
        severity: semantic_analysis.consistency_score < 70 ? "HIGH" : "LOW",
        confidence_score: semantic_analysis.ai_confidence * 100,
        risk_reasons: semantic_analysis.inconsistencies.map(i => `${i.field} drift between ${i.language_pair.join('-')}`),
        reasoning: semantic_analysis.drift_detected
          ? `Semantic drift detected in ${semantic_analysis.inconsistencies.length} pairs`
          : "Semantic consistency within acceptable bounds",
        affected_languages: Array.from(new Set(semantic_analysis.inconsistencies.flatMap(i => i.language_pair))),
        mitigation_instructions: null,
        execution_telemetry: {
          status_code: 200,
          latency_ms: 0,
          started_at: new Date(timestamp).toISOString(),
          completed_at: new Date().toISOString()
        }
      });
    }

    // Gate 3: Risk Assessment
    gate_results.push({
      gate_id: "RISK_ASSESSMENT_GATE",
      gate_version: "1.0.0",
      manifest_hash,
      trace_id,
      decision: risk_assessment.overall_risk_score > 70 ? "BLOCK" : risk_assessment.overall_risk_score > 40 ? "REVIEW" : "PASS",
      severity: risk_assessment.overall_risk_score > 70 ? "CRITICAL" : risk_assessment.overall_risk_score > 40 ? "HIGH" : "LOW",
      confidence_score: 100 - risk_assessment.overall_risk_score,
      risk_reasons: risk_assessment.risk_factors.map(f => `${f.type}: ${f.description}`),
      reasoning: `Overall risk score: ${risk_assessment.overall_risk_score.toFixed(1)}`,
      affected_languages: Array.from(new Set(risk_assessment.risk_factors.flatMap(f => f.affected_languages))),
      mitigation_instructions: null,
      execution_telemetry: {
        status_code: 200,
        latency_ms: 0,
        started_at: new Date(timestamp).toISOString(),
        completed_at: new Date().toISOString()
      }
    });

    // Gate 4: Evidence Ledger Safety
    gate_results.push({
      gate_id: "EVIDENCE_LEDGER_GATE",
      gate_version: "1.0.0",
      manifest_hash,
      trace_id,
      decision: evidence_gate_decision,
      severity: this.mapEvidenceLedgerSeverity(evidence_ledger_result, evidence_gate_decision),
      confidence_score: this.computeEvidenceLedgerConfidence(evidence_ledger_result),
      risk_reasons: this.buildEvidenceLedgerRiskReasons(evidence_ledger_result),
      reasoning: evidence_ledger_result.reasoning,
      affected_languages: evaluations.map(e => e.language),
      mitigation_instructions: null,
      execution_telemetry: {
        status_code: 200,
        latency_ms: 0,
        started_at: new Date(timestamp).toISOString(),
        completed_at: new Date().toISOString()
      }
    });

    // Gate 5: Narrative Discipline
    gate_results.push({
      gate_id: "NARRATIVE_DISCIPLINE_GATE",
      gate_version: "1.0.0",
      manifest_hash,
      trace_id,
      decision: narrative_gate_decision,
      severity: narrative_result.narrative_severity,
      confidence_score: this.computeNarrativeConfidence(narrative_result),
      risk_reasons: narrative_result.narrative_risk_reasons,
      reasoning: narrative_result.reasoning,
      affected_languages: evaluations.map(e => e.language),
      mitigation_instructions: null,
      execution_telemetry: {
        status_code: 200,
        latency_ms: 0,
        started_at: new Date(timestamp).toISOString(),
        completed_at: new Date().toISOString()
      }
    });

    // Gate 6: Truth Gate / Claim Graph Binding
    gate_results.push({
      gate_id: "TRUTH_GATE",
      gate_version: "1.0.0",
      manifest_hash,
      trace_id,
      decision: truth_gate_decision,
      severity: truth_gate_result.severity,
      confidence_score: this.computeTruthGateConfidence(truth_gate_result),
      risk_reasons: truth_gate_result.reason_codes,
      reasoning: truth_gate_result.reasoning,
      affected_languages: evaluations.map(e => e.language),
      mitigation_instructions: null,
      reason_codes: truth_gate_result.reason_codes,
      truth_classification: truth_gate_result.critical_truth_outcome,
      truth_markers: truth_gate_result.truth_markers,
      truth_provenance_binding: truth_gate_result.provenance_binding,
      execution_telemetry: {
        status_code: 200,
        latency_ms: 0,
        started_at: new Date(timestamp).toISOString(),
        completed_at: new Date().toISOString()
      }
    });

    // Gate 7: Claim-Aware Compliance
    gate_results.push({
      gate_id: "CLAIM_AWARE_COMPLIANCE_GATE",
      gate_version: "1.0.0",
      manifest_hash,
      trace_id,
      decision: claim_gate_decision,
      severity: claim_aware_compliance_result.severity,
      confidence_score: this.computeClaimAwareComplianceConfidence(claim_aware_compliance_result),
      risk_reasons: claim_aware_compliance_result.reason_codes,
      reasoning: claim_aware_compliance_result.reasoning,
      affected_languages: evaluations.map(e => e.language),
      mitigation_instructions: null,
      reason_codes: claim_aware_compliance_result.reason_codes,
      claim_metrics: claim_aware_compliance_result.claim_metrics,
      provenance_metrics: claim_aware_compliance_result.provenance,
      compliance_surface: claim_aware_compliance_result.compliance_surface,
      execution_telemetry: {
        status_code: 200,
        latency_ms: 0,
        started_at: new Date(timestamp).toISOString(),
        completed_at: new Date().toISOString()
      }
    });

    // Gate 8: Trust Gate / Editorial Authorization Consolidation
    gate_results.push({
      gate_id: "TRUST_GATE",
      gate_version: "1.0.0",
      manifest_hash,
      trace_id,
      decision: trust_gate_decision,
      severity: trust_gate_authorization_result.severity,
      confidence_score: this.computeTrustGateAuthorizationConfidence(trust_gate_authorization_result),
      risk_reasons: trust_gate_authorization_result.reason_codes,
      reasoning: trust_gate_authorization_result.reasoning,
      affected_languages: evaluations.map(e => e.language),
      mitigation_instructions: null,
      reason_codes: trust_gate_authorization_result.reason_codes,
      trust_verdict: trust_gate_authorization_result.trust_verdict,
      trust_fail_closed: trust_gate_authorization_result.fail_closed,
      trust_contributing_signals: trust_gate_authorization_result.contributing_signals,
      execution_telemetry: {
        status_code: 200,
        latency_ms: 0,
        started_at: new Date(timestamp).toISOString(),
        completed_at: new Date().toISOString()
      }
    });

    // Gate 9: Surface Compliance Pack / Publication Surface Binding
    gate_results.push({
      gate_id: "SURFACE_COMPLIANCE_GATE",
      gate_version: "1.0.0",
      manifest_hash,
      trace_id,
      decision: surface_gate_decision,
      severity: surface_compliance_result.severity,
      confidence_score: this.computeSurfaceComplianceConfidence(surface_compliance_result),
      risk_reasons: surface_compliance_result.reason_codes,
      reasoning: surface_compliance_result.reasoning,
      affected_languages: [surface_compliance_result.base_language],
      mitigation_instructions: null,
      reason_codes: surface_compliance_result.reason_codes,
      surface_verdict: surface_compliance_result.surface_verdict,
      surface_fail_closed: surface_compliance_result.fail_closed,
      surface_base_language: surface_compliance_result.base_language,
      surface_fields: surface_compliance_result.contributing_surface_fields,
      surface_trust_binding: surface_compliance_result.trust_binding,
      execution_telemetry: {
        status_code: 200,
        latency_ms: 0,
        started_at: new Date(timestamp).toISOString(),
        completed_at: new Date().toISOString()
      }
    });

    // Gate 10: Multilingual Integrity Layer (EN->TR Surface Drift)
    gate_results.push({
      gate_id: "MULTILINGUAL_INTEGRITY_EN_TR_GATE",
      gate_version: "1.0.0",
      manifest_hash,
      trace_id,
      decision: multilingual_integrity_en_tr_decision,
      severity: multilingual_integrity_en_tr_result.severity,
      confidence_score: this.computeEnTrMultilingualIntegrityConfidence(multilingual_integrity_en_tr_result),
      risk_reasons: multilingual_integrity_en_tr_result.reason_codes,
      reasoning: multilingual_integrity_en_tr_result.reasoning,
      affected_languages: [multilingual_integrity_en_tr_result.source_language, multilingual_integrity_en_tr_result.target_language],
      mitigation_instructions: null,
      reason_codes: multilingual_integrity_en_tr_result.reason_codes,
      multilingual_verdict: multilingual_integrity_en_tr_result.multilingual_verdict,
      multilingual_source_language: multilingual_integrity_en_tr_result.source_language,
      multilingual_target_language: multilingual_integrity_en_tr_result.target_language,
      multilingual_fail_closed: multilingual_integrity_en_tr_result.fail_closed,
      multilingual_checked_surfaces: multilingual_integrity_en_tr_result.checked_surfaces,
      multilingual_trust_binding: multilingual_integrity_en_tr_result.trust_binding,
      execution_telemetry: {
        status_code: 200,
        latency_ms: 0,
        started_at: new Date(timestamp).toISOString(),
        completed_at: new Date().toISOString()
      }
    });

    // Gate 11: Multilingual Headline Integrity
    gate_results.push({
      gate_id: "MULTILINGUAL_HEADLINE_GATE",
      gate_version: "1.0.0",
      manifest_hash,
      trace_id,
      decision: multilingual_result.decision === "MULTILINGUAL_HEADLINE_PASS" ? "PASS" :
                multilingual_result.decision === "MULTILINGUAL_HEADLINE_BLOCK" ? "BLOCK" : "REVIEW",
      severity: multilingual_result.severity,
      confidence_score: 80, // Evaluator heuristic
      risk_reasons: multilingual_result.risk_reasons,
      reasoning: multilingual_result.reasoning,
      affected_languages: [], // Multilingual gate affects all languages
      mitigation_instructions: null,
      execution_telemetry: {
        status_code: 200,
        latency_ms: 0,
        started_at: new Date(timestamp).toISOString(),
        completed_at: new Date().toISOString()
      }
    });

    // Veto Ladder (Priority Order)
    if (
      multilingual_result.decision === "MULTILINGUAL_HEADLINE_BLOCK" ||
      hard_rules.violations.length > 0 ||
      trust_gate_decision === 'BLOCK' ||
      surface_gate_decision === 'BLOCK' ||
      multilingual_integrity_en_tr_decision === 'BLOCK' ||
      truth_gate_decision === 'BLOCK' ||
      claim_gate_decision === 'BLOCK' ||
      narrative_gate_decision === 'BLOCK' ||
      evidence_gate_decision === 'BLOCK'
    ) {
      final_decision = 'TERMINAL_BLOCK';
      if (hard_rules.violations.length > 0) {
        veto_source = 'HARD_RULES';
      } else if (multilingual_result.decision === "MULTILINGUAL_HEADLINE_BLOCK") {
        veto_source = 'MULTILINGUAL_HEADLINE';
      } else if (trust_gate_decision === 'BLOCK') {
        veto_source = 'TRUST_GATE';
      } else if (surface_gate_decision === 'BLOCK') {
        veto_source = 'SURFACE_COMPLIANCE';
      } else if (multilingual_integrity_en_tr_decision === 'BLOCK') {
        veto_source = 'MULTILINGUAL_INTEGRITY_EN_TR';
      } else if (truth_gate_decision === 'BLOCK') {
        veto_source = 'TRUTH_GATE';
      } else if (claim_gate_decision === 'BLOCK') {
        veto_source = 'CLAIM_AWARE_COMPLIANCE';
      } else if (narrative_gate_decision === 'BLOCK') {
        veto_source = 'NARRATIVE_DISCIPLINE';
      } else {
        veto_source = 'EVIDENCE_LEDGER';
      }
    } else if (risk_assessment.overall_risk_score > 80) {
      final_decision = 'TERMINAL_BLOCK';
      veto_source = 'RISK_ASSESSMENT';
    } else if (
      multilingual_result.decision === "MULTILINGUAL_HEADLINE_REVIEW_REQUIRED" ||
      trust_gate_decision === 'REVIEW' ||
      surface_gate_decision === 'REVIEW' ||
      multilingual_integrity_en_tr_decision === 'REVIEW' ||
      truth_gate_decision === 'REVIEW' ||
      claim_gate_decision === 'REVIEW' ||
      narrative_gate_decision === 'REVIEW' ||
      evidence_gate_decision === 'REVIEW' ||
      isCritical
    ) {
      final_decision = 'ESCALATION_REQUIRED';
      if (multilingual_result.decision === "MULTILINGUAL_HEADLINE_REVIEW_REQUIRED") {
        veto_source = 'MULTILINGUAL_HEADLINE';
      } else if (trust_gate_decision === 'REVIEW') {
        veto_source = 'TRUST_GATE';
      } else if (surface_gate_decision === 'REVIEW') {
        veto_source = 'SURFACE_COMPLIANCE';
      } else if (multilingual_integrity_en_tr_decision === 'REVIEW') {
        veto_source = 'MULTILINGUAL_INTEGRITY_EN_TR';
      } else if (truth_gate_decision === 'REVIEW') {
        veto_source = 'TRUTH_GATE';
      } else if (claim_gate_decision === 'REVIEW') {
        veto_source = 'CLAIM_AWARE_COMPLIANCE';
      } else if (narrative_gate_decision === 'REVIEW') {
        veto_source = 'NARRATIVE_DISCIPLINE';
      } else if (evidence_gate_decision === 'REVIEW') {
        veto_source = 'EVIDENCE_LEDGER';
      } else {
        veto_source = 'CRITICAL_CONTEXT';
      }
    } else if (
      multilingual_result.decision === "MULTILINGUAL_HEADLINE_CORRECTION_REQUIRED" ||
      trust_gate_decision === 'CORRECTION' ||
      surface_gate_decision === 'CORRECTION' ||
      multilingual_integrity_en_tr_decision === 'CORRECTION' ||
      truth_gate_decision === 'CORRECTION' ||
      claim_gate_decision === 'CORRECTION' ||
      narrative_gate_decision === 'CORRECTION' ||
      evidence_gate_decision === 'CORRECTION'
    ) {
      final_decision = 'REMEDIATION_REQUIRED';
      if (multilingual_result.decision === "MULTILINGUAL_HEADLINE_CORRECTION_REQUIRED") {
        veto_source = 'MULTILINGUAL_HEADLINE';
      } else if (trust_gate_decision === 'CORRECTION') {
        veto_source = 'TRUST_GATE';
      } else if (surface_gate_decision === 'CORRECTION') {
        veto_source = 'SURFACE_COMPLIANCE';
      } else if (multilingual_integrity_en_tr_decision === 'CORRECTION') {
        veto_source = 'MULTILINGUAL_INTEGRITY_EN_TR';
      } else if (truth_gate_decision === 'CORRECTION') {
        veto_source = 'TRUTH_GATE';
      } else if (claim_gate_decision === 'CORRECTION') {
        veto_source = 'CLAIM_AWARE_COMPLIANCE';
      } else if (narrative_gate_decision === 'CORRECTION') {
        veto_source = 'NARRATIVE_DISCIPLINE';
      } else {
        veto_source = 'EVIDENCE_LEDGER';
      }
    }

    const authorized = evaluations.filter(e => e.recommendation === 'APPROVE').map(e => e.language);
    const quarantined = evaluations.filter(e => e.recommendation !== 'APPROVE').map(e => e.language);

    return {
      final_decision,
      final_severity: isCritical ? "CRITICAL" : "MEDIUM",
      publish_authorization_state: final_decision === 'PUBLISH_APPROVED',
      token_issuance_eligible: true, // PECL V7.0: All terminal outcomes MUST carry authorization for DecisionDNA/Batch audit persistence
      veto_source_gate: veto_source,
      authorized_languages: authorized,
      quarantined_languages: quarantined,
      trace_id,
      manifest_hash,
      issued_at: new Date().toISOString(),
      mode: PECL_DEPLOYMENT_MODE,
      gate_results
    };
  }

  private mapPECLToLegacy(pecl: PECLDecision["final_decision"]): OverallDecision {
    switch (pecl) {
      case 'PUBLISH_APPROVED': return 'APPROVE_ALL'; // or APPROVE_PARTIAL depending on counts
      case 'REMEDIATION_REQUIRED': return 'REJECT'; // Triggers healing
      case 'ESCALATION_REQUIRED': return 'ESCALATE';
      case 'TERMINAL_BLOCK': return 'REJECT';
      default: return 'REJECT';
    }
  }

  private evaluateEvidenceLedgerSafety(
    batch: BatchJob,
    mic: MasterIntelligenceCore
  ): EvidenceLedgerResult {
    const explicitClaims = mic.truth_nucleus.claims.map(claim => ({
      claim_id: claim.id,
      claim_text: claim.statement
    }));

    const useDerivedClaims = explicitClaims.length === 0 && mic.truth_nucleus.facts.length > 0;

    const claims = useDerivedClaims
      ? mic.truth_nucleus.facts.map((fact, index) => ({
          claim_id: `derived_claim_${fact.id || index}`,
          claim_text: fact.statement || `Derived claim ${index + 1}`
        }))
      : explicitClaims;

    const claimIds = claims.map(claim => claim.claim_id);

    if (useDerivedClaims) {
      logOperation("CHIEF_EDITOR", "EVIDENCE_LEDGER_CLAIM_PROJECTION", "INFO", "Derived claim projection from truth nucleus facts", {
        batch_id: batch.id,
        metadata: {
          derived_claim_count: claimIds.length,
          fact_count: mic.truth_nucleus.facts.length,
          source: "truth_nucleus.facts"
        }
      });
    }

    const evidence_records = mic.truth_nucleus.facts.map((fact, index) => {
      const hasHttpSource = Array.isArray(fact.sources)
        ? fact.sources.some(src => /^https?:\/\//i.test(src))
        : false;

      const linkedClaimIds = useDerivedClaims
        ? (claimIds[index] ? [claimIds[index]] : [])
        : claimIds;

      return {
        evidence_id: fact.id || `fact_${index}`,
        claim_ids: linkedClaimIds,
        evidence_type: 'PRIMARY_SOURCE' as const,
        source_url_present: hasHttpSource,
        high_quality_source: hasHttpSource,
        has_attribution: true,
        metadata_complete: Boolean(fact.id) && Array.isArray(fact.sources)
      };
    });

    return buildEvidenceLedger({
      story_id: batch.id,
      claims,
      claim_ids: claimIds,
      evidence_records
    });
  }

  private computeEvidenceSupportScore(evidence_ledger_result: EvidenceLedgerResult): number {
    if (evidence_ledger_result.total_claims === 0 && evidence_ledger_result.total_evidence_records === 0) {
      return 100;
    }

    const coveredClaims = Math.max(0, evidence_ledger_result.total_claims - evidence_ledger_result.uncovered_claims.length);
    const claimCoverageScore = evidence_ledger_result.total_claims === 0
      ? 100
      : (coveredClaims / evidence_ledger_result.total_claims) * 100;

    const evidenceQualityScore = evidence_ledger_result.total_evidence_records === 0
      ? 100
      : ((evidence_ledger_result.valid_evidence_records + (evidence_ledger_result.weak_evidence_records * 0.5)) / evidence_ledger_result.total_evidence_records) * 100;

    return Math.round((claimCoverageScore * 0.7) + (evidenceQualityScore * 0.3));
  }

  private buildNarrativeInput(
    batch: BatchJob,
    mic: MasterIntelligenceCore,
    evaluations: EditionEvaluation[],
    semantic_analysis: SemanticAnalysisResult | null,
    evidence_ledger_result: EvidenceLedgerResult,
    editions: Record<Language, LanguageEdition>
  ): NarrativeInput {
    const issues = Object.values(editions).flatMap(edition => edition.audit_results?.issues ?? []);
    const issueMatches = (pattern: RegExp): boolean =>
      issues.some(issue => pattern.test((issue.description || '').toLowerCase()));

    const titleMismatch = issues.some(
      issue => issue.cell === 'title_cell' && /mismatch|misalign|drift|inconsistent/i.test(issue.description || '')
    );

    const avgTone = evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + (e.cell_scores['tone_cell'] || 70), 0) / evaluations.length
      : 70;

    return {
      headline_alignment_passed: !titleMismatch,
      evidence_support_score: this.computeEvidenceSupportScore(evidence_ledger_result),
      narrative_intensity_score: Math.round(avgTone),
      certainty_language_detected: issueMatches(/certainty|absolute|guarantee|certainly/i),
      sensationalism_detected: issueMatches(/clickbait|sensational|outrage|shocking|emotional/i),
      claim_stack_count: mic.truth_nucleus.claims.length,
      thesis_supported: !issueMatches(/thesis|overreach|unsupported|misleading/i),
      confidence_signal_present: !issueMatches(/confidence\s*(signal)?\s*missing/i),
      multilingual_narrative_consistency_passed: semantic_analysis ? !semantic_analysis.drift_detected : true,
      sensitive_topic: mic.metadata.urgency === 'breaking' || evidence_ledger_result.uncovered_claims.length > 0,
    };
  }

  private mapNarrativeToGateDecision(narrative_result: NarrativeResult): PECLGateDecision {
    switch (narrative_result.narrative_decision) {
      case 'NARRATIVE_PASS':
        return 'PASS';
      case 'NARRATIVE_CORRECTION_REQUIRED':
        return 'CORRECTION';
      case 'NARRATIVE_REVIEW_REQUIRED':
        return 'REVIEW';
      case 'NARRATIVE_BLOCK':
      default:
        return 'BLOCK';
    }
  }

  private mapEvidenceLedgerToGateDecision(evidence_ledger_result: EvidenceLedgerResult): PECLGateDecision {
    if (evidence_ledger_result.ledger_safe) {
      return 'PASS';
    }

    if (
      evidence_ledger_result.uncovered_claims.length > 0 ||
      evidence_ledger_result.missing_evidence_records > 0
    ) {
      return 'BLOCK';
    }

    if (
      evidence_ledger_result.duplicate_evidence_records > 0 ||
      evidence_ledger_result.incomplete_evidence_records > 0
    ) {
      return 'REVIEW';
    }

    if (evidence_ledger_result.weak_evidence_records > 0) {
      return 'CORRECTION';
    }

    return 'REVIEW';
  }

  private mapEvidenceLedgerSeverity(
    evidence_ledger_result: EvidenceLedgerResult,
    decision: PECLGateDecision
  ): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (decision === 'PASS') return 'LOW';
    if (decision === 'CORRECTION') return 'MEDIUM';
    if (decision === 'REVIEW') return 'HIGH';

    return evidence_ledger_result.uncovered_claims.length > 0 ? 'CRITICAL' : 'HIGH';
  }

  private buildEvidenceLedgerRiskReasons(evidence_ledger_result: EvidenceLedgerResult): string[] {
    if (evidence_ledger_result.ledger_safe) {
      return [];
    }

    const reasons: string[] = [];
    if (evidence_ledger_result.uncovered_claims.length > 0) {
      reasons.push(`UNCOVERED_CLAIMS:${evidence_ledger_result.uncovered_claims.length}`);
    }
    if (evidence_ledger_result.missing_evidence_records > 0) {
      reasons.push(`MISSING_EVIDENCE_RECORDS:${evidence_ledger_result.missing_evidence_records}`);
    }
    if (evidence_ledger_result.duplicate_evidence_records > 0) {
      reasons.push(`DUPLICATE_EVIDENCE_RECORDS:${evidence_ledger_result.duplicate_evidence_records}`);
    }
    if (evidence_ledger_result.incomplete_evidence_records > 0) {
      reasons.push(`INCOMPLETE_EVIDENCE_RECORDS:${evidence_ledger_result.incomplete_evidence_records}`);
    }
    if (evidence_ledger_result.weak_evidence_records > 0) {
      reasons.push(`WEAK_EVIDENCE_RECORDS:${evidence_ledger_result.weak_evidence_records}`);
    }

    return reasons;
  }

  private computeEvidenceLedgerConfidence(evidence_ledger_result: EvidenceLedgerResult): number {
    const penalty =
      evidence_ledger_result.uncovered_claims.length * 20 +
      evidence_ledger_result.missing_evidence_records * 12 +
      evidence_ledger_result.duplicate_evidence_records * 8 +
      evidence_ledger_result.incomplete_evidence_records * 8 +
      evidence_ledger_result.weak_evidence_records * 4;

    return Math.max(0, Math.min(100, 100 - penalty));
  }

  private computeNarrativeConfidence(narrative_result: NarrativeResult): number {
    const riskPenalty = narrative_result.narrative_risk_reasons.length * 18;
    return Math.max(0, Math.min(100, 100 - riskPenalty));
  }

  private evaluateTruthGate(
    mic: MasterIntelligenceCore,
    evidence_ledger_result: EvidenceLedgerResult,
    provenanceDigests: { claimGraphDigest: string; evidenceLedgerDigest: string }
  ): TruthGateResult {
    const total_critical_claims = mic.truth_nucleus.claims.length;
    const uncoveredClaimIds = new Set(evidence_ledger_result.uncovered_claims);
    const facts_missing_sources = mic.truth_nucleus.facts.filter(
      fact => !Array.isArray(fact.sources) || fact.sources.length === 0
    ).length;

    let supported_claims = 0;
    let disputed_claims = 0;
    let unverifiable_claims = 0;
    let unsupported_claims = 0;
    let provenance_missing_claims = 0;

    for (const claim of mic.truth_nucleus.claims) {
      const provenanceMissingForClaim = uncoveredClaimIds.has(claim.id);

      if (claim.verification_status === 'disputed') {
        disputed_claims += 1;
        continue;
      }

      if (provenanceMissingForClaim) {
        provenance_missing_claims += 1;
        unsupported_claims += 1;
        continue;
      }

      if (claim.verification_status === 'unverified') {
        unverifiable_claims += 1;
        continue;
      }

      supported_claims += 1;
    }

    if (facts_missing_sources > 0 && total_critical_claims > 0) {
      provenance_missing_claims = Math.min(total_critical_claims, provenance_missing_claims + 1);
    }

    const reason_codes: string[] = [];

    if (supported_claims > 0) {
      reason_codes.push(`TRUTH_SUPPORTED:${supported_claims}`);
    }
    if (disputed_claims > 0) {
      reason_codes.push(`TRUTH_DISPUTED:${disputed_claims}`);
    }
    if (unverifiable_claims > 0) {
      reason_codes.push(`TRUTH_UNVERIFIABLE:${unverifiable_claims}`);
    }
    if (unsupported_claims > 0) {
      reason_codes.push(`TRUTH_UNSUPPORTED:${unsupported_claims}`);
    }
    if (provenance_missing_claims > 0) {
      reason_codes.push(`TRUTH_PROVENANCE_MISSING:${provenance_missing_claims}`);
    }
    if (facts_missing_sources > 0) {
      reason_codes.push(`TRUTH_FACT_SOURCE_MISSING:${facts_missing_sources}`);
    }

    let critical_truth_outcome: TruthGateResult['critical_truth_outcome'] = 'SUPPORTED';
    let gate_decision: PECLGateDecision = 'PASS';
    let severity: TruthGateResult['severity'] = 'LOW';

    if (disputed_claims > 0) {
      critical_truth_outcome = 'DISPUTED';
      gate_decision = 'BLOCK';
      severity = 'CRITICAL';
    } else if (provenance_missing_claims > 0) {
      critical_truth_outcome = 'PROVENANCE_MISSING';
      gate_decision = 'BLOCK';
      severity = 'HIGH';
    } else if (unverifiable_claims > 0) {
      critical_truth_outcome = 'UNVERIFIABLE';
      gate_decision = 'REVIEW';
      severity = 'HIGH';
    }

    const reasoning =
      total_critical_claims === 0
        ? 'Truth gate found no critical claims to classify.'
        : `Truth gate outcome=${critical_truth_outcome} with ${reason_codes.length} reason code(s): ${reason_codes.join(', ')}.`;

    return {
      gate_decision,
      severity,
      critical_truth_outcome,
      reason_codes,
      reasoning,
      truth_markers: {
        total_critical_claims,
        supported_claims,
        disputed_claims,
        unverifiable_claims,
        unsupported_claims,
        provenance_missing_claims,
      },
      provenance_binding: {
        claim_graph_digest_prefix: provenanceDigests.claimGraphDigest.substring(0, 16),
        evidence_ledger_digest_prefix: provenanceDigests.evidenceLedgerDigest.substring(0, 16),
        bound_to_provenance: Boolean(provenanceDigests.claimGraphDigest && provenanceDigests.evidenceLedgerDigest),
      },
    };
  }

  private computeTruthGateConfidence(result: TruthGateResult): number {
    const penalty =
      result.truth_markers.disputed_claims * 35 +
      result.truth_markers.provenance_missing_claims * 25 +
      result.truth_markers.unsupported_claims * 20 +
      result.truth_markers.unverifiable_claims * 12 +
      (result.provenance_binding.bound_to_provenance ? 0 : 20);

    return Math.max(0, Math.min(100, Math.round(100 - penalty)));
  }

  private evaluateTrustGateAuthorization(
    narrative_result: NarrativeResult,
    evidence_ledger_result: EvidenceLedgerResult,
    truth_gate_result: TruthGateResult,
    claim_aware_compliance_result: ClaimAwareComplianceResult
  ): TrustGateResult {
    const toSignal = (value: string | undefined): PECLGateDecision | 'MISSING' => {
      if (value === 'PASS' || value === 'CORRECTION' || value === 'REVIEW' || value === 'BLOCK') {
        return value;
      }
      return 'MISSING';
    };

    const contributing_signals: TrustGateResult['contributing_signals'] = {
      narrative_gate: toSignal(this.mapNarrativeToGateDecision(narrative_result)),
      evidence_gate: toSignal(this.mapEvidenceLedgerToGateDecision(evidence_ledger_result)),
      truth_gate: toSignal(truth_gate_result?.gate_decision),
      claim_compliance_gate: toSignal(claim_aware_compliance_result?.gate_decision),
    };

    const signalEntries = Object.entries(contributing_signals) as Array<[
      keyof TrustGateResult['contributing_signals'],
      PECLGateDecision | 'MISSING'
    ]>;
    const missingSignals = signalEntries.filter(([, decision]) => decision === 'MISSING').map(([name]) => name);
    const blockSignals = signalEntries.filter(([, decision]) => decision === 'BLOCK').map(([name]) => name);
    const reviewSignals = signalEntries.filter(([, decision]) => decision === 'REVIEW').map(([name]) => name);
    const correctionSignals = signalEntries.filter(([, decision]) => decision === 'CORRECTION').map(([name]) => name);

    const reason_codes: string[] = [];
    let gate_decision: PECLGateDecision = 'PASS';
    let trust_verdict: TrustGateResult['trust_verdict'] = 'TRUST_PASS';
    let severity: TrustGateResult['severity'] = 'LOW';
    let fail_closed = false;

    if (missingSignals.length > 0) {
      fail_closed = true;
      gate_decision = 'BLOCK';
      trust_verdict = 'TRUST_BLOCK';
      severity = 'CRITICAL';
      reason_codes.push(`TRUST_FAIL_CLOSED_INPUTS:${missingSignals.length}`);
      for (const signal of missingSignals) {
        reason_codes.push(`TRUST_INPUT_MISSING:${signal}`);
      }
    } else if (blockSignals.length > 0) {
      gate_decision = 'BLOCK';
      trust_verdict = 'TRUST_BLOCK';
      severity = 'CRITICAL';
      for (const signal of blockSignals) {
        reason_codes.push(`TRUST_SIGNAL_BLOCK:${signal}`);
      }
    } else if (reviewSignals.length > 0) {
      gate_decision = 'REVIEW';
      trust_verdict = 'TRUST_REVIEW';
      severity = 'HIGH';
      for (const signal of reviewSignals) {
        reason_codes.push(`TRUST_SIGNAL_REVIEW:${signal}`);
      }
    } else if (correctionSignals.length > 0) {
      gate_decision = 'CORRECTION';
      trust_verdict = 'TRUST_CORRECTION';
      severity = 'MEDIUM';
      for (const signal of correctionSignals) {
        reason_codes.push(`TRUST_SIGNAL_CORRECTION:${signal}`);
      }
    } else {
      reason_codes.push('TRUST_PASS_ALL_SIGNALS');
    }

    const reasoning =
      reason_codes.length === 0
        ? `Trust gate verdict=${trust_verdict}.`
        : `Trust gate verdict=${trust_verdict} with ${reason_codes.length} reason code(s): ${reason_codes.join(', ')}.`;

    return {
      gate_decision,
      trust_verdict,
      severity,
      reason_codes,
      reasoning,
      fail_closed,
      contributing_signals,
    };
  }

  private computeTrustGateAuthorizationConfidence(result: TrustGateResult): number {
    const signalPenalty = Object.values(result.contributing_signals).reduce((total, decision) => {
      if (decision === 'BLOCK') {
        return total + 30;
      }
      if (decision === 'REVIEW') {
        return total + 16;
      }
      if (decision === 'CORRECTION') {
        return total + 10;
      }
      if (decision === 'MISSING') {
        return total + 22;
      }
      return total;
    }, 0);

    const penalty = signalPenalty + (result.fail_closed ? 20 : 0);
    return Math.max(0, Math.min(100, Math.round(100 - penalty)));
  }

  private evaluateSurfaceComplianceGate(
    editions: Record<Language, LanguageEdition>,
    mic: MasterIntelligenceCore,
    trust_gate_authorization_result: TrustGateResult,
    truth_gate_result: TruthGateResult,
    claim_aware_compliance_result: ClaimAwareComplianceResult
  ): SurfaceGateResult {
    const languageKeys = Object.keys(editions) as Language[];
    const fallbackBaseLanguage = languageKeys.at(0);
    const base_language: SurfaceGateResult['base_language'] = editions.en
      ? 'en'
      : (fallbackBaseLanguage ?? 'unknown');

    const baseEdition = base_language === 'unknown' ? undefined : editions[base_language];
    const title = (baseEdition?.content?.title || '').trim();
    const lead = (baseEdition?.content?.lead || '').trim();
    const summary = (baseEdition?.content?.body?.summary || '').trim();

    const title_present = title.length > 0;
    const lead_present = lead.length > 0;
    const summary_present = summary.length > 0;

    const trustedText = [
      mic.structural_atoms.core_thesis,
      ...mic.truth_nucleus.claims.map(claim => claim.statement),
      mic.truth_nucleus.impact_analysis,
    ].join(' ');

    const trustedTokens = this.extractSurfaceTokens(trustedText);
    const surfaceTokens = this.extractSurfaceTokens([title, lead, summary].join(' '));
    const overlapCount = Array.from(trustedTokens).filter(token => surfaceTokens.has(token)).length;
    const trusted_term_overlap_ratio = trustedTokens.size === 0
      ? 1
      : Number((overlapCount / trustedTokens.size).toFixed(3));

    const trust_binding: SurfaceGateResult['trust_binding'] = {
      trust_verdict: trust_gate_authorization_result?.trust_verdict ?? 'MISSING',
      truth_outcome: truth_gate_result?.critical_truth_outcome ?? 'MISSING',
      claim_gate: claim_aware_compliance_result?.gate_decision ?? 'MISSING',
    };

    const reason_codes: string[] = [];
    let gate_decision: PECLGateDecision = 'PASS';
    let surface_verdict: SurfaceGateResult['surface_verdict'] = 'SURFACE_PASS';
    let severity: SurfaceGateResult['severity'] = 'LOW';
    let fail_closed = false;

    if (base_language === 'unknown') {
      fail_closed = true;
      gate_decision = 'BLOCK';
      surface_verdict = 'SURFACE_BLOCK';
      severity = 'CRITICAL';
      reason_codes.push('SURFACE_BASE_LANGUAGE_MISSING');
    }

    if (!title_present) {
      fail_closed = true;
      gate_decision = 'BLOCK';
      surface_verdict = 'SURFACE_BLOCK';
      severity = 'CRITICAL';
      reason_codes.push('SURFACE_TITLE_MISSING');
    }

    if (!lead_present && !summary_present) {
      fail_closed = true;
      gate_decision = 'BLOCK';
      surface_verdict = 'SURFACE_BLOCK';
      severity = 'CRITICAL';
      reason_codes.push('SURFACE_CONTEXT_FIELDS_MISSING');
    }

    if (
      trust_binding.trust_verdict === 'MISSING' ||
      trust_binding.truth_outcome === 'MISSING' ||
      trust_binding.claim_gate === 'MISSING'
    ) {
      fail_closed = true;
      gate_decision = 'BLOCK';
      surface_verdict = 'SURFACE_BLOCK';
      severity = 'CRITICAL';
      reason_codes.push('SURFACE_TRUST_BINDING_INPUTS_MISSING');
    }

    if (!fail_closed) {
      if (trust_gate_authorization_result.gate_decision === 'BLOCK') {
        gate_decision = 'BLOCK';
        surface_verdict = 'SURFACE_BLOCK';
        severity = 'CRITICAL';
        reason_codes.push('SURFACE_TRUST_BLOCK_BOUND');
      } else if (trust_gate_authorization_result.gate_decision === 'REVIEW') {
        gate_decision = 'REVIEW';
        surface_verdict = 'SURFACE_REVIEW';
        severity = 'HIGH';
        reason_codes.push('SURFACE_TRUST_REVIEW_BOUND');
      } else if (trust_gate_authorization_result.gate_decision === 'CORRECTION') {
        gate_decision = 'CORRECTION';
        surface_verdict = 'SURFACE_CORRECTION';
        severity = 'MEDIUM';
        reason_codes.push('SURFACE_TRUST_CORRECTION_BOUND');
      }
    }

    const surfaceTextLower = [title, lead, summary].join(' ').toLowerCase();
    const certaintyPattern = /\b(guaranteed|guarantee|certain|undeniable|100%|no\s+risk|surefire|cannot\s+fail)\b/i;
    const sensationalPattern = /\b(shocking|explosive|panic|catastrophic|unbelievable)\b/i;

    if (!fail_closed && gate_decision === 'PASS' && certaintyPattern.test(surfaceTextLower)) {
      gate_decision = truth_gate_result.critical_truth_outcome === 'SUPPORTED' ? 'REVIEW' : 'BLOCK';
      surface_verdict = gate_decision === 'BLOCK' ? 'SURFACE_BLOCK' : 'SURFACE_REVIEW';
      severity = gate_decision === 'BLOCK' ? 'CRITICAL' : 'HIGH';
      reason_codes.push('SURFACE_UNSUPPORTED_CERTAINTY_LANGUAGE');
    }

    if (!fail_closed && gate_decision === 'PASS' && sensationalPattern.test(surfaceTextLower)) {
      gate_decision = 'REVIEW';
      surface_verdict = 'SURFACE_REVIEW';
      severity = 'HIGH';
      reason_codes.push('SURFACE_SENSATIONALISM_RISK');
    }

    if (reason_codes.length === 0) {
      reason_codes.push('SURFACE_ALIGNMENT_CONFIRMED');
    }

    const reasoning = `Surface gate verdict=${surface_verdict} with ${reason_codes.length} reason code(s): ${reason_codes.join(', ')}.`;

    return {
      gate_decision,
      surface_verdict,
      severity,
      reason_codes,
      reasoning,
      base_language,
      fail_closed,
      contributing_surface_fields: {
        title_present,
        lead_present,
        summary_present,
        trusted_term_overlap_ratio,
      },
      trust_binding,
    };
  }

  private computeSurfaceComplianceConfidence(result: SurfaceGateResult): number {
    const verdictPenalty =
      result.gate_decision === 'BLOCK' ? 55 :
      result.gate_decision === 'REVIEW' ? 35 :
      result.gate_decision === 'CORRECTION' ? 20 :
      0;

    const overlapPenalty = Math.round((1 - Math.max(0, Math.min(1, result.contributing_surface_fields.trusted_term_overlap_ratio))) * 15);
    const penalty = verdictPenalty + overlapPenalty + (result.fail_closed ? 20 : 0);
    return Math.max(0, Math.min(100, Math.round(100 - penalty)));
  }

  private evaluateEnTrMultilingualIntegrityGate(
    editions: Record<Language, LanguageEdition>,
    trust_gate_authorization_result: TrustGateResult,
    truth_gate_result: TruthGateResult,
    surface_compliance_result: SurfaceGateResult
  ): MultilingualIntegrityResult {
    const source_language: Language = 'en';
    const target_language: Language = 'tr';

    const sourceEdition = editions[source_language];
    const targetEdition = editions[target_language];

    const sourceHeadline = (sourceEdition?.content?.title || '').trim();
    const targetHeadline = (targetEdition?.content?.title || '').trim();
    const sourceSummary = ((sourceEdition?.content?.body?.summary || sourceEdition?.content?.lead) || '').trim();
    const targetSummary = ((targetEdition?.content?.body?.summary || targetEdition?.content?.lead) || '').trim();

    const checked_surfaces: MultilingualIntegrityResult['checked_surfaces'] = {
      headline_checked: sourceHeadline.length > 0 && targetHeadline.length > 0,
      summary_checked: sourceSummary.length > 0 && targetSummary.length > 0,
    };

    const trust_binding: MultilingualIntegrityResult['trust_binding'] = {
      trust_verdict: trust_gate_authorization_result?.trust_verdict ?? 'MISSING',
      source_surface_verdict: surface_compliance_result?.surface_verdict ?? 'MISSING',
      truth_outcome: truth_gate_result?.critical_truth_outcome ?? 'MISSING',
    };

    const reason_codes: string[] = [];
    let gate_decision: PECLGateDecision = 'PASS';
    let multilingual_verdict: MultilingualIntegrityResult['multilingual_verdict'] = 'MULTILINGUAL_PASS';
    let severity: MultilingualIntegrityResult['severity'] = 'LOW';
    let fail_closed = false;

    if (!checked_surfaces.headline_checked || !checked_surfaces.summary_checked) {
      fail_closed = true;
      gate_decision = 'BLOCK';
      multilingual_verdict = 'MULTILINGUAL_BLOCK';
      severity = 'CRITICAL';
      reason_codes.push('MULTILINGUAL_SURFACE_INPUTS_MISSING');
      if (!checked_surfaces.headline_checked) {
        reason_codes.push('MULTILINGUAL_HEADLINE_MISSING_EN_TR');
      }
      if (!checked_surfaces.summary_checked) {
        reason_codes.push('MULTILINGUAL_SUMMARY_MISSING_EN_TR');
      }
    }

    if (
      trust_binding.trust_verdict === 'MISSING' ||
      trust_binding.source_surface_verdict === 'MISSING' ||
      trust_binding.truth_outcome === 'MISSING'
    ) {
      fail_closed = true;
      gate_decision = 'BLOCK';
      multilingual_verdict = 'MULTILINGUAL_BLOCK';
      severity = 'CRITICAL';
      reason_codes.push('MULTILINGUAL_TRUST_BINDING_MISSING');
    }

    if (!fail_closed) {
      if (trust_gate_authorization_result.gate_decision === 'BLOCK') {
        gate_decision = 'BLOCK';
        multilingual_verdict = 'MULTILINGUAL_BLOCK';
        severity = 'CRITICAL';
        reason_codes.push('MULTILINGUAL_TRUST_BLOCK_BOUND');
      } else if (trust_gate_authorization_result.gate_decision === 'REVIEW') {
        gate_decision = 'REVIEW';
        multilingual_verdict = 'MULTILINGUAL_REVIEW';
        severity = 'HIGH';
        reason_codes.push('MULTILINGUAL_TRUST_REVIEW_BOUND');
      } else if (trust_gate_authorization_result.gate_decision === 'CORRECTION') {
        gate_decision = 'CORRECTION';
        multilingual_verdict = 'MULTILINGUAL_CORRECTION';
        severity = 'MEDIUM';
        reason_codes.push('MULTILINGUAL_TRUST_CORRECTION_BOUND');
      }
    }

    const sourceSurface = `${sourceHeadline} ${sourceSummary}`.toLowerCase();
    const targetSurface = `${targetHeadline} ${targetSummary}`.toLowerCase();

    const certaintyPattern = /\b(garanti|kesin|kesinlikle|risksiz|mutlak|ka\u00e7\u0131n\u0131lmaz|%100|100%|guaranteed|no\s+risk)\b/i;
    const sensationalPattern = /\b(sok|\u015fok|patlama|felaket|inanilmaz|inan\u0131lmaz|catastrophic|explosive|shocking)\b/i;

    const sourceCertainty = certaintyPattern.test(sourceSurface);
    const targetCertainty = certaintyPattern.test(targetSurface);
    if (!fail_closed && targetCertainty && !sourceCertainty) {
      gate_decision = truth_gate_result.critical_truth_outcome === 'SUPPORTED' ? 'REVIEW' : 'BLOCK';
      multilingual_verdict = gate_decision === 'BLOCK' ? 'MULTILINGUAL_BLOCK' : 'MULTILINGUAL_REVIEW';
      severity = gate_decision === 'BLOCK' ? 'CRITICAL' : 'HIGH';
      reason_codes.push('MULTILINGUAL_TR_CERTAINTY_INFLATION');
    }

    const sourceNumbers = new Set(sourceSurface.match(/%?\d+(?:[.,]\d+)?%?/g) || []);
    const targetNumbers = new Set(targetSurface.match(/%?\d+(?:[.,]\d+)?%?/g) || []);
    const addedNumbers = Array.from(targetNumbers).filter(n => !sourceNumbers.has(n));
    if (!fail_closed && addedNumbers.length > 0) {
      if (gate_decision === 'PASS') {
        gate_decision = 'REVIEW';
        multilingual_verdict = 'MULTILINGUAL_REVIEW';
        severity = 'HIGH';
      }
      reason_codes.push(`MULTILINGUAL_UNSUPPORTED_NUMERIC_ADDITION:${addedNumbers.length}`);
    }

    const sourceSensational = sensationalPattern.test(sourceSurface);
    const targetSensational = sensationalPattern.test(targetSurface);
    if (!fail_closed && targetSensational && !sourceSensational) {
      if (gate_decision === 'PASS') {
        gate_decision = 'REVIEW';
        multilingual_verdict = 'MULTILINGUAL_REVIEW';
        severity = 'HIGH';
      }
      reason_codes.push('MULTILINGUAL_EXAGGERATED_SURFACE_DRIFT');
    }

    if (reason_codes.length === 0) {
      reason_codes.push('MULTILINGUAL_ALIGNMENT_CONFIRMED');
    }

    const reasoning = `Multilingual EN->TR gate verdict=${multilingual_verdict} with ${reason_codes.length} reason code(s): ${reason_codes.join(', ')}.`;

    return {
      gate_decision,
      multilingual_verdict,
      severity,
      source_language,
      target_language,
      reason_codes,
      reasoning,
      fail_closed,
      checked_surfaces,
      trust_binding,
    };
  }

  private computeEnTrMultilingualIntegrityConfidence(result: MultilingualIntegrityResult): number {
    const verdictPenalty =
      result.gate_decision === 'BLOCK' ? 55 :
      result.gate_decision === 'REVIEW' ? 35 :
      result.gate_decision === 'CORRECTION' ? 18 :
      0;

    const penalty = verdictPenalty + (result.fail_closed ? 20 : 0);
    return Math.max(0, Math.min(100, Math.round(100 - penalty)));
  }

  private extractSurfaceTokens(text: string): Set<string> {
    const tokens = (text.toLowerCase().match(/[a-z0-9]+/g) || []).filter(token => token.length >= 4);
    return new Set(tokens);
  }

  private evaluateClaimAwareComplianceGate(
    mic: MasterIntelligenceCore,
    risk_assessment: RiskAssessmentResult,
    evidence_ledger_result: EvidenceLedgerResult,
    provenanceDigests: { claimGraphDigest: string; evidenceLedgerDigest: string }
  ): ClaimAwareComplianceResult {
    const total_claims = mic.truth_nucleus.claims.length;
    const verified_claims = mic.truth_nucleus.claims.filter(claim => claim.verification_status === 'verified').length;
    const unverified_claims = mic.truth_nucleus.claims.filter(claim => claim.verification_status === 'unverified').length;
    const disputed_claims = mic.truth_nucleus.claims.filter(claim => claim.verification_status === 'disputed').length;
    const unsupported_claims = disputed_claims + evidence_ledger_result.uncovered_claims.length;

    const facts_missing_sources = mic.truth_nucleus.facts.filter(
      fact => !Array.isArray(fact.sources) || fact.sources.length === 0
    ).length;

    const missing_claim_provenance =
      facts_missing_sources > 0 ||
      evidence_ledger_result.uncovered_claims.length > 0;

    const policy_block = risk_assessment.policy_risk >= this.config.max_policy_risk;
    const legal_block = risk_assessment.legal_risk >= this.config.max_legal_risk;
    const brand_block = risk_assessment.brand_safety_risk >= 75;
    const policy_review = risk_assessment.policy_risk >= 50;
    const legal_review = risk_assessment.legal_risk >= 50;
    const brand_review = risk_assessment.brand_safety_risk >= 55;

    const reason_codes: string[] = [];

    if (disputed_claims > 0) {
      reason_codes.push(`CLAIM_DISPUTED:${disputed_claims}`);
    }
    if (unverified_claims > 0) {
      reason_codes.push(`CLAIM_UNVERIFIED:${unverified_claims}`);
    }
    if (evidence_ledger_result.uncovered_claims.length > 0) {
      reason_codes.push(`CLAIM_EVIDENCE_UNCOVERED:${evidence_ledger_result.uncovered_claims.length}`);
    }
    if (facts_missing_sources > 0) {
      reason_codes.push(`CLAIM_PROVENANCE_MISSING:${facts_missing_sources}`);
    }

    if (policy_block) {
      reason_codes.push(`COMPLIANCE_POLICY_BLOCK:${risk_assessment.policy_risk.toFixed(1)}`);
    } else if (policy_review) {
      reason_codes.push(`COMPLIANCE_POLICY_REVIEW:${risk_assessment.policy_risk.toFixed(1)}`);
    }

    if (legal_block) {
      reason_codes.push(`COMPLIANCE_LEGAL_BLOCK:${risk_assessment.legal_risk.toFixed(1)}`);
    } else if (legal_review) {
      reason_codes.push(`COMPLIANCE_LEGAL_REVIEW:${risk_assessment.legal_risk.toFixed(1)}`);
    }

    if (brand_block) {
      reason_codes.push(`COMPLIANCE_BRAND_BLOCK:${risk_assessment.brand_safety_risk.toFixed(1)}`);
    } else if (brand_review) {
      reason_codes.push(`COMPLIANCE_BRAND_REVIEW:${risk_assessment.brand_safety_risk.toFixed(1)}`);
    }

    let gate_decision: PECLGateDecision = 'PASS';
    let severity: ClaimAwareComplianceResult['severity'] = 'LOW';

    if (disputed_claims > 0 || policy_block || legal_block || brand_block) {
      gate_decision = 'BLOCK';
      severity = 'CRITICAL';
    } else if (unverified_claims > 0 || missing_claim_provenance || policy_review || legal_review || brand_review) {
      gate_decision = 'REVIEW';
      severity = 'HIGH';
    } else if (evidence_ledger_result.weak_evidence_records > 0) {
      gate_decision = 'CORRECTION';
      severity = 'MEDIUM';
      reason_codes.push(`CLAIM_EVIDENCE_WEAK:${evidence_ledger_result.weak_evidence_records}`);
    }

    const reasoning =
      reason_codes.length === 0
        ? 'Claim provenance and compliance surface checks are within routing bounds.'
        : `Claim-aware/compliance gate flagged ${reason_codes.length} reason code(s): ${reason_codes.join(', ')}.`;

    return {
      gate_decision,
      severity,
      reason_codes,
      reasoning,
      claim_metrics: {
        total_claims,
        verified_claims,
        unverified_claims,
        disputed_claims,
        unsupported_claims,
      },
      provenance: {
        claim_graph_digest_prefix: provenanceDigests.claimGraphDigest.substring(0, 16),
        evidence_ledger_digest_prefix: provenanceDigests.evidenceLedgerDigest.substring(0, 16),
        missing_claim_provenance,
      },
      compliance_surface: {
        policy_risk: risk_assessment.policy_risk,
        legal_risk: risk_assessment.legal_risk,
        brand_safety_risk: risk_assessment.brand_safety_risk,
      },
    };
  }

  private computeClaimAwareComplianceConfidence(result: ClaimAwareComplianceResult): number {
    const penalty =
      result.claim_metrics.disputed_claims * 25 +
      result.claim_metrics.unverified_claims * 12 +
      result.claim_metrics.unsupported_claims * 15 +
      (result.provenance.missing_claim_provenance ? 20 : 0) +
      Math.max(0, result.compliance_surface.policy_risk - 40) * 0.25 +
      Math.max(0, result.compliance_surface.legal_risk - 40) * 0.25 +
      Math.max(0, result.compliance_surface.brand_safety_risk - 40) * 0.2;

    return Math.max(0, Math.min(100, Math.round(100 - penalty)));
  }
  
  /**
   * Computes final decision based on all inputs with strict priority:
   * 1. CRITICAL_RISK → ESCALATE
   * 2. CRITICAL_FAILURE → REJECT
   * 3. Batch Score >= 85 → APPROVE_ALL
   * 4. Batch Score >= 70 → APPROVE_PARTIAL
   * 5. Else → REJECT
   */
  private computeFinalDecision(
    approved: Language[],
    rejected: Language[],
    delayed: Language[],
    rule_checks: RuleCheckResult[],
    semantic_analysis: SemanticAnalysisResult | null,
    risk_assessment: RiskAssessmentResult,
    evaluations: EditionEvaluation[],
    confidence: DecisionConfidence,
    hard_rules: { violations: any[], hard_rule_hits: string[] },
    narrative_result: NarrativeResult,
    evidence_ledger_result: EvidenceLedgerResult,
    truth_gate_result: TruthGateResult,
    claim_aware_compliance_result: ClaimAwareComplianceResult,
    trust_gate_authorization_result: TrustGateResult,
    surface_compliance_result: SurfaceGateResult,
    multilingual_integrity_en_tr_result: MultilingualIntegrityResult,
    multilingual_result: MultilingualHeadlineResult
  ): Omit<ChiefEditorDecision, 'timestamp' | 'decision_trace'> {
    const reasons: string[] = []
    let overall_decision: OverallDecision = 'REJECT'
    let requires_supervisor_review = false
    let confidence_score = confidence.confidence_score
    const narrative_gate_decision = this.mapNarrativeToGateDecision(narrative_result)
    const evidence_gate_decision = this.mapEvidenceLedgerToGateDecision(evidence_ledger_result)
    const trust_gate_decision = trust_gate_authorization_result.gate_decision
    const surface_gate_decision = surface_compliance_result.gate_decision
    const multilingual_integrity_en_tr_decision = multilingual_integrity_en_tr_result.gate_decision
    const truth_gate_decision = truth_gate_result.gate_decision
    const claim_gate_decision = claim_aware_compliance_result.gate_decision

    // 0. MULTILINGUAL_HEADLINE_BLOCK → REJECT (Priority 0 - Non-pass Path)

    // 0.8. Trust Gate / Editorial Authorization Consolidation
    if (trust_gate_decision === 'BLOCK') {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      confidence_score = 0
      reasons.push(`Trust Gate Block: ${trust_gate_authorization_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons,
      }
    }

    if (trust_gate_decision === 'REVIEW') {
      overall_decision = 'ESCALATE'
      requires_supervisor_review = true
      reasons.push(`Trust Gate Review Required: ${trust_gate_authorization_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons,
      }
    }

    if (trust_gate_decision === 'CORRECTION') {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      reasons.push(`Trust Gate Correction Required: ${trust_gate_authorization_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons,
      }
    }

    // 0.85. Surface Compliance Pack / Publication Surface Binding
    if (surface_gate_decision === 'BLOCK') {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      confidence_score = 0
      reasons.push(`Surface Compliance Block: ${surface_compliance_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons,
      }
    }

    if (surface_gate_decision === 'REVIEW') {
      overall_decision = 'ESCALATE'
      requires_supervisor_review = true
      reasons.push(`Surface Compliance Review Required: ${surface_compliance_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons,
      }
    }

    if (surface_gate_decision === 'CORRECTION') {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      reasons.push(`Surface Compliance Correction Required: ${surface_compliance_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons,
      }
    }

    // 0.88. Multilingual Integrity Layer (EN->TR Surface Drift)
    if (multilingual_integrity_en_tr_decision === 'BLOCK') {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      confidence_score = 0
      reasons.push(`Multilingual Integrity Block (EN->TR): ${multilingual_integrity_en_tr_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons,
      }
    }

    if (multilingual_integrity_en_tr_decision === 'REVIEW') {
      overall_decision = 'ESCALATE'
      requires_supervisor_review = true
      reasons.push(`Multilingual Integrity Review Required (EN->TR): ${multilingual_integrity_en_tr_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons,
      }
    }

    if (multilingual_integrity_en_tr_decision === 'CORRECTION') {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      reasons.push(`Multilingual Integrity Correction Required (EN->TR): ${multilingual_integrity_en_tr_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons,
      }
    }

    if (multilingual_result.decision === "MULTILINGUAL_HEADLINE_BLOCK") {
      overall_decision = "REJECT";
      requires_supervisor_review = true;
      confidence_score = 0;
      reasons.push(`Multilingual Headline Block: ${multilingual_result.reasoning}`);

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons,
      };
    }

    // 0.5. MULTILINGUAL_HEADLINE_REVIEW_REQUIRED → ESCALATE (Priority 0.5 - Escalation Path)
    if (multilingual_result.decision === "MULTILINGUAL_HEADLINE_REVIEW_REQUIRED") {
      overall_decision = "ESCALATE";
      requires_supervisor_review = true;
      reasons.push(`Multilingual Headline Review Required: ${multilingual_result.reasoning}`);

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons,
      };
    }

    // 0.7. MULTILINGUAL_HEADLINE_CORRECTION_REQUIRED → REJECT (Priority 0.7 - Correction Path)
    if (multilingual_result.decision === "MULTILINGUAL_HEADLINE_CORRECTION_REQUIRED") {
      overall_decision = "REJECT";
      requires_supervisor_review = true; // Use review to handle correction plan
      reasons.push(`Multilingual Headline Correction Required: ${multilingual_result.reasoning}`);

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons,
      };
    }

    // 0.9. Truth Gate / Claim Graph Binding
    if (truth_gate_decision === 'BLOCK') {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      confidence_score = 0
      reasons.push(`Truth Gate Block: ${truth_gate_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    if (truth_gate_decision === 'REVIEW') {
      overall_decision = 'ESCALATE'
      requires_supervisor_review = true
      reasons.push(`Truth Gate Review Required: ${truth_gate_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    if (truth_gate_decision === 'CORRECTION') {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      reasons.push(`Truth Gate Correction Required: ${truth_gate_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    // 1. CRITICAL_RISK → ESCALATE (Priority 1)
    const hasCriticalRisk =
      risk_assessment.geopolitical_risk >= this.config.max_geopolitical_risk ||
      risk_assessment.policy_risk >= this.config.max_policy_risk ||
      risk_assessment.financial_risk >= this.config.max_financial_risk ||
      risk_assessment.legal_risk >= this.config.max_legal_risk ||
      risk_assessment.overall_risk_score >= this.config.max_overall_risk_score ||
      (semantic_analysis && semantic_analysis.consistency_score < this.config.min_consistency_score);

    if (hasCriticalRisk) {
      overall_decision = 'ESCALATE'
      requires_supervisor_review = true
      confidence_score = confidence.confidence_score

      if (risk_assessment.geopolitical_risk >= this.config.max_geopolitical_risk) reasons.push(`Critical Geopolitical Risk: ${risk_assessment.geopolitical_risk}`)
      if (risk_assessment.policy_risk >= this.config.max_policy_risk) reasons.push(`Critical Policy Risk: ${risk_assessment.policy_risk}`)
      if (risk_assessment.financial_risk >= this.config.max_financial_risk) reasons.push(`Critical Financial Risk: ${risk_assessment.financial_risk}`)
      if (risk_assessment.legal_risk >= this.config.max_legal_risk) reasons.push(`Critical Legal Risk: ${risk_assessment.legal_risk}`)
      if (risk_assessment.overall_risk_score >= this.config.max_overall_risk_score) reasons.push(`Critical Overall Risk: ${risk_assessment.overall_risk_score}`)
      if (semantic_analysis && semantic_analysis.consistency_score < this.config.min_consistency_score) reasons.push(`Critical Semantic Drift: ${semantic_analysis.consistency_score}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    // 2. HARD_RULE_VIOLATIONS → REJECT (Priority 2)
    if (hard_rules.violations.length > 0) {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      confidence_score = 0

      const violationReasons = [
        ...hard_rules.violations.slice(0, 3).map(v => `${v.rule_id}: ${v.message}`),
        hard_rules.violations.length > 3 ? `...and ${hard_rules.violations.length - 3} more` : undefined
      ].filter(Boolean) as string[]

      reasons.push(...violationReasons)

      if (hard_rules.hard_rule_hits.includes('POLICY_CRITICAL_AUDIT_ISSUES')) {
        reasons.push('1 critical issue(s) detected')
      }

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    // 2.25. Claim-Aware / Compliance Consolidation Gate
    if (claim_gate_decision === 'BLOCK') {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      confidence_score = 0
      reasons.push(`Claim-Aware Compliance Block: ${claim_aware_compliance_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    if (claim_gate_decision === 'REVIEW') {
      overall_decision = 'ESCALATE'
      requires_supervisor_review = true
      reasons.push(`Claim-Aware Compliance Review Required: ${claim_aware_compliance_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    if (claim_gate_decision === 'CORRECTION') {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      reasons.push(`Claim-Aware Compliance Correction Required: ${claim_aware_compliance_result.reasoning}`)

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    // 2.5. Editorial Backbone Consolidation Gates (Narrative + Evidence Ledger)
    if (narrative_gate_decision === 'BLOCK' || evidence_gate_decision === 'BLOCK') {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      confidence_score = 0

      if (narrative_gate_decision === 'BLOCK') {
        reasons.push(`Narrative Discipline Block: ${narrative_result.reasoning}`)
      }
      if (evidence_gate_decision === 'BLOCK') {
        reasons.push(`Evidence Ledger Block: ${evidence_ledger_result.reasoning}`)
      }

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    if (narrative_gate_decision === 'REVIEW' || evidence_gate_decision === 'REVIEW') {
      overall_decision = 'ESCALATE'
      requires_supervisor_review = true

      if (narrative_gate_decision === 'REVIEW') {
        reasons.push(`Narrative Discipline Review Required: ${narrative_result.reasoning}`)
      }
      if (evidence_gate_decision === 'REVIEW') {
        reasons.push(`Evidence Ledger Review Required: ${evidence_ledger_result.reasoning}`)
      }

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    if (narrative_gate_decision === 'CORRECTION' || evidence_gate_decision === 'CORRECTION') {
      overall_decision = 'REJECT'
      requires_supervisor_review = true

      if (narrative_gate_decision === 'CORRECTION') {
        reasons.push(`Narrative Discipline Correction Required: ${narrative_result.reasoning}`)
      }
      if (evidence_gate_decision === 'CORRECTION') {
        reasons.push(`Evidence Ledger Correction Required: ${evidence_ledger_result.reasoning}`)
      }

      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    // 3. CRITICAL_FAILURE → REJECT (Priority 3)
    const criticalRuleFailures = rule_checks.filter(
      r => !r.passed && r.severity === 'CRITICAL'
    )
    
    if (criticalRuleFailures.length > 0 || rejected.length >= 2) {
      overall_decision = 'REJECT'
      requires_supervisor_review = true
      confidence_score = 0
      
      for (const failure of criticalRuleFailures) {
        reasons.push(failure.details)
      }
      if (rejected.length >= 2 && !reasons.some(r => r.includes('failed audit'))) {
        reasons.push(`${rejected.length} languages failed audit`)
      }
      
      return {
        overall_decision,
        approved_languages: approved,
        rejected_languages: rejected,
        delayed_languages: delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    // 3. Score >= 85 AND All Approved AND Multilingual PASS → APPROVE_ALL
    const batchScore = evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.audit_score, 0) / evaluations.length
      : 0

    const multilingualPass = multilingual_result.decision === "MULTILINGUAL_HEADLINE_PASS";

    if (batchScore >= 85 && approved.length === 9 && multilingualPass) {
      overall_decision = 'APPROVE_ALL'
      reasons.push(`All 9 languages passed with high quality (Score: ${batchScore.toFixed(1)})`)

      if (confidence.confidence_score < DEFAULT_CONFIDENCE_CONFIG.min_confidence_approve_all) {
        reasons.push(`Confidence too low for APPROVE_ALL: ${confidence.confidence_score}`)
        overall_decision =
          confidence.confidence_score >= DEFAULT_CONFIDENCE_CONFIG.min_confidence_partial
            ? 'APPROVE_PARTIAL'
            : 'REJECT'
        requires_supervisor_review = overall_decision === 'REJECT' ? true : batchScore < 85
      } else {
        requires_supervisor_review = false
      }

      const approvedForDecision =
        overall_decision === 'APPROVE_ALL'
          ? approved
          : overall_decision === 'APPROVE_PARTIAL'
            ? approved.slice(0, Math.min(this.config.min_languages_for_partial, approved.length))
            : []

      return {
        overall_decision,
        approved_languages: approvedForDecision,
        rejected_languages: overall_decision === 'REJECT' ? rejected : [],
        delayed_languages: overall_decision === 'APPROVE_PARTIAL' ? delayed : [],
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    // 4. Score >= 70 AND Min Languages Approved → APPROVE_PARTIAL
    if (batchScore >= 70 && approved.length >= this.config.min_languages_for_partial) {
      overall_decision = 'APPROVE_PARTIAL'
      reasons.push(`Partial approval (Score: ${batchScore.toFixed(1)}, Approved: ${approved.length})`)

      if (confidence.confidence_score < DEFAULT_CONFIDENCE_CONFIG.min_confidence_partial) {
        overall_decision = 'REJECT'
        reasons.push(`Confidence too low for APPROVE_PARTIAL: ${confidence.confidence_score}`)
        requires_supervisor_review = true
      } else {
        requires_supervisor_review = batchScore < 85
      }

      return {
        overall_decision,
        approved_languages: overall_decision === 'APPROVE_PARTIAL' ? approved : [],
        rejected_languages: overall_decision === 'APPROVE_PARTIAL' ? rejected : rejected,
        delayed_languages: overall_decision === 'APPROVE_PARTIAL' ? delayed : delayed,
        reasons,
        requires_supervisor_review,
        requires_manual_review: requires_supervisor_review,
        confidence_score,
        confidence_band: confidence.confidence_band,
        confidence_reasons: confidence.reasons
      }
    }

    // 5. Else → REJECT
    overall_decision = 'REJECT'
    reasons.push(`Batch quality below threshold (Score: ${batchScore.toFixed(1)}, Approved: ${approved.length})`)
    return {
      overall_decision,
      approved_languages: approved,
      rejected_languages: rejected,
      delayed_languages: delayed,
      reasons,
      requires_supervisor_review: true,
      requires_manual_review: true,
      confidence_score: confidence_score,
      confidence_band: confidence.confidence_band,
      confidence_reasons: confidence.reasons
    }
  }
  
  /**
   * Validates brand safety threshold
   */
  async validate_brand_safety_threshold(
    edition: LanguageEdition
  ): Promise<{
    safe: boolean
    violations: Array<{
      type: 'policy' | 'legal' | 'brand'
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      description: string
    }>
  }> {
    const violations: Array<{
      type: 'policy' | 'legal' | 'brand'
      severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
      description: string
    }> = []
    
    // Defensive: ensure audit_results and issues exist
    const issues = edition?.audit_results?.issues ?? [];
    
    // Check for policy violations
    const policyIssues = issues.filter(
      issue => issue.cell === 'policy_cell'
    )
    
    for (const issue of policyIssues) {
      violations.push({
        type: 'policy',
        severity: issue.severity,
        description: issue.description
      })
    }
    
    // Check for tone issues (brand safety)
    const toneIssues = issues.filter(
      issue => issue.cell === 'tone_cell' && issue.severity === 'HIGH'
    )
    
    for (const issue of toneIssues) {
      violations.push({
        type: 'brand',
        severity: issue.severity,
        description: issue.description
      })
    }
    
    return {
      safe: violations.length === 0,
      violations
    }
  }
  
  /**
   * Compares cross-language consistency
   */
  async compare_cross_language_consistency(
    editions: Record<Language, LanguageEdition>,
    mic: MasterIntelligenceCore
  ): Promise<{
    consistent: boolean
    inconsistencies: Array<{
      language_pair: [Language, Language]
      field: string
      issue: string
    }>
  }> {
    const semantic_result = await this.semanticAnalyzer.analyzeConsistency(editions, mic)
    
    const inconsistencies = semantic_result.inconsistencies.map(inc => ({
      language_pair: inc.language_pair,
      field: inc.field,
      issue: inc.description
    }))
    
    return {
      consistent: !semantic_result.drift_detected,
      inconsistencies
    }
  }
  
  /**
   * Final approval decision (wrapper for makeDecision)
   */
  async approve_for_publish(
    batch: BatchJob,
    mic: MasterIntelligenceCore
  ): Promise<{
    approved_languages: Language[]
    rejected_languages: Language[]
    requires_supervisor_review: Language[]
  }> {
    const decision = await this.makeDecision(batch, mic)
    
    return {
      approved_languages: decision.approved_languages,
      rejected_languages: decision.rejected_languages,
      requires_supervisor_review: decision.requires_supervisor_review 
        ? decision.delayed_languages 
        : []
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalChiefEditor: ChiefEditorEngine | null = null

export function getGlobalChiefEditor(
  config: ChiefEditorConfig = DEFAULT_CHIEF_EDITOR_CONFIG
): ChiefEditorEngine {
  if (!globalChiefEditor) {
    globalChiefEditor = new ChiefEditorEngine(config)
  }
  return globalChiefEditor
}

export function resetGlobalChiefEditor(): void {
  globalChiefEditor = null
}

// ============================================================================
// EXPORT
// ============================================================================

export default ChiefEditorEngine
