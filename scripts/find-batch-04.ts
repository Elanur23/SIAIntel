import { getGlobalDatabase } from '../lib/neural-assembly/database'

async function find() {
  const db = getGlobalDatabase()
  const checkpoints = db.getCheckpoints('batch', 10)

  console.log('--- SEARCHING FOR BATCH 04 ---')
  for (const cp of checkpoints) {
    const batch = cp.data
    if (batch.id.startsWith('batch-04-official')) {
      console.log(`FOUND: ${batch.id} | Status: ${batch.status}`)
      console.log(JSON.stringify(batch, null, 2))
      return
    }
  }
}

find().catch(console.error)
