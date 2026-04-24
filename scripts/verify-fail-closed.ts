import { runDeepAudit } from '../lib/neural-assembly/sia-sentinel-core'

interface MockProtocolConfig {
  enableScarcityTone: boolean
}

function checkDeployBlocked(
  selectedNews: any,
  activeDraftReady: boolean,
  isPublishing: boolean,
  isTransforming: boolean,
  transformError: string | null,
  transformedArticle: any,
  auditResult: any,
  protocolConfig: MockProtocolConfig
): boolean {
  // Logic copied exactly from useMemo in page.tsx
  if (!selectedNews || !activeDraftReady || isPublishing || isTransforming || transformError) {
    return true
  }
  if (!transformedArticle || !auditResult) {
    return true
  }
  if (auditResult.overall_score < 70) {
    return true
  }
  if (protocolConfig.enableScarcityTone && auditResult.overall_score < 85) {
    return true
  }
  return false
}

async function main() {
  console.log('🧪 Verifying Warroom Fail-Closed Gating Logic with REAL Audit Engine...\n')

  const baseConfig = { enableScarcityTone: false }
  const selectedNews = { id: 'test' }

  const badSampleText = `
Option 2: The "Tech Discovery" Angle (Great for Google News)

Headline: The $1.7 Trillion Gold Trap: BRICS Sprints Toward a Blockchain Standard That Could De-Platform the Dollar.

Option 3: The "Consumer Fear" Angle (Viral Potential)

This article is based on the available raw intelligence report and should be reviewed before publication.
`

  // Case 1: Bad sample MUST block via hard veto (score 0)
  console.log('Case 1: Bad sample with editorial residue')
  const badAudit = runDeepAudit({
    title: 'Valid Title',
    body: badSampleText,
    language: 'en',
    schema: { '@type': 'NewsArticle' }
  })

  const case1Blocked = checkDeployBlocked(selectedNews, true, false, false, null, { headline: 'Test' }, badAudit, baseConfig)

  console.log(`  - Audit Score: ${badAudit.overall_score}`)
  if (badAudit.overall_score === 0 && case1Blocked === true) {
    console.log('  ✅ HARD VETO WORKS: Score 0 and Deploy Blocked')
  } else {
    console.error(`  ❌ FAILED: Score was ${badAudit.overall_score}, Blocked: ${case1Blocked}`)
  }

  // Case 2: Fuzzy residue detection ("Option  2" and "Headline : ")
  console.log('\nCase 2: Fuzzy residue detection')
  const fuzzyAudit = runDeepAudit({
    title: 'Valid Title',
    body: 'Some text. Option  2: The Choice. Headline : The Truth',
    language: 'en',
    schema: { '@type': 'NewsArticle' }
  })
  if (fuzzyAudit.overall_score === 0) {
    console.log('  ✅ Fuzzy residue "Option  2" and "Headline : " detected')
  } else {
    console.error('  ❌ FAILED: Fuzzy residue missed')
  }

  // Case 2b: Parenthetical residue "(Great for Google News)"
  console.log('\nCase 2b: Parenthetical residue detection')
  const parenAudit = runDeepAudit({
    title: 'Valid Title',
    body: 'This is a great angle (Great for Google News)',
    language: 'en',
    schema: { '@type': 'NewsArticle' }
  })
  if (parenAudit.overall_score === 0) {
    console.log('  ✅ Parenthetical residue detected')
  } else {
    console.error('  ❌ FAILED: Parenthetical residue missed')
  }

  // Case 3: Clean article passes
  console.log('\nCase 3: Clean article passes')
  const cleanAudit = runDeepAudit({
    title: 'Institutional Grade Intelligence Report',
    body: 'The convergence of AI compute power and traditional finance creates a direct correlation with USD. Global equity markets showed strong performance in Q1 2026. This intelligence report is provided for informational purposes only.',
    summary: 'Detailed analysis of global market trends and institutional capital flows.',
    internalLinks: ['https://siaintel.com/en/news/1'],
    language: 'en',
    schema: { '@type': 'NewsArticle' }
  })

  const case3Blocked = checkDeployBlocked(selectedNews, true, false, false, null, { headline: 'Test' }, cleanAudit, baseConfig)
  console.log(`  - Audit Score: ${cleanAudit.overall_score}`)
  if (cleanAudit.overall_score >= 70 && case3Blocked === false) {
    console.log('  ✅ PASS: Clean article satisfies gates')
  } else {
    console.error(`  ❌ FAILED: Clean article blocked. Score: ${cleanAudit.overall_score}, Blocked: ${case3Blocked}`)
    cleanAudit.issues.forEach(i => console.log(`    - [${i.severity}] ${i.message}`))
  }

  console.log('\n✨ Gating logic verification complete!')
}

main().catch(console.error)
