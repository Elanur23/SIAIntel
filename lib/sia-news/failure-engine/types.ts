export interface NarrativeInput {
  headline_alignment_passed: boolean
  evidence_support_score: number
  narrative_intensity_score: number
  certainty_language_detected: boolean
  sensationalism_detected: boolean
  claim_stack_count: number
  thesis_supported: boolean
  confidence_signal_present: boolean
  multilingual_narrative_consistency_passed: boolean
  sensitive_topic: boolean
}

export interface NarrativeResult {
  narrative_decision:
    | 'NARRATIVE_PASS'
    | 'NARRATIVE_CORRECTION_REQUIRED'
    | 'NARRATIVE_REVIEW_REQUIRED'
    | 'NARRATIVE_BLOCK'
  narrative_severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  narrative_risk_reasons: string[]
  publish_allowed: boolean
  reasoning: string
}

export interface EvidenceClaim {
  claim_id: string
  claim_text: string
}

export interface EvidenceRecord {
  evidence_id: string
  claim_ids: string[]
  evidence_type: 'PRIMARY_SOURCE' | 'SECONDARY_SOURCE' | 'DERIVED'
  source_url_present: boolean
  high_quality_source: boolean
  has_attribution: boolean
  metadata_complete: boolean
}

export interface EvidenceLedgerInput {
  story_id: string
  claims: EvidenceClaim[]
  claim_ids: string[]
  evidence_records: EvidenceRecord[]
}

export interface EvidenceLedgerResult {
  ledger_safe: boolean
  total_claims: number
  total_evidence_records: number
  valid_evidence_records: number
  weak_evidence_records: number
  missing_evidence_records: number
  duplicate_evidence_records: number
  incomplete_evidence_records: number
  uncovered_claims: string[]
  reasoning: string
}
