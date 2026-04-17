import { getGlobalDatabase } from '../lib/neural-assembly/database'

async function dump() {
  const db = getGlobalDatabase()
  const batchId = 'batch-01-1774811900648'
  const batch = db.getBatch(batchId)

  if (!batch) {
    console.log('Batch not found.')
    return
  }

  console.log('--- BATCH DETAILS ---')
  for (const [lang, edition] of Object.entries(batch.editions)) {
    console.log(`${lang} | Audit: ${edition.audit_results.overall_score} | Status: ${edition.status}`)
  }
}

dump().catch(console.error)
