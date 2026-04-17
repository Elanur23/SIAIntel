import { readWorkspace } from '../lib/ai/workspace-io';
import { runLISAArticleAudit } from '../lib/sia-news/lisa-audit-engine';
import { Language } from '../lib/sia-news/types';

/**
 * SIA_LISA Audit Runner
 * Executes Linguistic & Semantic Audit on current ai_workspace.json
 */

async function runAudit() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔍 SIA_LISA AUDIT ENGINE - RUNNING WORKSPACE CHECK');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    const ws = await readWorkspace();
    const langs = Object.keys(ws).filter(k => ['en', 'tr', 'de', 'fr', 'es', 'ru', 'ar', 'jp', 'zh'].includes(k)) as Language[];

    let globalFail = false;

    for (const lang of langs) {
      const node = ws[lang];
      if (!node || !node.content) continue;

      const result = await runLISAArticleAudit(node.content, lang);

      const status = result.passed ? '✅ PASSED' : '❌ FAILED';
      console.log(`Node: [${lang.toUpperCase()}] ${status} (Score: ${result.score}/100)`);

      if (result.violations.length > 0) {
        result.violations.forEach(v => {
          const color = v.severity === 'CRITICAL' ? '🚩' : v.severity === 'HIGH' ? '⚠️' : 'ℹ️';
          console.log(`   ${color} [${v.category}] ${v.description}`);
        });
      }

      if (!result.passed) globalFail = true;
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (globalFail) {
      console.log('🚩 AUDIT RESULT: FAIL - Linguistic integrity below threshold.');
      console.log('👉 RECOMMENDATION: Cleanse AI-isms and increase information density.');
    } else {
      console.log('✅ AUDIT RESULT: SUCCESS - All nodes compliant with LISA Protocol.');
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error: any) {
    console.error('❌ Audit Runner Error:', error.message);
  }
}

runAudit();
