
require('ts-node/register');
const dbModule = require('../lib/neural-assembly/database');
const db = dbModule.getGlobalDatabase ? dbModule.getGlobalDatabase() : dbModule.default.getGlobalDatabase();

try {
  const allBatches = db.db.prepare('SELECT id, status, is_mock, shadow_run, created_at FROM batch_jobs ORDER BY created_at DESC LIMIT 10').all();
  console.log('--- LATEST BATCHES ---');
  console.table(allBatches);
} catch (e) {
  console.error('Error querying batches:', e.message);
}

try {
  const allLogs = db.getLogs({ limit: 20 });
  console.log('--- LATEST LOGS ---');
  console.table(allLogs);
} catch (e) {
  console.error('Error querying logs:', e.message);
}
