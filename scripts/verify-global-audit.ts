/**
 * GLOBAL GOVERNANCE AUDIT VERIFICATION SCRIPT
 * Tests the 9-language global audit engine with comprehensive test cases
 */

import { runGlobalGovernanceAudit, type GlobalAuditResult } from '../lib/editorial/global-governance-audit';
import { PANDA_REQUIRED_LANGS } from '../lib/content/sia-panda-writing-protocol';

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface VaultNode {
  title: string;
  desc: string;
  ready: boolean;
}

type TestVault = Record<string, VaultNode>;

function createValidVault(): TestVault {
  const vault: TestVault = {};
  
  PANDA_REQUIRED_LANGS.forEach((lang) => {
    vault[lang] = {
      title: `Test Article ${lang.toUpperCase()}`,
      desc: `This is a comprehensive test article for ${lang.toUpperCase()} language node. It contains sufficient content with proper risk disclaimers and no forbidden residue. The article discusses market trends with data points like $1.5 billion in trading volume and 25% growth rate. Risk: Markets are volatile and past performance does not guarantee future results.`,
      ready: true
    };
  });
  
  return vault;
}

function logTestResult(testName: string, passed: boolean, details?: string) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`\n${status}: ${testName}`);
  if (details) {
    console.log(`   ${details}`);
  }
}

function logAuditSummary(result: GlobalAuditResult) {
  console.log(`\n   Article ID: ${result.articleId}`);
  console.log(`   Status: ${result.status}`);
  console.log(`   Publishable: ${result.publishable}`);
  console.log(`   Gating Status: ${result.gatingStatus}`);
  console.log(`   Global Score: ${result.globalScore}/100`);
  console.log(`   Failed Languages: ${result.failedLanguages.length > 0 ? result.failedLanguages.join(', ') : 'None'}`);
  console.log(`   Warning Languages: ${result.warningLanguages.length > 0 ? result.warningLanguages.join(', ') : 'None'}`);
  if (result.globalFindings.length > 0) {
    console.log(`   Global Findings:`);
    result.globalFindings.forEach(f => console.log(`     - ${f}`));
  }
}

// ============================================================================
// TEST CASES
// ============================================================================

console.log('='.repeat(80));
console.log('GLOBAL GOVERNANCE AUDIT ENGINE VERIFICATION');
console.log('='.repeat(80));

let passCount = 0;
let failCount = 0;

// TEST 1: Valid 9-language package passes global audit
console.log('\n[TEST 1] Valid 9-language package passes global audit');
try {
  const vault = createValidVault();
  const result = runGlobalGovernanceAudit('test-article-001', vault);
  
  const passed = result.publishable === true && 
                 result.status === 'PASS' && 
                 result.gatingStatus === 'READY_FOR_GLOBAL_DEPLOY' &&
                 result.failedLanguages.length === 0;
  
  logTestResult('Valid 9-language package', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Valid 9-language package', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 2: Missing TR fails
console.log('\n[TEST 2] Missing TR language fails global audit');
try {
  const vault = createValidVault();
  delete vault['tr'];
  
  const result = runGlobalGovernanceAudit('test-article-002', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.gatingStatus === 'GATING_RESTRICTED' &&
                 result.failedLanguages.includes('tr');
  
  logTestResult('Missing TR fails', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Missing TR fails', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 3: Missing JP fails
console.log('\n[TEST 3] Missing JP language fails global audit');
try {
  const vault = createValidVault();
  delete vault['jp'];
  
  const result = runGlobalGovernanceAudit('test-article-003', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.gatingStatus === 'GATING_RESTRICTED' &&
                 result.failedLanguages.includes('jp');
  
  logTestResult('Missing JP fails', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Missing JP fails', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 4: Residue in ZH fails global audit
console.log('\n[TEST 4] Residue in ZH language fails global audit');
try {
  const vault = createValidVault();
  vault['zh'].desc = 'Option 1: This is a test article with forbidden residue.';
  
  const result = runGlobalGovernanceAudit('test-article-004', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.gatingStatus === 'GATING_RESTRICTED' &&
                 result.languages['zh'].residueDetected === true;
  
  logTestResult('Residue in ZH fails', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Residue in ZH fails', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 5: Empty FR body/content fails global audit
console.log('\n[TEST 5] Empty FR body/content fails global audit');
try {
  const vault = createValidVault();
  vault['fr'].desc = '';
  
  const result = runGlobalGovernanceAudit('test-article-005', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.gatingStatus === 'GATING_RESTRICTED' &&
                 result.languages['fr'].criticalIssues.length > 0;
  
  logTestResult('Empty FR body fails', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Empty FR body fails', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 6: Fake verification claim fails
console.log('\n[TEST 6] Fake verification claim fails global audit');
try {
  const vault = createValidVault();
  vault['en'].desc += ' This content has been multilingual parity verified by our team.';
  
  const result = runGlobalGovernanceAudit('test-article-006', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.gatingStatus === 'GATING_RESTRICTED' &&
                 result.languages['en'].provenanceFindings.length > 0;
  
  logTestResult('Fake verification claim fails', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Fake verification claim fails', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 7: Unsupported confidence score fails
console.log('\n[TEST 7] Unsupported confidence score claim fails global audit');
try {
  const vault = createValidVault();
  vault['de'].desc += ' Our confidence score for this analysis is 98.5%.';
  
  const result = runGlobalGovernanceAudit('test-article-007', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.gatingStatus === 'GATING_RESTRICTED' &&
                 result.languages['de'].provenanceFindings.length > 0;
  
  logTestResult('Unsupported confidence score fails', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Unsupported confidence score fails', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 8: Deterministic finance claim fails
console.log('\n[TEST 8] Deterministic financial claim fails global audit');
try {
  const vault = createValidVault();
  vault['es'].desc += ' This investment offers guaranteed returns of 20% annually.';
  
  const result = runGlobalGovernanceAudit('test-article-008', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.gatingStatus === 'GATING_RESTRICTED' &&
                 result.languages['es'].criticalIssues.some(i => i.includes('Deterministic'));
  
  logTestResult('Deterministic finance claim fails', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Deterministic finance claim fails', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 9: Numeric mismatch creates parity finding
console.log('\n[TEST 9] Numeric mismatch between EN and TR creates parity finding');
try {
  const vault = createValidVault();
  vault['en'].desc = 'The market cap reached $500 billion with 15% growth.';
  vault['tr'].desc = 'Piyasa değeri $200 milyar ve %30 büyüme ile ulaştı.'; // Different numbers
  
  const result = runGlobalGovernanceAudit('test-article-009', vault);
  
  const passed = result.languages['tr'].parityFindings.length > 0 &&
                 result.consistency.numberParityPass === false;
  
  logTestResult('Numeric mismatch creates parity finding', passed, 
    `Parity findings: ${result.languages['tr'].parityFindings.join(', ')}`);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Numeric mismatch creates parity finding', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 10: Global publishable is false if any one language fails
console.log('\n[TEST 10] Global publishable is false if any one language fails');
try {
  const vault = createValidVault();
  vault['ar'].desc = 'Too short'; // Below minimum word count
  
  const result = runGlobalGovernanceAudit('test-article-010', vault);
  
  const passed = result.publishable === false && 
                 result.gatingStatus === 'GATING_RESTRICTED' &&
                 result.failedLanguages.includes('ar');
  
  logTestResult('One language failure blocks global publish', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('One language failure blocks global publish', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 11: Global publishable is true only if all 9 pass
console.log('\n[TEST 11] Global publishable is true only if all 9 languages pass');
try {
  const vault = createValidVault();
  
  const result = runGlobalGovernanceAudit('test-article-011', vault);
  
  const allPass = PANDA_REQUIRED_LANGS.every(lang => 
    result.languages[lang as keyof typeof result.languages]?.status === 'PASS'
  );
  
  const passed = result.publishable === true && 
                 result.status === 'PASS' && 
                 result.gatingStatus === 'READY_FOR_GLOBAL_DEPLOY' &&
                 result.failedLanguages.length === 0 &&
                 allPass;
  
  logTestResult('All 9 languages pass enables global publish', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('All 9 languages pass enables global publish', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 12: Simulated state invalidation (conceptual test)
console.log('\n[TEST 12] State invalidation behavior (conceptual verification)');
try {
  // This test verifies the concept that global audit should be cleared on import/edit
  // In the actual Warroom page, this is handled by:
  // - applyPandaPackageToVault: setGlobalAudit(null)
  // - loadManualDraft: setGlobalAudit(null)
  // - handleTransform: setGlobalAudit(null)
  // - textarea onChange: setGlobalAudit(null)
  
  const vault = createValidVault();
  const result1 = runGlobalGovernanceAudit('test-article-012', vault);
  
  // Wait 1ms to ensure different timestamp
  const start = Date.now();
  while (Date.now() - start < 2) { /* busy wait */ }
  
  // Simulate edit
  vault['en'].desc += ' Additional content added.';
  
  // In actual implementation, globalAudit would be null here
  // New audit would need to be run
  const result2 = runGlobalGovernanceAudit('test-article-012', vault);
  
  // Both audits should be valid but have different timestamps
  const passed = result1.timestamp !== result2.timestamp && 
                 result1.publishable === true && 
                 result2.publishable === true;
  
  logTestResult('State invalidation on edit (conceptual)', passed, 
    'Warroom clears globalAudit on: import, manual load, transform, and textarea edit');
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('State invalidation on edit (conceptual)', false, `Error: ${e.message}`);
  failCount++;
}

// ============================================================================
// VAULT LABEL FALSE POSITIVE TESTS (CRITICAL)
// ============================================================================

// TEST 13: PANDA-import-style composed vault with structural labels passes
console.log('\n[TEST 13] PANDA-import-style composed vault with structural labels passes');
try {
  const vault: TestVault = {};
  
  PANDA_REQUIRED_LANGS.forEach((lang) => {
    // Simulate the exact format from applyPandaPackageToVault()
    const composedDesc = [
      `[SUBHEADLINE]`,
      `Analysis of recent market trends in ${lang.toUpperCase()}`,
      ``,
      `[SUMMARY]`,
      `This article provides comprehensive market analysis with data-driven insights. Trading volume reached $1.5 billion with 25% growth rate.`,
      ``,
      `[BODY]`,
      `Detailed market analysis shows strong performance across multiple sectors. Key indicators suggest continued growth momentum. Financial experts note the importance of diversification.`,
      ``,
      `[KEY_INSIGHTS]`,
      `• Market cap increased by 15%`,
      `• Trading volume at $1.5 billion`,
      `• Growth rate of 25% year-over-year`,
      ``,
      `[RISK_NOTE]`,
      `This article is not investment advice. Markets are volatile and past performance does not guarantee future results.`,
      ``,
      `[SEO_TITLE]`,
      `Market Analysis ${lang.toUpperCase()} - Latest Trends`,
      ``,
      `[SEO_DESCRIPTION]`,
      `Comprehensive market analysis for ${lang.toUpperCase()} with data-driven insights`,
      ``,
      `[PROVENANCE]`,
      `Generated under SIA Protocol; pending Warroom validation. Source attribution limited to provided input. No independent verification claimed.`
    ].join('\n');
    
    vault[lang] = {
      title: `Market Update ${lang.toUpperCase()}`,
      desc: composedDesc,
      ready: true
    };
  });
  
  const result = runGlobalGovernanceAudit('test-panda-001', vault);
  
  const passed = result.publishable === true && 
                 result.status === 'PASS' && 
                 result.gatingStatus === 'READY_FOR_GLOBAL_DEPLOY' &&
                 result.failedLanguages.length === 0 &&
                 result.globalScore >= 70;
  
  logTestResult('PANDA-style composed vault with labels passes', passed, 
    `Labels [SUBHEADLINE], [SUMMARY], [BODY], [KEY_INSIGHTS], [RISK_NOTE], [SEO_TITLE], [SEO_DESCRIPTION], [PROVENANCE] should NOT trigger residue detection`);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('PANDA-style composed vault with labels passes', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 14: Safe provenance wording passes
console.log('\n[TEST 14] Safe provenance wording passes');
try {
  const vault = createValidVault();
  vault['en'].desc += '\n\nGenerated under SIA Protocol; pending Warroom validation. This article does not claim independent verification.';
  
  const result = runGlobalGovernanceAudit('test-provenance-001', vault);
  
  const passed = result.languages['en'].residueDetected === false &&
                 result.languages['en'].provenanceFindings.length === 0 &&
                 result.languages['en'].score > 0;
  
  logTestResult('Safe provenance wording passes', passed, 
    'Phrases like "does not claim independent verification" and "pending Warroom validation" should be allowed');
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Safe provenance wording passes', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 15: Actual residue "Option 2" still fails
console.log('\n[TEST 15] Actual residue "Option 2" still fails');
try {
  const vault = createValidVault();
  vault['fr'].desc = 'Option 2: This is a test article with actual forbidden residue that should fail.';
  
  const result = runGlobalGovernanceAudit('test-residue-001', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.languages['fr'].residueDetected === true &&
                 result.languages['fr'].score === 0;
  
  logTestResult('Actual residue "Option 2" still fails', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Actual residue "Option 2" still fails', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 16: Actual residue "Great for Google News" still fails
console.log('\n[TEST 16] Actual residue "Great for Google News" still fails');
try {
  const vault = createValidVault();
  vault['ru'].desc = 'This article is Great for Google News and will go viral.';
  
  const result = runGlobalGovernanceAudit('test-residue-002', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.languages['ru'].residueDetected === true &&
                 result.languages['ru'].score === 0;
  
  logTestResult('Actual residue "Great for Google News" still fails', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Actual residue "Great for Google News" still fails', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 17: Fake verification "verified E-E-A-T" still fails
console.log('\n[TEST 17] Fake verification "verified E-E-A-T" still fails');
try {
  const vault = createValidVault();
  vault['ar'].desc += ' This content has been E-E-A-T verified by our editorial team.';
  
  const result = runGlobalGovernanceAudit('test-fake-verification-001', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.languages['ar'].provenanceFindings.length > 0 &&
                 result.languages['ar'].score === 0;
  
  logTestResult('Fake verification "verified E-E-A-T" still fails', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Fake verification "verified E-E-A-T" still fails', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 18: Unsupported score "confidence score: 95%" still fails
console.log('\n[TEST 18] Unsupported score "confidence score: 95%" still fails');
try {
  const vault = createValidVault();
  vault['jp'].desc += ' Our confidence score for this prediction is 95%.';
  
  const result = runGlobalGovernanceAudit('test-unsupported-score-001', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.languages['jp'].provenanceFindings.length > 0 &&
                 result.languages['jp'].score === 0;
  
  logTestResult('Unsupported score "confidence score: 95%" still fails', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Unsupported score "confidence score: 95%" still fails', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 19: Deterministic finance "will rise" still fails
console.log('\n[TEST 19] Deterministic finance "will rise" still fails');
try {
  const vault = createValidVault();
  vault['zh'].desc += ' The stock price will rise to $500 by next quarter.';
  
  const result = runGlobalGovernanceAudit('test-deterministic-001', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.languages['zh'].criticalIssues.some(i => i.includes('Deterministic')) &&
                 result.languages['zh'].score === 0;
  
  logTestResult('Deterministic finance "will rise" still fails', passed);
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Deterministic finance "will rise" still fails', false, `Error: ${e.message}`);
  failCount++;
}

// TEST 20: Single non-active language with residue blocks global publish
console.log('\n[TEST 20] Single non-active language with residue blocks global publish');
try {
  const vault: TestVault = {};
  
  PANDA_REQUIRED_LANGS.forEach((lang) => {
    const composedDesc = [
      `[SUBHEADLINE]`,
      `Market analysis for ${lang.toUpperCase()}`,
      `[SUMMARY]`,
      `Comprehensive market data with $1.5 billion volume.`,
      `[BODY]`,
      `Detailed analysis of market trends and performance indicators.`,
      `[RISK_NOTE]`,
      `This is not investment advice.`
    ].join('\n');
    
    vault[lang] = {
      title: `Market Update ${lang.toUpperCase()}`,
      desc: composedDesc,
      ready: true
    };
  });
  
  // Inject residue into DE (non-active language)
  vault['de'].desc += '\n\nOption 3: This is forbidden residue in German node.';
  
  const result = runGlobalGovernanceAudit('test-global-block-001', vault);
  
  const passed = result.publishable === false && 
                 result.status === 'FAIL' && 
                 result.gatingStatus === 'GATING_RESTRICTED' &&
                 result.languages['de'].residueDetected === true &&
                 result.failedLanguages.includes('de');
  
  logTestResult('Single non-active language with residue blocks global publish', passed, 
    'Even if active language (EN) is clean, residue in any other language must block deploy');
  logAuditSummary(result);
  
  if (passed) passCount++;
  else failCount++;
} catch (e: any) {
  logTestResult('Single non-active language with residue blocks global publish', false, `Error: ${e.message}`);
  failCount++;
}

// ============================================================================
// SUMMARY
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('VERIFICATION SUMMARY');
console.log('='.repeat(80));
console.log(`Total Tests: ${passCount + failCount}`);
console.log(`Passed: ${passCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Success Rate: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
console.log('='.repeat(80));

if (failCount === 0) {
  console.log('\n✅ ALL TESTS PASSED - Global Governance Audit Engine is operational\n');
  process.exit(0);
} else {
  console.log(`\n❌ ${failCount} TEST(S) FAILED - Review implementation\n`);
  process.exit(1);
}
