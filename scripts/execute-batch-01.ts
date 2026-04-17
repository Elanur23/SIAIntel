import { MasterOrchestrator } from '../lib/neural-assembly/master-orchestrator'
import { runDeepAudit } from '../lib/neural-assembly/sia-sentinel-core'
import { getGlobalDatabase } from '../lib/neural-assembly/database'
import { getGlobalBlackboard } from '../lib/neural-assembly/blackboard-system'

async function execute() {
  console.log('🚀 Starting Phase 3 Validation Campaign - Batch 01')

  const orchestrator = new MasterOrchestrator()
  const db = getGlobalDatabase()
  const blackboard = getGlobalBlackboard()

  // 1. MIC Creation
  const sources = [
    {
      url: 'https://ec.europa.io/commission/presscorner/detail/en/IP_23_6473',
      content: 'The European Parliament and Council reached a political agreement on the Artificial Intelligence Act. The Act will apply from 2026, but some provisions like prohibited AI systems will apply after 6 months.',
      credibility_score: 0.95
    },
    {
      url: 'https://www.reuters.com/technology/eu-ai-act-what-it-means-for-business-2024-03-13/',
      content: 'Financial services firms must comply with strict transparency and risk management rules for high-risk AI systems. Deadlines for compliance vary by category.',
      credibility_score: 0.9
    }
  ]

  const mic = await orchestrator.createMIC(sources.map(s => ({ ...s, timestamp: Date.now() })))
  console.log(`✅ MIC Created: ${mic.id}`)

  // 2. Planning
  const plans = await orchestrator.planEditions(mic)
  console.log('✅ Planning Complete')

  // 3. Generation (9 languages)
  const languages: any[] = ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh']
  const editions: any = {}

  for (const lang of languages) {
    console.log(`Generating ${lang}...`)
    try {
      const edition = await orchestrator.generateEdition(mic, plans[lang], lang)
      editions[lang] = edition
    } catch (e: any) {
      console.error(`Failed to generate ${lang}:`, e.message)
    }
  }

  // 4. Audit
  for (const lang of Object.keys(editions)) {
    const edition = editions[lang]
    const auditResult = runDeepAudit({
      title: edition.content.title,
      lead: edition.content.lead,
      summary: edition.content.body.summary,
      body: edition.content.body.full,
      language: lang,
      metadata: { category: 'Finance', language: lang }
    })

    edition.audit_results = {
      overall_score: auditResult.overall_score,
      cell_scores: auditResult.cell_scores,
      issues: auditResult.issues
    }

    if (auditResult.overall_score >= 80) edition.status = 'APPROVED'
    else edition.status = 'REJECTED'

    blackboard.write(`edition.${lang}`, edition, 'system')
  }

  // 5. Chief Editor & Routing
  const batchId = `batch-01-${Date.now()}`
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
  const decision = await orchestrator.chiefEditorReview(batch, mic)
  console.log(`✅ Chief Editor Decision: ${decision.overall_decision}`)

  // 6. Retrieve Final State
  const finalBatch = blackboard.read(`batch.${batchId}`) as any
  console.log('--- FINAL BATCH STATE ---')
  console.log(JSON.stringify(finalBatch, null, 2))
}

execute().catch(console.error)
