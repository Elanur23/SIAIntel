import { MasterOrchestrator } from '../lib/neural-assembly/master-orchestrator'
import { runDeepAudit } from '../lib/neural-assembly/sia-sentinel-core'
import { getGlobalDatabase } from '../lib/neural-assembly/database'
import { getGlobalBlackboard } from '../lib/neural-assembly/blackboard-system'

async function execute() {
  process.env.SHADOW_MODE = 'true'
  console.log('🚀 Starting Phase 3 Validation Campaign - Batch 03 (HIGH VOLATILITY)')

  const orchestrator = new MasterOrchestrator()
  const db = getGlobalDatabase()
  const blackboard = getGlobalBlackboard()

  // 1. MIC Creation - Breaking Topic
  const sources = [
    {
      url: 'https://www.reuters.com/business/tech/nvidia-b200-shipment-delays-emergency-meeting-2026-03-29/',
      content: 'NVIDIA has announced a 3-month delay for B200 Blackwell chips due to unexpected substrate defects. G7 trade ministers have scheduled an emergency virtual meeting to discuss semiconductor supply chain resilience.',
      credibility_score: 0.98
    }
  ]

  const mic = await orchestrator.createMIC(sources.map(s => ({ ...s, timestamp: Date.now() })))
  console.log(`✅ MIC Created: ${mic.id}`)

  // 2. Planning
  const plans = await orchestrator.planEditions(mic)

  // 3. Generation (LOCKED 9 LANGUAGES)
  const languages: any[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']
  const editions: any = {}

  for (const lang of languages) {
    const edition = await orchestrator.generateEdition(mic, plans[lang], lang)
    editions[lang] = edition
  }
  console.log(`✅ Generated ${Object.keys(editions).length} editions`)

  // 4. Audit & Score (Simulate high quality)
  for (const lang of Object.keys(editions)) {
    const edition = editions[lang]
    const auditResult = runDeepAudit({
      title: edition.content.title,
      lead: edition.content.lead,
      summary: edition.content.body.summary,
      body: edition.content.body.full,
      language: lang,
      metadata: { category: 'Technology', language: lang },
      schema: edition.content.schema // Pass the schema from shadow gen
    })

    edition.audit_results = {
      overall_score: auditResult.overall_score,
      cell_scores: auditResult.cell_scores,
      issues: auditResult.issues
    }

    // Quality Floor: Min 80 for APPROVED
    if (auditResult.overall_score >= 80 && auditResult.critical_issues.length === 0) {
      edition.status = 'APPROVED'
    } else {
      edition.status = 'REJECTED'
    }

    blackboard.write(`edition.${lang}`, edition, 'system')
  }

  // 5. Chief Editor & Routing
  const batchId = `batch-03-${Date.now()}`
  const batch: any = {
    id: batchId,
    mic_id: mic.id,
    user_id: 'campaign-validator',
    status: 'IN_PROGRESS',
    created_at: Date.now(),
    updated_at: Date.now(),
    editions,
    approved_languages: [],
    pending_languages: languages,
    budget: { total: 5, spent: 0, remaining: 5 },
    recirculation_count: 0,
    max_recirculation: 3
  }

  db.saveBatch(batch)
  blackboard.write(`batch.${batchId}`, batch, 'system')
  const decision = await orchestrator.chiefEditorReview(batch, mic)
  console.log(`✅ Chief Editor Decision: ${decision.overall_decision}`)

  // 6. Retrieve Final State
  const finalBatch = blackboard.read(`batch.${batchId}`) as any
  console.log('--- FINAL BATCH STATE ---')
  console.log(JSON.stringify(finalBatch, null, 2))
}

execute().catch(console.error)
