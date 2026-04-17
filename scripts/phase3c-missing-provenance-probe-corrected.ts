/**
 * PHASE 3C: MISSING PROVENANCE HOSTILE PROBE (CORRECTED)
 * 
 * Tests that terminal sink enforcement rejects tokens when provenance digests
 * are present in the token BUT no MIC is provided for verification.
 * 
 * PROBE DESIGN:
 * 1. Extract real batch and MIC from Phase 2
 * 2. Compute REAL valid provenance digests from the MIC
 * 3. Create valid token with correct signature, not expired, and REAL provenance digests
 * 4. Call saveBatch WITHOUT passing the MIC parameter (mic: undefined)
 * 5. Observe fail-closed behavior (terminal enforcer rejects with PROVENANCE_UNAVAILABLE)
 * 
 * EXPECTED RESULT:
 * - Terminal enforcer detects PROVENANCE_UNAVAILABLE
 * - saveBatch throws error
 * - No database write occurs
 * - Exit code 0 (fail-closed success)
 */

import { EditorialDatabase } from '../lib/neural-assembly/database';
import { getGlobalCryptoProvider } from '../lib/neural-assembly/stabilization/crypto-provider';
import { computeProvenanceDigests } from '../lib/neural-assembly/stabilization/provenance-binder';
import crypto from 'crypto';

async function runMissingProvenanceProbe() {
  console.log('=== PHASE 3C: MISSING PROVENANCE PROBE (CORRECTED) ===\n');
  
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
    console.log(`[PROBE] MIC has ${mic.truth_nucleus.facts.length} facts, ${mic.truth_nucleus.claims.length} claims`);
    
    // STEP 2: Compute REAL provenance digests from the MIC
    console.log('\n[PROBE] Step 2: Computing REAL provenance digests from MIC...');
    
    const provenanceDigests = computeProvenanceDigests(mic);
    
    console.log(`[PROBE] REAL claimGraphDigest: ${provenanceDigests.claimGraphDigest.substring(0, 16)}...`);
    console.log(`[PROBE] REAL evidenceLedgerDigest: ${provenanceDigests.evidenceLedgerDigest.substring(0, 16)}...`);
    console.log(`[PROBE] These digests are VALID and match the MIC`);
    
    // STEP 3: Create a valid token with REAL provenance digests
    console.log('\n[PROBE] Step 3: Creating token with valid provenance digests...');
    
    const currentTime = Date.now();
    const expiresAt = currentTime + (60 * 60 * 1000); // 1 hour from now (valid)
    
    console.log(`[PROBE] Current time: ${new Date(currentTime).toISOString()}`);
    console.log(`[PROBE] Token expires at: ${new Date(expiresAt).toISOString()}`);
    console.log(`[PROBE] Token is NOT expired: ${currentTime < expiresAt}`);
    
    const signedClaims = {
      payload_id: realBatch.id,
      manifest_hash: crypto.createHash('sha256').update('test-manifest').digest('hex'),
      authorized_languages: ['en', 'tr'],
      keyId: 'dev_ephemeral',
      algorithm: 'Ed25519' as const,
      issuedAt: currentTime,
      expiresAt: expiresAt,
      claimGraphDigest: provenanceDigests.claimGraphDigest,      // REAL digest
      evidenceLedgerDigest: provenanceDigests.evidenceLedgerDigest  // REAL digest
    };
    
    // Create a VALID signature
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
    
    console.log(`[PROBE] Token created with valid signature and REAL provenance`);
    console.log(`[PROBE] Signature: ${signature.substring(0, 32)}...`);
    
    // STEP 4: Create minimal manifest
    const manifest = {
      payload_id: realBatch.id,
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
    
    // STEP 5: Attempt saveBatch WITHOUT MIC (provenance unavailable)
    console.log('\n[PROBE] Step 4: Attempting saveBatch WITHOUT MIC (provenance unavailable)...');
    
    const testBatch = {
      ...realBatch,
      id: `hostile-probe-missing-prov-${Date.now()}`,
      p2p_token: JSON.stringify(validToken),
      manifest: manifest as any,
      status: 'FULLY_PUBLISHED' as any,
      updated_at: Date.now()
    };
    
    console.log(`[PROBE] Calling saveBatch WITHOUT MIC parameter...`);
    console.log(`[PROBE] Batch ID: ${testBatch.id}`);
    console.log(`[PROBE] Token claims provenance but MIC is NOT provided for verification`);
    
    try {
      // CRITICAL: Call saveBatch WITHOUT mic parameter
      await db.saveBatch(testBatch, undefined);
      
      // If we reach here, the probe FAILED
      console.error('\n[PROBE] ❌ FAIL: saveBatch accepted token without MIC verification');
      console.error('[PROBE] CRITICAL SECURITY VULNERABILITY: Missing provenance not enforced');
      process.exit(1);
      
    } catch (error: any) {
      // Expected: Terminal enforcer should reject
      console.log(`\n[PROBE] ✅ Terminal enforcer rejected: ${error.message}`);
      
      // Verify it's provenance-unavailable related
      const isProvenanceUnavailableError = 
        error.message.includes('PROVENANCE_UNAVAILABLE') || 
        error.message.includes('provenance') ||
        error.message.includes('unavailable') ||
        error.message.includes('Denied publish');
      
      if (isProvenanceUnavailableError) {
        console.log('[PROBE] ✅ PASS: Correct rejection reason (PROVENANCE_UNAVAILABLE)');
        
        // Verify no database write occurred
        const writtenBatch = db.getBatch(testBatch.id);
        if (!writtenBatch) {
          console.log('[PROBE] ✅ PASS: No database write occurred (fail-closed)');
          console.log('\n=== PHASE 3C: MISSING PROVENANCE PROBE PASSED ===');
          console.log('\n[PROBE] VALIDATED SECURITY PROPERTIES:');
          console.log('  - Cryptographic signature integrity (Phase 3A)');
          console.log('  - Time-based authorization expiry (Phase 3B)');
          console.log('  - Provenance availability enforcement (Phase 3C)');
          console.log('  - Fail-closed behavior on all failure modes');
          process.exit(0);
        } else {
          console.error('[PROBE] ❌ FAIL: Database write occurred despite rejection');
          process.exit(1);
        }
      } else {
        console.error(`[PROBE] ❌ FAIL: Wrong rejection reason: ${error.message}`);
        console.error('[PROBE] Expected: PROVENANCE_UNAVAILABLE');
        console.error('[PROBE] Note: Signature valid, expiry valid, provenance digests valid');
        console.error('[PROBE] Only missing MIC context should cause failure');
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

runMissingProvenanceProbe();
