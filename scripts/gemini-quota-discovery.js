#!/usr/bin/env node
/**
 * GEMINI QUOTA & API DISCOVERY TOOL
 * 
 * High-level automated discovery combining:
 * - Service Usage API (quota limits)
 * - Cloud Monitoring API (real-time usage)
 * - Generative Language API (direct test)
 * - Cloud Billing API (billing status)
 * 
 * SECURITY: Uses gcloud authentication (no hardcoded keys)
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// ANSI colors for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function header(title) {
  const line = '━'.repeat(80)
  log(`\n${line}`, 'cyan')
  log(`  ${title}`, 'bright')
  log(line, 'cyan')
}

function section(title) {
  log(`\n▶ ${title}`, 'blue')
  log('─'.repeat(80), 'blue')
}

function success(message) {
  log(`✅ ${message}`, 'green')
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow')
}

function error(message) {
  log(`❌ ${message}`, 'red')
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan')
}

// Load environment variables
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        process.env[match[1].trim()] = match[2].trim()
      }
    })
  }
}

// Execute shell command and return output
function exec(command, options = {}) {
  try {
    const output = execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    })
    return { success: true, output: output?.trim() }
  } catch (err) {
    return { 
      success: false, 
      error: err.message,
      output: err.stdout?.toString().trim(),
      stderr: err.stderr?.toString().trim()
    }
  }
}

// Get current GCP project
function getCurrentProject() {
  section('Detecting GCP Project')
  
  const result = exec('gcloud config get-value project', { silent: true })
  
  if (result.success && result.output) {
    success(`Current project: ${result.output}`)
    return result.output
  } else {
    error('No GCP project configured')
    info('Run: gcloud config set project YOUR_PROJECT_ID')
    return null
  }
}

// Check if gcloud is authenticated
function checkAuthentication() {
  section('Checking Authentication')
  
  const result = exec('gcloud auth list --filter=status:ACTIVE --format="value(account)"', { silent: true })
  
  if (result.success && result.output) {
    success(`Authenticated as: ${result.output}`)
    return true
  } else {
    error('Not authenticated with gcloud')
    info('Run: gcloud auth login')
    return false
  }
}

// Check if Generative Language API is enabled
function checkApiEnabled(projectId) {
  section('Checking Generative Language API Status')
  
  const result = exec(
    `gcloud services list --enabled --filter="name:generativelanguage.googleapis.com" --format="value(name)" --project=${projectId}`,
    { silent: true }
  )
  
  if (result.success && result.output.includes('generativelanguage.googleapis.com')) {
    success('Generative Language API is ENABLED')
    return true
  } else {
    error('Generative Language API is NOT ENABLED')
    info('Enable it: gcloud services enable generativelanguage.googleapis.com')
    return false
  }
}

// Get quota limits
function getQuotaLimits(projectId) {
  section('Fetching Quota Limits')
  
  const result = exec(
    `gcloud services quota list --service=generativelanguage.googleapis.com --project=${projectId} --format=json`,
    { silent: true }
  )
  
  if (result.success && result.output) {
    try {
      const quotas = JSON.parse(result.output)
      
      if (quotas.length === 0) {
        warning('No quota information available')
        info('This may indicate the API was recently enabled or quota data is not yet populated')
        return []
      }
      
      success(`Found ${quotas.length} quota metrics`)
      
      quotas.forEach(quota => {
        const metric = quota.metric || 'unknown'
        const limit = quota.limit || 'N/A'
        const unit = quota.unit || ''
        const usage = quota.usage || 0
        const usagePercent = limit !== 'N/A' ? ((usage / limit) * 100).toFixed(2) : 'N/A'
        
        log(`  📊 ${metric}`, 'cyan')
        log(`     Limit: ${limit} ${unit}`)
        log(`     Usage: ${usage} (${usagePercent}%)`)
        
        if (usagePercent !== 'N/A' && parseFloat(usagePercent) >= 90) {
          warning(`     ⚠️  High usage: ${usagePercent}%`)
        }
      })
      
      return quotas
    } catch (err) {
      error(`Failed to parse quota data: ${err.message}`)
      return []
    }
  } else {
    warning('Could not fetch quota limits')
    info('This may require additional permissions: serviceusage.services.get')
    return []
  }
}

// Check billing account
function checkBillingAccount(projectId) {
  section('Checking Billing Account')
  
  const result = exec(
    `gcloud billing projects describe ${projectId} --format=json`,
    { silent: true }
  )
  
  if (result.success && result.output) {
    try {
      const billing = JSON.parse(result.output)
      
      if (billing.billingEnabled) {
        success('Billing is ENABLED')
        info(`Billing Account: ${billing.billingAccountName || 'N/A'}`)
        return true
      } else {
        error('Billing is NOT ENABLED')
        info('Enable billing: https://console.cloud.google.com/billing')
        return false
      }
    } catch (err) {
      error(`Failed to parse billing data: ${err.message}`)
      return false
    }
  } else {
    warning('Could not check billing status')
    info('This may require additional permissions: billing.resourceAssociations.list')
    return false
  }
}

// Test Gemini API directly
function testGeminiApi() {
  section('Testing Gemini API Direct Access')
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    warning('No API key found in environment')
    info('Set GOOGLE_GEMINI_API_KEY in .env.local to test direct API access')
    return { tested: false }
  }
  
  info('Testing with gemini-1.5-flash (lightweight model)...')
  
  const testPayload = JSON.stringify({
    contents: [{
      parts: [{ text: 'test' }]
    }]
  })
  
  const curlCommand = `curl -s -w "\\nHTTP_STATUS:%{http_code}" -X POST \
    -H "Content-Type: application/json" \
    -d '${testPayload}' \
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}"`
  
  const result = exec(curlCommand, { silent: true })
  
  if (result.success && result.output) {
    const lines = result.output.split('\n')
    const statusLine = lines.find(l => l.startsWith('HTTP_STATUS:'))
    const httpStatus = statusLine ? statusLine.split(':')[1] : 'unknown'
    const responseBody = lines.filter(l => !l.startsWith('HTTP_STATUS:')).join('\n')
    
    if (httpStatus === '200') {
      success('API test PASSED - Gemini is accessible')
      try {
        const response = JSON.parse(responseBody)
        if (response.candidates && response.candidates[0]) {
          const text = response.candidates[0].content?.parts?.[0]?.text || 'N/A'
          info(`Response preview: ${text.substring(0, 50)}...`)
        }
      } catch (err) {
        // Response parsing failed, but HTTP 200 is still success
      }
      return { tested: true, success: true, httpStatus: 200 }
    } else if (httpStatus === '429') {
      error('API test FAILED - HTTP 429 RESOURCE_EXHAUSTED')
      try {
        const response = JSON.parse(responseBody)
        if (response.error) {
          error(`Error: ${response.error.message}`)
          error(`Status: ${response.error.status}`)
        }
      } catch (err) {
        // Error parsing failed
      }
      return { tested: true, success: false, httpStatus: 429, error: 'RESOURCE_EXHAUSTED' }
    } else {
      warning(`API test returned HTTP ${httpStatus}`)
      log(responseBody.substring(0, 200))
      return { tested: true, success: false, httpStatus: parseInt(httpStatus) }
    }
  } else {
    error('API test failed to execute')
    if (result.stderr) {
      log(result.stderr.substring(0, 200))
    }
    return { tested: false, error: result.error }
  }
}

// List available Gemini models
function listGeminiModels() {
  section('Listing Available Gemini Models')
  
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY || process.env.OPENAI_API_KEY
  
  if (!apiKey) {
    warning('No API key found - skipping model list')
    return []
  }
  
  const result = exec(
    `curl -s "https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}"`,
    { silent: true }
  )
  
  if (result.success && result.output) {
    try {
      const response = JSON.parse(result.output)
      
      if (response.models) {
        success(`Found ${response.models.length} available models`)
        
        response.models.forEach(model => {
          const name = model.name?.replace('models/', '') || 'unknown'
          const displayName = model.displayName || name
          const description = model.description || 'No description'
          
          log(`  🤖 ${displayName}`, 'cyan')
          log(`     Name: ${name}`)
          log(`     Description: ${description.substring(0, 80)}...`)
        })
        
        return response.models
      } else if (response.error) {
        error(`API Error: ${response.error.message}`)
        return []
      } else {
        warning('No models found in response')
        return []
      }
    } catch (err) {
      error(`Failed to parse models response: ${err.message}`)
      return []
    }
  } else {
    warning('Could not list models')
    return []
  }
}

// Generate comprehensive report
function generateReport(data) {
  header('DISCOVERY REPORT SUMMARY')
  
  log('\n📋 SYSTEM STATUS', 'bright')
  log('─'.repeat(80))
  log(`  Project ID: ${data.projectId || 'N/A'}`)
  log(`  Authenticated: ${data.authenticated ? 'YES' : 'NO'}`)
  log(`  API Enabled: ${data.apiEnabled ? 'YES' : 'NO'}`)
  log(`  Billing Enabled: ${data.billingEnabled ? 'YES' : 'NO'}`)
  
  log('\n📊 QUOTA STATUS', 'bright')
  log('─'.repeat(80))
  if (data.quotas && data.quotas.length > 0) {
    data.quotas.forEach(quota => {
      const metric = quota.metric || 'unknown'
      const limit = quota.limit || 'N/A'
      const usage = quota.usage || 0
      const usagePercent = limit !== 'N/A' ? ((usage / limit) * 100).toFixed(2) : 'N/A'
      
      log(`  ${metric}: ${usage}/${limit} (${usagePercent}%)`)
    })
  } else {
    log('  No quota data available')
  }
  
  log('\n🧪 API TEST RESULT', 'bright')
  log('─'.repeat(80))
  if (data.apiTest.tested) {
    if (data.apiTest.success) {
      log(`  Status: ✅ PASS (HTTP ${data.apiTest.httpStatus})`, 'green')
    } else {
      log(`  Status: ❌ FAIL (HTTP ${data.apiTest.httpStatus})`, 'red')
      if (data.apiTest.error) {
        log(`  Error: ${data.apiTest.error}`, 'red')
      }
    }
  } else {
    log('  Status: ⚠️  NOT TESTED (no API key)')
  }
  
  log('\n🤖 AVAILABLE MODELS', 'bright')
  log('─'.repeat(80))
  if (data.models && data.models.length > 0) {
    log(`  Found ${data.models.length} models`)
  } else {
    log('  No models listed')
  }
  
  log('\n🎯 DIAGNOSIS', 'bright')
  log('─'.repeat(80))
  
  if (!data.authenticated) {
    error('  BLOCKED: Not authenticated with gcloud')
    info('  Action: Run "gcloud auth login"')
  } else if (!data.apiEnabled) {
    error('  BLOCKED: Generative Language API not enabled')
    info('  Action: Run "gcloud services enable generativelanguage.googleapis.com"')
  } else if (!data.billingEnabled) {
    error('  BLOCKED: Billing not enabled')
    info('  Action: Enable billing in Google Cloud Console')
  } else if (data.apiTest.tested && !data.apiTest.success) {
    if (data.apiTest.httpStatus === 429) {
      error('  BLOCKED: QUOTA EXCEEDED (HTTP 429)')
      info('  Root Cause: Resource exhausted - quota limits reached')
      info('  Action: Wait for quota reset or request quota increase')
    } else {
      error(`  BLOCKED: API test failed (HTTP ${data.apiTest.httpStatus})`)
      info('  Action: Check API key validity and permissions')
    }
  } else if (data.apiTest.tested && data.apiTest.success) {
    success('  READY: All systems operational')
    info('  Provider gate should be clear for next probe')
  } else {
    warning('  UNKNOWN: API test not performed')
    info('  Action: Set GOOGLE_GEMINI_API_KEY in .env.local and re-run')
  }
  
  log('\n' + '━'.repeat(80), 'cyan')
  log(`  Discovery completed at: ${new Date().toISOString()}`, 'cyan')
  log('━'.repeat(80) + '\n', 'cyan')
}

// Main execution
async function main() {
  header('GEMINI QUOTA & API DISCOVERY TOOL')
  
  log('\n🔍 Starting automated discovery...', 'bright')
  log('This tool will check:', 'cyan')
  log('  • GCP authentication status')
  log('  • Project configuration')
  log('  • API enablement')
  log('  • Quota limits and usage')
  log('  • Billing status')
  log('  • Direct API connectivity')
  log('  • Available models')
  
  // Load environment
  loadEnv()
  
  // Collect data
  const data = {
    timestamp: new Date().toISOString(),
    authenticated: false,
    projectId: null,
    apiEnabled: false,
    quotas: [],
    billingEnabled: false,
    apiTest: { tested: false },
    models: []
  }
  
  // Check authentication
  data.authenticated = checkAuthentication()
  if (!data.authenticated) {
    generateReport(data)
    process.exit(1)
  }
  
  // Get project
  data.projectId = getCurrentProject()
  if (!data.projectId) {
    generateReport(data)
    process.exit(1)
  }
  
  // Check API enabled
  data.apiEnabled = checkApiEnabled(data.projectId)
  
  // Get quota limits
  if (data.apiEnabled) {
    data.quotas = getQuotaLimits(data.projectId)
  }
  
  // Check billing
  data.billingEnabled = checkBillingAccount(data.projectId)
  
  // Test API
  data.apiTest = testGeminiApi()
  
  // List models
  if (data.apiTest.tested && data.apiTest.success) {
    data.models = listGeminiModels()
  }
  
  // Generate report
  generateReport(data)
  
  // Exit with appropriate code
  if (data.apiTest.tested && data.apiTest.success) {
    process.exit(0)
  } else if (data.apiTest.tested && data.apiTest.httpStatus === 429) {
    process.exit(1) // Quota exceeded
  } else {
    process.exit(2) // Other error
  }
}

// Run
main().catch(err => {
  error(`Fatal error: ${err.message}`)
  console.error(err)
  process.exit(3)
})
