/**
 * AUTOMATED TYPE FIXES - Script to fix common strict mode errors
 * 
 * Run with: npx ts-node scripts/fix-strict-types.ts
 */

import * as fs from 'fs'
import * as path from 'path'
import { glob } from 'glob'

interface Fix {
  pattern: RegExp
  replacement: string
  description: string
}

const fixes: Fix[] = [
  // Fix: t.something where t might be undefined
  {
    pattern: /(\s+)t\.(\w+)/g,
    replacement: '$1t?.$ 2 ?? \'\'',
    description: 'Add optional chaining to translation function calls'
  },
  // Fix: content.something where content might be undefined
  {
    pattern: /(\s+)content\.(\w+)/g,
    replacement: '$1content?.$ 2',
    description: 'Add optional chaining to content property access'
  },
  // Fix: labels.something where labels might be undefined
  {
    pattern: /(\s+)labels\.(\w+)/g,
    replacement: '$1labels?.$ 2',
    description: 'Add optional chaining to labels property access'
  },
]

async function fixFile(filePath: string): Promise<number> {
  let content = fs.readFileSync(filePath, 'utf-8')
  let fixCount = 0

  for (const fix of fixes) {
    const matches = content.match(fix.pattern)
    if (matches) {
      content = content.replace(fix.pattern, fix.replacement)
      fixCount += matches.length
    }
  }

  if (fixCount > 0) {
    fs.writeFileSync(filePath, content, 'utf-8')
    console.log(`✓ Fixed ${fixCount} issues in ${filePath}`)
  }

  return fixCount
}

async function main() {
  console.log('🔧 Starting automated type fixes...\n')

  const patterns = [
    'app/**/*.tsx',
    'app/**/*.ts',
    'components/**/*.tsx',
    'components/**/*.ts',
  ]

  let totalFixes = 0

  for (const pattern of patterns) {
    const files = await glob(pattern, { ignore: 'node_modules/**' })
    
    for (const file of files) {
      const fixes = await fixFile(file)
      totalFixes += fixes
    }
  }

  console.log(`\n✅ Complete! Fixed ${totalFixes} type issues.`)
  console.log('\n📝 Next steps:')
  console.log('1. Run: npx tsc --noEmit')
  console.log('2. Review changes: git diff')
  console.log('3. Manual fixes for remaining errors')
}

main().catch(console.error)
