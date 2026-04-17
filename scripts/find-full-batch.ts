import { getGlobalDatabase } from '../lib/neural-assembly/database'

async function find() {
  const db = getGlobalDatabase()
  const checkpoints = db.getCheckpoints('batch', 50)

  console.log('--- ALL BATCHES ---')
  for (const cp of checkpoints) {
    const batch = cp.data
    const langCount = Object.keys(batch.editions || {}).length
    console.log(`ID: ${batch.id} | Status: ${batch.status} | Langs: ${langCount} | Created: ${new Date(batch.created_at).toISOString()}`)
  }
}

find().catch(console.error)
