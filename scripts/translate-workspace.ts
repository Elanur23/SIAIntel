#!/usr/bin/env tsx
/**
 * AI Workspace Translation Script
 * Translates ai_workspace.json to all 9 languages
 * 
 * Usage: npx tsx scripts/translate-workspace.ts
 */

import { translateAndUpdateWorkspace } from '../lib/ai/translate-workspace'

async function main() {
  console.log('🚀 AI Workspace Translation Script\n')
  console.log('This will translate ai_workspace.json to all 9 languages:')
  console.log('  en, tr, de, fr, es, ru, ar, jp, zh\n')

  try {
    const result = await translateAndUpdateWorkspace('./ai_workspace.json')

    console.log('\n✅ Translation complete!')
    console.log('\nLanguages available:')
    console.log('  ✓ English (en)')
    console.log('  ✓ Turkish (tr)')
    console.log('  ✓ German (de)')
    console.log('  ✓ French (fr)')
    console.log('  ✓ Spanish (es)')
    console.log('  ✓ Russian (ru)')
    console.log('  ✓ Arabic (ar) - RTL')
    console.log('  ✓ Japanese (jp)')
    console.log('  ✓ Chinese (zh) - Simplified')

    console.log('\n📊 Metadata:')
    console.log(`  Category: ${result.category}`)
    console.log(`  Verification: ${result.verification}`)
    console.log(`  Sentiment: ${result.sentiment}`)

    console.log('\n💡 Next steps:')
    console.log('  1. Review translations in ai_workspace.json')
    console.log('  2. Use the content to create multilingual articles')
    console.log('  3. Test each language route: /en/, /tr/, /de/, etc.')

  } catch (error) {
    console.error('\n❌ Translation failed:', error)
    process.exit(1)
  }
}

main()
