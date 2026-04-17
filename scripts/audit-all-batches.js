
// require('ts-node/register');
const dbModule = require('../lib/neural-assembly/database');
const db = dbModule.getGlobalDatabase ? dbModule.getGlobalDatabase() : dbModule.default.getGlobalDatabase();

try {
  const allBatches = db.db.prepare('SELECT id, status, is_mock, shadow_run, created_at, budget_spent FROM batch_jobs ORDER BY created_at DESC LIMIT 10').all();
  console.log('--- ALL RECENT BATCHES ---');
  console.table(allBatches);

  for (const batch of allBatches) {
    const logs = db.getLogs({ batch_id: batch.id });
    console.log(`--- LOGS FOR ${batch.id} ---`);
    console.table(logs);
  }
} catch (e) {
  console.error('Error:', e.message);
}
