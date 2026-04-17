import { getGlobalDatabase } from '../lib/neural-assembly/database'

async function audit() {
  const db = getGlobalDatabase()
  const now = Date.now()
  const logs = db.getLogs({ start_time: now - 3600000 })
  const batches = db.getCheckpoints('batch', 10)

  console.log('--- RECENT BATCHES ---')
  console.log(JSON.stringify(batches.map(b => ({ id: b.data.id, status: b.data.status, languages: Object.keys(b.data.editions) })), null, 2))

  console.log('--- RECENT LOGS ---')
  console.log(JSON.stringify(logs.map(l => ({ op: l.operation, status: l.status, msg: l.message, metadata: l.metadata })), null, 2))
}

audit().catch(console.error)
