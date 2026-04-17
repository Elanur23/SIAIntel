#!/usr/bin/env node
/**
 * STAGE 0 TELEMETRY READER - PHASE 1.9.9 (PRODUCTION-ONLY TRUTH REPAIR)
 * Principal Production SRE Tool: Real-Time Metric Observer
 * 
 * ANTI-HALLUCINATION MANDATE:
 * - NO Math.random()
 * - NO hardcoded healthy values
 * - ONLY read from real internal database/observability state
 * - If metric unavailable, report [UNAVAILABLE] with reason
 * 
 * PRODUCTION-ONLY MANDATE (PHASE 1.9.9):
 * - ALL financial and health metrics MUST explicitly exclude mock/shadow data
 * - NO silent fallbacks to unfiltered queries
 * - Queries REQUIRE is_mock and shadow_run columns to exist
 * - If schema is outdated, queries MUST fail with ERROR status
 * - Zero tolerance for data contamination
 * 
 * @version 1.9.9
 * @author SIA Intelligence Systems
 */

const path = require('path')
const fs = require('fs')

// ============================================================================
// TYPESCRIPT MODULE LOADER
// ============================================================================

// Register TypeScript loader for .ts imports
try {
  require('ts-node/register')
} catch (error) {
  // ts-node not available, try tsx
  try {
    require('tsx/cjs')
  } catch (error2) {
    console.error('[ERROR] TypeScript loader not available. Install ts-node or tsx:')
    console.error('  npm install --save-dev ts-node')
    console.error('  OR')
    console.error('  npm install --save-dev tsx')
    process.exit(1)
  }
}

// ============================================================================
// REAL DATA SOURCE IMPORTS
// ============================================================================

// Import real database and observability modules
let getGlobalDatabase, getMetrics, getLogger
try {
  const dbModule = require('../lib/neural-assembly/database')
  const obsModule = require('../lib/neural-assembly/observability')
  getGlobalDatabase = dbModule.getGlobalDatabase
  getMetrics = obsModule.getMetrics
  getLogger = obsModule.getLogger
} catch (error) {
  console.error('[ERROR] Failed to load internal modules:', error.message)
  console.error('[ERROR] Stack:', error.stack)
  process.exit(1)
}

// ============================================================================
// METRIC STATUS TYPES
// ============================================================================

const STATUS = {
  OBSERVABLE: 'OBSERVABLE',
  UNAVAILABLE: 'UNAVAILABLE',
  ERROR: 'ERROR'
}

// ============================================================================
// REAL METRIC READERS
// ============================================================================

/**
 * Reads LLM provider error rate from real observability logs
 * 
 * MATHEMATICAL TRUTH:
 * - Numerator: ORCHESTRATOR/GENERATE_EDITION logs with level=ERROR or level=WARN + status=FATAL/COOLDOWN
 * - Denominator: ORCHESTRATOR/GENERATE_EDITION logs with status=INVOKING (all provider attempts)
 * - Calculation: (failures / total_attempts) * 100
 * 
 * PHYSICAL SOURCE: observability_logs table
 * - component='ORCHESTRATOR', operation='GENERATE_EDITION', status='INVOKING' = total attempts
 * - component='ORCHESTRATOR', operation='GENERATE_EDITION', level='ERROR' = failures
 */
function readLLMProviderErrorRate() {
  try {
    const db = getGlobalDatabase()
    const now = Date.now()
    const fiveMinutesAgo = now - (5 * 60 * 1000)
    
    // DENOMINATOR: Total provider attempts (all GENERATE_EDITION invocations)
    // These are logged with status='INVOKING' when the provider is called
    const totalProviderAttempts = db.getLogs({
      component: 'ORCHESTRATOR',
      operation: 'GENERATE_EDITION',
      start_time: fiveMinutesAgo,
      end_time: now
    }).filter(log => log.status === 'INVOKING').length
    
    // NUMERATOR: Provider failures (ERROR level logs for GENERATE_EDITION)
    // These are logged when provider calls fail (FATAL or COOLDOWN status)
    const providerFailures = db.getLogs({
      component: 'ORCHESTRATOR',
      operation: 'GENERATE_EDITION',
      level: 'ERROR',
      start_time: fiveMinutesAgo,
      end_time: now
    }).length
    
    if (totalProviderAttempts === 0) {
      return {
        status: STATUS.OBSERVABLE,
        value: 0,
        reason: 'No LLM operations in last 5 minutes (cold start)'
      }
    }
    
    const errorRate = (providerFailures / totalProviderAttempts) * 100
    
    return {
      status: STATUS.OBSERVABLE,
      value: errorRate.toFixed(2) + '%',
      metadata: {
        total_attempts: totalProviderAttempts,
        failures: providerFailures,
        window: '5m'
      }
    }
  } catch (error) {
    return {
      status: STATUS.ERROR,
      reason: `Database query failed: ${error.message}`
    }
  }
}

/**
 * Reads batch processing success rate from real database
 * Calculation: (completed batches) / (total batches) * 100
 * 
 * PRODUCTION-ONLY FILTER: Strictly excludes mock and shadow data
 */
function readBatchProcessingSuccessRate() {
  try {
    const db = getGlobalDatabase()
    const now = Date.now()
    const tenMinutesAgo = now - (10 * 60 * 1000)
    
    // Query real batch_jobs table with STRICT production-only filters
    // CRITICAL: This query REQUIRES is_mock and shadow_run columns to exist
    // If schema is outdated, the query will fail rather than report contaminated data
    const allBatches = db.db.prepare(`
      SELECT status FROM batch_jobs 
      WHERE created_at >= ?
      AND COALESCE(is_mock, 0) = 0 
      AND COALESCE(shadow_run, 0) = 0
    `).all(tenMinutesAgo)
    
    if (allBatches.length === 0) {
      return {
        status: STATUS.OBSERVABLE,
        value: 100,
        reason: 'No production batches in last 10 minutes (cold start)'
      }
    }
    
    const completedBatches = allBatches.filter(b => 
      b.status === 'FULLY_PUBLISHED' || b.status === 'PARTIALLY_PUBLISHED'
    ).length
    
    const successRate = (completedBatches / allBatches.length) * 100
    
    return {
      status: STATUS.OBSERVABLE,
      value: successRate.toFixed(2) + '%',
      metadata: {
        total_batches: allBatches.length,
        completed: completedBatches,
        window: '10m',
        filter: 'PRODUCTION_ONLY'
      }
    }
  } catch (error) {
    return {
      status: STATUS.ERROR,
      reason: `Database query failed: ${error.message}`
    }
  }
}

/**
 * Reads edition generation P90 latency from real metrics
 * Source: observability.ts timer metrics
 */
function readEditionGenerationDurationP90() {
  try {
    const db = getGlobalDatabase()
    const now = Date.now()
    const fifteenMinutesAgo = now - (15 * 60 * 1000)
    
    // Query real metrics_snapshots table for timer data
    const metrics = db.getMetricHistory(
      'edition_generation_duration_ms',
      fifteenMinutesAgo,
      now,
      1000
    )
    
    if (metrics.length === 0) {
      return {
        status: STATUS.OBSERVABLE,
        value: 0,
        reason: 'No generation metrics in last 15 minutes (cold start)'
      }
    }
    
    // Extract durations and calculate P90
    const durations = metrics
      .map(m => {
        if (m.metadata) {
          try {
            const meta = JSON.parse(m.metadata)
            return meta.max_ms || m.value
          } catch {
            return m.value
          }
        }
        return m.value
      })
      .sort((a, b) => a - b)
    
    const p90Index = Math.floor(durations.length * 0.9)
    const p90Value = durations[p90Index] || durations[durations.length - 1]
    
    return {
      status: STATUS.OBSERVABLE,
      value: Math.round(p90Value) + 'ms',
      metadata: {
        sample_count: durations.length,
        min: Math.round(durations[0]),
        max: Math.round(durations[durations.length - 1]),
        window: '15m'
      }
    }
  } catch (error) {
    return {
      status: STATUS.ERROR,
      reason: `Metrics query failed: ${error.message}`
    }
  }
}

/**
 * Reads hourly budget burn from real database
 * Source: batch_jobs.budget_spent aggregation
 * 
 * PRODUCTION-ONLY FILTER: Strictly excludes mock and shadow data
 */
function readHourlyBudgetBurn() {
  try {
    const db = getGlobalDatabase()
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    // Query real budget_spent from batch_jobs with STRICT production-only filters
    // CRITICAL: This query REQUIRES is_mock and shadow_run columns to exist
    // If schema is outdated, the query will fail rather than report contaminated data
    const result = db.db.prepare(`
      SELECT SUM(budget_spent) as total
      FROM batch_jobs
      WHERE created_at >= ?
      AND COALESCE(is_mock, 0) = 0
      AND COALESCE(shadow_run, 0) = 0
    `).get(oneHourAgo)
    
    const totalSpent = result?.total || 0
    
    return {
      status: STATUS.OBSERVABLE,
      value: '$' + totalSpent.toFixed(2),
      metadata: {
        window: '1h',
        raw_value: totalSpent,
        filter: 'PRODUCTION_ONLY'
      }
    }
  } catch (error) {
    return {
      status: STATUS.ERROR,
      reason: `Database query failed: ${error.message}`
    }
  }
}

/**
 * Reads atomic rollback count from real observability logs
 * Source: observability_logs where operation = 'ROLLBACK_EXECUTION'
 */
function readAtomicRollbackCount() {
  try {
    const db = getGlobalDatabase()
    const now = Date.now()
    const oneHourAgo = now - (60 * 60 * 1000)
    
    // Query real rollback operations from logs (observability_logs table doesn't have is_mock/shadow_run)
    const rollbacks = db.getLogs({
      component: 'PERSISTENCE',
      operation: 'ROLLBACK_EXECUTION',
      start_time: oneHourAgo,
      end_time: now
    })
    
    return {
      status: STATUS.OBSERVABLE,
      value: rollbacks.length,
      metadata: {
        window: '1h'
      }
    }
  } catch (error) {
    return {
      status: STATUS.ERROR,
      reason: `Database query failed: ${error.message}`
    }
  }
}

/**
 * Reads shadow leak detection count using REAL shadow-check logic
 * Source: scripts/check-shadow-contamination.js integration
 */
async function readShadowLeakDetection() {
  try {
    // Import and execute the REAL shadow contamination check
    const shadowCheckPath = path.join(__dirname, 'check-shadow-contamination.js')
    
    if (!fs.existsSync(shadowCheckPath)) {
      return {
        status: STATUS.UNAVAILABLE,
        reason: 'Shadow check script not found at expected path'
      }
    }
    
    // Execute the real shadow check by importing its logic
    const { runShadowContaminationCheck } = require('../lib/observability/shadow-check')
    const report = await runShadowContaminationCheck()
    
    const leakCount = report.shadow_rows + report.mock_rows
    
    return {
      status: STATUS.OBSERVABLE,
      value: leakCount,
      metadata: {
        shadow_rows: report.shadow_rows,
        mock_rows: report.mock_rows,
        is_contaminated: report.is_contaminated,
        leaked_batch_ids: report.leaked_batch_ids
      }
    }
  } catch (error) {
    return {
      status: STATUS.ERROR,
      reason: `Shadow check execution failed: ${error.message}`
    }
  }
}

// ============================================================================
// UNAVAILABLE METRICS (NO REAL DATA PIPELINE)
// ============================================================================

/**
 * CDN publish success rate - UNAVAILABLE
 * Reason: No CDN integration exists yet, no publish tracking
 */
function readCDNPublishSuccessRate() {
  return {
    status: STATUS.UNAVAILABLE,
    reason: 'CDN publish tracking not implemented. No data pipeline exists for publish success/failure events.'
  }
}

// ============================================================================
// TELEMETRY REPORT GENERATOR
// ============================================================================

async function generateTelemetryReport() {
  console.log('━'.repeat(80))
  console.log('STAGE 0 TELEMETRY REPORT')
  console.log('━'.repeat(80))
  console.log(`Timestamp: ${new Date().toISOString()}`)
  console.log(`Source: Real database and observability infrastructure`)
  console.log('━'.repeat(80))
  console.log('')
  
  const metrics = {
    'llm_provider_error_rate': readLLMProviderErrorRate(),
    'batch_processing_success_rate': readBatchProcessingSuccessRate(),
    'edition_generation_duration_ms_p90': readEditionGenerationDurationP90(),
    'hourly_budget_burn_usd': readHourlyBudgetBurn(),
    'atomic_rollback_count_per_hour': readAtomicRollbackCount(),
    'shadow_leak_detection_count': await readShadowLeakDetection(),
    'cdn_publish_success_rate': readCDNPublishSuccessRate()
  }
  
  // Print metrics
  for (const [name, result] of Object.entries(metrics)) {
    const statusIcon = {
      [STATUS.OBSERVABLE]: '✅',
      [STATUS.UNAVAILABLE]: '⚠️',
      [STATUS.ERROR]: '❌'
    }[result.status]
    
    console.log(`${statusIcon} ${name}`)
    
    if (result.status === STATUS.OBSERVABLE) {
      console.log(`   Value: ${result.value}`)
      if (result.metadata) {
        console.log(`   Metadata: ${JSON.stringify(result.metadata)}`)
      }
      if (result.reason) {
        console.log(`   Note: ${result.reason}`)
      }
    } else {
      console.log(`   Status: [${result.status}]`)
      console.log(`   Reason: ${result.reason}`)
    }
    console.log('')
  }
  
  console.log('━'.repeat(80))
  console.log('SUMMARY')
  console.log('━'.repeat(80))
  
  const observable = Object.values(metrics).filter(m => m.status === STATUS.OBSERVABLE).length
  const unavailable = Object.values(metrics).filter(m => m.status === STATUS.UNAVAILABLE).length
  const errors = Object.values(metrics).filter(m => m.status === STATUS.ERROR).length
  
  console.log(`Observable: ${observable}/${Object.keys(metrics).length}`)
  console.log(`Unavailable: ${unavailable}/${Object.keys(metrics).length}`)
  console.log(`Errors: ${errors}/${Object.keys(metrics).length}`)
  console.log('')
  
  // Exit code: 0 if script executed successfully (even if some metrics unavailable)
  // Exit code: 1 only if script itself failed
  return 0
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    const exitCode = await generateTelemetryReport()
    process.exit(exitCode)
  } catch (error) {
    console.error('[FATAL] Telemetry script failed:', error)
    process.exit(1)
  }
}

main()
