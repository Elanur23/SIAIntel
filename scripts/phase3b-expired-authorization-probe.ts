/**
 * PHASE 3B: EXPIRED AUTHORIZATION HOSTILE PROBE
 * 
 * Tests that terminal sink enforcement rejects expired authorization tokens.
 * 
 * PROBE DESIGN:
 * 1. Extract real batch and MIC from Phase 2
 * 2. Create valid token structure with expiresAt in the past
 * 3. Call saveBatch once with expired token
 * 4. Observe fail-closed behavior (terminal enforcer rejects)
 * 
 * EXPECTED RESULT:
 * - Terminal enforcer detects EXPIRED_AUTH
 * - saveBatch throws error
 * - No database write occurs
 * - Exit code 0 (fail-closed success)
 */

import { EditorialDatabase } from '../lib/neural-assembly/database';
import { getGlobalCryptoProvider } from '../lib/neural-assembly/stabilization/crypto-provider';
import crypto from 'crypto';

async function runExpiredAuthorizationProbe() {
  console.log('=== PHASE 3B: EXPIRED AUTHORIZATION PROBE ===\n');
  
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
    
    // STEP 2: Create a valid token with EXPIRED timestamp
    console.log('\n[PROBE] Step 2: Creating token with expired authorization...');
    
    const currentTime = Date.now();
    const expiredTime = currentTime - (60 * 60 * 1000); // 1 hour ago
    
    console.log(`[PROBE] Current time: ${new Date(currentTime).toISOString()}`);
    console.log(`[PROBE] Token expires at: ${new Date(expiredTime).toISOString()}`);
    console.log(`[PROBE] Token expired: ${currentTime > expiredTime} (${Math.floor((currentTime - expiredTime) / 1000)}s ago)`);
    
    const signedClaims = {
      payload_id: realBatch.id,
      manifest_hash: crypto.createHash('sha256').update('test-manifest').digest('hex'),
      authorized_languages: ['en', 'tr'],
      keyId: 'dev_ephemeral',
      algorithm: 'Ed25519' as const,
      issuedAt: expiredTime - (30 * 60 * 1000), // Issued 1.5 hours ago
      expiresAt: expiredTime, // EXPIRED 1 hour ago
      claimGraphDigest: 'a'.repeat(64),
      evidenceLedgerDigest: 'b'.repeat(64)
    };
    
    // Create a VALID signature (but token is expired)
    const cryptoProvider = getGlobalCryptoProvider();
    const privateKeyBase64 = process.env.PECL_PRIVATE_KEY || (global as any).__DEV_PRIVATE_KEY__;
    
    if (!privateKeyBase64) {
      console.error('[PROBE] FATAL: No private key available for signing.');
      process.exit(1);
    }
    
    const signature = cryptoProvider.sign(signedClaims, privateKeyBase64);
    
    const expiredToken = {
      signedClaims,
      signature
    };
    
    console.log(`[PROBE] Token created with valid signature but expired timestamp`);
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
    
    // STEP 4: Attempt saveBatch with expired token
    console.log('\n[PROBE] Step 3: Attempting saveBatch with expired token...');
    
    const testBatch = {
      ...realBatch,
      id: `hostile-probe-expired-${Date.now()}`,
      p2p_token: JSON.stringify(expiredToken),
      manifest: manifest as any,
      status: 'FULLY_PUBLISHED' as any,
      updated_at: Date.now()
    };
    
    console.log(`[PROBE] Calling saveBatch...`);
    console.log(`[PROBE] Batch ID: ${testBatch.id}`);
    
    try {
      await db.saveBatch(testBatch, mic);
      
      // If we reach here, the probe FAILED
      console.error('\n[PROBE] ❌ FAIL: saveBatch accepted expired token');
      console.error('[PROBE] CRITICAL SECURITY VULNERABILITY: Expired authorization not enforced');
      process.exit(1);
      
    } catch (error: any) {
      // Expected: Terminal enforcer should reject
      console.log(`\n[PROBE] ✅ Terminal enforcer rejected: ${error.message}`);
      
      // Verify it's expiry-related
      const isExpiryError = 
        error.message.includes('EXPIRED') || 
        error.message.includes('expiry') ||
        error.message.includes('expired') ||
        error.message.includes('time') ||
        error.message.includes('Denied publish');
      
      if (isExpiryError) {
        console.log('[PROBE] ✅ PASS: Correct rejection reason (expiry-related)');
        
        // Verify no database write occurred
        const writtenBatch = db.getBatch(testBatch.id);
        if (!writtenBatch) {
          console.log('[PROBE] ✅ PASS: No database write occurred (fail-closed)');
          console.log('\n=== PHASE 3B: EXPIRED AUTHORIZATION PROBE PASSED ===');
          process.exit(0);
        } else {
          console.error('[PROBE] ❌ FAIL: Database write occurred despite rejection');
          process.exit(1);
        }
      } else {
        console.error(`[PROBE] ❌ FAIL: Wrong rejection reason: ${error.message}`);
        console.error('[PROBE] Expected: expiry-related error (EXPIRED_AUTH)');
        console.error('[PROBE] Note: Signature should be valid, only expiry should fail');
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

runExpiredAuthorizationProbe();
