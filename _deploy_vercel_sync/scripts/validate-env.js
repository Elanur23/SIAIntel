/**
 * Environment Variable Validator
 * Checks that required env variables are set before build/deploy.
 * Usage: node scripts/validate-env.js
 */

const fs = require('fs')
const path = require('path')

// AI API'ler kaldırıldı — bu anahtarlar artık zorunlu değil
const REQUIRED_GROUPS = []

// Optional but recommended (canlı için önerilir)
const RECOMMENDED = [
  'GOOGLE_ADSENSE_ID',
  'NEXT_PUBLIC_GA4_MEASUREMENT_ID',
  'SITE_URL',
  'NEXT_PUBLIC_SITE_URL',
  'ADMIN_SECRET',
  'DATABASE_URL'
]

function loadEnv() {
  const envPaths = ['.env.local', '.env']
  const vars = { ...process.env }

  for (const envFile of envPaths) {
    const fullPath = path.join(process.cwd(), envFile)
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf-8')
      for (const line of content.split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const eqIndex = trimmed.indexOf('=')
        if (eqIndex === -1) continue
        const key = trimmed.substring(0, eqIndex).trim()
        const value = trimmed.substring(eqIndex + 1).trim()
        if (value && !value.startsWith('your_') && !value.startsWith('your-') && value !== '') {
          vars[key] = value
        }
      }
    }
  }

  return vars
}

function validate() {
  console.log('🔍 Validating environment variables...\n')

  const vars = loadEnv()
  let hasError = false
  let warnings = 0

  // Check required groups
  for (const group of REQUIRED_GROUPS) {
    if (group.mode === 'any') {
      const found = group.keys.filter(k => vars[k])
      if (found.length === 0) {
        console.error(`❌ MISSING: ${group.name}`)
        console.error(`   Set at least one of: ${group.keys.join(', ')}`)
        hasError = true
      } else {
        console.log(`✅ ${group.name}: ${found.join(', ')}`)
      }
    }
  }

  // Check recommended
  console.log('')
  for (const key of RECOMMENDED) {
    if (!vars[key]) {
      console.warn(`⚠️  RECOMMENDED: ${key} is not set`)
      warnings++
    }
  }

  console.log('')

  if (hasError) {
    console.error('❌ Validation FAILED. Fix the errors above before deploying.')
    process.exit(1)
  } else if (warnings > 0) {
    console.log(`✅ Validation PASSED with ${warnings} warning(s).`)
  } else {
    console.log('✅ Validation PASSED. All environment variables are set.')
  }
}

validate()
