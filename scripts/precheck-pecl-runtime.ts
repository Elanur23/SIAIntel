#!/usr/bin/env tsx

import { evaluateOperatorPrecheck, logOperatorPrecheckSummary } from '../lib/neural-assembly/stabilization/operator-precheck'

async function main(): Promise<void> {
  const summary = await evaluateOperatorPrecheck()
  logOperatorPrecheckSummary(summary)

  console.log(`strict_validation_mode=${summary.strict_validation_mode}`)
  console.log(`shadow_mode=${summary.shadow_mode}`)
  console.log(`pecl_mode=${summary.pecl_mode}`)
  console.log(`selected_key_id_raw=${summary.selected_key_id_raw || 'NONE'}`)
  console.log(`selected_key_id=${summary.selected_key_id || 'NONE'}`)
  console.log(`private_key_present=${summary.private_key_present}`)
  console.log(`loaded_key_count=${summary.loaded_key_count}`)
  console.log(`loaded_key_ids=${summary.loaded_key_ids.join(',') || 'NONE'}`)
  console.log(`matching_public_key=${summary.matching_public_key}`)
  console.log(`precheck_pass=${summary.pass}`)

  if (!summary.pass) {
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('[PRECHECK_FAIL]', error instanceof Error ? error.message : String(error))
  process.exit(1)
})
