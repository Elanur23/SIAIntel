import { Language } from '../search/types'
import { CellType } from './field-dependency-engine'
import { ConfidenceBand } from './stabilization/types'
import { MultilingualHeadlineResult } from '../sia-news/failure-engine/multilingual-headline-integrity'
import type { NarrativeResult } from '../sia-news/failure-engine/types'
import { PECLMode } from './stabilization/types'

export type { Language }

/**
 * PECL CANONICAL DECISION VOCABULARY
 */
export type PECLDecisionStatus =
  | 'PUBLISH_APPROVED'
  | 'REMEDIATION_REQUIRED'
  | 'ESCALATION_REQUIRED'
  | 'TERMINAL_BLOCK';

export type PECLGateDecision = 'PASS' | 'CORRECTION' | 'REVIEW' | 'BLOCK';

export type TruthClassification = 'SUPPORTED' | 'DISPUTED' | 'UNVERIFIABLE' | 'PROVENANCE_MISSING';

export type TrustGateVerdict = 'TRUST_PASS' | 'TRUST_CORRECTION' | 'TRUST_REVIEW' | 'TRUST_BLOCK';

export type SurfaceGateVerdict = 'SURFACE_PASS' | 'SURFACE_CORRECTION' | 'SURFACE_REVIEW' | 'SURFACE_BLOCK';

export type MultilingualIntegrityVerdict =
  | 'MULTILINGUAL_PASS'
  | 'MULTILINGUAL_CORRECTION'
  | 'MULTILINGUAL_REVIEW'
  | 'MULTILINGUAL_BLOCK';

export type RemediationRecommendedAction =
  | 'CORRECTION_REQUIRED'
  | 'HUMAN_REVIEW'
  | 'ABANDON'
  | 'RETRY_LATER';

export type RemediationConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type RemediationCategory =
  | 'LOW_RISK_SURFACE_PACKAGING'
  | 'LOW_RISK_MULTILINGUAL_SURFACE_DRIFT'
  | 'HIGH_RISK_TRUTH_OR_TRUST'
  | 'HIGH_RISK_CLAIM_OR_EVIDENCE'
  | 'STRUCTURAL_PROVIDER_FAILURE'
  | 'UNCLASSIFIED_HIGH_RISK';

export type EscalationTier =
  | 'HUMAN_REVIEW_REQUIRED'
  | 'SUPERVISOR_REVIEW_REQUIRED'
  | 'TERMINAL_REJECT';

export type EscalationSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type HeadlineAssessmentSeverity = 'LOW' | 'MEDIUM' | 'HIGH';

export type HeadlineAssessmentConfidence = 'LOW' | 'MEDIUM' | 'HIGH';

export type HeadlineRoutingAction =
  | 'NONE'
  | 'CORRECTION_REQUIRED'
  | 'HUMAN_REVIEW_REQUIRED'
  | 'SUPERVISOR_REVIEW_REQUIRED'
  | 'TERMINAL_REJECT';

export type HeadlineControlAction = 'ALLOW' | 'CORRECT' | 'REVIEW' | 'BLOCK';

export type HeadlineEscalationClass =
  | 'NONE'
  | 'LEGAL_REVIEW'
  | 'MARKET_RISK_REVIEW'
  | 'REGULATORY_REVIEW'
  | 'PUBLIC_PANIC_REVIEW'
  | 'MULTILINGUAL_EDITOR_REVIEW'
  | 'SENIOR_EDITOR_REVIEW'
  | 'HIGH_TRAFFIC_HIGH_RISK_REVIEW';

export type HeadlineCalibrationBand = 'GREEN' | 'AMBER' | 'RED';

export type HeadlineOperationalMode =
  | 'SHADOW_ONLY'
  | 'LOG_AND_SCORE'
  | 'SOFT_ENFORCEMENT'
  | 'HARD_BLOCK_FOR_HIGH_CONFIDENCE_ONLY';

export interface HeadlineTitleSurfaceCalibration {
  minLexicalOverlap: number;
  certaintySkewOverlapGuard: number;
  maxAllowedInconsistentPairs: number;
}

export interface HeadlineMultilingualCalibration {
  semanticVarianceThreshold: number;
  certaintyAmplificationDelta: number;
  localExaggerationDelta: number;
  languagePairVarianceThresholds: Record<string, number>;
}

export interface HeadlineEscalationCalibration {
  hardBlockCompositeThreshold: number;
  highConfidenceHardBlockScore: number;
  highConfidenceHardBlockRuleHits: number;
}

export type HeadlineRuleFamily =
  | 'THESIS_DRIFT'
  | 'EVIDENCE_MISMATCH'
  | 'UNSUPPORTED_CERTAINTY'
  | 'EMOTIONAL_INFLATION'
  | 'PANIC_FRAMING'
  | 'CURIOSITY_GAP'
  | 'CLICKBAIT_TEMPLATE'
  | 'TITLE_BODY_MISMATCH'
  | 'TITLE_LEDE_MISMATCH'
  | 'MISLEADING_NUMBER_OR_DATE'
  | 'PSEUDO_AUTHORITY_LANGUAGE'
  | 'LEGAL_RISK_LANGUAGE'
  | 'MARKET_MOVING_RISK'
  | 'REGULATORY_MISSTATEMENT'
  | 'MULTILINGUAL_DRIFT'
  | 'LOCAL_LANGUAGE_EXAGGERATION'
  | 'TITLE_SURFACE_INCONSISTENCY';

export type HeadlineArticleType =
  | 'BREAKING_NEWS'
  | 'ANALYSIS'
  | 'EXPLAINER'
  | 'MARKET_REPORT'
  | 'MACRO_ECONOMY'
  | 'CRYPTO'
  | 'AI_TECH'
  | 'POLICY_REGULATION'
  | 'LEGAL_ENFORCEMENT'
  | 'COMPANY_EARNINGS'
  | 'DATA_DRIVEN_REPORT'
  | 'PANIC_SENSITIVE';

export type HeadlineScoreDimension =
  | 'thesisFidelity'
  | 'evidenceAlignment'
  | 'entityAccuracy'
  | 'numberDateAccuracy'
  | 'attributionQuality'
  | 'clarity'
  | 'specificity'
  | 'credibility'
  | 'emotionalRestraint'
  | 'platformSafety'
  | 'curiosityWithoutDeception'
  | 'titleIntegrity'
  | 'multilingualPortability'
  | 'categoryAppropriateness'
  | 'articleTypeAppropriateness';

export type HeadlineDimensionMeasurement = 'RULE_BASED' | 'MODEL_JUDGED' | 'MIXED';

export type HeadlineDimensionStatus = 'PASS' | 'SOFT_CORRECTION' | 'BLOCK' | 'ESCALATE';

export type HeadlineOverallDecision =
  | 'HEADLINE_PASS'
  | 'HEADLINE_CORRECTION_REQUIRED'
  | 'HEADLINE_REVIEW_REQUIRED'
  | 'HEADLINE_BLOCK';

export type TitleSurfaceName =
  | 'EDITORIAL_HEADLINE'
  | 'CANONICAL_TITLE'
  | 'SEO_TITLE'
  | 'OG_TITLE'
  | 'SOCIAL_TITLE'
  | 'HOMEPAGE_TITLE';

export interface HeadlineRuleDefinition {
  ruleId: HeadlineRuleFamily;
  normalizedReasonCode: string;
  severity: HeadlineAssessmentSeverity;
  description: string;
  defaultControlAction: HeadlineControlAction;
  correctionHint: string;
  escalationClass: HeadlineEscalationClass;
}

export type HeadlineEvidenceRefType =
  | 'DECISION_DNA_CLAIM_DIGEST'
  | 'MANIFEST_HASH'
  | 'ARTICLE_THESIS_MARKER'
  | 'LEDE_ANCHOR'
  | 'BODY_ANCHOR'
  | 'LANGUAGE_EDITION_METADATA'
  | 'TITLE_SURFACE_SOURCE_MAPPING'
  | 'TRACE_SIGNAL';

export interface HeadlineEvidenceRef {
  refType: HeadlineEvidenceRefType;
  ref: string;
  context?: string;
}

export interface HeadlineRuleHit {
  ruleId: HeadlineRuleFamily;
  normalizedReasonCode: string;
  severity: HeadlineAssessmentSeverity;
  explanation: string;
  affectedSurface: TitleSurfaceName | 'MULTILINGUAL_LAYER';
  offendingSurface?: TitleSurfaceName | 'MULTILINGUAL_LAYER';
  offendingText?: string;
  offendingPattern?: string;
  language: Language | 'cross-language';
  evidenceRefs: HeadlineEvidenceRef[];
  suggestedFix: string;
  escalationClass: HeadlineEscalationClass;
}

export interface HeadlineDimensionThresholds {
  passThreshold: number;
  softCorrectionThreshold: number;
  blockThreshold: number;
  escalationThreshold: number;
}

export interface HeadlineDimensionScore {
  dimension: HeadlineScoreDimension;
  description: string;
  measuredBy: HeadlineDimensionMeasurement;
  thresholds: HeadlineDimensionThresholds;
  score: number;
  status: HeadlineDimensionStatus;
  signals: string[];
}

export interface HeadlineCorrectionRecommendation {
  recommendationId: string;
  action: string;
  targetSurface: TitleSurfaceName | 'MULTILINGUAL_LAYER';
  rationale: string;
  affectedRuleIds: HeadlineRuleFamily[];
  ruleMappingEvidence?: string[];
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface HeadlineResolvedSurface {
  surface: TitleSurfaceName;
  value: string;
  source: 'explicit' | 'fallback';
}

export interface HeadlineTitleSurfaceAssessment {
  resolvedSurfaces: HeadlineResolvedSurface[];
  sharedThesisScore: number;
  inconsistentPairs: Array<{
    left: TitleSurfaceName;
    right: TitleSurfaceName;
    reason: string;
  }>;
  deterministicFallbacksApplied: TitleSurfaceName[];
  calibration: HeadlineTitleSurfaceCalibration;
}

export interface HeadlineMultilingualDriftRecord {
  language: Language;
  driftScore: number;
  driftClass: 'LOW' | 'MEDIUM' | 'HIGH';
  violatedInvariants: string[];
  certaintyAmplification: boolean;
  localExaggeration: boolean;
  pairThreshold: number;
  action: HeadlineControlAction;
}

export interface HeadlineMultilingualAssessment {
  sourceLanguage: Language;
  invariants: {
    coreActor: boolean;
    coreAction: boolean;
    numberDateFacts: boolean;
    thesisPolarity: boolean;
    legalRegulatoryMeaning: boolean;
    marketMovingMeaning: boolean;
  };
  driftByLanguage: HeadlineMultilingualDriftRecord[];
  semanticVarianceThreshold: number;
  calibration: HeadlineMultilingualCalibration;
}

export interface HeadlineMetricsModel {
  blockedHeadlineCandidate: boolean;
  correctedHeadlineCandidate: boolean;
  escalationCandidate: boolean;
  perCategoryFailureKey: string;
  perLanguageDriftRate: Record<string, number>;
  titleSurfaceInconsistencyRate: number;
  highCtrLowTrustPattern: boolean;
  headlineFamilyFingerprint: string;
}

export interface HeadlineGateResult {
  overallDecision: HeadlineOverallDecision;
  calibrationBand: HeadlineCalibrationBand;
  operationalMode: HeadlineOperationalMode;
  calibrationProfileId: string;
  compositeHeadlineScore: number;
  scoreBreakdown: HeadlineDimensionScore[];
  ruleHits: HeadlineRuleHit[];
  correctionRecommendations: HeadlineCorrectionRecommendation[];
  escalationRequired: boolean;
  escalationClass: HeadlineEscalationClass;
  multilingualAssessment: HeadlineMultilingualAssessment;
  titleSurfaceAssessment: HeadlineTitleSurfaceAssessment;
  articleType: HeadlineArticleType;
  category: string;
  calibration: {
    titleSurface: HeadlineTitleSurfaceCalibration;
    multilingual: HeadlineMultilingualCalibration;
    escalation: HeadlineEscalationCalibration;
  };
  metricsModel: HeadlineMetricsModel;
  evaluatedAt: string;
}

export interface RemediationClassificationResult {
  remediation_present: boolean;
  remediable: boolean;
  category: RemediationCategory;
  reason_code: string;
  recommended_action: RemediationRecommendedAction;
  confidence: RemediationConfidence;
  fail_closed: boolean;
  source_gate_ids: string[];
  source_reason_codes: string[];
  source_languages: Language[];
}

export interface EscalationRecord {
  escalation_present: boolean;
  escalation_tier: EscalationTier;
  source_gate: string;
  reason_code: string;
  severity: EscalationSeverity;
  timestamp: string;
  decision_id: string;
  fail_closed?: boolean;
  remediation_recommended_action?: RemediationRecommendedAction;
  remediation_reason_code?: string;
  escalation_class?: HeadlineEscalationClass;
  headline_rule_ids?: HeadlineRuleFamily[];
}

export interface HeadlineAssessmentRecord {
  headline_assessment_present: boolean;
  passed: boolean;
  issues: string[];
  reason_code: string;
  severity: HeadlineAssessmentSeverity;
  confidence: HeadlineAssessmentConfidence;
  routing_action: HeadlineRoutingAction;
  alignment_score?: number;
  fail_closed?: boolean;
  source_gate_ids: string[];
  source_reason_codes: string[];
  source_languages: Language[];
  escalation_class?: HeadlineEscalationClass;
  rule_hits?: HeadlineRuleHit[];
  correction_recommendations?: HeadlineCorrectionRecommendation[];
  headline_gate_result?: HeadlineGateResult;
  timestamp: string;
  decision_id: string;
}

export type HeadlineEditorActionType =
  | 'APPROVE_AS_IS'
  | 'ACCEPT_SUGGESTED_FIX'
  | 'MANUAL_REVISION'
  | 'REQUEST_REWRITE'
  | 'ESCALATE_SENIOR_EDITOR'
  | 'ESCALATE_LEGAL_REVIEW'
  | 'ESCALATE_MARKET_REVIEW'
  | 'HOLD_FROM_PUBLISH';

export type HeadlineEditorUrgency = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type HeadlineEditorReviewVisibility =
  | 'EDITOR_MANDATORY'
  | 'EDITOR_OPTIONAL'
  | 'INTERNAL_DEBUG_ONLY';

export interface HeadlineEditorReviewHeader {
  contractVersion: string;
  generatedAt: string;
  batchId: string;
  traceId: string;
  auditId: string;
  decisionDnaAuditId: string | null;
  sourceGate: string;
  operationalMode: HeadlineOperationalMode | 'UNKNOWN';
  calibrationBand: HeadlineCalibrationBand | 'UNKNOWN';
  calibrationProfileId: string | null;
  category: string | null;
  articleType: HeadlineArticleType | 'UNKNOWN';
}

export interface HeadlineEditorDecisionSummary {
  oneLineRecommendation: string;
  overallDecision: HeadlineOverallDecision;
  routingAction: HeadlineRoutingAction;
  severity: HeadlineAssessmentSeverity;
  confidence: HeadlineAssessmentConfidence;
  urgency: HeadlineEditorUrgency;
  holdFromPublish: boolean;
  escalationRequired: boolean;
  escalationClass: HeadlineEscalationClass;
  recommendedAction: HeadlineEditorActionType;
}

export interface HeadlineEditorTopReason {
  rank: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  ruleId: HeadlineRuleFamily | 'UNMAPPED_REASON';
  reasonCode: string;
  policyLabel: string;
  shortExplanation: string;
  whyItMatters: string;
  offendingSurface: TitleSurfaceName | 'MULTILINGUAL_LAYER' | 'UNKNOWN';
  offendingTextSnippet: string | null;
  offendingPattern: string | null;
  language: Language | 'cross-language';
  suggestedFix: string;
  escalationClass: HeadlineEscalationClass;
  evidenceSummary: string[];
}

export interface HeadlineEditorCorrectionSuggestion {
  recommendationId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  action: string;
  targetSurface: TitleSurfaceName | 'MULTILINGUAL_LAYER';
  rationale: string;
  affectedRules: HeadlineRuleFamily[];
  ruleMappingEvidence: string[];
}

export interface HeadlineEditorTitleSurfaceSummary {
  visibility: HeadlineEditorReviewVisibility;
  status: 'ALIGNED' | 'DIVERGENT' | 'NOT_EVALUATED';
  sharedThesisScore: number | null;
  inconsistentPairCount: number;
  problematicPairs: Array<{
    left: TitleSurfaceName;
    right: TitleSurfaceName;
    reason: string;
  }>;
  editorNote: string;
}

export interface HeadlineEditorMultilingualSummary {
  visibility: HeadlineEditorReviewVisibility;
  status: 'STABLE' | 'DRIFT_DETECTED' | 'NOT_EVALUATED';
  sourceLanguage: Language | 'unknown';
  impactedLanguages: Language[];
  highRiskLanguages: Language[];
  maxDriftScore: number | null;
  driftHighlights: Array<{
    language: Language;
    driftClass: 'LOW' | 'MEDIUM' | 'HIGH';
    driftScore: number;
    certaintyAmplification: boolean;
    localExaggeration: boolean;
    action: HeadlineControlAction;
    summary: string;
  }>;
  editorNote: string;
}

export interface HeadlineEditorEscalationSummary {
  visibility: HeadlineEditorReviewVisibility;
  escalationRequired: boolean;
  escalationClass: HeadlineEscalationClass;
  escalationReason: string;
  escalationInstruction: string;
}

export interface HeadlineEditorProvenanceSummary {
  visibility: HeadlineEditorReviewVisibility;
  decisionId: string | null;
  traceId: string;
  sourceGateIds: string[];
  sourceReasonCodes: string[];
  evidenceRefs: HeadlineEvidenceRef[];
}

export interface HeadlineEditorReviewActionDefinition {
  action: HeadlineEditorActionType;
  label: string;
  description: string;
  minimumFields: string[];
}

export interface HeadlineEditorFieldPriority {
  mandatoryEditorFields: string[];
  optionalEditorFields: string[];
  internalDebugFields: string[];
}

export interface HeadlineEditorInternalDebug {
  visibility: HeadlineEditorReviewVisibility;
  rawRuleIds: HeadlineRuleFamily[];
  rawReasonCodes: string[];
  rawEvidenceByRule: Array<{
    ruleId: HeadlineRuleFamily;
    evidenceRefs: HeadlineEvidenceRef[];
  }>;
  rawCalibration: {
    profileId: string | null;
    titleSurface: HeadlineTitleSurfaceCalibration | null;
    multilingual: HeadlineMultilingualCalibration | null;
    escalation: HeadlineEscalationCalibration | null;
  };
  rawDriftRecords: HeadlineMultilingualDriftRecord[];
  rawPayloadPointers: string[];
}

export interface HeadlineEditorReviewPayloadV1 {
  reviewHeader: HeadlineEditorReviewHeader;
  decisionSummary: HeadlineEditorDecisionSummary;
  topReasons: HeadlineEditorTopReason[];
  correctionSuggestions: HeadlineEditorCorrectionSuggestion[];
  titleSurfaceSummary: HeadlineEditorTitleSurfaceSummary;
  multilingualSummary: HeadlineEditorMultilingualSummary;
  escalationSummary: HeadlineEditorEscalationSummary;
  provenanceSummary: HeadlineEditorProvenanceSummary;
  fieldPriority: HeadlineEditorFieldPriority;
  reviewActionModel: HeadlineEditorReviewActionDefinition[];
  internalDebug?: HeadlineEditorInternalDebug;
}

export interface TrustGateResult {
  gate_decision: PECLGateDecision;
  trust_verdict: TrustGateVerdict;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason_codes: string[];
  reasoning: string;
  fail_closed: boolean;
  contributing_signals: {
    narrative_gate: PECLGateDecision | 'MISSING';
    evidence_gate: PECLGateDecision | 'MISSING';
    truth_gate: PECLGateDecision | 'MISSING';
    claim_compliance_gate: PECLGateDecision | 'MISSING';
  };
}

export interface SurfaceGateResult {
  gate_decision: PECLGateDecision;
  surface_verdict: SurfaceGateVerdict;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason_codes: string[];
  reasoning: string;
  base_language: Language | 'unknown';
  fail_closed: boolean;
  contributing_surface_fields: {
    title_present: boolean;
    lead_present: boolean;
    summary_present: boolean;
    trusted_term_overlap_ratio: number;
  };
  trust_binding: {
    trust_verdict: TrustGateResult['trust_verdict'] | 'MISSING';
    truth_outcome: TruthGateResult['critical_truth_outcome'] | 'MISSING';
    claim_gate: PECLGateDecision | 'MISSING';
  };
}

export interface MultilingualIntegrityResult {
  gate_decision: PECLGateDecision;
  multilingual_verdict: MultilingualIntegrityVerdict;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  source_language: Language;
  target_language: Language;
  reason_codes: string[];
  reasoning: string;
  fail_closed: boolean;
  checked_surfaces: {
    headline_checked: boolean;
    summary_checked: boolean;
  };
  trust_binding: {
    trust_verdict: TrustGateResult['trust_verdict'] | 'MISSING';
    source_surface_verdict: SurfaceGateResult['surface_verdict'] | 'MISSING';
    truth_outcome: TruthGateResult['critical_truth_outcome'] | 'MISSING';
  };
}

export interface TruthGateResult {
  gate_decision: PECLGateDecision;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  critical_truth_outcome: TruthClassification;
  reason_codes: string[];
  reasoning: string;
  truth_markers: {
    total_critical_claims: number;
    supported_claims: number;
    disputed_claims: number;
    unverifiable_claims: number;
    unsupported_claims: number;
    provenance_missing_claims: number;
  };
  provenance_binding: {
    claim_graph_digest_prefix: string;
    evidence_ledger_digest_prefix: string;
    bound_to_provenance: boolean;
  };
}

export interface ClaimAwareComplianceResult {
  gate_decision: PECLGateDecision;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason_codes: string[];
  reasoning: string;
  claim_metrics: {
    total_claims: number;
    verified_claims: number;
    unverified_claims: number;
    disputed_claims: number;
    unsupported_claims: number;
  };
  provenance: {
    claim_graph_digest_prefix: string;
    evidence_ledger_digest_prefix: string;
    missing_claim_provenance: boolean;
  };
  compliance_surface: {
    policy_risk: number;
    legal_risk: number;
    brand_safety_risk: number;
  };
}

/**
 * PECS SOVEREIGN CONTRACTS (V7.0)
 */

export interface LockedContentPackage {
  payload_id: string;
  manifest_id: string;
  manifest_version: string;
  timestamp: string;
  base_language: string;
  expected_languages: string[];
  content: {
    headlines: Record<string, string>;
    slugs: Record<string, string>;
    leads: Record<string, string>;
    bodies: Record<string, string>;
    summaries: Record<string, string>;
  };
  intelligence: {
    claim_graph_hash: string;
    evidence_ledger_ref: string;
    trust_score_upstream: number;
  };
  metadata: {
    topic_sensitivity: "STANDARD" | "HIGH" | "CRITICAL";
    category: string;
    urgency: "STANDARD" | "BREAKING";
  };
}

export interface StructuredRemediationPayload {
  remediation_id: string;
  source_gate: string;
  instructions: Array<{
    target_node: string;
    violation_type: string;
    current_value: string;
    expected_constraint: string;
    operation: "REGENERATE" | "MODIFY" | "DELETE";
  }>;
  retry_policy: {
    retry_count: number;
    max_retry_loops: number;
    loop_guard_key: string;
  };
}

export interface SovereignGateResult {
  gate_id: string;
  gate_version: string;
  manifest_hash: string;
  trace_id: string;
  decision: PECLGateDecision;
  severity: string;
  confidence_score: number;
  risk_reasons: string[];
  reasoning: string;
  affected_languages: string[];
  mitigation_instructions: StructuredRemediationPayload | null;
  reason_codes?: string[];
  claim_metrics?: ClaimAwareComplianceResult['claim_metrics'];
  provenance_metrics?: ClaimAwareComplianceResult['provenance'];
  compliance_surface?: ClaimAwareComplianceResult['compliance_surface'];
  truth_classification?: TruthGateResult['critical_truth_outcome'];
  truth_markers?: TruthGateResult['truth_markers'];
  truth_provenance_binding?: TruthGateResult['provenance_binding'];
  trust_verdict?: TrustGateResult['trust_verdict'];
  trust_fail_closed?: TrustGateResult['fail_closed'];
  trust_contributing_signals?: TrustGateResult['contributing_signals'];
  surface_verdict?: SurfaceGateResult['surface_verdict'];
  surface_fail_closed?: SurfaceGateResult['fail_closed'];
  surface_base_language?: SurfaceGateResult['base_language'];
  surface_fields?: SurfaceGateResult['contributing_surface_fields'];
  surface_trust_binding?: SurfaceGateResult['trust_binding'];
  multilingual_verdict?: MultilingualIntegrityResult['multilingual_verdict'];
  multilingual_source_language?: MultilingualIntegrityResult['source_language'];
  multilingual_target_language?: MultilingualIntegrityResult['target_language'];
  multilingual_fail_closed?: MultilingualIntegrityResult['fail_closed'];
  multilingual_checked_surfaces?: MultilingualIntegrityResult['checked_surfaces'];
  multilingual_trust_binding?: MultilingualIntegrityResult['trust_binding'];
  execution_telemetry: {
    status_code: number;
    latency_ms: number;
    started_at: string;
    completed_at: string;
  };
}

export interface PECLDecision {
  final_decision: PECLDecisionStatus;
  final_severity: string;
  publish_authorization_state: boolean;
  token_issuance_eligible: boolean;
  veto_source_gate: string | null;
  authorized_languages: string[];
  quarantined_languages: string[];
  trace_id: string;
  manifest_hash: string;
  p2p_token?: string; // Signed JWS attached to decision
  issued_at: string;
  mode: PECLMode;
}

/**
 * PECL Authorization Envelope
 * Bound to manifest and time-scoped.
 */
export interface PECLAuthorizationEnvelope {
  version: string;
  manifest_hash: string;
  payload_id: string;
  authorized_languages: string[];
  expires_at: number;
  issued_at: number;
  signature_placeholder?: string; // To be replaced by real KMS signature
}

export interface DecisionDNA {
  audit_id: string;
  payload_id: string;
  p2p_token: string; // Mandatory PECL Authorization Token
  manifest_hash: string;
  trace_id: string;
  contract_version: string;
  gate_results: SovereignGateResult[];
  final_decision: PECLDecision;
  remediation_history_count: number;
  override_metadata: any | null;
}

export interface P2PTokenClaims {
  jti: string;
  sub: string; // manifest_hash
  iss: string;
  iat: number;
  nbf: number;
  exp: number;
  trace_id: string;
  payload_id: string;
  scope: {
    languages: string[];
    targets: string[];
  };
  decision_digest: string;
  kid: string;
}

export type BatchStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'PARTIAL_SUCCESS'
  // Stabilization / terminal states
  | 'SUPERVISOR_REVIEW'
  | 'PUBLISH_BLOCKED'
  | 'TERMINAL_REJECT'
  | 'TERMINAL_BLOCK'
  | 'PARTIAL_PUBLISHED'
  | 'FULLY_PUBLISHED'
  | 'DELIVERY_FAILED'
  | 'CORRECTION_REQUIRED'
  // Optional human review state
  | 'FAILED'
  | 'MANUAL_REVIEW'
  | 'HUMAN_REVIEW_FALLBACK'
  | 'AUDITING'
  | 'HEALING'
  | 'ABANDONED'

export type EditionStatus =
  | 'PENDING'
  | 'GENERATING'
  | 'AUDITING'
  | 'HEALING'
  | 'ABANDONED'
  | 'APPROVED'
  | 'REJECTED'
  | 'STALE'
  | 'MANUAL_QUEUE'

export interface MasterIntelligenceCore {
  id: string
  version: number
  created_at: number
  updated_at: number

  // Truth Nucleus (Language-Agnostic)
  truth_nucleus: {
    facts: Array<{
      id: string
      statement: string
      confidence: number
      sources: string[]
    }>
    claims: Array<{
      id: string
      statement: string
      verification_status: 'verified' | 'unverified' | 'disputed'
    }>
    impact_analysis: string
    geopolitical_context: string
  }

  // Structural Atoms
  structural_atoms: {
    core_thesis: string
    key_entities: string[]
    temporal_markers: string[]
    numerical_data: Array<{
      value: number
      unit: string
      context: string
    }>
  }

  // Metadata
  metadata: {
    category: string
    urgency: 'breaking' | 'standard' | 'evergreen'
    target_regions: string[]
  }
}

export interface EditionPlan {
  language: Language
  tone: 'formal' | 'casual' | 'technical'
  jargon_level: 'expert' | 'intermediate' | 'general'
  seo_hook: string
  sovereign_context: string
  target_length: number
}

export interface AuditResults {
  overall_score: number
  cell_scores: Record<CellType, number>
  issues: Array<{
    id: string
    cell: CellType
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    description: string
    pattern_hash: string  // For anti-loop detection
  }>
}

export interface LanguageEdition {
  id: string
  language: Language
  mic_version: number
  status: EditionStatus

  content: {
    title: string
    lead: string
    body: {
      summary: string
      full: string
    }
    // Structured data + internal navigation artifacts used by audit + publish gating.
    schema?: any
    internalLinks?: string[]
    hreflang_tags?: Record<Language, string> // Dynamic SEO tags
    canonical_url?: string // Canonical consistency
  }

  metadata: {
    keywords: string[]
    region: string
    category: string
  }

  entities: string[]

  audit_results: AuditResults

  healing_history: Array<{
    timestamp: number
    cell: CellType
    patch_applied: string
    result: 'success' | 'failure'
  }>

  stale: boolean  // True if MIC changed after generation
  is_mock?: boolean
  shadow_run?: boolean
}

export interface BatchJob {
  id: string
  mic_id: string
  user_id: string
  status: BatchStatus
  created_at: number
  updated_at: number

  editions: Record<Language, LanguageEdition>

  // Stabilization / safety-bounds
  escalation_depth?: number
  chief_editor_escalated_to_supervisor?: boolean
  supervisor_decision_made?: boolean
  supervisor_decision?: string
  supervisor_decision_confidence?: number
  supervisor_trace?: string[]
  chief_editor_decision?: string
  chief_editor_decision_type?: string
  decision_timestamp?: number
  publish_blocked_reasons?: string[]
  publish_gate_trace_id?: string
  escalation_reasons?: string[]
  requires_supervisor_review?: boolean
  supervisor_review?: any
  human_review_required?: boolean
  published_urls?: Record<Language, string>
  cdn_verification_results?: Record<Language, {
    success: boolean,
    status?: number,
    duration_ms: number,
    error?: string
  }>
  decision_type?: string
  decision_source?: string
  rejected_languages?: Language[]
  delayed_languages?: Language[]
  rejection_reasons?: string[]
  terminal_fallback?: string
  terminal_reason?: string
  supervisor_failed?: boolean
  error?: string

  // Partial Publish Support
  approved_languages: Language[]
  pending_languages: Language[]

  // Budget Tracking
  budget: {
    total: number
    spent: number
    remaining: number
  }

  // Recirculation Tracking
  recirculation_count: number
  max_recirculation: number

  is_mock?: boolean
  shadow_run?: boolean

  // PECL Integration
  p2p_token?: string;
  manifest_hash?: string;
  manifest?: LockedContentPackage;
}

export type OverallDecision =
  | 'APPROVE_ALL'      // All languages pass all checks
  | 'APPROVE_PARTIAL'  // Some languages approved, others delayed/rejected
  | 'REJECT'           // Batch fails critical checks
  | 'ESCALATE'         // Requires human review

export interface ChiefEditorDecision {
  overall_decision: OverallDecision
  approved_languages: Language[]
  rejected_languages: Language[]
  delayed_languages: Language[]
  reasons: string[]
  multilingual_headline_integrity?: MultilingualHeadlineResult
  narrative_discipline?: NarrativeResult
  surface_compliance_pack?: SurfaceGateResult
  multilingual_integrity_en_tr?: MultilingualIntegrityResult
  trust_gate_authorization?: TrustGateResult
  truth_gate?: TruthGateResult
  claim_aware_compliance?: ClaimAwareComplianceResult
  evidence_ledger_safety?: {
    ledger_safe: boolean
    uncovered_claims: number
    weak_evidence_records: number
    missing_evidence_records: number
    duplicate_evidence_records: number
    incomplete_evidence_records: number
  }
  headline_intelligence_v1?: HeadlineGateResult
  headline_assessment_v1?: HeadlineAssessmentRecord
  editor_review_payload_v1?: HeadlineEditorReviewPayloadV1
  remediation_classification_v1?: RemediationClassificationResult
  escalation_record_v1?: EscalationRecord
  requires_supervisor_review: boolean
  requires_manual_review?: boolean
  confidence_score: number
  confidence_band: ConfidenceBand
  confidence_reasons: string[]
  decision_trace: DecisionTrace
  timestamp: number

  // PECL Integration
  pecl_decision?: PECLDecision;
  manifest_hash?: string;
  manifest?: LockedContentPackage;
  p2p_token?: string; // Signed JWS
  gate_results?: SovereignGateResult[]; // Real gate outputs (L6-BLK-005)
}

export interface DecisionTrace {
  trace_id: string
  stage: string
  decision: string
  confidence_score?: number
  hard_rule_hits: string[]
  reasons: string[]
  multilingual_headline_integrity?: MultilingualHeadlineResult
  narrative_discipline?: NarrativeResult
  surface_compliance_pack?: SurfaceGateResult
  multilingual_integrity_en_tr?: MultilingualIntegrityResult
  trust_gate_authorization?: TrustGateResult
  truth_gate?: TruthGateResult
  claim_aware_compliance?: ClaimAwareComplianceResult
  evidence_ledger_safety?: {
    ledger_safe: boolean
    uncovered_claims: number
    weak_evidence_records: number
    missing_evidence_records: number
    duplicate_evidence_records: number
    incomplete_evidence_records: number
  }
  headline_intelligence_v1?: HeadlineGateResult
  headline_assessment_v1?: HeadlineAssessmentRecord
  editor_review_payload_v1?: HeadlineEditorReviewPayloadV1
  remediation_classification_v1?: RemediationClassificationResult
  escalation_record_v1?: EscalationRecord
  emitted_events: string[]
  state_transition?: string
  timestamp: string
  rule_checks: RuleCheckResult[]
  semantic_analysis: SemanticAnalysisResult | null
  risk_assessment: RiskAssessmentResult
  final_reasoning: string
}

export interface RuleCheckResult {
  rule_name: string
  passed: boolean
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  affected_languages: Language[]
  details: string
  timestamp: number
}

export interface SemanticAnalysisResult {
  consistency_score: number  // 0-100
  drift_detected: boolean
  drift_threshold: number
  inconsistencies: Array<{
    language_pair: [Language, Language]
    field: string
    drift_score: number
    description: string
  }>
  ai_confidence: number
}

export interface RiskAssessmentResult {
  overall_risk_score: number  // 0-100 (higher = more risky)
  policy_risk: number
  financial_risk: number
  geopolitical_risk: number
  legal_risk: number
  brand_safety_risk: number
  risk_factors: Array<{
    type: 'policy' | 'financial' | 'geopolitical' | 'legal' | 'brand_safety'
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
    description: string
    affected_languages: Language[]
  }>
}
