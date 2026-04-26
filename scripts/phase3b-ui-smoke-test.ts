/**
 * PHASE 3B UI SMOKE TEST
 * 
 * Tests FORMAT_REPAIR suggestion generation and Phase 3B modal eligibility
 * via direct vault injection (bypassing Panda import).
 * 
 * WHY THIS APPROACH:
 * The ONLY triggers that generate FORMAT_REPAIR suggestions ("## ##", "### ###")
 * are BLOCKED by Panda intake validation with FOOTER_INTEGRITY_FAILURE.
 * This is BY DESIGN to prevent malformed content from entering production.
 * 
 * Therefore, we test FORMAT_REPAIR flow by:
 * 1. Directly constructing Warroom vault state (synthetic)
 * 2. Running Global Governance Audit
 * 3. Generating FORMAT_REPAIR suggestions
 * 4. Validating suggestion eligibility for Phase 3B modal
 * 5. Documenting manual UI testing requirements
 * 
 * SAFETY: Read-only verification - no mutations, no API calls, no side effects.
 */

import { runGlobalGovernanceAudit } from '../lib/editorial/global-governance-audit'
import { generateRemediationPlan } from '../lib/editorial/remediation-engine'
import { RemediationCategory, RemediationSafetyLevel } from '../lib/editorial/remediation-types'
import { isApplyEligibleSuggestion, getApplyBlockReason } from '../lib/editorial/remediation-apply-types'

// ============================================================================
// SYNTHETIC VAULT STATE CONSTRUCTION
// ============================================================================

/**
 * Construct synthetic Warroom vault state with "## ##" trigger.
 * This simulates what the vault would look like if a payload with malformed
 * markdown somehow entered the system (which Panda validation prevents).
 */
function constructSyntheticVault() {
  const baseBody = `This is a test article body with malformed markdown.

## ##

The above line contains malformed markdown prefixes (double hash with space) that should trigger the Global Governance Audit to detect a FORMAT_REPAIR issue. This will generate a remediation suggestion with REQUIRES_HUMAN_APPROVAL safety level, making it eligible for the Phase 3B Review Suggestion modal.

This test validates the complete Phase 3B smoke path:
1. Vault state with malformed markdown
2. Global 9-Node Audit detection
3. Remediation suggestion generation
4. FORMAT_REPAIR suggestion display
5. Review Suggestion button visibility
6. Phase 3B confirmation modal opening (manual UI test)

Phase 3B is a UI prototype only. The Apply to Draft button must remain permanently disabled with no onClick handler. No mutations to vault, draft, or audit state are allowed.`

  // Extend body to meet 200 character minimum for non-EN languages
  const extendedBody = (lang: string) => {
    const langSuffix = ` This test payload is created for Phase 3B smoke testing purposes. It is not intended for production use. The remediation engine must correctly process string-format audit results and classify them into the appropriate FORMAT_REPAIR category. The Global Governance Audit must detect the malformed markdown pattern and add it to the criticalIssues array as a string finding.`
    return baseBody + langSuffix
  }

  return {
    en: {
      title: 'Phase 3B Format Repair Test Article',
      desc: baseBody,
      ready: true
    },
    tr: {
      title: 'Phase 3B Format Onarımı Test Makalesi',
      desc: extendedBody('tr'),
      ready: true
    },
    de: {
      title: 'Phase 3B Format-Reparatur-Testartikel',
      desc: extendedBody('de'),
      ready: true
    },
    fr: {
      title: 'Article de test de réparation de format Phase 3B',
      desc: extendedBody('fr'),
      ready: true
    },
    es: {
      title: 'Artículo de prueba de reparación de formato Phase 3B',
      desc: extendedBody('es'),
      ready: true
    },
    ru: {
      title: 'Тестовая статья исправления формата Phase 3B',
      desc: extendedBody('ru'),
      ready: true
    },
    ar: {
      title: 'مقالة اختبار إصلاح التنسيق Phase 3B',
      desc: extendedBody('ar'),
      ready: true
    },
    jp: {
      title: 'Phase 3B フォーマット修復テスト記事',
      desc: `これは 不正な markdown を 含む テスト 記事 本文 です。 Phase 3B の テスト 目的 で 作成 されました。

## ##

上記 の 行 には、 グローバル ガバナンス 監査 が FORMAT_REPAIR 問題 を 検出 する よう トリガー する 不正な markdown プレフィックス （スペース 付き ダブル ハッシュ） が 含まれて います。 この テスト は、 Phase 3B 修正 モーダル の 完全な スモーク パス を 検証 します。 テスト には、 ボールト 状態 の 不正な markdown、 グローバル 9 ノード 監査 検出、 修正 提案 生成、 FORMAT_REPAIR 提案 表示、 提案 を 確認 ボタン の 可視性、 Phase 3B 確認 モーダル の 開閉 （手動 UI テスト） が 含まれます。 Phase 3B は UI プロトタイプ のみ です。 ドラフト に 適用 ボタン は、 onClick ハンドラー なし で 永久 に 無効 の まま である 必要 が あります。 ボールト、 ドラフト、 または 監査 状態 への 変更 は 許可 されて いません。`,
      ready: true
    },
    zh: {
      title: 'Phase 3B 格式修复测试文章',
      desc: `这是 一个 包含 格式 错误 markdown 的 测试 文章 正文。 Phase 3B 的 测试 目的 创建。

## ##

上面 的 行 包含 格式 错误 的 markdown 前缀 （带 空格 的 双 井号），应该 触发 全局 治理 审计 以 检测 FORMAT_REPAIR 问题。 此 测试 验证 Phase 3B 修正 模态框 的 完整 冒烟 路径。 测试 包括 保险库 状态 的 格式 错误 markdown、 全局 9 节点 审计 检测、 修正 建议 生成、 FORMAT_REPAIR 建议 显示、 审查 建议 按钮 可见性、 Phase 3B 确认 模态框 打开 （手动 UI 测试）。 Phase 3B 仅为 UI 原型。 应用 到 草稿 按钮 必须 在 没有 onClick 处理 程序 的 情况下 保持 永久 禁用。 不 允许 对 保险库、 草稿 或 审计 状态 进行 任何 更改。`,
      ready: true
    }
  }
}

// ============================================================================
// TEST EXECUTION
// ============================================================================

console.log('='.repeat(80))
console.log('PHASE 3B UI SMOKE TEST')
console.log('='.repeat(80))
console.log()
console.log('⚠️  NOTE: This test bypasses Panda import because FORMAT_REPAIR triggers')
console.log('   ("## ##", "### ###") are BLOCKED by Panda intake validation.')
console.log('   This is BY DESIGN and CORRECT for production.')
console.log()

let passCount = 0
let failCount = 0

function check(name: string, condition: boolean, expected?: string, actual?: string) {
  if (condition) {
    console.log(`✅ ${name}`)
    passCount++
  } else {
    console.log(`❌ ${name}`)
    if (expected && actual) {
      console.log(`   Expected: ${expected}`)
      console.log(`   Actual: ${actual}`)
    }
    failCount++
  }
}

// STEP 1: Construct synthetic vault
console.log('📋 Step 1: Constructing synthetic Warroom vault state...\n')
const vault = constructSyntheticVault()

check('Vault has all 9 languages', Object.keys(vault).length === 9)
check('EN node ready', vault.en.ready === true)
check('JP node ready', vault.jp.ready === true)
check('ZH node ready', vault.zh.ready === true)
check('EN body contains "## ##"', vault.en.desc.includes('## ##'))
check('JP body contains "## ##"', vault.jp.desc.includes('## ##'))
check('ZH body contains "## ##"', vault.zh.desc.includes('## ##'))

console.log()

// STEP 2: Run Global Governance Audit
console.log('📋 Step 2: Running Global Governance Audit...\n')
const auditResult = runGlobalGovernanceAudit('test-format-repair-001', vault)

check('Audit completed', !!auditResult)
check('Audit has language results', Object.keys(auditResult.languages).length === 9)

const enAudit = auditResult.languages.en
const jpAudit = auditResult.languages.jp
const zhAudit = auditResult.languages.zh

check('EN audit has critical issues', enAudit.criticalIssues.length > 0)
check('JP audit has critical issues', jpAudit.criticalIssues.length > 0)
check('ZH audit has critical issues', zhAudit.criticalIssues.length > 0)

const enHasMalformed = enAudit.criticalIssues.some(i => i.includes('Malformed markdown'))
const jpHasMalformed = jpAudit.criticalIssues.some(i => i.includes('Malformed markdown'))
const zhHasMalformed = zhAudit.criticalIssues.some(i => i.includes('Malformed markdown'))

check('EN audit detected malformed markdown', enHasMalformed)
check('JP audit detected malformed markdown', jpHasMalformed)
check('ZH audit detected malformed markdown', zhHasMalformed)

console.log()

// STEP 3: Generate Remediation Plan
console.log('📋 Step 3: Generating remediation plan...\n')
const plan = generateRemediationPlan({
  articleId: 'test-format-repair-001',
  packageId: 'phase3b-ui-smoke-test',
  globalAudit: auditResult.languages
})

check('Plan generated', !!plan)
check('Plan has suggestions', plan.totalIssues > 0)
check('Plan has at least 1 suggestion', plan.suggestions.length >= 1)

console.log()

// STEP 4: Validate FORMAT_REPAIR Suggestions
console.log('📋 Step 4: Validating FORMAT_REPAIR suggestions...\n')

const formatRepairSuggestions = plan.suggestions.filter(
  s => s.category === RemediationCategory.FORMAT_REPAIR
)

check('At least 1 FORMAT_REPAIR suggestion', formatRepairSuggestions.length >= 1)

if (formatRepairSuggestions.length > 0) {
  const suggestion = formatRepairSuggestions[0]
  
  check('Suggestion category is FORMAT_REPAIR', 
    suggestion.category === RemediationCategory.FORMAT_REPAIR,
    'FORMAT_REPAIR',
    suggestion.category
  )
  
  check('Suggestion requires human approval',
    suggestion.requiresHumanApproval === true,
    'true',
    String(suggestion.requiresHumanApproval)
  )
  
  check('Suggestion has suggestedText',
    !!suggestion.suggestedText && suggestion.suggestedText.trim().length > 0,
    'non-empty string',
    suggestion.suggestedText || 'null'
  )
  
  check('Suggestion safety level is REQUIRES_HUMAN_APPROVAL',
    suggestion.safetyLevel === RemediationSafetyLevel.REQUIRES_HUMAN_APPROVAL,
    'REQUIRES_HUMAN_APPROVAL',
    suggestion.safetyLevel
  )
  
  check('Issue description contains "Malformed markdown"',
    suggestion.issueDescription.includes('Malformed markdown'),
    'contains "Malformed markdown"',
    suggestion.issueDescription
  )
  
  check('Suggestion cannot auto-publish',
    suggestion.cannotAutoPublish === true,
    'true',
    String(suggestion.cannotAutoPublish)
  )
  
  check('Suggestion cannot auto-deploy',
    suggestion.cannotAutoDeploy === true,
    'true',
    String(suggestion.cannotAutoDeploy)
  )
  
  check('Suggestion preserves facts',
    suggestion.preservesFacts === true,
    'true',
    String(suggestion.preservesFacts)
  )
  
  console.log()
  
  // STEP 5: Validate Phase 3B Modal Eligibility
  console.log('📋 Step 5: Validating Phase 3B modal eligibility...\n')
  
  const isEligible = isApplyEligibleSuggestion(suggestion)
  const blockReason = getApplyBlockReason(suggestion)
  
  check('Suggestion is eligible for Review Suggestion button',
    isEligible === true,
    'true',
    String(isEligible)
  )
  
  check('No block reason for Review Suggestion',
    blockReason === null,
    'null',
    blockReason || 'null'
  )
  
  console.log()
  console.log('SUGGESTION DETAILS:')
  console.log('-'.repeat(80))
  console.log(`ID: ${suggestion.id}`)
  console.log(`Category: ${suggestion.category}`)
  console.log(`Severity: ${suggestion.severity}`)
  console.log(`Safety Level: ${suggestion.safetyLevel}`)
  console.log(`Issue Type: ${suggestion.issueType}`)
  console.log(`Issue Description: ${suggestion.issueDescription}`)
  console.log(`Suggested Text: ${suggestion.suggestedText}`)
  console.log(`Rationale: ${suggestion.rationale}`)
  console.log(`Requires Approval: ${suggestion.requiresHumanApproval}`)
  console.log(`Can Apply to Draft: ${suggestion.canApplyToDraft}`)
  console.log(`Cannot Auto Publish: ${suggestion.cannotAutoPublish}`)
  console.log(`Cannot Auto Deploy: ${suggestion.cannotAutoDeploy}`)
  console.log(`Preserves Facts: ${suggestion.preservesFacts}`)
  console.log()
}

// STEP 6: Document Manual UI Testing
console.log('📋 Step 6: Manual UI Testing Requirements\n')
console.log('-'.repeat(80))
console.log('⚠️  MANUAL TESTING REQUIRED:')
console.log()
console.log('1. Open Warroom page in browser')
console.log('2. Manually construct vault state with "## ##" trigger')
console.log('3. Verify FORMAT_REPAIR suggestion appears in Suggested Fixes panel')
console.log('4. Verify "Review Suggestion" button is visible and enabled')
console.log('5. Click "Review Suggestion" button')
console.log('6. Verify Phase 3B confirmation modal opens')
console.log('7. Verify modal shows suggestion details')
console.log('8. Verify "Apply to Draft" button is DISABLED')
console.log('9. Verify "Apply to Draft" button has NO onClick handler')
console.log('10. Verify "Cancel" button closes modal')
console.log('11. Verify no vault/draft/audit mutations occur')
console.log()
console.log('CRITICAL SAFETY CHECKS:')
console.log('- Apply to Draft button MUST be permanently disabled')
console.log('- No onClick handler MUST exist on Apply button')
console.log('- No mutations to vault, draft, or audit state')
console.log('- Phase 3B is UI prototype only')
console.log('-'.repeat(80))
console.log()

// SUMMARY
console.log('='.repeat(80))
console.log(`VERIFICATION RESULT: ${passCount} passed, ${failCount} failed`)
console.log('='.repeat(80))
console.log()

if (failCount === 0) {
  console.log('✅ AUTOMATED VERIFICATION PASSED')
  console.log()
  console.log('⚠️  NEXT STEP: Complete manual UI testing (see Step 6 above)')
  console.log()
  process.exit(0)
} else {
  console.log('❌ AUTOMATED VERIFICATION FAILED')
  console.log()
  process.exit(1)
}
