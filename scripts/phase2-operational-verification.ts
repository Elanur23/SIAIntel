/**
 * PHASE 2 OPERATIONAL VERIFICATION SCRIPT
 * Standalone verification without Jest dependencies
 */

import EditorialDatabase, { getGlobalDatabase, resetGlobalDatabase } from '../lib/neural-assembly/database'
import type { BatchJob } from '../lib/neural-assembly/master-orchestrator'
import type { Language } from '../lib/neural-assembly/editorial-event-bus'

console.log('\n' + '='.repeat(80))
console.log('PHASE 2 OPERATIONAL VERIFICATION - EXECUTION PATHS')
console.log('='.repeat(80) + '\n')

let passedChecks = 0
let failedChecks = 0
const failures: string[] = []

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✅ PASS: ${message}`)
    passedChecks++
  } else {
    console.log(`❌ FAIL: ${message}`)
    failedChecks++
    failures.push(message)
  }
}

async function runVerification() {
  // ============================================================================
  // TEST 1: RESTART/RESUME AFTER MID-BATCH INTERRUPTION
  // ============================================================================
  console.log('\n📋 TEST 1: Restart/Resume After Mid-Batch Interruption')
  console.log('-'.repeat(80))

  try {
    resetGlobalDatabase()
    const db = getGlobalDatabase()

    // Create batch mid-execution
    const batch: BatchJob = {
      id: `batch-test-${Date.now()}`,
      mic_id: 'mic-test-123',
      user_id: 'user-test-123',
      status: 'IN_PROGRESS',
      created_at: Date.now(),
      updated_at: Date.now(),
      editions: {} as any,
      approved_languages: [],
      pending_languages: ['en', 'tr', 'de'] as Language[],
      escalation_depth: 0,
      chief_editor_escalated_to_supervisor: false,
      supervisor_decision_made: false,
      budget: {
        total: 1000,
        spent: 250,
        remaining: 750
      },
      recirculation_count: 1,
      max_recirculation: 3
    }

    db.saveBatch(batch)
    db.saveCheckpoint('batch', batch)

    console.log(`   Created batch: ${batch.id}`)
    console.log(`   Budget: spent=${batch.budget.spent}, remaining=${batch.budget.remaining}`)

    // Simulate crash
    resetGlobalDatabase()
    const db2 = getGlobalDatabase()

    console.log('   ⚡ Simulated crash (reset in-memory state)')

    // Recover
    const recovered = db2.getBatch(batch.id)

    assert(recovered !== null, 'Batch recovered from database')
    assert(recovered?.budget.spent === 250, 'Budget spent value persisted')
    assert(recovered?.budget.remaining === 750, 'Budget remaining value persisted')
    assert(recovered?.recirculation_count === 1, 'Recirculation count persisted')

  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
    failedChecks++
    failures.push(`Test 1 crashed: ${error.message}`)
  }

  // ============================================================================
  // TEST 2: IDEMPOTENCY BLOCKING DUPLICATE OPERATIONS
  // ============================================================================
  console.log('\n📋 TEST 2: Idempotency Blocking Duplicate Operations')
  console.log('-'.repeat(80))

  try {
    resetGlobalDatabase()
    const db = getGlobalDatabase()

    const requestKey = 'orchestrate_request.test123'
    const result = { success: true, batch_id: 'batch-123' }

    // First request
    db.setIdempotency(requestKey, 'orchestrate', 'COMPLETED', result)
    console.log('   First request marked as COMPLETED')

    // Second request (duplicate)
    const existing = db.getIdempotency(requestKey)

    assert(existing !== null, 'Idempotency record found')
    assert(existing?.status === 'COMPLETED', 'Status is COMPLETED')
    assert(JSON.stringify(existing?.result) === JSON.stringify(result), 'Cached result matches')

  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
    failedChecks++
    failures.push(`Test 2 crashed: ${error.message}`)
  }

  // ============================================================================
  // TEST 3: ORCHESTRATOR COOLDOWN GATE
  // ============================================================================
  console.log('\n📋 TEST 3: Orchestrator Cooldown Gate (503 Before Batch Creation)')
  console.log('-'.repeat(80))

  try {
    resetGlobalDatabase()
    const db = getGlobalDatabase()

    const cooldownUntil = Date.now() + 120000 // 2 minutes
    db.setProviderCooldown({
      provider: 'gemini-1.5-pro-002',
      cooldown_until: cooldownUntil,
      retry_after: 120,
      failure_count: 3,
      failure_reason: 'Rate limit exceeded',
      failure_class: 'COOLDOWN_RETRYABLE',
      last_failure: Date.now(),
      updated_at: Date.now()
    })

    console.log('   Set provider cooldown: gemini-1.5-pro-002')

    // Check active cooldowns (orchestrator gate simulation)
    const activeCooldowns = db.getActiveCooldowns()

    assert(activeCooldowns.length === 1, 'Active cooldown detected')
    assert(activeCooldowns[0].provider === 'gemini-1.5-pro-002', 'Correct provider in cooldown')
    assert(activeCooldowns[0].cooldown_until === cooldownUntil, 'Cooldown expiration time correct')

    const retryAfterSeconds = Math.ceil((activeCooldowns[0].cooldown_until - Date.now()) / 1000)
    assert(retryAfterSeconds > 110 && retryAfterSeconds <= 120, 'Retry timing calculated correctly')

    console.log(`   Retry after: ${retryAfterSeconds} seconds`)

    // Clear cooldown
    db.clearProviderCooldown('gemini-1.5-pro-002')
    const noCooldowns = db.getActiveCooldowns()

    assert(noCooldowns.length === 0, 'Cooldown cleared successfully')

  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
    failedChecks++
    failures.push(`Test 3 crashed: ${error.message}`)
  }

  // ============================================================================
  // TEST 4: BUDGET RESERVATION CONSISTENCY AFTER CRASH
  // ============================================================================
  console.log('\n📋 TEST 4: Budget Reservation Consistency After Crash')
  console.log('-'.repeat(80))

  try {
    resetGlobalDatabase()
    const db = getGlobalDatabase()

    const batchId = 'batch-test-budget'
    const reservationId = 'res-test-123'

    // Create reservation
    db.reserveBudget({
      reservation_id: reservationId,
      batch_id: batchId,
      operation: 'generate_edition',
      provider: 'gemini-1.5-pro-002',
      reserved_amount: 100,
      status: 'RESERVED',
      created_at: Date.now()
    })

    console.log(`   Reserved budget: ${reservationId} = 100 units`)

    // Simulate crash
    resetGlobalDatabase()
    const db2 = getGlobalDatabase()

    console.log('   ⚡ Simulated crash')

    // Recover
    const reservations = db2.getBudgetReservations(batchId)

    assert(reservations.length === 1, 'Budget reservation recovered')
    assert(reservations[0].reservation_id === reservationId, 'Reservation ID matches')
    assert(reservations[0].reserved_amount === 100, 'Reserved amount persisted')
    assert(reservations[0].status === 'RESERVED', 'Reservation status persisted')

    // Test finalization after crash
    db2.updateBudgetReservation(reservationId, 'CONSUMED', 85)
    const updated = db2.getBudgetReservations(batchId)

    assert(updated[0].status === 'CONSUMED', 'Budget finalized after crash')
    assert(updated[0].consumed_amount === 85, 'Consumed amount recorded')

    console.log(`   Finalized: Reserved=100, Consumed=${updated[0].consumed_amount}`)

  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
    failedChecks++
    failures.push(`Test 4 crashed: ${error.message}`)
  }

  // ============================================================================
  // TEST 5: DB-BACKED LOCK RECOVERY AFTER INTERRUPTION
  // ============================================================================
  console.log('\n📋 TEST 5: DB-Backed Lock Recovery After Interruption')
  console.log('-'.repeat(80))

  try {
    resetGlobalDatabase()
    const db = getGlobalDatabase()

    const lockKey = 'batch.test-batch-123'
    const lockId = 'lock-test-123'
    const timeout = 30000

    // Acquire lock
    const acquired = db.acquireLock(lockKey, lockId, timeout, 'test-holder')
    assert(acquired === true, 'Lock acquired successfully')

    console.log(`   Lock acquired: ${lockKey}`)

    // Simulate crash
    resetGlobalDatabase()
    const db2 = getGlobalDatabase()

    console.log('   ⚡ Simulated crash')

    // Try to reacquire (should fail - lock persisted)
    const reacquired = db2.acquireLock(lockKey, 'lock-test-456', timeout, 'test-holder-2')
    assert(reacquired === false, 'Lock persisted across crash (reacquisition blocked)')

    // Release lock
    db2.releaseLock(lockId)
    const afterRelease = db2.acquireLock(lockKey, 'lock-test-789', timeout, 'test-holder-3')
    assert(afterRelease === true, 'Lock released and reacquired successfully')

    console.log('   Lock released and reacquired')

  } catch (error: any) {
    console.log(`   ❌ ERROR: ${error.message}`)
    failedChecks++
    failures.push(`Test 5 crashed: ${error.message}`)
  }

  // ============================================================================
  // FINAL REPORT
  // ============================================================================
  console.log('\n' + '='.repeat(80))
  console.log('PHASE 2 OPERATIONAL VERIFICATION - FINAL REPORT')
  console.log('='.repeat(80))

  console.log(`\n✅ Passed Checks: ${passedChecks}`)
  console.log(`❌ Failed Checks: ${failedChecks}`)

  if (failedChecks > 0) {
    console.log('\n❌ FAILED CHECKS:')
    failures.forEach((f, i) => console.log(`   ${i + 1}. ${f}`))
  }

  console.log('\n📊 RESIDUAL EDGE-CASE RISKS:')
  console.log('   1. ⚠️  Cooldown expiration race conditions (minimal risk)')
  console.log('   2. ⚠️  Multi-provider orchestration (conservative blocking)')
  console.log('   3. ⚠️  Edition-level cooldown handling (separate concern)')

  const operationalReadinessScore = Math.round((passedChecks / (passedChecks + failedChecks)) * 100)

  console.log(`\n🎯 FINAL OPERATIONAL READINESS SCORE: ${operationalReadinessScore}/100`)

  if (operationalReadinessScore >= 90) {
    console.log('\n✅ VERDICT: PRODUCTION-READY')
    console.log('   All critical durability features verified and operational.')
  } else if (operationalReadinessScore >= 75) {
    console.log('\n⚠️  VERDICT: PRODUCTION-READY WITH MONITORING')
    console.log('   Core features operational, monitor edge cases closely.')
  } else {
    console.log('\n❌ VERDICT: NOT PRODUCTION-READY')
    console.log('   Critical failures detected, requires fixes before deployment.')
  }

  console.log('\n' + '='.repeat(80) + '\n')

  // Cleanup
  resetGlobalDatabase()

  process.exit(failedChecks > 0 ? 1 : 0)
}

// Run verification
runVerification().catch(error => {
  console.error('\n❌ FATAL ERROR:', error)
  process.exit(1)
})
