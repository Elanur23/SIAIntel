
try {
  require('tsx/cjs');
} catch (e) {
  require('ts-node/register');
}

const dbModule = require('../lib/neural-assembly/database');
const getGlobalDatabase = dbModule.getGlobalDatabase;
const resetGlobalDatabase = dbModule.resetGlobalDatabase;

console.log('[AUDIT] Starting database dump...');
const db = getGlobalDatabase();

console.log('[AUDIT] Querying batch jobs...');
const batches = db.db.prepare('SELECT id, status, is_mock, shadow_run, created_at, budget_spent FROM batch_jobs ORDER BY created_at DESC').all();
console.log('--- ALL BATCH JOBS ---');
console.table(batches);

console.log('[AUDIT] Querying logs...');
const logs = db.getLogs({ limit: 100 });
console.log('--- RECENT LOGS ---');
console.table(logs);

console.log('[AUDIT] Closing database connection...');
resetGlobalDatabase();
console.log('[AUDIT] Dump complete. Exiting.');
process.exit(0);
