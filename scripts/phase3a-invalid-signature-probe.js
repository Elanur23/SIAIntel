/**
 * PHASE 3A: INVALID SIGNATURE HOSTILE PROBE
 * 
 * Tests that terminal sink enforcement rejects tampered signatures.
 * 
 * PROBE DESIGN:
 * 1. Extract real p2p_token from Phase 2 Golden Path batch
 * 2. Tamper with signature offline (no new token issuance)
 * 3. Call saveBatch once with tampered token
 * 4. Observe fail-closed behavior (terminal enforcer rejects)
 * 
 * EXPECTED RESULT:
 * - Terminal enforcer detects INVALID_SIGNATURE
 * - saveBatch throws error
 * - No database write occurs
 * - Exit code 0 (fail-closed success)
 */

// Use dynamic import for TypeScript modules
const path = require('path');
const { pathToFileURL } = require('url');

async function loadDatabase() {
  // Try to load from compiled .next directory first
  try {
    const dbPath = path.resolve(__dirname, '../lib/neural-assembly/database.ts');
    const { EditorialDatabase } = await import(pathToFileURL(dbPath).href);
    return EditorialDatabase;
  } catch (e) {
    console.error('[PROBE] Failed to load database module:', e.message);
    throw e;
  }
}

async function runInvalidSignatureProbe() {
  console.log('=== PHASE 3A: INVALID SIGNATURE PROBE ===\n');
  
  const EditorialDatabase = await loadDatabase();
  const db = new EditorialDatabase('./data/editorial.db');
  
  try {
    // STEP 1: Extract real p2p_token from Phase 2 batch
    console.log('[PROBE] Step 1: Extracting real p2p_token from Phase 2 Golden Path batch...');
    
    const batches = db.db.prepare(`
      SELECT id, status, updated_at 
      FROM batch_jobs 
      WHERE shadow_run = 1 
      ORDER BY updated_at DESC 
      LIMIT 10
    `).all();
    
    if (batches.length === 0) {
      console.error('[PROBE] FATAL: No Phase 2 batches found. Run Phase 2 Golden Path first.');
      process.exit(1);
    }
    
    console.log(`[PROBE] Found ${batches.length} recent shadow batches`);
    
    // Find a batch with p2p_token
    let realBatch = null;
    for (const batchRow of batches) {
      const batch = db.getBatch(batchRow.id);
      if (batch && batch.p2p_token) {
        realBatch = batch;
        console.log(`[PROBE] Found batch with p2p_token: ${batch.id}`);
        break;
      }
    }
    
    if (!realBatch) {
      console.error('[PROBE] FATAL: No batch with p2p_token found. Phase 2 may not have completed token issuance.');
      process.exit(1);
    }
    
    // STEP 2: Tamper with signature offline
    console.log('\n[PROBE] Step 2: Tampering with signature offline...');
    
    const originalToken = JSON.parse(realBatch.p2p_token);
    console.log(`[PROBE] Original signature: ${originalToken.signature.substring(0, 32)}...`);
    
    // Tamper: flip one character in the signature
    const tamperedSignature = originalToken.signature.substring(0, 10) + 
                             'X' + 
                             originalToken.signature.substring(11);
    
    const tamperedToken = {
      signedClaims: originalToken.signedClaims,
      signature: tamperedSignature
    };
    
    console.log(`[PROBE] Tampered signature: ${tamperedSignature.substring(0, 32)}...`);
    console.log(`[PROBE] Signature tampered: ${originalToken.signature !== tamperedSignature}`);
    
    // STEP 3: Attempt saveBatch with tampered token
    console.log('\n[PROBE] Step 3: Attempting saveBatch with tampered token...');
    
    // Create a test batch with tampered token
    const testBatch = {
      ...realBatch,
      id: `hostile-probe-${Date.now()}`,
      p2p_token: JSON.stringify(tamperedToken),
      status: 'FULLY_PUBLISHED', // Trigger terminal enforcement
      updated_at: Date.now()
    };
    
    // Retrieve MIC for provenance verification
    const mic = db.getMIC(testBatch.mic_id);
    
    console.log(`[PROBE] Calling saveBatch with tampered token...`);
    console.log(`[PROBE] Batch ID: ${testBatch.id}`);
    console.log(`[PROBE] MIC ID: ${testBatch.mic_id}`);
    console.log(`[PROBE] MIC available: ${!!mic}`);
    
    // STEP 4: Observe fail-closed behavior
    try {
      await db.saveBatch(testBatch, mic);
      
      // If we reach here, the probe FAILED
      console.error('\n[PROBE] ❌ FAIL: saveBatch accepted tampered signature');
      console.error('[PROBE] CRITICAL SECURITY VULNERABILITY: Terminal enforcer did not reject invalid signature');
      process.exit(1);
      
    } catch (error) {
      // Expected: Terminal enforcer should reject
      console.log(`\n[PROBE] ✅ Terminal enforcer rejected: ${error.message}`);
      
      // Verify it's the correct rejection reason
      if (error.message.includes('INVALID_SIGNATURE') || 
          error.message.includes('Verification failed') ||
          error.message.includes('signature')) {
        console.log('[PROBE] ✅ PASS: Correct rejection reason (INVALID_SIGNATURE)');
        
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
        console.error('[PROBE] Expected: INVALID_SIGNATURE or signature-related error');
        process.exit(1);
      }
    }
    
  } catch (error) {
    console.error('\n[PROBE] FATAL ERROR:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    db.close();
  }
}

runInvalidSignatureProbe();
