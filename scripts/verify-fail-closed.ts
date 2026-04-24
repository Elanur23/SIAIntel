/**
 * Fail-Closed Logic Verification Script
 * This script tests the logical conditions used in app/admin/warroom/page.tsx
 */

interface MockAuditResult {
  overall_score: number
}

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
  auditResult: MockAuditResult | null,
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
  console.log('🧪 Verifying Warroom Fail-Closed Gating Logic...\n')

  const baseConfig = { enableScarcityTone: false }
  const selectedNews = { id: 'test' }
  const transformedArticle = { headline: 'Test' }

  // Case 1: Low audit score (<70) must block
  console.log('Case 1: Audit score 65, Scarcity OFF')
  const case1 = checkDeployBlocked(selectedNews, true, false, false, null, transformedArticle, { overall_score: 65 }, baseConfig)
  if (case1 === true) {
    console.log('  ✅ BLOCKED (Correct)')
  } else {
    console.error('  ❌ FAILED: Should be blocked')
  }

  // Case 2: Scarcity ON, score < 85 must block
  console.log('Case 2: Audit score 80, Scarcity ON')
  const case2 = checkDeployBlocked(selectedNews, true, false, false, null, transformedArticle, { overall_score: 80 }, { enableScarcityTone: true })
  if (case2 === true) {
    console.log('  ✅ BLOCKED (Correct)')
  } else {
    console.error('  ❌ FAILED: Should be blocked')
  }

  // Case 3: Scarcity ON, score >= 85 should pass
  console.log('Case 3: Audit score 87, Scarcity ON')
  const case3 = checkDeployBlocked(selectedNews, true, false, false, null, transformedArticle, { overall_score: 87 }, { enableScarcityTone: true })
  if (case3 === false) {
    console.log('  ✅ PASS (Correct)')
  } else {
    console.error('  ❌ FAILED: Should pass')
  }

  // Case 4: Missing audit result must block
  console.log('Case 4: Missing Audit Result')
  const case4 = checkDeployBlocked(selectedNews, true, false, false, null, transformedArticle, null, baseConfig)
  if (case4 === true) {
    console.log('  ✅ BLOCKED (Correct)')
  } else {
    console.error('  ❌ FAILED: Should be blocked')
  }

  // Case 5: Default state
  console.log('Case 5: Default state (ready, score 75)')
  const case5 = checkDeployBlocked(selectedNews, true, false, false, null, transformedArticle, { overall_score: 75 }, baseConfig)
  if (case5 === false) {
    console.log('  ✅ PASS (Correct)')
  } else {
    console.error('  ❌ FAILED: Should pass')
  }

  console.log('\n✨ Gating logic verification complete!')
}

main().catch(console.error)
