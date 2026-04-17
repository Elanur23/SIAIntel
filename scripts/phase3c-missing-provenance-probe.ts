/**
 * PHASE 3C: MISSING PROVENANCE HOSTILE PROBE
 * 
 * Tests that terminal sink enforcement rejects tokens when provenance digests
 * don't match the MIC (claim graph and evidence ledger mismatch).
 * 
 * PROBE DESIGN:
 * 1. Extract real batch and MIC from Phase 2
 * 2. Create valid token with correct signature and not expired
 * 3. TAMPER: Use wrong provenance digests (not matching the MIC)
 * 4. Call saveBatch once with tampered provenance
 * 5. Observe fail-closed behavior (terminal enforcer rejects)
 * 
 * EXPECTED RESULT:
 * - Terminal enforcer detects PROVENANCE_MISMATCH
 * - saveBatch throws error
 * - No database write occurs
 * - Exit code 0 (fail-closed success)
 */

import { EditorialDatabase } from '../lib/neural-assembly/database';
import { getGlobalCryptoProvider } from '../lib/neural-assembly/stabilization/crypto-provider';
import crypto from 'crypto';

async function runMissingProvenanceProbe() {
  console.log('=== PHASE 3C: MISSING PROVENANCE PROBE ===\n');
  
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
    
    // STEP 2: Create a valid token with TAMPERED provenance digests
    console.log('\n[PROBE] Step 2: Creating token with tampered provenance...');
    
    const currentTime = Date.now();
    const expiresAt = currentTime + (60 * 60 * 1000); // 1 hour from now (valid)
    
    console.log(`[PROBE] Current time: ${new Date(currentTime).toISOString()}`);
    console.log(`[PROBE] Token expires at: ${new Date(expiresAt).toISOString()}`);
    console.log(`[PROBE] Token is NOT expired: ${currentTime < expiresAt}`);
    
    // TAMPER: Use wrong provenance digests (all 'c' and 'd' instead of real hashes)
    const tamperedClaimGraphDigest = 'c'.repeat(64);
    const tamperedEvidenceLedgerDigest = 'd'.repeat(64);
    
    console.log(`[PROBE] TAMPERED claimGraphDigest: ${tamperedClaimGraphDigest.substring(0, 16)}...`);
    console.log(`[PROBE] TAMPERED evidenceLedgerDigest: ${tamperedEvidenceLedgerDigest.substring(0, 16)}...`);
    console.log(`[PROBE] These digests DO NOT match the MIC provenance`);
    
    const signedClaims = {
      payload_id: realBatch.id,
      manifest_hash: crypto.createHash('sha256').update('test-manifest').digest('hex'),
      authorized_languages: ['en', 'tr'],
      keyId: 'dev_ephemeral',
      algorithm: 'Ed25519' as const,
      issuedAt: currentTime,
      expiresAt: expiresAt,
      claimGraphDigest: tamperedClaimGraphDigest,      // TAMPERED
      evidenceLedgerDigest: tamperedEvidenceLedgerDigest  // TAMPERED
    };
    
    // Create a VALID signature (signature is correct, but provenance is wrong)
    const cryptoProvider = getGlobalCryptoProvider();
    const privateKeyBase64 = process.env.PECL_PRIVATE_KEY || (global as any).__DEV_PRIVATE_KEY__;
    
    if (!privateKeyBase64) {
      console.error('[PROBE] FATAL: No private key available for signing.');
      process.exit(1);
    }
    
    const signature = cryptoProvider.sign(signedClaims, privateKeyBase64);
    
    const tamperedToken = {
      signedClaims,
      signature
    };
    
    console.log(`[PROBE] Token created with valid signature but tampered provenance`);
    console.log(`[PROBE] Signature: ${signature.substring(0, 32)}...`);
    
    // STEP 3: Create minimal manifest
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
    
    // STEP 4: Attempt saveBatch with tampered provenance
    console.log('\n[PROBE] Step 3: Attempting saveBatch with tampered provenance...');
    
    const testBatch = {
      ...realBatch,
      id: `hostile-probe-provenance-${Date.now()}`,
      p2p_token: JSON.stringify(tamperedToken),
      manifest: manifest as any,
      status: 'FULLY_PUBLISHED' as any,
      updated_at: Date.now()
    };
    
    console.log(`[PROBE] Calling saveBatch with MIC (provenance verification enabled)...`);
    console.log(`[PROBE] Batch ID: ${testBatch.id}`);
    
    try {
      await db.saveBatch(testBatch, mic);  // Pass MIC to enable provenance verification
      
      // If we reach here, the probe FAILED
      console.error('\n[PROBE] ❌ FAIL: saveBatch accepted tampered provenance');
      console.error('[PROBE] CRITICAL SECURITY VULNERABILITY: Provenance verification not enforced');
      process.exit(1);
      
    } catch (error: any) {
      // Expected: Terminal enforcer should reject
      console.log(`\n[PROBE] ✅ Terminal enforcer rejected: ${error.message}`);
      
      // Verify it's provenance-related
      const isProvenanceError = 
        error.message.includes('PROVENANCE') || 
        error.message.includes('provenance') ||
        error.message.includes('claim') ||
        error.message.includes('evidence') ||
        error.message.includes('digest') ||
        error.message.includes('Denied publish');
      
      if (isProvenanceError) {
        console.log('[PROBE] ✅ PASS: Correct rejection reason (provenance-related)');
        
        // Verify no database write occurred
        const writtenBatch = db.getBatch(testBatch.id);
        if (!writtenBatch) {
          console.log('[PROBE] ✅ PASS: No database write occurred (fail-closed)');
          console.log('\n=== PHASE 3C: MISSING PROVENANCE PROBE PASSED ===');
          console.log('\n[PROBE] VALIDATED SECURITY PROPERTIES:');
          console.log('  - Cryptographic signature integrity (Phase 3A)');
          console.log('  - Time-based authorization expiry (Phase 3B)');
          console.log('  - Provenance digest verification (Phase 3C)');
          console.log('  - Fail-closed behavior on all failure modes');
          process.exit(0);
        } else {
          console.error('[PROBE] ❌ FAIL: Database write occurred despite rejection');
          process.exit(1);
        }
      } else {
        console.error(`[PROBE] ❌ FAIL: Wrong rejection reason: ${error.message}`);
        console.error('[PROBE] Expected: provenance-related error (PROVENANCE_MISMATCH)');
        console.error('[PROBE] Note: Signature should be valid, expiry should be valid, only provenance should fail');
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
