/**
 * scripts/verify-rollback-path.ts
 * Verification of rollback path availability for SRE ignition precheck.
 */
import { getGlobalDatabase, resetGlobalDatabase } from '../lib/neural-assembly/database';

async function main() {
  try {
    const db = getGlobalDatabase();
    if (typeof db.rollbackBatchBudget === 'function') {
      console.log('ROLLBACK_PATH_VERIFIED: yes');
      resetGlobalDatabase();
      process.exit(0);
    } else {
      console.error('ROLLBACK_PATH_VERIFIED: no (method missing)');
      resetGlobalDatabase();
      process.exit(1);
    }
  } catch (error: any) {
    console.error('ROLLBACK_PATH_VERIFIED: no (error: ' + error.message + ')');
    resetGlobalDatabase();
    process.exit(1);
  }
}

main();
