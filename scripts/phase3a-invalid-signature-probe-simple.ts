/**
 * PHASE 3A: INVALID SIGNATURE HOSTILE PROBE (SIMPLIFIED)
 * 
 * Tests that terminal sink enforcement rejects tampered signatures.
 * Uses the development key that was generated during Phase 2.
 */

import { EditorialDatabase } from '../lib/neural-assembly/database';
import crypto from 'crypto';

async function runInvalidSignatureProbe() {
  console.log('=== PHASE 3A: INVALID SIGNATURE PROBE ===\n');
  
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
    
    // STEP 2: Create a valid token structure with tampered signature
    console.log('\n[PROBE] Step 2: Creating token with tampered signature...');
    
    const signedClaims = {
      payload_id: realBatch.id,
      manifest_hash: crypto.createHash('sha256').update('test-manifest').digest('hex'),
      authorized_languages: ['en', 'tr'],
      keyId: 'dev_ephemeral',
      algorithm: 'Ed25519' as const,
      issuedAt: Date.now(),
      expiresAt: Date.now() + (30 * 60 * 1000),
      claimGraphDigest: 'a'.repeat(64),
      evidenceLedgerDigest: 'b'.repeat(64)
    };
    
    // Create a TAMPERED signature (invalid base64 that will fail verification)
    const tamperedSignature = 'TAMPERED_INVALID_SIGNATURE_XXX' + '='.repeat(40);
    
    const tamperedToken = {
      signedClaims,
      signature: tamperedSignature
    };
    
    console.log(`[PROBE] Tampered signature: ${tamperedSignature.substring(0, 32)}...`);
    
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
    
    // STEP 4: Attempt saveBatch with tampered token
    console.log('\n[PROBE] Step 3: Attempting saveBatch with tampered token...');
    
    const testBatch = {
      ...realBatch,
      id: `hostile-probe-${Date.now()}`,
      p2p_token: JSON.stringify(tamperedToken),
      manifest: manifest as any,
      status: 'FULLY_PUBLISHED' as any,
      updated_at: Date.now()
    };
    
    console.log(`[PROBE] Calling saveBatch...`);
    console.log(`[PROBE] Batch ID: ${testBatch.id}`);
    
    try {
      await db.saveBatch(testBatch, mic);
      
      // If we reach here, the probe FAILED
      console.error('\n[PROBE] ❌ FAIL: saveBatch accepted tampered signature');
      console.error('[PROBE] CRITICAL SECURITY VULNERABILITY');
      process.exit(1);
      
    } catch (error: any) {
      // Expected: Terminal enforcer should reject
      console.log(`\n[PROBE] ✅ Terminal enforcer rejected: ${error.message}`);
      
      // Verify it's signature-related
      const isSignatureError = 
        error.message.includes('INVALID_SIGNATURE') || 
        error.message.includes('Verification failed') ||
        error.message.includes('signature') ||
        error.message.includes('verify') ||
        error.message.includes('Denied publish');
      
      if (isSignatureError) {
        console.log('[PROBE] ✅ PASS: Correct rejection reason (signature-related)');
        
        // Verify no database write occurred
        const writtenBatch = db.getBatch(testBatch.id);
        if (!writtenBatch) {
          console.log('[PROBE] ✅ PASS: No database write occurred (fail-closed)');
          console.log('\n=== PHASE 3A: INVALID SIGNATURE PROBE PASSED ===');
          process.exit(0);
        } else {
          console.error('[PROBE] ❌ FAIL: Database write occurred despite rejection');
          process.exit(1);
        }
      } else {
        console.error(`[PROBE] ❌ FAIL: Wrong rejection reason: ${error.message}`);
        console.error('[PROBE] Expected: signature-related error');
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

runInvalidSignatureProbe();
