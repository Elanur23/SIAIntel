import { runDeepAudit } from '../lib/neural-assembly/sia-sentinel-core'

const badSampleBody = `
Option 2: The "Tech Discovery" Angle (Great for Google News)

Headline: The $1.7 Trillion Gold Trap: BRICS Sprints Toward a Blockchain Standard That Could De-Platform the Dollar.

Option 3: The "Consumer Fear" Angle (Viral Potential)

This article is based on the available raw intelligence report and should be reviewed before publication.
`

const result = runDeepAudit({
  title: 'Valid Title for Test',
  body: badSampleBody,
  summary: 'Valid summary.',
  language: 'en',
  schema: { '@type': 'NewsArticle' }
})

console.log('--- AUDIT RESULT ---')
console.log('Score:', result.overall_score)
console.log('Status:', result.status)
console.log('Issues found:', result.issues.length)
result.issues.forEach(i => {
  if (i.issue_type === 'EDITORIAL_RESIDUE') {
    console.log(`[RESIDUE DETECTED] ${i.message}`)
  } else {
    console.log(`[ISSUE] ${i.issue_type}: ${i.message}`)
  }
})

if (result.overall_score < 70) {
  console.log('\n✅ GATE TRIGGERED: Score < 70')
} else {
  console.log('\n❌ GATE FAILED: Score >= 70')
}
