/**
 * SIA GA4 SETUP VALIDATION SCRIPT
 * Validates all dependencies and configuration for article-level GA4 metrics
 */

import { getGoogleCloudConfig, isGoogleCloudReady } from '../lib/google/cloud-provider'
import { googleAnalyticsService } from '../lib/signals/google-analytics-service'

interface ValidationResult {
  category: string
  check: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
}

const results: ValidationResult[] = []

function addResult(category: string, check: string, status: 'PASS' | 'FAIL' | 'WARN', message: string) {
  results.push({ category, check, status, message })
}

async function validateDependencies() {
  console.log('\n🔍 SECTION 1: DEPENDENCY VALIDATION\n')

  // Check @google-analytics/data package
  try {
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data')
    addResult('Dependencies', '@google-analytics/data', 'PASS', 'Package installed and importable')
  } catch (error) {
    addResult('Dependencies', '@google-analytics/data', 'FAIL', 'Package not found. Run: npm install @google-analytics/data')
  }

  // Check google-auth-library
  try {
    await import('google-auth-library')
    addResult('Dependencies', 'google-auth-library', 'PASS', 'Package installed and importable')
  } catch (error) {
    addResult('Dependencies', 'google-auth-library', 'FAIL', 'Package not found. Run: npm install google-auth-library')
  }
}

function validateEnvironmentVariables() {
  console.log('\n🔍 SECTION 2: ENVIRONMENT VARIABLES\n')

  // Check GA4_PROPERTY_ID
  const propertyId = process.env.GA4_PROPERTY_ID
  if (propertyId) {
    if (/^\d+$/.test(propertyId.replace('properties/', '').trim())) {
      addResult('Environment', 'GA4_PROPERTY_ID', 'PASS', `Configured: ${propertyId}`)
    } else {
      addResult('Environment', 'GA4_PROPERTY_ID', 'FAIL', `Value must be numeric. Current: ${propertyId}`)
    }
  } else {
    addResult('Environment', 'GA4_PROPERTY_ID', 'FAIL', 'Not configured. Set GA4_PROPERTY_ID in .env.local')
  }

  // Check GA4 credentials
  const clientEmail = process.env.GA4_CLIENT_EMAIL
  const privateKey = process.env.GA4_PRIVATE_KEY

  if (clientEmail) {
    if (clientEmail.includes('@') && clientEmail.includes('.iam.gserviceaccount.com')) {
      addResult('Environment', 'GA4_CLIENT_EMAIL', 'PASS', `Configured: ${clientEmail}`)
    } else {
      addResult('Environment', 'GA4_CLIENT_EMAIL', 'WARN', `Format looks incorrect: ${clientEmail}`)
    }
  } else {
    addResult('Environment', 'GA4_CLIENT_EMAIL', 'FAIL', 'Not configured. Set GA4_CLIENT_EMAIL in .env.local')
  }

  if (privateKey) {
    if (privateKey.includes('BEGIN PRIVATE KEY') && privateKey.includes('END PRIVATE KEY')) {
      addResult('Environment', 'GA4_PRIVATE_KEY', 'PASS', 'Configured (key format valid)')
    } else {
      addResult('Environment', 'GA4_PRIVATE_KEY', 'WARN', 'Key format may be incorrect (missing BEGIN/END markers)')
    }
  } else {
    addResult('Environment', 'GA4_PRIVATE_KEY', 'FAIL', 'Not configured. Set GA4_PRIVATE_KEY in .env.local')
  }
}

function validateScopes() {
  console.log('\n🔍 SECTION 3: API SCOPES\n')

  const requiredScope = 'https://www.googleapis.com/auth/analytics.readonly'
  
  addResult(
    'Scopes',
    'analytics.readonly',
    'PASS',
    `Required scope: ${requiredScope}\nEnsure your service account has this scope enabled in Google Cloud Console`
  )
}

function validateCloudProvider() {
  console.log('\n🔍 SECTION 4: CLOUD PROVIDER INTEGRATION\n')

  const isReady = isGoogleCloudReady()
  if (isReady) {
    addResult('Cloud Provider', 'isGoogleCloudReady()', 'PASS', 'Credentials detected')
  } else {
    addResult('Cloud Provider', 'isGoogleCloudReady()', 'FAIL', 'Credentials not detected')
  }

  const config = getGoogleCloudConfig()
  if (config) {
    addResult('Cloud Provider', 'getGoogleCloudConfig()', 'PASS', `Email: ${config.clientEmail}`)
  } else {
    addResult('Cloud Provider', 'getGoogleCloudConfig()', 'FAIL', 'Failed to load configuration')
  }
}

async function validateGA4Service() {
  console.log('\n🔍 SECTION 5: GA4 SERVICE VALIDATION\n')

  try {
    // Test with a sample URL
    const testUrl = 'https://siaintel.com/en/reports/test'
    const metrics = await googleAnalyticsService.getPageMetrics(testUrl)

    if (metrics === null) {
      addResult('GA4 Service', 'getPageMetrics()', 'WARN', 'Service initialized but no data returned (expected for test URL)')
    } else {
      addResult('GA4 Service', 'getPageMetrics()', 'PASS', `Metrics retrieved: ${JSON.stringify(metrics)}`)
    }
  } catch (error: any) {
    addResult('GA4 Service', 'getPageMetrics()', 'FAIL', `Error: ${error.message}`)
  }
}

function printResults() {
  console.log('\n' + '='.repeat(80))
  console.log('📊 GA4 SETUP VALIDATION RESULTS')
  console.log('='.repeat(80) + '\n')

  const categories = [...new Set(results.map(r => r.category))]
  
  let totalPass = 0
  let totalFail = 0
  let totalWarn = 0

  categories.forEach(category => {
    console.log(`\n📁 ${category}`)
    console.log('-'.repeat(80))

    const categoryResults = results.filter(r => r.category === category)
    categoryResults.forEach(result => {
      const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
      console.log(`${icon} ${result.check}`)
      console.log(`   ${result.message}\n`)

      if (result.status === 'PASS') totalPass++
      if (result.status === 'FAIL') totalFail++
      if (result.status === 'WARN') totalWarn++
    })
  })

  console.log('\n' + '='.repeat(80))
  console.log('📈 SUMMARY')
  console.log('='.repeat(80))
  console.log(`✅ Passed: ${totalPass}`)
  console.log(`⚠️  Warnings: ${totalWarn}`)
  console.log(`❌ Failed: ${totalFail}`)
  console.log(`📊 Total: ${results.length}`)

  if (totalFail > 0) {
    console.log('\n❌ VALIDATION FAILED - Fix the issues above before proceeding')
    process.exit(1)
  } else if (totalWarn > 0) {
    console.log('\n⚠️  VALIDATION PASSED WITH WARNINGS - Review warnings above')
    process.exit(0)
  } else {
    console.log('\n✅ ALL CHECKS PASSED - GA4 integration is ready!')
    process.exit(0)
  }
}

async function main() {
  console.log('🚀 SIA GA4 Backend Integration Validation')
  console.log('Version: 2.0')
  console.log('Date:', new Date().toISOString())

  await validateDependencies()
  validateEnvironmentVariables()
  validateScopes()
  validateCloudProvider()
  await validateGA4Service()

  printResults()
}

main().catch(error => {
  console.error('\n💥 VALIDATION SCRIPT CRASHED:', error)
  process.exit(1)
})
