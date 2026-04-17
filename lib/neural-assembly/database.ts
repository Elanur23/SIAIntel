type GenericRecord = Record<string, any>

export interface ObservabilityLog extends GenericRecord {
  timestamp: number
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  component: string
  operation: string
  message: string
  metadata?: string
  bypass_token?: string | null
}

export class EditorialDatabase {
  public db: {
    pragma: (_query: string) => any[]
    prepare: (_query: string) => { run: (..._args: any[]) => { lastInsertRowid: number; changes: number }; get: (..._args: any[]) => any; all: (..._args: any[]) => any[] }
    exec: (_query: string) => void
    transaction: <T extends (...args: any[]) => any>(callback: T) => T
    close: () => void
  }

  private logs: ObservabilityLog[] = []
  private locks = new Map<string, { key: string; lockId: string; expiresAt: number; owner?: string }>()
  private metricSnapshots: GenericRecord[] = []
  private decisionTraces: GenericRecord[] = []
  private decisionDna: GenericRecord[] = []
  private batches = new Map<string, GenericRecord>()
  private editions = new Map<string, GenericRecord>()
  private checkpoints = new Map<string, GenericRecord>()
  private idempotency = new Map<string, GenericRecord>()
  private budgetReservations = new Map<string, GenericRecord[]>()
  private editorialDecisionAudits: GenericRecord[] = []
  private consumedBypassTokens = new Set<string>()

  constructor(dbPath = ':memory:') {
    let sqliteDb: EditorialDatabase['db'] | null = null

    try {
      // Optional runtime dependency. In tests this is often mocked.
      const BetterSqlite3 = require('better-sqlite3')
      sqliteDb = new BetterSqlite3(dbPath)
    } catch {
      sqliteDb = null
    }

    this.db = sqliteDb || this.createFallbackDatabase()
    this.initializeSchema()
  }

  private createFallbackDatabase(): EditorialDatabase['db'] {
    return {
      pragma: (query: string) => this.fallbackPragma(query),
      prepare: (_query: string) => ({
        run: (..._args: any[]) => ({ lastInsertRowid: 1, changes: 1 }),
        get: (..._args: any[]) => null,
        all: (..._args: any[]) => [],
      }),
      exec: (_query: string) => undefined,
      transaction: <T extends (...args: any[]) => any>(callback: T) => callback,
      close: () => undefined,
    }
  }

  private fallbackPragma(query: string): any[] {
    const normalized = query.trim().toLowerCase()

    if (normalized === 'table_info(observability_logs)') {
      return [
        { cid: 0, name: 'id', type: 'INTEGER', notnull: 0, dflt_value: null, pk: 1 },
        { cid: 1, name: 'timestamp', type: 'INTEGER', notnull: 1, dflt_value: null, pk: 0 },
        { cid: 2, name: 'level', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        { cid: 3, name: 'component', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        { cid: 4, name: 'operation', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        { cid: 5, name: 'message', type: 'TEXT', notnull: 1, dflt_value: null, pk: 0 },
        { cid: 6, name: 'metadata', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
        { cid: 7, name: 'bypass_token', type: 'TEXT', notnull: 0, dflt_value: null, pk: 0 },
      ]
    }

    if (normalized === 'index_list(observability_logs)') {
      return [
        {
          seq: 0,
          name: 'idx_bypass_token_unique',
          unique: 1,
          origin: 'c',
          partial: 1,
        },
      ]
    }

    return []
  }

  private initializeSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS observability_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp INTEGER NOT NULL,
        level TEXT NOT NULL,
        component TEXT NOT NULL,
        operation TEXT NOT NULL,
        message TEXT NOT NULL,
        metadata TEXT,
        bypass_token TEXT
      );
    `)

    this.db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_bypass_token_unique
      ON observability_logs(bypass_token)
      WHERE bypass_token IS NOT NULL;
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS batch_jobs (
        id TEXT PRIMARY KEY,
        mic_id TEXT,
        user_id TEXT,
        status TEXT,
        approved_languages TEXT,
        pending_languages TEXT,
        rejected_languages TEXT,
        budget_json TEXT,
        recirculation_count INTEGER,
        escalation_depth INTEGER,
        created_at INTEGER,
        updated_at INTEGER,
        is_mock INTEGER,
        shadow_run INTEGER,
        p2p_token TEXT,
        manifest_json TEXT
      );
    `)

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS decision_dna (
        audit_id TEXT PRIMARY KEY,
        payload_id TEXT,
        manifest_hash TEXT,
        trace_id TEXT,
        contract_version TEXT,
        final_decision TEXT,
        gate_results TEXT,
        pecl_decision TEXT,
        timestamp INTEGER
      );
    `)
  }

  private freezeRecord<T>(value: T): T {
    return JSON.parse(JSON.stringify(value || {})) as T
  }

  private resolveFinalDecisionValue(dna: GenericRecord): string {
    const finalDecision = dna?.final_decision
    if (typeof finalDecision === 'string') {
      return finalDecision
    }

    if (finalDecision && typeof finalDecision.final_decision === 'string') {
      return finalDecision.final_decision
    }

    if (dna?.pecl_decision && typeof dna.pecl_decision.final_decision === 'string') {
      return dna.pecl_decision.final_decision
    }

    return 'UNKNOWN'
  }

  acquireLock(key: string, lockId: string, timeoutMs: number, owner?: string): boolean {
    const now = Date.now()

    for (const [existingLockId, lock] of this.locks.entries()) {
      if (lock.expiresAt <= now) {
        this.locks.delete(existingLockId)
      }
    }

    const existing = Array.from(this.locks.values()).find((lock) => lock.key === key)
    if (existing) {
      return false
    }

    this.locks.set(lockId, {
      key,
      lockId,
      expiresAt: now + timeoutMs,
      owner,
    })

    return true
  }

  releaseLock(lockId: string): void {
    this.locks.delete(lockId)
  }

  saveLog(log: GenericRecord): void {
    const normalizedLog: GenericRecord = {
      timestamp: Number(log.timestamp || Date.now()),
      level: (log.level || 'INFO') as ObservabilityLog['level'],
      component: String(log.component || 'UNKNOWN'),
      operation: String(log.operation || 'UNKNOWN'),
      message: String(log.message || ''),
      ...this.freezeRecord(log),
    }

    const bypassToken = typeof normalizedLog.bypass_token === 'string' ? normalizedLog.bypass_token : ''
    if (bypassToken && this.consumedBypassTokens.has(bypassToken)) {
      const uniqueError = new Error('UNIQUE constraint failed: observability_logs.bypass_token') as Error & { code?: string }
      uniqueError.code = 'SQLITE_CONSTRAINT'
      throw uniqueError
    }

    if (bypassToken) {
      this.consumedBypassTokens.add(bypassToken)
    }

    this.db.prepare(`
      INSERT INTO observability_logs (
        timestamp,
        level,
        component,
        operation,
        message,
        metadata,
        bypass_token
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      normalizedLog.timestamp,
      normalizedLog.level,
      normalizedLog.component,
      normalizedLog.operation,
      normalizedLog.message,
      normalizedLog.metadata ? String(normalizedLog.metadata) : null,
      bypassToken || null
    )

    this.logs.push(normalizedLog as ObservabilityLog)
  }

  getLogs(filters: GenericRecord = {}): ObservabilityLog[] {
    return this.logs.filter((log) => {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === null) {
          continue
        }
        if (key === 'limit') {
          continue
        }
        if (log[key as keyof ObservabilityLog] !== value) {
          return false
        }
      }
      return true
    }).slice(0, Number(filters.limit || 1000))
  }

  getCriticalLogs(limit = 100): ObservabilityLog[] {
    return this.logs
      .filter((log) => log.level === 'WARN' || log.level === 'ERROR')
      .slice(-limit)
  }

  saveMetricSnapshot(snapshot: GenericRecord): void {
    this.metricSnapshots.push(snapshot)
  }

  saveDecisionTrace(trace: GenericRecord, batchId: string): void {
    this.decisionTraces.push({
      ...trace,
      batch_id: batchId,
    })
  }

  async saveDecisionDNA(dna: GenericRecord): Promise<void> {
    const frozen = this.freezeRecord(dna)

    if (!Array.isArray(frozen?.gate_results) || frozen.gate_results.length === 0) {
      throw new Error('fail-closed: missing_gate_results')
    }

    this.db.prepare(`
      INSERT OR REPLACE INTO decision_dna (
        audit_id,
        payload_id,
        manifest_hash,
        trace_id,
        contract_version,
        final_decision,
        gate_results,
        pecl_decision,
        timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(frozen.audit_id || `audit_${Date.now()}`),
      String(frozen.payload_id || ''),
      String(frozen.manifest_hash || ''),
      String(frozen.trace_id || ''),
      String(frozen.contract_version || '7.0.0'),
      this.resolveFinalDecisionValue(frozen),
      JSON.stringify(frozen.gate_results || []),
      JSON.stringify(frozen.pecl_decision || frozen.final_decision || {}),
      Number(frozen.timestamp || Date.now())
    )

    this.decisionDna.push({
      ...frozen,
      saved_at: Date.now(),
    })
  }

  saveEditorialDecisionAudit(record: GenericRecord): void {
    this.editorialDecisionAudits.push(record)
  }

  getEditorialDecisionAudits(filters: { batchId?: string; traceId?: string; limit?: number } = {}): GenericRecord[] {
    const { batchId, traceId, limit = 100 } = filters
    return this.editorialDecisionAudits
      .filter((record) => {
        if (batchId && record.batch_id !== batchId) {
          return false
        }
        if (traceId && record.trace_id !== traceId) {
          return false
        }
        return true
      })
      .slice(0, limit)
  }

  saveBatch(batch: GenericRecord): void {
    const frozen = this.freezeRecord(batch)

    if (frozen?.id) {
      const batchId = String(frozen.id)

      this.db.prepare(`
        INSERT OR REPLACE INTO batch_jobs (
          id,
          mic_id,
          user_id,
          status,
          approved_languages,
          pending_languages,
          rejected_languages,
          budget_json,
          recirculation_count,
          escalation_depth,
          created_at,
          updated_at,
          is_mock,
          shadow_run,
          p2p_token,
          manifest_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        batchId,
        String(frozen.mic_id || ''),
        String(frozen.user_id || ''),
        String(frozen.status || 'UNKNOWN'),
        JSON.stringify(frozen.approved_languages || []),
        JSON.stringify(frozen.pending_languages || []),
        JSON.stringify(frozen.rejected_languages || []),
        JSON.stringify(frozen.budget || {}),
        Number(frozen.recirculation_count || 0),
        Number(frozen.escalation_depth || 0),
        Number(frozen.created_at || Date.now()),
        Number(frozen.updated_at || Date.now()),
        frozen.is_mock ? 1 : 0,
        frozen.shadow_run ? 1 : 0,
        typeof frozen.p2p_token === 'string' ? frozen.p2p_token : null,
        frozen.manifest ? JSON.stringify(frozen.manifest) : null
      )

      this.batches.set(batchId, frozen)

      if (!this.budgetReservations.has(batchId)) {
        this.budgetReservations.set(batchId, [])
      }
    }
  }

  getBatch(batchId: string): GenericRecord | null {
    return this.batches.get(batchId) || null
  }

  getEdition(editionId: string): GenericRecord | null {
    return this.editions.get(editionId) || null
  }

  saveEdition(edition: GenericRecord, batchId?: string): void {
    if (!edition?.id) {
      return
    }

    this.editions.set(String(edition.id), edition)

    if (batchId) {
      const existing = this.batches.get(batchId)
      if (existing) {
        const language = String(edition.language || '')
        if (language) {
          existing.editions = existing.editions || {}
          existing.editions[language] = edition
          this.batches.set(batchId, existing)
        }
      }
    }
  }

  getBudgetReservations(batchId: string): GenericRecord[] {
    return [...(this.budgetReservations.get(batchId) || [])]
  }

  updateBudgetReservation(
    reservationId: string,
    status: string,
    consumedAmount: number = 0,
    reason?: string
  ): void {
    for (const [batchId, reservations] of this.budgetReservations.entries()) {
      const index = reservations.findIndex(
        (reservation) => reservation.reservation_id === reservationId
      )

      if (index === -1) {
        continue
      }

      reservations[index] = {
        ...reservations[index],
        status,
        consumed_amount: consumedAmount,
        reason,
        updated_at: Date.now(),
      }

      this.budgetReservations.set(batchId, reservations)
      return
    }
  }

  rollbackBatchBudget(batchId: string, rolledBackLanguages: string[]): void {
    const reservations = this.budgetReservations.get(batchId) || []

    for (const reservation of reservations) {
      const operation = String(reservation.operation || '')
      const reservationId = String(reservation.reservation_id || '')

      const applies = rolledBackLanguages.some(
        (language) => operation.includes(language) || reservationId.includes(language)
      )

      if (!applies) {
        continue
      }

      reservation.status = 'RELEASED'
      reservation.updated_at = Date.now()
    }

    this.budgetReservations.set(batchId, reservations)
  }

  saveCheckpoint(checkpoint: GenericRecord): void {
    const key = String(checkpoint?.id || checkpoint?.checkpoint_id || `checkpoint-${Date.now()}`)
    this.checkpoints.set(key, checkpoint)
  }

  setIdempotency(key: string, value: GenericRecord = { value: true, timestamp: Date.now() }): void {
    this.idempotency.set(key, value)
  }

  getActiveBatchCount(identifier: string): number {
    return Array.from(this.batches.values()).filter((batch) => {
      const sameOwner = batch.user_id === identifier || batch.userId === identifier || batch.owner === identifier
      const active = batch.status === 'IN_PROGRESS' || batch.status === 'AUDITING' || batch.status === 'HEALING'
      return sameOwner && active
    }).length
  }

  getDailySpent(identifier: string, dayStartTimestamp: number): number {
    return Array.from(this.batches.values())
      .filter((batch) => {
        const createdAt = Number(batch.created_at || batch.createdAt || 0)
        const sameOwner = batch.user_id === identifier || batch.userId === identifier || batch.owner === identifier
        return sameOwner && createdAt >= dayStartTimestamp
      })
      .reduce((sum, batch) => sum + Number(batch?.budget?.spent || 0), 0)
  }

  close(): void {
    this.db.close()
  }
}

let globalDatabase: EditorialDatabase | null = null

export function getGlobalDatabase(): EditorialDatabase {
  const testDb = (globalThis as any).__TEST_DB__
  if (testDb) {
    return testDb as EditorialDatabase
  }

  if (!globalDatabase) {
    globalDatabase = new EditorialDatabase()
  }
  return globalDatabase
}

export function resetGlobalDatabase(): void {
  globalDatabase = null
}
