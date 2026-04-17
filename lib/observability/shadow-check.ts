/**
 * SIA SHADOW CONTAMINATION SAFETY CHECK - Phase 1.7
 * Production-ready validation to detect mock/shadow leakage.
 */

import { getDatabase } from '@/lib/database'

export interface ShadowContaminationReport {
  timestamp: string
  total_rows: number
  shadow_rows: number
  mock_rows: number
  is_contaminated: boolean
  leaked_batch_ids: string[]
}

/**
 * Validates production database for shadow/mock leak contamination.
 * NO-GO THRESHOLD: > 0 leaked rows.
 */
export async function runShadowContaminationCheck(): Promise<ShadowContaminationReport> {
  const db = getDatabase()

  // Explicit validation query: Check for rows that should NOT be visible in production
  // where shadow_run = true OR is_mock = true
  const query = `
    SELECT id, batch_id, shadow_run, is_mock
    FROM news
    WHERE shadow_run = 1 OR is_mock = 1
  `

  const contaminatedRows = db.prepare(query).all() as Array<{
    id: string
    batch_id: string
    shadow_run: number
    is_mock: number
  }>

  const report: ShadowContaminationReport = {
    timestamp: new Date().toISOString(),
    total_rows: (db.prepare('SELECT count(*) as count FROM news').get() as any).count,
    shadow_rows: contaminatedRows.filter(r => r.shadow_run === 1).length,
    mock_rows: contaminatedRows.filter(r => r.is_mock === 1).length,
    is_contaminated: contaminatedRows.length > 0,
    leaked_batch_ids: Array.from(new Set(contaminatedRows.map(r => r.batch_id)))
  }

  if (report.is_contaminated) {
    console.error(`[CRITICAL] SHADOW CONTAMINATION DETECTED! Found ${contaminatedRows.length} leaked rows.`)
    console.error(`Leaked Batch IDs: ${report.leaked_batch_ids.join(', ')}`)

    // OPERATOR ACTION: Emergency Stop Trigger Point
    // In a real environment, this would call a sys-admin API or create a flag file
    await triggerEmergencyStopFromShadowLeak(report)
  }

  return report
}

async function triggerEmergencyStopFromShadowLeak(report: ShadowContaminationReport) {
  const fs = require('fs')

  // Standard emergency stop trigger mechanism
  if (!fs.existsSync('.emergency-stop-active')) {
    fs.writeFileSync('.emergency-stop-active', JSON.stringify(report, null, 2))
    console.log('[SRE] Emergency stop file created due to shadow contamination.')
  }
}

/**
 * Purges production database of shadow/mock rows.
 */
export function purgeShadowContamination(): { changes: number } {
  const db = getDatabase()
  const result = db.prepare('DELETE FROM news WHERE shadow_run = 1 OR is_mock = 1').run()

  console.log(`[SRE] Purged ${result.changes} contaminated rows from news table.`)
  return { changes: result.changes }
}
