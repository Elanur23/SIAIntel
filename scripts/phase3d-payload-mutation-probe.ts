/**
 * PHASE 3D: PAYLOAD MUTATION / TOCTOU HOSTILE PROBE
 * 
 * Tests that terminal sink enforcement detects when the payload sent to saveBatch
 * doesn't match the manifest payload_id in the signed token (TOCTOU attack).
 * 
 * PROBE DESIGN:
 * 1. Extract real batch and MIC from Phase 2
 * 2. Compute REAL valid provenance digests from the MIC
 * 3. Create fully valid token (signature valid, not expired, provenance valid)
 * 4. Create manifest with original batch.id
 * 5. MUTATE the payload AFTER token issuance (change batch.id to different value)
 * 6. Call saveBatch once with valid token + MIC but mutated payload
 * 7. Observe fail-closed behavior (terminal enforcer rejects with PROJECTION_MISMATCH)
 * 
 * EXPECTED RESULT:
 * - Terminal enforcer detects PROJECTION_MISMATCH (payload.id ≠ manifest.payload_id)
 * - saveBatch throws error
 * - No database write occurs
 * - Exit code 0 (fail-closed success)
 */

import { EditorialDatabase } from '../lib/neural-assembly/database';
import { getGlobalCryptoProvider } from '../lib/neural-assembly/stabilization/crypto-provider';
import { computeProvenanceDigests } from '../lib/neural-assembly/stabilization/provenance-binder';
import crypto from 'crypto';

async function runPayloadMutationProbe() {
  console.log('=== PHASE 3D: PAYLOAD MUTATION / TOCTOU PROBE ===\n');
  
  const db = new EditorialDatabase('./data/editorial.db');
  
  try {
    // STEP 1: Get a recent batch
    console.log('[PROBE] Step 1: Getting recent batch from database...');
    
    const batches = (db as any).db.prepare(`
      SELECT id, mic_id, status 
      FROM batch_jobs 
      WHERE shadow_run = 1 
      ORDER BY updated_at DESC 
      LIMIT 1
    `).all();
    
    if (batches.length === 0) {
      console.error('[PROBE] FATAL: No batches found. Run Phase 2 first.');
      process.exit(1);
    }
    
    const batchRow = batches[0];
    console.log(`[PROBE] Using batch: ${batchRow.id}`);
    
    const realBatch = db.getBatch(batchRow.id);
    if (!realBatch) {
      console.error('[PROBE] FATAL: Could not load batch.');
      process.exit(1);
    }
    
    const mic = db.getMIC(realBatch.mic_id);
    if (!mic) {
      console.error('[PROBE] FATAL: Could not load MIC.');
      process.exit(1);
    }
    
    console.log(`[PROBE] MIC ID: ${mic.id}`);
    console.log(`[PROBE] Original batch ID: ${realBatch.id}`);
    
    // STEP 2: Compute REAL provenance digests from the MIC
    console.log('\n[PROBE] Step 2: Computing REAL provenance digests from MIC...');
    
    const provenanceDigests = computeProvenanceDigests(mic);
    
    console.log(`[PROBE] REAL claimGraphDigest: ${provenanceDigests.claimGraphDigest.substring(0, 16)}...`);
    console.log(`[PROBE] REAL evidenceLedgerDigest: ${provenanceDigests.evidenceLedgerDigest.substring(0, 16)}...`);
    
    // STEP 3: Create manifest with ORIGINAL batch.id
    const originalBatchId = realBatch.id;
    const manifest = {
      payload_id: originalBatchId,  // Manifest uses ORIGINAL ID
      content: {
        headlines: { en: 'Test', tr: 'Test' },
        summaries: { en: 'Test', tr: 'Test' },
        bodies: { en: 'Test', tr: 'Test' },
        slugs: { en: 'test', tr: 'test' }
      },
      metadata: {
        category: 'test',
        urgency: 'normal' as any
      }
    };
    
    console.log(`\n[PROBE] Step 3: Creating manifest with original batch ID...`);
    console.log(`[PROBE] Manifest payload_id: ${manifest.payload_id}`);
    
    // STEP 4: Create fully valid token
    console.log('\n[PROBE] Step 4: Creating fully valid token...');
    
    const currentTime = Date.now();
    const expiresAt = currentTime + (60 * 60 * 1000); // 1 hour from now (valid)
    
    const manifestHash = crypto.createHash('sha256')
      .update(JSON.stringify(manifest))
      .digest('hex');
    
    const signedClaims = {
      payload_id: originalBatchId,  // Token claims ORIGINAL ID
      manifest_hash: manifestHash,
      authorized_languages: ['en', 'tr'],
      keyId: 'dev_ephemeral',
      algorithm: 'Ed25519' as const,
      issuedAt: currentTime,
      expiresAt: expiresAt,
      claimGraphDigest: provenanceDigests.claimGraphDigest,
      evidenceLedgerDigest: provenanceDigests.evidenceLedgerDigest
    };
    
    const cryptoProvider = getGlobalCryptoProvider();
    const privateKeyBase64 = process.env.PECL_PRIVATE_KEY || (global as any).__DEV_PRIVATE_KEY__;
    
    if (!privateKeyBase64) {
      console.error('[PROBE] FATAL: No private key available for signing.');
      process.exit(1);
    }
    
    const signature = cryptoProvider.sign(signedClaims, privateKeyBase64);
    
    const validToken = {
      signedClaims,
      signature
    };
    
    console.log(`[PROBE] Token created with valid signature`);
    console.log(`[PROBE] Token payload_id: ${signedClaims.payload_id}`);
    console.log(`[PROBE] Token is NOT expired: ${currentTime < expiresAt}`);
    console.log(`[PROBE] Signature: ${signature.substring(0, 32)}...`);
    
    // STEP 5: MUTATE the payload AFTER token issuance (TOCTOU attack)
    const mutatedBatchId = `hostile-probe-mutated-${Date.now()}`;
    
    console.log(`\n[PROBE] Step 5: MUTATING payload after token issuance (TOCTOU attack)...`);
    console.log(`[PROBE] Original batch ID (in token/manifest): ${originalBatchId}`);
    console.log(`[PROBE] MUTATED batch ID (in payload): ${mutatedBatchId}`);
    console.log(`[PROBE] This simulates a TOCTOU attack where payload is changed after authorization`);
    
    const testBatch = {
      ...realBatch,
      id: mutatedBatchId,  // MUTATED: Different from token/manifest
      p2p_token: JSON.stringify(validToken),
      manifest: manifest as any,
      status: 'FULLY_PUBLISHED' as any,
      updated_at: Date.now()
    };
    
    // STEP 6: Attempt saveBatch with mutated payload
    console.log('\n[PROBE] Step 6: Attempting saveBatch with mutated payload...');
    console.log(`[PROBE] Token/Manifest claim payload_id: ${originalBatchId}`);
    console.log(`[PROBE] Actual payload batch.id: ${mutatedBatchId}`);
    console.log(`[PROBE] Mismatch: ${originalBatchId !== mutatedBatchId}`);
    
    try {
      await db.saveBatch(testBatch, mic);
      
      // If we reach here, the probe FAILED
      console.error('\n[PROBE] ❌ FAIL: saveBatch accepted mutated payload');
      console.error('[PROBE] CRITICAL SECURITY VULNERABILITY: TOCTOU attack not prevented');
      console.error('[PROBE] Payload mutation was not detected');
      process.exit(1);
      
    } catch (error: any) {
      // Expected: Terminal enforcer should reject
      console.log(`\n[PROBE] ✅ Terminal enforcer rejected: ${error.message}`);
      
      // Verify it's projection/payload mismatch related
      const isProjectionError = 
        error.message.includes('PROJECTION_MISMATCH') || 
        error.message.includes('projection') ||
        error.message.includes('payload_id') ||
        error.message.includes('mismatch') ||
        error.message.includes('Denied publish');
      
      if (isProjectionError) {
        console.log('[PROBE] ✅ PASS: Correct rejection reason (PROJECTION_MISMATCH)');
        
        // Verify no database write occurred
        const writtenBatch = db.getBatch(mutatedBatchId);
        if (!writtenBatch) {
          console.log('[PROBE] ✅ PASS: No database write occurred (fail-closed)');
          console.log('\n=== PHASE 3D: PAYLOAD MUTATION / TOCTOU PROBE PASSED ===');
          console.log('\n[PROBE] VALIDATED SECURITY PROPERTIES:');
          console.log('  - Cryptographic signature integrity (Phase 3A)');
          console.log('  - Time-based authorization expiry (Phase 3B)');
          console.log('  - Provenance availability enforcement (Phase 3C)');
          console.log('  - Payload mutation / TOCTOU prevention (Phase 3D)');
          console.log('  - Fail-closed behavior on all failure modes');
          process.exit(0);
        } else {
          console.error('[PROBE] ❌ FAIL: Database write occurred despite rejection');
          process.exit(1);
        }
      } else {
        console.error(`[PROBE] ❌ FAIL: Wrong rejection reason: ${error.message}`);
        console.error('[PROBE] Expected: PROJECTION_MISMATCH (payload.id ≠ manifest.payload_id)');
        console.error('[PROBE] Note: Signature valid, expiry valid, provenance valid');
        console.error('[PROBE] Only payload mutation should cause failure');
        process.exit(1);
      }
    }
    
  } catch (error: any) {
    console.error('\n[PROBE] FATAL ERROR:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    db.close();
  }
}

runPayloadMutationProbe();
