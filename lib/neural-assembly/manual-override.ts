/**
 * MANUAL_OVERRIDE.TS
 * Production-Grade Human Safety Valve for Cellular Editorial OS
 *
 * Requirements:
 * 1. Create override contract
 * 2. Overrides must take priority over automation
 * 3. Must be logged immutably
 * 4. Must trigger event: MANUAL_OVERRIDE_TRIGGERED
 * 5. Rules: BLOCK, FORCE_APPROVE, FORCE_REGENERATE, BYPASS_CELL
 *
 * @version 1.0.0
 * @author SIA Intelligence Systems - Cellular Editorial OS
 */

import { Language, getGlobalEventBus } from './editorial-event-bus'
import { CellType } from './field-dependency-engine'
import { getGlobalBlackboard } from './blackboard-system'

// ============================================================================
// 1. OVERRIDE CONTRACT
// ============================================================================

export type ManualOverrideType =
  | "BLOCK"             // Stops publishing for MIC/Edition
  | "FORCE_APPROVE"     // Bypasses audit and marks as APPROVED
  | "FORCE_REGENERATE"  // Forces full regeneration from MIC
  | "BYPASS_CELL"       // Skips specific cell execution

export interface ManualOverride {
  override_id: string
  mic_id: string
  language?: Language
  override_type: ManualOverrideType
  target_cells?: CellType[]
  reason: string
  created_by: string
  created_at: string
}

// ============================================================================
// 2. IMMUTABLE LOGGING & SYSTEM BEHAVIOR
// ============================================================================

export class ManualOverrideManager {
  private static instance: ManualOverrideManager
  private overrideLog: ManualOverride[] = []
  private blackboard = getGlobalBlackboard()
  private eventBus = getGlobalEventBus()

  private constructor() {}

  public static getInstance(): ManualOverrideManager {
    if (!ManualOverrideManager.instance) {
      ManualOverrideManager.instance = new ManualOverrideManager()
    }
    return ManualOverrideManager.instance
  }

  /**
   * Triggers a manual override
   * 6. Add safety: Role-based permissions, Critical override confirmation
   */
  public async triggerOverride(
    override: Omit<ManualOverride, 'override_id' | 'created_at'>,
    userRole: 'ADMIN' | 'EDITOR' | 'VIEWER',
    options: { confirmed?: boolean } = {}
  ): Promise<string> {
    // 6. Role-based permissions
    if (userRole !== 'ADMIN' && userRole !== 'EDITOR') {
      throw new Error(`Permission Denied: Role ${userRole} cannot trigger overrides.`)
    }

    // Critical override confirmation
    const isCritical = override.override_type === 'BLOCK' || override.override_type === 'FORCE_REGENERATE'
    if (isCritical && !options.confirmed) {
      throw new Error(`Critical Override Warning: ${override.override_type} requires explicit confirmation.`)
    }

    if (override.override_type === 'BLOCK' && userRole !== 'ADMIN') {
      throw new Error(`Permission Denied: Only ADMIN can BLOCK production pipelines.`)
    }

    const fullOverride: ManualOverride = {
      ...override,
      override_id: this.generateUUID(),
      created_at: new Date().toISOString()
    }

    // 3. Log immutably
    this.overrideLog.push(Object.freeze(fullOverride))

    // 2. Overrides must take priority over automation (Update Blackboard)
    await this.applyOverrideToState(fullOverride)

    // 4. Trigger event
    await this.eventBus.publish('MANUAL_OVERRIDE_TRIGGERED', fullOverride.mic_id, {
      override_id: fullOverride.override_id,
      mic_id: fullOverride.mic_id,
      override_type: fullOverride.override_type,
      language: fullOverride.language,
      reason: fullOverride.reason,
      editor_id: fullOverride.created_by
    })

    console.log(`[ManualOverride] ${fullOverride.override_type} triggered by ${fullOverride.created_by} for MIC ${fullOverride.mic_id}`)

    return fullOverride.override_id
  }

  /**
   * 5. Integrate with State Machine: Changes workflow state, Forces reroute
   */
  private async applyOverrideToState(override: ManualOverride): Promise<void> {
    const { mic_id, language, override_type, target_cells } = override

    // Apply rules
    switch (override_type) {
      case "BLOCK":
        // 3. Add rules: BLOCK -> stops publishing
        if (language) {
          await this.blackboard.atomicUpdate(`edition.${language}`, (current: any) => ({
            ...current,
            status: 'REJECTED',
            manual_block: true
          }), 'manual_override')
        } else {
          // MIC-level block (all languages)
          await this.blackboard.atomicUpdate(`mic.${mic_id}`, (current: any) => ({
            ...current,
            status: 'ARCHIVED',
            blocked: true
          }), 'manual_override')
        }
        break;

      case "FORCE_APPROVE":
        // 3. Add rules: FORCE_APPROVE -> bypasses audit
        if (language) {
          await this.blackboard.atomicUpdate(`edition.${language}`, (current: any) => ({
            ...current,
            status: 'APPROVED',
            audit_results: { ...current?.audit_results, overall_score: 100, forced: true }
          }), 'manual_override')
        }
        break;

      case "FORCE_REGENERATE":
        // Forces reroute to generation phase
        if (language) {
          await this.blackboard.atomicUpdate(`edition.${language}`, (current: any) => ({
            ...current,
            status: 'PENDING',
            stale: true
          }), 'manual_override')
        }
        break;

      case "BYPASS_CELL":
        // 3. Add rules: BYPASS_CELL -> skips specific cell
        if (language && target_cells) {
          for (const cell of target_cells) {
            await this.blackboard.write(`cell_view.${language}.${cell}.bypass`, true, 'manual_override')
          }
        }
        break;
    }
  }

  /**
   * 4. Add UI/API support: Audit trail view
   */
  public getAuditTrail(mic_id?: string): ManualOverride[] {
    if (mic_id) {
      return this.overrideLog.filter(o => o.mic_id === mic_id)
    }
    return [...this.overrideLog]
  }

  private generateUUID(): string {
    return 'ovr-' + Math.random().toString(36).substr(2, 9)
  }
}

export const getManualOverrideManager = () => ManualOverrideManager.getInstance()
