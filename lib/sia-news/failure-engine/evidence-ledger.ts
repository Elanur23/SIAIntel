import type { EvidenceLedgerInput, EvidenceLedgerResult } from './types'

export function buildEvidenceLedger(input: EvidenceLedgerInput): EvidenceLedgerResult {
  const totalClaims = input.claim_ids.length
  const totalEvidenceRecords = input.evidence_records.length

  const duplicateEvidenceRecords = totalEvidenceRecords - new Set(input.evidence_records.map((record) => record.evidence_id)).size

  const incompleteEvidenceRecords = input.evidence_records.filter(
    (record) => !record.metadata_complete || !record.has_attribution
  ).length

  const weakEvidenceRecords = input.evidence_records.filter(
    (record) => !record.high_quality_source
  ).length

  const missingEvidenceRecords = input.evidence_records.filter(
    (record) => !record.source_url_present
  ).length

  const coveredClaimIds = new Set(input.evidence_records.flatMap((record) => record.claim_ids))
  const uncoveredClaims = input.claim_ids.filter((claimId) => !coveredClaimIds.has(claimId))

  const validEvidenceRecords = Math.max(0, totalEvidenceRecords - weakEvidenceRecords - incompleteEvidenceRecords)

  const ledgerSafe =
    uncoveredClaims.length === 0 &&
    missingEvidenceRecords === 0 &&
    duplicateEvidenceRecords === 0 &&
    incompleteEvidenceRecords === 0

  const reasoning = ledgerSafe
    ? 'Evidence ledger is complete and safe.'
    : `Evidence ledger has issues: uncovered=${uncoveredClaims.length}, missing=${missingEvidenceRecords}, duplicate=${duplicateEvidenceRecords}, incomplete=${incompleteEvidenceRecords}`

  return {
    ledger_safe: ledgerSafe,
    total_claims: totalClaims,
    total_evidence_records: totalEvidenceRecords,
    valid_evidence_records: validEvidenceRecords,
    weak_evidence_records: weakEvidenceRecords,
    missing_evidence_records: missingEvidenceRecords,
    duplicate_evidence_records: duplicateEvidenceRecords,
    incomplete_evidence_records: incompleteEvidenceRecords,
    uncovered_claims: uncoveredClaims,
    reasoning,
  }
}
