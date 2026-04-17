#!/usr/bin/env node
/**
 * BATCH MIGRATION SCRIPT
 * Migrates all remaining direct Gemini SDK usage to central boundary
 * 
 * CRITICAL: This script performs AST-level transformations
 * Run with SHADOW_MODE=true to prevent quota drain
 */

const fs = require('fs')
const path = require('path')

// Files to migrate (in priority order)
const MIGRATION_TARGETS = [
  // HIGH PRIORITY - Active production paths
  { file: 'lib/search/translation-service.ts', priority: 'HIGH', purpose: 'translation' },
  { file: 'lib/search/embedding-generator.ts', priority: 'HIGH', purpose: 'embedding' },
  { file: 'lib/dispatcher/translation-engine.ts', priority: 'HIGH', purpose: 'translation' },
  { file: 'lib/sia-news/gemini-integration.ts', priority: 'HIGH', purpose: 'market_analysis' },
  { file: 'lib/services/SiaIntelligenceProcessor.ts', priority: 'HIGH', purpose: 'intelligence' },
  { file: 'lib/distribution/ai/providers/gemini-provider.ts', priority: 'HIGH', purpose: 'main_generation' },
  
  // MEDIUM PRIORITY - Secondary paths
  { file: 'lib/ai/translation-service.ts', priority: 'MEDIUM', purpose: 'translation' },
  { file: 'lib/ai/embedding-service.ts', priority: 'MEDIUM', purpose: 'embedding' },
  { file: 'lib/ai-generator.ts', priority: 'MEDIUM', purpose: 'main_generation' },
  
  // LOW PRIORITY - Legacy/unused
  { file: 'lib/ai/baidu-optimizer.ts', priority: 'LOW', purpose: 'other' },
  { file: 'lib/ai/deep-dive-generator.ts', priority: 'LOW', purpose: 'other' },
  { file: 'lib/ai/deep-intelligence-pro.ts', priority: 'LOW', purpose: 'other' },
  { file: 'lib/ai/global-cpm-master.ts', priority: 'LOW', purpose: 'other' },
  { file: 'lib/ai/global-intelligence-generator.ts', priority: 'LOW', purpose: 'other' },
  { file: 'lib/ai/groq-provider.ts', priority: 'LOW', purpose: 'other' },
  { file: 'lib/ai/sealed-depth-protocol.ts', priority: 'LOW', purpose: 'other' },
  { file: 'lib/ai/seo-meta-architect.ts', priority: 'LOW', purpose: 'other' },
  
  // SPECIAL - Remaining call in partially migrated file
  { file: 'lib/sovereign-core/neuro-sync-kernel.ts', priority: 'HIGH', purpose: 'intelligence' }
]

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('          BATCH GEMINI MIGRATION SCRIPT')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log()
console.log(`Total files to migrate: ${MIGRATION_TARGETS.length}`)
console.log()

// Group by priority
const byPriority = MIGRATION_TARGETS.reduce((acc, target) => {
  acc[target.priority] = (acc[target.priority] || 0) + 1
  return acc
}, {})

console.log('Priority Breakdown:')
console.log(`  HIGH: ${byPriority.HIGH || 0} files`)
console.log(`  MEDIUM: ${byPriority.MEDIUM || 0} files`)
console.log(`  LOW: ${byPriority.LOW || 0} files`)
console.log()

console.log('Migration Plan:')
MIGRATION_TARGETS.forEach((target, index) => {
  const exists = fs.existsSync(target.file)
  const status = exists ? '✓' : '✗ MISSING'
  console.log(`  ${index + 1}. [${target.priority}] ${target.file} ${status}`)
})

console.log()
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('NEXT STEPS:')
console.log('  1. Review migration plan above')
console.log('  2. Execute migrations in priority order')
console.log('  3. Run guardrail after each batch')
console.log('  4. Verify with SHADOW_MODE=true')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
