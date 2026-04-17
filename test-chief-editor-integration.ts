/**
 * Chief Editor Integration Test
 * Tests the chiefEditorReview function and routing logic
 */

import { MasterOrchestrator } from './lib/neural-assembly/master-orchestrator'
import { Language, BatchJob, LanguageEdition, MasterIntelligenceCore } from './lib/neural-assembly/master-orchestrator'
import { ChiefEditorDecision } from './lib/neural-assembly/chief-editor-engine'

// Helper function to create mock edition
function createMockEdition(lang: Language, score: number, hasCriticalIssue = false): LanguageEdition {
  return {
    id: `edition_${lang}_${Date.now()}`,
    language: lang,
    mic_version: 1,
    status: 'PENDING',
    content: {
      title: `Title in ${lang} with enough length`,
      lead: `This is a lead for ${lang} that is definitely long enough for the check.`,
      body: {
        summary: `This is a summary in ${lang} that is definitely long enough to pass the 50 word or character check that might be implemented in the engine. It needs to be substantial.`,
        full: `Full content in ${lang}. This body needs to be at least 50 words long according to the hard rule engine. So I am adding more text here to ensure we pass that check. The price of Bitcoin increased significantly today following news from the SEC regarding spot ETF approvals. Investors are optimistic about the future of crypto. This trend is expected to continue for the next few quarters as institutional adoption grows. Analysts suggest that the market is entering a new phase of maturity and stability.`
      },
      schema: {
        '@type': 'NewsArticle',
        headline: `Headline for ${lang}`
      },
      internalLinks: ['https://siaintel.com/en/news']
    },
    metadata: {
      keywords: ['test'],
      region: 'Global',
      category: 'Finance'
    },
    entities: ['Bitcoin'],
    audit_results: {
      overall_score: score,
      cell_scores: {
        title_cell: score,
        body_cell: score,
        fact_check_cell: score,
        link_cell: score,
        schema_cell: score,
        meta_cell: score,
        visual_cell: score,
        readability_cell: score,
        seo_cell: score,
        tone_cell: score,
        policy_cell: score,
        sovereign_cell: score
      },
      issues: hasCriticalIssue ? [{
        id: 'issue_001',
        cell: 'fact_check_cell',
        severity: 'CRITICAL',
        description: 'Critical factual error',
        pattern_hash: 'hash_001'
      }] : []
    },
    healing_history: [],
    stale: false
  } as any
}

// Helper function to create mock MIC
function createMockMIC(): MasterIntelligenceCore {
  return {
    id: 'mic_test',
    version: 1,
    created_at: Date.now(),
    updated_at: Date.now(),
    truth_nucleus: {
      facts: [{
        id: 'fact_001',
        statement: 'Bitcoin price increased',
        confidence: 0.95,
        sources: ['https://example.com']
      }],
      claims: [],
      impact_analysis: 'High impact market movement',
      geopolitical_context: 'Global financial markets'
    },
    structural_atoms: {
      core_thesis: 'Cryptocurrency market analysis',
      key_entities: ['Bitcoin', 'Market'],
      temporal_markers: [new Date().toISOString()],
      numerical_data: []
    },
    metadata: {
      category: 'Finance',
      urgency: 'standard' as const,
      target_regions: ['global']
    }
  }
}

// Test scenarios
async function testChiefEditorIntegration() {
  const orchestrator = new MasterOrchestrator()
  const results: Array<{
    scenario: string
    passed: boolean
    expected: string
    actual: string
    details: string
  }> = []

  console.log('=== Testing Chief Editor Integration ===\n')

  // Scenario 1: APPROVE_ALL
  console.log('Testing Scenario 1: APPROVE_ALL')
  try {
    const batch1: BatchJob = {
      id: 'batch_approve_all',
      mic_id: 'mic_001',
      user_id: 'test_user',
      status: 'IN_PROGRESS',
      created_at: Date.now(),
      updated_at: Date.now(),
      editions: {
        en: createMockEdition('en', 85),
        tr: createMockEdition('tr', 85),
        de: createMockEdition('de', 85),
        fr: createMockEdition('fr', 85),
        es: createMockEdition('es', 85),
        ru: createMockEdition('ru', 85),
        ar: createMockEdition('ar', 85),
        jp: createMockEdition('jp', 85),
        zh: createMockEdition('zh', 85)
      },
      approved_languages: [],
      pending_languages: [],
      budget: { total: 10000, spent: 0, remaining: 10000 },
      recirculation_count: 0,
      max_recirculation: 3
    }

    const mic1 = createMockMIC()
    const decision1 = await orchestrator.chiefEditorReview(batch1, mic1)
    
    // Verify structure
    const hasRequiredFields = 
      decision1.overall_decision !== undefined &&
      decision1.approved_languages !== undefined &&
      decision1.rejected_languages !== undefined &&
      decision1.delayed_languages !== undefined &&
      decision1.confidence_score !== undefined
    
    const isApproveAll = decision1.overall_decision === 'APPROVE_ALL'
    
    results.push({
      scenario: 'APPROVE_ALL',
      passed: hasRequiredFields && isApproveAll,
      expected: 'APPROVE_ALL decision with all required fields',
      actual: `Decision: ${decision1.overall_decision}, Fields: ${hasRequiredFields ? 'OK' : 'MISSING'}`,
      details: `Approved: ${decision1.approved_languages.length}, Rejected: ${decision1.rejected_languages.length}, Delayed: ${decision1.delayed_languages.length}`
    })
    
    console.log(`  ✓ Decision: ${decision1.overall_decision}`)
    console.log(`  ✓ Approved languages: ${decision1.approved_languages.length}`)
  } catch (error: any) {
    results.push({
      scenario: 'APPROVE_ALL',
      passed: false,
      expected: 'APPROVE_ALL decision',
      actual: `Error: ${error.message}`,
      details: error.stack
    })
    console.log(`  ✗ Error: ${error.message}`)
  }

  // Scenario 2: APPROVE_PARTIAL
  console.log('\nTesting Scenario 2: APPROVE_PARTIAL')
  try {
    const batch2: BatchJob = {
      id: 'batch_approve_partial',
      mic_id: 'mic_002',
      user_id: 'test_user',
      status: 'IN_PROGRESS',
      created_at: Date.now(),
      updated_at: Date.now(),
      editions: {
        en: createMockEdition('en', 80),
        tr: createMockEdition('tr', 80),
        de: createMockEdition('de', 80),
        fr: createMockEdition('fr', 80),
        es: createMockEdition('es', 80),
        ru: createMockEdition('ru', 50), // Low score
        ar: createMockEdition('ar', 50), // Low score
        jp: createMockEdition('jp', 80),
        zh: createMockEdition('zh', 80)
      },
      approved_languages: [],
      pending_languages: [],
      budget: { total: 10000, spent: 0, remaining: 10000 },
      recirculation_count: 0,
      max_recirculation: 3
    }

    const mic2 = createMockMIC()
    const decision2 = await orchestrator.chiefEditorReview(batch2, mic2)
    
    const isApprovePartial = decision2.overall_decision === 'APPROVE_PARTIAL'
    const hasAtLeast5Approved = decision2.approved_languages.length >= 5
    
    results.push({
      scenario: 'APPROVE_PARTIAL',
      passed: isApprovePartial && hasAtLeast5Approved,
      expected: 'APPROVE_PARTIAL decision with ≥5 approved languages',
      actual: `Decision: ${decision2.overall_decision}, Approved: ${decision2.approved_languages.length}`,
      details: `Approved: ${decision2.approved_languages.length}, Rejected: ${decision2.rejected_languages.length}, Delayed: ${decision2.delayed_languages.length}`
    })
    
    console.log(`  ✓ Decision: ${decision2.overall_decision}`)
    console.log(`  ✓ Approved languages: ${decision2.approved_languages.length}`)
  } catch (error: any) {
    results.push({
      scenario: 'APPROVE_PARTIAL',
      passed: false,
      expected: 'APPROVE_PARTIAL decision',
      actual: `Error: ${error.message}`,
      details: error.stack
    })
    console.log(`  ✗ Error: ${error.message}`)
  }

  // Scenario 3: REJECT
  console.log('\nTesting Scenario 3: REJECT')
  try {
    const batch3: BatchJob = {
      id: 'batch_reject',
      mic_id: 'mic_003',
      user_id: 'test_user',
      status: 'IN_PROGRESS',
      created_at: Date.now(),
      updated_at: Date.now(),
      editions: {
        en: createMockEdition('en', 85),
        tr: createMockEdition('tr', 85),
        de: createMockEdition('de', 85),
        fr: createMockEdition('fr', 85),
        es: createMockEdition('es', 85),
        ru: createMockEdition('ru', 85),
        ar: createMockEdition('ar', 85),
        jp: createMockEdition('jp', 85, true), // Has critical issue
        zh: createMockEdition('zh', 85, true)  // Has critical issue
      },
      approved_languages: [],
      pending_languages: [],
      budget: { total: 10000, spent: 0, remaining: 10000 },
      recirculation_count: 0,
      max_recirculation: 3
    }

    const mic3 = createMockMIC()
    const decision3 = await orchestrator.chiefEditorReview(batch3, mic3)
    
    const isReject = decision3.overall_decision === 'REJECT'
    const hasRejectedLanguages = decision3.rejected_languages.length > 0
    
    results.push({
      scenario: 'REJECT',
      passed: isReject && hasRejectedLanguages,
      expected: 'REJECT decision with rejected languages',
      actual: `Decision: ${decision3.overall_decision}, Rejected: ${decision3.rejected_languages.length}`,
      details: `Approved: ${decision3.approved_languages.length}, Rejected: ${decision3.rejected_languages.length}, Delayed: ${decision3.delayed_languages.length}`
    })
    
    console.log(`  ✓ Decision: ${decision3.overall_decision}`)
    console.log(`  ✓ Rejected languages: ${decision3.rejected_languages.length}`)
  } catch (error: any) {
    results.push({
      scenario: 'REJECT',
      passed: false,
      expected: 'REJECT decision',
      actual: `Error: ${error.message}`,
      details: error.stack
    })
    console.log(`  ✗ Error: ${error.message}`)
  }

  // Scenario 4: ESCALATE
  console.log('\nTesting Scenario 4: ESCALATE')
  try {
    const batch4: BatchJob = {
      id: 'batch_escalate',
      mic_id: 'mic_004',
      user_id: 'test_user',
      status: 'IN_PROGRESS',
      created_at: Date.now(),
      updated_at: Date.now(),
      editions: {
        en: createMockEdition('en', 85),
        tr: createMockEdition('tr', 85),
        de: createMockEdition('de', 85),
        fr: createMockEdition('fr', 85),
        es: createMockEdition('es', 85),
        ru: createMockEdition('ru', 85),
        ar: createMockEdition('ar', 85),
        jp: createMockEdition('jp', 85),
        zh: createMockEdition('zh', 85)
      },
      approved_languages: [],
      pending_languages: [],
      budget: { total: 10000, spent: 0, remaining: 10000 },
      recirculation_count: 0,
      max_recirculation: 3
    }

    // Create MIC with high geopolitical risk
    const mic4: MasterIntelligenceCore = {
      ...createMockMIC(),
      truth_nucleus: {
        ...createMockMIC().truth_nucleus,
        geopolitical_context: 'Nuclear conflict escalates with military sanctions and territorial war'
      }
    }

    const decision4 = await orchestrator.chiefEditorReview(batch4, mic4)
    
    const isEscalate = decision4.overall_decision === 'ESCALATE'
    const requiresManualReview = decision4.requires_manual_review === true
    
    results.push({
      scenario: 'ESCALATE',
      passed: isEscalate && requiresManualReview,
      expected: 'ESCALATE decision with requires_manual_review=true',
      actual: `Decision: ${decision4.overall_decision}, Manual Review: ${decision4.requires_manual_review}`,
      details: `Approved: ${decision4.approved_languages.length}, Rejected: ${decision4.rejected_languages.length}, Delayed: ${decision4.delayed_languages.length}`
    })
    
    console.log(`  ✓ Decision: ${decision4.overall_decision}`)
    console.log(`  ✓ Manual review required: ${decision4.requires_manual_review}`)
  } catch (error: any) {
    results.push({
      scenario: 'ESCALATE',
      passed: false,
      expected: 'ESCALATE decision',
      actual: `Error: ${error.message}`,
      details: error.stack
    })
    console.log(`  ✗ Error: ${error.message}`)
  }

  // Summary
  console.log('\n=== Test Results Summary ===')
  const passedCount = results.filter(r => r.passed).length
  const totalCount = results.length
  
  results.forEach(result => {
    console.log(`${result.passed ? '✓' : '✗'} ${result.scenario}: ${result.passed ? 'PASS' : 'FAIL'}`)
    if (!result.passed) {
      console.log(`  Expected: ${result.expected}`)
      console.log(`  Actual: ${result.actual}`)
    }
  })
  
  console.log(`\n${passedCount}/${totalCount} scenarios passed`)
  
  if (passedCount === totalCount) {
    console.log('\n✅ PASS - All Chief Editor integration tests passed')
    return 'PASS'
  } else {
    console.log('\n❌ FAIL - Some tests failed')
    console.log('\nFailed scenarios:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`- ${r.scenario}: ${r.details}`)
    })
    return 'FAIL'
  }
}

// Run the test
testChiefEditorIntegration().then(result => {
  console.log(`\nFinal result: ${result}`)
  process.exit(result === 'PASS' ? 0 : 1)
}).catch(error => {
  console.error('Test execution failed:', error)
  process.exit(1)
})