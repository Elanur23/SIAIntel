/**
 * PRODUCTION-VALIDATION.TS
 * Forensic Verification of PECS [L6-BLK-001 - L6-BLK-005]
 *
 * MISSION: Prove the live production path is secure, fail-closed, and audit-ready.
 */

import { MasterOrchestrator } from '../lib/neural-assembly/master-orchestrator';
import { getGlobalDatabase, EditorialDatabase } from '../lib/neural-assembly/database';
import { getGlobalBlackboard } from '../lib/neural-assembly/blackboard-system';
import { getGlobalCryptoProvider, canonicalizeJSON } from '../lib/neural-assembly/stabilization/crypto-provider';
import { PECL_DEPLOYMENT_MODE } from '../lib/neural-assembly/stabilization/config';
import crypto from 'crypto';

async function runValidation() {
  console.log(`[PRODUCTION_VALIDATION] Mode: ${PECL_DEPLOYMENT_MODE}`);
  if (PECL_DEPLOYMENT_MODE !== 'ENFORCE') {
    throw new Error('PRODUCTION_VALIDATION_FAILED: Mode must be ENFORCE');
  }

  const orchestrator = new MasterOrchestrator();
  const db = getGlobalDatabase();
  const blackboard = getGlobalBlackboard();

  // MOCK DATA PREP
  const mockMic: any = {
    id: 'mic-prod-val-001',
    version: 1,
    truth_nucleus: { facts: [], claims: [], impact_analysis: 'Valid', geopolitical_context: 'Valid' },
    structural_atoms: { core_thesis: 'Thesis', key_entities: ['Entity'], temporal_markers: [], numerical_data: [] },
    metadata: { category: 'ECONOMY', urgency: 'standard', target_regions: ['global'] }
  };

  const mockBatch: any = {
    id: 'batch-prod-val-001',
    mic_id: 'mic-prod-val-001',
    status: 'IN_PROGRESS',
    editions: {
      en: {
        id: 'ed-en-001',
        language: 'en',
        content: { title: 'ALPHA_NODE: Compute-Backed Bonds', lead: 'Lead', body: { full: 'Body', summary: 'Summary' } },
        audit_results: { overall_score: 95, cell_scores: { tone_cell: 95 }, issues: [] },
        healing_history: [],
        stale: false
      }
    }
  };

  console.log('--- PROBE 1: POSITIVE PATH ---');
  try {
    const decision = await orchestrator.chiefEditorReview(mockBatch, mockMic);
    const dnaRecords = (db as any).db.prepare('SELECT * FROM decision_dna WHERE payload_id = ?').all(mockBatch.id);

    if (dnaRecords.length !== 1) throw new Error('DNA_PERSISTENCE_FAILURE');
    const dna = dnaRecords[0];
    const persistedGates = JSON.parse(dna.gate_results);

    if (persistedGates.length === 0) throw new Error('EMPTY_GATES_FAILURE');
    if (!decision.p2p_token) throw new Error('TOKEN_ISSUANCE_FAILURE');

    console.log('✅ PROBE 1 PASSED: POSITIVE_PATH confirmed');
  } catch (e) {
    console.error('❌ PROBE 1 FAILED:', e);
    process.exit(1);
  }

  console.log('\n--- PROBE 2: INVALID SIGNATURE (HOSTILE) ---');
  try {
    const decision = await orchestrator.chiefEditorReview(mockBatch, mockMic);
    // Mutate signature
    const tokenObj = JSON.parse(decision.p2p_token!);
    tokenObj.signature = tokenObj.signature.substring(0, tokenObj.signature.length - 1) + 'X';

    const dnaMutated = {
      audit_id: 'val-fail-sig',
      payload_id: mockBatch.id,
      manifest_hash: decision.manifest_hash,
      trace_id: 'trace-sig',
      contract_version: '7.0.0',
      gate_results: decision.gate_results,
      final_decision: decision.pecl_decision,
      manifest: decision.manifest,
      p2p_token: JSON.stringify(tokenObj),
      mic: mockMic
    };

    await db.saveDecisionDNA(dnaMutated);
    console.error('❌ PROBE 2 FAILED: INVALID_SIGNATURE bypassed gate');
    process.exit(1);
  } catch (e: any) {
    if (e.message.includes('INVALID_SIGNATURE')) {
      console.log('✅ PROBE 2 PASSED: FAIL_CLOSED on bad signature');
    } else {
      console.error('❌ PROBE 2 FAILED (Incorrect error):', e);
      process.exit(1);
    }
  }

  console.log('\n--- PROBE 3: PAYLOAD MUTATION / TOCTOU (HOSTILE) ---');
  try {
    const decision = await orchestrator.chiefEditorReview(mockBatch, mockMic);
    // Mutate manifest (change title)
    const manifestMutated = JSON.parse(JSON.stringify(decision.manifest));
    manifestMutated.content.headlines.en = 'MUTATED TITLE';

    const dnaMutated = {
      audit_id: 'val-fail-toctou',
      payload_id: mockBatch.id,
      manifest_hash: decision.manifest_hash,
      trace_id: 'trace-toctou',
      contract_version: '7.0.0',
      gate_results: decision.gate_results,
      final_decision: decision.pecl_decision,
      manifest: manifestMutated,
      p2p_token: decision.p2p_token,
      mic: mockMic
    };

    await db.saveDecisionDNA(dnaMutated);
    console.error('❌ PROBE 3 FAILED: PAYLOAD_MUTATION bypassed gate');
    process.exit(1);
  } catch (e: any) {
    if (e.message.includes('HASH_MISMATCH') || e.message.includes('PROJECTION_MISMATCH')) {
      console.log('✅ PROBE 3 PASSED: FAIL_CLOSED on payload mutation');
    } else {
      console.error('❌ PROBE 3 FAILED (Incorrect error):', e);
      process.exit(1);
    }
  }

  console.log('\n--- PROBE 4: MISSING GATE RESULTS (HOSTILE) ---');
  try {
    const decision = await orchestrator.chiefEditorReview(mockBatch, mockMic);
    const dnaMissing = {
      audit_id: 'val-fail-missing-gates',
      payload_id: mockBatch.id,
      manifest_hash: decision.manifest_hash,
      trace_id: 'trace-missing',
      contract_version: '7.0.0',
      gate_results: [], // MISSING
      final_decision: decision.pecl_decision,
      manifest: decision.manifest,
      p2p_token: decision.p2p_token,
      mic: mockMic
    };

    await db.saveDecisionDNA(dnaMissing);
    console.error('❌ PROBE 4 FAILED: MISSING_GATE_RESULTS bypassed gate');
    process.exit(1);
  } catch (e: any) {
    if (e.message.includes('missing_gate_results')) {
      console.log('✅ PROBE 4 PASSED: FAIL_CLOSED on missing gate results');
    } else {
      console.error('❌ PROBE 4 FAILED (Incorrect error):', e);
      process.exit(1);
    }
  }

  console.log('\n--- PRODUCTION VALIDATION SUMMARY ---');
  console.log('✓ POSITIVE_PATH: PASSED');
  console.log('✓ INVALID_SIGNATURE: PASSED');
  console.log('✓ PAYLOAD_MUTATION: PASSED');
  console.log('✓ MISSING_GATES: PASSED');
  console.log('\n[PRODUCTION VALIDATION COMPLETE - ALL PROBES PASSED]');
}

runValidation().catch(e => {
  console.error('UNCAUGHT_VALIDATION_ERROR:', e);
  process.exit(1);
});
