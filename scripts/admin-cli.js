#!/usr/bin/env node
/**
 * ADMIN CLI - GRANULAR OPERATOR CONTROLS
 * Production-grade manual operator commands for launch-day control
 * 
 * Commands:
 * - emergency-stop: Hard kill all operations (existing)
 * - resume: Clear emergency stop (existing)
 * - pause-ingestion: Reject new batch requests with 503
 * - resume-ingestion: Accept new batch requests
 * - throttle-ingestion --limit <N>: Limit concurrent batches to N
 * - clear-throttle: Remove ingestion throttle
 * 
 * @version 1.8.2
 * @author SIA Intelligence Systems
 */

const fs = require('fs')
const path = require('path')

// ============================================================================
// CONTROL STATE FILES
// ============================================================================

const EMERGENCY_STOP_FILE = '.emergency-stop-active'
const PAUSE_INGESTION_FILE = '.ingestion-paused'
const HARD_LOCK_FILE = '.system-hard-lock'
const THROTTLE_PREFIX = '.ingestion-throttle-'

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function fileExists(filepath) {
  return fs.existsSync(filepath)
}

function createControlFile(filepath, content = '') {
  fs.writeFileSync(filepath, content, 'utf8')
  console.log(`✅ Created control file: ${filepath}`)
}

function removeControlFile(filepath) {
  if (fileExists(filepath)) {
    fs.unlinkSync(filepath)
    console.log(`✅ Removed control file: ${filepath}`)
  } else {
    console.log(`ℹ️  Control file not found: ${filepath}`)
  }
}

function getThrottleLimit() {
  const files = fs.readdirSync('.')
  const throttleFile = files.find(f => f.startsWith(THROTTLE_PREFIX))
  if (throttleFile) {
    const limit = parseInt(throttleFile.replace(THROTTLE_PREFIX, ''), 10)
    return isNaN(limit) ? null : limit
  }
  return null
}

function clearAllThrottleFiles() {
  const files = fs.readdirSync('.')
  const throttleFiles = files.filter(f => f.startsWith(THROTTLE_PREFIX))
  throttleFiles.forEach(f => {
    fs.unlinkSync(f)
    console.log(`✅ Removed throttle file: ${f}`)
  })
}

function printStatus() {
  console.log('\n📊 SYSTEM CONTROL STATUS')
  console.log('━'.repeat(60))
  
  const emergencyStop = fileExists(EMERGENCY_STOP_FILE)
  const pauseIngestion = fileExists(PAUSE_INGESTION_FILE)
  const throttleLimit = getThrottleLimit()
  const hardLock = fileExists(HARD_LOCK_FILE)
  let lockReason = 'NONE'
  if (hardLock) {
    try {
      lockReason = fs.readFileSync(HARD_LOCK_FILE, 'utf8').trim()
    } catch (e) {}
  }

  console.log(`System Hard Lock:   ${hardLock ? '🔴 LOCKED' : '🟢 UNLOCKED'}`)
  if (hardLock) console.log(`Blocked Reason:     ${lockReason}`)
  console.log(`Canary Allowed:     ${hardLock ? '❌ NO' : '✅ YES'}`)
  console.log('━'.repeat(60))
  console.log(`Emergency Stop:     ${emergencyStop ? '🔴 ACTIVE' : '🟢 INACTIVE'}`)
  console.log(`Pause Ingestion:    ${pauseIngestion ? '🟡 ACTIVE' : '🟢 INACTIVE'}`)
  console.log(`Throttle Ingestion: ${throttleLimit !== null ? `🟡 ACTIVE (limit: ${throttleLimit})` : '🟢 INACTIVE'}`)
  
  console.log('━'.repeat(60))

  if (hardLock) {
    console.log('\n⛔ HARD LOCK ACTIVE: ' + lockReason)
    console.log('   System is physically blocked from canary or production ignition.')
    console.log('   Manual recovery required after Layer B verification.')
  }

  if (emergencyStop) {
    console.log('\n⚠️  EMERGENCY STOP IS ACTIVE')
    console.log('   All operations are halted. Use "resume" to clear.')
  }
  
  if (pauseIngestion) {
    console.log('\n⚠️  INGESTION IS PAUSED')
    console.log('   New batch requests will receive 503 Service Unavailable.')
    console.log('   In-flight batches will complete gracefully.')
    console.log('   Use "resume-ingestion" to accept new requests.')
  }
  
  if (throttleLimit !== null) {
    console.log('\n⚠️  INGESTION IS THROTTLED')
    console.log(`   Maximum concurrent batches: ${throttleLimit}`)
    console.log('   Requests exceeding limit will receive 429 Too Many Requests.')
    console.log('   Use "clear-throttle" to remove limit.')
  }
  
  console.log('')
}

// ============================================================================
// COMMAND HANDLERS
// ============================================================================

function handleEmergencyStop() {
  console.log('\n🚨 ACTIVATING EMERGENCY STOP')
  console.log('━'.repeat(60))
  console.log('This will HARD KILL all operations.')
  console.log('In-flight work may be interrupted.')
  console.log('━'.repeat(60))
  
  createControlFile(EMERGENCY_STOP_FILE, `Emergency stop activated at ${new Date().toISOString()}`)
  
  console.log('\n✅ Emergency stop activated')
  console.log('   All API requests will be rejected with 503')
  console.log('   Use "resume" to clear emergency stop')
}

function handleResume() {
  console.log('\n🟢 CLEARING EMERGENCY STOP')
  console.log('━'.repeat(60))
  
  removeControlFile(EMERGENCY_STOP_FILE)
  
  console.log('\n✅ Emergency stop cleared')
  console.log('   System is now accepting requests')
}

function handlePauseIngestion() {
  console.log('\n🟡 PAUSING INGESTION')
  console.log('━'.repeat(60))
  console.log('New batch requests will be rejected with 503.')
  console.log('In-flight batches will complete gracefully.')
  console.log('━'.repeat(60))
  
  createControlFile(PAUSE_INGESTION_FILE, `Ingestion paused at ${new Date().toISOString()}`)
  
  console.log('\n✅ Ingestion paused')
  console.log('   New batch requests will receive 503 Service Unavailable')
  console.log('   In-flight batches will complete')
  console.log('   Use "resume-ingestion" to accept new requests')
}

function handleResumeIngestion() {
  console.log('\n🟢 RESUMING INGESTION')
  console.log('━'.repeat(60))
  
  removeControlFile(PAUSE_INGESTION_FILE)
  
  console.log('\n✅ Ingestion resumed')
  console.log('   New batch requests are now accepted')
}

function handleThrottleIngestion(limit) {
  if (!limit || isNaN(limit) || limit < 1) {
    console.error('\n❌ ERROR: Invalid throttle limit')
    console.error('   Usage: throttle-ingestion --limit <number>')
    console.error('   Example: throttle-ingestion --limit 3')
    process.exit(1)
  }
  
  console.log('\n🟡 THROTTLING INGESTION')
  console.log('━'.repeat(60))
  console.log(`Maximum concurrent batches: ${limit}`)
  console.log('Requests exceeding limit will receive 429.')
  console.log('━'.repeat(60))
  
  // Clear any existing throttle files
  clearAllThrottleFiles()
  
  // Create new throttle file with limit encoded in filename
  const throttleFile = `${THROTTLE_PREFIX}${limit}`
  createControlFile(throttleFile, `Ingestion throttled to ${limit} at ${new Date().toISOString()}`)
  
  console.log('\n✅ Ingestion throttled')
  console.log(`   Maximum concurrent batches: ${limit}`)
  console.log('   Excess requests will receive 429 Too Many Requests')
  console.log('   Use "clear-throttle" to remove limit')
}

function handleClearThrottle() {
  console.log('\n🟢 CLEARING THROTTLE')
  console.log('━'.repeat(60))
  
  clearAllThrottleFiles()
  
  console.log('\n✅ Throttle cleared')
  console.log('   No ingestion limit is active')
}

function handleLock(reason) {
  if (!reason || reason.trim() === '') {
    console.error('\n❌ ERROR: Lock reason required')
    console.error('   Usage: lock --reason "REASON"')
    process.exit(1)
  }

  console.log('\n🚨 ENFORCING SYSTEM HARD LOCK')
  console.log('━'.repeat(60))
  console.log(`Reason: ${reason}`)
  console.log('━'.repeat(60))

  createControlFile(HARD_LOCK_FILE, reason)

  console.log('\n✅ System is now HARD LOCKED')
  console.log('   All canary and production ingestion is physically blocked.')
}

function handleUnlock() {
  console.log('\n🟢 CLEARING SYSTEM HARD LOCK')
  console.log('━'.repeat(60))

  removeControlFile(HARD_LOCK_FILE)

  console.log('\n✅ Hard lock cleared')
  console.log('   System is now eligible for ignition (pending gate checks)')
}

function handleStatus() {
  printStatus()
}

function printHelp() {
  console.log('\n📖 ADMIN CLI - GRANULAR OPERATOR CONTROLS')
  console.log('━'.repeat(60))
  console.log('\nCOMMANDS:')
  console.log('')
  console.log('  emergency-stop          🔴 Hard kill all operations')
  console.log('  resume                  🟢 Clear emergency stop')
  console.log('')
  console.log('  pause-ingestion         🟡 Reject new batch requests (503)')
  console.log('  resume-ingestion        🟢 Accept new batch requests')
  console.log('')
  console.log('  throttle-ingestion      🟡 Limit concurrent batches')
  console.log('    --limit <number>         (e.g., --limit 3)')
  console.log('  clear-throttle          🟢 Remove ingestion throttle')
  console.log('')
  console.log('  lock                    🔴 Enforce system hard lock')
  console.log('    --reason <string>        (e.g., --reason "QUOTA_EXCEEDED")')
  console.log('  unlock                  🟢 Clear system hard lock')
  console.log('')
  console.log('  status                  📊 Show current control state')
  console.log('  help                    📖 Show this help message')
  console.log('')
  console.log('EXAMPLES:')
  console.log('')
  console.log('  node scripts/admin-cli.js emergency-stop')
  console.log('  node scripts/admin-cli.js pause-ingestion')
  console.log('  node scripts/admin-cli.js throttle-ingestion --limit 5')
  console.log('  node scripts/admin-cli.js lock --reason "GEMINI_QUOTA_EXCEEDED"')
  console.log('  node scripts/admin-cli.js status')
  console.log('')
  console.log('━'.repeat(60))
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2)
  
  if (args.length === 0) {
    printHelp()
    process.exit(0)
  }
  
  const command = args[0]
  
  switch (command) {
    case 'emergency-stop':
      handleEmergencyStop()
      break
      
    case 'resume':
      handleResume()
      break
      
    case 'pause-ingestion':
      handlePauseIngestion()
      break
      
    case 'resume-ingestion':
      handleResumeIngestion()
      break
      
    case 'throttle-ingestion':
      const limitIndex = args.indexOf('--limit')
      if (limitIndex === -1 || !args[limitIndex + 1]) {
        console.error('\n❌ ERROR: --limit parameter required')
        console.error('   Usage: throttle-ingestion --limit <number>')
        process.exit(1)
      }
      const limit = parseInt(args[limitIndex + 1], 10)
      handleThrottleIngestion(limit)
      break
      
    case 'clear-throttle':
      handleClearThrottle()
      break
      
    case 'lock':
      const reasonIndex = args.indexOf('--reason')
      if (reasonIndex === -1 || !args[reasonIndex + 1]) {
        console.error('\n❌ ERROR: --reason parameter required')
        console.error('   Usage: lock --reason "REASON"')
        process.exit(1)
      }
      handleLock(args[reasonIndex + 1])
      break

    case 'unlock':
      handleUnlock()
      break

    case 'status':
      handleStatus()
      break
      
    case 'help':
    case '--help':
    case '-h':
      printHelp()
      break
      
    default:
      console.error(`\n❌ ERROR: Unknown command: ${command}`)
      console.error('   Use "help" to see available commands')
      process.exit(1)
  }
}

main()
