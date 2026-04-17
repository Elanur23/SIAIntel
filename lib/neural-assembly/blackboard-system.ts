/**
 * BLACKBOARD_SYSTEM.TS
 * Inter-Cell Communication via Blackboard Pattern with Atomic Updates
 * 
 * The Blackboard serves as a shared knowledge repository where cells can:
 * - Read data they need (via Cell View Contracts)
 * - Write their findings (with atomic locking)
 * - Communicate without direct coupling
 * 
 * @version 1.0.0
 * @author SIA Intelligence Systems - Cellular Editorial OS
 */

import { CellType } from './field-dependency-engine'
import { getGlobalDatabase } from './database'
import {
  logLockAcquired,
  logLockContention,
  logLockReleased
} from './observability'

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CellViewContract {
  cell_name: string
  required_fields: string[]  // e.g., ['content.body', 'metadata.keywords']
  read_only: boolean
}

export interface BlackboardEntry {
  key: string
  value: any
  lastModified: number
  modifiedBy: CellType | 'system' | 'user' | 'manual_override' | 'state_manager'
  version: number
  locked: boolean
  lockHolder?: string
}

export interface BlackboardLock {
  key: string
  lockId: string
  acquiredAt: number
  expiresAt: number
}

export interface BlackboardSnapshot {
  timestamp: number
  entries: Map<string, any>
  version: number
}

// ============================================================================
// CELL VIEW CONTRACTS
// ============================================================================

export const CELL_VIEW_CONTRACTS: Record<CellType, CellViewContract> = {
  // ========== TIER 0: FOUNDATION CELLS ==========
  title_cell: {
    cell_name: 'title_cell',
    required_fields: [
      'truth_nucleus.facts[]',
      'truth_nucleus.claims[]',
      'metadata.keywords[]',
      'metadata.region'
    ],
    read_only: false
  },

  body_cell: {
    cell_name: 'body_cell',
    required_fields: [
      'truth_nucleus.facts[]',
      'truth_nucleus.claims[]',
      'truth_nucleus.impact_analysis',
      'metadata.language',
      'metadata.region'
    ],
    read_only: false
  },

  // ========== TIER 1: CONTEXTUAL CELLS ==========
  fact_check_cell: {
    cell_name: 'fact_check_cell',
    required_fields: [
      'content.title',
      'content.lead',
      'content.body.full',
      'truth_nucleus.facts[]',
      'entities[]'
    ],
    read_only: true  // Only validates, doesn't modify content
  },

  tone_cell: {
    cell_name: 'tone_cell',
    required_fields: [
      'content.title',
      'content.lead',
      'content.body.full',
      'metadata.language',
      'metadata.region'
    ],
    read_only: true
  },

  policy_cell: {
    cell_name: 'policy_cell',
    required_fields: [
      'content.title',
      'content.lead',
      'content.body.full',
      'metadata.category'
    ],
    read_only: true
  },

  // ========== TIER 2: OPTIMIZER CELLS ==========
  seo_cell: {
    cell_name: 'seo_cell',
    required_fields: [
      'content.title',
      'content.lead',
      'content.body.summary',
      'metadata.keywords[]',
      'metadata.language'
    ],
    read_only: false  // Can suggest optimizations
  },

  readability_cell: {
    cell_name: 'readability_cell',
    required_fields: [
      'content.body.full',
      'metadata.language'
    ],
    read_only: true
  },

  link_cell: {
    cell_name: 'link_cell',
    required_fields: [
      'content.body.full',
      'entities[]',
      'metadata.category'
    ],
    read_only: false  // Adds internal links
  },

  // ========== TIER 3: VALIDATOR CELLS ==========
  schema_cell: {
    cell_name: 'schema_cell',
    required_fields: [
      'content.title',
      'content.lead',
      'entities[]',
      'metadata.category',
      'metadata.region'
    ],
    read_only: false  // Generates schema markup
  },

  meta_cell: {
    cell_name: 'meta_cell',
    required_fields: [
      'content.title',
      'content.lead',
      'metadata.keywords[]',
      'metadata.language'
    ],
    read_only: false  // Generates meta tags
  },

  sovereign_cell: {
    cell_name: 'sovereign_cell',
    required_fields: [
      'content.body.full',
      'entities[]',
      'metadata.region',
      'truth_nucleus.geopolitical_context'
    ],
    read_only: false  // Adds sovereign context
  },

  visual_cell: {
    cell_name: 'visual_cell',
    required_fields: [
      'content.title',
      'content.body.summary',
      'entities[]'
    ],
    read_only: false  // Suggests visual elements
  },

  // ========== TIER 4: DISCOVERY & CROSS-LANGUAGE ==========
  discover_cell: {
    cell_name: 'discover_cell',
    required_fields: [
      'content.title',
      'content.lead',
      'metadata.keywords[]',
      'metadata.category'
    ],
    read_only: false  // Optimizes for Google Discover
  },

  cross_lang_cell: {
    cell_name: 'cross_lang_cell',
    required_fields: [
      'content.title',
      'content.hreflang_tags',
      'metadata.language'
    ],
    read_only: false  // Manages cross-language references
  }
}

// ============================================================================
// BLACKBOARD SYSTEM
// ============================================================================

export class Blackboard {
  private entries: Map<string, BlackboardEntry> = new Map()
  private locks: Map<string, BlackboardLock> = new Map()
  private snapshots: BlackboardSnapshot[] = []
  private lockTimeout: number = 30000  // 30 seconds
  private maxSnapshots: number = 10

  /**
   * Reads a value from the blackboard
   */
  read(key: string): any {
    const entry = this.entries.get(key)
    if (!entry) {
      return undefined
    }
    return entry.value
  }

  /**
   * Writes a value to the blackboard (non-atomic, use atomicUpdate for safety)
   */
  write(key: string, value: any, modifiedBy: CellType | 'system' | 'user' | 'manual_override' | 'state_manager' = 'system'): void {
    const existing = this.entries.get(key)
    const version = existing ? existing.version + 1 : 1

    this.entries.set(key, {
      key,
      value,
      lastModified: Date.now(),
      modifiedBy,
      version,
      locked: false
    })
  }

  /**
   * Acquires a lock on a key for atomic updates
   * RUNTIME WIRING: Persists locks to database for restart safety
   */
  async acquireLock(key: string, timeout: number = this.lockTimeout): Promise<string> {
    const lockId = `lock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // RUNTIME WIRING: Try to acquire lock in database first
    const db = getGlobalDatabase()
    const acquired = db.acquireLock(key, lockId, timeout, 'blackboard')
    
    if (!acquired) {
      logLockContention(key, 'blackboard')
      throw new Error(`Key "${key}" is already locked`)
    }

    // Also track in memory for fast access (non-authoritative cache)
    const lock: BlackboardLock = {
      key,
      lockId,
      acquiredAt: Date.now(),
      expiresAt: Date.now() + timeout
    }
    this.locks.set(key, lock)

    // Mark entry as locked
    const entry = this.entries.get(key)
    if (entry) {
      entry.locked = true
      entry.lockHolder = lockId
    }

    logLockAcquired(key, lockId, 'blackboard')

    return lockId
  }

  /**
   * Releases a lock
   * RUNTIME WIRING: Removes lock from database
   */
  releaseLock(lockId: string): void {
    // RUNTIME WIRING: Release from database
    const db = getGlobalDatabase()
    db.releaseLock(lockId)
    
    logLockReleased(lockId)
    
    // Find and remove from memory cache
    for (const [key, lock] of this.locks.entries()) {
      if (lock.lockId === lockId) {
        this.locks.delete(key)

        // Mark entry as unlocked
        const entry = this.entries.get(key)
        if (entry && entry.lockHolder === lockId) {
          entry.locked = false
          entry.lockHolder = undefined
        }

        return
      }
    }
  }

  /**
   * Atomic update with automatic locking
   */
  async atomicUpdate(
    key: string,
    updateFn: (current: any) => any,
    modifiedBy: CellType | 'system' | 'user' | 'manual_override' | 'state_manager' = 'system'
  ): Promise<void> {
    const lockId = await this.acquireLock(key)
    try {
      const current = this.read(key)
      const newValue = updateFn(current)
      this.write(key, newValue, modifiedBy)
    } finally {
      this.releaseLock(lockId)
    }
  }

  /**
   * Merges new value with existing value (deep merge)
   */
  merge(current: any, newValue: any): any {
    if (typeof current !== 'object' || current === null) {
      return newValue
    }

    if (typeof newValue !== 'object' || newValue === null) {
      return newValue
    }

    if (Array.isArray(current) && Array.isArray(newValue)) {
      // For arrays, concatenate and deduplicate
      return [...new Set([...current, ...newValue])]
    }

    // For objects, deep merge
    const merged = { ...current }
    for (const key in newValue) {
      if (newValue.hasOwnProperty(key)) {
        if (typeof newValue[key] === 'object' && newValue[key] !== null) {
          merged[key] = this.merge(merged[key], newValue[key])
        } else {
          merged[key] = newValue[key]
        }
      }
    }

    return merged
  }

  /**
   * Reads multiple keys at once (for cell view contracts)
   */
  readMultiple(keys: string[]): Record<string, any> {
    const result: Record<string, any> = {}
    for (const key of keys) {
      result[key] = this.read(key)
    }
    return result
  }

  /**
   * Checks if a cell has access to required fields
   */
  validateCellAccess(cell: CellType, requestedKeys: string[]): boolean {
    const contract = CELL_VIEW_CONTRACTS[cell]
    if (!contract) {
      return false
    }

    // Check if all requested keys are in the contract's required_fields
    return requestedKeys.every(key => contract.required_fields.includes(key))
  }

  /**
   * Gets all data required by a cell (based on its view contract)
   */
  getCellView(cell: CellType): Record<string, any> {
    const contract = CELL_VIEW_CONTRACTS[cell]
    if (!contract) {
      throw new Error(`No view contract found for cell: ${cell}`)
    }

    return this.readMultiple(contract.required_fields)
  }

  /**
   * Creates a snapshot of the current blackboard state
   */
  createSnapshot(): BlackboardSnapshot {
    const snapshot: BlackboardSnapshot = {
      timestamp: Date.now(),
      entries: new Map(
        Array.from(this.entries.entries()).map(([key, entry]) => [key, entry.value])
      ),
      version: this.snapshots.length + 1
    }

    this.snapshots.push(snapshot)

    // Keep only last N snapshots
    if (this.snapshots.length > this.maxSnapshots) {
      this.snapshots.shift()
    }

    return snapshot
  }

  /**
   * Restores blackboard to a previous snapshot
   */
  restoreSnapshot(version: number): boolean {
    const snapshot = this.snapshots.find(s => s.version === version)
    if (!snapshot) {
      return false
    }

    // Clear current entries
    this.entries.clear()

    // Restore from snapshot
    for (const [key, value] of snapshot.entries.entries()) {
      this.write(key, value, 'system')
    }

    return true
  }

  /**
   * Gets the history of changes for a specific key
   */
  getHistory(key: string): Array<{ version: number; value: any; timestamp: number }> {
    const history: Array<{ version: number; value: any; timestamp: number }> = []

    for (const snapshot of this.snapshots) {
      const value = snapshot.entries.get(key)
      if (value !== undefined) {
        history.push({
          version: snapshot.version,
          value,
          timestamp: snapshot.timestamp
        })
      }
    }

    return history
  }

  /**
   * Clears all entries (use with caution)
   */
  clear(): void {
    this.entries.clear()
    this.locks.clear()
    this.snapshots = []
  }

  /**
   * Gets current blackboard statistics
   */
  getStats(): {
    totalEntries: number
    lockedEntries: number
    activeLocks: number
    snapshots: number
  } {
    const lockedEntries = Array.from(this.entries.values()).filter(e => e.locked).length

    return {
      totalEntries: this.entries.size,
      lockedEntries,
      activeLocks: this.locks.size,
      snapshots: this.snapshots.length
    }
  }

  /**
   * Exports blackboard state to JSON
   */
  exportState(): string {
    const state = {
      entries: Array.from(this.entries.entries()).map(([key, entry]) => ({
        key,
        value: entry.value,
        lastModified: entry.lastModified,
        modifiedBy: entry.modifiedBy,
        version: entry.version
      })),
      snapshots: this.snapshots.map(s => ({
        timestamp: s.timestamp,
        version: s.version,
        entryCount: s.entries.size
      }))
    }

    return JSON.stringify(state, null, 2)
  }

  /**
   * Imports blackboard state from JSON
   */
  importState(json: string): void {
    const state = JSON.parse(json)

    this.clear()

    for (const entry of state.entries) {
      this.write(entry.key, entry.value, entry.modifiedBy)
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let globalBlackboard: Blackboard | null = null

export function getGlobalBlackboard(): Blackboard {
  if (!globalBlackboard) {
    globalBlackboard = new Blackboard()
  }
  return globalBlackboard
}

export function resetGlobalBlackboard(): void {
  globalBlackboard = null
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Atomic update helper (convenience function)
 */
export async function atomicUpdate(
  key: string,
  newValue: any,
  modifiedBy: CellType | 'system' | 'user' | 'manual_override' | 'state_manager' = 'system'
): Promise<void> {
  const blackboard = getGlobalBlackboard()
  await blackboard.atomicUpdate(
    key,
    (current) => blackboard.merge(current, newValue),
    modifiedBy
  )
}

/**
 * Reads cell view data (convenience function)
 */
export function readCellView(cell: CellType): Record<string, any> {
  const blackboard = getGlobalBlackboard()
  return blackboard.getCellView(cell)
}

/**
 * Validates if a cell can write to a field
 */
export function canCellWrite(cell: CellType, field: string): boolean {
  const contract = CELL_VIEW_CONTRACTS[cell]
  if (!contract) {
    return false
  }

  // Read-only cells cannot write
  if (contract.read_only) {
    return false
  }

  // Cell can only write to fields it has access to
  return contract.required_fields.includes(field)
}

/**
 * Gets all cells that can read a specific field
 */
export function getCellsReadingField(field: string): CellType[] {
  const cells: CellType[] = []

  for (const [cellType, contract] of Object.entries(CELL_VIEW_CONTRACTS)) {
    if (contract.required_fields.includes(field)) {
      cells.push(cellType as CellType)
    }
  }

  return cells
}

/**
 * Gets all cells that can write to a specific field
 */
export function getCellsWritingField(field: string): CellType[] {
  const cells: CellType[] = []

  for (const [cellType, contract] of Object.entries(CELL_VIEW_CONTRACTS)) {
    if (!contract.read_only && contract.required_fields.includes(field)) {
      cells.push(cellType as CellType)
    }
  }

  return cells
}

// ============================================================================
// EXPORT
// ============================================================================

export default Blackboard
