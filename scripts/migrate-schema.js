/**
 * PHYSICAL SCHEMA PARITY REPAIR - PHASE 1.9.13
 * Principal Production SRE Tool: Zero-Data-Loss Migration
 *
 * EXECUTES:
 * - Idempotent column addition (is_mock, shadow_run)
 * - Table verification for all telemetry paths
 * - Crash-safety enforcement
 *
 * @version 1.9.13
 */

const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

// TARGET DATABASES
const DB_PATHS = {
  EDITORIAL: path.join(__dirname, '../data/editorial.db'),
  NEWS: path.join(__dirname, '../news.db')
}

/**
 * Migration Config
 * Maps tables to the columns they MUST have for Phase 1.9 parity
 */
const MIGRATION_PLAN = [
  {
    db: 'EDITORIAL',
    table: 'batch_jobs',
    columns: [
      { name: 'is_mock', type: 'INTEGER', default: '0' },
      { name: 'shadow_run', type: 'INTEGER', default: '0' }
    ]
  },
  {
    db: 'EDITORIAL',
    table: 'language_editions',
    columns: [
      { name: 'is_mock', type: 'INTEGER', default: '0' },
      { name: 'shadow_run', type: 'INTEGER', default: '0' }
    ]
  },
  {
    db: 'EDITORIAL',
    table: 'checkpoints',
    columns: [
      { name: 'is_mock', type: 'INTEGER', default: '0' },
      { name: 'shadow_run', type: 'INTEGER', default: '0' }
    ]
  },
  {
    db: 'NEWS',
    table: 'news',
    columns: [
      { name: 'is_mock', type: 'INTEGER', default: '0' },
      { name: 'shadow_run', type: 'INTEGER', default: '0' }
    ]
  }
]

/**
 * Executes migration with PRAGMA-based existence checks
 */
function runMigration() {
  console.log('━'.repeat(80))
  console.log('PHASE 1.9.13: PHYSICAL SCHEMA PARITY REPAIR')
  console.log('━'.repeat(80))
  console.log(`Timestamp: ${new Date().toISOString()}`)

  let totalChanges = 0
  let totalErrors = 0

  for (const plan of MIGRATION_PLAN) {
    const dbPath = DB_PATHS[plan.db]

    if (!fs.existsSync(dbPath)) {
      console.warn(`[SKIP] Database not found: ${plan.db} at ${dbPath}`)
      continue
    }

    console.log(`[DB] Processing ${plan.db}: ${dbPath}`)
    const db = new Database(dbPath)

    try {
      for (const col of plan.columns) {
        // 1. CHECK IF COLUMN EXISTS
        const tableInfo = db.pragma(`table_info(${plan.table})`)
        const colExists = tableInfo.some(info => info.name === col.name)

        if (!colExists) {
          console.log(`[REPAIR] Table '${plan.table}': Adding missing column '${col.name}'...`)

          // 2. EXECUTE SURGICAL ALTER
          // Note: SQLite ALTER TABLE ... ADD COLUMN supports DEFAULT values
          db.prepare(`
            ALTER TABLE ${plan.table}
            ADD COLUMN ${col.name} ${col.type} DEFAULT ${col.default}
          `).run()

          console.log(`[SUCCESS] Table '${plan.table}': Column '${col.name}' added.`)
          totalChanges++
        } else {
          console.log(`[OK] Table '${plan.table}': Column '${col.name}' already exists.`)
        }
      }
    } catch (error) {
      console.error(`[ERROR] Failed to repair table '${plan.table}' in ${plan.db}:`, error.message)
      totalErrors++
    } finally {
      db.close()
    }
  }

  console.log('━'.repeat(80))
  console.log('MIGRATION SUMMARY')
  console.log('━'.repeat(80))
  console.log(`Columns Added: ${totalChanges}`)
  console.log(`Errors encountered: ${totalErrors}`)

  if (totalErrors > 0) {
    console.error('[FATAL] Physical schema parity repair FAILED.')
    process.exit(1)
  }

  console.log('[VERDICT] Physical schema is now in parity with application code.')
  console.log('━'.repeat(80))
}

// EXECUTE
if (require.main === module) {
  runMigration()
}

module.exports = { runMigration }
