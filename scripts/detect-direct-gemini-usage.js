#!/usr/bin/env node
/**
 * ARCHITECTURAL GUARDRAIL: Detect Direct Gemini SDK Usage
 * 
 * Scans codebase for direct GoogleGenerativeAI usage outside the central boundary.
 * All Gemini calls MUST route through lib/neural-assembly/gemini-central-provider.ts
 */

const fs = require('fs')
const path = require('path')

const ALLOWED_FILES = [
  'lib/neural-assembly/gemini-central-provider.ts',
  'lib/neural-assembly/llm-provider.ts', // Legacy, being phased out
]

const SEARCH_PATTERNS = [
  /new\s+GoogleGenerativeAI/g,
  /from\s+['"]@google\/generative-ai['"]/g,
  /\.generateContent\(/g,
  /\.getGenerativeModel\(/g
]

function scanDirectory(dir, results = []) {
  const files = fs.readdirSync(dir)
  
  for (const file of files) {
    const filePath = path.join(dir, file)
    const stat = fs.statSync(filePath)
    
    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules') {
        scanDirectory(filePath, results)
      }
    } else if (file.endsWith('.ts') || file.endsWith('.js')) {
      const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/')
      
      // Skip allowed files
      if (ALLOWED_FILES.some(allowed => relativePath.includes(allowed))) {
        continue
      }
      
      const content = fs.readFileSync(filePath, 'utf8')
      
      for (const pattern of SEARCH_PATTERNS) {
        const matches = content.match(pattern)
        if (matches) {
          results.push({
            file: relativePath,
            pattern: pattern.source,
            count: matches.length
          })
          break // Only report once per file
        }
      }
    }
  }
  
  return results
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('          ARCHITECTURAL GUARDRAIL: DIRECT GEMINI USAGE DETECTION')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log()

const results = scanDirectory('lib')

if (results.length === 0) {
  console.log('✅ NO DIRECT GEMINI USAGE DETECTED')
  console.log('   All Gemini calls are properly routed through central boundary')
  console.log()
  process.exit(0)
} else {
  console.log(`❌ DIRECT GEMINI USAGE DETECTED IN ${results.length} FILES`)
  console.log()
  console.log('The following files bypass the central Gemini boundary:')
  console.log()
  
  for (const result of results) {
    console.log(`  📁 ${result.file}`)
    console.log(`     Pattern: ${result.pattern}`)
    console.log(`     Occurrences: ${result.count}`)
    console.log()
  }
  
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('REQUIRED ACTION:')
  console.log('  1. Migrate these files to use callGeminiCentral() from:')
  console.log('     lib/neural-assembly/gemini-central-provider.ts')
  console.log('  2. Remove direct GoogleGenerativeAI imports')
  console.log('  3. Route all calls through the central boundary')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log()
  
  process.exit(1)
}
